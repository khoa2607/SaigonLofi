// Holdfast FUTURE timeline (milestone 9): Node only, deterministic seeds, accelerated time.
//   geography equivalence with Current/Past - art coverage (every building, prop, wall, tower, gate, boat; 19 machines, every pose, wrecks)
//   machine locomotion + behaviour, each forced in a controlled scene: cone sensing, signal -> reinforcement chain, flanking, patrol formations,
//   flyers + swarms, interceptor vs drone -> recovery -> repair, wall climber, stealth infiltration -> sabotage -> blackout -> repair,
//   jamming (turrets blind), siege walker; defenses (turrets, pulse rifles, injuries, repairs); the power grid (sun, battery, faults,
//   cleaning, load shedding, backup); hydroponics; deliveries; salvage -> fabrication; long-run stability; activity spread;
//   determinism; Current and Past untouched; three-era world isolation.
// Usage: node tests/holdfast-future.mjs [seed=7]
import { loadHF, ev } from './hf-load.mjs';
const BASE = ['js/core.js', 'js/art.js', 'holdfast/hf-map.js', 'holdfast/hf-art.js', 'holdfast/hf-past-art.js'];
const FILES = BASE.concat(['holdfast/hf-future-art.js', 'holdfast/hf-sim.js', 'holdfast/hf-work.js', 'holdfast/hf-life.js', 'holdfast/hf-past.js', 'holdfast/hf-future.js', 'holdfast/hf-world.js']);
const OLD = BASE.concat(['holdfast/hf-sim.js', 'holdfast/hf-work.js', 'holdfast/hf-life.js', 'holdfast/hf-past.js']);   // the modules without anything of the Future
const SEED = +(process.argv[2] || 7), SIM = SEED * 5 + 3;
const fails = [], rep = {};
const check = (k, ok, info) => { rep[k] = { ok: !!ok, info }; if (!ok) fails.push(k + ' ' + JSON.stringify(info)); console.log((ok ? 'PASS ' : 'FAIL ') + k + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 260) : '')); };
const J = (c, e) => JSON.parse(ev(c, `JSON.stringify(${e})`));
const tick = (c, s) => { for (let i = 0, n = Math.round(s * 10); i < n; i++) { c.hsTick(0.1); if (c.__pin) c.__pin(); } };
// keep a test subject standing where the scene put it (some shared helpers nudge people about)
const pin = (c, x, y) => { c.__pin = () => ev(c, `if (globalThis.P) { P.x = P.px = ${x}; P.y = P.py = ${y}; P.path = null; }`); };
function world(era, hour = 10, files = FILES) { const c = loadHF(files); c.hfBuildMap(SEED, era); c.hsInit({ seed: SIM, pop: 120, hour }); ev(c, "HS.wxMode = 'clear'; HS.weather = 'clear'; HS.season = 'summer'"); return c; }
// a quiet valley: no director attacks, no timed Future events (each scene below triggers exactly what it tests)
const quiet = c => ev(c, `HS.next.minor = HS.next.medium = HS.next.major = HS.next.siege = 1e9; HS.next.act = 1e9; HS.next.pack = 1e9; if (HS.nextF) for (const k in HS.nextF) HS.nextF[k] = 1e9; HS.zombies = []`);
const FP = `(() => { let h = 0; const mix = v => { v = Math.round(v * 100); h = (Math.imul(h, 31) + v) | 0; }; for (const p of HS.people) { mix(p.x); mix(p.y); mix(p.hp); mix(p.alive ? 1 : 0); } for (const z of HS.zombies) { mix(z.x); mix(z.y); mix(z.hp); } for (const w of HS.wild) { mix(w.x); mix(w.y); } mix(HS.t); mix(HS.stats.shots); mix(HS.stats.kills); return h; })()`;
// a point in the open frontier band, v units outside the wall line (u along the valley)
const OUTPT = (u, dv) => `(() => { const [x, y] = d2w(${u}, wallV(${u}) - ${dv}); const k = hfNearPass(x, y, 'out', 6); return tileC(k); })()`;

