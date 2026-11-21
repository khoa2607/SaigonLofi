// Đại Lôi Âm Tự: both signatures end to end in the Node sim, kneeling, the golden wave, the sutra; reachability from the Ngũ Trang Quán ledge. node tests/tayduky-v2-lat-sim.mjs [seed]
import { loadTW } from './tw-load.mjs';
import assert from 'node:assert/strict';
const C = loadTW(), S = C.TWS, seed = +(process.argv[2] || 7), F = C.TWM.lat;
assert(F && !F.failed.length, 'lat props placed: ' + (F && F.failed)); assert(F.link, 'road joins Ngũ Trang Quán at (113, 34)'); assert(F.dropped.length <= 2, 'few dropped posts: ' + F.dropped);
S.init(seed); const B = S.biomes.lat; for (const b of Object.values(S.biomes)) if (b.id !== 'lat' && b.phase === 'peace') b.timer = 1e9; B.timer = 1;
const done = new Set(), ops = new Set(), mx = { halo: 0, wheel: 0, words: 0, blank: 0, wave: 0, rain: 0, bloom: 0, beam: 0, gate: 0 }; let kneel = 0, bow = 0, sutra = 0, blank = 0, dur = {}, sigStart = {}, tele = 0, prev = new Map();
for (let n = 0; n < 120000 && !(done.has('seek_scriptures') && done.has('merit_fulfilled')); n++) {
  S.tick(0.1); const f = S.lat; if (B.phase === 'peace') for (const b of Object.values(S.biomes)) if (b.id !== 'lat' && b.phase === 'peace') b.timer = 1e9; if (B.phase === 'peace' && B.timer > 4) B.timer = 1;
  for (const k of Object.keys(mx)) mx[k] = Math.max(mx[k], f[k] || 0); const actors = S.agents.filter(a => a.biome === 'lat' && a.role === 'actor' && !a.gone);
  for (const a of actors) { if (a.pose === 'kneel' && a.kneelP > 0.9) kneel = Math.max(kneel, actors.filter(q => q.pose === 'kneel' && q.kneelP > 0.9).length); if (a.bowP > 0.5) bow++; if (a.carry === 'sutra') sutra++; if (a.carry === 'blank') blank++; const p = prev.get(a); if (p && Math.hypot(a.x - p[0], a.y - p[1]) > 3.5 && !a.flying && a.alpha !== 0) tele++; prev.set(a, [a.x, a.y]); }
  if (B.story && B.phase === 'sig') { sigStart[B.story.id] = sigStart[B.story.id] ?? S.t; dur[B.story.id] = S.t - sigStart[B.story.id]; }
  if (B.run && B.run.i > 0) ops.add(B.run.beats[Math.min(B.run.i - 1, B.run.beats.length - 1)][0]); if (B.phase === 'after' && B.story) done.add(B.story.id);
}
const out = { done: [...done], mx, kneelMax: kneel, bow: bow > 0, sutra: sutra > 0, blank: blank > 0, dur, tele, ops: [...ops].filter(o => /^l[sb]_/.test(o)), minis: Object.keys(S.counts.minis).filter(k => /^ls_/.test(k)).length, acts: Object.keys(S.counts.acts).filter(k => /sweep|chant|mallet|bell|incense|sutra_carry|bodhi|lotus_wipe|table|arhat|elder|pilgrim|guanyin/.test(k)).length };
console.log(JSON.stringify(out));
assert(done.has('seek_scriptures') && done.has('merit_fulfilled'), 'both signatures ran'); assert(kneel >= 4, 'four kneel at once'); assert(out.bow && out.sutra && out.blank, 'bow, true and blank sutra seen'); assert(mx.wheel > 0.9 && mx.words > 0.9 && mx.blank > 0.9 && mx.wave > 0.9 && mx.bloom > 0.9 && mx.gate > 0.9, 'states reached'); assert(tele === 0, 'no teleports');
console.log('PASS');
