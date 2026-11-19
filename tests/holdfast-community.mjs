// Holdfast milestone 6 — community expansion checks (Node only, deterministic seeds, accelerated time).
// Activity distribution across zones, no central crowding, food chain (fields -> granary/market/kitchen), market loop, training ground and
// alarm response, stable + mounted scouts + pack horses, workshop/forge/carpentry, house repairs with scaffolding, hospital, school, farmyard,
// graveyard + burials, frontier, long-run stability, determinism.
// Usage: node tests/holdfast-community.mjs [seed=7]
import { loadHF, ev } from './hf-load.mjs';
const FILES = ['js/core.js', 'js/art.js', 'holdfast/hf-map.js', 'holdfast/hf-art.js', 'holdfast/hf-sim.js', 'holdfast/hf-work.js', 'holdfast/hf-life.js'];
const SEED = +(process.argv[2] || 7);
const fails = [], rep = {};
const check = (k, ok, info) => { rep[k] = { ok: !!ok, info }; if (!ok) fails.push(k + ' ' + JSON.stringify(info)); };
function world(seed, hour, pop) { const c = loadHF(FILES); c.hfBuildMap(7); c.hsInit({ seed: seed * 5 + 3, pop: pop || 120, hour: hour == null ? 8 : hour });
  ev(c, `(() => { const [x, y] = d2w(482, 236), sx = x - y, sy = (x + y) / 2; HS.view = { x0: sx - 240, y0: sy - 135, x1: sx + 240, y1: sy + 135 }; })()`); return c; }
const J = (c, e) => JSON.parse(ev(c, `JSON.stringify(${e})`));
const ZONES = ['fields', 'market', 'kitchen', 'training', 'stable', 'workshop', 'infirmary', 'school', 'graveyard', 'farmyard', 'frontier', 'commons', 'homes', 'river', 'outside'];

