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
    lenis = new Lenis({ lerp: 0.095, smoothWheel: true, wheelMultiplier: 0.95 });
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
        <svg class="fx__chart" viewBox="0 0 300 90" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4c56a" stop-opacity=".45"/><stop offset="1" stop-color="#f4c56a" stop-opacity="0"/></linearGradient></defs>
          <path class="fx__area" d="M0 84 C40 82 60 80 90 74 S140 66 165 56 S215 34 240 24 S280 8 300 4 L300 90 L0 90Z" fill="url(#gfill)"/>
          <path class="fx__line" pathLength="1" d="M0 84 C40 82 60 80 90 74 S140 66 165 56 S215 34 240 24 S280 8 300 4" fill="none" stroke="#f4c56a" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
        </svg>
      </div>`;
    }
    return `<div class="art art--feat art--leads">
      <div class="fx">
        <div class="fx__metric display"><span><b data-countto="${m.to}">0</b>${m.unit}</span></div>
        <div class="fx__label mono"><svg class="ico"><use href="#i-team"/></svg>${m.label}</div>
      </div>
      <div class="fx__funnel" aria-hidden="true"><i style="--w:100%"></i><i style="--w:78%"></i><i style="--w:56%"></i><i style="--w:36%"></i></div>
      <div class="fx__pings" aria-hidden="true"><span>New lead</span><span>New lead</span><span>New lead</span></div>
    </div>`;
  }
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
  const grid = $('#workGrid');
  const caseCard = (p, i) => `
    <article class="work-card work-card--featured case" data-cat="${p.category}" data-i="${i}">
      <div class="work-card__inner case__inner">
        <div class="case__info">
          <span class="case__kicker mono"><i></i>Case study · ${p.category}</span>
          <h3 class="case__title display">${p.title}</h3>
          <p class="case__line">${(p.line || p.sub).replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>')}</p>
          ${p.tags ? `<ul class="case__tags">${p.tags.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
          ${p.instagram ? `<div class="case__actions">
            <a class="case__ig" href="${p.instagram.url}" target="_blank" rel="noopener" aria-label="${p.title} on Instagram (opens in a new tab)">
              <span class="case__ig-icon"><svg class="ico"><use href="#i-instagram"/></svg></span>
              <span class="case__ig-text"><small>See the page</small>${p.instagram.handle}</span>
              <svg class="ico case__ig-arrow"><use href="#i-arrow-ur"/></svg>
            </a>
          </div>` : ''}
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
          ${p.featured ? '<span class="case-tag mono">Case study</span>' : ''}
          <span class="work-card__pin" aria-hidden="true"></span>
        </div>
        <div class="work-card__meta">
          <div>
            <h3>${p.title}</h3>
            <span class="mono">${p.featured ? p.sub : `${p.category} · ${p.year}`}</span>
          </div>
          ${p.link
            ? `<a class="work-card__link" href="${p.link}" data-project="${i}" target="_blank" rel="noopener">${p.category === 'Websites' ? 'View project' : 'Explore'} <svg class="ico"><use href="#i-arrow"/></svg></a>`
            : `<button class="work-card__link" type="button" data-project="${i}">${p.featured ? 'Case study' : p.category === 'Websites' ? 'View project' : 'Explore'} <svg class="ico"><use href="#i-arrow"/></svg></button>`}
          ${p.instagram ? `<a class="work-card__ig" href="${p.instagram.url}" target="_blank" rel="noopener" aria-label="${p.title} on Instagram (opens in a new tab)"><svg class="ico"><use href="#i-instagram"/></svg>${p.instagram.handle}<svg class="ico"><use href="#i-arrow-ur"/></svg></a>` : ''}
        </div>
      </div>
    </article>`).join('');
  $$('.work-card__link[data-project]', grid).forEach((a) => {
    const p = PROJ[+a.dataset.project];
    if (p.link) return;
    a.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (p.featured) openModal(`Case study · ${p.category}`, p.title, p.story, p.results, p.instagram && { href: p.instagram.url, label: `See ${p.instagram.handle} on Instagram` });
      else openModal(`${p.category} · ${p.year}`, p.title, `${p.sub}. Placeholder project: replace it with real work in js/data.js.`, ['Challenge', 'Approach', 'Results']);
    });
  });

  /* Animate case-study results after the grid loads. */
  (function results() {
    const stageEl = $('#workStage');
    let done = false;
    const run = () => {
      if (done) return; done = true;
      $$('.work-card--featured', grid).forEach((c) => c.classList.add('is-counted'));
      $$('[data-countto]', grid).forEach((el) => {
        const to = +el.dataset.countto, from = +el.textContent || 0, t0 = performance.now(), dur = 1600;
        const step = (now) => {
          const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(from + (to - from) * e);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };
    new MutationObserver(() => { if (stageEl.classList.contains('is-resolved')) run(); }).observe(stageEl, { attributes: true, attributeFilter: ['class'] });
    if (stageEl.classList.contains('is-resolved')) run();
    if (typeof gsap === 'undefined') {
      new IntersectionObserver(([en], o) => { if (en.isIntersecting) { run(); o.disconnect(); } }, { threshold: 0.4 }).observe(grid);
    }
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
    if (extra) { ex.href = extra.href; $('span', ex).textContent = extra.label; ex.hidden = false; }
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
          window.location.href = `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent('Project brief — ' + (data.company || data.name))}&body=${encodeURIComponent(body)}`;
        }
        status.textContent = FORM_ENDPOINT
          ? `Thanks ${data.name.split(' ')[0]} — brief received. We'll be in touch soon.`
          : `Thanks ${data.name.split(' ')[0]} — your email app should open with the brief ready to send to ${STUDIO_EMAIL}.`;
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
     Without GSAP: show everything and stop here
     ------------------------------------------------------------------ */
  if (!hasGSAP) return;

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
  // Repeatable value for each card
  const rnd = (i, k) => { const s = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
  function scatter(el, spreadX, spreadY) {
    const i = +el.dataset.i, gw = grid.clientWidth, gh = grid.clientHeight;
    const cx = el.offsetLeft + el.offsetWidth / 2, cy = el.offsetTop + el.offsetHeight / 2;
    const tx = gw / 2 + (rnd(i, 1) - 0.5) * gw * spreadX, ty = gh / 2 + (rnd(i, 2) - 0.5) * gh * spreadY;
    return { x: tx - cx, y: ty - cy, r: (rnd(i, 3) - 0.5) * 38, z: 10 + rnd(i, 4) * 70 };
  }

  const mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 900px)', mob: '(max-width: 899px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    const { desk, reduce: rm } = ctx.conditions;
    if (rm) { stage.classList.add('is-resolved'); gsap.from(cards(), { opacity: 0, y: 30, stagger: 0.05, scrollTrigger: { trigger: grid, start: 'top 85%', once: true } }); return; }

    const fits = desk && stage.offsetHeight <= window.innerHeight + 4;
    const sx = desk ? 0.62 : 0.42, sy = desk ? 0.5 : 0.22;
    const st = fits
      ? { trigger: stage, start: 'top top', end: `+=${Math.min(170, 90 + PROJ.length * 8)}%`, scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
      : { trigger: board, start: 'top 92%', end: desk ? 'top 15%' : 'top 25%', scrub: 0.8, invalidateOnRefresh: true };
    st.onUpdate = (self) => stage.classList.toggle('is-resolved', self.progress > 0.9);
    st.onLeave = () => stage.classList.add('is-resolved');

    const tl = gsap.timeline({ scrollTrigger: st });
    tl.fromTo(grid, { rotateX: desk ? 54 : 40, rotateZ: desk ? -16 : -10, scale: desk ? 0.72 : 0.86, yPercent: desk ? 4 : 2 },
      { rotateX: 0, rotateZ: 0, scale: 1, yPercent: 0, duration: 1, ease: 'power2.inOut' }, 0);
    tl.fromTo('.work-card', {
      x: (i, el) => scatter(el, sx, sy).x,
      y: (i, el) => scatter(el, sx, sy).y,
      rotation: (i, el) => scatter(el, sx, sy).r,
      z: (i, el) => scatter(el, sx, sy).z,
    }, { x: 0, y: 0, rotation: 0, z: 0, duration: 0.9, ease: 'power3.inOut', stagger: { each: 0.018, from: 'end' } }, 0.06);
    tl.fromTo('.work-card__pin', { opacity: 1, scale: 1 }, { opacity: 0, scale: 0, duration: 0.2, stagger: 0.01 }, 0.12);
    tl.fromTo(table, { opacity: 1, scale: 1 }, { opacity: 0, scale: 1.06, duration: 0.55, ease: 'power2.in' }, 0.45);
    tl.fromTo('.work__head', { opacity: 0.25, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, 0.5);
    if (fits) tl.to({}, { duration: 0.3 }); // hold on the resolved grid
    return () => stage.classList.remove('is-resolved');
  });

  // Show filters for available project categories.
  const usedCats = new Set(PROJ.map((p) => p.category));
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
  const ptl = gsap.timeline({ scrollTrigger: { trigger: '#pipeline', start: 'top 78%', end: 'bottom 62%', scrub: 0.8 } });
  ptl.fromTo('#pipelineFill', { '--p': 0 }, { '--p': 1, ease: 'none', duration: steps.length }, 0);
  steps.forEach((s, i) => {
    ptl.fromTo(s, { opacity: 0, y: 70, rotateX: -14, filter: 'blur(6px)' }, { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' }, i * 0.9);
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
