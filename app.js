/* =========================================================
   EdenWise — interactions
========================================================= */

/* ---------------------------------------------------------
   SETTINGS — the only part you need to edit
--------------------------------------------------------- */
const CONFIG = {
  // Where form submissions are sent (counseling requests, newsletter,
  // prayer requests, circle join requests). Create a free form at
  // https://formspree.io, then paste its URL here, e.g.
  //   formEndpoint: 'https://formspree.io/f/abcdwxyz'
  // While this is empty, forms tell visitors to email you instead.
  formEndpoint: '',
  // Shown to visitors when a form can't be sent
  instagram: 'https://www.instagram.com/_edenwise_/'
};

(() => {
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const store = {
  get(k, d) { try { const v = localStorage.getItem('ew_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ew_' + k, JSON.stringify(v)); } catch {} }
};
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const IMG = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

/* ---------------------------------------------------------
   Language
   English is the source text; i18n.js maps each English
   string to French (fr), Haitian Creole (ht) and Spanish (es).
--------------------------------------------------------- */
const DICT = window.EW_I18N || {};
const LANGS = ['en', 'fr', 'ht', 'es'];
let lang = (() => {
  const saved = store.get('lang', null);
  if (LANGS.includes(saved)) return saved;
  return 'fr';   // default language; a visitor's own choice (saved above) always wins
})();
const missing = new Set();
function t(s, vars) {
  let out = s;
  if (lang !== 'en') {
    const hit = DICT[lang] && DICT[lang][s];
    if (hit) out = hit; else missing.add(s);
  }
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return out;
}
window.EW_missing = () => [...missing];   // handy for finding untranslated text

const MONTHS_HT = ['janvye', 'fevriye', 'mas', 'avril', 'me', 'jen', 'jiyè', 'out', 'septanm', 'oktòb', 'novanm', 'desanm'];
const DAYS_HT = ['dimanch', 'lendi', 'madi', 'mèkredi', 'jedi', 'vandredi', 'samdi'];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function fmtDate(d, o) {
  if (lang !== 'ht') return d.toLocaleDateString({ fr: 'fr-FR', es: 'es-ES' }[lang] || 'en-US', o);
  const parts = [];
  if (o.weekday) parts.push(o.weekday === 'short' ? cap(DAYS_HT[d.getDay()].slice(0, 3)) : cap(DAYS_HT[d.getDay()]));
  if (o.day) parts.push(d.getDate());
  if (o.month) parts.push(o.month === 'short' ? MONTHS_HT[d.getMonth()].slice(0, 3) : MONTHS_HT[d.getMonth()]);
  if (o.year) parts.push(d.getFullYear());
  return parts.join(' ');
}

const toast = (msg) => {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 3800);
};

/* ---------------------------------------------------------
   Sending forms
--------------------------------------------------------- */
class FormError extends Error {}
async function sendForm(kind, fields) {
  if (fields._gotcha) return;                                  // spam trap filled: quietly drop
  if (!CONFIG.formEndpoint) throw new FormError('not-configured');
  const body = { _subject: `EdenWise · ${kind}`, form: kind, site_language: lang, ...fields };
  delete body._gotcha;
  let res;
  try {
    res = await fetch(CONFIG.formEndpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch { throw new FormError('network'); }
  if (!res.ok) throw new FormError('rejected');
}
function formErrorText(err) {
  return err instanceof FormError && err.message === 'not-configured'
    ? t('Online requests aren’t connected yet. Please message us on Instagram @_edenwise_.')
    : t('Something went wrong sending this. Please try again, or message us on Instagram @_edenwise_.');
}
// success handlers per form kind (data-form="…"); modules register their own
const onSent = {};
function setSending(btn, on) {
  if (!btn) return;
  btn.classList.toggle('sending', on);
  btn.disabled = on;
}

const icon = {
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  person: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
  rings: '<svg viewBox="0 0 24 24"><circle cx="9" cy="13" r="5"/><circle cx="15" cy="13" r="5"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.7A4.5 4.5 0 0120 9c0 6-8 11-8 11z"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 20V10l8-6 8 6v10z"/><path d="M10 20v-6h4v6"/></svg>',
  video: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>',
  hands: '<svg viewBox="0 0 24 24"><path d="M12 21V11M8 21l-3-6 3-8 4 4 4-4 3 8-3 6"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>'
};

/* ---------------------------------------------------------
   Split text
--------------------------------------------------------- */
function splitText(el) {
  if (el.dataset.done) return;
  el.dataset.done = 1;
  const nodes = [...el.childNodes];
  el.innerHTML = '';
  let i = 0;
  const addWord = (word, wrapTag) => {
    const w = document.createElement('span'); w.className = 'w';
    const inner = document.createElement('span'); inner.style.setProperty('--i', i++);
    if (wrapTag) { const tg = document.createElement(wrapTag); tg.textContent = word; inner.appendChild(tg); }
    else inner.textContent = word;
    w.appendChild(inner); el.appendChild(w); el.appendChild(document.createTextNode(' '));
  };
  let lastInner = null;
  nodes.forEach(n => {
    const raw = n.textContent, text = raw.trim();
    if (!text) return;
    const tag = n.nodeType === 1 ? n.tagName.toLowerCase() : null;
    const words = text.split(/\s+/);
    // glue punctuation that directly follows an <em> onto the previous word
    if (!tag && lastInner && !/^\s/.test(raw)) {
      const sp = el.lastChild; if (sp && sp.nodeType === 3) sp.remove();
      lastInner.appendChild(document.createTextNode(words.shift()));
      if (words.length) el.appendChild(document.createTextNode(' '));
      else el.appendChild(document.createTextNode(/\s$/.test(raw) ? ' ' : ''));
    }
    words.forEach(word => { addWord(word, tag); lastInner = el.lastChild.previousSibling.firstChild; });
  });
}
// remember each heading's English source before splitting, so it can be re-split in another language
$$('[data-split]').forEach(el => { el.dataset.src = el.innerHTML.replace(/\s+/g, ' ').trim(); });

/* ---------------------------------------------------------
   Static page translation
--------------------------------------------------------- */
const origText = new WeakMap();
const ATTRS = ['placeholder', 'aria-label', 'title', 'data-cursor', 'data-title'];
function translateStatic() {
  // headings with word-by-word animation
  $$('[data-split]').forEach(el => {
    const html = t(el.dataset.src);
    const wasIn = el.classList.contains('in');
    el.innerHTML = html; delete el.dataset.done; splitText(el);
    el.classList.toggle('in', wasIn);
  });
  // every other text node
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p || p.closest('script,style,svg,[data-split],[data-i18n-skip]')) return NodeFilter.FILTER_REJECT;
      return (origText.has(n) || n.nodeValue.trim()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  for (let n; (n = walker.nextNode());) {
    if (!origText.has(n)) origText.set(n, n.nodeValue);
    const orig = origText.get(n), key = orig.trim().replace(/\s+/g, ' ');
    const out = t(key);
    n.nodeValue = out === key ? orig : orig.replace(orig.trim(), out);
  }
  // attributes
  ATTRS.forEach(a => $$(`[${a}]`).forEach(el => {
    if (el.closest('[data-i18n-skip]') && !el.matches('.view')) return;
    const k = 'i18n' + a.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
    if (!(k in el.dataset)) el.dataset[k] = el.getAttribute(a);
    el.setAttribute(a, t(el.dataset[k]));
  }));
  document.documentElement.lang = lang === 'ht' ? 'ht' : lang;
}

/* ---------------------------------------------------------
   Reveal observer
--------------------------------------------------------- */
// Measured on every scroll/resize/route change instead of IntersectionObserver,
// which can stall in background tabs and embedded browsers and leave pages blank.
const REVEAL = '.r:not(.in), [data-split]:not(.in), .prog-art:not(.in), .reveal-img:not(.in), .count:not(.in)';
function revealCheck() {
  const view = $('.view.active'); if (!view) return;
  const limit = innerHeight * 0.94;
  $$(REVEAL, view).forEach(el => {
    if (el.getBoundingClientRect().top < limit) {
      el.classList.add('in');
      if (el.matches('.count')) countUp(el);
    }
  });
}

function armReveals(view) {
  $$('.r, [data-split], .prog-art, .reveal-img, .count', view).forEach(el => {
    el.classList.remove('in');
    if (el.matches('.count')) el.textContent = '0';
  });
  requestAnimationFrame(revealCheck);
  setTimeout(revealCheck, 60);
}
window.addEventListener('resize', revealCheck);
window.addEventListener('scroll', revealCheck, { passive: true });
// safety net for browsers that pause scroll/animation-frame callbacks
setInterval(revealCheck, 400);
// dynamically rendered panels (tabs, booking steps) may add new reveal targets
new MutationObserver(() => requestAnimationFrame(revealCheck)).observe($('#app'), { childList: true, subtree: true });

function countUp(el) {
  const to = +el.dataset.to, dur = 1800, t0 = performance.now();
  const loc = { en: 'en-US', es: 'es-ES' }[lang] || 'fr-FR';
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    el.textContent = Math.round(to * e).toLocaleString(loc);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------------------------------------------------------
   Router + cinematic curtain
--------------------------------------------------------- */
const views = Object.fromEntries($$('.view').map(v => [v.dataset.view, v]));
const curtain = $('#curtain'), curtainLabel = $('#curtainLabel');
let current = null, busy = false, pendingScroll = null;

function routeFromHash() {
  const h = location.hash;
  if (!h.startsWith('#/')) return null;
  const r = h.slice(2).split('?')[0];
  return views[r] ? r : 'home';
}
const viewTitle = v => v.getAttribute('data-title');

function show(route) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  const v = views[route];
  v.classList.add('active');
  current = route;
  document.title = `${viewTitle(v)} · EdenWise`;
  window.scrollTo(0, 0);
  armReveals(v);
  $$('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  moveIndicator();
  onRouteEnter(route);
  requestAnimationFrame(onScroll);
}

function closeMenu() {
  document.body.classList.remove('menu-open');
  $('#burger').setAttribute('aria-expanded', 'false');
  $('#menu').setAttribute('aria-hidden', 'true');
}

let wanted = null;
async function go(route) {
  wanted = route;          // always remember the latest request, even mid-transition
  closeMenu();
  if (busy) return;
  if (route === current) { afterArrive(); return; }
  busy = true;
  try {
    if (reduced) { show(route); }
    else {
      curtainLabel.textContent = viewTitle(views[route]);
      curtain.classList.remove('reveal');
      curtain.classList.add('cover');
      await wait(1050);
      show(route);
      await wait(120);
      curtain.classList.remove('cover');
      curtain.classList.add('reveal');
      await wait(950);
    }
  } catch (err) {
    console.error(err);
    show(route);
  } finally {
    curtain.classList.remove('cover', 'reveal');
    busy = false;
  }
  if (wanted !== current) go(wanted);   // a newer click arrived during the transition
  else afterArrive();
}

// work queued by links for after a page has arrived (anchor scroll, tab to open)
let pendingTab = null;
let openCircleTab = () => {};
function afterArrive() {
  if (pendingTab != null) { openCircleTab(pendingTab); pendingTab = null; }
  if (pendingScroll) { const s = pendingScroll; pendingScroll = null; setTimeout(() => smoothTo(s), 80); }
}

window.addEventListener('hashchange', () => {
  const r = routeFromHash();
  if (r) go(r);
});

// in-page smooth anchors
function smoothTo(sel) {
  const el = $(sel);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 80, behavior: reduced ? 'auto' : 'smooth' });
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (a.classList.contains('skip')) { e.preventDefault(); $('#app').focus(); return; }
  if (a.hasAttribute('data-scroll')) {
    e.preventDefault();
    if (current !== 'home') { pendingScroll = href; location.hash = '#/home'; }
    else smoothTo(href);
    return;
  }
  if (a.dataset.tab != null) pendingTab = +a.dataset.tab;
  if (a.dataset.anchor) pendingScroll = a.dataset.anchor;
  if (a.dataset.soon != null) { e.preventDefault(); toast(t('{thing} is coming soon.', { thing: t(a.dataset.soon) })); return; }
  // clicking the page you're already on: close the menu and glide back to the top
  if (href.startsWith('#/') && href === location.hash && !busy) {
    e.preventDefault();
    closeMenu();
    if (pendingTab != null || pendingScroll) afterArrive();
    else window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }
});

/* ---------------------------------------------------------
   Nav
--------------------------------------------------------- */
const nav = $('#nav'), indicator = $('#navIndicator');
function moveIndicator() {
  const a = $('.nav-links a.active');
  if (!a || !a.offsetWidth) { indicator.style.opacity = 0; return; }
  indicator.style.opacity = 1;
  indicator.style.width = a.offsetWidth + 'px';
  indicator.style.transform = `translateX(${a.offsetLeft}px)`;
}
window.addEventListener('resize', moveIndicator);
// hover marker: a thin gold line with a dot glides under the hovered link
const navHover = $("#navHover");
function placeHover(a) {
  if (!a || !a.offsetWidth) { navHover.style.opacity = 0; return; }
  navHover.style.opacity = 1;
  navHover.style.width = Math.max(24, a.offsetWidth * .5) + "px";
  navHover.style.transform = `translateX(${a.offsetLeft + a.offsetWidth * .25}px)`;
}
$$(".nav-links a").forEach(a => {
  a.addEventListener("mouseenter", () => { if (!a.classList.contains("active")) placeHover(a); else navHover.style.opacity = 0; });
  a.addEventListener("focus", () => { if (!a.classList.contains("active")) placeHover(a); });
});
$(".nav-links").addEventListener("mouseleave", () => { navHover.style.opacity = 0; });
// web fonts change link widths after first paint
if (document.fonts) document.fonts.ready.then(moveIndicator);

$('#burger').addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  $('#burger').setAttribute('aria-expanded', open);
  $('#menu').setAttribute('aria-hidden', !open);
});

