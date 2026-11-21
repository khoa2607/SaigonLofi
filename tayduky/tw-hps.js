'use strict';
// ===== Tây Du Ký v2 — Hắc Phong Sơn (Black Wind Mountain): map build (world space; loaded before tw-map.js) =====
// Replaces Nữ Nhi Quốc. tw-layout.js lets the placeholder planner shape the region (local 30 x 50 at world (73, 54), 'c' wedge) and flags it built; this hook authors it:
//   * a steep mountain whose back (north-west, toward Buddha's Palm) is the peak and whose flanks fall to the east / south: layered cliffs, black-pine forest, scree;
//   * the Guanyin-Zen monastery climbing the slope in terraces: the shanmen gate and the gate plaza, the monks' court (dormitory, kitchen, well), the upper court (scripture pagoda,
//     bell tower, incense burner, sutra pavilion) and the great hall on the summit pad with a stupa garden and a cliff lookout, all joined by one pilgrim road of stairs;
//   * a mountain stream that falls in cascades from a spring beside the hall to the foot of the mountain, crossed by plank bridges, ending in a ravine (the south tail);
//   * Hắc Hùng Tinh's bear-mouth lair on a ledge across the stream, reached by a plank bridge; a bone-and-banner yard in front of it.
// Local (a, b) -> world (x0 + a, y0 + b); screen u = a - b, v = a + b (small v = back = higher).
window.TW_HPS_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, prop, poi, id, inMap, vnoise, hash2, carvePath, mulberry32 } = X;
  const B = TWM.bi.hps, R = mulberry32(20261125);
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let k = 0; k < N * N; k++) if (BIO[k] === B) { const i = k % N, j = Math.floor(k / N); x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  const L = TWM.layout.hps = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }, W = (a, b) => [x0 + a, y0 + b], inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B;
  const sm = t => t * t * (3 - 2 * t), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const F = TWM.hps = { x0, y0, B, tiles: [], stream: [], falls: [], flags: [], lamps: [], posts: {}, pads: {}, burn: {}, chimneys: [], eyes: null, foc: null };
  const tile = (a, b) => { const [i, j] = W(a, b); return inB(i, j) ? id(i, j) : -1; };
  const isWater = k => MAT[k] === M.STREAM || MAT[k] === M.POOL;
  // ---------------------------------------------------------------- 1. the mountain: height field (peak at the back, falling to the front)
  const base = (a, b) => 13 - (a + b - 12) * 0.3;
  for (let b = 0; b < L.h; b++) for (let a = 0; a < L.w; a++) { const [i, j] = W(a, b); if (!inB(i, j)) continue; const k = id(i, j); F.tiles.push(k);
    const n0 = vnoise(a * 0.22, b * 0.22, 401), n1 = vnoise(a * 0.7, b * 0.7, 402), crag = Math.max(0, vnoise(a * 0.35, b * 0.35, 403) - 0.62) * 5;
    H[k] = clamp(Math.round(base(a, b) + (n0 - 0.5) * 1.8 + (n1 - 0.5) * 0.5 + crag), 1, 13); MAT[k] = M.HMOSS; }
  // ---------------------------------------------------------------- 2. terrace pads
  const ell = (ca, cb, ra, rb, fn, pw) => { pw = pw || 2; for (let b = Math.floor(cb - rb - 2); b <= cb + rb + 2; b++) for (let a = Math.floor(ca - ra - 2); a <= ca + ra + 2; a++) { const d = (Math.abs(a - ca) / ra) ** pw + (Math.abs(b - cb) / rb) ** pw, k = tile(a, b); if (k >= 0) fn(k, d, a, b); } };
  const flat = (ca, cb, ra, rb, lv, pw) => ell(ca, cb, ra, rb, (k, d) => { if (isWater(k)) return; if (d < 1) H[k] = lv; else if (d < 1.9) H[k] = Math.round(lv + (H[k] - lv) * sm((d - 1) / 0.9)); }, pw);
  const TEMPLE = [13, 7.5, 5.4, 4.4, 11, 4], COURT = [17, 14.5, 4.6, 2.8, 9, 4], DORM = [21, 20.5, 4.6, 2.8, 7, 4], PLAZA = [24, 26, 4.8, 2.5, 3, 4], LAIR = [6, 25, 3.5, 3, 6, 4], LOOK = [22.5, 7.5, 2.2, 2, 9, 4];
  F.pads = { TEMPLE, COURT, DORM, PLAZA, LAIR, LOOK };
  for (const p of [TEMPLE, COURT, DORM, PLAZA, LAIR, LOOK]) flat(...p);
  // the south-east corner and the east edge come down to the placeholders' level so the gates can ramp out
  for (const k of F.tiles) { const i = k % N - x0, j = Math.floor(k / N) - y0; if (i >= 27 && j >= 19) H[k] = Math.min(H[k], 3 - (i >= 29 ? 1 : 0)); }
  // ---------------------------------------------------------------- 3. the mountain stream (spring beside the hall -> cascades -> ravine)
  const SPTS = [[8, 9, 10], [8, 12, 9], [9, 15, 8], [10, 18, 7], [11, 21, 6], [11, 24, 5], [10, 27, 5], [10, 28, 4], [11, 29, 4], [16, 29, 3], [22, 29, 3], [27, 29, 2], [28, 29, 2]];   // the stream runs along the south rim and becomes the head of the great river (Thông Thiên Hà)
  { const tiles = []; for (let n = 0; n < SPTS.length - 1; n++) { let [a, b, l0] = SPTS[n]; const [a1, b1, l1] = SPTS[n + 1], seg = []; while (a !== a1 || b !== b1) { seg.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); }
      seg.forEach(([qa, qb], t) => tiles.push([qa, qb, Math.round(l0 + (l1 - l0) * t / Math.max(1, seg.length))])); }
    const last = SPTS[SPTS.length - 1]; tiles.push([last[0], last[1], last[2]]);
    for (const [a, b, lv] of tiles) { for (const aa of [a]) { const k = tile(aa, b); if (k < 0) continue; MAT[k] = M.STREAM; H[k] = lv; if (!F.stream.includes(k)) F.stream.push(k); } } }
  // banks beside the water never sit lower than the water
  for (const k of F.stream) { const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + da, j + db)) continue; const q = id(i + da, j + db); if (!isWater(q) && H[q] < H[k]) H[q] = H[k]; } }
  // the south tail is a raised ridge-walk (level 6) between Sư Đà Lĩnh's cliffs and the river bluff: it meets Thông Thiên Hà's bluff path on its east edge
  for (const k of F.tiles) { const j = Math.floor(k / N) - y0; if (j >= 30 && !isWater(k)) H[k] = 6; }
  // Thông Thiên Hà's old northern continuation (a cleft that cut through this land) is gone: the great river now rises at the foot of the mountain
  if (TWM.river && TWM.river.north) { for (const k of TWM.river.north) if (BIO[k] !== B && !TWM.biomes[BIO[k]].built && MAT[k] !== M.VOID) { MAT[k] = M.PH + BIO[k]; H[k] = 1; } TWM.river.north = []; }
  // ---------------------------------------------------------------- 4. materials
  const slope = k => { let s = 0; const i = k % N, j = Math.floor(k / N); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + da, j + db)) continue; const q = id(i + da, j + db); if (BIO[q] !== B) continue; s = Math.max(s, Math.abs(H[q] - H[k])); } return s; };
  for (const k of F.tiles) { if (isWater(k)) continue; const i = k % N, j = Math.floor(k / N), h = H[k], n0 = vnoise(i * 0.3, j * 0.3, 404), n1 = vnoise(i * 0.8, j * 0.8, 405), s = slope(k);
    MAT[k] = s >= 2 || (h >= 10 && n0 > 0.52) || (h >= 8 && n1 > 0.8) ? M.HROCK : n1 > 0.74 || (h <= 4 && n0 > 0.62) ? M.HGRAV : M.HMOSS; }
  const paint = (p, mat, rim) => ell(p[0], p[1], p[2], p[3], (k, d) => { if (d < rim && !isWater(k)) MAT[k] = mat; }, p[5]);
  paint(TEMPLE, M.HFLAG, 0.9); paint(COURT, M.HFLAG, 0.85); paint(PLAZA, M.HFLAG, 0.85); paint(LOOK, M.HFLAG, 0.9); paint(LAIR, M.HGRAV, 0.9);
  ell(DORM[0], DORM[1], DORM[2], DORM[3], (k, d, a, b) => { if (d < 0.85 && !isWater(k)) MAT[k] = vnoise(a * 0.9, b * 0.9, 406) > 0.55 ? M.HGRAV : M.HFLAG; }, 4);
  // timber decks in front of the hall and in the dorm court
  ell(13, 10.5, 3, 0.8, (k, d) => { if (d < 1 && !isWater(k)) MAT[k] = M.HDECK; });
  // ---------------------------------------------------------------- 5. routes (levels interpolated <= 1 per tile; planks over the stream)
  const route = (pts, mat) => {
    const tiles = []; for (let n = 0; n < pts.length - 1; n++) { let [a, b] = pts[n]; const [a1, b1] = pts[n + 1]; while (a !== a1 || b !== b1) { tiles.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); } }
    tiles.push(pts[pts.length - 1].slice(0, 2));
    const wl = pts.map(p => p[2]), idx = pts.map(p => tiles.findIndex(t => t[0] === p[0] && t[1] === p[1]));
    const gap = t => { const k = tile(...tiles[t]); return k >= 0 && isWater(k); };
    const lv = tiles.map(([a, b]) => { const k = tile(a, b); return k >= 0 ? H[k] : 0; });
    for (let n = 0; n < pts.length; n++) if (wl[n] !== undefined && idx[n] >= 0) lv[idx[n]] = wl[n];
    for (let n = 0; n < pts.length - 1; n++) { if (wl[n] === undefined || wl[n + 1] === undefined || idx[n] < 0 || idx[n + 1] < 0) continue; const i0 = idx[n], i1 = idx[n + 1]; for (let t = i0; t <= i1; t++) lv[t] = Math.round(wl[n] + (wl[n + 1] - wl[n]) * (t - i0) / Math.max(1, i1 - i0)); }
    for (let pass = 0; pass < 3; pass++) { for (let t = 1; t < lv.length; t++) { if (gap(t)) continue; if (lv[t] - lv[t - 1] > 1) lv[t] = lv[t - 1] + 1; if (lv[t] - lv[t - 1] < -1) lv[t] = lv[t - 1] - 1; }
      for (let t = lv.length - 2; t >= 0; t--) { if (gap(t)) continue; if (lv[t] - lv[t + 1] > 1) lv[t] = lv[t + 1] + 1; if (lv[t] - lv[t + 1] < -1) lv[t] = lv[t + 1] - 1; } }
    let last = null; for (let t = 0; t < tiles.length; t++) { const k = tile(...tiles[t]); if (k < 0) { last = null; continue; } if (gap(t)) { H[k] = last !== null ? last : H[k]; } else { H[k] = lv[t]; last = lv[t]; } }
    // the ground beside a stair stays within one level of it (no sheer notch in the road)
    carvePath(pts.map(p => W(p[0], p[1])), mat || M.HGRAV, 'hps');
    for (const [a, b] of tiles) { const k = tile(a, b); if (k >= 0 && MAT[k] === M.BRIDGE) MAT[k] = M.PLANK; }
  };
  const [ex, ey] = (() => { for (let a = L.w - 1; a >= 0; a--) if (tile(a, 26) >= 0) return [a, 26]; return [28, 26]; })();
  F.exit = W(ex, ey);
  route([[ex, ey, 3], [26, 26, 3], [26, 23, 4], [26, 20, 5], [26, 18, 6], [24, 18, 7], [17, 18, 7], [17, 17, 8], [17, 16, 9], [17, 13, 9], [17, 11, 9], [17, 10, 10], [16, 10, 11], [13, 10, 11]], M.HFLAG);   // the pilgrim road: gate -> dorm court -> upper court -> the hall
  route([[26, 26, 3], [18, 26, 3], [14, 26, 4], [12, 26, 5], [9, 26, 6], [8, 27, 6]], M.HGRAV);                                                                              // plaza -> plank bridge -> the lair ledge
  route([[8, 27, 6], [6, 28, 6], [5, 30, 6], [6, 34, 6], [7, 40, 6], [8, 46, 6]], M.HGRAV);                                                                      // the ravine road down to the world (south tail)
  route([[16, 10, 11], [16, 8, 11], [17, 7, 11]], M.HFLAG);                                                                                                                  // stupa garden
  route([[16, 8, 11], [20, 8, 10], [21, 9, 9]], M.HFLAG);                                                                                                                     // cliff lookout
  F.exitTail = W(8, 46);
  // the mountain is the world's link between the eastern placeholders (the standard gate goes east) and the west: a second gate ramps from the lair ledge down into Lôi Âm Tự's land
  route([[8, 27, 6], [2, 27, 6]], M.HGRAV);
  { let prev = id(x0 + 2, y0 + 27), h = 6; for (let t = 1; t <= 5; t++) { const x = x0 + 2 - t, y = y0 + 27, k = id(x, y); if (BIO[k] === B || TWM.biomes[BIO[k]].built || x < 2) break; h--; H[k] = h; MAT[k] = M.TRAIL; PATHC[k] = 1; X.addStair(k, prev); prev = k; } F.westGate = W(2, 27); }
  // keep the stream's own tiles water (carve may have bridged them where a road crosses on purpose)
  // ---------------------------------------------------------------- 6. props
  const P = (kind, a, b, o) => { const [i, j] = W(a, b); if (!inB(i, j)) return null; if (o && o.block) { const fw = o.fp ? o.fp[0] : 1, fh = o.fp ? o.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) { const z = id(i + r, j + q); if (z >= N * N || PATHC[z] || isWater(z) || MAT[z] === M.PLANK || BIO[z] !== B) return null; } } return prop(kind, i, j, o); };
  const Q = (kind, a, b, o) => { const [i, j] = W(a, b); if (inB(i, j)) poi(kind, 'hps', i, j, o); };
  const LT = (a, b, r, col, kind) => TWM.lights.push({ biome: 'hps', i: x0 + a, j: y0 + b, r, col, kind: kind || 'fire' });
  const placed = {};
  const L1 = (kind, a, b, o) => { const p = P(kind, a, b, o); placed[kind] = (placed[kind] || 0) + (p ? 1 : 0); if (!p) (F.failed = F.failed || []).push(kind + '@' + a + ',' + b); return p; };
  L1('hpstemple', 11, 5, { fp: [5, 5], v: 0, block: true }); L1('hpspagoda', 19, 12, { fp: [3, 3], v: 0, block: true }); L1('hpsbell', 19, 15, { fp: [2, 2], v: 0, block: true }); L1('hpsburner', 14, 12, { fp: [2, 2], v: 0, block: true });
  L1('hpssutra', 13, 15, { fp: [3, 2], v: 0, block: true }); L1('hpsstupa', 16, 5, { fp: [2, 2], v: 0, block: true }); L1('hpspavilion', 22, 7, { fp: [2, 2], v: 0, block: true });
  L1('hpsdorm', 17, 19, { fp: [3, 2], v: 0, block: true }); L1('hpskitchen', 22, 21, { fp: [3, 2], v: 0, block: true }); L1('hpswell', 19, 21, { fp: [2, 2], v: 0, block: true });
  L1('hpsgate', 23, 25, { fp: [3, 3], v: 0, block: false }); L1('hpslair', 3, 22, { fp: [4, 4], v: 0, block: true });
  L1('hpswayshrine', 21, 24, { fp: [1, 1], v: 0, block: true }); L1('hpswayshrine', 12, 28, { fp: [1, 1], v: 1, block: true }); L1('hpswayshrine', 4, 38, { fp: [1, 1], v: 0, block: true });
  F.foc = W(17, 13); F.temple = W(13, 7); F.pagoda = W(20, 13); F.bell = W(20, 16); F.burner = W(15, 13); F.kitchen = W(23, 22); F.dorm = W(18, 20); F.lair = W(5, 24); F.gate = W(24, 26); F.well = W(20, 22); F.plaza = W(23, 26); F.pavilion = W(23, 8);
  // stone lantern pairs along the pilgrim road (nothing blocks it)
  for (const [a, b] of [[27, 25], [27, 27], [25, 22], [27, 19], [25, 17], [21, 18], [16, 17], [16, 14], [18, 12], [16, 11], [12, 11], [14, 11]]) { const p = L1('hpslantern', a, b, { fp: [1, 1], v: (a + b) & 1, block: true }); if (p) { F.lamps.push(W(a, b)); LT(a, b, 46, '255,190,100', 'lantern'); } }
  LT(13, 10, 150, '255,170,80'); LT(19, 13, 110, '255,150,70'); LT(22, 15, 90, '255,150,60'); LT(23, 21, 80, '255,160,70'); LT(25, 26, 80, '255,180,90'); LT(5, 24, 120, '255,90,50');
  F.chimneys = [W(23.8, 21.6), W(18.2, 19.4)];
  // prayer-flag strings: [a, b, z1, a2, b2, z2] between poles (the fx layer draws the cloth)
  F.flags = [[23, 24, 40, 27, 24, 40], [11, 11, 34, 16, 11, 34], [14, 8, 30, 17, 8, 30], [20, 6, 28, 22, 9, 28], [19, 18, 30, 24, 18, 30], [15, 14, 34, 19, 15, 34]].map(f => [x0 + f[0], y0 + f[1], f[2], x0 + f[3], y0 + f[4], f[5]]);
  // posts (activities)
  Q('hchant', 11, 10, { cap: 2, face: 'up' }); Q('hchant', 12, 10, { cap: 2, face: 'up' }); Q('hchant', 14, 10, { cap: 2, face: 'up' }); Q('hchant', 15, 10, { cap: 2, face: 'up' }); Q('hchant', 13, 10, { cap: 3, face: 'up' });
  Q('hincense', 16, 13, { cap: 2, face: 'left' }); Q('hincense', 16, 14, { cap: 2, face: 'left' }); Q('hbell', 19, 17, { cap: 2, face: 'up' }); Q('hbell', 21, 16, { cap: 1, face: 'left' });
  Q('hsutra', 16, 16, { cap: 2, face: 'left' }); Q('hsutra', 16, 15, { cap: 2, face: 'left' }); Q('hsutra', 18, 16, { cap: 2, face: 'up' });
  Q('hcook', 22, 23, { cap: 3, face: 'up' }); Q('hcook', 24, 23, { cap: 2, face: 'up' }); Q('hwater', 18, 21, { cap: 3, face: 'right' }); Q('hwater', 21, 23, { cap: 2, face: 'left' });
  Q('hsweep', 20, 19, { cap: 3, face: 'down' }); Q('hsweep', 24, 19, { cap: 3, face: 'down' }); Q('hsweep', 18, 14, { cap: 3, face: 'down' }); Q('hsweep', 24, 25, { cap: 3, face: 'down' }); Q('hsweep', 17, 9, { cap: 3, face: 'down' }); Q('hsweep', 14, 10, { cap: 3, face: 'down' });
  Q('htrain', 19, 18, { cap: 3, face: 'right' }); Q('htrain', 22, 19, { cap: 3, face: 'left' }); Q('htrain', 26, 24, { cap: 3, face: 'up' });
  Q('hlook', 21, 9, { cap: 2, face: 'right' }); Q('hlook', 20, 9, { cap: 2, face: 'right' }); Q('hlook', 17, 8, { cap: 2, face: 'up' }); Q('hlook', 17, 9, { cap: 2, face: 'up' });
  Q('hshrine', 21, 25, { cap: 2, face: 'up' }); Q('hshrine', 12, 27, { cap: 2, face: 'up' }); Q('hstream', 12, 25, { cap: 2, face: 'left' }); Q('hstream', 13, 26, { cap: 2, face: 'left' });
  Q('hplaza', 22, 25, { cap: 6, face: 'up' }); Q('hplaza', 25, 27, { cap: 6, face: 'up' }); Q('hplaza', 23, 27, { cap: 6, face: 'up' }); Q('hplaza', 21, 26, { cap: 6, face: 'up' });
  Q('hbuild', 12, 10, { cap: 4, face: 'up' }); Q('hbuild', 14, 10, { cap: 4, face: 'up' }); Q('hbuild', 15, 11, { cap: 4, face: 'up' });
  Q('hlair', 8, 27, { cap: 3, face: 'up' }); Q('hlair', 7, 28, { cap: 3, face: 'right' }); Q('hlair', 9, 26, { cap: 2, face: 'left' }); Q('hlair', 5, 31, { cap: 2, face: 'up' });
  Q('hcarry', 25, 24, { cap: 3, face: 'up' }); Q('hcarry', 20, 18, { cap: 3, face: 'up' }); Q('hcarry', 17, 15, { cap: 3, face: 'up' });
  // scatter: black pines on the moss, rock spires on the crags, bamboo along the stream, maples at the courts, boulders; nothing on reserved squares
  for (let b = 25; b <= 28; b++) for (let a = 18; a <= 29; a++) { const k = tile(a, b); if (k >= 0) RES[k] = 1; }
  for (let n = 0; n < 420; n++) { const a = Math.floor(R() * L.w), b = Math.floor(R() * L.h), k = tile(a, b); if (k < 0 || RES[k] || PATHC[k] || isWater(k) || MAT[k] === M.PLANK || MAT[k] === M.HFLAG || MAT[k] === M.HDECK) continue;
    const m = MAT[k], h = H[k]; let kind;
    if (m === M.HROCK) kind = R() < 0.62 ? 'hpsrock' : (h < 10 ? 'hpspine' : 'hpsrock'); else if (m === M.HGRAV) kind = R() < 0.5 ? 'hpsrock' : 'hpspine'; else kind = R() < 0.1 ? 'hpsmaple' : R() < 0.1 ? 'hpsbamboo' : 'hpspine';
    if (kind === 'hpsbamboo') { let near = false; for (const s of F.stream) { const dd = Math.abs((s % N) - (k % N)) + Math.abs(Math.floor(s / N) - Math.floor(k / N)); if (dd < 4) { near = true; break; } } if (!near) kind = 'hpspine'; }
    P(kind, a, b, { fp: [1, 1], v: n & 3, block: true }); }
  // flatter ground gets a denser maple / pine line along the road edges
  for (const [a, b, kd] of [[28, 22, 'hpsmaple'], [28, 28, 'hpspine'], [20, 23, 'hpsmaple'], [24, 15, 'hpsmaple'], [13, 16, 'hpsmaple'], [19, 9, 'hpsmaple'], [10, 11, 'hpspine'], [12, 3, 'hpspine'], [14, 2, 'hpspine'], [16, 3, 'hpspine'], [6, 38, 'hpsbamboo'], [4, 41, 'hpsbamboo'], [6, 44, 'hpsbamboo']]) P(kd, a, b, { fp: [1, 1], v: (a + b) & 3, block: true });
  // ---------------------------------------------------------------- 7. the mountain meets the world: outward band + near-field (placeholders around the biome paint mossy slate cliffs)
  F.out = [];
  const dOut = new Map(); { const q = []; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] !== M.VOID && !dOut.has(z)) { dOut.set(z, 1); q.push(z); } } }
    for (let h = 0; h < q.length; h++) { const k = q[h], d = dOut.get(k); if (d >= 7) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] === M.VOID || TWM.biomes[BIO[z]].built || dOut.has(z)) continue; dOut.set(z, d + 1); q.push(z); } } }
  for (const [k, d] of dOut) { if (TWM.biomes[BIO[k]].built || RES[k]) continue; const i = k % N, j = Math.floor(k / N), p = Math.pow(1 - (d - 1) / 6.5, 1.15), r = hash2(i, j, 411), n = vnoise(i * 0.4, j * 0.4, 412);
    if (MAT[k] >= M.PH && MAT[k] < M.HROCK && r < p * (0.5 + n * 0.55)) { MAT[k] = n > 0.62 ? M.HROCK : n > 0.35 ? M.HGRAV : M.HMOSS; F.out.push(k); }
    if (d <= 5 && r > 0.9 - p * 0.12 && !PATHC[k] && (MAT[k] === M.HMOSS || MAT[k] === M.HGRAV || MAT[k] === M.HROCK)) prop(r > 0.96 ? 'hpsrock' : 'hpspine', i, j, { fp: [1, 1], v: Math.floor(r * 97) & 3, block: true }); }
  { const near = TWM.hpsNear = new Uint8Array(N * N), q = [], dl = new Int16Array(N * N).fill(-1);
    for (const k of F.tiles) { near[k] = 1; dl[k] = 0; q.push(k); }
    for (let h = 0; h < q.length; h++) { const k = q[h]; if (dl[k] >= 10) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b)) continue; const z = id(i + a, j + b); if (dl[z] >= 0) continue; if (BIO[z] !== B && TWM.biomes[BIO[z]].built) continue; dl[z] = dl[k] + 1; near[z] = 1; q.push(z); } }
    for (const nm of ['lionNear', 'fireNear', 'tthNear']) if (TWM[nm]) for (let k = 0; k < N * N; k++) if (near[k] && TWM[nm][k] && BIO[k] !== B) near[k] = 0; }
  TWM.homes = TWM.homes || {}; TWM.homes.hps = { monk: W(20, 18), novice: W(22, 18), abbot: W(14, 11), porter: W(25, 25), minion: W(8, 27), _: W(20, 17) };
  F.eyes = W(5.5, 24.5); F.westEnd = W(ex, ey);
};
window.TW_HPS_FINAL = function (X) {   // drop any post the walk graph cannot reach
  const { TWM, id, N } = X, F = TWM.hps, B = F.B, st = id(F.exit[0], F.exit[1]), seen = new Uint8Array(N * N), q = [st]; seen[st] = 1;
  for (let n = 0; n < q.length; n++) { const k = q[n], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (!seen[z] && TWM.BIO[z] === B && TWM.canStep(k, z)) { seen[z] = 1; q.push(z); } } }
  F.reach = seen; const before = TWM.pois.length; F.dropped = [];
  TWM.pois = TWM.pois.filter(p => { if (p.biome !== 'hps') return true; const k = id(Math.floor(p.x / 8), Math.floor(p.y / 8)); if (!seen[k]) F.dropped.push(p.kind + '@' + (p.i - F.x0) + ',' + (p.j - F.y0)); return seen[k]; }); F.droppedPois = before - TWM.pois.length;
};
if (typeof module !== 'undefined') module.exports = {};
