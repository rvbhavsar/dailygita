import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { favorites } from '@/db/schema';
import { toFavorite } from '@/lib/serialize';
import { withAuth } from '@/lib/session';

const bodySchema = z.object({
  chapter_number: z.number().int().positive(),
  verse_number: z.number().int().positive(),
});

export const GET = withAuth(async (session) => {
  const rows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, session.id))
    .orderBy(desc(favorites.createdAt));

  return Response.json(rows.map(toFavorite));
});

export const POST = withAuth(async (session, request: Request) => {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid verse reference' }, { status: 400 });
  }

  const [row] = await db
    .insert(favorites)
    .values({
      userId: session.id,
      chapterNumber: parsed.data.chapter_number,
      verseNumber: parsed.data.verse_number,
    })
    .onConflictDoNothing()
    .returning();

  // Already favorited — return the existing row rather than erroring.
  if (!row) {
    const [existing] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, session.id),
          eq(favorites.chapterNumber, parsed.data.chapter_number),
          eq(favorites.verseNumber, parsed.data.verse_number),
        ),
      );
    return Response.json(toFavorite(existing));
  }

  return Response.json(toFavorite(row), { status: 201 });
});