// ---------------------------------------------------------------- 1) the same valley in three ages
{
  const cur = world('current'), fut = world('future'), past = world('past');
  const G = c => J(c, `({ zone: Array.from(HF.zone).join(''), gk: Array.from(HF.gk).join(','), walk: Array.from(HF.walk, w => w & (W_IN | W_OUT | W_GATE)).join(','), walls: HF.walls.map(s => [s.i, s.j, s.dir, s.gate ? 1 : 0]).join(';'), towers: HF.towers.map(t => [t.x, t.y]).join(';'),
    gate: [HF.gate.x, HF.gate.y].join(), oak: HF.oak ? [HF.oak.x, HF.oak.y].join() : '', bld: HF.buildings.map(b => [b.kind, b.x, b.y, b.w, b.d]).join(';'), docks: HF.docks.map(d => [Math.round(d.x), Math.round(d.y), d.len]).join(';'), routes: HF.routes.map(r => r.name + r.pts.map(p => p.map(Math.round)).join()).join(';'),
    pois: HF.pois.map(p => [Math.round(p.x), Math.round(p.y)]).join(';'), fields: (HF.fields || []).length, props: HF.props.filter(p => !['solar', 'node', 'pad', 'campfire', 'brazier', 'spit', 'stones', 'fern', 'torchpost'].includes(p.kind)).map(p => p.kind + Math.round(p.x) + ',' + Math.round(p.y)).join(';') })`);
  const a = G(cur), b = G(fut), p = G(past), keys = Object.keys(a), diff = keys.filter(k => a[k] !== b[k]), diffP = keys.filter(k => a[k] !== p[k] && k !== 'props');
  check('geography: Future = Current in terrain, ground kinds, navigation grid, wall line, 10 towers, gate, great oak, buildings, docks, routes, POIs and every Current prop', diff.length === 0, { diff });
  check('geography: the Past shares the same anchors (so all three ages line up under one camera)', diffP.length === 0, { diffP });
  check('geography: the anchors are really there (10 towers, routes, the oak, the gate)', J(fut, 'HF.towers.length') === 10 && J(fut, 'HF.routes.length') >= 5 && !!J(fut, '!!HF.oak') && J(fut, 'HF.walls.filter(s => s.gate).length') > 0, J(fut, '({ towers: HF.towers.length, routes: HF.routes.map(r => r.name) })'));
  check('geography: the Future adds only its own grid on free settlement ground (4 substations, solar arrays, drone pads)', J(fut, "HF.fnodes.length") === 4 && J(fut, 'HF.fsolar.length') >= 6 && J(fut, "Object.keys(HF.fpads).length") === 3 && J(fut, "HF.props.filter(p => ['solar','node','pad'].includes(p.kind)).every(p => HF.zone[tileOfW(p.x, p.y)] === Z_SETTLE)"), J(fut, '({ nodes: HF.fnodes.length, solar: HF.fsolar.length, pads: Object.keys(HF.fpads) })'));
}

// ---------------------------------------------------------------- 2) art: every Current building / prop kind has a Future model; 19 machines with distinct silhouettes and real locomotion
{
  const c = world('future');
  const A = J(c, `(() => { const bad = [], ok = B => Array.isArray(B) && B.length > 0 && B.every(b => [b.x, b.y, b.z, b.w, b.d, b.h].every(Number.isFinite) && b.w > 0 && b.d > 0 && b.h > 0);
    const kinds = [...new Set(HF.props.map(p => p.kind))].filter(k => k !== 'lights'), miss = kinds.filter(k => !FPROPS[k]);
    for (const p of HF.props) if (FPROPS[p.kind] && p.kind !== 'lights' && !ok(FPROPS[p.kind](p))) bad.push('prop ' + p.kind);
    const civ = {}; for (const b of HF.buildings) { const B = b.kind === 'house' ? suburbHouse({ w: HF.lots[b.lot].w, d: HF.lots[b.lot].d, floors: HF.lots[b.lot].floors, seed: HF.lots[b.lot].seed, porch: HF.lots[b.lot].porch, garage: HF.lots[b.lot].garage }) : civicModel(b); if (!ok(B)) bad.push(b.kind); else if (b.kind !== 'house') civ[b.kind] = Math.round(Math.max(...B.map(q => q.z + q.h))); }
    for (const s of HF.walls) for (const d of [0, 1, 2]) if (!ok(wallBoxes(s, ['E'], d))) bad.push('wall');
    const T = towerBoxes(); if (!ok(T.back) || !ok(T.front) || !ok(gateFrameBoxes()) || !ok(gateLeafBoxes())) bad.push('tower/gate');
    for (const k of ['fish', 'cargo', 'med']) if (!ok(boatBoxes(k, 'x'))) bad.push('boat ' + k);
    const bots = {}; for (const t of BOT_KEYS) { for (const k of ['stand', 'walk', 'atk', 'climb']) for (let f = 0; f < 4; f++) if (!ok(FBOTS_M[t].model({ k, f }))) bad.push(t + k); if (!ok(botWreckBoxes(t, 1))) bad.push(t + ' wreck');
      const B = FBOTS_M[t].model({ k: 'stand', f: 0 }), W0 = FBOTS_M[t].model({ k: 'walk', f: 0 }), W2 = FBOTS_M[t].model({ k: 'walk', f: 2 });
      const sig = B.map(b => b.x.toFixed(1) + b.y.toFixed(1) + b.z.toFixed(1) + b.w.toFixed(1) + b.d.toFixed(1) + b.h.toFixed(1)).join('');
      const pw = B2 => { const b = B2.find(q => q.p); return b ? [0, 1, 2, 3, 4, 5, 6, 7].map(u => b.p(1, u * 0.7 + 0.2, 1, b, 0, 0)).join() : ''; };
      bots[t] = { wheels: pw(W0) !== pw(W2), top: Math.round(Math.max(...B.map(q => q.z + q.h))), len: Math.round(Math.max(...B.map(q => q.x + q.w)) - Math.min(...B.map(q => q.x))), moves: JSON.stringify(W0) !== JSON.stringify(W2), sig, fly: !!BSTAT[t].fly, spd: BSTAT[t].spd[0] }; }
    const looks = ['guard', 'builder', 'medic', 'tech', 'kid', 'elder', 'smith', 'teacher'].map(r => hfLook(r, mulberry32(3)));
    return { miss, bad: bad.slice(0, 8), civ, bots, looks: looks.map(L => L.fut + ':' + L.ev), people: HS.people.filter(p => p.L.fut).length, peopleN: HS.people.length }; })()`);
  check('art: every building and prop kind of the valley has a Future model (none falls back to Current art)', A.miss.length === 0 && A.bad.length === 0, { miss: A.miss, bad: A.bad });
  const ch = A.civ.church; check('art: the Memory Sanctuary keeps the church / Ancestor Hall height hierarchy (the tallest structure, > 100)', ch > 100 && Object.entries(A.civ).every(([k, v]) => k === 'church' || v < ch), A.civ);
  const T = Object.keys(A.bots), sigs = new Set(T.map(t => A.bots[t].sig));
  check('machines: 19 types, every pose and wreck valid, every silhouette different', T.length === 19 && sigs.size === 19, { n: T.length, unique: sigs.size });
  const ground = T.filter(t => !A.bots[t].fly && !['pylon', 'mender'].includes(t));
  check('machines: legged units move their legs between walk frames; wheeled / tracked units turn their wheels and treads (no human walk cycle reused)', ground.every(t => A.bots[t].moves || A.bots[t].wheels), ground.filter(t => !A.bots[t].moves && !A.bots[t].wheels));
  check('machines: sizes range from a micro drone to a giant (mite < 4, colossus > 50 tall), the heavy ones slowest', A.bots.mite.top < 4 && A.bots.colossus.top > 50 && A.bots.walker.top > 40 && A.bots.colossus.spd < A.bots.hound.spd && A.bots.walker.spd < A.bots.sentry.spd, { mite: A.bots.mite.top, walker: A.bots.walker.top, colossus: A.bots.colossus.top });
  check('people: everyone in the Future wears the age (looks are drawn by the Future hooks)', A.people === A.peopleN && A.looks.every(s => s.startsWith('1:')), A.looks);
}

