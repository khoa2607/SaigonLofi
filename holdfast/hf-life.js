'use strict';
// ===== Holdfast — community life (milestone 6). No DOM, no canvas: the renderer only reads HS.horses / HS.stalls / HS.reps / HS.graves / HS.ball.
// Every zone of the settlement runs its own repeated loops, each with a beginning (fetch / walk), an action (pose, tool, fx) and an outcome:
// training ground (range, sparring, laps, formation, weapon care), stable (feed, brush, tack, lead, mounted scouts, pack horses), workshop
// (forge -> tools -> market, carpentry: scrap -> planks, wagon repair, scavenger gear), house repairs (damage -> scaffold -> planks -> patch ->
// dismantle), hospital (patients on cots, check-ups, convalescents, supplies, sheets), school (lessons, garden, ball game, stories), farmyard
// (pigs, chickens, eggs, goats' milk), graveyard (visits, flowers, burials, caretaker) and the market (setup, queues, sales, restock, pack-up).
const HORSE_C = [0x8a5a3a, 0xa8683a, 0xb8b4ac, 0x3a3230, 0xd8b878];
Object.assign(SPOT_CAP, { range: 1, clean: 1, feed: 1, hay: 1, tack: 1, groom: 1, forge: 1, saw: 1, wagonfix: 1, gear: 1, wait: 1, exam: 1, mourn: 1, tend: 1, garden: 1, ball: 1, queue: 1, egg: 1, coop: 2, pigfeed: 1, milk: 1, hitch: 1, story: 1, kidstory: 1, watch: 2, toolpile: 3, supplyIn: 3 });
for (const n of ['range', 'clean', 'feed', 'hay', 'tack', 'groom', 'forge', 'saw', 'wagonfix', 'gear', 'wait', 'exam', 'garden', 'egg', 'pigfeed', 'milk', 'hitch', 'queue', 'ball', 'tend', 'story', 'kidstory', 'mourn', 'toolpile', 'supplyIn']) NO_FALLBACK.add(n);
Object.assign(STORE_CAP, { tools: 8, med: 10, medkit: 6 });
Object.assign(HAUL_SP, { tools: 'toolpile', med: 'storage', medkit: 'supplyIn' });

function lfInit() {
  const R = HS.R, S = HF.spots, near = (x, y) => { const k = hfNearPass(x, y, 'in', 4); return k >= 0 ? tileC(k) : [x, y]; };
  if (!HF.stations) { HF.stations = HF.walls.filter(s => !s.gate && s.inT >= 0 && s.id % 9 === 4); }   // alarm stations: every 9th section
  if (!S.wood2) { spot('wood2', ...near(HF.spots.storage[0].x + 14, HF.spots.storage[0].y - 8)); S.wood2[0].nm = 'wood2'; S.wood2[0].zone = ''; }
  if (!S.toolpile) { spot('toolpile', ...near(HF.forge.x + 4, HF.forge.y + 16)); spot('supplyIn', ...near(HF.supply[0], HF.supply[1])); const sc = HF.buildings.find(b => b.kind === 'school'); spot('story', ...near(sc.x + sc.w + 8, sc.y + sc.d + 4)); for (let k = 0; k < 4; k++) spot('kidstory', ...near(sc.x + sc.w + 4 + (k % 2) * 8, sc.y + sc.d + 10 + (k >> 1) * 5));
    const pd = HF.paddock; spot('watch', ...near(pd.x + pd.w / 2, pd.y + pd.d + 6)); const ba = HF.buildings.find(b => b.kind === 'barracks'); spot('watch', ...near(ba.x + ba.w + 10, ba.y + ba.d + 14));
    for (const s of [...S.toolpile, ...S.supplyIn, ...S.story, ...S.kidstory, ...S.watch]) { s.nm = Object.keys(S).find(k => S[k].includes(s)); s.zone = ''; } }
  for (const name of ['range', 'clean', 'feed', 'hay', 'tack', 'groom', 'forge', 'saw', 'wagonfix', 'gear', 'wait', 'exam', 'mourn', 'tend', 'garden', 'ball', 'queue', 'egg', 'pigfeed', 'milk', 'hitch', 'class', 'teach']) for (const s of (S[name] || [])) { s.nm = name; s.zone = ''; }
  HS.store.tools = 1 + Math.floor(R() * 3); HS.store.med = 2 + Math.floor(R() * 3); HS.store.medkit = 2 + Math.floor(R() * 2);
  HS.storeAt.mat2 = [S.wood2[0].x + 2, S.wood2[0].y - 6];
  HS.storeAt.tools = S.toolpile[0] ? [S.toolpile[0].x + 3, S.toolpile[0].y - 3] : null; HS.storeAt.medkit = [HF.supply[0] - 2, HF.supply[1] - 4];
  HS.Ls = { range: 0, shots: 0, laps: 0, form: 0, clean: 0, groom: 0, feedH: 0, tack: 0, muck: 0, lead: 0, rides: 0, ridesChased: 0, survivors: 0, packHorse: 0, unload: 0, forge: 0, saw: 0, wagon: 0, gear: 0, checkups: 0, conv: 0, medCheck: 0, supplies: 0, sheets: 0, lessons: 0, garden: 0, kicks: 0, story: 0, eggs: 0, milk: 0, pigFeed: 0, chickFeed: 0, visits: 0, flowers: 0, tend: 0, burials: 0, setup: 0, sales: 0, restock: 0, packup: 0, damage: 0, scaffolds: 0, patches: 0, houseRepairs: 0, reinforce: 0, carts: 0, stretcher: 0 };
  HS.gear = 1; HS.tackReady = 1 + Math.floor(R() * 2); HS.troughFood = R() < 0.6 ? 0.5 : 0; HS.pigFood = R() < 0.5 ? 0.6 : 0; HS.feedT = -99; HS.eggs = Math.floor(R() * 3); HS.milkT = -99; HS.wagonP = R() * 0.6;
  HS.horses = []; const P = HF.paddock;
  for (let i = 0; i < 5; i++) { const x = P.x + 6 + R() * (P.w - 12), y = P.y + 6 + R() * (P.d - 12); HS.horses.push({ id: i, x, y, px: x, py: y, dir: R() < 0.5 ? 0 : 2, st: 'paddock', t: R() * 5, stride: 0, c: HORSE_C[i], rest: 0, path: null, ph: R() * 10, gx: x, gy: y }); }
  HS.rides = []; HS.squad = null; HS.ball = { x: HF.ball.x, y: HF.ball.y, z: 0, q: 1, fly: 0, holder: null, t: 0, sx: 0, sy: 0, tx: 0, ty: 0, dur: 1, h: 2 };
  HS.stalls = HF.stalls.map(s => ({ k: s.k, x: s.x, y: s.y, stock: 0, open: false }));
  const h = HS.life; if (h > 7.5 && h < 18) for (const s of HS.stalls) { s.open = R() < 0.85; s.stock = s.open ? 1 + Math.floor(R() * 4) : 0; }
  HS.reps = []; HS.graves = HF.graves.map(g => Object.assign({}, g, { flowers: R() < 0.25 ? 200 : 0, fresh: 0 })); HS.stonesSeen = HF.memorial.stones;
  HS.nextL = { dmg: HS.t + rr2(60, 150), ride: HS.t + rr2(30, 90), conv: 0, eggs: 0 };
  lfDamageHouse(null, 'wall', 1); lfDamageHouse(null, 'roof', 0);   // a couple of houses already need work when the viewer arrives
  lfAnimals(); lfRiverInit();
}
function lfAnimals() {
  const R = HS.R, inR = (P) => [P.x + 3 + R() * (P.w - 6), P.y + 3 + R() * (P.d - 6)];
  for (let i = 0; i < 8; i++) hsAddWild(i === 0 ? 'rooster' : 'chicken', ...inR(HF.coopRun), { pen: HF.coopRun, spd: 3 });
  for (let i = 0; i < 3; i++) hsAddWild('goat', ...inR(HF.goatPen), { pen: HF.goatPen, spd: 2.5 });
  for (let i = 0; i < 4; i++) hsAddWild('pig', ...inR(HF.pigPen), { pen: HF.pigPen, spd: 2.2, trough: HF.pigTrough });
}

// ---------------------------------------------------------------- task chains: walk -> act -> outcome -> next leg
const lfLeg = (w, dur, anim, tool, out, o) => Object.assign({ x: w.x, y: w.y, spot: w.spot, dur, anim, tool, out }, o || {});
function lfChain(a, legs, o) { const L0 = legs[0]; return Object.assign({ k: 'life', a, legs, li: 0, x: L0.x, y: L0.y, spot: L0.spot, dur: L0.dur, tool: L0.tool, run: L0.run }, o || {}); }
function lfNextLeg(p, T) {
  T.li++; const N = T.legs[T.li]; if (!N) { p.task = null; return; }
  hsClaim(p, N.spot); T.spot = N.spot; T.x = N.x; T.y = N.y; T.t = 0; T.ph = 'go'; p.act = ''; if (!p.onTower) p.z = 0;
  if (!hsGo(p, N.x, N.y, 'in', N.run, N.spot && Math.hypot(N.spot.x - N.x, N.spot.y - N.y) < 14 ? N.spot : null)) T.ph = 'do';
}
function lfFx(p, k, dt, rate) {
  if (HS.R() > dt * (rate || 1.5)) return;
  const fx = p.dir === 0 ? 5 : p.dir === 2 ? -5 : 0, fy = p.dir === 1 ? 5 : p.dir === 3 ? -5 : 0;
  HS.fx.push({ k, x: p.x + fx * 0.6 + rr2(-1.5, 1.5), y: p.y + fy * 0.6 + rr2(-1.5, 1.5), t: k === 'spark' ? 0.35 : 0.6 });
}
function lfWood(p) { const a = HF.spots.wood[0], b = HF.spots.wood2[0]; return spotXY(Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? 'wood' : 'wood2'); }   // the nearer plank stack
const lfOpen = name => (HF.spots[name] || []).some(s => (HS.spots.get(s) || 0) < (SPOT_CAP[name] || 1));
const lfDay = () => HS.life >= 7 && HS.life < 19.5;

