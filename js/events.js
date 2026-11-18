'use strict';
// ===== Sài Gòn Lofi — night events: Quốc khánh 2/9, Halloween, Giáng sinh =====
// Tết stays in tet.js (G.tet). The three night events live here and share one switch: EV.sel is what the player picked,
// EV.cur is what is on show right now (only at night). Everything is planned once at boot (EV.plan) and only drawn while
// EV.cur matches, so switching never reloads the map: static props are CITY.recs flagged `ev`, animated things are drawn
// every frame from EV.fixed[ev] and a few per-era lists (roof flags, wall flags, roof-edge lights).
const EVN = { qk: 1, hw: 1, xm: 1 };                       // night-only events
const EV = { sel: 'none', cur: null, k: 0, t: 0, fixed: { qk: [], hw: [], xm: [] }, spots: { qk: [], hw: [], xm: [] }, crowd: [], cache: {}, pools: {}, prevTime: null, treeLit: false, visDoors: [], stats: { bursts: 0, refl: 0, snd: 0, led: 0, mural: 0 } };
const evNight = () => G.hour >= 18.7 || G.hour < 5.2;
EV.want = () => EVN[EV.sel] && evNight() ? EV.sel : null;
EV.trafMul = () => EV.cur === 'qk' ? 2 : EV.cur === 'xm' ? 1.3 : 1;
EV.popMul = () => EV.cur === 'qk' ? 2 : EV.cur === 'hw' ? 1.6 : EV.cur === 'xm' ? 1.6 : 1;
const EV_EMS = { qk: ['fw', 'fw', 'heart', 'star', 'flag', 'ex', 'laugh'], hw: ['ghost', 'pumpkin', 'candy', 'laugh', 'heart', 'smile'], xm: ['xtree', 'gift', 'heart', 'star', 'note', 'bell'] };
const EV_MSG = {
  qk: 'Đêm Quốc khánh 2/9: cờ đỏ sao vàng rợp phố, pháo hoa rực trời!',
  hw: 'Đêm Halloween: phố đầy ma, phù thủy và bí ngô dễ thương',
  xm: 'Đêm Giáng sinh: cây thông lớn đã lên đèn, phố lung linh',
  wait: 'Lễ hội chỉ diễn ra vào ban đêm — đang chờ trời tối…', dawn: 'Trời sáng rồi, lễ hội tạm nghỉ — tối nay lại tiếp tục', off: 'Hết lễ, phố trở lại nhịp sống thường ngày'
};

// ---------------------------------------------------------------- switching
function setEvent(k) {
  if (!G.world || G.busy) return;
  if (k === EV.sel && k !== 'none') return;
  if (k === 'tet') { setTet(true); updateUI(); save(); return; }               // setTet clears any night event
  if (k === 'none') { if (G.tet) setTet(false); EV.clear(false); updateUI(); save(); return; }
  if (!EVN[k]) return;
  if (G.tet) setTet(false, true);
  const was = EV.sel; EV.sel = k;
  if (!EVN[was]) EV.prevTime = G.autoTime ? 'auto' : (G.timeKey || 'auto');
  if (!evNight()) { setTime('night'); ticker(EV_MSG.wait, true); }            // night-only: jump the clock to night, the event lights up at dusk
  else if (EV.cur) EV.apply(EV.want());
  updateUI(); save();
}
EV.clear = quiet => {
  if (!EVN[EV.sel]) return;
  EV.sel = 'none'; if (EV.cur) EV.apply(null, quiet);
  if (EV.prevTime && EV.prevTime !== 'night' && !G.autoTime && G.timeKey === 'night') setTime(EV.prevTime);
  EV.prevTime = null;
};
EV.boot = ev => {
  if (ev === 'tet') { G.tet = true; EV.sel = 'tet'; return; }
  if (!EVN[ev]) { EV.sel = G.tet ? 'tet' : 'none'; return; }
  G.tet = false; EV.sel = ev;
  if (!new URLSearchParams(location.search).get('time') && !evNight()) { G.timeKey = 'night'; G.autoTime = false; G.hour = G.hourTarget = TIMES.night; EV.prevTime = 'auto'; }
  EV.cur = EV.want(); EV.treeLit = EV.cur === 'xm'; EV.k = 1;
};
EV.apply = (w, quiet) => {
  const prev = EV.cur; if (w === prev) return;
  snapshot(); EV.cur = w; EV.k = 0; EV.treeLit = w === 'xm';
  G.world.items = buildStatics(G.season, G.era); G.world.vis = null; R.dirty = true; R.xf = 1;
  if (!w) { FW.shells.length = 0; FW.parts.length = 0; FW.smoke.length = 0; FW.bursts.length = 0; FW.flash = 0; EV.witch = null; }
  EV.sync(prev); updateUI();
  if (!quiet) ticker(w ? EV_MSG[w] : EVN[EV.sel] ? EV_MSG.dawn : EV_MSG.off, true);
};
EV.statusText = () => !EVN[EV.sel] ? '' : ' · ' + (EV.cur ? t('ev.' + EV.sel + '.name') : t('ev.wait', { name: t('ev.' + EV.sel + '.name') }));
EV.tick = dt => {
  EV.t += dt;
  const w = EV.want();
  if (w !== EV.cur && G.world && !G.busy && !(R.xf > 0.2)) EV.apply(w);
  EV.k = clamp(EV.k + dt * (EV.cur ? 0.5 : -2), 0, 1);
  if (EV.cur) crowdTick(dt);
  if (EV.cur === 'qk' || FW.parts.length) fwTick(dt);
  if (EV.cur === 'hw') witchTick(dt);
  evAmb(dt);
};
EV.grade = amb => { if (!EV.cur || EV.k <= 0) return amb; const tint = { qk: 0x6a4c7a, hw: 0x5a3a86, xm: 0x4a64a6 }[EV.cur]; return mixc(amb, mixc(amb, tint, 0.55), 0.5 * EV.k); };

// ---------------------------------------------------------------- people: costumes, flags, hats (looks are restored when the event ends)
const EV_CARRY = { flag: 1, pumpkin: 1, lantern: 1, broom: 1, gift: 1, sack: 1 };
function costume(L, c) {
  L.costume = c; L.kq = false; L.pattern = 0; L.tie = 0; L.mask = 0; L.glasses = 0; L.scarf = 0; L.pack = 0; L.apron = 0;
  if (c === 'ghost') { L.hat = 0; L.carry = L.kid ? 'pumpkin' : chance(0.3) ? 'lantern' : null; }
  else if (c === 'witch') { L.dress = 3; L.top = pick([CO.purpleD, CO.black, 0x3a2a5a]); L.hat = 'witch'; L.hs = 1; L.hair = pick([0x2a2028, 0x3a2a24, 0x5a7a3a]); L.sleeve = 'long'; L.carry = chance(0.5) ? 'broom' : L.kid ? 'pumpkin' : null; }
  else if (c === 'vampire') { L.dress = 0; L.top = CO.black; L.bot = CO.black; L.skin = 0xeee6ea; L.hs = 0; L.hair = 0x16141a; L.hat = 0; L.sleeve = 'long'; L.legs = 'long'; }
  else if (c === 'skeleton') { L.dress = 0; L.top = CO.black; L.bot = CO.black; L.shoe = 0x2a2a30; L.skin = 0xf0ece2; L.hs = 7; L.hat = 0; L.sleeve = 'long'; L.legs = 'long'; }
  else if (c === 'pumpkin') { L.dress = 0; L.top = CO.orange; L.bot = 0x2f6a3a; L.hat = 'stem'; L.sleeve = 'long'; L.legs = 'long'; }
  else if (c === 'monster') { L.skin = 0x8ac06a; L.hs = 6; L.hair = 0x2a4a2a; L.hat = 'horns'; L.top = 0x6a3a8a; }
  else if (c === 'cat') { L.top = CO.black; L.bot = CO.black; L.hat = 'ears'; L.hair = 0x16141a; L.dress = L.fem && chance(0.5) ? 1 : 0; }
  else if (c === 'mummy') { L.dress = 0; L.top = 0xe8e0cc; L.bot = 0xe8e0cc; L.skin = 0xe8e0cc; L.hs = 7; L.hat = 0; L.sleeve = 'long'; L.legs = 'long'; L.shoe = 0xb8ab90; }
  else if (c === 'santa') { L.dress = 0; L.top = 0xc8281e; L.bot = 0xc8281e; L.sleeve = 'long'; L.legs = 'long'; L.hat = 'santa'; L.hs = 4; L.hair = 0xe8e8ec; L.carry = 'sack'; L.shoe = 0x2a2226; }
}
EV.dress = (L, ctx) => {
  const e = EV.cur; if (!e || !L || L.evOrig || L.type === 'monk' || L.ganh) return false;
  const o = Object.assign({}, L), kid = L.kid, rider = ctx === 'rider', crowd = ctx === 'crowd', helm = L.hat === 'helm'; let ch = false;
  if (e === 'qk') {
    if (!L.keep && chance(crowd ? 0.5 : rider ? 0.25 : 0.32)) { L.top = 0xd2281e; L.star = 1; if (L.dress === 2 || L.dress === 3) L.dress = 0; L.sleeve = 'short'; ch = true; }
    if (L.carry !== 'melon' && chance(crowd ? 0.45 : rider ? 0.22 : kid ? 0.6 : 0.3)) { L.carry = 'flag'; ch = true; }
    if (!L.hat && !rider && chance(0.12)) { L.hat = 'band'; ch = true; }
    if (!rider && chance(0.16)) { L.paint = 1; ch = true; }
  } else if (e === 'hw') {
    const share = [0.32, 0.45, 0.6, 0.7][G.era] * (kid ? 1.3 : 1) * (crowd ? 1.35 : 1);
    if (rider) { if (!helm && chance(0.18)) { L.hat = pick(['ears', 'horns', 'witch']); ch = true; } }
    else if (!L.keep && chance(share)) { costume(L, wpick([['ghost', kid ? 3 : 1.6], ['witch', L.fem ? 3 : 0.8], ['vampire', L.fem ? 1 : 2.2], ['skeleton', 1.8], ['pumpkin', kid ? 3 : 0.9], ['monster', kid ? 1.6 : 1], ['cat', L.fem ? 2.4 : 0.6], ['mummy', 1]])); ch = true; }
    else if (chance(0.14)) { L.hat = pick(['ears', 'horns', 'witch']); ch = true; }
    if (!rider && L.costume !== 'ghost') { if (kid && chance(0.65)) { L.carry = 'pumpkin'; ch = true; } else if (!kid && chance(0.12)) { L.carry = 'lantern'; ch = true; } }
    if (L.carry === 'lantern' || (L.carry === 'pumpkin' && chance(0.4))) L.glowC = chance(0.75) ? 0xffa040 : 0xb070ff;
  } else if (e === 'xm') {
    if (rider) { if ((L.type === 'shipper' || L.type === 'grabber') && chance(0.45)) { L.hat = 'santa'; ch = true; } else if (!helm && chance(0.25)) { L.hat = 'santa'; ch = true; } else if (!L.keep && chance(0.15)) { L.top = pick([0xc8281e, 0x2f7a46]); ch = true; } }
    else if (!kid && !L.fem && !L.keep && chance(crowd ? 0.06 : 0.035)) { costume(L, 'santa'); ch = true; }
    else {
      if (chance(crowd ? 0.4 : 0.28)) { L.hat = 'santa'; ch = true; } else if ((kid || L.type === 'youth' || L.type === 'fashion' || L.type === 'modern') && chance(0.14)) { L.hat = 'antler'; ch = true; }
      if (!L.keep && chance(0.2)) { L.top = pick([0xc8281e, 0x2f7a46, 0xe8e2d6, 0xc8281e]); L.sleeve = 'long'; if (L.dress === 2) L.dress = 0; ch = true; }
      if (chance(kid ? 0.3 : 0.06)) { L.carry = 'gift'; ch = true; }
    }
  }
  if (!ch) return false;
  L.ev = 1; L.evOrig = o; L.keep = 1; return true;
};
function evRestore(L) { const o = L.evOrig; if (!o) return L; o.poncho = L.poncho; if (!EV_CARRY[L.carry]) o.carry = L.carry; return o; }
function restoreAll() {
  for (const p of SIM.peds) if (p.look.evOrig) { p.look = evRestore(p.look); p.resheet(); }
  for (const a of SIM.actors) if (a.look.evOrig) { a.look = evRestore(a.look); a.sheet = personSheet(a.look); }
  for (const v of SIM.vehs.concat(SIM.boats || [])) for (const r of v.riders) if (r.look.evOrig) { r.look = evRestore(r.look); r.sheet = personSheet(r.look); }
  for (const s of CITY.stands) if (s.driver && s.driver.look.evOrig) s.driver = null;
}
EV.sync = prev => {
  if (prev !== 'boot') { restoreAll(); if (EV.cur) for (const p of SIM.peds) if (p.dog === undefined && EV.dress(p.look, 'ped')) p.resheet(); }
  buildCrowd();
};
EV.onEra = () => { if (EV.cur) buildCrowd(); };
EV.onSeason = () => { if (EV.cur) buildCrowd(); };
// what townsfolk do on an event night (called from makePlan)
function nearSpot(p, list, r) { let best = null, bd = 1e9; for (let i = 0; i < 14; i++) { const s = list[(Math.random() * list.length) | 0]; if (!s || !near(s, 640)) continue; const d = Math.abs(s.x - p.x) + Math.abs(s.y - p.y); if (d < bd && d < (r || 700)) { bd = d; best = s; } } return best; }
EV.outing = p => {
  const e = EV.cur, L = p.look, st = p.steps, sp = EV.spots[e]; let s;
  if (e === 'qk' && chance(0.45) && (s = nearSpot(p, sp))) { st.push(goStep(s.x + rr(-3, 3), s.y + rr(-3, 3)), { t: 'wait', dur: rr(14, 40), dir: s.dir, em: 'fw', ems: EV_EMS.qk }); if (chance(0.2)) ticker(pick(['Cả nhà ra bờ sông xem pháo hoa mừng Quốc khánh', 'Đường phố đông nghịt người, ai cũng cầm cờ đỏ sao vàng'])); st.push(...exitSteps(p)); return true; }
  if (e === 'hw' && (L.kid || L.costume) && chance(0.5)) { for (let i = 0, n = ri(2, 3); i < n; i++) { const d = freeOfDoor(p, 300); if (d) st.push(goStep(d.x, d.y), { t: 'wait', dur: rr(2, 3.5), dir: (d.dir + 2) % 4, em: 'candy' }); } if (!st.length) return false; if (chance(0.25)) ticker(pick(['“Cho kẹo hay bị ghẹo?” — lũ nhóc gõ cửa từng nhà', 'Một bé bí ngô vừa xin được cả túi kẹo'])); st.push(...exitSteps(p)); return true; }
  if (e === 'hw' && chance(0.25) && (s = nearSpot(p, sp))) { st.push(goStep(s.x + rr(-4, 4), s.y + rr(-4, 4)), { t: 'wait', dur: rr(8, 20), dir: s.dir, anim: 1, em: pick(EV_EMS.hw), ems: EV_EMS.hw }); st.push(...exitSteps(p)); return true; }
  if (e === 'xm' && chance(0.38) && (s = nearSpot(p, sp))) { st.push(goStep(s.x + rr(-3, 3), s.y + rr(-3, 3)), { t: 'wait', dur: rr(6, 14), dir: s.dir, pose: chance(0.6) ? 6 : 0, em: 'xtree', ems: EV_EMS.xm }); if (chance(0.2)) ticker(pick(['Ai cũng dừng lại chụp hình cây thông Noel khổng lồ', 'Ông già Noel đang phát kẹo cho các em nhỏ'])); st.push(...exitSteps(p)); return true; }
  return false;
};
// standing crowds (fireworks watchers, costume parties, carol singers): pseudo-pedestrians drawn by main.js like walkers
function crowdPool(e) {
  const key = e + G.era + G.season; if (EV.pools[key]) return EV.pools[key];
  const pool = [];
  for (let i = 0; i < 40; i++) { const L = dressFor(randLook(), G.season); if (L.ganh || L.type === 'monk') { i--; continue; } EV.dress(L, 'crowd'); if (e === 'xm' && !L.carry && chance(0.4)) L.carry = 'phone'; pool.push({ look: L, sheet: personSheet(L) }); }
  for (const k in EV.pools) if (k.slice(0, 2) === e) delete EV.pools[k];
  return (EV.pools[key] = pool);
}
function buildCrowd() {
  EV.crowd = []; const e = EV.cur; if (!e) return;
  const pool = crowdPool(e);
  for (const s of EV.spots[e]) { const q = pool[(Math.random() * pool.length) | 0]; EV.crowd.push({ x: s.x, y: s.y, dir: s.dir, rest: s.pose || 0, pose: s.pose || 0, sit: false, moving: false, an: 0, alpha: 0, fadeT: rr(0, 2.5), umb: 0, look: q.look, sheet: q.sheet, bub: null, evT: rr(3, 18), cheer: 0, leave: chance(0.55), talk: !!s.talk, sing: !!s.sing, ph: rr(0, 9), crowd: 1 }); }
}
function crowdTick(dt) {
  const wet = G.rain > 0.3, ems = EV_EMS[EV.cur];
  for (const a of EV.crowd) {
    if (a.fadeT > 0) { a.fadeT -= dt; continue; }
    a.alpha = clamp(a.alpha + (wet && a.leave ? -dt : dt) * 1.2, 0, 1);
    a.umb += clamp((wet && !a.leave ? 1 : 0) - a.umb, -dt * 3, dt * 3);
    if (a.bub) { a.bub.t -= dt; a.bub.a += dt; if (a.bub.t <= 0) a.bub = null; }
    if (a.cheer > 0) { a.cheer -= dt; a.pose = a.cheer > 0 ? 6 : a.rest; }
    else if (a.talk || a.sing) a.pose = ((EV.t * (a.sing ? 1.6 : 0.8) + a.ph) | 0) % 2 ? 7 : 0;
    a.evT -= dt; if (a.evT <= 0) { a.evT = rr(6, 22); if (a.alpha > 0.9 && G.onScreen(a.x, a.y, 0)) a.bub = { k: a.sing ? 'note' : pick(ems), t: 2.2, a: 0 }; }
  }
}
EV.cheer = (str, sx, sy) => { for (const a of EV.crowd) if (a.alpha > 0.9 && a.cheer <= 0 && chance(str * 0.45) && G.onScreen(a.x, a.y, 0)) { a.cheer = rr(0.5, 1.5); if (!a.bub && chance(0.18)) a.bub = { k: pick(['heart', 'ex', 'star', 'laugh', 'fw']), t: 1.8, a: 0 }; } };
EV.pushDyn = (dyn, shadow) => {
  if (!EV.cur) return;
  for (const a of EV.crowd) if (a.alpha > 0.02 && G.onScreen(a.x, a.y, 24)) { if (a.alpha > 0.5) shadow(a.x, a.y); dyn.push({ key: a.x + a.y, ped: a }); }
  if (EV.cur === 'qk') for (const b of SIM.boats) if (G.onScreen(b.x, b.y, 60)) { const f = b._evf || (b._evf = { k: 'flag', z: 7, ph: 13, size: 's', ax: 'y', phs: Math.random() }); f.x = b.x - 2; f.y = b.y - b.dir * b.len * 0.35; dyn.push({ key: b.x + b.y + 1, ev: f }); }
};
EV.pedGlow = (lg, p, x, y) => { const a = (p.alpha === undefined ? 1 : p.alpha) * (0.55 + Math.sin(G.t * 9 + x) * 0.08); if (a < 0.1) return; lg.globalAlpha = a; lg.drawImage(tglow(p.look.glowC, 0), x + PW / 2 - 4, y + 9, 18, 18); lg.globalAlpha = 1; };

