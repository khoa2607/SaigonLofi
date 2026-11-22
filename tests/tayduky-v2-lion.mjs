// Sư Đà Lĩnh signature: runs "The Three Kings Convene" in headless Chrome and captures each phase; checks the kings really grow and return, no console errors.
// node tests/tayduky-v2-lion.mjs [outDir] [speed]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/sdl', speed = +(process.argv[3] || 4); fs.mkdirSync(out, { recursive: true });
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); });
  await send('Page.navigate', { url: base + 'tayduky/index.html?at=sdlcit&tod=day&zoom=1&seed=7&force=sdl&speed=' + speed }); await wait(6000);
  const shot = async n => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${n}.png`, Buffer.from(s.data, 'base64')); console.log('shot', n); };
  const st = () => ev(`(()=>{const f=TWS.lion,b=TWS.biomes.sdl;const ks=TWS.agents.filter(a=>a.biome==='sdl'&&/_king$/.test(a.role));return JSON.stringify({phase:b.phase,i:b.run?b.run.i:-1,storm:+f.storm.toFixed(2),beacon:+f.beacon.toFixed(2),giants:f.giants,scales:ks.map(a=>a.scale||1),flying:ks.filter(a=>a.flying).length,rings:f.rings.length})})()`).then(JSON.parse);
  const done = new Set(), ok = { fore: 0, fly: 0, giant: 0, beacon: 0, home: 0 }; let t0 = Date.now(), last = null, maxScale = 1, afterBig = false;
  while (Date.now() - t0 < 600000) {
    const s = await st(); last = s; maxScale = Math.max(maxScale, ...s.scales); if (maxScale > 1) afterBig = true;
    if (s.phase === 'fore' && !done.has('1')) { done.add('1'); await wait(2500); await shot('s1-foreshadow'); ok.fore = 1; }
    if (s.flying && !done.has('2')) { done.add('2'); await shot('s2-kings-leap'); ok.fly = 1; }
    if (s.giants >= 3 && s.scales.every(v => v > 1) && !done.has('3')) { done.add('3'); await wait(1800); await shot('s3-three-giants'); ok.giant = 1; }
    if (s.beacon > 0.8 && s.giants >= 3 && !done.has('4')) { done.add('4'); await wait(500); await shot('s4-beacons-oath'); ok.beacon = 1; }
    if (afterBig && s.scales.every(v => v === 1) && s.phase !== 'sig' && !done.has('5')) { done.add('5'); await wait(2500); await shot('s5-recovery'); ok.home = 1; break; }
    await wait(500);
  }
  console.log(JSON.stringify({ ok, last, maxScale, errors: errs }));
  if (errs.length || Object.values(ok).some(v => !v)) { console.log('FAIL'); process.exitCode = 1; } else console.log('PASS');
});
