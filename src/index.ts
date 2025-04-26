import { renderHtml } from "./renderHtml";
import { handleRequest as handleChatRequest } from './chat';
import type { Env } from './types';
import { generateImage } from "./image";

const PRESHARED_AUTH_HEADER_KEY = "X-Custom-PSK";

// --- CORS Helper Functions ---
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function addCorsHeaders(resp: Response): Response {
  const newHeaders = new Headers(resp.headers);
  for (const [k, v] of Object.entries(corsHeaders)) {
    newHeaders.set(k, v);
  }
  return new Response(resp.body, { ...resp, headers: newHeaders });
}

function handleOptions(request: Request): Response {
  const headers = request.headers;
  if (
    headers.get("Origin") !== null &&
    headers.get("Access-Control-Request-Method") !== null
  ) {
    const corsResponseHeaders = {
      ...corsHeaders,
      "Access-Control-Allow-Headers": headers.get("Access-Control-Request-Headers") || "",
    };
    return new Response(null, { headers: corsResponseHeaders });
  }
  // Handle standard OPTIONS request
  return new Response(null, {
    headers: { Allow: "GET, HEAD, POST, OPTIONS" },
  });
}

function checkPresharedAuthHeader(request: Request, env: Env): boolean {
  const psk = request.headers.get(PRESHARED_AUTH_HEADER_KEY);
  return psk === env.PRESHARED_AUTH_HEADER_VALUE;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle OPTIONS preflight request for all endpoints
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    // Handle /api/chat endpoint
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      if (!checkPresharedAuthHeader(request, env)) {
        return addCorsHeaders(new Response('Sorry, you have supplied an invalid key', { status: 403 }));
      }
      return addCorsHeaders(await handleChatRequest(request, env));
    }

    // Handle /api/image endpoint
    if (url.pathname === '/api/image' && request.method === 'POST') {
      if (!checkPresharedAuthHeader(request, env)) {
        return addCorsHeaders(new Response('Sorry, you have supplied an invalid key', { status: 403 }));
      }
      return addCorsHeaders(await generateImage(request, env));
    }

    // Default: query DB and render HTML
    const stmt = env.DB.prepare("SELECT * FROM comments LIMIT 3");
    const { results } = await stmt.all();

    return addCorsHeaders(new Response(renderHtml(JSON.stringify(results, null, 2)), {
      headers: {
        "content-type": "text/html",
      },
    }));
  }
} satisfies ExportedHandler<Env>;