/* ---------------------------------------------------------
   Scroll loop: progress, nav state, parallax, journey
--------------------------------------------------------- */
let lastY = 0, ticking = false;
const progress = $('#scrollProgress');
function onScroll() {
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  if (!document.body.classList.contains('menu-open')) nav.classList.toggle('hide', y > lastY && y > 300);
  lastY = y;
  // light/dark under nav
  const probe = document.elementsFromPoint(innerWidth / 2, 40).find(el => !el.closest('.nav,.grain,.cursor,.scroll-progress,.curtain,.menu'));
  nav.classList.toggle('on-light', !!(probe && probe.closest('.ivory')));
  // parallax
  if (!reduced) $$('.view.active [data-speed]').forEach(el => {
    const r = el.parentElement.getBoundingClientRect();
    const off = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.speed);
    el.style.transform = `translate3d(0,${off}px,0)`;
  });
  // journey meter
  const j = $('.view.active .journey-steps');
  if (j) {
    const r = j.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / r.height));
    $('#journeyFill').style.transform = `scaleX(${p})`;
  }
  revealCheck();
  ticking = false;
}
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

/* ---------------------------------------------------------
   Cursor, magnetic, tilt
--------------------------------------------------------- */
if (fine && !reduced) {
  const cur = $('#cursor'), dot = $('.c-dot', cur), ring = $('.c-ring', cur), lbl = $('span', ring);
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; });
  (function loop() { rx += (mx - rx) * .16; ry += (my - ry) * .16; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
  document.addEventListener('mouseover', e => {
    const lab = e.target.closest('[data-cursor]');
    const hov = e.target.closest('a,button,input,textarea,select,summary,label');
    cur.classList.toggle('label', !!lab);
    cur.classList.toggle('hover', !lab && !!hov);
    if (lab) lbl.textContent = lab.getAttribute('data-cursor');
  });

  document.addEventListener('mousemove', e => {
    const m = e.target.closest('.magnetic');
    $$('.magnetic.mag-on').forEach(b => { if (b !== m) { b.classList.remove('mag-on'); b.style.transform = ''; } });
    if (m) {
      const r = m.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * .25, y = (e.clientY - r.top - r.height / 2) * .35;
      m.classList.add('mag-on'); m.style.transform = `translate(${x}px,${y}px)`;
    }
    const tl = e.target.closest('[data-tilt]');
    $$('[data-tilt].tilt-on').forEach(c => { if (c !== tl) { c.classList.remove('tilt-on'); c.style.transform = ''; } });
    if (tl) {
      const r = tl.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      tl.classList.add('tilt-on');
      tl.style.transform = `perspective(900px) rotateX(${(.5 - py) * 8}deg) rotateY(${(px - .5) * 10}deg) translateY(-6px)`;
      tl.style.setProperty('--gx', px * 100 + '%'); tl.style.setProperty('--gy', py * 100 + '%');
    }
  });
}

/* ---------------------------------------------------------
   Hero canvas — golden dust + light
--------------------------------------------------------- */
(function heroCanvas() {
  const c = $('#heroCanvas'); if (!c) return;
  const ctx = c.getContext('2d');
  let w, h, dpr, parts = [], mouse = { x: -999, y: -999 }, visible = true;
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(140, w * h / 11000));
    parts = Array.from({ length: n }, () => spawn(true));
  }
  function spawn(any) {
    return { x: Math.random() * w, y: any ? Math.random() * h : h + 10, r: Math.random() * 1.6 + .3, vy: Math.random() * .35 + .08, ph: Math.random() * 6.28, tw: Math.random() * .03 + .01, a: Math.random() * .6 + .2 };
  }
  c.parentElement.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  c.parentElement.addEventListener('mouseleave', () => { mouse.x = mouse.y = -999; });
  new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(c);
  let tick = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || current !== 'home') return;
    tick += 1;
    ctx.clearRect(0, 0, w, h);
    if (mouse.x > 0) {
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 320);
      g.addColorStop(0, 'rgba(219,165,43,.13)'); g.addColorStop(1, 'rgba(219,165,43,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    for (const p of parts) {
      p.y -= p.vy; p.x += Math.sin(tick * .01 + p.ph) * .25;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 140) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
      if (p.y < -10) Object.assign(p, spawn(false));
      const a = p.a * (.6 + .4 * Math.sin(tick * p.tw + p.ph));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fillStyle = `rgba(246,218,140,${a})`;
      ctx.shadowColor = 'rgba(219,165,43,.9)'; ctx.shadowBlur = p.r * 6;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  size(); addEventListener('resize', size);
  if (!reduced) frame();
})();

