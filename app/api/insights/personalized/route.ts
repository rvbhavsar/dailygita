import { z } from 'zod';
import { AiError, generateInsight, type InsightRequest } from '@/lib/ai';
import { withAuth } from '@/lib/session';

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

export const POST = withAuth(async (_session, request: Request) => {
  const parsed = insightRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid verse payload' }, { status: 400 });
  }

  try {
    // zod has already proven chapter/verse are present; the project runs with
    // strictNullChecks off, which erases that from the inferred type.
    return Response.json({ insight: await generateInsight(parsed.data as InsightRequest) });
  } catch (error) {
    if (error instanceof AiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: 'Could not generate an insight right now' }, { status: 502 });
  }
});
