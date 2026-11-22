// Đại Lôi Âm Tự review shots + console errors. node tests/tayduky-v2-lat-shots.mjs [outDir]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/lat'; fs.mkdirSync(out, { recursive: true });
const SHOTS = [['lat-day-wide', 'at=lat&tod=day&zoom=0.8'], ['lat-night-wide', 'at=lat&tod=night&zoom=0.8'], ['lat-foot', 'at=latfoot&tod=day&zoom=1.5'], ['lat-gate', 'at=latgate&tod=day&zoom=1.5'], ['lat-court', 'at=latcourt&tod=day&zoom=1.5'], ['lat-hall', 'at=lathall&tod=day&zoom=1.5'], ['lat-hall-night', 'at=lathall&tod=night&zoom=1.5'],
  ['lat-pool', 'at=latpool&tod=day&zoom=1.5'], ['lat-fall', 'at=latfall&tod=day&zoom=1.5'], ['lat-bodhi', 'at=latbodhi&tod=day&zoom=1.5'], ['lat-rim-east', 'at=latrim&tod=day&zoom=1'], ['lat-rim-west', 'at=latwest&tod=day&zoom=1'], ['lat-rim-north', 'at=latnorth&tod=day&zoom=1'], ['lat-seam-south', 'at=latseam&tod=day&zoom=1']];
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon|404/.test(m.params.entry.text)) errs.push(m.params.entry.text); });
  for (const [name, q] of SHOTS) { await send('Page.navigate', { url: base + 'tayduky/index.html?seed=7&' + q }); await wait(2500); await ev(`(()=>{for(const b of Object.values(TWS.biomes)){b.timer=1e9;if(b.id==='lat'){b.phase='peace';b.run=null;b.story=null;}}return 1})()`); await wait(300); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(s.data, 'base64')); console.log('shot', name); }
  console.log(JSON.stringify({ errors: errs })); console.log(errs.length ? 'FAIL' : 'PASS'); process.exitCode = errs.length ? 1 : 0;
});
