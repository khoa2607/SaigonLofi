'use strict';
// ===== Sài Gòn Lofi — riverfront: Bến Bạch Đằng-style promenade, Cầu Mống-inspired arch bridge, pier, boats, animated water =====
// Layout (tiles, west edge of the map): far bank 0-5 | river 5-20 | quay + promenade 20-27 | sidewalk 27-30 | riverside road 30-34 (existing)
let GEN_ERA = 0;
const RIV = { x0: 40, x1: 160, laneA: 68, laneB: 100, pierX: 112, pierY: 352, pierStop: 384, bridgeX: 32, bridgeY: 272, bridgeL: 152 };
const RIVER_VIEW = { px: -190, py: -372 }, HOME_VIEW = { px: -110, py: -120 };
const BOAT_ERA = [
  [['sampan', 6], ['barge', 3]],
  [['sampan', 3], ['barge', 3], ['motorboat', 4]],
  [['motorboat', 3], ['tour', 4], ['barge', 2]],
  [['waterbus', 4], ['tour', 3], ['motorboat', 2], ['barge', 1]]
];
const DOCKABLE = { sampan: 1, tour: 1, waterbus: 1 };
const RIVER_MOOD = ['boat', 'heart', 'smile', 'note', 'sun'];
const BOATDOCK = { on: false, boat: null };
const WATER = { ripples: [] };
const OV = {}; let OVJOB = null;
SIM.boats = []; POI.river = []; POI.pier = [];
const inGap = y => (y >= 33 && y <= 36) || (y >= 43 && y <= 52);   // openings in the railing: bridge landing, pier gangway

// ---------------------------------------------------------------- ground colours
function riverColor(t, wx, wy, tx, ty, season) {
  const n = hash2(wx, wy), vn = vnoise(wx / 6, wy / 6), win = season === 'winter', e = GEN_ERA, lx = wx - tx * T, ly = wy - ty * T;
  if (t === G_RIVER || t === G_BRIDGE) {
    let c = vn > 0.58 ? 0x4f8e8a : vn > 0.34 ? 0x468482 : 0x3e7a7a;
    if (e === 3) c = mixc(c, 0x6aa4c0, 0.25); else if (e === 2) c = mixc(c, 0x6aa0b4, 0.12);
    if (((wy + Math.sin(wx / 6) * 2.4) % 9) < 0.6) c = mixc(c, 0x9ad0c8, 0.35); else if (hash2(wx * 2, wy * 2) > 0.97) c = mixc(c, 0xdff0e4, 0.4);
    const dx = wx / T; if (dx > 19.2) c = mixc(c, 0x3a5a5a, (dx - 19.2) * 0.5); if (dx < 5.8) c = mixc(c, 0x4a5a40, (5.8 - dx) * 0.4);
    return win ? mixc(c, 0xaec4d8, 0.3) : c;
  }
  if (t === G_BANK) {
    let c = wx > 30 ? 0x7a6a4a : (vn > 0.55 ? 0x6f8a48 : 0x628040);
    if (season === 'fall') c = mixc(c, 0xb09a50, 0.4); if (win) c = vnoise(wx / 5 + 7, wy / 5) > 0.55 ? 0xe8eef4 : mixc(c, 0xc8d0c0, 0.4);
    if (n > 0.9) c = shade(c, 0.1); if (season === 'spring' && n < 0.03) c = 0xf39abf; return c;
  }
  if (t === G_PIER) { const p = (wy % 3) < 0.8; return e <= 1 ? (p ? 0x7a5a3a : 0x9a7a52) : (e === 2 ? (p ? 0xb8bcc0 : 0xcfd2d4) : (p ? 0xc8d0d4 : 0xe0e6e8)); }
  // promenade, per era: worn concrete -> coral brick -> pale granite -> polished tile with light strips
  let c; const edge = tx === 20;
  if (e === 0) { c = (lx < 0.8 || ly < 0.8) ? 0x8f887c : vn > 0.62 ? 0xa59d8c : 0xb0a898; if (n > 0.95) c = 0x8a8478; if (vnoise(wx / 5 + 3, wy / 5) > 0.68) c = mixc(c, 0x6a8a50, 0.4); if (edge && lx > 5) c = 0x8a8070; }
  else if (e === 1) { const h4 = hash2(wx / 4 | 0, wy / 4 | 0); c = (wx % 4 < 0.8 || wy % 4 < 0.8) ? 0xa08070 : h4 < 0.4 ? 0xcc9478 : 0xc08a70; if (edge && lx > 5) c = 0xb8b0a0; }
  else if (e === 2) { c = (lx < 0.7 || ly < 0.7) ? 0xbab4a6 : ((tx + ty) & 1) ? 0xdcd6c8 : 0xd2ccbe; if (tx === 23 || tx === 24) c = (lx < 0.7 || ly < 0.7) ? 0xaaa496 : 0xc6b8a0; if (edge && lx > 5) c = 0x9a9488; }
  else { c = (lx < 0.6 || ly < 0.6) ? 0xc8c2b6 : ((tx + ty) & 1) ? 0xe2ddd2 : 0xdad5ca; if (ty % 6 === 0 && ly < 1.2) c = 0xf2eee4; if (tx === 22 && (wy | 0) % 2 === 0) c = 0xe6cc70; if (edge && lx > 5) c = 0xa8a498; }
  if (win && vnoise(wx / 5, wy / 5 + 9) > 0.6) c = n > 0.7 ? 0xe2e9f2 : 0xf0f4fa;
  return c;
}

