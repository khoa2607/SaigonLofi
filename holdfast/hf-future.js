'use strict';
// ===== Holdfast FUTURE — simulation layer (DOM-free): the map pass, the machine roster and its sensor network, defenses, the power grid,
// friendly drones, salvage, deliveries and the signature events. Runs only when HF.era === 'future'; Current and Past never reach it.
// Counters live in HS.Fs (diagnostics for tests/holdfast-future.mjs). All randomness goes through HS.R (rr2 / pickR).

// ---------------------------------------------------------------- map pass (after the shared geography, layout and nav grid are built)
// power sectors follow the settlement's width (the u axis of the valley's diagonal frame), west to east
const FSEC = u => clamp(Math.floor((u - 150) / 165), 0, 3);
function futMap() {
  const R = mulberry32(1913), ok = (x, y, r) => { for (let dy = -r; dy <= r; dy += 4) for (let dx = -r; dx <= r; dx += 4) { const k = tileOfW(x + dx, y + dy); if (!hfPass(k, 'in') || HF.occ[k] || HF.zone[k] !== Z_SETTLE) return false; } return true; };
  const near = (x, y) => { const k = hfNearPass(x, y, 'in', 6); return k >= 0 ? tileC(k) : [x, y]; };
  HF.fnodes = []; HF.fsolar = []; HF.fpads = {}; HF.fsec = [0, 1, 2, 3].map(i => ({ i }));
  // one substation per sector, placed on free ground nearest the sector's middle
  for (let i = 0; i < 4; i++) { const u0 = 150 + i * 165 + 82; let best = null;
    for (let n = 0; n < 400 && !best; n++) { const u = u0 + (R() - 0.5) * 120, v = wallV(u) + 30 + R() * 140, [x, y] = d2w(u, v); if (ok(x, y, 6)) best = [x, y]; }
    if (best) { const p = addP('node', best[0], best[1]); const [sx, sy] = near(best[0] + 3, best[1] + 7); HF.fnodes.push({ i, x: best[0], y: best[1], sx, sy, p }); } }
  // ground solar arrays on free settlement ground (each belongs to its sector)
  for (let n = 0; n < 900 && HF.fsolar.length < 10; n++) { const u = 170 + R() * 620, v = wallV(u) + 24 + R() * 160, [x, y] = d2w(u, v); if (!ok(x, y, 12) || HF.fsolar.some(a => Math.hypot(a.x - x, a.y - y) < 40)) continue;
    addP('solar', x - 10, y - 3, { n: 3, v: HF.fsolar.length }); const [sx, sy] = near(x, y + 8); HF.fsolar.push({ x, y, sx, sy, sec: FSEC(u), id: HF.fsolar.length }); }
  // drone pads beside the workshop and the market, the medical center's roof pad
  const ws = HF.buildings.find(b => b.kind === 'workshop'), inf = HF.buildings.find(b => b.kind === 'infirmary');
  if (ws) { const [x, y] = near(ws.x + ws.w + 10, ws.y + ws.d * 0.5); addP('pad', x, y); HF.fpads.ws = { x, y }; HF.fbin = near(ws.x + ws.w * 0.5, ws.y + ws.d + 6); }
  if (HF.stalls && HF.stalls.length) { const s = HF.stalls[0], [x, y] = near(s.x - 16, s.y); addP('pad', x, y); HF.fpads.mk = { x, y }; }
  if (inf) HF.fpads.med = { x: inf.x + inf.w / 2, y: inf.y + inf.d / 2, z: 34.6, door: near(inf.door[0], inf.door[1]) };
  for (const t of HF.towers) { const [u] = w2d(t.x, t.y); t.sec = FSEC(u); }
  for (const s of HF.walls) { const [u] = w2d(s.x, s.y); s.sec = FSEC(u); }
}
const futSecOf = (x, y) => FSEC(w2d(x, y)[0]);

// ---------------------------------------------------------------- the machine roster: stats + behaviour (art in hf-future-art.js FBOTS_M)
// scan: [range, half-angle] of the sensor cone; gun: [range, hit chance, cooldown]; cap: never more than this many at once
const BSTAT = {
  mite:     { hp: 1, spd: [10, 12], sight: 0.02, bite: 0, acool: 2, stag: 0.6, fly: 18, scan: [90, 0.7], cap: 14 },
  eye:      { hp: 3, spd: [5.4, 6.4], sight: 0.02, bite: 0, acool: 2, stag: 0.4, fly: 32, scan: [150, 0.5], cap: 4 },
  rover:    { hp: 3, spd: [5.4, 6.6], sight: 0.02, bite: 0.4, acool: 2, stag: 0.4, scan: [130, 0.45], cap: 6 },
  skitter:  { hp: 2, spd: [8.4, 9.6], sight: 1, bite: 0.6, acool: 1, stag: 0.5, cap: 10 },
  spider:   { hp: 3, spd: [5.6, 6.4], sight: 0.02, bite: 0.5, acool: 1.4, stag: 0, cap: 2 },
  hound:    { hp: 5, spd: [7.6, 8.8], sight: 1.3, bite: 1.2, acool: 1.1, stag: 0.35, cap: 9 },
  sentry:   { hp: 5, spd: [4.2, 5], sight: 1.1, bite: 0.7, acool: 1.6, stag: 0.3, gun: [70, 0.32, 2.2], scan: [110, 0.4], cap: 10 },
  warden:   { hp: 9, spd: [3.2, 3.8], sight: 1, bite: 0.9, acool: 1.8, stag: 0.15, gun: [60, 0.3, 2.6], wd: 1.6, cap: 4 },
  tank:     { hp: 12, spd: [3, 3.6], sight: 1.1, bite: 0, acool: 2, stag: 0.1, gun: [90, 0.28, 3.2], wd: 2.2, chg: 1, cap: 3 },
  racer:    { hp: 4, spd: [11, 13], sight: 1.2, bite: 0.9, acool: 1.2, stag: 0.4, cap: 4 },
  hawk:     { hp: 4, spd: [13, 15], sight: 1, bite: 0, acool: 2, stag: 0.3, fly: 40, gun: [60, 0.3, 2.4], cap: 3 },
  leech:    { hp: 3, spd: [4.6, 5.4], sight: 0.02, bite: 0.4, acool: 1.6, stag: 0.4, cap: 3 },
  jammer:   { hp: 6, spd: [3.4, 4], sight: 0.02, bite: 0, acool: 2, stag: 0.2, cap: 1 },
  mender:   { hp: 4, spd: [4.6, 5.4], sight: 0.8, bite: 0, acool: 2, stag: 0.3, fly: 6, cap: 2 },
  pylon:    { hp: 7, spd: [2.6, 3.2], sight: 0.02, bite: 0, acool: 2, stag: 0.1, scan: [300, 0.9], cap: 2 },
  queen:    { hp: 8, spd: [4.4, 5.2], sight: 0.8, bite: 0, acool: 2, stag: 0.15, fly: 44, cap: 1 },
  brute:    { hp: 18, spd: [2.8, 3.3], sight: 1, bite: 1.6, acool: 1.8, stag: 0.05, wd: 3, chg: 1, cap: 2 },
  walker:   { hp: 30, spd: [2.2, 2.6], sight: 0.02, bite: 0, acool: 2, stag: 0.02, gun: [120, 0.35, 3.4], wd: 3.5, cap: 1 },
  colossus: { hp: 60, spd: [1.8, 2.2], sight: 1.4, bite: 0, acool: 2, stag: 0, gun: [140, 0.3, 3], wd: 5, cap: 1 },
};
const BCAT = { mite: 'recon', eye: 'recon', rover: 'recon', skitter: 'small', spider: 'stealth', hound: 'hunter', sentry: 'patrol', warden: 'armor', tank: 'assault', racer: 'pursuit', hawk: 'air', leech: 'climber', jammer: 'ew', mender: 'support', pylon: 'sensor', queen: 'swarm', brute: 'heavy', walker: 'siege', colossus: 'apex' };
const futAlive = t => HS.zombies.filter(z => z.st !== 'dead' && z.L.t === t).length;
function futPickType(o) {
  if (o && o.t) return o.t;
  const r = HS.R(), tag = o && o.tag;
  let t = tag === 'siege' || tag === 'major' ? (r < 0.26 ? 'hound' : r < 0.44 ? 'sentry' : r < 0.54 ? 'warden' : r < 0.62 ? 'tank' : r < 0.7 ? 'skitter' : r < 0.77 ? 'leech' : r < 0.83 ? 'brute' : r < 0.88 ? 'racer' : r < 0.94 ? 'mender' : 'jammer')
    : tag === 'medium' ? (r < 0.3 ? 'hound' : r < 0.52 ? 'sentry' : r < 0.62 ? 'skitter' : r < 0.72 ? 'warden' : r < 0.8 ? 'leech' : r < 0.87 ? 'tank' : r < 0.94 ? 'racer' : 'jammer')
    : tag === 'minor' || tag === 'probe' ? (r < 0.34 ? 'hound' : r < 0.56 ? 'skitter' : r < 0.72 ? 'sentry' : r < 0.84 ? 'leech' : r < 0.92 ? 'spider' : 'rover')
    : (r < 0.16 ? 'rover' : r < 0.34 ? 'skitter' : r < 0.48 ? 'hound' : r < 0.6 ? 'sentry' : r < 0.66 ? 'pylon' : r < 0.71 ? 'warden' : r < 0.76 ? 'racer' : r < 0.8 ? 'spider' : r < 0.84 ? 'leech' : r < 0.87 ? 'mender' : r < 0.9 ? 'tank' : r < 0.93 ? 'jammer' : 'rover');
  if (tag === 'siege' && !futAlive('walker')) t = 'walker';
  if (BSTAT[t].fly && o && (o.st === 'march' || o.route)) t = 'hound';   // a route is walked on the ground
  if (futAlive(t) >= BSTAT[t].cap) t = t === 'skitter' ? 'hound' : 'skitter';
  return t;
}
function futAddBot(x, y, o) {
  x = clamp(x, 4, HW - 4); y = clamp(y, 4, HW - 4);
  const t = futPickType(o), D = BSTAT[t], L = { ev: 'bot', t, seed: Math.floor(HS.R() * 3) };
  const z = Object.assign({ id: HS.zid++, L, x, y, px: x, py: y, dir: 1, st: 'wander', hp: D.hp, hp0: D.hp, spd: rr2(D.spd[0], D.spd[1]), t: 0, path: null, stride: 0, ph: HS.R() * 10, cool: 0, seg: -1, st2: '', stT: 0, kx: 0, ky: 0, idle: 0, route: null, rp: 0, lane: rr2(-3, 3),
    sight: D.sight, bite: D.bite, acool: D.acool, stag: D.stag, wd: D.wd, chg: D.chg, cat: BCAT[t], alt: 0, ang: HS.R() * TAU, scanT: 0, gcool: rr2(0.5, 2) }, o || {});
  delete z.t2; if (o && o.t) z.t = 0;
  HS.zombies.push(z); HS.Fs.spawned[t] = (HS.Fs.spawned[t] || 0) + 1;
  if (t === 'mender') z.alt = D.fly;
  else if (D.fly) { z.fly = 1; z.alt = D.fly; z.st = 'fly'; z.fs = z.fs || 'in'; z.home = z.home || [x, y]; }
  if (t === 'skitter' && !z.noPack && (!o || !o.st)) for (let i = 0, n = 1 + Math.floor(HS.R() * 2); i < n; i++) { const k = hfNearPass(x + rr2(-10, 10), y + rr2(-10, 10), 'out', 3); if (k < 0) continue; const [cx, cy] = tileC(k); futAddBot(cx, cy, { t: 'skitter', noPack: 1, st: 'pack', lead: z, packEnd: HS.t + rr2(60, 140) }); }
  return z;
}
// machines leave salvage behind: a wreck stays a long while (the bigger, the longer) unless a salvage team strips it first
function futCorpseLife(z) { return clamp((70 + (z.hp0 || 3) * 6) * rr2(0.9, 1.1), 70, 300); }

