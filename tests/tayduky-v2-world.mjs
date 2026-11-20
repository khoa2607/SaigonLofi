// Tây Du Ký v2 world in headless Chrome: boots tayduky/, forces both pilot stories, pans between the two finished biomes in the same
// persistent world, and checks: no console errors, 11 biome cells, residents in both biomes, both signatures start, draw time per frame.
// Usage: node tests/tayduky-v2-world.mjs [seconds=30] [--shots dir]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const secs = +(process.argv[2] || 30), si = process.argv.indexOf('--shots'), dir = si > 0 ? process.argv[si + 1] : null;
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) errs.push(m.params.entry.text); });
  await send('Page.navigate', { url: base + 'tayduky/index.html?at=hqs&zoom=2&seed=7&speed=6&force=hqs,btd' }); await wait(3000);
  const ms = [], sigs = new Set(); let k = 0;
  for (let s = 0; s < secs; s++) {
    if (s % 6 === 3) await ev(`(()=>{const b=${k++ % 2 ? "'hqs'" : "'btd'"}; const c=b==='hqs'?[140.5,22.5]:[80,141]; TWR.lookAt(c[0]*8,c[1]*8,16);})()`);
    const st = JSON.parse(await ev(`JSON.stringify({ms: TWR.frameMs, h: TWS.biomes.hqs.phase, b: TWS.biomes.btd.phase})`)); ms.push(st.ms);
    if (st.h === 'sig' || st.h === 'after') sigs.add('hqs'); if (st.b === 'sig' || st.b === 'after') sigs.add('btd');
    await wait(1000);
  }
  const res = JSON.parse(await ev(`JSON.stringify({ biomes: TWM.biomes.length, built: TWM.biomes.filter(b=>b.built).map(b=>b.id), residents: {hqs: TWS.agents.filter(a=>a.biome==='hqs'&&a.role!=='actor').length, btd: TWS.agents.filter(a=>a.biome==='btd'&&a.role!=='actor').length}, chunks: TWR.chunks.size })`));
  ms.sort((a, b) => a - b);
  console.log(JSON.stringify({ ...res, signatures: [...sigs], drawMsMedian: ms[ms.length >> 1], drawMsP90: ms[Math.floor(ms.length * 0.9)], errors: errs }, null, 1));
  if (dir) {
    fs.mkdirSync(dir, { recursive: true });
    for (const [name, at, tod] of [['hoa-qua-son-day', [131, 17], 'day'], ['hoa-qua-son-night', [138, 24], 'night'], ['ban-to-dong-day', [80, 141], 'day'], ['ban-to-dong-night', [84, 142], 'night']]) {
      await ev(`(()=>{TWR.tod='${tod}'; TWR.clock={day:11,dusk:18.2,night:22}['${tod}']; TWR.lookAt(${at[0]}*8,${at[1]}*8,16);})()`); await wait(2500);
      const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${dir}/${name}.png`, Buffer.from(s.data, 'base64'));
    }
  }
  const ok = !errs.length && res.biomes === 11 && res.residents.hqs > 10 && res.residents.btd > 10 && sigs.size === 2;
  console.log(ok ? 'PASS' : 'FAIL'); process.exitCode = ok ? 0 : 1;
});
