'use strict';
// ===== Tây Du Ký — simulation: cast, ambient behaviour, Global Story Director, story beats (no DOM) =====
// Living Story Loop per biome: peace -> foreshadow (beacon) -> signature (beats) -> aftermath -> peace. The Director allows at most
// TD_DATA.maxSignatures stories at once and never two in biomes that share a border (TD_WORLD.adj). Mini events and recovery runs
// (td-data.js minis / recover) use the same beat interpreter but never count toward the cap.
const TS = { t: 0, agents: [], biomes: {}, fx: [], R: null, walk: null, cw: 0, ch: 0, cell: 4, speed: 1, events: [] };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = (a, b) => a + TS.R() * (b - a);
const pickR = arr => arr[Math.floor(TS.R() * arr.length)];

function tsWalkable(x, y) { const i = Math.floor(x / TS.cell), j = Math.floor(y / TS.cell); return i >= 0 && j >= 0 && i < TS.cw && j < TS.ch && TS.walk[j * TS.cw + i] === 1; }
function tsInRect(r, x, y, m) { m = m || 0; return x >= r[0] + m && y >= r[1] + m && x < r[0] + r[2] - m && y < r[1] + r[3] - m; }
function tsRandomCell(rect, near, rad) {
  for (let k = 0; k < 400; k++) {
    const x = near ? near[0] + rnd(-rad, rad) : rnd(rect[0], rect[0] + rect[2]), y = near ? near[1] + rnd(-rad, rad) * 0.7 : rnd(rect[1], rect[1] + rect[3]);
    if (tsInRect(rect, x, y, 6) && tsWalkable(x, y)) return [x, y];
  }
  return null;
}
function tsNearestCell(p, rect) {
  for (let r = 0; r < 260; r += 4) for (let k = 0; k < 16; k++) {
    const a = k / 16 * Math.PI * 2, x = p[0] + Math.cos(a) * r, y = p[1] + Math.sin(a) * r * 0.7;
    if ((!rect || tsInRect(rect, x, y, 4)) && tsWalkable(x, y)) return [x, y];
  }
  return p.slice();
}
function tsOpenSpot(rect) {
  // the gathering point: the walkable cell with the most open ground around it, in the middle of the biome
  let best = null, bs = -1;
  for (let k = 0; k < 900; k++) {
    const x = rect[0] + rect[2] * (0.2 + 0.6 * TS.R()), y = rect[1] + rect[3] * (0.2 + 0.6 * TS.R());
    if (!tsWalkable(x, y)) continue;
    let s = 0; for (let dy = -28; dy <= 28; dy += 7) for (let dx = -44; dx <= 44; dx += 8) if (tsWalkable(x + dx, y + dy)) s++;
    s -= Math.hypot(x - (rect[0] + rect[2] / 2), y - (rect[1] + rect[3] / 2)) * 0.02;
    if (s > bs) { bs = s; best = [x, y]; }
  }
  return best || [rect[0] + rect[2] / 2, rect[1] + rect[3] / 2];
}
function tsClearLine(x0, y0, x1, y1) { const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4)); for (let s = 1; s <= n; s++) if (!tsWalkable(x0 + (x1 - x0) * s / n, y0 + (y1 - y0) * s / n)) return false; return true; }

// ---------------------------------------------------------------- agents
function tsAgent(char, biome, role, x, y) {
  const a = { id: TS.agents.length, char, biome, role: role || 'wander', x, y, tx: x, ty: y, v: role === 'hop' ? rnd(20, 30) : rnd(10, 16), idle: rnd(0, 5),
    dir: 0, flip: false, moving: false, step: 0, hop: 0, bubble: null, bubbleT: 0, home: [x, y], story: null, alpha: 1, z: 0, fly: null, face: null, bow: 0, buried: role === 'buried' };
  if (role === 'guard') a.post = [[x, y], tsRandomCell(TS.biomes[biome].rect, [x, y], 70) || [x, y]];
  TS.agents.push(a); return a;
}
function tsSetTarget(a, x, y) { a.tx = x; a.ty = y; a.idle = 0; }
function tsFace(a, x, y) { const dx = x - a.x, dy = y - a.y; tsDir(a, dx, dy); }
function tsDir(a, dx, dy) {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;
  if (Math.abs(dy) > Math.abs(dx) * 1.3) { a.dir = dy > 0 ? 0 : 3; a.flip = false; }
  else { a.dir = dy >= 0 ? 1 : 2; a.flip = dx < 0; }
}
function tsBubble(a, kind, t) { a.bubble = kind; a.bubbleT = t || 3; }

