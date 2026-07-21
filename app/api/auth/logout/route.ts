import { clearAuthCookie } from '@/lib/jwt';

export async function POST() {
  await clearAuthCookie();
  return Response.json({ ok: true });
}