// ---------------------------------------------------------------- 3) the sensor network: a cone (not a circle), detection -> transmission -> reinforcements
{
  const c = world('future'); quiet(c); ev(c, 'HS.nextF.reinf = 0');
  const [px, py] = J(c, OUTPT(480, 90)), r0 = J(c, `(() => { const p = HS.people.find(q => q.role === 'scav' && q.alive); p.x = p.px = ${px}; p.y = p.py = ${py}; p.exp = { fake: 1 }; p.task = { k: 'exp', t: 0 }; p.vis = true; globalThis.P = p;
    globalThis.Z = futAddBot(${px} - 60, ${py}, { t: 'rover' }); Z.st = 'idle'; Z.idle = 999; Z.dir = 2; return 1; })()`); pin(c, px, py);   // the rover faces away (-x); the person is behind it
  tick(c, 3); const behind = J(c, 'Z.seenP === P ? 1 : 0');
  ev(c, 'Z.dir = 0'); tick(c, 2); const front = J(c, 'Z.seenP === P ? 1 : 0');
  check('sensing: a scout does not see a person behind it (outside its cone), and does once it turns to face them', behind === 0 && front > 0, { behind, front });
  const S1 = J(c, '({ sig: HS.Fs.sig, req: HS.Fs.reinfReq, pending: !!HS.Freinf, ring: HS.sig.length, log: HS.log.filter(e => e.k === "fdetect").length })');
  check('transmission: the detection is broadcast (a signal ring in HS.sig, a journal entry) and reinforcements are requested', S1.sig > 0 && S1.req === 1 && S1.pending && S1.log === 1, S1);
  const n0 = J(c, "HS.zombies.filter(z => z.st !== 'dead').length"); tick(c, 30);
  const S2 = J(c, `({ chain: HS.Fs.chain, reinf: HS.Fs.reinf, bots: HS.zombies.filter(z => z.st !== 'dead').length, coming: HS.zombies.filter(z => z.st !== 'dead' && z !== Z && (z.st === 'investigate' || z.st === 'pursue' || z.st === 'attack') && Math.hypot(z.x - P.x, z.y - P.y) < 400).length, types: [...new Set(HS.zombies.filter(z => z !== Z).map(z => z.L.t))] })`);
  check('response: within 30 s machines arrive from out of sight and converge on the reported position (detection -> transmission -> response)', S2.chain === 1 && S2.reinf === 1 && S2.bots > n0 && S2.coming >= 2, S2);
  check('response: the responders are combat machines (hounds, sentries, racers, skitters), not more scouts', S2.types.length && S2.types.every(t => ['hound', 'sentry', 'racer', 'skitter'].includes(t)), S2.types);
}

