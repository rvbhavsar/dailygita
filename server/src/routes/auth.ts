import { randomBytes, createHash } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { passwordResets, profiles, users } from '../db/schema.js';
import { sendPasswordResetEmail } from '../lib/email.js';
import { env } from '../lib/env.js';
import { clearAuthCookie, setAuthCookie } from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { currentUser, requireAuth } from '../middleware/requireAuth.js';
import { toProfile, toUser } from '../lib/serialize.js';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).optional(),
  age: z.number().int().positive().max(120).optional(),
  profession: z.string().trim().optional(),
  maritalStatus: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth/signup', async (request, reply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0].message });
    }
    const { email, password, displayName, age, profession, maritalStatus } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });
    if (existing) {
      return reply.code(409).send({ error: 'An account with that email already exists' });
    }

    const passwordHash = await hashPassword(password);

    // One transaction, replacing Supabase's handle_new_user() trigger. A partial
    // signup would leave a loginable user with no profile, which black-holes
    // the onboarding route guard.
    const created = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ email: normalizedEmail, passwordHash })
        .returning();

      const [profile] = await tx
        .insert(profiles)
        .values({
          userId: user.id,
          displayName: displayName ?? null,
          age: age ?? null,
          profession: profession ?? null,
          maritalStatus: maritalStatus ?? null,
        })
        .returning();

      return { user, profile };
    });

    setAuthCookie(reply, { sub: created.user.id, email: created.user.email });
    return reply.code(201).send({ user: toUser(created.user), profile: toProfile(created.profile) });
  });

  app.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid email or password' });
    }
    const normalizedEmail = parsed.data.email.toLowerCase();

    const user = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) });
    // Identical response on both branches so the endpoint can't enumerate accounts.
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });
    if (!profile) return reply.code(500).send({ error: 'Account is missing a profile' });

    setAuthCookie(reply, { sub: user.id, email: user.email });
    return { user: toUser(user), profile: toProfile(profile) };
  });

  app.post('/auth/logout', async (_request, reply) => {
    clearAuthCookie(reply);
    return { ok: true };
  });

  app.get('/auth/me', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = currentUser(request);

    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, id) });
    if (!user || !profile) {
      clearAuthCookie(reply);
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    return { user: toUser(user), profile: toProfile(profile) };
  });

  app.post('/auth/password/reset-request', async (request, reply) => {
    const parsed = z.object({ email: z.string().email() }).safeParse(request.body);
    // Always 200, regardless of whether the address exists.
    if (!parsed.success) return { ok: true };

    const user = await db.query.users.findFirst({
      where: eq(users.email, parsed.data.email.toLowerCase()),
    });

    if (user) {
      const token = randomBytes(32).toString('hex');
      await db.insert(passwordResets).values({
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      await sendPasswordResetEmail(user.email, `${env.APP_URL}/auth?mode=reset&token=${token}`);
    }

    return reply.send({ ok: true });
  });

  app.post('/auth/password/reset-confirm', async (request, reply) => {
    const parsed = z
      .object({ token: z.string().min(1), password: z.string().min(8) })
      .safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Password must be at least 8 characters' });
    }

    const record = await db.query.passwordResets.findFirst({
      where: and(
        eq(passwordResets.tokenHash, hashToken(parsed.data.token)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
      ),
    });
    if (!record) {
      return reply.code(400).send({ error: 'That reset link is invalid or has expired' });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await db.transaction(async (tx) => {
      await tx.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
      await tx
        .update(passwordResets)
        .set({ usedAt: new Date() })
        .where(eq(passwordResets.tokenHash, record.tokenHash));
    });

    return { ok: true };
  });

  app.patch('/auth/password', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = z
      .object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })
      .safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'New password must be at least 8 characters' });
    }

    const { id } = currentUser(request);
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return reply.code(401).send({ error: 'Current password is incorrect' });
    }

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(parsed.data.newPassword) })
      .where(eq(users.id, id));

    return { ok: true };
  });
}