// ---------------------------------------------------------------- the sensor network: cones, detection, signals, reinforcements
// what a machine can see: people outside the wall (and anyone in the open when the machine is airborne over the settlement); a cone, not a circle
function futSees(z, p, R0, half) {
  if (!p.alive || p.onTower || p.st === 'down' || !p.vis) return false;
  const dx = p.x - z.x, dy = p.y - z.y, d2 = dx * dx + dy * dy; if (d2 > R0 * R0) return false;
  if (isInside(p.x, p.y) && !p.exp && !p.rescue && !(z.fly && z.alt > 20)) return false;
  let da = Math.atan2(dy, dx) - z.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); return Math.abs(da) < half;
}
function futScan(z, dt) {
  const D = BSTAT[z.L.t]; if (!D.scan || z.st === 'dead') return;
  const face = [0, Math.PI / 2, Math.PI, -Math.PI / 2][z.dir] || 0; z.ang = face + Math.sin(HS.t * 0.9 + z.ph) * (z.cat === 'sensor' && z.dep ? Math.PI : 0.7);   // a deployed sensor platform turns all the way round
  if ((z.scanT -= dt) > 0) return; z.scanT = 0.5;
  const dark = hsDark(), R0 = D.scan[0] * (dark ? 0.75 : 1) * (HS.weather === 'rain' ? 0.85 : 1);
  let seen = null; shNear(SHP, z.x, z.y, R0, p => { if (!seen && futSees(z, p, R0, D.scan[1])) seen = p; });
  if (seen) { HS.Fs.detect++; z.seenP = seen; futSignal(z, seen.x, seen.y, 'person'); return; }
  // at night the settlement's lights give it away to a scout that comes close enough to the wall
  if (dark && (z.cat === 'recon' || z.cat === 'sensor') && HS.R() < 0.12) { const [u, v] = w2d(z.x, z.y); if (v > wallV(u) - 110 && HS.Fp.sec[FSEC(u)].on) { HS.Fs.lightDetect++; const s = futNearSeg(z.x, z.y); if (s) futSignal(z, s.x, s.y, 'lights'); } }
}
function futNearSeg(x, y) { let b = null, bd = 1e9; for (const s of HF.walls) { if (s.gate || s.outT < 0) continue; const d = (s.x - x) ** 2 + (s.y - y) ** 2; if (d < bd) { bd = d; b = s; } } return b; }
// a detection is transmitted: nearby machines converge, and a scout's report calls in reinforcements (detection -> transmission -> response)
function futSignal(z, tx, ty, why) {
  if ((z.sigCD || 0) > HS.t) return; z.sigCD = HS.t + rr2(14, 22);
  let R0 = z.cat === 'sensor' ? 420 : 230; if (HS.zombies.some(q => q.st !== 'dead' && q.L.t === 'pylon' && q.dep && Math.hypot(q.x - z.x, q.y - z.y) < 260)) { R0 *= 1.7; HS.Fs.relayBoost++; }   // a deployed sensor platform relays further
  HS.sig.push({ x: z.x, y: z.y, z: (z.alt || 0) + 10, t: HS.t, r: R0, tx, ty, why, src: z.id }); HS.Fs.sig++; hsSound('ping', z.x, z.y, 0.6);
  // the network redirects machines only now and then (a light seen at night far less often than a person in the open): sightings stay frequent, assaults do not
  const gap = why === 'lights' ? 120 : 35; if (HS.t - (HS.sigOrder || -1e9) < gap) return; HS.sigOrder = HS.t;
  let n = 0; for (const q of HS.zombies) { if (q === z || q.st === 'dead' || q.fly || q.responding > HS.t) continue; if (!(q.st === 'wander' || q.st === 'idle' || q.st === 'patrol')) continue; if (q.cat === 'sensor' || q.cat === 'ew' || q.cat === 'support') continue; if ((q.x - z.x) ** 2 + (q.y - z.y) ** 2 > R0 * R0) continue;
    if (n >= 5) break; q.st = 'investigate'; q.t = 0; q.responding = HS.t + 30; hsGo(q, tx + rr2(-12, 12), ty + rr2(-12, 12), 'z'); if (!isInside(tx, ty)) { const s = futNearSeg(tx, ty); const [u, v] = w2d(tx, ty); if (s && v > wallV(u) - 60) q.toWall = s.id; } n++; }
  HS.Fs.relay += n;
  if ((z.cat === 'recon' || z.cat === 'sensor' || z.cat === 'patrol') && !HS.Freinf && HS.t > (HS.nextF.reinf || 0)) { HS.Freinf = { t: HS.t + rr2(14, 26), x: tx, y: ty, why, by: z.L.t, at: HS.t }; HS.nextF.reinf = HS.t + rr2(220, 420) * DANGER[HS.danger].iv; HS.Fs.reinfReq++; hsLog('fdetect', { by: z.L.t, why }, true); }
}

