// Holdfast PAST timeline — same valley, prehistoric tribe, dinosaurs. Node only, deterministic seeds.
// Usage: node tests/holdfast-past.mjs [seed=7]
import { loadHF, ev } from './hf-load.mjs';
const FILES = ['js/core.js', 'js/art.js', 'holdfast/hf-map.js', 'holdfast/hf-art.js', 'holdfast/hf-past-art.js', 'holdfast/hf-sim.js', 'holdfast/hf-work.js', 'holdfast/hf-life.js', 'holdfast/hf-past.js'];
const SEED = +(process.argv[2] || 7);
const fails = [], rep = {};
const check = (k, ok, info) => { rep[k] = { ok: !!ok, info }; if (!ok) fails.push(k + ' ' + JSON.stringify(info)); console.log((ok ? 'PASS ' : 'FAIL ') + k + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); };
const J = (c, e) => JSON.parse(ev(c, `JSON.stringify(${e})`));
function world(era, seed, hour) { const c = loadHF(FILES); c.hfBuildMap(7, era); c.hsInit({ seed: seed * 5 + 3, pop: 120, hour }); ev(c, "HS.wxMode = 'clear'; HS.weather = 'clear'; HS.season = 'summer'"); return c; }
const ZONES = ['fields', 'market', 'kitchen', 'training', 'stable', 'workshop', 'infirmary', 'school', 'graveyard', 'farmyard', 'frontier', 'commons', 'homes', 'river', 'outside'];

// ---------------------------------------------------------------- 1) the same valley: geography, layout and navigation are identical to the Current timeline
{
  const cur = loadHF(FILES); cur.hfBuildMap(7); const past = loadHF(FILES); past.hfBuildMap(7, 'past');
  const sig = c => J(c, `(() => { let h = 0; const mix = (a) => { for (let i = 0; i < a.length; i++) h = (h * 31 + a[i]) >>> 0; }; mix(HF.zone); mix(HF.gk); mix(HF.walk); return { h, walls: HF.walls.length, towers: HF.towers.length, gate: [Math.round(HF.gate.x), Math.round(HF.gate.y)], lots: HF.lots.length, b: HF.buildings.map(b => b.kind + '@' + Math.round(b.x) + ',' + Math.round(b.y) + ':' + b.w + 'x' + b.d).join('|').length, docks: HF.docks.length, pois: HF.pois.map(p => p.name).join(), routes: HF.routes.length, era: HF.era }; })()`);
  const A = sig(cur), B = sig(past);
  check('valley: same tiles, zones and walkable grid as Current', A.h === B.h, [A.h, B.h]);
  check('valley: same wall chain, towers, gate, lots, buildings, docks, POIs and threat routes', ['walls', 'towers', 'lots', 'b', 'docks', 'pois', 'routes'].every(k => A[k] === B[k]) && A.gate.join() === B.gate.join(), { cur: A, past: B });
  check('era flag: current by default, past when asked', A.era === 'current' && B.era === 'past', [A.era, B.era]);
  const P = J(past, `(() => { const kinds = [...new Set(HF.props.map(p => p.kind))], missing = kinds.filter(k => k !== 'lights' && !PPROPS[k]); const top = bs => Math.max(...bs.map(b => b.z + b.h));
    const civ = HF.buildings.filter(b => b.kind !== 'house').map(b => ({ k: b.kind, n: civicModel(b).length, h: top(civicModel(b)) })), ch = civ.find(q => q.k === 'church');
    const houses = HF.buildings.filter(b => b.kind === 'house').slice(0, 6).map(b => { const L = HF.lots[b.lot]; const o = { w: L.w, d: L.d, floors: L.floors, wall: L.wall, roof: L.roof, seed: L.seed, porch: L.porch, garage: L.garage }; const bx = suburbHouse(o); return { n: bx.length, H: Math.round(o.H), daub: bx.some(q => q.p && q.c !== undefined) }; });
    return { missing, kinds: kinds.length, civ, chH: ch.h, maxOther: Math.max(...civ.filter(q => q.k !== 'church').map(q => q.h)), houses, wall: pastWallBoxes(HF.walls[3], ['E', 'W'], 0).length, tower: pastTowerBoxes().back.length, torches: HF.torches.length, fires: HF.fires.map(f => f.k), traps: HF.traps.length, ring: HF.ring.length, ferns: HF.trees.filter(t => t.spc === 'fern' || t.spc === 'cycad').length, campfires: HF.props.filter(p => p.kind === 'campfire').length }; })()`);
  rep.pastLayout = P;
  check('art: every prop kind of the map has a prehistoric version (no cars, lamps, turbines, signs left)', P.missing.length === 0, P.missing);
  check('art: every civic building has a prehistoric model', P.civ.every(q => q.n >= 3), P.civ.map(q => q.k + ':' + q.n));
  check('art: the Ancestor Hall (totem spire) is the tallest structure (>= 100)', P.chH >= 100 && P.chH > P.maxOther, [P.chH, P.maxOther]);
  check('art: houses are thatched timber-and-wattle huts', P.houses.every(h => h.n >= 10 && h.H > 25), P.houses);
  check('art: palisade sections and watch platforms with a beacon', P.wall >= 8 && P.tower >= 15, [P.wall, P.tower]);
  check('fire: torches, house campfires, a communal fire, the sacred fire, the cookhouse spit, the knapping hearth, 10 tower beacons', P.torches >= 10 && P.campfires >= 8 && ['pit', 'sacred', 'spit', 'hearth'].every(k => P.fires.includes(k)) && P.fires.filter(k => k === 'beacon').length >= 10, { torches: P.torches, camp: P.campfires, fires: [...new Set(P.fires)] });
  check('frontier: stake traps along the kill-zone, a dance ring at the sacred fire', P.traps >= 30 && P.ring >= 8, [P.traps, P.ring]);
  check('vegetation: tree ferns and cycads among the wild trees', P.ferns >= 60, P.ferns);
}

