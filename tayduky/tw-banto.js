'use strict';
// Bàn Tơ Động art stage, authored in the original biome space before footprint relocation.
window.TW_BANTO_BUILD = function ({ TWM, N, H, MAT, BIO, PATHC, RES, M, id, isB, prop, poi, addStair }) {
  const B = TWM.bi.btd, inB = (i,j) => isB(i,j,'btd');
  const set = (i,j,h,m) => { if (!inB(i,j)) return; const k=id(i,j); H[k]=h; MAT[k]=m; };
  const stage = TWM.btd.stage = { court:[78,143], prison:[83,136], throne:[68,136], river:[[64,149],[72,149],[80,149],[88,149],[98,149]], falls:[] };

  // Clear the former central decoration. Workshops and spring keep their activity points.
  TWM.props = TWM.props.filter(p => p.biome !== 'btd' || !['bspire','pcrystals','circle','caveent','rockarch'].includes(p.kind));
  TWM.pois = TWM.pois.filter(p => p.biome !== 'btd' || p.kind !== 'circle');
  TWM.lights = TWM.lights.filter(p => p.biome !== 'btd' || p.kind !== 'crystal');
  // A small ceremonial web court leaves rock, vegetation and a real stream visible around it.
  for (let j=134;j<=149;j++) for (let i=63;i<=98;i++) {
    if (!inB(i,j) || MAT[id(i,j)] !== M.WEBF || PATHC[id(i,j)]) continue;
    const d=((i-78)/8)**2+((j-142)/5)**2;
    if (d>1) set(i,j,H[id(i,j)],M.GORGE);
  }
  // Three exposed rock shelves around a clear central fighting stage.
  for(let j=134;j<=138;j++) for(let i=63;i<=72;i++) if(inB(i,j) && j>=135 && j<=137) set(i,j,4,M.LEDGE);
  for(let j=134;j<=138;j++) for(let i=82;i<=87;i++) if(inB(i,j) && j>=135 && j<=137) set(i,j,4,M.LEDGE);
  for(let j=139;j<=147;j++) for(let i=73;i<=84;i++) if(inB(i,j) && MAT[id(i,j)] !== M.SILKB) set(i,j,2,M.WEBF);
  // Water glints in the front chasm, below the court; existing silk bridges cross above it.
  for(let j=148;j<=150;j++) for(let i=58;i<=100;i++) {
    if(!inB(i,j) || MAT[id(i,j)]===M.SILKB || PATHC[id(i,j)] || MAT[id(i,j)]!==M.CHASM) continue;
    if(Math.abs(j-(148.7+0.35*Math.sin(i*0.13)))<1.35) set(i,j,0,M.STREAM);
  }
  TWM.water.push({type:'line',pts:stage.river.map(([i,j])=>[i+0.5,j+0.5]),w:1.25,mat:M.STREAM});
  for(const [i,j] of [[67,138],[68,138],[84,138],[85,138]]) {
    if(!inB(i,j) || !inB(i,j-1)) continue;
    set(i,j,2,M.WEBPATH); set(i,j-1,4,M.LEDGE); addStair(id(i,j),id(i,j-1));
  }
  // The spring terrace needs a real stair to the court so its residents can join stories on foot.
  if(inB(89,146)&&inB(89,145)) addStair(id(89,146),id(89,145));
  // Build the cave into the rear cliff, with recognizable elevation and a visible prison.
  prop('btcave',79,132,{fp:[3,1],block:false,v:0});
  prop('btthrone',66,135,{fp:[2,2],v:0});
  prop('btprison',83,135,{fp:[2,2],block:false,v:0});
  prop('circle',78,143,{block:false,flat:true});
  poi('circle','btd',78,143,{cap:12});
  poi('prison','btd',83,136,{cap:1,face:'down'});
  poi('battle','btd',78,143,{cap:12});
  poi('throne','btd',68,137,{cap:1,face:'up'});
  for(const [i,j] of [[65,139],[70,140],[77,137],[85,140],[88,145],[72,149]]) {
    if(!inB(i,j)) continue;
    prop('bigmush',i,j,{v:(i+j)%2});
    TWM.lights.push({biome:'btd',i,j,r:30,col:'133,237,198',kind:'crystal'});
  }
  for(const [i,j] of [[64,143],[67,146],[94,148],[92,135]]) if(inB(i,j)) prop('bspire',i,j,{v:(i+j)%2});
  // Cascades spill from the high wall into the river and the spring.
  for(const [i,j,top,bottom] of [[72,131,7,4],[77,131,7,4],[92,134,6,3]]) {
    if(!inB(i,j)) continue;
    TWM.falls.push({biome:'btd',i,j,w:1,top,bottom});
    stage.falls.push([i,j]);
  }
};