// ---------------------------------------------------------------- the person-side dispatcher (hsPerson -> case 'life')
function lfDo(p, T, dt) {
  if (HS.alarm > 0 && p.role === 'guard' && (T.a === 'range' || T.a === 'laps' || T.a === 'form' || T.a === 'formlead' || T.a === 'stand')) { p.task = null; p.variant = 'sling'; return; }   // the bell: drop everything and go to the wall
  switch (T.a) {
    case 'river': case 'boat': case 'chain': case 'scaffold': case 'patch': case 'lead': case 'unload': case 'pigs': case 'eggs': case 'milk': case 'supply': case 'setup': case 'packup': case 'visit': case 'tools': case 'medcheck': case 'reinforce': case 'muck': case 'feedh': case 'tackup': case 'sheets': {
      const G = T.legs[T.li];
      if (G.tick) { if (!G.tick(p, T, dt, G)) return; }
      else { p.act = G.anim || 'stand'; if (G.tool !== undefined) p.variant = G.tool; if (G.dir != null) p.dir = G.dir; if (G.face) faceTo(p, G.face); if (G.z) p.z = G.z; if (G.fx) lfFx(p, G.fx, dt, G.fxr); if (G.snd && Math.floor((T.t - dt) / 1.4) !== Math.floor(T.t / 1.4)) hsSound(G.snd, p.x, p.y, 0.3); if (T.t < G.dur) return; }
      if (G.out && G.out(p, T, G) === false) { p.task = null; if (!p.onTower) p.z = 0; return; }
      if (G.carry !== undefined) { p.variant = G.carry; p.carry = G.carry || null; }
      return lfNextLeg(p, T);
    }
    case 'range': {     // firing practice: aim at the target, shoot every few seconds (quiet practice rounds, a tracer and a puff at the target)
      const tg = HF.range[T.ri]; faceTo(p, tg); p.variant = 'aim'; p.act = 'look';
      if (T.t > (T.next || (T.next = rr2(1.2, 2.4)))) { T.next = T.t + rr2(1.8, 3.4); HS.Ls.shots++;
        const hit = HS.R() < 0.7, tx = tg.x + (hit ? 0 : rr2(-3, 3)), ty = tg.y + (hit ? 0 : rr2(-2, 2));
        if (HF.era === 'past') HS.fx.push({ k: 'arrow', x0: p.x, y0: p.y, z0: 12, x1: tx, y1: ty, z1: hit ? tg.z : rr2(2, 12), t: 0.3, T: 0.3 }, { k: hit ? 'splinter' : 'dust', x: tx, y: ty, t: 0.35 });
        else if (HF.era === 'future') HS.fx.push({ k: 'bolt', x0: p.x, y0: p.y, z0: 12, x1: tx, y1: ty, z1: hit ? tg.z : rr2(2, 12), t: 0.12, T: 0.12, train: 1 }, { k: hit ? 'spark' : 'dust', x: tx, y: ty, t: 0.35 });
        else HS.fx.push({ k: 'tracer', x0: p.x, y0: p.y, z0: 12, x1: tx, y1: ty, z1: hit ? tg.z : rr2(2, 12), t: 0.12 }, { k: 'flash', x: p.x, y: p.y, z: 13, t: 0.06 }, { k: hit ? 'splinter' : 'dust', x: tx, y: ty, t: 0.35 });
        hsSound('shot', p.x, p.y, 0.22); if (HS.R() < 0.2) hsNoise(p.x, p.y, 90, 'practice'); }
      if (T.t > T.dur) { HS.Ls.range++; p.variant = 'sling'; p.task = null; } return;
    }
    case 'laps': case 'formlead': {   // laps: run the track around the training ground; formlead: walk it at the head of a squad
      const tr = HF.track; if (T.a === 'formlead' && (!HS.squad || HS.squad.lead !== p)) { p.task = null; return; }
      if (T.a === 'formlead' && HS.t > HS.squad.until) { HS.Ls.form++; HS.squad = null; bubble(p, 'star'); p.task = null; return; }
      if (T.a === 'laps' && T.left <= 0) { HS.Ls.laps++; bubble(p, pickR(['dots', 'smile'])); p.task = null; return; }
      if (!p.path) { T.i = (T.i + 1) % tr.length; T.left--; const [x, y] = tr[T.i]; p.path = { direct: 1, gx: x + rr2(-1.5, 1.5), gy: y + rr2(-1.5, 1.5), mask: 'in', run: T.a === 'laps' ? 1 : 0 }; T.ph = 'go'; }
      return;
    }
    case 'form': {      // a squad member: march in a column behind the sergeant (follows the leader's footsteps)
      const Q = HS.squad; if (!Q || Q.lead.task?.a !== 'formlead' || !Q.lead.alive) { p.task = null; return; }
      const tr = Q.lead.trail || []; const q = tr[Math.max(0, tr.length - 1 - T.slot * 4)] || [Q.lead.x, Q.lead.y]; p.variant = 'carry';
      const dx = q[0] - p.x, dy = q[1] - p.y, d = Math.hypot(dx, dy); if (d < 0.4) { p.act = 'stand'; return; }
      const s = Math.min(d, Math.min(12, d * 3 + 4) * dt), nx = p.x + dx / d * s, ny = p.y + dy / d * s;
      if (hfPass(tileOfW(nx, ny), 'in')) { p.x = nx; p.y = ny; p.stride += s; } else if (d > 24) { p.task = null; return; }
      p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); p.act = ''; return;
    }
    case 'ball': {      // the ball game on the school field: the ball (HS.ball) flies between the players; they shuffle and turn to it
      const B = HS.ball; faceTo(p, B); p.act = B.holder === p && B.kick > HS.t ? 'raise' : 'stand';
      if (!p.path && T.t > (T.mv || (T.mv = rr2(2, 5)))) { T.mv = T.t + rr2(2.5, 5); const s = T.spot || p; const x = s.x + rr2(-6, 6), y = s.y + rr2(-5, 5); if (hfPass(tileOfW(x, y), 'in')) p.path = { direct: 1, gx: x, gy: y, mask: 'in', run: 1 }; }
      if (T.t > T.dur) p.task = null; return;
    }
    case 'buy': {       // queue at a stall, move up when the front is free, then trade
      const S = HS.stalls[T.stall], front = HF.spots.shop[T.stall]; if (!S.open) { p.task = null; return; }
      if (T.pos !== 'front') { p.act = 'stand'; faceTo(p, { x: S.x + 6, y: S.y + 3 });
        if ((HS.spots.get(front) || 0) === 0 && T.t > 0.8) { T.pos = 'front'; hsClaim(p, front); T.spot = front; T.x = front.x; T.y = front.y; T.t = 0; T.ph = 'go'; if (!hsGo(p, front.x, front.y, 'in')) T.ph = 'do'; }
        else if (T.t > 50) { bubble(p, 'dots'); p.task = null; } return; }
      p.act = 'talk'; faceTo(p, { x: S.x + 6, y: S.y + 3 }); if (T.t < T.dur) return;
      if (S.stock > 0) { S.stock--; HS.Ls.sales++; bubble(p, 'money'); p.variant = 'bag'; p.carry = 'bag'; p.load = { k: 'home', n: 1 }; } else bubble(p, 'dots');
      p.task = null; return;
    }
    case 'sell': {      // behind the counter: talk to whoever is at the front
      const S = HS.stalls[T.stall]; p.dir = 1; if (!S.open) { p.task = null; return; }
      p.act = (HS.spots.get(HF.spots.shop[T.stall]) || 0) > 0 ? 'talk' : (Math.floor((HS.t + p.ph) / 5) % 3 ? 'stand' : 'look');
      if (T.t > T.dur || S.stock <= 0) p.task = null; return;
    }
    case 'checkup': {   // a resident waits on the hospital bench until a medic calls, then is examined by the tent
      if (!T.called) { p.act = 'sit'; if (T.t > 90) { bubble(p, 'dots'); p.task = null; } return; }
      if (T.stage !== 'exam') { T.stage = 'exam'; const ex = HF.spots.exam[0]; hsClaim(p, ex); T.spot = ex; T.x = ex.x; T.y = ex.y; T.t = 0; T.ph = 'go'; if (!hsGo(p, ex.x, ex.y, 'in')) T.ph = 'do'; return; }
      p.act = 'talk'; if (T.called.alive) faceTo(p, T.called); if (T.t > 9) { HS.Ls.checkups++; HS.store.medkit = Math.max(0, HS.store.medkit - 0.25); bubble(p, pickR(['heart', 'smile'])); p.task = null; } return;
    }
    case 'exam': { const v = T.pat; p.act = 'talk'; if (v && v.alive) faceTo(p, v); if (!v || !v.alive || !v.task || v.task.a !== 'checkup' || T.t > 30) p.task = null; return; }
    case 'conv': { p.act = 'lie'; p.z = 2.4; if (T.t > T.dur) { HS.Ls.conv++; bubble(p, 'smile'); p.z = 0; p.task = null; } return; }
    case 'stand': { p.act = T.anim || 'stand'; if (T.dir != null) p.dir = T.dir; if (T.face) faceTo(p, T.face); if (T.fx) lfFx(p, T.fx, dt, T.fxr); if (T.t > T.dur) { if (T.out) T.out(p, T); p.task = null; } return; }
  }
  p.task = null;
}

