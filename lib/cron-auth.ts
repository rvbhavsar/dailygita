import { env, isProd } from '@/lib/env';

/** Authorize Railway cron / external scheduler calls to /api/cron/*. */
export function authorizeCron(request: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) {
    // Local/dev convenience: leave the route open when no secret is configured.
    // Production must set CRON_SECRET.
    return !isProd;
  }

  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}