// ---------------------------------------------------------------- props: railings, lamps, benches, bollards
PROP.railA = () => { const B = []; for (const y of [-7.5, -0.5, 6.5]) B.push(box(-0.6, y, 0, 1.2, 1.2, 7, 0x7a5a4a)); B.push(box(-0.4, -8, 6.4, 0.8, 16, 0.8, 0x8a6a5a), box(-0.4, -8, 3.2, 0.8, 16, 0.7, 0x7a5a4a)); return B; };
PROP.railB = () => { const B = []; for (const y of [-7.5, -0.5, 6.5]) B.push(box(-0.6, y, 0, 1.2, 1.2, 7, 0xf2efe6)); B.push(box(-0.4, -8, 6.4, 0.8, 16, 0.8, 0xf7f4ec), box(-0.4, -8, 3.2, 0.8, 16, 0.7, 0xe6e2d6)); return B; };
PROP.railC = () => { const B = [box(-1.2, -8, 0, 2.4, 16, 1.6, 0xd4cebf), box(-1, -8, 6.2, 2, 16, 1.4, 0xe6e0d2)]; for (let y = -7; y < 8; y += 3) B.push(box(-0.7, y, 1.6, 1.4, 1.4, 4.6, 0xe8e2d4, (f, u, v) => (v | 0) % 2 ? undefined : shade(0xe8e2d4, -0.1))); return B; };
PROP.railD = () => [box(-0.3, -8, 0, 0.6, 16, 0.8, 0xc8ccd0), box(-0.2, -8, 0.8, 0.4, 16, 5.4, 0xcdeaf2), box(-0.5, -8, 6.2, 1, 16, 0.9, 0xc8ccd0), box(-0.3, -8, 6, 0.6, 16, 0.4, 0x9fe0ff, null, { em: 0xa0e8ff })];
PROP.lampA = () => [box(-0.9, -0.9, 0, 1.8, 1.8, 19, 0x9a968c), box(-0.4, -0.4, 19, 0.8, 3, 0.8, 0x7a766c), box(-1.2, 1.6, 17.6, 2.4, 1.4, 1.4, 0xfff0b0, null, { em: 0xffe9a0 })];
PROP.lampB = () => [box(-0.6, -0.6, 0, 1.2, 1.2, 22, 0x3a5a4a), box(-2, -2, 22, 4, 4, 3.6, 0xf4f0dc, null, { em: 0xffe9a0 }), box(-2.4, -2.4, 25.6, 4.8, 4.8, 0.9, 0x3a5a4a)];
PROP.lampC = () => [box(-1.4, -1.4, 0, 2.8, 2.8, 3, 0x2a2a30), box(-0.6, -0.6, 3, 1.2, 1.2, 19, 0x2a2a30), box(-5, -0.4, 21, 10, 0.8, 0.8, 0x2a2a30), box(-6.4, -1.4, 21.6, 2.8, 2.8, 3.2, 0xfff4d0, null, { em: 0xffe0a0 }), box(3.6, -1.4, 21.6, 2.8, 2.8, 3.2, 0xfff4d0, null, { em: 0xffe0a0 })];
PROP.lampD = () => [box(-0.5, -0.5, 0, 1, 1, 24, 0xc8ccd0), box(-1.4, -0.3, 24, 6, 0.6, 0.8, 0xc8ccd0), box(-1.8, -1, 23, 5, 2, 1.2, 0xf4fbff, null, { em: 0xdfefff }), box(0.5, -0.3, 11, 0.4, 0.4, 8, 0x8a9098), box(0.5, -2.2, 12, 0.4, 4.4, 6, 0x1f8ac8)];
PROP.benchR = () => [box(-1.8, -7, 2.4, 3.6, 14, 0.8, 0x8a5a3a, (f, u, v) => f === 0 && (u | 0) % 2 ? shade(0x8a5a3a, -0.1) : undefined), box(0.4, -7, 3.2, 0.8, 14, 3.4, 0x8a5a3a), box(-1.4, -6.4, 0, 0.8, 1, 2.4, 0x2a2a30), box(-1.4, 5.4, 0, 0.8, 1, 2.4, 0x2a2a30), box(1.2, -6.4, 0, 0.8, 1, 2.4, 0x2a2a30), box(1.2, 5.4, 0, 0.8, 1, 2.4, 0x2a2a30)];
PROP.bollard = () => [box(-1, -1, 0, 2, 2, 3.6, 0x2a2a30), box(-1.4, -1.4, 3.6, 2.8, 2.8, 1.2, 0xc0392b)];
Object.assign(ERA_SWAP, { rail: [['railA', 0, 0], ['railB', 1, 1], ['railC', 2, 2], ['railD', 3, 3]], rlamp: [['lampA', 0, 0], ['lampB', 1, 1], ['lampC', 2, 2], ['lampD', 3, 3]] });