// ---------------------------------------------------------------- 1) a full working day (08:00 -> 20:00 = 600 s): distribution + every loop
{
  const c = world(SEED, 8); ev(c, "HS.wxMode = 'clear'; HS.weather = 'clear'");   // outdoor loops pause in rain (milestone 5 covers rain behaviour)
  const zc = {}, zmax = {}; let n = 0, calmN = 0, calmTrain = 0, crowdMax = 0, commonsOffMeal = 0, offMeal = 0, stockMin = 1e9, stockMax = 0, sawKitchenEmpty = 0;
  for (let i = 0; i < 6000; i++) {
    c.hsTick(0.1);
    if (i % 10) continue;
    const s = J(c, `(() => { const ps = HS.people.filter(p => p.alive && p.vis && !(p.task && p.task.k === 'sleep')); const z = {}; for (const p of ps) { const k = lfZoneOf(p.x, p.y); z[k] = (z[k] || 0) + 1; }
      let crowd = 0; const meal = mealTime(HS.life); if (!meal) for (const p of ps) { if (p.path || p.onTower) continue; let m = 0; for (const q of ps) if (!q.path && !q.onTower && Math.abs(q.x - p.x) < 12 && Math.abs(q.y - p.y) < 12) m++; if (m > crowd) crowd = m; }
      return { z, crowd, meal, alarm: HS.alarm > 0, stock: HS.stalls.reduce((a, s) => a + (s.open ? s.stock : 0), 0) + HS.store.market, kit: HS.store.kitchen, h: HS.life }; })()`);
    if (!s.alarm) { calmN++; calmTrain += s.z.training || 0; }
    n++; for (const k in s.z) { zc[k] = (zc[k] || 0) + s.z[k]; zmax[k] = Math.max(zmax[k] || 0, s.z[k]); }
    if (!s.meal) { crowdMax = Math.max(crowdMax, s.crowd); offMeal++; commonsOffMeal += (s.z.commons || 0); }
    if (s.h > 9 && s.h < 17) { stockMin = Math.min(stockMin, s.stock); stockMax = Math.max(stockMax, s.stock); }
  }
  const tot = Object.values(zc).reduce((a, b) => a + b, 0), share = k => (zc[k] || 0) / tot, mean = k => (zc[k] || 0) / n;
  const active = ZONES.filter(k => k !== 'homes' && k !== 'outside' && k !== 'river' && mean(k) >= 1.5);
  rep.distribution = Object.fromEntries(ZONES.map(k => [k, +(100 * share(k)).toFixed(1)]));
  const L = J(c, 'HS.Ls'), W = J(c, 'HS.stats.work');
  check('distribution: >= 11 community zones busy on average (>= 1.5 people each)', active.length >= 11, [active.length, active]);
  check('distribution: no zone holds more than 25 % of the visible people', Math.max(...ZONES.filter(k => k !== 'homes').map(share)) <= 0.25, rep.distribution);
  check('distribution: farming is one loop among several (fields <= 18 %)', share('fields') <= 0.18, +share('fields').toFixed(3));
  check('crowding: the commons is not the centre of everything outside meals (<= 12 people on average)', commonsOffMeal / offMeal <= 12, +(commonsOffMeal / offMeal).toFixed(1));
  check('crowding: biggest standing group outside meals <= 12', crowdMax <= 12, crowdMax);
  // food chain
  check('food: fields harvested, planted and delivered (by basket and wheelbarrow / handcart)', W.harvests >= 60 && W.plantings >= 60 && W.deliveries >= 30 && L.carts >= 20, [W.harvests, W.plantings, W.deliveries, L.carts]);
  check('food: the kitchen cooks what is delivered and serves it', W.cooked >= 8 && W.served >= 6 && W.eaten >= 20, [W.cooked, W.served, W.eaten]);
  // market
  check('market: traders set up and restock their stalls', L.setup + L.restock >= 6, [L.setup, L.restock]);
  check('market: customers queue and buy', L.sales >= 25, L.sales);
  check('market: stock rises and falls during the day', stockMax - stockMin >= 6, [stockMin, stockMax]);
  // training ground
  check('training: range practice, laps and formation marches', L.range + L.laps + L.form >= 6 && L.shots >= 60 && L.form >= 1, [L.range, L.shots, L.laps, L.form]);
  check('training: ground busy in peaceful periods (>= 3.5 people on average outside alarms)', calmTrain / Math.max(1, calmN) >= 3.5, [+(calmTrain / Math.max(1, calmN)).toFixed(1), +(1 - calmN / n).toFixed(2)]);
  // stable
  check('stable: horses fed, brushed, tacked, led back; mucking out', L.feedH >= 3 && L.groom >= 5 && L.tack >= 2 && L.lead >= 2 && L.muck >= 5, [L.feedH, L.groom, L.tack, L.lead, L.muck]);
  check('stable: mounted scouts ride out and come back', L.rides >= 2 && J(c, 'HS.rides.length') <= 1, [L.rides, L.ridesChased, L.survivors]);
  // workshop / logistics
  check('workshop: forge makes tools, carpentry makes planks, the wagon gets fixed, scavenger gear packed', L.forge >= 8 && L.saw >= 6 && L.wagon >= 1 && L.gear >= 2, [L.forge, L.saw, L.wagon, L.gear]);
  // construction
  check('construction: houses damaged -> scaffolding -> patched -> finished', L.damage >= 3 && L.scaffolds >= 2 && L.patches >= 5 && L.houseRepairs >= 2, [L.damage, L.scaffolds, L.patches, L.houseRepairs]);
  check('construction: weak wall sections reinforced', L.reinforce >= 3, L.reinforce);
  // hospital
  check('hospital: check-ups, convalescents on cots, medic rounds, linen', L.checkups >= 3 && L.conv >= 2 && L.medCheck >= 5 && L.sheets >= 2, [L.checkups, L.conv, L.medCheck, L.sheets]);
  check('hospital: visibly used (>= 3 people there on average)', mean('infirmary') >= 3, +mean('infirmary').toFixed(1));
  // school
  check('school: lessons, garden, ball game, stories', L.lessons >= 5 && L.garden >= 4 && L.kicks >= 40 && L.story >= 1, [L.lessons, L.garden, L.kicks, L.story]);
  // farmyard
  check('farmyard: pigs fed, chickens fed, eggs and milk to the kitchen', L.pigFeed >= 2 && L.chickFeed >= 2 && L.eggs >= 4 && L.milk >= 1, [L.pigFeed, L.chickFeed, L.eggs, L.milk]);
  check('farmyard: pigs, chickens (with a rooster) and goats in their pens', J(c, `['pig','chicken','rooster','goat'].map(k => HS.wild.filter(w => w.k === k && w.pen && w.x >= w.pen.x - 1 && w.x <= w.pen.x + w.pen.w + 1 && w.y >= w.pen.y - 1 && w.y <= w.pen.y + w.pen.d + 1).length)`).join() === '4,7,1,3', J(c, `['pig','chicken','rooster','goat'].map(k => HS.wild.filter(w => w.k === k).length)`));
  // graveyard
  check('graveyard: visits with flowers, the caretaker', L.visits >= 1 && L.visits + L.tend >= 5, [L.visits, L.flowers, L.tend]);
  // frontier
  check('frontier: patrols, towers and gate manned, approaches answered', mean('frontier') >= 6 && W.responses >= 20, [+mean('frontier').toFixed(1), W.responses]);
  rep.day = { L, W: { harvests: W.harvests, deliveries: W.deliveries, cooked: W.cooked, served: W.served, responses: W.responses }, zmax };
}

