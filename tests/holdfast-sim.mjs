// Holdfast simulation regression (Node, no browser): deterministic seed, accelerated time.
// Usage: node tests/holdfast-sim.mjs [gameSeconds=3600] [seed=7]
import { loadHF, ev } from './hf-load.mjs';
const SECS = +(process.argv[2] || 3600), SEED = +(process.argv[3] || 7);
const FILES = ['js/core.js', 'js/art.js', 'holdfast/hf-map.js', 'holdfast/hf-art.js', 'holdfast/hf-sim.js', 'holdfast/hf-work.js'];
const fails = [], rep = {};
const check = (name, ok, info) => { rep[name] = { ok: !!ok, info }; if (!ok) fails.push(name + ' ' + JSON.stringify(info)); };

function world(seed) { const c = loadHF(FILES); c.hfBuildMap(seed); c.hsInit({ seed: seed * 3 + 1, pop: 120 }); return c; }

// ---- 1) map invariants
{
  const c = world(SEED);
  const m = JSON.parse(ev(c, `JSON.stringify({ lots: HF.lots.length, walls: HF.walls.length, towers: HF.towers.length, gateIn: HF.gate.inTile, gateOut: HF.gate.outTile, pois: HF.pois.length, routes: HF.routes.length, fields: HF.fields.length, docks: HF.docks.length,
    civic: ['barracks','infirmary','workshop','church','school','barn','kitchen'].filter(k => HF.buildings.some(b => b.kind === k)).length,
    leaks: (()=>{let n=0;for(let k=0;k<HN*HN;k++){if(!(HF.walk[k]&W_IN))continue;const i=k%HN,j=(k/HN)|0;for(let d=0;d<8;d++){const ii=i+DX8[d],jj=j+DY8[d];if(inMap(ii,jj)&&(HF.walk[tIdx(ii,jj)]&W_OUT))n++;}}return n;})(),
    gateLink: (()=>{ const f = hfFlow('all', HF.gate.outTile); return f[HF.gate.inTile] > 0; })(),
    outReach: (()=>{ const f = hfFlow('out', HF.gate.outTile); return HF.routes.every(r => f[tileOfW(r.pts[r.pts.length-1][0], r.pts[r.pts.length-1][1])] >= 0 || hfNearPass(r.pts[r.pts.length-1][0], r.pts[r.pts.length-1][1], 'out', 6) >= 0); })() })`));
  rep.map = m;
  check('map: ~62 homes (>=55 houses + RV/tents)', m.lots >= 55, m.lots);
  check('map: curved wall chain', m.walls >= 140, m.walls);
  check('map: 10 towers', m.towers === 10, m.towers);
  check('map: gate has inside+outside tiles', m.gateIn >= 0 && m.gateOut >= 0, [m.gateIn, m.gateOut]);
  check('map: wall seals inside from outside (no leaks)', m.leaks === 0, m.leaks);
  check('map: gate connects inside to outside', m.gateLink);
  check('map: civic sites', m.civic === 7, m.civic);
  check('map: wilderness POIs + 5 routes', m.pois >= 6 && m.routes === 5, [m.pois, m.routes]);
  check('map: fields + docks', m.fields > 20 && m.docks === 3, [m.fields, m.docks]);
}

