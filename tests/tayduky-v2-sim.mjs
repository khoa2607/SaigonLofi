// Tây Du Ký v2 living world, simulation only (Node, no browser): runs the DOM-free modules for N simulated seconds and checks with numbers:
// stories cycle through the Living Story Loop (both pilot biomes reach their signature and aftermath), mini events and many kinds of
// activity happen, the Director never runs two signatures in adjacent biomes, nobody stands on a non-walkable tile, nobody teleports.
// Usage: node tests/tayduky-v2-sim.mjs [seconds=900] [seed=7]
import { loadTW } from './tw-load.mjs';
const secs = +(process.argv[2] || 900), seed = +(process.argv[3] || 7);
const C = loadTW(['tw-map.js', 'chars/chars.js', 'tw-data.js', 'tw-sim.js']);
const M = C.TWM, S = C.TWS; S.init(seed);
const prev = new Map(); let bad = [], tele = [], adjV = 0, maxAct = 0; const phases = {};
for (let k = 0; k < secs * 10; k++) {
  S.hour = 6 + (k / 10 / 480 * 24) % 24; S.tick(0.1);
  const act = Object.values(S.biomes).filter(B => B.phase === 'fore' || B.phase === 'sig').map(B => B.id); maxAct = Math.max(maxAct, act.length);
  for (const a of act) for (const b of act) if (a < b && (M.adj[a] || []).includes(b)) adjV++;
  for (const B of Object.values(S.biomes)) if (B.data) (phases[B.id] = phases[B.id] || new Set()).add(B.phase);
  for (const a of S.agents) {
    if (a.gone || a.hidden) { prev.delete(a); continue; }
    const i = Math.floor(a.x / 8), j = Math.floor(a.y / 8), t = M.id(i, j), m = M.MAT[t];
    const ok = M.WALK[t] || m === M.M.POOL || m === M.M.SPRING || a.lift > 1 || (a.cur && ['nudge', 'jump', 'climb', 'perch'].includes(a.cur.k));   // up a tree is allowed
    a._bad = ok ? 0 : (a._bad || 0) + 1; if (a._bad > 15 && bad.length < 8) bad.push([a.char, a.task, a.cur && a.cur.k, i, j, m]);   // on a blocked tile for more than 1.5 s
    const p = prev.get(a); if (p && Math.hypot(a.x - p[0], a.y - p[1]) > 3.5 && tele.length < 8) tele.push([a.char, a.task, a.cur && a.cur.k, +(Math.hypot(a.x - p[0], a.y - p[1])).toFixed(1)]);
    prev.set(a, [a.x, a.y]);
  }
}
const res = { seconds: secs, agents: S.agents.length, phases: Object.fromEntries(Object.entries(phases).map(([k, v]) => [k, [...v]])), stories: S.counts.stories, minis: S.counts.minis, acts: S.counts.acts,
  log: S.log.map(l => l.slice(1).join(':')), maxActive: maxAct, adjacencyViolations: adjV, badTiles: bad, teleports: tele, web: +S.web.ext.toFixed(2), litter: S.litter.length };
console.log(JSON.stringify(res, null, 1));
const allPh = ['hqs', 'btd'].every(b => ['peace', 'fore', 'sig', 'after'].every(p => res.phases[b] && res.phases[b].includes(p)));
const ok = allPh && Object.keys(res.minis).length >= 6 && Object.keys(res.acts).length >= 10 && adjV === 0 && !bad.length && !tele.length;
console.log(ok ? 'PASS' : 'FAIL'); process.exitCode = ok ? 0 : 1;