// ---------------------------------------------------------------- per-role job pickers (called from hsThink)
function lfTrainJob(p) {          // off-duty and reserve guards keep the training ground busy
  const R = HS.R, r = R();
  if (r < 0.2 && !HS.squad) {
    const mates = HS.people.filter(q => q !== p && q.alive && q.vis && q.role === 'guard' && q.post && !q.onTower && !q.rescue && !q.ride && !q.exp && q.task && ((q.task.k === 'drill' || q.task.k === 'sit') || (q.task.k === 'life' && (q.task.a === 'clean' || q.task.a === 'stand' || q.task.a === 'range' || q.task.a === 'laps'))) && dist(q, p) < 320).slice(0, 4);
    if (mates.length >= 2) { HS.squad = { lead: p, until: HS.t + rr2(50, 85) }; p.trail = [];
      mates.forEach((m, i) => setTask(m, { k: 'life', a: 'form', slot: i + 1, x: m.x, y: m.y, dur: 1e9, tool: 'carry' }));
      const i = lfNearestTrack(p), [x, y] = HF.track[i]; return { k: 'life', a: 'formlead', i, left: 99, x, y, dur: 1e9, tool: 'carry' }; }
  }
  if (r < 0.42 && lfOpen('range')) { const s = spotXY('range'); return { k: 'life', a: 'range', x: s.x, y: s.y, spot: s.spot, ri: s.spot.k, dur: rr2(22, 38), tool: 'aim' }; }
  if (r < 0.62) { const i = lfNearestTrack(p), [x, y] = HF.track[i]; return { k: 'life', a: 'laps', i, left: HF.track.length * (1 + Math.floor(R() * 2)), x, y, run: 1, dur: 1e9 }; }
  if (r < 0.72 && lfOpen('clean')) return { k: 'life', a: 'stand', ...spotXY('clean'), dur: rr2(16, 28), anim: 'sit', tool: 'carry', dir: 3, out: () => { HS.Ls.clean++; } };
  return { k: 'drill', ...spotXY('drill'), dur: rr2(20, 36), anim: 'drill', tool: R() < 0.5 ? 'spear' : 'carry' };
}
function lfNearestTrack(p) { let b = 0, bd = 1e9; HF.track.forEach(([x, y], i) => { const d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; b = i; } }); return b; }
function lfStableJob(p) {         // grooms: bring in hitched horses, feed, brush, tack up, muck out
  const R = HS.R, S = HF.spots;
  const hitched = HS.horses.find(H => (H.st === 'hitched' || H.st === 'loose') && !H.groom); if (hitched) return lfLeadHome(p, hitched);
  if (HS.troughFood < 0.25 && R() < 0.8) return lfChain('feedh', [lfLeg(spotXY('hay'), 2.2, 'kneel', '', null, { carry: 'hay' }), lfLeg(spotXY('feed'), 3, 'kneel', 'hay', () => { HS.troughFood = 1; HS.Ls.feedH++; bubble(p, 'heart'); }, { carry: '' })]);
  const dirty = HS.horses.filter(H => H.st === 'paddock' && !H.groom && (H.clean || 0) < 0.6);
  if (dirty.length && R() < 0.6) { const H = pickR(dirty); H.groom = p; return { k: 'life', a: 'chain', legs: [{ x: H.x + 5, y: H.y + 1, dur: 1e9, tick: (q, T) => lfBrush(q, T, H) }], li: 0, x: H.x + 5, y: H.y + 1, dur: 1e9, tool: 'brush', horse: H }; }
  if (HS.tackReady < 3 && R() < 0.5) return lfChain('tackup', [lfLeg(spotXY('tack'), rr2(7, 11), 'kneel', 'saddle', () => { HS.tackReady++; HS.Ls.tack++; bubble(p, 'star'); })]);
  if (R() < 0.5) return lfChain('muck', [lfLeg(spotXY('hay'), rr2(8, 12), 'hoe', 'fork', () => { HS.Ls.muck++; }, { fx: 'dust', fxr: 0.8 })]);
  return { k: 'life', a: 'stand', ...spotXY('groom', 2), dur: rr2(10, 18), anim: 'look', face: { x: HF.paddock.x + HF.paddock.w / 2, y: HF.paddock.y + HF.paddock.d / 2 } };
}
function lfBrush(p, T, H) {      // walk up to the horse (it waits), brush it for a while
  if (H.st !== 'paddock' || HS.alarm > 0) { H.groom = null; p.task = null; return false; }
  H.hold = HS.t + 1; const d = Math.hypot(H.x + 5 - p.x, H.y + 1 - p.y);
  if (d > 3) { if (!p.path) hsGo(p, H.x + 5, H.y + 1, 'in'); return false; }
  faceTo(p, H); p.variant = 'brush'; p.act = Math.floor((HS.t + p.ph) / 0.5) % 2 ? 'raise' : 'stand'; if (HS.R() < 0.02) HS.fx.push({ k: 'dust', x: H.x, y: H.y, t: 0.3 });
  if (T.t > (T.bd || (T.bd = rr2(10, 16)))) { H.clean = 1; H.groom = null; HS.Ls.groom++; bubble(p, 'heart'); return true; }
  return false;
}
function lfLeadHome(p, H) {      // walk to a horse at the hitching rail and lead it back to the paddock (it follows the groom's footsteps)
  H.groom = p; const pd = HF.paddock, inside = [pd.x + pd.w / 2 + rr2(-6, 6), pd.y + pd.d / 2 + rr2(-6, 6)];
  return lfChain('lead', [
    { x: H.x + 4, y: H.y + 2, dur: 1.5, anim: 'kneel', out: () => { if (H.unload) { H.unload = 0; HS.store.yard = Math.min(STORE_CAP.yard, HS.store.yard + 2); HS.Ls.unload++; bubble(p, 'star'); } H.st = 'led'; H.lead = p; p.trail = [[p.x, p.y]]; } },
    { x: pd.gate[0] - 3, y: pd.gate[1], dur: 0.5, anim: 'stand' },
    { x: inside[0], y: inside[1], dur: 1.5, anim: 'stand', out: () => { H.st = 'paddock'; H.lead = null; H.groom = null; H.rest = 90; H.clean = 0.2; H.gx = H.x; H.gy = H.y; HS.Ls.lead++; } }]);
}
function lfForgeJob(p) {         // smiths: hammer at the anvil (sparks) -> tools pile; carry tools to the market
  const R = HS.R, S = HS.store;
  if (S.tools >= 3 && S.market < STORE_CAP.market - 1 && R() < 0.5) { const h = hwHaulJob(p, ['tools', 'market']); if (h) return h; }
  if (R() < 0.8) return lfChain('chain', [lfLeg(spotXY('forge'), rr2(18, 28), 'hammer', 'hammer', () => { S.tools = Math.min(STORE_CAP.tools, S.tools + 1); HS.Ls.forge++; bubble(p, 'star'); HS.fx.push({ k: 'steam', x: p.x - 3, y: p.y - 2, t: 0.8 }); }, { fx: 'spark', fxr: 2.5, snd: 'hammer', face: HF.forge })]);
  return lfSawJob(p);
}
function lfSawJob(p) { return lfChain('chain', [lfLeg(spotXY('saw'), rr2(12, 18), 'saw', 'saw', () => { const S = HS.store; HS.Ls.saw++; HS.stats.work.salvage++; if (S.yard > 0) { S.yard--; S.mat = Math.min(STORE_CAP.mat, S.mat + 2); bubble(p, 'plank'); } else if (HS.R() < 0.5) { S.mat = Math.min(STORE_CAP.mat, S.mat + 1); bubble(p, 'plank'); } }, { fx: 'sawdust', fxr: 3 })]); }   // salvage -> planks (or logs from the woodpile)
function lfTechJob(p) {          // technicians: the wagon, carpentry, the workbenches, carts between stores
  const R = HS.R, r = R();
  if (r < 0.3 && lfOpen('wagonfix')) return lfChain('chain', [lfLeg(spotXY('wagonfix'), rr2(14, 22), R() < 0.5 ? 'kneel' : 'hammer', 'hammer', () => { HS.wagonP += 0.34; if (HS.wagonP >= 1) { HS.wagonP = 0; HS.Ls.wagon++; bubble(p, 'star'); } }, { snd: 'hammer', fx: 'dust', fxr: 0.6 })]);
  if (r < 0.5 && HS.store.yard > 0 && lfOpen('saw')) return lfSawJob(p);
  if (r < 0.75) { const h = hwHaulJob(p); if (h) return h; }
  return { k: 'work', salvage: R() < 0.5 ? 1 : 0, ...spotXY('bench', 2), dur: rr2(18, 32), tool: 'hammer', anim: R() < 0.5 ? 'hammer' : 'kneel' };
}
function lfGearJob(p) { return lfChain('chain', [lfLeg(spotXY('gear'), rr2(12, 20), 'kneel', 'bag', () => { HS.gear = Math.min(3, HS.gear + 1); HS.Ls.gear++; bubble(p, 'star'); })]); }
// ---- house repairs: damage -> scaffold -> planks (by hand or handcart) -> patching from the platform -> dismantle -> fresh boards
function lfDamageHouse(b, kind, st) {
  if (!b) { const cand = HF.buildings.filter(q => q.kind === 'house' && !HS.reps.some(r => r.b === q)); for (let n = 0; n < 8 && cand.length; n++) { const r = lfDamageHouse(pickR(cand), kind, st); if (r) return r; } return null; }
  if (HS.reps.some(r => r.b === b)) return null;
  const L = HF.lots[b.lot], H = 2.5 + L.floors * 18 + 1, px = clamp(Math.round(L.w * 0.6), 4, L.w - 13), wx = b.x + px + 4.5, wy = b.y + L.d + 5.6;
  if (!hfPass(tileOfW(wx, wy), 'in')) return null;
  const r = { id: (HS.repId = (HS.repId || 0) + 1), b, L, kind: kind || (HS.R() < 0.5 ? 'wall' : 'roof'), st: st || 0, prog: st ? 0.34 : 0, planks: st ? 1 : 0, used: st ? 1 : 0, need: 3, t: HS.t, px, H, wx, wy, crew: null };
  r.zw = r.kind === 'roof' ? H - 4 : 7.5; HS.reps.push(r); HS.Ls.damage++; return r;
}
function lfHouseJob(p) {
  let best = null, bs = -1e9;
  for (const r of HS.reps) { if (r.st >= 3) continue; if (r.crew && r.crew !== p && r.crew.alive && r.crew.task && r.crew.task.rep === r) continue; const sc = -Math.hypot(r.wx - p.x, r.wy - p.y) / 220 + (r.st > 0 ? 0.6 : 0) + HS.R() * 0.4; if (sc > bs) { bs = sc; best = r; } }
  if (!best) return null; const r = best, S = HS.store, site = { x: r.wx, y: r.wy };
  if (r.st === 0) { if (S.mat <= 0) return null; r.crew = p;
    return lfChain('scaffold', [lfLeg(lfWood(p), 2, 'kneel', '', () => { if (S.mat < 1) return false; S.mat--; }, { carry: 'plank' }), lfLeg(site, 9, 'hammer', 'hammer', () => { r.st = 1; HS.Ls.scaffolds++; bubble(p, 'star'); }, { snd: 'hammer', fx: 'dust', fxr: 0.8, dir: 3 })], { rep: r }); }
  if (r.st === 1) { r.crew = p;
    if (r.planks > r.used) return lfChain('patch', [lfLeg(site, 1e9, 'hammer', 'hammer', null, { tick: (q, T) => lfPatch(q, T, r) })], { rep: r });
    if (S.mat <= 0) { r.crew = null; return null; }
    const n = Math.min(S.mat, r.need - r.planks, HS.R() < 0.6 ? 3 : 1), cart = n >= 2;
    return lfChain('patch', [lfLeg(lfWood(p), 2, 'kneel', '', () => { if (S.mat < n) return false; S.mat -= n; if (cart) { p.cart = 3; HS.Ls.carts++; } }, { carry: cart ? '' : 'plank' }),
      lfLeg(site, 2, 'kneel', '', () => { r.planks += n; p.cart = 0; }, { carry: 'hammer', dir: 3 }), lfLeg(site, 1e9, 'hammer', 'hammer', null, { tick: (q, T) => lfPatch(q, T, r) })], { rep: r }); }
  if (r.st === 2) { r.crew = p; return lfChain('scaffold', [lfLeg(site, 6, 'hammer', 'hammer', () => { r.st = 3; r.t = HS.t; HS.Ls.houseRepairs++; bubble(p, 'star'); hsLog('houseFixed', {}); }, { snd: 'hammer', fx: 'dust', dir: 3 })], { rep: r }); }
  return null;
}
function lfPatch(p, T, r) {      // on the platform: one plank every ~6 s; the patch fills in on the house
  p.z = r.zw + 0.8; p.dir = 3; p.act = 'hammer'; p.variant = 'hammer';
  if (Math.floor((T.t - 0.1) / 1.4) !== Math.floor(T.t / 1.4)) { hsSound('hammer', p.x, p.y, 0.3); HS.fx.push({ k: 'dust', x: p.x + rr2(-3, 3), y: p.y - 4, t: 0.35 }); }
  if (T.t > 6) { T.t = 0; r.used++; r.prog = r.used / r.need; HS.Ls.patches++; if (r.used >= r.need) { r.st = 2; p.z = 0; bubble(p, 'star'); return true; } if (r.used >= r.planks) { p.z = 0; return true; } }
  return false;
}
function lfReinforceJob(p) {     // builders top up the sandbags at a weak section (the culvert, pallets, car doors)
  const segs = HF.walls.filter(s => s.weak && s.inT >= 0 && !s.breached && (s.pressure || 0) < 1); if (!segs.length) return null;
  const s = pickR(segs), [x, y] = tileC(s.inT);
  return lfChain('reinforce', [lfLeg(spotXY('storage'), 2, 'kneel', '', null, { carry: 'bag' }), lfLeg({ x, y }, 7, 'kneel', 'bag', () => { s.hp = Math.min(s.max, s.hp + 1); s.reinforced = HS.t; HS.Ls.reinforce++; bubble(p, 'star'); }, { face: s, fx: 'dust', fxr: 0.6 })]);
}
// ---- hospital
function lfMedJob(p) {
  const R = HS.R, S = HS.store;
  const v = HS.people.find(q => q.alive && q.task && q.task.k === 'life' && q.task.a === 'checkup' && !q.task.called && q.task.ph === 'do');
  if (v) { v.task.called = p; return { k: 'life', a: 'exam', pat: v, ...spotXY('medic'), dur: 30 }; }
  const c = HS.people.find(q => q.alive && ((q.task && q.task.a === 'conv') || (q.task && q.task.k === 'bed' && q.inj)) && q.task.ph === 'do' && HS.t - (q.chk || -99) > 35 && !q.chkBy);
  if (c) { c.chkBy = p; return lfChain('medcheck', [lfLeg({ x: c.x + 4, y: c.y + 3 }, 6, 'kneel', '', () => { c.chk = HS.t; c.chkBy = null; c.healT = (c.healT || 0) + 20; HS.Ls.medCheck++; bubble(c, 'heart'); }, { face: c })]); }
  if (S.medkit < 3 && S.med > 0 && R() < 0.7) { const h = hwHaulJob(p, ['med', 'medkit']); if (h) return h; }
  if (R() < 0.12) return lfChain('sheets', [lfLeg(spotXY('supplyIn'), 2, 'kneel', '', null, { carry: 'cloth' }), lfLeg({ x: HF.supply[0] + 18, y: HF.supply[1] - 22 }, rr2(8, 12), 'hang', 'cloth', () => { HS.Ls.sheets++; })]);
  return { k: 'life', a: 'stand', ...spotXY('medic', 2), dur: rr2(12, 22), anim: R() < 0.5 ? 'look' : 'stand' };
}
function lfMinorCheckup(p) { if (HS.R() > 0.035 || HS.life < 8 || HS.life > 18 || HS.weather === 'rain') return null; return { k: 'life', a: 'checkup', ...spotXY('wait'), dur: 60 }; }
// ---- school
function lfTeacherJob(p, h) {
  const R = HS.R;
  if (h > 8 && h < 11.4 && HS.weather !== 'rain') return { k: 'life', a: 'stand', ...spotXY('teach'), dur: 30, anim: 'talk', dir: 1, out: () => { HS.Ls.lessons++; } };
  if (h > 13.5 && h < 15.8 && HS.weather !== 'rain' && lfOpen('garden')) return { k: 'life', a: 'stand', ...spotXY('garden'), dur: rr2(14, 22), anim: 'water', tool: 'bucket', fx: 'water', fxr: 1.4, out: () => { HS.Ls.garden++; } };
  if (h > 15.8 && h < 17.4 && HS.weather !== 'rain' && lfOpen('story')) return { k: 'life', a: 'stand', ...spotXY('story'), dur: rr2(30, 45), anim: 'talk', story: 1, out: () => { HS.Ls.story++; } };   // story time before home
  return null;
}
function lfKidJob(p, h, rain) {
  const R = HS.R;
  if (h > 8 && h < 11.4 && !rain && !(h > 9.9 && h < 10.25)) { if (lfOpen('class')) return { k: 'life', a: 'stand', ...spotXY('class', 0.6), dur: 30, anim: 'sit', dir: 3 }; }
  if (rain) return null;
  const r = R();
  if (h > 13.5 && h < 15.8 && r < 0.3 && lfOpen('garden')) return { k: 'life', a: 'stand', ...spotXY('garden'), dur: rr2(10, 18), anim: 'water', tool: 'bucket', fx: 'water', fxr: 1.2, out: () => { HS.Ls.garden++; } };
  if (r < 0.55 && lfOpen('ball')) return { k: 'life', a: 'ball', ...spotXY('ball'), dur: rr2(35, 70), run: 1 };
  if (r < 0.65 && lfOpen('kidstory') && HS.people.some(q => q.task && q.task.a === 'stand' && q.task.story)) return { k: 'life', a: 'stand', ...spotXY('kidstory'), dur: rr2(20, 35), anim: 'sit', face: HF.spots.story[0] };
  if (r < 0.72) return { k: 'life', a: 'stand', ...spotXY('watch', 2), dur: rr2(10, 20), anim: 'look', face: HF.paddock };
  return null;
}
// ---- farmyard
function lfHerdJob(p) {
  const R = HS.R, S = HS.store;
  if (HS.t - HS.milkT > 260 && HS.life > 6 && HS.life < 19) { HS.milkT = HS.t; return lfChain('milk', [lfLeg(spotXY('milk'), 8, 'kneel', 'bucket', () => { HS.Ls.milk++; p.load = { k: 'kitchen', n: 1 }; }, { carry: 'bucket', face: HF.goatPen })]); }   // the goats are milked a few times a day
  if (HS.pigFood <= 0 && R() < 0.8 && !HS.people.some(q => q !== p && q.task && q.task.a === 'pigs')) return lfChain('pigs', [lfLeg(spotXY('kitchenIn'), 2, 'kneel', '', null, { carry: 'bucket' }), lfLeg(spotXY('pigfeed'), 3.5, 'kneel', 'bucket', () => { HS.pigFood = 1; HS.Ls.pigFeed++; bubble(p, 'heart'); })]);
  if (HS.t - HS.feedT > 110 && R() < 0.7) return lfChain('chain', [lfLeg(spotXY('coop'), 7, 'water', 'bag', () => { HS.Ls.chickFeed++; }, { fx: 'seed', fxr: 3, tick: null, face: HF.coopRun })], { feed: 1 });
  if (HS.eggs >= 2) return lfChain('eggs', [lfLeg(spotXY('egg'), 4, 'kneel', 'basket', () => { const n = HS.eggs; HS.eggs = 0; HS.Ls.eggs += n; p.load = { k: 'kitchen', n: Math.max(1, Math.round(n / 2)) }; bubble(p, 'heart'); }, { carry: 'basket' })]);
  if (HS.t - HS.milkT > 160 && R() < 0.6) return lfChain('milk', [lfLeg(spotXY('milk'), 8, 'kneel', 'bucket', () => { HS.milkT = HS.t; HS.Ls.milk++; p.load = { k: 'kitchen', n: 1 }; }, { carry: 'bucket', face: HF.goatPen })]);
  return { k: 'life', a: 'stand', ...spotXY(R() < 0.5 ? 'coop' : 'pigfeed', 1), dur: rr2(10, 18), anim: R() < 0.5 ? 'look' : 'hoe', tool: R() < 0.5 ? '' : 'fork' };
}
// ---- graveyard: visits with flowers, the caretaker, burials
function lfVisitJob(p, gather) {
  if (!lfOpen('mourn')) return null; const s = spotXY('mourn');
  return lfChain('visit', [lfLeg(s, gather ? rr2(8, 14) : rr2(18, 32), HS.R() < 0.4 ? 'kneel' : 'stand', '', () => { HS.Ls.visits++; let g = null, bd = 1e9; for (const q of HS.graves) { if (!q.used) continue; const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; g = q; } } if (g && HS.R() < 0.6) { g.flowers = 240; HS.Ls.flowers++; bubble(p, 'leaf'); } else bubble(p, 'heart'); }, { dir: 3 })]);
}
function lfTendJob(p) { return lfChain('chain', [lfLeg(spotXY('tend', 3), rr2(12, 20), 'hoe', 'broom', () => { HS.Ls.tend++; }, { fx: 'dust', fxr: 0.5 })]); }
function lfBurial() {             // someone died: a fresh grave, and a few neighbours gather
  const g = HS.graves.find(q => !q.used) || HS.graves.reduce((a, b) => (a.fresh || 0) < (b.fresh || 0) ? a : b);
  g.used = true; g.fresh = HS.t; g.flowers = 400; HS.Ls.burials++;
  const near = HS.people.filter(q => q.alive && q.vis && q.tier > 0 && q.role !== 'guard' && q.role !== 'kid' && !q.exp && !q.ride && !q.rescue && !q.load && !q.inj && q.task && (q.task.k === 'sit' || q.task.k === 'chat' || q.task.k === 'walk' || q.task.k === 'shop' || (q.task.k === 'life' && (q.task.a === 'stand' || q.task.a === 'visit' || q.task.a === 'river')) || (q.task.k === 'work' && q.tier === 2))).sort((a, b) => Math.hypot(a.x - g.x, a.y - g.y) - Math.hypot(b.x - g.x, b.y - g.y)).slice(0, 4);
  for (const q of near) { const t = lfVisitJob(q, 1); if (t) setTask(q, Object.assign(t, { run: 1 })); }
}
// ---- market
function lfTraderJob(p, h) {
  const S = HS.store;
  const k = p.stallK != null ? p.stallK : (p.stallK = HS.people.filter(q => q.role === 'trader').indexOf(p) % 8);
  const st = HS.stalls[k < 0 ? 0 : k], spotS = HF.spots.stall[st.k], pile = spotXY('mkt'), stallW = { x: spotS.x, y: spotS.y, spot: spotS };
  if (h > 18.2 || h < 6.4) { const o = st.open ? st : k < 2 && HS.stalls[k + 6].open ? HS.stalls[k + 6] : null; if (o) { const oW = { x: HF.spots.stall[o.k].x, y: HF.spots.stall[o.k].y, spot: HF.spots.stall[o.k] }; return lfChain('packup', [lfLeg(oW, 4, 'kneel', '', () => { S.market = Math.min(STORE_CAP.market, S.market + o.stock); o.stock = 0; o.open = false; HS.Ls.packup++; }, { carry: 'crate', dir: 1 }), lfLeg(pile, 2, 'kneel', 'crate', null, { carry: '' })]); } return null; }
  // the other stall this trader looks after (8 stalls, 6 traders)
  const other = HS.stalls[(k + 6) % 8]; const tgt = (!st.open || st.stock <= 1) ? st : (k < 2 && (!other.open || other.stock <= 1) && h < 17) ? other : st;
  const tW = { x: HF.spots.stall[tgt.k].x, y: HF.spots.stall[tgt.k].y, spot: HF.spots.stall[tgt.k] };
  if ((!tgt.open || tgt.stock <= 1) && h < 17.3 && (S.market > 0 || S.food > 3 || S.tools > 0)) return lfChain('setup', [
    lfLeg(pile, 2.2, 'kneel', '', () => { const n = Math.min(3, S.market > 0 ? S.market : 2); if (S.market > 0) S.market -= n; else if (S.tools > 0) S.tools--; else S.food -= 2; HS.Tn = n; }, { carry: 'crate' }),
    lfLeg(tW, 3.5, 'kneel', 'crate', () => { const was = tgt.open; tgt.open = true; tgt.stock = Math.min(5, tgt.stock + Math.max(2, HS.Tn)); if (was) HS.Ls.restock++; else HS.Ls.setup++; }, { carry: '', dir: 1 })]);
  if (!st.open) return null;
  return { k: 'life', a: 'sell', stall: st.k, ...stallW, dur: rr2(30, 55) };
}
function lfShopTask(p) {         // a customer: the open stall with the shortest queue
  let best = null, bs = 1e9;
  for (const s of HS.stalls) { if (!s.open || s.stock <= 0) continue; const front = HF.spots.shop[s.k], q = HF.spots.queue.filter(x => x.k === s.k), n = (HS.spots.get(front) || 0) + q.reduce((a, x) => a + (HS.spots.get(x) || 0), 0); if (n >= 3) continue; const sc = n + Math.hypot(front.x - p.x, front.y - p.y) / 300 + HS.R() * 0.5; if (sc < bs) { bs = sc; best = s; } }
  if (!best) return null; const front = HF.spots.shop[best.k];
  if ((HS.spots.get(front) || 0) === 0) return { k: 'life', a: 'buy', stall: best.k, pos: 'front', x: front.x, y: front.y, spot: front, dur: rr2(4, 8) };
  const q = HF.spots.queue.find(x => x.k === best.k && (HS.spots.get(x) || 0) === 0); if (!q) return null;
  return { k: 'life', a: 'buy', stall: best.k, pos: 'queue', x: q.x, y: q.y, spot: q, dur: rr2(4, 8) };
}
// ---- residents (ambient + general adults + elders): the community beyond home and the green
function lfResidentJob(p, rain) {
  const R = HS.R, h = HS.life; if (rain) return null;
  if (p.role === 'elder') { const r = R(); if (h > 8.5 && h < 17 && HS.t - (HS.tendT == null ? -1e9 : HS.tendT) > 150 && lfOpen('tend')) { HS.tendT = HS.t; return lfTendJob(p); }   // the caretaker's daytime round (the graveyard is a long walk now)
  if (r < 0.4 && lfOpen('story') && h > 13 && h < 17.5) return { k: 'life', a: 'stand', ...spotXY('story'), dur: rr2(30, 50), anim: 'talk', story: 1, out: () => { HS.Ls.story++; } }; if (r < 0.4) return lfTendJob(p); if (r < 0.6) { const v = lfVisitJob(p); if (v) return v; } if (r < 0.66 && lfOpen('pray')) { const s = spotXY('pray'); return { k: 'life', a: 'stand', ...s, dur: rr2(20, 35), anim: 'kneel', dir: 3, out: () => { HS.Ls.pray++; } }; } if (r < 0.72) return { k: 'life', a: 'checkup', ...spotXY('wait'), dur: 60 }; }
  const r = R();
  if (r < 0.45 && h > 7.5 && h < 18.3) { const s = lfShopTask(p); if (s) return s; }
  if (r < 0.6) return { k: 'life', a: 'checkup', ...spotXY('wait'), dur: 60 };
  if (r < 0.82) { const v = lfVisitJob(p); if (v) return v; }
  if (r < 0.9) return { k: 'life', a: 'stand', ...spotXY('watch', 2), dur: rr2(12, 22), anim: R() < 0.5 ? 'look' : 'talk', face: R() < 0.5 ? HF.paddock : HF.range[1] };
  return null;
}

