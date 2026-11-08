import { svg } from './icons.mjs';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (t, c) => String(t ?? '').replace(/\{(phone|town|name|region)\}/g, (m, k) => c.business[k] || '');
const paras = (t, c) => fill(t, c).split(/\n+/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('');
const ldJson = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const waLink = (c, text) => `https://wa.me/${c.business.whatsapp}?text=${encodeURIComponent(text)}`;
const telLink = (c) => 'tel:+' + c.business.whatsapp;

export const baseUrl = (c, origin) => (c.seo.domain || origin || '').replace(/\/$/, '');
const hasPhotos = (c) => c.gallery.length > 0;
const regionText = (c) => `${c.business.town}${c.business.region ? ', ' + c.business.region : ''}`;

function layout(c, o) {
  const b = c.business, base = baseUrl(c, o.origin), canonical = base + o.path;
  const robots = o.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  const img = hasPhotos(c) ? c.gallery[0].url : '';
  const nav = [
    ['/', 'Home'], ['/#about', 'About'], ['/#services', 'Services'],
    ...(hasPhotos(c) ? [['/gallery.html', 'Gallery']] : []), ['/#areas', 'Areas'], ['/#contact', 'Contact'],
  ];
  return `<!DOCTYPE html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="geo.region" content="ZA-WC">
<meta name="geo.placename" content="${esc(b.town)}">
<meta name="geo.position" content="${esc(b.lat)};${esc(b.lng)}">
<meta name="ICBM" content="${esc(b.lat)}, ${esc(b.lng)}">
<meta name="theme-color" content="#14161a">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_ZA">
<meta property="og:site_name" content="${esc(b.name)}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${esc(canonical)}">
${img ? `<meta property="og:image" content="${esc(img)}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<link rel="stylesheet" href="/css/site.css">
<script src="/js/site.js" defer></script>
${(o.ld || []).map(ldJson).join('\n')}
</head>
<body>
${o.preview ? '<div class="preview-bar" role="status">PREVIEW of your saved draft. This is not live yet and search engines cannot see it. <a href="/admin/">Back to admin</a></div>' : ''}
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="/" aria-label="${esc(b.name)} home"><span class="mark" aria-hidden="true">R</span><span class="bname"><b>${esc(b.name.split(" ")[0])}</b><span>${esc(b.name.split(" ").slice(1).join(" "))}</span></span></a>
    <nav id="nav" class="nav" aria-label="Main">
      ${nav.map(([h, t]) => h === '/#services'
        ? `<div class="dd"><a href="/#services"${h === o.active ? ' aria-current="page"' : ''}>Services</a><div class="dd-menu">${c.services.map((s) => `<a href="/services/${esc(s.slug)}.html">${esc(s.name)}</a>`).join('')}</div></div>`
        : `<a href="${h}"${h === o.active ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
      <a class="btn btn-sm nav-cta" href="${telLink(c)}">${svg('phone')}<span>${esc(b.phone)}</span></a>
    </nav>
    <button class="icon-btn" id="theme" type="button" aria-label="Switch light or dark mode">${svg('sun', 'ico i-sun')}${svg('moon', 'ico i-moon')}</button>
    <button class="icon-btn burger" id="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav">${svg('menu')}</button>
  </div>
</header>
<main id="main">
${o.body}
</main>
<footer class="site-footer">
  <div class="wrap foot-grid">
    <div><p class="foot-brand">${esc(b.name)}</p><p>${esc(fill(b.tagline, c))}</p>
      <p><a href="${telLink(c)}">${esc(b.phone)}</a>${b.email ? ` &middot; <a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : ''}</p></div>
    <div><p class="foot-h">Services</p><ul class="plain">${c.services.map((s) => `<li><a href="/services/${esc(s.slug)}.html">${esc(s.name)}</a></li>`).join('')}</ul></div>
    <div><p class="foot-h">Areas served</p><ul class="plain">${c.areas.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
  </div>
  <div class="wrap copy">&copy; ${new Date().getFullYear()} ${esc(b.name)}. ${esc(regionText(c))}.</div>
</footer>
<a class="wa-float" href="${esc(waLink(c, `Hello ${b.name}, I would like a quote.`))}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">${svg('whatsapp', 'ico')}</a>
<noscript><style>.reveal{opacity:1!important;transform:none!important}</style></noscript>
</body>
</html>`;
}

const badge = (icon) => `<span class="badge">${svg(icon)}</span>`;

function businessLd(c, base) {
  const b = c.business;
  return {
    '@context': 'https://schema.org', '@type': 'GeneralContractor', '@id': base + '/#business',
    name: b.name, url: base + '/', telephone: '+' + b.whatsapp, ...(b.email ? { email: b.email } : {}),
    description: fill(c.seo.homeDescription, c),
    ...(hasPhotos(c) ? { image: c.gallery[0].url } : {}),
    address: { '@type': 'PostalAddress', ...(b.address ? { streetAddress: b.address } : {}), addressLocality: b.town, addressRegion: b.region, addressCountry: 'ZA' },
    geo: { '@type': 'GeoCoordinates', latitude: Number(b.lat), longitude: Number(b.lng) },
    areaServed: c.areas.map((a) => ({ '@type': 'Place', name: a })),
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Services', itemListElement: c.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: `${base}/services/${s.slug}.html` } })) },
  };
}

function quoteForm(c, selected = '') {
  return `<form class="quote-form" data-wa="${esc(c.business.whatsapp)}" data-biz="${esc(c.business.name)}" novalidate>
  <div class="field"><label for="q-name">Your name</label><input id="q-name" name="name" autocomplete="name" required></div>
  <div class="field"><label for="q-phone">Your phone number</label><input id="q-phone" name="phone" type="tel" autocomplete="tel" required></div>
  <div class="field"><label for="q-service">Service needed</label><select id="q-service" name="service">${c.services.map((s) => `<option${s.name === selected ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}<option>Other or not sure</option></select></div>
  <div class="field"><label for="q-msg">Tell us about the job</label><textarea id="q-msg" name="message" rows="4"></textarea></div>
  <button class="btn" type="submit">${svg('whatsapp')}<span>Send quote request on WhatsApp</span></button>
  <p class="fine">This opens WhatsApp with your message ready to send. Nothing is sent until you press send in WhatsApp.</p>
  <p class="form-err" role="alert" hidden></p>
</form>`;
}

export function renderHome(c, o = {}) {
  const b = c.business, base = baseUrl(c, o.origin);
  const photos = c.gallery.slice(0, 6);
  const body = `
<section class="hero">
  <div class="shape s1"></div><div class="shape s2"></div><div class="shape s3"></div>
  <div class="wrap hero-in">
    ${c.hero.eyebrow ? `<p class="eyebrow">${esc(fill(c.hero.eyebrow, c))}</p>` : ''}
    <h1>${esc(fill(c.hero.heading, c))}</h1>
    <p class="lead">${esc(fill(c.hero.text, c))}</p>
    <div class="cta-row">
      <a class="btn" href="${telLink(c)}">${svg('phone')}<span>${esc(fill(c.hero.primaryCta, c))}</span></a>
      <a class="btn btn-ghost" href="${esc(waLink(c, `Hello ${b.name}, I would like a quote.`))}" target="_blank" rel="noopener">${svg('whatsapp')}<span>${esc(fill(c.hero.secondaryCta, c))}</span></a>
    </div>
    ${b.ctaText ? `<p class="hero-note">${esc(b.ctaText)}</p>` : ''}
  </div>
</section>
${c.stats.length ? `<section class="stats" aria-label="At a glance"><div class="wrap stats-in">${c.stats.map((s) => `<div class="stat"><span class="num" data-count="${s.value}" data-suffix="${esc(s.suffix)}">${s.value}${esc(s.suffix)}</span><span class="lbl">${esc(s.label)}</span></div>`).join('')}</div></section>` : ''}
<section class="section" id="about"><div class="wrap split">
  <div class="reveal"><p class="kicker">About us</p><h2>${esc(fill(c.about.heading, c))}</h2>${paras(c.about.text, c)}</div>
  ${c.about.points.length ? `<ul class="ticks reveal">${c.about.points.map((p) => `<li>${svg('check')}<span>${esc(p)}</span></li>`).join('')}</ul>` : ''}
</div></section>
<section class="section alt" id="services"><div class="wrap">
  <p class="kicker">What we do</p><h2>Our services</h2>
  <div class="grid">${c.services.map((s) => `<a class="card svc reveal" href="/services/${esc(s.slug)}.html">${badge(s.icon)}<h3>${esc(s.name)}</h3><p>${esc(fill(s.short, c))}</p><span class="more">View service ${svg('arrow')}</span></a>`).join('')}</div>
</div></section>
${c.projects.length ? `<section class="section" id="projects"><div class="wrap"><p class="kicker">Our work</p><h2>Projects</h2><div class="grid">${c.projects.map((p) => `<article class="card reveal"><h3>${esc(p.title)}</h3>${p.location ? `<p class="meta">${esc(p.location)}</p>` : ''}${p.text ? `<p>${esc(p.text)}</p>` : ''}</article>`).join('')}</div></div></section>` : ''}
${c.accreditations.length ? `<section class="section alt" id="accreditations"><div class="wrap"><p class="kicker">Trust</p><h2>Accreditations</h2><div class="grid">${c.accreditations.map((a) => `<div class="card reveal">${badge('shield')}<h3>${esc(a.name)}</h3>${a.detail ? `<p>${esc(a.detail)}</p>` : ''}</div>`).join('')}</div></div></section>` : ''}
${photos.length ? `<section class="section" id="gallery"><div class="wrap"><p class="kicker">Gallery</p><h2>Recent work</h2>
  <div class="gallery">${photos.map(galleryItem).join('')}</div>
  <p class="center"><a class="btn" href="/gallery.html">View all photos</a></p></div></section>` : ''}
<section class="section ${photos.length ? 'alt' : ''}" id="areas"><div class="wrap"><p class="kicker">Where we work</p><h2>Areas served</h2>
  <ul class="chips">${c.areas.map((a) => `<li>${svg('pin')}${esc(a)}</li>`).join('')}</ul></div></section>
<section class="section ${photos.length ? '' : 'alt'}" id="contact"><div class="wrap split">
  <div class="reveal"><p class="kicker">Contact</p><h2>Call or WhatsApp for a quote</h2>
    ${b.ctaText ? `<p>${esc(b.ctaText)}.</p>` : ''}
    <ul class="contact-list">
      <li>${svg('phone')}<a href="${telLink(c)}">${esc(b.phone)}</a></li>
      <li>${svg('whatsapp')}<a href="${esc(waLink(c, `Hello ${b.name}, I would like a quote.`))}" target="_blank" rel="noopener">WhatsApp us</a></li>
      ${b.email ? `<li>${svg('mail')}<a href="mailto:${esc(b.email)}">${esc(b.email)}</a></li>` : ''}
      <li>${svg('pin')}<span>${esc(b.address ? b.address + ', ' : '')}${esc(regionText(c))}</span></li>
    </ul></div>
  <div class="card reveal">${quoteForm(c)}<noscript><p>Please call ${esc(b.phone)} or use the WhatsApp button.</p></noscript></div>
</div></section>`;
  return layout(c, {
    ...o, path: '/', active: '/', body,
    title: fill(c.seo.homeTitle, c), description: fill(c.seo.homeDescription, c),
    ld: [businessLd(c, base)],
  });
}

function galleryItem(g) {
  return `<button class="g-item" type="button" data-full="${esc(g.url)}" data-cap="${esc(g.caption)}" data-cat="${esc(g.category)}"><img src="${esc(g.url)}" alt="${esc(g.alt || g.caption || g.category || 'Completed work photo')}" loading="lazy" decoding="async"></button>`;
}

export function renderGallery(c, o = {}) {
  const base = baseUrl(c, o.origin);
  const cats = [...new Set(c.gallery.map((g) => g.category).filter(Boolean))];
  const body = `
<section class="page-head"><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <span>Gallery</span></nav>
  <h1>Gallery: Our Work in ${esc(c.business.town)} &amp; the Cape Winelands</h1>
  <p class="lead">Photos of work by ${esc(c.business.name)}. Tap a photo to enlarge it.</p></div></section>
<section class="section"><div class="wrap">
  ${cats.length > 1 ? `<div class="filters" role="group" aria-label="Filter photos"><button type="button" class="chip on" data-filter="">All</button>${cats.map((x) => `<button type="button" class="chip" data-filter="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
  <div class="gallery big">${c.gallery.map(galleryItem).join('')}</div>
</div></section>`;
  const title = `Gallery | ${c.business.name}, ${c.business.town}`;
  const description = `Photos of completed work by ${c.business.name} in ${c.business.town} and the Cape Winelands.`;
  return layout(c, {
    ...o, path: '/gallery.html', active: '/gallery.html', body, title, description,
    ld: [{ '@context': 'https://schema.org', '@type': 'ImageGallery', name: title, url: base + '/gallery.html', image: c.gallery.map((g) => ({ '@type': 'ImageObject', contentUrl: g.url, ...(g.caption ? { caption: g.caption } : {}) })) }],
  });
}

export function renderService(c, s, o = {}) {
  const b = c.business, base = baseUrl(c, o.origin), url = `${base}/services/${s.slug}.html`;
  const others = c.services.filter((x) => x.id !== s.id);
  const msg = `Hello ${b.name}, I would like a quote for ${s.name}.`;
  const body = `
<section class="page-head"><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/#services">Services</a> / <span>${esc(s.name)}</span></nav>
  <div class="head-row">${badge(s.icon)}<h1>${esc(fill(s.heading, c))}</h1></div>
  <div class="cta-row"><a class="btn" href="${esc(waLink(c, msg))}" target="_blank" rel="noopener">${svg('whatsapp')}<span>Get a ${esc(s.name)} quote on WhatsApp</span></a><a class="btn btn-ghost" href="${telLink(c)}">${svg('phone')}<span>${esc(b.phone)}</span></a></div></div></section>
<section class="section"><div class="wrap split">
  <div>${paras(s.text, c)}</div>
  ${s.bullets.length ? `<div class="card"><h2 class="h3">What we offer</h2><ul class="ticks">${s.bullets.map((x) => `<li>${svg('check')}<span>${esc(x)}</span></li>`).join('')}</ul></div>` : ''}
</div></section>
${s.faqs.length ? `<section class="section alt"><div class="wrap narrow"><h2>${esc(s.name)}: frequently asked questions</h2>${s.faqs.map((q) => `<details class="faq"><summary>${esc(fill(q.q, c))}</summary><p>${esc(fill(q.a, c))}</p></details>`).join('')}</div></section>` : ''}
<section class="section"><div class="wrap"><h2>Why choose ${esc(b.name)}</h2>
  <div class="grid three">
    <div class="card">${badge('phone')}<h3>One number</h3><p>Call or WhatsApp ${esc(b.phone)} to discuss your job directly.</p></div>
    <div class="card">${badge('home')}<h3>Local to ${esc(b.town)}</h3><p>Based in ${esc(b.town)} and working across the Cape Winelands.</p></div>
    <div class="card">${badge('wrench')}<h3>Many trades, one contact</h3><p>${c.services.length} maintenance and building services, so one call can cover several jobs.</p></div>
  </div></div></section>
<section class="section alt"><div class="wrap"><h2>Areas served</h2><ul class="chips">${c.areas.map((a) => `<li>${svg('pin')}${esc(a)}</li>`).join('')}</ul></div></section>
${others.length ? `<section class="section"><div class="wrap"><h2>Other services</h2><ul class="chips links">${others.map((x) => `<li><a href="/services/${esc(x.slug)}.html">${esc(x.name)}</a></li>`).join('')}</ul></div></section>` : ''}
<section class="section alt"><div class="wrap split"><div><h2>Request a ${esc(s.name)} quote</h2><p>${esc(b.ctaText || 'Call or WhatsApp us to discuss your job.')}</p></div><div class="card">${quoteForm(c, s.name)}</div></div></section>`;
  const title = `${s.heading} | ${b.name}`;
  const description = s.description || `${s.name} in ${b.town} and the Cape Winelands. Call or WhatsApp ${b.phone}.`;
  return layout(c, {
    ...o, path: `/services/${s.slug}.html`, active: '/#services', body, title, description,
    ld: [
      { '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: s.name, description, url,
        provider: { '@type': 'GeneralContractor', '@id': base + '/#business', name: b.name, telephone: '+' + b.whatsapp },
        areaServed: c.areas.map((a) => ({ '@type': 'Place', name: a })) },
      ...(s.faqs.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: s.faqs.map((q) => ({ '@type': 'Question', name: fill(q.q, c), acceptedAnswer: { '@type': 'Answer', text: fill(q.a, c) } })) }] : []),
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: base + '/' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: base + '/#services' },
        { '@type': 'ListItem', position: 3, name: s.name, item: url } ] },
    ],
  });
}

export function renderNotFound(c, o = {}) {
  const body = `<section class="page-head"><div class="wrap narrow center"><p class="kicker">Error 404</p><h1>This page could not be found</h1>
  <p class="lead">The page may have moved or no longer exists. You can go back to the home page, or call ${esc(c.business.phone)} and we will help.</p>
  <div class="cta-row center-row"><a class="btn" href="/">Back to home</a><a class="btn btn-ghost" href="/#services">See our services</a></div></div></section>`;
  return layout(c, { ...o, path: '/404', active: '', noindex: true, body, title: `Page not found | ${c.business.name}`, description: 'Page not found.' });
}

export function renderSitemap(c, o = {}) {
  const base = baseUrl(c, o.origin), last = c.updatedAt ? c.updatedAt.slice(0, 10) : '';
  const u = (p, pr) => `  <url><loc>${esc(base + p)}</loc>${last ? `<lastmod>${last}</lastmod>` : ''}<priority>${pr}</priority></url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[u('/', '1.0'), ...c.services.map((s) => u(`/services/${s.slug}.html`, '0.8')), ...(hasPhotos(c) ? [u('/gallery.html', '0.5')] : [])].join('\n')}\n</urlset>\n`;
}

export function renderRobots(c, o = {}) {
  return `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${baseUrl(c, o.origin)}/sitemap.xml\n`;
}
