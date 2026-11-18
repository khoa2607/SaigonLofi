'use strict';
// ===== Holdfast — the valley: geography, settlement layout, wall, navigation grid (no DOM, no canvas) =====
// World units follow SaigonLofi: 1 unit = K art px, tiles are 8 units. The approved layout is authored in "design units"
// (the v0.3 planning map); d2w/w2d convert. Design u runs left-right on screen, v runs top (wilderness) to bottom (river).
const HN = 144, HT = 8, HW = HN * HT, HG = 1.44, HCY = 648;
function d2w(u, v) { const s = HCY + (v - 300) * HG, h = (u - 480) * HG / 2; return [s + h, s - h]; }
function w2d(x, y) { return [480 + (x - y) / HG, 300 + ((x + y) / 2 - HCY) / HG]; }
const tIdx = (i, j) => j * HN + i;
const inMap = (i, j) => i >= 0 && j >= 0 && i < HN && j < HN;

// ---------------------------------------------------------------- geography (design units, approved v0.3 map)
const HCLEAR = 50, HGREEN = [480, 334];
const wallV = u => 212 + 55 * ((u - 480) / 440) ** 2;
const riverSide = (v, s) => 480 + s * (474 + Math.max(0, 300 - v) ** 2 / 300);
const roadU = v => 480 + 34 * Math.sin((212 - v) / 75);
const streamU = v => 655 + 18 * Math.sin(v / 31) + Math.max(0, v - 270) * 1.05;
const trailL = v => 330 - (212 - v) * 0.15 + 14 * Math.sin(v / 23);
const trailR = v => 640 + (212 - v) * 0.3 + 12 * Math.sin(v / 19);
// zone codes
const Z_WILD = 0, Z_CLEAR = 1, Z_SETTLE = 2, Z_RIVER = 3, Z_BANK = 4, Z_FAR = 5;
function zoneAt(u, v) {
  const d = Math.sqrt(((u - 480) / 445) ** 2 + ((v - 300) / 222) ** 2), lower = v >= 300;
  const cl = riverSide(v, -1), cr = riverSide(v, 1);
  const river = lower ? d >= 1 && d <= 1.13 : Math.abs(u - cl) < 29 || Math.abs(u - cr) < 29;
  if (river) return { z: Z_RIVER, d };
  const inside = lower ? d < 1 : u > cl + 29 && u < cr - 29;
  const bank = lower ? (d > 0.972 && d < 1) || (d > 1.13 && d < 1.155) : Math.abs(Math.abs(u - cl) - 31) < 3 || Math.abs(Math.abs(u - cr) - 31) < 3;
  if (!inside) return { z: lower ? Z_FAR : (bank ? Z_BANK : Z_WILD), d, bank };
  const wv = wallV(u);
  if (v > wv + 2) return { z: bank ? Z_BANK : Z_SETTLE, d, bank };
  if (v > wv - HCLEAR) return { z: Z_CLEAR, d };
  return { z: Z_WILD, d, inside: true };
}
// civic sites (design-unit rectangles) and other reserved ground inside the wall
const HSITES = {
  yard: [392, 568, 0, 252], market: [424, 538, 252, 298], barracks: [318, 404, 236, 286], infirmary: [552, 624, 230, 280],
  workshop: [594, 694, 272, 310], church: [330, 400, 296, 344], school: [580, 652, 316, 352], play: [388, 446, 352, 388],
  kitchen: [522, 594, 338, 380], barn: [258, 334, 370, 404], memorial: [286, 322, 334, 356], newcomers: [690, 760, 236, 270]
};
function reservedAt(u, v) {
  if (((u - HGREEN[0]) / 104) ** 2 + ((v - HGREEN[1]) / 52) ** 2 < 1) return 'green';
  for (const k in HSITES) { const r = HSITES[k]; if (u > r[0] && u < r[1] && v > r[2] && v < r[3]) return k; }
  if (Math.abs(u - streamU(v)) < 14) return 'stream';
  if (Math.abs(u - 480) < 11) return 'main';
  if (v < wallV(u) + 12) return 'lane';
  return null;
}
const isField = (u, v, d) => d < 0.92 && v > 446 && Math.abs(u - 480) > 9;

// ---------------------------------------------------------------- ground kinds per tile
const GK = { WGRASS: 0, FOREST: 1, MEADOW: 2, ROCK: 3, ROAD: 4, TRAIL: 5, CLEARED: 6, LAWN: 7, GREEN: 8, PLAZA: 9, STREET: 10, FIELD: 11, YARD: 12, WATER: 13, SAND: 14, STREAM: 15, FARBANK: 16, LANE: 17, MAIN: 18 };
const HF = {
  zone: new Uint8Array(HN * HN), gk: new Uint8Array(HN * HN), walk: new Uint8Array(HN * HN), inside: new Uint8Array(HN * HN),
  wood: new Float32Array(HN * HN), occ: new Uint8Array(HN * HN), crop: new Uint8Array(HN * HN),
  walls: [], wallAt: new Int16Array(HN * HN).fill(-1), gate: null, towers: [], buildings: [], props: [], trees: [], lots: [],
  spots: {}, pois: [], routes: [], spawns: [], fields: [], docks: [], ver: 0
};
// walk flags
const W_IN = 1, W_OUT = 2, W_GATE = 4, W_BREACH = 8, W_DOCK = 16;

function hfNoise(x, y, s) { return vnoise(x / s + 11.3, y / s + 4.7); }

