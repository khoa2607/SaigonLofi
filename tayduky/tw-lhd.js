'use strict';
// ===== Tây Du Ký v2 — Liên Hoa Động (Lotus Cave): map build (world space; loaded before tw-map.js) =====
// The planner's lhd region (x 30-74 / y 56-85, a tall pine ridge south of Cao Lão Trang that opens into a wide basin along the Sư Đà Lĩnh border) becomes ONE demon mountain, entered from the north and walked south and east:
//   A  the pine approach (y 56-61): foothills, wayside shrine, the demon sentries' lookout, the road comes in from Cao Lão Trang at (48, 56) (level 1)
//   B  the canyon (y 62-69, level 2-3, walls 7-9): a stream falls off the east wall and crosses the road under a natural stone bridge; the west pocket pool is its end
//   C  the patrol yard (y 66-71, level 4) and the demon courtyard below it (y 72-83, level 3): tents, racks, braziers, the captive cage, the lotus gate
//   D  the cave massif (x 38-45, y 70-83, levels 8-12) with the monumental Lotus Cave mouth (a painted landmark) at its foot facing the courtyard
//   E  the inner halls along the south basin (x 56-74): the sunken arena (level 2, steps), the treasure chamber (level 4: the hoard, the gourd, the jade bottle, the rope, the sword), the east ledge up to Hắc Phong Sơn at (74, 81)
// Materials 180-187 (see tw-lhd-art.js). The old trail tiles that join the neighbours (NE ramp to the palm, east end, west end, south-west end) are kept.
window.TW_LHD_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, prop, poi, id, inMap, vnoise, hash2, addStair } = X;
  Object.assign(M, { LRFLOOR: 180, LRROCK: 181, LRPATH: 182, LRPINE: 183, LRTREAS: 184, LRSAND: 185, LRCRYS: 186, LRMOSS: 187 });
  const B = TWM.bi.lhd, inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B && MAT[id(i, j)] !== M.VOID, tile = (i, j) => inB(i, j) ? id(i, j) : -1;
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let k = 0; k < N * N; k++) if (BIO[k] === B) { const i = k % N, j = Math.floor(k / N); x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  const mine = (i, j) => { i = Math.floor(i); j = Math.floor(j); return inMap(i, j) && BIO[id(i, j)] === B; };
  // the old link tiles (trail) and whatever joins another biome stay exactly as they are
  const KEEP = new Uint8Array(N * N); for (let k = 0; k < N * N; k++) { if (BIO[k] !== B) continue; const i = k % N, j = Math.floor(k / N); }
  TWM.props = TWM.props.filter(p => !mine(p.i, p.j)); TWM.pois = TWM.pois.filter(p => p.biome !== 'lhd'); TWM.lights = TWM.lights.filter(l => l.biome !== 'lhd'); TWM.decals = TWM.decals.filter(d => !mine(d.i, d.j)); TWM.falls = TWM.falls.filter(f => !mine(f.i, f.j));
  for (const key of [...TWM.stairs.keys()]) { const [a, b] = key.split(',').map(Number); if (BIO[a] === B && BIO[b] === B) TWM.stairs.delete(key); } for (const key of [...TWM.stairAt.keys()]) if (BIO[key] === B && !KEEP[key]) TWM.stairAt.delete(key);
  TWM.biomes[B].built = true;
  const F = TWM.lhd = { B, x0, y0, x1, y1, tiles: [], entry: [48, 56], mouth: [47, 79], gate: [47, 73], yard: [48, 68], court: [49, 79], arena: [60, 80], treasure: [70, 80], hoard: [70, 79], gourd: [68, 78], bottle: [72, 78], rope: [70, 82], sword: [68, 82], cage: [52, 76], fall: [51, 65], pools: [], lamps: [], braziers: [], crystals: [], flags: [], bats: [], failed: [], reach: null, dropped: [], mists: [] };
  TWM.layout.lhd = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  const set = (a, b, lv, mat) => { const k = tile(a, b); if (k < 0 || KEEP[k]) return; H[k] = lv; MAT[k] = mat; PATHC[k] = 0; RES[k] = 0; };
  const rect = (a0, b0, a1, b1, lv, mat) => { for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) set(a, b, lv, mat); };
  const path = (pts, mat) => { for (let n = 0; n + 1 < pts.length; n++) { const [a, b] = pts[n], [c, d] = pts[n + 1], st = Math.max(Math.abs(c - a), Math.abs(d - b), 1); for (let s = 0; s <= st; s++) { const i = Math.round(a + (c - a) * s / st), j = Math.round(b + (d - b) * s / st), k = tile(i, j); if (k < 0 || KEEP[k]) continue; MAT[k] = mat; PATHC[k] = 1; } } };
  // ---- 1. the mountain: everything starts as rock; levels rise with the distance from the road, with noise
  for (let k = 0; k < N * N; k++) { if (BIO[k] !== B) continue; const i = k % N, j = Math.floor(k / N); F.tiles.push(k); if (KEEP[k]) continue; const n = vnoise(i * 0.35, j * 0.35, 1901); RES[k] = 0; PATHC[k] = 0; H[k] = 6 + Math.round(n * 3) + (j > 76 && i < 46 ? 4 : 0) + (i < 43 || i > 53 ? 1 : 0); MAT[k] = n > 0.6 ? M.LRMOSS : M.LRROCK; }
  // ---- 2. zones
  rect(44, 56, 52, 57, 1, M.LRPINE); rect(43, 58, 54, 61, 2, M.LRPINE); rect(41, 58, 42, 61, 3, M.LRMOSS); rect(55, 59, 55, 61, 3, M.LRMOSS);                     // A approach
  rect(46, 62, 51, 65, 3, M.LRSAND); rect(45, 62, 45, 69, 6, M.LRMOSS); rect(52, 62, 52, 69, 7, M.LRROCK); rect(46, 66, 51, 69, 3, M.LRPATH);                   // B canyon
  rect(43, 66, 44, 67, 3, M.POOL); rect(44, 66, 46, 66, 3, M.STREAM); TWM.water.push({ type: 'ell', c: [44, 67], rx: 1.8, ry: 1.5, mat: M.POOL }); F.pools.push([43.5, 67]);
  rect(47, 64, 51, 64, 3, M.STREAM); rect(50, 65, 51, 65, 3, M.STREAM); TWM.falls.push({ biome: 'lhd', i: 51, j: 63, w: 1, top: 8, bottom: 3 }); rect(51, 62, 52, 63, 8, M.POOL);
  rect(43, 70, 53, 71, 4, M.LRPATH); rect(44, 72, 53, 72, 4, M.LRPATH);                                                                                       // C patrol yard
  rect(42, 73, 53, 76, 3, M.LRPATH); rect(46, 77, 56, 83, 3, M.LRPATH); rect(47, 82, 56, 83, 3, M.LRFLOOR);                                                  // the demon courtyard
  rect(38, 77, 41, 82, 10, M.LRROCK); rect(41, 70, 42, 76, 9, M.LRROCK); rect(42, 77, 42, 82, 9, M.LRROCK); rect(43, 77, 48, 79, 3, M.LRPATH);                                                                                      // D the massif
  rect(57, 77, 74, 83, 7, M.LRFLOOR); rect(56, 79, 56, 81, 5, M.LRPATH);                                                                                                                          // E the inner halls
  rect(57, 78, 63, 82, 7, M.LRFLOOR); rect(58, 79, 62, 81, 7, M.LRCRYS);                                                                                       // the sunken arena
  rect(66, 77, 73, 83, 7, M.LRTREAS); rect(68, 79, 71, 81, 8, M.LRTREAS);                                                                                      // the treasure chamber and its dais
  rect(57, 76, 66, 76, 9, M.LRROCK); rect(58, 84, 73, 84, 6, M.LRROCK);
  // the courtyard's south edge and the west tail toward Bàn Tơ Động / Hỏa Diệm Sơn (kept link tiles at (30, 83) and (34, 85))
  rect(31, 83, 40, 83, 1, M.LRSAND); rect(32, 84, 39, 84, 1, M.LRSAND); rect(41, 83, 45, 83, 3, M.LRPATH); path([[31, 83], [40, 83]], M.LRPATH); path([[41, 83], [46, 83]], M.LRPATH); path([[34, 85], [35, 84], [36, 83]], M.LRPATH);
  // ---- 3. the road: CLT (48, 56) -> approach -> canyon bridge -> yard -> down to the courtyard -> east to the halls -> the east ledge (74, 81)
  path([[48, 56], [48, 60], [48, 63]], M.LRPATH); path([[48, 63], [48, 69]], M.LRPATH); path([[48, 70], [48, 72]], M.LRPATH); path([[47, 74], [49, 79], [56, 80]], M.LRPATH); path([[56, 80], [62, 80], [66, 80], [72, 80], [74, 81]], M.LRPATH);
  { const k = tile(48, 64); MAT[k] = M.BRIDGE; PATHC[k] = 1; H[k] = 3; } { const k = tile(48, 66); if (MAT[k] === M.STREAM) { MAT[k] = M.BRIDGE; PATHC[k] = 1; } }
  for (let a = 47; a <= 49; a++) { rect(a, 64, a, 64, 3, M.STREAM); } { const k = tile(48, 64); MAT[k] = M.BRIDGE; PATHC[k] = 1; } rect(46, 64, 46, 64, 3, M.STREAM); rect(50, 64, 50, 64, 3, M.STREAM);
  // flights (the high tile behind the low one): canyon -> yard (level 3 -> 4), yard -> courtyard is a drop of one (4 -> 3); the arena steps; the dais steps
  const flight = (a0, a1, lowJ, highJ) => { for (let a = a0; a <= a1; a++) { const lo = tile(a, lowJ), hi = tile(a, highJ); if (lo < 0 || hi < 0) continue; addStair(lo, hi); PATHC[lo] = PATHC[hi] = 1; } };
  flight(47, 49, 69, 70); { for (let a = 46; a <= 50; a++) { const lo = tile(a, 73), hi = tile(a, 72); if (lo >= 0 && hi >= 0 && H[hi] - H[lo] === 1) { addStair(lo, hi); PATHC[lo] = PATHC[hi] = 1; } } }
  const step = (lo, hi) => { const a = lo, b = hi; if (a >= 0 && b >= 0) { addStair(a, b); PATHC[a] = PATHC[b] = 1; } };
  step(tile(67, 80), tile(68, 80)); step(tile(72, 80), tile(71, 80)); 
  step(tile(40, 83), tile(41, 83));
  // the links to the neighbours (their old gate trails ended in this region): north-east ramp up to the palm wrist, the east ledge to Hắc Phong Sơn, the west end to Bàn Tơ Động and the south-west end to Hỏa Diệm Sơn
  set(55, 58, 3, M.LRPATH); set(56, 58, 4, M.LRPATH); set(57, 58, 5, M.LRPATH); set(58, 58, 6, M.LRPATH); path([[54, 58], [58, 58]], M.LRPATH); set(30, 83, 2, M.LRPATH); set(74, 81, 5, M.LRPATH); set(73, 81, 6, M.LRPATH); path([[72, 80], [72, 81], [73, 81], [74, 81]], M.LRPATH); path([[30, 83], [31, 83]], M.LRPATH); set(34, 85, 1, M.LRPATH); path([[34, 85], [35, 84]], M.LRPATH);
  addStair(tile(58, 58), id(59, 58)); addStair(tile(74, 81), id(75, 81)); PATHC[tile(58, 58)] = PATHC[tile(74, 81)] = 1;
  // every pair of neighbouring road tiles at different levels is a stair (the lower tile links to the higher one)
  for (const k of F.tiles) { if (!PATHC[k]) continue; const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [0, 1]]) { const z = tile(i + da, j + db); if (z < 0 || !PATHC[z] || H[z] === H[k] || Math.abs(H[z] - H[k]) > 3) continue; if (TWM.stairs.has(k + ',' + z)) continue; if (H[k] < H[z]) addStair(k, z); else addStair(z, k); } }
  // ---- 4. props
  const P = (kind, a, b, o) => { o = o || {}; const fw = o.fp ? o.fp[0] : 1, fh = o.fp ? o.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) { const z = tile(a + r, b + q); if (z < 0 || PATHC[z] || KEEP[z] || ((MAT[z] === M.LRROCK || MAT[z] === M.LRMOSS) && !o.rock) || MAT[z] === M.POOL || MAT[z] === M.STREAM || MAT[z] === M.BRIDGE) return null; } return prop(kind, a, b, o); };
  const L1 = (kind, a, b, o) => { let p = P(kind, a, b, o); if (!p) for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, -1], [-1, 1]]) { p = P(kind, a + da, b + db, o); if (p) break; } if (!p) F.failed.push(kind + '@' + a + ',' + b); return p; };
  const walkM = m => m === M.LRFLOOR || m === M.LRPATH || m === M.LRPINE || m === M.LRTREAS || m === M.LRSAND || m === M.LRCRYS || m === M.TRAIL;
  const blocked = new Set(); const rb = () => { blocked.clear(); for (const p of TWM.props) if (p.block && mine(p.i, p.j)) { const fw = p.fp ? p.fp[0] : 1, fh = p.fp ? p.fp[1] : 1; if (p.piers) { for (const [da, db] of p.piers) blocked.add(id(p.i + da, p.j + db)); continue; } for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) blocked.add(id(p.i + r, p.j + q)); } };
  const snap = (a, b, r) => { rb(); for (let q = 0; q <= (r === undefined ? 2 : r); q++) for (let dj = -q; dj <= q; dj++) for (let di = -q; di <= q; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== q) continue; const k = tile(a + di, b + dj); if (k >= 0 && walkM(MAT[k]) && !blocked.has(k)) return [a + di, b + dj]; } return null; };
  const Q = (kind, a, b, o) => { const s = snap(a, b, 2); if (!s) { F.failed.push('poi:' + kind + '@' + a + ',' + b); return null; } const p = poi(kind, 'lhd', s[0], s[1], o); if (p) RES[id(s[0], s[1])] = 1; return p; };
  const LT = (a, b, r, col, kind) => TWM.lights.push({ biome: 'lhd', i: a, j: b, r, col, kind: kind || 'fire' });
  // D: the Lotus Cave mouth (a painted landmark, double size) at the foot of the massif, facing the courtyard
  F.mouthP = prop('lhdmouth', 43, 77, { fp: [6, 2], block: true, v: 0, piers: [[0, 0], [1, 0], [0, 1], [1, 1], [4, 0], [5, 0], [4, 1], [5, 1]] }); LT(47, 79, 160, '255,170,90', 'magic');
  // A: the approach: a wayside shrine, the sentries' lookout, pines and boulders
  L1('hpswayshrine', 46, 58, { v: 1, block: true }); L1('sdltent', 52, 59, { fp: [2, 2], v: 0, block: true }); for (const [a, b] of [[44, 57], [53, 57], [43, 60], [54, 60], [45, 60], [51, 61]]) L1('hpspine', a, b, { v: (a + b) % 3, block: true });
  for (const [a, b] of [[44, 59], [50, 58], [53, 61]]) L1('hpsrock', a, b, { v: a & 1, block: true }); L1('sdlbanner', 49, 59, { v: 0, block: true }); F.flags.push([49, 59]);
  // B: the canyon: rocks, a leaning pine, the pool lotus, the watch fire
  for (const [a, b] of [[47, 65], [50, 67], [46, 68], [51, 68]]) L1('hpsrock', a, b, { v: a & 1, block: true }); L1('hvdbrazier', 50, 69, { v: 0, block: true }); F.braziers.push([50, 69]); LT(50, 69, 60, '255,170,80');
  prop('plotus', 43, 67, { v: 0, block: false, water: true }); prop('plotus', 44, 67, { v: 1, block: false, water: true });
  // C: the patrol yard and the demon courtyard
  F.cageP = L1('sdlcage', 51, 75, { v: 0, block: true }); for (const [a, b] of [[44, 71], [52, 71], [44, 74], [53, 74], [49, 73], [47, 76]]) { const p = L1(a & 1 ? 'hvdbrazier' : 'sdlbanner', a, b, { v: 1, block: true }); if (p && p.kind === 'hvdbrazier') { F.braziers.push([p.i, p.j]); LT(p.i, p.j, 56, '255,170,80'); } else if (p) F.flags.push([p.i, p.j]); }
  L1('sdlrack', 45, 70, { fp: [2, 1], v: 0, block: true }); L1('sdlrack', 51, 70, { fp: [2, 1], v: 1, block: true }); L1('sdltent', 43, 73, { fp: [2, 2], v: 1, block: true }); L1('sdlcrates', 52, 72, { v: 0, block: true }); L1('dummy', 49, 71, { v: 0, block: true }); L1('dummy', 51, 72, { v: 1, block: true });
  for (const [a, b] of [[48, 80], [52, 79], [54, 82], [50, 82], [55, 78]]) { const p = L1(a & 1 ? 'hvdbrazier' : 'hpslantern', a, b, { v: a & 1, block: true }); if (p) { F.lamps.push([p.i, p.j]); LT(p.i, p.j, 50, '255,176,90'); if (p.kind === 'hvdbrazier') F.braziers.push([p.i, p.j]); } }
  // E: the inner halls: crystals, the arena runes (a painted ring), the treasure: hoard, the gourd, the jade bottle, the rope, the sword; the demon throne
  F.hoardP = L1('lhdhoard', 69, 77, { fp: [3, 2], v: 0, block: true }); F.gourdP = L1('lhdgourd', 67, 79, { v: 0, block: true }); F.bottleP = L1('lhdbottle', 72, 79, { v: 0, block: true }); F.ropeP = L1('lhdrope', 70, 82, { v: 0, block: true }); F.swordP = L1('lhdsword', 68, 82, { v: 0, block: true }); F.throneP = L1('btthrone', 66, 77, { fp: [2, 2], v: 0, block: true });
  for (const [a, b] of [[58, 83], [72, 83]]) { const p = L1('bcrys', a, b, { v: (a + b) % 3, block: true }); if (p) { F.crystals.push([p.i, p.j]); LT(p.i, p.j, 54, '150,140,255', 'magic'); } }
  for (const [a, b] of [[67, 77], [73, 79], [66, 83], [73, 82]]) { const p = L1('hvdbrazier', a, b, { v: 1, block: true }); if (p) { F.braziers.push([p.i, p.j]); LT(p.i, p.j, 60, '255,170,80'); } }
  for (const [a, b] of [[58, 77], [61, 77], [59, 83], [62, 83]]) F.crystals.push([a, b]);
  L1('rockarch', 56, 78, { fp: [2, 2], v: 0, block: true, piers: [[0, 0], [1, 1]] });
  // the mountain: pines, boulders and crags on the rock (decor)
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); if (MAT[k] !== M.LRROCK && MAT[k] !== M.LRMOSS) continue; if (i >= 55 && j >= 74) continue; const r = hash2(i, j, 1910); if (r < 0.06) prop(r < 0.03 ? 'hpspine' : 'sdlpine', i, j, { v: Math.floor(r * 100) % 3, block: false }); else if (r < 0.1) prop(r < 0.085 ? 'hpsrock' : 'brock', i, j, { v: Math.floor(r * 77) & 1, block: false }); }
  // ---- 5. posts
  Q('road_n', 48, 57, { cap: 4 }); Q('lookout', 51, 60, { cap: 2, face: 'down' }); Q('patrol', 48, 61, { cap: 3 }); Q('patrol', 48, 67, { cap: 3 }); Q('patrol', 48, 72, { cap: 3 }); Q('patrol', 50, 79, { cap: 3 }); Q('patrol', 61, 80, { cap: 3 });
  Q('yard', 47, 71, { cap: 6 }); Q('yard', 50, 71, { cap: 6 }); Q('train', 49, 72, { cap: 3, face: 'up' }); Q('train', 51, 73, { cap: 3, face: 'up' }); Q('rack', 46, 71, { cap: 2, face: 'up' }); Q('rack', 52, 71, { cap: 2, face: 'up' }); Q('cage', 51, 76, { cap: 1, face: 'up' });
  Q('court', 49, 79, { cap: 8 }); Q('court', 52, 80, { cap: 8 }); Q('mouth', 48, 80, { cap: 4, face: 'up' }); Q('mouth', 50, 80, { cap: 4, face: 'up' }); Q('lotus_gate', 47, 73, { cap: 4 }); Q('brazier', 49, 70, { cap: 2, face: 'up' });
  Q('arena', 62, 80, { cap: 10 }); Q('arena', 60, 80, { cap: 10 }); Q('arena', 64, 80, { cap: 10 }); Q('throne', 66, 79, { cap: 1, face: 'down' }); Q('hoard', 70, 78, { cap: 3, face: 'up' }); Q('treasure', 69, 81, { cap: 4 }); Q('treasure', 71, 81, { cap: 4 }); Q('altar', 68, 80, { cap: 2, face: 'up' }); Q('altar', 72, 80, { cap: 2, face: 'up' });
  Q('crystal', 58, 79, { cap: 2, face: 'up' }); Q('crystal', 62, 81, { cap: 2, face: 'up' }); Q('ritual', 60, 80, { cap: 6 }); Q('hall', 57, 80, { cap: 4 }); Q('pool', 45, 66, { cap: 2, face: 'left' }); Q('west', 40, 83, { cap: 3 }); Q('east', 73, 81, { cap: 3 }); Q('sw', 35, 84, { cap: 2 });
  TWM.homes = TWM.homes || {}; TWM.homes.lhd = { guard: [48, 72], sentry: [48, 61], servant: [49, 79], officer: [49, 71], king: [66, 79], _: [49, 79] };
};
window.TW_LHD_FINAL = function (X) {
  const { TWM, WALK, id, N } = X, F = TWM.lhd; if (!F) return; const M = TWM.M;
  for (const k of F.tiles) { const m = TWM.MAT[k]; if ((m === M.LRROCK || m === M.LRMOSS) && !TWM.PATHC[k]) WALK[k] = 0; }
  const st = id(48, 56), seen = new Uint8Array(N * N), q = [st]; seen[st] = 1; for (let n = 0; n < q.length; n++) { const k = q[n], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (!seen[z] && TWM.BIO[z] === F.B && TWM.canStep(k, z)) { seen[z] = 1; q.push(z); } } }
  F.reach = seen; F.dropped = []; TWM.pois = TWM.pois.filter(p => { if (p.biome !== 'lhd') return true; const k = id(Math.floor(p.x / 8), Math.floor(p.y / 8)); if (!seen[k]) F.dropped.push(p.kind + '@' + p.i + ',' + p.j); return seen[k]; });
};
if (typeof module !== 'undefined') module.exports = {};
