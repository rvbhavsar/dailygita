import { env } from './env';
import { AiError } from './ai';
import { searchVerses, type RetrievedVerse } from './gita-search';

const META_API_URL = 'https://api.meta.ai/v1/chat/completions';
const MODEL = 'muse-spark-1.1';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * The agent listens, then explains what the Gita says about the topic raised.
 *
 * The hard line is between *exposition* and *advice*. It may explain what a
 * verse teaches; it may not tell someone what to do with their life. That
 * boundary is the whole point of the feature, so it's stated several ways —
 * models reliably drift back into life-coaching when a message sounds like a
 * plea for help, which most of these will.
 */
const SYSTEM_PROMPT = `You are a study companion for the Bhagavad Gita. Someone has come to talk something over with you.

HOW TO RESPOND
1. Listen first. Acknowledge what they raised in one or two plain sentences, so they feel heard. Do not rush past this.
2. Then explain what the Bhagavad Gita has to say about that theme, grounded in specific chapters and verses.
3. Draw the connection between the verse and the theme they raised — what the text is getting at, and why it bears on their situation.

CITING SCRIPTURE
- You will be given a set of retrieved verses below. Cite ONLY from those verses.
- Never invent, guess or half-remember a chapter or verse number. If the retrieved verses do not speak to what was raised, say plainly that you could not find a passage that speaks to it directly, and invite them to put it another way.
- Always give the reference as "Chapter X, Verse Y" so it can be looked up.
- Quote or paraphrase the translation you were given. Do not substitute a different wording you recall.

WHAT YOU DO NOT DO
- You do NOT give life advice. You do not tell them what to do, what to choose, or how to handle their situation.
- No action steps, no recommendations, no "you should", no "try to", no coaching.
- You are not a therapist, counsellor or advisor. You explain what the text says and let them draw their own conclusions.
- If they ask you directly what they should do, say warmly that this is not yours to answer, and return to what the Gita has to say on the theme.
- Do not diagnose, and do not comment on medical, legal or financial matters.

VOICE
- Address them as "you". Warm, plain, unhurried. Never preachy and never sanctimonious.
- Do NOT invent names for anyone — not for them, not for anyone they mention. Use relationships and roles instead ("your manager", "a colleague", "a family member").
- Keep it to a few short paragraphs. This is a conversation, not a lecture.
- Sanskrit terms are welcome where they carry meaning, but always gloss them in English.

SCOPE
- You only discuss the Bhagavad Gita and the themes people bring to it. If asked about something unrelated, say that is outside what you can help with here.`;

function buildContext(verses: RetrievedVerse[]): string {
  if (verses.length === 0) {
    return 'RETRIEVED VERSES: none matched. Tell them you could not find a passage that speaks to this directly, and invite them to rephrase. Do not cite anything.';
  }

  return [
    'RETRIEVED VERSES — these are the only verses you may cite:',
    '',
    ...verses.map(
      (v) => `Chapter ${v.chapter}, Verse ${v.verse}\nSanskrit: ${v.sanskrit}\nTranslation: ${v.translation}`,
    ),
  ].join('\n\n');
}

/** Streams the reply as plain text chunks. */
export async function streamGitaChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  if (!env.META_API_KEY) {
    throw new AiError('The chat companion is not configured', 501);
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMessage) throw new AiError('No message to respond to', 400);

  // Retrieval runs on the latest message only. Threading the whole history into
  // one tsquery drags in every earlier topic and dilutes the ranking.
  const verses = await searchVerses(lastUserMessage.content);

  const response = await fetch(META_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.META_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        // Context goes in as a system turn immediately before the exchange so
        // it outranks anything the user might say to talk the agent out of it.
        { role: 'system', content: buildContext(verses) },
        ...messages,
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (response.status === 429) throw new AiError('Too many requests, please try again shortly', 429);
  if (!response.ok || !response.body) {
    console.error(`Meta API error ${response.status}: ${await response.text().catch(() => '')}`);
    throw new AiError('Could not reach the chat companion right now', 502);
  }

  return toTextStream(response.body);
}

/** Unwraps the OpenAI-compatible SSE envelope into plain text deltas. */
function toTextStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return body.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });

        // Hold the trailing fragment back — SSE events split across chunks, and
        // parsing half a line drops tokens silently.
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') return;

          try {
            const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta) controller.enqueue(encoder.encode(delta));
          } catch {
            /* keep-alive or partial frame */
          }
        }
      },
    }),
  );
}
