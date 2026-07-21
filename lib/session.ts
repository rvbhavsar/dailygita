import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyToken } from './jwt';

export interface SessionUser {
  id: string;
  email: string;
}

/**
 * Replaces Supabase RLS. Every protected handler must pair this with an
 * explicit `WHERE user_id = <session user>` — the client is never trusted
 * to supply its own user id.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return null;
  return { id: payload.sub, email: payload.email };
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Not authenticated');
    this.name = 'UnauthorizedError';
  }
}

/** Throws if unauthenticated. Pair with `withAuth` in Route Handlers. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export const unauthorized = () =>
  Response.json({ error: 'Not authenticated' }, { status: 401 });

/**
 * Wraps a Route Handler so an unauthenticated request becomes a JSON 401
 * instead of a 500, matching the old Fastify preHandler behaviour.
 */
export function withAuth<Args extends unknown[]>(
  handler: (user: SessionUser, ...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    let user: SessionUser;
    try {
      user = await requireUser();
    } catch {
      return unauthorized();
    }
    return handler(user, ...args);
  };
}

/**
 * Server-side session with profile, for route-group layouts. This is the
 * authoritative guard — proxy.ts only does an optimistic cookie check.
 */
export async function getSessionProfile() {
  const session = await getSessionUser();
  if (!session) return null;

  const { db } = await import('@/db');
  const { profiles } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.id),
  });
  if (!profile) return null;

  return { user: session, isOnboarded: profile.isOnboarded };
}
