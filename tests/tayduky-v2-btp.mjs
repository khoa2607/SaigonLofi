// Buddha's Palm signature "Phật Tổ thu phục Ngộ Không" (the Buddha Subdues Wukong) in headless Chrome: runs the whole story and captures each phase at a chosen offset after its beat starts (the simulation is frozen for the shot).
//   node tests/tayduky-v2-ntq.mjs [outDir] [speed] [at] [zoom]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/btp', speed = +(process.argv[3] || 3), at = process.argv[4] || 'btp', zoom = process.argv[5] || '1.5'; fs.mkdirSync(out, { recursive: true });
// op -> [[sim seconds after the beat starts, file name]]
const PLAN = { btp_fore: [[2, 'a1-calm-foreshadow']], btp_swagger: [[3, 'a2-wukong-swaggers']], btp_leap: [[3, 'a3-somersault-escape']], btp_mark: [[3.5, 'a4-mark-on-the-fingertip']], btp_fingers: [[2.5, 'a5-fingers-light']], btp_reveal: [[2, 'a6-clouds-part']], btp_inscribe: [[2, 'b1-inscription']], btp_seal: [[1.5, 'b2-beams-close'], [3.5, 'b3-column-of-light']],
  btp_bind: [[1, 'b4-shockwave'], [4, 'b5-wukong-pressed']], btp_hold: [[2.5, 'c1-buddha-unmoved']], btp_settle: [[2, 'c2-settling']], btp_recover: [[1, 'c3-recovery']] };
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); });
  await send('Page.navigate', { url: base + `tayduky/index.html?at=${at}&tod=day&zoom=${zoom}&seed=7&force=btp&speed=` + speed }); await wait(6000);
  await ev(`(()=>{window.__plan=${JSON.stringify(PLAN)};window.__start={};window.__done={};window.__q=[];window.__sp=${speed};setInterval(()=>{const b=TWS.biomes.btp,R=b.run;if(!R)return;const i=R.i-1;if(i<0||i>=R.beats.length)return;const op=R.beats[i][0];if(!__start[op])__start[op]=TWS.t;
    for(const [op2,t0] of Object.entries(__start)){const L=__plan[op2]||[];for(const [dt,name] of L){if(!__done[name]&&TWS.t>=t0+dt){__done[name]=1;__q.push(name);}}}},40);return 1})()`);
  const ok = {}; let t0 = Date.now(), last = null;
  while (Date.now() - t0 < 1200000) {
    const e = await ev('(()=>{const k=__q.shift();if(k)TWS.speed=0.0001;return k||""})()');
    if (e) { await wait(500); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${e}.png`, Buffer.from(s.data, 'base64')); console.log('shot', e); ok[e] = 1; await ev(`TWS.speed=__sp`); }
    last = await ev(`JSON.stringify({phase:TWS.biomes.btp.phase,i:TWS.biomes.btp.run&&TWS.biomes.btp.run.i,bound:TWS.btp.bound})`); if (Object.keys(ok).length >= Object.values(PLAN).flat().length) break; await wait(150);
  }
  console.log(JSON.stringify({ ok: Object.keys(ok).length, last, errors: errs }));
  const need = Object.values(PLAN).flat().map(x => x[1]);
  if (errs.length || need.some(k => !ok[k])) { console.log('FAIL missing: ' + need.filter(k => !ok[k]).join(',')); process.exitCode = 1; } else console.log('PASS');
});