// ---------------------------------------------------------------- 2) people and dinosaurs: looks and sprites
{
  const c = world('past', SEED, 10);
  const H = J(c, `(() => { const roles = {}; for (const p of HS.people) { const L = p.L; roles[p.role] = roles[p.role] || { n: 0, past: 0, ok: 0 }; roles[p.role].n++; if (L.past) roles[p.role].past++;
      let px = 0; for (const b of [false, true]) for (const pose of [0, 1, 6]) { const g = drawPerson(Object.assign({}, L, { gun: p.role === 'guard' ? 'aim' : '' }), b, pose); px += g.reduce((a, v) => a + (v >= 0 ? 1 : 0), 0); } if (px > 6 * 200) roles[p.role].ok++; }
    const g1 = drawPerson(Object.assign({}, HS.people.find(p => p.role === 'guard').L, { gun: 'aim' }), false, 0), g2 = drawPerson(Object.assign({}, HS.people.find(p => p.role === 'guard').L, { gun: 'sling' }), false, 0); let bowDiff = 0; for (let i = 0; i < g1.length; i++) if (g1[i] !== g2[i]) bowDiff++;
    return { roles, bowDiff, evs: [...new Set(HS.people.map(p => p.L.ev))], hats: [...new Set(HS.people.map(p => p.L.hat))] }; })()`);
  check('tribe: every resident wears the prehistoric look (hides, furs, no helmets or caps)', Object.values(H.roles).every(r => r.past === r.n) && !H.hats.includes('helm') && !H.hats.includes('cap'), { evs: H.evs, hats: H.hats });
  check('tribe: every role draws (front, back, walk, arm up)', Object.values(H.roles).every(r => r.ok === r.n), Object.fromEntries(Object.entries(H.roles).map(([k, r]) => [k, r.ok + '/' + r.n])));
  check('tribe: hunters draw a bow when aiming (not a rifle)', H.bowDiff > 15, H.bowDiff);
  const D = J(c, `(() => { const out = {}; for (const k of DKEYS) { const L = { sp: k, morph: 1, seed: 37 }, px = [], gs = []; for (let p = 0; p < 9; p++) { const g = drawDino(L, p); gs.push(g); px.push(g.reduce((a, v) => a + (v >= 0 ? 1 : 0), 0)); }
      const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };
      out[k] = { cat: DSPEC[k].cat, size: DSPEC[k].W + 'x' + DSPEC[k].H, minPx: Math.min(...px), walk: diff(gs[1], gs[3]), atk: diff(gs[0], gs[6]), down: diff(gs[0], gs[8]) }; } return out; })()`);
  rep.dinoArt = D; const keys = Object.keys(D), cats = new Set(keys.map(k => D[k].cat));
  check('dinosaurs: 15 species drawn by code', keys.length === 15, keys);
  check('dinosaurs: every species draws all 9 poses', keys.every(k => D[k].minPx > 100), Object.fromEntries(keys.map(k => [k, D[k].minPx])));
  check('dinosaurs: walk cycles animate, attacks and falls look different from standing', keys.every(k => D[k].walk > 10 && (D[k].cat === 'herb' || D[k].atk > 10) && D[k].down > 30), Object.fromEntries(keys.map(k => [k, [D[k].walk, D[k].atk, D[k].down]])));
  check('dinosaurs: small, pack, stalker, charger, breaker, heavy, apex, flyer and herbivore types', ['small', 'pack', 'stalker', 'charger', 'breaker', 'heavy', 'apex', 'flyer', 'herb'].every(q => cats.has(q)), [...cats]);
  check('dinosaurs: the T-rex is the largest predator, the brachiosaur the largest animal', DSPEC_SIZE(D, 'trex') > Math.max(...keys.filter(k => D[k].cat !== 'apex' && D[k].cat !== 'herb').map(k => DSPEC_SIZE(D, k))) && DSPEC_SIZE(D, 'brachio') > DSPEC_SIZE(D, 'trex'));
  const Z = J(c, `({ ev: [...new Set(HS.zombies.map(z => z.L.ev))], wild: [...new Set(HS.wild.map(w => w.k))] })`);
  check('dinosaurs replace the infected entirely', Z.ev.length === 1 && Z.ev[0] === 'dino', Z.ev);
  check('herbivores in the wilds: parasaurolophus herds, stegosaurs, brachiosaurs', ['deer', 'stego', 'brachio'].every(k => Z.wild.includes(k)), Z.wild);
}
function DSPEC_SIZE(D, k) { const [w, h] = D[k].size.split('x').map(Number); return w * h; }

