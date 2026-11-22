'use strict';
// ===== Tây Du Ký v2 — Bạch Cốt Lĩnh (White Bone Ridge): map build (world space; loaded before tw-map.js) =====
// The planner region (1,005 tiles) is a C that wraps the Heaven cloud sea: a SOUTH POCKET (x 29-56 / y 33-40: the grave field and the entry pass), the EAST VALLEY (x 41-60 / y 7-32: a canyon whose east wall is Hoa Quả Sơn's rim,
// whose west side drops towards the Heaven cloud sea) and the NORTH RIDGE (x 1-60 / y 1-6: a knife-edge ridge above the cloud sea with a chasm and a rope bridge, ending at a lookout over the void).
// The pilgrims' road: entry pass -> grave field -> the clearing at the fork (the black pool, the dead tree) -> the giant ribcage -> the bone-palace terrace -> the lair (skull cave) -> up the stairs to the ridge -> the chasm bridge -> the far lookout.
window.TW_BCL_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, prop, poi, id, inMap, vnoise, hash2, carvePath, mulberry32 } = X;
  const B = TWM.bi.bcl, R = mulberry32(20261206);
  const inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B && MAT[id(i, j)] !== M.VOID, tile = (i, j) => inB(i, j) ? id(i, j) : -1;
  const sm = t => t * t * (3 - 2 * t), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let k = 0; k < N * N; k++) if (BIO[k] === B) { const i = k % N, j = Math.floor(k / N); x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  // ---------------------------------------------------------------- 0. purge whatever earlier passes left on the region (the Hoa Quả Sơn foothills, placeholders' stele)
  const mine = (i, j) => { i = Math.floor(i); j = Math.floor(j); return inMap(i, j) && BIO[id(i, j)] === B; };
  TWM.props = TWM.props.filter(p => !mine(p.i, p.j)); TWM.pois = TWM.pois.filter(p => p.biome !== 'bcl'); TWM.lights = TWM.lights.filter(l => l.biome !== 'bcl');
  for (const key of [...TWM.stairs.keys()]) { const [a, b] = key.split(',').map(Number); if (BIO[a] === B || BIO[b] === B) TWM.stairs.delete(key); } for (const key of [...TWM.stairAt.keys()]) if (BIO[key] === B) TWM.stairAt.delete(key);
  TWM.biomes[B].built = true;
  const F = TWM.bcl = { B, x0, y0, x1, y1, tiles: [], stream: [], path: [], pads: {}, flags: [], chimes: [], pyres: [], ribs: [], graves: [], lamps: [], failed: [], gate: [44, 38], fork: [50, 22], lair: [44, 5], palace: [55, 9], bridge: [27, 3], look: [4, 3], pool: [53, 24], tree: [49, 20] };
  TWM.layout.bcl = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  const isWater = k => MAT[k] === M.STREAM || MAT[k] === M.POOL, FIX = new Uint8Array(N * N);
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) if (inB(i, j)) { const k = id(i, j); F.tiles.push(k); PATHC[k] = 0; RES[k] = 0; MAT[k] = M.BDIRT; H[k] = 1; }
  // ---------------------------------------------------------------- 1. the road (a polyline) and the canyon around it
  const ROAD = [[44, 39], [45, 36], [47, 33], [49, 29], [50, 25], [50, 22], [51, 17], [52, 13], [52, 10], [50, 7], [46, 5], [40, 4], [34, 4], [28, 3], [22, 3], [14, 3], [8, 3], [4, 3]];
  const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); return [Math.hypot(px - ax - dx * t, py - ay - dy * t), t]; };
  const roadD = (px, py) => { let best = 99, at = 0; for (let n = 0; n < ROAD.length - 1; n++) { const [d, t] = segD(px, py, ...ROAD[n], ...ROAD[n + 1]); if (d < best) { best = d; at = n + t; } } return [best, at]; };
  // floor level along the road: 2 at the entry, 3 in the valley, 5 at the lair, 8 on the ridge
  const FL = [[0, 2], [4, 3], [10, 3], [12, 4], [13, 5], [14, 6], [15, 7], [17, 8]];
  const floorAt = s => { for (let q = 0; q < FL.length - 1; q++) if (s <= FL[q + 1][0]) return FL[q][1] + (FL[q + 1][1] - FL[q][1]) * (s - FL[q][0]) / (FL[q + 1][0] - FL[q][0]); return FL[FL.length - 1][1]; };
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), [d, s] = roadD(i, j), fl = floorAt(s), n1 = vnoise(i * 0.3, j * 0.3, 1301), n2 = vnoise(i * 0.8, j * 0.8, 1302), ridge = j <= 6 && i <= 44;
    let h; if (ridge) { h = 8 + (n1 - 0.5) * 2.2 + (n2 - 0.5) * 0.8; if (j <= 2) h += 2 * (3 - j) * 0.5; if (j >= 5) h -= (j - 4) * 0.6; }        // the knife-edge ridge: crest at the back, falling away towards the Heaven sea
    else h = fl + sm(clamp((d - 3.2) / 6.5, 0, 1)) * (7 + n1 * 5) + (n2 - 0.5) * 1.2;
    if (i >= 57 && j <= 32) h = Math.max(h, 9 + (n1 - 0.5) * 2);                                                                                      // the east wall climbs to meet Hoa Quả Sơn's rim
    H[k] = clamp(Math.round(h), 1, 14); }
  // hug the neighbours' rims (hqs west rim is level 11-13)
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b)) continue; const z = id(i + a, j + b); if (BIO[z] === TWM.bi.hqs && MAT[z] !== M.VOID) { H[k] = Math.max(H[k], H[z] - 1); FIX[k] = 1; } } }
  // ---------------------------------------------------------------- 2. pads
  const ell = (ca, cb, ra, rb, fn, pw) => { pw = pw || 2; for (let b = Math.floor(cb - rb - 2); b <= cb + rb + 2; b++) for (let a = Math.floor(ca - ra - 2); a <= ca + ra + 2; a++) { const d = (Math.abs(a - ca) / ra) ** pw + (Math.abs(b - cb) / rb) ** pw, k = tile(a, b); if (k >= 0) fn(k, d, a, b); } };
  const flat = (ca, cb, ra, rb, lv, pw) => ell(ca, cb, ra, rb, (k, d) => { if (isWater(k) || FIX[k]) return; if (d < 1) H[k] = lv; else if (d < 1.9) H[k] = Math.round(lv + (H[k] - lv) * sm((d - 1) / 0.9)); }, pw);
  const PADS = { GATE: [44.5, 37.2, 3.4, 2.4, 2, 4], GRAVE: [37.5, 36.5, 6.5, 3.2, 2, 4], CLEAR: [50, 22, 5.2, 4.4, 3, 4], PALACE: [55.5, 9.5, 3.8, 3.2, 7, 4], LAIR: [44, 5, 4.4, 2.6, 7, 4], CHASMW: [24.5, 3, 3, 3.2, 8, 4], LOOK: [4.5, 3.5, 3.4, 2.6, 9, 4], TOMB: [33, 5, 3, 1.6, 8, 4], RIBS: [51.5, 14.5, 3.4, 2.8, 4, 4], SPRING: [46, 5.5, 1.5, 1, 7, 2] };
  F.pads = PADS; for (const key of ['GATE', 'GRAVE', 'CLEAR', 'PALACE', 'LAIR', 'LOOK', 'TOMB', 'RIBS']) flat(...PADS[key]);
  // ---------------------------------------------------------------- 3. water: the black spring beside the lair -> stream down the valley -> the black pool at the fork -> out through the entry pass; the chasm river under the bridge
  const seg = SP => { const tiles = []; for (let n = 0; n < SP.length - 1; n++) { let [a, b, l0] = SP[n]; const [a1, b1, l1] = SP[n + 1], sg = []; while (a !== a1 || b !== b1) { sg.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); } sg.forEach(([qa, qb], t) => tiles.push([qa, qb, Math.round(l0 + (l1 - l0) * t / Math.max(1, sg.length))])); } const l = SP[SP.length - 1]; tiles.push([l[0], l[1], l[2]]); return tiles; };
  const water = (a, b, lv, mat) => { const k = tile(a, b); if (k < 0) return; MAT[k] = mat || M.STREAM; H[k] = lv; FIX[k] = 1; if (!F.stream.includes(k)) F.stream.push(k); };
  for (const [a, b, lv] of seg([[46, 6, 7], [47, 8, 6], [48, 11, 5], [49, 14, 4], [48, 18, 3], [47, 21, 3], [47, 25, 3]])) water(a, b, lv);                           // the black stream west of the road
  for (let b = 22; b <= 26; b++) for (let a = 52; a <= 55; a++) { const d = ((a - 53.5) / 2.2) ** 2 + ((b - 24) / 2.8) ** 2; if (d < 1) water(a, b, 3, M.POOL); }          // the black pool (the mire) east of the clearing
  for (const [a, b, lv] of seg([[47, 26, 3], [46, 30, 2], [45, 34, 2], [42, 37, 1], [40, 39, 1]])) water(a, b, lv);
  for (let a = 22; a <= 26; a++) for (let b = 1; b <= 6; b++) water(a, b, 1);                                                                                     // the chasm: a black river five tiles wide under the ridge
  F.pools = { pool: [53.5, 24.5], spring: [46.5, 6.5] };
  for (const k of F.stream) { const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + da, j + db)) continue; const q = id(i + da, j + db); if (!isWater(q) && H[q] < H[k] && !(i >= 22 && i <= 26 && j <= 6)) H[q] = H[k]; } }
  // ---------------------------------------------------------------- 4. relax (<= 2 levels between neighbours, 1 on the floors), routes, stairs
  const relax = () => { for (let pass = 0; pass < 80; pass++) { let ch = 0; for (const k of F.tiles) { if (FIX[k]) continue; const i = k % N, j = Math.floor(k / N), lim = H[k] >= 6 ? 2 : 1; let lo = -9, hi = 99; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + a, j + b)) continue; const h = H[id(i + a, j + b)]; lo = Math.max(lo, h - lim); hi = Math.min(hi, h + lim); } const v = lo <= hi ? clamp(H[k], lo, hi) : Math.round((lo + hi) / 2); if (v !== H[k]) { H[k] = v; ch++; } } if (!ch) break; } };
  for (const key of ['GATE', 'GRAVE', 'CLEAR', 'PALACE', 'LAIR', 'LOOK', 'TOMB', 'RIBS']) { const p = PADS[key]; ell(p[0], p[1], p[2], p[3], (k, d) => { if (d < 1 && !isWater(k)) FIX[k] = 1; }, p[5]); }
  relax();
  const arc = pts => { const t = []; for (let n = 0; n < pts.length - 1; n++) { let [a, b] = pts[n]; const [a1, b1] = pts[n + 1]; while (a !== a1 || b !== b1) { t.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); } } t.push(pts[pts.length - 1].slice()); return t; };
  const route = (pts, mat, lvOf) => {
    const tiles = arc(pts), gap = t => { const k = tile(...tiles[t]); return k >= 0 && isWater(k); };
    const lv = tiles.map(([a, b]) => { const k = tile(a, b); return k >= 0 ? H[k] : 0; }); if (lvOf) tiles.forEach((p, t) => { const v = lvOf(p, t, tiles.length); if (v !== undefined) lv[t] = v; });
    for (let pass = 0; pass < 3; pass++) { for (let t = 1; t < lv.length; t++) { if (gap(t) || gap(t - 1)) continue; if (lv[t] - lv[t - 1] > 1) lv[t] = lv[t - 1] + 1; if (lv[t] - lv[t - 1] < -1) lv[t] = lv[t - 1] - 1; } for (let t = lv.length - 2; t >= 0; t--) { if (gap(t) || gap(t + 1)) continue; if (lv[t] - lv[t + 1] > 1) lv[t] = lv[t + 1] + 1; if (lv[t] - lv[t + 1] < -1) lv[t] = lv[t + 1] - 1; } }
    let last = null; for (let t = 0; t < tiles.length; t++) { const k = tile(...tiles[t]); if (k < 0) { last = null; continue; } if (gap(t)) { H[k] = last !== null ? last : H[k]; } else { H[k] = lv[t]; last = lv[t]; } FIX[k] = 1; }
    carvePath(pts, mat || M.BTOMB, 'bcl'); for (const [a, b] of tiles) { const k = tile(a, b); if (k >= 0) F.path.push(k); } };
  route(ROAD, M.BTOMB);
  route([[50, 22], [46, 22], [43, 20]], M.BDIRT);                          // a side path to a lone tomb
  route([[52, 10], [55, 9]], M.BTOMB);                                       // up to the bone palace terrace
  route([[50, 7], [47, 4], [44, 5]], M.BTOMB);                               // the lair's mouth
  route([[40, 4], [36, 5], [33, 5]], M.BDIRT);                               // the ridge tomb
  route([[45, 36], [41, 36], [38, 36], [34, 37]], M.BDIRT);                  // along the grave field
  route([[50, 22], [53, 20], [55, 18]], M.BDIRT);
  relax();
  // stairs on every one-level edge (the road keeps its own steps)
  const wk = k => MAT[k] !== M.BROCK && !isWater(k); F.stairs = 0;
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [0, 1]]) { if (!inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (Math.abs(H[k] - H[z]) !== 1 || isWater(k) || isWater(z) || Math.max(H[k], H[z]) > 9 || TWM.stairs.has(k + ',' + z)) continue; TWM.stairs.set(k + ',' + z, 1); TWM.stairs.set(z + ',' + k, 1); F.stairs++; } }
  // ---------------------------------------------------------------- 5. materials: cold earth, pale dead grass, dark moss, jagged rock, bleached bone rubble, grave paving
  const slope = k => { let s = 0; const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + da, j + db)) continue; const q = id(i + da, j + db); if (BIO[q] !== B && MAT[q] !== M.VOID) continue; s = Math.max(s, Math.abs(H[q] - H[k])); } return s; };
  for (const k of F.tiles) { if (isWater(k) || MAT[k] === M.BRIDGE) continue; const i = k % N, j = Math.floor(k / N), h = H[k], n0 = vnoise(i * 0.3, j * 0.3, 1303), n1 = vnoise(i * 0.8, j * 0.8, 1304), s = slope(k), [d] = roadD(i, j);
    MAT[k] = (s >= 2 && h >= 4) || h >= 11 ? M.BROCK : n1 > 0.88 ? M.BBONE : d < 4 && n0 > 0.45 ? M.BGRASS : n0 > 0.62 ? M.BMOSS : M.BDIRT; }
  const paint = (p, mat, rim) => ell(p[0], p[1], p[2], p[3], (k, d) => { if (d < rim && !isWater(k) && MAT[k] !== M.BRIDGE) MAT[k] = mat; }, p[5]);
  paint(PADS.PALACE, M.BTOMB, 0.9); paint(PADS.LAIR, M.BTOMB, 0.8); paint(PADS.GATE, M.BTOMB, 0.8); paint(PADS.CLEAR, M.BBONE, 0.6); paint(PADS.LOOK, M.BTOMB, 0.85); paint(PADS.TOMB, M.BTOMB, 0.8); paint(PADS.RIBS, M.BBONE, 0.5); paint(PADS.GRAVE, M.BMOSS, 0.6);
  for (const k of F.path) if (MAT[k] !== M.BRIDGE && !isWater(k) && MAT[k] !== M.BTOMB) MAT[k] = M.BTOMB;
  // ---------------------------------------------------------------- 6. props and posts
  const blocked = new Set(); const rb = () => { blocked.clear(); for (const p of TWM.props) if (p.block && p.biome === 'bcl') { const fw = p.fp ? p.fp[0] : 1, fh = p.fp ? p.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) blocked.add(id(p.i + r, p.j + q)); } };
  const P = (kind, a, b, o) => { if (!inB(a, b)) return null; const k0 = id(a, b); if (isWater(k0)) return null; if (o && o.block) { const fw = o.fp ? o.fp[0] : 1, fh = o.fp ? o.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) { const z = id(a + r, b + q); if (z >= N * N || PATHC[z] || isWater(z) || MAT[z] === M.BRIDGE || BIO[z] !== B) return null; } } return prop(kind, a, b, o); };
  const L1 = (kind, a, b, o) => { let p = P(kind, a, b, o); if (!p) for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [0, 2], [-2, 0], [0, -2]]) { p = P(kind, a + da, b + db, o); if (p) break; } if (!p) F.failed.push(kind + '@' + a + ',' + b); return p; };
  const snap = (a, b, r) => { for (let q = 0; q <= (r === undefined ? 2 : r); q++) for (let dj = -q; dj <= q; dj++) for (let di = -q; di <= q; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== q) continue; const k = tile(a + di, b + dj); if (k >= 0 && !isWater(k) && MAT[k] !== M.BROCK && MAT[k] !== M.BRIDGE && !blocked.has(k)) return [a + di, b + dj]; } return null; };
  const Q = (kind, a, b, o) => { rb(); const s = snap(a, b, 2); if (!s) { F.failed.push('poi:' + kind + '@' + a + ',' + b); return null; } const p = poi(kind, 'bcl', s[0], s[1], o); if (p) RES[id(s[0], s[1])] = 1; return p; };
  const LT2 = (a, b, r, col, kind) => TWM.lights.push({ biome: 'bcl', i: a, j: b, r, col, kind: kind || 'magic' });
  // landmarks
  L1('btusk', 54, 8, { fp: [3, 3], v: 0, block: true }); LT2(55, 10, 90, '170,255,200');                                  // the ivory bone palace
  L1('blair', 42, 3, { fp: [3, 3], v: 0, block: true }); LT2(44, 5, 120, '120,255,170');                                   // the skull cave, Bạch Cốt Tinh's den
  L1('bribs', 50, 14, { fp: [1, 1], v: 0, block: false }); F.ribs.push([51, 15]); L1('bribs', 51, 29, { fp: [1, 1], v: 1, block: false }); F.ribs.push([52, 30]);   // giant ribcage arches over the road
  L1('btotem', 47, 3, { fp: [1, 1], v: 0, block: true }); L1('btotem', 40, 6, { fp: [1, 1], v: 1, block: true }); L1('btotem', 52, 12, { fp: [1, 1], v: 0, block: true }); L1('btotem', 49, 35, { fp: [1, 1], v: 1, block: true });
  L1('bruin', 38, 38, { fp: [3, 3], v: 0, block: true });                                                                   // a ruined shrine in the grave field
  L1('bshrine', 33, 4, { fp: [1, 1], v: 0, block: true }); L1('bshrine', 43, 21, { fp: [1, 1], v: 1, block: true }); L1('bshrine', 5, 2, { fp: [1, 1], v: 0, block: true });
  L1('bdead', 49, 20, { fp: [1, 1], v: 0, block: true });                                                                   // the dead tree at the fork: the pilgrims rest here
  L1('table', 51, 21, { fp: [1, 1], v: 0, block: true });
  for (const [a, b] of [[48, 31], [50, 31], [46, 35], [48, 11], [53, 16], [49, 8]]) { L1('bpyre', a, b, { fp: [1, 1], v: 0, block: true }); F.pyres.push([a, b]); LT2(a, b, 52, '120,255,170', 'fire'); }
  for (const [a, b] of [[45, 34], [49, 27], [51, 19], [51, 11], [47, 5], [38, 4], [30, 4], [18, 3], [10, 3]]) { L1('bchime', a, b, { fp: [1, 1], v: (a + b) & 3, block: true }); F.chimes.push([a, b]); }
  for (const [a, b] of [[44, 37], [47, 36], [49, 24], [52, 15], [35, 4], [20, 3], [12, 3]]) { L1('bflag', a, b, { fp: [1, 1], v: (a + b) & 1, block: true }); F.flags.push([a, b]); }
  for (let n = 0; n < 26; n++) { const a = 30 + Math.floor(R() * 22), b = 33 + Math.floor(R() * 7), p = L1('bgrave', a, b, { fp: [1, 1], v: n & 3, block: true }); if (p) F.graves.push([p.i, p.j]); }                    // the grave field
  for (let n = 0; n < 10; n++) { const a = 40 + Math.floor(R() * 5), b = 18 + Math.floor(R() * 8), p = L1('bgrave', a, b, { fp: [1, 1], v: n & 3, block: true }); if (p) F.graves.push([p.i, p.j]); }
  L1('bcoffin', 36, 35, { fp: [1, 1], v: 0, block: true }); L1('bcoffin', 56, 17, { fp: [1, 1], v: 1, block: true }); L1('bcrys', 55, 24, { fp: [1, 1], v: 0, block: true }); L1('bcrys', 56, 25, { fp: [1, 1], v: 1, block: true }); LT2(55, 24, 60, '150,255,190', 'crystal');
  L1('bbridgeb', 27, 3, { fp: [1, 1], block: false });
  // posts
  Q('bpath', 45, 37, { cap: 2, face: 'up' }); Q('bclear', 50, 22, { cap: 6 }); Q('bclear', 48, 23, { cap: 4 }); Q('bclear', 52, 20, { cap: 4 }); Q('bclear', 49, 25, { cap: 4 });
  Q('bgrave_p', 38, 36, { cap: 3, face: 'up' }); Q('bgrave_p', 33, 35, { cap: 3, face: 'up' }); Q('bgrave_p', 43, 21, { cap: 3, face: 'up' }); Q('bgrave_p', 33, 5, { cap: 3, face: 'up' });
  Q('bpalace', 55, 11, { cap: 4, face: 'up' }); Q('blair', 44, 6, { cap: 4, face: 'up' }); Q('blook', 5, 4, { cap: 4, face: 'left' }); Q('bbridge', 28, 3, { cap: 3, face: 'right' }); Q('bbridge', 21, 3, { cap: 3, face: 'left' });
  Q('bwatch', 40, 5, { cap: 2, face: 'down' }); Q('bwatch', 52, 11, { cap: 2, face: 'left' }); Q('bwatch', 49, 31, { cap: 2, face: 'up' }); Q('bwatch', 36, 5, { cap: 2, face: 'down' });
  Q('bdrink', 54, 23, { cap: 2, face: 'right' }); Q('bdrink', 47, 24, { cap: 2, face: 'left' }); Q('bdrink', 48, 13, { cap: 2, face: 'left' });
  Q('bprowl', 46, 30, { cap: 2 }); Q('bprowl', 44, 14, { cap: 2 }); Q('bprowl', 56, 20, { cap: 2 }); Q('bprowl', 30, 4, { cap: 2 }); Q('bprowl', 14, 3, { cap: 2 });
  // ---------------------------------------------------------------- 7. scatter: dead trees, pale spiky grass, bone piles, skulls on stakes, jagged rock
  const nearRoad = (a, b) => roadD(a, b)[0];
  for (let n = 0; n < 900; n++) { const a = x0 + Math.floor(R() * (x1 - x0 + 1)), b = y0 + Math.floor(R() * (y1 - y0 + 1)), k = tile(a, b); if (k < 0 || RES[k] || PATHC[k] || isWater(k) || MAT[k] === M.BTOMB || MAT[k] === M.BRIDGE) continue; const m = MAT[k], h = H[k], r = R(), dr = nearRoad(a, b); let kind;
    if (m === M.BROCK) kind = r < 0.35 ? 'bspire' : r < 0.6 ? 'brock' : r < 0.8 ? 'bpine' : 'bdead'; else if (m === M.BBONE) kind = r < 0.35 ? 'bbones' : r < 0.55 ? 'bskull' : r < 0.75 ? 'bgrass' : 'brock'; else kind = dr < 3 ? (r < 0.35 ? 'bgrass' : r < 0.55 ? 'bbones' : r < 0.7 ? 'bskull' : r < 0.85 ? 'bdead' : 'brock') : (r < 0.3 ? 'bdead' : r < 0.5 ? 'bgrass' : r < 0.62 ? 'bpine' : r < 0.74 ? 'brock' : r < 0.84 ? 'bbones' : r < 0.92 ? 'bspire' : 'bskull');
    if (dr < 1.6 && kind !== 'bgrass' && kind !== 'bbones') continue; const big = kind === 'bdead' || kind === 'bpine' || kind === 'brock' || kind === 'bspire'; P(kind, a, b, { fp: [1, 1], v: n & 7, block: big }); }
  // ---------------------------------------------------------------- 8. the ridge meets the world: bone fields and mist over the unfinished neighbours (west: Hỏa Vân Động, south: Cao Lão Trang); near-field for the faces
  F.out = []; TWM.bclNear = new Uint8Array(N * N);
  { const dl = new Int16Array(N * N).fill(-1), q = []; for (const k of F.tiles) { TWM.bclNear[k] = 1; dl[k] = 0; q.push(k); }
    for (let h = 0; h < q.length; h++) { const k = q[h]; if (dl[k] >= 8) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b)) continue; const z = id(i + a, j + b); if (dl[z] >= 0) continue; if (BIO[z] !== B && TWM.biomes[BIO[z]].built) continue; dl[z] = dl[k] + 1; TWM.bclNear[z] = 1; q.push(z); } }
    for (const nm of ['lionNear', 'fireNear', 'tthNear', 'hpsNear', 'nhsNear', 'ntqNear', 'hqsNear']) if (TWM[nm]) for (let k = 0; k < N * N; k++) if (TWM.bclNear[k] && TWM[nm][k] && BIO[k] !== B) TWM.bclNear[k] = 0; }
  TWM.homes = TWM.homes || {}; TWM.homes.bcl = { crow: [50, 16], wolf: [38, 36], fox: [48, 30], servant: [44, 6] };
};
window.TW_BCL_FINAL = function (X) {   // the bone-field band over the unfinished neighbours (after the provisional trails, so connectivity is untouched); drop unreachable posts
  const { TWM, id, N } = X, F = TWM.bcl, M = TWM.M, MAT = TWM.MAT, BIO = TWM.BIO, H = TWM.H, inMap = TWM.inMap, hash2 = TWM.hash2, q = [], d = new Map();
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || BIO[id(i + a, j + b)] === F.B) continue; const z = id(i + a, j + b); if (MAT[z] !== M.VOID && !d.has(z)) { d.set(z, 1); q.push(z); } } }
  for (let h = 0; h < q.length; h++) { const k = q[h], dd = d.get(k); if (dd >= 11) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || BIO[id(i + a, j + b)] === F.B) continue; const z = id(i + a, j + b); if (MAT[z] === M.VOID || TWM.biomes[BIO[z]].built || d.has(z)) continue; d.set(z, dd + 1); q.push(z); } }
  F.out = []; for (const [k, dd] of d) { if (TWM.biomes[BIO[k]].built || TWM.RES[k] || TWM.PATHC[k] || MAT[k] < M.PH || MAT[k] >= M.HROCK) continue; const i = k % N, j = Math.floor(k / N), r = hash2(i, j, 1311), n = TWM.vnoise(i * 0.4, j * 0.4, 1312), p = dd <= 3 ? 1 : 1 - (dd - 3) / 8.5; if (r > p) continue; MAT[k] = n > 0.72 ? M.BBONE : n > 0.5 ? M.BGRASS : n > 0.3 ? M.BMOSS : M.BDIRT; F.out.push(k);
    if (dd <= 8 && r < 0.3 * p && !TWM.PATHC[k]) TWM.props.push({ kind: r < 0.06 ? 'bdead' : r < 0.14 ? 'bbones' : r < 0.2 ? 'bgrass' : r < 0.25 ? 'bskull' : 'bpine', biome: 'bcl', i, j, fp: [1, 1], v: Math.floor(r * 997) & 7, block: false }); }
  const st = id(F.gate[0], F.gate[1]), seen = new Uint8Array(N * N), qq = [st]; seen[st] = 1;
  for (let n = 0; n < qq.length; n++) { const k = qq[n], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (!seen[z] && BIO[z] === F.B && TWM.canStep(k, z)) { seen[z] = 1; qq.push(z); } } }
  F.reach = seen; F.dropped = []; TWM.pois = TWM.pois.filter(p => { if (p.biome !== 'bcl') return true; if (p.kind === 'wall') return true; const k = id(Math.floor(p.x / 8), Math.floor(p.y / 8)); if (!seen[k]) F.dropped.push(p.kind + '@' + p.i + ',' + p.j); return seen[k]; });
};
if (typeof module !== 'undefined') module.exports = {};
