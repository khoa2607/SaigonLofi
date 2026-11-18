'use strict';
// ===== Sài Gòn Lofi — city layout, ground painter, static world assembly, navigation grid =====
const G_YARD = 0, G_ROAD = 1, G_SIDE = 2, G_ZEB = 3, G_ALLEY = 4, G_GRASS = 5, G_PATH = 6, G_PLAZA = 7, G_PAD = 8, G_WATER = 9, G_RIVER = 10, G_BANK = 11, G_PROM = 12, G_PIER = 13, G_BRIDGE = 14;
const GT = new Uint8Array(N * N), BLK = new Uint8Array(N * N), PAVE = new Uint8Array(N * N), WALK = new Uint8Array(N * N);
const ROADS_H = [38, 78, 124], ROADS_V = [30, 74, 112], RW = 4, SW = 3;
const XS = [[0, 30], [34, 74], [78, 112], [116, 160]], YS = [[0, 38], [42, 78], [82, 124], [128, 160]];
const KINDS = [['shops', 'church', 'dinh', 'shops'], ['shops', 'hero', 'market', 'opera'], ['villa', 'mix', 'park', 'low'], ['low', 'low', 'low', 'low']];
const gi = (x, y) => y * N + x, tc = t => t * T + T / 2;
const CITY = { recs: [], trees: [], lamps: [], actors: [], signals: [], stands: [] };
const POI = { doors: [], cafe: [], eat: [], drink: [], barber: [], bench: [], ride: [], shelter: [], market: [], look: [], flowers: [] };
const roadH = ty => { for (let i = 0; i < 3; i++) if (ty >= ROADS_H[i] && ty < ROADS_H[i] + RW) return i; return -1; };
const roadV = tx => { for (let i = 0; i < 3; i++) if (tx >= ROADS_V[i] && tx < ROADS_V[i] + RW) return i; return -1; };
function fill(x0, y0, x1, y1, t) { for (let y = Math.max(0, y0); y < Math.min(N, y1); y++) for (let x = Math.max(0, x0); x < Math.min(N, x1); x++) GT[gi(x, y)] = t; }
const blockAt = (wx, wy) => { const x = Math.floor(wx / T), y = Math.floor(wy / T); if (x >= 0 && y >= 0 && x < N && y < N) BLK[gi(x, y)] = 1; };
const isBlk = (tx, ty) => tx < 0 || ty < 0 || tx >= N || ty >= N || BLK[gi(tx, ty)] === 1;
// a building record: `g` is a box list, or a function era -> box list for buildings that change with the era. o: {e0, e1} = eras it exists in
const NOTREE = [];
function addB(g, tx, ty, tw, td, o) { o = o || {}; if (o.lm) NOTREE.push({ x0: tx - 1, y0: ty - 1, x1: tx + tw + 2, y1: ty + td + 3 }); const fn = typeof g === 'function'; CITY.recs.push({ t: 'b', boxes: fn ? null : g, gen: fn ? g : null, x: tx * T, y: ty * T, spr: {}, e0: o.e0 || 0, e1: o.e1 === undefined ? 3 : o.e1, lm: o.lm || 0, tw, td, keep: !!o.keep }); for (let y = ty; y < ty + td; y++) for (let x = tx; x < tx + tw; x++) if (!o.keep && x >= 0 && y >= 0 && x < N && y < N) { GT[gi(x, y)] = G_PAD; BLK[gi(x, y)] = 1; } }
const ERA_SWAP = { parked: [['parked', 0, 1], ['pscooter', 2, 2], ['ebike', 3, 3]], vend: [['tuThuoc', 0, 0], ['vend', 1, 3]], booth: [['booth', 0, 1], ['atm', 2, 3]], tuThuoc: [['tuThuoc', 0, 1], ['pot', 2, 3]] };   // river.js adds rail + rlamp
function addP(name, p, o) { o = o || {}; const sw = o.e0 === undefined && o.e1 === undefined ? ERA_SWAP[name] : null; for (const q of sw || [[name, o.e0 || 0, o.e1 === undefined ? 3 : o.e1]]) CITY.recs.push({ t: 'p', name: q[0], x: p[0], y: p[1], v: o.v || 0, m: !!o.mirror, kb: o.kb || 0, only: o.only, e0: q[1], e1: q[2], tet: o.tet }); if (o.block) blockAt(p[0], p[1]); if (name === 'cartPho') (CITY.steam || (CITY.steam = [])).push([p[0] - 2.6, p[1]]); if (name === 'lamp' || name === 'pole') CITY.lamps.push(o.mirror ? [p[0] + (name === 'pole' ? 6.8 : 0), p[1], name === 'pole' ? 29 : 23] : [p[0], p[1] + (name === 'pole' ? 6.8 : 0), name === 'pole' ? 29 : 23]); }
function addT(spc, wx, wy, v) { const r = { t: 't', spc, v: v || 0, x: wx, y: wy, ph: hash2(wx, wy) * 9 }; CITY.recs.push(r); CITY.trees.push(r); blockAt(wx, wy); }
function actor(p, dir, type, o) { CITY.actors.push(Object.assign({ x: p[0], y: p[1], dir, type: type || 'baba', pose: 0 }, o)); }