// ---------------------------------------------------------------- props (CITY.recs flagged ev)
const shiftB = (B, dx, dy, dz) => B.map(b => Object.assign({}, b, { x: b.x + dx, y: b.y + dy, z: b.z + (dz || 0) }));
PROP.jackO = (sn, v) => {
  const s = [5.2, 4.2, 3.4][v % 3], h = s * 0.78;
  return [box(-s / 2, -s / 2, 0, s, s, h, 0xf08a24, (f, u, vv) => {
    if (f === 1) { const cu = u / s, cv = vv / h, eye = cv > 0.5 && cv < 0.8 && ((cu > 0.16 && cu < 0.38) || (cu > 0.62 && cu < 0.84)), mouth = cv > 0.16 && cv < 0.38 && cu > 0.18 && cu < 0.82 && !(cv > 0.29 && ((cu * 9) | 0) % 3 === 0); if (eye || mouth) { EM = 0xff9a30; return 0xffd060; } }
    return ((u * 1.3) | 0) % 2 ? 0xd06c18 : undefined;
  }, { ns: 1 }), box(-0.4, -0.4, h, 0.8, 0.8, 1.3, 0x4a6a2a)];
};
PROP.pumpkinPile = (sn, v) => [box(-6, -2.6, 0, 12, 5.2, 4.2, 0xd8b050, (f, u, vv) => ((vv * 2) | 0) % 3 === 0 || (f === 0 && (u | 0) % 3 === 0) ? 0xb8903a : undefined), ...shiftB(PROP.jackO(sn, 0), -3, 0, 4.2), ...shiftB(PROP.jackO(sn, 1), 2.6, 0.4, 4.2), ...shiftB(PROP.jackO(sn, 2), 8.4, 1, 0), ...shiftB(PROP.jackO(sn, 1), -8.6, 0.6, 0)];
PROP.ghostBig = () => {
  const W = 0xf4f4f8, eyes = (f, u, vv) => { if (f === 1 && vv > 1.2 && vv < 3.6 && ((u > 1.6 && u < 3) || (u > 5 && u < 6.4))) return 0x2a2430; if (f === 1 && vv < 1 && u > 3.4 && u < 4.6) return 0x2a2430; EM = 0x504860; return undefined; };
  return [box(-5.5, -5.5, 0, 11, 11, 4, W, (f, u, vv) => { EM = 0x504860; return f !== 0 && (u | 0) % 3 === 0 && vv < 1 ? -1 : undefined; }), box(-5, -5, 4, 10, 10, 9, W, () => { EM = 0x504860; return undefined; }), box(-4, -4, 13, 8, 8, 5, W, eyes), box(-2.6, -2.6, 18, 5.2, 5.2, 2.2, W), box(-7.4, -1, 8, 2.4, 2, 2, W), box(5, -1, 9.5, 2.4, 2, 2, W)];
};
PROP.hwLanterns = () => { const B = [box(-0.5, -0.5, 0, 1, 1, 24, 0x3a2a30), box(-6, -0.4, 22.6, 12, 0.8, 0.8, 0x3a2a30)]; [0xf08a24, 0x8a4ab8, 0x6ab04a].forEach((c, i) => { const x = -5 + i * 5; B.push(box(x - 1.3, -1.3, 16, 2.6, 2.6, 4.6, c, (f, u, v) => v < 0.8 || v > 3.8 ? 0x2a2430 : undefined, { em: c === 0x8a4ab8 ? 0xb070ff : c === 0x6ab04a ? 0x8aff6a : 0xffa040, nf: 1 }), box(x - 0.2, -0.2, 20.6, 0.4, 0.4, 2, 0x3a2a30)); }); return B; };
PROP.wreath = () => [box(-3.4, -0.3, 13, 6.8, 0.6, 6.8, 0x2f7a40, (f, u, v) => { if (f !== 1) return undefined; const d = Math.hypot(u - 3.4, v - 3.4); if (d > 3.4 || d < 1.6) return -1; if (v < 1.6 && Math.abs(u - 3.4) < 1.4) return 0xd2281e; return hash2(u * 5, v * 5) < 0.2 ? 0xd2281e : hash2(u * 3 + 1, v * 3) < 0.15 ? 0xf2c94c : undefined; }, { nf: 1, ns: 1 })];
PROP.gifts = (sn, v) => { const C = [[0xd2281e, 0xf2c94c], [0x2f7a46, 0xf4f1e8], [0x3d6fd8, 0xf2c94c], [0xf4f1e8, 0xd2281e], [0xc94f9a, 0xf4f1e8]], B = []; [[-3.6, -1, 4.2, 3.6], [1.2, -2, 3.4, 3], [-1, 2, 3, 2.4], [3.4, 1.6, 2.6, 2.2]].forEach((g, i) => { const [c, rb] = C[(i + v) % 5], s = g[2]; B.push(box(g[0], g[1], 0, s, s, g[3], c, (f, u, vv) => Math.abs(u - s / 2) < 0.45 || (f === 0 && Math.abs(vv - s / 2) < 0.45) ? rb : undefined, { ns: 1 })); }); return B; };
PROP.poin = () => [box(-2.4, -2.4, 0, 4.8, 4.8, 3.6, 0xc4583a, (f, u, vv) => f !== 0 && (vv | 0) === 1 ? 0xf2c94c : undefined), box(-3.6, -3.6, 3.6, 7.2, 7.2, 3.6, 0xd2281e, (f, u, vv, b, wx, wy) => { const h = hash2(u * 7 + wx, vv * 7 + wy); return h < 0.18 ? 0x2f6a38 : h > 0.9 ? 0xf2d24a : h > 0.6 ? 0xb81e18 : undefined; }, { ns: 1 })];
PROP.grotto = () => {
  const rock = (f, u, v, b, wx, wy) => { const n = vnoise(u / 2 + wx, v / 2 + wy); return n > 0.6 ? 0x7a6a5a : n < 0.3 ? 0x5a4c42 : undefined; };
  return [box(-10, -6, 0, 20, 12, 3, 0x6a5a4a, rock), box(-9, -6, 3, 4, 10, 10, 0x6a5a4a, rock), box(5, -6, 3, 4, 10, 11, 0x6a5a4a, rock), box(-9, -6, 13, 18, 10, 4, 0x6a5a4a, rock), box(-5, -6, 3, 10, 9.6, 10, 0x3a2a20, (f, u, v) => { EM = 0x8a5a20; return f === 1 && v < 1.2 ? 0xd8b050 : undefined; }),
    box(-3.6, 3.2, 3, 1.6, 1.6, 4.6, 0x3d6fd8, null, { em: 0x202850 }), box(1.8, 3.2, 3, 1.6, 1.6, 5, 0x8a5a32, null, { em: 0x302010 }), box(-1, 3, 3, 2.4, 1.6, 1.2, 0xd8b050, null, { em: 0x605020 }), box(-0.6, 3.2, 4.2, 1.4, 1.2, 0.8, 0xf4e8d0, null, { em: 0x806040 }),
    box(-0.4, -1, 17, 0.8, 0.8, 7, 0x8a6a3a), box(-1.6, -0.6, 23, 3.2, 0.8, 3.2, 0xffe04a, (f, u, v) => f === 1 && Math.abs(u - 1.6) + Math.abs(v - 1.6) > 2 ? -1 : undefined, { em: 0xffe070 })];
};
PROP.reindeer = (sn, v) => { const c = 0xeef6ff, E = { em: 0xcfe8ff }; return [box(-5, -1, 6, 10, 2, 4, c, null, E), ...[[-4.4, -0.8], [3.2, -0.8], [-4.4, 0.6], [3.2, 0.6]].map(([x, y]) => box(x, y, 0, 0.6, 0.6, 6, c, null, E)), box(4.4, -0.6, 9, 1.2, 1.2, 5, c, null, E), box(4.2, -1, 13.6, 3, 2, 2, c, null, E), box(4.6, -0.2, 15.6, 0.4, 0.4, 3, c, null, E), box(5.6, -0.2, 16.4, 1.6, 0.4, 0.4, c, null, E), box(4, -0.2, 17.6, 1.6, 0.4, 0.4, c, null, E), box(6.6, -0.4, 14, 0.8, 0.8, 0.8, 0xff4a3a, null, { em: 0xff5040 })]; };
PROP.starBed = (sn, v) => { const poly = starPoly(9, 9, 8.4); return [box(-9, -9, 0, 18, 18, 1.4, 0x3f8a3e, (f, u, vv) => { if (f !== 0) return 0x7a5a3a; if (inPoly(poly, u, vv)) return hash2(u * 5, vv * 5) < 0.3 ? 0xffe680 : 0xf2c430; return hash2(u * 4, vv * 4) < 0.35 ? 0xe8402e : 0xc8281e; }, { ns: 1 })]; };
PROP.bnQK = bannerPole('QUOC KHANH 2-9'); PROP.bnDL = bannerPole('DOC LAP TU DO'); PROP.bnM29 = bannerPole('MUNG 2-9', 40); PROP.bnVN = bannerPole('VIET NAM', 40); PROP.bnHP = bannerPole('HANH PHUC', 42);

