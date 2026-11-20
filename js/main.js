/* ==========================================================================
   UC8 — main interactions
   ========================================================================== */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const isHome = !!document.getElementById('home');   // index.html (hero, work, services…) vs team.html

  /* Form endpoint */
  const FORM_ENDPOINT = '';
  const STUDIO_EMAIL = 'unicreate9999@gmail.com';

  $('#year').textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Grain overlay texture (created once)
     ------------------------------------------------------------------ */
  (function grain() {
    const c = document.createElement('canvas'); c.width = c.height = 180;
    const x = c.getContext('2d'), d = x.createImageData(180, 180);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255 | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; }
    x.putImageData(d, 0, 0);
    $('.grain').style.backgroundImage = `url(${c.toDataURL()})`;
  })();

  if (!hasGSAP) { document.documentElement.classList.add('no-gsap'); }
  else gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------
     Smooth scroll (Lenis) + ScrollTrigger sync
     ------------------------------------------------------------------ */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.12, smoothWheel: true, wheelMultiplier: 1 });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    }
  }
  const introRunning = () => !window.UC8_INTRO_DONE;
  if (introRunning()) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    lenis && lenis.stop();
  }

  function scrollToTarget(hash) {
    const el = hash === '#home' || hash === '#top' ? 0 : $(hash);
    if (el === null) return;
    if (lenis) lenis.scrollTo(el, { offset: el === 0 ? 0 : -70, duration: 1.4 });
    else if (el === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else el.scrollIntoView({ behavior: 'smooth' });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    if (a.classList.contains('nav__logo') && window.UC8Intro) {   // UC8 logo → replay intro
      e.preventDefault(); closeMenu(); window.UC8Intro.play(); return;
    }
    const hash = a.getAttribute('href');
    if (hash.length < 2) { e.preventDefault(); return; }
    e.preventDefault();
    closeMenu();
    if (modal && modal.classList.contains('is-open')) closeModal();
    scrollToTarget(hash);
  });

  /* ------------------------------------------------------------------
     Top scroll progress line
     ------------------------------------------------------------------ */
  (function progress() {
    const bar = $('#scrollProgress'); if (!bar) return;
    let ticking = false;
    const upd = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  })();

  /* ------------------------------------------------------------------
     Nav + mobile menu
     ------------------------------------------------------------------ */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#mobileMenu');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 30);
    lastY = y;
  }, { passive: true });
  function closeMenu() {
    menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false'); burger.querySelector('use').setAttribute('href', '#i-menu');
    document.body.classList.remove('menu-open');
    lenis && !introRunning() && lenis.start();
  }
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    if (!open) return closeMenu();
    menu.classList.add('is-open'); menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true'); burger.querySelector('use').setAttribute('href', '#i-close');
    document.body.classList.add('menu-open');
    lenis && lenis.stop();
  });

  /* ------------------------------------------------------------------
     Split headings into words (for reveal)
     ------------------------------------------------------------------ */
  function splitWords(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.className = 'w__i'; i.textContent = p;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return $$('.w__i', el);
  }
  $$('[data-split]').forEach((el) => { el._words = splitWords(el); });

  /* ------------------------------------------------------------------
     One-line headings: every main section heading (not the hero, not the
     statement) stays on a single line. It keeps its designed size where it
     fits and scales down just enough on narrower screens.
     ------------------------------------------------------------------ */
  (function fitHeadings() {
    const heads = $$('.h2, .contact__title, .team-cta__title');
    if (!heads.length) return;
    heads.forEach((el) => el.classList.add('fit-line'));
    const box = (el) => {                      // the width the heading may use
      const b = el.closest('.team-cta__box, .container') || el.parentElement;
      const cs = getComputedStyle(b);
      return b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    };
    let lastW = -1;
    function fit() {
      const vw = document.documentElement.clientWidth;
      if (vw === lastW) return;                // ignore mobile URL-bar height changes
      lastW = vw;
      heads.forEach((el) => {
        el.style.fontSize = '';
        const max = parseFloat(getComputedStyle(el).fontSize);
        // measure the natural one-line width with an invisible copy (unaffected by animations)
        const c = el.cloneNode(true);
        c.removeAttribute('id');
        c.style.cssText = `position:absolute;left:-9999px;top:0;visibility:hidden;width:auto;max-width:none;white-space:nowrap;font-size:${max}px`;
        el.parentNode.appendChild(c);
        const natural = c.offsetWidth;
        c.remove();
        const avail = box(el);
        if (natural > avail && natural > 0) el.style.fontSize = `${Math.floor((max * avail / natural) * 0.985 * 10) / 10}px`;
      });
    }
    fit();
    addEventListener('resize', fit, { passive: true });
    addEventListener('orientationchange', () => { lastW = -1; fit(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { lastW = -1; fit(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  })();

  /* ------------------------------------------------------------------
     Content rendering: clients, projects, services
     ------------------------------------------------------------------ */
  // clients
  const clientHTML = (list) => list.map((c) => c.img
    ? `<div class="logo"><img src="${c.img}" alt="${c.name}" draggable="false" /></div>`
    : `<div class="logo logo--${c.style}"><span>${c.name}</span><i>placeholder</i></div>`).join('');
  const CL = window.UC8_CLIENTS || [];
  const half = Math.ceil(CL.length / 2);
  if ($('#marqueeA') && CL.length) {           // section is hidden until real client logos exist
    $('#marqueeA').innerHTML = clientHTML(CL.slice(0, half));
    $('#marqueeB').innerHTML = clientHTML(CL.slice(half));
  }

  // Background artwork for each case card, drawn from what the client does (set `motif` in js/data.js).
  // Shaded vector illustrations: crisp at any size, nothing to download. They animate once when the card scrolls into view.
  function motif(p) {
    const k = p.motif || (p.art === 'growth' ? 'saree' : 'event');
    const u = 'm' + String(p.title).replace(/[^a-z0-9]/gi, '');
    const svg = (vb, body, ar = 'xMaxYMax meet') => `<svg class="fx__motif fx__motif--${k}" viewBox="${vb}" preserveAspectRatio="${ar}" aria-hidden="true" focusable="false">${body}</svg>`;

    if (k === 'saree') { // draped silk with a woven zari border
      return svg('0 0 300 200', `<defs>
        <linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d1730"/><stop offset=".45" stop-color="#a3223f"/><stop offset=".7" stop-color="#5c0e22"/><stop offset="1" stop-color="#2e0612"/></linearGradient>
        <linearGradient id="${u}h" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#ffd9e2" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd08a"/><stop offset=".35" stop-color="#ff9a3c"/><stop offset=".7" stop-color="#c25a0e"/><stop offset="1" stop-color="#ffb35c"/></linearGradient>
        <linearGradient id="${u}sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <pattern id="${u}z" width="24" height="34" patternUnits="userSpaceOnUse" y="160">
          <path d="M12 6 20 17 12 28 4 17Z" fill="url(#${u}g)"/><path d="M12 11 16 17 12 23 8 17Z" fill="#5c0e22"/><circle cx="12" cy="17" r="1.6" fill="url(#${u}g)"/>
          <circle cx="0" cy="17" r="1.8" fill="url(#${u}g)"/><circle cx="24" cy="17" r="1.8" fill="url(#${u}g)"/></pattern>
        <clipPath id="${u}cb"><rect y="152" width="300" height="48"/></clipPath></defs>
        <g class="mo-drape">
          <path d="M0 70C60 46 112 96 176 72S262 40 300 58V200H0Z" fill="url(#${u}s)"/>
          <path d="M0 108C50 92 104 128 160 112S250 82 300 96V200H0Z" fill="#000" opacity=".18"/>
          <path d="M30 200C60 150 92 106 150 80l18 2c-58 26-86 68-110 118Z" fill="url(#${u}h)"/>
          <path d="M150 200c26-48 60-86 120-112l14 4c-56 24-90 62-112 108Z" fill="url(#${u}h)" opacity=".7"/>
          <rect y="152" width="300" height="48" fill="#3e0917"/>
          <rect y="154" width="300" height="3" fill="url(#${u}g)"/><rect y="194" width="300" height="3" fill="url(#${u}g)"/>
          <rect y="160" width="300" height="34" fill="url(#${u}z)"/>
          <g clip-path="url(#${u}cb)"><rect class="mo-sheen" x="-90" y="150" width="70" height="52" fill="url(#${u}sw)"/></g>
        </g>`, 'xMidYMax slice');
    }

    if (k === 'car') { // pearl-white sedan with a verified seal
      const wheel = (x) => `<g class="mo-wheel" style="transform-origin:${x}px 96px">
          <circle cx="${x}" cy="96" r="17" fill="#0b0c0c"/><circle cx="${x}" cy="96" r="16" fill="none" stroke="#2b2e2e" stroke-width="2"/>
          <circle cx="${x}" cy="96" r="11" fill="url(#${u}m)"/>
          <g stroke="#2e3433" stroke-width="2.4" stroke-linecap="round">${[0, 72, 144, 216, 288].map((a) => `<path d="M${x} 96l${(Math.sin(a * Math.PI / 180) * 9).toFixed(1)} ${(-Math.cos(a * Math.PI / 180) * 9).toFixed(1)}"/>`).join('')}</g>
          <circle cx="${x}" cy="96" r="3" fill="#cfd5d3"/></g>`;
      return svg('0 0 240 124', `<defs>
        <linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#d9dfdd"/><stop offset=".7" stop-color="#9aa4a1"/><stop offset="1" stop-color="#4c5452"/></linearGradient>
        <linearGradient id="${u}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a3b38"/><stop offset=".5" stop-color="#0d1514"/><stop offset="1" stop-color="#1c2a28"/></linearGradient>
        <linearGradient id="${u}r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <radialGradient id="${u}m" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#f2f5f4"/><stop offset=".6" stop-color="#8d9694"/><stop offset="1" stop-color="#3a403f"/></radialGradient>
        <radialGradient id="${u}sh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
        <radialGradient id="${u}hl" cx="0" cy=".5" r="1"><stop offset="0" stop-color="#fff6d8" stop-opacity=".75"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
        <radialGradient id="${u}v" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#b9ffe3"/><stop offset=".55" stop-color="currentColor"/><stop offset="1" stop-color="#0f5c43"/></radialGradient></defs>
        <g class="mo-car">
          <ellipse cx="122" cy="113" rx="112" ry="8" fill="url(#${u}sh)"/>
          <path class="mo-beam" d="M12 78 -40 64V96Z" fill="url(#${u}hl)"/>
          <path d="M10 88c0-9 5-15 15-17l34-7c9-9 22-19 38-22l52-2c13 0 23 8 34 19l31 6c10 2 16 9 16 18v6c0 4-3 6-7 6h-31a20 20 0 0 0-40 0H76a20 20 0 0 0-40 0H17c-4 0-7-3-7-7Z" fill="url(#${u}b)"/>
          <path d="M70 63c8-8 18-15 30-17l24-1v18Zm60-18 20-1c10 0 18 8 26 19h-46Z" fill="url(#${u}w)"/>
          <path d="M84 62l16-15h8L92 62Zm54 0 12-17h5l-12 17Z" fill="#fff" opacity=".22"/>
          <path d="M22 72 218 67" stroke="url(#${u}r)" stroke-width="2"/>
          <path d="M98 64v28M128 63v29" stroke="#000" stroke-opacity=".28" stroke-width="1"/>
          <path d="M110 74h8M140 74h8" stroke="#000" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M68 60l-4 4h8Z" fill="#7f8987"/>
          <path d="M12 79c3-3 8-4 12-4l-2 6c-4 0-7 0-10-2Z" fill="#fffbe8"/>
          <path d="M226 71l6 2v6l-7-1Z" fill="#ff3b3b"/>
          ${wheel(56)}${wheel(176)}
        </g>
        <g class="mo-seal" style="transform-origin:214px 22px">
          <circle cx="214" cy="22" r="20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2.5 3.2" opacity=".75"/>
          <circle cx="214" cy="22" r="15.5" fill="url(#${u}v)"/>
          <path class="mo-check" pathLength="1" d="m206.5 22.5 5 5 9.5-10.5" fill="none" stroke="#06140f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </g>`);
    }

    if (k === 'tech') { // processor on a board
      const pins = [];
      for (let i = 0; i < 6; i++) { const v = 41 + i * 11.6; pins.push(`<rect x="${v - 2}" y="17" width="4" height="13" rx="1"/><rect x="${v - 2}" y="110" width="4" height="13" rx="1"/><rect x="17" y="${v - 2}" width="13" height="4" rx="1"/><rect x="110" y="${v - 2}" width="13" height="4" rx="1"/>`); }
      return svg('0 0 140 140', `<defs>
        <linearGradient id="${u}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9eef2"/><stop offset=".5" stop-color="#9aa6b1"/><stop offset="1" stop-color="#5d6873"/></linearGradient>
        <linearGradient id="${u}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d2733"/><stop offset="1" stop-color="#0b1017"/></linearGradient>
        <linearGradient id="${u}l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f7fa"/><stop offset=".35" stop-color="#c3ccd5"/><stop offset=".65" stop-color="#8e9aa6"/><stop offset="1" stop-color="#d5dde4"/></linearGradient>
        <linearGradient id="${u}sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <radialGradient id="${u}gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="currentColor" stop-opacity=".5"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>
        <clipPath id="${u}cl"><rect x="40" y="40" width="60" height="60" rx="6"/></clipPath></defs>
        <circle class="mo-glow" cx="70" cy="70" r="70" fill="url(#${u}gl)"/>
        <g class="mo-pins" fill="url(#${u}p)">${pins.join('')}</g>
        <rect x="28" y="28" width="84" height="84" rx="9" fill="url(#${u}c)" stroke="#2c3846"/>
        <rect x="40" y="40" width="60" height="60" rx="6" fill="url(#${u}l)"/>
        <rect x="40.5" y="40.5" width="59" height="59" rx="5.5" fill="none" stroke="#fff" stroke-opacity=".6"/>
        <text x="70" y="73" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="8.5" font-weight="700" letter-spacing="1.2" fill="#3a4550">SESRITHA</text>
        <g clip-path="url(#${u}cl)"><rect class="mo-sheen" x="-10" y="20" width="26" height="100" fill="url(#${u}sw)" transform="rotate(20 70 70)"/></g>
        <circle cx="34" cy="34" r="2" fill="#5d6873"/>`);
    }

    // event: warm string lights with soft glow
    const bulbs = [[27, 34], [51, 40], [75, 36], [125, 36], [149, 40], [173, 34]];
    return svg('0 0 200 100', `<defs>
      <radialGradient id="${u}b" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fffdf5"/><stop offset=".45" stop-color="#ffe6b0"/><stop offset="1" stop-color="#ffb46b"/></radialGradient>
      <radialGradient id="${u}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".6"/><stop offset=".45" stop-color="currentColor" stop-opacity=".2"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>
      <radialGradient id="${u}k" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="currentColor" stop-opacity=".35"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>
      <g class="mo-bokeh"><circle cx="38" cy="78" r="16" fill="url(#${u}k)"/><circle cx="110" cy="84" r="11" fill="url(#${u}k)"/><circle cx="168" cy="74" r="19" fill="url(#${u}k)"/><circle cx="88" cy="64" r="7" fill="url(#${u}k)"/></g>
      <path d="M4 18Q50 60 100 22Q150 60 196 18" fill="none" stroke="#2a2326" stroke-width="1.6"/>
      <path d="M4 18Q50 60 100 22Q150 60 196 18" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width=".6" transform="translate(0 -.6)"/>
      ${bulbs.map(([x, y], j) => `<g class="mo-bulb" style="--d:${(0.15 + j * 0.16).toFixed(2)}s">
        <circle class="mo-halo" cx="${x}" cy="${y + 13}" r="15" fill="url(#${u}g)"/>
        <rect x="${x - 2.6}" y="${y - 1}" width="5.2" height="6" rx="1.2" fill="#3b3337"/>
        <path class="mo-lamp" d="M${x} ${y + 5}c-4 0-6.2 4-6.2 8 0 3.8 2.8 6.6 6.2 6.6s6.2-2.8 6.2-6.6c0-4-2.2-8-6.2-8Z" fill="url(#${u}b)"/>
        <ellipse cx="${x - 2}" cy="${y + 11}" rx="1.4" ry="2.4" fill="#fff" opacity=".85"/></g>`).join('')}`, 'xMaxYMin meet');
  }

  // projects
  function featuredArt(p) {
    const m = p.metric;
    if (p.art === 'growth') {
      return `<div class="art art--feat art--growth">
        <div class="fx">
          <div class="fx__metric display"><span class="fx__from">${m.from}${m.unit}</span><svg class="ico fx__arrow"><use href="#i-arrow"/></svg><span><b data-countto="${m.to}">${m.from}</b>${m.unit}</span></div>
          <div class="fx__label mono"><svg class="ico"><use href="#i-instagram"/></svg>${m.label}</div>
          <span class="fx__chip"><svg class="ico"><use href="#i-arrow-ur"/></svg>${p.badge}</span>
        </div>
        ${motif(p)}
      </div>`;
    }
    // Lead-generation template: one or two animated results + funnel + popping tags
    const stats = p.metrics || (m ? [{ to: m.to, unit: m.unit, label: m.label, icon: 'team' }] : []);
    const num = (s) => s.range
      ? `<b data-countto="${s.range[0]}">0</b>-<b data-countto="${s.range[1]}">0</b>`
      : `<b data-countto="${s.to}">0</b>${s.unit || ''}`;
    const pings = (p.pings || ['New lead', 'New lead', 'New lead']).slice(0, 3);
    return `<div class="art art--feat art--leads tone--${p.tone || 'violet'}${stats.length > 1 ? ' is-multi' : ''}">
      <div class="fx">
        ${stats.map((s) => `<div class="fx__stat">
          <div class="fx__metric display"><span>${num(s)}</span></div>
          <div class="fx__label mono"><svg class="ico"><use href="#i-${s.icon || 'team'}"/></svg>${esc(s.label)}</div>
        </div>`).join('')}
      </div>
      ${motif(p)}
      <div class="fx__pings" aria-hidden="true">${pings.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    </div>`;
  }
  // Instagram / Facebook link for a case study (older entries use `instagram: {url, handle}`)
  const socialOf = (p) => p.social || (p.instagram ? { net: 'instagram', ...p.instagram } : null);
  const NET = { instagram: 'Instagram', facebook: 'Facebook' };
  function thumbArt(p, i) {
    const h = p.hue, c1 = `hsl(${h} 85% 58%)`, c2 = `hsl(${(h + 40) % 360} 70% 30%)`;
    const style = `--h:${h};--c1:${c1};--c2:${c2}`;
    const initials = p.title.split(' ').map((w) => w[0]).join('').slice(0, 2);
    switch (p.category) {
      case 'Websites':
        return `<div class="art art--web" style="${style}"><div class="b-bar"><i></i><i></i><i></i><span></span></div>
          <div class="b-body"><div class="b-copy"><b></b><b></b><b class="s"></b><em></em></div><div class="b-img"></div></div>
          <div class="b-row"><i></i><i></i><i></i></div></div>`;
      case 'Social & Content':
        return `<div class="art art--social" style="${style}"><div class="phone"><div class="ph-head"><i></i><b></b></div>
          <div class="ph-grid">${Array.from({ length: 9 }, (_, k) => `<i style="--k:${k}"></i>`).join('')}</div></div>
          <div class="reel"><svg class="ico"><use href="#i-play"/></svg></div></div>`;
      case 'Branding':
        return `<div class="art art--brand" style="${style}"><div class="mono-mark display">${initials}</div>
          <div class="swatches"><i></i><i></i><i></i><i></i></div><div class="brand-name mono">${p.title.toUpperCase()}</div></div>`;
      case 'Video':
        return `<div class="art art--video" style="${style}"><div class="v-frame"><div class="v-sun"></div><div class="v-hill"></div></div>
          <div class="v-play"><svg class="ico"><use href="#i-play"/></svg></div>
          <div class="v-tc mono">REC 00:0${i % 9}:2${i % 7}:1${i % 5}</div><div class="v-bar"><span style="width:${30 + (i * 17) % 55}%"></span></div></div>`;
      default:
        return `<div class="art art--campaign" style="${style}"><div class="poster"><span class="mono">CAMPAIGN · ${p.year}</span>
          <strong class="display">${p.title.split(' ')[0]}</strong><em class="display">${p.sub.split(' ')[0]}</em></div><div class="burst"></div></div>`;
    }
  }
  const PROJ = window.UC8_PROJECTS || [];
  // Video edits are listed only on the "All work" page (work.html); the home page shows just the case-study table.
  const ALL_WORK = document.body.dataset.page === 'work';
  const VIDS = ALL_WORK ? (window.UC8_VIDEOS || []) : [];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const grid = $('#workGrid');
  const caseCard = (p, i) => `
    <article class="work-card work-card--featured case case--${p.tone || 'brand'}${(p.metrics || []).length > 1 ? ' case--multi' : ''}" data-cat="${p.category}" data-i="${i}">
      <div class="work-card__inner case__inner">
        <div class="case__info">
          <span class="case__kicker mono"><i></i>${p.category}</span>
          <h3 class="case__title display">${p.title}</h3>
          <p class="case__line">${(p.line || p.sub).replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>')}</p>
          ${p.tags ? `<ul class="case__tags">${p.tags.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
          ${socialOf(p) ? ((s) => `<div class="case__actions">
            <a class="case__ig case__ig--${s.net}" href="${s.url}" target="_blank" rel="noopener" aria-label="${esc(p.title)} on ${NET[s.net]} (opens in a new tab)">
              <span class="case__ig-icon"><svg class="ico brandmark"><use href="#i-${s.net === 'facebook' ? 'fb' : 'ig'}-logo"/></svg></span>
              <span class="case__ig-text">${esc(s.handle)}</span>
              <svg class="ico case__ig-arrow"><use href="#i-arrow-ur"/></svg>
            </a>
          </div>`)(socialOf(p)) : ''}
        </div>
        <div class="case__visual">${p.thumb ? `<img src="${p.thumb}" alt="${p.title}" loading="lazy" />` : featuredArt(p)}</div>
        <span class="work-card__pin" aria-hidden="true"></span>
      </div>
    </article>`;
  if (grid) {
  grid.innerHTML = '<div class="work__table" aria-hidden="true"><span></span></div>' + PROJ.map((p, i) => p.featured ? caseCard(p, i) : `
    <article class="work-card${p.featured ? ' work-card--featured' : ''}" data-cat="${p.category}" data-i="${i}">
      <div class="work-card__inner">
        <div class="work-card__thumb">
          ${p.thumb ? `<img src="${p.thumb}" alt="${p.title}" loading="lazy" />` : (p.featured ? featuredArt(p) : thumbArt(p, i))}
          ${p.placeholder ? '<span class="ph-tag mono">Placeholder</span>' : ''}
          <span class="work-card__pin" aria-hidden="true"></span>
        </div>
        <div class="work-card__meta">
          <div>
            <h3>${p.title}</h3>
            <span class="mono">${p.featured ? p.sub : `${p.category} · ${p.year}`}</span>
          </div>
          ${p.link
            ? `<a class="work-card__link" href="${p.link}" data-project="${i}" target="_blank" rel="noopener">${p.category === 'Websites' ? 'View project' : 'Explore'} <svg class="ico"><use href="#i-arrow"/></svg></a>`
            : `<button class="work-card__link" type="button" data-project="${i}">${p.category === 'Websites' ? 'View project' : 'Explore'} <svg class="ico"><use href="#i-arrow"/></svg></button>`}
          ${p.instagram ? `<a class="work-card__ig" href="${p.instagram.url}" target="_blank" rel="noopener" aria-label="${p.title} on Instagram (opens in a new tab)"><svg class="ico"><use href="#i-instagram"/></svg>${p.instagram.handle}<svg class="ico"><use href="#i-arrow-ur"/></svg></a>` : ''}
        </div>
      </div>
    </article>`).join('') + VIDS.map((v, j) => `
    <article class="work-card work-card--video${v.v ? '' : ' is-wide'}" data-cat="Video" data-i="${PROJ.length + j}">
      <a class="work-card__inner vcard" href="https://drive.google.com/file/d/${encodeURIComponent(v.id)}/view" target="_blank" rel="noopener" aria-label="Play ${esc(v.title)} (${esc(v.cat)}) on Google Drive, opens in a new tab">
        <img src="${v.thumb}" alt="" loading="lazy" decoding="async"${v.pos ? ` style="object-position:${v.pos}"` : ''} />
        <span class="vcard__shade" aria-hidden="true"></span>
        <span class="vcard__top" aria-hidden="true"><span class="vcard__cat mono">${esc(v.cat)}</span>${v.dur ? `<span class="vcard__dur mono">${v.dur}</span>` : ''}</span>
        <span class="vcard__play" aria-hidden="true"><svg class="ico"><use href="#i-play"/></svg></span>
        <span class="vcard__info"><strong>${esc(v.title)}</strong><small class="mono">${v.v ? 'Reel' : 'Film'}${v.dur ? ` · ${v.dur}` : ''}</small></span>
        <span class="work-card__pin" aria-hidden="true"></span>
      </a>
    </article>`).join('');
  $$('.work-card__link[data-project]', grid).forEach((a) => {
    const p = PROJ[+a.dataset.project];
    if (p.link) return;
    a.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const so = socialOf(p);
      if (p.featured) openModal(p.category, p.title, p.story, p.results, so && { href: so.url, label: `See ${so.handle} on ${NET[so.net]}`, icon: so.net });
      else openModal(`${p.category} · ${p.year}`, p.title, `${p.sub}. Placeholder project: replace it with real work in js/data.js.`, ['Challenge', 'Approach', 'Results']);
    });
  });

  /* Play each card's artwork animation once, when that card scrolls into view. */
  (function liveArt() {
    const cards = $$('.case', grid);
    if (!cards.length) return;
    if (!('IntersectionObserver' in window)) { cards.forEach((c) => c.classList.add('is-live')); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      // On the home page the stack animation marks each card live as it lands (grid.dataset.deal)
      if (en.isIntersecting) { io.unobserve(en.target); if (grid.dataset.deal !== '1') en.target.classList.add('is-live'); }
    }), { threshold: 0.35 });
    cards.forEach((c) => io.observe(c));
  })();

  /* Count each card's numbers up when that card lands / comes into view (it gets .is-live). */
  (function results() {
    const DUR = 800; // fast count, ease-out so it lands softly
    const tick = (card) => {
      $$('[data-countto]', card).forEach((el) => {
        if (el.dataset.start === undefined) el.dataset.start = +el.textContent || 0;
        const to = +el.dataset.countto, from = +el.dataset.start, t0 = performance.now();
        const run = ++el._run || (el._run = 1);
        const step = (now) => {
          if (el._run !== run) return; // a newer replay took over
          const k = Math.min(1, (now - t0) / DUR), e = 1 - Math.pow(1 - k, 4);
          el.textContent = Math.round(from + (to - from) * e);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };
    const count = (card) => {
      if (card.classList.contains('is-counted')) return;
      card.classList.add('is-counted');
      tick(card);
    };
    // Replay the count when a card is hovered (mouse / trackpad only, at most once every 1.2s)
    const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce;
    $$('.work-card--featured', grid).forEach((card) => {
      if (canHover) {
        let last = 0;
        card.addEventListener('mouseenter', () => {
          const now = performance.now();
          if (!card.classList.contains('is-counted') || now - last < 1200) return;
          last = now; tick(card);
        });
      }
      if (card.classList.contains('is-live')) { count(card); return; }
      const mo = new MutationObserver(() => { if (card.classList.contains('is-live')) { mo.disconnect(); count(card); } });
      mo.observe(card, { attributes: true, attributeFilter: ['class'] });
    });
  })();
  }

  // services
  const SV = window.UC8_SERVICES || [];
  if ($('#servicesGrid')) $('#servicesGrid').innerHTML = SV.map((s, i) => `
    <article class="glass service">
      <div class="service__top">
        <span class="badge badge--round"><svg class="ico"><use href="#${s.icon}"/></svg></span>
        <button class="service__more" type="button" data-service="${i}" aria-label="View ${s.title} details"><svg class="ico"><use href="#i-arrow-ur"/></svg></button>
      </div>
      <h3 class="service__title">${s.title}</h3>
      <p>${s.line}</p>
    </article>`).join('');
  $$('.service').forEach((card) => card.addEventListener('click', (e) => {
    if (!e.target.closest('[data-service]')) card.querySelector('[data-service]').click();
  }));
  $$('[data-service]').forEach((b) => b.addEventListener('click', () => {
    const s = SV[+b.dataset.service];
    openModal(`Service ${String(+b.dataset.service + 1).padStart(2, '0')}`, s.title, s.text, s.list);
  }));

  /* ------------------------------------------------------------------
     Modal
     ------------------------------------------------------------------ */
  const modal = $('#modal');
  let lastFocus = null;
  function openModal(kicker, title, text, list, extra) {
    const ex = $('#modalExtra');
    if (extra) { ex.href = extra.href; $('span', ex).textContent = extra.label; const u = $('use', ex); if (u) u.setAttribute('href', '#i-' + (extra.icon || 'instagram')); ex.hidden = false; }
    else ex.hidden = true;
    $('#modalKicker').textContent = kicker;
    $('#modalTitle').textContent = title;
    $('#modalText').textContent = text;
    $('#modalList').innerHTML = (list || []).map((l) => `<li><svg class="ico"><use href="#i-check"/></svg>${l}</li>`).join('');
    lastFocus = document.activeElement;
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
    setTimeout(() => $('.modal__close', modal).focus(), 50);
  }
  function closeModal() {
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
    lenis && lenis.start();
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  if (modal) $$('[data-close]', modal).forEach((el) => el.addEventListener('click', (e) => { if (el.tagName !== 'A') { e.preventDefault(); } closeModal(); }));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (modal && modal.classList.contains('is-open')) closeModal(); if (menu.classList.contains('is-open')) closeMenu(); }
  });

  /* ------------------------------------------------------------------
     Draggable logo marquee with inertia
     ------------------------------------------------------------------ */
  function Marquee(row) {
    const track = row.querySelector('.marquee__track');
    const auto = parseFloat(row.dataset.marquee) || -0.5;
    const baseHTML = track.innerHTML;
    let setW = 0, x = 0, v = auto, dragging = false, lastX = 0, lastT = 0, visible = true, raf = 0;
    function build() {
      track.innerHTML = baseHTML;
      setW = track.scrollWidth;
      if (!setW) return;
      const copies = Math.max(2, Math.ceil((row.clientWidth * 2) / setW) + 1);
      track.innerHTML = baseHTML.repeat(copies);
    }
    function wrap() { if (!setW) return; while (x <= -setW) x += setW; while (x > 0) x -= setW; }
    let prev = 0;
    function tick(now) {
      const dt = Math.min(3, (now - prev) / 16.667 || 1); prev = now;
      if (!dragging) { x += v * dt; v += (auto - v) * 0.035 * dt; }
      wrap();
      track.style.transform = `translate3d(${x}px,0,0)`;
      raf = visible ? requestAnimationFrame(tick) : 0;
    }
    row.addEventListener('pointerdown', (e) => {
      dragging = true; lastX = e.clientX; lastT = performance.now(); v = 0;
      row.setPointerCapture(e.pointerId); row.classList.add('is-drag');
    });
    row.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now(), dx = e.clientX - lastX, dt = Math.max(1, now - lastT);
      x += dx; v = v * 0.4 + (dx / dt) * 16.667 * 0.6;
      lastX = e.clientX; lastT = now;
    });
    const up = () => { if (!dragging) return; dragging = false; row.classList.remove('is-drag'); v = Math.max(-60, Math.min(60, v)); };
    row.addEventListener('pointerup', up); row.addEventListener('pointercancel', up); row.addEventListener('lostpointercapture', up);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick); }).observe(row);
    build();
    window.addEventListener('resize', () => { build(); });
    if (document.fonts) document.fonts.ready.then(build);
    if (reduce) v = 0;
  }
  $$('[data-marquee]').forEach(Marquee);

  /* ------------------------------------------------------------------
     Process: expanders + starfield
     ------------------------------------------------------------------ */
  $$('.step .step__more').forEach((b) => b.addEventListener('click', () => {
    const step = b.closest('.step'), open = !step.classList.contains('is-open');
    step.classList.toggle('is-open', open); b.setAttribute('aria-expanded', String(open));
    hasGSAP && setTimeout(() => ScrollTrigger.refresh(), 450);
  }));

  (function stars() {
    const c = $('#stars'); if (!c) return;
    const x = c.getContext('2d'); let w, h, pts = [], on = false, raf = 0;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    function size() {
      const r = c.getBoundingClientRect(); w = r.width; h = r.height;
      c.width = w * dpr; c.height = h * dpr;
      const n = Math.round((w * h) / 9000);
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.2, t: Math.random() * 6, s: 0.4 + Math.random() * 1.4, o: Math.random() < 0.12 }));
    }
    function draw(now) {
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
      const T = now / 1000;
      for (const p of pts) {
        const a = 0.15 + 0.6 * (0.5 + 0.5 * Math.sin(T * p.s + p.t));
        x.fillStyle = p.o ? `rgba(255,122,26,${a})` : `rgba(235,235,245,${a * 0.7})`;
        x.beginPath(); x.arc(p.x, (p.y - T * 4 * p.s + h) % h, p.r, 0, Math.PI * 2); x.fill();
      }
      raf = on && !reduce ? requestAnimationFrame(draw) : 0;
    }
    size(); window.addEventListener('resize', size);
    new IntersectionObserver(([en]) => { on = en.isIntersecting; if (on && !raf) raf = requestAnimationFrame(draw); }).observe(c);
  })();

  /* ------------------------------------------------------------------
     Contact form
     ------------------------------------------------------------------ */
  (function form() {
    const f = $('#contactForm'); if (!f) return;
    const msg = f.message, count = $('#msgCount'), status = $('#formStatus');
    const upd = () => { count.textContent = `${msg.value.length} / 600`; count.classList.toggle('is-near', msg.value.length > 520); };
    msg.addEventListener('input', upd); upd();
    const rules = {
      name: (v) => v.trim().length >= 2 || 'Please enter your name',
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Enter a valid email',
      phone: (v) => !v.trim() || /^[+\d][\d\s()-]{6,}$/.test(v.trim()) || 'Enter a valid phone number',
      type: (v) => !!v || 'Pick a project type',
      message: (v) => v.trim().length >= 10 || 'Tell us a little more (10+ characters)',
    };
    function check(el) {
      const r = rules[el.name]; if (!r) return true;
      const res = r(el.value), field = el.closest('.field');
      field.classList.toggle('is-error', res !== true);
      field.querySelector('.field__err').textContent = res === true ? '' : res;
      return res === true;
    }
    $$('input,select,textarea', f).forEach((el) => {
      el.addEventListener('blur', () => el.value && check(el));
      el.addEventListener('input', () => el.closest('.field').classList.contains('is-error') && check(el));
      el.addEventListener('change', () => el.closest('.field').classList.contains('is-error') && check(el));
    });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const els = $$('input,select,textarea', f);
      const ok = els.map(check).every(Boolean);
      if (!ok) { status.textContent = 'Please fix the highlighted fields.'; status.className = 'form__status mono is-error'; const bad = $('.is-error input, .is-error select, .is-error textarea', f); bad && bad.focus(); return; }
      const btn = $('button[type=submit]', f); btn.disabled = true; $('.btn__label', btn).textContent = 'Sending…';
      const data = Object.fromEntries(new FormData(f).entries());
      try {
        if (FORM_ENDPOINT) {
          const r = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
          if (!r.ok) throw new Error('bad status');
        } else {
          // Open an email draft when no endpoint is set.
          const body = [
            `Name: ${data.name}`, `Email: ${data.email}`, data.phone ? `Phone: ${data.phone}` : '', data.company ? `Company / Brand: ${data.company}` : '',
            `Project type: ${data.type}`, data.timeline ? `Timeline: ${data.timeline}` : '', '', data.message,
          ].filter((l, i, arr) => l !== '' || arr[i - 1] !== '').join('\n');
          window.location.href = `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent('Project brief: ' + (data.company || data.name))}&body=${encodeURIComponent(body)}`;
        }
        status.textContent = FORM_ENDPOINT
          ? `Thanks ${data.name.split(' ')[0]}, brief received. We'll be in touch soon.`
          : `Thanks ${data.name.split(' ')[0]}, your email app should open with the brief ready to send to ${STUDIO_EMAIL}.`;
        status.className = 'form__status mono is-ok';
        f.reset(); upd();
      } catch (err) {
        status.textContent = `Something went wrong. Email us directly at ${STUDIO_EMAIL}`;
        status.className = 'form__status mono is-error';
      } finally {
        btn.disabled = false; $('.btn__label', btn).textContent = 'Send project brief';
      }
    });
  })();

  /* Give the logo a small flicker. */
  (function logoFlicker() {
    if (reduce || !Element.prototype.animate) return;
    const logos = $$('.seglogo--nav, .seglogo--footer');
    const R = (a, b) => a + Math.random() * (b - a);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const flick = (el, steps, dur) => el.animate(steps.map((o) => ({ opacity: o })), { duration: dur, easing: 'steps(1, end)' });
    function glitch() {
      if (!document.hidden && window.UC8_INTRO_DONE && logos.length) {
        const svg = pick(logos), segs = $$('.seg', svg), mode = Math.random();
        if (mode < 0.55) {                       // one or two segments sputter
          for (let i = 0, n = Math.random() < 0.5 ? 1 : 2; i < n; i++) flick(pick(segs), [1, 0.15, 0.9, 0.25, 1, 0.6, 1], R(260, 480));
        } else if (mode < 0.8) {                 // the whole mark dips like a voltage drop
          flick(svg, [1, 0.45, 1, 0.6, 1], R(240, 380));
        } else {                                 // a segment drops out for a moment
          flick(pick(segs), [1, 0.08, 0.08, 0.08, 0.5, 1], R(500, 900));
        }
      }
      setTimeout(glitch, R(1800, 5200));
    }
    setTimeout(glitch, 2500);
  })();

  /* ------------------------------------------------------------------
     Phone: tap the number to choose Call or WhatsApp
     ------------------------------------------------------------------ */
  (() => {
    const wrap = $('#contactPhone');
    if (!wrap) return;
    const btn = $('.contact__phone-btn', wrap), opts = $('#phoneOptions');
    const setOpen = (open) => { opts.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', () => setOpen(opts.hidden));
    $$('a', opts).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !opts.hidden) { setOpen(false); btn.focus(); } });
  })();

  /* ------------------------------------------------------------------
     Without GSAP: show everything, keep filters working, and stop here
     ------------------------------------------------------------------ */
  if (!hasGSAP) {
    const usedCats = new Set((window.UC8_PROJECTS || []).map((p) => p.category)); if (VIDS.length) usedCats.add('Video');
    $$('.filter').forEach((b) => { if (b.dataset.filter !== 'all' && !usedCats.has(b.dataset.filter)) b.hidden = true; });
    $$('.filter').forEach((btn) => btn.addEventListener('click', () => {
      $$('.filter').forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
      const f = btn.dataset.filter;
      $$('.work-card').forEach((c) => { c.hidden = !(f === 'all' || c.dataset.cat === f); });
    }));
    return;
  }

  /* ------------------------------------------------------------------
     Hero entrance (after the intro hands off)
     ------------------------------------------------------------------ */
  if (isHome) {
  const heroLines = $$('.hero__title .line > span');
  const heroBits = $$('[data-hero]').filter((el) => !heroLines.includes(el));
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set(heroBits, { opacity: 0, y: 26 });
  gsap.set('[data-hero-visual]', { opacity: 0, scale: 0.86 });
  // Reset the page when the intro restarts.
  window.addEventListener('uc8:introstart', () => {
    lenis && lenis.stop();
    setTimeout(() => { lenis ? lenis.scrollTo(0, { immediate: true, force: true }) : window.scrollTo(0, 0);
      gsap.set(heroLines, { yPercent: 110 }); gsap.set(heroBits, { opacity: 0, y: 26 });
      gsap.set('[data-hero-visual]', { opacity: 0, scale: 0.86 }); }, 450);
    window.addEventListener('uc8:introdone', () => setTimeout(heroIn, 120), { once: true });
  });
  function heroIn() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('[data-hero-visual]', { opacity: 1, scale: 1, duration: 1.8 }, 0)
      .to(heroLines, { yPercent: 0, duration: 1.3, stagger: 0.09 }, 0.1)
      .to(heroBits, { opacity: 1, y: 0, duration: 1, stagger: 0.07 }, 0.35);
    lenis && lenis.start();
    ScrollTrigger.refresh();
  }
  if (window.UC8_INTRO_DONE) requestAnimationFrame(heroIn);
  else window.addEventListener('uc8:introdone', () => setTimeout(heroIn, 120), { once: true });

  // hero parallax out
  gsap.to('.hero__copy', { yPercent: -8, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__visual', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Open section links directly.
  if (location.hash.length > 1 && window.UC8_INTRO_DONE) {
    const target = location.hash, el = $(target);
    // Remove the hash after scrolling.
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    if (el) {
      // Check again after the page settles.
      let userMoved = false;   // never fight the visitor: stop correcting once they scroll themselves
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => window.addEventListener(ev, () => { userMoved = true; }, { once: true, passive: true }));
      const jump = () => {
        if (userMoved) return;
        const off = el.getBoundingClientRect().top - 70;
        if (Math.abs(off) < 8) return;
        if (lenis) lenis.scrollTo(el, { offset: -70, immediate: true, force: true });
        else window.scrollTo(0, window.scrollY + off);
      };
      const settle = () => { ScrollTrigger.refresh(); jump(); [250, 700, 1400, 2400].forEach((ms) => setTimeout(jump, ms)); };
      if (document.readyState === 'complete') settle(); else window.addEventListener('load', settle, { once: true });
    }
  }
  }

  /* ------------------------------------------------------------------
     WORK — light table → grid (signature moment)
     ------------------------------------------------------------------ */
  if (grid) {
  const stage = $('#workStage'), board = $('#workBoard'), table = $('.work__table', grid);
  const cards = () => $$('.work-card', grid).filter((c) => !c.hidden);

  const mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 900px)', mob: '(max-width: 899px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    const { desk, reduce: rm } = ctx.conditions;
    if (rm || ALL_WORK) { stage.classList.add('is-resolved'); if (!rm) gsap.from(cards(), { opacity: 0, y: 30, duration: 0.6, ease: 'power2.out', stagger: 0.04, clearProps: 'opacity,transform', scrollTrigger: { trigger: grid, start: 'top 90%', once: true } }); return; }

    grid.dataset.deal = '1';
    const land = (el) => el.classList.add('is-live');
    const tilt = [-4, 3, -2, 5, -3, 2]; // how each card sits in the pile
    const navH = () => (nav ? nav.offsetHeight : 0);
    const fits = desk && board.offsetHeight <= window.innerHeight - navH() + 4;
    gsap.set(table, { opacity: 0 });
    gsap.set('.work-card__pin', { opacity: 0 });

    if (fits) {
      // Desktop: every card starts in one neat pile in the middle of the table.
      // While the board is pinned, each scroll step deals the top card off the pile into its place.
      const list = cards(), n = list.length;
      const pile = (el) => {
        const i = list.indexOf(el), gw = grid.clientWidth, gh = grid.clientHeight;
        return { x: gw / 2 - (el.offsetLeft + el.offsetWidth / 2), y: gh / 2 - (el.offsetTop + el.offsetHeight / 2) - i * 6 };
      };
      list.forEach((el, i) => gsap.set(el, { zIndex: n - i }));
      const tl = gsap.timeline({ scrollTrigger: {
        trigger: board, start: () => `top ${navH() + 8}px`, end: () => `+=${Math.round(window.innerHeight * (0.45 + n * 0.42))}`,
        scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => stage.classList.toggle('is-resolved', self.progress > 0.92),
        onLeave: () => { stage.classList.add('is-resolved'); list.forEach(land); },
      } });
      tl.fromTo(grid, { rotateX: 22, scale: 0.9 }, { rotateX: 0, scale: 1, duration: 0.6, ease: 'power2.out' }, 0);
      list.forEach((el, i) => {
        tl.fromTo(el,
          { x: () => pile(el).x, y: () => pile(el).y, rotation: tilt[i % tilt.length], scale: 0.9 },
          { x: 0, y: 0, rotation: 0, scale: 1, duration: 1, ease: 'power3.inOut', immediateRender: true, onComplete: () => land(el) },
          0.35 + i * 0.85);
      });
      tl.to({}, { duration: 0.25 }); // short hold on the finished table
      return () => { stage.classList.remove('is-resolved'); delete grid.dataset.deal; gsap.set(list, { clearProps: 'zIndex' }); };
    }

    // Phones / small screens: the cards sit one under another, so each one is dealt
    // into place from a tilted pile as you scroll down to it.
    stage.classList.add('is-resolved');
    const list = cards();
    list.forEach((el, i) => {
      gsap.fromTo(el,
        { y: 70, rotation: tilt[i % tilt.length] * 0.8, scale: 0.92, opacity: 0.4 },
        { y: 0, rotation: 0, scale: 1, opacity: 1, ease: 'power2.out', immediateRender: true,
          scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 62%', scrub: 0.5, invalidateOnRefresh: true, onLeave: () => land(el) },
          onComplete: () => land(el) });
    });
    return () => { stage.classList.remove('is-resolved'); delete grid.dataset.deal; };
  });

  // Show filters for available project categories.
  const usedCats = new Set(PROJ.map((p) => p.category)); if (VIDS.length) usedCats.add('Video');
  $$('.filter').forEach((b) => { if (b.dataset.filter !== 'all' && !usedCats.has(b.dataset.filter)) b.hidden = true; });
  $$('.filter').forEach((btn) => btn.addEventListener('click', () => {
    $$('.filter').forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
    const f = btn.dataset.filter;
    const all = $$('.work-card', grid);
    const inners = all.map((c) => c.firstElementChild);
    gsap.to(inners, { opacity: 0, scale: 0.94, duration: 0.22, ease: 'power2.in', onComplete: () => {
      all.forEach((c) => { c.hidden = !(f === 'all' || c.dataset.cat === f); });
      ScrollTrigger.refresh();
      const show = all.filter((c) => !c.hidden).map((c) => c.firstElementChild);
      gsap.fromTo(show, { opacity: 0, scale: 0.94, y: 18 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05, clearProps: 'transform' });
    } });
  }));
  }

  /* ------------------------------------------------------------------
     PROCESS — cards revealed one at a time on scroll
     ------------------------------------------------------------------ */
  if ($('#pipeline')) {
  const steps = $$('[data-step]');
  const ptl = gsap.timeline({ scrollTrigger: { trigger: '#pipeline', start: 'top 78%', end: 'bottom 62%', scrub: 0.5 } });
  ptl.fromTo('#pipelineFill', { '--p': 0 }, { '--p': 1, ease: 'none', duration: steps.length }, 0);
  steps.forEach((s, i) => {
    ptl.fromTo(s, { opacity: 0, y: 60, rotateX: -12 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.8, ease: 'power2.out' }, i * 0.9);
  });
  }

  /* Create after the work section is pinned. */
  /* ------------------------------------------------------------------
     Generic reveals
     ------------------------------------------------------------------ */
  $$('[data-split]').forEach((el) => {
    gsap.from(el._words, { yPercent: 115, rotate: 4, duration: 1.1, ease: 'expo.out', stagger: 0.035,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });
  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 40, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  $$('[data-stagger]').forEach((el) => {
    gsap.from(el.children, { opacity: 0, y: 50, duration: 0.9, ease: 'power3.out', stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  // counters
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count, o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
  });

  /* ------------------------------------------------------------------
     Active section in the nav
     ------------------------------------------------------------------ */
  if (isHome) {
  const navLinks = $$('.nav__links a');
  function setActive(id) {
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
  }
  $$('[data-section]').forEach((s) => {
    ScrollTrigger.create({ trigger: s, start: 'top 45%', end: 'bottom 45%', onToggle: (self) => self.isActive && setActive(s.dataset.section) });
  });
  setActive('home');
  }

  // Refresh after fonts and images load.
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