// ----- shop frontage props + points of interest -----
function spill(R, shop, F, w) {
  const out = F.od, al = F.ad, wall = (out + 2) % 4, back = (al + 2) % 4;
  const P = (a, b) => [F.X0 + F.ax[0] * a + F.ox[0] * b, F.Y0 + F.ax[1] * a + F.ox[1] * b];
  const put = (name, a, b, v, blk, kb) => addP(name, P(a, b), { v: v || 0, mirror: F.m, block: blk !== false, kb });
  const seat = (list, a, b, dir, k) => { const p = P(a, b), q = P(clamp(a, 4, w - 4), 12); list.push({ x: p[0], y: p[1], dir, vx: q[0], vy: q[1], k, ped: null }); };
  const d0 = P(w / 2, 12), d1 = P(w / 2, 1.5); POI.doors.push({ x: d0[0], y: d0[1], ix: d1[0], iy: d1[1], dir: wall, shop });
  const tableSet = (a, k) => { put('table', a, 4, si(R, 0, 2)); if (a - 4.4 > 2) { put('stool', a - 4.4, 4, si(R, 0, 3), false); seat(POI.cafe, a - 4.4, 4, al, k); } if (a + 4.4 < w - 2) { put('stool', a + 4.4, 4, si(R, 0, 3), false); seat(POI.cafe, a + 4.4, 4, back, k); } put('stool', a, 8.6, si(R, 0, 3), false); seat(POI.cafe, a, 8.6, wall, k); };
  if (!shop) { if (R() < 0.55) put('pot', 2.5, 2.5, si(R, 0, 5)); if (R() < 0.3) put('parked', w - 4, 4, si(R, 0, 7)); else if (R() < 0.3) put('parkedBike', w - 4, 4, si(R, 0, 4)); if (R() < 0.2) put('pot', w - 3, 2.5, si(R, 0, 5), false); return; }
  const S = SHOPS[shop];
  if (shop === 'cafe' || shop === 'bia') { tableSet(4, 'cafe'); tableSet(w - 4, 'cafe'); if (w >= 40) tableSet(w / 2 + 8, 'cafe'); if (R() < 0.7) put('parasol', 4, 5, si(R, 0, 4), false, 14); if (shop === 'bia') put('crates', w / 2, 2.8, 1, false); }
  else if (shop === 'hottoc') { put('mirror', w / 2 - 4, 0.6, 0, false); put('barberChair', w / 2 - 4, 5, 0); const p = P(w / 2 - 4, 5.6), q = P(w / 2 - 4, 12); POI.barber.push({ x: p[0], y: p[1], dir: out, vx: q[0], vy: q[1], k: 'barber', ped: null }); actor(P(w / 2 + 1.5, 4.5), back, 'office', { role: 'barber', apron: 1 }); put('pot', w - 3, 2.5, 3, false); }
  else if (shop === 'pho' || shop === 'com' || shop === 'che' || shop === 'banh') { put(shop === 'che' ? 'cartChe' : shop === 'banh' ? 'cartBanhmi' : 'cartPho', 5, 4.2, 0, true, 3); actor(P(12.5, 3.2), out, 'baba', { role: 'vendor', apron: 1 }); const p = P(5, 12); POI.eat.push({ x: p[0], y: p[1], dir: wall, icon: shop === 'banh' ? 'banhmi' : shop === 'che' ? 'cup' : 'pho', carry: shop === 'banh' ? 'banhmi' : shop === 'che' ? 'cup' : null, ped: null }); if (w >= 32) tableSet(w - 4, 'eat'); }
  else if (shop === 'taphoa') { put('crates', 4, 3.4, si(R, 0, 2)); put('vend', w - 4, 3.2, 0); const p = P(w - 4, 11.5); POI.drink.push({ x: p[0], y: p[1], dir: wall, icon: 'cup', carry: 'cup', ped: null, vend: 1 }); if (w >= 32) put('tuThuoc', 12, 3, 0); }
  else if (shop === 'suaxe') { put('tires', 3.5, 3.5, 0); put('parked', 11, 4, si(R, 0, 7)); if (w >= 32) put('parked', w - 5, 4, si(R, 0, 7)); actor(P(15.5, 5), back, 'worker', { role: 'mech', pose: 5 }); }
  else if (shop === 'evo') { addP('crates', P(4, 3.4), { v: 1, e0: 0, e1: 1 }); addP('table', P(5, 4.4), { v: 1, e0: 3 }); addP('stool', P(1.6, 8.4), { v: 2, e0: 3 }); addP('stool', P(8.6, 8.4), { v: 0, e0: 3 }); addP('pot', P(w - 3, 2.5), { v: 3 }); }
  else { if (R() < 0.6) put('pot', 2.5, 2.5, si(R, 0, 5)); if (R() < 0.45) put('parked', w - 4, 4.4, si(R, 0, 7)); }
  if (S.aw) { const p = P(w / 2 + 3, 3); POI.shelter.push({ x: p[0], y: p[1], ped: null }); }
}
// rows of shophouses. Row S: front on the block's +y sidewalk. Row E: front on the +x sidewalk.
function eraFloors(R, o) { const mx = o.maxF, f = [si(R, o.minF || 1, Math.min(mx, 3))]; f.push(Math.min(mx, f[0] + (R() < 0.5 ? 1 : 0))); f.push(Math.min(mx + 1, f[1] + (R() < 0.45 ? 1 : 0))); f.push(Math.min(mx + 1, f[2] + (R() < 0.3 ? 1 : 0))); return f; }
function lots(R, a, b) { const L = []; let x = a; while (x < b) { let wl = sp(R, [3, 3, 3, 4, 4, 5]); if (b - x - wl < 3) wl = b - x; L.push([x, wl]); x += wl; } return L; }
function rowS(R, B, xa, xb, o) {
  const iy1 = B.y1 - SW;
  for (const [x, wl] of lots(R, xa, xb)) {
    const td = si(R, 5, 7), shop = o.shops && o.shops.length ? o.shops.shift() : (R() < 0.6 ? sp(R, SHOP_KEYS) : null), fl = eraFloors(R, o), sw = R() < 0.3, seed = (R() * 1e9) | 0;
    addB(era => shophouse(mulberry32(seed), wl * T, td * T, { shop, floors: fl[era], sideWin: sw, era }), x, iy1 - td, wl, td);
    spill(R, shop, { X0: x * T, Y0: iy1 * T, ax: [1, 0], ox: [0, 1], ad: 0, od: 1, m: false }, wl * T);
  }
}
function rowE(R, B, ya, yb, o) {
  const ix1 = B.x1 - SW;
  for (const [y, wl] of lots(R, ya, yb)) {
    const td = si(R, 5, 7), shop = o.shops && o.shops.length ? o.shops.shift() : (R() < 0.6 ? sp(R, SHOP_KEYS) : null), fl = eraFloors(R, o), sw = R() < 0.3, ad = R() < 0.2 ? sp(R, ['KARAOKE', 'BIA 33', 'XE OM', 'COM']) : null, seed = (R() * 1e9) | 0;
    addB(era => mirrorBoxes(shophouse(mulberry32(seed), wl * T, td * T, { shop, floors: fl[era], sideWin: sw, ad, era })), ix1 - td, y, td, wl);
    spill(R, shop, { X0: ix1 * T, Y0: y * T, ax: [0, 1], ox: [1, 0], ad: 1, od: 0, m: true }, wl * T);
  }
}
function cornerLot(R, B, shop, floors) {
  const ix1 = B.x1 - SW, iy1 = B.y1 - SW;
  const seed = (R() * 1e9) | 0; addB(era => shophouse(mulberry32(seed), 48, 48, { shop, floors: Math.max(2, floors - 1 + Math.min(era, 2)), corner: true, era }), ix1 - 6, iy1 - 6, 6, 6);
  spill(R, shop, { X0: (ix1 - 6) * T, Y0: iy1 * T, ax: [1, 0], ox: [0, 1], ad: 0, od: 1, m: false }, 48);
  if (shop === 'cafe') { const F = { X0: ix1 * T, Y0: (iy1 - 6) * T, ax: [0, 1], ox: [1, 0], ad: 1, od: 0, m: true }; const P = (a, b) => [F.X0 + b, F.Y0 + a]; for (const a of [6, 26]) { addP('table', P(a, 4), { v: 1, block: true }); addP('stool', P(a + 4.4, 4), { v: 2 }); addP('stool', P(a, 8.6), { v: 0 }); const q = P(a, 12); POI.cafe.push({ x: P(a + 4.4, 4)[0], y: P(a + 4.4, 4)[1], dir: 3, vx: q[0], vy: q[1], k: 'cafe', ped: null }, { x: P(a, 8.6)[0], y: P(a, 8.6)[1], dir: 2, vx: q[0], vy: q[1], k: 'cafe', ped: null }); } addP('parasol', P(26, 5), { v: 2, kb: 14 }); }
}
// low houses / yards / trees behind the street rows
function infill(R, B, xa, ya, xb, yb, maxF) {
  for (let y = ya; y < yb - 3;) {
    const hh = Math.min(si(R, 4, 6), yb - y);
    for (let x = xa; x < xb - 3;) {
      const ww = Math.min(si(R, 4, 6), xb - x); let free = true;
      for (let yy = y; yy < y + hh && free; yy++) for (let xx = x; xx < x + ww; xx++) if (GT[gi(xx, yy)] !== G_YARD) { free = false; break; }
      if (free) {
        const r = R(), edge = y === ya || x === xa;
        if (r < 0.5) { const fl = edge ? si(R, 1, 2) : si(R, 1, maxF), seed = (R() * 1e9) | 0, w2 = (ww - 1) * T, d2 = (hh - 1) * T; addB(era => backHouse(mulberry32(seed), w2, d2, fl, era), x, y, ww - 1, hh - 1); }
        else if (r < 0.82) { addT(sp(R, ['me', 'bang', 'dau', 'mai', 'cau', 'bang']), tc(x) + sr(R, 4, ww * T - 12), tc(y) + sr(R, 4, hh * T - 12), si(R, 0, 3)); if (R() < 0.5) addP(sp(R, ['sack', 'crates', 'pot', 'parkedBike']), [tc(x + 1), tc(y + hh - 2)], { v: si(R, 0, 4) }); }
      }
      x += ww;
    }
    y += hh;
  }
}
// a plot that holds low houses in the early eras and a tower from era e0 on
function towerSite(R, x, y, w, h, e0, gen) {
  const hw = w >> 1, hh = h >> 1;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const seed = (R() * 1e9) | 0, fl = si(R, 1, 3), ww = (i ? w - hw : hw) - 1, dd = (j ? h - hh : hh) - 1; addB(era => backHouse(mulberry32(seed), ww * T, dd * T, fl, era), x + i * hw, y + j * hh, ww, dd, { e1: e0 - 1 }); }
  addB(gen, x, y, w, h, { e0 });
}
function genShops(B, R, o) {
  const ix0 = B.x0 + SW, iy0 = B.y0 + SW, ix1 = B.x1 - SW, iy1 = B.y1 - SW;
  let xs = ix0, alley = -1;
  if (o.alley && ix1 - ix0 > 22) { alley = ix0 + si(R, 8, ix1 - ix0 - 18); fill(alley, iy0, alley + 2, iy1, G_ALLEY); addP('gate', [(alley + 1) * T, iy1 * T - 2], { v: si(R, 0, 4), kb: 2 }); }
  if (o.big === 'chungcu') { const w = 14, cseed = (R() * 1e9) | 0; addB(era => chungcu(mulberry32(cseed), w * T, 6 * T, era), ix0, iy1 - 6, w, 6); for (let k = 0; k < 3; k++) { const p = [(ix0 + 2 + k * 5) * T, iy1 * T + 12]; POI.doors.push({ x: p[0], y: p[1], ix: p[0], iy: iy1 * T + 1.5, dir: 3 }); } addP('parked', [(ix0 + 4) * T, iy1 * T + 4], { v: 2, block: true }); addP('parked', [(ix0 + 5) * T + 2, iy1 * T + 4], { v: 4, block: true }); addP('cartChe', [(ix0 + 9) * T, iy1 * T + 4.4], { block: true, kb: 3 }); actor([(ix0 + 10) * T + 3, iy1 * T + 3.4], 1, 'baba', { role: 'vendor' }); POI.eat.push({ x: (ix0 + 9) * T, y: iy1 * T + 12, dir: 3, icon: 'cup', carry: 'cup', ped: null }); xs = ix0 + w; }
  if (o.big === 'ducba') { fill(ix0, iy1 - 15, ix0 + 12, iy1, G_PLAZA); addB(ducba(80, 104), ix0 + 1, iy1 - 13, 10, 13, { lm: 1 }); POI.doors.push({ x: (ix0 + 6) * T, y: iy1 * T + 12, ix: (ix0 + 6) * T, iy: iy1 * T + 1, dir: 3 }); addP('mary', [(ix0 + 6) * T, iy1 * T + 20], { block: true }); alley = ix0 + 12; fill(alley, iy0, alley + 2, iy1, G_ALLEY); addP('gate', [(alley + 1) * T, iy1 * T - 2], { v: 2, kb: 2 }); xs = alley + 2; alley = -1; }
  if (o.big === 'nhahat') { fill(ix0, iy1 - 12, ix0 + 11, iy1, G_PLAZA); addB(nhahat(72, 88), ix0 + 1, iy1 - 11, 9, 11, { lm: 1 }); POI.doors.push({ x: (ix0 + 5.5) * T, y: iy1 * T + 12, ix: (ix0 + 5.5) * T, iy: iy1 * T + 1, dir: 3 }); xs = ix0 + 11; }
  if (alley >= 0 && alley > xs + 3) { rowS(R, B, xs, alley, o); rowS(R, B, alley + 2, ix1 - 6, o); } else rowS(R, B, xs, ix1 - 6, o);
  cornerLot(R, B, o.corner || sp(R, SHOP_KEYS), Math.max(2, o.maxF - (o.cornerLow ? 1 : 0)));
  if (o.east === 'buudien') { fill(ix1 - 9, iy0, ix1, iy0 + 18, G_PLAZA); addB(mirrorBoxes(buudien(112, 64)), ix1 - 8, iy0 + 3, 8, 14, { lm: 2 }); POI.doors.push({ x: ix1 * T + 12, y: (iy0 + 10) * T, ix: ix1 * T + 1, iy: (iy0 + 10) * T, dir: 2 }); addP('mailbox', [ix1 * T + 4, (iy0 + 6) * T], { block: true }); addP('booth', [ix1 * T + 4, (iy0 + 14) * T], { block: true }); addP('flag', [(ix1 - 4) * T, (iy0 + 1) * T + 4], { block: true }); rowE(R, B, iy0 + 18, iy1 - 6, o); }
  else rowE(R, B, iy0, iy1 - 6, o);
  for (const t of o.sites || []) towerSite(R, t[0], t[1], t[2], t[3], t[4], t[5]);
  infill(R, B, ix0, iy0, ix1 - 7, iy1 - 8, Math.min(3, o.maxF));
}
function genPark(B, R) {
  const ix0 = B.x0 + SW, iy0 = B.y0 + SW, ix1 = B.x1 - SW, iy1 = B.y1 - SW, cx = (ix0 + ix1) >> 1, cy = (iy0 + iy1) >> 1;
  fill(ix0, iy0, ix1, iy1, G_GRASS); fill(cx - 1, iy0, cx + 1, iy1, G_PATH); fill(ix0, cy - 1, ix1, cy + 1, G_PATH);
  fill(ix0, iy0, ix0 + 9, iy0 + 7, G_PLAZA); fill(cx - 4, cy - 4, cx + 4, cy + 4, G_PLAZA);
  addP('fountain', [cx * T, cy * T], {}); for (let y = cy - 2; y < cy + 2; y++) for (let x = cx - 2; x < cx + 2; x++) BLK[gi(x, y)] = 1;
  const px = cx + 8, py = cy + 9; for (let y = -6; y <= 6; y++) for (let x = -7; x <= 7; x++) if ((x * x) / 46 + (y * y) / 30 + hash2(x, y) * 0.14 < 1) { const g = gi(px + x, py + y); if (px + x < ix1 - 1 && py + y < iy1 - 1) { GT[g] = G_WATER; BLK[g] = 1; } }
  addP('statue', [(ix0 + 5) * T, (iy0 + 3) * T + 4], { block: true }); addP('metro', [(ix0 + 2) * T + 4, (iy0 + 5) * T + 2], { e0: 3, kb: 4 }); blockAt((ix0 + 2) * T + 4, (iy0 + 5) * T + 2); addP('flag', [(ix0 + 1) * T + 4, (iy0 + 1) * T], { block: true });
  addP('cartChe', [(ix0 + 7) * T + 4, (iy0 + 5) * T + 4], { block: true, kb: 3 }); actor([(ix0 + 7) * T + 4, (iy0 + 4) * T + 2], 1, 'baba', { role: 'vendor' }); POI.eat.push({ x: (ix0 + 7) * T + 4, y: (iy0 + 6) * T + 6, dir: 3, icon: 'cup', carry: 'cup', ped: null });
  const benchAt = (wx, wy, m) => { addP('bench', [wx, wy], { mirror: m, block: true }); for (const k of [-3.6, 3.6]) POI.bench.push(m ? { x: wx + 1.5, y: wy + k, dir: 0, vx: wx + 10, vy: wy, k: 'bench', ped: null } : { x: wx + k, y: wy + 1.5, dir: 1, vx: wx, vy: wy + 10, k: 'bench', ped: null }); };
  for (let x = ix0 + 3; x < ix1 - 3; x += 6) if (Math.abs(x - cx) > 5) benchAt(tc(x) + 4, (cy - 2) * T + 5, false);
  for (let y = iy0 + 9; y < iy1 - 3; y += 6) if (Math.abs(y - cy) > 5) benchAt((cx - 2) * T + 5, tc(y) + 4, true);
  for (const [x, y] of [[cx - 5, cy - 5], [cx + 4, cy - 5], [cx - 5, cy + 4], [cx + 4, cy + 4]]) addP('lamp', [tc(x), tc(y)], { block: true });
  for (let y = iy0 + 9; y < iy1; y += 9) addP('lamp', [tc(cx + 1), tc(y)], { block: true });
  for (let k = 0; k < 4; k++) { const p = [(cx - 4 + (k % 2) * 7) * T + 4, (cy - 4 + (k >> 1) * 7) * T + 4]; addP('planter', p, { mirror: k % 2 === 1 }); POI.flowers.push(p); }
  for (let i = 0; i < 46; i++) { const x = si(R, ix0, ix1 - 1), y = si(R, iy0, iy1 - 1), g = gi(x, y); if (GT[g] !== G_GRASS || BLK[g] || (x < ix0 + 11 && y < iy0 + 9)) continue; let near = false; for (const t of CITY.trees) if (Math.abs(t.x - tc(x)) + Math.abs(t.y - tc(y)) < 22) { near = true; break; } if (near) continue; addT(sp(R, ['dau', 'me', 'bang', 'mai', 'mai', 'me', 'cau', 'dau']), tc(x), tc(y), si(R, 0, 3)); if (R() < 0.3) POI.flowers.push([tc(x) + 6, tc(y) + 6]); }
  for (let i = 0; i < 5; i++) { const x = si(R, ix0 + 2, ix1 - 3), y = si(R, iy0 + 9, iy1 - 3); if (GT[gi(x, y)] === G_GRASS && !BLK[gi(x, y)]) { addP('leafpile', [tc(x), tc(y)], { only: 'fall' }); addP('snowman', [tc(x), tc(y)], { only: 'winter' }); } }
  for (let x = ix0 + 2; x < ix1; x += 5) { POI.look.push({ x: tc(x), y: tc(cy), ped: null }); } for (let y = iy0 + 2; y < iy1; y += 5) POI.look.push({ x: tc(cx), y: tc(y), ped: null });
  POI.look.push({ x: tc(px - 9), y: tc(py), ped: null, dir: 0 }, { x: tc(px), y: tc(py - 8), ped: null, dir: 1 });
  CITY.kite = [tc(cx + 6), tc(cy - 8)]; CITY.pond = [tc(px), tc(py)];
}
function genMarket(B, R) {
  const ix0 = B.x0 + SW, iy0 = B.y0 + SW, ix1 = B.x1 - SW, iy1 = B.y1 - SW;
  fill(ix0, iy0, ix1, iy1, G_PLAZA);
  addB(era => market(160, 112, era), ix0 + 1, iy1 - 14, 20, 14, { lm: 1 });
  for (const a of [28, 60, 100, 132]) { const p = [(ix0 + 1) * T + a, iy1 * T + 12]; POI.doors.push({ x: p[0], y: p[1], ix: p[0], iy: iy1 * T + 1.5, dir: 3, shop: 'cho' }); }
  addB(mirrorBoxes(ubnd(96, 56)), ix1 - 7, iy0 + 1, 7, 12, { lm: 2 }); POI.doors.push({ x: ix1 * T + 12, y: (iy0 + 7) * T, ix: ix1 * T + 1, iy: (iy0 + 7) * T, dir: 2 });
  rowE(R, B, iy0 + 14, iy1, { maxF: 3, shops: ['vang', 'may', 'taphoa', 'dientu', 'xoso', 'thuoc'] });
  rowS(R, { y1: iy1 - 22 + SW }, ix0 + 1, ix1 - 8, { maxF: 3, shops: ['com', 'sach', 'photo'] });
  let k = 0; for (const yy of [iy1 - 20, iy1 - 17]) for (let x = ix0 + 2; x < ix1 - 9; x += 3, k++) {
    const p = [tc(x), tc(yy)]; if (hash2(x, yy) < 0.2) continue; addP('stall', p, { v: k, block: true }); if (k % 2 === 0) addP('parasol', [p[0] - 2, p[1] - 2], { v: k >> 1, kb: 16 });
    if (k % 3 === 0) actor([p[0], p[1] - 6.5], 1, sp(R, ['baba', 'dobo', 'oldlady']), { role: 'vendor' });
    POI.market.push({ x: p[0], y: p[1] + 9, dir: 3, ped: null });
  }
  for (const a of [10, 150]) addP('flag', [(ix0 + 1) * T + a, iy1 * T + 3], { block: true });
  addP('parkedCyclo', [(ix0 + 1) * T + 70, iy1 * T + 19], { v: 1, block: true });
  for (let y = iy0 + 1; y < iy1 - 24; y += 4) addT(sp(R, ['me', 'bang']), tc(ix0), tc(y), si(R, 0, 3));
}
function genChurch(B, R) {
  const ix0 = B.x0 + SW, iy0 = B.y0 + SW, ix1 = B.x1 - SW, iy1 = B.y1 - SW, cx = ix0 + 13;
  fill(cx - 2, iy1 - 16, cx + 12, iy1, G_PLAZA);
  addB(church(80, 96), cx, iy1 - 13, 10, 12, { lm: 1 });
  POI.doors.push({ x: (cx + 5) * T, y: iy1 * T + 12, ix: (cx + 5) * T, iy: iy1 * T + 1, dir: 3 });
  rowS(R, B, ix0, cx - 2, { maxF: 4 }); rowS(R, B, cx + 12, ix1 - 6, { maxF: 4 }); cornerLot(R, B, 'sach', 3); rowE(R, B, iy0, iy1 - 6, { maxF: 4 });
  infill(R, B, ix0, iy0, ix1 - 7, iy1 - 17, 3);
}
function genDinh(B, R) {
  const ix0 = B.x0 + SW, iy0 = B.y0 + SW, ix1 = B.x1 - SW, iy1 = B.y1 - SW, cx = (ix0 + ix1) >> 1;
  fill(ix0, iy0, ix1, iy1, G_GRASS); fill(cx - 2, iy0 + 12, cx + 2, iy1, G_PATH); fill(cx - 6, iy0 + 16, cx + 6, iy0 + 24, G_PLAZA);
  addB(dinh(160, 72), cx - 10, iy0 + 2, 20, 9, { lm: 1 }); addP('fountain', [cx * T, (iy0 + 20) * T], {}); for (let y = iy0 + 18; y < iy0 + 22; y++) for (let x = cx - 2; x < cx + 2; x++) BLK[gi(x, y)] = 1;
  POI.doors.push({ x: cx * T, y: (iy0 + 14) * T, ix: cx * T, iy: (iy0 + 11) * T + 2, dir: 3 });
  for (let x = ix0; x < ix1; x += 3) { addP('fence', [tc(x) + 4, iy1 * T - 2], {}); }
  for (let i = 0; i < 30; i++) { const x = si(R, ix0, ix1 - 1), y = si(R, iy0 + 12, iy1 - 2); if (GT[gi(x, y)] === G_GRASS && !BLK[gi(x, y)] && Math.abs(x - cx) > 7) addT(sp(R, ['dau', 'me', 'cau', 'dau', 'bang']), tc(x), tc(y), si(R, 0, 3)); }
}
function genVilla(B, R) {
  const ix0 = B.x0 + SW, iy0 = B.y0 + SW, ix1 = B.x1 - SW, iy1 = B.y1 - SW;
  fill(ix0, iy0, ix1, iy1, G_GRASS);
  addB(mirrorBoxes(villa(R, 88, 64, false)), ix1 - 9, iy0 + 2, 8, 11); addB(mirrorBoxes(villa(R, 72, 64, false)), ix1 - 9, iy0 + 16, 8, 9);
  addB(villa(R, 112, 64, true), ix0 + 2, iy1 - 9, 14, 8); fill(ix0 + 1, iy1 - 1, ix0 + 18, iy1, G_PATH);
  POI.doors.push({ x: (ix0 + 9) * T, y: iy1 * T + 12, ix: (ix0 + 9) * T, iy: iy1 * T - 6, dir: 3, school: 1 });
  addP('flag', [(ix0 + 18) * T, (iy1 - 2) * T], { block: true });
  for (let i = 0; i < 26; i++) { const x = si(R, ix0, ix1 - 1), y = si(R, iy0, iy1 - 1); if (GT[gi(x, y)] === G_GRASS && !BLK[gi(x, y)]) addT(sp(R, ['dau', 'me', 'cau', 'mai', 'bang']), tc(x), tc(y), si(R, 0, 3)); }
}
// trees / poles / lamps / parked bikes along the kerb
function furniture(B, R) {
  const { x0, y0, x1, y1 } = B, facade = B.kind !== 'park' && B.kind !== 'villa' && B.kind !== 'dinh';
  const free = (x, y) => x >= 0 && y >= 0 && x < N && y < N && GT[gi(x, y)] === G_SIDE && !BLK[gi(x, y)] && !NOTREE.some(r => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1);
  let last = null;
  for (let x = x0 + 5, i = 0; x < x1 - 5; x += 5, i++) {                 // south kerb
    const y = y1 - 1; if (!free(x, y)) { continue; }
    if (i % 2 === 0 && x1 < N) { addP('pole', [tc(x), tc(y) - 1], { v: i % 3, block: true }); if (last) CITY.recs.push({ t: 'w', x: last[0], y: last[1], dx: tc(x) - last[0], dy: 0, e0: 0, e1: 2 }); last = [tc(x), tc(y) - 1]; }
    else addT(sp(R, facade ? ['dau', 'me', 'dau', 'bang'] : ['me', 'bang', 'mai']), tc(x), tc(y), si(R, 0, 3));
    if (facade && R() < 0.3 && free(x + 2, y)) addP(R() < 0.75 ? 'parked' : 'parkedBike', [tc(x + 2), tc(y)], { v: si(R, 0, 7), block: true });
  }
  last = null;
  for (let y = y0 + 5, i = 0; y < y1 - 5; y += 5, i++) {                 // east kerb
    const x = x1 - 1; if (!free(x, y)) continue;
    if (i % 2 === 0) { addP('pole', [tc(x) - 1, tc(y)], { v: (i + 1) % 3, mirror: true, block: true }); if (last) CITY.recs.push({ t: 'w', x: last[0], y: last[1], dx: 0, dy: tc(y) - last[1], e0: 0, e1: 2 }); last = [tc(x) - 1, tc(y)]; }
    else addT(sp(R, ['dau', 'me', 'dau', 'bang']), tc(x), tc(y), si(R, 0, 3));
  }
  for (let x = x0 + 4, i = 0; x < x1 - 4; x += 6, i++) if (free(x, y0)) { if (i % 3 === 1) addP('lamp', [tc(x), tc(y0)], { block: true }); else addT(sp(R, ['me', 'bang', 'dau', 'mai']), tc(x), tc(y0), si(R, 0, 3)); }
  for (let y = y0 + 4, i = 0; y < y1 - 4; y += 6, i++) if (free(x0, y)) { if (i % 3 === 1) addP('lamp', [tc(x0), tc(y)], { block: true }); else addT(sp(R, ['me', 'bang', 'dau', 'mai']), tc(x0), tc(y), si(R, 0, 3)); }
}
function planCity() {
  const R0 = mulberry32(1995);
  for (const h of ROADS_H) fill(ROADS_V[0], h, N, h + RW, G_ROAD);          // horizontal streets end at the riverside road
  for (const v of ROADS_V) fill(v, 0, v + RW, N, G_ROAD);
  for (const v of ROADS_V) for (const h of ROADS_H) {
    if (v !== ROADS_V[0]) fill(v - 2, h, v, h + RW, G_ZEB); fill(v + RW, h, v + RW + 2, h + RW, G_ZEB); fill(v, h - 2, v + RW, h, G_ZEB); fill(v, h + RW, v + RW, h + RW + 2, G_ZEB);
    CITY.signals.push([(v + RW) * T + 4, (h + RW) * T + 4, 0], [(v + RW) * T + 4, (h - 1) * T + 4, 1]); if (v !== ROADS_V[0]) CITY.signals.push([(v - 1) * T + 4, (h - 1) * T + 4, 0], [(v - 1) * T + 4, (h + RW) * T + 4, 1]);
  }
  const blocks = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) blocks.push({ i, j, x0: XS[i][0], x1: XS[i][1], y0: YS[j][0], y1: YS[j][1], kind: KINDS[j][i] });
  for (const B of blocks) {
    if (B.i === 0) continue;                                        // column 0 becomes the riverfront
    const R = mulberry32(B.i * 131 + B.j * 977 + 7), pv = si(R, 0, 2), s = B.i + B.j, maxF = s <= 2 ? 5 : s === 3 ? 4 : s === 4 ? 3 : 2;
    fill(B.x0, B.y0, B.x1, B.y1, G_SIDE); for (let y = B.y0; y < B.y1; y++) for (let x = B.x0; x < B.x1; x++) PAVE[gi(x, y)] = pv;
    fill(B.x0 + SW, B.y0 + SW, B.x1 - SW, B.y1 - SW, G_YARD);
    if (B.kind === 'hero') genShops(B, R, { maxF: 4, minF: 1, sites: [[55, 56, 8, 8, 2, bitexco()], [38, 46, 10, 10, 2, vincom()]], alley: false, big: 'ducba', corner: 'cafe', cornerLow: true, shops: ['photo', 'com', 'evo', 'karaoke', 'hottoc', 'taphoa', 'pho', 'suaxe', 'dientu', 'evo', 'vang', 'sach', 'bia', null, 'may'] });
    else if (B.kind === 'mix') genShops(B, R, { maxF: 4, minF: 1, sites: [[38, 87, 8, 8, 3, landmark81()], [39, 99, 6, 5, 3, aptTower(mulberry32(81), 48, 40, 13)], [48, 99, 6, 5, 3, aptTower(mulberry32(82), 48, 40, 9)]], big: 'chungcu', east: 'buudien', alley: false, corner: 'banh', shops: ['xoso', 'evo', 'suaxe', null, 'hottoc', 'cafe', 'taphoa', 'pho', 'evo', 'photo'] });
    else if (B.kind === 'park') genPark(B, R);
    else if (B.kind === 'market') genMarket(B, R);
    else if (B.kind === 'church') genChurch(B, R);
    else if (B.kind === 'villa') genVilla(B, R);
    else if (B.kind === 'dinh') genDinh(B, R);
    else if (B.kind === 'opera') genShops(B, R, { maxF: 3, minF: 2, big: 'nhahat', alley: false });
    else genShops(B, R, { maxF, minF: maxF > 3 ? 2 : 1, alley: R() < 0.7, big: B.kind === 'shops' && R() < 0.35 ? 'chungcu' : null });
  }
  for (const s of CITY.signals) { addP('signal', [s[0], s[1]], { block: true }); }
  genRiverfront();
  // xe ôm + xích lô stands near the centre crossroads (kerb row). lane: [axis, dir, centre coordinate]
  const HY = ROADS_H[1] * T, VX = ROADS_V[1] * T;
  const stand = (kind, x, y, dir, lane, p, wx, wy) => { CITY.stands.push({ kind, x, y, dir, lane, p, wx, wy, state: 'parked', t: 0, v: ri(0, 7) }); blockAt(x, y); };
  stand('xeom', VX - 4, HY - 60, 1, ['y', 1, VX + 8], HY - 60, VX - 13, HY - 60); stand('xeom', VX - 4, HY - 74, 1, ['y', 1, VX + 8], HY - 74, VX - 13, HY - 74);
  stand('xeom', VX - 76, HY - 4, 2, ['x', -1, HY + 8], VX - 76, VX - 76, HY - 13);
  stand('cyclo', VX + 76, HY + 36, 0, ['x', 1, HY + 24], VX + 76, VX + 76, HY + 46); stand('cyclo', VX + 102, HY + 36, 0, ['x', 1, HY + 24], VX + 102, VX + 102, HY + 46);
  stand('xeom', VX + 36, HY + 110, 3, ['y', -1, VX + 24], HY + 110, VX + 46, HY + 110);
  // kerbside taxi / cyclo hailing spots
  for (const [x, y, lane, p] of [[VX - 150, HY - 4, ['x', -1, HY + 8], VX - 150], [VX + 150, HY - 4, ['x', -1, HY + 8], VX + 150], [VX - 4, HY - 150, ['y', 1, VX + 8], HY - 150], [VX - 130, HY + 36, ['x', 1, HY + 24], VX - 130], [VX + 36, HY - 120, ['y', -1, VX + 24], HY - 120], [VX - 4, HY + 150, ['y', 1, VX + 8], HY + 150]])
    { POI.ride.push({ x, y, lane, p, ped: null, veh: null }); BLK[gi(Math.floor(x / T), Math.floor(y / T))] = 2; }
  for (const B of blocks) if (B.i > 0) furniture(B, mulberry32(B.i * 31 + B.j * 71 + 3));
  // Tết: mai pots and red lanterns at every shop / landmark door (only drawn while G.tet)
  for (const d of POI.doors) { const out = DIRV[(d.dir + 2) % 4], pr = [-out[1], out[0]]; addP('maiTet', [d.ix + out[0] * 5 + pr[0] * 11, d.iy + out[1] * 5 + pr[1] * 11], { tet: 1, e0: 0, e1: 3, v: 1 }); if (d.shop) addP('lanterns', [d.ix + out[0] * 1.8, d.iy + out[1] * 1.8], { tet: 1, e0: 0, e1: 3, mirror: out[0] === 1 }); }
  // walk costs
  for (let i = 0; i < N * N; i++) { const t = GT[i]; WALK[i] = BLK[i] === 1 ? 0 : t === G_SIDE || t === G_ALLEY || t === G_PATH || t === G_PLAZA || t === G_PROM || t === G_PIER || t === G_BRIDGE ? 10 : t === G_ZEB ? 12 : t === G_GRASS ? 26 : 0; }
}

