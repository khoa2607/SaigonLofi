// Cao Lão Trang: map integrity, ten+ minis, both signatures end to end in the Node sim (Bajie changes form, the chase, the farewell), recovery, no teleports.
// node tests/tayduky-v2-clt-sim.mjs [seed] [maxSeconds]
import { loadTW } from './tw-load.mjs';
import assert from 'node:assert/strict';
const C = loadTW(), S = C.TWS, M = C.TWM, seed = +(process.argv[2] || 7), maxS = +(process.argv[3] || 7200), F = M.clt;
assert(F && !F.failed.length, 'clt props placed: ' + (F && F.failed)); assert(F.dropped.length <= 2, 'few dropped posts: ' + F.dropped); assert(M.biomes[M.bi.clt].built, 'built flag'); for (const l of M.lights.filter(l => l.biome === 'clt')) assert(Number.isInteger(l.i) && Number.isInteger(l.j) && Number.isFinite(l.r), 'light on an integer tile (the night pass indexes the height map): ' + JSON.stringify(l));
// connectivity: the west gate reaches the south road, the compound and the lane; the neighbours stay joined (hvd west, bcl north tile, lhd south)
const N = M.N, id = (i, j) => j * N + i; for (const [i, j] of [[48, 55], [52, 41], [62, 31], [43, 47], [60, 45]]) assert(F.reach[id(i, j)], 'reachable ' + i + ',' + j);
let links = new Set(); for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const q = id(i, j); if (M.BIO[q] !== M.bi.clt) continue; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const z = id(i + a, j + b); if (M.BIO[z] !== M.bi.clt && M.WALK[q] && M.WALK[z] && (M.canStep(q, z) || M.canStep(z, q))) links.add(M.biomes[M.BIO[z]].id); } }
assert(links.has('hvd') && links.has('lhd'), 'links to hvd and lhd: ' + [...links]);
S.init(seed); const B = S.biomes.clt; for (const b of Object.values(S.biomes)) if (b.id !== 'clt' && b.phase === 'peace') b.timer = 1e9; B.timer = 1;
const done = new Set(), ops = new Set(), mx = { rain: 0, flow: 0, cut: 0, panic: 0, celebrate: 0, rainbow: 0 }; let bajiePig = 0, bajieHuman = 0, wkAsGirl = 0, kneel = 0, tele = 0, bad = 0; const prev = new Map(), dur = {}, sigStart = {}, minis0 = {};
let lastPh = '', lastId = null; const son = () => S.agents.find(a => a.char === 'bajie_son');
for (let n = 0; n < maxS * 10 && !(done.has('gao_mystery') && done.has('bajie_joins') && Object.keys(S.counts.minis).filter(k => /^cl_/.test(k)).length >= 10); n++) {
  S.tick(0.1); const f = S.clt; if (B.phase === 'peace') for (const b of Object.values(S.biomes)) if (b.id !== 'clt' && b.phase === 'peace') b.timer = 1e9; if (B.phase === 'peace' && done.size < 2 && B.timer > 4) B.timer = 1;
  for (const k of Object.keys(mx)) mx[k] = Math.max(mx[k], f[k] || 0);
  const sn = son(); if (sn) { if (sn.look === 'bajie') bajiePig++; else bajieHuman++; } for (const a of S.agents) { if (a.biome === 'clt' && a.look === 'gao_cuilan' && a.role === 'actor') wkAsGirl++; if (a.biome === 'clt' && a.pose === 'kneel' && a.kneelP > 0.9) kneel++; }
  for (const a of S.agents) { if (a.biome !== 'clt' || a.gone || a.hidden) { prev.delete(a); continue; } const p = prev.get(a); if (p && Math.hypot(a.x - p[0], a.y - p[1]) > 3.5 && !a.flying && !(a.cur && ['arc', 'fly', 'jump'].includes(a.cur.k))) tele++; prev.set(a, [a.x, a.y]); const t = id(Math.floor(a.x / 8), Math.floor(a.y / 8)); a._b = (M.WALK[t] || a.lift > 1 || (a.cur && ['nudge', 'jump'].includes(a.cur.k))) ? 0 : (a._b || 0) + 1; if (a._b > 25) bad++; }
  if (B.phase !== lastPh) { if (B.phase === 'sig') sigStart[B.story.id] = S.t; if (lastPh === 'sig' && lastId) dur[lastId] = +(S.t - sigStart[lastId]).toFixed(0); lastPh = B.phase; lastId = B.story && B.story.id; }
  if (B.run && B.run.i > 0) ops.add(B.run.beats[Math.min(B.run.i - 1, B.run.beats.length - 1)][0]); if (B.phase === 'after' && B.story) done.add(B.story.id);
}
const actorsLeft = S.agents.filter(a => a.biome === 'clt' && a.role === 'actor' && !a.gone).length, sn = son();
const out = { t: +S.t.toFixed(0), done: [...done], mx, bajiePig: bajiePig > 0, wkAsGirl: wkAsGirl > 0, kneel: kneel > 0, dur, tele, bad, ops: [...ops].filter(o => /^c[ab]_/.test(o)).length, minis: Object.keys(S.counts.minis).filter(k => /^cl_/.test(k)), acts: Object.keys(S.counts.acts).length, actorsLeft, sonLook: sn && sn.look, sonHidden: sn && sn.hidden, residents: S.agents.filter(a => a.biome === 'clt' && a.role !== 'actor').length };
console.log(JSON.stringify(out));
assert(done.has('gao_mystery') && done.has('bajie_joins'), 'both signatures ran'); assert(out.bajiePig && out.wkAsGirl && out.kneel, 'transformation, disguise and kneel seen'); assert(out.minis.length >= 10, 'ten distinct minis: ' + out.minis.length); assert(mx.panic > 0.9 && mx.flow >= 0.9, 'panic and flow states'); assert(!tele && !bad, 'no teleport / stuck: ' + tele + '/' + bad); for (const id of ['gao_mystery', 'bajie_joins']) assert(dur[id] >= 80 && dur[id] <= 200, id + ' lasts 80-200 s: ' + dur[id]);
// let the recovery finish: the actors leave, Bajie is back in human form among the residents
for (let n = 0; n < 4000 && B.phase !== 'peace'; n++) S.tick(0.1); assert(B.phase === 'peace', 'back to peace'); assert(S.agents.filter(a => a.biome === 'clt' && a.role === 'actor' && !a.gone).length === 0, 'actors gone'); assert(son() && son().look === 'bajie_son' && !son().hidden, 'Bajie back in human form');
console.log('PASS');
