'use strict';
// ===== Tây Du Ký v2 — Sư Đà Lĩnh (Lion Camel Ridge): map build (world space; loaded before tw-map.js) =====
// tw-layout.js reserves the footprint (TWM.layout.sdl: a squircle + the south rim strip, local 47 x 39 at world (30, 84)), east of Hỏa Diệm Sơn. This hook authors it:
//   * a walled demon CITADEL on a high plateau (level 8) with the lion-head keep built into its back wall, a skull gate on its front wall, a throne square;
//   * the three kings' seats: Thanh Sư's den (west crags), Bạch Tượng's tusk hall (east plateau), Kim Sí Đại Bàng's golden nest on the tallest crag (north-east);
//   * a deep misty GORGE with a high waterfall, a plunge pool and a river that leaves through the camp valley; plank bridges and stairs cross it;
//   * a low war-camp valley (tents, weapon racks, drill yard, supplies, braziers) that opens to the world at the east edge and to Hỏa Diệm Sơn at the west;
//   * stepped ridges, lookouts and watch posts; scorch-to-slate seam with Hỏa Diệm Sơn; a scorched outward band and slate rim.
// Everything is deterministic. Local (a, b) -> world (x0 + a, y0 + b); screen u = a - b, v = a + b (the back of the picture is small a + b).
window.TW_LION_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, set, prop, poi, isB, id, inMap, vnoise, hash2, carvePath, mulberry32, addStair } = X;
  const L = TWM.layout.sdl, x0 = L.x0, y0 = L.y0, B = TWM.bi.sdl, R = mulberry32(20261122);
  const W = (a, b) => [x0 + a, y0 + b], inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B;
  const sm = t => t * t * (3 - 2 * t), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const F = TWM.lion = { x0, y0, B, tiles: [], falls: [], flags: [], braziers: [], torches: [], gorge: [], nests: [], posts: {}, foc: null, stage: null };

  // ---------------------------------------------------------------- 1. height field
  const mound = (a, b, ca, cb, ra, rb, hgt, rot) => { const dx = a - ca, dy = b - cb, c = Math.cos(rot || 0), s = Math.sin(rot || 0), u = (dx * c + dy * s) / ra, v = (-dx * s + dy * c) / rb, t = 1 - (u * u + v * v); return t > 0 ? hgt * Math.pow(t, 0.7) : 0; };
  const MOUNDS = [
    [8, 3, 10, 6, 9], [20, 1, 9, 5, 11], [33, 1, 8, 5, 10], [44, 4, 6, 9, 10], [41, 5, 5, 5, 4], [45, 17, 4, 8, 7], [4, 14, 5, 7, 6], [6, 24, 4, 5, 4], [38, 24, 6, 6, 4], [24, 20, 7, 3, 3], [14, 18, 4, 3, 3],
  ];
  const HF = new Float32Array(L.w * L.h);
  for (let b = 0; b < L.h; b++) for (let a = 0; a < L.w; a++) { let h = 2.2; for (const m of MOUNDS) h += mound(a, b, m[0], m[1], m[2], m[3], m[4], m[5]); h += (vnoise(a * 0.3, b * 0.3, 161) - 0.5) * 1.6; const cap = b >= 25 ? 2.2 : 2.2 + (25 - b) * 1.25; HF[b * L.w + a] = Math.min(h, cap + 0.2); }
  for (let pass = 0; pass < 2; pass++) { const c = HF.slice(); for (let b = 1; b < L.h - 1; b++) for (let a = 1; a < L.w - 1; a++) { let sum = 0; for (let db = -1; db <= 1; db++) for (let da = -1; da <= 1; da++) sum += c[(b + db) * L.w + a + da] * (da || db ? 1 : 2); HF[b * L.w + a] = sum / 10; } }
  for (let b = 0; b < L.h; b++) for (let a = 0; a < L.w; a++) { const [i, j] = W(a, b); if (!inB(i, j)) continue; H[id(i, j)] = clamp(Math.round(HF[b * L.w + a]), 1, 14); MAT[id(i, j)] = M.SLATE; F.tiles.push(id(i, j)); }
  const tile = (a, b) => { const [i, j] = W(a, b); return inB(i, j) ? id(i, j) : -1; };
  const ell = (ca, cb, ra, rb, fn) => { for (let b = Math.floor(cb - rb - 2); b <= cb + rb + 2; b++) for (let a = Math.floor(ca - ra - 2); a <= ca + ra + 2; a++) { const d = ((a - ca) / ra) ** 2 + ((b - cb) / rb) ** 2, k = tile(a, b); if (k >= 0) fn(k, d, a, b); } };
  const flat = (ca, cb, ra, rb, lv) => ell(ca, cb, ra, rb, (k, d) => { if (d < 1) H[k] = lv; else if (d < 1.7) H[k] = Math.round(lv + (H[k] - lv) * sm((d - 1) / 0.7)); });

  // ---------------------------------------------------------------- 2. grounds: citadel plateau, king seats, camp valley, yards
  const CIT = [21, 12, 9, 6.5, 8], KEEP = [19.5, 7.8, 3.4, 3, 9], DEN = [9.5, 19, 4.6, 4, 6], TUSK = [37.5, 14.5, 4.6, 4.2, 7], NEST = [40.5, 3.8, 3.4, 3.4, 13], CAMP = [19, 31, 13, 6, 2], MARKET = [38, 29, 6, 5, 2];
  for (const [ca, cb, ra, rb, lv] of [CIT, KEEP, DEN, TUSK, NEST, MARKET]) flat(ca, cb, ra, rb, lv);
  ell(CAMP[0], CAMP[1], CAMP[2], CAMP[3], (k, d) => { if (d < 1) H[k] = Math.min(H[k], 2); else if (d < 1.5) H[k] = Math.min(H[k], Math.round(2 + (H[k] - 2) * sm((d - 1) / 0.5))); });
  F.foc = W(21, 13);
  // gorge: a polyline of misty chasm tiles (floor level 0) with the river on its floor; the head is a waterfall from the north-east ridge
  const GP = [[31, 10], [31, 15], [30, 19], [29, 24]], dseg = (a, b, [p, q], [r, s]) => { const dx = r - p, dy = s - q, t = clamp(((a - p) * dx + (b - q) * dy) / (dx * dx + dy * dy), 0, 1); return Math.hypot(a - (p + dx * t), b - (q + dy * t)); };
  const dGorge = (a, b) => { let d = 99; for (let n = 0; n < GP.length - 1; n++) d = Math.min(d, dseg(a, b, GP[n], GP[n + 1])); return d; };
  for (let b = 0; b < L.h; b++) for (let a = 0; a < L.w; a++) { const k = tile(a, b); if (k < 0) continue; const d = dGorge(a, b) + (vnoise(a * 0.5, b * 0.5, 162) - 0.5) * 0.9; if (d < 1.5 && b >= 10 && b <= 24) { H[k] = 0; MAT[k] = M.CHASM; F.gorge.push(k); }
    else if (d < 3.2 && b >= 10 && b <= 25 && H[k] > 9) H[k] = 9; }
  // the river: falls from the ridge (levels fall downstream), lands in a plunge pool, runs along the gorge floor and out through the valley
  const stream = (pts, w, lv0) => { const seq = []; for (let n = 0; n < pts.length - 1; n++) { const [aa, bb] = pts[n], [a2, b2] = pts[n + 1], steps = Math.max(Math.abs(a2 - aa), Math.abs(b2 - bb)); for (let s = 0; s < steps; s++) seq.push([Math.round(aa + (a2 - aa) * s / steps), Math.round(bb + (b2 - bb) * s / steps)]); }
    let prev = lv0 === undefined ? 99 : lv0; const out = []; for (const [a, b] of seq) for (let o = 0; o < w; o++) { const k = tile(a + o, b); if (k < 0 || out.includes(k)) continue; const h = Math.min(prev, Math.max(1, lv0 === undefined ? H[k] - 1 : lv0)); H[k] = h; MAT[k] = M.STREAM; if (o === 0) prev = h; out.push(k); } return out; };
  const river1 = stream([[34, 1], [34, 4], [32, 6], [31, 9]], 2);
  F.river1 = river1; for (const k of river1) F.falls.push(k);
  for (const [a, b] of [[30, 10], [31, 10], [32, 10], [30, 11], [31, 11], [32, 11], [30, 12], [31, 12], [32, 12], [31, 13]]) { const k = tile(a, b); if (k >= 0) { MAT[k] = M.POOL; H[k] = 0; } }
  for (let b = 14; b <= 24; b++) for (const k of F.gorge) { const i = k % N, j = Math.floor(k / N); if (j - y0 === b && !(b >= 15 && b <= 17) && !(b >= 20 && b <= 22) && Math.abs(i - x0 - (31 - (b - 14) * 0.2)) < 0.9 && MAT[k] === M.CHASM) MAT[k] = M.STREAM; }
  stream([[29, 25], [28, 28], [28, 32], [27, 36], [27, 38]], 2, 1);   // out through the valley to the south rim
  // tall slate ridge walls beside the gorge so it reads as a deep cut, not a ditch
  // ---------------------------------------------------------------- 3. citadel walls: a ring of raised battlement tiles around the plateau (gaps at the gate and the postern)
  const WALLK = new Set();
  ell(CIT[0], CIT[1], CIT[2], CIT[3], (k, d, a, b) => { if (d > 0.74 && d <= 1.02 && MAT[k] !== M.CHASM) { const keepZone = ((a - KEEP[0]) / 4.2) ** 2 + ((b - KEEP[1]) / 3.6) ** 2 < 1; if (!keepZone) { WALLK.add(k); } } });
  for (const k of WALLK) { H[k] = CIT[4] + 2; MAT[k] = M.RAMP; }
  F.wall = [...WALLK];
  // ---------------------------------------------------------------- 4. materials
  for (const k of F.tiles) { if (MAT[k] === M.CHASM || MAT[k] === M.STREAM || MAT[k] === M.POOL || MAT[k] === M.RAMP) continue; const i = k % N, j = Math.floor(k / N), h = H[k], n0 = vnoise(i * 0.3, j * 0.3, 163), n1 = vnoise(i * 0.8, j * 0.8, 164);
    MAT[k] = h >= 8 ? (n1 > 0.75 ? M.BONE : M.SLATE) : h >= 4 ? (n0 > 0.52 ? M.SCRUB : M.SLATE) : (n0 > 0.66 ? M.MIRE : n0 > 0.3 ? M.YARD : M.SCRUB); }
  ell(CIT[0], CIT[1], CIT[2] - 0.8, CIT[3] - 0.8, (k, d) => { if (d < 1 && MAT[k] !== M.RAMP && MAT[k] !== M.CHASM) MAT[k] = (vnoise((k % N) * 0.9, Math.floor(k / N) * 0.9, 165) > 0.8) ? M.SLATE : M.BONE; });
  for (const [ca, cb, ra, rb] of [KEEP, TUSK]) ell(ca, cb, ra, rb, (k, d) => { if (d < 1) MAT[k] = M.BONE; });
  ell(DEN[0], DEN[1], DEN[2], DEN[3], (k, d) => { if (d < 1) MAT[k] = vnoise((k % N) * 0.7, Math.floor(k / N) * 0.7, 166) > 0.5 ? M.MIRE : M.SLATE; });
  ell(NEST[0], NEST[1], NEST[2], NEST[3], (k, d) => { if (d < 1) MAT[k] = M.SLATE; });
  ell(CAMP[0], CAMP[1], CAMP[2] - 2, CAMP[3] - 1, (k, d) => { if (d < 1 && MAT[k] !== M.STREAM && MAT[k] !== M.POOL) MAT[k] = M.YARD; });
  ell(MARKET[0], MARKET[1], MARKET[2] - 1, MARKET[3] - 1, (k, d) => { if (d < 1 && MAT[k] !== M.STREAM) MAT[k] = M.BONE; });

  // ---------------------------------------------------------------- 5. routes (heights interpolated <= 1 level per tile; planks over the gorge)
  const route = (pts, mat) => {   // pts: [a, b, level?]
    const tiles = []; for (let n = 0; n < pts.length - 1; n++) { let [a, b] = pts[n]; const [a1, b1] = pts[n + 1]; while (a !== a1 || b !== b1) { tiles.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); } }
    tiles.push(pts[pts.length - 1].slice(0, 2));
    const wl = pts.map(p => p[2]), idx = pts.map(p => tiles.findIndex(t => t[0] === p[0] && t[1] === p[1]));
    const gap = t => { const k = tile(...tiles[t]); return k >= 0 && (MAT[k] === M.CHASM || MAT[k] === M.STREAM || MAT[k] === M.POOL); };
    const lv = tiles.map(([a, b]) => { const k = tile(a, b); return k >= 0 ? H[k] : 0; });
    for (let n = 0; n < pts.length; n++) if (wl[n] !== undefined && idx[n] >= 0) lv[idx[n]] = wl[n];
    for (let n = 0; n < pts.length - 1; n++) { if (wl[n] === undefined || wl[n + 1] === undefined || idx[n] < 0 || idx[n + 1] < 0) continue; const i0 = idx[n], i1 = idx[n + 1]; for (let t = i0; t <= i1; t++) lv[t] = Math.round(wl[n] + (wl[n + 1] - wl[n]) * (t - i0) / Math.max(1, i1 - i0)); }
    for (let pass = 0; pass < 3; pass++) { for (let t = 1; t < lv.length; t++) { if (gap(t)) continue; if (lv[t] - lv[t - 1] > 1) lv[t] = lv[t - 1] + 1; if (lv[t] - lv[t - 1] < -1) lv[t] = lv[t - 1] - 1; }
      for (let t = lv.length - 2; t >= 0; t--) { if (gap(t)) continue; if (lv[t] - lv[t + 1] > 1) lv[t] = lv[t + 1] + 1; if (lv[t] - lv[t + 1] < -1) lv[t] = lv[t + 1] - 1; } }
    const gaps = []; let last = null;
    for (let t = 0; t < tiles.length; t++) { const k = tile(...tiles[t]); if (k < 0) { last = null; continue; } if (gap(t)) { gaps.push(k); H[k] = last !== null ? last : H[k]; } else { H[k] = lv[t]; last = lv[t]; if (MAT[k] === M.RAMP) { /* a gate gap in the wall */ } } }
    // a plank bridge keeps one level from abutment to abutment
    if (gaps.length) { const hs = tiles.map(t => { const k = tile(...t); return k >= 0 && !gap(tiles.indexOf(t)) ? H[k] : null; }).filter(v => v !== null); for (const k of gaps) H[k] = H[k] || hs[0]; }
    carvePath(pts.map(p => W(p[0], p[1])), mat || M.BONE, 'sdl');
    for (const k of gaps) { if (MAT[k] === M.SILKB) MAT[k] = M.PLANK; }
    return gaps;
  };
  // west entrance from Hỏa Diệm Sơn's east road (level 1), the valley road, camp
  let aw = 0; for (let a = 0; a < L.w; a++) if (tile(a, 30) >= 0) { aw = a; break; }
  F.westEnd = W(aw, 30);
  route([[aw, 30, 1], [aw + 4, 30, 1], [14, 30, 2], [19, 29, 2], [24, 29, 2], [30, 30, 2], [34, 29, 2], [38, 29, 2], [45, 30, 2]]);                    // valley road: west gate -> camp -> bridge over the stream -> market -> east exit
  route([[19, 29, 2], [19, 26, 2], [19, 24, 3], [17, 22, 4], [17, 20, 5], [20, 20, 6], [21, 19, 7], [21, 17, 8]]);                                     // camp -> switchbacks -> the citadel gate
  route([[21, 17, 8], [21, 13, 8], [20, 10, 8], [19, 9, 9]]);                                                                                       // gate -> throne square -> keep
  route([[21, 13, 8], [16, 13, 8], [13, 12, 8]]); route([[21, 13, 8], [27, 13, 8]]);                                                     // inner courtyard roads
  route([[27, 13, 8], [27, 16, 8], [29, 16, 7], [33, 16, 7], [35, 16, 7], [37, 15, 7]]);                                                                // high plank bridge over the gorge -> Bạch Tượng's hall
  route([[19, 24, 3], [14, 24, 3], [12, 23, 4], [10, 22, 5], [9, 21, 6]]);                                                                           // camp -> Thanh Sư's den
  route([[37, 15, 7], [37, 18, 7], [37, 21, 6], [37, 24, 4], [38, 27, 2], [38, 29, 2]]);                                                              // tusk hall -> market
  route([[38, 12, 7], [40, 10, 8], [41, 8, 10], [41, 7, 12], [41, 6, 13]]);                                                                           // up to the roc's nest
  route([[21, 19, 7], [24, 21, 6], [27, 21, 6], [32, 21, 6], [36, 21, 6], [37, 21, 6]]);                                                                   // low plank bridge (the cut between the gate road and the tusk road)
  route([[17, 20, 5], [12, 18, 5], [10, 17, 6]]);
  route([[22, 31, 2], [22, 35, 2], [21, 37, 2]]); route([[34, 29, 2], [34, 33, 2]]);                                                                  // supply lanes

  // ---------------------------------------------------------------- 6. props: landmarks first, then dressing
  const P = (kind, a, b, o) => { const [i, j] = W(a, b); if (!inB(i, j)) return null; if (o && o.block) { const fw = o.fp ? o.fp[0] : 1, fh = o.fp ? o.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) { const z = id(i + r, j + q); if (PATHC[z] || MAT[z] === M.STREAM || MAT[z] === M.CHASM || MAT[z] === M.POOL || MAT[z] === M.PLANK) return null; } } return prop(kind, i, j, o); };
  const Q = (kind, a, b, o) => { const [i, j] = W(a, b); if (inB(i, j)) poi(kind, 'sdl', i, j, o); };
  const LT = (a, b, r, col, kind) => TWM.lights.push({ biome: 'sdl', i: x0 + a, j: y0 + b, r, col, kind: kind || 'fire' });
  P('sdlkeep', 18, 6, { fp: [4, 4], v: 0 }); P('sdlgate', 19, 17, { fp: [4, 3], v: 0, block: false });
  P('sdlden', 8, 17, { fp: [4, 4], v: 0 }); P('sdltusk', 36, 13, { fp: [4, 4], v: 0 }); P('sdlnest', 39, 2, { fp: [3, 3], v: 0 });
  F.keep = W(19, 8); F.den = W(10, 20); F.hall = W(38, 16); F.nestAt = W(41, 5); F.gate = W(21, 17);
  Q('gate', 20, 19, { cap: 2, face: 'up' }); Q('gate', 22, 19, { cap: 2, face: 'up' }); Q('gateinner', 20, 14, { cap: 2, face: 'down' }); Q('gateinner', 22, 14, { cap: 2, face: 'down' });
  Q('throne', 21, 12, { cap: 5, face: 'up' }); Q('throne', 18, 12, { cap: 3, face: 'right' }); Q('throne', 24, 12, { cap: 3, face: 'left' }); Q('keepdoor', 19, 10, { cap: 3, face: 'up' });
  Q('denpost', 9, 21, { cap: 2, face: 'up' }); Q('denpost', 12, 22, { cap: 2, face: 'up' }); Q('hallpost', 36, 17, { cap: 2, face: 'up' }); Q('hallpost', 39, 17, { cap: 2, face: 'up' }); Q('nestpost', 41, 7, { cap: 2, face: 'down' });
  Q('kinglook', 12, 23, { cap: 1, face: 'right' }); Q('kinglook', 37, 21, { cap: 1, face: 'left' });
  // citadel wall walk posts (look-outs on the courtyard side of the wall), inner yard braziers
  for (const [a, b] of [[14, 8], [26, 8], [13, 14], [29, 14], [16, 16], [26, 16]]) { const k = tile(a, b); if (k >= 0 && !RES[k] && MAT[k] !== M.RAMP) Q('wallpost', a, b, { cap: 1, face: 'down' }); }
  // camp: tents around the drill yard, racks, supplies, braziers
  for (const [a, b, v] of [[10, 33, 0], [13, 34, 1], [26, 34, 0], [30, 34, 1], [6, 27, 1], [14, 26, 0], [25, 26, 1], [33, 25, 0]]) { P('sdltent', a, b, { fp: [2, 2], v, block: true }); Q('tent', a + 1, b + 2, { cap: 2, face: 'up' }); }
  for (const [a, b, v] of [[17, 32, 0], [21, 32, 0], [25, 32, 0]]) { P('sdlrack', a, b, { fp: [2, 2], v, block: true }); Q('rack', a, b + 2, { cap: 2, face: 'up' }); }
  Q('drill', 18, 29, { cap: 4, face: 'right' }); Q('drill', 22, 29, { cap: 4, face: 'left' }); Q('drill', 20, 33, { cap: 4, face: 'up' }); Q('parade', 20, 30, { cap: 8, face: 'up' });
  Q('mess', 24, 33, { cap: 3, face: 'up' }); Q('mess', 15, 33, { cap: 3, face: 'up' }); Q('crate', 31, 31, { cap: 2, face: 'up' }); Q('crate', 35, 31, { cap: 2, face: 'up' }); Q('crate', 40, 31, { cap: 2, face: 'up' });
  for (const [a, b, v] of [[29, 32, 0], [36, 32, 1], [41, 32, 0], [42, 27, 1]]) P('sdlcrates', a, b, { fp: [1, 1], v, block: true });
  Q('market', 38, 30, { cap: 4, face: 'up' }); Q('market', 35, 27, { cap: 3, face: 'down' }); Q('lookout', 44, 28, { cap: 2, face: 'left' });
  Q('bridge', 31, 16, { cap: 2, face: 'right' }); Q('bridge', 30, 21, { cap: 2, face: 'right' }); Q('falls', 28, 16, { cap: 2, face: 'right' }); Q('falls', 33, 21, { cap: 2, face: 'right' });
  for (const [a, b, v] of [[18, 19, 0], [24, 19, 0], [20, 27, 0], [26, 28, 0], [36, 27, 0], [14, 11, 0], [28, 10, 0]]) P('sdltotem', a, b, { fp: [1, 1], v, block: true });
  // banners and braziers line the roads (the fx layer animates the cloth and the witchfire)
  const BAN = [[20, 18, 0], [22, 18, 1], [20, 12, 0], [22, 12, 1], [17, 29, 0], [23, 29, 1], [11, 30, 0], [29, 29, 1], [37, 27, 0], [39, 27, 1], [27, 12, 0], [33, 11, 1], [10, 22, 0], [12, 18, 1], [36, 19, 0], [38, 19, 1], [14, 7, 0], [27, 8, 1]];
  for (const [a, b, v] of BAN) { const k = tile(a, b); if (k >= 0 && !RES[k] && MAT[k] !== M.STREAM && MAT[k] !== M.CHASM && MAT[k] !== M.POOL) { P('sdlbanner', a, b, { fp: [1, 1], v, block: true }); F.flags.push(W(a, b)); } }
  const BRZ = [[19, 17, 0], [24, 17, 1], [19, 11, 1], [23, 11, 0], [18, 25, 0], [22, 25, 1], [16, 32, 0], [26, 32, 1], [9, 30, 1], [33, 29, 0], [36, 21, 0], [38, 21, 1], [35, 13, 1], [10, 24, 0], [41, 9, 1], [28, 14, 0]];
  for (const [a, b, v] of BRZ) { const k = tile(a, b); if (k >= 0 && !RES[k] && MAT[k] !== M.STREAM && MAT[k] !== M.CHASM && MAT[k] !== M.POOL) { P('sdlbrazier', a, b, { fp: [1, 1], v, block: true }); F.braziers.push(W(a, b)); Q('brazier', a, b + 1, { cap: 2, face: 'up' }); LT(a, b, 46, '120,255,120'); } }
  // wall-top torches (small flames drawn by fx), spaced along the battlements
  for (let n = 0; n < F.wall.length; n += 3) { const k = F.wall[n]; F.torches.push([k % N, Math.floor(k / N)]); LT(k % N - x0, Math.floor(k / N) - y0, 30, '150,255,130'); }
  // dead pines, boulders and bone-grey scrub on the slopes
  for (let n = 0; n < 190; n++) { const a = Math.floor(R() * L.w), b = Math.floor(R() * L.h), k = tile(a, b); if (k < 0 || RES[k] || PATHC[k] || MAT[k] === M.STREAM || MAT[k] === M.CHASM || MAT[k] === M.POOL || MAT[k] === M.RAMP || MAT[k] === M.BONE || MAT[k] === M.YARD) continue; const h = H[k]; if (h >= 11) continue;
    const kind = n % 3 ? 'sdlpine' : 'sdlrock'; P(kind, a, b, { fp: [1, 1], v: n & 3, block: true }); }
  for (let n = 0; n < F.falls.length; n += 2) { const k = F.falls[n]; LT(k % N - x0, Math.floor(k / N) - y0, 30, '180,230,255', 'lantern'); }
  LT(41, 5, 120, '255,210,90'); LT(19, 8, 110, '120,255,130'); LT(9, 20, 90, '100,255,230'); LT(37, 15, 90, '255,240,200');
  F.posts = { gate: F.gate, den: F.den, hall: F.hall, nest: F.nestAt, keep: F.keep };
  // reserve the great squares so scatter never lands on them
  for (let b = 10; b <= 15; b++) for (let a = 17; a <= 25; a++) { const k = tile(a, b); if (k >= 0) RES[k] = 1; }
  for (let b = 28; b <= 34; b++) for (let a = 16; a <= 26; a++) { const k = tile(a, b); if (k >= 0) RES[k] = 1; }

  // ---------------------------------------------------------------- 7. edges: seam with Hỏa Diệm Sơn, outward band, rim (no dead wedges)
  const FIRE = TWM.fire; let dist = new Map();
  { const q = []; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => inMap(i + a, j + b) && !inB(i + a, j + b))) { dist.set(k, 0); q.push(k); } }
    for (let h = 0; h < q.length; h++) { const k = q[h], d = dist.get(k); if (d >= 4) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (!dist.has(z)) { dist.set(z, d + 1); q.push(z); } } } }
  const hdsB = TWM.bi.hds; let seamN = 0;
  // two-way creep at the Hỏa Diệm Sơn border: scorched ash eats into the slate, cold slate and bone dust creep into the volcano's edge (colour only; geometry is untouched)
  for (const [k, d] of dist) { if (MAT[k] === M.STREAM || MAT[k] === M.CHASM || MAT[k] === M.POOL || MAT[k] === M.RAMP || PATHC[k]) continue; const i = k % N, j = Math.floor(k / N);
    let nb = false; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (inMap(i + di, j + dj) && BIO[id(i + di, j + dj)] === hdsB) nb = true; if (!nb && d > 2) continue;
    let nh = false; for (let dj = -3; dj <= 3 && !nh; dj++) for (let di = -3; di <= 3; di++) if (inMap(i + di, j + dj) && BIO[id(i + di, j + dj)] === hdsB) { nh = true; break; } if (!nh) continue;
    const r = hash2(i, j, 170), p = 0.7 - d * 0.18; if (r < p) { MAT[k] = r < p * 0.3 ? M.SCORCH : M.ASH; seamN++; } }
  if (FIRE && FIRE.tiles) for (const k of FIRE.tiles) { if (MAT[k] === M.LAVA || MAT[k] === M.CRUST || MAT[k] === M.LBRIDGE || PATHC[k] || RES[k]) continue; const i = k % N, j = Math.floor(k / N); let d = 9; for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) if (inMap(i + di, j + dj) && BIO[id(i + di, j + dj)] === B) d = Math.min(d, Math.abs(di) + Math.abs(dj)); if (d > 4) continue;
    const r = hash2(i, j, 171); if (r < 0.52 - d * 0.1 && (MAT[k] === M.ASH || MAT[k] === M.SCORCH)) { MAT[k] = M.SLATE; seamN++; } }
  F.seamTiles = seamN;
  // outward band: placeholder ground near the ridge turns slate and scrub with dead pines (the biome pushes out)
  const dOut = new Map(); { const q = []; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] !== M.VOID && !dOut.has(z)) { dOut.set(z, 1); q.push(z); } } }
    for (let h = 0; h < q.length; h++) { const k = q[h], d = dOut.get(k); if (d >= 6) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] === M.VOID || TWM.biomes[BIO[z]].built || dOut.has(z)) continue; dOut.set(z, d + 1); q.push(z); } } }
  F.out = [];
  for (const [k, d] of dOut) { if (TWM.biomes[BIO[k]].built || RES[k]) continue; const i = k % N, j = Math.floor(k / N), p = Math.pow(1 - (d - 1) / 5.5, 1.2), r = hash2(i, j, 172), n = vnoise(i * 0.4, j * 0.4, 173);
    if (MAT[k] >= M.PH && r < p * (0.5 + n * 0.55)) { MAT[k] = n > 0.55 ? M.SLATE : M.SCRUB; F.out.push(k); } else if (MAT[k] === M.TRAIL && d < 5) MAT[k] = M.BONE;
    if (d <= 4 && r > 0.94 - p * 0.1 && !PATHC[k] && MAT[k] !== M.TRAIL && (MAT[k] === M.SLATE || MAT[k] === M.SCRUB)) prop(r > 0.97 ? 'sdlrock' : 'sdlpine', i, j, { fp: [1, 1], v: Math.floor(r * 97) & 3, block: true }); }
  // rim and cliff faces: every unbuilt tile near the ridge (including the world-rim wall) is painted in slate with bone strata (tw-art.js faceCol); hds keeps its own
  { const lionNear = TWM.lionNear = new Uint8Array(N * N), q = []; const dl = new Int16Array(N * N).fill(-1);
    for (const k of F.tiles) { lionNear[k] = 1; dl[k] = 0; q.push(k); }
    for (let h = 0; h < q.length; h++) { const k = q[h]; if (dl[k] >= 14) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b)) continue; const z = id(i + a, j + b); if (dl[z] >= 0) continue; if (BIO[z] !== B && TWM.biomes[BIO[z]].built) continue; dl[z] = dl[k] + 1; lionNear[z] = 1; q.push(z); } }
    // where the volcano's own near-field overlaps, the closer biome wins
    if (TWM.fireNear) { const dh = new Int16Array(N * N).fill(-1), q2 = []; for (const k of (FIRE ? FIRE.tiles : [])) { dh[k] = 0; q2.push(k); }
      for (let h = 0; h < q2.length; h++) { const k = q2[h]; if (dh[k] >= 16) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b)) continue; const z = id(i + a, j + b); if (dh[z] >= 0) continue; if (BIO[z] !== hdsB && TWM.biomes[BIO[z]].built) continue; dh[z] = dh[k] + 1; q2.push(z); } }
      for (let k = 0; k < N * N; k++) if (lionNear[k] && BIO[k] !== hdsB && (dh[k] < 0 || dl[k] <= dh[k])) TWM.fireNear[k] = 0; else if (lionNear[k] && BIO[k] !== B) lionNear[k] = 0; } }
  // rim composition: the south strip is a slate shelf with a lookout, a ruined watch post, dead pines and a broken ridge (never a straight wall)
  for (const [a, b] of [[3, 37], [8, 38], [14, 37], [19, 38], [31, 38], [36, 37], [41, 38], [44, 33], [45, 24], [45, 10], [38, 1], [26, 0], [12, 1], [3, 6]]) { const k = tile(a, b); if (k >= 0 && !RES[k] && !PATHC[k] && MAT[k] !== M.STREAM && MAT[k] !== M.CHASM) P((a + b) % 3 ? 'sdlpine' : 'sdlrock', a, b, { fp: [1, 1], v: (a + b) & 3, block: true }); }
  for (const [a, b] of [[44, 36], [4, 35]]) P('sdlbanner', a, b, { fp: [1, 1], v: a & 1, block: true });
  for (const k of F.tiles) { const d = dist.get(k); if (d === undefined || d > 2 || MAT[k] === M.STREAM || MAT[k] === M.CHASM || MAT[k] === M.POOL || PATHC[k] || MAT[k] === M.RAMP) continue; const i = k % N, j = Math.floor(k / N); if (BIO[id(clamp(i + 1, 0, N - 1), j)] === hdsB || BIO[id(i - 1, j)] === hdsB || BIO[id(i, j - 1)] === hdsB || BIO[id(i, j + 1)] === hdsB) continue;
    const n = vnoise(i * 0.35, j * 0.35, 174); H[k] = clamp(H[k] + Math.round((n - 0.4) * 3.4), 1, 13); }
  TWM.homes = TWM.homes || {}; TWM.homes.sdl = { lion_king: W(9, 21), elephant_king: W(37, 16), roc_king: W(41, 6), _: W(20, 30) };
};
window.TW_LION_FINAL = function (X) {   // every Sư Đà Lĩnh POI must be reachable from the west gate over the real walk graph (stairs included)
  const { TWM, id, N } = X, F = TWM.lion, st = id(F.westEnd[0], F.westEnd[1]), seen = new Uint8Array(N * N), q = [st]; seen[st] = 1;
  for (let n = 0; n < q.length; n++) { const k = q[n], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (!seen[z] && TWM.canStep(k, z)) { seen[z] = 1; q.push(z); } } }
  const before = TWM.pois.length; TWM.pois = TWM.pois.filter(p => p.biome !== 'sdl' || seen[id(Math.floor(p.x / 8), Math.floor(p.y / 8))]); F.droppedPois = before - TWM.pois.length;
};
if (typeof module !== 'undefined') module.exports = {};
