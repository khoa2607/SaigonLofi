'use strict';
// ===== Holdfast — autonomous simulation: settlers, infected, wildlife, combat, expeditions, director (no DOM, no canvas) =====
const DAY_SEC = 1200;                                   // one in-game day = 20 real minutes
const DANGER = { calm: { n: 0.55, die: 0.12, iv: 1.4 }, standard: { n: 1, die: 0.35, iv: 1 }, grim: { n: 1.6, die: 0.6, iv: 0.75 } };
const FIXED_H = { morning: 8, noon: 12.5, dusk: 18.6, night: 22.5 };
const HS = {
  t: 0, day: 1, hour: 6.5, life: 6.5, timeMode: 'auto', wxMode: 'auto', weather: 'clear', seasonMode: 'auto', season: 'summer', danger: 'standard',
  people: [], zombies: [], wild: [], fx: [], noises: [], log: [], exps: [], rescues: [], arrivals: [], spots: new Map(),
  alarm: 0, alarmT: 0, mode: 'peace', target: 120, floor: 90, R: null, next: {}, stats: { shots: 0, kills: 0, deaths: 0, injuries: 0, arrivals: 0, exp: 0, expLost: 0, expOk: 0, expHurt: 0, expDead: 0, rescues: 0, breaches: 0, repairs: 0, attacks: { minor: 0, medium: 0, major: 0, siege: 0 }, zInside: 0, breachMax: 0 },
  onEvent: null, sound: null, pid: 0, zid: 0
};
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const ROLE_MIX = [['guard', 30], ['farmer', 16], ['builder', 8], ['tech', 5], ['medic', 4], ['cook', 4], ['fisher', 6], ['scav', 9], ['trader', 6], ['teacher', 1], ['elder', 8], ['kid', 14], ['adult', 9]];
const rr2 = (a, b) => a + HS.R() * (b - a), pickR = a => a[Math.floor(HS.R() * a.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function hsLog(k, p, bad) { const e = { day: HS.day, h: HS.hour, k, p: p || {}, bad: !!bad }; HS.log.push(e); if (HS.log.length > 80) HS.log.shift(); if (HS.onEvent) HS.onEvent(e); }
function hsSound(k, x, y, v) { if (HS.sound) HS.sound(k, x, y, v); }

// ---------------------------------------------------------------- setup
function hsInit(opt) {
  opt = opt || {}; HS.R = mulberry32(opt.seed || 11); HS.target = opt.pop || 120; HS.floor = Math.round(HS.target * 0.75);
  HS.people = []; HS.zombies = []; HS.wild = []; HS.fx = []; HS.noises = []; HS.log = []; HS.exps = []; HS.rescues = []; HS.arrivals = [];
  HS.t = 0; HS.day = 1; HS.hour = HS.life = opt.hour || 7.5;
  HF.breaches = 0;
  const scale = HS.target / 120, roles = [];
  for (const [r, n] of ROLE_MIX) for (let i = 0; i < Math.max(r === 'teacher' ? 1 : 1, Math.round(n * scale)); i++) roles.push(r);
  while (roles.length > HS.target) roles.splice(roles.findIndex(r => r === 'adult' || r === 'trader'), 1);
  roles.forEach((r, i) => hsAddPerson(r, null, i));
  // tiers: 16 named (rich routines + chronicle), ~25% ambient (simple loops), the rest scheduled workers
  const named = new Set(['guard', 'scav', 'medic', 'builder', 'farmer', 'teacher', 'elder', 'cook', 'fisher']);
  let n = 0; for (const p of HS.people) if (n < Math.round(16 * scale) && named.has(p.role) && (p.role !== 'guard' || n % 3 === 0)) { p.tier = 0; p.name = NAMES[n % NAMES.length]; n++; }
  const amb = HS.people.filter(p => p.tier === 1 && (p.role === 'adult' || p.role === 'elder' || p.role === 'trader' || p.role === 'kid'));
  for (let i = 0; i < amb.length && i < Math.round(30 * scale); i++) amb[i].tier = 2;
  // guard posts: towers, gate, patrol, reserve
  const guards = HS.people.filter(p => p.role === 'guard'); let gi = 0;
  for (const t of HF.towers) for (let s = 0; s < (t.main ? 2 : 1); s++) { const g = guards[gi++]; if (g) { g.post = { k: 'tower', t: t.id, slot: s }; g.shift = gi % 2; } }
  for (let s = 0; s < 4; s++) { const g = guards[gi++]; if (g) { g.post = { k: 'gate', slot: s }; g.shift = s % 2; } }
  for (let s = 0; s < 8; s++) { const g = guards[gi++]; if (g) { g.post = { k: 'patrol', wp: Math.floor(HS.R() * HF.patrol.length), dirn: s % 2 ? 1 : -1 }; g.shift = s % 2; } }
  while (gi < guards.length) { const g = guards[gi++]; g.post = { k: 'reserve' }; g.shift = gi % 2; }
  // night shift guards also cover towers at night (swap duties)
  // initial wildlife + infected
  for (let h = 0; h < 5; h++) hsSpawnHerd();
  for (let i = 0; i < 6; i++) hsAddWild('rabbit', ...hsWildPoint());
  for (let i = 0; i < 4; i++) hsAddWild('chicken', HF.spots.coop[0].x + rr2(-6, 6), HF.spots.coop[0].y + rr2(-4, 4), { home: 'coop' });
  for (let i = 0; i < 3; i++) hsAddWild('goat', HF.spots.goat[i].x, HF.spots.goat[i].y, { home: 'goat' });
  for (let i = 0; i < 2; i++) hsAddWild('dog', HF.oak.x + 10 + i * 8, HF.oak.y + 20);
  for (let i = 0; i < 3; i++) hsAddWild('crows', ...hsWildPoint());
  for (let i = 0; i < Math.round(16 * DANGER[HS.danger].n); i++) hsSpawnWanderer();
  const now = HS.t, iv = DANGER[HS.danger].iv;
  HS.next = { minor: now + rr2(30, 70), medium: now + rr2(12, 20) * 60 * iv, major: now + rr2(30, 45) * 60 * iv, siege: now + rr2(100, 140) * 60 * iv, exp: now + rr2(30, 60), wx: now + 300, arrive: now + 240, act: 0 };
  hsLog('start', {});
}
function hsWildPoint() { for (let n = 0; n < 200; n++) { const k = Math.floor(HS.R() * HN * HN); if (HF.walk[k] & W_OUT && (HF.gk[k] === GK.MEADOW || HF.gk[k] === GK.WGRASS) && hsFarFromWall(k, 12)) return tileC(k); } return tileC(HF.gate.outTile); }
function hsFarFromWall(k, n) { const [x, y] = tileC(k); const [u, v] = w2d(x, y); return v < wallV(u) - n * 4; }
function hsHomeFor(role) {
  if (role === 'guard') { const b = HF.buildings.find(b => b.kind === 'barracks'); return { x: b.door[0], y: b.door[1], b: b.id }; }
  const lots = HF.lots; const L = lots[HS.pid % lots.length]; const b = HF.buildings[L.b]; return { x: b.door[0], y: b.door[1], b: b.id, lot: L.id };
}
function hsAddPerson(role, at, i) {
  const L = hfLook(role, HS.R), home = hsHomeFor(role);
  const p = { id: HS.pid++, tier: 1, name: '', role, L, x: 0, y: 0, z: 0, px: 0, py: 0, dir: 1, st: 'idle', task: null, path: null, t: 0, ph: HS.R() * 10, spd: role === 'kid' ? 8.5 : role === 'elder' ? 4.6 : rr2(6.2, 7.6), hp: 3, inj: 0, alive: true, home, vis: true, variant: '', pose: 0, act: '', cool: 0, aim: null, shift: 0, stride: 0, bub: null, bubT: 0, carryT: 0, lane: rr2(-2.2, 2.2) };
  if (at) { p.x = at[0]; p.y = at[1]; }
  else { const s = hsPickSpot(role === 'kid' ? 'play' : role === 'guard' ? 'drill' : pickR(['green', 'bench', 'porch', 'seat', 'shop'])); p.x = s.x + rr2(-4, 4); p.y = s.y + rr2(-4, 4); }
  const k = hfNearPass(p.x, p.y, 'in', 20); if (k >= 0 && !hfPass(tileOfW(p.x, p.y), 'in')) [p.x, p.y] = tileC(k);
  p.px = p.x; p.py = p.y; HS.people.push(p); return p;
}

// ---------------------------------------------------------------- spots (claims keep people from stacking)
function hsPickSpot(name, near) {
  const list = HF.spots[name]; if (!list || !list.length) return { x: HF.oak.x, y: HF.oak.y + 30 };
  let best = null, bs = 1e9;
  for (let n = 0; n < Math.min(6, list.length); n++) { const s = list[Math.floor(HS.R() * list.length)], c = HS.spots.get(s) || 0, d = near ? Math.hypot(s.x - near.x, s.y - near.y) / 200 : 0; const sc = c + d + HS.R() * 0.3; if (sc < bs) { bs = sc; best = s; } }
  return best;
}
const claim = (s, d) => HS.spots.set(s, Math.max(0, (HS.spots.get(s) || 0) + d));

// ---------------------------------------------------------------- movement
function hsGo(a, x, y, mask, run) {
  const k = hfNearPass(x, y, mask, 14); if (k < 0) return false;
  a.path = { mask, tk: k, gx: x, gy: y, f: hfFlow(mask, k), run: !!run, stuck: 0, lx: a.x, ly: a.y }; if (a.role && a.st !== 'down') a.st = 'walk'; return true;
}
function hsStep(a, dt, speed) {   // returns true when arrived
  const P = a.path; if (!P) return true;
  const k = tileOfW(a.x, a.y), f = P.mask === 'z' ? hfFlow('z', P.tk) : P.f;
  let tx, ty;
  if (k === P.tk || f[k] === 0) { tx = P.gx; ty = P.gy; if (!hfPass(tileOfW(tx, ty), P.mask)) [tx, ty] = tileC(P.tk); }
  else {
    if (f[k] < 0) { const nk = hfNearPass(a.x, a.y, P.mask, 3); if (nk < 0 || f[nk] < 0) { a.path = null; return true; } [tx, ty] = tileC(nk); }
    else {
      const i = k % HN, j = (k / HN) | 0; let bk = -1, bd = f[k];
      for (let n = 0; n < 8; n++) { const ii = i + DX8[n], jj = j + DY8[n]; if (!inMap(ii, jj)) continue; const m = jj * HN + ii, d = f[m]; if (d < 0 || d >= bd) continue; if (DX8[n] && DY8[n] && (f[j * HN + ii] < 0 || f[jj * HN + i] < 0)) continue; bd = d; bk = m; }
      if (bk < 0) { a.path = null; return true; }
      [tx, ty] = tileC(bk); const L = a.lane || 0; tx += L; ty -= L;
    }
  }
  const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), s = speed * dt;
  if (d < 0.01) { if (k === P.tk || f[k] === 0) { a.path = null; return true; } return false; }
  const m = Math.min(1, s / d); a.x += dx * m; a.y += dy * m; a.stride += Math.min(s, d);
  if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 0 : 2; else a.dir = dy > 0 ? 1 : 3;
  if ((k === P.tk || f[k] === 0) && d <= s) { a.path = null; return true; }
  // stuck detection
  P.stuck += dt; if (P.stuck > 4) { if (Math.hypot(a.x - P.lx, a.y - P.ly) < 2) { a.path = null; return true; } P.stuck = 0; P.lx = a.x; P.ly = a.y; }
  return false;
}
function faceTo(a, b) { const dx = b.x - a.x, dy = b.y - a.y; a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); }

