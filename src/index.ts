import { renderHtml } from "./renderHtml";
import { handleRequest } from './chat';
import type { Env } from './types';
import { generateImage } from "./image";

const PRESHARED_AUTH_HEADER_KEY = "X-Custom-PSK";

function checkPresharedAuthHeader(request: Request, env: Env) {
  const psk = request.headers.get(PRESHARED_AUTH_HEADER_KEY);

  if (psk === env.PRESHARED_AUTH_HEADER_VALUE) {
    return true;
  }

  return false;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      if (!checkPresharedAuthHeader(request, env)) {
        return new Response('Sorry, you have supplied an invalid key', { status: 403 })
      }

      return handleRequest(request, env);
    }

    if (url.pathname === '/api/image' && request.method === 'POST') {
      if (!checkPresharedAuthHeader(request, env)) {
        return new Response('Sorry, you have supplied an invalid key', { status: 403 })
      }

      return generateImage(request, env);
    }

    const stmt = env.DB.prepare("SELECT * FROM comments LIMIT 3");
    const { results } = await stmt.all();

    return new Response(renderHtml(JSON.stringify(results, null, 2)), {
      headers: {
        "content-type": "text/html",
      },
    });
  }
} satisfies ExportedHandler<Env>;
