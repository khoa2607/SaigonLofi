'use strict';
// ===== Tây Du Ký v2 — Thông Thiên Hà: art (loaded after tw-art.js; plugs into TWA.river) =====
// Code-painted terrain in the v2 pixel style, world-space shaded: the great river (deep blue-black water with long wave crests, a swirling whirlpool, white rapids, calm teal eddies,
// white foam along every shore), wet blue-grey bluff stone with moss, river cobble, pale sand, marsh reeds, weathered pier planks, flagstones, grass banks; cliff faces
// (waterfall streaks on river tiles, wet strata, pier piles). Landmark sprites come from PixelLab (tools/sprite_picks.json).
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const WD = ramp(['#050f1a', '#08192b', '#0c2640', '#12385a', '#1b4f78', '#2a6f97', '#4a95b4']);        // deep river
  const WS = ramp(['#0a2438', '#10405c', '#195e7d', '#2a86a0', '#53b0c0', '#9adbe0', '#e4f8f8']);        // rapids / shallow
  const WP = ramp(['#0b2c36', '#12484f', '#1a6663', '#2a8a7c', '#4fb59a', '#9ad9c0']);                   // calm eddy pools
  const GRN = ramp(['#162a22', '#1f3a2c', '#2b4d37', '#3b6644', '#528455', '#75a56a']);
  const SND = ramp(['#4c4636', '#6a604a', '#8a7d5f', '#aa9b78', '#c6b890', '#e0d4ac']);
  const COB = ramp(['#1e2832', '#2c3944', '#3b4b58', '#4f6270', '#667c8a', '#86a0ac']);
  const BLF = ramp(['#10161f', '#182230', '#223142', '#304257', '#43586f', '#5c758a']);
  const MOSS = ramp(['#1d3a30', '#2a5240', '#3b6f50', '#5a9462']);
  const PAV = ramp(['#2c3541', '#3f4a57', '#566472', '#728291', '#93a4b0', '#b6c6cf']);
  const PLK = ramp(['#1e150f', '#2f2116', '#44301f', '#5c4129', '#765536', '#93704a']);
  const MUD = ramp(['#1c1a14', '#2d281c', '#443b28']);
  const STAIR = ramp(['#2f3b48', '#40505e', '#566879', '#72879a', '#92a8b8']);
  const INKF = [10, 18, 32];
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const fbm = (I, J, s) => vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let shore = null;   // bit mask per water tile: 1 land at i-1, 2 land at i+1, 4 land at j-1, 8 land at j+1 (drives the shore foam)
  const isW = m => m === M.STREAM || m === M.SEA || m === M.POOL;
  function buildShore() {
    shore = new Uint8Array(TWM.N * TWM.N); const N = TWM.N, MAT = TWM.MAT;
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const k = j * N + i; if (!isW(MAT[k])) continue; let b = 0; const L = q => MAT[q] !== M.VOID && !isW(MAT[q]);
      if (L(k - 1)) b |= 1; if (L(k + 1)) b |= 2; if (L(k - N)) b |= 4; if (L(k + N)) b |= 8; shore[k] = b; }
  }
  function water(m, I, J, X, Y, k, SH, d) {
    if (!shore) buildShore();
    const W = TWM.river, fi = I - Math.floor(I), fj = J - Math.floor(J), wi = W ? W.whirl[0] + 0.5 : 0, wj = W ? W.whirl[1] + 0.5 : 0;
    const hp = hash2(X, Y, 9); let c;
    if (m === M.STREAM) {   // fast water: long streaks along the flow (+j), white where it breaks over rocks
      SH.water = 2; const f = fbm(I * 1.5, J * 0.45, 330), st = vnoise(I * 2.6, J * 0.55, 331), br = Math.max(0, st - 0.6) * 3.2 + Math.max(0, vnoise(I * 1.1, J * 0.3, 332) - 0.66) * 1.6;
      c = tone(WS, 1.1 + f * 3 + (d ? 0.2 : 0)); if (br > 0.2) c = mix(c, [236, 250, 250], clamp(br * 0.8, 0, 0.9)); }
    else if (m === M.SEA) {   // deep water: dark, with long wave crests across the flow and a whirlpool
      SH.water = 0; const f = fbm(I * 0.9, J * 0.9, 333), wv = Math.sin(J * 2.4 + vnoise(I * 0.55, J * 0.5, 334) * 6.5 + I * 0.35);
      c = tone(WD, 0.9 + f * 3.2 + wv * 0.55 + (d ? 0.15 : 0));
      if (wv > 0.86 && vnoise(I * 1.1, J * 0.35, 335) > 0.33) c = mix(c, [120, 190, 215], 0.45 + (wv - 0.86) * 2);
      const dx = I - wi, dy = (J - wj) * 1.15, r = Math.hypot(dx, dy);
      if (r < 4.6) { const ang = Math.atan2(dy, dx), band = Math.sin(ang * 3 + r * 2.6 + vnoise(I, J, 336) * 1.4); c = shade(c, 0.62 + 0.38 * Math.min(1, r / 1.6)); if (band > 0.72 && r > 0.9) c = mix(c, [150, 215, 232], (band - 0.72) * 1.7 * (1 - r / 4.8)); } }
    else {   // calm eddy: teal, mirror-like, with slow ring ripples
      SH.water = 4; const f = fbm(I * 1.1, J * 1.1, 337), rp = Math.sin(Math.hypot(I - Math.floor(I / 3) * 3, J - Math.floor(J / 3) * 3) * 5 + vnoise(I, J, 338) * 3);
      c = tone(WP, 1 + f * 2.8 + rp * 0.3 + (hp < 0.04 ? 1.4 : 0)); }
    // foam along every shore: white lapping lines that thin out into the water
    const b = shore[k]; if (b) { let e = 9; if (b & 1) e = Math.min(e, fi); if (b & 2) e = Math.min(e, 1 - fi); if (b & 4) e = Math.min(e, fj); if (b & 8) e = Math.min(e, 1 - fj);
      const n = vnoise(I * 2.2, J * 2.2, 339), reach = 0.2 + n * 0.14; if (e < reach) { const t = 1 - e / reach; c = mix(c, [238, 252, 252], clamp(t * 1.15 - 0.1, 0, 0.92)); } else if (e < reach + 0.1 && n > 0.5) c = mix(c, [190, 232, 238], 0.28); }
    return c;
  }
  function top(m, I, J, X, Y, k, d, SH) {
    if (isW(m)) return water(m, I, J, X, Y, k, SH, d);
    const n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), lit = fbm(I - 0.13, J - 0.13, 340) - fbm(I + 0.13, J + 0.13, 340);
    if (m === M.PAVER) { const u = I * 1.7, v = J * 1.7, row = Math.floor(v), seam = ((u + (row & 1) * 0.5) % 1) < 0.07 || (v % 1) < 0.08; let c = seam ? tone(PAV, 0.5 + n1) : tone(PAV, 2.1 + n0 * 1.4 + n1 * 0.6 + lit * 3 + hash2(Math.floor(u + (row & 1) * 0.5), row, 341) * 0.8); if (n1 > 0.75 && !seam) c = mix(c, MOSS[2], 0.42); return c; }
    if (m === M.DOCK) { const row = Math.floor(J * 2.3), c = tone(PLK, 2.1 + hash2(Math.floor(I * 0.6 + row * 0.37), row, 342) * 1.9 + n1 * 0.5 + (d ? 0.1 : 0)); if (((J * 2.3) % 1) < 0.1) return tone(PLK, 0.25); if (hp < 0.012) return [150, 150, 140]; return c; }
    if (m === M.COBBLE) { const u = I * 2.3, v = J * 2.3, cx = Math.floor(u), cy = Math.floor(v), h0 = hash2(cx, cy, 343), du = (u % 1) - 0.5 - (h0 - 0.5) * 0.2, dv = (v % 1) - 0.5, r = Math.hypot(du, dv); let c = tone(COB, 1.2 + h0 * 2.6 + lit * 3 + n0 * 0.8); if (r > 0.44) c = tone(COB, 0.3 + n1 * 0.5); else if (dv < -0.1 && r < 0.38) c = shade(c, 1.12); if (n1 > 0.8 && hp < 0.6) c = mix(c, MOSS[1], 0.5); return c; }
    if (m === M.WSAND) { const rp = Math.sin(I * 5 + J * 3.2 + vnoise(I * 0.8, J * 0.8, 344) * 4); let c = tone(SND, 2 + n0 * 1.6 + n1 * 0.8 + lit * 3 + (rp > 0.8 ? 0.6 : 0) + (d ? 0.15 : 0)); if (hp < 0.03) c = shade(c, 0.8); return c; }
    if (m === M.WREED) { let c = tone(GRN, 0.6 + fbm(I, J, 345) * 3 + lit * 3); if (n0 > 0.58 && n1 > 0.42) { SH.water = 3; c = mix(c, WP[2], 0.5); } if (hp < 0.05) c = mix(c, [150, 200, 120], 0.5); return c; }
    if (m === M.BLUFF) { let c = tone(BLF, 1 + fbm(I, J, 346) * 3.2 + lit * 5 + (d ? 0.2 : 0)); const st = Math.abs(((I * 0.8 + J * 0.6 + vnoise(I * 0.3, J * 0.3, 347) * 2) % 1) - 0.5); if (st < 0.05) c = shade(c, 0.76); if (n1 > 0.66 && hp < 0.55) c = mix(c, MOSS[1 + (hp < 0.2 ? 1 : 0)], 0.6); if (hp < 0.0016) { SH.em = [120, 220, 255]; return [150, 235, 255]; } return c; }
    // BANK (and anything unknown): river-bank grass, dark and wet, with a few pale flowers
    let c = tone(GRN, 1.1 + fbm(I, J, 348) * 3 + lit * 4 + (d ? 0.2 : 0)); if (hp < 0.05) c = mix(c, GRN[5], 0.5); if (n0 > 0.72) c = mix(c, MUD[1], 0.3); if (hp < 0.004) return [196, 190, 230]; return c;
  }
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const m = TWM.MAT[k];
    if (ry === drop - 1) return INKF;
    if (isW(m)) {   // WATERFALL: pale streaks falling in long columns, bright at the lip, foam and spray at the foot (drops to the abyss at the world rim)
      const col = vnoise(gx * 0.45, 0.5, 350), flow = vnoise(gx * 0.8, elev * 0.05, 351), s = (side ? 0.5 : 0) + col * 1.8 + flow * 1.5;
      if (ry < 2) return WS[6]; if (ry > drop - 5) return mix(tone(WS, 3 + col * 2), [240, 252, 252], 0.55 + 0.1 * (hash2(gx, ry, 352) > 0.5));
      return tone(WS, Math.min(6, 1.5 + s + (vnoise(gx * 1.6, ry * 0.12, 353) > 0.7 ? 1.8 : 0) - (ry / drop) * 0.4)); }
    if (m === M.DOCK) {   // the pier stands on piles: dark gaps and rope-lashed posts
      if (ry < 3) return tone(PLK, 3 - (side ? 0.8 : 0)); const post = (gx % 13) < 3; if (post) return tone(PLK, (side ? 0.8 : 1.6) + vnoise(gx * 0.3, ry * 0.3, 354) * 1.2); return ry < drop - 2 ? tone(WD, 0.4 + ry / drop) : tone(WD, 2); }
    const band = Math.floor((elev + vnoise(gx * 0.09, 0.5, 355) * 6) / 7);
    const base = m === M.WSAND ? SND : m === M.COBBLE ? COB : m === M.PAVER ? PAV : m === M.WREED || m === M.BANK ? MUD : BLF;
    let t = (side ? 0.8 : 2) + hash2(band, Math.floor(gx / 10), 356) * 1.4 + (vnoise(gx * 0.2, elev * 0.14, 357) - 0.5) * 1.6;
    if ((elev + Math.floor(vnoise(gx * 0.1, 0, 358) * 5)) % 7 === 0) t -= 1; if (ry > drop - 4) t -= (4 - (drop - ry)) * 0.4;
    if (base === MUD) t = t * 0.7 + 0.5;
    let c = tone(base, t);
    // wet stains and moss drips down the face; a bright seep line of river water
    const dl = drop * (0.25 + 0.55 * vnoise(gx * 0.18, 0.7, 359)); if (ry < dl && vnoise(gx * 0.4, ry * 0.2, 360) > 0.38) c = mix(c, tone(MOSS, 0.4 + vnoise(gx * 0.3, ry * 0.3, 361) * 2.4), 0.82);
    if (hash2(gx >> 1, (elev + 2) >> 2, 362) < 0.008 && ry > 2 && ry < drop - 2 && (elev & 3) < 2) { SH.em = [110, 215, 255]; return mix(c, [120, 220, 250], 0.5); }
    if (m === M.PAVER) { const course = Math.floor((elev + 1) / 5), mort = (elev % 5) === 0 || ((gx + (course & 1) * 6) % 12) === 0; if (mort) c = shade(c, 0.7); }
    return c;
  }
  const edge = (c, k) => { const m = TWM.MAT[k]; if (isW(m)) return [214, 244, 246]; return INKF; };
  const seamTone = (I, J, n0, n1) => tone(GRN, 1.2 + n0 * 2 + n1 * 0.7);

  // sprite kinds (PixelLab objects packed by tools/pack_sprites.py)
  const KINDS = { tthdock: ['tth_dock_a'], tthshrine: ['tth_shrine_a'], tthtower: ['tth_tower_a'], tthgate: ['tth_gate_a', 'tth_gate_b'], tthstatue: ['tth_statue_a', 'tth_statue_b'], tthwreck: ['tth_wreck_a', 'tth_wreck_b'],
    tthhut: ['tth_hut_a', 'tth_hut_b'], tthnetrack: ['tth_netrack_a', 'tth_netrack_b'], tthreeds: ['tth_reeds_a', 'tth_reeds_b'], tthwillow: ['tth_willow_a', 'tth_willow_b'], tthrock: ['tth_rock_a', 'tth_rock_b', 'tth_rock_c'], tthpine: ['sdl_pine_a', 'sdl_pine_b'] };
  Object.assign(A.IMGKINDS, KINDS);
  A.GLOWS.push('tth_tower_', 'tth_shrine_', 'tth_dock_', 'tth_gate_', 'tth_statue_', 'tth_hut_');
  Object.assign(A.SWAY, { tthwillow: 1.2, tthreeds: 1.7, tthhut: 0.12, tthnetrack: 0.5, tthpine: 0.8 });
  A.river = { top, face, edge, stairPal: STAIR, seamTone, ramps: { WD, WS, WP } };
})();
