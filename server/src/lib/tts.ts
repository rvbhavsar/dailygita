import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from './env.js';

const DEEPGRAM_URL = 'https://api.deepgram.com/v1/speak';
// Deepgram only offers European languages and Japanese — English narration
// only. Sanskrit is served from the recitation dataset instead.
const VOICE = 'aura-2-thalia-en';

export class TtsError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'TtsError';
  }
}

export const isTtsConfigured = () => Boolean(env.DEEPGRAM_API_KEY);

/** Deepgram caps a single request; keep the narration comfortably under it. */
const MAX_CHARS = 1800;

export function buildNarration(parts: {
  english?: string | null;
  explanation?: string | null;
  takeaway?: string | null;
}): string {
  const text = [parts.english, parts.explanation, parts.takeaway]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join('\n\n');

  return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS - 1)}…` : text;
}

/**
 * Generates narration and caches it on disk. Returns the public path the
 * static route serves it from.
 */
export async function synthesizeNarration(
  chapter: number,
  verse: number,
  text: string,
): Promise<string> {
  if (!env.DEEPGRAM_API_KEY) throw new TtsError('Narration is not configured', 501);
  if (!text.trim()) throw new TtsError('Nothing to narrate for this verse', 400);

  const response = await fetch(`${DEEPGRAM_URL}?model=${VOICE}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(60_000),
  });

  if (response.status === 429) throw new TtsError('Too many requests, try again shortly', 429);
  if (!response.ok) {
    console.error(`Deepgram error ${response.status}: ${await response.text().catch(() => '')}`);
    throw new TtsError('Could not generate audio right now', 502);
  }

  const audio = Buffer.from(await response.arrayBuffer());
  const filename = `${chapter}-${verse}.mp3`;

  await mkdir(env.AUDIO_DIR, { recursive: true });
  await writeFile(join(env.AUDIO_DIR, filename), audio);

  return `/audio/${filename}`;
}
