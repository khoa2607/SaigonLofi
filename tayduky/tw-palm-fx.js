'use strict';
// ===== Tây Du Ký v2 — Lòng Bàn Tay Phật Tổ: living atmosphere (render only; loaded after tw-fx.js and before tw-render.js) =====
// Everything here reads TWS.palm (curl, glow, inscription, ...) and TWM.palm (the authored layout); nothing here drives behaviour.
//   drawables  - cloud dressing statics (sprites at layer heights) and the drifting cloud layers, merged into the main depth sort
//   draw       - god rays, mist curling off cloud cliffs, petals, motes, inscriptions, the Five Elements vision, the divine column, ripples, steam
//   light      - golden moonlit glow at night, finger and Buddha halos
(function () {
  const A = TWA, hash = TWM.hash2, N = TWM.N;
  const st = () => (window.TWS && TWS.palm) || null;
  const pal = () => TWM.palm;

  // ---------------------------------------------------------------- sprite wrappers: finger glow overlay and the Buddha's swaying robe
  const baseSprite = A.ext.sprite;
  function fingerAfter(g, s, f, R) {
    const S = st(), k = s.p.finger, pulse = 0.72 + 0.28 * Math.sin(R.t * 2.6 + k * 1.3), base = 0.045 + R.dark * 0.2;
    const a = Math.max(base, S ? S.glow : 0) * pulse; if (a < 0.02) return;
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(0.3, a * 0.45); g.drawImage(f, s.X, s.Y); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  function buddhaDraw(g, s, f, R) {
    // head, halo and shoulders stay perfectly still; the lower robe and lotus petals ripple by one pixel in a slow breeze
    const w = f.width, h = f.height, split = Math.floor(h * 0.56);
    g.drawImage(f, 0, 0, w, split, s.X, s.Y, w, split);
    for (let y = split; y < h; y += 4) { const o = Math.round(Math.sin(R.t * 0.8 + y * 0.06 + s.ph) * 0.9 * ((y - split) / (h - split))); g.drawImage(f, 0, y, w, Math.min(4, h - y), s.X + o, s.Y + y, w, Math.min(4, h - y)); }
  }
  A.ext.sprite = p => {
    if (p.kind === 'finger') { const sp = baseSprite(p); sp.after = fingerAfter; return sp; }
    if (p.kind === 'buddha') { const im = A.IMG['buddha_a']; return im ? { w: im.w, h: im.h, py: im.py, frames: [im.im], em: im.glow, glow: im.glow, silk: null, flat: false, img: true, draw: buddhaDraw } : null; }
    return null;
  };

  // ---------------------------------------------------------------- cloud dressing + drifting layers
  let ready = false, drift = [], mistSrc = [];
  function init(R) {
    ready = true; const P = pal(); if (!P) return;
    for (const c of P.clouds) {
      const sp = A.sprite({ kind: c.kind, v: c.v }); if (!sp) continue;
      const x = (c.i + 0.5) * 8, y = (c.j + 0.5) * 8, z = TWM.H[TWM.id(c.i, c.j)] * 4 + c.lift;
      R.addStatic({ kind: c.kind, v: c.v, keyOff: c.far ? -30 : c.rim ? 6 : 0 }, sp, x, y, z);
    }
    for (const d of P.drift) { const sp = A.sprite({ kind: d.kind, v: d.v }); if (sp) drift.push({ d, sp }); }
    // mist sources: lips of cloud cliffs 3+ levels high on the palm's cell
    const bk = TWM.bi.btp; const H = TWM.H;
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const k = TWM.id(i, j); if (TWM.BIO[k] !== bk) continue;
      for (const [di, dj, side] of [[0, 1, 0], [1, 0, 1]]) { const k2 = TWM.id(i + di, j + dj), drop = H[k] - H[k2]; if (drop >= 3 && hash(i, j, 360) < 0.5) mistSrc.push({ i, j, side, drop, ph: hash(i, j, 361) }); } }
    mistSrc.sort((a, b) => b.drop - a.drop); mistSrc = mistSrc.slice(0, 70);
  }
  function drawables(D, R, x0, y0, W, Hh) {
    if (!ready) init(R);
    const t = R.t;
    for (const e of drift) {
      const d = e.d, sw = Math.sin(t * d.speed * 0.06 + d.ph) * d.range, x = (d.i + 0.5) * 8 + sw * 0.5, y = (d.j + 0.5) * 8 - sw * 0.5, z = TWM.H[TWM.id(d.i, d.j)] * 4 + d.lift;
      const X = Math.round(R.wx(x, y) - e.sp.w / 2), Y = Math.round(R.wy(x, y, z) - e.sp.py);
      if (X > x0 + W || X + e.sp.w < x0 || Y > y0 + Hh || Y + e.sp.h < y0) continue;
      D.push([x + y - 26 + d.lift * 0.4, 5, { draw: (g) => { g.globalAlpha = 0.93; g.drawImage(e.sp.frames[0], X, Y); g.globalAlpha = 1; } }]);
    }
  }

  // ---------------------------------------------------------------- pseudo-glyphs: stylised strokes (never real text), used for the inscription and the Five Elements
  function glyph(g, x, y, seed, col, sc) {
    g.fillStyle = col; const s = sc || 1;
    for (let k = 0; k < 4; k++) { const h = hash(seed, k, 370); const sx = x + Math.floor(h * 3) * s, sy = y + k * 2 * s + (k > 1 ? 1 : 0);
      if (hash(seed, k, 371) < 0.55) g.fillRect(sx, sy, (4 + Math.floor(hash(seed, k, 372) * 3)) * s, s); else { g.fillRect(sx + 2 * s, y, s, 8 * s); } }
    g.fillRect(x + 3 * s, y, s, 8 * s); g.fillRect(x + s, y + 7 * s, 5 * s, s);
  }
  function fingerStatic(R, k) { for (const s of R.statics) if (s.p.kind === 'finger' && s.p.finger === k) return s; return null; }

  // ---------------------------------------------------------------- overlays
  function draw(g, S, R, x0, y0, W, Hh) {
    const P = pal(), ps = st(); if (!P || !ps) return; const t = R.t;
    const cx = R.wx((P.centre[0] + 0.5) * 8, (P.centre[1] + 0.5) * 8), cy = R.wy((P.centre[0] + 0.5) * 8, (P.centre[1] + 0.5) * 8, 12);
    if (cx < x0 - 1400 || cx > x0 + W + 1400 || cy < y0 - 1000 || cy > y0 + Hh + 800) return;
    // -- god rays: soft golden beams slanting through the gaps between the pillars (additive), brighter while the palm glows
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 7; k++) { const bx = cx - 520 + k * 175 + Math.sin(t * 0.12 + k) * 26, top = cy - 640, bot = cy + 140, wd = 38 + (k % 3) * 20, a = (0.028 + 0.02 * Math.sin(t * 0.5 + k * 1.7) + ps.glow * 0.07) * (1 - R.dark * 0.4);
      const gr = g.createLinearGradient(bx, top, bx + 260, bot); gr.addColorStop(0, `rgba(255,236,180,0)`); gr.addColorStop(0.35, `rgba(255,236,180,${a})`); gr.addColorStop(1, `rgba(255,236,180,0)`);
      g.fillStyle = gr; g.beginPath(); g.moveTo(bx, top); g.lineTo(bx + wd, top); g.lineTo(bx + 260 + wd * 1.6, bot); g.lineTo(bx + 260, bot); g.closePath(); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    // -- mist curling down the cloud cliffs: pale streaks fall from the lips and thin out
    for (const m of mistSrc) { const sx = A.SX(m.i, m.j), sy = A.SY(m.i, m.j, TWM.H[TWM.id(m.i, m.j)]); if (sx < x0 - 40 || sx > x0 + W + 40 || sy < y0 - 40 || sy > y0 + Hh + m.drop * 16 + 40) continue;
      const bx = m.side ? sx + 16 : sx - 16, by = sy + 22 + (m.side ? -2 : 0), dp = m.drop * 16;
      for (let q = 0; q < 6; q++) { const p = (t * (0.18 + q * 0.025) + m.ph + q * 0.17) % 1, x = bx + (q - 2.5) * 5 + Math.sin(t * 0.7 + q + m.ph * 6) * 3, y = by + p * dp;
        g.fillStyle = `rgba(255,255,255,${0.5 * Math.sin(p * Math.PI)})`; g.fillRect(Math.round(x), Math.round(y), 1 + (q & 1), 4 + (q % 3) * 2); } }
    // -- lotus petals and golden motes rising from the Buddha's terrace and the finger bases
    const bx = R.wx((P.buddha[0] + 0.5) * 8, (P.buddha[1] + 0.5) * 8), by = R.wy((P.buddha[0] + 0.5) * 8, (P.buddha[1] + 0.5) * 8, TWM.H[TWM.id(P.buddha[0], P.buddha[1])] * 4);
    for (let q = 0; q < 26; q++) { const p = (t * 0.09 + hash(q, 3, 380)) % 1, x = bx + (hash(q, 1, 380) - 0.3) * 260 + Math.sin(t * 0.6 + q) * 14 + p * 40, y = by - 190 + p * 330;
      if (x < x0 - 20 || x > x0 + W + 20 || y < y0 - 20 || y > y0 + Hh + 20) continue; g.fillStyle = q % 3 ? '#ffc4d8' : '#fff0f6'; g.fillRect(Math.round(x), Math.round(y), 2, 1); if (q % 4 === 0) g.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 1); }
    for (let q = 0; q < 34; q++) { const p = (t * 0.07 + hash(q, 4, 381)) % 1, x = cx + (hash(q, 2, 381) - 0.5) * 760, y = cy + 60 - p * 360 + Math.sin(t + q) * 4; if (x < x0 || x > x0 + W || y < y0 || y > y0 + Hh) continue;
      g.fillStyle = `rgba(255,236,170,${Math.sin(p * Math.PI) * 0.9})`; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
    // -- the inscription: a vertical column of glowing gold glyphs on a finger pillar (persists until the recovery fades it)
    for (let k = 0; k < 5; k++) { const a = ps.inscr[k]; if (a < 0.02) continue; const s = fingerStatic(R, k); if (!s) continue;
      const X = s.X + s.sp.ox, Yb = s.Y + s.sp.py, top = Yb - 70 - Math.min(ps.inscrN[k], 8) * 11; g.globalAlpha = Math.min(1, a);
      for (let q = 0; q < Math.min(ps.inscrN[k], 8); q++) { glyph(g, X - 4, top + q * 11, k * 17 + q, '#fff3b0'); }
      g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,200,90,${0.16 * a})`; g.fillRect(X - 9, top - 4, 18, Math.min(ps.inscrN[k], 8) * 11 + 8); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
    // -- the divine column that traps the Monkey King, and its ground ring
    if (ps.trap > 0.02) { const tx = R.wx(ps.trapAt[0], ps.trapAt[1]), ty = R.wy(ps.trapAt[0], ps.trapAt[1], TWM.groundZ(ps.trapAt[0], ps.trapAt[1]));
      g.globalCompositeOperation = 'lighter';
      const gr = g.createLinearGradient(tx, ty - 560, tx, ty); gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(0.6, `rgba(255,232,160,${0.2 * ps.trap})`); gr.addColorStop(1, `rgba(255,255,230,${0.4 * ps.trap})`);
      g.fillStyle = gr; g.fillRect(Math.round(tx - 16 - 8 * (1 - ps.trap)), ty - 560, 32 + 16 * (1 - ps.trap), 560);
      for (let q = 0; q < 3; q++) { const r = 30 + q * 22 + Math.sin(t * 2 + q) * 4; g.strokeStyle = `rgba(255,236,170,${0.5 * ps.trap / (q + 1)})`; g.beginPath(); g.ellipse(tx, ty, r, r * 0.5, 0, 0, 6.29); g.stroke(); }
      g.globalCompositeOperation = 'source-over'; }
    // -- the vision of the Five Elements Mountains in the cloud (金木水火土): five misty peaks that bloom between the closing fingers
    if (ps.mountains > 0.02) { const a = ps.mountains, cols = ['#f4d27a', '#8fd08f', '#8fc4f0', '#f09a78', '#d8c08a'];
      for (let k = 0; k < 5; k++) { const mx = cx + (k - 2) * 78, base = cy + 20 - Math.abs(k - 2) * 8, hgt = (150 + (k === 2 ? 70 : (k === 1 || k === 3) ? 30 : 0)) * a;
        g.globalAlpha = 0.62 * a; const gr = g.createLinearGradient(mx, base - hgt, mx, base); gr.addColorStop(0, 'rgba(236,226,255,0.9)'); gr.addColorStop(0.5, 'rgba(176,166,230,0.9)'); gr.addColorStop(1, 'rgba(120,120,200,0.9)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(mx - 44, base); g.lineTo(mx - 20, base - hgt * 0.55); g.lineTo(mx - 6, base - hgt * 0.8); g.lineTo(mx, base - hgt); g.lineTo(mx + 10, base - hgt * 0.78); g.lineTo(mx + 28, base - hgt * 0.5); g.lineTo(mx + 46, base); g.closePath(); g.fill();
        g.globalAlpha = a; glyph(g, mx - 4, base - hgt * 0.55, 40 + k, cols[k], 1.6);
        g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,236,170,${0.18 * a})`; g.fillRect(mx - 30, base - hgt, 60, hgt); g.globalCompositeOperation = 'source-over'; }
      g.globalAlpha = 1; }
    // -- invisible-boundary ripples, and the discreet puffs of steam at a pillar's foot
    for (const r of ps.ripples) { const k = r.t / 1.4, X = R.wx(r.x, r.y), Y = R.wy(r.x, r.y, 14); g.strokeStyle = `rgba(255,248,214,${0.75 * (1 - k)})`; for (let q = 0; q < 3; q++) { const e = 10 + k * 46 + q * 10; g.beginPath(); g.ellipse(X, Y - 16, e * 0.45, e, 0, -1.2, 1.2); g.stroke(); } }
    for (const s2 of ps.steam) { const k = s2.t / 2.6, X = R.wx(s2.x, s2.y), Y = R.wy(s2.x, s2.y, 4); for (let q = 0; q < 5; q++) { const p = Math.min(1, k + q * 0.06), x = X + 9 + Math.sin(t * 2 + q * 2) * 2, y = Y - 6 - p * 24 - q * 3; g.fillStyle = `rgba(255,255,255,${0.55 * (1 - k)})`; g.fillRect(Math.round(x), Math.round(y), 3 + (q & 1), 2); } }
  }

  // ---------------------------------------------------------------- Wukong's cloud (drawn under him while he rides)
  function drawRide(g, a, X, Y, px0, py0) {
    const im = A.IMG['pride_a']; if (!im) return; const bob = Math.round(Math.sin(TWR.t * 3 + (a.phase || 0)) * 1);
    g.drawImage(im.im, Math.round(X + px0 - im.w / 2), Math.round(Y + py0 - im.h * 0.62 + bob));
  }

  // ---------------------------------------------------------------- night: golden moonlit clouds, halos at the fingers and the Buddha
  function light(g, S, R, amt) {
    const P = pal(), ps = st(); if (!P || !ps) return; const t = R.t;
    const night = Math.max(0, amt - 0.05);
    for (const f of P.fingers) { const sx = R.wx((f.cx + 0.5) * 8, (f.cy + 0.5) * 8), sy = R.wy((f.cx + 0.5) * 8, (f.cy + 0.5) * 8, TWM.H[TWM.id(f.cx, f.cy)] * 4) - f.lv * 8;
      if (sx < R.cx - R.cv.width / 2 - 200 || sx > R.cx + R.cv.width / 2 + 200 || sy < R.cy - R.cv.height / 2 - 300 || sy > R.cy + R.cv.height / 2 + 300) continue;
      const a = (0.04 + night * 0.34 + ps.glow * 0.5) * (0.78 + 0.22 * Math.sin(t * 1.6 + f.k)); const rg = g.createRadialGradient(sx, sy, 8, sx, sy, 130); rg.addColorStop(0, `rgba(255,226,150,${a})`); rg.addColorStop(1, 'rgba(255,226,150,0)'); g.fillStyle = rg; g.fillRect(sx - 130, sy - 130, 260, 260); }
    const bx = R.wx((P.buddha[0] + 0.5) * 8, (P.buddha[1] + 0.5) * 8), by = R.wy((P.buddha[0] + 0.5) * 8, (P.buddha[1] + 0.5) * 8, TWM.H[TWM.id(P.buddha[0], P.buddha[1])] * 4) - 90;
    const a = (0.1 + night * 0.4) * (0.85 + 0.15 * Math.sin(t * 1.1)); const rg = g.createRadialGradient(bx, by, 10, bx, by, 190); rg.addColorStop(0, `rgba(255,232,160,${a})`); rg.addColorStop(1, 'rgba(255,232,160,0)'); g.fillStyle = rg; g.fillRect(bx - 190, by - 190, 380, 380);
    if (night > 0.05) { const cx = R.wx((P.centre[0] + 0.5) * 8, (P.centre[1] + 0.5) * 8), cy = R.wy((P.centre[0] + 0.5) * 8, (P.centre[1] + 0.5) * 8, 20);
      const g2 = g.createRadialGradient(cx, cy, 20, cx, cy, 620); g2.addColorStop(0, `rgba(255,222,150,${night * 0.16})`); g2.addColorStop(1, 'rgba(255,222,150,0)'); g.fillStyle = g2; g.fillRect(cx - 620, cy - 620, 1240, 1240); }
  }
  // the world-wide light pass also calls this for characters riding clouds (nothing extra needed); register the module
  TWFX.palm = { drawables, draw, light, drawRide };
})();
