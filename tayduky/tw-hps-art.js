'use strict';
// ===== Tây Du Ký v2 — Hắc Phong Sơn: art (loaded after tw-art.js; plugs into TWA.hps) =====
// Code-painted terrain in the v2 pixel style, world-space shaded: black basalt crags with blue-grey strata, dark pine-needle turf, scree gravel, flagstone monastery courts with moss in the joints,
// timber decks, a clear mountain stream (white foam, cascades); cliff faces (stratified basalt, moss drips, a seeping stream curtain). Landmark sprites come from PixelLab (tools/sprite_picks.json).
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const ROC = ramp(['#0c1118', '#141c26', '#1e2a38', '#2b3b4d', '#3c5066', '#546c82', '#7690a4']);        // basalt
  const MOS = ramp(['#0f1d18', '#16291f', '#1f3a2a', '#2c4f37', '#3d6a46', '#58875a', '#7fa972']);          // dark mountain turf
  const GRV = ramp(['#2a2724', '#3d3935', '#554f48', '#716a60', '#8f877a', '#b0a898']);                    // scree / path gravel
  const FLG = ramp(['#26232a', '#3a3640', '#524d58', '#6f6974', '#8d8690', '#b0a8ae']);                    // flagstone
  const DCK = ramp(['#1f130d', '#33200f', '#4b3017', '#664321', '#835a2e', '#a47a45']);                    // timber deck
  const WTR = ramp(['#0a2230', '#0f3a50', '#17566e', '#2a7f94', '#58b0bc', '#a6dde0', '#eafafa']);         // stream
  const MSS = ramp(['#1d3a2c', '#2a5238', '#3d7048', '#5f9a5c']);
  const STAIR = ramp(['#2d3340', '#434a5a', '#5b6578', '#76839a', '#97a6ba']);
  const INKF = [8, 12, 20];
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const fbm = (I, J, s) => vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let shore = null;
  const isW = m => m === M.STREAM || m === M.POOL;
  function buildShore() { shore = new Uint8Array(TWM.N * TWM.N); const N = TWM.N, MAT = TWM.MAT;
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const k = j * N + i; if (!isW(MAT[k])) continue; let b = 0; const Lf = q => MAT[q] !== M.VOID && !isW(MAT[q]);
      if (Lf(k - 1)) b |= 1; if (Lf(k + 1)) b |= 2; if (Lf(k - N)) b |= 4; if (Lf(k + N)) b |= 8; shore[k] = b; } }
  function water(m, I, J, X, Y, k, SH, d) {
    if (!shore) buildShore(); SH.water = 2;
    const f = fbm(I * 1.4, J * 0.5, 430), st = vnoise(I * 2.4, J * 0.6, 431), br = Math.max(0, st - 0.58) * 3 + Math.max(0, vnoise(I * 1.1, J * 0.3, 432) - 0.64) * 1.6;
    let c = tone(WTR, 1.4 + f * 3 + (d ? 0.2 : 0)); if (br > 0.2) c = mix(c, [238, 252, 252], clamp(br * 0.75, 0, 0.88));
    const fi = I - Math.floor(I), fj = J - Math.floor(J), b = shore[k];
    if (b) { let e = 9; if (b & 1) e = Math.min(e, fi); if (b & 2) e = Math.min(e, 1 - fi); if (b & 4) e = Math.min(e, fj); if (b & 8) e = Math.min(e, 1 - fj);
      const n = vnoise(I * 2.2, J * 2.2, 433), reach = 0.18 + n * 0.14; if (e < reach) c = mix(c, [238, 252, 252], clamp((1 - e / reach) * 1.1 - 0.1, 0, 0.9)); }
    return c;
  }
  function top(m, I, J, X, Y, k, d, SH) {
    if (isW(m)) return water(m, I, J, X, Y, k, SH, d);
    const n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), lit = fbm(I - 0.13, J - 0.13, 440) - fbm(I + 0.13, J + 0.13, 440);
    if (m === M.HFLAG) { const u = I * 1.5, v = J * 1.5, row = Math.floor(v), seam = ((u + (row & 1) * 0.5) % 1) < 0.07 || (v % 1) < 0.08; let c = seam ? tone(FLG, 0.5 + n1) : tone(FLG, 2.2 + n0 * 1.4 + n1 * 0.6 + lit * 3 + hash2(Math.floor(u + (row & 1) * 0.5), row, 441) * 0.9); if (seam && n1 > 0.62) c = mix(c, MSS[1], 0.7); else if (n1 > 0.8 && !seam) c = mix(c, MSS[2], 0.4); if (hp < 0.004) return [226, 182, 120]; return c; }
    if (m === M.HDECK) { const row = Math.floor(J * 2.4), c = tone(DCK, 2.2 + hash2(Math.floor(I * 0.6 + row * 0.37), row, 442) * 1.9 + n1 * 0.5 + (d ? 0.1 : 0)); if (((J * 2.4) % 1) < 0.1) return tone(DCK, 0.3); if (hp < 0.012) return [170, 160, 140]; return c; }
    if (m === M.HGRAV) { const u = I * 2.4, v = J * 2.4, cx = Math.floor(u), cy = Math.floor(v), h0 = hash2(cx, cy, 443); let c = tone(GRV, 1.4 + h0 * 2.4 + lit * 3 + n0 * 0.8); if (hash2(Math.floor(u * 1.7), Math.floor(v * 1.7), 444) > 0.86) c = shade(c, 1.15); if (n1 > 0.82 && hp < 0.6) c = mix(c, MOS[3], 0.5); return c; }
    if (m === M.HROCK) { let c = tone(ROC, 1.2 + fbm(I, J, 445) * 3.4 + lit * 5 + (d ? 0.2 : 0)); const st = Math.abs(((I * 0.8 + J * 0.6 + vnoise(I * 0.3, J * 0.3, 446) * 2.4) % 1) - 0.5); if (st < 0.05) c = shade(c, 0.7); if (n1 > 0.7 && hp < 0.5) c = mix(c, MOS[1 + (hp < 0.2 ? 1 : 0)], 0.62); if (hp < 0.0016) { SH.em = [120, 200, 255]; return [150, 220, 255]; } return c; }
    // HMOSS (and anything unknown): dark pine-needle turf with tufts, needle litter and the odd red maple leaf
    let c = tone(MOS, 1.2 + fbm(I, J, 447) * 3.2 + lit * 4.5 + (d ? 0.2 : 0)); if (hp < 0.05) c = mix(c, MOS[6], 0.5); if (n0 > 0.7) c = mix(c, [58, 44, 30], 0.35); if (hp < 0.006) return [190, 72, 48]; if (hp > 0.992) return [210, 150, 70]; return c;
  }
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const m = TWM.MAT[k];
    if (ry === drop - 1) return INKF;
    if (isW(m)) { const col = vnoise(gx * 0.45, 0.5, 450), flow = vnoise(gx * 0.8, elev * 0.05, 451), s = (side ? 0.5 : 0) + col * 1.8 + flow * 1.5;
      if (ry < 2) return WTR[6]; if (ry > drop - 4) return mix(tone(WTR, 3 + col * 2), [240, 252, 252], 0.5); return tone(WTR, Math.min(6, 1.6 + s + (vnoise(gx * 1.6, ry * 0.12, 453) > 0.7 ? 1.8 : 0) - (ry / drop) * 0.4)); }
    const band = Math.floor((elev + vnoise(gx * 0.09, 0.5, 455) * 6) / 7);
    const base = m === M.HFLAG ? FLG : m === M.HGRAV ? GRV : m === M.HDECK ? DCK : m === M.HMOSS ? MOS : ROC;
    let t = (side ? 0.8 : 2) + hash2(band, Math.floor(gx / 10), 456) * 1.4 + (vnoise(gx * 0.2, elev * 0.14, 457) - 0.5) * 1.8;
    if ((elev + Math.floor(vnoise(gx * 0.1, 0, 458) * 5)) % 7 === 0) t -= 1; if (ry > drop - 4) t -= (4 - (drop - ry)) * 0.4;
    if (base === MOS) t = t * 0.6 + 0.2; if (base !== ROC && base !== MOS) t = t * 0.85 + 0.2;
    let c = tone(base === MOS ? ROC : base, t);
    // the mountain wall: pine-green moss drips from the lip, pale quartz veins
    const dl = drop * (0.2 + 0.55 * vnoise(gx * 0.18, 0.7, 459)); if (ry < dl && vnoise(gx * 0.4, ry * 0.2, 460) > 0.42) c = mix(c, tone(MSS, 0.4 + vnoise(gx * 0.3, ry * 0.3, 461) * 2.4), 0.8);
    if (vnoise(gx * 0.7 + elev * 0.2, elev * 0.4, 462) > 0.86) c = mix(c, [150, 176, 196], 0.4);
    if (m === M.HFLAG) { const course = Math.floor((elev + 1) / 5), mort = (elev % 5) === 0 || ((gx + (course & 1) * 6) % 12) === 0; if (mort) c = shade(c, 0.7); }
    return c;
  }
  const edge = (c, k) => { const m = TWM.MAT[k]; if (isW(m)) return [214, 244, 246]; return INKF; };
  const seamTone = (I, J, n0, n1) => tone(MOS, 1.2 + n0 * 2 + n1 * 0.7);
  const KINDS = { hpstemple: ['hps_temple_a'], hpspagoda: ['hps_pagoda_a'], hpsgate: ['hps_gate_a'], hpslair: ['hps_lair_a'], hpsbell: ['hps_bell_a', 'hps_bell_b'], hpsdorm: ['hps_dorm_a', 'hps_dorm_b', 'hps_dorm_c'],
    hpskitchen: ['hps_kitchen_a', 'hps_kitchen_b'], hpsburner: ['hps_burner_a', 'hps_burner_b'], hpspine: ['hps_pine_a', 'hps_pine_b', 'hps_pine_c'], hpspavilion: ['hps_pavilion_a', 'hps_pavilion_b'], hpsstupa: ['hps_stupa_a', 'hps_stupa_b'],
    hpsrock: ['hps_rock_a', 'hps_rock_b', 'hps_rock_c'], hpswayshrine: ['hps_wayshrine_a', 'hps_wayshrine_b'], hpswell: ['hps_well_a', 'hps_well_b'], hpssutra: ['hps_sutra_a', 'hps_sutra_b'], hpslantern: ['hps_lantern_a', 'hps_lantern_b'],
    hpsbamboo: ['hps_bamboo_a', 'hps_bamboo_b'], hpsmaple: ['hps_maple_a', 'hps_maple_b', 'hps_maple_c'] };
  Object.assign(A.IMGKINDS, KINDS);
  A.GLOWS.push('hps_temple_', 'hps_pagoda_', 'hps_gate_', 'hps_lair_', 'hps_bell_', 'hps_dorm_', 'hps_kitchen_', 'hps_burner_', 'hps_pavilion_', 'hps_wayshrine_', 'hps_lantern_', 'hps_sutra_');
  Object.assign(A.SWAY, { hpspine: 0.9, hpsmaple: 1.2, hpsbamboo: 1.8, hpsrock: 0, hpslantern: 0.15, hpsstupa: 0.05 });
  A.hps = { top, face, edge, stairPal: STAIR, seamTone, ramps: { ROC, MOS, GRV, FLG } };
})();