// ---------------------------------------------------------------- 2) the kitchen depends on deliveries
{
  const c = world(SEED + 1, 10);
  ev(c, 'HS.store.kitchen = 0; HS.store.food = 0; HS.store.fish = 0; HS.store.pot = 0; HS.store.meals = 0; for (const P of HS.plots) { P.st = 1; P.t = 0; }');
  const c0 = J(c, 'HS.stats.work.cooked'); for (let i = 0; i < 600; i++) { c.hsTick(0.1); ev(c, 'HS.store.food = Math.min(HS.store.food, 0); HS.store.fish = 0; HS.store.kitchen = Math.min(HS.store.kitchen, 0); HS.eggs = 0'); }
  const c1 = J(c, 'HS.stats.work.cooked');
  ev(c, 'HS.store.food = 20; HS.store.fish = 6'); for (let i = 0; i < 1800; i++) c.hsTick(0.1);
  const c2 = J(c, 'HS.stats.work.cooked');
  check('kitchen: no cooking without deliveries, cooking resumes when food arrives', c1 - c0 === 0 && c2 - c1 >= 2, [c1 - c0, c2 - c1]);
}

// ---------------------------------------------------------------- 3) alarm: trainees break off and defend
{
  const c = world(SEED + 2, 10);
  for (let i = 0; i < 600; i++) c.hsTick(0.1);
  for (let i = 0; i < 1200 && J(c, `HS.people.filter(p => p.alive && p.role === 'guard' && p.task && ((p.task.k === 'life' && ['range', 'laps', 'form', 'formlead'].includes(p.task.a)) || p.task.k === 'drill')).length`) < 2; i++) c.hsTick(0.1);   // milestone 7: ring the bell once training is under way (the check is about the response)
  const before = J(c, `HS.people.filter(p => p.alive && p.role === 'guard' && p.task && p.task.k === 'life' && ['range', 'laps', 'form', 'formlead', 'stand'].includes(p.task.a)).length + HS.people.filter(p => p.alive && p.role === 'guard' && p.task && p.task.k === 'drill').length`);
  ev(c, `(() => { const s = HF.walls.find(s => !s.gate && s.inT >= 0 && s.id % 7 === 3); s.pressure = 9; s.lastHit = HS.t; s.hp = Math.max(1, s.hp - 3); HS.forced = s; hsAlarm('test'); })()`);
  let afterTrain = 99, defenders = 0;
  for (let i = 0; i < 200; i++) { ev(c, 'HS.forced.pressure = 9; HS.forced.lastHit = HS.t'); c.hsTick(0.1); }
  afterTrain = J(c, `HS.people.filter(p => p.alive && p.role === 'guard' && p.task && ((p.task.k === 'life' && ['range', 'laps', 'form', 'formlead'].includes(p.task.a)) || p.task.k === 'drill')).length`);
  defenders = J(c, `HS.people.filter(p => p.alive && p.role === 'guard' && p.task && p.task.k === 'defend').length`);
  check('alarm: training stops within 20 s and reserves run to defend', before >= 2 && afterTrain === 0 && defenders >= 3, [before, afterTrain, defenders]);
}