// ---------------------------------------------------------------- spatial hash
const SH_C = 32, SH_N = Math.ceil(HW / SH_C);
let SHZ = [], SHP = [];
function shBuild() { SHZ = new Array(SH_N * SH_N); SHP = new Array(SH_N * SH_N); for (const z of HS.zombies) if (z.st !== 'dead') shAdd(SHZ, z); for (const p of HS.people) if (p.alive && p.vis) shAdd(SHP, p); }
function shAdd(H, a) { const i = clamp((a.x / SH_C) | 0, 0, SH_N - 1), j = clamp((a.y / SH_C) | 0, 0, SH_N - 1), k = j * SH_N + i; (H[k] || (H[k] = [])).push(a); }
function shNear(H, x, y, r, fn) { const i0 = clamp(((x - r) / SH_C) | 0, 0, SH_N - 1), i1 = clamp(((x + r) / SH_C) | 0, 0, SH_N - 1), j0 = clamp(((y - r) / SH_C) | 0, 0, SH_N - 1), j1 = clamp(((y + r) / SH_C) | 0, 0, SH_N - 1); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = H[j * SH_N + i]; if (c) for (const a of c) if ((a.x - x) ** 2 + (a.y - y) ** 2 <= r * r) fn(a); } }
function nearestZ(x, y, r, pred) { let b = null, bd = r * r; shNear(SHZ, x, y, r, z => { if (z.st === 'dead' || (pred && !pred(z))) return; const d = (z.x - x) ** 2 + (z.y - y) ** 2; if (d < bd) { bd = d; b = z; } }); return b; }
function countZ(x, y, r) { let n = 0; shNear(SHZ, x, y, r, z => { if (z.st !== 'dead') n++; }); return n; }
const isInside = (x, y) => (HF.walk[tileOfW(x, y)] & W_IN) !== 0;

// ---------------------------------------------------------------- noise
function hsNoise(x, y, r, kind) { HS.noises.push({ x, y, r: r * (HS.weather === 'rain' ? 0.7 : 1), t: HS.t, kind }); }

// ---------------------------------------------------------------- combat helpers
function hsShoot(a, z, from, range, base) {
  const d = Math.hypot(z.x - a.x, z.y - a.y); if (d > range) return false;
  const night = hsDark(), p = clamp(base - d / 1000 - (night ? 0.14 : 0) - (HS.weather === 'rain' ? 0.08 : 0), 0.15, 0.95), hit = HS.R() < p;
  HS.stats.shots++; hsNoise(a.x, a.y, 230, 'shot'); hsSound('shot', a.x, a.y, from.z ? 0.9 : 0.7);
  const tx = hit ? z.x : z.x + rr2(-8, 8), ty = hit ? z.y : z.y + rr2(-8, 8);
  HS.fx.push({ k: 'tracer', x0: from.x, y0: from.y, z0: from.z || 12, x1: tx, y1: ty, z1: hit ? 12 : 0, t: 0.13 }, { k: 'flash', x: from.x, y: from.y, z: (from.z || 12) + 1, t: 0.07 });
  if (hit) hsHitZ(z, a, HS.R() < 0.18 ? 9 : 1); else HS.fx.push({ k: 'dust', x: tx, y: ty, t: 0.4 });
  return true;
}
function hsHitZ(z, a, dmg) {
  z.hp -= dmg; z.st2 = 'stagger'; z.stT = 0.45; const dx = z.x - a.x, dy = z.y - a.y, d = Math.hypot(dx, dy) || 1; z.kx = dx / d * 6; z.ky = dy / d * 6;
  HS.fx.push({ k: 'hit', x: z.x, y: z.y, t: 0.2 });
  if (z.hp <= 0) { z.st = 'dead'; z.corpseT = rr2(90, 150); z.path = null; HS.stats.kills++; HS.fx.push({ k: 'dust', x: z.x, y: z.y, t: 0.6 }); hsSound('fall', z.x, z.y, 0.6); }
}
function hsHurt(p, z) {
  if (!p.alive || p.st === 'dead') return;
  p.hp--; HS.fx.push({ k: 'hit', x: p.x, y: p.y, t: 0.25, h: 1 }); hsSound('hurt', p.x, p.y, 0.6);
  if (p.hp <= 0) {
    if (HS.R() < DANGER[HS.danger].die) hsKill(p, z);
    else { p.inj = 2; p.hp = 1; p.st = 'down'; p.task = { k: 'down', t: 0 }; p.path = null; HS.stats.injuries++; hsLog('hurt', { n: hsName(p) }, true); }
  } else if (p.hp === 1 && !p.inj) { p.inj = 1; HS.stats.injuries++; }
}
function hsKill(p) {
  p.alive = false; p.st = 'dead'; p.deadT = 60; p.path = null; p.task = null; HS.stats.deaths++;
  hsLog('died', { n: hsName(p), r: p.role }, true); hsSound('loss', p.x, p.y, 0.5);
  for (const e of HS.exps) e.team = e.team.filter(q => q !== p);
}
const hsName = p => p.name || ('#' + p.role);
const hsDark = () => { const h = HS.hour; return h < 5.6 || h > 19.4; };

