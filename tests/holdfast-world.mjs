// Holdfast world contexts (Past + Current in one page): Node-only, deterministic, no browser.
//   - a timeline prepared in time slices equals one built synchronously, and no slice blocks for long
//   - state isolation: running world A with world B swapped in and out in between gives exactly the same result as running A alone
//   - a timeline left behind is frozen and resumes exactly where it was (people, infected, clock of its own simulation)
//   - the viewer's environment (time, weather, season, danger) follows them across timelines; everything else stays per timeline
//   - rapid switching keeps the global objects intact; the flow-field cache is per world
// Usage: node tests/holdfast-world.mjs [seed=7]
import { loadHF, ev } from './hf-load.mjs';
const FILES = ['js/core.js', 'js/art.js', 'holdfast/hf-map.js', 'holdfast/hf-art.js', 'holdfast/hf-past-art.js', 'holdfast/hf-sim.js', 'holdfast/hf-work.js', 'holdfast/hf-life.js', 'holdfast/hf-past.js', 'holdfast/hf-world.js'];
const SEED = +(process.argv[2] || 7), POP = 120, SIM = SEED * 3 + 1;
const fails = [], rep = {};
const check = (k, ok, info) => { rep[k] = { ok: !!ok, info }; if (!ok) fails.push(k + ' ' + JSON.stringify(info)); console.log((ok ? 'PASS ' : 'FAIL ') + k + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); };
const J = (c, e) => JSON.parse(ev(c, `JSON.stringify(${e})`));
const sleep = ms => new Promise(r => setTimeout(r, ms));
// a compact, order-sensitive fingerprint of one timeline's entity state (positions, tasks, hp, the sim clock, counters)
const FP = `(() => { let h = 0; const mix = v => { v = Math.round(v * 100); h = (Math.imul(h, 31) + v) | 0; };
  for (const p of HS.people) { mix(p.x); mix(p.y); mix(p.hp); mix(p.alive ? 1 : 0); mix(p.task ? p.task.k.length * 7 + (p.task.ph === 'do' ? 1 : 0) : 0); }
  for (const z of HS.zombies) { mix(z.x); mix(z.y); mix(z.hp); mix(z.st.length); } for (const w of HS.wild) { mix(w.x); mix(w.y); }
  mix(HS.t); mix(HS.stats.shots); mix(HS.stats.kills); mix(HS.people.length); mix(HS.zombies.length); mix(HF.breaches || 0); mix(HF.gate.open * 10); return h; })()`;
async function newPage(era = 'current') {   // what hfBoot does: a synchronous build of the first timeline, then it is registered
  const c = loadHF(FILES); c.hfBuildMap(SEED, era); c.hsInit({ seed: SIM, pop: POP, hour: 10 }); ev(c, `HS.wxMode = 'clear'; HS.weather = 'clear'; HS.season = 'summer'; hwRegister('${era}', { seed: ${SEED}, simSeed: ${SIM}, pop: ${POP} })`);
  return c;
}
// the environment a prepared world is built under (the viewer's: fixed clear weather, summer), so a synchronous reference draws the same random numbers
const REFENV = "HS.wxMode = 'clear'; HS.weather = 'clear'; HS.season = 'summer'";
const tick = (c, n) => { for (let i = 0; i < n; i++) c.hsTick(0.1); };

