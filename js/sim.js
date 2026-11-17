'use strict';
// ===== Sài Gòn Lofi — simulation: traffic lanes, vehicles, pedestrians, stands, chatting, weather reactions =====
const SIM = { peds: [], vehs: [], lanes: [], actors: [], xpeds: [], sig: { ph: 0, t: 0 }, focus: [WORLD / 2, WORLD / 2], chatT: 2, moodT: 3, spawnT: 0, raining: false, dropT: 20, melonT: 8 };
// signal phases: [state of x-axis roads, state of y-axis roads, seconds]. 1 green, 2 yellow, 0 red
const SIG_PH = [[1, 0, 11], [2, 0, 2], [0, 0, 1.6], [0, 1, 11], [0, 2, 2], [0, 0, 1.6]];
const sigOf = ax => SIG_PH[SIM.sig.ph][ax];
function greenIn(ax) { let t = SIG_PH[SIM.sig.ph][2] - SIM.sig.t; for (let k = 1; k < 7; k++) { const ph = (SIM.sig.ph + k) % 6; if (SIG_PH[ph][ax] === 1) return t; t += SIG_PH[ph][2]; } return t; }
const near = (o, r) => Math.abs(o.x - SIM.focus[0]) + Math.abs(o.y - SIM.focus[1]) < (r || 460);
function freeOf(list, f, r) { const a = list.filter(s => !s.ped && near(s, r) && (!f || f(s))); return a.length ? pick(a) : null; }

