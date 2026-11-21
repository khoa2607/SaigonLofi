// Verify the actual 15-region mask, four-neighbour adjacency and pilot preservation.
import { loadTW } from './tw-load.mjs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const M = loadTW().TWM, N = M.N;
assert.equal(N, 124);   // footprint normalisation: 160 -> 104 -> 124 (Hỏa Diệm Sơn) (docs/tayduky/v2/FOOTPRINT.md) assert.equal(M.biomes.length, 15);
const expected = {/* hqs: rebuilt in world space (tw-hqs.js) - no longer the translated pilot */ btd:'99fb3f52f87a8eb80b22922cda9e1ef788c30283b68940d023d122d6583ea4b7'   /* interior tiles in authoring coordinates; identical to the pre-normalisation world (verified against commit 404b90f) */};
const expectedProps={btd:'1cef16d696ccefb6322591810e7ccfd911781b18ea412fe3360765f71fdf8de4'};
const area = {}, walk = {}, components = {}, reachable = {}, edges = new Set();
for (const b of M.biomes) {
  const tiles = [], oldTiles = [], todo = new Set(); let passable = 0;
  for (let j=0;j<N;j++) for (let i=0;i<N;i++) {const k=M.id(i,j); if (M.BIO[k]!==b.k) continue;
    tiles.push([i,j,M.H[k],M.MAT[k],M.WALK[k]]); {const [a,b]=M.layout.unmap(i,j); if(a>=1&&b>=1&&a<=158&&b<=158) oldTiles.push([a,b,M.H[k],M.MAT[k],M.WALK[k]]);}   // authoring coordinates: proves the pilot biomes were only translated
    if (i>0 && j>0 && i<N-1 && j<N-1) {todo.add(k); if(M.WALK[k]) passable++;}
  }
  area[b.id]=todo.size; walk[b.id]=passable;
  if (expected[b.id]) assert.equal(createHash('sha256').update(JSON.stringify(oldTiles)).digest('hex'), expected[b.id], `${b.id} changed`);
  if (expectedProps[b.id]) assert.equal(createHash('sha256').update(JSON.stringify(M.props.filter(p=>M.biomeAt(p.i,p.j)===b.id).map(p=>Object.assign({},p,{i:M.layout.unmap(p.i,p.j)[0],j:M.layout.unmap(p.i,p.j)[1]})))).digest('hex'),expectedProps[b.id],`${b.id} props changed`);
  let n=0; while(todo.size) {n++;const first=todo.values().next().value;todo.delete(first);const q=[first];
    for(let x=0;x<q.length;x++){const i=q[x]%N,j=Math.floor(q[x]/N);for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]) {const ii=i+di,jj=j+dj;if(ii<1||jj<1||ii>=N-1||jj>=N-1)continue;const k=M.id(ii,jj);if(todo.delete(k))q.push(k);}}}
  components[b.id]=n; assert.equal(n,1,`${b.id} has disconnected mask`); assert(passable>0,`${b.id} has no accessible tiles`);
  const start=tiles.find(([i,j,, ,w])=>w && i>0 && j>0 && i<N-1 && j<N-1); const root=M.id(start[0],start[1]), seen=new Set([root]), q=[root];
  for(let x=0;x<q.length;x++){const k=q[x],i=k%N,j=Math.floor(k/N);for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<1||jj<1||ii>=N-1||jj>=N-1)continue;const z=M.id(ii,jj);if(M.BIO[z]===b.k&&!seen.has(z)&&M.canStep(k,z)){seen.add(z);q.push(z);}}}
  reachable[b.id]=seen.size;
}
for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++)for(const [di,dj] of [[1,0],[0,1]]) {if(i+di>=N-1||j+dj>=N-1)continue;const a=M.biomeAt(i,j),b=M.biomeAt(i+di,j+dj);if(a!==b)edges.add([a,b].sort().join(':'));}
for(const b of M.biomes)for(const other of M.adj[b.id]) {assert(M.adj[other].includes(b.id));assert(edges.has([b.id,other].sort().join(':')));}
assert.equal(Object.values(area).reduce((a,b)=>a+b,0),(N-2)*(N-2));
assert.equal([...edges].length,Object.values(M.adj).reduce((a,x)=>a+x.length,0)/2);
const court=M.pois.find(p=>p.biome==='tc'&&p.kind==='court');assert(court);
for(const p of M.pois.filter(p=>p.biome==='tc')) {const i=Math.floor(p.i),j=Math.floor(p.j);assert(M.walkable(i,j),`blocked tc ${p.kind}`);assert(M.path(Math.floor(court.i),Math.floor(court.j),i,j,{biome:'tc'}),`unreachable tc ${p.kind}`);}
const root=M.id(Math.floor(court.i),Math.floor(court.j)), global=new Set([root]), queue=[root], covered=new Set();
for(let n=0;n<queue.length;n++){const k=queue[n],i=k%N,j=Math.floor(k/N);covered.add(M.biomes[M.BIO[k]].id);for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+di,y=j+dj;if(x<1||y<1||x>=N-1||y>=N-1)continue;const z=M.id(x,y);if(!global.has(z)&&M.canStep(k,z)){global.add(z);queue.push(z);}}}
assert.equal(covered.size,15,'global traversable component does not reach all regions');
const crossing={};for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++)for(const [di,dj] of [[1,0],[0,1]]){if(i+di>=N-1||j+dj>=N-1)continue;const a=M.biomeAt(i,j),b=M.biomeAt(i+di,j+dj);if(a===b)continue;const key=[a,b].sort().join(':');crossing[key]??={edges:0,walkable:0};crossing[key].edges++;if(M.canStep(M.id(i,j),M.id(i+di,j+dj)))crossing[key].walkable++;}
const closedBorders=Object.entries(crossing).filter(([,v])=>!v.walkable).map(([k])=>k);
// Exercise the real Director under pressure in all 15 regions using inert test stories.
const C=loadTW(), S=C.TWS; for(const b of C.TWM.biomes) C.TW_DATA.biomes[b.id]={residents:[],roles:{},minis:[],stories:[{id:'probe',fore:[],beats:[['wait',{t:30}]],recover:[]}]};
S.init(73);for(const b of Object.values(S.biomes)) {b.phase='peace';b.run=null;b.timer=.1;}
let maxActive=0, violations=0;const started=new Set();for(let n=0;n<12000;n++){S.tick(.1);const active=Object.values(S.biomes).filter(b=>b.phase==='fore'||b.phase==='sig').map(b=>b.id);maxActive=Math.max(maxActive,active.length);for(const a of active){started.add(a);for(const b of active)if(a<b&&C.TWM.adj[a].includes(b))violations++;}}
assert(maxActive<=5);assert.equal(violations,0);assert.equal(started.size,15,'some regions never started under pressure');
console.log(JSON.stringify({area,walk,reachable,components,tcPois:M.pois.filter(p=>p.biome==='tc').length,globalReachableRegions:covered.size,closedBorders,adj:M.adj,edges:edges.size,director:{maxActive,violations,regionsStarted:started.size}},null,2));console.log('PASS');
