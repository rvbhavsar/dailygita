import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { verses } from '@/db/schema';
import { toVerse } from '@/lib/serialize';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chapter: string }> },
) {
  const { chapter } = await params;
  const rows = await db
    .select()
    .from(verses)
    .where(eq(verses.chapterNumber, Number(chapter)))
    .orderBy(asc(verses.verseNumber));

  return Response.json(rows.map(toVerse));
}
