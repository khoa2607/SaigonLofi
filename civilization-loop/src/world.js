// The persistent world: terrain plus everything that remembers what happened to it. Nothing here is ever reset when the civilization advances.
import { fbm, vnoise, hash2, clamp } from './rng.js';

export const N = 48;
export const G = { GRASS: 0, WATER: 1, ROCK: 2 };
export const idx = (x, y) => y * N + x;
export const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

export function createWorld(seed) {
  const n = N * N, ph1 = hash2(seed, 1) * 6.28, ph2 = hash2(seed, 2) * 6.28, ph3 = hash2(seed, 3) * 6.28;
  const W = {
    N, seed,
    ground: new Uint8Array(n), fert: new Float32Array(n), soil: new Float32Array(n).fill(1),
    tree: new Uint8Array(n),                         // 0..3 canopy level
    clearedYear: new Int16Array(n).fill(-9999),       // last year the trees here were removed (logging / fire / building)
    burnt: new Uint8Array(n), burntYear: new Int16Array(n).fill(-9999),
    flood: new Uint8Array(n),                         // how many times a flood has reached this tile (never forgotten)
    road: new Uint8Array(n), wear: new Float32Array(n), roadUsed: new Int16Array(n),
    farmed: new Uint8Array(n),                        // 0 never, 1 field, 2 abandoned field (the furrows stay)
    farmedYear: new Int16Array(n),
    bld: new Int16Array(n).fill(-1), lastBld: new Int16Array(n).fill(-1),
    ruin: new Uint8Array(n), ruinKind: new Uint8Array(n), ruinYear: new Int16Array(n), ruinWood: new Float32Array(n), ruinStone: new Float32Array(n),
    stone: new Uint16Array(n), quarried: new Uint8Array(n),
    waterDist: new Uint8Array(n),
    site: { x: 0, y: 0 },
  };
  // river (north to south, meandering), a small lake in the north-west, a pond in the south-east
  const cxOf = y => 17 + 5 * Math.sin(y * 0.13 + ph1) + 2.4 * Math.sin(y * 0.31 + ph2);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const t = idx(x, y), wid = 1.5 + 0.55 * Math.sin(y * 0.21 + ph3);
    if (Math.abs(x + 0.5 - cxOf(y)) < wid) W.ground[t] = G.WATER;
    if (Math.hypot(x - 8, y - 9) < 3.1 + 0.6 * vnoise(x, y, seed + 5)) W.ground[t] = G.WATER;
    if (Math.hypot(x - 38, y - 40) < 2.2 + 0.7 * vnoise(x, y, seed + 6)) W.ground[t] = G.WATER;
  }
  // distance to the nearest water (chebyshev, capped)
  for (let t = 0; t < n; t++) W.waterDist[t] = W.ground[t] === G.WATER ? 0 : 99;
  for (let pass = 0; pass < 12; pass++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const t = idx(x, y); let b = W.waterDist[t];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (inb(x + dx, y + dy)) b = Math.min(b, W.waterDist[idx(x + dx, y + dy)] + 1);
    W.waterDist[t] = b;
  }
  // settlement site: an open meadow on the east bank of the river
  let site = null, bestS = -1e9;
  for (let y = 16; y < 32; y++) for (let x = 18; x < 40; x++) {
    const t = idx(x, y); if (W.ground[t] !== G.GRASS) continue;
    const s = -Math.abs(W.waterDist[t] - 3) * 1.5 - Math.hypot(x - (cxOf(y) + 9), y - 24) * 0.5;
    if (s > bestS) { bestS = s; site = { x, y }; }
  }
  W.site = site;
  // rock: hills in the south-east and north-east, plus a few outcrops
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const t = idx(x, y); if (W.ground[t] !== G.GRASS) continue;
    const hill = fbm(x / 5.5 + 3, y / 5.5, seed + 11) + (x + y) / (2 * N) * 0.42 + (Math.hypot(x - 44, y - 6) < 8 ? 0.22 : 0);
    if (hill > 1.0 && Math.hypot(x - site.x, y - site.y) > 9) { W.ground[t] = G.ROCK; W.stone[t] = 45 + Math.floor(hash2(x, y, seed) * 60); }
  }
  for (let k = 0; k < 4; k++) { // outcrops near (but not on) the settlement
    const a = hash2(seed, k + 20) * 6.28, r = 9 + hash2(seed, k + 30) * 5, ox = Math.round(site.x + Math.cos(a) * r), oy = Math.round(site.y + Math.sin(a) * r);
    for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 0; dx++) { const x = ox + dx, y = oy + dy; if (inb(x, y) && W.ground[idx(x, y)] === G.GRASS) { W.ground[idx(x, y)] = G.ROCK; W.stone[idx(x, y)] = 35 + Math.floor(hash2(x, y, seed + 1) * 40); } }
  }
  // fertility: best beside the water, poor on stone
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const t = idx(x, y); if (W.ground[t] !== G.GRASS) { W.fert[t] = 0; continue; }
    W.fert[t] = clamp(0.22 + 0.3 * fbm(x / 6, y / 6, seed + 40) + Math.max(0, 1 - W.waterDist[t] / 9) * 0.55, 0.05, 1);
  }
  // forest: clustered, with the settlement meadow and the river banks kept open
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const t = idx(x, y); if (W.ground[t] !== G.GRASS) continue;
    const dS = Math.hypot(x - site.x, y - site.y);
    const f = fbm(x / 7 + 10, y / 7, seed + 60) - (dS < 8 ? (8 - dS) * 0.06 : 0) - (W.waterDist[t] <= 1 ? 0.12 : 0) + (hash2(x, y, seed + 7) - 0.5) * 0.07;
    W.tree[t] = f > 0.62 ? 3 : f > 0.56 ? 2 : f > 0.5 ? 1 : 0;
  }
  return W;
}
export const forestSum = W => { let s = 0; for (let i = 0; i < W.tree.length; i++) s += W.tree[i]; return s; };
