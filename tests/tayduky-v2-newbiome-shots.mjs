// Cao Lão Trang / Liên Hoa Động review shots, signature stages and console errors.
// node tests/tayduky-v2-newbiome-shots.mjs <clt|lhd> [outDir] [stills|stories|all]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const only = process.argv[5] ? new RegExp(process.argv[5]) : null; const b = process.argv[2] || 'clt', out = process.argv[3] || `docs/tayduky/v2/screenshots/${b}`, mode = process.argv[4] || 'all'; fs.mkdirSync(out, { recursive: true });
const STILLS = { clt: [['clt-day-wide', 'at=clt&tod=day&zoom=1'], ['clt-day-far', 'at=cltnorth&tod=day&zoom=0.7'], ['clt-night-wide', 'at=clt&tod=night&zoom=1'], ['clt-day-close', 'at=cltsquare&tod=day&zoom=2'], ['clt-gao-house', 'at=cltgao&tod=day&zoom=1.6'], ['clt-fields', 'at=cltfield&tod=day&zoom=1.5'], ['clt-pond', 'at=cltpond&tod=day&zoom=1.5'], ['clt-pen', 'at=cltpen&tod=day&zoom=2'], ['clt-lane', 'at=cltlane&tod=day&zoom=1.3'], ['clt-west-seam', 'at=cltwest&tod=day&zoom=1.2'], ['clt-south-seam', 'at=cltseam&tod=day&zoom=1.2'], ['clt-east-seam', 'at=cltrim&tod=day&zoom=1.2'], ['clt-north-seam', 'at=cltnorth&tod=day&zoom=1.1']],
  lhd: [['lhd-day-wide', 'at=lhd&tod=day&zoom=1'], ['lhd-day-far', 'at=lhdcourt&tod=day&zoom=0.7'], ['lhd-night-wide', 'at=lhd&tod=night&zoom=1'], ['lhd-mouth', 'at=lhdmouth&tod=day&zoom=1.4'], ['lhd-mouth-night', 'at=lhdmouth&tod=night&zoom=1.4'], ['lhd-canyon', 'at=lhdcanyon&tod=day&zoom=1.3'], ['lhd-courtyard', 'at=lhdcourt&tod=day&zoom=1.5'], ['lhd-arena', 'at=lhdarena&tod=day&zoom=1.5'], ['lhd-treasure', 'at=lhdtreasure&tod=day&zoom=1.6'], ['lhd-approach', 'at=lhdnorth&tod=day&zoom=1.2'], ['lhd-north-seam', 'at=lhdseam&tod=day&zoom=1.2'], ['lhd-east-seam', 'at=lhdeast&tod=day&zoom=1.2'], ['lhd-west-seam', 'at=lhdwest&tod=day&zoom=1.2']] };
const STORIES = { clt: ['gao_mystery', 'bajie_joins'], lhd: ['gold_silver_encounter', 'treasure_revelation'] };
const KEEP = { clt: ['ca_notice', 'ca_disguise', 'ca_expose', 'ca_transform', 'ca_chase', 'ca_subdue', 'cb_explain', 'cb_accept', 'cb_gather', 'cb_leave'], lhd: ['la_ambush', 'la_cage', 'la_disguise', 'la_gourd', 'la_duel', 'la_trap', 'la_free', 'lb_truth', 'lb_laozi', 'lb_reclaim', 'lb_revert', 'lb_leave'] };
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon|404/.test(m.params.entry.text)) errs.push(m.params.entry.text); });
  const settle = async () => { let ok = 0; for (let k = 0; k < 8 && ok < 3; k++) { const n = await ev(`(()=>{const s=window.TWR&&TWR.stats;return s?s.bake:1})()`).catch(() => 1); ok = n === 0 ? ok + 1 : 0; await wait(400); } await wait(500); };
  const shot = async name => { await settle(); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(s.data, 'base64')); console.log('shot', name); };
  if (mode !== 'stories') for (const [name, q] of STILLS[b].filter(([n]) => !only || only.test(n))) { await send('Page.navigate', { url: base + 'tayduky/index.html?seed=7&' + q }); await wait(8000); await shot(name); }
  if (mode !== 'stills') for (const want of STORIES[b].filter(w => !only || only.test(w))) {
    const seed = 7; await send('Page.navigate', { url: base + `tayduky/index.html?at=${b}&tod=day&zoom=1.4&seed=${seed}&speed=3&force=${b}` }); await wait(1500);
    // wrap the key ops so no stage is missed between two polls: each call is queued and shot a moment later
    await ev(`(()=>{const B=TWS.biomes['${b}'];const others=B.data.stories.filter(s=>s.id!=='${want}');B.last=others[0].id;window.__q=[];for(const k of ${JSON.stringify(KEEP[b])}){const f=TWS.opExt[k];if(!f||f.__w)continue;const w=(...a)=>{window.__q.push([k,B.story&&B.story.id]);return f(...a)};w.__w=1;TWS.opExt[k]=w;}})()`); await wait(800); let fore = false, n = 0;
    for (let k = 0; k < 1400; k++) {
      const st = JSON.parse(await ev(`(()=>{const B=TWS.biomes['${b}'];return JSON.stringify({ph:B.phase,id:B.story&&B.story.id,q:window.__q.splice(0)})})()`));
      if (st.id && st.id !== want && st.ph !== 'peace') break;
      if (st.ph === 'fore' && st.id === want && !fore) { fore = true; await wait(2500); await shot(`${b}-${want}-00-fore`); }
      for (const [op, sid] of st.q) if (sid === want) { await wait(1100); n++; await shot(`${b}-${want}-${String(n).padStart(2, '0')}-${op}`); }
      if (st.ph === 'after' && st.id === want) { await wait(2000); await shot(`${b}-${want}-99-after`); break; }
      await wait(250);
    }
  }
  console.log(JSON.stringify({ errors: errs })); console.log(errs.length ? 'FAIL' : 'PASS'); process.exitCode = errs.length ? 1 : 0;
});
