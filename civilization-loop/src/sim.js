// Civilization Simulation layer (what happens). DOM-free: runs in Node for tests. One step = one month.
// Everything that happens is written into the persistent world arrays (world.js), so history is never reset.
import { rng, hash2, clamp } from './rng.js';
import { createWorld, forestSum, N, G, idx, inb } from './world.js';
import { BT, TYPES } from './buildings.js';

export const STAGES = ['Foraging Camp', 'Hamlet', 'Village', 'Town'];
export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const seasonOf = m => Math.floor(m / 3);
const FARM_MULT = [0.3, 0.5, 0.8, 1.0, 1.1, 1.2, 1.7, 1.6, 1.2, 0.3, 0.1, 0.1];   // planting, growth, harvest, winter
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

export function createSim(seed = 1) {
  const world = createWorld(seed);
  const S = {
    v: 1, seed, R: rng((seed * 2654435761) ^ 0x9e3779b9), world, t: 0, year: 1, month: 0,
    pop: 10, res: { food: 36, wood: 30, stone: 8 }, cap: { food: 80, wood: 80, stone: 80 },
    buildings: [], log: [], stage: 0, stageDown: 0, stability: 0.7,
    game: 0, gameCap: 1, droughtLeft: 0, boomLeft: 0, foodStress: 0, cutAcc: 0, stoneAcc: 0,
    lastPlague: -999, lastFlood: -999, lastFire: -999, lastDrought: -999,
    gapLeft: 0, civ: { n: 1, start: 1, end: null, peak: 10, status: 'living' }, civs: [],
    unlocked: { farming: false, storage: false, workshop: false, well: false },
    alloc: { farm: 0, gather: 0, wood: 0, stone: 0, build: 0, maint: 0, idle: 0, salvage: 0 },
    sat: { food: 1, water: 1, house: 1, cold: 1 }, flow: { born: 0, died: 0, left: 0, came: 0 },
    center: { x: world.site.x, y: world.site.y }, forest0: forestSum(world), forest: 1,
    cutSite: null, quarrySite: null, salvageSite: null, hist: [], stats: { cut: 0, quarried: 0, floods: 0, fires: 0, droughts: 0, plagues: 0, starved: 0, salvaged: 0, collapsed: 0 },
    last: { kind: '', t: -999 },
  };
  S.game = S.gameCap = gameCapacity(S); S.capHousing = 6;
  const site = findSite(S, 'shelter');
  addBuilding(S, 'shelter', site.x, site.y, true);
  logEv(S, 'start', 'A band of ten settlers makes camp beside the river.');
  recordHist(S);
  return S;
}

// ------------------------------------------------------------------ helpers
export function logEv(S, kind, text) { S.log.push({ year: S.year, month: S.month, kind, text }); if (S.log.length > 600) S.log.shift(); S.last = { kind, t: S.t }; }
const active = (S, type) => S.buildings.filter(b => b.done && !b.ruined && (!type || b.type === type));
const working = (S, type) => S.buildings.filter(b => b.done && !b.ruined && !b.abandoned && b.type === type);
const skinFor = S => S.stage >= 3 ? 2 : S.stage >= 2 ? 1 : 0;
export const forestCover = S => S.forest0 ? clamp(forestSum(S.world) / S.forest0, 0, 1.2) : 0;

function gameCapacity(S) {
  const W = S.world; let f = 0;
  for (let y = Math.max(0, Math.round(S.center.y) - 12); y < Math.min(N, Math.round(S.center.y) + 13); y++) for (let x = Math.max(0, Math.round(S.center.x) - 12); x < Math.min(N, Math.round(S.center.x) + 13); x++) if (W.tree[idx(x, y)] > 0) f++;
  return 14 + 0.45 * f;
}

export function addBuilding(S, type, x, y, done) {
  const W = S.world, d = BT[type];
  const b = { id: S.buildings.length, type, x, y, w: d.w, d: d.d, progress: done ? 1 : 0, done: !!done, cond: 1, built: done ? S.year : null, started: S.year,
    skin: skinFor(S), abandoned: false, empty: 0, occ: 0, fallow: false, idle: 0, ruined: false, ruinedYear: null, reuse: 0, civ: S.civ.n, yield: 0 };
  let ruinTiles = 0;
  for (let j = 0; j < d.d; j++) for (let i = 0; i < d.w; i++) {
    const t = idx(x + i, y + j);
    W.bld[t] = b.id; W.lastBld[t] = b.id;
    if (W.tree[t] > 0) { W.tree[t] = 0; W.clearedYear[t] = S.year; }
    if (W.ruin[t]) { ruinTiles += W.ruin[t] === 2 ? 1 : 0.6; W.ruin[t] = 0; W.ruinWood[t] = W.ruinStone[t] = 0; }
    if (type === 'farm') { W.farmed[t] = 1; W.farmedYear[t] = S.year; }
  }
  b.reuse = ruinTiles / (d.w * d.d);
  S.buildings.push(b); return b;
}

