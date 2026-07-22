import { baseUrl, corsPreflight, jsonWithCors, mcpResource } from '@/lib/oauth';

/** OAuth 2.0 Protected Resource Metadata (RFC 9728). Points MCP clients at the
 *  authorization server for this resource. */
export function GET(request: Request): Response {
  return jsonWithCors({
    resource: mcpResource(request),
    authorization_servers: [baseUrl(request)],
    scopes_supported: ['gita.read'],
    bearer_methods_supported: ['header'],
    resource_name: 'Daily Gita',
  });
}

export function OPTIONS(): Response {
  return corsPreflight();
}