// ---------------------------------------------------------------- 4) coordinated pursuit: hunters take flanks; 5) patrol formations walk the frontier
{
  const c = world('future'); quiet(c);
  const [px, py] = J(c, OUTPT(400, 120));
  ev(c, `globalThis.P = HS.people.find(q => q.role === 'scav' && q.alive); P.x = P.px = ${px}; P.y = P.py = ${py}; P.exp = { fake: 1 }; P.task = { k: 'exp', t: 0 }; P.hp = 99;
    globalThis.H = [futAddBot(${px} - 90, ${py} - 10, { t: 'hound' }), futAddBot(${px} - 90, ${py} + 10, { t: 'hound' })]; for (const h of H) { h.st = 'pursue'; h.tgt = P; h.t = 0; h.hp = h.hp0 = 999; }`); pin(c, px, py);
  let spread = 0; for (let i = 0; i < 60; i++) { tick(c, 0.2); const a = J(c, 'H.map(h => Math.atan2(h.y - P.y, h.x - P.x))'); let d = Math.abs(a[0] - a[1]); d = Math.min(d, 2 * Math.PI - d); spread = Math.max(spread, d); }
  check('pursuit: two hunters split to opposite flanks of their target (bearing spread > 1.2 rad), not a single file', J(c, 'HS.Fs.flank') >= 2 && spread > 1.2, { flank: J(c, 'HS.Fs.flank'), spread: +spread.toFixed(2) });
  c.__pin = null; ev(c, 'globalThis.L = futPatrol(); for (const z of HS.zombies) if (z === L || z.lead === L) z.hp = z.hp0 = 9999');
  const P0 = J(c, `({ st: L.st, wp: L.wp.length, f: HS.zombies.filter(z => z.lead === L).map(z => [z.L.t, z.st]) })`); tick(c, 90);
  const P1 = J(c, `({ wp: L.wp.length, st: L.st, near: HS.zombies.filter(z => z.lead === L && z.st !== 'dead').map(z => Math.round(Math.hypot(z.x - L.x, z.y - L.y))), moved: Math.round(L.stride) })`);
  check('patrol: a sentry leads a three-unit formation (two followers in formation), walking waypoints along the frontier', P0.st === 'patrol' && P0.wp >= 3 && P0.f.length === 2 && P0.f.every(f => f[1] === 'pack') && P1.wp < P0.wp && P1.moved > 60 && P1.near.every(d => d < 45), { P0, P1 });
}

// ---------------------------------------------------------------- 6) flyers: altitude, a swarm around its controller, an interceptor shooting down a repair drone -> recovery -> repair
{
  const c = world('future'); quiet(c);
  ev(c, `globalThis.E = futAddBot(300, 300, { t: 'eye' }); globalThis.Q = futAddBot(320, 320, { t: 'queen' });`); tick(c, 6);
  const F = J(c, `({ eye: E.alt, queen: Q.alt, released: Q.released || 0, mites: HS.zombies.filter(z => z.L.t === 'mite' && z.lead === Q).map(z => [Math.round(z.alt), Math.round(Math.hypot(z.x - Q.x, z.y - Q.y))]) })`);
  check('flyers: drones hold real altitude (surveillance ~32, controller ~44), not ground units drawn higher', F.eye > 24 && F.queen > 34, F);
  check('swarm: the controller releases a swarm of mites that orbit it (within 30 units, below it)', F.released === 1 && F.mites.length >= 3 && F.mites.every(m => m[1] < 30 && m[0] > 10 && m[0] < F.queen), F.mites);
  // an interceptor attacks a repair drone working over the settlement; the drone falls inside; a mechanic carries it to the workshop; it flies again
  const seg = J(c, "HF.walls.find(s => !s.gate && s.inT >= 0 && s.outT >= 0 && Math.abs(s.x - HF.fpads.ws.x) + Math.abs(s.y - HF.fpads.ws.y) < 400).id");
  ev(c, `HF.walls[${seg}].hp = HF.walls[${seg}].max - 3; const [ix, iy] = tileC(HF.walls[${seg}].inT); globalThis.DR = futAddDrone('repair', ix - 8, iy - 8, { seg: ${seg}, alt: 20 }); globalThis.HK = futAddBot(ix - 60, iy - 60, { t: 'hawk' }); HK.fs = 'strafe'; HK.prey = DR; HK.t = 0; HK.gcool = 0; HK.hp = HK.hp0 = 999;`);
  let down = null; for (let i = 0; i < 200 && !J(c, 'HS.Fs.droneDown'); i++) tick(c, 0.1); down = J(c, '({ down: HS.Fs.droneDown, st: DR.st, inside: isInside(DR.x, DR.y) })');
  ev(c, 'HK.st = "dead"; HK.gone = 1; HK.corpseT = 0'); tick(c, 3);
  check('interceptor: a hawk strafes a repair drone and shoots it down (it falls to the ground)', down.down === 1 && J(c, 'DR.alt') === 0, down);
  let fixed = 0; for (let i = 0; i < 300 && !fixed; i++) { tick(c, 1); fixed = J(c, 'HS.Fs.droneFixed'); }
  check('recovery: a mechanic picks the drone up, carries it to the workshop bench, and it is repaired and flies again', J(c, 'HS.Fs.droneRecover') >= 1 && fixed >= 1, J(c, '({ recover: HS.Fs.droneRecover, fixed: HS.Fs.droneFixed, st: DR.st })'));
}

