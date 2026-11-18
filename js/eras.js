'use strict';
// ===== Sài Gòn Lofi — era definitions (199x → 202x) and the modern skyline =====
// To add content to an era: edit its row here (traffic mix, people mix) and ESTYLE / SHOPS in build.js (building look, shop skins).
const ERA = [
  { key: '199x', sub: 'Sài Gòn thập niên 90', msg: '199x: xích lô, xe Cub, Dream, xe lam, hàng rong và nón lá',
    veh: [['cub', 26], ['moto', 20], ['bike', 20], ['cyclo', 11], ['lam', 6], ['taxi', 2], ['car', 2.5], ['truck', 3], ['bus', 1.5]],
    ped: [['aodai', 1.4], ['office', 1], ['baba', 1.6], ['dobo', 1.2], ['youth', 1.1], ['worker', 1.3], ['oldman', 0.8], ['oldlady', 0.8], ['kid', 1], ['dress', 0.6], ['monk', 0.12]],
    hawker: 0.09, helmet: 0, phone: 0, mask: 0, nonla: 1, xeom: 'cub', taxi: ['taxi'] },
  { key: '200x', sub: 'đầu những năm 2000', msg: '200x: Wave, Dream, taxi Mai Linh – Vinasun, tiệm Internet và điện thoại',
    veh: [['wave', 32], ['moto', 14], ['cub', 4], ['scooter', 9], ['bike', 7], ['cyclo', 2], ['vinasun', 7], ['mailinh', 8], ['car', 4], ['truck', 3], ['bus', 2.5], ['lam', 0.5]],
    ped: [['aodai', 1], ['office', 1.6], ['baba', 0.9], ['dobo', 1.1], ['youth', 1.9], ['worker', 1], ['oldman', 0.7], ['oldlady', 0.7], ['kid', 1.2], ['dress', 1.1], ['monk', 0.1]],
    hawker: 0.05, helmet: 0.12, phone: 0.06, mask: 0, nonla: 0.6, xeom: 'wave', taxi: ['vinasun', 'mailinh'] },
  { key: '201x', sub: 'thành phố vươn cao', msg: '201x: Bitexco, Vincom, SH, Air Blade, taxi xanh – trắng và shipper',
    veh: [['airblade', 20], ['sh', 14], ['vision', 10], ['scooter', 6], ['wave', 6], ['vinasun', 8], ['mailinh', 9], ['suv', 8], ['car', 4], ['grab', 3], ['ship', 3], ['bus', 3], ['truck', 2]],
    ped: [['modern', 2.4], ['fashion', 1.6], ['office', 1.8], ['youth', 1.4], ['aodai', 0.5], ['dobo', 0.8], ['baba', 0.4], ['worker', 0.7], ['oldman', 0.6], ['oldlady', 0.6], ['kid', 1], ['dress', 1], ['monk', 0.08]],
    hawker: 0.025, helmet: 0.95, phone: 0.3, mask: 0.05, nonla: 0.3, xeom: 'airblade', taxi: ['vinasun', 'mailinh'] },
  { key: '202x', sub: 'Thành phố Hồ Chí Minh hôm nay', msg: '202x: Landmark 81, Metro số 1, taxi Xanh SM, xe máy điện VinFast, GrabBike',
    veh: [['sh', 12], ['vision', 12], ['airblade', 8], ['vfscooter', 14], ['grab', 12], ['ship', 8], ['xanhsm', 14], ['suv', 6], ['car', 3], ['mailinh', 3], ['vinasun', 3], ['ebus', 3], ['truck', 1.5]],
    ped: [['modern', 3], ['fashion', 2], ['office', 1.6], ['youth', 1.2], ['aodai', 0.4], ['dobo', 0.6], ['baba', 0.3], ['worker', 0.6], ['oldman', 0.6], ['oldlady', 0.6], ['kid', 1], ['dress', 0.9], ['monk', 0.08]],
    hawker: 0.012, helmet: 0.98, phone: 0.45, mask: 0.2, nonla: 0.2, xeom: 'grab', taxi: ['xanhsm'] }
];
const TWO_WHEEL = { moto: 1, cub: 1, wave: 1, scooter: 1, sh: 1, airblade: 1, vision: 1, vfscooter: 1, grab: 1, ship: 1 };
const TAXIS = { taxi: 1, vinasun: 1, mailinh: 1, xanhsm: 1 };

