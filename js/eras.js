'use strict';
// ===== Sài Gòn Lofi — era definitions (199x → 202x) and the modern skyline =====
// To add content to an era: edit its row here (traffic mix, people mix) and ESTYLE / SHOPS in build.js (building look, shop skins).
const ERA = [
  { key: '199x', sub: 'Sài Gòn thập niên 90', msg: '199x: xích lô, xe Cub, xe lam, hàng rong và nón lá',
    veh: [['moto', 40], ['bike', 22], ['cyclo', 12], ['lam', 6], ['car', 3], ['taxi', 1.5], ['truck', 3], ['bus', 1.5]],
    ped: [['aodai', 1.4], ['office', 1], ['baba', 1.6], ['dobo', 1.2], ['youth', 1.1], ['worker', 1.3], ['oldman', 0.8], ['oldlady', 0.8], ['kid', 1], ['dress', 0.6], ['monk', 0.12]],
    hawker: 0.09, helmet: 0, phone: 0, mask: 0, nonla: 1, xeom: 'moto', taxi: 'taxi' },
  { key: '200x', sub: 'đầu những năm 2000', msg: '200x: Wave, Dream đầy đường, tiệm Internet và điện thoại mọc lên',
    veh: [['wave', 44], ['moto', 16], ['bike', 8], ['cyclo', 4], ['taxi', 8], ['car', 6], ['truck', 3], ['bus', 2.5], ['lam', 0.6], ['scooter', 4]],
    ped: [['aodai', 1], ['office', 1.6], ['baba', 0.9], ['dobo', 1.1], ['youth', 1.9], ['worker', 1], ['oldman', 0.7], ['oldlady', 0.7], ['kid', 1.2], ['dress', 1.1], ['monk', 0.1]],
    hawker: 0.05, helmet: 0.12, phone: 0.06, mask: 0, nonla: 0.6, xeom: 'wave', taxi: 'taxi' },
  { key: '201x', sub: 'thành phố vươn cao', msg: '201x: Bitexco, Vincom, Air Blade, SH và những anh shipper',
    veh: [['scooter', 46], ['wave', 14], ['taxi', 10], ['suv', 9], ['car', 5], ['grab', 6], ['bus', 3], ['truck', 2], ['bike', 2], ['cyclo', 0.7]],
    ped: [['modern', 2.4], ['fashion', 1.6], ['office', 1.8], ['youth', 1.4], ['aodai', 0.5], ['dobo', 0.8], ['baba', 0.4], ['worker', 0.7], ['oldman', 0.6], ['oldlady', 0.6], ['kid', 1], ['dress', 1], ['monk', 0.08]],
    hawker: 0.025, helmet: 0.95, phone: 0.3, mask: 0.05, nonla: 0.3, xeom: 'grab', taxi: 'taxi' },
  { key: '202x', sub: 'Thành phố Hồ Chí Minh hôm nay', msg: '202x: Landmark 81, Metro số 1, taxi điện và xe máy điện',
    veh: [['scooter', 28], ['escoot', 20], ['etaxi', 12], ['suv', 10], ['grab', 11], ['ebus', 3], ['car', 4], ['truck', 2], ['bike', 2.5], ['cyclo', 0.4]],
    ped: [['modern', 3], ['fashion', 2], ['office', 1.6], ['youth', 1.2], ['aodai', 0.4], ['dobo', 0.6], ['baba', 0.3], ['worker', 0.6], ['oldman', 0.6], ['oldlady', 0.6], ['kid', 1], ['dress', 0.9], ['monk', 0.08]],
    hawker: 0.012, helmet: 0.98, phone: 0.45, mask: 0.2, nonla: 0.2, xeom: 'grab', taxi: 'etaxi' }
];
const TWO_WHEEL = { moto: 1, wave: 1, scooter: 1, escoot: 1, grab: 1 };

