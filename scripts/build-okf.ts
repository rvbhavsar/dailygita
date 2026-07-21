import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { asc, eq } from 'drizzle-orm';
import { db, sql as pg } from '@/db';
import { chapters, translations, verses } from '@/db/schema';
import { curatedVerses } from '@/data/curatedVerses';

/**
 * Builds an Open Knowledge Format bundle for the Bhagavad Gita from the
 * database. See okf/SPEC.md (github.com/GoogleCloudPlatform/knowledge-catalog).
 *
 * This is a DERIVED EXPORT, not the retrieval path. Chat retrieval reads
 * Postgres directly (lib/gita-search.ts); coupling it to these files would give
 * us two sources of truth and a regenerate-on-every-edit pipeline for no
 * accuracy gain. The bundle exists for what OKF is actually for: a portable,
 * human-readable, agent-parseable knowledge catalog — and as the surface that
 * AI-generated themes and cross-references will later populate.
 *
 * Regenerate with: npx tsx --env-file=.env.local scripts/build-okf.ts
 */

const OUT = join(process.cwd(), 'knowledge');

// Stable build stamp. A generator that stamped each file with the wall clock
// would rewrite all 700+ timestamps on every run and flood every diff.
const BUILD_DATE = '2026-07-21';

const pad = (n: number) => String(n).padStart(2, '0');
const verseRef = (c: number, v: number) => `Chapter ${c}, Verse ${v}`;
const versePath = (c: number, v: number) => `/verses/${pad(c)}/${pad(v)}.md`;
const chapterPath = (c: number) => `/chapters/${pad(c)}.md`;

// A concept description is one sentence. Take the first, and never let a runaway
// translation blow past a sane length.
function oneSentence(text: string, max = 200): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const end = flat.search(/[.!?](\s|$)/);
  const sentence = end === -1 ? flat : flat.slice(0, end + 1);
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}