// ---- 2) long run with forced major attack + siege
{
  const c = world(SEED);
  ev(c, `HS.next.major = 300; HS.next.siege = 1800;`);
  const T0 = Date.now(); let minAlive = 999, illegal = 0, bad = 0, maxStill = 0;
  ev(c, `globalThis.__in = new Map(); globalThis.__last = new Map();`);
  for (let s = 0; s < SECS; s++) {
    for (let i = 0; i < 10; i++) c.hsTick(0.1);
    const r = JSON.parse(ev(c, `(()=>{ let illegal = 0, bad = 0, still = 0;
      const legal = HF.breaches > 0 || HF.gate.open > 0.7;
      for (const z of HS.zombies) { if (z.st === 'dead') continue; const ins = isInside(z.x, z.y), was = __in.get(z.id); if (ins && !was && !legal && was !== undefined) illegal++; __in.set(z.id, ins); if (!isFinite(z.x) || !isFinite(z.y)) bad++; }
      for (const p of HS.people) { if (!p.alive) continue; if (!isFinite(p.x) || !isFinite(p.y)) { bad++; continue; } const k = tileOfW(p.x, p.y); if (!p.onTower && HF.occ[k] !== 4 && !hfPass(k, 'all') && hfNearPass(p.x, p.y, 'all', 2) < 0) bad++;
        const L = __last.get(p.id); const holding = p.act === 'stab' || (p.task && (p.task.k === 'defend' || p.task.k === 'gatepost')); if (p.path && !holding && L && Math.hypot(L[0]-p.x, L[1]-p.y) < 0.01) { L[2]++; still = Math.max(still, L[2]); } else __last.set(p.id, [p.x, p.y, 0]); }
      return JSON.stringify({ alive: HS.people.filter(p => p.alive).length, illegal, bad, still }); })()`));
    minAlive = Math.min(minAlive, r.alive); illegal += r.illegal; bad += r.bad; maxStill = Math.max(maxStill, r.still);
  }
  const st = JSON.parse(ev(c, 'JSON.stringify(HS.stats)')), fin = JSON.parse(ev(c, `JSON.stringify({ day: HS.day, alive: HS.people.filter(p=>p.alive).length, floor: HS.floor, log: HS.log.map(e=>e.k), zombies: HS.zombies.filter(z=>z.st!=='dead').length })`));
  rep.run = { secs: SECS, ms: Date.now() - T0, realtimeX: +(SECS * 1000 / (Date.now() - T0)).toFixed(1), stats: st, final: { day: fin.day, alive: fin.alive, zombies: fin.zombies }, minAlive };
  const L = fin.log;
  check('sim: no NaN / off-grid settlers or infected', bad === 0, bad);
  check('sim: infected never enter without a breach or open gate', illegal === 0, illegal);
  check('sim: no settler frozen on a path > 60 s', maxStill < 60, maxStill);
  check('sim: days advance', fin.day >= 1 + Math.floor(SECS / 1200), fin.day);
  check('sim: snipers fight (shots + kills)', st.shots > 100 && st.kills > 40, [st.shots, st.kills]);
  check('sim: minor encounters happen often', st.attacks.minor >= SECS / 150, st.attacks.minor);
  check('sim: major attack + siege fire', st.attacks.major >= 1 && st.attacks.siege >= 1, st.attacks);
  check('sim: alarm -> clear cycle (attack and recovery)', L.includes('alarm') && L.includes('clear'), null);
  check('sim: expeditions start and finish', st.exp >= 4 && (st.expOk + st.expHurt + st.expDead + st.expLost) >= 3, [st.exp, st.expOk, st.expHurt, st.expDead, st.expLost]);
  check('sim: wall damage gets repaired', st.repairs >= 1 || st.breaches === 0, [st.breaches, st.repairs]);
  check('sim: population stays viable (replenishment)', fin.alive >= fin.floor && minAlive >= fin.floor * 0.8, [minAlive, fin.alive, fin.floor, st.deaths, st.arrivals]);
}

// ---- 3) determinism: same seed, same story
{
  const run = () => { const c = world(SEED); for (let i = 0; i < 3000; i++) c.hsTick(0.1); return ev(c, 'JSON.stringify([HS.stats.shots, HS.stats.kills, HS.people.filter(p=>p.alive).length, HS.zombies.length, Math.round(HS.people[5].x*100)])'); };
  const a = run(), b = run(); check('sim: deterministic for a seed', a === b, [a, b]);
}

console.log(JSON.stringify(rep, null, 1));
console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'PASS (' + Object.keys(rep).filter(k => rep[k].ok !== undefined).length + ' checks)');
process.exit(fails.length ? 1 : 0);
