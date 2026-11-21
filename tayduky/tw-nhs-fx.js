'use strict';
// ===== Tây Du Ký v2 — Ngũ Hành Sơn: living effects (render-only; reads TWS.nhs; may use Math.random) =====
// Season overlays on the baked ground (via tw-nhs-art.js), cross-faded sprites, animated cascades / pools / the rim fall, cloud banks and valley mist, cloud shadows, petals / rain / leaves / snow, birds (crows, cranes, small flocks),
// butterflies, fireflies, rabbits and squirrels, the pulsing golden seal, the prison (Wukong's frames, the burst, the ghost return), the quake / cracks / light of the signature, the 500-year caption and the story camera.
window.TWFX = window.TWFX || {};
(function () {
  const A = TWA, T = 8, Fm = () => TWM.nhs, st = () => (window.TWS && TWS.nhs) || null, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), hash = (a, b, c) => TWM.hash2(a, b, c), sm = t => t * t * (3 - 2 * t);
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const inView = (R, x, y, m) => { const x0 = R.cx - R.cv.width / 2 - m, y0 = R.cy - R.cv.height / 2 - m; return x > x0 && x < x0 + R.cv.width + 2 * m && y > y0 && y < y0 + R.cv.height + 2 * m; };
  function blob(g, x, y, r, rgb, a) { if (a <= 0.003) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  const mist = (g, x, y, rx, ry, a, rgb) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); blob(g, 0, 0, rx, rgb || '236,242,248', a); g.restore(); };
  const season = f => f.sf > 0.5 ? f.sb : f.sa;
  // ---------------------------------------------------------------- geometry caches
  let G = null;
  function geo() {
    if (G) return G; const N = TWM.N, F = Fm(); G = { falls: [], air: new Uint8Array(0), box: null, ax: 0, ay: 0, aw: 0, ah: 0, meadow: [], lips: [] }; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), h = TWM.H[k], X = A.SX(i, j), Y = A.SY(i, j, h); x0 = Math.min(x0, X - 32); x1 = Math.max(x1, X + 32); y0 = Math.min(y0, Y - 130); y1 = Math.max(y1, Y + 40); }
    G.box = [x0, y0, x1, y1]; const cell = 32; G.cell = cell; G.ax = Math.floor(x0 / cell); G.ay = Math.floor(y0 / cell); G.aw = Math.ceil((x1 - x0) / cell) + 2; G.ah = Math.ceil((y1 - y0) / cell) + 2; G.air = new Uint8Array(G.aw * G.ah);
    for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), h = TWM.H[k], X = A.SX(i, j), Y = A.SY(i, j, h); for (let dy = -100; dy <= 24; dy += 16) { const cx = Math.floor(X / cell) - G.ax, cy = Math.floor((Y + dy) / cell) - G.ay; if (cx >= 0 && cy >= 0 && cx < G.aw && cy < G.ah) G.air[cy * G.aw + cx] = 1; } }
    const isW = k => TWM.MAT[k] === TWM.M.STREAM || TWM.MAT[k] === TWM.M.POOL;
    for (const k of F.stream) { const i = k % N, j = Math.floor(k / N), h = TWM.H[k]; for (const [side, di, dj] of [[0, 1, 0], [1, 0, 1]]) { const q = (j + dj) * N + i + di, hq = TWM.H[q]; const wq = isW(q) || TWM.MAT[q] === TWM.M.VOID; if (wq && hq < h) G.falls.push({ i, j, side, drop: h - hq, k, rim: TWM.MAT[q] === TWM.M.VOID }); } }
    for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); if (TWM.MAT[k] === TWM.M.NTURF && TWM.H[k] <= 4 && !TWM.PATHC[k]) G.meadow.push(k); }
    for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), h = TWM.H[k]; if (isW(k) || TWM.MAT[k] === TWM.M.PLANK) continue; for (const [di, dj, side] of [[1, 0, 0], [0, 1, 1]]) { const q = (j + dj) * N + i + di; if (TWM.H[q] <= h - 3 && TWM.MAT[q] !== TWM.M.VOID && !isW(q) && hash(i, j, 620) < 0.55) G.lips.push({ i, j, side, h, drop: h - TWM.H[q] }); } }
    return G;
  }
  const inAir = (X, Y) => { const g = geo(), cx = Math.floor(X / g.cell) - g.ax, cy = Math.floor(Y / g.cell) - g.ay; return cx >= 0 && cy >= 0 && cx < g.aw && cy < g.ah && g.air[cy * g.aw + cx] === 1; };
  function sync(f) { const S = A.nhs.S; S.a = f.sa; S.b = f.sb; S.f = f.sf; S.age = f.age; S.gust = f.gust; }
  // ---------------------------------------------------------------- ground overlays (seasons + moss)
  let built = 0, lastFrame = -1;
  function chunkOverlay(g, c, ox, oy, isCol) {
    const f = st(); if (!f) return; sync(f); const gg = geo(), b = gg.box; if (ox + 512 < b[0] || ox > b[2] || oy + 512 < b[1] || oy > b[3]) return;
    if (!isCol && TWR.t !== lastFrame) { lastFrame = TWR.t; built = 0; }
    const get = s => { if (s === 1) return null; const have = c._nhs && c._nhs.ov[s] !== undefined; if (!have && built >= 3 && !isCol) return undefined; if (!have) built++; return A.nhs.overlay(c, s); };
    const S = A.nhs.S, a = S.a, bb = S.b, fr = S.f, oA = get(a), oB = bb === a ? null : get(bb);
    if (oA === undefined || oB === undefined) { const o = oA || oB; if (o) g.drawImage(o, ox, oy); return; }
    if (a === bb || fr < 0.02) { if (oA) g.drawImage(oA, ox, oy); }
    else if (fr > 0.98) { if (oB) g.drawImage(oB, ox, oy); }
    else if (a === 1) { if (oB) { g.globalAlpha = fr; g.drawImage(oB, ox, oy); g.globalAlpha = 1; } }
    else if (bb === 1) { if (oA) { g.globalAlpha = 1 - fr; g.drawImage(oA, ox, oy); g.globalAlpha = 1; } }
    else { if (oA) g.drawImage(oA, ox, oy); if (oB) { g.globalAlpha = fr; g.drawImage(oB, ox, oy); g.globalAlpha = 1; } }
    if (S.age > 0.04) { const m = get(4); if (m) { g.globalAlpha = Math.min(0.5, S.age * 0.5); g.drawImage(m, ox, oy); g.globalAlpha = 1; } }
  }
  // ---------------------------------------------------------------- the prison (Wukong's frames), the summit seal
  const IM = {}, img = n => { if (!IM[n]) { const im = new Image(); im.src = 'sprites/anim/' + n + '.png'; IM[n] = im; } return IM[n]; }, ok = im => im && im.complete && im.naturalWidth > 0;
  const PA = { idle: { fps: 5, n: 9 }, struggle: { fps: 9, n: 9 }, plead: { fps: 8, n: 9 }, hope: { fps: 6, n: 9 } };
  let emptyCv = null;
  function emptyPrison(base) {   // the prison with the monkey gone: dark hollow, rubble
    if (emptyCv) return emptyCv; const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const g = cv.getContext('2d'); g.drawImage(base, 0, 0); const id = g.getImageData(0, 0, 128, 128), d = id.data;
    for (let y = 60; y < 112; y++) for (let x = 38; x < 104; x++) { const dx = (x - 70) / 30, dy = (y - 90) / 19, q = dx * dx + dy * dy; if (q < 1) { const p = (y * 128 + x) * 4; if (d[p + 3] < 8) continue; const n = hash(x, y, 631); d[p] = 22 + n * 14; d[p + 1] = 17 + n * 10; d[p + 2] = 14 + n * 8; } }
    g.putImageData(id, 0, 0); for (let q = 0; q < 16; q++) { const x = 42 + hash(q, 1, 632) * 54, y = 98 + hash(q, 2, 632) * 10, w = 2 + Math.floor(hash(q, 3, 632) * 4); g.fillStyle = ['#6c6a72', '#8a8790', '#54525c', '#a29fa6'][q & 3]; g.fillRect(Math.round(x), Math.round(y), w, 2 + (q & 1)); }
    g.fillStyle = '#3f8a3a'; for (let q = 0; q < 6; q++) g.fillRect(44 + q * 9, 94 + (q & 1) * 5, 2, 4); emptyCv = cv; return cv;
  }
  function drawPrison(g, s, f0, R) {
    const f = st(), base = A.IMG['nhs_prison_a'].im; if (!f) { g.drawImage(base, s.X, s.Y); return; } const pr = f.prison, ox = s.X - 5, oy = s.Y - 18, t = R.t;
    let frame = base; if (!pr.burst) { const a = PA[pr.anim] || PA.idle, i = Math.floor((S_t() - pr.t0) * a.fps) % a.n, im = img('nhs_prison_' + (PA[pr.anim] ? pr.anim : 'idle') + '_' + i); if (ok(im)) frame = im; }
    const ghost = pr.ghost > 0 && !pr.burst ? clamp((S_t() - (pr.ghostFrom || 0)) / 6, 0, 1) : 1;
    if (pr.burst) { g.drawImage(emptyPrison(base), s.X - 5, s.Y - 18); }
    else if (pr.ghost > 0 && ghost < 1) { g.drawImage(emptyPrison(base), ox, oy); g.globalAlpha = ghost; g.drawImage(frame, ox, oy); g.globalAlpha = 1; if (ghost > 0.98) pr.ghost = 0; }
    else g.drawImage(frame, ox, oy);
    // glow in the cracks while the seal is stirring; the offering bowl
    const gl = Math.max(f.glow * 0.5, f.cracks); if (gl > 0.03) { g.globalCompositeOperation = 'lighter'; blob(g, s.X + 62, s.Y + 56, 46, '255,220,130', 0.25 * gl * (0.8 + 0.2 * Math.sin(t * 5))); g.globalCompositeOperation = 'source-over'; }
    if (f.offer > 0) { const al = Math.min(1, f.offer / 3); px(g, s.X + 40, s.Y + 80, 8, 3, `rgba(130,86,52,${al})`); px(g, s.X + 41, s.Y + 78, 3, 2, `rgba(232,70,50,${al})`); px(g, s.X + 44, s.Y + 78, 3, 2, `rgba(244,190,60,${al})`); px(g, s.X + 42, s.Y + 77, 2, 1, `rgba(120,200,90,${al})`); }
  }
  const S_t = () => window.TWS ? TWS.t : 0;
  // summit seal: a gold slip on the shrine of the summit crag, pulsing; lifted by the monk it rises, spins, burns white and dissolves into light; a new one descends at the end
  let sumS = null;
  function summitStatic(R) { if (sumS && R.statics.includes(sumS)) return sumS; sumS = R.statics.find(s => s.p.kind === 'nhssummit') || null; return sumS; }
  function drawSeal(g, R, f, s) {
    const sl = f.seal, t = R.t; let X = s.X + s.sp.w * 0.545, Y = s.Y + 14, a = 1, lift = 0, rot = 0, glowK = 1, white = 0;
    if (sl.st === 'lift') { const u = clamp(sl.t / 4.5, 0, 1); lift = sm(u) * 150; a = 1 - clamp((u - 0.55) / 0.45, 0, 1); rot = u * 12; glowK = 1 + u * 3; white = clamp(u * 2, 0, 1) * (1 - clamp((u - 0.8) * 5, 0, 1)); }
    else if (sl.st === 'gone') { a = 0; } else if (sl.st === 'return') { const u = clamp(sl.t / 6, 0, 1); lift = (1 - sm(u)) * 170; a = clamp(u * 2, 0, 1); glowK = 1 + (1 - u) * 2.5; }
    const pulse = 0.75 + 0.25 * Math.sin(t * 2.6), gk = a * glowK * pulse; g.globalCompositeOperation = 'lighter';
    if (a > 0.02 || white > 0) { blob(g, X, Y - lift, 54 * glowK, '255,214,110', 0.34 * gk); blob(g, X, Y - lift, 20, '255,246,200', 0.5 * gk); for (let q = 0; q < 6; q++) { const ang = q * 1.047 + t * 0.4 + rot, len = (18 + 18 * glowK) * a; g.strokeStyle = `rgba(255,226,140,${0.18 * a * pulse})`; g.beginPath(); g.moveTo(X, Y - lift); g.lineTo(X + Math.cos(ang) * len, Y - lift + Math.sin(ang) * len * 0.8); g.stroke(); } }
    g.globalCompositeOperation = 'source-over';
    if (a > 0.04) { g.globalAlpha = a; g.save(); g.translate(Math.round(X), Math.round(Y - lift)); g.rotate(Math.sin(rot * 3) * 0.25); const w = 5, h = 11; px(g, -w / 2 - 1, -h / 2 - 1, w + 2, h + 2, '#5a3a14'); px(g, -w / 2, -h / 2, w, h, '#f2c230'); px(g, -w / 2, -h / 2, w, 1, '#ffe47a'); for (let q = 0; q < 4; q++) px(g, -1 + (q & 1), -h / 2 + 2 + q * 2, 3 - (q & 1), 1, '#b02818'); g.restore(); g.globalAlpha = 1; }
    if (sl.st === 'lift' && sl.t > 2.4) { for (let q = 0; q < 26; q++) { const u = hash(q, 1, 640), age = ((sl.t - 2.4) * 0.5 + u) % 1, ang = u * 6.28; g.fillStyle = `rgba(255,${230 - age * 40},${150 + age * 40},${(1 - age) * 0.9})`; g.fillRect(Math.round(X + Math.cos(ang) * age * 70), Math.round(Y - lift + Math.sin(ang) * age * 50 - age * 20), 2, 2); } }
  }
  function drawables(D, R) {
    const f = st(); if (!f) return; sync(f); const s = summitStatic(R); if (s && s.X < R.cx + R.cv.width && s.X + s.sp.w > R.cx - R.cv.width && s.Y < R.cy + R.cv.height && s.Y + s.sp.h > R.cy - R.cv.height) D.push([s.key + 0.4, 5, { draw: g => drawSeal(g, R, f, s) }]);
    // rabbits and squirrels on the meadow, depth-sorted
    const gg = geo(); if (!gg.meadow.length || season(f) === 3 && f.snowStorm > S_t()) return; const t = R.t;
    for (let q = 0; q < 5; q++) { const cyc = 9 + q * 1.7, n = Math.floor((t + q * 3.1) / cyc), u = ((t + q * 3.1) % cyc) / cyc, k0 = gg.meadow[Math.floor(hash(n, q, 650) * gg.meadow.length)], k1 = gg.meadow[Math.floor(hash(n + 1, q, 650) * gg.meadow.length)];
      const N = TWM.N, ax = (k0 % N + 0.5) * T, ay = (Math.floor(k0 / N) + 0.5) * T, bx = (k1 % N + 0.5) * T, by = (Math.floor(k1 / N) + 0.5) * T, mv = u < 0.3 ? u / 0.3 : 1, x = ax + (bx - ax) * mv * 0.28, y = ay + (by - ay) * mv * 0.28; if (!TWM.WALK[TWM.id(Math.floor(x / T), Math.floor(y / T))]) continue;
      const hop = u < 0.3 ? Math.abs(Math.sin(u * 60)) * 4 : 0, X = R.wx(x, y), Y = R.wy(x, y, TWM.groundZ(x, y)); if (!inView(R, X, Y, 40)) continue; const sq = q & 1, face = bx - by >= ax - ay ? 1 : -1;
      D.push([x + y + 0.2, 5, { draw: g => { g.fillStyle = 'rgba(8,10,16,0.3)'; g.fillRect(Math.round(X - 4), Math.round(Y), 8, 2);
        if (!sq) { const wc = season(f) === 3 ? '#e8edf2' : '#d8cfc2'; px(g, X - 3 * face, Y - 5 - hop, 6, 4, wc); px(g, X + (face > 0 ? 2 : -4), Y - 7 - hop, 2, 3, wc); px(g, X + (face > 0 ? 1 : -3), Y - 9 - hop, 1, 3, wc); px(g, X - (face > 0 ? 4 : -3), Y - 5 - hop, 2, 2, '#fff'); px(g, X + (face > 0 ? 3 : -4), Y - 6 - hop, 1, 1, '#222'); }
        else { px(g, X - 2, Y - 5 - hop, 5, 4, '#b8723a'); px(g, X + (face > 0 ? 2 : -3), Y - 7 - hop, 3, 3, '#c8844a'); px(g, X - (face > 0 ? 5 : -2), Y - 9 - hop, 3, 6, '#d49a58'); px(g, X + (face > 0 ? 4 : -3), Y - 6 - hop, 1, 1, '#222'); } } }]); }
  }
  // ---------------------------------------------------------------- birds
  function bird(g, x, y, kind, ph, t, face, a) {
    g.globalAlpha = a === undefined ? 1 : a; const fl = Math.sin(t * (kind === 'crane' ? 3.2 : 9) + ph) > 0, up = fl ? 2 : -1;
    if (kind === 'crane') { px(g, x - 5, y, 10, 3, '#f4f4f0'); px(g, x + 4 * face, y - 2, 2, 3, '#f4f4f0'); px(g, x + 5 * face, y - 3, 2, 2, '#c02020'); px(g, x - 14, y + up - 3, 9, 1, '#fafaf6'); px(g, x + 5, y + up - 3, 9, 1, '#fafaf6'); px(g, x - 14, y + up - 3, 2, 1, '#202028'); px(g, x + 12, y + up - 3, 2, 1, '#202028'); px(g, x - 7 * face, y + 3, 6, 1, '#5a5a62'); }
    else { const c = kind === 'crow' ? '#14141c' : (Math.floor(ph) % 2 ? '#3a3a52' : '#5a4638'); px(g, x - 1, y, 3, 2, c); px(g, x - 5, y + up - 1, 4, 1, c); px(g, x + 2, y + up - 1, 4, 1, c); if (kind === 'crow') px(g, x + face * 2, y - 1, 2, 1, c); }
    g.globalAlpha = 1;
  }
  function drawBirds(g, R, f, x0, y0, W, Hh) {
    const t = R.t, S = season(f), box = geo().box, cx = (box[0] + box[2]) / 2, sm0 = summitStatic(R), top = sm0 ? [sm0.X + sm0.sp.w / 2, sm0.Y + 40] : [cx, box[1] + 100];
    const quiet = f.storm > 0.4 ? 0 : 1;
    // crows circle the summit cliffs; small birds cross at mid height; cranes glide over the falls
    for (let q = 0; q < 5; q++) { const ang = t * (0.18 + q * 0.02) + q * 1.3, X = top[0] + Math.cos(ang) * (150 + q * 20), Y = top[1] + 60 + Math.sin(ang) * (46 + q * 6) + q * 14; if (!inView(R, X, Y, 20)) continue; bird(g, X, Y, 'crow', q, t, Math.cos(ang + 1.57) > 0 ? 1 : -1, quiet); }
    if (S !== 3 || f.snowAcc < 0.9) for (let q = 0; q < 7; q++) { const sp = 12 + q * 3, u = ((t * sp + q * 400) % (box[2] - box[0] + 600)), X = box[0] - 300 + u, Y = box[1] + 120 + q * 40 + Math.sin(t * 0.7 + q) * 12 + u * 0.12; if (!inView(R, X, Y, 20) || !inAir(X, Y + 40)) continue; bird(g, X, Y, 'bird', q, t, 1, quiet); }
    for (let q = 0; q < 3; q++) { const u = ((t * 9 + q * 700) % (box[2] - box[0] + 500)), X = box[2] + 150 - u, Y = box[1] + 260 + q * 70 + Math.sin(t * 0.3 + q) * 18 - u * 0.1; if (!inView(R, X, Y, 20)) continue; bird(g, X, Y, 'crane', q, t, -1, quiet); }
    if (S === 2) for (let q = 0; q < 14; q++) { const u = ((t * 22 + q * 90) % 1400), X = box[0] - 200 + u, Y = box[1] + 20 + (q % 5) * 14 + (u * 0.18) + Math.abs(q * 5 % 7); if (!inView(R, X, Y, 20)) continue; bird(g, X, Y, 'bird', q, t, 1, 0.9); }   // autumn: V of migrating birds
    // event flocks
    for (const q of f.flocks) { if (q.t < 0) continue; const X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, 0) - (q.z || 30) - q.t * 4 * (q.kind === 'crane' ? 0 : 1); if (!inView(R, X, Y, 20)) continue; bird(g, X, Y + Math.sin(t * 2 + q.ph) * 3, q.kind, q.ph, t, q.vx >= 0 ? 1 : -1, clamp((q.life - q.t) / 3, 0, 1)); }
  }
  // ---------------------------------------------------------------- water: cascades, rim fall, pools, mist
  function drawWater(g, R, f, x0, y0, W, Hh) {
    const gg = geo(), t = R.t, N = TWM.N, surge = 1 + f.surge * 0.9, frozen = season(f) === 3 ? f.sf > 0.5 ? 0 : 1 : 1;
    for (const q of gg.falls) { const i = q.i, j = q.j, X = A.SX(i, j), Y = A.SY(i, j, TWM.H[q.k]), cxf = X + (q.side ? -16 : 16), top = Y + 24 + (q.side ? 0 : 0), hh = q.drop * 16; if (cxf < x0 - 40 || cxf > x0 + W + 40 || top > y0 + Hh + 40 || top + hh < y0 - 40) continue;
      const n = Math.min(14, 6 + q.drop * 2);
      for (let s = 0; s < n; s++) { const u = hash(i * 7 + s, j, 660), spd = 52 + u * 36 + q.drop * 3, y = ((t * spd + u * 200) % (hh + 6)), xx = cxf + (hash(s, i + j, 661) - 0.5) * 26 * (surge > 1.3 ? 1.1 : 1), yTop = top + (q.side ? (xx - cxf + 14) * 0.5 - 14 : -(xx - cxf - 14) * 0.5 + 0 - 14) + 14;
        const yy = Math.max(yTop, top - 4 + y - 6 + 8); if (yy > top + hh + 2) continue; g.fillStyle = `rgba(${240 + (u * 15) | 0},255,255,${0.55 * Math.min(1, surge * 0.8)})`; g.fillRect(Math.round(xx), Math.round(yy), 1, 3 + (s & 3)); }
      const baseY = top + hh + 6, sp = f.surge + 0.35; mist(g, cxf, baseY + 2, 30 + q.drop * 3, 9, 0.16 * sp * (q.rim ? 1.5 : 1)); for (let s = 0; s < 6; s++) { const u = (t * 0.5 + s / 6 + hash(i, j, 662)) % 1; blob(g, cxf + (hash(s, j, 663) - 0.5) * 36, baseY - u * 18, 7 + u * 8, '244,252,255', (1 - u) * 0.2 * sp); }
      if (q.rim) { for (let s = 0; s < 9; s++) { const u = (t * 0.35 + s / 9) % 1; blob(g, cxf + 6 + u * 16, baseY + 18 + u * 44, 10 + u * 12, '236,244,250', (1 - u) * 0.22); } }
    }
    // pools: ripples; lily pads in spring / summer; ice in winter handled by the ground overlay
    const F = Fm(); for (const k of F.stream) { if (TWM.MAT[k] !== TWM.M.POOL) continue; const i = k % N, j = Math.floor(k / N), X = A.SX(i, j), Y = A.SY(i, j, TWM.H[k]) + 16; if (!inView(R, X, Y, 40)) continue;
      for (let s = 0; s < 2; s++) { const u = (t * 0.45 + hash(i, j, 664) + s * 0.5) % 1; g.strokeStyle = `rgba(240,252,255,${(1 - u) * 0.45})`; g.beginPath(); g.ellipse(X + (hash(i, j, 665) - 0.5) * 14, Y, 3 + u * 14, 1.5 + u * 7, 0, 0, 7); g.stroke(); }
      if (season(f) !== 3 && season(f) !== 2) { px(g, X - 6 + (i & 3) * 3, Y - 2, 5, 2, '#3f9a48'); px(g, X - 5 + (i & 3) * 3, Y - 3, 2, 1, season(f) === 0 ? '#ffb6d0' : '#fff0f4'); } }
  }
  // ---------------------------------------------------------------- clouds, mist, shadows, light
  function drawSky(g, R, f, x0, y0, W, Hh) {
    const t = R.t, b = geo().box, w = b[2] - b[0], S = season(f), dark = clamp(f.storm * 0.55, 0, 0.6);
    // drifting cloud shadows over rocks
    g.globalCompositeOperation = 'multiply'; for (let q = 0; q < 5; q++) { const u = ((t * (6 + q * 1.5) + q * 330) % (w + 500)), X = b[0] - 250 + u, Y = b[1] + 160 + q * 120 + Math.sin(q * 2) * 40; if (X < x0 - 200 || X > x0 + W + 200 || Y < y0 - 150 || Y > y0 + Hh + 150) continue; mist(g, X, Y, 150 + q * 22, 56 + q * 8, 0.11 + dark * 0.1 + (S === 3 ? 0.03 : 0), '110,120,150'); } g.globalCompositeOperation = 'source-over';
    // cloud banks around the peaks at three speeds / depths; valley mist along the cascades
    for (let q = 0; q < 12; q++) { const lay = q % 3, sp = 2.2 + lay * 2.6 + (f.tl.on ? 14 : 0), u = ((t * sp + q * 260 + hash(q, 1, 670) * 300) % (w + 700)), X = b[0] - 350 + u, Y = b[1] + 40 + lay * 90 + (q * 37 % 80) + Math.sin(t * 0.15 + q) * 6; if (X < x0 - 260 || X > x0 + W + 260 || Y < y0 - 120 || Y > y0 + Hh + 120) continue;
      const rr = 90 + hash(q, 2, 670) * 70, al = (0.22 + lay * 0.05) * (S === 3 ? 0.9 : 1) * (1 + dark * 1.2); const col = dark > 0.1 ? '150,158,176' : S === 2 ? '250,238,224' : '252,252,255'; mist(g, X, Y, rr, rr * 0.32, al, col); mist(g, X + rr * 0.5, Y - 8, rr * 0.7, rr * 0.24, al * 0.9, col); mist(g, X - rr * 0.45, Y - 4, rr * 0.6, rr * 0.2, al * 0.8, col); }
    const m = f.mist; for (let q = 0; q < 9; q++) { const F = Fm(), n = F.tiles[Math.floor(hash(q, 3, 671) * F.tiles.length)], i = n % TWM.N, j = Math.floor(n / TWM.N), X = A.SX(i, j) + Math.sin(t * 0.12 + q * 1.7) * 36 + ((t * 3 + q * 50) % 60) - 30, Y = A.SY(i, j, TWM.H[n]) + 8; if (!inView(R, X, Y, 90)) continue; mist(g, X, Y, 80, 16, 0.1 + 0.18 * m, S === 3 ? '226,236,248' : '236,244,248'); }
    // light shafts from the heights; dim sky in a storm; summer glare
    if (S !== 3 && f.storm < 0.4) { const top = summitStatic(R); if (top) for (let q = 0; q < 3; q++) { const X = top.X + top.sp.w * (0.3 + q * 0.22) + Math.sin(t * 0.1 + q) * 20, gr = g.createLinearGradient(X, top.Y + 40, X + 50, top.Y + 460); gr.addColorStop(0, 'rgba(255,248,214,0.12)'); gr.addColorStop(1, 'rgba(255,248,214,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(X, top.Y + 40); g.lineTo(X + 28, top.Y + 40); g.lineTo(X + 110, top.Y + 460); g.lineTo(X + 40, top.Y + 460); g.fill(); } }
    if (dark > 0.02) { g.fillStyle = `rgba(30,40,64,${dark * 0.3})`; g.fillRect(x0, y0, W, Hh); }
    if (f.flash > 0.05) { g.fillStyle = `rgba(214,224,255,${f.flash * 0.22})`; g.fillRect(x0, y0, W, Hh); }
  }
  // ---------------------------------------------------------------- season particles
  function drawSeason(g, R, f, x0, y0, W, Hh) {
    const t = R.t, bx = geo().box, sa = f.sa, sb = f.sb, fr = f.sf, wind = f.wind, gust = (S_t() - (f.gustAt || -99) < 12) ? 1 : 0;
    const wgt = s => (sa === s ? 1 - fr : 0) + (sb === s ? fr : 0), cnt = (w, n) => Math.floor(n * w);
    const cols = clamp(Math.floor(W / 40), 12, 60);
    // spring petals / summer pollen / autumn leaves / winter flakes: columns across the view, falling with sway; kept only above the mountain
    const drop = (kind, n, wt) => { for (let q = 0; q < cnt(wt, n); q++) { const u = hash(q, kind, 680), v = hash(q, kind, 681), spd = kind === 3 ? 22 + v * 22 : kind === 2 ? 14 + v * 14 : 9 + v * 9, X0 = x0 + ((u * (W + 400) + t * (kind === 2 ? 22 + gust * 40 : 7 + wind * 4) * (1 + v) ) % (W + 400)) - 200, Y = y0 + ((v * (Hh + 200) + t * spd) % (Hh + 200)) - 100, X = X0 + Math.sin(t * (0.8 + v) + q) * (kind === 3 ? 5 : 12);
        if (!inAir(X, Y + 20 + (q % 4) * 40) && !inAir(X, Y)) continue;
        if (kind === 0) { g.fillStyle = q & 1 ? '#ffc0d6' : '#fff2f6'; g.fillRect(Math.round(X), Math.round(Y), 2, 1); if (q % 3 === 0) g.fillRect(Math.round(X) + 1, Math.round(Y) - 1, 1, 1); }
        else if (kind === 1) { g.globalAlpha = 0.5 + 0.3 * Math.sin(t + q); g.fillStyle = '#fff6c8'; g.fillRect(Math.round(X), Math.round(Y), 1, 1); g.globalAlpha = 1; }
        else if (kind === 2) { g.fillStyle = ['#e2741e', '#f4be3e', '#bd4222', '#d49628'][q & 3]; g.fillRect(Math.round(X), Math.round(Y), 2 + (q & 1), 2); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(Math.round(X), Math.round(Y), 1, 1); }
        else { g.fillStyle = '#ffffff'; g.fillRect(Math.round(X), Math.round(Y), q % 5 ? 1 : 2, q % 5 ? 1 : 2); } } };
    drop(0, 120, wgt(0)); drop(1, 40, wgt(1)); drop(2, 150 + gust * 150, wgt(2)); drop(3, 260 + (f.snowStorm > S_t() ? 520 : 0), wgt(3));
    // rain (spring showers, storms): slanted streaks + splashes
    if (f.rain > 0.03) { const n = Math.floor(f.rain * (W / 2)); g.strokeStyle = `rgba(190,215,240,${0.22 + f.rain * 0.3})`; g.beginPath(); for (let q = 0; q < n; q++) { const u = hash(q, 1, 690), v = hash(q, 2, 690), X = x0 + ((u * W + t * 40 * (1 + wind * 0.4)) % W), Y = y0 + ((v * Hh + t * 340) % Hh); if (!inAir(X, Y + 30)) continue; g.moveTo(X, Y); g.lineTo(X - 4 - wind * 2, Y + 11); } g.stroke(); }
    // butterflies (spring, summer, early autumn) and fireflies (summer dusk / night)
    const but = wgt(0) * 12 + wgt(1) * 14 + wgt(2) * 3; for (let q = 0; q < but; q++) { const gg = geo(), k = gg.meadow[Math.floor(hash(q, 4, 691) * Math.max(1, gg.meadow.length))]; if (k === undefined) break; const N = TWM.N, i = k % N, j = Math.floor(k / N), X = A.SX(i, j) + Math.sin(t * 0.5 + q * 2.1) * 40 + Math.cos(t * 0.31 + q) * 20, Y = A.SY(i, j, TWM.H[k]) - 14 - Math.abs(Math.sin(t * 0.7 + q)) * 22 + Math.sin(t * 2 + q) * 4; if (!inView(R, X, Y, 20)) continue; const w = Math.sin(t * 14 + q * 3) > 0 ? 2 : 1, c = ['#ffd24a', '#ff9ec4', '#fff', '#9ec8ff', '#ff8a4a'][q % 5]; px(g, X - w, Y, w, 2, c); px(g, X + 1, Y, w, 2, c); px(g, X, Y, 1, 2, '#2a2020'); }
    const night = R.dark || 0; if ((wgt(1) + wgt(0) * 0.5) > 0.1 && night > 0.25) for (let q = 0; q < 26; q++) { const gg = geo(), k = gg.meadow[Math.floor(hash(q, 5, 692) * Math.max(1, gg.meadow.length))]; if (k === undefined) break; const N = TWM.N, i = k % N, j = Math.floor(k / N), X = A.SX(i, j) + Math.sin(t * 0.4 + q * 1.9) * 26, Y = A.SY(i, j, TWM.H[k]) - 8 - (q % 5) * 4 + Math.sin(t * 0.9 + q) * 6, a = (Math.sin(t * 1.7 + q * 2.3) + 1) / 2; if (!inView(R, X, Y, 20)) continue; g.globalCompositeOperation = 'lighter'; blob(g, X, Y, 6, '200,255,120', 0.5 * a * night); px(g, X, Y, 1, 1, `rgba(255,255,190,${a})`); g.globalCompositeOperation = 'source-over'; }
    // winter: frost sparkles on the cliffs and icicles along the lips of the falls
    if (wgt(3) > 0.05) { const w3 = wgt(3); for (const l of geo().lips) { const X = A.SX(l.i, l.j) + (l.side ? -16 : 16), Y = A.SY(l.i, l.j, l.h) + 24; if (!inView(R, X, Y, 30)) continue; for (let s = 0; s < 3; s++) { const ox = (s - 1) * 7 + (hash(l.i, l.j + s, 693) - 0.5) * 4, len = 3 + Math.floor(hash(l.i + s, l.j, 694) * 6) * w3; g.fillStyle = `rgba(214,238,250,${0.9 * w3})`; g.fillRect(Math.round(X + ox), Math.round(Y), 1, Math.round(len)); g.fillStyle = `rgba(255,255,255,${0.9 * w3})`; g.fillRect(Math.round(X + ox), Math.round(Y), 1, 1); } if ((Math.floor(t * 2 + l.i * 3 + l.j) % 7) === 0) px(g, X + 5, Y + 6, 1, 1, '#fff'); } }
    // spring: a rainbow after a storm
    if (f.rainbow > 0.03) { const top = summitStatic(R); if (top) { const cx = top.X + top.sp.w * 0.7, cy = top.Y + 420; for (let q = 0; q < 6; q++) { g.strokeStyle = `rgba(${['255,90,90', '255,170,70', '255,236,100', '120,220,120', '100,170,255', '170,120,230'][q]},${0.22 * f.rainbow})`; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 380 - q * 3, Math.PI * 1.12, Math.PI * 1.88); g.stroke(); } g.lineWidth = 1; } }
  }
  // ---------------------------------------------------------------- event bursts, rocks, dust, cracks, light, wukong's trail, caption
  function drawEvents(g, R, f, x0, y0, W, Hh) {
    const t = R.t; for (const b of f.bursts) { const X = R.wx(b.x, b.y), Y = R.wy(b.x, b.y, TWM.groundZ(b.x, b.y)), a = b.t / (b.kind === 'burst' ? 2.4 : 1.6); if (!inView(R, X, Y, 140)) continue;
      if (b.kind === 'dust') { for (let q = 0; q < 8; q++) blob(g, X + (hash(q, 1, 700) - 0.5) * 36, Y - a * 26 - q * 2, 10 + a * 16, '170,150,126', (1 - a) * 0.4); }
      else if (b.kind === 'gold') { g.globalCompositeOperation = 'lighter'; blob(g, X, Y - 20, 40 + a * 90, '255,224,130', (1 - a) * 0.6); g.strokeStyle = `rgba(255,236,160,${(1 - a) * 0.8})`; g.beginPath(); g.ellipse(X, Y - 10, 10 + a * 150, 4 + a * 60, 0, 0, 7); g.stroke(); g.globalCompositeOperation = 'source-over'; }
      else if (b.kind === 'smoke') { for (let q = 0; q < 10; q++) blob(g, X + Math.cos(q + a * 3) * (10 + a * 26), Y - 20 - a * 30 - q * 2, 12 + a * 14, '246,242,236', (1 - a) * 0.6); g.globalCompositeOperation = 'lighter'; blob(g, X, Y - 20, 20 + a * 40, '255,230,150', (1 - a) * 0.3); g.globalCompositeOperation = 'source-over'; }
      else if (b.kind === 'burst') { g.globalCompositeOperation = 'lighter'; blob(g, X, Y - 26, 90 + a * 200, '255,234,160', (1 - a) * 0.8); for (let r = 0; r < 3; r++) { g.strokeStyle = `rgba(255,${230 - r * 30},${150 - r * 30},${(1 - a) * 0.9})`; g.lineWidth = 4 - r; g.beginPath(); g.ellipse(X, Y - 8, 20 + a * (260 - r * 40), 8 + a * (120 - r * 20), 0, 0, 7); g.stroke(); } g.lineWidth = 1; for (let q = 0; q < 30; q++) { const ang = q * 0.21, d = a * (60 + hash(q, 1, 701) * 150); g.fillStyle = `rgba(255,236,170,${(1 - a)})`; g.fillRect(Math.round(X + Math.cos(ang) * d), Math.round(Y - 24 + Math.sin(ang) * d * 0.7), 2, 2); } g.globalCompositeOperation = 'source-over'; } }
    for (const q of f.dust) { if (q.t < 0) continue; const u = q.t / q.life, X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, TWM.groundZ(q.x, q.y)) - q.z - u * 20; if (!inView(R, X, Y, 60)) continue; blob(g, X, Y, 14 + u * 26, '176,158,136', (1 - u) * 0.34); }
    for (const q of f.rocks) { if (q.t < 0) continue; const u = q.t / q.life, X = R.wx(q.x, q.y), gz = TWM.groundZ(q.x, q.y), fall = Math.min(1, u * 1.6), z = q.z * (1 - fall * fall), Y = R.wy(q.x, q.y, gz) - z; if (!inView(R, X, Y, 90)) continue; if (fall < 1) { px(g, X, Y, 2 + q.sz, 2 + q.sz, '#5c5a62'); px(g, X, Y, 1, 1, '#a09ca6'); } else blob(g, X, Y, 6 + (u - 0.625) * 30, '150,136,120', (1 - u) * 0.5); }
    // golden light in the cracks of the mountain + columns over the summit and the prison
    if (f.cracks > 0.03 || f.light > 0.03) { const s = summitStatic(R), pr = Fm().prison, cr = Math.max(f.cracks, f.light); g.globalCompositeOperation = 'lighter';
      if (s) { const X = s.X + s.sp.w * 0.545, Y = s.Y + 14; for (let w = 0; w < 6; w++) { const gr = g.createLinearGradient(X, Y - 520, X, Y + 150), k = (1 - w / 6) * f.light; gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(0.45, `rgba(255,226,140,${0.1 * k})`); gr.addColorStop(0.85, `rgba(255,255,230,${0.14 * k})`); gr.addColorStop(1, 'rgba(255,255,230,0)'); g.fillStyle = gr; g.fillRect(X - 30 + w * 4, Y - 520, 60 - w * 8, 670); } blob(g, X, Y, 90, '255,236,170', 0.35 * f.light);
        for (let q = 0; q < 7; q++) { const ang = hash(q, 1, 710) * 6, len = 30 + hash(q, 2, 710) * 60; g.strokeStyle = `rgba(255,226,130,${0.8 * f.cracks})`; g.beginPath(); let xx = X + (hash(q, 3, 710) - 0.5) * 40, yy = Y + 60 + hash(q, 4, 710) * 110; g.moveTo(xx, yy); for (let r = 0; r < 4; r++) { xx += Math.cos(ang + r * 0.7) * len / 4; yy += (hash(q, r + 5, 710) - 0.3) * len / 4 + 6; g.lineTo(xx, yy); } g.stroke(); } }
      const pp = TW(11.5, 25); const X = R.wx(pp[0], pp[1]), Y = R.wy(pp[0], pp[1], TWM.groundZ(pp[0], pp[1])) - 30; blob(g, X, Y, 70, '255,226,150', 0.4 * cr); g.globalCompositeOperation = 'source-over'; }
    // Wukong's flight: a trail of golden cloud puffs
    if (window.TWS) for (const a of TWS.agents) if (a.biome === 'nhs' && a.role === 'actor' && a.ride && a.lift > 8 && !a.hidden) { const X = R.wx(a.x, a.y), Y = R.wy(a.x, a.y, a.gz + a.lift); g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 12; q++) { const u = (t * 1.4 + q / 12) % 1; blob(g, X - (q % 2 ? 1 : -1) * u * 36 + Math.sin(q) * 4, Y + 10 + u * 22, 8 + u * 12, '255,236,170', (1 - u) * 0.32); } g.globalCompositeOperation = 'source-over'; }
  }
  const TW = (a, b) => [(Fm().x0 + a + 0.5) * T, (Fm().y0 + b + 0.5) * T];
  function drawCaption(g, R, f, x0, y0, W, Hh) {
    const tl = f.tl; if (tl.show < 0.03) return; const b = geo().box, cx = R.cx, cy = R.cy; if (cx < b[0] - 500 || cx > b[2] + 500 || cy < b[1] - 300 || cy > b[3] + 400) return;
    g.save(); g.globalAlpha = tl.show; g.textAlign = 'center'; g.font = 'bold 20px Georgia, serif'; const yr = tl.years, line = yr <= 0 ? 'Bị đè dưới Ngũ Hành Sơn…' : `Năm thứ ${yr}`, X = x0 + W / 2, Y = y0 + Hh * 0.2;
    g.fillStyle = 'rgba(12,10,20,0.55)'; const w = g.measureText(line).width + 40; g.fillRect(Math.round(X - w / 2), Math.round(Y - 22), Math.round(w), 36); g.strokeStyle = 'rgba(242,196,80,0.7)'; g.strokeRect(Math.round(X - w / 2) + 0.5, Math.round(Y - 22) + 0.5, Math.round(w) - 1, 35);
    g.fillStyle = '#f6dc90'; g.fillText(line, X, Y + 2); g.font = '12px Georgia, serif'; g.fillStyle = '#cdbf9a'; g.fillText(['Xuân', 'Hạ', 'Thu', 'Đông'][f.sf > 0.5 ? f.sb : f.sa], X, Y + 12); g.restore();
  }
  // ---------------------------------------------------------------- story camera (eases toward the action, only while the viewer is looking at the mountain and has not touched the view)
  function camera(R, f) {
    if (!window.TWS || !(TWS.biomes.nhs.phase === 'sig' || (TWS.biomes.nhs.phase === 'after' && f.seal.st === 'return'))) return; if (R.t - (R.userT || -99) < 7) return; const b = geo().box, cx = R.cx, cy = R.cy; if (cx < b[0] - 200 || cx > b[2] + 200 || cy < b[1] - 200 || cy > b[3] + 300) return;
    const ag = TWS.agents.filter(a => a.biome === 'nhs' && a.role === 'actor' && !a.gone && !a.hidden), wk = ag.find(a => a.char === 'wukong' || a.look === 'wk_pilgrim'), mk = ag.find(a => a.char === 'tam_tang'); let tx = null, ty = null;
    if (wk && (wk.lift > 4 || wk.ride)) { tx = R.wx(wk.x, wk.y); ty = R.wy(wk.x, wk.y, wk.gz + wk.lift) + 40; }
    else if (mk) { tx = R.wx(mk.x, mk.y); ty = R.wy(mk.x, mk.y, mk.gz + mk.lift) - 40; }
    else if (f.seal.st === 'return') { const sm0 = summitStatic(R); if (sm0) { tx = sm0.X + sm0.sp.w * 0.545; ty = sm0.Y + 150; } }
    else if (f.tl.on) { const p = TW(11.5, 20); tx = R.wx(p[0], p[1]); ty = R.wy(p[0], p[1], 40) - 40; }
    if (tx === null) return; const k = 1 - Math.exp(-1.8 * 0.016); R.cx += (tx - R.cx) * k; R.cy += (ty - R.cy) * k; if (R.clamp) R.clamp();
  }
  function draw(g, S, R, x0, y0, W, Hh) {
    const f = st(); if (!f) return; sync(f); const b = geo().box; if (x0 + W < b[0] - 400 || x0 > b[2] + 400 || y0 + Hh < b[1] - 400 || y0 > b[3] + 500) return;
    drawWater(g, R, f, x0, y0, W, Hh); drawSky(g, R, f, x0, y0, W, Hh); drawSeason(g, R, f, x0, y0, W, Hh); drawBirds(g, R, f, x0, y0, W, Hh); drawEvents(g, R, f, x0, y0, W, Hh); drawCaption(g, R, f, x0, y0, W, Hh); camera(R, f);
  }
  function light(g, S, R, amt) {
    const f = st(); if (!f || amt < 0.05) return; const b = geo().box, F = Fm(); if (R.cx < b[0] - 600 || R.cx > b[2] + 600 || R.cy < b[1] - 500 || R.cy > b[3] + 600) return; const t = R.t;
    const sm0 = summitStatic(R); if (sm0 && f.seal.st !== 'gone') { const X = sm0.X + sm0.sp.w * 0.545, Y = sm0.Y + 14; blob(g, X, Y, 110, '255,214,110', 0.4 * amt * (0.8 + 0.2 * Math.sin(t * 2.6))); }
    const pp = TW(11.5, 25), X = R.wx(pp[0], pp[1]), Y = R.wy(pp[0], pp[1], TWM.groundZ(pp[0], pp[1])) - 30; blob(g, X, Y, 70, '255,214,140', 0.16 * amt + f.glow * 0.2);
    for (const l of F.lamps || []) { const X2 = R.wx((l[0] + 0.5) * T, (l[1] + 0.5) * T), Y2 = R.wy((l[0] + 0.5) * T, (l[1] + 0.5) * T, TWM.groundZ((l[0] + 0.5) * T, (l[1] + 0.5) * T)) - 14; if (inView(R, X2, Y2, 60)) blob(g, X2, Y2, 40, '255,200,120', 0.22 * amt * (0.85 + 0.15 * Math.sin(t * 7 + l[0]))); }
  }
  TWFX.nhs = { drawables, draw, light, chunkOverlay };
  // the prison sprite animates itself: plug the draw into the sprite table
  const base = A.nhs.sprite; A.nhs.sprite = function (p) { if (p.kind === 'nhsprison') { const r = A.IMG['nhs_prison_a']; if (!r) return null; return { w: r.w, h: r.h, py: r.py, frames: [r.im], flat: false, sway: 0, draw: (g, s, f, R) => drawPrison(g, s, f, R) }; } return base(p); };
})();
