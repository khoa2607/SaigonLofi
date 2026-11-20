'use strict';
// ===== Tây Du Ký v2 — world map (DOM-free) =====
// One persistent 160 x 160-tile isometric map. Projection is the shared Lofi Worlds one (js/core.js): isoX = x - y, isoY = (x + y)/2 - z,
// tile T = 8 world units, drawn at K = 4 art px per unit (64 x 32 tiles). Terrain has integer height levels (1 level = 4 units = 16 art px).
// The 11 approved biomes sit on the design's 1-3-3-3-1 diamond (TAYDUKY-DESIGN §2.2); their cells are noise-warped Voronoi regions.
// Hoa Quả Sơn and Bàn Tơ Động are authored in full here; the other nine are flat, clearly marked development placeholders.
// Everything is deterministic (map seed fixed). Output: TWM (grids, props, POIs, stairs, waterfalls, nav).

const TWM = { N: 160, T: 8, LV: 4, K: 4 };
(function () {
  const N = TWM.N;
  // ---------------------------------------------------------------- deterministic noise
  function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + (s || 0) * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const n1 = (x, s) => vnoise(x, 0.5, s) * 2 - 1;
  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  TWM.hash2 = hash2; TWM.vnoise = vnoise; TWM.mulberry32 = mulberry32;

  // ---------------------------------------------------------------- biomes (design §2.2, §2.3): centre in tile coords from screen (u = i - j, v = i + j)
  const C = (u, v) => [(v + u) / 2, (v - u) / 2];
  const BIOMES = [
    ['lat', 'Lôi Âm Tự', 'Thunderclap Monastery', C(-120, 159)], ['hds', 'Hỏa Diệm Sơn', 'The Flaming Mountains', C(-64, 92)],
    ['nnq', 'Nữ Nhi Quốc', "The Women's Kingdom", C(-64, 159)], ['btd', 'Bàn Tơ Động', 'Silk Web Cave', C(-64, 226)],
    ['bcl', 'Bạch Cốt Lĩnh', 'White Bone Ridge', C(0, 72)], ['clt', 'Cao Lão Trang', "Old Gao's Village", C(0, 159)],
    ['tth', 'Thông Thiên Hà', 'The River That Reaches Heaven', C(0, 246)], ['tc', 'Thiên Cung', 'The Heavenly Palace', C(64, 92)],
    ['btp', 'Lòng Bàn Tay Phật Tổ', "The Buddha's Palm", C(64, 159)], ['nhs', 'Ngũ Hành Sơn', 'Five Elements Mountain', C(64, 226)],
    ['hqs', 'Hoa Quả Sơn', 'Flower-Fruit Mountain', C(120, 159)]];
  TWM.biomes = BIOMES.map(([id, vi, en, c], k) => ({ id, k, title: [vi, en], centre: c, built: id === 'hqs' || id === 'btd' }));
  TWM.bi = Object.fromEntries(TWM.biomes.map(b => [b.id, b.k]));
  TWM.adj = { lat: ['hds', 'nnq', 'btd'], hds: ['lat', 'nnq', 'bcl'], nnq: ['lat', 'hds', 'btd', 'clt'], btd: ['lat', 'nnq', 'tth'], bcl: ['hds', 'clt', 'tc'],
    clt: ['nnq', 'bcl', 'tth', 'btp'], tth: ['btd', 'clt', 'nhs'], tc: ['bcl', 'btp', 'hqs'], btp: ['clt', 'tc', 'nhs', 'hqs'], nhs: ['tth', 'btp', 'hqs'], hqs: ['tc', 'btp', 'nhs'] };

  // ---------------------------------------------------------------- materials
  const M = TWM.M = { VOID: 0, GRASS: 1, LUSH: 2, DIRT: 3, PAVE: 4, ROCK: 5, SAND: 6, POOL: 7, SEA: 8, FLOWER: 9, MOSSY: 10,
    GORGE: 11, GLOW: 12, WEBF: 13, CHASM: 14, SPRING: 15, CAVEF: 16, WEBPATH: 17, LEDGE: 18, BRIDGE: 19, SILKB: 20, STREAM: 21, PH: 30 };
  TWM.isWater = m => m === M.POOL || m === M.SEA || m === M.SPRING || m === M.STREAM;

  // ---------------------------------------------------------------- grids
  const NN = N * N, H = new Int8Array(NN), MAT = new Uint8Array(NN), BIO = new Uint8Array(NN), WALK = new Uint8Array(NN), PATHC = new Uint8Array(NN), RES = new Uint8Array(NN);
  Object.assign(TWM, { H, MAT, BIO, WALK, PATHC, RES, props: [], pois: [], stairs: new Map(), stairAt: new Map(), water: [], falls: [], decals: [], webs: [], lights: [] });
  const id = (i, j) => j * N + i, inMap = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
  TWM.id = id; TWM.inMap = inMap;
  const h = (i, j) => inMap(i, j) ? H[id(i, j)] : -4;
  TWM.h = h;

  // biome cells: noise-warped nearest centre (organic borders, no straight lines)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const wi = i + (vnoise(i * 0.07, j * 0.07, 11) - 0.5) * 18, wj = j + (vnoise(i * 0.07, j * 0.07, 12) - 0.5) * 18;
    let best = 0, bd = 1e9;
    for (const b of TWM.biomes) { const d = (wi - b.centre[0]) ** 2 + (wj - b.centre[1]) ** 2; if (d < bd) { bd = d; best = b.k; } }
    BIO[id(i, j)] = best;
  }
  const isB = (i, j, b) => inMap(i, j) && BIO[id(i, j)] === TWM.bi[b];

  // placeholders: flat level 1 in each biome's own material slot (rendered with its palette and a dev hatch)
  for (let k = 0; k < NN; k++) { H[k] = 1; MAT[k] = M.PH + BIO[k]; }
  // map rim: cloud sea beyond the island edge
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (i < 1 || j < 1 || i > N - 2 || j > N - 2) { MAT[id(i, j)] = M.VOID; H[id(i, j)] = -4; }

  const set = (i, j, hh, m) => { if (!inMap(i, j) || MAT[id(i, j)] === M.VOID) return; if (hh !== null) H[id(i, j)] = hh; if (m !== null) MAT[id(i, j)] = m; };
  const R = mulberry32(20261120);

  // =====================================================================================================  HOA QUẢ SƠN (east tip)
  // Back (small j, along the map's upper-right edge): a jade massif. Then terraces stepping down toward the viewer: upper (4), middle (2),
  // lower meadow (1). East (large i): sand shore and Đông Hải. A waterfall drops from the massif into a pool with Thủy Liêm Động behind it.
  const HQ = TWM.hqs = {};
  const mB = i => Math.round(8 + 1.8 * n1(i * 0.11, 21));            // massif front edge
  const uB = i => Math.round(14.5 + 1.6 * n1(i * 0.09, 22));         // upper terrace front edge
  const lB = i => Math.round(30 + 2.5 * n1(i * 0.08, 23));           // middle terrace front edge
  const sB = j => Math.round(151 + 1.5 * n1(j * 0.12, 24));          // shore line
  const FALL_I = 132;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (!isB(i, j, 'hqs') || MAT[id(i, j)] === M.VOID) continue;
    let hh, m = M.GRASS;
    if (j < mB(i)) { hh = Math.min(10, 6 + Math.round(vnoise(i * 0.22, j * 0.22, 25) * 2.4 + (mB(i) - j) * 0.28)); m = M.ROCK; }
    else if (j < uB(i)) { hh = 4; m = vnoise(i * 0.3, j * 0.3, 26) > 0.62 ? M.LUSH : M.GRASS; }
    else if (j < lB(i)) { hh = 2; m = vnoise(i * 0.25, j * 0.25, 27) > 0.66 ? M.FLOWER : M.GRASS; }
    else { hh = 1; m = vnoise(i * 0.2, j * 0.2, 28) > 0.6 ? M.FLOWER : vnoise(i * 0.3, j * 0.3, 29) > 0.7 ? M.LUSH : M.GRASS; }
    const sb = sB(j);
    if (i >= sb + 3) { hh = 1; m = M.SEA; }
    else if (i >= sb) { if (j >= mB(i)) { hh = 1; m = M.SAND; } }
    set(i, j, hh, m);
  }
  // the river on the massif and the waterfall notch
  const MBF = mB(FALL_I);
  for (let j = 1; j < MBF; j++) for (let i = FALL_I - 3; i <= FALL_I + 4; i++) set(i, j, 10, i >= FALL_I && i <= FALL_I + 1 ? M.STREAM : M.ROCK);
  for (let j = 1; j < MBF; j++) for (const i of [FALL_I - 5, FALL_I - 4, FALL_I + 5, FALL_I + 6]) if (H[id(i, j)] < 9) set(i, j, 9, M.ROCK);
  // the pool basin, cut into the upper terrace down to the middle level, with a ledge behind the falling water (Thủy Liêm Động)
  const PC = [FALL_I + 0.5, MBF + 3.6];
  for (let j = MBF; j < MBF + 9; j++) for (let i = FALL_I - 7; i <= FALL_I + 8; i++) {
    const d = ((i - PC[0]) / 5.6) ** 2 + ((j - PC[1]) / 3.4) ** 2;
    if (j === MBF && i >= FALL_I - 5 && i <= FALL_I + 6) { set(i, j, 2, M.LEDGE); continue; }
    if (j === MBF + 1 && (i <= FALL_I - 4 || i >= FALL_I + 5) && i >= FALL_I - 5 && i <= FALL_I + 6) { set(i, j, 2, M.LEDGE); continue; }
    if (d < 1) set(i, j, 2, M.POOL); else if (d < 1.75) set(i, j, 2, M.MOSSY);
  }
  HQ.pool = PC; HQ.fallI = FALL_I; HQ.mB = MBF;
  TWM.water.push({ type: 'ell', c: [PC[0] + 0.5, PC[1] + 0.5], rx: 5.6, ry: 3.4, mat: M.POOL });
  TWM.water.push({ type: 'sea', f: j => sB(j) + 3, mat: M.SEA });
  TWM.falls.push({ biome: 'hqs', i: FALL_I, j: MBF - 1, w: 2, top: 10, bottom: 2, cave: true });
  TWM.decals.push({ kind: 'cave_hqs', i: FALL_I - 1, j: MBF - 1, w: 4 });       // Thủy Liêm Động: arch in the massif face, the water falls through its middle
  set(FALL_I, MBF, 2, M.STREAM); set(FALL_I + 1, MBF, 2, M.STREAM);
  // stream: pool outflow down the terraces to the sea
  function carveStream(pts, w) {
    TWM.water.push({ type: 'line', pts: pts.map(([a, b]) => [a + 0.5 + (w > 1 ? 0.5 : 0), b + 0.5]), w: w * 0.62, mat: M.STREAM });
    for (let k = 0; k < pts.length - 1; k++) {
      const [a0, b0] = pts[k], [a1, b1] = pts[k + 1], n = Math.max(Math.abs(a1 - a0), Math.abs(b1 - b0)) * 2;
      for (let s = 0; s <= n; s++) { const fi = a0 + (a1 - a0) * s / n, fj = b0 + (b1 - b0) * s / n;
        for (let dd = 0; dd < w; dd++) { const i = Math.round(fi) + (Math.abs(a1 - a0) < Math.abs(b1 - b0) ? dd : 0), j = Math.round(fj) + (Math.abs(a1 - a0) < Math.abs(b1 - b0) ? 0 : dd);
          if (!inMap(i, j) || MAT[id(i, j)] === M.SEA || MAT[id(i, j)] === M.POOL) continue; set(i, j, null, M.STREAM); } }
    }
  }
  carveStream([[FALL_I, MBF + 7], [FALL_I + 1, 22], [FALL_I + 3, 28], [FALL_I + 5, lB(FALL_I + 5) + 2], [143, 35], [sB(36) + 3, 36]], 2);
  // throne dais and the courtyard in front of it
  HQ.throne = [140, 16]; HQ.court = [140.5, 22.5];
  for (let j = 15; j <= 18; j++) for (let i = 137; i <= 144; i++) set(i, j, 3, M.PAVE);
  for (let j = 19; j <= 26; j++) for (let i = 134; i <= 147; i++) set(i, j, 2, ((i - 140.5) ** 2 / 50 + (j - 22.5) ** 2 / 18) < 1.15 ? M.PAVE : null);
  for (let j = 12; j <= 14; j++) for (let i = 136; i <= 145; i++) set(i, j, 4, null);                 // a cliff backdrop behind the throne

  // =====================================================================================================  BÀN TƠ ĐỘNG (south-west)
  // A deep charcoal-violet gorge: high back wall (small j) with the cave, the gorge floor (2), a chasm crossed by silk bridges,
  // a front ledge, a raised hot-spring terrace, rock spires holding a huge web canopy.
  const BT = TWM.btd = {};
  const wB = i => Math.round(132 + 1.6 * n1(i * 0.1, 31));
  const cB = i => Math.round(148 + 1.4 * n1(i * 0.09, 32));
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (!isB(i, j, 'btd') || MAT[id(i, j)] === M.VOID) continue;
    let hh = 2, m = M.GORGE;
    const w = wB(i), c = cB(i);
    if (j < w) { const back = w - j; hh = back <= 2 ? 5 : back <= 4 ? 7 : back <= 7 ? 9 : 10; hh = Math.min(10, hh + (vnoise(i * 0.3, j * 0.3, 33) > 0.7 ? 1 : 0)); m = M.ROCK; }   // layered cliffs stepping back
    else if (j < w + 3 && vnoise(i * 0.12, 0.5, 34) > 0.5) { hh = 4; m = M.LEDGE; }
    else if (j >= c && j < c + 3) { hh = 0; m = M.CHASM; }
    else if (j >= c + 3) { hh = 2; m = vnoise(i * 0.3, j * 0.3, 35) > 0.72 ? M.GLOW : M.GORGE; }
    else m = vnoise(i * 0.28, j * 0.28, 36) > 0.74 ? M.GLOW : M.GORGE;
    // side buttresses (gaps at the gorge mouths keep both ends open)
    const mouth = j > w + 4 && j < c - 1;
    if ((i < 57 || i > 100) && !mouth) { hh = Math.max(hh, 5); m = M.ROCK; }
    set(i, j, hh, m);
  }
  // walls along the gorge cell's back edges (toward Nữ Nhi Quốc / Lôi Âm Tự / Thông Thiên Hà), leaving both mouths open
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (!isB(i, j, 'btd') || MAT[id(i, j)] === M.VOID || MAT[id(i, j)] === M.CHASM) continue;
    const mouth = (i < 72 && Math.abs(j - 141) <= 2) || (i > 94 && Math.abs(j - 143) <= 2);
    if (mouth) continue;
    let dB = 9; for (let d = 1; d <= 4; d++) if (!isB(i, j - d, 'btd') || !isB(i - d, j, 'btd') || !isB(i - d, j - d, 'btd')) { dB = d; break; }
    if (dB <= 4 && j < cB(i)) { const hh = dB <= 1 ? 9 : dB <= 2 ? 7 : dB <= 3 ? 5 : 4; if (hh > H[id(i, j)]) set(i, j, hh, hh >= 5 ? M.ROCK : M.LEDGE); }
  }
  BT.canopy = [78.5, 140]; BT.cave = [80, wB(80)]; BT.spring = [93.5, 141];
  TWM.water.push({ type: 'ell', c: [BT.spring[0] + 0.5, BT.spring[1] + 0.5], rx: 3.3, ry: 2.4, mat: M.SPRING });
  // web floor under the canopy
  for (let j = 128; j < 152; j++) for (let i = 64; i < 94; i++) if (isB(i, j, 'btd') && (MAT[id(i, j)] === M.GORGE || MAT[id(i, j)] === M.GLOW) && ((i - BT.canopy[0]) / 9) ** 2 + ((j - BT.canopy[1]) / 5.5) ** 2 < 1) set(i, j, null, M.WEBF);
  // hot-spring terrace (level 3) with the pool
  for (let j = 136; j <= 145; j++) for (let i = 88; i <= 99; i++) { if (!isB(i, j, 'btd') || H[id(i, j)] !== 2 || j >= cB(i)) continue;
    const d = ((i - BT.spring[0]) / 3.3) ** 2 + ((j - BT.spring[1]) / 2.4) ** 2; set(i, j, 3, d < 1 ? M.SPRING : M.CAVEF); }
  // the cave mouth: a floor tile at the wall foot; the arch is a decal on the wall face, silk curtains are a prop
  const cw = wB(BT.cave[0]); for (let i = BT.cave[0] - 1; i <= BT.cave[0] + 1; i++) set(i, cw, 2, M.CAVEF);
  for (let i = BT.cave[0] - 1; i <= BT.cave[0] + 1; i++) for (let j = cw; j < cw + 3; j++) if (H[id(i, j)] === 4) set(i, j, 2, M.CAVEF);
  TWM.decals.push({ kind: 'cave_btd', i: BT.cave[0], j: cw - 1, w: 2 });
  BT.cave = [BT.cave[0], cw];
  TWM.webs.push({ biome: 'btd', x: (BT.canopy[0] + 0.5) * 8, y: (BT.canopy[1] + 0.5) * 8, z: 30, rx: 13 * 8, ry: 9 * 8, spokes: 24, base: 0.55 });

  // ---------------------------------------------------------------- paths (preferred routes; stairs where a path climbs a terrace edge)
  function addStair(lo, hi) { // lo, hi = tile ids; the upper tile is behind (smaller i or j) so the steps face the viewer
    TWM.stairs.set(lo + ',' + hi, 1); TWM.stairs.set(hi + ',' + lo, 1);
    const li = lo % N, lj = Math.floor(lo / N), hi_ = hi % N, hj = Math.floor(hi / N);
    if (hi_ > li || hj > lj) return;                         // only flights that rise away from the viewer get visible steps (the link above still works)
    TWM.stairAt.set(lo, { dir: hi_ < li ? 'i' : 'j', dh: H[hi] - H[lo] });
    TWM.props.push({ kind: 'stairs', biome: TWM.biomes[BIO[lo]].id, i: li, j: lj, dir: hi_ < li ? 'i' : 'j', dh: H[hi] - H[lo], block: false, flat: true });
  }
  function carvePath(pts, mat, biome) {
    let pi = null, pj = null;
    for (let k = 0; k < pts.length - 1; k++) {
      let [i, j] = pts[k]; const [i1, j1] = pts[k + 1];
      while (i !== i1 || j !== j1) {
        if (inMap(i, j) && isB(i, j, biome)) {
          const k2 = id(i, j);
          if (MAT[k2] === M.STREAM || MAT[k2] === M.CHASM) { MAT[k2] = MAT[k2] === M.STREAM ? M.BRIDGE : M.SILKB; if (H[k2] === 0) H[k2] = 2; }
          else if (MAT[k2] !== M.PAVE && MAT[k2] !== M.LEDGE && MAT[k2] !== M.CAVEF && MAT[k2] !== M.POOL && MAT[k2] !== M.SPRING) MAT[k2] = mat;
          PATHC[k2] = 1;
        }
        if (pi !== null) {
          const a = id(pi, pj), b = id(i, j), dh = H[b] - H[a];
          if (dh !== 0 && Math.abs(dh) <= 2 && !TWM.isWater(MAT[a]) && !TWM.isWater(MAT[b]) && MAT[a] !== M.CHASM && MAT[b] !== M.CHASM) { if (dh > 0) addStair(a, b); else addStair(b, a); }
        }
        pi = i; pj = j;
        // walk the longer axis first, then the other (orthogonal steps, so stairs are always straight)
        if (Math.abs(i1 - i) >= Math.abs(j1 - j) && i !== i1) i += Math.sign(i1 - i); else j += Math.sign(j1 - j);
      }
    }
  }
  // HQS routes
  const hq = [[140, 22], [132, 22], [124, 24], [120, 30], [116, 36], [110, 40]];
  carvePath(hq, M.DIRT, 'hqs');
  carvePath([[140, 22], [146, 27], [149, 31], [150, 36]], M.DIRT, 'hqs');
  carvePath([[140, 20], [140, 19]], M.PAVE, 'hqs');                                    // dais steps
  carvePath([[146, 20], [147, 16], [147, 13], [146, 11]], M.DIRT, 'hqs');             // up to the lookout on the upper terrace
  carvePath([[132, 22], [128, 18], [127, MBF + 4]], M.DIRT, 'hqs');                    // round the pool
  carvePath([[124, 24], [124, 15], [122, 12]], M.DIRT, 'hqs');                         // the upper terrace west
  carvePath([[120, 30], [126, 38], [134, 40], [142, 38]], M.DIRT, 'hqs');              // meadow loop over the stream
  // BTD routes
  const cv0 = BT.cave;
  carvePath([[cv0[0], cv0[1]], [cv0[0], 139], [80, 141], [90, 144], [92, 144]], M.WEBPATH, 'btd');
  carvePath([[80, 141], [66, 141], [58, 141], [52, 141]], M.WEBPATH, 'btd');
  carvePath([[90, 144], [100, 143], [106, 142]], M.WEBPATH, 'btd');
  carvePath([[70, 141], [70, cB(70) + 4], [72, 155]], M.WEBPATH, 'btd');                // silk bridge 1
  carvePath([[86, 143], [86, cB(86) + 4], [84, 155]], M.WEBPATH, 'btd');                // silk bridge 2
  carvePath([[72, 155], [84, 155]], M.WEBPATH, 'btd');

  // ---------------------------------------------------------------- props: landmarks first (reserve tiles), then scatter
  const reserve = (i, j, r) => { for (let b = j - r; b <= j + r; b++) for (let a = i - r; a <= i + r; a++) if (inMap(a, b)) RES[id(a, b)] = 1; };
  function prop(kind, i, j, o) {
    if (!inMap(i, j)) return null;
    const p = Object.assign({ kind, biome: TWM.biomes[BIO[id(i, j)]].id, i, j, block: true, v: Math.floor(R() * 1000) }, o || {});
    TWM.props.push(p); RES[id(i, j)] = 1; return p;
  }
  function poi(kind, biome, i, j, o) { const p = Object.assign({ kind, biome, i, j, x: (i + 0.5) * 8, y: (j + 0.5) * 8, users: 0, cap: 1 }, o || {}); TWM.pois.push(p); return p; }

  // --- HQS landmarks
  prop('throne', HQ.throne[0], HQ.throne[1], { fp: [2, 1] }); reserve(HQ.throne[0], HQ.throne[1], 1);
  poi('throne', 'hqs', HQ.throne[0] + 0.5, HQ.throne[1] + 1, { face: 'down', seat: true });
  prop('banner', 137, 16); prop('banner', 144, 16); prop('drum', 136, 18, { fp: [1, 1] });
  prop('lantern', 137, 19); prop('lantern', 144, 19);
  for (const [i, j] of [[143, 21], [145, 23], [144, 25]]) { prop('dummy', i, j); poi('dummy', 'hqs', i - 1, j, { face: 'right', target: [i, j] }); }
  prop('rack', 147, 20); poi('court', 'hqs', HQ.court[0], HQ.court[1], { cap: 30 });
  prop('medallion', 140, 22, { block: false, flat: true });
  // gathering place in the peach grove: stone table, stools, a fire
  prop('table', 120, 31); for (const [i, j, f] of [[119, 31, 'right'], [121, 31, 'left'], [120, 30, 'down'], [120, 32, 'up']]) { prop('stool', i, j, { block: false }); poi('seat', 'hqs', i, j, { face: f, seat: true, group: 'table' }); }
  prop('fire', 122, 35, { block: true }); for (const [i, j, f] of [[121, 35, 'right'], [123, 35, 'left'], [122, 34, 'down'], [122, 36, 'up']]) poi('seat', 'hqs', i, j, { face: f, seat: true, group: 'fire', ground: true });
  TWM.lights.push({ biome: 'hqs', i: 122, j: 35, r: 70, col: '255,170,90', kind: 'fire' });
  prop('basket', 118, 32, { block: false }); prop('basket', 141, 25, { block: false });
  // lookout rock on the upper terrace, diving rock above the pool
  prop('rock', 146, 10, { size: 3, fp: [2, 1] }); poi('lookout', 'hqs', 146, 12, { cap: 6, face: 'up' });
  // story-telling stone and grooming spots
  prop('rock', 113, 33, { size: 2, block: true }); poi('elder_seat', 'hqs', 114, 33, { face: 'left', seat: true });
  poi('cave', 'hqs', FALL_I - 1, MBF, { cap: 4 }); poi('cave', 'hqs', FALL_I + 2, MBF, { cap: 4 });
  // --- BTD landmarks
  prop('curtain', BT.cave[0], BT.cave[1], { block: false, fp: [1, 1] }); poi('cave', 'btd', BT.cave[0], BT.cave[1], { cap: 9 });
  prop('spire', 67, 137, { size: 3 }); prop('spire', 91, 136, { size: 2 }); prop('spire', 83, 146, { size: 2 });
  for (const [i, j] of [[64, 143], [62, 145]]) { prop('loom', i, j, { fp: [1, 1] }); poi('loom', 'btd', i + 1, j, { face: 'left', target: [i, j] }); }
  prop('circle', 74, 144, { block: false, flat: true }); poi('circle', 'btd', 74, 144, { cap: 12 });
  for (const [i, j] of [[72, 142], [76, 142], [72, 146], [76, 146]]) { prop('vlantern', i, j); TWM.lights.push({ biome: 'btd', i, j, r: 46, col: '190,120,255', kind: 'lantern' }); }
  prop('screen', 89, 139); poi('change', 'btd', 90, 140, { face: 'up' });
  for (let j = 133; j <= 146; j++) for (let i = 88; i <= 99; i++) if (inMap(i, j) && MAT[id(i, j)] === M.SPRING) poi('bath', 'btd', i, j, { water: true });
  for (const [i, j] of [[73, 139], [78, 138], [84, 140], [81, 143], [76, 141]]) poi('thread', 'btd', i, j, { cap: 1 });
  for (const [i, j] of [[60, 143], [88, 153], [76, 154], [96, 139], [68, 136]]) { prop('eggs', i, j); poi('eggs', 'btd', i + 1, j, { face: 'left', target: [i, j] }); }

  // --- scatter vegetation and rocks (deterministic), never on paths, stairs, water or reserved tiles
  for (const s of TWM.props) if (s.kind === 'stairs') RES[id(s.i, s.j)] = 1;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = id(i, j), m = MAT[k], b = TWM.biomes[BIO[k]].id; if (RES[k] || PATHC[k] || m === M.VOID) continue;
    const r = hash2(i, j, 77), nz = vnoise(i * 0.18, j * 0.18, 78);
    if (b === 'hqs') {
      if (m === M.ROCK) { if (r < 0.05 && H[k] < 9) prop('pine', i, j, { block: true }); else if (r < 0.09) prop('crag', i, j, { block: true }); continue; }
      if (TWM.isWater(m)) { if (m === M.POOL && r < 0.12) prop('lily', i, j, { block: false, flat: true }); continue; }
      if (m === M.PAVE || m === M.LEDGE || m === M.BRIDGE) continue;
      if (m === M.SAND) { if (r < 0.04) prop('rock', i, j, { size: 1 }); else if (r < 0.08) prop('shell', i, j, { block: false }); continue; }
      const grove = i >= 110 && i <= 130 && j >= 19 && j <= 44;
      if (grove && r < 0.15 && nz > 0.3) { prop('peach', i, j); reserve(i, j, 1); poi('tree', 'hqs', i, j + 1, { face: 'up', tree: [i, j], cap: 1 }); continue; }
      if (!grove && r < 0.035 && H[k] >= 2) { prop('peach', i, j); reserve(i, j, 1); poi('tree', 'hqs', i, j + 1, { face: 'up', tree: [i, j], cap: 1 }); continue; }
      if (j < uB(i) + 1 && r < 0.11 && nz > 0.45) { prop('bamboo', i, j); continue; }
      if (r < 0.05) { prop('rock', i, j, { size: r < 0.015 ? 2 : 1 }); continue; }
      if (r < 0.11) { prop('bush', i, j, { block: false }); continue; }
      if (r < 0.2) { prop(m === M.FLOWER ? 'flowers' : 'tuft', i, j, { block: false }); continue; }
      if (r < 0.26 && (m === M.FLOWER || m === M.LUSH)) prop('fern', i, j, { block: false });
    } else if (b === 'btd') {
      if (m === M.ROCK) { if (r < 0.08) prop('shard', i, j, { block: true }); continue; }
      if (m === M.CHASM || m === M.SPRING || m === M.SILKB) continue;
      if (r < 0.03) { prop('crystal', i, j, { block: true }); TWM.lights.push({ biome: 'btd', i, j, r: 22, col: '120,255,140', kind: 'crystal' }); continue; }
      if (r < 0.1) { prop('mushroom', i, j, { block: false }); continue; }
      const nearWall = H[id(i, Math.max(0, j - 1))] > H[k] || H[id(i, Math.max(0, j - 2))] > H[k];
      if (r < 0.2 && nearWall && hash2(i, j, 79) < 0.35) { prop('cocoon', i, j, { block: true }); continue; }
      if (r < 0.17) { prop('rock', i, j, { size: 1, dark: true }); continue; }
      if (r < 0.25 && m !== M.WEBF) prop('moss', i, j, { block: false, flat: true });
    } else {
      // development placeholder: one stele per biome at its centre (below)
    }
  }
  for (const b of TWM.biomes) if (!b.built) { const [ci, cj] = b.centre.map(Math.round); prop('stele', ci, cj, { block: true, placeholder: true }); }

  // ---------------------------------------------------------------- walkability + nav
  for (let k = 0; k < NN; k++) {
    const m = MAT[k]; let w = m !== M.VOID && m !== M.ROCK && m !== M.CHASM && !TWM.isWater(m);
    if (m === M.BRIDGE || m === M.SILKB) w = true;
    WALK[k] = w ? 1 : 0;
  }
  for (const p of TWM.props) if (p.block) { const fw = p.fp ? p.fp[0] : 1, fh = p.fp ? p.fp[1] : 1; for (let b = 0; b < fh; b++) for (let a = 0; a < fw; a++) if (inMap(p.i + a, p.j + b)) WALK[id(p.i + a, p.j + b)] = 0; }
  // stair tiles stay walkable
  for (const s of TWM.props) if (s.kind === 'stairs') WALK[id(s.i, s.j)] = 1;
  // water tiles usable by bathers / swimmers
  TWM.canStep = (a, b, swim) => {
    const ok = k => WALK[k] || (swim && (MAT[k] === M.POOL || MAT[k] === M.SPRING));
    if (!ok(a) || !ok(b)) return false;
    if (H[a] === H[b]) return true;
    return TWM.stairs.has(a + ',' + b);
  };
  TWM.cost = k => PATHC[k] ? 1 : MAT[k] === M.PAVE || MAT[k] === M.LEDGE ? 1.1 : 1.6;

  // A* (8 directions, no corner cutting, binary heap), bounded to a biome's box
  const G = new Float32Array(NN), F = new Float32Array(NN), FROM = new Int32Array(NN), STAMP = new Uint32Array(NN), CLOSED = new Uint32Array(NN); let stamp = 1;
  const heap = [];
  function hpush(k) { heap.push(k); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (F[heap[p]] <= F[heap[c]]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } }
  function hpop() { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = c * 2 + 1, r = l + 1; let m = c; if (l < heap.length && F[heap[l]] < F[heap[m]]) m = l; if (r < heap.length && F[heap[r]] < F[heap[m]]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; }
  TWM.path = function (si, sj, ti, tj, opt) {
    opt = opt || {}; const swim = !!opt.swim, lim = opt.limit || 9000, bio = opt.biome !== undefined ? TWM.bi[opt.biome] : -1;
    if (!inMap(si, sj) || !inMap(ti, tj)) return null;
    const s = id(si, sj), t = id(ti, tj); if (s === t) return [[si, sj]];
    stamp++; heap.length = 0; G[s] = 0; F[s] = Math.hypot(ti - si, tj - sj); STAMP[s] = stamp; FROM[s] = -1; hpush(s);
    let n = 0;
    while (heap.length && n++ < lim) {
      const c = hpop(); if (CLOSED[c] === stamp) continue; CLOSED[c] = stamp;
      if (c === t) { const out = []; let k = c; while (k >= 0) { out.push([k % N, Math.floor(k / N)]); k = FROM[k]; } return out.reverse(); }
      const ci = c % N, cj = Math.floor(c / N);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue; const ni = ci + di, nj = cj + dj; if (!inMap(ni, nj)) continue; const k = id(ni, nj);
        if (CLOSED[k] === stamp || !TWM.canStep(c, k, swim) || (bio >= 0 && BIO[k] !== bio)) continue;
        if (di && dj) { const a = id(ci + di, cj), b = id(ci, cj + dj); if (!TWM.canStep(c, a, swim) || !TWM.canStep(c, b, swim) || H[a] !== H[c] || H[b] !== H[c] || H[k] !== H[c]) continue; }
        const g = G[c] + (di && dj ? 1.414 : 1) * TWM.cost(k);
        if (STAMP[k] === stamp && g >= G[k]) continue;
        STAMP[k] = stamp; G[k] = g; F[k] = g + Math.hypot(ti - ni, tj - nj); FROM[k] = c; hpush(k);
      }
    }
    return null;
  };
  // world helpers
  TWM.tileOf = (x, y) => [Math.floor(x / 8), Math.floor(y / 8)];
  TWM.groundZ = (x, y) => {
    const i = Math.floor(x / 8), j = Math.floor(y / 8); if (!inMap(i, j)) return 0; const k = id(i, j), st = TWM.stairAt.get(k);
    if (!st) return H[k] * TWM.LV;
    const f = st.dir === 'j' ? 1 - (y / 8 - j) : 1 - (x / 8 - i);           // 0 at the front edge, 1 at the back edge of the flight
    return (H[k] + st.dh * Math.max(0, Math.min(1, f))) * TWM.LV;
  };
  TWM.walkable = (i, j) => inMap(i, j) && WALK[id(i, j)] === 1;
  TWM.biomeAt = (i, j) => inMap(i, j) ? TWM.biomes[BIO[id(i, j)]].id : null;
  TWM.randomWalkable = (biome, R2, near, rad) => {
    for (let k = 0; k < 300; k++) {
      const i = near ? Math.round(near[0] + (R2() * 2 - 1) * rad) : Math.floor(R2() * N), j = near ? Math.round(near[1] + (R2() * 2 - 1) * rad) : Math.floor(R2() * N);
      if (TWM.walkable(i, j) && TWM.biomeAt(i, j) === biome) return [i, j];
    }
    return null;
  };
})();
if (typeof module !== 'undefined') module.exports = { TWM };
