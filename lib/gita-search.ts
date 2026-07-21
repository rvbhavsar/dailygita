import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { translations, verses } from '@/db/schema';

export interface RetrievedVerse {
  chapter: number;
  verse: number;
  sanskrit: string;
  translation: string;
}

/**
 * Looks up specific verses by chapter/verse reference.
 *
 * The chat agent needs this because a follow-up like "say more about that
 * second verse" points at a reference the *agent itself* gave in an earlier
 * turn — there are no searchable words to recover it, so it has to be pulled by
 * citation, not by full-text search.
 */
export async function getVersesByRef(
  refs: { chapter: number; verse: number }[],
): Promise<RetrievedVerse[]> {
  if (refs.length === 0) return [];

  const ids = refs.map((r) => r.chapter * 1000 + r.verse);
  const rows = await db
    .select({
      chapter: verses.chapterNumber,
      verse: verses.verseNumber,
      sanskrit: verses.text,
      translation: translations.description,
    })
    .from(verses)
    .innerJoin(
      translations,
      and(eq(translations.verseId, verses.verseId), eq(translations.language, 'english')),
    )
    .where(inArray(sql`${verses.chapterNumber} * 1000 + ${verses.verseNumber}`, ids));

  // Several English translations per verse; keep the first of each.
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = `${r.chapter}-${r.verse}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Pulls "Chapter X, Verse Y" / "X.Y" / "X:Y" references out of free text. */
export function extractRefs(text: string): { chapter: number; verse: number }[] {
  const refs: { chapter: number; verse: number }[] = [];
  const patterns = [
    /chapter\s+(\d{1,2})\s*,?\s*verse\s+(\d{1,3})/gi,
    /\b(\d{1,2})[.:](\d{1,3})\b/g,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const chapter = Number(m[1]);
      const verse = Number(m[2]);
      if (chapter >= 1 && chapter <= 18 && verse >= 1) refs.push({ chapter, verse });
    }
  }
  return refs;
}

// Common words carry no signal and, being stopwords, make Postgres emit an
// empty-tsquery notice when they end up alone in the query.
const STOPWORDS = new Set([
  'the','and','but','for','with','that','this','they','them','their','from','have','has','had',
  'what','when','where','which','who','why','how','are','was','were','been','being','you','your',
  'yours','about','into','than','then','there','these','those','some','any','all','can','could',
  'should','would','will','shall','may','might','must','not','its','it','a','i','me','my','mine',
  'am','is','be','do','does','did','of','on','in','to','at','by','or','if','so','as','we','us',
  'our','he','him','his','she','her','hers','feel','feeling','really','just','like','know','think',
]);

/**
 * Turns a sentence into a safe OR-ed tsquery: 'anger | judgment | clouded'.
 * Everything non-alphanumeric is stripped rather than escaped — the input is a
 * person's free text, and tsquery operators inside it are a syntax error.
 */
function toOrTerms(query: string): string | null {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  // Cap the term count so one long message can't build a pathological query.
  const unique = [...new Set(terms)].slice(0, 20);
  return unique.length ? unique.join(' | ') : null;
}

/**
 * Full-text search over the verse_search materialized view, returning the
 * verses most relevant to what the reader raised.
 *
 * This exists so the chat agent quotes scripture we actually hold rather than
 * scripture it half-remembers. A model asked to cite the Gita from its own
 * weights will confidently produce chapter/verse numbers that don't say what it
 * claims — in a devotional app that is the worst possible failure. Everything
 * the agent cites has to come from here.
 *
 * Ranking runs against a weighted, aggregated document per verse (all
 * translations + word-by-word meanings + chapter summary; see the migration),
 * scored with ts_rank_cd so proximity and source weight both count. The single
 * best-matching translation is returned alongside for the agent to quote — the
 * aggregated blob would be unwieldy to cite.
 *
 * Terms are OR-ed and the weighted rank discriminates. The obvious choices —
 * websearch_to_tsquery and plainto_tsquery — both AND every term, which means a
 * whole conversational sentence only matches a document containing every one of
 * its words. In practice that returned nothing at all for real questions.
 */
export async function searchVerses(query: string, limit = 8): Promise<RetrievedVerse[]> {
  const terms = toOrTerms(query);
  if (!terms) return [];

  const rows = await db.execute<{
    chapter_number: number;
    verse_number: number;
    sanskrit: string;
    description: string;
  }>(sql`
    SELECT vs.chapter_number, vs.verse_number, vs.sanskrit, best.description
      FROM verse_search vs
      CROSS JOIN LATERAL (
        SELECT t.description
          FROM translations t
         WHERE t.verse_id = vs.verse_id AND t.language = 'english'
         ORDER BY ts_rank(to_tsvector('english', t.description),
                          to_tsquery('english', ${terms})) DESC
         LIMIT 1
      ) best
     WHERE vs.search_vector @@ to_tsquery('english', ${terms})
     ORDER BY ts_rank_cd(vs.search_vector, to_tsquery('english', ${terms}), 32) DESC
     LIMIT ${limit}
  `);

  return rows.map((r) => ({
    chapter: r.chapter_number,
    verse: r.verse_number,
    sanskrit: r.sanskrit,
    translation: r.description,
  }));
}
