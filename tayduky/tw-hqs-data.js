'use strict';
// ===== Tây Du Ký v2 — Hoa Quả Sơn (the Monkey Kingdom): residents, daily life, mini events and the signature (DOM-free; loaded after tw-ntq-data.js) =====
// State TWS.hqs (read by tw-hqs-fx.js): wind / gust, mist, rain / rainbow, surge (the Great Fall's flow), glow, shake / flash, gold (the Great Sage's aura), swirl (clouds winding round the peak), beat (last drum hit), festival (banners + lanterns),
// feast, flocks, bursts, clones, landings (cranes), focus (story camera), caption.
// Signature - "Tề Thiên Đại Thánh trở về" (the Great Sage returns, in his Great Sage armour): calm -> the clouds above the peak start to wind -> a sentry sees a shadow -> Wukong rides his somersault cloud home -> monkeys run down from every terrace
// -> drums, banners, dancing -> he leaps onto the Hầu Vương dais and raises the Ruyi staff -> golden aura, wind, scattering birds -> he shows his arts (hair-clones) -> the troop follows him to the lake -> he leaps through the curtain of the Great Fall,
// the troop after him -> the great feast in the courtyard -> he takes his seat and the kingdom returns to its day (soft recovery).
(function () {
  const S = TWS, H = S.H, D = window.TW_DATA, B = 'hqs', F = TWM.hqs, T = 8;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = (v, t, r, dt) => Math.abs(t - v) <= r * dt ? t : v + Math.sign(t - v) * r * dt;
  const TW = (a, b) => [(a + 0.5) * T, (b + 0.5) * T];
  const newState = () => ({ wind: 1, windT: 1, gust: 1, mist: 0.25, mistT: 0.25, rain: 0, rainT: 0, rainbow: 0, rainbowT: 0, surge: 1, surgeT: 1, glow: 0.2, glowT: 0.2, shake: 0, flash: 0, gold: 0, goldT: 0, swirl: 0, swirlT: 0, beat: -99, drumming: 0, festival: 0, festivalT: 0, feast: 0, feastT: 0,
    flocks: [], bursts: [], clones: [], landings: [], caption: null, capT: 0, focus: null, focusT: 0, petalBoost: 0, spray: 0, sparkle: 0 });
  const baseInit = S.init, baseTick = S.tick;
  S.init = function (seed) { S.hqs = newState(); baseInit(seed); };
  const timers = []; const later = (sec, fn) => timers.push({ at: S.t + sec, fn });
  S.tick = function (dt) {
    baseTick(dt); const f = S.hqs; if (!f) return;
    f.wind = ease(f.wind, f.windT, 0.4, dt); f.gust = 1 + (f.wind - 1) * 1.5 + f.shake * 3; f.mist = ease(f.mist, f.mistT, 0.05, dt); f.rain = ease(f.rain, f.rainT, 0.15, dt); f.surge = ease(f.surge, f.surgeT, 0.35, dt); f.glow = ease(f.glow, f.glowT, 0.3, dt);
    f.rainbow = ease(f.rainbow, f.rain < 0.05 && f.rainbowT > S.t ? 1 : 0, 0.12, dt); f.shake = Math.max(0, f.shake - dt * 1.2); f.flash = Math.max(0, f.flash - dt * 1.8); f.gold = ease(f.gold, f.goldT, 0.6, dt); f.swirl = ease(f.swirl, f.swirlT, 0.25, dt);
    f.festival = ease(f.festival, f.festivalT, 0.4, dt); f.feast = ease(f.feast, f.feastT, 0.35, dt); f.sparkle = Math.max(0, f.sparkle - dt * 0.4);
    for (const q of f.flocks) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; } f.flocks = f.flocks.filter(q => q.t < q.life); for (const b of f.bursts) b.t += dt; f.bursts = f.bursts.filter(b => b.t < 2.6);
    for (const q of f.landings) q.t += dt; f.landings = f.landings.filter(q => q.t < q.dur);
    f.clones = f.clones.filter(c => !c.a.gone);
    for (let i = timers.length - 1; i >= 0; i--) if (S.t >= timers[i].at) { const t = timers.splice(i, 1)[0]; t.fn(); }
  };
  const burst = (x, y, kind) => S.hqs.bursts.push({ x, y, t: 0, kind: kind || 'gold' });
  const free = a => H.free(a), X = S.stepExt, P = S.pointExt, A = S.ACT, pois = k => H.pois(B, k);
  const near = (a, rad) => { const p = TWM.randomWalkable(a.biome, S.R, [Math.floor(a.x / T), Math.floor(a.y / T)], rad); return p ? [(p[0] + 0.5) * T, (p[1] + 0.5) * T] : null; };
  X.hqscall = (a, st) => { st.fn(a); return true; };
  X.hqsfade = (a, st, dt) => { st.el = (st.el || 0) + dt; a.alpha = Math.max(0, 1 - st.el / (st.d || 1.2)); if (st.el >= (st.d || 1.2)) { a.gone = true; return true; } return false; };
  P.hqs_court = () => TW(88, 22); P.hqs_land = () => TW(88, 21); P.hqs_dais = () => TW(88, 18); P.hqs_look = () => TW(91, 6); P.hqs_gate = () => TW(91, 35); P.hqs_cave1 = () => TW(71, 8); P.hqs_cave2 = () => TW(77, 8); P.hqs_fall = () => [(F.fallX[0] + (F.fallX[1] - F.fallX[0] + 1) / 2) * T, 8 * T];
  const alive = roles => S.agents.filter(a => a.biome === B && roles.includes(a.role) && !a.gone && !a.hidden);
  const some = (roles, n) => alive(roles).filter(a => free(a)).slice(0, n);
  const cap = (a, b, dur) => { const f = S.hqs; f.caption = [a, b]; f.capT = S.t + (dur || 6); };
  const focus = (xy, dur) => { const f = S.hqs; f.focus = xy; f.focusT = S.t + (dur || 12); };

  // ---------------------------------------------------------------- activities (the monkeys' daily life; the old pilot's activities keep working on the same post kinds)
  const post = (kind, a, dir, extra) => { const p = H.poiFree(B, kind); if (!p) return A.wander(a); H.claim(a, p); return [H.go(p.x, p.y), { k: 'face', dir: p.face || dir || 'up' }].concat(extra || [{ k: 'idle', t: H.rnd(6, 12) }]).concat([{ k: 'release', poi: p }]); };
  const beat = () => ({ k: 'hqscall', fn: () => { S.hqs.beat = S.t; } });
  A.hqs_sort = a => { const t = H.poiFree(B, 'tree'), d = H.poiFree(B, 'stall'); if (!t || !d) return A.eat(a); H.claim(a, t); H.count('sort'); const tx = (t.tree[0] + 0.5) * T, ty = (t.tree[1] + 0.5) * T + 3.2;
    return [H.go(t.x, t.y), { k: 'face', dir: 'up' }, { k: 'nudge', x: tx, y: ty }, { k: 'climb', to: 15, t: 2.2 }, { k: 'act', t: 2 }, { k: 'climb', to: 0, t: 1.6 }, { k: 'nudge', x: t.x, y: t.y }, { k: 'carry', what: 'basket' }, { k: 'release', poi: t }, H.go(d.x, d.y), { k: 'face', dir: 'up' }, { k: 'act', t: 2.4 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }]; };
  A.hqs_spar = a => { H.count('spar'); return post('hspar', a, 'right', [{ k: 'act', t: H.rnd(3, 5) }, { k: 'idle', t: 0.5 }, { k: 'act', t: 2.5 }, { k: 'idle', t: 0.7 }, { k: 'act', t: H.rnd(3, 5) }, { k: 'bubble', kind: 'star' }, { k: 'idle', t: 1.5 }]); };
  A.hqs_drum = a => { H.count('drum'); return post('hdrum', a, 'right', [beat(), { k: 'act', t: 0.9 }, beat(), { k: 'act', t: 0.9 }, beat(), { k: 'act', t: 0.9 }, beat(), { k: 'act', t: 0.9 }, beat(), { k: 'act', t: 1.4 }, { k: 'idle', t: 1 }]); };
  A.hqs_sweep = a => { H.count('sweep'); return post('hsweep', a, 'down', [{ k: 'act', t: H.rnd(4, 7) }, { k: 'idle', t: 0.6 }, { k: 'act', t: H.rnd(3, 6) }]); };
  A.hqs_drink = a => { H.count('drink'); return post('hdrink', a, 'up', [{ k: 'act', t: H.rnd(3, 5) }, { k: 'idle', t: 1.2 }, { k: 'act', t: H.rnd(2, 4) }, { k: 'idle', t: H.rnd(1.5, 3) }]); };
  A.hqs_graze = a => { H.count('graze'); return post('hgraze', a, 'down', [{ k: 'act', t: H.rnd(5, 9) }, { k: 'idle', t: H.rnd(1.5, 3) }, { k: 'act', t: H.rnd(4, 8) }, { k: 'idle', t: H.rnd(2, 4) }]); };
  A.hqs_stone = a => { H.count('stone'); return post('hstone', a, 'up', [{ k: 'sit', t: H.rnd(10, 18) }, { k: 'bubble', kind: 'dots' }, { k: 'sit', t: H.rnd(4, 8) }]); };
  A.hqs_play = a => { const ps = [0, 1, 2].map(() => near(a, 9)).filter(Boolean); H.count('hplay'); return ps.length ? ps.flatMap(p => [H.go(p[0], p[1], { run: 1.7 }), { k: 'hop', t: 0.7 }]).concat([{ k: 'bubble', kind: 'note' }]) : A.hop(a); };
  A.hqs_cave = a => { const ps = pois('cave'); if (ps.length < 2) return A.cave(a); const p = ps[Math.floor(S.R() * ps.length)], q = ps.find(z => z !== p); H.count('cave');
    return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'up' }, { k: 'hop', t: 0.6 }, { k: 'fade', t: 1 }, { k: 'hqscall', fn: x => { x.hidden = true; } }, { k: 'wait', t: H.rnd(8, 18) }, { k: 'hqscall', fn: x => { x.x = q.x; x.y = q.y; x.gz = TWM.groundZ(q.x, q.y); x.hidden = false; } }, { k: 'fade', t: 1, in: true }, { k: 'bubble', kind: 'note' }]; };

  // ---------------------------------------------------------------- mini events
  const M = S.MINI, ruleOut = () => S.biomes.hqs.run && S.biomes.hqs.phase !== 'peace';
  const lookAt = (xy, who) => { for (const a of who) H.assign(a, [{ k: 'face', x: xy[0], y: xy[1] }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }, { k: 'idle', t: 2.4 }], 'mini'); };
  function makeActor(char, x, y, R) { const ch = window.TD2_CHARS && window.TD2_CHARS.chars[char]; const i = Math.floor(x / T), j = Math.floor(y / T); const a = { id: S.agents.length, char, look: char, biome: B, role: 'actor', x, y, gz: 0, lift: 0, dir: 'down', frame: 'idle0', pose: 'idle', moving: false, q: [], cur: null, dist: 0, v: (ch ? ch.speed : 20) / 4 * 0.9, bubble: null, bubbleT: 0, carry: null, alpha: 1, inWater: false, thread: 0, wrap: false, gone: false, hidden: false, story: R || null, gathered: null, busyUntil: 0, home: [i, j], task: null, actT: 0, phase: S.R() * 10 }; a.gz = TWM.groundZ(a.x, a.y); S.agents.push(a); return a; }
  M.hqs_spar_mini = b => { const ps = pois('hspar').filter(p => p.users < p.cap), g = some(['guard', 'citizen', 'kid'], 6); if (ps.length < 2 || g.length < 4) return false; g.forEach((a, n) => { const p = ps[n % ps.length]; H.assign(a, [H.go(p.x + (n >> 1 ? 6 : -6), p.y + (n & 1 ? 4 : -2), { run: 1.3 }), { k: 'face', x: p.x, y: p.y }, { k: 'wait', t: 1 + (n & 1) * 0.5 }, { k: 'act', t: 2 }, { k: 'idle', t: 0.4 }, { k: 'act', t: 2 }, { k: 'idle', t: 0.4 }, { k: 'act', t: 2.5 }, { k: 'bubble', kind: n & 1 ? 'star' : 'excl' }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 2 }], 'mini'); }); H.count('spar_mini'); return true; };
  M.hqs_deer = b => { const d = some(['deer'], 3), ps = pois('hdrink'), k = some(['kid'], 1)[0]; if (d.length < 2 || ps.length < 2 || !k) return false; d.forEach((a, n) => { const p = ps[(n * 2) % ps.length], q = near(a, 14) || [a.x, a.y]; H.assign(a, [{ k: 'wait', t: n * 0.8 }, H.go(p.x, p.y), { k: 'face', dir: p.face || 'up' }, { k: 'act', t: 4 }, { k: 'idle', t: 1 }, { k: 'act', t: 3 }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.5 }, H.go(q[0], q[1], { run: 2.1 })], 'mini'); });
    const p0 = ps[0]; H.assign(k, [H.go(p0.x - 14, p0.y + 8, { run: 1.6 }), { k: 'face', x: p0.x, y: p0.y }, { k: 'hop', t: 0.8 }, { k: 'bubble', kind: 'note' }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 3 }], 'mini'); H.count('deer_scare'); return true; };
  M.hqs_cranes = b => { const f = S.hqs; if (f.landings.length) return false; f.landings.push({ t: 0, dur: 34, at: [F.lake[0] * T + 8, (F.lake[1] + 1) * T], n: 4 }); lookAt(P.hqs_fall(), some(['kid', 'citizen', 'elder'], 3)); H.count('cranes'); return true; };
  M.hqs_rain = b => { const f = S.hqs; if (f.rainT > 0.1 || ruleOut()) return false; f.rainT = 0.55; f.mistT = 0.8; f.surgeT = 1.8; later(24, () => { f.rainT = 0; f.rainbowT = S.t + 45; f.mistT = 0.3; f.surgeT = 1.2; later(20, () => { f.surgeT = 1; }); }); const sh = pois('hut'); for (const a of S.agents.filter(q => q.biome === B && free(q) && !q.hidden && q.role !== 'deer')) { const p = sh.length ? sh[Math.floor(S.R() * sh.length)] : null; if (p && S.R() < 0.6) H.assign(a, [{ k: 'bubble', kind: 'excl' }, H.go(p.x, p.y, { run: 1.8 }), { k: 'idle', t: 20 }], 'mini'); } H.count('rain'); return true; };
  M.hqs_through = b => { if (ruleOut()) return false; const a = some(['kid', 'citizen'], 2); const ps = pois('cave'); if (a.length < 1 || ps.length < 2) return false; const fx = P.hqs_fall();
    a.forEach((m, n) => { const p = ps[n % 2], q = ps[(n + 1) % 2]; H.assign(m, [{ k: 'wait', t: n * 1.4 }, H.go(p.x, p.y, { run: 1.4 }), { k: 'face', x: fx[0], y: fx[1] }, { k: 'hop', t: 0.5 }, { k: 'jump', x: p.x < fx[0] ? (F.fallX[0] + 0.5) * T : (F.fallX[1] + 0.5) * T, y: 8.5 * T, h: 12, t: 0.8, splash: true }, { k: 'fade', t: 0.5 }, { k: 'hqscall', fn: x => { x.hidden = true; } }, { k: 'wait', t: 3.5 }, { k: 'hqscall', fn: x => { x.x = q.x; x.y = q.y; x.gz = TWM.groundZ(q.x, q.y); x.hidden = false; S.hqs.spray = 1; } }, { k: 'fade', t: 0.6, in: true }, { k: 'bubble', kind: 'star' }, { k: 'hop', t: 0.6 }], 'mini'); }); H.count('through'); return true; };
  M.hqs_mist = b => { const f = S.hqs; if (f.mistT > 0.5 || ruleOut()) return false; f.mistT = 0.95; later(42, () => { f.mistT = 0.25; }); H.count('mist'); return true; };
  M.hqs_birds = b => { const f = S.hqs, fx = P.hqs_fall(); for (let q = 0; q < 12; q++) f.flocks.push({ kind: q % 4 ? 'bird' : 'dove', x: fx[0] - 90 + (q - 6) * 6, y: fx[1] - 50 + (q % 3) * 6, vx: 8 + S.R() * 4, vy: 5 + S.R() * 3, t: -q * 0.15, life: 20, ph: q, z: 60 + S.R() * 40 }); lookAt(fx, some(['kid', 'citizen', 'guard'], 3)); H.count('birds'); return true; };
  M.hqs_surge = b => { const f = S.hqs; if (f.surgeT > 1.1 || ruleOut()) return false; f.surgeT = 2; f.spray = 1; f.mistT = 0.7; lookAt(P.hqs_fall(), some(['kid', 'citizen', 'elder'], 3)); later(26, () => { f.surgeT = 1; f.mistT = 0.3; }); H.count('surge'); return true; };
  M.hqs_chase = b => { const k = some(['kid'], 3); if (k.length < 3) return false; const pts = []; for (let n = 0; n < 4; n++) { const p = near(k[0], 12); if (p) pts.push(p); } if (pts.length < 2) return false; k.forEach((a, n) => H.assign(a, [{ k: 'wait', t: n * 0.5 }, ...pts.map(p => H.go(p[0] + n * 4, p[1], { run: 1.9 })), { k: 'hop', t: 1.2 }, { k: 'bubble', kind: 'heart' }], 'mini')); H.count('chase_mini'); return true; };

  // ---------------------------------------------------------------- story ops
  const O = S.opExt, pend = (R, fn) => { const t0 = S.t; R.pend = () => { R.pendT = 0; return fn() || S.t - t0 > 90; }; };
  const king = () => S.agents.find(a => a.biome === B && a.role === 'king' && !a.gone);
  O.hqs_fore = (R, o) => { const f = S.hqs; f.swirlT = 1; f.mistT = 0.55; f.glowT = 0.5; f.windT = 1.6; focus(TW(91, 5), 14); cap('Mây trên đỉnh Hoa Quả Sơn bắt đầu xoáy', 'The clouds above the peak begin to wind', 7);
    for (let q = 0; q < 8; q++) f.flocks.push({ kind: 'bird', x: 86 * T + q * 5, y: 6 * T, vx: -7 - S.R() * 4, vy: -3, t: -q * 0.2, life: 18, ph: q, z: 70 + S.R() * 30 });
    const gs = some(['guard'], 2); gs.forEach((a, n) => { const p = pois('lookout')[n]; if (p) H.assign(a, [H.go(p.x, p.y, { run: 1.2 }), { k: 'face', dir: 'up' }, { k: 'idle', t: 40 }], 'mini'); }); R.wait = o.t || 4; };
  O.hqs_omen = (R, o) => { const f = S.hqs; f.glowT = 0.7; f.windT = 2; focus(TW(91, 6), 10); cap('Khỉ canh phát hiện một bóng người trên mây', 'A sentry spots a figure riding the clouds', 6);
    for (const a of S.agents.filter(q => q.biome === B && q.role === 'guard' && free(q))) H.assign(a, [{ k: 'face', dir: 'up' }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 30 }], 'mini');
    for (const a of S.agents.filter(q => q.biome === B && (q.role === 'kid' || q.role === 'citizen') && free(q))) if (S.R() < 0.6) H.assign(a, [{ k: 'face', dir: 'up' }, { k: 'bubble', kind: 'q' }, { k: 'idle', t: 8 }], 'mini'); R.wait = o.t || 5; };
  O.hqs_alarm = (R, o) => { const f = S.hqs; f.festivalT = 0.4; focus(P.hqs_court(), 14); cap('Cả đàn khỉ chạy từ các tầng núi xuống sân tụ hội', 'The troop runs down from every terrace to the gathering court', 7); R.wait = o.t || 2; };
  O.hqs_festival = (R, o) => { const f = S.hqs; f.festivalT = 1; f.petalBoost = 1; f.glowT = 0.6; focus(P.hqs_court(), 14); cap('Trống vang, cờ bay — khỉ vui mừng nhảy múa', 'Drums roll, banners fly, the monkeys dance for joy', 8);
    for (const a of S.agents.filter(q => q.biome === B && q.gathered === R)) H.assign(a, [{ k: 'bubble', kind: 'note' }, { k: 'hop', t: 0.7 }, { k: 'hop', t: 0.7 }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 600 }].concat([]), 'story');
    for (let n = 0; n < 7; n++) later(n * 1.1, () => { S.hqs.beat = S.t; }); R.wait = o.t || 8; };
  O.hqs_raise = (R, o) => { const f = S.hqs, k = king(), d = P.hqs_dais(); if (!k) { R.wait = 1; return; } focus(d, 16); f.goldT = 1; f.windT = 2.4; f.glowT = 1; f.flash = 1; f.shake = 0.5; f.swirlT = 1; cap('Đại Thánh nhảy lên đài Hầu Vương, giơ cao Như Ý Kim Cô Bổng', 'The Great Sage leaps onto the dais and raises the Ruyi staff', 8);
    H.assign(k, [{ k: 'face', dir: 'down' }, { k: 'act', t: 1.2 }, { k: 'hop', t: 0.8 }, { k: 'act', t: 3 }, { k: 'idle', t: 600 }], 'story'); burst(d[0], d[1], 'gold');
    for (let q = 0; q < 16; q++) f.flocks.push({ kind: q % 3 ? 'bird' : 'dove', x: d[0] + (S.R() - 0.5) * 60, y: d[1] - 20 + (S.R() - 0.5) * 20, vx: -9 - S.R() * 8, vy: -6 - S.R() * 6, t: -S.R() * 0.4, life: 18, ph: q, z: 40 + S.R() * 50 });
    for (const a of S.agents.filter(q => q.biome === B && q.gathered === R)) H.assign(a, [{ k: 'face', x: d[0], y: d[1] }, { k: 'bubble', kind: 'star' }, { k: 'hop', t: 0.6 }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 600 }], 'story'); R.wait = o.t || 9; };
  O.hqs_magic = (R, o) => { const f = S.hqs, k = king(), d = P.hqs_dais(); if (!k) { R.wait = 1; return; } cap('Ngộ Không hóa phép: nhổ lông biến ra muôn vàn phân thân', 'Wukong plucks his hairs: a troop of clones appears', 8); focus(P.hqs_court(), 14);
    H.assign(k, [{ k: 'act', t: 2 }, { k: 'hqscall', fn: () => { burst(k.x, k.y, 'jade'); } }, { k: 'act', t: 6 }, { k: 'idle', t: 600 }], 'story');
    later(2.2, () => { for (let n = 0; n < 6; n++) { const p = H.nearestWalk(P.hqs_court()[0] + (n - 2.5) * 11, P.hqs_court()[1] + (n & 1 ? 8 : -3), B, 3) || P.hqs_court(); const c = makeActor('khi_dan', k.x, k.y, R); burst(c.x, c.y, 'gold'); S.hqs.clones.push({ a: c }); c.story = R; H.assign(c, [{ k: 'hop', t: 0.4 }, H.go(p[0], p[1], { run: 1.8 }), { k: 'face', x: d[0], y: d[1] }, { k: 'act', t: 2 }, { k: 'hop', t: 0.5 }, { k: 'act', t: 2 }, { k: 'hop', t: 0.5 }, { k: 'idle', t: 4 }, { k: 'hqscall', fn: x => burst(x.x, x.y, 'puff') }, { k: 'hqsfade', d: 0.5 }], 'story'); } });
    R.wait = o.t || 12; };
  O.hqs_procession = (R, o) => { const f = S.hqs, k = king(); if (!k) { R.wait = 1; return; } f.goldT = 0.5; focus(TW(77, 12), 18); cap('Cả đàn khỉ theo Đại Thánh tiến về Thủy Liêm Động', 'The whole troop follows the Great Sage to Water-Curtain Cave', 8);
    const p = H.nearestWalk(...P.hqs_cave2(), B, 3) || P.hqs_cave2(); H.assign(k, [H.go(p[0], p[1], { run: 1.15 }), { k: 'face', x: P.hqs_fall()[0], y: P.hqs_fall()[1] }, { k: 'idle', t: 600 }], 'story');
    S.agents.filter(q => q.biome === B && q.gathered === R).forEach((a, n) => { const q = H.nearestWalk(p[0] + 8 + (n % 5) * 5, p[1] + 4 + Math.floor(n / 5) * 5, B, 4) || p; H.assign(a, [{ k: 'wait', t: 1 + n * 0.25 }, H.go(q[0], q[1], { run: 1.25 }), { k: 'face', x: P.hqs_fall()[0], y: P.hqs_fall()[1] }, { k: 'idle', t: 600 }], 'story'); });
    pend(R, () => k.cur && k.cur.k === 'idle'); };
  O.hqs_enter = (R, o) => { const f = S.hqs, k = king(), fxp = P.hqs_fall(), m2 = P.hqs_cave2(), m1 = P.hqs_cave1(); if (!k) { R.wait = 1; return; } f.surgeT = 2.2; f.spray = 1; f.mistT = 0.8; f.goldT = 0.8; focus(fxp, 24); cap('Ngộ Không xuyên qua màn thác vào Thủy Liêm Động — bầy khỉ theo sau', 'Wukong leaps through the curtain of the fall; the troop follows', 9);
    const edge = [(F.fallX[1] + 0.5) * T, 8.5 * T], mp = H.nearestWalk(m2[0], m2[1], B, 2) || m2;
    const through = (a, delay, from) => H.assign(a, [{ k: 'wait', t: delay }, H.go(mp[0], mp[1], { run: 1.3 }), { k: 'face', x: fxp[0], y: fxp[1] }, { k: 'hop', t: 0.5 }, { k: 'jump', x: edge[0], y: edge[1], h: 12, t: 0.8, splash: true }, { k: 'fade', t: 0.5 }, { k: 'hqscall', fn: x => { x.hidden = true; } }], 'story');
    through(k, 0.5, 2); S.agents.filter(q => q.biome === B && q.gathered === R).forEach((a, n) => through(a, 2.5 + n * 0.45, 2)); later(0.5, () => burst(fxp[0], fxp[1], 'splash'));
    pend(R, () => S.agents.filter(q => q.biome === B && q.gathered === R).every(a => a.hidden) || false); };
  O.hqs_feast = (R, o) => { const f = S.hqs, k = king(), c = P.hqs_court(); f.festivalT = 1; f.feastT = 1; f.surgeT = 1.2; f.goldT = 0; f.glowT = 0.7; f.petalBoost = 1; focus(c, 30); cap('Đại tiệc trái cây ngoài sân — trống nổi, cả núi chúc mừng', 'The great fruit feast: drums, baskets of fruit, the whole mountain celebrates', 9);
    const m0 = P.hqs_cave1(), mouth = H.nearestWalk(m0[0], m0[1], B, 3) || m0, seats = pois('seat'); if (k) { k.hidden = false; k.alpha = 0; k.x = mouth[0]; k.y = mouth[1]; k.gz = TWM.groundZ(mouth[0], mouth[1]); }
    const crowd = S.agents.filter(q => q.biome === B && q.gathered === R); crowd.forEach(a => { if (!a.hidden) return; a.hidden = false; a.alpha = 0; a.x = mouth[0]; a.y = mouth[1]; a.gz = TWM.groundZ(a.x, a.y); a.q = []; a.cur = null; });
    const out = (a, n) => { const s = seats[n % Math.max(1, seats.length)], q = H.nearestWalk(c[0] + (S.R() - 0.5) * 70, c[1] + (S.R() - 0.5) * 30, B, 4) || c; H.assign(a, [{ k: 'wait', t: n * 0.3 }, { k: 'fade', t: 0.6, in: true }, { k: 'carry', what: n % 2 ? 'peach' : 'basket' }, H.go(q[0], q[1], { run: 1.3 }), { k: 'face', x: c[0], y: c[1] }, { k: 'hop', t: 0.6 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'note' }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 600 }], 'story'); };
    crowd.forEach(out); if (k) H.assign(k, [{ k: 'fade', t: 0.6, in: true }, H.go(...P.hqs_land(), { run: 1.2 }), { k: 'hop', t: 0.8 }, { k: 'idle', t: 600 }], 'story');
    for (let n = 0; n < 10; n++) later(2 + n * 1.5, () => { S.hqs.beat = S.t; }); R.wait = o.t || 20; };
  O.hqs_settle = (R, o) => { const f = S.hqs, k = king(); cap('Ngộ Không ngồi lại ngai Hầu Vương — Hoa Quả Sơn vui như hội', 'The Great Sage takes his throne; the kingdom returns to its day', 8); focus(P.hqs_dais(), 10); f.feastT = 0; if (k) H.assign(k, [H.go(...P.hqs_dais(), { run: 1.1 }), { k: 'face', dir: 'down' }, { k: 'sit', t: 14 }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 6 }], 'story'); R.wait = o.t || 12; };
  O.hqs_recover = (R, o) => { const f = S.hqs; f.shake = 0; f.windT = 1; f.mistT = 0.3; f.rainT = 0; f.glowT = 0.2; f.swirlT = 0; f.goldT = 0; f.festivalT = 0; f.petalBoost = 0.4; f.surgeT = 1; f.focus = null; R.wait = o.t || 3; };
  O.hqs_peace = (R, o) => { const f = S.hqs; f.feastT = 0; f.festivalT = 0; f.goldT = 0; f.swirlT = 0; f.windT = 1; f.mistT = 0.25; f.petalBoost = 0; f.focus = null; for (const a of S.agents) { if (a.biome === B && a.role === 'actor') a.gone = true; if (a.biome === B && a.role !== 'actor') { a.hidden = false; a.alpha = 1; a.gathered = null; } } };

  D.beacon.hqs = '255,214,120';
  D.biomes.hqs = {
    residents: [['wukong', 1, 'king'], ['khi_linh', 5, 'guard'], ['khi_lao', 3, 'elder'], ['khi_con', 11, 'kid'], ['khi_dan', 9, 'citizen'], ['khi_dan_b', 9, 'citizen'], ['nhs_deer', 3, 'deer']],
    roles: {
      king: [['train', 2], ['throne', 3], ['visit', 2], ['hqs_spar', 2], ['pray', 1], ['hqs_play', 1], ['hqs_stone', 1]],
      guard: [['patrol', 4], ['drill', 3], ['watch', 3], ['hqs_drum', 2], ['hqs_spar', 2], ['hut', 1]],
      elder: [['rest', 2], ['talk', 2], ['pray', 1], ['hqs_stone', 3], ['hqs_sort', 1], ['eat', 1], ['hut', 1]],
      kid: [['chase', 3], ['hop', 2], ['climb', 3], ['hqs_play', 3], ['play', 2], ['wall', 2], ['eat', 2], ['swim', 2], ['hqs_drink', 1], ['hqs_sweep', 1]],
      citizen: [['hqs_sort', 4], ['climb', 2], ['eat', 2], ['groom', 2], ['hqs_spar', 2], ['swim', 2], ['hqs_drum', 1], ['hqs_sweep', 2], ['hut', 2], ['hqs_cave', 2], ['talk', 2], ['hqs_drink', 1], ['pray', 1], ['wall', 1], ['fish', 2]],
      deer: [['hqs_graze', 5], ['hqs_drink', 3], ['stroll', 2]],
    },
    minis: ['fruit_raid', 'storytime', 'dive_party', 'supper', 'guard_drill', 'hqs_spar_mini', 'hqs_deer', 'hqs_cranes', 'hqs_rain', 'hqs_through', 'hqs_mist', 'hqs_birds', 'hqs_surge', 'hqs_chase'],
    stories: [
      { id: 'great_sage_returns', title: ['Tề Thiên Đại Thánh trở về', 'The Great Sage Returns'],
        fore: [['depart', { who: 'king' }], ['hqs_fore', { t: 4 }]],
        beats: [
          ['hqs_omen', { t: 5 }], ['disperse', {}], ['gather', { at: 'hqs_court', r: 5.5 }], ['hqs_alarm', { t: 2 }],
          ['arrive', { who: 'king', at: 'hqs_land' }], ['hqs_festival', { t: 8 }],
          ['hqs_raise', { t: 9 }], ['hqs_magic', { t: 12 }],
          ['hqs_procession', {}], ['hqs_enter', {}], ['wait', { t: 4 }], ['hqs_feast', { t: 20 }], ['hqs_settle', { t: 12 }], ['disperse', {}]],
        after: { fx: 'petals', at: 'hqs_court', r: 60 },
        recover: [['hqs_recover', { t: 3 }], ['clean', { roles: ['citizen', 'kid'], dur: 80 }], ['wait', { t: 10 }], ['hqs_peace', {}], ['wait', { t: 2 }]] },
    ],
  };
})();
