// Tây Du Ký world access card (Lofi Worlds gallery). node tests/tayduky-v3-card.mjs [--shots]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const SHOTS = process.argv.includes('--shots'), OUT = 'docs/tayduky/v3/screenshots/card/'; if (SHOTS) fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const save = (d, n) => fs.writeFileSync(OUT + n, Buffer.from(d.data, 'base64'));
// signature colours of each pilgrim (see SCENES.tayduky in js/menu.js)
const SIG = { sha: '#8aa0b0', baj: '#d88890', tang: '#d84a3a', wuk: '#e87a2a' };
const probe = `(() => { const c = document.createElement('canvas'); c.width = 96; c.height = 96; const g = c.getContext('2d'); const SIG = ${JSON.stringify(SIG)}; const out = {};
  for (const t of [0, 0.3, 0.6, 0.9, 1.4, 2.2, 3.1, 5.7]) { g.clearRect(0, 0, 96, 96); SCENES.tayduky(g, t); const d = g.getImageData(0, 0, 96, 96).data, r = {};
    for (const [k, hex] of Object.entries(SIG)) { const R = parseInt(hex.slice(1, 3), 16), G = parseInt(hex.slice(3, 5), 16), B = parseInt(hex.slice(5, 7), 16); let sx = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === R && d[i + 1] === G && d[i + 2] === B && d[i + 3] === 255) { sx += (i / 4) % 96; n++; } r[k] = n ? sx / n : -1; }
    out[t] = r; } return out; })()`;