// ----- two-wheelers: each model has its own silhouette (frame type, shield, rear, nose) -----
// Honda Cub: step-through frame, round headlight, rack
VEH.cub = v => { const c = [0x2f4f8a, 0xc0392b, 0xe8e2d0, 0x3a6a4a, 0x8a8f98][v % 5], B = [box(0, 1.4, 0, 4.6, 2, 4.6, DKC), box(11.4, 1.4, 0, 4.6, 2, 4.6, DKC), box(4.6, 1.2, 2.4, 6, 2.4, 1.3, c), box(0.6, 1.2, 4.2, 5.6, 2.8, 3, c), box(1, 1.2, 7.2, 7, 2.8, 1.1, 0x2a2428), box(10.4, 1.4, 3, 1.1, 2.8, 7.4, c), box(10.2, 0.2, 10.4, 1, 4.4, 0.8, DKC), box(11.4, 1.5, 8.2, 1.5, 1.8, 1.9, 0xfff0b0, null, HEAD), box(-1.6, 1.4, 6.6, 2.4, 2.4, 0.8, MTL), box(1.6, 0.3, 1.2, 5, 0.9, 1, MTL), box(-0.2, 1.7, 5.6, 0.6, 1.4, 1, 0xd03a3a, null, TAIL), box(10.6, 1.2, 0.8, 4, 2.4, 1.4, c)]; return { L: 16, W: 4.8, boxes: B, seats: [{ x: 5, z: 8 }, { x: 2.2, z: 8.1 }] }; };
// Honda Wave: underbone with a plastic fairing (cub frame, fuller front cowl, tank cover)
VEH.wave = v => { const m = VEH.cub(v + 1), c = [0xc0392b, 0x2f5fb5, 0x2a2a30, 0xe0e4ea, 0x1f8a6a, 0xd9a02a, 0x8a2f6a, 0x4a6a9a][v % 8]; m.boxes[2].c = c; m.boxes[3].c = c; m.boxes.push(box(9.2, 0.8, 3, 1.8, 4, 8, c), box(4.4, 1, 4.4, 5, 2.8, 2.2, c), box(1.6, 1.4, 6.5, 5.6, 2, 0.6, 0xc8ccd0)); return m; };
// generic modern scooter builder
function scoot(o) {
  const L = o.L, W = o.W, r = o.r, c = o.c, tr = o.tr || 0x3a3a44, rear = o.rear, fh = o.fh, y0 = (W - 3.4) / 2, zs = r * 0.6 + 2.2 + rear, B = [];
  B.push(box(0.2, W / 2 - 1, 0, r, 2, r, DKC), box(L - r - 0.2, W / 2 - 1, 0, r, 2, r, DKC));
  B.push(box(r * 0.5, y0, r * 0.55, L - r * 2.1, 3.4, 2, c), box(0, y0 - 0.1, r * 0.6, r * 2.1, 3.6, 2.2 + rear, c), box(r * 0.9, y0 + 0.2, zs, r * 1.9, 3, 1.1, 0x2a2428));
  const sx = L - r * 1.9 - (o.nose === 1 ? 0.5 : 0);
  B.push(box(sx, y0 + 0.1, r * 0.55, 1.4, 3.2, fh, c), box(L - r - 0.6, W / 2 - 1.5, r, r + 0.8, 3, 0.9, c), box(sx - 0.2, 0.2, r * 0.55 + fh + 1.8, 1, W - 0.4, 0.8, DKC));
  if (o.nose === 1) B.push(box(sx + 0.2, y0 + 0.7, r * 0.55 + fh, 2.6, 2, 1.6, c), box(sx + 1.6, y0 + 1, r * 0.55 + fh - 0.2, 0.8, 1.4, 1.2, 0xfff0b0, null, HEAD), box(-0.6, y0 + 0.6, zs + 1.1, 2.6, 2.2, 1.2, tr), box(r, y0 + 1.1, zs + 1.1, r * 1.1, 1.2, 0.5, tr));   // pointed nose + tail spoiler (Air Blade)
  else if (o.nose === 3) B.push(box(sx + 0.2, y0 + 0.1, r * 0.55 + fh, 2.2, 3.2, 1.5, c), box(sx + 1.8, y0 - 0.2, r * 0.55 + fh + 0.1, 0.6, 3.8, 1, 0xf4fbff, null, { em: 0xe8f4ff }), box(sx - 0.2, y0 + 0.8, r * 0.55 + fh + 2.6, 1, 1.8, 1.2, 0x2a2a30));   // wide LED bar (VinFast)
  else B.push(box(sx + 0.2, y0 + 0.1, r * 0.55 + fh, 2.2, 3.2, o.nose === 2 ? 1.2 : 1.8, c), box(sx + 1.8, y0 + 0.9, r * 0.55 + fh + 0.1, 0.8, 1.6, 1.4, 0xfff0b0, null, HEAD));
  B.push(box(-0.2, W / 2 - 1, zs - 0.4, 0.7, 2, 1.1, 0xd03a3a, null, TAIL));
  if (o.boxC !== undefined) B.push(box(-0.6, y0 - 0.9, zs + 1.1, r * 1.9 + 0.8, 5.2, o.bh || 4.4, o.boxC, (f, u, v) => f !== 0 && v > (o.bh || 4.4) - 1.2 ? shade(o.boxC, -0.2) : f === 1 && o.logo && u > 1 && u < 4 && v > 1 && v < 3 ? 0xf7f4ec : undefined));
  return { L, W, boxes: B, seats: [{ x: r * 0.9 + 3.6, z: zs + 0.3 }, { x: r * 0.9 + 1, z: zs + 0.4 }] };
}
VEH.scooter = v => scoot({ L: 16.5, W: 5, r: 4.2, rear: 2.8, fh: 5.4, nose: 0, c: [0x8a8f98, 0x7a2a3a, 0x2f4f8a, 0x5a5a62, 0xc9b88a][v % 5] });                                   // early 2000s (Spacy / Nouvo era)
VEH.sh = v => scoot({ L: 18.5, W: 5.8, r: 5, rear: 3.2, fh: 7, nose: 0, c: [0xf2f2f0, 0x2a2a30, 0x8a8f98, 0xb8383a, 0x1f3f6a][v % 5], tr: 0x2a2a30 });                        // big wheels, tall body
VEH.airblade = v => scoot({ L: 16, W: 5, r: 4.4, rear: 1.6, fh: 5.2, nose: 1, c: [0xc0392b, 0x2a2a30, 0x1f4f8a, 0xf2f2f0, 0x8a2f6a][v % 5], tr: 0xc8ccd0 });                    // sporty pointed nose, spoiler
VEH.vision = v => scoot({ L: 14, W: 4.4, r: 3.8, rear: 2.2, fh: 4.4, nose: 2, c: [0xf2b8c8, 0xf2f2f0, 0x9fd8e8, 0x2a2a30, 0xd8d2b0, 0xe8c8a0][v % 6] });                       // small and slim
VEH.vfscooter = v => scoot({ L: 16, W: 5, r: 4.4, rear: 2.6, fh: 6, nose: 3, c: [0x1fb5ad, 0xf2f2f0, 0x2a2a30, 0xe0503a, 0x9fd8e8, 0xf2c94c][v % 6] });                        // smooth body, LED headlight bar
VEH.grab = v => scoot({ L: 16, W: 5, r: 4.4, rear: 2.2, fh: 5.4, nose: v % 2 ? 1 : 2, c: [0x2a2a30, 0xc0392b, 0x8a8f98, 0x1f4f8a][v % 4], boxC: 0x1faa59, bh: 5, logo: 1 });
VEH.ship = v => scoot({ L: 16, W: 5, r: 4.4, rear: 2.2, fh: 5.4, nose: 2, c: [0x2a2a30, 0x8a8f98, 0xf2f2f0][v % 3], boxC: [0xf08a2b, 0xd9281e, 0x2f6ab8, 0xf2c94c][v % 4], bh: 6.6, logo: 1 });