// ---------------------------------------------------------------- settlers: schedule -> tasks
function lifeHour() { return HS.timeMode === 'auto' ? HS.hour : (FIXED_H[HS.timeMode] + 2.5 * Math.sin(HS.t / DAY_SEC * TAU) + 24) % 24; }
function onShift(p) { const h = HS.life, day = h >= 6 && h < 18; return p.shift ? !day : day; }
function hsThink(p) {
  const h = HS.life, alarm = HS.alarm > 0, R = HS.R;
  if (p.inj && p.st !== 'down' && p.task?.k !== 'bed') return hsBed(p);
  if (p.exp) return;                              // expedition controller drives scavengers out of the gate
  if (p.rescue) return;
  // alarm: kids and elders shelter, reserve guards and patrols reinforce
  if (alarm && (p.role === 'kid' || p.role === 'elder' || (p.tier === 2 && p.role !== 'guard'))) { const s = HF.spots.shelter[0]; return setTask(p, { k: 'shelter', x: s.x, y: s.y, run: 1 }); }
  if (p.role === 'guard') return guardThink(p);
  const meal = (h >= 11.8 && h < 12.9) || (h >= 18.3 && h < 19.2);
  const sleep = (h >= 21.6 || h < 5.4) && !(p.role === 'fisher' && p.id % 4 === 0);
  if (sleep) return setTask(p, { k: 'sleep', x: p.home.x, y: p.home.y });
  if (meal && p.role !== 'cook' && R() < 0.85) { const s = hsPickSpot('seat'); return setTask(p, { k: 'eat', spot: s, x: s.x, y: s.y, dur: rr2(20, 40) }); }
  const rain = HS.weather === 'rain';
  if (p.tier === 2) return ambientThink(p, rain);
  switch (p.role) {
    case 'farmer': if (rain && R() < 0.7) return setTask(p, { k: 'sit', ...spotXY('porch'), dur: rr2(20, 40) }); if (p.carry === 'basket') return setTask(p, { k: 'drop', ...spotXY(R() < 0.5 ? 'granary' : 'cook'), dur: 3, then: 'basket0' }); return setTask(p, { k: 'work', ...spotXY('field', 6), dur: rr2(18, 40), tool: 'hoe', anim: 'hoe', after: R() < 0.4 ? 'basket' : null });
    case 'fisher': { if (p.carry === 'bucket') return setTask(p, { k: 'drop', ...spotXY('cook'), dur: 3, then: 'bucket0' }); return setTask(p, { k: 'work', ...spotXY('fish', 1), dur: rr2(40, 90), tool: 'rod', anim: 'fish', after: R() < 0.5 ? 'bucket' : null }); }
    case 'cook': return setTask(p, R() < 0.75 ? { k: 'work', ...spotXY('cook', 1), dur: rr2(15, 30), tool: 'pot', anim: 'stir' } : { k: 'carry', ...spotXY('seat'), dur: 3, tool: 'crate' });
    case 'builder': { const s = hsRepairJob(p); if (s) return setTask(p, s); return setTask(p, R() < 0.5 ? { k: 'work', ...spotXY('bench', 2), dur: rr2(15, 30), tool: 'hammer', anim: 'hammer' } : { k: 'carry', ...spotXY('yardwork'), dur: 8, tool: 'plank', anim: 'hammer' }); }
    case 'tech': return setTask(p, { k: 'work', ...spotXY('bench', 2), dur: rr2(20, 40), tool: 'hammer', anim: R() < 0.5 ? 'hammer' : 'kneel' });
    case 'medic': { const pat = HS.people.find(q => q.alive && q.inj === 2 && !q.medic && isInside(q.x, q.y)); if (pat) { pat.medic = p; return setTask(p, { k: 'treat', x: pat.x, y: pat.y, pat, run: 1 }); } return setTask(p, R() < 0.7 ? { k: 'work', ...spotXY('medic'), dur: rr2(15, 30), anim: 'stand' } : { k: 'walk', ...spotXY('bed'), dur: 6 }); }
    case 'trader': return setTask(p, h > 6.5 && h < 18 ? { k: 'work', ...spotXY('stall', 1), dur: rr2(30, 60), anim: 'talk' } : { k: 'sit', ...spotXY('bench'), dur: 20 });
    case 'teacher': return setTask(p, h > 8 && h < 11.5 ? { k: 'work', ...spotXY('teach'), dur: 30, anim: 'talk' } : { k: 'sit', ...spotXY('green'), dur: 20 });
    case 'kid': if (h > 8 && h < 11.4 && !rain) return setTask(p, { k: 'sit', ...spotXY('class', 1), dur: 30 }); return setTask(p, rain ? { k: 'sit', ...spotXY('porch'), dur: 25 } : { k: 'play', ...spotXY(R() < 0.6 ? 'play' : 'green'), dur: rr2(6, 14), run: 1 });
    case 'elder': return setTask(p, R() < 0.5 ? { k: 'sit', ...spotXY(R() < 0.5 ? 'porch' : 'bench'), dur: rr2(30, 60) } : R() < 0.3 ? { k: 'sit', ...spotXY('mourn'), dur: 20 } : { k: 'work', ...spotXY('yardwork'), dur: 20, tool: 'hoe', anim: 'hoe' });
    case 'scav': return setTask(p, R() < 0.4 ? { k: 'work', ...spotXY('yard'), dur: 20, anim: 'stand' } : { k: 'sit', ...spotXY('seat'), dur: 20 });
    default: return ambientThink(p, rain);
  }
}
function ambientThink(p, rain) {
  const R = HS.R, r = R();
  if (p.role === 'kid') return setTask(p, rain ? { k: 'sit', ...spotXY('porch'), dur: 25 } : { k: 'play', ...spotXY('play'), dur: rr2(6, 12), run: 1 });
  if (r < 0.25) return setTask(p, { k: 'shop', ...spotXY('shop'), dur: rr2(8, 16), anim: 'talk' });
  if (r < 0.45) return setTask(p, { k: 'carry', ...spotXY(R() < 0.5 ? 'storage' : 'cook'), dur: 4, tool: 'crate' });
  if (r < 0.6) return setTask(p, { k: 'work', ...spotXY('yardwork'), dur: rr2(10, 20), tool: R() < 0.5 ? 'cloth' : 'hoe', anim: R() < 0.5 ? 'hang' : 'hoe' });
  if (r < 0.8 || rain) return setTask(p, { k: 'sit', ...spotXY(rain ? 'porch' : pickR(['bench', 'seat', 'porch'])), dur: rr2(20, 45) });
  return setTask(p, { k: 'chat', ...spotXY('green'), dur: rr2(10, 20), anim: 'talk' });
}
function spotXY(name, jit) { const s = hsPickSpot(name); return { x: s.x + (jit ? rr2(-jit, jit) : 0), y: s.y + (jit ? rr2(-jit, jit) : 0), spot: s }; }
function setTask(p, t) {
  if (p.task && p.task.spot) claim(p.task.spot, -1);
  p.task = t; t.t = 0; t.ph = 'go'; if (t.spot) claim(t.spot, 1);
  if (p.vis === false && t.k !== 'sleep' && t.k !== 'shelter') { p.vis = true; }
  p.variant = t.tool || (p.carry || ''); p.act = '';
  if (!hsGo(p, t.x, t.y, p.role === 'scav' || p.exp || p.rescue ? 'all' : 'in', t.run)) { t.ph = 'do'; }
}
function hsBed(p) { const s = hsPickSpot('bed'); setTask(p, { k: 'bed', x: s.x, y: s.y, spot: s, dur: 1e9 }); }
function guardThink(p) {
  const P = p.post, alarm = HS.alarm > 0;
  if (!onShift(p) && !alarm) {
    const h = HS.life, meal = (h >= 11.8 && h < 12.9) || (h >= 18.3 && h < 19.2);
    if (meal) { const s = hsPickSpot('seat'); return setTask(p, { k: 'eat', spot: s, x: s.x, y: s.y, dur: 30 }); }
    if (h >= 22 || h < 5 || (h > 9 && h < 15 && p.shift)) return setTask(p, { k: 'sleep', x: p.home.x, y: p.home.y });
    return setTask(p, HS.R() < 0.5 ? { k: 'sit', ...spotXY('seat'), dur: 30 } : { k: 'drill', ...spotXY('drill'), dur: 25, anim: 'drill', tool: 'carry' });
  }
  if (P.k === 'tower') { const t = HF.towers[P.t]; return setTask(p, { k: 'tower', x: t.base[0], y: t.base[1], tower: t, dur: 1e9, tool: 'carry' }); }
  if (P.k === 'gate') { const [gx, gy] = tileC(HF.gate.inTile); return setTask(p, { k: 'gatepost', x: gx + (P.slot - 1.5) * 6, y: gy + 2 + (P.slot % 2) * 3, dur: 60, anim: 'stand', tool: 'spear' }); }
  if (P.k === 'patrol') { P.wp = (P.wp + P.dirn + HF.patrol.length) % HF.patrol.length; const [x, y] = tileC(HF.patrol[P.wp]); return setTask(p, { k: 'patrol', x, y, dur: rr2(2, 6), tool: 'carry', anim: 'look' }); }
  // reserve: during an alarm hold the most threatened section; otherwise drill
  if (alarm) { const s = hsHotSeg(); if (s && s.inT >= 0) { const [x, y] = tileC(s.inT); return setTask(p, { k: 'defend', x, y, seg: s.id, dur: 20, tool: 'spear', run: 1 }); } }
  return setTask(p, { k: 'drill', ...spotXY('drill'), dur: rr2(20, 40), anim: 'drill', tool: 'carry' });
}
function hsHotSeg() { let best = null, bn = 0; for (const s of HF.walls) { if (s.gate) continue; const n = s.pressure || 0; if (n > bn || (s.hp <= 0 && bn < 99)) { bn = s.hp <= 0 ? 99 : n; best = s; } } return best; }
function hsRepairJob(p) {
  let best = null, bd = 1e9;
  for (const s of HF.walls) { if (s.gate || s.hp >= s.max || s.inT < 0 || s.fixer && s.fixer !== p && s.fixer.alive) continue; if ((s.pressure || 0) > 2 && s.hp > 0) continue; const [x, y] = tileC(s.inT), d = Math.hypot(x - p.x, y - p.y) - (s.max - s.hp) * 10; if (d < bd) { bd = d; best = s; } }
  if (!best) return null; best.fixer = p; const [x, y] = tileC(best.inT); return { k: 'repair', x, y, seg: best.id, dur: 1e9, tool: 'hammer', anim: 'hammer' };
}

