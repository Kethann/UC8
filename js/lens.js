/* ==========================================================================
   UC8 LensRenderer — procedural, photoreal-leaning camera lens in Canvas2D.
   Static parts (barrel, contact pins, glass elements) are pre-rendered once
   into offscreen layers (with depth-of-field blur baked in); the iris blades,
   light sweep, chromatic fringe, haze and bloom are drawn live each frame.
   Used by the intro (full-bleed, "inside the barrel") and the hero (framed).
   ========================================================================== */
(function () {
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const hasFilter = (() => { try { return 'filter' in document.createElement('canvas').getContext('2d'); } catch (e) { return false; } })();

  function mk(size) { const c = document.createElement('canvas'); c.width = c.height = Math.max(2, Math.round(size)); return c; }
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function ring(ctx, r0, r1) { ctx.beginPath(); ctx.arc(0, 0, r1, 0, TAU); ctx.arc(0, 0, r0, 0, TAU, true); }
  function circle(ctx, r) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); }

  /* Bake a blur into a layer (depth of field) */
  function blurred(src, px) {
    if (!hasFilter || px < 0.3) return src;
    const c = mk(src.width), x = c.getContext('2d');
    x.filter = `blur(${px}px)`;
    x.drawImage(src, 0, 0);
    return c;
  }
  function tinted(src, color, scale) {
    const s = scale || 0.5;
    const c = mk(src.width * s), x = c.getContext('2d');
    x.drawImage(src, 0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  /* metal bevel highlight around a circle */
  function bevel(ctx, r, u, strength, width) {
    const g = ctx.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, `rgba(255,255,255,${0.28 * strength})`);
    g.addColorStop(0.35, `rgba(255,255,255,${0.04 * strength})`);
    g.addColorStop(0.6, 'rgba(255,255,255,0)');
    g.addColorStop(0.85, `rgba(150,160,255,${0.07 * strength})`);
    g.addColorStop(1, `rgba(255,255,255,${0.14 * strength})`);
    ctx.strokeStyle = g;
    ctx.lineWidth = (width || 0.0032) * u;
    circle(ctx, r); ctx.stroke();
  }

  function textOnCircle(ctx, text, r, startAngle, size, color, spacing) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `500 ${size}px "JetBrains Mono", "Share Tech Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let a = startAngle;
    for (const ch of text) {
      const w = ctx.measureText(ch).width * (spacing || 1.25);
      a += (w / 2) / r;
      ctx.save(); ctx.rotate(a); ctx.translate(0, -r); ctx.fillText(ch, 0, 0); ctx.restore();
      a += (w / 2) / r;
    }
    ctx.restore();
  }

  class LensRenderer {
    constructor(canvas, opts) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = Object.assign({ mode: 'intro', accent: [255, 122, 26], haze: [120, 100, 255], seed: 8 }, opts || {});
      this.L = {};
      this.noise = this._noise();
      this.resize();
    }

    resize() {
      const c = this.c, r = c.getBoundingClientRect();
      this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
      this.dpr = Math.min(window.devicePixelRatio || 1, this.o.mode === 'hero' ? 2 : 1.75);
      c.width = Math.round(this.w * this.dpr); c.height = Math.round(this.h * this.dpr);
      this.R = this.o.mode === 'intro'
        ? Math.max(Math.min(this.w, this.h) / 2 * 1.55, Math.max(this.w, this.h) / 2 * 0.92)
        : Math.min(this.w, this.h) / 2 * 0.985;
      const pxPerR = Math.min(this.R * this.dpr * 1.12, this.o.mode === 'intro' ? 1150 : 900);
      if (Math.abs((this._ppr || 0) - pxPerR) > 4) { this._ppr = pxPerR; this._build(pxPerR); }
    }

    _noise() {
      const c = mk(160), x = c.getContext('2d'), d = x.createImageData(160, 160);
      for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      x.putImageData(d, 0, 0); return c;
    }

    /* ------------------------------------------------------------------ */
    _layer(extent, ppr, draw) {
      const size = 2 * extent * ppr, c = mk(size), x = c.getContext('2d');
      x.translate(c.width / 2, c.height / 2);
      draw(x, ppr);
      return { c, e: extent };
    }

    _build(u) {
      const rnd = rng(this.o.seed), intro = this.o.mode === 'intro', A = this.o.accent;
      const dof = (k) => (intro ? k : k * 0.45) * u / 600;

      /* ---------- BARREL (outer rings, knurling, engravings) ---------- */
      const barrel = this._layer(1.0, u, (x, u) => {
        ring(x, 0.6 * u, 1.0 * u);
        const g = x.createRadialGradient(0, 0, 0.6 * u, 0, 0, u);
        g.addColorStop(0, '#060609'); g.addColorStop(0.35, '#0c0c11'); g.addColorStop(0.7, '#131319'); g.addColorStop(1, '#1b1b22');
        x.fillStyle = g; x.fill();

        // stepped bands with grooves + bevels
        [0.605, 0.628, 0.66, 0.705, 0.748, 0.79, 0.845, 0.912, 0.958, 0.992].forEach((r, i) => {
          x.strokeStyle = 'rgba(0,0,0,.75)'; x.lineWidth = 0.007 * u; circle(x, r * u); x.stroke();
          bevel(x, (r + 0.0045) * u, u, i % 2 ? 0.7 : 1, 0.0028);
        });
        // band shading variance
        [[0.66, 0.705, 0.05], [0.79, 0.845, 0.035], [0.912, 0.958, 0.06]].forEach(([a, b, al]) => {
          ring(x, a * u, b * u);
          const lg = x.createLinearGradient(-u, -u, u, u);
          lg.addColorStop(0, `rgba(255,255,255,${al})`); lg.addColorStop(0.5, 'rgba(255,255,255,0)'); lg.addColorStop(1, `rgba(255,255,255,${al * 0.6})`);
          x.fillStyle = lg; x.fill();
        });
        // knurled focus grip
        const N = 420;
        for (let i = 0; i < N; i++) {
          const a = (i / N) * TAU;
          const lit = 0.5 + 0.5 * Math.cos(a + 2.4);
          x.strokeStyle = i % 2 ? `rgba(255,255,255,${0.03 + lit * 0.09})` : 'rgba(0,0,0,.55)';
          x.lineWidth = 0.0045 * u;
          x.beginPath(); x.moveTo(Math.cos(a) * 0.85 * u, Math.sin(a) * 0.85 * u); x.lineTo(Math.cos(a) * 0.905 * u, Math.sin(a) * 0.905 * u); x.stroke();
        }
        // engravings
        textOnCircle(x, 'UNICRE8 OPTICS  ·  CINE PRIME  35mm  1:1.4  ·  Ø77  ·  MULTI-COATED ASPHERICAL  ·  ', 0.935 * u, -1.15, 0.019 * u, 'rgba(225,225,235,.42)');
        textOnCircle(x, 'UC8  ·  No. 0008  ·  JAPAN  ·  ', 0.935 * u, 2.1, 0.019 * u, 'rgba(225,225,235,.32)');
        // distance scale
        const marks = ['∞', '10', '5', '3', '2', '1.5', '1.2', '1', '0.8', '0.6', '0.45m'];
        marks.forEach((m, i) => {
          const a = -2.6 + i * 0.13;
          x.save(); x.rotate(a + Math.PI / 2);
          x.fillStyle = 'rgba(230,230,240,.38)'; x.font = `500 ${0.016 * u}px "JetBrains Mono", monospace`; x.textAlign = 'center';
          x.fillText(m, 0, -0.77 * u);
          x.fillRect(-0.0012 * u, -0.755 * u, 0.0024 * u, 0.012 * u);
          x.restore();
        });
        // index dot (accent)
        x.fillStyle = `rgb(${A[0]},${A[1]},${A[2]})`; x.beginPath(); x.arc(0, -0.97 * u, 0.0085 * u, 0, TAU); x.fill();
        // micro scratches
        for (let i = 0; i < 70; i++) {
          const r = (0.62 + rnd() * 0.37) * u, a = rnd() * TAU, l = (0.01 + rnd() * 0.05);
          x.strokeStyle = `rgba(255,255,255,${0.015 + rnd() * 0.04})`; x.lineWidth = 0.0012 * u;
          x.beginPath(); x.arc(0, 0, r, a, a + l); x.stroke();
        }
        // inner wall dark falloff
        const ig = x.createRadialGradient(0, 0, 0.6 * u, 0, 0, 0.7 * u);
        ig.addColorStop(0, 'rgba(0,0,0,.8)'); ig.addColorStop(1, 'rgba(0,0,0,0)');
        ring(x, 0.6 * u, 0.7 * u); x.fillStyle = ig; x.fill();
      });
      barrel.c = blurred(barrel.c, dof(3.2));

      /* ---------- GOLD CONTACT PINS (mount electronics) ---------- */
      const pinGeom = [];
      const a0 = 112 * DEG, span = 60 * DEG, NP = 11;
      for (let i = 0; i < NP; i++) pinGeom.push(a0 + (i + 0.5) * span / NP);
      const drawPins = (x, u, rimOnly) => {
        if (!rimOnly) {
          // plate
          x.beginPath(); x.arc(0, 0, 0.728 * u, a0 - 0.03, a0 + span + 0.03); x.arc(0, 0, 0.662 * u, a0 + span + 0.03, a0 - 0.03, true); x.closePath();
          const pg = x.createRadialGradient(0, 0, 0.66 * u, 0, 0, 0.73 * u);
          pg.addColorStop(0, '#0b0b0e'); pg.addColorStop(0.5, '#16161b'); pg.addColorStop(1, '#0a0a0c');
          x.fillStyle = pg; x.fill();
          x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 0.002 * u; x.stroke();
          // screws
          [a0 - 0.12, a0 + span + 0.12, a0 + span * 0.5 + Math.PI].forEach((a) => {
            x.save(); x.rotate(a); x.translate(0, -0.695 * u);
            const sg = x.createRadialGradient(-0.004 * u, -0.004 * u, 0, 0, 0, 0.014 * u);
            sg.addColorStop(0, '#6a6a72'); sg.addColorStop(0.6, '#2a2a30'); sg.addColorStop(1, '#0c0c0e');
            x.fillStyle = sg; x.beginPath(); x.arc(0, 0, 0.014 * u, 0, TAU); x.fill();
            x.strokeStyle = 'rgba(0,0,0,.9)'; x.lineWidth = 0.003 * u; x.beginPath(); x.moveTo(-0.01 * u, 0); x.lineTo(0.01 * u, 0); x.stroke();
            x.restore();
          });
        }
        pinGeom.forEach((a) => {
          x.save(); x.rotate(a + Math.PI / 2); x.translate(0, -0.695 * u);
          const pw = 0.016 * u, ph = 0.04 * u;
          x.beginPath(); x.roundRect ? x.roundRect(-pw / 2, -ph / 2, pw, ph, pw * 0.45) : x.rect(-pw / 2, -ph / 2, pw, ph);
          if (rimOnly) {
            x.strokeStyle = 'rgba(255,236,190,1)'; x.lineWidth = 0.0028 * u; x.stroke();
          } else {
            const gg = x.createLinearGradient(-pw / 2, 0, pw / 2, 0);
            gg.addColorStop(0, '#3a2007'); gg.addColorStop(0.22, '#9c661a'); gg.addColorStop(0.48, '#ffe2a0');
            gg.addColorStop(0.62, '#d8a043'); gg.addColorStop(0.85, '#6a420f'); gg.addColorStop(1, '#2a1604');
            x.fillStyle = gg; x.fill();
            const sp = x.createLinearGradient(0, -ph / 2, 0, ph / 2);
            sp.addColorStop(0, 'rgba(255,250,230,.55)'); sp.addColorStop(0.3, 'rgba(255,250,230,0)'); sp.addColorStop(1, 'rgba(0,0,0,.35)');
            x.fillStyle = sp; x.fill();
          }
          x.restore();
        });
      };
      const pins = this._layer(0.8, u, (x, u) => drawPins(x, u, false));
      const pinsRim = this._layer(0.8, u, (x, u) => drawPins(x, u, true));
      pins.c = blurred(pins.c, dof(1.6));
      pinsRim.c = blurred(pinsRim.c, dof(0.9));
      const pinsR = { c: tinted(pins.c, 'rgb(255,40,60)'), e: 0.8 };
      const pinsB = { c: tinted(pins.c, 'rgb(40,150,255)'), e: 0.8 };

      /* ---------- MIDDLE GLASS ELEMENT (sharp) ---------- */
      const coat = (x, r, a1, a2, col, lw, blur) => {
        x.save();
        if (hasFilter && blur) x.filter = `blur(${blur}px)`;
        x.globalCompositeOperation = 'lighter';
        x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round';
        x.beginPath(); x.arc(0, 0, r, a1, a2); x.stroke();
        x.restore();
      };
      const softbox = (x, cx, cy, w, h, rot, alpha, blur) => {
        x.save(); if (hasFilter && blur) x.filter = `blur(${blur}px)`;
        x.globalCompositeOperation = 'lighter';
        x.translate(cx, cy); x.rotate(rot);
        x.fillStyle = `rgba(255,255,255,${alpha})`;
        x.beginPath(); x.roundRect ? x.roundRect(-w / 2, -h / 2, w, h, h * 0.4) : x.rect(-w / 2, -h / 2, w, h); x.fill();
        x.restore();
      };
      const mid = this._layer(0.62, u, (x, u) => {
        // retaining ring
        ring(x, 0.572 * u, 0.607 * u);
        const mg = x.createLinearGradient(-u * 0.6, -u * 0.6, u * 0.6, u * 0.6);
        mg.addColorStop(0, '#2c2c34'); mg.addColorStop(0.45, '#0e0e12'); mg.addColorStop(1, '#202028');
        x.fillStyle = mg; x.fill();
        for (let i = 0; i < 6; i++) { x.strokeStyle = `rgba(255,255,255,${0.025 + (i % 2) * 0.03})`; x.lineWidth = 0.0015 * u; circle(x, (0.578 + i * 0.0045) * u); x.stroke(); }
        bevel(x, 0.606 * u, u, 1.2, 0.0035);
        bevel(x, 0.573 * u, u, 0.9, 0.0025);
        // glass body
        circle(x, 0.572 * u);
        const gg = x.createRadialGradient(0, 0, 0, 0, 0, 0.572 * u);
        gg.addColorStop(0, 'rgba(30,26,70,0.0)'); gg.addColorStop(0.7, 'rgba(60,60,130,0.04)'); gg.addColorStop(0.94, 'rgba(120,120,210,0.09)'); gg.addColorStop(1, 'rgba(200,200,255,0.2)');
        x.fillStyle = gg; x.fill();
        // multi-coating reflections
        coat(x, 0.43 * u, -2.55, -1.72, 'rgba(70,255,170,.20)', 0.05 * u, 0.012 * u);
        coat(x, 0.33 * u, 0.45, 1.35, 'rgba(255,70,220,.14)', 0.04 * u, 0.012 * u);
        coat(x, 0.5 * u, 2.15, 2.95, 'rgba(140,110,255,.22)', 0.03 * u, 0.01 * u);
        coat(x, 0.25 * u, 3.5, 4.3, 'rgba(255,190,90,.10)', 0.03 * u, 0.01 * u);
        coat(x, 0.555 * u, -1.0, 0.2, 'rgba(255,255,255,.10)', 0.006 * u, 0.002 * u);
        // softbox glints
        softbox(x, -0.24 * u, -0.30 * u, 0.09 * u, 0.028 * u, -0.6, 0.30, 0.004 * u);
        softbox(x, -0.18 * u, -0.36 * u, 0.04 * u, 0.012 * u, -0.6, 0.20, 0.003 * u);
        softbox(x, 0.30 * u, 0.22 * u, 0.05 * u, 0.016 * u, 0.9, 0.12, 0.006 * u);
        // faint internal rings
        [0.49, 0.37, 0.3].forEach((r, i) => { x.strokeStyle = `rgba(200,200,255,${0.05 - i * 0.012})`; x.lineWidth = 0.002 * u; circle(x, r * u); x.stroke(); });
        // dust
        for (let i = 0; i < 46; i++) {
          const r = Math.sqrt(rnd()) * 0.55 * u, a = rnd() * TAU;
          x.fillStyle = `rgba(255,255,255,${0.05 + rnd() * 0.18})`;
          x.beginPath(); x.arc(Math.cos(a) * r, Math.sin(a) * r, (0.0008 + rnd() * 0.0022) * u, 0, TAU); x.fill();
        }
      });

      /* ---------- INNER ELEMENT + IRIS HOUSING ---------- */
      const inner = this._layer(0.47, u, (x, u) => {
        ring(x, 0.402 * u, 0.452 * u);
        const hg = x.createRadialGradient(0, 0, 0.4 * u, 0, 0, 0.452 * u);
        hg.addColorStop(0, '#050506'); hg.addColorStop(0.5, '#111116'); hg.addColorStop(1, '#08080a');
        x.fillStyle = hg; x.fill();
        for (let i = 0; i < 8; i++) { x.strokeStyle = `rgba(255,255,255,${0.02 + (i % 3) * 0.02})`; x.lineWidth = 0.0012 * u; circle(x, (0.408 + i * 0.0055) * u); x.stroke(); }
        bevel(x, 0.451 * u, u, 1, 0.003);
        bevel(x, 0.403 * u, u, 0.8, 0.002);
        circle(x, 0.402 * u);
        const gg = x.createRadialGradient(0, 0, 0, 0, 0, 0.402 * u);
        gg.addColorStop(0, 'rgba(40,30,90,0.0)'); gg.addColorStop(0.85, 'rgba(80,70,170,0.04)'); gg.addColorStop(1, 'rgba(170,160,255,0.14)');
        x.fillStyle = gg; x.fill();
        coat(x, 0.30 * u, 3.6, 4.25, 'rgba(255,165,70,.20)', 0.03 * u, 0.01 * u);
        coat(x, 0.22 * u, 0.35, 1.05, 'rgba(80,150,255,.22)', 0.025 * u, 0.008 * u);
        coat(x, 0.36 * u, 1.6, 2.2, 'rgba(120,255,200,.12)', 0.02 * u, 0.008 * u);
        softbox(x, -0.15 * u, -0.19 * u, 0.05 * u, 0.016 * u, -0.6, 0.22, 0.003 * u);
      });

      this.L = { barrel, pins, pinsRim, pinsR, pinsB, mid, inner };
    }

    /* ------------------------------------------------------------------ */
    _draw(L, rot, Z, alpha, dx, dy, comp) {
      const x = this.ctx;
      x.save();
      if (comp) x.globalCompositeOperation = comp;
      x.globalAlpha = alpha == null ? 1 : alpha;
      x.rotate(rot || 0);
      const s = L.e * Z;
      x.drawImage(L.c, -s + (dx || 0), -s + (dy || 0), s * 2, s * 2);
      x.restore();
    }

    _blades(Z, aperture, twist, light) {
      const x = this.ctx, N = 9, housing = 0.404 * Z;
      const a = Math.max(0.0005, 0.375 * Z * aperture);
      const s = a * Math.tan(Math.PI / N);
      const L = housing * 2.6;
      const blade = (i) => {
        const th = i * TAU / N + twist;
        const n = [Math.cos(th), Math.sin(th)], d = [-Math.sin(th), Math.cos(th)];
        const V = [n[0] * a - d[0] * s, n[1] * a - d[1] * s];
        const P1 = [V[0] + d[0] * L, V[1] + d[1] * L];
        const P2 = [P1[0] + n[0] * L, P1[1] + n[1] * L];
        const P3 = [V[0] + n[0] * L - d[0] * L * 0.15, V[1] + n[1] * L - d[1] * L * 0.15];
        x.beginPath(); x.moveTo(V[0], V[1]); x.lineTo(P1[0], P1[1]); x.lineTo(P2[0], P2[1]); x.lineTo(P3[0], P3[1]); x.closePath();
        const g = x.createLinearGradient(V[0], V[1], V[0] + n[0] * housing * 0.9 + d[0] * housing * 0.4, V[1] + n[1] * housing * 0.9 + d[1] * housing * 0.4);
        const sheen = 0.5 + 0.5 * Math.cos(th - 3.9);
        g.addColorStop(0, `rgb(${24 + sheen * 22 | 0},${24 + sheen * 21 | 0},${27 + sheen * 24 | 0})`);
        g.addColorStop(0.3, `rgb(${13 + sheen * 9 | 0},${13 + sheen * 9 | 0},${15 + sheen * 10 | 0})`);
        g.addColorStop(1, '#050506');
        x.fillStyle = g;
        x.shadowColor = 'rgba(0,0,0,.75)'; x.shadowBlur = Math.max(4, Z * 0.012);
        x.fill();
        x.shadowBlur = 0;
        // knife edge highlight
        const el = 2 * s + Z * 0.01;
        x.beginPath(); x.moveTo(V[0], V[1]); x.lineTo(V[0] + d[0] * el, V[1] + d[1] * el);
        x.strokeStyle = `rgba(${200 + light * 55},${200 + light * 40},${255},${0.10 + sheen * 0.12 + light * 0.3})`;
        x.lineWidth = Math.max(0.6, Z * 0.0016);
        x.stroke();
      };
      for (let i = 0; i < N; i++) blade(i);
      // re-draw first blade inside its sector to finish the circular overlap
      x.save();
      const th0 = twist;
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, housing * 1.2, th0 - Math.PI / N - 0.02, th0 + Math.PI / N * 0.6); x.closePath(); x.clip();
      blade(0);
      x.restore();
    }

    /**
     * s: { zoom, aperture(0..1), twist, rotBarrel, rotMid, rotInner, sweep(rad), sweepA,
     *      rim, ca, light(0..1 pinpoint), flash(0..1), flashTint(0 warm..1 cool), black(0..1), fade }
     */
    render(s) {
      const x = this.ctx, w = this.w, h = this.h, intro = this.o.mode === 'intro';
      const H = this.o.haze, A = this.o.accent;
      x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
      if (intro) { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); } else { x.clearRect(0, 0, w, h); }
      const Z = this.R * (s.zoom || 1);
      x.save();
      x.translate(w / 2 + (s.ox || 0), h / 2 + (s.oy || 0));
      if (!intro) { circle(x, this.R); x.clip(); x.fillStyle = '#000'; x.fill(); }

      /* interior behind the iris */
      const ir = 0.404 * Z;
      x.save(); circle(x, ir); x.clip();
      const ig = x.createRadialGradient(0, 0, 0, 0, 0, ir);
      ig.addColorStop(0, `rgba(${H[0] * 0.3 | 0},${H[1] * 0.28 | 0},${H[2] * 0.36 | 0},1)`);
      ig.addColorStop(0.3, `rgba(${H[0] * 0.07 | 0},${H[1] * 0.06 | 0},${H[2] * 0.12 | 0},1)`);
      ig.addColorStop(1, '#010102');
      x.fillStyle = ig; x.fillRect(-ir, -ir, ir * 2, ir * 2);
      [0.07, 0.13, 0.21, 0.29].forEach((r, i) => { x.strokeStyle = `rgba(${H[0]},${H[1]},${H[2]},${0.10 - i * 0.02})`; x.lineWidth = 1; circle(x, r * Z); x.stroke(); });
      // pinpoint light on axis
      const li = s.light || 0;
      if (li > 0) {
        x.globalCompositeOperation = 'lighter';
        const lr = ir * (0.25 + li * 0.35);
        const lg = x.createRadialGradient(0, 0, 0, 0, 0, lr);
        lg.addColorStop(0, `rgba(255,255,255,${Math.min(1, 0.4 + li)})`);
        lg.addColorStop(0.12, `rgba(255,240,225,${0.6 * li})`);
        lg.addColorStop(0.4, `rgba(${H[0]},${H[1]},${H[2]},${0.25 * li})`);
        lg.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = lg; x.fillRect(-lr, -lr, lr * 2, lr * 2);
        x.globalCompositeOperation = 'source-over';
      }
      this._blades(Z, s.aperture, s.twist || 0, li);
      x.restore();

      /* glass + metal, back to front */
      this._draw(this.L.inner, s.rotInner, Z);
      this._draw(this.L.barrel, s.rotBarrel, Z);
      this._draw(this.L.pins, s.rotBarrel, Z);
      if (s.rim > 0) this._draw(this.L.pinsRim, s.rotBarrel, Z, s.rim * 0.85, 0, 0, 'lighter');
      if (s.ca > 0) {
        const off = Z * 0.007 * s.ca;
        this._draw(this.L.pinsR, s.rotBarrel, Z, 0.55 * s.ca, -off, 0, 'lighter');
        this._draw(this.L.pinsB, s.rotBarrel, Z, 0.55 * s.ca, off, off * 0.3, 'lighter');
      }
      this._draw(this.L.mid, s.rotMid, Z);

      /* moving specular arc across the middle element */
      if (s.sweepA > 0) {
        x.save(); x.globalCompositeOperation = 'lighter';
        const ph = s.sweep, r = 0.5 * Z;
        const warm = intro ? [255, 196, 140] : A;
        x.lineCap = 'round';
        x.shadowColor = `rgba(${warm[0]},${warm[1]},${warm[2]},.9)`; x.shadowBlur = Z * 0.03;
        for (let k = 0; k < 3; k++) {
          x.strokeStyle = `rgba(${warm[0]},${warm[1]},${warm[2]},${s.sweepA * (0.5 - k * 0.14)})`;
          x.lineWidth = Z * (0.006 + k * 0.01);
          x.beginPath(); x.arc(0, 0, r - k * Z * 0.01, ph - 0.22, ph + 0.22); x.stroke();
        }
        x.restore();
      }

      /* haze sitting on the glass */
      x.save(); x.globalCompositeOperation = 'screen';
      const hz = x.createRadialGradient(0, 0, 0, 0, 0, 0.62 * Z);
      hz.addColorStop(0, `rgba(${H[0]},${H[1]},${H[2]},${intro ? 0.07 : 0.06})`);
      hz.addColorStop(0.7, `rgba(${H[0]},${H[1]},${H[2]},${intro ? 0.035 : 0.025})`);
      hz.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = hz; circle(x, 0.62 * Z); x.fill();
      x.restore();

      x.restore(); // center transform

      /* anamorphic streak (intro) */
      if (s.sweepA > 0 && intro) {
        const sy = h / 2 + Math.sin(s.sweep) * 0.5 * Z * 0.9;
        const sx = w / 2 + Math.cos(s.sweep) * 0.5 * Z;
        x.save(); x.globalCompositeOperation = 'lighter';
        x.translate(sx, sy); x.scale(1, 0.018);
        const sg = x.createRadialGradient(0, 0, 0, 0, 0, w * 0.75);
        sg.addColorStop(0, `rgba(255,214,170,${0.55 * s.sweepA})`);
        sg.addColorStop(0.2, `rgba(150,140,255,${0.18 * s.sweepA})`);
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = sg; x.fillRect(-w, -w * 0.75, w * 2, w * 1.5);
        x.restore();
      }

      /* chromatic fringe at frame edge */
      if (s.ca > 0 && intro) {
        x.save(); x.globalCompositeOperation = 'lighter';
        const off = 10 * s.ca, rr = Math.hypot(w, h) / 2;
        [[`rgba(255,30,60,${0.16 * s.ca})`, -off], [`rgba(30,150,255,${0.16 * s.ca})`, off]].forEach(([col, o]) => {
          const g = x.createRadialGradient(w / 2 + o, h / 2, rr * 0.72, w / 2 + o, h / 2, rr);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.6, col); g.addColorStop(1, 'rgba(0,0,0,0)');
          x.fillStyle = g; x.fillRect(0, 0, w, h);
        });
        x.restore();
      }

      /* vignette + grain */
      if (intro) {
        const vg = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.55);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.75)');
        x.fillStyle = vg; x.fillRect(0, 0, w, h);
        x.save(); x.globalAlpha = 0.07; x.globalCompositeOperation = 'overlay';
        const p = x.createPattern(this.noise, 'repeat');
        x.translate(Math.random() * 160, Math.random() * 160);
        x.fillStyle = p; x.fillRect(-160, -160, w + 320, h + 320);
        x.restore();
      }

      /* bloom flash: warm → cool, then to black */
      if (s.flash > 0) {
        const t = s.flashTint || 0;
        const r = 255, gch = Math.round(238 + t * 4), b = Math.round(215 + t * 40);
        const fr = Math.hypot(w, h) * (0.15 + s.flash * 0.9);
        const fg = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, fr);
        fg.addColorStop(0, `rgba(255,255,255,${Math.min(1, s.flash * 1.4)})`);
        fg.addColorStop(0.35, `rgba(${r},${gch},${b},${s.flash})`);
        fg.addColorStop(1, `rgba(${r},${gch},${b},${s.flash * 0.6})`);
        x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = fg; x.fillRect(0, 0, w, h); x.restore();
      }
      if (s.black > 0) { x.fillStyle = `rgba(0,0,0,${s.black})`; x.fillRect(0, 0, w, h); }
    }
  }

  window.LensRenderer = LensRenderer;
})();