// ---------------------------------------------------------------- sprites drawn per frame
const _tglow = {};
function tglow(c, sq) { const k = c + '|' + (sq ? 1 : 0); return _tglow[k] || (_tglow[k] = glow(sq ? 60 : 44, c >> 16 & 255, c >> 8 & 255, c & 255, sq ? 90 : 150, sq)); }
// big painted Christmas tree with three twinkle frames (lights are emissive in the light pass)
const _xts = {};
function xmasTreeSprite(size, fr, era) {
  const key = size + fr + '|' + era; if (_xts[key]) return _xts[key];
  const Ht = size === 'L' ? 104 : 56, Wd = Ht * 0.62, LW = Math.ceil(Wd + 14), LH = Ht + 18, W = LW * K, H = LH * K, cx = W / 2, base = H - 7 * K, R = mulberry32(size === 'L' ? 77 : 78);
  const g = new Int32Array(W * H).fill(-1), em = new Int32Array(W * H), set = (x, y, c, e) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) { g[y * W + x] = c; em[y * W + x] = e || 0; } }, get = (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < W && y < H ? g[y * W + x] : -1; };
  const apex = base - (Ht - 5) * K, bot = base - 8 * K, tiers = size === 'L' ? 6 : 4, G1 = [0x6ab866, 0x46944e, 0x2f7640, 0x205834];
  for (let y = base - 9 * K; y < base - 1; y++) for (let x = cx - 2.4 * K; x < cx + 2.4 * K; x++) set(x, y, x > cx + K ? 0x4a3028 : 0x6e4c3c);
  for (let i = 0; i < tiers; i++) {
    const ya = apex + (bot - apex) * (i / tiers) * 0.92, yb = apex + (bot - apex) * ((i + 1) / tiers), wTop = (Wd / 2 * K) * (i / tiers) * 0.55, wBot = (Wd / 2 * K) * ((i + 1) / tiers);
    for (let y = Math.floor(ya); y <= yb + 2 * K; y++) {
      const tt = clamp((y - ya) / (yb - ya), 0, 1), hw = wTop + (wBot - wTop) * tt;
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const dx = (x - cx) / Math.max(1, hw); if (y > yb + Math.sin(x * 0.45) * K * 1.2 + K) continue; const l = -dx * 0.8 - tt * 0.5 + (hash2(x >> 1, y >> 1) - 0.5) * 0.5; set(x, y, l > 0.35 ? G1[0] : l > -0.2 ? G1[1] : l > -0.75 ? G1[2] : G1[3]); }
    }
    const gy = ya + (yb - ya) * 0.62, ghw = wTop + (wBot - wTop) * 0.62;            // gold tinsel garland
    for (let x = Math.floor(cx - ghw); x <= cx + ghw; x++) { const u = (x - cx) / ghw, y = gy + (1 - u * u) * K * 2.4 - u * K * 1.5; if (get(x, y) >= 0) { set(x, y, (x & 3) === 0 ? 0xfff0a0 : 0xf2c94c, 0x806020); set(x, y + 1, 0xc89a30); } }
  }
  const inside = (x, y) => get(x, y) >= 0 && G1.includes(get(x, y));
  for (let i = 0; i < (size === 'L' ? 46 : 20); i++) { const y = sr(R, apex + 6 * K, bot), x = cx + sr(R, -1, 1) * (Wd / 2 * K) * ((y - apex) / (bot - apex)) * 0.85, c = sp(R, [0xd2281e, 0xf2c94c, 0x3d6fd8, 0xdfe6ef, 0xd2281e]); if (!inside(x, y)) continue; set(x, y, c); set(x + 1, y, c); set(x, y + 1, mixc(c, 0x2b1a16, 0.3)); set(x + 1, y + 1, mixc(c, 0x2b1a16, 0.3)); set(x, y, mixc(c, 0xffffff, 0.5)); }
  const LP = era >= 3 ? [0xe8f4ff, 0x8ad8ff, 0xffd86a, 0xffffff] : [0xff5a3a, 0x5aff6a, 0xffd24a, 0x5aa8ff, 0xffe8c0];
  for (let i = 0; i < (size === 'L' ? 110 : 44); i++) { const y = sr(R, apex + 4 * K, bot), x = cx + sr(R, -1, 1) * (Wd / 2 * K) * ((y - apex) / (bot - apex)) * 0.92; if (!inside(x, y)) continue; const c = LP[i % LP.length], on = i % 3 !== fr, cc = on ? c : mixc(c, 0x1c4e30, 0.6), ee = on ? c : 0; set(x, y, cc, ee); set(x + 1, y, cc, ee); set(x, y + 1, cc, ee); set(x + 1, y + 1, on ? mixc(c, 0xffffff, 0.4) : cc, ee); }
  const sp2 = starPoly(cx, apex - 1.5 * K, 5.2 * K);                                     // star topper
  for (let y = Math.floor(apex - 8 * K); y < apex + 4 * K; y++) for (let x = Math.floor(cx - 6 * K); x < cx + 6 * K; x++) if (inPoly(sp2, x + 0.5, y + 0.5)) set(x, y, x > cx + K ? 0xf2b830 : 0xffe680, 0xffe070);
  for (let y = base - 4 * K; y < base; y++) for (let x = cx - Wd * 0.42 * K; x < cx + Wd * 0.42 * K; x++) set(x, y, (y - base) === -4 * K ? 0xf2c94c : x > cx + Wd * 0.2 * K ? 0x9a1c16 : 0xc8281e);   // tree skirt
  [[-0.36, 0xd2281e, 0xf2c94c, 6], [-0.18, 0x3d6fd8, 0xf4f1e8, 5], [0.22, 0x2f7a46, 0xf2c94c, 5.5], [0.36, 0xf4f1e8, 0xd2281e, 4.5]].forEach(([fx, c, rb, s]) => { const x0 = cx + fx * Wd * K, sz = s * K; for (let y = base - sz; y < base; y++) for (let x = x0 - sz / 2; x < x0 + sz / 2; x++) set(x, y, Math.abs(x - x0) < K * 0.6 || Math.abs(y - (base - sz / 2)) < K * 0.6 ? rb : x > x0 + sz * 0.2 ? mixc(c, 0x2b1a16, 0.25) : c); });
  const s = gridCanvas(inkGrid(g, W, H, 0.8), W, H, em, K); s.ax = LW / 2; s.ay = base / K; s.apex = (apex - 1.5 * K) / K;
  return (_xts[key] = s);
}
const _star = {};
function starSprite(sz, c) {
  const k = sz + '|' + c; if (_star[k]) return _star[k];
  const r = sz * K, W = Math.ceil(r * 2 + 4), H = W, poly = starPoly(W / 2, H / 2 + 0.5, r), g = new Int32Array(W * H).fill(-1), em = new Int32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inPoly(poly, x + 0.5, y + 0.5)) { const d = Math.hypot(x - W / 2, y - H / 2) / r, cc = d < 0.35 ? mixc(c, 0xffffff, 0.6) : c; g[y * W + x] = cc; em[y * W + x] = cc; }
  const s = gridCanvas(inkGrid(g, W, H, 0.6), W, H, em, K); return (_star[k] = s);
}

// ---------------------------------------------------------------- light strings (Christmas bulbs, Halloween lights): bulbs drawn per frame
const BPAL = {}; (function () {
  const P = { xm0: [0xff5a3a, 0x5aff6a, 0xffd24a, 0x5aa8ff, 0xffe8c0], xm1: [0xff4a3a, 0x4aff7a, 0xffd24a, 0x4a9aff, 0xff7ad8], xm2: [0xfff0d0, 0xff4a5a, 0x6aff8a, 0xffd86a, 0x6ac8ff], xm3: [0xe8f4ff, 0x8ad8ff, 0xffd86a, 0xff5a7a, 0x7aff9a], warm: [0xfff0c8, 0xffe0a0, 0xfff6e0], hw: [0xff8a1a, 0xb070ff, 0x8aff5a, 0xff8a1a] };
  for (const k in P) BPAL[k] = { c: P[k], css: P[k].map(css), dim: P[k].map(c => css(mixc(c, 0x2a2430, 0.7))) };
})();
function mkBulbs(A, B, o) {
  const pts = [], dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], len = Math.hypot(dx, dy, dz), n = Math.max(2, Math.round(len / (o.gap || 3)));
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(A[0] + dx * t, A[1] + dy * t, A[2] + dz * t - (o.sag || 0) * 4 * t * (1 - t)); }
  const N2 = pts.length / 3, cols = new Uint8Array(N2), P = o.pal || 'xm';
  for (let i = 0; i < N2; i++) cols[i] = o.mono !== undefined ? o.mono : i % 5;
  return { k: 'bulbs', pal: P, pts, cols, n: N2, x: (A[0] + B[0]) / 2, y: (A[1] + B[1]) / 2, m: Math.max(60, len / 1.4), key: o.key !== undefined ? o.key : (A[0] + B[0]) / 2 + (A[1] + B[1]) / 2 + 2, sp: rr(1.6, 3.6), ph: rr(0, 9), mode: o.mode || (chance(0.3) ? 'chase' : 'twinkle'), e0: o.e0, e1: o.e1 };
}
const _bx = new Float32Array(4096), _by = new Float32Array(4096), _bo = new Uint8Array(4096);
function drawBulbs(g, lg, useL, f) {
  const pal = f.pal === 'xm' ? 'xm' + G.era : f.pal, P = BPAL[pal], t = EV.t, cx = R.cx, cy = R.cy, n = Math.min(f.n, 4096), pts = f.pts, ch = (t * 7) | 0;
  for (let i = 0; i < n; i++) { const wx = pts[i * 3], wy = pts[i * 3 + 1], wz = pts[i * 3 + 2]; _bx[i] = Math.round((wx - wy) * 2) / 2 + cx; _by[i] = Math.round(((wx + wy) / 2 - wz) * 2) / 2 + cy; _bo[i] = f.mode === 'chase' ? ((i + ch) % 4 !== 0 ? 1 : 0) : f.mode === 'steady' ? 1 : (Math.sin(t * f.sp + i * 1.7 + f.ph) > -0.5 ? 1 : 0); }
  for (let i = 0; i < n; i++) { const c = f.cols[i] % P.c.length; g.fillStyle = _bo[i] ? P.css[c] : P.dim[c]; g.fillRect(_bx[i], _by[i], 0.5, 0.5); }
  if (!useL) return;
  lg.globalAlpha = 0.28; for (let i = 0; i < n; i++) if (_bo[i]) { lg.fillStyle = P.css[f.cols[i] % P.c.length]; lg.fillRect(_bx[i] - 0.5, _by[i] - 0.5, 1.5, 1.5); }
  lg.globalAlpha = 1; for (let i = 0; i < n; i++) if (_bo[i]) { lg.fillStyle = P.css[f.cols[i] % P.c.length]; lg.fillRect(_bx[i], _by[i], 0.5, 0.5); }
}
// lights wrapped around tree canopies: bulb positions sampled from the opaque canopy pixels of each tree sprite
function treeBulbs(s) {
  if (s._bulbs) return s._bulbs;
  const c = s.c, W = c.width, H = c.height, d = c.getContext('2d').getImageData(0, 0, W, H).data, split = s.split * K, cand = [];
  for (let y = 2; y < split; y += 3) for (let x = 2; x < W - 2; x += 3) if (d[(y * W + x) * 4 + 3] > 0 && d[((y - 2) * W + x) * 4 + 3] > 0 && d[(y * W + x + 2) * 4 + 3] > 0) cand.push([x / K, y / K]);
  const R2 = mulberry32(W * 7 + H), want = Math.min(cand.length, s.bare ? 12 : 16 + (s.rad || 10)), out = [];
  for (let i = 0; i < want; i++) { const j = (R2() * cand.length) | 0; out.push(cand[j][0], cand[j][1], i % 5); }
  return (s._bulbs = out);
}
EV.treeDeco = (g, lg, useL, it, x, y) => {
  if (hash2(it.wx, it.wy) > [0.45, 0.6, 0.75, 0.85][G.era]) return;
  const s = it.tree, B = treeBulbs(s), P = BPAL['xm' + G.era], sway = 0.5 + G.gust * 2.8 + (G.windy ? 0.9 : 0), amp = sway * (s.bare ? 0.4 : s.spc === 'cau' ? 1.2 : 1), sw = Math.sin(G.t * (1.1 + G.gust * 2.4) + it.ph) * amp + G.gust * 1.3, bh = Math.ceil(s.split / 4), t = EV.t;
  for (let i = 0; i < B.length; i += 3) {
    const by = B[i + 1], band = Math.min(3, (by / bh) | 0), ox = Math.round(sw * (1 - band / 4) * K) / K, px = x + B[i] + ox, py = y + by, ci = B[i + 2] % P.c.length, on = Math.sin(t * 2.6 + i * 1.3 + it.ph) > -0.4;
    g.fillStyle = on ? P.css[ci] : P.dim[ci]; g.fillRect(px, py, 0.5, 0.5);
    if (useL && on) { lg.fillStyle = P.css[ci]; lg.globalAlpha = 0.3; lg.fillRect(px - 0.5, py - 0.5, 1.5, 1.5); lg.globalAlpha = 1; lg.fillRect(px, py, 0.5, 0.5); }
  }
};

