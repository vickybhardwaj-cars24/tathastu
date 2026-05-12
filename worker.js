/**
 * Tathastu Studio — Cloudflare Worker
 *
 * R2 Bucket binding : TATHASTU_BUCKET  →  bucket name: tathastu-studio-data
 * Secrets required  : AUTH_USERNAME, AUTH_PASSWORD
 */

const DATA_KEY = 'studio-db.json';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function text(body, status = 200) {
  return new Response(body, { status, headers: CORS });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function parseBasicAuth(request) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Basic ')) return null;
  try {
    const decoded = atob(header.slice(6));
    const colon   = decoded.indexOf(':');
    if (colon < 0) return null;
    return { user: decoded.slice(0, colon).trim(), pass: decoded.slice(colon + 1).trim() };
  } catch { return null; }
}

function checkAuth(request, env) {
  const creds = parseBasicAuth(request);
  if (!creds) return false;
  const eu = (env.AUTH_USERNAME || '').trim();
  const ep = (env.AUTH_PASSWORD || '').trim();
  const uOk = creds.user.length === eu.length && [...creds.user].every((c,i)=>c===eu[i]);
  const pOk = creds.pass.length === ep.length && [...creds.pass].every((c,i)=>c===ep[i]);
  return uOk && pOk;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (method === 'POST' && url.pathname === '/verify')
      return checkAuth(request, env) ? text('OK') : text('Unauthorized', 401);
    if (method === 'GET' && url.pathname === '/data') {
      if (!checkAuth(request, env)) return text('Unauthorized', 401);
      const obj = await env.TATHASTU_BUCKET.get(DATA_KEY);
      if (!obj) return json({ walkins:[], events:[], tasks:[], pricing:[], customers:[] });
      return new Response(obj.body, { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    if (method === 'POST' && url.pathname === '/data') {
      if (!checkAuth(request, env)) return text('Unauthorized', 401);
      const body = await request.text();
      if (body.length > 10*1024*1024) return text('Payload too large', 413);
      try { JSON.parse(body); } catch { return text('Invalid JSON', 400); }
      await env.TATHASTU_BUCKET.put(DATA_KEY, body, { httpMetadata: { contentType: 'application/json' } });
      return text('OK');
    }
    return text('Not Found', 404);
  },
};
