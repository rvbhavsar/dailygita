import { and, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { generateApiKey } from '@/lib/api-keys';
import { withAuth } from '@/lib/session';

const createSchema = z.object({ name: z.string().trim().min(1).max(60) });

/** The user's active (non-revoked) keys — never the secrets, only the prefix. */
export const GET = withAuth(async (session) => {
  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      key_prefix: apiKeys.keyPrefix,
      last_used_at: apiKeys.lastUsedAt,
      created_at: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, session.id), isNull(apiKeys.revokedAt)))
    .orderBy(desc(apiKeys.createdAt));

  return Response.json(rows);
});

export const POST = withAuth(async (session, request: Request) => {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const key = generateApiKey();
  const [row] = await db
    .insert(apiKeys)
    .values({
      userId: session.id,
      name: parsed.data.name,
      keyHash: key.hash,
      keyPrefix: key.prefix,
    })
    .returning({ id: apiKeys.id, name: apiKeys.name, created_at: apiKeys.createdAt });

  // The raw key is returned exactly once — it is never recoverable after this.
  return Response.json({ ...row, key: key.raw }, { status: 201 });
});
