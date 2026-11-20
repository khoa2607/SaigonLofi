// Tây Du Ký v2 world in headless Chrome: forces the three active story regions, pans between them, and checks
// 15 masks, resident counts, action frames, console errors, story starts and canvas draw time.
// Usage: node tests/tayduky-v2-world.mjs [seconds=30] [--shots dir]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const secs = +(process.argv[2] || 30), si = process.argv.indexOf('--shots'), dir = si > 0 ? process.argv[si + 1] : null;
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) errs.push(m.params.entry.text); });
  await send('Page.navigate', { url: base + 'tayduky/index.html?at=hqs&zoom=2&seed=7&speed=6&force=hqs,btd,tc' }); await wait(3000);
  const ms = [], sigs = new Set(); let k = 0;
  for (let s = 0; s < secs; s++) {
    if (s % 6 === 3) await ev(`(()=>{const c=${JSON.stringify([[80,141],[86,21],[140.5,22.5]])}[${k++ % 3}]; const m=TWM.layout.map(c[0],c[1]);TWR.lookAt(m[0]*8,m[1]*8,4);})()`);
    const st = JSON.parse(await ev(`JSON.stringify({ms: TWR.frameMs, h: TWS.biomes.hqs.phase, b: TWS.biomes.btd.phase, tc:TWS.biomes.tc.phase})`)); ms.push(st.ms);
    if (st.h === 'sig' || st.h === 'after') sigs.add('hqs'); if (st.b === 'sig' || st.b === 'after') sigs.add('btd'); if (st.tc === 'sig' || st.tc === 'after') sigs.add('tc');
    await wait(1000);
  }
  const res = JSON.parse(await ev(`JSON.stringify({ biomes: TWM.biomes.length, built: TWM.biomes.filter(b=>b.built).map(b=>b.id), residents: {hqs: TWS.agents.filter(a=>a.biome==='hqs'&&a.role!=='actor').length, btd: TWS.agents.filter(a=>a.biome==='btd'&&a.role!=='actor').length, tc:TWS.agents.filter(a=>a.biome==='tc'&&a.role!=='actor').length}, chunks: TWR.chunks.size })`));
  // Load off-screen sheets too before exercising the real renderer.
  await ev(`Promise.all(['king','sister'].map(async role=>{const a=TWS.agents.find(a=>a.role===role), S=TWR.sheet(a.look||a.char); await S.im.decode(); const im=new Image(); im.src=S.C.action.src; await im.decode(); TWR.drawAgent(TWR.cv.getContext('2d'),{...a,pose:'act',moving:false,inWater:false},true)}))`, true);
  await wait(250);
  // Exercise the real renderer with a recording context, including the night redraw.
  const poses = JSON.parse(await ev(`JSON.stringify((()=>{
    const calls=[], g={drawImage(...x){calls.push(x)},fillRect(){},save(){},restore(){}};
    const check=role=>{const a=TWS.agents.find(a=>a.role===role), C=TD2_CHARS.chars[a.look||a.char], old=TWR.t;
      const sample=t=>{calls.length=0; TWR.t=t; TWR.drawAgent(g,{...a,pose:'act',moving:false,phase:0,inWater:false,thread:0,robe:false,wrap:false,carry:null,bubble:null},true); return calls[0]&&calls[0][1]/C.action.size[0]};
      const frames=[sample(0),sample(.25),sample(.5)], actionWidth=calls[0]&&calls[0][3];
      calls.length=0; TWR.drawAgent(g,{...a,role:'actor',pose:'act',moving:false,inWater:false},true); const actorWidth=calls[0]&&calls[0][3];
      calls.length=0; TWR.drawAgent(g,{...a,pose:'sit',moving:false,inWater:false,thread:0},true); const height=calls[0]&&calls[0][4]; TWR.t=old;
      return {frames,actionWidth,actorWidth,seatCrop:height<C.size[1]};};
    return {king:check('king'),sister:check('sister')};})())`));
  ms.sort((a, b) => a - b);
  console.log(JSON.stringify({ ...res, poses, signatures: [...sigs], drawMsMedian: ms[ms.length >> 1], drawMsP90: ms[Math.floor(ms.length * 0.9)], errors: errs }, null, 1));
  if (dir) {
    fs.mkdirSync(dir, { recursive: true });
    for (const [name, at, tod, z] of [['thien-cung-day',[85,21],'day',2],['thien-cung-night',[85,21],'night',2],['thien-cung-wide-day',[85,21],'day',1],['thien-cung-wide-night',[85,21],'night',1],['hoa-qua-son-day', [131, 17], 'day', 2], ['hoa-qua-son-night', [138, 24], 'night', 2], ['ban-to-dong-day', [80, 141], 'day', 2], ['ban-to-dong-night', [84, 142], 'night', 2]]) {
      await ev(`TWR.zoom=${z}; TWR.resize()`);
      await ev(`(()=>{TWR.tod='${tod}'; TWR.clock={day:11,dusk:18.2,night:22}['${tod}']; const m=TWM.layout.map(${at[0]},${at[1]});TWR.lookAt(m[0]*8,m[1]*8,16);})()`); await wait(2500);
      const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${dir}/${name}.png`, Buffer.from(s.data, 'base64'));
    }
  }
  const ok = !errs.length && res.biomes === 15 && res.residents.hqs > 10 && res.residents.btd > 10 && res.residents.tc >= 15 && sigs.size === 3 && Object.values(poses).every(p => p.seatCrop && p.actionWidth === 80 && p.actorWidth === 80 && new Set(p.frames).size >= 2);
  console.log(ok ? 'PASS' : 'FAIL'); process.exitCode = ok ? 0 : 1;
});
