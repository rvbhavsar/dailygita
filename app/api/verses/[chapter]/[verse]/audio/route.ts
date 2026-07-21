import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { verseAudio } from '@/db/schema';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chapter: string; verse: string }> },
) {
  const { chapter, verse } = await params;

  const rows = await db
    .select()
    .from(verseAudio)
    .where(
      and(
        eq(verseAudio.chapterNumber, Number(chapter)),
        eq(verseAudio.verseNumber, Number(verse)),
      ),
    );

  return Response.json({
    recitation: rows.find((r) => r.kind === 'recitation')?.url ?? null,
    narration: rows.find((r) => r.kind === 'narration')?.url ?? null,
  });
}
