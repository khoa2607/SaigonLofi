'use strict';
// ===== Holdfast — visible work: crop plots that really grow, stores that fill and empty, hauling, cooking, fishing catches,
// builders' materials, guard responses. No DOM, no canvas: the renderer only reads HS.plots / HS.store / HS.storeAt. =====
// Every job has a beginning (fetch / walk), an action (pose + fx at the spot) and an outcome (a store, a plot or a wall changes).
const CROP = ['empty', 'planted', 'sprout', 'growing', 'mature', 'harvest'];
const GROW_S = [22, 30];                 // real seconds per growth stage of an active plot (planted -> sprout -> growing -> mature)
const STORE_CAP = { food: 40, fish: 24, kitchen: 10, pot: 3, meals: 16, mat: 24, yard: 18, market: 10 };
// spot capacity (people per spot) and zone capacity (people per area) keep the commons, playground and market from piling up
const SPOT_CAP = { seat: 1, bench: 1, class: 1, cook: 1, stall: 1, fish: 1, bed: 1, drill: 1, yardwork: 1, teach: 1, field: 2, medic: 2, green: 2, play: 2, porch: 2, shop: 2, yard: 3, coop: 2, goat: 2 };
const ZONE_CAP = { commons: [14, 40], play: [8, 9], market: [9, 9] };         // [normal, at meal time]
const NO_FALLBACK = new Set(['bed', 'shelter', 'cook', 'fish', 'class', 'teach', 'medic', 'drill', 'stall', 'granary', 'storage', 'smoke', 'kitchenIn', 'wood', 'mkt']);

