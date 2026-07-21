import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { verses } from '@/db/schema';
import { toVerse } from '@/lib/serialize';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chapter: string; verse: string }> },
) {
  const { chapter, verse } = await params;

  const [row] = await db
    .select()
    .from(verses)
    .where(
      and(eq(verses.chapterNumber, Number(chapter)), eq(verses.verseNumber, Number(verse))),
    )
    .limit(1);

  if (!row) return Response.json({ error: 'Verse not found' }, { status: 404 });
  return Response.json(toVerse(row));
}