// ---------------------------------------------------------------- mounted scouts: tack up -> hitching rail -> out the gate -> look -> gallop back
function lfStartRide() {
  const h = HS.life; if (HS.alarm > 0 || HS.rides.length || h < 7 || h > 17.4 || HS.tackReady <= 0) return null;
  const horses = HS.horses.filter(H => H.st === 'paddock' && H.rest <= 0 && !H.groom).slice(0, Math.min(HS.tackReady, HS.R() < 0.5 ? 2 : 1)); if (!horses.length) return null;
  const pool = HS.people.filter(p => p.alive && p.vis && !p.exp && !p.rescue && !p.ride && !p.inj && !p.load && !p.onTower && (p.role === 'scav' || (p.role === 'guard' && p.post && p.post.k === 'reserve')) && !(p.task && (p.task.k === 'respond' || p.task.k === 'defend' || p.task.a === 'formlead' || p.task.a === 'form')));
  if (pool.length < horses.length) return null;
  const riders = pool.sort(() => HS.R() - 0.5).slice(0, horses.length);
  // a scouting point: a POI or a stretch of the frontier band
  const poi = pickR(HF.pois.filter(q => !q.horde)), [u, v] = w2d(HF.gate.x, HF.gate.y), band = d2w(clamp(u + rr2(-260, 260), 120, 840), wallV(u) - rr2(90, 150));
  const tgt = HS.R() < 0.5 ? [poi.spots[0][0], poi.spots[0][1]] : band;
  const r = { riders, horses, ph: 'ready', t: 0, tgt, chased: false, found: HS.R() < 0.3 && HS.people.filter(q => q.alive).length < HS.target };
  riders.forEach((p, i) => { hsClaim(p, null); p.ride = r; p.task = { k: 'ride', t: 0 }; p.path = null; const H = horses[i]; H.st = 'tohitch'; H.rider = p; H.path = null; const hs = HF.spots.hitch[i % 3]; H.hk = hs; });
  HS.tackReady -= horses.length; HS.rides.push(r); HS.Ls.rides++; hsLog('ride.out', { n: riders.map(hsName).join(', ') }); return r;
}
function lfRide(r, dt) {
  r.t += dt; const alive = r.riders.filter(p => p.alive);
  if (!alive.length) { for (const H of r.horses) { H.st = 'loose'; H.rider = null; } return false; }
  const g = HF.gate, [gix, giy] = tileC(g.inTile);
  for (const p of r.riders) {   // riders shoot at anything close outside
    if (!p.alive || !p.mount) continue; const z = nearestZ(p.x, p.y, 70);
    if (z && p.cool <= 0 && !isInside(p.x, p.y)) { p.cool = rr2(0.9, 1.5); faceTo(p, z); hsShoot(p, z, { x: p.x, y: p.y, z: 22 }, 80, 0.55); bubble(p, 'ex'); }
    if (p.cool > 0) p.cool -= dt;
  }
  const go = (p, x, y, sp, mask) => { if (!p.path) hsGo(p, x, y, mask || 'all', sp > 16); if (!p.path) return true; if (needGate(p)) { if (r.chased) g.force = 1; return false; } return hsStep(p, dt, sp); };
  switch (r.ph) {
    case 'ready': {             // riders and horses meet at the hitching rail
      let ok = true;
      r.horses.forEach((H, i) => { const s = H.hk; if (Math.hypot(H.x - s.x, H.y - s.y) > 2) { ok = false; if (!H.path) hsGo(H, s.x, s.y, 'in'); if (H.path && hsStep(H, dt, 8)) H.path = null; } else { H.path = null; H.st = 'hitched2'; } });
      r.riders.forEach((p, i) => { const s = r.horses[i].hk; if (Math.hypot(p.x - s.x - 3, p.y - s.y - 2) > 2.5) { ok = false; if (go(p, s.x + 3, s.y + 2, p.spd, 'in')) p.path = null; } else { p.path = null; p.act = 'stand'; } });
      if (ok) { r.ph = 'mount'; r.t = 0; for (const p of r.riders) p.act = 'raise'; }
      else if (r.t > 90) { r.riders.forEach((p, i) => { p.ride = null; p.task = null; p.path = null; const H = r.horses[i]; H.st = 'hitched'; H.rider = null; H.path = null; }); HS.tackReady += r.horses.length; return false; }   // could not assemble: called off, the horses wait at the rail
      return true;
    }
    case 'mount': if (r.t > 2.5) { r.riders.forEach((p, i) => { const H = r.horses[i]; p.mount = H; H.st = 'ridden'; H.rider = p; H.x = p.x; H.y = p.y; p.path = null; p.variant = 'pistol'; p.act = ''; }); r.ph = 'out'; r.t = 0; hsSound('gate', g.x, g.y, 0.4); } return true;
    case 'out': { let all = true; r.riders.forEach((p, i) => { if (!p.alive) return; if (!go(p, r.tgt[0] + i * 6, r.tgt[1] + i * 4, 14)) all = false; else p.path = null; }); if (all || r.t > 150) { r.ph = 'look'; r.t = 0; } return true; }
    case 'look': {
      for (const p of r.riders) { p.act = 'look'; p.dir = Math.floor((r.t + p.ph) / 2) % 4; }
      const near = r.riders.some(p => countZ(p.x, p.y, 120) >= 1);
      if (near && !r.chased && r.t > 1) { r.chased = true; HS.Ls.ridesChased++; hsLog('ride.chased', {}, true); for (const p of r.riders) { bubble(p, 'ex'); hsNoise(p.x, p.y, 160, 'ride'); } }
      if (r.chased || r.t > rr2(6, 10)) {
        if (!r.found && HS.R() < 0.35 && !r.med) { r.med = 1; HS.store.med = Math.min(STORE_CAP.med, HS.store.med + 2); }   // supplies found on the way
        if (r.found && !r.survivor) { const L = r.riders[0], sv = hsAddPerson(hsNeededRoles(1)[0], [L.x + 4, L.y + 3]); sv.arriving = true; sv.task = { k: 'arrive', t: 0 }; sv.inj = 1; sv.hp = 2; sv.tier = 1; HS.arrivals.push({ group: [sv], t: 0 }); r.survivor = sv; HS.Ls.survivors++; hsLog('ride.found', {}); bubble(L, 'heart'); }
        r.ph = 'back'; r.t = 0; for (const p of r.riders) p.path = null; }
      return true;
    }
    case 'back': {
      let all = true; const sp = r.chased ? 21 : 15;
      r.riders.forEach((p, i) => { if (!p.alive) return; const inside = isInside(p.x, p.y); const s = r.horses[i].hk;
        if (!inside) { if (!go(p, gix, giy + 4, sp)) all = false; else p.path = null; all = false; }
        else if (Math.hypot(p.x - s.x, p.y - s.y) > 2.5) { if (go(p, s.x, s.y, 10, 'in')) p.path = null; all = false; } });
      if (r.chased && r.riders.some(p => Math.hypot(p.x - g.x, p.y - g.y) < 60)) g.force = 1;
      if (all || r.t > 260) { r.ph = 'dismount'; r.t = 0; }
      return true;
    }
    case 'dismount': if (r.t > 2) { r.riders.forEach((p, i) => { const H = r.horses[i]; p.mount = null; p.ride = null; p.task = null; p.variant = ''; p.z = 0; H.st = isInside(H.x, H.y) ? 'hitched' : 'loose'; H.rider = null; H.rest = 140; H.path = null; H.unload = r.found ? 0 : (HS.R() < 0.4 ? 1 : 0); }); hsLog('ride.back', {}); return false; } return true;
  }
  return false;
}

