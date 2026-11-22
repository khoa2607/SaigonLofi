// Deterministic Bàn Tơ sequence and preserved-world checks.
import { loadTW } from './tw-load.mjs';
import assert from 'node:assert/strict';
const {TWM:M,TWS:S} = loadTW();
const required=['prison','battle','throne','cave','loom','bath'];
const court=M.pois.find(p=>p.biome==='btd'&&p.kind==='battle');
for(const kind of required){
  const points=M.pois.filter(p=>p.biome==='btd'&&p.kind===kind);
  assert(points.length,kind+' missing');
  assert(points.some(p=>{
    const i=Math.floor(p.i),j=Math.floor(p.j);
    const usable=M.walkable(i,j) || (kind==='bath'&&M.MAT[M.id(i,j)]===M.M.SPRING);
    return usable && M.path(Math.floor(court.i),Math.floor(court.j),i,j,{biome:'btd',swim:kind==='bath'});
  }),kind+' has no reachable point');
}
assert.equal(M.falls.filter(f=>f.biome==='btd').length,3);
for(const p of M.props.filter(p=>p.biome==='btd'&&['btthrone','btprison','btcave'].includes(p.kind))) assert(M.biomeAt(p.i,p.j)==='btd');
S.init(7);
for(const B of Object.values(S.biomes)) B.timer=B.id==='btd'?.1:1e8;
const B=S.biomes.btd; let maxSisters=0,maxClones=0,sawWrapped=false,sawHeroes=false,sawAfter=false,sawPeace=false,maxBeat=0,staged=false,rescue=false;
for(let n=0;n<10000;n++){
  S.tick(.1);
  const R=B.run;
  if(B.phase==='sig'&&R) {
    maxBeat=Math.max(maxBeat,R.i);
    maxSisters=Math.max(maxSisters,S.agents.filter(a=>a.biome==='btd'&&a.role==='sister'&&a.task==='battle').length);
    maxClones=Math.max(maxClones,S.agents.filter(a=>a.biome==='btd'&&a.task==='clone'&&!a.gone).length);
    sawWrapped ||= !!R.actors.monk?.wrap;
    sawHeroes ||= ['wk','bj','sha'].every(id=>R.actors[id]&&!R.actors[id].gone);
    if(R.i===7) assert(R.actors.monk.wrap&&R.actors.monk.alpha===1&&R.actors.monk.dir==='down','captured monk must be visible');
    if(R.i>=15&&!staged){const c=M.pois.find(p=>p.biome==='btd'&&p.kind==='battle');staged=S.agents.filter(a=>a.biome==='btd'&&a.role==='sister'&&!a.hidden&&Math.hypot(a.x-c.x,a.y-c.y)<4*M.T).length===7;}
    if(R.i>=20&&!rescue){const p=M.pois.find(p=>p.biome==='btd'&&p.kind==='prison');rescue=S.agents.filter(a=>a.task==='clone'&&!a.gone&&Math.hypot(a.x-p.x,a.y-p.y)<3*M.T).length>=4;}
  }
  if(B.phase==='after') sawAfter=true;
  if(sawAfter&&B.phase==='peace'){sawPeace=true;break;}
}
assert(sawWrapped&&sawHeroes&&maxSisters===7&&maxClones>=4&&staged&&rescue&&sawAfter&&sawPeace,{sawWrapped,sawHeroes,maxSisters,maxClones,staged,rescue,sawAfter,sawPeace,maxBeat});
assert(S.counts.acts.strike>=3,'all three disciples must land a visible attack beat');
assert.equal(S.web.target,.55);
console.log(JSON.stringify({falls:3,maxSisters,maxClones,sawWrapped,sawHeroes,maxBeat,recovered:sawPeace}));
console.log('PASS');
