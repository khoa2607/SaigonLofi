'use strict';
// ===== Tây Du Ký v2 — Ngũ Hành Sơn: seasons, wildlife, residents, mini events and the signature (DOM-free; loaded after tw-sim.js and tw-hps-data.js) =====
// Visible state lives in TWS.nhs (read by tw-nhs-fx.js and tw-nhs-art.js): sp (season phase 0..4: spring, summer, autumn, winter; the blend a -> b by f), tl (the 500-year time-lapse), age 0..1 (moss, growth), wind / gust,
// rain / storm / flash, surge (the waterfalls swell), shake, seal ('on' | 'lift' | 'gone' | 'return'), prison (Wukong's animation: idle | struggle | plead | hope | burst | empty), flocks, bursts, dust, rocks, cracks.
// Signature - "Năm Trăm Năm Dưới Núi" (Five Hundred Years Beneath the Mountain): Wukong lies pinned under the mountain while the seasons race (500 years; moss, growth, drifting clouds) -> time slows as Tang Sanzang rides up on his
// white horse -> he dismounts, Wukong pleads -> he climbs the sacred path to the summit and lifts the golden seal -> the mountain trembles, light bursts through the cracks, Wukong leaps into the sky -> he lands before the monk, changes
// into the simple pilgrim robes, kneels and bows -> master and disciple leave together with the horse -> dust settles, the mountain recovers and the legend begins again.
(function () {
  const S = TWS, H = S.H, D = window.TW_DATA, B = 'nhs', F = TWM.nhs, T = 8;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = (v, t, r, dt) => Math.abs(t - v) <= r * dt ? t : v + Math.sign(t - v) * r * dt, sm = t => t * t * (3 - 2 * t);
  const TW = (a, b) => [(F.x0 + a + 0.5) * T, (F.y0 + b + 0.5) * T];
  const SSEC = 150;                                    // idle: seconds per season (a full year every 10 minutes)
  const PA = { idle: { fps: 5, n: 9 }, struggle: { fps: 9, n: 9 }, plead: { fps: 8, n: 9 }, hope: { fps: 6, n: 9 } };
  const newState = () => ({ sp: 0, sa: 1, sb: 1, sf: 0, tl: { on: false, rate: 0, p: 0, years: 0, show: 0, t0: 0, dur: 66, slow: false }, age: 0, ageT: 0.12, gust: 1, wind: 1, windT: 1, rain: 0, rainT: 0, storm: 0, stormT: 0, flash: 0, flashClock: 5, surge: 0, surgeT: 0, shake: 0, shockAt: -99,
    seal: { st: 'on', t: 0 }, prison: { anim: 'idle', t0: 0, next: 30, hold: false, burst: false, empty: 0, ghost: 0 }, flocks: [], bursts: [], dust: [], rocks: [], light: 0, lightT: 0, glow: 0, glowT: 0, rainbow: 0, offer: 0, cracks: 0, cracksT: 0, calm: 0, mist: 0.4, mistT: 0.4, snowAcc: 0, caption: null, ride: null, ghostT: 0 });
  const baseInit = S.init, baseTick = S.tick;
  S.init = function (seed) { S.nhs = newState(); baseInit(seed); S.nhs.sp = 0.4 + S.R() * 3.2; };
  S.tick = function (dt) {
    baseTick(dt); const f = S.nhs; if (!f) return; const tl = f.tl;
    // ---- seasons: phase advances one unit per season; the time-lapse races it, then slows to a stop at spring
    let rate = 1 / SSEC;
    if (tl.on) { tl.p = clamp((S.t - tl.t0) / tl.dur, 0, 1); const fast = 1 / 5.4; if (!tl.slow) { tl.rate = ease(tl.rate, fast * sm(clamp((S.t - tl.t0) / 4, 0, 1)), 0.05, dt); if (tl.p >= 1) tl.slow = true; } else { const ph = ((f.sp % 4) + 4) % 4; tl.rate = ease(tl.rate, 1 / 14, 0.08, dt); if (ph > 0.15 && ph < 0.6) tl.on = false; }
      rate = tl.rate; tl.years = Math.round(500 * sm(tl.p)); tl.show = ease(tl.show, tl.p < 1 ? 1 : 0, 1.2, dt); f.ageT = Math.max(f.ageT, sm(Math.min(1, tl.p * 1.15))); }
    else tl.show = ease(tl.show, 0, 1.2, dt);
    f.sp += dt * rate; { const p = ((f.sp % 4) + 4) % 4, a = Math.floor(p), fr = p - a; f.sa = a; f.sb = (a + 1) % 4; f.sf = sm(clamp((fr - 0.62) / 0.38, 0, 1)); }
    f.age = ease(f.age, f.ageT, tl.on ? 0.05 : 0.004, dt);
    const season = f.sf > 0.5 ? f.sb : f.sa;
    // ---- weather
    f.rain = ease(f.rain, f.rainT, 0.15, dt); f.storm = ease(f.storm, f.stormT, 0.2, dt); f.glow = ease(f.glow, f.glowT, 0.3, dt); f.light = ease(f.light, f.lightT, 0.4, dt); f.cracks = ease(f.cracks, f.cracksT, 0.5, dt); f.surge = ease(f.surge, f.surgeT, 0.12, dt); f.mist = ease(f.mist, f.mistT, 0.05, dt);
    f.shake = Math.max(0, f.shake - dt * 1.2); f.flash = Math.max(0, f.flash - dt * 2); f.rainbow = ease(f.rainbow, f.rain < 0.05 && f.rainbowT > S.t ? 1 : 0, 0.12, dt); f.offer = Math.max(0, f.offer - dt);
    f.windT = f.storm > 0.3 ? 2.6 : 1 + 0.35 * Math.sin(S.t * 0.06) + (season === 2 ? 0.2 : 0) + (Math.sin(S.t * 0.29) > 0.93 ? 0.7 : 0); f.wind = ease(f.wind, f.windT, 0.5, dt); f.gust = 1 + (f.wind - 1) * 1.6 + f.shake * 3;
    f.flashClock -= dt; if (f.storm > 0.5 && f.flashClock <= 0) { f.flash = 1; f.flashClock = 2 + S.R() * 4; }
    if (season === 0 && !tl.on && f.rainT === 0 && S.R() < dt * 0.002) { f.rainT = 0.32; later(25 + S.R() * 20, () => { if (S.nhs.stormT < 0.2) S.nhs.rainT = 0; }); }
    for (const q of f.flocks) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; } f.flocks = f.flocks.filter(q => q.t < q.life);
    for (const b of f.bursts) b.t += dt; f.bursts = f.bursts.filter(b => b.t < 2.4);
    for (const q of f.dust) q.t += dt; f.dust = f.dust.filter(q => q.t < q.life); for (const q of f.rocks) q.t += dt; f.rocks = f.rocks.filter(q => q.t < q.life);
    // ---- the seal and the prison
    const sl = f.seal; sl.t += dt; if (sl.st === 'lift' && sl.t > 4.5) { sl.st = 'gone'; sl.t = 0; } else if (sl.st === 'return' && sl.t > 6) { sl.st = 'on'; sl.t = 0; }
    const pr = f.prison; if (pr.ghost > 0 || pr.empty > 0) { /* eased by ops */ }
    if (!pr.hold && !pr.burst && S.t > pr.next) { if (pr.anim === 'idle') { pr.anim = 'struggle'; pr.t0 = S.t; pr.next = S.t + 2.5 + S.R() * 2; if (S.R() < 0.7) wukongStruggle(); } else { pr.anim = 'idle'; pr.t0 = S.t; pr.next = S.t + (tl.on ? 14 : 26) + S.R() * 40; } }
    // ---- riders follow their mount
    for (const a of S.agents) if (a.rideOf) { const h = a.rideOf; if (h.gone || h.hidden) { a.rideOf = null; a.lift = 0; continue; } a.x = h.x; a.y = h.y; a.gz = h.gz; a.dir = h.dir; a.lift = 9.5 + (h.moving ? Math.sin(S.t * 8) * 0.5 : 0); a.pose = 'sit'; a.moving = false; a.key = h.x + h.y + 0.9; }
    for (let i = timers.length - 1; i >= 0; i--) if (S.t >= timers[i].at) { const t = timers.splice(i, 1)[0]; t.fn(); }
  };
  const timers = []; const later = (sec, fn) => timers.push({ at: S.t + sec, fn });
  const burst = (x, y, kind) => S.nhs.bursts.push({ x, y, t: 0, kind: kind || 'dust' });
  const wild = () => S.agents.filter(a => a.biome === B && ['deer', 'goat', 'monkey'].includes(a.role) && !a.gone && !a.hidden);
  function wukongStruggle() { const f = S.nhs, [x, y] = TW(11.5, 24.5); f.shake = Math.max(f.shake, 0.25); for (let q = 0; q < 6; q++) f.rocks.push({ x: x + (S.R() - 0.5) * 40, y: y + (S.R() - 0.5) * 16, z: 30 + S.R() * 30, t: -S.R() * 0.4, life: 1.2 + S.R() * 0.4, sz: 1 }); burst(x, y + 6, 'dust');
    for (let q = 0; q < 5; q++) f.flocks.push({ kind: 'bird', x: x + (q - 2) * 5, y: y - 10, vx: 8 + S.R() * 6, vy: -9 - S.R() * 5, t: -S.R() * 0.3, life: 10, ph: q, z: 12 }); for (const a of wild()) if (free(a) && Math.hypot(a.x - x, a.y - y) < 120) H.assign(a, [{ k: 'face', x, y }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }, { k: 'idle', t: 2.5 }], 'mini'); }
  const free = a => H.free(a);
  const near = (a, rad) => { const p = TWM.randomWalkable(a.biome, S.R, [Math.floor(a.x / T), Math.floor(a.y / T)], rad); return p ? [(p[0] + 0.5) * T, (p[1] + 0.5) * T] : null; };
  const X = S.stepExt, P = S.pointExt;
  X.nhscall = (a, st) => { st.fn(a); return true; };
  X.nhsfade = (a, st, dt) => { st.el = (st.el || 0) + dt; a.alpha = Math.max(0, 1 - st.el / 1.4); if (st.el >= 1.4) { a.gone = true; return true; } return false; };
  P.nhs_gate = () => TW(6.4, 32.4); P.nhs_court = () => TW(12.5, 27.8); P.nhs_prison = () => TW(11.5, 26.6); P.nhs_summit = () => TW(15.5, 13.5); P.nhs_seal = () => TW(14.6, 13.4); P.nhs_meadow = () => TW(14, 31);

  // ---------------------------------------------------------------- activities (people)
  const A = S.ACT, pois = k => H.pois(B, k);
  const post = (kind, a, dir, extra) => { const p = H.poiFree(B, kind); if (!p) return A.stroll(a); H.claim(a, p); return [H.go(p.x, p.y), { k: 'face', dir: p.face || dir || 'up' }].concat(extra || [{ k: 'idle', t: H.rnd(6, 12) }]).concat([{ k: 'release', poi: p }]); };
  A.nhs_graze = a => { H.count('graze'); return post('ngraze', a, 'down', [{ k: 'act', t: H.rnd(5, 9) }, { k: 'idle', t: H.rnd(1.5, 3) }, { k: 'act', t: H.rnd(4, 8) }, { k: 'idle', t: H.rnd(2, 4) }]); };
  A.nhs_drink = a => { H.count('drink'); return post('ndrink', a, 'up', [{ k: 'act', t: H.rnd(3, 5) }, { k: 'idle', t: 1.2 }, { k: 'act', t: H.rnd(2, 4) }, { k: 'idle', t: H.rnd(2, 3) }]); };
  A.nhs_ledge = a => { H.count('ledge'); return post('nclimb', a, 'up', [{ k: 'idle', t: H.rnd(7, 13) }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: H.rnd(3, 6) }]); };
  A.nhs_play = a => { const ps = [0, 1, 2].map(() => near(a, 9)).filter(Boolean); H.count('play'); return ps.length ? ps.flatMap(p => [H.go(p[0], p[1], { run: 1.7 }), { k: 'hop', t: 0.7 }]).concat([{ k: 'bubble', kind: 'note' }]) : A.stroll(a); };
  A.nhs_forage = a => { H.count('forage'); return post('ngraze', a, 'down', [{ k: 'act', t: 3 }, { k: 'carry', what: 'fruit' }, { k: 'idle', t: 1.5 }, { k: 'sit', t: 3 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }]); };
  A.nhs_hut = a => { H.count('hut'); return post('nhut', a, 'up', [{ k: 'act', t: H.rnd(3, 5) }, { k: 'sit', t: H.rnd(6, 12) }, { k: 'bubble', kind: 'note' }]); };
  A.nhs_offering = a => { const p = H.poiFree(B, 'nprison'); if (!p) return A.nhs_hut(a); H.claim(a, p); H.count('offering'); return [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'carry', what: 'fruit' }, { k: 'idle', t: 1 }, { k: 'nhscall', fn: () => { S.nhs.offer = 14; S.nhs.prison.anim = 'hope'; S.nhs.prison.t0 = S.t; S.nhs.prison.hold = true; later(7, () => { S.nhs.prison.hold = false; S.nhs.prison.anim = 'idle'; S.nhs.prison.next = S.t + 20; }); } }, { k: 'act', t: 2 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 5 }, { k: 'release', poi: p }]; };
  A.nhs_chop = a => { H.count('chop'); return post('nwood', a, 'down', [{ k: 'act', t: 3.2 }, { k: 'idle', t: 0.6 }, { k: 'act', t: 3.2 }, { k: 'idle', t: 0.6 }, { k: 'act', t: 3.2 }, { k: 'carry', what: 'sack' }, { k: 'idle', t: 2 }, { k: 'carry', what: null }]); };
  A.nhs_rest = a => { H.count('rest_n'); return post('nrest', a, 'up', [{ k: 'sit', t: H.rnd(10, 20) }, { k: 'bubble', kind: 'note' }, { k: 'sit', t: H.rnd(4, 8) }]); };
  A.nhs_shrine = a => { H.count('shrine_n'); return post('nshrine', a, 'up', [{ k: 'act', t: 2.2 }, { k: 'idle', t: H.rnd(4, 8) }, { k: 'bubble', kind: 'heart' }]); };
  A.nhs_look = a => { H.count('look_n'); return post('nlook', a, 'left', [{ k: 'idle', t: H.rnd(8, 14) }, { k: 'bubble', kind: 'q' }, { k: 'idle', t: H.rnd(3, 6) }]); };
  A.nhs_pray = a => { const p = H.poiFree(B, 'nprison'); if (!p) return A.nhs_rest(a); H.claim(a, p); H.count('pray'); return [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'sit', t: H.rnd(8, 14) }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 3 }, { k: 'release', poi: p }]; };
  A.nhs_walk = a => { const g = TW(6.4, 32.4), t = TW(22, 2.5), cands = [g, t, TW(14, 31), TW(23, 26)], p = cands[Math.floor(S.R() * cands.length)]; H.count('walk_n'); return [H.go(p[0], p[1], { run: 1 }), { k: 'idle', t: H.rnd(2, 5) }]; };

  // ---------------------------------------------------------------- mini events
  const M = S.MINI, some = (roles, n) => S.agents.filter(a => a.biome === B && roles.includes(a.role) && !a.gone && !a.hidden && free(a)).slice(0, n);
  const lookAt = (xy, who) => { for (const a of who) H.assign(a, [{ k: 'face', x: xy[0], y: xy[1] }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }, { k: 'idle', t: 2.4 }], 'mini'); };
  const SEASON = () => S.nhs.sf > 0.5 ? S.nhs.sb : S.nhs.sa;
  M.nhs_monkeys = b => {   // a monkey snatches fruit, two others chase it round the meadow; it is cornered, shares and all sit
    const m = some(['monkey'], 3); if (m.length < 2) return false; const p0 = pois('ngraze'), pts = [near(m[0], 12), near(m[0], 12), p0.length ? [p0[0].x, p0[0].y] : near(m[0], 12)].filter(Boolean);
    H.assign(m[0], [{ k: 'carry', what: 'fruit' }, { k: 'bubble', kind: 'star' }].concat(pts.flatMap(p => [H.go(p[0], p[1], { run: 2.3 }), { k: 'hop', t: 0.5 }])).concat([{ k: 'sit', t: 3 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }]), 'mini');
    m.slice(1).forEach((a, n) => H.assign(a, [{ k: 'wait', t: 0.6 + n * 0.4 }, { k: 'bubble', kind: 'excl' }].concat(pts.flatMap(p => [H.go(p[0] + (n ? 6 : -6), p[1] + 4, { run: 2.1 }), { k: 'hop', t: 0.5 }])).concat([{ k: 'sit', t: 3 }, { k: 'bubble', kind: 'dots' }]), 'mini')); H.count('monkeys'); return true; };
  M.nhs_deer_drink = b => {   // two or three deer come down to the stream together, drink, one startles, they trot off
    const d = some(['deer'], 3), ps = pois('ndrink'); if (d.length < 2 || ps.length < 2) return false;
    d.forEach((a, n) => { const p = ps[(n * 2) % ps.length], q = near(a, 14) || [a.x, a.y]; H.assign(a, [{ k: 'wait', t: n * 0.8 }, H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'act', t: 4 }, { k: 'idle', t: 1 }, { k: 'act', t: 3 }].concat(n === 0 ? [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.6 }, H.go(q[0], q[1], { run: 2 })] : [{ k: 'idle', t: 1.4 }, H.go(q[0], q[1], { run: 1.8 })]), 'mini'); }); H.count('deer_drink'); return true; };
  M.nhs_cranes = b => {   // a flock of cranes crosses the valley from the rim past the waterfalls
    const f = S.nhs, [x, y] = TW(24, 30); for (let q = 0; q < 8; q++) f.flocks.push({ kind: 'crane', x: x + q * 8, y: y + q * 5, vx: -9, vy: -7.5, t: -q * 0.35, life: 36, ph: q * 1.3, z: 70 + (q % 3) * 12 }); lookAt(TW(10, 24), some(['hermit', 'monk', 'wood'], 2).concat(some(['deer'], 1))); H.count('cranes'); return true; };
  M.nhs_rainstorm = b => {   // a sudden mountain storm: dark sky, driving rain, lightning; everyone runs for cover; a rainbow after
    const f = S.nhs; if (f.stormT > 0.1 || f.tl.on) return false; f.stormT = 1; f.rainT = 0.95; f.surgeT = 0.5; later(24, () => { f.stormT = 0; f.rainT = 0.05; f.rainbowT = S.t + 40; f.surgeT = 0.85; later(26, () => { f.surgeT = 0; }); });
    const hut = pois('nhut'); for (const a of S.agents.filter(q => q.biome === B && free(q) && !q.hidden)) { const p = hut.length ? hut[Math.floor(S.R() * hut.length)] : null; H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.5 }].concat(p ? [H.go(p.x, p.y, { run: 2 }), { k: 'idle', t: 20 }] : [{ k: 'idle', t: 10 }]), 'mini'); } H.count('rainstorm'); return true; };
  M.nhs_surge = b => {   // heavy rain upstream: the three waterfalls swell, foam and mist, deer startle
    const f = S.nhs; if (f.surgeT > 0.2 || f.stormT > 0.2) return false; f.surgeT = 1; f.mistT = 0.9; later(20, () => { f.surgeT = 0; f.mistT = 0.4; }); lookAt(TW(14, 27), some(['deer', 'goat', 'monkey'], 3)); H.count('surge'); return true; };
  M.nhs_scatter = b => {   // Wukong struggles: the rock shakes, birds burst out of the trees, stones fall, the animals freeze
    const f = S.nhs, pr = f.prison; if (pr.hold || pr.burst) return false; pr.anim = 'struggle'; pr.t0 = S.t; pr.next = S.t + 5; wukongStruggle(); f.shake = 0.6; for (const a of some(['hermit', 'monk', 'wood'], 2)) H.assign(a, [{ k: 'face', x: TW(11.5, 25)[0], y: TW(11.5, 25)[1] }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: 3 }], 'mini'); H.count('scatter'); return true; };
  M.nhs_wind = b => {   // the season's wind: petals (spring), dust and grass (summer), a sweep of leaves across the path (autumn), a snow flurry (winter)
    const f = S.nhs; f.windT = 3; f.windHold = S.t + 12; later(12, () => { S.nhs.windHold = 0; }); f.gustAt = S.t; f.gustSeason = SEASON(); if (SEASON() === 3 && f.rain < 0.1) { f.snowStorm = S.t + 16; } lookAt(TW(14, 31), some(['wood', 'monk', 'hermit'], 2)); H.count('wind'); return true; };
  M.nhs_snowstorm = b => { const f = S.nhs; if (SEASON() !== 3 || f.snowStorm > S.t) return false; f.snowStorm = S.t + 24; f.windT = 3; f.mistT = 0.9; later(24, () => { S.nhs.mistT = 0.4; }); for (const a of S.agents.filter(q => q.biome === B && free(q) && !q.hidden && q.role !== 'goat')) { const p = pois('nhut')[0]; if (p && S.R() < 0.7) H.assign(a, [{ k: 'bubble', kind: 'dots' }, H.go(p.x, p.y, { run: 1.6 }), { k: 'idle', t: 20 }], 'mini'); } H.count('snowstorm'); return true; };
  M.nhs_offering = b => { const h = some(['hermit'], 1)[0]; if (!h) return false; H.assign(h, A.nhs_offering(h), 'mini'); return true; };
  M.nhs_pilgrims = b => { const m = some(['monk'], 2); if (m.length < 1) return false; const p = pois('nprison')[0]; if (!p) return false; m.forEach((a, n) => H.assign(a, [{ k: 'wait', t: n }, H.go(p.x + n * 5, p.y + 3), { k: 'face', dir: 'up' }, { k: 'sit', t: 8 }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 2 }], 'mini')); H.count('pilgrims'); return true; };

  // ---------------------------------------------------------------- story ops
  const O = S.opExt, pend = (R, fn) => { const t0 = S.t; R.pend = () => { R.pendT = 0; return fn() || S.t - t0 > 150; }; }, act = (R, n) => R.actors[n];
  O.nhs = (R, o) => { const f = S.nhs; if (o.rain !== undefined) f.rainT = o.rain; if (o.wind !== undefined) f.windT = o.wind; if (o.mist !== undefined) f.mistT = o.mist; if (o.glow !== undefined) f.glowT = o.glow; if (o.age !== undefined) f.ageT = o.age; if (o.surge !== undefined) f.surgeT = o.surge; if (o.cracks !== undefined) f.cracksT = o.cracks; if (o.light !== undefined) f.lightT = o.light; if (o.flash) f.flash = 1; if (o.shake) f.shake = o.shake; if (o.calm !== undefined) f.calm = o.calm; };
  O.nhs_fore = (R, o) => { const f = S.nhs, [x, y] = TW(13.5, 12); f.glowT = 0.6; f.mistT = 0.8; f.windT = 0.6; for (const a of wild()) if (free(a)) H.assign(a, [{ k: 'face', x, y }, { k: 'idle', t: 8 }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: 6 }], 'mini'); for (let q = 0; q < 9; q++) f.flocks.push({ kind: 'bird', x: x + q * 4, y: y + 30, vx: -4, vy: 3, t: -q * 0.3, life: 20, ph: q, z: 30 }); R.wait = o.t || 3; };
  O.nhs_tl = (R, o) => {   // the 500 years: the seasons race, moss and vines grow, clouds stream, Wukong sags in his prison; a hermit leaves fruit half-way
    const f = S.nhs, tl = f.tl; tl.on = true; tl.slow = false; tl.t0 = S.t; tl.dur = o.dur || 66; tl.p = 0; tl.rate = 0; tl.years = 0; f.prison.hold = false; f.prison.anim = 'struggle'; f.prison.t0 = S.t; f.prison.next = S.t + 8; f.ageT = 1; f.glowT = 0.35;
    later(tl.dur * 0.45, () => { const h = some(['hermit'], 1)[0]; if (h) H.assign(h, A.nhs_offering(h), 'mini'); });
    later(tl.dur * 0.2, () => { M.nhs_monkeys(B); }); later(tl.dur * 0.62, () => { M.nhs_cranes(B); });
    R.wait = tl.dur + 5; };
  O.nhs_tl_end = (R, o) => { S.nhs.tl.on = false; };
  O.nhs_approach = (R, o) => {   // Tang Sanzang rides in on the white horse along the meadow road to the prison court; the wildlife stirs
    const f = S.nhs, h = act(R, 'horse'), m = act(R, 'monk'); if (!h || !m) { R.wait = 1; return; } f.ageT = 0.9; f.glowT = 0.5; h.story = R; m.story = R; m.rideOf = h; m.alpha = 1; h.alpha = 1;
    const c = P.nhs_court(), p = H.nearestWalk(c[0] - 6, c[1] + 12, B, 5) || c; H.assign(h, [{ k: 'wait', t: 0.4 }, H.go(p[0], p[1], { run: 1.15 }), { k: 'idle', t: 600 }], 'story'); H.assign(m, [{ k: 'idle', t: 600 }], 'story');
    for (const a of wild()) if (free(a)) { const q = near(a, 16) || [a.x, a.y]; H.assign(a, [{ k: 'wait', t: S.R() * 2 }, { k: 'face', x: h.x, y: h.y }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.6 }, a.role === 'monkey' ? { k: 'idle', t: 2 } : H.go(q[0], q[1], { run: 1.5 }), { k: 'idle', t: 8 }], 'mini'); }
    for (let q = 0; q < 8; q++) f.flocks.push({ kind: 'bird', x: h.x + (S.R() - 0.5) * 60, y: h.y - 40 + q * 3, vx: 6 + S.R() * 4, vy: -5, t: -q * 0.3, life: 14, ph: q, z: 20 });
    pend(R, () => !!(h.cur && h.cur.k === 'idle')); };
  O.nhs_dismount = (R, o) => {   // the monk steps down from the saddle, looks at the monkey under the rock; Wukong sees his chance
    const f = S.nhs, h = act(R, 'horse'), m = act(R, 'monk'); if (!h || !m) { R.wait = 1; return; } m.rideOf = null; m.lift = 0; m.pose = 'idle'; const pr = TW(11.5, 27.6), p = H.nearestWalk(pr[0] + 8, pr[1] + 6, B, 4) || pr; m.gz = TWM.groundZ(m.x, m.y);
    H.assign(m, [{ k: 'hop', t: 0.6 }, H.go(p[0], p[1], { run: 0.9 }), { k: 'face', x: TW(11.5, 24.5)[0], y: TW(11.5, 24.5)[1] }, { k: 'bubble', kind: 'excl' }, { k: 'idle', t: 600 }], 'story');
    H.assign(h, [{ k: 'bubble', kind: 'dots' }, { k: 'act', t: 3 }, { k: 'idle', t: 600 }], 'story'); f.prison.hold = true; f.prison.anim = 'hope'; f.prison.t0 = S.t; f.glowT = 0.7; later(3, () => { f.prison.anim = 'plead'; f.prison.t0 = S.t; });
    pend(R, () => !m.cur && !m.q.length || (m.cur && m.cur.k === 'idle')); };
  O.nhs_plea = (R, o) => {   // Wukong pleads; the monk looks up to the golden seal on the summit and nods
    const f = S.nhs, m = act(R, 'monk'); f.prison.anim = 'plead'; f.prison.t0 = S.t; if (m) { const s = TW(13.5, 11); H.assign(m, [{ k: 'bubble', kind: 'q' }, { k: 'face', x: s[0], y: s[1] }, { k: 'idle', t: 1.6 }, { k: 'bubble', kind: 'star' }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 600 }], 'story'); } f.glowT = 1; R.wait = o.t || 5.5; };
  O.nhs_climb = (R, o) => {   // up the sacred path to the summit shrine
    const m = act(R, 'monk'); if (!m) { R.wait = 1; return; } const p = H.nearestWalk(...P.nhs_seal(), B, 4) || P.nhs_seal(); H.assign(m, [{ k: 'bubble', kind: 'note' }, H.go(p[0], p[1], { run: o.run || 2.6 }), { k: 'face', x: TW(12.5, 12.5)[0], y: TW(12.5, 12.5)[1] }, { k: 'idle', t: 600 }], 'story');
    pend(R, () => Math.hypot(m.x - p[0], m.y - p[1]) < 6 && !m.moving); };
  O.nhs_seal = (R, o) => {   // the monk lifts the seal: it rises, blazes and dissolves; the mountain answers
    const f = S.nhs, m = act(R, 'monk'), [px, py] = TW(11.5, 24.5), [sx, sy] = TW(12.5, 12.5); if (m) H.assign(m, [{ k: 'act', t: 2.4 }, { k: 'idle', t: 600 }], 'story');
    later(1.8, () => { f.seal.st = 'lift'; f.seal.t = 0; f.glowT = 1; f.lightT = 1; burst(sx, sy, 'gold'); });
    later(4, () => { f.shake = 1.4; f.cracksT = 1; f.flash = 1; f.windT = 3; f.mistT = 0.1; for (let q = 0; q < 26; q++) f.rocks.push({ x: sx + (S.R() - 0.5) * 120, y: sy + (S.R() - 0.5) * 80, z: 90 + S.R() * 90, t: -S.R() * 1.8, life: 1.8 + S.R() * 0.8, sz: 1 + (S.R() < 0.3 ? 1 : 0) });
      for (let q = 0; q < 16; q++) f.dust.push({ x: px + (S.R() - 0.5) * 90, y: py + (S.R() - 0.5) * 50, t: -S.R() * 0.8, life: 5 + S.R() * 3, z: S.R() * 30 });
      for (let q = 0; q < 22; q++) f.flocks.push({ kind: q % 3 ? 'bird' : 'crow', x: px + (S.R() - 0.5) * 80, y: py - 20 + (S.R() - 0.5) * 30, vx: 10 + S.R() * 8, vy: -8 - S.R() * 6, t: -S.R() * 0.6, life: 16, ph: q, z: 10 + S.R() * 40 });
      for (const a of wild()) { const q = near(a, 18) || [a.x, a.y]; H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.5 }, H.go(q[0], q[1], { run: 2.2 }), { k: 'idle', t: 6 }], 'mini'); } });
    later(6.5, () => { f.prison.burst = true; f.prison.hold = true; f.prison.anim = 'idle'; burst(px, py + 6, 'burst'); f.shake = 1.6; f.flash = 1; for (let q = 0; q < 18; q++) f.rocks.push({ x: px + (S.R() - 0.5) * 50, y: py + (S.R() - 0.5) * 20, z: 20 + S.R() * 60, t: -S.R() * 0.5, life: 1.8 + S.R() * 0.6, sz: 1 + (S.R() < 0.4 ? 1 : 0) });
      const wk = R.actors.wk || (R.actors.wk = S.H.spawnActor('wukong', px, py + 8, R)); if (wk) { wk.x = px; wk.y = py + 8; wk.gz = TWM.groundZ(wk.x, wk.y); wk.hidden = false; wk.alpha = 1; wk.story = R; wk.look = 'wukong'; H.assign(wk, [{ k: 'bubble', kind: 'star' }, { k: 'mount' }, { k: 'soar', x: px + 8, y: py - 70, lift: 46, speed: 60, spin: 0 }, { k: 'soar', x: sx + 36, y: sy - 18, lift: 78, speed: 70, spin: 0 }, { k: 'soar', x: sx - 30, y: sy + 26, lift: 70, speed: 70, spin: 0 }, { k: 'soar', x: sx + 20, y: sy + 8, lift: 56, speed: 60, spin: 0 }, { k: 'idle', t: 0.1 }], 'story'); } });
    R.wait = o.t || 10; };
  O.nhs_wukong_land = (R, o) => {   // Wukong comes down on the summit pad in front of the monk
    const wk = act(R, 'wk'), m = act(R, 'monk'); if (!wk) { R.wait = 1; return; } const [lx, ly] = H.nearestWalk(...TW(16.2, 14.4), B, 4) || TW(16.2, 14.4); wk.x = wk.x; H.assign(wk, [{ k: 'soar', x: lx, y: ly, lift: 20, speed: 40, spin: 0 }, { k: 'land', t: 1.2 }, { k: 'bubble', kind: 'heart' }, { k: 'face', x: m ? m.x : lx, y: m ? m.y : ly }, { k: 'idle', t: 600 }], 'story');
    if (m) H.assign(m, [{ k: 'face', x: lx, y: ly }, { k: 'bubble', kind: 'star' }, { k: 'idle', t: 600 }], 'story'); S.nhs.glowT = 0.5; S.nhs.lightT = 0; S.nhs.cracksT = 0; pend(R, () => !!(wk.cur && wk.cur.k === 'idle')); };
  O.nhs_master = (R, o) => {   // a puff of smoke: Wukong is in the simple pilgrim robes; he kneels and bows; the monk blesses him
    const f = S.nhs, wk = act(R, 'wk'), m = act(R, 'monk'); if (!wk) { R.wait = 1; return; } const x = wk.x, y = wk.y;
    H.assign(wk, [{ k: 'hop', t: 0.7 }, { k: 'nhscall', fn: q => { burst(q.x, q.y - 4, 'smoke'); q.look = 'wk_pilgrim'; } }, { k: 'wait', t: 0.9 }, { k: 'face', x: m ? m.x : x, y: m ? m.y : y }, { k: 'sit', t: 3.4 }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 2.2 }, { k: 'hop', t: 0.7 }, { k: 'idle', t: 600 }], 'story');
    if (m) H.assign(m, [{ k: 'wait', t: 3.5 }, { k: 'bubble', kind: 'heart' }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 600 }], 'story'); f.glowT = 0.3; R.wait = o.t || 9; };
  O.nhs_descend = (R, o) => {   // master and disciple walk down; the monk mounts the horse; they set off together
    const m = act(R, 'monk'), wk = act(R, 'wk'), h = act(R, 'horse'); const c = P.nhs_court(); if (m) { const p = H.nearestWalk(c[0] - 4, c[1] + 12, B, 5) || c; H.assign(m, [H.go(p[0], p[1], { run: o.run || 2.6 }), { k: 'nhscall', fn: q => { q.rideOf = h; } }, { k: 'idle', t: 600 }], 'story'); }
    if (wk) { const p = H.nearestWalk(c[0] + 4, c[1] + 10, B, 5) || c; H.assign(wk, [{ k: 'wait', t: 1.2 }, H.go(p[0], p[1], { run: (o.run || 2.6) + 0.2 }), { k: 'bubble', kind: 'note' }, { k: 'idle', t: 600 }], 'story'); }
    if (m) pend(R, () => !!m.rideOf); };
  O.nhs_leave = (R, o) => {   // out through the gate toward Black Wind Mountain, the horse leading, the disciple at its side
    const g = P.nhs_gate(); let n = 0; for (const id of ['horse', 'wk']) { const a = act(R, id); if (!a) continue; const p = H.nearestWalk(g[0] - 4 + n * 3, g[1] + n * 2, B, 5) || g; a.story = R; H.assign(a, [{ k: 'wait', t: n * 0.8 }, H.go(p[0], p[1], { run: id === 'horse' ? 1.2 : 1.35 }), { k: 'nhsfade' }], 'story'); n++; }
    const m = act(R, 'monk'); if (m) { m.story = R; H.assign(m, [{ k: 'idle', t: 600 }], 'story'); } const h = act(R, 'horse'); pend(R, () => (!h || h.gone)); const monk = act(R, 'monk'); later(0.1, () => { }); R.after = () => { if (monk) monk.gone = true; }; };
  O.nhs_recover = (R, o) => {   // dust settles, rocks stop falling, the empty prison rests; animals come back
    const f = S.nhs; f.shake = 0; f.cracksT = 0; f.lightT = 0; f.windT = 1; f.mistT = 0.6; f.rainT = 0.2; f.ageT = 0.3; f.prison.burst = true; f.glowT = 0.2; for (const a of wild()) if (free(a)) { const q = near(a, 14) || [a.x, a.y]; H.assign(a, [{ k: 'wait', t: S.R() * 6 }, H.go(q[0], q[1], { run: 1 }), { k: 'idle', t: 4 }], 'mini'); } R.wait = o.t || 4; };
  O.nhs_reseal = (R, o) => {   // the legend goes round: a new golden seal descends and the sleeping monkey ghosts back into the rock
    const f = S.nhs; f.seal.st = 'return'; f.seal.t = 0; f.glowT = 1; f.prison.ghost = 1; f.prison.burst = false; f.prison.hold = false; f.prison.anim = 'idle'; f.prison.t0 = S.t; f.prison.next = S.t + 20; f.prison.ghostFrom = S.t; f.rainT = 0; R.wait = o.t || 6; };
  O.nhs_peace = (R, o) => { const f = S.nhs; f.rainT = 0; f.stormT = 0; f.glowT = 0; f.lightT = 0; f.cracksT = 0; f.seal.st = 'on'; f.prison.burst = false; f.prison.hold = false; f.tl.on = false; f.ageT = 0.12; f.mistT = 0.4; for (const a of S.agents) if (a.rideOf && a.role === 'actor') a.rideOf = null; };

  // the actors helper: spawn a story actor mid-sequence (Wukong appears from the broken rock)
  S.H.spawnActor = (char, x, y, R) => makeActor(char, Math.floor(x / T), Math.floor(y / T), R);
  function makeActor(char, i, j, R) { const ch = window.TD2_CHARS && window.TD2_CHARS.chars[char]; const a = { id: S.agents.length, char, look: char, biome: B, role: 'actor', x: (i + 0.5) * T, y: (j + 0.5) * T, gz: 0, lift: 0, dir: 'down', frame: 'idle0', pose: 'idle', moving: false, q: [], cur: null, dist: 0, v: (ch ? ch.speed : 20) / 4 * 0.9, bubble: null, bubbleT: 0, carry: null, alpha: 1, inWater: false, thread: 0, wrap: false, gone: false, hidden: false, story: R, gathered: null, busyUntil: 0, home: [i, j], task: null, actT: 0, phase: S.R() * 10 }; a.gz = TWM.groundZ(a.x, a.y); S.agents.push(a); return a; }

  D.beacon.nhs = '255,214,120';
  D.biomes.nhs = {
    residents: [['nhs_deer', 3, 'deer'], ['nhs_goat', 2, 'goat'], ['khi_con', 3, 'monkey'], ['nhs_hermit', 1, 'hermit'], ['sdl_porter', 1, 'wood'], ['hps_monk', 2, 'monk']],
    roles: {
      deer: [['nhs_graze', 5], ['nhs_drink', 3], ['stroll', 2], ['nhs_play', 1]],
      goat: [['nhs_graze', 3], ['nhs_ledge', 4], ['nhs_drink', 1], ['stroll', 1]],
      monkey: [['nhs_play', 4], ['nhs_forage', 3], ['nhs_ledge', 2], ['stroll', 1]],
      hermit: [['nhs_hut', 4], ['nhs_offering', 2], ['nhs_look', 2], ['nhs_drink', 1], ['stroll', 1]],
      wood: [['nhs_chop', 5], ['nhs_rest', 2], ['nhs_walk', 2], ['nhs_drink', 1]],
      monk: [['nhs_walk', 3], ['nhs_pray', 2], ['nhs_rest', 2], ['nhs_shrine', 2], ['nhs_look', 2]],
    },
    minis: ['nhs_monkeys', 'nhs_deer_drink', 'nhs_cranes', 'nhs_rainstorm', 'nhs_surge', 'nhs_scatter', 'nhs_wind', 'nhs_offering', 'nhs_pilgrims', 'nhs_snowstorm'],
    stories: [
      { id: 'five_hundred_years', title: ['Năm Trăm Năm Dưới Núi', 'Five Hundred Years Beneath the Mountain'],
        fore: [['nhs_fore', { t: 4 }]],
        beats: [
          ['nhs_tl', { dur: 66 }], ['wait', { t: 2 }],
          ['nhs', { mist: 0.3, rain: 0, glow: 0.5 }],
          ['spawn', { id: 'horse', char: 'nhs_horse', at: 'nhs_gate', off: [-1, 0] }], ['spawn', { id: 'monk', char: 'tam_tang', at: 'nhs_gate', off: [-1, 0] }], ['wait', { t: 1.2 }],
          ['nhs_approach', {}], ['nhs_dismount', {}], ['nhs_plea', { t: 5.5 }],
          ['nhs_climb', { run: 2.8 }], ['wait', { t: 1 }],
          ['nhs_seal', { t: 10 }], ['nhs_wukong_land', {}], ['nhs_master', { t: 9 }],
          ['nhs_descend', { run: 2.8 }], ['wait', { t: 1.5 }], ['nhs_leave', {}], ['disperse', {}]],
        after: { fx: 'petals', at: 'nhs_summit', r: 34 },
        recover: [['nhs_recover', { t: 4 }], ['wait', { t: 20 }], ['nhs_reseal', { t: 7 }], ['wait', { t: 6 }], ['nhs_peace', {}], ['wait', { t: 2 }]] },
    ],
  };
})();
