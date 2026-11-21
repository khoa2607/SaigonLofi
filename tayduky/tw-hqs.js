'use strict';
// ===== Tây Du Ký v2 — Hoa Quả Sơn (Flower-Fruit Mountain, the Monkey Kingdom), full rebuild: map build (world space; loaded before tw-map.js) =====
// The planner region of `hqs` (x 60-101, y 1-37) is re-authored here; everything the old pilot built on it is purged first.
// A jade mountain range wraps the north and west (back wall, level 11-13); a spring lake on the plateau (L13) feeds the Great Fall of Thủy Liêm Động (3 tiles wide, 10 levels, with two flanking falls) into the
// lake at the foot (L3). The Hầu Vương plaza and dais (L3 / L5) lie east of the lake, the monkey village terrace (L6) and the statue summit (L10) climb the east, peach terraces step down the west,
// the training yard, a cloud-sea lookout and the Huaguo gate (L1, meeting Ngũ Trang Quán's west road) close the south; the east coast is a beach and the Đông Hải.
window.TW_HQS_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, prop, poi, id, inMap, vnoise, hash2, carvePath, mulberry32 } = X;
  const B = TWM.bi.hqs, R = mulberry32(20261204);
  const inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B, tile = (i, j) => inB(i, j) ? id(i, j) : -1;
  const sm = t => t * t * (3 - 2 * t), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; const XW = {};
  for (let k = 0; k < N * N; k++) if (BIO[k] === B) { const i = k % N, j = Math.floor(k / N); x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); if (XW[j] === undefined || i < XW[j]) XW[j] = i; }
  // ---------------------------------------------------------------- 0. purge the old pilot
  const hqsTile = (i, j) => inB(Math.floor(i), Math.floor(j));
  TWM.props = TWM.props.filter(p => !hqsTile(p.i, p.j)); TWM.pois = TWM.pois.filter(p => p.biome !== 'hqs'); TWM.lights = TWM.lights.filter(l => l.biome !== 'hqs'); TWM.falls = TWM.falls.filter(f => f.biome !== 'hqs'); TWM.decals = TWM.decals.filter(d => !hqsTile(d.i, d.j));
  TWM.water = TWM.water.filter(w => w.type === 'sea' || !(w.c ? hqsTile(w.c[0], w.c[1]) : w.pts ? hqsTile(w.pts[0][0], w.pts[0][1]) : false));
  for (const key of [...TWM.stairs.keys()]) { const [a, b] = key.split(',').map(Number); if (BIO[a] === B || BIO[b] === B) TWM.stairs.delete(key); }
  for (const key of [...TWM.stairAt.keys()]) if (BIO[key] === B) TWM.stairAt.delete(key);
  const F = TWM.hqs = Object.assign(TWM.hqs || {}, { B, x0, y0, x1, y1, tiles: [], stream: [], path: [], pads: {}, flags: [], lamps: [], drums: [], fallX: [72, 76], fallI: 72, mB: 8, pool: [77, 14.3], gate: [91, 36], failed: [] });
  TWM.layout.hqs = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  const isWater = k => MAT[k] === M.STREAM || MAT[k] === M.POOL, FIX = new Uint8Array(N * N), WALLK = new Uint8Array(N * N);
  // ---------------------------------------------------------------- 1. height field
  const SEA_X = 98;
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { if (!inB(i, j)) continue; const k = id(i, j); F.tiles.push(k); PATHC[k] = 0; RES[k] = 0;
    const dN = j - 1, dW = j <= 27 ? i - XW[j] : 99, d = Math.min(dN, dW), n1 = vnoise(i * 0.3, j * 0.3, 801), n2 = vnoise(i * 0.9, j * 0.9, 802);
    let lv = 3 + 10 * Math.pow(clamp(1 - d / 10, 0, 1), 1.3) + (n1 - 0.5) * 2.4;
    // the great back wall: two tiers across x 62..86
    if (j <= 7 && i >= 62 && i <= 86) { const tap = clamp((Math.abs(i - 74) - 10) / 3, 0, 1), top = j <= 4 ? 13 : 11; lv = top * (1 - tap) + lv * tap + (n2 - 0.5) * 1.4; if (tap === 0) WALLK[k] = 1; }
    if (i >= 88 && j <= 14) lv = Math.max(lv, 4 + (14 - j) * 0.45 + (n1 - 0.5) * 2);
    if (i >= 94) lv = j < 12 ? Math.max(2, 7 - (i - 93) * 1.2) : 1;                      // headland / beach
    H[k] = clamp(Math.round(lv), 1, 14); MAT[k] = M.FLAWN; }
  const ell = (ca, cb, ra, rb, fn, pw) => { pw = pw || 2; for (let b = Math.floor(cb - rb - 2); b <= cb + rb + 2; b++) for (let a = Math.floor(ca - ra - 2); a <= ca + ra + 2; a++) { const d = (Math.abs(a - ca) / ra) ** pw + (Math.abs(b - cb) / rb) ** pw, k = tile(a, b); if (k >= 0) fn(k, d, a, b); } };
  const flat = (ca, cb, ra, rb, lv, pw) => ell(ca, cb, ra, rb, (k, d) => { if (isWater(k) || FIX[k]) return; if (d < 1) H[k] = lv; else if (d < 1.9) H[k] = Math.round(lv + (H[k] - lv) * sm((d - 1) / 0.9)); }, pw);
  const PADS = { SPR: [74.5, 3, 6.5, 2.2, 13, 4], COURT: [88, 22.5, 6.2, 3.8, 3, 4], DAIS: [88, 17.2, 4.2, 2, 5, 4], VILL: [93.5, 10.5, 3.6, 3.4, 6, 4], SUMMIT: [91, 4.2, 2.4, 1.9, 10, 4],
    TRAIN: [80, 26.5, 4.2, 2.8, 2, 4], OR1: [65, 16, 3.2, 2.8, 5, 4], OR2: [64.5, 22.5, 3.2, 2.6, 4, 4], OR3: [70, 27, 3.4, 2.2, 3, 4], DEPOT: [72.5, 20.5, 1.8, 1.5, 3, 4],
    CLOUD: [74, 31.5, 3.2, 2.2, 3, 4], GATEP: [93, 34.6, 3.8, 2.4, 1, 4], PIER: [96.5, 26, 1.8, 2.4, 1, 4] };
  F.pads = PADS;
  for (const key of ['SPR', 'VILL', 'SUMMIT', 'OR1', 'OR2', 'OR3', 'DEPOT', 'CLOUD', 'COURT', 'DAIS', 'TRAIN', 'GATEP', 'PIER']) flat(...PADS[key]);
  // the foot ledge under the great wall (L3): cave mouths either side of the fall
  for (let i = 62; i <= 86; i++) { const k = tile(i, 8); if (k >= 0) { H[k] = 3; FIX[k] = 1; WALLK[k] = 0; } }
  for (const [ca, cb] of [[66, 9], [84, 9], [60, 9]]) void ca, void cb;
  // ---------------------------------------------------------------- 2. water
  const seg = SP => { const tiles = []; for (let n = 0; n < SP.length - 1; n++) { let [a, b, l0] = SP[n]; const [a1, b1, l1] = SP[n + 1], sg = []; while (a !== a1 || b !== b1) { sg.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); } sg.forEach(([qa, qb], t) => tiles.push([qa, qb, Math.round(l0 + (l1 - l0) * t / Math.max(1, sg.length))])); } const l = SP[SP.length - 1]; tiles.push([l[0], l[1], l[2]]); return tiles; };
  const water = (a, b, lv, mat) => { const k = tile(a, b); if (k < 0) return; MAT[k] = mat || M.STREAM; H[k] = lv; FIX[k] = 1; WALLK[k] = 0; if (!F.stream.includes(k)) F.stream.push(k); };
  const rect = (a0, b0, a1, b1) => { const o = []; for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) o.push([a, b]); return o; };
  // great fall (x 73..75): plateau stream y 3..7 at L13, landing at y 8..9 at L3; flanking falls at x 69 (L11 -> 3) and x 80
  for (let b = 3; b <= 7; b++) for (const a of [72, 73, 74, 75, 76]) water(a, b, 13);
  for (const a of [72, 73, 74, 75, 76]) { water(a, 8, 3); water(a, 9, 3); }
  for (const [a, b, lv] of seg([[71, 3, 13], [69, 3, 12], [69, 7, 11]])) water(a, b, lv); for (const [a, b] of [[69, 8], [69, 9], [69, 10], [69, 11], [69, 12], [70, 12]]) water(a, b, 3);
  for (const [a, b, lv] of seg([[77, 3, 13], [80, 3, 12], [80, 7, 11]])) water(a, b, lv); for (const [a, b] of [[80, 8], [80, 9], [80, 10]]) water(a, b, 3);
  for (const [a, b] of rect(72, 2, 76, 3)) water(a, b, 13, M.POOL);                                                      // the spring lake on the plateau
  // the lake at the foot
  ell(77, 14.3, 7.4, 5.2, (k, d) => { if (d < 1) { MAT[k] = M.POOL; H[k] = 3; FIX[k] = 1; WALLK[k] = 0; if (!F.stream.includes(k)) F.stream.push(k); } });
  ell(77, 14.3, 7.4, 5.2, (k, d) => { if (d >= 1 && d < 1.7 && !isWater(k) && !FIX[k]) { H[k] = 3; } });
  // bathing pool (L2) in the orchard and the outflow to the sea
  for (const [a, b] of rect(68, 23, 70, 24)) water(a, b, 2, M.POOL);
  for (const [a, b, lv] of seg([[72, 19, 3], [72, 22, 3], [71, 23, 2], [70, 23, 2]])) water(a, b, lv);
  for (const [a, b, lv] of seg([[68, 25, 2], [68, 26, 1], [70, 29, 1], [80, 29, 1], [90, 29, 1], [SEA_X - 1, 29, 1]])) water(a, b, lv);
  for (const [a, b, lv] of seg([[68, 24, 2], [68, 25, 2]])) water(a, b, lv);
  F.pools = { lake: [77, 14.3], bath: [69.5, 23.5], spring: [74.5, 2.8] };
  // everything beside water stays at least as high as the water (no leaks), except the fall landings
  for (const k of F.stream) { const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + da, j + db)) continue; const q = id(i + da, j + db); if (!isWater(q) && H[q] < H[k] && !(j >= 8 && i >= 62 && i <= 86 && db === -1)) H[q] = H[k]; } }
  // the east coast: sea and beach
  for (const k of F.tiles) { const i = k % N; if (i >= SEA_X) { MAT[k] = M.SEA; H[k] = 1; FIX[k] = 1; } }
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); if (j >= 12 && i >= 94 && i < SEA_X && MAT[k] !== M.STREAM) { MAT[k] = M.SAND; H[k] = 1; FIX[k] = 1; } }
  // ---------------------------------------------------------------- 3. materials
  const slope = k => { let s = 0; const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + da, j + db)) continue; const q = id(i + da, j + db); if (BIO[q] !== B && MAT[q] !== M.VOID) continue; s = Math.max(s, Math.abs(H[q] - H[k])); } return s; };
  // ---------------------------------------------------------------- 4. relax: cliffs of two levels at most (one in the valley), then routes
  const relax = () => { for (let pass = 0; pass < 80; pass++) { let ch = 0; for (const k of F.tiles) { if (FIX[k]) continue; const i = k % N, j = Math.floor(k / N), lim = H[k] >= 7 ? 2 : 1; let lo = -9, hi = 99; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + a, j + b)) continue; const h = H[id(i + a, j + b)]; lo = Math.max(lo, h - lim); hi = Math.min(hi, h + lim); } const v = lo <= hi ? clamp(H[k], lo, hi) : Math.round((lo + hi) / 2); if (v !== H[k]) { H[k] = v; ch++; } } if (!ch) break; } };
  for (const k of F.tiles) if (WALLK[k]) FIX[k] = 1;
  for (const key of ['SPR', 'SUMMIT', 'VILL', 'COURT', 'DAIS', 'TRAIN', 'OR1', 'OR2', 'OR3', 'DEPOT', 'CLOUD', 'GATEP', 'PIER']) { const p = PADS[key]; ell(p[0], p[1], p[2], p[3], (k, d) => { if (d < 1 && !isWater(k)) FIX[k] = 1; }, p[5]); }
  relax();
  // routes
  const arc = pts => { const t = []; for (let n = 0; n < pts.length - 1; n++) { let [a, b] = pts[n]; const [a1, b1] = pts[n + 1]; while (a !== a1 || b !== b1) { t.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); } } t.push(pts[pts.length - 1].slice()); return t; };
  const route = (pts, mat, lvOf) => {
    const tiles = arc(pts), gap = t => { const k = tile(...tiles[t]); return k >= 0 && isWater(k); };
    const lv = tiles.map(([a, b]) => { const k = tile(a, b); return k >= 0 ? H[k] : 0; });
    if (lvOf) tiles.forEach((p, t) => { const v = lvOf(p, t, tiles.length); if (v !== undefined) lv[t] = v; });
    for (let pass = 0; pass < 3; pass++) { for (let t = 1; t < lv.length; t++) { if (gap(t) || gap(t - 1)) continue; if (lv[t] - lv[t - 1] > 1) lv[t] = lv[t - 1] + 1; if (lv[t] - lv[t - 1] < -1) lv[t] = lv[t - 1] - 1; } for (let t = lv.length - 2; t >= 0; t--) { if (gap(t) || gap(t + 1)) continue; if (lv[t] - lv[t + 1] > 1) lv[t] = lv[t + 1] + 1; if (lv[t] - lv[t + 1] < -1) lv[t] = lv[t + 1] - 1; } }
    let last = null; for (let t = 0; t < tiles.length; t++) { const k = tile(...tiles[t]); if (k < 0) { last = null; continue; } if (gap(t)) { H[k] = last !== null ? last : H[k]; } else if (!FIX[k] || !lvOf || true) { if (!(FIX[k] && MAT[k] === M.SAND)) H[k] = lv[t]; last = lv[t]; } FIX[k] = 1; }
    carvePath(pts, mat || M.FPATH, 'hqs');
    for (const [a, b] of tiles) { const k = tile(a, b); if (k >= 0) F.path.push(k); }
  };
  route([[91, 37], [91, 34], [90, 31], [88, 28], [88, 26]], M.FPATH);                                  // the Huaguo gate -> plaza
  route([[88, 19], [88, 18]], M.FPLAZA);                                                                // plaza -> dais
  route([[84, 24], [81, 26]], M.FPATH);
  route([[94, 21], [95, 18], [95, 14], [94, 12]], M.FPATH);                                             // up to the village terrace
  route([[93, 8], [92, 6], [91, 5]], M.FPATH);                                                           // village -> statue summit
  route([[85, 21], [85, 16], [85, 11], [83, 8], [78, 8]], M.FPATH);                                      // east shore of the lake -> east cave mouth
  route([[78, 21], [72, 21], [67, 18], [64, 14], [65, 10], [68, 8], [71, 8]], M.FPATH);                  // west shore -> west cave mouth
  route([[69, 26], [66, 24], [66, 20], [66, 17]], M.FPATH);                                              // orchard terraces
  route([[76, 26], [71, 26]], M.FPATH);
  route([[80, 28], [76, 30], [74, 31]], M.FPATH);                                                        // the cloud-sea lookout
  route([[94, 34], [96, 30], [96, 26]], M.FPATH);                                                        // the beach path
  route([[90, 28], [90, 12], [93, 12]], M.FPATH);
  route([[91, 5], [88, 4], [84, 4], [82, 4], [78, 4], [71, 4]], M.FPATH);                              // the mountain trail up to the source (a rope bridge over the east flank)                                                        // village avenue from the south meadow
  relax();
  // stairs on every one-level edge between walkable ground (the mountain wall itself keeps its cliffs)
  F.stairs = 0; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [0, 1]]) { if (!inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (Math.abs(H[k] - H[z]) !== 1 || isWater(k) || isWater(z) || MAT[k] === M.SEA || MAT[z] === M.SEA || Math.max(H[k], H[z]) > 9 || TWM.stairs.has(k + ',' + z)) continue; TWM.stairs.set(k + ',' + z, 1); TWM.stairs.set(z + ',' + k, 1); F.stairs++; } }
  // materials by height and slope
  const GROVE = (i, j) => i <= 75 && j >= 10 && j <= 29;
  for (const k of F.tiles) { if (isWater(k) || MAT[k] === M.SEA || MAT[k] === M.SAND || MAT[k] === M.BRIDGE) continue; const i = k % N, j = Math.floor(k / N), h = H[k], n0 = vnoise(i * 0.3, j * 0.3, 803), n1 = vnoise(i * 0.8, j * 0.8, 804), s = slope(k);
    MAT[k] = (s >= 2 && h >= 4) || (h >= 11 && WALLK[k]) || (h >= 8 && n0 > 0.5 && s >= 1) ? M.FROCK : (h >= 6 && n0 > 0.35) || (n1 > 0.9 && h >= 4) ? M.FMOSS : GROVE(i, j) && n0 > 0.3 ? M.FBLOSS : M.FLAWN; }
  const paint = (p, mat, rim) => ell(p[0], p[1], p[2], p[3], (k, d) => { if (d < rim && !isWater(k) && MAT[k] !== M.SAND) MAT[k] = mat; }, p[5]);
  for (const key of ['COURT', 'DAIS', 'TRAIN', 'SUMMIT', 'GATEP', 'DEPOT', 'CLOUD', 'VILL']) paint(PADS[key], M.FPLAZA, key === 'VILL' ? 0.55 : 0.95);
  for (const k of F.path) if (MAT[k] !== M.BRIDGE && !isWater(k) && MAT[k] !== M.FPLAZA && MAT[k] !== M.SAND) MAT[k] = M.FPATH;
  for (const [a, b] of rect(86, 19, 90, 19)) { const k = tile(a, b); if (k >= 0 && MAT[k] === M.FPLAZA) { /* stair landing */ } }
  // ---------------------------------------------------------------- 5. decals / records
  // Thủy Liêm Động: the cave arch behind the curtain is painted by tw-hqs-art.js (face of the fall tiles, row 7)
  TWM.falls.push({ biome: 'hqs', i: 72, j: 7, w: 5, top: 13, bottom: 3, cave: true, trans: 0.5 });
  Object.assign(F, { throne: [88, 15], court: [88.5, 22.5], shrine: [66, 16], lookout: [91, 4], lake: [77, 14.3], spring: [74.5, 2.8], village: [93.5, 10.5], train: [80, 26.5], cloud: [74, 31.5], depot: [72.5, 20.5], cave: [74.5, 7.5], plaza: [88.5, 22.5], summit: [91, 4.2], beach: [96, 26], orchard: [66, 20] });
  // ---------------------------------------------------------------- 6. props and posts
  const P = (kind, a, b, o) => { if (!inB(a, b)) return null; const k = id(a, b); if (isWater(k) || MAT[k] === M.SEA) return null; if (o && o.block) { const fw = o.fp ? o.fp[0] : 1, fh = o.fp ? o.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) { const z = id(a + r, b + q); if (z >= N * N || PATHC[z] || isWater(z) || MAT[z] === M.BRIDGE || BIO[z] !== B || MAT[z] === M.SEA) return null; } } return prop(kind, a, b, o); };
  const L1 = (kind, a, b, o) => { let p = P(kind, a, b, o); if (!p) for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [0, 2], [-2, 0], [0, -2]]) { p = P(kind, a + da, b + db, o); if (p) break; } if (!p) F.failed.push(kind + '@' + a + ',' + b); return p; };
  const blockedAt = new Set(); const rebuildBlocked = () => { blockedAt.clear(); for (const p of TWM.props) if (p.block && p.biome === 'hqs') { const fw = p.fp ? p.fp[0] : 1, fh = p.fp ? p.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) blockedAt.add(id(p.i + r, p.j + q)); } };
  const snap = (a, b, r) => { for (let q = 0; q <= (r === undefined ? 2 : r); q++) for (let dj = -q; dj <= q; dj++) for (let di = -q; di <= q; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== q) continue; const k = tile(a + di, b + dj); if (k >= 0 && !isWater(k) && MAT[k] !== M.SEA && MAT[k] !== M.BRIDGE && MAT[k] !== M.FROCK && !blockedAt.has(k)) return [a + di, b + dj]; } return null; };
  const Q = (kind, a, b, o) => { rebuildBlocked(); const s = snap(a, b, 2); if (!s) { F.failed.push('poi:' + kind + '@' + a + ',' + b); return null; } const p = poi(kind, 'hqs', s[0], s[1], o); if (p) RES[id(s[0], s[1])] = 1; return p; };
  const LT2 = (a, b, r, col, kind) => TWM.lights.push({ biome: 'hqs', i: a, j: b, r, col, kind: kind || 'lantern' });
  // landmarks
  L1('throne', 88, 15, { fp: [2, 1], block: true }); L1('banner', 85, 17, { v: 0 }); L1('banner', 91, 17, { v: 1 }); L1('drum', 86, 19, { fp: [1, 1], block: true }); L1('drum', 90, 19, { fp: [1, 1], block: true }); F.drums.push([86, 19], [90, 19]);
  L1('medallion', 88, 22, { block: false, flat: true });
  for (const [a, b] of [[82, 20], [94, 21], [84, 25], [92, 25]]) { L1('hflag', a, b, { block: true, v: (a + b) & 1 }); F.flags.push([a, b]); }
  L1('hlantern', 85, 22, { fp: [1, 1], v: 0, block: true }); L1('hlantern', 91, 22, { fp: [1, 1], v: 1, block: true }); LT2(85, 22, 56, '255,196,120'); LT2(91, 22, 56, '255,196,120'); LT2(88, 16, 90, '255,210,130', 'lantern');
  for (const [a, b, f] of [[83, 21, 'right'], [93, 24, 'left']]) { L1('table', a + (f === 'right' ? 1 : -1), b + (f === 'right' ? 1 : 1), { block: true }); }
  L1('hshrine', 66, 3, { fp: [2, 2], v: 0, block: true });                                           // a hermit's shrine on the plateau
  L1('hstatue', 91, 3, { fp: [1, 1], v: 0, block: true });                                           // Tề Thiên Đại Thánh: one statue, on the summit
  L1('hpavilion', 73, 30, { fp: [2, 2], v: 0, block: true });                                        // the cloud-sea lookout pavilion
  L1('hhall', 63, 14, { fp: [3, 3], v: 0, block: true });                                            // elders' hall on the orchard terrace
  for (const [a, b, v] of [[92, 9, 0], [96, 9, 1], [95, 13, 2], [91, 13, 1]]) { L1('hhut', a, b, { fp: [2, 2], v, block: true }); }   // the monkey village
  L1('hplay', 78, 22, { fp: [2, 2], block: true });                                                  // the playground by the lake
  for (const [a, b] of [[77, 25], [77, 28], [83, 25]]) { if (L1('dummy', a, b, { block: true })) Q('dummy', a - 1, b, { face: 'right', target: [a, b] }); }
  L1('rack', 83, 28, { block: true }); L1('rack', 84, 28, { block: true });
  L1('hcrate', 72, 20, { fp: [1, 1], v: 0, block: true }); L1('hcrate', 73, 21, { fp: [1, 1], v: 1, block: true }); L1('basket', 71, 21, { block: false }); L1('basket', 74, 21, { block: false });   // the fruit depot
  L1('hpavilion', 70, 21, { fp: [2, 2], v: 1, block: true });
  L1('harch', 91, 36, { fp: [1, 1], v: 0, block: false });                                           // the Huaguo gate (a natural rock arch)
  L1('hboat', 97, 27, { fp: [1, 1], block: false });
  for (const [a, b, v] of [[69, 20, 0], [70, 26, 1]]) L1('hlotus', a, b, { fp: [1, 1], v, block: false });
  LT2(74, 8, 120, '170,230,255', 'magic'); LT2(88, 20, 150, '255,214,150', 'lantern'); LT2(74, 31, 70, '255,206,140'); LT2(93, 11, 90, '255,196,120', 'lantern'); LT2(90, 4, 80, '255,220,150', 'lantern');
  // monkey posts
  Q('throne', 88, 16, { face: 'down', seat: true, cap: 1 }); Q('court', 88, 22, { cap: 40 });
  Q('lookout', 91, 5, { cap: 4, face: 'up' }); Q('lookout', 74, 31, { cap: 4, face: 'up' }); Q('lookout', 95, 9, { cap: 3, face: 'right' }); Q('lookout', 62, 10, { cap: 3, face: 'up' });
  Q('pray', 91, 4, { face: 'up', cap: 4 }); Q('pray', 66, 16, { face: 'up', cap: 4 }); Q('pray', 70, 4, { face: 'up', cap: 3 }); Q('lookout', 78, 4, { cap: 3, face: 'down' });
  for (const [a, b, f] of [[92, 11, 'up'], [96, 11, 'up'], [95, 15, 'up'], [91, 15, 'up']]) Q('hut', a, b, { cap: 3, face: f });
  Q('play', 77, 23, { cap: 5, face: 'right' }); Q('elder_seat', 64, 17, { face: 'right', seat: true }); Q('elder_seat', 74, 21, { face: 'up', seat: true });
  Q('cave', 71, 8, { cap: 4, face: 'right' }); Q('cave', 77, 8, { cap: 4, face: 'left' });
  for (const [a, b] of [[96, 27], [96, 29], [95, 24]]) Q('fish', a, b, { face: 'right', cap: 1 });
  Q('stall', 72, 22, { cap: 3, face: 'up' }); Q('stall', 73, 20, { cap: 3, face: 'up' });                    // the depot is where baskets are loaded and sorted
  for (const [a, b, f] of [[83, 22, 'right'], [85, 22, 'left'], [84, 21, 'down'], [84, 23, 'up'], [92, 23, 'right'], [94, 23, 'left'], [93, 22, 'down'], [93, 24, 'up']]) Q('seat', a, b, { face: f, seat: true, group: 'table' });
  Q('hdrum', 86, 20, { cap: 2, face: 'right' }); Q('hdrum', 90, 20, { cap: 2, face: 'left' }); Q('hsweep', 80, 21, { cap: 2, face: 'down' }); Q('hsweep', 90, 25, { cap: 2, face: 'down' });
  Q('hspar', 79, 27, { cap: 4, face: 'right' }); Q('hspar', 82, 27, { cap: 4, face: 'left' }); Q('hspar', 80, 25, { cap: 4, face: 'down' });
  Q('hdrink', 71, 12, { cap: 2, face: 'right' }); Q('hdrink', 80, 18, { cap: 2, face: 'up' }); Q('hdrink', 68, 22, { cap: 2, face: 'right' }); Q('hdrink', 94, 28, { cap: 2, face: 'right' });
  Q('hbath', 67, 23, { cap: 3, face: 'right' }); Q('hbath', 71, 24, { cap: 3, face: 'left' });
  Q('hgraze', 85, 30, { cap: 2, face: 'down' }); Q('hgraze', 78, 29, { cap: 2, face: 'down' }); Q('hgraze', 92, 30, { cap: 2, face: 'down' });
  for (const [a, b] of [[72, 19], [78, 20], [83, 12], [67, 12]]) Q('hstone', a, b, { cap: 2, face: 'up' });
  // peach terraces: rows of big peach trees, each with a picking post
  const bp = [];
  for (const [ca, cb, ra, rb] of [[66.5, 16, 3, 2.2], [65.5, 22.5, 3.3, 2.2], [70, 27, 3, 1.6], [68, 12, 2.6, 1.6]]) for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const a = Math.round(ca - ra + c * (2 * ra / 3) + (r & 1)), b = Math.round(cb - rb + r * rb); const p = L1('bigpeach', a, b, { v: r * 4 + c, block: true }); if (p) { bp.push([p.i, p.j]); Q('tree', p.i, p.j + 1, { face: 'up', tree: [p.i, p.j], cap: 1 }); } }
  F.peaches = bp;
  // ---------------------------------------------------------------- 7. scatter: forests by height, moisture and light
  const nearWater = (a, b, r) => { for (const s of F.stream) { if (Math.abs((s % N) - a) + Math.abs(Math.floor(s / N) - b) < r) return true; } return false; };
  for (let n = 0; n < 1500; n++) { const a = x0 + Math.floor(R() * (x1 - x0 + 1)), b = y0 + Math.floor(R() * (y1 - y0 + 1)), k = tile(a, b); if (k < 0 || RES[k] || PATHC[k] || isWater(k) || MAT[k] === M.FPLAZA || MAT[k] === M.SEA || MAT[k] === M.BRIDGE || MAT[k] === M.SAND && R() < 0.8) continue;
    const m = MAT[k], h = H[k], r = R(), g = GROVE(a, b), nw = nearWater(a, b, 5); let kind;
    if (MAT[k] === M.SAND) kind = r < 0.5 ? 'shell' : 'hrock'; else if (h >= 10) kind = r < 0.5 ? 'hpine' : r < 0.78 ? 'hrock' : 'hmaple'; else if (m === M.FROCK) kind = r < 0.35 ? 'hrock' : r < 0.6 ? 'hpine' : r < 0.8 ? 'hmaple' : 'hbush';
    else if (g) kind = r < 0.3 ? 'bigpeach' : r < 0.5 ? 'hflower' : r < 0.64 ? 'hbush' : r < 0.74 ? 'hmaple' : r < 0.84 ? 'htree' : 'hrock'; else if (nw) kind = r < 0.2 ? 'hwillow' : r < 0.45 ? 'bigbamboo' : r < 0.65 ? 'hbush' : r < 0.85 ? 'hflower' : 'hrock';
    else if (h >= 6) kind = r < 0.25 ? 'hmaple' : r < 0.45 ? 'hpine' : r < 0.6 ? 'htree' : r < 0.75 ? 'hbush' : r < 0.85 ? 'bigpeach' : 'hflower'; else kind = r < 0.2 ? 'htree' : r < 0.32 ? 'hmaple' : r < 0.44 ? 'bigpeach' : r < 0.6 ? 'hbush' : r < 0.82 ? 'hflower' : r < 0.9 ? 'hwillow' : 'hrock';
    if (Math.hypot(a - 75, (b - 12) * 1.2) < 6 && !nw) continue;
    const big = kind !== 'hflower' && kind !== 'hbush' && kind !== 'shell'; const p = P(kind, a, b, { fp: [1, 1], v: n & 7, block: big }); if (p && kind === 'bigpeach' && R() < 0.5) Q('tree', a, b + 1, { face: 'up', tree: [a, b], cap: 1 }); }
  // ---------------------------------------------------------------- 8. the kingdom meets the world: outward band, near-field, homes
  F.out = [];
  // west and south-west (Bạch Cốt Lĩnh / Cao Lão Trang placeholders): the range runs on as foothills that step down from the rim (pine, maple, moss); east (Lôi Âm Tự placeholder): the Đông Hải runs on and ends in a beach
  const dOut = new Map(), hOut = new Map(); { const q = []; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] !== M.VOID && !dOut.has(z)) { dOut.set(z, 1); hOut.set(z, H[k]); q.push(z); } } }
    for (let h = 0; h < q.length; h++) { const k = q[h], d = dOut.get(k); if (d >= 12) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] === M.VOID || TWM.biomes[BIO[z]].built || dOut.has(z)) continue; dOut.set(z, d + 1); hOut.set(z, hOut.get(k)); q.push(z); } } }
  for (const [k, d] of dOut) { if (TWM.biomes[BIO[k]].built || RES[k] || MAT[k] < M.PH || MAT[k] >= M.HROCK) continue; const i = k % N, j = Math.floor(k / N), r = hash2(i, j, 811), n = vnoise(i * 0.4, j * 0.4, 812), east = BIO[k] === TWM.bi.lat;
    if (east) { if (d <= 9) { MAT[k] = M.SEA; H[k] = 1; F.out.push(k); } else if (d <= 11) { MAT[k] = M.SAND; H[k] = 1; F.out.push(k); } continue; }
    const p = Math.pow(1 - (d - 1) / 11.5, 0.7); if (r > p + 0.08) continue;
    H[k] = clamp(Math.round(hOut.get(k) - d * 1.15 + (n - 0.5) * 1.6), 1, 13); MAT[k] = H[k] >= 6 && n > 0.45 ? M.FROCK : n > 0.5 ? M.FMOSS : M.FLAWN; F.out.push(k);
    if (d <= 9 && r < 0.42 && !PATHC[k]) prop(r < 0.1 ? 'hrock' : r < 0.24 ? 'hpine' : r < 0.34 ? 'hmaple' : r < 0.38 ? 'bigpeach' : 'hpine', i, j, { fp: [1, 1], v: Math.floor(r * 997) & 7, block: true }); }
  { const near = TWM.hqsNear = new Uint8Array(N * N), q = [], dl = new Int16Array(N * N).fill(-1);
    for (const k of F.tiles) { near[k] = 1; dl[k] = 0; q.push(k); }
    for (let h = 0; h < q.length; h++) { const k = q[h]; if (dl[k] >= 8) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b)) continue; const z = id(i + a, j + b); if (dl[z] >= 0) continue; if (BIO[z] !== B && TWM.biomes[BIO[z]].built) continue; dl[z] = dl[k] + 1; near[z] = 1; q.push(z); } }
    for (const nm of ['lionNear', 'fireNear', 'tthNear', 'hpsNear', 'nhsNear', 'ntqNear']) if (TWM[nm]) for (let k = 0; k < N * N; k++) if (near[k] && TWM[nm][k] && BIO[k] !== B) near[k] = 0; }
  TWM.homes = TWM.homes || {}; TWM.homes.hqs = { deer: [82, 30], rabbit: [86, 28], crane: [75, 13] };
};
window.TW_HQS_FINAL = function (X) {   // drop any post the walk graph cannot reach
  const { TWM, id, N } = X, F = TWM.hqs, B = F.B, st = id(91, 36), seen = new Uint8Array(N * N), q = [st]; seen[st] = 1;
  for (let n = 0; n < q.length; n++) { const k = q[n], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (!seen[z] && TWM.BIO[z] === B && TWM.canStep(k, z)) { seen[z] = 1; q.push(z); } } }
  F.reach = seen; const before = TWM.pois.length; F.dropped = [];
  TWM.pois = TWM.pois.filter(p => { if (p.biome !== 'hqs') return true; if (p.kind === 'wall') return true; const k = id(Math.floor(p.x / 8), Math.floor(p.y / 8)); if (!seen[k]) F.dropped.push(p.kind + '@' + p.i + ',' + p.j); return seen[k]; }); F.droppedPois = before - TWM.pois.length;
};
if (typeof module !== 'undefined') module.exports = {};
