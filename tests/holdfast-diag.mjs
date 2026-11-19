// Holdfast behaviour diagnostics (Node): congestion, synchronized walking, speeds, idle/aimless share, threat activity.
// Usage: node tests/holdfast-diag.mjs [gameSeconds=1200] [seed=7]
import { loadHF, ev } from './hf-load.mjs';
const SECS = +(process.argv[2] || 1200), SEED = +(process.argv[3] || 7);
const c = loadHF(['js/core.js', 'js/art.js', 'holdfast/hf-map.js', 'holdfast/hf-art.js', 'holdfast/hf-sim.js', 'holdfast/hf-work.js']);
c.hfBuildMap(SEED); c.hsInit({ seed: SEED * 3 + 1, pop: 120, hour: 9 });
ev(c, `globalThis.__D = { samples: 0, crowd: 0, crowdMax: 0, pairs: 0, sync: 0, walkers: 0, still: new Map(), stuckMax: 0, wildZ: 0, outZ: 0, near: 0, hot: new Map(), act: {}, pr: new Map(), persist: 0, unrel: 0 };`);
const probe = `(()=>{ const D = __D; D.samples++;
  const ps = HS.people.filter(p => p.alive && p.vis && !p.onTower && isInside(p.x, p.y));
  // crowding: max people within 12 units of anyone (exclude intentional: eat at tables)
  let mx = 0; for (const a of ps) { let n = 0; for (const b of ps) if (a !== b && (a.x-b.x)**2 + (a.y-b.y)**2 < 144) n++; mx = Math.max(mx, n); if (n >= 5) { const key = (a.x/24|0)+','+(a.y/24|0); D.hot.set(key, (D.hot.get(key)||0)+1); } }
  D.crowdMax = Math.max(D.crowdMax, mx); D.crowd += mx;
  // overlaps: pairs closer than 2.5 units
  for (let i = 0; i < ps.length; i++) for (let j = i+1; j < ps.length; j++) if ((ps[i].x-ps[j].x)**2 + (ps[i].y-ps[j].y)**2 < 6.25) D.pairs++;
  // synchronized movement: walking pairs within 14 units moving in the same direction (cos>0.9), not in a shared group
  const GROUP = new Set(['shelter', 'defend', 'exp', 'rescue', 'arrive', 'respond', 'fight', 'eat']);
  const w = ps.filter(p => p.path && Math.hypot(p.x-p.px, p.y-p.py) > 0.001 && !p.exp && !p.rescue && !p.arriving && p.task && !GROUP.has(p.task.k));
  const pairNow = new Set();
  D.walkers += w.length;
  for (let i = 0; i < w.length; i++) for (let j = i+1; j < w.length; j++) { const a = w[i], b = w[j]; if ((a.x-b.x)**2 + (a.y-b.y)**2 > 196) continue; const ax = a.x-a.px, ay = a.y-a.py, bx = b.x-b.px, by = b.y-b.py; const cs = (ax*bx+ay*by)/(Math.hypot(ax,ay)*Math.hypot(bx,by)); if (cs > 0.9) { D.sync++; const key = Math.min(a.id,b.id)+'-'+Math.max(a.id,b.id); pairNow.add(key); const n = (D.pr.get(key)||0)+1; D.pr.set(key, n); if (n === 5) { D.persist++; if (a.role !== b.role && a.home.b !== b.home.b) D.unrel++; } } }
  for (const k of [...D.pr.keys()]) if (!pairNow.has(k)) D.pr.delete(k);
  for (const p of ps) { const k = p.task ? p.task.k + (p.path ? ':go' : '') : 'none'; D.act[k] = (D.act[k]||0)+1; }
  const zs = HS.zombies.filter(z => z.st !== 'dead'); D.outZ += zs.length;
  D.near += zs.filter(z => { const [u,v] = w2d(z.x,z.y); return v > wallV(u) - 120 && !isInside(z.x,z.y); }).length;
})()`;
for (let s = 0; s < SECS; s++) { for (let i = 0; i < 10; i++) c.hsTick(0.1); ev(c, probe); }
const r = JSON.parse(ev(c, `JSON.stringify({ samples: __D.samples, crowdAvg: +(__D.crowd/__D.samples).toFixed(2), crowdMax: __D.crowdMax, overlapPairsPerSample: +(__D.pairs/__D.samples).toFixed(2), syncPairsPerSample: +(__D.sync/__D.samples).toFixed(2), persistentPairsPerMin: +(__D.persist/__D.samples*60).toFixed(2), unrelatedPerMin: +(__D.unrel/__D.samples*60).toFixed(2), walkersPerSample: +(__D.walkers/__D.samples).toFixed(1), zAlive: +(__D.outZ/__D.samples).toFixed(1), zNearWall: +(__D.near/__D.samples).toFixed(1), hot: [...__D.hot].sort((a,b)=>b[1]-a[1]).slice(0,6), act: Object.fromEntries(Object.entries(__D.act).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k, +(v/__D.samples).toFixed(1)])), stats: HS.stats, speeds: [Math.min(...HS.people.map(p=>p.spd)), Math.max(...HS.people.map(p=>p.spd))] })`));
console.log(JSON.stringify(r, null, 1));
