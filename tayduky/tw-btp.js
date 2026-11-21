'use strict';
// ===== Tây Du Ký v2 — Lòng Bàn Tay Phật Tổ (the Buddha's Palm), rebuilt: map build (world space; loaded before tw-map.js) =====
// A real hand: an ivory-gold PALM slab (level 6) with three inlaid palm lines, FIVE finger pillars (pinky 12, ring 15, middle 18, index 15 levels; carved knuckle bands, nail caps) rising along its north edge with mist valleys between them,
// the thumb standing at the east side (level 10), the wrist running away to the south-west and dissolving into the cloud sea. The seated Buddha sits on a stepped lotus terrace at the west corner (level 10).
// Everything else is the celestial cloud sea (deep sky) with cloud terraces, lotus islands and cloud bridges. The planner region (953 tiles, x 53-90 / y 30-76) is kept.
window.TW_BTP_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, prop, poi, id, inMap, vnoise, hash2, carvePath, mulberry32 } = X;
  const B = TWM.bi.btp, R = mulberry32(20261205);
  const inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === B && MAT[id(i, j)] !== M.VOID, tile = (i, j) => inB(i, j) ? id(i, j) : -1;
  const sm = t => t * t * (3 - 2 * t), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let k = 0; k < N * N; k++) if (BIO[k] === B) { const i = k % N, j = Math.floor(k / N); x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  // ---------------------------------------------------------------- 0. purge the old pilot
  const mine = (i, j) => { i = Math.floor(i); j = Math.floor(j); return inMap(i, j) && BIO[id(i, j)] === B; };
  TWM.props = TWM.props.filter(p => !mine(p.i, p.j)); TWM.pois = TWM.pois.filter(p => p.biome !== 'btp'); TWM.lights = TWM.lights.filter(l => l.biome !== 'btp'); TWM.decals = TWM.decals.filter(d => !mine(d.i, d.j)); TWM.falls = TWM.falls.filter(f => !mine(f.i, f.j));
  for (const key of [...TWM.stairs.keys()]) { const [a, b] = key.split(',').map(Number); if (BIO[a] === B || BIO[b] === B) TWM.stairs.delete(key); } for (const key of [...TWM.stairAt.keys()]) if (BIO[key] === B) TWM.stairAt.delete(key);
  const F = TWM.palm = { B, x0, y0, x1, y1, tiles: [], fingers: [], tiers: [], islands: [], clouds: [], drift: [], edges: [], pois: {}, lamps: [], lotuses: [], runes: [], path: [], failed: [], centre: [74, 53], buddha: [64, 53], island: { west: [59, 50], east: [88, 44] }, seal: [74.5, 53.5] };
  TWM.layout.btp = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  const FIX = new Uint8Array(N * N);
  // ---------------------------------------------------------------- 1. the cloud sea: deep sky, shallow near the borders so no cliff shows against a neighbour
  const distB = new Int16Array(N * N).fill(99); { const q = []; for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) if (inB(i, j)) { F.tiles.push(id(i, j)); let e = false; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!inB(i + a, j + b)) e = true; if (e) { distB[id(i, j)] = 0; q.push(id(i, j)); } }
    for (let h = 0; h < q.length; h++) { const k = q[h], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (distB[z] > distB[k] + 1) { distB[z] = distB[k] + 1; q.push(z); } } } }
  for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), d = distB[k], n = vnoise(i * 0.12, j * 0.12, 1101), m = vnoise(i * 0.3, j * 0.3, 1102);
    H[k] = d <= 2 ? 1 : d <= 4 ? (n > 0.5 ? 1 : 0) : n > 0.72 ? -1 : n > 0.55 ? 0 : (m > 0.8 ? 2 : 1); MAT[k] = M.SKYD; PATHC[k] = 0; RES[k] = 0; }
  const ell = (ca, cb, ra, rb, fn, pw) => { pw = pw || 2; for (let b = Math.floor(cb - rb - 2); b <= cb + rb + 2; b++) for (let a = Math.floor(ca - ra - 2); a <= ca + ra + 2; a++) { const d = (Math.abs(a - ca) / ra) ** pw + (Math.abs(b - cb) / rb) ** pw, k = tile(a, b); if (k >= 0) fn(k, d, a, b); } };
  const set = (a, b, lv, mat) => { const k = tile(a, b); if (k < 0) return; H[k] = lv; MAT[k] = mat; FIX[k] = 1; };
  const rect = (a0, b0, a1, b1, lv, mat) => { for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) set(a, b, lv, mat); };
  // ---------------------------------------------------------------- 2. the cloud terraces under the hand (so the slab floats on layered cloud), lotus islands
  const island = (ca, cb, ra, rb, lv, mat) => ell(ca, cb, ra, rb, (k, d) => { if (d < 1) { H[k] = lv; MAT[k] = mat || M.SKYC; FIX[k] = 1; } else if (d < 1.9 && !FIX[k] && H[k] < lv - 1) { H[k] = Math.max(H[k], lv - 2); MAT[k] = M.SKYC; } });
  island(74, 55, 15, 11, 2, M.SKYC); island(74, 53, 12.5, 9, 3, M.SKYC);                                    // two cloud terraces around the palm
  island(59, 50, 3.2, 2.8, 3, M.SKYC); island(66, 66, 3.4, 3, 3, M.SKYC); island(88, 44, 2.4, 2.2, 3, M.SKYC); island(60, 63, 2.6, 2.4, 2, M.SKYC); island(80, 66, 2.2, 2, 2, M.SKYC);   // lotus islands
  // ---------------------------------------------------------------- 3. the hand
  // palm slab: a rounded rectangle x 67-82 / y 48-58, level 6
  for (let b = 48; b <= 58; b++) for (let a = 67; a <= 82; a++) { const cx = Math.abs(a - 74.5) / 8.4, cy = Math.abs(b - 53) / 5.9; if ((cx ** 4 + cy ** 4) < 1.02) set(a, b, 6, M.PGOLD); }
  // wrist: runs to the south-west, stepping down 5,4,3 and fading into the cloud
  for (let b = 59; b <= 70; b++) { const t = (b - 59) / 11, c = 71 - t * 9, w = 5.2 - t * 1.8, lv = b <= 61 ? 5 : b <= 64 ? 4 : 3; for (let a = Math.round(c - w); a <= Math.round(c + w); a++) set(a, b, lv, M.PGOLD); }
  // fingers (x ranges, top level), 10 tiles long (y 38-47); the thumb is a stouter pillar at the east side
  const FING = [{ n: 'little', a: 67, b: 68, lv: 12, y0: 43 }, { n: 'ring', a: 70, b: 72, lv: 15, y0: 42 }, { n: 'middle', a: 74, b: 76, lv: 18, y0: 41 }, { n: 'index', a: 78, b: 80, lv: 15, y0: 42 }, { n: 'thumb', a: 83, b: 85, lv: 10, y0: 48, y1: 55 }];
  FING.forEach((f, k) => { const ya = f.y0 || 38, yb = f.y1 || 47; rect(f.a, ya, f.b, yb, f.lv, M.PFING); for (let a = f.a; a <= f.b; a++) set(a, ya, f.lv, M.PLOT);   // nail cap
    F.fingers.push({ k, name: f.n, i: f.a, j: ya, cx: (f.a + f.b) / 2, cy: ya, lv: f.lv, w: (f.b - f.a + 1) * 32, a: f.a, b: f.b, y0: ya, y1: yb, front: [Math.round((f.a + f.b) / 2), yb + 1] }); });
  // mist valleys between the fingers (walkable lanes, level 5) and the palm's lip
  for (const a of [69, 73, 77, 81]) rect(a, 44, a, 47, 5, M.SKYC);
  for (let a = 66; a <= 83; a++) if (tile(a, 47) >= 0 && MAT[tile(a, 47)] === M.SKYD) set(a, 47, 5, M.SKYC);
  // palm lines (gold inlay): heart, head and life lines as sampled curves
  const line = pts => { for (let s = 0; s <= 40; s++) { const t = s / 40; let [px, py] = [0, 0]; const n = pts.length - 1, f = t * n, q = Math.min(n - 1, Math.floor(f)), u = f - q; px = pts[q][0] + (pts[q + 1][0] - pts[q][0]) * u; py = pts[q][1] + (pts[q + 1][1] - pts[q][1]) * u; const k = tile(Math.round(px), Math.round(py)); if (k >= 0 && MAT[k] === M.PGOLD && H[k] === 6) MAT[k] = M.PLINE; } };
  line([[68, 50], [71, 49.5], [75, 50.5], [79, 50], [81, 51.5]]); line([[68, 53.5], [72, 53], [76, 54], [80, 55]]); line([[78, 49], [75, 52], [71.5, 55], [70, 58]]);
  // the seal circle: a ring of inlay centred on the palm (74.5, 53.5)
  for (let s = 0; s < 64; s++) { const a = s / 64 * 6.2832, k = tile(Math.round(74.5 + Math.cos(a) * 4.2), Math.round(53.5 + Math.sin(a) * 3.1)); if (k >= 0 && H[k] === 6 && MAT[k] === M.PGOLD) MAT[k] = M.PLINE; }
  // the Buddha's lotus terrace at the west corner (level 10) and its stairs of lotus petals up from the palm
  ell(64.2, 53.5, 2.4, 2.4, (k, d, a, b) => { if (d < 1) { H[k] = 10; MAT[k] = M.PLOT; FIX[k] = 1; } });
  F.tiers = [[66.4, 55.8, 1.4, 1.4, 7], [65, 55.4, 1.4, 1.4, 8], [64.4, 56.6, 1.5, 1.4, 9]]; for (const [ca, cb, ra, rb, lv] of F.tiers) ell(ca, cb, ra, rb, (k, d) => { if (d < 1) { H[k] = lv; MAT[k] = M.PLOT; FIX[k] = 1; } });
  // ---------------------------------------------------------------- 4. relax unfixed ground to one level, then routes with stairs
  const isWalkMat = m => m === M.SKYC || m === M.PGOLD || m === M.PLINE || m === M.PLOT;
  for (let pass = 0; pass < 60; pass++) { let ch = 0; for (const k of F.tiles) { if (FIX[k]) continue; const i = k % N, j = Math.floor(k / N); let lo = -9, hi = 99; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(i + a, j + b)) continue; const q = id(i + a, j + b), h = H[q]; if (!isWalkMat(MAT[q])) { lo = Math.max(lo, h - 2); hi = Math.min(hi, h + 2); } else { lo = Math.max(lo, h - 3); hi = Math.min(hi, h + 3); } } const v = lo <= hi ? clamp(H[k], lo, hi) : Math.round((lo + hi) / 2); if (v !== H[k]) { H[k] = v; ch++; } } if (!ch) break; }
  const arc = pts => { const t = []; for (let n = 0; n < pts.length - 1; n++) { let [a, b] = pts[n]; const [a1, b1] = pts[n + 1]; while (a !== a1 || b !== b1) { t.push([a, b]); if (Math.abs(a1 - a) >= Math.abs(b1 - b) && a !== a1) a += Math.sign(a1 - a); else b += Math.sign(b1 - b); } } t.push(pts[pts.length - 1].slice()); return t; };
  const route = (pts, lvOf, mat) => { const tiles = arc(pts); const lv = tiles.map(([a, b]) => { const k = tile(a, b); return k >= 0 ? H[k] : 0; }); if (lvOf) tiles.forEach((p, t) => { const v = lvOf(p, t, tiles.length); if (v !== undefined) lv[t] = v; });
    for (let pass = 0; pass < 3; pass++) { for (let t = 1; t < lv.length; t++) { if (lv[t] - lv[t - 1] > 1) lv[t] = lv[t - 1] + 1; if (lv[t] - lv[t - 1] < -1) lv[t] = lv[t - 1] - 1; } for (let t = lv.length - 2; t >= 0; t--) { if (lv[t] - lv[t + 1] > 1) lv[t] = lv[t + 1] + 1; if (lv[t] - lv[t + 1] < -1) lv[t] = lv[t + 1] - 1; } }
    tiles.forEach(([a, b], t) => { const k = tile(a, b); if (k < 0) return; H[k] = lv[t]; if (!(MAT[k] === M.PGOLD || MAT[k] === M.PLINE || MAT[k] === M.PLOT || MAT[k] === M.PFING)) MAT[k] = mat || M.SKYC; else if (MAT[k] === M.PFING) MAT[k] = M.SKYC; FIX[k] = 1; PATHC[k] = 1; F.path.push(k); });
    let prev = null; for (const [a, b] of tiles) { const k = tile(a, b); if (k < 0) { prev = null; continue; } if (prev !== null && Math.abs(H[k] - H[prev]) >= 1) { const lo = H[k] > H[prev] ? prev : k, hi = lo === k ? prev : k; TWM.stairs.set(lo + ',' + hi, 1); TWM.stairs.set(hi + ',' + lo, 1); const li = lo % N, lj = Math.floor(lo / N), hi_ = hi % N, hj = Math.floor(hi / N); if (!(hi_ > li || hj > lj)) { TWM.stairAt.set(lo, { dir: hi_ < li ? 'i' : 'j', dh: H[hi] - H[lo] }); TWM.props.push({ kind: 'stairs', biome: 'btp', i: li, j: lj, dir: hi_ < li ? 'i' : 'j', dh: H[hi] - H[lo], block: false, flat: true }); } } prev = k; } };
  route([[74, 59], [73, 62], [70, 65], [67, 66]], null, M.SKYC);                      // down the wrist to the south island
  route([[67, 49], [64, 49], [61, 50], [60, 50]], null, M.SKYC);                              // west lip to the west island
  route([[74, 58], [78, 62], [80, 65]], null, M.SKYC);                              // south-east cloud bridge to the lotus islet
  route([[82, 53], [84, 56], [86, 58]], null, M.SKYC);
  route([[82, 52], [84, 47], [87, 44], [88, 43]], null, M.SKYC);                    // east: past the thumb to the east lotus island
  route([[88, 43], [89, 41], [90, 40], [90, 39]], (p, t) => (t < 2 ? 3 : t < 3 ? 2 : 1), M.SKYC);   // the cloud walkway to the Huaguo door side (meets Hoa Quả Sơn / Ngũ Trang Quán on level 1)
  for (const a of [69, 73, 77, 81]) route([[a, 47], [a, 44]], () => 5, M.SKYC);       // lanes between the fingers
  route([[66, 49], [66, 47], [66, 45]], () => 5, M.SKYC); route([[67, 56], [66, 55], [66.4 | 0, 55]], null, M.SKYC);
  // palm -> valley lanes and the lotus stairs up to the Buddha
  route([[69, 48], [69, 47]], (p, t) => (t === 0 ? 6 : 5), M.SKYC); route([[73, 48], [73, 47]], (p, t) => (t === 0 ? 6 : 5), M.SKYC); route([[77, 48], [77, 47]], (p, t) => (t === 0 ? 6 : 5), M.SKYC); route([[81, 48], [81, 47]], (p, t) => (t === 0 ? 6 : 5), M.SKYC);
  route([[67, 55], [66, 56], [65, 56], [65, 55]], (p, t) => [6, 7, 8, 9][Math.min(3, t)]);
  // re-establish the slab materials where routes crossed (the palm itself keeps its own stone)
  // stairs on every one-level edge between walkable ground
  F.stairs = 0; for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [0, 1]]) { if (!inB(i + a, j + b)) continue; const z = id(i + a, j + b); if (Math.abs(H[k] - H[z]) !== 1 || !isWalkMat(MAT[k]) || !isWalkMat(MAT[z]) || TWM.stairs.has(k + ',' + z)) continue; TWM.stairs.set(k + ',' + z, 1); TWM.stairs.set(z + ',' + k, 1); F.stairs++; } }
  // ---------------------------------------------------------------- 5. props and posts
  const P = (kind, a, b, o) => { if (!inB(a, b)) return null; if (o && o.block) { const fw = o.fp ? o.fp[0] : 1, fh = o.fp ? o.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) { const z = id(a + r, b + q); if (z >= N * N || PATHC[z] || BIO[z] !== B || !isWalkMat(MAT[z])) return null; } } return prop(kind, a, b, o); };
  const L1 = (kind, a, b, o) => { let p = P(kind, a, b, o); if (!p) for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) { p = P(kind, a + da, b + db, o); if (p) break; } if (!p) F.failed.push(kind + '@' + a + ',' + b); return p; };
  const blocked = new Set(); const rb = () => { blocked.clear(); for (const p of TWM.props) if (p.block && p.biome === 'btp') { const fw = p.fp ? p.fp[0] : 1, fh = p.fp ? p.fp[1] : 1; for (let q = 0; q < fh; q++) for (let r = 0; r < fw; r++) blocked.add(id(p.i + r, p.j + q)); } };
  const snap = (a, b, r) => { for (let q = 0; q <= (r === undefined ? 2 : r); q++) for (let dj = -q; dj <= q; dj++) for (let di = -q; di <= q; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== q) continue; const k = tile(a + di, b + dj); if (k >= 0 && isWalkMat(MAT[k]) && !blocked.has(k)) return [a + di, b + dj]; } return null; };
  const Q = (kind, a, b, o) => { rb(); const s = snap(a, b, 2); if (!s) { F.failed.push('poi:' + kind + '@' + a + ',' + b); return null; } const p = poi(kind, 'btp', s[0], s[1], o); if (p) RES[id(s[0], s[1])] = 1; return p; };
  const LT2 = (a, b, r, col, kind) => TWM.lights.push({ biome: 'btp', i: a, j: b, r, col, kind: kind || 'lantern' });
  L1('buddha', 64, 52, { fp: [3, 3], v: 0, block: true }); LT2(64, 53, 150, '255,232,160', 'magic');                                  // Phật Tổ
  L1('pwheel', 68, 52, { fp: [1, 1], v: 0, block: true }); L1('pwheel', 70, 53, { fp: [1, 1], v: 0, block: false });
  for (const [a, b, v] of [[68, 49, 0], [81, 49, 1], [68, 57, 0], [81, 57, 1]]) { if (L1('plantern', a, b, { fp: [1, 1], v, block: true })) { F.lamps.push([a, b]); LT2(a, b, 60, '255,226,150'); } }
  for (const [a, b] of [[59, 50], [66, 66], [88, 44], [60, 63], [80, 66]]) { L1('plotus', a, b, { fp: [1, 1], v: (a + b) & 1, block: true }); F.lotuses.push([a, b]); }
  L1('pbell', 58, 51, { fp: [1, 1], v: 0, block: true }); L1('pbell', 89, 45, { fp: [1, 1], v: 0, block: true }); L1('pbell', 66, 64, { fp: [1, 1], v: 0, block: true });
  F.fingers.forEach(f => { LT2(Math.round(f.cx), f.y0 + 1, 90, '255,230,150', 'magic'); Q('pillar', f.front[0], f.front[1], { cap: 2, face: 'up', finger: f.k }); Q('pillar_back', Math.round(f.cx), f.y0 + 3, { cap: 1, face: 'down', finger: f.k }); });
  Q('devotion', 65, 56, { cap: 5, face: 'up' }); Q('devotion', 66, 55, { cap: 3, face: 'up' }); Q('lotus', 59, 51, { cap: 3, face: 'right' }); Q('lotus', 88, 45, { cap: 3, face: 'left' }); Q('lotus', 66, 65, { cap: 3, face: 'up' });
  Q('launch', 74, 55, { cap: 3, face: 'up' }); Q('rest', 70, 57, { cap: 4, face: 'down' }); Q('rest', 79, 57, { cap: 4, face: 'up' });
  for (const [a, b] of [[69, 54], [79, 52], [72, 50], [77, 56], [72, 62], [86, 57]]) Q('stroll', a, b, { cap: 2 });
  for (const [a, b] of [[72, 52], [77, 52], [72, 55], [77, 55]]) Q('bpseal', a, b, { cap: 1, face: 'up' });
  for (const [a, b] of [[69, 45], [73, 45], [77, 45], [81, 45]]) Q('bplane', a, b, { cap: 2, face: 'up' });
  for (const [a, b] of [[70, 60], [76, 61], [68, 51]]) Q('bplamp', a, b, { cap: 2, face: 'down' });
  F.runes = [[74.5, 53.5]]; F.edges = [[56, 44], [58, 60], [86, 62], [70, 72], [84, 40], [62, 40]].filter(p => inB(p[0], p[1]));
  // ---------------------------------------------------------------- 6. cloud dressing: banks along the terraces (animated by the fx), a few sprite clouds low in the sea
  for (let n = 0; n < 130; n++) { const k = F.tiles[Math.floor(R() * F.tiles.length)], i = k % N, j = Math.floor(k / N); if (MAT[k] !== M.SKYD || RES[k]) continue; F.clouds.push({ kind: R() < 0.3 ? 'pcloudw' : 'pcloud', i, j, lift: [-6, -2, 0, 3, 7][Math.floor(R() * 5)], v: Math.floor(R() * 8) }); }
  for (let n = 0; n < 18; n++) { const k = F.tiles[Math.floor(R() * F.tiles.length)], i = k % N, j = Math.floor(k / N); F.drift.push({ kind: n % 3 ? 'pcloud' : 'pcloudw', i, j, lift: 6 + R() * 26, v: Math.floor(R() * 8), speed: 0.4 + R() * 0.9 }); }
  // ---------------------------------------------------------------- 7. the world around: the cloud sea fades into the neighbours (seam band, tw-map.js)
  TWM.homes = TWM.homes || {}; TWM.homes.btp = { crane: [72, 44], maiden: [70, 57] };
};
window.TW_BTP_FINAL = function (X) {   // the cloud sea is scenery; drop unreachable posts
  const { TWM, WALK, id, N } = X, F = TWM.palm, M = TWM.M; for (const k of F.tiles) if (TWM.MAT[k] === M.SKYD) WALK[k] = 0;
  const st = id(74, 55), seen = new Uint8Array(N * N), q = [st]; seen[st] = 1; for (let n = 0; n < q.length; n++) { const k = q[n], i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (!seen[z] && TWM.BIO[z] === F.B && TWM.canStep(k, z)) { seen[z] = 1; q.push(z); } } }
  // the cloud sea runs on over the unfinished neighbours (Cao Lão Trang west, Liên Hoa Động south-west): up to 11 tiles of sky and drifting cloud that fade out
  { const MAT = TWM.MAT, BIO = TWM.BIO, H = TWM.H, M = TWM.M, inMap = TWM.inMap, hash2 = TWM.hash2, q = [], d = new Map();   // the cloud sea runs on over the unfinished neighbours (up to 11 tiles, fading out)
    for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || BIO[id(i + a, j + b)] === F.B) continue; const z = id(i + a, j + b); if (MAT[z] !== M.VOID && !d.has(z)) { d.set(z, 1); q.push(z); } } }
    for (let h = 0; h < q.length; h++) { const k = q[h], dd = d.get(k); if (dd >= 12) continue; const i = k % N, j = Math.floor(k / N); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inMap(i + a, j + b) || BIO[id(i + a, j + b)] === F.B) continue; const z = id(i + a, j + b); if (MAT[z] === M.VOID || TWM.biomes[BIO[z]].built || d.has(z)) continue; d.set(z, dd + 1); q.push(z); } }
    F.out = []; for (const [k, dd] of d) { if (TWM.biomes[BIO[k]].built || TWM.RES[k] || TWM.PATHC[k] || MAT[k] < M.PH || MAT[k] >= M.HROCK) continue; const i = k % N, j = Math.floor(k / N), r = hash2(i, j, 1111), p = dd <= 4 ? 1 : 1 - (dd - 4) / 8.5; if (r > p) continue; MAT[k] = M.SKYD; H[k] = 1; F.out.push(k); if (dd <= 8 && r < 0.12) F.clouds.push({ kind: r < 0.04 ? 'pcloudw' : 'pcloud', i, j, lift: [-4, 0, 3, 6][Math.floor(r * 100) & 3], v: Math.floor(r * 997) & 7 }); } }
  F.reach = seen; F.dropped = []; TWM.pois = TWM.pois.filter(p => { if (p.biome !== 'btp') return true; const k = id(Math.floor(p.x / 8), Math.floor(p.y / 8)); if (!seen[k]) F.dropped.push(p.kind + '@' + p.i + ',' + p.j); return seen[k]; });
};
if (typeof module !== 'undefined') module.exports = {};
