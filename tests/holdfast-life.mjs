// Holdfast "does it feel alive" regression (Node, no browser, deterministic seeds, accelerated time).
// Congestion, independent movement, walking speeds, crop cycles, work outcomes, threat activity, guard response, long-run stability.
// Usage: node tests/holdfast-life.mjs [seconds=1200] [seed=7]
import { loadHF, ev } from './hf-load.mjs';
const SECS = +(process.argv[2] || 1200), SEED = +(process.argv[3] || 7);
const FILES = ['js/core.js', 'js/art.js', 'holdfast/hf-map.js', 'holdfast/hf-art.js', 'holdfast/hf-sim.js', 'holdfast/hf-work.js'];
const fails = [], rep = {};
const check = (name, ok, info) => { rep[name] = { ok: !!ok, info }; if (!ok) fails.push(name + ' ' + JSON.stringify(info)); };
const J = (c, e) => JSON.parse(ev(c, `JSON.stringify(${e})`));
function world(seed, danger, pop) { const c = loadHF(FILES); c.hfBuildMap(7); if (danger) ev(c, `HS.danger = '${danger}'`); c.hsInit({ seed: seed * 3 + 1, pop: pop || 120, hour: 9 }); return c; }

// ---- 1) a normal stretch of life: congestion, synchrony, speeds, crops, work, threat (one run, sampled every second)
{
  const c = world(SEED);
  // the camera looks at the default view: nothing may spawn inside it
  ev(c, `(() => { const [x, y] = d2w(482, 262), sx = x - y, sy = (x + y) / 2; HS.view = { x0: sx - 240, y0: sy - 135, x1: sx + 240, y1: sy + 135 }; })()`);
  ev(c, `globalThis.__L = { n: 0, crowdMax: 0, overlap: 0, pairs: new Map(), persist: 0, unrelated: 0, cells: new Map(), cellMax: 0, walkV: [], runV: [], maxStep: 0, plotSt: [], share: 0, zOut: 0, zBand: 0, born: new Set(HS.zombies.map(z => z.id)), spawnInView: 0, spawnInside: 0, lastSeen: new Map(), gap: [] };
    globalThis.__GROUP = new Set(['shelter', 'defend', 'exp', 'rescue', 'arrive', 'respond', 'fight', 'eat']);`);
  const probe = `(() => { const L = __L; L.n++;
    const ps = HS.people.filter(p => p.alive && p.vis && !p.onTower && isInside(p.x, p.y)), free = ps.filter(p => !(p.task && __GROUP.has(p.task.k)));
    // congestion (intentional gatherings excluded: meals, defence, shelter)
    let mx = 0, ms = 0; for (const a of free) { let n = 0, m = 0; for (const b of free) if (a !== b && (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < 144) { n++; if (!a.path && !b.path) m++; } mx = Math.max(mx, n); ms = Math.max(ms, m); } L.crowdMax = Math.max(L.crowdMax, mx); L.standMax = Math.max(L.standMax || 0, ms);
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) if ((ps[i].x - ps[j].x) ** 2 + (ps[i].y - ps[j].y) ** 2 < 4) L.overlap++;
    const cnt = new Map(); for (const p of free) { const k = (p.x / 24 | 0) + ',' + (p.y / 24 | 0); cnt.set(k, (cnt.get(k) || 0) + 1); }
    for (const [k, n] of cnt) if (n >= 6) { const r = (L.cells.get(k) || 0) + 1; L.cells.set(k, r); L.cellMax = Math.max(L.cellMax, r); } for (const k of [...L.cells.keys()]) if ((cnt.get(k) || 0) < 6) L.cells.delete(k);
    // synchrony: two walkers side by side, same heading, for 5+ s
    const w = free.filter(p => p.path && Math.hypot(p.x - p.px, p.y - p.py) > 0.001 && !p.arriving), now = new Set();
    for (let i = 0; i < w.length; i++) for (let j = i + 1; j < w.length; j++) { const a = w[i], b = w[j]; if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 > 196) continue; const ax = a.x - a.px, ay = a.y - a.py, bx = b.x - b.px, by = b.y - b.py; if ((ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by)) < 0.9) continue;
      const k = a.id + '-' + b.id; now.add(k); const r = (L.pairs.get(k) || 0) + 1; L.pairs.set(k, r); if (r === 5) { L.persist++; if (a.role !== b.role && a.home.b !== b.home.b) L.unrelated++; } }
    for (const k of [...L.pairs.keys()]) if (!now.has(k)) L.pairs.delete(k);
    // speeds: displacement over the last tick of steady walkers / runners (no ease-in)
    for (const p of ps) { const v = Math.hypot(p.x - p.px, p.y - p.py) / 0.1; if (p.path && !p.path.direct && p.vk >= 1 && !p.inj && v > 0.5 && p.role !== 'kid' && p.role !== 'elder' && HS.weather !== 'rain') (p.path.run ? L.runV : L.walkV).push(v); }
    // crops: stage mix and the gap between visible changes of each active plot
    const sc = [0, 0, 0, 0, 0, 0]; for (const P of HS.plots) { sc[P.st]++; const key = P.st + '|' + Math.floor(P.prog * 5); const ls = L.lastSeen.get(P.id); if (!ls || ls[0] !== key) { if (ls && P.st >= 1 && P.st <= 4) L.gap.push(HS.t - ls[1]); L.lastSeen.set(P.id, [key, HS.t]); } }
    const sh = Math.max(...sc) / HS.plots.length; L.share = Math.max(L.share, sh); if (HS.life >= 6 && HS.life < 21) L.dayShare = Math.max(L.dayShare || 0, sh);
    // infected: density, the band the default camera sees, and where newcomers appear
    const zs = HS.zombies.filter(z => z.st !== 'dead'); L.zOut += zs.filter(z => !isInside(z.x, z.y)).length; L.zBand += zs.filter(z => hsBand(z)).length;
    for (const z of HS.zombies) if (!L.born.has(z.id)) { L.born.add(z.id); if (hsInView(z.x, z.y, 0)) L.spawnInView++; if (isInside(z.x, z.y)) L.spawnInside++; }
  })()`;
  const st0 = J(c, 'HS.stats.attacks.minor');
  for (let s = 0; s < SECS; s++) { for (let i = 0; i < 10; i++) { c.hsTick(0.1); if (i === 9) continue; ev(c, `for (const p of HS.people) if (p.alive && !p.onTower && !p.exp && !p.rescue && !p.arriving && p.vis) { const d = Math.hypot(p.x - p.px, p.y - p.py); if (d > __L.maxStep) __L.maxStep = d; }`); } ev(c, probe); }
  const L = J(c, `(() => { const L = __L, med = a => { a = a.slice().sort((x, y) => x - y); return a.length ? +a[a.length >> 1].toFixed(2) : 0; }, pct = (a, q) => { a = a.slice().sort((x, y) => x - y); return a.length ? +a[Math.floor(a.length * q)].toFixed(1) : 0; };
    return { crowdMax: L.crowdMax, standMax: L.standMax, overlapPerS: +(L.overlap / L.n).toFixed(2), cellMaxS: L.cellMax, persistPerMin: +(L.persist / L.n * 60).toFixed(2), unrelatedPerMin: +(L.unrelated / L.n * 60).toFixed(2),
      walk: med(L.walkV), run: med(L.runV), maxStep: +L.maxStep.toFixed(2), stageShareMax: +L.share.toFixed(2), dayShareMax: +(L.dayShare || 0).toFixed(2), gapMed: med(L.gap), gap90: pct(L.gap, 0.9),
      plotsChanged: HS.plots.filter(P => P.changes >= 4).length, plots: HS.plots.length, zOut: +(L.zOut / L.n).toFixed(1), zBand: +(L.zBand / L.n).toFixed(1), spawnInView: L.spawnInView, spawnInside: L.spawnInside, spawned: L.born.size,
      work: HS.stats.work, minor: HS.stats.attacks.minor, store: HS.store, alarmShare: 0 }; })()`);
  rep.life = L;
  check('congestion: no standing crowd of > 10 around anyone (outside meals/defence; old code 29)', L.standMax <= 10, L.standMax);
  check('congestion: even with passers-by, never > 16 within 12 units', L.crowdMax <= 16, L.crowdMax);
  check('congestion: settlers rarely overlap (< 1 pair closer than 2 units per second)', L.overlapPerS < 1, L.overlapPerS);
  check('congestion: no 24-unit cell holds 6+ people for more than 60 s', L.cellMaxS <= 60, L.cellMaxS);
  check('independence: few synchronized walking pairs (< 8 per minute lasting 5 s; old code ~19-21)', L.persistPerMin < 8, L.persistPerMin);
  check('independence: unrelated settlers rarely walk in lockstep (< 3 per minute; old code 2.5-5.3)', L.unrelatedPerMin < 3, L.unrelatedPerMin);
  check('speed: adult walking 8.5-11 units/s (was ~6.9)', L.walk >= 8.5 && L.walk <= 11, L.walk);
  check('speed: running ~16 units/s', L.run >= 14.5 && L.run <= 18.5, L.run);
  check('speed: no teleport (max step per 0.1 s tick < 2 units)', L.maxStep < 2, L.maxStep);
  check('crops: every plot cycles (>= 4 visible stage changes)', L.plotsChanged >= L.plots * 0.9, [L.plotsChanged, L.plots]);
  check('crops: active plots change visibly every ~20-30 s (median gap)', L.gapMed >= 18 && L.gapMed <= 32, [L.gapMed, L.gap90]);
  check('crops: fields not synchronized in daylight (no stage holds > 50 % of plots, 06-21 h)', L.dayShareMax <= 0.5, L.dayShareMax);
  check('crops: never more than 70 % of plots in one stage, even overnight', L.stageShareMax <= 0.7, L.stageShareMax);
  const W = L.work, k = SECS / 1200;
  check('work: farmers harvest, replant and deliver', W.harvests >= 40 * k && W.plantings >= 40 * k && W.deliveries >= 60 * k, [W.harvests, W.plantings, W.deliveries]);
  check('work: fishers catch and land fish', W.fishCaught >= 40 * k && W.fishDelivered >= 30 * k, [W.fishCaught, W.fishDelivered]);
  check('work: cooks cook, serve, people eat', W.cooked >= 8 * k && W.served >= 5 * k && W.eaten >= 25 * k, [W.cooked, W.served, W.eaten]);
  check('work: supplies hauled between buildings', W.hauls >= 20 * k, W.hauls);
  check('work: builders build and salvage materials', W.builds >= 10 * k && W.salvage >= 15 * k, [W.builds, W.salvage]);
  check('work: stores stay within limits', Object.entries(L.store).every(([s, n]) => n >= 0 && n <= ({ food: 40, fish: 24, kitchen: 10, pot: 3, meals: 16, mat: 24, yard: 18, market: 10 })[s]), L.store);
  check('threat: wilderness busy (>= 28 roaming infected on average)', L.zOut >= 28, L.zOut);
  check('threat: frontier band visible from the default camera (>= 8 on average)', L.zBand >= 8, L.zBand);
  check('threat: frequent small encounters (>= 1 per minute)', L.minor >= SECS / 60, L.minor);
  check('threat: small groups form and break up', W.packs >= 15 * k, W.packs);
  check('threat: guards respond to infected near the wall', W.responses >= 20 * k && W.respShots >= 30 * k, [W.responses, W.respShots]);
  check('threat: nothing spawns inside the camera view', L.spawnInView === 0, [L.spawnInView, L.spawned]);
  check('threat: nothing spawns inside the walls', L.spawnInside === 0, L.spawnInside);
}