function hfBuildMap(seed) {
  const R = mulberry32(seed || 7);
  HF.R = R;
  // 1) zones + ground per tile
  for (let j = 0; j < HN; j++) for (let i = 0; i < HN; i++) {
    const k = tIdx(i, j), [u, v] = w2d(i * HT + 4, j * HT + 4), Z = zoneAt(u, v);
    HF.zone[k] = Z.z; HF.wood[k] = hfNoise(i, j, 9) * 0.7 + hfNoise(i + 40, j, 3.5) * 0.3;
    let g = GK.WGRASS;
    if (Z.z === Z_RIVER) g = GK.WATER;
    else if (Z.z === Z_BANK) g = GK.SAND;
    else if (Z.z === Z_FAR) g = GK.FARBANK;
    else if (Z.z === Z_CLEAR) g = GK.CLEARED;
    else if (Z.z === Z_WILD) g = HF.wood[k] > 0.56 ? GK.FOREST : hfNoise(i, j, 7) > 0.6 ? GK.MEADOW : GK.WGRASS;
    else if (Z.z === Z_SETTLE) {
      const rs = reservedAt(u, v);
      g = isField(u, v, Z.d) ? GK.FIELD : rs === 'green' ? GK.GREEN : rs === 'main' ? GK.MAIN : rs === 'lane' ? GK.LANE : rs === 'stream' ? GK.LAWN : rs ? GK.PLAZA : GK.LAWN;
    }
    // rocky ground, roads, trails (outside)
    if (Z.z === Z_WILD && (((u - 690) / 60) ** 2 + ((v - 30) / 30) ** 2 < 1 || ((u - 250) / 40) ** 2 + ((v - 140) / 18) ** 2 < 1)) g = GK.ROCK;
    if ((Z.z === Z_WILD || Z.z === Z_CLEAR || (Z.z === Z_SETTLE && v < wallV(u) + 4)) && Math.abs(u - roadU(v)) < 9) g = GK.ROAD;
    else if ((Z.z === Z_WILD || Z.z === Z_CLEAR) && v < wallV(u) - 8 && (Math.abs(u - trailL(v)) < 3 || Math.abs(u - trailR(v)) < 3)) g = GK.TRAIL;
    else if (Z.z === Z_WILD && v < 290 && (Math.abs(u - (riverSide(v, -1) + 40)) < 2.5 || Math.abs(u - (riverSide(v, 1) - 40)) < 2.5)) g = GK.TRAIL;
    if (Z.z !== Z_RIVER && Z.z !== Z_FAR && v < 470 && Math.abs(u - streamU(v)) < 4.2 && (Z.z === Z_SETTLE || Z.z === Z_CLEAR || (Z.z === Z_WILD && Z.inside !== false))) g = GK.STREAM;
    HF.gk[k] = g;
  }
  hfBuildWall();
  hfBuildSettlement(R);
  hfBuildOutside(R);
  hfBuildWalk();
  return HF;
}

// ---------------------------------------------------------------- wall: a 4-connected tile chain along the arch, straight run at the gate
function hfBuildWall() {
  const chain = [], push = (i, j) => { const L = chain[chain.length - 1]; if (L && L[0] === i && L[1] === j) return; if (L && L[0] !== i && L[1] !== j) chain.push([i, L[1]]); chain.push([i, j]); };
  const tileOf = u => { const [x, y] = d2w(u, wallV(u)); return [Math.floor(x / HT), Math.floor(y / HT)]; };
  // left end must sit in the river, right end too: extend the curve a little past both banks
  let gateStart = -1, off = [0, 0];
  for (let u = 26; u <= 934; u += 0.5) {
    const [i0, j0] = tileOf(u), i = i0 + off[0], j = j0 + off[1];
    if (u >= 480 && gateStart < 0) {           // straight 3-tile x-run for the gate at the apex; the rest of the arch shifts with it
      const L = chain[chain.length - 1]; gateStart = chain.length; for (let s = 1; s <= 3; s++) chain.push([L[0] + s, L[1]]);
      off = [L[0] + 3 - i0, L[1] - j0];
      continue;
    }
    push(i, j);
  }
  // keep chain monotonic after the gate (no backtracking)
  const clean = []; const seen = new Set(); for (const c of chain) { const key = c[0] + ',' + c[1]; if (seen.has(key)) continue; seen.add(key); clean.push(c); }
  HF.walls = []; let gi = -1;
  for (let n = 0; n < clean.length; n++) {
    const [i, j] = clean[n]; if (!inMap(i, j)) continue;
    const nx = clean[n + 1] || clean[n - 1], dir = nx && nx[0] !== i ? 'x' : 'y';
    const k = tIdx(i, j); if (HF.zone[k] === Z_RIVER) continue;        // the river closes the ends
    const isGate = n >= gateStart && n < gateStart + 3;
    const seg = { id: HF.walls.length, i, j, dir, gate: isGate, hp: 10, max: 10, kind: '', h: 15, weak: false, dmgT: 0 };
    HF.walls.push(seg); HF.wallAt[k] = seg.id; if (isGate && gi < 0) gi = seg.id;
  }
  // materials: patchwork runs, a few low "weak" sections (car doors, pallets) that zombies probe
  const R = mulberry32(99), kinds = ['corr', 'corr', 'corr', 'ply', 'corr', 'pallet', 'corr', 'mesh', 'corr', 'ply', 'door', 'corr'];
  for (const s of HF.walls) {
    if (s.gate) { s.kind = 'gate'; s.h = 18; s.max = s.hp = 30; continue; }
    s.kind = kinds[Math.floor(R() * kinds.length)]; s.h = s.kind === 'door' ? 13 : 15 + (R() < 0.35 ? 2 : 0); s.seed = Math.floor(R() * 5);
    s.weak = s.kind === 'door' || s.kind === 'pallet'; s.max = s.hp = s.weak ? 6 : s.kind === 'mesh' ? 7 : 10;
    // where the creek passes under the wall: a culvert grate (weak point R3)
    const [u, v] = w2d(s.i * HT + 4, s.j * HT + 4); if (Math.abs(u - streamU(v)) < 6) { s.kind = 'culvert'; s.weak = true; s.max = s.hp = 6; s.h = 13; }
    s.posts = R() < 0.5;
  }
  HF.gate = { segs: HF.walls.filter(s => s.gate).map(s => s.id), open: 0, want: 0, hold: 0, users: 0 };
}