/* ---------------------------------------------------------
   Relationship check-in
--------------------------------------------------------- */
const checkin = (() => {
  const dims = ['Communication', 'Conflict repair', 'Spiritual unity', 'Trust', 'Shared vision'];
  const vals = store.get('checkin', [3, 3, 3, 3, 3]);
  const rows = $('#ciRows'), svg = $('#radar'), rec = $('#ciRec');
  const cx = 110, cy = 110, R = 78;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + Math.cos(a) * R * v / 5, cy + Math.sin(a) * R * v / 5]; };
  function build() {
    let grid = '';
    for (let l = 1; l <= 5; l++) grid += `<polygon class="grid" points="${dims.map((_, i) => pt(i, l).join(',')).join(' ')}"/>`;
    dims.forEach((d, i) => { const [x, y] = pt(i, 5); grid += `<line class="grid" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`; const [lx, ly] = pt(i, 6.4); grid += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle">${t(d)}</text>`; });
    svg.innerHTML = grid + '<polygon class="shape" id="shape"/>';
    rows.innerHTML = dims.map((d, i) => `<div class="ci-row"><label for="ci${i}">${t(d)}<b id="cv${i}">${vals[i]}</b></label><input id="ci${i}" type="range" min="1" max="5" step="1" value="${vals[i]}"></div>`).join('');
    draw();
  }
  function draw() {
    $('#shape').setAttribute('points', vals.map((v, i) => pt(i, v).join(',')).join(' '));
    vals.forEach((v, i) => { $('#ci' + i).style.setProperty('--p', ((v - 1) / 4 * 100) + '%'); $('#cv' + i).textContent = v; });
    const avg = vals.reduce((a, b) => a + b, 0) / 5, low = t(dims[vals.indexOf(Math.min(...vals))]).toLowerCase();
    let title, body;
    if (avg >= 4.2) { title = t('Flourishing'); body = t('Your foundation is strong. Protect it with ongoing enrichment. Keep an eye on <em>{area}</em>.', { area: low }); }
    else if (avg >= 3) { title = t('Growing'); body = t('There is real strength here. Focused work on <em>{area}</em> could change the whole relationship.', { area: low }); }
    else { title = t('Needs care'); body = t('You don’t have to carry this alone. A guided conversation about <em>{area}</em> is a wise first step.', { area: low }); }
    rec.innerHTML = `<b>${title}</b>${body}<br><a href="#/counseling">${t('Talk with a counselor')}</a>`;
    store.set('checkin', vals);
  }
  rows.addEventListener('input', e => { const i = +e.target.id.slice(2); vals[i] = +e.target.value; draw(); });
  build();
  return { refresh: build };
})();

