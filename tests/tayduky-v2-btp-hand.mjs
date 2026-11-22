// Buddha's Palm: the hand acceptance gate. Wide shot (zoom 1), silhouette (props and people hidden), Wukong standing on the palm, night, and each side of the hand.
//   node tests/tayduky-v2-btp-hand.mjs [outDir]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/btp'; fs.mkdirSync(out, { recursive: true });
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); });
  const shot = async name => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(s.data, 'base64')); console.log('shot', name); };
  const go = async q => { await send('Page.navigate', { url: base + 'tayduky/index.html?seed=7&' + q }); await wait(5500); };
  await go('at=btp&tod=day&zoom=1'); await shot('hand-1-wide-zoom1');
  await ev(`(()=>{TWR.grid.clear();TWR.flats=TWR.flats.filter(s=>s.p.kind==='palmhand');for(const a of TWS.agents)a.hidden=true;return 1})()`); await wait(800); await shot('hand-2-silhouette');
  await go('at=btp&tod=day&zoom=2'); await ev(`(()=>{TWS.speed=0.0001;const k=TWS.agents.find(a=>a.role==='monkeyking');k.hidden=false;k.x=75*8;k.y=50*8;k.q=[];k.cur=null;k.gz=TWM.groundZ(k.x,k.y);return 1})()`); await wait(900); await shot('hand-3-wukong-on-palm');
  await go('at=btp&tod=night&zoom=1'); await shot('hand-4-night-wide');
  for (const [n, a] of [['hand-5-fingers', 'btpfingers'], ['hand-6-thumb', 'btpthumb']]) { await go(`at=${a}&tod=day&zoom=1.5`); await shot(n); }
  console.log(JSON.stringify({ errors: errs })); process.exitCode = errs.length ? 1 : 0;
});
