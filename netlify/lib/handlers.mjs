import { DEFAULTS } from './defaults.mjs';
import { sanitizeContent, summarize, photoWarnings } from './sanitize.mjs';
import { ICONS } from './icons.mjs';
import { renderHome, renderGallery, renderService, renderNotFound, renderSitemap, renderRobots } from './render.mjs';
import { passwordOk, safeEqual, makeToken, isLoggedIn, sessionCookie, clearCookie, clientIp, lockedMinutes, recordFail, clearFails } from './auth.mjs';

const KEEP_BACKUPS = 20;
const BACKUP_ID = /^\d{4}-\d\d-\d\dT[\d:.]+Z-[0-9a-f]{4}$/;

const SEC = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};

// ---------- content access ----------
async function readJson(store, key) {
  try { return await store.get(key, { type: 'json' }); } catch { return null; }
}
export async function loadLive(store) {
  return sanitizeContent((await readJson(store, 'live')) || DEFAULTS);
}

// ---------- public site ----------
export async function handlePublic(req, { store, env = {} }) {
  const url = new URL(req.url);
  const path = url.pathname;
  const wantsPreview = url.searchParams.has('preview');
  let c = null, previewing = false;
  if (wantsPreview && isLoggedIn(req, env)) {
    const d = await readJson(store, 'draft');
    if (d) { c = sanitizeContent(d); previewing = true; }
  }
  if (!c) c = await loadLive(store);
  const o = { origin: url.origin, preview: previewing, noindex: wantsPreview };

  const headers = { ...SEC };
  if (wantsPreview) {
    headers['Cache-Control'] = 'no-store';
    headers['X-Robots-Tag'] = 'noindex, nofollow';
  } else {
    headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
    headers['Netlify-CDN-Cache-Control'] = 'public, s-maxage=60, stale-while-revalidate=600';
  }
  const send = (body, status, type) => new Response(body, { status, headers: { ...headers, 'Content-Type': type } });
  const html = (body, status = 200) => send(body, status, 'text/html; charset=utf-8');

  if (path === '/robots.txt') return send(renderRobots(c, o), 200, 'text/plain; charset=utf-8');
  if (path === '/sitemap.xml') return send(renderSitemap(c, o), 200, 'application/xml; charset=utf-8');
  if (path === '/') return html(renderHome(c, o));
  if (path === '/gallery.html') return c.gallery.length ? html(renderGallery(c, o)) : html(renderNotFound(c, o), 404);
  if (path === '/services' || path === '/services/') return new Response(null, { status: 301, headers: { ...SEC, Location: '/#services' } });
  const m = path.match(/^\/services\/([a-z0-9-]+)\.html$/);
  if (m) {
    const s = c.services.find((x) => x.slug === m[1]);
    if (s) return html(renderService(c, s, o));
  }
  return html(renderNotFound(c, o), 404);
}

// ---------- admin API ----------
const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { ...SEC, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', ...extra } });

const lockedSlugsOf = (live) => Object.fromEntries(live.services.map((s) => [s.id, s.slug]));

async function listBackups(store) {
  const r = await store.list({ prefix: 'backups/' });
  return (r.blobs || []).map((b) => b.key.slice('backups/'.length)).sort().reverse();
}

export async function handleAdmin(req, { store, env = {}, now = () => Date.now() }) {
  const url = new URL(req.url);
  const action = url.pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');
  const method = req.method;

  // Every POST must carry the custom header and be JSON (blocks cross-site form posts).
  let body = {};
  if (method === 'POST') {
    if (req.headers.get('x-admin-request') !== '1') return json({ error: 'Blocked: missing request header.' }, 403);
    if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return json({ error: 'Blocked: JSON required.' }, 415);
    const text = await req.text();
    if (text.length > 2_000_000) return json({ error: 'Request too large.' }, 413);
    try { body = text ? JSON.parse(text) : {}; } catch { return json({ error: 'Invalid JSON.' }, 400); }
    if (!body || typeof body !== 'object') body = {};
  } else if (method !== 'GET') return json({ error: 'Method not allowed.' }, 405);

  if (action === 'session' && method === 'GET') return json({ loggedIn: isLoggedIn(req, env), configured: passwordOk(env) });

  if (action === 'login' && method === 'POST') {
    if (!passwordOk(env)) return json({ error: 'Admin password is not set up yet. Add ADMIN_PASSWORD (at least 10 characters) in Netlify and redeploy.' }, 503);
    const ip = clientIp(req), t = now();
    const mins = await lockedMinutes(store, ip, t);
    if (mins) return json({ error: `Too many wrong attempts. Try again in about ${mins} minute(s).` }, 429);
    if (typeof body.password === 'string' && safeEqual(body.password, env.ADMIN_PASSWORD)) {
      await clearFails(store, ip);
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(makeToken(env.ADMIN_PASSWORD, t)) });
    }
    const r = await recordFail(store, ip, t);
    return json({ error: r.until > t ? 'Too many wrong attempts. Locked for 15 minutes.' : 'Wrong password.' }, r.until > t ? 429 : 401);
  }

  if (!isLoggedIn(req, env)) return json({ error: 'Please log in.' }, 401);

  if (action === 'logout' && method === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() });

  const live = await loadLive(store);
  const rawDraft = await readJson(store, 'draft');
  const locked = lockedSlugsOf(live);
  const view = async () => {
    const draft = rawDraft ? sanitizeContent(rawDraft, { lockedSlugs: locked }) : null;
    return { content: draft || live, hasDraft: !!draft, lockedSlugs: locked, icons: ICONS, warnings: photoWarnings(draft || live), versions: await listBackups(store) };
  };

  if (action === 'state' && method === 'GET') return json(await view());

  if (action === 'save-draft' && method === 'POST') {
    const content = sanitizeContent(body.content, { lockedSlugs: locked });
    await store.setJSON('draft', content);
    return json({ ok: true, content, warnings: photoWarnings(content) });
  }

  if (action === 'discard-draft' && method === 'POST') {
    await store.delete('draft');
    return json({ ok: true, content: live });
  }

  if (action === 'summary' && method === 'GET') {
    if (!rawDraft) return json({ hasDraft: false, changes: [] });
    const draft = sanitizeContent(rawDraft, { lockedSlugs: locked });
    return json({ hasDraft: true, changes: summarize(live, draft) });
  }

  if (action === 'publish' && method === 'POST') {
    if (!rawDraft) return json({ error: 'There is no saved draft to publish.' }, 400);
    const draft = sanitizeContent(rawDraft, { lockedSlugs: locked });
    const stamp = new Date(now()).toISOString();
    await store.setJSON(`backups/${stamp}-${Math.floor(Math.random() * 65536).toString(16).padStart(4, '0')}`, live);
    await store.setJSON('live', { ...draft, updatedAt: stamp });
    await store.delete('draft');
    const all = await listBackups(store);
    for (const id of all.slice(KEEP_BACKUPS)) await store.delete(`backups/${id}`);
    return json({ ok: true, publishedAt: stamp });
  }

  if (action === 'versions' && method === 'GET') return json({ versions: await listBackups(store) });

  if (action === 'restore' && method === 'POST') {
    const id = String(body.id || '');
    if (!BACKUP_ID.test(id)) return json({ error: 'Unknown version.' }, 400);
    const old = await readJson(store, `backups/${id}`);
    if (!old) return json({ error: 'Version not found.' }, 404);
    const content = sanitizeContent(old, { lockedSlugs: locked });
    await store.setJSON('draft', content);
    return json({ ok: true, content });
  }

  return json({ error: 'Not found.' }, 404);
}