/* ---------------------------------------------------------
   Booking wizard
   Choices are stored in English (what the ministry receives)
   and translated only for display.
--------------------------------------------------------- */
const booking = (() => {
  const blank = () => ({ who: null, focus: [], counselor: null, format: null, date: null, time: null, info: {} });
  const S = blank();
  const stepNames = ['Who is this for?', 'Areas of focus', 'Choose a counselor', 'Session format', 'Date & time', 'Intake', 'Review'];
  let step = 0, month = new Date(); month.setDate(1);
  const stage = $('#bookStage'), back = $('#bookBack'), next = $('#bookNext');

  const WHO = [
    ['Individual', 'Personal growth, healing or direction', icon.person],
    ['Engaged couple', 'Preparing for covenant marriage', icon.rings],
    ['Married couple', 'Strengthen or restore your marriage', icon.heart],
    ['Family', 'Parents, children and household dynamics', icon.home]
  ];
  const FOCUS = ['Communication', 'Conflict & repair', 'Trust & betrayal', 'Premarital preparation', 'Intimacy', 'Parenting', 'Blended family', 'Grief & loss', 'Anxiety & stress', 'Trauma healing', 'Faith & doubt', 'Identity & purpose'];
  const COUNSELORS = [
    ['Pastor David Chen', 'Family & relationship coach', icon.person],
    ['Marie-Claire Jean', 'Pastoral counselor · trauma healing', icon.person],
    ['First available', 'We’ll match you thoughtfully', icon.spark]
  ];
  const FORMATS = [
    ['Secure video', 'Meet from anywhere', icon.video],
    ['Phone call', 'Voice only, low bandwidth', icon.phone]
  ];
  const TIMES = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '6:00 PM'];
  const LANG_OPTS = ['English', 'Français', 'Kreyòl ayisyen', 'Español'];
  const DOW = { en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], fr: ['D', 'L', 'M', 'M', 'J', 'V', 'S'], ht: ['D', 'L', 'M', 'M', 'J', 'V', 'S'], es: ['D', 'L', 'M', 'X', 'J', 'V', 'S'] };
  const personName = n => n === 'Pastor David Chen' ? t('Pastor') + ' David Chen' : t(n);

  function renderSteps() {
    $('#steps').innerHTML = stepNames.map((n, i) => `<li class="${i < step ? 'done' : i === step ? 'now' : ''}"><i>${i < step ? '✓' : i + 1}</i><span>${t(n)}</span></li>`).join('');
    $('#bookBar').style.width = (step > 6 ? 100 : (step + 1) / (stepNames.length + 1) * 100) + '%';
    back.style.visibility = step === 0 || step > 6 ? 'hidden' : 'visible';
    next.parentElement.style.display = step > 6 ? 'none' : '';
    $('span', next).textContent = step === 6 ? t('Submit request') : t('Continue');
  }
  const optHTML = (list, key, cols = '') => `<div class="opts ${cols}">${list.map(([v, s, ic]) => `<button class="opt ${S[key] === v ? 'sel' : ''}" data-k="${key}" data-v="${v}"><span class="oi">${ic}</span><span><b>${key === 'counselor' ? personName(v) : t(v)}</b><small>${t(s)}</small></span><span class="tick"></span></button>`).join('')}</div>`;

  function calHTML() {
    const y = month.getFullYear(), m = month.getMonth();
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const minMonth = new Date(); minMonth.setDate(1); minMonth.setHours(0, 0, 0, 0);
    let cells = DOW[lang].map(d => `<div class="dow">${d}</div>`).join('');
    for (let i = 0; i < first; i++) cells += '<span></span>';
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m, d), iso = dt.toDateString();
      const off = dt <= today || dt.getDay() === 0;
      cells += `<button data-date="${iso}" ${off ? 'disabled' : ''} class="${S.date === iso ? 'sel' : ''}">${d}</button>`;
    }
    const label = cap(fmtDate(month, { month: 'long', year: 'numeric' }));
    const seed = S.date ? [...S.date].reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
    const times = S.date ? TIMES.map((tm, i) => (seed + i) % 4 === 0 ? '' : `<button data-time="${tm}" class="${S.time === tm ? 'sel' : ''}">${t(tm)}</button>`).join('') : `<p class="fine" style="grid-column:1/-1">${t('Select a date to see available times.')}</p>`;
    return `<div class="cal-wrap"><div class="cal"><div class="cal-head"><button data-mv="-1" aria-label="${t('Previous month')}" ${month <= minMonth ? 'disabled style="opacity:.3"' : ''}><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><span>${label}</span><button data-mv="1" aria-label="${t('Next month')}"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div><div class="cal-grid">${cells}</div></div><div class="times"><div class="lbl">${t('Available · your local time')}</div>${times}</div></div>`;
  }

  function stageHTML() {
    switch (step) {
      case 0: return `<h3>${t('Who is this session for?')}</h3><p class="sub">${t('This helps us prepare the right kind of care.')}</p>${optHTML(WHO, 'who')}`;
      case 1: return `<h3>${t('What would you like to focus on?')}</h3><p class="sub">${t('Choose any that apply. You can share more later.')}</p><div class="chips-sel">${FOCUS.map(f => `<button class="chip ${S.focus.includes(f) ? 'sel' : ''}" data-f="${f}">${t(f)}</button>`).join('')}</div>`;
      case 2: return `<h3>${t('Choose your counselor')}</h3><p class="sub">${t('Every counselor is under pastoral oversight and bound by confidentiality.')}</p>${optHTML(COUNSELORS, 'counselor', 'three')}`;
      case 3: return `<h3>${t('How would you like to meet?')}</h3><p class="sub">${t('Sessions are 50 minutes.')}</p>${optHTML(FORMATS, 'format')}`;
      case 4: return `<h3>${t('Select a date & time')}</h3><p class="sub">${t('Sundays are reserved for worship and rest.')}</p>${calHTML()}`;
      case 5: {
        const i = S.info;
        const defLang = i.lang || LANG_OPTS[LANGS.indexOf(lang)];
        return `<h3>${t('Intake information')}</h3><p class="sub">${t('This information is strictly confidential.')}</p>
        <form class="form-grid" id="intake" novalidate>
          <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
          <label class="field"><span>${t('Full name')}</span><input name="name" required value="${esc(i.name)}" autocomplete="name"></label>
          <label class="field"><span>${t('Email address')}</span><input name="email" type="email" required value="${esc(i.email)}" autocomplete="email"></label>
          <label class="field"><span>${t('Phone number')}</span><input name="phone" type="tel" value="${esc(i.phone)}" autocomplete="tel"></label>
          <label class="field"><span>${t('Preferred language')}</span><select name="lang">${LANG_OPTS.map(l => `<option ${defLang === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="field full"><span>${t('What’s on your heart? (optional)')}</span><textarea name="note" rows="4" placeholder="${t('Share as much or as little as you’d like.')}">${esc(i.note)}</textarea></label>
          <label class="consent"><input type="checkbox" name="consent" ${i.consent ? 'checked' : ''}> ${t('I understand pastoral counseling is not an emergency or medical service, and I agree to the confidentiality terms.')}</label>
        </form>`;
      }
      case 6: return `<h3>${t('Review your request')}</h3><p class="sub">${t('Please confirm the details below.')}</p>
        <div class="review">
          <div><small>${t('For')}</small><b>${t(S.who)}</b></div>
          <div><small>${t('Counselor')}</small><b>${personName(S.counselor)}</b></div>
          <div><small>${t('Format')}</small><b>${t(S.format)}</b></div>
          <div><small>${t('When')}</small><b>${fmtDate(new Date(S.date), { weekday: 'short', month: 'short', day: 'numeric' })} · ${t(S.time)}</b></div>
          <div style="grid-column:1/-1"><small>${t('Focus')}</small><b>${S.focus.map(f => t(f)).join(', ')}</b></div>
          <div><small>${t('Name')}</small><b>${esc(S.info.name)}</b></div>
          <div><small>${t('Email')}</small><b>${esc(S.info.email)}</b></div>
        </div>`;
      default: {
        const who = S.counselor === 'First available' ? t('A counselor') : personName(S.counselor);
        return `<div class="done-stage"><div class="done-seal"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="56"/><path d="M38 62l15 15 30-32"/></svg></div>
        <h3>${t('Your request has been received.')}</h3>
        <p class="sub" style="max-width:460px">${t('Thank you, {name}. {who} will confirm your session by email within one business day. Until then, may the peace of Christ guard your heart.', { name: esc(S.info.name.split(' ')[0]), who })}</p>
        <a href="#/edenseed" class="btn btn-dark"><span>${t('Read today’s devotional')}</span>${icon.arrow}</a></div>`;
      }
    }
  }

  function render(anim = true) {
    renderSteps();
    const old = stage.firstElementChild;
    const put = () => { stage.innerHTML = `<div class="stage">${stageHTML()}<div class="err" id="bookErr" role="alert"></div></div>`; };
    if (anim && old && !reduced) { old.classList.add('out'); setTimeout(put, 300); } else put();
  }
  function saveIntake() {
    const f = $('#intake'); if (!f) return;
    const d = new FormData(f);
    S.info = { name: d.get('name').trim(), email: d.get('email').trim(), phone: d.get('phone').trim(), lang: d.get('lang'), note: d.get('note'), consent: !!d.get('consent'), _gotcha: d.get('_gotcha') };
  }
  const err = m => { $('#bookErr').textContent = m; return false; };
  function valid() {
    switch (step) {
      case 0: return S.who || err(t('Please choose who this session is for.'));
      case 1: return S.focus.length || err(t('Please choose at least one area of focus.'));
      case 2: return S.counselor || err(t('Please choose a counselor.'));
      case 3: return S.format || err(t('Please choose a session format.'));
      case 4: return (S.date && S.time) || err(t('Please select a date and a time.'));
      case 5: saveIntake();
        if (!S.info.name) return err(t('Please enter your name.'));
        if (!/^\S+@\S+\.\S+$/.test(S.info.email)) return err(t('Please enter a valid email address.'));
        if (!S.info.consent) return err(t('Please confirm the consent statement.'));
        return true;
      default: return true;
    }
  }
  stage.addEventListener('click', e => {
    const o = e.target.closest('.opt'); if (o) { S[o.dataset.k] = o.dataset.v; $$('.opt', stage).forEach(x => x.classList.toggle('sel', x === o)); $('#bookErr').textContent = ''; return; }
    const c = e.target.closest('.chip'); if (c) { const f = c.dataset.f; S.focus = S.focus.includes(f) ? S.focus.filter(x => x !== f) : [...S.focus, f]; c.classList.toggle('sel'); return; }
    const mv = e.target.closest('[data-mv]'); if (mv) { month.setMonth(month.getMonth() + +mv.dataset.mv); $('.cal-wrap', stage).outerHTML = calHTML(); return; }
    const d = e.target.closest('[data-date]'); if (d) { S.date = d.dataset.date; S.time = null; $('.cal-wrap', stage).outerHTML = calHTML(); return; }
    const tm = e.target.closest('[data-time]'); if (tm) { S.time = tm.dataset.time; $$('[data-time]', stage).forEach(x => x.classList.toggle('sel', x === tm)); }
  });
  next.addEventListener('click', async () => {
    if (!valid()) return;
    if (step === 6) {
      setSending(next, true);
      try {
        await sendForm('Counseling request', {
          name: S.info.name, email: S.info.email, phone: S.info.phone || '—',
          session_for: S.who, focus: S.focus.join(', '), counselor: S.counselor, format: S.format,
          requested_time: `${new Date(S.date).toDateString()} · ${S.time} (visitor’s local time, UTC${-new Date().getTimezoneOffset() / 60 >= 0 ? '+' : ''}${-new Date().getTimezoneOffset() / 60})`,
          preferred_language: S.info.lang, message: S.info.note || '—',
          consent: 'Agreed: not an emergency/medical service; confidentiality terms', _gotcha: S.info._gotcha
        });
      } catch (e) {
        err(formErrorText(e));
        return;
      } finally { setSending(next, false); }
      toast(t('Request received. Check your email for confirmation.'));
    }
    step++; render();
    window.scrollTo({ top: $('.booking-sec').offsetTop - 90, behavior: reduced ? 'auto' : 'smooth' });
  });
  back.addEventListener('click', () => { if (step === 5) saveIntake(); if (step > 0) { step--; render(); } });

  return {
    enter() { if (step > 6) { Object.assign(S, blank()); step = 0; } render(false); },
    preset(name) { S.counselor = name; },
    refresh() { if (step === 5) saveIntake(); render(false); }
  };
})();

document.addEventListener('click', e => {
  const b = e.target.closest('[data-counselor]');
  if (b) booking.preset(b.dataset.counselor);
});

/* ---------------------------------------------------------
   Programs
--------------------------------------------------------- */
const PROGRAMS = [
  { t: 'Premarital Preparation', img: '1515934751635-c81c6bc9a2d8', tag: '8 weeks · Engaged couples', bg: '#08301b',
    d: 'A comprehensive 8-week journey to build a strong foundation before the wedding day. Couples learn God’s design for covenant and practise the skills that make love last.',
    meta: ['Cohort-based', 'Workbook included', 'Certificate'],
    w: [['Wk 1–2', 'Covenant, not contract: God’s blueprint'], ['Wk 3–4', 'Communication & conflict repair'], ['Wk 5–6', 'Finances, families of origin & roles'], ['Wk 7–8', 'Intimacy, spiritual unity & vision']] },
  { t: 'Marriage Enrichment', img: '1484876632310-ddb3b48133cc', tag: '6 weeks · Married couples', bg: '#052112',
    d: 'For couples who want to go deeper. Renew friendship, repair old wounds and realign your home around shared calling.',
    meta: ['Evening sessions', 'Couples retreat option'],
    w: [['Wk 1–2', 'Friendship & fondness revisited'], ['Wk 3–4', 'Forgiveness and the repair cycle'], ['Wk 5–6', 'Praying together & shared mission']] },
  { t: 'Whole Before Two', img: '1474367658825-e5858839e99d', tag: '6 weeks · Singles', bg: '#08301b',
    d: 'Formation for singles: identity in Christ, emotional health and wise boundaries, so the next relationship is built on wholeness, not need.',
    meta: ['Small groups', 'Mentor pairing'],
    w: [['Wk 1–2', 'Identity, worth & belonging'], ['Wk 3–4', 'Emotional health & attachment'], ['Wk 5–6', 'Boundaries, discernment & dating well']] },
  { t: 'Healing & Restoration', img: '1528222354212-a29573cdb844', tag: '10 weeks · Trauma-informed', bg: '#03160c',
    d: 'A gentle, trauma-informed path through grief, betrayal and loss. We join biblical lament with proven practices for safety and stabilisation.',
    meta: ['Small cohorts', 'Individual check-ins'],
    w: [['Wk 1–3', 'Safety, stabilisation & lament'], ['Wk 4–7', 'Processing the story before God'], ['Wk 8–10', 'Forgiveness, meaning & renewal']] }
];
function renderPrograms() {
  const wasIn = new Set($$('#progList .in').map(el => el.dataset.key));
  $('#progList').innerHTML = PROGRAMS.map((p, pi) => `
  <article class="prog">
    <div class="prog-art pa-photo" data-key="a${pi}"><div class="pa-bg" style="background:linear-gradient(180deg,rgba(3,22,12,.05),rgba(3,22,12,.55)),url('${IMG(p.img, 1200)}') center/cover,${p.bg}"></div><div class="pa-tag">${t(p.tag)}</div></div>
    <div class="prog-copy">
      <div class="kicker r" data-key="k${pi}">${t(p.tag)}</div>
      <h2 class="r" data-key="h${pi}" style="--d:.05s">${t(p.t)}</h2>
      <p class="r" data-key="p${pi}" style="--d:.1s">${t(p.d)}</p>
      <div class="prog-meta r" data-key="m${pi}" style="--d:.15s">${p.meta.map(m => `<span>${t(m)}</span>`).join('')}</div>
      <ul class="prog-weeks r" data-key="w${pi}" style="--d:.2s">${p.w.map(([a, b]) => `<li><b>${t(a)}</b>${t(b)}</li>`).join('')}</ul>
      <a href="#/counseling" class="btn btn-dark magnetic r" data-key="b${pi}" style="--d:.25s"><span>${t('Enroll / Learn more')}</span>${icon.arrow}</a>
    </div>
  </article>`).join('');
  // keep already-revealed pieces visible when re-rendering for a language switch
  $$('#progList [data-key]').forEach(el => wasIn.has(el.dataset.key) && el.classList.add('in'));
}
renderPrograms();

/* ---------------------------------------------------------
   Academy
--------------------------------------------------------- */
const COURSES = [
  { t: 'The Covenant Foundations', c: 'Marriage', by: 'Dr. Paul & Sarah Souffrant', d: 'Deconstruct worldly standards of marriage and build a covenant foundation aligned with God’s Word.', l: 12, pop: 1, img: '1606800052052-a08af7148866', bg: 'linear-gradient(135deg,#6d5230,#10582f)' },
  { t: 'Biblical Dating & Boundaries', c: 'Relationships', by: 'Pastor Marcus Vance', d: 'Equip yourself with clarity, emotional boundaries and spiritual wisdom to navigate dating and engagement.', l: 9, img: '1541518926503-a6fdabd94147', bg: 'linear-gradient(135deg,#10582f,#9c6c12)' },
  { t: 'Raising Shepherds of Truth', c: 'Parenting', by: 'Elizabeth Stone, M.A.', d: 'Practical tools and theological anchors to raise confident, godly children in a confused culture.', l: 10, img: '1624272864537-8ecc72b67958', bg: 'linear-gradient(135deg,#08301b,#6d5230)' },
  { t: 'The Praying Home', c: 'Prayer', by: 'EdenWise Faculty', d: 'Build rhythms of family worship and prayer that fit real life, from newlyweds to full houses.', l: 7, img: '1437603568260-1950d3ca6eab', bg: 'linear-gradient(135deg,#9c6c12,#052112)' },
  { t: 'Anchored in Anxious Seasons', c: 'Faith', by: 'EdenWise Faculty', d: 'Scripture and practical skills for worry, stress and uncertainty, without shame and without shortcuts.', l: 8, img: '1495552665515-46e119a10545', bg: 'linear-gradient(135deg,#0c4224,#1c6b3e)' },
  { t: 'Servant Leadership at Home', c: 'Leadership', by: 'EdenWise Faculty', d: 'Christlike leadership in marriage and family: humble, accountable and life-giving.', l: 6, img: '1529180979161-06b8b6d6f2be', bg: 'linear-gradient(135deg,#3b2d18,#10582f)' },
  { t: 'Healing After Betrayal', c: 'Marriage', by: 'EdenWise Faculty', d: 'A trauma-informed roadmap for couples rebuilding trust after infidelity or deep breach.', l: 11, img: '1529634597503-139d3726fed5', bg: 'linear-gradient(135deg,#10582f,#3b2d18)' },
  { t: 'Whole & Holy Singleness', c: 'Relationships', by: 'EdenWise Faculty', d: 'Singleness as calling, not waiting room: purpose, community and emotional health.', l: 6, img: '1522008342704-6b265b543c37', bg: 'linear-gradient(135deg,#6d5230,#08301b)' }
];
const academy = (() => {
  const cats = ['All', 'Marriage', 'Relationships', 'Parenting', 'Prayer', 'Faith', 'Leadership'];
  let cat = 'All', q = '';
  const done = new Set(store.get('lessons', []));
  const author = by => by === 'Pastor Marcus Vance' ? t('Pastor') + ' Marcus Vance' : t(by);
  function filters() { $('#acadFilters').innerHTML = cats.map(c => `<button class="${c === cat ? 'on' : ''}" data-c="${c}">${t(c)}</button>`).join(''); }
  function prog() {
    const n = done.size, total = COURSES.length;
    $('.ap-ring span').textContent = n;
    $('.ap-v').textContent = n === 1 ? t('1 course started') : t('{n} courses started', { n });
    $('.ap-val').style.strokeDashoffset = 119.4 * (1 - n / total);
  }
  function render() {
    const list = COURSES.filter(c => (cat === 'All' || c.c === cat) && (!q || [c.t, c.by, c.c, c.d].map(s => s + ' ' + t(s)).join(' ').toLowerCase().includes(q)));
    $('#courseGrid').innerHTML = list.map((c, i) => `
      <article class="course" style="animation-delay:${i * 70}ms">
        <div class="cover cv-photo" data-cursor="${t('Preview')}"><div class="cv-bg" style="background:linear-gradient(180deg,rgba(3,22,12,0) 45%,rgba(3,22,12,.5)),url('${IMG(c.img, 800)}') center/cover,${c.bg}"></div>${c.pop ? `<span class="badge-pop">${t('Most popular')}</span>` : ''}<span class="play">${icon.play}</span></div>
        <div class="c-body"><span class="c-cat">${t(c.c)}</span><h3>${t(c.t)}</h3><div class="c-by">${t('By {name}', { name: author(c.by) })}</div><p>${t(c.d)}</p>
        <div class="c-foot"><span>${t('{n} lessons', { n: c.l })}</span><button data-start="${esc(c.t)}">${done.has(c.t) ? t('Continue →') : t('Start course →')}</button></div></div>
      </article>`).join('');
    $('#acadEmpty').hidden = list.length > 0;
  }
  $('#acadFilters').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cat = b.dataset.c; $$('#acadFilters button').forEach(x => x.classList.toggle('on', x === b)); render(); });
  $('#acadSearch').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); render(); });
  $('#courseGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-start]') || e.target.closest('.course')?.querySelector('[data-start]'); if (!b) return;
    done.add(b.dataset.start); store.set('lessons', [...done]); prog(); render();
    toast(t('“{course}” added to your learning path.', { course: t(b.dataset.start) }));
  });
  filters(); render(); prog();
  return { refresh() { filters(); render(); prog(); } };
})();

/* ---------------------------------------------------------
   EdenSeed
--------------------------------------------------------- */
const seed = (() => {
  const save = $('#saveDevo'), orb = $('#breathOrb'), txt = $('#breathTxt'), btn = $('#breathBtn');
  let saved = store.get('saved', false), timer = null, breath = 'idle';   // idle | running | done
  function labels() {
    const today = fmtDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' });
    $('#todayDate').textContent = cap(today);
    $('#seedDate').textContent = cap(today);
    save.classList.toggle('on', saved);
    save.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg><span>${saved ? t('Saved') : t('Save devotional')}</span>`;
    $('span', btn).textContent = breath === 'running' ? t('Stop') : breath === 'done' ? t('Pray again') : t('Start 1-minute prayer');
    if (breath !== 'running') txt.textContent = breath === 'done' ? t('Amen') : t('Begin');
  }
  save.addEventListener('click', () => { saved = !saved; store.set('saved', saved); labels(); toast(saved ? t('Devotional saved to your library.') : t('Removed from your library.')); });
  const j = $('#journal'); j.value = store.get('journal', '');
  j.addEventListener('input', () => store.set('journal', j.value));
  let n = 0;
  const tick = () => {
    if (n >= 15) { clearInterval(timer); timer = null; orb.classList.remove('inhale'); breath = 'done'; labels(); return; }
    const inh = n % 2 === 0; orb.classList.toggle('inhale', inh); txt.textContent = inh ? t('Breathe in') : t('Breathe out'); n++;
  };
  btn.addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = null; orb.classList.remove('inhale'); breath = 'idle'; labels(); return; }
    n = 0; breath = 'running'; labels(); tick(); timer = setInterval(tick, 4000);
  });
  labels();
  return { refresh: labels };
})();

