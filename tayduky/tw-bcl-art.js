'use strict';
// ===== Tây Du Ký v2 — Bạch Cốt Lĩnh: art (loaded after tw-art.js; plugs into TWA.bcl) =====
// Palette: bone white, grey-violet, ghost green, dark moss, cold brown. Cold earth with pale speckle, dark moss, jagged violet-grey rock with bone-white bands and dark cracks, pale dead grass, grave paving with bone fragments, bleached bone rubble,
// black ghost water (teal-black with green glints). Cliff faces: strata of violet-grey rock with bone bands, hanging roots and pale lichen. Code-painted props: ribcage arches, bone chimes, graves, coffins, skulls on stakes, bone piles, dead grass, ghost-fire braziers.
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const ERT = ramp(['#26242c', '#3a3640', '#524c54', '#6e6a68', '#8c8884', '#aaa6a0']);          // cold earth
  const MSS = ramp(['#14201c', '#1f3430', '#2e4a42', '#486a58', '#6c8c74']);                      // dark moss
  const RCK = ramp(['#1c1a26', '#2e2a3c', '#46425a', '#625e78', '#848098', '#aaa8b8']);
  const BON = ramp(['#6a6a62', '#9a9a90', '#c4c4b8', '#e4e4d6', '#f4f2e6', '#fffdf4']);           // bone
  const GRS = ramp(['#4a4a38', '#6e6e50', '#98986c', '#bcbc8c', '#d8d8ac']);                      // pale dead grass
  const TMB = ramp(['#2a2a34', '#3e3e4c', '#56566a', '#707088', '#8c8ca4', '#a8a8bc']);           // grave paving
  const WTR = ramp(['#04100f', '#08201e', '#0e3834', '#16544c', '#228070', '#4ac0a0', '#a4f4d0']);
  const STAIR = ramp(['#3a384a', '#54526a', '#726f88', '#9694ac', '#b8b6c8']);
  const INKF = [10, 8, 16], GHOST = [120, 255, 190];
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const fbm = (I, J, s) => vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let shore = null; const isW = m => m === M.STREAM || m === M.POOL;
  function buildShore() { shore = new Uint8Array(TWM.N * TWM.N); const N = TWM.N, MAT = TWM.MAT; for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const k = j * N + i; if (!isW(MAT[k])) continue; let b = 0; const Lf = q => MAT[q] !== M.VOID && !isW(MAT[q]); if (Lf(k - 1)) b |= 1; if (Lf(k + 1)) b |= 2; if (Lf(k - N)) b |= 4; if (Lf(k + N)) b |= 8; shore[k] = b; } }
  function water(m, I, J, X, Y, k, SH, d) {
    if (!shore) buildShore(); SH.water = 2; const f = fbm(I * 1.4, J * 0.5, 1330), st = vnoise(I * 2.4, J * 0.6, 1331), br = Math.max(0, st - 0.68) * 2.2;
    let c = tone(WTR, 0.8 + f * 2.6 + (d ? 0.2 : 0)); if (br > 0.1) c = mix(c, [170, 240, 220], clamp(br * 0.6, 0, 0.6)); const gl = vnoise(I * 1.1 + 3, J * 1.1, 1332); if (gl > 0.74 && hash2(X, Y, 1333) < 0.25) { SH.em = [90, 255, 170]; c = mix(c, GHOST, 0.5); }
    const fi = I - Math.floor(I), fj = J - Math.floor(J), b = shore[k]; if (b) { let e = 9; if (b & 1) e = Math.min(e, fi); if (b & 2) e = Math.min(e, 1 - fi); if (b & 4) e = Math.min(e, fj); if (b & 8) e = Math.min(e, 1 - fj); const reach = 0.16 + vnoise(I * 2.2, J * 2.2, 1334) * 0.12; if (e < reach) c = mix(c, [190, 230, 220], clamp((1 - e / reach) * 0.9 - 0.1, 0, 0.7)); } return c;
  }
  function top(m, I, J, X, Y, k, d, SH) {
    if (isW(m)) return water(m, I, J, X, Y, k, SH, d);
    const n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), lit = fbm(I - 0.13, J - 0.13, 1340) - fbm(I + 0.13, J + 0.13, 1340);
    if (m === M.BTOMB) { const u = I * 1.3, v = J * 1.3, row = Math.floor(v), seam = ((u + (row & 1) * 0.5) % 1) < 0.08 || (v % 1) < 0.09; let c = seam ? tone(TMB, 0.6 + n1) : tone(TMB, 2.1 + n0 * 1.4 + lit * 3 + hash2(Math.floor(u + (row & 1) * 0.5), row, 1341) * 1.1); if (n1 > 0.8 && !seam) c = mix(c, MSS[2], 0.5); if (hp < 0.012) return BON[4]; return c; }
    if (m === M.BBONE) { let c = tone(BON, 1.6 + n0 * 1.6 + lit * 4 + (d ? 0.2 : 0)); const cr = Math.abs(vnoise(I * 2.2, J * 2.2, 1342) - 0.5); if (cr < 0.03) c = shade(c, 0.6); if (hp < 0.02) c = BON[5]; return c; }
    if (m === M.BROCK) { let c = tone(RCK, 1.2 + fbm(I, J, 1343) * 3.2 + lit * 5 + (d ? 0.2 : 0)); const st = Math.abs(((I * 0.8 + J * 0.6 + vnoise(I * 0.3, J * 0.3, 1344) * 2.4) % 1) - 0.5); if (st < 0.05) c = mix(c, BON[3], 0.4); if (n1 > 0.7 && hp < 0.5) c = mix(c, MSS[2], 0.5); return c; }
    if (m === M.BMOSS) { let c = tone(MSS, 0.8 + fbm(I, J, 1345) * 2.8 + lit * 4 + (d ? 0.2 : 0)); if (n1 > 0.78 && hp < 0.4) c = mix(c, BON[2], 0.4); if (hp < 0.004) { SH.em = [90, 255, 170]; return GHOST; } return c; }
    if (m === M.BGRASS) { let c = tone(GRS, 0.6 + fbm(I, J, 1346) * 2.6 + lit * 4 + (d ? 0.2 : 0)); if (n1 > 0.7) c = mix(c, ERT[3], 0.4); if (hp > 0.985) c = BON[4]; return c; }
    let c = tone(ERT, 1.2 + fbm(I, J, 1347) * 3 + lit * 4.4 + (d ? 0.2 : 0)); if (n0 > 0.66) c = mix(c, GRS[1], 0.3); if (hp < 0.01) c = BON[3]; if (hp > 0.995) { SH.em = [90, 255, 170]; return GHOST; } return c;
  }
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const m = TWM.MAT[k]; if (ry === drop - 1) return INKF;
    if (isW(m)) { const col = vnoise(gx * 0.45, 0.5, 1350), streak = vnoise(gx * 1.7, elev * 0.04 - (window.TWR ? TWR.t * 0.8 : 0), 1351); if (ry < 2) return WTR[6]; let c = tone(WTR, 1.4 + col * 2 + (streak > 0.66 ? 1.6 : 0) + (side ? -0.4 : 0)); if (streak > 0.8) c = mix(c, [190, 245, 225], 0.5); return c; }
    const band = Math.floor((elev + vnoise(gx * 0.09, 0.5, 1352) * 6) / 6); let t = (side ? 0.8 : 2.0) + hash2(band, Math.floor(gx / 9), 1353) * 1.5 + (vnoise(gx * 0.2, elev * 0.14, 1354) - 0.5) * 2;
    if ((elev + Math.floor(vnoise(gx * 0.1, 0, 1355) * 5)) % 7 === 0) t -= 1; if (ry > drop - 4) t -= (4 - (drop - ry)) * 0.4; let c = tone(m === M.BTOMB ? TMB : RCK, t);
    if (vnoise(gx * 0.06, elev * 0.05, 1356) > 0.72 && ((elev + 2) % 9) < 2) c = mix(c, BON[3], 0.6);                                            // bone-white seams
    const dl = 2 + Math.floor(hash2(gx, 0, 1357) * hash2(gx >> 2, 1, 1358) * 7); if (ry < dl && m !== M.BTOMB) return tone(MSS, 2.2 - ry * 0.4 + (side ? -0.8 : 0));
    if (hash2(gx >> 1, 7, 1359) < 0.04 && ry < drop * 0.7) return tone(ERT, ((ry + gx) % 5 === 0) ? 2.2 : 0.8);                                      // hanging roots
    if (hash2(gx, ry >> 1, 1360) < 0.004) { SH.em = [90, 255, 170]; return GHOST; }
    return c;
  }
  const edge = (c, k) => isW(TWM.MAT[k]) ? [170, 240, 220] : INKF;
  const seamTone = (I, J, n0, n1) => tone(ERT, 1.2 + n0 * 2 + n1 * 0.6);
  // ---------------------------------------------------------------- code-painted props
  const cache = new Map(), mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  const bone = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  function paintRibs(v) {   // a colossal ribcage arching over the road: nested ribs, a spine along the base, a half-buried skull
    const w = 76, h = 60, cv = mk(w, h), g = cv.getContext('2d'); const arc = (cx, cy, rx, ry, th, col) => { for (let a = 3.14; a <= 6.28; a += 0.04) { const x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry); bone(g, x, y, th, th + 1, col); } };
    g.fillStyle = 'rgba(8,8,16,0.3)'; g.fillRect(8, 52, 60, 5); for (let r = 0; r < 4; r++) { const cx = 38, rx = 30 - r * 4, ry = 44 - r * 6; arc(cx, 54, rx, ry, 3, '#d8d8c8'); arc(cx + 1, 54, rx - 2, ry - 2, 1, '#fffdf0'); arc(cx, 55, rx, ry, 1, '#8a8a7c'); }
    for (let s = 0; s < 18; s++) bone(g, 6 + s * 3, 52 + (s & 1), 3, 4, s & 1 ? '#c8c8b8' : '#e8e8da'); bone(g, 56, 46, 14, 10, '#e4e4d4'); bone(g, 58, 48, 4, 4, '#14141c'); bone(g, 64, 48, 4, 4, '#14141c'); bone(g, 60, 53, 6, 2, '#a8a898'); return cv; }
  function paintChime(v) { const w = 24, h = 40, cv = mk(w, h), g = cv.getContext('2d'); bone(g, 10, 8, 3, 32, '#5a4a3a'); bone(g, 4, 6, 16, 3, '#6a5a48'); bone(g, 11, 4, 2, 3, '#8a7a5a'); for (let q = 0; q < 5; q++) { const len = 8 + ((q * 7 + v * 3) % 9); bone(g, 5 + q * 3, 9, 1, 3, '#caa'); bone(g, 5 + q * 3, 12, 2, len, q & 1 ? '#e4e4d6' : '#c8c8ba'); bone(g, 5 + q * 3 - 1, 12 + len - 1, 4, 2, '#f4f2e6'); } bone(g, 9, 18, 5, 5, '#ece8da'); bone(g, 10, 20, 1, 1, '#14141c'); bone(g, 12, 20, 1, 1, '#14141c'); return cv; }
  function paintGrave(v) { const w = 24, h = 24, cv = mk(w, h), g = cv.getContext('2d'); g.fillStyle = 'rgba(8,8,16,0.3)'; g.fillRect(3, 19, 18, 3); for (let y = 0; y < 5; y++) for (let x = 0; x < 16 - y * 2; x++) bone(g, 4 + x + y, 14 + y, 1, 1, y < 2 ? '#4a4450' : '#2e2a34'); const tw = 8 + (v & 1) * 2; bone(g, 8, 4 + (v & 1), tw, 12, '#8c8a96'); bone(g, 9, 5 + (v & 1), tw - 2, 10, '#a6a4b0'); bone(g, 8, 4 + (v & 1), tw, 1, '#c8c6d2'); bone(g, 11, 7 + (v & 1), 2, 6, '#3a3844'); bone(g, 9, 9 + (v & 1), 6, 2, '#3a3844'); if (v & 2) bone(g, 17, 17, 3, 3, '#e8e4d0'); else bone(g, 3, 17, 4, 2, '#ece8da'); return cv; }
  function paintCoffin(v) { const w = 30, h = 24, cv = mk(w, h), g = cv.getContext('2d'); g.fillStyle = 'rgba(8,8,16,0.3)'; g.fillRect(3, 19, 24, 3); for (let x = 0; x < 22; x++) { bone(g, 4 + x, 12 - (x >> 2), 1, 8, '#3a2c22'); bone(g, 4 + x, 12 - (x >> 2), 1, 1, '#5a4636'); } bone(g, 8, 14, 14, 2, '#6a5444'); bone(g, 20, 10, 6, 6, '#e8e4d2'); bone(g, 21, 12, 2, 2, '#14141c'); return cv; }
  function paintSkull(v) { const w = 14, h = 26, cv = mk(w, h), g = cv.getContext('2d'); bone(g, 6, 8, 2, 18, '#4a3a2a'); bone(g, 3, 1, 8, 7, '#ece8da'); bone(g, 4, 0, 6, 1, '#fffdf2'); bone(g, 4, 3, 2, 2, '#14141c'); bone(g, 8, 3, 2, 2, '#14141c'); bone(g, 5, 7, 4, 2, '#c8c4b4'); bone(g, 6, 5, 1, 1, '#14141c'); return cv; }
  function paintBones(v) { const w = 22, h = 12, cv = mk(w, h), g = cv.getContext('2d'); g.fillStyle = 'rgba(8,8,16,0.25)'; g.fillRect(1, 9, 20, 2); for (let q = 0; q < 5; q++) { const x = 1 + ((q * 5 + v * 3) % 14), y = 2 + ((q * 3 + v) % 6), L = 5 + (q % 3) * 2; bone(g, x, y, L, 2, q & 1 ? '#e8e4d4' : '#cfcbbb'); bone(g, x - 1, y - 1, 2, 4, '#f4f2e6'); bone(g, x + L - 1, y - 1, 2, 4, '#f4f2e6'); } if (v & 1) { bone(g, 14, 2, 6, 5, '#ece8da'); bone(g, 15, 4, 1, 1, '#14141c'); bone(g, 18, 4, 1, 1, '#14141c'); } return cv; }
  function paintGrass(v) { const w = 20, h = 14, cv = mk(w, h), g = cv.getContext('2d'); for (let q = 0; q < 14; q++) { const x = 1 + Math.floor(hash2(q, v, 1370) * 17), L = 4 + Math.floor(hash2(q, v, 1371) * 8), lean = (hash2(q, v, 1372) - 0.5) * 3; for (let s = 0; s < L; s++) bone(g, Math.round(x + lean * s / L), 13 - s, 1, 1, s > L - 3 ? '#e4e0c0' : q & 1 ? '#a8a478' : '#8c8860'); } return cv; }
  function paintPyre(v) { const w = 20, h = 28, cv = mk(w, h), g = cv.getContext('2d'); g.fillStyle = 'rgba(8,8,16,0.3)'; g.fillRect(2, 24, 16, 3); bone(g, 4, 16, 12, 8, '#4a4858'); bone(g, 3, 15, 14, 3, '#68667c'); bone(g, 5, 18, 10, 5, '#2a2834'); bone(g, 9, 6, 2, 10, '#caffe2'); bone(g, 7, 9, 6, 7, '#6cffb0'); bone(g, 8, 8, 4, 3, '#b0ffd8'); bone(g, 10, 3, 1, 4, '#8cffc4'); return cv; }
  const KINDS = { btusk: ['sdl_tusk_a'], blair: ['hps_lair_a'], btotem: ['sdl_totem_a'], bruin: ['hps_ruin_a'], bshrine: ['hps_wayshrine_a', 'hps_wayshrine_b'], bdead: ['hds_tree_a', 'hds_tree_b'], bpine: ['hps_pine_a', 'hps_pine_b', 'hps_pine_c'], brock: ['hps_rock_a', 'hps_rock_b', 'hps_rock_c'], bspire: ['sdl_rock_a', 'sdl_rock_b'], bcrys: ['crystals_a', 'crystals_b', 'crystals_c'], bbridgeb: ['bridge_a'], bskelp: ['hps_sutra_a'] };
  Object.assign(A.IMGKINDS, KINDS); A.GLOWS.push('sdl_totem_', 'hps_lair_', 'crystals_', 'hps_wayshrine_'); Object.assign(A.SWAY, { bdead: 0.7, bpine: 0.7, bchime: 2.2, bgrass: 0.9, bflag: 0 });
  const PAINT = { bribs: [paintRibs, 55, 0], bchime: [paintChime, 38, 1.6], bgrave: [paintGrave, 21, 0], bcoffin: [paintCoffin, 21, 0], bskull: [paintSkull, 24, 0.3], bbones: [paintBones, 9, 0], bgrass: [paintGrass, 12, 1], bpyre: [paintPyre, 24, 0] };
  function sprite(p) { const e = PAINT[p.kind]; if (!e) return null; const key = p.kind + (p.v & 3); let o = cache.get(key); if (!o) { const cv = e[0](p.v & 3); o = { w: cv.width, h: cv.height, py: e[1], frames: [cv], flat: false, sway: e[2], em: p.kind === 'bpyre' ? cv : null }; cache.set(key, o); } return o; }
  A.bcl = { top, face, edge, stairPal: STAIR, seamTone, sprite };
})();
