import { z } from 'zod';
import { AiError } from '@/lib/ai';
import { streamGitaChat, type ChatMessage } from '@/lib/chat';
import { withAuth } from '@/lib/session';

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    // Each turn costs a model call, so the history sent back is capped. The
    // client trims too; this is the server-side guarantee.
    .max(40),
});

export const POST = withAuth(async (_session, request: Request) => {
  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid chat payload' }, { status: 400 });
  }

  try {
    // zod has already proven role and content are present; the project runs
    // with strictNullChecks off, which erases that from the inferred type.
    const stream = await streamGitaChat(parsed.data.messages as ChatMessage[]);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        // Railway sits behind a proxy that will otherwise buffer the whole
        // response and defeat streaming entirely.
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    if (error instanceof AiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: 'Could not reach the chat companion right now' }, { status: 502 });
  }
});