// ---------------------------------------------------------------- settlement
function fp(x, y, w, d) { const i0 = Math.floor(x / HT), j0 = Math.floor(y / HT), i1 = Math.ceil((x + w) / HT) - 1, j1 = Math.ceil((y + d) / HT) - 1; const out = []; for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) out.push([i, j]); return out; }
function freeRect(x, y, w, d, okZone) {
  for (const [i, j] of fp(x, y, w, d)) { if (!inMap(i, j)) return false; const k = tIdx(i, j); if (HF.occ[k] || HF.wallAt[k] >= 0) return false; if (okZone && !okZone(k, i, j)) return false; }
  return true;
}
function occupy(x, y, w, d, v) { for (const [i, j] of fp(x, y, w, d)) if (inMap(i, j)) HF.occ[tIdx(i, j)] = v || 1; }
function addB(o) { o.id = HF.buildings.length; HF.buildings.push(o); occupy(o.x, o.y, o.w, o.d, 2); o.door = o.door || [o.x + o.w * 0.35, o.y + o.d + 4]; return o; }
function addP(kind, x, y, o) { const p = Object.assign({ kind, x, y }, o || {}); HF.props.push(p); if (p.block) occupy(x + (p.bx || 0), y + (p.by || 0), p.bw || 6, p.bd || 6, 3); return p; }
function spot(name, x, y, o) { (HF.spots[name] = HF.spots[name] || []).push(Object.assign({ x, y }, o || {})); }
const siteC = k => { const r = HSITES[k]; return d2w((r[0] + r[1]) / 2, (r[2] + r[3]) / 2); };
const settleTile = k => HF.zone[k] === Z_SETTLE && HF.gk[k] !== GK.STREAM && HF.gk[k] !== GK.FIELD;

const HOUSE_WALLS = [0xe6dcc2, 0x9fbc8e, 0x8fb0cc, 0xe8c878, 0xd8d6cc, 0xe0a898, 0xc8c0a8, 0xa8c8a8, 0xf0d8b0, 0x98a8c8, 0xc89a7a, 0xb8d0d8, 0xd8c0e0];
const HOUSE_ROOFS = [0x5c5658, 0x6e5446, 0x4e5a64, 0x5f6e56, 0x8a5440, 0x58606a, 0x9a4a3a, 0x4a5a4a];
const NAMES = ['Lan', 'Minh', 'Bảo', 'Hà', 'Tuấn', 'Mai', 'Dũng', 'Linh', 'Ba Sáu', 'Khoa', 'Thảo', 'Hùng', 'Vy', 'Phúc', 'Ngọc', 'Sơn', 'Ruth', 'Amos', 'Ines', 'Theo'];

