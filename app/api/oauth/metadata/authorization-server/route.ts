import { baseUrl, corsPreflight, jsonWithCors } from '@/lib/oauth';

/** OAuth 2.0 Authorization Server Metadata (RFC 8414). */
export function GET(request: Request): Response {
  const base = baseUrl(request);
  return jsonWithCors({
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    registration_endpoint: `${base}/api/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['gita.read'],
  });
}

export function OPTIONS(): Response {
  return corsPreflight();
}