function hwInit() {
  const R = HS.R;
  // delivery / pickup points (added once per map; they are just coordinates, nothing is drawn for them)
  const S = HF.spots, near = (x, y) => { const k = hfNearPass(x, y, 'in', 4); return k >= 0 ? tileC(k) : [x, y]; };
  if (!S.smoke) { const sm = HF.props.find(p => p.kind === 'smokehouse'); spot('smoke', ...near(sm.x + 6, sm.y + 16)); }
  if (!S.kitchenIn) { const kt = HF.buildings.find(b => b.kind === 'kitchen'); spot('kitchenIn', ...near(kt.x + kt.w + 6, kt.y + kt.d - 6)); }
  if (!S.wood) { const ws = HF.buildings.find(b => b.kind === 'workshop'); spot('wood', ...near(ws.x + ws.w + 20, ws.y + ws.d - 2)); }   // the plank pile by the sawhorse, away from the workbenches
  if (!S.mkt) { const st = S.stall; spot('mkt', ...near((st[0].x + st[7].x) / 2, (st[0].y + st[7].y) / 2)); }
  for (const name in S) for (const s of S[name]) { s.nm = name; s.zone = name === 'seat' || name === 'green' || (name === 'bench' && !s.work) ? 'commons' : name === 'play' ? 'play' : name === 'shop' ? 'market' : ''; }
  HS.zoneN = { commons: 0, play: 0, market: 0 };
  HS.lotSpot = []; for (const s of S.porch) (HS.lotSpot[s.lot] = HS.lotSpot[s.lot] || {}).porch = s; for (const s of S.yardwork) (HS.lotSpot[s.lot] = HS.lotSpot[s.lot] || {}).yard = s;
  // stores (and where their piles are drawn)
  HS.store = { food: 8 + Math.floor(R() * 8), fish: 3 + Math.floor(R() * 4), kitchen: 2 + Math.floor(R() * 3), pot: Math.floor(R() * 2), meals: 4 + Math.floor(R() * 6), mat: 6 + Math.floor(R() * 6), yard: 3 + Math.floor(R() * 4), market: 2 + Math.floor(R() * 4) };
  const pile = (sp, dx, dy) => { const s = S[sp][0], k = hfNearPass(s.x + dx, s.y + dy, 'in', 3); return k >= 0 ? tileC(k) : [s.x + dx, s.y + dy]; };
  HS.storeAt = { food: pile('granary', 12, -4), fish: pile('smoke', 10, -2), kitchen: pile('kitchenIn', 6, -8), mat: pile('wood', 2, -10), yard: pile('storage', -10, 6), market: pile('mkt', 0, 0) };
  HS.stats.work = { stage: 0, homeFood: 0, harvests: 0, plantings: 0, tends: 0, deliveries: 0, fishCaught: 0, fishDelivered: 0, cooked: 0, served: 0, eaten: 0, hauls: 0, builds: 0, salvage: 0, repairHp: 0, responses: 0, respShots: 0, packs: 0, stalks: 0, gateProbes: 0, wallProbes: 0 };
  // crop plots: the 5x5-tile field patches; each one cycles on its own clock
  HS.plots = [];
  for (const f of HF.fields) {
    const ci = Math.floor(f.i / 5) * 5, cj = Math.floor(f.j / 5) * 5, tiles = [];
    for (let j = cj; j < cj + 5; j++) for (let i = ci; i < ci + 5; i++) if (inMap(i, j) && HF.gk[tIdx(i, j)] === GK.FIELD) tiles.push(tIdx(i, j));
    const work = tiles.filter(k => hfPass(k, 'in')); if (!work.length) continue;
    let cx = 0, cy = 0; for (const k of tiles) { const [x, y] = tileC(k); cx += x; cy += y; }
    const ctr = work.reduce((b, k) => { const [x, y] = tileC(k), d = Math.hypot(x - cx / tiles.length, y - cy / tiles.length); return d < b[1] ? [k, d] : b; }, [work[0], 1e9])[0];
    const st = Math.floor(R() * 5), P = { id: HS.plots.length, ctr, ci, cj, tiles, work, crop: f.crop, x: cx / tiles.length, y: cy / tiles.length, st, t: 0, dur: rr2(GROW_S[0], GROW_S[1]), prog: 0, nr: rr2(0.04, 0.3), worker: null, tended: -1, stub: st === 0 && R() < 0.5, changes: 0, last: -R() * 25, hist: [] };
    if (st >= 1 && st <= 3) P.t = R() * P.dur * 0.95;
    HS.plots.push(P);
  }
}
function hwStage(P, st) { P.st = st; P.t = 0; P.dur = rr2(GROW_S[0], GROW_S[1]); P.changes++; HS.stats.work.stage++; P.hist.push(HS.t); if (P.hist.length > 12) P.hist.shift(); P.last = HS.t; if (st !== 3) P.tended = -1; }
function hwPlotPoint(P) { const k = P.work[Math.floor(HS.R() * P.work.length)], [x, y] = tileC(k); return [x + rr2(-2.5, 2.5), y + rr2(-2.5, 2.5)]; }
function hwPlotNext(P, p) {   // the next work point: a neighbouring tile of the same plot (never a long diagonal across it)
  const k0 = tileOfW(p.x, p.y), i0 = k0 % HN, j0 = (k0 / HN) | 0, near = P.work.filter(k => Math.max(Math.abs(k % HN - i0), Math.abs(((k / HN) | 0) - j0)) === 1);
  const k = near.length ? near[Math.floor(HS.R() * near.length)] : P.work[Math.floor(HS.R() * P.work.length)], [x, y] = tileC(k); return [x + rr2(-2.5, 2.5), y + rr2(-2.5, 2.5)];
}
function hwTick(dt) {
  const h = HS.life, night = h >= 21.4 || h < 7;   // nobody harvests at night, so growth all but pauses: dawn does not find every plot ripe at once
  const rate = HS.season === 'winter' ? 0.7 : 1;
  let ripe = 0; for (const P of HS.plots) if (P.st >= 4) ripe++;
  const backlog = ripe > HS.plots.length * 0.34 ? 0.3 : 1;   // ripening is paced by the harvest crew: a short-handed evening never leaves every field waiting
  for (const P of HS.plots) {
    const w = P.worker; if (w && (!w.alive || !w.task || w.task.plot !== P)) P.worker = null;
    if (P.st >= 1 && P.st <= 3) { P.t += dt * rate * (night ? P.nr : 1) * (P.st === 3 ? backlog : 1); if (P.t >= P.dur) hwStage(P, P.st + 1); }   // each crop has its own pace at night
  }
}

