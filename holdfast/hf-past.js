'use strict';
// ===== Holdfast PAST — simulation layer (DOM-free): the map pass, dinosaurs, flyers, the apex, herbivores, fire, the fire-keeper, beacons,
// the evening fire dance, stake traps. Everything here runs only when HF.era === 'past'; the Current timeline never reaches it.
// Counters live in HS.Ps (diagnostics for tests/holdfast-past.mjs).

// ---------------------------------------------------------------- map pass (after the shared geography, layout and nav grid are built)
function pastMap() {
  const R = mulberry32(911), near = (x, y, r) => { const k = hfNearPass(x, y, 'in', r || 6); return k >= 0 ? tileC(k) : null; };
  HF.torches = []; HF.fires = []; HF.traps = []; HF.ring = [];
  for (const p of HF.props) {
    if (p.kind === 'lamp' || p.kind === 'lantern') { const s = near(p.x + 3, p.y + 3, 3); HF.torches.push({ p, x: p.x, y: p.y, z: p.kind === 'lamp' ? 22 : 13, sx: s ? s[0] : p.x + 3, sy: s ? s[1] : p.y + 3, lit: 0 }); }
    else if (p.kind === 'hedgehog') HF.traps.push({ x: p.x, y: p.y, cd: 0 });
    else if (p.kind === 'firepit') HF.fires.push({ k: 'pit', x: p.x, y: p.y, z: 1.5, r: 3.6 });
    else if (p.kind === 'drumfire') HF.fires.push({ k: 'camp', x: p.x, y: p.y, z: 1, r: 2.2 });
    else if (p.kind === 'forge') HF.fires.push({ k: 'hearth', x: p.x + 5, y: p.y + 4, z: 3.6, r: 2 });
  }
  // house campfires (every third home), the sacred fire bowl and the dance ring at the Ancestor Hall, the cookhouse spit
  const ok = (x, y) => { const k = tileOfW(x, y); return hfPass(k, 'in') && !HF.occ[k] && HF.zone[k] === Z_SETTLE; };
  HF.buildings.filter(b => b.kind === 'house').forEach((b, i) => { if (i % 3) return; for (const [dx, dy] of [[b.w + 7, b.d + 9], [-7, b.d + 9], [b.w / 2, b.d + 16]]) { const x = b.x + dx, y = b.y + dy; if (ok(x, y)) { addP('campfire', x, y); HF.fires.push({ k: 'camp', x, y, z: 1, r: 2.2, home: b.id }); break; } } });
  const ch = HF.buildings.find(b => b.kind === 'church');
  if (ch) { const bx = ch.x + ch.w / 2 + 2, by = ch.y + ch.d + 22; addP('brazier', bx, by); HF.sacred = { x: bx, y: by }; HF.fires.push({ k: 'sacred', x: bx, y: by, z: 6.5, r: 3.4 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, s = near(bx + Math.cos(a) * 15, by + Math.sin(a) * 11, 2); if (s) HF.ring.push({ x: s[0], y: s[1], a }); }
    const st = near(bx - 8, by - 2, 3); HF.drumAt = st ? { x: st[0], y: st[1] } : { x: bx - 8, y: by }; }
  const kt = HF.buildings.find(b => b.kind === 'kitchen'); if (kt) { const x = kt.x + kt.w + 5, y = kt.y + kt.d * 0.4; addP('spit', x, y); HF.fires.push({ k: 'spit', x: x + 5, y: y + 0.5, z: 1, r: 2.2 }); }
  for (const t of HF.towers) HF.fires.push({ k: 'beacon', x: t.x + 15, y: t.y + 3.5, z: 51.5, r: 3.4, tower: t.id });
  // vegetation: tree ferns and cycads among the wild broadleaves, low ferns in the undergrowth
  for (const t of HF.trees) { if (t.big || t.spc === 'oak') continue; const k = tileOfW(t.x, t.y); if (HF.zone[k] === Z_SETTLE) continue; const r = R(); if (t.spc !== 'pine' && r < 0.45) t.spc = 'fern'; else if (r < 0.58) t.spc = 'cycad'; }
  let ferns = 0; for (let n = 0; n < 2600 && ferns < 220; n++) { const k = Math.floor(R() * HN * HN); if (HF.zone[k] !== Z_WILD || HF.occ[k] || HF.gk[k] === GK.ROAD || HF.gk[k] === GK.TRAIL || HF.wood[k] < 0.45) continue; const [x, y] = tileC(k); addP('fern', x + R() * 6 - 3, y + R() * 6 - 3, { v: ferns % 3 }); ferns++; }
}

// ---------------------------------------------------------------- dinosaur roster: stats + behaviour flags (art in hf-past-art.js DSPEC)
const DSTAT = {
  compy:  { hp: 1, spd: [8, 9.5], sight: 0.9, bite: 0.5, acool: 0.9, stag: 0.5 },
  raptor: { hp: 3, spd: [7, 8.4], sight: 1.25, bite: 1.1, acool: 1.1, stag: 0.4, pack: 1 },
  utah:   { hp: 5, spd: [6.4, 7.6], sight: 1.2, bite: 1.3, acool: 1.2, stag: 0.35, pack: 1 },
  dilo:   { hp: 4, spd: [4.8, 5.6], sight: 1.3, bite: 1, acool: 1.4, stag: 0.4, circ: 1 },
  pachy:  { hp: 5, spd: [4.6, 5.4], sight: 1, bite: 0.8, acool: 1.6, stag: 0.3, chg: 1, wd: 1.2 },
  carno:  { hp: 8, spd: [5, 6], sight: 1.1, bite: 1.4, acool: 1.5, stag: 0.25, chg: 1, wd: 1.5 },
  trike:  { hp: 12, spd: [3.4, 4], sight: 0.8, bite: 0.9, acool: 2, stag: 0.15, chg: 1, wd: 2.2 },
  ankylo: { hp: 14, spd: [2.4, 3], sight: 0.7, bite: 0.7, acool: 2.2, stag: 0.1, wd: 2.4, weak: 1 },
  allo:   { hp: 12, spd: [4.6, 5.4], sight: 1.2, bite: 1.6, acool: 1.6, stag: 0.15, wd: 1.8 },
  spino:  { hp: 14, spd: [4, 4.8], sight: 1.1, bite: 1.6, acool: 1.7, stag: 0.12, wd: 1.8 },
  trex:   { hp: 26, spd: [4.4, 5], sight: 1.4, bite: 2.2, acool: 1.8, stag: 0.05, wd: 3, apex: 1 },
  ptero:  { hp: 3, spd: [13, 15], sight: 1, bite: 0.6, acool: 2, stag: 0.3, fly: 1 }
};
const DCAT = { compy: 'small', raptor: 'pack', utah: 'pack', dilo: 'stalker', pachy: 'charger', carno: 'charger', trike: 'charger', ankylo: 'breaker', allo: 'heavy', spino: 'heavy', trex: 'apex', ptero: 'flyer' };
const DCAP = { allo: 2, spino: 1, trike: 3, ankylo: 3, carno: 3, utah: 6, trex: 1, ptero: 3 };
function pastPickSpecies(o) {
  if (o && o.sp) return o.sp;
  const r = HS.R(), tag = o && o.tag;
  let t = tag === 'siege' || tag === 'major' ? (r < 0.42 ? 'raptor' : r < 0.56 ? 'utah' : r < 0.66 ? 'pachy' : r < 0.74 ? 'carno' : r < 0.81 ? 'trike' : r < 0.87 ? 'ankylo' : r < 0.93 ? 'allo' : 'dilo')
    : tag === 'medium' ? (r < 0.5 ? 'raptor' : r < 0.64 ? 'utah' : r < 0.76 ? 'pachy' : r < 0.88 ? 'dilo' : r < 0.95 ? 'carno' : 'trike')
    : tag === 'minor' || tag === 'probe' ? (r < 0.48 ? 'raptor' : r < 0.62 ? 'compy' : r < 0.76 ? 'pachy' : r < 0.88 ? 'dilo' : 'ankylo')
    : (r < 0.28 ? 'compy' : r < 0.52 ? 'raptor' : r < 0.64 ? 'dilo' : r < 0.73 ? 'pachy' : r < 0.8 ? 'utah' : r < 0.86 ? 'carno' : r < 0.9 ? 'trike' : r < 0.94 ? 'ankylo' : r < 0.97 ? 'allo' : 'spino');
  if (tag === 'siege' && !HS.zombies.some(z => z.st !== 'dead' && z.L.sp === 'trex')) t = 'trex';
  if (DCAP[t] != null && HS.zombies.filter(z => z.st !== 'dead' && z.L.sp === t).length >= DCAP[t]) t = 'raptor';
  return t;
}
function pastAddDino(x, y, o) {
  x = clamp(x, 4, HW - 4); y = clamp(y, 4, HW - 4);
  const sp = pastPickSpecies(o), D = DSTAT[sp], S = DSPEC[sp];
  const L = { ev: 'dino', sp, morph: Math.floor(HS.R() * S.col.length), seed: Math.floor(HS.R() * 4) * 37 };   // a few stripe seeds per morph keep the sheet cache small
  const z = Object.assign({ id: HS.zid++, L, x, y, px: x, py: y, dir: 1, st: 'wander', hp: D.hp, hp0: D.hp, spd: rr2(D.spd[0], D.spd[1]), t: 0, path: null, stride: 0, ph: HS.R() * 10, cool: 0, seg: -1, st2: '', stT: 0, kx: 0, ky: 0, idle: 0, route: null, rp: 0, lane: rr2(-3, 3),
    sight: D.sight, bite: D.bite, acool: D.acool, stag: D.stag, wd: D.wd, chg: D.chg, circ: D.circ, cat: DCAT[sp], alt: 0 }, o || {});
  delete z.sp;
  HS.zombies.push(z); HS.Ps.spawned[sp] = (HS.Ps.spawned[sp] || 0) + 1;
  if (D.fly) { z.fly = 1; z.st = 'fly'; z.fs = 'in'; z.alt = 46; }
  // pack species arrive with company: compies in threes, raptors in packs (behind a leader)
  if (!z.noPack && (sp === 'compy' || ((sp === 'raptor' || sp === 'utah') && (!o || !o.st) && HS.R() < 0.6))) {
    const n = sp === 'compy' ? 2 + Math.floor(HS.R() * 2) : 1 + Math.floor(HS.R() * 3);
    for (let i = 0; i < n; i++) { const k = hfNearPass(x + rr2(-10, 10), y + rr2(-10, 10), 'out', 3); if (k < 0) continue; const [cx, cy] = tileC(k); const m = pastAddDino(cx, cy, { sp, noPack: 1, st: 'pack', lead: z, packEnd: HS.t + rr2(60, 140), band: o && o.band }); m.t = 0; }
    HS.Ps.packs++;
  }
  return z;
}
// wall damage per species (replaces the infected's crowd rule for dinosaurs)
function pastWallHit(z, s) {
  const crowd = countZ(s.x, s.y, 16), D = DSTAT[z.L.sp];
  z.cool = rr2(1.4, 2) * (D.acool || 1); s.dmgT = 0.3; hsSound('bang', s.x, s.y, 0.35 + (z.wd || 0) * 0.15);
  let dmg = 0;
  if (z.ram) { dmg = Math.ceil((z.wd || 1) * 1.6); z.ram = 0; HS.Ps.rams++; HS.fx.push({ k: 'dust', x: s.x, y: s.y, t: 0.6 }, { k: 'splinter', x: s.x, y: s.y, t: 0.35 }); }
  else if (z.wd) dmg = HS.R() < 0.55 ? Math.max(1, Math.round(z.wd * (s.weak ? 1.4 : 1))) : 0;
  else if (z.L.sp !== 'compy' && (crowd >= 4 || HS.R() < (s.hp > 3 ? 0.4 : 0.1))) dmg = 1;
  if (dmg) { s.hp -= dmg; HS.Ps.wallDmg[z.cat] = (HS.Ps.wallDmg[z.cat] || 0) + dmg; if (s.hp <= 0) hsBreach(s); }
  if (z.wd && z.wd >= 2) HS.fx.push({ k: 'splinter', x: s.x, y: s.y, t: 0.35 });
}
// per-tick species behaviour; returns true when it handled the dinosaur this tick (the shared infected logic is skipped)
function pastZ(z, dt) {
  // stake traps along the kill-zone: a dinosaur that blunders into one is wounded
  if (!z.fly && HF.traps && HF.zone[tileOfW(z.x, z.y)] === Z_CLEAR) for (const tr of HF.traps) { if (tr.cd > HS.t || Math.abs(tr.x - z.x) > 5 || Math.abs(tr.y - z.y) > 5) continue; tr.cd = HS.t + 25; HS.Ps.trapHits++; hsHitZ(z, { x: tr.x, y: tr.y }, z.cat === 'small' || z.cat === 'pack' ? 2 : 3); hsSound('stab', z.x, z.y, 0.5); if (z.st === 'dead') return true; }
  if (z.fly) return pastFly(z, dt);
  // fire: at night the smaller hunters shy away from a lit beacon or torch near the wall
  if (hsDark() && (z.cat === 'pack' || z.cat === 'small' || z.cat === 'stalker') && (z.st === 'wall' || z.st === 'gate' || z.st === 'pursue') && HS.R() < dt * 0.25) {
    const f = pastFireNear(z.x, z.y, 46); if (f) { HS.Ps.fireScare++; z.st = 'wander'; z.tgt = null; z.seg = -1; const dx = z.x - f.x, dy = z.y - f.y, d = Math.hypot(dx, dy) || 1; z.path = { direct: 1, gx: z.x + dx / d * 50, gy: z.y + dy / d * 50, mask: 'z' }; bubbleZ(z); return true; } }
  // the apex roars: heard across the valley, herbivores scatter, the curious come
  if (z.L.sp === 'trex' && HS.t > (z.roarT || 0)) { z.roarT = HS.t + rr2(18, 40); z.roarAt = HS.t; HS.Ps.roars++; hsSound('roar', z.x, z.y, 1); hsNoise(z.x, z.y, 260, 'roar'); for (const w of HS.wild) if (w.k === 'deer' && Math.hypot(w.x - z.x, w.y - z.y) < 220) { w.flee = 4; const dx = w.x - z.x, dy = w.y - z.y, d = Math.hypot(dx, dy) || 1; w.fx = w.x + dx / d * 90; w.fy = w.y + dy / d * 90; } }
  // stalkers circle and watch before they close in
  if (z.circ && z.st === 'pursue' && !z.circled && z.tgt) { const d = Math.hypot(z.tgt.x - z.x, z.tgt.y - z.y); if (d < 72) { z.st = 'circle'; z.t = 0; z.circled = 1; z.ang = Math.atan2(z.y - z.tgt.y, z.x - z.tgt.x); z.cdur = rr2(5, 9); HS.Ps.circles++; } }
  if (z.st === 'circle') { const p = z.tgt; if (!p || !p.alive || z.t > z.cdur || (isInside(p.x, p.y) && !isInside(z.x, z.y))) { z.st = p && p.alive ? 'pursue' : 'wander'; z.t = 0; return true; } z.t += dt; z.ang += dt * 0.7; steer(z, p.x + Math.cos(z.ang) * 46, p.y + Math.sin(z.ang) * 34, z.spd * 0.9, dt); faceTo(z, p); return true; }
  // chargers: the last stretch to the wall / gate at a sprint, then a ram
  if (z.chg && (z.st === 'wall' || z.st === 'gate') && z.path) {
    const s = z.st === 'gate' ? HF.gate : HF.walls[z.seg], d = s ? Math.hypot(s.x - z.x, s.y - z.y) : 999;
    if (d < 90 && !z.charging) { z.charging = 1; z.ram = 1; HS.Ps.charges++; hsSound('roar', z.x, z.y, 0.6); }
    if (z.charging) { z.t += dt; if (hsStep(z, dt, z.spd * 2.3)) { z.path = null; z.charging = 0; } if (z.t % 0.3 < dt) HS.fx.push({ k: 'dust', x: z.x, y: z.y, t: 0.5 }); return true; }
  } else if (z.charging && z.st !== 'wall' && z.st !== 'gate') z.charging = 0;
  // breakers look for the weakest section
  if (z.L.sp === 'ankylo' && z.st === 'wander' && HS.R() < dt * 0.02) { const weak = HF.walls.filter(s => !s.gate && s.outT >= 0 && (s.weak || s.hp < s.max * 0.6)); if (weak.length) { hsToWall(z, pickR(weak)); HS.Ps.weakSeek++; } }
  return false;
}
function bubbleZ(z) { z.scared = HS.t; }
function pastFireNear(x, y, r) { for (const f of HF.fires) if (pastFireLit(f) && (f.x - x) ** 2 + (f.y - y) ** 2 < r * r) return f; for (const t of HF.torches) if (t.lit && (t.x - x) ** 2 + (t.y - y) ** 2 < r * r) return t; return null; }
function pastFireLit(f) { const h = HS.hour, night = h < 6.4 || h > 18.2;
  if (f.k === 'beacon') return HS.alarm > 0 || night; if (f.k === 'sacred') return true; if (f.k === 'camp') return night || h > 17; if (f.k === 'pit') return night || h > 16.5 || h < 8 || mealTime(HS.life);
  if (f.k === 'spit') return h > 6 && h < 21; if (f.k === 'hearth') return h > 7 && h < 18.5; return false; }

// ---------------------------------------------------------------- flyers: pteranodons cross the wall, scout, swoop on livestock and on people in the open, flee when hit
function pastFly(z, dt) {
  z.t += dt; const hurt = z.hp <= z.hp0 - 2;
  if (hurt && z.fs !== 'leave') { z.fs = 'leave'; z.t = 0; HS.Ps.flyerDriven++; }
  const fly = (x, y, alt, sp) => { const dx = x - z.x, dy = y - z.y, d = Math.hypot(dx, dy); if (d > 0.5) { const s = Math.min(d, sp * dt); z.x += dx / d * s; z.y += dy / d * s; z.stride += s; z.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); } z.alt += clamp(alt - z.alt, -26 * dt, 20 * dt); return d; };
  switch (z.fs) {
    case 'in': { const g = z.goal || (z.goal = pastFlyGoal(z)); if (fly(g.x, g.y, 50, z.spd) < 20) { z.fs = 'circle'; z.t = 0; z.cdur = rr2(6, 12); HS.Ps.flyerScout++; } return true; }
    case 'circle': { const g = z.goal, a = z.t * 0.9 + z.ph; fly(g.x + Math.cos(a) * 40, g.y + Math.sin(a) * 28, 44 + Math.sin(z.t) * 4, z.spd * 0.7); if (z.t > z.cdur) { z.prey = pastFlyPrey(z); z.fs = z.prey ? 'swoop' : 'leave'; z.t = 0; if (z.prey) hsSound('screech', z.x, z.y, 0.8); } return true; }
    case 'swoop': { const q = z.prey; if (!q || (q.alive === false) || z.t > 9) { z.fs = 'climb'; z.t = 0; return true; } const d = fly(q.x, q.y, 6, z.spd * 1.3);
      if (d < 6 && z.alt < 12) { z.fs = 'climb'; z.t = 0; HS.Ps.swoops++;
        if (q.k) { HS.Ps.raids++; q.t = 99; q.wait = 0.3; HS.fx.push({ k: 'dust', x: q.x, y: q.y, t: 0.5 }); }   // the pen scatters (no harm done)
        else if (q.alive) { HS.Ps.swoopPeople++; bubble(q, 'ex'); if (HS.R() < 0.25) hsHurt(q, z); }
        hsNoise(z.x, z.y, 120, 'swoop'); } return true; }
    case 'climb': { fly(z.x + DIRV[z.dir][0] * 40, z.y + DIRV[z.dir][1] * 40, 48, z.spd); if (z.t > 2.5) { z.fs = HS.R() < 0.4 ? 'circle' : 'leave'; z.t = 0; z.cdur = rr2(4, 8); } return true; }
    case 'leave': { const e = z.exit || (z.exit = pastFlyExit(z)); if (fly(e[0], e[1], 54, z.spd * 1.1) < 10) { z.st = 'dead'; z.corpseT = -9; z.gone = 1; } return true; }
  }
  return true;
}
function pastFlyGoal(z) { const r = HS.R(), P = r < 0.5 ? pickR([HF.coopRun, HF.goatPen, HF.pigPen].filter(Boolean)) : null; if (P) return { x: P.x + P.w / 2, y: P.y + P.d / 2, k: 'pen' }; if (r < 0.8 && HS.plots && HS.plots.length) { const pl = pickR(HS.plots), [x, y] = tileC(pl.work[0]); return { x, y, k: 'field' }; } const [x, y] = d2w(rr2(200, 760), wallV(480) - rr2(30, 90)); return { x, y, k: 'frontier' }; }
function pastFlyPrey(z) {
  let best = null, bd = 90 * 90;
  for (const w of HS.wild) if ((w.k === 'chicken' || w.k === 'goat' || w.k === 'rooster' || w.k === 'pig') && (w.x - z.x) ** 2 + (w.y - z.y) ** 2 < bd) { bd = (w.x - z.x) ** 2 + (w.y - z.y) ** 2; best = w; }
  for (const p of HS.people) { if (!p.alive || !p.vis || p.onTower || p.z > 0) continue; const k = tileOfW(p.x, p.y); if (HF.gk[k] !== GK.FIELD && isInside(p.x, p.y)) continue; const d = (p.x - z.x) ** 2 + (p.y - z.y) ** 2; if (d < bd * 0.8) { bd = d; best = p; } }
  return best;
}
function pastFlyExit(z) { const c = [[20, 20], [HW - 20, 20], [20, HW * 0.45], [HW * 0.45, 20]]; let b = c[0], bd = 1e9; for (const q of c) { const d = (q[0] - z.x) ** 2 + (q[1] - z.y) ** 2; if (d < bd) { bd = d; b = q; } } return b; }

