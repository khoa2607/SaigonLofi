// Tây Du Ký v3 UI: layout, music, day/night, language, 15-biome navigator, dragon layer, console errors.
// node tests/tayduky-v3-ui.mjs [--shots]
import { withChrome, wait } from './cdp.mjs';
import fs from 'fs';
const SHOTS = process.argv.includes('--shots'), OUT = 'docs/tayduky/v3/screenshots/ui/';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const sizes = [[1920, 1080], [1600, 900], [1366, 768], [1280, 720], [820, 1180], [390, 844]];
const IDS = ['hqs', 'tc', 'btp', 'nhs', 'clt', 'bcl', 'hps', 'btd', 'hds', 'tth', 'lat', 'ntq', 'hvd', 'lhd', 'sdl'];
const shot = async (send, name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(OUT + name, Buffer.from(s.data, 'base64')); };
for (const [W, H] of sizes) {
  await withChrome(W, H, async ({ base, send, ev, on }) => {
    const errs = [], miss = [];
    on(m => {
      if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300));
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) errs.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
      if (m.method === 'Network.responseReceived' && m.params.response.status >= 400 && !/favicon/.test(m.params.response.url)) miss.push(m.params.response.status + ' ' + m.params.response.url);
    });
    await send('Network.enable').catch(() => { });
    await send('Page.navigate', { url: base + 'tayduky/index.html?at=hqs&zoom=2&seed=7' }); await wait(5000);
    const tag = `[${W}x${H}] `;
    const r = JSON.parse(await ev(`JSON.stringify({
      nav: document.querySelectorAll('#nav button').length, dpe: getComputedStyle(document.getElementById('dragon')).pointerEvents,
      over: document.documentElement.scrollWidth > innerWidth + 1, active: TWNAV.active(), here: TWNAV.biomeHere() })`));
    ok(r.nav === 15, tag + '15 navigator buttons'); ok(r.dpe === 'none', tag + 'dragon pointer-events none'); ok(!r.over, tag + 'no horizontal overflow'); ok(r.active === 'hqs', tag + 'active biome = hqs (' + r.active + ')');
    if (W === 1920 || W === 390 || W === 820 || W === 1366) {
      const before = JSON.parse(await ev(`JSON.stringify({z: TWR.zoom, tod: TWR.tod, ag: TWS.agents.length})`));
      const bad = [];
      for (const id of IDS) {
        await ev(`document.querySelector('#nav [data-biome=${id}]').click()`); await wait(3200);
        const q = JSON.parse(await ev(`JSON.stringify({here: TWNAV.biomeHere(), act: TWNAV.active(), on: document.querySelectorAll('#nav .on').length, moving: TWNAV.moving()})`));
        if (q.here !== id || q.act !== id || q.on !== 1 || q.moving) bad.push(id + ':' + JSON.stringify(q));
      }
      ok(!bad.length, tag + 'all 15 biome clicks move the camera + highlight ' + bad.join(' '));
      const after = JSON.parse(await ev(`JSON.stringify({z: TWR.zoom, tod: TWR.tod})`));
      ok(after.z === before.z && after.tod === before.tod, tag + 'zoom + time mode kept across navigation');
    }
    ok(!errs.length, tag + 'no JS errors ' + errs.join('|')); ok(!miss.length, tag + 'no missing assets ' + miss.join('|'));
    if (SHOTS) { await ev(`document.querySelector('#nav [data-biome=hqs]').click()`); await wait(3200); await shot(send, W === 390 ? 'ui-responsive-mobile.png' : W === 820 ? 'ui-responsive-tablet.png' : `ui-responsive-${W}.png`); }
  });
}
await withChrome(1600, 900, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
  await send('Page.navigate', { url: base + 'tayduky/index.html?at=hqs&zoom=2&seed=7' }); await wait(4500);
  const J = async e => JSON.parse(await ev(`JSON.stringify(${e})`));
  const click = s => ev(`document.querySelector('${s}').click()`);
  const slide = (id, v) => ev(`(()=>{const v=document.getElementById('${id}'); v.value=${v}; v.dispatchEvent(new Event('input'))})()`);
  await click('#play'); await wait(600);
  let a = await J(`({playing: AU.playing, cls: document.getElementById('play').classList.contains('playing'), hint: document.getElementById('hint').classList.contains('gone')})`);
  ok(a.playing && a.cls && a.hint, 'music: play starts the radio, button state + hint hidden');
  await click('#play'); await wait(300); a = await J(`({playing: AU.playing})`); ok(!a.playing, 'music: pause');
  await click('#next'); a = await J(`({tr: AU.track, name: document.getElementById('tname').textContent})`); ok(a.tr === 1, 'music: next track -> ' + a.name);
  await click('#prev'); await click('#prev'); a = await J(`({tr: AU.track})`); ok(a.tr === 5, 'music: prev wraps (' + a.tr + ')');
  await click('#more');
  await slide('vMusic', 20); a = await J(`({v: AU.vol.music, saved: JSON.parse(localStorage.getItem('saigonlofi')).vol.music})`); ok(Math.abs(a.v - 0.2) < 0.01 && Math.abs(a.saved - 0.2) < 0.01, 'music: volume slider + saved to prefs');
  await slide('vMusic', 0); a = await J(`({v: AU.vol.music})`); ok(a.v === 0, 'music: mute (volume 0)');
  await slide('vMusic', 70);
  for (const [m, lo, hi] of [['night', 21, 23], ['morning', 7, 8], ['noon', 12, 13], ['dusk', 18, 19]]) { await click(`[data-time=${m}]`); await wait(200); a = await J(`({c: TWR.clock, tod: TWR.tod})`); ok(a.c >= lo && a.c <= hi && a.tod === m, `time: ${m} -> clock ${a.c.toFixed(1)}`); }
  await click('[data-time=auto]'); const c0 = (await J(`({c: TWR.clock})`)).c; await wait(1500); const c1 = (await J(`({c: TWR.clock})`)).c; ok(c1 !== c0, 'time: auto cycle advances');
  await click('[data-time=night]'); await click('#nav [data-biome=lat]'); await wait(3000); a = await J(`({tod: TWR.tod})`); ok(a.tod === 'night', 'time: night persists across biome navigation');
  await click('[data-lang=en]'); a = await J(`({t: document.getElementById('tnum').textContent, tip: document.querySelector('#nav [data-biome=hqs]').title})`); ok(/track/.test(a.t) && /Flower/.test(a.tip), 'language: EN applies (' + a.t + ' / ' + a.tip + ')');
  await click('[data-lang=vi]');
  await click('#hide'); a = await J(`({clean: document.body.classList.contains('clean'), dr: getComputedStyle(document.getElementById('dragon')).display})`); ok(a.clean && a.dr === 'none', 'view: hide panels hides dragon too');
  await ev(`dispatchEvent(new KeyboardEvent('keydown',{key:'h'}))`); a = await J(`({clean: document.body.classList.contains('clean')})`); ok(!a.clean, 'view: H restores');
  await send('Page.navigate', { url: base + 'tayduky/index.html?at=hqs&zoom=2&seed=7' }); await wait(4500);
  a = await J(`({tr: AU.track, v: AU.vol.music, tm: localStorage.getItem('tayduky-time'), tod: TWR.tod})`); ok(a.tr === 5 && Math.abs(a.v - 0.7) < 0.01 && a.tm === 'night' && a.tod === 'night', 'prefs restored after reload ' + JSON.stringify(a));
  ok(!errs.length, 'no JS errors in interaction run ' + errs.join('|'));
});
console.log(fails ? `${fails} FAIL` : 'ALL PASS'); process.exit(fails ? 1 : 0);
