import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { savedInsights } from '@/db/schema';
import { toSavedInsight } from '@/lib/serialize';
import { withAuth } from '@/lib/session';

const saveSchema = z.object({
  verse_id: z.string().min(1),
  chapter_number: z.number().int().positive(),
  verse_number: z.number().int().positive(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  challenge_id: z.string().nullable().optional(),
});

export const GET = withAuth(async (session) => {
  const rows = await db
    .select()
    .from(savedInsights)
    .where(eq(savedInsights.userId, session.id))
    .orderBy(desc(savedInsights.createdAt));

  return Response.json(rows.map(toSavedInsight));
});

export const POST = withAuth(async (session, request: Request) => {
  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [row] = await db
    .insert(savedInsights)
    .values({
      userId: session.id,
      verseId: parsed.data.verse_id,
      chapterNumber: parsed.data.chapter_number,
      verseNumber: parsed.data.verse_number,
      title: parsed.data.title,
      description: parsed.data.description,
      challengeId: parsed.data.challenge_id ?? null,
    })
    .returning();

  return Response.json(toSavedInsight(row), { status: 201 });
});
