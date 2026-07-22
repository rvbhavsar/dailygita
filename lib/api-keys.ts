import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';

const PREFIX = 'dg_live_';

export interface GeneratedKey {
  raw: string; // shown to the user once, never stored
  hash: string;
  prefix: string; // stored in the clear for display, e.g. "dg_live_a1b2c3d4"
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Mints a new key. The raw value is returned once and never persisted. */
export function generateApiKey(): GeneratedKey {
  const raw = PREFIX + randomBytes(24).toString('base64url');
  return { raw, hash: sha256(raw), prefix: raw.slice(0, PREFIX.length + 8) };
}

/**
 * Resolves a presented key to its owner, or null. Constant-work: a plain hash
 * lookup on the unique index, no per-request KDF (the token is already 192 bits
 * of entropy). Touches last_used_at so the UI can show activity.
 */
export async function verifyApiKey(raw: string): Promise<{ userId: string; keyId: string } | null> {
  if (!raw || !raw.startsWith(PREFIX)) return null;

  const [row] = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, sha256(raw)), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!row) return null;

  // Fire-and-forget; a failed touch must not block the request.
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id))
    .catch(() => {});

  return { userId: row.userId, keyId: row.id };
}