// per-tick update for a settler
function hsPerson(p, dt) {
  if (!p.alive) { p.deadT -= dt; return; }
  if (p.cool > 0) p.cool -= dt;
  if (p.bubT > 0) { p.bubT -= dt; if (p.bubT <= 0) p.bub = null; }
  const T = p.task;
  if (p.st === 'down') { if (p.medic && p.medic.alive && dist(p, p.medic) < 10) { p.st = 'idle'; hsBed(p); } else if (!p.medic && !HS.people.some(q => q.role === 'medic' && q.alive) && isInside(p.x, p.y)) { p.st = 'idle'; hsBed(p); } return; }
  if (p.onTower) return towerGuard(p, dt);
  // danger response for anyone inside: infected within reach -> fight (guards) or flee
  if (HS.zInside > 0 && isInside(p.x, p.y)) {
    const z = nearestZ(p.x, p.y, p.role === 'guard' ? 140 : 46, q => isInside(q.x, q.y) || dist(q, p) < 14);
    if (z) {
      if (p.role === 'guard' || p.role === 'builder' || (p.role === 'adult' && p.id % 2)) { if (dist(z, p) < 11) { melee(p, z); return; } if (!p.path || p.task?.k !== 'fight') { p.task = { k: 'fight', t: 0, ph: 'go', tool: 'spear' }; p.variant = 'spear'; hsGo(p, z.x, z.y, 'in', true); } }
      else if (p.task?.k !== 'shelter') { const s = HF.spots.shelter[0]; setTask(p, { k: 'shelter', x: s.x, y: s.y, run: 1 }); }
    }
  }
  if (!T) { hsThink(p); return; }
  T.t += dt;
  if (p.path) { const run = p.path.run, sp = (run ? (p.role === 'elder' ? 6 : 13) : p.spd) * (p.inj ? 0.55 : 1) * (HS.weather === 'rain' ? 1.08 : 1); if (hsStep(p, dt, sp)) { T.ph = 'do'; T.t = 0; } else return; }
  if (T.ph === 'go') { T.ph = 'do'; T.t = 0; }
  // arrived: perform
  switch (T.k) {
    case 'sleep': case 'shelter': p.vis = false; if (T.k === 'shelter' && HS.alarm <= 0) { p.vis = true; p.task = null; } else if (T.k === 'sleep' && !((HS.life >= 21.6 || HS.life < 5.4) || (p.role === 'guard' && !onShift(p)))) { p.vis = true; p.task = null; } return;
    case 'tower': { p.onTower = { t: T.tower, slot: p.post.slot, climb: 0 }; p.variant = 'carry'; return; }
    case 'bed': p.act = 'lie'; if (p.inj) { p.healT = (p.healT || 0) + dt * (HS.people.some(q => q.role === 'medic' && q.alive && dist(q, p) < 60) ? 1.6 : 0.6); if (p.healT > 120) { p.inj = 0; p.hp = 3; p.healT = 0; p.medic = null; p.act = ''; p.task = null; hsLog('healed', { n: hsName(p) }); } } return;
    case 'treat': { const pat = T.pat; if (!pat.alive || pat.inj !== 2) { p.task = null; return; } if (dist(p, pat) > 10) { hsGo(p, pat.x, pat.y, 'all', true); return; } p.act = 'kneel'; if (T.t > 4) { pat.st = 'idle'; pat.medic = p; hsBed(pat); p.task = null; } return; }
    case 'repair': { const s = HF.walls[T.seg]; p.act = 'hammer'; faceTo(p, s); if (T.t > 1.5) { T.t = 0; s.hp = Math.min(s.max, s.hp + 1); hsSound('hammer', p.x, p.y, 0.4); if (s.hp > 0 && s.breached && s.hp >= s.max * 0.3) hsCloseBreach(s); if (s.hp >= s.max) { s.fixer = null; HS.stats.repairs++; p.task = null; } } if ((s.pressure || 0) > 2 && !s.breached) { s.fixer = null; p.task = null; } return; }
    case 'defend': { const s = HF.walls[T.seg]; p.act = 'stand'; const z = nearestZ(s.x, s.y, 22); if (z) { faceTo(p, z); if (p.cool <= 0) { p.cool = 1.3; p.act = 'stab'; if (HS.R() < 0.6) hsHitZ(z, p, 1); hsSound('stab', p.x, p.y, 0.4); } } if (T.t > T.dur && !z) p.task = null; return; }
    case 'gatepost': { p.act = 'stand'; p.dir = 3; const z = nearestZ(HF.gate.x, HF.gate.y, 20); if (z) { faceTo(p, z); if (p.cool <= 0) { p.cool = 1.2; p.act = 'stab'; if (HS.R() < 0.65) hsHitZ(z, p, 1); hsSound('stab', p.x, p.y, 0.4); } } if (T.t > T.dur) p.task = null; return; }
    case 'patrol': { p.act = 'look'; const z = nearestZ(p.x, p.y, 70, q => !isInside(q.x, q.y)); if (z && p.cool <= 0) { p.cool = 2.2; faceTo(p, z); hsShoot(p, z, { x: p.x, y: p.y, z: 14 }, 70, 0.5); } if (T.t > T.dur) p.task = null; return; }
    case 'fight': { p.task = null; return; }
    case 'eat': case 'sit': p.act = 'sit'; if (T.k === 'eat' && T.t > 3 && !p.bub && HS.R() < 0.01) bubble(p, pickR(['cup', 'heart', 'note', 'dots'])); if (T.t > (T.dur || 20)) p.task = null; return;
    case 'play': if (T.t > (T.dur || 8)) { if (HS.R() < 0.6) { const s = spotXY('play', 4); hsGo(p, s.x, s.y, 'in', true); T.t = 0; T.dur = rr2(3, 7); T.n = (T.n || 0) + 1; if (T.n > 4) p.task = null; } else p.task = null; } else p.act = 'jump'; return;
    case 'drop': p.act = 'stand'; if (T.t > T.dur) { if (T.then === 'basket0' || T.then === 'bucket0') { p.carry = null; bubble(p, T.then === 'basket0' ? 'leaf' : 'pho'); } p.task = null; } return;
    case 'carry': p.act = T.anim || 'stand'; if (T.t > T.dur) p.task = null; return;
    case 'drill': p.act = (Math.floor((HS.t + p.ph) / 1.2) % 3 === 0) ? 'raise' : 'stand'; if (T.t > T.dur) p.task = null; return;
    case 'shop': case 'chat': p.act = 'talk'; if (T.t > T.dur) { if (HS.R() < 0.3) bubble(p, pickR(['money', 'dots', 'smile'])); p.task = null; } return;
    case 'walk': if (T.t > (T.dur || 3)) p.task = null; return;
    default: p.act = T.anim || 'stand'; if (T.t > (T.dur || 10)) { if (T.after) { p.carry = T.after; p.variant = T.after; } p.task = null; } return;
  }
}
function bubble(p, k) { p.bub = k; p.bubT = 2.5; }
function melee(p, z) { faceTo(p, z); p.act = 'stab'; if (p.cool <= 0) { p.cool = 1.2; if (HS.R() < 0.7) hsHitZ(z, p, 1); hsSound('stab', p.x, p.y, 0.5); } }
function towerGuard(p, dt) {
  const T = p.onTower, t = T.t;
  if (T.climb < 1) { T.climb += dt / 3; p.x = t.x + 9; p.y = t.y + 19; p.z = T.climb * 48; return; }
  const slot = T.slot ? [t.x + 13, t.y + 7] : [t.x + 7, t.y + 13]; p.x = slot[0]; p.y = slot[1]; p.z = 48.2;
  if (!onShift(p) && HS.alarm <= 0 && p.task) { p.onTower = null; p.z = 0; p.x = t.base[0]; p.y = t.base[1]; p.task = null; return; }
  const z = nearestZ(p.x, p.y, 230, q => !isInside(q.x, q.y) || HS.zInside > 0);
  p.aim = z; p.variant = z ? 'aim' : 'carry';
  if (z) { faceTo(p, z); if (p.cool <= 0) { p.cool = rr2(2.6, 4.2) * (HS.alarm > 0 ? 0.85 : 1); hsShoot(p, z, { x: p.x - (p.dir === 2 ? 5 : p.dir === 0 ? -5 : 0), y: p.y, z: 61 }, 230, 0.6); } }
  else { p.dir = (Math.floor((HS.t + p.ph) / 6) % 2) ? 3 : 2; }
}

