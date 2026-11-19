// Holdfast warm-start regression (Node, no browser): the world must already be alive at its very first state.
// Usage: node tests/holdfast-warm.mjs [seeds=8]
import { loadHF, ev } from './hf-load.mjs';
const SEEDS = +(process.argv[2] || 8);
const FILES = ['js/core.js', 'js/art.js', 'holdfast/hf-map.js', 'holdfast/hf-art.js', 'holdfast/hf-sim.js', 'holdfast/hf-work.js', 'holdfast/hf-life.js'];
const fails = [], rep = {};
const check = (name, ok, info) => { rep[name] = { ok: !!ok, info }; if (!ok) fails.push(name + ' ' + JSON.stringify(info)); };
const J = (c, e) => JSON.parse(ev(c, `JSON.stringify(${e})`));
const worst = { clusterShare: 0, minTowerMen: 99, minWorkers: 99, minZSpread: 1e9, ms: 0, offGrid: 0, walkers: 99, wallBodies: 0 };

for (let i = 0; i < SEEDS; i++) {
  const seed = 100 + i * 17, c = loadHF(FILES); c.hfBuildMap(7);
  const t0 = Date.now(); c.hsInit({ seed, pop: 120 }); const ms = Date.now() - t0; worst.ms = Math.max(worst.ms, ms);
  const s = J(c, `(() => {
    const live = HS.people.filter(p => p.alive && p.vis !== false), all = HS.people;
    // nobody shares one spawn point: the biggest 24-unit cell holds at most a small share of the visible people
    const cell = new Map(); for (const p of live) { const k = Math.floor(p.x / 24) + ',' + Math.floor(p.y / 24); cell.set(k, (cell.get(k) || 0) + 1); }
    const biggest = Math.max(...cell.values());
    const byTask = {}; for (const p of live) { const k = p.onTower ? 'tower' : (p.task ? p.task.k : 'none'); byTask[k] = (byTask[k] || 0) + 1; }
    const onShiftTowerGuards = all.filter(p => p.role === 'guard' && p.post && p.post.k === 'tower' && onShift(p));
    const towerSeated = onShiftTowerGuards.filter(p => p.onTower && p.onTower.climb >= 1 && p.z > 40).length;
    const patrols = all.filter(p => p.role === 'guard' && p.post && p.post.k === 'patrol' && onShift(p));
    const gate = all.filter(p => p.role === 'guard' && p.post && p.post.k === 'gate' && onShift(p));
    const gatePos = tileC(HF.gate.inTile);
    const farmers = all.filter(p => p.role === 'farmer' && p.task && p.task.k === 'work' && p.task.ph === 'do');
    const fishers = all.filter(p => p.role === 'fisher' && p.task && p.task.k === 'work' && p.task.ph === 'do');
    const walking = live.filter(p => p.path && p.st === 'walk').length;
    const out = HS.zombies.filter(z => z.st !== 'dead' && !isInside(z.x, z.y)), ins = HS.zombies.filter(z => z.st !== 'dead' && isInside(z.x, z.y));
    let zx = 0, zy = 0; for (const z of out) { zx += z.x; zy += z.y; } zx /= out.length; zy /= out.length; let zs = 0; for (const z of out) zs += Math.hypot(z.x - zx, z.y - zy); zs /= out.length;
    let off = 0; for (const a of [...all, ...HS.zombies, ...HS.wild]) { if (!isFinite(a.x) || !isFinite(a.y) || a.x < 0 || a.y < 0 || a.x > HW || a.y > HW) off++; const k = tileOfW(a.x, a.y); if (a.role && !a.onTower && a.alive !== false && !hfPass(k, 'all') && hfNearPass(a.x, a.y, 'all', 2) < 0) off++; }
    // actors never start inside a wall tile
    const synced = [...all, ...HS.zombies, ...HS.wild].every(a => a.px === a.x && a.py === a.y);
    return { n: live.length, biggest, byTask, towerGuards: onShiftTowerGuards.length, towerSeated, patrols: patrols.length, patrolSpread: new Set(patrols.map(p => Math.floor(p.x / 40) + ',' + Math.floor(p.y / 40))).size,
      gateGuards: gate.length, gateAtPost: gate.filter(p => Math.hypot(p.x - gatePos[0], p.y - gatePos[1]) < 40).length,
      farmers: farmers.length, farmersAllFarmers: all.filter(p => p.role === 'farmer').length, fishers: fishers.length, walking,
      zOut: out.length, zIn: ins.length, zSpread: zs, band: HS.zombies.filter(z => z.band).length, wild: HS.wild.length, off, synced, exps: HS.exps.length, expPh: HS.exps.map(e => e.ph), log: HS.log.length, hour: HS.hour, day: HS.day, t: HS.t };
  })()`);
  worst.clusterShare = Math.max(worst.clusterShare, s.biggest / s.n); worst.minTowerMen = Math.min(worst.minTowerMen, s.towerSeated);
  worst.minWorkers = Math.min(worst.minWorkers, s.farmers + s.fishers); worst.minZSpread = Math.min(worst.minZSpread, s.zSpread); worst.offGrid += s.off; worst.walkers = Math.min(worst.walkers, s.walking);
  check(`seed ${seed}: all tower guards on shift are already in their towers`, s.towerGuards > 0 && s.towerSeated === s.towerGuards, [s.towerSeated, s.towerGuards]);
  check(`seed ${seed}: gate guards are at the gate`, s.gateGuards === 0 || s.gateAtPost === s.gateGuards, [s.gateAtPost, s.gateGuards]);
  check(`seed ${seed}: patrols spread along the wall`, s.patrols < 2 || s.patrolSpread >= Math.min(s.patrols, 3), [s.patrols, s.patrolSpread]);
  const meal = (s.hour >= 11.8 && s.hour < 12.9) || (s.hour >= 18.3 && s.hour < 19.2);    // at mealtimes they are legitimately eating, not hoeing
  check(`seed ${seed}: farmers working in the fields (or at the meal)`, meal || s.farmers >= Math.floor(s.farmersAllFarmers * 0.6), [s.farmers, s.farmersAllFarmers, +s.hour.toFixed(1)]);
  check(`seed ${seed}: no shared spawn point (largest cell share < 12%)`, s.biggest / s.n < 0.12, [s.biggest, s.n]);
  check(`seed ${seed}: people mid-walk exist (life, not a tableau)`, s.walking >= 5, s.walking);
  check(`seed ${seed}: infected spread over the wilderness, none inside`, s.zOut >= 20 && s.zIn === 0 && s.zSpread > 90, [s.zOut, s.zIn, Math.round(s.zSpread)]);
  check(`seed ${seed}: frontier band already populated`, s.band >= 5, s.band);
  check(`seed ${seed}: positions valid and previous==current (no first-frame slide)`, s.off === 0 && s.synced, [s.off, s.synced]);
  check(`seed ${seed}: no chronicle/day-1 start`, s.log === 0 && s.t === 0, [s.log, s.t]);
  check(`seed ${seed}: warm start is cheap (<250 ms)`, ms < 250, ms);
  if (i === 0) rep.sample = s;
}