function tsAmbient(a, dt) {
  const B = TS.biomes[a.biome];
  if (a.bubbleT > 0) { a.bubbleT -= dt; if (a.bubbleT <= 0) a.bubble = null; }
  if (a.role === 'static' || a.buried) { a.moving = false; return; }
  if (a.idle > 0) {
    a.idle -= dt; a.moving = false;
    if (a.role === 'pray') a.bow = (Math.sin(TS.t * 1.4 + a.id) > 0.85) ? 1 : 0;
    if (TS.R() < dt * 0.05) a.dir = pickR([0, 0, 1, 2]);
    if (TS.R() < dt * 0.012) tsBubble(a, pickR(['note', 'dots', 'heart', 'note', 'excl']), 2.6);
    if (a.idle <= 0) tsChooseNext(a);
    return;
  }
  tsMove(a, dt, () => { a.idle = a.role === 'pray' ? rnd(12, 30) : rnd(2, 9); tsMaybeChat(a); });
}
function tsChooseNext(a) {
  const B = TS.biomes[a.biome];
  if (a.role === 'pray') { a.idle = rnd(10, 25); return; }
  if (a.role === 'guard' && a.post) { a.postI = 1 - (a.postI || 0); const p = a.post[a.postI]; tsSetTarget(a, p[0], p[1]); return; }
  // visit: a random spot, a gathering point (the focal area), or a neighbour to chat with
  const r = TS.R();
  let p = null;
  if (r < 0.22 && B.focal) p = tsRandomCell(B.rect, B.focal, 80);
  else if (r < 0.4) { const o = pickR(TS.agents.filter(o => o.biome === a.biome && o !== a && !o.story)); if (o) p = tsRandomCell(B.rect, [o.x, o.y], 24); }
  if (!p) p = tsRandomCell(B.rect, [a.x, a.y], 120) || tsRandomCell(B.rect);
  if (p && tsClearLine(a.x, a.y, p[0], p[1])) tsSetTarget(a, p[0], p[1]); else a.idle = rnd(0.5, 2);
}
function tsMaybeChat(a) {
  if (TS.R() > 0.45) return;
  for (const o of TS.agents) {
    if (o === a || o.biome !== a.biome || o.story || o.role === 'static' || o.idle <= 0) continue;
    if (Math.hypot(o.x - a.x, o.y - a.y) < 44) {
      tsFace(a, o.x, o.y); tsFace(o, a.x, a.y);
      const talk = pickR(['dots', 'note', 'heart', 'excl', 'q']);
      tsBubble(a, talk, 3); o.chatWith = a; a.chatWith = o; o.idle = Math.max(o.idle, 6); a.idle = Math.max(a.idle, 6);
      TS.events.push({ t: TS.t + 2.2, fn: () => tsBubble(o, pickR(['dots', 'note', 'heart', 'q']), 3) });
      return;
    }
  }
}
function tsMove(a, dt, arrived) {
  const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
  if (d < 1.5) { a.moving = false; if (arrived) arrived(); return true; }
  const s = Math.min(d, a.v * dt * (a.run || 1)), nx = a.x + dx / d * s, ny = a.y + dy / d * s;
  if (!a.ghost && !tsWalkable(nx, ny)) { a.moving = false; a.idle = rnd(0.3, 1.2); return false; }
  a.x = nx; a.y = ny; a.moving = true; a.step += dt; tsDir(a, dx, dy);
  a.z = a.role === 'hop' ? Math.abs(Math.sin(a.step * 7)) * 5 : 0;
  return false;
}

