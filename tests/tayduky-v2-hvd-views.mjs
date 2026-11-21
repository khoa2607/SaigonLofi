// Fire Cloud Cave day/night, landmark, waterfall, rim and neighbor visual review.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { withChrome, wait } from './cdp.mjs';

const out = process.argv[2] || 'docs/tayduky/v2/screenshots/hvd-redesign';
fs.mkdirSync(out, { recursive: true });
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errors = [];
  on(m => { if (m.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); });
  await send('Page.navigate', { url: base + 'tayduky/index.html?at=hvd&tod=day&zoom=1&seed=7' });
  await wait(6500);
  const shot = async (name, i, j, zoom, tod='day') => {
    await ev(`(()=>{TWR.zoom=${zoom};TWR.resize();TWR.tod='${tod}';TWR.clock=${tod==='night'?22:11};TWR.lookAt((${i}+.5)*8,(${j}+.5)*8,TWM.H[TWM.id(${i},${j})]*4)})()`);
    await wait(650);
    const png = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${out}/${name}.png`, Buffer.from(png.data, 'base64'));
    console.log('shot', name);
  };
  await shot('day-full', 15, 36, 1);
  await shot('night-full', 15, 36, 1, 'night');
  await shot('day-normal', 15, 36, 2);
  await shot('night-normal', 15, 36, 2, 'night');
  await shot('fortress', 12, 34, 2);
  await shot('waterfall', 29, 37, 2);
  await shot('south-rim', 4, 73, 1);
  await shot('neighbor-seams', 24, 47, 1);
  const assets = JSON.parse(await ev(`(async()=>{const out={};for(const name of ['hvd_redboy','hvd_guanyin','hvd_guard','hvd_trainee']){const a=TD2_CHARS.chars[name].hvdAction;const im=new Image();im.src=a.src;await im.decode();out[name]=[im.naturalWidth,im.naturalHeight,a.count]}return JSON.stringify(out)})()`,true));
  assert(Object.values(assets).every(a => a[0]===640 && a[1]===320 && a[2]===8));
  assert.deepEqual(errors, []);
  console.log('PASS Hỏa Vân Động views and action sheets', assets);
});
