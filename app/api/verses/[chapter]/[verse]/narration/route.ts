import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { verseAudio } from '@/db/schema';
import { TtsError, buildNarration, isTtsConfigured, synthesizeNarration } from '@/lib/tts';
import { withAuth } from '@/lib/session';

const bodySchema = z.object({
  english: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  takeaway: z.string().nullable().optional(),
});

// Generation costs money per call, so it stays behind auth.
export const POST = withAuth(
  async (
    _session,
    request: Request,
    ctx: { params: Promise<{ chapter: string; verse: string }> },
  ) => {
    if (!isTtsConfigured()) {
      return Response.json({ error: 'Narration is not configured' }, { status: 501 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return Response.json({ error: 'Invalid narration payload' }, { status: 400 });
    }

    const { chapter: c, verse: v } = await ctx.params;
    const chapter = Number(c);
    const verse = Number(v);
    if (!Number.isInteger(chapter) || !Number.isInteger(verse)) {
      return Response.json({ error: 'Invalid verse reference' }, { status: 400 });
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

    if (existing) return Response.json({ url: existing.url });

    try {
      const url = await synthesizeNarration(chapter, verse, buildNarration(parsed.data));

      await db
        .insert(verseAudio)
        .values({ chapterNumber: chapter, verseNumber: verse, kind: 'narration', url })
        .onConflictDoUpdate({
          target: [verseAudio.chapterNumber, verseAudio.verseNumber, verseAudio.kind],
          set: { url: sql`excluded.url` },
        });

      return Response.json({ url });
    } catch (error) {
      if (error instanceof TtsError) {
        return Response.json({ error: error.message }, { status: error.status });
      }
      console.error(error);
      return Response.json({ error: 'Could not generate audio right now' }, { status: 502 });
    }
  },
);