function frontmatter(fields: Record<string, string | string[] | undefined>): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}: [${value.join(', ')}]`);
    } else {
      // Quote scalars — titles and descriptions carry colons and commas.
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const allChapters = await db.select().from(chapters).orderBy(asc(chapters.chapterNumber));
  const allVerses = await db
    .select()
    .from(verses)
    .orderBy(asc(verses.chapterNumber), asc(verses.verseNumber));

  // Curated challenge tags, keyed by "c-v". Only ~6 verses today; this is the
  // slot AI enrichment will fill for the rest.
  const tagsByRef = new Map<string, string[]>();
  for (const cv of curatedVerses) {
    if (cv.challenges?.length) tagsByRef.set(`${cv.chapter}-${cv.verse}`, cv.challenges);
  }

  const versesByChapter = new Map<number, typeof allVerses>();
  for (const v of allVerses) {
    const list = versesByChapter.get(v.chapterNumber) ?? [];
    list.push(v);
    versesByChapter.set(v.chapterNumber, list);
  }

  let fileCount = 0;
  const write = async (relPath: string, content: string) => {
    const full = join(OUT, relPath);
    await mkdir(join(full, '..'), { recursive: true });
    await writeFile(full, content.endsWith('\n') ? content : `${content}\n`);
    fileCount += 1;
  };

  // ── Verse concepts ────────────────────────────────────────────────────────
  for (const v of allVerses) {
    const ref = `${v.chapterNumber}-${v.verseNumber}`;
    const trans = await db
      .select({ author: translations.authorName, description: translations.description })
      .from(translations)
      .where(eq(translations.verseId, v.verseId));
    const english = trans.filter((t) => !/[ऀ-ॿ]/.test(t.description));
    const primary = english[0]?.description ?? '';
    const curated = curatedVerses.find((cv) => cv.id === ref);

    const chapterVerses = versesByChapter.get(v.chapterNumber) ?? [];
    const idx = chapterVerses.findIndex((x) => x.verseNumber === v.verseNumber);
    const prev = idx > 0 ? chapterVerses[idx - 1] : null;
    const next = idx < chapterVerses.length - 1 ? chapterVerses[idx + 1] : null;

    const body: string[] = [
      frontmatter({
        type: 'Gita Verse',
        title: verseRef(v.chapterNumber, v.verseNumber),
        description: primary ? oneSentence(primary) : undefined,
        resource: `/verse/${ref}`,
        tags: tagsByRef.get(ref),
        timestamp: `${BUILD_DATE}T00:00:00Z`,
      }),
      '',
      `# ${verseRef(v.chapterNumber, v.verseNumber)}`,
      '',
      `Part of [${allChapters.find((c) => c.chapterNumber === v.chapterNumber)?.nameTranslated ?? `Chapter ${v.chapterNumber}`}](${chapterPath(v.chapterNumber)}).`,
      '',
      '## Sanskrit',
      '',
      v.text.trim(),
    ];

    if (v.transliteration) body.push('', '## Transliteration', '', v.transliteration.trim());

    if (english.length) {
      body.push('', '## Translations', '');
      for (const t of english) body.push(`- *${t.author}*: ${t.description.trim()}`);
    }

    if (v.wordMeanings) body.push('', '## Word meanings', '', v.wordMeanings.trim());

    if (curated?.insight) {
      body.push('', '## Meaning', '', curated.insight.explanation.trim());
      if (curated.insight.takeaway) body.push('', `**Takeaway:** ${curated.insight.takeaway.trim()}`);
    }

    const related: string[] = [];
    if (prev) related.push(`[${verseRef(prev.chapterNumber, prev.verseNumber)}](${versePath(prev.chapterNumber, prev.verseNumber)})`);
    if (next) related.push(`[${verseRef(next.chapterNumber, next.verseNumber)}](${versePath(next.chapterNumber, next.verseNumber)})`);
    if (related.length) body.push('', '## Related', '', `Nearby: ${related.join(' · ')}`);

    await write(`verses/${pad(v.chapterNumber)}/${pad(v.verseNumber)}.md`, body.join('\n'));
  }

  // ── Per-chapter verse indexes ───────────────────────────────────────────────
  for (const c of allChapters) {
    const cv = versesByChapter.get(c.chapterNumber) ?? [];
    const lines = [`# ${c.nameTranslated ?? `Chapter ${c.chapterNumber}`} — verses`, ''];
    for (const v of cv) {
      const ref = `${v.chapterNumber}-${v.verseNumber}`;
      const t = await db
        .select({ description: translations.description })
        .from(translations)
        .where(eq(translations.verseId, v.verseId));
      const english = t.find((x) => !/[ऀ-ॿ]/.test(x.description));
      const desc = english ? ` - ${oneSentence(english.description, 90)}` : '';
      lines.push(`* [${verseRef(v.chapterNumber, v.verseNumber)}](${versePath(v.chapterNumber, v.verseNumber)})${desc}`);
    }
    await write(`verses/${pad(c.chapterNumber)}/index.md`, lines.join('\n'));
  }

  // ── Chapter concepts ────────────────────────────────────────────────────────
  for (const c of allChapters) {
    const cv = versesByChapter.get(c.chapterNumber) ?? [];
    const title = c.nameTranslated
      ? `Chapter ${c.chapterNumber}: ${c.nameTranslated}`
      : `Chapter ${c.chapterNumber}`;
    const body = [
      frontmatter({
        type: 'Gita Chapter',
        title,
        description: c.chapterSummary ? oneSentence(c.chapterSummary) : undefined,
        resource: `/browse?chapter=${c.chapterNumber}`,
        tags: c.nameTransliterated ? [c.nameTransliterated] : undefined,
        timestamp: `${BUILD_DATE}T00:00:00Z`,
      }),
      '',
      `# ${title}`,
      '',
      c.nameTransliterated ? `*${c.nameTransliterated}* — ${cv.length} verses.` : `${cv.length} verses.`,
    ];
    if (c.chapterSummary) body.push('', '## Summary', '', c.chapterSummary.trim());
    body.push('', '## Verses', '', `See the [verse index](/verses/${pad(c.chapterNumber)}/index.md) for all ${cv.length} verses.`);
    await write(`chapters/${pad(c.chapterNumber)}.md`, body.join('\n'));
  }

  // ── Chapter index ───────────────────────────────────────────────────────────
  const chIndex = ['# Chapters', ''];
  for (const c of allChapters) {
    const desc = c.chapterSummary ? ` - ${oneSentence(c.chapterSummary, 90)}` : '';
    const name = c.nameTranslated ? `Chapter ${c.chapterNumber}: ${c.nameTranslated}` : `Chapter ${c.chapterNumber}`;
    chIndex.push(`* [${name}](${chapterPath(c.chapterNumber)})${desc}`);
  }
  await write('chapters/index.md', chIndex.join('\n'));

  // ── Root index and log ──────────────────────────────────────────────────────
  await write(
    'index.md',
    [
      '# Bhagavad Gita — Knowledge Bundle',
      '',
      'An Open Knowledge Format bundle of all 18 chapters and 701 verses of the',
      'Bhagavad Gita: Sanskrit, transliteration, word-by-word meanings, and',
      'multiple English translations, one concept per verse.',
      '',
      '## Contents',
      '',
      '* [Chapters](/chapters/index.md) - all 18 chapters with summaries',
      `* [Verses](/verses/01/index.md) - ${allVerses.length} verse concepts, organized by chapter`,
      '',
      '## Changes',
      '',
      '* [Log](/log.md) - history of updates to this bundle',
    ].join('\n'),
  );

  await write(
    'log.md',
    [
      '# Log',
      '',
      `## ${BUILD_DATE}`,
      `* **Creation**: Generated the initial bundle — ${allChapters.length} chapters and ${allVerses.length} verses from the source database.`,
    ].join('\n'),
  );

  console.log(`OKF bundle written to ${OUT} (${fileCount} files)`);
  await pg.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
