// Hỏa Diệm Sơn signature: runs The Palm-Leaf Fan in headless Chrome and captures each phase (fire, fan, rain, green aftermath, recovery); checks the terrain really changed.
// node tests/tayduky-v2-fire.mjs [outDir] [speed]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/hds', speed = +(process.argv[3] || 5); fs.mkdirSync(out, { recursive: true });
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); });
  await send('Page.navigate', { url: base + 'tayduky/index.html?at=hds&tod=day&zoom=1&seed=7&force=hds&speed=' + speed }); await wait(6000);
  const shot = async n => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${n}.png`, Buffer.from(s.data, 'base64')); console.log('shot', n); };
  const st = () => ev(`(()=>{const f=TWS.fire,b=TWS.biomes.hds;let st=0;for(const k of TWM.fire.tiles)st+=TWM.fire.stage[k];return JSON.stringify({phase:b.phase,i:b.run?b.run.i:-1,heat:+f.heat.toFixed(2),g:+f.g.toFixed(2),rain:+f.rain.toFixed(2),pips:f.fanPips||0,gusts:f.gusts.length+(TWS.agents.some(a=>a.flying)?1:0),stage:st,ver:f.ver,whirls:f.whirls.length})})()`).then(JSON.parse);
  const done = new Set(), log = []; let t0 = Date.now(), last = null, maxG = 0, minG = 1, afterPeak = false, ok = { fore: 0, gust: 0, fan: 0, rain: 0, green: 0, recover: 0, back: 0 };
  while (Date.now() - t0 < 900000) {
    const s = await st(); last = s; maxG = Math.max(maxG, s.g); if (maxG > 0.9) { afterPeak = true; minG = Math.min(minG, s.g); }
    if (s.phase === 'fore' && s.heat > 0.7 && !done.has('1-fire')) { done.add('1-fire'); await shot('1-fire-foreshadow'); ok.fore = 1; }
    if (s.gusts > 0 && !done.has('2-blow')) { done.add('2-blow'); await shot('2-fan-blows-wukong'); ok.gust = 1; }
    if (s.pips >= 3 && !done.has('3-fan')) { done.add('3-fan'); await shot('3-fanning'); ok.fan = 1; }
    if (s.rain > 0.5 && s.g > 0.3 && !done.has('4-rain')) { done.add('4-rain'); await shot('4-rain-cooling'); ok.rain = 1; }
    if (s.g > 0.95 && !done.has('5-green')) { done.add('5-green'); await wait(2500); await shot('5-green-aftermath'); ok.green = 1; }
    if (afterPeak && s.g < 0.5 && s.g > 0.2 && !done.has('6-recover')) { done.add('6-recover'); await shot('6-recovery-halfway'); ok.recover = 1; }
    if (afterPeak && s.g < 0.03 && !done.has('7-back')) { done.add('7-back'); await wait(1500); await shot('7-volcanic-again'); ok.back = 1; break; }
    await wait(500);
  }
  console.log(JSON.stringify({ ok, last, maxG, minG, errors: errs }));
  if (errs.length || Object.values(ok).some(v => !v)) { console.log('FAIL'); process.exitCode = 1; } else console.log('PASS');
});
