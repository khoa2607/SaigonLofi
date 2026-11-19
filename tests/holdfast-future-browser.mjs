// Holdfast FUTURE in a real (headless) Chrome: three ages in one page, seamless, nothing reloads or restarts; the Future renders and lives.
//   PAST <-> CURRENT <-> FUTURE switching: no navigation, no loading screen, no blank frame, camera + zoom identical in every frame,
//   one animation loop, no listener / timer / AudioContext added, music untouched, every world frozen while away and resumed exactly,
//   rapid clicks across three tabs, gallery -> Holdfast (Future) -> gallery -> back; Future render: machines, drones, signals, searchlights,
//   blackout in the light pass, frame times; screenshots for the docs with --shots.
// Usage: node tests/holdfast-future-browser.mjs [--shots]
import fs from 'fs'; import path from 'path';
import { withChrome, until, wait, root } from './cdp.mjs';
const SHOTS = process.argv.includes('--shots'), DIR = path.join(root, 'docs/holdfast/screenshots');
const fails = [], rep = {}, errors = [];
const check = (k, ok, info) => { rep[k] = { ok: !!ok, info }; if (!ok) fails.push(k + ' ' + JSON.stringify(info)); console.log((ok ? 'PASS ' : 'FAIL ') + k + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 260) : '')); };
const INSTRUMENT = `(() => { const I = window.__ins = { l: 0, iv: 0, ctx: 0, loop: 0 }; const oa = EventTarget.prototype.addEventListener; EventTarget.prototype.addEventListener = function () { I.l++; return oa.apply(this, arguments); };
  const si = window.setInterval; I.rawSI = si; window.setInterval = function () { I.iv++; return si.apply(this, arguments); }; const raf = window.requestAnimationFrame; window.requestAnimationFrame = function (cb) { if (cb && cb.name === 'hfLoop') I.loop++; return raf.call(window, cb); };
  for (const n of ['AudioContext', 'webkitAudioContext']) if (window[n]) { const A = window[n]; window[n] = function () { I.ctx++; return new A(...arguments); }; window[n].prototype = A.prototype; } })()`;
const SAMPLER = `(() => { const c = document.getElementById('c'), ld = document.getElementById('load'), s = document.createElement('canvas'); s.width = 32; s.height = 18; const g = s.getContext('2d', { willReadFrequently: true });
  window.__fr = []; window.__stop = false; let last = performance.now(), lastLoop = __ins.loop;
  const step = () => { const now = performance.now(); g.drawImage(c, 0, 0, 32, 18); const d = g.getImageData(0, 0, 32, 18).data; let lum = 0; const set = new Set(); for (let i = 0; i < d.length; i += 4) { lum += d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; set.add((d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4)); }
    __fr.push({ dt: now - last, lum: lum / (d.length / 4), uniq: set.size, load: !!(ld && !ld.hidden && getComputedStyle(ld).display !== 'none' && +getComputedStyle(ld).opacity > 0.01), cx: HFAPI.HR.cx, cy: HFAPI.HR.cy, z: HFAPI.HR.zoom, loop: __ins.loop - lastLoop, fade: !!HFAPI.TR.fade, era: HFAPI.HWD.shown });
    last = now; lastLoop = __ins.loop; if (!window.__stop) requestAnimationFrame(step); }; requestAnimationFrame(step); })()`;
const FP = `(() => { let h = 0; const mix = v => { v = Math.round(v * 100); h = (Math.imul(h, 31) + v) | 0; }; for (const p of HS.people) { mix(p.x); mix(p.y); } for (const z of HS.zombies) { mix(z.x); mix(z.y); mix(z.hp); } mix(HS.t); return h; })()`;
const pct = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(b.length * p))]; };