// determinism: same seed -> identical first state; different seed -> different
{
  const sig = seed => { const c = loadHF(FILES); c.hfBuildMap(7); c.hsInit({ seed, pop: 120 }); return J(c, `HS.people.map(p => [Math.round(p.x), Math.round(p.y), p.task ? p.task.k : '']).concat(HS.zombies.map(z => [Math.round(z.x), Math.round(z.y)])).concat([HS.hour])`); };
  const a = JSON.stringify(sig(321)), b = JSON.stringify(sig(321)), d = JSON.stringify(sig(322));
  check('deterministic per seed', a === b); check('different seeds differ', a !== d);
}
// the explicit hour option is honoured; default start hour is a daytime moment
{
  const c = loadHF(FILES); c.hfBuildMap(7); c.hsInit({ seed: 5, pop: 120, hour: 20.5 }); check('hour option honoured', Math.abs(J(c, 'HS.hour') - 20.5) < 0.05, J(c, 'HS.hour'));
  const hrs = []; for (let s = 1; s <= 12; s++) { const c2 = loadHF(FILES); c2.hfBuildMap(7); c2.hsInit({ seed: s, pop: 60 }); hrs.push(J(c2, 'HS.hour')); }
  check('default start hours are daytime and varied', hrs.every(h => h > 6.9 && h < 17.3) && new Set(hrs.map(h => Math.round(h))).size >= 5, hrs.map(h => +h.toFixed(1)));
}
// every danger level and a small population still warm-start cleanly
for (const [danger, pop] of [['calm', 120], ['grim', 120], ['standard', 70]]) {
  const c = loadHF(FILES); c.hfBuildMap(7); c.ev = ev; ev(c, `HS.danger = ${JSON.stringify(danger)}`); c.hsInit({ seed: 9, pop });
  const r = J(c, `({ people: HS.people.length, z: HS.zombies.filter(z => z.st !== 'dead').length, nan: [...HS.people, ...HS.zombies].some(a => !isFinite(a.x)) })`);
  check(`warm start ${danger}/${pop}`, r.people >= pop * 0.9 && r.z >= 10 && !r.nan, r);
}
// the world keeps behaving after the warm start: 3 minutes, nothing breaks
{
  const c = loadHF(FILES); c.hfBuildMap(7); c.hsInit({ seed: 77, pop: 120 }); let bad = 0, firstJump = 0;
  const p0 = J(c, 'HS.people.map(p => [p.x, p.y])'); c.hsTick(0.1); const p1 = J(c, 'HS.people.map(p => [p.x, p.y])');
  for (let i = 0; i < p0.length; i++) firstJump = Math.max(firstJump, Math.hypot(p0[i][0] - p1[i][0], p0[i][1] - p1[i][1]));
  for (let i = 0; i < 1800; i++) { c.hsTick(0.1); if (i % 100 === 0 && J(c, '[...HS.people, ...HS.zombies].some(a => !isFinite(a.x) || !isFinite(a.y))')) bad++; }
  check('no teleport on the first tick (max step < 3 units)', firstJump < 3, +firstJump.toFixed(2));
  check('3 minutes after warm start: sane', bad === 0 && J(c, 'HS.people.filter(p => p.alive).length') >= 100, bad);
}
rep.worst = worst;
console.log(JSON.stringify(rep, null, 1)); console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'PASS'); process.exit(fails.length ? 1 : 0);
