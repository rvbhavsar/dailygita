import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { toProfile } from '@/lib/serialize';
import { withAuth } from '@/lib/session';

const onboardingSchema = z.object({
  display_name: z.string().trim().min(1),
  selected_challenges: z.array(z.string()).min(1),
  daily_verse_enabled: z.boolean(),
});

export const POST = withAuth(async (session, request: Request) => {
  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
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
    .where(eq(profiles.userId, session.id))
    .returning();

  if (!row) return Response.json({ error: 'Profile not found' }, { status: 404 });
  return Response.json(toProfile(row));
});