/* ---------------------------------------------------------
   Covenant Circle
--------------------------------------------------------- */
const circle = (() => {
  const panel = $('#circlePanel');
  const prayers = store.get('prayers', [
    { t: 'For restoration in our marriage after a hard season.', w: 'Anonymous', n: 24 },
    { t: 'Wisdom as we prepare for our wedding in December.', w: 'An engaged couple', n: 17 },
    { t: 'Peace for my family in Cap-Haïtien.', w: 'Anonymous', n: 41 }
  ]);
  const prayed = new Set(store.get('prayed', []));
  const joined = new Set();
  const GROUPS = [
    ['Newlyweds Circle', 'The first years, together. Honest talk about building a home.', 'Tuesdays · Video'],
    ['Engaged & Preparing', 'Walk with other couples through the premarital journey.', 'Thursdays · Video'],
    ['Parents of Teens', 'Grace, truth and a lot of patience. You are not alone.', 'Biweekly · Video'],
    ['Singles in Christ', 'Community, purpose and friendship for every stage of singleness.', 'Saturdays · Video']
  ];
  const trap = '<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">';
  const tabs = [
    () => `<div class="cp-grid">${GROUPS.map(([g, d, m]) => `<div class="cp-card"><h4>${t(g)}</h4><p>${t(d)}</p><div class="cp-meta"><span style="display:flex;align-items:center"><span class="stack"><i></i><i></i><i></i></span>${t(m)}</span>${joined.has(g) ? `<span class="sent-note">${t('Requested ✓')}</span>` : `<button data-join="${g}">${t('Join →')}</button>`}</div></div>`).join('')}</div>`,
    () => `<div class="cp-grid">${[
      ['Philippians 4 : 6–7', 'Held onto this verse the night before our first counseling session.'],
      ['Colossians 3 : 13', 'Our counselor gave us this for our week of practising forgiveness.'],
      ['Proverbs 24 : 3–4', 'Wisdom builds the house. Understanding establishes it.'],
      ['Isaiah 43 : 19', 'For anyone waiting on God to do a new thing in their family.']
    ].map(([r, n]) => `<div class="cp-card"><div class="kicker" style="color:#a8740f">${t(r)}</div><p style="font-family:var(--serif);font-size:20px;color:var(--text)">${t(n)}</p><div class="cp-meta"><span>${t('Shared by a member')}</span><button data-amen>${t('Amen')}</button></div></div>`).join('')}</div>`,
    () => `<form class="pray-form" id="prayForm" data-form="prayer">${trap}<input name="request" placeholder="${t('Share a prayer request (posted anonymously)')}" maxlength="400" required aria-label="${t('Prayer request')}"><button class="btn btn-dark"><span>${t('Post')}</span></button></form>
      <p class="fine" style="margin:-8px 0 16px 6px">${t('Requests go privately to our prayer team. The wall below shows requests on this device.')}</p>
      <div class="pray-list">${prayers.map((p, i) => `<div class="pray"><div><p>${esc(t(p.t))}</p><small>${t(p.w)} · ${t('{n} praying', { n: p.n + (prayed.has(i) ? 1 : 0) })}</small></div><button data-pray="${i}" class="${prayed.has(i) ? 'on' : ''}">${icon.hands}${prayed.has(i) ? t('Praying') : t('I’ll pray')}</button></div>`).join('')}</div>`
  ];
  let tab = 0;
  const render = () => { panel.innerHTML = `<div>${tabs[tab]()}</div>`; };
  const setTab = i => { tab = i; $$('#circleTabs button').forEach(x => x.classList.toggle('on', +x.dataset.tab === i)); render(); };
  $('#circleTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(+b.dataset.tab); });
  openCircleTab = i => { setTab(i); smoothTo('#circlePanel'); };
  panel.addEventListener('click', e => {
    const j = e.target.closest('[data-join]');
    if (j) {
      // a join request needs a way to reply, so ask for an email in place
      const meta = j.parentElement;
      meta.outerHTML = `<form class="join-form" data-form="circle-join">${trap}<input type="hidden" name="circle" value="${esc(j.dataset.join)}"><input type="email" name="email" required placeholder="${t('Your email')}" aria-label="${t('Your email')}"><button class="btn btn-dark btn-sm"><span>${t('Request')}</span></button></form>`;
      $('.join-form input[type=email]', panel)?.focus();
      return;
    }
    const a = e.target.closest('[data-amen]'); if (a) { a.textContent = t('Amen') + ' ✓'; return; }
    const p = e.target.closest('[data-pray]'); if (p) { const i = +p.dataset.pray; prayed.has(i) ? prayed.delete(i) : prayed.add(i); store.set('prayed', [...prayed]); render(); }
  });
  onSent.prayer = (form, data) => {
    prayers.unshift({ t: data.request, w: 'Anonymous', n: 0 }); store.set('prayers', prayers);
    const shifted = new Set([...prayed].map(i => i + 1)); prayed.clear(); shifted.forEach(i => prayed.add(i)); store.set('prayed', [...prayed]);
    render(); toast(t('Your request was sent to our prayer team. We are praying with you.'));
  };
  onSent['circle-join'] = (form, data) => {
    joined.add(data.circle); render();
    toast(t('Request to join “{circle}” sent. We’ll email you.', { circle: t(data.circle) }));
  };
  render();

  $('.billing').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('.billing button').forEach(x => x.classList.toggle('on', x === b));
    $$('.tier-price b').forEach(el => {
      const to = +el.dataset[b.dataset.bill], from = +el.textContent, t0 = performance.now();
      const st = now => { const p = Math.min(1, (now - t0) / 600); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(st); };
      requestAnimationFrame(st);
    });
  });
  // exclusive accordion
  $$('#faq details').forEach(d => d.addEventListener('toggle', () => { if (d.open) $$('#faq details').forEach(o => o !== d && (o.open = false)); }));
  return { refresh: render };
})();

