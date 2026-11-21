'use strict';
// Fire Cloud Cave: authored after compact layout. All terrain stays inside the existing HVD mask.
window.TW_HVD_BUILD = function (X) {
  const {TWM,N,H,MAT,BIO,PATHC,RES,M,id,inMap,vnoise,hash2,prop,poi,addStair} = X;
  const B=TWM.bi.hvd, R=TWM.mulberry32(20261124);
  // Material IDs are allocated centrally in tw-map.js. Never reuse Thông Thiên Hà's 120–126 range.
  if([M.HCRIM,M.HCOPPER,M.HPINE,M.HPATH,M.HASH,M.HBRIDGE].some(v=>typeof v!=='number'))throw new Error('tw-hvd: material IDs are not registered');
  const inside=(i,j)=>inMap(i,j)&&i>0&&j>0&&i<N-1&&j<N-1&&BIO[id(i,j)]===B;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mound=(i,j,x,y,rx,ry,h)=>{const d=((i-x)/rx)**2+((j-y)/ry)**2;return d<1?h*(1-d)**0.72:0};
  const F=TWM.hvd={tiles:[],peaks:[],falls:[],stream:[],flags:[],braziers:[],pines:[],crows:[],zones:{
    fortress:[12,37],court:[15,41],ritual:[24,39],village:[8,44],north:[5,20],south:[5,77],water:[28,40]}, focus:[15,40]};
  TWM.biomes[B].built=true;
  // Edge distance lets the mountains descend to the established palace, silk and volcano borders.
  const D=new Int8Array(N*N).fill(-1),q=[];
  for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++)if(inside(i,j)){
    const k=id(i,j);
    if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>!inside(i+a,j+b))){D[k]=0;q.push(k);}
  }
  for(let n=0;n<q.length;n++){const k=q[n],i=k%N,j=(k/N)|0;if(D[k]>=9)continue;
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+di,y=j+dj;if(inside(x,y)&&D[id(x,y)]<0){D[id(x,y)]=D[k]+1;q.push(id(x,y));}}
  }
  for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++)if(inside(i,j)){
    const k=id(i,j),n=vnoise(i*.27,j*.27,301),ridge=
      mound(i,j,4,9,11,16,10)+mound(i,j,6,24,9,13,8)+mound(i,j,12,35,14,10,9)+
      mound(i,j,27,37,9,8,7)+mound(i,j,3,61,8,15,5)+mound(i,j,5,78,8,12,4);
    const edge=clamp((D[k]+1)/5,0,1),base=1.6+ridge*edge+(n-.5)*2.1;
    H[k]=clamp(Math.round(base),1,14);
    MAT[k]=H[k]>=8?M.HCRIM:H[k]>=4?(n>.38?M.HCRIM:M.HPINE):n>.53?M.HPINE:M.HASH;
    F.tiles.push(k);if(H[k]>=11)F.peaks.push([i,j]);
  }
  const ell=(x,y,rx,ry,lv,mat)=>{for(let j=Math.floor(y-ry-2);j<=y+ry+2;j++)for(let i=Math.floor(x-rx-2);i<=x+rx+2;i++){
    if(!inside(i,j))continue;const d=((i-x)/rx)**2+((j-y)/ry)**2,k=id(i,j);
    if(d<1){H[k]=lv;if(mat)MAT[k]=mat;}else if(d<1.65){H[k]=Math.round(lv+(H[k]-lv)*clamp((d-1)/.65,0,1));}
  }};
  ell(12,35,5.7,4.1,8,M.HCRIM);  // cave keep shelf
  ell(15,41,6.6,4.5,6,M.HCOPPER); // reception and battle court
  ell(24,39,4.5,4.2,7,M.HCOPPER); // three-fire ritual
  ell(8,44,6.2,4.0,3,M.HCOPPER);  // dense settlement
  ell(5,22,3.1,5.5,8,M.HCRIM);   // north lookout
  ell(5,77,3.4,4.6,3,M.HPINE);   // south road shelf
  // One connected gorge: a cold mountain stream spills off a high shelf and runs to the eastern border.
  const stream=[[30,31,8],[30,32,7],[29,33,5],[29,34,3],[29,35,2],[29,36,1],[30,37,1],[31,38,1],[32,39,1],[33,40,1]];
  for(const [i,j,h] of stream)for(let di=0;di<2;di++)if(inside(i+di,j)){const k=id(i+di,j);H[k]=h;MAT[k]=M.STREAM;F.stream.push(k);if(j<=36)F.falls.push(k);}
  for(let j=31;j<=43;j++)for(let i=26;i<=34;i++)if(inside(i,j)&&MAT[id(i,j)]!==M.STREAM){
    const d=Math.abs(i-(29+(j-35)*.35));if(d<2.1&&j>=34&&j<=41){const k=id(i,j);MAT[k]=M.CHASM;H[k]=0;}
  }
  // Paths are mapped as continuous one-tile switchbacks, with real stair links at every level change.
  function route(points){
    const cells=[];for(let n=0;n<points.length-1;n++){const [x,y]=points[n],[xx,yy]=points[n+1];let i=x,j=y;while(i!==xx||j!==yy){cells.push([i,j,n]);if(Math.abs(xx-i)>=Math.abs(yy-j)&&i!==xx)i+=Math.sign(xx-i);else j+=Math.sign(yy-j);}}
    cells.push([points.at(-1)[0],points.at(-1)[1],points.length-2]);
    let prev=null;for(let t=0;t<cells.length;t++){const [i,j,n]=cells[t];if(!inside(i,j)){prev=null;continue;}
      const k=id(i,j),p0=points[n],p1=points[n+1],len=Math.abs(p1[0]-p0[0])+Math.abs(p1[1]-p0[1])||1,
        d=Math.abs(i-p0[0])+Math.abs(j-p0[1]),lv=Math.round(p0[2]+(p1[2]-p0[2])*d/len);
      H[k]=clamp(lv,1,14);MAT[k]=MAT[k]===M.STREAM||MAT[k]===M.CHASM?M.HBRIDGE:M.HPATH;PATHC[k]=1;
      if(prev!==null){const dh=H[k]-H[prev];if(dh!==0&&Math.abs(dh)<=2){if(dh>0)addStair(prev,k);else addStair(k,prev);}}
      prev=k;
    }
  }
  route([[5,2,8],[5,12,8],[5,22,8],[5,30,7],[8,35,6],[12,38,6],[15,41,6]]);
  route([[12,37,8],[12,38,7],[12,39,6],[15,41,6],[22,41,7],[24,39,7]]);
  route([[8,44,3],[10,43,4],[12,42,5],[15,41,6]]);
  route([[15,41,6],[19,42,6],[24,42,7],[28,41,6],[30,41,5]]);
  route([[8,44,3],[5,48,3],[3,54,2],[2,60,2],[2,68,2],[3,73,3],[5,77,3],[8,81,2]]);
  route([[8,44,3],[13,47,2],[15,50,2]]);
  route([[6,39,4],[5,35,5],[5,30,7]]);
  route([[24,39,7],[27,39,6],[30,39,5],[32,41,3]]);
  // Preserve the compact world's only traversable exit from Thiên Cung: join the ritual terrace to the existing HVD/TC seam at (26,33).
  route([[24,39,7],[25,36,6],[26,33,3]]);
  const P=(kind,i,j,opt)=>inside(i,j)?prop(kind,i,j,Object.assign({block:false},opt||{})):null;
  const Q=(kind,i,j,opt)=>inside(i,j)?poi(kind,'hvd',i,j,opt):null;
  const light=(i,j,r,col)=>TWM.lights.push({biome:'hvd',i,j,r,col,kind:'fire'});
  for(const [i,j] of [[4,7],[3,26],[27,32]])P('hvdpeak',i,j,{fp:[3,3],block:false,v:0});
  P('hvdfortress',10,33,{fp:[3,3],block:false,v:0});
  P('hvdritual',23,37,{fp:[2,2],block:false,v:0});
  for(const [i,j] of [[5,18],[4,31],[25,35],[6,70]])P('hvdtower',i,j,{fp:[2,2],block:false,v:0});
  for(const [i,j] of [[3,41],[7,41],[3,46],[8,47],[12,45],[11,49]])P('hvdhut',i,j,{fp:[2,2],block:true,v:(i+j)&1});
  for(const [i,j] of [[12,39],[17,39],[21,41],[26,41],[7,43],[10,45],[5,27],[5,74]]){P('hvdbrazier',i,j,{block:false});F.braziers.push([i,j]);light(i,j,45,'255,100,55');}
  for(const [i,j] of [[8,37],[17,36],[22,36],[25,42],[8,44],[4,65],[7,20]]){P('hvdbanner',i,j,{block:false});F.flags.push([i,j]);}
  for(const [i,j] of [[29,38],[29,40]])P('hvdbridge',i,j,{fp:[2,1],block:false,bridge:true});
  P('hvdwaterfall',28,37,{fp:[2,1],block:false});
  for(const [kind,ls] of Object.entries({fortress:[[12,37],[14,38]],court:[[15,41],[17,42]],ritual:[[24,40],[22,41]],watch:[[5,22],[5,31],[25,36]],workshop:[[7,45],[10,46]],supply:[[4,44],[11,48]],cook:[[6,43]],training:[[18,42],[20,42]],bridge:[[28,40]],waterfall:[[28,36]],gate:[[14,47]],lookout:[[6,27]],repair:[[10,49]]}))
    for(const [i,j] of ls)Q(kind,i,j,{cap:kind==='court'?6:2,face:'up'});
  for(const [kind,i,j] of [['gate',8,44],['prison',12,37],['watch',12,37],['watch',5,22],['waterfall',28,40],['lookout',24,40],['repair',7,45],['bridge',28,41]])Q(kind,i,j,{cap:2,face:'up'});
  light(12,35,125,'255,90,65');light(24,39,95,'255,80,70');
  // Dense clusters of wind-bent pines, blackened trunks and rock on every unused shelf and narrow approach.
  for(let n=0;n<460;n++){const i=1+Math.floor(R()*38),j=1+Math.floor(R()*88);if(!inside(i,j))continue;const k=id(i,j);
    if(RES[k]||PATHC[k]||MAT[k]===M.STREAM||MAT[k]===M.CHASM||MAT[k]===M.HBRIDGE||Math.hypot(i-15,j-41)<6||Math.hypot(i-24,j-39)<5)continue;
    const p=vnoise(i*.19,j*.19,322),kind=p>.3&&n%4?'hvdpine':n%3?'hvdrock':'hvdburnt';
    P(kind,i,j,{block:true,v:n%3});if(kind==='hvdpine')F.pines.push([i,j]);
  }
  // Exposed northern and western rims receive continuous rock, with isolated pine silhouettes.
  for(let j=1;j<83;j+=3)for(const i of [1,2,3,4,5])if(inside(i,j)&&!RES[id(i,j)]&&!PATHC[id(i,j)]&&MAT[id(i,j)]!==M.STREAM)P(j%2?'hvdrock':'hvdpine',i,j,{block:true,v:j%3});
  // Ash and pine needles cross the unfinished neighbors. Approved built tiles keep their geometry.
  const out=[];for(const k of F.tiles){const i=k%N,j=(k/N)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+dx,y=j+dy;if(!inMap(x,y)||inside(x,y))continue;const z=id(x,y);if(!TWM.biomes[BIO[z]].built&&MAT[z]>=M.PH)out.push(z);}}
  for(const z of [...new Set(out)])if(hash2(z%N,(z/N)|0,323)<.57)MAT[z]=M.HASH;
  // Route intersections can be repainted by another switchback; restore their stair links after all routes and props are settled.
  for(const k of F.tiles)if(PATHC[k]&&MAT[k]!==M.STREAM&&MAT[k]!==M.CHASM){const i=k%N,j=(k/N)|0;for(const [di,dj] of [[1,0],[0,1]]){const x=i+di,y=j+dj;if(!inside(x,y))continue;const z=id(x,y),dh=H[z]-H[k];if(PATHC[z]&&dh&&Math.abs(dh)<=3&&!TWM.stairs.has(k+','+z)){if(dh>0)addStair(k,z);else addStair(z,k);}}}  TWM.homes=TWM.homes||{};TWM.homes.hvd={redboy:[24,40],guard:[15,41],attendant:[24,41],worker:[8,44],trainee:[18,42],monk:[15,49],pilgrim:[15,49],guanyin:[26,39],_:[12,43]};
  F.droppedPois=0;
};
window.TW_HVD_FINAL=function({TWM,N,id}){
  const F=TWM.hvd,start=id(15,41),seen=new Uint8Array(N*N),q=[start];seen[start]=1;
  for(let n=0;n<q.length;n++){const k=q[n],i=k%N,j=(k/N)|0;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+b;if(!TWM.inMap(x,y))continue;const z=id(x,y);if(!seen[z]&&TWM.canStep(k,z)){seen[z]=1;q.push(z);}}}
  const before=TWM.pois.length;TWM.pois=TWM.pois.filter(p=>p.biome!=='hvd'||seen[id(Math.floor(p.x/8),Math.floor(p.y/8))]);F.droppedPois=before-TWM.pois.length;
};