// ---------------------------------------------------------------- spot choice with capacity, zones and fallbacks
const mealTime = h => (h >= 11.8 && h < 12.9) || (h >= 18.3 && h < 19.2);
function hwZoneFull(z) { if (!z) return false; const c = ZONE_CAP[z]; return HS.zoneN[z] >= (mealTime(HS.life) ? c[1] : c[0]); }
function hwFallback(p) {          // somewhere sensible near home instead of joining a crowd
  const L = p && p.home && HS.lotSpot[p.home.lot];
  if (L && L.porch && (HS.spots.get(L.porch) || 0) < 2) return L.porch;
  if (L && L.yard && (HS.spots.get(L.yard) || 0) < 1) return L.yard;
  let best = null, bs = 1e9; const list = HF.spots.porch;
  for (let n = 0; n < 10; n++) { const s = list[Math.floor(HS.R() * list.length)], c = HS.spots.get(s) || 0, d = p ? Math.hypot(s.x - p.x, s.y - p.y) / 300 : 0, sc = c + d + HS.R() * 0.4; if (sc < bs) { bs = sc; best = s; } }
  return best;
}

// ---------------------------------------------------------------- farmers
function hwFarmJob(p) {
  let best = null, bs = -1e9;
  for (const P of HS.plots) {
    if (P.worker && P.worker !== p) continue;
    let need = P.st >= 4 ? 3 : P.st === 0 ? 2.4 : P.tended !== P.st ? 0.9 : -9; if (need < 0) continue;
    if (P.st === 0 && HS.t - P.last < 8) need -= 1.2;                     // let a fresh stubble field show for a moment
    const sc = need - Math.hypot(P.x - p.x, P.y - p.y) / 130 + HS.R() * 0.6; if (sc > bs) { bs = sc; best = P; }
  }
  if (!best) return null;
  best.worker = p; const job = best.st >= 4 ? 'harvest' : best.st === 0 ? 'plant' : 'tend', [x, y] = tileC(best.ctr);   // one shared flow field per plot
  return { k: 'work', plot: best, job, x, y, w: 0, dur: job === 'harvest' ? rr2(11, 15) : job === 'plant' ? rr2(9, 13) : rr2(7, 11), tool: job === 'plant' ? 'bag' : job === 'tend' ? 'bucket' : p.load ? 'basket' : 'hoe', anim: job === 'harvest' ? 'reap' : job === 'plant' ? 'kneel' : 'water' };
}
function hwFarm(p, T, dt) {
  const P = T.plot; if (P.worker && P.worker !== p && P.worker.alive && P.worker.task && P.worker.task.plot === P) { p.task = null; return; }
  P.worker = p; p.act = T.anim; T.w += dt; T.step = (T.step || 0) + dt;
  if (T.step > rr2(3, 4.5) && T.w < T.dur - 1) { T.step = 0; const [x, y] = hwPlotNext(P, p); p.path = { direct: 1, gx: x, gy: y, mask: 'in', run: 0 }; return; }   // work along the rows (straight steps inside the plot)
  const f = clamp(T.w / T.dur, 0, 1);
  if (T.job === 'harvest') {
    if (P.st === 4) { hwStage(P, 5); P.prog = 0; }
    if (P.st !== 5) { p.task = null; return; }
    P.prog = Math.max(P.prog, f); if (HS.R() < dt * 1.2) HS.fx.push({ k: 'chaff', x: p.x + rr2(-3, 3), y: p.y + rr2(-2, 2), t: 0.6 });
    if (f >= 1) { P.prog = 0; P.stub = true; hwStage(P, 0); HS.stats.work.harvests++; p.carry = 'basket'; p.variant = 'basket'; p.load = { k: 'food', n: (p.load ? p.load.n : 0) + 1 }; bubble(p, 'wheat');
      T.job = 'plant'; T.w = -rr2(2, 5); T.dur = rr2(8, 11); T.anim = 'kneel'; }   // replant right away (the stubble shows for a moment first)
  } else if (T.job === 'plant') {
    if (P.st !== 0) { p.task = null; return; }
    if (T.w < 0) { p.act = 'stand'; return; }
    P.prog = f; if (f >= 1) { P.prog = 0; P.stub = false; hwStage(P, 1); HS.stats.work.plantings++; hwAfterPlot(p); }
  } else {
    if (HS.R() < dt * 2) HS.fx.push({ k: 'water', x: p.x + (p.dir === 0 ? 5 : p.dir === 2 ? -5 : 0), y: p.y + (p.dir === 1 ? 5 : p.dir === 3 ? -5 : 0), t: 0.5 });
    if (f >= 1) { if (P.st >= 1 && P.st <= 3) { P.t += P.dur * 0.35; P.tended = P.st; } HS.stats.work.tends++; p.task = null; }
  }
}

