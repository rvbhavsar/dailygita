import type { FastifyReply, FastifyRequest } from 'fastify';
import { COOKIE_NAME, verifyToken } from '../lib/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; email: string };
  }
}

/**
 * Replaces Supabase RLS. Every protected handler must pair this with an
 * explicit `WHERE user_id = request.user.id` — the client is never trusted
 * to supply its own user id.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[COOKIE_NAME];
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }

  request.user = { id: payload.sub, email: payload.email };
}

export function currentUser(request: FastifyRequest) {
  if (!request.user) throw new Error('currentUser called on an unauthenticated request');
  return request.user;
}
