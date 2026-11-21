// Ngũ Trang Quán signature "Nhân Sâm Quả" (the Ginseng Fruit) in headless Chrome: runs the whole story and captures each phase at a chosen offset after its beat starts (the simulation is frozen for the shot).
//   node tests/tayduky-v2-ntq.mjs [outDir] [speed] [at] [zoom]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/ntq', speed = +(process.argv[3] || 3), at = process.argv[4] || 'ntqtree', zoom = process.argv[5] || '2'; fs.mkdirSync(out, { recursive: true });
// op -> [[sim seconds after the beat starts, file name]]
const PLAN = { ntq_fore: [[3, 'a1-foreshadow']], ntq_arrive: [[6, 'a2-pilgrims-arrive']], ntq_welcome: [[5, 'a3-offering']], ntq_refuse: [[3, 'a4-sanzang-refuses']], ntq_steal: [[4.5, 'a5-fruit-knocked-down'], [8.6, 'a6-fruit-sinks-into-earth']], ntq_accuse: [[4, 'a7-boys-protest']],
  ntq_topple: [[3.4, 'a8-tree-falls'], [7, 'a9-tree-fallen']], ntq_zy_return: [[3.4, 'b1-zhenyuan-returns']], ntq_bind: [[4.5, 'b2-binding-art']], ntq_wukong_go: [[3, 'b3-wukong-flies-off']], ntq_guanyin: [[4, 'b4-guanyin-descends']],
  ntq_nectar: [[4.5, 'b5-nectar-falls'], [8, 'b6-tree-rises'], [11.5, 'b7-wave-of-life'], [15, 'b8-fruit-ripens']], ntq_reconcile: [[3, 'c1-reconciliation']], ntq_feast: [[9, 'c2-feast']], ntq_depart: [[2.5, 'c3-pilgrims-leave']], ntq_recover: [[3, 'c4-recovery']] };
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); });
  await send('Page.navigate', { url: base + `tayduky/index.html?at=${at}&tod=day&zoom=${zoom}&seed=7&force=ntq&speed=` + speed }); await wait(6000);
  await ev(`(()=>{window.__plan=${JSON.stringify(PLAN)};window.__start={};window.__done={};window.__q=[];window.__sp=${speed};setInterval(()=>{const b=TWS.biomes.ntq,R=b.run;if(!R)return;const i=R.i-1;if(i<0||i>=R.beats.length)return;const op=R.beats[i][0];if(!__start[op])__start[op]=TWS.t;
    for(const [op2,t0] of Object.entries(__start)){const L=__plan[op2]||[];for(const [dt,name] of L){if(!__done[name]&&TWS.t>=t0+dt){__done[name]=1;__q.push(name);}}}},40);return 1})()`);
  const ok = {}; let t0 = Date.now(), last = null;
  while (Date.now() - t0 < 1200000) {
    const e = await ev('(()=>{const k=__q.shift();if(k)TWS.speed=0.0001;return k||""})()');
    if (e) { await wait(500); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${e}.png`, Buffer.from(s.data, 'base64')); console.log('shot', e); ok[e] = 1; await ev(`TWS.speed=__sp`); }
    last = await ev(`JSON.stringify({phase:TWS.biomes.ntq.phase,i:TWS.biomes.ntq.run&&TWS.biomes.ntq.run.i,tree:TWS.ntq.tree.state})`); if (Object.keys(ok).length >= Object.values(PLAN).flat().length) break; await wait(150);
  }
  console.log(JSON.stringify({ ok: Object.keys(ok).length, last, errors: errs }));
  const need = Object.values(PLAN).flat().map(x => x[1]);
  if (errs.length || need.some(k => !ok[k])) { console.log('FAIL missing: ' + need.filter(k => !ok[k]).join(',')); process.exitCode = 1; } else console.log('PASS');
});