function hfBuildSettlement(R) {
  // ---- civic buildings at the approved sites (world-axis aligned footprints)
  const C = siteC;
  let [x, y] = C('barracks'); addB({ kind: 'barracks', x: x - 34, y: y - 14, w: 68, d: 26, seed: 3 });
  [x, y] = C('infirmary'); addB({ kind: 'infirmary', x: x - 26, y: y - 18, w: 46, d: 32, seed: 5 });
  addP('tent', x + 22, y + 14, { c: 0xe8e2d0, block: 1, bw: 14, bd: 12 });
  [x, y] = C('workshop'); addB({ kind: 'workshop', x: x - 30, y: y - 24, w: 58, d: 42, seed: 7 });
  [x, y] = C('church'); addB({ kind: 'church', x: x - 18, y: y - 30, w: 34, d: 54, seed: 9, door: [x - 1, y + 28] });
  [x, y] = C('school'); addB({ kind: 'school', x: x - 26, y: y - 16, w: 50, d: 28, seed: 11 });
  [x, y] = C('barn'); addB({ kind: 'barn', x: x - 24, y: y - 18, w: 46, d: 34, seed: 13 });
  [x, y] = C('kitchen'); addB({ kind: 'kitchen', x: x - 16, y: y - 26, w: 30, d: 24, seed: 15 });
  addP('messtent', x - 26, y + 2, { block: 1, bw: 40, bd: 26 });
  // ---- gate yard
  [x, y] = C('yard');
  addP('truck', x + 20, y - 4, { c: 0x6a4a3a, block: 1, bw: 20, bd: 10 }); addP('truck', x - 46, y - 2, { c: 0x5a6e5a, block: 1, bw: 20, bd: 10 });
  addP('crates', x - 22, y + 10); addP('crates', x + 46, y + 8); addP('bell', x - 8, y + 14, { block: 1, bw: 3, bd: 3 });
  spot('yard', x - 6, y + 4); spot('yard', x + 4, y + 8); spot('yard', x + 10, y + 2); spot('storage', x - 18, y + 18);
  // ---- market: stalls along both sides of the main street
  [x, y] = C('market');
  const STC = [0xd9534f, 0x3d6fb5, 0xf2c94c, 0x58994f, 0x8a5ab8, 0xf08a4b, 0x4fa3a0, 0xc94f6a];
  for (let k = 0; k < 8; k++) { const sx = x - 40 + (k % 4) * 22, sy = y - 20 + Math.floor(k / 4) * 30; addP('stall', sx, sy, { c: STC[k], block: 1, bw: 12, bd: 8, v: k }); spot('stall', sx + 6, sy + 12, { k }); spot('shop', sx + 6, sy + 18); }
  // ---- commons on the green: great oak, fire, long tables, string lights, benches
  [x, y] = d2w(HGREEN[0], HGREEN[1]);
  HF.oak = { x, y }; HF.trees.push({ x, y: y - 2, spc: 'oak', v: 0, big: 1 }); occupy(x - 4, y - 4, 8, 8, 3);
  HF.fire = { x: x + 20, y: y + 22 }; addP('firepit', x + 20, y + 22);
  for (let k = 0; k < 4; k++) { const tx = x - 16 + (k % 2) * 46, ty = y + 34 + Math.floor(k / 2) * 18; addP('table', tx, ty, { block: 1, bw: 20, bd: 7 }); for (let s = 0; s < 4; s++) { spot('seat', tx + 2 + s * 5, ty - 3, { dir: 1 }); spot('seat', tx + 2 + s * 5, ty + 10, { dir: 3 }); } }
  addP('lights', x, y + 10, { w: 90, d: 60 });
  for (const [ox, oy] of [[-40, -20], [40, -26], [-30, 40], [56, 10]]) { addP('bench', x + ox, y + oy); spot('bench', x + ox + 4, y + oy + 4); }
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; spot('green', x + Math.cos(a) * 34, y + Math.sin(a) * 34); }
  // ---- playground + school seats
  [x, y] = C('play'); addP('swings', x - 10, y - 6); addP('slide', x + 14, y + 6); addP('sandbox', x - 16, y + 14);
  for (let k = 0; k < 12; k++) spot('play', x - 22 + (k % 4) * 14, y - 12 + Math.floor(k / 4) * 12);
  const sc = HF.buildings.find(b => b.kind === 'school'); for (let k = 0; k < 8; k++) spot('class', sc.x + 6 + (k % 4) * 9, sc.y + sc.d + 10 + Math.floor(k / 4) * 7, { dir: 3 });
  spot('teach', sc.x + 22, sc.y + sc.d + 4);
  // ---- infirmary beds, church shelter, barracks drill, workshop stations, kitchen stations
  const inf = HF.buildings.find(b => b.kind === 'infirmary'); for (let k = 0; k < 6; k++) spot('bed', inf.x + 50 + (k % 3) * 7, inf.y + 6 + Math.floor(k / 3) * 9);
  spot('medic', inf.x + 30, inf.y + inf.d + 6);
  const ch = HF.buildings.find(b => b.kind === 'church'); spot('shelter', ch.door[0], ch.door[1]);
  const ba = HF.buildings.find(b => b.kind === 'barracks'); for (let k = 0; k < 8; k++) spot('drill', ba.x + 8 + (k % 4) * 14, ba.y + ba.d + 12 + Math.floor(k / 4) * 10); addP('rack', ba.x + ba.w - 8, ba.y + ba.d + 4);
  const ws = HF.buildings.find(b => b.kind === 'workshop'); for (let k = 0; k < 5; k++) spot('bench', ws.x + 6 + k * 11, ws.y + ws.d + 8, { work: 1 });
  addP('car', ws.x + ws.w - 6, ws.y + ws.d + 10, { c: 0x4a6a8a, block: 1, bw: 19, bd: 9 }); addP('scrap', ws.x - 10, ws.y + 12); addP('scrap', ws.x + ws.w + 4, ws.y + 4);
  const kt = HF.buildings.find(b => b.kind === 'kitchen'); for (let k = 0; k < 4; k++) spot('cook', kt.x + 4 + k * 8, kt.y + kt.d + 6); addP('drumfire', kt.x + kt.w + 6, kt.y + kt.d + 2);
  const bn = HF.buildings.find(b => b.kind === 'barn'); spot('granary', bn.door[0], bn.door[1]);
  // ---- memorial stones, newcomers' RV + tents
  [x, y] = C('memorial'); HF.memorial = { x, y, stones: 3 }; addP('memorial', x - 8, y - 6, { block: 1, bw: 16, bd: 10 }); spot('mourn', x, y + 10);
  [x, y] = C('newcomers'); addP('rv', x - 20, y - 6, { block: 1, bw: 28, bd: 11 }); addP('tent', x + 16, y - 8, { c: 0x5a7a9a, block: 1, bw: 14, bd: 12 }); addP('tent', x + 16, y + 10, { c: 0x6a8a5a, block: 1, bw: 14, bd: 12 }); spot('camp', x, y + 18);
  // ---- utilities: water tower, wind turbines, greenhouses, coop, goats, beehives
  const putU = (k, u, v, o) => { const [px, py] = d2w(u, v); addP(k, px, py, o); return [px, py]; };
  putU('watertower', 232, 430, { block: 1, bw: 12, bd: 12 }); putU('turbine', 818, 420); putU('turbine', 842, 360);
  for (const [u, v] of [[692, 404], [730, 410], [716, 432]]) putU('greenhouse', u, v, { block: 1, bw: 26, bd: 16 });
  putU('coop', 196, 352, { block: 1, bw: 14, bd: 10 }); spot('coop', ...d2w(204, 366));
  putU('pen', 250, 384); for (let k = 0; k < 3; k++) spot('goat', ...d2w(244 + k * 8, 386));
  for (let k = 0; k < 3; k++) putU('hive', 770 + k * 7, 330 + k * 6);
  // ---- docks and smokehouse
  for (const [u, v] of [[480, 498], [226, 466], [740, 466]]) {
    const [px, py] = d2w(u, v), along = 'y';      // run out over the water toward +x+y
    HF.docks.push({ x: px - 3, y: py, len: 30 }); spot('fish', px + 1, py + 26); spot('fish', px + 1, py + 16);
  }
  putU('smokehouse', 520, 490, { block: 1, bw: 12, bd: 10 });
  // ---- inner patrol waypoints just inside the wall, tower sites
  HF.patrol = [];
  for (const s of HF.walls) { if (s.id % 3) continue; const k = hfInnerTile(s); if (k >= 0) HF.patrol.push(k); }
  const TU = [436, 524, 110, 190, 270, 360, 600, 690, 770, 850];
  for (const u of TU) {
    const s = hfNearestWall(u); if (!s) continue; const k = hfInnerTile(s, 2); if (k < 0) continue;
    const ti = k % HN, tj = (k / HN) | 0, t = { id: HF.towers.length, x: ti * HT - 5, y: tj * HT - 5, s: 18, h: 46, main: u === 436, seg: s.id, guards: [] };
    t.base = [t.x + 9, t.y + 21]; occupy(t.x, t.y, 18, 18, 4); HF.towers.push(t);
  }
  // ---- fields: 5x5-tile patches with crop types; work spots on each patch
  for (let j = 0; j < HN; j++) for (let i = 0; i < HN; i++) { const k = tIdx(i, j); if (HF.gk[k] === GK.FIELD) HF.crop[k] = 1 + ((Math.floor(i / 5) + Math.floor(j / 5) * 3) % 5); }
  const seenP = new Set();
  for (let j = 0; j < HN; j++) for (let i = 0; i < HN; i++) { const k = tIdx(i, j); if (HF.gk[k] !== GK.FIELD) continue; const pk = Math.floor(i / 5) + ',' + Math.floor(j / 5); if (seenP.has(pk)) continue; seenP.add(pk); HF.fields.push({ i, j, x: i * HT + 12, y: j * HT + 12, crop: HF.crop[k] }); spot('field', i * HT + 12, j * HT + 12); }
  // ---- residential lots: grid of 8x7-tile cells on the world axes (streets on the cell edges)
  const CWt = 7, CDt = 6, lotm = new Uint8Array(HN * HN);
  // greedy packing: scan tiles in rows, drop a 7x6-tile lot wherever it fits (streets on the lot's top/left edges)
  const cand = [];
  for (const [cw, cd, small] of [[CWt, CDt, 0], [6, 5, 1], [5, 5, 2]]) for (let tj = 0; tj <= HN - cd; tj++) for (let ti = 0; ti <= HN - cw; ti++) cand.push([ti, tj, cw, cd, small]);
  for (const [ti, tj, cw, cd, small] of cand) {
    const x0 = ti * HT, y0 = tj * HT;
    let fits = true;
    for (let j = tj; j < tj + cd && fits; j++) for (let i = ti; i < ti + cw; i++) { const k = tIdx(i, j); if (lotm[k] || HF.occ[k] || HF.wallAt[k] >= 0 || !settleTile(k) || reservedTile(k)) { fits = false; break; } }
    if (!fits) continue;
    for (let j = tj; j < tj + cd; j++) for (let i = ti; i < ti + cw; i++) lotm[tIdx(i, j)] = 1;
    const big = !small && R() < 0.6, w = small === 2 ? 22 : small ? 26 + Math.floor(R() * 2) * 2 : big ? 36 + Math.floor(R() * 3) * 4 : 28 + Math.floor(R() * 2) * 2, d = small === 2 ? 18 : small ? 20 : big ? 26 + Math.floor(R() * 2) * 2 : 24;
    const hx = x0 + (small === 2 ? 9 : 10), hy = y0 + (small === 2 ? 9 : 10);
    const garage = !big && !small && R() < 0.45, porch = !small && R() < 0.7 && d <= 26;
    const lot = { id: HF.lots.length, x0, y0, hx, hy, w, d, small, floors: big ? 2 : 1, garage, porch, seed: Math.floor(R() * 9999), wall: HOUSE_WALLS[Math.floor(R() * HOUSE_WALLS.length)], roof: HOUSE_ROOFS[Math.floor(R() * HOUSE_ROOFS.length)] };
    HF.lots.push(lot);
    const b = addB({ kind: 'house', x: hx, y: hy, w: w + (garage ? 14 : 0), d, lot: lot.id, seed: lot.seed, door: [hx + w * 0.35, hy + d + (porch ? 12 : 5)] });
    lot.b = b.id;
    // street tiles on the cell edges
    for (let i = 0; i < cw; i++) markStreet(ti + i, tj);
    for (let j = 0; j < cd; j++) markStreet(ti, tj + j);
    // yard life
    const yx = hx + w + (garage ? 14 : 0);
    if (R() < 0.7) addP('fence', hx - 6, hy + d + 14, { w: w + 10 });
    if (R() < 0.6) { addP('bed', yx + 2 > x0 + cw * HT - 12 ? hx - 2 : yx + 2, hy + 4, { v: Math.floor(R() * 4) }); }
    if (R() < 0.5) addP('barrel', hx + w - 2, hy + d - 6);
    if (R() < 0.35) addP('laundry', hx + 2, hy - 8, { w: Math.min(30, w - 4) });
    if (R() < 0.3) addP('woodpile', hx + w - 14, hy - 7);
    if (R() < 0.25) addP('bike', hx + w * 0.6, hy + d + 9);
    if (R() < 0.35) addP('mailbox', hx + w * 0.2, hy + d + 16);
    if (R() < 0.18) addP('car', hx + w - 4, hy + d + 6, { c: [0x6a8aa0, 0x9a8a62, 0x8a4a3a, 0x6a6a6a][Math.floor(R() * 4)], wreck: 0.4, block: 1, bw: 19, bd: 9 });
    if (R() < 0.4) addP('bins', hx - 6, hy + d - 2);
    spot('porch', hx + 6, hy + d + 9, { lot: lot.id }); spot('yardwork', hx + w * 0.5, hy - 6, { lot: lot.id });
    if (R() < 0.55) HF.trees.push({ x: x0 + 6 + R() * 6, y: y0 + cd * HT - 6, spc: R() < 0.5 ? 'me' : 'fruit', v: Math.floor(R() * 6) });
  }
  // ---- lamp posts + fruit trees along main street, bank trees
  for (let v = 254; v < 520; v += 26) { const [px, py] = d2w(491, v); addP('lamp', px, py); }
  for (let n = 0; n < 70; n++) {
    const u = 80 + R() * 800, v = 230 + R() * 290, [px, py] = d2w(u, v), i = Math.floor(px / HT), j = Math.floor(py / HT); if (!inMap(i, j)) continue;
    const k = tIdx(i, j), Z = zoneAt(u, v);
    if ((Z.z === Z_SETTLE || Z.z === Z_BANK) && !HF.occ[k] && HF.gk[k] !== GK.STREET && HF.gk[k] !== GK.MAIN && HF.gk[k] !== GK.FIELD && HF.gk[k] !== GK.STREAM && (Z.d > 0.88 || HF.gk[k] === GK.LAWN) && HF.wallAt[k] < 0) { HF.trees.push({ x: px, y: py, spc: R() < 0.5 ? 'fruit' : 'me', v: Math.floor(R() * 6) }); HF.occ[k] = 3; }
  }
  // drum fires along the inner wall
  for (const u of [150, 410, 560, 820, 300, 680]) { const s = hfNearestWall(u); if (s) { const k = hfInnerTile(s, 2); if (k >= 0 && !HF.occ[k]) addP('drumfire', (k % HN) * HT + 4, ((k / HN) | 0) * HT + 4); } }
}
function reservedTile(k) { const [u, v] = w2d((k % HN) * HT + 4, ((k / HN) | 0) * HT + 4); return !!reservedAt(u, v); }
function markStreet(i, j) { if (!inMap(i, j)) return; const k = tIdx(i, j); if (HF.zone[k] === Z_SETTLE && HF.gk[k] === GK.LAWN && !HF.occ[k]) HF.gk[k] = GK.STREET; }
function hfNearestWall(u) { let best = null, bd = 1e9; for (const s of HF.walls) { if (s.gate) continue; const [su] = w2d(s.i * HT + 4, s.j * HT + 4), d = Math.abs(su - u); if (d < bd) { bd = d; best = s; } } return best; }
// the tile on the settlement side of a wall segment (dist tiles inward)
function hfInnerTile(s, dist) {
  dist = dist || 1; const [u, v] = w2d(s.i * HT + 4, s.j * HT + 4);
  for (let d = dist; d < dist + 4; d++) { const [x, y] = d2w(u, v + 6 * d), i = Math.floor(x / HT), j = Math.floor(y / HT); if (inMap(i, j) && HF.zone[tIdx(i, j)] === Z_SETTLE && HF.wallAt[tIdx(i, j)] < 0) return tIdx(i, j); }
  return -1;
}
function hfOuterTile(s, dist) {
  dist = dist || 1; const [u, v] = w2d(s.i * HT + 4, s.j * HT + 4);
  for (let d = dist; d < dist + 4; d++) { const [x, y] = d2w(u, v - 6 * d), i = Math.floor(x / HT), j = Math.floor(y / HT); if (inMap(i, j)) { const z = HF.zone[tIdx(i, j)]; if ((z === Z_CLEAR || z === Z_WILD) && HF.wallAt[tIdx(i, j)] < 0) return tIdx(i, j); } }
  return -1;
}

