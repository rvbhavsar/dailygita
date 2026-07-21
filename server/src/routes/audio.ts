import { and, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { verseAudio } from '../db/schema.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { TtsError, buildNarration, isTtsConfigured, synthesizeNarration } from '../lib/tts.js';

const bodySchema = z.object({
  english: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  takeaway: z.string().nullable().optional(),
});

export default async function audioRoutes(app: FastifyInstance) {
  // Generation costs money per call, so it stays behind auth.
  app.post<{ Params: { c: string; v: string } }>(
    '/verses/:c/:v/narration',
    { preHandler: requireAuth },
    async (request, reply) => {
      if (!isTtsConfigured()) {
        return reply.code(501).send({ error: 'Narration is not configured' });
      }

      const parsed = bodySchema.safeParse(request.body ?? {});
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid narration payload' });

      const chapter = Number(request.params.c);
      const verse = Number(request.params.v);
      if (!Number.isInteger(chapter) || !Number.isInteger(verse)) {
        return reply.code(400).send({ error: 'Invalid verse reference' });
      }

      // Serve the cached file rather than paying Deepgram twice.
      const [existing] = await db
        .select()
        .from(verseAudio)
        .where(
          and(
            eq(verseAudio.chapterNumber, chapter),
            eq(verseAudio.verseNumber, verse),
            eq(verseAudio.kind, 'narration'),
          ),
        )
        .limit(1);

      if (existing) return { url: existing.url };

      try {
        const url = await synthesizeNarration(chapter, verse, buildNarration(parsed.data));

        await db
          .insert(verseAudio)
          .values({ chapterNumber: chapter, verseNumber: verse, kind: 'narration', url })
          .onConflictDoUpdate({
            target: [verseAudio.chapterNumber, verseAudio.verseNumber, verseAudio.kind],
            set: { url: sql`excluded.url` },
          });

        return { url };
      } catch (error) {
        if (error instanceof TtsError) {
          return reply.code(error.status).send({ error: error.message });
        }
        request.log.error(error);
        return reply.code(502).send({ error: 'Could not generate audio right now' });
      }
    },
  );
}
