import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { verses } from '@/db/schema';
import { toVerse } from '@/lib/serialize';

export async function GET() {
  const rows = await db
    .select()
    .from(verses)
    .orderBy(asc(verses.chapterNumber), asc(verses.verseNumber));

  return Response.json(rows.map(toVerse));
}
