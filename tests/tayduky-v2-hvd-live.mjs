// Verifies the actually served Hỏa Vân Động URL and captures its untouched initial camera.
// Usage: node tests/tayduky-v2-hvd-live.mjs [base=http://127.0.0.1:8766/] [out.png]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { withChrome, wait } from './cdp.mjs';

const base = (process.argv[2] || 'http://127.0.0.1:8766/').replace(/\/?$/, '/');
const out = process.argv[3] || 'docs/tayduky/v2/screenshots/hvd-redesign/runtime-port-8766.png';

await withChrome(1920, 1080, async ({ send, ev, on }) => {
  const errors = [];
  on(m => { if (m.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(m.params.exceptionDetails).slice(0, 600)); });
  const url = `${base}tayduky/?at=hvd&tod=day&zoom=1&seed=7&runtime=fixed`;
  await send('Page.navigate', { url });
  await wait(8000);
  const initial = JSON.parse(await ev(`(()=>{const k=TWM.id(15,36),x=(15+.5)*8,y=(36+.5)*8,z=TWM.H[k]*4;return JSON.stringify({built:TWM.biomes[TWM.bi.hvd].built,hook:typeof TW_HVD_BUILD,art:!!TWA.hvd,fx:!!TWFX.hvd,biome:TWM.biomeAt(15,36),material:TWM.MAT[k],placeholder:TWM.M.PH+TWM.bi.hvd,props:TWM.props.filter(p=>p.biome==='hvd').length,camera:[TWR.cx,TWR.cy],expected:[TWR.wx(x,y),TWR.wy(x,y,z)]})})()`));
  assert.equal(initial.built, true);
  assert.equal(initial.hook, 'function');
  assert.equal(initial.art, true);
  assert.equal(initial.fx, true);
  assert.equal(initial.biome, 'hvd');
  assert.notEqual(initial.material, initial.placeholder);
  assert(initial.props >= 25, `HVD props missing: ${initial.props}`);
  assert(Math.abs(initial.camera[0]-initial.expected[0])<=1 && Math.abs(initial.camera[1]-initial.expected[1])<=1, `at=hvd camera bookmark drifted: ${initial.camera} != ${initial.expected}`);
  assert.deepEqual(errors, []);
  const png = await send('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(png.data, 'base64'));
  console.log('PASS live Hỏa Vân Động', { url, out, initial });
});
