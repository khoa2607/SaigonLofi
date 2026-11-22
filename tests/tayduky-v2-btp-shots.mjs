// Buddha's Palm review screenshots (day, night, wide, close, rim, seam) + a console-error check. node tests/tayduky-v2-hqs-shots.mjs [outDir]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/btp'; fs.mkdirSync(out, { recursive: true });
const SHOTS = [['btp-day-wide', 'at=btp&tod=day&zoom=1'], ['btp-night-wide', 'at=btp&tod=night&zoom=1'], ['btp-day-close', 'at=btp&tod=day&zoom=2'], ['btp-night-close', 'at=btpfingers&tod=night&zoom=2'], ['btp-fingers', 'at=btpfingers&tod=day&zoom=1'], ['btp-buddha', 'at=btpbuddha&tod=day&zoom=2'], ['btp-thumb', 'at=btpthumb&tod=day&zoom=1'],
  ['btp-wrist', 'at=btpwrist&tod=day&zoom=1'], ['btp-west', 'at=btpwest&tod=day&zoom=1'], ['btp-rim-south', 'at=btprim&tod=day&zoom=1'], ['btp-seam-east', 'at=btpseam&tod=day&zoom=1'], ['btp-north', 'at=btpnorth&tod=day&zoom=1'], ['btp-south', 'at=btpsouth&tod=day&zoom=1']];
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon|404/.test(m.params.entry.text)) errs.push(m.params.entry.text); });
  for (const [name, q] of SHOTS) { await send('Page.navigate', { url: base + 'tayduky/index.html?seed=7&' + q }); await wait(5500); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(s.data, 'base64')); console.log('shot', name); }
  console.log(JSON.stringify({ errors: errs })); console.log(errs.length ? 'FAIL' : 'PASS'); process.exitCode = errs.length ? 1 : 0;
});