// ---------------------------------------------------------------- 4) burials: a death puts a fresh grave in the churchyard and neighbours gather
{
  const c = world(SEED + 3, 11);
  for (let i = 0; i < 100; i++) c.hsTick(0.1);
  const g0 = J(c, 'HS.graves.filter(g => g.used).length');
  ev(c, `hsKill(HS.people.find(p => p.alive && p.role === 'adult'))`);
  for (let i = 0; i < 1300; i++) c.hsTick(0.1);
  const g1 = J(c, 'HS.graves.filter(g => g.used).length'), fresh = J(c, 'HS.graves.filter(g => g.fresh > 0).length'), L = J(c, 'HS.Ls');
  check('graveyard: a death adds a fresh grave and a small gathering', (g1 === g0 + 1 || g0 === J(c, 'HS.graves.length')) && fresh >= 1 && L.burials === 1 && L.visits >= 2, [g0, g1, fresh, L.burials, L.visits]);
}

// ---------------------------------------------------------------- 5) after an attack, more repair work
{
  const c = world(SEED + 4, 9);
  for (let i = 0; i < 300; i++) c.hsTick(0.1);
  const r0 = J(c, 'HS.reps.filter(r => r.st < 3).length');
  ev(c, `(() => { const s = HF.walls.find(s => !s.gate && s.inT >= 0 && s.id % 11 === 5); s.pressure = 9; s.lastHit = HS.t; HS.forced = s; hsAlarm('test'); })()`);
  for (let i = 0; i < 100; i++) { ev(c, 'HS.forced.pressure = 9; HS.forced.lastHit = HS.t'); c.hsTick(0.1); }
  ev(c, 'HS.alarm = 0.05; for (const z of HS.zombies) if (z.st !== "dead" && (z.st === "wall" || z.st === "march" || z.st === "gate")) { z.st = "dead"; z.corpseT = 1; }'); let cleared = -1;
  for (let i = 0; i < 3000 && cleared < 0; i++) { c.hsTick(0.1); if (J(c, 'HS.alarm') <= 0) cleared = i; }
  for (let i = 0; i < 20; i++) c.hsTick(0.1);
  const r1 = J(c, 'HS.reps.filter(r => r.st < 3).length'), ad = J(c, 'HS.Ls.attackDamage || 0');
  for (let i = 0; i < 3000; i++) c.hsTick(0.1);
  const done = J(c, 'HS.Ls.houseRepairs');
  check('construction: an attack leaves houses to repair, and they get repaired', ad >= 1 && r1 >= r0 && done >= 1, [r0, r1, ad, done, cleared]);
}

// ---------------------------------------------------------------- 6) injured patients end up on a hospital cot and heal
{
  const c = world(SEED + 5, 10);
  ev(c, `(() => { const p = HS.people.find(p => p.alive && p.role === 'adult' && p.tier === 1) || HS.people.find(p => p.alive && p.role === 'farmer'); HS.pat = p; p.hp = 1; p.inj = 2; p.st = 'down'; p.task = { k: 'down', t: 0 }; p.path = null; })()`);
  let onCot = false; for (let i = 0; i < 2400; i++) { c.hsTick(0.1); if (!onCot && J(c, `HS.pat.task && HS.pat.task.k === 'bed' && HS.pat.task.ph === 'do' && lfZoneOf(HS.pat.x, HS.pat.y) === 'infirmary'`)) onCot = true; }
  check('hospital: an injured settler is fetched (stretcher), lies on a cot and heals', onCot && J(c, 'HS.pat.inj') === 0 && J(c, 'HS.Ls.stretcher') >= 1, [onCot, J(c, 'HS.pat.inj'), J(c, 'HS.Ls.stretcher')]);
}

