import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { oauthAuthCodes, oauthClients } from '@/db/schema';
import { getSessionUser } from '@/lib/session';
import {
  CODE_TTL_SECONDS,
  baseUrl,
  mcpResource,
  normalizeResource,
  randomToken,
  redirectUriAllowed,
  sha256,
} from '@/lib/oauth';

/**
 * Consent approval. Re-validates everything server-side (never trust the form)
 * and, on approval, issues a single-use authorization code bound to the client,
 * redirect_uri, PKCE challenge, resource and user. On denial, bounces the
 * standard access_denied error back to the client.
 */
export async function POST(request: Request): Promise<Response> {
  // CSRF defense-in-depth. The session cookie is SameSite=lax, so a cross-site
  // POST wouldn't carry it — but an authorization endpoint shouldn't lean on
  // that alone. Require the approval to originate from our own page.
  const origin = request.headers.get('origin');
  if (origin && normalizeResource(origin) !== normalizeResource(baseUrl(request))) {
    return new Response('Cross-origin request refused', { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) return new Response('Not signed in', { status: 401 });

  const form = await request.formData();
  const clientId = String(form.get('client_id') ?? '');
  const redirectUri = String(form.get('redirect_uri') ?? '');
  const codeChallenge = String(form.get('code_challenge') ?? '');
  const state = String(form.get('state') ?? '');
  const scope = String(form.get('scope') ?? 'gita.read');
  const decision = String(form.get('decision') ?? '');
  const requestedResource = String(form.get('resource') ?? '');

  // Re-validate client + redirect_uri; a mismatch means never redirect back.
  const [client] = clientId
    ? await db.select().from(oauthClients).where(eq(oauthClients.clientId, clientId)).limit(1)
    : [];
  if (!client || !redirectUriAllowed(redirectUri, client.redirectUris)) {
    return new Response('Invalid client or redirect_uri', { status: 400 });
  }

  const redirect = new URL(redirectUri);
  if (state) redirect.searchParams.set('state', state);

  if (decision !== 'approve') {
    redirect.searchParams.set('error', 'access_denied');
    return Response.redirect(redirect.toString(), 303);
  }

  if (!codeChallenge) {
    redirect.searchParams.set('error', 'invalid_request');
    return Response.redirect(redirect.toString(), 303);
  }

  // Bind the token audience to our canonical MCP resource. Accept a client that
  // asked for our base or our endpoint; reject a token request aimed elsewhere.
  const ours = normalizeResource(mcpResource(request));
  const base = ours.replace(/\/api\/mcp$/, '');
  const requested = requestedResource ? normalizeResource(requestedResource) : ours;
  if (requested !== ours && requested !== base) {
    redirect.searchParams.set('error', 'invalid_target');
    return Response.redirect(redirect.toString(), 303);
  }

  const code = randomToken(32);
  await db.insert(oauthAuthCodes).values({
    codeHash: sha256(code),
    clientId,
    userId: user.id,
    redirectUri,
    codeChallenge,
    resource: ours,
    scope,
    expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000),
  });

  redirect.searchParams.set('code', code);
  return Response.redirect(redirect.toString(), 303);
}
