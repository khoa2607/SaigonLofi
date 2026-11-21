// Lòng Bàn Tay Phật Tổ: the Buddha Subdues Wukong signature end to end in the Node sim: phases, ops, states reached, the held state persists. node tests/tayduky-v2-btp-sim.mjs [seed]
import { loadTW } from './tw-load.mjs';
import assert from 'node:assert/strict';
const C = loadTW(), S = C.TWS, seed = +(process.argv[2] || 7);
S.init(seed); const B = S.biomes.btp; assert(B, 'btp biome'); for (const b of Object.values(S.biomes)) if (b.id !== 'btp' && b.phase === 'peace') b.timer = 1e9; B.timer = 1;
const seen = new Set(), ops = new Set(); let t0 = null, mx = { beams: 0, column: 0, inscr: 0, bound: 0, flash: 0, halo: 0 }, minGlow = 1, minCover = 1;
for (let n = 0; n < 40000 && !(t0 && B.phase === 'peace' && S.t > t0 + 40); n++) {
  S.tick(0.1); const f = S.btp; if (B.phase !== 'peace' && t0 === null) t0 = S.t; seen.add(B.phase); for (const k of Object.keys(mx)) mx[k] = Math.max(mx[k], f[k]); minCover = Math.min(minCover, f.cover); if (B.phase === 'sig') minGlow = Math.min(minGlow, Math.max(...f.glow));
  if (B.run && B.run.i > 0) ops.add(B.run.beats[Math.min(B.run.i - 1, B.run.beats.length - 1)][0]);
}
const king = S.agents.find(a => a.biome === 'btp' && a.role === 'monkeyking'), f = S.btp;
const out = { phases: [...seen], mx, minCover: +minCover.toFixed(2), ops: [...ops], bound: f.bound, kingVisible: !!(king && !king.hidden && !king.gone), actors: S.agents.filter(a => a.biome === 'btp' && a.role === 'actor').length };
console.log(JSON.stringify(out));
assert(seen.has('sig') && seen.has('after'), 'signature ran'); assert(mx.beams > 0.9 && mx.column > 0.9 && mx.inscr > 0.9 && mx.bound === 1 && mx.flash > 0.7, 'divine states reached'); assert(minCover < 0.05, 'the clouds parted');
assert(['btp_swagger', 'btp_leap', 'btp_fingers', 'btp_reveal', 'btp_inscribe', 'btp_seal', 'btp_bind', 'btp_hold', 'btp_settle'].every(o => ops.has(o)), 'every phase op ran'); assert(out.bound === 1 && out.kingVisible, 'Wukong stays held and visible');
console.log('PASS');