// ---------------------------------------------------------------- per-tick machine behaviour; returns true when it handled the machine this tick (the shared logic is skipped)
function futZ(z, dt) {
  const T = z.L.t, D = BSTAT[T];
  futScan(z, dt);
  if (z.hp <= z.hp0 * 0.4 && HS.R() < dt * 0.8) HS.fx.push({ k: 'spark', x: z.x + rr2(-2, 2), y: z.y + rr2(-2, 2), t: 0.35 });   // a damaged machine sparks and stutters
  if (z.fly) return futFly(z, dt);
  // ranged machines stop and fire at people they can see (they never melee)
  if (D.gun && (z.st === 'pursue' || z.st === 'attack') && z.tgt) { const p = z.tgt, d = Math.hypot(p.x - z.x, p.y - z.y);
    if (!p.alive || p.onTower) { z.st = 'wander'; z.tgt = null; return true; }
    if (d < D.gun[0]) { faceTo(z, p); z.path = null; if ((z.gcool -= dt) <= 0) { z.gcool = D.gun[2] * rr2(0.85, 1.15); futBotFire(z, p, D); } if (d > 30) return true; } }
  // hunters close in from the sides: each one takes a flank around its target before the last rush
  if (z.cat === 'hunter' && z.st === 'pursue' && z.tgt) { const p = z.tgt, d = Math.hypot(p.x - z.x, p.y - z.y);
    if (z.flank === undefined) { z.flank = (z.id % 2 ? 1 : -1); z.fa = Math.atan2(z.y - p.y, z.x - p.x) + z.flank * 1.2; z.fdone = 0; }   // a side of the target, fixed when the hunt starts
    if (!z.fdone && d < 140) { const gx = p.x + Math.cos(z.fa) * 30, gy = p.y + Math.sin(z.fa) * 30; if (!z.path || (z.t % 1) < dt) hsGo(z, gx, gy, 'z'); if (z.path && hsStep(z, dt, z.spd * 1.3)) z.path = null; z.t += dt; if (!z.flanked) { z.flanked = 1; HS.Fs.flank++; } if (Math.hypot(gx - z.x, gy - z.y) < 8 || z.t > 12) z.fdone = 1; if (z.t > 40) { z.st = 'wander'; z.tgt = null; } return true; } }
  // patrol formations walk the frontier along waypoints (followers keep their place behind the leader in the shared 'pack' state)
  if (z.st === 'patrol') { if (!z.wp || !z.wp.length) { z.st = 'wander'; return true; } if (!z.path) { const w = z.wp[0]; hsGo(z, w[0], w[1], 'z'); } if (z.path && hsStep(z, dt, z.spd * 0.7)) { z.path = null; z.wp.shift(); HS.Fs.patrolLegs++; } return true; }
  // the stealth unit climbs a weak section and slips inside to sabotage the power grid
  if (T === 'spider') return futSpider(z, dt);
  // the climber clamps onto the wall face and cuts at the plates
  if (T === 'leech' && z.st === 'wander' && HS.R() < dt * 0.02) hsToWall(z, hsTowerSeg());
  if (T === 'leech' && z.st === 'wall') { const s = HF.walls[z.seg]; if (s && !z.path && Math.hypot(s.x - z.x, s.y - z.y) < 16) { z.alt = Math.min(9, (z.alt || 0) + dt * 4); z.climbing = 1; if ((z.cool -= dt) <= 0) { z.cool = rr2(1.8, 2.6); s.dmgT = 0.3; s.lastHit = HS.t; s.pressure = (s.pressure || 0) + 1; HS.fx.push({ k: 'spark', x: s.x, y: s.y, t: 0.35 }); hsSound('cut', s.x, s.y, 0.4); if (HS.R() < 0.6) { s.hp -= 1; HS.Fs.leechCut++; if (s.hp <= 0) { hsBreach(s); z.climbing = 0; z.alt = 0; } } } return true; } }
  else if (T === 'leech' && z.alt > 0) { z.alt = Math.max(0, z.alt - dt * 6); z.climbing = 0; }
  // the jammer walks into range of a tower and deploys: towers in reach go blind (no scanner, no turret) while it stands
  if (T === 'jammer') { const tw = futNearTower(z.x, z.y); if (z.dep) { z.path = null; if (tw) faceTo(z, tw); futJam(z, dt); return true; }
    if (tw && Math.hypot(tw.x - z.x, tw.y - z.y) < 150 && !isInside(z.x, z.y)) { z.dep = 1; z.st = 'deploy'; HS.Fs.jams++; hsLog('fjam', {}, true); hsSound('jam', z.x, z.y, 0.8); return true; }
    if (z.st === 'wander' && HS.R() < dt * 0.05 && tw) { z.st = 'investigate'; hsGo(z, tw.x - 60, tw.y - 60, 'z'); } }
  // the repair unit shadows damaged machines and patches them up
  if (T === 'mender') return futMender(z, dt);
  // the sensor platform walks to a vantage point on the frontier and deploys for a long watch
  if (T === 'pylon') { if (z.dep) { z.path = null; if (HS.t > z.depEnd) { z.dep = 0; z.st = 'wander'; } return true; } if (z.st === 'wander' && HS.R() < dt * 0.04) { const [u] = w2d(z.x, z.y); const v = wallV(u) - rr2(90, 140), [x, y] = d2w(u, v); if (hfPass(tileOfW(x, y), 'out') && !hsInView(x, y, -40)) { z.st = 'deploying'; hsGo(z, x, y, 'z'); } }
    if (z.st === 'deploying') { if (!z.path || hsStep(z, dt, z.spd)) { z.path = null; z.dep = 1; z.depEnd = HS.t + rr2(90, 200); HS.Fs.pylonDeploy++; } return true; } }
  // heavy chargers: the last stretch to the wall at full drive, then a ram
  if (z.chg && (z.st === 'wall' || z.st === 'gate') && z.path) { const s = z.st === 'gate' ? HF.gate : HF.walls[z.seg], d = s ? Math.hypot(s.x - z.x, s.y - z.y) : 999;
    if (d < 80 && !z.charging) { z.charging = 1; z.ram = 1; HS.Fs.charges++; hsSound('servo', z.x, z.y, 0.7); }
    if (z.charging) { z.t += dt; if (hsStep(z, dt, z.spd * 2)) { z.path = null; z.charging = 0; } if (z.t % 0.3 < dt) HS.fx.push({ k: 'dust', x: z.x, y: z.y, t: 0.5 }); return true; }
  } else if (z.charging && z.st !== 'wall' && z.st !== 'gate') z.charging = 0;
  // heavy units look for the weakest section; the siege walker goes for the gate's flank
  if ((T === 'brute' || T === 'tank') && z.st === 'wander' && HS.R() < dt * 0.02) { const weak = HF.walls.filter(s => !s.gate && s.outT >= 0 && (s.weak || s.hp < s.max * 0.6)); if (weak.length) { hsToWall(z, pickR(weak)); HS.Fs.weakSeek++; } }
  if ((T === 'walker' || T === 'colossus') && z.siege && z.st !== 'wall' && z.st !== 'dead') { const s = futGateFlank(); if (s) { hsToWall(z, s); z.siege = 0; HS.Fs.siegeApproach++; } }
  // the siege walker bombards its section from range (it never needs to touch the wall)
  if ((T === 'walker' || T === 'colossus') && z.st === 'wall') { const s = HF.walls[z.seg]; if (s && !s.breached && Math.hypot(s.x - z.x, s.y - z.y) < 70) { z.path = null; faceTo(z, s); s.lastHit = HS.t; s.pressure = (s.pressure || 0) + 1; if ((z.cool -= dt) <= 0) futWallHit(z, s); return true; } }
  if (T === 'walker' || T === 'colossus') { if (HS.t > (z.stompT || 0) && Math.hypot(z.x - z.px, z.y - z.py) > 0.01) { z.stompT = HS.t + 1.4; hsSound('stomp', z.x, z.y, T === 'colossus' ? 1 : 0.7); } }
  return false;
}
function futNearTower(x, y) { let b = null, bd = 1e9; for (const t of HF.towers) { const d = (t.x + 9 - x) ** 2 + (t.y + 9 - y) ** 2; if (d < bd) { bd = d; b = t; } } return b; }
function futGateFlank() { const gs = HF.gate.segs, cand = HF.walls.filter(s => !s.gate && s.outT >= 0 && gs.some(g => Math.hypot(HF.walls[g].x - s.x, HF.walls[g].y - s.y) < 26)); return cand.length ? cand[0] : hsTowerSeg(); }
function futJam(z, dt) {
  HS.Fs.jamT += dt; let n = 0;
  for (const t of HF.towers) if (Math.hypot(t.x + 9 - z.x, t.y + 9 - z.y) < 170) { t.jam = HS.t + 1.2; n++; }
  for (const s of HF.walls) if (Math.hypot(s.x - z.x, s.y - z.y) < 140) s.jam = HS.t + 1.2;
  if (n && HS.R() < dt * 0.5) HS.sig.push({ x: z.x, y: z.y, z: 20, t: HS.t, r: 90, emp: 1 });
}
function futBotFire(z, p, D) {
  const d = Math.hypot(p.x - z.x, p.y - z.y), hit = HS.R() < clamp(D.gun[1] - d / 600 - (p.role === 'guard' ? 0.06 : 0), 0.05, 0.9), hz = T => T === 'walker' ? 34 : T === 'colossus' ? 36 : T === 'tank' ? 7 : T === 'hawk' ? z.alt : 14;
  HS.fx.push({ k: 'bolt', x0: z.x, y0: z.y, z0: hz(z.L.t), x1: hit ? p.x : p.x + rr2(-6, 6), y1: hit ? p.y : p.y + rr2(-6, 6), z1: hit ? 10 : 0, t: 0.18, T: 0.18, hostile: 1, big: z.L.t === 'walker' || z.L.t === 'colossus' || z.L.t === 'tank' ? 1 : 0 });
  HS.Fs.botShots++; hsSound('zap', z.x, z.y, z.L.t === 'walker' ? 0.9 : 0.6); hsNoise(z.x, z.y, 120, 'shot');
  if (hit) { HS.Fs.botHits++; if (HS.R() < 0.55) hsHurt(p, z); } else HS.fx.push({ k: 'dust', x: p.x + rr2(-6, 6), y: p.y + rr2(-6, 6), t: 0.4 });
}
function futSpider(z, dt) {
  if (z.st === 'wander' && HS.R() < dt * 0.03) { const weak = HF.walls.filter(q => !q.gate && q.outT >= 0 && (q.weak || q.kind === 'mesh')); if (weak.length) hsToWall(z, pickR(weak)); }
  if (z.st === 'wall' && !z.path) { const s = HF.walls[z.seg]; if (s && Math.hypot(s.x - z.x, s.y - z.y) < 16) { z.st = 'climb'; z.t = 0; z.cs = s.id; HS.Fs.climbs++; } return false; }
  if (z.st === 'climb') { const s = HF.walls[z.cs], [ix, iy] = tileC(s.inT); z.t += dt; if (z.t < 2.4) { z.alt = Math.min(17, z.t * 8); return true; } steer2(z, ix, iy, z.spd * 0.6, dt); if (Math.hypot(ix - z.x, iy - z.y) < 2 || z.t > 7) { z.x = ix; z.y = iy; z.alt = 0; z.st = 'sabotage'; z.t = 0; HS.Fs.infiltrations++; const nd = futNearNode(z.x, z.y); z.node = nd; if (nd) hsGo(z, nd.sx, nd.sy, 'in'); } return true; }
  if (z.st === 'sabotage') { z.t += dt; const nd = z.node; if (!nd || z.t > 180) { z.st = 'wander'; return true; } if (z.path) { if (hsStep(z, dt, z.spd)) z.path = null; return true; }
    if (Math.hypot(nd.sx - z.x, nd.sy - z.y) < 8) { if ((z.cool -= dt) <= 0) { z.cool = 1.5; HS.fx.push({ k: 'spark', x: nd.x + 2, y: nd.y + 2, t: 0.35 }); if (HS.R() < 0.4) { futFault(nd.i, 'sabotage'); HS.Fs.sabotage++; z.st = 'wander'; } } } else hsGo(z, nd.sx, nd.sy, 'in'); return true; }
  return false;
}
// steering that ignores the wall (a climbing or flying machine)
function steer2(z, x, y, sp, dt) { const dx = x - z.x, dy = y - z.y, d = Math.hypot(dx, dy) || 1, s = Math.min(d, sp * dt); z.x += dx / d * s; z.y += dy / d * s; z.stride += s; z.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); }
function futNearNode(x, y) { let b = null, bd = 1e9; for (const n of HF.fnodes) { const d = (n.x - x) ** 2 + (n.y - y) ** 2; if (d < bd) { bd = d; b = n; } } return b; }
function futMender(z, dt) {
  z.alt = 6 + Math.sin(HS.t * 2 + z.ph) * 0.8;
  const hurt = z.mend && z.mend.st !== 'dead' && z.mend.hp < z.mend.hp0 ? z.mend : HS.zombies.find(q => q !== z && q.st !== 'dead' && !q.fly && q.hp < q.hp0 && Math.hypot(q.x - z.x, q.y - z.y) < 220);
  z.mend = hurt || null; if (!hurt) { if (!z.path) { const [x, y] = hsWanderGoal(z); z.path = { direct: 1, gx: x, gy: y, mask: 'z' }; } if (hsStep(z, dt, z.spd * 0.6)) z.path = null; return true; }
  const d = Math.hypot(hurt.x - z.x, hurt.y - z.y); if (d > 9) { steer(z, hurt.x - 5, hurt.y - 5, z.spd, dt); return true; }
  faceTo(z, hurt); z.repairing = HS.t; if ((z.cool -= dt) <= 0) { z.cool = 2.2; hurt.hp = Math.min(hurt.hp0, hurt.hp + 1); HS.Fs.heal++; HS.fx.push({ k: 'spark', x: hurt.x, y: hurt.y, t: 0.35 }); } return true;
}
// flying machines: in -> scan (circle) -> act (strafe / release a swarm / cross the wall) -> leave; a swarm of mites follows its controller
function futFly(z, dt) {
  z.t += dt; const T = z.L.t, D = BSTAT[T];
  if (z.hp <= z.hp0 * 0.5 && z.fs !== 'leave' && T !== 'mite') { z.fs = 'leave'; z.t = 0; HS.Fs.flyerDriven++; }
  const fly = (x, y, alt, sp) => { const dx = x - z.x, dy = y - z.y, d = Math.hypot(dx, dy); if (d > 0.5) { const s = Math.min(d, sp * dt); z.x += dx / d * s; z.y += dy / d * s; z.stride += s; z.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); } z.alt += clamp(alt - z.alt, -20 * dt, 16 * dt); return d; };
  if (!z.crossed && isInside(z.x, z.y)) { z.crossed = 1; HS.Fs.wallCross++; }
  if (z.lead) { const L = z.lead; if (L.st === 'dead' || HS.t > (z.packEnd || 1e9)) { z.lead = null; z.fs = 'leave'; z.t = 0; return true; } const a = HS.t * 1.4 + z.ph; fly(L.x + Math.cos(a) * 14, L.y + Math.sin(a) * 10, L.alt - 10 + Math.sin(a * 2) * 3, z.spd); return true; }   // mites orbit their controller
  switch (z.fs) {
    case 'in': { if (T === 'queen' && !z.released && z.t > 4) futRelease(z);
      const g = z.goal || (z.goal = futFlyGoal(z)); if (fly(g.x, g.y, D.fly, z.spd) < 20) { z.fs = 'circle'; z.t = 0; z.cdur = rr2(8, 16); } return true; }
    case 'circle': { const g = z.goal, a = z.t * 0.6 + z.ph; fly(g.x + Math.cos(a) * 46, g.y + Math.sin(a) * 32, D.fly + Math.sin(z.t) * 2, z.spd * 0.6);
      if (T === 'queen' && !z.released) futRelease(z);
      if (T === 'hawk' && z.t > 4) { const q = futHawkPrey(z); if (q) { z.prey = q; z.fs = 'strafe'; z.t = 0; hsSound('jet', z.x, z.y, 0.8); } }
      if (z.t > z.cdur) { z.fs = 'leave'; z.t = 0; } return true; }
    case 'strafe': { const q = z.prey; if (!q || q.alive === false || q.down || z.t > 8) { z.fs = 'leave'; z.t = 0; return true; } const d = fly(q.x, q.y, 22, z.spd * 1.1); if (d < 70 && (z.gcool -= dt) <= 0) { z.gcool = D.gun[2]; HS.Fs.strafes++;
        if (q.drone) { HS.fx.push({ k: 'bolt', x0: z.x, y0: z.y, z0: z.alt, x1: q.x, y1: q.y, z1: q.alt, t: 0.16, T: 0.16, hostile: 1 }); if (HS.R() < 0.5) futDroneDown(q); } else futBotFire(z, q, D); } return true; }
    case 'leave': { const e = z.exit || (z.exit = futFlyExit(z)); if (fly(e[0], e[1], D.fly + 6, z.spd * 1.1) < 10) { z.st = 'dead'; z.corpseT = 0; z.gone = 1; } return true; }
    default: z.fs = 'in'; return true;
  }
}
function futRelease(z) { z.released = 1; for (let i = 0, n = 3 + Math.floor(HS.R() * 3); i < n && futAlive('mite') < BSTAT.mite.cap; i++) futAddBot(z.x + rr2(-6, 6), z.y + rr2(-6, 6), { t: 'mite', lead: z, packEnd: HS.t + rr2(40, 80), alt: z.alt - 8 }); HS.Fs.swarms++; hsLog('fswarm', {}, true); }
function futFlyGoal(z) {
  const T = z.L.t, r = HS.R();
  if ((T === 'eye' && r < 0.45) || T === 'hawk') { const [x, y] = d2w(rr2(240, 720), wallV(480) + rr2(40, 160)); return { x, y, inside: 1 }; }   // crossing the wall to look inside
  const [x, y] = d2w(rr2(200, 760), wallV(480) - rr2(30, 110)); return { x, y };
}
function futFlyExit(z) { if (z.home) return z.home; return [clamp(z.x - 300, 8, HW - 8), clamp(z.y - 300, 8, HW - 8)]; }
function futFlySpawn(goal) { for (let n = 0; n < 20; n++) { const a = HS.R() * TAU, r = rr2(380, 520), e = [clamp(goal.x + Math.cos(a) * r, 8, HW - 8), clamp(goal.y + Math.sin(a) * r, 8, HW - 8)]; const [u, v] = w2d(e[0], e[1]); if (v > wallV(u) - 20) continue; if (!hsInView(e[0], e[1], 40)) return e; } return null; }
function futHawkPrey(z) { let b = null, bd = 210 * 210; for (const q of HS.fdrones) { if (q.down) continue; const d = (q.x - z.x) ** 2 + (q.y - z.y) ** 2; if (d < bd) { bd = d; b = q; } } if (b) return b;
  for (const p of HS.people) { if (!p.alive || !p.vis || p.onTower || p.z > 0) continue; const d = (p.x - z.x) ** 2 + (p.y - z.y) ** 2; if (d < bd * 0.6 && (!isInside(p.x, p.y) || HF.gk[tileOfW(p.x, p.y)] === GK.FIELD)) { bd = d; b = p; } } return b; }
