// Tây Du Ký v2 world: screenshot helper + error check. node tests/tayduky-v2-shot.mjs <query> <out.png> [wait ms] [w h]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const [q, out, ms, W, H] = [process.argv[2] || 'at=hqs&tod=day', process.argv[3] || 'shot.png', +(process.argv[4] || 4000), +(process.argv[5] || 1600), +(process.argv[6] || 900)];
await withChrome(W, H, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 600)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) errs.push(m.params.entry.text + ' ' + (m.params.entry.url || '')); });
  await send('Page.navigate', { url: base + 'tayduky/index.html?' + q }); await wait(ms);
  const st = await ev('JSON.stringify({frameMs: TWR.frameMs, stats: TWR.stats, zoom: TWR.zoom, agents: window.TWS && TWS.agents ? TWS.agents.length : 0})').catch(e => String(e));
  const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(out, Buffer.from(s.data, 'base64'));
  console.log(st); if (errs.length) console.log('ERRORS', errs);
});
