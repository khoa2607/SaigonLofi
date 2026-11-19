// Holdfast dock geometry + navigation + river activities. Node only, deterministic.
// Usage: node tests/holdfast-docks.mjs [seed=7]
import { loadHF, ev } from './hf-load.mjs';
const FILES = ['js/core.js', 'js/art.js', 'holdfast/hf-map.js', 'holdfast/hf-art.js', 'holdfast/hf-past-art.js', 'holdfast/hf-sim.js', 'holdfast/hf-work.js', 'holdfast/hf-life.js', 'holdfast/hf-past.js'];
const SEED = +(process.argv[2] || 7), fails = [];
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name, info === undefined ? '' : ' ' + JSON.stringify(info)); if (!ok) fails.push(name); };

function audit(era) {
  const c = loadHF(FILES); c.hfBuildMap(SEED, era); c.hsInit({ seed: 22, pop: 120, hour: 9 });
  const geom = ev(c, `HF.docks.map((d, i) => {
    const at = t => { const p = dockPoint(d, t), k = tileOfW(p[0], p[1]); return { x: p[0], y: p[1], g: HF.gk[k], z: HF.zone[k], w: HF.walk[k] }; };
    const start = at(0), end = at(d.len), before = at(-8), target = tileOfW(end.x, end.y), flow = hfFlow('in', target), approach = tileOfW(before.x, before.y);
    let continuous = true; for (let t = 0; t <= d.len; t += 2) { const p = dockPoint(d, t); if (!(HF.walk[tileOfW(p[0], p[1])] & W_DOCK)) continuous = false; }
    const fish = HF.spots.fish.slice(i * 2, i * 2 + 2).map(s => { const k = tileOfW(s.x, s.y); return { dock: !!(HF.walk[k] & W_DOCK), reachable: flow[k] >= 0, water: HF.gk[k] === GK.WATER }; });
    return { i, axis: d.axis, len: d.len, start, end, before, continuous, approachReachable: flow[approach] >= 0, fish, art: PROPS.dock(d).length };
  })`);
  const moor = ev(c, `HF.moor.map(m => ({ i: m.i, water: HF.gk[tileOfW(m.bx, m.by)] === GK.WATER, dockEnd: !!(HF.walk[tileOfW(m.x, m.y)] & W_DOCK), dist: +m.dist.toFixed(1) }))`);
  const river = ev(c, `({ bathe: HF.spots.bathe.length, wash: HF.spots.wash.length, bankfish: HF.spots.bankfish.length, dry: [...HF.spots.bathe, ...HF.spots.wash, ...HF.spots.bankfish].every(s => HF.gk[tileOfW(s.x, s.y)] !== GK.WATER && !(HF.walk[tileOfW(s.x, s.y)] & W_DOCK)) })`);
  const boat = ev(c, `(() => {
    const M = HF.cargoMoor, pool = HS.people.filter(p => ['trader','tech','adult','farmer'].includes(p.role)); pool.forEach(p => { p.task = null; p.load = null; p.inj = 0; });
    const b = lfBoatLaunch(0); b.kind = 'cargo'; b.moor = M; b.fwd = true; b.s = M.s - 2; b.st = 'go'; b.t = 0; b.spd = 10; lfBoat(b, 0.3);
    const arrived = b.st === 'moored', called = !!b.crew, end = called && b.crew.task && b.crew.task.legs[0];
    for (let n = 0; n < 1000; n++) hsTick(0.1);
    return { arrived, called, endDock: !!(end && (HF.walk[tileOfW(end.x, end.y)] & W_DOCK)), delivered: HS.Ls.cargoDeliver > 0, departed: b.st === 'go' && !b.moor };
  })()`);
  return { geom, moor, river, boat };
}

for (const era of ['current', 'past']) {
  const A = audit(era), tag = era.toUpperCase();
  check(tag + ': three docks follow west/centre/east bank normals', A.geom.map(d => d.axis).join() === 'xy,y,x', A.geom.map(d => [d.axis, d.len]));
  check(tag + ': every landward end is on dry walkable land', A.geom.every(d => d.start.g !== 13 && (d.start.w & 1) && d.before.g !== 13), A.geom.map(d => [d.start.g, d.start.w, d.before.g]));
  check(tag + ': every outer end extends over water', A.geom.every(d => d.end.g === 13 && (d.end.w & 16)), A.geom.map(d => [d.end.g, d.end.w]));
  check(tag + ': dock walk flags are continuous and reachable from land', A.geom.every(d => d.continuous && d.approachReachable), A.geom.map(d => [d.continuous, d.approachReachable]));
  check(tag + ': all fishing spots stay on reachable dock tiles', A.geom.every(d => d.fish.every(s => s.dock && s.reachable)), A.geom.map(d => d.fish));
  check(tag + ': dock artwork exists for all three orientations', A.geom.every(d => d.art >= 5), A.geom.map(d => d.art));
  check(tag + ': moorings are in open water beside dock ends', A.moor.every(m => m.water && m.dockEnd), A.moor);
  check(tag + ': bathing, washing and bank-fishing spots stay on dry bank', A.river.bathe >= 3 && A.river.wash >= 3 && A.river.bankfish >= 4 && A.river.dry, A.river);
  check(tag + ': cargo boat arrives, calls dock crew, unloads and departs', Object.values(A.boat).every(Boolean), A.boat);
}

console.log(fails.length ? '\nFAIL\n - ' + fails.join('\n - ') : '\nPASS');
process.exit(fails.length ? 1 : 0);
