(function () {
  'use strict';
  var app = document.getElementById('app'), S = { tab: 'business', dirty: false };
  var TABS = [['business', 'Business details'], ['home', 'Homepage'], ['services', 'Services'], ['projects', 'Projects'], ['accred', 'Accreditations'], ['gallery', 'Gallery'], ['seo', 'Search'], ['versions', 'Earlier versions']];
  var BAD = ['drive.google.com', 'photos.google.com', 'photos.app.goo.gl', 'googleusercontent.com', 'facebook.com', 'fbcdn.net', 'fb.com', 'instagram.com', 'cdninstagram.com', 'whatsapp.com', 'whatsapp.net'];

  function h(tag, attrs) {
    var el = document.createElement(tag);
    for (var k in (attrs || {})) { var v = attrs[k]; if (k === 'class') el.className = v; else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v); else if (v === true) el.setAttribute(k, ''); else if (v !== false && v != null) el.setAttribute(k, v); }
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; if (Array.isArray(c)) c.forEach(function (x) { if (x) el.appendChild(x); }); else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
    return el;
  }
  function toast(msg, bad) { var t = document.getElementById('toast'); t.textContent = msg; t.className = bad ? 'err' : ''; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 4200); }
  function api(action, body) {
    var o = { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: { 'X-Admin-Request': '1' } };
    if (body !== undefined) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(body); }
    return fetch('/api/admin/' + action, o).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Something went wrong'); e.status = r.status; throw e; } return j; }); });
  }
  function fail(e) { if (e.status === 401 && S.loggedIn) { S.loggedIn = false; start(); } toast(e.message, true); }
  function dirty() { S.dirty = true; var s = document.getElementById('status'); if (s) { s.textContent = 'Unsaved changes'; s.className = 'status dirty'; } }
  window.addEventListener('beforeunload', function (e) { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ----- form helpers -----
  function field(label, obj, key, o) {
    o = o || {};
    var inp = o.area ? h('textarea', { rows: o.rows || 4 }) : h('input', { type: o.type || 'text' });
    inp.value = obj[key] == null ? '' : obj[key];
    if (o.disabled) inp.disabled = true;
    inp.addEventListener('input', function () { obj[key] = o.num ? Number(inp.value) || 0 : inp.value; dirty(); });
    return h('div', null, h('label', null, label), inp, o.hint ? h('p', { class: 'hint' }, o.hint) : null);
  }
  function lines(label, obj, key, hint) {
    var t = h('textarea', { rows: 5 }); t.value = (obj[key] || []).join('\n');
    t.addEventListener('input', function () { obj[key] = t.value.split('\n'); dirty(); });
    return h('div', null, h('label', null, label), t, h('p', { class: 'hint' }, hint || 'One per line.'));
  }
  function swap(a, i, j) { var t = a[i]; a[i] = a[j]; a[j] = t; }
  // list of cards with up/down/delete
  function listEditor(arr, make, body, o) {
    o = o || {}; var box = h('div');
    function draw() {
      box.innerHTML = '';
      arr.forEach(function (it, i) {
        box.appendChild(h('div', { class: 'item' },
          h('div', { class: 'item-h' }, h('h3', null, (o.title ? o.title(it) : '') || (o.noun + ' ' + (i + 1))),
            h('button', { type: 'button', class: 'sm', 'aria-label': 'Move up', disabled: i === 0, onclick: function () { swap(arr, i, i - 1); dirty(); draw(); } }, 'Up'),
            h('button', { type: 'button', class: 'sm', 'aria-label': 'Move down', disabled: i === arr.length - 1, onclick: function () { swap(arr, i, i + 1); dirty(); draw(); } }, 'Down'),
            h('button', { type: 'button', class: 'sm danger', onclick: function () { if (!o.confirm || confirm(o.confirm(it))) { arr.splice(i, 1); dirty(); draw(); } } }, 'Delete')),
          body(it, i)));
      });
      box.appendChild(h('button', { type: 'button', onclick: function () { arr.push(make()); dirty(); draw(); } }, '+ Add ' + o.noun.toLowerCase()));
    }
    draw(); return box;
  }
  var panel = function () { var p = h('div', { class: 'panel' }); [].slice.call(arguments).forEach(function (c) { if (c) p.appendChild(c); }); return p; };

  // ----- tabs -----
  var T = {};
  T.business = function (c) {
    var b = c.business;
    return [panel(h('h2', null, 'Business details'),
      h('div', { class: 'row' }, field('Business name', b, 'name'), field('Tagline', b, 'tagline')),
      h('div', { class: 'row' }, field('Phone (as shown)', b, 'phone'), field('WhatsApp number (digits, e.g. 27713123993)', b, 'whatsapp'), field('Email', b, 'email')),
      h('div', { class: 'row' }, field('Town', b, 'town'), field('Province', b, 'region'), field('Street address (optional)', b, 'address')),
      h('div', { class: 'row' }, field('Latitude (town centre)', b, 'lat'), field('Longitude (town centre)', b, 'lng')),
      field('Call-to-action line', b, 'ctaText')),
    panel(h('h2', null, 'Areas served'), lines('Areas', c, 'areas', 'One per line. These are suggestions - confirm with the owner.'))];
  };
  T.home = function (c) {
    return [panel(h('h2', null, 'Hero'), field('Small line above heading', c.hero, 'eyebrow'), field('Main heading (H1)', c.hero, 'heading', { hint: 'Keep your town in it for search engines.' }), field('Intro text', c.hero, 'text', { area: true }),
      h('div', { class: 'row' }, field('Call button text', c.hero, 'primaryCta', { hint: '{phone} is replaced by the real number.' }), field('WhatsApp button text', c.hero, 'secondaryCta'))),
    panel(h('h2', null, 'About'), field('Heading', c.about, 'heading'), field('Text', c.about, 'text', { area: true, rows: 6, hint: 'New line = new paragraph. Replace the [PLACEHOLDER] text with your own story.' }), lines('Bullet points', c.about, 'points')),
    panel(h('h2', null, 'Statistics'), h('p', { class: 'hint' }, 'Only use true numbers. They count up on the home page.'),
      listEditor(c.stats, function () { return { value: 0, suffix: '', label: 'New statistic' }; }, function (s) { return h('div', { class: 'row' }, field('Number', s, 'value', { num: true, type: 'number' }), field('After number (e.g. +)', s, 'suffix'), field('Label', s, 'label')); }, { noun: 'Statistic', title: function (s) { return s.label; } }))];
  };
  T.services = function (c) {
    var icons = S.icons || {};
    return [panel(h('h2', null, 'Services'), h('p', { class: 'hint' }, 'Each service has its own page. The web address is locked once the service has been published, so Google links never break. Use {phone}, {name}, {town} in text to insert business details.'),
      listEditor(c.services, function () { return { id: 's' + Math.random().toString(36).slice(2, 8), slug: '', name: 'New service', heading: '', short: '', text: '', bullets: [], faqs: [], icon: 'wrench', description: '' }; }, function (s) {
        var locked = !!S.locked[s.id];
        var picker = h('div', { class: 'icons' });
        Object.keys(icons).forEach(function (n) { var b = h('button', { type: 'button', title: n, class: s.icon === n ? 'on' : '', onclick: function () { s.icon = n; dirty(); [].slice.call(picker.children).forEach(function (x) { x.classList.toggle('on', x.title === n); }); } }); b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + icons[n] + '</svg>'; picker.appendChild(b); });
        return h('div', null,
          h('div', { class: 'row' }, field('Service name', s, 'name'), field('Web address (slug)', s, 'slug', { disabled: locked, hint: locked ? 'Locked: already published as /services/' + S.locked[s.id] + '.html' : 'Letters, numbers and hyphens. Page will be /services/<this>.html. Cannot be changed after publishing.' })),
          field('Page heading (H1)', s, 'heading', { hint: 'Example: Plumber in Stellenbosch & the Cape Winelands' }),
          field('Short text (shown on the home page card)', s, 'short'), field('Main text', s, 'text', { area: true, rows: 5 }),
          lines('What we offer (bullet list)', s, 'bullets'),
          h('label', null, 'Questions and answers (FAQ)'), listEditor(s.faqs, function () { return { q: '', a: '' }; }, function (q) { return h('div', null, field('Question', q, 'q'), field('Answer', q, 'a', { area: true, rows: 3 })); }, { noun: 'Question', title: function (q) { return q.q; } }),
          field('Google description (max 170 characters)', s, 'description', { area: true, rows: 2 }),
          h('label', null, 'Icon'), picker);
      }, { noun: 'Service', title: function (s) { return s.name; }, confirm: function (s) { return 'Delete "' + s.name + '"? Its page will show 404 after you publish.'; } }))];
  };
  T.projects = function (c) {
    return [panel(h('h2', null, 'Projects'), h('p', { class: 'hint' }, 'Only add real projects. The section is hidden on the website while this list is empty.'),
      listEditor(c.projects, function () { return { title: '', location: '', text: '' }; }, function (p) { return h('div', null, h('div', { class: 'row' }, field('Project title', p, 'title'), field('Location', p, 'location')), field('Description', p, 'text', { area: true, rows: 3 })); }, { noun: 'Project', title: function (p) { return p.title; } }))];
  };
  T.accred = function (c) {
    return [panel(h('h2', null, 'Accreditations'), h('p', { class: 'hint' }, 'Only add registrations or memberships you really hold. Hidden while empty.'),
      listEditor(c.accreditations, function () { return { name: '', detail: '' }; }, function (a) { return h('div', { class: 'row' }, field('Name', a, 'name'), field('Detail (e.g. number)', a, 'detail')); }, { noun: 'Accreditation', title: function (a) { return a.name; } }))];
  };
  T.seo = function (c) {
    return [panel(h('h2', null, 'Search settings'), field('Website address (domain)', c.seo, 'domain', { hint: 'Example: https://www.yourdomain.co.za - used for canonical links, the sitemap and social sharing. Leave empty until the domain is connected.' }),
      field('Home page title (max 70 characters)', c.seo, 'homeTitle'), field('Home page description (max 170 characters)', c.seo, 'homeDescription', { area: true, rows: 3 }),
      h('p', { class: 'hint' }, 'Each service page title and description come from the Services tab.'))];
  };
  function badHost(u) { try { var x = new URL(u).hostname.toLowerCase(); return BAD.filter(function (b) { return x === b || x.slice(-b.length - 1) === '.' + b; })[0] || ''; } catch (e) { return ''; } }
  T.gallery = function (c) {
    var ta = h('textarea', { rows: 6, placeholder: 'https://res.cloudinary.com/.../photo1.jpg\nhttps://res.cloudinary.com/.../photo2.jpg' }), cat = h('input', { placeholder: 'Category for these photos (optional), e.g. Roofing' }), box = h('div'), note = h('div');
    function draw() {
      box.innerHTML = '';
      note.innerHTML = '';
      var bad = c.gallery.filter(function (g) { return badHost(g.url); }).length;
      if (bad) note.appendChild(h('div', { class: 'warn' }, bad + ' photo link(s) come from Google Drive/Photos, Facebook, Instagram or WhatsApp. Those links usually stop working for website visitors. Upload the photos to Cloudinary (or similar image hosting) and paste the direct image links instead.'));
      box.appendChild(h('p', { class: 'muted' }, c.gallery.length + ' photo(s). The Gallery page appears on the website once at least one photo is published.'));
      box.appendChild(listEditor(c.gallery, function () { return { url: '', caption: '', category: '', alt: '' }; }, function (g) {
        var thumb = g.url ? h('img', { class: 'thumb', src: g.url, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }) : h('div', { class: 'nothumb' }, 'No link');
        if (g.url) thumb.addEventListener('error', function () { thumb.replaceWith(h('div', { class: 'nothumb' }, 'Cannot load')); });
        var f = h('div', { class: 'f' }, field('Image link (https://...)', g, 'url'), badHost(g.url) ? h('p', { class: 'err-t small' }, 'Warning: links from ' + badHost(g.url) + ' usually break. Use Cloudinary or similar.') : null,
          h('div', { class: 'row' }, field('Caption', g, 'caption'), field('Category', g, 'category')), field('Alt text (describe the photo, helps Google)', g, 'alt'));
        return h('div', { class: 'photo' }, thumb, f);
      }, { noun: 'Photo', title: function (g) { return g.caption || g.url.replace(/^https?:\/\//, '').slice(0, 60); } }));
    }
    draw();
    return [panel(h('h2', null, 'Add photos in bulk'), h('p', { class: 'hint' }, 'Paste image links, one per line (up to 200). Only http(s) links are accepted; anything else is dropped. Recommended hosting: Cloudinary or similar. Do not use Google Drive/Photos, Facebook, Instagram or WhatsApp links - they break.'), ta, cat,
      h('div', { class: 'btns' }, h('button', { type: 'button', class: 'pri', onclick: function () {
        var seen = {}; c.gallery.forEach(function (g) { seen[g.url] = 1; }); var added = 0, dropped = 0;
        ta.value.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).forEach(function (l) { var ok = false; try { var u = new URL(l); ok = /^https?:$/.test(u.protocol); } catch (e) {} if (!ok || seen[l] || c.gallery.length >= 200) { dropped++; return; } seen[l] = 1; c.gallery.push({ url: l, caption: '', category: cat.value.trim(), alt: '' }); added++; });
        ta.value = ''; dirty(); draw(); toast(added + ' photo(s) added' + (dropped ? ', ' + dropped + ' skipped (not a valid new http(s) link)' : '') + '. Remember to Save draft.');
      } }, 'Add these photos'))), panel(note, box)];
  };
  T.versions = function () {
    var p = panel(h('h2', null, 'Earlier versions'), h('p', { class: 'hint' }, 'A copy of the live site is saved every time you publish (last 20 kept). Loading one makes it your draft; nothing goes live until you Approve & Publish.'));
    if (!S.versions.length) p.appendChild(h('p', { class: 'muted' }, 'No earlier versions yet.'));
    S.versions.forEach(function (id) {
      var when = new Date(id.slice(0, 24)); var label = isNaN(when) ? id : when.toLocaleString();
      p.appendChild(h('div', { class: 'item-h item' }, h('h3', null, 'Live version replaced on ' + label), h('button', { type: 'button', onclick: function () { if (S.dirty && !confirm('You have unsaved changes. Replace them with this version?')) return; api('restore', { id: id }).then(function (r) { S.content = r.content; S.hasDraft = true; S.dirty = false; S.tab = 'home'; draw(); toast('Loaded as draft. Preview it, then Approve & Publish.'); }).catch(fail); } }, 'Load as draft')));
    });
    return [p];
  };

  // ----- actions -----
  function save(quiet) { return api('save-draft', { content: S.content }).then(function (r) { S.content = r.content; S.hasDraft = true; S.dirty = false; if (!quiet) { toast('Draft saved (private, not live).'); } refreshBar(); return r; }); }
  function refreshBar() { var s = document.getElementById('status'); if (!s) return; s.textContent = S.dirty ? 'Unsaved changes' : S.hasDraft ? 'Draft saved - not live yet' : 'Showing live content'; s.className = 'status ' + (S.dirty ? 'dirty' : S.hasDraft ? 'draft' : ''); }
  function modal(content) { var m = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'box' }, content)); document.body.appendChild(m); return m; }
  function publish() {
    save(true).then(function () { return api('summary'); }).then(function (s) {
      var m, list = s.changes.length ? h('ul', null, s.changes.map(function (x) { return h('li', null, x); })) : h('p', { class: 'muted' }, 'No differences from the live site.');
      m = modal([h('h2', null, 'Approve and publish?'), h('p', null, 'These changes will go live on your website:'), list, h('div', { class: 'btns' },
        h('button', { type: 'button', class: 'go', onclick: function () { api('publish', {}).then(function () { m.remove(); toast('Published. Your website is updated (can take up to a minute to show everywhere).'); return load(); }).catch(function (e) { m.remove(); fail(e); }); } }, 'Approve & Publish'),
        h('button', { type: 'button', onclick: function () { m.remove(); } }, 'Cancel'))]);
    }).catch(fail);
  }
  function preview() { var w = window.open('', '_blank'); (S.dirty || !S.hasDraft ? save(true) : Promise.resolve()).then(function () { if (w) w.location = '/?preview=1'; else toast('Pop-up blocked. Allow pop-ups, then press Preview again.', true); }).catch(function (e) { if (w) w.close(); fail(e); }); }

  // ----- render -----
  function draw() {
    app.innerHTML = '';
    var c = S.content;
    app.appendChild(h('div', { class: 'top' }, h('h1', null, 'Site admin'), h('span', { id: 'status', class: 'status' }), h('span', { class: 'sp' }),
      h('button', { type: 'button', onclick: function () { save().catch(fail); } }, 'Save draft'),
      h('button', { type: 'button', onclick: preview }, 'Preview'),
      h('button', { type: 'button', class: 'go', onclick: publish }, 'Approve & Publish'),
      h('button', { type: 'button', class: 'danger', disabled: !S.hasDraft, onclick: function () { if (!confirm('Discard your draft and go back to the live content?')) return; api('discard-draft', {}).then(function (r) { S.content = r.content; S.hasDraft = false; S.dirty = false; draw(); toast('Draft discarded.'); }).catch(fail); } }, 'Discard draft'),
      h('button', { type: 'button', onclick: function () { api('logout', {}).then(function () { S.loggedIn = false; start(); }); } }, 'Log out')));
    app.appendChild(h('div', { class: 'tabs', role: 'tablist' }, TABS.map(function (t) { return h('button', { type: 'button', role: 'tab', class: S.tab === t[0] ? 'on' : '', onclick: function () { S.tab = t[0]; draw(); } }, t[1]); })));
    app.appendChild(h('main', null, T[S.tab](c)));
    refreshBar();
  }
  function load() { return api('state').then(function (s) { S.content = s.content; S.hasDraft = s.hasDraft; S.locked = s.lockedSlugs; S.icons = s.icons; S.versions = s.versions; S.dirty = false; draw(); }).catch(fail); }
  function loginView(msg) {
    var pw = h('input', { type: 'password', autocomplete: 'current-password', 'aria-label': 'Password' }), err = h('p', { class: 'err-t', role: 'alert' }, msg || '');
    function go(e) { e.preventDefault(); api('login', { password: pw.value }).then(function () { S.loggedIn = true; return load(); }).catch(function (x) { err.textContent = x.message; }); }
    app.innerHTML = '';
    app.appendChild(h('form', { class: 'login', onsubmit: go }, h('h1', null, 'Site admin'), h('label', null, 'Password'), pw, h('div', { class: 'btns' }, h('button', { class: 'pri', type: 'submit' }, 'Log in')), err));
    pw.focus();
  }
  function start() { api('session').then(function (s) { if (s.loggedIn) { S.loggedIn = true; load(); } else loginView(s.configured ? '' : 'Admin password is not set up yet. Add ADMIN_PASSWORD in Netlify (10+ characters) and redeploy.'); }).catch(function () { loginView('Could not reach the server.'); }); }
  start();
})();
