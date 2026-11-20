'use strict';
// ===== Tây Du Ký v2 — footprint normalisation (loaded before tw-map.js) =====
// The four built biomes are authored in a 160 x 160 "authoring space" (tw-map.js, tw-palm.js). Before the tail of the map build (provisional
// routes, gates, bridges, seam, walkability, nav) this module relocates the authored content into the compact 104 x 104 WORLD space:
//   1. every built biome is trimmed to its footprint (core + small support ring + short exits); tiles outside become placeholder land;
//   2. each biome is only TRANSLATED (never rotated or edited): the Hoa Quả Sơn / Thiên Cung / Buddha's Palm cluster moves as one block, Bàn Tơ Động
//      moves next to it; the tile lists of Hoa Quả Sơn and Bàn Tơ Động stay byte-identical (tests/tayduky-v2-map15.mjs un-maps and hashes them);
//   3. the eleven placeholder regions are re-planned on the free land (farthest-point seeds + area-balanced Lloyd relaxation), named by where they used to sit.
// Adjacency is still DERIVED from the final tile mask (tw-map.js), never hand-written.
const TW_LAYOUT = (function () {
  // WORLD 124 x 124 (160 x 160 originally, 104 x 104 after the footprint pass; grown by 20 rows/columns of free land for Hỏa Diệm Sơn). Per-biome rigid translations (authoring -> world):
  //   cluster (Hoa Quả Sơn, Thiên Cung, Buddha's Palm): (-57, 0)      Bàn Tơ Động: (-58, -76) (now west of the palm, below Thiên Cung)
  const N2 = 124, OFF_CLUSTER = [-57, 0], OFF_BTD = [-58, -76];
  // footprint rules (authoring coordinates). Targets: <= ~900 tiles per newly planned biome, tc/btp trimmed to active core + small support ring.
  const TC_CORE = [69, 9, 98, 30], TC_RING = 2, TC_EXIT = 4, BTP_RING = 1;

  function apply(X) {
    const { TWM, N: N0, H: H0, MAT: MAT0, BIO: BIO0, PATHC: PATHC0, RES: RES0, M, vnoise } = X, NN0 = N0 * N0, id0 = (i, j) => j * N0 + i;
    const BIO_OLD = BIO0.slice(), bi = TWM.bi, built = new Set(TWM.biomes.filter(b => b.built).map(b => b.k));
    // ---- 1. footprints in authoring space
    const fp = new Uint8Array(NN0);
    for (const p of TWM.props) { const fw = p.fp ? p.fp[0] : 1, fh = p.fp ? p.fp[1] : 1; for (let b = 0; b < fh; b++) for (let a = 0; a < fw; a++) if (p.i + a >= 0 && p.j + b >= 0 && p.i + a < N0 && p.j + b < N0) fp[id0(p.i + a, p.j + b)] = 1; }
    const keep = new Uint8Array(NN0);
    const ring = (active, biome, r) => {   // 4-neighbour distance <= r from the active tiles, inside the biome
      const dist = new Int8Array(NN0).fill(-1), q = [];
      for (let k = 0; k < NN0; k++) if (active[k]) { dist[k] = 0; q.push(k); }
      for (let h = 0; h < q.length; h++) { const k = q[h]; keep[k] = 1; if (dist[k] >= r) continue; const i = k % N0, j = Math.floor(k / N0);
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 1 || b < 1 || a >= N0 - 1 || b >= N0 - 1) continue; const z = id0(a, b); if (dist[z] < 0 && BIO0[z] === biome) { dist[z] = dist[k] + 1; q.push(z); } } }
    };
    for (let k = 0; k < NN0; k++) { const b = BIO0[k]; if (b === bi.hqs || b === bi.btd) keep[k] = 1; }                       // the density reference: unchanged
    { const act = new Uint8Array(NN0), [x0, y0, x1, y1] = TC_CORE;                                                            // Thiên Cung: core rectangle, ring, short level-1 exits
      for (let j = 1; j < N0 - 1; j++) for (let i = 1; i < N0 - 1; i++) { const k = id0(i, j); if (BIO0[k] !== bi.tc) continue;
        const d = Math.max(x0 - i, 0, i - x1) + Math.max(y0 - j, 0, j - y1);
        if (d <= TC_RING || (d <= TC_EXIT && (MAT0[k] === M.HEAVENPAVE && H0[k] === 1 || PATHC0[k]))) act[k] = 1; }
      ring(act, bi.tc, 0); }
    { const act = new Uint8Array(NN0);                                                                                         // Buddha's Palm: active art + ring
      for (let k = 0; k < NN0; k++) if (BIO0[k] === bi.btp && (MAT0[k] === M.SKYC || H0[k] >= 3 || fp[k] || PATHC0[k])) act[k] = 1;
      ring(act, bi.btp, BTP_RING); }
    const connect = (biome) => {   // a trimmed footprint must stay one piece: join stray islands to the main body by the shortest strip of the biome's own tiles
      for (let guard = 0; guard < 8; guard++) {
        const comp = new Int32Array(NN0).fill(-1), sizes = []; let c = 0;
        for (let k = 0; k < NN0; k++) { if (!keep[k] || BIO0[k] !== biome || comp[k] >= 0) continue; const q = [k]; comp[k] = c; for (let n = 0; n < q.length; n++) { const x = q[n] % N0, y = Math.floor(q[n] / N0); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id0(x + dx, y + dy); if (keep[z] && BIO0[z] === biome && comp[z] < 0) { comp[z] = c; q.push(z); } } } sizes.push(q.length); c++; }
        if (c <= 1) return;
        const main = sizes.indexOf(Math.max(...sizes)), prev = new Int32Array(NN0).fill(-2), q = [];
        for (let k = 0; k < NN0; k++) if (comp[k] === main) { prev[k] = -1; q.push(k); }
        let hit = -1;
        for (let n = 0; n < q.length && hit < 0; n++) { const x = q[n] % N0, y = Math.floor(q[n] / N0); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id0(x + dx, y + dy); if (prev[z] !== -2 || BIO0[z] !== biome) continue; prev[z] = q[n]; if (comp[z] >= 0) { hit = z; break; } q.push(z); } }
        if (hit < 0) return;
        for (let k = hit; k >= 0; k = prev[k]) keep[k] = 1;
      }
    };
    connect(bi.tc); connect(bi.btp);
    for (let k = 0; k < NN0; k++) if (keep[k] && (!built.has(BIO0[k]) || k % N0 < 1 || k % N0 > N0 - 2 || Math.floor(k / N0) < 1 || Math.floor(k / N0) > N0 - 2)) keep[k] = 0;
    const offOf = b => (b === bi.btd ? OFF_BTD : OFF_CLUSTER);
    const kept = (i, j) => { i = Math.floor(i); j = Math.floor(j); return i >= 0 && j >= 0 && i < N0 && j < N0 && keep[id0(i, j)] === 1; };

    // ---- 2. new grids
    const N = N2, NN = N * N, id = (i, j) => j * N + i;
    const H = new Int8Array(NN), MAT = new Uint8Array(NN), BIO = new Uint8Array(NN), WALK = new Uint8Array(NN), PATHC = new Uint8Array(NN), RES = new Uint8Array(NN);
    const fixed = new Uint8Array(NN);
    for (let j = 0; j < N0; j++) for (let i = 0; i < N0; i++) { const k = id0(i, j); if (!keep[k]) continue; const o = offOf(BIO0[k]), n = id(i + o[0], j + o[1]);
      if (fixed[n] || i + o[0] < 1 || j + o[1] < 1 || i + o[0] > N - 2 || j + o[1] > N - 2) throw new Error('tw-layout: biome footprints collide or leave the map at ' + i + ',' + j);
      H[n] = H0[k]; MAT[n] = MAT0[k]; BIO[n] = BIO0[k]; PATHC[n] = PATHC0[k]; RES[n] = RES0[k]; fixed[n] = 1; }
    // ---- 2b. Hỏa Diệm Sơn is authored directly in world space (tw-fire.js): reserve its footprint (a rounded blob, local 36 x 38) before the placeholders are planned
    // squircle core + the two map-edge strips (the biome hugs the world's south-west corner, so no dead wedge is left between it and the rim)
    const HDS = { x0: 1, y0: 83, w: 37, h: 40, cx: 18, cy: 19, rx: 19, ry: 20, p: 3.2 };   // h 39 -> 40: the strip reaches the rim row so no sliver of placeholder is left under it
    HDS.q = (a, b) => (Math.abs(a - HDS.cx) / HDS.rx) ** HDS.p + (Math.abs(b - HDS.cy) / HDS.ry) ** HDS.p;
    HDS.inside = (a, b) => a >= 0 && b >= 0 && a < HDS.w && b < HDS.h && (HDS.q(a, b) < 1 || (a <= 4 && b >= 8) || (b >= 34 && a <= HDS.w - 9));
    built.add(bi.hds); TWM.biomes[bi.hds].built = true;
    let hdsN = 0;
    for (let b = 0; b < HDS.h; b++) for (let a = 0; a < HDS.w; a++) { if (!HDS.inside(a, b)) continue; const n = id(HDS.x0 + a, HDS.y0 + b);
      if (fixed[n] || HDS.x0 + a < 1 || HDS.y0 + b < 1 || HDS.x0 + a > N - 2 || HDS.y0 + b > N - 2) throw new Error('tw-layout: Hỏa Diệm Sơn footprint collides at ' + a + ',' + b);
      BIO[n] = bi.hds; fixed[n] = 1; hdsN++; }
    TWM.biomes[bi.hds].centre = [HDS.x0 + HDS.cx, HDS.y0 + HDS.cy];
    // ---- 2c. Sư Đà Lĩnh (Lion Camel Ridge) is also authored in world space (tw-lion.js): a squircle plus the south rim strip, east of Hỏa Diệm Sơn (never over its tiles)
    const SDL = { x0: 30, y0: 84, w: 47, h: 39, cx: 23.5, cy: 19, rx: 24.5, ry: 20, p: 3.4, p: 3.4 };
    SDL.q = (a, b) => (Math.abs(a - SDL.cx) / SDL.rx) ** SDL.p + (Math.abs(b - SDL.cy) / SDL.ry) ** SDL.p;
    SDL.inside = (a, b) => a >= 0 && b >= 0 && a < SDL.w && b < SDL.h && (SDL.q(a, b) < 1 || (b >= SDL.h - 4 && a < SDL.w - 6));
    built.add(bi.sdl); TWM.biomes[bi.sdl].built = true;
    let sdlN = 0;
    for (let b = 0; b < SDL.h; b++) for (let a = 0; a < SDL.w; a++) { if (!SDL.inside(a, b)) continue; const n = id(SDL.x0 + a, SDL.y0 + b);
      if (fixed[n]) continue;   // Hỏa Diệm Sơn keeps its tiles
      if (SDL.x0 + a < 1 || SDL.y0 + b < 1 || SDL.x0 + a > N - 2 || SDL.y0 + b > N - 2) continue;
      BIO[n] = bi.sdl; fixed[n] = 1; sdlN++; }
    TWM.biomes[bi.sdl].centre = [SDL.x0 + SDL.cx, SDL.y0 + SDL.cy];
    // ---- 3. re-plan the placeholders: Lloyd relaxation of the mapped old centres over the free land
    const unb = TWM.biomes.filter(b => !b.built), free = [];
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) if (!fixed[id(i, j)]) free.push([i, j]);
    // seeds: farthest-point sampling over the free land (spread evenly), then Lloyd relaxation with a gentle area balance (power diagram)
    const K = unb.length, seeds = [];
    { let cx = 0, cy = 0; for (const [i, j] of free) { cx += i; cy += j; } cx /= free.length; cy /= free.length;
      const dmin = new Float32Array(free.length).fill(1e9); let pick = 0, bd = -1;
      for (let n = 0; n < free.length; n++) { const d = (free[n][0] - cx) ** 2 + (free[n][1] - cy) ** 2; if (d > bd) { bd = d; pick = n; } }
      for (let s = 0; s < K; s++) { seeds.push([free[pick][0], free[pick][1]]); bd = -1; let nxt = 0;
        for (let n = 0; n < free.length; n++) { const d = (free[n][0] - free[pick][0]) ** 2 + (free[n][1] - free[pick][1]) ** 2; if (d < dmin[n]) dmin[n] = d; if (dmin[n] > bd) { bd = dmin[n]; nxt = n; } }
        pick = nxt; } }
    const wgt = seeds.map(() => 0);
    const nearest = (x, y) => { let best = 0, bd = 1e9; for (let s = 0; s < K; s++) { const d = (x - seeds[s][0]) ** 2 + (y - seeds[s][1]) ** 2 - wgt[s]; if (d < bd) { bd = d; best = s; } } return best; };
    const target = free.length / K;
    for (let it = 0; it < 120; it++) { const sx = seeds.map(() => 0), sy = seeds.map(() => 0), sn = seeds.map(() => 0);
      for (const [i, j] of free) { const s = nearest(i, j); sx[s] += i; sy[s] += j; sn[s]++; }
      for (let s = 0; s < K; s++) { if (sn[s]) seeds[s] = [sx[s] / sn[s], sy[s] / sn[s]]; if (it > 30) wgt[s] += (target - sn[s]) * 0.04; } }
    // names go to the seeds nearest to where each region used to sit (greedy matching on the mapped old centres): the relative arrangement survives
    const order = []; for (let u = 0; u < K; u++) for (let s = 0; s < K; s++) { const c = unb[u].centre, ox = c[0] * N / N0, oy = c[1] * N / N0; order.push([(ox - seeds[s][0]) ** 2 + (oy - seeds[s][1]) ** 2, u, s]); }
    order.sort((a, c) => a[0] - c[0]); const usedU = new Set(), usedS = new Set(), seedOf = [];
    for (const [, u, s] of order) if (!usedU.has(u) && !usedS.has(s)) { usedU.add(u); usedS.add(s); seedOf[u] = s; }
    const label = []; for (let u = 0; u < K; u++) label[seedOf[u]] = unb[u];
    const warp = (i, j) => [i + (vnoise(i * 0.09, j * 0.09, 31) - 0.5) * 6, j + (vnoise(i * 0.09, j * 0.09, 32) - 0.5) * 6];
    for (const [i, j] of free) { const [wi, wj] = warp(i, j); BIO[id(i, j)] = label[nearest(wi, wj)].k; }
    for (let s = 0; s < K; s++) label[s].centre = [seeds[s][0], seeds[s][1]];
    // a warped cut can strand a fragment of a placeholder: attach every non-largest component to the placeholder neighbour with the longest shared edge
    for (const b of unb) {
      const seen = new Uint8Array(NN), parts = [];
      for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const s0 = id(i, j); if (seen[s0] || fixed[s0] || BIO[s0] !== b.k) continue;
        const q = [s0]; seen[s0] = 1;
        for (let n = 0; n < q.length; n++) { const x = q[n] % N, y = Math.floor(q[n] / N); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, c = y + dy; if (a < 1 || c < 1 || a >= N - 1 || c >= N - 1) continue; const t = id(a, c); if (!seen[t] && !fixed[t] && BIO[t] === b.k) { seen[t] = 1; q.push(t); } } }
        parts.push(q); }
      parts.sort((a, c) => c.length - a.length);
      for (const part of parts.slice(1)) { const counts = new Map();
        for (const k of part) { const x = k % N, y = Math.floor(k / N); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, c = y + dy; if (a < 1 || c < 1 || a >= N - 1 || c >= N - 1) continue; const v = BIO[id(a, c)]; if (v !== b.k && !built.has(v)) counts.set(v, (counts.get(v) || 0) + 1); } }
        if (counts.size) { const target = [...counts].sort((a, c) => c[1] - a[1])[0][0]; for (const k of part) BIO[k] = target; }
        else { // a pocket sealed in by built biomes: it becomes empty sea inside the neighbouring unpinned footprint (Buddha's Palm / Thiên Cung)
          const touch = new Map(); for (const k of part) { const x = k % N, y = Math.floor(k / N); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = BIO[id(x + dx, y + dy)]; if ((v === bi.btp || v === bi.tc)) touch.set(v, (touch.get(v) || 0) + 1); } }
          if (touch.size) { const target = [...touch].sort((a, c) => c[1] - a[1])[0][0]; for (const k of part) { BIO[k] = target; fixed[k] = 1; H[k] = target === bi.btp ? 0 : -1; MAT[k] = target === bi.btp ? M.SKYD : M.CLOUD; } } } }
    }
    for (const b of TWM.biomes) if (b.built && b.k !== bi.hds && b.k !== bi.sdl) { const o = offOf(b.k); b.centre = [b.centre[0] + o[0], b.centre[1] + o[1]]; }

    // ---- 4. objects
    // every authored object moves with the biome that owns its tile (authoring-space owner), so a biome is only ever translated
    const own = (i, j) => { i = Math.floor(i); j = Math.floor(j); return i >= 0 && j >= 0 && i < N0 && j < N0 ? BIO_OLD[id0(i, j)] : bi.hqs; };
    const tf = (i, j) => { const o = offOf(own(i, j)); return [i + o[0], j + o[1]]; };
    const shiftTile = o => { if (typeof o.i === 'number') { const [a, b] = tf(o.i, o.j); o.i = a; o.j = b; } return o; };
    const pairs = (a) => a ? tf(a[0], a[1]) : a;
    const keepList = (list, fn) => { const out = []; for (const o of list) { if (!kept(o.i, o.j)) continue; const ow = offOf(own(o.i, o.j)); shiftTile(o); if (fn) fn(o, ow); out.push(o); } return out; };
    TWM.props = keepList(TWM.props);
    TWM.pois = keepList(TWM.pois, (o, ow) => {
      const sx = ow[0] * 8, sy = ow[1] * 8;
      if (typeof o.x === 'number') { o.x += sx; o.y += sy; }
      if (o.target) o.target = [o.target[0] + ow[0], o.target[1] + ow[1]]; if (o.tree) o.tree = [o.tree[0] + ow[0], o.tree[1] + ow[1]];
      if (o.run) o.run = o.run.map(([x, y]) => [x + sx, y + sy]);
    });
    TWM.lights = keepList(TWM.lights); TWM.falls = keepList(TWM.falls); TWM.decals = keepList(TWM.decals);
    TWM.webs = TWM.webs.filter(w => kept(w.x / 8, w.y / 8)).map(w => { const o = offOf(own(w.x / 8, w.y / 8)); w.x += o[0] * 8; w.y += o[1] * 8; return w; });
    TWM.water = TWM.water.filter(w => (w.c ? kept(w.c[0], w.c[1]) : w.pts ? kept(w.pts[0][0], w.pts[0][1]) : true)).map(w => {
      if (w.c) w.c = pairs(w.c); if (w.pts) w.pts = w.pts.map(p => pairs(p));
      if (w.f) { const f0 = w.f, di = OFF_CLUSTER[0]; w.f = J => f0(J) + di; }                       // the (north-east) sea strip: rows are unchanged, columns shift
      return w; });
    const remapId = k => { const o = offOf(BIO_OLD[k]); return id(k % N0 + o[0], Math.floor(k / N0) + o[1]); };
    const stairs = new Map(), stairAt = new Map();
    for (const [key, v] of TWM.stairs) { const [a, b] = key.split(',').map(Number); if (keep[a] && keep[b]) stairs.set(remapId(a) + ',' + remapId(b), v); }
    for (const [k, v] of TWM.stairAt) if (keep[k]) stairAt.set(remapId(k), v);
    TWM.stairs = stairs; TWM.stairAt = stairAt;
    // authored records
    for (const r of [TWM.tc, TWM.btd]) for (const key of Object.keys(r)) if (Array.isArray(r[key])) r[key] = pairs(r[key]);
    { const r = TWM.hqs; for (const key of Object.keys(r)) if (Array.isArray(r[key])) r[key] = pairs(r[key]); r.fallI += OFF_CLUSTER[0]; r.mB += OFF_CLUSTER[1]; }
    if (TWM.palm) { const P = TWM.palm;
      for (const key of ['centre', 'buddha']) P[key] = pairs(P[key]);
      for (const f of P.fingers) { [f.i, f.j] = tf(f.i, f.j); [f.cx, f.cy] = tf(f.cx, f.cy); f.front = pairs(f.front); }
      for (const t of P.tiers) { [t.i, t.j] = tf(t.i, t.j); }
      P.island = { west: pairs(P.island.west), east: pairs(P.island.east) };
      P.clouds = P.clouds.filter(c => kept(c.i, c.j)); for (const c of P.clouds) shiftTile(c);
      P.drift = P.drift.filter(c => kept(c.i, c.j)); for (const c of P.drift) shiftTile(c);
      P.edges = P.edges.map(e => pairs(e)).map(e => [Math.max(2, Math.min(N - 3, e[0])), Math.max(2, Math.min(N - 3, e[1]))]);   // the 'edge of the universe' points float in the sea beyond the footprint
    }
    const unmap = (i, j) => { const b = BIO[id(i, j)], o = offOf(b); return [i - o[0], j - o[1]]; };   // world -> authoring (valid on built biomes' tiles)
    TWM.layout = { N0, N, hds: HDS, hdsTiles: hdsN, sdl: SDL, sdlTiles: sdlN, map: tf, unmap, offsets: { cluster: OFF_CLUSTER, btd: OFF_BTD }, keptTiles: Array.from(keep).reduce((s, v) => s + v, 0), rules: { TC_CORE, TC_RING, TC_EXIT, BTP_RING } };
    return { N, NN, H, MAT, BIO, WALK, PATHC, RES };
  }
  return { apply, N2 };
})();
if (typeof window !== 'undefined') window.TW_LAYOUT = TW_LAYOUT;
if (typeof module !== 'undefined') module.exports = { TW_LAYOUT };
