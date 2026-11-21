// Hắc Phong Sơn signature: runs "The Black Bear and the Burning Temple" in headless Chrome and captures every phase (fire, collapse, the kasaya theft, the transformation into the giant bear, roar, swipe, slam, charge,
// Guanyin, dissolve, scaffold, the new hall). An in-page recorder watches the story state every 30 ms and freezes the simulation the moment an event appears so each frame is captured at its peak.
// node tests/tayduky-v2-hps.mjs [outDir] [speed] [at]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/hps', speed = +(process.argv[3] || 3), at = process.argv[4] || 'hps'; fs.mkdirSync(out, { recursive: true });
const NAMES = { fore: 'b1-foreshadow', fire: 'b2-temple-fire', collapse: 'b3-collapse', steal: 'b4-kasaya-stolen', smoke: 'b5-transform-smoke', giant: 'b6-giant-bear', roar: 'b7-roar-shockwave', swipe: 'b8-claw-swipe', hurt: 'b9-wukong-counter', slam: 'b10-ground-slam', charge: 'b11-charge', guan: 'b12-guanyin', dissolve: 'b13-dissolve', scaffold: 'b14-rebuilding', newhall: 'b15-new-hall' };
const DELAY = { fore: 1200, fire: 1500, collapse: 600, scaffold: 1500, newhall: 600 };
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); });
  await send('Page.navigate', { url: base + `tayduky/index.html?at=${at}&tod=day&zoom=1&seed=7&force=hps&speed=` + speed }); await wait(6000);
  await ev(`(()=>{window.__ev=[];window.__k={};window.__sp=${speed};setInterval(()=>{const f=TWS.hps,b=TWS.biomes.hps,g=f.giant,p=b.phase,add=(k,c)=>{if(c&&!__k[k]){__k[k]=1;__ev.push(k);TWS.speed=0.02;}};
    add('fore',p==='fore');add('fire',p==='sig'&&f.fire.temple>0.8);add('collapse',f.tstate==='ruin');add('steal',f.kasaya===1&&f.tstate==='ruin');add('smoke',g&&g.phase==='smoke'&&g.alpha>0.35);add('giant',g&&g.phase==='live'&&g.anim==='idle'&&__k.smoke);
    add('roar',g&&g.anim==='roar'&&g.fr>=4);add('swipe',g&&g.anim==='swipe'&&g.fr>=4);add('hurt',g&&g.anim==='hurt'&&!g.bound&&g.fr>=2&&__k.swipe);add('slam',g&&g.anim==='slam'&&g.fr>=5);add('charge',g&&g.anim==='walk'&&g.speed>15&&__k.slam);
    add('guan',f.guan>0.7);add('dissolve',g&&g.phase==='dissolve'&&g.alpha<0.7);add('scaffold',f.tstate==='scaffold'&&f.rebuild>0.1);add('newhall',__k.scaffold&&f.tstate==='ok'&&p!=='sig'&&f.newT>0&&TWS.t-f.newT<3);},30);return 1})()`);
  const ok = {}; let t0 = Date.now(), last = null;
  while (Date.now() - t0 < 1500000) {
    const e = await ev('(()=>{const k=__ev.shift();return k||""})()');
    if (e) { await wait(DELAY[e] || 350); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${NAMES[e]}.png`, Buffer.from(s.data, 'base64')); console.log('shot', NAMES[e]); ok[e] = 1; await ev(`TWS.speed=__sp`); if (e === 'newhall') break; continue; }
    last = await ev(`JSON.stringify({phase:TWS.biomes.hps.phase,ts:TWS.hps.tstate,g:TWS.hps.giant?TWS.hps.giant.anim:null})`); await wait(200);
  }
  console.log(JSON.stringify({ ok, last, errors: errs }));
  const need = Object.keys(NAMES).filter(k => k !== 'hurt' && k !== 'charge');
  if (errs.length || need.some(k => !ok[k])) { console.log('FAIL missing: ' + need.filter(k => !ok[k]).join(',')); process.exitCode = 1; } else console.log('PASS');
});