function hwAfterPlot(p) {
  if (!p.load) { p.task = null; return; }
  // a basket holds two harvests: fill it at a ripe plot nearby, otherwise a breather and then off to the stores
  const nx = p.load.n < 3 && HS.plots.find(Q => Q.st === 4 && !Q.worker && Math.hypot(Q.x - p.x, Q.y - p.y) < 120);
  if (nx) { nx.worker = p; const [x, y] = tileC(nx.ctr); setTask(p, { k: 'work', plot: nx, job: 'harvest', x, y, w: 0, dur: rr2(11, 15), tool: 'basket', anim: 'reap' }); }
  else setTask(p, { k: 'walk', x: p.x, y: p.y, dur: rr2(0.5, 6), tool: 'basket' });
}
// ---------------------------------------------------------------- deliveries and hauling
// a load is carried to a store; the pile there grows (renderer draws HS.store as crates / sacks / planks)
function hwDeliverTask(p) {
  const L = p.load; if (!L) return null;
  if (L.k === 'home') return { k: 'drop', ...hwHomeXY(p, 'porch'), dur: rr2(2, 3.5), into: 'home', tool: p.variant || 'crate' };   // an interrupted errand still ends at home
  const S = HS.store, to = L.k === 'fish' ? (S.kitchen < 4 && HS.R() < 0.4 ? 'kitchen' : 'fish') : L.k === 'food' ? (S.kitchen < 3 && HS.R() < 0.5 ? 'kitchen' : 'food') : L.k;
  const sp = { food: 'granary', fish: 'smoke', kitchen: 'kitchenIn', mat: 'wood', yard: 'storage', market: 'mkt', tools: 'toolpile', medkit: 'supplyIn', med: 'storage' }[to];
  if (L.k === 'food' && L.n >= 2) { p.cart = 1; HS.Ls.carts++; return { k: 'drop', ...spotXY(sp), dur: rr2(2, 3.5), into: to, tool: '' }; }   // a full harvest goes by wheelbarrow
  return { k: 'drop', ...spotXY(sp), dur: rr2(2, 3.5), into: to, tool: p.cart ? '' : (p.variant || 'crate') };
}
function hwDrop(p, T) {
  const L = p.load, S = HS.store, W = HS.stats.work;
  if (L && T.into === 'home') HS.stats.work.homeFood++;
  else if (L) { S[T.into] = Math.min(STORE_CAP[T.into] || 99, (S[T.into] || 0) + L.n); W.deliveries++; if (L.k === 'fish') W.fishDelivered += L.n; bubble(p, L.k === 'fish' ? 'fish' : L.k === 'mat' ? 'plank' : L.k === 'food' ? 'wheat' : 'star'); }
  p.load = null; p.carry = null; p.variant = ''; p.cart = 0;
}
const HAUL_SP = { food: 'granary', fish: 'smoke', kitchen: 'kitchenIn', mat: 'wood', yard: 'storage', market: 'mkt' };
const CARTK = { food: 2, fish: 4, yard: 5, mat: 3, kitchen: 1, tools: 5, med: 7, market: 2 };   // handcart loads (hf-art CART_LOAD)
function hwHaulJob(p, force) {   // workers move supplies between buildings when a store needs it (force = [from, to])
  const S = HS.store, opts = force ? (S[force[0]] > 0 ? [[force[0], force[1], 1]] : []) : [];
  if (!force) { if (S.yard > 0 && S.mat < STORE_CAP.mat - 2) opts.push(['yard', 'mat', 2 + S.yard / 4]); if (S.food > 1 && S.kitchen < 5) opts.push(['food', 'kitchen', 3 - S.kitchen / 3]); if (S.fish > 2 && S.kitchen < 6) opts.push(['fish', 'kitchen', 2]); }
  if (!force) { if (S.food > 4 && S.market < 6) opts.push(['food', 'market', 1.5]); if (S.tools > 1 && S.market < 8) opts.push(['tools', 'market', 1.2]); if (S.med > 0 && S.medkit < 4) opts.push(['med', 'medkit', 1.6]); }
  const busy = new Set(HS.people.filter(q => q.alive && q.task && q.task.k === 'haul' && q !== p).map(q => q.task.from + q.task.to));
  for (let i = opts.length - 1; i >= 0; i--) if (busy.has(opts[i][0] + opts[i][1])) opts.splice(i, 1);   // one hauler per route: no convoys
  if (!opts.length) return null;
  let best = null, bs = -1; for (const o of opts) { const sc = o[2] * (0.6 + HS.R()); if (sc > bs) { bs = sc; best = o; } }
  const [from, to] = best; return { k: 'haul', from, to, leg: 0, ...spotXY(HAUL_SP[from]), dur: 2 };
}
function hwHaul(p, T, dt) {
  const S = HS.store;
  if (T.leg === 0) { p.act = 'kneel'; if (T.t < 1.6) return; if (S[T.from] <= 0) { p.task = null; return; }
    const n = Math.min(S[T.from], T.to === 'home' ? 1 : T.from === 'yard' || T.from === 'food' || T.from === 'tools' ? 3 : 2); S[T.from] -= n; p.load = { k: T.to, n };
    if (n >= 2) { p.cart = CARTK[T.from] || 5; p.variant = ''; p.carry = null; HS.Ls.carts++; } else { p.variant = T.from === 'fish' ? 'bucket' : T.from === 'med' ? 'crate' : 'crate'; p.carry = p.variant; }
    T.leg = 1; const s = T.to === 'home' ? hwHomeXY(p, 'porch') : spotXY(HAUL_SP[T.to]); T.spot = s.spot; hsClaim(p, s.spot); T.x = s.x; T.y = s.y; T.t = 0; hsGo(p, s.x, s.y, 'in'); return; }
  p.act = 'stand'; if (T.t < 1.5) return;
  if (T.to === 'home') HS.stats.work.homeFood++; else S[T.to] = Math.min(STORE_CAP[T.to] || 99, (S[T.to] || 0) + p.load.n); HS.stats.work.hauls++; bubble(p, T.to === 'mat' ? 'plank' : T.to === 'market' ? 'money' : T.to === 'home' ? 'heart' : 'star');
  p.load = null; p.carry = null; p.variant = ''; p.cart = 0; p.task = null;
}