// ---------- lanes & vehicles ----------
function initLanes() {
  const mkLane = (axis, dir, c, cs, stops, row) => { const L = { axis, dir, c, cs, row, lo: axis === 'x' ? ROADS_V[0] * T : 0, hi: WORLD, vehs: [], spawnT: rr(0, 4), want: null, di: axis === 'x' ? (dir > 0 ? 0 : 2) : (dir > 0 ? 1 : 3) }; L.stops = stops.map(p => dir > 0 ? p - L.lo : L.hi - p).sort((a, b) => a - b); SIM.lanes.push(L); };
  for (const h of ROADS_H) { mkLane('x', -1, h * T + 8, -1, ROADS_V.map(v => (v + RW + 2) * T + 2), h); mkLane('x', 1, h * T + 24, 1, ROADS_V.map(v => (v - 2) * T - 2), h); }
  for (const v of ROADS_V) { mkLane('y', 1, v * T + 8, -1, ROADS_H.map(h => (h - 2) * T - 2)); mkLane('y', -1, v * T + 24, 1, ROADS_H.map(h => (h + RW + 2) * T + 2)); }
}
const faceLane = L => L.axis === 'x' ? (L.cs > 0 ? 3 : 1) : (L.cs > 0 ? 2 : 0);   // direction a kerbside pedestrian looks to face this lane
const findLane = l => SIM.lanes.find(L => L.axis === l[0] && L.dir === l[1] && L.c === l[2]);
const VSPEED = { moto: [44, 58], cub: [36, 48], wave: [46, 62], scooter: [44, 58], sh: [46, 60], airblade: [50, 66], vision: [42, 54], vfscooter: [44, 56], grab: [46, 60], ship: [50, 66], bike: [19, 25], melonbike: [19, 24], melonmoto: [34, 44], melontruck: [30, 36], cyclo: [15, 19], taxi: [42, 52], vinasun: [46, 56], mailinh: [46, 56], xanhsm: [46, 56], car: [46, 56], suv: [46, 56], lam: [32, 38], truck: [36, 42], bus: [34, 40], ebus: [34, 40] };
const isTaxi = k => !!TAXIS[k];
function riderSheet(type) { const L = dressFor(randLook(type), G.season); L.carry = null; L.ganh = false; L.pack = 0; if (L.type !== 'monk' && L.hat !== 'helm' && Math.random() < ERA[G.era].helmet) { L.hat = 'helm'; L.b.hat = 'helm'; L.hatC = pick([0x2a2a30, 0xf2f2f0, 0xd9534f, 0x3d6fb5, 0xf2c94c, 0xf2a0b5, 0x8a8f98]); } if (G.rain > 0.3 && L.type !== 'monk') L.poncho = 1; return { look: L, sheet: personSheet(L) }; }
function makeVeh(lane, kind, s) {
  const v = ri(0, 7), m = vehModel(kind, v), sp = VSPEED[kind], tw = TWO_WHEEL[kind], small = tw || kind === 'bike' || kind === 'melonbike' || kind === 'cyclo';
  const o = { kind, v, lane, s, sp: 0, vmax: rr(sp[0], sp[1]), len: m.L, era: G.era, mask: small ? (tw && chance(0.5) ? 2 : 1) : 3, lat: 0, riders: [], stopAt: null, dwell: 0, dwellT: 0, onStop: null, busy: false, lc: 0, honk: rr(5, 40) };
  o.lat = o.latT = o.mask === 3 ? 0 : o.mask === 1 ? 4.2 : -3.8;
  if (kind === 'ship') { o.riders.push(riderSheet('shipper')); }
  else if (kind === 'grab') { o.riders.push(riderSheet('grabber')); if (chance(0.35)) o.riders.push(riderSheet(wpick([['modern', 3], ['fashion', 2], ['office', 2]]))); }
  else if (tw) { o.riders.push(riderSheet(G.era >= 2 ? wpick([['modern', 3], ['office', 2], ['fashion', 2], ['youth', 2], ['worker', 1], ['dobo', 1]]) : wpick([['youth', 3], ['office', 2], ['worker', 2], ['driver', 2], ['dress', 1], ['dobo', 1], ['oldman', 0.5]]))); if (chance(0.3) && kind !== 'melonmoto') o.riders.push(riderSheet(wpick([['youth', 2], ['dress', 2], ['kid', 2], ['aodai', 1], ['baba', 1]]))); }
  else if (kind === 'bike' || kind === 'melonbike') o.riders.push(riderSheet(wpick([['aodai', 3], ['kid', 2], ['youth', 2], ['oldman', 1], ['baba', 1.5]])));
  else if (kind === 'cyclo') { o.riders.push(riderSheet('driver')); if (chance(0.45)) { o.riders.push(riderSheet(wpick([['oldlady', 2], ['dress', 2], ['office', 1], ['baba', 2], ['aodai', 1]]))); o.busy = true; } }
  o.sp = o.vmax * 0.8;
  return o;
}
// ---------- riverside junctions: the three streets meet the riverside road (ROADS_V[0]) at a T; nothing continues west (promenade) ----------
// Plan: v.plan = {h, k}: k 'L'/'R' = turn off the river road onto street row h (eastbound), or 'WR'/'WL' = a westbound car turning onto the river road (north / south).
const RJ = { x0: ROADS_V[0] * T, x1: (ROADS_V[0] + RW) * T, p: 0 };                      // river road x-extent (240..272)
const rjLane = (axis, dir, c) => findLane([axis, dir, c]);
const bez = (a, b, c, u) => { const w = 1 - u; return [w * w * a[0] + 2 * w * u * b[0] + u * u * c[0], w * w * a[1] + 2 * w * u * b[1] + u * u * c[1]]; };
function planTurn(v) {   // returns the trigger s (lane distance where the turn starts) for a planned vehicle, plus its source/target lanes and exit point
  const L = v.lane, pl = v.plan, hy = pl.h * T;
  if (pl.k === 'WR' || pl.k === 'WL') { const to = pl.k === 'WR' ? rjLane('y', -1, RJ.x0 + 24) : rjLane('y', 1, RJ.x0 + 8); return { trig: laneS(L, RJ.x1) - 3, to, exit: pl.k === 'WR' ? [to.c, hy] : [to.c, hy + RW * T], P1: [to.c, L.c] }; }
  const to = rjLane('x', 1, hy + 24), eP = [RJ.x1, to.c];
  if (pl.k === 'L') return { trig: laneS(L, hy) - 3, to, exit: eP, P1: [L.c, to.c] };                      // southbound, left onto the street
  return { trig: laneS(L, hy + RW * T) - 3, to, exit: eP, P1: [L.c, to.c] };                               // northbound, right onto the street
}
const inBox = (x, y, hy, m) => x > RJ.x0 - m && x < RJ.x1 + m && y > hy - m && y < hy + RW * T + m;
function turnClear(v, pt) {   // nobody else in the junction box, nobody crossing it, room at the exit of the target lane
  const hy = v.plan.h * T;
  for (const o of SIM.vehs) {
    if (o === v || o.dead) continue;
    const q = vehPos(o);
    if (o.turn && (o.turn.to === pt.to || (o.turn.src === v.lane && o.turn.u < 0.6))) return false;   // one turn at a time into a lane / out of a lane
    if (o.lane !== v.lane && inBox(q[0], q[1], hy, 0)) return false;
    if (o.lane === pt.to && o.s - o.len / 2 < laneS(pt.to, pt.exit[pt.to.axis === 'x' ? 0 : 1]) + 26 + v.len) return false;
  }
  return true;
}
function startTurn(v, pt) {
  const P0 = vehPos(v), L2 = pt.to, s2 = laneS(L2, pt.exit[L2.axis === 'x' ? 0 : 1]);
  const P2 = L2.axis === 'x' ? [pt.exit[0], L2.c + v.lat * L2.cs] : [L2.c + v.lat * L2.cs, pt.exit[1]];
  const P1 = v.lane.axis === 'y' ? [P0[0], P2[1]] : [P2[0], P0[1]];   // keeps each vehicle's own lateral offset (two-wheelers ride beside cars)
  pt.P1 = P1;
  const len = (Math.hypot(pt.P1[0] - P0[0], pt.P1[1] - P0[1]) + Math.hypot(P2[0] - pt.P1[0], P2[1] - pt.P1[1]) + Math.hypot(P2[0] - P0[0], P2[1] - P0[1])) / 2;
  v.turn = { P0, P1: pt.P1, P2, len, u: 0, to: L2, s2, di: v.lane.di, src: v.lane, h: v.plan.h };
  v.plan = null;
}
function stepTurn(v, dt, L) {   // advance a turning vehicle along its curve; hand it to the target lane at the end
  const t = v.turn; t.u = Math.min(1, t.u + v.sp * dt / t.len); t.di = t.u < 0.5 ? L.di : t.to.di;
  if (t.u >= 1) { const i = L.vehs.indexOf(v); if (i >= 0) L.vehs.splice(i, 1); v.lane = t.to; v.s = t.s2; v.turn = null; t.to.vehs.push(v); }
}
function vehPos(v) { if (v.turn) return bez(v.turn.P0, v.turn.P1, v.turn.P2, v.turn.u); const L = v.lane, p = L.dir > 0 ? L.lo + v.s : L.hi - v.s, q = L.c + v.lat * L.cs; return L.axis === 'x' ? [p, q] : [q, p]; }
const laneS = (L, p) => L.dir > 0 ? p - L.lo : L.hi - p;
function trafficDensity() { const h = G.hour; let f = h < 5 ? 0.25 : h < 6.5 ? 0.6 : h < 9 ? 1.25 : h < 16 ? 0.9 : h < 19.5 ? 1.3 : h < 22 ? 0.75 : 0.4; if (G.rain > 0.5) f *= 0.8; return f; }
function updateVehicles(dt) {
  const dens = trafficDensity();
  if (G.tet) { SIM.melonT -= dt; if (SIM.melonT < 0) { SIM.melonT = rr(9, 22); const L = pick(SIM.lanes); if (!L.want) L.want = G.era >= 1 && chance(0.2) ? 'melontruck' : G.era === 0 || chance(0.35) ? 'melonbike' : 'melonmoto'; } }
  for (const L of SIM.lanes) {
    const ax = L.axis === 'x' ? 0 : 1, sg = sigOf(ax), vs = L.vehs;
    vs.sort((a, b) => b.s - a.s);
    for (let i = 0; i < vs.length; i++) {
      const v = vs[i], front = v.s + v.len / 2; let lim = 1e9, byLeader = false;
      if (v.turn) {   // mid-turn: slow, ignore lane logic, hand over at the end
        v.sp += clamp(Math.min(v.vmax, 24) - v.sp, -110 * dt, 34 * dt); v.s += v.sp * dt; stepTurn(v, dt, L);
        if (v.turn === null) i--; continue;
      }
      for (let j = i - 1; j >= 0; j--) if (vs[j].mask & v.mask) { const g = vs[j].s - vs[j].len / 2 - front - 3; if (g < lim) { lim = g; byLeader = true; } break; }
      if (!v.plan && L.axis === 'x' && L.dir < 0 && v.s < laneS(L, RJ.x1) - 8) v.plan = { h: L.row, k: chance(0.5) ? 'WR' : 'WL' };   // every westbound car (spawned, seeded, or leaving a kerb stand) must turn at the river road
      if (!v.plan && L.axis === 'y' && (L.c === RJ.x0 + 8 || L.c === RJ.x0 + 24)) for (const h of ROADS_H) {   // through traffic on the river road waits at the box edge while a car is turning across it
        const d = laneS(L, L.dir > 0 ? h * T : h * T + RW * T) - 3 - front;
        if (d > -1 && d < 30) for (const o of SIM.vehs) if (o.turn && o.turn.h === h && o.turn.src !== L && o.turn.to !== L && o.turn.u < 0.85) { if (d < lim) { lim = Math.max(d, 0); byLeader = false; } break; }
      }
      if (v.plan) {
        const pt = v.pt || (v.pt = planTurn(v)), d = pt.trig - v.s;
        if (d < 45) {   // approaching the junction: wait at the box edge until it is clear (gives up after 7 s so traffic never deadlocks)
          const ok = turnClear(v, pt) || (d < 1 && (v.wait = (v.wait || 0) + (v.sp < 2 ? dt : 0)) > 7);
          if (ok && d < 1) { v.pt = null; v.wait = 0; startTurn(v, pt); continue; }
          if (!ok && d < lim) { lim = Math.max(d, 0); byLeader = false; }
          if (d < -5) { v.pt = null; startTurn(v, pt); continue; }   // overshot while braking: turn anyway rather than leave the road
        }
      }
      if (sg !== 1) for (const st of L.stops) { const d = st - front; if (d > -3) { if (sg === 0 || d > 14) { if (d < lim) { lim = d; byLeader = false; } } break; } }
      for (const p of SIM.xpeds) { const pp = L.axis === 'x' ? p.x : p.y, pq = L.axis === 'x' ? p.y : p.x; if (Math.abs(pq - L.c) > 11) continue; const al = laneS(L, pp) - front; if (al > -3 && al < 22 && al - 5 < lim) { lim = al - 5; byLeader = false; } }
      if (v.stopAt !== null) { const d = v.stopAt - v.s; if (d > -2 && d < lim) { lim = d; byLeader = false; } if (Math.abs(d) < 2 && v.sp < 1.5) { v.dwellT += dt; if (v.dwellT > v.dwell) { const f = v.onStop; v.stopAt = null; v.onStop = null; v.dwellT = 0; if (f) f(v); } } }
      const vd = lim <= 0.6 ? 0 : Math.min(v.vmax * (G.rain > 0.5 ? 0.85 : 1), lim * 1.7 + 2);
      v.sp += clamp(vd - v.sp, -110 * dt, 34 * dt); if (v.sp < 0) v.sp = 0; v.s += v.sp * dt;
      v.lc -= dt;
      if (v.mask !== 3 && byLeader && lim < 18 && v.sp < v.vmax * 0.7 && v.lc <= 0 && v.stopAt === null) { const om = 3 - v.mask; let ok = true; for (const o of vs) if (o !== v && (o.mask & om) && o.s + o.len / 2 > v.s - 14 && o.s - o.len / 2 < v.s + 24) { ok = false; break; } if (ok) { v.mask = om; v.latT = om === 1 ? 4.2 : -3.8; v.lc = 2.5; } else v.lc = 0.6; }
      v.lat += clamp(v.latT - v.lat, -9 * dt, 9 * dt);
      v.honk -= dt; if (v.honk < 0) { v.honk = rr(18, 70); if (G.onSfx && v.kind !== 'bike' && v.kind !== 'melonbike' && v.kind !== 'cyclo' && !(G.era === 3 && Math.random() < 0.6) && onScreen(vehPos(v), 0)) G.onSfx(TWO_WHEEL[v.kind] ? 'beep' : 'horn'); if (G.onSfx && v.kind === 'bike' && onScreen(vehPos(v), 0)) G.onSfx('bell'); }
    }
    for (let i = vs.length - 1; i >= 0; i--) if (vs[i].s > L.hi - L.lo + 50 || (vs[i].obs && vs[i].stopAt === null && !onScreen(vehPos(vs[i]), 60))) { vs[i].dead = true; vs.splice(i, 1); }
    L.spawnT -= dt * dens;
    if (L.spawnT <= 0 || L.want) {
      // streets are fed from the riverside road: eastbound cars arrive by turning off it (they never appear on the promenade); westbound cars must turn onto it
      const feed = L.axis === 'x' && L.dir > 0, L0 = feed ? (chance(0.5) ? rjLane('y', 1, RJ.x0 + 8) : rjLane('y', -1, RJ.x0 + 24)) : L;
      let clear = true; for (const o of L0.vehs) if (o.s - o.len / 2 < 16) { clear = false; break; }
      if (clear) {
        const k = L.want || wpick(ERA[G.era].veh), v = makeVeh(L0, k, -24); if (L.want && k === 'cyclo') { v.riders.length = 1; v.busy = false; } L.want = null;
        if (feed) v.plan = { h: L.row, k: L0.dir > 0 ? 'L' : 'R' };
        else if (L.c === RJ.x0 + 8 || L.c === RJ.x0 + 24) { if (chance(0.4)) v.plan = { h: pick(ROADS_H), k: L.dir > 0 ? 'L' : 'R' }; }
        L0.vehs.push(v); SIM.vehs.push(v); L.spawnT = rr(1.6, 5.2);
      } else if (L.spawnT <= 0) L.spawnT = 0.4;
    }
  }
  SIM.vehs = SIM.vehs.filter(v => !v.dead);
  // stands (xe ôm / xích lô waiting at the kerb)
  for (const s of CITY.stands) {
    if (s.kind === 'cyclo' && G.era >= 2) { s.state = 'off'; s.ped = null; continue; }
    if (s.state === 'off') { s.state = 'away'; s.t = 2; }
    if (s.state === 'away') { s.t -= dt; if (s.t <= 0) { s.state = 'parked'; s.alpha = 0; s.driver = null; s.v = ri(0, 7); } }
    else { s.alpha = Math.min(1, (s.alpha === undefined ? 1 : s.alpha) + dt * 1.5); if (!s.driver) s.driver = riderSheet(s.kind === 'xeom' && ERA[G.era].xeom === 'grab' ? 'grabber' : 'driver'); s.nap = (s.nap || rr(4, 30)) - dt; if (s.nap < 0) { s.nap = rr(14, 40); s.bub = { k: pick(['zzz', 'dots', 'note', G.season === 'summer' ? 'sun' : 'zzz']), t: 2.6, a: 0 }; } if (s.bub) { s.bub.t -= dt; s.bub.a += dt; if (s.bub.t <= 0) s.bub = null; } }
  }
  // kerbside hails: find or request a taxi / cyclo for a waiting pedestrian
  for (const r of POI.ride) {
    if (r.veh && r.veh.dead) r.veh = null;
    if (!r.ped || r.veh) continue;
    const L = r.L || (r.L = findLane(r.lane)), sp = laneS(L, r.p); let best = null;
    for (const v of L.vehs) if ((isTaxi(v.kind) || (v.kind === 'cyclo' && r.ped.wantCyclo)) && !v.busy && v.stopAt === null && v.s < sp - 26 && (!best || v.s > best.s)) best = v;
    if (best) { r.veh = best; best.busy = true; best.stopAt = sp; best.dwell = 2; best.latT = isTaxi(best.kind) ? 1.6 : 4.4; best.onStop = v => { const p = r.ped; r.ped = null; r.veh = null; if (p && !p.dead) { p.dead = true; if (v.kind === 'cyclo') v.riders.push({ look: p.look, sheet: p.sheet }); ticker(isTaxi(v.kind) ? (v.kind === 'etaxi' ? 'Taxi điện êm ru vừa đón khách' : 'Taxi vừa đón một vị khách') : 'Xích lô thong thả chở khách dạo phố'); if (G.onSfx) G.onSfx('door'); } else v.busy = v.kind === 'cyclo' && v.riders.length > 1; v.latT = v.mask === 3 ? 0 : v.mask === 1 ? 4.2 : -3.8; }; }
    else if (!L.want) L.want = r.ped.wantCyclo ? 'cyclo' : pick(ERA[G.era].taxi);
  }
  // now and then a taxi drops someone off
  SIM.dropT -= dt;
  if (SIM.dropT < 0) { SIM.dropT = rr(16, 40); const r = pick(POI.ride); if (!r.ped && !r.veh && near(r)) { const L = r.L || (r.L = findLane(r.lane)), sp = laneS(L, r.p), v = L.vehs.find(v => isTaxi(v.kind) && !v.busy && v.s < sp - 40 && v.stopAt === null); if (v) { v.busy = true; v.stopAt = sp; v.dwell = 2; v.latT = 1.6; r.veh = v; v.onStop = v2 => { r.veh = null; v2.busy = false; v2.latT = 0; const p = new Ped(r.x, r.y); p.dir = (faceLane(L) + 2) % 4; SIM.peds.push(p); p.say(pick(['smile', 'money', 'note']), 2); makePlan(p); if (G.onSfx) G.onSfx('door'); }; } } }
}

