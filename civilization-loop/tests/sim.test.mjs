// Deterministic tests for the civilization simulation (Node only, no packages). Run: node tests/sim.test.mjs
import { createSim, step, runYears, runMonths, summary, stateHash, serialize, deserialize, describeTile, forestCover } from '../src/sim.js';
import { N, G } from '../src/world.js';
import { BT } from '../src/buildings.js';

let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
const count = (a, f) => { let n = 0; for (let i = 0; i < a.length; i++) if (f(a[i], i)) n++; return n; };
const finite = S => [S.pop, S.stability, ...Object.values(S.res)].every(Number.isFinite);

// ---- determinism and time independence
{
  const a = createSim(5), b = createSim(5), c = createSim(6); runYears(a, 300); runYears(b, 300); runYears(c, 300);
  check('determinism: the same seed gives the same history', stateHash(a) === stateHash(b), [stateHash(a), stateHash(b)]);
  check('determinism: a different seed gives a different history', stateHash(a) !== stateHash(c));
  const d = createSim(5); for (let i = 0; i < 300; i++) { runMonths(d, 7); runMonths(d, 5); }   // stepping in uneven chunks (as different frame rates would) changes nothing
  check('time: the result does not depend on how the steps are batched (frame-rate independent)', stateHash(a) === stateHash(d));
}
// ---- invariants over long runs
{
  const seeds = [1, 2, 3, 4, 5, 6], res = [];
  for (const sd of seeds) {
    const S = createSim(sd); let ok = true, maxPop = 0, minRes = 1e9, consistent = true;
    for (let y = 0; y < 800 && ok; y++) {
      runYears(S, 1); ok = finite(S) && S.pop >= 0 && S.pop < 20000 && Object.values(S.res).every(v => v >= 0); maxPop = Math.max(maxPop, S.pop);
      if (y % 40 === 0) { const W = S.world; for (let t = 0; t < N * N; t++) { if (W.bld[t] >= 0) { const b = S.buildings[W.bld[t]]; if (!b || b.ruined || t % N < b.x || t % N >= b.x + b.w) consistent = false; } if (W.ground[t] === G.WATER && (W.bld[t] >= 0 || W.tree[t])) consistent = false; } }
    }
    res.push({ sd, ok, consistent, maxPop: Math.round(maxPop), civ: S.civ.n, buildings: S.buildings.length });
  }
  check('invariants: finite, non-negative, bounded, footprints consistent (6 seeds x 800 years)', res.every(r => r.ok && r.consistent), res);
}
// ---- development depends on conditions, not on time
{
  const good = [1, 2, 3].map(sd => { const S = createSim(sd); runYears(S, 120); return S.stage; });
  check('progress: with fertile land the settlement reaches village or town within 120 years', good.filter(s => s >= 2).length >= 2, good);
  const poor = createSim(1); poor.world.fert.fill(0.02); for (let t = 0; t < N * N; t++) poor.world.soil[t] = 0.3; runYears(poor, 300);
  check('progress: barren land keeps it small however long it waits (conditions, not elapsed time)', poor.stage <= 1 && poor.pop < 60, { stage: poor.stage, pop: Math.round(poor.pop) });
  const S = createSim(2); runYears(S, 80); const a = summary(S);
  check('functional buildings: houses shelter people, farms feed, storage raises caps, wells give water, workshops raise output',
    S.buildings.some(b => b.type === 'house' && b.done && b.occ > 0) && S.buildings.some(b => b.type === 'farm' && b.done && b.yield > 0) && S.cap.food > 80 && S.buildings.some(b => b.type === 'well' && b.done) && S.buildings.some(b => b.type === 'workshop' && b.done) && S.capHousing > 20,
    { cap: S.cap, housing: S.capHousing, types: [...new Set(S.buildings.filter(b => b.done).map(b => b.type))] });
}
// ---- the land remembers
{
  const S = createSim(3); runYears(S, 120); const W = S.world, cleared = [];
  for (let t = 0; t < N * N; t++) if (W.clearedYear[t] > -9000 && W.tree[t] === 0 && W.bld[t] < 0 && W.ground[t] === G.GRASS) cleared.push(t);
  runYears(S, 10); const still = cleared.filter(t => W.tree[t] === 0).length;
  check('memory: harvested forest stays depleted (logging removes trees, regrowth is slow)', S.stats.cut > 50 && cleared.length > 5 && still / cleared.length > 0.7, { cut: S.stats.cut, cleared: cleared.length, stillBare: still });
  const roads = count(W.road, v => v > 0), fields = count(W.farmed, v => v > 0);
  check('memory: roads and fields exist and are kept in the world', roads > 5 && fields > 9, { roads, fields });
  // force the end of the settlement and see what the land keeps
  const beforeB = S.buildings.filter(b => b.done && !b.ruined).length; S.pop = 0.2; runYears(S, 1); const status = S.civ.status;
  S.gapLeft = 12 * 90; runYears(S, 70);
  const ruins = count(W.ruin, v => v > 0), abandonedFields = count(W.farmed, v => v === 2), roads2 = count(W.road, v => v > 0);
  check('collapse: the civilization ends, buildings are left to decay into ruins (not erased)', status === 'gap' && S.stats.collapsed > 0 && ruins > 5 && S.buildings.filter(b => b.ruined).length > beforeB * 0.3, { status, collapsed: S.stats.collapsed, ruinTiles: ruins, before: beforeB });
  check('memory: abandoned fields and roads remain visible', abandonedFields > 0 && roads2 >= roads, { abandonedFields, roads, roads2 });
  check('memory: nature reclaims (the forest regrows on abandoned land)', forestCover(S) >= 0.3 || count(W.tree, v => v > 0) > 40, { forest: forestCover(S).toFixed(2) });
  const t0 = (() => { for (let t = 0; t < N * N; t++) if (W.ruin[t]) return t; return -1; })(); const lines = describeTile(S, t0 % N, (t0 / N) | 0);
  check('inspection: a ruin can be asked what it was', lines.some(l => /Ruins|Foundations/.test(l)), lines);
}
// ---- inheritance: a new civilization arrives, finds the ruins and builds on them
{
  const out = [];
  for (const sd of [1, 2, 3, 4]) {
    const S = createSim(sd); runYears(S, 100); S.pop = 0.2; runYears(S, 1); S.gapLeft = 12 * 40; runYears(S, 45);
    const n = S.civ.n; runYears(S, 120);
    const reused = S.buildings.filter(b => b.civ === 2 && b.reuse > 0).length, onRuins = S.log.some(l => /foundations of an older/.test(l.text)), salv = S.stats.salvaged;
    out.push({ sd, civ: S.civ.n, reused, salv: Math.round(salv), hasFarms: S.unlocked.farming });
  }
  check('inheritance: a second civilization arrives and reuses old foundations in most worlds', out.every(o => o.civ >= 2) && out.filter(o => o.reused > 0).length >= 3, out);
  check('inheritance: newcomers recognise the old fields (farming is known from the start)', out.every(o => o.hasFarms));
}
// ---- environment and events
{
  const tot = { floods: 0, fires: 0, droughts: 0, plagues: 0 }; let floodMarks = 0, burntSeen = 0, declines = 0;
  for (const sd of [1, 2, 3, 4, 5, 6]) { const S = createSim(sd); let peak = 0, dec = false; for (let y = 0; y < 700; y++) { runYears(S, 1); peak = Math.max(peak, S.pop); if (peak > 60 && S.pop < peak * 0.55) dec = true; } for (const k of Object.keys(tot)) tot[k] += S.stats[k]; floodMarks += count(S.world.flood, v => v > 0); burntSeen += count(S.world.burntYear, v => v > -9000); if (dec) declines++; }
  check('events: floods, fires and droughts all occur over a few centuries', tot.floods > 3 && tot.fires > 3 && tot.droughts > 3, tot);
  check('events: floods leave permanent marks, fires leave scorched ground records', floodMarks > 20 && burntSeen > 20, { floodMarks, burntSeen });
  check('decline: populations rise and fall (a >45% fall from the peak happens in most worlds)', declines >= 3, { declines });
}
// ---- save and load
{
  const a = createSim(9); runYears(a, 150); const b = deserialize(serialize(a)); check('save: a world round-trips exactly', stateHash(a) === stateHash(b));
  runYears(a, 60); runYears(b, 60); check('save: a loaded world continues identically', stateHash(a) === stateHash(b), [stateHash(a), stateHash(b)]);
}
// ---- starting point
{
  const S = createSim(1), a = summary(S);
  check('start: 10 settlers, a shelter, food, a forest, water and room to grow', Math.round(S.pop) === 10 && S.buildings.length === 1 && a.res.food > 0 && S.forest0 > 100 && S.world.ground.some(g => g === G.WATER) && S.world.fert.some(f => f > 0.8));
}
console.log(fails ? `\nFAIL (${fails})` : '\nPASS'); process.exit(fails ? 1 : 0);