// ---------------------------------------------------------------- infected
function hsAddZ(x, y, o) {
  const L = hfZombieLook(HS.R);
  const z = Object.assign({ id: HS.zid++, L, x, y, px: x, py: y, dir: 1, st: 'wander', hp: HS.R() < 0.35 ? 4 : 3, spd: rr2(3.2, 4.6), t: 0, path: null, stride: 0, ph: HS.R() * 10, cool: 0, seg: -1, st2: '', stT: 0, kx: 0, ky: 0, idle: 0, route: null, rp: 0, lane: rr2(-3, 3) }, o || {});
  HS.zombies.push(z); return z;
}
function hsBand(z) { const [u, v] = w2d(z.x, z.y); const wv = wallV(u); return v < wv - 20 && v > wv - 160 && u > 150 && u < 810; }
function hsSpawnBand() {   // enter from the forest edge (never inside the wall), then wander along the frontier
  for (let n = 0; n < 40; n++) { const u = rr2(170, 790), v = wallV(u) - rr2(110, 170), [x, y] = d2w(u, v), k = tileOfW(x, y); if (!hfPass(k, 'out')) continue; const z = hsAddZ(x, y); z.band = 1; return z; }
  return null;
}
function hsSpawnWanderer() { for (let n = 0; n < 60; n++) { const [x, y] = hsWildPoint(); if (!hsFarFromWall(tileOfW(x, y), 18)) continue; return hsAddZ(x + rr2(-6, 6), y + rr2(-6, 6)); } return null; }
function hsRouteGroup(n, routeName, targetSeg, tag) {
  const r = HF.routes.find(q => q.name === routeName) || pickR(HF.routes), head = r.pts[0], zs = [];
  for (let i = 0; i < n; i++) { const [x, y] = [head[0] + rr2(-14, 14), head[1] + rr2(-14, 14)], k = hfNearPass(x, y, 'out', 8); if (k < 0) continue; const c = tileC(k); zs.push(hsAddZ(c[0], c[1], { st: 'march', route: r, rp: 1, seg: targetSeg ? targetSeg.id : -1, tag, delay: i * rr2(0.4, 1.6) })); }
  return zs;
}
function hsZ(z, dt) {
  if (z.st === 'dead') { z.corpseT -= dt; return; }
  if (z.stT > 0) { z.stT -= dt; z.x += z.kx * dt * 2; z.y += z.ky * dt * 2; z.kx *= 0.8; z.ky *= 0.8; if (!hfPass(tileOfW(z.x, z.y), 'z')) { z.x -= z.kx * dt * 2; z.y -= z.ky * dt * 2; } return; }
  if (z.delay > 0) { z.delay -= dt; return; }
  if (z.cool > 0) z.cool -= dt;
  const inside = isInside(z.x, z.y);
  // targets: humans in sight
  const sight = hsDark() ? 46 : 74;
  if (z.st !== 'attack' && z.st !== 'pursue') {
    let tgt = null, bd = sight * sight;
    shNear(SHP, z.x, z.y, sight, p => { if (!p.alive || p.onTower) return; if (!inside && isInside(p.x, p.y) && !p.exp && !p.rescue) return; const d = (p.x - z.x) ** 2 + (p.y - z.y) ** 2; if (d < bd) { bd = d; tgt = p; } });
    if (tgt) { z.st = 'pursue'; z.tgt = tgt; z.t = 0; z.path = null; if (HS.R() < 0.3) hsSound('moan', z.x, z.y, 0.6); }
    else if (z.st !== 'wall' && z.st !== 'investigate') {   // wildlife: a deer close by is chased for a while
      const deer = HS.wild.find(w => w.k === 'deer' && (w.x - z.x) ** 2 + (w.y - z.y) ** 2 < 2500 && !w.dead);
      if (deer && z.st === 'wander' && HS.R() < 0.02) { z.st = 'chase'; z.prey = deer; z.t = 0; }
    }
  }
  z.t += dt;
  switch (z.st) {
    case 'wander': case 'idle': {
      if (z.st === 'idle') { if (z.t > z.idle) { z.st = 'wander'; z.t = 0; } return; }
      if (!z.path) { if (HS.R() < 0.25) { z.st = 'idle'; z.idle = rr2(2, 8); z.t = 0; return; } const [x, y] = hsWanderGoal(z); hsGo(z, x, y, 'z'); }
      if (z.path && hsStep(z, dt, z.spd * 0.6)) z.path = null; return;
    }
    case 'march': {     // following a threat route toward the wall
      const r = z.route; if (!z.path) { if (z.rp < r.pts.length) { const p = r.pts[z.rp++]; hsGo(z, p[0] + z.lane * 3, p[1] - z.lane * 3, 'z'); } else { hsToWall(z, z.seg >= 0 ? HF.walls[z.seg] : null); return; } }
      if (z.path && hsStep(z, dt, z.spd * 1.2)) z.path = null; return;
    }
    case 'investigate': { if (!z.path || hsStep(z, dt, z.spd)) { z.path = null; if (z.toWall) hsToWall(z, HF.walls[z.toWall]); else { z.st = 'idle'; z.idle = rr2(3, 8); z.t = 0; } } return; }
    case 'chase': { const d = z.prey; if (!d || d.dead || z.t > 14 || (d.x - z.x) ** 2 + (d.y - z.y) ** 2 > 14000) { z.st = 'wander'; z.prey = null; z.path = null; return; } steer(z, d.x, d.y, z.spd * 1.25, dt); return; }
    case 'pursue': {
      const p = z.tgt; if (!p || !p.alive || p.onTower || (!inside && isInside(p.x, p.y) && !hfPass(tileOfW(p.x, p.y), 'z')) || z.t > 40) { z.st = 'wander'; z.tgt = null; z.path = null; return; }
      const d = Math.hypot(p.x - z.x, p.y - z.y);
      if (d < 8) { z.st = 'attack'; z.t = 0; z.path = null; return; }
      if (d > (hsDark() ? 90 : 130)) { z.st = 'investigate'; hsGo(z, p.x, p.y, 'z'); return; }
      if (d < 40) steer(z, p.x, p.y, z.spd * 1.35, dt); else { if (!z.path || z.t % 1 < dt) hsGo(z, p.x, p.y, 'z'); if (z.path) hsStep(z, dt, z.spd * 1.35); }
      return;
    }
    case 'attack': {
      const p = z.tgt; if (!p || !p.alive || p.onTower) { z.st = 'wander'; z.tgt = null; return; }
      const d = Math.hypot(p.x - z.x, p.y - z.y); if (d > 11) { z.st = 'pursue'; return; }
      faceTo(z, p); if (z.cool <= 0) { z.cool = 1.5; if (HS.R() < 0.42) hsHurt(p, z); hsSound('growl', z.x, z.y, 0.5); }
      return;
    }
    case 'wall': {
      const s = HF.walls[z.seg]; if (!s) { z.st = 'wander'; return; }
      if (z.path) { if (hsStep(z, dt, z.spd)) z.path = null; return; }
      if (s.breached || s.hp <= 0) { z.st = 'wander'; z.path = null; z.seg = -1; const [gx, gy] = d2w(HGREEN[0], HGREEN[1]); hsGo(z, gx, gy, 'z'); z.st = 'investigate'; return; }
      faceTo(z, s); s.pressure = (s.pressure || 0) + 1; s.lastHit = HS.t;
      if (z.cool <= 0) { z.cool = rr2(1.6, 2.2); s.hp -= 1; s.dmgT = 0.25; hsSound('bang', s.x, s.y, 0.35); if (s.hp <= 0) hsBreach(s); }
      return;
    }
    case 'gate': { if (z.path) { if (hsStep(z, dt, z.spd)) z.path = null; return; } faceTo(z, HF.gate); if (HF.gate.open > 0.7) { z.st = 'investigate'; const [gx, gy] = d2w(HGREEN[0], HGREEN[1]); hsGo(z, gx, gy, 'z'); } if (z.cool <= 0) { z.cool = 2; hsSound('bang', HF.gate.x, HF.gate.y, 0.4); } return; }
  }
}
function steer(z, x, y, sp, dt) { const dx = x - z.x, dy = y - z.y, d = Math.hypot(dx, dy) || 1, nx = z.x + dx / d * sp * dt, ny = z.y + dy / d * sp * dt; if (hfPass(tileOfW(nx, ny), 'z')) { z.x = nx; z.y = ny; z.stride += sp * dt; } else { hsGo(z, x, y, 'z'); if (z.path) hsStep(z, dt, sp); } if (Math.abs(dx) > Math.abs(dy)) z.dir = dx > 0 ? 0 : 2; else z.dir = dy > 0 ? 1 : 3; }
function hsWanderGoal(z) { if (z.band) for (let n = 0; n < 12; n++) { const [u0] = w2d(z.x, z.y), u = clamp(u0 + rr2(-60, 60), 160, 800), v = wallV(u) - rr2(35, 150), [x, y] = d2w(u, v), k = tileOfW(x, y); if (hfPass(k, 'out')) return [x, y]; }
  for (let n = 0; n < 12; n++) { const x = z.x + rr2(-90, 90), y = z.y + rr2(-90, 90), k = tileOfW(x, y); if (inMap(Math.floor(x / HT), Math.floor(y / HT)) && hfPass(k, 'out') && hsFarFromWall(k, 8)) return [x, y]; } return [z.x, z.y]; }
