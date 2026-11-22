'use strict';
// ===== Tây Du Ký v2 — Thông Thiên Hà: residents, activities, mini events and the signature story (DOM-free; loaded after tw-sim.js and tw-lion-data.js) =====
// Visible state lives in TWS.river (read by tw-river-fx.js): surge 0..1 (wave height / spray / roar of the river), storm 0..1 (dark sky, rain, lightning), glow 0..1 (the divine golden light of the
// turtle), turtle (the divine turtle: position, phase, riders), rings (ripples / shockwaves), drifts (a loose boat, floating lanterns), leaps (a giant carp), flocks (cranes), peeks (river imps).
// Signature - "Rùa Thần Qua Sông" (The Divine Turtle Ferries the Pilgrims): the five pilgrims (Tam Tạng, Ngộ Không, Bát Giới, Sa Tăng and the white dragon horse) reach the west pier; the river is
// far too wide and violent to cross (Wukong tries, the surge throws him back); a vast golden turtle rises out of the whirlpool, the five climb onto its shell and it swims them across the
// raging water to the far pier; the turtle then swims away down the river to the edge of the world, dives and is gone; the river calms and lanterns drift (recovery).
(function () {
  const S = TWS, H = S.H, D = window.TW_DATA, B = 'tth', F = TWM.river, T = 8;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = (v, t, r, dt) => Math.abs(t - v) <= r * dt ? t : v + Math.sign(t - v) * r * dt;
  const TW = (a, b) => [(F.x0 + a + 0.5) * T, (F.y0 + b + 0.5) * T];      // local tile (may be fractional) -> world units
  const newState = () => ({ surge: 0.25, surgeT: 0.25, surgeRate: 0.1, storm: 0, stormT: 0, stormRate: 0.1, wind: 1, windT: 1, glow: 0, glowT: 0, turtle: null, rings: [], drifts: [], lanterns: [], leaps: [], flocks: [], peeks: [], flash: 0, flashClock: 5, bursts: [], sparks: [] });
  const baseInit = S.init, baseTick = S.tick;
  S.init = function (seed) { S.river = newState(); baseInit(seed); };
  S.tick = function (dt) {
    baseTick(dt); const f = S.river; if (!f) return;
    f.surge = ease(f.surge, f.surgeT, f.surgeRate, dt); f.storm = ease(f.storm, f.stormT, f.stormRate, dt); f.glow = ease(f.glow, f.glowT, 0.35, dt); f.flash = Math.max(0, f.flash - dt * 2.4);
    for (const r of f.rings) r.t += dt; f.rings = f.rings.filter(r => r.t < r.life);
    for (const d of f.drifts) { d.t += dt; if (!d.held) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy = Math.min(d.vmax || 9, d.vy + dt * 0.9); d.rot = (d.rot || 0) + (d.spin || 0) * dt; } } f.drifts = f.drifts.filter(d => d.t < d.life && d.y < (F.y0 + 39) * T);
    for (const l of f.lanterns) { l.t += dt; l.x += l.vx * dt + Math.sin(l.t * 0.8 + l.ph) * 0.5 * dt; l.y += l.vy * dt; } f.lanterns = f.lanterns.filter(l => l.t < l.life && l.y < (F.y0 + 38.4) * T);
    for (const l of f.leaps) l.t += dt; f.leaps = f.leaps.filter(l => l.t < l.life); for (const q of f.flocks) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; } f.flocks = f.flocks.filter(q => q.t < q.life);
    for (const p of f.peeks) p.t += dt; f.peeks = f.peeks.filter(p => p.t < p.life); for (const b of f.bursts) b.t += dt; f.bursts = f.bursts.filter(b => b.t < 1.4); for (const s of f.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; } f.sparks = f.sparks.filter(s => s.t < s.life);
    f.flashClock -= dt; if (f.storm > 0.4 && f.flashClock <= 0) { f.flash = 1; f.flashClock = 1.3 + S.R() * 3.4 / (0.4 + f.storm); }
    f.windT = f.stormT > 0.3 ? 2.2 : 1 + 0.4 * Math.sin(S.t * 0.06) + (Math.sin(S.t * 0.29) > 0.9 ? 0.7 : 0);
    f.wind = ease(f.wind, f.windT, 0.5, dt);
    tickTurtle(f, dt);
    for (const a of S.agents) if (a.rideSlot) { a.inWater = false; if (!a.moving && a.pose === 'idle') a.frame = 'idle' + (Math.floor((S.t + a.phase) / 0.7) % 2); }   // riders never wade
  };
  const ring = (x, y, kind, life) => S.river.rings.push({ x, y, t: 0, kind: kind || 'ripple', life: life || 2.2 });

  // ---------------------------------------------------------------- the divine turtle
  // phases: 'rise' (breaches the whirlpool) -> 'idle' (floats, waiting) -> 'carry' (swims a route) -> 'wait' (alongside the far pier) -> 'carry' (departs) -> 'dive' -> gone
  const SLOTS = { monk: [6, 10, 19], wukong: [42, 4, 17], bajie: [-32, 8, 18], sha: [-6, -10, 18], horse: [-54, 16, 15] };   // screen offsets from the turtle's waterline centre (px) and lift (z)
  const slotXY = (tu, name) => { const [sx0, sy, lz] = SLOTS[name], sx = tu.face > 0 ? sx0 : -sx0; return [tu.x + sx / 8 + sy / 4, tu.y + sy / 4 - sx / 8, lz]; };   // screen offset (px, mirrored when the turtle faces left) -> world position
  function tickTurtle(f, dt) {
    const tu = f.turtle; if (!tu) return; tu.t += dt; tu.bob = Math.sin(S.t * 1.7) * 1.2;
    if (tu.phase === 'rise') { tu.rise = Math.min(1, tu.t / 4.2); tu.alpha = Math.min(1, tu.t / 1.6); if (tu.rise >= 1) tu.phase = 'idle'; if (Math.floor(tu.t * 3) !== Math.floor((tu.t - dt) * 3)) ring(tu.x + (S.R() - 0.5) * 30, tu.y + (S.R() - 0.5) * 20, 'ripple', 2.6); }
    else if (tu.phase === 'carry' && tu.route) {
      const [tx, ty] = tu.route[0], dx = tx - tu.x, dy = ty - tu.y, d = Math.hypot(dx, dy), sp = (tu.speed || 12) * dt; if (d > 0.01) { const sx = dx - dy; if (Math.abs(sx) > 0.6) tu.face = sx > 0 ? 1 : -1; tu.hx = dx / (d || 1); tu.hy = dy / (d || 1); }
      if (d <= sp) { tu.x = tx; tu.y = ty; tu.route.shift(); if (!tu.route.length) { tu.route = null; tu.phase = tu.after || 'idle'; tu.t = 0; } } else { tu.x += dx / d * sp; tu.y += dy / d * sp; }
      tu.prog += sp; if (Math.floor(S.t * 5) !== Math.floor((S.t - dt) * 5)) ring(tu.x - (tu.hx || 0) * 14 + (S.R() - 0.5) * 8, tu.y - (tu.hy || 0) * 14 + (S.R() - 0.5) * 6, 'wake', 1.8);
    } else if (tu.phase === 'dive') { tu.sub = Math.min(1, tu.t / 3.2); tu.alpha = 1 - Math.max(0, (tu.t - 2.2) / 1.2); if (Math.floor(tu.t * 4) !== Math.floor((tu.t - dt) * 4)) { ring(tu.x + (S.R() - 0.5) * 36, tu.y + (S.R() - 0.5) * 22, 'ripple', 2.6); for (let q = 0; q < 3; q++) f.sparks.push({ x: tu.x + (S.R() - 0.5) * 30, y: tu.y + (S.R() - 0.5) * 20, vx: (S.R() - 0.5) * 8, vy: -S.R() * 6, t: 0, life: 2.4, z: 6 + S.R() * 20 }); } if (tu.t > 3.4) { f.turtle = null; f.glowT = 0; } }
    // riders follow the shell
    if (tu && tu.riders) for (const a of tu.riders) { if (!a.rideSlot) continue; const p = slotXY(tu, a.rideSlot); a.x = p[0]; a.y = p[1]; a.lift = p[2] + (tu.bob || 0) * 0.3 + Math.sin(S.t * 2.2 + a.phase) * 0.35; a.key = tu.x + tu.y + 0.6 + SLOTKEY[a.rideSlot]; a.dir = tu.face > 0 ? 'right' : 'left'; a.pose = 'idle'; a.moving = false; a.gz = 0; }
  }
  const SLOTKEY = { monk: 0.3, wukong: 0.5, bajie: 0.2, sha: 0.0, horse: 0.1 };

  // ---------------------------------------------------------------- extension steps / points
  const X = S.stepExt, P = S.pointExt;
  X.tthcall = (a, st) => { st.fn(a); return true; };
  X.tthride = (a, st) => { const tu = S.river.turtle; if (!tu || (tu.phase !== 'carry' && tu.phase !== 'wait' && tu.phase !== 'idle' && tu.phase !== 'dive') || a.rideSlot !== st.slot) { a.rideSlot = null; return true; } if (st.stop && st.stop()) { return true; } return false; };
  X.tthfade = (a, st, dt) => { st.el = (st.el || 0) + dt; a.alpha = Math.max(0, 1 - st.el / 1.4); if (st.el >= 1.4) { a.gone = true; return true; } return false; };
  P.tth_gate_w = () => TW(-4.5, 29.5);
  P.tth_pier = () => TW(16.5, 28.5);
  P.tth_pierend = () => TW(18.6, 28.5);
  P.tth_landing = () => TW(31.5, 28.5);
  P.tth_eastexit = () => TW(39, 14.5);
  P.tth_whirl = () => TW(F.whirl[0] - F.x0, F.whirl[1] - F.y0);

  // ---------------------------------------------------------------- activities (a post is chosen by bank; nobody tries to cross the river)
  const A = S.ACT, pois = k => H.pois(B, k);
  const post = (kind, a, dir, t, extra) => { const p = H.poiFree(B, kind); if (!p) return A.stroll(a); H.claim(a, p); return [H.go(p.x, p.y), { k: 'face', dir: p.face || dir || 'up' }].concat(extra || [{ k: 'idle', t: t || H.rnd(8, 16) }, { k: 'act', t: 1.4 }, { k: 'idle', t: H.rnd(3, 7) }]).concat([{ k: 'release', poi: p }]); };
  for (const bk of ['w', 'e']) {
    A['tth_fish_' + bk] = a => { H.count('fish'); return post('tdock_' + bk, a, 'right', 0, [{ k: 'sit', t: H.rnd(10, 22) }, { k: 'act', t: 1.6 }, { k: 'bubble', kind: S.R() < 0.4 ? 'star' : 'dots' }, { k: 'sit', t: H.rnd(5, 10) }, { k: 'carry', what: S.R() < 0.4 ? 'fish' : null }, { k: 'idle', t: 1 }, { k: 'carry', what: null }]); };
    A['tth_net_' + bk] = a => { H.count('net'); return post('tnet_' + bk, a, 'up', 0, [{ k: 'act', t: H.rnd(5, 9) }, { k: 'idle', t: 1.2 }, { k: 'act', t: H.rnd(3, 6) }, { k: 'bubble', kind: 'note' }]); };
    A['tth_cook_' + bk] = a => { H.count('cook'); return post('tcook_' + bk, a, 'up', 0, [{ k: 'sit', t: H.rnd(10, 18) }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: H.rnd(3, 6) }]); };
    A['tth_look_' + bk] = a => { H.count('look'); return post('tlook_' + bk, a, 'right', 0, [{ k: 'idle', t: H.rnd(8, 14) }, { k: 'bubble', kind: 'q' }, { k: 'idle', t: H.rnd(3, 6) }]); };
    A['tth_rim_' + bk] = a => { H.count('rim'); return post('trim_' + bk, a, 'right', 0, [{ k: 'idle', t: H.rnd(7, 12) }, { k: 'bubble', kind: 'excl' }, { k: 'idle', t: H.rnd(3, 6) }]); };
    A['tth_gossip_' + bk] = a => { H.count('gossip'); return post('tgossip_' + bk, a, 'up', 0, [{ k: 'idle', t: H.rnd(5, 9) }, { k: 'bubble', kind: 'note' }, { k: 'idle', t: 3 }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: H.rnd(2, 5) }]); };
    A['tth_moor_' + bk] = a => { H.count('moor'); return post('tmoor_' + bk, a, 'right', 0, [{ k: 'act', t: 2.4 }, { k: 'idle', t: 1.5 }, { k: 'act', t: 2 }, { k: 'bubble', kind: 'note' }]); };
    A['tth_haul_' + bk] = a => { const n = H.poiFree(B, 'tnet_' + bk), c = H.poiFree(B, 'tcook_' + bk); if (!n || !c) return A.stroll(a); H.claim(a, n); H.claim(a, c); H.count('haul'); return [H.go(n.x, n.y), { k: 'face', dir: 'up' }, { k: 'act', t: 2 }, { k: 'carry', what: 'fish' }, { k: 'release', poi: n }, H.go(c.x, c.y), { k: 'face', dir: 'up' }, { k: 'act', t: 1.6 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }, { k: 'release', poi: c }]; };
    A['tth_patrol_' + bk] = a => { const kinds = ['tdock_' + bk, 'tlook_' + bk, 'trim_' + bk, 'tgossip_' + bk, 'tmoor_' + bk], steps = [], pk = k => { const l = pois(k); return l.length ? l[Math.floor(S.R() * l.length)] : null; }; H.count('patrol'); for (let n = 0; n < 3; n++) { const p = pk(kinds[Math.floor(S.R() * kinds.length)]); if (p) steps.push(H.go(p.x, p.y), { k: 'face', dir: p.face || 'right' }, { k: 'idle', t: H.rnd(2, 4) }); } return steps.length ? steps : A.stroll(a); };
  }
  A.tth_mourn = a => { const p = H.poiFree(B, 'tpierend_w'); if (!p) return A.stroll(a); H.claim(a, p); H.count('mourn'); return [H.go(p.x, p.y), { k: 'face', dir: 'right' }, { k: 'idle', t: H.rnd(10, 18) }, { k: 'bubble', kind: 'dots' }, { k: 'sit', t: H.rnd(8, 14) }, { k: 'act', t: 1.6 }, { k: 'release', poi: p }]; };
  A.tth_tower = a => { const p = H.poiFree(B, 'ttower_w'); if (!p) return A.stroll(a); H.claim(a, p); H.count('tower'); return [H.go(p.x, p.y), { k: 'face', dir: 'down' }, { k: 'idle', t: H.rnd(8, 14) }, { k: 'act', t: 1.4 }, { k: 'idle', t: H.rnd(4, 8) }, { k: 'release', poi: p }]; };
  A.tth_creek = a => { const p = H.poiFree(B, 'tcreek_w'); if (!p) return A.stroll(a); H.claim(a, p); H.count('creek'); return [H.go(p.x, p.y), { k: 'face', dir: 'down' }, { k: 'act', t: 3 }, { k: 'idle', t: 1.5 }, { k: 'act', t: 3 }, { k: 'bubble', kind: 'note' }, { k: 'release', poi: p }]; };
  A.tth_wreck = a => { const p = H.poiFree(B, 'twreck_w'); if (!p) return A.stroll(a); H.claim(a, p); H.count('wreck'); return [H.go(p.x, p.y), { k: 'face', dir: 'right' }, { k: 'act', t: 3 }, { k: 'idle', t: 2 }, { k: 'bubble', kind: 'dots' }, { k: 'act', t: 3 }, { k: 'release', poi: p }]; };

  // ---------------------------------------------------------------- mini events
  const M = S.MINI, by = (role) => S.agents.find(a => a.biome === B && a.role === role && !a.gone && !a.hidden && H.free(a));
  const some = (roles, n) => S.agents.filter(a => a.biome === B && roles.includes(a.role) && !a.gone && !a.hidden && H.free(a)).slice(0, n);
  const lookAt = (xy, who) => { for (const a of who) H.assign(a, [{ k: 'face', x: xy[0], y: xy[1] }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }, { k: 'idle', t: 2.4 }, { k: 'bubble', kind: 'star' }], 'mini'); };
  M.tth_cast = b => { const w = some(['fisher_w', 'fisher_e'], 2); if (!w.length) return false; for (const a of w) { const bk = a.role === 'fisher_e' ? 'e' : 'w', p = pois('tdock_' + bk)[0]; if (!p) continue; H.assign(a, [H.go(p.x, p.y), { k: 'face', dir: bk === 'w' ? 'right' : 'left' }, { k: 'act', t: 1.6 }, { k: 'tthcall', fn: q => { ring(q.x + (bk === 'w' ? 18 : -18), q.y, 'ripple', 2.2); } }, { k: 'idle', t: 2.4 }, { k: 'act', t: 2.2 }, { k: 'bubble', kind: 'star' }, { k: 'carry', what: 'fish' }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 2 }, { k: 'carry', what: null }], 'mini'); } H.count('cast'); return true; };
  M.tth_boat_loose = b => {   // a moored boat slips its rope and the current drags it to the cataract; fishermen run after it
    const f = S.river, bt = F.boats[0], x = (F.x0 + bt[0]) * T, y = (F.y0 + bt[1]) * T; if (f.drifts.some(d => d.kind === 'boat')) return false;
    f.drifts.push({ kind: 'boat', x, y, vx: 1.6, vy: 3.2, vmax: 11, t: 0, life: 70, rot: 0, spin: 0.05, v: 0, boat: 0 });
    const fs = some(['fisher_w', 'ferryman'], 3), rim = pois('trim_w')[0]; for (const a of fs) H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.8 }].concat(rim ? [H.go(rim.x, rim.y, { run: 1.7 }), { k: 'face', dir: 'right' }, { k: 'idle', t: 4 }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.8 }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: 3 }] : [{ k: 'idle', t: 3 }]), 'mini'); H.count('boat_loose'); return true; };
  M.tth_lanterns = b => {   // villagers set river lanterns afloat from both piers; they drift down the great river toward the edge of the world
    const f = S.river; const mk = (a, b0, n, dir) => { for (let q = 0; q < n; q++) { const [x, y] = TW(a + (S.R() - 0.5) * 1.5, b0 + (S.R() - 0.5) * 2.2); f.lanterns.push({ x, y, vx: dir * 0.5 + (S.R() - 0.5) * 0.8, vy: 2.2 + S.R() * 1.6, t: -q * 0.9, life: 58, ph: S.R() * 6, col: Math.floor(S.R() * 3) }); } };
    mk(19.5, 28.5, 6, 1); mk(30, 28.5, 5, -1); mk(18, 34, 3, 1);
    const w = some(['fisher_w', 'ferryman'], 2), e = some(['fisher_e'], 2); for (const a of w.concat(e)) { const p = pois('tdock_' + (a.role === 'fisher_e' ? 'e' : 'w'))[0]; if (p) H.assign(a, [H.go(p.x, p.y), { k: 'face', dir: a.role === 'fisher_e' ? 'left' : 'right' }, { k: 'act', t: 1.4 }, { k: 'idle', t: 2 }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 5 }], 'mini'); } H.count('lanterns'); return true; };
  M.tth_leap = b => {   // a giant golden carp leaps clear of the water; everyone on the nearest bank looks
    const f = S.river, a0 = 17 + S.R() * 11, b0 = 14 + S.R() * 18, [x, y] = TW(a0, b0); f.leaps.push({ x, y, t: 0, life: 2.6, dir: S.R() < 0.5 ? 1 : -1 }); setTimeoutish(1.3, () => { ring(x, y, 'splash', 2.4); });
    const near = S.agents.filter(a => a.biome === B && !a.gone && !a.hidden && H.free(a) && Math.hypot(a.x - x, a.y - y) < 150).slice(0, 4); lookAt([x, y], near); H.count('leap'); return true; };
  M.tth_cranes = b => { const f = S.river, [x, y] = TW(46, 4); for (let q = 0; q < 6; q++) f.flocks.push({ kind: 'crane', x: x + q * 9, y: y + q * 7, vx: -9.5, vy: 6.8, t: -q * 0.35, life: 30, ph: q * 1.3 }); const l = some(['fisher_w', 'fisher_e', 'imp_w', 'imp_e'], 3); const sp = TW(24, 14); lookAt(sp, l); H.count('cranes'); return true; };
  M.tth_surge = b => { const f = S.river; if (f.surgeT > 0.5) return false; f.surgeT = 0.95; f.surgeRate = 0.4; setTimeoutish(16, () => { f.surgeT = 0.25; f.surgeRate = 0.08; }); for (const a of some(['fisher_w', 'fisher_e', 'ferryman'], 5)) { const p = pois('tgossip_' + (a.role === 'fisher_e' ? 'e' : 'w'))[0]; H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }].concat(p ? [H.go(p.x, p.y, { run: 1.6 }), { k: 'idle', t: 8 }, { k: 'bubble', kind: 'dots' }] : [{ k: 'idle', t: 4 }]), 'mini'); } H.count('surge'); return true; };
  M.tth_imp_peek = b => {   // a river imp's head surfaces beside the pier, glares, and ducks under again
    const f = S.river, bk = S.R() < 0.5 ? 'w' : 'e', p = pois('tdock_' + bk)[0]; if (!p) return false; const x = p.x + (bk === 'w' ? 26 : -26), y = p.y + (S.R() - 0.5) * 10; f.peeks.push({ x, y, t: 0, life: 5.5 }); ring(x, y, 'ripple', 2.6);
    const fs = some(['fisher_' + bk], 2); for (const a of fs) H.assign(a, [{ k: 'face', x, y }, { k: 'idle', t: 1.8 }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.8 }, { k: 'hop', t: 0.8 }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: 2 }], 'mini'); H.count('imp_peek'); return true; };
  const timers = []; function setTimeoutish(sec, fn) { timers.push({ at: S.t + sec, fn }); }
  const tick0 = S.tick; S.tick = function (dt) { tick0(dt); for (let i = timers.length - 1; i >= 0; i--) if (S.t >= timers[i].at) { const t = timers.splice(i, 1)[0]; t.fn(); } };

  // ---------------------------------------------------------------- story ops (the divine turtle ferries the pilgrims)
  const O = S.opExt, pend = (R, f) => { R.pend = f; };
  const act = (R, n) => R.actors[n];
  const PARTY = [['monk', 'tam_tang', 'monk'], ['wk', 'wukong', 'wukong'], ['bj', 'bajie', 'bajie'], ['sha', 'sa_tang', 'sha'], ['horse', 'bach_long_ma', 'horse']];   // [actor id, character, ride slot]
  O.tth = (R, o) => { const f = S.river; if (o.surge !== undefined) { f.surgeT = o.surge; f.surgeRate = o.rate || 0.2; } if (o.storm !== undefined) { f.stormT = o.storm; f.stormRate = o.srate || 0.12; } if (o.glow !== undefined) f.glowT = o.glow; if (o.wind !== undefined) f.windT = o.wind; };
  O.tth_party_walk = (R, o) => {   // the pilgrims walk from Sư Đà Lĩnh's road to the west pier and line up at its end
    const pe = P.tth_pierend(), spots = [[-4, 0.9], [-3, -0.9], [-2, 0.9], [-1, -0.9], [-5.2, 0]];   // tiles behind the pier end
    PARTY.forEach(([id], n) => { const a = act(R, id); if (!a) return; a.story = R; const x = pe[0] + spots[n][0] * T, y = pe[1] + spots[n][1] * T * 0.6, p = H.nearestWalk(x, y, B, 3) || [x, y]; H.assign(a, [{ k: 'wait', t: n * 0.6 }, H.go(p[0], p[1], { run: 1.1 }), { k: 'face', dir: 'right' }, { k: 'idle', t: 600 }], 'story'); });
    const t0 = S.t; pend(R, () => S.t - t0 > 40 || PARTY.every(([id]) => { const a = act(R, id); return !a || (a.cur && a.cur.k === 'idle'); })); };
  O.tth_try = (R, o) => {   // Wukong tries the water; the surge throws everyone back
    const wk = act(R, 'wk'), f = S.river, pe = P.tth_pierend(); if (!wk) return; const p = H.nearestWalk(pe[0] - 4, pe[1], B, 3) || pe;
    H.assign(wk, [H.go(p[0], p[1], { run: 1.5 }), { k: 'face', dir: 'right' }, { k: 'act', t: 1.2 }, { k: 'hop', t: 0.9 }, { k: 'bubble', kind: 'excl' }, { k: 'tthcall', fn: q => { f.surgeT = 1; f.surgeRate = 0.8; ring(q.x + 24, q.y, 'splash', 2.6); f.bursts.push({ x: q.x + 24, y: q.y, t: 0 }); } }, { k: 'hop', t: 0.8 }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: 600 }], 'story');
    for (const [id] of PARTY) { const a = act(R, id); if (a && a !== wk) H.assign(a, [{ k: 'bubble', kind: id === 'monk' ? 'q' : id === 'bj' ? 'excl' : 'dots' }, { k: 'idle', t: 3 }, { k: 'tthcall', fn: q => { q.dir = 'left'; } }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 600 }], 'story'); }
    const t0 = S.t; pend(R, () => S.t - t0 > 9); };
  O.tth_rise = (R, o) => {   // the turtle breaches the whirlpool in a column of golden light
    const f = S.river, [x, y] = P.tth_whirl(); f.turtle = { x, y: y + 2, face: 1, phase: 'rise', t: 0, rise: 0, alpha: 0, bob: 0, riders: [], prog: 0, speed: 12, hx: 1, hy: 0, sub: 0 }; f.glowT = 1; f.surgeT = 0.8; ring(x, y, 'burst', 3.4); f.bursts.push({ x, y, t: 0 });
    pend(R, () => !f.turtle || f.turtle.phase === 'idle'); };
  O.tth_react = (R, o) => { for (const a of S.agents) if (a.biome === B && !a.gone && !a.hidden && H.free(a)) { const bk = a.role.slice(-2) === '_e' ? 'e' : 'w'; if (o.bank && o.bank !== bk && a.role !== 'ferryman') continue; H.assign(a, [{ k: 'face', x: P.tth_whirl()[0], y: P.tth_whirl()[1] }, { k: 'bubble', kind: o.kind || 'excl' }, { k: 'hop', t: 1 }, { k: 'idle', t: 4 }, { k: 'bubble', kind: o.kind2 || 'star' }], 'mini'); }
    for (const [id] of PARTY) { const a = act(R, id); if (a) H.assign(a, [{ k: 'face', x: P.tth_whirl()[0], y: P.tth_whirl()[1] }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.9 }, { k: 'bubble', kind: 'star' }, { k: 'idle', t: 600 }], 'story'); } R.wait = o.t || 2.4; };
  O.tth_approach = (R, o) => {   // the turtle swims to the end of the west pier and waits alongside
    const f = S.river, tu = f.turtle; if (!tu) return; const [x, y] = TW(22.4, 28.9); tu.route = [[x, y]]; tu.phase = 'carry'; tu.after = 'idle'; tu.speed = 9; pend(R, () => !f.turtle || f.turtle.phase === 'idle'); };
  O.tth_board = (R, o) => {   // the five hop onto the shell one after another
    const f = S.river, tu = f.turtle; if (!tu) return; let n = 0;
    for (const [id, , slot] of PARTY) { const a = act(R, id); if (!a) continue; const k = n++; a.story = R; const sp = slotXY(tu, slot);
      H.assign(a, [{ k: 'wait', t: 0.2 + k * 0.7 }, { k: 'bubble', kind: id === 'horse' ? 'dots' : 'excl' }, { k: 'face', x: sp[0], y: sp[1] }, { k: 'tthcall', fn: q => { q.flying = true; } }, { k: 'arc', x: sp[0], y: sp[1], t: 1.5, lift: 10, spin: 0 }, { k: 'tthcall', fn: q => { q.flying = false; q.lift = sp[2]; q.rideSlot = slot; tu.riders.push(q); ring(sp[0], sp[1], 'splash', 1.4); } }, { k: 'tthride', slot, stop: () => !f.turtle || f.turtle.phase === 'dive' || (f.turtle.phase === 'wait' && f.turtle.unload) }], 'story'); }
    pend(R, () => PARTY.every(([id, , slot]) => { const a = act(R, id); return !a || a.rideSlot === slot; })); };
  O.tth_ride = (R, o) => {   // the long crossing: out into the heavy water, round the edge of the whirlpool, to the far pier
    const f = S.river, tu = f.turtle; if (!tu) return; const route = [[23.5, 25.6], [26.2, 23.4], [29, 24.6], [29.6, 27.2], [28.2, 29.2]].map(([a, b]) => TW(a, b));
    tu.route = route; tu.phase = 'carry'; tu.after = 'wait'; tu.speed = 12.5; tu.prog = 0; f.surgeT = 1; f.surgeRate = 0.5; f.stormT = 0.65; f.stormRate = 0.2;
    const marks = [[0.25, 'monk', 'dots'], [0.4, 'bj', 'excl'], [0.55, 'wk', 'star'], [0.7, 'sha', 'dots'], [0.85, 'monk', 'heart']], total = 110, seen = new Set();   // reactions on the way
    pend(R, () => { for (const [q, id, kind] of marks) if (!seen.has(q) && tu.prog / total > q) { seen.add(q); const a = act(R, id); if (a) H.bubble(a, kind, 2.6); } if (tu.phase === 'carry' && Math.floor(S.t * 2) !== Math.floor((S.t - 0.1) * 2)) ring(tu.x + (S.R() - 0.5) * 70, tu.y + (S.R() - 0.5) * 40, 'ripple', 2); return !f.turtle || f.turtle.phase === 'wait'; }); };
  O.tth_land = (R, o) => {   // alongside the far pier: the riders step off, the turtle bows
    const f = S.river, tu = f.turtle; if (!tu) return; const spots = [[31.2, 28.1], [32, 28.9], [33, 28.2], [34, 28.9], [35.2, 28.4]]; let n = 0; tu.unload = true; f.surgeT = 0.35; f.stormT = 0.2;
    for (const [id, , slot] of PARTY) { const a = act(R, id); if (!a) continue; const k = n++, [sa, sb] = spots[k], [px, py] = TW(sa, sb);
      H.assign(a, [{ k: 'wait', t: k * 0.6 }, { k: 'tthcall', fn: q => { q.flying = true; q.rideSlot = null; const i = tu.riders.indexOf(q); if (i >= 0) tu.riders.splice(i, 1); q.key = undefined; } }, { k: 'arc', x: px, y: py, t: 1.5, lift: 12, spin: 0 }, { k: 'tthcall', fn: q => { q.flying = false; q.lift = 0; q.pose = 'idle'; q.dir = 'right'; ring(px, py, 'splash', 1.2); } }, { k: 'face', dir: 'left' }, { k: 'bubble', kind: 'heart' }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 600 }], 'story'); }
    tu.bow = 0; setTimeoutish(4, () => { if (f.turtle) f.turtle.bow = 1; });
    pend(R, () => PARTY.every(([id]) => { const a = act(R, id); return !a || (a.cur && a.cur.k === 'idle' && !a.rideSlot); })); };
  O.tth_farewell = (R, o) => { for (const [id] of PARTY) { const a = act(R, id); if (a) H.assign(a, [{ k: 'face', dir: 'left' }, { k: 'bubble', kind: id === 'monk' ? 'heart' : 'note' }, { k: 'hop', t: 1.4 }, { k: 'idle', t: 2 }, { k: 'hop', t: 1 }, { k: 'idle', t: 600 }], 'story'); } for (const a of S.agents) if (a.biome === B && !a.gone && !a.hidden && H.free(a) && /_e$/.test(a.role)) H.assign(a, [{ k: 'face', x: P.tth_landing()[0], y: P.tth_landing()[1] }, { k: 'bubble', kind: 'heart' }, { k: 'hop', t: 1.2 }, { k: 'idle', t: 3 }], 'mini'); R.wait = o.t || 3.5; };
  O.tth_depart = (R, o) => {   // the turtle turns downstream and swims to the world's edge, where it dives and is gone
    const f = S.river, tu = f.turtle; if (!tu) return; tu.bow = 0; tu.route = [[27.4, 30.4], [25.6, 33.2], [24, 36], [23.2, 37.4]].map(([a, b]) => TW(a, b)); tu.phase = 'carry'; tu.after = 'dive'; tu.speed = 10; tu.prog = 0; f.surgeT = 0.55;
    pend(R, () => !f.turtle || f.turtle.phase === 'dive'); };
  O.tth_gone = (R, o) => { const f = S.river; pend(R, () => !f.turtle); };
  O.tth_party_leave = (R, o) => {   // the pilgrims walk on, out of the biome by the far bank's trail
    const ex = P.tth_eastexit(); let n = 0;
    for (const [id] of PARTY) { const a = act(R, id); if (!a) continue; const p = H.nearestWalk(ex[0] + (n % 2 ? 6 : -6), ex[1] + n * 3, B, 5) || ex; a.story = R; H.assign(a, [{ k: 'wait', t: n * 0.5 }, H.go(p[0], p[1], { run: 1.0 }), { k: 'tthfade' }], 'story'); n++; }
    pend(R, () => PARTY.every(([id]) => { const a = act(R, id); return !a || a.gone; })); };
  O.tth_lanterns = (R, o) => { M.tth_lanterns(B); };
  O.tth_calm = (R, o) => { const f = S.river; f.surgeT = 0.25; f.surgeRate = 0.06; f.stormT = 0; f.stormRate = 0.06; f.glowT = 0; };

  D.beacon.tth = '154,220,255';
  D.biomes.tth = {
    residents: [['tth_fisher', 3, 'fisher_w'], ['tth_ferryman', 1, 'ferryman'], ['tth_imp', 2, 'imp_w'], ['tth_fisher', 3, 'fisher_e'], ['tth_imp', 2, 'imp_e']],
    roles: {
      fisher_w: [['tth_fish_w', 4], ['tth_net_w', 2], ['tth_cook_w', 2], ['tth_haul_w', 2], ['tth_moor_w', 1], ['tth_look_w', 1], ['tth_rim_w', 1], ['tth_gossip_w', 2], ['tth_creek', 1], ['tth_wreck', 1]],
      ferryman: [['tth_mourn', 4], ['tth_moor_w', 2], ['tth_wreck', 2], ['tth_gossip_w', 1], ['tth_look_w', 1], ['tth_tower', 1]],
      imp_w: [['tth_patrol_w', 4], ['tth_tower', 3], ['tth_look_w', 2], ['tth_rim_w', 1], ['tth_gossip_w', 1]],
      fisher_e: [['tth_fish_e', 4], ['tth_net_e', 2], ['tth_cook_e', 2], ['tth_haul_e', 2], ['tth_moor_e', 1], ['tth_look_e', 1], ['tth_rim_e', 1], ['tth_gossip_e', 2]],
      imp_e: [['tth_patrol_e', 4], ['tth_look_e', 3], ['tth_rim_e', 2], ['tth_gossip_e', 1]],
    },
    minis: ['tth_cast', 'tth_boat_loose', 'tth_lanterns', 'tth_leap', 'tth_cranes', 'tth_surge', 'tth_imp_peek'],
    stories: [
      { id: 'divine_turtle', title: ['Rùa Thần Qua Sông', 'The Divine Turtle Ferries the Pilgrims'],
        fore: [['tth', { surge: 0.55, storm: 0.25, wind: 1.8, rate: 0.05, srate: 0.05 }], ['gather', { at: 'tth_pier', r: 5, roles: ['fisher_w', 'ferryman', 'imp_w'], n: 5 }], ['face', { who: 'crowd', dir: 'right' }], ['bubble', { who: 'crowd', kind: 'excl' }]],
        beats: [
          ['spawn', { id: 'monk', char: 'tam_tang', at: 'tth_gate_w', off: [0, 0.4] }], ['spawn', { id: 'wk', char: 'wukong', at: 'tth_gate_w', off: [-1, -0.4] }], ['spawn', { id: 'bj', char: 'bajie', at: 'tth_gate_w', off: [-2, 0.4] }],
          ['spawn', { id: 'sha', char: 'sa_tang', at: 'tth_gate_w', off: [-3, -0.4] }], ['spawn', { id: 'horse', char: 'bach_long_ma', at: 'tth_gate_w', off: [-4, 0.2] }], ['wait', { t: 1.6 }],
          ['tth_party_walk', {}], ['wait', { t: 1 }], ['tth', { surge: 0.85, storm: 0.45, rate: 0.2 }], ['tth_try', {}], ['tth', { surge: 1, storm: 0.55 }], ['wait', { t: 1.5 }],
          ['tth_rise', {}], ['tth_react', { kind: 'excl', kind2: 'star', t: 2.4 }], ['tth_approach', {}], ['wait', { t: 1.2 }], ['tth_board', {}], ['wait', { t: 1 }],
          ['tth_ride', {}], ['tth_land', {}], ['tth_farewell', { t: 3.5 }], ['tth_depart', {}], ['tth_gone', {}], ['wait', { t: 1.5 }],
          ['tth_party_leave', {}], ['disperse', {}]],
        after: { fx: 'petals', at: 'tth_pier', r: 30 },
        recover: [['tth_calm', {}], ['wait', { t: 5 }], ['tth_lanterns', {}], ['wait', { t: 8 }]] },
    ],
  };
})();
