'use strict';
// Battle of Silk Web Cave extends the existing Living Story Loop with coordinated action.
(function () {
  const S = TWS, api = S.H, T = 8;
  const net = TW_DATA.biomes.btd.stories.find(story => story.id === 'net');
  net.title = ['Trận chiến Bàn Tơ Động', 'The Battle of Silk Web Cave'];
  net.fore = [
    ['web',{glow:true}], ['assemble',{}], ['gather',{at:'battle',r:3.2,roles:['sister'],n:7}],
    ['reweave',{dur:30}], ['fx',{kind:'silkrise',at:'battle',dur:15}],
    ['gather',{at:'battle',r:4,roles:['spiderling'],n:8}]
  ];
  net.beats = [
    ['assemble',{}],['web',{target:1,rate:0.04}],
    ['spawn',{id:'monk',char:'tam_tang',from:'edge',edge:'east'}],
    ['go',{who:'monk',to:'prison',run:1.35}],
    ['wrap',{who:'monk',on:true}],['bubble',{who:'monk',kind:'excl'}],
    ['fx',{kind:'silk',at:'monk',dur:10}],['wait',{t:3}],
    ['spawn',{id:'wk',char:'wukong',from:'sky',at:'battle',off:[1,0]}],
    ['spawn',{id:'bj',char:'bajie',from:'edge',edge:'east'}],
    ['spawn',{id:'sha',char:'sa_tang',from:'edge',edge:'east'}],
    ['go',{who:'bj',to:'battle',off:[-2,2]}],
    ['go',{who:'sha',to:'battle',off:[2,2]}],
    ['battle',{t:8}],
    ['strike',{who:'wk',at:'sister'}],
    ['strike',{who:'bj',at:'sister'}],
    ['strike',{who:'sha',at:'sister'}],
    ['battle',{t:7}],
    ['summon',{n:5}],
    ['wait',{t:5}],
    ['web',{target:0.12,rate:0.65,glow:false}],
    ['fx',{kind:'shreds',at:'prison',dur:18,r:80}],
    ['wrap',{who:'monk',on:false}],['bubble',{who:'monk',kind:'heart'}],
    ['retreat',{roles:['sister'],to:'cave'}],['scatter',{roles:['spiderling']}],
    ['litter',{at:'battle',n:18,r:4}],
    ['go',{who:'monk',to:'battle'}],['wait',{t:2}],
    ['leave',{who:'monk',by:'walk',to:'mouthE'}],
    ['leave',{who:'wk',by:'walk',to:'mouthE'}],
    ['leave',{who:'bj',by:'walk',to:'mouthE'}],
    ['leave',{who:'sha',by:'walk',to:'mouthE'}]
  ];
  net.after = {fx:'shreds',at:'battle',r:85};
  net.recover = [
    ['return',{roles:['sister']}],
    ['web',{target:0.55,rate:0.005,glow:false}],
    ['reweave',{dur:100}],
    ['clean',{roles:['sister','spiderling'],dur:90}]
  ];

  S.opExt.assemble = (R,o,B) => {
    const centre=api.point(B,'battle',R);
    const sisters=S.agents.filter(a=>a.biome===B.id&&a.role==='sister');
    sisters.forEach((a,n)=>{
      const reveal=a.hidden, p=api.ring(B.id,centre[0],centre[1],3.6,n,sisters.length);
      a.hidden=false; a.alpha=reveal?0:1; a.retreated=false; a.story=R;
      api.assign(a,[reveal?{k:'fade',t:0.7,in:true}:null,p&&api.go(p[0],p[1],{run:3.4}),{k:'face',x:centre[0],y:centre[1]},{k:'idle',t:120}], 'assemble');
    });
    R.pend=()=>sisters.every(a=>Math.hypot(a.x-centre[0],a.y-centre[1])<5*T);
  };

  S.opExt.battle = (R,o,B) => {
    const centre = api.point(B,'battle',R);
    const sisters = S.agents.filter(a => a.biome === B.id && a.role === 'sister');
    sisters.forEach((a,n) => {
      if(a.hidden) { a.hidden=false; a.alpha=0; }
      a.story=R; a.gathered=null;
      const pt = api.ring(B.id,centre[0],centre[1],n%2?2.7:3.5,n,sisters.length);
      const steps = pt ? [api.go(pt[0],pt[1],{run:1.25})] : [];
      api.assign(a,[{k:'fade',t:0.6,in:true},...steps,{k:'face',x:centre[0],y:centre[1]},{k:'act',t:o.t}], 'battle');
      api.fx('silk',a.x,a.y,o.t,B.id,{r:25});
    });
    for(const name of ['wk','bj','sha']) {
      const a=R.actors[name]; if(!a) continue;
      a.story=R; a.dir='up';
      api.assign(a,[{k:'act',t:o.t}],'battle');
      api.fx('sparks',centre[0]+(name==='bj'?-16:name==='sha'?16:0),centre[1],o.t,B.id,{r:28});
    }
    for(const a of S.agents.filter(a=>a.biome===B.id&&a.role==='spiderling'&&!a.hidden).slice(0,7)) {
      const pt=api.nearestWalk(centre[0]+(S.R()-.5)*36,centre[1]+(S.R()-.5)*28,B.id,3);
      if(pt) api.assign(a,[api.go(pt[0],pt[1],{run:1.8}),{k:'act',t:3}],'battle');
    }
    R.wait=o.t;
  };
  S.opExt.summon = (R,o,B) => {
    const wk=R.actors.wk, prison=api.point(B,'prison',R);
    if(wk) api.assign(wk,[{k:'act',t:3}],'summon');
    for(let n=0;n<o.n;n++) {
      const p=api.nearestWalk(wk.x+(n-2)*6,wk.y+8,B.id,3);
      if(!p) continue;
      const a=api.agent('khi_con',B.id,'actor',Math.floor(p[0]/T),Math.floor(p[1]/T)); a.story=R;
      const q=api.nearestWalk(prison[0]+(n-2)*5,prison[1]+8,B.id,4);
      if(q) api.assign(a,[api.go(q[0],q[1],{run:2.2}),{k:'act',t:4},{k:'fade',t:1,gone:true}],'clone');
      api.fx('silk',prison[0],prison[1],5,B.id,{r:28});
    }
    R.wait=8;
  };
})();
