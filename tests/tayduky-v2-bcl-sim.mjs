// Bạch Cốt Lĩnh: the Three Strikes signature end to end in the Node sim: phases, all ops, three bodies, the true form, banishment, cleanup. node tests/tayduky-v2-bcl-sim.mjs [seed]
import { loadTW } from './tw-load.mjs';
import assert from 'node:assert/strict';
const C = loadTW(), S = C.TWS, seed = +(process.argv[2] || 7);
S.init(seed); const B = S.biomes.bcl; assert(B, 'bcl biome'); for (const b of Object.values(S.biomes)) if (b.id !== 'bcl' && b.phase === 'peace') b.timer = 1e9; B.timer = 1;
const seen = new Set(), ops = new Set(); let t0 = null, maxBodies = 0, maxAura = 0, maxFlash = 0, maxShards = 0, maxActors = 0;
for (let n = 0; n < 40000 && !(t0 && B.phase === 'peace' && S.t > t0 + 40); n++) {
  S.tick(0.1); const f = S.bcl; if (B.phase !== 'peace' && t0 === null) t0 = S.t; seen.add(B.phase); maxBodies = Math.max(maxBodies, f.bodies.length); maxAura = Math.max(maxAura, f.aura); maxFlash = Math.max(maxFlash, f.flash); maxShards = Math.max(maxShards, f.shards.length); maxActors = Math.max(maxActors, S.agents.filter(a => a.biome === 'bcl' && a.role === 'actor' && !a.gone).length);
  if (B.run && B.run.i > 0) ops.add(B.run.beats[Math.min(B.run.i - 1, B.run.beats.length - 1)][0]);
}
const out = { phases: [...seen], maxBodies, maxAura: +maxAura.toFixed(2), maxFlash: +maxFlash.toFixed(2), maxShards, maxActors, ops: [...ops], residual: S.agents.filter(a => a.biome === 'bcl' && a.role === 'actor' && !a.gone).length, hidden: S.agents.filter(a => a.biome === 'bcl' && a.hidden).length };
console.log(JSON.stringify(out));
assert(seen.has('sig') && seen.has('after'), 'signature ran'); assert(out.maxBodies >= 3 && out.maxAura > 0.9 && out.maxFlash > 0.7 && out.maxShards >= 20, 'strikes, true form and fight happened');
assert(['bcl_arrive', 'bcl_girl', 'bcl_strike1', 'bcl_crone', 'bcl_strike2', 'bcl_elder', 'bcl_strike3', 'bcl_reveal', 'bcl_fight', 'bcl_banish', 'bcl_leave'].every(o => ops.has(o)), 'every phase op ran'); assert(out.maxActors >= 8, 'all actors spawned'); assert(out.residual === 0 && out.hidden === 0, 'cleaned up');
console.log('PASS');
