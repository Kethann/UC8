/* ==========================================================================
   UC8 — hero "live studio" animation (circular glass hub)
   A deep glass hub sits where the camera used to be. Inside it, each stage of
   the work plays live: SHOOT (camera clicks + flash) → POST (Instagram posts)
   → ENGAGE (heart turns red) → GROW (trend line climbs) → EDIT (timeline
   plays) → DESIGN (pen draws). Glass icons orbit it in 3D, circuit traces run
   out of it, and real-looking notifications pop up where the pulses land.
   ========================================================================== */
(function () {
  const canvas = document.getElementById('heroCircuit');
  const hubEl = document.getElementById('heroHub');
  if (!canvas || !hubEl) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;
  const copy = hero.querySelector('.hero__copy');
  const visual = hero.querySelector('[data-hero-visual]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ORANGE = [255, 122, 26], WHITE = [244, 241, 236];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const easeIO = (p) => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  const lerp = (a, b, p) => a + (b - a) * p;
  const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

  /* ---------- small drawing helpers ---------- */
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  const P = (d) => new Path2D(d);
  const ICON = {
    heart: P('M12 20.5s-8-4.9-8-10.8A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.7c0 5.9-8 10.8-8 10.8z'),
    comment: P('M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.5z'),
    share: P('M21 3 10 14M21 3l-7 18-4-7-7-4z'),
    save: P('M6 3.5h12v17l-6-4.5-6 4.5z'),
    play: P('M8 5.5v13l10.5-6.5z'),
    user: P('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8.5c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5'),
    trend: P('M3 17 9 11l4 4 8-8M15 7h6v6'),
    bolt: P('M13 2 4 14h7l-1 8 9-12h-7z'),
    cursor: P('M5 3l13.5 6.2-5.6 1.9-1.9 5.6z'),
  };
  function icon(name, x, y, size, { stroke, fill, lw = 1.8 } = {}) {
    const s = size / 24;
    ctx.save(); ctx.translate(x - size / 2, y - size / 2); ctx.scale(s, s);
    ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (fill) { ctx.fillStyle = fill; ctx.fill(ICON[name]); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(ICON[name]); }
    ctx.restore();
  }
  function text(str, x, y, size, color, weight = 500, align = 'left', family = FONT) {
    ctx.font = `${weight} ${size}px ${family}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
  }
  function igGrad(x, y, w, h) {
    const g = ctx.createLinearGradient(x, y + h, x + w, y);
    g.addColorStop(0, '#feda75'); g.addColorStop(0.3, '#fa7e1e'); g.addColorStop(0.6, '#d62976'); g.addColorStop(0.85, '#962fbf'); g.addColorStop(1, '#4f5bd5');
    return g;
  }
  function avatar(x, y, r, letter, hue, ring) {
    if (ring) { ctx.beginPath(); ctx.arc(x, y, r + 2.2, 0, Math.PI * 2); ctx.fillStyle = igGrad(x - r, y - r, r * 2, r * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r + 0.8, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill(); }
    const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, `hsl(${hue},70%,62%)`); g.addColorStop(1, `hsl(${hue + 40},65%,38%)`);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    text(letter, x, y + 0.5, r * 1.05, '#fff', 700, 'center');
  }

  /* ---------- layout ---------- */
  let W = 0, H = 0, dpr = 1, quality = 0, ph = { x: 0, y: 0, w: 0, h: 0 }, traces = [], avoid = [];
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  function measure() {
    const hr = hero.getBoundingClientRect(), vr = hubEl.getBoundingClientRect();
    const size = Math.min(vr.width, vr.height);
    ph.w = ph.h = size; ph.r = size * 0.31;
    ph.x = vr.left - hr.left + vr.width / 2; ph.y = vr.top - hr.top + vr.height / 2;
    avoid = [];
    if (copy) { const c = copy.getBoundingClientRect(); avoid.push({ l: c.left - hr.left - 12, t: c.top - hr.top - 12, r: c.right - hr.left + 12, b: c.bottom - hr.top + 12 }); }
    const orx = ph.r * 1.9 + ph.r * 0.55;
    avoid.push({ l: ph.x - orx, t: ph.y - ph.r * 1.9, r: ph.x + orx, b: ph.y + ph.r * 1.9 });
  }

  function buildTraces() {
    seed = 11; traces = [];
    const N = W < 700 ? 30 : 50, reach = Math.max(W, H) * (W < 700 ? 0.5 : 0.48);
    const dirs = [...Array(8)].map((_, i) => [Math.cos(i * Math.PI / 4), Math.sin(i * Math.PI / 4)]);
    const r0 = ph.r * 1.42;
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2 + (rnd() - 0.5) * 0.1;
      const ca = Math.cos(a), sa = Math.sin(a);
      let x = ca * r0, y = sa * r0; // relative to the hub centre
      const pts = [[x, y]];
      const base = Math.round(((a + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
      let di = base;
      const total = 40 + rnd() * reach * (0.3 + 0.7 * rnd());
      let left = total, seg = 0;
      while (left > 4 && seg < 4) {
        const len = seg === 0 ? Math.min(left, 12 + rnd() * 34) : Math.min(left, 22 + rnd() * total * 0.45);
        x += dirs[di][0] * len; y += dirs[di][1] * len; pts.push([x, y]); left -= len; seg++;
        di = seg % 2 ? (base + (rnd() < 0.5 ? 1 : 7)) % 8 : base;
      }
      const lens = []; let L = 0;
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(d); L += d; }
      traces.push({ pts, lens, L, hot: rnd() < 0.36, node: 1.6 + rnd() * 2.2, flash: 0, ring: rnd() < 0.3 });
    }
  }
  const abs = (p) => [ph.x + p[0], ph.y + p[1]];
  function pointAt(t, s) {
    if (s <= 0) return abs(t.pts[0]);
    for (let i = 0; i < t.lens.length; i++) {
      if (s <= t.lens[i]) { const f = s / t.lens[i], a = t.pts[i], b = t.pts[i + 1]; return abs([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }
      s -= t.lens[i];
    }
    return abs(t.pts[t.pts.length - 1]);
  }

  function resize() {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(quality ? 1 : 1.5, window.devicePixelRatio || 1); // decorative canvas: 1.5x is sharp enough; 1x on slow devices
    W = Math.round(r.width); H = Math.round(r.height);
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    measure(); buildTraces();
  }

  function bez(p0, p1, p2, p3, t) { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; }

  /* ==========================================================================
     3D ORBIT — clear glass spheres circling the phone, each icon animated live
     ========================================================================== */
  const ORBIT = ['camera', 'insta', 'heart', 'trend', 'edit', 'pen', 'fb'];
  const orbitGeom = () => {
    const R = Math.max(16, ph.r * 0.25);
    const rx = Math.min(ph.r * 1.9, Math.min(ph.x, W - ph.x) - R * 1.25 - 6);
    return { rx, ry: Math.min(ph.r * 1.22, rx * 0.66), tilt: -0.3, R };
  };

  // glass sphere: transparent body, refracted rim, caustic, double specular
  function glassBody(x, y, R, tint) {
    // soft contact shadow on the "floor" below
    ctx.save(); ctx.globalAlpha *= 0.5;
    const sg = ctx.createRadialGradient(x, y + R * 1.35, 0, x, y + R * 1.35, R * 1.2);
    sg.addColorStop(0, 'rgba(0,0,0,0.75)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(x, y + R * 1.35, R * 1.2, R * 0.32, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // see-through body (mostly transparent, darker toward the edge = thickness)
    const bg = ctx.createRadialGradient(x - R * 0.2, y - R * 0.25, R * 0.05, x, y, R);
    bg.addColorStop(0, `rgba(${tint},0.10)`); bg.addColorStop(0.6, 'rgba(255,255,255,0.05)'); bg.addColorStop(0.88, 'rgba(10,10,14,0.35)'); bg.addColorStop(1, 'rgba(255,255,255,0.18)');
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill();
    // caustic: light focused through the glass onto the lower inside
    const cg = ctx.createRadialGradient(x + R * 0.1, y + R * 0.62, 0, x + R * 0.1, y + R * 0.62, R * 0.6);
    cg.addColorStop(0, `rgba(${tint},0.45)`); cg.addColorStop(1, `rgba(${tint},0)`);
    ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(x + R * 0.1, y + R * 0.62, R * 0.6, R * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  }
  function glassFront(x, y, R) {
    // fresnel rim: bright on top, thin dark at the bottom
    const rg = ctx.createLinearGradient(x, y - R, x, y + R);
    rg.addColorStop(0, 'rgba(255,255,255,0.85)'); rg.addColorStop(0.45, 'rgba(255,255,255,0.18)'); rg.addColorStop(0.75, 'rgba(255,255,255,0.08)'); rg.addColorStop(1, 'rgba(255,180,120,0.55)');
    ctx.beginPath(); ctx.arc(x, y, R - 0.6, 0, Math.PI * 2); ctx.strokeStyle = rg; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R + 0.6, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
    // broad top reflection (window light)
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R - 1, 0, Math.PI * 2); ctx.clip();
    const hg = ctx.createLinearGradient(x, y - R, x, y - R * 0.05);
    hg.addColorStop(0, 'rgba(255,255,255,0.42)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(x - R * 0.08, y - R * 0.5, R * 0.78, R * 0.42, -0.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // sharp specular glint
    ctx.beginPath(); ctx.ellipse(x - R * 0.42, y - R * 0.5, R * 0.13, R * 0.07, -0.7, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x + R * 0.48, y + R * 0.45, R * 0.05, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
  }

  function drawGlyph(kind, x, y, R, t, i, prog) {
    const u = t + i * 0.55;
    const K = (per) => (prog != null ? prog : (u % per) / per); let glow = 0, gc = '255,122,26';
    ctx.save(); ctx.translate(x, y); const sc = R / 13; ctx.scale(sc, sc);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 1.8; ctx.strokeStyle = '#fbf8f3';
    if (kind === 'camera') {
      const k = K(3);
      rr(-8, -4.5, 16, 11, 2.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3.5, -4.5); ctx.lineTo(-2, -7); ctx.lineTo(2, -7); ctx.lineTo(3.5, -4.5); ctx.stroke();
      const iris = k > 0.66 && k < 0.8 ? 3.4 * (1 - Math.sin(((k - 0.66) / 0.14) * Math.PI) * 0.75) : 3.4;
      ctx.beginPath(); ctx.arc(0, 1, iris, 0, Math.PI * 2); ctx.stroke();
      if (Math.floor(u * 2) % 2) { ctx.beginPath(); ctx.arc(5.6, -2.2, 0.9, 0, Math.PI * 2); ctx.fillStyle = '#ff3b30'; ctx.fill(); }
      if (k > 0.74) { const f = (k - 0.74) / 0.26; glow = 1 - f; gc = '255,255,255';
        ctx.shadowColor = 'transparent';
        const fg = ctx.createRadialGradient(0, 1, 0, 0, 1, 6 + f * 16); fg.addColorStop(0, `rgba(255,255,255,${0.95 * (1 - f)})`); fg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0, 1, 6 + f * 16, 0, Math.PI * 2); ctx.fill(); }
    } else if (kind === 'insta') {
      const k = K(3.2);
      ctx.strokeStyle = igGrad(-8, -8, 16, 16); ctx.lineWidth = 2.1;
      rr(-7.5, -7.5, 15, 15, 4.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 3.6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(4.6, -4.6, 1, 0, Math.PI * 2); ctx.fillStyle = '#fa7e1e'; ctx.fill();
      if (k > 0.45) { const f = (k - 0.45) / 0.55; glow = Math.sin(f * Math.PI) * 0.8; gc = '214,41,118';
        ctx.save(); ctx.globalAlpha *= Math.sin(f * Math.PI); ctx.translate(7, -9 - f * 16); ctx.rotate(0.15);
        rr(-4.5, -4.5, 9, 9, 1.8); ctx.fillStyle = igGrad(-4.5, -4.5, 9, 9); ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.fillStyle = '#fff'; ctx.font = `700 4.8px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+1', 0, 0.3); ctx.restore(); }
    } else if (kind === 'heart') {
      const k = K(2.6), filled = k > 0.25 && k < 0.94;
      let s2 = 1;
      if (filled) { const b = (k - 0.25) * 2.6; s2 = 1 + Math.max(0, 0.3 - b * 1.2) + 0.12 * Math.max(0, Math.sin(b * 9)) * Math.exp(-b * 1.2); glow = 0.8; gc = '255,48,64'; }
      ctx.save(); ctx.scale(s2 * 0.62, s2 * 0.62); ctx.translate(-12, -13);
      if (filled) { const hg = ctx.createLinearGradient(0, 6, 0, 21); hg.addColorStop(0, '#ff5a6a'); hg.addColorStop(1, '#d9132a'); ctx.fillStyle = hg; ctx.fill(ICON.heart);
        ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(8, 10, 2.2, 1.3, -0.6, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.lineWidth = 2.6; ctx.stroke(ICON.heart); }
      ctx.restore();
      if (k > 0.25 && k < 0.6) { const f = (k - 0.25) / 0.35;
        for (let j = 0; j < 5; j++) { const a = -Math.PI / 2 + (j - 2) * 0.5; ctx.save(); ctx.globalAlpha *= 1 - f;
          ctx.translate(Math.cos(a) * (8 + f * 10), Math.sin(a) * (8 + f * 10)); ctx.scale(0.18, 0.18); ctx.translate(-12, -13); ctx.fillStyle = '#ff3040'; ctx.fill(ICON.heart); ctx.restore(); } }
    } else if (kind === 'trend') {
      const k = K(2.8), pts = [[-8, 5], [-3.5, 0.5], [0, 3], [7.5, -5]];
      const d = ease(k / 0.55) * 3;
      for (let j = 0; j < 3; j++) { const bh = [3, 5.5, 8][j] * ease((k - 0.1 * j) / 0.4); ctx.fillStyle = 'rgba(255,176,102,0.3)'; ctx.fillRect(-6 + j * 5, 7 - bh, 3, bh); }
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-9, 8); ctx.lineTo(9, 8); ctx.stroke();
      ctx.strokeStyle = '#ffb066'; ctx.lineWidth = 2.1; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); let hx = pts[0];
      for (let j = 1; j <= 3; j++) { const f = clamp(d - (j - 1)); if (f <= 0) break; hx = [lerp(pts[j - 1][0], pts[j][0], f), lerp(pts[j - 1][1], pts[j][1], f)]; ctx.lineTo(hx[0], hx[1]); }
      ctx.stroke();
      if (d >= 2.95) { glow = 0.7; ctx.beginPath(); ctx.moveTo(3.5, -5); ctx.lineTo(7.5, -5); ctx.lineTo(7.5, -1); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(hx[0], hx[1], 1.6, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); }
    } else if (kind === 'edit') {
      // video editor: preview monitor + two-track timeline, playhead sweeps, a clip gets cut
      const k = K(3);
      rr(-9, -10, 18, 11, 2); ctx.stroke();
      ctx.shadowColor = 'transparent';
      const fr = ctx.createLinearGradient(-8, -9, 8, 0); fr.addColorStop(0, 'rgba(255,122,26,0.35)'); fr.addColorStop(1, 'rgba(154,164,255,0.25)');
      ctx.fillStyle = fr; ctx.fillRect(-8.2, -9.2, 16.4, 9.4);
      ctx.beginPath(); ctx.moveTo(-1.6, -7.2); ctx.lineTo(-1.6, -2.2); ctx.lineTo(2.6, -4.7); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
      // tracks
      const clip = (x0, w, y0, c) => { rr(x0, y0, w, 2.6, 0.9); ctx.fillStyle = c; ctx.fill(); };
      const cut = k > 0.55;
      clip(-9, 7, 3.6, '#ff7a1a'); clip(-1.6, cut ? 4.4 : 10.6, 3.6, '#ffb066'); if (cut) clip(3.4, 5.6, 3.6, '#ffb066');
      clip(-9, 11, 7.6, '#9aa4ff'); clip(2.6, 6.4, 7.6, '#34c759');
      if (k > 0.5 && k < 0.7) { ctx.strokeStyle = `rgba(255,255,255,${1 - Math.abs(k - 0.6) * 10})`; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(3, 2.6); ctx.lineTo(3, 7); ctx.stroke(); }
      const px = -9 + ease(k) * 18;
      ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(px, 2.2); ctx.lineTo(px, 10.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px - 1.5, 1.2); ctx.lineTo(px + 1.5, 1.2); ctx.lineTo(px, 3); ctx.closePath(); ctx.fillStyle = '#ff3b30'; ctx.fill();
      glow = 0.3;
    } else if (kind === 'pen') {
      // vector pen tool: places anchors, drags handles, closes the path, shape fills
      const k = K(3);
      const A = [-7.5, 5], B = [0, -7], C = [7.5, 5];
      const seg1 = [A, [-8, -3], [-4, -7.5], B], seg2 = [B, [4, -7.5], [8, -3], C], seg3 = [C, [3, 9], [-3, 9], A];
      const segs = [seg1, seg2, seg3];
      const d = ease(clamp(k / 0.62)) * 3;               // how much of the outline is drawn
      const fillA = ease(clamp((k - 0.62) / 0.2));
      ctx.shadowColor = 'transparent';
      // path
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); let head = A, si = 0;
      for (si = 0; si < 3; si++) { const f = clamp(d - si); if (f <= 0) break; for (let j = 1; j <= 20; j++) { head = bez(...segs[si], (j / 20) * f); ctx.lineTo(head[0], head[1]); } }
      if (fillA > 0) { ctx.closePath(); const fg = ctx.createLinearGradient(-8, -7, 8, 8); fg.addColorStop(0, `rgba(255,170,90,${fillA})`); fg.addColorStop(1, `rgba(234,88,12,${fillA})`); ctx.fillStyle = fg; ctx.fill(); }
      ctx.strokeStyle = '#4c8dff'; ctx.lineWidth = 1.1; ctx.stroke();
      // anchors + the active bezier handle
      const vis = 1 - fillA;
      if (vis > 0) {
        ctx.save(); ctx.globalAlpha *= vis;
        const cur = Math.min(2, Math.floor(d));
        const hp = segs[cur], tA = hp[3], tH = hp[2], tH2 = [2 * tA[0] - tH[0], 2 * tA[1] - tH[1]];
        if (d < 3) { ctx.strokeStyle = '#4c8dff'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(tH[0], tH[1]); ctx.lineTo(tH2[0], tH2[1]); ctx.stroke();
          [tH, tH2].forEach((q) => { ctx.beginPath(); ctx.arc(q[0], q[1], 0.9, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); }); }
        [A, B, C].forEach((q, j) => { if (d < j) return; ctx.fillStyle = j <= d - 1 ? '#4c8dff' : '#fff'; ctx.fillRect(q[0] - 1.2, q[1] - 1.2, 2.4, 2.4); ctx.strokeStyle = '#4c8dff'; ctx.lineWidth = 0.6; ctx.strokeRect(q[0] - 1.2, q[1] - 1.2, 2.4, 2.4); });
        ctx.restore();
      }
      // pen-tool cursor (classic nib) riding the path head, then moving off
      const ph2 = fillA > 0 ? [lerp(head[0], 9, fillA), lerp(head[1], 10, fillA)] : head;
      ctx.save(); ctx.translate(ph2[0], ph2[1]); ctx.rotate(-0.55); ctx.scale(0.8, 0.8);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3.2, -6.5); ctx.quadraticCurveTo(-3, -9.4, 0, -10.6); ctx.quadraticCurveTo(3, -9.4, 3.2, -6.5); ctx.closePath();
      ctx.fillStyle = '#fbf8f3'; ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 0.7; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -0.6); ctx.lineTo(0, -5.6); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -6.4, 0.9, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill();
      rr(-2.6, -14.2, 5.2, 3, 0.8); ctx.fillStyle = '#fbf8f3'; ctx.fill(); ctx.stroke();
      ctx.restore();
      glow = fillA * 0.7;
    } else if (kind === 'fb') {
      // official Facebook mark: blue disc with the white "f" (cut-out at the bottom), plus a live 👍 reaction
      const k = K(3.4);
      ctx.shadowColor = 'transparent';
      const beat = k > 0.4 && k < 0.6 ? 1 + Math.sin(((k - 0.4) / 0.2) * Math.PI) * 0.08 : 1;
      ctx.save(); ctx.scale(beat, beat);
      const bg = ctx.createLinearGradient(0, -9, 0, 9); bg.addColorStop(0, '#2d8cff'); bg.addColorStop(1, '#0866ff');
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.clip();
      ctx.translate(-12, -12);
      ctx.fillStyle = '#fff';
      ctx.fill(new Path2D('M13.6 21.5v-7.3h2.45l.37-2.85H13.6V9.53c0-.82.23-1.38 1.41-1.38h1.5V5.6a20 20 0 0 0-2.19-.11c-2.17 0-3.66 1.32-3.66 3.76v2.1H8.2v2.85h2.46v7.3z'));
      ctx.restore();
      ctx.restore();
      glow = 0.35; gc = '8,102,255';
      if (k > 0.45) { // a "Like" reaction pops out and floats up
        const f = (k - 0.45) / 0.55; glow = 0.35 + Math.sin(f * Math.PI) * 0.5;
        ctx.save(); ctx.globalAlpha *= Math.sin(f * Math.PI); ctx.translate(7.5, -8 - f * 14);
        ctx.beginPath(); ctx.arc(0, 0, 4.2, 0, Math.PI * 2); const lg = ctx.createLinearGradient(0, -4, 0, 4); lg.addColorStop(0, '#2d8cff'); lg.addColorStop(1, '#0866ff'); ctx.fillStyle = lg; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.7; ctx.stroke();
        ctx.fillStyle = '#fff'; // thumbs-up
        ctx.fillRect(-2.3, -0.4, 1.1, 2.6);
        ctx.beginPath(); ctx.moveTo(-0.9, -0.4); ctx.lineTo(0.1, -2.6); ctx.quadraticCurveTo(0.9, -2.8, 0.8, -1.6); ctx.lineTo(0.6, -0.6); ctx.lineTo(2.2, -0.6); ctx.quadraticCurveTo(2.8, -0.5, 2.6, 0.2); ctx.lineTo(2.1, 1.9); ctx.quadraticCurveTo(1.9, 2.3, 1.4, 2.3); ctx.lineTo(-0.9, 2.3); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
    return { glow, gc };
  }
  const TINT = { camera: '255,255,255', insta: '214,41,118', heart: '255,48,64', trend: '255,160,80', edit: '154,164,255', pen: '255,122,26', fb: '8,102,255' };

  function drawOrbit(t, layer) {
    const { rx, ry, tilt, R } = orbitGeom();
    const cx = ph.x, cy = ph.y + Math.sin(t * 0.8) * 4;
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt); ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, layer === 'back' ? Math.PI : 0, layer === 'back' ? Math.PI * 2 : Math.PI);
    ctx.strokeStyle = layer === 'back' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.18)'; ctx.stroke(); ctx.restore(); ctx.setLineDash([]);
    const items = ORBIT.map((kind, i) => {
      const a = (i / ORBIT.length) * Math.PI * 2 + t * 0.3;
      const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
      return { kind, i, x: cx + ex * ct - ey * st, y: cy + ex * st + ey * ct, depth: Math.sin(a) };
    }).filter((o) => (layer === 'front' ? o.depth >= 0 : o.depth < 0)).sort((a, b) => a.depth - b.depth);
    items.forEach((o) => {
      const dn = (o.depth + 1) / 2;               // 0 = far back, 1 = closest
      const r = R * (0.62 + 0.5 * dn);             // perspective size
      ctx.save();
      ctx.globalAlpha *= 0.45 + 0.55 * dn;
      if (dn < 0.45) ctx.globalAlpha *= 0.75 + dn * 0.55; // far icons recede (cheap stand-in for a blur)
      glassBody(o.x, o.y, r, TINT[o.kind]);
      const g = drawGlyph(o.kind, o.x, o.y, r * 0.92, t, o.i);
      if (g.glow > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gg = ctx.createRadialGradient(o.x, o.y, r * 0.4, o.x, o.y, r * 2.3); gg.addColorStop(0, `rgba(${g.gc},${0.32 * g.glow})`); gg.addColorStop(1, `rgba(${g.gc},0)`);
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(o.x, o.y, r * 2.3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      glassFront(o.x, o.y, r);
      ctx.restore();
    });
  }


  /* ==========================================================================
     GLASS HUB
     ========================================================================== */
  const STAGES = [
    { kind: 'camera', word: 'SHOOT', tint: '255,255,255' },
    { kind: 'insta', word: 'POST', tint: '214,41,118' },
    { kind: 'fb', word: 'SHARE', tint: '8,102,255' },
    { kind: 'heart', word: 'ENGAGE', tint: '255,48,64' },
    { kind: 'trend', word: 'GROW', tint: '255,160,80' },
    { kind: 'edit', word: 'EDIT', tint: '154,164,255' },
    { kind: 'pen', word: 'DESIGN', tint: '255,122,26' },
  ];
  const STAGE_T = 3; // seconds per stage (matches the glyph animation loops)
  function drawHub(t) {
    const r = ph.r, x = ph.x, y = ph.y + Math.sin(t * 0.8) * 4;
    const idx = Math.floor(t / STAGE_T) % STAGES.length, st = STAGES[idx], p = (t % STAGE_T) / STAGE_T;
    // ambient glow, tinted by the current stage
    const amb = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.6);
    amb.addColorStop(0, 'rgba(255,122,26,0.2)'); amb.addColorStop(0.5, `rgba(${st.tint},0.05)`); amb.addColorStop(1, 'rgba(255,122,26,0)');
    ctx.fillStyle = amb; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, Math.PI * 2); ctx.fill();
    // floor shadow (depth)
    ctx.save(); ctx.globalAlpha *= 0.6;
    const fs = ctx.createRadialGradient(x, y + r * 1.55, 0, x, y + r * 1.55, r * 1.2);
    fs.addColorStop(0, 'rgba(0,0,0,0.8)'); fs.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fs; ctx.beginPath(); ctx.ellipse(x, y + r * 1.55, r * 1.2, r * 0.22, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    // outer glass ring (thick, refractive)
    const R1 = r * 1.3;
    const ring = ctx.createLinearGradient(x, y - R1, x, y + R1);
    ring.addColorStop(0, 'rgba(255,255,255,0.16)'); ring.addColorStop(0.5, 'rgba(255,255,255,0.03)'); ring.addColorStop(1, 'rgba(255,150,80,0.12)');
    ctx.beginPath(); ctx.arc(x, y, R1, 0, Math.PI * 2); ctx.arc(x, y, r * 1.08, 0, Math.PI * 2, true); ctx.fillStyle = ring; ctx.fill('evenodd');
    ctx.beginPath(); ctx.arc(x, y, R1, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 1.08, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
    // engraved ticks rotating inside the ring
    ctx.save(); ctx.translate(x, y); ctx.rotate(-t * 0.07);
    const tLong = new Path2D(), tMid = new Path2D(), tShort = new Path2D();
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2, long = i % 15 === 0, mid = i % 5 === 0;
      const r1 = r * 1.12, r2 = r * (long ? 1.24 : mid ? 1.2 : 1.17), path = long ? tLong : mid ? tMid : tShort;
      path.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); path.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    }
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.stroke(tShort);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke(tMid);
    ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,190,130,0.75)'; ctx.stroke(tLong);
    ctx.restore();
    // progress arc for the current stage + spinning comet
    ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2);
    ctx.beginPath(); ctx.arc(0, 0, R1 + 6, 0, Math.PI * 2 * ease(p));
    ctx.strokeStyle = 'rgba(255,122,26,0.22)'; ctx.lineWidth = 8; ctx.stroke();   // soft glow (no shadow blur)
    ctx.strokeStyle = 'rgba(255,122,26,0.9)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 1.1);
    const cg = ctx.createLinearGradient(R1, 0, 0, R1); cg.addColorStop(0, 'rgba(255,255,255,0)'); cg.addColorStop(1, 'rgba(255,255,255,0.7)');
    ctx.beginPath(); ctx.arc(0, 0, R1 - 0.5, 0, Math.PI * 0.4); ctx.strokeStyle = cg; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    // stage dots around the ring
    STAGES.forEach((_, i) => {
      const a = -Math.PI / 2 + (i / STAGES.length) * Math.PI * 2, dx = x + Math.cos(a) * (R1 + 14), dy = y + Math.sin(a) * (R1 + 14);
      ctx.beginPath(); ctx.arc(dx, dy, i === idx ? 3 : 1.8, 0, Math.PI * 2); ctx.fillStyle = i === idx ? '#ff7a1a' : 'rgba(255,255,255,0.3)'; ctx.fill();
    });

    // the glass dome
    const dome = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r);
    dome.addColorStop(0, 'rgba(70,68,76,0.55)'); dome.addColorStop(0.55, 'rgba(22,22,27,0.82)'); dome.addColorStop(0.92, 'rgba(8,8,10,0.92)'); dome.addColorStop(1, 'rgba(255,255,255,0.2)');
    const dsh = ctx.createRadialGradient(x, y + 18, r * 0.7, x, y + 18, r * 1.35);   // drop shadow without shadowBlur
    dsh.addColorStop(0, "rgba(0,0,0,0.6)"); dsh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = dsh; ctx.beginPath(); ctx.arc(x, y + 18, r * 1.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = dome; ctx.fill();
    // tinted inner light for the stage
    const tl = ctx.createRadialGradient(x, y + r * 0.35, 0, x, y + r * 0.35, r * 0.9);
    tl.addColorStop(0, `rgba(${st.tint},0.22)`); tl.addColorStop(1, `rgba(${st.tint},0)`);
    ctx.fillStyle = tl; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

    // stage content (slides up + fades between stages)
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 2, 0, Math.PI * 2); ctx.clip();
    const inA = ease(p / 0.14), outA = p > 0.9 ? 1 - (p - 0.9) / 0.1 : 1, a = Math.min(inA, outA);
    ctx.globalAlpha *= a;
    const oy = (1 - inA) * r * 0.25;
    const g = drawGlyph(st.kind, x, y - r * 0.12 + oy, r * 0.48, p * STAGE_T, 0, clamp((p - 0.06) / 0.86));
    if (g.glow > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gg = ctx.createRadialGradient(x, y - r * 0.12, r * 0.1, x, y - r * 0.12, r * 0.9); gg.addColorStop(0, `rgba(${g.gc},${0.4 * g.glow})`); gg.addColorStop(1, `rgba(${g.gc},0)`);
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.font = `600 ${Math.max(10, r * 0.1)}px "JetBrains Mono", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff7a1a';
    { // manual letter-spacing (identical in every browser)
      const sp = Math.max(1.5, r * 0.022), chars = st.word.split(''), ws = chars.map((ch) => ctx.measureText(ch).width);
      const total = ws.reduce((a2, b2) => a2 + b2, 0) + sp * (chars.length - 1);
      let cx2 = x - total / 2; ctx.textAlign = 'left';
      chars.forEach((ch, j) => { ctx.fillText(ch, cx2, y + r * 0.45 + oy * 0.5); cx2 += ws[j] + sp; });
    }
    ctx.restore();
    // live reach counter
    const count = 38000 + Math.floor(t * 23.7);
    text('▲ ' + count.toLocaleString('en-IN') + ' reach', x, y + r * 0.66, Math.max(9, r * 0.085), 'rgba(244,241,236,0.55)', 500, 'center');

    // glass on top: fresnel rim, window reflection, glints
    const rim = ctx.createLinearGradient(x, y - r, x, y + r);
    rim.addColorStop(0, 'rgba(255,255,255,0.75)'); rim.addColorStop(0.4, 'rgba(255,255,255,0.12)'); rim.addColorStop(0.8, 'rgba(255,255,255,0.05)'); rim.addColorStop(1, 'rgba(255,170,110,0.5)');
    ctx.beginPath(); ctx.arc(x, y, r - 0.7, 0, Math.PI * 2); ctx.strokeStyle = rim; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 1.5, 0, Math.PI * 2); ctx.clip();
    const wr = ctx.createLinearGradient(x, y - r, x, y - r * 0.15);
    wr.addColorStop(0, 'rgba(255,255,255,0.2)'); wr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = wr; ctx.beginPath(); ctx.ellipse(x - r * 0.05, y - r * 0.58, r * 0.85, r * 0.42, -0.1, 0, Math.PI * 2); ctx.fill();
    // diagonal sheen sweeping across every few seconds
    const sw = ((t % 5) / 5) * 3 - 1;
    const sh = ctx.createLinearGradient(x - r + sw * r * 2, y - r, x - r * 0.4 + sw * r * 2, y + r);
    sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.07)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(x - r * 0.5, y - r * 0.55, r * 0.09, r * 0.045, -0.75, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  }

  /* ==========================================================================
     NOTIFICATIONS
     ========================================================================== */
  const NOTES = [
    { kind: 'like', who: 'priya.designs', what: 'liked your reel', av: 'P', hue: 330 },
    { kind: 'follow', who: 'rahul_k', what: 'started following you', av: 'R', hue: 200 },
    { kind: 'lead', who: 'New lead', what: 'Event enquiry · Maguvaa', av: '', hue: 140 },
    { kind: 'views', who: 'Reel milestone', what: '2.4M views this week', av: '', hue: 20 },
    { kind: 'comment', who: 'ananya.s', what: 'commented: “stunning 😍”', av: 'A', hue: 280 },
    { kind: 'trend', who: 'Trending', what: '#reels · Hyderabad', av: '', hue: 30 },
    { kind: 'like', who: 'radeesarees', what: 'liked your post', av: 'R', hue: 350 },
    { kind: 'follow', who: '+1,284 followers', what: 'in the last 24 hours', av: '', hue: 210 },
  ];
  const pulses = [], notes = [];
  let lastNote = 0, noteIdx = 0;

  const inAvoid = (x, y, pad = 0) => avoid.some((a) => x > a.l - pad && x < a.r + pad && y > a.t - pad && y < a.b + pad);

  function spawnNote(tr, now) {
    const [x, y] = pointAt(tr, tr.L);
    const nw = W < 700 ? 176 : 214;
    if (y < 120 || y > H - 40 || x < 30 || x > W - 30) return;
    const bx = Math.min(W - nw - 10, Math.max(10, x - nw / 2)), by = y - 62;
    const box = [[bx, by], [bx + nw, by], [bx, by + 48], [bx + nw, by + 48]];
    if (box.some(([px, py]) => inAvoid(px, py))) return;
    if (notes.some((n) => Math.abs(n.bx - bx) < nw + 10 && Math.abs(n.by - by) < 60)) return;
    notes.push({ ...NOTES[noteIdx++ % NOTES.length], x, y, bx, by, nw, born: now, life: 3.4 });
    lastNote = now;
  }

  function drawNote(n, now, vis) {
    const age = now - n.born, k = age / n.life;
    const a = k < 0.1 ? ease(k / 0.1) : k > 0.82 ? (1 - k) / 0.18 : 1;
    const h = 48, w = n.nw, x = n.bx, y = n.by + (1 - ease(k / 0.1)) * 10 - age * 2;
    ctx.save(); ctx.globalAlpha = vis * a;
    // connector to the trace end
    ctx.beginPath(); ctx.moveTo(n.x, y + h); ctx.lineTo(n.x, n.y - 5); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.stroke();
    rr(x - 4, y + 6, w + 8, h + 8, 18); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();   // cheap layered shadow
    rr(x - 1, y + 4, w + 2, h + 2, 15); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    rr(x, y, w, h, 14); ctx.fillStyle = 'rgba(28,28,32,0.92)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.stroke();
    // leading visual
    const ix = x + 24, iy = y + h / 2;
    if (n.av) { avatar(ix, iy, 13, n.av, n.hue, n.kind !== 'comment'); }
    else {
      ctx.beginPath(); ctx.arc(ix, iy, 14, 0, Math.PI * 2);
      ctx.fillStyle = n.kind === 'lead' ? 'rgba(52,199,89,0.18)' : n.kind === 'trend' ? 'rgba(255,122,26,0.2)' : n.kind === 'views' ? 'rgba(255,255,255,0.12)' : 'rgba(79,91,213,0.25)'; ctx.fill();
      const ic = n.kind === 'lead' ? ['bolt', '#34c759'] : n.kind === 'trend' ? ['trend', '#ff7a1a'] : n.kind === 'views' ? ['play', '#fff'] : ['user', '#9aa4ff'];
      icon(ic[0], ix, iy, 14, ic[0] === 'play' || ic[0] === 'bolt' ? { fill: ic[1] } : { stroke: ic[1], lw: 2.2 });
    }
    // badge on avatar
    if (n.kind === 'like') { ctx.beginPath(); ctx.arc(ix + 10, iy + 9, 6.5, 0, Math.PI * 2); ctx.fillStyle = '#ff3040'; ctx.fill(); icon('heart', ix + 10, iy + 9.3, 8, { fill: '#fff' }); }
    if (n.kind === 'follow' && n.av) { ctx.beginPath(); ctx.arc(ix + 10, iy + 9, 6.5, 0, Math.PI * 2); ctx.fillStyle = '#4f5bd5'; ctx.fill(); text('+', ix + 10, iy + 8.6, 10, '#fff', 700, 'center'); }
    // text
    const tx = x + 46, maxW = w - 46 - 34;
    ctx.save(); ctx.beginPath(); ctx.rect(tx, y, maxW, h); ctx.clip();
    text(n.who, tx, y + 18, 11, '#fff', 700);
    text(n.what, tx, y + 32, 10, 'rgba(255,255,255,0.62)', 400);
    ctx.restore();
    text('now', x + w - 12, y + 18, 9, 'rgba(255,255,255,0.4)', 500, 'right');
    ctx.restore();
  }

  /* ==========================================================================
     FRAME
     ========================================================================== */
  let raf = 0, visible = true, tPrev = performance.now(), t0 = tPrev;
  let warmed = 0;
  // Adaptive quality: 30fps normally; if this device can't keep up, drop to 20fps and 1x resolution.
  let costSum = 0, costN = 0, lastMeasureY = -1, measureTick = 0;
  function frame(now) {
    // Under the intro: draw only a couple of warm-up frames (hidden behind the black intro) so the
    // one-off GPU setup cost (shaders, glyphs, buffers) is paid now, not when the logo flies to the nav.
    if (document.documentElement.classList.contains('intro-active') && warmed >= 2) { tPrev = now; raf = visible && !reduce ? requestAnimationFrame(frame) : 0; return; }
    if (warmed >= 2 && now - tPrev < (quality ? 50 : 33) - 4) { raf = visible && !reduce ? requestAnimationFrame(frame) : 0; return; }
    warmed++;
    const c0 = performance.now();
    const dt = Math.max(0, Math.min(0.06, (now - tPrev) / 1000)); tPrev = now;
    const t = Math.max(0, (now - t0) / 1000);
    // Layout reads are costly: only re-measure when the page has scrolled (parallax moves the hub) or every ~0.5s.
    if (window.scrollY !== lastMeasureY || ++measureTick % 15 === 0) { lastMeasureY = window.scrollY; measure(); }
    const vo = visual ? visual.style.opacity : ''; const vis = vo === '' ? 1 : Math.min(1, parseFloat(vo) || 0);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = vis;

    // traces
    const far = Math.max(W, H) * 0.5;
    // Batched: one path per (colour, fade level) instead of one draw call per trace/node.
    const groups = new Map();
    const grp = (key, mk) => { let g = groups.get(key); if (!g) { g = mk(); groups.set(key, g); } return g; };
    ctx.lineWidth = 1;
    traces.forEach((tr) => {
      const end = abs(tr.pts[tr.pts.length - 1]);
      const fade = Math.round(Math.max(0.25, 1 - Math.hypot(end[0] - ph.x, end[1] - ph.y) / far) * 6) / 6;
      tr.flash = Math.max(0, tr.flash - dt * 1.5);
      const line = grp('l' + tr.hot + fade, () => ({ p: new Path2D(), style: tr.hot ? rgba(ORANGE, 0.2 * fade) : rgba(WHITE, 0.09 * fade), stroke: true }));
      tr.pts.forEach((p, i) => { const q = abs(p); i ? line.p.lineTo(q[0], q[1]) : line.p.moveTo(q[0], q[1]); });
      if (tr.flash > 0.02) {   // the few flashing nodes are drawn individually
        ctx.beginPath(); ctx.arc(end[0], end[1], tr.node + tr.flash * 2.5, 0, Math.PI * 2);
        if (tr.ring) { ctx.strokeStyle = tr.hot ? rgba(ORANGE, 0.45 * fade + tr.flash) : rgba(WHITE, 0.28 * fade + tr.flash * 0.6); ctx.stroke(); }
        else { ctx.fillStyle = tr.hot ? rgba(ORANGE, 0.4 * fade + tr.flash * 0.6) : rgba(WHITE, 0.2 * fade + tr.flash * 0.6); ctx.fill(); }
        ctx.beginPath(); ctx.arc(end[0], end[1], tr.node + (1 - tr.flash) * 16, 0, Math.PI * 2); ctx.strokeStyle = rgba(tr.hot ? ORANGE : WHITE, tr.flash * 0.5); ctx.stroke();
      } else {
        const node = grp('n' + tr.hot + tr.ring + fade, () => ({ p: new Path2D(), stroke: tr.ring,
          style: tr.ring ? (tr.hot ? rgba(ORANGE, 0.45 * fade) : rgba(WHITE, 0.28 * fade)) : (tr.hot ? rgba(ORANGE, 0.4 * fade) : rgba(WHITE, 0.2 * fade)) }));
        node.p.moveTo(end[0] + tr.node, end[1]); node.p.arc(end[0], end[1], tr.node, 0, Math.PI * 2);
      }
    });
    groups.forEach((g) => { if (g.stroke) { ctx.strokeStyle = g.style; ctx.stroke(g.p); } else { ctx.fillStyle = g.style; ctx.fill(g.p); } });

    // pulses
    if (!reduce && Math.random() < dt * (W < 700 ? 3 : 5)) {
      const tr = traces[(Math.random() * traces.length) | 0];
      pulses.push({ t: tr, s: 0, v: 160 + Math.random() * 170, hot: tr.hot || Math.random() < 0.3 });
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]; p.s += p.v * dt;
      const col = p.hot ? ORANGE : WHITE, trail = 28;
      if (p.s > 0) {
        const sh = Math.min(p.s, p.t.L), st = Math.max(0, Math.min(p.s - trail, p.t.L));
        if (sh > st) {
          const a = pointAt(p.t, sh), b = pointAt(p.t, st), mid = pointAt(p.t, (sh + st) / 2);
          const lg = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
          lg.addColorStop(0, rgba(col, 0.5)); lg.addColorStop(1, rgba(col, 0));
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(mid[0], mid[1]); ctx.lineTo(b[0], b[1]);
          ctx.strokeStyle = lg; ctx.lineWidth = 1; ctx.stroke();
        }
      }
      if (p.s <= p.t.L) {
        const hd = pointAt(p.t, p.s), g = ctx.createRadialGradient(hd[0], hd[1], 0, hd[0], hd[1], 3.5);
        g.addColorStop(0, rgba(col, 0.6)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hd[0], hd[1], 3.5, 0, Math.PI * 2); ctx.fill();
      }
      if (p.s > p.t.L + trail) {
        p.t.flash = 1;
        if (now / 1000 - lastNote > 0.7 && notes.length < (W < 700 ? 1 : 3) && Math.random() < 0.55) spawnNote(p.t, now / 1000);
        pulses.splice(i, 1);
      }
    }

    drawOrbit(t, 'back');
    ctx.globalAlpha = vis;
    drawHub(t);
    ctx.globalAlpha = vis;
    drawOrbit(t, 'front');
    ctx.globalAlpha = vis;
    for (let i = notes.length - 1; i >= 0; i--) { if (now / 1000 - notes[i].born > notes[i].life) notes.splice(i, 1); }
    notes.forEach((n) => drawNote(n, now / 1000, vis));
    ctx.globalAlpha = 1;
    // Warm-up while the black intro covers the page: also draw every notification style, then force
    // the GPU to actually render it (a 1px read-back) and wipe it. The browser otherwise postpones a
    // hidden canvas's first real render until it becomes visible -> a visible hitch after the intro.
    if (document.documentElement.classList.contains('intro-active')) {
      // Decide quality early (hidden warm-up frame #2): slow devices start in the light mode, so the
      // moment the intro hands over is already smooth.
      if (warmed === 2 && !quality && performance.now() - c0 > 8) { quality = 1; resize(); }
      const nw = W < 700 ? 176 : 214;
      NOTES.forEach((n, i) => drawNote({ ...n, x: 40, y: 140, bx: 20 + (i % 4) * (nw + 8), by: 20 + Math.floor(i / 4) * 56, nw, born: now / 1000 - 1, life: 3.4 }, now / 1000, 1));
      try { ctx.getImageData(0, 0, 1, 1); } catch (e) {}
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    }
    if (!document.documentElement.classList.contains('intro-active') && !quality) {
      costSum += performance.now() - c0; costN++;
      if (costN >= 30) { if (costSum / costN > 10) { quality = 1; resize(); } costSum = 0; costN = 0; }
    }
    raf = visible && !reduce ? requestAnimationFrame(frame) : 0;
  }

  resize();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (reduce) frame(performance.now()); }, 150); });
  if (document.fonts) document.fonts.ready.then(() => { resize(); if (document.documentElement.classList.contains('intro-active')) warmed = 0; });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf && !reduce) { tPrev = performance.now(); raf = requestAnimationFrame(frame); } }).observe(hero);
  if (reduce) frame(performance.now() + 5200); else raf = requestAnimationFrame(frame);
})();

/* SOLUTIONS — blinks orange on its own (like the hover) a few times a minute */
(function () {
  const el = document.querySelector('.hero__accent');
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const seq = [[0, true], [110, false], [200, true], [290, false], [380, true], [1500, false]];
  function blink() {
    if (!el.matches(':hover')) seq.forEach(([ms, on]) => setTimeout(() => el.classList.toggle('is-lit', on), ms));
    setTimeout(blink, 10000);
  }
  setTimeout(blink, 4000);
})();