// ---------------------------------------------------------------- herbivores: stegosaurs and the occasional giant browse far out in the wilds (never flee, never hunt)
function pastHerb(w, dt) {
  if (!w.path) { if (w.t < (w.k === 'brachio' ? 9 : 6)) return; w.t = 0; for (let n = 0; n < 12; n++) { const x = w.x + rr2(-70, 70), y = w.y + rr2(-70, 70), k = tileOfW(x, y); if (inMap(Math.floor(x / HT), Math.floor(y / HT)) && hfPass(k, 'out') && hsFarFromWall(k, w.k === 'brachio' ? 30 : 20)) { w.path = { direct: 1, gx: x, gy: y, mask: 'out' }; break; } } w.graze = !w.path; return; }
  w.graze = 0; if (hsStep(w, dt, w.spd)) w.path = null;
}

// ---------------------------------------------------------------- setup + per-tick life of the tribe: torches, beacons, sacred fire, the evening dance, flyers, the apex
function pastPre() {
  HS.Ps = { spawned: {}, packs: 0, rams: 0, charges: 0, circles: 0, roars: 0, trapHits: 0, fireScare: 0, weakSeek: 0, wallDmg: {}, swoops: 0, raids: 0, swoopPeople: 0, flyerScout: 0, flyerDriven: 0, flyers: 0, apex: 0,
    arrows: 0, fireArrows: 0, lit: 0, autoLit: 0, out: 0, dance: 0, drum: 0, tend: 0, beaconT: 0, keeperRounds: 0, gateRams: 0 };
}
function pastInit() {
  const el = HS.people.filter(p => p.role === 'elder'); HS.keeper = el.find(p => p.tier !== 0) || el[0] || null; if (HS.keeper) HS.keeper.fireKeeper = 1;
  for (let i = 0; i < 3; i++) { const [x, y] = hsWildPoint(); if (hsFarFromWall(tileOfW(x, y), 20)) hsAddWild('stego', x, y, { big: 1, spd: 2.2 }); }
  for (let i = 0; i < 2; i++) for (let n = 0; n < 40; n++) { const [x, y] = hsWildPoint(); if (hsFarFromWall(tileOfW(x, y), 34)) { hsAddWild('brachio', x, y, { big: 1, spd: 1.6 }); break; } }
  const h = HS.hour; for (const t of HF.torches) t.lit = h > 19.2 || h < 6.2 ? 1 : 0;
  HS.nextP = { fly: HS.t + rr2(40, 90), apex: HS.t + rr2(240, 420), dance: 0, tend: HS.t + rr2(30, 90), torch: 0, drum: 0 };
}
const pastFree = p => p.alive && p.vis && !p.exp && !p.rescue && !p.ride && !p.onTower && !p.arriving && p.st !== 'down' && !p.inj && (!p.task || p.task.k === 'sit' || p.task.k === 'chat' || p.task.k === 'walk' || (p.task.k === 'life' && p.task.a === 'stand' && !p.task.story));
function pastTick(dt) {
  const h = HS.hour, N = HS.nextP, P = HS.Ps, dark = h < 6.4 || h > 18.2;
  if (HS.alarm > 0 || dark) P.beaconT += dt;
  // dusk: the fire-keeper walks the torch round (the nearest unlit torch next); a late round lights itself
  if (h > 18 && h < 21.5 && HS.t > N.torch) { N.torch = HS.t + 6;
    const unlit = HF.torches.filter(t => !t.lit && !t.claimed);
    if (unlit.length) { const k = HS.keeper && HS.keeper.alive && pastFree(HS.keeper) ? HS.keeper : HS.people.find(p => (p.role === 'elder' || p.role === 'adult') && pastFree(p) && p.tier !== 0);
      if (k) { const legs = []; let cx = k.x, cy = k.y; const left = unlit.slice();
        while (legs.length < 6 && left.length) { let bi = 0, bd = 1e9; left.forEach((t, i) => { const d = (t.sx - cx) ** 2 + (t.sy - cy) ** 2; if (d < bd) { bd = d; bi = i; } }); const t = left.splice(bi, 1)[0]; t.claimed = 1; cx = t.sx; cy = t.sy;
          legs.push({ x: t.sx, y: t.sy, dur: 2.2, anim: 'raise', tool: 'torch', face: { x: t.x, y: t.y }, out: () => { t.lit = 1; t.claimed = 0; P.lit++; HS.fx.push({ k: 'spark', x: t.x, y: t.y, t: 0.35 }); } }); }
        setTask(k, Object.assign(lfChain('chain', legs), { torchRound: 1 })); P.keeperRounds++; } } }
  if (h > 20.6 && h < 21) for (const t of HF.torches) if (!t.lit) { t.lit = 1; t.claimed = 0; P.autoLit++; }
  if (h > 6.3 && h < 8.5) for (const t of HF.torches) if (t.lit && HS.R() < dt * 0.02) { t.lit = 0; P.out++; }
  if (h > 8.5 && h < 9) for (const t of HF.torches) if (t.lit) { t.lit = 0; t.claimed = 0; }
  // the evening fire dance around the sacred fire, a drummer beside it
  if (h > 18.8 && h < 20.8 && HS.alarm <= 0 && HS.weather !== 'rain' && HF.ring.length && HS.t > N.dance) { N.dance = HS.t + rr2(8, 16);
    const dancers = HS.people.filter(p => p.task && p.task.dance).length;
    if (dancers < 8) { const used = new Set(HS.people.filter(p => p.task && p.task.dance).map(p => p.task.ring)); const free = HF.ring.map((s, i) => i).filter(i => !used.has(i));
      const q = HS.people.find(p => p.role !== 'guard' && p.tier !== 0 && pastFree(p) && Math.hypot(p.x - HF.sacred.x, p.y - HF.sacred.y) < 380);
      if (q && free.length) { const i = pickR(free), s = HF.ring[i]; setTask(q, Object.assign(lfChain('chain', [{ x: s.x, y: s.y, dur: rr2(25, 45), anim: q.role === 'kid' || HS.R() < 0.6 ? 'jump' : 'raise', tool: '', face: HF.sacred, out: () => { P.dance++; bubble(q, 'note'); } }]), { dance: 1, ring: i })); } }
    if (!HS.people.some(p => p.task && p.task.drum) && HF.drumAt) { const d = HS.people.find(p => p.role === 'elder' && pastFree(p)); if (d) setTask(d, Object.assign(lfChain('chain', [{ x: HF.drumAt.x, y: HF.drumAt.y, dur: rr2(40, 70), anim: 'hammer', tool: '', face: HF.sacred, snd: 'drum', out: () => { P.drum++; } }]), { drum: 1 })); } }
  // by day an elder kneels at the sacred fire and feeds it
  if (h > 8 && h < 17.5 && HS.t > N.tend && HF.sacred) { N.tend = HS.t + rr2(70, 140); const e = HS.people.find(p => p.role === 'elder' && pastFree(p)); if (e) { const s = HF.ring[0] || HF.sacred; setTask(e, lfChain('chain', [{ x: s.x, y: s.y, dur: rr2(12, 20), anim: 'kneel', tool: 'plank', face: HF.sacred, fx: 'spark', fxr: 1.2, out: () => { P.tend++; } }])); } }
  // pteranodons come over every minute or two in daylight (never more than three at once)
  if (HS.t > N.fly) { N.fly = HS.t + rr2(55, 120) * DANGER[HS.danger].iv; if (h > 6.5 && h < 19.5 && HS.zombies.filter(z => z.fly && z.st !== 'dead').length < 3) { const s = pastFlySpawn(); if (s) { pastAddDino(s[0], s[1], { sp: 'ptero' }); P.flyers++; } } }
  // the apex: a tyrant walks the frontier now and then; sometimes it goes for the palisade
  if (HS.t > N.apex) { N.apex = HS.t + rr2(420, 700) * DANGER[HS.danger].iv; if (!HS.zombies.some(z => z.st !== 'dead' && z.L.sp === 'trex')) { const z = pastBandSpawn('trex'); if (z) { P.apex++; hsLog('trex', {}, true); if (HS.R() < 0.45) z.toWallAt = HS.t + rr2(30, 90); } } }
  for (const z of HS.zombies) if (z.toWallAt && HS.t > z.toWallAt && z.st !== 'dead') { z.toWallAt = 0; hsToWall(z, hsTowerSeg()); }
}
function pastFlySpawn() { for (let n = 0; n < 20; n++) { const e = pickR([[rr2(60, HW - 60), 12], [12, rr2(60, HW * 0.5)], [rr2(60, HW * 0.5), 12]]); if (!hsInView(e[0], e[1], 40)) return e; } return null; }
function pastBandSpawn(sp) { for (let n = 0; n < 40; n++) { const u = rr2(200, 760), v = wallV(u) - rr2(90, 150), [x, y] = d2w(u, v), k = tileOfW(x, y); if (!hfPass(k, 'out') || hsInView(x, y)) continue; const z = pastAddDino(x, y, { sp, noPack: 1 }); z.band = 1; return z; } return null; }
// arrows instead of bullets: a quieter shot (smaller noise), a visible arrow (a fire arrow at night), hunters on expeditions throw spears
function pastShoot(a, z, from, range) {
  const d = Math.hypot(z.x - a.x, z.y - a.y); if (d > range) return false;
  const night = hsDark(), big = DSTAT[z.L.sp] && DSTAT[z.L.sp].hp >= 10, base = from.z > 30 ? 0.62 : 0.58, p = clamp(base - d / 900 - (night ? 0.1 : 0) - (HS.weather === 'rain' ? 0.08 : 0) + (big ? 0.1 : 0) - (z.fly ? 0.3 : 0), 0.08, 0.92), hit = HS.R() < p;
  HS.stats.shots++; HS.Ps.arrows++; if (night && from.z > 30) HS.Ps.fireArrows++; hsNoise(a.x, a.y, 110, 'shot'); hsSound('shot', a.x, a.y, from.z ? 0.9 : 0.7);
  const tx = hit ? z.x : z.x + rr2(-7, 7), ty = hit ? z.y : z.y + rr2(-7, 7), tz = z.fly ? z.alt : hit ? 10 : 0, spear = !from.z || from.z < 20;
  HS.fx.push({ k: 'arrow', x0: from.x, y0: from.y, z0: from.z || 12, x1: tx, y1: ty, z1: tz, t: 0.32, T: 0.32, fire: night && !spear ? 1 : 0, spear: spear && a.exp ? 1 : 0 });
  if (hit) hsHitZ(z, a, HS.R() < 0.14 ? 6 : 1 + (night && !spear ? 1 : 0)); else HS.fx.push({ k: 'dust', x: tx, y: ty, t: 0.4 });
  return true;
}