// ---------------------------------------------------------------- boats (models face +x; rotated to run along the river)
VEH.sampan = v => ({ L: 24, W: 7, seats: [{ x: 18, z: 3.2 }], boxes: [box(1, 0.8, 0, 22, 5.4, 1.6, 0x6a4a32), box(0, 0, 1.2, 24, 7, 2, 0x9a6a42, (f, u) => f !== 0 && (u | 0) % 3 === 0 ? 0x7a5232 : undefined), box(22.5, 1.4, 1.4, 2.4, 4.2, 1.6, 0x9a6a42), box(-0.6, 1.2, 1.4, 1.4, 4.6, 1.4, 0x8a5a3a), box(6, 0.6, 3.4, 10, 5.8, 1.3, 0xc9a86a, (f, u, vv) => f === 0 ? ((u | 0) % 2 ? 0xc9a86a : 0xb08a52) : 0xa98a54), box(6, 0.4, 3.2, 0.8, 0.8, 1.6, 0x6a4a32), box(15.4, 0.4, 3.2, 0.8, 0.8, 1.6, 0x6a4a32)] });
VEH.barge = v => ({ L: 46, W: 12, seats: [], boxes: [box(0, 0, 0, 46, 12, 3.2, 0x44506a, (f, u, vv) => f !== 0 && vv < 1 ? 0x7a3a2a : (f !== 0 && (u | 0) % 5 === 0 ? 0x3a4660 : undefined)), box(44, 2, 0, 2.5, 8, 3.2, 0x44506a), box(9, 1.5, 3.2, 28, 9, 3.2, 0xc9b88a, (f, u, vv) => hash2(u | 0, (vv * 2) | 0) > 0.7 ? 0xb0a070 : undefined), box(13, 3, 6.4, 20, 6, 2, 0xd6c79a), box(1.5, 2.5, 3.2, 7, 7, 7, 0xe8e2d0, (f, u, vv) => f !== 0 && vv > 2 && vv < 5 && u > 1 && u < 6 ? (EM = 0xffd98a, 0x3a5470) : undefined), box(0.9, 2, 10.2, 8.4, 8, 1, 0x8a4a3a), box(3.4, 5.4, 11.2, 1.6, 1.6, 3, 0x2a2a30)] });
VEH.motorboat = v => { const c = [0x2f6ab8, 0xc0392b, 0x1f8a6a][v % 3]; return { L: 30, W: 8, seats: [{ x: 21, z: 3.6 }, { x: 24.5, z: 3.6 }], boxes: [box(0, 0, 0.2, 30, 8, 2.4, 0xf4f4f0, (f, u, vv) => f !== 0 && vv < 0.9 ? c : undefined), box(27, 1.4, 0.6, 4, 5.2, 1.8, 0xf4f4f0), box(5, 1.4, 2.6, 11, 5.2, 4.2, 0xf4f4f0, (f, u, vv) => f !== 0 && vv > 1.4 && vv < 3.4 && u > 1 && u < 9.6 ? (EM = 0xffd98a, 0x3a5470) : undefined), box(4.4, 1, 6.8, 12.2, 6, 0.8, c)] }; };
VEH.tour = v => { const B = [box(0, 0, 0, 46, 13, 3, 0xf2f0e8, (f, u, vv) => f !== 0 && vv < 1 ? 0xc0392b : undefined), box(44, 2, 0, 3, 9, 3, 0xf2f0e8), box(4, 1.2, 3, 34, 10.6, 6, 0xf8f6ee, (f, u, vv, b) => { if (f === 0) return 0xe8d8b0; const W = f === 1 ? b.w : b.d; return vv > 1.4 && vv < 4.6 && u > 1 && u < W - 1 && (u % 4) < 3 ? (EM = 0xffd070, 0x3a5470) : undefined; }), box(3, 0.8, 9, 36, 11.4, 0.8, 0xe8d8b0), box(10, 1.4, 13.6, 22, 10, 0.8, 0xd9534f, (f, u, vv) => f === 0 ? ((u / 3 | 0) % 2 ? 0xd9534f : 0xf7f4ec) : undefined)]; for (const x of [10, 30]) for (const y of [1.4, 10.4]) B.push(box(x, y, 9.8, 0.8, 0.8, 3.8, 0xc8ccd0)); for (let x = 5; x < 40; x += 4.2) for (const y of [1, 11.8]) B.push(box(x, y, 9.8, 0.8, 0.8, 0.8, 0xffd890, null, { em: 0xffc870 })); return { L: 46, W: 13, seats: [{ x: 14, z: 9.8 }, { x: 19, z: 9.8 }, { x: 25, z: 9.8 }, { x: 31, z: 9.8 }], boxes: B }; };
VEH.waterbus = v => ({ L: 44, W: 12, seats: [], boxes: [box(0, 0, 0, 44, 4.4, 2.4, 0xe8eef0), box(0, 7.6, 0, 44, 4.4, 2.4, 0xe8eef0), box(2, 3.8, 1.6, 40, 4.4, 1.2, 0xdfe6ea), box(3, 0.4, 2.4, 38, 11.2, 6.4, 0xf4f8fa, (f, u, vv, b) => { if (f === 0) return 0xdfe8ec; const W = f === 1 ? b.w : b.d; if (vv < 1.2) return 0x1f8ac8; return vv > 2 && vv < 5.4 && u > 1 && u < W - 1 && (u % 5) < 4 ? (EM = 0xcfeaff, 0x5a8aa8) : undefined; }), box(2.4, 0, 8.8, 39.2, 12, 1, 0xdfe8ec, (f, u, vv) => f === 0 ? ((u | 0) % 4 === 0 || (vv | 0) % 4 === 0 ? 0x8a9aa8 : 0x2a3f6a) : 0xb8c0c8), box(42, 1.2, 2.4, 3, 9.6, 5, 0xf4f8fa), box(0, 2.4, 2.4, 1, 7.2, 0.8, 0x7aeaff, null, { em: 0x7aeaff })] });