// ---------------------------------------------------------------- wall flags: painted murals (199x / 200x) and LED façades (201x / 202x)
function recKey(r, bs) { let m = -1e9; for (const b of bs) if (!b.nf) m = Math.max(m, b.x + b.w + b.y + b.d); return r.x + r.y + m + 0.5; }
// one panel on a face plane. slices: one per box, each with its own screen skew and texture sub-rect
function mkPanel(r, bs, P, key, kind) {
  const face = P.face, list = P.boxes.map(i => bs[i]).filter(Boolean); if (!list.length) return null;
  const U0 = b => face === 1 ? r.x + b.x : r.y + b.y, U1 = b => face === 1 ? r.x + b.x + b.w : r.y + b.y + b.d, PL = b => face === 1 ? r.y + b.y + b.d : r.x + b.x + b.w;
  let pu0 = P.u0 !== undefined ? P.u0 : Math.min(...list.map(U0)), pu1 = P.u1 !== undefined ? P.u1 : Math.max(...list.map(U1)); const pz0 = P.z0, pz1 = P.z1, slices = [], glass = [];
  for (const b of list) {
    let u0 = Math.max(U0(b), pu0), u1 = Math.min(U1(b), pu1); const z0 = Math.max(b.z, pz0), z1 = Math.min(b.z + b.h, pz1); if (P.fit) { const m = (U1(b) - U0(b)) * 0.12; u0 = U0(b) + m; u1 = U1(b) - m; }
    if (u1 - u0 < 2 || z1 - z0 < 1) continue;
    const sxf = P.fit ? 0 : face === 1 ? (u0 - pu0) / (pu1 - pu0) : (pu1 - u1) / (pu1 - pu0), swf = P.fit ? 1 : (u1 - u0) / (pu1 - pu0);
    slices.push({ face, pl: PL(b), u0, u1, z0, z1, sxf, swf, syf: (pz1 - z1) / (pz1 - pz0), shf: (z1 - z0) / (pz1 - pz0) });
    glass.push({ face, pl: PL(b), u0: U0(b), u1: U1(b), z0: b.z + b.h * 0.2, z1: b.z + b.h, sxf: 0, swf: 1, syf: 0, shf: 1 });
  }
  if (!slices.length) return null;
  const s0 = slices[0], mx = face === 1 ? (pu0 + pu1) / 2 : s0.pl, my = face === 1 ? s0.pl : (pu0 + pu1) / 2;
  return { k: 'wall', kind, face, slices, glass, tw: Math.max(8, Math.round((P.fit ? Math.max(...slices.map(q => q.u1 - q.u0)) : pu1 - pu0) * K)), th: Math.max(8, Math.round((pz1 - pz0) * K)), x: mx, y: my, m: 260, key, tex: {}, ph: hash2(mx, my) * 9 };
}
function walls(era) {
  const ck = 'w' + era; if (EV.cache[ck]) return EV.cache[ck];
  const out = [];
  for (const r of CITY.recs) {
    if (r.t !== 'b' || r.lm || r.keep || era < r.e0 || era > r.e1) continue;
    let bs; try { bs = r.gen ? r.gen(era) : r.boxes; } catch (e) { continue; } if (!bs || !bs.length) continue;
    const key = recKey(r, bs);
    if (era >= 2) { if (bs.led) for (const P of bs.led) { if (era < (P.e0 || 0)) continue; const p = mkPanel(r, bs, P, key, 'led'); if (p) out.push(p); } continue; }
    let body = null; for (const b of bs) if (!b.nf && b.z < 1 && b.h >= 26 && (!body || b.h > body.h)) body = b;
    if (!body || hash2(r.x * 0.7, r.y * 1.3) > (era === 0 ? 0.6 : 0.32)) continue;
    const face = r.tw > r.td ? 1 : r.td > r.tw ? 2 : (hash2(r.x, r.y) < 0.5 ? 1 : 2), len = face === 1 ? body.w : body.d; if (len < 24) continue;
    // only on exposed side walls (alley, yard, street or plaza beside it), so a neighbour never stands in front of the paint
    let open = 0, tot = 0;
    if (face === 1) { const ty = Math.floor((r.y + body.y + body.d + 1) / T); for (let x = r.x + body.x + 2; x < r.x + body.x + body.w - 2; x += T) { tot++; const t2 = GT[gi(Math.floor(x / T), ty)]; if (ty < N && t2 !== G_PAD) open++; } }
    else { const tx = Math.floor((r.x + body.x + body.w + 1) / T); for (let y = r.y + body.y + 2; y < r.y + body.y + body.d - 2; y += T) { tot++; const t2 = GT[gi(tx, Math.floor(y / T))]; if (tx < N && t2 !== G_PAD) open++; } }
    if (!tot || open / tot < 0.8) continue;
    const fw = Math.min(len - 6, (body.h - 9) * 1.5, 54), fh = fw / 1.5; if (fw < 18) continue;
    const ub = face === 1 ? r.x + body.x : r.y + body.y, u0 = ub + (len - fw) / 2, z1 = body.z + body.h - 3.5;
    const p = mkPanel(r, bs, { face, boxes: [bs.indexOf(body)], u0, u1: u0 + fw, z0: z1 - fh, z1 }, key, 'paint'); if (p) out.push(p);
  }
  EV.stats.mural = out.filter(p => p.kind === 'paint').length; EV.stats.led = out.filter(p => p.kind === 'led').length;
  return (EV.cache[ck] = out);
}
function flagField(tw, th, fn) {   // red field + yellow star sized to the panel; fn(x, y, inStar) -> colour
  const c = mk(tw, th), g = c.getContext('2d'), id = g.createImageData(tw, th), d = id.data, R0 = Math.min(th * 0.36, tw * 0.24), poly = starPoly(tw / 2, th / 2 + R0 * 0.08, R0);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { const col = fn(x, y, inPoly(poly, x + 0.5, y + 0.5)), k = (y * tw + x) * 4; if (col < 0) continue; d[k] = col >> 16 & 255; d[k + 1] = col >> 8 & 255; d[k + 2] = col & 255; d[k + 3] = 255; }
  g.putImageData(id, 0, 0); return c;
}
function muralTex(f) { return f.tex.p || (f.tex.p = flagField(f.tw, f.th, (x, y, st) => { const n = vnoise(x / 7 + f.ph, y / 5), chip = hash2(x + f.ph * 9, y) > 0.985; let c = st ? (n > 0.62 ? 0xe8c240 : 0xf2cc48) : (n > 0.64 ? 0xa82418 : n < 0.3 ? 0xc22a1c : 0xb82618); if (chip) c = 0xd8c8b0; if (x === 0 || y === 0 || x === f.tw - 1 || y === f.th - 1) c = mixc(c, 0x2b1a16, 0.35); return c; })); }
// LED façade: 12 s loop — waving flag, then "2-9" in gold, then a star burst. Each LED = 2x2 art px with a dark gap
function ledTex(f) {
  const t = (EV.t + f.ph) % 12, mode = t < 7 ? 0 : t < 9.5 ? 1 : 2, fr = mode === 0 ? ((t * 5) | 0) % 6 : mode === 1 ? ((t * 2) | 0) % 2 : Math.min(5, ((t - 9.5) * 2.4) | 0), k = mode + '|' + fr;
  if (f.tex[k]) return f.tex[k];
  const tw = f.tw, th = f.th, ph = fr / 6 * TAU, s = Math.max(1, Math.floor(Math.min(tw / 13, th / 7))), tx0 = Math.floor((tw - 11 * s) / 2), ty0 = Math.floor((th - 5 * s) / 2), cx = tw / 2, cy = th / 2;
  return (f.tex[k] = flagField(tw, th, (x, y, st) => {
    const gap = (x & 1) || (y & 1); let c;
    if (mode === 0) { const b = 0.72 + 0.28 * Math.sin(x * 0.16 - ph + y * 0.05); c = st ? mixc(0x6a5a10, 0xfff04a, b) : mixc(0x500808, 0xff2a1a, b); }
    else if (mode === 1) { const on = textAt('2-9', (x - tx0) / s, (th - 1 - y - ty0) / s) || (x < 2 || y < 2 || x >= tw - 2 || y >= th - 2); c = on ? (fr ? 0xfff04a : 0xffd83a) : 0xc81a12; }
    else { const r2 = Math.hypot(x - cx, (y - cy) * 1.2), ring = Math.abs(r2 - (fr + 1) * Math.min(tw, th) * 0.09) < 1.6; c = ring || (st && fr > 2) ? 0xfff04a : 0xb01410; }
    return gap ? mixc(c, 0x1a0806, 0.55) : c;
  }));
}
function wallXform(g, q, ox, oy) {   // skew the canvas onto a face plane: face 1 runs along +x (screen right-down), face 2 along -y (screen right-up)
  if (q.face === 1) g.setTransform(K, K * 0.5, 0, K, Math.round((q.u0 - q.pl + ox) * K), Math.round(((q.u0 + q.pl) / 2 - q.z1 + oy) * K));
  else g.setTransform(K, -K * 0.5, 0, K, Math.round((q.pl - q.u1 + ox) * K), Math.round(((q.pl + q.u1) / 2 - q.z1 + oy) * K));
}
function drawWall(g, lg, useL, f) {
  const tex = f.kind === 'paint' ? muralTex(f) : ledTex(f), ox = R.cx, oy = R.cy;
  for (const q of f.slices) {
    const sx = q.sxf * tex.width, sw = Math.max(1, q.swf * tex.width), sy = q.syf * tex.height, sh = Math.max(1, q.shf * tex.height);
    wallXform(g, q, ox, oy); g.drawImage(tex, sx, sy, sw, sh, 0, 0, q.u1 - q.u0, q.z1 - q.z0);
    if (useL && f.kind === 'led') { wallXform(lg, q, ox, oy); lg.globalAlpha = 0.9; lg.drawImage(tex, sx, sy, sw, sh, 0, 0, q.u1 - q.u0, q.z1 - q.z0); lg.globalAlpha = 1; }
  }
  if (useL && f.kind === 'led' && FW.flash > 0.05) { lg.fillStyle = FW.flashCss; lg.globalAlpha = Math.min(0.3, FW.flash * 0.22); for (const q of f.glass) { wallXform(lg, q, ox, oy); lg.fillRect(0, 0, q.u1 - q.u0, q.z1 - q.z0); } lg.globalAlpha = 1; }
  g.setTransform(K, 0, 0, K, 0, 0); if (useL) lg.setTransform(K, 0, 0, K, 0, 0);
}

