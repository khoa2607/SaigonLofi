'use strict';
// ===== Tây Du Ký v2 — Lòng Bàn Tay Phật Tổ (rebuilt): residents, daily life, nine new mini events and the signature (DOM-free; loaded after tw-hqs-data.js, replaces D.biomes.btp) =====
// State TWS.btp (read by tw-btp-fx.js): cover (cloud over the palm), fingers glow[5], lotus bloom, runes, inscription ring, beams from the fingertips, the column of light, shock bursts, halo, bound (Wukong is held: persists), caption, focus.
// Signature - "Phật Tổ Thu Phục Ngộ Không": calm -> Wukong swaggers over the palm -> he rides his cloud to the edge of the universe -> the five fingers light up and turn him back -> the clouds part and the whole palm shows -> the inscription ring appears
// -> beams from the five fingertips close into a prison of light -> he is pressed down into the seal, thunder, a shock wave, birds scatter -> the Buddha sits unmoved -> the force steadies and the clouds settle -> recovery: Wukong stays held in the ring, pacing and looking up.
(function () {
  const S = TWS, H = S.H, D = window.TW_DATA, B = 'btp', F = TWM.palm, T = 8;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = (v, t, r, dt) => Math.abs(t - v) <= r * dt ? t : v + Math.sign(t - v) * r * dt;
  const wp = (a, b) => [(a + 0.5) * T, (b + 0.5) * T];
  const newState = () => ({ cover: 0.55, coverT: 0.55, wind: 1, windT: 1, glow: [0, 0, 0, 0, 0], glowT: [0.15, 0.15, 0.15, 0.15, 0.15], lotus: 0.5, lotusT: 0.5, runes: 0, runesT: 0, inscr: 0, inscrT: 0, beams: 0, beamsT: 0, column: 0, columnT: 0, halo: 0.35, haloT: 0.35,
    thunder: 0, flash: 0, shake: 0, bound: 0, boundVis: 0, dust: 0, dustT: 0, bursts: [], flocks: [], landings: [], petalBoost: 0, caption: null, capT: 0, focus: null, focusT: 0, lamp: 0 });
  const baseInit = S.init, baseTick = S.tick;
  S.init = function (seed) { S.btp = newState(); baseInit(seed); };
  const timers = []; const later = (sec, fn) => timers.push({ at: S.t + sec, fn });
  S.tick = function (dt) {
    baseTick(dt); const f = S.btp; if (!f) return;
    f.cover = ease(f.cover, f.coverT, 0.2, dt); f.wind = ease(f.wind, f.windT, 0.4, dt); for (let k = 0; k < 5; k++) f.glow[k] = ease(f.glow[k], f.glowT[k], 0.45, dt); f.lotus = ease(f.lotus, f.lotusT, 0.25, dt); f.runes = ease(f.runes, f.runesT, 0.5, dt);
    f.inscr = ease(f.inscr, f.inscrT, 0.35, dt); f.beams = ease(f.beams, f.beamsT, 0.45, dt); f.column = ease(f.column, f.columnT, 0.4, dt); f.halo = ease(f.halo, f.haloT, 0.3, dt); f.thunder = Math.max(0, f.thunder - dt * 1.4); f.flash = Math.max(0, f.flash - dt * 1.8);
    f.shake = Math.max(0, f.shake - dt * 1.2); f.boundVis = ease(f.boundVis, f.bound, 0.3, dt); f.dust = ease(f.dust, f.dustT, 0.4, dt);
    for (const q of f.flocks) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; } f.flocks = f.flocks.filter(q => q.t < q.life); for (const b of f.bursts) b.t += dt; f.bursts = f.bursts.filter(b => b.t < 3); for (const q of f.landings) q.t += dt; f.landings = f.landings.filter(q => q.t < q.dur);
    for (let i = timers.length - 1; i >= 0; i--) if (S.t >= timers[i].at) { const t = timers.splice(i, 1)[0]; t.fn(); }
  };
  const burst = (x, y, kind) => S.btp.bursts.push({ x, y, t: 0, kind: kind || 'gold' });
  const X = S.stepExt, P = S.pointExt, A = S.ACT, pois = k => H.pois(B, k), free = a => H.free(a);
  X.btpcall = (a, st) => { st.fn(a); return true; };
  const SEAL = wp(74, 53), TOP = [74.5 * T, 40 * T];
  P.btp_seal = () => SEAL; P.btp_palm = () => wp(74, 55); P.btp_buddha = () => wp(65, 55); P.btp_top = () => TOP;
  const king = () => S.agents.find(a => a.biome === B && a.role === 'monkeyking' && !a.gone);
  const cap = (a, b, dur) => { const f = S.btp; f.caption = [a, b]; f.capT = S.t + (dur || 6); };
  const focus = (xy, dur) => { const f = S.btp; f.focus = xy; f.focusT = S.t + (dur || 12); };
  const some = (roles, n) => S.agents.filter(a => a.biome === B && roles.includes(a.role) && !a.gone && !a.hidden && free(a)).slice(0, n);
  const near = (a, rad) => { const p = TWM.randomWalkable(a.biome, S.R, [Math.floor(a.x / T), Math.floor(a.y / T)], rad); return p ? [(p[0] + 0.5) * T, (p[1] + 0.5) * T] : null; };
  const post = (kind, a, dir, extra) => { const p = H.poiFree(B, kind); if (!p) return A.stroll(a); H.claim(a, p); return [H.go(p.x, p.y), { k: 'face', dir: p.face || dir || 'up' }].concat(extra || [{ k: 'idle', t: H.rnd(6, 12) }]).concat([{ k: 'release', poi: p }]); };

  // ---------------------------------------------------------------- activities
  A.btp_lamp = a => { const ps = pois('bplamp'); if (ps.length < 2) return A.stroll(a); const p = ps[Math.floor(S.R() * ps.length)], q = ps[Math.floor(S.R() * ps.length)]; H.count('lamp'); return [{ k: 'carry', what: 'lamp' }, H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'act', t: 2.5 }, H.go(q.x, q.y), { k: 'act', t: 2.5 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }]; };
  A.btp_sweep = a => { H.count('sweep_cloud'); const p = near(a, 8); return p ? [H.go(p[0], p[1]), { k: 'act', t: H.rnd(3, 5) }, { k: 'idle', t: 0.6 }, { k: 'act', t: 3 }] : A.stroll(a); };
  A.btp_lane = a => { const ps = pois('bplane'); if (!ps.length) return A.stroll(a); const p = ps[Math.floor(S.R() * ps.length)]; H.count('lane'); return [H.go(p.x, p.y, { run: 1.5 }), { k: 'face', dir: 'up' }, { k: 'hop', t: 0.7 }, { k: 'act', t: 2.4 }, { k: 'bubble', kind: 'star' }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 1.2 }]; };
  A.btp_king = a => {   // free: swagger; held (after the signature): paces inside the seal, sits, looks up
    const f = S.btp;
    if (f.bound) { const out = []; for (let n = 0; n < 2; n++) { const p = H.nearestWalk(SEAL[0] + H.rnd(-14, 14), SEAL[1] + H.rnd(-10, 10), B, 2); if (p) out.push(H.go(p[0], p[1], { run: 0.9 }), { k: 'idle', t: H.rnd(1, 3) }); } H.count('caged'); out.push({ k: 'face', dir: 'up' }, { k: S.R() < 0.5 ? 'sit' : 'idle', t: H.rnd(4, 9) }, { k: 'bubble', kind: S.R() < 0.5 ? 'dots' : 'excl' }, { k: 'act', t: 1.4 }, { k: 'idle', t: 2 }); return out; }
    const r = S.R(); if (r < 0.25) return A.palm_cloudride(a); if (r < 0.45) return A.btp_lane(a); if (r < 0.6) return A.palm_perch(a); if (r < 0.75) return A.hop_rocks(a); if (r < 0.88) return A.palm_rest(a); return A.stroll(a);
  };

  // ---------------------------------------------------------------- mini events
  const M = S.MINI, ruleOut = () => S.biomes.btp.run && S.biomes.btp.phase !== 'peace';
  const lookAt = (xy, who) => { for (const a of who) H.assign(a, [{ k: 'face', x: xy[0], y: xy[1] }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }, { k: 'idle', t: 2.4 }], 'mini'); };
  M.btp_clouds = b => { const f = S.btp; if (f.coverT > 0.7 || ruleOut()) return false; f.coverT = 0.95; f.windT = 1.5; later(26, () => { f.coverT = 0.55; f.windT = 1; }); H.count('clouds_roll'); return true; };
  M.btp_cranes = b => { const f = S.btp; if (f.landings.length) return false; f.landings.push({ t: 0, dur: 36, fing: Math.floor(S.R() * 5), n: 5 }); lookAt(TOP, some(['attendant', 'maiden'], 2)); H.count('cranes_tip'); return true; };
  M.btp_lotus = b => { const f = S.btp; if (f.lotusT > 0.6 || ruleOut()) return false; f.lotusT = 1; f.petalBoost = 1; later(18, () => { f.lotusT = 0.3; f.petalBoost = 0; later(16, () => { f.lotusT = 0.5; }); }); for (const a of some(['attendant', 'maiden'], 2)) H.assign(a, [{ k: 'face', x: SEAL[0], y: SEAL[1] }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 4 }], 'mini'); H.count('lotus_bloom'); return true; };
  M.btp_runes = b => { const f = S.btp; if (f.runesT > 0.5 || ruleOut()) return false; f.runesT = 1; for (let k = 0; k < 5; k++) { const kk = k; later(k * 0.7, () => { f.glowT[kk] = 0.9; }); later(10 + k * 0.7, () => { f.glowT[kk] = 0.15; }); } later(11, () => { f.runesT = 0; }); lookAt(SEAL, some(['attendant', 'maiden', 'monkeyking'], 3)); H.count('runes'); return true; };
  M.btp_thunder = b => { const f = S.btp; if (ruleOut()) return false; f.thunder = 1; f.flash = 0.45; later(1.6, () => { f.thunder = 0.6; f.flash = 0.3; }); lookAt(TOP, some(['attendant', 'maiden'], 3)); H.count('thunder'); return true; };
  M.btp_lamps = b => { const a = some(['attendant', 'maiden'], 3), ps = pois('bplamp'); if (a.length < 2 || ps.length < 2) return false; a.forEach((m, n) => { const seq = [{ k: 'carry', what: 'lamp' }]; for (const p of ps.slice(n, n + 3)) seq.push(H.go(p.x, p.y), { k: 'act', t: 1.8 }); seq.push({ k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }); H.assign(m, seq, 'mini'); }); S.btp.lamp = 1; later(20, () => { S.btp.lamp = 0; }); H.count('lamps'); return true; };
  M.btp_runner = b => { const k = S.agents.find(a => a.biome === B && a.role === 'monkeyking' && free(a)), ps = pois('bplane'); if (!k || ps.length < 3 || S.btp.bound) return false; H.assign(k, [...ps.flatMap(p => [H.go(p.x, p.y, { run: 1.9 }), { k: 'hop', t: 0.5 }]), { k: 'face', dir: 'up' }, { k: 'act', t: 2.6 }, { k: 'bubble', kind: 'star' }, { k: 'idle', t: 2 }], 'mini'); H.count('finger_run'); return true; };
  M.btp_dust = b => { const f = S.btp; if (f.dustT > 0.5 || ruleOut()) return false; f.dustT = 1; later(14, () => { f.dustT = 0; }); lookAt(SEAL, some(['attendant', 'maiden'], 2)); H.count('dust_ring'); return true; };
  M.btp_gust = b => { const f = S.btp; if (f.coverT < 0.4 || ruleOut()) return false; f.windT = 2.4; f.coverT = 0.1; for (let q = 0; q < 8; q++) f.flocks.push({ kind: 'bird', x: 74 * T + (q - 4) * 6, y: 44 * T, vx: -10, vy: -6, t: -q * 0.15, life: 16, ph: q, z: 60 + S.R() * 40 }); later(12, () => { f.windT = 1; f.coverT = 0.55; }); H.count('gust'); return true; };

  // ---------------------------------------------------------------- story ops
  const O = S.opExt, pend = (R, fn) => { const t0 = S.t; R.pend = () => { R.pendT = 0; return fn() || S.t - t0 > 60; }; };
  O.btp_fore = (R, o) => { const f = S.btp; f.bound = 0; f.coverT = 0.8; f.windT = 1.3; f.haloT = 0.5; f.lotusT = 0.8; f.glowT = [0.3, 0.3, 0.3, 0.3, 0.3]; focus(P.btp_palm(), 14); cap('Lòng bàn tay Phật Tổ — nơi Đại Thánh tưởng là cõi vô tận', 'The Buddha\'s palm — what the Great Sage takes for the edge of the world', 7);
    for (const a of S.agents.filter(q => q.biome === B && q.role !== 'monkeyking' && free(q))) H.assign(a, [{ k: 'face', x: SEAL[0], y: SEAL[1] }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: 20 }], 'mini'); R.wait = o.t || 4; };
  O.btp_swagger = (R, o) => { const k = king(); if (!k) { R.wait = 1; return; } k.story = R; k.hidden = false; k.alpha = 1; focus(P.btp_palm(), 18); cap('Ngộ Không ngạo nghễ chạy nhảy trên lòng bàn tay', 'Wukong swaggers across the palm', 8);
    const pts = [[70, 50], [79, 50], [79, 56], [70, 56], [74, 53]].map(p => H.nearestWalk(...wp(p[0], p[1]), B, 3) || wp(p[0], p[1]));
    H.assign(k, [...pts.flatMap((p, n) => [H.go(p[0], p[1], { run: 1.8 }), { k: n % 2 ? 'hop' : 'act', t: n % 2 ? 0.6 : 1.2 }, { k: 'bubble', kind: n % 2 ? 'star' : 'note' }]), { k: 'idle', t: 1 }], 'story'); pend(R, () => !k.q.length && !k.cur); };
  O.btp_leap = (R, o) => { const f = S.btp, k = king(); if (!k) { R.wait = 1; return; } cap('Ngộ Không lộn cân đẩu vân — quyết bay thoát khỏi giới hạn', 'Wukong somersaults away, determined to leave the limit behind', 8); focus(TOP, 20);
    H.assign(k, [{ k: 'bubble', kind: 'excl' }, { k: 'mount' }, { k: 'soar', x: 74 * T, y: 44 * T, lift: 60, speed: 28 }, { k: 'flip', t: 1.4, rise: 22, keepFly: true }, { k: 'soar', x: 76 * T, y: 36 * T, lift: 120, speed: 30 }, { k: 'flip', t: 1.4, rise: 22, keepFly: true }, { k: 'soar', x: 90 * T, y: 32 * T, lift: 130, speed: 30 }, { k: 'bubble', kind: 'star' }, { k: 'idle', t: 8 }], 'story');
    f.windT = 1.8; later(6, () => { f.coverT = 0.9; }); pend(R, () => k.cur && k.cur.k === 'idle'); };
  O.btp_fingers = (R, o) => { const f = S.btp, k = king(); cap('Năm ngón tay sáng lên — chặn đường Đại Thánh', 'The five fingers light up and bar his way', 8); focus(P.btp_palm(), 14); for (let q = 0; q < 5; q++) { const kk = q; later(q * 1.2, () => { f.glowT[kk] = 1; burst(F.fingers[kk].cx * T, F.fingers[kk].y0 * T, 'gold'); }); }
    f.runesT = 1; f.haloT = 0.9; f.windT = 1.6; if (k) { H.assign(k, [{ k: 'bubble', kind: 'q' }, { k: 'soar', x: 80 * T, y: 40 * T, lift: 90, speed: 28 }, { k: 'idle', t: 8 }], 'story'); } R.wait = o.t || 8; };
  O.btp_reveal = (R, o) => { const f = S.btp, k = king(); f.coverT = 0; f.windT = 2.4; f.lotusT = 1; f.petalBoost = 1; f.shake = 0.5; f.flash = 0.5; focus(P.btp_palm(), 16); cap('Mây rẽ ra — cả lòng bàn tay hiện trọn vẹn', 'The clouds part: the whole palm is revealed', 8);
    for (let q = 0; q < 14; q++) f.flocks.push({ kind: q % 3 ? 'bird' : 'crane', x: (70 + S.R() * 10) * T, y: 42 * T, vx: (S.R() - 0.5) * 18, vy: -8 - S.R() * 6, t: -S.R() * 0.5, life: 18, ph: q, z: 60 + S.R() * 60 });
    if (k) H.assign(k, [{ k: 'soar', x: SEAL[0] + 40, y: SEAL[1] + 20, lift: 40, speed: 28 }, { k: 'land', t: 1.2 }, { k: 'bubble', kind: 'excl' }, { k: 'idle', t: 600 }], 'story'); R.wait = o.t || 6; pend(R, () => !k || (k.cur && k.cur.k === 'idle')); };
  O.btp_inscribe = (R, o) => { const f = S.btp; f.inscrT = 1; f.runesT = 1; f.haloT = 1; focus(SEAL, 14); cap('Thần chú hiện ra quanh Đại Thánh', 'The divine inscription appears around him', 8); for (const a of S.agents.filter(q => q.biome === B && q.role !== 'monkeyking' && free(q))) H.assign(a, [{ k: 'face', x: SEAL[0], y: SEAL[1] }, { k: 'sit', t: 12 }, { k: 'idle', t: 30 }], 'mini'); R.wait = o.t || 8; };
  O.btp_seal = (R, o) => { const f = S.btp, k = king(); f.beamsT = 1; f.columnT = 1; f.windT = 2.2; f.haloT = 1; f.shake = 0.4; focus(SEAL, 16); cap('Năm cột ngón khép lại — pháp lực giam giữ', 'The five pillars close in: a prison of divine force', 8);
    if (k) H.assign(k, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.5 }, { k: 'act', t: 1.5 }, { k: 'hop', t: 0.5 }, { k: 'act', t: 1.5 }, { k: 'idle', t: 600 }], 'story'); burst(SEAL[0], SEAL[1], 'gold'); R.wait = o.t || 8; };
  O.btp_bind = (R, o) => { const f = S.btp, k = king(); f.bound = 1; f.flash = 1; f.thunder = 1; f.shake = 1.2; f.coverT = 0.9; f.windT = 2.8; focus(SEAL, 16); cap('Ngộ Không bị trấn áp giữa lòng bàn tay — sóng thần lực lan ra', 'Wukong is pressed down into the seal; a shock wave rolls outward', 9);
    burst(SEAL[0], SEAL[1], 'shock'); later(0.8, () => burst(SEAL[0], SEAL[1], 'jade')); for (let q = 0; q < 18; q++) f.flocks.push({ kind: q % 3 ? 'bird' : 'crane', x: SEAL[0] + (S.R() - 0.5) * 80, y: SEAL[1] - 20, vx: (S.R() - 0.5) * 30, vy: -9 - S.R() * 8, t: -S.R() * 0.4, life: 18, ph: q, z: 40 + S.R() * 80 });
    if (k) H.assign(k, [{ k: 'sit', t: 5 }, { k: 'bubble', kind: 'excl' }, { k: 'sit', t: 600 }], 'story'); R.wait = o.t || 9; };
  O.btp_hold = (R, o) => { const f = S.btp; f.shake = 0; f.windT = 1.2; focus(P.btp_buddha(), 16); cap('Phật Tổ vẫn ngồi bất động — uy nghiêm như núi', 'The Buddha sits unmoved, majestic as a mountain', 9); f.petalBoost = 1; f.haloT = 1; R.wait = o.t || 10; };
  O.btp_settle = (R, o) => { const f = S.btp; f.beamsT = 0; f.columnT = 0.0; f.coverT = 0.6; f.windT = 1; f.glowT = [0.35, 0.35, 0.35, 0.35, 0.35]; f.haloT = 0.6; f.inscrT = 0.5; focus(SEAL, 12); cap('Lực giam giữ ổn định — mây lắng xuống', 'The binding steadies and the clouds settle', 8); for (const a of S.agents.filter(q => q.biome === B && q.role !== 'monkeyking')) { a.gathered = null; H.assign(a, [{ k: 'bubble', kind: 'heart' }, { k: 'idle', t: 2 }], 'story'); } R.wait = o.t || 8; };
  O.btp_recover = (R, o) => { const f = S.btp; f.petalBoost = 0.4; f.glowT = [0.15, 0.15, 0.15, 0.15, 0.15]; f.runesT = 0; f.inscrT = 0.25; f.haloT = 0.4; f.focus = null; const k = king(); if (k) { k.story = null; H.assign(k, [{ k: 'idle', t: 2 }], 'story'); } R.wait = o.t || 3; };
  O.btp_peace = (R, o) => { const f = S.btp; f.windT = 1; f.coverT = 0.55; f.inscrT = 0.3; f.beamsT = 0; f.columnT = 0; f.runesT = 0; f.focus = null; f.petalBoost = 0; };

  D.beacon.btp = '255,226,150';
  D.biomes.btp = {
    residents: [['wukong', 1, 'monkeyking'], ['palm_attendant', 4, 'attendant'], ['tc_fairy', 2, 'maiden']],
    roles: { monkeyking: [['btp_king', 1]], attendant: [['palm_lotus', 3], ['palm_devotion', 3], ['palm_offering', 2], ['btp_lamp', 2], ['btp_sweep', 2], ['palm_rest', 1]], maiden: [['palm_lotus', 3], ['palm_devotion', 2], ['btp_lamp', 3], ['btp_sweep', 2], ['stroll', 2]] },
    minis: ['btp_clouds', 'btp_cranes', 'btp_lotus', 'btp_runes', 'btp_thunder', 'btp_lamps', 'btp_runner', 'btp_dust', 'btp_gust', 'palm_somersault', 'palm_bounce'],
    stories: [
      { id: 'buddha_subdues_wukong', title: ['Phật Tổ thu phục Ngộ Không', 'The Buddha Subdues Wukong'],
        fore: [['btp_fore', { t: 4 }]],
        beats: [['btp_swagger', {}], ['btp_leap', {}], ['btp_fingers', { t: 8 }], ['btp_reveal', { t: 6 }], ['btp_inscribe', { t: 8 }], ['btp_seal', { t: 8 }], ['btp_bind', { t: 9 }], ['btp_hold', { t: 10 }], ['btp_settle', { t: 8 }], ['disperse', {}]],
        after: { fx: 'petals', at: 'btp_palm', r: 50 },
        recover: [['btp_recover', { t: 3 }], ['wait', { t: 14 }], ['btp_peace', {}], ['wait', { t: 2 }]] },
    ],
  };
})();
