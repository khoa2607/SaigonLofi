// White Bone Ridge review screenshots (day, night, wide, close, rim, seam) + a console-error check. node tests/tayduky-v2-hqs-shots.mjs [outDir]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/bcl'; fs.mkdirSync(out, { recursive: true });
const SHOTS = [['bcl-day-wide', 'at=bcl&tod=day&zoom=1'], ['bcl-night-wide', 'at=bcl&tod=night&zoom=1'], ['bcl-day-close', 'at=bclclear&tod=day&zoom=2'], ['bcl-night-close', 'at=bclclear&tod=night&zoom=2'], ['bcl-gate-graves', 'at=bclgrave&tod=day&zoom=1'], ['bcl-graves-night', 'at=bclgrave&tod=night&zoom=1'], ['bcl-ribs', 'at=bclribs&tod=day&zoom=1'], ['bcl-palace', 'at=bclpalace&tod=day&zoom=1'],
  ['bcl-lair', 'at=bcllair&tod=day&zoom=1'], ['bcl-lair-night', 'at=bcllair&tod=night&zoom=2'], ['bcl-bridge', 'at=bclbridge&tod=day&zoom=1'], ['bcl-lookout', 'at=bcllook&tod=day&zoom=1'], ['bcl-pool', 'at=bclpool&tod=day&zoom=1'], ['bcl-seam-hqs', 'at=bclseam&tod=day&zoom=1'], ['bcl-seam-south', 'at=bclseamsouth&tod=day&zoom=1'], ['bcl-rim-north', 'at=bclrim&tod=day&zoom=1'], ['bcl-west', 'at=bclwest&tod=day&zoom=1']];
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon|404/.test(m.params.entry.text)) errs.push(m.params.entry.text); });
  for (const [name, q] of SHOTS) { await send('Page.navigate', { url: base + 'tayduky/index.html?seed=7&' + q }); await wait(5500); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(s.data, 'base64')); console.log('shot', name); }
  console.log(JSON.stringify({ errors: errs })); console.log(errs.length ? 'FAIL' : 'PASS'); process.exitCode = errs.length ? 1 : 0;
});
