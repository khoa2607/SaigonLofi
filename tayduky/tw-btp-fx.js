'use strict';
// ===== Tây Du Ký — Lòng Bàn Tay Phật Tổ (rebuilt): living effects (render-only; reads TWS.btp; REPLACES TWFX.palm, keeping its somersault-cloud drawRide) =====
// Drifting cloud wisps over the palm (thick before the signature, parted at the reveal), banks around the fingers, golden light shafts, sparkles, falling lotus petals, lotus blooms that open and close, cranes circling the fingertips, birds, butterflies of light,
// the pulsing palm lines, the five fingers' rune studs and glow, the rune ring and the beams from the fingertips closing into a prison of light, the column of light, shock waves, the Buddha's halo, thunder, caption and story camera.
window.TWFX = window.TWFX || {};
(function () {
  const A = TWA, T = 8, Fm = () => TWM.palm, st = () => (window.TWS && TWS.btp) || null, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), hash = (a, b, c) => TWM.hash2(a, b, c), sm = t => t * t * (3 - 2 * t);
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const inView = (R, x, y, m) => { const x0 = R.cx - R.cv.width / 2 - m, y0 = R.cy - R.cv.height / 2 - m; return x > x0 && x < x0 + R.cv.width + 2 * m && y > y0 && y < y0 + R.cv.height + 2 * m; };
  function blob(g, x, y, r, rgb, a) { if (a <= 0.003) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  const mist = (g, x, y, rx, ry, a, rgb) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); blob(g, 0, 0, rx, rgb || '250,252,255', a); g.restore(); };
  const ring = (g, x, y, rx, ry, col, w, a0, a1) => { g.strokeStyle = col; g.lineWidth = w || 1; g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0 || 0, a1 === undefined ? 6.2832 : a1); g.stroke(); };
  const S_t = () => window.TWS ? TWS.t : 0, ground = (x, y) => TWM.groundZ(x, y);
  const SX = (i, j) => i * T, SEAL = () => [74 * T, 50 * T];
  let G = null; function geo() { if (G) return G; const N = TWM.N, F = Fm(); G = { box: null }; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), h = TWM.H[k], X = A.SX(i, j), Y = A.SY(i, j, h); x0 = Math.min(x0, X - 32); x1 = Math.max(x1, X + 32); y0 = Math.min(y0, Y - 60); y1 = Math.max(y1, Y + 40); } G.box = [x0, y0 - 200, x1, y1]; return G; }
  const tip = (R, k, dz) => { const f = Fm().fingers[k], x = (f.cx + 0.5) * T, y = (f.y0 + 0.5) * T; return [R.wx(x, y), R.wy(x, y, ground(x, y) + (dz || 0))]; };
  const sealXY = (R, dz) => { const [x, y] = SEAL(); return [R.wx(x, y), R.wy(x, y, ground(x, y) + (dz || 0))]; };
  const bud = () => { const f = Fm(); return [(f.buddha[0] + 1.5) * T, (f.buddha[1] + 1.5) * T]; };
  // ---------------------------------------------------------------- the Buddha, drawn at twice the size (the landmark of the biome)
  const prevSprite = A.ext.sprite, BK = 2;
  A.ext.sprite = p => {
    if (p.kind !== 'buddha') return prevSprite ? prevSprite(p) : null; const im = A.IMG['buddha_a']; if (!im) return prevSprite ? prevSprite(p) : null;
    return { w: im.w * BK, h: im.h * BK, py: im.py * BK, frames: [im.im], em: null, glow: null, silk: null, flat: false, img: true, draw(g, s, f, R) {
      const w = f.width, h = f.height, split = Math.floor(h * 0.56), sv = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false;
      g.drawImage(f, 0, 0, w, split, s.X, s.Y, w * BK, split * BK);
      for (let y = split; y < h; y += 4) { const o = Math.round(Math.sin(R.t * 0.8 + y * 0.06 + s.ph) * 0.9 * ((y - split) / (h - split))) * BK, hh = Math.min(4, h - y); g.drawImage(f, 0, y, w, hh, s.X + o, s.Y + y * BK, w * BK, hh * BK); }
      g.imageSmoothingEnabled = sv; } };
  };
  // ---------------------------------------------------------------- the hand: one big pixel-art sprite painted from the signed-distance field (exact organic silhouette, true 2:1 projection)
  const hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const STN = ramp(['#8a7248', '#b09660', '#d2b87c', '#e8d29c', '#f6e6bc', '#fff6dc']), NAIL = ramp(['#d894a8', '#ecb2c2', '#f8d0da', '#fde6ec', '#fff4f6', '#ffffff']), WAL = ramp(['#6e5a38', '#8e7648', '#b49a62', '#d2b87c', '#e8d29c', '#f6e6bc']);
  const LINES = [[[3.7, 4.8], [3.8, 2], [3.5, -1], [3.0, -3.4]], [[2.4, -4.7], [1.6, -1.5], [1.2, 1.5], [0.6, 4.7]], [[2.3, -4.2], [0.6, -4.7], [-2, -3.6], [-3.7, -1.3], [-4.5, 0.6]]];
  const segD = (u, v, a, b) => { const px = u - a[0], py = v - a[1], bx = b[0] - a[0], by = b[1] - a[1], h = Math.max(0, Math.min(1, (px * bx + py * by) / (bx * bx + by * by))); return Math.hypot(px - bx * h, py - by * h); };
  const lineD = (u, v) => { let d = 9; for (const L of LINES) for (let q = 0; q < L.length - 1; q++) d = Math.min(d, segD(u, v, L[q], L[q + 1])); return d; };
  const tone = (r, t) => { t = Math.max(0, Math.min(r.length - 1.001, t)); const i = Math.floor(t), f = t - i, a = r[i], b = r[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; };
  function paintHand(spread) {
    const G = Fm().geo, C = G.C, CH = G.chains(spread), THK = 20, vn = TWM.vnoise;
    let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9; for (const [u, v] of [[-13, -11], [-13, 11], [19, -11], [19, 11], [19, 0], [-13, 0], [0, -11], [0, 11]]) { const w = G.toWorld(u, v), di = w[0] - C[0], dj = w[1] - C[1], sx = 32 * (di - dj), sy = 16 * (di + dj); mnx = Math.min(mnx, sx); mxx = Math.max(mxx, sx); mny = Math.min(mny, sy); mxy = Math.max(mxy, sy); }
    const ox = Math.floor(-mnx) + 8, py = Math.floor(-mny) + 8 + 40, W = Math.ceil(mxx - mnx) + 16, Hh = Math.ceil(mxy - mny) + 16 + 40 + THK;
    const D = new Float32Array(W * Hh), HG = new Float32Array(W * Hh), I = new Uint8Array(W * Hh);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const a = (x + 0.5 - ox) / 32, b = (y + 0.5 - py) / 16, di = (a + b) / 2, dj = (b - a) / 2, u = di * G.DU[0] + dj * G.DU[1], v = di * G.DV[0] + dj * G.DV[1], d = G.sdfC(u, v, CH), q = y * W + x; D[q] = d; if (d < 0) { I[q] = 1; const t = Math.min(1, -d / 1.05); HG[q] = Math.sqrt(1 - (1 - t) * (1 - t)); } }
    const img = new ImageData(W, Hh), o = img.data;
    for (let y = 1; y < Hh - 1; y++) for (let x = 1; x < W - 1; x++) { const q = y * W + x; if (!I[q]) continue;
      const a = (x + 0.5 - ox) / 32, b = (y + 0.5 - py) / 16, di = (a + b) / 2, dj = (b - a) / 2, u = di * G.DU[0] + dj * G.DU[1], v = di * G.DV[0] + dj * G.DV[1], d = D[q];
      const gx = (HG[q + 1] - HG[q - 1]) * 0.5, gy = (HG[q + W] - HG[q - W]) * 0.5, lit = 0.62 + (-gx * 0.9 - gy * 1.1) * 34 + HG[q] * 0.3, n1 = vn(u * 1.3, v * 1.3, 1301), n2 = vn(u * 4, v * 4, 1302);
      let t = 0.9 + lit * 3.3 + (n1 - 0.5) * 0.7 + (n2 - 0.5) * 0.3, c = null, gold = 0;
      // which digit (if any) owns this pixel: the one whose capsule is deepest here and deeper than the palm itself
      let best = -1, bd = 9, bt = 0; for (let k = 0; k < CH.length; k++) { const ch = CH[k]; let off = 0; for (let s2 = 0; s2 < 3; s2++) { const e = G.rcone(u, v, ch.pts[s2][0], ch.pts[s2][1], ch.pts[s2 + 1][0], ch.pts[s2 + 1][1], ch.rs[s2], ch.rs[s2 + 1]); if (e < bd) { const px = u - ch.pts[s2][0], py2 = v - ch.pts[s2][1], bx = ch.pts[s2 + 1][0] - ch.pts[s2][0], by = ch.pts[s2 + 1][1] - ch.pts[s2][1], h = Math.max(0, Math.min(1, (px * bx + py2 * by) / (bx * bx + by * by))); bd = e; best = k; bt = off + h * ch.ls[s2]; } off += ch.ls[s2]; } }
      const nar = 1 - 0.2 * Math.max(0, Math.min(1, -u / 5.5)), palmQ = (Math.pow(Math.abs(u / 5.6), 3) + Math.pow(Math.abs(v / (6.2 * nar)), 3)) ** (1 / 3), dpalm = (palmQ - 1) * 4.6;
      const onDigit = best >= 0 && bd < dpalm - 0.05 && !(u < 4.2 && best < 4 && bd > -0.2);
      if (onDigit) { const dg = G.DIGITS[best], rr = Math.max(0.3, -bd); if (bt > 0.9) { c = tone(NAIL, 2.4 + lit * 1.6 + (n1 - 0.5)); }
        else for (const jt of [0.42, 0.75]) { const dd = Math.abs(bt - jt) * dg.L; if (dd < 0.14) { gold = 1; t -= 0.9; } else if (dd < 0.3) t -= 0.35; if (dd < 0.5 && Math.abs(v - (CH[best].pts[1][1])) < 5 && rr > 0.9 && dd < 0.06) gold = 2; } }
      else { // the palm: gold lines, the seal ring, a faint inlay border
        const ld = lineD(u, v); if (ld < 0.12) gold = 1; else if (ld < 0.22) t -= 0.35; const rg = Math.hypot(u - 0.2, v - 0.3), rd = Math.abs(rg - 3.4); if (rd < 0.07) gold = 1; else if (rd < 0.15) t -= 0.25; if (Math.abs(rg - 4.9) < 0.05 && ((Math.atan2(v - 0.3, u - 0.2) * 6 / 3.1416 + 12) % 1) < 0.5) gold = 1; }
      if (!c) c = tone(STN, t); if (gold) { const gv = 0.78 + 0.22 * n1; c = [255 * gv, (200 + 28 * n1) * gv, (70 + 40 * n2) * gv]; }
      if (d > -0.11) { c = [c[0] * 0.66, c[1] * 0.58, c[2] * 0.5]; } else if (d > -0.24 && lit > 0.8) c = [Math.min(255, c[0] * 1.06 + 8), Math.min(255, c[1] * 1.06 + 8), Math.min(255, c[2] * 1.06 + 4)];
      o[q * 4] = c[0]; o[q * 4 + 1] = c[1]; o[q * 4 + 2] = c[2]; o[q * 4 + 3] = 255; }
    // the slab's side: THK pixels of carved ivory under every edge (lit from the upper left)
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const q = y * W + x; if (I[q]) continue; let tt = 0; for (let k = 1; k <= THK; k++) { if (y - k >= 0 && I[(y - k) * W + x]) { tt = k; break; } } if (!tt) continue;
      const top = (y - tt) * W + x, side = (x < ox ? 0.35 : -0.15) + HG[top] * 0, n = vn(x * 0.07, y * 0.3, 1303), band = (tt >= 9 && tt <= 10), tn = 1.7 + side + (1 - tt / THK) * 0.9 + (n - 0.5) * 0.6 - (band ? 0.6 : 0);
      let c = tone(WAL, tn); if (band && ((x >> 3) % 3) === 0) c = [236, 190, 70]; if (tt === 1) c = [c[0] * 0.7, c[1] * 0.64, c[2] * 0.56]; const fade = tt > THK - 3 ? 0.55 : 1; o[q * 4] = c[0] * fade; o[q * 4 + 1] = c[1] * fade; o[q * 4 + 2] = c[2] * fade; o[q * 4 + 3] = tt > THK - 2 ? 180 : 255; }
    const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; cv.getContext('2d').putImageData(img, 0, 0); return { cv, ox, py, w: W, h: Hh };
  }
  const handCache = {};
  const handFrame = idx => { if (!handCache[idx]) handCache[idx] = paintHand([1, 0.74, 0.5][idx]); return handCache[idx]; };
  const prevSprite2 = A.ext.sprite;
  A.ext.sprite = p => {
    if (p.kind === 'palmhand') { const f0 = handFrame(0); return { w: f0.w, h: f0.h, ox: f0.ox, py: f0.py, frames: [f0.cv], flat: true, glow: null, pick: () => { const f = st(), cl = f ? Math.max(f.beams, f.column * 0.9, f.boundVis * 0.6) : 0, idx = cl > 0.66 ? 2 : cl > 0.25 ? 1 : 0; return handFrame(idx).cv; } }; }
    return prevSprite2 ? prevSprite2(p) : null;
  };
  // ---------------------------------------------------------------- the old somersault cloud
  const old = window.TWFX.palm || {}; const drawRide = old.drawRide;
  // ---------------------------------------------------------------- cranes, lotus blooms, halo (depth sorted)
  function crane(g, x, y, t, ph, face, mode) {
    if (mode === 2) { const fl = Math.sin(t * 3.4 + ph), up = fl > 0 ? 3 : -2; px(g, x - 5, y, 11, 3, '#fffdf4'); px(g, x + 5 * face, y - 1, 3, 2, '#fffdf4'); px(g, x + 8 * face, y - 1, 2, 1, '#d83030'); px(g, x - 16, y + up - 3, 11, 2, '#fff'); px(g, x + 5, y + up - 3, 11, 2, '#fff'); px(g, x - 20, y + up - 1, 4, 1, '#222'); px(g, x + 16, y + up - 1, 4, 1, '#222'); px(g, x - 7 * face, y + 3, 5, 1, '#222'); return; }
    g.fillStyle = 'rgba(80,90,120,0.25)'; g.fillRect(Math.round(x - 6), Math.round(y - 1), 12, 3); px(g, x - 1, y - 9, 1, 9, '#5a4a4a'); px(g, x + 2, y - 9, 1, 9, '#5a4a4a'); px(g, x - 5, y - 15, 11, 7, '#fffdf6'); px(g, x - 6 * face, y - 13, 3, 3, '#2a2a2a'); const bob = mode === 1 ? 6 : Math.round(Math.sin(t * 1.2 + ph)), nx = x + 4 * face; px(g, nx, y - 22 + bob, 2, 7 - bob, '#fff'); px(g, nx + face, y - 24 + bob, 3, 3, '#fff'); px(g, nx + face * 3, y - 23 + bob, 3, 1, '#e0b040'); px(g, nx + face, y - 25 + bob, 2, 1, '#d83030'); }
  function lotus(g, X, Y, open, t, ph) { const n = 8, r = 5 + open * 6; for (let q = 0; q < n; q++) { const a = q / n * 6.2832 + ph, spread = 0.3 + open * 1.1, dx = Math.cos(a) * r * 0.9, dy = Math.sin(a) * r * 0.42, up = (1 - open) * 4 + 2; g.fillStyle = q & 1 ? '#ffd0dc' : '#fff0f4'; g.fillRect(Math.round(X + dx - 2), Math.round(Y + dy - up - spread * 2), 4, 3 + Math.round(open * 3)); } g.fillStyle = '#ffd84a'; g.fillRect(Math.round(X - 2), Math.round(Y - 5), 4, 3); if (open > 0.6) { g.globalCompositeOperation = 'lighter'; blob(g, X, Y - 4, 16, '255,230,160', 0.3 * open); g.globalCompositeOperation = 'source-over'; } }
  let cloudsReady = false, drift = [], puffs = [];
  function initClouds(R) { cloudsReady = true; if (/noclouds/.test(location.search)) return; const F = Fm(); for (const c of F.clouds) { const sp = A.sprite({ kind: c.kind, v: c.v }); if (!sp) continue; if (TWM.BIO[TWM.id(c.i, c.j)] === F.B) puffs.push({ c, sp }); } for (const d of F.drift) { const sp = A.sprite({ kind: d.kind, v: d.v }); if (sp) drift.push({ d, sp }); } }
  function drawables(D, R, x0, y0, W, Hh, sim) {
    const f = st(); if (!f) return; if (!cloudsReady) initClouds(R);
    for (const e of drift) { const d = e.d, sw = Math.sin(R.t * d.speed * 0.06 + (d.i * 0.37)) * 22, x = (d.i + 0.5) * T + sw * 0.5, y = (d.j + 0.5) * T - sw * 0.5, z = TWM.H[TWM.id(d.i, d.j)] * 4 + d.lift, X = Math.round(R.wx(x, y) - e.sp.w / 2), Y = Math.round(R.wy(x, y, z) - (e.sp.py || e.sp.h)); if (X > x0 + W || X + e.sp.w < x0 || Y > y0 + Hh || Y + e.sp.h < y0) continue; D.push([x + y - 26 + d.lift * 0.4, 5, { draw: g => { g.globalAlpha = 0.9; g.drawImage(e.sp.frames[0], X, Y); g.globalAlpha = 1; } }]); } const gg = geo(), b = gg.box; if (R.cx < b[0] - 500 || R.cx > b[2] + 500 || R.cy < b[1] - 500 || R.cy > b[3] + 600) return; const t = R.t, F = Fm();
    for (const [i, c] of F.fingers.entries()) { if (f.landings.length && i === f.landings[0].fing) continue; const x = (c.cx + 0.5) * T, y = (c.y0 + 0.5) * T, X = R.wx(x, y) + (i & 1 ? 4 : -4), Y = R.wy(x, y, ground(x, y)) + 3; if (!inView(R, X, Y, 40) || hash(i, 3, 1201) < 0.4) continue; D.push([x + y + 0.1, 5, { draw: g => crane(g, X, Y, t, i * 2.1, i & 1 ? -1 : 1, Math.floor((t + i * 5) / 7) % 3 === 0 ? 1 : 0) }]); }
    for (const L of f.landings) { const c = F.fingers[L.fing], u = L.t / L.dur; for (let q = 0; q < L.n; q++) { const a = t * 0.5 + q * 1.26, r = 46 + q * 6, cx = (c.cx + 0.5) * T, cy = (c.y0 + 0.5) * T, X = R.wx(cx, cy) + Math.cos(a) * r * (1 - sm(clamp(u * 6 - 5, 0, 1)) * 0.4), Y = R.wy(cx, cy, ground(cx, cy)) - 40 + Math.sin(a) * r * 0.4 - q * 4; if (!inView(R, X, Y, 60) || u > 1) continue; D.push([cx + cy + 6, 5, { draw: g => crane(g, X, Y, t, q * 1.7, Math.cos(a + 1.57) >= 0 ? 1 : -1, 2) }]); } }
    for (const [i, c] of F.lotuses.entries()) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, X = R.wx(x, y), Y = R.wy(x, y, ground(x, y)) + 2, op = clamp(f.lotus + Math.sin(t * 0.5 + i) * 0.12, 0, 1); if (inView(R, X, Y, 30)) D.push([x + y + 0.2, 5, { draw: g => lotus(g, X + 6, Y, op, t, i) }]); }
    { const [bx, by] = bud(), X = R.wx(bx, by), Y = R.wy(bx, by, ground(bx, by)); if (inView(R, X, Y, 360)) D.push([bx + by - 0.5, 5, { draw: g => { g.globalCompositeOperation = 'lighter'; const h = f.halo; blob(g, X, Y - 140, 200 + h * 70, '255,236,170', 0.18 + h * 0.28 + 0.04 * Math.sin(t * 1.4)); ring(g, X, Y - 150, 88 + h * 10, 88 + h * 10, `rgba(255,236,170,${0.3 + h * 0.4})`, 3); ring(g, X, Y - 150, 112 + h * 14, 112 + h * 14, `rgba(255,248,210,${0.15 + h * 0.25})`, 2); ring(g, X, Y - 150, 138 + Math.sin(t) * 3, 138 + Math.sin(t) * 3, `rgba(255,236,170,${0.08 + h * 0.15})`, 1); for (let q = 0; q < 12; q++) { const a = q * 0.5236 + t * 0.2; g.strokeStyle = `rgba(255,240,180,${0.1 + h * 0.2})`; g.lineWidth = 2; g.beginPath(); g.moveTo(X + Math.cos(a) * 100, Y - 150 + Math.sin(a) * 100); g.lineTo(X + Math.cos(a) * (150 + h * 40), Y - 150 + Math.sin(a) * (150 + h * 40)); g.stroke(); } g.globalCompositeOperation = 'source-over'; } }]); }
  }
  // ---------------------------------------------------------------- the palm: lines, rune ring, finger glow, beams, column
  function drawPalm(g, R, f, x0, y0, W, Hh) {
    const t = R.t, F = Fm(), [sx, sy] = sealXY(R, 0); if (!inView(R, sx, sy, 600)) return;
    g.globalCompositeOperation = 'lighter';
    // glow pooling on the palm, brightest when the inscription is up
    mist(g, sx, sy, 150, 66, 0.03 + 0.02 * Math.sin(t * 0.9) + f.inscr * 0.24 + f.runes * 0.1, '255,230,150');
    // the rune ring: two rings, rotating glyph ticks, radial runes
    const ir = Math.max(f.inscr, f.runes * 0.55, f.boundVis * 0.45); if (ir > 0.02) { const rot = t * 0.4; for (const [rx, ry, w, a] of [[4.2 * T * 2, 3.1 * T, 2, 0.8], [3.2 * T * 2, 2.4 * T, 1.5, 0.6], [5.4 * T * 2, 4 * T, 1, 0.45]]) ring(g, sx, sy + 2, rx * ir, ry * ir, `rgba(255,224,120,${a * ir})`, w);
      for (let q = 0; q < 36; q++) { const a = rot + q * 0.1745, r0 = 66 * ir, r1 = (q % 3 ? 74 : 80) * ir; g.strokeStyle = `rgba(255,236,150,${0.75 * ir})`; g.lineWidth = q % 3 ? 1 : 2; g.beginPath(); g.moveTo(sx + Math.cos(a) * r0, sy + 2 + Math.sin(a) * r0 * 0.46); g.lineTo(sx + Math.cos(a) * r1, sy + 2 + Math.sin(a) * r1 * 0.46); g.stroke(); }
      g.strokeStyle = `rgba(160,220,255,${0.6 * ir})`; g.lineWidth = 1.5; g.beginPath(); for (let q = 0; q <= 5; q++) { const a = -rot * 0.7 + q * 2.513, X = sx + Math.cos(a) * 44 * ir, Y = sy + 2 + Math.sin(a) * 44 * 0.46 * ir; q ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke(); }
    // the five fingers: pulsing glow along the pillar and a halo on the nail cap
    for (let k = 0; k < 5; k++) { const gl = f.glow[k], c = F.fingers[k], x = c.base[0] * T, y = c.base[1] * T, X = R.wx(x, y), Y = R.wy(x, y, ground(x, y)); if (!inView(R, X, Y, 200)) continue; const [tx, ty] = tip(R, k, 0);
      for (let q = 0; q < 8; q++) { const u = (t * 0.35 + q / 8 + k * 0.13) % 1; blob(g, X + (hash(q, k, 1210) - 0.5) * 18, Y - u * (tip(R, k, 0)[1] < Y ? Y - ty + 16 : 60), 8 + gl * 7, '255,226,140', (1 - u) * (0.05 + gl * 0.34)); }
      blob(g, tx, ty - 10, 46 + gl * 30, '255,236,170', 0.12 + gl * 0.4); ring(g, tx, ty + 4, 18 + gl * 6, 7 + gl * 3, `rgba(255,240,190,${0.15 + gl * 0.6})`, 1.5);
      if (f.beams > 0.02) { const b = f.beams; const ex = sx, ey = sy - 20; g.strokeStyle = `rgba(255,226,120,${0.8 * b})`; g.lineWidth = 3 + gl * 2; g.beginPath(); for (let s = 0; s <= 16; s++) { const u = s / 16 * b, X2 = tx + (ex - tx) * u + Math.sin(u * 9 + t * 5 + k) * 5 * Math.sin(u * 3.14), Y2 = (ty - 8) + (ey - ty + 8) * u + Math.sin(u * 3.14) * -26; s ? g.lineTo(X2, Y2) : g.moveTo(X2, Y2); } g.stroke(); g.strokeStyle = `rgba(255,252,220,${0.6 * b})`; g.lineWidth = 1; g.stroke(); } }
    // the column of light at the seal and the pressure rings
    if (f.column > 0.02) { const c = f.column; const gr = g.createLinearGradient(0, sy - 420, 0, sy + 10); gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(0.5, `rgba(255,236,170,${0.4 * c})`); gr.addColorStop(1, `rgba(255,250,220,${0.7 * c})`); g.fillStyle = gr; g.fillRect(sx - 26 - 10 * c, sy - 420, 52 + 20 * c, 430);
      for (let q = 0; q < 24; q++) { const u = (t * 0.5 + q / 24) % 1, a = q * 0.8 + t * 1.1; blob(g, sx + Math.cos(a) * (18 + u * 16), sy - u * 340, 6, '255,246,190', (1 - u) * 0.8 * c); } for (let q = 0; q < 3; q++) { const u = (t * 0.7 + q / 3) % 1; ring(g, sx, sy + 2, 14 + u * 70, 6 + u * 30, `rgba(255,236,150,${(1 - u) * 0.7 * c})`, 2); } }
    // Wukong's prison: a ring of light and chains while he is held
    if (f.boundVis > 0.02) { const v = f.boundVis; ring(g, sx, sy + 8, 30 + Math.sin(t * 3) * 1.5, 12, `rgba(255,214,100,${0.6 * v})`, 2); for (let q = 0; q < 8; q++) { const a = t * 0.6 + q * 0.785; blob(g, sx + Math.cos(a) * 30, sy + 8 + Math.sin(a) * 12, 5, '255,230,150', 0.5 * v); } blob(g, sx, sy - 6, 40, '255,220,120', 0.12 * v); }
    // shock bursts
    for (const bb of f.bursts) { const a = bb.t / 2.6, X = R.wx(bb.x, bb.y), Y = R.wy(bb.x, bb.y, ground(bb.x, bb.y)); if (a > 1 || !inView(R, X, Y, 400)) continue; if (bb.kind === 'shock') { for (let q = 0; q < 3; q++) { const e = clamp(a * 1.2 - q * 0.08, 0, 1); if (e > 0 && e < 1) ring(g, X, Y, 20 + e * 420, 8 + e * 180, `rgba(255,${240 - q * 30},${170 - q * 20},${(1 - e) * 0.8})`, 6 - q * 2); } blob(g, X, Y - 40, 140 * (1 - a * 0.5), '255,246,200', (1 - a) * 0.5); } else if (bb.kind === 'jade') { blob(g, X, Y - 20, 40 + a * 120, '170,230,255', (1 - a) * 0.5); ring(g, X, Y - 4, 10 + a * 140, 4 + a * 60, `rgba(190,240,255,${(1 - a) * 0.8})`, 3); } else { blob(g, X, Y - 16, 30 + a * 70, '255,224,130', (1 - a) * 0.6); ring(g, X, Y - 4, 8 + a * 80, 3 + a * 34, `rgba(255,236,160,${(1 - a) * 0.8})`, 2); } }
    // Wukong is never lost: while the story runs a soft gold aura follows him on top of everything (nothing can hide him)
    { const k = window.TWS && TWS.agents.find(a => a.biome === 'btp' && a.role === 'monkeyking' && !a.gone && !a.hidden), ph = window.TWS && TWS.biomes.btp.phase;
      if (k && (ph === 'sig' || ph === 'fore')) { const kx = R.wx(k.x, k.y), ky = R.wy(k.x, k.y, (k.gz || ground(k.x, k.y)) + (k.lift || 0)) - 14; if (inView(R, kx, ky, 80)) { blob(g, kx, ky, 46, '255,226,140', 0.22 + 0.08 * Math.sin(t * 5)); ring(g, kx, ky + 12, 16, 6, 'rgba(255,236,160,0.55)', 1); } } }
    // the mark Wukong left on the middle fingertip
    if (f.mark > 0.02) { const [tx, ty] = tip(R, 1, 0), m = f.mark; blob(g, tx, ty - 24, 70 * m + 20, '255,230,140', 0.4 * m); for (let q = 0; q < 3; q++) { g.strokeStyle = `rgba(255,236,160,${0.8 * m})`; g.lineWidth = 2; g.beginPath(); g.moveTo(tx - 14 + q * 4, ty - 44 - q * 8); g.lineTo(tx + 14 - q * 2, ty - 44 - q * 8); g.stroke(); } ring(g, tx, ty + 2, 22 + Math.sin(t * 3) * 2, 9, `rgba(255,236,160,${0.7 * m})`, 2); for (let q = 0; q < 10; q++) { const u = (t * 0.6 + q / 10) % 1; blob(g, tx + Math.cos(q * 2.1) * 14, ty - 10 - u * 60, 4, '255,246,190', (1 - u) * 0.8 * m); } }
    g.globalCompositeOperation = 'source-over';
  }
  // ---------------------------------------------------------------- sky, clouds, petals, light, birds
  function drawSky(g, R, f, x0, y0, W, Hh) {
    if (!Fm().seam) Fm().seam = [];
    for (const e of puffs) { const c = e.c, sw = Math.sin(R.t * 0.12 + c.i * 0.9 + c.j) * 3, x = (c.i + 0.5) * T + sw, y = (c.j + 0.5) * T, z = TWM.H[TWM.id(c.i, c.j)] * 4 + c.lift, X = Math.round(R.wx(x, y) - e.sp.w / 2), Y = Math.round(R.wy(x, y, z) - (e.sp.py || e.sp.h) + Math.sin(R.t * 0.3 + c.i) * 1.5); if (X > x0 + W || X + e.sp.w < x0 || Y > y0 + Hh || Y + e.sp.h < y0) continue; g.globalAlpha = 0.86; g.drawImage(e.sp.frames[0], X, Y); g.globalAlpha = 1; }
    const t = R.t, b = geo().box, F = Fm(), [sx, sy] = sealXY(R, 0), cover = f.cover, wind = f.wind;
    // wisps over the palm: dense before the reveal, gone when parted
    if (inView(R, sx, sy, 500)) for (let q = 0; q < 26; q++) { const u = hash(q, 1, 1220), v = hash(q, 2, 1220), sp = (4 + v * 6) * (0.6 + wind * 0.6), X = sx - 260 + ((u * 520 + t * sp) % 520), Y = sy - 30 + (v - 0.5) * 120 + Math.sin(t * 0.3 + q) * 6, r = 60 + hash(q, 3, 1220) * 60; mist(g, X, Y, r, r * 0.3, 0.3 * cover * (0.6 + v * 0.5), '252,254,255'); mist(g, X + r * 0.4, Y - 6, r * 0.7, r * 0.22, 0.26 * cover, '255,255,255'); }
    // cloud banks sliding past the finger bases, below the rim, and far banks
    for (let q = 0; q < 30; q++) { const lay = q % 5, u = ((t * (2.4 + lay * 2) + q * 190 + hash(q, 1, 1221) * 300) % ((b[2] - b[0]) + 700)), X = b[0] - 350 + u, Y = b[1] + 300 + lay * 70 + (q * 37 % 150) + Math.sin(t * 0.12 + q) * 8; if (X < x0 - 260 || X > x0 + W + 260 || Y < y0 - 120 || Y > y0 + Hh + 120) continue; const rr = 90 + hash(q, 2, 1221) * 70; mist(g, X, Y, rr, rr * 0.3, 0.4 + lay * 0.04, '255,255,255'); mist(g, X + rr * 0.5, Y - 8, rr * 0.7, rr * 0.22, 0.34, '250,252,255'); mist(g, X - rr * 0.45, Y - 4, rr * 0.6, rr * 0.2, 0.3, '240,248,255'); }
    // golden light shafts falling onto the palm
    if (inView(R, sx, sy, 400)) for (let q = 0; q < 5; q++) { const X = sx - 130 + q * 62 + Math.sin(t * 0.17 + q) * 12, gr = g.createLinearGradient(X, sy - 330, X + 60, sy + 10); gr.addColorStop(0, 'rgba(255,244,200,0.18)'); gr.addColorStop(1, 'rgba(255,244,200,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(X, sy - 330); g.lineTo(X + 28, sy - 330); g.lineTo(X + 90, sy + 10); g.lineTo(X + 50, sy + 10); g.fill(); }
    // sparkling gold dust and lotus petals
    const boost = 1 + f.petalBoost * 2.4; g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 70; q++) { const u = hash(q, 1, 1222), v = hash(q, 2, 1222), X = x0 + ((u * W + t * 5) % W), Y = y0 + ((v * Hh - t * 7 + Hh * 4) % Hh); g.fillStyle = `rgba(255,240,180,${0.25 + 0.4 * Math.max(0, Math.sin(t * 1.3 + q))})`; g.fillRect(Math.round(X), Math.round(Y), 1 + (q % 9 === 0 ? 1 : 0), 1); } g.globalCompositeOperation = 'source-over';
    for (let q = 0; q < 70 * boost; q++) { const u = hash(q, 1, 1223), v = hash(q, 2, 1223), X = x0 + ((u * (W + 400) + t * (7 + wind * 7) * (1 + v)) % (W + 400)) - 200 + Math.sin(t * (0.8 + v) + q) * 10, Y = y0 + ((v * (Hh + 200) + t * (11 + v * 12)) % (Hh + 200)) - 100; if (!inView(R, X, Y, 4)) continue; g.fillStyle = q % 3 ? '#ffd8e4' : '#fffaf0'; g.fillRect(Math.round(X), Math.round(Y), 2, 1); if (q % 4 === 0) g.fillRect(Math.round(X) + 1, Math.round(Y) - 1, 1, 1); }
    // dust gathering into a ring and dissolving (mini event)
    if (f.dust > 0.02) { const d = f.dust; for (let q = 0; q < 40; q++) { const a = q * 0.157 + t * 0.7, r = (90 - 60 * d) + Math.sin(t * 2 + q) * 3; blob(g, sx + Math.cos(a) * r * 1.6, sy + 2 + Math.sin(a) * r * 0.6, 4, '255,240,180', 0.8 * d); } }
    // distant thunder in the sea of clouds
    if (f.flash > 0.03) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(230,240,255,${f.flash * 0.22})`; g.fillRect(x0, y0, W, Hh); g.globalCompositeOperation = 'source-over'; }
    if (f.thunder > 0.1) for (let q = 0; q < 3; q++) { const X = x0 + hash(q, 1, 1224) * W, Y = y0 + 40 + hash(q, 2, 1224) * 120; g.globalCompositeOperation = 'lighter'; blob(g, X, Y, 90, '210,226,255', f.thunder * 0.3); g.globalCompositeOperation = 'source-over'; }
    // heavenly mist curtain along every border with a neighbouring biome (hides the seam; drifts)
    for (const [n, c] of F.seam.entries()) { const x = (c[0] + 0.5 + c[2] * 1.6) * T, y = (c[1] + 0.5 + c[3] * 1.6) * T, X = R.wx(x, y) + Math.sin(t * 0.25 + n) * 14, Y = R.wy(x, y, ground(x, y)) - 6 + Math.sin(t * 0.18 + n * 1.7) * 4; if (!inView(R, X, Y, 90)) continue; const r = 34 + hash(n, 1, 1230) * 30; mist(g, X, Y, r, r * 0.42, 0.34 + 0.12 * Math.sin(t * 0.4 + n), '250,252,255'); mist(g, X + 10, Y - 12, r * 0.7, r * 0.3, 0.26, '255,250,235'); }
    // fine sacred rays at night: stars in the sky sea come from the night grade; here faint twinkles over the cloud sea
    if ((R.dark || 0) > 0.3) for (let q = 0; q < 60; q++) { const X = x0 + hash(q, 1, 1225) * W, Y = y0 + hash(q, 2, 1225) * Hh, a = Math.pow(Math.max(0, Math.sin(t * 1.6 + q * 2.3)), 4) * (R.dark || 0); if (a < 0.1) continue; g.fillStyle = `rgba(255,250,220,${a})`; g.fillRect(Math.round(X), Math.round(Y), 2, 2); g.fillRect(Math.round(X) - 1, Math.round(Y) + 0.5, 4, 1); }
  }
  function bird(g, X, Y, t, ph, c) { const up = Math.sin(t * 9 + ph) > 0 ? 2 : -1; px(g, X - 1, Y, 3, 2, c); px(g, X - 5, Y + up - 1, 4, 1, c); px(g, X + 2, Y + up - 1, 4, 1, c); }
  function drawBirds(g, R, f, x0, y0, W, Hh) {
    const t = R.t, b = geo().box; for (let q = 0; q < 6; q++) { const u = ((t * (13 + q * 3) + q * 380) % (b[2] - b[0] + 600)), X = b[0] - 300 + u, Y = b[1] + 260 + q * 46 + Math.sin(t * 0.7 + q) * 12; if (inView(R, X, Y, 20)) bird(g, X, Y, t, q, q & 1 ? '#fffdf6' : '#f2ead8'); }
    for (let q = 0; q < 3; q++) { const u = ((t * 8 + q * 700) % (b[2] - b[0] + 500)), X = b[2] + 150 - u, Y = b[1] + 300 + q * 70 + Math.sin(t * 0.3 + q) * 18 - u * 0.08; if (inView(R, X, Y, 20)) crane(g, X, Y, t, q * 3, -1, 2); }
    for (const q of f.flocks) { if (q.t < 0) continue; const X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, 0) - (q.z || 30) - q.t * 4; if (!inView(R, X, Y, 20)) continue; if (q.kind === 'crane') crane(g, X, Y, t, q.ph, 1, 2); else bird(g, X, Y, t, q.ph, '#fffdf6'); }
    // butterflies of light over the palm
    const [sx, sy] = sealXY(R, 0); if (inView(R, sx, sy, 300)) for (let q = 0; q < 10; q++) { const a = t * (0.3 + q * 0.04) + q * 1.4, X = sx + Math.cos(a) * (60 + q * 9), Y = sy - 20 + Math.sin(a * 1.3) * 26 - Math.abs(Math.sin(t * 0.9 + q)) * 12, fl = Math.sin(t * 14 + q * 3) > 0 ? 2 : 1; g.globalCompositeOperation = 'lighter'; blob(g, X, Y, 8, '255,236,170', 0.35); g.globalCompositeOperation = 'source-over'; px(g, X - fl, Y, fl, 2, '#fff8e0'); px(g, X + 1, Y, fl, 2, '#fff8e0'); }
  }
  function drawCaption(g, R, f, x0, y0, W, Hh) {
    if (!f.caption) return; const left = f.capT - S_t(); if (left <= 0) return; const b = geo().box; if (R.cx < b[0] - 500 || R.cx > b[2] + 500 || R.cy < b[1] - 300 || R.cy > b[3] + 500) return;
    const a = clamp(Math.min(left, 1.2), 0, 1); g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.font = 'bold 18px "Segoe UI", "Noto Sans", Arial, sans-serif'; const w = Math.max(g.measureText(f.caption[0]).width, 260) + 44, X = x0 + W / 2, Y = y0 + Hh * 0.16;
    g.fillStyle = 'rgba(40,36,70,0.6)'; g.fillRect(Math.round(X - w / 2), Math.round(Y - 22), Math.round(w), 46); g.strokeStyle = 'rgba(255,226,140,0.8)'; g.strokeRect(Math.round(X - w / 2) + 0.5, Math.round(Y - 22) + 0.5, Math.round(w) - 1, 45);
    g.fillStyle = '#fff6d8'; g.fillText(f.caption[0], X, Y); g.font = '12px "Segoe UI", "Noto Sans", Arial, sans-serif'; g.fillStyle = '#e8dcb8'; g.fillText(f.caption[1], X, Y + 16); g.restore();
  }
  function camera(R, f) {
    if (!window.TWS) return; const ph = TWS.biomes.btp.phase; if (!(ph === 'sig' || ph === 'after')) return; if (R.t - (R.userT || -99) < 7) return; const b = geo().box; if (R.cx < b[0] - 200 || R.cx > b[2] + 200 || R.cy < b[1] - 200 || R.cy > b[3] + 300) return;
    let xy = f.focus && f.focusT > S_t() ? f.focus : null; const k = TWS.agents.find(a => a.biome === 'btp' && a.role === 'monkeyking' && !a.gone && !a.hidden); if (!xy && k) xy = [k.x, k.y]; if (!xy) return; let X = R.wx(xy[0], xy[1]), Y = R.wy(xy[0], xy[1], ground(xy[0], xy[1])) - 40;
    if (k && (k.lift || 0) > 40 && f.columnT !== 1) { X = (X + R.wx(k.x, k.y)) / 2; Y = (Y + R.wy(k.x, k.y, k.gz + k.lift)) / 2; } const e = 1 - Math.exp(-1.4 * 0.016); R.cx += (X - R.cx) * e; R.cy += (Y - R.cy) * e; if (R.clamp) R.clamp();
  }
  function draw(g, S, R, x0, y0, W, Hh) {
    const f = st(); if (!f) return; const b = geo().box; if (x0 + W < b[0] - 400 || x0 > b[2] + 400 || y0 + Hh < b[1] - 400 || y0 > b[3] + 500) return;
    drawSky(g, R, f, x0, y0, W, Hh); drawPalm(g, R, f, x0, y0, W, Hh); drawBirds(g, R, f, x0, y0, W, Hh); drawCaption(g, R, f, x0, y0, W, Hh); camera(R, f);
  }
  function light(g, S, R, amt) {
    const f = st(); if (!f || amt < 0.05) return; const b = geo().box, F = Fm(); if (R.cx < b[0] - 600 || R.cx > b[2] + 600 || R.cy < b[1] - 500 || R.cy > b[3] + 600) return; const t = R.t;
    const [sx, sy] = sealXY(R, 0); blob(g, sx, sy, 190, '255,226,150', (0.22 + f.inscr * 0.3 + f.boundVis * 0.15) * amt); for (let k = 0; k < 5; k++) { const [tx, ty] = tip(R, k, 0); blob(g, tx, ty - 10, 70, '255,232,160', (0.2 + f.glow[k] * 0.4) * amt); }
    const [bx, by] = bud(), BX = R.wx(bx, by), BY = R.wy(bx, by, ground(bx, by)) - 110; blob(g, BX, BY, 260, '255,236,170', (0.32 + f.halo * 0.3) * amt);
    for (const l of F.lamps) { const x = (l[0] + 0.5) * T, y = (l[1] + 0.5) * T, X = R.wx(x, y), Y = R.wy(x, y, ground(x, y)) - 16; if (inView(R, X, Y, 60)) blob(g, X, Y, 44, '255,226,150', (0.24 + f.lamp * 0.2) * amt * (0.85 + 0.15 * Math.sin(t * 6 + l[0]))); }
    for (const c of F.lotuses) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, X = R.wx(x, y), Y = R.wy(x, y, ground(x, y)); if (inView(R, X, Y, 60)) blob(g, X, Y - 6, 40, '255,210,225', 0.18 * amt * f.lotus); }
    if (f.column > 0.05) blob(g, sx, sy - 100, 160, '255,244,190', 0.4 * amt * f.column);
  }
  window.TWFX.palm = { draw, light, drawables, drawRide };
})();