// ---------------------------------------------------------------- horses (paddock life, being led, ridden, carrying a pack)
function lfHorse(H, dt) {
  H.t += dt; if (H.rest > 0) H.rest -= dt;
  if (H.st !== 'loose') H.lt = 0;
  if (H.st === 'ridden') { const p = H.rider; if (!p || !p.alive) { H.st = 'loose'; H.rider = null; return; } H.x = p.x; H.y = p.y; H.dir = p.dir; H.stride = p.stride; H.run = p.path && p.path.run; return; }
  if (H.st === 'led' || H.st === 'pack') {   // follow the leader's footsteps, a few steps behind
    const L = H.lead; if (!L || !L.alive || (H.st === 'led' && !(L.task && L.task.a === 'lead'))) { H.st = 'loose'; H.lead = null; if (H.groom === L) H.groom = null; return; }   // an interrupted lead: the horse walks back to the rail on its own
    const tr = L.trail || []; const q = tr[Math.max(0, tr.length - 4)] || [L.x, L.y]; const dx = q[0] - H.x, dy = q[1] - H.y, d = Math.hypot(dx, dy);
    if (d > 0.5) { const s = Math.min(d, Math.min(16, 4 + d * 2.5) * dt); H.x += dx / d * s; H.y += dy / d * s; H.stride += s; H.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); }
    if (d > 30) { if (!H.path) hsGo(H, L.x, L.y, 'all'); if (H.path && hsStep(H, dt, 14)) H.path = null; } return;
  }
  if (H.st === 'tohitch' || H.st === 'hitched2') return;    // moved by the ride controller
  if (H.st === 'hitched' || H.st === 'loose') {   // waits at the rail (a loose horse walks back to it)
    if (H.st === 'loose') { H.lt = (H.lt || 0) + dt; const s = HF.spots.hitch[H.id % 3], out = !isInside(H.x, H.y);
      if (out) { const [gx, gy] = tileC(HF.gate.inTile); if (!H.path || H.path.mask !== 'all') hsGo(H, gx, gy + 4, 'all'); if (Math.hypot(H.x - HF.gate.x, H.y - HF.gate.y) < 46) { HF.gate.users++; if (HF.gate.open < 0.75) return; } if (H.path && hsStep(H, dt, 12)) H.path = null; return; }
      if (!H.path) hsGo(H, s.x, s.y, 'in'); if (H.path && hsStep(H, dt, 9)) { H.path = null; H.st = 'hitched'; } }
    else if (HS.R() < dt * 0.3) H.graze = !H.graze; return;
  }
  // paddock: graze, amble, drink and eat at the trough; at night stand in front of the stalls
  const P = HF.paddock, night = HS.life < 5.8 || HS.life > 20.6;
  if (H.hold > HS.t) { H.graze = false; return; }
  if (night && H.id < 4) { const [sx, sy] = HF.stallsH[H.id]; H.gx = sx; H.gy = sy; }
  else if (Math.hypot(H.gx - H.x, H.gy - H.y) < 0.5 && H.t > (H.wait || 0)) {
    H.t = 0; H.wait = rr2(4, 11);
    if (HS.troughFood > 0 && HS.R() < 0.45) { H.gx = HF.trough[0] + rr2(-3, 3); H.gy = HF.trough[1] + rr2(-1, 1); H.eat = 1; } else { H.gx = P.x + 5 + HS.R() * (P.w - 10); H.gy = P.y + 5 + HS.R() * (P.d - 10); H.eat = 0; }
  }
  const dx = H.gx - H.x, dy = H.gy - H.y, d = Math.hypot(dx, dy);
  if (d > 0.5) { const s = Math.min(d, 3.4 * dt), nx = H.x + dx / d * s, ny = H.y + dy / d * s; H.graze = false;
    if (!H.path && hfPass(tileOfW(nx, ny), 'in')) { H.x = nx; H.y = ny; H.stride += s; H.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); }
    else { if (!H.path) hsGo(H, H.gx, H.gy, 'in'); if (!H.path || hsStep(H, dt, 4)) { H.path = null; if (Math.hypot(H.gx - H.x, H.gy - H.y) > 2) { H.gx = H.x; H.gy = H.y; } } } }   // around the stable, never through it
  else { H.graze = !night; if (H.eat && HS.troughFood > 0) HS.troughFood = Math.max(0, HS.troughFood - dt * 0.004); }
}

