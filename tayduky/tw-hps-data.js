'use strict';
// ===== Tây Du Ký v2 — Hắc Phong Sơn: residents, activities, mini events and the signature story (DOM-free; loaded after tw-sim.js and tw-river-data.js) =====
// Visible state lives in TWS.hps (read by tw-hps-fx.js): dark 0..1 (black wind: sky and mist darken), wind, rain, fire{building: 0..1}, tstate ('ok' | 'ruin' | 'scaffold': which sprite the great hall shows),
// rebuild 0..1, eyes 0..1 (the lair's glow), bell (last ring), shake / flash, bursts (clash sparks), flocks (crows), leaves, motes (golden chant motes), torches.
// Signature - "Hắc Hùng Tinh Đốt Chùa" (The Black Bear and the Burning Temple): peaceful monastery life -> unease (crows, the black wind, the lair's eyes) -> the Black Bear and his minions march to the hall
// and set it alight -> the fire spreads (monks evacuate and run a bucket chain, the hall collapses) -> Tam Tạng, Ngộ Không, Bát Giới and Sa Tăng arrive -> Wukong confronts Hắc Hùng Tinh -> the bear is thrown
// back and flees to his lair, rain puts out the fire -> the monks rebuild (scaffold, hammering, the new hall, the bell) -> peace returns.
(function () {
  const S = TWS, H = S.H, D = window.TW_DATA, B = 'hps', F = TWM.hps, T = 8;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = (v, t, r, dt) => Math.abs(t - v) <= r * dt ? t : v + Math.sign(t - v) * r * dt;
  const TW = (a, b) => [(F.x0 + a + 0.5) * T, (F.y0 + b + 0.5) * T];
  const BUILD = ['temple', 'pagoda', 'dorm', 'kitchen', 'bell', 'sutra'];
  const newState = () => ({ dark: 0, darkT: 0, dRate: 0.1, wind: 1, windT: 1, rain: 0, rainT: 0, fire: { temple: 0, pagoda: 0, dorm: 0, kitchen: 0, bell: 0, sutra: 0 }, fireT: { temple: 0, pagoda: 0, dorm: 0, kitchen: 0, bell: 0, sutra: 0 }, fRate: 0.2,
    tstate: 'ok', rebuild: 0, rebuildT: 0, eyes: 0, eyesT: 0, bell: -99, shake: 0, flash: 0, flashClock: 6, bursts: [], flocks: [], leaves: [], motes: [], dust: [], torches: [], collapseT: -99, newT: -99, peeks: [], bearAura: 0, hammer: 0, giant: null, kasaya: 0, rings: [], rocks: [], windKick: 0, shockAt: -99, shockXY: null, guan: 0, guanT: 0, forestEyes: 0, bearA: null });
  const baseInit = S.init, baseTick = S.tick;
  S.init = function (seed) { S.hps = newState(); baseInit(seed); };
  S.tick = function (dt) {
    baseTick(dt); const f = S.hps; if (!f) return;
    f.dark = ease(f.dark, f.darkT, f.dRate, dt); f.rain = ease(f.rain, f.rainT, 0.18, dt); f.eyes = ease(f.eyes, f.eyesT, 0.4, dt); f.rebuild = ease(f.rebuild, f.rebuildT, 0.012, dt); f.shake = Math.max(0, f.shake - dt * 1.4); f.flash = Math.max(0, f.flash - dt * 2.2);
    for (const b of BUILD) f.fire[b] = ease(f.fire[b], f.fireT[b], f.fRate, dt);
    f.windT = f.darkT > 0.3 ? 2.4 : 1 + 0.35 * Math.sin(S.t * 0.07) + (Math.sin(S.t * 0.31) > 0.92 ? 0.8 : 0); f.wind = ease(f.wind, f.windT, 0.5, dt) + f.windKick * 3;
    for (const b of f.bursts) b.t += dt; f.bursts = f.bursts.filter(b => b.t < 1.6);
    for (const q of f.flocks) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; } f.flocks = f.flocks.filter(q => q.t < q.life);
    for (const q of f.leaves) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; } f.leaves = f.leaves.filter(q => q.t < q.life);
    for (const q of f.motes) { q.t += dt; q.y -= q.vy * dt; q.x += Math.sin(q.t + q.ph) * 0.4 * dt; } f.motes = f.motes.filter(q => q.t < q.life);
    for (const q of f.dust) q.t += dt; f.dust = f.dust.filter(q => q.t < q.life); for (const q of f.torches) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; } f.torches = f.torches.filter(q => q.t < q.life);
    for (const q of f.peeks) q.t += dt; f.peeks = f.peeks.filter(q => q.t < q.life);
    for (const r of f.rings) r.t += dt; f.rings = f.rings.filter(r => r.t < r.life); for (const q of f.rocks) q.t += dt; f.rocks = f.rocks.filter(q => q.t < q.life);
    f.windKick = Math.max(0, f.windKick - dt * 0.5); f.guan = ease(f.guan, f.guanT, 0.5, dt); f.forestEyes = ease(f.forestEyes, (f.darkT > 0.3 || f.eyesT > 0.5) ? 1 : 0, 0.3, dt); tickGiant(f, dt);
    f.flashClock -= dt; if (f.rain > 0.3 && f.darkT > 0.4 && f.flashClock <= 0) { f.flash = 1; f.flashClock = 2 + S.R() * 4; }
    for (let i = timers.length - 1; i >= 0; i--) if (S.t >= timers[i].at) { const t = timers.splice(i, 1)[0]; t.fn(); }
  };
  const timers = []; const later = (sec, fn) => timers.push({ at: S.t + sec, fn });
  const bursts = (x, y, kind) => S.hps.bursts.push({ x, y, t: 0, kind: kind || 'clash' });

  const X = S.stepExt, P = S.pointExt;
  X.hpscall = (a, st) => { st.fn(a); return true; };
  X.hpsfade = (a, st, dt) => { st.el = (st.el || 0) + dt; a.alpha = Math.max(0, 1 - st.el / 1.4); if (st.el >= 1.4) { a.gone = true; return true; } return false; };
  P.hps_gate = () => TW(28.6, 26.5); P.hps_plaza = () => TW(23, 26.5); P.hps_hall = () => TW(13.5, 11.8); P.hps_lair = () => TW(8, 27.5); P.hps_court = () => TW(17, 14); P.hps_dorm = () => TW(20, 18.5);

  // ---------------------------------------------------------------- activities
  const A = S.ACT, pois = k => H.pois(B, k);
  const post = (kind, a, dir, extra) => { const p = H.poiFree(B, kind); if (!p) return A.stroll(a); H.claim(a, p); return [H.go(p.x, p.y), { k: 'face', dir: p.face || dir || 'up' }].concat(extra || [{ k: 'idle', t: H.rnd(6, 12) }]).concat([{ k: 'release', poi: p }]); };
  A.hps_sweep = a => { H.count('sweep'); return post('hsweep', a, 'down', [{ k: 'act', t: H.rnd(4, 7) }, { k: 'idle', t: 1 }, { k: 'act', t: H.rnd(3, 6) }, { k: 'bubble', kind: 'note' }]); };
  A.hps_chant = a => { H.count('chant'); return post('hchant', a, 'up', [{ k: 'sit', t: H.rnd(10, 20) }, { k: 'bubble', kind: 'note' }, { k: 'sit', t: H.rnd(5, 10) }]); };
  A.hps_incense = a => { H.count('incense'); return post('hincense', a, 'up', [{ k: 'act', t: 2.4 }, { k: 'idle', t: 2 }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: H.rnd(3, 6) }]); };
  A.hps_bell = a => { H.count('bell'); return post('hbell', a, 'left', [{ k: 'hpscall', fn: q => { S.hps.bell = S.t; } }, { k: 'act', t: 2.2 }, { k: 'idle', t: 3 }, { k: 'hpscall', fn: q => { S.hps.bell = S.t; } }, { k: 'act', t: 2.2 }, { k: 'idle', t: 2 }]); };
  A.hps_sutra = a => { H.count('sutra'); return post('hsutra', a, 'up', [{ k: 'sit', t: H.rnd(12, 24) }, { k: 'bubble', kind: 'q' }, { k: 'sit', t: H.rnd(4, 8) }]); };
  A.hps_cook = a => { H.count('cook'); return post('hcook', a, 'up', [{ k: 'act', t: H.rnd(4, 8) }, { k: 'idle', t: 1.5 }, { k: 'act', t: H.rnd(3, 6) }, { k: 'bubble', kind: 'heart' }]); };
  A.hps_water = a => { const w = H.poiFree(B, 'hwater'), h = H.poiFree(B, 'hcook'); if (!w || !h) return A.stroll(a); H.claim(a, w); H.claim(a, h); H.count('water'); return [H.go(w.x, w.y), { k: 'face', dir: w.face || 'up' }, { k: 'act', t: 2.4 }, { k: 'carry', what: 'bucket' }, { k: 'release', poi: w }, H.go(h.x, h.y), { k: 'face', dir: 'up' }, { k: 'idle', t: 1.2 }, { k: 'carry', what: null }, { k: 'release', poi: h }]; };
  A.hps_train = a => { H.count('train'); return post('htrain', a, 'right', [{ k: 'act', t: 2.2 }, { k: 'idle', t: 0.8 }, { k: 'act', t: 2.2 }, { k: 'hop', t: 0.7 }, { k: 'act', t: 2.2 }, { k: 'idle', t: 2 }]); };
  A.hps_look = a => { H.count('look'); return post('hlook', a, 'right', [{ k: 'idle', t: H.rnd(8, 14) }, { k: 'bubble', kind: 'q' }, { k: 'idle', t: H.rnd(3, 6) }]); };
  A.hps_shrine = a => { H.count('shrine'); return post('hshrine', a, 'up', [{ k: 'act', t: 2 }, { k: 'idle', t: H.rnd(5, 9) }, { k: 'bubble', kind: 'heart' }]); };
  A.hps_stream = a => { H.count('stream'); return post('hstream', a, 'left', [{ k: 'act', t: 3 }, { k: 'idle', t: 1.5 }, { k: 'act', t: 3 }, { k: 'bubble', kind: 'note' }]); };
  A.hps_carry = a => { const s = H.poiFree(B, 'hcarry'), e = pois('hcarry').filter(q => q !== s)[Math.floor(S.R() * 2)]; if (!s || !e) return A.stroll(a); H.claim(a, s); H.count('carry'); return [H.go(s.x, s.y), { k: 'act', t: 1.6 }, { k: 'carry', what: 'sack' }, { k: 'release', poi: s }, H.go(e.x, e.y), { k: 'idle', t: 1.4 }, { k: 'carry', what: null }]; };
  A.hps_patrol = a => { const kinds = ['hchant', 'hincense', 'hsutra', 'hsweep', 'hlook', 'hshrine'], steps = []; H.count('patrol'); for (let n = 0; n < 3; n++) { const l = pois(kinds[Math.floor(S.R() * kinds.length)]); if (l.length) { const p = l[Math.floor(S.R() * l.length)]; steps.push(H.go(p.x, p.y), { k: 'face', dir: p.face || 'up' }, { k: 'idle', t: H.rnd(2, 4) }); } } return steps.length ? steps : A.stroll(a); };
  A.hps_guard = a => post('hlair', a, 'up', [{ k: 'idle', t: H.rnd(8, 16) }, { k: 'bubble', kind: S.R() < 0.5 ? 'excl' : 'dots' }, { k: 'idle', t: H.rnd(4, 8) }]);
  A.hps_build = a => { const p = H.poiFree(B, 'hbuild'); if (!p || S.hps.tstate !== 'scaffold') return A.hps_sweep(a); H.claim(a, p); H.count('build'); return [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'hpscall', fn: () => { S.hps.hammer = S.t; } }, { k: 'act', t: 3 }, { k: 'idle', t: 0.6 }, { k: 'act', t: 3 }, { k: 'release', poi: p }]; };

  // ---------------------------------------------------------------- mini events
  const M = S.MINI, some = (roles, n) => S.agents.filter(a => a.biome === B && roles.includes(a.role) && !a.gone && !a.hidden && H.free(a)).slice(0, n);
  const lookAt = (xy, who) => { for (const a of who) H.assign(a, [{ k: 'face', x: xy[0], y: xy[1] }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }, { k: 'idle', t: 2.4 }, { k: 'bubble', kind: 'star' }], 'mini'); };
  M.hps_bell = b => { const m = some(['monk', 'novice'], 1)[0], p = pois('hbell')[0]; if (!m || !p) return false; H.assign(m, [H.go(p.x, p.y), { k: 'face', dir: 'left' }, { k: 'hpscall', fn: () => { S.hps.bell = S.t; } }, { k: 'act', t: 2.4 }, { k: 'idle', t: 2.5 }, { k: 'hpscall', fn: () => { S.hps.bell = S.t; } }, { k: 'act', t: 2.4 }, { k: 'idle', t: 2.5 }, { k: 'hpscall', fn: () => { S.hps.bell = S.t; } }, { k: 'act', t: 2.4 }, { k: 'idle', t: 2 }], 'mini'); const [x, y] = TW(17, 12); S.hps.flocks.push(...[0, 1, 2, 3, 4].map(q => ({ kind: 'crow', x: x + q * 6, y: y + q * 3, vx: 6 + q * 0.3, vy: -3, t: -q * 0.2, life: 16, ph: q }))); H.count('bell_mini'); return true; };
  M.hps_procession = b => { const l = some(['monk', 'novice'], 4); if (l.length < 3) return false; const ps = ['hchant', 'hincense', 'hsutra', 'hlook'].map(k => pois(k)[0]).filter(Boolean); l.forEach((a, n) => H.assign(a, [{ k: 'wait', t: n * 1.1 }].concat(ps.flatMap(p => [H.go(p.x, p.y), { k: 'face', dir: p.face || 'up' }, { k: 'idle', t: 1.2 }])).concat([{ k: 'carry', what: n === 0 ? 'incense' : null }]), 'mini')); H.count('procession'); return true; };
  M.hps_flock = b => { const f = S.hps, [x, y] = TW(3, 4); for (let q = 0; q < 7; q++) f.flocks.push({ kind: S.R() < 0.5 ? 'crane' : 'crow', x: x + q * 9, y: y + q * 6, vx: 8.5, vy: 6, t: -q * 0.3, life: 34, ph: q * 1.2 }); lookAt(TW(14, 8), some(['monk', 'novice'], 2)); H.count('flock'); return true; };
  M.hps_shower = b => { const f = S.hps; if (f.rainT > 0.2 || f.darkT > 0.2) return false; f.rainT = 0.55; later(22, () => { if (S.hps.darkT < 0.2) S.hps.rainT = 0; }); for (const a of some(['monk', 'novice', 'porter'], 5)) { const p = pois('hchant')[0]; H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.6 }].concat(p ? [H.go(p.x, p.y, { run: 1.5 }), { k: 'idle', t: 8 }] : [{ k: 'idle', t: 4 }]), 'mini'); } H.count('shower'); return true; };
  M.hps_leaves = b => { const f = S.hps; for (let q = 0; q < 22; q++) { const [x, y] = TW(18 + S.R() * 9, 14 + S.R() * 10); f.leaves.push({ x, y, vx: 5 + S.R() * 5, vy: 1 + S.R() * 3, t: -q * 0.12, life: 11, ph: S.R() * 6, z: 8 + S.R() * 40 }); } for (const a of some(['novice'], 2)) H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }, { k: 'act', t: 3 }, { k: 'idle', t: 1 }, { k: 'act', t: 3 }, { k: 'bubble', kind: 'dots' }], 'mini'); H.count('leaves'); return true; };
  M.hps_chant_all = b => { const l = some(['monk', 'novice', 'abbot'], 6); if (l.length < 3) return false; const ps = pois('hchant'); l.forEach((a, n) => { const p = ps[n % ps.length]; if (p) H.assign(a, [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'sit', t: 14 }, { k: 'bubble', kind: 'note' }, { k: 'sit', t: 8 }], 'mini'); }); for (let q = 0; q < 16; q++) { const [x, y] = TW(11 + S.R() * 5, 10.5 + S.R()); S.hps.motes.push({ x, y, vy: 3 + S.R() * 3, t: -q * 0.8, life: 12, ph: S.R() * 6, z: 4 }); } H.count('chant_all'); return true; };
  M.hps_lair_peek = b => { const f = S.hps; if (f.eyesT > 0.1 || f.darkT > 0.2) return false; f.eyesT = 1; later(7, () => { S.hps.eyesT = S.hps.darkT > 0.3 ? 1 : 0; }); const [x, y] = TW(8.5, 27.5); f.peeks.push({ x, y, t: 0, life: 6 }); lookAt(F.lair.map(v => v * T + 4), some(['monk', 'novice', 'porter'], 3)); H.count('lair_peek'); return true; };
  M.hps_porters = b => { const p = some(['porter'], 2); if (p.length < 1) return false; const a = pois('hcarry'); for (const q of p) H.assign(q, [H.go(a[0].x, a[0].y), { k: 'act', t: 1.6 }, { k: 'carry', what: 'sack' }, H.go(a[a.length - 1].x, a[a.length - 1].y), { k: 'idle', t: 1.4 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'note' }], 'mini'); H.count('porters'); return true; };

  // ---------------------------------------------------------------- story ops
  const O = S.opExt, pend = (R, f) => { R.pend = f; }, act = (R, n) => R.actors[n];
  const PILGRIMS = [['monk', 'tam_tang'], ['wk', 'wukong'], ['bj', 'bajie'], ['sha', 'sa_tang']], FOES = ['bear', 'm1', 'm2', 'm3'];
  const free = () => S.agents.filter(a => a.biome === B && !a.gone && !a.hidden && H.free(a) && a.role !== 'minion');
  O.hps = (R, o) => { const f = S.hps; if (o.dark !== undefined) { f.darkT = o.dark; f.dRate = o.rate || 0.12; } if (o.eyes !== undefined) f.eyesT = o.eyes; if (o.rain !== undefined) f.rainT = o.rain; if (o.wind !== undefined) f.windT = o.wind; if (o.fire) { f.fRate = o.frate || 0.2; for (const k in o.fire) f.fireT[k] = o.fire[k]; } if (o.rebuild !== undefined) f.rebuildT = o.rebuild; if (o.tstate) f.tstate = o.tstate; if (o.flash) f.flash = 1; if (o.shake) f.shake = o.shake; };
  O.hps_unease = (R, o) => { for (const a of free().slice(0, 9)) { const p = pois('hplaza')[Math.floor(S.R() * 4)]; H.assign(a, [{ k: 'face', x: TW(5, 25)[0], y: TW(5, 25)[1] }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 2 }, { k: 'bubble', kind: 'dots' }].concat(p ? [H.go(p.x, p.y), { k: 'idle', t: 6 }] : []), 'mini'); } const [x, y] = TW(9, 6); for (let q = 0; q < 10; q++) S.hps.flocks.push({ kind: 'crow', x: x + q * 5, y: y + (q % 3) * 4, vx: 9, vy: 5, t: -q * 0.15, life: 22, ph: q }); R.wait = o.t || 4; };
  O.hps_march = (R, o) => {   // the Black Bear and his minions walk from the lair to the great hall
    const hall = P.hps_hall(), pts = [[0, 0], [-1.6, 1.3], [1.4, 1.5], [0.2, 2.8]]; let n = 0; S.hps.bearA = act(R, 'bear');
    for (const id of FOES) { const a = act(R, id); if (!a) { n++; continue; } a.story = R; const [dx, dy] = pts[n++], p = H.nearestWalk(hall[0] + dx * T, hall[1] + dy * T, B, 4) || hall; H.assign(a, [{ k: 'wait', t: n * 0.5 }, H.go(p[0], p[1], { run: id === 'bear' ? 0.9 : 1.2 }), { k: 'face', x: F.temple[0] * T + 20, y: F.temple[1] * T + 20 }, { k: 'idle', t: 600 }], 'story'); }
    const t0 = S.t; pend(R, () => S.t - t0 > 55 || FOES.every(id => { const a = act(R, id); return !a || (a.cur && a.cur.k === 'idle'); })); };
  O.hps_torch = (R, o) => {   // minions hurl torches at the hall, the roof catches
    const f = S.hps, [tx, ty] = [F.temple[0] * T + 20, F.temple[1] * T + 24]; let n = 0;
    for (const id of ['m1', 'm2', 'm3', 'bear']) { const a = act(R, id); if (!a) continue; const k = n++; H.assign(a, [{ k: 'wait', t: k * 0.7 }, { k: 'face', x: tx, y: ty }, { k: 'act', t: 1.3 }, { k: 'hpscall', fn: q => { f.torches.push({ x: q.x, y: q.y, vx: (tx - q.x) / 1.4, vy: (ty - q.y) / 1.4, t: 0, life: 1.4 }); later(1.4, () => { bursts(tx + (S.R() - 0.5) * 20, ty, 'fire'); f.fireT.temple = Math.min(1, f.fireT.temple + 0.28); }); } }, { k: 'idle', t: 600 }], 'story'); }
    R.wait = o.t || 4; };
  O.hps_panic = (R, o) => {   // the monks evacuate to the gate plaza; novices and the abbot run the bucket chain
    const fs = free(); fs.forEach((a, n) => { const p = pois('hplaza')[n % 4], w = pois('hwater')[0], t = pois('hbuild')[n % 3]; if (!p) return; const bucket = a.role === 'novice' || a.role === 'porter';
      H.assign(a, [{ k: 'wait', t: (n % 4) * 0.35 }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.6 }].concat(bucket && w && t ? [H.go(w.x, w.y, { run: 1.6 }), { k: 'act', t: 1.2 }, { k: 'carry', what: 'bucket' }, H.go(t.x, t.y, { run: 1.6 }), { k: 'act', t: 1.2 }, { k: 'carry', what: null }, H.go(w.x, w.y, { run: 1.6 }), { k: 'act', t: 1.2 }, { k: 'carry', what: 'bucket' }, H.go(t.x, t.y, { run: 1.6 }), { k: 'act', t: 1.2 }, { k: 'carry', what: null }] : [H.go(p.x, p.y, { run: 1.7 }), { k: 'bubble', kind: 'dots' }, { k: 'idle', t: 8 }]), 'mini'); }); R.wait = o.t || 3; };
  O.hps_collapse = (R, o) => {   // the great hall falls: flash, shake, a wall of dust, the ruin takes its place
    const f = S.hps, [x, y] = [F.temple[0] * T + 20, F.temple[1] * T + 20]; f.flash = 1; f.shake = 1.4; f.tstate = 'ruin'; f.collapseT = S.t; bursts(x, y, 'collapse'); for (let q = 0; q < 14; q++) f.dust.push({ x: x + (S.R() - 0.5) * 50, y: y + (S.R() - 0.5) * 30, t: -S.R() * 0.6, life: 5 + S.R() * 3, z: S.R() * 30 });
    f.fireT.temple = 0.6; f.fireT.pagoda = 0.8; f.fireT.bell = 0.4; for (const a of free().slice(0, 8)) H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.8 }, { k: 'hop', t: 0.8 }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: 6 }], 'mini'); R.wait = o.t || 3.5; };
  O.hps_arrive = (R, o) => {   // the four pilgrims run in through the gate and up the road
    const hall = P.hps_hall(), spots = [[-3, 4], [-0.4, 1.5], [-5, 3], [-4, 5.5]];
    PILGRIMS.forEach(([id], n) => { const a = act(R, id); if (!a) return; a.story = R; const p = H.nearestWalk(hall[0] + spots[n][0] * T, hall[1] + spots[n][1] * T, B, 4) || hall; H.assign(a, [{ k: 'wait', t: n * 0.5 }, H.go(p[0], p[1], { run: 1.7 }), { k: 'face', x: F.temple[0] * T + 20, y: F.temple[1] * T + 24 }, { k: 'idle', t: 600 }], 'story'); });
    const t0 = S.t; pend(R, () => S.t - t0 > 60 || PILGRIMS.every(([id]) => { const a = act(R, id); return !a || (a.cur && a.cur.k === 'idle'); })); };
  O.hps_clash = (R, o) => {   // Wukong against Hắc Hùng Tinh: blows, sparks, the bear is hurled back
    const f = S.hps, wk = act(R, 'wk'), bear = act(R, 'bear'); if (!wk || !bear) { R.wait = 1; return; }
    const mx = (wk.x + bear.x) / 2, my = (wk.y + bear.y) / 2, hit = n => later(n, () => { bursts(mx + (S.R() - 0.5) * 12, my - 6, 'clash'); f.shake = Math.max(f.shake, 0.5); f.bearAura = 1; });
    H.assign(wk, [{ k: 'face', x: bear.x, y: bear.y }, { k: 'act', t: 1.1 }, { k: 'hop', t: 0.6 }, { k: 'act', t: 1.1 }, { k: 'hop', t: 0.6 }, { k: 'act', t: 1.2 }, { k: 'idle', t: 600 }], 'story');
    H.assign(bear, [{ k: 'face', x: wk.x, y: wk.y }, { k: 'act', t: 1.2 }, { k: 'hop', t: 0.6 }, { k: 'act', t: 1.2 }, { k: 'hop', t: 0.6 }, { k: 'act', t: 1.2 }, { k: 'idle', t: 600 }], 'story'); hit(0.8); hit(2.2); hit(3.6); hit(4.8);
    for (const id of ['bj', 'sha']) { const a = act(R, id); if (a) H.assign(a, [{ k: 'face', x: bear.x, y: bear.y }, { k: 'act', t: 1.2 }, { k: 'hop', t: 0.6 }, { k: 'act', t: 1.2 }, { k: 'idle', t: 600 }], 'story'); }
    const mm = act(R, 'monk'); if (mm) H.assign(mm, [{ k: 'bubble', kind: 'dots' }, { k: 'idle', t: 3 }, { k: 'bubble', kind: 'excl' }, { k: 'idle', t: 600 }], 'story'); R.wait = o.t || 6.4; };
  O.hps_defeat = (R, o) => {   // the bear is thrown back (arc), a burst; rain sets in
    const f = S.hps, bear = act(R, 'bear'); if (bear) { const p = H.nearestWalk(F.temple[0] * T - 6, (F.temple[1] + 6) * T, B, 5) || [bear.x, bear.y]; H.assign(bear, [{ k: 'hpscall', fn: q => { q.flying = true; } }, { k: 'arc', x: p[0], y: p[1], t: 1.2, lift: 22, spin: 0 }, { k: 'hpscall', fn: q => { q.flying = false; q.lift = 0; bursts(q.x, q.y, 'clash'); f.shake = 0.9; } }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 600 }], 'story'); }
    f.rainT = 1; f.fRate = 0.07; for (const k of BUILD) f.fireT[k] = 0; f.darkT = 0.4; R.wait = o.t || 2.6; };
  O.hps_flee = (R, o) => {   // the bear and his minions run home to the lair; its eyes go out
    const lair = P.hps_lair(); FOES.forEach((id, n) => { const a = act(R, id); if (!a) return; const p = H.nearestWalk(lair[0] + (n % 2 ? 6 : -4), lair[1] + n * 2, B, 4) || lair; a.story = R; H.assign(a, [{ k: 'wait', t: n * 0.4 }, H.go(p[0], p[1], { run: 1.9 }), { k: 'hpsfade' }], 'story'); });
    S.hps.eyesT = 0; pend(R, () => FOES.every(id => { const a = act(R, id); return !a || a.gone; })); };
  O.hps_thanks = (R, o) => {   // the abbot and the monks kneel to the pilgrims; the pilgrims bow and leave by the gate
    const hall = P.hps_hall(); for (const a of free()) H.assign(a, [{ k: 'face', x: hall[0] + 20, y: hall[1] + 30 }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 4 }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 3 }], 'mini');
    for (const [id] of PILGRIMS) { const a = act(R, id); if (a) H.assign(a, [{ k: 'bubble', kind: id === 'monk' ? 'heart' : 'note' }, { k: 'hop', t: 1 }, { k: 'idle', t: 2.5 }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 600 }], 'story'); } R.wait = o.t || 5; };
  O.hps_leave = (R, o) => { const ex = P.hps_gate(); let n = 0; for (const [id] of PILGRIMS) { const a = act(R, id); if (!a) continue; const p = H.nearestWalk(ex[0] + (n % 2 ? 4 : -4), ex[1] + n * 2, B, 5) || ex; a.story = R; H.assign(a, [{ k: 'wait', t: n * 0.5 }, H.go(p[0], p[1], { run: 1.0 }), { k: 'hpsfade' }], 'story'); n++; } pend(R, () => PILGRIMS.every(([id]) => { const a = act(R, id); return !a || a.gone; })); };
  O.hps_scaffold = (R, o) => { const f = S.hps; f.tstate = 'scaffold'; f.flash = 0.6; f.rebuild = 0; f.rebuildT = 1; bursts(F.temple[0] * T + 20, F.temple[1] * T + 20, 'dust'); f.rainT = 0; f.darkT = 0; for (const a of free()) H.assign(a, [{ k: 'bubble', kind: 'note' }, { k: 'idle', t: 1.5 }], 'mini'); R.wait = o.t || 2; };
  O.hps_builders = (R, o) => { const l = S.agents.filter(a => a.biome === B && ['monk', 'novice', 'porter'].includes(a.role) && !a.gone && !a.hidden && H.free(a)); for (const a of l) { const p = pois('hbuild')[Math.floor(S.R() * 3)]; if (!p) continue; H.assign(a, [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'hpscall', fn: () => { S.hps.hammer = S.t; } }, { k: 'act', t: 3 }, { k: 'idle', t: 0.6 }, { k: 'act', t: 3 }, { k: 'idle', t: 0.6 }, { k: 'act', t: 3 }, { k: 'idle', t: 1 }], 'mini'); } R.wait = o.t || 4; };
  O.hps_new = (R, o) => {   // the new hall stands: golden sparkle, the great bell rings, monks bow
    const f = S.hps, [x, y] = [F.temple[0] * T + 20, F.temple[1] * T + 20]; f.tstate = 'ok'; f.newT = S.t; f.flash = 0.8; f.bell = S.t; bursts(x, y, 'gold'); for (let q = 0; q < 24; q++) f.motes.push({ x: x + (S.R() - 0.5) * 60, y: y + (S.R() - 0.5) * 30, vy: 4 + S.R() * 5, t: -S.R() * 2, life: 9, ph: S.R() * 6, z: 20 + S.R() * 40 }); f.rebuildT = 0; f.rebuild = 0;
    for (const a of free()) H.assign(a, [{ k: 'face', x, y: y + 40 }, { k: 'hop', t: 0.9 }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 4 }, { k: 'bubble', kind: 'star' }], 'mini'); R.wait = o.t || 5; };
  O.hps_peace = (R, o) => { const f = S.hps; f.darkT = 0; f.rainT = 0; f.eyesT = 0; f.tstate = 'ok'; for (const k of BUILD) f.fireT[k] = 0; f.rebuildT = 0; };


  // ---------------------------------------------------------------- the giant black bear (true form): a dedicated PixelLab sprite with its own animations (roar / walk / swipe / slam / hurt), depth-sorted like the turtle
  const GANIM = { idle: { fps: 4, n: 1 }, roar: { fps: 5, n: 9 }, walk: { fps: 9, n: 9, loop: 1 }, swipe: { fps: 8, n: 9 }, slam: { fps: 7, n: 9 }, hurt: { fps: 6, n: 9 } };
  const shock = (x, y, big) => { const f = S.hps; f.rings.push({ x, y, t: 0, life: big ? 2.4 : 1.3, big: big ? 1 : 0 }); f.shake = Math.max(f.shake, big ? 1.2 : 0.4); f.windKick = Math.max(f.windKick, big ? 1 : 0.35); f.shockAt = S.t; f.shockXY = [x, y];
    for (let q = 0; q < (big ? 16 : 6); q++) f.rocks.push({ x: x + (S.R() - 0.5) * 150, y: y + (S.R() - 0.5) * 90, z: 70 + S.R() * 60, t: -S.R() * 1.2, life: 1.6 + S.R() * 0.6, sz: 1 + (S.R() < 0.3 ? 1 : 0) });
    if (big) for (let q = 0; q < 12; q++) f.flocks.push({ kind: 'crow', x: x + (S.R() - 0.5) * 50, y: y + (S.R() - 0.5) * 30, vx: 10 + S.R() * 6, vy: -4 + S.R() * 8, t: -S.R() * 0.4, life: 14, ph: q }); };
  const gSet = (anim, hooks, after) => { const g = S.hps.giant; if (!g) return; g.anim = anim; g.at = 0; g.hooks = (hooks || []).map(h => Object.assign({}, h)); g.after = after || null; g.lastFr = -1; };
  function tickGiant(f, dt) {
    const g = f.giant; if (!g) return; g.t += dt; g.at += dt; const A0 = GANIM[g.anim] || GANIM.idle, raw = Math.floor(g.at * A0.fps), fr = A0.loop ? raw % A0.n : Math.min(A0.n - 1, raw);
    if (fr !== g.lastFr) { g.lastFr = fr; g.fr = fr; for (const h of g.hooks) if (!h.done && h.fr === fr) { h.done = true; h.fn(g); }
      if (g.anim === 'walk' && (fr === 2 || fr === 6)) { f.shake = Math.max(f.shake, g.charge ? 0.55 : 0.3); f.dust.push({ x: g.x + (S.R() - 0.5) * 20, y: g.y + 6, t: 0, life: 2.2, z: 0 }); if (g.charge) f.rocks.push({ x: g.x, y: g.y, z: 60, t: 0, life: 1.2, sz: 1 }); } }
    if (!A0.loop && g.anim !== 'idle' && g.at * A0.fps >= A0.n + 0.5 && !g.route) gSet(g.after || 'idle');
    if (g.phase === 'smoke') { g.alpha = Math.min(1, g.t / 2.2); g.scale = 0.55 + 0.45 * Math.min(1, g.t / 2.4); if (g.t > 2.6) g.phase = 'live'; }
    else if (g.phase === 'dissolve') { g.dis = (g.dis || 0) + dt; g.alpha = Math.max(0, 1 - g.dis / 3.2); g.scale = 1 - 0.1 * g.dis / 3.2; if (g.dis > 3.4) { f.giant = null; return; } }
    if (g.route) { const [tx, ty] = g.route[0], dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy), sp = (g.speed || 10) * dt; if (d > 0.01 && Math.abs(dx - dy) > 0.6) g.face = (dx - dy) > 0 ? 1 : -1; if (d <= sp) { g.x = tx; g.y = ty; g.route.shift(); if (!g.route.length) { g.route = null; g.charge = false; if (g.anim === 'walk') gSet(g.arrive || 'idle', g.arriveHooks); } } else { g.x += dx / d * sp; g.y += dy / d * sp; } }
  }
  const G = () => S.hps.giant;
  const gWalk = (pts, speed, charge, arrive, hooks) => { const g = G(); if (!g) return; g.route = pts; g.speed = speed; g.charge = !!charge; g.arrive = arrive || 'idle'; g.arriveHooks = hooks || []; gSet('walk'); };
  const wkJump = (R, x, y, lift, t, then) => { const wk = act(R, 'wk'); if (!wk) return; const np = H.nearestWalk(x, y, B, 5); if (np) { x = np[0]; y = np[1]; } H.assign(wk, [{ k: 'hpscall', fn: q => { q.flying = true; } }, { k: 'arc', x, y, t: t || 1.1, lift: lift || 20, spin: 0 }, { k: 'hpscall', fn: q => { q.flying = false; q.lift = 0; } }].concat(then || [{ k: 'idle', t: 600 }]), 'story'); };
  const knock = (R, id, dx, dy) => { const a = act(R, id); if (!a) return; const p = H.nearestWalk(a.x + dx, a.y + dy, B, 4) || [a.x, a.y]; H.assign(a, [{ k: 'hpscall', fn: q => { q.flying = true; } }, { k: 'arc', x: p[0], y: p[1], t: 0.9, lift: 12, spin: 0 }, { k: 'hpscall', fn: q => { q.flying = false; q.lift = 0; } }, { k: 'bubble', kind: 'excl' }, { k: 'idle', t: 600 }], 'story'); };
  O.hps_steal = (R, o) => {   // Hắc Hùng Tinh snatches the abbot's precious kasaya from the burning hall
    const f = S.hps, bear = act(R, 'bear'); if (bear) H.assign(bear, [{ k: 'face', x: F.temple[0] * T + 20, y: F.temple[1] * T + 30 }, { k: 'act', t: 1.4 }, { k: 'hpscall', fn: () => { f.kasaya = 1; bursts(bear.x, bear.y - 6, 'gold'); } }, { k: 'hop', t: 0.7 }, { k: 'bubble', kind: 'star' }, { k: 'idle', t: 600 }], 'story');
    for (const a of free().slice(0, 7)) H.assign(a, [{ k: 'face', x: bear ? bear.x : 0, y: bear ? bear.y : 0 }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 4 }, { k: 'bubble', kind: 'dots' }], 'mini'); R.wait = o.t || 3.6; };
  O.hps_chase = (R, o) => {   // the demon runs for his cave with the kasaya; the pilgrims follow and corner him on the lair ledge
    const lair = TW(7.5, 27.5), road = TW(13.5, 26.5), spots = [[0, 0], [-1.5, 1.4], [1.2, 1.6], [0, 2.6]];
    FOES.forEach((id, n) => { const a = act(R, id); if (!a) return; const p = H.nearestWalk(lair[0] + spots[n][0] * T, lair[1] + spots[n][1] * T, B, 4) || lair; a.story = R; H.assign(a, [{ k: 'wait', t: n * 0.3 }, H.go(p[0], p[1], { run: id === 'bear' ? 1.5 : 1.8 }), { k: 'face', x: road[0], y: road[1] }, { k: 'idle', t: 600 }], 'story'); });
    PILGRIMS.forEach(([id], n) => { const a = act(R, id); if (!a) return; const p = H.nearestWalk(road[0] + (id === 'wk' ? -2 : 3 + n * 1.6), road[1] + (n % 2 ? 4 : -3), B, 4) || road; H.assign(a, [{ k: 'wait', t: n * 0.4 }, H.go(p[0], p[1], { run: 1.9 }), { k: 'face', x: lair[0], y: lair[1] }, { k: 'idle', t: 600 }], 'story'); });
    const t0 = S.t; pend(R, () => S.t - t0 > 70 || ['bear', 'wk'].every(id => { const a = act(R, id); return !a || (a.cur && a.cur.k === 'idle'); })); };
  O.hps_taunt = (R, o) => { const wk = act(R, 'wk'), bear = act(R, 'bear'); if (wk) H.assign(wk, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.8 }, { k: 'act', t: 1.1 }, { k: 'idle', t: 600 }], 'story'); if (bear) H.assign(bear, [{ k: 'bubble', kind: 'dots' }, { k: 'hop', t: 0.8 }, { k: 'bubble', kind: 'star' }, { k: 'idle', t: 600 }], 'story'); R.wait = o.t || 3.2; };
  O.hps_transform = (R, o) => {   // black smoke swirls and the demon becomes an enormous black bear
    const f = S.hps, bear = act(R, 'bear'); if (!bear) { R.wait = 1; return; } const x = bear.x + 6, y = bear.y + 10; f.darkT = 0.85; f.dRate = 0.3; f.eyesT = 1; f.flash = 1; f.shake = 1; bursts(bear.x, bear.y, 'smoke'); shock(bear.x, bear.y, false);
    bear.hidden = true; f.giant = { x, y, face: 1, phase: 'smoke', t: 0, alpha: 0, scale: 0.55, anim: 'idle', at: 0, hooks: [], fr: 0, lastFr: -1 }; f.bearA = null;
    for (const id of ['m1', 'm2', 'm3']) { const a = act(R, id); if (a) { const p = H.nearestWalk(a.x - 30, a.y - 22, B, 5) || [a.x, a.y]; H.assign(a, [{ k: 'bubble', kind: 'excl' }, H.go(p[0], p[1], { run: 2 }), { k: 'hpsfade' }], 'story'); } }
    for (const [id] of PILGRIMS) { const a = act(R, id); if (a) H.assign(a, [{ k: 'bubble', kind: id === 'monk' ? 'dots' : 'excl' }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 600 }], 'story'); } R.wait = o.t || 3.4; };
  O.hps_roar = (R, o) => { const g = G(); if (!g) { R.wait = 1; return; } gSet('roar', [{ fr: 4, fn: q => { shock(q.x, q.y, true); for (const [id] of PILGRIMS) knock(R, id, id === 'wk' ? 14 : 22, id === 'wk' ? 4 : -8); for (const a of free().slice(0, 6)) H.assign(a, [{ k: 'hop', t: 0.6 }, { k: 'bubble', kind: 'excl' }, { k: 'idle', t: 4 }], 'mini'); } }]); R.wait = o.t || 3.2; };
  O.hps_g_swipe = (R, o) => { const g = G(), wk = act(R, 'wk'); if (!g || !wk) { R.wait = 1; return; } g.face = (wk.x - wk.y) - (g.x - g.y) > 0 ? 1 : -1; const [hx, hy] = [wk.x, wk.y];
    gSet('swipe', [{ fr: 4, fn: q => { bursts(hx - 6, hy - 10, 'slash'); shock(hx, hy, false); } }]); later(0.45, () => wkJump(R, hx + 30, hy - 14, 24, 1.0, [{ k: 'bubble', kind: 'star' }, { k: 'idle', t: 600 }])); R.wait = o.t || 2.4; };
  O.hps_g_counter = (R, o) => { const g = G(), wk = act(R, 'wk'); if (!g || !wk) { R.wait = 1; return; } wkJump(R, g.x + 6, g.y + 3, 34, 0.9, [{ k: 'hpscall', fn: q => { bursts(g.x, g.y - 24, 'clash'); S.hps.bearAura = 1; shock(g.x, g.y, false); } }, { k: 'act', t: 1 }, { k: 'idle', t: 600 }]);
    later(0.9, () => gSet('hurt', [], 'idle')); const bj = act(R, 'bj'); if (bj) H.assign(bj, [{ k: 'face', x: g.x, y: g.y }, { k: 'act', t: 1.2 }, { k: 'hop', t: 0.6 }, { k: 'act', t: 1.2 }, { k: 'idle', t: 600 }], 'story'); R.wait = o.t || 3.2; };
  O.hps_g_slam = (R, o) => { const g = G(); if (!g) { R.wait = 1; return; } gSet('slam', [{ fr: 5, fn: q => { shock(q.x, q.y, true); bursts(q.x, q.y, 'collapse'); for (const [id] of PILGRIMS) knock(R, id, id === 'wk' ? 12 : 20, id === 'sha' ? 10 : -6); } }]); R.wait = o.t || 3.4; };
  O.hps_g_charge = (R, o) => { const g = G(), wk = act(R, 'wk'); if (!g) { R.wait = 1; return; } const to = TW(15.5, 26.5); g.face = 1; wkJump(R, wk ? wk.x - 4 : to[0], (wk ? wk.y : to[1]) - 30, 30, 1.0, [{ k: 'bubble', kind: 'star' }, { k: 'idle', t: 600 }]);
    gWalk([to], 22, true, 'hurt', [{ fr: 1, fn: q => { shock(q.x, q.y, true); bursts(q.x, q.y, 'collapse'); } }]); pend(R, () => !G() || (!G().route && G().anim !== 'walk')); };
  O.hps_g_retreat = (R, o) => { const g = G(); if (!g) { R.wait = 1; return; } g.face = -1; gWalk([TW(11, 27.2), TW(6.8, 28.2)], 7, false, 'hurt'); const wk = act(R, 'wk'); if (wk) H.assign(wk, [{ k: 'face', x: g.x, y: g.y }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: 600 }], 'story'); pend(R, () => !G() || (!G().route)); };
  O.hps_guanyin = (R, o) => {   // Guanyin descends in a column of golden light; the bear is bound by golden rings
    const f = S.hps, gy = act(R, 'gy'), g = G(); f.guanT = 1; f.flash = 1; f.rainT = 0.7; f.darkT = 0.2; f.dRate = 0.3; if (g) { g.bound = true; gSet('hurt', [], 'idle'); }
    if (gy) { const q = TW(10.5, 25.5), p = H.nearestWalk(q[0], q[1], B, 4) || [gy.x, gy.y]; gy.story = R; H.assign(gy, [{ k: 'wait', t: 0.5 }, H.go(p[0], p[1], { run: 0.9 }), { k: 'bubble', kind: 'star' }, { k: 'idle', t: 600 }], 'story'); }
    for (const [id] of PILGRIMS) { const a = act(R, id); if (a) H.assign(a, [{ k: 'face', x: g ? g.x : 0, y: g ? g.y : 0 }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 600 }], 'story'); } R.wait = o.t || 5; };
  O.hps_subdue = (R, o) => {   // the giant dissolves into smoke; the demon kneels and returns the kasaya
    const f = S.hps, g = G(), bear = act(R, 'bear'); if (g) { g.phase = 'dissolve'; g.dis = 0; g.bound = false; bursts(g.x, g.y, 'smoke'); f.eyesT = 0; }
    if (bear) { const p = H.nearestWalk(g ? g.x : bear.x, g ? g.y : bear.y, B, 4) || [bear.x, bear.y]; bear.x = p[0]; bear.y = p[1]; bear.hidden = false; bear.alpha = 1; f.bearA = bear; H.assign(bear, [{ k: 'sit', t: 5 }, { k: 'hpscall', fn: () => { f.kasaya = 2; bursts(bear.x, bear.y, 'gold'); } }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 600 }], 'story'); }
    f.rainT = 1; f.fRate = 0.07; for (const k of BUILD) f.fireT[k] = 0; R.wait = o.t || 4.5; };
  O.hps_guanyin_leave = (R, o) => { const gy = act(R, 'gy'), bear = act(R, 'bear'); S.hps.guanT = 0; for (const a of [gy, bear]) if (a) { a.story = R; H.assign(a, [{ k: 'bubble', kind: 'heart' }, { k: 'idle', t: 2.5 }, { k: 'hpsfade' }], 'story'); } pend(R, () => [gy, bear].every(a => !a || a.gone)); };

  D.beacon.hps = '255,170,90';
  D.biomes.hps = {
    residents: [['hps_monk', 5, 'monk'], ['hps_novice', 3, 'novice'], ['hps_abbot', 1, 'abbot'], ['sdl_porter', 2, 'porter'], ['hps_minion', 2, 'minion']],
    roles: {
      monk: [['hps_sweep', 3], ['hps_chant', 3], ['hps_incense', 2], ['hps_sutra', 3], ['hps_bell', 1], ['hps_cook', 1], ['hps_look', 1], ['hps_shrine', 1], ['hps_train', 2], ['hps_water', 1], ['hps_patrol', 1], ['hps_build', 3]],
      novice: [['hps_sweep', 4], ['hps_water', 3], ['hps_cook', 2], ['hps_stream', 2], ['hps_train', 2], ['hps_sutra', 1], ['hps_carry', 1], ['hps_incense', 1], ['hps_build', 3]],
      abbot: [['hps_patrol', 4], ['hps_chant', 3], ['hps_look', 2], ['hps_shrine', 2], ['hps_sutra', 1]],
      porter: [['hps_carry', 5], ['hps_water', 1], ['hps_look', 1], ['hps_stream', 1], ['hps_build', 3]],
      minion: [['hps_guard', 5], ['hps_look', 1]],
    },
    minis: ['hps_bell', 'hps_procession', 'hps_flock', 'hps_shower', 'hps_leaves', 'hps_chant_all', 'hps_lair_peek', 'hps_porters'],
    stories: [
      { id: 'black_bear_fire', title: ['Hắc Hùng Tinh Đốt Chùa', 'The Black Bear and the Burning Temple'],
        fore: [['hps', { dark: 0.3, wind: 2, rate: 0.06, eyes: 0.6 }], ['hps_unease', { t: 4 }]],
        beats: [
          ['hps', { dark: 0.6, eyes: 1, rate: 0.12 }],
          ['spawn', { id: 'bear', char: 'hac_hung_tinh', at: 'hps_lair', off: [0, 0] }], ['spawn', { id: 'm1', char: 'hps_minion', at: 'hps_lair', off: [-1.5, 1] }], ['spawn', { id: 'm2', char: 'hps_minion', at: 'hps_lair', off: [1.5, 1.2] }], ['spawn', { id: 'm3', char: 'hps_minion', at: 'hps_lair', off: [0, 2.5] }],
          ['wait', { t: 1.5 }], ['hps_march', {}], ['hps_torch', { t: 4.5 }],
          ['hps', { fire: { temple: 1, pagoda: 0.5, dorm: 0.3 }, frate: 0.1, dark: 0.7 }], ['hps_panic', { t: 3 }], ['wait', { t: 4 }],
          ['hps', { fire: { temple: 1, pagoda: 0.9, dorm: 0.8, kitchen: 0.5, sutra: 0.4 } }], ['wait', { t: 4.5 }], ['hps_collapse', { t: 3.5 }],
          ['hps_steal', { t: 3.6 }],
          ['spawn', { id: 'monk', char: 'tam_tang', at: 'hps_gate', off: [0, 0.4] }], ['spawn', { id: 'wk', char: 'wukong', at: 'hps_gate', off: [-0.8, -0.4] }], ['spawn', { id: 'bj', char: 'bajie', at: 'hps_gate', off: [-1.6, 0.4] }], ['spawn', { id: 'sha', char: 'sa_tang', at: 'hps_gate', off: [-2.4, -0.4] }],
          ['wait', { t: 1 }], ['hps_chase', {}], ['hps_taunt', { t: 3.2 }],
          ['hps_transform', { t: 3.4 }], ['hps_roar', { t: 3.4 }], ['hps_g_swipe', { t: 2.6 }], ['hps_g_counter', { t: 3.4 }], ['hps_g_slam', { t: 3.6 }], ['hps_g_charge', {}], ['wait', { t: 1.5 }], ['hps_g_retreat', {}],
          ['spawn', { id: 'gy', char: 'guanyin', at: 'hps_lair', off: [3, -2] }], ['hps_guanyin', { t: 5 }], ['hps_subdue', { t: 4.5 }], ['hps_thanks', {}], ['hps_guanyin_leave', {}], ['hps_leave', {}], ['disperse', {}]],
        after: { fx: 'petals', at: 'hps_hall', r: 30 },
        recover: [['hps', { rain: 0.4, dark: 0, fire: { temple: 0.15, pagoda: 0, dorm: 0, kitchen: 0, bell: 0, sutra: 0 } }], ['wait', { t: 5 }], ['hps_scaffold', { t: 2 }], ['hps_builders', { t: 4 }], ['wait', { t: 14 }], ['hps_builders', { t: 4 }], ['wait', { t: 14 }], ['hps_new', { t: 5 }], ['hps_peace', {}], ['wait', { t: 3 }]] },
    ],
  };
})();
