// Registers the authentic Sanskrit recitation that ships with the gita/gita
// dataset — one mp3 per verse, hotlinked, no generation and no storage cost.
// Deepgram narrates the English separately; it has no Sanskrit voice.
import { sql } from 'drizzle-orm';
import { verses, verseAudio } from './schema';
import { db, sql as pg } from './index';

const RECITATION_BASE =
  'https://raw.githubusercontent.com/gita/gita/main/data/verse_recitation';

const rows = await db
  .select({ chapter: verses.chapterNumber, verse: verses.verseNumber })
  .from(verses);

if (rows.length === 0) {
  console.error('No verses found — run `npm run seed` first.');
  process.exit(1);
}

await db
  .insert(verseAudio)
  .values(
    rows.map((v) => ({
      chapterNumber: v.chapter,
      verseNumber: v.verse,
      kind: 'recitation',
      url: `${RECITATION_BASE}/${v.chapter}/${v.verse}.mp3`,
    })),
  )
  .onConflictDoUpdate({
    target: [verseAudio.chapterNumber, verseAudio.verseNumber, verseAudio.kind],
    set: { url: sql`excluded.url` },
  });

console.log(`registered recitation audio for ${rows.length} verses`);
await pg.end();