// ---------------------------------------------------------------- per-era lists: landmark rooftop flags (2/9), roof-edge lights (Giáng sinh)
function lmFlags(era) {
  const ck = 'lm' + era; if (EV.cache[ck]) return EV.cache[ck]; const out = [];
  for (const r of CITY.recs) { if (r.t !== 'b' || !r.lm || era < r.e0 || era > r.e1) continue; const bs = r.gen ? r.gen(era) : r.boxes; let top = null; for (const b of bs) if (!b.nf && b.w * b.d >= 30 && (!top || b.z + b.h > top.z + top.h)) top = b; if (!top) continue; const x = r.x + top.x + top.w / 2, y = r.y + top.y + top.d / 2; out.push({ k: 'flag', x, y, z: top.z + top.h, ph: 30, size: 'L', ax: r.lm === 2 ? 'y' : 'x', phs: hash2(x, y), key: x + y + 6, big: 1 }); }
  return (EV.cache[ck] = out);
}
function outlines(era) {
  const ck = 'o' + era; if (EV.cache[ck]) return EV.cache[ck]; const out = [], share = [0.35, 0.5, 0.65, 0.8][era];
  for (const r of CITY.recs) {
    if (r.t !== 'b' || r.keep || era < r.e0 || era > r.e1) continue;
    if (!r.lm && hash2(r.x * 1.7, r.y * 0.9) > share) continue;
    let bs; try { bs = r.gen ? r.gen(era) : r.boxes; } catch (e) { continue; } if (!bs || !bs.length) continue;
    let top = null; for (const b of bs) if (!b.nf && b.w * b.d >= 30 && (!top || b.z + b.h > top.z + top.h)) top = b; if (!top) continue;
    const key = recKey(r, bs), x0 = r.x + top.x, y0 = r.y + top.y, x1 = x0 + top.w, y1 = y0 + top.d, z = top.z + top.h + 0.3, tall = z > 90, o = { key, gap: tall ? 4 : 2.6, pal: r.lm ? 'warm' : 'xm', mode: r.lm || tall ? 'steady' : undefined, mono: r.lm ? undefined : (hash2(r.x, r.y) * 5) | 0 };
    out.push(mkBulbs([x0, y1, z], [x1, y1, z], o), mkBulbs([x1, y0, z], [x1, y1, z], o));
    if (tall || r.lm) out.push(mkBulbs([x1, y1, 2], [x1, y1, z], Object.assign({}, o, { mono: undefined, mode: 'chase', gap: 4 })));
  }
  return (EV.cache[ck] = out);
}

// ---------------------------------------------------------------- fireworks (Quốc khánh): shells, bursts, trails, smoke, flashes, water reflections, sound
const FW = { shells: [], parts: [], smoke: [], bursts: [], next: 1.5, salvo: 0, salvoT: rr(25, 40), flash: 0, flashCss: '#fff', sndT: 0, sndN: 0 };
const FWC = [0xff4a3a, 0xffd25a, 0x6aff7a, 0x5ab0ff, 0xc77aff, 0xfff6e8, 0xff8ad8, 0x6af0ff, 0xff9a3a, 0xff4a3a, 0xffd25a];
const FWCSS = {}; const fwCss = c => FWCSS[c] || (FWCSS[c] = css(c));
function fwLaunch() {
  const vw = R.vw, vh = R.vh, riv = SIM.focus[0] < 620;
  for (let k = 0; k < 14; k++) {
    let x, y, z = rr(170, 300); const sy = rr(0.05, 0.4) * vh;
    if (riv && k < 10) { x = rr(56, 148); y = x + R.cx - rr(0.08, 0.92) * vw; z = (x + y) / 2 + R.cy - sy; if (z < 120 || z > 340) continue; }   // over the river: aim at a spot on screen, solve for the height
    else { const sx = rr(0.06, 0.94) * vw; x = ((sx - R.cx) + 2 * (sy - R.cy + z)) / 2; y = x - (sx - R.cx); }
    if (x < 20 || y < 20 || x > WORLD - 20 || y > WORLD - 20) continue;
    const river = x < 160, z0 = river ? 0 : z * 0.45;
    FW.shells.push({ x, y, z: z0, z0, zb: z, t: 0, T: rr(1.1, 1.7), river });
    if (chance(0.3)) fwSound('whistle', 0);
    return;
  }
}
const FW_TYPES = [['peony', 3], ['chrys', 2.4], ['willow', 1.4], ['ring', 1.2], ['palm', 1], ['crossette', 0.9], ['strobe', 1], ['star', 1.1], ['double', 1.4], ['kamuro', 0.8], ['heart', 0.3]];
function fwPart(s, vx, vy, c, o) { FW.parts.push(Object.assign({ wx: s.x, wy: s.y, wz: s.zb, ox: 0, oy: 0, vx, vy, c, life: 1.8, max: 1.8, drag: 1.5, g: 14, tr: null, st: 0, cr: 0, ph: Math.random() * 9 }, o)); }
function sph(v) { const u = rr(-1, 1), th = rr(0, TAU), r = Math.sqrt(1 - u * u), dx = r * Math.cos(th) * v, dy = r * Math.sin(th) * v, dz = u * v; return [dx - dy, (dx + dy) / 2 - dz]; }
function fwBurst(s) {
  const type = wpick(FW_TYPES), c1 = pick(FWC), c2 = chance(0.5) ? pick(FWC) : c1, room = FW.parts.length < 1800, v0 = rr(52, 84) * (FW.salvo > 0 ? 1.15 : 1); let n = 0;
  const add = (vx, vy, c, o) => { if (room) { fwPart(s, vx, vy, c, o); n++; } };
  if (type === 'peony' || type === 'double') { for (let i = 0; i < 84; i++) { const v = sph(v0); add(v[0], v[1], i & 1 ? c1 : c2, { life: rr(1.3, 2), max: 2, tr: i % 3 ? null : [] }); } if (type === 'double') for (let i = 0; i < 36; i++) { const v = sph(v0 * 0.5); add(v[0], v[1], pick(FWC), { life: rr(1, 1.5), max: 1.5 }); } }
  else if (type === 'chrys') for (let i = 0; i < 64; i++) { const v = sph(v0); add(v[0], v[1], c1, { life: rr(1.8, 2.4), max: 2.4, tr: [] }); }
  else if (type === 'willow' || type === 'kamuro') for (let i = 0; i < 64; i++) { const v = sph(v0 * 0.9); add(v[0], v[1], type === 'willow' ? 0xffc060 : 0xffe0a0, { life: rr(3, 4), max: 4, drag: 2.4, g: type === 'willow' ? 20 : 9, tr: [], st: type === 'kamuro' ? 1 : 0 }); }
  else if (type === 'ring') { const a0 = rr(0, TAU), tilt = rr(0.35, 1); for (let i = 0; i < 46; i++) { const a = i / 46 * TAU, x = Math.cos(a) * v0, y = Math.sin(a) * v0 * tilt; add(x * Math.cos(a0) - y * Math.sin(a0), x * Math.sin(a0) + y * Math.cos(a0), c1, { life: rr(1.4, 1.8), max: 1.8 }); } for (let i = 0; i < 14; i++) { const v = sph(v0 * 0.25); add(v[0], v[1], c2, { life: 1.2, max: 1.2 }); } }
  else if (type === 'palm') for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + rr(-0.1, 0.1); add(Math.cos(a) * v0 * 1.1, Math.sin(a) * v0 * 0.9 - 10, i & 1 ? 0xffd25a : c1, { life: 2.6, max: 2.6, drag: 1.2, g: 18, tr: [] }); }
  else if (type === 'crossette') for (let i = 0; i < 12; i++) { const v = sph(v0 * 0.8); add(v[0], v[1], c1, { life: 1.6, max: 1.6, cr: 1, tr: [] }); }
  else if (type === 'strobe') for (let i = 0; i < 60; i++) { const v = sph(v0 * 0.85); add(v[0], v[1], 0xfff6e8, { life: rr(1.6, 2.4), max: 2.4, st: 1 }); }
  else if (type === 'star' || type === 'heart') {   // a gold five-pointed star on a red ring: the flag in the sky (or a pink heart)
    if (type === 'star') { for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; add(Math.cos(a) * v0, Math.sin(a) * v0, 0xff3a2a, { life: 1.8, max: 1.8, drag: 1.2, g: 6 }); } const P = starPoly(0, 0, v0 * 0.62); for (let i = 0; i < 60; i++) { const q = i / 60 * 10, j = q | 0, f = q - j, A = P[j], B = P[(j + 1) % 10]; add(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, 0xffe04a, { life: 1.9, max: 1.9, drag: 1.2, g: 6 }); } }
    else for (let i = 0; i < 56; i++) { const a = i / 56 * TAU, hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); add(hx * v0 / 18, hy * v0 / 18, 0xff8ad8, { life: 1.8, max: 1.8, drag: 1.2, g: 5 }); }
  }
  for (let i = 0; i < 4; i++) FW.smoke.push({ x: s.x + rr(-20, 20), y: s.y + rr(-20, 20), z: s.zb + rr(-24, 14), r: rr(30, 56), life: rr(5, 8), max: 8 });
  FW.bursts.push({ x: s.x, y: s.y, z: s.zb, c: c1, t: 0, river: s.river });
  FW.flash = Math.min(1.4, FW.flash + 0.5 + n / 160); FW.flashCss = fwCss(c1); EV.stats.bursts++;
  const sc = scn(s.x, s.y, s.zb); EV.cheer(FW.salvo > 0 ? 0.6 : 0.3, sc[0], sc[1]);
  fwSound(type, clamp(Math.abs(sc[0] - R.vw / 2) / 900 + 0.12, 0.08, 0.6), n);
}
function fwTick(dt) {
  if (EV.cur === 'qk') {
    const rate = (G.rain > 0.5 ? 0.4 : 1) * (SIM.focus[0] < 620 ? 1.5 : 1);
    FW.salvoT -= dt; if (FW.salvoT <= 0) { FW.salvo = ri(9, 16); FW.salvoT = rr(32, 55); if (chance(0.5)) ticker(pick(['Màn pháo hoa rực rỡ bừng sáng trên sông Sài Gòn', 'Cả thành phố reo hò theo từng chùm pháo hoa'])); fwSound('cheer', 0.3); }
    FW.next -= dt * rate; if (FW.next <= 0) { fwLaunch(); FW.next = FW.salvo > 0 ? (FW.salvo--, rr(0.1, 0.28)) : rr(0.4, 1.4); }
  }
  for (const s of FW.shells) { s.t += dt; const u = Math.min(1, s.t / s.T); s.z = s.z0 + (s.zb - s.z0) * (1 - (1 - u) * (1 - u)); if (chance(0.8)) FW.parts.push({ wx: s.x + rr(-0.6, 0.6), wy: s.y, wz: s.z, ox: 0, oy: 0, vx: rr(-2, 2), vy: rr(2, 8), c: 0xffd8a0, life: 0.45, max: 0.45, drag: 2, g: 10, tr: null, st: 0, cr: 0, ph: 0 }); if (u >= 1) { s.done = 1; fwBurst(s); } }
  FW.shells = FW.shells.filter(s => !s.done);
  const kids = [];
  for (const p of FW.parts) {
    p.life -= dt; const dr = Math.max(0, 1 - p.drag * dt); p.vx *= dr; p.vy = p.vy * dr + p.g * dt;
    if (p.tr) { p.tr.push(p.ox, p.oy); if (p.tr.length > 14) p.tr.splice(0, 2); }
    p.ox += p.vx * dt; p.oy += p.vy * dt;
    if (p.cr && p.life < p.max * 0.55) { p.cr = 0; p.life = 0; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.6; kids.push(Object.assign({}, p, { ox: p.ox, oy: p.oy, vx: Math.cos(a) * 22, vy: Math.sin(a) * 22, life: 0.9, max: 0.9, tr: null, c: pick(FWC) })); } }
  }
  FW.parts = FW.parts.filter(p => p.life > 0).concat(kids);
  for (const s of FW.smoke) { s.life -= dt; s.x += dt * (4 + G.gust * 20); s.y -= dt * 2; s.z += dt * 1.5; s.r += dt * 2; } FW.smoke = FW.smoke.filter(s => s.life > 0);
  for (const b of FW.bursts) b.t += dt; FW.bursts = FW.bursts.filter(b => b.t < 1.6);
  FW.flash *= Math.exp(-dt * 4.5); FW.sndT -= dt; if (FW.sndT <= 0) { FW.sndT = 1; FW.sndN = 0; }
}
function drawFireworks(lg) {
  const cx = R.cx, cy = R.cy;
  if (FW.flash > 0.02) { lg.globalAlpha = Math.min(0.14, FW.flash * 0.07); lg.fillStyle = FW.flashCss; lg.fillRect(0, 0, R.vw, R.vh); }
  for (const b of FW.bursts) {
    const s = scn(b.x, b.y, b.z), a = Math.max(0, 1 - b.t / 0.7), gl = tglow(b.c, 0);
    if (a > 0) { lg.globalAlpha = a * 0.6; lg.drawImage(gl, s[0] - 100, s[1] - 100, 200, 200); }
    // light on the water: shimmering colour streaks on the river under and in front of each burst (shells over the river launch from barges)
    const fa = Math.max(0, 1 - b.t / 1.5); if (fa <= 0) continue;
    for (let d = -36; d <= 60; d += 2.5) { const wx = b.x + d, wy = b.y + d, tx = wx >> 3, ty = wy >> 3; if (tx < 0 || ty < 0 || tx >= N || ty >= N || GT[gi(tx, ty)] !== G_RIVER) continue; const q = scn(wx, wy, 0); if (q[1] < 0 || q[1] > R.vh) continue; const k = 1 - Math.abs(d - 12) / 50, jx = Math.sin(EV.t * 7 + d) * 2.5; lg.globalAlpha = fa * k * 0.55; lg.fillStyle = fwCss(b.c); lg.fillRect(q[0] - 5 + jx, q[1], 10 + ((d * 2) & 3), 0.5); EV.stats.refl++; }
  }
  for (const p of FW.parts) {
    const sx = p.wx - p.wy + cx + p.ox, sy = (p.wx + p.wy) / 2 - p.wz + cy + p.oy; if (sx < -10 || sy < -10 || sx > R.vw + 10 || sy > R.vh + 10) continue;
    let a = clamp(p.life / p.max * 1.7, 0, 1); if (p.st && ((EV.t * 16 + p.ph) | 0) % 3 === 0) a *= 0.15;
    lg.fillStyle = fwCss(p.c);
    if (p.tr) for (let j = 0, m = p.tr.length; j < m; j += 2) { lg.globalAlpha = a * (j / m) * 0.55; lg.fillRect(Math.round((p.wx - p.wy + cx + p.tr[j]) * 2) / 2, Math.round(((p.wx + p.wy) / 2 - p.wz + cy + p.tr[j + 1]) * 2) / 2, 0.5, 0.5); }
    const px = Math.round(sx * 2) / 2, py = Math.round(sy * 2) / 2, young = p.life > p.max * 0.6;
    if (young) { lg.globalAlpha = a * 0.3; lg.fillRect(px - 0.5, py - 0.5, 2, 2); }
    lg.globalAlpha = a; const sz = young ? 1 : 0.5; lg.fillRect(px, py, sz, sz);
  }
  lg.globalAlpha = 1;
}
function drawSmoke(g) {
  if (!FW.smoke.length) return; const gl = _smokeC || (_smokeC = glow(40, 150, 150, 176, 70));
  for (const s of FW.smoke) { const q = scn(s.x, s.y, s.z); g.globalAlpha = Math.min(1, s.life / s.max * 1.4) * 0.35; g.drawImage(gl, q[0] - s.r, q[1] - s.r * 0.6, s.r * 2, s.r * 1.2); }
  g.globalAlpha = 1;
}
let _smokeC = null;

