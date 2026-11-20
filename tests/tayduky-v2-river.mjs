// Thông Thiên Hà signature: runs "The Divine Turtle Ferries the Pilgrims" in headless Chrome and captures each phase; checks the turtle rises, carries five riders across and dives, no console errors.
// node tests/tayduky-v2-river.mjs [outDir] [speed]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/tth', speed = +(process.argv[3] || 3); fs.mkdirSync(out, { recursive: true });
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); });
  await send('Page.navigate', { url: base + 'tayduky/index.html?at=tthwhirl&tod=day&zoom=1&seed=7&force=tth&speed=' + speed }); await wait(6000);
  const shot = async n => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${n}.png`, Buffer.from(s.data, 'base64')); console.log('shot', n); };
  const st = () => ev(`(()=>{const f=TWS.river,b=TWS.biomes.tth,t=f.turtle;return JSON.stringify({phase:b.phase,i:b.run?b.run.i:-1,surge:+f.surge.toFixed(2),storm:+f.storm.toFixed(2),tp:t?t.phase:null,riders:t?t.riders.length:0,tx:t?Math.round(t.x):0,ty:t?Math.round(t.y):0,actors:TWS.agents.filter(a=>a.role==='actor'&&a.biome==='tth').length})})()`).then(JSON.parse);
  const done = new Set(), ok = { fore: 0, sig: 0, rise: 0, board: 0, ride: 0, land: 0, dive: 0, calm: 0 }; let t0 = Date.now(), last = null, sawDive = false, maxRiders = 0;
  while (Date.now() - t0 < 420000) {
    const s = await st(); last = s; maxRiders = Math.max(maxRiders, s.riders);
    if (s.phase === 'fore' && !done.has('1')) { done.add('1'); await wait(1500); await shot('s1-foreshadow'); ok.fore = 1; }
    if (s.phase === 'sig' && s.tp === null && s.surge > 0.8 && !done.has('2')) { done.add('2'); await wait(300); await shot('s2-surge'); ok.sig = 1; }
    if (s.tp === 'rise' && !done.has('3')) { done.add('3'); await wait(2200); await shot('s3-turtle-rises'); ok.rise = 1; }
    if (s.tp === 'idle' && s.riders >= 3 && !done.has('4')) { done.add('4'); await shot('s4-boarding'); ok.board = 1; }
    if (s.tp === 'carry' && s.riders === 5 && !done.has('5')) { done.add('5'); await wait(2500); await shot('s5-crossing-a'); await wait(2500); await shot('s5-crossing-b'); ok.ride = 1; }
    if (s.tp === 'wait' && !done.has('6')) { done.add('6'); await wait(1800); await shot('s6-landing'); ok.land = 1; }
    if (s.tp === 'dive' && !done.has('7')) { done.add('7'); sawDive = true; await wait(800); await shot('s7-dive'); ok.dive = 1; }
    if (sawDive && s.tp === null && s.phase === 'after' && !done.has('8')) { done.add('8'); await wait(4000); await shot('s8-recovery'); ok.calm = 1; break; }
    await wait(400);
  }
  console.log(JSON.stringify({ ok, last, maxRiders, errors: errs }));
  if (errs.length || Object.values(ok).some(v => !v) || maxRiders < 5) { console.log('FAIL'); process.exitCode = 1; } else console.log('PASS');
});