// ---------------------------------------------------------------- 7) climbing: the wall climber cuts plates; the stealth unit climbs over, sabotages a substation, the sector goes dark, a technician fixes it
{
  const c = world('future', 22); quiet(c);
  const seg = J(c, "HF.walls.find(s => !s.gate && !s.weak && s.outT >= 0 && s.inT >= 0 && s.kind !== 'culvert').id");
  ev(c, `{ const [x, y] = tileC(HF.walls[${seg}].outT); globalThis.LC = futAddBot(x - 20, y - 20, { t: 'leech' }); LC.hp = LC.hp0 = 999; hsToWall(LC, HF.walls[${seg}]); globalThis.hp0 = HF.walls[${seg}].hp; }`);
  let maxAlt = 0; for (let i = 0; i < 1200 && J(c, 'HS.Fs.leechCut') < 2; i++) { tick(c, 0.1); maxAlt = Math.max(maxAlt, J(c, 'LC.alt')); }
  check('climber: it clamps onto the wall face (off the ground) and cuts the plates (wall hp falls)', J(c, 'HS.Fs.leechCut') >= 2 && maxAlt > 4 && J(c, `HF.walls[${seg}].hp`) < J(c, 'hp0'), { cut: J(c, 'HS.Fs.leechCut'), maxAlt: +maxAlt.toFixed(1), hp: J(c, `HF.walls[${seg}].hp`) });
  ev(c, 'LC.st = "dead"; LC.corpseT = 0; LC.gone = 1');
  const ws = J(c, "HF.walls.find(s => !s.gate && (s.weak || s.kind === 'mesh') && s.outT >= 0 && s.inT >= 0).id");
  ev(c, `{ const [x, y] = tileC(HF.walls[${ws}].outT); globalThis.SP = futAddBot(x - 18, y - 18, { t: 'spider' }); SP.hp = SP.hp0 = 999; hsToWall(SP, HF.walls[${ws}]); }`);
  let alt = 0, inside = false; for (let i = 0; i < 3000 && !J(c, 'HS.Fs.sabotage'); i++) { tick(c, 0.1); alt = Math.max(alt, J(c, 'SP.alt')); inside = inside || J(c, 'isInside(SP.x, SP.y)'); }
  const B = J(c, '({ climbs: HS.Fs.climbs, inf: HS.Fs.infiltrations, sab: HS.Fs.sabotage, dark: HS.Fp.sec.filter(s => !s.on).length + HS.Fp.sec.filter(s => s.backup).length, black: HS.Fs.blackouts + (HS.Fs.backup || 0) })');
  check('stealth: the spider climbs the wall (altitude > 10), drops inside, and sabotages a substation', B.climbs === 1 && B.inf === 1 && alt > 10 && inside && B.sab === 1, Object.assign({ alt }, B));
  check('blackout: its sector goes dark (or on backup power for the medical center sector)', B.black === 1 && B.dark >= 1, B);
  ev(c, 'SP.st = "dead"; SP.corpseT = 0; SP.gone = 1'); let t0 = J(c, 'HS.t'); for (let i = 0; i < 300 && !J(c, 'HS.Fs.restored'); i++) tick(c, 1);
  check('repair: a technician walks to the substation and restores the sector (within 2 minutes)', J(c, 'HS.Fs.restored') === 1 && J(c, 'HS.t') - t0 < 120 && J(c, 'HS.Fp.sec.every(s => !s.fault)'), J(c, `({ restored: HS.Fs.restored, took: Math.round(HS.t - ${t0}), alarm: Math.round(HS.alarm), breaches: HF.breaches, inside: HS.zInside, sec: HS.Fp.sec.map(s => [s.fault, s.on, s.claimed, s.backup, s.by && s.by.role, s.by && s.by.task && s.by.task.k]), calls: HS.Fs.techCalls, techs: HS.people.filter(p => p.role === 'tech' && p.alive).map(p => p.task ? p.task.k : '-') })`));
}

