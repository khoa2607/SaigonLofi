'use strict';
// ===== Tây Du Ký v2 — Hỏa Diệm Sơn: residents, activities, mini events and the signature story (DOM-free; loaded after tw-sim.js) =====
// Uses the simulation's extension registries (TWS.stepExt / opExt / ACT / MINI). The visible state of the biome lives in TWS.fire and TWM.fire and is only READ by
// tw-fire-fx.js / tw-fire-art.js:
//   heat      0..1  foreshadowing: fissures brighten, ground glows, smoke thickens
//   g         0..1  the greening progress of the transformation (spreads from the village focus outward; drives TWM.fire.stage per tile)
//   rain      0..1  real rain (particles, splashes, puddles) over the biome
//   bursts, whirls, gusts, puffs  short-lived world events (flame bursts, ash whirlwinds, fan gusts, cooling steam)
(function () {
  const S = TWS, H = S.H, D = window.TW_DATA, B = 'hds', F = TWM.fire;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = (v, t, r, dt) => Math.abs(t - v) <= r * dt ? t : v + Math.sign(t - v) * r * dt;
  const newState = () => ({ heat: 0, heatT: 0, heatRate: 0.03, g: 0, gT: 0, gRate: 0.02, rain: 0, rainT: 0, rainRate: 0.1, bursts: [], whirls: [], gusts: [], puffs: [], fan: 0, fanBy: null, fanN: 0, ver: 0, lastG: -1, wind: 1 });
  // distance of every tile from the village focus (0..1) with a little noise: the order in which the land turns green and, in reverse, fades back
  function prepare() {
    if (F.dist) return; const N = TWM.N, fx = F.focus[0], fy = F.focus[1]; let mx = 1; F.dist = new Float32Array(N * N); F.stage = new Uint8Array(N * N);
    for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), d = Math.hypot((i - fx) * 1, (j - fy) * 1) + (TWM.vnoise(i * 0.2, j * 0.2, 101) - 0.5) * 4; F.dist[k] = d; if (d > mx) mx = d; }
    for (const k of F.tiles) F.dist[k] = clamp(F.dist[k] / mx, 0, 1);
    // chunk bookkeeping for re-baking (tw-fire-fx.js)
  }
  const baseInit = S.init, baseTick = S.tick;
  S.init = function (seed) { S.fire = newState(); prepare(); baseInit(seed); };
  function applyStage(f) {
    // a tile turns when the progress passes its distance (spreading front); 9 stages per tile give a crisp, patchy reveal in the art
    let changed = false; const N = TWM.N;
    for (const k of F.tiles) { const p = clamp((f.g - F.dist[k] * 0.62) / 0.38, 0, 1), s = Math.round(p * 9); if (F.stage[k] !== s) { F.stage[k] = s; changed = true; } }
    if (changed) f.ver++;
  }
  S.tick = function (dt) {
    baseTick(dt); const f = S.fire; if (!f) return;
    f.heat = ease(f.heat, f.heatT, f.heatRate, dt); f.g = ease(f.g, f.gT, f.gRate, dt); f.rain = ease(f.rain, f.rainT, f.rainRate, dt); f.fan = ease(f.fan, f.fanT || 0, 3, dt);
    if (Math.abs(f.g - f.lastG) >= 0.012 || (f.g === 0 && f.lastG !== 0) || (f.g === 1 && f.lastG !== 1)) { f.lastG = f.g; applyStage(f); }
    for (const b of f.bursts) b.t += dt; f.bursts = f.bursts.filter(b => b.t < 1.6);
    for (const w of f.whirls) { w.t += dt; w.x += w.vx * dt; w.y += w.vy * dt; w.vx += (S.R() - 0.5) * 6 * dt; w.vy += (S.R() - 0.5) * 6 * dt; } f.whirls = f.whirls.filter(w => w.t < w.life);
    for (const q of f.gusts) q.t += dt; f.gusts = f.gusts.filter(q => q.t < 1.4);
    for (const q of f.puffs) q.t += dt; f.puffs = f.puffs.filter(q => q.t < 2.4);
    // ambient flame bursts from the vents (more when it is hot); a nearby animal or villager startles
    f.burstClock = (f.burstClock || 12) - dt * (1 + f.heat * 1.5 - f.g);
    if (f.burstClock <= 0 && f.g < 0.5) { f.burstClock = 9 + S.R() * 16; const v = F.vents[Math.floor(S.R() * F.vents.length)]; if (v) burst(v[0] * 8 + 4, v[1] * 8 + 4); }
  };
  function burst(x, y) {
    S.fire.bursts.push({ x, y, t: 0 });
    for (const a of S.agents) if (a.biome === B && !a.gone && !a.hidden && H.free(a) && Math.hypot(a.x - x, a.y - y) < 46 && (a.role === 'mule' || a.role === 'baker' || a.role === 'seller' || a.role === 'fire_bajie')) startle(a, x, y);
  }
  function startle(a, x, y) {
    if (a.role === 'mule') { const away = H.nearestWalk(a.x + (a.x - x) * 2.2, a.y + (a.y - y) * 2.2, B, 6); H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }].concat(away ? [H.go(away[0], away[1], { run: 1.8 })] : []).concat([{ k: 'idle', t: 2 }]), 'mini'); }
    else H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.6 }, { k: 'idle', t: 1 }], 'mini');
  }

  // ---------------------------------------------------------------- steps
  const X = S.stepExt;
  X.arc = (a, st, dt) => {   // {x, y, t, lift, spin}: a long comic ballistic arc (the fan blows Wukong away); flies over any terrain
    if (st.el === undefined) { st.el = 0; st.x0 = a.x; st.y0 = a.y; st.l0 = a.lift || 0; a.ride = false; a.flying = true; }
    st.el += dt; const p = Math.min(1, st.el / st.t); a.x = st.x0 + (st.x - st.x0) * p; a.y = st.y0 + (st.y - st.y0) * p; a.lift = st.l0 + Math.sin(p * Math.PI) * st.lift * (1 - 0.15 * p) + 0; a.pose = 'fly'; a.moving = false; a.dir = H.dirTo(a, st.x, st.y);
    a.spin = (st.spin || 0) * p * Math.PI * 2; if (p >= 1) { a.spin = 0; return true; } return false;
  };
  X.fan = (a, st, dt) => {   // {t, who}: swing the fan (pose act) while TWS.fire.fan > 0 draws the gust and the held fan
    if (st.el === undefined) { st.el = 0; S.fire.fanBy = a; }
    st.el += dt; a.pose = 'act'; a.moving = false; S.fire.fanT = 1; a.fanning = Math.sin(st.el * 9);
    if (st.el >= st.t) { a.pose = 'idle'; a.fanning = 0; S.fire.fanT = 0; return true; } return false;
  };
  X.gust = (a, st) => { S.fire.gusts.push({ x: st.x, y: st.y, tx: st.tx, ty: st.ty, t: 0 }); return true; };
  X.hide = a => { a.flying = false; a.hidden = true; a.alpha = 0; a.lift = 0; a.spin = 0; return true; };
  X.firecall = (a, st) => { st.fn(a); return true; };

  // ---------------------------------------------------------------- activities
  const A = S.ACT, pois = k => H.pois(B, k);
  A.fire_bake = a => {
    const o = H.poiFree(B, 'oven'), c = H.poiFree(B, 'crate') || H.poiFree(B, 'stall'); if (!o) return A.stroll(a); H.claim(a, o); H.count('bake');
    const steps = [H.go(o.x, o.y), { k: 'face', dir: 'up' }, { k: 'act', t: H.rnd(5, 8) }, { k: 'call', fn: q => S.fire.puffs.push({ x: o.x, y: o.y - 6, t: 0 }) }, { k: 'carry', what: 'cake' }, { k: 'release', poi: o }];
    if (c) { H.claim(a, c); steps.push(H.go(c.x, c.y), { k: 'face', dir: 'up' }, { k: 'act', t: 2 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'note' }, { k: 'release', poi: c }); } else steps.push({ k: 'carry', what: null });
    return steps;
  };
  A.fire_sell = a => { const p = H.poiFree(B, 'stall'); if (!p) return A.stroll(a); H.claim(a, p); H.count('sell'); return [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'act', t: H.rnd(4, 7) }, { k: 'bubble', kind: 'note' }, { k: 'idle', t: H.rnd(3, 6) }, { k: 'act', t: 3 }, { k: 'bubble', kind: 'heart' }, { k: 'release', poi: p }]; };
  A.fire_carry = a => { const c = H.poiFree(B, 'crate'), s = H.poiFree(B, 'stall'); if (!c || !s) return A.stroll(a); H.claim(a, c); H.claim(a, s); H.count('haul');
    return [H.go(c.x, c.y), { k: 'face', dir: 'up' }, { k: 'act', t: 2 }, { k: 'carry', what: 'cake' }, { k: 'release', poi: c }, H.go(s.x, s.y), { k: 'face', dir: 'up' }, { k: 'act', t: 2 }, { k: 'carry', what: null }, { k: 'release', poi: s }]; };
  A.fire_warm = a => { const p = H.poiFree(B, 'hearth'); if (!p) return A.stroll(a); H.claim(a, p); H.count('warm'); return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'up' }, { k: 'sit', t: H.rnd(9, 18) }, { k: 'bubble', kind: 'note' }, { k: 'sit', t: H.rnd(3, 6) }, { k: 'release', poi: p }]; };
  A.fire_palace = a => { const p = H.poiFree(B, 'palacegate'); if (!p) return A.stroll(a); H.claim(a, p); H.count('palace'); return [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'idle', t: H.rnd(5, 9) }, { k: 'act', t: 2.4 }, { k: 'idle', t: H.rnd(3, 6) }, { k: 'release', poi: p }]; };
  A.fire_inspect = a => { const sq = H.poiFree(B, 'square'), sw = H.poiFree(B, 'switch'), p = H.poiFree(B, 'palaceyard'); if (!sq) return A.fire_palace(a); H.claim(a, sq); H.count('inspect');
    const steps = []; if (sw) steps.push(H.go(sw.x, sw.y), { k: 'face', dir: 'down' }, { k: 'idle', t: 2.5 }); steps.push(H.go(sq.x, sq.y), { k: 'face', dir: 'down' }, { k: 'idle', t: H.rnd(3, 5) }, { k: 'bubble', kind: 'note' }, { k: 'idle', t: 2 }, { k: 'release', poi: sq }); if (p) steps.push(H.go(p.x, p.y), { k: 'idle', t: 2 }); return steps; };
  A.fire_overlook = a => { const p = H.poiFree(B, 'overlook'); if (!p) return A.stroll(a); H.claim(a, p); H.count('overlook'); return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'down' }, { k: 'idle', t: H.rnd(5, 9) }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 1.4 }, { k: 'idle', t: H.rnd(3, 6) }, { k: 'release', poi: p }]; };
  A.fire_lavaedge = a => { const p = H.poiFree(B, 'lavaedge'); if (!p) return A.stroll(a); H.claim(a, p); H.count('lavaedge'); return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'right' }, { k: 'idle', t: 3 }, { k: 'bubble', kind: 'dots' }, { k: 'act', t: 3 }, { k: 'idle', t: H.rnd(3, 6) }, { k: 'release', poi: p }]; };
  A.fire_cakes = a => { const p = H.poiFree(B, 'stall'); if (!p) return A.stroll(a); H.claim(a, p); H.count('cakebuy'); return [H.go(p.x, p.y + 8), { k: 'face', dir: 'up' }, { k: 'idle', t: 1.5 }, { k: 'carry', what: 'cake' }, { k: 'bubble', kind: 'heart' }, { k: 'release', poi: p }, H.go(p.x + 12, p.y + 14), { k: 'sit', t: H.rnd(6, 10) }, { k: 'bubble', kind: 'note' }, { k: 'carry', what: null }, { k: 'sit', t: 2 }]; };
  A.fire_mule = a => { const p = H.poiFree(B, 'pen'); if (!p) return A.stroll(a); H.claim(a, p); return [H.go(p.x, p.y, { run: 0.8 }), { k: 'face', dir: 'right' }, { k: 'idle', t: H.rnd(6, 12) }, { k: 'release', poi: p }]; };
  A.fire_shrine = a => { const p = H.poiFree(B, 'shrine'); if (!p) return A.stroll(a); H.claim(a, p); return [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'sit', t: H.rnd(5, 9) }, { k: 'bubble', kind: 'note' }, { k: 'release', poi: p }]; };

  // ---------------------------------------------------------------- mini events (design §4.9): cake seller, startled mule, Bajie complaining about the heat, ash whirlwinds
  const M = S.MINI, by = (b, role) => S.agents.find(a => a.biome === b && a.role === role && !a.gone && !a.hidden && H.free(a));
  M.fire_cakeseller = b => {   // the seller cries her cakes in the square; two villagers come, buy, eat on the warm ground
    const s = by(b, 'seller'), sq = H.pois(b, 'square')[0], st = H.poiFree(b, 'stall'); if (!s || !sq || !st) return false; const buyers = S.agents.filter(a => a.biome === b && (a.role === 'baker' || a.role === 'fire_bajie') && H.free(a)).slice(0, 2);
    H.assign(s, [H.go(sq.x, sq.y), { k: 'face', dir: 'down' }, { k: 'bubble', kind: 'note' }, { k: 'act', t: 3 }, { k: 'bubble', kind: 'excl' }, { k: 'act', t: 3 }, { k: 'carry', what: 'cake' }, { k: 'idle', t: 4 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 2 }], 'mini');
    buyers.forEach((a, n) => H.assign(a, [{ k: 'idle', t: 2 + n }, H.go(sq.x + (n ? 9 : -9), sq.y + 8), { k: 'face', dir: 'up' }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 3 }, { k: 'carry', what: 'cake' }, { k: 'sit', t: 6 }, { k: 'bubble', kind: 'note' }, { k: 'carry', what: null }, { k: 'idle', t: 1 }], 'mini'));
    H.count('cakeseller'); return true;
  };
  M.fire_mule = b => {   // a flame bursts under a mule; it bolts across the village, a baker gives chase, the crowd hops aside
    const m = by(b, 'mule'), v = F.vents.length ? F.vents[Math.floor(S.R() * F.vents.length)] : null; if (!m) return false; const bx = m.x + (S.R() < 0.5 ? 14 : -14), by_ = m.y + 12;
    burst(bx, by_); const sq = H.pois(b, 'square')[0], baker = by(b, 'baker');
    if (sq) H.assign(m, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.8 }, H.go(sq.x, sq.y, { run: 2.1 }), H.go(sq.x - 26, sq.y + 22, { run: 2.1 }), H.go(sq.x + 24, sq.y - 14, { run: 2.1 }), { k: 'idle', t: 3 }, { k: 'bubble', kind: 'dots' }], 'mini');
    if (baker && sq) H.assign(baker, [{ k: 'bubble', kind: 'excl' }, H.go(sq.x, sq.y, { run: 1.5 }), H.go(sq.x - 18, sq.y + 14, { run: 1.5 }), { k: 'bubble', kind: 'q' }, { k: 'idle', t: 3 }], 'mini');
    for (const a of S.agents) if (a.biome === B && a.role === 'seller' && H.free(a)) H.assign(a, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.8 }, { k: 'idle', t: 2 }], 'mini');
    H.count('mule'); return true;
  };
  M.fire_bajie_heat = b => {   // Bajie complains about the heat: stomps to the shade, fans himself with his sleeve, drinks, wipes his brow
    const k = by(b, 'fire_bajie'), p = H.poiFree(b, 'hearth') || H.poiFree(b, 'lavaedge'); if (!k || !p) return false; H.claim(k, p);
    H.assign(k, [{ k: 'bubble', kind: 'excl' }, H.go(p.x, p.y), { k: 'face', dir: 'down' }, { k: 'sit', t: 2 }, { k: 'bubble', kind: 'dots' }, { k: 'act', t: 3 }, { k: 'bubble', kind: 'excl' }, { k: 'act', t: 3 }, { k: 'bubble', kind: 'q' }, { k: 'sit', t: 3 }, { k: 'bubble', kind: 'excl' }, { k: 'hop', t: 1.2 }, { k: 'release', poi: p }], 'mini'); H.count('bajie_heat'); return true;
  };
  M.fire_whirlwind = b => {   // an ash whirlwind spins up near the lake, wanders through the village; the people hold still and cover their faces
    const lk = F.lake, N = TWM.N, sq = H.pois(b, 'square')[0]; if (!lk || !sq) return false; const x = (lk[0] + 0.5) * 8, y = (lk[1] + 0.5) * 8, dx = sq.x - x, dy = sq.y - y, d = Math.hypot(dx, dy) || 1;
    S.fire.whirls.push({ x, y, vx: dx / d * 7, vy: dy / d * 7, t: 0, life: 22 });
    for (const a of S.agents) if (a.biome === B && !a.gone && !a.hidden && H.free(a) && (a.role === 'baker' || a.role === 'seller')) H.assign(a, [{ k: 'idle', t: 6 + S.R() * 4 }, { k: 'bubble', kind: 'dots' }, { k: 'hop', t: 0.7 }, { k: 'idle', t: 4 }], 'mini');
    H.count('whirlwind'); return true;
  };
  M.fire_oven_flare = b => {   // an oven coughs flame; the baker jumps back, laughs it off
    const o = H.pois(b, 'oven')[Math.floor(S.R() * 3)], k = by(b, 'baker'); if (!o || !k) return false; burst(o.x, o.y - 4); H.assign(k, [{ k: 'bubble', kind: 'excl' }, { k: 'hop', t: 0.7 }, { k: 'idle', t: 1.2 }, { k: 'bubble', kind: 'note' }], 'mini'); H.count('oven_flare'); return true;
  };

  // ---------------------------------------------------------------- story ops (the Palm-Leaf Fan)
  const O = S.opExt, pend = (R, f) => { R.pend = f; };
  O.fire = (R, o) => { const f = S.fire; if (o.heat !== undefined) { f.heatT = o.heat; f.heatRate = o.rate || 0.04; } if (o.rain !== undefined) { f.rainT = o.rain; f.rainRate = o.rainRate || 0.1; } if (o.g !== undefined) { f.gT = o.g; f.gRate = o.gRate || 0.02; } };
  O.fireburst = (R, o) => { const v = F.vents; for (let n = 0; n < (o.n || 3); n++) { const q = v[Math.floor(S.R() * v.length)]; if (q) burst(q[0] * 8 + 4, q[1] * 8 + 4); } };
  O.firewait = (R, o) => { const f = S.fire; pend(R, o.gAbove !== undefined ? () => f.g >= o.gAbove : () => f.g <= o.gBelow); };
  O.princess_to = (R, o, Bm, W) => { if (!W) return; const sq = H.pois(B, 'square')[0], sw = H.pois(B, 'switch')[0]; W.story = R; const tgt = o.at === 'palace' ? H.pois(B, 'palacegate')[0] : sq; const steps = []; if (o.at !== 'palace' && sw) steps.push(H.go(sw.x, sw.y)); steps.push(H.go(tgt.x, tgt.y - (o.at === 'palace' ? 0 : 14)), { k: 'face', dir: 'down' }); H.assign(W, steps, 'story'); pend(R, () => !W.q.length && !W.cur); };
  O.arrive_at = (R, o, Bm, W) => { if (!W) return; const sq = H.pois(B, 'square')[0], p = o.edge ? F.village : null; W.story = R; W.hidden = false; W.alpha = 0; const fromEdge = o.from === 'sky'; const sx = sq.x + (o.dx || 0), sy = sq.y + (o.dy || 0);
    W.x = sx; W.y = sy; H.assign(W, [{ k: 'fade', t: 0.6, in: true }, { k: 'face', dir: 'down' }, { k: 'bubble', kind: 'star' }, { k: 'idle', t: 1 }], 'story'); pend(R, () => !W.q.length && !W.cur); };
  O.blowaway = (R, o, Bm, W) => {   // Thiết Phiến swings her fan: a gust crosses the square and throws Wukong in a long arc over the mountain
    const P = who(B, 'princess', R), wk = W; if (!P || !wk) return; P.story = R; wk.story = R; const gx = P.x, gy = P.y, tx = wk.x, ty = wk.y, mapW = TWM.N * 8;
    const dest = [clamp(wk.x - 150, 24, mapW - 24), clamp(wk.y - 330, 24, mapW - 24)];
    H.assign(P, [{ k: 'face', x: tx, y: ty }, { k: 'idle', t: 0.6 }, { k: 'act', t: 1.8 }, { k: 'gust', x: gx, y: gy, tx, ty }, { k: 'act', t: 1.4 }, { k: 'idle', t: 3 }], 'story');
    H.assign(wk, [{ k: 'bubble', kind: 'excl' }, { k: 'idle', t: 2.4 }, { k: 'bubble', kind: 'q' }, { k: 'arc', x: dest[0], y: dest[1], t: 4.2, lift: 150, spin: 3 }, { k: 'hide' }], 'story');
    S.fire.wind = 1; pend(R, () => wk.hidden && !P.q.length);
  };
  const who = (b, role, R) => S.agents.find(a => a.biome === b && a.role === role && !a.gone) || null;
  O.fan49 = (R, o, Bm, W) => {   // he returns with the fan: seven strokes of seven (49), shown as seven rune lights; each stroke cools the land
    if (!W) return; W.story = R; W.carry = null; W.hasFan = true; const f = S.fire, steps = [{ k: 'bubble', kind: 'star' }];
    const per = 7; f.fanN = 0; f.fanPips = 0;
    for (let c = 0; c < per; c++) steps.push({ k: 'fan', t: 2.1 }, { k: 'firecall', fn: () => { f.fanPips = c + 1; f.gT = Math.min(1, (c + 1) / per); f.gRate = 0.05; f.rainT = Math.min(1, 0.25 + (c + 1) / per * 0.9); f.rainRate = 0.12; f.fanN += 7; for (let q = 0; q < 3; q++) { const v = F.vents[(c * 3 + q) % F.vents.length]; if (v) f.puffs.push({ x: v[0] * 8 + 4, y: v[1] * 8 + 4, t: 0 }); } } });
    steps.push({ k: 'idle', t: 1.4 }, { k: 'hop', t: 1.4 }); H.assign(W, steps, 'story'); pend(R, () => !W.q.length && !W.cur);
  };
  O.firecelebrate = (R, o) => { const sq = H.pois(B, 'square')[0]; if (!sq) return; for (const a of S.agents) if (a.biome === B && !a.gone && !a.hidden && (a.role === 'baker' || a.role === 'seller' || a.role === 'fire_bajie' || a.role === 'fire_wukong') && H.free(a)) { a.gathered = R; H.assign(a, [H.go(sq.x + (S.R() - 0.5) * 36, sq.y + (S.R() - 0.5) * 24), { k: 'face', dir: 'up' }, { k: 'hop', t: 3 }, { k: 'bubble', kind: 'heart' }, { k: 'hop', t: 2 }, { k: 'bubble', kind: 'note' }, { k: 'idle', t: 4 }, { k: 'carry', what: a.role === 'seller' ? 'cake' : null }], 'story'); } };
  O.firerecover = (R, o) => { const f = S.fire; f.gT = 0; f.gRate = o.rate || 0.011; f.heatT = 0.15; f.rainT = 0; f.rainRate = 0.08; f.fanT = 0; f.fanPips = 0; for (const a of S.agents) if (a.biome === B && a.hasFan) a.hasFan = false; };
  O.wk_leave = (R, o, Bm, W) => { if (!W) return; W.hasFan = false; W.story = R; H.assign(W, [{ k: 'bubble', kind: 'note' }, { k: 'idle', t: 2 }, { k: 'fly', t: 2.4 }], 'story'); pend(R, () => W.hidden || W.away); };

  // ---------------------------------------------------------------- data
  D.beacon.hds = '255,140,70';
  D.biomes.hds = {
    residents: [['tiefan', 1, 'princess'], ['wukong', 1, 'fire_wukong'], ['bajie', 1, 'fire_bajie'], ['hds_baker', 3, 'baker'], ['hds_seller', 3, 'seller'], ['hds_mule', 2, 'mule']],
    roles: {
      princess: [['fire_palace', 4], ['fire_inspect', 3], ['fire_overlook', 2], ['fire_shrine', 1], ['stroll', 1]],
      fire_wukong: [['fire_overlook', 3], ['fire_cakes', 3], ['fire_lavaedge', 2], ['hop_rocks', 2], ['stroll', 2], ['fire_warm', 1]],
      fire_bajie: [['fire_cakes', 3], ['fire_warm', 3], ['fire_lavaedge', 2], ['stroll', 1], ['fire_shrine', 1]],
      baker: [['fire_bake', 5], ['fire_carry', 2], ['fire_warm', 1], ['talk', 1], ['stroll', 1], ['fire_sell', 1]],
      seller: [['fire_sell', 5], ['fire_carry', 2], ['fire_warm', 1], ['talk', 2], ['stroll', 1]],
      mule: [['fire_mule', 4], ['stroll', 3]],
    },
    minis: ['fire_cakeseller', 'fire_mule', 'fire_bajie_heat', 'fire_whirlwind', 'fire_oven_flare'],
    stories: [
      { id: 'palm_leaf_fan', title: ['Quạt Ba Tiêu', 'The Palm-Leaf Fan'],
        fore: [['fire', { heat: 1, rate: 0.03 }], ['fireburst', { n: 4 }], ['gather', { at: 'square', r: 5, roles: ['baker', 'seller'], n: 6 }], ['face', { who: 'crowd', dir: 'up' }], ['bubble', { who: 'crowd', kind: 'excl' }], ['depart', { who: 'fire_wukong' }], ['princess_to', { who: 'princess', at: 'square' }]],
        beats: [
          ['arrive_at', { who: 'fire_wukong', from: 'sky', dx: -22, dy: 12 }], ['bubble', { who: 'fire_wukong', kind: 'star' }], ['wait', { t: 1.5 }], ['bubble', { who: 'crowd', kind: 'excl' }],
          ['blowaway', { who: 'fire_wukong' }], ['fireburst', { n: 3 }], ['wait', { t: 5 }], ['bubble', { who: 'crowd', kind: 'dots' }],
          ['arrive_at', { who: 'fire_wukong', from: 'sky', dx: 30, dy: -18 }], ['face', { who: 'princess', dir: 'right' }], ['bubble', { who: 'princess', kind: 'excl' }],
          ['fan49', { who: 'fire_wukong' }], ['fire', { heat: 0, rate: 0.06 }], ['firewait', { gAbove: 0.97 }],
          ['fire', { rain: 0.6, rainRate: 0.08 }], ['firecelebrate', {}], ['wait', { t: 10 }], ['fire', { rain: 0, rainRate: 0.1 }], ['bubble', { who: 'princess', kind: 'heart' }], ['wait', { t: 4 }], ['princess_to', { who: 'princess', at: 'palace' }], ['wk_leave', { who: 'fire_wukong' }], ['disperse', {}]],
        after: { fx: 'petals', at: 'square', r: 40 },
        recover: [['firerecover', { rate: 0.011 }], ['firewait', { gBelow: 0.03 }], ['fire', { heat: 0 }]] },
    ],
  };
})();
