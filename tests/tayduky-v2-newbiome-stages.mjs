// Signature stages of Cao Lão Trang / Liên Hoa Động as screenshots, fast: the page's simulation is advanced in code to each key beat (TWS.tick in a loop), then frozen while the story camera settles and one frame is captured.
// node tests/tayduky-v2-newbiome-stages.mjs <clt|lhd> [outDir] [storyRegex]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const b = process.argv[2] || 'clt', out = process.argv[3] || `docs/tayduky/v2/screenshots/${b}`, only = process.argv[4] ? new RegExp(process.argv[4]) : null; fs.mkdirSync(out, { recursive: true });
const STORIES = { clt: ['gao_mystery', 'bajie_joins'], lhd: ['gold_silver_encounter', 'treasure_revelation'] };
const KEEP = { clt: ['ca_notice', 'ca_disguise', 'ca_expose', 'ca_transform', 'ca_chase', 'ca_subdue', 'ca_recover1', 'cb_explain', 'cb_family', 'cb_accept', 'cb_gather', 'cb_line', 'cb_leave'], lhd: ['la_ambush', 'la_march', 'la_cage', 'la_lookout', 'la_disguise', 'la_present', 'la_gourd', 'la_inside', 'la_rope', 'la_duel', 'la_trap', 'la_free', 'lb_truth', 'lb_laozi', 'lb_unseal', 'lb_reclaim', 'lb_revert', 'lb_depart', 'lb_leave'] };
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); });
  const shot = async name => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(s.data, 'base64')); console.log('shot', name); };
  for (const want of STORIES[b].filter(w => !only || only.test(w))) {
    const ops = await (async () => { await send('Page.navigate', { url: base + `tayduky/index.html?at=${b}&tod=day&zoom=1.4&seed=7&speed=1` }); await wait(5000); return JSON.parse(await ev(`JSON.stringify(TWS.biomes['${b}'].data.stories.find(s=>s.id==='${want}').beats.map(x=>x[0]))`)); })();
    const targets = [['fore', -1]].concat(ops.map((o, i) => [o, i]).filter(([o]) => KEEP[b].includes(o))), after = ['after', -2];
    for (const [op, idx] of targets.concat([after])) {
      await send('Page.navigate', { url: base + `tayduky/index.html?at=${b}&tod=day&zoom=1.4&seed=7&speed=1` }); await wait(4500);
      // force this story, fast-forward until the beat has just started, freeze
      const r = JSON.parse(await ev(`(()=>{const B=TWS.biomes['${b}'];B.last=B.data.stories.find(s=>s.id!=='${want}').id;B.timer=0.5;TWS.speed=0;let n=0;const idx=${idx};
        while(n++<60000){TWS.tick(0.1);if(B.story&&B.story.id==='${want}'){ if(idx===-1&&B.phase==='fore'&&B.run&&B.timer<6)break; if(idx>=0&&B.phase==='sig'&&B.run&&B.run.i>idx){for(let k=0;k<8;k++)TWS.tick(0.1);break;} if(idx===-2&&B.phase==='after')break; } else if(B.story&&B.story.id!=='${want}'&&B.phase!=='peace'){return JSON.stringify({err:'other story '+B.story.id});}}
        const f=TWS['${b}'];let xy=null;if(f.follow&&!f.follow.gone)xy=[f.follow.x,f.follow.y];else if(f.focus)xy=f.focus;else{const a=TWS.agents.filter(q=>q.biome==='${b}'&&q.role==='actor'&&!q.gone&&!q.hidden);if(a.length)xy=[a.reduce((s,q)=>s+q.x,0)/a.length,a.reduce((s,q)=>s+q.y,0)/a.length];}
        if(xy)TWR.lookAt(xy[0],xy[1],TWM.groundZ(xy[0],xy[1]));TWR.userT=TWR.t+1e6;
        return JSON.stringify({n,ph:B.phase,i:B.run&&B.run.i});})()`));
      if (r.err) { console.log('skip', op, r.err); continue; }
      await wait(2500); const n = targets.findIndex(t => t[0] === op); await shot(`${b}-${want}-${String(op === 'after' ? 99 : n).padStart(2, '0')}-${op}`);
    }
  }
  console.log(JSON.stringify({ errors: errs })); console.log(errs.length ? 'FAIL' : 'PASS'); process.exitCode = errs.length ? 1 : 0;
});