// ----- cars -----
function sedan(o) {
  const L = o.L || 28, W = o.W || 12, c = o.c, bh = o.bh || 3.8, ch = o.ch || 4.2, cl = o.cl || 0.46, cx = o.cx || 0.24, z0 = o.z0 || 1.6;
  const B = wheels4(L, W, o.wr || 3.6).concat([
    box(0, 0, z0, L, W, bh, c, (f, u, v) => f === 0 ? c : o.s1 !== undefined && v < 1.1 ? o.s1 : o.s2 !== undefined && v < 2.2 ? o.s2 : undefined),
    box(L * cx, 1, z0 + bh, L * cl, W - 2, ch, c, glassP(c)),
    box(L * 0.74, 0.3, z0 + bh, L * 0.26 - 0.3, W - 0.6, o.hood || 0.8, c), box(0.3, 0.3, z0 + bh, L * 0.2, W - 0.6, o.trunk || 1, c)], lights(L, W, z0 + 2.2));
  if (o.lamp) B.push(box(L * (cx + cl / 2) - 2, W / 2 - 1.6, z0 + bh + ch, 4, 3.2, 1.8, o.lamp, null, { em: o.lampE }));
  if (o.rack) B.push(box(L * cx + 1, 1.4, z0 + bh + ch, L * cl - 2, 0.6, 0.8, MTL), box(L * cx + 1, W - 2, z0 + bh + ch, L * cl - 2, 0.6, 0.8, MTL));
  return { L, W, boxes: B, seats: [] };
}
VEH.taxi = v => sedan({ c: [0xf2c23a, 0xefe6b8][v % 2], s1: 0x2a2a30, bh: 4.2, ch: 4.8, cl: 0.52, cx: 0.2, hood: 0.4, trunk: 0.4, lamp: 0xfff4c0, lampE: 0xffe680 });          // boxy older sedan
VEH.vinasun = v => sedan({ c: 0xf4f4f0, s1: 0x2f8a3a, s2: 0xd9281e, cl: 0.45, cx: 0.26, lamp: 0xf4f4f0, lampE: 0xdde8d0 });                                                     // white with green + red band
VEH.mailinh = v => sedan({ c: 0x2fa86a, s1: 0xf4f4f0, cl: 0.45, cx: 0.26, lamp: 0xf4f8f4, lampE: 0xbfe8c8 });                                                                    // green
VEH.xanhsm = v => sedan({ c: 0x1fb5ad, s1: 0xf4f4f0, bh: 4.8, ch: 4.8, cl: 0.62, cx: 0.18, z0: 2, wr: 4, hood: 0.4, lamp: 0xe8fff8, lampE: 0xa0ffe0, rack: 1 });             // taller crossover (electric)
VEH.etaxi = VEH.xanhsm;
VEH.suv = v => { const c = [0xf2f2f0, 0x2a2a30, 0x8a8f98, 0xb8383a, 0x1f3f6a, 0xd8d2c4][v % 6], L = 30, W = 12.5, B = wheels4(L, W, 4.2).concat([box(0, 0, 2, L, W, 6, c), box(4, 0.8, 8, 19, W - 1.6, 4.8, c, glassP(c)), box(29.4, 1, 5, 0.6, 2.6, 1.4, 0xf4fbff, null, { em: 0xe8f4ff }), box(29.4, W - 3.6, 5, 0.6, 2.6, 1.4, 0xf4fbff, null, { em: 0xe8f4ff }), box(-0.2, 1, 5.4, 0.6, W - 2, 1, 0xd03a3a, null, TAIL), box(5, 1.6, 12.8, 17, 0.6, 0.8, MTL), box(5, W - 2.2, 12.8, 17, 0.6, 0.8, MTL)]); return { L, W, boxes: B, seats: [] }; };
VEH.ebus = v => { const c = [0xf4f4f0, 0xf4f4f0][v % 2], L = 44, W = 13; return { L, W, boxes: wheels4(L, W, 4).concat([box(0, 0, 1.8, L, W, 12.4, c, (f, u, v2, b) => { if (f === 0) return 0xe8ecee; const Wd = f === 1 ? b.w : b.d; if (v2 > 5 && v2 < 10.4 && u > 1 && u < Wd - 1) return (u % 7 < 0.8) ? 0xdfe4e6 : GLS; if (v2 < 3.6) return 0x2fa86a; if (v2 < 4.6) return 0x1f8a5a; }), box(10, 2, 14.2, 22, 9, 1.6, 0xd8dcde), box(43.4, 1, 4, 0.6, 11, 1, 0xf4fbff, null, { em: 0xe8f4ff })]), seats: [] }; };

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
  const tiers = [4, 5, 6, 7, 8, 9, 10, 11]; B.led = [{ face: 1, boxes: tiers, z0: 76, z1: 220, fit: 1 }, { face: 2, boxes: tiers, z0: 76, z1: 220, fit: 1 }];   // holiday LED facade (js/events.js)
  return B;
}
// Landmark 81 (2018): a bundle of square tubes stepping up to the spire
function landmark81() {
  const B = [], G1 = 0x5a86a8, hs = [[150, 214, 168], [236, 330, 252], [182, 276, 200]];
  B.push(box(0, 0, 0, 64, 64, 24, 0xdcd8d0, (f, u, v, b) => { if (f === 0) return 0xb8b4ac; if (v > 21) return 0xf2f0ea; if (f === 1 && v > 15 && textAt('LANDMARK 81', u - 10, v - 15.6)) { EM = 0xffffff; return 0x3a3020; } EM = 0x50482a; return (u % 8 < 0.8) ? 0x4a5560 : v < 13 ? 0xa8cad8 : 0xdcd8d0; }));
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) B.push(box(8 + i * 16, 8 + j * 16, 24, 16, 16, hs[j][i] - 24, G1, curtain(G1, i * 7 + j * 3, 13)));
  B.push(box(29, 29, 330, 6, 6, 14, 0xc8ced4), box(31.2, 31.2, 344, 1.6, 1.6, 30, 0xe8ecef, null, { em: 0x603030 }));
  B.led = [{ face: 1, boxes: [7, 8, 9], z0: 110, z1: 178 }, { face: 2, boxes: [3, 6, 9], z0: 100, z1: 164 }];
  return B;
}
// Vinhomes-style apartment tower
function aptTower(R, w, d, floors) {
  const wall = sp(R, [0xf4efe4, 0xf0ece6, 0xe9eef0]), acc = sp(R, [0xc98a5a, 0x7a9ab0, 0x9a8a78]), seed = R() * 99, H = floors * 11, B = [];
  B.push(box(0, 0, 0, w, d, 16, 0xd8d2c8, (f, u, v) => { if (f === 0) return 0xb0aaa0; EM = 0x50482a; return v > 13 ? 0xf2f0ea : u % 8 < 0.8 ? 0x4a5560 : 0xa8cad8; }));
  B.push(box(3, 3, 16, w - 6, d - 6, H, wall, (f, u, v, b) => { if (f === 0) return 0xb8b4ac; const fl = Math.floor(v / 11), vv = v - fl * 11, W = f === 1 ? b.w : b.d, q = u % 10; if (u < 1.6 || u > W - 1.6) return acc; if (vv < 1.2) return shade(wall, -0.12); if (q < 1) return wall; if (vv < 4.4 && q > 5) return 0xb4d0dc; const l = hash2((u / 10 | 0) + seed + f * 9, fl); if (vv > 4.4 && vv < 9.6) { if (l < 0.38) EM = l < 0.05 ? 0x9fd0ff : 0xffe2a0; return q > 5 ? 0x6f9cb6 : 0x86b0c6; } return wall; }));
  B.push(box(6, 6, 16 + H, w - 12, d - 12, 8, acc), box(w / 2 - 4, d / 2 - 4, 24 + H, 8, 8, 5, 0xc9d4dc));
  B.led = [{ face: 1, boxes: [1], z0: 16 + H * 0.42, z1: 16 + H * 0.88 }, { face: 2, boxes: [1], z0: 16 + H * 0.42, z1: 16 + H * 0.88 }];
  return B;
}
// Vincom Center (2010): glass mall podium with twin towers
function vincom() {
  const B = [], G1 = 0x5f9cc0;
  B.push(box(0, 0, 0, 80, 80, 44, 0xe4e8ec, (f, u, v, b) => { if (f === 0) return 0xb8bec4; const W = f === 1 ? b.w : b.d; if (v > 40) return 0xf4f6f8; if (f === 1 && v > 30 && v < 37 && textAt('VINCOM', u - (W / 2 - 11), v - 31)) { EM = 0xff5a4a; return 0xd9281e; } if (v % 11 < 1.2 || u % 10 < 0.9) return 0xc4cad0; EM = 0x605830; return v < 11 && hash2(u / 10 | 0, f) < 0.6 ? GOODS[(u / 10 | 0) % GOODS.length] : 0x9cc6da; }));
  for (const x of [6, 46]) { B.push(box(x, 10, 44, 28, 52, 150, G1, curtain(G1, x, 0))); B.push(box(x + 4, 16, 194, 20, 40, 8, 0xdfe6ea)); }
  B.led = [{ face: 1, boxes: [1, 3], z0: 92, z1: 176 }, { face: 2, boxes: [3], z0: 92, z1: 176 }];
  return B;
}
PROP.metro = () => [box(-8, -5, 0, 1, 1, 12, 0x8a9098), box(7, -5, 0, 1, 1, 12, 0x8a9098), box(-8, 4, 0, 1, 1, 12, 0x8a9098), box(7, 4, 0, 1, 1, 12, 0x8a9098), box(-7, -4, 0, 14, 8, 1.2, 0x3a3a44, (f, u, v) => f === 0 ? ((u | 0) % 2 ? 0x55555f : 0x2f2f38) : undefined), box(-9, -6, 12, 18, 12, 1.6, 0xb8dcea, (f, u, v) => f === 0 ? ((u | 0) % 6 === 0 || (v | 0) % 6 === 0 ? 0xe8f0f4 : 0x9ccbe0) : 0xe8f0f4), box(-9, 5, 13.6, 18, 1, 5, 0x1f5fa8, (f, u, v) => { if (f !== 1) return undefined; EM = 0x103060; if (textAt('METRO', u - 0.5, v - 0.2)) { EM = 0xffffff; return 0xf7f4ec; } }, { nf: 1 })];
PROP.atm = () => [box(-3, -3, 0, 6, 6, 16, 0xe8ecef, (f, u, v) => { if (f !== 1) return undefined; if (v > 12) { EM = 0x2040a0; return textAt('ATM', u + 2.5 - 3, v - 12.6) ? 0xf7f4ec : 0x1f4f8a; } if (v > 6 && v < 11 && u > 1 && u < 5) { EM = 0x9fd0ff; return 0x8fc8f0; } if (v > 3 && v < 5 && u > 1.5 && u < 4.5) return 0x3a3a44; }), box(-3.4, -3.4, 16, 6.8, 6.8, 1, 0x1f4f8a)];
PROP.ebike = (s, v) => rotBoxes(vehModel('vfscooter', v), 1);
PROP.pscooter = (s, v) => rotBoxes(vehModel('scooter', v), 1);

