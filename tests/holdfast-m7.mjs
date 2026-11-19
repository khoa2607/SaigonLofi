// Holdfast milestone 7 — zombie redesign (holdfast/zombie.webp), grand church, schoolhouse, riverside graveyard (2x),
// river life (bathing, washing, bank fishing) and supply boats incl. red-cross medical boats. Node only, deterministic seeds.
// Usage: node tests/holdfast-m7.mjs [seed=7]
import { loadHF, ev } from './hf-load.mjs';
const FILES = ['js/core.js', 'js/art.js', 'holdfast/hf-map.js', 'holdfast/hf-art.js', 'holdfast/hf-sim.js', 'holdfast/hf-work.js', 'holdfast/hf-life.js'];
const SEED = +(process.argv[2] || 7);
const fails = [], rep = {};
const check = (k, ok, info) => { rep[k] = { ok: !!ok, info }; if (!ok) fails.push(k + ' ' + JSON.stringify(info)); console.log((ok ? 'PASS ' : 'FAIL ') + k + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
const J = (c, e) => JSON.parse(ev(c, `JSON.stringify(${e})`));
function world(seed, hour) { const c = loadHF(FILES); c.hfBuildMap(7); c.hsInit({ seed: seed * 5 + 3, pop: 120, hour }); ev(c, "HS.wxMode = 'clear'; HS.weather = 'clear'; HS.season = 'summer'"); return c; }

// ---------------------------------------------------------------- 1) zombies: every reference archetype exists, is drawn, and appears in the world
{
  const c = world(SEED, 9);
  const z = J(c, `(() => { const out = {}; for (const k of ZKEYS) { let L = null; for (let i = 0; i < 4000 && !L; i++) { const R = mulberry32(i * 31 + 7), q = hfZombieLook(R); if (q.zt === k) L = q; } if (!L) { out[k] = null; continue; }
    const px = []; let diffFB = 0; for (let b = 0; b < 2; b++) for (let p = 0; p < 8; p++) { const g = drawZombie(L, b === 1, p); px.push(g.reduce((a, v) => a + (v >= 0 ? 1 : 0), 0)); }
    const f = drawZombie(L, false, 0), bk = drawZombie(L, true, 0); for (let i = 0; i < f.length; i++) if (f[i] !== bk[i]) diffFB++;
    const w1 = drawZombie(L, false, 1), w3 = drawZombie(L, false, 3); let walkDiff = 0; for (let i = 0; i < w1.length; i++) if (w1[i] !== w3[i]) walkDiff++;
    out[k] = { minPx: Math.min(...px), diffFB, walkDiff }; } return out; })()`);
  const types = Object.keys(z);
  check('zombies: 23 archetypes from the reference sheet', types.length === 23, types.length);
  check('zombies: every archetype draws all 16 frames (8 poses x front/back)', types.every(k => z[k] && z[k].minPx > 150), Object.fromEntries(types.map(k => [k, z[k] && z[k].minPx])));
  check('zombies: front and back views differ (face vs back of head)', types.every(k => z[k] && z[k].diffFB > 40));
  check('zombies: the walk cycle animates (frames 1 and 3 differ)', types.every(k => z[k] && z[k].walkDiff > 20));
  const seen = J(c, `(() => { const s = {}; for (let i = 0; i < 1500; i++) { hsTick(0.1); if (i % 50 === 0) for (const z of HS.zombies) s[z.L.zt] = (s[z.L.zt] || 0) + 1; } return s; })()`);
  check('zombies: at least 14 different archetypes are walking around within a few minutes', Object.keys(seen).length >= 14, seen);
  const crawl = J(c, `HS.zombies.filter(z => z.L.zt === 'crawler' || z.L.zt === 'creeper').map(z => z.spd)`);
  check('zombies: crawlers / creepers are never runners', crawl.every(s => s <= 3.61), crawl);
}

// ---------------------------------------------------------------- 2) layout: church, school, graveyard
{
  const c = world(SEED, 9);
  const L = J(c, `(() => { const top = bs => Math.max(...bs.map(b => b.z + b.h)); const ch = HF.buildings.find(b => b.kind === 'church'), sc = HF.buildings.find(b => b.kind === 'school');
    const chH = top(civicModel(ch)), scB = civicModel(sc), scH = top(scB), others = HF.buildings.filter(b => b !== ch && b.kind !== 'house').map(b => top(civicModel(b))), houses = HF.buildings.filter(b => b.kind === 'house').length;
    const G = HF.graveyard; let nearW = 1e9; for (let j = 0; j < HN; j++) for (let i = 0; i < HN; i++) if (HF.gk[tIdx(i, j)] === GK.WATER) nearW = Math.min(nearW, Math.hypot(i * 8 + 4 - (G.x + G.w / 2), j * 8 + 4 - (G.y + G.d / 2)) - Math.hypot(G.w, G.d) / 2);
    const [gu, gv] = w2d(G.x + G.w / 2, G.y + G.d / 2), inSet = HF.graves.every(g => HF.zone[tileOfW(g.x, g.y)] === Z_SETTLE);
    const props = k => HF.props.filter(p => p.kind === k).length, hit = (R, x, y, w, d) => x < R.x + R.w + 2 && x + w > R.x - 2 && y < R.y + R.d + 2 && y + d > R.y - 2;
    const clashG = HF.buildings.filter(b => hit(G, b.x, b.y, b.w, b.d)).length + HF.props.filter(q => !['picket', 'lantern', 'memorial', 'bench'].includes(q.kind) && hit(G, q.x - 3, q.y - 3, 6, 6)).length, clashC = HF.buildings.filter(b => b !== ch && hit(ch, b.x, b.y, b.w, b.d)).length;
    return { chArea: ch.w * ch.d, chH, maxOther: Math.max(...others), scArea: sc.w * sc.d, scH, scSign: scB.length, flag: props('flagpole'), arch: props('schoolarch'), bikes: props('bikerack'), gArea: G.w * G.d, graves: HF.graves.length, nearW: Math.round(nearW), gu: Math.round(gu), gv: Math.round(gv), inSet, mourn: HF.spots.mourn.length, houses, shelter: HF.spots.shelter.length, clashG, clashC }; })()`);
  rep.layout = L;
  check('church: footprint at least 2.5x the old church (34 x 54)', L.chArea >= 2.5 * 34 * 54, L.chArea);
  check('church: the tallest building in the community (spire + cross >= 100 units)', L.chH >= 100 && L.chH > L.maxOther, [L.chH, L.maxOther]);
  check('school: a two-storey schoolhouse (>= 33 units) larger than before (56 x 30)', L.scH >= 33 && L.scArea > 56 * 30, [L.scH, L.scArea]);
  check('school: flagpole, SCHOOL entrance arch and bike rack in the yard', L.flag >= 1 && L.arch >= 1 && L.bikes >= 1, [L.flag, L.arch, L.bikes]);
  check('graveyard: about twice the old area (64 x 44)', L.gArea >= 1.9 * 64 * 44, L.gArea);
  check('graveyard: more graves than before (20)', L.graves >= 30, L.graves);
  check('graveyard: on the west edge of the community, beside the river', L.gu < 200 && L.nearW < 40, [L.gu, L.gv, L.nearW]);
  check('graveyard: all graves inside the settlement', L.inSet);
  check('layout: nothing built on top of the graveyard or the church', L.clashG === 0 && L.clashC === 0, [L.clashG, L.clashC]);
  check('layout: still >= 38 homes and the church shelter spot', L.houses >= 38 && L.shelter >= 1, [L.houses, L.shelter]);
}

// ---------------------------------------------------------------- 3) a summer day: river life, boats, graveyard visits, burials, determinism
function day(seed) {
  const c = world(seed, 6.5); let samples = 0, onOk = 0, maxBoats = 0, bathers = 0, washers = 0, bank = 0, medPeak = 0;
  const med0 = J(c, 'HS.store.med');
  for (let i = 0; i < 9000; i++) {
    c.hsTick(0.1); if (i % 20) continue;
    const s = J(c, `({ b: HS.boats.map(b => { const k = tileOfW(b.x, b.y); return HF.gk[k] === GK.WATER || (HF.walk[k] & W_DOCK) ? 1 : 0; }), ba: HS.people.filter(p => p.act === 'bathe').length, wa: HS.people.filter(p => p.act === 'wash').length, bf: HS.people.filter(p => p.task && p.task.bank && p.act === 'fish').length, med: HS.store.med })`);
    for (const w of s.b) { samples++; onOk += w; } maxBoats = Math.max(maxBoats, s.b.length); bathers = Math.max(bathers, s.ba); washers = Math.max(washers, s.wa); bank = Math.max(bank, s.bf); medPeak = Math.max(medPeak, s.med);
  }
  // a death: the stone count goes up and a fresh grave appears in the riverside graveyard
  const burial = J(c, `(() => { HF.memorial.stones++; for (let i = 0; i < 20; i++) hsTick(0.1); const g = HS.graves.find(q => q.fresh); const G = HF.graveyard; return g ? { inside: g.x > G.x && g.x < G.x + G.w && g.y > G.y && g.y < G.y + G.d } : null; })()`);
  return { c, Ls: J(c, 'HS.Ls'), samples, onOk, maxBoats, bathers, washers, bank, med0, medPeak, burial };
}
{
  const D = day(SEED), L = D.Ls;
  rep.river = { bathe: L.bathe, wash: L.wash, bankfish: L.bankfish, boats: L.boats, medBoats: L.medBoats, medDeliver: L.medDeliver, cargoBoats: L.cargoBoats, cargoDeliver: L.cargoDeliver, pray: L.pray, visits: L.visits, peak: { bathers: D.bathers, washers: D.washers, bank: D.bank, boats: D.maxBoats } };
  check('river: residents bathe in the river (morning / evening)', L.bathe >= 3, L.bathe);
  check('river: residents wash clothes at the bank', L.wash >= 3, L.wash);
  check('river: fishing from the bank as well as the docks', L.bankfish >= 3 && D.bank >= 1, [L.bankfish, D.bank]);
  check('boats: several supply boats pass in a day (occasional, never more than 2 at once)', L.boats >= 4 && D.maxBoats <= 2, [L.boats, D.maxBoats]);
  check('boats: red-cross medical boats come by and deliver supplies to the hospital store', L.medBoats >= 2 && L.medDeliver >= 1, [L.medBoats, L.medDeliver]);
  check('boats: cargo boats', L.cargoBoats >= 1, L.cargoBoats);
  check('boats: always on the water (or alongside a dock)', D.samples > 50 && D.onOk === D.samples, [D.onOk, D.samples]);
  check('graveyard: still visited (flowers / kneeling) in its new place', L.visits >= 1, L.visits);
  check('graveyard: a death adds a fresh grave inside the relocated graveyard', D.burial && D.burial.inside, D.burial);
  const D2 = day(SEED);
  check('determinism: same seed, same river day', JSON.stringify(D2.Ls) === JSON.stringify(D.Ls));
}
console.log(fails.length ? `\nFAIL (${fails.length})` : '\nPASS'); process.exit(fails.length ? 1 : 0);