// ---------------------------------------------------------------- 3) an afternoon, an evening and a night: hunters, defence, fire, the dance, flyers, the apex
function evening(seed) {
  const c = world('past', seed, 15); let peakD = 0, peakLit = 0, fxKinds = new Set(), herbInside = 0, alarm = 0, nan = 0, litAt21 = -1, litAt9 = -1;
  for (let i = 0; i < 9400; i++) {
    c.hsTick(0.1); if (i === 900) ev(c, 'hsMajor(34, 2)');
    if (i % 25) continue;
    const s = J(c, `[HS.people.filter(p => p.task && p.task.dance && p.task.ph === 'do').length, HF.torches.filter(t => t.lit).length, [...new Set(HS.fx.map(f => f.k))], HS.wild.filter(w => w.big && isInside(w.x, w.y)).length, HS.alarm > 0 ? 1 : 0, HS.people.some(p => !isFinite(p.x)) || HS.zombies.some(z => !isFinite(z.x)) ? 1 : 0, +HS.hour.toFixed(2)]`);
    peakD = Math.max(peakD, s[0]); peakLit = Math.max(peakLit, s[1]); for (const k of s[2]) fxKinds.add(k); herbInside += s[3]; alarm += s[4]; nan += s[5];
    if (litAt21 < 0 && s[6] > 21 && s[6] < 22) litAt21 = s[1]; if (litAt9 < 0 && s[6] > 9 && s[6] < 10) litAt9 = s[1];
  }
  return { c, Ps: J(c, 'HS.Ps'), st: J(c, '({ shots: HS.stats.shots, kills: HS.stats.kills, deaths: HS.stats.deaths, inj: HS.stats.injuries, breaches: HS.stats.breaches, repairs: HS.stats.repairs })'), alive: J(c, 'HS.people.filter(p => p.alive).length'), floor: J(c, 'HS.floor'), torches: J(c, 'HF.torches.length'), hour: J(c, 'HS.hour'), peakD, peakLit, fx: [...fxKinds], herbInside, alarm, nan, litAt21, litAt9 };
}
{
  const E = evening(SEED), P = E.Ps, hostile = Object.keys(P.spawned).filter(k => k !== 'para');
  rep.evening = { Ps: P, st: E.st, peakDancers: E.peakD, peakLit: E.peakLit, litAt21: E.litAt21, litAt9: E.litAt9, alarmSamples: E.alarm, fx: E.fx };
  check('roster: at least 9 hostile species come out of the forest in one evening', hostile.length >= 9, P.spawned);
  check('packs: raptors / compies arrive in packs', P.packs >= 3, P.packs);
  check('behaviour: chargers sprint at the palisade, the apex roars', P.charges >= 1 && P.roars >= 1 && P.apex >= 1, [P.charges, P.roars, P.apex]);
  check('behaviour: dinosaurs damage the palisade', Object.values(P.wallDmg).reduce((a, b) => a + b, 0) >= 3, P.wallDmg);
  check('defence: hunters shoot arrows (fire arrows at night), never bullets', P.arrows > 100 && P.fireArrows > 10 && !E.fx.includes('tracer') && !E.fx.includes('flash'), [P.arrows, P.fireArrows, E.fx]);
  check('defence: a major attack raises the alarm and is beaten back', E.alarm > 0 && E.st.kills >= 10, [E.alarm, E.st.kills]);
  check('defence: stake traps wound dinosaurs; at night the smaller hunters shy away from the fire', P.trapHits >= 1 && P.fireScare >= 1, [P.trapHits, P.fireScare]);
  check('fire: beacons blaze during the alarm and through the night', P.beaconT > 200, Math.round(P.beaconT));
  check('fire: the fire-keeper walks a torch round at dusk; all torches burn by 21:00 and are out by 09:00', P.keeperRounds >= 1 && P.lit >= 1 && E.litAt21 === E.torches && E.litAt9 === 0, [P.keeperRounds, P.lit, P.autoLit, E.litAt21, E.litAt9, E.torches]);
  check('ritual: an evening fire dance with a drummer', P.dance >= 3 && E.peakD >= 3 && P.drumStart >= 1, [P.dance, E.peakD, P.drumStart]);
  check('flyers: pteranodons come over, scout and swoop on the livestock / people in the open', P.flyers >= 1 && P.flyerScout >= 1, [P.flyers, P.flyerScout, P.swoops, P.raids, P.swoopPeople, P.flyerDriven]);
  check('herbivores stay out in the wilds', E.herbInside === 0, E.herbInside);
  check('stability: no NaN, the tribe stays viable (no gore: the fallen are covered)', E.nan === 0 && E.alive >= E.floor, [E.alive, E.floor, E.st.deaths]);
  const E2 = evening(SEED);
  check('determinism: same seed, same evening', JSON.stringify(E2.Ps) === JSON.stringify(P) && JSON.stringify(E2.st) === JSON.stringify(E.st));
}

