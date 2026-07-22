import { verifyApiKey } from '@/lib/api-keys';
import { TOOLS, TOOLS_BY_NAME } from '@/lib/mcp-tools';
import {
  CORS_HEADERS,
  baseUrl,
  corsPreflight,
  mcpResource,
  verifyAccessToken,
} from '@/lib/oauth';

/**
 * Remote MCP server for Daily Gita — how a user connects the Gita corpus to
 * their own agent. Stateless Streamable HTTP: each POST is one JSON-RPC message
 * answered with one JSON response (no SSE, no sessions — the tools return whole
 * results). Mounted under /api so proxy.ts's cookie gate never touches it;
 * agents authenticate with a bearer key, not a browser cookie.
 *
 * Spec: https://modelcontextprotocol.io/docs/concepts/transports (Streamable HTTP)
 */

const PROTOCOL_VERSION = '2025-06-18';
const SERVER_INFO = { name: 'daily-gita', version: '0.1.0' };

// JSON-RPC error codes.
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;

type JsonRpcId = string | number | null;

function result(id: JsonRpcId, value: unknown) {
  return Response.json({ jsonrpc: '2.0', id, result: value }, { headers: CORS_HEADERS });
}

function rpcError(id: JsonRpcId, code: number, message: string, status = 200) {
  return Response.json(
    { jsonrpc: '2.0', id, error: { code, message } },
    { status, headers: CORS_HEADERS },
  );
}

function unauthorized(request: Request) {
  // Point OAuth clients at the resource metadata so they can discover the
  // authorization server (RFC 9728 §5.1). Personal keys ignore this and just
  // retry with a valid bearer.
  const resourceMetadata = `${baseUrl(request)}/.well-known/oauth-protected-resource`;
  return Response.json(
    { jsonrpc: '2.0', id: null, error: { code: INVALID_REQUEST, message: 'Unauthorized' } },
    {
      status: 401,
      headers: {
        ...CORS_HEADERS,
        'WWW-Authenticate': `Bearer resource_metadata="${resourceMetadata}"`,
      },
    },
  );
}

/**
 * Accepts either a personal key (dg_live_…, for header-capable clients) or an
 * OAuth access token (for ChatGPT/Claude web). OAuth tokens are audience-checked
 * against this exact resource, so a token minted for anything else is refused.
 */
async function authenticate(request: Request): Promise<boolean> {
  const header = request.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const token = match[1].trim();

  if (token.startsWith('dg_live_')) {
    return (await verifyApiKey(token)) !== null;
  }
  return (await verifyAccessToken(token, mcpResource(request))) !== null;
}

async function dispatch(message: {
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
}): Promise<Response> {
  const id = message.id ?? null;
  const { method, params } = message;

  switch (method) {
    case 'initialize':
      return result(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions:
          'Grounds an agent in the Bhagavad Gita. search_verses finds relevant verses for any theme or feeling; get_verse fetches one by reference; list_life_challenges and get_verses_for_challenge browse by life theme. Cite only verses these tools return.',
      });

    case 'ping':
      return result(id, {});

    case 'tools/list':
      return result(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });

    case 'tools/call': {
      const name = String(params?.name ?? '');
      const tool = TOOLS_BY_NAME.get(name);
      if (!tool) return rpcError(id, INVALID_PARAMS, `Unknown tool: ${name}`);
      const args = (params?.arguments as Record<string, unknown>) ?? {};
      try {
        const text = await tool.handler(args);
        return result(id, { content: [{ type: 'text', text }] });
      } catch (err) {
        // Tool-level failures ride back as an isError result, not a protocol
        // error, so the calling model can read the message and adapt.
        return result(id, {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        });
      }
    }

    default:
      return rpcError(id, METHOD_NOT_FOUND, `Method not found: ${method}`);
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!(await authenticate(request))) return unauthorized(request);

  let message: { jsonrpc?: string; id?: JsonRpcId; method?: string; params?: Record<string, unknown> };
  try {
    message = await request.json();
  } catch {
    return rpcError(null, PARSE_ERROR, 'Parse error', 400);
  }

  if (message?.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return rpcError(message?.id ?? null, INVALID_REQUEST, 'Invalid JSON-RPC request', 400);
  }

  // Notifications (no id) — e.g. notifications/initialized — get 202, no body.
  if (message.id === undefined && message.method.startsWith('notifications/')) {
    return new Response(null, { status: 202 });
  }

  try {
    return await dispatch(message);
  } catch (err) {
    console.error('MCP dispatch error:', err);
    return rpcError(message.id ?? null, INTERNAL_ERROR, 'Internal error');
  }
}

// The transport allows a GET for a server-initiated SSE stream; we don't push,
// so decline it per spec.
export function GET(): Response {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST', ...CORS_HEADERS },
  });
}

export function OPTIONS(): Response {
  return corsPreflight();
}
