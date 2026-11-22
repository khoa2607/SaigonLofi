// Browser art and story review frames for the complete Fire Cloud Cave signature.
// node tests/tayduky-v2-hvd-browser.mjs [outDir]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { withChrome, wait } from './cdp.mjs';

const out = process.argv[2] || 'docs/tayduky/v2/screenshots/hvd-redesign';
fs.mkdirSync(out, { recursive: true });
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errors = [];
  on(m => { if (m.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(m.params.exceptionDetails).slice(0, 600)); });
  await send('Page.navigate', { url: base + 'tayduky/index.html?at=hvd&tod=day&zoom=1&seed=7&force=hvd' });
  await wait(7000);
  const initial = JSON.parse(await ev(`(()=>{const k=TWM.id(15,36),x=(15+.5)*8,y=(36+.5)*8,z=TWM.H[k]*4;return JSON.stringify({built:TWM.biomes[TWM.bi.hvd].built,hook:typeof TW_HVD_BUILD,art:!!TWA.hvd,fx:!!TWFX.hvd,biome:TWM.biomeAt(15,36),material:TWM.MAT[k],placeholder:TWM.M.PH+TWM.bi.hvd,props:TWM.props.filter(p=>p.biome==='hvd').length,camera:[TWR.cx,TWR.cy],expected:[TWR.wx(x,y),TWR.wy(x,y,z)]})})()`));
  assert.equal(initial.built, true, 'HVD runtime build hook did not run');
  assert.equal(initial.hook, 'function');
  assert.equal(initial.art, true);
  assert.equal(initial.fx, true);
  assert.equal(initial.biome, 'hvd');
  assert.notEqual(initial.material, initial.placeholder, 'HVD centre is still placeholder terrain');
  assert(initial.props >= 25, `HVD props missing: ${initial.props}`);
  assert(Math.abs(initial.camera[0]-initial.expected[0])<=1 && Math.abs(initial.camera[1]-initial.expected[1])<=1, `at=hvd camera bookmark drifted: ${initial.camera} != ${initial.expected}`);
  const shot = async name => {
    await wait(250);
    const png = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${out}/${name}.png`, Buffer.from(png.data, 'base64'));
    console.log('shot', name);
  };
  const focus = (i, j, zoom) => ev(`(()=>{TWR.zoom=${zoom};TWR.resize();TWR.lookAt((${i}+.5)*8,(${j}+.5)*8,TWM.H[TWM.id(${i},${j})]*4);return TWR.zoom})()`);
  const status = () => ev(`(()=>{const b=TWS.biomes.hvd,h=TWS.hvd;return JSON.stringify({phase:b.phase,step:b.run?.i??-1,captive:h.captive,fire:h.fire,water:h.water,divine:h.divine,ash:h.ash,recovering:h.recovering,acts:TWS.agents.filter(a=>a.biome==='hvd'&&a.pose==='act').length})})()`).then(JSON.parse);
  const wanted = new Set(['capture', 'fire', 'divine', 'aftermath', 'recovery']);
  for (let k = 0; k < 55 && wanted.size; k++) {
    await ev('(()=>{for(let n=0;n<100;n++)TWS.tick(.1);return TWS.t})()');
    const s = await status();
    if (wanted.has('capture') && s.captive && s.fire < .25) { await focus(12, 36, 2); await shot('signature-capture'); wanted.delete('capture'); }
    if (wanted.has('fire') && s.fire > .75 && !s.divine) { await focus(23, 40, 2); await shot('signature-true-fire'); wanted.delete('fire'); }
    if (wanted.has('divine') && s.divine && s.water > .6) { await focus(23, 40, 2); await shot('signature-guanyin'); wanted.delete('divine'); }
    if (wanted.has('aftermath') && s.phase === 'after' && s.ash > .3) { await focus(17, 39, 1); await shot('signature-aftermath'); wanted.delete('aftermath'); }
    if (wanted.has('recovery') && s.phase === 'after' && s.recovering && s.ash < .1) { await focus(17, 39, 1); await shot('signature-recovery'); wanted.delete('recovery'); }
  }
  assert.equal(wanted.size, 0, `missing views ${[...wanted]}`);
  assert.deepEqual(errors, [], 'browser exceptions');
  console.log('PASS Fire Cloud Cave browser story');
});