await withChrome(1366, 768, async ({ base, send, ev, on }) => {
  let navs = 0; on(d => { if (d.method === 'Runtime.exceptionThrown') errors.push('exception: ' + JSON.stringify(d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description || d.params.exceptionDetails.text).slice(0, 240)); if (d.method === 'Page.frameNavigated') navs++; });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  const j = async e => JSON.parse(await ev(`JSON.stringify(${e})`)), idle = () => until(ev, '!HFAPI.TR.busy && !HFAPI.TR.fade', 500, 200);
  const click = era => ev(`document.querySelector('#eras [data-tl="${era}"]').click(); 1`), fp = era => ev(`hwWith('${era}', () => ${FP})`);
  const snap = () => j('({ l: __ins.l, iv: __ins.iv, ctx: __ins.ctx })');
  const shot = async name => { if (!SHOTS) return; fs.mkdirSync(DIR, { recursive: true }); const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(DIR, name), Buffer.from(r.data, 'base64')); };
  await send('Page.navigate', { url: base + 'holdfast/index.html?seed=7&time=noon&wx=clear&season=summer&warp=30&era=current' + (SHOTS ? '&clean=1' : '') });
  await until(ev, 'window.HFAPI && HFAPI.HFG.booted', 300, 300); await wait(1500);
  const nav0 = navs; await ev(`window.__mark = Math.random(); HFAPI.zoom(1); HFAPI.HR.cx = Math.round(HFAPI.HR.cx + 40); HFAPI.HR.cy = Math.round(HFAPI.HR.cy - 20); HFAPI.MW.audioPlay(); window.__ctx0 = HFAPI.MW.AU.ctx; 1`); await wait(800);
  const mark = await ev('window.__mark'), cam = await j('({ cx: HFAPI.HR.cx, cy: HFAPI.HR.cy, z: HFAPI.HR.zoom })'), S0 = await snap();
  const tab = await j(`(() => { const b = document.querySelector('#eras [data-tl="future"]'); return { disabled: b.getAttribute('aria-disabled'), text: b.textContent.trim() }; })()`);
  check('tab: the FUTURE tab is enabled (no longer "soon")', tab.disabled !== 'true', tab);
  if (SHOTS) await shot('40-triptych-current.png');
  // ---------------------------------------------------------------- CURRENT -> FUTURE (first time: prepared in the background)
  await ev(SAMPLER); await click('future'); await idle(); await wait(400); await ev('window.__stop = true; 1'); await wait(100);
  const fr = await j('__fr'), A = await j(`({ shown: HFAPI.HWD.shown, era: HFAPI.HF.era, body: document.body.classList.contains('era-future'), sub: document.getElementById('eraSub').dataset.i18n, aria: document.getElementById('c').getAttribute('aria-label').slice(0, 30), bots: HFAPI.HS.zombies.filter(z => z.L.ev === 'bot').length, errs: HFAPI.HFG.errs })`);
  check('switch: Current -> Future in the page (era, page class, subtitle, canvas label), machines in the valley', A.shown === 'future' && A.era === 'future' && A.body && A.sub === 'hf.sub.future' && /Future/.test(A.aria) && A.bots > 20, A);
  check('switch: no navigation, same document (marker kept), no loading screen, never a blank frame', navs === nav0 && (await ev('window.__mark')) === mark && fr.every(f => !f.load) && fr.every(f => f.lum > 25 && f.uniq >= 6) && fr.length > 60, { navs, n: fr.length, minLum: Math.min(...fr.map(f => f.lum)).toFixed(0) });
  check('switch: camera and zoom identical in every frame; one animation loop', fr.every(f => f.cx === cam.cx && f.cy === cam.cy && f.z === cam.z) && fr.every(f => f.loop <= 1), { bad: fr.filter(f => f.cx !== cam.cx || f.cy !== cam.cy).length });
  const dts = fr.map(f => f.dt).slice(2); rep.firstSwitch = { n: dts.length, p95: +pct(dts, 0.95).toFixed(1), max: +Math.max(...dts).toFixed(1), fadeFrames: fr.filter(f => f.fade).length };
  check('switch: smooth (frame p95 <= 50 ms, worst <= 250 ms, headless software rendering)', rep.firstSwitch.p95 <= 50 && rep.firstSwitch.max <= 250, rep.firstSwitch);
  if (SHOTS) await shot('40-triptych-future.png');
  // ---------------------------------------------------------------- FUTURE -> PAST -> FUTURE -> CURRENT: three independent worlds, each frozen while away
  const curFrozen = await fp('current'); await wait(2500);
  check('state: the Current left behind is frozen while the Future runs', (await fp('current')) === curFrozen && (await ev('HFAPI.HS.t')) > 0, null);
  await click('past'); await idle(); const futAt = await fp('future'); await wait(2500);   // the leaving world lives on through its fade-out, then freezes
  check('state: Future -> Past works; the Future is now frozen exactly where it was left', (await ev('HFAPI.HWD.shown')) === 'past' && (await fp('future')) === futAt && (await fp('current')) === curFrozen, null);
  if (SHOTS) await shot('40-triptych-past.png');
  await click('future'); await idle(); await wait(400);
  check('state: back in the Future, it resumes from its own state (not rebuilt), and runs on', (await ev('HFAPI.HWD.shown')) === 'future' && (await ev(`HFAPI.HWD.worlds.future.built`)) === true && (await fp('future')) !== futAt, null);
  await click('current'); await idle(); await wait(400);
  check('state: and to the Current, which resumes exactly where it was left before all this', (await ev('HFAPI.HWD.shown')) === 'current' && (await ev(`hwWith('past', () => HF.era) + hwWith('future', () => HF.era) + HF.era`)) === 'pastfuturecurrent', null);
  const S1 = await snap();
  check('resources: four switches added no listener, no timer, no AudioContext; music the same context and playing', JSON.stringify(S1) === JSON.stringify(S0) && (await ev('HFAPI.MW.AU.ctx === window.__ctx0 && HFAPI.MW.AU.playing')), { S0, S1 });
  // ---------------------------------------------------------------- rapid clicks across three tabs
  const seq = ['future', 'past', 'current', 'future', 'past', 'future', 'current', 'past', 'past', 'future', 'current', 'future', 'past', 'current', 'future'];
  await ev(SAMPLER); const c0 = await ev('HFAPI.TR.count');
  for (const e of seq) { await click(e); await wait(20 + (e.length * 9) % 50); }
  await idle(); await wait(400); await ev('window.__stop = true; 1'); await wait(100);
  const fr2 = await j('__fr'), R = await j(`({ shown: HFAPI.HWD.shown, era: HFAPI.HF.era, cur: HFAPI.HWD.cur, want: HFAPI.TR.want, busy: HFAPI.TR.busy, fades: HFAPI.TR.count, pressed: [...document.querySelectorAll('#eras [data-tl]')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.tl), errs: HFAPI.HFG.errs })`);
  check('rapid: 15 clicks across three tabs end on the last request (FUTURE), idle, one world installed, chrome agrees', R.shown === 'future' && R.era === 'future' && R.cur === 'future' && R.want === null && !R.busy && R.pressed.join() === 'future' && R.errs.length === 0, R);
  check('rapid: requests collapse (a handful of fades, not 15); camera never moved; never blank; one loop', R.fades - c0 <= 6 && fr2.every(f => f.cx === cam.cx && f.cy === cam.cy) && fr2.every(f => f.lum > 25 && !f.load) && fr2.every(f => f.loop <= 1), { fades: R.fades - c0, n: fr2.length });
  check('rapid: still no listener / timer / AudioContext added', JSON.stringify(await snap()) === JSON.stringify(S0), await snap());
  // ---------------------------------------------------------------- the Future renders: machines, drones, signals, searchlights, a blackout, the parts bin
  await ev(`(() => { const S = HFAPI.HS; HFAPI.set('time', 'night'); S.hour = 22; })(); 1`); await wait(3000);
  const V = await j(`(() => { const D = []; const cull = () => false; let bots = 0, drawnBots = 0; for (const z of HFAPI.HS.zombies) { if (z.L.ev !== 'bot') continue; bots++; const n = D.length; botDraw(D, z, 1, cull); if (D.length > n) drawnBots++; }
    futFault(HFAPI.HS.Fp.civ === 0 ? 1 : 0, 'test'); futAddDrone('cargo', HFAPI.HR.cx, HFAPI.HR.cy, { ex: 10, ey: 10, alt: 30 }); HFAPI.HS.sig.push({ x: 400, y: 400, z: 10, t: HFAPI.HS.t, r: 200, tx: 420, ty: 420 });
    return { bots, drawnBots, sprites: _fbs.size, types: [...new Set(HFAPI.HS.zombies.filter(z => z.L.ev === 'bot').map(z => z.L.t))].length }; })()`);
  await wait(1500);
  const V2 = await j(`({ drawn: HFAPI.HR.drawn, dyn: HFAPI.HR.dyn.length, dark: HFAPI.HS.Fp.sec.filter(s => !s.on).length, drones: HFAPI.HS.fdrones.length, errs: HFAPI.HFG.errs, ft: +(HFAPI.HR.ft.reduce((a, b) => a + b, 0) / HFAPI.HR.ft.length).toFixed(1) })`);
  check('render: every machine produces a sprite (baked box models, mirrored facings), many types on the map', V.bots > 20 && V.drawnBots === V.bots && V.sprites > 20 && V.types >= 8, V);
  check('render: at night the light pass carries searchlights, drone lights and signals; a blackout darkens a sector; no render error', V2.dyn >= 10 && V2.dark >= 1 && V2.drones >= 1 && V2.errs.length === 0, V2);
  if (SHOTS) { await ev("document.body.classList.add('clean'); 1"); await shot('41-future-night.png'); }
  check('page errors: none', errors.length === 0, errors);
});

