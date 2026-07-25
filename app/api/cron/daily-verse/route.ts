import { authorizeCron } from '@/lib/cron-auth';
import { sendDailyVerseEmails } from '@/lib/daily-verse-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request) {
  if (!authorizeCron(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendDailyVerseEmails();
  const status = result.failed > 0 && result.sent === 0 ? 500 : 200;
  return Response.json({ ok: status === 200, ...result }, { status });
}

/** GET for Railway cron / easy curl; POST for schedulers that prefer it. */
export const GET = handle;
export const POST = handle;