// a household errand: a sack from the granary carried home (drains the store, so the pile at the barn rises and falls)
function hwHomeFood(p) { const S = HS.store, from = S.fish > S.food / 2 ? 'fish' : 'food'; if (S[from] < 4 || !p.home || p.home.lot == null) return null; return { k: 'haul', from, to: 'home', leg: 0, ...spotXY(HAUL_SP[from]), dur: 2 }; }
// ---------------------------------------------------------------- cooks: ingredients -> pot -> served at the tables -> eaten
function hwCookJob(p) {
  const S = HS.store, R = HS.R;
  if (S.pot > 0 && S.meals < STORE_CAP.meals - 4 && R() < 0.8) { const s = pickR(HF.spots.seat); return { k: 'serve', x: s.x, y: s.y + (s.dir === 1 ? -2 : 2), dur: 3, tool: 'pot' }; }
  if (S.kitchen > 0 && S.pot < STORE_CAP.pot) return { k: 'work', cook: 1, ...spotXY('cook', 1), dur: rr2(14, 22), tool: 'pot', anim: 'stir' };
  if (S.kitchen < 4 && (S.food > 0 || S.fish > 0)) { const from = S.fish > S.food / 2 ? 'fish' : 'food'; return { k: 'haul', from, to: 'kitchen', leg: 0, ...spotXY(HAUL_SP[from]), dur: 2 }; }
  return R() < 0.6 ? { k: 'work', ...spotXY('cook', 1), dur: rr2(10, 16), tool: 'pot', anim: 'stir' } : { k: 'sit', ...spotXY('bench'), dur: rr2(10, 20) };
}
function hwServe(p, T) { p.act = 'stand'; if (T.t < T.dur) return; const S = HS.store; if (S.pot > 0) { S.pot--; S.meals = Math.min(STORE_CAP.meals, S.meals + 6); HS.stats.work.served++; bubble(p, 'pho'); } p.variant = ''; p.task = null; }
function hwCooked(p, T) { const S = HS.store; if (T.cook && S.kitchen > 0) { S.kitchen = Math.max(0, S.kitchen - 2); S.pot = Math.min(STORE_CAP.pot, S.pot + 1); HS.stats.work.cooked++; bubble(p, 'pho'); } }
function hwAte(p) { const S = HS.store; if (S.meals > 0) { S.meals--; HS.stats.work.eaten++; } else if (S.food > 0 && HS.R() < 0.4) S.food--; }   // no bowl left: bread from the granary

