import { DEFAULTS } from './defaults.mjs';
import { ICON_NAMES } from './icons.mjs';

export const LIMITS = { services: 30, faqs: 8, bullets: 20, stats: 8, gallery: 200, projects: 30, accreditations: 20, areas: 40 };
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

// Plain text only: control characters, tags and angle brackets are removed.
export function str(v, max = 200, multiline = false) {
  if (v === undefined || v === null || typeof v === 'object') return '';
  let s = String(v).replace(CTRL, '').replace(/\r\n?/g, '\n');
  s = s.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
  if (!multiline) s = s.replace(/\s*\n\s*/g, ' ');
  else s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim().slice(0, max);
}

export function cleanUrl(v, max = 600) {
  const s = str(v, max + 50);
  if (!s) return '';
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    if (u.username || u.password) return '';
    return u.href.length > max ? '' : u.href;
  } catch { return ''; }
}

export function slugify(v) {
  return String(v || '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/g, '');
}

function cleanDomain(v) {
  const s = str(v, 200);
  if (!s) return '';
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s);
    if (!/^[a-z0-9.-]+$/i.test(u.hostname) || !u.hostname.includes('.')) return '';
    return u.origin;
  } catch { return ''; }
}

function cleanWhatsapp(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '27' + d.slice(1);
  return d.slice(0, 15);
}

const arr = (v) => (Array.isArray(v) ? v : []);
const has = (o, k) => o && typeof o === 'object' && o[k] !== undefined;
const num = (v, d = 0) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(Math.max(n, 0), 1e9) : d; };
const coord = (v, d) => { const n = Number(v); return Number.isFinite(n) ? String(n) : d; };
const rid = () => 's' + Math.random().toString(36).slice(2, 8);

export const BAD_HOSTS = ['drive.google.com', 'photos.google.com', 'photos.app.goo.gl', 'googleusercontent.com', 'facebook.com', 'fbcdn.net', 'fb.com', 'instagram.com', 'cdninstagram.com', 'whatsapp.com', 'whatsapp.net'];
export function badHost(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return BAD_HOSTS.find((b) => h === b || h.endsWith('.' + b)) || '';
  } catch { return ''; }
}
export function photoWarnings(content) {
  return (content.gallery || []).map((g, i) => ({ index: i, host: badHost(g.url) })).filter((w) => w.host);
}

