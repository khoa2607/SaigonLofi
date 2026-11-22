'use strict';
// ===== Tây Du Ký v2 — Ngũ Trang Quán: art (loaded after tw-art.js; plugs into TWA.ntq) =====
// Code-painted terrain in the v2 pixel style: an emerald jade lawn (sunlit golden tips, white and pink petals), white-jade paving with moss joints, pale blue-grey limestone, raked golden gravel,
// a clear jade-green stream with white foam; cliff faces (stratified limestone, moss drips, pink blossom flecks, a seeping curtain of water).
// Landmark sprites: the Ginseng Fruit Tree and the hall are PixelLab objects (tools/sprite_picks.json); the rest of the Daoist garden reuses the Heaven / peach sprites already in the library.
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const LWN = ramp(['#12362c', '#1d5a45', '#2c7d56', '#46a56a', '#76ca84', '#a9e2a0', '#dcf4b4']);        // jade lawn
  const PVE = ramp(['#3d5052', '#5e7678', '#86a0a0', '#aec6c2', '#d2e2da', '#eef6ee']);                    // white-jade paving
  const QRK = ramp(['#233640', '#3a5662', '#587a84', '#7ea0a6', '#a6c2c2', '#cfe0da']);                    // limestone
  const GRV = ramp(['#5c4e32', '#7e6e46', '#a2905e', '#c4b07a', '#dcc995', '#f0e2b4']);                    // raked golden gravel
  const WTR = ramp(['#0b3640', '#12606a', '#1c8a90', '#38b2aa', '#78dac6', '#c0f4e2', '#f2fffa']);         // jade stream
  const MSS = ramp(['#1b4a34', '#2b6e48', '#46965a', '#7cc47a']);
  const STAIR = ramp(['#4a5c60', '#66807f', '#86a09c', '#aac4bc', '#cde0d6']);
  const INKF = [14, 30, 34];
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const fbm = (I, J, s) => vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let shore = null; const isW = m => m === M.STREAM || m === M.POOL;
  function buildShore() { shore = new Uint8Array(TWM.N * TWM.N); const N = TWM.N, MAT = TWM.MAT;
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const k = j * N + i; if (!isW(MAT[k])) continue; let b = 0; const Lf = q => MAT[q] !== M.VOID && !isW(MAT[q]);
      if (Lf(k - 1)) b |= 1; if (Lf(k + 1)) b |= 2; if (Lf(k - N)) b |= 4; if (Lf(k + N)) b |= 8; shore[k] = b; } }
  function water(m, I, J, X, Y, k, SH, d) {
    if (!shore) buildShore(); SH.water = 2;
    const f = fbm(I * 1.4, J * 0.5, 830), st = vnoise(I * 2.4, J * 0.6, 831), br = Math.max(0, st - 0.6) * 3 + Math.max(0, vnoise(I * 1.1, J * 0.3, 832) - 0.66) * 1.4;
    let c = tone(WTR, 1.6 + f * 3 + (d ? 0.2 : 0)); if (br > 0.2) c = mix(c, [240, 255, 250], clamp(br * 0.75, 0, 0.88));
    if (m === M.POOL && vnoise(I * 0.7, J * 0.7, 833) > 0.7) c = mix(c, [255, 214, 226], 0.16);                       // drifting blossom petals
    const fi = I - Math.floor(I), fj = J - Math.floor(J), b = shore[k];
    if (b) { let e = 9; if (b & 1) e = Math.min(e, fi); if (b & 2) e = Math.min(e, 1 - fi); if (b & 4) e = Math.min(e, fj); if (b & 8) e = Math.min(e, 1 - fj);
      const n = vnoise(I * 2.2, J * 2.2, 834), reach = 0.18 + n * 0.14; if (e < reach) c = mix(c, [240, 255, 250], clamp((1 - e / reach) * 1.1 - 0.1, 0, 0.9)); }
    return c;
  }
  function top(m, I, J, X, Y, k, d, SH) {
    if (isW(m)) return water(m, I, J, X, Y, k, SH, d);
    const n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), lit = fbm(I - 0.13, J - 0.13, 840) - fbm(I + 0.13, J + 0.13, 840);
    if (m === M.QPAVE) { const u = I * 1.5, v = J * 1.5, row = Math.floor(v), seam = ((u + (row & 1) * 0.5) % 1) < 0.07 || (v % 1) < 0.08; let c = seam ? tone(PVE, 0.7 + n1) : tone(PVE, 2.6 + n0 * 1.3 + n1 * 0.6 + lit * 3 + hash2(Math.floor(u + (row & 1) * 0.5), row, 841) * 0.9); if (seam && n1 > 0.62) c = mix(c, MSS[2], 0.7); else if (n1 > 0.82 && !seam) c = mix(c, MSS[3], 0.35); if (hp < 0.012) return [255, 196, 214]; if (hp > 0.995) return [255, 240, 170]; return c; }
    if (m === M.QGRAV) { const u = I * 2.4, v = J * 2.4, cx = Math.floor(u), cy = Math.floor(v), h0 = hash2(cx, cy, 843); let c = tone(GRV, 1.8 + h0 * 2 + lit * 3 + n0 * 0.8); const rake = Math.abs(((I * 0.9 + J * 0.9) % 0.5) - 0.25); if (rake < 0.05) c = shade(c, 0.86); if (n1 > 0.84 && hp < 0.6) c = mix(c, LWN[4], 0.4); return c; }
    if (m === M.QROCK) { let c = tone(QRK, 1.4 + fbm(I, J, 845) * 3.4 + lit * 5 + (d ? 0.2 : 0)); const st = Math.abs(((I * 0.8 + J * 0.6 + vnoise(I * 0.3, J * 0.3, 846) * 2.4) % 1) - 0.5); if (st < 0.05) c = shade(c, 0.78); if (n1 > 0.66 && hp < 0.55) c = mix(c, MSS[1 + (hp < 0.2 ? 1 : 0)], 0.6); if (hp > 0.992) return [255, 192, 214]; return c; }
    // QLAWN (and anything unknown): the jade lawn
    let c = tone(LWN, 1.7 + fbm(I, J, 847) * 3.2 + lit * 4.5 + (d ? 0.2 : 0)); if (n0 > 0.62) c = mix(c, LWN[5], 0.28); if (hp < 0.05) c = mix(c, LWN[6], 0.5); if (n1 > 0.78 && hp < 0.7) c = mix(c, LWN[2], 0.5);
    if (hp < 0.007) return [255, 196, 216]; if (hp > 0.992) return [255, 250, 232]; if (hp > 0.985) return [255, 226, 120]; return c;
  }
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const m = TWM.MAT[k];
    if (ry === drop - 1) return INKF;
    if (isW(m)) { const col = vnoise(gx * 0.45, 0.5, 850), flow = vnoise(gx * 0.8, elev * 0.05, 851), s = (side ? 0.5 : 0) + col * 1.8 + flow * 1.5;
      if (ry < 2) return WTR[6]; if (ry > drop - 4) return mix(tone(WTR, 3 + col * 2), [240, 255, 250], 0.5); return tone(WTR, Math.min(6, 1.8 + s + (vnoise(gx * 1.6, ry * 0.12, 853) > 0.7 ? 1.8 : 0) - (ry / drop) * 0.4)); }
    const band = Math.floor((elev + vnoise(gx * 0.09, 0.5, 855) * 6) / 6);
    let t = (side ? 0.9 : 2.2) + hash2(band, Math.floor(gx / 9), 856) * 1.4 + (vnoise(gx * 0.2, elev * 0.14, 857) - 0.5) * 2;
    if ((elev + Math.floor(vnoise(gx * 0.1, 0, 858) * 5)) % 6 === 0) t -= 1; if (ry > drop - 4) t -= (4 - (drop - ry)) * 0.4;
    let c = tone(QRK, t);
    const dl = drop * (0.25 + 0.55 * vnoise(gx * 0.18, 0.7, 860)); if (ry < dl && vnoise(gx * 0.4, ry * 0.2, 861) > 0.4) c = mix(c, tone(MSS, 0.5 + vnoise(gx * 0.3, ry * 0.3, 862) * 2.6), 0.82);
    if (vnoise(gx * 0.7 + elev * 0.2, elev * 0.4, 863) > 0.88) c = mix(c, [255, 206, 222], 0.5);                  // blossom drifts caught on the ledges
    if (m === M.QPAVE) { const course = Math.floor((elev + 1) / 5), mort = (elev % 5) === 0 || ((gx + (course & 1) * 6) % 12) === 0; c = tone(PVE, 2.2 + hash2(Math.floor(gx / 6), course, 864) * 1.2 + (side ? -0.8 : 0)); if (mort) c = shade(c, 0.78); }
    return c;
  }
  const edge = (c, k) => { const m = TWM.MAT[k]; if (isW(m)) return [226, 252, 246]; return INKF; };
  const seamTone = (I, J, n0, n1) => tone(LWN, 1.6 + n0 * 2 + n1 * 0.7);
  // ---- code-painted shrubs and flower beds (evergreen: this is an immortal garden, always in bloom)
  const cache = new Map(), mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  function paintBush(v) {
    const w = 26, h = 20, cv = mk(w, h), g = cv.getContext('2d'), P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); }, base = ['#1d5a45', '#2c7d56', '#46a56a', '#76ca84'];
    for (let q = 0; q < 14; q++) { const cx = 4 + hash2(q, v, 190) * 18, cy = 6 + hash2(q, v, 191) * 8, r = 3 + hash2(q, v, 192) * 3; for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { if (xx * xx + yy * yy > r * r) continue; const t = clamp((-yy + r) / (2 * r) * 3.2 + hash2(Math.round(cx + xx), Math.round(cy + yy), 193) * 0.9 - 0.4, 0, 3.4); P(Math.round(cx + xx), Math.round(cy + yy), 1, 1, base[Math.min(3, Math.floor(t))]); } }
    P(3, 15, 20, 2, 'rgba(10,30,30,0.28)'); const pc = [['#ffbad2', '#fdf0f4', '#ffe45a'], ['#ffffff', '#ffd0e0', '#c8f0ff'], ['#ff9fc0', '#fff4a0', '#ffffff'], ['#ffd45a', '#ffffff', '#ffbad2']][v & 3];
    for (let q = 0; q < 16; q++) P(4 + Math.floor(hash2(q, v, 195) * 18), 5 + Math.floor(hash2(q, v, 196) * 9), 2, 2, pc[q % 3]); return cv;
  }
  function paintFlowers(v) {   // herb and flower beds: rows of leafy plants with blossoms
    const w = 22, h = 12, cv = mk(w, h), g = cv.getContext('2d'), P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
    const pal = [['#ffb6d0', '#fdf2f6', '#ffe45a', '#c4a4f4', '#9ae6e0'], ['#ff9fc0', '#ffd45a', '#ffffff', '#a98bf0', '#7ad8c4'], ['#e8f8a0', '#9ae6a0', '#ffffff', '#ffd0e0', '#78c8a0'], ['#ffffff', '#ffe0ec', '#d8f4ff', '#ffee90', '#ffb6d0']][v & 3];
    for (let q = 0; q < 34; q++) { const x = 1 + Math.floor(hash2(q, v, 201) * 19), y = 3 + Math.floor(hash2(q, v, 202) * 8); P(x, y + 1, 1, 2, '#3f9a5a'); P(x - (q & 1), y, 2 + (q & 1), 2, pal[q % 5]); } return cv;
  }
  const KINDS = { qhall: ['ntq_hall_a', 'ntq_hall_b'], qgate: ['gate_a', 'gate_b'], qpalace: ['tc_palace_a', 'tc_palace_b'], qpav: ['tc_pavilion_a', 'hps_pavilion_a'], qkiln: ['tc_brazier_a'], qshrine: ['shrine_c', 'shrine_a'],
    qbridge: ['tc_bridge_a', 'tc_bridge_b'], qlotus: ['lotus_a', 'lotus_b'], qlamp: ['lantern_a', 'lantern_b'], qrock: ['scholar_a', 'scholar_b'], qbamboo: ['bamboo_a', 'bamboo_b', 'bamboo_c'],
    qpeach: ['peachtree_a', 'peachtree_b', 'peachtree_c', 'peachtree_d'], qtreeb: ['nhs_tree_a', 'nhs_tree_b', 'nhs_tree_c', 'nhs_tree_d'] };
  Object.assign(A.IMGKINDS, KINDS);
  A.GLOWS.push('ntq_hall_', 'tc_pavilion_', 'tc_palace_', 'gate_');
  Object.assign(A.SWAY, { qpeach: 1.4, qbamboo: 1.8, qtreeb: 1.0, qlamp: 0.2, qlotus: 0.4, qrock: 0 });
  function sprite(p) {
    if (p.kind === 'qbush' || p.kind === 'qflower') { const key = p.kind + ((p.v || 0) & 3); let o = cache.get(key); if (!o) { const cv = p.kind === 'qbush' ? paintBush(p.v & 3) : paintFlowers(p.v & 3); o = { w: cv.width, h: cv.height, py: p.kind === 'qbush' ? 17 : 10, frames: [cv], flat: false, sway: p.kind === 'qbush' ? 0.5 : 0.25 }; cache.set(key, o); } return o; }
    if (p.kind === 'qtree') { const r = A.IMG['ntq_tree_a']; if (!r) return null; return { w: r.w, h: r.h, py: r.py, frames: [r.im], flat: false, sway: 0, draw: (g, s, f, R) => { if (window.TWFX && TWFX.ntq) TWFX.ntq.drawTree(g, s, R, r); else g.drawImage(r.im, s.X, s.Y); } }; }
    return null;
  }
  A.ntq = { top, face, edge, stairPal: STAIR, seamTone, sprite, ramps: { LWN, PVE, QRK, GRV, WTR }, MSS };
})();