// ---------------------------------------------------------------- per-tick bookkeeping
function lfTick(dt) {
  const L = HS.Ls, h = HS.life;
  for (const H of HS.horses) { H.px = H.x; H.py = H.y; lfHorse(H, dt); }
  HS.rides = HS.rides.filter(r => lfRide(r, dt));
  if (HS.t > HS.nextL.ride) { HS.nextL.ride = HS.t + rr2(100, 200); lfStartRide(); }
  // footsteps for anyone a horse or a squad follows
  const leaders = new Set(); for (const H of HS.horses) if (H.lead) leaders.add(H.lead); if (HS.squad) leaders.add(HS.squad.lead);
  for (const p of leaders) { const tr = p.trail || (p.trail = []); const q = tr[tr.length - 1]; if (!q || Math.hypot(p.x - q[0], p.y - q[1]) > 1.3) { tr.push([p.x, p.y]); if (tr.length > 60) tr.shift(); } }
  if (HS.squad && (!HS.squad.lead.alive || HS.squad.lead.task?.a !== 'formlead')) HS.squad = null;
  lfBall(dt); lfRiverTick(dt);
  if (HF.era === 'past') pastTick(dt); else if (HF.era === 'future') futTick(dt);
  if (HS.people.some(q => q.task && q.task.feed && q.task.ph === 'do')) HS.feedT = HS.t;   // chickens rush to the feeder
  // eggs accumulate; pigs eat what is in the trough
  if (HS.t > HS.nextL.eggs) { HS.nextL.eggs = HS.t + rr2(45, 80); if (HS.eggs < 6 && h > 6 && h < 19) HS.eggs++; }
  // houses wear out (and suffer after attacks); a few repairs are always somewhere in the settlement
  if (HS.t > HS.nextL.dmg) { HS.nextL.dmg = HS.t + rr2(110, 220); if (HS.reps.filter(r => r.st < 3).length < 3) lfDamageHouse(); }
  if (HS.alarm > 0) { const s = hsHotSeg(); if (s) HS.hotAt = [s.x, s.y]; HS.hadAttack = true; }
  else if (HS.hadAttack) { HS.hadAttack = false; if (HS.hotAt) { const hs = HF.buildings.filter(b => b.kind === 'house' && !HS.reps.some(r => r.b === b)).sort((a, b) => Math.hypot(a.x - HS.hotAt[0], a.y - HS.hotAt[1]) - Math.hypot(b.x - HS.hotAt[0], b.y - HS.hotAt[1])); let n = 1 + Math.floor(HS.R() * 2); for (const b of hs) { if (n <= 0) break; if (lfDamageHouse(b, HS.R() < 0.6 ? 'wall' : 'roof')) { n--; HS.Ls.attackDamage = (HS.Ls.attackDamage || 0) + 1; } } } }   // stray fire and debris near the fighting
  HS.reps = HS.reps.filter(r => !(r.st === 3 && HS.t - r.t > 150));
  for (const r of HS.reps) if (r.crew && (!r.crew.alive || !r.crew.task || r.crew.task.rep !== r)) r.crew = null;
  // convalescents on the hospital cots (daytime)
  if (HS.t > HS.nextL.conv) { HS.nextL.conv = HS.t + rr2(35, 80);
    if (lfDay() && HS.people.filter(q => q.task && q.task.a === 'conv').length < 2 && lfOpen('bed')) { /* milestone 7: a fair pick among the sitters (was: the first lucky one) */ const pool = HS.people.filter(q => q.alive && q.vis && q.tier === 2 && !q.inj && !q.load && !q.exp && !q.ride && q.task && (q.task.k === 'sit' || q.task.k === 'chat')); const q = pool.length && HS.R() < 0.75 ? pool[Math.floor(HS.R() * pool.length)] : null; if (q) setTask(q, { k: 'life', a: 'conv', ...spotXY('bed'), dur: rr2(80, 150) }); } }
  // burials
  if (HF.memorial && HF.memorial.stones > HS.stonesSeen) { HS.stonesSeen = HF.memorial.stones; lfBurial(); }
  for (const g of HS.graves) if (g.flowers > 0) g.flowers -= dt;
  // the market opens and closes with its traders; stalls left open overnight close on their own
  if (h > 20.6 || h < 5.5) for (const s of HS.stalls) if (s.open) { HS.store.market = Math.min(STORE_CAP.market, HS.store.market + s.stock); s.stock = 0; s.open = false; }
}
function lfBall(dt) {
  const B = HS.ball, pl = HS.people.filter(p => p.alive && p.task && p.task.a === 'ball' && p.task.ph === 'do');
  if (pl.length < 2) { B.holder = null; if (B.fly) { B.fly = 0; B.z = 0; } return; }
  if (B.fly) { B.q = Math.min(1, B.q + dt / B.dur); B.x = B.sx + (B.tx - B.sx) * B.q; B.y = B.sy + (B.ty - B.sy) * B.q; B.z = Math.sin(B.q * Math.PI) * B.h; if (B.q >= 1) { B.fly = 0; B.z = 0; B.holder = B.to; B.t = 0; } return; }
  if (!B.holder || !pl.includes(B.holder)) { let b = null, bd = 1e9; for (const p of pl) { const d = Math.hypot(p.x - B.x, p.y - B.y); if (d < bd) { bd = d; b = p; } } B.holder = b; B.t = 0; }
  const H = B.holder; B.x += (H.x + 2 - B.x) * Math.min(1, dt * 6); B.y += (H.y + 1 - B.y) * Math.min(1, dt * 6); B.t += dt;
  if (B.t > (B.wait || (B.wait = rr2(0.8, 2.2)))) { const to = pickR(pl.filter(q => q !== H)); B.sx = B.x; B.sy = B.y; B.tx = to.x + 1.5; B.ty = to.y + 1; const d = Math.hypot(B.tx - B.sx, B.ty - B.sy); B.dur = Math.max(0.3, d / 30); B.h = 2 + d * 0.08; B.q = 0; B.fly = 1; B.to = to; B.wait = 0; H.kick = HS.t + 0.35; HS.Ls.kicks++; }
}
// which part of the settlement a point belongs to (diagnostics: activity distribution)
function lfZoneOf(x, y) {
  const [u, v] = w2d(x, y), k = tileOfW(x, y);
  if (!(HF.walk[k] & W_IN) && !(HF.walk[k] & W_DOCK)) return 'outside';
  if (v < wallV(u) + 16) return 'frontier';
  for (const n of ['training', 'stable', 'workshop', 'infirmary', 'market', 'yard', 'school', 'graveyard', 'church', 'kitchen', 'farmyard', 'barn', 'newcomers']) { const r = HSITES[n]; if (u > r[0] && u < r[1] && v > r[2] && v < r[3]) return n === 'church' ? 'graveyard' : n === 'barn' ? 'farmyard' : n === 'yard' ? 'frontier' : n === 'newcomers' ? 'homes' : n; }
  if (((u - HGREEN[0]) / 104) ** 2 + ((v - HGREEN[1]) / 52) ** 2 < 1) return 'commons';
  if (HF.gk[k] === GK.FIELD || isField(u, v, 0.5)) return 'fields';
  if (HF.walk[k] & W_DOCK || v > 480) return 'river';
  return 'homes';
}