// ---------------------------------------------------------------- 8) electronic attack: a deployed jammer blinds the towers in reach (their turrets go silent); 9) the siege walker
{
  const c = world('future'); quiet(c);
  const tw = J(c, '(() => { const t = HF.towers[4]; return [t.x + 9, t.y + 9, t.id]; })()'), [jx, jy] = J(c, `(() => { const [u, v] = w2d(${tw[0]}, ${tw[1]}); const [x, y] = d2w(u, v - 55); return tileC(hfNearPass(x, y, 'out', 6)); })()`);
  ev(c, `globalThis.JM = futAddBot(${jx}, ${jy}, { t: 'jammer' }); JM.hp = JM.hp0 = 999; globalThis.DM = futAddBot(${jx} + 20, ${jy} + 20, { t: 'hound' }); DM.hp = DM.hp0 = 999; DM.st = 'wall'; DM.seg = HF.towers[4].seg; globalThis.fired = 0;`);
  for (let i = 0; i < 150; i++) { tick(c, 0.1); if (J(c, `HF.towers.filter(t => t.jam > HS.t && t.fired > HS.t - 0.1).length`)) ev(c, 'fired++'); }
  const S = J(c, `({ dep: JM.dep, jams: HS.Fs.jams, jammed: HF.towers.filter(t => t.jam > HS.t).map(t => t.id), jammedT: +HS.Fs.jammedT.toFixed(1), log: HS.log.some(e => e.k === 'fjam'), fired })`);
  check('jamming: the jammer deploys near a tower; towers in its reach go blind (their turrets do not fire while jammed)', S.dep === 1 && S.jams === 1 && S.jammed.includes(tw[2]) && S.jammedT > 5 && S.log && S.fired === 0, S);
  ev(c, 'JM.st = "dead"; JM.corpseT = 0; JM.gone = 1'); tick(c, 3);
  check('jamming: when the jammer is gone the towers see again', J(c, 'HF.towers.every(t => !(t.jam > HS.t))'), null);
  const c2 = world('future'); quiet(c2);
  ev(c2, `{ const g = HF.walls[HF.gate.segs[0]]; const [u, v] = w2d(g.x, g.y); const [x, y] = d2w(u, v - 200); const k = hfNearPass(x, y, 'out', 8); const p = tileC(k); globalThis.WK = futAddBot(p[0], p[1], { t: 'walker' }); WK.hp = WK.hp0 = 99999; WK.siege = 1; globalThis.FL = futGateFlank(); globalThis.hp0 = FL.hp; }`);
  for (let i = 0; i < 6000 && J(c2, 'FL.hp') >= J(c2, 'hp0') - 2 && !J(c2, '!!FL.breached'); i++) tick(c2, 0.1);
  const S2 = J(c2, `({ approach: HS.Fs.siegeApproach, st: WK.st, hit: (FL.lastHit || 0) > 0, hp: FL.hp, hp0, dmg: HS.Fs.wallDmg.siege || 0, t: Math.round(HS.t), dGate: Math.round(Math.hypot(WK.x - HF.gate.x, WK.y - HF.gate.y)) })`);
  check('siege: the walker heads for the gate, stops beside it and breaks the flank section (heavy damage, slowly)', S2.approach === 1 && S2.hit && S2.dmg >= 3 && S2.dGate < 110, S2);
}

// ---------------------------------------------------------------- 10) an ordinary hour: defenses work, the settlement is hurt and repaired, never a constant battlefield
{
  const c = world('future', 8), cur = world('current', 8);
  tick(c, 3600); tick(cur, 3600);
  const F = J(c, `({ turret: HS.Fs.turretShots, tkills: HS.Fs.turretKills, pulses: HS.Fs.pulses, kills: HS.stats.kills, shots: HS.stats.shots, hurt: HS.stats.hurt || HS.log.filter(e => e.k === 'hurt').length, alive: HS.people.filter(p => p.alive).length, droneRepair: HS.Fs.droneRepair, fixed: HS.log.filter(e => e.k === 'sealed' || e.k === 'houseFixed').length, alarmShare: 0, wrecks: HS.Fs.wrecks, salv: HS.Fs.salvaged, chain: HS.Fs.chain, types: Object.keys(HS.Fs.spawned).length })`), C = J(cur, '({ kills: HS.stats.kills, shots: HS.stats.shots })');
  check('defense: turrets and pulse rifles both fight (turret shots and kills, defenders firing)', F.turret > 100 && F.tkills > 20 && F.pulses > 500, F);
  check('defense: not a constant battlefield: machines destroyed per hour stay near the Current timeline\'s infected (< 1.6x)', F.kills < C.kills * 1.6, { future: F.kills, current: C.kills });
  check('defense: the settlement holds (never below 85% of its people in an hour); repair drones fix damaged sections', F.alive >= 102 && F.droneRepair >= 1, F);
  check('variety: an ordinary hour sees at least 12 of the 19 machine types', F.types >= 12, F.types);
}

// ---------------------------------------------------------------- 11) the power grid: sun -> arrays -> battery -> sectors; cleaning; faults + repairs; load shedding; backup power
{
  const c = world('future', 11); quiet(c);
  tick(c, 1); const noon = J(c, 'HS.Fp.gen'); ev(c, 'HS.hour = 1.5; HS.timeMode = "night"'); tick(c, 1); const night = J(c, 'HS.Fp.gen');
  check('energy: the arrays produce by day and not at night (generation follows the sun)', noon > 0.3 && night < noon * 0.3, { noon: +noon.toFixed(2), night: +night.toFixed(2) });
  ev(c, 'HS.timeMode = "noon"; HS.hour = 12; HS.nextF.clean = 0; HS.Fp.dirt[0] = 0.95; for (let i = 1; i < HS.Fp.dirt.length; i++) HS.Fp.dirt[i] = 0');
  for (let i = 0; i < 240 && !J(c, 'HS.Fs.solarClean'); i++) tick(c, 1);
  check('maintenance: a technician wipes the dirtiest array (its output comes back)', J(c, 'HS.Fs.solarClean') >= 1 && J(c, 'HS.Fp.dirt[0]') < 0.2, { clean: J(c, 'HS.Fs.solarClean'), dirt: +J(c, 'HS.Fp.dirt[0]').toFixed(2) });
  const civ = J(c, 'HS.Fp.civ'), sec = [0, 1, 2, 3].find(i => i !== civ);
  ev(c, `futFault(${sec}, 'test')`); const dark = J(c, `!HS.Fp.sec[${sec}].on`); let t0 = J(c, 'HS.t'); for (let i = 0; i < 200 && J(c, `HS.Fp.sec[${sec}].fault`); i++) tick(c, 1);
  check('blackout: a faulted sector goes dark; a technician walks to its substation and restores it', dark && !J(c, `HS.Fp.sec[${sec}].fault`) && J(c, `HS.Fp.sec[${sec}].on`) && J(c, 'HS.t') - t0 < 150, { took: Math.round(J(c, 'HS.t') - t0) });
  ev(c, `futFault(${civ}, 'test')`);
  check('backup: the medical center\'s sector never goes dark (it switches to emergency batteries)', J(c, `HS.Fp.sec[${civ}].on`) && J(c, `HS.Fp.sec[${civ}].backup`) && J(c, 'HS.log.some(e => e.k === "fbackup")'), null);
  ev(c, 'HS.hour = 23; HS.timeMode = "night"; HS.Fp.bat = 0.03'); tick(c, 2); const shed = J(c, '({ shed: HS.Fp.shed, off: HS.Fp.sec.filter(s => s.shed).length })');
  ev(c, 'HS.Fp.bat = 0.6'); tick(c, 2);
  check('load shedding: an empty battery switches one sector off; it comes back once the battery recovers', shed.shed === 1 && shed.off === 1 && J(c, 'HS.Fp.sec.every(s => !s.shed)'), shed);
}

