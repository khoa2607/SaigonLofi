// Hoa Quả Sơn signature "Tề Thiên Đại Thánh trở về" (the Great Sage Returns) in headless Chrome: runs the whole story and captures each phase at a chosen offset after its beat starts (the simulation is frozen for the shot).
//   node tests/tayduky-v2-ntq.mjs [outDir] [speed] [at] [zoom]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/hqs', speed = +(process.argv[3] || 3), at = process.argv[4] || 'hqscourt', zoom = process.argv[5] || '2'; fs.mkdirSync(out, { recursive: true });
// op -> [[sim seconds after the beat starts, file name]]
const PLAN = { hqs_fore: [[3, 'a1-clouds-wind']], hqs_omen: [[3.5, 'a2-sentry-spots']], hqs_alarm: [[2, 'a3-troop-runs']], arrive: [[2.5, 'a4-cloud-ride-home']], hqs_festival: [[5, 'a5-drums-banners']], hqs_raise: [[4.5, 'a6-staff-raised']], hqs_magic: [[5, 'a7-clones'], [9, 'a8-clones-dance']],
  hqs_procession: [[8, 'b1-procession']], hqs_enter: [[5, 'b2-through-the-fall'], [14, 'b3-troop-follows']], hqs_feast: [[7, 'c1-feast-begins'], [16, 'c2-feast']], hqs_settle: [[5, 'c3-king-on-throne']], hqs_recover: [[2, 'c4-recovery']] };
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); });
  await send('Page.navigate', { url: base + `tayduky/index.html?at=${at}&tod=day&zoom=${zoom}&seed=7&force=hqs&speed=` + speed }); await wait(6000);
  await ev(`(()=>{window.__plan=${JSON.stringify(PLAN)};window.__start={};window.__done={};window.__q=[];window.__sp=${speed};setInterval(()=>{const b=TWS.biomes.hqs,R=b.run;if(!R)return;const i=R.i-1;if(i<0||i>=R.beats.length)return;const op=R.beats[i][0];if(!__start[op])__start[op]=TWS.t;
    for(const [op2,t0] of Object.entries(__start)){const L=__plan[op2]||[];for(const [dt,name] of L){if(!__done[name]&&TWS.t>=t0+dt){__done[name]=1;__q.push(name);}}}},40);return 1})()`);
  const ok = {}; let t0 = Date.now(), last = null;
  while (Date.now() - t0 < 1200000) {
    const e = await ev('(()=>{const k=__q.shift();if(k)TWS.speed=0.0001;return k||""})()');
    if (e) { await wait(500); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${e}.png`, Buffer.from(s.data, 'base64')); console.log('shot', e); ok[e] = 1; await ev(`TWS.speed=__sp`); }
    last = await ev(`JSON.stringify({phase:TWS.biomes.hqs.phase,i:TWS.biomes.hqs.run&&TWS.biomes.hqs.run.i,gold:TWS.hqs.gold})`); if (Object.keys(ok).length >= Object.values(PLAN).flat().length) break; await wait(150);
  }
  console.log(JSON.stringify({ ok: Object.keys(ok).length, last, errors: errs }));
  const need = Object.values(PLAN).flat().map(x => x[1]);
  if (errs.length || need.some(k => !ok[k])) { console.log('FAIL missing: ' + need.filter(k => !ok[k]).join(',')); process.exitCode = 1; } else console.log('PASS');
});