// wall damage per machine (replaces the infected's crowd rule)
function futWallHit(z, s) {
  const T = z.L.t, D = BSTAT[T]; z.cool = rr2(1.5, 2.2) * (D.acool || 1); s.dmgT = 0.3; hsSound('bang', s.x, s.y, 0.3 + (z.wd || 0) * 0.15);
  let dmg = 0;
  if (z.ram) { dmg = Math.ceil((z.wd || 1) * 1.6); z.ram = 0; HS.Fs.rams++; HS.fx.push({ k: 'dust', x: s.x, y: s.y, t: 0.6 }, { k: 'spark', x: s.x, y: s.y, t: 0.35 }); }
  else if (D.gun && D.wd) { dmg = HS.R() < 0.6 ? Math.max(1, Math.round(z.wd * (s.weak ? 1.3 : 1))) : 0; HS.fx.push({ k: 'bolt', x0: z.x, y0: z.y, z0: T === 'walker' ? 34 : 10, x1: s.x, y1: s.y, z1: 6, t: 0.18, T: 0.18, hostile: 1, big: T === 'walker' ? 1 : 0 }); hsSound('zap', z.x, z.y, 0.6); }
  else if (z.wd) dmg = HS.R() < 0.55 ? Math.max(1, Math.round(z.wd * (s.weak ? 1.4 : 1))) : 0;
  else if (T !== 'rover' && T !== 'pylon' && (countZ(s.x, s.y, 16) >= 4 || HS.R() < (s.hp > 3 ? 0.35 : 0.1))) dmg = 1;
  if (dmg) { s.hp -= dmg; HS.Fs.wallDmg[z.cat] = (HS.Fs.wallDmg[z.cat] || 0) + dmg; if (s.hp <= 0) hsBreach(s); }
}