// 1. composition and order, across the animation
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = [], miss = [];
  on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); if (m.method === 'Network.responseReceived' && m.params.response.status >= 400 && !/favicon/.test(m.params.response.url)) miss.push(m.params.response.status + ' ' + m.params.response.url); });
  await send('Network.enable').catch(() => { });
  await send('Page.navigate', { url: base + 'index.html' }); await wait(2500);
  const J = async e => JSON.parse(await ev(`JSON.stringify(${e})`));
  const info = await J(`({ cards: [...document.querySelectorAll('.mcard')].map(c => c.dataset.world + ':' + c.className.replace('mcard ', '')), title: document.querySelector('.mcard[data-world=tayduky] .mt').textContent, desc: document.querySelector('.mcard[data-world=tayduky] .md').textContent, tag: document.querySelector('.mcard[data-world=tayduky]').tagName })`);
  ok(info.cards.length === 7 && info.cards.includes('tayduky:live'), 'gallery shows 7 cards incl. a live Tây Du Ký card: ' + info.cards.join(' '));
  ok(info.cards.slice(0, 6).join() === 'saigon:live,snow:soon,wild:soon,clean:soon,ocean:soon,holdfast:live', 'existing six cards untouched, same order');
  ok(info.title === 'Tây Du Ký — Huyền Thoại Sống' && info.tag === 'BUTTON', 'title + native <button> (focusable) : ' + info.title);
  const pos = await J(probe); let orderOk = true, still = true; const base0 = pos['0'];
  for (const [t, r] of Object.entries(pos)) { if (!(r.sha >= 0 && r.sha < r.baj && r.baj < r.tang && r.tang < r.wuk)) orderOk = false; for (const k of Object.keys(r)) if (Math.abs(r[k] - base0[k]) > 2.5) still = false; }
  ok(orderOk, 'order left->right Sha < Bajie < Tang(+horse) < Wukong in 8 animation phases ' + JSON.stringify(Object.fromEntries(Object.entries(base0).map(([k, v]) => [k, +v.toFixed(1)]))));
  ok(still, 'no character drifts or teleports between frames (centroid movement <= 2.5px)');
  ok(Object.values(base0).every(v => v >= 0), 'all four pilgrims are drawn (colour signatures present)');
  // animation runs: the live canvas changes over time
  const h = () => ev(`(() => { const c = document.querySelector('.mcard[data-world=tayduky] canvas'); return c.getContext('2d').getImageData(0, 0, 96, 96).data.reduce((a, v, i) => (a * 31 + v + i) | 0, 7) })()`);
  const h1 = await h(); await wait(1200); const h2 = await h(); ok(h1 !== h2, 'card animates (canvas changes over time)');
  ok(!errs.length, 'no JS errors ' + errs.join('|')); ok(!miss.length, 'no 4xx assets ' + miss.join('|'));
  if (SHOTS) {
    save(await send('Page.captureScreenshot', { format: 'png' }), 'gallery-1920.png');
    const r = await J(`(() => { const b = document.querySelector('.mcard[data-world=tayduky]').getBoundingClientRect(); return {x: b.x, y: b.y + scrollY, w: b.width, h: b.height} })()`);
    await ev(`document.querySelector('.mcard[data-world=tayduky]').scrollIntoView({block:'center'})`); await wait(400);
    const r2 = await J(`(() => { const b = document.querySelector('.mcard[data-world=tayduky]').getBoundingClientRect(); return {x: b.x, y: b.y, w: b.width, h: b.height} })()`);
    save(await send('Page.captureScreenshot', { format: 'png', clip: { x: r2.x - 10, y: r2.y - 10, width: r2.w + 20, height: r2.h + 90, scale: 1 } }), 'card-normal-size.png');
    // full-size art (96 px -> x8) and representative animation frames
    const png = async (t, k) => (await ev(`(() => { const s = document.createElement('canvas'); s.width = 96; s.height = 96; SCENES.tayduky(s.getContext('2d'), ${t}); const o = document.createElement('canvas'); o.width = 96 * ${k}; o.height = 96 * ${k}; const g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(s, 0, 0, o.width, o.height); return o.toDataURL('image/png').split(',')[1] })()`));
    fs.writeFileSync(OUT + 'card-art-full.png', Buffer.from(await png(2, 8), 'base64'));
    const sheet = await ev(`(() => { const o = document.createElement('canvas'); o.width = 96 * 4 * 4; o.height = 96 * 4; const g = o.getContext('2d'); g.imageSmoothingEnabled = false; [0, 0.3, 0.6, 0.9].forEach((t, i) => { const s = document.createElement('canvas'); s.width = 96; s.height = 96; SCENES.tayduky(s.getContext('2d'), t); g.drawImage(s, i * 384, 0, 384, 384); }); return o.toDataURL('image/png').split(',')[1] })()`);
    fs.writeFileSync(OUT + 'card-animation-frames.png', Buffer.from(sheet, 'base64'));
    const close = await ev(`(() => { const s = document.createElement('canvas'); s.width = 96; s.height = 96; SCENES.tayduky(s.getContext('2d'), 2); const o = document.createElement('canvas'); o.width = 90 * 12; o.height = 36 * 12; const g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(s, 3, 50, 90, 36, 0, 0, o.width, o.height); return o.toDataURL('image/png').split(',')[1] })()`);
    fs.writeFileSync(OUT + 'card-closeup-travelers.png', Buffer.from(close, 'base64'));
  }
  // 2. click opens Tây Du Ký (not Saigon / Holdfast)
  await ev(`document.querySelector('.mcard[data-world=tayduky]').click()`); await wait(2500);
  const url = await ev('location.href'); ok(/tayduky\/index\.html/.test(url), 'click opens the Tây Du Ký world: ' + url);
});
// 3. reduced motion: still frame
await withChrome(1366, 768, async ({ base, send, ev }) => {
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: base + 'index.html' }); await wait(2500);
  const h = () => ev(`(() => { const c = document.querySelector('.mcard[data-world=tayduky] canvas'); return c.getContext('2d').getImageData(0, 0, 96, 96).data.reduce((a, v, i) => (a * 31 + v + i) | 0, 7) })()`);
  const a = await h(); await wait(1500); const b = await h(); ok(a === b && a !== 7, 'reduced motion: the card keeps a still, non-empty frame');
});
// 4. responsive gallery
for (const [W, H] of [[1920, 1080], [1366, 768], [820, 1180], [390, 844]]) await withChrome(W, H, async ({ base, send, ev }) => {
  await send('Page.navigate', { url: base + 'index.html' }); await wait(2500);
  const r = JSON.parse(await ev(`JSON.stringify((() => { const c = document.querySelector('.mcard[data-world=tayduky] .mart').getBoundingClientRect(), s = document.querySelector('.mcard[data-world=saigon] .mart').getBoundingClientRect(); return { w: c.width, h: c.height, sw: s.width, sh: s.height, over: document.documentElement.scrollWidth > innerWidth + 1 } })())`));
  ok(Math.abs(r.w - r.h) < 1 && !r.over, `[${W}x${H}] card square (${r.w}x${r.h}) and no horizontal overflow`);
  if (W === 390 || W === 1366) ok(true, `[${W}] card width ${r.w}`);
  if (SHOTS) { await ev(`document.querySelector('.mcard[data-world=tayduky]').scrollIntoView({block:'center'})`); await wait(500); save(await send('Page.captureScreenshot', { format: 'png' }), `gallery-${W}x${H}.png`); }
});
console.log(fails ? `${fails} FAIL` : 'ALL PASS'); process.exit(fails ? 1 : 0);
