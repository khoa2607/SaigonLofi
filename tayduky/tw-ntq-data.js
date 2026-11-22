'use strict';
// ===== Tây Du Ký v2 — Ngũ Trang Quán: residents, the Ginseng Fruit Tree, mini events and the signature (DOM-free; loaded after tw-sim.js and tw-nhs-data.js) =====
// Visible state lives in TWS.ntq (read by tw-ntq-fx.js): wind / gust, mist, rain / rainbow, glow, the TREE {fall, vit, roots, shake, fruit[9]}, falling fruit, sinks (a fruit sinking into the earth), flocks, bursts, landings (cranes),
// the swirl of leaves, the chant, the nectar, the talisman circle and the binding ropes, the wave of light, Guanyin's light, the feast.
// Signature - "Nhân Sâm Quả" (the Ginseng Fruit): the four pilgrims reach the monastery -> the two boys offer the baby-shaped fruit, Tang Sanzang refuses -> Wukong knocks one down, Bajie and Sha Seng share it -> the fruit that touches the
// earth sinks into it -> the boys protest, Wukong strikes the tree down -> Zhenyuan returns on a cloud and binds the four -> Wukong flies to beg Guanyin -> she descends with the willow vase -> the nectar raises the tree: roots glow, the trunk
// stands, leaves open, fruit ripens, light sweeps the garden -> reconciliation and a feast -> the pilgrims leave and the monastery returns to its ordinary day.
(function () {
  const S = TWS, H = S.H, D = window.TW_DATA, B = 'ntq', F = TWM.ntq, T = 8;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = (v, t, r, dt) => Math.abs(t - v) <= r * dt ? t : v + Math.sign(t - v) * r * dt, sm = t => t * t * (3 - 2 * t);
  const TW = (a, b) => [(a + 0.5) * T, (b + 0.5) * T];
  const NF = 9;
  const newState = () => ({ wind: 1, windT: 1, gust: 1, mist: 0.3, mistT: 0.3, rain: 0, rainT: 0, rainbow: 0, rainbowT: 0, glow: 0.2, glowT: 0.2, shake: 0, flash: 0,
    tree: { fall: 0, fallT: 0, vit: 1, vitT: 1, roots: 0, rootsT: 0, shake: 0, fruit: Array.from({ length: NF }, (_, i) => ({ g: 1, gT: 1, hit: 0 })), state: 'ok' },
    drops: [], sinks: [], flocks: [], bursts: [], landings: [], swirl: 0, swirlAt: 0, chant: 0, chantT: 0, nectar: 0, nectarT: 0, talisman: 0, talismanT: 0, bind: { on: 0, onT: 0, ids: [] }, wave: -99, gy: 0, gyT: 0, feast: 0, feastT: 0, lotus: 0, caption: null, capT: 0,
    branch: null, petalBoost: 0, sparkle: 0, sparkleT: 0, dust: [], leaves: [] });
  const baseInit = S.init, baseTick = S.tick;
  S.init = function (seed) { S.ntq = newState(); baseInit(seed); };
  const timers = []; const later = (sec, fn) => timers.push({ at: S.t + sec, fn });
  S.tick = function (dt) {
    baseTick(dt); const f = S.ntq; if (!f) return; const tr = f.tree;
    f.wind = ease(f.wind, f.windT, 0.4, dt); f.gust = 1 + (f.wind - 1) * 1.5 + f.shake * 3; f.mist = ease(f.mist, f.mistT, 0.05, dt); f.rain = ease(f.rain, f.rainT, 0.15, dt); f.glow = ease(f.glow, f.glowT, 0.3, dt);
    f.rainbow = ease(f.rainbow, f.rain < 0.05 && f.rainbowT > S.t ? 1 : 0, 0.12, dt); f.shake = Math.max(0, f.shake - dt * 1.2); f.flash = Math.max(0, f.flash - dt * 1.8); f.chant = ease(f.chant, f.chantT, 0.6, dt);
    f.nectar = ease(f.nectar, f.nectarT, 0.5, dt); f.talisman = ease(f.talisman, f.talismanT, 0.7, dt); f.bind.on = ease(f.bind.on, f.bind.onT, 0.8, dt); f.gy = ease(f.gy, f.gyT, 0.4, dt); f.feast = ease(f.feast, f.feastT, 0.35, dt); f.sparkle = ease(f.sparkle, f.sparkleT, 0.8, dt);
    tr.fall = ease(tr.fall, tr.fallT, tr.fallT > tr.fall ? 0.9 : 0.16, dt); tr.vit = ease(tr.vit, tr.vitT, tr.vitT > tr.vit ? 0.1 : 0.45, dt); tr.roots = ease(tr.roots, tr.rootsT, 0.14, dt); tr.shake = Math.max(0, tr.shake - dt * 0.8);
    tr.state = tr.fall > 0.5 ? (tr.fallT > 0.5 ? 'fallen' : 'rising') : tr.vit < 0.7 ? 'withered' : 'ok';
    for (const q of tr.fruit) { q.g = ease(q.g, q.gT, q.gT > q.g ? 0.35 : 1.4, dt); q.hit = Math.max(0, q.hit - dt * 2); }
    for (const q of f.drops) q.t += dt; f.drops = f.drops.filter(q => q.t < q.life); for (const q of f.sinks) q.t += dt; f.sinks = f.sinks.filter(q => q.t < 5);
    for (const q of f.flocks) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; } f.flocks = f.flocks.filter(q => q.t < q.life); for (const b of f.bursts) b.t += dt; f.bursts = f.bursts.filter(b => b.t < 2.6);
    for (const q of f.landings) q.t += dt; f.landings = f.landings.filter(q => q.t < q.dur); for (const q of f.dust) q.t += dt; f.dust = f.dust.filter(q => q.t < q.life); for (const q of f.leaves) q.t += dt; f.leaves = f.leaves.filter(q => q.t < q.life);
    if (f.branch) { f.branch.t += dt; if (f.branch.t > 1.8) f.branch = null; }
    if (f.swirl > 0 && S.t > f.swirlAt + 15) f.swirl = 0;
    // ambient: the tree breathes light; now and then a fruit shimmers
    if (tr.state === 'ok' && !S.biomes.ntq.run && S.R() < dt * 0.04) { const q = tr.fruit[Math.floor(S.R() * NF)]; q.hit = 1; }
    for (const a of S.agents) if (a.rideOf) { const h = a.rideOf; if (h.gone || h.hidden) { a.rideOf = null; a.lift = 0; continue; } a.x = h.x; a.y = h.y; a.gz = h.gz; a.lift = 9.5; a.pose = 'sit'; a.moving = false; }
    for (let i = timers.length - 1; i >= 0; i--) if (S.t >= timers[i].at) { const t = timers.splice(i, 1)[0]; t.fn(); }
  };
  const burst = (x, y, kind) => S.ntq.bursts.push({ x, y, t: 0, kind: kind || 'gold' });
  const free = a => H.free(a);
  const near = (a, rad) => { const p = TWM.randomWalkable(a.biome, S.R, [Math.floor(a.x / T), Math.floor(a.y / T)], rad); return p ? [(p[0] + 0.5) * T, (p[1] + 0.5) * T] : null; };
  const X = S.stepExt, P = S.pointExt;
  X.ntqcall = (a, st) => { st.fn(a); return true; };
  X.ntqfade = (a, st, dt) => { st.el = (st.el || 0) + dt; a.alpha = Math.max(0, 1 - st.el / (st.d || 1.4)); if (st.el >= (st.d || 1.4)) { a.gone = true; return true; } return false; };
  const FT = () => S.ntq.tree;
  P.ntq_gate = () => TW(118, 48); P.ntq_plaza = () => TW(113, 47); P.ntq_tree = () => TW(111, 45); P.ntq_hall = () => TW(105, 38); P.ntq_land = () => TW(113, 45); P.ntq_court = () => TW(111, 46); P.ntq_trunk = () => [F.tree[0] * T, F.tree[1] * T];
  const trunk = () => P.ntq_trunk();
  const alive = roles => S.agents.filter(a => a.biome === B && roles.includes(a.role) && !a.gone && !a.hidden);

  // ---------------------------------------------------------------- activities
  const A = S.ACT, pois = k => H.pois(B, k);
  const post = (kind, a, dir, extra) => { const p = H.poiFree(B, kind); if (!p) return A.stroll(a); H.claim(a, p); return [H.go(p.x, p.y), { k: 'face', dir: p.face || dir || 'up' }].concat(extra || [{ k: 'idle', t: H.rnd(6, 12) }]).concat([{ k: 'release', poi: p }]); };
  A.ntq_sweep = a => { H.count('sweep'); return post('qsweep', a, 'down', [{ k: 'act', t: H.rnd(4, 7) }, { k: 'idle', t: 0.6 }, { k: 'act', t: H.rnd(3, 6) }, { k: 'idle', t: 1.5 }]); };
  A.ntq_herb = a => { H.count('herb'); return post('qherb', a, 'down', [{ k: 'act', t: H.rnd(3, 5) }, { k: 'carry', what: 'herb' }, { k: 'idle', t: 1.5 }, { k: 'act', t: 3 }, { k: 'carry', what: null }, { k: 'idle', t: 1 }]); };
  A.ntq_water = a => { H.count('water_n'); return post('qwater', a, 'down', [{ k: 'carry', what: 'pail' }, { k: 'act', t: H.rnd(4, 7) }, { k: 'idle', t: 1 }, { k: 'act', t: 3 }, { k: 'carry', what: null }]); };
  A.ntq_tea = a => { H.count('tea'); return post('qtea', a, 'up', [{ k: 'carry', what: 'cup' }, { k: 'sit', t: H.rnd(8, 14) }, { k: 'bubble', kind: 'note' }, { k: 'sit', t: H.rnd(3, 6) }, { k: 'carry', what: null }]); };
  A.ntq_read = a => { H.count('read'); return post('qread', a, 'up', [{ k: 'sit', t: H.rnd(10, 18) }, { k: 'bubble', kind: 'dots' }, { k: 'sit', t: H.rnd(4, 8) }]); };
  A.ntq_feed = a => { H.count('feed'); return post('qfeed', a, 'down', [{ k: 'carry', what: 'herb' }, { k: 'act', t: 3 }, { k: 'idle', t: 1.2 }, { k: 'act', t: 3 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }]); };
  A.ntq_tend = a => { H.count('tend'); return post('qtend', a, 'up', [{ k: 'act', t: H.rnd(3, 5) }, { k: 'idle', t: 1 }, { k: 'act', t: 3 }, { k: 'idle', t: 2 }, { k: 'bubble', kind: 'star' }]); };
  A.ntq_gather = a => { H.count('gather_n'); return post('qgather', a, 'down', [{ k: 'act', t: 2.5 }, { k: 'carry', what: 'leaf' }, { k: 'idle', t: 1 }, { k: 'carry', what: null }]); };
  A.ntq_pray = a => { H.count('pray_n'); return post('qpray', a, 'up', [{ k: 'act', t: 2.2 }, { k: 'sit', t: H.rnd(7, 13) }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 2 }]); };
  A.ntq_look = a => { H.count('look_n'); return post('qlook', a, 'right', [{ k: 'idle', t: H.rnd(8, 14) }, { k: 'bubble', kind: 'q' }, { k: 'idle', t: H.rnd(3, 6) }]); };
  A.ntq_rest = a => { H.count('rest_n'); return post('qrest', a, 'up', [{ k: 'sit', t: H.rnd(10, 18) }, { k: 'bubble', kind: 'note' }]); };
  A.ntq_graze = a => { H.count('graze'); return post('qgraze', a, 'down', [{ k: 'act', t: H.rnd(5, 9) }, { k: 'idle', t: H.rnd(1.5, 3) }, { k: 'act', t: H.rnd(4, 8) }, { k: 'idle', t: H.rnd(2, 4) }]); };
  A.ntq_drink = a => { H.count('drink'); return post('qdrink', a, 'up', [{ k: 'act', t: H.rnd(3, 5) }, { k: 'idle', t: 1.2 }, { k: 'act', t: H.rnd(2, 4) }, { k: 'idle', t: H.rnd(2, 3) }]); };
  A.ntq_play = a => { const ps = [0, 1, 2].map(() => near(a, 9)).filter(Boolean); H.count('play'); return ps.length ? ps.flatMap(p => [H.go(p[0], p[1], { run: 1.7 }), { k: 'hop', t: 0.7 }]).concat([{ k: 'bubble', kind: 'note' }]) : A.stroll(a); };
  A.ntq_walk = a => { const cands = [TW(116, 46), TW(106, 41), TW(100, 44), TW(119, 38), TW(108, 38)], p = cands[Math.floor(S.R() * cands.length)]; H.count('walk_n'); return [H.go(p[0], p[1], { run: 1 }), { k: 'idle', t: H.rnd(2, 5) }]; };
  A.ntq_meditate = a => { const p = H.poiFree(B, 'qread') || H.poiFree(B, 'qpray'); if (!p) return A.ntq_walk(a); H.claim(a, p); H.count('meditate'); return [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'sit', t: H.rnd(14, 24) }, { k: 'ntqcall', fn: () => { S.ntq.chantT = 1; later(8, () => { S.ntq.chantT = 0; }); } }, { k: 'sit', t: 6 }, { k: 'release', poi: p }]; };

  // ---------------------------------------------------------------- mini events
  const M = S.MINI, some = (roles, n) => S.agents.filter(a => a.biome === B && roles.includes(a.role) && !a.gone && !a.hidden && free(a)).slice(0, n);
  const lookAt = (xy, who) => { for (const a of who) H.assign(a, [{ k: 'face', x: xy[0], y: xy[1] }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }, { k: 'idle', t: 2.4 }], 'mini'); };
  const ruleOut = () => S.biomes.ntq.run && S.biomes.ntq.phase !== 'peace';
  function makeActor(char, x, y, R) { const ch = window.TD2_CHARS && window.TD2_CHARS.chars[char]; const i = Math.floor(x / T), j = Math.floor(y / T); const a = { id: S.agents.length, char, look: char, biome: B, role: 'actor', x, y, gz: 0, lift: 0, dir: 'down', frame: 'idle0', pose: 'idle', moving: false, q: [], cur: null, dist: 0, v: (ch ? ch.speed : 20) / 4 * 0.9, bubble: null, bubbleT: 0, carry: null, alpha: 1, inWater: false, thread: 0, wrap: false, gone: false, hidden: false, story: R || null, gathered: null, busyUntil: 0, home: [i, j], task: null, actT: 0, phase: S.R() * 10 }; a.gz = TWM.groundZ(a.x, a.y); S.agents.push(a); return a; }
  M.ntq_cranes = b => { const f = S.ntq, at = [F.pools.lotus[0] * T, F.pools.lotus[1] * T]; if (f.landings.length) return false; f.landings.push({ t: 0, dur: 34, at, n: 4 }); lookAt(trunk(), some(['boy', 'girl', 'fairy'], 2)); H.count('cranes'); return true; };
  M.ntq_fruit = b => { const tr = FT(); if (tr.state !== 'ok') return false; const f = S.ntq; for (const q of tr.fruit) q.hit = 1; tr.shake = 1; f.sparkleT = 1; later(8, () => { S.ntq.sparkleT = 0; }); burst(...trunk(), 'gold'); lookAt(trunk(), some(['boy', 'girl', 'deer'], 3)); H.count('fruitglow'); return true; };
  M.ntq_tea_mini = b => { const bs = some(['boy', 'girl'], 2), z = some(['sage'], 1); if (bs.length < 2) return false; const p = pois('qtea'); if (p.length < 2) return false; bs.forEach((a, n) => H.assign(a, [{ k: 'carry', what: 'cup' }, H.go(p[n].x, p[n].y), { k: 'face', dir: 'up' }, { k: 'act', t: 2 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 6 }], 'mini')); if (z[0]) H.assign(z[0], [H.go(p[2 % p.length].x, p[2 % p.length].y), { k: 'face', dir: 'up' }, { k: 'sit', t: 12 }, { k: 'bubble', kind: 'note' }], 'mini'); H.count('teaserve'); return true; };
  M.ntq_deer_drink = b => { const d = some(['deer'], 3), ps = pois('qdrink'); if (d.length < 2 || ps.length < 2) return false; d.forEach((a, n) => { const p = ps[(n * 2) % ps.length], q = near(a, 14) || [a.x, a.y]; H.assign(a, [{ k: 'wait', t: n * 0.8 }, H.go(p.x, p.y), { k: 'face', dir: p.face || 'up' }, { k: 'act', t: 4 }, { k: 'idle', t: 1 }, { k: 'act', t: 3 }].concat(n === 0 ? [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.6 }, H.go(q[0], q[1], { run: 2 })] : [{ k: 'idle', t: 1.4 }, H.go(q[0], q[1], { run: 1.8 })]), 'mini'); }); H.count('deer_drink'); return true; };
  M.ntq_swirl = b => { const f = S.ntq; if (f.swirl > 0) return false; f.swirl = 1; f.swirlAt = S.t; lookAt(trunk(), some(['boy', 'girl', 'fairy', 'monkey'], 3)); H.count('swirl'); return true; };
  M.ntq_chant = b => { const z = some(['sage'], 1)[0]; if (!z) return false; const f = S.ntq, p = H.poiFree(B, 'qpray'); if (!p) return false; H.claim(z, p); H.assign(z, [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'sit', t: 3 }, { k: 'ntqcall', fn: () => { S.ntq.chantT = 1; } }, { k: 'sit', t: 12 }, { k: 'ntqcall', fn: () => { S.ntq.chantT = 0; } }, { k: 'release', poi: p }], 'mini'); H.count('chant'); return true; };
  M.ntq_rain = b => { const f = S.ntq; if (f.rainT > 0.1 || ruleOut()) return false; f.rainT = 0.5; f.mistT = 0.7; later(22, () => { f.rainT = 0; f.rainbowT = S.t + 40; f.mistT = 0.3; }); const sh = pois('qread'); for (const a of S.agents.filter(q => q.biome === B && free(q) && !q.hidden)) { const p = sh.length ? sh[Math.floor(S.R() * sh.length)] : null; if (p && S.R() < 0.7) H.assign(a, [{ k: 'bubble', kind: 'excl' }, H.go(p.x, p.y, { run: 1.8 }), { k: 'idle', t: 18 }], 'mini'); } H.count('rain'); return true; };
  M.ntq_birds = b => { const f = S.ntq, [x, y] = trunk(); if (FT().state !== 'ok') return false; for (let q = 0; q < 8; q++) f.flocks.push({ kind: 'bird', x: x + (q - 4) * 4, y: y - 8, vx: -9 - S.R() * 5, vy: -4 - S.R() * 4, t: -0.4 - q * 0.12, life: 14, ph: q, z: 40 + S.R() * 30, perch: true }); FT().fruit[Math.floor(S.R() * NF)].hit = 1; H.count('birdfruit'); return true; };
  M.ntq_bajie = b => { if (ruleOut() || S.agents.some(a => a.biome === B && a.role === 'actor' && !a.gone)) return false; const g = P.ntq_gate(), a = makeActor('bajie', g[0], g[1]), t = P.ntq_tree(), q = near(a, 10) || g; H.assign(a, [{ k: 'bubble', kind: 'q' }, H.go(t[0], t[1] + 4, { run: 1.1 }), { k: 'face', x: trunk()[0], y: trunk()[1] }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 3 }, { k: 'bubble', kind: 'star' }, { k: 'idle', t: 2.5 }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.6 }, H.go(g[0], g[1], { run: 2 }), { k: 'ntqfade' }], 'mini'); lookAt(P.ntq_tree(), some(['boy'], 1)); H.count('bajie_peek'); return true; };
  M.ntq_branch = b => { if (ruleOut() || S.agents.some(a => a.biome === B && a.role === 'actor' && !a.gone)) return false; const g = P.ntq_gate(), a = makeActor('wk_pilgrim', g[0], g[1]), t = P.ntq_tree(); H.assign(a, [H.go(t[0] + 6, t[1] + 6, { run: 1.4 }), { k: 'face', x: trunk()[0], y: trunk()[1] }, { k: 'act', t: 1.2 }, { k: 'ntqcall', fn: () => { S.ntq.branch = { t: 0, x: a.x, y: a.y }; later(1.2, () => { S.ntq.leaves.push(...Array.from({ length: 10 }, () => ({ x: trunk()[0] + (S.R() - 0.5) * 30, y: trunk()[1] + (S.R() - 0.5) * 16, z: 60 + S.R() * 30, t: 0, life: 3 + S.R() * 2 }))); S.ntq.tree.shake = 1; S.ntq.tree.fruit[3].hit = 1; }); } }, { k: 'idle', t: 2 }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.5 }, H.go(g[0], g[1], { run: 2 }), { k: 'ntqfade' }], 'mini'); lookAt(P.ntq_tree(), some(['boy', 'girl'], 2)); H.count('wk_branch'); return true; };

  // ---------------------------------------------------------------- story ops
  const O = S.opExt, pend = (R, fn) => { const t0 = S.t; R.pend = () => { R.pendT = 0; return fn() || S.t - t0 > 150; }; }, act = (R, n) => R.actors[n];
  const cap = (a, b, dur) => { const f = S.ntq; f.caption = [a, b]; f.capT = S.t + (dur || 6); };
  O.ntq = (R, o) => { const f = S.ntq; if (o.rain !== undefined) f.rainT = o.rain; if (o.wind !== undefined) f.windT = o.wind; if (o.mist !== undefined) f.mistT = o.mist; if (o.glow !== undefined) f.glowT = o.glow; if (o.flash) f.flash = 1; if (o.shake) f.shake = o.shake; };
  O.ntq_fore = (R, o) => { const f = S.ntq, [x, y] = trunk(); f.glowT = 0.7; f.mistT = 0.55; f.sparkleT = 0.6; for (const q of FT().fruit) q.hit = 1; for (const a of S.agents.filter(q => q.biome === B && q.role === 'sage')) { a.hidden = true; a.q = []; a.cur = null; }
    for (const a of S.agents.filter(q => q.biome === B && q.role !== 'actor' && free(q) && !q.hidden)) H.assign(a, [{ k: 'face', x, y }, { k: 'idle', t: 6 }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: 4 }], 'mini');
    f.landings.push({ t: 0, dur: 30, at: [F.pools.lotus[0] * T, F.pools.lotus[1] * T], n: 3 }); cap('Ngũ Trang Quán — nơi cây Nhân Sâm Quả ba nghìn năm mới kết quả', 'Wuzhuang Temple: the ginseng fruit ripens once in three thousand years', 6); R.wait = o.t || 4; };
  O.ntq_arrive = (R, o) => {   // the four pilgrims walk in through the gate and up the avenue to the Ginseng Court
    const f = S.ntq; f.glowT = 0.5; const ids = ['monk', 'bj', 'st', 'wk'], p0 = P.ntq_plaza(), spots = [[0, 0], [-3, 3], [3, 3], [-6, -1]];
    ids.forEach((id, n) => { const a = act(R, id); if (!a) return; a.story = R; const p = H.nearestWalk(p0[0] + spots[n][0] * 2, p0[1] + spots[n][1] * 1.4, B, 4) || p0; H.assign(a, [{ k: 'wait', t: n * 0.9 }, H.go(p[0], p[1], { run: id === 'monk' ? 1 : 1.1 }), { k: 'face', x: trunk()[0], y: trunk()[1] }, { k: 'idle', t: 600 }], 'story'); });
    cap('Bốn thầy trò tới Ngũ Trang Quán', 'The four pilgrims arrive', 5);
    pend(R, () => ids.every(id => { const a = act(R, id); return !a || (a.cur && a.cur.k === 'idle'); })); };
  O.ntq_welcome = (R, o) => {   // Qingfeng and Mingyue come out of the hall with a tray; the fruit lies there like a sleeping child
    const f = S.ntq, qf = act(R, 'qf'), my = act(R, 'my'), m = act(R, 'monk'); if (!qf || !my) { R.wait = 1; return; } const c = H.nearestWalk(...P.ntq_plaza(), B, 3) || P.ntq_plaza();
    qf.story = R; my.story = R; H.assign(qf, [H.go(c[0] - 5, c[1] - 6, { run: 1.5 }), { k: 'carry', what: 'tray' }, { k: 'face', x: m ? m.x : c[0], y: m ? m.y : c[1] }, { k: 'act', t: 2 }, { k: 'idle', t: 600 }], 'story'); H.assign(my, [{ k: 'wait', t: 0.6 }, H.go(c[0] + 4, c[1] - 6, { run: 1.5 }), { k: 'carry', what: 'tray' }, { k: 'face', x: m ? m.x : c[0], y: m ? m.y : c[1] }, { k: 'act', t: 2 }, { k: 'idle', t: 600 }], 'story');
    cap('Hai đồng tử dâng Nhân Sâm Quả', 'The two boys offer the Ginseng Fruit', 5); f.sparkleT = 1; pend(R, () => qf.cur && qf.cur.k === 'idle' && my.cur && my.cur.k === 'idle'); };
  O.ntq_refuse = (R, o) => {   // Tang Sanzang sees a baby in the fruit and will not eat
    const m = act(R, 'monk'), qf = act(R, 'qf'), my = act(R, 'my'); if (m) H.assign(m, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.6 }, { k: 'bubble', kind: 'dots' }, { k: 'idle', t: 600 }], 'story'); for (const a of [qf, my]) if (a) H.assign(a, [{ k: 'bubble', kind: 'q' }, { k: 'hop', t: 0.5 }, { k: 'idle', t: 600 }], 'story');
    for (const id of ['bj', 'st', 'wk']) { const a = act(R, id); if (a) H.assign(a, [{ k: 'face', x: m ? m.x : 0, y: m ? m.y : 0 }, { k: 'bubble', kind: id === 'bj' ? 'heart' : 'dots' }, { k: 'idle', t: 600 }], 'story'); } cap('Đường Tăng thấy quả giống hài nhi, không dám ăn', 'Sanzang sees a baby in the fruit and refuses', 6); R.wait = o.t || 6; };
  O.ntq_steal = (R, o) => {   // the boys go to fetch tea; Wukong strikes the branch with his rod, two fruit fall; Bajie and Sha Seng catch them
    const f = S.ntq, tr = FT(), wk = act(R, 'wk'), bj = act(R, 'bj'), st = act(R, 'st'), qf = act(R, 'qf'), my = act(R, 'my'), [tx, ty] = trunk(), h = P.ntq_hall(); cap('Ngộ Không lén hái quả cho hai sư đệ', 'Wukong steals fruit for his brothers', 6);
    for (const a of [qf, my]) if (a) H.assign(a, [{ k: 'carry', what: null }, H.go(h[0], h[1], { run: 1.4 }), { k: 'face', dir: 'up' }, { k: 'idle', t: 600 }], 'story');
    const c = H.nearestWalk(tx + 4, ty + 10, B, 3) || [tx, ty + 10]; if (wk) H.assign(wk, [{ k: 'wait', t: 1.5 }, H.go(c[0], c[1], { run: 1.6 }), { k: 'face', x: tx, y: ty }, { k: 'act', t: 1.5 }, { k: 'ntqcall', fn: () => { tr.shake = 1; for (const i of [2, 5]) { tr.fruit[i].gT = 0; tr.fruit[i].hit = 1; f.drops.push({ x: tx + (i === 2 ? -8 : 10), y: ty + 12 + i, z: 110, t: 0, life: 1.6, pick: i === 2 ? 'bj' : 'st' }); } f.leaves.push(...Array.from({ length: 12 }, () => ({ x: tx + (S.R() - 0.5) * 30, y: ty + (S.R() - 0.5) * 14, z: 80 + S.R() * 40, t: 0, life: 3 + S.R() * 2 }))); } }, { k: 'idle', t: 600 }], 'story');
    if (bj) H.assign(bj, [H.go(tx - 8, ty + 14, { run: 1.8 }), { k: 'bubble', kind: 'star' }, { k: 'idle', t: 600 }], 'story'); if (st) H.assign(st, [H.go(tx + 10, ty + 14, { run: 1.8 }), { k: 'bubble', kind: 'star' }, { k: 'idle', t: 600 }], 'story');
    later(3.6, () => { for (const a of [bj, st]) if (a) { a.carry = 'fruit'; H.assign(a, [{ k: 'act', t: 2 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 600 }], 'story'); } });
    later(6.4, () => { burst(tx - 6, ty + 14, 'jade'); burst(tx + 10, ty + 14, 'jade'); f.sinks.push({ x: tx - 6, y: ty + 15, t: 0 }, { x: tx + 10, y: ty + 17, t: 0 }); cap('Quả chạm đất liền biến mất — thấm vào ngũ hành', 'The fruit sinks into the earth — into the five elements', 6); });
    R.wait = o.t || 10; };
  O.ntq_accuse = (R, o) => {   // the boys return, find the fruit gone and the pilgrims chewing: the quarrel
    const qf = act(R, 'qf'), my = act(R, 'my'), wk = act(R, 'wk'), [tx, ty] = trunk(); const c = H.nearestWalk(tx - 2, ty + 14, B, 4) || [tx, ty + 14];
    for (const [a, dx] of [[qf, -8], [my, 8]]) if (a) H.assign(a, [H.go(c[0] + dx, c[1] + 4, { run: 1.8 }), { k: 'face', x: wk ? wk.x : tx, y: wk ? wk.y : ty }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.5 }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.5 }, { k: 'idle', t: 600 }], 'story');
    if (wk) H.assign(wk, [{ k: 'wait', t: 2.5 }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.5 }, { k: 'idle', t: 600 }], 'story'); cap('Hai đồng tử trách móc — Ngộ Không nổi giận', 'The boys scold — Wukong loses his temper', 6); R.wait = o.t || 7; };
  O.ntq_topple = (R, o) => {   // Wukong strikes the tree and it comes crashing down
    const f = S.ntq, tr = FT(), wk = act(R, 'wk'), [tx, ty] = trunk(); cap('Ngộ Không đánh đổ cây Nhân Sâm Quả!', 'Wukong strikes the tree down!', 7);
    if (wk) H.assign(wk, [{ k: 'face', x: tx, y: ty }, { k: 'act', t: 0.9 }, { k: 'act', t: 0.9 }, { k: 'idle', t: 600 }], 'story');
    later(1.6, () => { tr.fallT = 1; tr.vitT = 0.35; tr.rootsT = 0; f.shake = 1.4; f.flash = 1; for (const q of tr.fruit) q.gT = 0; f.windT = 2.6; burst(tx, ty + 6, 'dust'); for (let q = 0; q < 24; q++) f.leaves.push({ x: tx + (S.R() - 0.5) * 70, y: ty + (S.R() - 0.5) * 30, z: 40 + S.R() * 90, t: 0, life: 3 + S.R() * 3 });
      for (let q = 0; q < 16; q++) f.dust.push({ x: tx + (S.R() - 0.5) * 80, y: ty + (S.R() - 0.5) * 40, t: -S.R() * 0.8, life: 5 + S.R() * 3, z: S.R() * 24 });
      for (let q = 0; q < 14; q++) f.flocks.push({ kind: q % 3 ? 'bird' : 'dove', x: tx + (S.R() - 0.5) * 50, y: ty - 10 + (S.R() - 0.5) * 20, vx: -10 - S.R() * 8, vy: -6 - S.R() * 6, t: -S.R() * 0.4, life: 16, ph: q, z: 40 + S.R() * 50 });
      for (const a of S.agents.filter(q => q.biome === B && q.role !== 'actor' && free(q) && !q.hidden)) { const p = near(a, 14) || [a.x, a.y]; H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.5 }, H.go(p[0], p[1], { run: 2.2 }), { k: 'idle', t: 8 }], 'mini'); }
      for (const id of ['monk', 'bj', 'st', 'qf', 'my']) { const a = act(R, id); if (a) H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 600 }], 'story'); } });
    R.wait = o.t || 8; };
  O.ntq_zy_return = (R, o) => {   // Zhenyuan Daxian comes home on a cloud: a flash, a wave of Daoist power
    const f = S.ntq, zy = act(R, 'zy'); if (!zy) { R.wait = 1; return; } const [tx, ty] = trunk(), p = H.nearestWalk(...P.ntq_land(), B, 3) || P.ntq_land(); zy.story = R; zy.hidden = false; zy.alpha = 1; zy.x = p[0] + 110; zy.y = p[1] - 120; zy.gz = TWM.groundZ(p[0], p[1]); zy.lift = 130; f.glowT = 0.9; cap('Trấn Nguyên Đại Tiên trở về', 'Zhenyuan Daxian returns', 6);
    H.assign(zy, [{ k: 'mount' }, { k: 'soar', x: p[0], y: p[1], lift: 24, speed: 62, spin: 0 }, { k: 'land', t: 1.1 }, { k: 'face', x: tx, y: ty }, { k: 'bubble', kind: 'excl' }, { k: 'idle', t: 600 }], 'story'); later(4, () => { f.flash = 1; f.shake = 0.8; burst(p[0], p[1], 'jade'); });
    for (const id of ['monk', 'bj', 'st', 'wk', 'qf', 'my']) { const a = act(R, id); if (a) H.assign(a, [{ k: 'face', x: p[0], y: p[1] }, { k: 'bubble', kind: 'excl' }, { k: 'idle', t: 600 }], 'story'); } pend(R, () => !!(zy.cur && zy.cur.k === 'idle')); };
  O.ntq_bind = (R, o) => {   // the talisman circle and the ropes of Daoist light bind the four pilgrims
    const f = S.ntq, zy = act(R, 'zy'); f.talismanT = 1; f.bind.onT = 1; f.bind.ids = ['monk', 'bj', 'st', 'wk']; f.bind.src = zy ? zy.id : -1; f.windT = 1.6; cap('Trấn Nguyên giáng phép — trói cả bốn thầy trò', 'Zhenyuan casts his binding art on all four', 7);
    for (const id of ['monk', 'bj', 'st', 'wk']) { const a = act(R, id); if (a) H.assign(a, [{ k: 'wait', t: 0.8 }, { k: 'sit', t: 600 }], 'story'); } if (zy) H.assign(zy, [{ k: 'act', t: 2.4 }, { k: 'idle', t: 600 }], 'story'); burst(...trunk(), 'jade'); R.wait = o.t || 9; };
  O.ntq_wukong_go = (R, o) => {   // Wukong slips the rope and rides his cloud off to beg Guanyin
    const f = S.ntq, wk = act(R, 'wk'); if (!wk) { R.wait = 1; return; } cap('Ngộ Không lên đường cầu cứu Quan Âm', 'Wukong sets off to beg Guanyin', 7); H.assign(wk, [{ k: 'bubble', kind: 'star' }, { k: 'mount' }, { k: 'soar', x: wk.x + 30, y: wk.y - 90, lift: 70, speed: 70, spin: 0 }, { k: 'soar', x: wk.x + 160, y: wk.y - 330, lift: 150, speed: 130, spin: 0 }, { k: 'ntqfade', d: 1.2 }], 'story');
    f.bind.ids = ['monk', 'bj', 'st']; f.glowT = 0.3; R.wait = o.t || 8; };
  O.ntq_guanyin = (R, o) => {   // Guanyin descends on a lotus cloud with the willow vase; Wukong returns at her side
    const f = S.ntq, gy = act(R, 'gy'), [tx, ty] = trunk(); if (!gy) { R.wait = 1; return; } const p = H.nearestWalk(tx + 4, ty + 26, B, 4) || [tx + 4, ty + 26]; gy.story = R; gy.hidden = false; gy.alpha = 1; gy.x = p[0] - 100; gy.y = p[1] - 150; gy.gz = TWM.groundZ(p[0], p[1]); gy.lift = 150; f.gyT = 1; f.lotus = 1; cap('Quan Âm Bồ Tát hạ phàm', 'Guanyin descends', 7);
    H.assign(gy, [{ k: 'mount' }, { k: 'soar', x: p[0], y: p[1], lift: 26, speed: 52, spin: 0 }, { k: 'land', t: 1.4 }, { k: 'face', x: tx, y: ty }, { k: 'idle', t: 600 }], 'story');
    const wk = act(R, 'wk'); if (wk) { wk.hidden = false; wk.alpha = 1; wk.gone = false; wk.x = p[0] - 120; wk.y = p[1] - 170; wk.lift = 140; wk.gz = TWM.groundZ(p[0] + 10, p[1] + 6); H.assign(wk, [{ k: 'mount' }, { k: 'soar', x: p[0] + 14, y: p[1] + 6, lift: 22, speed: 60, spin: 0 }, { k: 'land', t: 1.2 }, { k: 'face', x: tx, y: ty }, { k: 'idle', t: 600 }], 'story'); }
    pend(R, () => !!(gy.cur && gy.cur.k === 'idle')); };
  O.ntq_nectar = (R, o) => {   // the sweet dew falls; the tree rises, its roots glow, leaves open, fruit ripens, light sweeps the garden
    const f = S.ntq, tr = FT(), [tx, ty] = trunk(), gy = act(R, 'gy'); cap('Cam lồ rưới xuống — cây Nhân Sâm Quả hồi sinh', 'The sweet dew falls — the tree is reborn', 9);
    if (gy) H.assign(gy, [{ k: 'act', t: 4 }, { k: 'idle', t: 600 }], 'story'); f.nectarT = 1; f.glowT = 1; tr.rootsT = 1;
    later(3, () => { tr.fallT = 0; f.shake = 0.6; burst(tx, ty + 8, 'gold'); }); later(6, () => { tr.vitT = 1; f.sparkleT = 1; }); later(10, () => { f.wave = S.t; f.flash = 0.8; burst(tx, ty + 8, 'jade'); f.windT = 1.3; });
    FT().fruit.forEach((q, i) => later(11 + i * 0.7, () => { q.gT = 1; q.hit = 1; })); later(12, () => { f.nectarT = 0; }); later(16, () => { f.lotus = 0; });
    for (const id of ['monk', 'bj', 'st', 'qf', 'my', 'zy']) { const a = act(R, id); if (a) H.assign(a, [{ k: 'face', x: tx, y: ty }, { k: 'bubble', kind: 'star' }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 600 }], 'story'); } R.wait = o.t || 17; };
  O.ntq_reconcile = (R, o) => {   // the ropes dissolve; Zhenyuan laughs and bows to Guanyin, the pilgrims bow in return; Guanyin rises
    const f = S.ntq, zy = act(R, 'zy'), gy = act(R, 'gy'); f.talismanT = 0; f.bind.onT = 0; f.glowT = 0.6; cap('Hòa giải — Trấn Nguyên kết nghĩa với Ngộ Không', 'Reconciliation: Zhenyuan and Wukong become sworn brothers', 7);
    for (const id of ['monk', 'bj', 'st', 'wk']) { const a = act(R, id); if (a) { a.story = R; H.assign(a, [{ k: 'hop', t: 0.6 }, { k: 'face', x: zy ? zy.x : 0, y: zy ? zy.y : 0 }, { k: 'sit', t: 3 }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 600 }], 'story'); } }
    if (zy) H.assign(zy, [{ k: 'bubble', kind: 'heart' }, { k: 'sit', t: 3 }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 600 }], 'story');
    later(6, () => { if (gy) { f.gyT = 0; H.assign(gy, [{ k: 'mount' }, { k: 'soar', x: gy.x + 80, y: gy.y - 160, lift: 140, speed: 50, spin: 0 }, { k: 'ntqfade', d: 1.6 }], 'story'); } }); R.wait = o.t || 10; };
  O.ntq_feast = (R, o) => {   // a feast under the tree: tables, lanterns, petals; the master's household and the guests sit down together
    const f = S.ntq, [tx, ty] = trunk(); f.feastT = 1; f.petalBoost = 1; f.glowT = 0.7; cap('Mở tiệc nhân sâm — Ngũ Trang Quán an vui', 'A feast: peace returns to Wuzhuang Temple', 8);
    const seats = [[-14, 20], [0, 24], [14, 20], [-22, 12], [22, 12], [-8, 32], [8, 32]], ids = ['zy', 'monk', 'wk', 'bj', 'st', 'qf', 'my'];
    ids.forEach((id, n) => { const a = act(R, id); if (!a) return; const p = H.nearestWalk(tx + seats[n][0], ty + seats[n][1], B, 3) || [tx, ty + 20]; a.story = R; H.assign(a, [{ k: 'wait', t: n * 0.4 }, H.go(p[0], p[1], { run: 1.3 }), { k: 'face', x: tx, y: ty + 18 }, { k: 'sit', t: 14 }, { k: 'bubble', kind: 'note' }, { k: 'sit', t: 6 }, { k: 'idle', t: 600 }], 'story'); });
    for (const a of S.agents.filter(q => q.biome === B && q.role !== 'actor' && free(q) && !q.hidden && S.R() < 0.7)) { const p = near(a, 16) || [a.x, a.y]; H.assign(a, [H.go(p[0], p[1], { run: 1.2 }), { k: 'face', x: tx, y: ty }, { k: 'bubble', kind: 'note' }, { k: 'idle', t: 10 }], 'mini'); } R.wait = o.t || 18; };
  O.ntq_depart = (R, o) => {   // the pilgrims set off again; the household sees them out to the gate
    const f = S.ntq, g = P.ntq_gate(); f.feastT = 0; let n = 0; for (const id of ['monk', 'wk', 'bj', 'st']) { const a = act(R, id); if (!a) continue; a.story = R; const p = H.nearestWalk(g[0] - 4 + n * 3, g[1] + n * 2, B, 5) || g; H.assign(a, [{ k: 'wait', t: n * 0.8 }, H.go(p[0], p[1], { run: 1.15 }), { k: 'ntqfade' }], 'story'); n++; }
    for (const id of ['zy', 'qf', 'my']) { const a = act(R, id); if (a) H.assign(a, [{ k: 'bubble', kind: 'heart' }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 600 }], 'story'); }
    pend(R, () => ['monk', 'wk', 'bj', 'st'].every(id => !act(R, id) || act(R, id).gone)); };
  O.ntq_recover = (R, o) => {   // dust settles, the household returns to its chores
    const f = S.ntq; f.shake = 0; f.windT = 1; f.mistT = 0.5; f.rainT = 0.1; f.glowT = 0.3; f.petalBoost = 0.5; for (const id of ['zy', 'qf', 'my', 'gy']) { const a = act(R, id); if (a && !a.gone) { const p = near(a, 10) || [a.x, a.y]; H.assign(a, [H.go(p[0], p[1], { run: 1 }), { k: 'idle', t: 4 }], 'story'); } } R.wait = o.t || 4; };
  O.ntq_peace = (R, o) => { const f = S.ntq, tr = f.tree; f.rainT = 0; f.glowT = 0.2; f.windT = 1; f.mistT = 0.3; f.talismanT = 0; f.bind.onT = 0; f.nectarT = 0; f.feastT = 0; f.gyT = 0; f.petalBoost = 0; f.sparkleT = 0; tr.fallT = 0; tr.vitT = 1; tr.rootsT = 0; tr.fruit.forEach(q => { q.gT = 1; });
    for (const a of S.agents) if (a.biome === B && a.role === 'sage') { a.hidden = false; a.alpha = 1; a.gone = false; } for (const a of S.agents) if (a.biome === B && a.role === 'actor' && a.story === R) a.gone = true; };

  D.beacon.ntq = '170,255,200';
  D.biomes.ntq = {
    residents: [['ntq_qingfeng', 2, 'boy'], ['ntq_mingyue', 2, 'girl'], ['ntq_zhenyuan', 1, 'sage'], ['nhs_deer', 3, 'deer'], ['tc_fairy', 1, 'fairy'], ['khi_con', 2, 'monkey']],
    roles: {
      boy: [['ntq_sweep', 4], ['ntq_herb', 3], ['ntq_water', 3], ['ntq_tend', 2], ['ntq_gather', 2], ['ntq_feed', 2], ['ntq_walk', 1]],
      girl: [['ntq_tea', 3], ['ntq_herb', 3], ['ntq_water', 3], ['ntq_tend', 3], ['ntq_read', 2], ['ntq_sweep', 2], ['ntq_feed', 2]],
      sage: [['ntq_meditate', 4], ['ntq_read', 3], ['ntq_tea', 2], ['ntq_tend', 2], ['ntq_look', 2], ['ntq_walk', 1]],
      deer: [['ntq_graze', 5], ['ntq_drink', 3], ['stroll', 2], ['ntq_play', 1]],
      fairy: [['ntq_water', 3], ['ntq_tend', 3], ['ntq_look', 2], ['ntq_pray', 2], ['ntq_walk', 2]],
      monkey: [['ntq_play', 4], ['ntq_gather', 3], ['ntq_look', 2], ['stroll', 1]],
    },
    minis: ['ntq_cranes', 'ntq_fruit', 'ntq_tea_mini', 'ntq_deer_drink', 'ntq_swirl', 'ntq_chant', 'ntq_rain', 'ntq_birds', 'ntq_bajie', 'ntq_branch'],
    stories: [
      { id: 'ginseng_fruit', title: ['Nhân Sâm Quả', 'The Ginseng Fruit'],
        fore: [['ntq_fore', { t: 4 }]],
        beats: [
          ['spawn', { id: 'monk', char: 'tam_tang', at: 'ntq_gate', off: [0, 0] }], ['spawn', { id: 'wk', char: 'wk_pilgrim', at: 'ntq_gate', off: [-1, 0] }], ['spawn', { id: 'bj', char: 'bajie', at: 'ntq_gate', off: [0, -1] }], ['spawn', { id: 'st', char: 'sa_tang', at: 'ntq_gate', off: [-1, -1] }], ['wait', { t: 1.5 }],
          ['ntq_arrive', {}], ['spawn', { id: 'qf', char: 'ntq_qingfeng', at: 'ntq_hall' }], ['spawn', { id: 'my', char: 'ntq_mingyue', at: 'ntq_hall', off: [1, 0] }], ['wait', { t: 1.2 }],
          ['ntq_welcome', {}], ['ntq_refuse', { t: 6 }],
          ['ntq_steal', { t: 10 }], ['ntq_accuse', { t: 7 }], ['ntq_topple', { t: 8 }],
          ['spawn', { id: 'zy', char: 'ntq_zhenyuan', at: 'ntq_hall' }], ['ntq_zy_return', {}], ['ntq_bind', { t: 9 }],
          ['ntq_wukong_go', { t: 8 }], ['spawn', { id: 'gy', char: 'guanyin', at: 'ntq_hall', off: [0, -4] }], ['ntq_guanyin', {}], ['wait', { t: 1.5 }],
          ['ntq_nectar', { t: 17 }], ['ntq_reconcile', { t: 10 }], ['ntq_feast', { t: 18 }], ['ntq_depart', {}], ['disperse', {}]],
        after: { fx: 'petals', at: 'ntq_tree', r: 34 },
        recover: [['ntq_recover', { t: 4 }], ['wait', { t: 14 }], ['ntq_peace', {}], ['wait', { t: 2 }]] },
    ],
  };
})();
