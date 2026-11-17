// Headless-browser verification of the Tết upgrade. Usage: python3 -m http.server 8765 &  node tests/tet.mjs [shotdir]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const SHOTS = process.argv[2] || null, BASE = 'http://localhost:8765/index.html?clean=1&';
const b = await chromium.launch(); const fails = []; const rep = {};
const check = (name, ok, info) => { if (!ok) fails.push(name + (info !== undefined ? ' ' + JSON.stringify(info) : '')); };
async function open(q, w = 1280, h = 800) {
  const pg = await b.newPage({ viewport: { width: w, height: h } }); pg.errs = []; pg.on('pageerror', e => pg.errs.push(String(e).slice(0, 200)));
  await pg.goto(BASE + q); await pg.waitForFunction(() => typeof SIM !== 'undefined' && SIM.lanes.length > 0 && !G.busy, null, { timeout: 120000 }); await pg.waitForTimeout(1500); return pg;
}
const redShare = pg => pg.evaluate(() => { const c = document.getElementById('c') || document.querySelector('canvas'), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 190 && d[i + 1] < 80 && d[i + 2] < 70) n++; let y = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 230 && d[i + 1] > 190 && d[i + 2] < 90) y++; return { red: n / (d.length / 4), yellow: y / (d.length / 4) }; });
// 1) every era: Tết OFF vs ON in the same page (no reload), flags / stalls / vendors / shoppers
for (const era of [0, 1, 2, 3]) {
  const pg = await open(`tet=0&era=${era}&time=noon&wx=clear&zoom=2`); const r = {};
  r.off = await redShare(pg); r.itemsOff = await pg.evaluate(() => G.world.items.length);
  await pg.evaluate(() => setTet(true)); await pg.waitForTimeout(1600); r.on = await redShare(pg);
  Object.assign(r, await pg.evaluate(() => { for (let i = 0; i < 20 * 200; i++) tick(0.05); const kinds = {}; for (const v of SIM.vehs) if (v.kind.startsWith('melon')) kinds[v.kind] = 1; return { itemsOn: G.world.items.length, flags: TET.fixed.length + roofFlags(G.era).length, strings: TET.strings.length, melonStalls: TET.stalls.filter(s => s.kind === 'melon').length, flowerStalls: TET.stalls.filter(s => s.kind === 'flower').length, vendors: SIM.actors.filter(a => a.tetV).length, melonSpots: POI.melon.length, shoppers: SIM.peds.filter(p => p.look.carry === 'melon').length, melonVehKinds: Object.keys(kinds), roofFlags: roofFlags(G.era).length, houses: CITY.recs.filter(x => x.t === 'b' && !x.lm && !x.keep && x.e0 <= G.era && x.e1 >= G.era).length }; }));
  if (SHOTS) await pg.screenshot({ path: `${SHOTS}/era${era}_tet_on.png` });
  await pg.evaluate(() => setTet(false)); await pg.waitForTimeout(1600);
  Object.assign(r, await pg.evaluate(() => ({ itemsBack: G.world.items.length, visOff: TET.visible().length, vendorsOff: SIM.actors.filter(a => a.tetV).length, spotsOff: POI.melon.length, shoppersOff: SIM.peds.filter(p => p.look.carry === 'melon').length, melonVehOff: SIM.vehs.filter(v => v.kind.startsWith('melon')).length })));
  if (SHOTS) await pg.screenshot({ path: `${SHOTS}/era${era}_tet_off.png` });
  rep['era' + era] = r;
  check(`era${era} more red with Tet`, r.on.red > r.off.red * 2.5, [r.off.red, r.on.red]);
  check(`era${era} more yellow with Tet`, r.on.yellow > r.off.yellow * 1.5, [r.off.yellow, r.on.yellow]);
  check(`era${era} items restored when Tet off`, r.itemsBack === r.itemsOff, [r.itemsOff, r.itemsBack]);
  check(`era${era} flag on every house`, r.roofFlags >= r.houses, [r.roofFlags, r.houses]);
  check(`era${era} 7 landmark flag pairs`, (await pg.evaluate(() => TET.fixed.filter(f => f.big).length)) === 14);
  check(`era${era} many watermelon stalls`, r.melonStalls >= 30, r.melonStalls);
  check(`era${era} vendors on every stall`, r.vendors === r.melonStalls + r.flowerStalls, r.vendors);
  check(`era${era} shoppers carry melons`, r.shoppers > 0);
  check(`era${era} everything gone when off`, !r.visOff && !r.vendorsOff && !r.spotsOff && !r.shoppersOff && !r.melonVehOff && r.itemsBack === r.itemsOff, r);
  check(`era${era} no page errors`, pg.errs.length === 0, pg.errs);
  await pg.close();
}
// 2) NPC paths: every melon-stall customer spot reachable from every walkway sample, with Tết ON (blocked stall tiles must not cut the city)
{
  const pg = await open('tet=1&era=1&time=noon&wx=clear');
  rep.paths = await pg.evaluate(() => { let bad = 0, n = 0; const spots = POI.melon.concat(POI.bench.slice(0, 8), POI.river.slice(0, 8), POI.cafe.slice(0, 8)); for (const a of spots) for (const c of spots) { if (a === c) continue; n++; const A = nearestWalk(Math.floor(a.x / T), Math.floor(a.y / T)), B = nearestWalk(Math.floor(c.x / T), Math.floor(c.y / T)); if (!A || !B || !findPath(A[0], A[1], B[0], B[1])) bad++; } let blockedOnPath = 0; for (const g of TET.blocks) if (GT[g] === G_ROAD || GT[g] === G_ZEB || GT[g] === G_PATH) blockedOnPath++; return { pairs: n, unreachable: bad, blockedRoadOrPathTiles: blockedOnPath }; });
  check('paths reachable', rep.paths.unreachable === 0, rep.paths); check('no road/path tile blocked', rep.paths.blockedRoadOrPathTiles === 0, rep.paths);
  // stalls never sit on a road, crosswalk, or in a junction box
  rep.stallsOnRoad = await pg.evaluate(() => TET.stalls.filter(s => { const t = GT[gi(Math.floor(s.x / T), Math.floor(s.y / T))]; return t === G_ROAD || t === G_ZEB; }).length); check('stalls off roads', rep.stallsOnRoad === 0);
  await pg.close();
}
// 3) day / night / rain / riverfront / landmarks screenshots + performance
const views = { day_river: 'time=noon&wx=clear&look=24,60&zoom=3&era=1', night_river: 'time=night&wx=clear&look=24,60&zoom=3&era=3', rain_river: 'time=evening&wx=rain&look=24,100&zoom=3&era=2', landmark_market: 'time=noon&wx=clear&look=95,62&zoom=2&era=0', landmark_dinh: 'time=noon&wx=clear&look=95,19&zoom=2&era=2', night_street: 'time=night&wx=clear&zoom=2&era=0', park: 'time=noon&wx=clear&look=95,104&zoom=3&era=1' };
for (const [name, q] of Object.entries(views)) { const pg = await open('tet=1&' + q); if (SHOTS) await pg.screenshot({ path: `${SHOTS}/${name}.png` }); check('no errors ' + name, pg.errs.length === 0, pg.errs); await pg.close(); }
for (const t of [0, 1]) {
  const pg = await open(`tet=${t}&era=3&time=noon&wx=clear&zoom=1`);
  rep['perf_tet' + t] = await pg.evaluate(() => { const times = []; for (let i = 0; i < 120; i++) { const t0 = performance.now(); tick(0.016); draw(); times.push(performance.now() - t0); } times.sort((a, c) => a - c); return { medianMs: +times[60].toFixed(2), p95Ms: +times[114].toFixed(2) }; });
  await pg.close();
}
check('perf: p95 frame under 40ms with Tet', rep.perf_tet1.p95Ms < 40, rep.perf_tet1);
console.log(JSON.stringify(rep, null, 1)); await b.close();
console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'PASS'); process.exit(fails.length ? 1 : 0);
