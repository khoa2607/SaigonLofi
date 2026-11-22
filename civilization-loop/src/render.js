// Visual Simulation layer: draws the persistent world from the simulation state. Rendering never changes the simulation.
// Low-resolution canvas (integer pixel scale, nearest-neighbour upscale) + iso depth sorting by diagonal.
import { N, G, idx } from './world.js';
import { BT } from './buildings.js';
import { hash2, clamp } from './rng.js';
import * as A from './art.js';
import { seasonOf } from './sim.js';

const { TW, TH, HW, HH } = A;
const DAY_LEN = 150;   // real seconds per in-world day (visual only)
const KF = [[0, 0x2e3a6a], [0.2, 0x4a5488], [0.26, 0xe8a890], [0.32, 0xffe6c8], [0.45, 0xfffaf0], [0.7, 0xfff0d0], [0.77, 0xffb080], [0.84, 0x6a5a8a], [0.92, 0x34406e], [1, 0x2e3a6a]];
function skyTint(t) { let i = 0; while (i < KF.length - 2 && KF[i + 1][0] <= t) i++; const a = KF[i], b = KF[i + 1]; return A.mix(a[1], b[1], (t - a[0]) / (b[0] - a[0])); }
const lum = c => (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) / 255;

export function createRenderer(canvas) {
  const view = document.createElement('canvas'), vg = view.getContext('2d'), g = canvas.getContext('2d');
  const R = { canvas, cam: { x: 0, y: 0 }, scale: 2, lw: 0, lh: 0, hover: null, sel: null, time: 0, dayOffset: 0.3, actors: [], deer: [], smoke: [], cache: new Map(), glow: A.glowSprite(28), dayT: 0.4, night: 0 };
  const cached = (key, make) => { let c = R.cache.get(key); if (!c) { c = make(); R.cache.set(key, c); } return c; };

  R.resize = () => { const dpr = 1; canvas.width = Math.floor(canvas.clientWidth * dpr); canvas.height = Math.floor(canvas.clientHeight * dpr); R.lw = Math.ceil(canvas.width / R.scale); R.lh = Math.ceil(canvas.height / R.scale); view.width = R.lw; view.height = R.lh; vg.imageSmoothingEnabled = false; g.imageSmoothingEnabled = false; };
  R.setScale = s => { R.scale = clamp(s, 1, 5); R.resize(); };
  R.centerOn = (tx, ty) => { R.cam.x = (tx - ty) * HW; R.cam.y = (tx + ty + 1) * HH; };
  R.pan = (dx, dy) => { R.cam.x = clamp(R.cam.x - dx / R.scale, -N * HW, N * HW); R.cam.y = clamp(R.cam.y - dy / R.scale, 0, N * TH); };
  R.toTile = (px, py) => { const X = R.cam.x + (px / R.scale - R.lw / 2), Y = R.cam.y + (py / R.scale - R.lh / 2), x = Math.floor((X / HW + Y / HH - 1) / 2 + 0.5), y = Math.floor((Y / HH - 1 - X / HW) / 2 + 0.5); return (x >= 0 && y >= 0 && x < N && y < N) ? { x, y } : null; };
  const scr = (tx, ty) => [Math.round((tx - ty) * HW - R.cam.x + R.lw / 2), Math.round((tx + ty) * HH - R.cam.y + R.lh / 2)];   // screen position of a tile's top vertex

  // ---------------------------------------------------------------- tile -> sprite
  function groundSprite(S, x, y, season, time) {
    const W = S.world, t = idx(x, y), v = Math.floor(hash2(x, y, 1) * 4), gnd = W.ground[t];
    if (gnd === G.WATER) {
      let m = 0; const w = (xx, yy) => xx >= 0 && yy >= 0 && xx < N && yy < N && W.ground[idx(xx, yy)] === G.WATER;
      if (!w(x + 1, y)) m |= 1; if (!w(x, y + 1)) m |= 2; if (!w(x - 1, y)) m |= 4; if (!w(x, y - 1)) m |= 8;
      const f = Math.floor(time * 1.6 + hash2(x, y, 2) * 4) & 3; return cached(`w${m}.${f}.${season}`, () => A.groundTile('water', 0, season, { mask: m, frame: f }));
    }
    if (gnd === G.ROCK) return cached(`r${v}.${season}.${W.quarried[t]}`, () => A.groundTile(W.quarried[t] ? 'pit' : 'rock', v, season));
    const bi = W.bld[t];
    if (bi >= 0) {
      const b = S.buildings[bi];
      if (b.type === 'farm') {
        let st = 0; const m = S.month;
        if (b.done) { st = b.fallow ? 5 : b.abandoned ? 6 : (S.world.soil[t] * S.world.fert[t] < 0.2 ? 4 : m < 1 ? 0 : m < 3 ? 1 : m < 6 ? 2 : m < 9 ? 3 : 0); }
        return cached(`f${st}.${v}.${season}`, () => A.groundTile('farm', v, season, { stage: st }));
      }
      return cached(`p${v}.${b.done ? 1 : 0}.${season}`, () => A.groundTile('plot', v, season, { stage: b.done ? 1 : 0 }));
    }
    if (W.farmed[t] === 2) return cached(`f6.${v}.${season}`, () => A.groundTile('farm', v, season, { stage: 6 }));
    if (W.burnt[t] > 0) { const fade = Math.round((15 - W.burnt[t]) / 15 * 8) / 10; return cached(`b${v}.${fade}.${season}`, () => A.groundTile('burnt', v, season, { fade })); }
    if (W.road[t]) { const over = S.year - W.roadUsed[t] > 40; return cached(`d${W.road[t]}.${v}.${over ? 1 : 0}.${season}`, () => A.groundTile('dirt', v, season, { packed: W.road[t] === 2, overgrown: over })); }
    if (W.flood[t] && S.t - S.lastFlood < 30) return cached(`m${v}.${season}`, () => A.groundTile('mud', v, season));
    return cached(`g${v}.${season}`, () => A.groundTile('grass', v, season));
  }

  // ---------------------------------------------------------------- the main draw
  R.draw = function (S, now, speed) {
    R.time = now; R.dayT = (R.dayOffset + now / DAY_LEN) % 1;
    const sk = skyTint(R.dayT); R.night = clamp((0.55 - lum(sk)) / 0.35, 0, 1);
    const season = seasonOf(S.month), W = S.world, d0 = 0;
    vg.setTransform(1, 0, 0, 1, 0, 0); vg.fillStyle = season === 3 ? '#26303a' : '#1f2a26'; vg.fillRect(0, 0, R.lw, R.lh);
    const cull = (sx, sy, w, h) => sx + w < 0 || sy + h < 0 || sx > R.lw || sy > R.lh;
    // pass 1: ground
    for (let d = 0; d <= 2 * N - 2; d++) for (let x = Math.max(0, d - N + 1); x <= Math.min(N - 1, d); x++) {
      const y = d - x, [sx, sy] = scr(x, y); if (cull(sx - HW, sy - 4, TW, 16)) continue;
      vg.drawImage(groundSprite(S, x, y, season, now), sx - HW, sy - 4);
      const t = idx(x, y);
      if (W.ruin[t] === 2) vg.drawImage(cached(`fd${Math.floor(hash2(x, y, 3) * 3)}`, () => A.foundationSprite(Math.floor(hash2(x, y, 3) * 3), season, 0)), sx - HW, sy - 4);
    }
    // visual agents are bucketed by iso depth
    syncActors(S, now); const bucket = new Map(), put = (e) => { const k = Math.floor(e.x) + Math.floor(e.y); (bucket.get(k) || bucket.set(k, []).get(k)).push(e); };
    for (const a of R.actors) if (!a.hidden) put(a); for (const a of R.deer) put(a);
    const lights = [];
    // pass 2: objects + actors in diagonal order
    for (let d = 0; d <= 2 * N - 2; d++) {
      for (let x = Math.max(0, d - N + 1); x <= Math.min(N - 1, d); x++) {
        const y = d - x, t = idx(x, y), [sx, sy] = scr(x, y), cx = sx, cy = sy + HH;
        if (cull(sx - 20, sy - 44, 40, 70)) continue;
        const gnd = W.ground[t];
        if (gnd === G.GRASS && W.bld[t] < 0) {
          if (W.tree[t] > 0) { const lv = W.tree[t], vr = Math.floor(hash2(x, y, 9) * 3), spr = cached(`t${lv}.${vr}.${season}`, () => A.treeSprite(lv, vr, season)); vg.drawImage(spr, cx - A.TREE_AX, cy - A.TREE_AY + 2); }
          else if (W.burnt[t] > 0 && hash2(x, y, 4) > 0.45) { const vv = hash2(x, y, 5) > 0.5 ? 1 : 0; vg.drawImage(cached(`sn${vv}`, () => A.snagSprite(vv)), cx - 6, cy - 19); }
          else if (S.year - W.clearedYear[t] < 40 && W.clearedYear[t] > -9000 && W.ruin[t] === 0 && hash2(x, y, 6) > 0.4) { const vv = hash2(x, y, 7) > 0.5 ? 1 : 0; vg.drawImage(cached(`st${vv}`, () => A.stumpSprite(vv)), cx - 6, cy - 8); }
          if (W.ruin[t] === 1) { const age = S.year - W.ruinYear[t], vv = Math.floor(hash2(x, y, 3) * 5); vg.drawImage(cached(`ru${W.ruinKind[t]}.${vv}.${Math.floor(age / 25)}.${season}`, () => A.ruinSprite(W.ruinKind[t], vv, age, season)), cx - 12, cy - 12); }
        } else if (gnd === G.ROCK && !W.quarried[t]) { const vv = Math.floor(hash2(x, y, 8) * 4); vg.drawImage(cached(`bo${vv}.${season}`, () => A.boulderSprite(vv, season)), cx - 13, cy - 17); }
        // buildings are drawn from their front-most tile
        const bi = W.bld[t];
        if (bi >= 0) { const b = S.buildings[bi]; if (x === b.x + b.w - 1 && y === b.y + b.d - 1) drawBuilding(S, b, lights, season); }
      }
      const list = bucket.get(d); if (list) for (const e of list) drawEntity(e);
    }
    drawFxAndLight(S, lights, sk, season);
    // upscale
    g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.clearRect(0, 0, canvas.width, canvas.height); g.drawImage(view, 0, 0, R.lw * R.scale, R.lh * R.scale);
  };

  function drawBuilding(S, b, lights, season) {
    const stage = b.done ? 4 : Math.min(3, Math.floor(b.progress * 4)), wear = b.cond > 0.6 ? 0 : b.cond > 0.3 ? 1 : 2, ab = b.abandoned ? 1 : 0, variant = b.id % 4;
    const key = `b.${b.type}.${b.skin}.${stage}.${wear}.${ab}.${variant}.${season === 3 ? 1 : 0}`;
    const spr = cached(key, () => A.buildingSprite(b.type, b.skin, stage, wear, ab, variant + 3)), [sx, sy] = scr(b.x, b.y);
    vg.drawImage(spr.c, sx - spr.ox, sy - spr.oy);
    const [bx, by] = scr(b.x + b.w / 2, b.y + b.d / 2);
    if (b.done && !b.abandoned) {
      if ((b.type === 'house' || b.type === 'shelter') && b.occ > 0) { if (b.type === 'shelter' || b.skin === 0 || season === 3) R.smoke.push({ x: bx, y: by - (b.type === 'shelter' ? 16 : 28), ox: hash2(b.id, 1) * 2, life: 0, ttl: 2.2, id: b.id, k: 0 }); lights.push({ x: bx, y: by - 4, r: 22, a: 0.6, k: 'win' }); }
      if (b.type === 'workshop' && S.alloc.wood + S.alloc.stone + S.alloc.build > 0) { lights.push({ x: bx + 8, y: by - 4, r: 20, a: 0.8, k: 'fire' }); flame(bx + 8, by - 3, 1.2); R.smoke.push({ x: bx + 5, y: by - 30, ox: 0, life: 0, ttl: 2.5, id: b.id, k: 1 }); }
    }
    if (b.type === 'shelter' && b.done) { const [fx, fy] = scr(b.x + b.w / 2, b.y + b.d + 0.3); flame(fx, fy + HH, 1); lights.push({ x: fx, y: fy + HH - 3, r: 26, a: b.abandoned ? 0 : 0.9, k: 'fire' }); }
    if (!b.done) { const [px, py] = scr(b.x + b.w, b.y + b.d); lights.push({ x: bx, y: by, r: 0, a: 0, k: 'none' }); }
  }
  function flame(x, y, s) { const f = Math.floor(R.time * 9 + x) % 3; vg.fillStyle = '#d8501e'; vg.fillRect(x - 1, y - 3 - (f === 1 ? 1 : 0), 3, 3); vg.fillStyle = '#ff9a2e'; vg.fillRect(x, y - 4 - (f === 0 ? 1 : 0), 1, 3); vg.fillStyle = '#ffe080'; vg.fillRect(x, y - 2, 1, 1); vg.fillStyle = '#3a2a20'; vg.fillRect(x - 2, y, 5, 1); }

  // ---------------------------------------------------------------- visual agents (villagers) and animals
  const people = []; for (let i = 0; i < 12; i++) people.push(A.personSprites(i));
  function walkable(S, x, y) { if (x < 0 || y < 0 || x >= N - 1 || y >= N - 1) return false; const t = idx(Math.floor(x), Math.floor(y)); return S.world.ground[t] === G.GRASS; }
  function pickTarget(S, a) {
    const W = S.world, r = Math.random;
    const around = (cx, cy, rad) => { for (let k = 0; k < 14; k++) { const x = cx + (r() - 0.5) * rad * 2, y = cy + (r() - 0.5) * rad * 2; if (walkable(S, x, y)) return [x, y]; } return [cx, cy]; };
    const home = S.buildings.filter(b => b.done && !b.ruined && !b.abandoned && BT[b.type].dwelling);
    switch (a.role) {
      case 'farm': { const f = S.buildings.filter(b => b.type === 'farm' && b.done && !b.ruined && !b.fallow && !b.abandoned); if (f.length) { const b = f[Math.floor(r() * f.length)]; return [b.x + 0.5 + r() * (b.w - 1), b.y + 0.5 + r() * (b.d - 1)]; } break; }
      case 'wood': if (S.cutSite) return around(S.cutSite.x + 0.5, S.cutSite.y + 0.5, 3); break;
      case 'stone': if (S.quarrySite) return around(S.quarrySite.x + 0.5, S.quarrySite.y + 0.5, 2.6); if (S.salvageSite) return around(S.salvageSite.x + 0.5, S.salvageSite.y + 0.5, 2); break;
      case 'build': { const p = S.buildings.filter(b => !b.done && !b.ruined); const l = p.length ? p : S.buildings.filter(b => b.done && !b.ruined && b.cond < 0.9); if (l.length) { const b = l[Math.floor(r() * l.length)]; return [b.x + b.w / 2 + (r() - 0.5) * b.w, b.y + b.d + 0.4]; } break; }
      case 'gather': return around(S.center.x + (r() - 0.5) * 10, S.center.y + (r() - 0.5) * 10, 3);
    }
    if (home.length && r() < 0.6) { const b = home[Math.floor(r() * home.length)]; return [b.x + b.w / 2 + (r() - 0.5) * 2, b.y + b.d + 0.5 + r()]; }
    return around(S.center.x, S.center.y, 4);
  }
  function syncActors(S, now) {
    if (S.civ.status !== 'living') { R.actors.length = 0; } else {
      const want = Math.min(48, Math.round(S.pop * 0.45) + (S.pop > 0 ? 1 : 0));
      while (R.actors.length < want) { const a = { i: R.actors.length + Math.floor(Math.random() * 100), x: 0, y: 0, tx: 0, ty: 0, role: 'idle', wait: Math.random() * 2, ph: Math.random() * 10, hidden: false, flip: false }; const b = S.buildings.find(b => b.done && !b.ruined) || { x: S.center.x, y: S.center.y, w: 1, d: 1 }; a.x = a.tx = b.x + b.w / 2; a.y = a.ty = b.y + b.d + 0.6; R.actors.push(a); }
      while (R.actors.length > want) R.actors.splice(Math.floor(Math.random() * R.actors.length), 1);
    }
    // deer in proportion to the wild game
    const wantD = S.civ.status === 'living' || true ? clamp(Math.round(S.game / Math.max(1, S.gameCap) * 6), 0, 7) : 0;
    while (R.deer.length < wantD) { const W = S.world; let x, y, k = 0; do { x = Math.random() * (N - 2) + 1; y = Math.random() * (N - 2) + 1; k++; } while (k < 40 && !(W.tree[idx(Math.floor(x), Math.floor(y))] > 0 || (W.ground[idx(Math.floor(x), Math.floor(y))] === G.GRASS && Math.hypot(x - S.center.x, y - S.center.y) > 12))); R.deer.push({ deer: true, x, y, tx: x, ty: y, wait: Math.random() * 4, ph: Math.random() * 9 }); }
    while (R.deer.length > wantD) R.deer.pop();
  }
  const lastUpdate = { t: 0 };
  R.update = function (S, dt, simSpeed) {
    const sp = clamp(1 + Math.log2(Math.max(1, simSpeed)) * 0.5, 1, 3), n = R.night, al = S.alloc, tot = Math.max(1, al.farm + al.gather + al.wood + al.stone + al.build + al.maint + al.idle + al.salvage);
    for (let k = 0; k < R.actors.length; k++) {
      const a = R.actors[k]; a.ph += dt;
      if (!a.roleT || a.roleT <= 0) { let r = (k * 0.6180339 % 1) * tot, role = 'idle'; for (const [name, v] of [['farm', al.farm], ['gather', al.gather], ['wood', al.wood], ['stone', al.stone + al.salvage], ['build', al.build + al.maint]]) { if (r < v) { role = name; break; } r -= v; } a.role = role; a.roleT = 8 + Math.random() * 10; }
      a.roleT -= dt;
      if (n > 0.7) { if (!a.home) { const hs = S.buildings.filter(b => b.done && !b.ruined && BT[b.type].dwelling); const b = hs.length ? hs[Math.floor(Math.random() * hs.length)] : null; a.home = b ? [b.x + b.w / 2, b.y + b.d + 0.4] : [S.center.x, S.center.y]; } a.tx = a.home[0]; a.ty = a.home[1]; a.working = false; const d = Math.hypot(a.tx - a.x, a.ty - a.y); if (d < 0.35) a.hidden = true; }
      else { if (a.hidden && n < 0.5) { a.hidden = false; a.home = null; } }
      if (a.hidden) continue;
      const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
      if (d > 0.15) { const st = Math.min(d, 1.15 * sp * dt), nx = a.x + dx / d * st, ny = a.y + dy / d * st; if (walkable(S, nx, ny)) { a.x = nx; a.y = ny; a.moving = true; } else { a.tx = a.x + (Math.random() - 0.5) * 3; a.ty = a.y + (Math.random() - 0.5) * 3; a.moving = false; } a.flip = dx - dy < 0; a.working = false; }
      else { a.moving = false; a.wait -= dt; a.working = a.role !== 'idle' && a.role !== 'gather' || a.role === 'gather'; if (a.wait <= 0 && n <= 0.7) { [a.tx, a.ty] = pickTarget(S, a); a.wait = 1.5 + Math.random() * 4; } }
    }
    for (const e of R.deer) { const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy); if (d > 0.2) { const st = Math.min(d, 0.5 * dt), nx = e.x + dx / d * st, ny = e.y + dy / d * st; if (walkable(S, nx, ny)) { e.x = nx; e.y = ny; e.moving = true; } else e.wait = 0; e.flip = dx - dy < 0; } else { e.moving = false; e.wait -= dt; if (e.wait <= 0) { e.tx = clamp(e.x + (Math.random() - 0.5) * 8, 1, N - 2); e.ty = clamp(e.y + (Math.random() - 0.5) * 8, 1, N - 2); e.wait = 3 + Math.random() * 6; } } e.ph += dt; }
    for (const p of R.smoke) p.life += dt; R.smoke = R.smoke.filter(p => p.life < p.ttl);
    if (R.smoke.length > 300) R.smoke.splice(0, R.smoke.length - 300);
  };
  function drawEntity(e) {
    const [px, py] = scr(e.x, e.y);   // the ground point under the feet
    if (e.deer) { const f = e.moving ? Math.floor(e.ph * 4) & 1 : 0, spr = cached(`de${f}`, () => A.deerSprite(f)); vg.fillStyle = 'rgba(0,0,0,0.18)'; vg.fillRect(px - 5, py - 1, 10, 2); drawFlip(spr, px - 9, py - 13, e.flip); return; }
    const set = people[e.i % 12], f = e.moving ? 1 + (Math.floor(e.ph * 5) & 1) : 0, spr = set[f];
    vg.fillStyle = 'rgba(0,0,0,0.2)'; vg.fillRect(px - 3, py - 1, 6, 2);
    const bob = !e.moving && e.working && (Math.floor(e.ph * 3) & 1) ? 1 : 0;
    drawFlip(spr, px - 4, py - 14 + bob, e.flip);
    if (!e.moving && e.working) { // tool in hand: hoe, axe, pick, hammer
      const dir = e.flip ? -1 : 1, up = Math.floor(e.ph * 3) & 1; vg.fillStyle = '#6a4a2e';
      if (e.role === 'farm') { vg.fillRect(px + dir * 3, py - 11 + (up ? 0 : 2), 1, 8); vg.fillStyle = '#9a9aa0'; vg.fillRect(px + dir * 3 + (dir > 0 ? 0 : -1), py - 4 + (up ? 0 : 2), 2, 1); }
      else if (e.role === 'wood') { vg.fillRect(px + dir * 3, py - 10, 1, up ? 6 : 8); vg.fillStyle = '#b0b0b8'; vg.fillRect(px + dir * 3 + (dir > 0 ? 0 : -2), py - 11 + (up ? 0 : 3), 3, 2); }
      else if (e.role === 'stone') { vg.fillRect(px + dir * 3, py - 10, 1, 7); vg.fillStyle = '#8a8a92'; vg.fillRect(px + dir * 3 - 1, py - 11 + (up ? 0 : 2), 3, 1); }
      else if (e.role === 'build') { vg.fillRect(px + dir * 3, py - 9 + (up ? 0 : 2), 1, 4); vg.fillStyle = '#8a8a92'; vg.fillRect(px + dir * 3 - 1, py - 10 + (up ? 0 : 2), 3, 2); }
    }
  }
  function drawFlip(c, x, y, flip) { if (!flip) { vg.drawImage(c, x, y); return; } vg.save(); vg.translate(x + c.width, y); vg.scale(-1, 1); vg.drawImage(c, 0, 0); vg.restore(); }

  // ---------------------------------------------------------------- smoke, birds, light, grading
  function drawFxAndLight(S, lights, sk, season) {
    for (const p of R.smoke) { const k = p.life / p.ttl, x = Math.round(p.x + p.ox + k * 7 + Math.sin(p.life * 2 + p.id) * 1.5), y = Math.round(p.y - k * 22), s = k < 0.3 ? 2 : k < 0.7 ? 3 : 4; vg.fillStyle = `rgba(${p.k ? 70 : 220},${p.k ? 70 : 215},${p.k ? 74 : 208},${(0.5 * (1 - k)).toFixed(2)})`; vg.fillRect(x, y, s, s); }
    if (R.night < 0.6 && S.month > 2) for (let i = 0; i < 4; i++) { const t = R.time * 0.05 + i * 0.27, bx = ((t % 1) * (R.lw + 80)) - 40, by = R.lh * (0.18 + 0.1 * Math.sin(i * 2.3 + R.time * 0.3)) + Math.sin(R.time * 2 + i) * 3; vg.drawImage(cached(`bi${Math.floor(R.time * 5 + i) & 1}`, () => A.birdSprite(Math.floor(R.time * 5 + i) & 1)), Math.round(bx), Math.round(by)); }
    // time-of-day grade (multiply), a dry tint in a drought, a cool wash in winter
    vg.globalCompositeOperation = 'multiply'; let c = sk; if (S.droughtLeft > 0) c = A.mix(c, 0xe8c88a, 0.25); if (season === 3) c = A.mix(c, 0xdfe8ff, 0.2); vg.fillStyle = '#' + c.toString(16).padStart(6, '0'); vg.fillRect(0, 0, R.lw, R.lh);
    vg.globalCompositeOperation = 'lighter';
    if (R.night > 0.05) for (const l of lights) { if (l.a <= 0 || l.r <= 0) continue; const fl = l.k === 'fire' ? 0.85 + 0.15 * Math.sin(R.time * 9 + l.x) : 1; vg.globalAlpha = clamp(R.night * l.a * fl, 0, 1); vg.drawImage(R.glow, l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); }
    vg.globalAlpha = 1; vg.globalCompositeOperation = 'source-over';
    if (R.hover || R.sel) for (const [t, col] of [[R.hover, 'rgba(255,255,255,0.35)'], [R.sel, 'rgba(255,230,140,0.8)']]) { if (!t) continue; const [sx, sy] = scr(t.x, t.y); vg.strokeStyle = col; vg.lineWidth = 1; vg.beginPath(); vg.moveTo(sx, sy + 0.5); vg.lineTo(sx + HW, sy + HH + 0.5); vg.lineTo(sx, sy + TH + 0.5); vg.lineTo(sx - HW, sy + HH + 0.5); vg.closePath(); vg.stroke(); }
  }
  R.resize();
  return R;
}