// ---- 2) cause -> effect: a damaged wall gets planks and is repaired; a probe at the wall draws responders
{
  const c = world(SEED + 1);
  for (let i = 0; i < 300; i++) c.hsTick(0.1);
  const r = J(c, `(() => { const s = HF.walls.find(q => !q.gate && q.inT >= 0 && q.id % 7 === 3); s.hp = 4; const mat0 = HS.store.mat, hp0 = HS.stats.work.repairHp; for (let i = 0; i < 1500 && s.hp < s.max; i++) hsTick(0.1);
    return { hp: s.hp, max: s.max, secs: Math.round(HS.t), mat0, mat: HS.store.mat, hpGained: HS.stats.work.repairHp - hp0 }; })()`);
  rep.repair = r;
  check('builders: a damaged wall section is repaired within 150 s', r.hp === r.max, r);
  const g = J(c, `(() => { const s = HF.walls.slice(HF.towers[3].seg + 4).find(q => !q.gate && q.outT >= 0), [x, y] = tileC(s.outT); HS.zombies = HS.zombies.filter(z => z.st === 'dead'); for (const p of HS.people) if (p.task && (p.task.k === 'respond' || p.task.k === 'defend')) p.task = null; HS.alarm = 0; HS.next.minor = HS.next.medium = HS.next.major = HS.next.siege = HS.next.pack = HS.t + 999; const zs = []; for (let i = 0; i < 5; i++) { const z = hsAddZ(x + rr2(-30, 30), y - 60 + rr2(-10, 10)); hsToWall(z, s); zs.push(z); }
    const r0 = HS.stats.work.responses; let seen = 0, t = 0; for (let i = 0; i < 600; i++) { hsTick(0.1); if (!seen && HS.people.some(p => p.alive && p.task && (p.task.k === 'respond' || p.task.k === 'defend') && dist(p, s) < 90)) { seen = 1; t = i / 10; } }
    return { responded: seen, after: t, responses: HS.stats.work.responses - r0, alive: zs.filter(z => z.st !== 'dead').length }; })()`);
  rep.guards = g;
  check('guards: an attack on a wall section gets a guard response within 30 s', g.responded && g.after <= 30, g);
  check('guards: the attackers are dealt with within 60 s', g.alive === 0, g);
}

