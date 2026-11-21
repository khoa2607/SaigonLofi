'use strict';
// ===== Tây Du Ký v2 — Cao Lão Trang (Old Gao's Village): map build (world space; loaded before tw-map.js) =====
// The planner's clt region (x 36-66 / y 29-57, a leaf-shaped valley between Bạch Cốt Lĩnh's low hills (north), Hỏa Vân Động (west), the palm causeway (east) and Liên Hoa Động (south)) becomes ONE farming village:
//   A  the Gao compound: a level-3 terrace (x 47-58, y 38-43) with the courtyard house (PixelLab, double size), a wing, the granary, a well, a peach tree; a wide stair climbs to it from the square
//   B  the village square and the main street (y 46-52): market stalls, the earth-god shrine, houses, the willow bank; the road runs west gate (x 37) -> bridge over the irrigation stream (x 43) -> square -> compound / south road / east causeway
//   C  the water: a hill spring (level 3) falls into the upper pond, the stream runs south under the plank bridge into the lotus pond at the south edge; a second spring feeds the east paddies by a canal
//   D  the fields: west paddies (x 37-42, y 49-55), east paddies and gardens (x 57-64), the pig pen, the threshing yard, haystacks, scarecrows
//   E  the bamboo lane: the north-east tail (x 47-64, y 29-37) is a hill orchard and bamboo grove climbing to a small earth-god shrine
// Materials 168-177 (see tw-clt-art.js); stairs are explicit flights; every tile of the valley floor is level 1, the terraces 2-3, the knolls 2-4.
window.TW_CLT_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, prop, poi, id, inMap, vnoise, hash2, addStair } = X;
  Object.assign(M, { CGRASS: 168, CPADDY: 169, CRICE: 170, CSOIL: 171, CPATH: 172, CFLAG: 173, CBAMB: 174, CHILL: 175, CMUD: 176, CREED: 177 });
  const B = TWM.bi.clt, inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B && MAT[id(i, j)] !== M.VOID, tile = (i, j) => inB(i, j) ? id(i, j) : -1;
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let k = 0; k < N * N; k++) if (BIO[k] === B) { const i = k % N, j = Math.floor(k / N); x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  const mine = (i, j) => { i = Math.floor(i); j = Math.floor(j); return inMap(i, j) && BIO[id(i, j)] === B; };
  TWM.props = TWM.props.filter(p => !mine(p.i, p.j)); TWM.pois = TWM.pois.filter(p => p.biome !== 'clt'); TWM.lights = TWM.lights.filter(l => l.biome !== 'clt'); TWM.decals = TWM.decals.filter(d => !mine(d.i, d.j)); TWM.falls = TWM.falls.filter(f => !mine(f.i, f.j));
  for (const key of [...TWM.stairs.keys()]) { const [a, b] = key.split(',').map(Number); if (BIO[a] === B || BIO[b] === B) TWM.stairs.delete(key); } for (const key of [...TWM.stairAt.keys()]) if (BIO[key] === B) TWM.stairAt.delete(key);
  TWM.biomes[B].built = true;
  const F = TWM.clt = { B, x0, y0, x1, y1, tiles: [], entry: [37, 47], gate: [38, 47], square: [49, 48], house: null, court: [53, 41], well: [53, 42], pen: [59, 44], granary: null, wheel: [44, 45], stream: [], sluice: [61, 44], bridge: [43, 47], fields: [], paddies: [], stalks: [], lamps: [], chimneys: [], flags: [], trees: [], failed: [], ponds: [], hays: [], scare: [], bamboo: [], knoll: [41, 41], shrine: [62, 31] };
  TWM.layout.clt = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  const set = (a, b, lv, mat) => { const k = tile(a, b); if (k < 0) return; H[k] = lv; MAT[k] = mat; PATHC[k] = 0; RES[k] = 0; };
  const rect = (a0, b0, a1, b1, lv, mat) => { for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) set(a, b, lv, mat); };
  const line = (pts, mat, keepH) => { for (let n = 0; n + 1 < pts.length; n++) { let [a, b] = pts[n]; const [c, d] = pts[n + 1]; const st = Math.max(Math.abs(c - a), Math.abs(d - b), 1); for (let s = 0; s <= st; s++) { const i = Math.round(a + (c - a) * s / st), j = Math.round(b + (d - b) * s / st), k = tile(i, j); if (k < 0) continue; MAT[k] = mat; if (mat === M.CPATH || mat === M.CFLAG) PATHC[k] = 1; } } };
  // ---- 1. the valley floor and its hills
  for (let k = 0; k < N * N; k++) { if (BIO[k] !== B) continue; const i = k % N, j = Math.floor(k / N); F.tiles.push(k); PATHC[k] = 0; RES[k] = 0; H[k] = 1; MAT[k] = M.CGRASS; }
  // the north-east tail: hill orchard and bamboo lane (level 2), a gentle step up from the valley
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); if (j <= 37 && (i + j >= 84 || j <= 34)) { H[k] = 2; MAT[k] = vnoise(i * 0.5, j * 0.5, 1801) > 0.38 ? M.CBAMB : M.CGRASS; } }
  rect(56, 36, 64, 41, 2, M.CGRASS); rect(61, 36, 63, 38, 4, M.CHILL);                                            // the east knoll above the orchard
  rect(45, 38, 60, 44, 2, M.CGRASS); rect(47, 38, 58, 43, 3, M.CGRASS);                                           // A: the Gao terrace and its ring
  rect(48, 39, 57, 43, 3, M.CFLAG); rect(47, 37, 57, 37, 4, M.CGRASS); rect(50, 36, 56, 36, 4, M.CGRASS);                                                                              // the flagged courtyard
  rect(37, 40, 45, 43, 2, M.CGRASS); rect(38, 40, 44, 42, 3, M.CGRASS); rect(39, 40, 43, 41, 4, M.CHILL);           // the spring knoll (north-west)
  for (let j = 38; j <= 41; j++) for (let i = 46; i <= 47; i++) if (inB(i, j) && H[id(i, j)] < 2) { H[id(i, j)] = 2; }
  // ---- 2. water: the knoll spring falls into the upper pond, the stream runs south under the bridge into the lotus pond; the east spring feeds a canal into the paddies
  rect(40, 40, 41, 41, 4, M.POOL); set(41, 42, 3, M.STREAM); TWM.falls.push({ biome: 'clt', i: 41, j: 42, w: 1, top: 3, bottom: 1 });
  rect(39, 43, 42, 44, 1, M.POOL); TWM.water.push({ type: 'ell', c: [41, 44], rx: 2.4, ry: 1.6, mat: M.POOL }); F.ponds.push([41, 44]);
  for (let b = 44; b <= 52; b++) { set(43, b, 1, M.STREAM); F.stream.push([43, b]); }
  TWM.water.push({ type: 'line', pts: [[43.5, 44.5], [43.5, 52.5]], w: 1.1, mat: M.STREAM }); rect(43, 53, 47, 55, 1, M.POOL); TWM.water.push({ type: 'ell', c: [45.5, 54.5], rx: 3, ry: 1.8, mat: M.POOL }); F.ponds.push([45, 54]);
  rect(60, 39, 61, 40, 2, M.POOL); for (let b = 41; b <= 46; b++) set(61, b, 2 - (b > 42 ? 1 : 0), M.STREAM); rect(60, 41, 62, 42, 2, M.CGRASS); set(61, 41, 2, M.STREAM); set(61, 42, 2, M.STREAM);
  TWM.falls.push({ biome: 'clt', i: 61, j: 42, w: 1, top: 2, bottom: 1 }); TWM.water.push({ type: 'line', pts: [[61.5, 41.5], [61.5, 46.5]], w: 1, mat: M.STREAM }); F.sluice = [61, 45];
  // ---- 3. the fields: west paddies (x 37-42), east paddies (x 57-64), vegetable gardens
  const paddy = (a0, b0, a1, b1, mat) => { rect(a0, b0, a1, b1, 1, mat); F.fields.push([a0, b0, a1, b1, mat]); for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) if (inB(a, b)) F.paddies.push([a, b, mat]); };
  paddy(37, 49, 39, 51, M.CPADDY); paddy(37, 53, 39, 55, M.CRICE); paddy(41, 49, 42, 51, M.CRICE); paddy(41, 53, 42, 55, M.CPADDY);
  paddy(57, 42, 60, 47, M.CRICE); paddy(62, 42, 64, 47, M.CPADDY); paddy(57, 50, 60, 54, M.CPADDY); paddy(62, 50, 64, 54, M.CRICE); rect(61, 42, 61, 47, 1, M.STREAM); for (let b = 42; b <= 46; b++) set(61, b, 1, M.STREAM);
  set(61, 47, 1, M.CPATH); rect(61, 50, 61, 54, 1, M.CPATH); rect(56, 50, 56, 54, 1, M.CPATH); rect(37, 52, 42, 52, 1, M.CPATH); rect(40, 49, 40, 55, 1, M.CPATH);     // dikes
  rect(49, 52, 53, 54, 1, M.CSOIL); rect(55, 50, 55, 54, 1, M.CSOIL);                                             // the vegetable gardens by the south road
  // ---- 4. roads: west gate -> bridge -> square -> compound; south road; east causeway; the bamboo lane
  line([[37, 47], [42, 47]], M.CPATH); line([[43, 47], [43, 47]], M.CPATH); line([[44, 47], [54, 47]], M.CPATH); line([[48, 46], [48, 55]], M.CPATH); line([[44, 48], [47, 48]], M.CPATH);
  rect(46, 46, 53, 50, 1, M.CFLAG); line([[51, 45], [51, 44]], M.CPATH); rect(51, 44, 53, 45, 1, M.CPATH);
  line([[54, 47], [54, 47]], M.CPATH); line([[53, 48], [53, 48]], M.CPATH); line([[53, 49], [54, 49]], M.CPATH);
  line([[59, 40], [59, 38], [60, 36], [61, 34], [62, 32], [62, 31]], M.CPATH); line([[54, 40], [59, 40]], M.CPATH); line([[45, 47], [45, 44], [46, 41], [47, 41]], M.CPATH); line([[44, 41], [43, 42]], M.CPATH);
  line([[44, 44], [44, 47]], M.CPATH); line([[58, 40], [56, 44], [56, 47]], M.CPATH);
  // the bridge: the road crosses the stream at (43, 47) (a plank deck at the stream's own level)
  { const k = tile(43, 47); MAT[k] = M.BRIDGE; PATHC[k] = 1; }
  for (let b = 44; b <= 52; b++) { const k = tile(43, b); if (b !== 47 && k >= 0) { MAT[k] = M.STREAM; PATHC[k] = 0; } }
  // the compound stair: three wide flights, level 1 -> 2 -> 3, the high tile behind the low one
  for (let a = 51; a <= 53; a++) { const l1 = tile(a, 45), l2 = tile(a, 44), l3 = tile(a, 43); H[l2] = 2; H[l3] = 3; addStair(l1, l2); addStair(l2, l3); PATHC[l1] = PATHC[l2] = PATHC[l3] = 1; MAT[l2] = M.CPATH; MAT[l3] = M.CFLAG; }
  // the east terrace step beside the bamboo lane and the knoll steps (west of the stream)
  { const lo = tile(59, 40), hi = tile(58, 40); addStair(lo, hi); PATHC[lo] = PATHC[hi] = 1; MAT[hi] = M.CPATH; const l2 = tile(46, 41), h2 = tile(47, 41); addStair(l2, h2); MAT[h2] = M.CPATH; PATHC[h2] = 1; const l3 = tile(45, 41), h3 = tile(44, 41); addStair(l3, h3); PATHC[l3] = PATHC[h3] = 1; MAT[h3] = M.CPATH; MAT[tile(43, 42)] = M.CPATH; PATHC[tile(43, 42)] = 1; }
  for (let a = 44; a <= 45; a++) { const lo = tile(a, 44), hi = tile(a, 43); if (lo >= 0 && hi >= 0 && H[hi] === 2 && H[lo] === 1) { addStair(lo, hi); PATHC[lo] = PATHC[hi] = 1; MAT[hi] = M.CPATH; } }
  // ---- 5. props
  const P = (kind, a, b, o) => { o = o || {}; const fw = o.fp ? o.fp[0] : 1, fh = o.fp ? o.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) { const z = tile(a + r, b + q); if (z < 0 || PATHC[z] || MAT[z] === M.POOL || MAT[z] === M.STREAM || MAT[z] === M.BRIDGE || (MAT[z] === M.CPADDY && !o.field) || (MAT[z] === M.CRICE && !o.field)) return null; if (o.lv !== undefined && H[z] !== o.lv) return null; } return prop(kind, a, b, o); };
  const L1 = (kind, a, b, o) => { let p = P(kind, a, b, o); if (!p) for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, -1], [-1, 1]]) { p = P(kind, a + da, b + db, o); if (p) break; } if (!p) F.failed.push(kind + '@' + a + ',' + b); return p; };
  const walkM = m => m === M.CGRASS || m === M.CPATH || m === M.CFLAG || m === M.CBAMB || m === M.CSOIL || m === M.CMUD || m === M.CHILL || m === M.CPADDY || m === M.CRICE;
  const blocked = new Set(); const rb = () => { blocked.clear(); for (const p of TWM.props) if (p.block && mine(p.i, p.j)) { const fw = p.fp ? p.fp[0] : 1, fh = p.fp ? p.fp[1] : 1; if (p.piers) { for (const [da, db] of p.piers) blocked.add(id(p.i + da, p.j + db)); continue; } for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) blocked.add(id(p.i + r, p.j + q)); } };
  const snap = (a, b, r) => { rb(); for (let q = 0; q <= (r === undefined ? 2 : r); q++) for (let dj = -q; dj <= q; dj++) for (let di = -q; di <= q; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== q) continue; const k = tile(a + di, b + dj); if (k >= 0 && walkM(MAT[k]) && !blocked.has(k)) return [a + di, b + dj]; } return null; };
  const Q = (kind, a, b, o) => { const s = snap(a, b, 2); if (!s) { F.failed.push('poi:' + kind + '@' + a + ',' + b); return null; } const p = poi(kind, 'clt', s[0], s[1], o); if (p) RES[id(s[0], s[1])] = 1; return p; };
  const LT = (a, b, r, col, kind) => TWM.lights.push({ biome: 'clt', i: a, j: b, r, col, kind: kind || 'lantern' });
  // A: the Gao compound (a PixelLab courtyard house at twice its size), the wing, the granary, the well, the peach tree
  F.house = L1('cltgao', 49, 38, { fp: [4, 2], block: true, v: 0 }); LT(51, 40, 90, '255,214,150', 'lantern'); F.chimneys.push([50, 39]);
  L1('hut', 47, 39, { fp: [2, 2], v: 2, block: true }); F.granary = L1('cltgranary', 56, 38, { fp: [2, 2], block: true, v: 0 }); F.chimneys.push([47.6, 39.6]);
  L1('hpswell', 53, 42, { v: 0, block: true }); L1('bigpeach', 55, 41, { fp: [2, 2], v: 1, block: true });
  for (const [a, b] of [[50, 43], [55, 43], [48, 41], [57, 43]]) { if (L1('hpslantern', a, b, { v: a & 1, block: true })) { F.lamps.push([a, b]); LT(a, b, 46, '255,214,140'); } }
  for (const [a, b] of [[50, 44], [54, 44]]) L1('cltfence', a, b, { v: 0, block: true });
  // B: the square, the market, the shrine, the houses on the main street, the willow bank
  L1('stall', 47, 49, { fp: [2, 1], v: 0, block: true }); L1('hdsstall', 51, 49, { fp: [2, 1], v: 1, block: true }); L1('hdscrates', 53, 50, { v: 0, block: true }); L1('shrine', 52, 46, { v: 0, block: true });
  F.lamps.push([46, 46], [53, 46]); for (const [a, b] of [[46, 46], [53, 46]]) { L1('hpslantern', a, b, { v: a & 1, block: true }); LT(a, b, 44, '255,214,140'); }
  L1('hut', 45, 49, { fp: [2, 2], v: 0, block: true }); F.chimneys.push([45.6, 49.6]); L1('tthhut', 54, 51, { fp: [2, 2], v: 1, block: true }); F.chimneys.push([54.6, 51.6]); L1('hdshut', 45, 42, { fp: [2, 1], v: 2, block: true });
  L1('tthwillow', 44, 46, { fp: [2, 2], v: 0, block: true }); L1('tthwillow', 44, 50, { fp: [2, 2], v: 1, block: true }); L1('tthwillow', 41, 45, { fp: [2, 2], v: 0, block: true }); L1('tthreeds', 42, 46, { v: 0, block: false }); L1('tthreeds', 44, 52, { v: 1, block: false });
  L1('cltwheel', 44, 45, { fp: [1, 1], v: 0, block: true }); L1('cltcart', 46, 51, { fp: [2, 1], v: 0, block: true }); L1('cltrack', 49, 51, { fp: [2, 1], v: 0, block: true });
  // D: pig pen, threshing yard, haystacks, scarecrows, fences, gardens, farm buildings in the east
  rect(58, 43, 60, 44, 1, M.CMUD); F.pen = [58.5, 43.5]; L1('cltpen', 58, 43, { fp: [3, 2], v: 0, block: true }); L1('tthhut', 62, 38, { fp: [2, 2], v: 0, block: true }); F.chimneys.push([62.6, 38.6]); L1('hdshut', 60, 49, { fp: [2, 1], v: 1, block: true });
  L1('cltcart', 62, 48, { fp: [2, 1], v: 1, block: true });
  for (const [a, b, v] of [[56, 46, 0], [55, 53, 1], [47, 55, 2], [49, 55, 0], [58, 49, 1]]) { const p = L1('clthay', a, b, { v, block: true }); if (p) F.hays.push([p.i, p.j]); }
  for (const [a, b] of [[38, 50], [38, 54], [59, 43], [63, 51], [58, 52], [63, 44]]) { const p = P('cltscare', a, b, { field: true, v: (a + b) & 1, block: false }); if (p) F.scare.push([a, b]); }
  for (const [a, b] of [[36, 49], [36, 53], [44, 48], [55, 55], [65, 47]]) L1('cltfence', a, b, { v: (a + b) & 1, block: true });
  L1('gate', 37, 46, { fp: [2, 1], v: 1, block: false }); F.flags.push([38, 46], [36, 48], [53, 45]);
  // E: the bamboo lane, the orchard, the hill and the earth-god shrine
  for (const [a, b] of [[50, 36], [53, 36], [55, 35], [57, 35], [58, 33], [60, 33], [60, 31], [62, 34], [63, 32]]) { const p = L1('bigbamboo', a, b, { v: (a + b) % 3, block: true, fp: [2, 2] }); if (p) F.bamboo.push([a, b]); }
  for (const [a, b] of [[48, 37], [52, 37], [56, 37], [59, 35], [61, 36], [57, 36]]) L1('bigpeach', a, b, { fp: [2, 2], v: (a + b) & 3, block: true });
  L1('shrine', 62, 30, { v: 1, block: true }); LT(62, 31, 70, '255,196,120', 'lantern'); L1('hpslantern', 61, 33, { v: 0, block: true }); F.lamps.push([61, 33]);
  // trees on the knolls and around the fields (decor); bamboo clumps and shrubs on the hills
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), r = hash2(i, j, 1810); if (RES[k] || PATHC[k] || !walkM(MAT[k]) || MAT[k] === M.CPADDY || MAT[k] === M.CRICE || MAT[k] === M.CFLAG) continue; if (r < 0.05 && H[k] >= 2) prop(r < 0.02 ? 'hmaple' : 'hpine', i, j, { v: Math.floor(r * 90) % 3, block: false }); else if (r < 0.1) prop('bush', i, j, { v: Math.floor(r * 100) % 6, block: false }); else if (r < 0.17) prop(r < 0.14 ? 'flowers' : 'tuft', i, j, { v: Math.floor(r * 77) % 6, block: false, flat: true }); }
  // ---- 6. posts
  Q('square', 49, 48, { cap: 8 }); Q('square', 50, 47, { cap: 8 }); Q('court', 53, 41, { cap: 8 }); Q('court', 51, 41, { cap: 8 }); Q('hall', 51, 40, { cap: 3, face: 'up' }); Q('well', 53, 43, { cap: 2, face: 'up' }); Q('threshold', 52, 43, { cap: 4, face: 'down' });
  for (const [a, b] of [[48, 50], [52, 50], [50, 48]]) Q('stall', a, b, { cap: 2, face: 'up' });
  Q('shrine', 52, 47, { cap: 2, face: 'up' }); Q('pen', 57, 44, { cap: 2, face: 'right' }); Q('pen', 61, 45, { cap: 2 }); Q('granary', 56, 40, { cap: 2, face: 'up' }); Q('cart', 46, 52, { cap: 2 }); Q('cart', 62, 49, { cap: 2 });
  Q('bridge', 42, 47, { cap: 2, face: 'right' }); Q('bridge', 44, 47, { cap: 2, face: 'left' }); Q('wash', 42, 49, { cap: 3, face: 'right' }); Q('wash', 44, 49, { cap: 3, face: 'left' }); Q('pond', 42, 45, { cap: 4 }); Q('pond', 44, 53, { cap: 4 }); Q('pond', 48, 56, { cap: 3 });
  Q('sluice', 60, 47, { cap: 1, face: 'right' }); Q('sluice', 62, 46, { cap: 1 }); Q('road_w', 38, 47, { cap: 4 }); Q('road_s', 48, 54, { cap: 4 }); Q('road_e', 55, 47, { cap: 4 }); Q('lane', 59, 36, { cap: 3 }); Q('shrine2', 62, 32, { cap: 2, face: 'up' });
  for (const [a, b] of [[40, 50], [40, 54], [41, 52], [38, 52], [39, 50], [38, 54]]) Q('rice', a, b, { cap: 2 }); for (const [a, b] of [[58, 45], [58, 52], [59, 53], [63, 46], [63, 52], [59, 47], [57, 51]]) Q('rice', a, b, { cap: 2 });
  for (const [a, b] of [[49, 53], [51, 53], [52, 52], [55, 52], [55, 51]]) Q('garden', a, b, { cap: 2 }); for (const [a, b] of [[47, 42], [49, 43], [57, 42], [55, 39]]) Q('home', a, b, { cap: 2 });
  for (const [a, b] of [[45, 48], [53, 51], [46, 44], [54, 49]]) Q('stroll', a, b, { cap: 3 });
  TWM.homes = TWM.homes || {}; TWM.homes.clt = { farmer: [49, 48], gao: [52, 41], son: [52, 41], child: [43, 49], vendor: [49, 49], _: [49, 48] };
};
window.TW_CLT_FINAL = function (X) {
  const { TWM, WALK, id, N } = X, F = TWM.clt; if (!F) return;
  const st = id(37, 47), seen = new Uint8Array(N * N), q = [st]; seen[st] = 1; for (let n = 0; n < q.length; n++) { const k = q[n], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (!seen[z] && TWM.BIO[z] === F.B && TWM.canStep(k, z)) { seen[z] = 1; q.push(z); } } }
  F.reach = seen; F.dropped = []; TWM.pois = TWM.pois.filter(p => { if (p.biome !== 'clt') return true; const k = id(Math.floor(p.x / 8), Math.floor(p.y / 8)); if (!seen[k]) F.dropped.push(p.kind + '@' + p.i + ',' + p.j); return seen[k]; });
};
if (typeof module !== 'undefined') module.exports = {};
