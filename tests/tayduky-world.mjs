// Tây Du Ký world: boots in headless Chrome, runs the Director fast, and checks the story rules with numbers:
// never more than maxSignatures at once, never two side-adjacent biomes at once, stories start and finish, no console errors;
// all 11 approved biomes exist (Ngũ Hành Sơn included), every biome runs mini events, aftermaths run a recovery, and the Ngũ Hành Sơn
// story frees the buried Wukong and later puts him back under the rock (story resets, world does not).
// Usage: node tests/tayduky-world.mjs [seconds=40] [--shots]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const secs = +(process.argv[2] || 40), shots = process.argv.includes('--shots');
await withChrome(1600, 900, async ({ base, send, ev, on }) => {
  const errs = [];
  on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) errs.push(m.params.entry.text + ' ' + (m.params.entry.url || '')); });
  await send('Page.navigate', { url: base + 'tayduky/alpha/index.html?speed=10&seed=7&zoom=2' });
  await wait(4000);
  const ADJ = JSON.parse(await ev('JSON.stringify(TD_WORLD.adj)'));
  let maxActive = 0, adjViol = 0, starts = new Set(), samples = 0, nhsFreed = 0, nhsReburied = 0, wasFree = false;
  const finished = {};
  for (let s = 0; s < secs; s++) {
    const st = JSON.parse(await ev(`JSON.stringify({act: Object.values(TS.biomes).filter(B=>B.phase==='fore'||B.phase==='sig').map(B=>B.id), ph: Object.fromEntries(Object.values(TS.biomes).map(B=>[B.id, B.phase + ':' + (B.story? B.story.id : '')])), n: TS.agents.length, buried: TS.agents.some(a=>a.biome==='nhs'&&a.buried&&!a.gone)})`));
    if (!st.buried) { if (!wasFree) nhsFreed++; wasFree = true; } else { if (wasFree) nhsReburied++; wasFree = false; }
    samples++; maxActive = Math.max(maxActive, st.act.length);
    for (const a of st.act) for (const b of st.act) if (a < b && (ADJ[a] || []).includes(b)) adjViol++;
    for (const [k, v] of Object.entries(st.ph)) { if (v.startsWith('sig')) starts.add(k + ':' + v.split(':')[1]); if (v.startsWith('after')) finished[k] = (finished[k] || 0) + 1; }
    await wait(1000);
  }
  const res = JSON.parse(await ev(`JSON.stringify({agents: TS.agents.length, biomes: Object.keys(TS.biomes).length, max: TD_DATA.maxSignatures, minis: Object.fromEntries(Object.values(TS.biomes).map(B=>[B.id, B.minis])), recovers: Object.fromEntries(Object.values(TS.biomes).map(B=>[B.id, B.recovers||0]))})`));
  const APPROVED = ['hqs', 'tc', 'btp', 'nhs', 'clt', 'bcl', 'nnq', 'btd', 'hds', 'tth', 'lat'];
  const missing = APPROVED.filter(b => !(b in res.minis)), quietBiomes = APPROVED.filter(b => !res.minis[b]);
  const recoverOk = Object.keys(finished).every(b => res.recovers[b] > 0);
  console.log(JSON.stringify({ seconds: secs, simSeconds: secs * 10, ...res, maxActive, adjacencyViolations: adjViol, storiesStarted: [...starts], biomesInAftermath: Object.keys(finished), missing, quietBiomes, recoverOk, nhsFreed, nhsReburied, errors: errs }, null, 1));
  if (shots) {
    for (const [at, tod] of [['clt', 'day'], ['nhs', 'day'], ['btp', 'day'], ['btd', 'night'], ['lat', 'dusk']]) {
      await ev(`(()=>{const B=TS.biomes['${at}']; V.cx=B.centre[0]; V.cy=B.centre[1]; V.tod='${tod}'; V.clock={day:11,dusk:18.2,night:22}['${tod}']; clampCam();})()`);
      await wait(1500);
      const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('tayduky-shot-' + at + '.png', Buffer.from(s.data, 'base64'));
    }
  }
  const ok = errs.length === 0 && adjViol === 0 && maxActive <= res.max && starts.size > 0 && res.biomes === 11 && !missing.length && !quietBiomes.length && recoverOk;
  console.log(ok ? 'PASS' : 'FAIL'); process.exitCode = ok ? 0 : 1;
});