export function sanitizeContent(input, { lockedSlugs = {} } = {}) {
  const raw = input && typeof input === 'object' ? input : {};
  const D = DEFAULTS;
  const sect = (k) => (raw[k] && typeof raw[k] === 'object' && !Array.isArray(raw[k]) ? raw[k] : {});
  const f = (o, k, d, max, ml) => (has(o, k) ? str(o[k], max, ml) : d);

  const b = sect('business'), bd = D.business;
  const wa = has(b, 'whatsapp') ? cleanWhatsapp(b.whatsapp) : bd.whatsapp;
  const email = has(b, 'email') ? str(b.email, 120) : bd.email;
  const business = {
    name: f(b, 'name', bd.name, 80) || bd.name,
    tagline: f(b, 'tagline', bd.tagline, 140),
    phone: has(b, 'phone') ? String(b.phone).replace(/[^0-9+() -]/g, '').trim().slice(0, 30) : bd.phone,
    whatsapp: wa,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '',
    town: f(b, 'town', bd.town, 60) || bd.town,
    region: f(b, 'region', bd.region, 60),
    lat: coord(b.lat, bd.lat), lng: coord(b.lng, bd.lng),
    address: f(b, 'address', bd.address, 160),
    ctaText: f(b, 'ctaText', bd.ctaText, 160),
  };

  const h = sect('hero'), hd = D.hero;
  const hero = {
    eyebrow: f(h, 'eyebrow', hd.eyebrow, 80),
    heading: f(h, 'heading', hd.heading, 120) || hd.heading,
    text: f(h, 'text', hd.text, 400, true),
    primaryCta: f(h, 'primaryCta', hd.primaryCta, 60),
    secondaryCta: f(h, 'secondaryCta', hd.secondaryCta, 60),
  };

  const a = sect('about'), ad = D.about;
  const about = {
    heading: f(a, 'heading', ad.heading, 120),
    text: f(a, 'text', ad.text, 2500, true),
    points: has(a, 'points') ? arr(a.points).map((p) => str(p, 140)).filter(Boolean).slice(0, 8) : ad.points,
  };

  const stats = (has(raw, 'stats') ? arr(raw.stats) : D.stats).slice(0, LIMITS.stats)
    .map((s) => ({ value: num(s && s.value), suffix: str(s && s.suffix, 8), label: str(s && s.label, 40) }))
    .filter((s) => s.label);

  // services: stable id, locked slug for already-published services
  const seenId = new Set(), seenSlug = new Set();
  const services = (has(raw, 'services') ? arr(raw.services) : D.services).slice(0, LIMITS.services).map((s) => {
    s = s && typeof s === 'object' ? s : {};
    const name = str(s.name, 80);
    if (!name) return null;
    let id = typeof s.id === 'string' && /^[a-z0-9-]{1,50}$/.test(s.id) ? s.id : rid();
    while (seenId.has(id)) id = rid();
    seenId.add(id);
    let slug = lockedSlugs[id] || slugify(s.slug) || slugify(name) || id;
    let base = slug, n = 2;
    while (seenSlug.has(slug)) slug = `${base}-${n++}`;
    seenSlug.add(slug);
    return {
      id, slug, name,
      heading: str(s.heading, 120) || name,
      short: str(s.short, 200),
      text: str(s.text, 2500, true),
      bullets: arr(s.bullets).map((x) => str(x, 140)).filter(Boolean).slice(0, LIMITS.bullets),
      faqs: arr(s.faqs).map((q) => ({ q: str(q && q.q, 160), a: str(q && q.a, 800, true) })).filter((q) => q.q && q.a).slice(0, LIMITS.faqs),
      icon: ICON_NAMES.includes(s.icon) ? s.icon : 'wrench',
      description: str(s.description, 170),
    };
  }).filter(Boolean);

  const projects = arr(raw.projects).slice(0, LIMITS.projects)
    .map((p) => ({ title: str(p && p.title, 100), location: str(p && p.location, 80), text: str(p && p.text, 600, true) }))
    .filter((p) => p.title);
  const accreditations = arr(raw.accreditations).slice(0, LIMITS.accreditations)
    .map((p) => ({ name: str(p && p.name, 100), detail: str(p && p.detail, 200) }))
    .filter((p) => p.name);
  const gallery = arr(raw.gallery).slice(0, LIMITS.gallery)
    .map((g) => ({ url: cleanUrl(g && g.url), caption: str(g && g.caption, 140), category: str(g && g.category, 40), alt: str(g && g.alt, 160) }))
    .filter((g) => g.url);
  const areas = (has(raw, 'areas') ? arr(raw.areas) : D.areas).map((x) => str(x, 60)).filter(Boolean).slice(0, LIMITS.areas);

  const s = sect('seo'), sd = D.seo;
  const seo = {
    domain: has(s, 'domain') ? cleanDomain(s.domain) : sd.domain,
    homeTitle: f(s, 'homeTitle', sd.homeTitle, 70),
    homeDescription: f(s, 'homeDescription', sd.homeDescription, 170),
  };

  const t = Date.parse(raw.updatedAt);
  return { business, hero, about, stats, services, projects, accreditations, gallery, areas, seo, updatedAt: Number.isFinite(t) ? new Date(t).toISOString() : '' };
}

// Human-readable list of what will change when a draft is published.
export function summarize(live, draft) {
  const out = [];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const names = { business: 'Business details', hero: 'Homepage hero', about: 'About section', stats: 'Statistics', projects: 'Projects', accreditations: 'Accreditations', areas: 'Areas served', seo: 'Search (SEO) settings' };
  for (const k of Object.keys(names)) if (!same(live[k], draft[k])) out.push(`${names[k]} changed`);
  const L = new Map(live.services.map((s) => [s.id, s])), Dm = new Map(draft.services.map((s) => [s.id, s]));
  for (const s of draft.services) if (!L.has(s.id)) out.push(`New service page: ${s.name} (/services/${s.slug}.html)`);
  for (const s of live.services) if (!Dm.has(s.id)) out.push(`Service page removed: ${s.name} (/services/${s.slug}.html will show 404)`);
  for (const s of draft.services) if (L.has(s.id) && !same(L.get(s.id), s)) out.push(`Service edited: ${s.name}`);
  if (!same(live.services.map((s) => s.id), draft.services.map((s) => s.id)) && live.services.length === draft.services.length && draft.services.every((s) => L.has(s.id))) out.push('Service order changed');
  if (!same(live.gallery, draft.gallery)) {
    const lu = new Set(live.gallery.map((g) => g.url)), du = new Set(draft.gallery.map((g) => g.url));
    const added = draft.gallery.filter((g) => !lu.has(g.url)).length, removed = live.gallery.filter((g) => !du.has(g.url)).length;
    out.push(`Gallery changed: ${added} photo(s) added, ${removed} removed (${draft.gallery.length} in total)`);
  }
  return out;
}