// ---------------------------------------------------------------- pier & bridge
function pierBoxes(era) {
  const B = [], wood = 0x8a6a4a, planks = c => (f, u, v) => f === 0 ? ((v | 0) % 3 === 0 ? shade(c, -0.18) : c) : undefined;
  if (era <= 1) {
    B.push(box(0, 4, 1.4, 38, 56, 1.6, wood, planks(wood)), box(38, 26, 1.4, 10, 12, 1.2, wood, planks(wood)));
    for (const x of [1, 19, 36]) for (const y of [4, 32, 58]) B.push(box(x, y, 0, 1.6, 1.6, 6, 0x5a4030));
    if (era === 1) { B.push(box(4, 12, 11, 26, 26, 1.2, 0x6f9ac0, corr(0x6f9ac0))); for (const [x, y] of [[6, 14], [28, 14], [6, 36], [28, 36]]) B.push(box(x, y, 3, 1, 1, 8, 0x6b6258)); B.push(box(0, 4, 3, 38, 0.8, 0.8, 0x9a968c)); }
  } else if (era === 2) {
    B.push(box(0, 2, 0.8, 38, 60, 2, 0xcfd2d4, (f, u, v) => f === 0 ? ((v | 0) % 4 === 0 ? 0xbfc3c6 : 0xcfd2d4) : (v < 0.9 ? 0x3d6fb5 : 0xe8eaec)), box(38, 24, 2.4, 10, 12, 1, 0xc8ccd0));
    for (const [x, y] of [[4, 14], [30, 14], [4, 48], [30, 48]]) B.push(box(x, y, 2.8, 1, 1, 9, 0xe8eaec));
    B.push(box(2, 12, 11.8, 30, 40, 1.4, 0x3d6fb5, (f, u, vv) => f === 0 ? ((u / 3 | 0) % 2 ? 0x3d6fb5 : 0xf7f4ec) : undefined), box(26, 4, 2.8, 9, 9, 8, 0xf7f4ec, (f, u, vv) => f === 1 && vv > 3 && vv < 6 && u > 2 && u < 7 ? (EM = 0xffe0a0, 0x4a6680) : undefined), box(26, 4, 10.8, 9, 9, 1, 0xd9534f));
  } else {
    B.push(box(0, 2, 0.8, 38, 60, 2, 0xe4eaec, (f, u, v) => f === 0 ? ((v | 0) % 6 === 0 ? 0xd0d8dc : 0xe4eaec) : (v < 0.9 ? 0x1fb5ad : 0xf4f8fa)), box(38, 24, 2.4, 10, 12, 1, 0xc8ccd0), box(0, 2, 2.8, 38, 0.5, 0.4, 0x7aeaff, null, { em: 0x7aeaff }), box(0, 61.5, 2.8, 38, 0.5, 0.4, 0x7aeaff, null, { em: 0x7aeaff }));
    for (const [x, y] of [[8, 12], [32, 12], [8, 54], [32, 54]]) B.push(box(x, y, 2.8, 1, 1, 9.4, 0xc8ccd0));
    B.push(box(8, 10, 12.2, 26, 46, 1.2, 0x2a3a4a, (f, u, vv) => f === 0 ? ((u | 0) % 4 === 0 || (vv | 0) % 5 === 0 ? 0xaab4c4 : 0x2a3f6a) : 0x8a909a), box(33.2, 10, 10.4, 0.8, 46, 2.8, 0x1f8ac8, (f, u, vv) => { if (f !== 2) return undefined; const t = 'WATERBUS', u0 = Math.floor((46 - textW(t)) / 2); if (textAt(t, u - u0, vv - 0.6)) { EM = 0xffffff; return 0xffffff; } EM = 0x105070; return undefined; }), box(32, 12, 2.8, 1, 42, 9, 0xbfe4f0, (f) => (EM = 0x6a8a90, 0xbfe4f0)), box(26, 24, 3.6, 3, 14, 1.2, 0x8a5a3a), box(26, 38, 3.6, 3, 10, 1.2, 0x8a5a3a));
  }
  return B;
}
function bridgeBoxes(era) {
  const L = RIV.bridgeL, B = [], steel = [0x7a6a62, 0x8ba4be, 0xeef2f6, 0xf4f7fa][era], ZD = 10, deckC = era === 0 ? 0x8a6a4a : era === 1 ? 0x9a8a78 : 0xc4b8a4, stone = era === 0 ? 0x7f786c : 0x9a9488;
  const sp = c => (f, u, v, b, wx, wy) => (era === 0 && hash2((wx | 0) + (wy | 0), (v | 0)) > 0.82) ? 0x8a4a2a : (era === 0 && vnoise(u / 3, v) > 0.7 ? 0x6a5a52 : c);
  B.push(box(0, 0, ZD, L - 24, 16, 2, deckC, (f, u, v) => f === 0 ? (((u | 0) % 3 === 0) ? shade(deckC, -0.15) : deckC) : shade(deckC, -0.1)));
  for (let k = 0; k < 6; k++) B.push(box(L - 24 + k * 4, 0, 0, 4, 16, 12 - k * 2, stone, (f, u, v) => f === 0 ? ((u | 0) % 2 ? stone : shade(stone, -0.1)) : undefined));
  B.push(box(-2, -1, 0, 8, 18, ZD + 2, stone), box(44, 1, 0, 8, 14, ZD, stone, (f, u, v) => v < 1 ? 0x4a5a40 : undefined), box(92, 1, 0, 8, 14, ZD, stone, (f, u, v) => v < 1 ? 0x4a5a40 : undefined));
  const x0 = 10, x1 = L - 40, xc = (x0 + x1) / 2, hw = (x1 - x0) / 2, H = 24, led = era === 2 ? [0xffd890, 0xffc870] : era === 3 ? [0x9fe0ff, 0x6ad0ff] : null;
  for (const y of [-0.4, 14.8]) B.push(box(0, y, ZD - 1, L - 24, 1.6, 3.2, steel, sp(steel)));
  for (const y of [-0.3, 14.7]) {
    for (let x = x0; x <= x1; x += 1.4) { const u = (x - xc) / hw, z = ZD + 2 + H * (1 - u * u); B.push(box(x, y, z - 1.2, 2.2, 1.6, 2.6, steel, sp(steel))); }
    for (let x = x0 + 5; x < x1 - 3; x += 6.2) { const u = (x - xc) / hw, z = ZD + 2 + H * (1 - u * u); B.push(box(x + 0.6, y + 0.4, ZD + 2, 0.8, 0.8, z - ZD - 2, steel, sp(steel))); }
    for (let x = x0 + 8; x < x1 - 6; x += 12.4) { const u0 = (x - xc) / hw, u1 = (x + 6.2 - xc) / hw, za = ZD + 2 + H * (1 - u0 * u0), zb = ZD + 2 + H * (1 - u1 * u1); for (let s = 0; s < 5; s++) B.push(box(x + s * 1.24, y + 0.5, ZD + 2 + (zb - ZD - 2) * s / 5 * 0.9 + (za - ZD - 2) * (1 - s / 5) * 0.1, 1.3, 0.6, 1.3, steel)); }
    if (led) for (let x = x0 + 2; x <= x1 - 2; x += 4.2) { const u = (x - xc) / hw, z = ZD + 2 + H * (1 - u * u); B.push(box(x + 0.6, y + 0.4, z + 1.5, 0.8, 0.8, 0.8, led[0], null, { em: led[1] })); }
  }
  for (const f of [-0.5, 0, 0.5]) { const x = xc + f * hw, z = ZD + 2 + H * (1 - f * f); B.push(box(x, 0, z + 0.4, 1.4, 16, 1.2, steel, sp(steel))); }
  return B;
}
function hazeBoxes(B, k) { const H = 0xb9c6d4; return B.map(b => { const o = Object.assign({}, b), p0 = b.p, c0 = b.c; o.c = mixc(c0, H, k); o.p = (f, u, v, bb, wx, wy) => { let c = p0 ? p0(f, u, v, bb, wx, wy) : c0; if (c === undefined) c = c0; if (c < 0) return c; return mixc(c, H, k); }; return o; }); }
function bankBuilding(seed, era, tall) {
  const R = mulberry32(seed), w = 28, d = 28 + (seed % 3) * 6;
  if (era === 0) return hazeBoxes(backHouse(R, w, d, 1, 0), 0.3);
  if (era === 1) return hazeBoxes(backHouse(R, w, d, tall ? 3 : 2, 1), 0.3);
  if (era === 2) return hazeBoxes(tall ? aptTower(R, w, 28, 8 + seed % 4) : backHouse(R, w, d, 3, 2), 0.3);
  return hazeBoxes(tall ? aptTower(R, w, 28, 13 + seed % 7) : backHouse(R, w, d, 3, 3), 0.3);
}

