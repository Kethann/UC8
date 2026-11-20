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
  let w = 0, h = 0, dpr = 1, mobile = false;

  // y: base height (0..1) · amp: curve amplitude · f: curve frequency · ph: phase
  // wid: bundle half-width (×h) · tf/tph: twist freq/phase · n: hairlines · tilt · sp: drift speed · a: brightness
  const RIBBONS = [
    { y: 0.20, amp: 0.13, f: 0.9, ph: 0.0, wid: 0.15, tf: 1.25, tph: 0.4, n: 54, tilt: 0.22, sp: 0.06, a: 0.30, sc: 1.0 },
    { y: 0.58, amp: 0.17, f: 0.7, ph: 2.1, wid: 0.19, tf: 0.95, tph: 2.0, n: 62, tilt: -0.3, sp: -0.045, a: 0.34, sc: -1.3 },
    { y: 0.90, amp: 0.12, f: 1.1, ph: 4.0, wid: 0.13, tf: 1.6, tph: 1.1, n: 46, tilt: 0.12, sp: 0.05, a: 0.24, sc: 0.8 },
    { y: 0.40, amp: 0.24, f: 0.55, ph: 1.3, wid: 0.08, tf: 2.1, tph: 3.0, n: 30, tilt: -0.45, sp: -0.035, a: 0.20, sc: 1.6, warm: true },
  ];
  const STEPS = 64;

  /* dust */
  let dust = [];
  function makeDust() {
    const n = mobile ? 34 : 70;
    dust = Array.from({ length: n }, () => ({
      x: Math.random(), y: Math.random(), z: 0.2 + Math.random() * 0.8,
      r: 0.4 + Math.random() * 1.3, tw: Math.random() * TAU, sp: 0.2 + Math.random() * 0.8,
    }));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth; h = window.innerHeight;
    mobile = w < 768;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.style.width = w + 'px'; c.style.height = h + 'px';
    makeDust();
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
      const al = r.a * (0.28 + 0.9 * fold * fold) * edge * (r.warm ? 0.55 : 1);
      g.addColorStop(u, `rgba(${base[0]},${base[1]},${base[2]},${al.toFixed(3)})`);
    }
    ctx.strokeStyle = g;
    const n = mobile ? Math.round(r.n * 0.6) : r.n;
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
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (!reduce) T += dt;
    smoothS += (scrollY - smoothS) * 0.075;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = mobile ? 0.6 : 0.7;
    for (const r of RIBBONS) drawRibbon(r, T, smoothS);

    // orange dust with parallax
    ctx.globalCompositeOperation = 'lighter';
    for (const p of dust) {
      p.tw += dt * p.sp;
      let y = (p.y * h - smoothS * p.z * 0.25 - T * 6 * p.z) % h; if (y < 0) y += h;
      const x = p.x * w + Math.sin(p.tw * 0.7) * 8 * p.z;
      const al = (0.12 + 0.35 * (0.5 + 0.5 * Math.sin(p.tw * 2))) * p.z;
      ctx.fillStyle = `rgba(255,122,26,${al.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, p.r * p.z, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
