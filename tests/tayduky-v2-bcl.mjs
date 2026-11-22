// White Bone Ridge signature "Tam Đả Bạch Cốt Tinh" (the Three Strikes at the White Bone Demon) in headless Chrome: runs the whole story and captures each phase at a chosen offset after its beat starts (the simulation is frozen for the shot).
//   node tests/tayduky-v2-ntq.mjs [outDir] [speed] [at] [zoom]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/bcl', speed = +(process.argv[3] || 3), at = process.argv[4] || 'bclclear', zoom = process.argv[5] || '2'; fs.mkdirSync(out, { recursive: true });
// op -> [[sim seconds after the beat starts, file name]]
const PLAN = { bcl_fore: [[3, 'a1-foreboding']], bcl_arrive: [[8, 'a2-pilgrims-arrive']], bcl_girl: [[7, 'a3-girl-appears']], bcl_suspect: [[3, 'a4-wukong-suspects']], bcl_strike1: [[1.2, 'a5-strike-one'], [5, 'a6-first-body']], bcl_scold: [[4, 'a7-misunderstanding']], bcl_crone: [[7, 'b1-old-woman']],
  bcl_strike2: [[1.4, 'b2-strike-two']], bcl_elder: [[7, 'b3-old-man']], bcl_strike3: [[1.4, 'b4-strike-three']], bcl_reveal: [[3, 'b5-true-form'], [7, 'b6-bone-aura']], bcl_fight: [[3, 'c1-fight'], [7.4, 'c2-shatter']], bcl_banish: [[6, 'c3-banished']], bcl_leave: [[4, 'c4-wukong-leaves']] };
const RECOVERY_SHOT = 'c5-recovery';
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); });
  await send('Page.navigate', { url: base + `tayduky/index.html?at=${at}&tod=day&zoom=${zoom}&seed=7&force=bcl&speed=` + speed }); await wait(6000);
  await ev(`(()=>{window.__plan=${JSON.stringify(PLAN)};window.__start={};window.__done={};window.__q=[];window.__sp=${speed};window.__afterStart=0;setInterval(()=>{const b=TWS.biomes.bcl,R=b.run;
    if(b.phase==='after'&&!__afterStart)__afterStart=TWS.t;
    if(__afterStart&&!__done['${RECOVERY_SHOT}']&&TWS.t>=__afterStart+4){__done['${RECOVERY_SHOT}']=1;__q.push('${RECOVERY_SHOT}');}
    if(!R)return;const i=R.i-1;if(i<0||i>=R.beats.length)return;const op=R.beats[i][0];if(!__start[op])__start[op]=TWS.t;
    for(const [op2,t0] of Object.entries(__start)){const L=__plan[op2]||[];for(const [dt,name] of L){if(!__done[name]&&TWS.t>=t0+dt){__done[name]=1;__q.push(name);}}}},40);return 1})()`);
  const ok = {}; let t0 = Date.now(), last = null;
  while (Date.now() - t0 < 1200000) {
    const e = await ev('(()=>{const k=__q.shift();if(k)TWS.speed=0.0001;return k||""})()');
    if (e) { await wait(500); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${e}.png`, Buffer.from(s.data, 'base64')); console.log('shot', e); ok[e] = 1; await ev(`TWS.speed=__sp`); }
    last = await ev(`JSON.stringify({phase:TWS.biomes.bcl.phase,i:TWS.biomes.bcl.run&&TWS.biomes.bcl.run.i,aura:TWS.bcl.aura})`); if (Object.keys(ok).length >= Object.values(PLAN).flat().length + 1) break; await wait(150);
  }
  console.log(JSON.stringify({ ok: Object.keys(ok).length, last, errors: errs }));
  const need = [...Object.values(PLAN).flat().map(x => x[1]), RECOVERY_SHOT];
  if (errs.length || need.some(k => !ok[k])) { console.log('FAIL missing: ' + need.filter(k => !ok[k]).join(',')); process.exitCode = 1; } else console.log('PASS');
});
