'use strict';
// ===== Tây Du Ký v2 — Ngũ Trang Quán (Wuzhuang Temple, the Daoist monastery of the Ginseng Fruit Tree): map build (world space; loaded before tw-map.js) =====
// The planner region of `ntq` (654 tiles: a block x 91-122 / y 36-48 with a north tip to y 30 and a west bulge to x 84) is flagged built by tw-layout.js and authored here.
// ONE axial garden-monastery climbing from the south-east gate to the back: the axis runs straight up the screen (x - y = 70, "w" = lateral offset, "n" = 165 - (x + y) = depth):
//   gate court (level 3) -> forecourt with the lotus pond (4) -> herb terrace (5) -> the Ginseng Court around the colossal tree (6) -> stairs up to the hall terrace (10) -> the spring behind it (11-13);
//   a spring stream cascades down the east side into the lotus pond, whose outflow pours over the world rim; a second pond and a cascade feed the herb gardens on the west; a lookout terrace on the east bluff;
//   the west road runs through bamboo and herb beds down to the Huaguo door (hqs) at (91, 38); the gate road meets Ngũ Hành Sơn's north road at (119, 50).
window.TW_NTQ_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, prop, poi, id, inMap, vnoise, hash2, carvePath, mulberry32 } = X;
  const B = TWM.bi.ntq, R = mulberry32(20261203);
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let k = 0; k < N * N; k++) if (BIO[k] === B) { const i = k % N, j = Math.floor(k / N); x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  const inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B, tile = (i, j) => inB(i, j) ? id(i, j) : -1;
  const sm = t => t * t * (3 - 2 * t), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const F = TWM.ntq = { B, x0, y0, x1, y1, tiles: [], stream: [], falls: [], path: [], pads: {}, lamps: [], posts: {}, T: [109, 43], HALL: [105, 35], gate: [118, 47] };
  TWM.layout.ntq = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  const isWater = k => MAT[k] === M.STREAM || MAT[k] === M.POOL, FIX = new Uint8Array(N * N);
  // ---------------------------------------------------------------- 1. height field: axial terraces (n = depth, w = lateral), the west falls away toward the Huaguo door
  const LT = [[-9, 3], [2, 3], [3, 4], [5, 4], [6, 5], [8, 5], [9, 6], [19, 6], [20, 7], [21, 8], [22, 9], [23, 10], [30, 10], [31, 11], [33, 12], [40, 13]];
  const Lax = n => { if (n <= LT[0][0]) return LT[0][1]; for (let q = 0; q < LT.length - 1; q++) if (n <= LT[q + 1][0]) return LT[q][1] + (LT[q + 1][1] - LT[q][1]) * (n - LT[q][0]) / (LT[q + 1][0] - LT[q][0]); return LT[LT.length - 1][1]; };
  const nOf = (x, y) => 165 - (x + y), wOf = (x, y) => (x - y) - 70;
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { if (!inB(i, j)) continue; const k = id(i, j); F.tiles.push(k); const n = nOf(i, j), w = wOf(i, j), na = vnoise(i * 0.35, j * 0.35, 701), nb = vnoise(i * 1.1, j * 1.1, 702);
    const sw = sm(clamp((-w - 4) / 8, 0, 1)), low = 2 + na * 1.6, ax = Lax(n);
    let lv = ax * (1 - sw) + Math.min(ax, low + clamp(-w - 12, 0, 8) * 0.1) * sw; if (Math.abs(w) > 3) lv += (nb - 0.5) * 0.8;
    if (w > 11) lv -= clamp((w - 11) * 0.3, 0, 1.2);                                      // the east bluff leans toward the rim
    H[k] = clamp(Math.round(lv), 1, 14); MAT[k] = M.QLAWN; }
  // ---------------------------------------------------------------- 2. pads
  const ell = (ca, cb, ra, rb, fn, pw) => { pw = pw || 2; for (let b = Math.floor(cb - rb - 2); b <= cb + rb + 2; b++) for (let a = Math.floor(ca - ra - 2); a <= ca + ra + 2; a++) { const d = (Math.abs(a - ca) / ra) ** pw + (Math.abs(b - cb) / rb) ** pw, k = tile(a, b); if (k >= 0) fn(k, d, a, b); } };
  const flat = (ca, cb, ra, rb, lv, pw) => ell(ca, cb, ra, rb, (k, d) => { if (isWater(k)) return; if (d < 1) H[k] = lv; else if (d < 1.9) H[k] = Math.round(lv + (H[k] - lv) * sm((d - 1) / 0.9)); }, pw);
  const COURT = [110, 43, 8, 5.4, 6, 4], HALLP = [105.5, 35.5, 4.4, 3.6, 10, 4], GATEP = [118, 46, 4, 3.2, 3, 4], LOOK = [118.5, 38, 2.4, 2, 6, 4], REAR = [103.5, 31.5, 2.2, 2, 12, 4], PAV = [104.5, 46.8, 2.6, 2.2, 6, 4];
  F.pads = { COURT, HALLP, GATEP, LOOK, REAR, PAV };
  for (const p of [COURT, GATEP, LOOK, HALLP, REAR, PAV]) flat(...p);
  // ---------------------------------------------------------------- 3. neighbours: slope into the built neighbours (never a cliff of more than one level at a shared border where walking is meant to continue)
  { const q = [], dist = new Map();
    for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [0, 1]]) { if (!inMap(i + a, j + b)) continue; const z = id(i + a, j + b); const nb = BIO[z]; if (nb !== B && TWM.biomes[nb].built && MAT[z] !== M.VOID && (nb === TWM.bi.nhs || nb === TWM.bi.hps || nb === TWM.bi.btp)) { dist.set(k, 1); q.push([k, H[z]]); break; } } }
    for (let h = 0; h < q.length; h++) { const [k, lvl] = q[h], d = dist.get(k); H[k] = clamp(H[k], lvl - d, lvl + d); if (d >= 6) continue; const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + da, j + db)) continue; const z = id(i + da, j + db); if (!dist.has(z)) { dist.set(z, d + 1); q.push([z, lvl]); } } } }
  // the Huaguo door: around (91, 38) the ground sits on the monkey kingdom's level
  ell(91, 38.5, 4, 3.2, (k, d) => { if (d < 1) H[k] = 1; else if (d < 2.6) H[k] = Math.min(H[k], Math.round(1 + (H[k] - 1) * sm((d - 1) / 1.6))); }, 2);
  // ---------------------------------------------------------------- 4. water: spring stream S1 (hall -> lotus pond), the pond outflow S2 (over the rim), the west pond P2 + cascade S3
  const SPT = {
    S1: [[105, 32, 11], [108, 32, 10], [110, 33, 10], [110, 35, 9], [111, 36, 8], [112, 37, 7], [113, 38, 6], [115, 38, 6]],
    S2: [[118, 41, 6], [119, 41, 5], [120, 41, 5], [121, 41, 4], [122, 41, 3]],
    S3: [[99, 46, 3], [98, 46, 3], [97, 47, 2], [96, 48, 2], [95, 48, 2]] };
  const seg = SP => { const tiles = []; for (let n = 0; n < SP.length - 1; n++) { let [a, b, l0] = SP[n]; const [a1, b1, l1] = SP[n + 1], sg = []; while (a !== a1 || b !== b1) { sg.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); } sg.forEach(([qa, qb], t) => tiles.push([qa, qb, Math.round(l0 + (l1 - l0) * t / Math.max(1, sg.length))])); } const l = SP[SP.length - 1]; tiles.push([l[0], l[1], l[2]]); return tiles; };
  for (const key of ['S1', 'S2', 'S3']) for (const [a, b, lv] of seg(SPT[key])) { const k = tile(a, b); if (k < 0) continue; MAT[k] = M.STREAM; H[k] = lv; if (!F.stream.includes(k)) F.stream.push(k); }
  const pool = (cells, lv) => { for (const [a, b] of cells) { const k = tile(a, b); if (k >= 0) { MAT[k] = M.POOL; H[k] = lv; if (!F.stream.includes(k)) F.stream.push(k); } } };
  const rect = (a0, b0, a1, b1) => { const o = []; for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) o.push([a, b]); return o; };
  pool(rect(115, 39, 118, 42), 6); pool(rect(100, 45, 102, 47), 3); pool(rect(93, 48, 95, 50), 2); pool(rect(108, 31, 109, 31), 11);   // lotus pond, west pond, lower pond, spring pool behind the hall
  F.pools = { lotus: [116.5, 40.5], west: [101.5, 46.5], low: [94.5, 49.5] };
  for (const k of F.stream) { const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + da, j + db)) continue; const q = id(i + da, j + db); if (!isWater(q) && H[q] < H[k]) H[q] = H[k]; } }
  // ---------------------------------------------------------------- 5. materials: jade lawn, white-jade paving, limestone, golden gravel
  const slope = k => { let s = 0; const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + da, j + db)) continue; const q = id(i + da, j + db); if (BIO[q] !== B) continue; s = Math.max(s, Math.abs(H[q] - H[k])); } return s; };
  for (const k of F.tiles) { if (isWater(k)) continue; const i = k % N, j = Math.floor(k / N), h = H[k], n0 = vnoise(i * 0.3, j * 0.3, 703), n1 = vnoise(i * 0.8, j * 0.8, 704), s = slope(k);
    MAT[k] = s >= 3 || (h >= 11 && n0 > 0.5) ? M.QROCK : (n1 > 0.9 || (n0 > 0.78 && h <= 5)) ? M.QGRAV : M.QLAWN; }
  const paint = (p, mat, rim) => ell(p[0], p[1], p[2], p[3], (k, d) => { if (d < rim && !isWater(k)) MAT[k] = mat; }, p[5]);
  paint(GATEP, M.QPAVE, 0.95); paint(HALLP, M.QPAVE, 0.95); paint(LOOK, M.QPAVE, 0.9); paint(PAV, M.QPAVE, 0.9); paint(REAR, M.QGRAV, 0.8);
  // the Ginseng Court: a paved ring around the lawn that carries the tree
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), d = Math.hypot(i - F.T[0], (j - F.T[1]) * 1.15); if (isWater(k)) continue; if (d < 3.4) { MAT[k] = M.QLAWN; H[k] = 6; FIX[k] = 1; } else if (d < 5.6) { MAT[k] = M.QPAVE; H[k] = 6; FIX[k] = 1; } }
  // the avenue: a three-tile diagonal band of paving (flat across its width, it rises along the axis)
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), n = nOf(i, j), w = wOf(i, j); if (n >= -3 && n <= 26 && Math.abs(w) <= (n >= 1 && n <= 5 ? 3 : 1) && !isWater(k)) { MAT[k] = M.QPAVE; H[k] = Math.round(Lax(n)); FIX[k] = 1; } }
  // ---------------------------------------------------------------- 6. routes
  const arc = pts => { const t = []; for (let n = 0; n < pts.length - 1; n++) { let [a, b] = pts[n]; const [a1, b1] = pts[n + 1]; while (a !== a1 || b !== b1) { t.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); } } t.push(pts[pts.length - 1].slice()); return t; };
  const route = (pts, mat, lvOf) => {
    const tiles = arc(pts), gap = t => { const k = tile(...tiles[t]); return k >= 0 && isWater(k); };
    const lv = tiles.map(([a, b]) => { const k = tile(a, b); return k >= 0 ? H[k] : 0; });
    if (lvOf) tiles.forEach((p, t) => { const v = lvOf(p, t, tiles.length); if (v !== undefined) lv[t] = v; });
    for (let pass = 0; pass < 3; pass++) { for (let t = 1; t < lv.length; t++) { if (gap(t) || gap(t - 1)) continue; if (lv[t] - lv[t - 1] > 1) lv[t] = lv[t - 1] + 1; if (lv[t] - lv[t - 1] < -1) lv[t] = lv[t - 1] - 1; } for (let t = lv.length - 2; t >= 0; t--) { if (gap(t) || gap(t + 1)) continue; if (lv[t] - lv[t + 1] > 1) lv[t] = lv[t + 1] + 1; if (lv[t] - lv[t + 1] < -1) lv[t] = lv[t + 1] - 1; } }
    let last = null; for (let t = 0; t < tiles.length; t++) { const k = tile(...tiles[t]); if (k < 0) { last = null; continue; } if (gap(t)) { H[k] = last !== null ? last : H[k]; } else { H[k] = lv[t]; last = lv[t]; } }
    carvePath(pts, mat || M.QGRAV, 'ntq');
    for (const [a, b] of tiles) { const k = tile(a, b); if (k >= 0 && MAT[k] === M.BRIDGE) MAT[k] = M.PLANK; if (k >= 0) F.path.push(k); }
  };
  // the avenue spine: a zig-zag up the diagonal from the gate (118, 47) to the hall steps; the nhs road arrives at (119, 50)
  { const sp = [[119, 50], [119, 49], [119, 48], [118, 48]]; let a = 118, b = 48; for (let q = 0; q < 28; q++) { a--; sp.push([a, b]); b--; sp.push([a, b]); if (a + b <= 143) break; } while (sp[sp.length - 1][1] < 37) sp.pop(); F.spine = sp.slice(); route(sp, M.QPAVE, p => (p[1] >= 49 ? 3 : Math.round(Lax(nOf(p[0], p[1])))));
    for (const [a2, b2] of sp) { const k = tile(a2, b2); if (k >= 0 && !isWater(k)) MAT[k] = M.QPAVE; } }
  F.gate = [118, 47];
  route([[104, 43], [100, 43], [97, 42], [94, 40], [92, 39], [91, 38]], M.QGRAV, (p, t, n) => Math.max(1, Math.round(6 - 5 * t / (n - 1))));                // west road to the Huaguo door
  route([[116, 44], [120, 44], [120, 39]], M.QGRAV);
  route([[120, 39], [120, 36], [121, 36]], M.QGRAV, (p, t) => [6, 5, 4, 3, 2][t] === undefined ? 2 : [6, 5, 4, 3, 2][t]);                              // down the north-east corner to the gate onto the lowland (lat)                                                                                        // east bluff trail to the lookout
  route([[107, 38], [102, 38], [102, 35]], M.QGRAV);                                                                                        // up the hall's west side to the spring
  // ---------------------------------------------------------------- 6b. relax: unfixed ground never differs by more than one level from a neighbour (so every terrace edge can carry a stair), then one stair on every one-level edge
  for (const k of F.tiles) if (isWater(k) || PATHC[k]) FIX[k] = 1;
  for (const p of [COURT, GATEP, LOOK, HALLP, REAR, PAV]) ell(p[0], p[1], p[2], p[3], (k, d) => { if (d < 1) FIX[k] = 1; }, p[5]);
  for (let pass = 0; pass < 80; pass++) { let ch = 0; for (const k of F.tiles) { if (FIX[k]) continue; const i = k % N, j = Math.floor(k / N); let lo = -9, hi = 99; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + a, j + b)) continue; const h = H[id(i + a, j + b)]; lo = Math.max(lo, h - 1); hi = Math.min(hi, h + 1); } const v = lo <= hi ? clamp(H[k], lo, hi) : Math.round((lo + hi) / 2); if (v !== H[k]) { H[k] = v; ch++; } } if (!ch) break; }
  F.stairs = 0; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [0, 1]]) { if (!inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (Math.abs(H[k] - H[z]) !== 1 || isWater(k) || isWater(z) || MAT[k] === M.QROCK || MAT[z] === M.QROCK || TWM.stairs.has(k + ',' + z)) continue; TWM.stairs.set(k + ',' + z, 1); TWM.stairs.set(z + ',' + k, 1); F.stairs++; } }
  // ---------------------------------------------------------------- 7. props
  const P = (kind, a, b, o) => { if (!inB(a, b)) return null; if (o && o.block) { const fw = o.fp ? o.fp[0] : 1, fh = o.fp ? o.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) { const z = id(a + r, b + q); if (z >= N * N || PATHC[z] || isWater(z) || MAT[z] === M.PLANK || BIO[z] !== B) return null; } } return prop(kind, a, b, o); };
  const Q = (kind, a, b, o) => { if (inB(a, b)) { poi(kind, 'ntq', a, b, o); RES[id(a, b)] = 1; } };
  const LT2 = (a, b, r, col, kind) => TWM.lights.push({ biome: 'ntq', i: a, j: b, r, col, kind: kind || 'lantern' });
  const L1 = (kind, a, b, o) => { const p = P(kind, a, b, o); if (!p) (F.failed = F.failed || []).push(kind + '@' + a + ',' + b); return p; };
  L1('qtree', F.T[0] - 1, F.T[1] - 1, { fp: [3, 3], v: 0, block: true });                                          // the Ginseng Fruit Tree
  L1('qhall', 104, 34, { fp: [3, 3], v: 0, block: true });                                                          // Zhenyuan's hall
  L1('qgate', 117, 45, { fp: [2, 2], v: 0, block: true });                                                          // the monastery gate (paifang)
  L1('qpalace', 99, 38, { fp: [3, 3], v: 0, block: true }); L1('qpalace', 115, 35, { fp: [3, 3], v: 1, block: true });   // the attendants' lodge (west), a guest hall on the lookout side
  L1('qpav', 104, 46, { fp: [2, 2], v: 0, block: true }); L1('qpav', 118, 37, { fp: [2, 2], v: 1, block: true });    // tea pavilion, the lookout pavilion
  L1('qkiln', 108, 37, { fp: [1, 1], v: 0, block: true }); L1('qkiln', 103, 37, { fp: [1, 1], v: 1, block: true });   // incense burners before and beside the hall
  L1('qshrine', 103, 31, { fp: [2, 2], v: 0, block: true });                                                       // spring shrine behind the hall
  L1('qbridge', 113, 38, { fp: [1, 1], v: 0, block: false });                                                       // a little jade bridge where the stream enters the pond
  for (const [a, b, v] of [[116, 40, 0], [117, 41, 1], [115, 41, 1], [101, 46, 0], [94, 49, 1]]) P('qlotus', a, b, { fp: [1, 1], v, block: false });
  for (const [a, b, v] of [[116, 47, 0], [120, 47, 1], [114, 46, 0], [120, 45, 1], [115, 37, 2], [111, 39, 1], [107, 39, 0], [112, 44, 1], [114, 42, 0], [106, 46, 1]]) { const p = L1('qlamp', a, b, { fp: [1, 1], v, block: true }); if (p) { F.lamps.push([a, b]); LT2(a, b, 56, '255,205,120', 'lantern'); } }
  LT2(109, 43, 150, '170,255,190', 'magic'); LT2(105, 35, 90, '255,210,130', 'lantern'); LT2(103, 31, 70, '170,230,255', 'magic'); LT2(116, 40, 80, '200,255,235', 'magic');
  F.court = [113.5, 46.5]; F.hall = [105.5, 38.5]; F.tree = [109.5, 43.5]; F.lookout = [119.5, 38.5]; F.spring = [105, 32]; F.west = [91, 38]; F.ring = [109.5, 43.5];
  // posts: where the residents work (activities)
  Q('qsweep', 106, 41, { cap: 2, face: 'down' }); Q('qsweep', 113, 41, { cap: 2, face: 'down' }); Q('qsweep', 110, 48, { cap: 2, face: 'left' }); Q('qsweep', 115, 45, { cap: 2, face: 'down' });
  Q('qherb', 99, 42, { cap: 2, face: 'down' }); Q('qherb', 96, 43, { cap: 2, face: 'down' }); Q('qherb', 100, 44, { cap: 2, face: 'down' }); Q('qherb', 104, 47, { cap: 2, face: 'down' });
  Q('qwater', 107, 40, { cap: 2, face: 'down' }); Q('qwater', 112, 43, { cap: 2, face: 'right' }); Q('qwater', 106, 45, { cap: 2, face: 'up' });
  Q('qtea', 106, 46, { cap: 3, face: 'left' }); Q('qtea', 106, 47, { cap: 3, face: 'left' }); Q('qtea', 104, 48, { cap: 3, face: 'up' });
  Q('qread', 105, 38, { cap: 3, face: 'up' }); Q('qread', 106, 38, { cap: 3, face: 'up' }); Q('qread', 104, 38, { cap: 3, face: 'up' });
  Q('qfeed', 98, 45, { cap: 2, face: 'down' }); Q('qfeed', 103, 48, { cap: 2, face: 'down' }); Q('qfeed', 97, 44, { cap: 2, face: 'down' });
  Q('qtend', 107, 42, { cap: 2, face: 'right' }); Q('qtend', 109, 41, { cap: 2, face: 'down' }); Q('qtend', 112, 44, { cap: 2, face: 'left' }); Q('qtend', 107, 45, { cap: 2, face: 'up' });
  Q('qgather', 106, 43, { cap: 2, face: 'right' }); Q('qgather', 112, 42, { cap: 2, face: 'left' }); Q('qgather', 109, 46, { cap: 2, face: 'up' });
  Q('qdrink', 114, 40, { cap: 2, face: 'right' }); Q('qdrink', 103, 46, { cap: 2, face: 'left' }); Q('qdrink', 96, 49, { cap: 2, face: 'left' }); Q('qdrink', 117, 43, { cap: 2, face: 'up' });
  Q('qpray', 105, 37, { cap: 3, face: 'up' }); Q('qpray', 106, 37, { cap: 3, face: 'up' }); Q('qpray', 104, 37, { cap: 3, face: 'up' });
  Q('qlook', 121, 38, { cap: 2, face: 'right' }); Q('qlook', 121, 40, { cap: 2, face: 'right' }); Q('qrest', 118, 37, { cap: 3, face: 'up' }); Q('qrest', 113, 40, { cap: 3, face: 'up' });
  Q('qgraze', 99, 44, { cap: 2, face: 'down' }); Q('qgraze', 96, 46, { cap: 2, face: 'down' }); Q('qgraze', 102, 49, { cap: 2, face: 'down' }); Q('qgraze', 108, 49, { cap: 2, face: 'down' });
  // scatter: peach and jade trees, flowering shrubs, herb beds, bamboo by the water, scholar rocks; nothing on reserved squares, paths or the avenue
  for (let n = 0; n < 560; n++) { const a = x0 + Math.floor(R() * (x1 - x0 + 1)), b = y0 + Math.floor(R() * (y1 - y0 + 1)), k = tile(a, b); if (k < 0 || RES[k] || PATHC[k] || isWater(k) || MAT[k] === M.QPAVE || MAT[k] === M.PLANK || Math.hypot(a - F.T[0], (b - F.T[1]) * 1.2) < 8) continue;
    const m = MAT[k], h = H[k], r = R(), w = wOf(a, b), nn = nOf(a, b); let kind;
    if (m === M.QROCK) kind = r < 0.5 ? 'qrock' : r < 0.8 ? 'qbamboo' : 'qpeach'; else if (m === M.QGRAV) kind = r < 0.4 ? 'qrock' : 'qbush'; else if (nn <= 22 && w < -3) kind = r < 0.26 ? 'qpeach' : r < 0.42 ? 'qbush' : r < 0.74 ? 'qflower' : r < 0.84 ? 'qbamboo' : 'qtreeb'; else kind = r < 0.3 ? 'qpeach' : r < 0.5 ? 'qbush' : r < 0.66 ? 'qflower' : r < 0.78 ? 'qbamboo' : r < 0.86 ? 'qrock' : 'qtreeb';
    if (kind === 'qbamboo') { let near = false; for (const s of F.stream) { const dd = Math.abs((s % N) - a) + Math.abs(Math.floor(s / N) - b); if (dd < 6) { near = true; break; } } if (!near && R() < 0.7) kind = 'qpeach'; }
    P(kind, a, b, { fp: [1, 1], v: n & 3, block: kind !== 'qflower' }); }
  // ---------------------------------------------------------------- 8. the monastery meets the world: outward band (placeholders around the biome take limestone, moss and pine) and near-field
  F.out = [];
  const dOut = new Map(); { const q = []; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] !== M.VOID && !dOut.has(z)) { dOut.set(z, 1); q.push(z); } } }
    for (let h = 0; h < q.length; h++) { const k = q[h], d = dOut.get(k); if (d >= 11) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] === M.VOID || TWM.biomes[BIO[z]].built || dOut.has(z)) continue; dOut.set(z, d + 1); q.push(z); } } }
  for (const [k, d] of dOut) { if (TWM.biomes[BIO[k]].built || RES[k]) continue; const i = k % N, j = Math.floor(k / N), p = Math.pow(1 - (d - 1) / 10.5, 1.1), r = hash2(i, j, 711), n = vnoise(i * 0.4, j * 0.4, 712);
    if (MAT[k] >= M.PH && MAT[k] < M.HROCK && r < p * (0.5 + n * 0.55)) { MAT[k] = n > 0.62 ? M.QROCK : n > 0.35 ? M.QGRAV : M.QLAWN; F.out.push(k); }
    if (d <= 8 && r > 0.88 - p * 0.14 && !PATHC[k] && (MAT[k] === M.QLAWN || MAT[k] === M.QGRAV || MAT[k] === M.QROCK)) prop(r > 0.96 ? 'qrock' : r > 0.92 ? 'qpeach' : r > 0.88 ? 'qtreeb' : 'qbamboo', i, j, { fp: [1, 1], v: Math.floor(r * 97) & 3, block: true }); }
  { const near = TWM.ntqNear = new Uint8Array(N * N), q = [], dl = new Int16Array(N * N).fill(-1);
    for (const k of F.tiles) { near[k] = 1; dl[k] = 0; q.push(k); }
    for (let h = 0; h < q.length; h++) { const k = q[h]; if (dl[k] >= 8) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b)) continue; const z = id(i + a, j + b); if (dl[z] >= 0) continue; if (BIO[z] !== B && TWM.biomes[BIO[z]].built) continue; dl[z] = dl[k] + 1; near[z] = 1; q.push(z); } }
    for (const nm of ['lionNear', 'fireNear', 'tthNear', 'hpsNear', 'nhsNear']) if (TWM[nm]) for (let k = 0; k < N * N; k++) if (near[k] && TWM[nm][k] && BIO[k] !== B) near[k] = 0; }
  TWM.homes = TWM.homes || {}; TWM.homes.ntq = { deer: [101, 47], boy: [113, 46], girl: [109, 44], sage: [106, 38], fairy: [113, 38], monkey: [101, 41], _: [112, 46] };
};
window.TW_NTQ_FINAL = function (X) {   // drop any post the walk graph cannot reach
  const { TWM, id, N } = X, F = TWM.ntq, B = F.B, st = id(F.gate[0], F.gate[1]), seen = new Uint8Array(N * N), q = [st]; seen[st] = 1;
  for (let n = 0; n < q.length; n++) { const k = q[n], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (!seen[z] && TWM.BIO[z] === B && TWM.canStep(k, z)) { seen[z] = 1; q.push(z); } } }
  F.reach = seen; const before = TWM.pois.length; F.dropped = [];
  TWM.pois = TWM.pois.filter(p => { if (p.biome !== 'ntq') return true; const k = id(Math.floor(p.x / 8), Math.floor(p.y / 8)); if (!seen[k]) F.dropped.push(p.kind + '@' + p.i + ',' + p.j); return seen[k]; }); F.droppedPois = before - TWM.pois.length;
};
if (typeof module !== 'undefined') module.exports = {};
