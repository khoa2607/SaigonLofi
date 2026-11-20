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
    for (const b of TWM.biomes) { const d = ((wi - b.centre[0]) ** 2 + (wj - b.centre[1]) ** 2) ; if (d < bd) { bd = d; best = b.k; } }   // built biomes are compressed so neighbours show at the same zoom
    BIO[id(i, j)] = best;
  }
  // the two built biomes get a COMPRESSED footprint (design: reduce world-space footprint, not scale): tiles outside the warped ellipse go
  // to the nearest neighbouring cell, and tiles inside are claimed from the neighbours. HQS keeps its eastern sea strip.
  const MASK = { hqs: { c: [135, 14], r: [19, 22] }, btd: { c: [81, 142], r: [19.5, 19.5] } };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const wi = i + (vnoise(i * 0.09, j * 0.09, 13) - 0.5) * 7, wj = j + (vnoise(i * 0.09, j * 0.09, 14) - 0.5) * 7;
    for (const [bid, m] of Object.entries(MASK)) {
      const q = ((wi - m.c[0]) / m.r[0]) ** 2 + ((wj - m.c[1]) / m.r[1]) ** 2, k = TWM.bi[bid];
      if (q < 1 || (bid === 'hqs' && i > 146 && j < 38 && BIO[id(i, j)] === k)) BIO[id(i, j)] = k;
      else if (BIO[id(i, j)] === k) {
        let best = 0, bd = 1e9; for (const b of TWM.biomes) { if (b.k === k) continue; const d = (wi - b.centre[0]) ** 2 + (wj - b.centre[1]) ** 2; if (d < bd) { bd = d; best = b.k; } }
        BIO[id(i, j)] = best;
      }
    }
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
  const lB = i => Math.round(26 + 2.2 * n1(i * 0.08, 23));           // middle terrace front edge
  const sB = j => Math.round(150 + 1.3 * n1(j * 0.12, 24));          // shore line
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
  for (let j = 1; j < MBF; j++) for (let i = FALL_I - 3; i <= FALL_I + 4; i++) set(i, j, 10, i >= FALL_I && i <= FALL_I + 2 ? M.STREAM : M.ROCK);
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
  TWM.falls.push({ biome: 'hqs', i: FALL_I, j: MBF - 1, w: 3, top: 10, bottom: 2, cave: true });
  TWM.decals.push({ kind: 'cave_hqs', i: FALL_I - 1, j: MBF - 1, w: 5 });       // Thủy Liêm Động: arch in the massif face, the water falls through its middle
  set(FALL_I, MBF, 2, M.STREAM); set(FALL_I + 1, MBF, 2, M.STREAM); set(FALL_I + 2, MBF, 2, M.STREAM);
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
  carveStream([[FALL_I, MBF + 7], [131, 20], [131, 25], [133, lB(133) + 3], [138, 32], [143, 34], [sB(35) + 3, 35]], 2);
  // throne dais and the courtyard in front of it
  HQ.throne = [140, 16]; HQ.court = [140.5, 22.5];
  for (let j = 15; j <= 18; j++) for (let i = 137; i <= 144; i++) set(i, j, 3, M.PAVE);
  for (let j = 19; j <= 26; j++) for (let i = 134; i <= 147; i++) set(i, j, 2, ((i - 140.5) ** 2 / 50 + (j - 22.5) ** 2 / 18) < 1.15 ? M.PAVE : null);
  for (let j = 12; j <= 14; j++) for (let i = 136; i <= 145; i++) set(i, j, 4, null);                 // a cliff backdrop behind the throne

  // cliff platforms (level 6) cut into the massif face: a pagoda shrine (west) and a statue lookout (east), each reached by a stair from the upper terrace
  function platform(i0, j0, w, h, lvl, mat) { for (let b = j0; b < j0 + h; b++) for (let a = i0; a < i0 + w; a++) set(a, b, lvl, mat); }
  HQ.shrine = [122, 3]; HQ.lookout = [145, 3];
  platform(120, 2, 7, 6, 6, M.PAVE); platform(121, 8, 3, 1, 4, M.PAVE);
  platform(143, 2, 6, 6, 6, M.PAVE); platform(145, 8, 2, 1, 4, M.PAVE);

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
    const mouth = (i < 70 && Math.abs(j - 141) <= 2) || (i > 94 && Math.abs(j - 143) <= 2);
    if (mouth) continue;
    let dB = 9; for (let d = 1; d <= 4; d++) if (!isB(i, j - d, 'btd') || !isB(i - d, j, 'btd') || !isB(i - d, j - d, 'btd')) { dB = d; break; }
    if (dB <= 4 && j < cB(i)) { const hh = dB <= 1 ? 9 : dB <= 2 ? 7 : dB <= 3 ? 5 : 4; if (hh > H[id(i, j)]) set(i, j, hh, hh >= 5 ? M.ROCK : M.LEDGE); }
  }
  for (let i = 64; i <= 96; i++) { if (i >= 78 && i <= 82) continue; for (let j = wB(i); j < wB(i) + 3; j++) if (isB(i, j, 'btd') && MAT[id(i, j)] !== M.VOID) set(i, j, 4, M.LEDGE); }
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
    const visit = (i, j) => {
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
    };
    for (let k = 0; k < pts.length - 1; k++) {
      let [i, j] = pts[k]; const [i1, j1] = pts[k + 1];
      while (i !== i1 || j !== j1) {
        visit(i, j);
        // walk the longer axis first, then the other (orthogonal steps, so stairs are always straight)
        if (Math.abs(i1 - i) >= Math.abs(j1 - j) && i !== i1) i += Math.sign(i1 - i); else j += Math.sign(j1 - j);
      }
    }
    const last = pts[pts.length - 1]; visit(last[0], last[1]);
  }
  // HQS routes
  carvePath([[140, 22], [132, 22], [126, 24], [126, 30], [124, 34]], M.DIRT, 'hqs');
  carvePath([[140, 22], [146, 27], [148, 31], [148, 36]], M.DIRT, 'hqs');
  carvePath([[140, 21], [140, 17]], M.PAVE, 'hqs'); carvePath([[143, 21], [143, 18]], M.PAVE, 'hqs');   // dais steps
  carvePath([[146, 20], [146, 16], [146, 12], [146, 9], [146, 7], [146, 4]], M.DIRT, 'hqs');   // up the village to the statue lookout
  carvePath([[132, 22], [128, 18], [127, MBF + 4]], M.DIRT, 'hqs');                    // round the pool
  carvePath([[126, 24], [124, 18], [123, 12], [123, 9], [123, 7], [123, 4]], M.DIRT, 'hqs');   // up to the shrine
  carvePath([[126, 30], [130, 33], [132, 34]], M.DIRT, 'hqs');                         // orchard loop (stays on the west bank)
  // BTD routes
  const cv0 = BT.cave;
  carvePath([[cv0[0], cv0[1]], [cv0[0], 139], [80, 141], [90, 144], [92, 144]], M.WEBPATH, 'btd');
  carvePath([[80, 141], [66, 141], [62, 141]], M.WEBPATH, 'btd');
  // the gallery: stairs up from the floor at four places, a promenade along the back wall
  for (const gi of [67, 76, 85, 93]) carvePath([[gi, wB(gi) + 5], [gi, wB(gi) + 1]], M.WEBPATH, 'btd');
  carvePath([[67, wB(67) + 1], [76, wB(76) + 1]], M.WEBPATH, 'btd'); carvePath([[85, wB(85) + 1], [93, wB(93) + 1]], M.WEBPATH, 'btd');
  carvePath([[90, 144], [100, 143], [106, 142]], M.WEBPATH, 'btd');
  carvePath([[70, 141], [70, cB(70) + 4], [72, 155]], M.WEBPATH, 'btd');                // silk bridge 1
  carvePath([[86, 143], [86, cB(86) + 4], [84, 155]], M.WEBPATH, 'btd');                // silk bridge 2
  carvePath([[72, 155], [84, 155]], M.WEBPATH, 'btd');

  // ---------------------------------------------------------------- props: landmarks first (reserve tiles), then scatter
  const reserve = (i, j, r) => { for (let b = j - r; b <= j + r; b++) for (let a = i - r; a <= i + r; a++) if (inMap(a, b)) RES[id(a, b)] = 1; };
  function prop(kind, i, j, o) {
    if (!inMap(i, j)) return null;
    const p = Object.assign({ kind, biome: TWM.biomes[BIO[id(i, j)]].id, i, j, block: true, v: Math.floor(R() * 1000) }, o || {});
    TWM.props.push(p); RES[id(i, j)] = 1;
    if (p.fp) for (let b = -1; b <= p.fp[1]; b++) for (let a = -1; a <= p.fp[0]; a++) if (inMap(i + a, j + b)) RES[id(i + a, j + b)] = 1;
    return p;
  }
  function poi(kind, biome, i, j, o) { if (TWM.biomes[BIO[id(Math.max(0, Math.min(N - 1, Math.floor(i))), Math.max(0, Math.min(N - 1, Math.floor(j))))]].id !== biome) return null; const p = Object.assign({ kind, biome, i, j, x: (i + 0.5) * 8, y: (j + 0.5) * 8, users: 0, cap: 1 }, o || {}); TWM.pois.push(p); return p; }

  // --- HQS landmarks
  prop('throne', HQ.throne[0], HQ.throne[1], { fp: [2, 1] }); reserve(HQ.throne[0], HQ.throne[1], 1);
  poi('throne', 'hqs', HQ.throne[0] + 0.5, HQ.throne[1] + 1, { face: 'down', seat: true });
  prop('banner', 137, 16); prop('banner', 144, 16);
  prop('gate', 146, 15, { fp: [1, 1], block: false, v: 0, flip: true }); prop('lantern2', 134, 23, { fp: [1, 1], v: 0 }); prop('lantern2', 144, 27, { fp: [1, 1], v: 1 }); TWM.lights.push({ biome: 'hqs', i: 134, j: 23, r: 52, col: '255,190,110', kind: 'lantern' }); TWM.lights.push({ biome: 'hqs', i: 144, j: 27, r: 52, col: '255,190,110', kind: 'lantern' });
  prop('scholar', 133, 19, { fp: [1, 1], v: 0 }); prop('scholar', 120, 11, { fp: [1, 1], v: 1 }); prop('lotus', 121, 20, { fp: [2, 2], v: 0 }); prop('lotus', 143, 25, { fp: [2, 2], v: 1 }); prop('drum', 136, 18, { fp: [1, 1] });
  prop('lantern', 137, 19); prop('lantern', 144, 19);
  for (const [i, j] of [[143, 21], [145, 23], [144, 25]]) { prop('dummy', i, j); poi('dummy', 'hqs', i - 1, j, { face: 'right', target: [i, j] }); }
  prop('rack', 147, 20); poi('court', 'hqs', HQ.court[0], HQ.court[1], { cap: 30 });
  prop('medallion', 140, 22, { block: false, flat: true });
  prop('rack', 148, 17, { block: true }); prop('banner', 149, 20);
  // --- upper terrace: the pavilion shrine, the monkey village (huts the residents really enter), a statue
  prop('hall', 122, 3, { fp: [3, 3], v: 0 }); poi('pray', 'hqs', 123, 7, { face: 'up', cap: 6 }); poi('lookout', 'hqs', 125, 6, { face: 'up', cap: 4 });
  prop('statue', HQ.lookout[0] + 1, HQ.lookout[1], { fp: [1, 1], v: 0 }); poi('lookout', 'hqs', HQ.lookout[0] + 1, HQ.lookout[1] + 3, { cap: 6, face: 'up' }); poi('pray', 'hqs', HQ.lookout[0] + 2, HQ.lookout[1] + 2, { face: 'up', cap: 3 });
  prop('shrine', 119, 10, { fp: [2, 2], v: 2 }); poi('pray', 'hqs', 121, 12, { face: 'up', cap: 3 });
  for (const [i, j, v] of [[141, 9, 0], [148, 9, 1], [148, 12, 2], [141, 12, 1]]) { prop('hut', i, j, { fp: [2, 2], v }); poi('hut', 'hqs', i, j + 2, { cap: 3, face: 'up' }); }
  prop('lantern', 143, 11); prop('lantern', 145, 11);
  // --- middle terrace: a market on the pool side, the monkey playground by the training yard
  prop('stall', 126, 19, { fp: [2, 2], v: 0 }); poi('stall', 'hqs', 128, 21, { cap: 3, face: 'up' }); prop('basket', 125, 22, { block: false });
  prop('playground', 148, 22, { fp: [2, 2] }); poi('play', 'hqs', 147, 24, { cap: 4, face: 'right' });
  prop('statue', 134, 20, { v: 1 });
  // --- lower meadow: market stall, the gathering grove (table, stools, fire) and the fishing beach
  prop('stall', 139, 28, { fp: [2, 2], v: 1 }); poi('stall', 'hqs', 139, 30, { cap: 3, face: 'up' });
  prop('table', 129, 29); for (const [i, j, f] of [[128, 29, 'right'], [130, 29, 'left'], [129, 28, 'down'], [129, 30, 'up']]) { prop('stool', i, j, { block: false }); poi('seat', 'hqs', i, j, { face: f, seat: true, group: 'table' }); }
  prop('fire', 132, 33, { block: true }); for (const [i, j, f] of [[131, 33, 'right'], [133, 33, 'left'], [132, 32, 'down'], [132, 34, 'up']]) poi('seat', 'hqs', i, j, { face: f, seat: true, group: 'fire', ground: true });
  TWM.lights.push({ biome: 'hqs', i: 132, j: 33, r: 70, col: '255,170,90', kind: 'fire' });
  prop('basket', 127, 31, { block: false }); prop('basket', 141, 25, { block: false });
  for (const [i, j] of [[147, 27], [147, 30], [147, 33]]) poi('fish', 'hqs', i, j, { face: 'right', cap: 1 });
  prop('rock', 126, 28, { size: 2, block: true }); poi('elder_seat', 'hqs', 127, 28, { face: 'left', seat: true });
  // an orchard: sprite peach trees in rows, each with a picking spot
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const i = 127 + c * 3 + (r % 2), j = 27 + r * 3; if (inMap(i, j) && isB(i, j, 'hqs') && isB(i, j + 1, 'hqs') && !RES[id(i, j)] && !PATHC[id(i, j)] && MAT[id(i, j)] !== M.STREAM && !TWM.isWater(MAT[id(i, j)]) && MAT[id(i, j)] !== M.PAVE) { prop('bigpeach', i, j, { v: r * 4 + c }); poi('tree', 'hqs', i, j + 1, { face: 'up', tree: [i, j], cap: 1 }); reserve(i, j, 1); } }
  poi('cave', 'hqs', FALL_I - 1, MBF, { cap: 4 }); poi('cave', 'hqs', FALL_I + 3, MBF, { cap: 4 });
  // --- BTD landmarks
  prop('caveent', BT.cave[0] - 1, BT.cave[1], { fp: [2, 1], v: 0 }); poi('cave', 'btd', BT.cave[0] + 1, BT.cave[1], { cap: 9 });
  prop('bspire', 66, 135, { fp: [2, 2], v: 0 }); prop('bspire', 91, 134, { fp: [2, 2], v: 1 }); prop('bspire', 83, 145, { fp: [2, 2], v: 0 });
  for (const [i, j] of [[65, 142], [65, 146]]) { prop('bloom', i, j, { fp: [2, 2] }); poi('loom', 'btd', i + 2, j + 1, { face: 'left', target: [i, j] }); }
  prop('circle', 74, 144, { block: false, flat: true }); poi('circle', 'btd', 74, 144, { cap: 12 });
  for (const [i, j] of [[72, 142], [76, 142], [72, 146], [76, 146]]) { prop('vlantern', i, j); TWM.lights.push({ biome: 'btd', i, j, r: 46, col: '190,120,255', kind: 'lantern' }); }
  prop('screen', 89, 139); poi('change', 'btd', 90, 140, { face: 'up' });
  for (let j = 133; j <= 146; j++) for (let i = 88; i <= 99; i++) if (inMap(i, j) && MAT[id(i, j)] === M.SPRING) poi('bath', 'btd', i, j, { water: true });
  for (const [i, j] of [[73, 139], [78, 138], [84, 140], [81, 143], [76, 141]]) poi('thread', 'btd', i, j, { cap: 1 });
  for (const [i, j] of [[68, 150], [85, 153], [72, 156], [93, 137], [70, 133]]) { prop('eggs', i, j); poi('eggs', 'btd', i + 1, j, { face: 'left', target: [i, j] }); }
  // front ledge (south of the chasm): the dwellings, an egg altar, crystal groves, a giant mushroom stand
  prop('tent', 68, 152, { fp: [2, 2], v: 0 }); poi('hut', 'btd', 67, 153, { cap: 3, face: 'right' });
  prop('tent', 90, 153, { fp: [2, 2], v: 1 }); poi('hut', 'btd', 90, 155, { cap: 3, face: 'up' });
  prop('altar', 77, 153, { fp: [2, 2], v: 1 }); poi('altar', 'btd', 77, 156, { cap: 4, face: 'up' }); TWM.lights.push({ biome: 'btd', i: 77, j: 154, r: 60, col: '190,120,255', kind: 'lantern' });
  for (const [i, j, v] of [[71, 151, 0], [83, 151, 1], [95, 152, 2], [67, 131, 2]]) { prop('pcrystals', i, j, { fp: [1, 1], v }); poi('crystal', 'btd', i, j + 1, { cap: 2, face: 'up' }); TWM.lights.push({ biome: 'btd', i, j, r: 40, col: v ? '120,255,140' : '190,130,255', kind: 'crystal' }); }
  for (const [i, v] of [[69, 0], [74, 1], [86, 2], [91, 0]]) { const j = wB(i) + 2; prop('pcrystals', i, j, { fp: [1, 1], v }); poi('crystal', 'btd', i + 1, j, { cap: 2, face: 'up' }); TWM.lights.push({ biome: 'btd', i, j, r: 44, col: v === 1 ? '120,255,140' : '190,130,255', kind: 'crystal' }); }
  for (const i of [66, 73, 84, 92, 95]) { const j = wB(i) + 1; prop('vlantern', i, j); TWM.lights.push({ biome: 'btd', i, j, r: 42, col: '190,120,255', kind: 'lantern' }); }
  prop('bloom', 96, 146, { fp: [2, 2] }); poi('loom', 'btd', 95, 147, { face: 'right', target: [96, 146] });
  prop('tent', 90, 146, { fp: [2, 2], v: 0 }); poi('hut', 'btd', 89, 147, { cap: 3, face: 'right' });
  prop('silkrack', 68, 145, { fp: [2, 2] }); prop('rockarch', 62, 140, { fp: [1, 1], block: false, v: 0, flip: true }); prop('rockarch', 97, 142, { fp: [1, 1], block: false, v: 1 });
  prop('bigmush', 88, 157, { fp: [1, 1], v: 0 }); prop('bigmush', 70, 158, { fp: [1, 1], v: 1 });

  // --- scatter vegetation and rocks (deterministic), never on paths, stairs, water or reserved tiles
  for (const s of TWM.props) if (s.kind === 'stairs') RES[id(s.i, s.j)] = 1;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = id(i, j), m = MAT[k], b = TWM.biomes[BIO[k]].id; if (RES[k] || PATHC[k] || m === M.VOID) continue;
    const r = hash2(i, j, 77), nz = vnoise(i * 0.18, j * 0.18, 78);
    if (b === 'hqs') {
      if (m === M.ROCK) {
        if (H[k] >= 6 && H[k] <= 9 && r < 0.045 && j > 1 && isB(i, j + 1, 'hqs')) { prop('bigpeach', i, j, { v: Math.floor(r * 1000) }); continue; }
        if (r < 0.06 && H[k] < 9) prop('pine', i, j, { block: true }); else if (r < 0.10) prop('crag', i, j, { block: true }); continue; }
      if (TWM.isWater(m)) { if (m === M.POOL && r < 0.12) prop('lily', i, j, { block: false, flat: true }); continue; }
      if (m === M.PAVE || m === M.LEDGE || m === M.BRIDGE) continue;
      if (m === M.SAND) { if (r < 0.04) prop('rock', i, j, { size: 1 }); else if (r < 0.08) prop('shell', i, j, { block: false }); continue; }
      const grove = i >= 118 && i <= 134 && j >= 19 && j <= 36 && isB(i, j + 1, 'hqs');
      if (grove && r < 0.15 && nz > 0.3) { prop('peach', i, j); reserve(i, j, 1); poi('tree', 'hqs', i, j + 1, { face: 'up', tree: [i, j], cap: 1 }); continue; }
      if (!grove && r < 0.035 && H[k] >= 2 && isB(i, j + 1, 'hqs')) { prop('peach', i, j); reserve(i, j, 1); poi('tree', 'hqs', i, j + 1, { face: 'up', tree: [i, j], cap: 1 }); continue; }
      if (j < uB(i) + 1 && r < 0.11 && nz > 0.45) { prop(r < 0.045 ? 'bigbamboo' : 'bamboo', i, j); continue; }
      if (r < 0.05) { prop('rock', i, j, { size: r < 0.015 ? 2 : 1 }); continue; }
      if (r < 0.11) { prop('bush', i, j, { block: false }); continue; }
      if (r < 0.2) { prop(m === M.FLOWER ? 'flowers' : 'tuft', i, j, { block: false }); continue; }
      if (r < 0.26 && (m === M.FLOWER || m === M.LUSH)) prop('fern', i, j, { block: false });
    } else if (b === 'btd') {
      if (m === M.ROCK) {
        if (H[k] >= 7 && r < 0.03) { prop('bspire', i, j, { fp: [1, 1], v: Math.floor(r * 1000) }); continue; }
        if (H[k] >= 5 && r < 0.05) { prop('pcrystals', i, j, { fp: [1, 1], v: Math.floor(r * 1000) }); if (r < 0.04) TWM.lights.push({ biome: 'btd', i, j, r: 36, col: '150,255,170', kind: 'crystal' }); continue; }
        if (r < 0.12) prop('shard', i, j, { block: true }); continue; }
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

  // bridge sprites: every contiguous run of bridge tiles gets one sprite (stone arch over the stream, silk bridge over the chasm), mirrored when it spans along i
  { const seenB = new Uint8Array(NN);
    for (const [mat, kind] of [[M.BRIDGE, 'hbridge'], [M.SILKB, 'silkbr']]) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = id(i, j); if (MAT[k] !== mat || seenB[k]) continue;
      let n = 0; while (inMap(i, j + n) && MAT[id(i, j + n)] === mat) n++; let m2 = 0; while (inMap(i + m2, j) && MAT[id(i + m2, j)] === mat) m2++;
      if (n >= m2) { for (let a = 0; a < n; a++) seenB[id(i, j + a)] = 1; TWM.props.push({ kind, biome: TWM.biomes[BIO[k]].id, i, j, fp: [1, n], block: false, v: 0, bridge: true }); }
      else { for (let a = 0; a < m2; a++) seenB[id(i + a, j)] = 1; TWM.props.push({ kind, biome: TWM.biomes[BIO[k]].id, i, j, fp: [m2, 1], block: false, v: 0, bridge: true, flip: true }); }
    } }
  // ---------------------------------------------------------------- seam band: placeholder ground near a built biome blends toward that biome's colours
  // TWM.seam[k] = distance (1..6) << 2 | built biome (1 hqs, 2 btd); 0 = none. (Design: borders carry both palettes.)
  TWM.seam = new Uint8Array(NN);
  { const q = [], dist = new Int8Array(NN).fill(-1), own = new Uint8Array(NN);
    for (let k = 0; k < NN; k++) { const b = TWM.biomes[BIO[k]]; if (b.built && MAT[k] !== M.VOID) { dist[k] = 0; own[k] = b.id === 'hqs' ? 1 : 2; q.push(k); } }
    for (let h = 0; h < q.length; h++) { const k = q[h], i = k % N, j = Math.floor(k / N); if (dist[k] >= 6) continue;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, c = j + dj; if (!inMap(a, c)) continue; const n = id(a, c); if (dist[n] >= 0) continue; dist[n] = dist[k] + 1; own[n] = own[k]; if (!TWM.biomes[BIO[n]].built) TWM.seam[n] = (dist[n] << 2) | own[n]; q.push(n); } } }
  // wall spots: where a walkable foot tile sits below a cliff of 2+ levels, residents can crawl up the face along runs of 3+ tiles
  for (const bid of ['hqs', 'btd']) {
    let n = 0;
    for (let j = 1; j < N && n < 16; j++) for (let i = 0; i < N - 4 && n < 16; i++) {
      const run = []; for (let a = 0; a < 5; a++) { const k = id(i + a, j), up = id(i + a, j - 1); if (!isB(i + a, j, bid) || MAT[k] === M.VOID || H[up] - H[k] < 2 || MAT[k] === M.STREAM || TWM.isWater(MAT[k]) || RES[k] && a > 0 && false) break; run.push([i + a, j]); }
      if (run.length >= 4 && !(i % 3) && hash2(i, j, 81) < 0.6) { poi('wall', bid, run[0][0], run[0][1], { run: run.map(([a, c]) => [(a + 0.5) * 8, (c + 0.5) * 8]), drop: H[id(i, j - 1)] - H[id(i, j)], cap: 2, face: 'up' }); n++; i += 5; }
    }
  }

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