// ---------------------------------------------------------------- builders: planks from the workshop -> hammer -> outcome
function hwBuildJob(p) {
  const S = HS.store, R = HS.R, r = R();
  if (r < 0.4 && S.mat > 0) { const lots = HS.lotSpot, L = lots[Math.floor(R() * lots.length)]; if (L && L.yard) return { k: 'build', fetch: 1, ...spotXY('wood'), site: L.yard, dur: rr2(12, 18), tool: '', anim: 'hammer' }; }
  if (r < 0.7) return { k: 'work', salvage: 1, ...spotXY('bench', 2), dur: rr2(14, 24), tool: 'hammer', anim: 'hammer' };
  const h = hwHaulJob(p); if (h) return h;
  return { k: 'work', salvage: 1, ...spotXY('bench', 2), dur: rr2(14, 24), tool: 'hammer', anim: 'hammer' };
}
function hwBuild(p, T, dt) {
  if (T.fetch) { p.act = 'kneel'; if (T.t < 1.6) return; if (HS.store.mat <= 0) { p.task = null; return; } HS.store.mat--; T.fetch = 0; p.variant = 'plank'; p.carry = 'plank';
    hsClaim(p, T.site); T.spot = T.site; const s = T.site; T.x = s.x; T.y = s.y + 3; T.t = 0; hsGo(p, T.x, T.y, 'in'); return; }
  p.variant = 'hammer'; p.carry = null; p.act = 'hammer'; if (Math.floor((T.t - dt) / 1.4) !== Math.floor(T.t / 1.4)) { hsSound('hammer', p.x, p.y, 0.3); HS.fx.push({ k: 'dust', x: p.x + rr2(-3, 3), y: p.y - 3, t: 0.35 }); }
  if (T.t > T.dur) { HS.stats.work.builds++; bubble(p, 'star'); p.variant = ''; p.task = null; }
}
function hwSalvaged(p, T) { if (T.salvage && HS.R() < 0.5) { HS.store.mat = Math.min(STORE_CAP.mat, HS.store.mat + 1); HS.stats.work.salvage++; bubble(p, 'plank'); } }

// ---------------------------------------------------------------- fishers: casts, catches, a bucket to the smokehouse
function hwFish(p, T, dt) {
  p.act = 'fish'; if (T.face) faceTo(p, T.face); T.w = (T.w || 0) + dt; if (!T.next) T.next = rr2(7, 15);
  if (T.w > T.next) { T.next += rr2(8, 16); if (HS.R() < 0.45) { T.catch = (T.catch || 0) + 1; HS.stats.work.fishCaught++; bubble(p, 'fish'); HS.fx.push({ k: 'splash', x: p.x + (p.dir === 0 ? 10 : p.dir === 2 ? -10 : 0), y: p.y + (p.dir === 1 ? 10 : p.dir === 3 ? -10 : 0), t: 0.7 }); } }
  if (T.w > T.dur || (T.catch || 0) >= 3) { if (T.catch) { p.carry = 'bucket'; p.variant = 'bucket'; p.load = { k: 'fish', n: T.catch }; } p.task = null; }
}

