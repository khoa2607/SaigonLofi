'use strict';
// ===== Tây Du Ký v2 — Lòng Bàn Tay Phật Tổ: residents, activities, mini events and the signature story (DOM-free; loaded after tw-sim.js) =====
// Uses the simulation's extension registries (TWS.stepExt / opExt / pointExt, TWS.ACT, TWS.MINI) so tw-sim.js stays unchanged apart from those hooks.
// The visible state of the palm (finger curl, glow, inscription, divine column, vision of the Five Elements Mountains, ripples, steam) lives in TWS.palm;
// tw-palm-fx.js and tw-palm-art.js only read it.
(function () {
  const S = TWS, H = S.H, D = window.TW_DATA, B = 'btp';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), sm = x => x * x * (3 - 2 * x);
  const DELAY = [0, 0.1, 0.2, 0.1, 0];                       // outer fingers start closing first, the middle finger last
  const newState = () => ({ cur: 0, curT: 0, curRate: 0.045, curl: [0, 0, 0, 0, 0], glow: 0, glowT: 0, glowRate: 0.04, trap: 0, trapT: 0, trapRate: 0.3, trapAt: [0, 0], mountains: 0, mtT: 0, mtRate: 0.15,
    inscr: [0, 0, 0, 0, 0], inscrN: [0, 0, 0, 0, 0], inscrRate: 0.006, ripples: [], steam: [] });
  const ease = (v, t, r, dt) => Math.abs(t - v) <= r * dt ? t : v + Math.sign(t - v) * r * dt;

  // ---------------------------------------------------------------- state wrapper: init + per-tick easing
  const baseInit = S.init, baseTick = S.tick;
  S.init = function (seed) { S.palm = newState(); const c = TWM.palm.centre; S.palm.trapAt = [(c[0] + 0.5) * 8, (c[1] + 0.5) * 8]; baseInit(seed); };
  S.tick = function (dt) {
    baseTick(dt); const p = S.palm; if (!p) return;
    p.cur = ease(p.cur, p.curT, p.curRate, dt); for (let k = 0; k < 5; k++) p.curl[k] = sm(clamp((p.cur - DELAY[k]) / 0.8, 0, 1));
    p.glow = ease(p.glow, p.glowT, p.glowRate, dt); p.trap = ease(p.trap, p.trapT, p.trapRate, dt); p.mountains = ease(p.mountains, p.mtT, p.mtRate, dt);
    for (let k = 0; k < 5; k++) { if (p.inscr[k] > 0) { p.inscr[k] = Math.max(0, p.inscr[k] - p.inscrRate * dt); if (p.inscr[k] === 0) p.inscrN[k] = 0; } }
    for (const r of p.ripples) r.t += dt; p.ripples = p.ripples.filter(r => r.t < 1.4);
    for (const s of p.steam) s.t += dt; p.steam = p.steam.filter(s => s.t < 2.6);
    if (p.inscrRate > 0.006 && p.inscr.every(v => v === 0)) p.inscrRate = 0.006;
  };

  // ---------------------------------------------------------------- steps: flying on a cloud, somersaults, landing
  const X = S.stepExt;
  X.mount = a => { a.ride = true; return true; };
  X.soar = (a, st, dt) => {   // {x, y, lift, speed, spin}: straight flight over anything (clouds hold no obstacles), eased lift
    if (st.init === undefined) { st.init = 1; a.ride = true; st.l0 = a.lift || 0; st.d0 = Math.hypot(st.x - a.x, st.y - a.y) || 1; st.el = 0; }
    const dx = st.x - a.x, dy = st.y - a.y, d = Math.hypot(dx, dy), v = Math.min(st.speed || 30, 33) * dt; a.dir = H.dirTo(a, st.x, st.y); a.pose = st.spin ? 'flip' : 'fly'; a.moving = false;
    if (d <= v) { a.x = st.x; a.y = st.y; a.lift = st.lift; return true; }
    a.x += dx / d * v; a.y += dy / d * v; st.el += dt; const prog = 1 - d / st.d0;
    a.lift = st.l0 + (st.lift - st.l0) * Math.min(1, prog * 2.4) + Math.sin(S.t * 2.2 + a.phase) * 2; if (st.spin) a.flipP = (st.el * 1.3) % 1; return false;
  };
  X.flip = (a, st, dt) => {   // one front-flip in the air (the PixelLab front-flip frames), rising and falling a little
    if (st.el === undefined) { st.el = 0; st.l0 = a.lift || 0; } st.el += dt; const p = Math.min(1, st.el / st.t); a.pose = 'flip'; a.flipP = p; a.moving = false; a.lift = st.l0 + Math.sin(p * Math.PI) * (st.rise || 22);
    if (p >= 1) { a.pose = st.keepFly ? 'fly' : 'idle'; a.lift = st.l0; return true; } return false;
  };
  X.land = (a, st, dt) => {   // come down on the nearest cloud tile and step off the cloud
    if (st.el === undefined) { st.el = 0; st.l0 = a.lift || 0; const nw = H.nearestWalk(a.x, a.y, a.biome, 6); st.tx = nw ? nw[0] : a.x; st.ty = nw ? nw[1] : a.y; st.x0 = a.x; st.y0 = a.y; }
    st.el += dt; const p = Math.min(1, st.el / (st.t || 0.8)); a.x = st.x0 + (st.tx - st.x0) * p; a.y = st.y0 + (st.ty - st.y0) * p; a.lift = st.l0 * (1 - p); a.pose = 'fly'; a.moving = false;
    if (p >= 1) { a.lift = 0; a.ride = false; a.pose = 'idle'; return true; } return false;
  };
  X.ripple = (a, st) => { S.palm.ripples.push({ x: st.x, y: st.y, t: 0 }); return true; };

  // ---------------------------------------------------------------- helpers
  const P = () => TWM.palm, wp = (i, j) => [(i + 0.5) * 8, (j + 0.5) * 8];
  const king = b => S.agents.find(a => a.biome === b && a.role === 'monkeyking' && H.free(a));
  const launch = () => H.pois(B, 'launch')[0];
  const skyPts = () => { const f = P().fingers, out = []; for (let k = 0; k < 4; k++) out.push(wp((f[k].cx + f[k + 1].cx) / 2 + 1, (f[k].cy + f[k + 1].cy) / 2 + 2)); return out; };
  const edgePt = () => { const e = P().edges[Math.floor(S.R() * P().edges.length)]; return wp(e[0], e[1]); };
  S.pointExt.palmc = () => { const c = P().centre; return H.C(c[0], c[1]); };

  // ---------------------------------------------------------------- ambient activities
  const A = S.ACT;
  A.palm_cloudride = a => {
    const L = launch(); if (!L) return A.stroll(a); const pts = skyPts().sort(() => S.R() - 0.5).slice(0, 2 + (S.R() < 0.4 ? 1 : 0)); H.count('cloudride');
    const steps = [H.go(L.x, L.y), { k: 'face', dir: 'up' }, { k: 'mount' }];
    pts.forEach((p, n) => steps.push({ k: 'soar', x: p[0], y: p[1], lift: 30 + S.R() * 30, speed: 24 }, n % 2 ? { k: 'idle', t: 1.2 } : { k: 'bubble', kind: 'note' }));
    steps.push({ k: 'soar', x: L.x, y: L.y, lift: 14, speed: 26 }, { k: 'land', t: 0.9 }); return steps;
  };
  A.palm_perch = a => { const p = H.poiFree(B, 'pillar'); if (!p) return A.stroll(a); H.claim(a, p); H.count('perch');
    return [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'sit', t: H.rnd(8, 14) }, { k: 'bubble', kind: 'q' }, { k: 'sit', t: H.rnd(3, 6) }, { k: 'release', poi: p }]; };
  A.palm_devotion = a => { const p = H.poiFree(B, 'devotion'); if (!p) return A.stroll(a); H.claim(a, p); H.count('devotion');
    return [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'sit', t: H.rnd(16, 30) }, { k: 'bubble', kind: 'note' }, { k: 'sit', t: H.rnd(4, 8) }, { k: 'release', poi: p }]; };
  A.palm_lotus = a => { const p = H.poiFree(B, 'lotus'); if (!p) return A.stroll(a); H.claim(a, p); H.count('lotus_tend');
    return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'up' }, { k: 'act', t: H.rnd(5, 9) }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 2 }, { k: 'release', poi: p }]; };
  A.palm_offering = a => { const l = H.poiFree(B, 'lotus'), d = H.poiFree(B, 'devotion'); if (!l || !d) return A.stroll(a); H.claim(a, l); H.claim(a, d); H.count('offering');
    return [H.go(l.x, l.y), { k: 'face', dir: l.face || 'up' }, { k: 'act', t: 3 }, { k: 'carry', what: 'lotus' }, { k: 'release', poi: l }, H.go(d.x, d.y), { k: 'face', dir: 'up' }, { k: 'sit', t: H.rnd(6, 10) }, { k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }, { k: 'release', poi: d }]; };
  A.palm_rest = a => { const p = H.poiFree(B, 'rest'); if (!p) return A.stroll(a); H.claim(a, p); return [H.go(p.x, p.y), { k: 'face', dir: p.face || 'down' }, { k: 'sit', t: H.rnd(10, 20) }, { k: 'release', poi: p }]; };

  // ---------------------------------------------------------------- the four mini events (design §4.3)
  const M = S.MINI;
  M.palm_somersault = b => {   // Wukong somersaults again and again toward what he thinks is the edge of the universe
    const k = king(b), L = launch(); if (!k || !L) return false; const E = edgePt(), steps = [H.go(L.x, L.y), { k: 'face', dir: 'up' }, { k: 'bubble', kind: 'note' }, { k: 'mount' }];
    for (let leg = 1; leg <= 3; leg++) { const f = leg / 3.1; steps.push({ k: 'soar', x: L.x + (E[0] - L.x) * f, y: L.y + (E[1] - L.y) * f, lift: 40 + leg * 6, speed: 26 }, { k: 'flip', t: 1.5, rise: 26, keepFly: true }, { k: 'bubble', kind: leg < 3 ? 'excl' : 'q' }); }
    steps.push({ k: 'idle', t: 1.4 }, { k: 'bubble', kind: 'dots' }, { k: 'soar', x: L.x, y: L.y, lift: 16, speed: 28 }, { k: 'land', t: 0.9 }, { k: 'bubble', kind: 'note' }); H.assign(k, steps, 'mini'); H.count('somersault'); return true;
  };
  M.palm_inscribe = b => {     // he writes his boast on a finger pillar, in gold
    const k = king(b); if (!k) return false; const f = Math.floor(S.R() * 5), p = TWM.pois.find(q => q.kind === 'pillar' && q.finger === f); if (!p) return false; const ps = S.palm;
    const add = () => { if (ps.inscr[f] < 0.05) ps.inscrN[f] = 0; ps.inscrN[f] = Math.min(8, ps.inscrN[f] + 2); ps.inscr[f] = 1; };
    H.assign(k, [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'act', t: 2.4 }, { k: 'call', fn: add }, { k: 'act', t: 2.4 }, { k: 'call', fn: add }, { k: 'act', t: 2.4 }, { k: 'call', fn: add }, { k: 'bubble', kind: 'star' }, { k: 'idle', t: 2.4 }, { k: 'face', dir: 'down' }, { k: 'hop', t: 1.4 }], 'mini'); H.count('inscribe'); return true;
  };
  M.palm_relieve = b => {      // he steps behind a pillar, turns his back; only a little steam shows (never explicit)
    const k = king(b); if (!k) return false; const f = Math.floor(S.R() * 5), p = TWM.pois.find(q => q.kind === 'pillar_back' && q.finger === f); if (!p) return false;
    H.assign(k, [H.go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'idle', t: 1.6 }, { k: 'call', fn: a => S.palm.steam.push({ x: a.x, y: a.y, t: 0 }) }, { k: 'idle', t: 2.8 }, { k: 'bubble', kind: 'excl' }, { k: 'face', dir: 'down' }, { k: 'hop', t: 1.2 }], 'mini'); H.count('relieve'); return true;
  };
  M.palm_bounce = b => {       // he flies at the invisible boundary and is knocked back
    const k = king(b), L = launch(); if (!k || !L) return false; const E = edgePt(), back = [L.x + (E[0] - L.x) * 0.55, L.y + (E[1] - L.y) * 0.55];
    H.assign(k, [H.go(L.x, L.y), { k: 'face', dir: 'up' }, { k: 'mount' }, { k: 'soar', x: E[0], y: E[1], lift: 46, speed: 30 }, { k: 'idle', t: 0.35 }, { k: 'ripple', x: E[0], y: E[1] }, { k: 'bubble', kind: 'excl' },
      { k: 'soar', x: back[0], y: back[1], lift: 58, speed: 33, spin: true }, { k: 'bubble', kind: 'q' }, { k: 'idle', t: 1.2 }, { k: 'soar', x: L.x, y: L.y, lift: 16, speed: 28 }, { k: 'land', t: 0.9 }], 'mini'); H.count('bounce'); return true;
  };

  // ---------------------------------------------------------------- story ops (the Palm Closes)
  const O = S.opExt, pend = (R, f) => { R.pend = f; };
  O.palm = (R, o) => { const p = S.palm; if (o.glowT !== undefined) { p.glowT = o.glowT; p.glowRate = o.glowRate || 0.05; } if (o.curT !== undefined) { p.curT = o.curT; p.curRate = o.curRate || 0.05; } if (o.inscrRate) p.inscrRate = o.inscrRate; };
  O.palmwait = (R, o) => { const p = S.palm; pend(R, o.above !== undefined ? () => p.cur >= o.above : () => p.cur <= o.below); };
  O.trap = (R, o) => { const p = S.palm; p.trapT = o.to; p.trapRate = o.rate || 0.3; };
  O.mountains = (R, o) => { const p = S.palm; p.mtT = o.to; p.mtRate = o.rate || 0.15; };
  O.inscribe_now = (R, o) => { const p = S.palm; p.inscrN[o.k] = o.n; p.inscr[o.k] = 1; };
  O.skyto = (R, o, Bm, W) => { if (!W) return; const L = launch(), c = P().centre, t = wp(c[0], c[1]); W.story = R; H.assign(W, [H.go(L.x, L.y), { k: 'mount' }, { k: 'soar', x: t[0], y: t[1], lift: o.lift || 44, speed: 28 }], 'story'); pend(R, () => !W.q.length && !W.cur); };
  O.flipw = (R, o, Bm, W) => { if (!W) return; const st = []; for (let n = 0; n < (o.n || 2); n++) st.push({ k: 'flip', t: 1.5, rise: 24, keepFly: true }, { k: 'bubble', kind: 'excl' }); H.assign(W, st, 'story'); W.story = R; pend(R, () => !W.q.length && !W.cur); };
  O.entrap = (R, o, Bm, W) => { if (!W) return; W.story = R; H.assign(W, [{ k: 'land', t: 1.2 }, { k: 'bubble', kind: 'excl' }, { k: 'idle', t: 2.2 }, { k: 'fade', t: 1.8 }], 'story'); pend(R, () => W.hidden || (!W.q.length && !W.cur)); };
  O.wakeup = (R, o, Bm, W) => { if (!W) return; W.story = R; W.hidden = false; W.alpha = 0; H.assign(W, [{ k: 'fade', t: 1.4, in: true }, { k: 'bubble', kind: 'star' }, { k: 'idle', t: 2.2 }, { k: 'fly', t: 2.4 }], 'story'); pend(R, () => W.hidden || W.away); };
  O.palmrecover = (R, o) => { const p = S.palm; p.inscrRate = o.rate || 0.02; p.glowT = 0; p.glowRate = 0.02; p.mtT = 0; p.trapT = 0; p.curT = 0; };

  // ---------------------------------------------------------------- data
  D.beacon.btp = '255,226,150';
  D.biomes.btp = {
    residents: [['wukong', 1, 'monkeyking'], ['palm_attendant', 4, 'attendant']],
    roles: {
      monkeyking: [['palm_cloudride', 4], ['palm_perch', 2], ['stroll', 2], ['hop_rocks', 2], ['palm_devotion', 1], ['palm_rest', 2]],
      attendant: [['palm_lotus', 3], ['palm_devotion', 3], ['palm_offering', 2], ['stroll', 2], ['palm_rest', 2]],
    },
    minis: ['palm_somersault', 'palm_inscribe', 'palm_relieve', 'palm_bounce'],
    stories: [
      { id: 'palm_closes', title: ['Bàn tay khép lại', 'The Palm Closes'],
        fore: [['palm', { glowT: 0.5, glowRate: 0.025 }], ['gather', { at: 'palmc', r: 7, roles: ['attendant'], n: 4 }], ['face', { who: 'crowd', dir: 'up' }], ['bubble', { who: 'crowd', kind: 'excl' }]],
        beats: [
          ['palm', { glowT: 1, glowRate: 0.07 }], ['bubble', { who: 'crowd', kind: 'excl' }],
          ['skyto', { who: 'wukong', lift: 44 }], ['bubble', { who: 'wukong', kind: 'star' }], ['flipw', { who: 'wukong', n: 2 }],
          ['palm', { curT: 1, curRate: 0.05 }], ['bubble', { who: 'wukong', kind: 'excl' }],
          ['palmwait', { above: 0.55 }], ['trap', { to: 1, rate: 0.35 }], ['mountains', { to: 1, rate: 0.14 }],
          ['palmwait', { above: 0.9 }], ['entrap', { who: 'wukong' }], ['wait', { t: 7 }],
          ['mountains', { to: 0, rate: 0.2 }], ['trap', { to: 0, rate: 0.25 }], ['palm', { curT: 0, curRate: 0.06 }], ['palmwait', { below: 0.3 }],
          ['inscribe_now', { k: 2, n: 8 }], ['palm', { glowT: 0.3, glowRate: 0.03 }], ['palmwait', { below: 0.02 }],
          ['wakeup', { who: 'wukong' }], ['disperse', {}]],
        after: { fx: 'petals', at: 'palmc', r: 70 },
        recover: [['palmrecover', { rate: 0.02 }], ['wait', { t: 30 }]] },
    ],
  };
})();