function canPlace(S, x, y, w, d, type) {
  const W = S.world;
  if (x < 1 || y < 1 || x + w > N - 1 || y + d > N - 1) return false;
  for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) {
    const t = idx(x + i, y + j);
    if (W.ground[t] !== G.GRASS || W.bld[t] >= 0) return false;
    if (W.tree[t] > (type === 'farm' ? 0 : 1)) return false;
    if (type === 'farm' && (W.road[t] || W.ruin[t])) return false;
  }
  return true;
}
function siteScore(S, type, x, y) {
  const W = S.world, bt = BT[type], n = bt.w * bt.d; let fert = 0, flood = 0, road = 0, ruin = 0, wd = 99, farmed = 0;
  for (let j = 0; j < bt.d; j++) for (let i = 0; i < bt.w; i++) { const t = idx(x + i, y + j); fert += W.fert[t] * W.soil[t]; flood += W.flood[t]; road += W.road[t] ? 1 : 0; ruin += W.ruin[t] ? 1 : 0; wd = Math.min(wd, W.waterDist[t]); farmed += W.farmed[t] ? 1 : 0; }
  fert /= n; flood /= n; road /= n; ruin /= n; farmed /= n;
  const dc = dist(x + bt.w / 2, y + bt.d / 2, S.center.x, S.center.y);
  let s = hash2(x, y, S.seed) * 0.8;
  if (type === 'farm') s += -dc * 0.45 + fert * 14 + (wd <= 4 ? 2 : 0) + farmed * 1.5;
  else if (type === 'well') { s += -dc * 0.8 + (wd > 4 ? 3 : -4); for (const o of S.buildings) if (o.type === 'well' && !o.ruined && dist(o.x, o.y, x, y) < 6) s -= 6; }
  else { s += -dc + road * 3 + ruin * 3 - flood * 6; if (bt.dwelling) s += (wd <= 5 ? 2 : 0) - (wd <= 1 ? 3 : 0); }
  if (type !== 'farm') { let adj = 0; for (let j = -1; j <= bt.d; j++) for (let i = -1; i <= bt.w; i++) { if (i >= 0 && j >= 0 && i < bt.w && j < bt.d) continue; if (inb(x + i, y + j) && W.bld[idx(x + i, y + j)] >= 0) adj++; } s -= adj * 0.35; }   // leave lanes between buildings: paths wear in there
  return s;
}
export function findSite(S, type) {
  const bt = BT[type], R = Math.min(24, 5 + Math.sqrt(S.pop) * 1.4 + S.buildings.length * 0.12);
  let best = null, bs = -1e9;
  for (let pass = 0; pass < 2 && !best; pass++) {
    const r = pass ? 26 : R;
    for (let y = Math.floor(S.center.y - r); y <= S.center.y + r; y++) for (let x = Math.floor(S.center.x - r); x <= S.center.x + r; x++) {
      if (!inb(x, y) || !canPlace(S, x, y, bt.w, bt.d, type)) continue;
      const s = siteScore(S, type, x, y); if (s > bs) { bs = s; best = { x, y }; }
    }
  }
  return best;
}

// ------------------------------------------------------------------ the monthly step
export function step(S) {
  S.t++; S.month = S.t % 12; S.year = Math.floor(S.t / 12) + 1;
  S.flow = { born: 0, died: 0, left: 0, came: 0 };
  if (S.civ.status === 'living') economy(S);
  decay(S);
  S.game = clamp(S.game + (S.gameCap - S.game) * 0.03, 0, S.gameCap * 1.2);
  if (S.droughtLeft > 0) S.droughtLeft--; if (S.boomLeft > 0) S.boomLeft--;
  events(S);
  if (S.month === 0) annual(S);
  if (S.civ.status === 'living' && S.pop <= 0.5) endCivilization(S);
  else if (S.civ.status === 'gap') { S.gapLeft--; if (S.gapLeft <= 0) newcomers(S); }
  if (S.pop > S.civ.peak) S.civ.peak = S.pop;
  if (S.month === 0) recordHist(S);
}
export function runMonths(S, n) { for (let i = 0; i < n; i++) step(S); return S; }
export function runYears(S, y) { return runMonths(S, y * 12); }

