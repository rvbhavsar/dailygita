import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { oauthAuthCodes, oauthTokens } from '@/db/schema';
import {
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
  corsPreflight,
  jsonWithCors,
  normalizeResource,
  randomToken,
  sha256,
  verifyPkceS256,
} from '@/lib/oauth';
import { randomUUID } from 'node:crypto';

function oauthError(error: string, description?: string, status = 400) {
  return jsonWithCors({ error, error_description: description }, { status });
}

/** Issues an access+refresh pair bound to one chain, resource and user. */
async function issueTokens(input: {
  clientId: string;
  userId: string;
  resource: string;
  scope: string;
  chainId: string;
}) {
  const access = randomToken(32);
  const refresh = randomToken(32);
  const now = Date.now();

  await db.insert(oauthTokens).values([
    {
      tokenHash: sha256(access),
      type: 'access',
      clientId: input.clientId,
      userId: input.userId,
      resource: input.resource,
      scope: input.scope,
      chainId: input.chainId,
      expiresAt: new Date(now + ACCESS_TTL_SECONDS * 1000),
    },
    {
      tokenHash: sha256(refresh),
      type: 'refresh',
      clientId: input.clientId,
      userId: input.userId,
      resource: input.resource,
      scope: input.scope,
      chainId: input.chainId,
      expiresAt: new Date(now + REFRESH_TTL_SECONDS * 1000),
    },
  ]);

  return jsonWithCors({
    access_token: access,
    token_type: 'Bearer',
    expires_in: ACCESS_TTL_SECONDS,
    refresh_token: refresh,
    scope: input.scope,
  });
}

async function handleAuthorizationCode(form: FormData): Promise<Response> {
  const code = String(form.get('code') ?? '');
  const clientId = String(form.get('client_id') ?? '');
  const redirectUri = String(form.get('redirect_uri') ?? '');
  const codeVerifier = String(form.get('code_verifier') ?? '');
  const resource = String(form.get('resource') ?? '');

  if (!code || !clientId || !codeVerifier) {
    return oauthError('invalid_request', 'Missing code, client_id or code_verifier');
  }

  // Atomically claim the code: single-use and unexpired in one write, so two
  // concurrent exchanges can't both succeed.
  const [row] = await db
    .update(oauthAuthCodes)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(oauthAuthCodes.codeHash, sha256(code)),
        isNull(oauthAuthCodes.consumedAt),
        gt(oauthAuthCodes.expiresAt, new Date()),
      ),
    )
    .returning();

  if (!row) return oauthError('invalid_grant', 'Authorization code is invalid, used or expired');
  if (row.clientId !== clientId) return oauthError('invalid_grant', 'client_id mismatch');
  if (row.redirectUri !== redirectUri) return oauthError('invalid_grant', 'redirect_uri mismatch');
  if (!verifyPkceS256(codeVerifier, row.codeChallenge)) {
    return oauthError('invalid_grant', 'PKCE verification failed');
  }
  if (resource && normalizeResource(resource) !== row.resource) {
    return oauthError('invalid_target', 'resource does not match the authorization');
  }

  return issueTokens({
    clientId: row.clientId,
    userId: row.userId,
    resource: row.resource,
    scope: row.scope,
    chainId: randomUUID(),
  });
}

async function handleRefresh(form: FormData): Promise<Response> {
  const refreshToken = String(form.get('refresh_token') ?? '');
  const clientId = String(form.get('client_id') ?? '');
  if (!refreshToken || !clientId) {
    return oauthError('invalid_request', 'Missing refresh_token or client_id');
  }

  const [row] = await db
    .select()
    .from(oauthTokens)
    .where(and(eq(oauthTokens.tokenHash, sha256(refreshToken)), eq(oauthTokens.type, 'refresh')))
    .limit(1);

  if (!row) return oauthError('invalid_grant', 'Unknown refresh token');
  if (row.clientId !== clientId) return oauthError('invalid_grant', 'client_id mismatch');

  // Reuse of an already-rotated (revoked) refresh token is a theft signal:
  // revoke the whole chain and refuse. Public clients MUST rotate refresh tokens.
  if (row.revokedAt) {
    await db
      .update(oauthTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(oauthTokens.chainId, row.chainId), isNull(oauthTokens.revokedAt)));
    return oauthError('invalid_grant', 'Refresh token already used');
  }
  if (row.expiresAt <= new Date()) return oauthError('invalid_grant', 'Refresh token expired');

  // Rotate: retire the old refresh and its chain's live access tokens, mint new.
  await db
    .update(oauthTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(oauthTokens.chainId, row.chainId),
        isNull(oauthTokens.revokedAt),
        sql`${oauthTokens.type} in ('refresh', 'access')`,
      ),
    );

  return issueTokens({
    clientId: row.clientId,
    userId: row.userId,
    resource: row.resource,
    scope: row.scope,
    chainId: row.chainId,
  });
}

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return oauthError('invalid_request', 'Expected application/x-www-form-urlencoded body');
  }

  const grantType = String(form.get('grant_type') ?? '');
  if (grantType === 'authorization_code') return handleAuthorizationCode(form);
  if (grantType === 'refresh_token') return handleRefresh(form);
  return oauthError('unsupported_grant_type', `Unsupported grant_type: ${grantType}`);
}

export function OPTIONS(): Response {
  return corsPreflight();
}