// ---------------------------------------------------------------- 12) supply chains: hydroponics -> stores, cargo + medical deliveries, salvage -> parts -> fabrication
{
  const c = world('future', 7);
  const p0 = J(c, 'HS.plots.map(p => p.st).join("")'), f0 = J(c, 'HS.store.food'); let changes = 0, last = p0;
  for (let i = 0; i < 300; i++) { tick(c, 1); const s = J(c, 'HS.plots.map(p => p.st).join("")'); if (s !== last) { changes++; last = s; } }
  check('hydroponics: trays go through their stages (visible progress every 20-30 s across the beds) and the food chain runs', changes >= 8 && J(c, 'HS.plots.length') >= 6, { changes, plots: J(c, 'HS.plots.length'), food: [f0, J(c, 'HS.store.food')] });
  quiet(c); ev(c, 'HS.alarm = 0; HS.nextF.cargo = 0; HS.nextF.med = 0; globalThis.st0 = (HS.stalls || []).reduce((a, s) => a + (s.stock || 0), 0); globalThis.med0 = HS.store.med || 0'); tick(c, 1); ev(c, 'HS.nextF.cargo = HS.nextF.med = 1e9');
  for (let i = 0; i < 240 && !(J(c, 'HS.Fs.cargo') && J(c, 'HS.Fs.medDeliv')); i++) tick(c, 1);
  check('deliveries: a cargo drone lands at the supply exchange and restocks it; a medical drone lands on the hospital roof with supplies', J(c, 'HS.Fs.cargo') >= 1 && J(c, 'HS.Fs.medDeliv') >= 1 && J(c, '(HS.store.med || 0) > med0'), J(c, '({ cargo: HS.Fs.cargo, med: HS.Fs.medDeliv, medStore: HS.store.med, med0 })'));
  // salvage: a wreck near the wall, a team goes out for it, the parts come back, the fabrication bay uses them
  const [wx, wy] = J(c, OUTPT(520, 50)); ev(c, `globalThis.WR = futAddBot(${wx}, ${wy}, { t: 'warden' }); hsKillZ(WR); WR.corpseT = 200; WR.dyingT = 0; HS.Fs.parts = 0; HS.Fs.salvaged = 0; HS.Fs.salvageExp = 0; HS.Fsal = []; HS.exps = []; HS.alarm = 0; HS.nextF.salvage = 0`);
  let n = 0; for (; n < 600 && !(J(c, 'HS.Fs.salvaged') && J(c, 'HS.Fsal.length') === 0); n++) tick(c, 1);
  const SV = J(c, '({ exp: HS.Fs.salvageExp, salvaged: HS.Fs.salvaged, parts: HS.Fs.parts, wreckGone: !HS.zombies.includes(WR) || WR.corpseT <= 1 })');
  check('salvage: a team walks out to the wreck, strips it (the wreck goes) and brings the parts home', SV.exp >= 1 && SV.salvaged >= 1 && SV.parts >= 2 && SV.wreckGone, Object.assign({ took: n }, SV));
  ev(c, 'HS.Fs.parts = 6; HS.Fs.fab = 0; HS.nextF.fab = 0'); for (let i = 0; i < 200 && !J(c, 'HS.Fs.fab'); i++) tick(c, 1);
  check('fabrication: the fabricator turns salvaged parts into spares (the parts bin empties)', J(c, 'HS.Fs.fab') >= 1 && J(c, 'HS.Fs.parts') <= 3, J(c, '({ fab: HS.Fs.fab, parts: HS.Fs.parts })'));
}