function economy(S) {
  const W = S.world, m = S.month, season = seasonOf(m), pop = S.pop;
  // ---- housing and occupancy
  const dw = active(S).filter(b => BT[b.type].dwelling).sort((a, b) => dist(a.x, a.y, S.center.x, S.center.y) - dist(b.x, b.y, S.center.x, S.center.y) || a.id - b.id);
  let capH = 0, left = pop, selfWatered = 0;
  for (const b of dw) {
    const c = BT[b.type].cap * (b.cond < 0.3 ? 0.6 : 1); capH += c; b.occ = Math.min(c, left); left -= b.occ;
    if (b.occ > 0) { b.empty = 0; b.abandoned = false; if (W.waterDist[idx(b.x, b.y)] <= 5) selfWatered += b.occ; } else { b.empty++; if (b.empty >= 6) b.abandoned = true; }
  }
  const nWells = working(S, 'well').length;
  S.capHousing = capH;
  S.sat.house = pop > 0 ? clamp(capH / pop, 0, 1) : 1;
  S.sat.water = pop > 0 ? clamp((selfWatered + nWells * 25) / pop, 0, 1) : 1;
  // ---- who works where
  allocate(S);
  const A = S.alloc, nW = working(S, 'workshop').length, tool = 1 + 0.15 * Math.min(3, nW);
  const dr = S.droughtLeft > 0 ? 0.45 : 1, boom = S.boomLeft > 0 ? 1.3 : 1;
  // ---- production
  const farms = active(S, 'farm').filter(b => !b.abandoned);
  let farmFood = 0; const farmers = farms.filter(b => !b.fallow);
  for (const f of farms) {
    let fs = 0; const tiles = []; for (let j = 0; j < f.d; j++) for (let i = 0; i < f.w; i++) tiles.push(idx(f.x + i, f.y + j));
    for (const t of tiles) fs += W.fert[t] * W.soil[t]; fs /= tiles.length;
    if (f.fallow) { for (const t of tiles) W.soil[t] = Math.min(1, W.soil[t] + 0.0035); if (fs > 0.78 * 0.9 || tiles.every(t => W.soil[t] > 0.8)) f.fallow = false; f.yield = 0; continue; }
    const per = A.farm / Math.max(1, farmers.length), eff = Math.min(1, per / 3);
    f.yield = 7.0 * fs * FARM_MULT[m] * eff * tool * dr * boom; farmFood += f.yield;
    if (eff > 0) for (const t of tiles) { W.soil[t] = Math.max(0.2, W.soil[t] - 0.0022 * eff); W.farmed[t] = 1; W.farmedYear[t] = S.year; }
    if (S.stage >= 1 && tiles.every(t => W.soil[t] < 0.5) ) f.fallow = true;   // rotation: rest worn-out fields
  }
  for (const f of active(S, 'farm')) { if (f.abandoned || f.fallow) continue; f.idle = (A.farm / Math.max(1, farmers.length)) < 0.5 ? f.idle + 1 : 0; if (f.idle >= 18) f.abandoned = true; }
  S.gameCap = gameCapacity(S); const gf = S.gameCap > 0 ? S.game / S.gameCap : 0;
  const fishing = W.waterDist[idx(Math.round(S.center.x), Math.round(S.center.y))] <= 8 ? 0.35 : 0;
  const take = A.gather * 0.4 * gf; S.game = Math.max(0, S.game - take);
  const wildFood = A.gather * (fishing + 0.9 * gf);
  S.res.food += farmFood + wildFood;
  // logging (trees are really removed: forests stay depleted)
  const woodOut = A.wood * 3.2 * tool; S.cutAcc += woodOut / 6; let cut = 0;
  while (S.cutAcc >= 1) { const t = nearestTile(S, t2 => W.tree[t2] > 0 && W.bld[t2] < 0, 0.8); if (t < 0) { S.cutAcc = 0; S.res.wood += Math.min(3, A.wood * 0.7); break; } cut++; S.cutAcc--; W.tree[t]--; if (W.tree[t] === 0) W.clearedYear[t] = S.year; S.cutSite = { x: t % N, y: Math.floor(t / N) }; S.stats.cut++; }
  S.res.wood += cut * 6;
  // quarrying (stone is finite)
  S.stoneAcc += A.stone * 2.2 * tool; let q = Math.floor(S.stoneAcc); S.stoneAcc -= q;
  while (q > 0) { const t = nearestTile(S, t2 => W.ground[t2] === G.ROCK && W.stone[t2] > 0, 0.3); if (t < 0) { S.stoneAcc = 0; break; } const k = Math.min(q, W.stone[t]); W.stone[t] -= k; q -= k; S.res.stone += k; S.stats.quarried += k; S.quarrySite = { x: t % N, y: Math.floor(t / N) }; if (W.stone[t] === 0) W.quarried[t] = 1; }
  // salvage from ruins (inheritance): old stone and timber are reused
  if (A.salvage > 0) {
    const t = nearestTile(S, t2 => W.ruin[t2] === 1 && (W.ruinWood[t2] > 0 || W.ruinStone[t2] > 0), 0.5);
    if (t >= 0) { const sw = S.res.stone < 14 ? 'stone' : 'wood'; let got = 0;
      for (const k of [sw, sw === 'stone' ? 'wood' : 'stone']) { const arr = k === 'stone' ? W.ruinStone : W.ruinWood, g = Math.min(arr[t], 5 * A.salvage); arr[t] -= g; S.res[k] += g; got += g; if (got > 0) break; }
      S.stats.salvaged += got; S.salvageSite = { x: t % N, y: Math.floor(t / N) };
      if (W.ruinWood[t] <= 0.01 && W.ruinStone[t] <= 0.01) { W.ruin[t] = 2; if (S.stats.salvaged > 0 && hash2(t, S.year) < 0.2) logEv(S, 'salvage', 'Settlers strip the stone and timber from the old ruins to build anew.'); } }
  }
  // ---- consumption and storage
  const winter = season === 3, heat = winter ? pop * 0.07 : 0;
  const eat = Math.min(S.res.food, pop * 0.5), foodSat = pop > 0 ? clamp(eat / (pop * 0.5), 0, 1) : 1;
  S.res.food -= eat; S.sat.food = foodSat;
  const heated = Math.min(S.res.wood, heat); S.res.wood -= heated; S.sat.cold = heat > 0 ? clamp(heated / heat, 0, 1) : 1;
  const st = working(S, 'storage').length; S.cap = { food: 80 + 140 * st, wood: 80 + 160 * st, stone: 80 + 200 * st };
  S.res.food *= 1 - 0.025 * (1 - Math.min(0.85, st * 0.3));   // spoilage
  for (const k of ['food', 'wood', 'stone']) S.res[k] = clamp(S.res[k], 0, S.cap[k]);
  S.foodStress = foodSat < 0.95 ? S.foodStress + 1 : Math.max(0, S.foodStress - 1);
  // ---- construction, maintenance, roads
  construct(S); maintain(S); roads(S);
  for (const k of ['food', 'wood', 'stone']) S.res[k] = Math.max(0, S.res[k]);   // (floating-point dust)
  // ---- people
  const crowd = capH > 0 ? pop / capH : 2, homeless = Math.max(0, pop - capH);
  let births = 0; if (foodSat > 0.85) births = pop * 0.0046 * (0.4 + S.stability) * clamp((capH * 1.05 - pop) / (capH * 0.1 + 2), 0, 1);
  let deaths = pop * 0.0022 + pop * 0.05 * Math.pow(1 - foodSat, 1.2) + (winter ? homeless * 0.02 + pop * 0.03 * (1 - S.sat.cold) : 0) + pop * 0.0004 * (1 + (1 - S.sat.water) * 5 + Math.max(0, crowd - 1) * 2);
  let leave = S.stability < 0.35 ? pop * 0.01 * (0.35 - S.stability) / 0.35 : 0;
  if (foodSat < 0.5) S.stats.starved += pop * 0.05 * Math.pow(1 - foodSat, 1.2);
  let came = 0;
  if (S.stability > 0.65 && capH - pop >= 3 && S.stage >= 1 && S.R() < 0.012) { came = 2 + Math.floor(S.R() * 4); logEv(S, 'migrate', `${came} newcomers arrive and join the settlement.`); }
  S.pop = Math.max(0, pop + births - deaths - leave + came); S.flow = { born: births, died: deaths, left: leave, came };
  // ---- stability follows conditions
  const recent = Math.max(0, 1 - (S.t - Math.max(S.lastPlague, S.lastFlood, S.lastFire, S.lastDrought)) / 120);
  const target = clamp(0.1 + 0.35 * foodSat + 0.2 * S.sat.water + 0.2 * S.sat.house + 0.1 * S.sat.cold + (S.stage >= 2 ? 0.08 : 0) - 0.25 * recent, 0, 1);
  S.stability += (target - S.stability) * 0.15;
  // ---- condition-driven progress
  unlocks(S); plan(S); evaluateStage(S);
}