// ---------------------------------------------------------------- the defenders' weapons: pulse rifles instead of bullets, automatic turrets on powered, un-jammed platforms
function futShoot(a, z, from, range, base) {
  const d = Math.hypot(z.x - a.x, z.y - a.y); if (d > range) return false;
  const night = hsDark(), big = BSTAT[z.L.t] && BSTAT[z.L.t].hp >= 10, p = clamp(base - d / 1000 - (night ? 0.08 : 0) - (HS.weather === 'rain' ? 0.06 : 0) + (big ? 0.08 : 0) - (z.fly ? 0.18 : 0) - ((z.L.t === 'spider' || z.L.t === 'leech') ? (night ? 0.4 : 0.22) : 0), 0.05, 0.92), hit = HS.R() < p;
  HS.stats.shots++; HS.Fs.pulses++; hsNoise(a.x, a.y, 160, 'shot'); hsSound('pulse', a.x, a.y, from.z ? 0.8 : 0.6);
  const tx = hit ? z.x : z.x + rr2(-7, 7), ty = hit ? z.y : z.y + rr2(-7, 7);
  HS.fx.push({ k: 'bolt', x0: from.x, y0: from.y, z0: from.z || 12, x1: tx, y1: ty, z1: z.fly ? z.alt : hit ? 9 : 0, t: 0.14, T: 0.14 });
  if (hit) hsHitZ(z, a, HS.R() < 0.16 ? 6 : 1); else HS.fx.push({ k: 'dust', x: tx, y: ty, t: 0.4 });
  return true;
}
// a turret engages machines that threaten the wall (or are inside / overhead), never a wanderer out in the trees; low, quiet units are hard to pick out
const FT_ENGAGE = new Set(['march', 'wall', 'gate', 'attack', 'pursue', 'climb', 'sabotage', 'deploy']);
function futTurretWants(z) { if (isInside(z.x, z.y)) return true; if (z.fly) return z.fs === 'strafe' || (z.L.t !== 'hawk' && isInside(z.x, z.y)); if (z.climbing) return false; if (z.L.t === 'spider' && z.st !== 'sabotage') return false; if (!FT_ENGAGE.has(z.st)) return false; const [u, v] = w2d(z.x, z.y); return v > wallV(u) - 70; }
function futTurrets(dt) {
  for (const t of HF.towers) {
    const jam = (t.jam || 0) > HS.t, pow = HS.Fp.sec[t.sec].on || HS.Fp.bat > 0.05; t.off = jam || !pow;
    if (jam) HS.Fs.jammedT += dt;
    if (t.off) continue;
    if ((t.cool = (t.cool || 0) - dt) > 0) continue;
    const cx = t.x + 9, cy = t.y + 9, z = nearestZ(cx, cy, 190, futTurretWants);
    if (!z) { t.cool = 0.6; continue; }
    t.cool = rr2(2.2, 3.2) * (z.L.t === 'jammer' ? 0.7 : 1); t.aim = Math.atan2(z.y - cy, z.x - cx); t.fired = HS.t;
    const hit = HS.R() < clamp(0.5 - Math.hypot(z.x - cx, z.y - cy) / 900 - (z.fly ? 0.15 : 0), 0.1, 0.8);
    HS.fx.push({ k: 'bolt', x0: cx, y0: cy, z0: 52, x1: hit ? z.x : z.x + rr2(-6, 6), y1: hit ? z.y : z.y + rr2(-6, 6), z1: z.fly ? z.alt : 8, t: 0.12, T: 0.12, turret: 1 }); HS.Fs.turretShots++; hsSound('turret', cx, cy, 0.6); hsNoise(cx, cy, 140, 'shot');
    if (hit) { const was = z.st; hsHitZ(z, { x: cx, y: cy }, z.fly ? 1 : HS.R() < 0.12 ? 4 : 1); if (was !== 'dead' && z.st === 'dead') HS.Fs.turretKills++; }
  }
}

// ---------------------------------------------------------------- the power grid: sun -> arrays (cleanliness) -> battery -> four sectors (faults, load shedding, repairs)
function futSun(h) { return Math.max(0, Math.sin((h - 6) / 13 * Math.PI)); }
function futPower(dt) {
  const P = HS.Fp, h = HS.hour, wx = HS.weather === 'rain' ? 0.35 : HS.weather === 'wind' ? 0.85 : 1;
  let gen = 0; for (const a of HF.fsolar) { const dirt = P.dirt[a.id]; P.dirt[a.id] = Math.min(1, dirt + dt * (HS.weather === 'wind' ? 0.0011 : 0.0005)); gen += futSun(h) * wx * (1 - dirt * 0.8) * 0.1; }
  gen += HS.weather === 'wind' ? 0.12 : 0.05;                                                                // the turbines
  const night = h < 6.5 || h > 18.5, on = P.sec.filter(s => s.on).length, load = 0.1 + on * (night ? 0.055 : 0.03) + (HS.alarm > 0 ? 0.06 : 0);
  P.gen = gen; P.load = load; P.bat = clamp(P.bat + (gen - load) * dt * 0.004, 0, 1);
  if (P.bat < 0.06 && !P.shed) { const s = P.sec.find(q => q.on && !q.fault && q.i !== P.civ); if (s) { s.on = 0; s.shed = 1; P.shed = 1; HS.Fs.shed++; hsLog('fshed', { s: s.i + 1 }); } }
  if (P.shed && P.bat > 0.22) { for (const s of P.sec) if (s.shed) { s.on = 1; s.shed = 0; } P.shed = 0; HS.Fs.unshed++; }
  for (const s of P.sec) { if (s.flick > 0) s.flick -= dt; if (s.on && HS.R() < dt * 0.004) { s.flick = rr2(0.4, 1.2); HS.Fs.flicker++; } }    // small fluctuations: a brief flicker now and then
  P.histT += dt; if (P.histT > 30) { P.histT = 0; P.hist.push(+P.bat.toFixed(3)); if (P.hist.length > 96) P.hist.shift(); }
}
function futFault(i, why) { const s = HS.Fp.sec[i]; if (!s || s.fault) return; s.fault = 1; s.on = 0;
  if (i === HS.Fp.civ) { s.on = 1; s.backup = 1; s.faultAt = HS.t; s.why = why; HS.Fs.backup = (HS.Fs.backup || 0) + 1; hsLog('fbackup', { s: i + 1 }, true); return; }   // the medical center's sector falls back on emergency batteries: it never goes dark
  s.faultAt = HS.t; s.why = why; HS.Fs.blackouts++; hsLog('fblack', { s: i + 1, why }, true); hsSound('powerdown', HF.fnodes[i] ? HF.fnodes[i].x : HW / 2, HF.fnodes[i] ? HF.fnodes[i].y : HW / 2, 0.7); }
