'use strict';
// ===== Holdfast — autonomous simulation: settlers, infected, wildlife, combat, expeditions, director (no DOM, no canvas) =====
const DAY_SEC = 1200;                                   // one in-game day = 20 real minutes
const DANGER = { calm: { n: 0.55, die: 0.06, iv: 1.4 }, standard: { n: 1, die: 0.2, iv: 1 }, grim: { n: 1.6, die: 0.5, iv: 0.75 } };
const FIXED_H = { morning: 8, noon: 12.5, dusk: 18.6, night: 22.5 };
const HS = {
  t: 0, day: 1, hour: 6.5, life: 6.5, timeMode: 'auto', wxMode: 'auto', weather: 'clear', season: 'summer', danger: 'standard',
  people: [], zombies: [], wild: [], fx: [], noises: [], log: [], exps: [], rescues: [], arrivals: [], spots: new Map(),
  alarm: 0, alarmT: 0, mode: 'peace', target: 120, floor: 90, R: null, next: {}, stats: { shots: 0, kills: 0, deaths: 0, injuries: 0, arrivals: 0, exp: 0, expLost: 0, expOk: 0, expHurt: 0, expDead: 0, rescues: 0, breaches: 0, repairs: 0, attacks: { minor: 0, medium: 0, major: 0, siege: 0 }, zInside: 0, breachMax: 0 },
  onEvent: null, sound: null, pid: 0, zid: 0
};
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const Z_WANDER = 20, Z_BAND = 12;                      // roaming infected kept alive in the wilderness / in the band the default camera sees (x danger x device)
const ROLE_MIX = [['guard', 30], ['farmer', 13], ['builder', 8], ['tech', 4], ['smith', 2], ['groom', 3], ['medic', 5], ['cook', 4], ['fisher', 4], ['scav', 9], ['trader', 6], ['teacher', 2], ['herder', 2], ['elder', 8], ['kid', 14], ['adult', 6]];   // milestone 6: work spread over every zone
const rr2 = (a, b) => a + HS.R() * (b - a), pickR = a => a[Math.floor(HS.R() * a.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function hsLog(k, p, bad) { const e = { day: HS.day, h: HS.hour, k, p: p || {}, bad: !!bad }; HS.log.push(e); if (HS.log.length > 80) HS.log.shift(); if (HS.onEvent) HS.onEvent(e); }
function hsSound(k, x, y, v) { if (HS.sound) HS.sound(k, x, y, v); }

// ---------------------------------------------------------------- setup
function hsInit(opt) {
  opt = opt || {}; if (HF.era === 'past') pastPre(); HS.R = mulberry32(opt.seed || 11); HS.seed0 = opt.seed || 11; HS.target = opt.pop || 120; HS.floor = Math.round(HS.target * 0.75);
  HS.people = []; HS.zombies = []; HS.wild = []; HS.fx = []; HS.noises = []; HS.log = []; HS.exps = []; HS.rescues = []; HS.arrivals = [];
  HS.spots.clear(); HS.vacant = []; HS.alarm = 0; HS.mode = 'peace'; HS.recoverT = 0; HS.stats.exp = 0;
  // the viewer arrives at an arbitrary daytime moment of an ongoing world (a seeded hour unless one is asked for): no "day 1"
  HS.t = 0; HS.day = 1; HS.hour = HS.life = opt.hour != null ? opt.hour : 7 + HS.R() * 10;
  if (HS.timeMode !== 'auto' && opt.hour == null) HS.hour = HS.life = FIXED_H[HS.timeMode];   // a remembered fixed time of day applies from the first frame
  HS.weather = HS.wxMode !== 'auto' ? HS.wxMode : (HS.R() < 0.8 ? 'clear' : 'wind');
  HF.breaches = 0; HS.zScale = HS.zScale || clamp(HS.target / 120, 0.6, 1); HS.view = null;
  hwInit();                                             // crop plots, stores, delivery points, spot zones
  lfInit();                                             // milestone 6: horses, stalls, repairs, graves, farmyard animals, zone spots
  const scale = HS.target / 120, roles = [];
  for (const [r, n] of ROLE_MIX) for (let i = 0; i < Math.max(r === 'teacher' ? 1 : 1, Math.round(n * scale)); i++) roles.push(r);
  while (roles.length > HS.target) roles.splice(roles.findIndex(r => r === 'adult' || r === 'trader'), 1);
  roles.forEach((r, i) => hsAddPerson(r, null, i));
  // tiers: 16 named (rich routines + chronicle), ~25% ambient (simple loops), the rest scheduled workers
  const named = new Set(['guard', 'scav', 'medic', 'builder', 'farmer', 'teacher', 'elder', 'cook', 'fisher', 'groom', 'smith', 'herder']);
  let n = 0; for (const p of HS.people) if (n < Math.round(16 * scale) && named.has(p.role) && (p.role !== 'guard' || n % 3 === 0)) { p.tier = 0; p.name = NAMES[n % NAMES.length]; n++; }
  const amb = HS.people.filter(p => p.tier === 1 && (p.role === 'adult' || p.role === 'elder'));   // traders and kids keep their own routines (market, school)
  for (let i = 0; i < amb.length && i < Math.round(30 * scale); i++) amb[i].tier = 2;
  // guard posts: towers, gate, patrol, reserve
  const guards = HS.people.filter(p => p.role === 'guard'); let gi = 0;
  for (const t of HF.towers) for (let s = 0; s < (t.main ? 2 : 1); s++) { const g = guards[gi++]; if (g) { g.post = { k: 'tower', t: t.id, slot: s }; g.shift = gi % 2; } }
  for (let s = 0; s < 4; s++) { const g = guards[gi++]; if (g) { g.post = { k: 'gate', slot: s }; g.shift = s % 2; } }
  for (let s = 0; s < 6; s++) { const g = guards[gi++]; if (g) { g.post = { k: 'patrol', wp: Math.floor((s + HS.R() * 0.8) / 6 * HF.patrol.length), dirn: s % 2 ? 1 : -1 }; g.shift = s % 2; } }   // milestone 6: 6 patrols, the rest reserve (they train)   // spread along the wall
  while (gi < guards.length) { const g = guards[gi++]; g.post = { k: 'reserve' }; g.shift = gi % 2; }
  // night shift guards also cover towers at night (swap duties)
  // initial wildlife + infected
  for (let h = 0; h < 5; h++) hsSpawnHerd();
  for (let i = 0; i < 6; i++) hsAddWild('rabbit', ...hsWildPoint());
  for (let i = 0; i < 2; i++) hsAddWild('dog', HF.oak.x + 10 + i * 8, HF.oak.y + 20);
  for (let i = 0; i < 3; i++) hsAddWild('crows', ...hsWildPoint());
  for (let i = 0; i < Math.round(Z_WANDER * DANGER[HS.danger].n * HS.zScale); i++) hsSpawnWanderer(true);
  for (let i = 0; i < Math.round(Z_BAND * DANGER[HS.danger].n * HS.zScale); i++) hsSpawnBand(true);     // the frontier is already busy
  const now = HS.t, iv = DANGER[HS.danger].iv;
  if (HF.era === 'past') pastInit();
  HS.next = { minor: now + rr2(30, 70), medium: now + rr2(6, 10) * 60 * iv, major: now + rr2(18, 28) * 60 * iv, siege: now + rr2(100, 140) * 60 * iv, exp: now + rr2(30, 60), wx: now + 300, arrive: now + 240, act: 0 };
  hsWarmStart();
}
function hsWildPoint() { for (let n = 0; n < 200; n++) { const k = Math.floor(HS.R() * HN * HN); if (HF.walk[k] & W_OUT && (HF.gk[k] === GK.MEADOW || HF.gk[k] === GK.WGRASS) && hsFarFromWall(k, 12)) return tileC(k); } return tileC(HF.gate.outTile); }
function hsFarFromWall(k, n) { const [x, y] = tileC(k); const [u, v] = w2d(x, y); return v < wallV(u) - n * 4; }
function hsHomeFor(role) {
  if (role === 'guard') { const b = HF.buildings.find(b => b.kind === 'barracks'); return { x: b.x + 8 + HS.R() * (b.w - 16), y: b.door[1], b: b.id }; }   // the whole barracks front, not one door
  const lots = HF.lots; const L = lots[HS.pid % lots.length]; const b = HF.buildings[L.b]; return { x: b.door[0], y: b.door[1], b: b.id, lot: L.id };
}
function hsAddPerson(role, at, i) {
  const L = hfLook(role, HS.R), home = hsHomeFor(role);
  const p = { id: HS.pid++, tier: 1, name: '', role, L, x: 0, y: 0, z: 0, px: 0, py: 0, dir: 1, st: 'idle', task: null, path: null, t: 0, ph: HS.R() * 10, spd: role === 'kid' ? rr2(11, 12.4) : role === 'elder' ? rr2(6.2, 7) : rr2(8.7, 10.6), sch: rr2(-0.45, 0.45), hp: 3, inj: 0, alive: true, home, vis: true, variant: '', pose: 0, act: '', cool: 0, aim: null, shift: 0, stride: 0, bub: null, bubT: 0, carryT: 0, lane: rr2(-2.2, 2.2) };
  if (at) { p.x = at[0]; p.y = at[1]; }
  else { const s = hsPickSpot(role === 'kid' ? 'play' : role === 'guard' ? 'drill' : pickR(['green', 'bench', 'porch', 'seat', 'shop'])) || HF.spots.porch[HS.pid % HF.spots.porch.length]; p.x = s.x + rr2(-4, 4); p.y = s.y + rr2(-4, 4); }
  const k = hfNearPass(p.x, p.y, 'in', 20); if (k >= 0 && !hfPass(tileOfW(p.x, p.y), 'in')) [p.x, p.y] = tileC(k);
  if (role === 'farmer' && p.id % 3 === 0) p.sch -= 2.5;
  if (role === 'guard') p.sch *= 2;                         // 30 guards share one barracks: spread their comings and goings   // a late crew: some farmers work into the evening and start late
  p.px = p.x; p.py = p.y; HS.people.push(p); return p;
}

// ---------------------------------------------------------------- spots (claims keep people from stacking)
// Each spot has a capacity (SPOT_CAP) and busy areas have a zone capacity (ZONE_CAP); when both are full the settler goes
// somewhere sensible near home instead (hwFallback). Single-point places (granary, storage, ...) hand out ring positions.
function hsPickSpot(name, near) {
  const list = HF.spots[name]; if (!list || !list.length) return hwFallback(near);
  const cap = SPOT_CAP[name] || 99, zone = list[0].zone;
  let best = null, bs = 1e9;
  if (!hwZoneFull(zone) || NO_FALLBACK.has(name)) for (const s of list) { const c = HS.spots.get(s) || 0; if (c >= cap) continue; if (s.zone !== zone && hwZoneFull(s.zone)) continue; const d = near ? Math.hypot(s.x - near.x, s.y - near.y) / 220 : 0, sc = c * 0.7 + d + HS.R() * 0.9; if (sc < bs) { bs = sc; best = s; } }
  if (best) return best;
  if (NO_FALLBACK.has(name)) { for (const s of list) { const c = HS.spots.get(s) || 0, sc = c + HS.R() * 0.5; if (sc < bs) { bs = sc; best = s; } } return best; }
  return hwFallback(near);
}
// a settler holds at most one claim (p.claimed); any new task, death or departure releases it, so claims can never leak
function hsClaim(p, s) { if (p.claimed) claim(p.claimed, -1); p.claimed = s || null; if (s) claim(s, 1); }
const claim = (s, d) => { if (!s) return; const was = HS.spots.get(s) || 0, now = Math.max(0, was + d); HS.spots.set(s, now); if (s.zone && HS.zoneN) HS.zoneN[s.zone] += now - was; };

// ---------------------------------------------------------------- warm start: Holdfast is already alive when the viewer arrives
// Nobody spawns at a shared entrance and walks to work. Each settler runs its normal schedule once and is then placed *inside*
// that activity (at the post, in the field, at the dock, part-way along a walk); infected and wildlife are spread over the
// valley; an expedition may be at any stage. Deterministic for a given seed, a few milliseconds, no simulated warm-up.
function hsPlace(a, x, y, mask) {
  const k = hfNearPass(x, y, mask, 8); if (k < 0) return false;
  if (hfPass(tileOfW(x, y), mask)) { a.x = x; a.y = y; } else [a.x, a.y] = tileC(k);
  a.px = a.x; a.py = a.y; a.path = null; a.dir = Math.floor(HS.R() * 4); return true;
}
function hsAdvance(a, frac, speed) {      // walk `frac` of the way along the current path (follows the flow field: never through a wall)
  const P = a.path; if (!P) return true; if (P.direct) return hsStep(a, 99, speed); const d0 = (P.f || (P.f = hfFlow(P.mask, P.tk)))[tileOfW(a.x, a.y)]; if (d0 < 0) return true;
  const want = Math.max(0, frac) * d0 / 2.2 * HT; let moved = 0;
  for (let n = 0; n < 600 && moved < want; n++) { const x0 = a.x, y0 = a.y; if (hsStep(a, 0.1, speed)) return true; moved += Math.hypot(a.x - x0, a.y - y0); }
  a.px = a.x; a.py = a.y; return false;
}
function hsSettle(p) {
  const R = HS.R; p.task = null; p.path = null; p.stride = R() * 30; hsThink(p);
  const T = p.task; if (!T) return;
  if (T.k === 'tower') { const t = T.tower, slot = p.post.slot ? [t.x + 13, t.y + 7] : [t.x + 7, t.y + 13]; p.x = slot[0]; p.y = slot[1]; p.z = 48.2; p.px = p.x; p.py = p.y; p.path = null; T.ph = 'do'; p.onTower = { t, slot: p.post.slot, climb: 1 }; p.variant = 'carry'; p.cool = R() * 3; return; }
  if (T.k === 'patrol') { const n = HF.patrol.length, prev = (p.post.wp - p.post.dirn + n) % n, [px, py] = tileC(HF.patrol[prev]); p.x = px; p.y = py; hsGo(p, T.x, T.y, 'in'); if (p.path) { T.ph = 'go'; hsAdvance(p, R() * 0.9, p.spd); } p.px = p.x; p.py = p.y; p.cool = R() * 2; return; }
  const P = p.path;
  if (!P) { T.t = T.dur < 1e8 ? R() * T.dur * 0.9 : 0; return; }
  const transit = (T.k === 'walk' || T.k === 'play' ? 0.7 : T.k === 'carry' ? 0.4 : T.k === 'gatepost' || T.k === 'work' || T.k === 'repair' || T.k === 'treat' ? 0 : 0.2) > R();   // posts and workplaces: already there
  if (transit) { hsAdvance(p, 0.1 + R() * 0.8, p.spd); if (p.path) return; }
  if (!hsPlace(p, P.gx, P.gy, 'in')) hsPlace(p, ...tileC(P.tk), 'in');
  T.ph = 'do'; T.t = T.dur < 1e8 ? R() * T.dur * 0.9 : 0; p.path = null;
  if (T.w !== undefined) { T.w = R() * T.dur * 0.8; T.t = 0; }      // a farmer is part-way through the plot
  if (T.k === 'haul' || T.k === 'build') T.t = 0;
}
function hsWarmExp() {
  const R = HS.R, e = R() < 0.85 ? hsStartExpedition() : null; if (!e) return;
  const q = R(), ph = q < 0.2 ? 'prep' : q < 0.5 ? 'out' : q < 0.75 ? 'search' : 'back', poi = e.poi.spots[0], g = HF.gate;
  const put = (x, y, mask) => { for (const p of e.team) { hsPlace(p, x + rr2(-6, 6), y + rr2(-6, 6), mask); p.task = { k: 'exp', t: 0 }; p.px = p.x; p.py = p.y; } };
  g.open = 1;                                           // the gate is not the story here: nobody waits at it during the fast-forward
  if (ph === 'prep') { const s = HF.spots.yard[0]; put(s.x, s.y, 'in'); e.t = R() * 25; }
  else if (ph === 'out') { const [x, y] = tileC(g.outTile); put(x, y + 14, 'all'); e.ph = 'out'; for (let n = 0, N = Math.floor(R() * 800); n < N && e.ph === 'out'; n++) hsExp(e, 0.1); }
  else if (ph === 'search') { put(poi[0], poi[1], 'all'); e.ph = 'search'; e.t = R() * 15; }
  else { put(poi[0], poi[1], 'all'); e.ph = 'back'; for (let n = 0, N = Math.floor(R() * 700); n < N && e.ph === 'back'; n++) hsExp(e, 0.1); }
  g.open = 0; g.users = 0; g.force = 0; for (const p of e.team) { p.px = p.x; p.py = p.y; }
}
function hsWarmStart() {
  const R = HS.R, n = DANGER[HS.danger].n;
  HS.life = lifeHour();
  for (const p of HS.people) if (p.role !== 'guard') hsSettle(p);
  for (const p of HS.people) if (p.role === 'guard') hsSettle(p);
  hsWarmExp();
  // infected: scattered over the wilderness, not all moving at once; sometimes a small group is already marching in
  for (const z of HS.zombies) { z.ph = R() * 10; if (R() < 0.3) { z.st = 'idle'; z.idle = rr2(2, 8); z.t = R() * z.idle; } else z.t = R() * 4; }
  if (R() < 0.55 * Math.min(1, n)) {
    const zs = hsRouteGroup(Math.round(rr2(3, 5) * n), pickR(['R1', 'R2', 'R3', 'R4', 'R5']), null, 'minor');
    for (const z of zs) { const r = z.route, i = 1 + Math.floor(R() * Math.max(1, r.pts.length - 2)), k = hfNearPass(r.pts[i][0] + rr2(-10, 10), r.pts[i][1] + rr2(-10, 10), 'out', 8); if (k >= 0) { [z.x, z.y] = tileC(k); z.rp = i + 1; z.delay = 0; } }
  }
  for (const w of HS.wild) { w.t = R() * 5; w.ph = R() * 10; }
  // one beat so every actor has chosen its pose and facing before the first frame; the chronicle starts empty (nothing "began")
  for (let i = 0; i < 2; i++) hsTick(0.05);
  HS.t = 0; HS.log = []; HS.next.minor = rr2(25, 70); HS.next.exp = rr2(40, 120);
  for (const a of [...HS.people, ...HS.zombies, ...HS.wild]) { a.px = a.x; a.py = a.y; }
}

// ---------------------------------------------------------------- movement
function hsGo(a, x, y, mask, run, at) {   // `at`: route to this point's tile (a spot), finish at x, y — jitter around a spot reuses one flow field
  const k = at ? hfNearPass(at.x, at.y, mask, 14) : hfNearPass(x, y, mask, 14); if (k < 0) return false;
  if (mask === 'z' && (HF.walk[k] & W_OUT) && (HF.walk[tileOfW(a.x, a.y)] & W_OUT)) mask = 'out';   // outside -> outside never needs the gate: static, cached flow
  a.path = { mask, tk: k, gx: x, gy: y, f: null, run: !!run, stuck: 0, lx: a.x, ly: a.y, rs: (HS.R() * 0x7fffffff) | 0, side: 0 }; if (a.role && a.st !== 'down') a.st = 'walk'; return true;
}
function hsStep(a, dt, speed) {   // returns true when arrived
  const P = a.path; if (!P) return true;
  if (P.direct) {   // short straight walk across open ground (along a crop plot)
    const dx = P.gx - a.x, dy = P.gy - a.y, d = Math.hypot(dx, dy), s = speed * dt; if (d <= s || d < 0.05) { a.x = P.gx; a.y = P.gy; a.path = null; return true; }
    const nx = a.x + dx / d * s, ny = a.y + dy / d * s; if (!hfPass(tileOfW(nx, ny), P.mask)) { a.path = null; return true; }   // blocked: choose again
    a.x = nx; a.y = ny; a.stride += s; if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 0 : 2; else a.dir = dy > 0 ? 1 : 3; return false;
  }
  const k = tileOfW(a.x, a.y), f = P.mask === 'z' ? hfFlow('z', P.tk) : (P.f || (P.f = hfFlow(P.mask, P.tk)));   // flow fields are built lazily, on the first step
  let tx, ty;
  if (k === P.tk || f[k] === 0) { tx = P.gx; ty = P.gy; if (!hfPass(tileOfW(tx, ty), P.mask)) [tx, ty] = tileC(P.tk); }
  else {
    if (f[k] < 0) { const nk = hfNearPass(a.x, a.y, P.mask, 3); if (nk < 0 || f[nk] < 0) { a.path = null; return true; } [tx, ty] = tileC(nk); }
    else {
      // any near-optimal downhill step, chosen by a per-trip hash: equally short routes differ between people and trips
      const i = k % HN, j = (k / HN) | 0, fk = f[k]; let bk = -1, bs = -1e9;
      for (let n = 0; n < 8; n++) { const ii = i + DX8[n], jj = j + DY8[n]; if (!inMap(ii, jj)) continue; const m = jj * HN + ii, d = f[m]; if (d < 0 || d >= fk) continue; if (DX8[n] && DY8[n] && (f[j * HN + ii] < 0 || f[jj * HN + i] < 0)) continue;
        const sc = (fk - d) / (DX8[n] && DY8[n] ? 1.414 : 1) + ((Math.imul(m, 2654435761) ^ P.rs) >>> 0) % 1000 / 1000 * 0.35; if (sc > bs) { bs = sc; bk = m; } }
      if (bk < 0) { a.path = null; return true; }
      [tx, ty] = tileC(bk); const L = a.lane || 0; tx += L; ty -= L;
      if (a.role && SHP.length) {   // local avoidance: step around someone just ahead on the same lane
        const ux = tx - a.x, uy = ty - a.y, ul = Math.hypot(ux, uy) || 1; let side = 0;
        shNear(SHP, a.x + ux / ul * 3, a.y + uy / ul * 3, 3.2, q => { if (q === a || q.onTower) return; const cr = ux * (q.y - a.y) - uy * (q.x - a.x); side = cr > 0 ? -1 : 1; });
        P.side += ((side * 2.6) - P.side) * 0.25; if (Math.abs(P.side) > 0.05) { tx += -uy / ul * P.side; ty += ux / ul * P.side; }
      }
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
  if (HF.era === 'past') return pastShoot(a, z, from, range, base);
  const d = Math.hypot(z.x - a.x, z.y - a.y); if (d > range) return false;
  const night = hsDark(), p = clamp(base - d / 1000 - (night ? 0.14 : 0) - (HS.weather === 'rain' ? 0.08 : 0), 0.15, 0.95), hit = HS.R() < p;
  HS.stats.shots++; hsNoise(a.x, a.y, 230, 'shot'); hsSound('shot', a.x, a.y, from.z ? 0.9 : 0.7);
  const tx = hit ? z.x : z.x + rr2(-8, 8), ty = hit ? z.y : z.y + rr2(-8, 8);
  HS.fx.push({ k: 'tracer', x0: from.x, y0: from.y, z0: from.z || 12, x1: tx, y1: ty, z1: hit ? 12 : 0, t: 0.13 }, { k: 'flash', x: from.x, y: from.y, z: (from.z || 12) + 1, t: 0.07 });
  if (hit) hsHitZ(z, a, HS.R() < 0.18 ? 9 : 1); else HS.fx.push({ k: 'dust', x: tx, y: ty, t: 0.4 });
  return true;
}
function hsHitZ(z, a, dmg) {
  z.hp -= dmg; z.st2 = 'stagger'; z.stT = z.stag != null ? z.stag : 0.45; const dx = z.x - a.x, dy = z.y - a.y, d = Math.hypot(dx, dy) || 1, kb = z.stag != null ? 2 + z.stag * 10 : 6; z.kx = dx / d * kb; z.ky = dy / d * kb;
  HS.fx.push({ k: 'hit', x: z.x, y: z.y, t: 0.2 });
  if (z.hp <= 0) { z.st = 'dead'; z.corpseT = rr2(90, 150); z.path = null; HS.stats.kills++; HS.fx.push({ k: 'dust', x: z.x, y: z.y, t: 0.6 }); hsSound('fall', z.x, z.y, 0.6); }
}
function hsHurt(p, z) {
  if (!p.alive || p.st === 'dead') return;
  if (p.mount) { p.inj = 1; HS.fx.push({ k: 'hit', x: p.x, y: p.y, t: 0.25, h: 1 }); hsSound('hurt', p.x, p.y, 0.6); if (p.ride) p.ride.chased = true; return; }   // a rider keeps the saddle and gallops home
  p.hp--; HS.fx.push({ k: 'hit', x: p.x, y: p.y, t: 0.25, h: 1 }); hsSound('hurt', p.x, p.y, 0.6);
  if (p.hp <= 0) {
    if (HS.R() < DANGER[HS.danger].die) hsKill(p, z);
    else { p.inj = 2; p.hp = 1; p.st = 'down'; p.task = { k: 'down', t: 0 }; p.path = null; HS.stats.injuries++; hsLog('hurt', { n: hsName(p) }, true); }
  } else if (p.hp === 1 && !p.inj) { p.inj = 1; HS.stats.injuries++; }
}
function hsKill(p) {
  hsClaim(p, null); if (p.mount) { p.mount.st = 'loose'; p.mount.rider = null; p.mount = null; } p.alive = false; p.st = 'dead'; p.deadT = 60; p.path = null; p.task = null; HS.stats.deaths++;
  if (p.post && p.post.k !== 'reserve') (HS.vacant = HS.vacant || []).push(p.post);
  hsLog('died', { n: hsName(p), r: p.role }, true); hsSound('loss', p.x, p.y, 0.5);
  for (const e of HS.exps) e.team = e.team.filter(q => q !== p);
}
const hsName = p => p.name || ('#' + p.role);
const hsDark = () => { const h = HS.hour; return h < 5.6 || h > 19.4; };

// ---------------------------------------------------------------- settlers: schedule -> tasks
function lifeHour() { return HS.timeMode === 'auto' ? HS.hour : (FIXED_H[HS.timeMode] + 2.5 * Math.sin(HS.t / DAY_SEC * TAU) + 24) % 24; }
function onShift(p) { const h = (HS.life + (p.sch || 0) + 24) % 24, day = h >= 6 && h < 18; return p.shift ? !day : day; }   // shift edges staggered per guard
function hsThink(p) {
  const h = (HS.life + (p.sch || 0) + 24) % 24, alarm = HS.alarm > 0, R = HS.R;   // personal schedule offset: nobody changes activity on the same tick
  HS.cur = p;
  if (p.inj && p.st !== 'down' && p.task?.k !== 'bed') return hsBed(p);
  if (p.exp) return;                              // expedition controller drives scavengers out of the gate
  if (p.rescue) return;
  if (p.ride) return;                             // mounted scouts are driven by their ride (lfRide)
  // alarm: kids and elders shelter, reserve guards and patrols reinforce
  if (alarm && (p.role === 'kid' || p.role === 'elder' || (p.tier === 2 && p.role !== 'guard'))) { const s = HF.spots.shelter[0]; return setTask(p, { k: 'shelter', x: s.x, y: s.y, run: 1 }); }
  if (p.role === 'guard') return guardThink(p);
  if (p.load) return setTask(p, hwDeliverTask(p));           // finish a delivery before anything else
  const meal = mealTime(h);
  const sleep = (h >= 21.6 || h < 5.4) && !(p.role === 'fisher' && p.id % 4 === 0);
  if (sleep) return setTask(p, { k: 'sleep', x: p.home.x, y: p.home.y });
  if (meal && p.role !== 'cook' && R() < 0.85 && !(p.role === 'trader' && h > 18 && HS.stalls.some(s => s.open))) { const r = R(), s = hsPickSpot(r < 0.4 ? 'seat' : r < 0.6 ? 'green' : r < 0.85 ? 'porch' : 'bench', p); return setTask(p, { k: 'eat', spot: s, x: s.x + rr2(-1.5, 1.5), y: s.y + rr2(-1, 1), dur: rr2(20, 40) }); }
  const rain = HS.weather === 'rain';
  if (p.tier === 2) return ambientThink(p, rain);
  if (p.role !== 'medic' && p.role !== 'trader') { const mc = lfMinorCheckup(p); if (mc) return setTask(p, mc); }   // a splinter, a scraped knee: off to the hospital bench
  switch (p.role) {
    case 'farmer': { const fs = R() < 0.06 && h > 8 && h < 18 && lfShopTask(p); if (fs) return setTask(p, fs); if (rain && R() < 0.15) return setTask(p, { k: 'sit', ...spotXY('porch'), dur: rr2(15, 30) }); const j = hwFarmJob(p); if (j) return setTask(p, j); return setTask(p, (R() < 0.5 && hwHaulJob(p)) || { k: 'work', ...spotXY('yardwork'), dur: rr2(12, 20), tool: 'hoe', anim: 'hoe' }); }
    case 'fisher': { const sh = R() < 0.12 && h > 8 && h < 18 && lfShopTask(p); if (sh) return setTask(p, sh); if (HS.R2() < 0.3 && lfOpen('bankfish')) { const s = spotXY('bankfish'); HS.Ls.bankfish++; return setTask(p, { k: 'work', ...s, dur: rr2(40, 80), tool: 'rod', anim: 'fish', bank: 1, face: { x: s.x + s.spot.wdx * 9, y: s.y + s.spot.wdy * 9 } }); } return setTask(p, { k: 'work', ...spotXY('fish', 1), dur: rr2(40, 80), tool: 'rod', anim: 'fish' }); }
    case 'groom': return setTask(p, lfStableJob(p));
    case 'smith': return setTask(p, lfForgeJob(p));
    case 'herder': return setTask(p, lfHerdJob(p));
    case 'cook': return setTask(p, hwCookJob(p));
    case 'builder': { const s = hsRepairJob(p); if (s) return setTask(p, s); const hj = lfHouseJob(p); if (hj) return setTask(p, hj); const rf = R() < 0.18 && lfReinforceJob(p); if (rf) return setTask(p, rf); return setTask(p, R() < 0.3 ? lfSawJob(p) : hwBuildJob(p)); }
    case 'tech': return setTask(p, lfTechJob(p));
    case 'medic': { const pat = HS.people.find(q => q.alive && q.inj === 2 && !q.medic && isInside(q.x, q.y)); if (pat) { pat.medic = p; HS.Ls.stretcher++; return setTask(p, { k: 'treat', x: pat.x, y: pat.y, pat, run: 1, tool: 'stretcher' }); } return setTask(p, lfMedJob(p)); }
    case 'trader': { if (h > 6.5 && h < 18.6) { const tj = lfTraderJob(p, h); if (tj) return setTask(p, tj); if (HS.store.market < 2 && HS.store.food > 2 && R() < 0.6) return setTask(p, { k: 'haul', from: 'food', to: 'market', leg: 0, ...spotXY('granary'), dur: 2 }); } else { const tj = lfTraderJob(p, h); if (tj) return setTask(p, tj); } return setTask(p, { k: 'sit', ...hwHomeXY(p, 'porch'), dur: 20 }); }
    case 'teacher': return setTask(p, lfTeacherJob(p, h) || (R() < 0.4 ? { k: 'life', a: 'stand', ...spotXY('play', 4), dur: rr2(15, 25), anim: 'look' } : { k: 'sit', ...hwHomeXY(p, 'porch'), dur: 20 }));
    case 'kid': { const kj = lfKidJob(p, h, rain); if (kj) return setTask(p, kj); return setTask(p, rain ? { k: 'sit', ...hwHomeXY(p, 'porch'), dur: 25 } : { k: 'play', ...(R() < 0.65 ? spotXY('play') : hwHomeXY(p, 'yard')), dur: rr2(6, 14), run: 1 }); }
    case 'elder': { if (R() < 0.12) { const j = hwFarmJob(p); if (j && j.job !== 'harvest') return setTask(p, j); if (j) j.plot.worker = null; } const lj = R() < 0.4 && lfResidentJob(p, rain); if (lj) return setTask(p, lj); if (R() < 0.1) return setTask(p, lfHerdJob(p)); return setTask(p, R() < 0.45 ? { k: 'sit', ...(R() < 0.7 ? hwHomeXY(p, 'porch') : spotXY('bench')), dur: rr2(30, 60) } : R() < 0.5 ? hwChat(p) : { k: 'work', ...hwHomeXY(p, 'yard'), dur: 20, tool: 'hoe', anim: 'hoe' }); }
    case 'scav': { if (HS.gear < 3 && R() < 0.3 && lfOpen('gear')) return setTask(p, lfGearJob(p)); if (R() < 0.25) { const j = hwFarmJob(p); if (j) return setTask(p, j); } if (R() < 0.15) return setTask(p, lfStableJob(p)); const hj = R() < 0.5 && hwHaulJob(p); return setTask(p, hj || { k: 'sit', ...(R() < 0.5 ? hwHomeXY(p, 'porch') : spotXY('seat')), dur: 20 }); }
    default: return ambientThink(p, rain);
  }
}
// residents: household chores at their own lot, errands, visits; independent of each other
function ambientThink(p, rain) {
  const R = HS.R, r = R(), L = p.home && HS.lotSpot[p.home.lot];
  if (p.role === 'kid') return setTask(p, rain ? { k: 'sit', ...hwHomeXY(p, 'porch'), dur: 25 } : { k: 'play', ...(R() < 0.5 ? spotXY('play') : hwHomeXY(p, 'yard')), dur: rr2(6, 12), run: 1 });
  if (rain) return setTask(p, { k: 'sit', ...hwHomeXY(p, 'porch'), dur: rr2(20, 45) });
  if (p.tier === 1 && r > 0.86) { const j = hwFarmJob(p); if (j) return setTask(p, j); }   // neighbours lend a hand in the fields
  if (r < 0.28 && HS.life > 7.5 && HS.life < 18.3) { const sh = lfShopTask(p); if (sh) return setTask(p, sh); }   // errands at the market
  if (r < 0.56) { const lj = lfResidentJob(p, rain); if (lj) return setTask(p, lj); }   // a check-up, the graveyard, stories, watching the horses or the drills
  if (r < 0.63) { const hj = (HS.store.food > 12 || R() < 0.35) && hwHomeFood(p) || hwHaulJob(p); if (hj) return setTask(p, hj); }
  if (r < 0.74 && L && L.yard) { const c = R(); if (c < 0.4 && HS.R2() < 0.6) { const lj = lfLaundryJob(p, () => hwHomeXY(p, 'yard')); if (lj) return setTask(p, lj); } return setTask(p, { k: 'work', ...hwHomeXY(p, 'yard'), dur: rr2(12, 22), tool: c < 0.4 ? 'cloth' : c < 0.75 ? 'hoe' : 'bucket', anim: c < 0.4 ? 'hang' : c < 0.75 ? 'hoe' : 'water' }); }
  if (r < 0.88) return setTask(p, { k: 'sit', ...(R() < 0.7 ? hwHomeXY(p, 'porch') : spotXY('bench')), dur: rr2(20, 45) });
  return setTask(p, hwChat(p));
}
// own-lot spots first (spreads people over the whole settlement), the shared spot list otherwise
function hwHomeXY(p, which) { const L = p.home && HS.lotSpot[p.home.lot], s = L && L[which === 'yard' ? 'yard' : 'porch']; if (s && (HS.spots.get(s) || 0) < (which === 'yard' ? 1 : 2)) return { x: s.x + rr2(-2, 2), y: s.y + rr2(-1.5, 1.5), spot: s }; return spotXY(which === 'yard' ? 'yardwork' : which); }
// a visit: walk to a neighbour's porch; someone idle nearby may come over and talk
function hwChat(p) {
  const s = hwFallback(p), t = { k: 'chat', x: s.x + 3, y: s.y + 1, spot: s, dur: rr2(12, 22), anim: 'talk' };
  const q = HS.people.find(q => q !== p && q.alive && q.vis && q.tier > 0 && q.role !== 'guard' && !q.exp && !q.rescue && !q.load && !q.arriving && q.task && q.task.k === 'sit' && q.task.ph === 'do' && Math.hypot(q.x - s.x, q.y - s.y) < 90);
  if (q) setTask(q, { k: 'chat', x: s.x - 3, y: s.y - 1, dur: t.dur + rr2(-3, 3), anim: 'talk', with: p });
  return t;
}
function spotXY(name, jit) {
  const s = hsPickSpot(name, HS.cur), c = HS.spots.get(s) || 0;
  if ((SPOT_CAP[s.nm] || 99) > 3 && c > 0) { const a = c * 2.39996 + (HS.cur ? HS.cur.id : 0), r = 3.5 + 2.4 * Math.sqrt(c); return { x: s.x + Math.cos(a) * r, y: s.y + Math.sin(a) * r * 0.8, spot: s }; }   // ring around a shared point
  return { x: s.x + (jit ? rr2(-jit, jit) : 0), y: s.y + (jit ? rr2(-jit, jit) : 0), spot: s };
}
function setTask(p, t) {
  hsClaim(p, t.spot);
  if (p.task && p.task.plot && p.task.plot.worker === p) p.task.plot.worker = null;
  p.task = t; t.t = 0; t.ph = 'go';
  if (p.vis === false && t.k !== 'sleep' && t.k !== 'shelter') { p.vis = true; }
  p.variant = t.tool || (p.carry || ''); p.act = ''; if (!p.onTower && !p.mount) p.z = 0; if (!p.load) p.cart = 0;
  if (!hsGo(p, t.x, t.y, p.exp || p.rescue ? 'all' : 'in', t.run, t.spot && Math.hypot(t.spot.x - t.x, t.spot.y - t.y) < 14 ? t.spot : null)) { t.ph = 'do'; }
}
function hsBed(p) { const s = hsPickSpot('bed'); setTask(p, { k: 'bed', x: s.x, y: s.y, spot: s, dur: 1e9 }); }
function guardThink(p) {
  if (!p.post) { p.post = (HS.vacant && HS.vacant.shift()) || { k: 'reserve' }; p.shift = p.id % 2; }
  const P = p.post, alarm = HS.alarm > 0;
  if (!onShift(p) && !alarm) {
    const h = (HS.life + (p.sch || 0) + 24) % 24, meal = mealTime(h);
    if (meal) { const s = hsPickSpot(HS.R() < 0.7 ? 'seat' : 'bench', p); return setTask(p, { k: 'eat', spot: s, x: s.x, y: s.y, dur: 30 }); }
    if (h >= 22 || h < 5 || (h > 10 && h < 14 && p.shift)) return setTask(p, { k: 'sleep', x: p.home.x, y: p.home.y });
    const sh = HS.R() < 0.12 && h > 7.5 && h < 18 && lfShopTask(p); if (sh) return setTask(p, sh);   // off duty: the market
    return setTask(p, HS.R() < 0.3 ? { k: 'sit', ...spotXY(HS.R() < 0.5 ? 'seat' : 'bench'), dur: 30 } : lfTrainJob(p));
  }
  if (P.k === 'tower') { const t = HF.towers[P.t]; return setTask(p, { k: 'tower', x: t.base[0], y: t.base[1], tower: t, dur: 1e9, tool: 'carry' }); }
  if (P.k === 'gate') { const [gx, gy] = tileC(HF.gate.inTile); return setTask(p, { k: 'gatepost', x: gx + (P.slot - 1.5) * 6, y: gy + 2 + (P.slot % 2) * 3, dur: 60, anim: 'stand', tool: 'spear' }); }
  if (P.k === 'patrol') { P.wp = (P.wp + P.dirn + HF.patrol.length) % HF.patrol.length; const [x, y] = tileC(HF.patrol[P.wp]); return setTask(p, { k: 'patrol', x, y, dur: rr2(2, 6), tool: 'carry', anim: 'look' }); }
  // reserve: during an alarm hold the most threatened section, or an assigned station on the wall (never back to training); otherwise train
  if (alarm) { const hot = hsHotSeg(), s = hot && hot.inT >= 0 ? hot : HF.stations[p.id % HF.stations.length]; if (s && s.inT >= 0) { const [x0, y0] = tileC(s.inT), n = HS.people.filter(q => q.task && q.task.k === 'defend' && q.task.seg === s.id).length, a = n * 2.39996, r = n ? 5 + 3 * Math.sqrt(n) : 0, k = hfNearPass(x0 + Math.cos(a) * r, y0 + Math.sin(a) * r, 'in', 2), [x, y] = k >= 0 ? tileC(k) : [x0, y0]; return setTask(p, { k: 'defend', x: x + rr2(-2, 2), y: y + rr2(-2, 2), seg: s.id, dur: 20, tool: 'spear', run: 1 }); } }
  return setTask(p, lfTrainJob(p));
}
function hsHotSeg() { let best = null, bn = 0; for (const s of HF.walls) { if (s.gate) continue; const n = s.pressure || 0; if (n > bn || (s.hp <= 0 && bn < 99)) { bn = s.hp <= 0 ? 99 : n; best = s; } } return best; }
function hsRepairJob(p) {
  let best = null, bd = 1e9;
  for (const s of HF.walls) { if (s.gate || s.hp >= s.max || s.inT < 0 || s.fixer && s.fixer !== p && s.fixer.alive) continue; if ((s.pressure || 0) > 2 && s.hp > 0) continue; const [x, y] = tileC(s.inT), d = Math.hypot(x - p.x, y - p.y) - (s.max - s.hp) * 10; if (d < bd) { bd = d; best = s; } }
  if (!best) return null; best.fixer = p; const [x, y] = tileC(best.inT);
  if (HS.store.mat > 0 && best.hp > 0 && HS.R() < 0.8) { const w = HF.spots.wood2 ? lfWood(p) : spotXY('wood'); return { k: 'repair', fetch: 1, x: w.x, y: w.y, spot: w.spot, wx: x, wy: y, seg: best.id, dur: 1e9, tool: '', anim: 'hammer' }; }
  return { k: 'repair', x, y, seg: best.id, dur: 1e9, tool: 'hammer', anim: 'hammer' };
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
    const z = (p.noFight || 0) > HS.t ? null : nearestZ(p.x, p.y, p.role === 'guard' ? 140 : 46, q => hfPass(tileOfW(q.x, q.y), 'in') || dist(q, p) < 12);
    if (z) {
      if (p.role === 'guard' || p.role === 'builder' || (p.role === 'adult' && p.id % 2)) { if (dist(z, p) < 11) { melee(p, z); return; } if (!p.path || p.task?.k !== 'fight') { if (p.task?.k === 'fight' && p.task.zid === z.id && tileOfW(p.x, p.y) === hfNearPass(z.x, z.y, 'in', 4)) { p.noFight = HS.t + 8; p.task = null; } else { p.task = { k: 'fight', t: 0, ph: 'go', tool: 'spear', zid: z.id }; p.variant = 'spear'; hsGo(p, z.x, z.y, 'in', true); } } }
      else if (p.task?.k !== 'shelter') { const s = HF.spots.shelter[0]; setTask(p, { k: 'shelter', x: s.x, y: s.y, run: 1 }); }
    }
  }
  if (!T) { if (p.claimed) hsClaim(p, null); hsThink(p); return; }
  T.t += dt;
  if (p.path) {
    if (T.t > 150 && T.k !== 'repair') { p.path = null; setTask(p, { k: 'walk', x: p.x, y: p.y, dur: 1 }); return; }   // watchdog: nobody walks forever
    const run = p.path.run; p.vk = Math.min(1, (p.vk || 0.35) + dt * 3);   // ~0.2 s ease-in from standing, no instant full speed
    const sp = (run ? (p.role === 'elder' ? 8.4 : p.role === 'kid' ? 15 : 16.5) : p.spd) * (p.inj ? 0.55 : 1) * (HS.weather === 'rain' ? 1.08 : 1) * p.vk; if (hsStep(p, dt, sp)) { T.ph = 'do'; T.t = 0; } else return; }
  else p.vk = 0.35;
  if (T.ph === 'go') { T.ph = 'do'; T.t = 0; }
  // arrived: perform
  switch (T.k) {
    case 'sleep': case 'shelter': { p.vis = false; const h = (HS.life + (p.sch || 0) + 24) % 24;
      if (T.k === 'shelter' && HS.alarm <= 0) { if (!T.out) T.out = HS.t + rr2(1, 24); if (HS.t > T.out) { p.vis = true; p.task = null; } }   // leave the church one by one
      else if (T.k === 'sleep' && !((h >= 21.6 || h < 5.4) || (p.role === 'guard' && !onShift(p)))) { p.vis = true; p.task = null; } return; }
    case 'tower': { p.onTower = { t: T.tower, slot: p.post.slot, climb: 0 }; p.variant = 'carry'; return; }
    case 'bed': p.act = 'lie'; p.z = 2.4; if (p.inj) { p.healT = (p.healT || 0) + dt * (HS.people.some(q => q.role === 'medic' && q.alive && dist(q, p) < 60) ? 1.6 : 0.6); if (p.healT > 120) { p.inj = 0; p.hp = 3; p.healT = 0; p.medic = null; p.act = ''; p.task = null; hsLog('healed', { n: hsName(p) }); } } return;
    case 'treat': { const pat = T.pat; if (!pat.alive || pat.inj !== 2) { p.task = null; return; } if (dist(p, pat) > 10) { hsGo(p, pat.x, pat.y, 'all', true); return; } p.act = 'kneel'; if (T.t > 4) { pat.st = 'idle'; pat.medic = p; hsBed(pat); HS.store.medkit = Math.max(0, HS.store.medkit - 1); p.task = null; } return; }
    case 'repair': { const s = HF.walls[T.seg];
      if (T.fetch) { p.act = 'kneel'; if (T.t < 1.6) return; if (HS.store.mat > 0) { HS.store.mat--; T.plank = 1; p.variant = 'plank'; } T.fetch = 0; hsClaim(p, null); T.spot = null; T.x = T.wx; T.y = T.wy; T.t = 0; hsGo(p, T.wx, T.wy, 'in'); return; }
      p.variant = 'hammer'; p.act = 'hammer'; faceTo(p, s); if (T.t > (T.plank ? 1.1 : 1.6)) { T.t = 0; s.hp = Math.min(s.max, s.hp + 1); HS.stats.work.repairHp++; hsSound('hammer', p.x, p.y, 0.4); HS.fx.push({ k: 'dust', x: s.x + rr2(-3, 3), y: s.y + rr2(-2, 2), t: 0.35 }); if (HS.R() < 0.25) hsNoise(s.x, s.y, 110, 'hammer'); if (s.hp > 0 && s.breached && s.hp >= s.max * 0.3) hsCloseBreach(s); if (s.hp >= s.max) { s.fixer = null; HS.stats.repairs++; p.task = null; } } if ((s.pressure || 0) > 2 && !s.breached) { s.fixer = null; p.task = null; } return; }
    case 'defend': { const s = HF.walls[T.seg]; p.act = 'stand'; const z = nearestZ(p.x, p.y, 24) || nearestZ(s.x, s.y, 22); if (z) { faceTo(p, z); if (p.cool <= 0) { p.cool = 1.3; p.act = 'stab'; if (HS.R() < 0.6) hsHitZ(z, p, 1); hsSound('stab', p.x, p.y, 0.4); } } if (T.t > T.dur && !z) p.task = null; return; }
    case 'gatepost': { p.act = 'stand'; p.dir = 3; const z = nearestZ(HF.gate.x, HF.gate.y, 20); if (z) { faceTo(p, z); if (p.cool <= 0) { p.cool = 1.2; p.act = 'stab'; if (HS.R() < 0.65) hsHitZ(z, p, 1); hsSound('stab', p.x, p.y, 0.4); } } if (T.t > T.dur) p.task = null; return; }
    case 'patrol': { p.act = 'look'; const z = nearestZ(p.x, p.y, 70, q => !isInside(q.x, q.y)); if (z && p.cool <= 0) { p.cool = 2.2; faceTo(p, z); hsShoot(p, z, { x: p.x, y: p.y, z: 14 }, 70, 0.5); } if (T.t > T.dur) p.task = null; return; }
    case 'fight': { if (T.t > 0.5) p.task = null; return; }
    case 'eat': case 'sit': p.act = 'sit'; if (T.k === 'eat' && T.t > 3 && !p.bub && HS.R() < 0.01) bubble(p, pickR(['cup', 'heart', 'note', 'dots'])); if (T.t > (T.dur || 20)) { if (T.k === 'eat') hwAte(p); p.task = null; } return;
    case 'play': if (T.t > (T.dur || 8)) { if (HS.R() < 0.6) { const s = spotXY('play', 4); hsGo(p, s.x, s.y, 'in', true); T.t = 0; T.dur = rr2(3, 7); T.n = (T.n || 0) + 1; if (T.n > 4) p.task = null; } else p.task = null; } else p.act = 'jump'; return;
    case 'drop': p.act = 'kneel'; if (T.t > T.dur) { hwDrop(p, T); p.task = null; } return;
    case 'haul': return hwHaul(p, T, dt);
    case 'serve': return hwServe(p, T);
    case 'build': return hwBuild(p, T, dt);
    case 'respond': return hwRespond(p, T, dt);
    case 'life': return lfDo(p, T, dt);
    case 'carry': p.act = T.anim || 'stand'; if (T.t > T.dur) p.task = null; return;
    case 'drill': { if (HS.alarm > 0 && p.post && p.post.k === 'reserve' && (HS.tick10 || 0) % 10 === p.id % 10) { const hs = hsHotSeg(); if (hs && hs.inT >= 0) { p.task = null; return; } }   // alarm: leave the drill yard once a section is actually hit
      const i = T.spot ? HF.spots.drill.indexOf(T.spot) : -1; if (i >= 0) p.dir = i < 4 ? 1 : 3; const c = Math.floor((HS.t + p.ph) / 0.9) % 4; p.act = c === 0 ? 'stab' : c === 2 ? 'raise' : 'stand'; if (T.t > T.dur) p.task = null; return; }   // sparring in two facing rows
    case 'shop': case 'chat': p.act = 'talk'; if (T.with && T.with.alive) faceTo(p, T.with); if (T.t > T.dur) { if (T.k === 'shop' && HS.store.market > 0 && HS.R() < 0.6) { HS.store.market--; bubble(p, 'money'); } else if (HS.R() < 0.3) bubble(p, pickR(['dots', 'smile', 'laugh'])); p.task = null; } return;
    case 'walk': if (T.t > (T.dur || 3)) p.task = null; return;
    default:
      if (T.plot) return hwFarm(p, T, dt);
      if (T.anim === 'fish') return hwFish(p, T, dt);
      p.act = T.anim || 'stand'; if (T.t > (T.dur || 10)) { hwCooked(p, T); hwSalvaged(p, T); p.task = null; } return;
  }
}
function bubble(p, k) { p.bub = k; p.bubT = 2.5; }
function melee(p, z) { faceTo(p, z); p.act = 'stab'; if (p.cool <= 0) { p.cool = 1.1; if (HS.R() < 0.72) hsHitZ(z, p, p.role === 'guard' ? 2 : 1); hsSound('stab', p.x, p.y, 0.5); } }
function towerGuard(p, dt) {
  const T = p.onTower, t = T.t, lx = t.x + 9, ly = t.y + 19, slot = T.slot ? [t.x + 13, t.y + 7] : [t.x + 7, t.y + 13];
  const glide = (x, y) => { const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy), s = 7 * dt; if (d <= s) { p.x = x; p.y = y; return true; } p.x += dx / d * s; p.y += dy / d * s; p.stride += s; if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 0 : 2; else p.dir = dy > 0 ? 1 : 3; return false; };
  if (T.down) {   // shift over: walk to the ladder, climb down, step off to the base (no snapping)
    if (T.down === 1) { if (glide(lx, ly)) T.down = 2; return; }
    if (T.down === 2) { T.climb -= dt / 3; p.z = Math.max(0, T.climb) * 48; if (T.climb <= 0) { p.z = 0; T.down = 3; } return; }
    if (glide(t.base[0], t.base[1])) { p.onTower = null; p.task = null; } return;
  }
  if (T.climb < 1) { if (glide(lx, ly)) { T.climb += dt / 3; p.z = Math.min(1, T.climb) * 48; } return; }
  p.z = 48.2; if (!glide(slot[0], slot[1])) return;
  if (!onShift(p) && HS.alarm <= 0 && p.task) { T.down = 1; p.aim = null; p.variant = 'carry'; return; }
  const z = nearestZ(p.x, p.y, 230, q => (!isInside(q.x, q.y) || HS.zInside > 0 || q.fly) && (!q.fly || Math.hypot(q.x - p.x, q.y - p.y) < 150));
  p.aim = z; p.variant = z ? 'aim' : 'carry';
  if (z) { faceTo(p, z); if (p.cool <= 0) { p.cool = rr2(2.6, 4.2) * (HS.alarm > 0 ? 0.85 : 1); hsShoot(p, z, { x: p.x - (p.dir === 2 ? 5 : p.dir === 0 ? -5 : 0), y: p.y, z: 61 }, 230, 0.6); } }
  else { p.dir = (Math.floor((HS.t + p.ph) / 6) % 2) ? 3 : 2; }
}

// ---------------------------------------------------------------- infected
function hsAddZ(x, y, o) {
  if (HF.era === 'past') return pastAddDino(x, y, o);
  x = clamp(x, 4, HW - 4); y = clamp(y, 4, HW - 4);
  const L = hfZombieLook(HS.R);
  const z = Object.assign({ id: HS.zid++, L, x, y, px: x, py: y, dir: 1, st: 'wander', hp: HS.R() < 0.35 ? 4 : 3, spd: HS.R() < 0.12 ? rr2(5.4, 6.4) : rr2(3.2, 4.6), t: 0, path: null, stride: 0, ph: HS.R() * 10, cool: 0, seg: -1, st2: '', stT: 0, kx: 0, ky: 0, idle: 0, route: null, rp: 0, lane: rr2(-3, 3) }, o || {});
  if (L.zt === 'crawler' || L.zt === 'creeper') { if (z.spd > 5) L.zt = 'lanky'; else z.spd = Math.min(z.spd, 3.6); }   // crawlers / creepers are never runners (look only; no extra random draws)
  HS.zombies.push(z); return z;
}
function hsBand(z) { const [u, v] = w2d(z.x, z.y); const wv = wallV(u); return v < wv - 20 && v > wv - 160 && u > 150 && u < 810; }
// HS.view is the camera rectangle in iso units (set by the page each frame; null in tests / before the first frame)
function hsInView(x, y, m) { const V = HS.view; if (!V) return false; m = m == null ? 30 : m; const sx = x - y, sy = (x + y) / 2; return sx > V.x0 - m && sx < V.x1 + m && sy > V.y0 - m && sy < V.y1 + m; }
function hsSpawnBand(warm) {   // runtime: enter from the forest edge (never inside the wall, never in view); warm start: already anywhere along the frontier
  for (let n = 0; n < 40; n++) { const u = rr2(170, 790), v = wallV(u) - (warm ? rr2(40, 150) : rr2(110, 170)), [x, y] = d2w(u, v), k = tileOfW(x, y); if (!hfPass(k, 'out') || (!warm && hsInView(x, y))) continue; const z = hsAddZ(x, y); z.band = 1; return z; }
  return null;
}
function hsSpawnWanderer(warm) { for (let n = 0; n < 60; n++) { const [x, y] = hsWildPoint(); if (!hsFarFromWall(tileOfW(x, y), 18) || (!warm && hsInView(x, y))) continue; return hsAddZ(x + rr2(-6, 6), y + rr2(-6, 6)); } return null; }
// spawn just out of sight near a point (stalkers for an expedition, a probe toward a tower)
function hsSpawnNear(x, y, r0, r1) { for (let n = 0; n < 30; n++) { const a = HS.R() * TAU, r = rr2(r0, r1), px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (!inMap(Math.floor(px / HT), Math.floor(py / HT))) continue; const k = tileOfW(px, py); if (!hfPass(k, 'out') || hsInView(px, py)) continue; const [u, v] = w2d(px, py); if (v > wallV(u) - 25) continue; return hsAddZ(px, py); } return null; }
function hsRouteGroup(n, routeName, targetSeg, tag) {
  let r = HF.routes.find(q => q.name === routeName) || pickR(HF.routes);
  if (hsInView(r.pts[0][0], r.pts[0][1], 60)) r = HF.routes.find(q => !hsInView(q.pts[0][0], q.pts[0][1], 60)) || r;
  const head = r.pts[0], zs = [];
  for (let i = 0; i < n; i++) { const [x, y] = [head[0] + rr2(-14, 14), head[1] + rr2(-14, 14)], k = hfNearPass(x, y, 'out', 8); if (k < 0) continue; const c = tileC(k); zs.push(hsAddZ(c[0], c[1], { st: 'march', route: r, rp: 1, seg: targetSeg ? targetSeg.id : -1, tag, delay: i * rr2(0.4, 1.6) })); }
  return zs;
}
function hsZ(z, dt) {
  if (z.st === 'dead') { z.corpseT -= dt; return; }
  if (z.stT > 0) { z.stT -= dt; z.x += z.kx * dt * 2; z.y += z.ky * dt * 2; z.kx *= 0.8; z.ky *= 0.8; if (!hfPass(tileOfW(z.x, z.y), 'z')) { z.x -= z.kx * dt * 2; z.y -= z.ky * dt * 2; } return; }
  if (z.delay > 0) { z.delay -= dt; return; }
  if (z.cool > 0) z.cool -= dt;
  if (z.L.ev === 'dino' && pastZ(z, dt)) return;
  const inside = isInside(z.x, z.y);
  // targets: humans in sight
  const sight = (hsDark() ? 46 : 74) * (z.sight || 1);
  if (z.st !== 'attack' && z.st !== 'pursue') {
    let tgt = null, bd = sight * sight;
    shNear(SHP, z.x, z.y, sight, p => { if (!p.alive || p.onTower || p.st === 'down') return; if (!inside && isInside(p.x, p.y) && !p.exp && !p.rescue) return; const d = (p.x - z.x) ** 2 + (p.y - z.y) ** 2; if (d < bd) { bd = d; tgt = p; } });
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
      if (!z.path) { if (HS.R() < 0.25) { z.st = 'idle'; z.idle = rr2(2, 8); z.t = 0; return; } const [x, y] = hsWanderGoal(z); z.path = { direct: 1, gx: x, gy: y, mask: 'z' }; }
      if (z.path && hsStep(z, dt, z.spd * 0.6)) z.path = null; return;
    }
    case 'pack': {      // loose group around a leader; it breaks up on its own
      const L = z.lead; if (!L || L.st === 'dead' || HS.t > z.packEnd) { z.st = 'wander'; z.lead = null; z.path = null; return; }
      if (L.st === 'wall' || L.st === 'gate') { if (dist(z, L) < 30) { hsToWall(z, L.st === 'gate' ? HF.walls[HF.gate.segs[0]] : HF.walls[L.seg]); return; } }
      const tx = L.x + z.lane * 4, ty = L.y - z.lane * 3, d = Math.hypot(tx - z.x, ty - z.y);
      if (d > 7) { if (d > 60) { if (!z.path || z.t % 2 < dt) hsGo(z, tx, ty, 'z'); if (z.path) hsStep(z, dt, z.spd * 0.9); } else steer(z, tx, ty, z.spd * (d > 20 ? 0.9 : 0.6), dt); }
      return;
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
      if (p.st === 'down' && z.t > 5) { z.st = 'wander'; z.tgt = null; z.path = null; return; }   // loses interest in someone who no longer moves
      faceTo(z, p); if (z.cool <= 0) { z.cool = z.acool || 1.6; if (HS.R() < (p.role === 'guard' ? 0.22 : 0.32) * (p.st === 'down' ? 0.35 : 1) * (z.bite || 1)) hsHurt(p, z); hsSound(z.L.ev === 'dino' ? 'snarl' : 'growl', z.x, z.y, 0.5); }
      return;
    }
    case 'wall': {
      const s = HF.walls[z.seg]; if (!s) { z.st = 'wander'; return; }
      if (z.path) { if (hsStep(z, dt, z.spd)) z.path = null; return; }
      if (s.breached || s.hp <= 0) { z.st = 'wander'; z.path = null; z.seg = -1; const [gx, gy] = d2w(HGREEN[0], HGREEN[1]); hsGo(z, gx, gy, 'z'); z.st = 'investigate'; return; }
      if (Math.hypot(s.x - z.x, s.y - z.y) > 16) { z.tries = (z.tries || 0) + 1; if (z.tries > 3) { z.st = 'wander'; z.seg = -1; z.tries = 0; return; } const [x, y] = tileC(s.outT); hsGo(z, x + rr2(-2, 2), y + rr2(-2, 2), 'z'); return; }   // only at the wall itself
      z.tries = 0; faceTo(z, s); s.pressure = (s.pressure || 0) + 1; s.lastHit = HS.t;
      if (z.cool <= 0 && z.L.ev === 'dino') { pastWallHit(z, s); return; }
      if (z.cool <= 0) { z.cool = rr2(1.6, 2.2); s.dmgT = 0.25; hsSound('bang', s.x, s.y, 0.35);   // a few infected dent the wall; it takes a real pack to break it
        const crowd = countZ(s.x, s.y, 16); if (crowd >= 4 || HS.R() < (s.hp > 3 ? 0.5 : 0.12)) { s.hp -= 1; if (s.hp <= 0) hsBreach(s); } }
      return;
    }
    case 'gate': { if (z.path) { if (hsStep(z, dt, z.spd)) z.path = null; return; } if (Math.hypot(HF.gate.x - z.x, HF.gate.y - z.y) > 26) { z.st = 'wander'; return; } faceTo(z, HF.gate); if (HF.gate.open > 0.7) { z.st = 'investigate'; const [gx, gy] = d2w(HGREEN[0], HGREEN[1]); hsGo(z, gx, gy, 'z'); } if (z.cool <= 0) { z.cool = 2; hsSound('bang', HF.gate.x, HF.gate.y, 0.4); if (z.ram) { z.ram = 0; HS.Ps.gateRams++; HS.fx.push({ k: 'dust', x: HF.gate.x, y: HF.gate.y, t: 0.6 }); } } return; }
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
// a few wanderers drift together behind one of them for a while (40-90 s), then go their own way
function hsFormPack(toWall) {
  const cand = HS.zombies.filter(z => (z.st === 'wander' || z.st === 'idle') && !z.lead && !isInside(z.x, z.y)); if (cand.length < 3) return null;
  const L = toWall ? (cand.find(z => z.band) || pickR(cand)) : pickR(cand), until = HS.t + rr2(40, 90); let n = 0;
  for (const z of cand) { if (z === L || n >= 2 + Math.floor(HS.R() * 3)) continue; if (dist(z, L) > 150) continue; z.st = 'pack'; z.lead = L; z.packEnd = until; z.t = 0; z.path = null; n++; }
  if (!n) return null; HS.stats.work.packs++;
  if (toWall) hsToWall(L, hsTowerSeg()); return L;
}
function hsTowerSeg() { const t = pickR(HF.towers), s0 = HF.walls[t.seg]; let best = s0, bd = 1e9; for (const s of HF.walls) { if (s.gate || s.outT < 0) continue; const d = Math.abs(s.id - s0.id) + HS.R() * 6; if (d < bd && d > 1) { bd = d; best = s; } } return best; }
function hsBreach(s) {
  s.hp = 0; s.breached = true; HF.walk[tIdx(s.i, s.j)] |= W_BREACH; HF.breaches++; HF.ver++; HS.stats.breaches++; HS.dirtyWall = true;
  hsLog('breach', {}, true); hsSound('breach', s.x, s.y, 1); hsAlarm('breach');
}
function hsCloseBreach(s) {
  s.breached = false; HF.walk[tIdx(s.i, s.j)] &= ~W_BREACH; HF.breaches = Math.max(0, HF.breaches - 1); HF.ver++; HS.dirtyWall = true; hsLog('sealed', {});
  for (const z of HS.zombies) if (tileOfW(z.x, z.y) === tIdx(s.i, s.j) && s.outT >= 0) [z.x, z.y] = tileC(s.outT);
}
function hsAlarm(why) { const fresh = HS.alarm <= 0; HS.alarm = 45; if (!fresh) return; hsLog('alarm', { why }, true); hsSound('bell', HF.gate.x, HF.gate.y, 1); for (const p of HS.people) if (p.alive && (p.role === 'kid' || p.role === 'elder' || p.role === 'guard' || p.tier === 2) && !p.exp && !p.rescue && !p.ride && !p.onTower && p.task?.k !== 'shelter' && p.task?.k !== 'bed') p.task = null; HS.squad = null; }

// ---------------------------------------------------------------- wildlife
function hsAddWild(k, x, y, o) { x = clamp(x, 4, HW - 4); y = clamp(y, 4, HW - 4); const w = Object.assign({ k, x, y, px: x, py: y, dir: 1, t: 0, path: null, spd: k === 'deer' ? 7 : k === 'rabbit' ? 9 : k === 'dog' ? 8 : 3, ph: HS.R() * 10, stride: 0, flee: 0 }, o || {}); HS.wild.push(w); return w; }
function hsSpawnHerd() { const [x, y] = hsWildPoint(), n = 2 + Math.floor(HS.R() * 4), lead = hsAddWild('deer', x, y); lead.herd = lead; for (let i = 1; i < n; i++) hsAddWild('deer', x + rr2(-12, 12), y + rr2(-12, 12), { herd: lead }); }
function hsWild(w, dt) {
  w.t += dt;
  if (w.k === 'crows') { w.x += Math.cos(w.ph + HS.t * 0.3) * dt * 10; w.y += Math.sin(w.ph * 1.7 + HS.t * 0.2) * dt * 8; if (w.t > 30) { const c = HS.zombies.find(z => z.st === 'dead'); if (c && HS.R() < 0.5) { w.x = c.x; w.y = c.y - 30; } w.t = 0; } return; }
  if (w.big) return pastHerb(w, dt);
  if (w.pen) { const P = w.pen, night = HS.life < 5.6 || HS.life > 20.8; if (!w.path || w.t > (w.wait || 4)) { w.t = 0; w.wait = rr2(2.5, 7); let x = P.x + 2 + HS.R() * (P.w - 4), y = P.y + 2 + HS.R() * (P.d - 4);
      if (w.trough && HS.pigFood > 0 && !night && HS.R() < 0.7) { x = w.trough[0] + rr2(-5, 5); y = w.trough[1] + rr2(-1.5, 1.5); w.eat = 1; } else w.eat = 0;
      if ((w.k === 'chicken' || w.k === 'rooster') && HS.t - HS.feedT < 18) { x = P.x + P.w - 4 + rr2(-3, 2); y = P.y + P.d - 4 + rr2(-3, 2); w.wait = rr2(0.6, 1.6); }
      if (night) { x = P.x + 4 + (w.k === 'pig' ? 2 : 0) + rr2(-1, 1); y = P.y + 4 + rr2(-1, 1); w.sleep = 1; } else w.sleep = 0; w.gx = x; w.gy = y; w.path = 1; }
    if (w.eat && HS.pigFood > 0) HS.pigFood = Math.max(0, HS.pigFood - dt * 0.0035);
    const dx = w.gx - w.x, dy = w.gy - w.y, d = Math.hypot(dx, dy); if (d > 0.5) { const s = Math.min(d, w.spd * (HS.t - HS.feedT < 18 && w.k !== 'pig' ? 2.4 : 1) * dt); w.x += dx / d * s; w.y += dy / d * s; w.stride += s; w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); } return; }
  if (w.k === 'chicken' || w.k === 'goat') { const home = w.home === 'coop' ? HF.spots.coop[0] : HF.spots.goat[1]; if (!w.path || w.t > 4) { w.t = 0; const x = home.x + rr2(-10, 10), y = home.y + rr2(-7, 7); w.gx = x; w.gy = y; w.path = 1; } const dx = w.gx - w.x, dy = w.gy - w.y, d = Math.hypot(dx, dy); if (d > 0.5) { const s = Math.min(d, w.spd * dt); w.x += dx / d * s; w.y += dy / d * s; w.stride += s; w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); } return; }
  if (w.k === 'dog') { const kid = HS.people.find(p => p.alive && p.vis && p.role === 'kid' && p.id % 7 === w.ph % 7 | 0) || HS.people.find(p => p.alive && p.vis && p.role === 'kid'); if (kid) { const d = dist(w, kid); if (d > 16) { if (!w.path || w.t > 2) { w.t = 0; if (d < 90 && HS.t - (w.blk || -99) > 6) w.path = { direct: 1, gx: kid.x + 8, gy: kid.y + 4, mask: 'in' }; else hsGo(w, kid.x + 8, kid.y + 4, 'in'); } if (w.path) { const dir = w.path.direct; if (hsStep(w, dt, d > 50 ? 17 : 11) && dir && dist(w, kid) > 20) w.blk = HS.t; } } } return; }
  // deer / rabbits: graze, flee from infected and people
  const threat = nearestZ(w.x, w.y, 60) || (HS.people.find(p => p.alive && p.vis && Math.abs(p.x - w.x) < 40 && Math.abs(p.y - w.y) < 40 && dist(p, w) < 40 && !isInside(p.x, p.y)));
  if (threat) { w.flee = 3; const dx = w.x - threat.x, dy = w.y - threat.y, d = Math.hypot(dx, dy) || 1; w.fx = w.x + dx / d * 60; w.fy = w.y + dy / d * 60; w.path = null; }
  if (w.flee > 0) { w.flee -= dt; const sp = w.k === 'deer' ? 16 : 14; const dx = w.fx - w.x, dy = w.fy - w.y, d = Math.hypot(dx, dy) || 1, nx = w.x + dx / d * sp * dt, ny = w.y + dy / d * sp * dt; if (hfPass(tileOfW(nx, ny), 'out')) { w.x = nx; w.y = ny; w.stride += sp * dt; } w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); w.run = 1; return; }
  w.run = 0;
  if (w.k === 'deer' && w.herd !== w && w.herd) { const L = w.herd; if (dist(w, L) > 20) { const dx = L.x - w.x, dy = L.y - w.y, d = Math.hypot(dx, dy); w.x += dx / d * w.spd * dt; w.y += dy / d * w.spd * dt; w.stride += w.spd * dt; w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); } return; }
  if (!w.path) { if (w.t < (w.k === 'deer' ? 6 : 2)) return; w.t = 0; const [x, y] = hsWanderGoal(w); w.path = { direct: 1, gx: x, gy: y, mask: 'out' }; }
  if (w.path && hsStep(w, dt, w.spd * 0.5)) w.path = null;
}