// ----- modern vehicles -----
function mScooter(c, trim, boxC) {
  const B = [box(0.4, 1.5, 0, 4.2, 2, 4.2, DKC), box(11.8, 1.5, 0, 4.2, 2, 4.2, DKC), box(1.6, 0.8, 2.8, 8.4, 3.4, 4, c), box(0.2, 1.1, 5, 3.2, 2.8, 2.2, c), box(3.6, 0.6, 6.8, 6, 3.8, 1.3, 0x2a2428), box(9.6, 1, 2.2, 2.2, 3, 1.2, trim), box(11, 0.5, 3, 1.8, 4, 6.6, c), box(11.2, 0, 9.4, 1.2, 5, 0.9, DKC), box(12.8, 1.4, 6.8, 1, 2.2, 2.2, 0xf4fbff, null, { em: 0xe8f4ff }), box(0, 1.6, 6, 0.7, 1.8, 1.2, 0xd03a3a, null, TAIL)];
  if (boxC !== undefined) B.push(box(0, 0.4, 7.2, 4.2, 4.2, 4.6, boxC, (f, u, v) => f !== 0 && v > 3.6 ? shade(boxC, -0.2) : undefined));
  return { L: 16, W: 5, boxes: B, seats: [{ x: 7.6, z: 7.4 }, { x: 4.8, z: 7.6 }] };
}
VEH.wave = v => { const m = VEH.moto(0), c = [0xc0392b, 0x2f5fb5, 0x2a2a30, 0xe0e4ea, 0x1f8a6a, 0xd9a02a, 0x8a2f6a, 0x4a6a9a][v % 8]; m.boxes[2].c = c; m.boxes[3].c = c; m.boxes.push(box(9.8, 0.5, 3.4, 1.4, 3.8, 3.4, 0xe8eaee)); return m; };
VEH.scooter = v => mScooter([0xc0392b, 0x2a2a30, 0xf2f2f0, 0x8a8f98, 0x1f4f8a, 0xf2f2f0, 0x5a3a2a, 0x2a2a30][v % 8], 0x3a3a44);
VEH.escoot = v => mScooter([0x1fb5ad, 0xf2f2f0, 0xe0503a, 0x2a2a30, 0x9fd8e8, 0xf2c94c, 0x1fb5ad, 0xf2f2f0][v % 8], 0xc8ccd0);
VEH.grab = v => mScooter([0x2a2a30, 0xc0392b, 0x8a8f98, 0x1f4f8a][v % 4], 0x3a3a44, [0x1faa59, 0xf08a2b, 0x1faa59, 0xe8437a][v % 4]);
VEH.etaxi = v => { const c = [0x1fb5ad, 0x1fb5ad, 0xf2f2f0][v % 3], L = 28, W = 12, B = wheels4(L, W, 3.6).concat([box(0, 0, 1.6, L, W, 5.4, c, (f, u, v2) => f !== 0 && v2 > 1.4 && v2 < 2.4 ? 0xf2f2f0 : undefined), box(6, 1, 7, 15, 10, 4.2, c, glassP(c)), box(27.4, 1, 4.6, 0.6, 10, 0.9, 0xf4fbff, null, { em: 0xe8f4ff }), box(-0.2, 1, 4.6, 0.6, 10, 0.9, 0xd03a3a, null, TAIL), box(13, 4.5, 11.2, 2, 3, 1.4, 0xf4fff8, null, { em: 0xa0ffd0 })]); return { L, W, boxes: B, seats: [] }; };
VEH.suv = v => { const c = [0xf2f2f0, 0x2a2a30, 0x8a8f98, 0xb8383a, 0x1f3f6a, 0xd8d2c4][v % 6], L = 30, W = 12.5, B = wheels4(L, W, 4.2).concat([box(0, 0, 2, L, W, 6, c), box(4, 0.8, 8, 19, W - 1.6, 4.8, c, glassP(c)), box(29.4, 1, 5, 0.6, 2.6, 1.4, 0xf4fbff, null, { em: 0xe8f4ff }), box(29.4, W - 3.6, 5, 0.6, 2.6, 1.4, 0xf4fbff, null, { em: 0xe8f4ff }), box(-0.2, 1, 5.4, 0.6, W - 2, 1, 0xd03a3a, null, TAIL)]); return { L, W, boxes: B, seats: [] }; };
VEH.ebus = v => { const c = [0x2fa86a, 0x2f9ab8][v % 2], L = 44, W = 13; return { L, W, boxes: wheels4(L, W, 4).concat([box(0, 0, 1.8, L, W, 12.4, c, (f, u, v2, b) => { if (f === 0) return 0xe8ecee; const Wd = f === 1 ? b.w : b.d; if (v2 > 5 && v2 < 10.4 && u > 1 && u < Wd - 1) return (u % 7 < 0.8) ? 0x2a2a30 : GLS; if (v2 > 10.8) return 0xf2f2f0; }), box(10, 2, 14.2, 22, 9, 1.6, 0xd8dcde), box(43.4, 1, 4, 0.6, 11, 1, 0xf4fbff, null, { em: 0xe8f4ff })]), seats: [] }; };

