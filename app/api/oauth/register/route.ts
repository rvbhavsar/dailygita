import { z } from 'zod';
import { db } from '@/db';
import { oauthClients } from '@/db/schema';
import { corsPreflight, isSafeRedirectUri, jsonWithCors, randomToken } from '@/lib/oauth';

/**
 * Dynamic Client Registration (RFC 7591). Unauthenticated by design — that's
 * how ChatGPT/Claude self-register — so it's strict about what it accepts:
 * every redirect_uri must be https or localhost, and client_name is treated as
 * untrusted display text (the consent screen shows the real redirect host, not
 * this).
 */
const registerSchema = z.object({
  redirect_uris: z.array(z.string().url()).min(1).max(5),
  client_name: z.string().trim().max(120).optional(),
  // Accepted for spec-compatibility; we only issue what we support.
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  token_endpoint_auth_method: z.string().optional(),
  scope: z.string().optional(),
});

export async function POST(request: Request): Promise<Response> {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonWithCors(
      { error: 'invalid_client_metadata', error_description: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const redirectUris = parsed.data.redirect_uris;
  if (!redirectUris.every(isSafeRedirectUri)) {
    return jsonWithCors(
      {
        error: 'invalid_redirect_uri',
        error_description: 'redirect_uris must be https or localhost',
      },
      { status: 400 },
    );
  }

  const clientId = `dgc_${randomToken(18)}`;
  await db.insert(oauthClients).values({
    clientId,
    clientName: parsed.data.client_name ?? null,
    redirectUris,
  });

  // Public client: no secret, PKCE required at token exchange.
  return jsonWithCors(
    {
      client_id: clientId,
      client_name: parsed.data.client_name,
      redirect_uris: redirectUris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: 'gita.read',
    },
    { status: 201 },
  );
}

export function OPTIONS(): Response {
  return corsPreflight();
}
