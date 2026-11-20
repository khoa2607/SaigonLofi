'use strict';
// ===== Tây Du Ký v2 — living simulation (DOM-free) =====
// Residents act through a queue of concrete steps (walk by A*, sit, act, climb, jump, swim, hang on a thread, carry, fade).
// Three activity layers (design §6): ambient role activities, coordinated mini events, and signature stories run by the Global
// Story Director with the Living Story Loop (peace -> foreshadow -> signature -> aftermath with recovery -> peace).
// The Director allows at most TW_DATA.maxSignatures stories at once and never two in biomes that share a border (TWM.adj).
// Randomness only through TWS.R (seeded). Rendering reads this state and never drives it.
const TWS = (function () {
  const T = 8, S = { t: 0, R: null, agents: [], biomes: {}, fx: [], speed: 1, hour: 10, web: { ext: 0.55, target: 0.55, rate: 0, glow: false, base: 0.55 }, litter: [], log: [], counts: { minis: {}, acts: {}, stories: {} } };
  const D = () => window.TW_DATA;
  const rnd = (a, b) => a + S.R() * (b - a), pick = arr => arr[Math.floor(S.R() * arr.length)];
  const tileOf = a => [Math.floor(a.x / T), Math.floor(a.y / T)];
  const C = (i, j) => [(i + 0.5) * T, (j + 0.5) * T];
  const count = (k, n) => { S.counts.acts[k] = (S.counts.acts[k] || 0) + (n || 1); };

  // ---------------------------------------------------------------- agents
  function agent(char, biome, role, i, j) {
    const ch = window.TD2_CHARS && window.TD2_CHARS.chars[char];
    const a = { id: S.agents.length, char, look: char, biome, role, x: (i + 0.5) * T, y: (j + 0.5) * T, gz: 0, lift: 0, dir: pick(['down', 'left', 'right']), frame: 'idle0', pose: 'idle',
      moving: false, q: [], cur: null, dist: 0, v: (ch ? ch.speed : 20) / 4 * 0.9, bubble: null, bubbleT: 0, carry: null, alpha: 1, inWater: false, thread: 0, wrap: false,
      gone: false, hidden: false, story: null, gathered: null, busyUntil: 0, home: [i, j], task: null, actT: 0, phase: S.R() * 10 };
    a.gz = TWM.groundZ(a.x, a.y); S.agents.push(a); return a;
  }
  const free = a => !a.gone && !a.hidden && !a.story && !a.gathered && !a.wrap && a.role !== 'actor';
  // POI claims belong to the agent: replacing its queue (an interruption) releases whatever it held
  function claim(a, p) { p.users++; (a.newClaims = a.newClaims || []).push(p); return p; }
  function assign(a, steps, task) { for (const p of (a.claims || [])) if (!(a.newClaims || []).includes(p)) p.users = Math.max(0, p.users - 1); a.claims = a.newClaims || []; a.newClaims = null;
    a.q = steps.filter(Boolean);
    // interrupted up a tree or on a thread: come down first (never drop or teleport)
    const k0 = TWM.id(Math.floor(a.x / T), Math.floor(a.y / T));
    if (!TWM.WALK[k0] && !TWM.isWater(TWM.MAT[k0]) && !(a.q[0] && a.q[0].k === 'nudge')) { const nw = nearestWalk(a.x, a.y, a.biome, 3); if (nw) a.q.unshift({ k: 'nudge', x: nw[0], y: nw[1] }); }
    if (a.lift > 1 && (a.pose === 'perch' || a.pose === 'climb' || a.thread)) a.q.unshift({ k: a.thread ? 'thread' : 'climb', to: 0, t: Math.max(0.6, a.lift / 9) });
    else if (a.lift && a.pose !== 'fly') a.lift = 0;
    a.cur = null; a.task = task || null; if (a.pose !== 'perch' && a.pose !== 'climb') a.pose = 'idle'; a.moving = false; }
  function nearestWalk(x, y, biome, maxR, opt) {
    const i0 = Math.floor(x / T), j0 = Math.floor(y / T);
    for (let r = 0; r <= (maxR || 5); r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; const i = i0 + di, j = j0 + dj;
      if (!TWM.inMap(i, j)) continue; const k = TWM.id(i, j);
      if ((TWM.WALK[k] || (opt && opt.swim && (TWM.MAT[k] === TWM.M.POOL || TWM.MAT[k] === TWM.M.SPRING))) && (!biome || TWM.biomeAt(i, j) === biome)) return r === 0 ? [x, y] : C(i, j);
    }
    return null;
  }
  const pois = (b, kind) => TWM.pois.filter(p => p.biome === b && p.kind === kind);
  function poiFree(b, kind) { const L = pois(b, kind).filter(p => p.users < p.cap); return L.length ? pick(L) : null; }
  function near(a, rad) { const [i, j] = tileOf(a), p = TWM.randomWalkable(a.biome, S.R, [i, j], rad); return p ? C(p[0], p[1]) : null; }
  const dirTo = (a, x, y) => { const dx = x - a.x, dy = y - a.y, sx = dx - dy, sy = (dx + dy) / 2; return Math.abs(sx) > Math.abs(sy) * 1.2 ? (sx > 0 ? 'right' : 'left') : (sy > 0 ? 'down' : 'up'); };

  // ---------------------------------------------------------------- steps
  const go = (x, y, o) => Object.assign({ k: 'go', x, y }, o || {});
  function stepRun(a, st, dt) {
    switch (st.k) {
      case 'go': {
        if (!st.path) {
          let [si, sj] = tileOf(a); const ti = Math.floor(st.x / T), tj = Math.floor(st.y / T);
          if (!TWM.walkable(si, sj) && !(st.swim && TWM.isWater(TWM.MAT[TWM.id(si, sj)]))) { const nw = nearestWalk(a.x, a.y, a.biome, 3); if (nw) { si = Math.floor(nw[0] / T); sj = Math.floor(nw[1] / T); } }
          const p = TWM.path(si, sj, ti, tj, { swim: st.swim, biome: a.biome });
          if (!p) { st.fail = true; return true; }
          st.path = p.slice(1).map(([i, j], k, arr) => { if (k === arr.length - 1) return [st.x, st.y]; let open = true; for (let dj = -1; dj <= 1 && open; dj++) for (let di = -1; di <= 1; di++) if (!TWM.walkable(i + di, j + dj) && !TWM.isWater(TWM.MAT[TWM.id(i + di, j + dj)])) { open = false; break; } const e = open ? 1.2 : 0; return [(i + 0.5) * T + rnd(-e, e), (j + 0.5) * T + rnd(-e, e)]; });
          if (!st.path.length) st.path = [[st.x, st.y]];
          a.path = st.path;
        }
        const [tx, ty] = st.path[0], dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), s = a.v * (st.run || 1) * dt;
        if (d > 0.01) a.dir = dirTo(a, tx, ty);
        if (d <= s) { a.x = tx; a.y = ty; st.path.shift(); a.dist += d; } else { a.x += dx / d * s; a.y += dy / d * s; a.dist += s; }
        a.moving = true; a.pose = 'walk';
        if (!st.path.length) { a.moving = false; a.pose = 'idle'; a.path = null; return true; }
        return false;
      }
      case 'nudge': { if (Math.hypot(st.x - a.x, st.y - a.y) > 12) { st.fail = true; return true; } const dx = st.x - a.x, dy = st.y - a.y, d = Math.hypot(dx, dy), s = a.v * dt; if (d > 0.01) a.dir = dirTo(a, st.x, st.y); if (d <= s) { a.x = st.x; a.y = st.y; a.moving = false; return true; } a.x += dx / d * s; a.y += dy / d * s; a.dist += s; a.moving = true; return false; }
      case 'follow': {
        st.left = (st.left === undefined ? st.t : st.left) - dt; const o = st.who; if (st.left <= 0 || !o || o.gone || o.hidden) { a.moving = false; return true; }
        if (!st.sub || st.re <= 0 || (st.sub.path && !st.sub.path.length)) { st.sub = go(o.x, o.y, { run: st.run || 1.4 }); st.re = 1.2; }
        st.re -= dt; if (Math.hypot(o.x - a.x, o.y - a.y) < 6) { a.moving = false; a.dir = dirTo(a, o.x, o.y); return false; }
        stepRun(a, st.sub, dt); return false;
      }
      case 'face': a.dir = st.dir || dirTo(a, st.x, st.y); return true;
      case 'sit': case 'act': case 'idle': case 'hop': case 'perch': {
        if (st.left === undefined) { st.left = st.t; if (st.k === 'act') count('act'); }
        st.left -= dt; a.pose = st.k; a.moving = false;
        if (st.k === 'hop') a.lift = Math.abs(Math.sin((st.t - st.left) * 7 + a.phase)) * 3;
        if (st.k === 'act' && st.prop) st.prop.hit = 0.4;
        if (st.left <= 0) { a.pose = 'idle'; if (st.k === 'hop') a.lift = 0; return true; }
        return false;
      }
      case 'climb': case 'thread': {
        if (st.from === undefined) { st.from = a.lift; st.el = 0; if (st.k === 'thread') { a.thread = a.gz + 46; count('thread'); } else count('climb'); }
        st.el += dt; const k = Math.min(1, st.el / st.t); a.lift = st.from + (st.to - st.from) * k; a.pose = 'climb'; a.dir = st.k === 'thread' ? 'down' : 'up'; a.dist += Math.abs(st.to - st.from) / st.t * dt * 2;
        if (k >= 1) { a.pose = 'idle'; if (st.k === 'thread' && st.to === 0) a.thread = 0; return true; }
        return false;
      }
      case 'jump': {
        if (st.x0 === undefined) { if (Math.hypot(st.x - a.x, st.y - a.y) > 22) { st.fail = true; return true; } st.x0 = a.x; st.y0 = a.y; st.el = 0; st.z0 = a.gz; count('jump'); }
        st.el += dt; const k = Math.min(1, st.el / st.t); a.x = st.x0 + (st.x - st.x0) * k; a.y = st.y0 + (st.y - st.y0) * k;
        const gzEnd = TWM.groundZ(st.x, st.y); a.lift = (st.z0 - TWM.groundZ(a.x, a.y)) * (1 - k) + Math.sin(k * Math.PI) * st.h; a.dir = dirTo(a, st.x, st.y); a.pose = 'jump';
        if (k >= 1) { a.lift = 0; a.pose = 'idle'; if (st.splash) fx('splash', st.x, st.y, 1.6, a.biome); return true; }
        return false;
      }
      case 'crawl': {   // move along a cliff face at a fixed lift (pose climb), facing the wall
        if (st.i === undefined) { st.i = 0; count('crawl'); }
        const t = st.pts[st.i]; if (!t) { a.pose = 'idle'; return true; }
        const dx = t[0] - a.x, dy = t[1] - a.y, d = Math.hypot(dx, dy), sp = a.v * 0.55 * dt; a.dir = 'up'; a.pose = 'climb'; a.moving = false;
        if (d <= sp) { a.x = t[0]; a.y = t[1]; st.i++; } else { a.x += dx / d * sp; a.y += dy / d * sp; a.dist += sp * 2.2; }
        return false;
      }
      case 'fly': {
        if (st.el === undefined) { st.el = 0; fx('cloud', a.x, a.y, st.t + 0.4, a.biome, { a }); }
        st.el += dt; const k = Math.min(1, st.el / st.t); a.lift = st.down ? (1 - k) * 70 : k * 80; a.pose = 'fly';
        if (k >= 1) { a.lift = 0; a.pose = 'idle'; if (!st.down) { a.hidden = true; a.away = true; } return true; }
        return false;
      }
      case 'fade': { if (st.el === undefined) { st.el = 0; if (st.in) a.hidden = false; } st.el += dt; const k = Math.min(1, st.el / (st.t || 1)); a.alpha = st.in ? k : 1 - k; if (k >= 1) { if (!st.in) { a.hidden = true; a.alpha = 1; if (st.gone) a.gone = true; } return true; } return false; }
      case 'wait': if (st.left === undefined) st.left = st.t; st.left -= dt; a.moving = false; return st.left <= 0;
      case 'bubble': bubble(a, st.kind, st.t); return true;
      case 'carry': a.carry = st.what; return true;
      case 'look': { if (window.TD2_CHARS && window.TD2_CHARS.chars[st.look]) a.look = st.look; else a.look = a.char; a.robe = /_bath$/.test(st.look); return true; }
      case 'call': st.fn(a); return true;
      case 'release': if (st.poi && (a.claims || []).includes(st.poi)) { st.poi.users = Math.max(0, st.poi.users - 1); a.claims.splice(a.claims.indexOf(st.poi), 1); } return true;
    }
    return true;
  }
  function bubble(a, kind, t) { a.bubble = kind; a.bubbleT = t || 2.8; }
  function fx(kind, x, y, dur, biome, o) { const f = Object.assign({ kind, x, y, z: TWM.groundZ(x, y), t: 0, dur, biome, r: 40 }, o || {}); S.fx.push(f); return f; }

  // ---------------------------------------------------------------- ambient activities (one builder per name)
  function heavenTask(a, kind, label, carry) {
    const p = poiFree(a.biome, kind); if (!p) return null;
    claim(a,p); count(label);
    return [go(p.x,p.y), {k:'face',dir:p.face||'up'}, {k:'act',t:rnd(5,9)}, carry && {k:'carry',what:'peach'}, {k:'bubble',kind:'note'}, {k:'idle',t:2}, {k:'carry',what:null}, {k:'release',poi:p}];
  }
  const ACT = {
    heaven_tend(a) { return heavenTask(a,'orchard','heaven_tend',false); },
    heaven_harvest(a) { return heavenTask(a,'orchard','heaven_harvest',true); },
    heaven_banquet(a) { return heavenTask(a,'banquet','heaven_banquet',true); },
    heaven_furnace(a) { return heavenTask(a,'furnace','heaven_furnace',false); },
    heaven_patrol(a) { return heavenTask(a,'heavenpath','heaven_patrol',false); },
    heaven_watch(a) { return heavenTask(a,'gatepost','heaven_watch',false); },
    wander(a) { const p = near(a, 12); return p && [go(p[0], p[1]), { k: 'idle', t: rnd(2, 6) }, S.R() < 0.3 && { k: 'bubble', kind: pick(['note', 'dots']) }]; },
    stroll(a) { const p = near(a, 16); return p && [go(p[0], p[1], { run: 0.8 }), { k: 'idle', t: rnd(3, 7) }]; },
    rest(a) {
      const night = S.hour < 6 || S.hour > 20, p = poiFree(a.biome, a.role === 'elder' && S.R() < 0.4 ? 'elder_seat' : 'seat'); if (!p) return ACT.wander(a);
      claim(a, p); return [go(p.x, p.y), { k: 'face', dir: p.face || 'down' }, { k: 'sit', t: rnd(14, 30) }, night && { k: 'bubble', kind: 'zz', t: 4 }, { k: 'sit', t: rnd(6, 12) }, { k: 'release', poi: p }];
    },
    talk(a) {
      const o = pick(S.agents.filter(b => b !== a && b.biome === a.biome && free(b) && Math.hypot(b.x - a.x, b.y - a.y) < 100 && !b.q.length && (!b.cur || b.cur.k === 'idle'))); if (!o) return ACT.wander(a);
      const p = nearestWalk(o.x + 8, o.y, a.biome, 3); if (!p) return null;
      assign(o, [{ k: 'face', x: p[0], y: p[1] }, { k: 'idle', t: 2 }, { k: 'bubble', kind: pick(['note', 'heart', 'dots', 'q']) }, { k: 'idle', t: 6 }], 'talk');
      return [go(p[0], p[1]), { k: 'face', x: o.x, y: o.y }, { k: 'bubble', kind: pick(['note', 'dots', 'excl']) }, { k: 'idle', t: 4 }, { k: 'bubble', kind: pick(['heart', 'note']) }, { k: 'idle', t: 4 }];
    },
    eat(a) {
      const p = poiFree(a.biome, 'tree'); if (!p) return ACT.wander(a); claim(a, p);
      const q = nearestWalk(p.x + rnd(-10, 10), p.y + rnd(4, 14), a.biome, 3) || [p.x, p.y];
      return [go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'act', t: 1.6 }, { k: 'carry', what: 'peach' }, { k: 'release', poi: p }, go(q[0], q[1]), { k: 'sit', t: rnd(4, 7) },
        { k: 'act', t: 3 }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 3 }, { k: 'carry', what: null }, { k: 'call', fn: () => count('eat') }];
    },
    climb(a) {
      const p = poiFree(a.biome, 'tree'); if (!p || !p.tree) return ACT.wander(a); claim(a, p);
      const tx = (p.tree[0] + 0.5) * T, ty = (p.tree[1] + 0.5) * T + 3.2;
      return [go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'nudge', x: tx, y: ty }, { k: 'climb', to: 15, t: 2.4 }, { k: 'face', dir: 'down' }, { k: 'perch', t: rnd(6, 14) },
        S.R() < 0.5 && { k: 'bubble', kind: pick(['note', 'heart']) }, { k: 'perch', t: rnd(2, 5) }, { k: 'climb', to: 0, t: 1.8 }, { k: 'nudge', x: p.x, y: p.y }, { k: 'release', poi: p }];
    },
    groom(a) {
      const o = pick(S.agents.filter(b => b !== a && b.biome === a.biome && free(b) && (b.role === 'citizen' || b.role === 'kid' || b.role === 'elder') && Math.hypot(b.x - a.x, b.y - a.y) < 80 && !b.q.length && (!b.cur || b.cur.k === 'idle'))); if (!o) return ACT.rest(a);
      const p = nearestWalk(o.x + 7, o.y + 2, a.biome, 2); if (!p) return null;
      assign(o, [{ k: 'face', x: p[0], y: p[1] }, { k: 'sit', t: 16 }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 4 }], 'groom'); count('groom');
      return [go(p[0], p[1]), { k: 'face', x: o.x, y: o.y }, { k: 'sit', t: 4 }, { k: 'act', t: 6 }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 8 }];
    },
    swim(a) {
      const water = TWM.pois.filter(p => p.biome === a.biome && p.kind === 'tree').length ? shoreJump(a) : null; return water || ACT.wander(a);
    },
    cave(a) { const p = pick(pois(a.biome, 'cave')); if (!p) return null; return [go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'fade', t: 1.2 }, { k: 'wait', t: rnd(10, 22) }, { k: 'fade', t: 1.2, in: true }, { k: 'call', fn: () => count('cave') }]; },
    chase(a) {
      const o = pick(S.agents.filter(b => b !== a && b.biome === a.biome && free(b) && b.role === 'kid' && !b.q.length)); if (!o) return ACT.hop(a);
      const pts = [near(a, 7), near(a, 9), near(a, 7)].filter(Boolean); if (!pts.length) return null; count('chase');
      assign(o, [{ k: 'wait', t: 0.8 }, { k: 'bubble', kind: 'excl' }, { k: 'follow', who: a, t: 11, run: 1.75 }, { k: 'bubble', kind: 'heart' }], 'chase');
      return [{ k: 'bubble', kind: 'note' }, ...pts.map(p => go(p[0], p[1], { run: 1.7 })), { k: 'hop', t: 2 }];
    },
    hop(a) { const p = near(a, 4); return [{ k: 'hop', t: rnd(2, 4) }, p && go(p[0], p[1], { run: 1.3 }), { k: 'hop', t: rnd(1.5, 3) }]; },
    patrol(a) {
      const pts = ['court', 'lookout', 'cave', 'tree'].map(k => pick(pois(a.biome, k))).filter(Boolean); if (!pts.length) return ACT.wander(a);
      const out = []; for (const p of pts) { const q = nearestWalk(p.x + rnd(-6, 6), p.y + rnd(2, 10), a.biome, 3); if (q) out.push(go(q[0], q[1], { run: 0.9 }), { k: 'face', dir: pick(['down', 'left', 'right']) }, { k: 'idle', t: rnd(2, 5) }); }
      return out;
    },
    drill(a) { const p = poiFree(a.biome, 'dummy'); if (!p) return ACT.patrol(a); claim(a, p); const prop = TWM.props.find(q => q.kind === 'dummy' && q.i === p.target[0] && q.j === p.target[1]);
      return [go(p.x, p.y), { k: 'face', dir: p.face }, { k: 'act', t: rnd(6, 10), prop }, { k: 'idle', t: 1.5 }, { k: 'act', t: rnd(3, 5), prop }, { k: 'release', poi: p }]; },
    watch(a) { const p = poiFree(a.biome, 'lookout'); if (!p) return ACT.patrol(a); const q = nearestWalk(p.x + rnd(-8, 8), p.y + rnd(0, 6), a.biome, 3) || [p.x, p.y]; return [go(q[0], q[1]), { k: 'face', dir: 'up' }, { k: 'idle', t: rnd(10, 18) }, { k: 'face', dir: 'right' }, { k: 'idle', t: 4 }]; },
    train(a) { const p = pick(pois(a.biome, 'court')); if (!p) return null; const q = nearestWalk(p.x + rnd(-10, 10), p.y + rnd(-6, 6), a.biome, 3); count('train');
      return [go(q[0], q[1]), { k: 'face', dir: 'right' }, { k: 'act', t: 4 }, { k: 'face', dir: 'down' }, { k: 'act', t: 3 }, { k: 'face', dir: 'left' }, { k: 'act', t: 4 }, { k: 'idle', t: 2 }]; },
    throne(a) { const p = pick(pois(a.biome, 'throne')); if (!p) return null; return [go(p.x, p.y), { k: 'face', dir: 'down' }, { k: 'sit', t: rnd(16, 28) }, { k: 'bubble', kind: 'note' }, { k: 'sit', t: 6 }]; },
    visit(a) { const o = pick(S.agents.filter(b => b !== a && b.biome === a.biome && free(b) && Math.hypot(b.x - a.x, b.y - a.y) < 140)); if (!o) return ACT.wander(a); const p = nearestWalk(o.x + 8, o.y, a.biome, 3); if (!p) return null;
      assign(o, [{ k: 'face', x: p[0], y: p[1] }, { k: 'wait', t: 2 }, { k: 'bubble', kind: 'heart' }, { k: 'hop', t: 1.6 }, { k: 'idle', t: 3 }], 'greet');
      return [go(p[0], p[1], { run: 1.2 }), { k: 'face', x: o.x, y: o.y }, { k: 'bubble', kind: 'note' }, { k: 'idle', t: 4 }]; },
    hop_rocks(a) { const out = []; let x = a.x, y = a.y; for (let k = 0; k < 4; k++) { const p = nearestWalk(x + rnd(-24, 24), y + rnd(-24, 24), a.biome, 3); if (!p || TWM.H[TWM.id(Math.floor(p[0] / T), Math.floor(p[1] / T))] !== TWM.H[TWM.id(Math.floor(x / T), Math.floor(y / T))]) continue; out.push({ k: 'jump', x: p[0], y: p[1], h: 9, t: 0.9 }, { k: 'idle', t: 0.6 }); x = p[0]; y = p[1]; } return out.length ? out : ACT.wander(a); },
    clean(a) {
      const L = S.litter.filter(l => l.biome === a.biome && !l.claimed); if (!L.length) return ACT.wander(a);
      L.sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y)); const l = L[0]; l.claimed = true;
      return [go(l.x, l.y), { k: 'act', t: 1.5 }, { k: 'call', fn: () => { S.litter.splice(S.litter.indexOf(l), 1); count('clean'); } }, { k: 'idle', t: 1 }];
    },
    pray(a) { const p = poiFree(a.biome, 'pray'); if (!p) return ACT.wander(a); claim(a, p); count('pray');
      return [go(p.x, p.y), { k: 'face', dir: p.face || 'up' }, { k: 'act', t: 2.4 }, { k: 'sit', t: rnd(5, 9) }, { k: 'bubble', kind: pick(['note', 'heart', 'star']) }, { k: 'sit', t: rnd(3, 6) }, { k: 'release', poi: p }]; },
    hut(a) { const p = poiFree(a.biome, 'hut'); if (!p) return ACT.wander(a); claim(a, p); count('hut'); const night = S.hour < 6 || S.hour > 20.5;
      return [go(p.x, p.y), { k: 'face', dir: p.face || 'up' }, { k: 'idle', t: 0.6 }, { k: 'fade', t: 0.7 }, { k: 'wait', t: night ? rnd(25, 45) : rnd(10, 24) }, { k: 'fade', t: 0.7, in: true }, { k: 'bubble', kind: 'note' }, { k: 'release', poi: p }]; },
    stall(a) { const p = poiFree(a.biome, 'stall'); if (!p) return ACT.wander(a); claim(a, p); count('stall'); const q = near(a, 8);
      return [go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'act', t: 2.4 }, { k: 'bubble', kind: 'excl' }, { k: 'idle', t: 1.2 }, { k: 'carry', what: 'peach' }, { k: 'bubble', kind: 'heart' }, { k: 'release', poi: p }, q && go(q[0], q[1]), { k: 'sit', t: rnd(4, 7) }, { k: 'act', t: 2.4 }, { k: 'carry', what: null }]; },
    play(a) { const p = poiFree(a.biome, 'play'); if (!p) return ACT.wander(a); claim(a, p); count('play');
      return [go(p.x, p.y, { run: 1.3 }), { k: 'face', dir: p.face || 'right' }, { k: 'nudge', x: p.x + 4, y: p.y }, { k: 'climb', to: 22, t: 2 }, { k: 'face', dir: 'down' }, { k: 'perch', t: rnd(2, 4) }, { k: 'bubble', kind: 'excl' }, { k: 'climb', to: 6, t: 1.2 }, { k: 'perch', t: 1.5 }, { k: 'climb', to: 0, t: 0.9 }, { k: 'hop', t: 2 }, { k: 'nudge', x: p.x, y: p.y }, { k: 'release', poi: p }]; },
    fish(a) { const p = poiFree(a.biome, 'fish'); if (!p) return ACT.wander(a); claim(a, p); count('fish');
      return [go(p.x, p.y), { k: 'face', dir: 'right' }, { k: 'act', t: rnd(8, 14) }, { k: 'call', fn: () => fx('splash', p.x + 10, p.y, 1.8, a.biome) }, { k: 'bubble', kind: 'excl' }, { k: 'carry', what: 'fish' }, { k: 'act', t: 2.5 }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 3 }, { k: 'carry', what: null }, { k: 'release', poi: p }]; },
    wall(a) { const p = poiFree(a.biome, 'wall'); if (!p) return ACT.wander(a); claim(a, p); const L = Math.min(Math.max(10, p.drop * 4 - 3), a.role === 'spiderling' ? 30 : 22), run = p.run;
      const out = S.R() < 0.5 ? run : run.slice().reverse();
      return [go(out[0][0], out[0][1], { run: 1.3 }), { k: 'face', dir: 'up' }, { k: 'climb', to: L, t: 2 }, { k: 'crawl', pts: out.slice(1) }, { k: 'perch', t: rnd(2, 4) }, { k: 'bubble', kind: pick(['note', 'excl']) }, { k: 'crawl', pts: out.slice(0, -1).reverse() }, { k: 'climb', to: 0, t: 1.8 }, { k: 'release', poi: p }]; },
    altar(a) { const p = poiFree(a.biome, 'altar'); if (!p) return ACT.stroll(a); claim(a, p); count('altar'); return [go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'act', t: 3 }, { k: 'sit', t: rnd(8, 14) }, { k: 'bubble', kind: 'heart' }, { k: 'sit', t: 4 }, { k: 'release', poi: p }]; },
    crystal(a) { const p = poiFree(a.biome, 'crystal'), al = pick(pois(a.biome, 'altar')); if (!p || !al) return ACT.stroll(a); claim(a, p); count('crystal');
      return [go(p.x, p.y), { k: 'face', dir: 'up' }, { k: 'act', t: 5 }, { k: 'carry', what: 'crystal' }, { k: 'bubble', kind: 'star' }, { k: 'release', poi: p }, go(al.x, al.y), { k: 'face', dir: 'up' }, { k: 'act', t: 3 }, { k: 'carry', what: null }, { k: 'bubble', kind: 'heart' }]; },
    // Bàn Tơ Động
    weave(a) { const p = poiFree(a.biome, 'loom'); if (!p) return ACT.stroll(a); claim(a, p); const tx = (p.target[0] + 0.5) * T, ty = (p.target[1] + 0.5) * T; const prop = TWM.props.find(q => q.kind === 'loom' && q.i === p.target[0] && q.j === p.target[1]);
      return [go(p.x, p.y), { k: 'face', x: tx, y: ty }, { k: 'act', t: rnd(10, 18), prop, weave: true }, { k: 'bubble', kind: 'note' }, { k: 'idle', t: 2 }, { k: 'act', t: rnd(5, 8), prop }, { k: 'release', poi: p }, { k: 'call', fn: () => count('weave') }]; },
    eggs(a) { const p = poiFree(a.biome, 'eggs'); if (!p) return ACT.stroll(a); claim(a, p); return [go(p.x, p.y), { k: 'face', dir: p.face }, { k: 'act', t: 4 }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 4 }, { k: 'release', poi: p }]; },
    bath(a) {
      const ch = pick(pois(a.biome, 'change')), spot = poiFree(a.biome, 'bath'); if (!ch || !spot) return ACT.stroll(a); claim(a, spot);
      return [go(ch.x, ch.y), { k: 'face', dir: 'up' }, { k: 'fade', t: 0.6 }, { k: 'look', look: a.char + '_bath' }, { k: 'fade', t: 0.6, in: true },
        go(spot.x, spot.y, { swim: true, run: 0.7 }), { k: 'face', dir: pick(['down', 'left', 'right']) }, { k: 'sit', t: rnd(16, 26) }, { k: 'bubble', kind: pick(['note', 'heart']) }, { k: 'sit', t: rnd(6, 10) },
        go(ch.x, ch.y, { swim: true, run: 0.7 }), { k: 'fade', t: 0.6 }, { k: 'look', look: a.char }, { k: 'fade', t: 0.6, in: true }, { k: 'release', poi: spot }, { k: 'call', fn: () => count('bath') }];
    },
    scuttle(a) { const out = []; for (let k = 0; k < 3; k++) { const p = near(a, 5); if (p) out.push(go(p[0], p[1], { run: 1.25 }), { k: 'idle', t: rnd(0.4, 1.6) }); } return out; },
    thread(a) { const p = poiFree(a.biome, 'thread'); if (!p) return ACT.scuttle(a); claim(a, p); return [go(p.x, p.y, { run: 1.2 }), { k: 'thread', to: 38, t: 3 }, { k: 'perch', t: rnd(4, 9) }, { k: 'thread', to: 0, t: 2.6 }, { k: 'release', poi: p }]; },
    follow(a) { const o = pick(S.agents.filter(b => b.biome === a.biome && b.role === 'sister' && !b.hidden)); return o ? [{ k: 'follow', who: o, t: rnd(8, 14), run: 1 }] : ACT.scuttle(a); },
  };
  function shoreJump(a) {
    // find a dry tile next to pool water at the same level, jump in, swim two strokes, climb out
    const b = a.biome, cand = [];
    for (const p of TWM.pois) if (p.biome === b && p.kind === 'cave') { /* ledge near the falls */ }
    const pc = TWM.hqs.pool; if (!pc || b !== 'hqs') return null;
    for (let k = 0; k < 40; k++) { const i = Math.round(pc[0] + rnd(-6, 6)), j = Math.round(pc[1] + rnd(-4, 5)); if (!TWM.walkable(i, j)) continue;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k2 = TWM.id(i + di, j + dj); if (TWM.MAT[k2] === TWM.M.POOL && TWM.H[k2] === TWM.H[TWM.id(i, j)]) cand.push([i, j, i + di, j + dj]); } if (cand.length > 2) break; }
    if (!cand.length) return null; const [i, j, wi, wj] = pick(cand); const [sx, sy] = C(i, j), [wx2, wy2] = C(wi, wj), mid = nearestWalk(wx2 + rnd(-12, 12), wy2 + rnd(-8, 8), b, 3, { swim: true }) || [wx2, wy2];
    count('swim');
    return [go(sx, sy), { k: 'face', x: wx2, y: wy2 }, { k: 'idle', t: 0.6 }, { k: 'jump', x: wx2, y: wy2, h: 10, t: 0.8, splash: true }, go(mid[0], mid[1], { swim: true, run: 0.6 }), { k: 'idle', t: rnd(3, 6) },
      go(wx2, wy2, { swim: true, run: 0.6 }), { k: 'jump', x: sx, y: sy, h: 6, t: 0.6 }, { k: 'bubble', kind: 'heart' }];
  }
  function chooseActivity(a) {
    const B = S.biomes[a.biome]; if (!B || !B.data) return;
    if (B.cleaning > S.t && (a.role === 'citizen' || a.role === 'kid' || a.role === 'fairy') && S.litter.some(l => l.biome === a.biome && !l.claimed) && S.R() < 0.7) { const s = ACT.clean(a); if (s) { assign(a, s, 'clean'); return; } }
    if (B.reweave > S.t && a.role === 'spiderling' && S.R() < 0.6) { const s = ACT.thread(a); if (s) { assign(a, s, 'reweave'); return; } }
    let list = B.data.roles[a.role]; if (!list) return;
    const night = S.hour < 6 || S.hour > 20.5; if (night && (a.role === 'citizen' || a.role === 'elder' || a.role === 'kid') && S.R() < 0.55) list = [['rest', 1]];
    let tot = 0; for (const [, w] of list) tot += w; let r = S.R() * tot, name = list[0][0]; for (const [n, w] of list) { r -= w; if (r <= 0) { name = n; break; } }
    const steps = ACT[name] && ACT[name](a);
    if (steps && steps.length) assign(a, steps, name); else assign(a, [{ k: 'idle', t: rnd(1, 3) }], 'idle');
  }

  // ---------------------------------------------------------------- mini events (coordinated; never counted by the Director)
  function freeOf(b, roles, n, nearXY) { let L = S.agents.filter(a => a.biome === b && free(a) && (!roles || roles.includes(a.role))); if (nearXY) L.sort((p, q) => Math.hypot(p.x - nearXY[0], p.y - nearXY[1]) - Math.hypot(q.x - nearXY[0], q.y - nearXY[1])); else L.sort(() => S.R() - 0.5); return L.slice(0, n); }
  function ring(b, cx, cy, r, k, n) { const a = (k / Math.max(1, n)) * Math.PI * 2 + 0.4; return nearestWalk(cx + Math.cos(a) * r * T, cy + Math.sin(a) * r * T * 0.8, b, 3); }
  const MINI = {
    heaven_shift(b) { const L=freeOf(b,['heavenguard'],3); const posts=pois(b,'gatepost'); if(L.length<2 || posts.length<2)return false;
      L.forEach((a,k)=>{const p=posts[k%posts.length];assign(a,[go(p.x,p.y),{k:'face',dir:'down'},{k:'act',t:4},{k:'bubble',kind:'excl'},{k:'idle',t:5}],'mini');});return true; },
    heaven_furnace_flare(b) { const L=freeOf(b,['laojun'],1), p=pick(pois(b,'furnace')); if(!L.length||!p)return false;
      assign(L[0],[go(p.x,p.y),{k:'face',dir:'right'},{k:'act',t:8},{k:'call',fn:()=>fx('sparks',p.x,p.y,5,b)},{k:'idle',t:3}],'mini');return true; },
    heaven_peach_baskets(b) { const L=freeOf(b,['fairy'],3), trees=pois(b,'orchard'), target=pick(pois(b,'banquet')); if(L.length<2||!trees.length||!target)return false;
      L.forEach((a,k)=>{const p=trees[k%trees.length];assign(a,[go(p.x,p.y),{k:'act',t:4},{k:'carry',what:'peach'},go(target.x,target.y),{k:'bubble',kind:'heart'},{k:'carry',what:null}],'mini');});return true; },
    fruit_raid(b) {
      const tree = poiFree(b, 'tree'); if (!tree) return false; const kids = freeOf(b, ['kid'], 3, [tree.x, tree.y]); if (kids.length < 2) return false;
      const guard = freeOf(b, ['elder', 'guard'], 1, [tree.x, tree.y])[0]; claim(kids[0], tree);
      const tx = (tree.tree[0] + 0.5) * T, ty = (tree.tree[1] + 0.5) * T + 3.2, away = nearestWalk(tree.x + rnd(-60, 60), tree.y + rnd(30, 60), b, 4) || [tree.x, tree.y];
      assign(kids[0], [go(tree.x, tree.y, { run: 1.3 }), { k: 'face', dir: 'up' }, { k: 'nudge', x: tx, y: ty }, { k: 'climb', to: 15, t: 2 }, { k: 'act', t: 3 }, { k: 'call', fn: () => fx('peachfall', tx, ty, 3.5, b) },
        { k: 'act', t: 2 }, { k: 'climb', to: 0, t: 1.4 }, { k: 'nudge', x: tree.x, y: tree.y }, { k: 'carry', what: 'peach' }, { k: 'release', poi: tree }, go(away[0], away[1], { run: 1.8 }), { k: 'sit', t: 6 }, { k: 'act', t: 3 }, { k: 'carry', what: null }], 'mini');
      kids.slice(1).forEach((k, n) => { const p = nearestWalk(tree.x + (n ? 9 : -9), tree.y + 6, b, 3) || [tree.x, tree.y]; assign(k, [go(p[0], p[1], { run: 1.3 }), { k: 'face', dir: 'up' }, { k: 'hop', t: 5 }, { k: 'act', t: 1.5 }, { k: 'carry', what: 'peach' }, { k: 'bubble', kind: 'heart' }, go(away[0] + (n ? 10 : -10), away[1], { run: 1.9 }), { k: 'sit', t: 6 }, { k: 'carry', what: null }], 'mini'); });
      if (guard) assign(guard, [{ k: 'wait', t: 7 }, { k: 'bubble', kind: 'excl' }, { k: 'follow', who: kids[0], t: 9, run: 1.3 }, { k: 'bubble', kind: 'dots' }], 'mini');
      return true;
    },
    storytime(b) {
      const seat = pick(pois(b, 'elder_seat')), el = freeOf(b, ['elder'], 1, seat && [seat.x, seat.y])[0]; if (!seat || !el) return false;
      const aud = freeOf(b, ['kid', 'citizen'], 5, [seat.x, seat.y]); if (aud.length < 2) return false;
      assign(el, [go(seat.x, seat.y), { k: 'face', dir: seat.face }, { k: 'act', t: 2 }, { k: 'bubble', kind: 'star' }, { k: 'sit', t: 8 }, { k: 'act', t: 2.5 }, { k: 'bubble', kind: 'note' }, { k: 'sit', t: 8 }, { k: 'act', t: 2 }, { k: 'bubble', kind: 'excl' }, { k: 'sit', t: 6 }], 'mini');
      aud.forEach((a, k) => { const p = nearestWalk(seat.x - 10 - (k % 3) * 6, seat.y + (k - 2) * 7, b, 3); if (p) assign(a, [go(p[0], p[1]), { k: 'face', x: seat.x, y: seat.y }, { k: 'sit', t: 30 }, { k: 'bubble', kind: pick(['heart', 'q', 'excl']) }, { k: 'sit', t: 4 }], 'mini'); });
      return true;
    },
    dive_party(b) { const L = freeOf(b, ['kid', 'citizen'], 3, TWM.hqs.pool.map(v => (v + 0.5) * T)); if (L.length < 2) return false; L.forEach((a, k) => { const s = shoreJump(a); if (s) assign(a, [{ k: 'wait', t: k * 2.5 }, ...s], 'mini'); }); return true; },
    guard_drill(b) { const c = pick(pois(b, 'court')); const L = freeOf(b, ['guard'], 3); if (!c || L.length < 2) return false; L.forEach((a, k) => { const p = nearestWalk(c.x + (k - 1) * 12, c.y + 10, b, 3); if (p) assign(a, [go(p[0], p[1]), { k: 'face', dir: 'down' }, { k: 'wait', t: 4 - k }, { k: 'act', t: 3 }, { k: 'face', dir: 'right' }, { k: 'act', t: 4 }, { k: 'bubble', kind: 'excl' }, { k: 'act', t: 3 }], 'mini'); });
      const k = S.agents.find(a => a.biome === b && a.role === 'king' && free(a)); if (k) assign(k, [go(c.x, c.y - 6), { k: 'face', dir: 'down' }, { k: 'idle', t: 6 }, { k: 'act', t: 5 }, { k: 'bubble', kind: 'star' }], 'mini'); return true; },
    supper(b) { const seats = pois(b, 'seat').filter(p => p.users < p.cap); const L = freeOf(b, ['citizen', 'elder', 'kid'], Math.min(6, seats.length)); if (L.length < 2) return false;
      L.forEach((a, k) => { const p = seats[k]; claim(a, p); assign(a, [go(p.x, p.y), { k: 'face', dir: p.face }, { k: 'carry', what: 'peach' }, { k: 'sit', t: rnd(10, 16) }, { k: 'bubble', kind: pick(['note', 'heart']) }, { k: 'sit', t: rnd(8, 14) }, { k: 'carry', what: null }, { k: 'release', poi: p }], 'mini'); }); return true; },
    weaving_circle(b) { const c = pick(pois(b, 'circle')); const L = freeOf(b, ['sister'], 3, [c.x, c.y]); if (L.length < 2) return false; const f = fx('silkrise', c.x, c.y, 16, b);
      L.forEach((a, k) => { const p = ring(b, c.x, c.y, 1.8, k, L.length); if (p) assign(a, [go(p[0], p[1]), { k: 'face', x: c.x, y: c.y }, { k: 'act', t: 12 }, { k: 'bubble', kind: 'note' }, { k: 'idle', t: 2 }], 'mini'); });
      S.web.target = Math.min(1, S.web.base + 0.12); S.web.rate = 0.02; S.biomes[b].webBack = S.t + 24; return true; },
    hot_spring(b) { const L = freeOf(b, ['sister'], 3); if (L.length < 2) return false; L.forEach((a, k) => { const s = ACT.bath(a); if (s) assign(a, [{ k: 'wait', t: k * 3 }, ...s], 'mini'); }); return true; },
    spider_rain(b) { const th = pois(b, 'thread'); const L = freeOf(b, ['spiderling'], th.length); if (L.length < 3) return false; L.forEach((a, k) => { const p = th[k % th.length]; assign(a, [go(p.x + rnd(-4, 4), p.y + rnd(-3, 3), { run: 1.3 }), { k: 'wait', t: k * 0.6 }, { k: 'thread', to: 40, t: 2.6 }, { k: 'perch', t: rnd(5, 8) }, { k: 'thread', to: 0, t: 2.2 }], 'mini'); }); return true; },
    lantern_gather(b) { const c = pick(pois(b, 'circle')); const L = freeOf(b, ['sister'], 4, [c.x, c.y]); if (L.length < 2) return false; fx('fireflies', c.x, c.y, 30, b, { r: 30 });
      L.forEach((a, k) => { const p = ring(b, c.x, c.y, 2.3, k, L.length); if (p) assign(a, [go(p[0], p[1]), { k: 'face', x: c.x, y: c.y }, { k: 'sit', t: 24 }, { k: 'bubble', kind: pick(['note', 'heart', 'dots']) }, { k: 'sit', t: 6 }], 'mini'); }); return true; },
    egg_watch(b) { const e = poiFree(b, 'eggs'); if (!e) return false; const sis = freeOf(b, ['sister'], 2, [e.x, e.y]), sp = freeOf(b, ['spiderling'], 3, [e.x, e.y]); if (!sis.length) return false;
      sis.forEach((a, k) => { const p = nearestWalk(e.x + k * 8, e.y + 4, b, 3); if (p) assign(a, [go(p[0], p[1]), { k: 'face', x: (e.target[0] + 0.5) * T, y: (e.target[1] + 0.5) * T }, { k: 'act', t: 6 }, { k: 'bubble', kind: 'heart' }, { k: 'idle', t: 6 }], 'mini'); });
      sp.forEach(a => { const p = nearestWalk(e.x + rnd(-14, 14), e.y + rnd(-10, 10), b, 3); if (p) assign(a, [go(p[0], p[1], { run: 1.3 }), { k: 'hop', t: 3 }, { k: 'idle', t: 4 }], 'mini'); }); return true; },
  };

  // ---------------------------------------------------------------- story runner (signature, foreshadow and recovery beats)
  function point(B, spec, R) {
    if (Array.isArray(spec)) return C(spec[0], spec[1]);
    if (spec === 'canopy') return C(TWM.btd.canopy[0], TWM.btd.canopy[1]);
    if (spec === 'mouthE') return C(R && R.kind === 'sig' && R.i < 8 ? 97 : 104, 143);
    const p = pick(pois(B.id, spec)); if (p) return [p.x, p.y];
    const a = who(B, spec, R); if (a && !Array.isArray(a)) return [a.x, a.y];
    return C(...TWM.biomes[TWM.bi[B.id]].centre.map(Math.round));
  }
  function who(B, name, R) {
    if (R && R.actors[name]) return R.actors[name];
    if (name === 'crowd') return R ? S.agents.filter(a => a.gathered === R) : [];
    return S.agents.find(a => a.biome === B.id && (a.role === name || a.char === name) && !a.gone) || null;
  }
  const each = (x, f) => (Array.isArray(x) ? x : x ? [x] : []).forEach(f);
  function newRun(B, beats, kind) { return { B, beats, kind, i: 0, wait: 0, pend: null, actors: {}, done: false }; }
  function runBeats(R, dt) {
    if (R.done) return; const B = R.B;
    if (R.wait > 0) { R.wait -= dt; if (R.wait > 0) return; }
    if (R.pend) { R.pendT = (R.pendT || 0) + dt; if (!R.pend() && R.pendT < 45) return; R.pend = null; R.pendT = 0; }
    if (R.i >= R.beats.length) { R.done = true; return; }
    const [op, o] = R.beats[R.i++];
    const W = o.who ? who(B, o.who, R) : null;
    switch (op) {
      case 'depart': if (W && !W.hidden) { // Do not interrupt a jump over a blocked tile: let it land before taking off.
        if (W.cur && W.cur.k === 'jump') { R.i--; R.wait = 0.2; break; }
        W.story = R; assign(W, [{ k: 'bubble', kind: 'excl' }, { k: 'wait', t: 1 }, { k: 'fly', t: 2.2 }]); R.pend = () => W.hidden; for (const a of S.agents) if (a.biome === B.id && free(a) && Math.hypot(a.x - W.x, a.y - W.y) < 90) assign(a, [{ k: 'face', x: W.x, y: W.y }, { k: 'bubble', kind: 'heart' }, { k: 'hop', t: 2 }], 'wave'); } break;
      case 'arrive': { const p = nearestWalk(...point(B, o.at, R), B.id, 4) || point(B, o.at, R); const a = W || agent(o.char || 'wukong', B.id, 'actor', Math.floor(p[0] / T), Math.floor(p[1] / T));
        a.x = p[0]; a.y = p[1]; a.gz = TWM.groundZ(a.x, a.y); a.hidden = false; a.away = false; a.alpha = 1; a.story = R; assign(a, [{ k: 'fly', down: true, t: 2.4 }, { k: 'bubble', kind: 'star' }]); R.pend = () => !a.q.length && !a.cur; break; }
      case 'spawn': {
        let p; if (o.from === 'edge') p = o.edge === 'east' ? point(B, 'mouthE', R) : C(...TWM.randomWalkable(B.id, S.R)); else p = point(B, o.at || 'focal', R);
        if (o.off) p = [p[0] + o.off[0] * T, p[1] + o.off[1] * T]; p = nearestWalk(p[0], p[1], B.id, 5) || p;
        const a = agent(o.char, B.id, 'actor', Math.floor(p[0] / T), Math.floor(p[1] / T)); a.x = p[0]; a.y = p[1]; a.gz = TWM.groundZ(a.x, a.y); a.story = R; R.actors[o.id] = a;
        if (o.from === 'sky') { assign(a, [{ k: 'fly', down: true, t: 2.2 }]); R.pend = () => !a.q.length && !a.cur; } else { a.alpha = 0; assign(a, [{ k: 'fade', t: 1, in: true }]); }
        break; }
      case 'go': if (W) { const p0 = point(B, o.to, R), p = nearestWalk(p0[0] + (o.off ? o.off[0] * T : 0), p0[1] + (o.off ? o.off[1] * T : 0), B.id, 5) || p0; W.story = R; assign(W, [go(p[0], p[1], { run: o.run || 1.1 })]); R.pend = () => !W.q.length && !W.cur; } break;
      case 'gather': {
        const c = point(B, o.at, R), cx = c[0] + (o.off ? o.off[0] * T : 0), cy = c[1] + (o.off ? o.off[1] * T : 0);
        let L = S.agents.filter(a => a.biome === B.id && !a.hidden && !a.gone && a.role !== 'actor' && a.role !== 'king' && !a.wrap && (!o.roles || o.roles.includes(a.role)) && (a.gathered === null || a.gathered !== R));
        L.sort((p, q) => Math.hypot(p.x - cx, p.y - cy) - Math.hypot(q.x - cx, q.y - cy)); if (o.n) L = L.slice(0, o.n);
        L.forEach((a, k) => { a.gathered = R; const p = ring(B.id, cx, cy, o.r * rnd(0.7, 1.1), k, L.length); if (p) assign(a, [go(p[0], p[1], { run: 1.35 }), { k: 'face', x: cx, y: cy }, { k: 'idle', t: 600 }], 'gather'); });
        const t0 = S.t; R.pend = () => S.t - t0 > 14 || L.filter(a => a.cur && a.cur.k === 'idle').length >= L.length * 0.75; break; }
      case 'face': each(W, a => { a.q = a.q.map(st => st.k === 'face' ? { k: 'face', dir: o.dir } : st); if (!a.cur || a.cur.k !== 'go') a.dir = o.dir || a.dir; }); break;
      case 'act': case 'sit': case 'hop': each(W, a => { const st = { k: op, t: o.t }; if (a.gathered === R) assign(a, [st, { k: 'idle', t: 600 }], 'gather'); else { a.story = a.story || R; assign(a, [st]); } }); if (o.wait !== false) R.wait = o.t; break;
      case 'bubble': each(W, (a, k) => { a.bubbleDelay = S.t + rnd(0, 1.6); bubble(a, o.kind, 3); }); break;
      case 'fx': { const p = o.at && who(B, o.at, R) && !Array.isArray(who(B, o.at, R)) ? who(B, o.at, R) : null; const xy = p ? [p.x, p.y] : point(B, o.at, R); fx(o.kind, xy[0], xy[1], o.dur || 4, B.id, { r: o.r || 40, a: p }); break; }
      case 'wait': R.wait = o.t; break;
      case 'strike': { const tg = who(B, o.at, R); if (W && tg) { W.dir = dirTo(W, tg.x, tg.y); assign(W, [{ k: 'act', t: 1.2 }]); fx('flash', tg.x, tg.y, 0.6, B.id, { r: 26 }); fx('sparks', tg.x, tg.y, 1.4, B.id, { r: 24 }); count('strike'); } R.wait = 1.4; break; }
      case 'wrap': if (W) { W.wrap = !!o.on; if (o.on) assign(W, [{ k: 'idle', t: 600 }]); else assign(W, []); } break;
      case 'web': if (o.target !== undefined) { S.web.target = o.target; S.web.rate = o.rate || 0.05; } if (o.glow !== undefined) S.web.glow = o.glow; break;
      case 'litter': { const c = point(B, o.at, R); for (let k = 0; k < o.n; k++) { const p = nearestWalk(c[0] + rnd(-o.r, o.r) * T, c[1] + rnd(-o.r, o.r) * T * 0.8, B.id, 2); if (p) S.litter.push({ x: p[0] + rnd(-2, 2), y: p[1] + rnd(-2, 2), biome: B.id, kind: S.R() < 0.6 ? 'pit' : 'petal' }); } break; }
      case 'clean': B.cleaning = S.t + o.dur; for (const a of S.agents) if (a.biome === B.id && free(a) && o.roles.includes(a.role) && S.R() < 0.7) assign(a, ACT.clean(a) || [], 'clean'); break;
      case 'retreat': { const cv = point(B, o.to, R); for (const a of S.agents) if (a.biome === B.id && !a.hidden && o.roles.includes(a.role)) { a.gathered = null; a.story = R; a.retreated = true; const p = nearestWalk(cv[0] + rnd(-6, 6), cv[1] + rnd(0, 6), B.id, 3) || cv; assign(a, [go(p[0], p[1], { run: 1.5 }), { k: 'face', dir: 'up' }, { k: 'fade', t: 1 }]); } break; }
      case 'return': { const cv = point(B, 'cave', R); S.agents.filter(a => a.biome === B.id && a.retreated).forEach((a, k) => { a.story = null; a.gathered = null; a.x = cv[0]; a.y = cv[1]; a.gz = TWM.groundZ(a.x, a.y); a.retreated = false; assign(a, [{ k: 'wait', t: 8 + k * 7 }, { k: 'fade', t: 1.4, in: true }, { k: 'bubble', kind: 'dots' }], 'return'); a.hidden = true; }); break; }
      case 'scatter': for (const a of S.agents) if (a.biome === B.id && free(a) && o.roles.includes(a.role)) { const p = near(a, 14); if (p) assign(a, [go(p[0], p[1], { run: 2 }), { k: 'idle', t: 3 }], 'scatter'); } break;
      case 'reweave': B.reweave = S.t + o.dur; break;
      case 'leave': if (W) { const p = o.to ? (nearestWalk(...point(B, o.to, R), B.id, 4) || point(B, o.to, R)) : null; W.story = R; if (o.by === 'sky') assign(W, [{ k: 'fly', t: 2.2 }, { k: 'call', fn: a => { a.gone = true; } }]); else assign(W, [p && go(p[0], p[1], { run: 1 }), { k: 'fade', t: 1.2, gone: true }]); R.pend = () => W.gone; } break;
      case 'disperse': for (const a of S.agents) if (a.gathered === R) { a.gathered = null; assign(a, [{ k: 'idle', t: rnd(0.5, 3) }]); } break;
    }
  }
  function endRun(R) {
    for (const a of S.agents) { if (a.gathered === R) { a.gathered = null; assign(a, [{ k: 'idle', t: rnd(0.5, 3) }]); } if (a.story === R && !a.retreated) { a.story = null; if (a.role === 'actor' && !a.gone) assign(a, [{ k: 'fade', t: 1.2, gone: true }]); } }
    R.done = true;
  }

  // ---------------------------------------------------------------- Director + Living Story Loop
  const adjOf = id => TWM.adj[id] || [];
  function director(dt) {
    const L = D().loop;
    for (const B of Object.values(S.biomes)) {
      if (!B.data || !B.data.stories) continue;
      B.timer -= dt;
      if (B.run) { runBeats(B.run, dt); if (B.run.done && B.phase === 'after') { endRun(B.run); B.run = null; } }
      if (B.phase === 'peace') {
        if (B.webBack && S.t > B.webBack) { S.web.target = S.web.base; S.web.rate = 0.02; B.webBack = 0; }
        if (B.timer <= 0) {
          const act = Object.values(S.biomes).filter(o => o.phase === 'fore' || o.phase === 'sig');
          if (act.length >= D().maxSignatures || act.some(o => adjOf(B.id).includes(o.id))) { B.timer = rnd(8, 20); }
          else { const ch = B.data.stories.filter(s => s.id !== B.last); B.story = pick(ch.length ? ch : B.data.stories); B.last = B.story.id; B.phase = 'fore'; B.timer = rnd(L.fore[0], L.fore[1]); S.counts.stories[B.story.id] = (S.counts.stories[B.story.id] || 0) + 1;
            if (B.run) endRun(B.run); B.run = newRun(B, B.story.fore || [], 'fore'); S.log.push([S.t, B.id, 'fore', B.story.id]); }
        } else if ((B.miniT -= dt) <= 0) {
          const names = B.data.minis.filter(n => n !== B.lastMini); const n = pick(names);
          if (MINI[n] && MINI[n](B.id)) { B.lastMini = n; S.counts.minis[n] = (S.counts.minis[n] || 0) + 1; }
          B.miniT = rnd(D().miniGap[0], D().miniGap[1]);
        }
      } else if (B.phase === 'fore' && B.timer <= 0) {
        if (B.run) endRun(B.run); B.phase = 'sig'; B.run = newRun(B, B.story.beats, 'sig'); B.timer = 1e9; S.log.push([S.t, B.id, 'sig', B.story.id]);
      } else if (B.phase === 'sig' && B.run && B.run.done) {
        endRun(B.run); B.phase = 'after'; B.timer = rnd(L.after[0], L.after[1]); B.recovers = (B.recovers || 0) + 1;
        const af = B.story.after; if (af) { const p = point(B, af.at); fx(af.fx, p[0], p[1], B.timer, B.id, { r: af.r, soft: true }); }
        B.run = newRun(B, B.story.recover || [], 'recover'); S.log.push([S.t, B.id, 'after', B.story.id]);
      } else if (B.phase === 'after' && B.timer <= 0) {
        if (B.run) { endRun(B.run); B.run = null; } B.phase = 'peace'; B.timer = rnd(L.peace[0], L.peace[1]); B.story = null; restore(B); S.log.push([S.t, B.id, 'peace']);
      }
    }
  }
  function restore(B) {
    // the story resets, the world does not: residents who left (on a cloud, into the cave) come home
    for (const a of S.agents) if (a.biome === B.id && a.role !== 'actor' && (a.hidden || a.retreated || a.story)) {
      a.story = null; a.retreated = false; a.gathered = null;
      if (a.away) { const p = nearestWalk((a.home[0] + 0.5) * T, (a.home[1] + 0.5) * T, B.id, 4); a.x = p[0]; a.y = p[1]; a.gz = TWM.groundZ(a.x, a.y); a.hidden = false; a.away = false; assign(a, [{ k: 'fly', down: true, t: 2.2 }]); }
      else if (a.hidden) { a.alpha = 0; assign(a, [{ k: 'fade', t: 1.2, in: true }]); }
    }
  }

  // ---------------------------------------------------------------- tick
  function tick(dt) {
    S.t += dt;
    director(dt);
    // the web canopy grows / tears / mends toward its target
    const w = S.web; if (w.ext !== w.target) { const s = w.rate * dt; w.ext = Math.abs(w.target - w.ext) <= s ? w.target : w.ext + Math.sign(w.target - w.ext) * s; }
    for (const p of TWM.props) if (p.hit > 0) p.hit -= dt;
    for (const a of S.agents) {
      if (a.gone) continue;
      if (a.bubbleT > 0) { a.bubbleT -= dt; if (a.bubbleT <= 0) a.bubble = null; }
      if (!a.cur && a.q.length) a.cur = a.q.shift();
      if (a.cur) { if (stepRun(a, a.cur, dt)) { if (a.cur.fail) { a.q = []; a.pose = 'idle'; a.moving = false; if (a.lift && !a.thread) a.lift = 0; } a.cur = null; } }
      else if (!a.hidden && !a.wrap) {
        const ti = Math.floor(a.x / T), tj = Math.floor(a.y / T), k0 = TWM.id(ti, tj);
        if (!TWM.WALK[k0] && !TWM.isWater(TWM.MAT[k0])) { const nw = nearestWalk(a.x, a.y, a.biome, 3); if (nw) { a.lift = 0; assign(a, [{ k: 'nudge', x: nw[0], y: nw[1] }], a.task); a.cur = a.q.shift(); } }
        else if (!a.story && !a.gathered && a.role !== 'actor') chooseActivity(a);
      }
      // terrain follow, water, frame
      a.gz = TWM.groundZ(a.x, a.y);
      const k = TWM.id(Math.floor(a.x / T), Math.floor(a.y / T)), m = TWM.MAT[k]; a.inWater = (m === TWM.M.POOL || m === TWM.M.SPRING) && a.pose !== 'jump' && a.pose !== 'fly';
      if (!a.cur && !a.q.length && !a.thread && a.lift && a.pose !== 'fly') a.lift = 0;
      a.frame = a.moving || a.pose === 'climb' ? 'walk' + (Math.floor(a.dist / 1.1) % 4)
        : a.pose === 'sit' ? 'sit' : a.pose === 'act' ? (Math.floor((S.t + a.phase) / 0.32) % 2 ? 'act1' : 'act0')
        : a.pose === 'jump' || a.pose === 'fly' ? 'walk0' : 'idle' + (Math.floor((S.t + a.phase) / 0.7) % 2);
      // ambient chatter near others
      if (!a.bubble && (a.pose === 'sit' || a.pose === 'idle') && !a.moving && S.R() < dt * 0.02) bubble(a, pick(['note', 'dots', 'heart']), 2.4);
    }
    S.agents = S.agents.filter(a => !(a.gone && a.role === 'actor'));
    for (let i = S.fx.length - 1; i >= 0; i--) { S.fx[i].t += dt; if (S.fx[i].a) { S.fx[i].x = S.fx[i].a.x; S.fx[i].y = S.fx[i].a.y; } if (S.fx[i].t > S.fx[i].dur) S.fx.splice(i, 1); }
  }
  function init(seed) {
    S.R = TWM.mulberry32(seed || 7); S.t = 0; S.agents = []; S.fx = []; S.litter = [];
    for (const b of TWM.biomes) {
      const data = D().biomes[b.id]; const B = S.biomes[b.id] = { id: b.id, data: data || null, phase: 'peace', timer: rnd(25, 90), miniT: rnd(5, 25), run: null, story: null };
      if (!data) continue;
      for (const [ch, n, role] of data.residents) for (let k = 0; k < n; k++) { const p = TWM.randomWalkable(b.id, S.R); if (p) agent(ch, b.id, role, p[0], p[1]); }
    }
    for (let k = 0; k < 300; k++) tick(0.1);                       // warm start: the world is already living on the first frame
    S.counts = { minis: {}, acts: {}, stories: {} };
  }
  return Object.assign(S, { init, tick, ACT, MINI });
})();
window.TWS = TWS;
if (typeof module !== 'undefined') module.exports = { TWS };