// ---------------------------------------------------------------- Director + story runs
// A run interprets a beat list. Three kinds share one interpreter:
//   signature (B.run, counted by the Director), mini event (B.mini, during peace; small, never counted), recovery (B.mini, at the start
//   of the aftermath: the biome tidies up after its legend). Cast members a run takes away (walked off, faded) return at the next peace,
//   so the story resets and the world does not (design D8).
function tsInitBiomes() {
  const D = window.TD_DATA, Wd = window.TD_WORLD;
  for (const b of Wd.biomes) {
    const pl = Wd.plates.find(p => p.id === b.id);
    const B = TS.biomes[b.id] = { id: b.id, title: b.title, rect: pl.rect, centre: b.centre, data: D.biomes[b.id], phase: 'peace', timer: rnd(20, D.loop.peace[1]),
      story: null, run: null, mini: null, miniT: rnd(10, 50), lastMini: null, last: null, minis: 0 };
    B.focal = tsOpenSpot(B.rect);
    for (const [ch, n, role] of B.data.cast) for (let k = 0; k < n; k++) {
      const p = role === 'buried' ? tsNearestCell([B.focal[0], B.focal[1] - 26], B.rect) : tsRandomCell(B.rect);
      if (p && window.TD_CHARS[ch]) tsAgent(ch, b.id, role, p[0], p[1]);
    }
  }
}
function tsActiveSignatures() { return Object.values(TS.biomes).filter(B => B.phase === 'fore' || B.phase === 'sig'); }
function tsFree(a) { return !a.gone && !a.story && !a.gathered && a.role !== 'static' && a.role !== 'buried'; }
function tsNewRun(B, story, kind, focal) { return { B, story, kind, beat: 0, wait: 0, pending: null, actors: {}, chase: null, focal: focal || B.focal.slice(), walkT: 0, done: false }; }
function tsMiniFocal(B, m) {
  if (m.at === 'focal') return B.focal.slice();
  if (m.at) { const a = TS.agents.find(o => o.biome === B.id && o.char === m.at && !o.gone); if (a) return [a.x, a.y]; }
  const free = TS.agents.filter(o => o.biome === B.id && tsFree(o));
  return free.length ? (o => [o.x, o.y])(pickR(free)) : B.focal.slice();
}
function tsDirector(dt) {
  const D = window.TD_DATA, adj = window.TD_WORLD.adj;
  for (const B of Object.values(TS.biomes)) {
    B.timer -= dt;
    if (B.phase === 'peace' && B.timer <= 0) {
      const act = tsActiveSignatures();
      const blocked = act.length >= D.maxSignatures || act.some(o => (adj[B.id] || []).includes(o.id));
      if (blocked) { B.timer = rnd(8, 20); continue; }
      const choices = B.data.stories.filter(s => s.id !== B.last); B.story = pickR(choices.length ? choices : B.data.stories); B.last = B.story.id;
      B.phase = 'fore'; B.timer = rnd(D.loop.fore[0], D.loop.fore[1]);
      for (const a of TS.agents) if (a.biome === B.id && !a.story && TS.R() < 0.6) TS.events.push({ t: TS.t + rnd(0, 6), fn: () => { tsFace(a, B.focal[0], B.focal[1]); tsBubble(a, 'excl', 2.5); } });
    } else if (B.phase === 'fore' && B.timer <= 0) {
      if (B.mini) tsEndRun(B.mini);
      B.phase = 'sig'; B.run = tsNewRun(B, B.story, 'sig'); B.timer = 1e9;
    }
    else if (B.phase === 'after' && B.timer <= 0) { B.phase = 'peace'; B.timer = rnd(D.loop.peace[0], D.loop.peace[1]); B.story = null; tsRestore(B); }
    // mini events: only in peace, one at a time per biome
    if (B.phase === 'peace' && !B.mini && (B.data.minis || []).length && (B.miniT -= dt) <= 0) {
      const ms = B.data.minis.filter(m => m.id !== B.lastMini), m = pickR(ms.length ? ms : B.data.minis);
      B.lastMini = m.id; B.minis++; B.mini = tsNewRun(B, m, 'mini', tsMiniFocal(B, m)); B.miniT = rnd(D.miniGap[0], D.miniGap[1]);
    }
    if (B.run) tsRunBeats(B.run, dt);
    if (B.mini) tsRunBeats(B.mini, dt);
  }
}
function tsWho(R, name) {
  if (R.actors[name]) return R.actors[name];
  return TS.agents.find(a => a.biome === R.B.id && a.char === name && !a.gone && (!a.story || a.story === R)) || null;
}
function tsSpawn(R, ch, from) {
  const B = R.B; let p;
  if (from === 'focal') p = tsNearestCell([R.focal[0] + rnd(-20, 20), R.focal[1] + rnd(-10, 10)], B.rect);
  else if (from === 'sky') p = tsNearestCell([R.focal[0] + rnd(-40, 40), R.focal[1] + rnd(-20, 30)], B.rect);
  else { const r = B.rect, side = Math.floor(TS.R() * 4); const e = [[r[0] + 40, r[1] + r[3] * rnd(.3, .8)], [r[0] + r[2] - 40, r[1] + r[3] * rnd(.3, .8)], [r[0] + r[2] * rnd(.3, .7), r[1] + r[3] - 40], [r[0] + r[2] * rnd(.3, .7), r[1] + 50]][side]; p = tsNearestCell(e, B.rect); }
  const a = tsAgent(ch, B.id, 'actor', p[0], p[1]); a.story = R; a.idle = 0; a.v = 20;
  if (from === 'sky') { a.fly = { y0: p[1] - 240, t: 0, dur: 2.2, down: true }; TS.fx.push({ kind: 'cloud', a, t: 0, dur: 2.6 }); }
  return a;
}
function tsAt(R, spec) {
  if (spec === 'focal' || !spec) return R.focal.slice();
  if (Array.isArray(spec)) return [R.focal[0] + spec[0], R.focal[1] + spec[1]];
  const a = tsWho(R, spec); return a ? [a.x, a.y] : R.focal.slice();
}
function tsTake(a, R) { a.story = R; a.ghost = true; }
function tsRunBeats(R, dt) {
  const B = R.B, beats = R.story.beats;
  if (R.done) return;
  if (R.wait > 0) { R.wait -= dt; if (R.wait > 0) return; }
  if (R.pending && !R.pending(dt)) return;
  R.pending = null;
  if (R.beat >= beats.length) { tsEndRun(R); return; }
  const [op, o] = beats[R.beat++];
  if (op === 'spawn') { R.actors[o.id] = tsSpawn(R, o.char, o.from); R.wait = o.from === 'sky' ? 2.5 : 0.3; }
  else if (op === 'walk') {
    const a = tsWho(R, o.who); if (!a) return;
    const at = tsAt(R, o.to), off = o.off || [0, 0], p = tsNearestCell([at[0] + off[0], at[1] + off[1]], B.rect);
    tsTake(a, R); tsSetTarget(a, p[0], p[1]); a.run = o.speed || 1.4; R.walkT = 0;
    R.pending = d => Math.hypot(a.x - a.tx, a.y - a.ty) < 2 || (R.walkT += d) > 25;
  }
  else if (op === 'gather') {
    let list = TS.agents.filter(a => a.biome === B.id && tsFree(a) && (!o.char || a.char.startsWith(o.char)));
    if (o.n) list = list.sort((p, q) => Math.hypot(p.x - R.focal[0], p.y - R.focal[1]) - Math.hypot(q.x - R.focal[0], q.y - R.focal[1])).slice(0, o.n);
    for (const a of list) {
      const ang = TS.R() * Math.PI * 2, r = o.r * rnd(0.6, 1.1), p = tsNearestCell([R.focal[0] + Math.cos(ang) * r, R.focal[1] + Math.sin(ang) * r * 0.6], B.rect);
      a.gathered = R; a.ghost = true; a.run = 1.6; tsSetTarget(a, p[0], p[1]); a.face = R.focal;
    }
    R.wait = R.kind === 'sig' ? 4 : 2.5;
  }
  else if (op === 'fx') { const p = tsAt(R, o.at); TS.fx.push({ kind: o.kind, x: p[0], y: p[1], r: o.r || 60, t: 0, dur: o.dur || 4, biome: B.id }); }
  else if (op === 'wait') R.wait = o.t;
  else if (op === 'bubble') {
    const list = o.who === 'crowd' ? TS.agents.filter(a => a.gathered === R) : [tsWho(R, o.who)].filter(Boolean);
    for (const a of list) TS.events.push({ t: TS.t + rnd(0, o.who === 'crowd' ? 1.5 : 0), fn: () => tsBubble(a, o.kind, o.t || 2.6) });
  }
  else if (op === 'face') { const a = tsWho(R, o.who); if (a) { a.face = null; a.dir = o.dir; a.flip = false; } }
  else if (op === 'free') { const a = tsWho(R, o.who); if (a) { a.buried = false; tsTake(a, R); a.idle = 0; } R.wait = 0.8; }
  else if (op === 'bow') { const a = tsWho(R, o.who); if (a) { a.bow = 1; TS.events.push({ t: TS.t + (o.t || 3), fn: () => { a.bow = 0; } }); } R.wait = o.t || 3; }
  else if (op === 'strike') {
    const a = tsWho(R, o.who), b = tsWho(R, o.target); if (!a || !b) return;
    tsFace(a, b.x, b.y); a.strike = 0.5; TS.fx.push({ kind: 'flash', x: b.x, y: b.y - 20, r: 30, t: 0, dur: 0.6 }); TS.fx.push({ kind: 'sparks', x: b.x, y: b.y - 20, r: 26, t: 0, dur: 1.4 });
    R.wait = 1.4;
  }
  else if (op === 'swap') { const a = tsWho(R, o.who); if (a) a.char = o.char; R.wait = 0.6; }
  else if (op === 'chase') {
    const runner = o.who === 'crowd' ? null : tsWho(R, o.who), target = o.target === 'focal' ? null : tsWho(R, o.target);
    const t0 = TS.t;
    R.chase = { runner, target, crowd: o.who === 'crowd', t0, dur: o.t };
    R.pending = () => TS.t - t0 > o.t;
  }
  else if (op === 'leave') {
    const a = tsWho(R, o.who); if (!a) return;
    tsTake(a, R);
    if (o.by === 'sky') { a.fly = { y0: a.y, t: 0, dur: 2.2, down: false }; TS.fx.push({ kind: 'cloud', a, t: 0, dur: 2.4 }); R.wait = 1; }
    else if (o.by === 'fade') { a.fade = 1; R.wait = 1.5; }
    else if (o.by === 'south') { const r = B.rect, p = tsNearestCell([a.x + rnd(-30, 30), r[1] + r[3] - 24], r); tsSetTarget(a, p[0], p[1]); a.run = 1; a.leaving = 'fade'; }
    else { const r = B.rect, p = tsNearestCell([r[0] + (TS.R() < .5 ? 40 : r[2] - 40), r[1] + r[3] * rnd(.3, .8)], r); tsSetTarget(a, p[0], p[1]); a.leaving = true; }
  }
  else if (op === 'disperse') { for (const a of TS.agents) if (a.gathered === R) tsRelease(a); }
}
function tsRelease(a) { a.gathered = false; a.face = null; a.ghost = false; a.run = 1; a.idle = rnd(1, 8); }
function tsEndRun(R) {
  if (R.done) return;
  const B = R.B, D = window.TD_DATA; R.done = true; R.chase = null;
  for (const a of TS.agents) if (a.gathered === R) tsRelease(a);
  // actors still standing walk away (released cast members return to their day in tsTick)
  for (const k in R.actors) { const a = R.actors[k]; if (!a.gone && !a.fly && !a.fade && !a.leaving) { const r = B.rect, p = tsNearestCell([r[0] + (TS.R() < .5 ? 40 : r[2] - 40), a.y], r); tsSetTarget(a, p[0], p[1]); a.leaving = true; a.ghost = true; } }
  if (R === B.mini) B.mini = null;
  if (R === B.run) {
    B.run = null; B.phase = 'after'; B.timer = rnd(D.loop.after[0], D.loop.after[1]);
    // aftermath: the biome's own footprint lingers, and a recovery run tidies up
    const f = B.data.after || {}, fp = B.focal;
    TS.fx.push({ kind: f.kind || 'petals', x: fp[0], y: fp[1], r: f.r || 70, t: 0, dur: B.timer, biome: B.id, soft: true });
    if (B.data.recover) { if (B.mini) tsEndRun(B.mini); B.mini = tsNewRun(B, { id: 'recover', beats: B.data.recover }, 'recover', B.focal.slice()); B.recovers = (B.recovers || 0) + 1; }
  }
}
function tsRestore(B) {
  // the story resets, the world does not: cast members who walked off or faded come home (hidden by a puff of mist)
  for (const a of TS.agents) if (a.biome === B.id && a.role !== 'actor' && (a.gone || a.story)) {
    a.x = a.tx = a.home[0]; a.y = a.ty = a.home[1]; a.gone = false; a.leaving = false; a.fade = 0; a.alpha = 1; a.story = null; a.ghost = false; a.run = 1; a.idle = rnd(1, 4);
    if (a.role === 'buried') { a.buried = true; a.dir = 0; a.flip = false; }
    TS.fx.push({ kind: 'mist', x: a.x, y: a.y, r: 30, t: 0, dur: 5, biome: B.id });
  }
}

