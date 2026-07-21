// Port of the old seed-gita-data edge function. Idempotent: safe to re-run.
import { sql } from 'drizzle-orm';
import { chapters, translations, verses } from './schema';
import { db, sql as pg } from './index';

const BASE = 'https://raw.githubusercontent.com/gita/gita/main/data';

interface RawChapter {
  chapter_number: number;
  name: string;
  name_transliterated: string | null;
  name_translation: string | null;
  verses_count: number;
  chapter_summary: string | null;
  chapter_summary_hindi: string | null;
}

interface RawVerse {
  id: number;
  chapter_number: number;
  verse_number: number;
  text: string;
  transliteration: string | null;
  word_meanings: string | null;
}

interface RawTranslation {
  verse_id: number;
  authorName: string;
  lang: string;
  description: string;
}

async function fetchJson<T>(file: string): Promise<T> {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
  return res.json() as Promise<T>;
}

// postgres.js has a bind-parameter ceiling; insert in chunks.
async function inChunks<T>(rows: T[], size: number, fn: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += size) {
    await fn(rows.slice(i, i + size));
  }
}

const [rawChapters, rawVerses, rawTranslations] = await Promise.all([
  fetchJson<RawChapter[]>('chapters.json'),
  fetchJson<RawVerse[]>('verse.json'),
  fetchJson<RawTranslation[]>('translation.json'),
]);

console.log(
  `fetched ${rawChapters.length} chapters, ${rawVerses.length} verses, ${rawTranslations.length} translations`,
);

await db
  .insert(chapters)
  .values(
    rawChapters.map((c) => ({
      chapterNumber: c.chapter_number,
      name: c.name,
      nameTransliterated: c.name_transliterated,
      nameTranslated: c.name_translation,
      versesCount: c.verses_count,
      chapterSummary: c.chapter_summary,
      chapterSummaryHindi: c.chapter_summary_hindi,
    })),
  )
  .onConflictDoUpdate({
    target: chapters.chapterNumber,
    set: {
      name: sql`excluded.name`,
      nameTransliterated: sql`excluded.name_transliterated`,
      nameTranslated: sql`excluded.name_translated`,
      versesCount: sql`excluded.verses_count`,
      chapterSummary: sql`excluded.chapter_summary`,
      chapterSummaryHindi: sql`excluded.chapter_summary_hindi`,
    },
  });
console.log('chapters seeded');

await inChunks(rawVerses, 500, (chunk) =>
  db
    .insert(verses)
    .values(
      chunk.map((v) => ({
        verseId: v.id,
        chapterNumber: v.chapter_number,
        verseNumber: v.verse_number,
        text: v.text,
        transliteration: v.transliteration,
        wordMeanings: v.word_meanings,
      })),
    )
    .onConflictDoUpdate({
      target: verses.verseId,
      set: {
        text: sql`excluded.text`,
        transliteration: sql`excluded.transliteration`,
        wordMeanings: sql`excluded.word_meanings`,
      },
    }),
);
console.log('verses seeded');

// Translations have no natural unique key in the source data, so replace wholesale.
await db.delete(translations);
await inChunks(rawTranslations, 500, (chunk) =>
  db.insert(translations).values(
    chunk.map((t) => ({
      verseId: t.verse_id,
      authorName: t.authorName,
      language: t.lang,
      description: t.description,
    })),
  ),
);
console.log('translations seeded');

await pg.end();
console.log('done');