// workers go where the settlement's needs are
function allocate(S) {
  const pop = S.pop, W = Math.floor(pop * 0.65), A = { farm: 0, gather: 0, wood: 0, stone: 0, build: 0, maint: 0, idle: 0, salvage: 0 };
  const farms = active(S, 'farm').filter(b => !b.abandoned && !b.fallow), projects = S.buildings.filter(b => !b.done && !b.ruined);
  let w = W; const take = n => { const k = Math.max(0, Math.min(w, n)); w -= k; return k; };
  const gf = S.gameCap > 0 ? S.game / S.gameCap : 0, eff = 0.35 + 0.9 * gf, foodNeed = pop * 0.5;
  const farmExp = farms.reduce((a, f) => a + Math.max(f.yield, 0), 0) * 0.9;
  const gWant = Math.ceil(Math.max(0, foodNeed * (S.res.food < pop * 4 ? 1.35 : 0.6) - farmExp) / Math.max(0.2, eff));
  const hungry = S.res.food < pop * 1.5, lWant = S.res.wood < 26 + pop * 1.0 ? Math.max(1, Math.ceil(W * 0.25)) : 0;
  A.build = take(projects.length ? 1 : 0);                         // someone always keeps building, even in a hungry year
  A.wood = take(hungry ? Math.min(1, lWant) : lWant);               // and someone always fetches timber
  if (pop >= 8) A.maint = take(Math.ceil(active(S).length / 14));
  A.farm = take(farms.length * 3);
  A.gather = take(gWant);
  A.wood += take(lWant - A.wood);
  A.build += take(projects.length * 3 - A.build);
  const pend = projects.reduce((a, b) => ({ wood: a.wood + BT[b.type].cost.wood * (1 - b.progress), stone: a.stone + BT[b.type].cost.stone * (1 - b.progress) }), { wood: 0, stone: 0 });
  const needW = S.res.wood < 30 + pop * 1.5 + pend.wood, needS = S.res.stone < 14 + pop * 0.4 + pend.stone;
  if (needS && S.res.stone < 14 && S.world.ruin.some(v => v === 1) && w > 0) A.salvage = take(1);
  if (needW && needS) { const x = Math.ceil(w * 0.6); A.wood += x; A.stone += w - x; } else if (needW) A.wood += w; else if (needS) A.stone += w; else A.idle = w;
  S.alloc = A;
}

