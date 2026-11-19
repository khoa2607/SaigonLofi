'use strict';
// ===== Holdfast — world contexts: two timelines (current / past) living in one page, sharing one renderer, camera and audio =====
// The simulation and map code address one global map (HF) and one global simulation state (HS); the renderer keeps the build output of the
// timeline on screen in HR (HR_WORLD_KEYS). Rather than duplicating the application, each timeline owns a *context*: a snapshot of those three
// pieces of state. At any moment exactly one context is installed in the globals (HWD.cur); hwEnter(era) swaps another one in (a few dozen
// pointer copies). Properties are never deleted, so the global objects keep a single stable hidden class (no slow-mode dictionaries).
//
//   HWD.shown    the timeline on screen (and the one the UI talks to)
//   HWD.cur      the timeline whose state is installed in the globals right now (== shown outside of a slice / a crossfade frame)
//
// A timeline is created lazily by hwPrepare(): the map, the population, the baked sprites and the visible ground are built in short
// time slices (SL.ms each, see hf-map.js) while the viewer keeps watching the other timeline. The inactive timeline is simply not ticked,
// so it resumes exactly where it was. DOM-free except for what hrBuildStaticsG & co do; loadable in Node (tests/holdfast-world.mjs).
const HWD = { worlds: {}, cur: null, shown: null, params: { seed: 7, simSeed: 11, pop: 120 }, slices: 0, maxSlice: 0, stage: '', stageMax: {}, stageWork: {}, lastPrep: null };
// the viewer's environment follows them across timelines (like SaigonLofi's clock across years); everything else is per timeline
const HW_ENV = ['timeMode', 'wxMode', 'weather', 'season', 'autoSeason', 'danger', 'zScale', 'hour'];
const hwHasR = () => typeof HR !== 'undefined' && typeof HR_WORLD_KEYS !== 'undefined';

function hwTake() {
  const o = { HF: Object.assign({}, HF), HS: Object.assign({}, HS) };
  if (hwHasR()) { o.HR = {}; for (const k of HR_WORLD_KEYS) o.HR[k] = HR[k]; }
  return o;
}
function hwPut(snap) {
  for (const k in HF) if (!(k in snap.HF)) HF[k] = undefined; Object.assign(HF, snap.HF);
  for (const k in HS) if (!(k in snap.HS)) HS[k] = undefined; Object.assign(HS, snap.HS);
  if (hwHasR()) for (const k of HR_WORLD_KEYS) HR[k] = snap.HR[k];
  shReset();                                                 // module-level spatial hashes belong to no world: start the installed one clean
}
// register the world that was built the ordinary (synchronous) way at boot: it is installed already
function hwRegister(era, params) {
  if (params) HWD.params = params;
  HWD.worlds[era] = { era, saved: null, built: true, ready: true, acc: 0, staticsSeason: hwHasR() ? HR.season : null };
  HWD.cur = HWD.shown = era;
}
function hwNew(era) {
  const snap = { HF: hfNewHF(), HS: hsNewHS() };
  Object.assign(snap.HS, { sound: HS.sound, onEvent: HS.onEvent });
  if (hwHasR()) snap.HR = hrNewWorld(HS.season);
  HWD.worlds[era] = { era, saved: snap, built: false, ready: false, acc: 0, staticsSeason: null };
  return HWD.worlds[era];
}
function hwEnter(era) {
  if (HWD.cur === era) return;
  const to = HWD.worlds[era]; if (!to || !to.saved) throw new Error('holdfast world "' + era + '" is not available');
  if (HWD.cur) HWD.worlds[HWD.cur].saved = hwTake();
  const snap = to.saved; to.saved = null; hwPut(snap); HWD.cur = era;
}
function hwWith(era, fn) { const prev = HWD.cur; hwEnter(era); try { return fn(); } finally { if (prev && prev !== era) hwEnter(prev); } }
function hwEnv() { const e = {}; for (const k of HW_ENV) e[k] = HS[k]; return e; }
function hwApplyEnv(e) { for (const k of HW_ENV) if (e[k] !== undefined) HS[k] = e[k]; HS.life = lifeHour(); }
const hwSeed = era => (((HWD.params.simSeed * 31 + (era === 'past' ? 17 : 29)) >>> 0) % 2147483647) || 1;

// ---------------------------------------------------------------- background preparation (generators run in short slices by hwRunSliced)
function* hwPrepareG(era, env) {
  const w = HWD.worlds[era];
  hwApplyEnv(env);
  if (!w.built) {
    HWD.stage = 'map'; yield* hfBuildMapG(HWD.params.seed, era);
    HWD.stage = 'sim'; yield* hsInitG({ seed: hwSeed(era), pop: HWD.params.pop, hour: env.hour });
    HS.weather = env.weather; HS.hour = env.hour; HS.life = lifeHour();
    w.built = true;
  }
  if (typeof hrBuildStaticsG === 'function') {
    if (w.staticsSeason !== HS.season) { w.staticsSeason = null; HR.season = HS.season; HWD.stage = 'statics'; yield* hrBuildStaticsG(); w.staticsSeason = HS.season; }
    HWD.stage = 'sheets'; yield* hrPrewarmG();
    HWD.stage = 'ground'; yield* hrPrebakeViewG();
  }
  w.ready = true;
}
const hwYield = () => new Promise(r => setTimeout(r, 0));
// a slice uses what a frame leaves free: a heavy frame (big screen, an attack) gets small slices, a light one (phone, quiet) larger ones
function hwBudget() { if (typeof HR === 'undefined' || !HR.ft || HR.ft.length < 10) return 6; const a = HR.ft.slice(-30); let m = 0; for (const x of a) m += x; m /= a.length; return Math.max(3, Math.min(9, 15.5 - m)); }
async function hwRunSliced(era, gen, cancelled) {
  for (;;) {
    if (cancelled && cancelled()) return false;
    const r = hwWith(era, () => { const t0 = SL.t0 = performance.now(); SL.ms = hwBudget(); SL.on = true; try { return gen.next(); } finally { SL.on = false; SL.ms = 6; const d = performance.now() - t0; HWD.slices++; if (d > HWD.maxSlice) HWD.maxSlice = d; if (d > (HWD.stageMax[HWD.stage] || 0)) HWD.stageMax[HWD.stage] = d; HWD.stageWork[HWD.stage] = (HWD.stageWork[HWD.stage] || 0) + d; } });
    if (r.done) return true;
    await hwYield();
  }
}
// Build (if needed) and warm the destination timeline while the current one stays on screen. Returns false if the request was withdrawn.
// The first build is not abandoned half way (a half-built map cannot be resumed); later stages are idempotent and can be.
async function hwPrepare(era, cancelled) {
  if (!HWD.worlds[era]) hwNew(era);
  for (let round = 0; round < 3; round++) {
    const env = hwWith(HWD.shown, hwEnv), w = HWD.worlds[era];
    if (!await hwRunSliced(era, hwPrepareG(era, env), () => w.built && cancelled && cancelled())) return false;
    if (hwWith(HWD.shown, hwEnv).season === env.season) return true;       // the season changed while preparing: build the new one too
  }
  return true;
}
// make `era` the timeline on screen: it adopts the viewer's current environment (time, weather, season, danger); its own people, infected and
// buildings are exactly as they were
function hwActivate(era) {
  const env = hwWith(HWD.shown, hwEnv);
  hwWith(era, () => hwApplyEnv(env));
  HWD.shown = era; hwEnter(era);
}
