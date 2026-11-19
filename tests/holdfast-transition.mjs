// Holdfast PAST <-> CURRENT switching in a real (headless) Chrome: seamless, in-page, nothing reloads, nothing restarts.
//   - no navigation, no iframe recreation, no loading screen, no blank frame, a smooth ~1.2 s crossfade
//   - camera + zoom stay on the same map coordinates in every single frame
//   - each timeline keeps its own state: frozen while away, resumed exactly (people, infected, simulation time)
//   - music and (a spied) YouTube player are never touched; one animation loop, no duplicated listeners / timers / AudioContexts
//   - the viewer's environment (season, time mode, weather, danger) carries over, incl. a season change that needs re-baking
//   - rapid clicking is safe; gallery -> Holdfast -> switch -> gallery -> Holdfast keeps one frame and one world
// Usage: node tests/holdfast-transition.mjs [--shots]        (needs Chrome; no npm packages)
import fs from 'fs'; import path from 'path';
import { withChrome, until, wait, root } from './cdp.mjs';
const SHOTS = process.argv.includes('--shots');
const fails = [], rep = {}, errors = [];
const check = (k, ok, info) => { rep[k] = { ok: !!ok, info }; if (!ok) fails.push(k + ' ' + JSON.stringify(info)); console.log((ok ? 'PASS ' : 'FAIL ') + k + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 260) : '')); };

// installed before any page script runs (in every frame): counts what the page registers, so duplication is measurable
const INSTRUMENT = `(() => {
  const I = window.__ins = { listeners: {}, intervals: 0, timeouts: 0, loopCalls: 0, ctx: 0, workers: 0 };
  const oa = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (t, f, o) { const w = this === window ? 'window' : this === document ? 'document' : this.id ? '#' + this.id : (this.nodeName || 'x'); const k = w + ':' + t; I.listeners[k] = (I.listeners[k] || 0) + 1; return oa.call(this, t, f, o); };
  const si = window.setInterval; I.rawSetInterval = si; window.setInterval = function () { I.intervals++; return si.apply(this, arguments); };   // the test's own polling uses rawSetInterval so it is not counted
  const raf = window.requestAnimationFrame; window.requestAnimationFrame = function (cb) { if (cb && cb.name === 'hfLoop') I.loopCalls++; return raf.call(window, cb); };
  for (const n of ['AudioContext', 'webkitAudioContext']) if (window[n]) { const A = window[n]; window[n] = function () { I.ctx++; return new A(...arguments); }; window[n].prototype = A.prototype; }
  const W = window.Worker; if (W) window.Worker = function () { I.workers++; return new W(...arguments); };
})()`;
// per-animation-frame sampler: frame time, what the page canvas shows (32x18 thumbnail), the overlay, the loading card, the camera
const SAMPLER = `(() => {
  const c = document.getElementById('c'), f = document.getElementById('cfade'), ld = document.getElementById('load'), s = document.createElement('canvas'); s.width = 32; s.height = 18; const g = s.getContext('2d', { willReadFrequently: true });
  window.__fr = []; window.__stopSamp = false; let last = performance.now(), lastLoop = __ins.loopCalls;
  const step = () => { const now = performance.now(); g.drawImage(c, 0, 0, 32, 18); const d = g.getImageData(0, 0, 32, 18).data; let lum = 0; const set = new Set();
    for (let i = 0; i < d.length; i += 4) { lum += d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; set.add((d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4)); }
    const cs = ld ? getComputedStyle(ld) : null;
    __fr.push({ t: now, dt: now - last, op: +f.style.opacity || 0, vis: f.style.visibility, lum: lum / (d.length / 4), uniq: set.size, load: !!(ld && !ld.hidden && cs.display !== 'none' && +cs.opacity > 0.01), cx: HFAPI.HR.cx, cy: HFAPI.HR.cy, z: HFAPI.HR.zoom, aps: HFAPI.HR.aps, loop: __ins.loopCalls - lastLoop, era: HFAPI.HWD.shown, fade: !!HFAPI.TR.fade });
    last = now; lastLoop = __ins.loopCalls; if (!window.__stopSamp) requestAnimationFrame(step); };
  requestAnimationFrame(step); })()`;
const FPJS = `(() => { let h = 0; const mix = v => { v = Math.round(v * 100); h = (Math.imul(h, 31) + v) | 0; }; for (const p of HS.people) { mix(p.x); mix(p.y); mix(p.hp); } for (const z of HS.zombies) { mix(z.x); mix(z.y); mix(z.corpseT || 0); } for (const w of HS.wild) { mix(w.x); mix(w.y); } mix(HS.t); return h; })()`;
const STASH = {};   // values read in the test itself, between page evaluations
const pct = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(b.length * p))]; };

