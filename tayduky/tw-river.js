'use strict';
// ===== Tây Du Ký v2 — Thông Thiên Hà (The River That Reaches Heaven): map build (world space; loaded before tw-map.js) =====
// tw-layout.js reserves the footprint (TWM.layout.tth: a squircle + the south and east rim strips, local 46 x 39 at world (77, 84)), east of Sư Đà Lĩnh. This hook authors it:
//   * ONE enormous river that runs north -> south through the whole biome (about 15 tiles wide): a rocky rapids gorge in the north that steps down in cascades, deep dark
//     water in the middle with a whirlpool, eddy pools in the coves, and a CATARACT where the river pours off the south rim of the world;
//   * a high wooded west bluff (signal pagoda tower, lookout, a tributary that falls to the river), the west ferry cove (abandoned ferry station and its pier, a wreck, huts,
//     net racks, willows) joined to Sư Đà Lĩnh's east road;
//   * the river-god's shrine on a rocky islet, reed sandbars, mid-river rocks;
//   * a low far (east) bank: the landing with a stone gate, the fishing village on stilts, reed marsh, a wooded hill and a trail leaving north.
// The two banks are NOT connected: the river cannot be crossed on foot. Local (a, b) -> world (x0 + a, y0 + b); screen u = a - b, v = a + b.
window.TW_RIVER_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, set, prop, poi, isB, id, inMap, vnoise, hash2, carvePath, mulberry32, addStair } = X;
  const L = TWM.layout.tth, x0 = L.x0, y0 = L.y0, B = TWM.bi.tth, R = mulberry32(20261124);
  const W = (a, b) => [x0 + a, y0 + b], inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B;
  const sm = t => t * t * (3 - 2 * t), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const F = TWM.river = { x0, y0, B, tiles: [], water: [], boats: [], posts: {}, torches: [], cranes: [], reeds: [], lanterns: [], islands: {}, pierW: [], pierE: [], north: [], foc: null };
  const tile = (a, b) => { const [i, j] = W(a, b); return inB(i, j) ? id(i, j) : -1; };

  // ---------------------------------------------------------------- 1. the river: centre line, width, water kinds
  const AC = b => 22.5 + 2.6 * Math.sin(0.16 * b + 0.4);
  const HW = b => b < 10 ? 4.4 : b < 16 ? 4.4 + (b - 10) / 6 * 2.9 : b < 34 ? 7.3 : 7.3 - (b - 34) * 0.3;
  F.AC = AC; F.HW = HW;
  const wnoise = (a, b) => (vnoise(a * 0.45, b * 0.45, 301) - 0.5) * 1.3;
  const isWater = k => MAT[k] === M.STREAM || MAT[k] === M.SEA || MAT[k] === M.POOL;
  const WHIRL = [23.5, 28.5];
  // mounds for the land
  const mound = (a, b, ca, cb, ra, rb, hgt) => { const dx = (a - ca) / ra, dy = (b - cb) / rb, t = 1 - (dx * dx + dy * dy); return t > 0 ? hgt * Math.pow(t, 0.75) : 0; };
  const HILLS = [[8, 6, 8, 7, 5], [3, 14, 5, 7, 3], [40, 4, 7, 6, 4], [43, 10, 4, 6, 3], [36, 1, 6, 3, 3], [44, 26, 4, 9, 2], [37, 12, 3, 3, 1], [4, 24, 4, 4, 1], [41, 34, 5, 3, 1]];
  for (let b = 0; b < L.h; b++) for (let a = L.a0; a < L.w; a++) {
    const [i, j] = W(a, b); if (!inB(i, j)) continue; const k = id(i, j), s = a - AC(b), hw = HW(b) + wnoise(a, b), n0 = vnoise(a * 0.3, b * 0.3, 302);
    F.tiles.push(k);
    if (Math.abs(s) < hw) {   // water
      const dc = Math.abs(s) / hw; let m, h = b < 7 ? 2 : b < 13 ? 1 : 0;
      const coveW = a < 19 && b >= 22 && b <= 36, coveE = a > 28 && b >= 22 && b <= 36;
      if (b < 13 || b >= 33) m = M.STREAM;
      else if (Math.hypot(a - WHIRL[0], (b - WHIRL[1]) * 1.2) < 3.4) m = M.SEA;
      else if (dc < 0.66) m = M.SEA;
      else if ((coveW || coveE) && vnoise(a * 0.4, b * 0.4, 303) > 0.34) m = M.POOL;
      else m = vnoise(a * 0.5, b * 0.5, 304) > 0.52 ? M.STREAM : M.SEA;
      H[k] = h; MAT[k] = m; F.water.push(k); continue;
    }
    // land: west bank high at the back (bluff), the east bank low in front; the coves are low
    const dw = s < 0 ? -s - hw : 0, de = s > 0 ? s - hw : 0, bluff = 1 - sm(clamp((b - 14) / 12, 0, 1)); let h;
    if (s < 0) h = 1.7 + Math.min(dw, 12) * (0.2 + 0.42 * bluff) + (n0 - 0.5) * 1.4;
    else h = 1.5 + Math.min(de, 14) * 0.1 + (n0 - 0.5) * 1.2;
    for (const m of HILLS) h += mound(a, b, m[0], m[1], m[2], m[3], m[4]);
    if (b < 12) h += (s < 0 ? 1.8 : 1.0) * (1 - b / 12);     // the northern gorge: walls on both sides
    H[k] = clamp(Math.round(h), 1, s < 0 ? 8 : 6); MAT[k] = M.BANK;
  }
  const ell = (ca, cb, ra, rb, fn) => { for (let b = Math.floor(cb - rb - 2); b <= cb + rb + 2; b++) for (let a = Math.floor(ca - ra - 2); a <= ca + ra + 2; a++) { const d = ((a - ca) / ra) ** 2 + ((b - cb) / rb) ** 2, k = tile(a, b); if (k >= 0) fn(k, d, a, b); } };
  const flat = (ca, cb, ra, rb, lv) => ell(ca, cb, ra, rb, (k, d) => { if (isWater(k)) return; if (d < 1) H[k] = lv; else if (d < 1.7) H[k] = Math.round(lv + (H[k] - lv) * sm((d - 1) / 0.7)); });
  // ---------------------------------------------------------------- 2. islands, sandbars, mid-river rocks
  const island = (name, ca, cb, ra, rb, lv, core) => { const ks = []; ell(ca, cb, ra, rb, (k, d, a, b) => { const dd = d + (vnoise(a * 0.7, b * 0.7, 305) - 0.5) * 0.35; if (dd < 1) { H[k] = dd < 0.45 ? lv : Math.max(1, lv - (dd > 0.8 ? 2 : 1)); MAT[k] = dd < 0.42 ? core : dd < 0.72 ? M.COBBLE : M.WSAND; ks.push(k); } }); F.islands[name] = { c: W(ca, cb), tiles: ks }; return ks; };
  island('shrine', 24.5, 14.5, 4.4, 3.4, 3, M.PAVER); island('bar', 28, 35, 4.2, 1.7, 1, M.WREED); island('reedbar', 30.5, 19.5, 2.4, 1.7, 1, M.WREED); island('rocks', 17, 6.5, 1.8, 1.3, 2, M.BLUFF); island('eddy', 20.5, 23, 1.8, 1.4, 1, M.WSAND);
  // ---------------------------------------------------------------- 3. grounds (flat pads): ferry cove, tower, lookout, landing, village, hill, rim shelves
  const DOCKPAD = [11.5, 23.5, 3.2, 3.2, 2], YARD = [10.5, 29, 6, 4.6, 2], TOWER = [9, 8, 3.6, 3.4, 7], LOOK = [4.5, 14, 2.4, 2.4, 6], LAND = [35.5, 29, 5, 4, 2], VILL = [39, 19, 5, 5, 2], SHELFW = [12, 36, 5, 2.4, 2], SHELFE = [38, 36, 5, 2.4, 2], HILLE = [41, 7, 4, 4.5, 5];
  for (const [ca, cb, ra, rb, lv] of [DOCKPAD, YARD, TOWER, LOOK, LAND, VILL, SHELFW, SHELFE, HILLE]) flat(ca, cb, ra, rb, lv);
  // ---------------------------------------------------------------- 4. tributary: a stream falls from the bluff to the river in steps
  const CREEK = []; { const lv = [6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1]; for (let a = 2; a < 14; a++) { const b = 16 + (a > 8 ? 1 : 0), k = tile(a, b); if (k < 0) continue; MAT[k] = M.STREAM; H[k] = lv[a - 2]; CREEK.push(k);
      for (const bb of [b - 1, b + 1]) { const q = tile(a, bb); if (q >= 0 && !isWater(q)) H[q] = Math.max(H[q], lv[a - 2] + 1); } } }
  F.creek = CREEK; F.falls = CREEK.slice();
  // ---------------------------------------------------------------- 5. materials of the land
  for (const k of F.tiles) { if (isWater(k) || MAT[k] !== M.BANK) continue; const i = k % N, j = Math.floor(k / N), h = H[k], a = i - x0, b = j - y0, n0 = vnoise(i * 0.3, j * 0.3, 306), n1 = vnoise(i * 0.8, j * 0.8, 307);
    let near = 9; for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) if (inMap(i + di, j + dj) && isWater(id(i + di, j + dj))) near = Math.min(near, Math.abs(di) + Math.abs(dj));
    MAT[k] = h >= 5 ? (n1 > 0.7 ? M.BANK : M.BLUFF) : near <= 1 ? (n0 > 0.55 ? M.COBBLE : n1 > 0.6 ? M.WREED : M.WSAND) : near <= 2 && n1 > 0.55 ? M.WREED : h >= 4 ? (n0 > 0.5 ? M.BLUFF : M.BANK) : M.BANK; }
  ell(YARD[0], YARD[1], YARD[2] - 0.6, YARD[3] - 0.6, (k, d) => { if (d < 1 && !isWater(k)) MAT[k] = vnoise((k % N) * 0.8, Math.floor(k / N) * 0.8, 308) > 0.62 ? M.COBBLE : M.PAVER; });
  ell(TOWER[0], TOWER[1], TOWER[2], TOWER[3], (k, d) => { if (d < 1) MAT[k] = M.PAVER; }); ell(LOOK[0], LOOK[1], LOOK[2], LOOK[3], (k, d) => { if (d < 1) MAT[k] = M.PAVER; });
  ell(LAND[0], LAND[1], LAND[2] - 0.5, LAND[3] - 0.5, (k, d) => { if (d < 1 && !isWater(k)) MAT[k] = vnoise((k % N) * 0.8, Math.floor(k / N) * 0.8, 309) > 0.6 ? M.COBBLE : M.PAVER; });
  ell(VILL[0], VILL[1], VILL[2] - 1, VILL[3] - 1, (k, d) => { if (d < 1 && !isWater(k)) MAT[k] = vnoise((k % N) * 0.8, Math.floor(k / N) * 0.8, 310) > 0.7 ? M.COBBLE : M.BANK; });
  for (const [ca, cb, ra, rb] of [SHELFW, SHELFE]) ell(ca, cb, ra, rb, (k, d) => { if (d < 1 && !isWater(k)) MAT[k] = M.PAVER; });
  // piers over the water: the west pier (ferry station) and the east pier (landing). They end in deep water: the turtle comes alongside the pier ends.
  const pier = (a0, a1, bs, list) => { for (let b of bs) for (let a = a0; a <= a1; a++) { const k = tile(a, b); if (k < 0) continue; MAT[k] = M.DOCK; H[k] = 2; list.push(k); } };
  pier(13, 19, [28, 29], F.pierW); pier(30, 35, [28, 29], F.pierE);
  pier(12, 16, [35], []); pier(33, 36, [35], []);

  // ---------------------------------------------------------------- 6. routes (levels interpolated <= 1 per tile; planks over the creek)
  const route = (pts, mat) => {
    const tiles = []; for (let n = 0; n < pts.length - 1; n++) { let [a, b] = pts[n]; const [a1, b1] = pts[n + 1]; while (a !== a1 || b !== b1) { tiles.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); } }
    tiles.push(pts[pts.length - 1].slice(0, 2));
    const wl = pts.map(p => p[2]), idx = pts.map(p => tiles.findIndex(t => t[0] === p[0] && t[1] === p[1]));
    const gap = t => { const k = tile(...tiles[t]); return k >= 0 && (MAT[k] === M.STREAM || MAT[k] === M.POOL || MAT[k] === M.SEA); };
    const lv = tiles.map(([a, b]) => { const k = tile(a, b); return k >= 0 ? H[k] : 0; });
    for (let n = 0; n < pts.length; n++) if (wl[n] !== undefined && idx[n] >= 0) lv[idx[n]] = wl[n];
    for (let n = 0; n < pts.length - 1; n++) { if (wl[n] === undefined || wl[n + 1] === undefined || idx[n] < 0 || idx[n + 1] < 0) continue; const i0 = idx[n], i1 = idx[n + 1]; for (let t = i0; t <= i1; t++) lv[t] = Math.round(wl[n] + (wl[n + 1] - wl[n]) * (t - i0) / Math.max(1, i1 - i0)); }
    for (let pass = 0; pass < 3; pass++) { for (let t = 1; t < lv.length; t++) { if (gap(t)) continue; if (lv[t] - lv[t - 1] > 1) lv[t] = lv[t - 1] + 1; if (lv[t] - lv[t - 1] < -1) lv[t] = lv[t - 1] - 1; }
      for (let t = lv.length - 2; t >= 0; t--) { if (gap(t)) continue; if (lv[t] - lv[t + 1] > 1) lv[t] = lv[t + 1] + 1; if (lv[t] - lv[t + 1] < -1) lv[t] = lv[t + 1] - 1; } }
    const gaps = []; let last = null;
    for (let t = 0; t < tiles.length; t++) { const k = tile(...tiles[t]); if (k < 0) { last = null; continue; } if (gap(t)) { gaps.push(k); H[k] = last !== null ? last : H[k]; } else { H[k] = lv[t]; last = lv[t]; } }
    carvePath(pts.map(p => W(p[0], p[1])), mat || M.COBBLE, 'tth');
    for (const k of gaps) { if (MAT[k] === M.BRIDGE) MAT[k] = M.PLANK; }
    return gaps;
  };
  // pier tiles must keep their DOCK material under the paths
  const keepDock = () => { for (const k of [...F.pierW, ...F.pierE]) MAT[k] = M.DOCK; };
  let aw = 0; for (let a = L.a0; a < L.w; a++) if (tile(a, 30) >= 0) { aw = a; break; }
  F.westEnd = W(aw, 30);
  route([[aw, 30, 2], [6, 30, 2], [9, 29, 2], [14, 29, 2], [19, 29, 2]]);                                // SDL's east road -> ferry yard -> the pier (ends in deep water)
  route([[9, 28, 2], [13, 28, 2], [19, 28, 2]]);                                                           // second plank of the pier
  route([[9, 26, 2], [9, 23, 3], [7, 21, 4], [6, 19, 5], [5, 17, 6], [5, 14, 6]]);                       // switchbacks up the bluff to the lookout (crosses the creek on a plank bridge)
  route([[5, 14, 6], [6, 11, 7], [8, 9, 7], [9, 8, 7]]);                                                   // on to the signal tower
  route([[9, 31, 2], [9, 34, 2], [12, 36, 2], [15, 36, 2]]);                                              // south: rim shelf over the cataract
  route([[6, 30, 2], [6, 33, 2], [5, 35, 2]]);                                                             // to the wreck
  route([[30, 29, 2], [35, 29, 2], [35, 24, 2], [38, 22, 2], [39, 19, 2], [39, 14, 2], [40, 11, 3], [41, 8, 4], [41, 4, 5], [41, 3, 5]]);   // the far bank: landing -> village -> up the wooded hill -> north exit
  route([[35, 29, 2], [35, 33, 2], [34, 35, 2], [37, 36, 2], [41, 36, 2]]);                              // landing -> south shelf -> the rim
  route([[38, 22, 2], [42, 22, 2], [43, 25, 2]]);                                                          // village east lane
  keepDock();
  F.eastEnd = W(41, 3); F.eastRoot = W(39, 14);

  // ---------------------------------------------------------------- 7. props: landmarks first, then dressing
  const P = (kind, a, b, o) => { const [i, j] = W(a, b); if (!inB(i, j)) return null; if (o && o.block) { const fw = o.fp ? o.fp[0] : 1, fh = o.fp ? o.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) { const z = id(i + r, j + q); if (z >= N * N || PATHC[z] || isWater(z) || MAT[z] === M.PLANK || MAT[z] === M.DOCK || BIO[z] !== B) return null; } } return prop(kind, i, j, o); };
  const Q = (kind, a, b, o) => { const [i, j] = W(a, b); if (inB(i, j)) poi(kind, 'tth', i, j, o); };
  const LT = (a, b, r, col, kind) => TWM.lights.push({ biome: 'tth', i: x0 + a, j: y0 + b, r, col, kind: kind || 'fire' });
  P('tthdock', 10, 22, { fp: [4, 4], v: 0, block: true }); P('tthtower', 7, 5, { fp: [3, 3], v: 0, block: true }); P('tthshrine', 22, 12, { fp: [4, 4], v: 0, block: false });
  P('tthgate', 32, 27, { fp: [3, 3], v: 0, block: false }); P('tthstatue', 3, 28, { fp: [1, 1], v: 0, block: true }); P('tthstatue', 37, 31, { fp: [1, 1], v: 1, block: true });
  P('tthwreck', 3, 33, { fp: [3, 2], v: 0, block: true });
  for (const [a, b, v] of [[37, 14, 0], [41, 16, 1], [42, 20, 0], [36, 21, 1], [40, 24, 1], [44, 28, 0], [38, 38, 0]]) P('tthhut', a, b, { fp: [2, 2], v, block: true });
  for (const [a, b, v] of [[10, 33, 0], [4, 29, 1], [37, 26, 0], [41, 31, 0], [34, 22, 1]]) P('tthnetrack', a, b, { fp: [1, 1], v, block: true });
  F.keep = W(11, 24); F.tower = W(8, 8); F.shrine = W(24, 14); F.gateE = W(33, 29); F.foc = W(21, 28);
  // posts (west bank = w, east bank = e): the activities choose a post by bank, so nobody tries to cross the river
  Q('tdock_w', 18, 28, { cap: 3, face: 'right' }); Q('tdock_w', 18, 29, { cap: 3, face: 'right' }); Q('tdock_w', 15, 28, { cap: 2, face: 'right' }); Q('tpierend_w', 19, 28, { cap: 2, face: 'right' });
  Q('tnet_w', 11, 33, { cap: 2, face: 'up' }); Q('tmoor_w', 12, 31, { cap: 2, face: 'right' }); Q('tcook_w', 11, 31, { cap: 4, face: 'up' }); Q('twreck_w', 5, 34, { cap: 2, face: 'right' });
  Q('tlook_w', 5, 14, { cap: 2, face: 'right' }); Q('tlook_w', 5, 12, { cap: 2, face: 'right' }); Q('ttower_w', 9, 10, { cap: 2, face: 'down' }); Q('tcreek_w', 8, 20, { cap: 2, face: 'down' });
  Q('trim_w', 14, 36, { cap: 3, face: 'right' }); Q('trim_w', 12, 37, { cap: 2, face: 'right' }); Q('tgossip_w', 8, 29, { cap: 4, face: 'up' });
  Q('tdock_e', 31, 28, { cap: 3, face: 'left' }); Q('tdock_e', 31, 29, { cap: 3, face: 'left' }); Q('tpierend_e', 30, 28, { cap: 2, face: 'left' });
  Q('tnet_e', 36, 27, { cap: 2, face: 'up' }); Q('tnet_e', 35, 23, { cap: 2, face: 'up' }); Q('tmoor_e', 33, 31, { cap: 2, face: 'left' }); Q('tcook_e', 37, 29, { cap: 4, face: 'up' });
  Q('tvill_e', 38, 19, { cap: 4, face: 'up' }); Q('tvill_e', 41, 22, { cap: 3, face: 'up' }); Q('tgate_e', 34, 29, { cap: 2, face: 'right' }); Q('tlook_e', 41, 10, { cap: 2, face: 'left' }); Q('tlook_e', 41, 6, { cap: 2, face: 'left' });
  Q('trim_e', 36, 36, { cap: 3, face: 'left' }); Q('trim_e', 40, 36, { cap: 2, face: 'left' }); Q('tgossip_e', 40, 29, { cap: 4, face: 'up' });
  // moored boats and drifting craft (drawn by the fx layer so they bob on the water): [a, b, variant, facing]
  F.boats = [[16.4, 30.9, 0, 1], [17.6, 27.2, 1, 1], [28.4, 30.6, 1, -1], [29.2, 27.3, 0, -1], [32.8, 32.4, 0, -1], [14.4, 33.4, 1, 1], [34.5, 20.5, 0, -1]];
  // reeds, willows, rocks, pines
  for (let n = 0; n < 230; n++) { const a = Math.floor(R() * L.w), b = Math.floor(R() * L.h), k = tile(a, b); if (k < 0 || RES[k] || PATHC[k] || isWater(k) || MAT[k] === M.DOCK || MAT[k] === M.PAVER || MAT[k] === M.PLANK) continue;
    const m = MAT[k], h = H[k]; let kind;
    if (m === M.WREED || m === M.WSAND) kind = R() < 0.7 ? 'tthreeds' : 'tthrock'; else if (m === M.COBBLE) kind = 'tthrock'; else if (m === M.BANK) kind = R() < 0.4 ? 'tthwillow' : R() < 0.5 ? 'tthreeds' : 'tthpine'; else kind = h >= 5 ? (R() < 0.6 ? 'tthpine' : 'tthrock') : 'tthrock';
    P(kind, a, b, { fp: [1, 1], v: n & 3, block: kind !== 'tthreeds' }); if (kind === 'tthreeds') F.reeds.push(W(a, b)); }
  // boulders standing in the rapids and at the lip of the cataract (the water foams around them): purely scenic, the river tiles stay unwalkable
  { const rockAt = []; for (const k of F.water) { const i = k % N, j = Math.floor(k / N), a = i - x0, b = j - y0; if (MAT[k] === M.STREAM && ((b < 13 && b >= 1) || (b >= 33 && b <= 37)) && hash2(i, j, 313) < (b < 13 ? 0.12 : 0.1)) rockAt.push([a, b]); }
    rockAt.forEach(([a, b], n) => P('tthrock', a, b, { fp: [1, 1], v: n & 3, block: false })); F.rocksInWater = rockAt.length; }
  // shrine island dressing: cranes, lanterns, reeds
  for (const [a, b] of [[22, 16], [27, 16], [26, 12], [23, 17]]) { const k = tile(a, b); if (k >= 0) P('tthreeds', a, b, { fp: [1, 1], v: (a + b) & 3, block: false }); }
  for (const [a, b] of [[30, 19], [31, 20], [27, 35], [29, 35], [28, 34], [30, 36]]) { const k = tile(a, b); if (k >= 0 && !isWater(k)) { P('tthreeds', a, b, { fp: [1, 1], v: (a + b) & 3, block: false }); F.reeds.push(W(a, b)); } }
  F.cranes = [W(24, 16), W(29, 35), W(30.5, 19.5), W(17, 6.5)];
  // lamp posts on the piers and the yards (blue river lanterns); the fx layer draws the glow and the flames
  for (const [a, b] of [[13, 27], [16, 27], [19, 27], [30, 27], [33, 27], [35, 27], [8, 27], [9, 31], [36, 31], [38, 25], [8, 20], [6, 15], [10, 7], [8, 11]]) { const k = tile(a, b); if (k >= 0 && !isWater(k)) { F.lanterns.push(W(a, b)); LT(a, b, 40, '120,210,255', 'lantern'); } }
  LT(9, 8, 120, '110,220,255'); LT(5, 25, 80, '255,200,120'); LT(24, 14, 90, '120,255,230'); LT(34, 29, 70, '255,220,150'); LT(39, 19, 70, '255,200,120');
  F.torches = F.lanterns.slice();
  F.posts = { dock: F.keep, tower: F.tower, shrine: F.shrine, landing: F.gateE };
  // reserve the great squares so scatter never lands on them
  for (let b = 26; b <= 31; b++) for (let a = 6; a <= 19; a++) { const k = tile(a, b); if (k >= 0) RES[k] = 1; }
  for (let b = 26; b <= 31; b++) for (let a = 30; a <= 38; a++) { const k = tile(a, b); if (k >= 0) RES[k] = 1; }

  // ---------------------------------------------------------------- 8. edges: the river leaves north into Lôi Âm placeholder land; seam, outward band, rim
  // the river's northern continuation (a narrowing rocky cleft inside the neighbouring placeholder land) so it does not begin at a straight cut
  for (let t = 1; t <= 9; t++) { const b = -t, ac = AC(0) + Math.sin(t * 0.7) * 0.6, hw = Math.max(1.2, 4.2 - t * 0.35);
    for (let a = Math.floor(ac - hw - 3); a <= Math.ceil(ac + hw + 3); a++) { const [i, j] = W(a, b); if (!inMap(i, j) || TWM.biomes[BIO[id(i, j)]].built) continue; const k = id(i, j), d = Math.abs(a - ac);
      if (MAT[k] === M.VOID) continue;
      if (d < hw) { MAT[k] = M.STREAM; H[k] = 2; F.north.push(k); } else if (d < hw + 2.6) { MAT[k] = M.BLUFF; H[k] = 3 + Math.round((d - hw) * 0.8) + Math.round(t / 4); F.north.push(k); } } }
  F.out = [];
  const dOut = new Map(); { const q = []; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] !== M.VOID && !dOut.has(z)) { dOut.set(z, 1); q.push(z); } } }
    for (let h = 0; h < q.length; h++) { const k = q[h], d = dOut.get(k); if (d >= 6) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (MAT[z] === M.VOID || TWM.biomes[BIO[z]].built || dOut.has(z)) continue; dOut.set(z, d + 1); q.push(z); } } }
  for (const [k, d] of dOut) { if (TWM.biomes[BIO[k]].built || RES[k] || F.north.includes(k)) continue; const i = k % N, j = Math.floor(k / N), p = Math.pow(1 - (d - 1) / 5.5, 1.2), r = hash2(i, j, 311), n = vnoise(i * 0.4, j * 0.4, 312);
    if (MAT[k] >= M.PH && MAT[k] < M.BANK && r < p * (0.5 + n * 0.55)) { MAT[k] = n > 0.6 ? M.COBBLE : n > 0.35 ? M.WREED : M.BANK; F.out.push(k); } else if (MAT[k] === M.TRAIL && d < 5) MAT[k] = M.COBBLE;
    if (d <= 4 && r > 0.93 - p * 0.1 && !PATHC[k] && MAT[k] !== M.TRAIL && (MAT[k] === M.BANK || MAT[k] === M.WREED)) prop(r > 0.97 ? 'tthwillow' : 'tthreeds', i, j, { fp: [1, 1], v: Math.floor(r * 97) & 3, block: r > 0.97 }); }
  // near-field: every unbuilt tile around the biome (including the world-rim wall) paints its cliff faces in wet blue-grey bluff stone (tw-art faceCol)
  { const near = TWM.tthNear = new Uint8Array(N * N), q = [], dl = new Int16Array(N * N).fill(-1);
    for (const k of F.tiles) { near[k] = 1; dl[k] = 0; q.push(k); }
    for (let h = 0; h < q.length; h++) { const k = q[h]; if (dl[k] >= 12) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b)) continue; const z = id(i + a, j + b); if (dl[z] >= 0) continue; if (BIO[z] !== B && TWM.biomes[BIO[z]].built) continue; dl[z] = dl[k] + 1; near[z] = 1; q.push(z); } }
    // where Sư Đà Lĩnh's own near field overlaps, the closer biome wins (its slate stays on its side)
    if (TWM.lionNear) for (let k = 0; k < N * N; k++) { if (!near[k] || BIO[k] === B) continue; if (TWM.lionNear[k]) { let dd = 99; const i = k % N, j = Math.floor(k / N); for (let dj = -12; dj <= 12; dj++) for (let di = -12; di <= 12; di++) if (inB(i + di, j + dj)) dd = Math.min(dd, Math.abs(di) + Math.abs(dj)); if (dd > 9) near[k] = 0; else TWM.lionNear[k] = 0; } }
    if (TWM.fireNear) for (let k = 0; k < N * N; k++) if (near[k] && TWM.fireNear[k] && BIO[k] !== B) near[k] = 0; }
  // rim composition: shelves and pines along the south and east strips; bluffs line the cataract so it reads as a cut, not a hole
  for (const [a, b] of [[1, 37], [7, 37], [16, 38], [24, 38], [40, 37], [44, 34], [45, 24], [45, 14], [44, 4], [34, 1], [16, 1], [1, 5], [2, 18]]) { const k = tile(a, b); if (k >= 0 && !RES[k] && !PATHC[k] && !isWater(k) && MAT[k] !== M.DOCK) P((a + b) % 3 ? 'tthwillow' : 'tthrock', a, b, { fp: [1, 1], v: (a + b) & 3, block: true }); }
  TWM.homes = TWM.homes || {}; TWM.homes.tth = { fisher_w: W(11, 31), fisher_e: W(36, 28), ferryman: W(15, 29), imp_w: W(9, 27), imp_e: W(38, 24), _: W(10, 30) };
  F.whirl = W(WHIRL[0], WHIRL[1]);
};
window.TW_RIVER_FINAL = function (X) {   // the two banks are separate walk graphs: keep a POI only if it is reachable from its own bank's anchor
  const { TWM, id, N } = X, F = TWM.river, B = F.B, bfs = st => { const seen = new Uint8Array(N * N), q = [st]; seen[st] = 1; for (let n = 0; n < q.length; n++) { const k = q[n], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (!seen[z] && TWM.BIO[z] === B && TWM.canStep(k, z)) { seen[z] = 1; q.push(z); } } } return seen; };
  const W = bfs(id(F.westEnd[0], F.westEnd[1])), E = bfs(id(F.eastRoot[0], F.eastRoot[1])); F.reachW = W; F.reachE = E;
  const before = TWM.pois.length; F.dropped = []; TWM.pois = TWM.pois.filter(p => { if (p.biome !== 'tth') return true; const k = id(Math.floor(p.x / 8), Math.floor(p.y / 8)), ok = /_w$/.test(p.kind) ? W[k] : /_e$/.test(p.kind) ? E[k] : (W[k] || E[k]); if (!ok) F.dropped.push(p.kind + '@' + (p.i - F.x0) + ',' + (p.j - F.y0)); return ok; }); F.droppedPois = before - TWM.pois.length;
};
if (typeof module !== 'undefined') module.exports = {};