// ---------- pedestrians ----------
const goStep = (x, y) => ({ t: 'go', x, y });
const MOOD = { spring: ['flower', 'note', 'heart', 'smile', 'flower'], summer: ['sun', 'drop', 'cup', 'smile', 'note'], fall: ['leaf', 'note', 'smile', 'leaf', 'heart'], winter: ['snow', 'dots', 'heart', 'snow', 'cup'] };
const CHAT = ['smile', 'laugh', 'heart', 'note', 'q', 'ex', 'cup', 'pho', 'money', 'moto', 'banhmi', 'dots', 'star', 'laugh'];
function onScreen(p, m) { return G.onScreen ? G.onScreen(p[0], p[1], m) : true; }
class Ped {
  constructor(x, y, look) {
    this.x = x; this.y = y; this.look = look || dressFor(randLook(), G.season); this.resheet();
    this.dir = ri(0, 3); this.sp = rr(10.5, 14.5) * (this.look.kid ? 1.12 : this.look.type === 'oldman' || this.look.type === 'oldlady' ? 0.72 : this.look.ganh ? 0.8 : 1);
    this.ox = rr(-2.6, 2.6); this.oy = rr(-2.6, 2.6); this.steps = []; this.path = null; this.pi = 0; this.st = 'idle'; this.cur = null;
    this.an = Math.random() * 4; this.pose = 0; this.alpha = 0; this.fade = 1; this.bub = null; this.umb = 0; this.umbT = 0; this.cc = rr(3, 18); this.wt = 0; this.sit = false; this.dead = false; this.res = null; this.chat = null; this.run = false; this.moving = false;
    if (SIM.raining) rainReact(this, true);
  }
  resheet() { this.sheet = personSheet(this.look); }
  say(k, t) { this.bub = { k, t: t || 2.4, a: 0 }; }
  release() { if (this.res) { if (this.res.ped === this) this.res.ped = null; this.res = null; } }
  reserve(s) { this.release(); s.ped = this; this.res = s; }
  tile() { return [clamp(Math.floor(this.x / T), 0, N - 1), clamp(Math.floor(this.y / T), 0, N - 1)]; }
  next() {
    const c = this.cur = this.steps.shift() || null; this.moving = false;
    if (!c) { this.st = 'idle'; return; }
    if (c.t === 'go') { const a = this.tile(), s = WALK[gi(a[0], a[1])] ? a : nearestWalk(a[0], a[1]), b = nearestWalk(Math.floor(c.x / T), Math.floor(c.y / T)); this.path = s && b ? findPath(s[0], s[1], b[0], b[1]) : null; if (!this.path) { this.next(); return; } this.pi = 0; this.st = 'walk'; }
    else if (c.t === 'to') this.st = 'to';
    else if (c.t === 'wait' || c.t === 'hail') { this.st = c.t; this.wt = c.dur; if (c.dir !== undefined) this.dir = c.dir; this.pose = c.pose || 0; this.sit = this.pose === 5; if (c.em) this.say(c.em, 2.6); this.emT = rr(4, 8); }
    else if (c.t === 'do') { c.fn(this); if (!this.dead) this.next(); }
    else if (c.t === 'exit') { this.fade = -1; this.st = 'gone'; }
  }
  moveTo(gx, gy, dt) {
    const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy), st = this.sp * (this.run ? 1.65 : 1) * dt;
    if (d > 0.01) this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3);
    this.moving = true; this.an += dt * this.sp * (this.run ? 1.5 : 1) / 3.1;
    if (d <= st) { this.x = gx; this.y = gy; return true; }
    this.x += dx / d * st; this.y += dy / d * st; return false;
  }
  update(dt) {
    if (this.bub) { this.bub.t -= dt; this.bub.a += dt; if (this.bub.t <= 0) this.bub = null; }
    this.alpha = clamp(this.alpha + this.fade * dt * 2.6, 0, 1); if (this.fade < 0 && this.alpha <= 0) { this.dead = true; return; }
    this.umb += clamp(this.umbT - this.umb, -dt * 3.2, dt * 3.2); this.cc -= dt;
    if (this.rainT !== undefined) { this.rainT -= dt; if (this.rainT <= 0) { this.rainT = undefined; this.rainFn(); } }
    if (this.chat) { const c = this.chat; this.moving = false; c.t -= dt; c.n -= dt; this.pose = c.turn && c.n > 0.5 ? 7 : 0; if (c.n <= 0) { c.n = 1.3; c.turn = !c.turn; if (c.turn) this.say(pick(CHAT), 1.15); } if (c.t <= 0 || c.o.dead) { this.chat = null; this.pose = 0; this.cc = rr(25, 60); } return; }
    const c = this.cur;
    if (this.st === 'idle') { this.next(); if (!this.cur && !this.dead) { makePlan(this); if (!this.steps.length) this.steps.push({ t: 'exit' }); } }
    else if (this.st === 'walk') {
      const idx = this.path[this.pi]; if (idx === undefined) { this.next(); return; }
      const a = this.tile(), ct = GT[gi(a[0], a[1])], tx = idx % N, ty = (idx / N) | 0;
      if (GT[idx] === G_ZEB && ct !== G_ZEB && ct !== G_ROAD) { const ax = roadH(ty) >= 0 && roadV(tx) < 0 ? 0 : 1; if (sigOf(ax) !== 0 || greenIn(ax) < 3.6) { this.moving = false; this.pose = 0; return; } }
      if (ct === G_ZEB || ct === G_ROAD) SIM.xpeds.push(this);
      if (this.moveTo(tc(tx) + this.ox, tc(ty) + this.oy, dt)) this.pi++;
    }
    else if (this.st === 'to') { if (this.moveTo(c.x, c.y, dt)) this.next(); }
    else if (this.st === 'wait') {
      this.wt -= dt; this.emT -= dt;
      if (c.ems && this.emT <= 0) { this.emT = rr(5, 10); this.say(pick(c.ems), 2.2); }
      if (c.anim) this.pose = (G.t * 2.4 | 0) % 2 ? 7 : 0;
      if (c.until && c.until()) this.wt = 0;
      if (this.wt <= 0) { this.sit = false; this.pose = 0; this.next(); }
    }
    else if (this.st === 'hail') { this.wt -= dt; this.emT -= dt; this.pose = (G.t * 1.5 | 0) % 3 ? 6 : 0; if (this.emT <= 0) { this.emT = 5; this.say(this.wantCyclo ? 'cyclo' : 'taxi', 2); } if (this.wt <= 0) { this.release(); this.pose = 0; this.say('dots', 2); this.next(); } }
  }
}
function portal() {
  for (let k = 0; k < 12; k++) { const a = Math.random() * TAU, r = rr(520, 640), t = nearestWalk(Math.floor(clamp(SIM.focus[0] + Math.cos(a) * r, 12, WORLD - 12) / T), Math.floor(clamp(SIM.focus[1] + Math.sin(a) * r, 12, WORLD - 12) / T)); if (t && GT[gi(t[0], t[1])] === G_SIDE) return [tc(t[0]), tc(t[1])]; }
  return [tc(ROADS_V[1] - 2), tc(4)];
}
function exitSteps(p) {
  if (chance(0.32)) { const d = freeOfDoor(p, 520); if (d) return [goStep(d.x, d.y), { t: 'to', x: d.ix, y: d.iy }, { t: 'exit' }]; }
  const q = portal(); return [goStep(q[0], q[1]), { t: 'exit' }];
}
function freeOfDoor(p, r) { const a = POI.doors.filter(d => Math.abs(d.x - p.x) + Math.abs(d.y - p.y) < r && near(d, 560)); return a.length ? pick(a) : null; }
function seatSteps(p, s, dur, em, ems, after) {
  p.reserve(s);
  p.steps.push(goStep(s.vx, s.vy), { t: 'to', x: s.x, y: s.y }, { t: 'wait', dur, pose: 5, dir: s.dir, em, ems }, { t: 'do', fn: q => { q.release(); if (after) after(q); } }, { t: 'to', x: s.vx, y: s.vy });
}
function makePlan(p) {
  const h = G.hour, S = G.season, wet = G.rain > 0.3, day = h > 6.2 && h < 21.5, st = p.steps, L = p.look;
  if (p.dog !== undefined) { for (let i = 0; i < 4; i++) { const t = nearestWalk(Math.floor((p.x + rr(-110, 110)) / T), Math.floor((p.y + rr(-110, 110)) / T)); if (t) st.push(goStep(tc(t[0]), tc(t[1])), { t: 'wait', dur: rr(2, 9), pose: 0 }); } if (!near(p, 700)) st.push({ t: 'exit' }); return; }
  if (L.ganh) { for (let i = 0; i < 4; i++) { const d = freeOfDoor(p, 260); if (d) st.push(goStep(d.x, d.y), { t: 'wait', dur: rr(3, 6), dir: (d.dir + 2) % 4, em: pick(['banhmi', 'pho', 'cup', 'note']) }); } st.push(...exitSteps(p)); return; }
  if (L.type === 'monk') { st.push(...exitSteps(p)); return; }
  const kidAM = L.kid && h > 6 && h < 8;
  const k = wpick([['pass', 2.4], ['cafe', day && !kidAM ? (h < 10 ? 3 : 2) : 0.2], ['eat', h > 5.5 && h < 22 ? 2.2 : 0.3], ['drink', S === 'summer' ? 3 : 1.4], ['barber', day && !L.fem && !L.kid ? 1.1 : 0], ['xeom', 1.5], ['taxi', L.kid ? 0 : 1], ['cyclo', L.kid || G.era >= 2 ? 0 : 0.9], ['door', (h > 6 && h < 9) || (h > 16.5 && h < 19) ? 3.2 : 1.6], ['market', day ? 1.8 : 0], ['melon', G.tet && h > 6 && h < 21.5 ? 4 : 0], ['park', wet ? 0.2 : (h > 5 && h < 8) || (h > 16 && h < 20) ? 2.6 : 1.4], ['school', kidAM ? 6 : 0], ['river', day ? [1.2, 1.7, 2.1, 2.1][G.era] : 0.3], ['boat', G.era >= 2 ? 1 : 0.4]]);
  let s;
  if (k === 'cafe' && (s = freeOf(POI.cafe, q => q.k === 'cafe'))) seatSteps(p, s, rr(18, 40), 'cup', ['note', 'cup', 'smile', 'zzz', 'heart', 'dots'], q => { if (chance(0.3)) ticker('Thêm một ly cà phê sữa đá, ngồi ngắm phố'); });
  else if (k === 'eat' && (s = freeOf(POI.eat))) { p.reserve(s); st.push(goStep(s.x, s.y), { t: 'wait', dur: rr(2.6, 4), dir: s.dir, em: 'dots' }, { t: 'do', fn: q => { q.release(); q.say(s.icon, 2.4); if (s.carry) { q.look.carry = s.carry; q.resheet(); } if (chance(0.5)) ticker(s.icon === 'pho' ? 'Một tô phở nóng hổi vừa ra lò' : s.icon === 'banhmi' ? 'Bánh mì Sài Gòn, đặc biệt thơm bơ!' : 'Một ly chè mát lạnh giữa phố'); } }); const t = !s.carry && freeOf(POI.cafe, q => q.k === 'eat', 300); if (t) seatSteps(p, t, rr(12, 22), s.icon, ['smile', s.icon, 'note']); }
  else if (k === 'drink' && (s = freeOf(POI.drink))) { p.reserve(s); st.push(goStep(s.x, s.y), { t: 'wait', dur: rr(2.2, 3.4), dir: s.dir, em: 'dots' }, { t: 'do', fn: q => { q.release(); q.look.carry = 'cup'; q.resheet(); q.say('cup', 2.4); ticker('Cạch! Một lon nước mát lạnh vừa rơi ra từ máy bán nước'); if (G.onSfx) G.onSfx('vend'); } }); }
  else if (k === 'barber' && (s = freeOf(POI.barber))) seatSteps(p, s, rr(15, 24), 'scissors', ['scissors', 'scissors', 'dots', 'star'], q => { q.say('star', 2.4); q.look.hs = pick([0, 6]); q.resheet(); ticker('Hớt tóc vỉa hè: xoẹt xoẹt… đẹp trai rồi đó!'); });
  else if ((k === 'xeom' || k === 'cyclo') && (s = CITY.stands.find(q => q.kind === k && q.state === 'parked' && !q.ped && near(q) && (q.alpha || 1) > 0.9))) { s.ped = p; p.res = s; st.push(goStep(s.wx, s.wy), { t: 'wait', dur: 1.8, em: k === 'xeom' ? 'moto' : 'cyclo', dir: s.wx < s.x ? 0 : s.wx > s.x ? 2 : s.wy < s.y ? 1 : 3 }, { t: 'do', fn: q => boardStand(q, s) }); return; }
  else if ((k === 'taxi' || k === 'cyclo') && (s = freeOf(POI.ride, q => !q.veh))) { p.wantCyclo = k === 'cyclo'; p.reserve(s); st.push(goStep(s.x, s.y), { t: 'hail', dur: 30, dir: faceLane(findLane(s.lane)) }); }
  else if (k === 'melon' && (s = freeOf(POI.melon))) { p.reserve(s); st.push(goStep(s.x, s.y), { t: 'wait', dur: rr(3, 6.5), dir: s.dir, em: pick(['melon', 'dots']) }, { t: 'do', fn: q => { q.release(); if (!G.tet) return; q.look.carry = 'melon'; q.resheet(); q.say(pick(['money', 'melon', 'smile']), 2.4); if (chance(0.3)) ticker(pick(['Dưa hấu đỏ ruột, mua về cúng Tết nè!', 'Dưa hấu ngày Tết: mong cả năm đỏ may mắn', 'Chú ơi, bổ thử trái dưa này coi!'])); } }); }
  else if (k === 'market' && (s = freeOf(POI.market))) { p.reserve(s); st.push(goStep(s.x, s.y), { t: 'wait', dur: rr(3, 7), dir: s.dir, em: 'dots' }, { t: 'do', fn: q => { q.release(); q.look.carry = 'shop'; q.resheet(); q.say(pick(['money', 'smile', 'banhmi']), 2.2); } }); }
  else if (k === 'park') { if (chance(0.55) && (s = freeOf(POI.bench))) seatSteps(p, s, rr(12, 30), pick(MOOD[S]), MOOD[S].concat(['zzz', 'note'])); else if ((s = freeOf(POI.look))) { p.reserve(s); st.push(goStep(s.x, s.y), { t: 'wait', dur: rr(5, 11), dir: s.dir !== undefined ? s.dir : ri(0, 3), em: pick(MOOD[S]), ems: MOOD[S] }, { t: 'do', fn: q => q.release() }); } }
  else if (k === 'river' && (s = freeOf(POI.river))) { p.reserve(s); st.push(goStep(s.x, s.y), { t: 'wait', dur: rr(8, 20), dir: s.dir, em: pick(RIVER_MOOD), ems: RIVER_MOOD }, { t: 'do', fn: q => q.release() }); }
  else if (k === 'boat' && (s = freeOf(POI.pier))) { p.reserve(s); st.push(goStep(s.x, s.y), { t: 'wait', dur: 45, dir: 2, em: 'boat', ems: ['boat', 'dots', 'smile'], until: () => BOATDOCK.on }, { t: 'do', fn: q => { q.release(); if (BOATDOCK.on) q.dead = true; } }); }
  else if (k === 'school') { const d = POI.doors.find(q => q.school); if (d) { st.push(goStep(d.x, d.y), { t: 'to', x: d.ix, y: d.iy }, { t: 'exit' }); return; } }
  else if (k === 'door') { const d = freeOfDoor(p, 420); if (d) { st.push(goStep(d.x, d.y), { t: 'to', x: d.ix, y: d.iy }, { t: 'exit' }); return; } }
  if (st.length && chance(0.3) && !p.again) { p.again = true; st.push({ t: 'do', fn: q => makePlan(q) }); return; }
  st.push(...exitSteps(p));
}
function boardStand(p, s) {
  if (s.state !== 'parked') { p.res = null; return; }
  const L = findLane(s.lane), v = makeVeh(L, s.kind === 'xeom' ? ERA[G.era].xeom : 'cyclo', laneS(L, s.p));
  v.v = s.v; v.riders = [s.driver || riderSheet('driver'), { look: p.look, sheet: p.sheet }]; v.sp = 0; v.busy = true; v.mask = 1; v.lat = 6; v.latT = 4.2;
  L.vehs.push(v); SIM.vehs.push(v); s.state = 'away'; s.t = rr(22, 44); s.ped = null; s.driver = null; p.res = null; p.dead = true;
  ticker(s.kind === 'xeom' ? (ERA[G.era].xeom === 'grab' ? 'Tài xế công nghệ vừa nhận cuốc qua app' : '“Xe ôm hông em?” — một cuốc xe vừa lăn bánh') : 'Xích lô chở khách thong dong qua phố'); if (G.onSfx) G.onSfx('moto');
}
function spawnPed() {
  const h = G.hour, r = Math.random(); let p;
  const type = r < ERA[G.era].hawker ? 'hawker' : (h > 5.5 && h < 7 && chance(0.06)) ? 'monk' : undefined;
  if (chance(0.62) || type) { const q = portal(); p = new Ped(q[0], q[1], type ? dressFor(randLook(type), G.season) : undefined); p.alpha = 1; }
  else { const a = POI.doors.filter(d => near(d, 520)); if (!a.length) return; const d = pick(a); p = new Ped(d.ix, d.iy); p.dir = (d.dir + 2) % 4; p.steps.push({ t: 'to', x: d.x, y: d.y }); if (d.shop && chance(0.5)) { p.look.carry = d.shop === 'banh' ? 'banhmi' : d.shop === 'cafe' || d.shop === 'che' ? 'cup' : d.shop === 'cho' || d.shop === 'taphoa' ? 'shop' : p.look.carry; p.resheet(); } }
  makePlan(p); SIM.peds.push(p);
}
function popTarget() { const h = G.hour; let f = h < 4.5 ? 0.2 : h < 6 ? 0.55 : h < 9 ? 1.15 : h < 16.5 ? 0.95 : h < 20 ? 1.2 : h < 22.5 ? 0.7 : 0.32; if (G.rain > 0.5) f *= 0.72; if (G.season === 'winter') f *= 0.9; return Math.round(74 * f); }
// rain: umbrellas open, ponchos go on, some people run for the nearest awning
function rainReact(p, instant) {
  const L = p.look; if (p.dog !== undefined || L.type === 'monk' && false) return;
  const mode = L.rainMode;
  if (mode === 'umb') { if (instant) { p.umbT = 1; p.umb = 1; } else { p.rainT = rr(0.2, 2.2); p.rainFn = () => { p.umbT = 1; }; } }
  else if (mode === 'poncho') { const f = () => { if (!L.poncho) { L.poncho = 1; p.resheet(); } }; if (instant) f(); else { p.rainT = rr(0.6, 3.5); p.rainFn = f; } }
  else {
    p.run = true;
    if (!instant && p.st === 'walk' && !L.ganh && near(p, 420)) { const s = POI.shelter.filter(q => !q.ped && Math.abs(q.x - p.x) + Math.abs(q.y - p.y) < 190)[0]; if (s) { p.reserve(s); p.steps = [goStep(s.x, s.y), { t: 'to', x: s.x, y: s.y }, { t: 'wait', dur: 120, until: () => G.rain < 0.12, dir: ri(0, 1), em: 'drop', ems: ['drop', 'dots', 'umb'] }, { t: 'do', fn: q => { q.release(); q.run = false; } }]; p.st = 'idle'; p.cur = null; p.say('ex', 1.2); } }
  }
}
function rainStop(p) { const L = p.look; p.umbT = 0; p.run = false; if (L.poncho) { p.rainT = rr(3, 14); p.rainFn = () => { L.poncho = 0; p.resheet(); }; } }
function reseasonPeds() {
  for (const p of SIM.peds) { dressFor(p.look, G.season); p.resheet(); }
  for (const a of SIM.actors) { dressFor(a.look, G.season); a.sheet = personSheet(a.look); }
  for (const v of SIM.vehs) for (const r of v.riders) { dressFor(r.look, G.season); r.sheet = personSheet(r.look); }
  for (const s of CITY.stands) if (s.driver) { dressFor(s.driver.look, G.season); s.driver.sheet = personSheet(s.driver.look); }
}
function updatePeds(dt) {
  const wet = G.rain > 0.25;
  if (wet && !SIM.raining) { SIM.raining = true; ticker('Mưa rồi! Bà con bung dù, mặc áo mưa, chạy vô mái hiên'); for (const p of SIM.peds) if (!p.sit) rainReact(p); for (const v of SIM.vehs) for (const r of v.riders) if (!r.look.poncho && chance(0.85)) { r.look.poncho = 1; r.sheet = personSheet(r.look); } for (const p of SIM.peds) if (p.sit && p.res && p.res.k === 'bench') p.wt = Math.min(p.wt, rr(0.3, 2)); }
  else if (!wet && SIM.raining && G.rain < 0.1) { SIM.raining = false; for (const p of SIM.peds) rainStop(p); for (const v of SIM.vehs) for (const r of v.riders) if (r.look.poncho && chance(0.6)) { r.look.poncho = 0; r.sheet = personSheet(r.look); } }
  SIM.xpeds.length = 0;
  for (const p of SIM.peds) p.update(dt);
  for (const p of SIM.peds) if (p.dead) p.release();
  SIM.peds = SIM.peds.filter(p => !p.dead);
  SIM.spawnT -= dt; const n = SIM.peds.length, tg = popTarget();
  if (SIM.spawnT <= 0 && n < tg) { SIM.spawnT = n < tg * 0.7 ? 0.25 : rr(0.6, 1.6); spawnPed(); }
  // chatting pairs
  SIM.chatT -= dt;
  if (SIM.chatT <= 0 && n > 2) {
    SIM.chatT = rr(0.5, 1.2); const a = pick(SIM.peds);
    if (a.st === 'walk' && a.moving && !a.chat && a.cc <= 0 && !a.run && a.dog === undefined && onScreen([a.x, a.y], 10)) {
      const ta = a.tile(); if (GT[gi(ta[0], ta[1])] !== G_ZEB && GT[gi(ta[0], ta[1])] !== G_ROAD)
        for (const b of SIM.peds) { if (b === a || b.st !== 'walk' || b.chat || b.cc > 0 || b.run || b.dog !== undefined) continue; const dx = b.x - a.x, dy = b.y - a.y; if (Math.abs(dx) + Math.abs(dy) > 15 || Math.abs(dx) + Math.abs(dy) < 5) continue; const tb = b.tile(); if (GT[gi(tb[0], tb[1])] === G_ZEB) continue; const t = rr(4.5, 9); a.chat = { o: b, t, n: 0.2, turn: false }; b.chat = { o: a, t, n: 0.85, turn: true }; a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); b.dir = (a.dir + 2) % 4; a.say(pick(['smile', 'ex', 'laugh']), 1.1); break; }
    }
  }
  // little mood bubbles
  SIM.moodT -= dt;
  if (SIM.moodT <= 0 && n) { SIM.moodT = rr(1.6, 4); const p = pick(SIM.peds); if (!p.bub && !p.chat && p.alpha > 0.9 && onScreen([p.x, p.y], 0)) { const h = G.hour; p.say(SIM.raining ? pick(['drop', 'umb', 'drop', 'dots']) : G.hot && chance(0.6) ? pick(['sun', 'drop', 'cup']) : (h > 21.5 || h < 5) && chance(0.5) ? pick(['zzz', 'star', 'note']) : pick(MOOD[G.season]), 2.2); } }
  for (const a of SIM.actors) { if (a.bub) { a.bub.t -= dt; a.bub.a += dt; if (a.bub.t <= 0) a.bub = null; } a.emT -= dt; if (a.emT <= 0) { a.emT = rr(9, 30); if (onScreen([a.x, a.y], 0)) a.bub = { k: a.role === 'barber' ? 'scissors' : a.role === 'mech' ? pick(['moto', 'dots']) : pick(['note', 'smile', 'money', 'ex', 'dots']), t: 2.2, a: 0 }; } if (a.role === 'barber') { const s = POI.barber.find(q => Math.abs(q.x - a.x) + Math.abs(q.y - a.y) < 14); a.pose = s && s.ped && s.ped.sit ? ((G.t * 3 | 0) % 2 ? 7 : 6) : 0; } else if (a.role === 'vendor') a.pose = (G.t * 0.7 + a.x | 0) % 5 === 0 ? 7 : 0; }
}
// era change: old-era walkers drift away, old vehicles hurry off, waiting drivers change over
function eraShift() {
  for (const p of SIM.peds) { if (p.dog !== undefined) continue; p.old = true; if (!p.sit && !p.chat && p.st !== 'hail' && chance(0.6)) { p.release(); p.steps = [{ t: 'wait', dur: rr(0, 5), pose: 0 }].concat(exitSteps(p)); p.st = 'idle'; p.cur = null; } }
  for (const v of SIM.vehs) { v.obs = !ERA[G.era].veh.some(e => e[0] === v.kind); v.vmax *= v.obs ? 1.5 : 1.15; }   // out-of-era vehicles hurry off and vanish once off screen
  for (const s of CITY.stands) { s.driver = null; s.alpha = 0; }
  riverEraShift();
  SIM.spawnT = 0;
}
function updateSim(dt) {
  const s = SIM.sig; s.t += dt; if (s.t >= SIG_PH[s.ph][2]) { s.t = 0; s.ph = (s.ph + 1) % 6; }
  updatePeds(dt); updateVehicles(dt); updateBoats(dt);
}
function initSim() {
  initLanes();
  for (const a of CITY.actors) { const L = dressFor(randLook(a.type), G.season); L.carry = null; L.ganh = false; if (a.apron) L.apron = 1; SIM.actors.push({ x: a.x, y: a.y, dir: a.dir, pose: a.pose || 0, sit: a.pose === 5, role: a.role, look: L, sheet: personSheet(L), bub: null, emT: rr(2, 20) }); }
  for (const L of SIM.lanes) {
    let s = L.axis === 'x' ? rr(70, 140) : rr(20, 120);                                         // x lanes start east of the junction box (240..272)
    while (s < L.hi - L.lo - 20) {
      const wb = L.axis === 'x' && L.dir < 0;
      if (!(wb && s > L.hi - RJ.x1 - 40)) { const v = makeVeh(L, wpick(ERA[G.era].veh), s); if (L.axis === 'y' && (L.c === RJ.x0 + 8 || L.c === RJ.x0 + 24) && chance(0.4)) { const h = pick(ROADS_H), pl = { h, k: L.dir > 0 ? 'L' : 'R' }; v.plan = pl; if (planTurn(v).trig < v.s + 20) v.plan = null; } L.vehs.push(v); SIM.vehs.push(v); }
      s += rr(60, 190);
    }
  }
  for (let i = 0; i < 3; i++) { const q = portal(), p = new Ped(q[0], q[1]); p.dog = i; p.sp = 17; p.look.rainMode = 'run'; SIM.peds.push(p); }
  const tg = popTarget();
  for (let i = 0; i < tg; i++) { spawnPed(); const p = SIM.peds[SIM.peds.length - 1]; if (p && p.alpha === 1 && chance(0.8)) { const t = nearestWalk(Math.floor((SIM.focus[0] + rr(-380, 380)) / T), Math.floor((SIM.focus[1] + rr(-380, 380)) / T)); if (t) { p.x = tc(t[0]); p.y = tc(t[1]); } } }
}
