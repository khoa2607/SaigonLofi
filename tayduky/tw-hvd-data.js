'use strict';
// Red Boy's living settlement and the Three-Flavored True Fire. Simulation remains deterministic and DOM-free.
(function(){
  const S=TWS,H=S.H,D=window.TW_DATA,B='hvd',F=TWM.hvd;
  const ease=(v,t,r,dt)=>Math.abs(t-v)<=r*dt?t:v+Math.sign(t-v)*r*dt;
  const state=()=>({cloud:0,cloudT:0,fire:0,fireT:0,water:0,waterT:0,ash:0,ashT:0,wind:1,
    deception:0,captive:false,overwhelmed:false,divine:false,bursts:[],steam:[],scares:[],recovering:false});
  const bi=(role)=>S.agents.find(a=>a.biome===B&&a.role===role&&!a.gone&&!a.hidden);
  const free=(role,n=1)=>S.agents.filter(a=>a.biome===B&&a.role===role&&H.free(a)).slice(0,n);
  const P=k=>H.pois(B,k),p=k=>P(k)[0],near=(q,dx=0,dy=0)=>H.nearestWalk(q.x+dx,q.y+dy,B,5)||[q.x,q.y];
  const burst=(x,y,kind='fire')=>S.hvd.bursts.push({x,y,t:0,kind});
  const baseInit=S.init,baseTick=S.tick;
  S.init=function(seed){S.hvd=state();baseInit(seed);};
  S.tick=function(dt){baseTick(dt);const f=S.hvd;if(!f)return;
    for(const key of ['cloud','fire','water','ash'])f[key]=ease(f[key],f[key+'T'],key==='fire'?.085:key==='water'?.06:key==='ash'?.026:.035,dt);
    f.wind=1+.28*Math.sin(S.t*.13)+.45*f.cloud;
    for(const key of ['bursts','steam','scares']){for(const q of f[key])q.t+=dt;f[key]=f[key].filter(q=>q.t<(q.life||2.4));}
    if(f.fire>.6&&S.R()<dt*.11){const q=p('ritual');if(q)burst(q.x+(S.R()-.5)*40,q.y+(S.R()-.5)*25,'truefire');}
    if(f.water>.4&&S.R()<dt*.15){const q=p('waterfall');if(q)f.steam.push({x:q.x+(S.R()-.5)*22,y:q.y,t:0,life:4});}
  };
  S.stepExt.hvdcall=(a,st)=>{st.fn(a);return true;};
  const A=S.ACT;
  function post(kind,a,action='idle',dur=8){const q=H.poiFree(B,kind);if(!q)return A.stroll(a);H.claim(a,q);return[H.go(q.x,q.y),{k:'face',dir:q.face||'up'},{k:action,t:H.rnd(dur,dur+5)},{k:'bubble',kind:'dots'},{k:'idle',t:3},{k:'release',poi:q}];}
  A.hvd_watch=a=>{H.count('hvd_watch');return post('watch',a);};
  A.hvd_ritual=a=>{H.count('hvd_ritual');return post('ritual',a,'act',5);};
  A.hvd_patrol=a=>{const ps=['gate','court','watch','bridge','fortress'].map(k=>p(k)).filter(Boolean);if(!ps.length)return A.stroll(a);H.count('hvd_patrol');const st=[];for(let n=0;n<3;n++){const q=ps[Math.floor(S.R()*ps.length)];st.push(H.go(q.x,q.y,{run:1.1}),{k:'face',dir:q.face||'down'},{k:'idle',t:H.rnd(2,5)});}return st;};
  A.hvd_train=a=>{H.count('hvd_train');return post('training',a,'act',6);};
  A.hvd_work=a=>{H.count('hvd_work');return post('workshop',a,'act',7);};
  A.hvd_haul=a=>{const q=H.poiFree(B,'supply'),w=H.poiFree(B,'workshop');if(!q||!w)return A.hvd_work(a);H.claim(a,q);H.claim(a,w);H.count('hvd_haul');return[H.go(q.x,q.y),{k:'act',t:2},{k:'carry',what:'sack'},{k:'release',poi:q},H.go(w.x,w.y),{k:'act',t:3},{k:'carry',what:null},{k:'release',poi:w}];};
  A.hvd_cook=a=>{H.count('hvd_cook');return post('cook',a,'act',9);};
  A.hvd_repair=a=>{H.count('hvd_repair');return post('repair',a,'act',6);};
  A.hvd_messenger=a=>{const a0=p('fortress'),a1=p('workshop');if(!a0||!a1)return A.stroll(a);H.count('hvd_messenger');return[H.go(a0.x,a0.y,{run:1.6}),{k:'bubble',kind:'excl'},H.go(a1.x,a1.y,{run:1.7}),{k:'bubble',kind:'note'},{k:'idle',t:2}];};
  A.hvd_spell=a=>{const q=p('ritual');if(!q)return A.stroll(a);H.count('hvd_spell');return[H.go(q.x,q.y),{k:'face',dir:'down'},{k:'act',t:2},{k:'hvdcall',fn:x=>burst(x.x,x.y,'small')},{k:'idle',t:4}];};
  const M=S.MINI;
  M.hvd_small_spell=b=>{const a=free('redboy')[0],q=p('ritual');if(!a||!q)return false;H.assign(a,[H.go(q.x,q.y),{k:'bubble',kind:'star'},{k:'act',t:2},{k:'hvdcall',fn:x=>burst(x.x,x.y,'small')},{k:'hop',t:1},{k:'idle',t:4}],'mini');return true;};
  M.hvd_supply_fire=b=>{const a=free('worker')[0],q=p('supply');if(!a||!q)return false;H.assign(a,[H.go(q.x,q.y),{k:'carry',what:'sack'},{k:'bubble',kind:'excl'},{k:'hvdcall',fn:()=>burst(q.x,q.y,'flare')},{k:'hop',t:1.2},{k:'carry',what:null},{k:'idle',t:3}],'mini');return true;};
  M.hvd_spear=b=>{const g=free('guard',2),q=P('training');if(g.length<2||!q.length)return false;g.forEach((a,n)=>H.assign(a,[H.go(q[n%q.length].x,q[n%q.length].y),{k:'face',dir:n?'left':'right'},{k:'act',t:3},{k:'hop',t:.7},{k:'act',t:3},{k:'bubble',kind:n?'note':'excl'}],'mini'));return true;};
  M.hvd_crows=b=>{const a=free('guard')[0],q=p('watch');if(!q)return false;S.hvd.scares.push({x:q.x,y:q.y,t:0,life:8,kind:'crows'});if(a)H.assign(a,[H.go(q.x,q.y),{k:'face',dir:'up'},{k:'bubble',kind:'excl'},{k:'hop',t:1},{k:'idle',t:5}],'mini');return true;};
  M.hvd_bridge_wind=b=>{const a=free('guard')[0],q=p('bridge');if(!q)return false;S.hvd.scares.push({x:q.x,y:q.y,t:0,life:10,kind:'bridge'});if(a)H.assign(a,[H.go(q.x,q.y),{k:'bubble',kind:'excl'},{k:'hop',t:1},{k:'idle',t:4}],'mini');return true;};
  M.hvd_steam=b=>{const a=free('attendant')[0],q=p('waterfall');if(!q)return false;S.hvd.steam.push({x:q.x,y:q.y,t:0,life:12});if(a)H.assign(a,[H.go(q.x,q.y),{k:'face',dir:'right'},{k:'act',t:3},{k:'bubble',kind:'q'},{k:'idle',t:5}],'mini');return true;};
  M.hvd_messenger=b=>{const a=free('guard')[0];if(!a)return false;H.assign(a,A.hvd_messenger(a),'mini');return true;};
  const O=S.opExt,pend=(R,f)=>{R.pend=f;},at=(x,y)=>[(x+.5)*8,(y+.5)*8],target=(kind)=>{const q=p(kind);return q?[q.x,q.y]:at(15,41);};
  O.hvd_prepare=()=>{const f=S.hvd;f.deception=0;f.captive=false;f.overwhelmed=false;f.divine=false;f.recovering=false;};
  O.hvd_state=(R,o)=>{const f=S.hvd;for(const k of ['cloud','fire','water','ash'])if(o[k]!==undefined)f[k+'T']=o[k];if(o.recover!==undefined)f.recovering=o.recover;};
  O.hvd_clean=()=>{const f=S.hvd;f.deception=0;f.overwhelmed=false;f.divine=false;f.recovering=false;};
  O.hvd_deceive=(R)=>{const a=bi('redboy'),q=p('gate');if(!a||!q)return;a.story=R;S.hvd.deception=1;H.assign(a,[H.go(q.x,q.y,{run:1.5}),{k:'bubble',kind:'excl'},{k:'sit',t:3},{k:'bubble',kind:'q'},{k:'idle',t:2}],'story');pend(R,()=>!a.q.length&&!a.cur);};
  O.hvd_pilgrims=(R)=>{const g=p('gate'),roles=[['monk','tam_tang'],['wk','wukong'],['bj','bajie'],['sha','sa_tang']];if(!g)return;
    roles.forEach(([role,ch],n)=>{const loc=near(g,(n-1.5)*8,15+n*3),a=H.agent(ch,B,'actor',Math.floor(loc[0]/8),Math.floor(loc[1]/8));a.x=loc[0];a.y=loc[1];a.alpha=0;a.story=R;R.actors[role]=a;
      const dest=near(g,(n-1.5)*7,-n*4);H.assign(a,[{k:'fade',t:1.1+n*.25,in:true},H.go(dest[0],dest[1],{run:1.2}),{k:'face',dir:'up'},{k:'idle',t:2}],'story');});
    pend(R,()=>roles.every(([role])=>{const a=R.actors[role];return a&&!a.q.length&&!a.cur;}));};
  O.hvd_capture=(R)=>{const a=R.actors.monk,q=p('prison');if(!a||!q)return;a.story=R;
    H.assign(a,[{k:'bubble',kind:'excl'},H.go(q.x,q.y,{run:1.45}),{k:'hvdcall',fn:x=>{S.hvd.captive=true;x.captive=true;burst(x.x,x.y,'capture');}},{k:'sit',t:600}],'story');
    const rb=bi('redboy');if(rb){rb.story=R;H.assign(rb,[H.go(q.x+8,q.y+8,{run:1.4}),{k:'act',t:2},{k:'idle',t:3}],'story');}
    pend(R,()=>S.hvd.captive);};
  O.hvd_rescue=(R)=>{const q=p('court');if(!q)return;for(const [name,dx] of [['wk',-10],['bj',0],['sha',10]]){const a=R.actors[name];if(!a)continue;const loc=near(q,dx,4);H.assign(a,[H.go(loc[0],loc[1],{run:1.6}),{k:'face',dir:'up'},{k:'act',t:3},{k:'idle',t:1}],'story');}pend(R,()=>['wk','bj','sha'].every(n=>!R.actors[n]||(!R.actors[n].q.length&&!R.actors[n].cur)));};
  O.hvd_truefire=(R)=>{const a=bi('redboy'),q=p('ritual');if(!a||!q)return;a.story=R;S.hvd.cloudT=1;S.hvd.fireT=1;S.hvd.ashT=.8;
    H.assign(a,[H.go(q.x,q.y,{run:1.5}),{k:'face',dir:'down'},{k:'act',t:4},{k:'hvdcall',fn:x=>burst(x.x,x.y,'truefire')},{k:'act',t:6},{k:'hvdcall',fn:x=>burst(x.x,x.y,'truefire')},{k:'act',t:4}],'story');
    pend(R,()=>S.hvd.fire>.85&&!a.q.length&&!a.cur);};
  O.hvd_counter=(R)=>{const wk=R.actors.wk,q=p('ritual');if(!wk||!q)return;const loc=near(q,-12,15);
    H.assign(wk,[H.go(loc[0],loc[1],{run:1.8}),{k:'act',t:4},{k:'hvdcall',fn:x=>{burst(x.x,x.y,'counter');S.hvd.overwhelmed=true;}},{k:'hop',t:1.3},{k:'sit',t:7},{k:'bubble',kind:'dots'}],'story');
    for(const n of ['bj','sha']){const a=R.actors[n];if(a)H.assign(a,[{k:'bubble',kind:'excl'},{k:'act',t:4},{k:'hop',t:1},{k:'act',t:3}],'story');}
    pend(R,()=>S.hvd.overwhelmed);};
  O.hvd_divine=(R)=>{const q=p('ritual');if(!q)return;const loc=near(q,15,-20),a=H.agent('hvd_guanyin',B,'actor',Math.floor(loc[0]/8),Math.floor(loc[1]/8));a.x=loc[0];a.y=loc[1];a.story=R;R.actors.guanyin=a;
    S.hvd.divine=true;S.hvd.waterT=1;S.hvd.fireT=0;S.hvd.cloudT=.35;
    H.assign(a,[{k:'fly',down:true,t:3.2},{k:'face',dir:'down'},{k:'act',t:8},{k:'hvdcall',fn:()=>{const r=bi('redboy');if(r)H.assign(r,[{k:'bubble',kind:'excl'},{k:'sit',t:7},{k:'idle',t:4}],'story');}},{k:'idle',t:4}],'story');
    pend(R,()=>S.hvd.water>.75&&!a.q.length&&!a.cur);};
  O.hvd_release=(R)=>{const a=R.actors.monk,q=p('court');if(!a||!q)return;S.hvd.captive=false;a.captive=false;burst(a.x,a.y,'release');
    H.assign(a,[{k:'bubble',kind:'heart'},H.go(q.x,q.y,{run:1.15}),{k:'idle',t:3}],'story');pend(R,()=>!a.q.length&&!a.cur);};
  O.hvd_regroup=(R)=>{const q=p('court');if(!q)return;for(const [name,dx] of [['wk',-10],['bj',10],['sha',17],['monk',0]]){const a=R.actors[name];if(!a)continue;const loc=near(q,dx,8);H.assign(a,[H.go(loc[0],loc[1]),{k:'face',dir:'down'},{k:'bubble',kind:'heart'},{k:'idle',t:3}],'story');}pend(R,()=>['wk','bj','sha','monk'].every(n=>!R.actors[n]||!R.actors[n].q.length&&!R.actors[n].cur));};
  O.hvd_depart=(R)=>{const q=p('gate');if(!q)return;for(const [n,key] of ['monk','wk','bj','sha'].entries()){const a=R.actors[key];if(!a)continue;const loc=near(q,(n-1.5)*6,6);H.assign(a,[{k:'idle',t:n*1.4},H.go(loc[0],loc[1],{run:1.1}),{k:'fade',t:2,gone:true}],'story');}const g=R.actors.guanyin;if(g)H.assign(g,[{k:'idle',t:3},{k:'fly',t:2.6},{k:'call',fn:x=>{x.gone=true;}}],'story');pend(R,()=>['monk','wk','bj','sha'].every(n=>!R.actors[n]||R.actors[n].gone));};
  O.hvd_repair=(R)=>{const q=p('workshop');if(!q)return;S.hvd.recovering=true;const ls=S.agents.filter(a=>a.biome===B&&!a.gone&&!a.hidden&&['worker','attendant','guard'].includes(a.role)).slice(0,8);ls.forEach((a,n)=>{const dest=near(q,(n%4-1.5)*7,Math.floor(n/4)*8);H.assign(a,[{k:'idle',t:n*2},H.go(dest[0],dest[1]),{k:'act',t:5},{k:'bubble',kind:'note'},{k:'idle',t:4}],'story');});};
  D.beacon.hvd='255,104,74';
  D.biomes.hvd={
    residents:[['hvd_redboy',1,'redboy'],['hvd_guard',7,'guard'],['hvd_worker',4,'worker'],['hvd_worker',2,'attendant'],['hvd_trainee',3,'trainee']],
    roles:{
      redboy:[['hvd_ritual',4],['hvd_watch',2],['hvd_spell',2],['hvd_patrol',1],['stroll',1]],
      guard:[['hvd_patrol',5],['hvd_watch',3],['hvd_train',3],['hvd_messenger',1],['talk',1]],
      attendant:[['hvd_ritual',5],['hvd_cook',2],['hvd_work',1],['talk',1]],
      worker:[['hvd_haul',4],['hvd_work',4],['hvd_cook',2],['hvd_repair',2],['talk',1],['stroll',1]],
      trainee:[['hvd_train',5],['hvd_watch',1],['hvd_spell',1],['stroll',2]]
    },
    minis:['hvd_small_spell','hvd_supply_fire','hvd_spear','hvd_crows','hvd_bridge_wind','hvd_steam','hvd_messenger'],
    stories:[{id:'three_flavored_fire',title:['Hồng Hài Nhi và Lửa Tam Muội','Red Boy and the Three-Flavored True Fire'],
      fore:[['hvd_prepare',{}],['hvd_state',{cloud:.28,ash:.1}],['gather',{at:'court',r:4,roles:['guard','attendant'],n:6}],['bubble',{who:'crowd',kind:'excl'}],['disperse',{}]],
      beats:[
        ['hvd_pilgrims',{}],['hvd_deceive',{}],['go',{who:'monk',to:'gate'}],['hvd_capture',{}],['hvd_rescue',{}],
        ['hvd_state',{cloud:.65,ash:.35}],['hvd_truefire',{}],['hvd_counter',{}],['wait',{t:5}],
        ['hvd_divine',{}],['wait',{t:4}],['hvd_release',{}],['hvd_regroup',{}],
        ['hvd_state',{cloud:.18,fire:0,water:.75,ash:.55}],['hvd_depart',{}],['hvd_repair',{}]
      ],
      after:{fx:'sparks',at:'ritual',r:28},
      recover:[['hvd_state',{cloud:0,fire:0,water:0,ash:0,recover:true}],['wait',{t:10}],['hvd_repair',{}],['wait',{t:18}],['hvd_clean',{}]]
    }]
  };
})();