// ---------------------------------------------------------------- 13) two game days at speed: stable, bounded, alive everywhere; determinism; Current and Past untouched; three-era isolation
{
  const c = world('future', 6); let bad = 0, maxZ = 0, maxD = 0, maxSig = 0; const sectors = [0, 0, 0, 0];
  for (let s = 0; s < 2400; s++) { tick(c, 1); if (s % 20 === 0) { const r = J(c, `(() => { let nan = 0; for (const a of HS.people.concat(HS.zombies, HS.fdrones)) if (!isFinite(a.x) || !isFinite(a.y)) nan++; const sec = [0, 0, 0, 0]; for (const p of HS.people) if (p.alive && isInside(p.x, p.y)) sec[FSEC(w2d(p.x, p.y)[0])]++; return { nan, z: HS.zombies.length, d: HS.fdrones.length, sig: HS.sig.length, sec }; })()`);
    bad += r.nan; maxZ = Math.max(maxZ, r.z); maxD = Math.max(maxD, r.d); maxSig = Math.max(maxSig, r.sig); r.sec.forEach((v, i) => sectors[i] += v); } }
  const E = J(c, '({ alive: HS.people.filter(p => p.alive).length, bat: HS.Fp.bat, blackouts: HS.Fs.blackouts, restored: HS.Fs.restored, faults: HS.Fp.sec.filter(s => s.fault).length, kinds: Object.keys(HS.log.reduce((m, e) => (m[e.k] = 1, m), {})) })');
  const tot = sectors.reduce((a, b) => a + b, 0), share = sectors.map(v => +(v / tot).toFixed(2));
  check('stability: two game days, no NaN, entity counts bounded (machines < 200, drones < 16, signals < 40)', bad === 0 && maxZ < 200 && maxD < 16 && maxSig < 40, { bad, maxZ, maxD, maxSig });
  check('stability: the settlement survives (>= 75% of residents) and the grid is never left broken (faults repaired)', E.alive >= 90 && E.restored >= E.blackouts - 1 && E.faults <= 1, E);
  check('activity spread: residents are found in all four sectors of the settlement (none holds more than half of them)', share.every(v => v > 0.08) && Math.max(...share) < 0.5, share);
  const ev8 = ['fdetect', 'freinf', 'fpursuit', 'fblack', 'frestore', 'fmed', 'fcargo', 'fjam', 'frecover'], seen = ev8.filter(k => E.kinds.includes(k));
  check('events: over two days the signature events happen on their own (detection, reinforcements, blackout + restore, deliveries, jamming, recovery...)', seen.length >= 7, { seen, missing: ev8.filter(k => !E.kinds.includes(k)) });
  const a = world('future'), b = world('future'); tick(a, 600); tick(b, 600);
  check('determinism: the same seed gives the same Future (600 s)', J(a, FP) === J(b, FP), [J(a, FP), J(b, FP)]);
  for (const era of ['current', 'past']) { const n = world(era, 10, FILES), o = world(era, 10, OLD); tick(n, 600); tick(o, 600);
    check(`untouched: the ${era} timeline with the Future code loaded runs exactly as without it (600 s fingerprint)`, J(n, FP) === J(o, FP), [J(n, FP), J(o, FP)]); }
}
{
  // three worlds in one page: Current runs with the Past and the Future swapped in and out between its ticks, exactly as when alone
  const mk = () => { const c = loadHF(FILES); c.hfBuildMap(SEED, 'current'); c.hsInit({ seed: SIM, pop: 120, hour: 10 }); ev(c, `HS.wxMode = 'clear'; HS.weather = 'clear'; HS.season = 'summer'; hwRegister('current', { seed: ${SEED}, simSeed: ${SIM}, pop: 120 })`); return c; };
  const A = mk(); tick(A, 300); const alone = J(A, FP);
  const B = mk(); await ev(B, "hwPrepare('future')"); await ev(B, "hwPrepare('past')"); ev(B, "hwEnter('current')");
  const fut0 = J(B, "hwWith('future', () => " + FP + ")");
  for (let i = 0; i < 3000; i++) { ev(B, "hwEnter('current')"); B.hsTick(0.1); if (i % 3 === 0) { ev(B, "hwEnter('future')"); B.hsTick(0.1); } if (i % 5 === 0) { ev(B, "hwEnter('past')"); B.hsTick(0.1); } }
  ev(B, "hwEnter('current')");
  check('three eras: Current interleaved with Future and Past ticks = Current alone (no leak between the three worlds)', J(B, FP) === alone, [J(B, FP), alone]);
  const S = J(B, `({ eras: Object.keys(HWD.worlds), futEra: hwWith('future', () => HF.era), futBots: hwWith('future', () => HS.zombies.every(z => z.L.ev === 'bot')), pastDinos: hwWith('past', () => HS.zombies.every(z => z.L.ev === 'dino')), curZ: HS.zombies.every(z => z.L.ev === 'zombie'), futMoved: hwWith('future', () => ${FP}) !== ${fut0}, wids: Object.values(HWD.worlds).map(w => w.saved ? w.saved.HF.wid : HF.wid) })`);
  check('three eras: each world keeps its own threats (bots / dinosaurs / infected) and its own map', S.eras.length === 3 && S.futEra === 'future' && S.futBots && S.pastDinos && S.curZ && S.futMoved, S);
}

console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'PASS (' + Object.keys(rep).length + ' checks)');
process.exit(fails.length ? 1 : 0);
