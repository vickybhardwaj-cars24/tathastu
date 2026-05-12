/**
 * Tathastu Studio — Cloudflare Worker
 *
 * R2 Bucket binding : TATHASTU_BUCKET  (bucket name: tathastu-studio-data)
 * Env vars required : AUTH_USERNAME, AUTH_PASSWORD
 *
 * Endpoints:
 *   GET  /data    — load full studio DB (requires Basic Auth)
 *   POST /data    — save full studio DB (requires Basic Auth)
 *   POST /verify  — validate credentials
 *   OPTIONS *     — CORS preflight
 */

const DATA_KEY = 'studio-db.json';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    /* ── helpers ── */
    function timingSafeEqual(a, b) {
      if (typeof a !== 'string' || typeof b !== 'string') return false;
      if (a.length !== b.length) return false;
      let diff = 0;
      for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
      return diff === 0;
    }

    function checkAuth() {
      const header = request.headers.get('Authorization') || '';
      if (!header.startsWith('Basic ')) return false;
      try {
        const decoded = atob(header.slice(6));
        const colon   = decoded.indexOf(':');
        if (colon < 0) return false;
        const user = decoded.slice(0, colon);
        const pass = decoded.slice(colon + 1);
        return (
          timingSafeEqual(user, env.AUTH_USERNAME || '') &&
          timingSafeEqual(pass, env.AUTH_PASSWORD || '')
        );
      } catch {
        return false;
      }
    }

    function json(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    function text(body, status = 200) {
      return new Response(body, { status, headers: CORS });
    }

    /* ── POST /verify — check credentials ── */
    if (method === 'POST' && url.pathname === '/verify') {
      return checkAuth() ? text('OK') : text('Unauthorized', 401);
    }

    /* ── GET /data — load full DB from R2 ── */
    if (method === 'GET' && url.pathname === '/data') {
      if (!checkAuth()) return text('Unauthorized', 401);

      const obj = await env.TATHASTU_BUCKET.get(DATA_KEY);
      if (!obj) {
        return json({ walkins: [], events: [], tasks: [], pricing: [], customers: [] });
      }
      const body = await obj.text();
      return new Response(body, {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    /* ── POST /data — save full DB to R2 ── */
    if (method === 'POST' && url.pathname === '/data') {
      if (!checkAuth()) return text('Unauthorized', 401);

      const body = await request.text();
      if (body.length > 10 * 1024 * 1024) return text('Payload too large', 413); // 10 MB limit

      try {
        JSON.parse(body); // validate JSON before storing
      } catch {
        return text('Invalid JSON', 400);
      }

      await env.TATHASTU_BUCKET.put(DATA_KEY, body, {
        httpMetadata: { contentType: 'application/json' },
      });
      return text('OK');
    }

    return text('Not Found', 404);
  },
};
