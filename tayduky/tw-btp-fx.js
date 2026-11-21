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
  const SX = (i, j) => i * T, SEAL = () => [74.5 * T, 53.5 * T];
  let G = null; function geo() { if (G) return G; const N = TWM.N, F = Fm(); G = { box: null }; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), h = TWM.H[k], X = A.SX(i, j), Y = A.SY(i, j, h); x0 = Math.min(x0, X - 32); x1 = Math.max(x1, X + 32); y0 = Math.min(y0, Y - 60); y1 = Math.max(y1, Y + 40); } G.box = [x0, y0 - 200, x1, y1]; return G; }
  const tip = (R, k, dz) => { const f = Fm().fingers[k], x = (f.cx + 0.5) * T, y = (f.y0 + 0.5) * T; return [R.wx(x, y), R.wy(x, y, ground(x, y) + (dz || 0))]; };
  const sealXY = (R, dz) => { const [x, y] = SEAL(); return [R.wx(x, y), R.wy(x, y, ground(x, y) + (dz || 0))]; };
  const bud = () => { const f = Fm(); return [(f.buddha[0] + 1.5) * T, (f.buddha[1] + 1.5) * T]; };
  // ---------------------------------------------------------------- the old somersault cloud
  const old = window.TWFX.palm || {}; const drawRide = old.drawRide;
  // ---------------------------------------------------------------- cranes, lotus blooms, halo (depth sorted)
  function crane(g, x, y, t, ph, face, mode) {
    if (mode === 2) { const fl = Math.sin(t * 3.4 + ph), up = fl > 0 ? 3 : -2; px(g, x - 5, y, 11, 3, '#fffdf4'); px(g, x + 5 * face, y - 1, 3, 2, '#fffdf4'); px(g, x + 8 * face, y - 1, 2, 1, '#d83030'); px(g, x - 16, y + up - 3, 11, 2, '#fff'); px(g, x + 5, y + up - 3, 11, 2, '#fff'); px(g, x - 20, y + up - 1, 4, 1, '#222'); px(g, x + 16, y + up - 1, 4, 1, '#222'); px(g, x - 7 * face, y + 3, 5, 1, '#222'); return; }
    g.fillStyle = 'rgba(80,90,120,0.25)'; g.fillRect(Math.round(x - 6), Math.round(y - 1), 12, 3); px(g, x - 1, y - 9, 1, 9, '#5a4a4a'); px(g, x + 2, y - 9, 1, 9, '#5a4a4a'); px(g, x - 5, y - 15, 11, 7, '#fffdf6'); px(g, x - 6 * face, y - 13, 3, 3, '#2a2a2a'); const bob = mode === 1 ? 6 : Math.round(Math.sin(t * 1.2 + ph)), nx = x + 4 * face; px(g, nx, y - 22 + bob, 2, 7 - bob, '#fff'); px(g, nx + face, y - 24 + bob, 3, 3, '#fff'); px(g, nx + face * 3, y - 23 + bob, 3, 1, '#e0b040'); px(g, nx + face, y - 25 + bob, 2, 1, '#d83030'); }
  function lotus(g, X, Y, open, t, ph) { const n = 8, r = 5 + open * 6; for (let q = 0; q < n; q++) { const a = q / n * 6.2832 + ph, spread = 0.3 + open * 1.1, dx = Math.cos(a) * r * 0.9, dy = Math.sin(a) * r * 0.42, up = (1 - open) * 4 + 2; g.fillStyle = q & 1 ? '#ffd0dc' : '#fff0f4'; g.fillRect(Math.round(X + dx - 2), Math.round(Y + dy - up - spread * 2), 4, 3 + Math.round(open * 3)); } g.fillStyle = '#ffd84a'; g.fillRect(Math.round(X - 2), Math.round(Y - 5), 4, 3); if (open > 0.6) { g.globalCompositeOperation = 'lighter'; blob(g, X, Y - 4, 16, '255,230,160', 0.3 * open); g.globalCompositeOperation = 'source-over'; } }
  function drawables(D, R, x0, y0, W, Hh, sim) {
    const f = st(); if (!f) return; const gg = geo(), b = gg.box; if (R.cx < b[0] - 500 || R.cx > b[2] + 500 || R.cy < b[1] - 500 || R.cy > b[3] + 600) return; const t = R.t, F = Fm();
    for (const [i, c] of F.fingers.entries()) { if (f.landings.length && i === f.landings[0].fing) continue; const x = (c.cx + 0.5) * T, y = (c.y0 + 0.5) * T, X = R.wx(x, y) + (i & 1 ? 4 : -4), Y = R.wy(x, y, ground(x, y)) + 3; if (!inView(R, X, Y, 40) || hash(i, 3, 1201) < 0.4) continue; D.push([x + y + 0.1, 5, { draw: g => crane(g, X, Y, t, i * 2.1, i & 1 ? -1 : 1, Math.floor((t + i * 5) / 7) % 3 === 0 ? 1 : 0) }]); }
    for (const L of f.landings) { const c = F.fingers[L.fing], u = L.t / L.dur; for (let q = 0; q < L.n; q++) { const a = t * 0.5 + q * 1.26, r = 46 + q * 6, cx = (c.cx + 0.5) * T, cy = (c.y0 + 0.5) * T, X = R.wx(cx, cy) + Math.cos(a) * r * (1 - sm(clamp(u * 6 - 5, 0, 1)) * 0.4), Y = R.wy(cx, cy, ground(cx, cy)) - 40 + Math.sin(a) * r * 0.4 - q * 4; if (!inView(R, X, Y, 60) || u > 1) continue; D.push([cx + cy + 6, 5, { draw: g => crane(g, X, Y, t, q * 1.7, Math.cos(a + 1.57) >= 0 ? 1 : -1, 2) }]); } }
    for (const [i, c] of F.lotuses.entries()) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, X = R.wx(x, y), Y = R.wy(x, y, ground(x, y)) + 2, op = clamp(f.lotus + Math.sin(t * 0.5 + i) * 0.12, 0, 1); if (inView(R, X, Y, 30)) D.push([x + y + 0.2, 5, { draw: g => lotus(g, X + 6, Y, op, t, i) }]); }
    { const [bx, by] = bud(), X = R.wx(bx, by), Y = R.wy(bx, by, ground(bx, by)); if (inView(R, X, Y, 200)) D.push([bx + by - 0.5, 5, { draw: g => { g.globalCompositeOperation = 'lighter'; const h = f.halo; blob(g, X, Y - 62, 100 + h * 40, '255,236,170', 0.18 + h * 0.28 + 0.04 * Math.sin(t * 1.4)); ring(g, X, Y - 70, 44 + h * 6, 44 + h * 6, `rgba(255,236,170,${0.25 + h * 0.4})`, 2); ring(g, X, Y - 70, 56 + h * 8, 56 + h * 8, `rgba(255,248,210,${0.12 + h * 0.25})`, 1); for (let q = 0; q < 12; q++) { const a = q * 0.5236 + t * 0.2; g.strokeStyle = `rgba(255,240,180,${0.1 + h * 0.2})`; g.lineWidth = 2; g.beginPath(); g.moveTo(X + Math.cos(a) * 50, Y - 70 + Math.sin(a) * 50); g.lineTo(X + Math.cos(a) * (76 + h * 20), Y - 70 + Math.sin(a) * (76 + h * 20)); g.stroke(); } g.globalCompositeOperation = 'source-over'; } }]); }
  }
  // ---------------------------------------------------------------- the palm: lines, rune ring, finger glow, beams, column
  function drawPalm(g, R, f, x0, y0, W, Hh) {
    const t = R.t, F = Fm(), [sx, sy] = sealXY(R, 0); if (!inView(R, sx, sy, 600)) return;
    g.globalCompositeOperation = 'lighter';
    // glow pooling on the palm, brightest when the inscription is up
    mist(g, sx, sy, 150, 66, 0.1 + 0.08 * Math.sin(t * 0.9) + f.inscr * 0.26 + f.runes * 0.1, '255,230,150');
    // the rune ring: two rings, rotating glyph ticks, radial runes
    const ir = Math.max(f.inscr, f.runes * 0.55, f.boundVis * 0.45); if (ir > 0.02) { const rot = t * 0.4; for (const [rx, ry, w, a] of [[4.2 * T * 2, 3.1 * T, 2, 0.8], [3.2 * T * 2, 2.4 * T, 1.5, 0.6], [5.4 * T * 2, 4 * T, 1, 0.45]]) ring(g, sx, sy + 2, rx * ir, ry * ir, `rgba(255,224,120,${a * ir})`, w);
      for (let q = 0; q < 36; q++) { const a = rot + q * 0.1745, r0 = 66 * ir, r1 = (q % 3 ? 74 : 80) * ir; g.strokeStyle = `rgba(255,236,150,${0.75 * ir})`; g.lineWidth = q % 3 ? 1 : 2; g.beginPath(); g.moveTo(sx + Math.cos(a) * r0, sy + 2 + Math.sin(a) * r0 * 0.46); g.lineTo(sx + Math.cos(a) * r1, sy + 2 + Math.sin(a) * r1 * 0.46); g.stroke(); }
      g.strokeStyle = `rgba(160,220,255,${0.6 * ir})`; g.lineWidth = 1.5; g.beginPath(); for (let q = 0; q <= 5; q++) { const a = -rot * 0.7 + q * 2.513, X = sx + Math.cos(a) * 44 * ir, Y = sy + 2 + Math.sin(a) * 44 * 0.46 * ir; q ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke(); }
    // the five fingers: pulsing glow along the pillar and a halo on the nail cap
    for (let k = 0; k < 5; k++) { const gl = f.glow[k], c = F.fingers[k], x = (c.cx + 0.5) * T, y = (c.y1 + 0.5) * T, X = R.wx(x, y), Y = R.wy(x, y, ground(x, y)); if (!inView(R, X, Y, 200)) continue; const [tx, ty] = tip(R, k, 0);
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
    g.globalCompositeOperation = 'source-over';
  }
  // ---------------------------------------------------------------- sky, clouds, petals, light, birds
  function drawSky(g, R, f, x0, y0, W, Hh) {
    const t = R.t, b = geo().box, F = Fm(), [sx, sy] = sealXY(R, 0), cover = f.cover, wind = f.wind;
    // wisps over the palm: dense before the reveal, gone when parted
    if (inView(R, sx, sy, 500)) for (let q = 0; q < 26; q++) { const u = hash(q, 1, 1220), v = hash(q, 2, 1220), sp = (4 + v * 6) * (0.6 + wind * 0.6), X = sx - 260 + ((u * 520 + t * sp) % 520), Y = sy - 30 + (v - 0.5) * 120 + Math.sin(t * 0.3 + q) * 6, r = 60 + hash(q, 3, 1220) * 60; mist(g, X, Y, r, r * 0.3, 0.3 * cover * (0.6 + v * 0.5), '252,254,255'); mist(g, X + r * 0.4, Y - 6, r * 0.7, r * 0.22, 0.26 * cover, '255,255,255'); }
    // cloud banks sliding past the finger bases, below the rim, and far banks
    for (let q = 0; q < 12; q++) { const lay = q % 3, u = ((t * (2.4 + lay * 2) + q * 190 + hash(q, 1, 1221) * 300) % ((b[2] - b[0]) + 700)), X = b[0] - 350 + u, Y = b[1] + 360 + lay * 90 + (q * 37 % 110) + Math.sin(t * 0.12 + q) * 8; if (X < x0 - 260 || X > x0 + W + 260 || Y < y0 - 120 || Y > y0 + Hh + 120) continue; const rr = 90 + hash(q, 2, 1221) * 70; mist(g, X, Y, rr, rr * 0.3, 0.4 + lay * 0.04, '255,255,255'); mist(g, X + rr * 0.5, Y - 8, rr * 0.7, rr * 0.22, 0.34, '250,252,255'); mist(g, X - rr * 0.45, Y - 4, rr * 0.6, rr * 0.2, 0.3, '240,248,255'); }
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
    const [bx, by] = bud(), BX = R.wx(bx, by), BY = R.wy(bx, by, ground(bx, by)) - 40; blob(g, BX, BY, 150, '255,236,170', (0.3 + f.halo * 0.3) * amt);
    for (const l of F.lamps) { const x = (l[0] + 0.5) * T, y = (l[1] + 0.5) * T, X = R.wx(x, y), Y = R.wy(x, y, ground(x, y)) - 16; if (inView(R, X, Y, 60)) blob(g, X, Y, 44, '255,226,150', (0.24 + f.lamp * 0.2) * amt * (0.85 + 0.15 * Math.sin(t * 6 + l[0]))); }
    for (const c of F.lotuses) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, X = R.wx(x, y), Y = R.wy(x, y, ground(x, y)); if (inView(R, X, Y, 60)) blob(g, X, Y - 6, 40, '255,210,225', 0.18 * amt * f.lotus); }
    if (f.column > 0.05) blob(g, sx, sy - 100, 160, '255,244,190', 0.4 * amt * f.column);
  }
  window.TWFX.palm = { draw, light, drawables, drawRide };
})();
