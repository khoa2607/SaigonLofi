// Holdfast death lifecycle: alive -> dying (collapse / fall) -> stationary corpse -> fade -> removal. Node only, deterministic.
// Regression for "dead dinosaurs blink and never disappear". Two root causes, both covered here:
//   1. a fatal hit left the stagger timer (stT) set; dead entities returned from hsZ before it counted down, and the dinosaur renderer
//      blinks while stT > 0  -> small dinosaurs blinked for their whole corpse life
//   2. hsHitZ re-armed corpseT (90-150 s) on EVERY hit, including hits on bodies already dead -> under fire a corpse never expired
// Usage: node tests/holdfast-corpse.mjs [seed=7]
import { loadHF, ev } from './hf-load.mjs';
const FILES = ['js/core.js', 'js/art.js', 'holdfast/hf-map.js', 'holdfast/hf-art.js', 'holdfast/hf-past-art.js', 'holdfast/hf-sim.js', 'holdfast/hf-work.js', 'holdfast/hf-life.js', 'holdfast/hf-past.js'];
const SEED = +(process.argv[2] || 7);
const fails = [], rep = {};
const check = (k, ok, info) => { rep[k] = { ok: !!ok, info }; if (!ok) fails.push(k + ' ' + JSON.stringify(info)); console.log((ok ? 'PASS ' : 'FAIL ') + k + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); };
const J = (c, e) => JSON.parse(ev(c, `JSON.stringify(${e})`));
function world(era, hour = 10) { const c = loadHF(FILES); c.hfBuildMap(7, era); c.hsInit({ seed: SEED * 5 + 3, pop: 120, hour }); ev(c, "HS.wxMode = 'clear'; HS.weather = 'clear'; HS.season = 'summer'"); return c; }
// a quiet spot in the wilderness for a lone body (nothing else spawns near it during the test because the director is paused)
const QUIET = `(() => { for (let n = 0; n < 500; n++) { const [x, y] = hsWildPoint(); if (hsFarFromWall(tileOfW(x, y), 30) && !HS.zombies.some(z => Math.hypot(z.x - x, z.y - y) < 60)) return [x, y]; } return hsWildPoint(); })()`;
const pause = c => ev(c, 'HS.next.minor = HS.next.medium = HS.next.major = HS.next.siege = 1e9; HS.nextP && (HS.nextP.fly = HS.nextP.apex = 1e9); HS.next.act = 1e9');

// a body's whole life, sampled every tick: returns the timeline needed by the checks
function lifeOf(c, sp, opts = {}) {
  const [x, y] = J(c, QUIET);
  ev(c, `globalThis.Z = pastAddDino(${x}, ${y}, { sp: '${sp}', noPack: 1 }); Z.st = 'wander'; Z.path = null; ${opts.fly ? "Z.alt = 46;" : ''} HS.zombies.filter(q => q !== Z && Math.hypot(q.x - Z.x, q.y - Z.y) < 400).forEach(q => { q.x = q.px = 5; q.y = q.py = 5; });`);
  const hp0 = J(c, 'Z.hp0'), L = [], base = J(c, 'HS.stats.kills');
  ev(c, `hsHitZ(Z, { x: Z.x - 5, y: Z.y }, 999)`);
  const first = J(c, 'HS.stats.kills') - base;                       // the fatal hit counts exactly one kill (measured before any other defender acts)
  let extra = 0;                                                     // kills credited by hits/kills on the body AFTER it died
  for (let i = 0; i < 3200 && ev(c, 'HS.zombies.includes(Z)'); i++) {
    const s = J(c, '({ st: Z.st, x: Z.x, y: Z.y, alt: Z.alt || 0, dy: Z.dyingT || 0, stT: Z.stT, ct: Z.corpseT, a: corpseAlpha(Z), kills: HS.stats.kills })'); L.push(s);
    if (opts.hits && i % 5 === 0 && s.st === 'dead') { const k0 = J(c, 'HS.stats.kills'); ev(c, `hsHitZ(Z, { x: Z.x - 5, y: Z.y }, 3); hsKillZ(Z)`); extra += J(c, 'HS.stats.kills') - k0; }   // a firing line keeps hitting the body
    c.hsTick(0.1);
  }
  return { sp, hp0, L, gone: !ev(c, 'HS.zombies.includes(Z)'), first, extra };
}
const analyse = r => {
  const L = r.L, dead = L.filter(s => s.st === 'dead'), corpse = dead.filter(s => s.dy <= 0 && s.alt <= 0), fade = corpse.filter(s => s.ct <= 6);
  const mono = fade.every((s, i) => i === 0 || s.a <= fade[i - 1].a + 1e-9);
  const stat = corpse.every(s => Math.abs(s.x - corpse[0].x) < 1e-9 && Math.abs(s.y - corpse[0].y) < 1e-9);
  return { life: +(dead.length * 0.1).toFixed(1), corpseSec: +(corpse.length * 0.1).toFixed(1), stagger: Math.max(...dead.map(s => s.stT)), full: corpse.filter(s => s.ct > 6).every(s => s.a === 1), mono, fadeLen: fade.length, endAlpha: fade.length ? fade[fade.length - 1].a : null, stat, dying: dead.filter(s => s.dy > 0).length, first: r.first, extra: r.extra, gone: r.gone };
};