// ---------------------------------------------------------------- gate
function hsGate(dt) {
  const g = HF.gate, want = g.users > 0, near = nearestZ(HF.gate.x, HF.gate.y, 34, z => !isInside(z.x, z.y));
  const tgt = want && (!near || g.force) ? 1 : 0;
  const was = g.open; g.open = clamp(g.open + (tgt ? 0.45 : -0.6) * dt, 0, 1);
  if ((was <= 0.7) !== (g.open <= 0.7)) { HF.ver++; hsSound('gate', g.x, g.y, 1); }
  if (was === 0 && g.open > 0) { hsSound('gate', g.x, g.y, 1); const [ox, oy] = tileC(g.outTile); hsNoise(ox, oy, 140, 'gate'); }
  g.users = 0; g.force = 0;
}
// a settler outside/inside waiting for the gate: request + wait at the threshold
function needGate(p) { const k = tileOfW(p.x, p.y), inSide = isInside(p.x, p.y); const nearGate = Math.hypot(p.x - HF.gate.x, p.y - HF.gate.y) < 46; if (nearGate) { HF.gate.users++; } return nearGate && HF.gate.open < 0.75; }

// ---------------------------------------------------------------- expeditions
function hsStartExpedition() {
  const pool = HS.people.filter(p => p.alive && p.role === 'scav' && !p.exp && !p.inj && p.vis !== false);
  if (pool.length < 2 || HS.alarm > 0) return null;
  const team = pool.slice(0, Math.min(3, pool.length)); const poi = pickR(HF.pois.filter(q => !q.horde || HS.R() < 0.25));
  const e = { id: HS.stats.exp++, team, poi, ph: 'prep', t: 0, loot: pickR(HF.era === 'past' ? ['meat', 'hides', 'flint', 'herbs', 'berries', 'eggs'] : ['food', 'parts', 'medicine', 'seeds', 'radio', 'fuel']), start: team.length, hurt: 0, rescued: false };
  for (const p of team) { hsClaim(p, null); p.exp = e; p.task = { k: 'exp', t: 0 }; p.variant = 'pistol'; p.L.pack2 = 1; const s = spotXY('yard', 4); hsGo(p, s.x, s.y, 'all'); }
  if (HS.gear > 0) HS.gear--;
  const H = HS.horses && HS.horses.find(q => q.st === 'paddock' && q.rest <= 0 && !q.groom); if (H && HS.R() < 0.55) { e.horse = H; H.st = 'pack'; H.lead = team[0]; team[0].trail = [[team[0].x, team[0].y]]; HS.Ls.packHorse++; }
  HS.exps.push(e); hsLog('exp.out', { n: team.map(hsName).join(', '), poi: poi.name }); return e;
}
function hsExp(e, dt) {
  e.t += dt; e.team = e.team.filter(p => p.alive);
  if (!e.team.length) { if (e.horse) { e.horse.st = 'loose'; e.horse.lead = null; e.horse = null; } e.ph = 'lost'; HS.stats.expLost++; hsLog('exp.lost', { poi: e.poi.name }, true); return false; }
  const lead = e.team[0]; if (e.horse && e.horse.lead !== lead) { e.horse.lead = lead; lead.trail = [[lead.x, lead.y]]; }
  for (const p of e.team) {             // members fight or flee when infected come close (outside the wall)
    if (p.st === 'down') { p.task = { k: 'down', t: 0 }; continue; }
    if (isInside(p.x, p.y) && e.ph !== 'out' && e.ph !== 'search') continue;
    const z = nearestZ(p.x, p.y, 80);
    if (z && p.cool <= 0) { p.cool = rr2(0.9, 1.4); faceTo(p, z); hsShoot(p, z, { x: p.x, y: p.y, z: 14 }, 90, 0.64); bubble(p, 'ex'); }
    if ((e.ph === 'out' || e.ph === 'search') && (countZ(p.x, p.y, 100) >= 2 || p.inj)) { e.ph = 'back'; e.chased = true; hsLog('exp.chased', { poi: e.poi.name }, true); for (const q of e.team) q.path = null; hsMaybeRescue(e); }
  }
  const moveAll = (x, y, run) => { let all = true; for (const p of e.team) { if (p.st === 'down') { all = false; continue; } if (!p.path) hsGo(p, x + (p.lane * 3), y - p.lane * 3, 'all', run); if (p.path) { if (needGate(p)) { all = false; continue; } const done = hsStep(p, dt, (run ? 16 : p.spd) * (p.inj ? 0.6 : 1)); if (!done) all = false; } } return all; };
  switch (e.ph) {
    case 'prep': { const s = HF.spots.yard[0]; if (moveAll(s.x, s.y) || e.t > 40) { e.ph = 'out'; e.t = 0; for (const p of e.team) p.path = null; hsSound('gate', HF.gate.x, HF.gate.y, 0.5); } return true; }
    case 'out': { const [x, y] = e.poi.spots[0]; if (moveAll(x, y) || e.t > 240) { e.ph = 'search'; e.t = 0; } return true; }
    case 'search': { for (const p of e.team) { p.act = 'kneel'; } if (e.t > rr2(24, 40)) { e.ph = 'back'; e.t = 0; for (const p of e.team) { p.path = null; bubble(p, e.loot === 'food' ? 'pho' : e.loot === 'medicine' ? 'drop' : e.loot === 'seeds' ? 'leaf' : 'star'); } hsNoise(e.poi.x, e.poi.y, 60, 'search'); } return true; }
    case 'back': { const [x, y] = tileC(HF.gate.inTile); const s = HF.spots.storage[0]; if (e.chased) HF.gate.force = 1; if (moveAll(isInside(lead.x, lead.y) ? s.x : x, isInside(lead.x, lead.y) ? s.y : y, e.chased)) { if (e.team.every(p => isInside(p.x, p.y))) { e.ph = 'done'; } else for (const p of e.team) p.path = null; } if (e.t > 400) e.ph = 'done'; return true; }
    case 'done': {
      const lost = e.start - e.team.length, hurt = e.team.filter(p => p.inj).length;
      if (lost) { HS.stats.expDead++; hsLog('exp.dead', { poi: e.poi.name, n: lost }, true); } else if (hurt) { HS.stats.expHurt++; hsLog('exp.hurt', { poi: e.poi.name, loot: e.loot }); } else { HS.stats.expOk++; hsLog('exp.ok', { poi: e.poi.name, loot: e.loot }); }
      const out = e.team.filter(p => !isInside(p.x, p.y));
      if (e.team.length && HS.store) { if (e.loot === 'food' || e.loot === 'seeds' || e.loot === 'meat' || e.loot === 'berries' || e.loot === 'eggs') HS.store.food = Math.min(STORE_CAP.food, HS.store.food + 3 + e.team.length); else if (e.loot === 'medicine' || e.loot === 'herbs') HS.store.med = Math.min(STORE_CAP.med, HS.store.med + 3 + e.team.length); else HS.store.yard = Math.min(STORE_CAP.yard, HS.store.yard + 2 + e.team.length * 2); }
      for (const p of e.team) { p.exp = null; p.task = null; p.variant = ''; p.L.pack2 = 0; }
      if (e.horse) { e.horse.st = 'loose'; e.horse.lead = null; e.horse.unload = 1; e.horse.path = null; e.horse = null; }
      if (out.length) { for (const p of out) { p.arriving = true; p.task = { k: 'arrive', t: 0 }; } HS.arrivals.push({ group: out, t: 0, home: 1 }); }   // stragglers still walk home through the gate
      return false;
    }
  }
  return false;
}
function hsMaybeRescue(e) {
  if (e.rescued || HS.R() > 0.4) return; const lead = e.team[0]; if (!lead || Math.hypot(lead.x - HF.gate.x, lead.y - HF.gate.y) > 360) return;
  const squad = HS.people.filter(p => p.alive && p.role === 'guard' && p.post && (p.post.k === 'reserve' || p.post.k === 'patrol') && !p.inj && !p.rescue).slice(0, 4);
  if (squad.length < 2) return; e.rescued = true; HS.stats.rescues++;
  const r = { squad, e, t: 0, ph: 'out' }; for (const p of squad) { hsClaim(p, null); p.rescue = r; p.task = { k: 'rescue', t: 0 }; p.variant = 'carry'; p.path = null; }
  HS.rescues.push(r); hsLog('rescue', {}); hsSound('bell', HF.gate.x, HF.gate.y, 0.6);
}
function hsRescue(r, dt) {
  r.t += dt; r.squad = r.squad.filter(p => p.alive);
  const lead = r.e.team.find(p => p.alive), home = r.e.ph === 'done' || r.e.ph === 'lost' || !lead || r.t > 160;
  for (const p of r.squad) {
    const z = nearestZ(p.x, p.y, 110); if (z && p.cool <= 0) { p.cool = rr2(1, 1.6); faceTo(p, z); hsShoot(p, z, { x: p.x, y: p.y, z: 14 }, 110, 0.62); }
    const [tx, ty] = home ? tileC(HF.gate.inTile) : [lead.x, lead.y];
    if (!p.path || p.t2 === undefined || r.t - p.t2 > 1.5) { p.t2 = r.t; hsGo(p, tx + p.lane * 3, ty - p.lane * 3, 'all', true); }
    if (needGate(p)) { HF.gate.force = 1; continue; } if (p.path) hsStep(p, dt, 15.5);
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
    if (p.path && !hsStep(p, dt, countZ(p.x, p.y, 90) ? 15.5 : p.spd)) all = false;
    if (!isInside(p.x, p.y)) all = false;
  }
  if (all || a.t > 300) { for (const p of a.group) { p.arriving = false; p.task = null; } if (!a.home) { HS.stats.arrivals += a.group.length; hsLog('arrived', { n: a.group.length }); } return false; }
  return true;
}