// ---------------------------------------------------------------- the gallery: enter Holdfast, pick the Future, go back to the gallery, come back: same frame, still the Future
await withChrome(1366, 768, async ({ base, send, ev, on }) => {
  let navs = 0; on(d => { if (d.method === 'Runtime.exceptionThrown') errors.push('gallery: ' + JSON.stringify(d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description).slice(0, 240)); if (d.method === 'Page.frameNavigated') navs++; });
  const H = 'document.getElementById("hfFrame").contentWindow', j = async e => JSON.parse(await ev(`JSON.stringify(${e})`));
  await send('Page.navigate', { url: base + 'index.html' }); await until(ev, '!!(typeof MENU !== "undefined" && MENU.built)', 60, 500);
  await ev('document.querySelector(\'.mcard[data-world="holdfast"]\').click(); 0'); await until(ev, `!!(document.getElementById("hfFrame") && ${H}.HFAPI && ${H}.HFAPI.HFG.booted)`, 240, 500); await wait(1200);
  await ev(`window.__fr1 = document.getElementById("hfFrame"); window.__loads = 0; window.__fr1.addEventListener('load', () => window.__loads++); ${H}.__mark = 7; 0`); const n0 = navs;
  await ev(`${H}.document.querySelector('#eras [data-tl="future"]').click(); 0`); await until(ev, `${H}.HFAPI.HWD.shown === 'future' && !${H}.HFAPI.TR.busy`, 300, 200);
  await ev(`${H}.HFAPI.exit(); 0`); await wait(800); await ev('document.querySelector(\'.mcard[data-world="holdfast"]\').click(); 0'); await wait(1600);
  const G = await j(`({ same: document.getElementById("hfFrame") === window.__fr1, loads: window.__loads, mark: ${H}.__mark === 7, shown: ${H}.HFAPI.HWD.shown, awake: !${H}.HFAPI.HFG.asleep, frames: document.querySelectorAll('iframe').length, errs: ${H}.HFAPI.HFG.errs })`);
  check('gallery: Holdfast -> Future -> gallery -> back: the same frame, never reloaded, still the Future, awake', G.same && G.loads === 0 && G.mark && G.shown === 'future' && G.awake && G.frames === 1 && navs === n0 && G.errs.length === 0, Object.assign({ navs: navs - n0 }, G));
  check('gallery: no page errors', errors.length === 0, errors);
});
console.log(JSON.stringify({ firstSwitch: rep.firstSwitch }));
console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'PASS (' + Object.keys(rep).filter(k => rep[k].ok !== undefined).length + ' checks)');
process.exit(fails.length ? 1 : 0);