// ---------------------------------------------------------------- guards answer infected that come close to the wall
function hwGuardRespond() {
  const resp = HS.people.filter(p => p.alive && p.task && p.task.k === 'respond');
  const covered = z => z.resp && z.resp.alive && z.resp.task && z.resp.task.k === 'respond' && z.resp.task.z === z;
  const hitting = z => z.st === 'wall' || z.st === 'gate';
  const threats = HS.zombies.filter(z => { if (z.st === 'dead' || covered(z) || isInside(z.x, z.y)) return false; const [u, v] = w2d(z.x, z.y);
    return hitting(z) ? true : HS.alarm <= 0 && v > wallV(u) - 42 && (z.st === 'march' || z.st === 'investigate' || z.st === 'pursue' || z.st === 'pack'); })
    .sort((a, b) => hitting(b) - hitting(a));               // infected hitting the wall first
  let n = 0;
  for (const z of threats) {
    let seg = null, sd = 1e9; for (const s of HF.walls) { if (s.inT < 0 || s.gate) continue; const d = (s.x - z.x) ** 2 + (s.y - z.y) ** 2; if (d < sd) { sd = d; seg = s; } }
    if (!seg) continue;
    let g = null, gd = 480 * 480;
    if (resp.length + n >= 6) {                               // all responders out: a real wall attack pulls one off a lesser target
      if (!hitting(z)) return;
      for (const p of resp) { const t = p.task.z; if (t && t.st !== 'dead' && hitting(t)) continue; const d = (p.x - seg.x) ** 2 + (p.y - seg.y) ** 2; if (d < gd) { gd = d; g = p; } }
    } else for (const p of HS.people) {
      if (!p.alive || p.role !== 'guard' || !p.post || p.onTower || p.exp || p.rescue || p.st === 'down' || p.inj || !p.vis) continue;
      const k = p.task ? p.task.k : ''; if (k === 'respond' || k === 'tower' || k === 'gatepost' || k === 'defend' || k === 'fight' || k === 'sleep') continue;
      if (p.post.k !== 'patrol' && (p.post.k !== 'reserve' || !hitting(z))) continue;   // patrols answer approaches; reserves leave the training ground only for real wall attacks
      const d = (p.x - seg.x) ** 2 + (p.y - seg.y) ** 2; if (d < gd) { gd = d; g = p; }
    }
    if (!g) continue;
    const [x0, y0] = tileC(seg.inT), m = HS.people.filter(q => q.task && q.task.k === 'respond' && Math.abs(q.task.seg - seg.id) < 3).length, a = m * 2.39996, r = m ? 6 + 3 * Math.sqrt(m) : 0;
    const kk = hfNearPass(x0 + Math.cos(a) * r, y0 + Math.sin(a) * r, 'in', 2), [x, y] = kk >= 0 ? tileC(kk) : [x0, y0];   // several responders spread along the wall
    setTask(g, { k: 'respond', x: x + rr2(-1.5, 1.5), y: y + rr2(-1.5, 1.5), z, seg: seg.id, dur: 30, tool: 'carry', run: 1 }); z.resp = g; HS.stats.work.responses++;
    if (++n >= 2) return;
  }
}
function hwRespond(p, T, dt) {
  let z = T.z; if (!z || z.st === 'dead' || isInside(z.x, z.y) || dist(z, p) > 120) { z = nearestZ(p.x, p.y, 110, q => !isInside(q.x, q.y)); T.z = z; }
  p.act = 'look'; p.variant = z ? 'aim' : 'carry';
  if (z) { faceTo(p, z); if (p.cool <= 0) { p.cool = rr2(1.3, 2); HS.stats.work.respShots++; hsShoot(p, z, { x: p.x, y: p.y, z: 14 }, 120, 0.55); } T.seen = T.t; }
  if (!z && T.t - (T.seen || 0) > 4 || T.t > 60) { p.variant = 'carry'; p.task = null; }
}