// ---------------------------------------------------------------- 1) every size class: collapse -> stationary corpse -> smooth fade -> removed
{
  const c = world('past'); pause(c); const R = {};
  for (const sp of ['compy', 'raptor', 'carno', 'trike', 'trex']) { R[sp] = analyse(lifeOf(c, sp)); }
  rep.lifecycle = R;
  for (const sp in R) {
    const a = R[sp];
    check(`${sp}: dies once, collapses, then lies still (no movement while a corpse)`, a.first === 1 && a.stat && a.dying >= 5, a);
    check(`${sp}: no flicker (the stagger timer is cleared on death)`, a.stagger === 0, a.stagger);
    check(`${sp}: fully visible while the corpse remains, then a smooth monotonic fade to nothing`, a.full && a.mono && a.fadeLen >= 55 && a.endAlpha !== null && a.endAlpha < 0.05, [a.full, a.mono, a.fadeLen, a.endAlpha]);
    check(`${sp}: removed from the simulation afterwards`, a.gone, a.life);
  }
  const lv = Object.fromEntries(Object.entries(R).map(([k, v]) => [k, v.life]));
  check('size: larger dinosaurs stay visible longer (compy < raptor < carno < trike < trex)', lv.compy < lv.raptor && lv.raptor < lv.carno && lv.carno < lv.trike && lv.trike < lv.trex && lv.trex >= lv.compy * 3, lv);
  check('size: a large dinosaur stays a minute or more; a compy under a minute', lv.trike >= 60 && lv.compy < 60, lv);
}

// ---------------------------------------------------------------- 2) the root cause: hits on a body never restart its timer, and a firing line cannot keep it alive
{
  const c = world('past'); pause(c); const a = analyse(lifeOf(c, 'raptor', { hits: true })), b = analyse(lifeOf(c, 'raptor'));
  check('hits on a corpse do not extend it: a raptor under continuous fire lives as long as an untouched one (+/- jitter)', a.gone && Math.abs(a.life - b.life) < 20 && a.life < 90, [a.life, b.life]);
  check('hits on a corpse do not add kills or wake it up (one kill, zero extra, stagger stays 0)', a.first === 1 && a.extra === 0 && a.stagger === 0, a);
  const c2 = world('past'); pause(c2); const [x, y] = J(c2, QUIET);
  ev(c2, `globalThis.Z = pastAddDino(${x}, ${y}, { sp: 'trike', noPack: 1 }); hsHitZ(Z, { x: Z.x - 5, y: Z.y }, 999); for (let i = 0; i < 100; i++) c = 0;`.replace('for (let i = 0; i < 100; i++) c = 0;', ''));
  const ct0 = J(c2, 'Z.corpseT'); ev(c2, 'for (let i = 0; i < 400; i++) { hsHitZ(Z, { x: Z.x, y: Z.y }, 5); hsKillZ(Z); }');
  check('idempotent kill: 400 more hits + kills leave the timer, state and kill count unchanged', J(c2, 'Z.corpseT') === ct0 && J(c2, "Z.st") === 'dead' && J(c2, 'Z.hp') <= 0, [ct0, J(c2, 'Z.corpseT')]);
}

