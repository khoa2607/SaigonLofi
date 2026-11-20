'use strict';
// ===== Tây Du Ký v2 — Sư Đà Lĩnh: residents, activities, mini events and the signature story (DOM-free; loaded after tw-sim.js and tw-fire-data.js) =====
// Visible state lives in TWS.lion (read by tw-lion-fx.js): storm 0..1 (dark sky, lightning), wind (banners / pines / cloth), beacon 0..1 (witchfire blazing and light pillars),
// rings (roar / stomp / wing shockwaves), shadows (the roc's shadow gliding over the camp).
// Signature - "Tam Vương Hội Triều" (The Three Kings Convene): Kim Sí Đại Bàng swoops from his golden nest, Thanh Sư leaps from the lion den, Bạch Tượng thunders down from the
// tusk hall; each lands in the throne square and grows to twice his size; the camp kneels, the beacons blaze, storm light flickers, the kings raise their weapons - then they
// shrink back, return to their seats, the storm clears and the witchfire settles (recovery).
(function () {
  const S = TWS, H = S.H, D = window.TW_DATA, B = 'sdl', F = TWM.lion;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = (v, t, r, dt) => Math.abs(t - v) <= r * dt ? t : v + Math.sign(t - v) * r * dt;
  const newState = () => ({ storm: 0, stormT: 0, stormRate: 0.1, wind: 1, windT: 1, beacon: 0, beaconT: 0, beaconRate: 0.2, rings: [], quakes: [], shadows: [], flash: 0, flashClock: 4, whip: 0, bursts: [], giants: 0 });
  const baseInit = S.init, baseTick = S.tick;
  S.init = function (seed) { S.lion = newState(); baseInit(seed); };
  S.tick = function (dt) {
    baseTick(dt); const f = S.lion; if (!f) return;
    f.storm = ease(f.storm, f.stormT, f.stormRate, dt); f.beacon = ease(f.beacon, f.beaconT, f.beaconRate, dt); f.wind = ease(f.wind, f.windT, 0.6, dt); f.whip = Math.max(0, f.whip - dt * 0.6); f.flash = Math.max(0, f.flash - dt * 2.4);
    for (const r of f.rings) r.t += dt; f.rings = f.rings.filter(r => r.t < 1.8); for (const q of f.quakes) q.t += dt; f.quakes = f.quakes.filter(q => q.t < 1.2);
    for (const s of f.shadows) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; } f.shadows = f.shadows.filter(s => s.t < s.life); for (const b of f.bursts) b.t += dt; f.bursts = f.bursts.filter(b => b.t < 1.2);
    f.flashClock -= dt; if (f.storm > 0.45 && f.flashClock <= 0) { f.flash = 1; f.flashClock = 1.2 + S.R() * 3.2 / (0.4 + f.storm); }
    // a stiff breeze rises and falls on its own (the banners are never still); strong gusts now and then
    f.windT = f.stormT > 0.3 ? 2.4 : 1 + 0.35 * Math.sin(S.t * 0.07) + (Math.sin(S.t * 0.31) > 0.92 ? 0.8 : 0);
  };
  const ring = (x, y, kind) => S.lion.rings.push({ x, y, t: 0, kind });
  const quake = (x, y) => { S.lion.quakes.push({ x, y, t: 0 }); ring(x, y, 'stomp'); for (const a of S.agents) if (a.biome === B && !a.gone && !a.hidden && H.free(a) && Math.hypot(a.x - x, a.y - y) < 60 && a.role !== 'lion_king' && a.role !== 'elephant_king' && a.role !== 'roc_king') H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 1 }], 'mini'); };
  const roar = (a) => { ring(a.x, a.y, 'roar'); S.lion.whip = 1; for (const o of S.agents) if (o.biome === B && !o.gone && !o.hidden && H.free(o) && o.role !== 'lion_king' && Math.hypot(o.x - a.x, o.y - a.y) < 70 && (o.role === 'guard' || o.role === 'porter')) H.assign(o, [{ k: 'face', x: a.x, y: a.y }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }, { k: 'idle', t: 1.6 }], 'mini'); };
  const X = S.stepExt;
  X.sdlcall = (a, st) => { st.fn(a); return true; };

  // ---------------------------------------------------------------- activities
  const A = S.ACT, pois = k => H.pois(B, k);
  const post = (kind, a, dir, t) => { const p = H.poiFree(B, kind); if (!p) return A.stroll(a); H.claim(a, p); return [H.go(p.x, p.y), { k: 'face', dir: p.face || dir || 'up' }, { k: 'idle', t: t || H.rnd(10, 20) }, { k: 'act', t: 1.4 }, { k: 'idle', t: H.rnd(4, 9) }, { k: 'release', poi: p }]; };
  A.sdl_gate = a => { H.count('gatepost'); return post('gate', a, 'up'); };
  A.sdl_inner = a => post('gateinner', a, 'down');
  A.sdl_wall = a => { H.count('wallwatch'); return post('wallpost', a, 'down', H.rnd(12, 22)); };
  A.sdl_denpost = a => post('denpost', a, 'up');
  A.sdl_hallpost = a => post('hallpost', a, 'up');
  A.sdl_patrol = a => { const kinds = ['wallpost', 'gateinner', 'bridge', 'throne', 'gate', 'market', 'lookout'], steps = [], pk = k => { const l = pois(k); return l.length ? l[Math.floor(S.R() * l.length)] : null; }; H.count('patrol'); for (let n = 0; n < 3; n++) { const p = pk(kinds[Math.floor(S.R() * kinds.length)]); if (p) steps.push(H.go(p.x, p.y), { k: 'face', dir: p.face || 'down' }, { k: 'idle', t: H.rnd(2, 4) }); } return steps.length ? steps : A.stroll(a); };
  A.sdl_drill = a => { const p = H.poiFree(B, 'drill'); if (!p) return A.stroll(a); H.claim(a, p); H.count('drill'); return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'right' }, { k: 'act', t: H.rnd(5, 9) }, { k: 'idle', t: 1 }, { k: 'act', t: H.rnd(3, 6) }, { k: 'bubble', kind: 'excl' }, { k: 'release', poi: p }]; };
  A.sdl_rack = a => { const p = H.poiFree(B, 'rack'); if (!p) return A.stroll(a); H.claim(a, p); H.count('rack'); return [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'act', t: 2.4 }, { k: 'idle', t: 2 }, { k: 'bubble', kind: 'note' }, { k: 'release', poi: p }]; };
  A.sdl_mess = a => { const p = H.poiFree(B, 'mess') || H.poiFree(B, 'tent'); if (!p) return A.stroll(a); H.claim(a, p); H.count('mess'); return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'up' }, { k: 'sit', t: H.rnd(10, 18) }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: H.rnd(3, 6) }, { k: 'release', poi: p }]; };
  A.sdl_brazier = a => { const p = H.poiFree(B, 'brazier'); if (!p) return A.stroll(a); H.claim(a, p); H.count('warm'); return [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'sit', t: H.rnd(8, 15) }, { k: 'bubble', kind: 'dots' }, { k: 'sit', t: 4 }, { k: 'release', poi: p }]; };
  A.sdl_haul = a => { const c = H.poiFree(B, 'crate'), t = H.poiFree(B, 'tent') || H.poiFree(B, 'rack'); if (!c || !t) return A.stroll(a); H.claim(a, c); H.claim(a, t); H.count('haul'); return [H.go(c.x, c.y), { k: 'face', dir: 'up' }, { k: 'act', t: 2.2 }, { k: 'carry', what: 'sack' }, { k: 'release', poi: c }, H.go(t.x, t.y), { k: 'face', dir: 'up' }, { k: 'act', t: 2 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'dots' }, { k: 'release', poi: t }]; };
  A.sdl_market = a => { const p = H.poiFree(B, 'market'); if (!p) return A.stroll(a); H.claim(a, p); H.count('market'); return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'up' }, { k: 'idle', t: H.rnd(4, 8) }, { k: 'bubble', kind: 'note' }, { k: 'idle', t: 3 }, { k: 'release', poi: p }]; };
  A.sdl_overlook = a => { const p = H.poiFree(B, 'bridge') || H.poiFree(B, 'falls') || H.poiFree(B, 'lookout'); if (!p) return A.stroll(a); H.claim(a, p); H.count('overlook'); return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'right' }, { k: 'idle', t: H.rnd(6, 11) }, { k: 'bubble', kind: 'q' }, { k: 'idle', t: H.rnd(3, 6) }, { k: 'release', poi: p }]; };
  // the kings: seated at home, rounds through the camp, surveying their land
  A.sdl_throne = a => { const p = H.poiFree(B, 'throne'); if (!p) return A.stroll(a); H.claim(a, p); H.count('throne'); return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'up' }, { k: 'idle', t: H.rnd(8, 14) }, { k: 'act', t: 2 }, { k: 'idle', t: H.rnd(4, 8) }, { k: 'release', poi: p }]; };
  A.sdl_kinglook = a => { const p = H.poiFree(B, 'kinglook'); if (!p) return A.stroll(a); H.claim(a, p); H.count('kinglook'); return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'right' }, { k: 'idle', t: H.rnd(8, 14) }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: H.rnd(3, 6) }, { k: 'release', poi: p }]; };
  A.sdl_king_roar = a => { const p = H.poiFree(B, 'denpost'); if (!p) return A.sdl_kinglook(a); H.claim(a, p); H.count('roar'); return [H.go(p.x, p.y), { k: 'face', dir: 'down' }, { k: 'idle', t: 3 }, { k: 'act', t: 1.6 }, { k: 'sdlcall', fn: roar }, { k: 'act', t: 1 }, { k: 'idle', t: 5 }, { k: 'release', poi: p }]; };
  A.sdl_king_stomp = a => { const p = H.poiFree(B, 'hallpost'); if (!p) return A.sdl_kinglook(a); H.claim(a, p); H.count('stomp'); return [H.go(p.x, p.y), { k: 'face', dir: 'down' }, { k: 'idle', t: 3 }, { k: 'act', t: 1.2 }, { k: 'sdlcall', fn: a2 => quake(a2.x, a2.y) }, { k: 'idle', t: 6 }, { k: 'release', poi: p }]; };
  // the roc's flights: a long arc over the gorge to a lookout and back to the nest (a shadow follows him over the camp)
  const flight = (a, to) => { const p = to, n = H.poiFree(B, 'nestpost'); const home = [a.x, a.y]; return [{ k: 'bubble', kind: 'excl' }, { k: 'act', t: 1.2 }, { k: 'arc', x: p.x, y: p.y, t: 4.4, lift: 120, spin: 0 }, { k: 'sdlcall', fn: q => { q.flying = false; q.lift = 0; q.pose = 'idle'; ring(q.x, q.y, 'wing'); } }, { k: 'face', dir: 'down' }, { k: 'idle', t: H.rnd(6, 10) }, { k: 'arc', x: home[0], y: home[1], t: 4.4, lift: 120, spin: 0 }, { k: 'sdlcall', fn: q => { q.flying = false; q.lift = 0; q.pose = 'idle'; ring(q.x, q.y, 'wing'); } }, { k: 'idle', t: 3 }]; };
  A.sdl_roc_flight = a => { const ps = ['lookout', 'throne', 'kinglook', 'market'].map(k => pois(k)[0]).filter(Boolean); if (!ps.length) return A.stroll(a); H.count('rocflight'); return flight(a, ps[Math.floor(S.R() * ps.length)]); };
  A.sdl_nest = a => { const p = H.poiFree(B, 'nestpost'); if (!p) return A.stroll(a); H.claim(a, p); H.count('nest'); return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'down' }, { k: 'idle', t: H.rnd(14, 24) }, { k: 'act', t: 1.6 }, { k: 'idle', t: H.rnd(6, 12) }, { k: 'release', poi: p }]; };

  // ---------------------------------------------------------------- mini events
  const M = S.MINI, by = (b, role) => S.agents.find(a => a.biome === b && a.role === role && !a.gone && !a.hidden && H.free(a));
  const some = (b, role, n) => S.agents.filter(a => a.biome === b && a.role === role && !a.gone && !a.hidden && H.free(a)).slice(0, n);
  M.sdl_spar = b => {   // two guards spar in the drill yard, a porter cheers, the winner is cuffed by a sergeant's bark
    const g = some(b, 'guard', 3), dr = pois('drill'); if (g.length < 2 || !dr.length) return false; const p = dr[0], o = dr[1] || dr[0], w = by(b, 'porter');
    H.assign(g[0], [H.go(p.x, p.y), { k: 'face', dir: 'right' }, { k: 'bubble', kind: 'excl' }, { k: 'act', t: 3 }, { k: 'hop', t: 0.6 }, { k: 'act', t: 3 }, { k: 'hop', t: 1 }, { k: 'bubble', kind: 'note' }, { k: 'idle', t: 2 }], 'mini');
    H.assign(g[1], [H.go(o.x, o.y), { k: 'face', dir: 'left' }, { k: 'bubble', kind: 'excl' }, { k: 'act', t: 3 }, { k: 'hop', t: 0.6 }, { k: 'act', t: 3 }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: 2 }], 'mini');
    if (g[2]) H.assign(g[2], [H.go(p.x + 10, p.y + 10), { k: 'face', dir: 'up' }, { k: 'idle', t: 4 }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 1.2 }, { k: 'idle', t: 4 }], 'mini');
    if (w) H.assign(w, [H.go(p.x - 10, p.y + 12), { k: 'face', dir: 'up' }, { k: 'bubble', kind: 'heart' }, { k: 'hop', t: 1.6 }, { k: 'idle', t: 3 }, { k: 'bubble', kind: 'note' }], 'mini'); H.count('spar'); return true; };
  M.sdl_roar = b => { const k = by(b, 'lion_king'), p = pois('denpost')[0]; if (!k || !p) return false; H.assign(k, [H.go(p.x, p.y), { k: 'face', dir: 'down' }, { k: 'idle', t: 2 }, { k: 'act', t: 1.6 }, { k: 'sdlcall', fn: roar }, { k: 'act', t: 1.2 }, { k: 'sdlcall', fn: roar }, { k: 'idle', t: 4 }], 'mini'); H.count('mini_roar'); return true; };
  M.sdl_stomp = b => { const k = by(b, 'elephant_king'), p = pois('hallpost')[0]; if (!k || !p) return false; H.assign(k, [H.go(p.x, p.y), { k: 'face', dir: 'down' }, { k: 'idle', t: 2 }, { k: 'act', t: 1.3 }, { k: 'sdlcall', fn: a => quake(a.x, a.y) }, { k: 'act', t: 1.3 }, { k: 'sdlcall', fn: a => quake(a.x, a.y) }, { k: 'idle', t: 4 }], 'mini'); H.count('mini_stomp'); return true; };
  M.sdl_roc_shadow = b => {   // the golden roc glides over the camp: a huge shadow crosses the valley, everyone looks up and ducks, the king returns to his nest
    const k = by(b, 'roc_king'), lk = pois('lookout')[0] || pois('market')[0]; if (!k || !lk) return false; const f = S.lion, x = lk.x - 240, y = lk.y - 120;
    f.shadows.push({ x, y, vx: 26, vy: 13, t: 0, life: 18, s: 1 }); f.windT = 2.2;
    for (const a of S.agents) if (a.biome === B && !a.gone && !a.hidden && H.free(a) && (a.role === 'guard' || a.role === 'porter')) H.assign(a, [{ k: 'idle', t: S.R() * 4 }, { k: 'face', dir: 'up' }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }, { k: 'idle', t: 3 }, { k: 'bubble', kind: 'dots' }], 'mini');
    H.assign(k, flight(k, lk), 'mini'); H.count('roc_shadow'); return true; };
  M.sdl_trip = b => { const p = by(b, 'porter'), c = pois('crate')[0], g = by(b, 'guard'); if (!p || !c) return false; H.assign(p, [H.go(c.x, c.y), { k: 'face', dir: 'up' }, { k: 'carry', what: 'sack' }, { k: 'idle', t: 1 }, { k: 'bubble', kind: 'dots' }, { k: 'hop', t: 0.8 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'excl' }, { k: 'sit', t: 2 }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 2 }], 'mini');
    if (g) H.assign(g, [H.go(c.x + 12, c.y + 8), { k: 'face', dir: 'up' }, { k: 'bubble', kind: 'excl' }, { k: 'idle', t: 3 }, { k: 'bubble', kind: 'dots' }, { k: 'hop', t: 0.8 }], 'mini'); H.count('trip'); return true; };
  M.sdl_parade = b => { const g = some(b, 'guard', 5), pr = pois('parade')[0]; if (g.length < 3 || !pr) return false; g.forEach((a, n) => H.assign(a, [{ k: 'idle', t: n * 0.7 }, H.go(pr.x + (n - 2) * 9, pr.y + 8), { k: 'face', dir: 'up' }, { k: 'idle', t: 5 }, { k: 'act', t: 1.6 }, { k: 'bubble', kind: 'excl' }, { k: 'idle', t: 4 }], 'mini')); H.count('parade'); return true; };

  // ---------------------------------------------------------------- story ops (the Three Kings convene)
  const O = S.opExt, pend = (R, f) => { R.pend = f; };
  const slot = (name) => { const t = pois('throne')[0]; if (!t) return null; const off = { roc: [-10, -14], lion: [-27, 22], elephant: [27, -6] }[name]; return H.nearestWalk(t.x + off[0], t.y + off[1], B, 6) || [t.x + off[0], t.y + off[1]]; };
  O.lion = (R, o) => { const f = S.lion; if (o.storm !== undefined) { f.stormT = o.storm; f.stormRate = o.rate || 0.12; } if (o.beacon !== undefined) { f.beaconT = o.beacon; f.beaconRate = o.brate || 0.3; } if (o.wind !== undefined) f.windT = o.wind; if (o.whip) f.whip = 1; };
  O.king_arc = (R, o, Bm, W) => {   // the king leaps / swoops to his place in the throne square, lands with a shockwave and grows to twice his size
    if (!W) return; const p = slot(o.slot); if (!p) return; W.story = R; W.pending = true;
    const steps = [{ k: 'bubble', kind: 'excl' }, { k: 'act', t: 1.0 }, { k: 'arc', x: p[0], y: p[1], t: o.t || 3, lift: o.lift || 100, spin: 0 },
      { k: 'sdlcall', fn: a => { a.flying = false; a.lift = 0; a.pose = 'idle'; a.scale = 2; a.dir = 'down'; if (o.slot === 'elephant') quake(a.x, a.y); else if (o.slot === 'lion') { ring(a.x, a.y, 'roar'); S.lion.whip = 1; } else ring(a.x, a.y, 'wing'); S.lion.giants++; S.lion.bursts.push({ x: a.x, y: a.y, t: 0 }); } }, { k: 'idle', t: 1 }];
    H.assign(W, steps, 'story'); pend(R, () => !W.q.length && !W.cur); };
  O.kneel = (R, o) => { const t = pois('throne')[0]; if (!t) return; for (const a of S.agents) if (a.biome === B && !a.gone && !a.hidden && (a.role === 'guard' || a.role === 'porter') && H.free(a)) { a.gathered = R; const p = H.nearestWalk(t.x + (S.R() - 0.5) * 120, t.y + 30 + S.R() * 40, B, 5); if (p) H.assign(a, [H.go(p[0], p[1], { run: 1.6 }), { k: 'face', x: t.x, y: t.y }, { k: 'sit', t: 600 }], 'gather'); } const t0 = S.t; pend(R, () => S.t - t0 > 12); };
  O.king_raise = (R, o) => { for (const role of ['lion_king', 'elephant_king', 'roc_king']) { const k = S.agents.find(a => a.biome === B && a.role === role && !a.gone); if (k) { k.story = R; H.assign(k, [{ k: 'act', t: 1.6 }, { k: 'sdlcall', fn: q => { ring(q.x, q.y, 'roar'); S.lion.whip = 1; } }, { k: 'act', t: 1.6 }, { k: 'sdlcall', fn: q => { ring(q.x, q.y, 'roar'); S.lion.flash = 1; } }, { k: 'act', t: 1.6 }, { k: 'sdlcall', fn: q => { ring(q.x, q.y, 'roar'); quake(q.x, q.y); S.lion.flash = 1; } }, { k: 'idle', t: 1.6 }], 'story'); } }
    pend(R, () => !S.agents.some(a => a.biome === B && (a.role === 'lion_king' || a.role === 'elephant_king' || a.role === 'roc_king') && (a.q.length || a.cur))); };
  O.cheer = (R) => { for (const a of S.agents) if (a.gathered === R) H.assign(a, [{ k: 'hop', t: 2.4 }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 2 }, { k: 'sit', t: 600 }], 'gather'); };
  O.kings_home = (R, o) => { for (const [role, home] of [['roc_king', F.nestAt], ['lion_king', F.den], ['elephant_king', F.hall]]) { const k = S.agents.find(a => a.biome === B && a.role === role && !a.gone); if (!k) continue; const p = H.nearestWalk(home[0] * 8 + 4, home[1] * 8 + 4, B, 6) || [home[0] * 8 + 4, home[1] * 8 + 4]; k.story = R;
      H.assign(k, [{ k: 'sdlcall', fn: q => { q.scale = 1; S.lion.giants = Math.max(0, S.lion.giants - 1); S.lion.bursts.push({ x: q.x, y: q.y, t: 0 }); } }, { k: 'bubble', kind: 'note' }, { k: 'act', t: 1 }, { k: 'arc', x: p[0], y: p[1], t: 3.4, lift: role === 'roc_king' ? 130 : 80, spin: 0 }, { k: 'sdlcall', fn: q => { q.flying = false; q.lift = 0; q.pose = 'idle'; } }, { k: 'idle', t: 2 }], 'story'); }
    pend(R, () => !S.agents.some(a => a.biome === B && (a.role === 'lion_king' || a.role === 'elephant_king' || a.role === 'roc_king') && (a.q.length || a.cur))); };

  D.beacon.sdl = '120,255,140';
  D.biomes.sdl = {
    residents: [['thanh_su', 1, 'lion_king'], ['bach_tuong', 1, 'elephant_king'], ['kim_si', 1, 'roc_king'], ['sdl_guard', 9, 'guard'], ['sdl_porter', 5, 'porter']],
    roles: {
      lion_king: [['sdl_denpost', 3], ['sdl_throne', 3], ['sdl_kinglook', 2], ['sdl_king_roar', 2], ['stroll', 1]],
      elephant_king: [['sdl_hallpost', 3], ['sdl_throne', 2], ['sdl_kinglook', 2], ['sdl_king_stomp', 2], ['stroll', 1]],
      roc_king: [['sdl_nest', 4], ['sdl_roc_flight', 2], ['sdl_kinglook', 1], ['sdl_throne', 1]],
      guard: [['sdl_gate', 3], ['sdl_wall', 3], ['sdl_patrol', 4], ['sdl_drill', 3], ['sdl_rack', 1], ['sdl_brazier', 2], ['sdl_mess', 2], ['sdl_overlook', 1], ['sdl_inner', 2], ['sdl_market', 1], ['talk', 1]],
      porter: [['sdl_haul', 6], ['sdl_mess', 2], ['sdl_brazier', 1], ['sdl_market', 2], ['sdl_overlook', 1], ['talk', 1], ['stroll', 1]],
    },
    minis: ['sdl_spar', 'sdl_roar', 'sdl_stomp', 'sdl_roc_shadow', 'sdl_trip', 'sdl_parade'],
    stories: [
      { id: 'three_kings', title: ['Tam Vương Hội Triều', 'The Three Kings Convene'],
        fore: [['lion', { storm: 0.3, wind: 1.8, rate: 0.05 }], ['gather', { at: 'parade', r: 6, roles: ['guard', 'porter'], n: 10 }], ['face', { who: 'crowd', dir: 'up' }], ['bubble', { who: 'crowd', kind: 'excl' }]],
        beats: [
          ['lion', { storm: 0.55, wind: 2.2, rate: 0.12 }], ['wait', { t: 1.5 }],
          ['king_arc', { who: 'roc_king', slot: 'roc', t: 3.6, lift: 150 }], ['lion', { storm: 0.7 }],
          ['king_arc', { who: 'lion_king', slot: 'lion', t: 3, lift: 100 }],
          ['king_arc', { who: 'elephant_king', slot: 'elephant', t: 3, lift: 70 }],
          ['kneel', {}], ['lion', { storm: 1, beacon: 1, wind: 2.6, rate: 0.25, brate: 0.35 }], ['wait', { t: 2.5 }],
          ['king_raise', {}], ['cheer', {}], ['wait', { t: 6 }],
          ['lion', { storm: 0.2, beacon: 0.4, wind: 1.4, rate: 0.1 }], ['kings_home', {}], ['disperse', {}]],
        after: { fx: 'petals', at: 'throne', r: 30 },
        recover: [['lion', { storm: 0, beacon: 0, wind: 1, rate: 0.08, brate: 0.08 }], ['wait', { t: 10 }]] },
    ],
  };
})();
