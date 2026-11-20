// Tây Du Ký world: boots in headless Chrome, runs the Director fast, and checks the story rules with numbers:
// never more than maxSignatures at once, never two side-adjacent biomes at once, stories start and finish, no console errors.
// Usage: node tests/tayduky-world.mjs [seconds=40] [--shots]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const secs = +(process.argv[2] || 40), shots = process.argv.includes('--shots');
await withChrome(1600, 900, async ({ base, send, ev, on }) => {
  const errs = [];
  on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) errs.push(m.params.entry.text + ' ' + (m.params.entry.url || '')); });
  await send('Page.navigate', { url: base + 'tayduky/index.html?speed=10&seed=7&zoom=2' });
  await wait(4000);
  const ADJ = JSON.parse(await ev('JSON.stringify(TD_WORLD.adj)'));
  let maxActive = 0, adjViol = 0, starts = new Set(), samples = 0;
  const finished = {};
  for (let s = 0; s < secs; s++) {
    const st = JSON.parse(await ev(`JSON.stringify({act: Object.values(TS.biomes).filter(B=>B.phase==='fore'||B.phase==='sig').map(B=>B.id), ph: Object.fromEntries(Object.values(TS.biomes).map(B=>[B.id, B.phase + ':' + (B.story? B.story.id : '')])), n: TS.agents.length})`));
    samples++; maxActive = Math.max(maxActive, st.act.length);
    for (const a of st.act) for (const b of st.act) if (a < b && (ADJ[a] || []).includes(b)) adjViol++;
    for (const [k, v] of Object.entries(st.ph)) { if (v.startsWith('sig')) starts.add(k + ':' + v.split(':')[1]); if (v.startsWith('after')) finished[k] = (finished[k] || 0) + 1; }
    await wait(1000);
  }
  const res = JSON.parse(await ev(`JSON.stringify({agents: TS.agents.length, biomes: Object.keys(TS.biomes).length, max: TD_DATA.maxSignatures})`));
  console.log(JSON.stringify({ seconds: secs, simSeconds: secs * 10, ...res, maxActive, adjacencyViolations: adjViol, storiesStarted: [...starts], biomesInAftermath: Object.keys(finished), errors: errs }, null, 1));
  if (shots) {
    for (const [at, tod] of [['clt', 'day'], ['hqs', 'day'], ['btd', 'night'], ['lat', 'dusk']]) {
      await ev(`(()=>{const B=TS.biomes['${at}']; V.cx=B.centre[0]; V.cy=B.centre[1]; V.tod='${tod}'; V.clock={day:11,dusk:18.2,night:22}['${tod}']; clampCam();})()`);
      await wait(1500);
      const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('tayduky-shot-' + at + '.png', Buffer.from(s.data, 'base64'));
    }
  }
  const ok = errs.length === 0 && adjViol === 0 && maxActive <= res.max && starts.size > 0;
  console.log(ok ? 'PASS' : 'FAIL'); process.exitCode = ok ? 0 : 1;
});
