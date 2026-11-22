'use strict';
// ===== Tây Du Ký v2 — Đại Lôi Âm Tự on Linh Sơn: map build (world space; loaded before tw-map.js) =====
// The planner's lat region (x 102-122 / y 1-35, a tall strip on the east edge: Hoa Quả Sơn's east sea to the west, Ngũ Trang Quán to the south-west, the world rim north and east) becomes ONE holy mountain climbed from the south:
//   A  the foot of Linh Sơn (y 28-34, levels 7-8): pilgrim lawn, the holy stream, bodhi groves; the road enters from Ngũ Trang Quán at (113, 34) (level 7, matching its ledge at (113, 35))
//   B  the Mountain Gate terrace (y 22-27, level 10): the Linh Sơn gate, guardian statues, incense burners, bell post; the holy pool (level 8) lies west of it
//   C  the Arhat Court (y 14-21, levels 12-13): lotus pond, sutra pillars, the sutra pagoda, arhat seats; the sacred fall drops from the pond into the holy pool
//   D  the Great Hall terrace (y 2-13, levels 15-16): the Đại Hùng Bảo Điện (double size) behind the Tathagata's lotus dais, two lotus pools, burners, the great bell
// Everything else is blue-grey mountain wall (levels 11-19) with moss and pines. Stairs are explicit flights; every tier is joined by a wide stair (5-7 tiles).
window.TW_LAT_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, prop, poi, id, inMap, vnoise, hash2, addStair } = X;
  const B = TWM.bi.lat, inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B && MAT[id(i, j)] !== M.VOID, tile = (i, j) => inB(i, j) ? id(i, j) : -1;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let k = 0; k < N * N; k++) if (BIO[k] === B) { const i = k % N, j = Math.floor(k / N); x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  const mine = (i, j) => { i = Math.floor(i); j = Math.floor(j); return inMap(i, j) && BIO[id(i, j)] === B; };
  TWM.props = TWM.props.filter(p => !mine(p.i, p.j)); TWM.pois = TWM.pois.filter(p => p.biome !== 'lat'); TWM.lights = TWM.lights.filter(l => l.biome !== 'lat'); TWM.decals = TWM.decals.filter(d => !mine(d.i, d.j)); TWM.falls = TWM.falls.filter(f => !mine(f.i, f.j));
  for (const key of [...TWM.stairs.keys()]) { const [a, b] = key.split(',').map(Number); if (BIO[a] === B || BIO[b] === B) TWM.stairs.delete(key); } for (const key of [...TWM.stairAt.keys()]) if (BIO[key] === B) TWM.stairAt.delete(key);
  TWM.biomes[B].built = true;
  const F = TWM.lat = { B, x0, y0, x1, y1, tiles: [], entry: [113, 34], gate: null, hall: null, buddha: [114, 9], dais: [115.5, 10.5], court: [113, 17], kneel: [113, 13], lamps: [], burners: [], lotus: [], pools: [], flags: [], bells: [], trees: [], failed: [], sutra: [], fall: null };
  TWM.layout.lat = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  const FIX = new Uint8Array(N * N), set = (a, b, lv, mat) => { const k = tile(a, b); if (k < 0) return; H[k] = lv; MAT[k] = mat; FIX[k] = 1; PATHC[k] = 0; RES[k] = 0; };
  const rect = (a0, b0, a1, b1, lv, mat) => { for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) set(a, b, lv, mat); };
  // ---- 1. the mountain: zone level by row, then a rock wall beyond the terraces
  const zl = j => j >= 31 ? 7 : j >= 28 ? 8 : j >= 22 ? 10 : j === 21 ? 12 : j >= 14 ? 13 : j === 13 ? 15 : 16;
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) if (inB(i, j)) { const k = id(i, j); F.tiles.push(k); PATHC[k] = 0; RES[k] = 0; const n = vnoise(i * 0.35, j * 0.35, 1701), w = i < 105 ? 2 + Math.round((105 - i) * 0.6) : i > 119 ? 2 + Math.round((i - 119) * 0.8) : 3; H[k] = zl(j) + Math.max(1, w) + Math.round(n * 2); MAT[k] = n > 0.62 ? M.LMOSS : M.LROCK; }
  // ---- 2. the terraces
  rect(105, 31, 119, 34, 7, M.LLAWN); rect(105, 28, 119, 30, 8, M.LLAWN);                                     // A the foot of the mountain
  rect(109, 22, 119, 27, 10, M.LIVORY); rect(108, 21, 119, 21, 12, M.LIVORY);                                     // B the gate terrace (+ the landing)
  rect(105, 22, 108, 27, 8, M.POOL);                                                                              // the holy pool
  rect(110, 14, 119, 20, 13, M.LIVORY); rect(105, 19, 109, 20, 13, M.LIVORY);                                     // C the arhat court
  rect(105, 14, 109, 18, 12, M.POOL); rect(106, 19, 107, 21, 13, M.STREAM);                                       // the lotus pond and its overflow
  rect(108, 13, 119, 13, 15, M.LIVORY);                                                                           // the landing before the great terrace
  rect(105, 3, 120, 12, 16, M.LGOLD); rect(106, 2, 119, 2, 16, M.LGOLD);                                          // D the great hall terrace
  for (const [a, b] of [[109, 10], [110, 10], [109, 11], [110, 11], [120, 10], [119, 10], [120, 11], [119, 11]]) set(a, b, 15, M.POOL);   // lotus pools beside the dais
  for (let b = 3; b <= 12; b++) for (const a of [105, 120]) if (hash2(a, b, 1702) < 0.5) set(a, b, 16, M.LIVORY);
  // the Tathagata's lotus dais (level 17) and the broad road
  for (let b = 8; b <= 12; b++) for (let a = 111; a <= 119; a++) { const d = ((a + 0.5 - 115.5) / 3.6) ** 2 + ((b + 0.5 - 10.5) / 2.6) ** 2; if (d < 1) set(a, b, 17, M.LIVORY); }
  for (let b = 28; b <= 34; b++) for (let a = 112; a <= 114; a++) set(a, b, b >= 31 ? 7 : 8, M.LPATH);
  for (let b = 3; b <= 12; b++) for (let a = 112; a <= 114; a++) if (H[id(a, b)] === 16) MAT[id(a, b)] = M.LIVORY;
  // the Ngũ Trang Quán ledge at (112-114, 35-37) is a 5-tile pocket: two connector tiles (113, 37) and (113, 38) at level 7 join it to the ledge path at (112, 38) (the only change outside the region)
  { const ref = id(112, 38); for (const [a2, b2] of [[113, 37], [113, 38]]) { const k2 = id(a2, b2); H[k2] = 7; MAT[k2] = MAT[ref]; PATHC[k2] = 1; RES[k2] = 0; } TWM.props = TWM.props.filter(p => !((Math.floor(p.i) === 113) && (Math.floor(p.j) === 37 || Math.floor(p.j) === 38))); }
  // ---- 3. flights (wide stairs; the high tile lies behind the low one)
  const flight = (a0, a1, lowJ, highJ) => { for (let a = a0; a <= a1; a++) { const lo = tile(a, lowJ), hi = tile(a, highJ); if (lo < 0 || hi < 0) continue; addStair(lo, hi); PATHC[lo] = PATHC[hi] = 1; } };
  flight(110, 116, 28, 27); flight(110, 116, 22, 21); flight(110, 116, 14, 13); flight(111, 115, 13, 12);
  // the dais steps: three one-level rings (16 -> 17) are joined below
  for (let k = 0; k < N * N; k++) { if (BIO[k] !== B) continue; const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [0, 1]]) { const z = id(i + da, j + db); if (BIO[z] !== B || !FIX[k] || !FIX[z]) continue; const wk = q => MAT[q] === M.LIVORY || MAT[q] === M.LGOLD || MAT[q] === M.LLAWN || MAT[q] === M.LPATH; if (wk(k) && wk(z) && Math.abs(H[k] - H[z]) === 1) { TWM.stairs.set(k + ',' + z, 1); TWM.stairs.set(z + ',' + k, 1); } } }
  // ---- 4. water: the holy pool, the lotus pond, the fall from the pond into the pool, the outflow stream
  TWM.water.push({ type: 'ell', c: [107, 24.5], rx: 2.4, ry: 3, mat: M.POOL }); TWM.water.push({ type: 'ell', c: [107.5, 16.5], rx: 2.5, ry: 2.5, mat: M.POOL });
  for (const [a, b] of [[104, 27], [104, 28], [104, 29], [103, 29], [103, 30]]) set(a, b, a === 104 && b === 27 ? 8 : 7, M.STREAM);
  TWM.water.push({ type: 'line', pts: [[104.5, 27.5], [104.5, 29.5], [103.5, 29.5], [103.5, 31]], w: 1.1, mat: M.STREAM });
  TWM.falls.push({ biome: 'lat', i: 106, j: 21, w: 2, top: 13, bottom: 8 }); F.fall = [106, 21];
  // ---- 5. props
  const P = (kind, a, b, o) => { o = o || {}; const fw = o.fp ? o.fp[0] : 1, fh = o.fp ? o.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) { const z = tile(a + r, b + q); if (z < 0 || PATHC[z] || MAT[z] === M.LROCK || MAT[z] === M.LMOSS || MAT[z] === M.POOL || MAT[z] === M.STREAM) { if (!(o.water && z >= 0)) return null; } } return prop(kind, a, b, o); };
  const L1 = (kind, a, b, o) => { let p = P(kind, a, b, o); if (!p) for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) { p = P(kind, a + da, b + db, o); if (p) break; } if (!p) F.failed.push(kind + '@' + a + ',' + b); return p; };
  const walkM = m => m === M.LIVORY || m === M.LGOLD || m === M.LLAWN || m === M.LPATH;
  const blocked = new Set(); const rb = () => { blocked.clear(); for (const p of TWM.props) if (p.block && mine(p.i, p.j)) { const fw = p.fp ? p.fp[0] : 1, fh = p.fp ? p.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) blocked.add(id(p.i + r, p.j + q)); } };
  const snap = (a, b, r) => { rb(); for (let q = 0; q <= (r === undefined ? 2 : r); q++) for (let dj = -q; dj <= q; dj++) for (let di = -q; di <= q; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== q) continue; const k = tile(a + di, b + dj); if (k >= 0 && walkM(MAT[k]) && !blocked.has(k) && !PATHC[k]) return [a + di, b + dj]; } return null; };
  const Q = (kind, a, b, o) => { const s = snap(a, b, 2); if (!s) { F.failed.push('poi:' + kind + '@' + a + ',' + b); return null; } const p = poi(kind, 'lat', s[0], s[1], o); if (p) RES[id(s[0], s[1])] = 1; return p; };
  const LT = (a, b, r, col, kind) => TWM.lights.push({ biome: 'lat', i: a, j: b, r, col, kind: kind || 'lantern' });
  // D: the Great Hall (a PixelLab object, drawn at twice its size) and the Tathagata on his lotus dais
  F.hall = L1('lathall', 106, 3, { fp: [8, 3], block: true, v: 0 }); LT(110, 5, 170, '255,214,130', 'magic'); LT(107, 5, 70, '255,170,80'); LT(113, 5, 70, '255,170,80');
  F.buddhaP = prop('buddha', 114, 9, { fp: [3, 3], v: 0, block: true }); LT(115, 10, 200, '255,236,170', 'magic');
  for (const [a, b] of [[111, 8], [120, 8]]) { if (L1('hpsburner', a, b, { v: 0, block: true })) { F.burners.push([a, b]); LT(a, b, 50, '255,190,110', 'fire'); } }
  for (const [a, b] of [[105, 5], [120, 5]]) { if (L1('hpsbell', a, b, { v: a & 1, block: true })) F.bells.push([a, b]); }
  for (const [a, b] of [[106, 8], [120, 12], [106, 12], [109, 12], [118, 12], [113, 8]]) { if (L1('hpslantern', a, b, { v: a & 1, block: true })) { F.lamps.push([a, b]); LT(a, b, 46, '255,214,140'); } }
  for (const [a, b] of [[109, 10], [110, 11], [120, 10], [119, 11]]) { prop('plotus', a, b, { v: (a + b) & 1, block: false, water: true }); F.lotus.push([a, b]); }
  // C: the arhat court: sutra pillars, the sutra pagoda, statues, lotus pond
  for (const [a, b] of [[110, 15], [110, 18]]) { if (L1('hpssutra', a, b, { v: a & 1, block: true })) F.sutra.push([a, b]); }
  F.pagoda = L1('hpspagoda', 118, 19, { fp: [2, 2], block: true }); L1('hpsstupa', 111, 19, { v: 0, block: true });
  for (const [a, b] of [[110, 17], [110, 19], [119, 16], [119, 18]]) L1('statue', a, b, { v: (a + b) & 1, block: true });
  for (const [a, b] of [[107, 15], [108, 17], [106, 16], [108, 15], [106, 18]]) { prop('plotus', a, b, { v: (a + b) & 1, block: false, water: true }); F.lotus.push([a, b]); }
  for (const [a, b] of [[111, 20], [116, 20], [110, 14]]) { if (L1('hpslantern', a, b, { v: a & 1, block: true })) { F.lamps.push([a, b]); LT(a, b, 46, '255,214,140'); } }
  // B: the Linh Sơn gate (a PixelLab object), guardians, burners, bell post
  F.gate = L1('latgate', 110, 25, { fp: [7, 2], piers: [[0, 1], [1, 1], [5, 0], [6, 0]], v: 0 });
  for (const [a, b] of [[109, 27], [119, 27]]) L1('statue', a, b, { v: a & 1, block: true });
  for (const [a, b] of [[112, 23], [116, 23]]) { if (L1('hpsburner', a, b, { v: 1, block: true })) { F.burners.push([a, b]); LT(a, b, 50, '255,190,110', 'fire'); } }
  for (const [a, b] of [[110, 22], [118, 22], [111, 27], [117, 27]]) { if (L1('hpslantern', a, b, { v: a & 1, block: true })) { F.lamps.push([a, b]); LT(a, b, 46, '255,214,140'); } }
  prop('plotus', 106, 24, { v: 0, block: false, water: true }); prop('plotus', 107, 26, { v: 1, block: false, water: true }); F.lotus.push([106, 24], [107, 26]);
  // A: the pilgrims' foot: wayshrines, lanterns, a stupa, bodhi and pine groves, boulders
  for (const [a, b] of [[111, 30], [115, 30], [111, 33], [115, 33]]) { if (L1('hpslantern', a, b, { v: a & 1, block: true })) { F.lamps.push([a, b]); LT(a, b, 44, '255,214,140'); } }
  L1('hpswayshrine', 117, 31, { v: 0, block: true }); L1('hpsstupa', 108, 30, { v: 1, block: true }); L1('hpsburner', 110, 28, { v: 0, block: true }); F.burners.push([110, 28]);
  for (const [a, b] of [[117, 33], [118, 29], [106, 32], [107, 29], [119, 31], [105, 30], [116, 28]]) { const p = L1(a & 1 ? 'hpsmaple' : 'hpspine', a, b, { v: (a + b) % 3, block: true }); if (p) F.trees.push([a, b]); }
  for (const [a, b] of [[109, 33], [118, 31]]) L1('hpsrock', a, b, { v: a & 1, block: true });
  // the mountain wall: pines and boulders on the rim and the slopes (decor, not blocking)
  for (let n = 0; n < F.tiles.length; n++) { const k = F.tiles[n], i = k % N, j = Math.floor(k / N); if (MAT[k] !== M.LROCK && MAT[k] !== M.LMOSS) continue; const r = hash2(i, j, 1710); if (r < 0.09) prop(r < 0.05 ? 'hpspine' : 'hpsmaple', i, j, { v: Math.floor(r * 100) % 3, block: false }); else if (r < 0.13) prop('hpsrock', i, j, { v: Math.floor(r * 77) & 1, block: false }); }
  // ---- 6. posts
  Q('court', 113, 17, { cap: 15 }); Q('hall', 113, 12, { cap: 12, face: 'up' }); Q('threshold', 113, 25, { cap: 6, face: 'up' }); Q('foot', 113, 32, { cap: 8 });
  for (const [a, b] of [[111, 13], [112, 13], [113, 13], [114, 13], [115, 13]]) Q('kneel', a, b, { cap: 1, face: 'up' });
  for (const [a, b] of [[110, 17], [110, 19], [119, 17], [119, 19], [111, 15], [118, 18]]) Q('luohan', a, b, { cap: 1, face: 'down' });
  for (const [a, b] of [[108, 8], [119, 7], [112, 8], [118, 12]]) Q('dharma', a, b, { cap: 2, face: 'up' });
  for (const [a, b] of [[109, 24], [117, 25]]) Q('incense', a, b, { cap: 2, face: 'up' });
  for (const [a, b] of [[111, 29], [115, 29], [113, 30]]) Q('pilgrim', a, b, { cap: 3, face: 'up' });
  for (const [a, b] of [[111, 23], [118, 24]]) Q('bellpost', a, b, { cap: 1, face: 'up' });
  for (const [a, b] of [[116, 32], [109, 32]]) Q('bodhi', a, b, { cap: 2, face: 'up' });
  for (const [a, b] of [[106, 11], [120, 12], [116, 4], [117, 6]]) Q('sweep', a, b, { cap: 2 });
  F.flags = [[105, 7], [120, 6], [109, 26], [119, 26], [110, 21], [119, 21], [112, 28], [115, 28]]; F.rim = [];
  TWM.homes = TWM.homes || {}; TWM.homes.lat = { monk: [113, 17], arhat: [113, 17], elder: [113, 12], pilgrim: [113, 31], _: [113, 17] };
};
window.TW_LAT_FINAL = function (X) {
  const { TWM, WALK, id, N } = X, F = TWM.lat; if (!F) return; const M = TWM.M;
  for (const k of F.tiles) { const m = TWM.MAT[k]; if (m === M.LROCK || m === M.LMOSS) WALK[k] = 0; }
  const st = id(113, 34), seen = new Uint8Array(N * N), q = [st]; seen[st] = 1; for (let n = 0; n < q.length; n++) { const k = q[n], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (!seen[z] && TWM.BIO[z] === F.B && TWM.canStep(k, z)) { seen[z] = 1; q.push(z); } } }
  F.reach = seen; F.dropped = []; TWM.pois = TWM.pois.filter(p => { if (p.biome !== 'lat') return true; const k = id(Math.floor(p.x / 8), Math.floor(p.y / 8)); if (!seen[k]) F.dropped.push(p.kind + '@' + p.i + ',' + p.j); return seen[k]; });
  F.link = TWM.canStep(id(113, 35), id(113, 34)) || TWM.canStep(id(113, 34), id(113, 35));
};
if (typeof module !== 'undefined') module.exports = {};
