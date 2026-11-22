// Hoa Quả Sơn: the Great Sage Returns signature end to end in the Node sim (no browser): phases, the king's journey, clones, the cave, the feast, recovery. node tests/tayduky-v2-hqs-sim.mjs [seed]
import { loadTW } from './tw-load.mjs';
import assert from 'node:assert/strict';
const C = loadTW(), S = C.TWS, M = C.TWM, seed = +(process.argv[2] || 7);
S.init(seed); const B = S.biomes.hqs; assert(B, 'hqs biome'); for (const b of Object.values(S.biomes)) if (b.id !== 'hqs' && b.phase === 'peace') b.timer = 1e9; B.timer = 1;
const seen = new Set(), log = [], ops = new Set(); let t0 = null, gold = 0, festival = 0, feast = 0, clones = 0, swirl = 0, surge = 0, hiddenMax = 0, peakActors = 0, badTiles = 0, minOpsT = null;
for (let n = 0; n < 40000 && !(t0 && B.phase === 'peace' && S.t > t0 + 60); n++) {
  S.tick(0.1); const f = S.hqs; if (B.phase !== 'peace' && t0 === null) t0 = S.t; seen.add(B.phase);
  gold = Math.max(gold, f.gold); festival = Math.max(festival, f.festival); feast = Math.max(feast, f.feast); clones = Math.max(clones, f.clones.length); swirl = Math.max(swirl, f.swirl); surge = Math.max(surge, f.surge);
  const mine = S.agents.filter(a => a.biome === 'hqs'); hiddenMax = Math.max(hiddenMax, mine.filter(a => a.hidden).length); peakActors = Math.max(peakActors, mine.filter(a => a.role === 'actor' && !a.gone).length);
  if (B.run && B.run.i > 0) ops.add(B.run.beats[Math.min(B.run.i - 1, B.run.beats.length - 1)][0]);
  if (n % 200 === 0 && B.run) log.push(`${S.t.toFixed(0)}s ${B.phase} i=${B.run.i}/${B.run.beats.length} ${B.run.beats[Math.min(B.run.i, B.run.beats.length - 1)][0]}`);
}
console.log(log.join('\n'));
const king = S.agents.find(a => a.biome === 'hqs' && a.role === 'king'), out = { phases: [...seen], gold: +gold.toFixed(2), festival: +festival.toFixed(2), feast: +feast.toFixed(2), clones, swirl: +swirl.toFixed(2), surge: +surge.toFixed(2), hiddenMax, peakActors, ops: [...ops], residualActors: S.agents.filter(a => a.biome === 'hqs' && a.role === 'actor' && !a.gone).length, kingVisible: !!(king && !king.hidden && !king.gone), stillHidden: S.agents.filter(a => a.biome === 'hqs' && a.hidden).length };
console.log(JSON.stringify(out));
assert(seen.has('sig') && seen.has('after'), 'signature ran'); assert(out.gold > 0.9 && out.festival > 0.9 && out.feast > 0.9 && out.swirl > 0.9 && out.surge > 1.9, 'magic and festival states reached'); assert(out.clones >= 4, 'clones appeared'); assert(out.hiddenMax >= 10, 'the troop went through the curtain');
assert(['hqs_fore', 'hqs_omen', 'hqs_alarm', 'arrive', 'hqs_festival', 'hqs_raise', 'hqs_magic', 'hqs_procession', 'hqs_enter', 'hqs_feast', 'hqs_settle'].every(o => ops.has(o) || o === 'hqs_fore'), 'every phase op ran'); assert(out.residualActors === 0 && out.kingVisible && out.stillHidden === 0, 'cleaned up, king and troop back');
console.log('PASS');
