// Same-viewport comparison shots. node tests/tayduky-v3-ui-compare.mjs <label> [--saigon]
// label = before | after ; writes docs/tayduky/v3/screenshots/ui/polish/<label>-<WxH>.png (and saigon-<WxH>.png with --saigon)
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const label = process.argv[2] || 'after', OUT = 'docs/tayduky/v3/screenshots/ui/polish/'; fs.mkdirSync(OUT, { recursive: true });
for (const [W, H] of [[1920, 1080], [1366, 768], [820, 1180], [390, 844]]) {
  const shots = [[`${label}-${W}x${H}.png`, 'tayduky/index.html?at=hqs&seed=7&zoom=2&tod=noon', 5500]];
  if (process.argv.includes('--saigon')) shots.push([`saigon-${W}x${H}.png`, 'index.html?era=2&time=noon', 6500]);
  for (const [name, url, ms] of shots) await withChrome(W, H, async ({ base, send }) => {
    await send('Page.navigate', { url: base + url }); await wait(ms);
    fs.writeFileSync(OUT + name, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  });
}
console.log('done', label);
