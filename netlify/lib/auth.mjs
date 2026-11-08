import { createHmac, createHash, timingSafeEqual, randomBytes } from 'node:crypto';

const COOKIE = 'rnv_admin';
export const SESSION_SECONDS = 8 * 60 * 60;
export const MAX_FAILS = 5;
export const LOCK_MS = 15 * 60 * 1000;

const sha = (s) => createHash('sha256').update(String(s)).digest();
const keyFor = (pw) => sha('rnv-session|' + pw);

export function passwordOk(env) { return typeof env.ADMIN_PASSWORD === 'string' && env.ADMIN_PASSWORD.length >= 10; }
export function safeEqual(a, b) { return timingSafeEqual(sha(a), sha(b)); }

export function makeToken(pw, now = Date.now()) {
  const p = Buffer.from(JSON.stringify({ exp: now + SESSION_SECONDS * 1000, n: randomBytes(8).toString('hex') })).toString('base64url');
  return p + '.' + createHmac('sha256', keyFor(pw)).update(p).digest('base64url');
}

export function checkToken(token, pw, now = Date.now()) {
  if (!token || !pw) return false;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const want = createHmac('sha256', keyFor(pw)).update(parts[0]).digest('base64url');
  const a = Buffer.from(parts[1]), b = Buffer.from(want);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try { const d = JSON.parse(Buffer.from(parts[0], 'base64url').toString()); return typeof d.exp === 'number' && d.exp > now; } catch { return false; }
}

export function cookieFrom(req) {
  for (const part of (req.headers.get('cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === COOKIE) return part.slice(i + 1).trim();
  }
  return '';
}
export const isLoggedIn = (req, env) => passwordOk(env) && checkToken(cookieFrom(req), env.ADMIN_PASSWORD);
export const sessionCookie = (t) => `${COOKIE}=${t}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
export const clearCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
export const clientIp = (req) => (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();

// Failed-login lockout, kept in the store so it survives between function runs.
const lockKey = (ip) => 'lock/' + sha(ip).toString('hex').slice(0, 24);
export async function lockedMinutes(store, ip, now = Date.now()) {
  const r = await store.get(lockKey(ip), { type: 'json' });
  return r && r.until > now ? Math.ceil((r.until - now) / 60000) : 0;
}
export async function recordFail(store, ip, now = Date.now()) {
  let r = await store.get(lockKey(ip), { type: 'json' });
  if (!r || (r.until && r.until <= now) || now - r.first > LOCK_MS) r = { count: 0, first: now, until: 0 };
  r.count += 1;
  if (r.count >= MAX_FAILS) r.until = now + LOCK_MS;
  await store.setJSON(lockKey(ip), r);
  return r;
}
export const clearFails = (store, ip) => store.delete(lockKey(ip));
