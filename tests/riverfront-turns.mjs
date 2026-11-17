// Headless browser check of traffic routing at the three riverside junctions.
// Usage: python3 -m http.server 8765 &  node tests/riverfront-turns.mjs [url] [shotdir]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:8765/index.html?clean=1&time=noon&wx=clear';
const SHOTS = process.argv[3] || null;
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto(URL); await pg.waitForFunction(() => typeof SIM !== 'undefined' && SIM.lanes.length > 0, null, { timeout: 30000 });
const res = await pg.evaluate(() => {
  const out = { turns: {}, bad: [], samples: 0, offRoad: 0, promenade: 0, headBad: 0, close: 0, stuck: 0 };
  const last = new Map(), wasTurn = new Map(), enter = new Map();
  const roadAt = (x, y) => { const t = GT[gi(Math.floor(x / T), Math.floor(y / T))]; return t === G_ROAD || t === G_ZEB; };
  for (let f = 0; f < 20 * 60 * 6; f++) {   // 6 simulated minutes
    tick(0.05);
    for (const v of SIM.vehs) {
      const q = vehPos(v); out.samples++;
      const inW = q[0] >= 0 && q[1] >= 0 && q[0] < WORLD && q[1] < WORLD;   // spawn/despawn happens just off the map edge
      if (!inW) continue;
      if (q[0] < RJ.x0 + 2) { out.promenade++; if (out.bad.length < 8) out.bad.push(['promenade', v.kind, q.map(Math.round), v.lane.axis + v.lane.dir, !!v.turn]); }                       // anything west of the river road = on promenade/water
      if (!roadAt(q[0], q[1])) { out.offRoad++; if (out.bad.length < 5) out.bad.push(['offroad', v.kind, q.map(Math.round)]); }
      const p = last.get(v);
      if (p && v.sp > 4) { const dx = q[0] - p[0], dy = q[1] - p[1]; if (Math.hypot(dx, dy) > 0.05) { const di = v.turn ? v.turn.di : v.lane.di, exp = [[1, 0], [0, 1], [-1, 0], [0, -1]][di]; const dot = (dx * exp[0] + dy * exp[1]) / Math.hypot(dx, dy); if (dot < 0.2 && v.turn === null) { out.headBad++; if (out.bad.length < 5) out.bad.push(['heading', v.kind, di, dx.toFixed(2), dy.toFixed(2)]); } } }
      last.set(v, q);
      if (v.turn && !wasTurn.get(v)) { enter.set(v, v.lane); }
      if (!v.turn && wasTurn.get(v)) { const k = enter.get(v).axis + enter.get(v).dir + '->' + v.lane.axis + v.lane.dir; out.turns[k] = (out.turns[k] || 0) + 1; }
      wasTurn.set(v, !!v.turn);
    }
    for (let i = 0; i < SIM.vehs.length; i++) for (let j = i + 1; j < SIM.vehs.length; j++) { const a = SIM.vehs[i], c = SIM.vehs[j]; if ((a.mask & c.mask) === 0 && !a.turn && !c.turn) continue; const p = vehPos(a), r = vehPos(c); if (p[0] > 230 && p[0] < 290 && Math.abs(p[0] - r[0]) < 5 && Math.abs(p[1] - r[1]) < 5 && (a.turn || c.turn)) out.close++; }
    if (f % 200 === 0) for (const v of SIM.vehs) if (v.wait > 6.5) out.stuck++;
  }
  out.eastbound = SIM.lanes.filter(L => L.axis === 'x' && L.dir > 0).map(L => L.vehs.length);
  return out;
});
console.log(JSON.stringify(res, null, 1)); console.log('page errors:', errs.length ? errs : 'none');
if (SHOTS) {   // screenshots of each junction mid-traffic
  for (const [i, h] of [38, 78, 124].entries()) { await pg.goto(URL + `&look=32,${h + 2}&zoom=3&warp=40`); await pg.waitForFunction(() => typeof SIM !== "undefined" && SIM.lanes.length > 0, null, { timeout: 60000 }); await pg.waitForTimeout(3000); await pg.screenshot({ path: `${SHOTS}/junction${i + 1}.png` }); }
}
await b.close();
const need = ['y1->x1', 'y-1->x1', 'x-1->y-1', 'x-1->y1'];
const fail = errs.length || res.promenade || res.offRoad || res.headBad || need.some(k => !res.turns[k]);
console.log(fail ? 'FAIL' : 'PASS'); process.exit(fail ? 1 : 0);