function hsToWall(z, seg) {
  if (!seg) { let best = null, bd = 1e9; for (const s of HF.walls) { if (s.outT < 0) continue; const d = (s.x - z.x) ** 2 + (s.y - z.y) ** 2 - (s.weak ? 4000 : 0) + HS.R() * 3000; if (d < bd) { bd = d; best = s; } } seg = best; }
  if (!seg) { z.st = 'wander'; return; }
  if (seg.gate) { z.st = 'gate'; const [x, y] = tileC(HF.gate.outTile); hsGo(z, x + rr2(-6, 6), y + rr2(-3, 3), 'z'); return; }
  z.st = 'wall'; z.seg = seg.id; const [x, y] = tileC(seg.outT); hsGo(z, x + rr2(-2, 2), y + rr2(-2, 2), 'z');
}
function hsBreach(s) {
  s.hp = 0; s.breached = true; HF.walk[tIdx(s.i, s.j)] |= W_BREACH; HF.breaches++; HF.ver++; HS.stats.breaches++; HS.dirtyWall = true;
  hsLog('breach', {}, true); hsSound('breach', s.x, s.y, 1); hsAlarm('breach');
}
function hsCloseBreach(s) {
  s.breached = false; HF.walk[tIdx(s.i, s.j)] &= ~W_BREACH; HF.breaches = Math.max(0, HF.breaches - 1); HF.ver++; HS.dirtyWall = true; hsLog('sealed', {});
  for (const z of HS.zombies) if (tileOfW(z.x, z.y) === tIdx(s.i, s.j) && s.outT >= 0) [z.x, z.y] = tileC(s.outT);
}
function hsAlarm(why) { if (HS.alarm <= 0) { hsLog('alarm', { why }, true); hsSound('bell', HF.gate.x, HF.gate.y, 1); } HS.alarm = 45; for (const p of HS.people) if (p.alive && (p.role === 'kid' || p.role === 'elder' || p.role === 'guard' || p.tier === 2) && !p.exp && !p.rescue && !p.onTower && p.task?.k !== 'shelter' && p.task?.k !== 'bed') p.task = null; }

// ---------------------------------------------------------------- wildlife
function hsAddWild(k, x, y, o) { const w = Object.assign({ k, x, y, px: x, py: y, dir: 1, t: 0, path: null, spd: k === 'deer' ? 7 : k === 'rabbit' ? 9 : k === 'dog' ? 8 : 3, ph: HS.R() * 10, stride: 0, flee: 0 }, o || {}); HS.wild.push(w); return w; }
function hsSpawnHerd() { const [x, y] = hsWildPoint(), n = 2 + Math.floor(HS.R() * 4), lead = hsAddWild('deer', x, y); lead.herd = lead; for (let i = 1; i < n; i++) hsAddWild('deer', x + rr2(-12, 12), y + rr2(-12, 12), { herd: lead }); }
function hsWild(w, dt) {
  w.t += dt;
  if (w.k === 'crows') { w.x += Math.cos(w.ph + HS.t * 0.3) * dt * 10; w.y += Math.sin(w.ph * 1.7 + HS.t * 0.2) * dt * 8; if (w.t > 30) { const c = HS.zombies.find(z => z.st === 'dead'); if (c && HS.R() < 0.5) { w.x = c.x; w.y = c.y - 30; } w.t = 0; } return; }
  if (w.k === 'chicken' || w.k === 'goat') { const home = w.home === 'coop' ? HF.spots.coop[0] : HF.spots.goat[1]; if (!w.path || w.t > 4) { w.t = 0; const x = home.x + rr2(-10, 10), y = home.y + rr2(-7, 7); w.gx = x; w.gy = y; w.path = 1; } const dx = w.gx - w.x, dy = w.gy - w.y, d = Math.hypot(dx, dy); if (d > 0.5) { const s = Math.min(d, w.spd * dt); w.x += dx / d * s; w.y += dy / d * s; w.stride += s; w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); } return; }
  if (w.k === 'dog') { const kid = HS.people.find(p => p.alive && p.vis && p.role === 'kid' && p.id % 7 === w.ph % 7 | 0) || HS.people.find(p => p.alive && p.vis && p.role === 'kid'); if (kid) { const d = dist(w, kid); if (d > 16) { if (!w.path || w.t > 2) { w.t = 0; hsGo(w, kid.x + 8, kid.y + 4, 'in'); } if (w.path) hsStep(w, dt, d > 50 ? 13 : 8); } } return; }
  // deer / rabbits: graze, flee from infected and people
  const threat = nearestZ(w.x, w.y, 60) || (HS.people.find(p => p.alive && p.vis && !isInside(p.x, p.y) && dist(p, w) < 40));
  if (threat) { w.flee = 3; const dx = w.x - threat.x, dy = w.y - threat.y, d = Math.hypot(dx, dy) || 1; w.fx = w.x + dx / d * 60; w.fy = w.y + dy / d * 60; w.path = null; }
  if (w.flee > 0) { w.flee -= dt; const sp = w.k === 'deer' ? 16 : 14; const dx = w.fx - w.x, dy = w.fy - w.y, d = Math.hypot(dx, dy) || 1, nx = w.x + dx / d * sp * dt, ny = w.y + dy / d * sp * dt; if (hfPass(tileOfW(nx, ny), 'out')) { w.x = nx; w.y = ny; w.stride += sp * dt; } w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); w.run = 1; return; }
  w.run = 0;
  if (w.k === 'deer' && w.herd !== w && w.herd) { const L = w.herd; if (dist(w, L) > 20) { const dx = L.x - w.x, dy = L.y - w.y, d = Math.hypot(dx, dy); w.x += dx / d * w.spd * dt; w.y += dy / d * w.spd * dt; w.stride += w.spd * dt; w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); } return; }
  if (!w.path) { if (w.t < (w.k === 'deer' ? 6 : 2)) return; w.t = 0; const [x, y] = hsWanderGoal(w); hsGo(w, x, y, 'out'); }
  if (w.path && hsStep(w, dt, w.spd * 0.5)) w.path = null;
}

// ---------------------------------------------------------------- gate
function hsGate(dt) {
  const g = HF.gate, want = g.users > 0, near = nearestZ(HF.gate.x, HF.gate.y, 34, z => !isInside(z.x, z.y));
  const tgt = want && (!near || g.force) ? 1 : 0;
  const was = g.open; g.open = clamp(g.open + (tgt ? 0.45 : -0.6) * dt, 0, 1);
  if ((was <= 0.7) !== (g.open <= 0.7)) { HF.ver++; hsSound('gate', g.x, g.y, 1); }
  if (was === 0 && g.open > 0) hsSound('gate', g.x, g.y, 1);
  g.users = 0; g.force = 0;
}
// a settler outside/inside waiting for the gate: request + wait at the threshold
function needGate(p) { const k = tileOfW(p.x, p.y), inSide = isInside(p.x, p.y); const nearGate = Math.hypot(p.x - HF.gate.x, p.y - HF.gate.y) < 46; if (nearGate) { HF.gate.users++; } return nearGate && HF.gate.open < 0.75; }