// ---------------------------------------------------------------- layout
function genRiverfront() {
  const R = mulberry32(8080);
  fill(0, 0, 5, N, G_BANK); fill(5, 0, 20, N, G_RIVER); fill(20, 0, 27, N, G_PROM); fill(27, 0, 30, N, G_SIDE);
  for (let y = 0; y < N; y++) for (let x = 0; x < 30; x++) { BLK[gi(x, y)] = 0; PAVE[gi(x, y)] = 0; }
  fill(5, 34, 20, 36, G_BRIDGE); fill(2, 33, 5, 37, G_PROM); fill(14, 44, 20, 52, G_PIER);
  for (let y = 0; y < N; y++) if (!((y >= 33 && y <= 36) || (y >= 44 && y <= 51))) BLK[gi(20, y)] = 1;      // railing line
  for (let y = 1; y < N - 1; y += 2) if (!inGap(y) && !inGap(y + 1)) addP('rail', [161, y * T + 8], {});
  for (let m = 0; m * 20 + 6 < N - 4; m++) {
    const yl = m * 20 + 6, yb = m * 20 + 10, yt = m * 20 + 14, yp = m * 20 + 18;
    if (!inGap(yl)) { addP('rlamp', [190, yl * T + 4], { block: true }); CITY.lamps.push([190, yl * T + 4, 22]); }
    if (!inGap(yb) && !inGap(yb + 1)) { addP('benchR', [178, yb * T + 4], { block: true }); for (const k of [-3.6, 3.6]) POI.bench.push({ x: 177, y: yb * T + 4 + k, dir: 2, vx: 188, vy: yb * T + 4, k: 'bench', ped: null }); }
    if (!inGap(yt)) addT(sp(R, ['me', 'bang', 'dau']), 212, yt * T + 4, si(R, 0, 3));
    if (!inGap(yp)) addP('planter', [198, yp * T + 4], { mirror: true, e0: 1, e1: 3, v: m });
    if (!inGap(yl + 8)) addP('bollard', [165, (yl + 8) * T + 4], { e0: 0, e1: 3 });
  }
  for (let y = 8; y < N - 6; y += 10) if (!inGap(y) && !inGap(y + 1)) POI.river.push({ x: 168, y: y * T + 4, dir: 2, ped: null });
  for (const x of [56, 100, 140]) POI.river.push({ x, y: RIV.bridgeY + 8, dir: 1, ped: null });
  POI.river.push({ x: 24, y: RIV.bridgeY + 8, dir: 0, ped: null });
  for (const dy of [-22, 0, 22]) POI.pier.push({ x: 151, y: RIV.pierStop + dy, ped: null });   // east edge, outside the canopy
  // far bank: low roofs in the 90s growing into towers, softened by haze
  let idx = 0; for (let y = 3; y < N - 6; y += 8, idx++) { if (y > 24 && y < 40) continue; const seed = 700 + idx * 13, tall = idx % 3 === 0; addB(era => bankBuilding(seed, era, tall && (era >= 2 || idx % 2 === 0)), 1, y, 4, 5, { keep: 1 }); }
  for (let y = 2; y < N - 3; y += 6) if (!(y > 28 && y < 40)) addT(sp(R, ['cau', 'cau', 'me']), 36, y * T + 3, si(R, 0, 3));
  addB(era => bridgeBoxes(era), 4, 34, 19, 2, { keep: 1 });
  addB(era => pierBoxes(era), 14, 44, 6, 8, { keep: 1 });
}
// how high above the ground a walker stands (the bridge deck and its ramp)
function bridgeLift(x, y) { if (y < 270 || y > 290 || x < 36 || x > 184) return 0; return x < 160 ? 12 : 12 * (184 - x) / 24; }