// ----- towers -----
const curtain = (base, seed, band) => (f, u, v, b) => {
  if (f === 0) return 0x9aa0a8; const fl = Math.floor(v / 6), vv = v - fl * 6;
  if (band && fl % band === band - 1 && vv > 3) return 0xe8ecef;
  if (vv < 0.9) return shade(base, -0.28); if (u % 5 < 0.7) return shade(base, -0.12);
  const l = hash2((u / 5 | 0) + seed + f * 31, fl); if (l < 0.2) EM = l < 0.03 ? 0x9fd0ff : 0xffe2a0;
  let c = mixc(base, 0xdff2fb, clamp(v / b.h, 0, 1) * 0.5 + (f === 1 ? 0.08 : 0)); if (vnoise(u / 14 + seed, v / 30) > 0.62) c = mixc(c, 0xffffff, 0.14); return c;
};
// Bitexco Financial Tower (2010): tapering lotus bud with the helipad disc
function bitexco() {
  const B = [], G1 = 0x4f8fb8, cx = 32, cy = 32;
  B.push(box(4, 4, 0, 56, 56, 22, 0xd8dde2, (f, u, v, b) => { if (f === 0) return 0xb8bec4; const W = f === 1 ? b.w : b.d; if (v > 19) return 0xf2f4f6; if (v > 14 && f === 1 && textAt('BITEXCO', u - (W / 2 - 13), v - 14.4)) { EM = 0xffffff; return 0x2a4a6a; } EM = 0x50482a; return (u % 7 < 0.8) ? 0x4a5560 : v < 12 ? 0x9fc4d6 : 0xd8dde2; }));
  const N = 13; for (let k = 0; k < N; k++) { const t = k / (N - 1), wd = 30 + Math.sin(t * Math.PI * 0.9 + 0.35) * 16 - t * 12, dp = wd * 0.82; B.push(box(cx - wd / 2, cy - dp / 2 + t * 5, 22 + k * 18, wd, dp, 18, G1, curtain(G1, 5 + k, 0))); }
  B.push(box(cx - 4, cy + 4, 22 + 9 * 18, 26, 26, 2.4, 0xe8ecef, (f, u, v) => f === 0 ? (Math.hypot(u - 13, v - 13) < 8 && Math.hypot(u - 13, v - 13) > 6.4 ? 0xf2c94c : 0x7a858f) : 0xc8ced4, { nf: 1 }));
  B.push(box(cx - 1, cy + 3, 22 + N * 18, 2, 2, 22, 0xc8ced4));
  return B;
}
// Landmark 81 (2018): a bundle of square tubes stepping up to the spire
function landmark81() {
  const B = [], G1 = 0x5a86a8, hs = [[150, 214, 168], [236, 330, 252], [182, 276, 200]];
  B.push(box(0, 0, 0, 64, 64, 24, 0xdcd8d0, (f, u, v, b) => { if (f === 0) return 0xb8b4ac; if (v > 21) return 0xf2f0ea; if (f === 1 && v > 15 && textAt('LANDMARK 81', u - 10, v - 15.6)) { EM = 0xffffff; return 0x3a3020; } EM = 0x50482a; return (u % 8 < 0.8) ? 0x4a5560 : v < 13 ? 0xa8cad8 : 0xdcd8d0; }));
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) B.push(box(8 + i * 16, 8 + j * 16, 24, 16, 16, hs[j][i] - 24, G1, curtain(G1, i * 7 + j * 3, 13)));
  B.push(box(29, 29, 330, 6, 6, 14, 0xc8ced4), box(31.2, 31.2, 344, 1.6, 1.6, 30, 0xe8ecef, null, { em: 0x603030 }));
  return B;
}
// Vinhomes-style apartment tower
function aptTower(R, w, d, floors) {
  const wall = sp(R, [0xf4efe4, 0xf0ece6, 0xe9eef0]), acc = sp(R, [0xc98a5a, 0x7a9ab0, 0x9a8a78]), seed = R() * 99, H = floors * 11, B = [];
  B.push(box(0, 0, 0, w, d, 16, 0xd8d2c8, (f, u, v) => { if (f === 0) return 0xb0aaa0; EM = 0x50482a; return v > 13 ? 0xf2f0ea : u % 8 < 0.8 ? 0x4a5560 : 0xa8cad8; }));
  B.push(box(3, 3, 16, w - 6, d - 6, H, wall, (f, u, v, b) => { if (f === 0) return 0xb8b4ac; const fl = Math.floor(v / 11), vv = v - fl * 11, W = f === 1 ? b.w : b.d, q = u % 10; if (u < 1.6 || u > W - 1.6) return acc; if (vv < 1.2) return shade(wall, -0.12); if (q < 1) return wall; if (vv < 4.4 && q > 5) return 0xb4d0dc; const l = hash2((u / 10 | 0) + seed + f * 9, fl); if (vv > 4.4 && vv < 9.6) { if (l < 0.38) EM = l < 0.05 ? 0x9fd0ff : 0xffe2a0; return q > 5 ? 0x6f9cb6 : 0x86b0c6; } return wall; }));
  B.push(box(6, 6, 16 + H, w - 12, d - 12, 8, acc), box(w / 2 - 4, d / 2 - 4, 24 + H, 8, 8, 5, 0xc9d4dc));
  return B;
}
// Vincom Center (2010): glass mall podium with twin towers
function vincom() {
  const B = [], G1 = 0x5f9cc0;
  B.push(box(0, 0, 0, 80, 80, 44, 0xe4e8ec, (f, u, v, b) => { if (f === 0) return 0xb8bec4; const W = f === 1 ? b.w : b.d; if (v > 40) return 0xf4f6f8; if (f === 1 && v > 30 && v < 37 && textAt('VINCOM', u - (W / 2 - 11), v - 31)) { EM = 0xff5a4a; return 0xd9281e; } if (v % 11 < 1.2 || u % 10 < 0.9) return 0xc4cad0; EM = 0x605830; return v < 11 && hash2(u / 10 | 0, f) < 0.6 ? GOODS[(u / 10 | 0) % GOODS.length] : 0x9cc6da; }));
  for (const x of [6, 46]) { B.push(box(x, 10, 44, 28, 52, 150, G1, curtain(G1, x, 0))); B.push(box(x + 4, 16, 194, 20, 40, 8, 0xdfe6ea)); }
  return B;
}
PROP.metro = () => [box(-8, -5, 0, 1, 1, 12, 0x8a9098), box(7, -5, 0, 1, 1, 12, 0x8a9098), box(-8, 4, 0, 1, 1, 12, 0x8a9098), box(7, 4, 0, 1, 1, 12, 0x8a9098), box(-7, -4, 0, 14, 8, 1.2, 0x3a3a44, (f, u, v) => f === 0 ? ((u | 0) % 2 ? 0x55555f : 0x2f2f38) : undefined), box(-9, -6, 12, 18, 12, 1.6, 0xb8dcea, (f, u, v) => f === 0 ? ((u | 0) % 6 === 0 || (v | 0) % 6 === 0 ? 0xe8f0f4 : 0x9ccbe0) : 0xe8f0f4), box(-9, 5, 13.6, 18, 1, 5, 0x1f5fa8, (f, u, v) => { if (f !== 1) return undefined; EM = 0x103060; if (textAt('METRO', u - 0.5, v - 0.2)) { EM = 0xffffff; return 0xf7f4ec; } }, { nf: 1 })];
PROP.atm = () => [box(-3, -3, 0, 6, 6, 16, 0xe8ecef, (f, u, v) => { if (f !== 1) return undefined; if (v > 12) { EM = 0x2040a0; return textAt('ATM', u + 2.5 - 3, v - 12.6) ? 0xf7f4ec : 0x1f4f8a; } if (v > 6 && v < 11 && u > 1 && u < 5) { EM = 0x9fd0ff; return 0x8fc8f0; } if (v > 3 && v < 5 && u > 1.5 && u < 4.5) return 0x3a3a44; }), box(-3.4, -3.4, 16, 6.8, 6.8, 1, 0x1f4f8a)];
PROP.ebike = (s, v) => rotBoxes(vehModel('escoot', v), 1);
PROP.pscooter = (s, v) => rotBoxes(vehModel('scooter', v), 1);