function construct(S) {
  const W = S.world, A = S.alloc, projects = S.buildings.filter(b => !b.done && !b.ruined); if (!projects.length) return;
  const share = A.build / projects.length;
  for (const b of projects) {
    const d = BT[b.type], mult = 1 - 0.4 * b.reuse;
    let dp = Math.min(share / d.work, 1 - b.progress);
    const needW = d.cost.wood * mult * dp, needS = d.cost.stone * mult * dp;
    const k = Math.min(1, needW > 0 ? S.res.wood / needW : 1, needS > 0 ? S.res.stone / needS : 1); dp *= k;
    S.res.wood -= d.cost.wood * mult * dp; S.res.stone -= d.cost.stone * mult * dp; b.progress += dp;
    if (b.progress >= 0.999) { b.progress = 1; b.done = true; b.built = S.year; b.skin = skinFor(S); S.last = { kind: 'build', t: S.t };
      if (b.type !== 'shelter' || S.buildings.length > 3) logEv(S, 'build', `A ${d.name.toLowerCase()} is completed${b.reuse > 0 ? ' on the foundations of an older building' : ''}.`); }
  }
}
function maintain(S) {
  const m = S.alloc.maint; if (m <= 0) return;
  let worst = null; for (const b of active(S)) if (!b.abandoned && b.cond < 0.97 && (!worst || b.cond < worst.cond)) worst = b;
  if (worst) { const w = Math.min(S.res.wood, 0.4 * m); if (w > 0) { worst.cond = Math.min(1, worst.cond + 0.05 * m * (w / (0.4 * m))); S.res.wood -= w; } }
}
function roads(S) {
  const W = S.world, hub = nearestOf(S, 'storage') || S.center;
  for (const b of active(S)) {
    if (b.abandoned || b.occ <= 0 && b.type !== 'farm' && b.type !== 'workshop') continue;
    const traffic = b.type === 'farm' ? 0.3 : 0.05 * Math.max(1, b.occ || 3);
    const x0 = b.x + (b.w >> 1), y0 = b.y + b.d, x1 = Math.round(hub.x), y1 = Math.round(hub.y), n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / (n || 1)), y = Math.round(y0 + (y1 - y0) * i / (n || 1)); if (!inb(x, y)) continue; const t = idx(x, y);
      if (W.ground[t] !== G.GRASS || W.bld[t] >= 0) continue;
      W.wear[t] += traffic; W.roadUsed[t] = S.year;
      if (W.wear[t] > 3 && !W.road[t]) W.road[t] = 1; if (W.wear[t] > 14 && S.stage >= 2) W.road[t] = 2;
    }
  }
}
function nearestOf(S, type) { let best = null, bd = 1e9; for (const b of active(S, type)) { const d = dist(b.x, b.y, S.center.x, S.center.y); if (d < bd) { bd = d; best = b; } } return best; }
function nearestTile(S, pred, noise) {
  const W = S.world; let best = -1, bd = 1e9;
  for (let t = 0; t < N * N; t++) { if (!pred(t)) continue; const x = t % N, y = (t / N) | 0, d = dist(x, y, S.center.x, S.center.y) + hash2(t, S.t >> 3) * 3 * noise; if (d < bd) { bd = d; best = t; } }
  return best;
}

function decay(S) {
  const W = S.world, winter = seasonOf(S.month) === 3 ? 1.3 : 1;
  for (const b of S.buildings) {
    if (b.ruined || !b.done) continue;
    if (b.type !== 'farm' && S.pop < 8 && b.type !== 'shelter' && b.type !== 'house') b.abandoned = true;
    const base = 0.0022 * (b.type === 'shelter' ? 2.2 : 1) * (b.skin === 2 ? 0.6 : b.skin === 1 ? 0.8 : 1) * (b.abandoned ? 3 : 1) * winter;
    b.cond -= base; if (b.cond <= 0) collapse(S, b);
  }
}
function collapse(S, b) {
  const W = S.world, d = BT[b.type], kind = TYPES.indexOf(b.type) + 1; b.ruined = true; b.ruinedYear = S.year; S.stats.collapsed++;
  for (let j = 0; j < b.d; j++) for (let i = 0; i < b.w; i++) {
    const t = idx(b.x + i, b.y + j); W.bld[t] = -1;
    if (b.type === 'farm') { W.farmed[t] = 2; continue; }
    W.ruin[t] = 1; W.ruinKind[t] = kind; W.ruinYear[t] = S.year; W.ruinWood[t] = d.cost.wood * 0.22 / (b.w * b.d) * 3; W.ruinStone[t] = Math.max(0.5, d.cost.stone * 0.55 / (b.w * b.d) * 3);
  }
  const prev = S.log[S.log.length - 1];   // several collapses in one year read as a single chronicle entry
  if (prev && prev.kind === 'ruin' && prev.year === S.year) { prev.n = (prev.n || 1) + 1; prev.text = `${prev.n} buildings collapse and become ruins.`; }
  else logEv(S, 'ruin', `${b.abandoned ? 'An abandoned' : 'A'} ${d.name.toLowerCase()} collapses and becomes a ruin.`);
}

