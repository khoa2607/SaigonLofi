'use strict';
// ===== Tây Du Ký v2 — Lòng Bàn Tay Phật Tổ (the Buddha's Palm): map section (DOM-free) =====
// Loaded BEFORE tw-map.js; tw-map.js calls TW_PALM_BUILD(ctx) after the Heaven section and TW_PALM_POST(ctx) once walkability is known.
// Composition (design doc §4.3 + the owner's visual brief): the palm itself is never drawn. What the viewer sees is a celestial sea of clouds
// on many levels, five gigantic fingers rising out of it like sacred mountain pillars, and the seated Buddha far away on a high cloud
// terrace in the upper corner. Paths are ordinary cloud tiles (slightly brighter) so they hide inside the terraces.
//   u = i - j (screen x), v = i + j (screen y, smaller = further up the screen). The palm anchor is the old cell centre (U0, V0).
window.TW_PALM_BUILD = function (X) {
  const { TWM, N, H, MAT, BIO, PATHC, RES, M, set, prop, poi, isB, id, inMap, vnoise, hash2, carvePath, mulberry32 } = X;
  const bk = TWM.bi.btp; TWM.biomes[bk].built = true;
  const U0 = 68, V0 = 190, ij = (u, v) => [Math.round((v + u) / 2), Math.round((v - u) / 2)], uv = (i, j) => [i - j, i + j];
  const P = TWM.palm = { U0, V0, centre: ij(U0, V0), fingers: [], tiers: [], islands: [], pois: {}, sea: [] };
  const inB = (i, j) => inMap(i, j) && BIO[id(i, j)] === bk && MAT[id(i, j)] !== M.VOID;
  const R = mulberry32(777);

  // ---------------------------------------------------------------- fingers: base tile, height in levels (16 art px each), girth
  // little, ring, middle, index, thumb; screen offsets (du, dv): outer fingers stand a little further back, the thumb nearer and stouter.
  const FING = [{ n: 'little', du: -13, dv: -5, lv: 15, w: 108 }, { n: 'ring', du: -6.5, dv: -2, lv: 20, w: 120 }, { n: 'middle', du: 0, dv: 0, lv: 25, w: 132 },
                { n: 'index', du: 6.5, dv: -1, lv: 22, w: 124 }, { n: 'thumb', du: 14, dv: 4, lv: 13, w: 150 }];
  FING.forEach((f, k) => { const [i, j] = ij(U0 + f.du, V0 + f.dv); P.fingers.push({ k, name: f.n, i: i - 1, j: j - 1, cx: i, cy: j, lv: f.lv, w: f.w, du: f.du, dv: f.dv }); });

  // ---------------------------------------------------------------- terrain: every BTP tile is cloud
  const lvlAt = (i, j) => {
    const [u, v] = uv(i, j), du = u - U0, dv = v - V0;
    // plateau (lanes) at level 2, the finger platform at 3, a cloud wall behind the fingers at 4
    let lvl = 1, plateau = Math.hypot(du / 25, dv / 17) < 1;
    if (plateau) lvl = 2;
    if (Math.abs(du) < 20 && dv > -10 && dv < 3.5 && Math.hypot(du / 21, (dv + 3) / 8.5) < 1) lvl = 3;
    if (Math.abs(du) < 22 && dv <= -9.5 && dv > -15 && Math.hypot(du / 23, (dv + 12) / 4) < 1) lvl = Math.max(lvl, 4 + (vnoise(i * 0.2, j * 0.2, 311) > 0.55 ? 1 : 0));
    return lvl;
  };
  // the cloud sea (non-walkable) lies beyond the plateau; troughs show a deeper layer so the sea has depth
  const seaLevel = (i, j) => { const n = vnoise(i * 0.13, j * 0.13, 312), m = vnoise(i * 0.31, j * 0.31, 313); return n > 0.74 ? -1 : n > 0.6 ? 0 : (m > 0.78 ? 2 : 1); };
  for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) if (inB(i, j)) {
    const l = lvlAt(i, j); if (l > 1) set(i, j, l, M.SKYC); else set(i, j, seaLevel(i, j), M.SKYD);
  }
  // Buddha's terraced approach (rises toward the upper-right corner) and two cloud islands
  const tier = (du, dv, ru, rv, lvl, name) => { const [ci, cj] = ij(U0 + du, V0 + dv); P.tiers.push({ name, i: ci, j: cj, lvl });
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) if (inB(i, j)) { const [u, v] = uv(i, j); if (Math.hypot((u - U0 - du) / ru, (v - V0 - dv) / rv) < 1 + (vnoise(i * 0.4, j * 0.4, 314) - 0.5) * 0.16 && lvl > H[id(i, j)]) set(i, j, lvl, M.SKYC); } };
  tier(11, -13, 7, 5.5, 5, 't1'); tier(16, -21, 6.5, 5, 7, 't2'); tier(20, -27, 6.5, 4.6, 9, 't3'); tier(23, -32, 6, 4.4, 11, 'buddha');
  tier(-27, -4, 5.5, 4.2, 5, 'west'); tier(21, 10, 5, 4, 4, 'east');
  P.buddha = ij(U0 + 23, V0 - 32); P.island = { west: ij(U0 - 27, V0 - 4), east: ij(U0 + 21, V0 + 10) };

  // ---------------------------------------------------------------- routes (cloud tiles slightly brighter; stairs where a route climbs)
  // heights along a route are ramped so no step is taller than 2 levels, then carvePath links them with stairs
  const route = (pts) => {
    const tiles = []; for (let k = 0; k < pts.length - 1; k++) { let [i, j] = pts[k]; const [i1, j1] = pts[k + 1]; while (i !== i1 || j !== j1) { tiles.push([i, j]); if (Math.abs(i1 - i) >= Math.abs(j1 - j) && i !== i1) i += Math.sign(i1 - i); else j += Math.sign(j1 - j); } } tiles.push(pts[pts.length - 1]);
    let prev = null; for (const [i, j] of tiles) { if (!inB(i, j)) { prev = null; continue; } const k = id(i, j); if (prev !== null) { const d = H[k] - prev; if (d > 1) H[k] = prev + 1; else if (d < -1) H[k] = prev - 1; } prev = H[k]; MAT[k] = M.SKYC; }
    carvePath(pts, M.SKYC, 'btp');
  };
  const at = (du, dv) => ij(U0 + du, V0 + dv);
  const laneA = [at(-22, 8), at(-12, 8), at(-3, 8), at(6, 8), at(16, 8), at(23, 8)];   // front lane, level 2
  const laneB = [at(-22, 8), at(-24, -3), at(-22, -12), at(-12, -12), at(0, -12), at(10, -13)];   // back lane up the left side and along behind the fingers
  route(laneA); route(laneB);
  route([at(23, 8), [145, 46], [146, 38], [146, 36]]);                                   // the cloud walkway along the east rim that meets Hoa Quả Sơn (keeps the world one walkable piece)
  route([at(23, 8), at(21, 10)]);                                             // to the east island
  route([at(-24, -3), at(-27, -4)]);                                          // to the west island
  route([at(10, -13), at(11, -13), at(14, -18), at(16, -21), at(18, -24), at(20, -27), at(22, -30), at(23, -32)]);   // up the terraces to the Buddha
  P.fingers.forEach((f, k) => { const front = [f.i + 3, f.j + 3]; f.front = front;   // the ledge in front of each pillar, reached from the front lane
    route([at(f.du, 8), [front[0], front[1]]]); });

  // ---------------------------------------------------------------- props
  P.fingers.forEach(f => { prop('finger', f.i, f.j, { fp: [2, 2], v: f.k, finger: f.k, lv: f.lv, w: f.w }); });
  prop('buddha', P.buddha[0] - 1, P.buddha[1] - 1, { fp: [3, 3], v: 0 });
  // work and rest points
  P.fingers.forEach(f => { poi('pillar', 'btp', f.front[0], f.front[1], { cap: 2, face: 'up', finger: f.k }); poi('pillar_back', 'btp', f.i + 1, f.j - 1, { cap: 1, face: 'down', finger: f.k }); });
  const bd = [P.buddha[0] + 3, P.buddha[1] + 3];
  poi('devotion', 'btp', bd[0], bd[1], { cap: 5, face: 'up' }); poi('devotion', 'btp', bd[0] - 2, bd[1] + 1, { cap: 3, face: 'up' });
  poi('lotus', 'btp', P.island.east[0], P.island.east[1], { cap: 3, face: 'right' });
  poi('lotus', 'btp', P.island.west[0], P.island.west[1], { cap: 3, face: 'left' });
  poi('launch', 'btp', at(0, 8)[0], at(0, 8)[1], { cap: 3, face: 'up' });
  poi('rest', 'btp', at(-10, -12)[0], at(-10, -12)[1], { cap: 4, face: 'down' }); poi('rest', 'btp', at(14, 8)[0], at(14, 8)[1], { cap: 4, face: 'up' });
  for (const [du, dv] of [[-18, 5], [-8, 6], [8, 6], [18, 6]]) { const [i, j] = at(du, dv); poi('stroll', 'btp', i, j, { cap: 2 }); }
  // decoration that residents also use: dharma wheel by the Buddha's steps, bells on the islands, lotus on both islands
  const wh = [bd[0] - 1, bd[1] - 4]; if (inB(wh[0], wh[1]) && H[id(wh[0], wh[1])] > 6) prop('pwheel', wh[0], wh[1], { fp: [1, 1], v: 0 });
  prop('plotus', P.island.east[0] - 2, P.island.east[1] - 1, { fp: [1, 1], v: 0, block: true }); prop('plotus', P.island.west[0] + 1, P.island.west[1] - 2, { fp: [1, 1], v: 1, block: true });
  prop('pbell', P.island.west[0] - 2, P.island.west[1] + 1, { fp: [1, 1], v: 0 }); prop('pbell', P.island.east[0] + 2, P.island.east[1] - 1, { fp: [1, 1], v: 0 });
  prop('plantern', at(-16, 7)[0], at(-16, 7)[1], { fp: [1, 1], v: 0 }); prop('plantern', at(20, 7)[0], at(20, 7)[1], { fp: [1, 1], v: 1 });
  // ---------------------------------------------------------------- cloud dressing: sprite banks along terrace edges and in the sea (non-blocking, floating at layer heights)
  // each entry draws behind (smaller depth key) or in front of the fingers' bases; positions come from a seeded scatter so the map stays deterministic
  P.clouds = [];
  const addCloud = (kind, i, j, lift, v, o) => P.clouds.push(Object.assign({ kind, i, j, lift, v }, o || {}));
  // in front of every finger base: rim puffs hiding where the pillar meets the cloud
  P.fingers.forEach(f => { for (let s = 0; s < 4; s++) addCloud('pcloud', f.i + 1 + s - 1 + Math.round(R() * 2), f.j + 2 + s % 2 + Math.round(R() * 2), 0, Math.floor(R() * 4), { rim: true }); });
  // sea clouds at three elevations (behind, between and in front of the pillars)
  for (let k = 0; k < 120; k++) {
    const i = Math.floor(78 + R() * 76), j = Math.floor(10 + R() * 74); if (!inB(i, j)) continue; const [u, v] = uv(i, j), du = u - U0, dv = v - V0;
    if (Math.hypot(du / 25, dv / 17) < 0.95) continue;                            // keep the plateau (lanes) clear
    addCloud(R() < 0.3 ? 'pcloudw' : 'pcloud', i, j, [-6, -2, 0, 3, 7][Math.floor(R() * 5)], Math.floor(R() * 8));
  }
  // layered banks behind and above the fingers at high levels (the "sea" seen between the pillars)
  for (let k = 0; k < 22; k++) { const du = -36 + R() * 72, dv = -26 + R() * 14; const [i, j] = at(du, dv); if (!inB(i, j)) continue; addCloud(k % 4 === 0 ? 'pcloudt' : 'pcloudw', i, j, 8 + R() * 18, Math.floor(R() * 8), { far: true }); }
  // drifting layers (animated in the renderer): three speeds, three heights
  P.drift = []; for (let k = 0; k < 16; k++) { const du = -40 + R() * 80, dv = -30 + R() * 56; const [i, j] = at(du, dv); if (!inB(i, j)) continue; P.drift.push({ kind: k % 3 ? 'pcloud' : 'pcloudw', i, j, lift: 4 + R() * 22, v: Math.floor(R() * 8), speed: 0.4 + R() * 1.1, range: 8 + R() * 14, ph: R() * 6.28 }); }
  // edge points for the "invisible boundary" mini event: far points on the sea side of the plateau
  P.edges = [at(-30, 2), at(-26, -14), at(30, 4), at(28, -22), at(0, 22), at(-14, 20), at(14, 20)].filter(p => inB(p[0], p[1]));
  return P;
};

// runs after walkability: the cloud sea (SKYD) is scenery, not floor
window.TW_PALM_POST = function (X) { const { MAT, WALK, M } = X; for (let k = 0; k < MAT.length; k++) if (MAT[k] === M.SKYD) WALK[k] = 0; };
