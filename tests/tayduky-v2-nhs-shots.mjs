// Ngũ Hành Sơn: camera / season / day-night shots of the biome (headless Chrome).
// node tests/tayduky-v2-nhs-shots.mjs [outDir] [targets,comma] [seasons,comma 0-3 | -] [tod] [zoom]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/nhs', targets = (process.argv[3] || 'nhs,nhsprison,nhssummit,nhsgate,nhsfall,nhseast,nhsrim,nhsborder').split(','), seasons = (process.argv[4] || '-').split(','), tod = process.argv[5] || 'day', zoom = process.argv[6] || '1'; fs.mkdirSync(out, { recursive: true });
const SN = ['spring', 'summer', 'autumn', 'winter'];
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); });
  for (const t of targets) for (const s of seasons) {
    await send('Page.navigate', { url: base + `tayduky/index.html?at=${t}&tod=${tod}&zoom=${zoom}&seed=7&speed=1` }); await wait(5000);
    if (s !== '-') await ev(`(()=>{TWS.speed=0.0001;TWS.nhs.sp=${+s}+0.3;TWS.nhs.sa=${+s};TWS.nhs.sb=${+s};TWS.nhs.sf=0;TWS.nhs.age=${s === '3' ? 0 : 0.05};TWS.nhs.ageT=TWS.nhs.age;return 1})()`);
    await wait(s === '-' ? 2500 : 3500);
    const sh = await send('Page.captureScreenshot', { format: 'png' }); const name = `${t}${s === '-' ? '' : '-' + SN[+s]}${tod === 'night' ? '-night' : ''}`; fs.writeFileSync(`${out}/${name}.png`, Buffer.from(sh.data, 'base64')); console.log('shot', name);
  }
  console.log(JSON.stringify({ errors: errs })); console.log(errs.length ? 'FAIL' : 'PASS');
});