// ---------------------------------------------------------------- ground overlay for the era-dependent paving (x tiles 20-26)
function ovStart(season, era) { return { season, era, c: mk((WORLD + 240) * K, 760 * K), v: 0 }; }
function ovStep(job, ms) {
  const t0 = performance.now(), g = job.c.getContext('2d'), W = job.c.width, HH = 760 * K, old = GEN_ERA; GEN_ERA = job.era;
  while (job.v < HH && performance.now() - t0 < ms) {
    const v0 = job.v, v1 = Math.min(HH, v0 + 12), id = g.createImageData(W, v1 - v0), d = id.data;
    for (let v = v0; v < v1; v++) {
      const sy = (v + 0.5) / K, a = Math.max(2 * (160 - sy), 2 * (sy - WORLD)), b = Math.min(2 * (216 - sy), 2 * sy);
      for (let U = Math.floor((a + WORLD) * K); U < (b + WORLD) * K; U++) {
        if (U < 0 || U >= W) continue; const sxc = (U + 0.5) / K - WORLD, wx = sy + sxc / 2, wy = sy - sxc / 2;
        if (wx < 160 || wx >= 216 || wy < 0 || wy >= WORLD) continue;
        const tx = wx >> 3, ty = wy >> 3, col = groundColor(GT[gi(tx, ty)], wx, wy, tx, ty, job.season), k = ((v - v0) * W + U) * 4;
        d[k] = col >> 16 & 255; d[k + 1] = col >> 8 & 255; d[k + 2] = col & 255; d[k + 3] = 255;
      }
    }
    g.putImageData(id, 0, v0); job.v = v1;
  }
  GEN_ERA = old; return job.v >= HH;
}
function ensureOv(season, era) {
  if (era === 0 || OV[season + era]) return;
  let job = OVJOB && OVJOB.season === season && OVJOB.era === era ? OVJOB : ovStart(season, era);
  while (!ovStep(job, 1000));
  OV[season + era] = job.c; if (OVJOB === job) OVJOB = null;
}
function ovPrebake() {
  if (!G.world || G.busy) return false;
  if (OVJOB) { if (ovStep(OVJOB, 4)) { OV[OVJOB.season + OVJOB.era] = OVJOB.c; OVJOB = null; } return true; }
  for (const e of [G.era, 1, 2, 3]) if (e > 0 && !OV[G.season + e]) { OVJOB = ovStart(G.season, e); return true; }
  return false;
}