// ------------------------------------------------------------------ development decisions (conditions, not elapsed time)
function unlocks(S) {
  const U = S.unlocked, pop = S.pop, W = S.world, ruinKinds = new Set(); for (let t = 0; t < N * N; t++) if (W.ruin[t]) ruinKinds.add(W.ruinKind[t]);
  const had = k => S.buildings.some(b => b.type === k && !b.ruined) || ruinKinds.has(TYPES.indexOf(k) + 1);
  if (!U.farming && (S.foodStress >= 4 || pop >= 14 || W.farmed.some(v => v))) { U.farming = true; logEv(S, 'tech', 'The settlers begin to plant crops on the fertile ground by the river.'); }
  if (!U.storage && U.farming && (pop >= 18 || had('storage'))) { U.storage = true; logEv(S, 'tech', 'Surplus grain needs a place to keep dry: storehouses will be built.'); }
  if (!U.workshop && pop >= 24 && S.stage >= 1) { U.workshop = true; logEv(S, 'tech', 'Skilled hands set up a workshop for tools.'); }
  if (!U.well && (pop >= 22 || S.t - S.lastPlague < 240 || had('well'))) { U.well = true; logEv(S, 'tech', S.t - S.lastPlague < 240 ? 'After the sickness, the village digs wells for clean water.' : 'The settlement digs its first well.'); }
}
function plan(S) {
  const projects = S.buildings.filter(b => !b.done && !b.ruined).length, maxProj = 1 + (S.stage >= 1 ? 1 : 0) + (S.stage >= 2 ? 1 : 0);
  if (projects >= maxProj || S.pop < 3) return;
  const U = S.unlocked, pop = S.pop, cnt = t => active(S, t).filter(b => !b.abandoned).length + S.buildings.filter(b => b.type === t && !b.done && !b.ruined).length;
  const pending = S.buildings.filter(b => !b.done && !b.ruined && BT[b.type].dwelling).reduce((a, b) => a + BT[b.type].cap, 0);
  const slack = (S.capHousing || 0) + pending - pop * 1.12, needs = [];
  if (slack < 0) needs.push([U.farming || pop >= 12 ? 'house' : 'shelter', 90 - slack * 3]);
  if (U.farming) { const fs = active(S, 'farm').filter(b => !b.abandoned); const prod = fs.reduce((a, f) => a + 7 * 0.75 * 0.83, 0) * 0.8 + (S.gameCap ? 2 : 0); const want = Math.ceil(pop * 0.5 * 1.25 / 4.2); if (cnt('farm') < want) needs.push(['farm', 80 + (want - cnt('farm')) * 2 + (S.foodStress >= 3 ? 50 : 0) + (S.res.food < pop * 2 ? 30 : 0)]); }
  if (U.storage && cnt('storage') < Math.floor(pop / 40) + 1) needs.push(['storage', 55]);
  if (U.well) { const unwatered = pop * (1 - S.sat.water); if (unwatered > 3 || (S.t - S.lastPlague < 240 && cnt('well') < 2)) needs.push(['well', 70]); }
  if (U.workshop && cnt('workshop') < Math.min(3, Math.floor(pop / 45) + 1)) needs.push(['workshop', 45]);
  needs.sort((a, b) => b[1] - a[1]);
  for (const [type] of needs) {
    const c = BT[type].cost; if (S.res.wood < c.wood * 0.3 || S.res.stone < c.stone * 0.3) continue;
    const site = findSite(S, type); if (!site) continue;
    addBuilding(S, type, site.x, site.y, false); return;
  }
}
function evaluateStage(S) {
  const c = t => active(S, t).length, houses = active(S).filter(b => BT[b.type].dwelling && b.type === 'house').length, pop = S.pop;
  let s = 0;
  if (pop >= 14 && (c('farm') >= 1 || houses >= 1)) s = 1;
  if (pop >= 35 && houses >= 4 && c('workshop') >= 1 && c('storage') >= 1) s = 2;
  if (pop >= 80 && houses >= 8 && c('workshop') >= 2 && c('well') >= 2 && c('storage') >= 2) s = 3;
  if (s > S.stage) { S.stage = s; S.stageDown = 0; logEv(S, 'stage', `The settlement has grown into a ${STAGES[s].toLowerCase()}.`); }
  else if (s < S.stage) { if (++S.stageDown > 24) { S.stage = s; S.stageDown = 0; logEv(S, 'stage', `The settlement shrinks back to a ${STAGES[s].toLowerCase()}.`); } } else S.stageDown = 0;
}

// ------------------------------------------------------------------ disasters and other events (probabilities depend on conditions)
function events(S) {
  const W = S.world, m = S.month, season = seasonOf(m), R = S.R, cover = forestCover(S), pop = S.pop;
  if (S.droughtLeft <= 0 && season >= 1 && season <= 2 && R() < 0.0028 * (1 + 2.2 * (1 - cover))) {
    S.droughtLeft = 12 + Math.floor(R() * 18); S.lastDrought = S.t; S.stats.droughts++;
    logEv(S, 'drought', `A drought grips the land${cover < 0.6 ? ' (the felled forests no longer hold the rain)' : ''}. Harvests will fail.`);
    if (pop > 0) S.stability = Math.max(0, S.stability - 0.08);
  }
  if (season <= 1 && R() < 0.0028 * (1 + 2.6 * (1 - cover))) flood(S);
  if (R() < 0.001 * (season === 1 ? 2.5 : season === 2 ? 1.3 : 0.4) * (S.droughtLeft > 0 ? 2.5 : 1) * Math.min(2, 0.5 + treesNear(S, 10) / 40)) wildfire(S);
  if (pop > 25 && R() < 0.0018 * (1 + 4 * (1 - S.sat.water) + 2 * Math.max(0, pop / Math.max(1, S.capHousing || 1) - 1))) plague(S);
  if (S.boomLeft <= 0 && season === 0 && R() < 0.003) { S.boomLeft = 12; logEv(S, 'good', 'Good rains: the fields promise a bountiful year.'); }
}
function treesNear(S, r) { const W = S.world; let n = 0; for (let y = Math.max(0, Math.round(S.center.y) - r); y < Math.min(N, Math.round(S.center.y) + r); y++) for (let x = Math.max(0, Math.round(S.center.x) - r); x < Math.min(N, Math.round(S.center.x) + r); x++) if (W.tree[idx(x, y)] > 0) n++; return n; }
function flood(S) {
  const W = S.world; S.lastFlood = S.t; S.stats.floods++; let hit = 0, damaged = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const t = idx(x, y); if (W.ground[t] === G.GRASS && W.waterDist[t] <= 2) { W.flood[t] = Math.min(255, W.flood[t] + 1); W.soil[t] = Math.min(1, W.soil[t] + 0.15); W.fert[t] = Math.min(1, W.fert[t] + 0.01); hit++; } }
  for (const b of S.buildings) if (b.done && !b.ruined && W.waterDist[idx(b.x, b.y)] <= 2) { b.cond -= 0.45; damaged++; if (b.cond <= 0) collapse(S, b); }
  S.stability = Math.max(0, S.stability - 0.1);
  logEv(S, 'flood', `The river floods its banks${damaged ? `, damaging ${damaged} building${damaged > 1 ? 's' : ''}` : ''}. The silt will enrich the soil — and the settlers will remember where the water reached.`);
}
function wildfire(S) {
  const W = S.world; let best = -1, bd = 1e9;
  for (let t = 0; t < N * N; t++) if (W.tree[t] > 0) { const d = dist(t % N, (t / N) | 0, S.center.x, S.center.y) + S.R() * 8; if (d < bd) { bd = d; best = t; } }
  if (best < 0) return; S.lastFire = S.t; S.stats.fires++;
  const limit = 10 + Math.floor(S.R() * 35), q = [best], seen = new Set([best]); let burned = 0;
  while (q.length && burned < limit) {
    const t = q.shift(); W.tree[t] = 0; W.burnt[t] = 15; W.burntYear[t] = S.year; W.clearedYear[t] = S.year; burned++;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = (t % N) + dx, y = ((t / N) | 0) + dy; if (!inb(x, y)) continue; const u = idx(x, y); if (!seen.has(u) && W.tree[u] > 0 && S.R() < 0.6) { seen.add(u); q.push(u); } }
  }
  let dmg = 0; for (const b of S.buildings) if (b.done && !b.ruined) { let near = false; for (let j = -1; j <= b.d && !near; j++) for (let i = -1; i <= b.w; i++) { const x = b.x + i, y = b.y + j; if (inb(x, y) && W.burnt[idx(x, y)] === 15) { near = true; break; } } if (near) { b.cond -= 0.55; dmg++; if (b.cond <= 0) collapse(S, b); } }
  S.game *= 0.6; S.pop *= 0.99; S.stability = Math.max(0, S.stability - 0.06);
  logEv(S, 'fire', `A wildfire sweeps the forest, scorching ${burned} tiles${dmg ? ` and damaging ${dmg} building${dmg > 1 ? 's' : ''}` : ''}.`);
}
function plague(S) {
  S.lastPlague = S.t; S.stats.plagues++; const k = 0.1 + S.R() * 0.2, dead = S.pop * k; S.pop -= dead; S.stability = Math.max(0, S.stability - 0.15);
  logEv(S, 'plague', `Sickness spreads through the crowded, thirsty settlement; ${Math.round(dead)} people die.`);
}

