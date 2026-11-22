// Required UI screenshots for Tây Du Ký v3 + same-viewport comparison with SaigonLofi and Holdfast.
// node tests/tayduky-v3-ui-shots.mjs
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const OUT = 'docs/tayduky/v3/screenshots/ui/';
const save = (d, n) => fs.writeFileSync(OUT + n, Buffer.from(d.data, 'base64'));
const TD = 'tayduky/index.html?at=hqs&seed=7';
async function page(W, H, url, ms, fn) { await withChrome(W, H, async c => { await c.send('Page.navigate', { url: c.base + url }); await wait(ms); await fn(c); }); }
const full = (n, W, H, q, extra) => page(W, H, TD + q, 5500, async ({ send, ev }) => { if (extra) await extra(ev, send); save(await send('Page.captureScreenshot', { format: 'png' }), n); });
await full('ui-wide-day.png', 1920, 1080, '&zoom=2&tod=noon');
await full('ui-wide-night.png', 1920, 1080, '&zoom=2&tod=night');
await full('ui-normal-day.png', 1366, 768, '&zoom=2&tod=noon');
await full('ui-normal-night.png', 1366, 768, '&zoom=2&tod=night');
// dragon art close-up (static): the whole frame region at 2x
await page(1920, 1080, TD + '&zoom=2&tod=noon', 5000, async ({ send }) => {
  save(await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 660, height: 470, scale: 2 } }), 'ui-dragon-closeup.png');
});
// biome navigator with a hover tooltip and the active highlight
await page(1600, 900, 'tayduky/index.html?seed=7&zoom=2&at=nhs&tod=noon', 5500, async ({ send, ev }) => {
  const r = JSON.parse(await ev(`JSON.stringify(document.querySelector('#nav [data-biome=lhd]').getBoundingClientRect())`));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x + r.width / 2, y: r.y + r.height / 2 }); await wait(400);
  save(await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 660, height: 470, scale: 2 } }), 'ui-biome-navigator.png');
});
// music controls: playing, panel open
await page(1600, 900, TD + '&zoom=2&tod=noon', 5000, async ({ send, ev }) => {
  await ev(`document.getElementById('play').click()`); await wait(900); await ev(`document.getElementById('more').click()`); await wait(500);
  save(await send('Page.captureScreenshot', { format: 'png', clip: { x: 430, y: 400, width: 740, height: 500, scale: 1.5 } }), 'ui-music-controls.png');
});
// responsive contact sheet is produced by tests/tayduky-v3-ui.mjs --shots (ui-responsive-*.png)
// comparison at one viewport (1600x900): SaigonLofi, Holdfast, Tây Du Ký
await page(1600, 900, 'index.html?era=2&time=night', 6000, async ({ send, ev }) => { save(await send('Page.captureScreenshot', { format: 'png' }), 'compare-1-saigonlofi.png'); });
await page(1600, 900, 'holdfast/index.html', 9000, async ({ send, ev }) => { save(await send('Page.captureScreenshot', { format: 'png' }), 'compare-2-holdfast.png'); });
await page(1600, 900, TD + '&zoom=2&tod=night', 6000, async ({ send, ev }) => { save(await send('Page.captureScreenshot', { format: 'png' }), 'compare-3-tayduky.png'); });
console.log('shots done');
