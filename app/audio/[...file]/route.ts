import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import type { ReadableOptions } from 'node:stream';
import { env } from '@/lib/env';

/**
 * Serves narration mp3s written at runtime to the mounted volume. Next's
 * public/ is build-time only, so this replaces @fastify/static.
 *
 * Range/206 is not implemented — useVerseAudio only ever seeks to 0. Add it
 * if a scrub bar ships.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string[] }> },
) {
  const { file } = await params;

  const root = resolve(env.AUDIO_DIR);
  const target = resolve(join(root, ...file));

  // @fastify/static gave us traversal protection for free; this restores it.
  if (target !== root && !target.startsWith(root + sep)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  let size: number;
  try {
    const info = await stat(target);
    if (!info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const stream = createReadStream(target) as unknown as ReadableOptions & AsyncIterable<Uint8Array>;

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) controller.enqueue(chunk);
        controller.close();
      },
    }),
    {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  );
}
