'use strict';
// ===== Tây Du Ký v2 — Sư Đà Lĩnh: living effects (render only; loaded after tw-fx.js) =====
// Reads TWS.lion / TWM.lion; nothing here drives behaviour. Layers: the waterfall and river, plunge-pool foam and spray, gorge fog and drifting cloud banks,
// witchfire on every brazier and along the walls, wall pennants, campfire smoke, the golden nest (motes and feathers), orbiting crows and distant flocks, the roc's
// shadow, mire bubbles, wind-blown leaves, the den's breath, roar / stomp / wing shockwaves, and the storm + beacon light pillars of the signature.
(function () {
  const A = TWA, hash = TWM.hash2, F = TWM.lion, st = () => window.TWS && TWS.lion, T = 8, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sx = (i, j) => A.SX(i, j), sy = (i, j, h) => A.SY(i, j, h);
  const inView = (R, x, y, m) => x > R.cx - R.cv.width / 2 - m && x < R.cx + R.cv.width / 2 + m && y > R.cy - R.cv.height / 2 - m && y < R.cy + R.cv.height / 2 + m;
  const nearBiome = R => { const L = TWM.layout.sdl, cx = R.wx((L.x0 + L.cx) * T, (L.y0 + L.cy) * T), cy = R.wy((L.x0 + L.cx) * T, (L.y0 + L.cy) * T, 20); return Math.hypot(R.cx - cx, R.cy - cy) < 2000; };
  const poly = R => { const L = TWM.layout.sdl, pts = [], e = 2 / L.p; for (let n = 0; n < 40; n++) { const a = n / 40 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), i = L.x0 + L.cx + L.rx * Math.sign(c) * Math.abs(c) ** e, j = L.y0 + L.cy + L.ry * Math.sign(s) * Math.abs(s) ** e; pts.push([R.wx(i * T, j * T), R.wy(i * T, j * T, 10)]); } return pts; };
  const clip = (g, R) => { const p = poly(R); g.beginPath(); p.forEach(([x, y], n) => n ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip(); };
  // soft cloud sprite (cached): a pixel-ish blob made of stacked translucent ellipses
  let cloudCv = null; const cloud = () => { if (cloudCv) return cloudCv; const c = document.createElement('canvas'); c.width = 96; c.height = 32; const g = c.getContext('2d'); for (let n = 0; n < 6; n++) { g.fillStyle = `rgba(232,232,252,${0.12})`; const w = 94 - n * 10, h = 30 - n * 3.6; g.beginPath(); g.ellipse(48, 16, w / 2, h / 2, 0, 0, 7); g.fill(); } return cloudCv = c; };
  const mist = (g, x, y, w, h, a, tint) => { if (a < 0.01) return; const c = cloud(); g.globalAlpha = a; g.drawImage(c, Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h)); g.globalAlpha = 1; };

  // witchfire (green), with a brighter core, tongues, sparks and a breathing glow; `pal` 0 green, 1 gold
  function flame(g, X, Y, sc, t, seed, amt, pal) {
    if (amt < 0.03) return; const ph = seed * 7.3, C = pal ? [[255, 238, 150], [255, 200, 70], [230, 140, 40], '255,200,80'] : [[220, 255, 200], [110, 235, 120], [40, 150, 90], '90,255,130'];
    g.globalCompositeOperation = 'lighter';
    const rg = g.createRadialGradient(X, Y - 6 * sc, 2, X, Y - 6 * sc, 30 * sc), br = (0.24 + 0.1 * Math.sin(t * 5 + ph) + 0.05 * Math.sin(t * 13 + ph)) * amt; rg.addColorStop(0, `rgba(${C[3]},${br})`); rg.addColorStop(1, `rgba(${C[3]},0)`); g.fillStyle = rg; g.fillRect(X - 30 * sc, Y - 36 * sc, 60 * sc, 60 * sc);
    for (let q = 0; q < 5; q++) { const o = (q - 2) * 3 * sc, fl = 0.5 + 0.5 * Math.sin(t * (7 + q * 1.7) + ph + q * 2.1) * Math.sin(t * 3.1 + q), h = (8 + 10 * fl + (q === 2 ? 7 : 0)) * sc * amt, w0 = (4 - Math.abs(q - 2) * 0.7) * sc;
      for (let y = 0; y < h; y += 2) { const f = y / h, w = w0 * (1 - f * 0.85) * (1 + 0.2 * Math.sin(t * 20 + y + q)), sway = Math.sin(t * 6 + q * 1.3 + y * 0.3 + ph) * f * 2 * sc, c = f < 0.3 ? C[0] : f < 0.6 ? C[1] : C[2];
        g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(1 - f * 0.6) * 0.78 * Math.min(1, amt * 1.4)})`; g.fillRect(Math.round(X + o + sway - w / 2), Math.round(Y - y - 2), Math.max(1, Math.round(w)), 2); } }
    for (let q = 0; q < 6; q++) { const a = hash(seed * 31 + q, 9, 210), age = (t * (0.7 + a * 0.6) + a * 5) % 1; g.fillStyle = `rgba(${C[0][0]},${C[0][1]},${C[0][2]},${(1 - age) * amt})`; g.fillRect(Math.round(X + (a - 0.5) * 14 * sc + Math.sin(age * 9 + q) * 3), Math.round(Y - 8 * sc - age * 36 * sc), 1, 1 + (q % 3 === 0)); }
    g.globalCompositeOperation = 'source-over';
  }
  const bird = (g, x, y, t, ph, sc, col) => { const f = Math.sin(t * 9 + ph), w = (4 + 2 * f) * sc; g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 2 * sc | 0 || 1, 1); for (let s = 1; s <= w; s++) { g.fillRect(Math.round(x - s), Math.round(y - (s > w * 0.5 ? f * 1.5 : -f * 0.5) - s * 0.35), 1, 1); g.fillRect(Math.round(x + s + 1), Math.round(y - (s > w * 0.5 ? f * 1.5 : -f * 0.5) - s * 0.35), 1, 1); } };

  // ---------------------------------------------------------------- waterfall: every river tile that drops a level (+ foam / spray where it lands)
  let falls = null, streams = null, mires = null;
  function build() { falls = []; streams = []; mires = []; const N = TWM.N, Hh = TWM.H, M = TWM.M, lo = (i, j) => TWM.inMap(i, j) && TWM.MAT[TWM.id(i, j)] !== M.VOID ? Hh[TWM.id(i, j)] : -6;
    for (const k of F.tiles) { const m = TWM.MAT[k], i = k % N, j = Math.floor(k / N), h = Hh[k];
      if (m === M.STREAM) { const dL = Math.max(0, h - lo(i, j + 1)), dR = Math.max(0, h - lo(i + 1, j)); if (dL || dR) falls.push({ i, j, h, dL, dR }); streams.push([i, j, h]); }
      else if (m === M.POOL) streams.push([i, j, h]); else if (m === M.MIRE && hash(i, j, 211) < 0.35) mires.push([i, j, h]); } }
  function drawFalls(g, R, f, t, x0, y0, x1, y1) {
    if (!falls) build(); g.globalCompositeOperation = 'lighter';
    for (const q of falls) { const X = sx(q.i, q.j), Y = sy(q.i, q.j, q.h); if (X < x0 - 60 || X > x1 + 60 || Y < y0 - 20 || Y > y1 + 16 * Math.max(q.dL, q.dR) + 60) continue;
      for (const side of [0, 1]) { const drop = (side ? q.dR : q.dL) * 16; if (!drop) continue; const ph = hash(q.i, q.j, 212 + side) * 6.28, bx = X + (side ? 0 : -32);
        g.fillStyle = `rgba(190,240,250,${0.05 + 0.04 * Math.sin(t * 2 + ph)})`; g.beginPath(); if (side) { g.moveTo(X, Y + 32); g.lineTo(X + 32, Y + 16); g.lineTo(X + 32, Y + 16 + drop); g.lineTo(X, Y + 32 + drop); } else { g.moveTo(X - 32, Y + 16); g.lineTo(X, Y + 32); g.lineTo(X, Y + 32 + drop); g.lineTo(X - 32, Y + 16 + drop); } g.closePath(); g.fill();
        for (let c = 0; c < 14; c++) { const a = hash(q.i * 5 + c, q.j, 213 + side), lx = Math.floor(a * 31), age = (t * (0.9 + a * 0.8) + a * 7 + c * 0.11) % 1, rt = side ? Math.floor((95 - (32 + lx)) / 2) + 1 : Math.floor((lx + 32) / 2) + 1, yy = Y + rt + age * (drop - 3), len = 4 + Math.floor(a * 9);
          g.fillStyle = `rgba(235,252,255,${(0.4 + 0.5 * Math.sin(age * 3.14))})`; g.fillRect(Math.round(bx + lx), Math.round(yy), 1 + (c & 1), len); }
        for (let c = 0; c < 10; c++) { const a = hash(q.i * 3 + c, q.j, 215 + side), lx = Math.floor(a * 30) + 1, rt = side ? Math.floor((95 - (32 + lx)) / 2) + 1 : Math.floor((lx + 32) / 2) + 1, age = (t * (1.3 + a) + a * 5) % 1, yb = Y + rt + drop;   // spray at the foot
          g.fillStyle = `rgba(235,252,255,${(1 - age) * 0.9})`; g.fillRect(Math.round(bx + lx + (a - 0.5) * 14 * age), Math.round(yb - 2 - Math.sin(age * 3.14) * (5 + a * 12)), 2, 1);
          if (c < 4) { g.fillStyle = `rgba(255,255,255,${0.55 + 0.4 * Math.sin(t * 6 + c + ph)})`; g.fillRect(Math.round(bx + lx), Math.round(yb - 1), 3 + (c & 1), 1); } } } }
    g.globalCompositeOperation = 'source-over';
    for (const q of falls) { const X = sx(q.i, q.j), Y = sy(q.i, q.j, q.h); if (X < x0 - 80 || X > x1 + 80 || Y < y0 - 40 || Y > y1 + 16 * Math.max(q.dL, q.dR) + 120) continue; const drop = Math.max(q.dL, q.dR) * 16;
      for (let c = 0; c < 4; c++) { const a = hash(q.i, q.j * 3 + c, 218), age = (t * 0.18 + a) % 1; mist(g, X + (a - 0.5) * 50, Y + 30 + drop - age * 44, 40 + age * 40, 14 + age * 10, (1 - age) * 0.5); } }
  }

  // ---------------------------------------------------------------- overlays
  function draw(g, S, R, x0, y0, W, Hh) {
    const f = st(); if (!f || !F.tiles || !nearBiome(R)) return; const t = R.t, N = TWM.N, x1 = x0 + W, y1 = y0 + Hh, storm = f.storm, beacon = f.beacon, wind = f.wind;
    if (!falls) build();
    drawFalls(g, R, f, t, x0, y0, x1, y1);
    // -- river glints and pool ripples
    g.globalCompositeOperation = 'lighter';
    for (const [i, j, h] of streams) { const X = sx(i, j), Y = sy(i, j, h); if (X < x0 - 40 || X > x1 + 40 || Y < y0 - 20 || Y > y1 + 40) continue;
      for (let d = 0; d < 3; d++) { const a = hash(i, j, 219 + d), age = (t * (0.3 + a * 0.3) + a * 3) % 1, fx = X - 18 + age * 36, fy = Y + 16 + Math.sin(age * 6.28 + a * 9) * 3 + (a - 0.5) * 10; if (Math.abs(fx - X) + Math.abs(fy - Y - 16) * 2 > 30) continue; g.fillStyle = `rgba(220,248,252,${0.5 * (1 - Math.abs(age - 0.5) * 1.5)})`; g.fillRect(Math.round(fx), Math.round(fy), 5, 1); } }
    g.globalCompositeOperation = 'source-over';
    // -- mist banks in the gorge and clouds along the ridge (they drift sideways, thicker in the storm)
    const gl = F.gorge; for (let n = 0; n < gl.length; n += 2) { const k = gl[n], i = k % N, j = Math.floor(k / N), X = sx(i, j), Y = sy(i, j, 2); if (X < x0 - 80 || X > x1 + 80 || Y < y0 - 40 || Y > y1 + 60) continue; const a = hash(i, j, 220), ph = t * (0.12 + a * 0.1) + a * 20;
      mist(g, X + Math.sin(ph) * 26, Y + 10 + Math.sin(ph * 0.7 + a) * 5, 90 + a * 50, 26 + a * 10, 0.5 + 0.1 * Math.sin(ph * 1.3) + storm * 0.2); }
    const L = TWM.layout.sdl; for (let n = 0; n < 16; n++) { const a = hash(n, 5, 221), i = L.x0 + 2 + a * (L.w - 4), j = L.y0 + 1 + hash(n, 6, 221) * 15, X = sx(i, j) + Math.sin(t * 0.05 * wind + n) * 80, Y = sy(i, j, 12) - 30 - hash(n, 7, 221) * 30; if (X < x0 - 120 || X > x1 + 120 || Y < y0 - 60 || Y > y1 + 60) continue; mist(g, X, Y, 150 + a * 100, 40, 0.24 + storm * 0.2); }
    // -- witchfire on every brazier, small torches on the walls, banners' cloth already sways through the sprite layer
    const bamt = 0.85 + 0.45 * beacon + 0.1 * Math.sin(t * 3);
    for (const s of R.statics) { const p = s.p; if (p.kind === 'sdlbrazier') { const X = s.X + s.sp.w * 0.5, Y = s.Y + s.sp.h * 0.3; if (inView(R, X, Y, 80)) flame(g, X, Y, 1.05, t, p.i * 3 + p.j, bamt); }
      else if (p.kind === 'sdlkeep') { for (const [fx, fy, sd] of [[0.28, 0.75, 1], [0.78, 0.7, 2], [0.5, 0.88, 3]]) { const X = s.X + s.sp.w * fx, Y = s.Y + s.sp.h * fy; if (inView(R, X, Y, 80)) flame(g, X, Y, 1.2, t, sd, bamt * 0.9); } }
      else if (p.kind === 'sdlgate') { for (const [fx, fy, sd] of [[0.54, 0.58, 5]]) { const X = s.X + s.sp.w * fx, Y = s.Y + s.sp.h * fy; if (inView(R, X, Y, 80)) flame(g, X, Y, 1.3, t, sd, (0.5 + 0.4 * beacon)); } } }
    for (const [i, j] of F.torches) { const X = sx(i, j), Y = sy(i, j, TWM.H[TWM.id(i, j)]) + 6; if (X < x0 - 40 || X > x1 + 40 || Y < y0 - 40 || Y > y1 + 40) continue; flame(g, X, Y - 4, 0.55, t, i + j, 0.55 + beacon * 0.5); }
    // -- wall pennants: crimson cloth that streams and snaps in the wind (every 4th wall tile)
    for (let n = 1; n < F.wall.length; n += 4) { const k = F.wall[n], i = k % N, j = Math.floor(k / N), X = sx(i, j), Y = sy(i, j, TWM.H[k]) + 8; if (X < x0 - 50 || X > x1 + 50 || Y < y0 - 60 || Y > y1 + 40) continue;
      const ph = hash(i, j, 222) * 6.28, ln = 12 + Math.round(2 * wind); g.fillStyle = '#2a1a24'; g.fillRect(X, Y - 20, 1, 20); for (let s = 0; s < ln; s++) { const w = 1 + Math.sin(t * (5 + wind * 2) - s * 0.6 + ph) * (1 + s * 0.18 * wind), hgt = 5 - Math.floor(s / 5); g.fillStyle = s % 5 === 0 ? '#e0b24a' : s % 2 ? '#a02a38' : '#8a2230'; g.fillRect(X + 1 + s, Math.round(Y - 19 + w), 1, Math.max(2, hgt)); } }
    // -- campfires at the messes: flame, rising smoke, flying sparks
    for (const p of TWM.pois) if (p.biome === 'sdl' && p.kind === 'mess') { const X = R.wx(p.x, p.y), Y = R.wy(p.x, p.y, TWM.groundZ(p.x, p.y)); if (!inView(R, X, Y, 90)) continue; flame(g, X + 10, Y - 2, 0.9, t, p.x + p.y, 0.8, 1);
      for (let q = 0; q < 8; q++) { const a = hash(Math.floor(p.x), q, 223), age = (t * 0.16 + q / 8 + a * 0.1) % 1, r = 2 + age * 5; g.fillStyle = `rgba(60,54,66,${(1 - age) * 0.32})`; g.fillRect(Math.round(X + 10 + Math.sin(age * 5 + a * 9) * (4 + age * 8) + age * 18 * wind), Math.round(Y - 12 - age * 70), r * 2 | 0, r * 2 - 1 | 0); } }
    // -- the golden nest: drifting gold motes and feathers; the den breathes teal mist; the hall's chimes glitter
    for (const s of R.statics) { const k = s.p.kind;
      if (k === 'sdlnest') { const cx = s.X + s.sp.w * 0.5, cy = s.Y + s.sp.h * 0.2; if (!inView(R, cx, cy, 200)) continue; g.globalCompositeOperation = 'lighter';
        for (let q = 0; q < 22; q++) { const a = hash(q, 3, 224), age = (t * (0.12 + a * 0.1) + a * 7) % 1, X = cx + (a - 0.5) * 80 + Math.sin(age * 6 + q) * 8 + age * 26 * wind, Y = cy + 8 - age * 90; g.fillStyle = `rgba(255,${200 + (q % 4) * 14},90,${Math.sin(age * 3.14) * 0.9})`; g.fillRect(Math.round(X), Math.round(Y), 1 + (q % 5 === 0), 1 + (q % 7 === 0)); }
        g.globalCompositeOperation = 'source-over'; for (let q = 0; q < 4; q++) { const a = hash(q, 8, 225), age = (t * 0.07 + a) % 1, X = cx + (a - 0.5) * 60 + age * 90 * wind, Y = cy + age * 70; g.fillStyle = `rgba(230,170,60,${(1 - age) * 0.9})`; g.fillRect(Math.round(X), Math.round(Y), 3, 1); g.fillRect(Math.round(X) + 1, Math.round(Y) + 1, 2, 1); }
        // crows orbiting the crag
        for (let q = 0; q < 9; q++) { const a = hash(q, 9, 226), ang = t * (0.32 + a * 0.12) + q * 0.7, X = cx + Math.cos(ang) * (80 + a * 70), Y = cy + 30 + Math.sin(ang) * (30 + a * 22) - q * 3; bird(g, X, Y, t, q, 1 + (q % 3 === 0), 'rgba(22,16,28,0.95)'); } }
      else if (k === 'sdlden') { const X = s.X + s.sp.w * 0.5, Y = s.Y + s.sp.h * 0.62; if (!inView(R, X, Y, 120)) continue; for (let q = 0; q < 7; q++) { const a = hash(q, 4, 227), age = (t * 0.22 + q / 7 + a * 0.1) % 1; mist(g, X + (a - 0.5) * 24 - age * 20, Y + age * 22, 22 + age * 26, 10 + age * 8, (1 - age) * 0.5); }
        g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(90,255,230,${0.12 + 0.08 * Math.sin(t * 1.5)})`; g.fillRect(Math.round(s.X + s.sp.w * 0.33), Math.round(s.Y + s.sp.h * 0.33), 14, 3); g.fillRect(Math.round(s.X + s.sp.w * 0.56), Math.round(s.Y + s.sp.h * 0.33), 14, 3); g.globalCompositeOperation = 'source-over'; }
      else if (k === 'sdltusk') { const cx = s.X + s.sp.w * 0.5, cy = s.Y + s.sp.h * 0.4; if (!inView(R, cx, cy, 160)) continue; g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 8; q++) { const a = hash(q, 5, 228), tw = Math.sin(t * (2 + a * 3) + q * 2); if (tw < 0.5) continue; g.fillStyle = `rgba(255,248,220,${(tw - 0.5) * 1.6})`; g.fillRect(Math.round(cx + (a - 0.5) * 120), Math.round(cy + (hash(q, 6, 228) - 0.3) * 90), 1, 1); g.fillRect(Math.round(cx + (a - 0.5) * 120) - 1, Math.round(cy + (hash(q, 6, 228) - 0.3) * 90), 3, 1); } g.globalCompositeOperation = 'source-over'; } }
    // -- mire bubbles
    g.globalCompositeOperation = 'lighter'; for (const [i, j, h] of mires) { const X = sx(i, j), Y = sy(i, j, h); if (X < x0 - 40 || X > x1 + 40 || Y < y0 - 20 || Y > y1 + 40) continue; const a = hash(i, j, 229), age = (t * (0.4 + a * 0.3) + a * 9) % 1; if (age > 0.5) continue; const r = Math.round(age / 0.5 * 2 + 1); g.fillStyle = `rgba(130,255,140,${(1 - age / 0.5) * 0.7})`; g.fillRect(Math.round(X - 10 + a * 20 - r), Math.round(Y + 12 + a * 10), r * 2, 1); } g.globalCompositeOperation = 'source-over';
    // -- wind-blown dead leaves and dust racing across the view (screen-space wrap), more in the storm
    const nLeaf = Math.round(26 * wind * (1 + storm)); for (let q = 0; q < nLeaf; q++) { const a = hash(q, 3, 230), b = hash(q, 4, 230), age = (t * (0.05 + a * 0.05) * wind + b) % 1, X = x0 + ((a * W * 1.3 + age * 520 * wind) % (W + 60)) - 30, Y = y0 + b * Hh * 0.9 + Math.sin(age * 20 + q) * 8 + age * 70; g.fillStyle = q % 3 ? `rgba(150,138,104,${0.6})` : `rgba(120,100,84,0.6)`; g.fillRect(Math.round(X), Math.round(Y), 2, 1); g.fillRect(Math.round(X) - 1, Math.round(Y) + 1, 1, 1); }
    // -- distant flocks crossing the ridge line
    for (let n = 0; n < 2; n++) { const dir = n ? -1 : 1, bx = x0 + (((t * 22 * dir + n * 640) % (W + 400)) + W + 400) % (W + 400) - 200, by = y0 + Hh * (0.18 + n * 0.12); for (let q = 0; q < 6; q++) bird(g, bx + q * 14 * dir + Math.sin(q) * 5, by + (q % 3) * 8 - q * 2, t, q + n * 3, 1, 'rgba(24,18,32,0.85)'); }
    // -- the roc's shadow gliding over the camp
    for (const s of f.shadows) { const X = R.wx(s.x, s.y), Y = R.wy(s.x, s.y, TWM.groundZ(s.x, s.y)); if (!inView(R, X, Y, 300)) continue; const k = Math.min(1, s.t / 3, (s.life - s.t) / 3), fl = Math.sin(t * 4) * 6; g.fillStyle = `rgba(14,10,22,${0.38 * k})`;
      g.beginPath(); g.ellipse(X, Y, 28, 9, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(X - 6, Y); g.lineTo(X - 90, Y - 14 + fl); g.lineTo(X - 120, Y + 6 + fl); g.lineTo(X - 8, Y + 8); g.closePath(); g.fill(); g.beginPath(); g.moveTo(X + 6, Y); g.lineTo(X + 90, Y - 14 - fl); g.lineTo(X + 120, Y + 6 - fl); g.lineTo(X + 8, Y + 8); g.closePath(); g.fill(); }
    // -- shockwaves: roar (teal-white rings + wind lines), stomp (dust ring), wing (gold feathers); dust bursts where a king lands
    for (const r of f.rings) { const X = R.wx(r.x, r.y), Y = R.wy(r.x, r.y, TWM.groundZ(r.x, r.y)); if (!inView(R, X, Y, 300)) continue; const p = r.t / 1.8, rad = 10 + p * (r.kind === 'stomp' ? 150 : 120), al = (1 - p);
      g.lineWidth = 2; g.strokeStyle = r.kind === 'roar' ? `rgba(170,255,235,${al * 0.8})` : r.kind === 'wing' ? `rgba(255,214,110,${al * 0.8})` : `rgba(180,150,110,${al * 0.8})`; g.beginPath(); g.ellipse(X, Y - 4, rad, rad * 0.5, 0, 0, 7); g.stroke(); g.lineWidth = 1; g.beginPath(); g.ellipse(X, Y - 4, rad * 0.7, rad * 0.35, 0, 0, 7); g.stroke();
      if (r.kind === 'roar') for (let q = 0; q < 10; q++) { const a = q / 10 * 6.28, d = rad * 0.95; g.fillStyle = `rgba(210,255,245,${al * 0.7})`; g.fillRect(Math.round(X + Math.cos(a) * d), Math.round(Y - 4 + Math.sin(a) * d * 0.5), 6, 1); }
      if (r.kind === 'wing') for (let q = 0; q < 8; q++) { const a = hash(q, Math.floor(r.x), 231), d = rad * (0.5 + a * 0.6); g.fillStyle = `rgba(250,196,70,${al})`; g.fillRect(Math.round(X + Math.cos(a * 6.28) * d), Math.round(Y - 10 - p * 30 + Math.sin(a * 6.28) * d * 0.4), 3, 1); }
      if (r.kind === 'stomp') for (let q = 0; q < 14; q++) { const a = q / 14 * 6.28, d = rad * 0.9; g.fillStyle = `rgba(150,128,100,${al * 0.7})`; g.fillRect(Math.round(X + Math.cos(a) * d), Math.round(Y - 4 + Math.sin(a) * d * 0.5 - p * 12), 4, 3); } }
    for (const b of f.bursts) { const X = R.wx(b.x, b.y), Y = R.wy(b.x, b.y, TWM.groundZ(b.x, b.y)), p = b.t / 1.2; if (!inView(R, X, Y, 160)) continue; for (let q = 0; q < 16; q++) { const a = hash(q, Math.floor(b.x), 232), d = 10 + p * 46 * (0.5 + a); g.fillStyle = `rgba(190,180,200,${(1 - p) * 0.55})`; const r = 3 + p * 4; g.fillRect(Math.round(X + Math.cos(a * 6.28) * d - r / 2), Math.round(Y - 6 + Math.sin(a * 6.28) * d * 0.45 - p * 16), r | 0, r | 0); } }
    // -- beacons: tall green light pillars over the five seats while the kings convene
    if (beacon > 0.03) { g.globalCompositeOperation = 'lighter'; for (const [i, j, hh] of [F.keep, F.gate, F.den, F.hall, F.nestAt].map(p => [p[0], p[1], TWM.H[TWM.id(p[0], p[1])]])) { const X = sx(i, j), Y = sy(i, j, hh); if (!inView(R, X, Y, 300)) continue; for (let q = 0; q < 6; q++) { const wv = Math.sin(t * 2 + q + i), w = 30 - q * 4 + wv * 3; g.fillStyle = `rgba(110,255,150,${beacon * (0.08 + q * 0.018)})`; g.fillRect(Math.round(X - w / 2), Math.round(Y - 340 + q * 4), Math.round(w), 340); }
        for (let q = 0; q < 12; q++) { const a = hash(q, i, 233), age = (t * (0.3 + a * 0.3) + a * 5) % 1; g.fillStyle = `rgba(200,255,210,${beacon * (1 - age)})`; g.fillRect(Math.round(X + (a - 0.5) * 14), Math.round(Y - age * 300), 1, 3); } } g.globalCompositeOperation = 'source-over'; }
    // -- storm: a dark violet pall over the biome, wind-driven rain streaks, lightning
    if (storm > 0.03) { g.save(); clip(g, R); g.fillStyle = `rgba(18,10,40,${0.5 * storm})`; g.fillRect(x0, y0, W, Hh);
      const n = Math.round(260 * storm); for (let q = 0; q < n; q++) { const a = hash(q, 5, 234), b = hash(q, 6, 234), age = (t * (1.5 + a * 0.7) + b) % 1, X = x0 + ((a * 9973 + age * 150) % (W + 150)) - 60, Y = y0 + age * (Hh + 50) - 20; g.fillStyle = `rgba(190,200,235,${0.45 * storm})`; g.fillRect(Math.round(X), Math.round(Y), 1, 4); g.fillRect(Math.round(X) - 1, Math.round(Y) + 4, 1, 3); }
      if (f.flash > 0.02) { g.fillStyle = `rgba(220,235,255,${f.flash * 0.36})`; g.fillRect(x0, y0, W, Hh); const bx = x0 + hash(Math.floor(t * 3), 1, 235) * W; g.strokeStyle = `rgba(240,245,255,${f.flash})`; g.lineWidth = 2; g.beginPath(); let lx = bx, ly = y0; g.moveTo(lx, ly); for (let q = 0; q < 9; q++) { lx += (hash(Math.floor(t * 3), q, 236) - 0.5) * 34; ly += Hh / 9; g.lineTo(lx, ly); } g.stroke(); }
      g.restore(); }
  }
  // ---------------------------------------------------------------- night: witchfire, the nest's gold, the den's eyes, the hall's warm lamps, the waterfall's pale glow
  function light(g, S, R, amt) {
    const f = st(); if (!f || !F.tiles || amt < 0.05 || !nearBiome(R)) return; const t = R.t, night = Math.max(0.12, amt);
    const glow = (X, Y, r, a, col) => { if (!inView(R, X, Y, r)) return; const rg = g.createRadialGradient(X, Y, 4, X, Y, r); rg.addColorStop(0, `rgba(${col},${a})`); rg.addColorStop(1, `rgba(${col},0)`); g.fillStyle = rg; g.fillRect(X - r, Y - r, r * 2, r * 2); };
    for (const s of R.statics) { const k = s.p.kind; if (k === 'sdlbrazier') glow(s.X + s.sp.w * 0.5, s.Y + s.sp.h * 0.4, 120, (0.28 + 0.07 * Math.sin(t * 3 + s.p.i)) * night * (1 + f.beacon * 0.6), '90,255,130');
      else if (k === 'sdlkeep') glow(s.X + s.sp.w * 0.5, s.Y + s.sp.h * 0.6, 220, 0.22 * night, '90,255,130'); else if (k === 'sdlgate') glow(s.X + s.sp.w * 0.55, s.Y + s.sp.h * 0.6, 170, 0.2 * night, '100,255,140');
      else if (k === 'sdlnest') glow(s.X + s.sp.w * 0.5, s.Y + s.sp.h * 0.22, 190, (0.22 + 0.05 * Math.sin(t * 1.4)) * night, '255,200,80'); else if (k === 'sdlden') glow(s.X + s.sp.w * 0.5, s.Y + s.sp.h * 0.4, 150, 0.2 * night, '90,255,230');
      else if (k === 'sdltusk') glow(s.X + s.sp.w * 0.5, s.Y + s.sp.h * 0.55, 150, 0.18 * night, '255,230,170'); }
    for (const p of TWM.pois) if (p.biome === 'sdl' && p.kind === 'mess') glow(R.wx(p.x, p.y) + 10, R.wy(p.x, p.y, TWM.groundZ(p.x, p.y)) - 6, 100, (0.26 + 0.06 * Math.sin(t * 6 + p.x)) * night, '255,150,60');
    for (const q of (falls || []).slice(0, 4)) glow(sx(q.i, q.j), sy(q.i, q.j, q.h) + 40, 160, 0.1 * night, '170,230,255');
    if (f.beacon > 0.05) glow(R.wx(F.foc[0] * T, F.foc[1] * T), R.wy(F.foc[0] * T, F.foc[1] * T, 40), 340, 0.22 * f.beacon, '110,255,150');
    for (const r of f.rings) glow(R.wx(r.x, r.y), R.wy(r.x, r.y, 8), 110, (1 - r.t / 1.8) * 0.4, r.kind === 'wing' ? '255,200,80' : '170,255,235');
  }
  window.TWFX = window.TWFX || {}; TWFX.lion = { draw, light };
})();