/* ---------------------------------------------------------
   Forms: newsletter, prayer, circle join
--------------------------------------------------------- */
onSent.newsletter = (form) => { form.reset(); toast(t('Welcome. EdenSeed will reach your inbox soon.')); };
const FORM_KIND = { newsletter: 'Newsletter signup', prayer: 'Prayer request', 'circle-join': 'Circle join request' };
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]');
  if (!f) return;
  e.preventDefault();
  const kind = f.dataset.form, data = Object.fromEntries(new FormData(f));
  const btn = $('button', f);
  setSending(btn, true);
  try {
    await sendForm(FORM_KIND[kind] || kind, data);
    onSent[kind] && onSent[kind](f, data);
  } catch (err) {
    toast(formErrorText(err));
  } finally {
    if (f.isConnected) setSending(btn, false);
  }
});
$('#yr').textContent = new Date().getFullYear();

/* ---------------------------------------------------------
   Per-route hooks
--------------------------------------------------------- */
function onRouteEnter(route) {
  if (route === "home") setTimeout(() => heroSlides.start(), 50);
  if (route === 'counseling') booking.enter();
}

/* ---------------------------------------------------------
   Hero: cinematic family slides (slow push-in + crossfade)
--------------------------------------------------------- */
const heroSlides = (() => {
  const slides = $$("#heroSlides .hs"), bars = $$(".hi-bars i"), word = $("#heroWord");
  const DURATION = 6500;
  const mobile = matchMedia("(max-width: 760px)");
  let i = 0, timer = null, visible = true;
  const place = s => { s.style.setProperty("--pos", mobile.matches ? s.dataset.posm : s.dataset.pos); };
  const load = s => { if (s && s.dataset.img) { s.style.setProperty("--img", "url('" + s.dataset.img + "')"); delete s.dataset.img; } };
  slides.forEach(place);
  mobile.addEventListener("change", () => slides.forEach(place));
  function label() { word.textContent = t(slides[i].dataset.word); }
  function go(n) {
    const prev = slides[i]; i = (n + slides.length) % slides.length;
    const cur = slides[i]; load(cur); load(slides[(i + 1) % slides.length]);
    prev.classList.remove("on"); prev.classList.add("off");
    setTimeout(() => prev.classList.remove("off"), 1900);
    cur.classList.remove("on"); void cur.offsetWidth; cur.classList.add("on");
    bars.forEach((b, k) => { b.classList.remove("on", "done"); if (k < i) b.classList.add("done"); });
    void bars[i].offsetWidth; bars[i].classList.add("on");
    word.classList.remove("swap"); void word.offsetWidth; word.classList.add("swap");
    label();
  }
  function run() {
    clearInterval(timer); timer = null;
    if (reduced || !visible || current !== "home" || document.hidden) return;
    timer = setInterval(() => go(i + 1), DURATION);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe($("#hero"));
  document.addEventListener("visibilitychange", run);
  window.addEventListener("hashchange", () => setTimeout(run, 1200));
  load(slides[1]);
  label();
  return { start: run, refresh: label };
})();

/* ---------------------------------------------------------
   Quick contact heart toggle
--------------------------------------------------------- */
const quickCta = $("#quickCta"), qcToggle = $("#qcToggle");
function setQuickOpen(open) {
  quickCta.classList.toggle("open", open);
  qcToggle.setAttribute("aria-expanded", open);
}
qcToggle.addEventListener("click", () => setQuickOpen(!quickCta.classList.contains("open")));
document.addEventListener("click", e => { if (!e.target.closest("#quickCta")) setQuickOpen(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && quickCta.classList.contains("open")) { setQuickOpen(false); qcToggle.focus(); } });
window.addEventListener("hashchange", () => setQuickOpen(false));

/* ---------------------------------------------------------
   Language switch
--------------------------------------------------------- */
function applyLang(next, animate) {
  lang = next; store.set('lang', lang);
  langItems().forEach(b => { const on = b.dataset.lang === lang; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  $('.lang-code').textContent = { en: 'EN', fr: 'FR', ht: 'KR', es: 'ES' }[lang];
  translateStatic();
  checkin.refresh(); booking.refresh(); if (typeof heroSlides !== "undefined") heroSlides.refresh(); renderPrograms(); academy.refresh(); seed.refresh(); circle.refresh();
  if (current) document.title = `${viewTitle(views[current])} · EdenWise`;
  requestAnimationFrame(moveIndicator);
  if (animate && !reduced) { document.body.classList.remove('lang-swap'); void document.body.offsetWidth; document.body.classList.add('lang-swap'); }
}
// Language menu: globe button + dropdown with flags
const langDd = $('#langDd'), langBtn = $('#langBtn'), langItems = () => $$('#langMenu [data-lang]');
// inline codes switch directly; the chevron opens the menu with flags
function setLangOpen(open, focusItem) {
  langDd.classList.toggle('open', open);
  langBtn.setAttribute('aria-expanded', open);
  if (open && focusItem) (langItems().find(b => b.dataset.lang === lang) || langItems()[0]).focus();
}
langBtn.addEventListener('click', () => setLangOpen(!langDd.classList.contains('open'), true));
$('#langMenu').addEventListener('click', e => {
  const b = e.target.closest('[data-lang]');
  if (!b) return;
  setLangOpen(false); langBtn.focus();
  if (b.dataset.lang !== lang) applyLang(b.dataset.lang, true);
});
$('#langMenu').addEventListener('keydown', e => {
  const items = langItems(), i = items.indexOf(document.activeElement);
  const to = n => { e.preventDefault(); items[(n + items.length) % items.length].focus(); };
  if (e.key === 'ArrowDown') to(i + 1);
  else if (e.key === 'ArrowUp') to(i - 1);
  else if (e.key === 'Home') to(0);
  else if (e.key === 'End') to(items.length - 1);
  else if (e.key === 'Tab') setLangOpen(false);
});
langBtn.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setLangOpen(true, true); }
});
document.addEventListener('click', e => { if (!e.target.closest('#langDd')) setLangOpen(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && langDd.classList.contains('open')) { setLangOpen(false); langBtn.focus(); } });
applyLang(lang, false);