// ---------------------------------------------------------------- milestone 7: river life — bathing, washing, bank fishing, supply boats
// Bank spots are found on walkable tiles inside the settlement that touch open water; each knows which way the water is.
Object.assign(SPOT_CAP, { bathe: 1, wash: 1, bankfish: 1, pray: 1 });
const rr3 = (a, b) => a + HS.R2() * (b - a), pickR3 = a => a[Math.floor(HS.R2() * a.length)];
function lfRiverInit() {
  HS.R2 = mulberry32(((HS.seed0 || 11) * 2654435761) >>> 0 ^ 0x5bd1e995);   // river life + boats draw from their own stream
  const S = HF.spots;
  if (!S.bathe) {
    const edge = [];
    for (let j = 1; j < HN - 1; j++) for (let i = 1; i < HN - 1; i++) {
      const k = tIdx(i, j); if (!(HF.walk[k] & W_IN) || (HF.walk[k] & W_DOCK) || HF.occ[k] || HF.zone[k] === Z_RIVER) continue;
      for (const [a, b] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) if (HF.gk[tIdx(i + a, j + b)] === GK.WATER) { const [u, v] = w2d(i * HT + 4, j * HT + 4); edge.push({ i, j, a, b, u, v }); break; }
    }
    const near = (u0, v0, n, used) => edge.filter(e => !used.has(e)).sort((p, q) => Math.hypot(p.u - u0, p.v - v0) - Math.hypot(q.u - u0, q.v - v0)).slice(0, n);
    const used = new Set(), mk = (name, e) => { used.add(e); const x = e.i * HT + 4 + e.a * 2.5, y = e.j * HT + 4 + e.b * 2.5; spot(name, x, y, { wdx: e.a, wdy: e.b, dir: e.a > 0 ? 0 : e.a < 0 ? 2 : e.b > 0 ? 1 : 3 }); };
    // three bathing / washing places along the bank (south-west by the fields, south by the main dock, south-east), a few quiet fishing spots
    for (const [u, v] of [[300, 505], [600, 510], [850, 420]]) { const c = near(u, v, 8, used).filter((e, n) => n % 2 === 0); c.slice(0, 2).forEach(e => mk('bathe', e)); c.slice(2, 4).forEach(e => mk('wash', e)); }
    for (const [u, v] of [[40, 300], [400, 518], [700, 492], [915, 320]]) near(u, v, 1, used).forEach(e => mk('bankfish', e));
    for (const n of ['bathe', 'wash', 'bankfish', 'pray']) for (const s of (S[n] || [])) { s.nm = n; s.zone = ''; }
  }
  // the boat lane: up the west arm, round the bend just off the settlement bank, out along the east arm (world coordinates)
  if (!HF.boatLane) {
    const P = [], wpt = (u, v) => P.push(d2w(u, v));
    for (let v = 140; v < 300; v += 16) wpt(riverSide(v, -1) + 12, v);
    for (let a = Math.PI; a >= 0; a -= Math.PI / 48) wpt(480 + 445 * 1.04 * Math.cos(a), 300 + 222 * 1.04 * Math.sin(a));
    for (let v = 300; v >= 140; v -= 16) wpt(riverSide(v, 1) - 12, v);
    const s = [0]; for (let i = 1; i < P.length; i++) s.push(s[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    HF.boatLane = { P, s, len: s[s.length - 1] };
    // moorings: the lane point nearest each dock's outer end (the medical boat ties up at the dock nearest the hospital)
    HF.moor = HF.docks.map((d, i) => { const ex = d.x + 3, ey = d.y + d.len; let bi = 0, bd = 1e9; P.forEach((q, n) => { const dd = Math.hypot(q[0] - ex, q[1] - ey); if (dd < bd) { bd = dd; bi = n; } }); let wx = ex, wy = ey + 6, wd = 1e9; for (let j = 0; j < HN; j++) for (let ii = 0; ii < HN; ii++) { const k = tIdx(ii, j); if (HF.gk[k] !== GK.WATER) continue; let ok = true; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = tIdx(ii + a, j + b); if (inMap(ii + a, j + b) && HF.gk[q] !== GK.WATER && !(HF.walk[q] & W_DOCK)) ok = false; } if (!ok) continue; const cx2 = ii * HT + 4, cy2 = j * HT + 4, dd = Math.hypot(cx2 - ex - 6, cy2 - ey - 2); if (dd < wd) { wd = dd; wx = cx2; wy = cy2; } }   // open water right beside the dock end
      return { i, s: s[bi], x: ex, y: ey - 3, dist: bd, bx: wx, by: wy }; });
    const hos = HF.buildings.find(b => b.kind === 'infirmary'); HF.medMoor = HF.moor.slice().sort((p, q) => Math.hypot(p.x - hos.x, p.y - hos.y) - Math.hypot(q.x - hos.x, q.y - hos.y))[0];
    HF.cargoMoor = HF.moor.slice().sort((p, q) => Math.abs(w2d(p.x, p.y)[0] - 480) - Math.abs(w2d(q.x, q.y)[0] - 480))[0];
  }
  HS.boats = []; HS.boatId = 0; HS.nextL.boat = HS.t + rr3(20, 70); HS.nextL.river = HS.t + rr3(5, 20);
  Object.assign(HS.Ls, { bathe: 0, wash: 0, bankfish: 0, boats: 0, medBoats: 0, medDeliver: 0, cargoBoats: 0, cargoDeliver: 0, pray: 0 });
  if (HS.R2() < 0.5) lfBoatLaunch(HS.R2() * 0.8);                                                       // warm start: a boat may already be on the water
}
function lfLanePt(s) { const L = HF.boatLane; s = clamp(s, 0, L.len); let i = 1; while (i < L.s.length - 1 && L.s[i] < s) i++; const a = L.P[i - 1], b = L.P[i], q = (s - L.s[i - 1]) / Math.max(1e-6, L.s[i] - L.s[i - 1]); return [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, b[0] - a[0], b[1] - a[1]]; }
function lfBoatLaunch(prog) {
  const R = HS.R2, r = R(), seq = ['med', 'cargo', 'med', 'fish'], kind = seq[((HS.boatSeq == null ? (HS.boatSeq = Math.floor(r * 4)) : ++HS.boatSeq)) % 4], fwd = R() < 0.5, L = HF.boatLane;   // a rotation: medical supply runs are every other boat, cargo and fishing boats in between
  const b = { id: HS.boatId++, kind, fwd, s: fwd ? 0 : L.len, spd: kind === 'fish' ? rr3(7, 8.5) : rr3(9, 11), st: 'go', t: 0, moor: kind === 'med' ? HF.medMoor : kind === 'cargo' && R() < 0.6 ? HF.cargoMoor : null, x: 0, y: 0, px: 0, py: 0, dir: 0, ph: R() * 10, rower: hfLook('adult', R) };
  if (prog) b.s = fwd ? L.len * prog : L.len * (1 - prog);
  if (b.moor && (fwd ? b.s > b.moor.s : b.s < b.moor.s)) b.moor = null;       // already past its dock
  const p = lfLanePt(b.s); b.x = b.px = p[0]; b.y = b.py = p[1]; b.dir = Math.abs(p[2]) > Math.abs(p[3]) ? (p[2] > 0) === fwd ? 0 : 2 : (p[3] > 0) === fwd ? 1 : 3;
  HS.boats.push(b); HS.Ls.boats++; if (kind === 'med') HS.Ls.medBoats++; if (kind === 'cargo') HS.Ls.cargoBoats++;
  return b;
}
function lfBoat(b, dt) {
  b.px = b.x; b.py = b.y; b.t += dt; const L = HF.boatLane;
  if (b.st === 'go') {
    b.s += (b.fwd ? 1 : -1) * b.spd * dt;
    if (b.moor && (b.fwd ? b.s >= b.moor.s : b.s <= b.moor.s)) { b.s = b.moor.s; b.st = 'moored'; b.t = 0; b.wait = rr3(26, 38); lfBoatCall(b); }
    if (b.s < -5 || b.s > L.len + 5) return false;
  } else if (b.st === 'moored') {
    if (b.t > b.wait && !(b.crew && b.crew.alive && b.crew.task && b.crew.task.boat === b && b.crew.task.li === 0 && b.t < b.wait + 25)) { b.st = 'go'; b.lastMoor = b.moor; b.moor = null; b.leave = 5; }
  }
  const p = lfLanePt(b.s); b.x = p[0]; b.y = p[1];
  if (b.st === 'moored' || b.leave > 0) {   // pull in alongside the dock end, then back out to the lane
    const M2 = b.moor || b.lastMoor, tx = M2.bx, ty = M2.by, q = b.st === 'moored' ? Math.min(1, b.t / 5) : b.leave / 5;
    b.x += (tx - b.x) * q; b.y += (ty - b.y) * q; if (b.st !== 'moored') b.leave = Math.max(0, b.leave - dt);
  }
  if (b.st === 'go') b.dir = Math.abs(p[2]) > Math.abs(p[3]) ? (p[2] > 0) === b.fwd ? 0 : 2 : (p[3] > 0) === b.fwd ? 1 : 3;
  return true;
}
// a moored boat calls someone down to the dock: a medic for the red-cross boat, a trader or worker for cargo
function lfBoatCall(b) {
  const want = b.kind === 'med' ? ['medic'] : ['trader', 'tech', 'adult', 'farmer'], M = b.moor, dock = HF.docks[M.i];
  const free = q => q.alive && q.vis && !q.exp && !q.ride && !q.rescue && !q.load && !q.inj && !q.onTower && (!q.task || ['sit', 'chat', 'walk'].includes(q.task.k) || (q.task.k === 'life' && q.task.a === 'stand')) && !(q.task && q.task.boat);
  const c = HS.people.filter(q => want.includes(q.role) && free(q)).sort((p, q) => Math.hypot(p.x - dock.x, p.y - dock.y) - Math.hypot(q.x - dock.x, q.y - dock.y))[0];
  if (!c || HS.alarm > 0) return;
  b.crew = c; const end = { x: dock.x + 3, y: dock.y + dock.len - 4 };
  const to = b.kind === 'med' ? spotXY('supplyIn') : spotXY(HAUL_SP.yard || 'storage');
  setTask(c, lfChain('boat', [
    lfLeg(end, 3, 'kneel', '', () => { if (b.st !== 'moored') return false; bubble(c, b.kind === 'med' ? 'heart' : 'star'); }, { face: b }),
    lfLeg(to, 2, 'kneel', '', () => { if (b.kind === 'med') { HS.store.med = Math.min(STORE_CAP.med, HS.store.med + 3); HS.Ls.medDeliver++; } else { HS.store.yard = Math.min(STORE_CAP.yard, (HS.store.yard || 0) + 2); HS.Ls.cargoDeliver++; } }, { carry: '' })
  ], { boat: b }));
  c.task.legs[0].carry = 'crate';
}
// residents use the river: bathe in the cool of the morning and evening, wash clothes in the day, fish quietly from the bank
function lfRiverJob(p, rain) {
  const R = HS.R2, h = HS.life, warm = HR_SEASON() !== 'winter'; if (rain || HS.alarm > 0) return null;
  const r = R();
  if (warm && (h < 9.8 || (h > 16 && h < 19.5)) && r < 0.75 && lfOpen('bathe')) { const s = spotXY('bathe'); return lfChain('river', [lfLeg(s, rr3(22, 40), 'bathe', '', () => { HS.Ls.bathe++; bubble(p, pickR3(['smile', 'drop', 'note'])); }, { fx: 'splash', fxr: 0.25, face: { x: s.x + s.spot.wdx * 9, y: s.y + s.spot.wdy * 9 } })]); }
  if (h > 7.5 && h < 17.5 && r < 0.88 && lfOpen('wash')) { const s = spotXY('wash'); return lfChain('river', [lfLeg(s, rr3(20, 34), 'wash', 'cloth', () => { HS.Ls.wash++; }, { fx: 'splash', fxr: 0.35, face: { x: s.x + s.spot.wdx * 9, y: s.y + s.spot.wdy * 9 } })]); }
  if (lfOpen('bankfish')) { const s = spotXY('bankfish'); HS.Ls.bankfish++; return { k: 'work', ...s, dur: rr3(40, 70), tool: 'rod', anim: 'fish', bank: 1, face: { x: s.x + s.spot.wdx * 9, y: s.y + s.spot.wdy * 9 } }; }
  return null;
}
const HR_SEASON = () => HS.season || 'summer';
// laundry day: a household chore that goes via the river — wash at the bank, carry the wet cloth home, hang it on the line
function lfLaundryJob(p, home) {
  if (!lfOpen('wash') || HS.life < 7.5 || HS.life > 17 || HS.weather === 'rain' || HS.R2() > 0.5) return null; const s = spotXY('wash'), hm = home();
  return lfChain('river', [lfLeg(s, rr3(22, 36), 'wash', 'cloth', () => { HS.Ls.wash++; }, { fx: 'splash', fxr: 0.35, face: { x: s.x + s.spot.wdx * 9, y: s.y + s.spot.wdy * 9 } }), lfLeg(hm, rr3(10, 16), 'hang', 'cloth', () => { HS.Ls.laundry = (HS.Ls.laundry || 0) + 1; })]);
}
function lfRiverTick(dt) {
  if (!HF.boatLane) return;
  // the river director: every so often an idle resident (sitting, chatting, playing) goes down to the water instead — never more than 6 at once
  if (HS.t > HS.nextL.river) { HS.nextL.river = HS.t + rr3(16, 30);
    if (HS.alarm <= 0 && HS.weather !== 'rain' && HS.life > 6 && HS.life < 19.5 && HS.people.filter(q => q.task && q.task.a === 'river').length < 6) {
      const pool = HS.people.filter(q => q.alive && q.vis && q.role !== 'guard' && !q.exp && !q.ride && !q.rescue && !q.load && !q.inj && !q.onTower && q.task && q.task.ph === 'do' && q.tier !== 2 && (q.task.k === 'sit' || q.task.k === 'play'));   // ambient residents (the hospital's convalescent pool) are left alone; they wash via their laundry chore
      const q = pool.length ? pool[Math.floor(HS.R2() * pool.length)] : null;
      if (q) { const j = lfRiverJob(q, false); if (j && !(q.role === 'kid' && j.legs && j.legs[0].anim !== 'bathe')) setTask(q, j); } } }
  HS.boats = HS.boats.filter(b => lfBoat(b, dt));
  if (HS.t > HS.nextL.boat) { HS.nextL.boat = HS.t + rr3(50, 110); if (HS.boats.length < 2 && HS.life > 6 && HS.life < 20) lfBoatLaunch(0); }
}
