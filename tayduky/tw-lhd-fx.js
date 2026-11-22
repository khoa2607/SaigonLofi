'use strict';
// ===== Tây Du Ký — Liên Hoa Động: living effects (render-only; reads TWS.lhd) =====
// The monumental Lotus Cave mouth at twice its size (warm inner glow, drifting cave mist, bats pouring out), braziers and crystals that flicker, the four treasures on their pedestals / in hands / in flight, the suction cone of the gourd,
// the Golden Rope (a helix that binds), the Seven-Star Sword slashes, pulse rings, Laojun's seal and descending light, the wind of the gourd, the arena runes, the waterfall's spray and surge, pool lotus, dragonflies, fish, peak birds, caption and the story camera.
window.TWFX = window.TWFX || {};
(function () {
  const A = TWA, T = 8, F = () => TWM.lhd, st = () => (window.TWS && TWS.lhd) || null, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), hash = (a, b, c) => TWM.hash2(a, b, c), ground = (x, y) => TWM.groundZ(x, y), N = () => TWM.N;
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const inView = (R, x, y, m) => { const x0 = R.cx - R.cv.width / 2 - m, y0 = R.cy - R.cv.height / 2 - m; return x > x0 && x < x0 + R.cv.width + 2 * m && y > y0 && y < y0 + R.cv.height + 2 * m; };
  function blob(g, x, y, r, rgb, a) { if (a <= 0.003) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  const mist = (g, x, y, rx, ry, a, rgb) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); blob(g, 0, 0, rx, rgb || '200,210,230', a); g.restore(); };
  const ring = (g, x, y, rx, ry, col, w) => { g.strokeStyle = col; g.lineWidth = w || 1; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.2832); g.stroke(); };
  const scr = (R, x, y, dz) => [R.wx(x, y), R.wy(x, y, ground(x, y) + (dz || 0))];
  let box = null; function geo() { if (box) return box; const n = N(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const k of F().tiles) { const i = k % n, j = Math.floor(k / n), X = A.SX(i, j), Y = A.SY(i, j, TWM.H[k]); x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); } return box = [x0 - 240, y0 - 460, x1 + 240, y1 + 240]; }
  const inBox = R => { const b = geo(); return R.cx > b[0] + 160 && R.cx < b[2] - 160 && R.cy > b[1] + 280 && R.cy < b[3] - 200; };
  const near = R => { const b = geo(); return R.cx > b[0] - 600 && R.cx < b[2] + 600 && R.cy > b[1] - 500 && R.cy < b[3] + 600; };
  const MOUTH = () => { const F0 = F(); return [46 * T, 78.6 * T]; };
  // ---------------------------------------------------------------- the Lotus Cave mouth at twice its size
  const prevSprite = A.ext && A.ext.sprite; A.ext = A.ext || {}; const K = 2;
  A.ext.sprite = p => {
    if (p.kind !== 'lhdmouth' || !A.lhd) return prevSprite ? prevSprite(p) : null; const s = A.lhd.painters.lhdmouth(p);
    return { w: s.w * K, h: s.h * K, py: s.py * K, frames: s.frames, em: null, glow: null, silk: null, flat: false, draw(g, sp, f) { const sv = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(f, 0, 0, f.width, f.height, sp.X, sp.Y, f.width * K, f.height * K); g.imageSmoothingEnabled = sv; } };
  };
  // ---------------------------------------------------------------- small drawings
  function bat(g, X, Y, t, ph) { const up = Math.sin(t * 14 + ph) > 0 ? 3 : -1; px(g, X - 1, Y, 3, 2, '#1c1a24'); px(g, X - 6, Y + up - 2, 5, 2, '#1c1a24'); px(g, X + 2, Y + up - 2, 5, 2, '#1c1a24'); px(g, X - 8, Y + up, 3, 1, '#1c1a24'); px(g, X + 6, Y + up, 3, 1, '#1c1a24'); }
  function bird(g, X, Y, t, ph) { const up = Math.sin(t * 8 + ph) > 0 ? 2 : -1; px(g, X - 1, Y, 3, 2, '#e8e4dc'); px(g, X - 5, Y + up - 1, 4, 1, '#e8e4dc'); px(g, X + 2, Y + up - 1, 4, 1, '#e8e4dc'); }
  function flame(g, X, Y, t, ph, s) { for (let q = 0; q < 5; q++) { const u = (t * 1.3 + q / 5 + ph) % 1, w = (1 - u) * (4 + s * 3); g.globalAlpha = (1 - u) * 0.85; px(g, X + Math.sin(t * 6 + q + ph) * 2 - w / 2, Y - u * (14 + s * 6), Math.max(1, Math.round(w)), Math.max(1, Math.round(w)), q < 2 ? '#ffe9a0' : q < 4 ? '#ff9a3a' : '#e0502a'); } g.globalAlpha = 1; }
  function flag(g, X, Y, t, ph) { px(g, X, Y - 40, 2, 40, '#2a2630'); for (let q = 0; q < 10; q++) { const w = Math.sin(t * 2.6 + ph + q * 0.55) * (0.8 + q * 0.22); g.fillStyle = q % 3 ? '#6a1428' : '#d8a838'; g.fillRect(Math.round(X + 2 + q), Math.round(Y - 38 + w), 1, 14); } }
  function item(g, k, X, Y, t, glow, open) { const it = A.lhd.items[k], im = it.c; const bob = Math.sin(t * 2 + k.length) * 1.5; g.drawImage(im, Math.round(X - it.w / 2), Math.round(Y - it.h + bob)); if (glow > 0.02) { g.globalCompositeOperation = 'lighter'; blob(g, X, Y - it.h / 2 + bob, 26 + glow * 22, k === 'bottle' ? '120,255,200' : k === 'rope' ? '255,220,110' : k === 'sword' ? '210,230,255' : '255,150,230', 0.4 * glow); g.globalCompositeOperation = 'source-over'; } if (open > 0.02) { for (let q = 0; q < 6; q++) { const u = (t * 0.8 + q / 6) % 1; g.globalAlpha = (1 - u) * 0.7; px(g, X + Math.sin(u * 6 + q) * 8, Y - it.h - u * 24, 2, 2, '#ffe0ff'); } g.globalAlpha = 1; } }
  // ---------------------------------------------------------------- depth-sorted things
  function drawables(D, R) {
    const f = st(), Fm = F(); if (!f || !Fm || !near(R)) return; const t = R.t, n = N(), S = window.TWS;
    for (const [i, c] of Fm.flags.entries()) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, [X, Y] = scr(R, x, y); if (inView(R, X, Y, 50)) D.push([x + y + 0.2, 5, { draw: g => flag(g, X, Y, t, i * 1.7) }]); }
    for (const [i, c] of Fm.braziers.entries()) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, [X, Y] = scr(R, x, y, 16); if (inView(R, X, Y, 60)) D.push([x + y + 0.6, 5, { draw: g => { for (let q = 0; q < 4 + Math.round(f.flicker * 4); q++) { const u = (t * 0.5 + q / 4 + i * 0.37) % 1; g.globalAlpha = (1 - u) * 0.9; px(g, X + Math.sin(t * 2 + q * 2 + i) * 5 * u, Y - 14 - u * 34, 2, 2, q & 1 ? '#ffd070' : '#ff8a3a'); } g.globalAlpha = 1; } }]); }
    for (const [i, c] of Fm.crystals.entries()) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, [X, Y] = scr(R, x, y, 14); if (inView(R, X, Y, 50)) D.push([x + y + 0.5, 5, { draw: g => { g.globalCompositeOperation = 'lighter'; blob(g, X, Y - 8, 22, '160,140,255', 0.18 + 0.1 * Math.sin(t * 1.6 + i) + f.rune * 0.2); g.globalCompositeOperation = 'source-over'; } }]); }
    // the treasures: on the pedestals, in a hand, or gone
    for (const k of ['gourd', 'bottle', 'rope', 'sword']) { const it = f.items[k]; if (it.gone) continue; const hh = k === 'sword' ? 26 : 16, x = it.x, y = it.y, [X, Y] = scr(R, x, y, it.hold ? 26 : 14 + hh * 0.2); if (!inView(R, X, Y, 60)) continue; if (it.hold && it.hold.hidden) continue; D.push([x + y + 0.9, 5, { draw: g => { item(g, k, X, Y, t, it.glow, it.open); if (k === 'gourd' && it.fake) px(g, X + 8, Y - 14, 3, 3, '#ffffff'); } }]); }
    // beams
    for (const b of f.beams) { const a = clamp(b.t / b.life, 0, 1), [X0, Y0] = scr(R, b.x0, b.y0, 18), [X1, Y1] = scr(R, b.x1, b.y1, 14); if (!inView(R, (X0 + X1) / 2, (Y0 + Y1) / 2, 300)) continue; const kx = (b.x0 + b.x1) / 2 + (b.y0 + b.y1) / 2 + 2;
      D.push([kx, 5, { draw: g => {
        g.globalCompositeOperation = 'lighter';
        if (b.kind === 'suck') { for (let q = 0; q < 26; q++) { const u = (a * 0.7 + q / 26 + t * 0.9) % 1, e = u * u, x = X0 + (X1 - X0) * e, y = Y0 + (Y1 - Y0) * e + Math.sin(u * 14 + q) * (1 - u) * 14; g.globalAlpha = (1 - Math.abs(0.5 - u) * 1.4) * (1 - a * 0.5); px(g, x, y, 2, 2, q % 3 ? '#ffc8f4' : '#ffffff'); } g.globalAlpha = 1; ring(g, X1, Y1, 12 + a * 8, 6 + a * 3, `rgba(255,170,240,${0.7 - a * 0.4})`, 2); }
        else if (b.kind === 'rope') { const m = 18; g.lineWidth = 3; for (let q = 0; q < m; q++) { const u = q / m, e = Math.min(1, a * 1.6 + 0.15) * u, x = X0 + (X1 - X0) * e, y = Y0 + (Y1 - Y0) * e - Math.sin(u * 3.1416) * 26 * (1 - a * 0.5) + Math.sin(u * 20 + t * 6) * 2; g.fillStyle = q & 1 ? 'rgba(255,214,90,0.95)' : 'rgba(200,150,40,0.95)'; g.fillRect(Math.round(x), Math.round(y), 3, 3); } blob(g, X1, Y1, 30, '255,214,110', 0.35 * (1 - a * 0.5)); }
        else if (b.kind === 'slash') { g.strokeStyle = `rgba(230,240,255,${1 - a})`; g.lineWidth = 3; g.beginPath(); g.moveTo(X0, Y0); g.lineTo(X0 + (X1 - X0) * (0.4 + a * 0.6), Y0 + (Y1 - Y0) * (0.4 + a * 0.6)); g.stroke(); blob(g, X1, Y1, 24, '220,236,255', 0.4 * (1 - a)); }
        else if (b.kind === 'pulse') { for (let q = 0; q < 3; q++) { const e = clamp(a * 1.4 - q * 0.2, 0, 1); if (e > 0 && e < 1) ring(g, X0, Y0, 6 + e * 46, 3 + e * 20, `rgba(255,236,170,${(1 - e) * 0.8})`, 2); } blob(g, X0, Y0, 38, '255,230,150', 0.4 * (1 - a)); }
        else if (b.kind === 'fly') { const e = a * a * (3 - 2 * a), x = X0 + (X1 - X0) * e, y = Y0 + (Y1 - Y0) * e - Math.sin(e * 3.1416) * 40; for (let q = 0; q < 8; q++) { const e2 = Math.max(0, e - q * 0.03); const xx = X0 + (X1 - X0) * e2, yy = Y0 + (Y1 - Y0) * e2 - Math.sin(e2 * 3.1416) * 40; g.globalAlpha = 1 - q / 8; px(g, xx, yy, 3, 3, '#fff0b0'); } g.globalAlpha = 1; blob(g, x, y, 22, '255,236,170', 0.5); }
        else if (b.kind === 'seal') { const [cx, cy] = [X0, Y0 - 4]; const al = Math.sin(clamp(a, 0, 1) * 3.1416) * 0.9; ring(g, cx, cy, 80, 36, `rgba(255,236,170,${al})`, 3); ring(g, cx, cy, 54, 24, `rgba(255,214,120,${al * 0.8})`, 2); g.strokeStyle = `rgba(255,236,170,${al})`; g.lineWidth = 2; for (let q = 0; q < 8; q++) { const an = q * 0.7854 + t * 0.3; g.beginPath(); g.moveTo(cx + Math.cos(an) * 54, cy + Math.sin(an) * 24); g.lineTo(cx + Math.cos(an) * 80, cy + Math.sin(an) * 36); g.stroke(); } g.beginPath(); g.arc(cx, cy, 12, 0, 6.28); g.stroke(); g.beginPath(); g.arc(cx - 6, cy, 6, 1.57, 4.71); g.stroke(); blob(g, cx, cy, 70, '255,226,150', 0.3 * al); }
        else if (b.kind === 'descend') { g.globalAlpha = Math.sin(clamp(a, 0, 1) * 3.1416) * 0.7; const gr = g.createLinearGradient(0, Y1 - 220, 0, Y1); gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(1, 'rgba(255,240,190,0.85)'); g.fillStyle = gr; g.fillRect(X1 - 26, Y1 - 220, 52, 220); g.globalAlpha = 1; }
        g.globalCompositeOperation = 'source-over'; } }]); }
    // the golden rope binds: loops around each bound agent
    if (S && f.bound.length) for (const a of S.agents) { if (!f.bound.includes(a.id) || a.hidden || a.gone) continue; const [X, Y] = scr(R, a.x, a.y, 4); if (!inView(R, X, Y, 40)) continue; D.push([a.x + a.y + 0.7, 5, { draw: g => { for (let q = 0; q < 3; q++) { const yy = Y - 10 - q * 7, sw = Math.sin(t * 3 + q) * 0.6; g.fillStyle = '#7a5a1c'; g.fillRect(Math.round(X - 9 + sw), yy + 1, 18, 3); g.fillStyle = q & 1 ? '#f0c850' : '#d8a838'; g.fillRect(Math.round(X - 9 + sw), yy, 18, 2); } px(g, X + 8, Y - 14, 3, 6, '#d83a3a'); } }]); }
    // bats and peak birds
    for (const q of f.bats) { if (q.t < 0) continue; const X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, 0) - (q.z || 30) - q.t * 4; if (inView(R, X, Y, 20)) D.push([q.x + q.y + 50, 5, { draw: g => bat(g, X, Y, t, q.ph) }]); }
    for (const q of f.birds) { if (q.t < 0) continue; const X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, 0) - (q.z || 80); if (inView(R, X, Y, 20)) D.push([q.x + q.y + 60, 5, { draw: g => bird(g, X, Y, t, q.ph) }]); }
    // transformation / gold smoke
    for (const p of f.poof) { const a = p.t / 2.2, [X, Y] = scr(R, p.x, p.y, 8); if (!inView(R, X, Y, 120)) continue; D.push([p.x + p.y + 5, 5, { draw: g => { for (let q = 0; q < 8; q++) { const an = q * 0.9 + p.t, d = a * 26; mist(g, X + Math.cos(an) * d, Y - 8 - a * 22 + Math.sin(an) * d * 0.5, 9 + a * 16, (9 + a * 16) * 0.8, (1 - a) * 0.75, p.kind === 'gold' ? '255,236,170' : '210,200,230'); } } }]); }
    // pools: lotus dragonflies and fish
    for (const [pi, pc] of Fm.pools.entries()) { const cx = pc[0] * T, cy = pc[1] * T, [X0, Y0] = scr(R, cx, cy, 1); if (!inView(R, X0, Y0, 80)) continue; for (let q = 0; q < 2; q++) { const a = t * (0.5 + q * 0.17) + q * 2.1 + pi, x = cx + Math.cos(a) * 9, y = cy + Math.sin(a * 1.2) * 7, [X, Y] = scr(R, x, y, 8 + 3 * Math.sin(t * 6 + q)); D.push([x + y + 0.3, 5, { draw: g => { g.fillStyle = q ? '#9ae8ff' : '#ffe08a'; g.fillRect(Math.round(X), Math.round(Y), 2, 1); g.fillRect(Math.round(X) + (Math.floor(t * 9 + q) % 2 ? -1 : 2), Math.round(Y) - 1, 1, 1); } }]); } }
  }
  // ---------------------------------------------------------------- the cave's breath: mouth glow, mist, arena runes, waterfall spray, wind, motes
  function drawMouth(g, R, f) {
    const t = R.t, [mx, my] = MOUTH(), [X, Y] = scr(R, mx, my, 0); if (!inView(R, X, Y, 500)) return; g.globalCompositeOperation = 'lighter';
    blob(g, X, Y - 34, 120 + f.glow * 60, '255,150,70', 0.12 + f.glow * 0.2 + 0.03 * Math.sin(t * 2.2) + f.flash * 0.15);
    for (let q = 0; q < 5; q++) { const e = (t * 0.2 + q / 5) % 1; blob(g, X - 10 + Math.sin(t * 0.7 + q * 1.3) * 30, Y - 10 - e * 90, 30 + e * 40, '255,140,60', (1 - e) * 0.1 * (0.5 + f.glow)); }
    g.globalCompositeOperation = 'source-over';
    // cave mist rolling out of the mouth along the ground
    for (let q = 0; q < 8; q++) { const e = (t * 0.07 + q / 8) % 1, xx = X - 40 + e * 140 + Math.sin(t * 0.5 + q) * 12, yy = Y + 6 + e * 40 + Math.sin(q * 2) * 6; mist(g, xx, yy, 40 + e * 40, 12 + e * 12, (1 - e) * (0.1 + f.mist * 0.28), '170,180,210'); }
  }
  function drawArena(g, R, f) {
    const t = R.t, ARENA = [60 * T, 80.5 * T], [X, Y] = scr(R, ARENA[0], ARENA[1], 3); if (!inView(R, X, Y, 300)) return; const al = 0.14 + f.rune * 0.7; g.globalCompositeOperation = 'lighter';
    for (let q = 0; q < 3; q++) ring(g, X, Y, 78 - q * 22, 36 - q * 10, `rgba(170,150,255,${al * (1 - q * 0.2)})`, 2 + (q === 0 ? 1 : 0));
    g.strokeStyle = `rgba(200,180,255,${al})`; g.lineWidth = 1.5; for (let q = 0; q < 12; q++) { const an = q * 0.5236 + t * 0.12; g.beginPath(); g.moveTo(X + Math.cos(an) * 36, Y + Math.sin(an) * 17); g.lineTo(X + Math.cos(an) * 74, Y + Math.sin(an) * 34); g.stroke(); const ex = X + Math.cos(an + 0.26) * 58, ey = Y + Math.sin(an + 0.26) * 27; px(g, ex - 1, ey - 1, 3, 3, `rgba(220,200,255,${al})`); }
    blob(g, X, Y, 70, '160,140,255', 0.1 + f.rune * 0.2); if (f.seal > 0.02) { ring(g, X, Y - 20, 40, 18, `rgba(255,226,150,${f.seal * 0.8})`, 2); blob(g, X, Y - 20, 80, '255,226,150', 0.25 * f.seal); } g.globalCompositeOperation = 'source-over';
  }
  function drawSky(g, R, f, x0, y0, W, Hh) {
    const t = R.t, Fm = F(); if (!Fm) return;
    // the falls: spray and surge
    const [fx, fy] = Fm.fall, [SX, SY] = scr(R, (fx + 0.5) * T, (fy + 1.8) * T, 0); if (inView(R, SX, SY, 300)) { const s = 1 + f.surge * 1.5; g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 14 * s; q++) { const u = (t * 0.9 + q / (14 * s)) % 1, a = hash(q, 1, 1990) * 6.28; blob(g, SX + Math.cos(a) * u * 26 * s, SY - 4 - Math.sin(u * 3.14) * 26 * s, 4 + u * 5, '226,248,252', (1 - u) * 0.5); } g.globalCompositeOperation = 'source-over'; mist(g, SX, SY - 8, 56 * s, 16 * s, 0.2 + f.surge * 0.15, '230,244,250'); }
    // drifting mist banks along the canyon and the courtyard (more at night and in the quiet of the second story)
    for (let q = 0; q < 10; q++) { const u = (t * 0.012 + q / 10) % 1, [X, Y] = scr(R, (44 + u * 22) * T, (58 + q * 2.5) * T, 6); if (inView(R, X, Y, 140)) mist(g, X + Math.sin(t * 0.1 + q) * 20, Y, 80, 20, 0.05 + f.mist * 0.12, '170,184,210'); }
    if (f.wind > 0.02) { g.save(); g.strokeStyle = `rgba(255,200,250,${0.35 * f.wind})`; g.lineWidth = 1; g.beginPath(); for (let q = 0; q < 40; q++) { const u = hash(q, 1, 1991), v = hash(q, 2, 1991), X2 = x0 + ((u * (W + 200) + t * 120 * f.wind) % (W + 200)) - 100, Y2 = y0 + v * Hh; g.moveTo(X2, Y2); g.lineTo(X2 - 16, Y2 + 3); } g.stroke(); g.restore(); }
    if (f.flash > 0.03) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,226,200,${Math.min(0.4, f.flash * 0.3)})`; g.fillRect(x0, y0, W, Hh); g.globalCompositeOperation = 'source-over'; }
    // floating motes in the cave (dust in firelight) and, by night, a few glow-worms
    g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 30; q++) { const u = hash(q, 1, 1992), v = hash(q, 2, 1992), X2 = x0 + ((u * W + t * 3) % W), Y2 = y0 + ((v * Hh - t * 5 + Hh * 4) % Hh); g.fillStyle = `rgba(255,200,150,${0.12 + 0.3 * Math.max(0, Math.sin(t * 1.1 + q))})`; g.fillRect(Math.round(X2), Math.round(Y2), 1, 1); } g.globalCompositeOperation = 'source-over';
  }
  function drawCaption(g, R, f, x0, y0, W, Hh) {
    if (!f.caption) return; const left = f.capT - (window.TWS ? TWS.t : 0); if (left <= 0 || !inBox(R)) return; const a = clamp(Math.min(left, 1.2), 0, 1);
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.font = 'bold 18px "Segoe UI", "Noto Sans", Arial, sans-serif'; const w = Math.max(g.measureText(f.caption[0]).width, 260) + 44, X = x0 + W / 2, Y = y0 + Hh * 0.27;
    g.fillStyle = 'rgba(28,20,40,0.68)'; g.fillRect(Math.round(X - w / 2), Math.round(Y - 22), Math.round(w), 46); g.strokeStyle = 'rgba(236,176,110,0.9)'; g.strokeRect(Math.round(X - w / 2) + 0.5, Math.round(Y - 22) + 0.5, Math.round(w) - 1, 45);
    g.fillStyle = '#fff0d8'; g.fillText(f.caption[0], X, Y); g.font = '12px "Segoe UI", "Noto Sans", Arial, sans-serif'; g.fillStyle = '#ecc8a0'; g.fillText(f.caption[1], X, Y + 16); g.restore();
  }
  function camera(R, f) {
    if (!window.TWS || !near(R)) return; const ph = TWS.biomes.lhd.phase; if (ph !== 'sig' || R.t - (R.userT || -99) < 7) return; let xy = f.follow && !f.follow.gone ? [f.follow.x, f.follow.y] : f.focus && f.focusT > TWS.t ? f.focus : null; if (!xy) return;
    const X = R.wx(xy[0], xy[1]), Y = R.wy(xy[0], xy[1], ground(xy[0], xy[1])) - 40, e = 1 - Math.exp(-2.4 * 0.016 * Math.min(5, Math.max(1, (window.TWS && TWS.speed) || 1))); R.cx += (X - R.cx) * e; R.cy += (Y - R.cy) * e; if (R.clamp) R.clamp();
  }
  function draw(g, S, R, x0, y0, W, Hh) { const f = st(); if (!f || !near(R)) return; drawMouth(g, R, f); drawArena(g, R, f); drawSky(g, R, f, x0, y0, W, Hh); drawCaption(g, R, f, x0, y0, W, Hh); camera(R, f); }
  function light(g, S, R, amt) {
    const f = st(), Fm = F(); if (!f || !Fm || amt < 0.05 || !near(R)) return; const t = R.t, [mx, my] = MOUTH(), [X, Y] = scr(R, mx, my, 10);
    blob(g, X, Y - 40, 220, '255,150,70', (0.3 + f.glow * 0.3 + f.flash * 0.2) * amt);
    for (const c of Fm.lamps) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, [LX, LY] = scr(R, x, y, 14); if (inView(R, LX, LY, 60)) blob(g, LX, LY, 46, '255,176,90', 0.26 * amt * (0.85 + 0.15 * Math.sin(t * 6 + c[0]))); }
    for (const c of Fm.braziers) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, [LX, LY] = scr(R, x, y, 10); if (inView(R, LX, LY, 70)) blob(g, LX, LY, 58, '255,160,70', 0.34 * amt * (0.78 + 0.22 * Math.sin(t * 7 + c[1] + f.flicker * 3))); }
    for (const c of Fm.crystals) { const x = (c[0] + 0.5) * T, y = (c[1] + 0.5) * T, [LX, LY] = scr(R, x, y, 12); if (inView(R, LX, LY, 60)) blob(g, LX, LY - 4, 40, '150,130,255', (0.24 + f.rune * 0.25) * amt * (0.85 + 0.15 * Math.sin(t * 1.7 + c[0]))); }
    const [hx, hy] = scr(R, 70.5 * T, 78.5 * T, 10); blob(g, hx, hy, 90, '255,210,110', (0.24 + 0.06 * Math.sin(t * 3)) * amt);
    for (const k of Object.keys(f.items)) { const it = f.items[k]; if (it.gone) continue; const [LX, LY] = scr(R, it.x, it.y, 18); if (inView(R, LX, LY, 60)) blob(g, LX, LY, 32 + it.glow * 24, k === 'bottle' ? '120,255,200' : k === 'rope' ? '255,220,110' : k === 'sword' ? '200,226,255' : '255,150,230', (0.18 + it.glow * 0.4) * amt); }
  }
  window.TWFX.lhd = { draw, light, drawables };
})();