// ---------------------------------------------------------------- director: constant activity + encounters
function hsDirector(dt) {
  const D = DANGER[HS.danger], N = HS.next, now = HS.t, zs = HS.zScale || 1;
  // constant activity: keep the wilderness populated (per danger and device), herds topped up; new arrivals come from off-screen
  if (now > N.act) {
    N.act = now + 3;
    const out = HS.zombies.filter(z => z.st !== 'dead' && !isInside(z.x, z.y)), wantW = Math.round(Z_WANDER * D.n * zs), wantB = Math.round(Z_BAND * D.n * zs);
    if (out.length < wantW + wantB) { hsSpawnWanderer(); if (out.length < (wantW + wantB) * 0.7) hsSpawnWanderer(); }
    // keep infected drifting in the band just beyond the cleared ground, where the default camera looks
    const band = out.filter(z => hsBand(z)).length;
    if (band < wantB) { hsSpawnBand(); if (band < wantB * 0.6) hsSpawnBand(); }
    if (HS.wild.filter(w => w.k === 'deer').length < 14) hsSpawnHerd();
  }
  // small groups form and break up on their own
  if (now > (N.pack || 0)) { N.pack = now + rr2(25, 50) / Math.max(0.5, D.n); if (HS.zombies.filter(z => z.st === 'pack').length < 10 * D.n * zs) hsFormPack(HS.R() < 0.3); }
  // guards answer infected that come close (outside an alarm)
  if (now > (N.resp || 0)) { N.resp = now + 1; hwGuardRespond(); }
  if (now > N.minor) {
    N.minor = now + rr2(25, 55) * D.iv; HS.stats.attacks.minor++;
    const r = HS.R(), W = HS.stats.work, ex = HS.exps.find(e => e.ph === 'out' || e.ph === 'search');
    if (ex && r < 0.22) {                     // something has noticed the scavengers (from far enough away to be seen coming)
      const L = ex.team[0]; if (L) { for (let i = 0, n = Math.max(1, Math.round(rr2(1, 3) * D.n)); i < n; i++) { const z = hsSpawnNear(L.x, L.y, 170, 240); if (z) { z.st = 'investigate'; z.t = 0; hsGo(z, L.x + rr2(-10, 10), L.y + rr2(-10, 10), 'z'); } } W.stalks++; }
    }
    else if (r < 0.3) { W.wallProbes++; const seg = hsTowerSeg(), n = Math.round(rr2(2, 4) * D.n); for (let i = 0; i < n; i++) { const z = hsSpawnNear(seg.x, seg.y, 170, 260) || hsSpawnBand(); if (z) { z.delay = i * rr2(0.5, 2); hsToWall(z, seg); } } }
    else if (r < 0.5) hsRouteGroup(Math.round(rr2(3, 6) * D.n), pickR(['R1', 'R2', 'R3', 'R4', 'R5']), null, 'minor');
    else if (r < 0.65) { if (!hsFormPack(true)) { const z = hsSpawnBand(); if (z) hsToWall(z); } }
    else if (r < 0.77) { W.gateProbes++; const g = HF.walls[HF.gate.segs[0]]; for (let i = 0, n = 1 + Math.floor(HS.R() * 2); i < n; i++) { const z = hsSpawnNear(HF.gate.x, HF.gate.y, 170, 240); if (z) hsToWall(z, g); } }
    else if (r < 0.87) { const d = HS.wild.find(w => w.k === 'deer' && !hsInView(w.x - 40, w.y - 20)); if (d) { const z = hsAddZ(d.x - 40, d.y - 20); if (z) { z.st = 'chase'; z.prey = d; } } }
    else { const s = HF.walls.find(q => q.kind === 'culvert') || pickR(HF.walls); hsRouteGroup(2, 'R3', s, 'probe'); }
  }
  // larger coordinated attacks (a 60-80 strong siege stays rare)
  if (now > N.medium) { N.medium = now + rr2(6, 10) * 60 * D.iv; HS.stats.attacks.medium++; const flank = pickR(HF.towers); hsRouteGroup(Math.round(rr2(8, 12) * D.n), pickR(['R2', 'R3', 'R4', 'R5']), HF.walls[flank.seg], 'medium'); hsLog('pack', {}, true); }
  if (now > N.major) { N.major = now + rr2(18, 28) * 60 * D.iv; HS.stats.attacks.major++; hsMajor(Math.round(rr2(25, 40) * D.n), 2); }
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
  for (const z of HS.zombies) { if (z.st === 'dead' || z.fly) continue; if (isInside(z.x, z.y)) inside++; else if (z.st === 'wall' || z.st === 'gate') nearWall++; }
  HS.zInside = inside; if (inside > HS.stats.zInside) HS.stats.zInside = inside; if (HF.breaches > HS.stats.breachMax) HS.stats.breachMax = HF.breaches;
  // curious wanderers drawn by gunfire do not ring the bell
  let close = 0; for (const z of HS.zombies) if (z.st !== 'dead' && !z.fly && (z.st === 'march' || z.st === 'wall' || z.st === 'gate') && !isInside(z.x, z.y)) { const [u, v] = w2d(z.x, z.y); if (v > wallV(u) - 70) close++; }
  if (nearWall >= 8 || inside > 0 || close >= 12) hsAlarm('wall');
  if (HS.alarm > 0) { HS.alarm -= dt; if (HS.alarm <= 0) { HS.alarm = 0; hsLog('clear', {}); HS.mode = 'recovery'; HS.recoverT = 90; } }
  HS.mode = HS.alarm > 0 ? 'attack' : (HS.recoverT > 0 ? 'recovery' : 'peace'); if (HS.recoverT > 0) HS.recoverT -= dt;
}

