/* UC8 seven-segment logotype — builds the SVG so every segment is its own path
   (used by the intro "power-on", nav and footer).
   Proportions follow the UC8 brand logo: squarer digits,
   heavier strokes, tight joints, evenly justified "UniCre8" label. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 100;      // Digit width
  const H = 128;      // Digit height
  const T = 15;       // Segment thickness
  const G = 1.8;      // Segment gap
  const GAP = 30;     // Space between digits
  const GLYPHS = { U: 'bcdef', C: 'adef', 8: 'abcdefg' }; // a top, b top-right, c bottom-right, d bottom, e bottom-left, f top-left, g middle
  let uid = 0;

  // hexagonal segment with 45° chamfered tips
  function hSeg(x1, x2, y) {
    const t = T / 2;
    return `M${x1} ${y}L${x1 + t} ${y - t}H${x2 - t}L${x2} ${y}L${x2 - t} ${y + t}H${x1 + t}Z`;
  }
  function vSeg(x, y1, y2) {
    const t = T / 2;
    return `M${x} ${y1}L${x + t} ${y1 + t}V${y2 - t}L${x} ${y2}L${x - t} ${y2 - t}V${y1 + t}Z`;
  }
  function segPath(id, ox) {
    const l = ox + T / 2, r = ox + W - T / 2, top = T / 2, mid = H / 2, bot = H - T / 2;
    switch (id) {
      case 'a': return hSeg(l + G, r - G, top);
      case 'g': return hSeg(l + G, r - G, mid);
      case 'd': return hSeg(l + G, r - G, bot);
      case 'f': return vSeg(l, top + G, mid - G);
      case 'b': return vSeg(r, top + G, mid - G);
      case 'e': return vSeg(l, mid + G, bot - G);
      case 'c': return vSeg(r, mid + G, bot - G);
    }
  }

  /**
   * build(svg, {label, glow}) → returns array of segment <path> elements (in glyph order)
   * glow: adds an SVG bloom filter (no clipped boxes) used by lit segments.
   */
  function build(svg, opts) {
    opts = opts || {};
    const label = opts.label !== false;
    const totalW = W * 3 + GAP * 2;
    const top = label ? -50 : 0;
    const pad = opts.glow ? 26 : 4;
    svg.setAttribute('viewBox', `${-pad} ${top - pad} ${totalW + pad * 2} ${H - top + pad * 2}`);
    svg.setAttribute('overflow', 'visible');
    svg.innerHTML = '';

    if (opts.glow) {
      const id = 'uc8glow' + (++uid);
      svg.insertAdjacentHTML('afterbegin',
        `<defs><filter id="${id}" filterUnits="userSpaceOnUse" x="${-pad - 40}" y="${top - pad - 40}" width="${totalW + pad * 2 + 80}" height="${H - top + pad * 2 + 80}" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b1"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b2"/>
          <feColorMatrix in="b2" type="matrix" values="0.8 0 0 0 0  0 0.85 0 0 0  0 0 1 0 0  0 0 0 0.75 0" result="b2c"/>
          <feMerge><feMergeNode in="b2c"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter></defs>`);
      svg.style.setProperty('--seg-glow', `url(#${id})`);
    }

    const segs = [];
    if (label) {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('y', -20);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('class', 'seglogo__label');
      // Justified across the full mark, like the brand file. Each letter gets its own fixed x position
      // (centred on it) instead of using textLength: Chrome does not re-apply textLength after the web
      // font loads, which collapsed the word to the left. Fixed positions can't drift in any browser.
      const word = 'UniCre8'.split('');
      const cw = 14;                                   // approx. letter width at this size
      const x0 = 2 + cw / 2, x1 = totalW - 2 - cw / 2;
      word.forEach((ch, i) => {
        const s = document.createElementNS(NS, 'tspan');
        s.setAttribute('class', 'seglogo__char');
        const last = word.length - 1;
        // first letter's left edge and last letter's right edge sit exactly on the mark's edges
        if (i === 0) { s.setAttribute('x', 0); s.setAttribute('text-anchor', 'start'); }
        else if (i === last) { s.setAttribute('x', totalW); s.setAttribute('text-anchor', 'end'); }
        else s.setAttribute('x', (x0 + (i * (x1 - x0)) / last).toFixed(1));
        s.textContent = ch;
        t.appendChild(s);
      });
      svg.appendChild(t);
    }
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'seglogo__glyphs');
    ['U', 'C', '8'].forEach((ch, i) => {
      const ox = i * (W + GAP);
      GLYPHS[ch].split('').forEach((id) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', segPath(id, ox));
        p.setAttribute('class', 'seg');
        p.dataset.seg = ch + id;
        g.appendChild(p);
        segs.push(p);
      });
    });
    svg.appendChild(g);
    return segs;
  }

  window.UC8Seg = { build };

  // Nav and footer logos
  document.querySelectorAll('[data-seglogo="nav"]').forEach((svg) => build(svg, { label: false }));
  document.querySelectorAll('[data-seglogo="footer"]').forEach((svg) => build(svg, { label: false }));
})();