// ------------------------------------------------------------------ the yearly environment (forests regrow slowly; the land keeps its scars)
function annual(S) {
  const W = S.world, R = S.R;
  const settled = new Uint8Array(N * N); for (const b of S.buildings) if (b.done && !b.ruined) for (let j = -2; j < b.d + 2; j++) for (let i = -2; i < b.w + 2; i++) if (inb(b.x + i, b.y + j)) settled[idx(b.x + i, b.y + j)] = 1;
  const next = W.tree.slice();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const t = idx(x, y);
    if (W.burnt[t] > 0) W.burnt[t]--;
    if (W.ground[t] !== G.GRASS) continue;
    if (W.ruin[t]) { if (W.ruin[t] === 1 && S.year - W.ruinYear[t] > 150 && W.ruinWood[t] < 0.5) { /* old rubble is slowly worn away */ } }
    if (W.bld[t] >= 0 || W.road[t] || settled[t] || W.burnt[t] > 0) continue;
    if (W.farmed[t] === 2 || (W.farmed[t] === 1 && W.bld[t] < 0)) W.soil[t] = Math.min(1, W.soil[t] + 0.03);
    let nb = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inb(x + dx, y + dy)) nb = Math.max(nb, W.tree[idx(x + dx, y + dy)]);
    const age = S.year - W.clearedYear[t];
    if (W.tree[t] === 0 && age >= 25 && ((nb >= 2 && R() < 0.05) || R() < 0.004)) next[t] = 1;    // seedlings spread from neighbours, and by wind from afar
    else if (W.tree[t] > 0 && W.tree[t] < 3 && R() < 0.02) next[t] = W.tree[t] + 1;
    else if (W.tree[t] === 0 && W.farmed[t] === 2 && nb >= 1 && age >= 25 && R() < 0.04) next[t] = 1;    // abandoned fields turn to woodland
  }
  W.tree.set(next);
  for (let t = 0; t < N * N; t++) if (W.ruin[t] === 1) { /* ruin age used for display only */ }
  // the centre of the settlement follows where people actually live
  const act = active(S).filter(b => !b.abandoned && (BT[b.type].dwelling || b.type === 'storage'));
  if (act.length) { let sx = 0, sy = 0; for (const b of act) { sx += b.x + b.w / 2; sy += b.y + b.d / 2; } S.center = { x: sx / act.length, y: sy / act.length }; }
  S.forest = forestCover(S);
}

// ------------------------------------------------------------------ the end of a civilization and the arrival of the next
function endCivilization(S) {
  S.pop = 0; S.civ.status = 'gap'; S.civ.end = S.year; S.civs.push({ ...S.civ });
  S.gapLeft = 12 * (20 + Math.floor(S.R() * 40)); S.stage = 0;
  for (const b of S.buildings) if (b.done && !b.ruined) b.abandoned = true;
  logEv(S, 'end', `The last villagers leave. After ${S.year - S.civ.start} years, the settlement falls silent.`);
}
function newcomers(S) {
  const W = S.world, n = S.civ.n + 1;
  let ruins = 0; for (let t = 0; t < N * N; t++) if (W.ruin[t]) ruins++;
  S.civ = { n, start: S.year, end: null, peak: 0, status: 'living' }; S.pop = 8 + Math.floor(S.R() * 5); S.stability = 0.6; S.stage = 0; S.stageDown = 0; S.foodStress = 0;
  S.res = { food: 22, wood: 24, stone: 4 }; S.droughtLeft = 0;
  // they settle near the most substantial remains, if there are any
  let best = null, bd = -1; for (const b of S.buildings) if (b.ruined || b.done) { const v = b.type === 'farm' ? 1 : 2 + BT[b.type].cost.stone * 0.1; if (v > bd) { bd = v; best = b; } }
  if (best) S.center = { x: best.x + best.w / 2, y: best.y + best.d / 2 }; else S.center = { x: W.site.x, y: W.site.y };
  logEv(S, 'newcomers', `A new people arrives (civilization ${n}). ${ruins > 0 ? `They find the old ruins and fields and build among them.` : 'The land is empty.'}`);
  S.unlocked = { farming: false, storage: false, workshop: false, well: false };
  S.game = Math.min(S.game, S.gameCap);
  const site = findSite(S, 'shelter'); if (site) addBuilding(S, 'shelter', site.x, site.y, true);
}