// ---------------------------------------------------------------- expeditions
function hsStartExpedition() {
  const pool = HS.people.filter(p => p.alive && p.role === 'scav' && !p.exp && !p.inj && p.vis !== false);
  if (pool.length < 2 || HS.alarm > 0) return null;
  const team = pool.slice(0, Math.min(3, pool.length)); const poi = pickR(HF.pois.filter(q => !q.horde || HS.R() < 0.25));
  const e = { id: HS.stats.exp++, team, poi, ph: 'prep', t: 0, loot: pickR(['food', 'parts', 'medicine', 'seeds', 'radio', 'fuel']), start: team.length, hurt: 0, rescued: false };
  for (const p of team) { p.exp = e; p.task = { k: 'exp', t: 0 }; p.variant = 'pistol'; p.L.pack2 = 1; const s = spotXY('yard', 4); hsGo(p, s.x, s.y, 'all'); }
  HS.exps.push(e); hsLog('exp.out', { n: team.map(hsName).join(', '), poi: poi.name }); return e;
}
function hsExp(e, dt) {
  e.t += dt; e.team = e.team.filter(p => p.alive);
  if (!e.team.length) { e.ph = 'lost'; HS.stats.expLost++; hsLog('exp.lost', { poi: e.poi.name }, true); return false; }
  const lead = e.team[0];
  for (const p of e.team) {             // members fight or flee when infected come close (outside the wall)
    if (p.st === 'down') { p.task = { k: 'down', t: 0 }; continue; }
    if (isInside(p.x, p.y) && e.ph !== 'out' && e.ph !== 'search') continue;
    const z = nearestZ(p.x, p.y, 80);
    if (z && p.cool <= 0) { p.cool = rr2(0.9, 1.4); faceTo(p, z); hsShoot(p, z, { x: p.x, y: p.y, z: 14 }, 80, 0.58); bubble(p, 'ex'); }
    if ((e.ph === 'out' || e.ph === 'search') && (countZ(p.x, p.y, 90) >= 3 || p.inj)) { e.ph = 'back'; e.chased = true; hsLog('exp.chased', { poi: e.poi.name }, true); for (const q of e.team) q.path = null; hsMaybeRescue(e); }
  }
  const moveAll = (x, y, run) => { let all = true; for (const p of e.team) { if (p.st === 'down') { all = false; continue; } if (!p.path) hsGo(p, x + (p.lane * 3), y - p.lane * 3, 'all', run); if (p.path) { if (needGate(p)) { all = false; continue; } const done = hsStep(p, dt, (run ? 12.5 : p.spd) * (p.inj ? 0.6 : 1)); if (!done) all = false; } } return all; };
  switch (e.ph) {
    case 'prep': { const s = HF.spots.yard[0]; if (moveAll(s.x, s.y) || e.t > 40) { e.ph = 'out'; e.t = 0; for (const p of e.team) p.path = null; hsSound('gate', HF.gate.x, HF.gate.y, 0.5); } return true; }
    case 'out': { const [x, y] = e.poi.spots[0]; if (moveAll(x, y) || e.t > 240) { e.ph = 'search'; e.t = 0; } return true; }
    case 'search': { for (const p of e.team) { p.act = 'kneel'; } if (e.t > rr2(24, 40)) { e.ph = 'back'; e.t = 0; for (const p of e.team) { p.path = null; bubble(p, e.loot === 'food' ? 'pho' : e.loot === 'medicine' ? 'drop' : e.loot === 'seeds' ? 'leaf' : 'star'); } hsNoise(e.poi.x, e.poi.y, 60, 'search'); } return true; }
    case 'back': { const [x, y] = tileC(HF.gate.inTile); const s = HF.spots.storage[0]; if (e.chased) HF.gate.force = 1; if (moveAll(isInside(lead.x, lead.y) ? s.x : x, isInside(lead.x, lead.y) ? s.y : y, e.chased)) { if (e.team.every(p => isInside(p.x, p.y))) { e.ph = 'done'; } else for (const p of e.team) p.path = null; } if (e.t > 400) e.ph = 'done'; return true; }
    case 'done': {
      const lost = e.start - e.team.length, hurt = e.team.filter(p => p.inj).length;
      if (lost) { HS.stats.expDead++; hsLog('exp.dead', { poi: e.poi.name, n: lost }, true); } else if (hurt) { HS.stats.expHurt++; hsLog('exp.hurt', { poi: e.poi.name, loot: e.loot }); } else { HS.stats.expOk++; hsLog('exp.ok', { poi: e.poi.name, loot: e.loot }); }
      for (const p of e.team) { p.exp = null; p.task = null; p.variant = ''; p.L.pack2 = 0; }
      return false;
    }
  }
  return false;
}
function hsMaybeRescue(e) {
  if (e.rescued || HS.R() > 0.4) return; const lead = e.team[0]; if (!lead || Math.hypot(lead.x - HF.gate.x, lead.y - HF.gate.y) > 360) return;
  const squad = HS.people.filter(p => p.alive && p.role === 'guard' && p.post && (p.post.k === 'reserve' || p.post.k === 'patrol') && !p.inj && !p.rescue).slice(0, 4);
  if (squad.length < 2) return; e.rescued = true; HS.stats.rescues++;
  const r = { squad, e, t: 0, ph: 'out' }; for (const p of squad) { p.rescue = r; p.task = { k: 'rescue', t: 0 }; p.variant = 'carry'; p.path = null; }
  HS.rescues.push(r); hsLog('rescue', {}); hsSound('bell', HF.gate.x, HF.gate.y, 0.6);
}
function hsRescue(r, dt) {
  r.t += dt; r.squad = r.squad.filter(p => p.alive);
  const lead = r.e.team.find(p => p.alive), home = r.e.ph === 'done' || r.e.ph === 'lost' || !lead || r.t > 160;
  for (const p of r.squad) {
    const z = nearestZ(p.x, p.y, 110); if (z && p.cool <= 0) { p.cool = rr2(1, 1.6); faceTo(p, z); hsShoot(p, z, { x: p.x, y: p.y, z: 14 }, 110, 0.62); }
    const [tx, ty] = home ? tileC(HF.gate.inTile) : [lead.x, lead.y];
    if (!p.path || p.t2 === undefined || r.t - p.t2 > 1.5) { p.t2 = r.t; hsGo(p, tx + p.lane * 3, ty - p.lane * 3, 'all', true); }
    if (needGate(p)) { HF.gate.force = 1; continue; } if (p.path) hsStep(p, dt, 12);
  }
  if (home && r.squad.every(p => isInside(p.x, p.y))) { for (const p of r.squad) { p.rescue = null; p.task = null; p.variant = ''; } return false; }
  return r.squad.length > 0;
}

// ---------------------------------------------------------------- arrivals (replenishment)
function hsArrival() {
  const alive = HS.people.filter(p => p.alive).length, n = Math.min(4, Math.max(1, HS.target - alive));
  if (alive >= HS.target) return;
  const r = HF.routes.find(q => q.name === 'R1'), [x, y] = r.pts[1], group = [];
  const roles = hsNeededRoles(n);
  for (let i = 0; i < n; i++) { const p = hsAddPerson(roles[i], [x + rr2(-8, 8), y + rr2(-8, 8)]); p.arriving = true; p.task = { k: 'arrive', t: 0 }; p.tier = 1; group.push(p); }
  HS.arrivals.push({ group, t: 0 }); hsLog('arrive.near', { n });
}
function hsNeededRoles(n) {
  const have = {}; for (const p of HS.people) if (p.alive) have[p.role] = (have[p.role] || 0) + 1;
  const need = ROLE_MIX.map(([r, c]) => [r, Math.round(c * HS.target / 120) - (have[r] || 0)]).filter(q => q[1] > 0).sort((a, b) => b[1] - a[1]);
  const out = []; for (let i = 0; i < n; i++) out.push(need.length ? need[i % need.length][0] : 'adult'); return out;
}
function hsArrive(a, dt) {
  a.t += dt; a.group = a.group.filter(p => p.alive);
  if (!a.group.length) { hsLog('arrive.lost', {}, true); return false; }
  let all = true; const [gx, gy] = tileC(HF.gate.inTile);
  for (const p of a.group) {
    if (p.st === 'down') continue;
    if (isInside(p.x, p.y) && Math.hypot(p.x - gx, p.y - gy) > 10) continue;
    if (!p.path) hsGo(p, gx + p.lane * 2, gy + 6, 'all', countZ(p.x, p.y, 90) > 0);
    if (needGate(p)) { all = false; if (countZ(p.x, p.y, 80)) HF.gate.force = 1; continue; }
    if (p.path && !hsStep(p, dt, countZ(p.x, p.y, 90) ? 12 : p.spd)) all = false;
    if (!isInside(p.x, p.y)) all = false;
  }
  if (all || a.t > 300) { for (const p of a.group) { p.arriving = false; p.task = null; } HS.stats.arrivals += a.group.length; hsLog('arrived', { n: a.group.length }); return false; }
  return true;
}