// ---------------------------------------------------------------- 7) two game days: stable, nothing leaks, horses safe, determinism
{
  const run = (seed) => { const c = world(seed, 9); const bad = []; let maxReps = 0, horsesOut = 0;
    for (let i = 0; i < 24000; i++) { c.hsTick(0.1); if (i % 300 === 0) { const s = J(c, `({ nan: HS.people.some(p => !isFinite(p.x) || !isFinite(p.y)) || HS.horses.some(h => !isFinite(h.x)), reps: HS.reps.length, hOut: HS.horses.filter(h => h.st !== 'ridden' && h.st !== 'pack' && !(h.st === 'loose' && h.lt < 150) && !(HF.walk[tileOfW(h.x, h.y)] & W_IN)).length, open: HS.life > 21 && HS.stalls.some(s => s.open), hs: HS.horses.filter(h => h.st !== 'ridden' && h.st !== 'pack' && !(h.st === 'loose' && h.lt < 150) && !(HF.walk[tileOfW(h.x, h.y)] & W_IN)).map(h => h.st + '@' + Math.round(h.x) + ',' + Math.round(h.y)) })`); if (s.hs.length) bad.push('horse ' + s.hs.join(' ')); if (s.nan) bad.push('nan@' + i); if (s.open) bad.push('open@' + i); maxReps = Math.max(maxReps, s.reps); horsesOut = Math.max(horsesOut, s.hOut); } }
    return { c, bad, maxReps, horsesOut }; };
  const A = run(SEED + 6);
  const L = J(A.c, 'HS.Ls');
  check('long run: 2 game days with no NaN, stalls closed at night', A.bad.filter(b => !b.startsWith('horse')).length === 0, A.bad.slice(0, 5));
  check('long run: repairs do not pile up (<= 8 open jobs) and keep finishing', A.maxReps <= 8 && L.houseRepairs >= 8, [A.maxReps, L.houseRepairs]);
  check('long run: horses stay inside the wall unless ridden, packing or heading home (< 150 s)', A.horsesOut === 0, [A.horsesOut, A.bad.filter(b => b.startsWith('horse')).slice(0, 3)]);
  check('long run: traders pack up their stalls in the evening', L.packup >= 8 && L.setup >= 6, [L.setup, L.packup]);
  check('long run: rides keep happening day after day', L.rides >= 4, [L.rides, L.ridesChased, L.survivors, L.packHorse, L.unload]);
  check('long run: the population stays viable', J(A.c, 'HS.people.filter(p => p.alive).length') >= 100, J(A.c, 'HS.people.filter(p => p.alive).length'));
  const B = (() => { const c = world(SEED + 7, 9); for (let i = 0; i < 3000; i++) c.hsTick(0.1); return ev(c, 'JSON.stringify([HS.Ls, HS.stalls.map(s => s.stock), HS.horses.map(h => Math.round(h.x))])'); })();
  const B2 = (() => { const c = world(SEED + 7, 9); for (let i = 0; i < 3000; i++) c.hsTick(0.1); return ev(c, 'JSON.stringify([HS.Ls, HS.stalls.map(s => s.stock), HS.horses.map(h => Math.round(h.x))])'); })();
  check('deterministic for a seed', B === B2, [B.length, B2.length]);
}

console.log(JSON.stringify(rep, null, 1));
console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : `PASS (${Object.keys(rep).length - 2} checks)`);
process.exit(fails.length ? 1 : 0);