// idle people that ended up on top of each other step apart (cheap: spatial hash, short radius, walkable tiles only)
function hsSeparate(dt) {
  for (const p of HS.people) {
    if (!p.alive || !p.vis || p.onTower || p.path || p.st === 'down' || p.act === 'lie' || p.exp || p.rescue || p.arriving || p.ride || p.z > 0 || (p.task && (p.task.a === 'form' || p.task.a === 'ball'))) continue;
    let fx = 0, fy = 0;
    shNear(SHP, p.x, p.y, 3, q => { if (q === p || q.onTower || !q.vis || q.act === 'lie') return; const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy), w = (3 - d) / 3; if (d < 0.05) { fx += Math.cos(p.id * 2.4) * w; fy += Math.sin(p.id * 2.4) * w; } else { fx += dx / d * w; fy += dy / d * w; } });
    const m = Math.hypot(fx, fy); if (m < 0.01) continue;
    const s = Math.min(1, m) * 2.5 * dt, nx = p.x + fx / m * s, ny = p.y + fy / m * s;
    if (hfPass(tileOfW(nx, ny), 'in')) { p.x = nx; p.y = ny; }
  }
}
// ---------------------------------------------------------------- main tick
function hsTick(dt) {
  HS.t += dt; HS.tick10 = ((HS.tick10 || 0) + 1) % 10;
  // the internal clock only drives light and schedules (HS.day is a rollover counter, never shown); seasons change on the UI's own timer
  if (HS.timeMode === 'auto') { HS.hour += dt * 24 / DAY_SEC; if (HS.hour >= 24) { HS.hour -= 24; HS.day++; hsLog('dawn', {}); } }
  else { const df = ((FIXED_H[HS.timeMode] - HS.hour + 36) % 24) - 12; HS.hour = (HS.hour + clamp(df, -dt * 7, dt * 7) + 24) % 24; }   // glide to the chosen hour like Saigon, no lighting pop
  HS.life = lifeHour();
  if (HS.wxMode !== 'auto') HS.weather = HS.wxMode;
  shBuild();
  hsDirector(dt);
  hsThreat(dt);
  // noises: infected hear and investigate (outside: straight to the noise; inside noise: the nearest wall section)
  for (const n of HS.noises) shNear(SHZ, n.x, n.y, n.r, z => { if (z.st === 'wander' || z.st === 'idle' || (z.st === 'march' && HS.R() < 0.2)) { if (isInside(n.x, n.y) && !isInside(z.x, z.y)) { let best = null, bd = 1e9; for (const s of HF.walls) { if (s.outT < 0) continue; const d = (s.x - n.x) ** 2 + (s.y - n.y) ** 2; if (d < bd) { bd = d; best = s; } } hsToWall(z, best); } else { z.st = 'investigate'; z.t = 0; hsGo(z, n.x + rr2(-10, 10), n.y + rr2(-10, 10), 'z'); } } });
  HS.noises.length = 0;
  for (const p of HS.people) { p.px = p.x; p.py = p.y; if (p.arriving) continue; if (p.exp && p.alive && p.st !== 'down') continue; if (p.rescue && p.alive) continue; if (p.ride && p.alive) continue; hsPerson(p, dt); }
  hsSeparate(dt);
  hwTick(dt);
  lfTick(dt);
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