// ---------------------------------------------------------------- Halloween: a witch on a broom now and then
function witchTick(dt) {
  if (!EV.witch) { EV.witchT = (EV.witchT === undefined ? 12 : EV.witchT) - dt; if (EV.witchT <= 0) { EV.witchT = rr(28, 55); const ltr = chance(0.5); EV.witch = { x: ltr ? -30 : R.vw + 30, y: rr(0.08, 0.3) * R.vh, vx: (ltr ? 1 : -1) * rr(42, 60), t: 0 }; ticker('Một cô phù thủy cưỡi chổi vừa bay ngang trời!'); } return; }
  const w = EV.witch; w.t += dt; w.x += w.vx * dt; w.y += Math.sin(w.t * 2.2) * 6 * dt; if (w.x < -60 || w.x > R.vw + 60) EV.witch = null;
}
function drawWitch(g, lg) {
  const w = EV.witch; if (!w) return; const d = w.vx > 0 ? 1 : -1, x = Math.round(w.x), y = Math.round(w.y);
  g.fillStyle = '#7a5232'; for (let i = -7; i <= 6; i++) g.fillRect(x + i * d, y + 3 - Math.round(i * 0.1), 1, 1);
  g.fillStyle = '#d8a84a'; g.fillRect(x - 10 * d - (d < 0 ? 3 : 0), y + 2, 4, 3);
  g.fillStyle = '#2a2034'; g.fillRect(x - 2, y - 3, 4, 6); g.fillRect(x - 1, y - 6, 3, 3); g.fillRect(x - 4, y - 7, 8, 1); g.fillRect(x - 1, y - 11, 2, 4); g.fillRect(x + d, y - 12, 1, 1); g.fillRect(x - 3 * d, y + 1, 2, 2);
  if (lg) { lg.globalAlpha = 0.6; lg.fillStyle = '#ffd890'; for (let i = 1; i < 7; i++) if (((EV.t * 12) | 0 + i) % 2) lg.fillRect(x - (10 + i * 3) * d, y + 3 + Math.sin(i + EV.t * 5), 0.5, 0.5); lg.globalAlpha = 1; }
}

// ---------------------------------------------------------------- per-frame drawing entry points (called from main.js)
EV.visible = () => {
  const v = []; EV.visDoors = []; const e = EV.cur; if (!e) return v;
  const era = G.era, add = f => { if ((f.e0 === undefined || era >= f.e0) && (f.e1 === undefined || era <= f.e1) && G.onScreen(f.x, f.y, f.m || 90)) v.push(f); };
  for (const f of EV.fixed[e]) add(f);
  if (e === 'qk') { for (const f of roofFlags(era)) { if (f.key === undefined) f.key = TET.key(f); add(f); } for (const f of lmFlags(era)) add(f); for (const f of walls(era)) add(f); }
  if (e === 'xm') for (const f of outlines(era)) add(f);
  for (const d of POI.doors) if (G.onScreen(d.x, d.y, 30)) EV.visDoors.push(d);
  return v;
};
EV.draw = (g, lg, useL, f) => {
  if (f.k === 'flag') TET.draw(g, lg, useL, f, R.cx, R.cy);
  else if (f.k === 'qstr') drawQStr(g, f);
  else if (f.k === 'bulbs') drawBulbs(g, lg, useL, f);
  else if (f.k === 'wall') drawWall(g, lg, useL, f);
  else if (f.k === 'xtree') { const s = xmasTreeSprite(f.size, ((EV.t * 2.2) | 0) % 3, G.era), p = scn(f.x, f.y, 0); g.drawImage(s.c, p[0] - s.ax, p[1] - s.ay, s.w, s.h); if (useL) { lg.drawImage(s.e, p[0] - s.ax, p[1] - s.ay, s.w, s.h); const top = p[1] - s.ay + s.apex, a = 0.5 + Math.sin(EV.t * 2) * 0.12; lg.globalAlpha = a; const gl = tglow(0xffe070, 0), r = f.size === 'L' ? 30 : 18; lg.drawImage(gl, p[0] - r, top - r, r * 2, r * 2); lg.globalAlpha = 0.35; const gp = tglow(0xffd8a0, 1), rw = f.size === 'L' ? 70 : 40; lg.drawImage(gp, p[0] - rw, p[1] - rw * 0.35, rw * 2, rw * 0.7); lg.globalAlpha = 1; } }
  else if (f.k === 'star') {
    const s = starSprite(f.sz, f.c), sw = Math.sin(EV.t * 1.3 + f.ph) * 0.6, p = scn(f.x, f.y, f.z);
    if (f.hang) { g.fillStyle = '#3a2a24'; g.fillRect(p[0] + sw * 0.5, p[1] - f.hang, 0.5, f.hang); }
    g.drawImage(s.c, p[0] - s.w / 2 + sw, p[1] - s.h / 2, s.w, s.h);
    if (useL) { lg.drawImage(s.e, p[0] - s.w / 2 + sw, p[1] - s.h / 2, s.w, s.h); lg.globalAlpha = 0.45 + Math.sin(EV.t * 3 + f.ph) * 0.1; const gl = tglow(f.c, 0), r = f.sz * 2.6; lg.drawImage(gl, p[0] - r + sw, p[1] - r, r * 2, r * 2); lg.globalAlpha = 1; }
  }
};
EV.drawSky = g => { if (FW.smoke.length) drawSmoke(g); };
EV.drawLights = (lg, lights) => {
  const e = EV.cur; if (!e && !FW.parts.length) return; const k = EV.k;
  if (e === 'hw' || e === 'xm') for (const d of EV.visDoors) {
    const c = e === 'hw' ? d.hw : d.xm; if (!c) continue; const p = scn(d.x * 0.6 + d.ix * 0.4, d.y * 0.6 + d.iy * 0.4, 0), a = (0.42 + Math.sin(EV.t * (e === 'hw' ? 5 : 1.5) + d.x) * (e === 'hw' ? 0.06 : 0.04)) * k;
    lg.globalAlpha = a; lg.drawImage(tglow(c, 1), p[0] - 26, p[1] - 9, 52, 18);
  }
  lg.globalAlpha = 1;
  if (e === 'xm') { lg.fillStyle = '#fff6d8'; for (const f of EV.fixed.xm) if (f.k === 'xtree' && G.onScreen(f.x, f.y, 60)) { const p = scn(f.x, f.y, 0), n = f.size === 'L' ? 26 : 10; for (let i = 0; i < n; i++) { const h = hash2(i * 3.1, f.x), ph = (EV.t * (0.12 + h * 0.1) + h) % 1, a = Math.sin(ph * Math.PI); lg.globalAlpha = a * (0.4 + 0.4 * (Math.sin(EV.t * 9 + i) > 0.6)); lg.fillRect(p[0] + Math.sin(i * 2.3 + EV.t * 0.5) * (f.size === 'L' ? 34 : 18), p[1] - ph * (f.size === 'L' ? 110 : 60), 0.5, 0.5); } } lg.globalAlpha = 1; }
  if (e === 'hw' && EV.witch) drawWitch(R.ctx, lg);
  if (FW.parts.length || FW.bursts.length || FW.flash > 0.02) drawFireworks(lg);
};

// ---------------------------------------------------------------- 2/9 bunting: hanging flags only (Tết's bunting mixes in lanterns)
const _qbsp = {};
function qkBunting(sp, fr) {
  const k = sp.id + '|' + fr; if (_qbsp[k]) return _qbsp[k];
  const dx = sp.dx, dy = sp.dy, sag = sp.sag, minX = Math.min(0, dx), pad = 8, W = Math.abs(dx) + pad * 2, H = Math.abs(dy) + sag + 22, ox = pad - minX, oy = 3 + (dy < 0 ? -dy : 0);
  const g = new Int32Array(W * H).fill(-1), set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = c; };
  const at = t => [ox + dx * t, oy + dy * t + sag * 4 * t * (1 - t)], n = Math.max(1, Math.abs(dx)), sgn = sp.ax === 'x' ? 1 : -1;
  for (let i = 0; i <= n; i++) { const p = at(i / n); set(p[0], p[1], 0x7a2a20); }
  const cnt = Math.max(1, Math.floor(Math.abs(dx) / 9));
  for (let q = 0; q < cnt; q++) { const p = at((q + 0.5) / cnt), bx = Math.round(p[0]), by = Math.round(p[1]) + 1; for (let i = 0; i < 9; i++) { const lag = Math.round(i * 0.5), wv = Math.round(Math.sin(fr / 4 * TAU + i * 0.6 + q) * 0.7 * (i / 8)); for (let j = 0; j < 6; j++) set(bx + sgn * i, by + j + lag + wv, BF[j][i] === 'Y' ? FYEL : FRED); } }
  const s = gridCanvas(g, W, H, null); s.ox = ox; s.oy = oy; return (_qbsp[k] = s);
}
function drawQStr(g, f) {
  const s = qkBunting(f, Math.floor(((TET.clock * 0.5 + f.phs) % 1 + 1) % 1 * 4) % 4), a = scn(f.A[0], f.A[1], f.A[2]), a0 = scn(f.A[0], f.A[1], 0), b0 = scn(f.B[0], f.B[1], 0), b = scn(f.B[0], f.B[1], f.B[2]);
  g.fillStyle = '#6b4a3a'; g.fillRect(a0[0], a[1] - 1, 1, a0[1] - a[1] + 1); g.fillRect(b0[0], b[1] - 1, 1, b0[1] - b[1] + 1);
  g.drawImage(s.c, a[0] - s.ox, a[1] - s.oy, s.w, s.h);
}

