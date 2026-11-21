'use strict';
// ===== Tây Du Ký v2 — Thiên Cung rework: map (world space; loaded before tw-map.js; runs after the pilot Thiên Cung and the layout pass) =====
// The pilot terrain (three jade courts stepping 7 / 5 / 3 plus the bronze furnace terrace and the south causeway) is kept because it is wired into the world, but everything standing on it is re-planned as FOUR readable yards:
//   1 Nam Thiên Môn (the great south gate on the low plaza at the foot of the causeway)   2 the Court of Heaven (the ceremonial jade square, banners, pillars, braziers, the heavenly guard)
//   3 the Peach Garden (west terrace: eight divine peach trees, pavilion, banquet tables, fairies)   4 the Eight-Trigram Furnace precinct (east bronze terrace: the great kiln on a stepped dais, braziers, talisman pillars, Laojun's pavilion)
// plus the palace terrace in the north. Residents, minis and both signatures live in tw-tc2-data.js, the living effects in tw-tc2-fx.js.
window.TW_TC2_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, prop, poi, id, inMap, hash2, set, addStair } = X;
  const B = TWM.bi.tc, inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B && MAT[id(i, j)] !== M.VOID;
  const keep = new Set(['tcrail', 'tccloud', 'tcbridge', 'stairs']);
  const mine = (i, j) => { i = Math.floor(i); j = Math.floor(j); return inMap(i, j) && BIO[id(i, j)] === B; };
  TWM.props = TWM.props.filter(p => !mine(p.i, p.j) || keep.has(p.kind)); TWM.pois = TWM.pois.filter(p => p.biome !== 'tc'); TWM.lights = TWM.lights.filter(l => l.biome !== 'tc');
  const F = TWM.tc2 = { B, lamps: [], fires: [], peach: [], trees: [], pillars: [], flags: [], failed: [], gate: null, furnace: null, court: [27, 21], garden: [19, 23], dais: [36, 13] };
  // ---- terrain: real tiers (south plaza 3 -> court 5 -> ceremony terrace 8 -> the Linh Tiêu hall platform 10; garden 7; furnace yard 5 -> 7 -> ring 8 -> dais 9), a jade pond in the garden's west edge
  const ell = (ca, cb, ra, rb, fn) => { for (let b = Math.floor(cb - rb - 1); b <= cb + rb + 1; b++) for (let a = Math.floor(ca - ra - 1); a <= ca + ra + 1; a++) { const d = ((a + 0.5 - ca) / ra) ** 2 + ((b + 0.5 - cb) / rb) ** 2; if (inB(a, b) && d < 1) fn(a, b, d); } };
  for (let b = 13; b <= 15; b++) for (let a = 17; a <= 26; a++) if (inB(a, b)) set(a, b, 8, M.HEAVENPAVE);
  for (let b = 10; b <= 12; b++) for (let a = 19; a <= 26; a++) if (inB(a, b)) set(a, b, 10, M.HEAVENPAVE);
  for (let a = 21; a <= 24; a++) { addStair(id(a, 16), id(a, 15)); PATHC[id(a, 16)] = PATHC[id(a, 15)] = 1; }
  for (let a = 22; a <= 24; a++) { addStair(id(a, 13), id(a, 12)); PATHC[id(a, 13)] = PATHC[id(a, 12)] = 1; }
  ell(36.5, 12.5, 3.7, 2.7, (a, b) => set(a, b, 8, M.BRONZE)); ell(36.5, 12.5, 2.5, 1.8, (a, b) => set(a, b, 9, M.BRONZE)); for (let a = 35; a <= 37; a++) set(a, 14, 7, M.BRONZE);
  for (let b = 20; b <= 22; b++) for (let a = 14; a <= 15; a++) if (inB(a, b)) set(a, b, 6, M.POOL); TWM.water.push({ type: 'ell', c: [15.5, 21.5], rx: 1.5, ry: 2.2, mat: M.POOL });
  for (let k = 0; k < N * N; k++) { if (BIO[k] !== B || MAT[k] === M.VOID || MAT[k] === M.CLOUD || MAT[k] === M.POOL) continue; const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [0, 1]]) { const z = id(i + da, j + db); if (BIO[z] !== B || MAT[z] === M.CLOUD || MAT[z] === M.VOID || MAT[z] === M.POOL || MAT[z] === M.HEAVENBRIDGE || MAT[k] === M.HEAVENBRIDGE) continue; if (Math.abs(H[k] - H[z]) === 1 && !TWM.stairs.has(k + ',' + z)) { TWM.stairs.set(k + ',' + z, 1); TWM.stairs.set(z + ',' + k, 1); } } }
  const walk = m => m === M.HEAVENPAVE || m === M.HEAVEN || m === M.PEACHLAWN || m === M.BRONZE || m === M.HEAVENBRIDGE;
  const blocked = new Set(), rb = () => { blocked.clear(); for (const p of TWM.props) if (p.block && mine(p.i, p.j)) { const fw = p.fp ? p.fp[0] : 1, fh = p.fp ? p.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) blocked.add(id(p.i + r, p.j + q)); } };
  const free = (a, b) => inB(a, b) && walk(MAT[id(a, b)]) && !blocked.has(id(a, b));
  const P = (kind, a, b, o) => { o = o || {}; const fw = o.fp ? o.fp[0] : 1, fh = o.fp ? o.fp[1] : 1; rb(); for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) { if (!inB(a + r, b + q) || !walk(MAT[id(a + r, b + q)]) || blocked.has(id(a + r, b + q)) || (o.block && PATHC[id(a + r, b + q)])) return null; } return prop(kind, a, b, o); };
  const L1 = (kind, a, b, o) => { let p = P(kind, a, b, o); if (!p) for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) { p = P(kind, a + da, b + db, o); if (p) break; } if (!p) F.failed.push(kind + '@' + a + ',' + b); return p; };
  const snap = (a, b, r) => { rb(); for (let q = 0; q <= (r === undefined ? 2 : r); q++) for (let dj = -q; dj <= q; dj++) for (let di = -q; di <= q; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== q) continue; if (free(a + di, b + dj)) return [a + di, b + dj]; } return null; };
  const Q = (kind, a, b, o) => { const s = snap(a, b, 2); if (!s) { F.failed.push('poi:' + kind + '@' + a + ',' + b); return null; } const p = poi(kind, 'tc', s[0], s[1], o); if (p) RES[id(s[0], s[1])] = 1; return p; };
  const LT = (a, b, r, col, kind) => TWM.lights.push({ biome: 'tc', i: a, j: b, r, col, kind: kind || 'lantern' });
  // ---- 1. Nam Thiên Môn: the great gate across the south plaza, with lantern towers either side
  F.gate = L1('tcgate', 24, 26, { fp: [9, 2], piers: [[0, 1], [2, 1], [6, 0], [8, 0]], v: 0 });
  for (const [a, b] of [[24, 25], [32, 25]]) { if (L1('tclantern', a, b, { v: 1 })) { F.lamps.push([a, b]); LT(a, b, 64, '255,202,125'); } }
  for (const [a, b] of [[25, 28], [31, 28]]) if (L1('tcbrazier', a, b, { v: 0 })) { F.fires.push([a, b]); LT(a, b, 50, '255,159,80', 'fire'); }
  // ---- 2. the Court of Heaven
  for (const [a, b] of [[24, 19], [32, 19], [24, 23], [32, 23], [28, 16], [34, 17]]) if (L1('tcpillar', a, b, { v: 0 })) F.pillars.push([a, b]);
  for (const [a, b] of [[23, 21], [33, 21], [27, 24], [27, 18]]) { if (L1('tcsilklamp', a, b, { v: 1 })) { F.lamps.push([a, b]); LT(a, b, 48, '255,202,125'); } }
  for (const [a, b] of [[22, 19], [34, 19], [22, 24], [34, 24]]) if (L1('tcbrazier', a, b, { v: 0 })) { F.fires.push([a, b]); LT(a, b, 46, '255,159,80', 'fire'); }
  // ---- the palace terrace (north): two halls, the gatehouse and the inner gate
  F.hall = L1('tcpalace', 22, 10, { fp: [2, 2], v: 0, big: true }); L1('tcpalace', 17, 11, { fp: [2, 2], v: 1 }); L1('tcpalace', 27, 11, { fp: [2, 2], v: 0, flip: true }); L1('tcgatehouse', 20, 14, { fp: [2, 2], v: 0 }); L1('tcgatehouse', 25, 14, { fp: [2, 2], v: 0 });
  for (const [a, b] of [[21, 16], [25, 16], [19, 13], [26, 13], [20, 11], [26, 11]]) if (L1('tcpillar', a, b, { v: 0 })) F.pillars.push([a, b]);
  for (const [a, b] of [[22, 17], [24, 17], [18, 14], [27, 14]]) { if (L1('tcsilklamp', a, b, { v: 1 })) { F.lamps.push([a, b]); LT(a, b, 48, '255,202,125'); } }
  // ---- 3. the Peach Garden (west terrace)
  const TREES = [[15, 20], [17, 19], [19, 19], [21, 20], [15, 23], [18, 22], [21, 23], [16, 26], [20, 26], [23, 22]];
  TREES.forEach(([a, b], n) => { const p = L1('tcpeach', a, b, { v: n % 2 }); if (p) { F.trees.push([p.i, p.j]); Q('orchard', p.i + 1, p.j, { face: 'left', cap: 1 }); } });
  L1('tcpavilion', 16, 25, { fp: [2, 2], v: 0 });
  for (const [a, b] of [[18, 27], [20, 29]]) L1('tcfeast', a, b, { v: 0 });
  for (const [a, b] of [[15, 21], [16, 23], [18, 24], [19, 28], [21, 27], [14, 27], [22, 25], [17, 21], [20, 22]]) L1('flowers', a, b, { block: false });
  for (const [a, b] of [[22, 20], [14, 24], [15, 28], [22, 28]]) { if (L1('tcsilklamp', a, b, { v: 1 })) { F.lamps.push([a, b]); LT(a, b, 48, '255,190,200'); } }
  // ---- 4. the Eight-Trigram Furnace: the kiln on the bronze terrace, flanked by braziers and talisman pillars
  F.furnace = L1('tcfurnace', 35, 12, { fp: [2, 2], v: 1, big: true }); LT(36, 13, 130, '255,143,60', 'fire'); LT(36, 12, 70, '255,200,120', 'fire');
  for (const [a, b] of [[33, 14], [39, 15], [33, 11], [40, 12], [38, 16], [34, 16]]) if (L1('tcbrazier', a, b, { v: 0 })) { F.fires.push([a, b]); LT(a, b, 52, '255,159,80', 'fire'); }
  for (const [a, b] of [[34, 15], [38, 15], [34, 10], [39, 10]]) if (L1('tcpillar', a, b, { v: 0 })) F.pillars.push([a, b]);
  L1('tcpavilion', 40, 13, { fp: [2, 2], v: 0 });
  // ---- posts (same kinds as the pilot so the existing activities keep working, plus new ones)
  Q('court', 27, 21, { cap: 15 }); Q('banquet', 19, 27, { cap: 12 }); Q('furnace', 36, 14, { cap: 2, face: 'up' });
  for (const [a, b] of [[23, 17], [27, 17]]) Q('gatepost', a, b, { cap: 3 });
  for (const [a, b] of [[23, 22], [32, 18], [28, 27]]) Q('heavenpath', a, b, { cap: 5 });
  for (const [a, b] of [[26, 28], [30, 28]]) Q('southgate', a, b, { cap: 3, face: 'up' });
  for (const [a, b] of [[34, 21], [30, 22], [25, 21]]) Q('drill', a, b, { cap: 4 });
  for (const [a, b] of [[37, 14], [35, 15]]) Q('flame_watch', a, b, { cap: 2, face: 'up' });
  for (const [a, b] of [[23, 14], [21, 12]]) Q('terrace', a, b, { cap: 3, face: 'down' });
  F.flags = [[24, 20], [32, 20], [24, 25], [32, 25], [34, 10], [19, 11], [26, 12]];
  TWM.homes = TWM.homes || {};
};
window.TW_TC2_FINAL = function (X) {
  const { TWM, WALK, id, N } = X, F = TWM.tc2; if (!F) return;
  const st = id(27, 21), seen = new Uint8Array(N * N), q = [st]; seen[st] = 1; for (let n = 0; n < q.length; n++) { const k = q[n], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (!seen[z] && TWM.BIO[z] === F.B && TWM.canStep(k, z)) { seen[z] = 1; q.push(z); } } }
  F.reach = seen; F.dropped = []; TWM.pois = TWM.pois.filter(p => { if (p.biome !== 'tc') return true; const k = id(Math.floor(p.x / 8), Math.floor(p.y / 8)); if (!seen[k]) F.dropped.push(p.kind + '@' + p.i + ',' + p.j); return seen[k]; });
};
if (typeof module !== 'undefined') module.exports = {};
