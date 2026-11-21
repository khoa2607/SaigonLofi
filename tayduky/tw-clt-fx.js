'use strict';
// ===== Tây Du Ký — Cao Lão Trang: living effects (render-only; reads TWS.clt) =====
// The Gao courtyard house at twice its size, chimney smoke, swaying rice (a harvested patch shows stubble and regrows), seedling rows, the water wheel (painted frames), the sluice (open: white flow, closed: dry bed), ducks and fish on the ponds,
// butterflies and dragonflies over the meadows, birds that land on the paddies, rain with puddle rings and the rainbow after, transformation / chase smoke, harvest grain and lantern glow, silk flags, night fireflies, caption and the story camera.
window.TWFX = window.TWFX || {};
(function () {
  const A = TWA, T = 8, F = () => TWM.clt, st = () => (window.TWS && TWS.clt) || null, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), hash = (a, b, c) => TWM.hash2(a, b, c), ground = (x, y) => TWM.groundZ(x, y), N = () => TWM.N;
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const inView = (R, x, y, m) => { const x0 = R.cx - R.cv.width / 2 - m, y0 = R.cy - R.cv.height / 2 - m; return x > x0 && x < x0 + R.cv.width + 2 * m && y > y0 && y < y0 + R.cv.height + 2 * m; };
  function blob(g, x, y, r, rgb, a) { if (a <= 0.003) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  const mist = (g, x, y, rx, ry, a, rgb) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); blob(g, 0, 0, rx, rgb || '250,252,255', a); g.restore(); };
  const ring = (g, x, y, rx, ry, col, w) => { g.strokeStyle = col; g.lineWidth = w || 1; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.2832); g.stroke(); };
  const scr = (R, x, y, dz) => [R.wx(x, y), R.wy(x, y, ground(x, y) + (dz || 0))];
  let box = null; function geo() { if (box) return box; const n = N(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const k of F().tiles) { const i = k % n, j = Math.floor(k / n), X = A.SX(i, j), Y = A.SY(i, j, TWM.H[k]); x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); } return box = [x0 - 200, y0 - 300, x1 + 200, y1 + 200]; }
  const inBox = R => { const b = geo(); return R.cx > b[0] + 160 && R.cx < b[2] - 160 && R.cy > b[1] + 280 && R.cy < b[3] - 200; };
  const near = R => { const b = geo(); return R.cx > b[0] - 500 && R.cx < b[2] + 500 && R.cy > b[1] - 400 && R.cy < b[3] + 500; };
  // ---------------------------------------------------------------- the Gao house at twice its size
  const prevSprite = A.ext && A.ext.sprite; A.ext = A.ext || {}; const K = 2;
  A.ext.sprite = p => {
    const key = p.kind === 'cltgao' ? ((p.v & 1) ? 'clt_gao_b' : 'clt_gao_a') : null, im = key && A.IMG[key];
    if (!im) return prevSprite ? prevSprite(p) : null;
    return { w: im.w * K, h: im.h * K, py: im.py * K, frames: [im.im], em: null, glow: null, silk: null, flat: false, img: true, draw(g, s, f) { const sv = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(f, 0, 0, f.width, f.height, s.X, s.Y, f.width * K, f.height * K); g.imageSmoothingEnabled = sv; } };
  };
  // ---------------------------------------------------------------- small drawings
  function bird(g, X, Y, t, ph, c, sit) { if (sit) { px(g, X - 1, Y, 4, 2, c); px(g, X + 3, Y - 1, 2, 2, c); px(g, X - 3, Y + 1, 2, 1, c); return; } const up = Math.sin(t * 10 + ph) > 0 ? 2 : -1; px(g, X - 1, Y, 3, 2, c); px(g, X - 5, Y + up - 1, 4, 1, c); px(g, X + 2, Y + up - 1, 4, 1, c); }
  function duckSpr(g, X, Y, t, ph, face) { const b = Math.round(Math.sin(t * 2 + ph)); px(g, X - 4, Y + b, 8, 4, '#f4ecd4'); px(g, X + 3 * face, Y - 2 + b, 4, 4, '#f4ecd4'); px(g, X + 6 * face - (face < 0 ? 2 : 0), Y - 1 + b, 3, 1, '#f0a030'); px(g, X - 3, Y + 1 + b, 4, 1, '#c8bca0'); px(g, X + 4 * face, Y - 1 + b, 1, 1, '#222'); }
  function stalk(g, X, Y, t, ph, col, h) { const sw = Math.sin(t * 2.1 + ph) * 1.5; for (let q = 0; q < 3; q++) { const dx = (q - 1) * 5, hh = h + (q & 1); px(g, X + dx + Math.round(sw * 0.4), Y - hh, 1, hh, col[0]); px(g, X + dx + Math.round(sw), Y - hh - 1, 2, 2, col[1]); } }
  function flag(g, X, Y, t, ph, c1, c2) { px(g, X, Y - 40, 2, 40, '#6e4c34'); for (let q = 0; q < 10; q++) { const w = Math.sin(t * 2.6 + ph + q * 0.55) * (0.8 + q * 0.22); g.fillStyle = q % 3 ? c1 : c2; g.fillRect(Math.round(X + 2 + q), Math.round(Y - 38 + w), 1, 12); } }
  const diamond = (g, X, Y, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(X, Y - 16); g.lineTo(X + 32, Y); g.lineTo(X, Y + 16); g.lineTo(X - 32, Y); g.closePath(); g.fill(); };
  // ---------------------------------------------------------------- depth-sorted things
  function drawables(D, R) {
    const f = st(), Fm = F(); if (!f || !Fm || !near(R)) return; const t = R.t, n = N();
    for (const [i, c] of Fm.flags.entries()) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, [X, Y] = scr(R, x, y); if (inView(R, X, Y, 50)) D.push([x + y + 0.2, 5, { draw: g => flag(g, X, Y, t, i * 1.7, '#d84a2a', '#f0c050') }]); }
    for (const [i, c] of Fm.chimneys.entries()) { const x = (c[0] + 0.8) * T, y = (c[1] + 0.4) * T, [X, Y] = scr(R, x, y, 28); if (!inView(R, X, Y, 80)) continue; D.push([x + y + 0.6, 5, { draw: g => { const lit = (R.dark || 0) > 0.25 || ((TWS.hour || 12) > 5 && (TWS.hour || 12) < 9) || ((TWS.hour || 12) > 16 && (TWS.hour || 12) < 19); if (!lit && i % 3) return; for (let q = 0; q < 6; q++) { const u = (t * 0.22 + q / 6 + i * 0.19) % 1, sw = Math.sin(t * 0.9 + q * 1.7 + i) * (2 + u * 7) + u * 6; mist(g, X + sw, Y - u * 52, 4 + u * 10, (4 + u * 10) * 0.8, (1 - u) * 0.34, '230,226,220'); } } }]); }
    // rice and seedlings: only the tiles in view; a harvested patch shows stubble
    const x0 = R.cx - R.cv.width / 2 - 40, y0 = R.cy - R.cv.height / 2 - 60, x1 = x0 + R.cv.width + 80, y1 = y0 + R.cv.height + 120;
    for (const [pi, pj, mat] of Fm.paddies) { const x = (pi + 0.5) * T, y = (pj + 0.5) * T, [X, Y] = scr(R, x, y, 1); if (X < x0 || X > x1 || Y < y0 || Y > y1) continue; const cutLine = f.cut > 0.05 && mat === TWM.M.CRICE && hash(pi, pj, 1870) < f.cut * 1.4 && (pi % 3 !== 1);
      D.push([x + y + 0.1, 5, { draw: g => { for (let q = 0; q < 3; q++) { const ox = (q - 1) * 14, oy = (q & 1) * 6 - 4, ph = pi * 0.7 + pj * 1.3 + q * 2; if (mat === TWM.M.CRICE) { if (cutLine) { px(g, X + ox, Y + oy - 1, 3, 2, '#b8962c'); px(g, X + ox - 5, Y + oy + 2, 3, 1, '#9a7a1c'); } else stalk(g, X + ox, Y + oy, t, ph, ['#d8b434', '#f6de68'], 9); } else stalk(g, X + ox, Y + oy, t, ph, ['#5a9a3a', '#8cc450'], 5); } } }]); }
    for (const [i, c] of Fm.hays.entries()) if (f.cut > 0.5) { const x = (c[0] + 1.3) * T, y = (c[1] + 0.5) * T, [X, Y] = scr(R, x, y); if (inView(R, X, Y, 20)) D.push([x + y + 0.3, 5, { draw: g => { px(g, X - 3, Y - 4, 7, 4, '#ecca48'); px(g, X - 3, Y - 4, 7, 1, '#fff09a'); } }]); }
    for (const q of f.flocks) { if (q.t < 0) continue; const X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, 0) - (q.sit ? 4 : (q.z || 30)) - (q.sit ? 0 : q.t * 3); if (!inView(R, X, Y, 20)) continue; D.push([q.x + q.y + 40, 5, { draw: g => bird(g, X, Y, t, q.ph, q.ph & 1 ? '#6e5a44' : '#8a7458', q.sit) }]); }
    for (const d of f.ducks) { if (d.t < 0) continue; const [X, Y] = scr(R, d.x, d.y, 0); if (inView(R, X, Y, 20)) D.push([d.x + d.y + 0.3, 5, { draw: g => duckSpr(g, X, Y, t, d.x0, d.x1 >= d.x0 ? 1 : -1) }]); }
    // the ponds: ducks, fish, dragonflies
    for (const [pi, pc] of Fm.ponds.entries()) { const cx = (pc[0] + 0.5) * T, cy = (pc[1] + 0.5) * T, [X0, Y0] = scr(R, cx, cy, 1); if (!inView(R, X0, Y0, 90)) continue;
      for (let q = 0; q < 2; q++) { const a = t * (0.16 + q * 0.07) + q * 3 + pi * 2, x = cx + Math.cos(a) * 11, y = cy + Math.sin(a * 1.2) * 7, [X, Y] = scr(R, x, y, 1); D.push([x + y + 0.3, 5, { draw: g => { duckSpr(g, X, Y, t, q + pi, Math.cos(a + 1.57) >= 0 ? 1 : -1); g.globalAlpha = 0.4; ring(g, X, Y + 4, 8 + (t * 4 + q) % 4, 3 + (t * 2 + q) % 2, 'rgba(230,250,250,0.8)', 1); g.globalAlpha = 1; } }]); }
      for (let q = 0; q < 3; q++) { const a = t * 0.5 + q * 2.1 + pi * 5, [X, Y] = scr(R, cx + Math.cos(a) * 9, cy + Math.sin(a * 0.9) * 6, 0); D.push([cx + cy + 0.2, 5, { draw: g => { g.globalAlpha = 0.5; g.fillStyle = q === 1 ? '#ff8a3a' : '#f0c850'; g.fillRect(Math.round(X), Math.round(Y), 4, 2); g.fillRect(Math.round(X) - 2, Math.round(Y) - 1 + (Math.floor(t * 5) % 2), 2, 1); g.globalAlpha = 1; } }]); }
      for (let q = 0; q < 2; q++) { const a = t * 0.35 + q * 3.1 + pi, x = cx + Math.cos(a) * 15, y = cy + Math.sin(a * 1.3) * 10, [X, Y] = scr(R, x, y, 10 + 4 * Math.sin(t * 6 + q)); D.push([x + y + 0.3, 5, { draw: g => { g.fillStyle = q ? '#d8f0ff' : '#ffe08a'; g.fillRect(Math.round(X), Math.round(Y), 2, 1); g.fillRect(Math.round(X) + (Math.floor(t * 9 + q) % 2 ? -1 : 2), Math.round(Y) - 1, 1, 1); } }]); } }
    // butterflies over the meadows (more in daylight)
    if ((R.dark || 0) < 0.4) for (let q = 0; q < 9; q++) { const bx = Fm.x0 + 4 + hash(q, 1, 1871) * (Fm.x1 - Fm.x0 - 8), by = Fm.y0 + 8 + hash(q, 2, 1871) * (Fm.y1 - Fm.y0 - 10), a = t * (0.3 + q * 0.04) + q * 2.3, x = bx * T + Math.cos(a) * 30, y = by * T + Math.sin(a * 1.3) * 22, [X, Y] = scr(R, x, y, 10 + Math.sin(t * 2 + q) * 4); if (!inView(R, X, Y, 20)) continue; const c = ['#fff4c8', '#ffb85a', '#f0a0c0', '#c8e8ff'][q % 4]; D.push([x + y + 0.3, 5, { draw: g => { const w = Math.floor(t * 8 + q) % 2; px(g, X, Y, 1, 2, '#222'); px(g, X - 2 - w, Y - 1, 2, 2, c); px(g, X + 1 + w, Y - 1, 2, 2, c); } }]); }
    // transformation / chase smoke
    for (const p of f.poof) { const a = p.t / 2.2, [X, Y] = scr(R, p.x, p.y, 8); if (!inView(R, X, Y, 120)) continue; D.push([p.x + p.y + 5, 5, { draw: g => { const big = p.kind === 'boom'; for (let q = 0; q < (big ? 11 : 7); q++) { const an = q * 0.9 + p.t, d = a * (big ? 36 : 24); mist(g, X + Math.cos(an) * d, Y - 8 - a * 22 + Math.sin(an) * d * 0.5, 9 + a * 16, (9 + a * 16) * 0.8, (1 - a) * 0.75, p.kind === 'gold' ? '255,236,160' : '236,232,226'); } if (big && a < 0.5) { ring(g, X, Y, 14 + a * 120, 6 + a * 50, `rgba(255,230,150,${(0.5 - a) * 1.6})`, 3); for (let q = 0; q < 6; q++) { const an = q * 1.047; px(g, X + Math.cos(an) * (10 + a * 70), Y - 10 + Math.sin(an) * (6 + a * 34), 3, 3, '#ffe890'); } } } }]); }
    // harvest-party grain rising
    for (const gr of f.grain) { const a = gr.t / 2.4, [X, Y] = scr(R, gr.x, gr.y, 6 + a * 40); if (inView(R, X, Y, 12)) D.push([gr.x + gr.y + 8, 5, { draw: g => { g.globalAlpha = 1 - a; for (let q = 0; q < 4; q++) px(g, X + Math.sin(gr.t * 3 + q * 1.8) * 7 + q * 3, Y + q * 2, 2, 2, q & 1 ? '#f6de68' : '#fff09a'); g.globalAlpha = 1; } }]); }
    // the sluice: the canal drawn open (white flow) or closed (dry bed)
    for (let b = 41; b <= 46; b++) { const x = 61.5 * T, y = (b + 0.5) * T, [X, Y] = scr(R, x, y, 0.2); if (!inView(R, X, Y, 40)) continue; D.push([x + y + 0.05, 5, { draw: g => { if (f.flow < 0.5) { g.globalAlpha = 0.8 * (1 - f.flow * 2); diamond(g, X, Y, '#6a5036'); g.globalAlpha = 1; } else { g.globalAlpha = 0.35 * f.flow; for (let q = 0; q < 3; q++) px(g, X - 10 + ((t * 18 + q * 11 + b * 7) % 22), Y - 3 + q * 3, 5, 1, '#f4fdff'); g.globalAlpha = 1; } } }]); }
  }
  // ---------------------------------------------------------------- rain, rainbow, drifting petals, dust of the harvest, fireflies
  function drawSky(g, R, f, x0, y0, W, Hh) {
    const t = R.t, Fm = F(); if (!Fm) return;
    // peach petals drifting from the orchard (always a few)
    for (let q = 0; q < 26; q++) { const u = hash(q, 1, 1872), v = hash(q, 2, 1872), X2 = x0 + ((u * (W + 200) + t * (9 + 5 * v)) % (W + 200)) - 100 + Math.sin(t * (0.6 + v) + q) * 10, Y2 = y0 + ((v * (Hh + 120) + t * (8 + v * 8)) % (Hh + 120)) - 60; if (!inView(R, X2, Y2, 4)) continue; g.fillStyle = q % 3 ? '#f8c8d4' : '#fff0e8'; g.fillRect(Math.round(X2), Math.round(Y2), 2, 2); }
    if (f.rain > 0.02) { g.save(); g.strokeStyle = `rgba(190,210,230,${0.5 * f.rain})`; g.lineWidth = 1; g.beginPath(); const n = Math.floor(160 * f.rain); for (let q = 0; q < n; q++) { const u = hash(q, 1, 1873), v = hash(q, 2, 1873), X2 = x0 + ((u * (W + 100) + t * 40) % (W + 100)) - 50, Y2 = y0 + ((v * Hh + t * 260 + q * 13) % Hh); g.moveTo(X2, Y2); g.lineTo(X2 - 3, Y2 + 9); } g.stroke(); g.fillStyle = `rgba(70,84,100,${0.16 * f.rain})`; g.fillRect(x0, y0, W, Hh); g.restore();
      const sq = Math.floor(30 * f.rain); for (let q = 0; q < sq; q++) { const X2 = x0 + hash(q, 3, 1873) * W, Y2 = y0 + hash(q, 4, 1873) * Hh, e = (t * 1.3 + q * 0.37) % 1; g.globalAlpha = (1 - e) * 0.5 * f.rain; ring(g, X2, Y2, 2 + e * 7, 1 + e * 3, '#e8f4ff', 1); } g.globalAlpha = 1; }
    if (f.rainbow > 0.02) { const [cx, cy] = scr(R, 52 * T, 44 * T, 0); g.globalCompositeOperation = 'lighter'; const cols = ['255,90,90', '255,170,70', '255,236,110', '120,220,120', '100,190,255', '160,130,255']; for (let q = 0; q < 6; q++) { g.strokeStyle = `rgba(${cols[q]},${0.26 * f.rainbow})`; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, cy - 20, 360 - q * 6, 230 - q * 4, 0, 3.4, 6.0); g.stroke(); } g.globalCompositeOperation = 'source-over'; }
    if (f.dawn > 0.02) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,200,130,${0.1 * f.dawn})`; g.fillRect(x0, y0, W, Hh); g.globalCompositeOperation = 'source-over'; }
    if (f.flash > 0.03) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,236,200,${Math.min(0.4, f.flash * 0.3)})`; g.fillRect(x0, y0, W, Hh); g.globalCompositeOperation = 'source-over'; }
    // night fireflies over the meadows and paddies
    if ((R.dark || 0) > 0.3) for (let q = 0; q < 30; q++) { const X2 = x0 + ((hash(q, 5, 1874) * W + Math.sin(t * 0.4 + q) * 30) % W), Y2 = y0 + hash(q, 6, 1874) * Hh, a = Math.pow(Math.max(0, Math.sin(t * 1.4 + q * 2.7)), 3) * (R.dark || 0); g.globalCompositeOperation = 'lighter'; blob(g, X2, Y2, 7, '230,255,130', 0.5 * a); g.globalCompositeOperation = 'source-over'; }
  }
  function drawCaption(g, R, f, x0, y0, W, Hh) {
    if (!f.caption) return; const left = f.capT - (window.TWS ? TWS.t : 0); if (left <= 0 || !inBox(R)) return; const a = clamp(Math.min(left, 1.2), 0, 1);
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.font = 'bold 18px "Segoe UI", "Noto Sans", Arial, sans-serif'; const w = Math.max(g.measureText(f.caption[0]).width, 260) + 44, X = x0 + W / 2, Y = y0 + Hh * 0.27;
    g.fillStyle = 'rgba(52,40,20,0.64)'; g.fillRect(Math.round(X - w / 2), Math.round(Y - 22), Math.round(w), 46); g.strokeStyle = 'rgba(236,206,120,0.9)'; g.strokeRect(Math.round(X - w / 2) + 0.5, Math.round(Y - 22) + 0.5, Math.round(w) - 1, 45);
    g.fillStyle = '#fff4d0'; g.fillText(f.caption[0], X, Y); g.font = '12px "Segoe UI", "Noto Sans", Arial, sans-serif'; g.fillStyle = '#ecd8a8'; g.fillText(f.caption[1], X, Y + 16); g.restore();
  }
  function camera(R, f) {
    if (!window.TWS || !near(R)) return; const ph = TWS.biomes.clt.phase; if (ph !== 'sig' || R.t - (R.userT || -99) < 7) return; let xy = f.follow && !f.follow.gone ? [f.follow.x, f.follow.y] : f.focus && f.focusT > TWS.t ? f.focus : null; if (!xy) return;
    const X = R.wx(xy[0], xy[1]), Y = R.wy(xy[0], xy[1], ground(xy[0], xy[1])) - 40, e = 1 - Math.exp(-2.4 * 0.016 * Math.min(5, Math.max(1, (window.TWS && TWS.speed) || 1))); R.cx += (X - R.cx) * e; R.cy += (Y - R.cy) * e; if (R.clamp) R.clamp();
  }
  function draw(g, S, R, x0, y0, W, Hh) { const f = st(); if (!f || !near(R)) return; drawSky(g, R, f, x0, y0, W, Hh); drawCaption(g, R, f, x0, y0, W, Hh); camera(R, f); }
  function light(g, S, R, amt) {
    const f = st(), Fm = F(); if (!f || !Fm || amt < 0.05 || !near(R)) return; const t = R.t;
    for (const c of Fm.lamps) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, [LX, LY] = scr(R, x, y, 16); if (inView(R, LX, LY, 60)) blob(g, LX, LY, 46, '255,214,140', (0.26 + f.celebrate * 0.2) * amt * (0.88 + 0.12 * Math.sin(t * 5 + c[0]))); }
    for (const c of Fm.chimneys) { const x = c[0] * T, y = c[1] * T, [LX, LY] = scr(R, x, y, 10); if (inView(R, LX, LY, 70)) blob(g, LX, LY, 58, '255,190,110', 0.2 * amt * (0.85 + 0.15 * Math.sin(t * 3 + c[0]))); }
    if (Fm.house) { const [hx, hy] = scr(R, (Fm.house.i + 2) * T, (Fm.house.j + 1.2) * T, 24); blob(g, hx, hy, 110, '255,206,130', 0.3 * amt); }
    if (f.celebrate > 0.05) for (let q = 0; q < 8; q++) { const x = (45 + q * 1.4) * T, y = 46.6 * T, [LX, LY] = scr(R, x, y, 24 + Math.sin(t * 2 + q) * 2); if (inView(R, LX, LY, 40)) { blob(g, LX, LY, 26, '255,120,80', 0.4 * f.celebrate * amt); } }
  }
  window.TWFX.clt = { draw, light, drawables };
})();