function futRestore(i) { const s = HS.Fp.sec[i]; if (!s.fault) return; s.fault = 0; s.skip = null; s.by = null; s.backup = 0; s.on = HS.Fp.shed && s.shed ? 0 : 1; s.claimed = 0; s.restoredAt = HS.t; HS.Fs.restored++; HS.Fs.blackoutSec += HS.t - (s.faultAt || HS.t); hsLog('frestore', { s: i + 1 }); hsSound('powerup', HF.fnodes[i] ? HF.fnodes[i].x : HW / 2, HF.fnodes[i] ? HF.fnodes[i].y : HW / 2, 0.6); }
const futTechOk = p => p.alive && p.vis && !p.exp && !p.rescue && !p.ride && !p.onTower && !p.arriving && p.st !== 'down' && !p.inj && !(p.task && (['sleep', 'shelter', 'bed', 'down', 'eat', 'respond'].includes(p.task.k) || p.task.ftech));
// wake: a power fault gets the on-call technician out of bed (sleepers count, at a distance penalty, so someone awake still goes first)
const futOnCall = p => p.alive && !p.exp && !p.rescue && !p.ride && !p.onTower && !p.arriving && p.st !== 'down' && !p.inj && p.task && (p.task.k === 'sleep' || p.task.k === 'bed');
function futTechFor(x, y, roles, skip, wake) { let b = null, bd = 1e9; for (const p of HS.people) { if (!roles.includes(p.role) || (skip && skip.includes(p.id))) continue; const ok = futTechOk(p), sleepy = !ok && wake && futOnCall(p); if (!ok && !sleepy) continue; if (sleepy) { const d = (p.x - x) ** 2 + (p.y - y) ** 2 + 4e5; if (d < bd) { bd = d; b = p; } continue; } const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; b = p; } } return b; }

// ---------------------------------------------------------------- friendly drones: repair (walls), cargo (the supply exchange), medical (the hospital roof)
function futAddDrone(k, x, y, o) { const q = Object.assign({ id: HS.fdId++, drone: 1, k, x, y, px: x, py: y, alt: 30, st: 'go', t: 0, dir: 0, ph: HS.R() * 6 }, o || {}); HS.fdrones.push(q); return q; }
function futDroneDown(q) { if (q.down) return; q.down = 1; q.st = 'fall'; q.t = 0; HS.Fs.droneDown++; hsLog('fdown', {}, true); hsSound('crash', q.x, q.y, 0.6); }
function futDrones(dt) {
  const P = HF.fpads, out = [];
  for (const q of HS.fdrones) {
    q.px = q.x; q.py = q.y; q.t += dt;
    const fly = (x, y, alt, sp) => { const dx = x - q.x, dy = y - q.y, d = Math.hypot(dx, dy); if (d > 0.3) { const s = Math.min(d, sp * dt); q.x += dx / d * s; q.y += dy / d * s; q.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); } q.alt += clamp(alt - q.alt, -14 * dt, 12 * dt); return d; };
    if (q.st === 'fall') { q.alt = Math.max(0, q.alt - dt * 28); if (q.alt <= 0) { q.st = 'wreck'; q.t = 0; HS.fx.push({ k: 'dust', x: q.x, y: q.y, t: 0.6 }); } out.push(q); continue; }
    if (q.st === 'wreck') { if (!q.claimed && q.t > 4) futRecoverDrone(q); if (q.t > 400) continue; out.push(q); continue; }   // waits for a recovery team (lost after a long while)
    if (q.st === 'carried') { const c = q.by; if (!c || !c.alive || !c.task || !c.task.fcarry) { q.st = 'wreck'; q.claimed = 0; q.t = 5; out.push(q); continue; } q.x = c.x; q.y = c.y; q.alt = 14; out.push(q); continue; }
    if (q.st === 'bench') { if (q.t > 30) { q.st = 'home'; q.down = 0; q.t = 0; HS.Fs.droneFixed++; hsLog('ffixed', {}); hsSound('powerup', q.x, q.y, 0.4); } out.push(q); continue; }
    if (q.k === 'repair') {
      if (q.st === 'go') { const s = HF.walls[q.seg]; if (!s || s.hp >= s.max || s.breached) { q.st = 'home'; q.t = 0; out.push(q); continue; } const [ix, iy] = tileC(s.inT); if (fly(ix, iy, 20, 14) < 3) { q.st = 'weld'; q.t = 0; } }
      else if (q.st === 'weld') { const s = HF.walls[q.seg]; if (!s || s.breached) { q.st = 'home'; out.push(q); continue; } q.alt += clamp(s.h + 4 - q.alt, -6 * dt, 6 * dt); if (HS.R() < dt * 4) HS.fx.push({ k: 'spark', x: s.x + rr2(-2, 2), y: s.y + rr2(-2, 2), t: 0.35 }); if (q.t > 7) { s.hp = Math.min(s.max, s.hp + 2); HS.Fs.droneRepair++; q.t = 0; if (s.hp >= s.max) q.st = 'home'; } }
      else if (q.st === 'home') { if (fly(P.ws.x, P.ws.y, 0, 12) < 1 && q.alt < 1) continue; }   // landed: the pad takes it back (removed)
    } else if (q.k === 'cargo') {
      if (q.st === 'go') { if (fly(P.mk.x, P.mk.y, 22, 13) < 2) { q.st = 'land'; q.t = 0; } }
      else if (q.st === 'land') { q.alt = Math.max(1.4, q.alt - dt * 8); if (q.t > 4) { q.st = 'unload'; q.t = 0; } }
      else if (q.st === 'unload') { if (q.t > 6) { futRestock(); HS.Fs.cargo++; hsLog('fcargo', {}); q.st = 'leave'; q.t = 0; } }
      else if (q.st === 'leave') { if (fly(q.ex, q.ey, 40, 16) < 6) continue; }
    } else if (q.k === 'med') {
      if (q.st === 'go') { if (fly(P.med.x, P.med.y, P.med.z + 14, 13) < 2) { q.st = 'land'; q.t = 0; } }
      else if (q.st === 'land') { q.alt = Math.max(P.med.z + 1.6, q.alt - dt * 6); if (q.t > 5) { q.st = 'unload'; q.t = 0; } }
      else if (q.st === 'unload') { if (q.t > 6) { if (HS.store) HS.store.med = Math.min(STORE_CAP.med, (HS.store.med || 0) + 4); HS.Fs.medDeliv++; hsLog('fmed', {}); q.st = 'leave'; q.t = 0; } }
      else if (q.st === 'leave') { if (fly(q.ex, q.ey, 46, 16) < 6) continue; }
    }
    out.push(q);
  }
  HS.fdrones = out;
}
// friendly traffic comes from the river side of the valley (behind the settlement, away from the machines)
function futFar() { const [x, y] = d2w(rr2(320, 640), wallV(480) + rr2(230, 300)); return [clamp(x, 12, HW - 12), clamp(y, 12, HW - 12)]; }
function futRestock() { for (const s of HS.stalls || []) if (s.stock !== undefined) s.stock = Math.min(s.max || 6, s.stock + 2); if (HS.store) HS.store.parts = Math.min(STORE_CAP.parts || 40, (HS.store.parts || 0) + 2); }
// a downed drone is carried to the workshop by a builder and put back together on the bench
function futRecoverDrone(q) {
  const ws = HF.fpads.ws, p = futTechFor(q.x, q.y, ['builder', 'tech', 'smith']); if (!p || !isInside(q.x, q.y)) { if (!isInside(q.x, q.y) && q.t > 60) q.t = 401; return; }
  q.claimed = 1; HS.Fs.droneRecover++; hsLog('frecov', {});
  setTask(p, Object.assign(lfChain('chain', [{ x: q.x, y: q.y, dur: 4, anim: 'kneel', tool: '', face: q, fx: 'spark', fxr: 1, out: () => { q.st = 'carried'; q.by = p; } }, { x: ws.x, y: ws.y + 4, dur: 3, anim: 'stand', tool: 'crate', out: () => { q.st = 'bench'; q.t = 0; q.by = null; q.x = ws.x; q.y = ws.y; q.alt = 0.6; } }]), { ftech: 1, fcarry: 1 }));
}

