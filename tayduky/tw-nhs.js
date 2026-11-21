'use strict';
// ===== Tây Du Ký v2 — Ngũ Hành Sơn (The Five Elements Mountain): map build (world space; loaded before tw-map.js) =====
// tw-layout.js lets the placeholder planner shape the region (local 26 x 42 at world (97, 48), a wedge on the world's east rim) and flags it built; this hook authors it:
//   * ONE enormous mountain: a layered, terraced massif (level 3 -> 20, 320 art px) whose south-east face looks at the camera, wrapped by a switchback pilgrim path that climbs to the summit shrine where the
//     golden Buddhist seal is fixed; the foot of the south face is the prison: Sun Wukong's head and arms stick out of a rock crack (a PixelLab hero sprite) in a small court;
//   * three waterfalls: a west-flank cascade, the central fall beside the prison and an east fall that pours over the world rim; a meadow stream with plank bridges and a pool;
//   * a meadow with the hermit's hut, wayshrines, a stele and ruins, flower groves, birch / blossom trees (seasonal sprites), pines, bamboo and boulders;
//   * the road: the Hắc Phong Sơn gate (west) -> meadow -> the prison court -> the summit climb; north road along the east rim to the tail (gate to the north); south road to the Thông Thiên Hà bluff path.
// Local (a, b) -> world (x0 + a, y0 + b); screen u = a - b, v = a + b (small v = back = higher).
window.TW_NHS_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, prop, poi, id, inMap, vnoise, hash2, carvePath, mulberry32 } = X;
  const B = TWM.bi.nhs, R = mulberry32(20261201);
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let k = 0; k < N * N; k++) if (BIO[k] === B) { const i = k % N, j = Math.floor(k / N); x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  const L = TWM.layout.nhs = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }, W = (a, b) => [x0 + a, y0 + b], inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B;
  const sm = t => t * t * (3 - 2 * t), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const F = TWM.nhs = { x0, y0, B, tiles: [], stream: [], falls: [], posts: {}, pads: {}, path: [], summitLevel: 20, lamps: [], eyes: null };
  const tile = (a, b) => { const [i, j] = W(a, b); return inB(i, j) ? id(i, j) : -1; };
  const isWater = k => MAT[k] === M.STREAM || MAT[k] === M.POOL;
  // ---------------------------------------------------------------- 1. the massif: terraced radial mountain + embankments along the path
  const PK = [13, 13], RA = 12.5, RB = 15.5, TOP = 18, BASE = 3;
  const radial = (a, b) => { const d = Math.hypot((a - PK[0]) / RA, (b - PK[1]) / RB); if (d >= 1) return BASE - 0.0; const f = Math.pow(1 - d, 1.35); return BASE + (TOP - BASE) * f; };
  const terrace = (lv, a, b) => { if (lv <= BASE + 0.5) return BASE; const t = lv / 3 + (vnoise(a * 0.2, b * 0.2, 501) - 0.5) * 0.9, fl = Math.floor(t), fr = t - fl; return 3 * fl + 3 * clamp((fr - 0.35) / 0.3, 0, 1); };
  // the pilgrim climb (planned first: its embankments carry the terrain)
  const CLIMB = [[12, 27], [20, 27], [21, 23], [16, 23], [16, 19], [21, 19], [21, 15], [17, 15], [16, 13], [14, 13]];
  const arc = pts => { const t = []; for (let n = 0; n < pts.length - 1; n++) { let [a, b] = pts[n]; const [a1, b1] = pts[n + 1]; while (a !== a1 || b !== b1) { t.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); } } t.push(pts[pts.length - 1].slice()); return t; };
  const climbTiles = arc(CLIMB), flatLen = 9, cl = climbTiles.map((p, n) => n < flatLen ? 4 : Math.round(4 + (TOP - 4) * clamp((n - flatLen) / (climbTiles.length - 1 - flatLen), 0, 1)));
  const emb = new Map(); climbTiles.forEach(([a, b], n) => { for (let da = -2; da <= 2; da++) for (let db = -2; db <= 2; db++) { const d = Math.max(Math.abs(da), Math.abs(db)), lv = cl[n] - Math.max(0, d - 1) * 1.4; const key = (a + da) + ',' + (b + db); if (!emb.has(key) || emb.get(key) < lv) emb.set(key, lv); } });
  for (let b = 0; b < L.h; b++) for (let a = 0; a < L.w; a++) { const [i, j] = W(a, b); if (!inB(i, j)) continue; const k = id(i, j); F.tiles.push(k);
    const n1 = vnoise(a * 0.7, b * 0.7, 502), crag = Math.max(0, vnoise(a * 0.45, b * 0.45, 503) - 0.6) * 6 * (radial(a, b) > 8 ? 1 : 0);
    const back = (a >= 4 && a <= 16 && b >= 11 && b <= 23) ? (7.5 + (23 - b) * 0.8) * sm(clamp((a - 3) / 3, 0, 1)) * sm(clamp((17 - a) / 3, 0, 1)) : 0;   // the mountain's sheer face rises straight behind the prison
    let lv = Math.max(terrace(radial(a, b), a, b) + crag + (n1 - 0.5) * 0.7, emb.get(a + ',' + b) || 0, back > 4 ? terrace(back, a, b) : 0);
    H[k] = clamp(Math.round(lv), 2, 22); MAT[k] = M.NTURF; }
  // Hắc Phong Sơn's flank runs into the mountain's west foot: a slope down from its level (never a cliff of more than one level at the border)
  { const q = [], dist = new Map(); for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[-1, 0], [0, -1]]) { if (!inMap(i + da, j + db)) continue; const z = id(i + da, j + db); if (BIO[z] === TWM.bi.hps && MAT[z] !== M.VOID) { dist.set(k, 1); q.push([k, H[z]]); break; } } }
    for (let h = 0; h < q.length; h++) { const [k, lvl] = q[h], d = dist.get(k); H[k] = Math.max(H[k], Math.round(lvl - (d - 1) * 1.0)); if (d >= 6) continue; const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + da, j + db)) continue; const z = id(i + da, j + db); if (!dist.has(z)) { dist.set(z, d + 1); q.push([z, lvl]); } } } }
  // ---------------------------------------------------------------- 2. pads
  const ell = (ca, cb, ra, rb, fn, pw) => { pw = pw || 2; for (let b = Math.floor(cb - rb - 2); b <= cb + rb + 2; b++) for (let a = Math.floor(ca - ra - 2); a <= ca + ra + 2; a++) { const d = (Math.abs(a - ca) / ra) ** pw + (Math.abs(b - cb) / rb) ** pw, k = tile(a, b); if (k >= 0) fn(k, d, a, b); } };
  const flat = (ca, cb, ra, rb, lv, pw) => ell(ca, cb, ra, rb, (k, d) => { if (isWater(k)) return; if (d < 1) H[k] = lv; else if (d < 1.9) H[k] = Math.round(lv + (H[k] - lv) * sm((d - 1) / 0.9)); }, pw);
  const SUMMIT = [13.5, 13, 2.7, 2.4, TOP, 4], COURT = [11.5, 25.5, 4, 2.7, 4, 4], HERMIT = [7, 21, 2.4, 2, 9, 4], MIDSH = [20.5, 21, 2, 1.6, 7, 4], STELE = [20, 15, 2.2, 1.8, 14, 4];
  F.pads = { SUMMIT, COURT, HERMIT, MIDSH, STELE };
  for (const p of [COURT, HERMIT, SUMMIT]) flat(...p);
  // meadow south of the stream: level 3 (the tail climbs to the bluff path on its own route)
  for (const k of F.tiles) { const j = Math.floor(k / N) - y0, i = k % N - x0; if (j >= 28) { const hpsEdge = i < 6; if (!hpsEdge) H[k] = 3; } }
  // ---------------------------------------------------------------- 3. water: west cascade (S1), the central fall (S3), the east fall (S2, pours over the rim) and the meadow stream
  const SPT = {
    S1: [[6, 15, 13], [6, 17, 11], [6, 19, 10], [5, 21, 8], [5, 24, 6], [6, 26, 4], [6, 28, 3], [12, 28, 3], [16, 28, 3], [21, 28, 3], [25, 28, 3]],
    S3: [[14, 18, 15], [14, 20, 12], [14, 22, 9], [14, 24, 7], [14, 26, 5], [14, 27, 4], [14, 28, 3]],
    S2: [[20, 9, 17], [21, 11, 15], [22, 13, 13], [23, 15, 11], [24, 12, 9], [24, 13, 7], [25, 13, 7]] };
  for (const key of ['S1', 'S3', 'S2']) { const SP = SPT[key], tiles = [];
    for (let n = 0; n < SP.length - 1; n++) { let [a, b, l0] = SP[n]; const [a1, b1, l1] = SP[n + 1], seg = []; while (a !== a1 || b !== b1) { seg.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); }
      seg.forEach(([qa, qb], t) => tiles.push([qa, qb, Math.round(l0 + (l1 - l0) * t / Math.max(1, seg.length))])); }
    const last = SP[SP.length - 1]; tiles.push([last[0], last[1], last[2]]);
    for (const [a, b, lv] of tiles) { const k = tile(a, b); if (k < 0) continue; MAT[k] = M.STREAM; H[k] = lv; if (!F.stream.includes(k)) F.stream.push(k); } }
  // a pool where the west cascade meets the meadow, and a lily pond east of the prison court
  for (const [a, b] of [[7, 29], [8, 29], [9, 29]]) { const k = tile(a, b); if (k >= 0) { MAT[k] = M.POOL; H[k] = 3; F.stream.push(k); } }
  for (const [a, b] of [[19, 29], [20, 29], [19, 30], [20, 30], [21, 30]]) { const k = tile(a, b); if (k >= 0) { MAT[k] = M.POOL; H[k] = 3; F.stream.push(k); } }
  for (const k of F.stream) { const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + da, j + db)) continue; const q = id(i + da, j + db); if (!isWater(q) && H[q] < H[k]) H[q] = H[k]; } }
  // ---------------------------------------------------------------- 4. materials: meadow turf, granite, scree, flagstone
  const slope = k => { let s = 0; const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + da, j + db)) continue; const q = id(i + da, j + db); if (BIO[q] !== B) continue; s = Math.max(s, Math.abs(H[q] - H[k])); } return s; };
  for (const k of F.tiles) { if (isWater(k)) continue; const i = k % N, j = Math.floor(k / N), h = H[k], n0 = vnoise(i * 0.3, j * 0.3, 504), n1 = vnoise(i * 0.8, j * 0.8, 505), s = slope(k);
    MAT[k] = s >= 3 || (h >= 14 && n0 > 0.62) || (h >= 9 && n1 > 0.9) ? M.NROCK : (h <= 5 && n0 > 0.7) || n1 > 0.86 ? M.NGRAV : M.NTURF; }
  const paint = (p, mat, rim) => ell(p[0], p[1], p[2], p[3], (k, d) => { if (d < rim && !isWater(k)) MAT[k] = mat; }, p[5]);
  paint(SUMMIT, M.NFLAG, 0.95); paint(COURT, M.NFLAG, 0.9); paint(HERMIT, M.NGRAV, 0.8);
  // ---------------------------------------------------------------- 5. routes
  const route = (pts, mat, lvOf) => {
    const tiles = arc(pts), gap = t => { const k = tile(...tiles[t]); return k >= 0 && isWater(k); };
    const lv = tiles.map(([a, b]) => { const k = tile(a, b); return k >= 0 ? H[k] : 0; });
    if (lvOf) tiles.forEach((p, t) => { const v = lvOf(p, t, tiles.length); if (v !== undefined) lv[t] = v; });
    for (let pass = 0; pass < 3; pass++) { for (let t = 1; t < lv.length; t++) { if (gap(t) || gap(t - 1)) continue; if (lv[t] - lv[t - 1] > 1) lv[t] = lv[t - 1] + 1; if (lv[t] - lv[t - 1] < -1) lv[t] = lv[t - 1] - 1; } for (let t = lv.length - 2; t >= 0; t--) { if (gap(t) || gap(t + 1)) continue; if (lv[t] - lv[t + 1] > 1) lv[t] = lv[t + 1] + 1; if (lv[t] - lv[t + 1] < -1) lv[t] = lv[t + 1] - 1; } }
    let last = null; for (let t = 0; t < tiles.length; t++) { const k = tile(...tiles[t]); if (k < 0) { last = null; continue; } if (gap(t)) { H[k] = last !== null ? last : H[k]; } else { H[k] = lv[t]; last = lv[t]; } }
    carvePath(pts.map(p => W(p[0], p[1])), mat || M.NGRAV, 'nhs');
    for (const [a, b] of tiles) { const k = tile(a, b); if (k >= 0 && MAT[k] === M.BRIDGE) MAT[k] = M.PLANK; if (k >= 0) F.path.push(k); }
  };
  route(CLIMB, M.NFLAG, (p, t) => cl[t]);                                                                                                   // the summit climb (flagstone switchbacks)
  const g0 = (() => { for (let a = 0; a < 12; a++) if (tile(a, 32) >= 0) return [a, 32]; return [6, 32]; })();
  F.gate = W(g0[0], g0[1]);
  route([[g0[0], 32, 3], [12, 32, 3], [12, 29, 3], [12, 27, 4]], M.NGRAV, (p, t, n) => p[1] >= 29 ? 3 : undefined);                         // hps gate -> meadow -> plank bridge -> the prison court
  route([[12, 32], [20, 32], [22, 32], [22, 34], [21, 36], [21, 38]], M.NGRAV, (p, t) => (p[1] >= 36 ? (p[1] === 36 ? 4 : 5) : 3));          // south road to the Thông Thiên Hà bluff path
  route([[22, 32], [24, 30], [24, 26], [24, 23], [24, 12], [23, 7], [22, 4], [22, 1]], M.NGRAV, (p, t, n) => { const b = p[1], T = [[24, 3], [20, 5], [16, 6], [13, 7], [10, 6], [7, 5], [4, 3], [2, 3], [1, 2]]; for (let q = 0; q < T.length - 1; q++) if (b <= T[q][0] && b >= T[q + 1][0]) return Math.round(T[q + 1][1] + (T[q][1] - T[q + 1][1]) * (b - T[q + 1][0]) / (T[q][0] - T[q + 1][0])); return b > 24 ? 3 : 2; });   // north road (east rim) to the tail
  route([[12, 27], [8, 27], [8, 22], [7, 21]], M.NGRAV, (p, t) => (p[1] <= 22 ? 9 : undefined));                                                  // hermit's trail up the west flank
  F.tail = W(22, 1);
  // Thông Thiên Hà link: the bluff path tile (118, 86) is level 5: the road meets it on the same level
  // ---------------------------------------------------------------- 6. props
  const P = (kind, a, b, o) => { const [i, j] = W(a, b); if (!inB(i, j)) return null; if (o && o.block) { const fw = o.fp ? o.fp[0] : 1, fh = o.fp ? o.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) { const z = id(i + r, j + q); if (z >= N * N || PATHC[z] || isWater(z) || MAT[z] === M.PLANK || BIO[z] !== B) return null; } } return prop(kind, i, j, o); };
  const Q = (kind, a, b, o) => { const [i, j] = W(a, b); if (inB(i, j)) { poi(kind, 'nhs', i, j, o); RES[id(i, j)] = 1; } };
  const LT = (a, b, r, col, kind) => TWM.lights.push({ biome: 'nhs', i: x0 + Math.floor(a), j: y0 + Math.floor(b), r, col, kind: kind || 'fire' });
  const L1 = (kind, a, b, o) => { const p = P(kind, a, b, o); if (!p) (F.failed = F.failed || []).push(kind + '@' + a + ',' + b); return p; };
  L1('nhsprison', 9, 23, { fp: [5, 3], v: 0, block: true });          // Wukong under the mountain (hero sprite; the prison face is its rock)
  L1('nhssummit', 11, 12, { fp: [3, 3], v: 0, block: true });         // the summit crag with its shrine; the golden seal is drawn on top by the fx layer
  L1('hut', 8, 19, { fp: [2, 2], v: 1, block: true });   // hermit's hut and a mountain shrine on the west ledge
  L1('shrine', 18, 24, { fp: [2, 2], v: 2, block: true });             // roadside shrine on the first switchback
  L1('hpsstupa', 18, 16, { fp: [2, 2], v: 0, block: true }); L1('hpspavilion', 22, 17, { fp: [2, 2], v: 1, block: true });   // an old stupa and a rest pavilion on the upper terraces
  L1('hpswayshrine', 13, 33, { fp: [1, 1], v: 0, block: true }); L1('hpswayshrine', 22, 8, { fp: [1, 1], v: 1, block: true }); L1('hpswayshrine', 23, 28, { fp: [1, 1], v: 0, block: false });
  L1('hpswell', 15, 33, { fp: [2, 2], v: 0, block: true });
  F.foc = W(12, 27); F.prison = W(11.5, 25.5); F.summit = W(13.5, 13.5); F.hut = W(9, 22); F.meadow = W(14, 31); F.court = W(12, 27);
  for (const [a, b] of [[11, 30], [13, 30], [10, 33], [14, 34], [23, 25], [22, 22], [21, 26]]) { const p = L1('hpslantern', a, b, { fp: [1, 1], v: (a + b) & 1, block: true }); if (p) { F.lamps.push(W(a, b)); LT(a, b, 44, '255,190,100', 'lantern'); } }
  LT(11.5, 25, 90, '255,200,110', 'lantern'); LT(14, 13, 90, '255,215,120', 'fire');
  // posts (activities and wildlife)
  Q('ngraze', 9, 31, { cap: 2, face: 'down' }); Q('ngraze', 16, 31, { cap: 2, face: 'down' }); Q('ngraze', 18, 33, { cap: 2, face: 'down' }); Q('ngraze', 6, 34, { cap: 2, face: 'down' }); Q('ngraze', 12, 35, { cap: 2, face: 'down' }); Q('ngraze', 23, 34, { cap: 2, face: 'down' });
  Q('ndrink', 10, 29, { cap: 2, face: 'up' }); Q('ndrink', 14, 29, { cap: 2, face: 'up' }); Q('ndrink', 18, 29, { cap: 2, face: 'up' }); Q('ndrink', 22, 29, { cap: 2, face: 'up' });
  Q('nclimb', 7, 20, { cap: 2, face: 'up' }); Q('nclimb', 8, 24, { cap: 2, face: 'up' }); Q('nclimb', 20, 18, { cap: 2, face: 'right' });
  Q('nhut', 8, 22, { cap: 2, face: 'up' }); Q('nhut', 7, 22, { cap: 2, face: 'up' }); Q('nshrine', 18, 26, { cap: 2, face: 'up' }); Q('nshrine', 19, 26, { cap: 2, face: 'up' });
  Q('nprison', 11, 27, { cap: 3, face: 'up' }); Q('nprison', 13, 27, { cap: 3, face: 'up' }); Q('nprison', 12, 28, { cap: 3, face: 'up' }); Q('nprison', 9, 27, { cap: 2, face: 'up' });
  Q('nlook', 20, 16, { cap: 2, face: 'left' }); Q('nlook', 20, 18, { cap: 2, face: 'left' }); Q('nsummit', 15, 13, { cap: 2, face: 'left' });
  Q('nwood', 22, 30, { cap: 2, face: 'down' }); Q('nwood', 17, 34, { cap: 2, face: 'down' }); Q('nrest', 20, 31, { cap: 3, face: 'up' }); Q('nrest', 11, 33, { cap: 3, face: 'up' });
  // scatter: broadleaf trees and flowering shrubs on the meadow, pines and boulders up the slopes, bamboo by the water; nothing on reserved squares
  for (let b = 27; b <= 33; b++) for (let a = 4; a <= 16; a++) { const k = tile(a, b); if (k >= 0 && (PATHC[k] || b <= 28)) RES[k] = 1; }
  for (let n = 0; n < 470; n++) { const a = Math.floor(R() * L.w), b = Math.floor(R() * L.h), k = tile(a, b); if (k < 0 || RES[k] || PATHC[k] || isWater(k) || MAT[k] === M.PLANK || MAT[k] === M.NFLAG) continue;
    const m = MAT[k], h = H[k], r = R(); let kind;
    if (m === M.NROCK) kind = r < 0.55 ? 'nhsrock' : h < 15 ? 'nhspine' : 'nhsrock'; else if (m === M.NGRAV) kind = r < 0.4 ? 'nhsrock' : 'nhsbush'; else if (h <= 5) kind = r < 0.34 ? 'nhstree' : r < 0.5 ? 'nhsbush' : r < 0.64 ? 'nhsflower' : r < 0.72 ? 'nhspine' : r < 0.8 ? 'nhsbamboo' : 'nhstree'; else kind = r < 0.3 ? 'nhspine' : r < 0.58 ? 'nhstree' : r < 0.74 ? 'nhsbush' : r < 0.82 ? 'nhsrock' : 'nhsflower';
    if (kind === 'nhsbamboo') { let near = false; for (const s of F.stream) { const dd = Math.abs((s % N) - (k % N)) + Math.abs(Math.floor(s / N) - Math.floor(k / N)); if (dd < 5) { near = true; break; } } if (!near) kind = 'nhstree'; }
    P(kind, a, b, { fp: [1, 1], v: n & 3, block: kind !== 'nhsflower' }); }
  // hand-placed hero trees
  for (const [a, b, kd, v] of [[5, 31, 'nhstree', 0], [18, 31, 'nhstree', 1], [10, 34, 'nhstree', 1], [3, 33, 'nhstree', 0], [24, 32, 'nhstree', 0], [14, 23, 'nhstree', 0], [8, 18, 'nhstree', 1], [24, 36, 'nhstree', 1]]) P(kd, a, b, { fp: [1, 1], v, block: true });
  // ---------------------------------------------------------------- 7. the mountain meets the world: outward band + near-field (placeholders around the biome take granite and moss)
  F.out = [];
  const dOut = new Map(); { const q = []; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] !== M.VOID && !dOut.has(z)) { dOut.set(z, 1); q.push(z); } } }
    for (let h = 0; h < q.length; h++) { const k = q[h], d = dOut.get(k); if (d >= 7) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] === M.VOID || TWM.biomes[BIO[z]].built || dOut.has(z)) continue; dOut.set(z, d + 1); q.push(z); } } }
  for (const [k, d] of dOut) { if (TWM.biomes[BIO[k]].built || RES[k]) continue; const i = k % N, j = Math.floor(k / N), p = Math.pow(1 - (d - 1) / 6.5, 1.15), r = hash2(i, j, 511), n = vnoise(i * 0.4, j * 0.4, 512);
    if (MAT[k] >= M.PH && MAT[k] < M.HROCK && r < p * (0.5 + n * 0.55)) { MAT[k] = n > 0.62 ? M.NROCK : n > 0.35 ? M.NGRAV : M.NTURF; F.out.push(k); }
    if (d <= 5 && r > 0.9 - p * 0.12 && !PATHC[k] && (MAT[k] === M.NTURF || MAT[k] === M.NGRAV || MAT[k] === M.NROCK)) prop(r > 0.96 ? 'nhsrock' : r > 0.93 ? 'nhstree' : 'nhspine', i, j, { fp: [1, 1], v: Math.floor(r * 97) & 3, block: true }); }
  { const near = TWM.nhsNear = new Uint8Array(N * N), q = [], dl = new Int16Array(N * N).fill(-1);
    for (const k of F.tiles) { near[k] = 1; dl[k] = 0; q.push(k); }
    for (let h = 0; h < q.length; h++) { const k = q[h]; if (dl[k] >= 9) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b)) continue; const z = id(i + a, j + b); if (dl[z] >= 0) continue; if (BIO[z] !== B && TWM.biomes[BIO[z]].built) continue; dl[z] = dl[k] + 1; near[z] = 1; q.push(z); } }
    for (const nm of ['lionNear', 'fireNear', 'tthNear', 'hpsNear']) if (TWM[nm]) for (let k = 0; k < N * N; k++) if (near[k] && TWM[nm][k] && BIO[k] !== B) near[k] = 0; }
  TWM.homes = TWM.homes || {}; TWM.homes.nhs = { deer: W(14, 31), goat: W(8, 24), monkey: W(10, 33), hermit: W(9, 22), wood: W(22, 30), monk: W(12, 32), _: W(14, 31) };
  F.eyes = W(11.5, 25.5);
};
window.TW_NHS_FINAL = function (X) {   // drop any post the walk graph cannot reach
  const { TWM, id, N } = X, F = TWM.nhs, B = F.B, st = id(F.gate[0], F.gate[1]), seen = new Uint8Array(N * N), q = [st]; seen[st] = 1;
  for (let n = 0; n < q.length; n++) { const k = q[n], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (!seen[z] && TWM.BIO[z] === B && TWM.canStep(k, z)) { seen[z] = 1; q.push(z); } } }
  F.reach = seen; const before = TWM.pois.length; F.dropped = [];
  TWM.pois = TWM.pois.filter(p => { if (p.biome !== 'nhs') return true; const k = id(Math.floor(p.x / 8), Math.floor(p.y / 8)); if (!seen[k]) F.dropped.push(p.kind + '@' + (p.i - F.x0) + ',' + (p.j - F.y0)); return seen[k]; }); F.droppedPois = before - TWM.pois.length;
};
if (typeof module !== 'undefined') module.exports = {};