// ----- Tết decorations (placed once, shown only while G.tet) -----
PROP.maiTet = (sn, v) => [box(-2.6, -2.6, 0, 5.2, 5.2, 4, 0xc4583a, (f, u, vv) => f !== 0 && (vv | 0) === 2 ? 0xf2c94c : undefined), box(-0.6, -0.6, 4, 1.2, 1.2, 5, 0x6b4a3a), box(-5.2, -5.2, 8, 10.4, 10.4, 10, 0xf2c94c, (f, u, vv, b, wx, wy) => { const h = hash2(u * 5 + f * 3 + (wx | 0), vv * 5 + (wy | 0)); return h < 0.3 ? 0xffe680 : h > 0.84 ? 0x6ab04a : h > 0.72 ? 0xe0a820 : undefined; }, { ns: 1 })];
PROP.lanterns = () => { const B = [box(-10, -0.3, 24, 20, 0.6, 0.7, 0x8a6a3a)]; for (let i = 0; i < 5; i++) { const x = -8.4 + i * 4.2; B.push(box(x + 1, -0.2, 22.6, 0.4, 0.4, 1.4, 0x8a6a3a), box(x, -1.4, 18.4, 2.4, 2.8, 4.2, 0xd9281e, (f, u, v) => v < 0.9 || v > 3.3 ? 0xf2c94c : undefined, { em: 0xff7a3a, nf: 1 }), box(x + 0.9, -0.2, 16.4, 0.6, 0.6, 2, 0xf2c94c)); } return B; };