function tsTick(dt) {
  TS.t += dt;
  for (let i = TS.events.length - 1; i >= 0; i--) if (TS.t >= TS.events[i].t) { const e = TS.events[i]; TS.events.splice(i, 1); e.fn(); }
  tsDirector(dt);
  for (const B of Object.values(TS.biomes)) for (const R of [B.run, B.mini]) if (R && R.chase) {
    const c = R.chase;
    if (c.crowd && c.target) for (const a of TS.agents) { if (a.gathered === R) { tsSetTarget(a, c.target.x + rnd(-30, 30), c.target.y + rnd(-14, 14)); a.run = 1.3; } }
    if (c.runner && !c.runner.fly) {
      const ang = TS.t * 0.9 + c.runner.id, tgt = c.target ? [c.target.x, c.target.y] : R.focal;
      if (Math.hypot(c.runner.tx - c.runner.x, c.runner.ty - c.runner.y) < 3) { const p = tsNearestCell([tgt[0] + Math.cos(ang) * 50, tgt[1] + Math.sin(ang) * 26], B.rect); tsSetTarget(c.runner, p[0], p[1]); c.runner.run = 2; }
      if (c.target && c.target.story !== R) tsTake(c.target, R);
      if (c.target) { const fl = [c.target.x * 2 - c.runner.x, c.target.y * 2 - c.runner.y]; if (Math.hypot(c.target.tx - c.target.x, c.target.ty - c.target.y) < 3) { const p = tsNearestCell([fl[0] + rnd(-30, 30), fl[1] + rnd(-16, 16)], B.rect); tsSetTarget(c.target, p[0], p[1]); c.target.run = 1.8; } }
    }
  }
  for (const a of TS.agents) {
    if (a.gone) continue;
    if (a.fly) {
      const f = a.fly; f.t += dt; const k = Math.min(1, f.t / f.dur);
      a.z = f.down ? (1 - k) * 240 : k * 260; a.moving = false;
      if (k >= 1) { a.fly = null; a.z = 0; if (!f.down) a.gone = true; }
      continue;
    }
    if (a.fade) { a.fade -= dt * 0.5; a.alpha = Math.max(0, a.fade); if (a.fade <= 0) a.gone = true; continue; }
    if (a.strike > 0) { a.strike -= dt; continue; }
    if (a.story || a.gathered) {
      if (!tsMove(a, dt) && !a.moving && a.face) tsFace(a, a.face[0], a.face[1]);
      if (a.leaving && !a.moving && Math.hypot(a.tx - a.x, a.ty - a.y) < 3) { if (a.leaving === 'fade') a.fade = 1; else a.gone = true; }
      if (a.gathered && !a.moving && TS.R() < dt * 0.05) tsBubble(a, pickR(['excl', 'heart', 'note']), 2);
      continue;
    }
    tsAmbient(a, dt);
  }
  // cast members released after a run return to normal life (unless they left; they come back at the next peace)
  for (const a of TS.agents) if (a.story && a.story.done && a.role !== 'actor' && !a.leaving && !a.fade) { a.story = null; a.ghost = false; a.run = 1; a.idle = rnd(1, 5); }
  TS.agents = TS.agents.filter(a => !a.gone || a.role !== 'actor');
  for (let i = TS.fx.length - 1; i >= 0; i--) { TS.fx[i].t += dt; if (TS.fx[i].t > TS.fx[i].dur) TS.fx.splice(i, 1); }
}
function tsInit(walk, cw, ch, seed) {
  TS.R = mulberry(seed || 11); TS.walk = walk; TS.cw = cw; TS.ch = ch; TS.cell = window.TD_WORLD.cell;
  tsInitBiomes();
}
if (typeof module !== 'undefined') module.exports = { TS, tsInit, tsTick };