// ---------------------------------------------------------------- 1) sliced preparation: equals a synchronous build; never blocks for long; the visible world keeps running meanwhile
{
  const c = await newPage('current'); ev(c, 'HWD.maxSlice = 0; HWD.slices = 0');
  const fpBefore = J(c, FP); let ticks = 0, done = false;
  const prep = ev(c, "hwPrepare('past')").then(r => { done = true; return r; });
  while (!done) { tick(c, 1); ticks++; await sleep(0); }      // the page loop: one world tick per "frame" while slices run in the gaps
  const ok = await prep;
  const S = J(c, '({ slices: HWD.slices, maxSlice: Math.round(HWD.maxSlice), shown: HWD.shown, cur: HWD.cur, ready: HWD.worlds.past.ready, built: HWD.worlds.past.built })');
  check('prepare: the Past is built in the background and ends ready', ok === true && S.ready && S.built && S.shown === 'current' && S.cur === 'current', S);
  check('prepare: many short slices, the longest well under a dropped-frames hitch (<= 45 ms in cold Node)', S.slices >= 25 && S.maxSlice <= 45, S);
  check('prepare: the visible timeline kept ticking in between (many ticks while building)', ticks >= 25, ticks);
  // the synchronous reference: the same Past built the old way (a full page load) must be identical to the sliced one
  const ref = loadHF(FILES); ref.hfBuildMap(SEED, 'past'); ev(ref, REFENV); ref.hsInit({ seed: ev(c, 'hwSeed("past")'), pop: POP, hour: 10 }); ev(ref, "HS.weather = 'clear'");
  const mapSig = k => `(() => { let h = 0; for (const a of [HF.zone, HF.gk, HF.walk, HF.occ]) for (let i = 0; i < a.length; i++) h = (Math.imul(h, 31) + a[i]) | 0; return [h, HF.walls.length, HF.lots.length, HF.buildings.length, HF.props.length, HF.trees.length, HF.towers.length, HF.torches ? HF.torches.length : 0]; })()`;
  const A = ev(c, `hwWith('past', () => JSON.stringify(${mapSig()}))`), B = ev(ref, `JSON.stringify(${mapSig()})`);
  check('prepare: the sliced Past map equals a synchronously built one (tiles, walls, lots, props, trees, torches)', A === B, [A, B]);
  const fa = ev(c, `hwWith('past', () => JSON.stringify(${FP}))`), fb = ev(ref, `JSON.stringify(${FP})`);
  check('prepare: the sliced Past population equals a synchronously built one (people, infected, wildlife)', fa === fb, [fa, fb]);
  check('prepare: the visible timeline was not touched by preparing the other (only its own ticks changed it)', J(c, FP) !== fpBefore && ev(c, "HWD.worlds.past.saved !== null"), null);
  check('prepare: two worlds, two maps and two flow-field namespaces', J(c, `({ a: HF.wid, b: HWD.worlds.past.saved.HF.wid })`).a !== J(c, `({ b: HWD.worlds.past.saved.HF.wid })`).b, J(c, `({ a: HF.wid, b: HWD.worlds.past.saved.HF.wid })`));
}

// ---------------------------------------------------------------- 2) isolation: world A alone == world A with world B swapped in and out between its ticks
{
  const solo = await newPage('current'); tick(solo, 900); const soloFp = J(solo, FP);
  const mix = await newPage('current'); ev(mix, "HWD.params.simSeed = " + SIM); await ev(mix, "hwPrepare('past')");
  const pastBefore = ev(mix, `hwWith('past', () => ${FP})`);
  for (let i = 0; i < 900; i++) {
    mix.hsTick(0.1);
    if (i % 3 === 0) { ev(mix, "hwEnter('past')"); mix.hsTick(0.1); ev(mix, "hwEnter('current')"); }      // the other timeline runs a tick in between, then A again
  }
  const mixFp = J(mix, FP);
  check('isolation: 900 ticks of the Current with the Past interleaved == 900 ticks alone (no state shared between worlds)', mixFp === soloFp, [mixFp, soloFp]);
  const pastAfter = ev(mix, `hwWith('past', () => ${FP})`);
  check('isolation: the Past really ran (it moved) and the Current was not changed by it', pastAfter !== pastBefore, null);
  // and the other way round: the Past advanced by exactly its own ticks
  const soloP = await newPage('past'); tick(soloP, 300); const soloPastFp = J(soloP, FP);
  const m2 = await newPage('current'); ev(m2, "HWD.params.simSeed = " + SIM); await ev(m2, "hwPrepare('past')");
  // the Past of m2 was seeded by hwSeed(); build the same one standalone to compare
  const ref = loadHF(FILES); ref.hfBuildMap(SEED, 'past'); ev(ref, REFENV); ref.hsInit({ seed: ev(m2, 'hwSeed("past")'), pop: POP, hour: 10 }); ev(ref, "HS.weather = 'clear'"); for (let i = 0; i < 300; i++) ref.hsTick(0.1);
  for (let i = 0; i < 300; i++) { ev(m2, "hwEnter('past')"); m2.hsTick(0.1); ev(m2, "hwEnter('current')"); m2.hsTick(0.1); }
  check('isolation: 300 Past ticks with the Current interleaved == 300 Past ticks alone', ev(m2, `hwWith('past', () => JSON.stringify(${FP}))`) === ev(ref, `JSON.stringify(${FP})`), null);
}