// ----- ground painter (ImageData, one pass per season) -----
const SEASON_GRASS = { spring: [0x7fae5a, 0x709e4e, 0x9cc46e], summer: [0x5e9246, 0x52863e, 0x76a654], fall: [0xae9e50, 0x9e8e46, 0xc4b062], winter: [0xeeeff2, 0xe2e4ea, 0xf8f8fa] };
function groundColor(t, wx, wy, tx, ty, season) {
  const n = hash2(wx, wy), vn = vnoise(wx / 6, wy / 6), lx = wx - tx * T, ly = wy - ty * T, win = season === 'winter';
  const nb = (dx, dy) => { const x = tx + dx, y = ty + dy; return x < 0 || y < 0 || x >= N || y >= N ? -1 : GT[gi(x, y)]; };
  const isR = v => v === G_ROAD || v === G_ZEB;
  let c;
  if (t === G_ROAD || t === G_ZEB) {
    // warm charcoal asphalt with aggregate specks and worn tyre tracks
    const n2 = hash2(wx * 2, wy * 2); c = vn > 0.6 ? 0x4c4446 : 0x544b4c; if (n2 > 0.93) c = 0x625858; else if (n2 < 0.05) c = 0x433b3d;
    const h = roadH(ty), v = roadV(tx);
    if (h >= 0 && v < 0) { const q = (wy - ROADS_H[h] * T) % 16; if (Math.abs(q - 4.5) < 1.6 || Math.abs(q - 11.5) < 1.6) c = mixc(c, 0x6a5e5c, 0.35); }
    if (v >= 0 && h < 0) { const q = (wx - ROADS_V[v] * T) % 16; if (Math.abs(q - 4.5) < 1.6 || Math.abs(q - 11.5) < 1.6) c = mixc(c, 0x6a5e5c, 0.35); }
    if (t === G_ZEB) { const k = h >= 0 && v < 0 ? wy - ROADS_H[h] * T : wx - ROADS_V[v] * T; if ((k + 0.6) % 6.4 < 3.6) c = n2 > 0.88 ? 0xcfc0a4 : n2 < 0.06 ? 0xb8a890 : 0xeee2c8; }
    else if (h >= 0 && v < 0) { if (Math.abs(wy - ROADS_H[h] * T - 16) < 0.6 && wx % 22 < 12 && nb(-3, 0) === G_ROAD && nb(3, 0) === G_ROAD && n < 0.95) c = 0xe8cc84; }
    else if (v >= 0 && h < 0) { if (Math.abs(wx - ROADS_V[v] * T - 16) < 0.6 && wy % 22 < 12 && nb(0, -3) === G_ROAD && nb(0, 3) === G_ROAD && n < 0.95) c = 0xe8cc84; }
    const kerb = (lx < 1 && nb(-1, 0) === G_SIDE) || (ly < 1 && nb(0, -1) === G_SIDE) || (lx > T - 1 && nb(1, 0) === G_SIDE) || (ly > T - 1 && nb(0, 1) === G_SIDE);
    if (kerb) c = win ? 0xd6dde8 : 0x3a2c2c;                                                      // gutter shadow under the kerb
    if (win && vnoise(wx / 9 + 5, wy / 9) > 0.66) c = mixc(c, 0xe4e6ee, 0.6);
  } else if (t === G_SIDE) {
    const pv = PAVE[gi(tx, ty)];
    if (pv === 0) { const gx = wx % 4, gy = wy % 4, h4 = hash2(wx / 4 | 0, wy / 4 | 0); c = (gx < 0.5 || gy < 0.5) ? 0x8e5444 : h4 < 0.33 ? 0xc8735a : h4 < 0.7 ? 0xbc6a52 : 0xd08068; if (gx > 3.3 || gy > 3.3) c = mixc(c, 0x6a3a30, 0.18); }   // gạch tàu: terracotta squares
    else if (pv === 1) { const gx = wx % 5, gy = wy % 5, ch = ((wx / 5 | 0) + (wy / 5 | 0)) & 1; c = (gx < 0.5 || gy < 0.5) ? 0x9c7a6e : ch ? 0xe6cdb0 : 0xc99a88; if (ch && gx > 1.5 && gx < 3.5 && gy > 1.5 && gy < 3.5) c = 0xd8b496; }         // cream + rose checker tiles
    else { const row = (wy / 4 | 0), gx = (wx + (row & 1) * 3) % 6, gy = wy % 4; c = (gx < 0.5 || gy < 0.5) ? 0x9a8a78 : hash2((wx + (row & 1) * 3) / 6 | 0, row) < 0.45 ? 0xd8c8ae : 0xcab89e; }                                // offset granite slabs
    if (vn > 0.74) c = shade(c, -0.06); if (hash2(wx * 2, wy * 2) > 0.975) c = shade(c, -0.14);
    const edge = (lx < 1.5 && isR(nb(-1, 0))) || (ly < 1.5 && isR(nb(0, -1))) || (lx > T - 1.5 && isR(nb(1, 0))) || (ly > T - 1.5 && isR(nb(0, 1)));
    if (edge) { const e = Math.min(isR(nb(-1, 0)) ? lx : 9, isR(nb(0, -1)) ? ly : 9, isR(nb(1, 0)) ? T - lx : 9, isR(nb(0, 1)) ? T - ly : 9); c = e < 0.5 ? 0x6a4e44 : e < 1 ? 0xf0e6d2 : 0xd8ccb6; }   // stone kerb with an ink edge
    if (win && vnoise(wx / 5, wy / 5 + 9) > 0.6 - (n > 0.6 ? 0.1 : 0)) c = n > 0.7 ? 0xe6e8ee : 0xf4f4f4;
  } else if (t === G_ALLEY) { c = vn > 0.74 ? 0x948676 : n > 0.95 ? 0x86786a : 0xa89a88; if ((wx + wy) % 9 < 0.5) c = shade(c, -0.08); if (win && vnoise(wx / 6, wy / 6 + 4) > 0.56) c = 0xeef0f4; }
  else if (t === G_YARD) { c = vn > 0.6 ? 0xa8946e : 0xb6a078; if (hash2(wx * 2, wy * 2) > 0.95) c = 0x947e5a; if (win && vnoise(wx / 5 + 2, wy / 5) > 0.56 - (n > 0.6 ? 0.1 : 0)) c = 0xf0f0f2; }
  else if (t === G_PAD) c = 0x6e5c54;
  else if (t === G_GRASS) {
    const g = SEASON_GRASS[season], n2 = hash2(wx * 2, wy * 2); c = vn > 0.58 ? g[1] : g[0];
    if (n2 > 0.86 && hash2(wx * 2, wy * 2 + 1) > 0.5) c = g[2]; else if (n2 < 0.08) c = mixc(g[1], 0x2b3a22, 0.3);       // little tufts
    if (win) { if (vnoise(wx / 5 + 7, wy / 5) < 0.27) c = n > 0.5 ? 0x9aa888 : 0xb4c0a8; }
    else if (season === 'spring' && n < 0.03) c = [0xf3a0c0, 0xf7d24a, 0xfff4ec, 0xf3a0c0][(n * 400 | 0) % 4];
    else if (season === 'summer' && n < 0.008) c = 0xfff4ec;
  } else if (t === G_PATH) { const n2 = hash2(wx * 2, wy * 2); c = n2 > 0.88 ? 0xc4a272 : n2 < 0.08 ? 0xead2a0 : 0xdcc08e; if (n2 > 0.97) c = 0xa88a62; if (win && vnoise(wx / 5, wy / 5) > 0.58 - (n > 0.6 ? 0.1 : 0)) c = 0xf2f2f4; }
  else if (t === G_PLAZA) { const gx = wx % 8, gy = wy % 8; c = (gx < 0.5 || gy < 0.5) ? 0xa89884 : (gx < 1 || gy < 1) ? 0xeee4d2 : ((tx + ty) & 1) ? 0xdccfb8 : 0xd2c4ac; if (vn > 0.7) c = shade(c, -0.04); if (win && vnoise(wx / 5 + 3, wy / 5) > 0.62 - (n > 0.6 ? 0.1 : 0)) c = 0xf4f4f6; }
  else if (t === G_WATER) {
    const edge = (lx < 2 && nb(-1, 0) !== G_WATER) || (ly < 2 && nb(0, -1) !== G_WATER) || (lx > T - 2 && nb(1, 0) !== G_WATER) || (ly > T - 2 && nb(0, 1) !== G_WATER);
    if (edge) c = win ? 0xe2e6ee : 0x9a8a78; else if (win) c = n > 0.97 ? 0xffffff : vn > 0.6 ? 0xc4dcea : 0xd2e8f3; else c = ((wy + Math.sin(wx / 5) * 2.2) % 7 < 0.7) ? 0x9ad2dc : vn > 0.6 ? 0x3f8aa0 : 0x4a96aa;
  }
  if (t >= G_RIVER) c = riverColor(t, wx, wy, tx, ty, season);
  if (!win && t !== G_WATER && t !== G_PAD && t < G_RIVER) { if (season === 'fall' && n < (t === G_GRASS ? 0.06 : 0.016)) c = [0xe0853a, 0xf2c14a, 0xc0622a][(n * 1000 | 0) % 3]; else if (season === 'spring' && t !== G_GRASS && n < 0.008) c = n < 0.004 ? 0xf7c4d8 : 0xfbe88a; }
  return c;
}
function paintGround(season, progress) {
  const W = WORLD * 2 * K, H = WORLD * K, c = mk(W, H), g = c.getContext('2d');
  return new Promise(res => {
    let py = 0; const BAND = 64;
    const step = () => {
      const id = g.createImageData(W, BAND), d = id.data, end = Math.min(H, py + BAND);
      for (let y = py; y < end; y++) { const sy = (y + 0.5) / K, half = Math.min(sy, WORLD - sy) * 2, xa = Math.max(0, Math.floor((WORLD - half) * K)), xb = Math.min(W, Math.ceil((WORLD + half) * K));
        for (let x = xa; x < xb; x++) { const sx = (x + 0.5) / K - WORLD, wx = sy + sx / 2, wy = sy - sx / 2; if (wx < 0 || wy < 0 || wx >= WORLD || wy >= WORLD) continue; const tx = wx >> 3, ty = wy >> 3, col = groundColor(GT[gi(tx, ty)], wx, wy, tx, ty, season), k = ((y - py) * W + x) * 4; d[k] = col >> 16 & 255; d[k + 1] = col >> 8 & 255; d[k + 2] = col & 255; d[k + 3] = 255; } }
      g.putImageData(id, 0, py); py = end; if (progress) progress(py / H);
      if (py < H) setTimeout(step, 0); else {
        for (const t of CITY.trees) { const s = treeSprite(t.spc, season, t.v); if (s.bare) continue; const sh = shadowSprite(s.bare ? s.rad * 0.55 : s.rad * 0.85); g.drawImage(sh, Math.round((t.x - t.y + WORLD + 3) * K - sh.width / 2), Math.round(((t.x + t.y) / 2 + 1) * K - sh.height / 2)); }
        res(c);
      }
    };
    step();
  });
}
// ----- power lines between poles -----
const _wire = {};
function wireSprite(dx, dy) {
  const k = dx + ',' + dy; if (_wire[k]) return _wire[k];
  const sx = dx - dy, sy = (dx + dy) / 2, w = Math.abs(sx) + 12, h = Math.abs(sy) + 24, c = mk(w * K, h * K), g = c.getContext('2d'), ox = sx < 0 ? -sx + 6 : 6, n = Math.abs(sx) * K;
  const bar = dy === 0 ? [0, 1] : [1, 0];   // crossbar direction in world
  [[-3.6, 0, 0x3a2a26], [3.6, 0, 0x3a2a26], [-2.6, 4, 0x4a3632], [2.6, 4, 0x4a3632], [0, 9, 0x2b1a16]].forEach(([o, zo, col], i) => { g.fillStyle = css(col); const bx = bar[0] * o - bar[1] * o, by = (bar[0] * o + bar[1] * o) / 2; for (let j = 0; j <= n; j++) { const t = j / n; g.fillRect(Math.round((ox + sx * t + bx) * K), Math.round((6 + sy * t + by + zo + (4.5 + i) * 4 * t * (1 - t)) * K), 1, 1); } });
  return (_wire[k] = { c, ox, oy: 6 });
}
// ----- materialise the static draw list for a season -----
function bakeRec(r, era, snow) { const k = (r.gen ? era * 2 : 0) + (snow ? 1 : 0); return r.spr[k] || (r.spr[k] = bake(r.gen ? r.gen(era) : r.boxes, { slice: 24, snow, ox: r.x, oy: r.y })); }
function buildStatics(season, era) {
  const snow = season === 'winter', items = [];
  for (const r of CITY.recs) {
    if (r.only && r.only !== season) continue;
    if (r.e0 !== undefined && (era < r.e0 || era > r.e1)) continue;
    if (r.tet && !G.tet) continue;
    if (r.ev && r.ev !== EV.cur) continue; if (r.noev && r.noev === EV.cur) continue;   // night-event decorations (js/events.js)
    if (r.t === 'b') { const sl = bakeRec(r, era, snow); for (const s of sl) items.push({ c: s.c, e: s.e, x: r.x - r.y - s.ax, y: (r.x + r.y) / 2 - s.ay, w: s.w, h: s.h, key: s.key + r.x + r.y }); }
    else if (r.t === 'p') { const s = propSprite(r.name, season, r.v, r.m); items.push({ c: s.c, e: s.e, x: Math.round(r.x - r.y) - s.ax, y: Math.round((r.x + r.y) / 2) - s.ay, w: s.w, h: s.h, key: r.x + r.y + r.kb }); }
    else if (r.t === 't') { const s = G.tet && r.spc === 'mai' ? treeSprite('mai', 'spring', (r.v | 0) * 2) : treeSprite(r.spc, season, r.v); r.spr = s; items.push({ c: s.c, e: s.e, x: Math.round(r.x - r.y) - s.ax, y: Math.round((r.x + r.y) / 2) - s.ay, w: s.w, h: s.h, key: r.x + r.y, tree: s, ph: r.ph, wx: r.x, wy: r.y }); }
    else if (r.t === 'w') { const s = wireSprite(r.dx, r.dy); items.push({ c: s.c, e: null, x: Math.round(r.x - r.y) - s.ox, y: Math.round((r.x + r.y) / 2) - 38 - s.oy, w: s.c.width / K, h: s.c.height / K, key: r.x + r.y + (r.dx + r.dy) / 2 - 2 }); }
  }
  items.sort((a, b) => a.key - b.key);
  return items;
}

