// Tây Du Ký v2: drive one biome's signature story in headless Chrome and screenshot its beats.
// node tests/tayduky-v2-story.mjs <biome> <outPrefix> [tod=day] [speed=6] [shots=4] [gap ms=2500]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const [b, out, tod, speed, n, gap] = [process.argv[2] || 'hqs', process.argv[3] || 'story', process.argv[4] || 'day', +(process.argv[5] || 6), +(process.argv[6] || 4), +(process.argv[7] || 2500)];
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); });
  await send('Page.navigate', { url: base + `tayduky/index.html?at=${b}&tod=${tod}&zoom=2&seed=7&speed=${speed}&force=${b}` }); await wait(2500);
  // wait for the signature, then follow its focal point
  for (let k = 0; k < 120; k++) { const ph = await ev(`TWS.biomes['${b}'].phase`); if (ph === 'sig') break; await wait(500); }
  for (let s = 0; s < n; s++) {
    await ev(`(()=>{const B=TWS.biomes['${b}']; const p=${b === 'hqs' ? "TWM.pois.find(q=>q.kind==='court')" : "({x:(TWM.btd.canopy[0]+0.5)*8,y:(TWM.btd.canopy[1]+0.5)*8})"}; TWR.lookAt(p.x,p.y-${b === 'hqs' ? 10 : 0},TWM.groundZ(p.x,p.y));})()`);
    await wait(gap);
    const st = await ev(`JSON.stringify({phase: TWS.biomes['${b}'].phase, beat: TWS.biomes['${b}'].run && TWS.biomes['${b}'].run.i, web: +TWS.web.ext.toFixed(2), litter: TWS.litter.length})`);
    const sh = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}-${s}.png`, Buffer.from(sh.data, 'base64')); console.log(s, st);
  }
  if (errs.length) console.log('ERRORS', errs);
});
