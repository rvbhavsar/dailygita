import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { favorites } from '@/db/schema';
import { withAuth } from '@/lib/session';

export const DELETE = withAuth(
  async (session, _request: Request, ctx: { params: Promise<{ chapter: string; verse: string }> }) => {
    const { chapter, verse } = await ctx.params;

    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, session.id),
          eq(favorites.chapterNumber, Number(chapter)),
          eq(favorites.verseNumber, Number(verse)),
        ),
      );

    return Response.json({ ok: true });
  },
);
