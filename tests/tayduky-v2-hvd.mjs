// Fire Cloud Cave: connected stage, resident routines, all mini-event hooks, and repeatable signature recovery.
import assert from 'node:assert/strict';
import { loadTW } from './tw-load.mjs';

const { TWM: M, TWS: S } = loadTW();
const F = M.hvd;
assert(M.biomes[M.bi.hvd].built);
assert.equal(F.tiles.length, 991, 'HVD must retain Claude planner footprint');
assert.deepEqual([M.M.HCRIM, M.M.HCOPPER, M.M.HPINE, M.M.HPATH, M.M.HASH, M.M.HBRIDGE], [156,157,158,159,160,161]);
assert.equal(M.M.BANK, 120); assert.equal(M.M.PAVER, 126);   // Thông Thiên Hà remains disjoint
for (const [zone, p] of Object.entries(F.zones)) {
  assert(M.walkable(...p), `${zone} blocked`);
  assert(M.path(...F.zones.court, ...p, { biome: 'hvd' }), `${zone} disconnected`);
}
for (const p of M.pois.filter(p => p.biome === 'hvd')) {
  assert(M.walkable(p.i, p.j), `${p.kind} blocked`);
  assert(M.path(...F.zones.court, p.i, p.j, { biome: 'hvd' }), `${p.kind} disconnected`);
}
const supported = ['hvd_small_spell', 'hvd_supply_fire', 'hvd_spear', 'hvd_crows',
  'hvd_bridge_wind', 'hvd_steam', 'hvd_messenger'];
for (const name of supported) {
  S.init(7);
  for (const a of S.agents.filter(a => a.biome === 'hvd')) {
    a.q = []; a.cur = null; a.story = null; a.gathered = null;
  }
  assert.equal(S.MINI[name](S.biomes.hvd), true, `${name} failed to stage`);
}
for (const p of M.pois) p.users = 0; // mini probes share a VM; the live page boots only once
S.init(7);
S.biomes.hvd.timer = 0.5;
const seen = { captive: false, fire: false, overwhelmed: false, divine: false,
  water: false, recovery: false, peaceAgain: false };
let storyRuns = 0, lastPhase = '';
for (let n = 0; n < 14500; n++) {
  S.tick(0.1);
  const b = S.biomes.hvd, h = S.hvd;
  if (b.phase !== lastPhase) {
    if (b.phase === 'sig') storyRuns++;
    if (b.phase === 'peace' && seen.recovery) seen.peaceAgain = true;
    lastPhase = b.phase;
  }
  seen.captive ||= h.captive;
  seen.fire ||= h.fire > 0.85;
  seen.overwhelmed ||= h.overwhelmed;
  seen.divine ||= h.divine;
  seen.water ||= h.water > 0.7;
  seen.recovery ||= h.recovering && h.fire < 0.1;
  if (n % 30 === 0) for (const a of S.agents.filter(a => a.biome === 'hvd' && !a.gone)) {
    assert(Number.isFinite(a.x) && Number.isFinite(a.y) && Number.isFinite(a.gz));
    assert(M.biomeAt(Math.floor(a.x / 8), Math.floor(a.y / 8)) === 'hvd', `${a.char} left biome`);
  }
}
for (const [name, yes] of Object.entries(seen)) assert(yes, `${name} missing`);
assert(storyRuns >= 2, 'signature did not repeat');
for (const key of ['hvd_train', 'hvd_patrol', 'hvd_watch', 'hvd_work', 'hvd_haul',
  'hvd_cook', 'hvd_repair', 'hvd_spell', 'hvd_ritual']) assert(S.counts.acts[key] > 0, `${key} absent`);
console.log('PASS Hỏa Vân Động', { tiles: F.tiles.length, pois: M.pois.filter(p => p.biome === 'hvd').length,
  residents: S.agents.filter(a => a.biome === 'hvd' && a.role !== 'actor').length,
  miniEvents: supported.length, storyRuns, seen });