// ---------------------------------------------------------------- director: constant activity + encounters
function hsDirector(dt) {
  const D = DANGER[HS.danger], N = HS.next, now = HS.t;
  // constant activity: keep the wilderness populated (counted per danger), herds topped up
  if (now > N.act) {
    N.act = now + 5;
    const wander = HS.zombies.filter(z => z.st !== 'dead' && !isInside(z.x, z.y)).length;
    if (wander < Math.round(16 * D.n)) hsSpawnWanderer();
    // keep a few infected drifting in the band just beyond the cleared ground, where the default camera looks
    const band = HS.zombies.filter(z => z.st !== 'dead' && !isInside(z.x, z.y) && hsBand(z) ).length;
    if (band < Math.round(7 * D.n)) hsSpawnBand();
    if (HS.wild.filter(w => w.k === 'deer').length < 14) hsSpawnHerd();
  }
  if (now > N.minor) {
    N.minor = now + rr2(45, 120) * D.iv; HS.stats.attacks.minor++;
    const r = HS.R();
    if (r < 0.35) { const z = hsSpawnWanderer(); if (z) hsToWall(z); }
    else if (r < 0.7) hsRouteGroup(Math.round(rr2(3, 6) * D.n), pickR(['R1', 'R2', 'R3', 'R4', 'R5']), null, 'minor');
    else if (r < 0.85) { const d = HS.wild.find(w => w.k === 'deer'); if (d) { const z = hsAddZ(d.x - 40, d.y - 20); if (z) { z.st = 'chase'; z.prey = d; } } }
    else { const s = HF.walls.find(q => q.kind === 'culvert') || pickR(HF.walls); hsRouteGroup(2, 'R3', s, 'probe'); }
  }
  if (now > N.medium) { N.medium = now + rr2(12, 20) * 60 * D.iv; HS.stats.attacks.medium++; const flank = pickR(HF.towers); hsRouteGroup(Math.round(rr2(8, 12) * D.n), pickR(['R2', 'R3', 'R4', 'R5']), HF.walls[flank.seg], 'medium'); hsLog('pack', {}, true); }
  if (now > N.major) { N.major = now + rr2(30, 45) * 60 * D.iv; HS.stats.attacks.major++; hsMajor(Math.round(rr2(25, 40) * D.n), 2); }
  if (now > N.siege) { N.siege = now + rr2(100, 140) * 60 * D.iv; HS.stats.attacks.siege++; hsMajor(Math.round(rr2(60, 80) * D.n), 3, true); }
  // expeditions: 3-5 per day in the morning/afternoon windows
  if (now > N.exp) { const h = HS.life; N.exp = now + rr2(0.18, 0.32) * DAY_SEC; if (h > 6.5 && h < 16 && HS.alarm <= 0 && HS.exps.length < 2) hsStartExpedition(); }
  // replenishment
  if (now > N.arrive) { const alive = HS.people.filter(p => p.alive).length; N.arrive = now + (alive < HS.floor ? rr2(120, 240) : rr2(360, 600)); if (alive < HS.target && HS.arrivals.length < 2) hsArrival(); }
  // weather / seasons (auto)
  if (now > N.wx) { N.wx = now + rr2(0.06, 0.16) * DAY_SEC; if (HS.wxMode === 'auto') { const r = HS.R(); const nw = r < 0.62 ? 'clear' : r < 0.86 ? 'rain' : 'wind'; if (nw !== HS.weather) { HS.weather = nw; hsLog('wx', { w: nw }); } } }
}
function hsMajor(n, routes, siege) {
  const rs = ['R1', 'R2', 'R3', 'R4', 'R5'].sort(() => HS.R() - 0.5).slice(0, routes);
  if (siege) rs[0] = 'R1';
  for (const r of rs) hsRouteGroup(Math.ceil(n / routes), r, null, siege ? 'siege' : 'major');
  hsLog(siege ? 'siege' : 'major', {}, true); HS.majorAt = HS.t;
}
// alarm + pressure bookkeeping (once per tick)
function hsThreat(dt) {
  for (const s of HF.walls) { if (HS.t - (s.lastHit || -99) > 1.5) s.pressure = 0; else s.pressure = Math.max(0, (s.pressure || 0) - dt * 2); }
  let nearWall = 0, inside = 0;
  for (const z of HS.zombies) { if (z.st === 'dead') continue; if (isInside(z.x, z.y)) inside++; else if (z.st === 'wall' || z.st === 'gate') nearWall++; }
  HS.zInside = inside; if (inside > HS.stats.zInside) HS.stats.zInside = inside; if (HF.breaches > HS.stats.breachMax) HS.stats.breachMax = HF.breaches;
  let close = 0; for (const z of HS.zombies) if (z.st !== 'dead' && (z.st === 'march' || z.st === 'investigate' || z.st === 'wall' || z.st === 'gate') && !isInside(z.x, z.y)) { const [u, v] = w2d(z.x, z.y); if (v > wallV(u) - 70) close++; }
  if (nearWall >= 6 || inside > 0 || close >= 9) hsAlarm('wall');
  if (HS.alarm > 0) { HS.alarm -= dt; if (HS.alarm <= 0) { HS.alarm = 0; hsLog('clear', {}); HS.mode = 'recovery'; HS.recoverT = 90; } }
  HS.mode = HS.alarm > 0 ? 'attack' : (HS.recoverT > 0 ? 'recovery' : 'peace'); if (HS.recoverT > 0) HS.recoverT -= dt;
}

// ---------------------------------------------------------------- main tick
function hsTick(dt) {
  HS.t += dt;
  if (HS.timeMode === 'auto') { HS.hour += dt * 24 / DAY_SEC; if (HS.hour >= 24) { HS.hour -= 24; HS.day++; hsLog('dawn', { d: HS.day }); if (HS.seasonMode === 'auto' && HS.day % 2 === 1) HS.season = SEASONS[(SEASONS.indexOf(HS.season) + 1) % 4]; } }
  else HS.hour = FIXED_H[HS.timeMode];
  HS.life = lifeHour();
  if (HS.wxMode !== 'auto') HS.weather = HS.wxMode;
  shBuild();
  hsDirector(dt);
  hsThreat(dt);
  // noises: infected hear and investigate (outside: straight to the noise; inside noise: the nearest wall section)
  for (const n of HS.noises) shNear(SHZ, n.x, n.y, n.r, z => { if (z.st === 'wander' || z.st === 'idle' || (z.st === 'march' && HS.R() < 0.2)) { if (isInside(n.x, n.y) && !isInside(z.x, z.y)) { let best = null, bd = 1e9; for (const s of HF.walls) { if (s.outT < 0) continue; const d = (s.x - n.x) ** 2 + (s.y - n.y) ** 2; if (d < bd) { bd = d; best = s; } } hsToWall(z, best); } else { z.st = 'investigate'; z.t = 0; hsGo(z, n.x + rr2(-10, 10), n.y + rr2(-10, 10), 'z'); } } });
  HS.noises.length = 0;
  for (const p of HS.people) { p.px = p.x; p.py = p.y; if (p.arriving) continue; if (p.exp && p.alive && p.st !== 'down') continue; if (p.rescue && p.alive) continue; hsPerson(p, dt); }
  HS.exps = HS.exps.filter(e => hsExp(e, dt));
  HS.rescues = HS.rescues.filter(r => hsRescue(r, dt));
  HS.arrivals = HS.arrivals.filter(a => hsArrive(a, dt));
  for (const z of HS.zombies) { z.px = z.x; z.py = z.y; hsZ(z, dt); }
  for (const w of HS.wild) { w.px = w.x; w.py = w.y; hsWild(w, dt); }
  hsGate(dt);
  // cleanup: corpses fade, the dead are carried to the memorial
  HS.zombies = HS.zombies.filter(z => z.st !== 'dead' || z.corpseT > -5);
  if (HS.zombies.length > 160) HS.zombies = HS.zombies.filter(z => z.st !== 'dead' || z.corpseT > 20);
  for (const p of HS.people) if (!p.alive && p.deadT < 0 && !p.gone) { p.gone = true; if (HF.memorial) HF.memorial.stones++; }
  HS.people = HS.people.filter(p => !p.gone);
  for (const f of HS.fx) f.t -= dt; HS.fx = HS.fx.filter(f => f.t > 0);
}