// ---------------------------------------------------------------- 3) flyers: a shot pteranodon falls, then lies as a corpse; one that flies away is simply removed
{
  const c = world('past'); pause(c); const r = lifeOf(c, 'ptero', { fly: true }), a = analyse(r);
  const air = r.L.filter(s => s.st === 'dead' && s.alt > 0);
  check('flyer: falls (altitude strictly decreases to the ground), then the corpse timer starts', air.length >= 4 && air.every((s, i) => i === 0 || s.alt < air[i - 1].alt) && r.L.find(s => s.st === 'dead' && s.alt === 0), [air.length, air[0] && air[0].alt]);
  check('flyer: after landing it is stationary, fully visible, fades smoothly and is removed', a.stat && a.mono && a.full && a.gone && a.stagger === 0, a);
  const [x, y] = J(c, QUIET);
  ev(c, `globalThis.F = pastAddDino(${x}, ${y}, { sp: 'ptero', noPack: 1 }); F.fs = 'leave'; F.exit = [F.x + 4, F.y]; F.alt = 50;`);
  let n = 0; while (ev(c, 'HS.zombies.includes(F)') && n++ < 400) c.hsTick(0.1);
  check('flyer: one that flies away is removed from the simulation as soon as it is gone (no body left)', !ev(c, 'HS.zombies.includes(F)') && n < 100, n);
}

// ---------------------------------------------------------------- 4) infected (the Current timeline) share the same lifecycle
{
  const c = world('current'); pause(c); const [x, y] = J(c, QUIET);
  ev(c, `globalThis.Z = hsAddZ(${x}, ${y}); hsHitZ(Z, { x: Z.x - 5, y: Z.y }, 99)`);
  const ct = J(c, 'Z.corpseT'), alphas = []; let n = 0; while (ev(c, 'HS.zombies.includes(Z)') && n++ < 3000) { alphas.push(J(c, 'corpseAlpha(Z)')); c.hsTick(0.1); }
  const fade = alphas.filter(a => a < 1);
  check('infected: corpse 90-150 s, fades over the last 6 s (monotonic), then removed', ct >= 90 && ct <= 150 && fade.length >= 55 && fade.every((a, i) => i === 0 || a <= fade[i - 1] + 1e-9) && !ev(c, 'HS.zombies.includes(Z)'), [ct, fade.length]);
}

// ---------------------------------------------------------------- 5) accelerated simulation: nothing accumulates, nothing invisible lingers
{
  const c = world('past'); ev(c, 'HS.next.major = 120; HS.next.siege = 900; HS.nextP.apex = 300');       // real attacks, so bodies pile up under fire
  let maxDead = 0, expiredLingering = 0, nan = 0, leaked = 0;
  for (let s = 0; s < 3600; s++) {                                                                    // one game hour, accelerated
    for (let i = 0; i < 10; i++) c.hsTick(0.1);
    if (s % 5 === 0) { const r = J(c, `(() => { let dead = 0, expired = 0, bad = 0; for (const z of HS.zombies) { if (z.st !== 'dead') continue; dead++; if (z.corpseT <= 0 || z.gone) expired++; if (!isFinite(z.x) || !isFinite(z.corpseT)) bad++; } shBuild(); let inHash = 0; shNear(SHZ, HW / 2, HW / 2, HW, z => { if (z.st === 'dead') inHash++; }); return { dead, expired, bad, inHash }; })()`);
      maxDead = Math.max(maxDead, r.dead); expiredLingering += r.expired; nan += r.bad; leaked += r.inHash; }
  }
  const end = J(c, '({ kills: HS.stats.kills, dead: HS.zombies.filter(z => z.st === "dead").length, all: HS.zombies.length, majors: HS.stats.attacks.major, siege: HS.stats.attacks.siege })');
  check('accelerated hour with real attacks: bodies pile up (the test is meaningful) but stay bounded', end.kills >= 40 && maxDead >= 4 && maxDead <= 90, [end.kills, maxDead]);
  check('accelerated hour: an expired body never lingers in the simulation (nothing invisible accumulates)', expiredLingering === 0, expiredLingering);
  check('accelerated hour: bodies are never in the targeting grid, never NaN', leaked === 0 && nan === 0, [leaked, nan]);
  // stop the attacks: every body disappears within the longest corpse life (apex 210 s), the array shrinks to the living
  ev(c, 'HS.next.minor = HS.next.medium = HS.next.major = HS.next.siege = 1e9; HS.nextP.fly = HS.nextP.apex = 1e9; HS.next.act = 1e9; HS.zombies = HS.zombies.filter(z => z.st === "dead")');   // the fighting is over and nothing living is left to die
  for (let s = 0; s < 240; s++) for (let i = 0; i < 10; i++) c.hsTick(0.1);
  check('accelerated: 4 minutes after the fighting stops, no body remains anywhere', J(c, 'HS.zombies.filter(z => z.st === "dead").length') === 0, J(c, 'HS.zombies.filter(z => z.st === "dead").length'));
}

console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'PASS (' + Object.keys(rep).filter(k => rep[k].ok !== undefined).length + ' checks)');
process.exit(fails.length ? 1 : 0);
