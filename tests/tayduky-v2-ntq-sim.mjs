// Ngũ Trang Quán: the Ginseng Fruit signature end to end in the Node sim (no browser): phases, tree state, actors, recovery. node tests/tayduky-v2-ntq-sim.mjs [seed]
import { loadTW } from './tw-load.mjs';
import assert from 'node:assert/strict';
const C = loadTW(), S = C.TWS, M = C.TWM, seed = +(process.argv[2] || 7);
S.init(seed); const B = S.biomes.ntq; assert(B, 'ntq biome'); for (const b of Object.values(S.biomes)) if (b.id !== 'ntq' && b.phase === 'peace') b.timer = 1e9; B.timer = 1;   // other biomes that are already mid-story finish it first (adjacent signatures never overlap)
const seen = new Set(), tree = [], log = []; let minVit = 1, maxFall = 0, peakActors = 0, t0 = null, bound = 0, nectar = 0, wave = 0, feast = 0, fruitsBack = false;
for (let n = 0; n < 30000 && !(t0 && B.phase === 'peace' && S.t > t0 + 60); n++) {
  S.tick(0.1); const f = S.ntq; if (B.phase !== 'peace' && t0 === null) t0 = S.t; seen.add(B.phase);
  minVit = Math.min(minVit, f.tree.vit); maxFall = Math.max(maxFall, f.tree.fall); bound = Math.max(bound, f.bind.on); nectar = Math.max(nectar, f.nectar); feast = Math.max(feast, f.feast); if (f.wave > 0) wave = 1;
  const act = S.agents.filter(a => a.biome === 'ntq' && a.role === 'actor' && !a.gone); peakActors = Math.max(peakActors, act.length);
  if (n % 100 === 0 && B.run) log.push(`${S.t.toFixed(0)}s i=${B.run.i}/${B.run.beats.length} ${B.run.beats[Math.min(B.run.i, B.run.beats.length - 1)][0]} tree=${f.tree.state} fall=${f.tree.fall.toFixed(2)} vit=${f.tree.vit.toFixed(2)} actors=${act.length}`);
}
const f = S.ntq; console.log(log.join('\n'));
const out = { phases: [...seen], minVit: +minVit.toFixed(2), maxFall: +maxFall.toFixed(2), peakActors, bound: +bound.toFixed(2), nectar: +nectar.toFixed(2), wave, feast: +feast.toFixed(2), endTree: f.tree.state, fruit: f.tree.fruit.filter(q => q.g > 0.9).length, residualActors: S.agents.filter(a => a.biome === 'ntq' && a.role === 'actor' && !a.gone).length, sage: S.agents.filter(a => a.role === 'sage' && a.biome === 'ntq').map(a => a.hidden) };
console.log(JSON.stringify(out));
assert(seen.has('sig'), 'signature phase ran'); assert(out.minVit < 0.5 && out.maxFall > 0.9, 'tree was felled'); assert(out.endTree === 'ok' && out.fruit === 9, 'tree restored with all fruit'); assert(out.bound > 0.9 && out.nectar > 0.9 && out.wave && out.feast > 0.9, 'magic phases');
assert(out.residualActors === 0 && out.sage.every(h => !h), 'actors cleaned up, sage back'); assert(peakActors >= 8, 'all actors spawned');
console.log('PASS');