// ---------------------------------------------------------------- boats
function makeBoat(lane, kind, y) {
  const v = ri(0, 4), m = vehModel(kind, v), sp = { sampan: [9, 12], barge: [7, 9], motorboat: [20, 26], tour: [11, 14], waterbus: [14, 18] }[kind], b = { kind, v, lane, x: lane.x, y, dir: lane.dir, sp: 0, vmax: rr(sp[0], sp[1]), len: m.L, riders: [], state: 'run', dwell: 0, willDock: !!DOCKABLE[kind] && lane.dir < 0 && chance(0.85), docked: false, obs: false };
  if (kind === 'sampan') b.riders.push(riderSheet('driver')); else if (kind === 'motorboat') { b.riders.push(riderSheet(pick(['youth', 'office', 'dress']))); if (chance(0.5)) b.riders.push(riderSheet(pick(['modern', 'baba']))); } else if (kind === 'tour') for (let i = 0; i < ri(2, 4); i++) b.riders.push(riderSheet(wpick([['modern', 3], ['fashion', 2], ['kid', 1], ['youth', 2]])));
  return b;
}
function boatDock(b) {
  BOATDOCK.on = true; BOATDOCK.boat = b;
  for (let i = 0, n = ri(1, 3); i < n; i++) { const p = new Ped(RIV.pierX + 30 + rr(-4, 4), RIV.pierStop + rr(-16, 16)); p.dir = 0; makePlan(p); SIM.peds.push(p); if (i === 0) p.say(pick(['smile', 'boat', 'note']), 2.4); }
  if (G.onSfx) G.onSfx('door'); if (chance(0.4)) ticker(b.kind === 'waterbus' ? 'Buýt sông cập bến, khách lên xuống nhẹ nhàng' : b.kind === 'tour' ? 'Tàu du lịch ghé bến Bạch Đằng đón khách' : 'Chiếc ghe nhỏ ghé bến đón khách qua sông');
}
let _boatT = 5;
function updateBoats(dt) {
  const fx = SIM.focus[0], fy = SIM.focus[1], nearRiver = Math.abs(fx - 100) < 640;
  if (nearRiver) _boatT -= dt;
  if (_boatT <= 0 && nearRiver && SIM.boats.length < 3) {
    _boatT = rr(11, 24); const lane = pick([{ x: RIV.laneA, dir: 1 }, { x: RIV.laneB, dir: -1 }]);
    if (!SIM.boats.some(b => b.x === lane.x)) { const y = clamp(fy + (lane.dir > 0 ? -380 : 380), -60, WORLD + 60); SIM.boats.push(makeBoat(lane, wpick(BOAT_ERA[G.era]), y)); }
  }
  for (let i = SIM.boats.length - 1; i >= 0; i--) {
    const b = SIM.boats[i]; let vd = b.vmax * (b.obs ? 1.4 : 1);
    if (b.state === 'run' && b.willDock && !b.docked && b.dir < 0 && b.y > RIV.pierStop && b.y - RIV.pierStop < 120) { vd = Math.min(vd, (b.y - RIV.pierStop) * 0.7 + 1.2); if (b.y - RIV.pierStop < 1.5 && b.sp < 2) { b.state = 'dock'; b.dwell = rr(8, 12); boatDock(b); } }
    if (b.state === 'dock') { vd = 0; b.dwell -= dt; if (b.dwell <= 0) { b.state = 'leave'; b.docked = true; BOATDOCK.on = false; BOATDOCK.boat = null; } }
    b.sp += clamp(vd - b.sp, -9 * dt, 4 * dt); if (b.sp < 0) b.sp = 0; b.y += b.dir * b.sp * dt;
    if (b.y < -90 || b.y > WORLD + 90 || Math.abs(b.y - fy) > 760 || (b.obs && !G.onScreen(b.x, b.y, 90))) { if (BOATDOCK.boat === b) { BOATDOCK.on = false; BOATDOCK.boat = null; } SIM.boats.splice(i, 1); }
  }
}
function riverEraShift() { for (const b of SIM.boats) { b.obs = !BOAT_ERA[G.era].some(e => e[0] === b.kind); if (b.obs) b.willDock = false; } }