// ---------------------------------------------------------------- outside: wilderness POIs, wrecks, trees, routes
function hfBuildOutside(R) {
  const put = (u, v) => d2w(u, v);
  const poi = (name, u, v, risk, kind) => { const [x, y] = put(u, v); const p = { name, x, y, risk, kind, spots: [] }; HF.pois.push(p); return p; };
  // gas station beside the road
  let p = poi('gas', 560, 110, 0.35); addP('gasstation', p.x - 24, p.y - 16, { block: 1, bw: 44, bd: 30 }); p.spots.push([p.x - 4, p.y + 20], [p.x + 22, p.y + 4]);
  p = poi('houses', 372, 108, 0.45);
  addB({ kind: 'ruin', x: p.x - 30, y: p.y - 20, w: 40, d: 30, seed: 41, ruin: 1 }); addB({ kind: 'ruin', x: p.x + 20, y: p.y - 4, w: 34, d: 28, seed: 42, ruin: 2 }); p.spots.push([p.x - 14, p.y + 16], [p.x + 34, p.y + 30]);
  p = poi('collapsed', 780, 96, 0.4); addB({ kind: 'collapsed', x: p.x - 20, y: p.y - 16, w: 38, d: 30, seed: 43 }); p.spots.push([p.x, p.y + 20]);
  p = poi('farm', 300, -10, 0.5); addB({ kind: 'farmbarn', x: p.x - 24, y: p.y - 18, w: 40, d: 30, seed: 44 }); addP('silo', p.x + 26, p.y - 10, { block: 1, bw: 12, bd: 12 }); p.spots.push([p.x - 6, p.y + 18]);
  p = poi('radio', 700, -20, 0.55); addP('mast', p.x, p.y, { block: 1, bw: 4, bd: 4 }); addP('shed', p.x + 10, p.y + 8, { block: 1, bw: 14, bd: 12 }); p.spots.push([p.x + 16, p.y + 26]);
  p = poi('ruins', 500, -70, 0.85); p.horde = 1;
  for (const [a, b, w, d, h] of [[-50, -20, 34, 28, 46], [10, -40, 30, 30, 38], [-20, 30, 28, 34, 30], [40, 20, 34, 26, 56], [-70, 40, 26, 26, 26]]) addB({ kind: 'block', x: p.x + a, y: p.y + b, w, d, h, seed: 50 + a });
  p.spots.push([p.x - 10, p.y + 10], [p.x + 30, p.y + 60]);
  // the old road: bus, wrecks, power poles
  for (const [v, k, c] of [[160, 'car', 0x6a8aa0], [118, 'car', 0x9a8a62], [70, 'bus', 0], [30, 'car', 0xb8b0a0], [-20, 'car', 0x8a4a3a]]) { const [x, y] = put(roadU(v) + (k === 'bus' ? 8 : 3), v); addP(k, x, y, { c, wreck: 1, block: 1, bw: k === 'bus' ? 44 : 19, bd: k === 'bus' ? 12 : 9 }); }
  for (let v = -100; v < 196; v += 30) { const [x, y] = put(roadU(v) + 16, v); addP('pole', x, y); }
  // cleared ground: stumps, hedgehogs, wrecks pushed out as obstacles
  for (let u = 70; u < 900; u += 18) { const wv = wallV(u); const [hx, hy] = put(u + R() * 8 - 4, wv - 22 + R() * 6 - 3); addP('hedgehog', hx, hy); const [sx, sy] = put(u + R() * 16 - 8, wv - 8 - R() * 36); const k = tIdx(Math.floor(sx / HT), Math.floor(sy / HT)); if (inMap(Math.floor(sx / HT), Math.floor(sy / HT)) && HF.zone[k] === Z_CLEAR && HF.gk[k] !== GK.ROAD) addP('stump', sx, sy); }
  for (const [u, v, c] of [[398, 190, 0x60707a], [586, 172, 0x8a4a3a], [300, 200, 0x7a7a6a]]) { const [x, y] = put(u, v); addP('car', x, y, { c, wreck: 1, block: 1, bw: 19, bd: 9 }); }
  // rocks
  for (let n = 0; n < 26; n++) { const [x, y] = put(690 + (R() - 0.5) * 110, 30 + (R() - 0.5) * 50); addP('rock', x, y, { r: 3 + R() * 4 }); }
  for (let n = 0; n < 8; n++) { const [x, y] = put(250 + (R() - 0.5) * 70, 140 + (R() - 0.5) * 24); addP('rock', x, y, { r: 2 + R() * 3 }); }
  // forest: clustered, clearings around POIs and paths
  const clearR = HF.pois.map(q => [q.x, q.y, q.horde ? 110 : 56]);
  const treeOK = (x, y) => {
    const i = Math.floor(x / HT), j = Math.floor(y / HT); if (!inMap(i, j)) return false; const k = tIdx(i, j), z = HF.zone[k], g = HF.gk[k];
    if (z === Z_RIVER || z === Z_SETTLE || z === Z_CLEAR || g === GK.ROAD || g === GK.TRAIL || g === GK.ROCK || g === GK.STREAM || HF.occ[k] || HF.wallAt[k] >= 0) return false;
    for (const [cx, cy, r] of clearR) if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return false;
    return true;
  };
  const cell = 13;
  for (let y = 4; y < HW; y += cell) for (let x = 4; x < HW; x += cell) {
    const tx = x + (R() - 0.5) * cell * 0.9, ty = y + (R() - 0.5) * cell * 0.9; if (!treeOK(tx, ty)) continue;
    const k = tIdx(Math.floor(tx / HT), Math.floor(ty / HT)), z = HF.zone[k], wd = HF.wood[k];
    const dens = z === Z_FAR ? 0.22 : z === Z_BANK ? 0.3 : wd > 0.56 ? 0.92 : wd > 0.5 ? 0.35 : 0.06;
    if (R() > dens) continue;
    const r = R(); HF.trees.push({ x: tx, y: ty, spc: r < 0.38 ? 'pine' : r < 0.6 ? 'me' : r < 0.82 ? 'dau' : 'bang', v: Math.floor(R() * 6) });
  }
  // threat routes R1..R5: polylines in design units from the map edge / POIs to the wall (R6 river is visual only)
  const route = (name, pts) => HF.routes.push({ name, pts: pts.map(q => put(q[0], q[1])) });
  route('R1', [[500, -60], [roadU(0), 0], [roadU(120), 120], [480, 200]]);
  route('R2', [[300, -10], [trailL(40), 40], [trailL(140), 140], [300, 204]]);
  route('R3', [[700, -20], [trailR(60), 60], [trailR(160), 160], [650, 212]]);
  route('R4', [[riverSide(120, -1) + 40, 120], [riverSide(200, -1) + 40, 200], [80, 258]]);
  route('R5', [[riverSide(120, 1) - 40, 120], [riverSide(200, 1) - 40, 200], [880, 258]]);
  // spawn points: route heads + map-edge forest tiles far outside
  for (const r of HF.routes) HF.spawns.push({ x: r.pts[0][0], y: r.pts[0][1], route: r.name });
}

