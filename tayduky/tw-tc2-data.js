'use strict';
// ===== Tây Du Ký v2 — Thiên Cung rework: residents, daily life, twelve minis, two big signatures (DOM-free; loaded after tw-bcl-data.js, REPLACES D.biomes.tc) =====
// State TWS.tc2 (read by tw-tc2-fx.js): heat (the Eight-Trigram Furnace), lid, runes, storm, flash, shake, bursts, flocks, peachfall, rainbow, lampPulse, cloud, petalBoost, caption, focus.
// Signature "havoc_heaven" (Đại Náo Thiên Cung): the banquet is laid -> Wukong slips into the peach garden -> eats the peaches -> the alarm -> the chase across the court -> he leaps onto the palace terrace -> he smashes the guard line (shock wave, scattering) -> the wrecked banquet -> recovery.
// Signature "eight_trigram_furnace" (Lò Bát Quái): Laojun's furnace stirs -> Wukong is escorted in -> the lid closes, runes spin -> the fire climbs, black cloud, the ground shakes -> he KICKS the furnace apart and bursts out -> he soars over the court and lands -> the guards flee -> the furnace dies down.
(function () {
  const S = TWS, H = S.H, D = window.TW_DATA, B = 'tc', T = 8;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = (v, t, r, dt) => Math.abs(t - v) <= r * dt ? t : v + Math.sign(t - v) * r * dt;
  const newState = () => ({ heat: 0.3, heatT: 0.3, lid: 0, lidT: 0, runes: 0, runesT: 0, storm: 0, stormT: 0, flash: 0, shake: 0, shakeT: 0, bursts: [], flocks: [], peachfall: [], rainbow: 0, rainbowT: 0, lampPulse: 0, cloud: 0, cloudT: 0, petalBoost: 0, caption: null, capT: 0, focus: null, focusT: 0, flameUp: 0, lidFly: null });
  const baseInit = S.init, baseTick = S.tick;
  S.init = function (seed) { S.tc2 = newState(); baseInit(seed); };
  const timers = []; const later = (sec, fn) => timers.push({ at: S.t + sec, fn });
  S.tick = function (dt) {
    baseTick(dt); const f = S.tc2; if (!f) return;
    f.heat = ease(f.heat, f.heatT, 0.5, dt); f.lid = ease(f.lid, f.lidT, 2, dt); f.runes = ease(f.runes, f.runesT, 0.8, dt); f.storm = ease(f.storm, f.stormT, 0.35, dt); f.rainbow = ease(f.rainbow, f.rainbowT, 0.25, dt); f.cloud = ease(f.cloud, f.cloudT, 0.25, dt);
    f.flash = Math.max(0, f.flash - dt * 1.8); f.shake = ease(f.shake, f.shakeT, 1.6, dt); f.lampPulse = Math.max(0, f.lampPulse - dt * 0.5); f.flameUp = Math.max(0, f.flameUp - dt * 0.5); f.petalBoost = Math.max(0, f.petalBoost - dt * 0.05);
    for (const q of f.flocks) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; } f.flocks = f.flocks.filter(q => q.t < q.life); for (const b of f.bursts) b.t += dt; f.bursts = f.bursts.filter(b => b.t < 3.2);
    for (const q of f.peachfall) q.t += dt; f.peachfall = f.peachfall.filter(q => q.t < 3.5); if (f.lidFly) { f.lidFly.t += dt; if (f.lidFly.t > 3) f.lidFly = null; }
    for (let i = timers.length - 1; i >= 0; i--) if (S.t >= timers[i].at) { const t = timers.splice(i, 1)[0]; t.fn(); }
  };
  const burst = (x, y, kind) => S.tc2.bursts.push({ x, y, t: 0, kind: kind || 'gold' });
  const X = S.stepExt, P = S.pointExt, A = S.ACT, pois = k => H.pois(B, k), free = a => H.free(a);
  const poiXY = k => { const p = pois(k)[0]; return p ? [p.x, p.y] : [27 * T, 21 * T]; };
  const COURT = [27.5 * T, 21.5 * T], FURN = () => poiXY('furnace'), GARDEN = [19.5 * T, 23 * T], GATE = [28.5 * T, 27.5 * T], ROOF = [28.5 * T, 13.5 * T];
  P.tc_court = () => COURT; P.tc_furnace = () => FURN(); P.tc_garden = () => GARDEN;
  const king = () => S.agents.find(a => a.biome === B && a.role === 'trickster' && !a.gone);
  const guards = n => S.agents.filter(a => a.biome === B && a.role === 'heavenguard' && !a.gone && !a.hidden).slice(0, n || 99);
  const fairies = n => S.agents.filter(a => a.biome === B && a.role === 'fairy' && !a.gone && !a.hidden).slice(0, n || 99);
  const laojun = () => S.agents.find(a => a.biome === B && a.role === 'laojun' && !a.gone);
  const cap = (a, b, dur) => { const f = S.tc2; f.caption = [a, b]; f.capT = S.t + (dur || 5); };
  const focus = (xy, dur) => { const f = S.tc2; f.focus = xy; f.focusT = S.t + (dur || 10); };
  const near = (x, y, r) => H.nearestWalk(x + H.rnd(-r, r), y + H.rnd(-r, r), B, 3) || [x, y];
  const post = (kind, a, dir, extra) => { const p = H.poiFree(B, kind); if (!p) return A.stroll(a); H.claim(a, p); return [H.go(p.x, p.y), { k: 'face', dir: p.face || dir || 'up' }].concat(extra || [{ k: 'idle', t: H.rnd(6, 12) }]).concat([{ k: 'release', poi: p }]); };
  // ---------------------------------------------------------------- new daily activities
  A.tc2_drill = a => { H.count('drill'); return post('drill', a, 'up', [{ k: 'act', t: 1.4 }, { k: 'hop', t: 0.4 }, { k: 'act', t: 1.4 }, { k: 'act', t: 1.4 }, { k: 'idle', t: 1 }]); };
  A.tc2_southgate = a => { H.count('southgate'); return post('southgate', a, 'up', [{ k: 'idle', t: H.rnd(8, 16) }]); };
  A.tc2_flame = a => { H.count('flame_watch'); return post('flame_watch', a, 'up', [{ k: 'act', t: 2.2 }, { k: 'idle', t: 2 }, { k: 'act', t: 2.2 }, { k: 'idle', t: 3 }]); };
  A.tc2_sweep = a => { H.count('sweep'); const p = near(COURT[0], COURT[1], 36); return [H.go(p[0], p[1]), { k: 'act', t: H.rnd(3, 5) }, { k: 'idle', t: 0.6 }, { k: 'act', t: 3 }]; };
  A.tc2_terrace = a => { H.count('terrace'); return post('terrace', a, 'down', [{ k: 'idle', t: H.rnd(6, 12) }]); };
  // ---------------------------------------------------------------- mini events
  const M = S.MINI, busy = () => S.biomes.tc.run && S.biomes.tc.phase !== 'peace';
  const look = (xy, who) => { for (const a of who) H.assign(a, [{ k: 'face', x: xy[0], y: xy[1] }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 2.4 }], 'mini'); };
  const flock = (n, x, y, vx, vy, life, kind) => { const f = S.tc2; for (let q = 0; q < n; q++) f.flocks.push({ kind: kind || (q % 3 ? 'crane' : 'bird'), x: x + (S.R() - 0.5) * 60, y: y + (S.R() - 0.5) * 40, vx: vx + (S.R() - 0.5) * 8, vy: vy + (S.R() - 0.5) * 6, t: -S.R() * 0.6, life, ph: q, z: 50 + S.R() * 60 }); };
  M.tc2_crane = b => { if (busy()) return false; flock(7, 12 * T, 18 * T, 14, 4, 20); look(COURT, fairies(2)); H.count('cranes_pass'); return true; };
  M.tc2_cloudpass = b => { const f = S.tc2; if (f.cloudT > 0.5 || busy()) return false; f.cloudT = 1; later(26, () => { f.cloudT = 0; }); H.count('cloud_pass'); return true; };
  M.tc2_peachfall = b => { const f = S.tc2, F = TWM.tc2; if (!F.trees.length || f.peachfall.length > 2 || busy()) return false; for (let q = 0; q < 3; q++) { const t = F.trees[Math.floor(S.R() * F.trees.length)]; f.peachfall.push({ x: (t[0] + 0.5) * T, y: (t[1] + 1.5) * T, t: -q * 0.9 }); } look(GARDEN, fairies(3)); H.count('peach_fall'); return true; };
  M.tc2_flare = b => { const f = S.tc2; if (f.heatT > 0.5 || busy()) return false; f.heatT = 0.95; f.flameUp = 1; burst(...FURN(), 'ember'); later(9, () => { f.heatT = 0.3; }); look(FURN(), guards(2)); H.count('flare'); return true; };
  M.tc2_drill = b => { const g = guards(4), ps = pois('drill'); if (g.length < 3 || ps.length < 2 || busy()) return false; g.forEach((a, n) => { const p = ps[n % ps.length]; H.assign(a, [H.go(p.x + n * 5, p.y), { k: 'face', dir: 'up' }, { k: 'act', t: 1.4 }, { k: 'hop', t: 0.4 }, { k: 'act', t: 1.4 }, { k: 'act', t: 1.4 }, { k: 'idle', t: 1 }], 'mini'); }); H.count('drill_all'); return true; };
  M.tc2_rainbow = b => { const f = S.tc2; if (f.rainbowT > 0.5 || busy()) return false; f.rainbowT = 1; f.petalBoost = 1; later(22, () => { f.rainbowT = 0; }); look(COURT, fairies(2)); H.count('rainbow'); return true; };
  M.tc2_petalwind = b => { if (busy()) return false; S.tc2.petalBoost = 1; H.count('petal_wind'); return true; };
  M.tc2_lanterns = b => { if (busy()) return false; S.tc2.lampPulse = 1; H.count('lanterns'); return true; };
  M.tc2_roof = b => { const k = S.agents.find(a => a.biome === B && a.role === 'trickster' && free(a)); if (!k || busy()) return false; H.assign(k, [{ k: 'mount' }, { k: 'soar', x: ROOF[0], y: ROOF[1], lift: 60, speed: 50 }, { k: 'land', t: 0.6 }, { k: 'bubble', kind: 'star' }, { k: 'act', t: 2 }, { k: 'idle', t: 3 }], 'mini'); H.count('roof_hop'); return true; };
  M.tc2_bell = b => { if (busy()) return false; const f = S.tc2; f.flash = 0.25; flock(5, 24 * T, 14 * T, -10, -6, 14, 'bird'); look(ROOF, guards(3)); H.count('bell'); return true; };
  // ---------------------------------------------------------------- story ops
  const O = S.opExt, pend = (R, fn) => { const t0 = S.t; R.pend = () => { R.pendT = 0; return fn() || S.t - t0 > 22; }; };
  const scatter = (gs, from) => { for (const a of gs) { const ang = Math.atan2(a.y - from[1], a.x - from[0]), p = near(a.x + Math.cos(ang) * 40, a.y + Math.sin(ang) * 30, 6); H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.5 }, H.go(p[0], p[1], { run: 3 }), { k: 'idle', t: 3 }], 'story'); } };
  O.tc_prep = (R, o) => { const f = S.tc2; f.petalBoost = 0.6; f.heatT = 0.3; focus(GARDEN, 8); cap('Thiên Cung chuẩn bị đại tiệc Bàn Đào', 'The Heavenly Palace prepares the Peach Banquet', 5); for (const a of fairies(5)) { const p = near(GARDEN[0], GARDEN[1], 24); H.assign(a, [{ k: 'carry', what: 'tray' }, H.go(p[0], p[1]), { k: 'act', t: 2 }, { k: 'carry', what: null }, { k: 'idle', t: 8 }], 'mini'); } R.wait = o.t || 4; };
  O.tc_sneak = (R, o) => { const k = king(); if (!k) { R.wait = 1; return; } k.story = R; k.hidden = false; k.alpha = 1; focus(GATE, 8); cap('Tôn Ngộ Không lẻn vào vườn Bàn Đào', 'Wukong slips into the Peach Garden', 5);
    const g = near(GARDEN[0] + 20, GARDEN[1], 10); H.assign(k, [H.go(GATE[0], GATE[1], { run: 1 }), H.go(g[0], g[1], { run: 4.2 }), { k: 'face', x: GARDEN[0] - 30, y: GARDEN[1] - 10 }, { k: 'idle', t: 0.4 }], 'story'); pend(R, () => !k.q.length && !k.cur); };
  O.tc_feast = (R, o) => { const f = S.tc2, k = king(); focus(GARDEN, 8); cap('Hái đào, ăn đào, quậy phá!', 'He picks the peaches, eats the peaches, makes havoc!', 5); for (let q = 0; q < 6; q++) f.peachfall.push({ x: (16 + S.R() * 7) * T, y: (21 + S.R() * 4) * T, t: -q * 0.35 }); f.petalBoost = 1;
    if (k) H.assign(k, [{ k: 'act', t: 1 }, { k: 'bubble', kind: 'heart' }, { k: 'hop', t: 0.5 }, { k: 'act', t: 1 }, { k: 'idle', t: 600 }], 'story'); for (const a of fairies(6)) scatter([a], COURT); R.wait = o.t || 4; };
  O.tc_alarm = (R, o) => { const f = S.tc2, k = king(); f.flash = 0.5; f.lampPulse = 1; focus(COURT, 8); cap('Thiên binh phát hiện — hồi chuông báo động!', 'The heavenly guard sounds the alarm!', 5); flock(10, GARDEN[0], GARDEN[1] - 30, 8, -8, 14);
    for (const a of guards(6)) { const p = near(COURT[0] - 20, COURT[1], 18); H.assign(a, [{ k: 'bubble', kind: 'excl' }, H.go(p[0], p[1], { run: 3 }), { k: 'face', x: GARDEN[0], y: GARDEN[1] }, { k: 'idle', t: 600 }], 'story'); } R.wait = o.t || 3; };
  O.tc_chase = (R, o) => { const k = king(); if (!k) { R.wait = 1; return; } focus(COURT, 10); cap('Truy đuổi qua sân ngọc!', 'The chase across the jade court!', 5);
    const c = near(COURT[0] + 10, COURT[1], 8); H.assign(k, [H.go(COURT[0] - 10, COURT[1] + 6, { run: 4.4 }), H.go(c[0], c[1], { run: 4.4 }), H.go(ROOF[0] - 12, ROOF[1] + 20, { run: 4.4 }), { k: 'idle', t: 600 }], 'story');
    for (const a of guards(6)) { const p = near(COURT[0] - 10, COURT[1] + 4, 14); H.assign(a, [H.go(p[0], p[1], { run: 3.4 }), H.go(c[0] - 6, c[1], { run: 3.4 }), { k: 'idle', t: 600 }], 'story'); } pend(R, () => !k.q.length); };
  O.tc_leap = (R, o) => { const f = S.tc2, k = king(); if (!k) { R.wait = 1; return; } focus(ROOF, 10); cap('Nhảy vọt lên đài cao, vung gậy!', 'He leaps to the high terrace and raises his staff!', 5);
    H.assign(k, [{ k: 'bubble', kind: 'star' }, { k: 'mount' }, { k: 'soar', x: ROOF[0], y: ROOF[1], lift: 70, speed: 64 }, { k: 'flip', t: 0.7, rise: 22, keepFly: true }, { k: 'land', t: 0.5 }, { k: 'act', t: 1.2 }, { k: 'idle', t: 600 }], 'story'); pend(R, () => k.cur && k.cur.k === 'idle'); };
  O.tc_smash = (R, o) => { const f = S.tc2, k = king(); f.shakeT = 1; f.flash = 1; f.lampPulse = 1; f.petalBoost = 1; focus(ROOF, 8); cap('Gậy quét — thiên binh bị đánh bật!', 'One sweep of the staff — the guards are blown back!', 5);
    burst(ROOF[0], ROOF[1], 'shock'); later(0.5, () => burst(COURT[0], COURT[1], 'gold')); flock(16, COURT[0], COURT[1] - 20, 0, -10, 14); scatter(guards(6), ROOF); later(1.2, () => { f.shakeT = 0; }); if (k) H.assign(k, [{ k: 'act', t: 1.2 }, { k: 'idle', t: 600 }], 'story'); R.wait = o.t || 3.5; };
  O.tc_wreck = (R, o) => { const f = S.tc2, k = king(); focus(poiXY('banquet'), 8); cap('Bàn tiệc, vườn đào tan hoang', 'The banquet and the garden lie in ruins', 5); for (let q = 0; q < 10; q++) f.peachfall.push({ x: (17 + S.R() * 6) * T, y: (26 + S.R() * 3) * T, t: -q * 0.3 });
    if (k) { const b = poiXY('banquet'); H.assign(k, [{ k: 'soar', x: b[0], y: b[1], lift: 40, speed: 64 }, { k: 'land', t: 0.5 }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 4 }, { k: 'idle', t: 600 }], 'story'); } R.wait = o.t || 4; pend(R, () => !k || (k.cur && k.cur.k === 'sit')); };
  O.tc_release = (R, o) => { const k = king(); if (k) { k.story = null; H.assign(k, [{ k: 'idle', t: 1 }], 'story'); } for (const a of S.agents.filter(q => q.biome === B && q.role !== 'trickster')) { a.gathered = null; } };
  // ---- the furnace
  O.tc_f_fore = (R, o) => { const f = S.tc2; f.heatT = 0.55; f.runesT = 0.4; focus(FURN(), 10); cap('Lò Bát Quái của Lão Quân đỏ dần lên', "Laojun's Eight-Trigram Furnace begins to glow", 5); const l = laojun(); if (l) H.assign(l, [H.go(...FURN()), { k: 'face', dir: 'up' }, { k: 'act', t: 3 }, { k: 'idle', t: 600 }], 'story');
    for (const a of guards(4)) { const p = near(FURN()[0] - 16, FURN()[1] + 12, 10); H.assign(a, [H.go(p[0], p[1]), { k: 'face', x: FURN()[0], y: FURN()[1] }, { k: 'idle', t: 600 }], 'story'); } R.wait = o.t || 4; };
  O.tc_f_enter = (R, o) => { const k = king(); if (!k) { R.wait = 1; return; } k.story = R; k.hidden = false; k.alpha = 1; focus(COURT, 8); cap('Ngộ Không bị giải vào Lò Bát Quái', 'Wukong is marched to the Eight-Trigram Furnace', 6);
    const f = FURN(); H.assign(k, [H.go(COURT[0], COURT[1], { run: 1.2 }), H.go(f[0] - 6, f[1] + 8, { run: 3.6 }), { k: 'bubble', kind: 'excl' }, { k: 'idle', t: 600 }], 'story'); pend(R, () => k.cur && k.cur.k === 'idle'); };
  O.tc_f_seal = (R, o) => { const f = S.tc2, k = king(); f.lidT = 1; f.heatT = 1; f.runesT = 1; f.stormT = 0.5; focus(FURN(), 10); cap('Nắp lò đóng lại — phù chú xoay tròn', 'The lid shuts; the talismans spin', 5); if (k) { k.hidden = true; burst(...FURN(), 'gold'); } R.wait = o.t || 3.5; };
  O.tc_f_burn = (R, o) => { const f = S.tc2; f.heatT = 1; f.flameUp = 1; f.stormT = 1; f.shakeT = 0.35; focus(FURN(), 10); cap('Lửa lên cao — mây đen kéo tới, mặt đất rung', 'The fire climbs; black clouds gather; the ground trembles', 6);
    for (let q = 0; q < 5; q++) later(q * 1.4, () => { burst(FURN()[0] + (S.R() - 0.5) * 16, FURN()[1], 'ember'); f.shakeT = 0.35 + q * 0.12; f.flameUp = 1; }); for (const a of fairies(4)) look(FURN(), [a]); R.wait = o.t || 7; };
  O.tc_f_break = (R, o) => { const f = S.tc2, k = king(), fp = FURN(); f.lidT = 0; f.lidFly = { t: 0 }; f.flash = 1.2; f.shakeT = 1.4; f.runesT = 0; f.heatT = 1; focus(COURT, 10); cap('Ngộ Không đạp tung lò bay ra!', 'Wukong kicks the furnace apart and bursts out!', 6);
    burst(fp[0], fp[1], 'shock'); later(0.4, () => burst(fp[0], fp[1], 'gold')); later(0.9, () => burst(COURT[0], COURT[1], 'ember')); flock(18, fp[0], fp[1], -6, -10, 14);
    if (k) { k.hidden = false; k.x = fp[0]; k.y = fp[1] - 4; H.assign(k, [{ k: 'mount' }, { k: 'soar', x: COURT[0], y: COURT[1], lift: 90, speed: 62 }, { k: 'flip', t: 0.7, rise: 22, keepFly: true }, { k: 'land', t: 0.6 }, { k: 'act', t: 1.2 }, { k: 'idle', t: 600 }], 'story'); }
    scatter(guards(6), fp); for (const a of fairies(6)) scatter([a], fp); later(1.6, () => { f.shakeT = 0; f.stormT = 0.4; }); R.wait = o.t || 4; pend(R, () => !k || (k.cur && k.cur.k === 'idle')); };
  O.tc_f_land = (R, o) => { const f = S.tc2; f.petalBoost = 1; f.flash = 0.4; focus(COURT, 8); cap('Thiên binh hoảng loạn tản ra', 'The heavenly guard scatters in panic', 5); burst(COURT[0], COURT[1], 'shock'); R.wait = o.t || 3; };
  O.tc_f_settle = (R, o) => { const f = S.tc2; f.heatT = 0.3; f.stormT = 0; f.runesT = 0; f.shakeT = 0; f.lidT = 0; focus(FURN(), 8); cap('Lò dịu dần — Thiên Cung trở lại yên tĩnh', 'The furnace dies down; the palace grows calm again', 5); O.tc_release(R, o); R.wait = o.t || 3; };
  O.tc_peace = (R, o) => { const f = S.tc2; f.heatT = 0.3; f.stormT = 0; f.runesT = 0; f.shakeT = 0; f.lidT = 0; f.focus = null; f.cloudT = 0; f.rainbowT = 0; O.tc_release(R, o); };
  D.beacon.tc = '255,211,150';
  const old = D.biomes.tc;
  D.biomes.tc = {
    residents: [['tc_fairy', 8, 'fairy'], ['tc_guard', 7, 'heavenguard'], ['tc_laojun', 1, 'laojun'], ['tc_wukong', 1, 'trickster']],
    roles: {
      fairy: [['heaven_tend', 4], ['heaven_harvest', 3], ['heaven_banquet', 2], ['tc2_sweep', 2], ['tc2_terrace', 1], ['talk', 1], ['stroll', 1]],
      heavenguard: [['heaven_patrol', 4], ['heaven_watch', 2], ['tc2_drill', 3], ['tc2_southgate', 3], ['tc2_flame', 1], ['stroll', 1]],
      laojun: [['heaven_furnace', 5], ['tc2_flame', 3], ['heaven_patrol', 1], ['stroll', 1]],
      trickster: [['heaven_harvest', 3], ['heaven_patrol', 2], ['tc2_terrace', 1], ['stroll', 2]]
    },
    minis: ['heaven_shift', 'heaven_furnace_flare', 'heaven_peach_baskets', 'tc2_crane', 'tc2_cloudpass', 'tc2_peachfall', 'tc2_flare', 'tc2_drill', 'tc2_rainbow', 'tc2_petalwind', 'tc2_lanterns', 'tc2_roof', 'tc2_bell'],
    stories: [
      { id: 'havoc_heaven', title: ['Đại náo Thiên Cung', 'Havoc in Heaven'], foreT: [6, 9], fore: [['tc_prep', { t: 4 }]],
        beats: [['tc_sneak', {}], ['tc_feast', { t: 4 }], ['tc_alarm', { t: 3 }], ['tc_chase', {}], ['tc_leap', {}], ['tc_smash', { t: 3.5 }], ['tc_wreck', { t: 4 }], ['fx', { kind: 'peaches', at: 'banquet', dur: 10 }], ['litter', { at: 'banquet', n: 16, r: 4 }], ['disperse', {}]],
        after: { fx: 'petals', at: 'court', r: 50 }, recover: [['tc_release', {}], ['clean', { roles: ['fairy'], dur: 90 }]] },
      { id: 'eight_trigram_furnace', title: ['Lò Bát Quái', 'The Eight-Trigram Furnace'], foreT: [6, 8], fore: [['tc_f_fore', { t: 4 }]],
        beats: [['tc_f_enter', {}], ['tc_f_seal', { t: 3.5 }], ['tc_f_burn', { t: 7 }], ['tc_f_break', { t: 4 }], ['tc_f_land', { t: 3 }], ['tc_f_settle', { t: 3 }], ['disperse', {}]],
        after: { fx: 'sparks', at: 'furnace', r: 40 }, recover: [['wait', { t: 8 }], ['tc_peace', {}]] },
      old.stories.find(s => s.id === 'peach_banquet')
    ]
  };
})();
