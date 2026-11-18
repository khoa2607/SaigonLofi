// Headless-browser verification of the night events (Quốc khánh 2/9, Halloween, Giáng sinh).
// Usage: python -m http.server 8765 &   node tests/events.mjs [shotdir]
// Needs Playwright (`playwright`, or `playwright-core` + PW_CHROMIUM=<path to chrome.exe>).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const SHOTS = process.argv[2] || null, BASE = 'http://localhost:8765/index.html?clean=1&';
const b = await pw.chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const fails = [], rep = {};
const check = (name, ok, info) => { if (!ok) { const m = name + (info !== undefined ? ' ' + JSON.stringify(info) : ''); fails.push(m); console.log('  x ' + m.slice(0, 400)); } };
async function open(q, w = 1280, h = 800) {
  const pg = await b.newPage({ viewport: { width: w, height: h } }); pg.errs = [];
  pg.on('pageerror', e => pg.errs.push(String(e).slice(0, 300)));
  await pg.goto(BASE + q); await pg.waitForFunction(() => typeof SIM !== 'undefined' && SIM.lanes.length > 0 && !G.busy, null, { timeout: 120000 }); await pg.waitForTimeout(800); return pg;
}
const warm = (pg, sec) => pg.evaluate(s => { for (let i = 0; i < s * 20; i++) tick(0.05); draw(); }, sec);
const shot = async (pg, name) => { if (SHOTS) { await pg.waitForTimeout(700); await pg.screenshot({ path: `${SHOTS}/${name}.png` }); } };
const state = pg => pg.evaluate(() => ({
  cur: EV.cur, sel: EV.sel, tet: G.tet, items: G.world.items.length, evItems: G.world.items.length, crowd: EV.crowd.length, vis: EV.visible().length,
  peds: SIM.peds.length, popTarget: popTarget(), dens: trafficDensity(), vehs: SIM.vehs.length,
  dressed: SIM.peds.filter(p => p.look.ev).length + SIM.vehs.reduce((n, v) => n + v.riders.filter(r => r.look.ev).length, 0) + SIM.actors.filter(a => a.look.ev).length,
  parts: FW.parts.length, timeKey: G.timeKey, auto: G.autoTime
}));

