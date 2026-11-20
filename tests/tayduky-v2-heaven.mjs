// Browser captures and focused checks for the two Heaven signatures and mask overview.
import { withChrome, wait } from './cdp.mjs';
import fs from 'node:fs';
const out=process.argv[2]||'docs/tayduky/v2/screenshots/thien-cung-pass';fs.mkdirSync(out,{recursive:true});
await withChrome(1920,1080,async ({base,send,ev,on})=>{
  const errors=[];on(m=>{if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails));});
  for(const story of ['havoc_heaven','peach_banquet']){
    await send('Page.navigate',{url:base+'tayduky/index.html?at=tc&tod=day&zoom=2&seed=7&speed=8'});await wait(4000);
    await ev(`(()=>{for(const b of Object.values(TWS.biomes))if(b.id!=='tc')b.timer=1e8;const b=TWS.biomes.tc;b.last='${story==='havoc_heaven'?'peach_banquet':'havoc_heaven'}';b.timer=.1;})()`);
    let found=false;for(let i=0;i<120;i++){const v=await ev(`(()=>{const b=TWS.biomes.tc;return !!(b.phase==='sig'&&b.story&&b.story.id==='${story}'&&b.run&&b.run.i>=3)})()`);if(v){found=true;break;}await wait(500);}
    if(!found)throw Error('signature not reached: '+story);
    await ev(`(()=>{const c=TWM.layout.map(86,20);TWR.lookAt(c[0]*8,c[1]*8,4)})()`);await wait(1200);
    const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${out}/${story}.png`,Buffer.from(shot.data,'base64'));console.log('signature captured',story);
  }
  const perf={};for(const z of [1,2]){await ev(`TWR.zoom=${z};TWR.resize();(()=>{const c=TWM.layout.map(85,21);TWR.lookAt(c[0]*8,c[1]*8,4)})()`);await wait(2500);
    perf[z]=JSON.parse(await ev(`new Promise(resolve=>{const dt=[],draw=[];let last=performance.now();function tick(now){dt.push(now-last);draw.push(TWR.frameMs);last=now;if(dt.length<120)requestAnimationFrame(tick);else{dt.sort((a,b)=>a-b);draw.sort((a,b)=>a-b);resolve(JSON.stringify({frameMedian:dt[60],frameP90:dt[108],drawMedian:draw[60],drawP90:draw[108]}))}}requestAnimationFrame(tick)})`,true));}
  console.log('heaven performance',JSON.stringify(perf));
  // Capture a labelled diagnostic of the real BIO grid; it is not a zoomed-out game view.
  await ev(`(()=>{const c=document.createElement('canvas');c.width=1920;c.height=1080;const g=c.getContext('2d');g.fillStyle='#171522';g.fillRect(0,0,1920,1080);const cols=['#d9c38d','#c3623f','#cd7f91','#59426c','#9c98a3','#c3aa70','#568bab','#e8d8eb','#e5d09a','#889ca0','#75ab7e','#79a18b','#dc7951','#a77987','#927b62'];for(let j=1;j<159;j++)for(let i=1;i<159;i++){const k=TWM.id(i,j);g.fillStyle=cols[TWM.BIO[k]];g.fillRect(50+i*5,80+j*5,5,5);if(TWM.PATHC[k]){g.fillStyle='#ffffff';g.fillRect(50+i*5+2,80+j*5+2,1,1)}}g.font='bold 32px sans-serif';g.fillStyle='#fff';g.fillText('15 BIOMES - ACTUAL TILE MASK',55,50);g.font='24px sans-serif';TWM.biomes.forEach((b,i)=>{g.fillStyle=cols[i];g.fillRect(940,90+i*50,28,28);g.fillStyle='#fff';g.fillText(b.id.toUpperCase()+'  '+b.title[0],985,114+i*50)});document.body.innerHTML='';document.body.style.margin='0';document.body.appendChild(c)})()`);
  const map=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${out}/map-15-mask.png`,Buffer.from(map.data,'base64'));
  if(errors.length)throw Error(errors.join('\n'));console.log('PASS');
});