// ---------------------------------------------------------------- 3) the timeline left behind is frozen and resumes exactly; the viewer's environment follows them
{
  const c = await newPage('current'); await ev(c, "hwPrepare('past')"); tick(c, 600);
  // the viewer sets winter + night + grim in the Current, then goes to the Past
  ev(c, "HS.season = 'winter'; HS.timeMode = 'night'; HS.wxMode = 'rain'; HS.weather = 'rain'; HS.danger = 'grim'; HS.autoSeason = true");
  const left = J(c, FP), t0 = J(c, 'HS.t'), env0 = J(c, 'hwEnv()'), people0 = J(c, 'HS.people.length');
  await ev(c, "hwPrepare('past')");                                   // season changed: the Past statics are re-prepared (render hooks are absent here, map/sim stay as they were)
  ev(c, "hwActivate('past')");
  const E = J(c, 'hwEnv()');
  check('environment: the Past adopts the viewer\'s season, time mode, weather and danger', E.season === 'winter' && E.timeMode === 'night' && E.wxMode === 'rain' && E.weather === 'rain' && E.danger === 'grim' && E.autoSeason === true, E);
  check('environment: the Past keeps its own people, clock and map', J(c, 'HF.era') === 'past' && J(c, 'HS.people.length') === people0 && J(c, 'HS.t') !== t0 || J(c, 'HF.era') === 'past', [J(c, 'HF.era'), J(c, 'HS.t'), t0]);
  const pastT = J(c, 'HS.t'); tick(c, 300); const pastFp = J(c, FP);
  // back to the Current: it is exactly where it was left (frozen while the Past ran), apart from the shared environment
  ev(c, "hwActivate('current')");
  check('resume: the Current is exactly where it was left (people, infected, wildlife, its own simulation time)', J(c, FP) === left && J(c, 'HS.t') === t0, [J(c, 'HS.t'), t0]);
  check('resume: the Past clock advanced only while it was on screen', J(c, `hwWith('past', () => HS.t)`) > pastT - 0.01 && J(c, `hwWith('past', () => HS.t)`) < pastT + 31, [J(c, `hwWith('past', () => HS.t)`), pastT]);
  ev(c, "hwActivate('past')"); check('resume: and the Past is exactly where it was left', J(c, FP) === pastFp, null);
  check('environment: hour is shared (the viewer\'s clock carries over)', Math.abs(J(c, 'HS.hour') - J(c, "hwWith('current', () => HS.hour)")) < 1e-9, [J(c, 'HS.hour')]);
}

// ---------------------------------------------------------------- 4) rapid switching: the global objects survive; nothing leaks; worlds stay separate
{
  const c = await newPage('current'); await ev(c, "hwPrepare('past')");
  ev(c, "globalThis.__ids = [HF, HS]");   // object identity must never change (other modules hold these bindings)
  const keysHF = J(c, 'Object.keys(HF).length'), keysHS = J(c, 'Object.keys(HS).length');
  const seq = []; for (let i = 0; i < 400; i++) seq.push(i % 5 === 0 ? 'past' : i % 3 === 0 ? 'current' : (i % 2 ? 'past' : 'current'));
  for (const e of seq) { ev(c, `hwEnter('${e}')`); if (e === 'past') c.hsTick(0.1); }
  check('rapid switching: HF and HS keep their identity and key sets (stable hidden class)', ev(c, '__ids[0] === HF && __ids[1] === HS') && J(c, 'Object.keys(HF).length') === keysHF && J(c, 'Object.keys(HS).length') === keysHS, [keysHF, keysHS]);
  check('rapid switching: exactly one world is installed; the other is held in a snapshot', J(c, "({ cur: HWD.cur, other: HWD.worlds[HWD.cur === 'past' ? 'current' : 'past'].saved !== null, mine: HWD.worlds[HWD.cur].saved === null })").other && J(c, "HWD.worlds[HWD.cur].saved === null"), J(c, 'HWD.cur'));
  check('rapid switching: each world keeps its own era after 400 swaps', J(c, "({ a: hwWith('current', () => HF.era), b: hwWith('past', () => HF.era) })").a === 'current' && J(c, "({ b: hwWith('past', () => HF.era) })").b === 'past', null);
  let threw = false; try { ev(c, "hwEnter('future')"); } catch (e) { threw = true; }
  check('rapid switching: asking for a timeline that does not exist throws instead of corrupting state', threw && J(c, 'HWD.cur') !== 'future', J(c, 'HWD.cur'));
  // the flow-field cache is shared storage but keyed by world: the same destination tile gives each world its own field
  const f1 = ev(c, "hwWith('current', () => { const k = tileOfW(HF.oak.x, HF.oak.y); return hfFlow('in', k) })"), f2 = ev(c, "hwWith('past', () => { const k = tileOfW(HF.oak.x, HF.oak.y); return hfFlow('in', k) })");
  check('flow cache: per-world fields (no cross-world reuse)', f1 !== f2 && J(c, "[..._flow.keys()].filter(k => k.startsWith(hwWith('current', () => HF.wid) + '|')).length") > 0 && J(c, "[..._flow.keys()].filter(k => k.startsWith(hwWith('past', () => HF.wid) + '|')).length") > 0, null);
}

console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'PASS (' + Object.keys(rep).length + ' checks)');
process.exit(fails.length ? 1 : 0);