// 1) every era: each event ON then OFF in the same page (no reload); decorations, crowds, people, traffic, clean removal
for (const era of [0, 1, 2, 3]) {
  const pg = await open(`era=${era}&time=night&wx=clear`); const r = {};
  await warm(pg, 30); const base = await state(pg); r.base = { items: base.items, peds: base.peds, vehs: base.vehs, popTarget: base.popTarget, dens: base.dens };
  for (const ev of ['qk', 'hw', 'xm']) {
    await pg.evaluate(e => setEvent(e), ev); await warm(pg, 2); await pg.waitForTimeout(1300); await warm(pg, 40);
    const on = await state(pg);
    Object.assign(on, await pg.evaluate(e => ({
      flags: e === 'qk' ? EV.fixed.qk.filter(f => f.k === 'flag').length + roofFlags(G.era).length + lmFlags(G.era).length : 0,
      tetFlags: TET.fixed.length + roofFlags(G.era).length, murals: walls(G.era).filter(w => w.kind === 'paint').length, leds: walls(G.era).filter(w => w.kind === 'led').length,
      bursts: EV.stats.bursts, trees: EV.fixed.xm.filter(f => f.k === 'xtree').length, jackO: CITY.recs.filter(r => r.ev === 'hw' && r.name === 'jackO').length,
      costumes: SIM.peds.filter(p => p.look.costume).length, santaHats: SIM.peds.filter(p => p.look.hat === 'santa').length, flagCarry: SIM.peds.filter(p => p.look.carry === 'flag').length,
      evRecsShown: G.world.items.length
    }), ev));
    if (SHOTS) { await pg.evaluate(() => { R.panX = -110; R.panY = -120; camera(); }); await shot(pg, `era${era}_${ev}`); }
    await pg.evaluate(() => setEvent('none')); await warm(pg, 2); await pg.waitForTimeout(1300); await warm(pg, 1);
    const off = await state(pg);
    r[ev] = { on, off };
    check(`era${era} ${ev} active`, on.cur === ev, on.cur);
    check(`era${era} ${ev} decorations added`, on.items > base.items && on.vis > 0, [base.items, on.items, on.vis]);
    check(`era${era} ${ev} crowd present`, on.crowd > 20, on.crowd);
    check(`era${era} ${ev} people dressed for it`, on.dressed > 10, on.dressed);
    check(`era${era} ${ev} more walkers`, on.popTarget >= base.popTarget * 1.55 && on.peds > base.peds * 1.3, [base.popTarget, on.popTarget, base.peds, on.peds]);
    if (ev === 'qk') {
      check(`era${era} qk double traffic`, Math.abs(on.dens / base.dens - 2) < 0.01 && on.vehs > base.vehs * 1.3, [base.dens, on.dens, base.vehs, on.vehs]);
      check(`era${era} qk more flags than Tet`, on.flags > on.tetFlags * 1.5, [on.tetFlags, on.flags]);
      check(`era${era} qk fireworks`, on.bursts > 15, on.bursts);
      check(`era${era} qk murals / LED`, era <= 1 ? on.murals >= 4 : on.leds >= (era === 3 ? 10 : 4), [on.murals, on.leds]);
      check(`era${era} qk people with flags`, on.flagCarry > 5, on.flagCarry);
    }
    if (ev === 'hw') { check(`era${era} hw costumes`, on.costumes > on.peds * (era === 0 ? 0.15 : 0.25), [on.costumes, on.peds]);   // fewer costumes in the 90s by design check(`era${era} hw pumpkins`, on.jackO > 40, on.jackO); }
    if (ev === 'xm') { check(`era${era} xm trees`, on.trees >= 3, on.trees); check(`era${era} xm santa hats`, on.santaHats > 5, on.santaHats); }
    check(`era${era} ${ev} everything gone when off`, off.cur === null && off.items === base.items && off.vis === 0 && off.crowd === 0 && off.dressed === 0 && off.parts === 0, off);
  }
  check(`era${era} no page errors`, pg.errs.length === 0, pg.errs);
  rep['era' + era] = r; await pg.close();
}

// 2) night-only: picking an event at noon jumps to night, the event lights up at dusk, pauses at dawn, comes back, and Off restores the clock
{
  const pg = await open('era=2&time=noon&wx=clear'); const r = {};
  await pg.evaluate(() => setEvent('qk')); r.afterPick = await state(pg);
  await warm(pg, 4); await pg.waitForTimeout(1300); await warm(pg, 1); r.night = await state(pg);
  await pg.evaluate(() => setTime('morning')); await warm(pg, 4); await pg.waitForTimeout(1300); await warm(pg, 1); r.morning = await state(pg);
  await pg.evaluate(() => setTime('night')); await warm(pg, 4); await pg.waitForTimeout(1300); await warm(pg, 1); r.again = await state(pg);
  await pg.evaluate(() => setEvent('none')); await warm(pg, 4); r.off = await state(pg);
  rep.nightOnly = r;
  check('night-only: picking at noon switches the clock to night', r.afterPick.timeKey === 'night' && !r.afterPick.auto && r.afterPick.cur === null, r.afterPick);
  check('night-only: active once dark', r.night.cur === 'qk', r.night);
  check('night-only: paused by day, still selected', r.morning.cur === null && r.morning.sel === 'qk' && r.morning.crowd === 0 && r.morning.vis === 0, r.morning);
  check('night-only: back at night', r.again.cur === 'qk', r.again);
  check('night-only: Off restores the previous time setting', r.off.sel === 'none' && r.off.timeKey === 'noon', r.off);
  check('night-only: no page errors', pg.errs.length === 0, pg.errs);
  await pg.close();
}

// 3) UI: buttons and keys switch events; Tết and the night events exclude each other
{
  const pg = await open('era=3&time=night&wx=clear'); const r = {};
  await pg.evaluate(() => { document.body.classList.remove('clean'); $('fade').style.display = 'none'; }); await pg.click('#more'); await pg.click('[data-ev="hw"]'); await warm(pg, 1); r.hw = await pg.evaluate(() => ({ sel: EV.sel, pressed: document.querySelector('[data-ev="hw"]').getAttribute('aria-pressed') }));
  await pg.waitForTimeout(1300); await pg.keyboard.press('x'); await warm(pg, 1); r.x = await pg.evaluate(() => EV.sel);
  await pg.waitForTimeout(1300); await pg.click('[data-ev="tet"]'); await warm(pg, 1); r.tet = await state(pg);
  await pg.waitForTimeout(1300); await pg.keyboard.press('q'); await warm(pg, 1); r.q = await state(pg);
  await pg.waitForTimeout(1300); await pg.keyboard.press('q'); await warm(pg, 1); r.qOff = await state(pg);
  rep.ui = r;
  check('ui: button selects Halloween', r.hw.sel === 'hw' && r.hw.pressed === 'true', r.hw);
  check('ui: X key selects Christmas', r.x === 'xm', r.x);
  check('ui: Tết button replaces the night event', r.tet.sel === 'tet' && r.tet.tet && r.tet.cur === null, r.tet);
  check('ui: Q key switches Tết off and 2/9 on', r.q.sel === 'qk' && !r.q.tet && r.q.cur === 'qk', r.q);
  check('ui: same key again turns it off', r.qOff.sel === 'none' && r.qOff.cur === null, r.qOff);
  check('ui: no page errors', pg.errs.length === 0, pg.errs);
  await pg.close();
}

// 4) rain + event, riverfront + event, sound, screenshots
const views = {
  qk_river_202x: 'ev=qk&era=3&wx=clear&look=14,60&zoom=1', qk_river_199x: 'ev=qk&era=0&wx=clear&look=14,40&zoom=1', qk_city_199x: 'ev=qk&era=0&wx=clear&look=60,64&zoom=1', qk_towers_202x: 'ev=qk&era=3&wx=clear&look=46,80',
  qk_rain: 'ev=qk&era=2&wx=rain&look=22,60&zoom=1', hw_street: 'ev=hw&era=2&wx=clear&look=60,64&zoom=2', hw_park: 'ev=hw&era=3&wx=clear&look=95,100&zoom=1', hw_rain: 'ev=hw&era=1&wx=rain&look=95,100&zoom=1',
  xm_park: 'ev=xm&era=3&wx=clear&look=95,100&zoom=1', xm_street_199x: 'ev=xm&era=0&wx=clear&look=60,64&zoom=1', xm_church: 'ev=xm&era=1&wx=clear&look=52,34&zoom=2', xm_river: 'ev=xm&era=2&wx=clear&look=16,40&zoom=1', xm_rain: 'ev=xm&era=3&wx=rain&look=95,100&zoom=1'
};
for (const [name, q] of Object.entries(views)) {
  const pg = await open(q); await pg.evaluate(() => { G.rain = G.rainTarget; G.cloud = G.cloudTarget; }); await warm(pg, 25); await pg.evaluate(() => { for (let i = 0; i < 100; i++) { tick(0.05); draw(); } });   // 5 s of frames, so reflections are sampled while bursts are live
  const s = await pg.evaluate(() => ({ cur: EV.cur, refl: EV.stats.refl, rain: G.rain, umb: EV.crowd.filter(a => a.umb > 0.5).length, gone: EV.crowd.filter(a => a.alpha < 0.05).length, crowd: EV.crowd.length }));
  rep[name] = s;
  if (name.includes('river') && name.startsWith('qk')) check(`${name}: fireworks reflect on the river`, s.refl > 0, s);
  if (name.includes('rain')) check(`${name}: crowd reacts to rain (umbrellas / heads for shelter)`, s.umb > 0 && s.gone > 0, s);
  check(`${name}: event active`, s.cur === q.slice(3, 5), s.cur);
  await shot(pg, name); check(`${name}: no page errors`, pg.errs.length === 0, pg.errs); await pg.close();
}
{
  const pg = await open('ev=qk&era=3&wx=clear&look=14,60');
  rep.sound = await pg.evaluate(async () => { audioPlay(); await new Promise(r => setTimeout(r, 300)); const s0 = EV.stats.snd; for (let i = 0; i < 400; i++) tick(0.05); return { state: AU.ctx.state, playing: AU.playing, scheduled: EV.stats.snd - s0, bed: !!EV.bed }; });
  check('sound: firework booms / whistles scheduled with the music on', rep.sound.scheduled > 10 && rep.sound.bed, rep.sound);
  check('sound: no page errors', pg.errs.length === 0, pg.errs); await pg.close();
}

// 5) performance (frame = tick + draw, default zoom, 202x, night)
for (const ev of ['none', 'qk', 'hw', 'xm']) {
  const pg = await open(`ev=${ev}&era=3&time=night&wx=clear&zoom=0`); await warm(pg, 20);
  rep['perf_' + ev] = await pg.evaluate(() => { const times = []; for (let i = 0; i < 160; i++) { const t0 = performance.now(); tick(0.016); draw(); times.push(performance.now() - t0); } times.sort((a, c) => a - c); return { medianMs: +times[80].toFixed(2), p95Ms: +times[152].toFixed(2), peds: SIM.peds.length, crowd: EV.crowd.length, vehs: SIM.vehs.length, sparks: FW.parts.length }; });
  check(`perf ${ev}: p95 frame under 40ms`, rep['perf_' + ev].p95Ms < 40, rep['perf_' + ev]);
  await pg.close();
}
console.log(JSON.stringify(rep, null, 1)); await b.close();
console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'PASS'); process.exit(fails.length ? 1 : 0);