// ---------------------------------------------------------------- 4) a working day: activity spread over the whole settlement (same zone classifier as milestone 6)
{
  const c = world('past', SEED, 8); const zc = {}; let n = 0;
  for (let i = 0; i < 6000; i++) { c.hsTick(0.1); if (i % 10) continue; const z = J(c, `(() => { const z = {}; for (const p of HS.people) { if (!p.alive || !p.vis || (p.task && p.task.k === 'sleep')) continue; const k = lfZoneOf(p.x, p.y); z[k] = (z[k] || 0) + 1; } return z; })()`); n++; for (const k in z) zc[k] = (zc[k] || 0) + z[k]; }
  const tot = Object.values(zc).reduce((a, b) => a + b, 0), active = ZONES.filter(k => k !== 'homes' && k !== 'outside' && (zc[k] || 0) / n >= 1.5);
  rep.distribution = Object.fromEntries(ZONES.map(k => [k, +(100 * (zc[k] || 0) / tot).toFixed(1)]));
  const L = J(c, 'HS.Ls'), W = J(c, 'HS.stats.work');
  check('day: >= 10 community zones busy on average', active.length >= 10, [active.length, active]);
  check('day: no zone holds more than 25 % of the people', Math.max(...ZONES.filter(k => k !== 'homes').map(k => (zc[k] || 0) / tot)) <= 0.25, rep.distribution);
  check('day: the reused loops run (crafting, healer, story lodge, market, pens, riders, river, hunting parties)', L.forge >= 2 && L.checkups >= 2 && (L.lessons >= 1 || L.story >= 1) && L.sales >= 3 && L.pigFeed >= 1 && L.bathe + L.wash >= 2 && J(c, 'HS.stats.exp') >= 1, { forge: L.forge, checkups: L.checkups, lessons: L.lessons, story: L.story, sales: L.sales, pigs: L.pigFeed, rides: L.rides, river: L.bathe + L.wash, hunts: J(c, 'HS.stats.exp') });
  check('day: crops are planted and harvested, meals are cooked', (W.harvests >= 1 || W.plantings >= 1) && W.cooked >= 1, { harvest: W.harvests, cooked: W.cooked, planted: W.plantings });
  check('day: an elder tends the sacred fire', J(c, 'HS.Ps.tend') >= 1, J(c, 'HS.Ps.tend'));
}

// ---------------------------------------------------------------- 5) the Current timeline is untouched by the Past code
{
  const c = world('current', SEED, 10);
  const C = J(c, `({ era: HF.era, ev: [...new Set(HS.zombies.map(z => z.L.ev))], past: HS.people.filter(p => p.L.past).length, kinds: HF.props.filter(p => ['campfire', 'brazier', 'fern', 'spit'].includes(p.kind)).length, torches: HF.torches === undefined, ferns: HF.trees.filter(t => t.spc === 'fern').length })`);
  check('current: zombies, modern settlers, no prehistoric props', C.era === 'current' && C.ev.join() === 'zombie' && C.past === 0 && C.kinds === 0 && C.ferns === 0, C);
}
console.log(fails.length ? `\nFAIL (${fails.length})` : '\nPASS'); process.exit(fails.length ? 1 : 0);
