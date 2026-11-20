/* ==========================================================================
   GLOBAL BACKGROUND — procedural version of the flowing line-ribbon texture.
   Each ribbon is a bundle of hairlines following a curve; the bundle width
   oscillates through zero so it twists and catches light like folded silk.
   Ribbons drift slowly with time and morph/flow with scroll position.
   Also draws a sparse orange dust layer. Grain is a CSS overlay (see main.js).
   ========================================================================== */
(function () {
  const c = document.getElementById('bg');
  if (!c) return;
  const ctx = c.getContext('2d');
  const TAU = Math.PI * 2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, dpr = 1, mobile = false, dirty = true;

  // y: base height (0..1) · amp: curve amplitude · f: curve frequency · ph: phase
  // wid: bundle half-width (×h) · tf/tph: twist freq/phase · n: hairlines · tilt · sp: drift speed · a: brightness
  const RIBBONS = [
    { y: 0.20, amp: 0.13, f: 0.9, ph: 0.0, wid: 0.15, tf: 1.25, tph: 0.4, n: 54, tilt: 0.22, sp: 0.06, a: 0.30, sc: 1.0 },
    { y: 0.58, amp: 0.17, f: 0.7, ph: 2.1, wid: 0.19, tf: 0.95, tph: 2.0, n: 62, tilt: -0.3, sp: -0.045, a: 0.34, sc: -1.3 },
    { y: 0.40, amp: 0.24, f: 0.55, ph: 1.3, wid: 0.08, tf: 2.1, tph: 3.0, n: 30, tilt: -0.45, sp: -0.035, a: 0.20, sc: 1.6, warm: true },
  ];
  const STEPS = 44;          // points per hairline (lower = cheaper, still smooth at this size)
  const FRAME_MS = 1000 / 30; // the drift is slow, so 30fps looks identical and halves the cost

  /* Dust particles */
  let dust = [];
  function makeDust() {
    const n = mobile ? 20 : 40;
    dust = Array.from({ length: n }, () => ({
      x: Math.random(), y: Math.random(), z: 0.2 + Math.random() * 0.8,
      r: 0.4 + Math.random() * 1.3, tw: Math.random() * TAU, sp: 0.2 + Math.random() * 0.8,
    }));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    w = window.innerWidth; h = window.innerHeight;
    mobile = w < 768;
    if (mobile) dpr = 1;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.style.width = w + 'px'; c.style.height = h + 'px';
    makeDust();
    dirty = true;
  }

  let scrollY = window.scrollY, smoothS = scrollY;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  const xs = new Float32Array(STEPS + 1), ys = new Float32Array(STEPS + 1), nx = new Float32Array(STEPS + 1), ny = new Float32Array(STEPS + 1), wv = new Float32Array(STEPS + 1);

  function drawRibbon(r, T, S) {
    const scrollPh = S * 0.0009 * r.sc;
    const twistPh = S * 0.0011 * r.sc;
    const yShift = Math.sin(S * 0.00045 + r.ph) * 0.06;
    const span = 1.36, u0 = -0.18;
    for (let i = 0; i <= STEPS; i++) {
      const u = u0 + (i / STEPS) * span;
      xs[i] = u * w;
      ys[i] = (r.y + yShift + r.amp * Math.sin(TAU * r.f * u * 0.5 + r.ph + T * r.sp + scrollPh) + r.tilt * (u - 0.5)) * h;
      wv[i] = r.wid * h * (0.32 + 0.68 * Math.cos(Math.PI * r.tf * u + r.tph + T * r.sp * 2.2 + twistPh));
    }
    for (let i = 0; i <= STEPS; i++) {
      const a = Math.max(0, i - 1), b = Math.min(STEPS, i + 1);
      const dx = xs[b] - xs[a], dy = ys[b] - ys[a], l = Math.hypot(dx, dy) || 1;
      nx[i] = -dy / l; ny[i] = dx / l;
    }
    // brightness along the ribbon: folds (where width → 0) catch the light
    const g = ctx.createLinearGradient(0, 0, w, 0);
    const base = r.warm ? [255, 138, 56] : [205, 205, 212];
    const wmax = r.wid * h;
    for (let k = 0; k <= 10; k++) {
      const u = k / 10, i = Math.round(((u - u0) / span) * STEPS);
      const fold = 1 - Math.min(1, Math.abs(wv[Math.max(0, Math.min(STEPS, i))]) / wmax);
      const edge = Math.min(1, u * 5, (1 - u) * 5) * 0.6 + 0.4;
      const al = 0.85 * r.a * (0.28 + 0.9 * fold * fold) * edge * (r.warm ? 0.55 : 1);
      g.addColorStop(u, `rgba(${base[0]},${base[1]},${base[2]},${al.toFixed(3)})`);
    }
    ctx.strokeStyle = g;
    const n = Math.round(r.n * (mobile ? 0.25 : 0.4));   // fewer hairlines per ribbon
    ctx.beginPath();
    for (let j = 0; j < n; j++) {
      const o = (j / (n - 1)) * 2 - 1;
      const oo = o * (1 + 0.12 * Math.sin(o * 3 + T * 0.2));
      for (let i = 0; i <= STEPS; i++) {
        const px = xs[i] + nx[i] * oo * wv[i], py = ys[i] + ny[i] * oo * wv[i];
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  let last = 0, T = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (last && now - last < FRAME_MS - 2) return;
    if (document.documentElement.classList.contains('intro-active')) { last = now; return; } // hidden under the intro
    last = now;
    // Waves move only while the page scrolls. When it is still, nothing is redrawn (zero cost).
    const diff = scrollY - smoothS;
    if (Math.abs(diff) < 0.3 && !dirty) return;
    smoothS = Math.abs(diff) < 0.3 ? scrollY : smoothS + diff * 0.14;
    const move = Math.min(1, Math.abs(diff) / 40);       // 0 = still, 1 = scrolling fast
    if (!reduce) T += move * 0.03;                       // drift is driven by scrolling, not by time
    dirty = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = mobile ? 0.6 : 0.7;
    for (const r of RIBBONS) drawRibbon(r, T, smoothS);

    // Moving dust
    ctx.globalCompositeOperation = 'lighter';
    for (const p of dust) {
      p.tw += move * 0.05 * p.sp;
      let y = (p.y * h - smoothS * p.z * 0.25) % h; if (y < 0) y += h;
      const x = p.x * w + Math.sin(p.tw * 0.7) * 8 * p.z;
      const al = (0.12 + 0.35 * (0.5 + 0.5 * Math.sin(p.tw * 2))) * p.z;
      ctx.fillStyle = `rgba(255,122,26,${al.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, p.r * p.z, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
