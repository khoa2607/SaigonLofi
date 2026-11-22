// Ngũ Hành Sơn signature: runs "Five Hundred Years Beneath the Mountain" in headless Chrome and captures every phase (the time-lapse seasons, Tang Sanzang on the white horse, the plea, the climb, the seal lifted, the quake,
// Wukong bursting out and flying, landing, the change into pilgrim robes, the bow, master and disciple leaving, recovery, the new seal). An in-page recorder watches the story state every 30 ms and freezes the simulation the moment
// an event appears so each frame is captured at its peak.   node tests/tayduky-v2-nhs.mjs [outDir] [speed] [at] [zoom]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/nhs', speed = +(process.argv[3] || 3), at = process.argv[4] || 'nhsprison', zoom = process.argv[5] || '2'; fs.mkdirSync(out, { recursive: true });
const NAMES = { fore: 'a1-foreshadow', tl_spring: 'a2-timelapse-spring', tl_summer: 'a3-timelapse-summer', tl_autumn: 'a4-timelapse-autumn', tl_winter: 'a5-timelapse-winter', tl_late: 'a6-year-500', approach: 'a7-tang-sanzang-arrives', plead: 'a8-wukong-pleads', climb: 'a9-monk-climbs', seal: 'b1-seal-lifts', quake: 'b2-mountain-trembles', burst: 'b3-wukong-bursts-free', fly: 'b4-wukong-flies', land: 'b5-wukong-lands', smoke: 'b6-robe-change', bow: 'b7-wukong-bows', descend: 'b8-leaving-together', recover: 'b9-recovery', reseal: 'c1-new-seal' };
const DELAY = { fore: 800, tl_spring: 900, tl_summer: 900, tl_autumn: 900, tl_winter: 900, seal: 700, quake: 300, burst: 700, fly: 200, smoke: 450, bow: 250 };
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); });
  await send('Page.navigate', { url: base + `tayduky/index.html?at=${at}&tod=day&zoom=${zoom}&seed=7&force=nhs&speed=` + speed }); await wait(6000);
  await ev(`(()=>{window.__ev=[];window.__k={};window.__sp=${speed};setInterval(()=>{const f=TWS.nhs,b=TWS.biomes.nhs,p=b.phase,tl=f.tl,ag=TWS.agents.filter(a=>a.biome==='nhs'&&a.role==='actor'),mk=ag.find(a=>a.char==='tam_tang'),wk=ag.find(a=>a.char==='wukong'),add=(k,c)=>{if(c&&!__k[k]){__k[k]=1;__ev.push(k);TWS.speed=0.0001;}};
    const sNow=f.sf>0.5?f.sb:f.sa;
    add('fore',p==='fore'&&f.glow>0.4);
    if(tl.on&&tl.years>40&&f.sf<0.1){add('tl_spring',sNow===0&&f.sf<0.1);add('tl_summer',sNow===1&&__k.tl_spring);add('tl_autumn',sNow===2&&__k.tl_summer);add('tl_winter',sNow===3&&__k.tl_autumn);}
    add('tl_late',tl.on&&tl.years>=470);
    add('approach',mk&&mk.rideOf&&Math.hypot(mk.x-TW_C[0],mk.y-TW_C[1])<70);
    add('plead',f.prison.anim==='plead'&&__k.approach&&S_t()-f.prison.t0>0.9);
    add('climb',mk&&!mk.rideOf&&mk.gz>=52);
    add('seal',f.seal.st==='lift'&&f.seal.t>2.2);add('quake',f.cracks>0.8&&!f.prison.burst);
    add('burst',f.prison.burst&&f.bursts.some(q=>q.kind==='burst'&&q.t>0.35));
    add('fly',wk&&wk.lift>34&&__k.burst);
    add('land',wk&&wk.look==='wukong'&&wk.lift<1&&wk.pose==='idle'&&__k.fly&&TWS.nhs.cracks<0.1);
    add('smoke',f.bursts.some(q=>q.kind==='smoke'&&q.t>0.4));
    add('bow',wk&&wk.look==='wk_pilgrim'&&wk.pose==='sit');
    add('descend',mk&&mk.rideOf&&wk&&wk.look==='wk_pilgrim');
    add('recover',p==='after'&&f.prison.burst&&f.seal.st==='gone');
    add('reseal',f.seal.st==='return'&&f.seal.t>2.5);
    },30);window.TW_C=[(TWM.nhs.x0+12.5)*8,(TWM.nhs.y0+27.8)*8];window.S_t=()=>TWS.t;return 1})()`);
  const ok = {}; let t0 = Date.now(), last = null;
  while (Date.now() - t0 < 1500000) {
    const e = await ev('(()=>{const k=__ev.shift();return k||""})()');
    if (e) { await wait(DELAY[e] || 400); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${NAMES[e]}.png`, Buffer.from(s.data, 'base64')); console.log('shot', NAMES[e]); ok[e] = 1; await ev(`TWS.speed=__sp`); if (e === 'reseal') break; continue; }
    last = await ev(`JSON.stringify({phase:TWS.biomes.nhs.phase,seal:TWS.nhs.seal.st,yr:TWS.nhs.tl.years,sp:+(TWS.nhs.sp%4).toFixed(2)})`); await wait(200);
  }
  console.log(JSON.stringify({ ok, last, errors: errs }));
  const need = Object.keys(NAMES).filter(k => !['tl_late', 'fore'].includes(k));
  if (errs.length || need.some(k => !ok[k])) { console.log('FAIL missing: ' + need.filter(k => !ok[k]).join(',')); process.exitCode = 1; } else console.log('PASS');
});