/* ---------------------------------------------------------
   Boot — preloader
--------------------------------------------------------- */
(async function boot() {
  if (!location.hash.startsWith('#/')) history.replaceState(null, '', '#/home');
  const route = routeFromHash() || 'home';
  const pre = $('#preloader'), cnt = $('#preCount'), bar = $('.pre-bar i');
  // setTimeout (not requestAnimationFrame) so the loader still finishes in
  // background tabs and embedded browsers where animation frames are paused
  const dur = reduced ? 200 : 2200, t0 = performance.now();
  await new Promise(res => {
    const step = () => {
      const p = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      cnt.textContent = Math.round(e * 100); bar.style.width = e * 100 + '%';
      p < 1 ? setTimeout(step, 16) : res();
    };
    step();
  });
  // keep the view hidden until the curtain lifts so reveals play on screen
  views[route].classList.add('active');
  await wait(250);
  pre.classList.add('done');
  document.body.classList.remove('is-loading');
  await wait(350);
  show(route);
  setTimeout(() => pre.remove(), 1400);
})();

// failsafe: never leave a visitor on the loader or a blank page
setTimeout(() => {
  const pre = $('#preloader');
  if (pre) { pre.classList.add('done'); setTimeout(() => pre.remove(), 1400); }
  document.body.classList.remove('is-loading');
  if (!current) show(routeFromHash() || 'home');
}, 6000);
})();
