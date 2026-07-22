import { isNotNull, sql } from 'drizzle-orm';
import { db, sql as pg } from '@/db';
import { verseChallenges } from '@/db/schema';
import { env } from '@/lib/env';

/**
 * AI-tags every verse with the human life-themes it speaks to, so retrieval can
 * bridge a reader's plain words ("I'm afraid") to a verse whose translation
 * uses none of them ("faint-heartedness"). Writes challenges, keywords and a
 * one-line summary into verse_challenges — filling that table (previously empty)
 * and feeding the verse_search view.
 *
 * Batched (fewer calls), resumable (skips already-tagged verses), and defensive
 * about the model's JSON. Re-run safely: it picks up where it left off.
 *
 *   npx tsx --env-file=.env.local scripts/enrich-verses.ts
 */

const META_API_URL = 'https://api.meta.ai/v1/chat/completions';
const MODEL = 'muse-spark-1.1';
const BATCH_SIZE = 5;
const CONCURRENCY = 5;

const CHALLENGE_IDS = [
  'stress-anxiety',
  'decision-making',
  'discipline-consistency',
  'focus-distraction',
  'purpose-motivation',
  'relationships',
  'leadership',
  'fear-doubt',
] as const;

interface VerseRow {
  chapter: number;
  verse: number;
  english: string;
}

interface Enrichment {
  challenges: string[];
  keywords: string;
  summary: string;
}

function buildPrompt(batch: VerseRow[]): string {
  return [
    'You are tagging Bhagavad Gita verses for a search-and-guidance app. For each',
    'verse, identify the human life-themes it speaks to.',
    '',
    'Return ONLY a JSON object keyed by the verse ref (e.g. "2-3"). For each ref:',
    `- "challenges": array of zero or more ids, ONLY from this set, only where genuinely relevant: ${CHALLENGE_IDS.join(', ')}`,
    '- "keywords": 8 to 15 lowercase everyday words, comma-separated, that a person',
    '  might use when this theme is on their mind — emotions, situations, synonyms.',
    '  Plain modern English only. No Sanskrit, no proper nouns, no verse numbers.',
    '- "summary": one plain sentence naming the life theme, no scripture citation.',
    '',
    'Verses:',
    ...batch.map((v) => `[${v.chapter}-${v.verse}] ${v.english}`),
    '',
    'Return ONLY the JSON object, no markdown fence, no commentary.',
  ].join('\n');
}

function parseBatch(content: string): Record<string, Enrichment> | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return typeof parsed === 'object' && parsed ? parsed : null;
  } catch {
    return null;
  }
}

async function callMeta(prompt: string): Promise<string> {
  const response = await fetch(META_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.META_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Meta ${response.status}: ${await response.text().catch(() => '')}`);
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('empty response');
  return content;
}

function normalize(raw: Enrichment | undefined): Enrichment | null {
  if (!raw) return null;
  const challenges = Array.isArray(raw.challenges)
    ? raw.challenges.filter((c) => (CHALLENGE_IDS as readonly string[]).includes(c))
    : [];
  // The model returns keywords as a comma-string sometimes and a JSON array
  // other times — accept both and store a flat comma-separated string.
  const keywords = Array.isArray(raw.keywords)
    ? (raw.keywords as string[]).map((k) => String(k).trim()).filter(Boolean).join(', ')
    : typeof raw.keywords === 'string'
      ? raw.keywords.trim()
      : '';
  const summary = typeof raw.summary === 'string' ? raw.summary.trim() : '';
  if (!keywords && !summary && challenges.length === 0) return null;
  return { challenges, keywords, summary };
}

async function processBatch(batch: VerseRow[]): Promise<number> {
  let content: string;
  try {
    content = await callMeta(buildPrompt(batch));
  } catch (err) {
    console.warn(`  batch [${batch[0].chapter}-${batch[0].verse}...] failed: ${(err as Error).message}`);
    return 0;
  }

  const parsed = parseBatch(content);
  if (!parsed) {
    console.warn(`  batch [${batch[0].chapter}-${batch[0].verse}...] unparseable`);
    return 0;
  }

  let written = 0;
  for (const v of batch) {
    const e = normalize(parsed[`${v.chapter}-${v.verse}`]);
    if (!e) continue;
    await db
      .insert(verseChallenges)
      .values({
        chapterNumber: v.chapter,
        verseNumber: v.verse,
        challenges: e.challenges,
        keywords: e.keywords,
        aiSummary: e.summary,
      })
      .onConflictDoUpdate({
        target: [verseChallenges.chapterNumber, verseChallenges.verseNumber],
        set: { challenges: e.challenges, keywords: e.keywords, aiSummary: e.summary },
      });
    written += 1;
  }
  return written;
}

async function main() {
  // Resumable: skip verses already tagged with keywords.
  const done = await db
    .select({ c: verseChallenges.chapterNumber, v: verseChallenges.verseNumber })
    .from(verseChallenges)
    .where(isNotNull(verseChallenges.keywords));
  const doneSet = new Set(done.map((r) => `${r.c}-${r.v}`));

  // Raw SQL for the per-verse best translation: Drizzle mis-binds a correlated
  // column reference inside a nested sql fragment (it returned one global row
  // for every verse), so this uses db.execute with the correlation written out.
  const raw = await db.execute<{ chapter_number: number; verse_number: number; english: string }>(sql`
    SELECT v.chapter_number, v.verse_number,
           (SELECT t.description FROM translations t
             WHERE t.verse_id = v.verse_id AND t.language = 'english'
             ORDER BY length(t.description) DESC LIMIT 1) AS english
      FROM verses v
     ORDER BY v.chapter_number, v.verse_number
  `);

  const todo: VerseRow[] = raw
    .filter((r) => r.english && !doneSet.has(`${r.chapter_number}-${r.verse_number}`))
    .map((r) => ({ chapter: r.chapter_number, verse: r.verse_number, english: r.english }));
  console.log(`${raw.length} verses, ${doneSet.size} already done, ${todo.length} to enrich`);

  const batches: VerseRow[][] = [];
  for (let i = 0; i < todo.length; i += BATCH_SIZE) batches.push(todo.slice(i, i + BATCH_SIZE));

  let written = 0;
  let processed = 0;
  // Fixed-size worker pool over the batch queue.
  let cursor = 0;
  const worker = async () => {
    while (cursor < batches.length) {
      const batch = batches[cursor++];
      written += await processBatch(batch);
      processed += 1;
      if (processed % 10 === 0 || cursor >= batches.length) {
        console.log(`  ${processed}/${batches.length} batches, ${written} verses written`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  await pg`REFRESH MATERIALIZED VIEW verse_search`;
  console.log(`done: ${written} verses enriched, verse_search refreshed`);
  await pg.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