// ---------------------------------------------------------------- animated water (drawn right after the ground, under everything else)
function waterCells() {
  const vw = R.vw, vh = R.vh; let xmin = 1e9, xmax = -1e9, ymin = 1e9, ymax = -1e9;
  for (const c of [[0, 0], [vw, 0], [0, vh], [vw, vh]]) { const x = (c[1] - R.cy) + (c[0] - R.cx) / 2, y = (c[1] - R.cy) - (c[0] - R.cx) / 2; xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
  if (xmax < RIV.x0 || xmin > RIV.x1) return null;
  const C = 7; return { C, gx0: Math.max(Math.ceil(RIV.x0 / C), Math.floor(xmin / C)), gx1: Math.min(Math.floor((RIV.x1 - 3) / C), Math.ceil(xmax / C)), gy0: Math.max(0, Math.floor(ymin / C)), gy1: Math.min(Math.floor(WORLD / C), Math.ceil(ymax / C)) };
}
function updateWater(dt) {
  const rain = G.season === 'winter' ? 0 : G.rain;
  if (rain > 0.12 && waterCells()) { let c = rain * dt * 40; c = Math.floor(c) + (Math.random() < c % 1 ? 1 : 0); for (; c > 0; c--) for (let k = 0; k < 4; k++) { const sx = rr(0, R.vw), sy = rr(0, R.vh), wx = (sy - R.cy) + (sx - R.cx) / 2, wy = (sy - R.cy) - (sx - R.cx) / 2; if (wx > RIV.x0 + 2 && wx < RIV.x1 - 2 && wy > 0 && wy < WORLD) { WATER.ripples.push({ x: wx, y: wy, t: 0 }); break; } } }
  for (const r of WATER.ripples) r.t += dt; WATER.ripples = WATER.ripples.filter(r => r.t < 0.6);
  if (R.tween) { const tw = R.tween; R.panX += (tw.px - R.panX) * Math.min(1, dt * 3.4); R.panY += (tw.py - R.panY) * Math.min(1, dt * 3.4); camera(); if (Math.abs(tw.px - R.panX) < 1 && Math.abs(tw.py - R.panY) < 1) R.tween = null; }
}
function drawWater(g) {
  const cells = waterCells(); if (!cells) return;
  const { C, gx0, gx1, gy0, gy1 } = cells, t = G.t, win = G.season === 'winter', cr = win ? '226,240,255' : '255,246,220';
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    const h = hash2(gx * 3 + 1, gy * 7 + 2); if (h > 0.3) continue;
    const off = (t * 1.3 + h * 70) % C, a = Math.sin(off / C * Math.PI); if (a < 0.3) continue;
    const s = scn(gx * C + hash2(gx, gy + 9) * C, gy * C + off, 0);
    g.fillStyle = 'rgba(' + cr + ',' + (a * 0.4).toFixed(2) + ')'; g.fillRect(s[0], s[1], 3 + (h * 13 & 1), 0.5);
    if (a > 0.75) { g.fillStyle = 'rgba(30,64,74,0.22)'; g.fillRect(s[0] + 1, s[1] + 0.5, 2, 0.5); }
  }
  for (const b of SIM.boats) if (b.sp > 1.5) { const k = Math.min(1, b.sp / 10); for (let i = 0; i < 11; i++) { const wy = b.y - b.dir * (b.len / 2 + 1 + i * 2.6), sp2 = 1.4 + i * 0.75, a = 0.5 * k * (1 - i / 11); g.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; for (const sd of [-1, 1]) { const s = scn(b.x + sd * sp2, wy, 0); g.fillRect(s[0], s[1], 2, 1); } } }
  g.fillStyle = 'rgba(235,245,255,0.5)';
  for (const r of WATER.ripples) { const s = scn(r.x, r.y, 0); if (r.t < 0.14) g.fillRect(s[0], s[1], 1, 1); else if (r.t < 0.3) g.fillRect(s[0] - 1, s[1], 3, 1); else if (r.t < 0.45) { g.fillRect(s[0] - 2, s[1], 1, 1); g.fillRect(s[0] + 2, s[1], 1, 1); g.fillRect(s[0] - 1, s[1] - 1, 3, 1); g.fillRect(s[0] - 1, s[1] + 1, 3, 1); } else { g.fillStyle = 'rgba(235,245,255,0.25)'; g.fillRect(s[0] - 3, s[1], 1, 1); g.fillRect(s[0] + 3, s[1], 1, 1); g.fillRect(s[0] - 2, s[1] - 1, 5, 1); g.fillRect(s[0] - 2, s[1] + 1, 5, 1); g.fillStyle = 'rgba(235,245,255,0.5)'; } }
}
// night: lamp, boat and far-bank window reflections wobbling on the water (additive pass)
function drawWaterLights(lg, lights) {
  const cells = waterCells(); if (!cells || lights < 0.05) return; const t = G.t;
  const streak = (wx, wy, r, g2, b2, a, len) => { const s = scn(wx, wy, 0); for (let i = 0; i < len; i++) { const jx = Math.round(Math.sin(t * 1.6 + i * 0.9 + wx) * (0.6 + i * 0.14)); lg.fillStyle = 'rgba(' + r + ',' + g2 + ',' + b2 + ',' + (a * (1 - i / len) * lights).toFixed(3) + ')'; lg.fillRect(s[0] + jx - 1, s[1] + i * 2, 2 + (i & 1), 1); } };
  for (const l of CITY.lamps) if (l[0] > 180 && l[0] < 240 && G.onScreen(l[0], l[1], 40)) streak(320 - l[0], l[1], 255, 224, 150, 0.55, 9);
  const { C, gx0, gx1, gy0, gy1 } = cells;
  for (let gy = gy0; gy <= gy1; gy++) { const h = hash2(gy * 5 + 3, 11); if (h < 0.16) streak(46 + h * 120, gy * C, h < 0.08 ? 255 : 190, h < 0.08 ? 214 : 224, h < 0.08 ? 150 : 255, 0.3, 6); }
  for (const b of SIM.boats) if (b.kind === 'tour' || b.kind === 'waterbus') { streak(b.x - 4, b.y, 255, 214, 130, 0.5, 8); streak(b.x + 4, b.y + b.len / 4, 255, 214, 130, 0.4, 7); }
  if (G.era >= 2) for (let x = 48; x < 140; x += 14) streak(x, RIV.bridgeY + 20, G.era === 3 ? 140 : 255, G.era === 3 ? 215 : 214, G.era === 3 ? 255 : 140, 0.35, 5);
}
