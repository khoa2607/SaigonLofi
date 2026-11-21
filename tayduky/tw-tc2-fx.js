'use strict';
// ===== Tây Du Ký — Thiên Cung rework: living effects (render-only; reads TWS.tc2) =====
// The Eight-Trigram Furnace (flames, trigram ring, talismans, smoke, the flying lid, heat shimmer, black cloud), shock waves and ember bursts, cranes and birds, falling peaches, a rainbow, cloud banks over the gate,
// wind-blown petals, silk banners on poles, brazier flames, lantern pulses, thunder flashes, screen shake, caption and the story camera.
window.TWFX = window.TWFX || {};
(function () {
  const A = TWA, T = 8, F = () => TWM.tc2, st = () => (window.TWS && TWS.tc2) || null, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), hash = (a, b, c) => TWM.hash2(a, b, c), ground = (x, y) => TWM.groundZ(x, y);
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const inView = (R, x, y, m) => { const x0 = R.cx - R.cv.width / 2 - m, y0 = R.cy - R.cv.height / 2 - m; return x > x0 && x < x0 + R.cv.width + 2 * m && y > y0 && y < y0 + R.cv.height + 2 * m; };
  function blob(g, x, y, r, rgb, a) { if (a <= 0.003) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  const mist = (g, x, y, rx, ry, a, rgb) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); blob(g, 0, 0, rx, rgb || '250,252,255', a); g.restore(); };
  const ring = (g, x, y, rx, ry, col, w) => { g.strokeStyle = col; g.lineWidth = w || 1; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.2832); g.stroke(); };
  let box = null; function geo() { if (box) return box; const N = TWM.N; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let k = 0; k < N * N; k++) if (TWM.BIO[k] === F().B && TWM.MAT[k] !== TWM.M.VOID) { const i = k % N, j = Math.floor(k / N), X = A.SX(i, j), Y = A.SY(i, j, TWM.H[k]); x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); } return box = [x0 - 200, y0 - 400, x1 + 200, y1 + 200]; }
  const near = R => { const b = geo(); return R.cx > b[0] - 500 && R.cx < b[2] + 500 && R.cy > b[1] - 400 && R.cy < b[3] + 500; };
  const furn = () => { const p = TWM.pois.find(q => q.biome === 'tc' && q.kind === 'furnace'); return p ? [p.x, p.y] : [36.5 * T, 14 * T]; };
  const scr = (R, x, y, dz) => [R.wx(x, y), R.wy(x, y, ground(x, y) + (dz || 0))];
  function crane(g, x, y, t, ph, face) { const fl = Math.sin(t * 3.4 + ph), up = fl > 0 ? 3 : -2; px(g, x - 5, y, 11, 3, '#fffdf4'); px(g, x + 5 * face, y - 1, 3, 2, '#fffdf4'); px(g, x + 8 * face, y - 1, 2, 1, '#d83030'); px(g, x - 16, y + up - 3, 11, 2, '#fff'); px(g, x + 5, y + up - 3, 11, 2, '#fff'); px(g, x - 20, y + up - 1, 4, 1, '#222'); px(g, x + 16, y + up - 1, 4, 1, '#222'); px(g, x - 7 * face, y + 3, 5, 1, '#222'); }
  function bird(g, X, Y, t, ph, c) { const up = Math.sin(t * 9 + ph) > 0 ? 2 : -1; px(g, X - 1, Y, 3, 2, c); px(g, X - 5, Y + up - 1, 4, 1, c); px(g, X + 2, Y + up - 1, 4, 1, c); }
  // ---------------------------------------------------------------- the landmarks drawn at twice the size: Nam Thiên Môn, the Eight-Trigram Furnace and the Linh Tiêu hall
  const prevSprite = A.ext && A.ext.sprite; A.ext = A.ext || {};
  A.ext.sprite = p => {
    const key = p.kind === 'tcgate' ? 'tc_monument_a' : p.kind === 'tcfurnace' ? 'tc_kiln_a' : p.kind === 'tcpalace' && p.big ? 'tc_palace_a' : null, im = key && A.IMG[key];
    if (!im) return prevSprite ? prevSprite(p) : null; const K = 2;
    return { w: im.w * K, h: im.h * K, py: im.py * K, frames: [im.im], em: null, glow: null, silk: null, flat: false, img: true, draw(g, s, f) { const sv = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(f, 0, 0, f.width, f.height, s.X, s.Y, f.width * K, f.height * K); g.imageSmoothingEnabled = sv; } };
  };
  // ---------------------------------------------------------------- depth-sorted: silk banners on poles and the flying lid
  function banner(g, X, Y, t, ph, col) { px(g, X, Y - 52, 2, 52, '#7a5a2a'); px(g, X - 1, Y - 54, 4, 3, '#e8c860'); for (let q = 0; q < 14; q++) { const w = Math.sin(t * 2.6 + ph + q * 0.5) * (1 + q * 0.25); g.fillStyle = col[q % 2 ? 0 : 1]; g.fillRect(Math.round(X + 2 + q), Math.round(Y - 50 + w), 1, 18 - (q > 9 ? q - 9 : 0)); } px(g, X + 2, Y - 50, 14, 1, '#e8c860'); }
  function drawables(D, R) {
    const f = st(), Fm = F(); if (!f || !Fm || !near(R)) return; const t = R.t;
    for (const [n, c] of Fm.flags.entries()) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, [X, Y] = scr(R, x, y); if (inView(R, X, Y, 60)) D.push([x + y + 0.2, 5, { draw: g => banner(g, X, Y, t, n * 1.7, n % 2 ? ['#d83a2a', '#f0c050'] : ['#2a9a8a', '#f0e8c0']) }]); }
    for (const [n, c] of Fm.fires.entries()) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, [X, Y] = scr(R, x, y, 10); if (!inView(R, X, Y, 40)) continue; D.push([x + y + 0.3, 5, { draw: g => { g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 5; q++) { const u = (t * 1.4 + q / 5 + n * 0.3) % 1; blob(g, X + Math.sin(t * 5 + q + n) * 2, Y - 8 - u * 22, 5 + (1 - u) * 4, q % 2 ? '255,150,50' : '255,220,110', (1 - u) * (0.5 + f.heat * 0.3)); } g.globalCompositeOperation = 'source-over'; } }]); }
    for (const d of f.debris) { const [X, Y] = [R.wx(d.x, d.y), R.wy(d.x, d.y, ground(d.x, d.y) + d.z / 4)]; if (!inView(R, X, Y, 20)) continue; D.push([d.x + d.y + 30, 5, { draw: g => { g.save(); g.translate(X, Y); g.rotate(d.r + d.t * 6); g.fillStyle = '#7a5a2a'; g.fillRect(-d.s, -d.s / 2, d.s * 2, d.s); g.fillStyle = '#e8c860'; g.fillRect(-d.s, -d.s / 2, d.s * 2, 1); g.restore(); if (d.t < 1.5) { g.globalCompositeOperation = 'lighter'; blob(g, X, Y, 8, '255,150,60', 0.4 * (1 - d.t / 1.5)); g.globalCompositeOperation = 'source-over'; } } }]); }
    if (f.lidFly) { const L = f.lidFly, [fx, fy] = furn(), u = L.t / 3, x = fx + u * 60, y = fy - u * 10, z = Math.sin(u * 3.14) * 180, [X, Y] = [R.wx(x, y), R.wy(x, y, ground(fx, fy) + z / 4) - 30]; D.push([x + y + 40, 5, { draw: g => { g.save(); g.translate(X, Y); g.rotate(u * 9); g.fillStyle = '#6a4a22'; g.beginPath(); g.ellipse(0, 0, 16, 7, 0, 0, 6.2832); g.fill(); g.strokeStyle = '#e8c860'; g.lineWidth = 2; g.stroke(); g.restore(); g.globalCompositeOperation = 'lighter'; blob(g, X, Y, 26, '255,170,70', 0.5 * (1 - u)); g.globalCompositeOperation = 'source-over'; } }]); }
    for (const q of f.peachfall) { if (q.t < 0) continue; const u = q.t / 3, z = (1 - u) * 90, [X, Y] = [R.wx(q.x, q.y), R.wy(q.x, q.y, ground(q.x, q.y) + z / 4)]; if (!inView(R, X, Y, 30)) continue; D.push([q.x + q.y + 3, 5, { draw: g => { g.globalCompositeOperation = 'lighter'; blob(g, X, Y, 14, '255,190,200', 0.45 * (1 - u * 0.5)); g.globalCompositeOperation = 'source-over'; px(g, X - 2, Y - 2, 5, 5, '#ffb0b8'); px(g, X - 1, Y - 3, 3, 1, '#ffe8ec'); px(g, X + 1, Y - 4, 2, 2, '#4a9a5a'); if (u > 0.92) ring(g, X, Y + 2, 8, 3, 'rgba(255,200,210,0.6)', 1); } }]); }
  }
  // ---------------------------------------------------------------- the furnace, bursts, smoke
  function drawFurnace(g, R, f) {
    const t = R.t, [fx, fy] = furn(), [X, Y0] = scr(R, fx, fy, 6); if (!inView(R, X, Y0, 500)) return; const h = f.heat, Y = Y0 - 6;
    g.globalCompositeOperation = 'lighter';
    blob(g, X, Y - 20, 90 + h * 90, '255,140,50', 0.12 + h * 0.34 + 0.04 * Math.sin(t * 7)); blob(g, X, Y - 40, 50 + h * 40, '255,210,120', 0.08 + h * 0.3);
    const nfl = 10 + Math.floor(h * 22), col = f.flameUp > 0.1;
    for (let q = 0; q < nfl; q++) { const u = (t * (0.9 + h * 0.8) + q / nfl) % 1, sw = Math.sin(t * 6 + q * 2) * (4 + u * 8), hh = 40 + h * 150 + f.flameUp * 140; blob(g, X + sw + (hash(q, 1, 1401) - 0.5) * 22, Y - 30 - u * hh, 7 + (1 - u) * (8 + h * 9), u < 0.5 ? '255,200,90' : '255,110,40', (1 - u) * (0.18 + h * 0.5)); }
    if (f.flameUp > 0.05 || h > 0.8) { const a = Math.max(f.flameUp, (h - 0.8) * 3), gr = g.createLinearGradient(0, Y - 380, 0, Y); gr.addColorStop(0, 'rgba(255,160,60,0)'); gr.addColorStop(0.6, `rgba(255,190,90,${0.35 * a})`); gr.addColorStop(1, `rgba(255,240,170,${0.6 * a})`); g.fillStyle = gr; g.fillRect(X - 24 - 10 * a, Y - 380, 48 + 20 * a, 380); }
    // the Eight-Trigram ring and talismans
    const r = f.runes; if (r > 0.02) { const rot = t * 0.7; for (const [rx, ry, w] of [[64, 26, 2], [88, 36, 1.5], [44, 18, 1]]) ring(g, X, Y0 + 6, rx * r, ry * r, `rgba(255,196,90,${0.8 * r})`, w);
      for (let q = 0; q < 8; q++) { const a = rot + q * 0.7854, x = X + Math.cos(a) * 76 * r, y = Y0 + 6 + Math.sin(a) * 31 * r; g.fillStyle = `rgba(255,224,130,${0.9 * r})`; for (let s = 0; s < 3; s++) { if ((q + s) % 3 === 0) g.fillRect(Math.round(x - 5), Math.round(y - 4 + s * 3), 4, 1), g.fillRect(Math.round(x + 1), Math.round(y - 4 + s * 3), 4, 1); else g.fillRect(Math.round(x - 5), Math.round(y - 4 + s * 3), 10, 1); } blob(g, x, y, 10, '255,200,100', 0.3 * r); }
      for (let q = 0; q < 6; q++) { const a = -rot * 1.3 + q * 1.047, u = (t * 0.5 + q / 6) % 1, x = X + Math.cos(a) * 40 * r, y = Y - u * 90; g.fillStyle = `rgba(255,236,150,${(1 - u) * 0.9 * r})`; g.fillRect(Math.round(x), Math.round(y), 3, 8); } }
    // cracks glowing through the bronze while the furnace shakes
    if (f.crack > 0.02) { g.strokeStyle = `rgba(255,${200 - f.crack * 40},90,${0.9 * f.crack})`; g.lineWidth = 2; for (let q = 0; q < 6; q++) { let cx = X + (q - 2.5) * 12, cy = Y - 60 - (q % 2) * 20; g.beginPath(); g.moveTo(cx, cy); for (let s2 = 0; s2 < 5; s2++) { cx += (hash(q, s2, 1420) - 0.5) * 14; cy += 10 + hash(q, s2, 1421) * 8; g.lineTo(cx, cy); } g.stroke(); } blob(g, X, Y - 70, 70, '255,170,70', 0.35 * f.crack); }
    // sparks
    const nsp = Math.floor(h * 26 + f.flameUp * 30); for (let q = 0; q < nsp; q++) { const u = (t * 0.8 + hash(q, 2, 1402)) % 1, a = hash(q, 3, 1402) * 6.28, d = u * (30 + 60 * hash(q, 4, 1402)); g.fillStyle = `rgba(255,${180 + (q % 4) * 15},80,${(1 - u) * 0.9})`; g.fillRect(Math.round(X + Math.cos(a) * d), Math.round(Y - 20 - u * (60 + 80 * hash(q, 5, 1402)) + Math.sin(a) * 6), 2, 2); }
    // heat shimmer rings
    if (h > 0.5) for (let q = 0; q < 3; q++) { const u = (t * 0.6 + q / 3) % 1; ring(g, X, Y0 - 10, 20 + u * 70, 8 + u * 28, `rgba(255,170,80,${(1 - u) * (h - 0.4) * 0.5})`, 1.5); }
    g.globalCompositeOperation = 'source-over';
    // smoke: dark puffs lifting away
    const ns = Math.floor(6 + h * 12 + f.storm * 8); for (let q = 0; q < ns; q++) { const u = (t * 0.22 + q / ns) % 1, x = X + Math.sin(t * 0.5 + q * 1.7) * (10 + u * 40) + u * 22, y = Y - 60 - u * 220, rr = 14 + u * 36; mist(g, x, y, rr, rr * 0.8, (1 - u) * (0.16 + h * 0.18 + f.storm * 0.15), q % 3 ? '70,60,66' : '120,100,96'); }
  }
  function drawBursts(g, R, f) {
    g.globalCompositeOperation = 'lighter';
    for (const b of f.bursts) { const a = b.t / 2.8, X = R.wx(b.x, b.y), Y = R.wy(b.x, b.y, ground(b.x, b.y)); if (a > 1 || !inView(R, X, Y, 400)) continue;
      if (b.kind === 'shock') { for (let q = 0; q < 3; q++) { const e = clamp(a * 1.25 - q * 0.08, 0, 1); if (e > 0 && e < 1) ring(g, X, Y, 20 + e * 440, 8 + e * 190, `rgba(255,${240 - q * 30},${170 - q * 25},${(1 - e) * 0.85})`, 6 - q * 2); } blob(g, X, Y - 40, 150 * (1 - a * 0.5), '255,236,190', (1 - a) * 0.55); }
      else if (b.kind === 'ember') { blob(g, X, Y - 20, 40 + a * 90, '255,150,60', (1 - a) * 0.55); for (let q = 0; q < 24; q++) { const an = q * 0.26 + b.t, d = a * (40 + (q % 5) * 14); g.fillStyle = `rgba(255,${150 + q * 4},70,${(1 - a)})`; g.fillRect(Math.round(X + Math.cos(an) * d), Math.round(Y - 20 + Math.sin(an) * d * 0.5 - a * 30), 3, 3); } }
      else { blob(g, X, Y - 16, 30 + a * 80, '255,224,130', (1 - a) * 0.6); ring(g, X, Y - 4, 8 + a * 100, 3 + a * 40, `rgba(255,236,160,${(1 - a) * 0.8})`, 2); } }
    g.globalCompositeOperation = 'source-over';
  }
  // ---------------------------------------------------------------- sky: storm, rainbow, cloud banks, petals, flocks, thunder
  function drawSky(g, R, f, x0, y0, W, Hh) {
    const t = R.t, b = geo(), [cx, cy] = scr(R, 27.5 * T, 21 * T);
    if (f.storm > 0.02) { g.fillStyle = `rgba(30,22,34,${f.storm * 0.34})`; g.fillRect(x0, y0, W, Hh); for (let q = 0; q < 9; q++) { const X = x0 + ((hash(q, 1, 1410) * (W + 400) + t * 14 * (0.4 + hash(q, 2, 1410))) % (W + 400)) - 200, Y = y0 + 20 + hash(q, 3, 1410) * Hh * 0.5; mist(g, X, Y, 150 + hash(q, 4, 1410) * 100, 46, f.storm * 0.5, '40,32,44'); } }
    if (f.rainbow > 0.02 && inView(R, cx, cy, 600)) { const cols = ['255,90,90', '255,170,70', '255,236,110', '120,220,120', '100,190,255', '160,130,255']; g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 6; q++) { g.strokeStyle = `rgba(${cols[q]},${0.22 * f.rainbow})`; g.lineWidth = 5; g.beginPath(); g.ellipse(cx + 80, cy + 120, 380 - q * 6, 250 - q * 4, 0, 3.4, 6.0); g.stroke(); } g.globalCompositeOperation = 'source-over'; for (let q = 0; q < 50; q++) { const X = cx - 260 + hash(q, 1, 1411) * 520, Y = cy - 220 + ((hash(q, 2, 1411) * 440 + t * 40) % 440); g.fillStyle = `rgba(210,230,255,${0.4 * f.rainbow})`; g.fillRect(Math.round(X), Math.round(Y), 1, 3); } }
    if (f.cloud > 0.02) for (let q = 0; q < 8; q++) { const u = ((t * (6 + q) + q * 260) % (b[2] - b[0] + 600)), X = b[0] - 300 + u, Y = b[1] + 420 + (q % 4) * 70; if (X < x0 - 200 || X > x0 + W + 200) continue; mist(g, X, Y, 150, 46, 0.5 * f.cloud, '255,255,255'); mist(g, X + 60, Y - 8, 100, 30, 0.4 * f.cloud, '245,250,255'); }
    // petals on the wind
    const boost = 1 + f.petalBoost * 3; for (let q = 0; q < 46 * boost; q++) { const u = hash(q, 1, 1412), v = hash(q, 2, 1412), X = x0 + ((u * (W + 300) + t * (10 + 10 * f.petalBoost) * (1 + v)) % (W + 300)) - 150 + Math.sin(t * (0.7 + v) + q) * 10, Y = y0 + ((v * (Hh + 160) + t * (9 + v * 10)) % (Hh + 160)) - 80; if (!inView(R, X, Y, 4)) continue; g.fillStyle = q % 3 ? '#ffc8d8' : '#fff0f4'; g.fillRect(Math.round(X), Math.round(Y), 2, 1); if (q % 4 === 0) g.fillRect(Math.round(X) + 1, Math.round(Y) - 1, 1, 1); }
    if (f.flash > 0.03) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,236,210,${Math.min(0.5, f.flash * 0.3)})`; g.fillRect(x0, y0, W, Hh); g.globalCompositeOperation = 'source-over'; }
  }
  function drawBirds(g, R, f, x0, y0, W, Hh) {
    const t = R.t, b = geo(); for (let q = 0; q < 5; q++) { const u = ((t * (12 + q * 3) + q * 400) % (b[2] - b[0] + 600)), X = b[0] - 300 + u, Y = b[1] + 300 + q * 60 + Math.sin(t * 0.7 + q) * 14; if (inView(R, X, Y, 20)) bird(g, X, Y, t, q, q & 1 ? '#fffdf6' : '#f2e8d8'); }
    for (let q = 0; q < 2; q++) { const u = ((t * 9 + q * 800) % (b[2] - b[0] + 500)), X = b[2] + 150 - u, Y = b[1] + 360 + q * 80 + Math.sin(t * 0.3 + q) * 18; if (inView(R, X, Y, 24)) crane(g, X, Y, t, q * 3, -1); }
    for (const q of f.flocks) { if (q.t < 0) continue; const X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, 0) - (q.z || 30) - q.t * 4; if (!inView(R, X, Y, 24)) continue; if (q.kind === 'crane') crane(g, X, Y, t, q.ph, q.vx >= 0 ? 1 : -1); else bird(g, X, Y, t, q.ph, '#fffdf6'); }
  }
  function drawCaption(g, R, f, x0, y0, W, Hh) {
    if (!f.caption) return; const left = f.capT - (window.TWS ? TWS.t : 0); if (left <= 0 || !near(R)) return; const a = clamp(Math.min(left, 1.2), 0, 1);
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.font = 'bold 18px "Segoe UI", "Noto Sans", Arial, sans-serif'; const w = Math.max(g.measureText(f.caption[0]).width, 260) + 44, X = x0 + W / 2, Y = y0 + Hh * 0.16;
    g.fillStyle = 'rgba(58,26,30,0.62)'; g.fillRect(Math.round(X - w / 2), Math.round(Y - 22), Math.round(w), 46); g.strokeStyle = 'rgba(255,214,120,0.85)'; g.strokeRect(Math.round(X - w / 2) + 0.5, Math.round(Y - 22) + 0.5, Math.round(w) - 1, 45);
    g.fillStyle = '#fff2d0'; g.fillText(f.caption[0], X, Y); g.font = '12px "Segoe UI", "Noto Sans", Arial, sans-serif'; g.fillStyle = '#ecd8a8'; g.fillText(f.caption[1], X, Y + 16); g.restore();
  }
  function camera(R, f) {
    if (!window.TWS || !near(R)) return; const ph = TWS.biomes.tc.phase; if (f.shake > 0.02) { R.cx += Math.sin(R.t * 63) * f.shake * 2.2; R.cy += Math.cos(R.t * 71) * f.shake * 1.8; }
    if (!(ph === 'sig') || R.t - (R.userT || -99) < 7) return; let xy = f.focus && f.focusT > TWS.t ? f.focus : null; const k = TWS.agents.find(a => a.biome === 'tc' && a.role === 'trickster' && !a.gone && !a.hidden); if (!xy && k) xy = [k.x, k.y]; if (!xy) return;
    let X = R.wx(xy[0], xy[1]), Y = R.wy(xy[0], xy[1], ground(xy[0], xy[1])) - 40; if (k && (k.lift || 0) > 30) { X = (X + R.wx(k.x, k.y)) / 2; Y = (Y + R.wy(k.x, k.y, k.gz + k.lift)) / 2; } const e = 1 - Math.exp(-1.6 * 0.016); R.cx += (X - R.cx) * e; R.cy += (Y - R.cy) * e; if (R.clamp) R.clamp();
  }
  function draw(g, S, R, x0, y0, W, Hh) {
    const f = st(); if (!f || !near(R)) return; drawSky(g, R, f, x0, y0, W, Hh); drawFurnace(g, R, f); drawBursts(g, R, f); drawBirds(g, R, f, x0, y0, W, Hh);
    const k = TWS.agents.find(a => a.biome === 'tc' && a.role === 'trickster' && !a.gone && !a.hidden), ph = TWS.biomes.tc.phase;   // a soft aura keeps Wukong readable during the signatures
    if (k && (ph === 'sig' || ph === 'fore')) { const kx = R.wx(k.x, k.y), ky = R.wy(k.x, k.y, (k.gz || ground(k.x, k.y)) + (k.lift || 0)) - 14; if (inView(R, kx, ky, 80)) { g.globalCompositeOperation = 'lighter'; blob(g, kx, ky, 44, '255,226,140', 0.2 + 0.07 * Math.sin(R.t * 5)); g.globalCompositeOperation = 'source-over'; } }
    drawCaption(g, R, f, x0, y0, W, Hh); camera(R, f);
  }
  function light(g, S, R, amt) {
    const f = st(), Fm = F(); if (!f || !Fm || amt < 0.05 || !near(R)) return; const t = R.t, [fx, fy] = furn(), [X, Y] = scr(R, fx, fy, 14);
    blob(g, X, Y, 150 + f.heat * 70, '255,150,60', (0.22 + f.heat * 0.4) * amt);
    for (const c of Fm.lamps) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, [LX, LY] = scr(R, x, y, 14); if (inView(R, LX, LY, 60)) blob(g, LX, LY, 46, '255,214,140', (0.22 + f.lampPulse * 0.4) * amt * (0.88 + 0.12 * Math.sin(t * 5 + c[0]))); }
    for (const c of Fm.fires) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, [LX, LY] = scr(R, x, y, 10); if (inView(R, LX, LY, 60)) blob(g, LX, LY, 52, '255,150,60', 0.3 * amt * (0.8 + 0.2 * Math.sin(t * 8 + c[1]))); }
  }
  window.TWFX.tc2 = { draw, light, drawables };
})();
