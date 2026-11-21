// Thiên Cung review shots + console errors. node tests/tayduky-v2-tc2-shots.mjs [outDir]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/tc'; fs.mkdirSync(out, { recursive: true });
const SHOTS = [['tc-day-wide', 'at=tc&tod=day&zoom=1'], ['tc-night-wide', 'at=tc&tod=night&zoom=1'], ['tc-day-close', 'at=tc&tod=day&zoom=2'], ['tc-gate', 'at=tcgate&tod=day&zoom=1.5'], ['tc-furnace', 'at=tcfurnace&tod=day&zoom=1.5'], ['tc-furnace-night', 'at=tcfurnace&tod=night&zoom=1.5'], ['tc-garden', 'at=tcgarden&tod=day&zoom=1.5'], ['tc-palace', 'at=tcpalace&tod=day&zoom=1.5']];
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon|404/.test(m.params.entry.text)) errs.push(m.params.entry.text); });
  for (const [name, q] of SHOTS) { await send('Page.navigate', { url: base + 'tayduky/index.html?seed=7&' + q }); await wait(5500); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(s.data, 'base64')); console.log('shot', name); }
  console.log(JSON.stringify({ errors: errs })); console.log(errs.length ? 'FAIL' : 'PASS'); process.exitCode = errs.length ? 1 : 0;
});
