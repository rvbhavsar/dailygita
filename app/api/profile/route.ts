import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { toProfile } from '@/lib/serialize';
import { withAuth } from '@/lib/session';

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

export const PATCH = withAuth(async (session, request: Request) => {
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const b = parsed.data;
  const [row] = await db
    .update(profiles)
    .set({
      ...(b.display_name !== undefined && { displayName: b.display_name }),
      ...(b.avatar_url !== undefined && { avatarUrl: b.avatar_url }),
      ...(b.daily_verse_enabled !== undefined && { dailyVerseEnabled: b.daily_verse_enabled }),
      ...(b.age !== undefined && { age: b.age }),
      ...(b.profession !== undefined && { profession: b.profession }),
      ...(b.marital_status !== undefined && { maritalStatus: b.marital_status }),
      ...(b.selected_challenges !== undefined && {
        selectedChallenges: b.selected_challenges,
      }),
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, session.id))
    .returning();

  if (!row) return Response.json({ error: 'Profile not found' }, { status: 404 });
  return Response.json(toProfile(row));
});
