'use strict';
// ===== Tây Du Ký v2 — Hỏa Diệm Sơn (Flaming Mountains): map build (world space; loaded before tw-map.js) =====
// tw-layout.js reserves the footprint (TWM.layout.hds: a rounded blob, local 36 x 38 at world (2, 85)). This hook authors every tile inside it:
//   * a red-black massif with two smoking peaks (levels up to 14), mid ridges, terraces and a palace terrace carved into the back wall;
//   * two lava channels that run from the peaks to a lava lake, with lava falls where the channels drop a level;
//   * a warm-clay village plateau (level 3) with ovens, cake stalls and huts;
//   * paths with stairs (switchbacks up to Thiết Phiến's cave palace), stone bridges across the lava, a lookout, vents and a fan shrine.
// Everything is deterministic. Local coordinates (a, b) -> world (x0 + a, y0 + b); screen u = a - b, v = a + b (the palace is at the back = small a + b).
window.TW_FIRE_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, set, prop, poi, isB, id, inMap, vnoise, hash2, carvePath, mulberry32, addStair } = X;
  const L = TWM.layout.hds, x0 = L.x0, y0 = L.y0, B = TWM.bi.hds, R = mulberry32(20261121);
  const W = (a, b) => [x0 + a, y0 + b], inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B;
  const sm = t => t * t * (3 - 2 * t), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const F = TWM.fire = { x0, y0, B, tiles: [], lava: [], cracks: [], vents: [], steam: [], village: null, palace: null, peaks: [], lake: null, focus: null };

  // ------------------------------------------------------------ 1. height field: compact mounds (oriented gaussians with compact support)
  const mound = (a, b, ca, cb, ra, rb, hgt, rot) => {
    const dx = a - ca, dy = b - cb, c = Math.cos(rot || 0), s = Math.sin(rot || 0), u = (dx * c + dy * s) / ra, v = (-dx * s + dy * c) / rb, t = 1 - (u * u + v * v);
    return t > 0 ? hgt * Math.pow(t, 0.75) : 0;
  };
  const MOUNDS = [
    [6, 16, 9, 9, 13], [17, 5, 9, 8, 13], [11, 11, 10, 8, 10], [3, 27, 6, 12, 9, 0.15], [30, 9, 9, 8, 10, 0.6], [25, 3, 8, 6, 8],
    [22, 17, 8, 6, 6], [3, 8, 6, 7, 9], [9, 21, 6, 5, 4], [31, 19, 6, 9, 6], [20, 22, 4, 4, 3],
    [2, 14, 4, 9, 8, 0.1], [2, 34, 5, 6, 7], [11, 38, 7, 4, 5], [24, 38, 7, 4, 6], [35, 4, 4, 6, 8], [14, 0, 7, 3, 9],
  ];
  const HF = new Float32Array(L.w * L.h);
  for (let b = 0; b < L.h; b++) for (let a = 0; a < L.w; a++) { let h = 2.2; for (const m of MOUNDS) h += mound(a, b, m[0], m[1], m[2], m[3], m[4], m[5]); h += (vnoise(a * 0.3, b * 0.3, 61) - 0.5) * 1.4; HF[b * L.w + a] = h; }
  for (let pass = 0; pass < 2; pass++) { const c = HF.slice(); for (let b = 1; b < L.h - 1; b++) for (let a = 1; a < L.w - 1; a++) { let sum = 0; for (let db = -1; db <= 1; db++) for (let da = -1; da <= 1; da++) sum += c[(b + db) * L.w + a + da] * (da || db ? 1 : 2); HF[b * L.w + a] = sum / 10; } }
  const hgt = (a, b) => { const h = HF[b * L.w + a], edge = Math.min(1, Math.max(0.2, (1 - L.q(a, b)) * 5)); return Math.max(1, Math.round(1 + (h - 1) * (0.55 + 0.45 * edge))); };
  for (let b = 0; b < L.h; b++) for (let a = 0; a < L.w; a++) { const [i, j] = W(a, b); if (!inB(i, j)) continue; H[id(i, j)] = clamp(hgt(a, b), 1, 14); MAT[id(i, j)] = M.ASH; F.tiles.push(id(i, j)); }
  const tile = (a, b) => { const [i, j] = W(a, b); return inB(i, j) ? id(i, j) : -1; };
  const ell = (ca, cb, ra, rb, fn) => { for (let b = Math.floor(cb - rb - 1); b <= cb + rb + 1; b++) for (let a = Math.floor(ca - ra - 1); a <= ca + ra + 1; a++) { const d = ((a - ca) / ra) ** 2 + ((b - cb) / rb) ** 2, k = tile(a, b); if (k >= 0) fn(k, d, a, b); } };

  // ------------------------------------------------------------ 2. flat grounds: village plateau, palace terrace, market square, overlooks
  const VIL = [14, 29, 8, 6.5, 3], PAL = [11.5, 9.5, 6.5, 4.5, 8], LOOK = [26, 13, 4.5, 3.5, 7], CRATER = [5, 22, 4, 4, 9];
  for (const [ca, cb, ra, rb, lv] of [VIL, PAL, LOOK, CRATER]) ell(ca, cb, ra, rb, (k, d) => { if (d < 1) { H[k] = lv; } else if (d < 1.6) { H[k] = Math.round(lv + (H[k] - lv) * sm((d - 1) / 0.6)); } });
  F.village = W(VIL[0], VIL[1]); F.palace = W(11.5, 8.5);
  // the back wall behind the palace terrace is a sheer cliff (levels 12-13), so the gate reads as carved into the mountain
  ell(11.5, 4.5, 8, 4, (k, d) => { if (d < 1) H[k] = Math.max(H[k], 12 + Math.round(vnoise(k % N * 0.5, k * 0.01, 62))); });

  // ------------------------------------------------------------ 3. lava: two channels to a lake (levels fall toward the lake; falls show where they drop)
  const LAKE = [26, 27, 4.8, 4.2];
  const lavaLine = (pts, w) => {   // [a, b] waypoints; heights follow the terrain minus 1 but never rise downstream
    const seq = []; for (let n = 0; n < pts.length - 1; n++) { const [aa, bb] = pts[n], [a2, b2] = pts[n + 1], steps = Math.max(Math.abs(a2 - aa), Math.abs(b2 - bb)) * 2; for (let s = 0; s < steps; s++) seq.push([aa + (a2 - aa) * s / steps, bb + (b2 - bb) * s / steps]); }
    let prev = 99; const seen = new Set();
    for (const [pa, pb] of seq) for (let o = -(w - 1) / 2; o <= (w - 1) / 2 + 0.01; o++) { const a = Math.round(pa + (Math.abs(pa - Math.round(pa)) < 1 ? 0 : 0) + (w > 1 ? o * 0.7 : 0)), b = Math.round(pb + (w > 1 ? -o * 0.7 : 0)), k = tile(a, b); if (k < 0 || seen.has(k)) continue; seen.add(k);
      const h = Math.min(prev, Math.max(1, H[k] - 1)); H[k] = h; MAT[k] = M.LAVA; if (o === 0) prev = h; F.lava.push(k); }
  };
  lavaLine([[7, 16], [8, 19], [10, 21], [12, 23], [15, 24], [18, 26], [22, 28]], 2);          // from the left peak
  lavaLine([[17, 8], [18, 13], [19, 17], [20, 21], [22, 25]], 1.2);                               // from the right peak
  ell(LAKE[0], LAKE[1], LAKE[2], LAKE[3], (k, d) => { if (d < 1) { H[k] = 1; MAT[k] = M.LAVA; F.lava.push(k); } else if (d < 1.7 && MAT[k] !== M.LAVA) { H[k] = Math.max(H[k], 3); } });
  F.lake = W(LAKE[0], LAKE[1]);
  // lava never sits above a neighbouring non-lava tile by more than the channel wall; make the lake outflow a short channel to the south-east edge
  lavaLine([[29, 29], [32, 31], [33, 34]], 1);
  lavaLine([[25, 2], [27, 7], [28, 12], [27, 17], [27, 22]], 1.4);                               // east canal from the north-east ridge down to the lake

  // ------------------------------------------------------------ 4. materials
  for (const k of F.tiles) { if (MAT[k] === M.LAVA) continue; const i = k % N, j = Math.floor(k / N), h = H[k], n0 = vnoise(i * 0.35, j * 0.35, 63);
    MAT[k] = h >= 9 ? M.BASALT : h >= 6 ? (n0 > 0.55 ? M.SCORCH : M.BASALT) : h >= 4 ? (n0 > 0.4 ? M.SCORCH : M.ASH) : (n0 > 0.62 ? M.SCORCH : M.ASH); }
  ell(VIL[0], VIL[1], VIL[2] + 0.5, VIL[3] + 0.5, (k, d) => { if (d < 1 && MAT[k] !== M.LAVA) MAT[k] = M.WARM; });
  ell(PAL[0], PAL[1], PAL[2], PAL[3], (k, d) => { if (d < 1 && MAT[k] !== M.LAVA) MAT[k] = M.SCORCH; });

  // ------------------------------------------------------------ 5. routes: heights are interpolated between waypoint levels (<= 1 level per tile), stairs where a route climbs, bridges over lava
  const route = (pts) => {   // pts: [a, b, level?]
    const tiles = []; for (let n = 0; n < pts.length - 1; n++) { let [a, b] = pts[n]; const [a1, b1] = pts[n + 1]; while (a !== a1 || b !== b1) { tiles.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); } }
    tiles.push(pts[pts.length - 1].slice(0, 2));
    const wl = pts.map(p => p[2]), idx = pts.map((p, n) => tiles.findIndex(t => t[0] === p[0] && t[1] === p[1]));
    const lv = tiles.map(([a, b]) => { const k = tile(a, b); return k >= 0 ? H[k] : 0; });
    for (let n = 0; n < pts.length; n++) if (wl[n] !== undefined && idx[n] >= 0) lv[idx[n]] = wl[n];
    for (let pass = 0; pass < 2; pass++) { for (let t = 1; t < lv.length; t++) { if (MAT[tile(...tiles[t])] === M.LAVA) continue; if (lv[t] - lv[t - 1] > 1) lv[t] = lv[t - 1] + 1; if (lv[t] - lv[t - 1] < -1) lv[t] = lv[t - 1] - 1; }
      for (let t = lv.length - 2; t >= 0; t--) { if (MAT[tile(...tiles[t])] === M.LAVA) continue; if (lv[t] - lv[t + 1] > 1) lv[t] = lv[t + 1] + 1; if (lv[t] - lv[t + 1] < -1) lv[t] = lv[t + 1] - 1; } }
    // bridges keep the level of their abutments (they cross lava at constant height)
    let last = null; for (let t = 0; t < tiles.length; t++) { const k = tile(...tiles[t]); if (k < 0) { last = null; continue; } if (MAT[k] === M.LAVA) { H[k] = last !== null ? last : H[k]; } else { H[k] = lv[t]; last = lv[t]; } }
    const wp = pts.map(p => W(p[0], p[1])); carvePath(wp, M.CINDER, 'hds');
  };
  const H3 = 3;
  route([[14, 29, 3], [14, 25, 3], [16, 23, 3], [18, 20, 4], [19, 17, 5], [16, 15, 6], [13, 13, 7], [12, 11, 8]]);                    // village -> bridge over channel A -> switchbacks -> palace terrace
  route([[12, 11, 8], [11.5 | 0, 9, 8], [9, 9, 8]]);
  route([[14, 29, 3], [11, 29, 3], [8, 27, 4], [7, 24, 6], [5, 22, 9]]);                                                               // west ledge up to the crater overlook
  route([[14, 29, 3], [18, 31, 3], [21, 32, 3], [23, 34, 3]]);                                                                         // south shore of the lake (gate towards the world)
  route([[23, 34, 3], [27, 33, 3], [31, 31, 2], [36, 30, 1]]);                                                                      // the road out of the village to the east edge: ramps down to level 1 where the world continues
  route([[19, 17, 5], [22, 15, 6], [25, 14, 7], [26, 13, 7]]);                                                                         // east branch to the lookout over the lake
  route([[14, 29, 3], [14, 33, 3], [14, 36, 2]]);                                                                                      // village front gate

  // ------------------------------------------------------------ 6. props (landmarks first) and points of interest
  const P = (kind, a, b, o) => { const [i, j] = W(a, b); return inB(i, j) ? prop(kind, i, j, o) : null; };
  const Q = (kind, a, b, o) => { const [i, j] = W(a, b); if (inB(i, j)) poi(kind, 'hds', i, j, o); };
  // the cave palace: a monumental gate on the carved terrace; Thiết Phiến lives behind it
  const pal = P('hdspalace', 9, 6, { fp: [4, 4], v: 0 }); Q('palacegate', 11, 11, { cap: 3, face: 'up' }); Q('palacegate', 8, 11, { cap: 2, face: 'up' }); Q('palaceyard', 14, 10, { cap: 3, face: 'left' });
  P('hdsshrine', 15, 11, { fp: [2, 2], v: 0, block: true }); Q('shrine', 15, 13, { cap: 2, face: 'up' });
  // twin volcanoes on the back massif
  ell(5.5, 15.5, 3.4, 3.4, (k, d) => { if (d < 1.2) { H[k] = 10; if (MAT[k] !== M.LAVA) MAT[k] = M.BASALT; } });   // flat pads under the two great volcanoes
  ell(17.5, 3.5, 3.4, 3.4, (k, d) => { if (d < 1.2) { H[k] = 11; if (MAT[k] !== M.LAVA) MAT[k] = M.BASALT; } });
  P('hdsvolcano', 4, 14, { fp: [4, 4], v: 0 }); P('hdsvolcano', 16, 2, { fp: [4, 4], v: 1 });
  ell(9.5, 11.5, 3, 3, (k, d) => { if (d < 1.2) { H[k] = 10; if (MAT[k] !== M.LAVA) MAT[k] = M.BASALT; } }); ell(22.5, 6.5, 3, 3, (k, d) => { if (d < 1.2) { H[k] = 10; if (MAT[k] !== M.LAVA) MAT[k] = M.BASALT; } });
  P('hdsvolcano', 8, 10, { fp: [3, 3], v: 2 }); P('hdsvolcano', 21, 5, { fp: [3, 3], v: 3 });   // a second tier of cones behind the great ones: a range, not two isolated sprites
  F.peaks = [W(6, 16), W(18, 4)];
  // village: market square (stalls + ovens), huts around it, crates and lanterns
  for (const [a, b, v] of [[12, 27, 0], [16, 27, 1], [14, 32, 2]]) { P('hdsstall', a, b, { fp: [2, 1], v, block: true }); Q('stall', a, b + 1, { cap: 2, face: 'up', ground: true }); }
  for (const [a, b] of [[10, 30], [18, 30], [12, 33]]) { P('hdsoven', a, b, { fp: [2, 1], v: 0, block: true }); Q('oven', a, b + 1, { cap: 1, face: 'up' }); }
  for (const [a, b, v] of [[8, 25, 0], [8, 32, 1], [18, 34, 2], [20, 26, 0], [6, 29, 1]]) { P('hdshut', a, b, { fp: [2, 2], v, block: true }); Q('hearth', a + 1, b + 2, { cap: 2, face: 'up' }); }
  for (const [a, b] of [[11, 31], [16, 31], [13, 25]]) { P('hdscrates', a, b, { fp: [1, 1], v: a & 3, block: true }); Q('crate', a, b + 1, { cap: 1, face: 'up' }); }
  Q('hearth', 14, 29, { cap: 4, face: 'up' }); Q('hearth', 17, 29, { cap: 3, face: 'up' }); Q('square', 14, 30, { cap: 8, face: 'up' });
  Q('pen', 9, 35, { cap: 3, face: 'right' }); Q('pen', 11, 36, { cap: 3, face: 'right' });
  for (const [a, b] of [[9, 28], [19, 28], [14, 26], [14, 34], [7, 31], [20, 31]]) { P('hdslantern', a, b, { fp: [1, 1], v: 0, block: true }); TWM.lights.push({ biome: 'hds', i: x0 + a, j: y0 + b, r: 52, col: '255,160,70', kind: 'lantern' }); }
  // lookouts and the lava shore
  Q('overlook', 25, 13, { cap: 3, face: 'down' }); Q('overlook', 5, 22, { cap: 3, face: 'down' }); Q('lavaedge', 22, 31, { cap: 2, face: 'right' }); Q('lavaedge', 19, 25, { cap: 2, face: 'right' }); Q('lavaedge', 23, 34, { cap: 2, face: 'up' });
  Q('switch', 18, 20, { cap: 2, face: 'down' }); Q('switch', 13, 13, { cap: 2, face: 'down' }); Q('path', 16, 23, { cap: 2, face: 'down' }); Q('path', 16, 36, { cap: 2, face: 'up' });
  // vents: smoking fissures (non-blocking decoration that the fx layer animates), lava rocks and charred trees
  const vents = [[7, 20], [24, 20], [3, 24], [22, 6], [28, 31], [10, 15]];
  for (const [a, b] of vents) { const k = tile(a, b); if (k < 0 || MAT[k] === M.LAVA || RES[k]) continue; P('hdsvent', a, b, { fp: [1, 1], v: (a + b) & 3, block: true }); F.vents.push(W(a, b)); TWM.lights.push({ biome: 'hds', i: x0 + a, j: y0 + b, r: 34, col: '255,110,40', kind: 'fire' }); }
  for (const [a, b] of [[23, 24], [29, 25], [28, 28], [25, 32], [21, 27]]) { const k = tile(a, b); if (k >= 0 && MAT[k] !== M.LAVA && !RES[k]) { P('hdsrock', a, b, { fp: [1, 1], v: (a * 3 + b) & 3, block: true }); } }
  for (let n = 0; n < 40; n++) { const a = Math.floor(R() * L.w), b = Math.floor(R() * L.h), k = tile(a, b); if (k < 0 || RES[k] || PATHC[k] || MAT[k] === M.LAVA || MAT[k] === M.WARM || H[k] > 9) continue; if (n % 3) continue; P('hdstree', a, b, { fp: [1, 1], v: n & 3, block: true }); }
  // lava glow lights along the channels and the lake
  for (let n = 0; n < F.lava.length; n += 4) { const k = F.lava[n]; TWM.lights.push({ biome: 'hds', i: k % N, j: Math.floor(k / N), r: 40, col: '255,120,40', kind: 'fire' }); }
  TWM.lights.push({ biome: 'hds', i: x0 + LAKE[0], j: y0 + LAKE[1], r: 120, col: '255,110,30', kind: 'fire' });
  TWM.lights.push({ biome: 'hds', i: x0 + 11, j: y0 + 9, r: 100, col: '255,170,70', kind: 'fire' });

  // ------------------------------------------------------------ 6b. EDGES AND CORNERS: no dead wedges; the volcano bleeds outward and the neighbour creeps back in
  // distance of every biome tile to the nearest foreign tile (edge band) and of every foreign tile to the biome (outer band)
  const dIn = new Map(), dOut = new Map(), srcOf = new Map(); { let q = []; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); const f = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([a, b]) => !inB(i + a, j + b) && inMap(i + a, j + b)); if (f || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !inB(i + a, j + b))) { dIn.set(k, 0); if (f) srcOf.set(k, id(i + f[0], j + f[1])); q.push(k); } }
    for (let h = 0; h < q.length; h++) { const k = q[h], d = dIn.get(k); if (d >= 5) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (!dIn.has(z)) { dIn.set(z, d + 1); if (srcOf.has(k)) srcOf.set(z, srcOf.get(k)); q.push(z); } } }
    q = []; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (!dOut.has(z) && MAT[z] !== M.VOID) { dOut.set(z, 1); q.push(z); } } }
    for (let h = 0; h < q.length; h++) { const k = q[h], d = dOut.get(k); if (d >= 7) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] === M.VOID || TWM.biomes[BIO[z]].built) continue; if (!dOut.has(z)) { dOut.set(z, d + 1); q.push(z); } } } }
  const neighbourOf = (k) => { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) if (inMap(i + a, j + b) && !inB(i + a, j + b) && MAT[id(i + a, j + b)] !== M.VOID) return TWM.biomes[BIO[id(i + a, j + b)]].id; return null; };
  // (a0) where the biome meets a BUILT neighbour (Bàn Tơ Động) the ground does not stop at a cliff: it slopes, step by step, into the neighbour's level (a talus band)
  for (const k of F.tiles) { const d = dIn.get(k), src = srcOf.get(k); if (d === undefined || d > 4 || src === undefined || MAT[k] === M.LAVA || PATHC[k]) continue; if (!TWM.biomes[BIO[src]].built || BIO[src] === B) continue;
    const w = d / 5; H[k] = clamp(Math.round(H[k] * w + (H[src] + 1) * (1 - w)), 1, 14); if (d <= 2 && MAT[k] !== M.CINDER) MAT[k] = d <= 1 ? M.ASH : M.SCORCH; }
  TWM.bleed = new Uint8Array(N * N); F.bleedTiles = []; // tiles of other BUILT biomes within 3 tiles of the volcano: ash and ember staining (colour only; nothing about them moves)
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { if (!inMap(i + di, j + dj)) continue; const z = id(i + di, j + dj); if (BIO[z] === B || MAT[z] === M.VOID || !TWM.biomes[BIO[z]].built) continue; const d = Math.abs(di) + Math.abs(dj); if (d <= 4) { const v = 5 - d; if (v > TWM.bleed[z]) { if (!TWM.bleed[z]) F.bleedTiles.push(z); TWM.bleed[z] = v; } } } }
  // (a) a broken ridge runs along the whole edge: shelves, notches and spires break the straight boundary (never over a route tile)
  for (const k of F.tiles) { const d = dIn.get(k); if (d === undefined || d > 3 || MAT[k] === M.LAVA || PATHC[k] || (srcOf.has(k) && TWM.biomes[BIO[srcOf.get(k)]].built && BIO[srcOf.get(k)] !== B)) continue; const i = k % N, j = Math.floor(k / N), n = vnoise(i * 0.33, j * 0.33, 66), n2 = vnoise(i * 0.9, j * 0.9, 67);
    if (d <= 1) H[k] = clamp(H[k] + Math.round((n - 0.35) * 4.2 + (n2 > 0.7 ? 2 : 0)), 1, 12); else if (d === 2) H[k] = clamp(H[k] + Math.round((n - 0.45) * 2), 1, 12); }
  // (b) the volcano pushes OUT into the transition band: ash, scorched and cracked ground, dead trees, smoke and embers (the neighbour's own tiles keep their identity: biome, height, walkability)
  F.out = []; F.edgeVents = [];
  for (const [k, d] of dOut) { if (TWM.biomes[BIO[k]].built || RES[k]) continue; const i = k % N, j = Math.floor(k / N), p = Math.pow(1 - (d - 1) / 6.5, 1.3), r = hash2(i, j, 68), n = vnoise(i * 0.4, j * 0.4, 69);
    if (MAT[k] >= M.PH && r < p * (0.55 + n * 0.5)) { MAT[k] = n > 0.55 && d < 4 ? M.SCORCH : M.ASH; F.out.push(k); }
    else if (MAT[k] === M.TRAIL && d < 6) { MAT[k] = M.CINDER; }
    if (d <= 5 && r > 0.93 - p * 0.14 && !PATHC[k] && MAT[k] !== M.TRAIL && (MAT[k] === M.ASH || MAT[k] === M.SCORCH)) { const vv = r > 0.97; prop(vv ? 'hdsvent' : 'hdstree', i, j, { fp: [1, 1], v: Math.floor(r * 97) & 3, block: true }); if (vv) F.edgeVents.push([i, j]); } }
  // (c) the NEIGHBOUR pushes back into the biome's edge band: dark cave creep, crystals and a web residue where Bàn Tơ Động touches; pale thinned ground elsewhere
  for (const k of F.tiles) { const d = dIn.get(k); if (d === undefined || d > 3 || MAT[k] === M.LAVA || PATHC[k] || RES[k]) continue; const nb = neighbourOf(k), i = k % N, j = Math.floor(k / N), r = hash2(i, j, 70);
    if (nb === 'btd' && r < 0.7 - d * 0.18) { MAT[k] = r < 0.18 ? M.GLOW : M.CAVEF; if (r < 0.06 && d <= 1) prop('pcrystals', i, j, { fp: [1, 1], v: Math.floor(r * 500), block: true }); } }
  // (d) corner and edge compositions: lookout ledges, a ruined shrine, ash basins with vents and dead trees, narrow paths
  P('hdsruin', 2, 33, { fp: [2, 2], v: 0, block: true }); Q('overlook', 4, 35, { cap: 3, face: 'right' });
  route([[6, 31, 3], [4, 33, 4], [3, 36, 5], [4, 37, 5]]);
  P('hdsruin', 31, 36, { fp: [2, 2], v: 1, block: true });
  for (const [a, b] of [[1, 24], [2, 29], [8, 37], [14, 37], [19, 38], [27, 37], [33, 34], [35, 12], [36, 6], [4, 3], [9, 1]]) { const k = tile(a, b); if (k >= 0 && !RES[k] && MAT[k] !== M.LAVA && !PATHC[k]) { P(a % 2 ? 'hdstree' : 'hdsvent', a, b, { fp: [1, 1], v: (a + b) & 3, block: true }); if (!(a % 2)) F.edgeVents.push(W(a, b)); } }
  for (const [a, b] of [[10, 36], [20, 36], [30, 33], [3, 20], [1, 8]]) { const k = tile(a, b); if (k >= 0 && !RES[k] && MAT[k] !== M.LAVA && !PATHC[k] && !F.vents.some(v => v[0] === x0 + a && v[1] === y0 + b)) { P('hdsrock', a, b, { fp: [1, 1], v: (a * 3 + b) & 1, block: true }); } }

  // ------------------------------------------------------------ 7. cracks (glowing fissure tiles on the high ground; the fx layer pulses them) and the greening order
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); if (MAT[k] === M.LAVA || MAT[k] === M.CINDER || MAT[k] === M.LBRIDGE || H[k] < 2) continue; if (hash2(i, j, 64) < (MAT[k] === M.BASALT ? 0.16 : MAT[k] === M.SCORCH ? 0.1 : 0.05)) F.cracks.push(k); }
  TWM.homes = TWM.homes || {}; TWM.homes.hds = { princess: W(11, 11), _: W(14, 30) };   // residents start where they live (the village; the princess at her palace gate)
  F.focus = W(VIL[0], VIL[1]);                                                  // the rain starts over the village and spreads outward (tw-fire-data.js)
  // reserve the village heart so random scatter never lands on it
  for (let b = 25; b <= 34; b++) for (let a = 9; a <= 19; a++) { const k = tile(a, b); if (k >= 0) RES[k] = 1; }
};
window.TW_FIRE_POST = function (X) {
  const { TWM, MAT, WALK, M } = X; for (let k = 0; k < MAT.length; k++) if (MAT[k] === M.LAVA || MAT[k] === M.CRUST) WALK[k] = 0;
};
if (typeof module !== 'undefined') module.exports = {};
