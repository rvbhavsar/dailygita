import { and, desc, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { favorites } from '../db/schema.js';
import { currentUser, requireAuth } from '../middleware/requireAuth.js';
import { toFavorite } from '../lib/serialize.js';

const bodySchema = z.object({
  chapter_number: z.number().int().positive(),
  verse_number: z.number().int().positive(),
});

export default async function favoriteRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/favorites', async (request) => {
    const rows = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, currentUser(request).id))
      .orderBy(desc(favorites.createdAt));
    return rows.map(toFavorite);
  });

  app.post('/favorites', async (request, reply) => {
    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid verse reference' });

    const [row] = await db
      .insert(favorites)
      .values({
        userId: currentUser(request).id,
        chapterNumber: parsed.data.chapter_number,
        verseNumber: parsed.data.verse_number,
      })
      .onConflictDoNothing()
      .returning();

    // Already favorited — return the existing row rather than erroring.
    if (!row) {
      const [existing] = await db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, currentUser(request).id),
            eq(favorites.chapterNumber, parsed.data.chapter_number),
            eq(favorites.verseNumber, parsed.data.verse_number),
          ),
        );
      return toFavorite(existing);
    }

    return reply.code(201).send(toFavorite(row));
  });

  app.delete<{ Params: { c: string; v: string } }>('/favorites/:c/:v', async (request) => {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, currentUser(request).id),
          eq(favorites.chapterNumber, Number(request.params.c)),
          eq(favorites.verseNumber, Number(request.params.v)),
        ),
      );
    return { ok: true };
  });
}