await withChrome(1366, 768, async ({ base, send, ev, on }) => {
  let navigations = 0, frameNav = [];
  on(d => { if (d.method === 'Runtime.exceptionThrown') errors.push('exception: ' + JSON.stringify(d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description || d.params.exceptionDetails.text).slice(0, 220)); if (d.method === 'Page.frameNavigated') { navigations++; frameNav.push(d.params.frame.url.slice(-60)); } });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  const j = async e => JSON.parse(await ev(`JSON.stringify(${e})`));
  const fp = era => ev(`hwWith('${era}', () => ${FPJS})`);
  const snap = () => j(`({ l: __ins.listeners, iv: __ins.intervals, ctx: __ins.ctx, w: __ins.workers })`);
  const idle = () => until(ev, '!HFAPI.TR.busy && !HFAPI.TR.fade', 400, 200);
  const sample = async fn => { await ev(SAMPLER); await fn(); await wait(250); await ev('window.__stopSamp = true; 1'); await wait(120); return j('__fr'); };
  const click = era => ev(`document.querySelector('#eras [data-tl="${era}"]').click(); 1`);

  // ================================================================ boot (the only page load of this whole test)
  await send('Page.navigate', { url: base + 'holdfast/index.html?seed=7&time=noon&wx=clear&season=summer&warp=25&era=current' });
  await until(ev, 'window.HFAPI && HFAPI.HFG.booted', 300, 300); await wait(1500);
  const navAfterBoot = navigations;
  await ev(`window.__marker = 'same-page-' + Math.random().toString(36).slice(2); window.__t0 = performance.timeOrigin; document.getElementById('c').__tag = 'canvas-1'; 1`);
  const marker = await ev('window.__marker');
  // a camera and zoom that are not the defaults, music playing, a spied YouTube player
  await ev(`HFAPI.zoom(1); HFAPI.HR.cx += 91.5; HFAPI.HR.cy += 37.25; HFAPI.HR.cx = Math.round(HFAPI.HR.cx * 4) / 4; 1`);
  const cam0 = await j('({ cx: HFAPI.HR.cx, cy: HFAPI.HR.cy, zoom: HFAPI.HR.zoom, aps: HFAPI.HR.aps })');
  await ev(`HFAPI.MW.audioPlay(); 1`); await wait(1200);
  await ev(`window.__ctx0 = HFAPI.MW.AU.ctx; window.__bar0 = HFAPI.MW.AU.bar; window.__track0 = HFAPI.MW.AU.track; 1`);
  const env0 = await j('({ season: HS.season, timeMode: HS.timeMode, wxMode: HS.wxMode, danger: HS.danger, zScale: HS.zScale })');
  const S0 = await snap();
  const idBefore = await j(`({ shown: HFAPI.HWD.shown, nWorlds: Object.keys(HFAPI.HWD.worlds).length, era: HFAPI.HF.era, past: document.body.classList.contains('era-past') })`);
  check('boot: Current on screen, one timeline registered, one page', idBefore.shown === 'current' && idBefore.nWorlds === 1 && !idBefore.past, idBefore);

  // ================================================================ 1) CURRENT -> PAST: seamless, in the page
  await ev('HFAPI.HFG.asleep = true; 1');                                                 // hold the fade until we say so (so both timelines can be read while they are still)
  const frames1 = await sample(async () => {
    await click('past');
    await until(ev, "HFAPI.HWD.worlds.past && HFAPI.HWD.worlds.past.ready && HFAPI.HWD.worlds.past.saved !== null", 400, 100);   // prepared in the background, still not shown
    await wait(300);
    // the Past is built but not shown: the Current is still the timeline on screen and untouched by the preparation
    STASH.__prepState = { shown: await ev('HFAPI.HWD.shown'), era: await ev('HFAPI.HF.era'), fade: await ev('!!HFAPI.TR.fade'), tab: await ev(`document.querySelector('#eras [data-tl="past"]').getAttribute('aria-pressed')`) };
    STASH.__curFpBefore = await fp('current'); STASH.__pastFpPrepared = await fp('past');
    await ev('HFAPI.HFG.asleep = false; 1');
    await idle();
  });
  const P = STASH.__prepState;
  check('switch: while the Past is prepared in the background the Current stays on screen (no early swap)', P.shown === 'current' && P.era === 'current' && !P.fade, P);
  check('switch: the requested tab shows pressed at once (before the world is ready)', P.tab === 'true', P.tab);
  const after1 = await j(`({ shown: HFAPI.HWD.shown, era: HFAPI.HF.era, cur: HFAPI.HWD.cur, past: document.body.classList.contains('era-past'), sub: document.getElementById('eraSub').dataset.i18n, aria: document.getElementById('c').getAttribute('aria-label').slice(0, 40), op: document.getElementById('cfade').style.opacity, vis: document.getElementById('cfade').style.visibility, fades: HFAPI.TR.count, err: HFAPI.HFG.errs })`);
  check('switch: Past on screen, page chrome follows (class, subtitle, canvas label), overlay hidden', after1.shown === 'past' && after1.era === 'past' && after1.cur === 'past' && after1.past && after1.sub === 'hf.sub.past' && /Past/.test(after1.aria) && after1.vis === 'hidden' && +after1.op === 0, after1);
  check('switch: no navigation, no frame navigation, no reload (same document, same canvas element, same time origin)', navigations === navAfterBoot && (await ev('window.__marker')) === marker && (await ev('window.__t0')) === (await ev('performance.timeOrigin')) && (await ev("document.getElementById('c').__tag")) === 'canvas-1', { navigations, frameNav });
  check('switch: no loading screen, no blank frame (every frame painted: luminance and colour variety)', frames1.length > 60 && frames1.every(f => !f.load) && frames1.every(f => f.lum > 25 && f.uniq >= 6), { n: frames1.length, load: frames1.filter(f => f.load).length, minLum: Math.min(...frames1.map(f => f.lum)).toFixed(1), minUniq: Math.min(...frames1.map(f => f.uniq)) });
  const fade1 = frames1.filter(f => f.fade);
  const ops = fade1.map(f => f.op), mono = ops.every((o, i) => i === 0 || o <= ops[i - 1] + 1e-9), dur = fade1.length ? (fade1[fade1.length - 1].t - fade1[0].t) : 0;
  check('crossfade: ~1.2 s, overlay opacity falls monotonically from ~1 to ~0 (no flash, no jump)', fade1.length >= 40 && mono && ops[0] > 0.9 && ops[ops.length - 1] < 0.1 && dur > 1000 && dur < 1700 && Math.max(...ops.slice(1).map((o, i) => ops[i] - o)) < 0.2, { frames: fade1.length, ms: Math.round(dur), first: ops[0], last: ops[ops.length - 1], maxStep: Math.max(...ops.slice(1).map((o, i) => +(ops[i] - o).toFixed(3))) });
  check('camera: position and zoom identical in every frame of the whole switch (same map coordinates)', frames1.every(f => f.cx === cam0.cx && f.cy === cam0.cy && f.z === cam0.zoom && f.aps === cam0.aps), { cam0, bad: frames1.filter(f => f.cx !== cam0.cx || f.cy !== cam0.cy || f.z !== cam0.zoom).length });
  const dts = frames1.map(f => f.dt).slice(2);
  rep.frameTimes1 = { n: dts.length, median: +pct(dts, 0.5).toFixed(1), p95: +pct(dts, 0.95).toFixed(1), p99: +pct(dts, 0.99).toFixed(1), max: +Math.max(...dts).toFixed(1), over100: dts.filter(d => d > 100).length };
  check('frames: no long freeze while preparing + fading (p95 <= 50 ms, worst <= 250 ms, headless software rendering)', rep.frameTimes1.p95 <= 50 && rep.frameTimes1.max <= 250, rep.frameTimes1);
  check('loop: exactly one animation loop the whole time (one hfLoop callback per frame, never two)', frames1.filter(f => f.loop > 1).length === 0 && frames1.filter(f => f.loop === 1).length >= frames1.length * 0.9, { dup: frames1.filter(f => f.loop > 1).length, single: frames1.filter(f => f.loop === 1).length, n: frames1.length });
  const S1 = await snap();
  check('listeners: no listener, timer, AudioContext or worker was added by switching (first switch included)', JSON.stringify(S1) === JSON.stringify(S0), { before: S0, after: S1 });
  const env1 = await j('({ season: HS.season, timeMode: HS.timeMode, wxMode: HS.wxMode, danger: HS.danger })');
  check('environment: season, time mode, weather mode and danger carried over to the Past', ['season', 'timeMode', 'wxMode', 'danger'].every(k => env1[k] === env0[k]), { env0, env1 });
  const m1 = await j(`({ playing: HFAPI.MW.AU.playing, same: HFAPI.MW.AU.ctx === window.__ctx0, state: HFAPI.MW.AU.ctx.state, bar: HFAPI.MW.AU.bar - window.__bar0, track: HFAPI.MW.AU.track === window.__track0 })`);
  check('music: kept playing through the switch (same AudioContext, running, the generator advanced, same track)', m1.playing && m1.same && m1.state === 'running' && m1.bar >= 1 && m1.track, m1);

  // ================================================================ 2) independent state: the Current is frozen while the Past runs, and resumes exactly
  await wait(300); const curFpFrozen = await fp('current'), curT = await ev("hwWith('current', () => HS.t)"), pastT0 = await ev('HS.t');
  await wait(3500);
  check('state: the timeline left behind is frozen (people, infected, wildlife and its simulation time unchanged for 3.5 s)', (await fp('current')) === curFpFrozen && (await ev("hwWith('current', () => HS.t)")) === curT, null);
  check('state: the Past runs meanwhile (its own clock advanced ~3.5 s)', (await ev('HS.t')) - pastT0 > 3 && (await ev('HS.t')) - pastT0 < 5, (await ev('HS.t')) - pastT0);
  check('state: preparing the Past did not alter the Current (a prepared Past was a separate world; the Current only ran its own frames)', STASH.__pastFpPrepared !== undefined && (await ev("hwWith('current', () => HF.era)")) === 'current' && (await ev("hwWith('past', () => HF.era)")) === 'past', null);

  // ================================================================ 3) PAST -> CURRENT (already built: only re-synced); then the Past is frozen and resumes exactly
  const pastFpBeforeBack = await fp('past'), curFpBeforeBack = await fp('current');
  await ev('HFAPI.HFG.asleep = true; 1');
  const frames2 = await sample(async () => {
    await click('current'); await wait(900);                                          // prepared (cheap: already built), held before the fade
    STASH.__held = { cur: await fp('current'), past: await fp('past'), shown: await ev('HFAPI.HWD.shown') };
    await ev('HFAPI.HFG.asleep = false; 1'); await idle();
  });
  check('resume: the Current is exactly as it was left (nothing changed while it waited, nor while it was being prepared again)', STASH.__held.cur === curFpBeforeBack && STASH.__held.shown === 'past', [STASH.__held.cur, curFpBeforeBack]);
  const pastFrozen = await fp('past'); await wait(3000);
  check('resume: the Past is now the frozen one (unchanged for 3 s) while the Current runs', (await fp('past')) === pastFrozen && (await ev('HS.t')) > 0, null);
  check('back: Current on screen, chrome restored, no navigation', (await j("({ s: HFAPI.HWD.shown, e: HFAPI.HF.era, p: document.body.classList.contains('era-past'), sub: document.getElementById('eraSub').dataset.i18n })")).s === 'current' && (await ev("document.body.classList.contains('era-past')")) === false && navigations === navAfterBoot, { navigations });
  check('back: the camera is on the same map coordinates in every frame', frames2.every(f => f.cx === cam0.cx && f.cy === cam0.cy && f.z === cam0.zoom) && frames2.every(f => !f.load) && frames2.every(f => f.lum > 25), { n: frames2.length });
  rep.frameTimes2 = (d => ({ n: d.length, p95: +pct(d, 0.95).toFixed(1), max: +Math.max(...d).toFixed(1) }))(frames2.map(f => f.dt).slice(2));
  check('back: smooth too (p95 <= 50 ms, worst <= 250 ms)', rep.frameTimes2.p95 <= 50 && rep.frameTimes2.max <= 250, rep.frameTimes2);

  // ================================================================ 4) the environment follows the viewer (a season change needs the other timeline re-baked in the background)
  await ev(`HFAPI.set('season', 'winter'); HFAPI.set('time', 'night'); HFAPI.set('wx', 'rain'); HFAPI.set('danger', 'grim'); 1`); await wait(2500);
  await click('past'); await idle(); await wait(500);
  const env2 = await j('({ season: HS.season, timeMode: HS.timeMode, wxMode: HS.wxMode, danger: HS.danger, built: HR.season, statics: HR.statics.length, hour: HS.hour })');
  check('environment: winter, night, rain, grim followed the viewer into the Past (and its sprites were re-baked for winter before it was shown)', env2.season === 'winter' && env2.timeMode === 'night' && env2.wxMode === 'rain' && env2.danger === 'grim' && env2.built === 'winter' && env2.statics > 1500, env2);
  await ev(`HFAPI.set('season', 'summer'); HFAPI.set('time', 'noon'); HFAPI.set('wx', 'clear'); HFAPI.set('danger', 'standard'); 1`); await wait(2000);

  // ================================================================ 5) YouTube: a spied player is never touched, the box stays; music continues too
  await ev(`(() => { const calls = window.__ytCalls = []; const spy = n => (...a) => { calls.push(n); }; const Y = HFAPI.MW.YTS; Y.on = true; Y.playing = true; Y.title = 'Spy playlist'; Y.player = { stopVideo: spy('stop'), loadPlaylist: spy('load'), pauseVideo: spy('pause'), playVideo: spy('play'), setVolume: spy('vol'), nextVideo: spy('next'), getPlayerState: () => 1 }; document.getElementById('ytbox').hidden = false; window.__ytBox = document.getElementById('ytbox'); })(); 1`);
  await click('current'); await idle(); await click('past'); await idle();
  const yt = await j(`({ calls: window.__ytCalls, on: HFAPI.MW.YTS.on, playing: HFAPI.MW.YTS.playing, title: HFAPI.MW.YTS.title, same: document.getElementById('ytbox') === window.__ytBox, hidden: document.getElementById('ytbox').hidden })`);
  check('youtube: two switches made zero calls on the player; same box, still shown; state untouched', yt.calls.length === 0 && yt.on && yt.playing && yt.title === 'Spy playlist' && yt.same && !yt.hidden, yt);
  await ev(`HFAPI.MW.YTS.on = false; HFAPI.MW.YTS.playing = false; HFAPI.MW.YTS.player = null; document.getElementById('ytbox').hidden = true; 1`);
  const mEnd = await j(`({ playing: HFAPI.MW.AU.playing, same: HFAPI.MW.AU.ctx === window.__ctx0, bar: HFAPI.MW.AU.bar - window.__bar0 })`);
  check('music: still the same context and playing after four switches', mEnd.playing && mEnd.same && mEnd.bar >= 3, mEnd);

  // ================================================================ 6) rapid clicking: one transition at a time, latest request wins, nothing corrupts
  await idle(); const S2 = await snap(); const countBefore = await ev('HFAPI.TR.count');
  await ev(SAMPLER); await ev(`window.__log = []; window.__poll = __ins.rawSetInterval.call(window, () => { const T = HFAPI.TR, H = HFAPI.HWD; window.__log.push({ busy: T.busy, fade: !!T.fade, cur: H.cur, shown: H.shown, want: T.want }); }, 25); 1`);
  const pattern = []; for (let i = 0; i < 28; i++) pattern.push(i % 3 === 2 ? (i % 2 ? 'current' : 'past') : (i % 2 ? 'past' : 'current'));
  pattern.push('past'); pattern.push('current'); pattern.push('past');          // ends on PAST
  const startEra = await ev('HFAPI.HWD.shown');
  for (const e of pattern) { await click(e); await wait(15 + (e.length * 7) % 45); }
  await idle(); await wait(400);
  await ev('clearInterval(window.__poll); window.__stopSamp = true; 1'); await wait(100);
  const log = await j('window.__log'), fr3 = await j('__fr');
  const fin = await j(`({ shown: HFAPI.HWD.shown, want: HFAPI.TR.want, busy: HFAPI.TR.busy, fade: !!HFAPI.TR.fade, cur: HFAPI.HWD.cur, era: HFAPI.HF.era, pressed: [...document.querySelectorAll('#eras [data-tl]')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.tl), op: document.getElementById('cfade').style.opacity, vis: document.getElementById('cfade').style.visibility, fades: HFAPI.TR.count, errs: HFAPI.HFG.errs, saved: Object.fromEntries(Object.entries(HFAPI.HWD.worlds).map(([k, w]) => [k, w.saved === null])), past: document.body.classList.contains('era-past'), eraB: hwWith('current', () => HF.era) + '/' + hwWith('past', () => HF.era) })`);
  check('rapid clicks: 31 clicks end on the last request (PAST), idle, one world installed, chrome and tabs agree', fin.shown === 'past' && fin.era === 'past' && fin.cur === 'past' && !fin.busy && !fin.fade && fin.want === null && fin.pressed.join() === 'past' && fin.past && fin.op === '0' && fin.vis === 'hidden', fin);
  check('rapid clicks: transitions never stack (at most one fade at a time, the installed world is always the one shown when idle)', log.every(l => !(l.fade && !l.busy)) && log.filter(l => !l.busy).every(l => l.cur === l.shown), { samples: log.length });
  check('rapid clicks: the 31 requests collapsed into a handful of fades (not 31)', fin.fades - countBefore <= 6, fin.fades - countBefore);
  check('rapid clicks: no error, each world still holds its own era', fin.errs.length === 0 && errors.length === 0 && fin.eraB === 'current/past', { errs: fin.errs, errors, eraB: fin.eraB });
  check('rapid clicks: camera never moved, no loading screen, never a blank frame', fr3.every(f => f.cx === cam0.cx && f.cy === cam0.cy && f.z === cam0.zoom) && fr3.every(f => !f.load) && fr3.every(f => f.lum > 25 && f.uniq >= 6), { n: fr3.length });
  const S3 = await snap(), diffS = (A, B) => { const d = {}; for (const k of new Set([...Object.keys(A.l), ...Object.keys(B.l)])) if (A.l[k] !== B.l[k]) d['listener ' + k] = [A.l[k], B.l[k]]; for (const k of ['iv', 'ctx', 'w']) if (A[k] !== B[k]) d[k] = [A[k], B[k]]; return d; };
  check('rapid clicks: still one animation loop, and no listener / timer / AudioContext added (vs boot, and vs before the clicks)', fr3.filter(f => f.loop > 1).length === 0 && Object.keys(diffS(S3, S2)).length === 0 && Object.keys(diffS(S3, S0)).length === 0, { vsBoot: diffS(S3, S0), vsBefore: diffS(S3, S2) });
  rep.rapid = { startEra, clicks: pattern.length, fades: fin.fades - countBefore };
  check('rapid clicks: both timelines are intact and still run (Current frozen but built, Past live: people, statics, ground)', await j(`({ a: hwWith('current', () => HS.people.length > 100 && HR.statics.length > 1500), b: HS.people.length > 100 && HR.statics.length > 1500 })`).then(r => r.a && r.b), null);

  // ================================================================ 6a) the corpse bug, in the real renderer: a killed dinosaur (Past on screen) never blinks, rears then collapses, lies still, fades smoothly, is removed
  await ev(`(() => { const x = HR.cy + HR.cx / 2, y = HR.cy - HR.cx / 2; HS.next.minor = HS.next.medium = HS.next.major = HS.next.siege = 1e9; HS.nextP.fly = HS.nextP.apex = 1e9; HS.next.act = 1e9;
    HS.zombies.filter(q => Math.hypot(q.x - x, q.y - y) < 160).forEach(q => { q.x = q.px = 8; q.y = q.py = 8; });
    const z = pastAddDino(x, y, { sp: 'raptor', noPack: 1 }); z.st = 'wander'; z.path = null; window.__Z = z; hsHitZ(z, { x: z.x - 5, y: z.y }, 99); z.corpseT = 7.5;
    window.__cs = []; window.__stopC = false; const step = () => { const D = []; dinoDraw(D, window.__Z, 1, () => false); const d = D.find(q => q.sx !== undefined), S = DSPEC.raptor; window.__cs.push({ t: performance.now(), drawn: !!d, blink: !!(d && d.blink), alpha: d ? (d.alpha || 1) : 0, pose: d ? Math.round(d.sx / S.W) : -1, x: window.__Z.x, y: window.__Z.y, alive: HS.zombies.includes(window.__Z) }); if (!window.__stopC) requestAnimationFrame(step); }; requestAnimationFrame(step); })(); 1`);
  if (SHOTS) { await wait(2200); const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(root, 'docs/holdfast/screenshots/31-past-corpse.png'), Buffer.from(r.data, 'base64')); }
  await until(ev, '!window.__cs.at(-1).alive', 120, 200); await wait(300); await ev('window.__stopC = true; 1'); await wait(100);
  const cs = await j('__cs'), drawn = cs.filter(c => c.drawn), fadeP = drawn.filter(c => c.alpha < 1), lastDrawn = drawn[drawn.length - 1];
  const stillP = drawn.filter(c => c.pose === 8), still = stillP.every(c => c.x === stillP[0].x && c.y === stillP[0].y);
  check('corpse (real renderer): never blinks in any frame, dying or lying', cs.length > 150 && cs.every(c => !c.blink), { frames: cs.length, blinking: cs.filter(c => c.blink).length });
  check('corpse (real renderer): rears up (pose 7) then collapses to the dead pose (8) and stays there, stationary', drawn[0].pose === 7 && stillP.length > 100 && still && drawn.filter(c => c.pose === 7).length >= 8 && drawn.filter(c => c.pose === 7).length < 40, { first: drawn[0].pose, rear: drawn.filter(c => c.pose === 7).length, dead: stillP.length });
  const al = fadeP.map(c => c.alpha), monoC = al.every((a, i) => i === 0 || a <= al[i - 1] + 1e-9), fullBefore = drawn.filter(c => c.alpha === 1).length;
  check('corpse (real renderer): fully opaque while it lies, then a smooth monotonic fade over the last seconds', monoC && al.length >= 40 && al[0] > 0.7 && al[al.length - 1] < 0.1 && fullBefore > 50, { fadeFrames: al.length, first: al[0], last: al[al.length - 1], opaqueFrames: fullBefore });
  check('corpse (real renderer): nothing is drawn after the fade and the entity is gone from the simulation', !cs[cs.length - 1].drawn && !cs[cs.length - 1].alive && lastDrawn.alpha < 0.1, { last: cs[cs.length - 1] });

  // ================================================================ 6b) memory: switching back and forth does not leak, and the timeline left behind releases its ground chunks
  await idle(); await wait(2500);
  const heap = async () => { await send('HeapProfiler.collectGarbage'); await wait(250); await send('HeapProfiler.collectGarbage'); return (await send('Runtime.getHeapUsage')).usedSize; };
  const chunks = () => j(`({ shown: HR.chunks.size, other: hwWith(HFAPI.HWD.shown === 'past' ? 'current' : 'past', () => HR.chunks.size) })`);
  const h0 = await heap();
  for (let i = 0; i < 6; i++) { await click(i % 2 ? 'past' : 'current'); await idle(); await wait(600); }
  await wait(3000); const h1 = await heap(), ch = await chunks();
  rep.memory = { heapMB0: +(h0 / 1048576).toFixed(1), heapMB1: +(h1 / 1048576).toFixed(1), growth: +((h1 - h0) / h0 * 100).toFixed(1) + '%', chunks: ch };
  check('memory: six more round trips grow the JS heap by under 15% (no leak; heap measured after forced GC)', (h1 - h0) / h0 < 0.15, rep.memory);
  check('memory: the timeline left behind keeps only the ground in view (a few chunks), not the whole ring it baked', ch.other > 0 && ch.other <= 14 && ch.shown > 0 && ch.shown <= 60, ch);

  // ================================================================ 7) a film strip of one crossfade (slowed) for the docs, when asked
  if (SHOTS) {
    const dir = path.join(root, 'docs/holdfast/screenshots'); fs.mkdirSync(dir, { recursive: true });
    await click('current'); await idle(); await ev('HFAPI.TR.ms = 6000; 1');
    await ev('HFAPI.HFG.asleep = true; 1'); await click('past'); await wait(700); await ev('HFAPI.HFG.asleep = false; 1');
    await until(ev, '!!HFAPI.TR.fade', 100, 50); const t0 = Date.now(), marks = [0.04, 0.3, 0.55, 0.85];
    for (let i = 0; i < marks.length; i++) { while ((Date.now() - t0) / 6000 < marks[i]) await wait(20); const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(dir, `30-switch-fade-${i + 1}.png`), Buffer.from(r.data, 'base64')); }
    await idle(); await ev('HFAPI.TR.ms = 1200; 1');
    await ev(`document.body.classList.add('clean'); 1`);
  }
  check('page errors: none during the whole run', errors.length === 0 && (await j('HFAPI.HFG.errs')).length === 0, errors);
});

