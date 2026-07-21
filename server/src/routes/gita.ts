import { and, asc, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { chapters, translations, verseAudio, verseChallenges, verses } from '../db/schema.js';
import {
  toChapter,
  toTranslation,
  toVerse,
  toVerseChallenge,
} from '../lib/serialize.js';

// Scripture is public content — these routes intentionally require no auth.
export default async function gitaRoutes(app: FastifyInstance) {
  app.get('/chapters', async () => {
    const rows = await db.select().from(chapters).orderBy(asc(chapters.chapterNumber));
    return rows.map(toChapter);
  });

  app.get('/verses', async () => {
    const rows = await db
      .select()
      .from(verses)
      .orderBy(asc(verses.chapterNumber), asc(verses.verseNumber));
    return rows.map(toVerse);
  });

  app.get('/translations', async () => {
    const rows = await db.select().from(translations);
    return rows.map(toTranslation);
  });

  app.get<{ Params: { n: string } }>('/chapters/:n/verses', async (request) => {
    const rows = await db
      .select()
      .from(verses)
      .where(eq(verses.chapterNumber, Number(request.params.n)))
      .orderBy(asc(verses.verseNumber));
    return rows.map(toVerse);
  });

  app.get<{ Params: { c: string; v: string } }>('/verses/:c/:v', async (request, reply) => {
    const [row] = await db
      .select()
      .from(verses)
      .where(
        and(
          eq(verses.chapterNumber, Number(request.params.c)),
          eq(verses.verseNumber, Number(request.params.v)),
        ),
      )
      .limit(1);

    if (!row) return reply.code(404).send({ error: 'Verse not found' });
    return toVerse(row);
  });

  app.get<{ Params: { verseId: string } }>('/verses/:verseId/translations', async (request) => {
    const rows = await db
      .select()
      .from(translations)
      .where(eq(translations.verseId, Number(request.params.verseId)));
    return rows.map(toTranslation);
  });

  app.get('/verse-challenges', async () => {
    const rows = await db.select().from(verseChallenges);
    return rows.map(toVerseChallenge);
  });

  app.get<{ Params: { c: string; v: string } }>('/verses/:c/:v/audio', async (request) => {
    const rows = await db
      .select()
      .from(verseAudio)
      .where(
        and(
          eq(verseAudio.chapterNumber, Number(request.params.c)),
          eq(verseAudio.verseNumber, Number(request.params.v)),
        ),
      );

    return {
      recitation: rows.find((r) => r.kind === 'recitation')?.url ?? null,
      narration: rows.find((r) => r.kind === 'narration')?.url ?? null,
    };
  });
}
