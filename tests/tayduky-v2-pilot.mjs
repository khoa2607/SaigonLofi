// Tây Du Ký v2 character pilot (docs/tayduky/v2/): boots the pilot page in headless Chrome and checks, with numbers, that
// every hand-authored sheet loads, sandbox characters walk in world coordinates, use several sprite directions, never stand in a
// blocked (prop) tile, and that the page has no console errors. Usage: node tests/tayduky-v2-pilot.mjs [seconds=12] [--shots]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const secs = +(process.argv[2] || 12), shots = process.argv.includes('--shots');
await withChrome(1400, 1000, async ({ base, send, ev, on }) => {
  const errs = [];
  on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) errs.push(m.params.entry.text); });
  await send('Page.navigate', { url: base + 'docs/tayduky/v2/index.html?seed=7' });
  await wait(2500);
  const start = JSON.parse(await ev('JSON.stringify(SB.agents.map(a => [a.x, a.y]))'));
  const dirs = new Set(), inside = [];
  for (let s = 0; s < secs * 4; s++) {
    const st = JSON.parse(await ev(`JSON.stringify(SB.agents.map(a => [a.dir, a.moving, Math.floor(a.x / SB.T), Math.floor(a.y / SB.T)]))`));
    for (const [d, mv, i, j] of st) { if (mv) dirs.add(d); }
    const bad = JSON.parse(await ev(`JSON.stringify(SB.agents.filter(a => SB.blocked[Math.floor(a.y / SB.T) * SB.N + Math.floor(a.x / SB.T)]).map(a => a.name))`));
    inside.push(...bad);
    await wait(250);
  }
  const res = JSON.parse(await ev(`JSON.stringify({ chars: Object.keys(TD2_CHARS.chars), loaded: Object.values(TD2_CHARS.chars).every(c => SB.imgs[c.src] && SB.imgs[c.src].complete && SB.imgs[c.src].naturalWidth > 0),
    agents: SB.agents.length, props: SB.props.length, frames: SB.frames, walked: SB.agents.map(a => Math.round(a.dist)) })`));
  const moved = res.walked.filter(d => d > 20).length;
  console.log(JSON.stringify({ ...res, movedAgents: moved, dirsUsed: [...dirs], standingInBlockedTile: [...new Set(inside)], errors: errs }, null, 1));
  if (shots) {
    for (const [name, js] of [['v2-cards', 'window.scrollTo(0,0)'], ['v2-sandbox', "document.getElementById('sb').scrollIntoView()"]]) {
      await ev(js); await wait(800);
      const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('tayduky-' + name + '.png', Buffer.from(s.data, 'base64'));
    }
  }
  const ok = errs.length === 0 && res.loaded && res.chars.length === 8 && moved >= res.agents * 0.6 && dirs.size >= 3 && inside.length === 0;
  console.log(ok ? 'PASS' : 'FAIL'); process.exitCode = ok ? 0 : 1;
});
