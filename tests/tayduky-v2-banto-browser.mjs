// Real browser captures of Bàn Tơ's four story stages and environment.
import {withChrome,wait} from './cdp.mjs';
import fs from 'node:fs';
const out='docs/tayduky/v2/screenshots/banto-redesign';
fs.mkdirSync(out,{recursive:true});
await withChrome(1920,1080,async({base,send,ev,on})=>{
  const errors=[];
  on(m=>{if(m.method==='Runtime.exceptionThrown') errors.push(JSON.stringify(m.params.exceptionDetails));});
  await send('Page.navigate',{url:base+'tayduky/index.html?at=btd&zoom=1&seed=7&tod=day'});
  await wait(5000);
  const state=JSON.parse(await ev(`JSON.stringify({gate:TWM.props.filter(p=>p.biome==='btd'&&['btthrone','btprison','btcave'].includes(p.kind)).map(p=>p.kind),actions:['bajie','sa_tang','tam_tang','wukong'].map(n=>TD2_CHARS.chars[n].bantoAction?.src),falls:TWM.falls.filter(p=>p.biome==='btd').length})`));
  if(state.gate.length!==3||state.actions.some(x=>!x)||state.falls!==3)throw Error(JSON.stringify(state));
  const grab=async(name,at='battle',zoom=1,tod='day')=>{
    await ev(`(()=>{const p=TWM.pois.find(p=>p.biome==='btd'&&p.kind==='${at}');TWR.zoom=${zoom};TWR.resize();TWR.tod='${tod}';TWR.clock=${tod==='night'?22:11};TWR.lookAt(p.x,p.y,TWM.groundZ(p.x,p.y));})()`);
    await wait(550);
    const shot=await send('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(out+'/'+name+'.png',Buffer.from(shot.data,'base64'));
  };
  await grab('day');
  await grab('night','battle',1,'night');
  await grab('normal-day','battle',2,'day');
  await grab('normal-night','battle',2,'night');
  await grab('wide','battle',1,'day');
  await grab('waterfall','prison',2,'day');
  await ev(`(()=>{for(const b of Object.values(TWS.biomes))b.timer=b.id==='btd'?.1:1e8})()`);
  const targets=[['capture',7,'sig'],['battle',15,'sig'],['rescue',20,'sig'],['aftermath',0,'after'],['recovery',0,'after']];
  for(const [name,beat,phase] of targets){
    let found=false;
    for(let i=0;i<1200;i++){
      const now=JSON.parse(await ev(`(()=>{for(let n=0;n<10;n++)TWS.tick(.1);const b=TWS.biomes.btd;return JSON.stringify({phase:b.phase,i:b.run?.i||0,run:!!b.run})})()`));
      if(now.phase===phase&&(name==='recovery'?!now.run:name==='aftermath'||now.i>=beat)){found=true;break;}
    }
    if(!found)throw Error('missed '+name);
    if(name==='recovery') await ev(`(()=>{for(let n=0;n<350;n++)TWS.tick(.1)})()`);
    await grab(name,name==='capture'?'prison':'battle',name==='capture'?2:1,'day');
  }
  const smoke=[];
  for(const at of ['hqs','tc','hds','btp','sdl']){
    await send('Page.navigate',{url:base+`tayduky/index.html?at=${at}&zoom=2&seed=7&tod=day`});
    await wait(1800);
    const state=JSON.parse(await ev(`JSON.stringify({built:TWM.biomes.find(b=>b.id==='${at}').built,frame:TWR.frameMs,items:TWR.stats?.items})`));
    if(!state.built||!Number.isFinite(state.frame)||!state.items)throw Error('smoke '+at+': '+JSON.stringify(state));
    smoke.push(at);
  }
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({state,captures:targets.map(t=>t[0]),smoke,errors}));
  console.log('PASS');
});
