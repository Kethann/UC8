/* ==========================================================================
   INTRO — "Lens to Logo" (≈6s). Plays on every load/refresh and when the
   nav UC8 logo is clicked. Skippable (click / Esc / Enter / Space).
   ========================================================================== */
(function () {
  const html = document.documentElement;
  const root = document.getElementById('intro');
  window.UC8_INTRO_DONE = false;

  function finish() {
    if (window.UC8_INTRO_DONE) return;
    window.UC8_INTRO_DONE = true;
    html.classList.remove('intro-active');
    window.dispatchEvent(new Event('uc8:introdone'));
  }

  if (!root) { window.UC8_INTRO_DONE = true; return; }
  const autoplay = html.classList.contains('intro-active');
  if (!autoplay) window.UC8_INTRO_DONE = true;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('introLens');
  const logoWrap = document.getElementById('introLogo');
  const svg = logoWrap.querySelector('svg');
  const segs = window.UC8Seg.build(svg, { label: true, glow: true });
  let running = false;
  const label = svg.querySelector('.seglogo__label');
  const scan = logoWrap.querySelector('.intro__scan');
  let lens = null; // built lazily (heavy) on first play

  /* ---------------- Sound design (WebAudio, opt-in) ---------------- */
  let actx = null, soundOn = false;
  const soundBtn = document.getElementById('introSound');
  function noiseBuf(dur) {
    const b = actx.createBuffer(1, actx.sampleRate * dur, actx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  const SFX = {
    click() {
      const t = actx.currentTime, s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
      s.buffer = noiseBuf(0.08); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 4;
      g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      s.connect(f).connect(g).connect(actx.destination); s.start(t);
    },
    whirr(dur) {
      const t = actx.currentTime, s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
      const o = actx.createOscillator(), og = actx.createGain();
      s.buffer = noiseBuf(dur); f.type = 'bandpass'; f.Q.value = 9;
      f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(2400, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.14, t + 0.08); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(90, t); o.frequency.linearRampToValueAtTime(160, t + dur);
      og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(0.025, t + 0.1); og.gain.linearRampToValueAtTime(0.0001, t + dur);
      s.connect(f).connect(g).connect(actx.destination); o.connect(og).connect(actx.destination);
      s.start(t); o.start(t); o.stop(t + dur);
    },
    whoosh() {
      const t = actx.currentTime, s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
      s.buffer = noiseBuf(0.7); f.type = 'lowpass';
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(6000, t + 0.25); f.frequency.exponentialRampToValueAtTime(400, t + 0.65);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.2); g.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      s.connect(f).connect(g).connect(actx.destination); s.start(t);
    },
    buzz(dur) {
      const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain(), lfo = actx.createOscillator(), lg = actx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 100;
      lfo.type = 'square'; lfo.frequency.value = 13; lg.gain.value = 0.02;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03, t + 0.05); g.gain.setValueAtTime(0.03, t + dur - 0.1); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      lfo.connect(lg).connect(g.gain); o.connect(g).connect(actx.destination);
      o.start(t); lfo.start(t); o.stop(t + dur); lfo.stop(t + dur);
    },
    tick() {
      const t = actx.currentTime;
      [1760, 2640].forEach((fr, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = fr;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(i ? 0.05 : 0.12, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.4);
      });
    },
  };
  function sfx(name, arg) { if (soundOn && actx) { try { SFX[name](arg); } catch (e) {} } }
  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundOn = !soundOn;
    if (soundOn && !actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) { soundOn = false; } }
    if (actx && actx.state === 'suspended') actx.resume();
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.querySelector('use').setAttribute('href', soundOn ? '#i-sound' : '#i-mute');
  });

  /* ---------------- Easing / timing helpers ---------------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const ioQuart = (p) => (p < 0.5 ? 8 * p ** 4 : 1 - (-2 * p + 2) ** 4 / 2);
  const ioCubic = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
  const oCubic = (p) => 1 - (1 - p) ** 3;
  const iCubic = (p) => p ** 3;
  // mechanical focus hunting: precise moves with hard settles
  const HUNT = [[0, 0], [0.35, 0.022], [0.75, -0.012], [1.05, 0.009], [1.35, 0.0]];
  function hunt(t) {
    for (let i = 0; i < HUNT.length - 1; i++) {
      const [t0, v0] = HUNT[i], [t1, v1] = HUNT[i + 1];
      if (t <= t1) return v0 + (v1 - v0) * ioQuart(seg(t, t0, t1));
    }
    return 0;
  }

  /* ---------------- Timeline ---------------- */
  const SCALE = reduce ? 0.55 : 1;   // compress for reduced motion
  const T_IRIS0 = 1.5, T_IRIS1 = 3.0, T_FLASH1 = 3.3, T_BLACK = 3.6;
  let fired = {};
  function once(key, t, at, fn) { if (!fired[key] && t >= at) { fired[key] = 1; fn(); } }

  let start = 0, raf = 0, lensDone = false, killed = false;

  function frame(now) {
    if (!start) start = now;
    const t = (now - start) / 1000 / SCALE;

    const irisP = ioQuart(seg(t, T_IRIS0, T_IRIS1));
    const push = ioCubic(seg(t, T_IRIS0, T_IRIS1)) * 0.14;
    const state = {
      zoom: 1 + hunt(t) + push,
      aperture: 1 - irisP * 0.995,
      twist: irisP * 0.62 + 0.15,
      rotBarrel: t * 0.006,
      rotMid: 0.045 * ioCubic(seg(t, 0.1, 1.3)) - 0.03 * irisP,
      rotInner: -0.06 * ioCubic(seg(t, 0.2, 1.5)) + 0.05 * irisP,
      sweep: -2.75 + 1.55 * ioCubic(seg(t, 0.15, 2.4)),
      sweepA: Math.sin(Math.PI * seg(t, 0.15, 2.6)) * 0.95,
      rim: iCubic(seg(t, 1.8, 2.9)),
      ca: seg(t, 2.0, 2.95) * (0.75 + 0.25 * Math.sin(t * 60)),
      light: iCubic(seg(t, 1.6, 3.0)),
      flash: 0, flashTint: 0, black: 0,
      ox: 0, oy: 0,
    };
    // fade in from black
    state.black = 1 - oCubic(seg(t, 0, 0.45));
    // bloom
    if (t > 2.92) {
      const up = oCubic(seg(t, 2.92, T_FLASH1));
      const down = ioCubic(seg(t, T_FLASH1, T_BLACK));
      state.flash = up * (1 - down);
      state.flashTint = seg(t, 2.95, 3.45);
      state.black = down;
    }
    lens.render(state);

    once('click', t, T_IRIS0, () => { sfx('click'); sfx('whirr', 1.35 * SCALE); });
    once('click2', t, T_IRIS1 - 0.05, () => sfx('click'));
    once('whoosh', t, 2.95, () => sfx('whoosh'));
    once('logo', t, T_FLASH1, playLogo);

    if (t < T_BLACK + 0.05 && !killed) raf = requestAnimationFrame(frame);
    else { lensDone = true; canvas.style.opacity = '0'; }
  }

  /* ---------------- Logo power-on (GSAP) ---------------- */
  let logoTl = null;
  function playLogo() {
    logoWrap.classList.add('is-on');
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    logoTl = tl;
    tl.timeScale(1 / SCALE);
    // "UniCre8" fades up first: letter by letter, rising and sharpening from a soft blur
    const chars = label.querySelectorAll('.seglogo__char');
    gsap.set(label, { opacity: 0.9 });
    gsap.set(chars, { attr: { 'fill-opacity': 0 } });
    tl.fromTo(label, { y: 14, filter: 'blur(6px)' }, { y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' }, 0.08);
    tl.to(chars, { attr: { 'fill-opacity': 1 }, duration: 0.42, ease: 'power2.out', stagger: 0.07 }, 0.1);
    tl.call(() => gsap.set(label, { clearProps: 'filter' }), null, 1.0); // hand back to the CSS glow
    /* ---- "starting trouble": the display struggles to power on, then snaps fully on ---- */
    const R = (min, max) => min + Math.random() * (max - min);
    const shuffled = segs.slice().sort(() => Math.random() - 0.5);
    const catchers = shuffled.slice(0, 6);          // these half-catch and hang dimly ("part on")
    const blippers = shuffled.slice(6);             // these only blip faintly
    const T0 = 0.78;                                 // label has faded in by now
    tl.call(() => sfx('buzz', 1.0 * SCALE), null, T0);
    catchers.forEach((sg, i) => {
      let t = T0 + i * R(0.04, 0.09);
      const n = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) {                 // sputter: short uneven flashes
        tl.to(sg, { opacity: R(0.3, 0.85), duration: R(0.015, 0.04) }, t);
        t += R(0.02, 0.05);
        tl.to(sg, { opacity: R(0, 0.12), duration: R(0.015, 0.03) }, t);
        t += R(0.03, 0.11);
      }
      tl.to(sg, { opacity: R(0.22, 0.38), duration: 0.05 }, t);          // hangs half-lit, humming
      tl.to(sg, { opacity: '-=0.12', duration: 0.04, yoyo: true, repeat: 3 }, t + 0.08);
    });
    blippers.forEach((sg) => {
      const t = T0 + R(0.1, 0.7);
      tl.to(sg, { opacity: R(0.08, 0.25), duration: 0.025 }, t).to(sg, { opacity: 0, duration: 0.05 }, t + 0.04);
    });
    // brown-out: everything pulses weakly twice, then drops out
    const BO = T0 + 0.82;
    [0, 0.13].forEach((d) => {
      tl.to(segs, { opacity: 0.42, duration: 0.035 }, BO + d).to(segs, { opacity: 0.05, duration: 0.06 }, BO + d + 0.045);
    });
    // SURGE: the whole mark snaps fully on together with a bloom overshoot
    const ON = BO + 0.36;
    tl.call(() => { segs.forEach((sg) => sg.classList.add('is-lit')); svg.classList.remove('is-surge'); void svg.getBBox(); svg.classList.add('is-surge'); sfx('tick'); }, null, ON);
    tl.to(segs, { opacity: 1, duration: 0.05 }, ON);
    const lastOne = shuffled[shuffled.length - 1];  // one stubborn segment settles a beat late
    tl.to(lastOne, { opacity: 0.35, duration: 0.03 }, ON + 0.16).to(lastOne, { opacity: 1, duration: 0.05 }, ON + 0.21);
    tl.fromTo(scan, { yPercent: -120, opacity: 0 }, { yPercent: 120, opacity: 1, duration: 0.55, ease: 'power1.inOut' }, ON + 0.02);
    tl.to(scan, { opacity: 0, duration: 0.12 }, ON + 0.5);
    // random fluctuation while it holds: a few segments glitch at random moments
    for (let k = 0; k < 3; k++) {
      const sg = segs[Math.floor(Math.random() * segs.length)], t = ON + R(0.35, 1.05);
      tl.to(sg, { opacity: R(0.15, 0.4), duration: 0.025 }, t).to(sg, { opacity: 1, duration: 0.04 }, t + R(0.04, 0.09));
    }
    tl.to(segs, { opacity: 0.82, duration: 0.03 }, ON + R(0.6, 0.9)).to(segs, { opacity: 1, duration: 0.05 }, '>');
    tl.to({}, { duration: 0.75 }); // hold on the finished lockup
    tl.call(flyToNav);
  }

  /* ---------------- Handoff: the logo glides into the nav while the black lifts ---------------- */
  let handed = false;
  function flyToNav() {
    const navLogo = document.querySelector('.nav__logo');
    const navG = navLogo && navLogo.querySelector('.seglogo__glyphs');
    const ig = svg.querySelector('.seglogo__glyphs');
    if (reduce || !navG || !navG.getBoundingClientRect().width) return handoff();
    handed = true;
    const sr = svg.getBoundingClientRect(), a = ig.getBoundingClientRect(), n = navG.getBoundingClientRect();
    const sc = n.width / a.width;
    const x = n.left - sr.left - (a.left - sr.left) * sc;
    const y = n.top - sr.top - (a.top - sr.top) * sc;
    html.classList.add('logo-landing');
    root.classList.add('is-flying');
    const ft = gsap.timeline({
      onComplete: () => {
        html.classList.remove('logo-landing');
        root.classList.remove('is-flying');
        gsap.set([svg, root], { clearProps: 'transform,opacity,backgroundColor' });
        cancelAnimationFrame(raf); running = false;
      },
    });
    logoTl = ft;
    ft.to(label, { opacity: 0, y: -12, duration: 0.35, ease: 'power2.in' }, 0)
      .to(svg, { x, y, scale: sc, transformOrigin: '0 0', duration: 1.05, ease: 'expo.inOut' }, 0.12)
      .to(root, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.85, ease: 'power2.inOut' }, 0.3)
      .call(finish, null, 0.5)                                  // the site starts its entrance mid-flight
      .call(() => html.classList.remove('logo-landing'), null, 1.12)
      .to(svg, { opacity: 0, duration: 0.18 }, 1.12);
  }
  function handoff() {
    if (handed && !root.classList.contains('is-flying')) return;
    handed = true;
    root.classList.remove('is-flying');
    html.classList.remove('logo-landing');
    root.classList.add('is-out');
    finish();
    setTimeout(() => { cancelAnimationFrame(raf); root.classList.remove('is-out'); gsap.set([svg, root], { clearProps: 'transform,opacity,backgroundColor' }); running = false; }, 900);
  }
  function skip() {
    if (handed && !root.classList.contains('is-flying')) return;
    killed = true;
    cancelAnimationFrame(raf);
    if (logoTl) logoTl.kill();
    handed = false;
    handoff();
  }
  root.addEventListener('click', skip);
  document.getElementById('introSkip').addEventListener('click', (e) => { e.stopPropagation(); skip(); });
  window.addEventListener('keydown', (e) => {
    if (running && !handed && ['Escape', 'Enter', ' '].includes(e.key)) { e.preventDefault(); skip(); }
  });

  // Start once fonts are ready (engraved text uses them), but never wait > 600ms
  let started = false;
  const go = () => {
    if (started) return; started = true;
    if (!lens) lens = new LensRenderer(canvas, { mode: 'intro', haze: [118, 104, 255] });
    else lens.resize();
    raf = requestAnimationFrame(frame);
  };
  function resetState() {
    cancelAnimationFrame(raf);
    if (logoTl) logoTl.kill();
    fired = {}; start = 0; killed = false; handed = false; lensDone = false; started = false;
    canvas.style.opacity = '1';
    logoWrap.classList.remove('is-on');
    segs.forEach((s) => s.classList.remove('is-lit'));
    gsap.set(segs, { opacity: 0 }); gsap.set(label, { opacity: 0, y: 0, clearProps: 'filter' });
    gsap.set(label.querySelectorAll('.seglogo__char'), { attr: { 'fill-opacity': 0 } });
    gsap.set(scan, { opacity: 0 }); gsap.set(svg, { opacity: 1, clearProps: 'transform' });
    gsap.set(root, { clearProps: 'backgroundColor' });
    svg.classList.remove('is-surge'); root.classList.remove('is-flying'); html.classList.remove('logo-landing');
  }
  /* Public: replay the intro (used by the nav UC8 logo) */
  function play() {
    if (running && !handed) return;
    resetState();
    running = true;
    window.UC8_INTRO_DONE = false;
    root.classList.remove('is-out');
    html.classList.add('intro-active');
    window.dispatchEvent(new Event('uc8:introstart'));
    requestAnimationFrame(go);
  }
  window.UC8Intro = { play };

  if (autoplay) {
    running = true;
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); setTimeout(go, 600); } else go();
  }
  window.addEventListener('resize', () => { if (lens && !lensDone) lens.resize(); });
})();
