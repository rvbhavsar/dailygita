import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles, users } from '@/db/schema';
import { clearAuthCookie } from '@/lib/jwt';
import { toProfile, toUser } from '@/lib/serialize';
import { unauthorized, withAuth } from '@/lib/session';

export const GET = withAuth(async (session) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, session.id) });
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, session.id) });

  // Token is valid but the account is gone — drop the stale cookie.
  if (!user || !profile) {
    await clearAuthCookie();
    return unauthorized();
  }

  return Response.json({ user: toUser(user), profile: toProfile(profile) });
});
