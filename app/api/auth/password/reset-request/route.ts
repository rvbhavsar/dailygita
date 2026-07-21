import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { passwordResets, users } from '@/db/schema';
import { sendPasswordResetEmail } from '@/lib/email';
import { env } from '@/lib/env';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function POST(request: Request) {
  const parsed = z
    .object({ email: z.string().email() })
    .safeParse(await request.json().catch(() => null));

  // Always 200, regardless of whether the address exists.
  if (!parsed.success) return Response.json({ ok: true });

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

  return Response.json({ ok: true });
}