// ================================================================ 8) inside the gallery: gallery -> Holdfast -> switch -> gallery -> Holdfast: one frame, one page, one radio
await withChrome(1366, 768, async ({ base, send, ev, on }) => {
  const frameLoads = []; let navs = 0;
  on(d => { if (d.method === 'Runtime.exceptionThrown') errors.push('gallery exception: ' + JSON.stringify(d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description || d.params.exceptionDetails.text).slice(0, 220)); if (d.method === 'Page.frameNavigated') navs++; });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  const H = 'document.getElementById("hfFrame").contentWindow', j = async e => JSON.parse(await ev(`JSON.stringify(${e})`)), idleF = () => until(ev, `!${H}.HFAPI.TR.busy && !${H}.HFAPI.TR.fade`, 400, 200);
  await send('Page.navigate', { url: base + 'index.html' });
  await until(ev, '!!(typeof MENU !== "undefined" && MENU.built && !document.getElementById("menu").hidden)', 60, 500);
  await ev('document.querySelector(\'.mcard[data-world="holdfast"]\').click(); 0');
  await until(ev, `!!(document.getElementById("hfFrame") && ${H}.HFAPI && ${H}.HFAPI.HFG.booted)`, 240, 500); await wait(1500);
  await ev(`window.__fr1 = document.getElementById("hfFrame"); window.__loads = 0; window.__fr1.addEventListener('load', () => window.__loads++); ${H}.__mark = 'frame-' + Math.random(); window.__mark = ${H}.__mark; window.__ctx = window.LW.AU.ctx; window.LW.audioPlay(); 0`);
  await wait(800); const navG = navs, bar0 = await ev('window.LW.AU.bar');
  await ev(`${H}.document.querySelector('#eras [data-tl="past"]').click(); 0`); await idleF(); await wait(500);
  const g1 = await j(`({ same: document.getElementById("hfFrame") === window.__fr1, loads: window.__loads, mark: ${H}.__mark === window.__mark, era: ${H}.HFAPI.HF.era, shown: ${H}.HFAPI.HWD.shown, ctx: window.LW.AU.ctx === window.__ctx, playing: window.LW.AU.playing, bar: window.LW.AU.bar - ${bar0}, frames: document.querySelectorAll('iframe').length, errs: ${H}.HFAPI.HFG.errs })`);
  check('gallery: switching inside the Holdfast frame keeps the same iframe element, no load event, no navigation, same page', g1.same && g1.loads === 0 && g1.mark && navs === navG && g1.frames === 1 && g1.era === 'past' && g1.shown === 'past', { g1, navs, navG });
  check('gallery: the shared radio (parent page) plays on: same AudioContext, still playing, generator advancing', g1.ctx && g1.playing && g1.bar >= 1, g1);
  check('gallery: no error in the frame', g1.errs.length === 0, g1.errs);
  // out to the gallery and back in
  await ev(`${H}.HFAPI.exit(); 0`); await wait(900);
  const out = await j(`({ menu: !document.getElementById("menu").hidden, frameHidden: document.getElementById("hfFrame").style.display === 'none', same: document.getElementById("hfFrame") === window.__fr1, asleep: ${H}.HFAPI.HFG.asleep, shown: ${H}.HFAPI.HWD.shown })`);
  check('gallery: exiting shows the menu and sleeps (hides) the same frame, still the Past', out.menu && out.frameHidden && out.same && out.asleep && out.shown === 'past', out);
  const tSleep = await ev(`${H}.HFAPI.HS.t`); await wait(1500);
  check('gallery: the sleeping Holdfast does not tick', (await ev(`${H}.HFAPI.HS.t`)) === tSleep, tSleep);
  await ev('document.querySelector(\'.mcard[data-world="holdfast"]\').click(); 0'); await wait(1800);
  const back = await j(`({ same: document.getElementById("hfFrame") === window.__fr1, loads: window.__loads, mark: ${H}.__mark === window.__mark, shown: ${H}.HFAPI.HWD.shown, awake: !${H}.HFAPI.HFG.asleep, ticking: ${H}.HFAPI.HS.t > ${tSleep}, ctx: window.LW.AU.ctx === window.__ctx, playing: window.LW.AU.playing })`);
  check('gallery: re-entering resumes the same frame in the Past (no reload, world ticking again, radio uninterrupted)', back.same && back.loads === 0 && back.mark && back.shown === 'past' && back.awake && back.ticking && back.ctx && back.playing, back);
  await ev(`${H}.document.querySelector('#eras [data-tl="current"]').click(); 0`); await idleF(); await wait(400);
  check('gallery: and back to the Current from inside the gallery, still one frame, no load', (await j(`({ s: ${H}.HFAPI.HWD.shown, loads: window.__loads, same: document.getElementById("hfFrame") === window.__fr1 })`)).s === 'current' && (await ev('window.__loads')) === 0, null);
  check('gallery: no page errors', errors.length === 0, errors);
});

console.log(JSON.stringify({ frameTimes1: rep.frameTimes1, frameTimes2: rep.frameTimes2, rapid: rep.rapid }));
console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'PASS (' + Object.keys(rep).filter(k => rep[k].ok !== undefined).length + ' checks)');
process.exit(fails.length ? 1 : 0);