// ---------------------------------------------------------------- navigation grid + flow fields
function hfBuildWalk() {
  const W = HF.walk;
  for (let k = 0; k < HN * HN; k++) {
    const z = HF.zone[k]; let f = 0;
    if (z === Z_SETTLE || z === Z_BANK) f = W_IN; else if (z === Z_CLEAR || z === Z_WILD) f = W_OUT;
    if (HF.gk[k] === GK.STREAM && z !== Z_SETTLE) f = 0;
    if (HF.occ[k] === 2 || HF.occ[k] === 4) f = 0;
    if (HF.wallAt[k] >= 0) f = HF.walls[HF.wallAt[k]].gate ? W_GATE : 0;
    W[k] = f;
  }
  for (const d of HF.docks) for (const [i, j] of fp(d.x, d.y, 6, d.len)) if (inMap(i, j)) W[tIdx(i, j)] |= W_DOCK;
  // the bank tiles outside the wall ends belong to the outside
  // inside = flood fill from the green over walkable inside tiles; everything else walkable is outside
  const q = [], gi = Math.floor(HF.oak.x / HT) + 2, gj = Math.floor(HF.oak.y / HT) + 2; HF.inside.fill(0);
  q.push(tIdx(gi, gj)); HF.inside[q[0]] = 1;
  while (q.length) { const k = q.pop(), i = k % HN, j = (k / HN) | 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b; if (!inMap(ii, jj)) continue; const n = tIdx(ii, jj); if (HF.inside[n] || !(W[n] & (W_IN | W_OUT | W_DOCK)) || HF.wallAt[n] >= 0) continue; HF.inside[n] = 1; q.push(n); } }
  for (let k = 0; k < HN * HN; k++) if (W[k] & (W_IN | W_OUT)) W[k] = (W[k] & ~(W_IN | W_OUT)) | (HF.inside[k] ? W_IN : W_OUT);
  // gate tiles: inside/outside neighbours
  const g = HF.gate; g.inTile = -1; g.outTile = -1;
  const mid = HF.walls[g.segs[1]]; g.x = mid.i * HT + 4; g.y = mid.j * HT + 4;
  for (const [a, b] of [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 2], [0, -2]]) { const k = tIdx(mid.i + a, mid.j + b); if (!inMap(mid.i + a, mid.j + b)) continue; if (HF.inside[k] && g.inTile < 0) g.inTile = k; else if (W[k] & W_OUT && g.outTile < 0) g.outTile = k; }
  // wall segment helpers
  for (const s of HF.walls) { s.inT = hfInnerTile(s); s.outT = hfOuterTile(s); s.x = s.i * HT + 4; s.y = s.j * HT + 4; }
  HF.ver++;
}
// passable test for a mask: 'in' settlers inside, 'all' settlers anywhere (gate tiles allowed), 'out' outside only, 'z' zombies (outside + breaches + inside once breached)
function hfPass(k, mask) {
  const w = HF.walk[k];
  if (mask === 'in') return (w & (W_IN | W_DOCK)) !== 0;
  if (mask === 'all') return (w & (W_IN | W_OUT | W_GATE | W_DOCK)) !== 0;
  if (mask === 'out') return (w & W_OUT) !== 0;
  if (mask === 'z') return (w & (W_OUT | W_BREACH)) !== 0 || ((w & W_IN) !== 0 && HF.breaches > 0) || ((w & W_GATE) !== 0 && HF.gate.open > 0.7);
  return false;
}
const _flow = new Map();
function hfFlow(mask, target, maxN) {
  const key = mask + '|' + target + '|' + (mask === 'z' ? HF.ver : 0);
  let f = _flow.get(key); if (f) { f.t = performance.now ? Date.now() : 0; return f.d; }
  const d = new Int16Array(HN * HN).fill(-1), q = new Int32Array(HN * HN); let h = 0, t = 0;
  const tg = Array.isArray(target) ? target : [target]; for (const k of tg) { d[k] = 0; q[t++] = k; }
  while (h < t) { const k = q[h++], i = k % HN, j = (k / HN) | 0, dk = d[k];
    if (maxN && dk > maxN) continue;
    for (let n = 0; n < 8; n++) {
      const a = DX8[n], b = DY8[n], ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= HN || jj >= HN) continue;
      const m = jj * HN + ii; if (d[m] >= 0 || !hfPass(m, mask)) continue;
      if (a && b && (!hfPass(j * HN + ii, mask) || !hfPass(jj * HN + i, mask))) continue;    // no corner cutting
      d[m] = dk + (a && b ? 3 : 2); q[t++] = m;
    }
  }
  if (_flow.size > 260) { let old = null, ot = 1e18; for (const [kk, v] of _flow) if (v.t < ot) { ot = v.t; old = kk; } _flow.delete(old); }
  _flow.set(key, { d, t: Date.now() }); return d;
}
const DX8 = [1, -1, 0, 0, 1, 1, -1, -1], DY8 = [0, 0, 1, -1, 1, -1, 1, -1];
function hfFlowClear(maskPrefix) { for (const k of [..._flow.keys()]) if (!maskPrefix || k.startsWith(maskPrefix)) _flow.delete(k); }
const tileOfW = (x, y) => { const i = clamp(Math.floor(x / HT), 0, HN - 1), j = clamp(Math.floor(y / HT), 0, HN - 1); return j * HN + i; };
const tileC = k => [(k % HN) * HT + 4, ((k / HN) | 0) * HT + 4];
// nearest tile passable for mask (spiral search)
function hfNearPass(x, y, mask, maxR) {
  const i0 = Math.floor(x / HT), j0 = Math.floor(y / HT);
  for (let r = 0; r <= (maxR || 12); r++) for (let j = j0 - r; j <= j0 + r; j++) for (let i = i0 - r; i <= i0 + r; i++) { if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r || !inMap(i, j)) continue; const k = tIdx(i, j); if (hfPass(k, mask)) return k; }
  return -1;
}
if (typeof module !== 'undefined') module.exports = {};
