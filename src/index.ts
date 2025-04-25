import { renderHtml } from "./renderHtml";
import { handleRequest } from './chat';
import type { Env } from './types';

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const PRESHARED_AUTH_HEADER_KEY = "X-Custom-PSK";
      const psk = request.headers.get(PRESHARED_AUTH_HEADER_KEY);

      if (psk === env.PRESHARED_AUTH_HEADER_VALUE) {
        return handleRequest(request, env);
      } else {
        console.log('psk', psk);
        console.log('env.PRESHARED_AUTH_HEADER_VALUE', env.PRESHARED_AUTH_HEADER_VALUE);
        return new Response('Sorry, you have supplied an invalid key', { status: 403 })
      }
    }

    const stmt = env.DB.prepare("SELECT * FROM comments LIMIT 3");
    const { results } = await stmt.all();

    return new Response(renderHtml(JSON.stringify(results, null, 2)), {
      headers: {
        "content-type": "text/html",
      },
    });
  },
} satisfies ExportedHandler<Env>;
