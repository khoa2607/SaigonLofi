// Hắc Phong Sơn: day / night camera shots of the biome (headless Chrome). node tests/tayduky-v2-hps-shots.mjs [outDir] [targets,comma] [tod]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/hps', targets = (process.argv[3] || 'hps,hpstemple,hpscourt,hpsgate,hpslair,hpsravine,hpssource,hpsback').split(','), tod = process.argv[4] || 'day'; fs.mkdirSync(out, { recursive: true });
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); });
  for (const t of targets) { await send('Page.navigate', { url: base + `tayduky/index.html?at=${t}&tod=${tod}&zoom=1&seed=7` }); await wait(7000); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${t}${tod === 'night' ? '-night' : ''}.png`, Buffer.from(s.data, 'base64')); console.log('shot', t); }
  console.log(JSON.stringify({ errors: errs })); console.log(errs.length ? 'FAIL' : 'PASS');
});
