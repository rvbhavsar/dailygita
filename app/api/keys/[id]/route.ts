import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { withAuth } from '@/lib/session';

/** Revoke (soft-delete) a key. Scoped to the owner so one user can't revoke
 *  another's — the id alone is never trusted. */
export const DELETE = withAuth(async (session, _request, context) => {
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const [row] = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, session.id), isNull(apiKeys.revokedAt)))
    .returning({ id: apiKeys.id });

  if (!row) return Response.json({ error: 'Key not found' }, { status: 404 });
  return Response.json({ id: row.id, revoked: true });
});