// ---------------------------------------------------------------- setup + the community's technology loops and the signature events
function futPre() {
  HS.Fs = { spawned: {}, detect: 0, lightDetect: 0, sig: 0, relay: 0, relayBoost: 0, reinfReq: 0, reinf: 0, chain: 0, flank: 0, patrols: 0, patrolLegs: 0, climbs: 0, infiltrations: 0, sabotage: 0, leechCut: 0, jams: 0, jamT: 0, jammedT: 0, heal: 0, pylonDeploy: 0, charges: 0, rams: 0, weakSeek: 0, siegeApproach: 0, walkers: 0, colossus: 0, wallDmg: {},
    swarms: 0, strafes: 0, wallCross: 0, flyers: 0, flyerDriven: 0, botShots: 0, botHits: 0, pulses: 0, turretShots: 0, turretKills: 0, kills: {}, wrecks: 0, salvageExp: 0, salvaged: 0, parts: 0, fab: 0, pursuit: 0, solarClean: 0, blackouts: 0, restored: 0, blackoutSec: 0, shed: 0, unshed: 0, flicker: 0,
    droneRepair: 0, droneOut: 0, droneDown: 0, droneRecover: 0, droneFixed: 0, cargo: 0, medDeliv: 0, recovered: 0, charge: 0, techCalls: 0 };
  HS.sig = []; HS.fdrones = []; HS.fdId = 0; HS.Freinf = null;
}
function futInit() {
  HS.Fp = { bat: 0.72, gen: 0, load: 0, shed: 0, civ: futSecOf(HF.buildings.find(b => b.kind === 'infirmary').x, HF.buildings.find(b => b.kind === 'infirmary').y), dirt: HF.fsolar.map(() => HS.R() * 0.3), sec: [0, 1, 2, 3].map(i => ({ i, on: 1, fault: 0, flick: 0, shed: 0 })), hist: [], histT: 0 };
  HS.nextF = { patrol: HS.t + rr2(20, 50), recon: HS.t + rr2(30, 70), hawk: HS.t + rr2(240, 480), queen: HS.t + rr2(400, 700), fault: HS.t + rr2(300, 600), cargo: HS.t + rr2(60, 140), med: HS.t + rr2(180, 360), clean: HS.t + 20, salvage: HS.t + rr2(60, 120), fab: HS.t + 40, reinf: 0, walker: HS.t + rr2(900, 1500), colossus: HS.t + rr2(1500, 2600), repair: HS.t + 8, jam: HS.t + rr2(400, 800), recover: 0 };
  HS.Fs.parts = 3; HS.Fsal = [];
}
function futTick(dt) {
  const N = HS.nextF, Fs = HS.Fs, h = HS.hour, iv = DANGER[HS.danger].iv;
  futPower(dt); futTurrets(dt); futDrones(dt);
  HS.sig = HS.sig.filter(s => HS.t - s.t < 2.4);
  for (const z of HS.zombies) if (z.st === 'dead' && !z.fxd) { z.fxd = 1; if (!z.gone) { Fs.kills[z.L.t] = (Fs.kills[z.L.t] || 0) + 1; Fs.wrecks++; HS.fx.push({ k: 'spark', x: z.x, y: z.y, t: 0.35 }, { k: 'spark', x: z.x + 2, y: z.y - 1, t: 0.3 }, { k: 'dust', x: z.x, y: z.y, t: 0.6 }); hsSound('crash', z.x, z.y, 0.5 + Math.min(0.5, z.hp0 / 40)); } }
  // the reinforcements a scout called in arrive from out of sight and head for the reported position
  const RF = HS.Freinf; if (RF && HS.t > RF.t) { HS.Freinf = null; const n = Math.round(rr2(3, 6) * DANGER[HS.danger].n); let k = 0;
    for (let i = 0; i < n; i++) { const z = hsSpawnNear(RF.x, RF.y, 170, 260); if (!z) continue; futMorph(z, pickR(['hound', 'hound', 'sentry', 'racer', 'skitter'])); z.st = 'investigate'; z.t = 0; z.responding = HS.t + 40; hsGo(z, RF.x + rr2(-14, 14), RF.y + rr2(-14, 14), 'z'); const s = futNearSeg(RF.x, RF.y); const [u, v] = w2d(RF.x, RF.y); if (s && v > wallV(u) - 70) z.toWall = s.id; k++; }
    if (k) { Fs.reinf++; Fs.chain++; Fs.reinfBots = (Fs.reinfBots || 0) + k; hsLog('freinf', { n: k }, true); } }
  // patrol formations of sentries walk the frontier (never more than three squads)
  if (HS.t > N.patrol) { N.patrol = HS.t + rr2(70, 140) * iv; if (HS.zombies.filter(z => z.st === 'patrol').length < 3 && futAlive('sentry') < BSTAT.sentry.cap - 2) futPatrol(); }
  // recon flights: a surveillance drone or a swarm of mites sweeps the frontier (and now and then crosses the wall)
  if (HS.t > N.recon) { N.recon = HS.t + rr2(60, 130) * iv; if (HS.zombies.filter(z => z.fly && z.st !== 'dead').length < 6 && futAlive('eye') < BSTAT.eye.cap) { const goal = futFlyGoal({ L: { t: 'eye' } }), s = futFlySpawn(goal); if (s) { futAddBot(s[0], s[1], { t: 'eye', goal }); Fs.flyers++; } } }
  if (HS.t > N.hawk) { N.hawk = HS.t + rr2(220, 420) * iv; if (h > 6 && h < 20 && futAlive('hawk') < 2) { const goal = futFlyGoal({ L: { t: 'hawk' } }), s = futFlySpawn(goal); if (s) { futAddBot(s[0], s[1], { t: 'hawk', goal }); Fs.flyers++; hsLog('fhawk', {}, true); } } }
  if (HS.t > N.queen) { N.queen = HS.t + rr2(500, 900) * iv; if (!futAlive('queen')) { const goal = futFlyGoal({ L: { t: 'queen' } }), s = futFlySpawn(goal); if (s) { futAddBot(s[0], s[1], { t: 'queen', goal }); Fs.flyers++; } } }
  // a jammer comes out of the forest now and then (an electronic attack)
  if (HS.t > N.jam) { N.jam = HS.t + rr2(500, 900) * iv; if (!futAlive('jammer')) { const seg = hsTowerSeg(), z = hsSpawnNear(seg.x, seg.y, 190, 260); if (z) { futMorph(z, 'jammer'); z.st = 'investigate'; hsGo(z, seg.x - 40, seg.y - 40, 'z'); } } }
  if (HS.t > (N.spider || (N.spider = HS.t + rr2(300, 600)))) { N.spider = HS.t + rr2(420, 800) * iv; if ((h > 19 || h < 5) && futAlive('spider') < 2) { const w = HF.walls.filter(q => !q.gate && q.outT >= 0 && (q.weak || q.kind === 'mesh')), seg = w.length ? pickR(w) : hsTowerSeg(), z = hsSpawnNear(seg.x, seg.y, 160, 230); if (z) { futMorph(z, 'spider'); hsToWall(z, seg); Fs.spiderRaids = (Fs.spiderRaids || 0) + 1; } } }
  // the siege walker: a rare heavy assault on the gate's flank; the colossus walks the frontier even more rarely
  if (HS.t > N.walker) { N.walker = HS.t + rr2(1200, 2000) * iv; if (!futAlive('walker')) { const g = HF.walls[HF.gate.segs[0]], z = hsSpawnNear(g.x, g.y, 220, 300); if (z) { futMorph(z, 'walker'); z.siege = 1; Fs.walkers++; hsLog('fwalker', {}, true); for (let i = 0; i < 4; i++) { const e = hsSpawnNear(g.x, g.y, 200, 280); if (e) { e.delay = i * rr2(1, 3); hsToWall(e, futGateFlank()); } } } } }
  if (HS.t > N.colossus) { N.colossus = HS.t + rr2(2000, 3200) * iv; if (!futAlive('colossus')) { const [x, y] = d2w(rr2(220, 740), wallV(480) - rr2(120, 170)); const k = hfNearPass(x, y, 'out', 8); if (k >= 0 && !hsInView(x, y)) { const c = tileC(k), z = futAddBot(c[0], c[1], { t: 'colossus' }); Fs.colossus++; hsLog('fcolossus', {}, true); if (HS.R() < 0.4) z.siegeAt = HS.t + rr2(40, 120); } } }
  for (const z of HS.zombies) if (z.siegeAt && HS.t > z.siegeAt && z.st !== 'dead') { z.siegeAt = 0; z.siege = 1; }
  // grid faults: a sector goes dark (a localized blackout); a technician walks to its substation and brings it back
  if (HS.t > N.fault) { N.fault = HS.t + rr2(360, 720); const s = HS.Fp.sec.filter(q => q.on && !q.fault && q.i !== HS.Fp.civ); if (s.length) futFault(pickR(s).i, 'fault'); }
  for (const s of HS.Fp.sec) if (s.fault && !s.claimed && HS.t - s.faultAt > 3) { const nd = HF.fnodes[s.i]; if (!nd) { futRestore(s.i); continue; } const p = futTechFor(nd.sx, nd.sy, ['tech', 'builder', 'smith'], s.skip, 1); if (!p) continue; if (!p.vis) { p.vis = true; } s.claimed = 1; s.claimAt = HS.t; Fs.techCalls++;
    const T = Object.assign(lfChain('chain', [{ x: nd.sx, y: nd.sy, dur: rr2(9, 14), anim: 'hammer', tool: 'hammer', face: nd, fx: 'spark', fxr: 2, run: 1, out: () => futRestore(s.i) }]), { ftech: 1 }); setTask(p, T); s.by = p; s.task = T; }
  for (const s of HS.Fp.sec) if (s.fault && s.claimed && (!s.by || !s.by.alive || s.by.task !== s.task || HS.t - s.claimAt > 80)) { if (s.by && HS.t - s.claimAt > 80) { (s.skip = s.skip || []).push(s.by.id); if (s.by.task === s.task) s.by.task = null; } s.claimed = 0; s.by = null; }   // called away, or stuck on the way: someone else goes   // the technician was called away: someone else goes at once
  // solar maintenance: the dirtiest array gets a wipe-down (its output comes back)
  if (HS.t > N.clean && h > 7 && h < 18) { N.clean = HS.t + rr2(25, 50); let a = null, bd = 0.3; for (const q of HF.fsolar) if (HS.Fp.dirt[q.id] > bd && !q.claimed) { bd = HS.Fp.dirt[q.id]; a = q; }
    if (a) { const p = futTechFor(a.sx, a.sy, ['tech', 'builder', 'farmer']); if (p) { a.claimed = 1; setTask(p, Object.assign(lfChain('chain', [{ x: a.sx, y: a.sy, dur: rr2(10, 16), anim: 'kneel', tool: 'cloth', face: a, out: () => { HS.Fp.dirt[a.id] = 0; a.claimed = 0; Fs.solarClean++; } }]), { ftech: 1 })); } } }
  for (const a of HF.fsolar) if (a.claimed && !HS.people.some(p => p.task && p.task.ftech && p.task.legs && p.task.legs[0].face === a)) a.claimed = 0;
  // repair drones go out to any damaged section that no drone is working on (more of them in the recovery after an attack)
  if (HS.t > N.repair && HF.fpads.ws) { N.repair = HS.t + (HS.mode === 'recovery' ? 4 : 10); const busy = new Set(HS.fdrones.filter(q => q.k === 'repair').map(q => q.seg)), out = HS.fdrones.filter(q => q.k === 'repair' && !q.down).length;
    const s = HF.walls.filter(q => !q.gate && !q.breached && q.hp < q.max && !busy.has(q.id) && !(q.lastHit > HS.t - 8)).sort((a, b) => a.hp - b.hp)[0];
    if (s && out < (HS.mode === 'recovery' ? 4 : 2)) { futAddDrone('repair', HF.fpads.ws.x, HF.fpads.ws.y, { seg: s.id, alt: 0 }); Fs.droneOut++; } }
  // deliveries: cargo drones to the supply exchange, medical drones to the hospital roof
  if (HS.t > N.cargo && HF.fpads.mk) { N.cargo = HS.t + rr2(120, 240); if (HS.alarm <= 0) { const [ex, ey] = futFar(); futAddDrone('cargo', ex, ey, { ex, ey, alt: 40 }); } }
  if (HS.t > N.med && HF.fpads.med) { N.med = HS.t + rr2(300, 600); if (HS.alarm <= 0) { const [ex, ey] = futFar(); futAddDrone('med', ex, ey, { ex, ey, alt: 46 }); } }
  // salvage: in quiet times a team goes out to strip a wreck near the wall (parts for the workshop); coming home they may be chased
  if (HS.t > N.salvage) { N.salvage = HS.t + rr2(90, 160); if (HS.alarm <= 0 && HS.exps.length < 2 && h > 6.5 && h < 18) futSalvageRun(); }
  for (const e of HS.Fsal) {
    if (e.ph === 'back' && !e.got && e.wreck) { e.got = 1; e.wreck.corpseT = Math.min(e.wreck.corpseT, 1); e.wreck.salvaged = 1; Fs.salvaged++;
      if (HS.R() < 0.45) { const L = e.team[0]; if (L) { let n = 0; for (let i = 0; i < 2 + Math.floor(HS.R() * 2); i++) { const z = hsSpawnNear(L.x, L.y, 150, 220); if (!z) continue; futMorph(z, HS.R() < 0.4 ? 'racer' : 'hound'); z.st = 'pursue'; z.tgt = L; z.t = 0; n++; } if (n) { Fs.pursuit++; hsLog('fpursuit', {}, true); } } } }
  }
  HS.Fsal = HS.Fsal.filter(e => { if (HS.exps.includes(e)) return true; if (e.got && e.team.some(p => p.alive)) { Fs.parts += 2 + Math.round((e.wreck ? e.wreck.hp0 : 4) / 6); hsLog('fsalvage', {}); } return false; });
  // the fabrication bay turns salvaged parts into spares (the parts bin visibly empties)
  if (HS.t > N.fab && Fs.parts >= 3) { N.fab = HS.t + rr2(40, 80); const f = HF.props.find(p => p.kind === 'forge'); const p = f && futTechFor(f.x, f.y, ['smith', 'tech']); if (p) { setTask(p, Object.assign(lfChain('chain', [{ x: f.x + 5, y: f.y + 11, dur: rr2(10, 16), anim: 'hammer', tool: 'hammer', face: f, fx: 'spark', fxr: 2, out: () => { if (Fs.parts >= 3) { Fs.parts -= 3; Fs.fab++; if (HS.store) HS.store.parts = Math.min(STORE_CAP.parts || 40, (HS.store.parts || 0) + 1); } } }]), { ftech: 1 })); } }
  // community recovery: once the alarm is over and the walls, the grid and the wounded are seen to, the settlement marks it
  if (HS.mode === 'recovery' && !N.recover) N.recover = HS.t;
  if (N.recover && HS.mode === 'peace' && HS.t - N.recover > 20) { const ok = HF.walls.every(s => s.gate || s.hp >= s.max * 0.8) && HS.Fp.sec.every(s => !s.fault); if (ok || HS.t - N.recover > 400) { N.recover = 0; if (ok) { Fs.recovered++; hsLog('frecover', {}); } } }
}
function futStatsOf(t) { const D = BSTAT[t]; return { hp: D.hp, hp0: D.hp, spd: rr2(D.spd[0], D.spd[1]), sight: D.sight, bite: D.bite, acool: D.acool, stag: D.stag, wd: D.wd, chg: D.chg, cat: BCAT[t] }; }
function futMorph(z, t) { z.L.t = t; Object.assign(z, futStatsOf(t)); HS.Fs.spawned[t] = (HS.Fs.spawned[t] || 0) + 1; }
function futPatrol() {
  for (let n = 0; n < 20; n++) {
    const u0 = rr2(200, 760), v0 = wallV(u0) - rr2(80, 140), [x, y] = d2w(u0, v0), k = tileOfW(x, y); if (!hfPass(k, 'out') || hsInView(x, y)) continue;
    const L = futAddBot(x, y, { t: 'sentry', st: 'patrol' }), dirn = u0 < 480 ? 1 : -1; L.wp = [];
    for (let i = 1; i <= 5; i++) { const u = clamp(u0 + dirn * i * 60, 170, 790), [wx, wy] = d2w(u, wallV(u) - rr2(70, 120)); if (hfPass(tileOfW(wx, wy), 'out')) L.wp.push([wx, wy]); }
    for (let i = 0; i < 2; i++) { const q = hfNearPass(x + rr2(-8, 8), y + rr2(-8, 8), 'out', 3); if (q < 0) continue; const [cx, cy] = tileC(q); futAddBot(cx, cy, { t: i ? 'warden' : 'sentry', st: 'pack', lead: L, packEnd: HS.t + 400, lane: i ? -3 : 3 }); }
    HS.Fs.patrols++; return L;
  }
  return null;
}
function futSalvageRun() {
  const wrecks = HS.zombies.filter(z => z.st === 'dead' && !z.gone && !z.salvaged && !z.fly && z.corpseT > 40 && !isInside(z.x, z.y) && (() => { const [u, v] = w2d(z.x, z.y); return v > wallV(u) - 150; })());
  if (!wrecks.length) return null; const w = wrecks.sort((a, b) => b.hp0 - a.hp0)[0];
  const pool = HS.people.filter(p => p.alive && (p.role === 'scav' || p.role === 'builder') && !p.exp && !p.inj && p.vis !== false && (!p.task || !p.task.ftech));
  if (pool.length < 2) return null;
  const team = pool.slice(0, 3), poi = { name: 'salvage', x: w.x, y: w.y, spots: [[w.x + 4, w.y + 4]] };
  const e = { id: HS.stats.exp++, team, poi, ph: 'prep', t: 0, loot: 'parts', start: team.length, hurt: 0, rescued: false, wreck: w, salvage: 1 };
  for (const p of team) { hsClaim(p, null); p.exp = e; p.task = { k: 'exp', t: 0 }; p.variant = 'pistol'; p.L.pack2 = 1; const s = spotXY('yard', 4); hsGo(p, s.x, s.y, 'all'); }
  HS.exps.push(e); HS.Fsal.push(e); HS.Fs.salvageExp++; hsLog('exp.out', { n: team.map(hsName).join(', '), poi: 'salvage' }); return e;
}