// ---------------------------------------------------------------- planning (once, at boot, after planCity + planTet)
EV.plan = () => {
  const occ = new Set(), taken = new Set();
  for (const r of CITY.recs) if ((r.t === 'p' || r.t === 't') && !r.tet) occ.add(tkey(Math.floor(r.x / T), Math.floor(r.y / T)));
  for (const d of POI.doors) occ.add(tkey(Math.floor(d.x / T), Math.floor(d.y / T)));
  const free = (tx, ty, types) => tx >= 0 && ty >= 0 && tx < N && ty < N && types.includes(GT[gi(tx, ty)]) && !BLK[gi(tx, ty)] && !occ.has(tkey(tx, ty)) && !taken.has(tkey(tx, ty));
  const area = (tx, ty, w, h, types) => { for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) if (!free(x, y, types)) return false; return true; };
  const take = (tx, ty, w, h) => { for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) taken.add(tkey(x, y)); };
  const near2 = (tx, ty, w, h, types, rad) => { for (let r = 0; r <= (rad || 8); r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; if (area(tx + dx, ty + dy, w, h, types)) { take(tx + dx, ty + dy, w, h); return [tx + dx, ty + dy]; } } return null; };
  const evP = (ev, name, p, o) => { o = o || {}; CITY.recs.push({ t: 'p', name, x: p[0], y: p[1], v: o.v || 0, m: !!o.mirror, kb: o.kb || 0, only: undefined, e0: o.e0 || 0, e1: o.e1 === undefined ? 3 : o.e1, ev }); };
  const blk = kind => { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (KINDS[j][i] === kind && i > 0) { const ix0 = XS[i][0] + SW, iy0 = YS[j][0] + SW, ix1 = XS[i][1] - SW, iy1 = YS[j][1] - SW; return { ix0, iy0, ix1, iy1, cx: (ix0 + ix1) >> 1, cy: (iy0 + iy1) >> 1 }; } return null; };
  const PARK = blk('park'), DINH = blk('dinh'), MKT = blk('market'), HERO = blk('hero'), CHURCH = blk('church');
  const OPEN = [G_GRASS, G_PLAZA], WALKS = [G_GRASS, G_PLAZA, G_PROM, G_PATH, G_SIDE];
  const dirTo = (x, y, tx, ty) => { const dx = tx - x, dy = ty - y; return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); };
  const skyDir = () => wpick([[3, 4], [2, 4], [0, 1], [1, 1]]);
  const spotsIn = (B, types, p, list, max, dirf) => { let n = 0; for (let ty = B.iy0; ty < B.iy1 && n < max; ty++) for (let tx = B.ix0; tx < B.ix1 && n < max; tx++) if (types.includes(GT[gi(tx, ty)]) && !BLK[gi(tx, ty)] && !occ.has(tkey(tx, ty)) && hash2(tx * 5.3, ty * 3.7) < p) { list.push({ x: tc(tx) + rr(-2.5, 2.5), y: tc(ty) + rr(-2.5, 2.5), dir: dirf ? dirf(tx, ty) : skyDir() }); n++; } };

  // ===== Quốc khánh 2/9 =====
  { const F = EV.fixed.qk, S = EV.spots.qk, grid = new Set();
    const flag = (x, y, z, ph, size, ax, o) => { const g2 = Math.floor(x / 5) + ',' + Math.floor(y / 5) + ',' + Math.round(z / 6); if (grid.has(g2)) return; grid.add(g2); F.push(Object.assign({ k: 'flag', x, y, z, ph, size, ax, phs: hash2(x, y), key: x + y + 3 }, o)); };
    for (const f of TET.fixed) if (!f.stallPole) flag(f.x, f.y, f.z, f.ph, f.size, f.ax, { big: f.big });
    for (const sgm of TET.strings) F.push(Object.assign({}, sgm, { k: 'qstr', id: 9000 + sgm.id, key: sgm.x + sgm.y + 2, m: 60 }));
    // denser kerb flags on every street, both sides
    for (const h of ROADS_H) for (let tx = 34; tx < N - 2; tx += 4) { if (ROADS_V.some(v => tx > v - 3 && tx < v + RW + 2)) continue; for (const [ty, ax] of [[h - 1, 'x'], [h + RW, 'y']]) if (GT[gi(tx, ty)] === G_SIDE && !occ.has(tkey(tx, ty)) && !BLK[gi(tx, ty)]) flag(tx * T + 4, ty * T + (ty < h ? 6.5 : 1.5), 0, 26, 'm', ax); }
    for (const v of ROADS_V) for (let ty = 2; ty < N - 2; ty += 4) { if (ROADS_H.some(h => ty > h - 3 && ty < h + RW + 2)) continue; for (const [tx, ax] of [[v - 1, 'y'], [v + RW, 'x']]) if (GT[gi(tx, ty)] === G_SIDE && !occ.has(tkey(tx, ty)) && !BLK[gi(tx, ty)]) flag(tx * T + (tx < v ? 6.5 : 1.5), ty * T + 4, 0, 26, 'm', ax); }
    // a flag on every lamp post and at every door (bracket on the façade)
    for (const l of CITY.lamps) flag(l[0] + 0.8, l[1] + 0.8, l[2] - 3, 7, 's', hash2(l[0], l[1]) < 0.5 ? 'x' : 'y');
    for (const d of POI.doors) { const out = DIRV[(d.dir + 2) % 4], pr = [-out[1], out[0]]; flag(d.ix + out[0] * 1.2 + pr[0] * 7, d.iy + out[1] * 1.2 + pr[1] * 7, 11, 9, 's', out[1] !== 0 ? 'x' : 'y'); }
    // riverfront: rail flags twice as dense, a flag avenue along Bến Bạch Đằng, the bridge and its bunting
    for (let ty = 2; ty < N - 2; ty += 3) if (!inGap(ty) && !inGap(ty + 1)) flag(161, ty * T + 4, 8, 12, 's', ty % 2 ? 'x' : 'y');
    for (let ty = 3; ty < N - 3; ty += 6) if (!inGap(ty)) flag(184, ty * T + 4, 0, 30, 'm', 'x');
    for (let x = 44; x <= 156; x += 8) for (const y of [271, 289]) flag(x, y, 12, 16, 's', y < 280 ? 'x' : 'y');
    for (const y of [271, 289]) F.push(Object.assign(mkString([44, y, 12 + 26], [156, y, 12 + 26], 'x', 6), { k: 'qstr', key: 100 + y + 2, m: 80 }));
    // park + palace lawn: flag rows along the paths, a giant flag on a tall pole, star flower beds, banners
    if (PARK) { const { ix0, iy0, ix1, iy1, cx, cy } = PARK; for (let ty = iy0 + 1; ty < iy1; ty += 4) for (const tx of [cx - 2, cx + 1]) flag(tx * T + (tx < cx ? 6 : 2), ty * T + 4, 0, 24, 'm', tx < cx ? 'y' : 'x'); for (let tx = ix0 + 1; tx < ix1; tx += 4) for (const ty of [cy - 2, cy + 1]) flag(tx * T + 4, ty * T + (ty < cy ? 6 : 2), 0, 24, 'm', ty < cy ? 'x' : 'y');
      const sb = near2(cx + 8, cy - 9, 3, 3, [G_GRASS]); if (sb) evP('qk', 'starBed', [(sb[0] + 1.5) * T, (sb[1] + 1.5) * T]); evP('qk', 'bnQK', [cx * T, (iy0 + 4) * T]); evP('qk', 'bnDL', [cx * T, (iy1 - 3) * T]); evP('qk', 'bnHP', [(ix0 + 8) * T, cy * T + 4]); }
    if (DINH) { const { ix0, iy0, ix1, iy1, cx } = DINH; flag((cx - 4) * T, (iy0 + 14) * T, 0, 84, 'L', 'x', { big: 1 }); flag((cx + 4) * T, (iy0 + 14) * T, 0, 84, 'L', 'y', { big: 1 }); for (let ty = iy0 + 12; ty < iy1; ty += 3) if (ty < iy0 + 15 || ty > iy0 + 25) { flag((cx - 3) * T + 4, ty * T + 4, 0, 24, 'm', 'y'); flag((cx + 2) * T + 4, ty * T + 4, 0, 24, 'm', 'x'); }
      for (const ox of [-10, 8]) { const sb = near2(cx + ox, iy0 + 18, 3, 3, [G_GRASS]); if (sb) evP('qk', 'starBed', [(sb[0] + 1.5) * T, (sb[1] + 1.5) * T]); } }
    // banners across the N-S streets (mid-block)
    for (const v of ROADS_V) for (const [a, b] of [[4, 36], [42, 76], [82, 122], [128, 158]]) for (let ty = a + 10; ty < b - 6; ty += 12) { const x0 = v * T - 4, x1 = (v + RW) * T + 4, t0 = Math.floor(x0 / T), t1 = Math.floor(x1 / T); if (GT[gi(t0, ty)] !== G_SIDE || GT[gi(t1, ty)] !== G_SIDE || BLK[gi(t0, ty)] || BLK[gi(t1, ty)]) continue; if (hash2(v * 3, ty) < 0.5) evP('qk', ['bnM29', 'bnVN', 'bnM29'][ty % 3], [(x0 + x1) / 2, ty * T + 2]); }
    // watchers: park, palace lawn, the promenade railing, plazas
    if (PARK) spotsIn(PARK, OPEN, 0.18, S, 95); if (DINH) spotsIn({ ix0: DINH.ix0, iy0: DINH.iy0 + 12, ix1: DINH.ix1, iy1: DINH.iy1 }, OPEN, 0.12, S, 45);
    spotsIn({ ix0: 21, iy0: 2, ix1: 24, iy1: N - 2 }, [G_PROM], 0.24, S, 110, () => wpick([[2, 6], [3, 1], [1, 1]]));
    if (MKT) spotsIn(MKT, [G_PLAZA], 0.12, S, 30); for (const B of [HERO, CHURCH, blk('opera'), blk('mix')]) if (B) spotsIn(B, [G_PLAZA], 0.2, S, 12);
  }

  // ===== Halloween =====
  { const F = EV.fixed.hw, S = EV.spots.hw;
    for (const d of POI.doors) { if (d.shop === 'cho') continue; const h = hash2(d.x * 0.37, d.y * 0.91); if (h > (d.shop ? 0.5 : 0.28)) continue; const out = DIRV[(d.dir + 2) % 4], pr = [-out[1], out[0]]; evP('hw', 'jackO', [d.ix + out[0] * 4.5 - pr[0] * 9, d.iy + out[1] * 4.5 - pr[1] * 9], { v: (h * 97) | 0, mirror: out[0] === 1 }); d.hw = h < 0.25 ? 0xb070ff : 0xffa040; }
    const piles = []; if (PARK) piles.push([PARK.ix0 + 10, PARK.iy0 + 2], [PARK.cx - 6, PARK.cy + 6], [PARK.cx + 5, PARK.cy - 7], [PARK.ix1 - 4, PARK.iy1 - 4]); if (MKT) piles.push([MKT.ix0 + 4, MKT.iy0 + 2], [MKT.cx, MKT.iy0 + 3]); if (HERO) piles.push([HERO.ix0 + 14, HERO.iy1 - 1]); piles.push([23, 40], [23, 70], [24, 110]);
    for (const [tx, ty] of piles) { const q = near2(tx, ty, 2, 1, WALKS.concat([G_GRASS])); if (q) evP('hw', 'pumpkinPile', [(q[0] + 1) * T, q[1] * T + 4], {}); }
    for (const [tx, ty] of [PARK && [PARK.cx - 6, PARK.cy - 6], MKT && [MKT.ix0 + 8, MKT.iy0 + 2], PARK && [PARK.ix0 + 5, PARK.iy0 + 9]].filter(Boolean)) { const q = near2(tx, ty, 2, 2, OPEN); if (q) evP('hw', 'ghostBig', [(q[0] + 1) * T, (q[1] + 1) * T], { e0: 1 }); }
    const posts = []; if (PARK) for (let ty = PARK.iy0 + 4; ty < PARK.iy1 - 2; ty += 8) posts.push([PARK.cx + 2, ty]); for (let ty = 8; ty < N - 6; ty += 16) posts.push([25, ty]);
    for (const [tx, ty] of posts) if (free(tx, ty, WALKS) && !inGap(ty)) { take(tx, ty, 1, 1); evP('hw', 'hwLanterns', [tc(tx), tc(ty)]); }
    for (const sgm of TET.strings) if (hash2(sgm.x, sgm.y * 1.3) < 0.35) F.push(mkBulbs(sgm.A, sgm.B, { sag: 8, gap: 3.4, pal: 'hw', mode: 'twinkle' }));
    if (PARK) { const { cx, cy } = PARK; for (const [a, b] of [[[cx - 4, cy - 4], [cx + 4, cy - 4]], [[cx - 4, cy + 4], [cx + 4, cy + 4]], [[cx - 4, cy - 4], [cx - 4, cy + 4]], [[cx + 4, cy - 4], [cx + 4, cy + 4]]]) F.push(mkBulbs([a[0] * T, a[1] * T, 20], [b[0] * T, b[1] * T, 20], { sag: 6, gap: 3.2, pal: 'hw' })); }
    // costume-party clusters chatting in the park, the market square and on the promenade
    const centers = []; if (PARK) { const { cx, cy, ix0, iy0 } = PARK; centers.push([cx - 6, cy], [cx + 6, cy], [cx, cy - 6], [cx, cy + 6], [ix0 + 4, iy0 + 3], [cx + 9, cy - 9]); } if (MKT) centers.push([MKT.ix0 + 5, MKT.iy0 + 3], [MKT.cx + 2, MKT.iy0 + 3]); if (HERO) centers.push([HERO.ix0 + 6, HERO.iy1 + 1]); centers.push([22, 30], [22, 60], [22, 96], [22, 130]);
    for (const [tx, ty] of centers) { const cxw = tc(tx), cyw = tc(ty), n = ri(3, 5); for (let i = 0; i < n; i++) { const a = i / n * TAU + rr(-0.3, 0.3), x = cxw + Math.cos(a) * rr(5, 7.5), y = cyw + Math.sin(a) * rr(4.5, 7), t2 = [Math.floor(x / T), Math.floor(y / T)]; if (!WALK[gi(t2[0], t2[1])] && GT[gi(t2[0], t2[1])] !== G_GRASS) continue; S.push({ x, y, dir: dirTo(x, y, cxw, cyw), talk: chance(0.6) }); } }
  }

  // ===== Giáng sinh =====
  { const F = EV.fixed.xm, S = EV.spots.xm;
    const tree = (x, y, size) => { F.push({ k: 'xtree', x, y, size, key: x + y + 0.5, m: 140 }); const r0 = size === 'L' ? 34 : 20, n = size === 'L' ? 44 : 14; for (let i = 0; i < n; i++) { const a = i / n * TAU + rr(-0.1, 0.1), rad = rr(r0, r0 + (size === 'L' ? 16 : 9)), px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad * 0.9, tt = [Math.floor(px / T), Math.floor(py / T)]; if (tt[0] < 0 || tt[1] < 0 || tt[0] >= N || tt[1] >= N || BLK[gi(tt[0], tt[1])] || !WALKS.includes(GT[gi(tt[0], tt[1])])) continue; S.push({ x: px, y: py, dir: dirTo(px, py, x, y), pose: chance(0.4) ? 6 : 0 }); } };
    if (PARK) { const fx = PARK.cx * T, fy = PARK.cy * T, fr = CITY.recs.find(r => r.t === 'p' && r.name === 'fountain' && Math.abs(r.x - fx) < 2 && Math.abs(r.y - fy) < 2); if (fr) fr.noev = 'xm'; tree(fx, fy, 'L');
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.4, x = fx + Math.cos(a) * 26, y = fy + Math.sin(a) * 26, tx = Math.floor(x / T), ty = Math.floor(y / T); if (free(tx, ty, OPEN.concat([G_PATH]))) { take(tx, ty, 1, 1); evP('xm', i % 2 ? 'poin' : 'gifts', [x, y], { v: i }); } }
      for (const [dx, dy] of [[-7, 5], [6, 5]]) { const q = near2(PARK.cx + dx, PARK.cy + dy, 2, 1, OPEN); if (q) evP('xm', 'reindeer', [(q[0] + 1) * T, q[1] * T + 4], { e0: 2, mirror: dx > 0 }); }
      const { cx, cy, ix0, iy0, ix1, iy1 } = PARK; for (let ty = iy0 + 2; ty < iy1 - 2; ty += 6) for (const tx of [cx - 2, cx + 1]) { if (Math.abs(ty - cy) < 5) continue; F.push(mkBulbs([tc(tx), tc(ty), 18], [tc(tx), tc(ty + 6), 18], { sag: 4, gap: 2.6 })); } for (let tx = ix0 + 2; tx < ix1 - 2; tx += 6) for (const ty of [cy - 2, cy + 1]) { if (Math.abs(tx - cx) < 5) continue; F.push(mkBulbs([tc(tx), tc(ty), 18], [tc(tx + 6), tc(ty), 18], { sag: 4, gap: 2.6 })); } }
    if (MKT) { const q = near2(MKT.ix0 + 6, MKT.iy0 + 2, 3, 3, [G_PLAZA], 10); if (q) tree((q[0] + 1.5) * T, (q[1] + 1.5) * T, 'M'); }
    if (HERO) { const q = near2(HERO.ix0 + 15, HERO.iy1 - 2, 2, 2, [G_PLAZA, G_SIDE], 6); if (q) tree((q[0] + 1) * T, (q[1] + 1) * T, 'M'); }
    { const q = near2(23, 58, 2, 2, [G_PROM], 6); if (q) tree((q[0] + 1) * T, (q[1] + 1) * T, 'M'); }
    if (CHURCH) { const q = near2(CHURCH.ix0 + 11, CHURCH.iy1 - 4, 2, 2, [G_PLAZA, G_SIDE], 8); if (q) { evP('xm', 'grotto', [(q[0] + 1) * T, (q[1] + 1) * T]); for (let i = 0; i < 6; i++) S.push({ x: (q[0] + 1) * T - 10 + i * 4, y: (q[1] + 2) * T + 8 + (i & 1) * 2, dir: 1, sing: true }); } }
    // stars hung at doors, wreaths and gift piles on shopfronts, warm door glows
    for (const d of POI.doors) { const h = hash2(d.x * 0.61, d.y * 0.43), out = DIRV[(d.dir + 2) % 4], pr = [-out[1], out[0]];
      if (h < 0.42) F.push({ k: 'star', x: d.ix + out[0] * 3 + pr[0] * 4, y: d.iy + out[1] * 3 + pr[1] * 4, z: 18, sz: h < 0.1 ? 4 : 3, c: [0xffe04a, 0xff4a3a, 0xf4f8ff, 0x6ac8ff][(h * 40 | 0) % 4], hang: 5, ph: h * 50, key: d.ix + d.iy + out[0] * 3 + out[1] * 3 + 1 });
      if (d.shop && d.shop !== 'cho' && h > 0.3 && h < 0.78) evP('xm', 'wreath', [d.ix + out[0] * 0.8, d.iy + out[1] * 0.8], { mirror: out[0] === 1, kb: 1 });
      if (d.shop && h > 0.86) evP('xm', 'gifts', [d.ix + out[0] * 5 - pr[0] * 9, d.iy + out[1] * 5 - pr[1] * 9], { v: (h * 31) | 0 });
      if (h < 0.42 || d.shop) d.xm = h < 0.42 ? 0xffd890 : 0xffe8c0; }
    for (let ty = 6; ty < N - 6; ty += 9) if (!inGap(ty) && free(26, ty, [G_PROM])) { take(26, ty, 1, 1); evP('xm', 'poin', [tc(26), tc(ty)]); }
    // light strings: across every street, along the promenade railing and the bridge, spiralling up the lamp posts
    for (const sgm of TET.strings) F.push(mkBulbs(sgm.A, sgm.B, { sag: 9, gap: 3 }));
    for (let ty = 1; ty < N - 6; ty += 5) { if (inGap(ty) || inGap(ty + 5)) continue; F.push(mkBulbs([162, ty * T, 8.5], [162, (ty + 5) * T, 8.5], { sag: 2.2, gap: 2.4, key: 162 + ty * T + 20 })); }
    for (const y of [271, 289]) F.push(mkBulbs([44, y, 30], [156, y, 30], { sag: 8, gap: 2.6, key: 100 + y + 2 }));
    for (const l of CITY.lamps) { const pts = [], n = Math.max(3, Math.floor((l[2] - 4) / 2.4)); for (let i = 0; i < n; i++) { const a = i * 1.9; pts.push([l[0] + Math.cos(a) * 0.9, l[1] + Math.sin(a) * 0.9, 3 + i * 2.4]); } const o = mkBulbs(pts[0], pts[pts.length - 1], { key: l[0] + l[1] + 0.3 }); o.pts = pts.flat(); o.n = pts.length; o.cols = new Uint8Array(o.n).map((_, i) => i % 5); o.m = 50; F.push(o); }
    // church spires get glowing stars on top
    for (const r of CITY.recs) if (r.t === 'b' && r.lm === 1) { const bs = r.gen ? r.gen(0) : r.boxes, top = bs.filter(b => !b.nf).sort((a, b) => (b.z + b.h) - (a.z + a.h)); if (!top.length || top[0].z + top[0].h < 90) continue; for (const b of top.slice(0, top[1] && top[0].z + top[0].h - (top[1].z + top[1].h) < 4 ? 2 : 1)) { const x = r.x + b.x + b.w / 2, y = r.y + b.y + b.d / 2; F.push({ k: 'star', x, y, z: b.z + b.h + 5, sz: 4, c: 0xffe04a, ph: x, key: recKey(r, bs) + 1, m: 200 }); } }
  }
};

