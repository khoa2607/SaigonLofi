// Hoa Quả Sơn review screenshots (day, night, wide, close, rim, seam) + a console-error check. node tests/tayduky-v2-hqs-shots.mjs [outDir]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/hqs'; fs.mkdirSync(out, { recursive: true });
const SHOTS = [['hqs-day-wide', 'at=hqs&tod=day&zoom=1'], ['hqs-night-wide', 'at=hqs&tod=night&zoom=1'], ['hqs-day-close', 'at=hqscourt&tod=day&zoom=2'], ['hqs-night-close', 'at=hqscourt&tod=night&zoom=2'], ['hqs-fall', 'at=hqsfall&tod=day&zoom=1'], ['hqs-fall-close', 'at=hqscave&tod=day&zoom=2'], ['hqs-fall-night', 'at=hqsfall&tod=night&zoom=1'],
  ['hqs-source', 'at=hqssource&tod=day&zoom=1'], ['hqs-court', 'at=hqscourt&tod=day&zoom=1'], ['hqs-village', 'at=hqsvillage&tod=day&zoom=1'], ['hqs-summit', 'at=hqssummit&tod=day&zoom=1'], ['hqs-orchard', 'at=hqsorchard&tod=day&zoom=1'], ['hqs-yard', 'at=hqsyard&tod=day&zoom=1'], ['hqs-gate', 'at=hqsgate&tod=day&zoom=1'], ['hqs-beach', 'at=hqsbeach&tod=day&zoom=1'],
  ['hqs-lookout', 'at=hqslook&tod=day&zoom=1'], ['hqs-rim', 'at=hqsrim&tod=day&zoom=1'], ['hqs-border-west', 'at=hqsborder&tod=day&zoom=1'], ['hqs-seam-ntq', 'at=hqsseam&tod=day&zoom=1']];
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon|404/.test(m.params.entry.text)) errs.push(m.params.entry.text); });
  for (const [name, q] of SHOTS) { await send('Page.navigate', { url: base + 'tayduky/index.html?seed=7&' + q }); await wait(5500); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(s.data, 'base64')); console.log('shot', name); }
  console.log(JSON.stringify({ errors: errs })); console.log(errs.length ? 'FAIL' : 'PASS'); process.exitCode = errs.length ? 1 : 0;
});