// ---- 3) danger modes and device tuning scale the wilderness
{
  const dens = {}; for (const d of ['calm', 'standard', 'grim']) { const c = world(SEED, d); for (let i = 0; i < 3000; i++) c.hsTick(0.1); dens[d] = J(c, `HS.zombies.filter(z => z.st !== 'dead' && !isInside(z.x, z.y)).length`); }
  const c = world(SEED, 'standard', 70); for (let i = 0; i < 3000; i++) c.hsTick(0.1); dens.mobile = J(c, `[HS.zScale, HS.zombies.filter(z => z.st !== 'dead' && !isInside(z.x, z.y)).length]`);
  rep.density = dens;
  check('danger: calm < standard < grim', dens.calm < dens.standard && dens.standard < dens.grim, dens);
  check('device: small populations (phones) get fewer infected', dens.mobile[0] < 1 && dens.mobile[1] < dens.standard, dens);
}

// ---- 4) long accelerated run: still stable and still alive after two game days
{
  const c = world(SEED + 2); const T0 = Date.now(); let bad = 0; const late = [];
  for (let s = 0; s < 2400; s++) { for (let i = 0; i < 10; i++) c.hsTick(0.1); if (s % 30 === 0) { const r = J(c, `[HS.people.filter(p => p.alive && (!isFinite(p.x) || !isFinite(p.y))).length + HS.zombies.filter(z => !isFinite(z.x)).length, HS.stats.work.stage, HS.stats.work.harvests, HS.zombies.length, HS.people.filter(p => p.alive).length]`); bad += r[0]; if (s >= 1800) late.push(r); } }
  const fin = J(c, `({ alive: HS.people.filter(p => p.alive).length, floor: HS.floor, z: HS.zombies.length, spots: [...HS.spots.values()].every(v => v >= 0), zone: HS.zoneN, store: HS.store })`);
  rep.long = { ms: Date.now() - T0, fin, lateStages: late[late.length - 1][1] - late[0][1], lateHarvests: late[late.length - 1][2] - late[0][2] };
  check('long: no NaN positions over 2 game days', bad === 0, bad);
  check('long: crops still cycling in the last 10 minutes', rep.long.lateStages >= 60 && rep.long.lateHarvests >= 10, [rep.long.lateStages, rep.long.lateHarvests]);
  check('long: population viable, infected bounded', fin.alive >= fin.floor && fin.z < 220, fin);
  check('long: spot / zone claims never go negative or leak', fin.spots && Object.values(fin.zone).every(v => v >= 0 && v <= 60), fin.zone);
}

// ---- 5) determinism
{
  const run = () => { const c = world(SEED); for (let i = 0; i < 2000; i++) c.hsTick(0.1); return ev(c, 'JSON.stringify([HS.stats.work, HS.plots.map(P => P.st).join(""), Math.round(HS.people[9].x * 100)])'); };
  const a = run(), b = run(); check('determinism: same seed, same work and crops', a === b, a === b ? 'same' : [a, b]);
}

console.log(JSON.stringify(rep, null, 1));
console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'PASS (' + Object.keys(rep).filter(k => rep[k].ok !== undefined).length + ' checks)');
process.exit(fails.length ? 1 : 0);
