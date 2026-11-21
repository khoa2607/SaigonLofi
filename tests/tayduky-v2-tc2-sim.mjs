// Thiên Cung rework: both signatures (Havoc in Heaven, the Eight-Trigram Furnace) end to end in the Node sim, plus the new minis/activities and reachability. node tests/tayduky-v2-tc2-sim.mjs [seed]
import { loadTW } from './tw-load.mjs';
import assert from 'node:assert/strict';
const C = loadTW(), S = C.TWS, seed = +(process.argv[2] || 7), F = C.TWM.tc2;
assert(F && !F.failed.length, 'tc2 props all placed: ' + (F && F.failed)); assert(F.dropped.length <= 3, 'few dropped posts: ' + F.dropped);
S.init(seed); const B = S.biomes.tc; for (const b of Object.values(S.biomes)) if (b.id !== 'tc' && b.phase === 'peace') b.timer = 1e9; B.timer = 1;
const done = new Set(), ops = new Set(), mx = { heat: 0, storm: 0, shake: 0, flash: 0, bursts: 0 }; let lid = false, fly = false, last = null, sigStart = {}, dur = {};
for (let n = 0; n < 90000 && !(done.has('havoc_heaven') && done.has('eight_trigram_furnace')); n++) {
  S.tick(0.1); const f = S.tc2; if (B.phase === 'peace' && B.timer > 5) B.timer = 1; if (B.phase === 'peace') for (const b of Object.values(S.biomes)) if (b.id !== 'tc' && b.phase === 'peace') b.timer = 1e9;
  for (const k of ['heat', 'storm', 'shake', 'flash']) mx[k] = Math.max(mx[k], f[k]); mx.bursts = Math.max(mx.bursts, f.bursts.length); if (f.lid > 0.9) lid = true; if (f.lidFly) fly = true;
  if (B.story && B.phase === 'sig') { sigStart[B.story.id] = sigStart[B.story.id] ?? S.t; dur[B.story.id] = S.t - sigStart[B.story.id]; }
  if (B.run && B.run.i > 0) ops.add(B.run.beats[Math.min(B.run.i - 1, B.run.beats.length - 1)][0]); if (B.phase === 'after' && B.story) done.add(B.story.id);
}
const king = S.agents.find(a => a.biome === 'tc' && a.role === 'trickster');
const out = { done: [...done], mx, lid, fly, dur, ops: [...ops].filter(o => /^tc_/.test(o)), minis: Object.keys(S.counts.minis).filter(k => /tc2_|heaven_/.test(k)), kingVisible: !!(king && !king.hidden) };
console.log(JSON.stringify(out));
assert(done.has('havoc_heaven') && done.has('eight_trigram_furnace'), 'both signatures ran'); assert(mx.heat > 0.95 && mx.storm > 0.9 && mx.shake > 1 && lid && fly && mx.bursts >= 2, 'furnace states reached');
assert(['tc_sneak', 'tc_feast', 'tc_alarm', 'tc_chase', 'tc_leap', 'tc_smash', 'tc_wreck', 'tc_f_enter', 'tc_f_seal', 'tc_f_burn', 'tc_f_break', 'tc_f_land', 'tc_f_settle'].every(o => ops.has(o)), 'every op ran'); assert(out.kingVisible, 'Wukong visible at the end');
console.log('PASS');
