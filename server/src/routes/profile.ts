import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { profiles } from '../db/schema.js';
import { currentUser, requireAuth } from '../middleware/requireAuth.js';
import { toProfile } from '../lib/serialize.js';

// Accepts the snake_case shape the client already sends. user_id is deliberately
// absent — ownership comes from the JWT, never the request body.
const updateSchema = z.object({
  display_name: z.string().trim().min(1).optional(),
  avatar_url: z.string().url().nullable().optional(),
  daily_verse_enabled: z.boolean().optional(),
  age: z.number().int().positive().max(120).nullable().optional(),
  profession: z.string().trim().nullable().optional(),
  marital_status: z.string().trim().nullable().optional(),
  selected_challenges: z.array(z.string()).optional(),
});

const onboardingSchema = z.object({
  display_name: z.string().trim().min(1),
  selected_challenges: z.array(z.string()).min(1),
  daily_verse_enabled: z.boolean(),
});

export default async function profileRoutes(app: FastifyInstance) {
  app.patch('/profile', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0].message });
    }

    const b = parsed.data;
    const updates = {
      ...(b.display_name !== undefined && { displayName: b.display_name }),
      ...(b.avatar_url !== undefined && { avatarUrl: b.avatar_url }),
      ...(b.daily_verse_enabled !== undefined && { dailyVerseEnabled: b.daily_verse_enabled }),
      ...(b.age !== undefined && { age: b.age }),
      ...(b.profession !== undefined && { profession: b.profession }),
      ...(b.marital_status !== undefined && { maritalStatus: b.marital_status }),
      ...(b.selected_challenges !== undefined && { selectedChallenges: b.selected_challenges }),
      updatedAt: new Date(),
    };

    const [row] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.userId, currentUser(request).id))
      .returning();

    if (!row) return reply.code(404).send({ error: 'Profile not found' });
    return toProfile(row);
  });

  app.post('/profile/onboarding', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = onboardingSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0].message });
    }

    const [row] = await db
      .update(profiles)
      .set({
        displayName: parsed.data.display_name,
        selectedChallenges: parsed.data.selected_challenges,
        dailyVerseEnabled: parsed.data.daily_verse_enabled,
        isOnboarded: true,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, currentUser(request).id))
      .returning();

    if (!row) return reply.code(404).send({ error: 'Profile not found' });
    return toProfile(row);
  });
}
