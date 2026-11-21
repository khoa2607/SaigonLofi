// Đại Lôi Âm Tự: a close-up of the four pilgrims kneeling (and of the bow) during the signature. node tests/tayduky-v2-lat-kneel.mjs [outDir]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/lat'; fs.mkdirSync(out, { recursive: true });
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); });
  await send('Page.navigate', { url: base + 'tayduky/index.html?at=latcourt&tod=day&zoom=2.5&seed=7&force=lat&speed=3' }); await wait(5000);
  const got = {}; const t0 = Date.now();
  while (Date.now() - t0 < 600000 && Object.keys(got).length < 2) {
    const st = JSON.parse(await ev(`(()=>{const a=TWS.agents.filter(x=>x.biome==='lat'&&x.role==='actor'&&!x.gone);return JSON.stringify({k:a.filter(x=>x.pose==='kneel'&&x.kneelP>0.95).length,b:a.filter(x=>(x.bowP||0)>0.9).length})})()`));
    for (const [key, name, test] of [['k', 'lat-kneel-four', st.k >= 4], ['b', 'lat-kneel-bow', st.b >= 2]]) if (test && !got[name]) { await ev('TWS.speed=0.0001'); await wait(500); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(s.data, 'base64')); console.log('shot', name); got[name] = 1; await ev('TWS.speed=3'); }
    await wait(120);
  }
  console.log(JSON.stringify({ got: Object.keys(got), errors: errs })); process.exitCode = errs.length || Object.keys(got).length < 1 ? 1 : 0;
});
