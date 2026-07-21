import { and, desc, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { savedInsights } from '../db/schema.js';
import { currentUser, requireAuth } from '../middleware/requireAuth.js';
import { toSavedInsight } from '../lib/serialize.js';
import { AiError, generateInsight } from '../lib/ai.js';

const insightRequestSchema = z.object({
  verse: z.object({
    chapter: z.number().int().positive(),
    verse: z.number().int().positive(),
    sanskrit: z.string().optional(),
    english: z.string().optional(),
    insight: z
      .object({ explanation: z.string().optional(), takeaway: z.string().optional() })
      .optional(),
  }),
  profile: z
    .object({
      age: z.number().nullable().optional(),
      profession: z.string().nullable().optional(),
      marital_status: z.string().nullable().optional(),
    })
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  challenge: z
    .object({ label: z.string().optional(), description: z.string().optional() })
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

const saveSchema = z.object({
  verse_id: z.string().min(1),
  chapter_number: z.number().int().positive(),
  verse_number: z.number().int().positive(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  challenge_id: z.string().nullable().optional(),
});

export default async function insightRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/saved-insights', async (request) => {
    const rows = await db
      .select()
      .from(savedInsights)
      .where(eq(savedInsights.userId, currentUser(request).id))
      .orderBy(desc(savedInsights.createdAt));
    return rows.map(toSavedInsight);
  });

  app.post('/saved-insights', async (request, reply) => {
    const parsed = saveSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0].message });
    }

    const [row] = await db
      .insert(savedInsights)
      .values({
        userId: currentUser(request).id,
        verseId: parsed.data.verse_id,
        chapterNumber: parsed.data.chapter_number,
        verseNumber: parsed.data.verse_number,
        title: parsed.data.title,
        description: parsed.data.description,
        challengeId: parsed.data.challenge_id ?? null,
      })
      .returning();

    return reply.code(201).send(toSavedInsight(row));
  });

  app.delete<{ Params: { id: string } }>('/saved-insights/:id', async (request, reply) => {
    if (!z.string().uuid().safeParse(request.params.id).success) {
      return reply.code(404).send({ error: 'Insight not found' });
    }

    // Scoping the delete by user id is what stops one account from deleting
    // another's rows now that RLS is gone.
    const deleted = await db
      .delete(savedInsights)
      .where(
        and(
          eq(savedInsights.id, request.params.id),
          eq(savedInsights.userId, currentUser(request).id),
        ),
      )
      .returning();

    if (deleted.length === 0) return reply.code(404).send({ error: 'Insight not found' });
    return { ok: true };
  });

  app.post('/insights/personalized', async (request, reply) => {
    const parsed = insightRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid verse payload' });
    }

    try {
      return { insight: await generateInsight(parsed.data) };
    } catch (error) {
      if (error instanceof AiError) {
        return reply.code(error.status).send({ error: error.message });
      }
      request.log.error(error);
      return reply.code(502).send({ error: 'Could not generate an insight right now' });
    }
  });
}