// ------------------------------------------------------------------ summaries for the UI, tests and saves
export function recordHist(S) { S.hist.push({ year: S.year, pop: Math.round(S.pop), food: Math.round(S.res.food), forest: +forestCover(S).toFixed(2), stage: S.stage, civ: S.civ.n }); if (S.hist.length > 2000) S.hist.shift(); }
export function summary(S) {
  const live = active(S), pop = Math.floor(S.pop);
  let status = S.civ.status === 'gap' ? 'Abandoned' : STAGES[S.stage];
  const h = S.hist, past = h[Math.max(0, h.length - 21)];
  if (S.civ.status === 'living' && past && S.stage >= 1 && S.pop < past.pop * 0.7 && S.year - past.year >= 10) status += ' (declining)';
  return { year: S.year, month: S.month, season: SEASONS[seasonOf(S.month)], pop, stage: S.stage, status, civ: S.civ.n, res: { food: Math.floor(S.res.food), wood: Math.floor(S.res.wood), stone: Math.floor(S.res.stone) }, cap: S.cap,
    stability: S.stability, water: S.sat.water, housing: S.capHousing || 0, forest: forestCover(S), buildings: live.length, ruins: S.buildings.filter(b => b.ruined).length, droughtLeft: S.droughtLeft };
}
export function describeTile(S, x, y) {
  const W = S.world, t = idx(x, y), L = [], nm = ['Grass', 'Water', 'Rock'][W.ground[t]];
  L.push(`${nm} (${x}, ${y})`);
  if (W.ground[t] === G.WATER) return L;
  L.push(`Fertility ${(W.fert[t] * 100) | 0}%, soil health ${(W.soil[t] * 100) | 0}%`);
  if (W.tree[t]) L.push(`Forest, canopy ${W.tree[t]}/3`);
  if (W.ground[t] === G.ROCK) L.push(W.quarried[t] ? 'A quarry pit: the stone is worked out' : `Stone remaining: ${W.stone[t]}`);
  if (W.clearedYear[t] > -9000) L.push(`Trees last cleared in year ${W.clearedYear[t]}`);
  if (W.burntYear[t] > -9000) L.push(`Scorched by wildfire in year ${W.burntYear[t]}`);
  if (W.flood[t]) L.push(`Reached by floods ${W.flood[t]} time${W.flood[t] > 1 ? 's' : ''}`);
  if (W.farmed[t]) L.push(W.farmed[t] === 2 ? `Abandoned field (last farmed year ${W.farmedYear[t]})` : `Field, farmed since year ${W.farmedYear[t]}`);
  if (W.road[t]) L.push(W.road[t] === 2 ? 'Packed road' : 'Worn dirt path');
  const b = W.bld[t] >= 0 ? S.buildings[W.bld[t]] : null;
  if (b) L.push(`${BT[b.type].name}${b.done ? '' : ' (under construction ' + Math.round(b.progress * 100) + '%)'}, built year ${b.built ?? b.started}, condition ${(b.cond * 100) | 0}%${b.abandoned ? ', abandoned' : ''}`);
  else if (W.lastBld[t] >= 0) { const o = S.buildings[W.lastBld[t]]; if (o && o.ruined) L.push(`${W.ruin[t] === 2 ? 'Foundations' : 'Ruins'} of a ${BT[o.type].name.toLowerCase()} (civilization ${o.civ}, built year ${o.built}, fell year ${o.ruinedYear})`); }
  return L;
}
export function stateHash(S) { let h = 2166136261; const mix = v => { h ^= v | 0; h = Math.imul(h, 16777619) >>> 0; }; mix(S.t); mix(S.pop * 1000); mix(S.res.food * 100); mix(S.res.wood * 100); mix(S.res.stone * 100); mix(S.buildings.length); for (const k of ['tree', 'road', 'farmed', 'bld', 'ruin']) { const a = S.world[k]; for (let i = 0; i < a.length; i += 3) mix(a[i]); } return h >>> 0; }
export function serialize(S) {
  const W = S.world, w = {}; for (const k of Object.keys(W)) w[k] = ArrayBuffer.isView(W[k]) ? Array.from(W[k]) : W[k];
  return JSON.stringify({ ...S, R: S.R.get(), world: w });
}
export function deserialize(json) {
  const o = JSON.parse(json), proto = createWorld(o.seed), W = {};
  for (const k of Object.keys(proto)) W[k] = ArrayBuffer.isView(proto[k]) ? proto[k].constructor.from(o.world[k]) : o.world[k];
  const S = { ...o, world: W, R: rng(1) }; S.R.set(o.R); return S;
}
