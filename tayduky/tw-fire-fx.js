'use strict';
// ===== Tây Du Ký v2 — Hỏa Diệm Sơn: living effects (render only; loaded after tw-fx.js) =====
// Everything here READS TWS.fire / TWM.fire (tw-fire-data.js); nothing drives behaviour. Layers: lava flow + pulse, glowing cracks, smoke columns, drifting embers,
// heat shimmer, flame bursts, ash whirlwinds, the fan's gust, the seven rune lights of the 49 strokes, real rain with splashes, cooling steam, night glows.
// The TERRAIN part of the transformation is baked art (tw-fire-art.js); this module only tells the renderer which ground chunks are stale (TWFX.fire.stale).
(function () {
  const A = TWA, hash = TWM.hash2, F = TWM.fire, st = () => window.TWS && TWS.fire, T = 8;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
  let chunkSet = null;
  function buildChunkSet() {
    chunkSet = new Set(); const N = TWM.N, CH = A.CH;
    for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), h = TWM.H[k], sx = A.SX(i, j), sy = A.SY(i, j, h);
      for (let cj = Math.floor(sy / CH); cj <= Math.floor((sy + 40 + Math.max(0, h) * 16) / CH); cj++) for (let ci = Math.floor((sx - 32) / CH); ci <= Math.floor((sx + 32) / CH); ci++) chunkSet.add(ci + ',' + cj); }
  }
  const stale = c => { const f = st(); if (!f) return false; if (!chunkSet) buildChunkSet(); return chunkSet.has(c.ci + ',' + c.cj) && c.fireVer !== f.ver; };
  const mark = c => { const f = st(); if (f) c.fireVer = f.ver; };
  const sx = (i, j) => A.SX(i, j), sy = (i, j, h) => A.SY(i, j, h);
  const inView = (R, x, y, m) => x > R.cx - R.cv.width / 2 - m && x < R.cx + R.cv.width / 2 + m && y > R.cy - R.cv.height / 2 - m && y < R.cy + R.cv.height / 2 + m;
  const biomePoly = (R) => { const L = TWM.layout.hds, pts = []; for (let n = 0; n < 28; n++) { const a = n / 28 * Math.PI * 2, i = L.x0 + L.cx + Math.cos(a) * L.rx, j = L.y0 + L.cy + Math.sin(a) * L.ry; pts.push([R.wx(i * T, j * T), R.wy(i * T, j * T, 12)]); } return pts; };
  const clipBiome = (g, R) => { const p = biomePoly(R); g.beginPath(); p.forEach(([x, y], n) => n ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip(); };

  function nearBiome(R) { const L = TWM.layout.hds, cx = R.wx((L.x0 + L.cx) * T, (L.y0 + L.cy) * T), cy = R.wy((L.x0 + L.cx) * T, (L.y0 + L.cy) * T, 20); return Math.hypot(R.cx - cx, R.cy - cy) < 1700; }

  // ---------------------------------------------------------------- living fire: a pixel flame with flickering tongues, a breathing glow, sparks and rising smoke
  // (amt 0..1 scales size; the flame burns out as the land cools). Drawn over the sprite so the baked art never looks like a sticker.
  function flame(g, X, Y, sc, t, seed, amt) {
    if (amt < 0.03) return; const tongues = 5, ph = seed * 7.3;
    g.globalCompositeOperation = 'lighter';
    const rg = g.createRadialGradient(X, Y - 6 * sc, 2, X, Y - 6 * sc, 30 * sc); const br = (0.22 + 0.1 * Math.sin(t * 5 + ph) + 0.05 * Math.sin(t * 13 + ph)) * amt; rg.addColorStop(0, `rgba(255,150,50,${br})`); rg.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = rg; g.fillRect(X - 30 * sc, Y - 36 * sc, 60 * sc, 60 * sc);
    for (let q = 0; q < tongues; q++) {
      const o = (q - (tongues - 1) / 2) * 3.2 * sc, fl = 0.5 + 0.5 * Math.sin(t * (7 + q * 1.7) + ph + q * 2.1) * Math.sin(t * 3.1 + q), h = (9 + 11 * fl + (q === 2 ? 7 : 0)) * sc * amt, w0 = (4.2 - Math.abs(q - 2) * 0.7) * sc;
      for (let y = 0; y < h; y += 2) { const f = y / h, w = w0 * (1 - f * 0.85) * (1 + 0.2 * Math.sin(t * 20 + y + q)), sway = Math.sin(t * 6 + q * 1.3 + y * 0.3 + ph) * f * 2.2 * sc; const col = f < 0.3 ? '255,214,110' : f < 0.6 ? '255,160,50' : '236,70,26';
        g.fillStyle = `rgba(${col},${(1 - f * 0.6) * 0.8 * Math.min(1, amt * 1.4)})`; g.fillRect(Math.round(X + o + sway - w / 2), Math.round(Y - y - 2), Math.max(1, Math.round(w)), 2); } }
    for (let q = 0; q < 6; q++) { const a = hash(seed * 31 + q, 9, 140), age = (t * (0.7 + a * 0.6) + a * 5) % 1; g.fillStyle = `rgba(255,${190 + (q & 1) * 50},90,${(1 - age) * amt})`; g.fillRect(Math.round(X + (a - 0.5) * 14 * sc + Math.sin(age * 9 + q) * 3), Math.round(Y - 8 * sc - age * 38 * sc), 1, 1 + (q % 3 === 0)); }
    g.globalCompositeOperation = 'source-over';
  }
  // bubbling lava pool: bubbles swell and pop at random points of the vent's pool
  function bubbles(g, X, Y, t, seed, amt) { if (amt < 0.05) return; for (let q = 0; q < 4; q++) { const a = hash(seed, q, 150), age = (t * (0.6 + a * 0.5) + a * 9) % 1; if (age > 0.6) continue; const r = Math.round(age / 0.6 * 3 + 1), bx = X + (a - 0.5) * 22, by = Y + (hash(seed, q, 151) - 0.5) * 8; g.fillStyle = `rgba(255,${200 + Math.floor(a * 50)},110,${(1 - age / 0.6) * 0.85 * amt})`; g.fillRect(Math.round(bx - r), Math.round(by), r * 2, 1); g.fillRect(Math.round(bx - r + 1), Math.round(by) - 1, r * 2 - 2, 1); g.fillStyle = 'rgba(255,250,200,0.9)'; if (age > 0.45) { g.fillRect(Math.round(bx - r - 1), Math.round(by) - 3, 1, 1); g.fillRect(Math.round(bx + r), Math.round(by) - 3, 1, 1); } } }
  // volcano craters (from the placed landmark sprites): eruption fountains, a breathing heat aura and thick smoke
  const CRATER = { hds_volcano_a: [0.5, 0.3], hds_volcano_b: [0.63, 0.33] };
  function craters(R) { const out = [], names = A.IMGKINDS.hdsvolcano.filter(n => A.IMG[n]); for (const s of R.statics) if (s.p.kind === 'hdsvolcano') { const nm = names[(s.p.v || 0) % names.length], c = CRATER[nm] || [0.5, 0.3]; out.push({ X: s.X + s.sp.w * c[0], Y: s.Y + s.sp.h * c[1], sc: s.sp.w / 230, id: s.p.v | 0 }); } return out; }
  function gateFlames(g, R, f, t) { const cool = clamp(f.g * 1.5, 0, 1); for (const s of R.statics) if (s.p.kind === 'hdspalace') for (const [fx, fy, sc, sd] of [[0.297, 0.215, 1.5, 1], [0.708, 0.105, 1.5, 2]]) { const X = s.X + s.sp.w * fx, Y = s.Y + s.sp.h * fy; if (inView(R, X, Y, 80)) flame(g, X, Y, sc, t, sd, (0.85 + 0.15 * f.heat) * (1 - cool * 0.65)); } }
  function eruptions(g, R, f, t, x0, y0, W, Hh) {
    for (const c of craters(R)) { if (!inView(R, c.X, c.Y, 300)) continue; const cool = clamp(f.g * 1.5, 0, 1), live = 1 - cool, cyc = (t * 0.11 + c.id * 0.37) % 1, burst = cyc < 0.22 ? Math.sin(cyc / 0.22 * Math.PI) : 0, amt = live * (0.55 + 0.45 * burst + f.heat * 0.4);
      g.globalCompositeOperation = 'lighter';
      // heat aura: a wide breathing halo around the crater
      let rg = g.createRadialGradient(c.X, c.Y, 6, c.X, c.Y, 150 * c.sc); rg.addColorStop(0, `rgba(255,120,40,${(0.2 + 0.07 * Math.sin(t * 1.6 + c.id)) * amt})`); rg.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = rg; g.fillRect(c.X - 150 * c.sc, c.Y - 150 * c.sc, 300 * c.sc, 300 * c.sc);
      // lava fountain: ballistic sparks thrown up and out
      const n = Math.round(46 * amt * (0.4 + burst)); for (let q = 0; q < n; q++) { const a = hash(q, c.id, 141), b = hash(q, c.id, 142), age = (t * (0.8 + a * 0.5) + b * 7) % 1, vx = (a - 0.5) * 70 * c.sc, vy = -(60 + b * 80) * c.sc, X = c.X + vx * age, Y = c.Y + vy * age + 150 * c.sc * age * age * 0.7;
        g.fillStyle = `rgba(255,${160 + Math.floor(b * 80)},${60 + Math.floor(a * 60)},${(1 - age) * 0.9})`; g.fillRect(Math.round(X), Math.round(Y), 2, 2); if (q % 3 === 0) g.fillRect(Math.round(X), Math.round(Y) + 2, 1, 2); }
      // the crater mouth flickers
      g.globalCompositeOperation = 'source-over'; flame(g, c.X, c.Y + 8 * c.sc, 1.3 * c.sc, t, 20 + c.id, amt * 0.75);
      // thick smoke column leaning with the wind, darker and larger than a vent's
      for (let q = 0; q < 16; q++) { const a = hash(q, c.id, 143), age = (t * 0.1 + q / 16 + a * 0.1) % 1, X = c.X + Math.sin(age * 4 + a * 9) * (8 + age * 20) * c.sc + age * 70 * f.wind * c.sc, Y = c.Y - 6 - age * 190 * c.sc, r = Math.min(14, (4 + age * 10) * c.sc | 0), al = (1 - age) * (0.42 + 0.15 * burst) * (1 - cool * 0.85);
        if (al < 0.02) continue; g.fillStyle = `rgba(54,44,50,${al})`; g.fillRect(Math.round(X - r), Math.round(Y - r), r * 2, r * 2 - 1); g.fillStyle = `rgba(120,100,104,${al * 0.5})`; g.fillRect(Math.round(X - r), Math.round(Y - r), r, 1); } } }

  // ---------------------------------------------------------------- overlays (drawn in world space, over the ground and the sorted objects)
  function draw(g, S, R, x0, y0, W, Hh) {
    const f = st(); if (!f || !F.tiles || !nearBiome(R)) return; const t = R.t, N = TWM.N, cool = clamp(f.g * 1.5, 0, 1), heat = f.heat;
    const x1 = x0 + W, y1 = y0 + Hh;
    // -- lava: pulsing glow and flowing sparks on every visible lava tile (fades as the lava crusts over and turns to rain pools)
    const lavaAmt = 1 - clamp(f.g * 1.7, 0, 1);
    if (lavaAmt > 0.02) {
      g.globalCompositeOperation = 'lighter';
      for (let n = 0; n < F.lava.length; n++) { const k = F.lava[n], i = k % N, j = Math.floor(k / N), X = sx(i, j), Y = sy(i, j, TWM.H[k]); if (X < x0 - 40 || X > x1 + 40 || Y < y0 - 40 || Y > y1 + 40) continue;
        const ph = hash(i, j, 110) * 6.28, pulse = 0.5 + 0.5 * Math.sin(t * 1.3 + ph);
        g.fillStyle = `rgba(255,110,30,${(0.06 + 0.09 * pulse) * lavaAmt * (1 + heat * 0.8)})`; g.beginPath(); g.moveTo(X, Y); g.lineTo(X + 32, Y + 16); g.lineTo(X, Y + 32); g.lineTo(X - 32, Y + 16); g.closePath(); g.fill();
        for (let d = 0; d < 5; d++) { const a = hash(i, j, 111 + d), age = (t * (0.16 + a * 0.1) + a * 3) % 1, fx = X - 24 + age * 48, fy = Y + 16 + Math.sin(age * 6.28 + a * 9) * 5 + (a - 0.5) * 10; if (Math.abs(fx - X) + Math.abs(fy - Y - 16) * 2 > 30) continue;
          g.fillStyle = `rgba(255,${200 + Math.floor(a * 55)},120,${0.75 * lavaAmt * (1 - Math.abs(age - 0.5) * 1.4)})`; g.fillRect(Math.round(fx), Math.round(fy), 7, 1); g.fillRect(Math.round(fx) + 2, Math.round(fy) + 1, 4, 1); } }
      g.globalCompositeOperation = 'source-over';
    }
    // -- cracks: glowing seams breathe (brighter while it heats up, dying out with the greening)
    if (cool < 0.9) { g.globalCompositeOperation = 'lighter';
      for (const k of F.cracks) { const i = k % N, j = Math.floor(k / N), X = sx(i, j), Y = sy(i, j, TWM.H[k]); if (X < x0 - 40 || X > x1 + 40 || Y < y0 - 20 || Y > y1 + 40) continue;
        const ph = hash(i, j, 112) * 6.28, a = (0.1 + 0.2 * heat) * (0.55 + 0.45 * Math.sin(t * 1.8 + ph)) * (1 - cool); if (a < 0.015) continue;
        g.fillStyle = `rgba(255,150,50,${a})`; const o = hash(i, j, 113); let cx = X - 14 + o * 8, cy = Y + 8 + hash(i, j, 114) * 10; for (let s = 0; s < 6; s++) { g.fillRect(Math.round(cx), Math.round(cy), 3, 1); cx += 2 + (s & 1) * 2; cy += (s % 3 === 1 ? -1 : 1) * (s & 1); } }
      g.globalCompositeOperation = 'source-over'; }
    // -- smoke columns: vents (small), the two peaks (large) and the palace braziers; thinner as the ground cools
    const smoke = (bx, by, scale, dark) => { if (!inView(R, bx, by - 200 * scale, 160)) return; const n = Math.round(10 * scale);
      for (let q = 0; q < n; q++) { const a = hash(Math.floor(bx), q, 115), age = (t * 0.14 + q / n + a * 0.2) % 1, X = bx + Math.sin(age * 5 + a * 9) * (5 + age * 12) * scale + age * 30 * f.wind * scale, Y = by - age * 120 * scale, r = Math.min(8, (2 + age * 5) * scale | 0), al = (1 - age) * (dark ? 0.38 : 0.26) * (1 - cool * 0.8) * (1 + heat * 0.5);
        if (al < 0.02) continue; g.fillStyle = dark ? `rgba(46,38,44,${al})` : `rgba(150,140,140,${al})`; g.fillRect(Math.round(X - r), Math.round(Y - r), r * 2, r * 2 - 1); g.fillStyle = `rgba(255,255,255,${al * 0.25})`; g.fillRect(Math.round(X - r), Math.round(Y - r), r, 1); } };
    for (const v of F.vents) { const X = R.wx((v[0] + 0.5) * T, (v[1] + 0.5) * T), Y = R.wy((v[0] + 0.5) * T, (v[1] + 0.5) * T, TWM.H[TWM.id(v[0], v[1])] * 4); smoke(X, Y - 14, 0.9, false); if (inView(R, X, Y, 80)) flame(g, X, Y - 10, 1.25, t, v[0] * 3 + v[1], (0.75 + 0.3 * heat) * (1 - cool)); bubbles(g, X, Y - 6, t, v[0] + v[1], 1 - cool); }
    for (const p of F.edgeVents || []) { const X = R.wx((p[0] + 0.5) * T, (p[1] + 0.5) * T), Y = R.wy((p[0] + 0.5) * T, (p[1] + 0.5) * T, TWM.H[TWM.id(p[0], p[1])] * 4); if (inView(R, X, Y, 80)) flame(g, X, Y - 10, 1.1, t, p[0] + p[1], (0.7 + 0.3 * heat) * (1 - cool)); bubbles(g, X, Y - 6, t, p[0] + p[1], 1 - cool); }
    eruptions(g, R, f, t, x0, y0, W, Hh); gateFlames(g, R, f, t);
    // -- embers drift up and sideways across the view (screen-space wrap), more when hot, none once the rain falls
    const emberAmt = clamp(1 - f.g * 1.3, 0, 1) * (0.55 + heat * 0.9) * (1 + R.dark * 0.6);
    if (emberAmt > 0.04) { const n = Math.round(70 * emberAmt); for (let q = 0; q < n; q++) { const a = hash(q, 3, 116), b = hash(q, 4, 116), age = (t * (0.05 + a * 0.05) + b) % 1, X = x0 + ((a * W * 1.3 + age * 300 * f.wind) % (W + 40)) - 20, Y = y1 - age * (Hh + 60) + Math.sin(t + q) * 6, bright = Math.sin(age * 3.14);
      g.fillStyle = q % 3 ? `rgba(255,${150 + (q % 5) * 20},60,${0.8 * bright})` : `rgba(255,230,160,${0.9 * bright})`; g.fillRect(Math.round(X), Math.round(Y), 1 + (q % 4 === 0), 1 + (q % 7 === 0)); } }
    // -- heat shimmer: faint rising, wavering streaks above the lake and the peaks (the refracting air), only while the ground is hot
    if (lavaAmt > 0.2 && F.lake) for (const [bx, by, wd] of [[sx(F.lake[0], F.lake[1]), sy(F.lake[0], F.lake[1], 2), 120], ...F.peaks.map(p => [sx(p[0], p[1]), sy(p[0], p[1], TWM.H[TWM.id(p[0], p[1])]) - 20, 70])]) { if (!inView(R, bx, by, 240)) continue;
      for (let q = 0; q < 9; q++) { const a = hash(q, Math.floor(bx), 122), age = (t * 0.25 + a) % 1, X = bx + (a - 0.5) * wd * 2 + Math.sin(age * 12 + q) * 3, Y = by - age * 70; g.fillStyle = `rgba(255,214,170,${0.07 * (1 - age) * lavaAmt})`; g.fillRect(Math.round(X), Math.round(Y), 1, 14); g.fillRect(Math.round(X) + 1, Math.round(Y) + 5, 1, 9); } }
    // -- flame bursts
    for (const b of f.bursts) { const X = R.wx(b.x, b.y), Y = R.wy(b.x, b.y, TWM.groundZ(b.x, b.y)); if (!inView(R, X, Y, 80)) continue; const p = b.t / 1.6, h = Math.sin(Math.min(1, p * 1.6) * Math.PI) * 46;
      g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 14; q++) { const a = hash(q, Math.floor(b.x), 117), w = (1 - p) * (7 - q * 0.35), yy = Y - (q / 14) * h, xx = X + Math.sin(q * 1.3 + t * 12) * (1.6 + q * 0.25); if (w < 0.8) continue; g.fillStyle = `rgba(255,${q > 9 ? 230 : q > 4 ? 160 : 90},${q > 9 ? 150 : 40},${(1 - p) * 0.8})`; g.fillRect(Math.round(xx - w), Math.round(yy), Math.round(w * 2), 3); }
      for (let q = 0; q < 8; q++) { const a = hash(q, 7, 118), age = clamp(p * 1.3 - a * 0.2, 0, 1); g.fillStyle = `rgba(255,220,120,${1 - age})`; g.fillRect(Math.round(X + (a - 0.5) * 50 * age * 2), Math.round(Y - h * 0.5 - age * 40 + age * age * 50), 1, 1); }
      g.globalCompositeOperation = 'source-over'; }
    // -- ash whirlwinds
    for (const w of f.whirls) { const X = R.wx(w.x, w.y), Y = R.wy(w.x, w.y, TWM.groundZ(w.x, w.y)); if (!inView(R, X, Y, 120)) continue; const k = Math.min(1, w.t / 3, (w.life - w.t) / 3);
      for (let q = 0; q < 46; q++) { const a = q / 46, ang = t * 7 + a * 18 + q, rad = (3 + a * 15) * k, X2 = X + Math.cos(ang) * rad, Y2 = Y - a * 58 * k + Math.sin(ang) * rad * 0.4; g.fillStyle = q % 4 ? `rgba(90,76,72,${0.7 * k})` : `rgba(255,150,60,${0.8 * k})`; g.fillRect(Math.round(X2), Math.round(Y2), 2, 2 - (q % 3 === 0 ? 1 : 0)); } }
    // -- cooling steam and oven smoke puffs
    for (const p of f.puffs) { const X = R.wx(p.x, p.y), Y = R.wy(p.x, p.y, TWM.groundZ(p.x, p.y)) - 4; if (!inView(R, X, Y, 80)) continue; const a = p.t / 2.4; for (let q = 0; q < 5; q++) { const r = 2 + a * 6 + q, X2 = X + Math.sin(q * 2 + a * 4) * 6 * a, Y2 = Y - a * 44 - q * 3; g.fillStyle = `rgba(240,240,244,${(1 - a) * 0.34})`; g.fillRect(Math.round(X2 - r), Math.round(Y2 - r), r * 2, r * 2 - 1); } }
    // steam hiss over the lava while it cools
    if (f.g > 0.05 && f.g < 0.95) for (let n = 0; n < F.lava.length; n += 3) { const k = F.lava[n], i = k % N, j = Math.floor(k / N), X = sx(i, j), Y = sy(i, j, TWM.H[k]); if (X < x0 - 40 || X > x1 + 40 || Y < y0 - 60 || Y > y1 + 60) continue; const a = hash(i, j, 119), age = (t * 0.4 + a) % 1, amt = Math.sin(f.g * 3.14) * (1 - age);
      g.fillStyle = `rgba(236,240,246,${amt * 0.34})`; const r = 3 + age * 7; g.fillRect(Math.round(X + (a - 0.5) * 30), Math.round(Y + 4 - age * 52), Math.round(r * 2), Math.round(r * 2) - 1); }
    // -- the fan's gust: pale curved wind lines sweep from the fan to the target; a leaf-green tint on the lines
    for (const q of f.gusts) { const X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, 10), X2 = R.wx(q.tx, q.ty), Y2 = R.wy(q.tx, q.ty, 10), p = q.t / 1.4; if (!inView(R, X, Y, 600)) continue;
      for (let r = 0; r < 7; r++) { const a = clamp(p * 1.5 - r * 0.05, 0, 1); if (a <= 0 || a >= 1) continue; const cx = X + (X2 - X) * a, cy = Y + (Y2 - Y) * a + Math.sin(a * 9 + r) * 8 - 8 * r + 22; g.fillStyle = `rgba(236,255,236,${(1 - a) * 0.85})`; for (let s = 0; s < 14; s++) g.fillRect(Math.round(cx - s * (X2 - X) / 140), Math.round(cy - s * (Y2 - Y) / 140 + Math.sin(s * 0.6 + r) * 1.5), 3, 1); } }
    // -- the seven rune lights of the 49 strokes
    if (f.fanPips !== undefined && f.fanBy) { const a = f.fanBy; if (!a.hidden && a.hasFan) { const X = R.wx(a.x, a.y), Y = R.wy(a.x, a.y, (TWM.groundZ(a.x, a.y)) + (a.lift || 0)) - 66; for (let q = 0; q < 7; q++) { const ang = Math.PI * (1.12 + q * 0.13), rx = X + Math.cos(ang) * 22, ry = Y + Math.sin(ang) * 11 - 4, on = q < f.fanPips; g.fillStyle = on ? `rgba(255,232,150,${0.7 + 0.3 * Math.sin(t * 6 + q)})` : 'rgba(120,100,90,0.55)'; g.fillRect(Math.round(rx) - 1, Math.round(ry) - 1, 3, 3); if (on) { g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(Math.round(rx), Math.round(ry), 1, 1); } } } }
    // -- rain: real falling drops over the biome, splashes on the ground, a cool blue-grey light
    if (f.rain > 0.02) { g.save(); clipBiome(g, R); const n = Math.round(420 * f.rain);
      g.fillStyle = `rgba(150,180,215,${0.1 * f.rain})`; g.fillRect(x0, y0, W, Hh);
      for (let q = 0; q < n; q++) { const a = hash(q, 5, 120), b = hash(q, 6, 120), age = (t * (1.4 + a * 0.6) + b) % 1, X = x0 + ((a * 9973 + age * 90) % (W + 90)) - 40, Y = y0 + age * (Hh + 50) - 20; g.fillStyle = q % 5 ? `rgba(196,222,248,${0.55 * f.rain})` : `rgba(255,255,255,${0.7 * f.rain})`; g.fillRect(Math.round(X), Math.round(Y), 1, 3 + (q & 1)); g.fillRect(Math.round(X) - 1, Math.round(Y) + 3, 1, 2); }
      for (let q = 0; q < n * 0.35; q++) { const a = hash(q, 7, 121), b = hash(q, 8, 121), age = (t * 1.6 + b * 3 + a) % 1, X = x0 + a * W, Y = y0 + 40 + b * (Hh - 60); if (age > 0.4) continue; const r = age * 8; g.fillStyle = `rgba(220,240,255,${(0.4 - age) * 1.4 * f.rain})`; g.fillRect(Math.round(X - r), Math.round(Y), Math.round(r * 2), 1); g.fillRect(Math.round(X - r * 0.5), Math.round(Y) - 1, Math.round(r), 1); }
      g.restore(); }
    // -- warm haze over the whole biome while it burns hot
    if (heat > 0.05 && lavaAmt > 0.1) { g.save(); clipBiome(g, R); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,90,20,${0.035 * heat + 0.015 * Math.sin(t * 1.1) * heat})`; g.fillRect(x0, y0, W, Hh); g.restore(); }
  }

  // Wukong's borrowed fan (held in the right hand while he is carrying it); the princess's own fan is part of her sprite
  function drawFan(g, a, X, Y, px0, py0) {
    const sw = a.fanning || 0, ang = sw * 0.6, cx = X + px0 + (a.dir === 'left' ? -9 : 9), cy = Y + py0 - 22 + (a.pose === 'act' ? -3 : 0), r = 11; g.save(); g.translate(cx, cy); g.rotate(ang + (a.dir === 'left' ? -0.5 : 0.5));
    g.fillStyle = '#2a1726'; g.beginPath(); g.moveTo(0, 5); g.lineTo(-r - 1, -r + 3); g.quadraticCurveTo(0, -r - 5, r + 1, -r + 3); g.closePath(); g.fill();
    g.fillStyle = '#5aa84a'; g.beginPath(); g.moveTo(0, 4); g.lineTo(-r, -r + 3); g.quadraticCurveTo(0, -r - 3, r, -r + 3); g.closePath(); g.fill(); g.strokeStyle = '#d8b04a'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = '#2f6a34'; g.beginPath(); for (let q = -2; q <= 2; q++) { g.moveTo(0, 4); g.lineTo(q * 4.5, -r + 2); } g.stroke(); g.restore();
  }

  // ---------------------------------------------------------------- night: lava, vents, the palace braziers and the lake glow (not lit by the cheap generic pass alone)
  function light(g, S, R, amt) {
    const f = st(); if (!f || !F.tiles || amt < 0.05 || !nearBiome(R)) return; const t = R.t, lavaAmt = 1 - clamp(f.g * 1.7, 0, 1), night = Math.max(0.12, amt);
    const glow = (X, Y, r, a, col) => { if (!inView(R, X, Y, r)) return; const rg = g.createRadialGradient(X, Y, 4, X, Y, r); rg.addColorStop(0, `rgba(${col},${a})`); rg.addColorStop(1, `rgba(${col},0)`); g.fillStyle = rg; g.fillRect(X - r, Y - r, r * 2, r * 2); };
    if (F.lake) glow(sx(F.lake[0], F.lake[1]), sy(F.lake[0], F.lake[1], 2) + 10, 260, (0.2 + 0.08 * Math.sin(t * 1.2)) * night * lavaAmt * (1 + f.heat * 0.5), '255,110,30');
    if (F.palace) glow(sx(F.palace[0], F.palace[1]), sy(F.palace[0], F.palace[1], 8) - 20, 190, (0.16 + 0.05 * Math.sin(t * 2)) * night, '255,170,80');
    for (const p of F.peaks) glow(sx(p[0], p[1]), sy(p[0], p[1], TWM.H[TWM.id(p[0], p[1])]) - 60, 200, (0.14 + 0.06 * Math.sin(t * 1.7 + p[0])) * night * lavaAmt, '255,100,30');
    const N = TWM.N; for (let n = 0; n < F.lava.length; n += 3) { const k = F.lava[n], i = k % N, j = Math.floor(k / N); glow(sx(i, j), sy(i, j, TWM.H[k]) + 14, 70, 0.17 * night * lavaAmt, '255,120,40'); }
    for (const b of f.bursts) glow(R.wx(b.x, b.y), R.wy(b.x, b.y, 8), 90, (1 - b.t / 1.6) * 0.5, '255,170,70');
    if (f.rain > 0.1) { g.fillStyle = `rgba(30,50,90,${0.1 * f.rain})`; }
  }
  window.TWFX = window.TWFX || {}; TWFX.fire = { draw, light, drawFan, stale, mark };
})();
