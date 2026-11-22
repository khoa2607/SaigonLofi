'use strict';
// ===== Tây Du Ký v2 — Thông Thiên Hà: living effects (render only; loaded after tw-fx.js) =====
// Reads TWS.river / TWM.river; nothing here drives behaviour. Layers: drifting wave crests over every river tile (heavier with the surge), white-water rapids, the whirlpool,
// shore foam, the cascades and the great cataract with its rising mist, debris / fish shadows / ducks / cranes, moored and loose boats (bobbing), lantern posts, camp fires,
// the tower's beacon, the shrine's wisps, floating lanterns, a leaping carp, river-imp peeks, ripples / wakes / splashes, wind streaks and cloud shadows, the storm (rain,
// lightning) of the signature, and THE DIVINE TURTLE (drawn in the depth sort so the pilgrims ride on its shell).
(function () {
  const A = TWA, hash = TWM.hash2, F = TWM.river, st = () => window.TWS && TWS.river, T = 8, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), M = TWM.M;
  const sx = (i, j) => A.SX(i, j), sy = (i, j, h) => A.SY(i, j, h);
  const inView = (R, x, y, m) => x > R.cx - R.cv.width / 2 - m && x < R.cx + R.cv.width / 2 + m && y > R.cy - R.cv.height / 2 - m && y < R.cy + R.cv.height / 2 + m;
  const nearBiome = R => { const L = TWM.layout.tth, cx = R.wx((L.x0 + L.cx) * T, (L.y0 + L.cy) * T), cy = R.wy((L.x0 + L.cx) * T, (L.y0 + L.cy) * T, 0); return Math.hypot(R.cx - cx, R.cy - cy) < 2200; };
  const TW = (a, b) => [(F.x0 + a + 0.5) * T, (F.y0 + b + 0.5) * T];
  let cloudCv = null; const cloud = () => { if (cloudCv) return cloudCv; const c = document.createElement('canvas'); c.width = 96; c.height = 32; const g = c.getContext('2d'); for (let n = 0; n < 6; n++) { g.fillStyle = 'rgba(226,238,250,0.13)'; const w = 94 - n * 10, h = 30 - n * 3.6; g.beginPath(); g.ellipse(48, 16, w / 2, h / 2, 0, 0, 7); g.fill(); } cloudCv = c; return c; };
  const mist = (g, x, y, w, h, a) => { if (a < 0.01) return; g.globalAlpha = a; g.drawImage(cloud(), Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h)); g.globalAlpha = 1; };
  // slanted crest (iso i-direction: slope 1/2) drawn as 2-px steps
  const crest = (g, x, y, w) => { for (let s = 0; s < w; s += 2) g.fillRect(Math.round(x + s), Math.round(y + s * 0.5), 2, 1); };
  // ---------------------------------------------------------------- tile lists
  let water = null, falls = null, rapids = null, rim = null;
  function build() {
    const N = TWM.N, Hh = TWM.H, MAT = TWM.MAT, lo = (i, j) => TWM.inMap(i, j) && MAT[TWM.id(i, j)] !== M.VOID ? Hh[TWM.id(i, j)] : -6; water = []; falls = []; rapids = []; rim = [];
    const ks = F.tiles.concat(F.north || []); for (const k of ks) { const m = MAT[k]; if (m !== M.STREAM && m !== M.SEA && m !== M.POOL) continue; const i = k % N, j = Math.floor(k / N), h = Hh[k], b = j - F.y0; water.push({ i, j, h, m, b });
      const dL = Math.max(0, h - lo(i, j + 1)), dR = Math.max(0, h - lo(i + 1, j)); if (dL || dR) { const q = { i, j, h, dL, dR }; falls.push(q); if (dL >= 5 || dR >= 5) rim.push(q); } if (m === M.STREAM && b < 14) rapids.push({ i, j, h }); }
    for (const k of (F.creek || [])) { const i = k % N, j = Math.floor(k / N), h = Hh[k], dL = Math.max(0, h - lo(i, j + 1)), dR = Math.max(0, h - lo(i + 1, j)); if ((dL || dR) && !falls.some(q => q.i === i && q.j === j)) falls.push({ i, j, h, dL, dR }); }
  }
  // ---------------------------------------------------------------- sprites that are not statics: the divine turtle (swim frames) and the boats
  let tfr = null, tbase = null; const TUR = { ax: 128, ay: 176, n: 9 };   // anchor inside the 256-px canvas: waterline centre of the shell
  function turtleFrames() { if (tfr) return tfr; tfr = []; for (let n = 0; n < TUR.n; n++) { const im = new Image(); im.src = 'sprites/anim/tth_turtle_swim_' + n + '.png'; tfr.push(im); } tbase = new Image(); tbase.src = 'sprites/anim/tth_turtle_base.png'; return tfr; }
  const imgOK = im => im && im.complete && im.naturalWidth > 0;
  // ---------------------------------------------------------------- drawables (merged into the main depth sort)
  function drawables(D, R, x0, y0, W, Hh) {
    const f = st(); if (!f || !F.tiles) return; const t = R.t, surge = f.surge;
    // moored boats: rock on the swell
    F.boats.forEach((b, n) => { const x = (F.x0 + b[0]) * T, y = (F.y0 + b[1]) * T, im = A.IMG[b[2] ? 'tth_boat_b' : 'tth_boat_a']; if (!im) return; const X = R.wx(x, y), Y = R.wy(x, y, 0); if (X < x0 - 100 || X > x0 + W + 100 || Y < y0 - 60 || Y > y0 + Hh + 100) return;
      D.push([x + y + 0.2, 5, { draw: (g) => { const bob = Math.round(Math.sin(t * (1.3 + surge) + n * 1.7) * (1 + surge * 2.2)), rock = Math.sin(t * 0.9 + n) * surge * 0.05; g.save(); g.translate(Math.round(X), Math.round(Y + bob)); if (rock) g.rotate(rock); if (b[3] < 0) g.scale(-1, 1);
        g.fillStyle = 'rgba(6,26,40,0.35)'; g.beginPath(); g.ellipse(0, 1, im.w * 0.4, im.w * 0.16, 0, 0, 7); g.fill(); g.drawImage(im.im, Math.round(-im.w / 2), Math.round(-im.py + 3)); g.restore();
        g.fillStyle = 'rgba(236,252,252,0.55)'; for (let q = 0; q < 6; q++) { const a = (t * 0.5 + q / 6) % 1; g.fillRect(Math.round(X - im.w * 0.42 + a * im.w * 0.84), Math.round(Y + 3 + Math.sin(a * 6.28 + n) * 1.5), 2, 1); } } }]); });
    // a loose boat drifting to the cataract
    for (const d of f.drifts) if (d.kind === 'boat') { const im = A.IMG['tth_boat_a']; if (!im) continue; D.push([d.x + d.y + 0.2, 5, { draw: (g) => { const X = R.wx(d.x, d.y), Y = R.wy(d.x, d.y, 0); g.save(); g.translate(Math.round(X), Math.round(Y + Math.sin(t * 2.2) * 2)); g.rotate((d.rot || 0) + Math.sin(t * 1.4) * 0.05); g.drawImage(im.im, Math.round(-im.w / 2), Math.round(-im.py + 3)); g.restore(); g.fillStyle = 'rgba(236,252,252,0.7)'; g.fillRect(Math.round(X - 14), Math.round(Y + 3), 28, 1); } }]); }
    const tu = f.turtle; if (tu) { turtleFrames(); D.push([tu.x + tu.y, 5, { draw: (g) => drawTurtle(g, R, tu, f) }]); }
  }
  function drawTurtle(g, R, tu, f) {
    const t = R.t, X = Math.round(R.wx(tu.x, tu.y)), Y = Math.round(R.wy(tu.x, tu.y, 0)), fl = tu.face || 1, base = A.IMG['tth_turtle_a'];
    const frames = tfr, fr = imgOK(frames[0]) ? frames[Math.floor(t * (tu.phase === 'carry' ? 5 : 2.4)) % TUR.n] : null, sprite = imgOK(fr) ? fr : null;
    const rise = tu.phase === 'rise' ? tu.rise : 1, sub = tu.phase === 'dive' ? tu.sub : 0, bow = tu.bow ? Math.max(0, Math.sin(Math.min(1, tu.t / 2.5) * Math.PI)) * 5 * (tu.phase === 'wait' ? 1 : 0) : 0;
    const drop = (1 - rise) * 130 + sub * 150, wl = Y;   // everything below the waterline is hidden while the turtle rises / dives
    // golden column of light and halo
    g.globalCompositeOperation = 'lighter'; const gl = Math.max(f.glow, tu.phase === 'rise' ? 1 : 0.5);
    for (let q = 0; q < 6; q++) { const w = 60 - q * 8 + Math.sin(t * 2 + q) * 3; g.fillStyle = `rgba(255,214,110,${gl * (tu.phase === 'rise' ? 0.1 : 0.04) * (1 + q * 0.2)})`; g.fillRect(X - w / 2, Y - 360 + q * 6, w, 360); }
    const rg = g.createRadialGradient(X, Y - 60, 10, X, Y - 60, 190); rg.addColorStop(0, `rgba(255,222,120,${0.3 * gl})`); rg.addColorStop(1, 'rgba(255,222,120,0)'); g.fillStyle = rg; g.fillRect(X - 190, Y - 250, 380, 380);
    g.globalCompositeOperation = 'source-over';
    // under-water shadow and wake
    g.fillStyle = 'rgba(4,22,36,0.4)'; g.beginPath(); g.ellipse(X, Y + 2, 108, 34, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.rect(X - 200, Y - 400, 400, 400 + (sub ? 0 : 0) + 0); g.clip();
    const bob = Math.round(tu.bob || 0) + Math.round(bow);
    g.translate(X, Y + bob + drop); if (fl < 0) g.scale(-1, 1);
    g.beginPath(); g.rect(-210, -420 - drop, 420, 420 + 0); g.clip();   // clip at the waterline (the sprite's lower part is under water while rising / diving)
    g.globalAlpha = tu.alpha === undefined ? 1 : clamp(tu.alpha, 0, 1);
    if (sprite) g.drawImage(sprite, -TUR.ax, -TUR.ay); else if (imgOK(tbase)) g.drawImage(tbase, -TUR.ax, -TUR.ay); else if (base) g.drawImage(base.im, Math.round(-base.w / 2), Math.round(-base.py - 20));
    g.globalAlpha = 1; g.restore();
    // jade runes pulsing on the shell
    g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 7; q++) { const a = 0.5 + 0.5 * Math.sin(t * 2.4 + q * 1.3), px = X + (fl > 0 ? 1 : -1) * (-34 + q * 12), py = Y - 78 - Math.sin(q * 0.8) * 14 + (tu.bob || 0) + drop; if (py > wl - 12) continue; g.fillStyle = `rgba(110,255,200,${0.35 * a * rise})`; g.fillRect(Math.round(px), Math.round(py), 3, 3); }
    g.globalCompositeOperation = 'source-over';
    // waterline: foam, lapping ripples and a bow wave when swimming
    const mv = tu.phase === 'carry' ? 1 : 0.35; g.fillStyle = 'rgba(238,252,252,0.85)';
    for (let q = 0; q < 26; q++) { const a = (q / 26 + t * 0.1 * mv) % 1, ang = a * 6.283, rx = 100 + Math.sin(t * 2 + q) * 3, ry = 26; g.fillRect(Math.round(X + Math.cos(ang) * rx), Math.round(Y + Math.sin(ang) * ry + (tu.bob || 0) * 0.5), 3 + (q & 1), 1); }
    g.strokeStyle = 'rgba(214,244,248,0.55)'; g.lineWidth = 1; for (let q = 0; q < 3; q++) { const p = ((t * 0.5 * (0.6 + mv) + q / 3) % 1); g.beginPath(); g.ellipse(X, Y + 3, 104 + p * 46, 31 + p * 14, 0, 0, 7); g.globalAlpha = (1 - p) * 0.6; g.stroke(); g.globalAlpha = 1; }
    if (tu.phase === 'carry') { const hx = (tu.hx || 0) - (tu.hy || 0); g.fillStyle = 'rgba(240,252,252,0.8)'; for (let q = 0; q < 14; q++) { const a = (t * 1.6 + q / 14) % 1; g.fillRect(Math.round(X + (fl > 0 ? -1 : 1) * (80 + a * 70) + (hash(q, 3, 400) - 0.5) * 14), Math.round(Y - 6 + a * 18 * (hash(q, 4, 400) - 0.5) * 2), 2, 1); } }
    // the shell is dripping; spray when it crashes through a wave
    for (let q = 0; q < 7; q++) { const a = (t * 0.9 + hash(q, 1, 401)) % 1; g.fillStyle = `rgba(230,250,252,${(1 - a) * 0.8})`; g.fillRect(Math.round(X + (hash(q, 2, 401) - 0.5) * 150), Math.round(Y - 14 - a * 22 + drop * 0), 1, 2); }
  }

  // ---------------------------------------------------------------- overlays
  function draw(g, S, R, x0, y0, W, Hh) {
    const f = st(); if (!f || !F.tiles || !nearBiome(R)) return; if (!water) build(); const t = R.t, x1 = x0 + W, y1 = y0 + Hh, surge = f.surge, storm = f.storm, wind = f.wind;
    // -- wave crests: slanted white-blue lines sliding down-river over every water tile; taller and denser as the river surges
    g.globalCompositeOperation = 'lighter';
    for (const q of water) { const X = sx(q.i, q.j), Y = sy(q.i, q.j, q.h); if (X < x0 - 40 || X > x1 + 40 || Y < y0 - 24 || Y > y1 + 40) continue;
      const fast = q.m === M.STREAM, deep = q.m === M.SEA, n = (deep ? 2 : fast ? 3 : 1) + Math.round(surge * 4), spd = (fast ? 0.55 : deep ? 0.3 : 0.12) * (0.8 + surge * 1.2);
      for (let c = 0; c < n; c++) { const a = hash(q.i * 7 + c, q.j, 410), age = (t * spd + a * 5) % 1, len = (fast ? 5 : 7) + Math.floor(a * 7) + Math.round(surge * 12 * a);
        const px = X - 16 + a * 24 - age * 22 * (fast ? 1.3 : 1) + 8, py = Y + 8 + age * 14 + (hash(q.i, q.j * 3 + c, 411) - 0.5) * 12; if (Math.abs(px - X) + Math.abs(py - Y - 16) * 2 > 40) continue;
        const al = Math.sin(age * 3.14) * (fast ? 0.5 : deep ? 0.3 : 0.2) * (0.6 + surge * 1.4); g.fillStyle = deep ? `rgba(150,215,235,${al})` : `rgba(235,252,252,${al})`; crest(g, px, py, len); } }
    g.globalCompositeOperation = 'source-over';
    // -- rapids: white tongues racing between the rocks
    for (const q of rapids) { const X = sx(q.i, q.j), Y = sy(q.i, q.j, q.h); if (X < x0 - 40 || X > x1 + 40 || Y < y0 - 24 || Y > y1 + 50) continue;
      for (let c = 0; c < 4; c++) { const a = hash(q.i * 3 + c, q.j, 412), age = (t * (0.9 + a * 0.7) + a * 4) % 1, px = X - 14 + a * 26 - age * 20, py = Y + 6 + age * 16; g.fillStyle = `rgba(245,254,254,${Math.sin(age * 3.14) * 0.75})`; g.fillRect(Math.round(px), Math.round(py), 2 + (c & 1), 1); g.fillRect(Math.round(px + 3), Math.round(py + 1), 3, 1); } }
    drawFalls(g, R, f, t, x0, y0, x1, y1);
    // -- the whirlpool
    { const [wx, wy] = F.whirl, X = R.wx(wx * T + 4, wy * T + 4), Y = R.wy(wx * T + 4, wy * T + 4, 0); if (inView(R, X, Y, 220)) {
        g.fillStyle = 'rgba(2,12,24,0.35)'; g.beginPath(); g.ellipse(X, Y, 34, 17, 0, 0, 7); g.fill();
        for (let arm = 0; arm < 4; arm++) for (let s = 0; s < 46; s++) { const r = 5 + s * 2.5, th = arm * 1.571 + s * 0.17 - t * (1.1 + surge * 0.8) / (1 + r / 90), px = X + Math.cos(th) * r * 1.05, py = Y + Math.sin(th) * r * 0.52; const al = (1 - s / 46) * 0.7 * (0.6 + surge * 0.5); g.fillStyle = `rgba(190,232,246,${al})`; g.fillRect(Math.round(px), Math.round(py), 2, 1); }
        g.strokeStyle = 'rgba(210,240,250,0.35)'; for (let q = 0; q < 3; q++) { const p = (t * 0.3 + q / 3) % 1; g.globalAlpha = (1 - p) * 0.5; g.beginPath(); g.ellipse(X, Y, 20 + p * 84, 10 + p * 42, 0, 0, 7); g.stroke(); } g.globalAlpha = 1; } }
    // -- drifting debris (logs, branches, leaves) and fish shadows following the current down the river
    const AC = F.AC, HW = F.HW;
    for (let n = 0; n < 26; n++) { const L0 = 34, spd = (0.5 + hash(n, 1, 413) * 0.6) * (0.9 + surge * 1.1), b = ((t * spd * 0.55 + hash(n, 2, 413) * L0) % L0) + 3, off = (hash(n, 3, 413) - 0.5) * (HW(b) * 1.4), a = AC(b) + off, wx = (F.x0 + a + 0.5) * T, wy = (F.y0 + b + 0.5) * T, X = R.wx(wx, wy), Y = R.wy(wx, wy, 0);
      if (!inView(R, X, Y, 20)) continue; const bob = Math.sin(t * 2 + n) * 0.8; if (n % 3 === 0) { g.fillStyle = 'rgba(40,28,20,0.9)'; g.fillRect(Math.round(X - 5), Math.round(Y + bob), 10, 2); g.fillStyle = 'rgba(110,80,54,0.95)'; g.fillRect(Math.round(X - 5), Math.round(Y + bob - 1), 10, 1); g.fillStyle = 'rgba(238,252,252,0.7)'; g.fillRect(Math.round(X - 6), Math.round(Y + bob + 2), 12, 1); }
      else if (n % 3 === 1) { g.fillStyle = 'rgba(110,150,70,0.9)'; g.fillRect(Math.round(X), Math.round(Y + bob), 3, 1); g.fillRect(Math.round(X + 1), Math.round(Y + bob - 1), 2, 1); } else { g.fillStyle = 'rgba(2,14,26,0.35)'; g.beginPath(); g.ellipse(X, Y + 2, 9, 3, 0, 0, 7); g.fill(); g.fillRect(Math.round(X + 7), Math.round(Y + 1 + Math.sin(t * 6 + n)), 3, 1); } }
    // -- leaping fish and ducks
    for (const l of f.leaps) { const p = l.t / 1.3; if (p > 1) continue; const X = R.wx(l.x, l.y) + l.dir * (p - 0.5) * 70, Y = R.wy(l.x, l.y, 0) - Math.sin(p * 3.14) * 74; if (!inView(R, X, Y, 40)) continue; g.save(); g.translate(Math.round(X), Math.round(Y)); g.rotate(l.dir * (p - 0.5) * 2.4); g.fillStyle = '#e8b64a'; g.fillRect(-10, -3, 20, 6); g.fillStyle = '#ffdc78'; g.fillRect(-8, -3, 16, 2); g.fillStyle = '#a8742a'; g.fillRect(-13, -4, 4, 8); g.fillRect(8, -2, 5, 4); g.fillStyle = '#10202c'; g.fillRect(7, -2, 2, 2); g.restore(); g.fillStyle = 'rgba(240,252,252,0.8)'; for (let q = 0; q < 6; q++) g.fillRect(Math.round(X + (q - 3) * 4), Math.round(Y + 8 + p * 20 + q % 2 * 3), 1, 2); }
    for (let n = 0; n < 3; n++) { const cx = [20.5, 33.5, 27.5][n], cy = [32.5, 31.5, 22.5][n]; for (let d = 0; d < 4; d++) { const wxp = (F.x0 + cx + Math.sin(t * 0.07 + n + d) * 1.3 + d * 0.3) * T, wyp = (F.y0 + cy + Math.cos(t * 0.06 + n * 2 + d) * 1.0) * T, X = R.wx(wxp, wyp), Y = R.wy(wxp, wyp, 0); if (!inView(R, X, Y, 20)) continue;
        g.fillStyle = d ? '#b89a6a' : '#3a7a5a'; g.fillRect(Math.round(X - 3), Math.round(Y - 2), 6, 3); g.fillStyle = d ? '#e0d4a8' : '#2a5c44'; g.fillRect(Math.round(X + 2), Math.round(Y - 4), 3, 3); g.fillStyle = '#e8a840'; g.fillRect(Math.round(X + 5), Math.round(Y - 3), 2, 1); g.fillStyle = 'rgba(236,252,252,0.6)'; g.fillRect(Math.round(X - 5), Math.round(Y + 1), 10, 1); } }
    // -- cranes standing on the islets (they step and flap now and then) and flocks passing overhead
    F.cranes.forEach((c, n) => { const X = R.wx(c[0] * T + 4, c[1] * T + 4), Y = R.wy(c[0] * T + 4, c[1] * T + 4, TWM.H[TWM.id(Math.floor(c[0]), Math.floor(c[1]))] * 4); if (!inView(R, X, Y, 20)) return; const flap = Math.sin(t * 0.4 + n * 2) > 0.94, hop = flap ? Math.round(Math.abs(Math.sin(t * 14)) * 2) : 0, look = Math.sin(t * 0.7 + n) > 0.6 ? 1 : 0;
      g.fillStyle = '#f4f6f6'; g.fillRect(Math.round(X - 3), Math.round(Y - 9 - hop), 6, 4); g.fillRect(Math.round(X + 1 + look), Math.round(Y - 15 - hop), 2, 7); g.fillStyle = '#1a2230'; g.fillRect(Math.round(X + 1 + look), Math.round(Y - 16 - hop), 2, 2); g.fillStyle = '#e8503a'; g.fillRect(Math.round(X + 3 + look), Math.round(Y - 16 - hop), 2, 1); g.fillStyle = '#c8a060'; g.fillRect(Math.round(X - 1), Math.round(Y - 5 - hop), 1, 5); g.fillRect(Math.round(X + 1), Math.round(Y - 5 - hop), 1, 5);
      if (flap) { g.fillStyle = '#f4f6f6'; const w = Math.round(Math.sin(t * 16) * 5); g.fillRect(Math.round(X - 9), Math.round(Y - 12 - hop - w), 7, 2); g.fillRect(Math.round(X + 3), Math.round(Y - 12 - hop - w), 7, 2); } });
    for (const q of f.flocks) { if (q.t < 0) continue; const X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, 30) - 20; if (!inView(R, X, Y, 30)) continue; const w = Math.round(Math.sin(t * 7 + q.ph) * 4); g.fillStyle = '#f2f4f6'; g.fillRect(Math.round(X - 2), Math.round(Y), 5, 2); g.fillRect(Math.round(X - 8), Math.round(Y - 1 - w), 6, 1); g.fillRect(Math.round(X + 3), Math.round(Y - 1 - w), 6, 1); g.fillStyle = '#1a2230'; g.fillRect(Math.round(X + 4), Math.round(Y - 1), 2, 1); }
    // -- river imp peeking out of the water: a teal head, glaring yellow eyes, ripples
    for (const p of f.peeks) { const u = p.t / p.life, up = u < 0.15 ? u / 0.15 : u > 0.8 ? (1 - u) / 0.2 : 1, X = R.wx(p.x, p.y), Y = R.wy(p.x, p.y, 0); if (!inView(R, X, Y, 30)) continue; g.save(); g.beginPath(); g.rect(X - 12, Y - 20, 24, 20 + 2); g.clip(); const hy = Y - 10 * up + 6 * (1 - up);
      g.fillStyle = '#2a8f9f'; g.fillRect(Math.round(X - 5), Math.round(hy - 8), 10, 9); g.fillStyle = '#58c7c9'; g.fillRect(Math.round(X - 4), Math.round(hy - 8), 8, 2); g.fillStyle = '#1b5a78'; g.fillRect(Math.round(X - 7), Math.round(hy - 6), 2, 5); g.fillRect(Math.round(X + 5), Math.round(hy - 6), 2, 5); g.fillStyle = '#ffe36a'; g.fillRect(Math.round(X - 3), Math.round(hy - 5), 2, 2); g.fillRect(Math.round(X + 1), Math.round(hy - 5), 2, 2); g.fillStyle = '#0a1620'; g.fillRect(Math.round(X - 3), Math.round(hy - 4), 1, 1); g.fillRect(Math.round(X + 1), Math.round(hy - 4), 1, 1); g.restore();
      g.fillStyle = 'rgba(240,252,252,0.8)'; g.fillRect(Math.round(X - 9), Math.round(Y), 18, 1); }
    // -- ripples, wakes, splashes and the golden burst
    for (const r of f.rings) { const X = R.wx(r.x, r.y), Y = R.wy(r.x, r.y, 0), p = r.t / r.life; if (!inView(R, X, Y, 260)) continue; const k = r.kind, rad = (k === 'burst' ? 20 + p * 190 : k === 'splash' ? 6 + p * 46 : k === 'wake' ? 6 + p * 36 : 5 + p * 40), al = (1 - p) * (k === 'burst' ? 0.9 : 0.75);
      g.strokeStyle = k === 'burst' ? `rgba(255,224,130,${al})` : `rgba(236,252,252,${al})`; g.lineWidth = k === 'burst' ? 2 : 1; g.beginPath(); g.ellipse(X, Y, rad, rad * 0.5, 0, 0, 7); g.stroke(); if (k === 'burst' || k === 'splash') { g.beginPath(); g.ellipse(X, Y, rad * 0.62, rad * 0.31, 0, 0, 7); g.stroke(); }
      if (k === 'splash') for (let q = 0; q < 8; q++) { const a = hash(q, Math.floor(r.x), 414), d = rad * 0.7; g.fillStyle = `rgba(245,254,254,${al})`; g.fillRect(Math.round(X + Math.cos(a * 6.28) * d), Math.round(Y - Math.sin(p * 3.14) * (8 + a * 18) + Math.sin(a * 6.28) * d * 0.4), 2, 2); } }
    g.lineWidth = 1;
    for (const b of f.bursts) { const X = R.wx(b.x, b.y), Y = R.wy(b.x, b.y, 0), p = b.t / 1.4; if (!inView(R, X, Y, 200)) continue; for (let q = 0; q < 26; q++) { const a = hash(q, Math.floor(b.x), 415), d = 8 + p * 64 * (0.4 + a); g.fillStyle = `rgba(245,254,254,${(1 - p) * 0.85})`; g.fillRect(Math.round(X + Math.cos(a * 6.28) * d), Math.round(Y - 8 + Math.sin(a * 6.28) * d * 0.45 - Math.sin(p * 3.14) * 40 * (0.3 + a)), 2, 2); } }
    g.globalCompositeOperation = 'lighter'; for (const s of f.sparks) { const X = R.wx(s.x, s.y), Y = R.wy(s.x, s.y, s.z + 6) - s.t * 8; if (!inView(R, X, Y, 20)) continue; g.fillStyle = `rgba(255,226,130,${(1 - s.t / s.life) * 0.9})`; g.fillRect(Math.round(X), Math.round(Y), 2, 2); } g.globalCompositeOperation = 'source-over';
    // -- floating lanterns (paper, warm light) riding the current
    for (const l of f.lanterns) { if (l.t < 0) continue; const X = R.wx(l.x, l.y), Y = R.wy(l.x, l.y, 0) + Math.sin(t * 2 + l.ph) * 1; if (!inView(R, X, Y, 30)) continue; const c = [[255, 170, 90], [255, 120, 140], [255, 230, 130]][l.col], fade = Math.min(1, l.t / 2, (l.life - l.t) / 3);
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.95 * fade})`; g.fillRect(Math.round(X - 3), Math.round(Y - 5), 6, 5); g.fillStyle = `rgba(255,250,220,${0.9 * fade})`; g.fillRect(Math.round(X - 1), Math.round(Y - 4), 2, 3); g.fillStyle = `rgba(60,34,20,${fade})`; g.fillRect(Math.round(X - 3), Math.round(Y), 6, 1);
      g.globalCompositeOperation = 'lighter'; const rg = g.createRadialGradient(X, Y - 3, 1, X, Y - 3, 26); rg.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.35 * fade})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(X - 26, Y - 29, 52, 52); g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.25 * fade})`; g.fillRect(Math.round(X - 6), Math.round(Y + 2), 12, 1); g.globalCompositeOperation = 'source-over'; }
    // -- lamp posts on piers and yards, camp fires, the shrine's wisps, the tower beacon, incense
    for (const p of F.lanterns) { const X = sx(p[0], p[1]), Y = sy(p[0], p[1], TWM.H[TWM.id(p[0], p[1])]) + 16; if (X < x0 - 20 || X > x1 + 20 || Y < y0 - 40 || Y > y1 + 30) continue; const fl = 0.75 + 0.25 * Math.sin(t * 7 + p[0] * 3);
      g.fillStyle = '#1c1612'; g.fillRect(Math.round(X), Math.round(Y - 16), 2, 17); g.fillStyle = '#3a2a1c'; g.fillRect(Math.round(X - 3), Math.round(Y - 18), 8, 1); g.fillStyle = `rgba(130,214,255,${fl})`; g.fillRect(Math.round(X - 2), Math.round(Y - 17), 6, 6); g.fillStyle = `rgba(230,250,255,${fl})`; g.fillRect(Math.round(X), Math.round(Y - 15), 2, 3); g.fillStyle = '#1c1612'; g.fillRect(Math.round(X - 2), Math.round(Y - 11), 6, 1); }
    for (const p of TWM.pois) if (p.biome === 'tth' && (p.kind === 'tcook_w' || p.kind === 'tcook_e')) { const X = R.wx(p.x, p.y), Y = R.wy(p.x, p.y, TWM.groundZ(p.x, p.y)) + 2; if (!inView(R, X, Y, 60)) continue; fire(g, X + 9, Y, t, p.i); smoke(g, X + 9, Y - 10, t, p.i, wind); }
    for (const s of R.statics) { const k = s.p.kind; if (k === 'tthshrine') { const X = s.X + s.sp.w * 0.5, Y = s.Y + s.sp.h * 0.42; if (!inView(R, X, Y, 60)) continue; smoke(g, X + 3, Y - 6, t, 91, wind * 0.6, true);
        g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 7; q++) { const a = hash(q, 7, 416), ang = t * (0.3 + a * 0.2) + a * 6.28, r = 40 + a * 50; g.fillStyle = `rgba(150,240,255,${0.5 + 0.4 * Math.sin(t * 3 + q)})`; g.fillRect(Math.round(X + Math.cos(ang) * r), Math.round(Y + Math.sin(ang) * r * 0.4 - 10 - a * 30), 2, 2); } g.globalCompositeOperation = 'source-over'; }
      else if (k === 'tthtower') { const X = s.X + s.sp.w * 0.5, Y = s.Y + s.sp.h * 0.06; if (!inView(R, X, Y, 80)) continue; const pu = 0.6 + 0.4 * Math.sin(t * 2.2), ex = Math.max(f.glow, storm * 0.8, 0.2); g.globalCompositeOperation = 'lighter'; const rg = g.createRadialGradient(X, Y, 2, X, Y, 70 + ex * 70); rg.addColorStop(0, `rgba(140,226,255,${0.5 * pu * (0.6 + ex)})`); rg.addColorStop(1, 'rgba(140,226,255,0)'); g.fillStyle = rg; g.fillRect(X - 150, Y - 150, 300, 300);
        const sweep = t * 0.9; for (let q = 0; q < 2; q++) { const a = sweep + q * Math.PI; g.fillStyle = `rgba(150,230,255,${0.1 + 0.08 * ex})`; g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.cos(a - 0.07) * 300, Y + Math.sin(a - 0.07) * 150); g.lineTo(X + Math.cos(a + 0.07) * 300, Y + Math.sin(a + 0.07) * 150); g.closePath(); g.fill(); } g.globalCompositeOperation = 'source-over'; } }
    // -- mist banks over the river and cloud shadows sliding down it
    for (let n = 0; n < 16; n++) { const b = ((t * 0.12 + n * 2.3) % 40), a = AC(clamp(b, 0, 38)) + (hash(n, 5, 417) - 0.5) * 9, wxp = (F.x0 + a + 0.5) * T, wyp = (F.y0 + b + 0.5) * T, X = R.wx(wxp, wyp), Y = R.wy(wxp, wyp, 0) - 8 - hash(n, 6, 417) * 10; if (!inView(R, X, Y, 120)) continue; mist(g, X, Y, 120 + hash(n, 7, 417) * 80, 26 + hash(n, 8, 417) * 14, (0.1 + surge * 0.1 + storm * 0.1) * Math.sin(Math.min(1, b / 39) * 3.14)); }
    g.fillStyle = 'rgba(4,20,34,0.1)'; for (let n = 0; n < 5; n++) { const b = ((t * 0.18 + n * 8) % 42) - 2, a = AC(clamp(b, 0, 38)) + (hash(n, 9, 417) - 0.5) * 8, wxp = (F.x0 + a + 0.5) * T, wyp = (F.y0 + b + 0.5) * T, X = R.wx(wxp, wyp), Y = R.wy(wxp, wyp, 0); if (!inView(R, X, Y, 140)) continue; g.beginPath(); g.ellipse(X, Y, 100, 38, 0, 0, 7); g.fill(); }
    // -- wind streaks over the water
    g.globalCompositeOperation = 'lighter'; for (let n = 0; n < 34; n++) { const a = hash(n, 1, 418), age = (t * (0.35 + a * 0.2) * wind + a * 9) % 1, X = R.cx - R.cv.width / 2 + ((a * 4157 + age * 380) % (R.cv.width + 200)) - 60, Y = R.cy - R.cv.height / 2 + hash(n, 2, 418) * R.cv.height; g.fillStyle = `rgba(220,240,250,${Math.sin(age * 3.14) * 0.1 * wind})`; g.fillRect(Math.round(X), Math.round(Y), 18 + Math.round(a * 24), 1); } g.globalCompositeOperation = 'source-over';
    // -- storm: dark pall, driving rain, lightning (the signature's crossing)
    if (storm > 0.03) { g.fillStyle = `rgba(8,18,38,${0.46 * storm})`; g.fillRect(x0, y0, W, Hh);
      const n = Math.round(300 * storm); for (let q = 0; q < n; q++) { const a = hash(q, 5, 419), b = hash(q, 6, 419), age = (t * (1.6 + a * 0.7) + b) % 1, X = x0 + ((a * 9973 + age * 190) % (W + 190)) - 80, Y = y0 + age * (Hh + 50) - 20; g.fillStyle = `rgba(190,215,240,${0.42 * storm})`; g.fillRect(Math.round(X), Math.round(Y), 1, 4); g.fillRect(Math.round(X) - 1, Math.round(Y) + 4, 1, 3); }
      if (f.flash > 0.02) { g.fillStyle = `rgba(220,238,255,${f.flash * 0.34})`; g.fillRect(x0, y0, W, Hh); const bx = x0 + hash(Math.floor(t * 3), 1, 420) * W; g.strokeStyle = `rgba(240,246,255,${f.flash})`; g.lineWidth = 2; g.beginPath(); let lx = bx, ly = y0; g.moveTo(lx, ly); for (let q = 0; q < 9; q++) { lx += (hash(Math.floor(t * 3), q, 421) - 0.5) * 34; ly += Hh / 9; g.lineTo(lx, ly); } g.stroke(); g.lineWidth = 1; } }
  }
  // flames and smoke (cook fires)
  function fire(g, X, Y, t, seed) { g.globalCompositeOperation = 'lighter'; const rg = g.createRadialGradient(X, Y - 4, 1, X, Y - 4, 22), br = 0.3 + 0.1 * Math.sin(t * 6 + seed); rg.addColorStop(0, `rgba(255,170,70,${br})`); rg.addColorStop(1, 'rgba(255,170,70,0)'); g.fillStyle = rg; g.fillRect(X - 22, Y - 26, 44, 44);
    for (let q = 0; q < 4; q++) { const fl = 0.5 + 0.5 * Math.sin(t * (8 + q * 2) + seed + q), h = 4 + fl * 6; g.fillStyle = `rgba(255,${190 - q * 20},${80 - q * 10},0.85)`; g.fillRect(Math.round(X - 3 + q * 2 + Math.sin(t * 9 + q) * 0.7), Math.round(Y - h), 2, Math.round(h)); } g.globalCompositeOperation = 'source-over'; }
  function smoke(g, X, Y, t, seed, wind, incense) { for (let q = 0; q < 6; q++) { const age = (t * (incense ? 0.18 : 0.25) + q / 6 + hash(seed, q, 422)) % 1; g.fillStyle = `rgba(${incense ? '210,232,240' : '70,68,74'},${(1 - age) * (incense ? 0.18 : 0.3)})`; const r = 2 + age * 6; g.fillRect(Math.round(X + Math.sin(age * 6 + q) * 2 + age * 22 * (wind || 1) * 0.5 - r / 2), Math.round(Y - age * 34), Math.round(r), Math.round(r)); } }
  // cascades (creek steps, rapids steps) and the cataract at the world's rim
  function drawFalls(g, R, f, t, x0, y0, x1, y1) {
    g.globalCompositeOperation = 'lighter';
    for (const q of falls) { const X = sx(q.i, q.j), Y = sy(q.i, q.j, q.h); if (X < x0 - 60 || X > x1 + 60 || Y < y0 - 20 || Y > y1 + 16 * Math.max(q.dL, q.dR) + 60) continue;
      for (const side of [0, 1]) { const drop = (side ? q.dR : q.dL) * 16; if (!drop) continue; const ph = hash(q.i, q.j, 423 + side) * 6.28, bx = X + (side ? 0 : -32);
        g.fillStyle = `rgba(190,240,250,${0.05 + 0.04 * Math.sin(t * 2 + ph)})`; g.beginPath(); if (side) { g.moveTo(X, Y + 32); g.lineTo(X + 32, Y + 16); g.lineTo(X + 32, Y + 16 + drop); g.lineTo(X, Y + 32 + drop); } else { g.moveTo(X - 32, Y + 16); g.lineTo(X, Y + 32); g.lineTo(X, Y + 32 + drop); g.lineTo(X - 32, Y + 16 + drop); } g.closePath(); g.fill();
        for (let c = 0; c < 14; c++) { const a = hash(q.i * 5 + c, q.j, 425 + side), lx = Math.floor(a * 31), age = (t * (0.9 + a * 0.8) + a * 7 + c * 0.11) % 1, rt = side ? Math.floor((95 - (32 + lx)) / 2) + 1 : Math.floor((lx + 32) / 2) + 1, yy = Y + rt + age * (drop - 3), len = 4 + Math.floor(a * 9);
          g.fillStyle = `rgba(235,252,255,${(0.4 + 0.5 * Math.sin(age * 3.14))})`; g.fillRect(Math.round(bx + lx), Math.round(yy), 1 + (c & 1), len); }
        for (let c = 0; c < 10; c++) { const a = hash(q.i * 3 + c, q.j, 427 + side), lx = Math.floor(a * 30) + 1, rt = side ? Math.floor((95 - (32 + lx)) / 2) + 1 : Math.floor((lx + 32) / 2) + 1, age = (t * (1.3 + a) + a * 5) % 1, yb = Y + rt + drop;
          g.fillStyle = `rgba(235,252,255,${(1 - age) * 0.9})`; g.fillRect(Math.round(bx + lx + (a - 0.5) * 14 * age), Math.round(yb - 2 - Math.sin(age * 3.14) * (5 + a * 12)), 2, 1); if (c < 4) { g.fillStyle = `rgba(255,255,255,${0.55 + 0.4 * Math.sin(t * 6 + c + ph)})`; g.fillRect(Math.round(bx + lx), Math.round(yb - 1), 3 + (c & 1), 1); } } } }
    g.globalCompositeOperation = 'source-over';
    for (const q of falls) { const X = sx(q.i, q.j), Y = sy(q.i, q.j, q.h); if (X < x0 - 80 || X > x1 + 80 || Y < y0 - 40 || Y > y1 + 16 * Math.max(q.dL, q.dR) + 160) continue; const drop = Math.max(q.dL, q.dR) * 16, big = drop > 64;
      for (let c = 0; c < (big ? 5 : 3); c++) { const a = hash(q.i, q.j * 3 + c, 429), age = (t * (big ? 0.12 : 0.18) + a) % 1; mist(g, X + (a - 0.5) * 60, Y + 30 + drop - age * (big ? 90 : 44), 50 + age * 60, 16 + age * 16, (1 - age) * (big ? 0.55 : 0.4)); } }
    // the cataract at the rim: a long curtain of mist rising over the edge of the world and a faint rainbow arc
    if (rim.length) { for (const q of rim) { const X = sx(q.i, q.j), Y = sy(q.i, q.j, q.h); if (!inView(R, X, Y + 120, 260)) continue; for (let c = 0; c < 3; c++) { const a = hash(q.i * 3 + c, q.j, 430), age = (t * 0.1 + a) % 1; mist(g, X + (a - 0.5) * 80 - 20, Y + 100 + 20 - age * 80, 90 + age * 90, 28 + age * 24, (1 - age) * 0.5); } }
      const mid = rim[Math.floor(rim.length / 2)], X = sx(mid.i, mid.j), Y = sy(mid.i, mid.j, mid.h) + 70; if (inView(R, X, Y, 300)) { g.globalCompositeOperation = 'lighter'; const cols = ['255,90,90', '255,190,80', '255,250,120', '110,230,140', '100,180,255', '160,120,255']; cols.forEach((c, n) => { g.strokeStyle = `rgba(${c},${0.06 + 0.02 * Math.sin(t * 0.7)})`; g.lineWidth = 3; g.beginPath(); g.ellipse(X - 20, Y + 40, 150 - n * 3, 70 - n * 1.5, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }); g.lineWidth = 1; g.globalCompositeOperation = 'source-over'; } }
  }
  // ---------------------------------------------------------------- night: lamps, fires, the tower, the shrine, the turtle's gold, lightning
  function light(g, S, R, amt) {
    const f = st(); if (!f || !F.tiles || amt < 0.05 || !nearBiome(R)) return; const t = R.t, night = Math.max(0.12, amt);
    const glow = (X, Y, r, a, col) => { if (!inView(R, X, Y, r)) return; const rg = g.createRadialGradient(X, Y, 4, X, Y, r); rg.addColorStop(0, `rgba(${col},${a})`); rg.addColorStop(1, `rgba(${col},0)`); g.fillStyle = rg; g.fillRect(X - r, Y - r, r * 2, r * 2); };
    for (const s of R.statics) { const k = s.p.kind; if (k === 'tthtower') glow(s.X + s.sp.w * 0.5, s.Y + s.sp.h * 0.12, 200, (0.34 + 0.08 * Math.sin(t * 2.2)) * night, '120,220,255'); else if (k === 'tthshrine') glow(s.X + s.sp.w * 0.5, s.Y + s.sp.h * 0.5, 170, 0.28 * night, '110,255,230');
      else if (k === 'tthdock') glow(s.X + s.sp.w * 0.5, s.Y + s.sp.h * 0.5, 190, 0.24 * night, '255,190,110'); else if (k === 'tthgate') glow(s.X + s.sp.w * 0.5, s.Y + s.sp.h * 0.4, 130, 0.22 * night, '130,215,255'); else if (k === 'tthhut') glow(s.X + s.sp.w * 0.5, s.Y + s.sp.h * 0.55, 100, 0.22 * night, '255,190,100'); else if (k === 'tthstatue') glow(s.X + s.sp.w * 0.5, s.Y + s.sp.h * 0.4, 70, 0.22 * night, '120,255,240'); }
    for (const p of F.lanterns) glow(sx(p[0], p[1]), sy(p[0], p[1], TWM.H[TWM.id(p[0], p[1])]) + 6, 62, (0.3 + 0.06 * Math.sin(t * 7 + p[0])) * night, '120,206,255');
    for (const p of TWM.pois) if (p.biome === 'tth' && (p.kind === 'tcook_w' || p.kind === 'tcook_e')) glow(R.wx(p.x, p.y) + 9, R.wy(p.x, p.y, TWM.groundZ(p.x, p.y)) - 4, 110, (0.3 + 0.07 * Math.sin(t * 6 + p.x)) * night, '255,150,60');
    F.boats.forEach((b, n) => { const x = (F.x0 + b[0]) * T, y = (F.y0 + b[1]) * T; glow(R.wx(x, y), R.wy(x, y, 0) - 20, 60, 0.22 * night, '255,170,80'); });
    for (const l of f.lanterns) if (l.t > 0) glow(R.wx(l.x, l.y), R.wy(l.x, l.y, 0) - 4, 46, 0.4 * night, ['255,170,90', '255,120,140', '255,230,130'][l.col]);
    const tu = f.turtle; if (tu) glow(R.wx(tu.x, tu.y), R.wy(tu.x, tu.y, 0) - 60, 300, Math.max(0.2, f.glow * 0.5) * (tu.alpha === undefined ? 1 : tu.alpha), '255,214,110');
    for (const r of f.rings) if (r.kind === 'burst') glow(R.wx(r.x, r.y), R.wy(r.x, r.y, 0), 200, (1 - r.t / r.life) * 0.5, '255,224,130');
    if (f.flash > 0.05) { g.fillStyle = `rgba(200,225,255,${f.flash * 0.1})`; g.fillRect(R.cx - R.cv.width / 2, R.cy - R.cv.height / 2, R.cv.width, R.cv.height); }
  }
  window.TWFX = window.TWFX || {}; TWFX.river = { drawables, draw, light };
})();
