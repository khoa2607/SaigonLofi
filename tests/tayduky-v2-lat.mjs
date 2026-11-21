// Đại Lôi Âm Tự signatures in headless Chrome: runs both stories and captures each phase at an offset after its beat starts (the simulation is frozen for the shot).
//   node tests/tayduky-v2-lat.mjs [outDir] [speed] [zoom]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const out = process.argv[2] || 'docs/tayduky/v2/screenshots/lat', speed = +(process.argv[3] || 3), zoom = process.argv[4] || '1.5'; fs.mkdirSync(out, { recursive: true });
const PLAN = { ls_fore: [[2, 'sa-0-foreshadow']], ls_climb: [[3, 'sa-1-climb']], ls_gate: [[1.5, 'sa-2-gate-opens']], ls_kneel: [[5, 'sa-3-kneel']], ls_teach: [[2, 'sa-4-wheel']], ls_give: [[3.5, 'sa-5-sutra-given']], ls_blank: [[2.5, 'sa-6-blank-scrolls']], ls_true: [[3, 'sa-7-true-sutra']], ls_settle: [[1.5, 'sa-8-settle']],
  lb_gather: [[2, 'sb-0-gather']], lb_kneel: [[4, 'sb-1-kneel']], lb_decree: [[2, 'sb-2-decree']], lb_wukong: [[2.5, 'sb-3-wukong']], lb_two: [[3, 'sb-4-bajie-sha']], lb_horse: [[2, 'sb-5-horse']], lb_lotus: [[2, 'sb-6-lotus']], lb_wave: [[3.5, 'sb-7-light-wave']], lb_great: [[3, 'sb-8-great-assembly']], lb_rise: [[3, 'sb-9-rise']] };
const ONLY = process.argv[5] ? process.argv[5].split(',') : null; if (ONLY) for (const k of Object.keys(PLAN)) PLAN[k] = PLAN[k].filter(x => ONLY.includes(x[1])); for (const k of Object.keys(PLAN)) if (!PLAN[k].length) delete PLAN[k];
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); });
  await send('Page.navigate', { url: base + `tayduky/index.html?at=lat&tod=day&zoom=${zoom}&seed=7&force=lat&speed=` + speed }); await wait(5500);
  await ev(`(()=>{window.__plan=${JSON.stringify(PLAN)};window.__done={};window.__q=[];window.__sp=${speed};window.__op=null;window.__ot=0;setInterval(()=>{const b=TWS.biomes.lat,R=b.run;if(!R||(b.phase!=='sig'&&b.phase!=='fore'))return;const op=R.beats[R.i-1]&&R.beats[R.i-1][0];if(op!==window.__op){window.__op=op;window.__ot=TWS.t;}const L=__plan[op]||[];for(const [dt,name] of L)if(!__done[name]&&TWS.t>=__ot+dt){__done[name]=1;__q.push(name);}},40);return 1})()`);
  const ok = {}; const t0 = Date.now(), total = Object.values(PLAN).flat().length;
  while (Date.now() - t0 < 1500000 && Object.keys(ok).length < total) {
    const e = await ev('(()=>{const k=__q.shift();if(k)TWS.speed=0.0001;return k||""})()');
    if (e) { await wait(500); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${e}.png`, Buffer.from(s.data, 'base64')); console.log('shot', e); ok[e] = 1; await ev(`TWS.speed=__sp`); }
    await wait(150);
  }
  console.log(JSON.stringify({ ok: Object.keys(ok).length, total, errors: errs }));
  const need = Object.values(PLAN).flat().map(x => x[1]); if (errs.length || need.some(k => !ok[k])) { console.log('FAIL missing: ' + need.filter(k => !ok[k]).join(',')); process.exitCode = 1; } else console.log('PASS');
});

