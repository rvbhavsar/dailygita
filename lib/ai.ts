import { env } from './env';

const META_API_URL = 'https://api.meta.ai/v1/chat/completions';
const MODEL = 'muse-spark-1.1';

export interface Insight {
  title: string;
  description: string;
}

export interface InsightRequest {
  verse: {
    chapter: number;
    verse: number;
    sanskrit?: string;
    english?: string;
    insight?: { explanation?: string; takeaway?: string };
  };
  profile: { age?: number | null; profession?: string | null; marital_status?: string | null } | null;
  challenge: { label?: string; description?: string } | null;
}

export class AiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'AiError';
  }
}

function buildPrompt({ verse, profile, challenge }: InsightRequest): string {
  const who = [
    profile?.age ? `${profile.age} years old` : null,
    profile?.profession ? `works as a ${profile.profession}` : null,
    profile?.marital_status ? `marital status: ${profile.marital_status}` : null,
  ].filter(Boolean);

  return [
    `Bhagavad Gita, Chapter ${verse.chapter}, Verse ${verse.verse}.`,
    verse.english ? `Translation: ${verse.english}` : null,
    verse.insight?.explanation ? `Meaning: ${verse.insight.explanation}` : null,
    challenge?.label ? `They are working through: ${challenge.label}. ${challenge.description ?? ''}` : null,
    who.length ? `About this person: ${who.join(', ')}.` : null,
    '',
    'Write ONE short, concrete, real-life scenario showing how this verse applies to this specific person.',
    'Use a realistic situation from their world, not an abstract lesson. Name a person in the story.',
    'Keep the description to 2-3 sentences. Be grounded and practical, never preachy.',
    '',
    'Respond with ONLY a JSON object, no markdown fence, no commentary:',
    '{"title": "<5-7 word scenario title>", "description": "<2-3 sentences>"}',
  ]
    .filter((l) => l !== null)
    .join('\n');
}

// muse-spark-1.1 is a reasoning model, so it may wrap or pad the JSON.
function parseInsight(content: string): Insight {
  const direct = tryParse(content);
  if (direct) return direct;

  // Fall back to the first {...} block in the response.
  const match = content.match(/\{[\s\S]*\}/);
  const extracted = match ? tryParse(match[0]) : null;
  if (extracted) return extracted;

  throw new AiError('The model returned an unexpected response', 502);
}

function tryParse(raw: string): Insight | null {
  try {
    const parsed = JSON.parse(raw.trim().replace(/^```(?:json)?|```$/g, '').trim());
    if (typeof parsed?.title === 'string' && typeof parsed?.description === 'string') {
      return { title: parsed.title, description: parsed.description };
    }
  } catch {
    /* not JSON */
  }
  return null;
}

export async function generateInsight(request: InsightRequest): Promise<Insight> {
  if (!env.META_API_KEY) {
    throw new AiError('Personalized insights are not configured', 501);
  }

  const response = await fetch(META_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.META_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: buildPrompt(request) }],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (response.status === 429) throw new AiError('Too many requests, please try again shortly', 429);
  if (!response.ok) {
    console.error(`Meta API error ${response.status}: ${await response.text().catch(() => '')}`);
    throw new AiError('Could not generate an insight right now', 502);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new AiError('The model returned an empty response', 502);

  return parseInsight(content);
}
