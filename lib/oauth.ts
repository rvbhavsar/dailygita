import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { oauthTokens } from '@/db/schema';

/**
 * OAuth 2.1 primitives for the co-hosted authorization server. See the MCP
 * authorization spec (modelcontextprotocol.io/.../basic/authorization) — the
 * subset here is: DCR, PKCE-S256, exact redirect matching, resource-indicator
 * audience binding, short access tokens, rotated refresh tokens.
 */

export const ACCESS_TTL_SECONDS = 60 * 60; // 1h
export const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30d
export const CODE_TTL_SECONDS = 60; // authorization codes are single-use and brief

/**
 * The public base URL the client actually reached us on. Railway terminates TLS
 * at a proxy, so trust x-forwarded-* over the internal request URL. Metadata and
 * token/audience URLs must match what the client used, or discovery breaks.
 */
export function baseUrl(request: Request): string {
  const h = request.headers;
  const proto = h.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '');
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? new URL(request.url).host;
  return `${proto}://${host}`;
}

/** The canonical resource identifier (audience) tokens are bound to. */
export function mcpResource(request: Request): string {
  return `${baseUrl(request)}/api/mcp`;
}

/**
 * Normalize a client-supplied `resource` for comparison: lowercase scheme+host,
 * drop any fragment and a single trailing slash. Per RFC 8707 / the MCP spec,
 * these differences are not significant.
 */
export function normalizeResource(value: string): string {
  try {
    const u = new URL(value);
    u.hash = '';
    let s = `${u.protocol.toLowerCase()}//${u.host.toLowerCase()}${u.pathname}${u.search}`;
    if (s.endsWith('/')) s = s.slice(0, -1);
    return s;
  } catch {
    return value.trim();
  }
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** PKCE S256 verification. Rejects anything but S256 by construction. */
export function verifyPkceS256(verifier: string, challenge: string): boolean {
  const computed = createHash('sha256').update(verifier).digest('base64url');
  const a = Buffer.from(computed);
  const b = Buffer.from(challenge);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Exact-string redirect_uri match against a client's registered set. */
export function redirectUriAllowed(redirectUri: string, registered: string[]): boolean {
  return registered.includes(redirectUri);
}

/** A redirect_uri is only acceptable at registration if https or localhost. */
export function isSafeRedirectUri(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (u.protocol === 'https:') return true;
    if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Validates an OAuth access token for use at the MCP resource. Enforces the
 * audience binding (RFC 8707): the token's resource MUST equal this server, or
 * a token minted for a different resource would be accepted — the core OAuth
 * boundary the MCP spec calls out. Returns the owning user, or null.
 */
export async function verifyAccessToken(
  token: string,
  expectedResource: string,
): Promise<{ userId: string } | null> {
  const [row] = await db
    .select({
      userId: oauthTokens.userId,
      resource: oauthTokens.resource,
      expiresAt: oauthTokens.expiresAt,
      revokedAt: oauthTokens.revokedAt,
    })
    .from(oauthTokens)
    .where(and(eq(oauthTokens.tokenHash, sha256(token)), eq(oauthTokens.type, 'access')))
    .limit(1);

  if (!row) return null;
  if (row.revokedAt) return null;
  if (row.expiresAt <= new Date()) return null;
  if (normalizeResource(row.resource) !== normalizeResource(expectedResource)) return null;

  return { userId: row.userId };
}

// ── CORS ──────────────────────────────────────────────────────────────────────
// Browser-based MCP clients (the Inspector, ChatGPT's flows) preflight the
// metadata, token and MCP endpoints. Missing CORS reads as "cannot connect".
export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
  'Access-Control-Max-Age': '86400',
};

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function jsonWithCors(body: unknown, init: ResponseInit = {}): Response {
  return Response.json(body, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init.headers ?? {}) },
  });
}