// ---------------------------------------------------------------- ambience (WebAudio, only while the music is on, like the other street sounds)
function evBed() {
  if (EV.bed || !AU.ctx) return EV.bed; const c = AU.ctx, n = c.createBufferSource(); n.buffer = AU.white; n.loop = true;
  const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 680; fl.Q.value = 0.8; const g = c.createGain(); g.gain.value = 0; n.connect(fl); fl.connect(g); g.connect(AU.str); n.start();
  return (EV.bed = { g, fl });
}
function evAmb(dt) {
  if (!AU.ctx || AU.ctx.state !== 'running') return; const b = evBed(); if (!b) return; const on = AU.playing ? 1 : 0, t = AU.ctx.currentTime, e = EV.cur;
  b.g.gain.setTargetAtTime(on * (e === 'qk' ? 0.075 : e ? 0.035 : 0) * (1 - Math.min(0.7, G.rain)), t, 0.8);
  if (!e || !on) return;
  EV.ambT = (EV.ambT === undefined ? 4 : EV.ambT) - dt; if (EV.ambT > 0) return;
  if (e === 'hw') { EV.ambT = rr(7, 16); const r = Math.random(); if (r < 0.4) fwSound('owl'); else if (r < 0.75) fwSound('musicbox'); else fwSound('giggle'); }
  else if (e === 'xm') { EV.ambT = rr(6, 14); EV.bellT = (EV.bellT === undefined ? 20 : EV.bellT) - 1; const r = Math.random(); if (EV.bellT <= 0) { EV.bellT = ri(4, 6); fwSound('church'); } else if (r < 0.6) fwSound('sleigh'); else if (r < 0.75) fwSound('carol'); }
  else EV.ambT = 999;
}
function fwSound(k, delay, n) {
  if (!AU.ctx || !AU.playing || AU.ctx.state !== 'running') return; const c = AU.ctx, t = c.currentTime + 0.02 + (delay || 0), d = AU.amb;
  if (k !== 'whistle' && EVN[EV.cur] && FW_TYPES.some(q => q[0] === k)) { if (FW.sndN > 5) return; FW.sndN++; }
  EV.stats.snd++;
  const fwk = clamp((n || 60) / 70, 0.5, 1.4);
  if (k === 'whistle') { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(rr(600, 800), t); o.frequency.exponentialRampToValueAtTime(rr(1800, 2600), t + 1); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.006, t + 0.15); g.gain.linearRampToValueAtTime(0.0001, t + 1.1); o.connect(g); g.connect(d); o.start(t); o.stop(t + 1.2); nz(t, 1, 0.006, 'highpass', 5000, d); }
  else if (k === 'cheer') { const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = AU.white; s.loop = true; fl.type = 'bandpass'; fl.frequency.value = 1050; fl.Q.value = 0.6; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.8); g.gain.linearRampToValueAtTime(0.0001, t + 3.2); s.connect(fl); fl.connect(g); g.connect(AU.str); s.start(t); s.stop(t + 3.3); }
  else if (k === 'owl') { for (const [dt2, f] of [[0, 410], [0.32, 380], [0.75, 395]]) { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(f, t + dt2); o.frequency.linearRampToValueAtTime(f * 0.9, t + dt2 + 0.22); env(g, t + dt2, 0.05, 0.018, 0.2); o.connect(g); g.connect(d); o.start(t + dt2); o.stop(t + dt2 + 0.32); } }
  else if (k === 'musicbox') { const sc = [69, 72, 74, 76, 79, 81, 84]; let tt = t; for (let i = 0, m = ri(4, 6); i < m; i++) { const f = mtof(sp(Math.random, sc) + 12); tone('triangle', f, tt, 0.003, 0.016, 0.9, d); tone('sine', f * 2, tt, 0.002, 0.006, 0.4, d); tt += rr(0.22, 0.42); } }
  else if (k === 'giggle') { for (let i = 0; i < 6; i++) tone('sine', rr(900, 1400), t + i * 0.09, 0.005, 0.006, 0.07, d, 0, 1.15); }
  else if (k === 'sleigh') { for (let i = 0, m = ri(5, 9); i < m; i++) { const tt = t + i * 0.11 + rr(0, 0.03); nz(tt, 0.06, 0.03, 'bandpass', 6200, d); tone('sine', rr(4200, 5600), tt, 0.002, 0.008, 0.12, d); } }
  else if (k === 'church') { for (let s = 0; s < 3; s++) for (const [m, a] of [[1, 0.028], [2, 0.012], [2.4, 0.01], [3, 0.008], [4.2, 0.005]]) tone('sine', 196 * m, t + s * 2.2, 0.004, a, 3.2, d); }
  else if (k === 'carol') { const mel = [76, 76, 76, 0, 76, 76, 76, 0, 76, 79, 72, 74, 76]; mel.forEach((m, i) => { if (m) tone('triangle', mtof(m), t + i * 0.24, 0.004, 0.018, 0.4, d); }); }
  else {   // a firework burst: deep boom, a crack, and crackle / sizzle for glitter shells
    nz(t, 1.1, 0.16 * fwk, 'lowpass', rr(110, 170), d); nz(t, 0.16, 0.08 * fwk, 'bandpass', 900, d); tone('sine', rr(46, 62), t, 0.004, 0.1 * fwk, 0.55, d);
    if (k === 'strobe' || k === 'kamuro' || k === 'crossette') for (let i = 0; i < 22; i++) nz(t + 0.45 + rr(0, 1.3), 0.012, rr(0.02, 0.045), 'highpass', 2600, d);
    if (k === 'willow' || k === 'kamuro') nz(t + 0.25, 2.4, 0.02, 'highpass', 4200, d);
  }
}