// ----- A* on the tile grid (4 directions) -----
const _g = new Float32Array(N * N), _from = new Int32Array(N * N), _st = new Uint16Array(N * N); let _stamp = 0;
function findPath(sx, sy, gx, gy) {
  if (sx === gx && sy === gy) return [];
  _stamp++; if (_stamp > 65000) { _st.fill(0); _stamp = 1; }
  const heap = [], hf = [], goal = gi(gx, gy), start = gi(sx, sy);
  const push = (i, f) => { let k = heap.length; heap.push(i); hf.push(f); while (k > 0) { const p = (k - 1) >> 1; if (hf[p] <= f) break; heap[k] = heap[p]; hf[k] = hf[p]; k = p; } heap[k] = i; hf[k] = f; };
  const pop = () => { const top = heap[0], li = heap.pop(), lf = hf.pop(), n = heap.length; if (n) { let k = 0; for (;;) { let c = k * 2 + 1; if (c >= n) break; if (c + 1 < n && hf[c + 1] < hf[c]) c++; if (hf[c] >= lf) break; heap[k] = heap[c]; hf[k] = hf[c]; k = c; } heap[k] = li; hf[k] = lf; } return top; };
  _g[start] = 0; _st[start] = _stamp; _from[start] = -1; push(start, 0);
  let guard = 0;
  while (heap.length && guard++ < 60000) {
    const cur = pop(); if (cur === goal) break;
    const cx = cur % N, cy = (cur / N) | 0, gc = _g[cur];
    for (let d = 0; d < 4; d++) {
      const nx = cx + DIRV[d][0], ny = cy + DIRV[d][1]; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const ni = gi(nx, ny), w = WALK[ni]; if (!w && ni !== goal) continue;
      const ng = gc + (w || 10) + ((nx + ny) & 1 ? 0.01 : 0); if (_st[ni] === _stamp && _g[ni] <= ng) continue;
      _g[ni] = ng; _st[ni] = _stamp; _from[ni] = cur; push(ni, ng + (Math.abs(nx - gx) + Math.abs(ny - gy)) * 10);
    }
  }
  if (_st[goal] !== _stamp) return null;
  const path = []; for (let i = goal; i !== start && i >= 0; i = _from[i]) path.push(i); path.reverse(); return path;
}
function nearestWalk(tx, ty) { tx = clamp(tx, 0, N - 1); ty = clamp(ty, 0, N - 1); if (WALK[gi(tx, ty)]) return [tx, ty]; for (let r = 1; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = tx + dx, y = ty + dy; if (x >= 0 && y >= 0 && x < N && y < N && WALK[gi(x, y)]) return [x, y]; } return null; }
