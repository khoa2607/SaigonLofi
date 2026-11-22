// Hoa Quả Sơn bridge/terrain invariants: both reviewed crossings must have firm banks,
// a continuous watercourse and a real walkable path. DOM-free and deterministic.
import assert from 'node:assert/strict';
import { loadTW } from './tw-load.mjs';

const { TWM } = loadTW(['tw-map.js']);
const K = (i, j) => TWM.id(i, j);
const at = (i, j) => ({
  mat: TWM.MAT[K(i, j)], height: TWM.H[K(i, j)], walk: TWM.WALK[K(i, j)],
  path: TWM.PATHC[K(i, j)], reachable: TWM.hqs.reach[K(i, j)],
});
const step = (a, b) => TWM.canStep(K(...a), K(...b));
const bridge = (i, j) => TWM.props.find(p => p.biome === 'hqs' && p.kind === 'hbridge' && p.i === i && p.j === j);

const source = [[74, 4], [75, 4]], sourceBanks = [[73, 4], [76, 4]];
const flank = [[79, 9], [80, 9]], flankBanks = [[78, 9], [81, 9]];

for (const p of [...source, ...flank]) {
  const q = at(...p);
  assert.equal(q.mat, TWM.M.BRIDGE, `missing bridge deck at ${p}`);
  assert.equal(q.walk, 1, `bridge is not walkable at ${p}`);
  assert.equal(q.path, 1, `bridge is not part of the preferred route at ${p}`);
  assert.equal(q.reachable, 1, `bridge is outside the HQS component at ${p}`);
}
for (const p of [...sourceBanks, ...flankBanks]) {
  const q = at(...p);
  assert.equal(q.walk, 1, `bridge bank is not walkable at ${p}`);
  assert.equal(q.path, 1, `no path reaches bridge bank at ${p}`);
  assert.equal(q.reachable, 1, `bridge bank is outside the HQS component at ${p}`);
}

assert.deepEqual(source.map(p => at(...p).height), [13, 13]);
assert.deepEqual(sourceBanks.map(p => at(...p).height), [13, 13]);
assert.deepEqual(flank.map(p => at(...p).height), [3, 3]);
assert.deepEqual(flankBanks.map(p => at(...p).height), [3, 3]);

assert(step(sourceBanks[0], source[0]) && step(source[0], source[1]) && step(source[1], sourceBanks[1]), 'source bridge path is disconnected');
assert(step(flankBanks[0], flank[0]) && step(flank[0], flank[1]) && step(flank[1], flankBanks[1]), 'flank bridge path is disconnected');

const sourceProp = bridge(74, 4), flankProp = bridge(79, 9);
assert(sourceProp && sourceProp.flip && sourceProp.fp[0] === 2 && sourceProp.fp[1] === 1, 'source bridge sprite is not aligned to the two-tile 2:1 crossing');
assert(flankProp && flankProp.flip && flankProp.fp[0] === 2 && flankProp.fp[1] === 1, 'flank bridge sprite is not aligned to the two-tile 2:1 crossing');

assert.equal(TWM.MAT[K(80, 8)], TWM.M.STREAM, 'old bridge still blocks the foot of the flank waterfall');
assert.equal(TWM.WALK[K(80, 8)], 0, 'NPCs can still walk through the waterfall landing');
assert(TWM.isWater(TWM.MAT[K(74, 3)]) && TWM.isWater(TWM.MAT[K(74, 5)]), 'source water no longer flows through the crossing');
assert(TWM.isWater(TWM.MAT[K(80, 8)]) && TWM.isWater(TWM.MAT[K(80, 10)]), 'flank stream no longer flows into the lake');

const cavePosts = TWM.pois.filter(p => p.biome === 'hqs' && p.kind === 'cave');
assert.equal(cavePosts.length, 2, 'a Water-Curtain Cave entrance was lost');
assert(cavePosts.every(p => TWM.hqs.reach[K(Math.floor(p.x / 8), Math.floor(p.y / 8))]), 'a cave entrance is unreachable');

console.log(JSON.stringify({ source: { deck: source, banks: sourceBanks }, flank: { deck: flank, banks: flankBanks }, cavePosts: cavePosts.length, droppedPois: TWM.hqs.droppedPois }));
console.log('PASS');
