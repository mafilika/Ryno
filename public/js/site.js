(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // theme toggle (follows the phone setting until the visitor chooses)
  try { var saved = localStorage.getItem('rnv-theme'); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}
  var tbtn = d.getElementById('theme');
  if (tbtn) tbtn.addEventListener('click', function () {
    var dark = root.getAttribute('data-theme') ? root.getAttribute('data-theme') === 'dark' : !(matchMedia('(prefers-color-scheme: light)').matches);
    var next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('rnv-theme', next); } catch (e) {}
  });

  // mobile menu
  var burger = d.getElementById('burger'), nav = d.getElementById('nav');
  if (burger && nav) {
    var setOpen = function (o) { nav.classList.toggle('open', o); burger.setAttribute('aria-expanded', String(o)); burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); };
    burger.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  // scroll reveal
  var rev = [].slice.call(d.querySelectorAll('.reveal'));
  rev.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
    rev.forEach(function (el) { io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add('in'); });

  // counting statistics
  var nums = [].slice.call(d.querySelectorAll('[data-count]'));
  function run(el) {
    var end = Number(el.getAttribute('data-count')) || 0, suf = el.getAttribute('data-suffix') || '', t0 = null;
    function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / 1400, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduce) {
    var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io2.unobserve(e.target); run(e.target); } }); }, { threshold: 0.6 });
    nums.forEach(function (n) { n.textContent = '0' + (n.getAttribute('data-suffix') || ''); io2.observe(n); });
  }

  // hide broken gallery images
  function hideIfBroken(img) { var b = img.closest('.g-item'); if (b) b.hidden = true; }
  d.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG') hideIfBroken(e.target); }, true);
  [].slice.call(d.querySelectorAll('.g-item img')).forEach(function (img) { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) hideIfBroken(img); });

  // gallery filters
  [].slice.call(d.querySelectorAll('[data-filter]')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      [].slice.call(d.querySelectorAll('[data-filter]')).forEach(function (b) { b.classList.toggle('on', b === btn); });
      [].slice.call(d.querySelectorAll('.g-item')).forEach(function (it) { it.hidden = !!f && it.getAttribute('data-cat') !== f; });
    });
  });

  // lightbox with keyboard + swipe
  var items = [].slice.call(d.querySelectorAll('.g-item'));
  if (items.length) {
    var lb = d.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    var arrow = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    lb.innerHTML = '<button class="x" type="button" aria-label="Close"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button><button class="p" type="button" aria-label="Previous photo">' + arrow + '</button><figure><img alt=""><figcaption></figcaption></figure><button class="n" type="button" aria-label="Next photo">' + arrow + '</button>';
    d.body.appendChild(lb);
    var img = lb.querySelector('img'), cap = lb.querySelector('figcaption'), cur = 0, list = [];
    var visible = function () { return items.filter(function (i) { return !i.hidden; }); };
    function show(i) { cur = (i + list.length) % list.length; var it = list[cur]; img.src = it.getAttribute('data-full'); img.alt = (it.querySelector('img') || {}).alt || ''; cap.textContent = it.getAttribute('data-cap') || ''; }
    function open(it) { list = visible(); show(list.indexOf(it)); lb.classList.add('open'); lb.querySelector('.x').focus(); }
    function close() { lb.classList.remove('open'); img.removeAttribute('src'); }
    items.forEach(function (it) { it.addEventListener('click', function () { open(it); }); });
    lb.querySelector('.x').addEventListener('click', close);
    lb.querySelector('.p').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.n').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    d.addEventListener('keydown', function (e) { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
    var x0 = null; lb.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); }, { passive: true });
  }

  // quote form -> WhatsApp
  [].slice.call(d.querySelectorAll('.quote-form')).forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return (f.elements[n].value || '').trim(); }, err = f.querySelector('.form-err');
      if (!v('name') || !v('phone')) { err.textContent = 'Please enter your name and phone number.'; err.hidden = false; return; }
      err.hidden = true;
      var t = 'Hello ' + f.getAttribute('data-biz') + ', I would like a quote.\nName: ' + v('name') + '\nPhone: ' + v('phone') + '\nService: ' + v('service') + (v('message') ? '\nDetails: ' + v('message') : '');
      window.open('https://wa.me/' + f.getAttribute('data-wa') + '?text=' + encodeURIComponent(t), '_blank', 'noopener');
    });
  });
})();
