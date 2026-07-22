import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { searchVerses, getVersesByRef, type RetrievedVerse } from './gita-search';
import { challenges } from '@/data/challenges';

/**
 * The tools the MCP connector exposes. Deliberately retrieval-only: the moat is
 * grounding a caller's own agent in the real, enriched 701-verse corpus so it
 * stops hallucinating chapter/verse citations. The consuming (usually stronger)
 * model does the explaining — we just hand it the right scripture.
 */

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<string>;
}

const CHALLENGE_IDS: string[] = challenges.map((c) => c.id);

function renderVerse(v: RetrievedVerse): string {
  return `Bhagavad Gita ${v.chapter}.${v.verse}\nSanskrit: ${v.sanskrit.replace(/\n/g, ' ').trim()}\nTranslation: ${v.translation.trim()}`;
}

function renderVerses(verses: RetrievedVerse[], emptyNote: string): string {
  if (verses.length === 0) return emptyNote;
  return verses.map(renderVerse).join('\n\n');
}

export const TOOLS: McpTool[] = [
  {
    name: 'search_verses',
    description:
      'Search the Bhagavad Gita for verses relevant to a question, theme, feeling, or situation described in plain language. Returns matching verses with their Sanskrit and English translation. Use this to ground any answer about the Gita in real, citable verses instead of recalling them from memory.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'A question, theme, feeling, or situation, in plain language.',
        },
        limit: {
          type: 'integer',
          description: 'Maximum verses to return (1–15, default 8).',
          minimum: 1,
          maximum: 15,
        },
      },
      required: ['query'],
    },
    handler: async (args) => {
      const query = String(args.query ?? '').trim();
      if (!query) throw new Error('query is required');
      const limit = Math.min(15, Math.max(1, Number(args.limit) || 8));
      const verses = await searchVerses(query, limit);
      return renderVerses(
        verses,
        'No verses matched. Try rephrasing the theme or feeling in different words.',
      );
    },
  },
  {
    name: 'get_verse',
    description:
      'Fetch a specific Bhagavad Gita verse by chapter and verse number, with its Sanskrit and English translation.',
    inputSchema: {
      type: 'object',
      properties: {
        chapter: { type: 'integer', description: 'Chapter number (1–18).', minimum: 1, maximum: 18 },
        verse: { type: 'integer', description: 'Verse number within the chapter.', minimum: 1 },
      },
      required: ['chapter', 'verse'],
    },
    handler: async (args) => {
      const chapter = Number(args.chapter);
      const verse = Number(args.verse);
      if (!Number.isInteger(chapter) || !Number.isInteger(verse)) {
        throw new Error('chapter and verse must be integers');
      }
      const verses = await getVersesByRef([{ chapter, verse }]);
      return renderVerses(verses, `No verse found at ${chapter}.${verse}.`);
    },
  },
  {
    name: 'list_life_challenges',
    description:
      'List the life challenges the Bhagavad Gita content is organized around (e.g. stress & anxiety, decision making, fear & doubt). Use the returned ids with get_verses_for_challenge.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () =>
      challenges.map((c) => `- ${c.id}: ${c.label} — ${c.description}`).join('\n'),
  },
  {
    name: 'get_verses_for_challenge',
    description:
      'Get Bhagavad Gita verses tagged to a specific life challenge. Call list_life_challenges first for valid ids.',
    inputSchema: {
      type: 'object',
      properties: {
        challenge: {
          type: 'string',
          description: `One of: ${CHALLENGE_IDS.join(', ')}.`,
          enum: CHALLENGE_IDS,
        },
        limit: {
          type: 'integer',
          description: 'Maximum verses to return (1–25, default 12).',
          minimum: 1,
          maximum: 25,
        },
      },
      required: ['challenge'],
    },
    handler: async (args) => {
      const challenge = String(args.challenge ?? '').trim();
      if (!CHALLENGE_IDS.includes(challenge)) {
        throw new Error(`Unknown challenge. Valid ids: ${CHALLENGE_IDS.join(', ')}`);
      }
      const limit = Math.min(25, Math.max(1, Number(args.limit) || 12));
      const rows = await db.execute<{
        chapter: number;
        verse: number;
        sanskrit: string;
        description: string;
      }>(sql`
        SELECT v.chapter_number AS chapter, v.verse_number AS verse, v.text AS sanskrit,
               (SELECT t.description FROM translations t
                 WHERE t.verse_id = v.verse_id AND t.language = 'english'
                 ORDER BY length(t.description) DESC LIMIT 1) AS description
          FROM verse_challenges vc
          JOIN verses v ON v.chapter_number = vc.chapter_number AND v.verse_number = vc.verse_number
         WHERE ${challenge} = ANY(vc.challenges)
         ORDER BY v.chapter_number, v.verse_number
         LIMIT ${limit}
      `);
      return renderVerses(
        rows.map((r) => ({
          chapter: r.chapter,
          verse: r.verse,
          sanskrit: r.sanskrit,
          translation: r.description ?? '',
        })),
        `No verses tagged to "${challenge}".`,
      );
    },
  },
];

export const TOOLS_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));
