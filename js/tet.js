'use strict';
// ===== Sài Gòn Lofi — Tết: waving national flags, bunting, banners, lanterns, mai / kumquat, flower + watermelon stalls =====
// Everything here is placed once (planTet) and only shown while G.tet. Static things are ordinary CITY.recs flagged `tet`;
// animated things (flags, bunting) are drawn every frame from TET.fixed / TET.roof(era).
const TET = { fixed: [], strings: [], stalls: [], vendors: [], blocks: [], roofCache: {}, clock: 0, melonT: 12, on: false, saveWALK: null, count: {} };
const FRED = 0xd9281e, FRED_D = 0xa81c14, FRED_L = 0xee4630, FYEL = 0xffe23a, GOLD = 0xf2c94c;
const FSIZE = { s: { w: 14, h: 9, amp: 1.0 }, m: { w: 22, h: 14, amp: 1.5 }, L: { w: 40, h: 26, amp: 2.4 } };
const NF = 8;

// ---------------------------------------------------------------- flag texture: red field + yellow five-pointed star (supersampled so it survives at 14x9)
function starPoly(cx, cy, R) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.382 : R; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; }
function inPoly(p, x, y) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; }
const _ftex = {};
function flagTex(size) {   // at K resolution: red field + supersampled yellow star
  if (_ftex[size]) return _ftex[size];
  const w = FSIZE[size].w * K, h = FSIZE[size].h * K, poly = starPoly(w / 2, h / 2 + 0.3, h * 0.34), t = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let n = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (inPoly(poly, i + (a + 0.5) / 3, j + (b + 0.5) / 3)) n++; t[j * w + i] = n >= 5 ? 1 : 0; }
  return (_ftex[size] = t);
}
// cloth projected on the iso grid: ax 'x' flies toward +x (screen right-down), 'y' toward +y (screen left-down); 8 wave frames; ink rim
const _fspr = {};
function flagSprite(size, ax, fr) {
  const key = size + ax + fr; if (_fspr[key]) return _fspr[key];
  const w = FSIZE[size].w * K, h = FSIZE[size].h * K, amp = FSIZE[size].amp * K, tex = flagTex(size), pad = Math.ceil(amp) + 2, W = w + 4, H = h + Math.ceil(w / 2) + pad * 2 + 2;
  const g = new Int32Array(W * H).fill(-1), ph = fr / NF * Math.PI * 2, wave = i => Math.sin(ph - i * 0.55 / K) * amp * (i / (w - 1)), ox = ax === 'x' ? 1 : W - 2;
  const RED = grade(FRED), RED_D = mixc(RED, 0x6a3f45, 0.35), RED_L = mixc(RED, 0xfff1d6, 0.18), YEL = 0xffe04a, YEL_D = 0xe8b830;
  for (let i = 0; i < w; i++) {
    const wv = wave(i), slope = wave(i + K) - wv, dark = slope > 0.3 * K, lit = slope < -0.3 * K;
    for (let j = 0; j < h; j++) {
      const x = ax === 'x' ? ox + i : ox - i, y = pad + j + Math.round(i * 0.5 + wv); if (x < 0 || x >= W || y < 0 || y >= H) continue;
      g[y * W + x] = tex[j * w + i] ? (dark ? YEL_D : YEL) : dark ? RED_D : lit ? RED_L : RED;
    }
  }
  const s = gridCanvas(inkGrid(g, W, H, 0.8), W, H, null, K); s.ox = ox / K; s.oy = pad / K;
  return (_fspr[key] = s);
}
// bunting items: 9x6 hanging flag with a 5x4 star, and a lantern; baked per span with 4 sway frames
const BF = ['RRRRRRRRR', 'RRRRYRRRR', 'RRYYYYYRR', 'RRRYYYRRR', 'RRRYRYRRR', 'RRRRRRRRR'];
const _bsp = {};
function bunting(sp, fr) {
  const k = sp.id + '|' + fr; if (_bsp[k]) return _bsp[k];
  const dx = sp.dx, dy = sp.dy, sag = sp.sag, minX = Math.min(0, dx), pad = 8, W = Math.abs(dx) + pad * 2, H = Math.abs(dy) + sag + 22, ox = pad - minX, oy = 3 + (dy < 0 ? -dy : 0);
  const g = new Int32Array(W * H).fill(-1), em = new Int32Array(W * H), set = (x, y, c, e) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) { g[y * W + x] = c; if (e) em[y * W + x] = e; } };
  const at = t => [ox + dx * t, oy + (dy > 0 ? 0 : 0) + dy * t + sag * 4 * t * (1 - t)], n = Math.max(1, Math.abs(dx)), sgn = sp.ax === 'x' ? 1 : -1;
  for (let i = 0; i <= n; i++) { const p = at(i / n); set(p[0], p[1], 0x7a2a20); }
  const gap = 10, cnt = Math.max(1, Math.floor(Math.abs(dx) / gap));
  for (let q = 0; q < cnt; q++) {
    const t = (q + 0.5) / cnt, p = at(t), sw = Math.round(Math.sin(fr / 4 * Math.PI * 2 + q * 1.7) * 0.8), bx = Math.round(p[0]), by = Math.round(p[1]) + 1;
    if (q % 3 === 2) {   // lantern
      set(bx, by, 0x7a2a20); for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) { const e = y === 0 || y === 4; set(bx - 1 + x + sw, by + 1 + y, e ? GOLD : (x === 1 && y === 2 ? 0xf2603a : FRED), e ? 0 : 0xff7a3a); } set(bx + sw, by + 6, GOLD);
    } else {      // flag hangs from the string, skewed to the string's own axis
      for (let i = 0; i < 9; i++) { const lag = Math.round(i * 0.5), wv = Math.round(Math.sin(fr / 4 * Math.PI * 2 + i * 0.6 + q) * 0.7 * (i / 8)); for (let j = 0; j < 6; j++) { const ch = BF[j][i]; set(bx + sgn * i - (sgn < 0 ? 0 : 0), by + j + lag + wv + 0, ch === 'Y' ? FYEL : FRED); } }
    }
  }
  const s = gridCanvas(g, W, H, em); s.ox = ox; s.oy = oy;
  return (_bsp[k] = s);
}

// ---------------------------------------------------------------- props (boxes): stalls, mai, kumquat, banners, lanterns
const MELON = [0x4a9a4a, 0x3f8a46, 0x5aa850, 0x2f7a3e];
const melonP = (f, u, v) => f === 0 ? ((u * 1.1 | 0) % 2 ? 0x2f6a38 : 0x58a850) : ((u * 0.9 | 0) % 2 ? 0x2f6a38 : 0x4f9f4c);
const melon = (x, y, z, s) => box(x, y, z, s || 3.8, s || 3.8, (s || 3.8) * 0.82, MELON[(Math.abs(x * 3 + y * 5 + z) | 0) % 4], melonP);
function melonPile(cx, cy, z, cols, rows, sz) {   // pyramid along x, two deep
  const B = []; sz = sz || 3.8;
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols - r; i++) for (const dy of [0, sz * 0.92]) B.push(melon(cx - (cols - r) * sz / 2 + i * sz + r * 0.2, cy + dy, z + r * sz * 0.78, sz));
  return B;
}
const slice = (x, y, z) => box(x, y, z, 4.2, 3.8, 1.5, 0x58a050, (f, u, v) => f === 0 ? (u < 0.7 || u > 3.5 || v < 0.7 || v > 3.1 ? 0xf0f2d2 : hash2(u * 7, v * 5) < 0.14 ? 0x2a2428 : 0xe8404a) : v < 0.6 ? 0xf0f2d2 : undefined, { ns: 1 });
const basket = (x, y, z, w, d) => box(x, y, z, w, d, 2.6, 0xb8863f, (f, u, v) => (f !== 0 && ((u | 0) + (v | 0)) % 2) ? 0x9a6c2a : undefined);
const SIGNS = [[0xf4efe0, 0x2a2428, 0], [0xd9281e, 0xffe23a, 0], [0x1f7a4a, 0xf7f4ec, 0xdfffe0], [0x1a1a22, 0x7dff7a, 0x7dff7a]];
const TARP = [[0x6a86b0, 0xc9c2b0], [0xd9534f, 0xf4efe0], [0xf08a2b, 0xf4efe0], [0xf4f4f0, 0xd9281e]];
function stallBase(era, sign) {
  const [t1, t2] = TARP[era], sg = SIGNS[era], B = [];
  B.push(box(-8.5, -4.2, 0, 17, 8.6, 6.4, era === 0 ? 0x8a6a4a : era === 1 ? 0x4a7ab8 : era === 2 ? 0xb8bcc2 : 0xe8ecef, (f, u, v) => f !== 0 && (u | 0) % 4 === 0 && era < 2 ? 0x6b4f34 : undefined));
  for (const [x, y] of [[-11, -5.6], [10.4, -5.6], [-11, 0.6], [10.4, 0.6]]) B.push(box(x, y, 0, 0.8, 0.8, 21.5, era >= 2 ? MTL : 0x8a6a4a));
  B.push(box(-12.5, -6.4, 21.5, 25, 7.6, 1.1, t1, (f, u, v) => f === 0 ? ((u / 3 | 0) % 2 ? t1 : t2) : undefined, { nf: 1 }), box(-12.5, 0.8, 19, 25, 0.8, 2.6, t1, (f, u, v) => ((u / 3 | 0) % 2 ? t1 : t2), { nf: 1 }));
  B.push(box(-14, -0.6, 22.6, 28, 0.7, 6.2, sg[0], (f, u, v) => { if (f !== 1) return undefined; if (v < 0.7 || v > 5.4 || u < 0.7 || u > 27.3) return shade(sg[0], -0.25); if (sign === 'melon' && textAt('DUA HAU', u - 0.5, v - 0.6)) { EM = sg[2]; return sg[1]; } if (sign === 'hoa' && textAt('HOA TET', u - 0.5, v - 0.6)) { EM = sg[2]; return sg[1]; } }, { nf: 1, em: sg[2] || undefined }));
  return B;
}
PROP.melonStall = (sn, era) => {
  const B = stallBase(era, 'melon');
  B.push(...melonPile(-3, -3.4, 6.4, 5, 3, 3.6), ...melonPile(4.4, -3.4, 6.4, 3, 2, 3.6));
  for (const x of [-7.4, -2.4, 2.6]) B.push(melon(x, 1.2, 6.4, 3.8));
  B.push(slice(5.4, 1, 6.4), slice(-0.4, 2.4, 6.4), basket(-8, 1.6, 6.4, 4, 3.4), melon(-7.4, 2, 9, 2.6), basket(7, 2.2, 6.4, 3.6, 3.4));
  B.push(...melonPile(-16, -1, 0, 3, 3, 4.4), ...melonPile(11.6, -2, 0, 3, 2, 4.4), box(14.6, 3, 0, 4, 4, 1.8, 0xb8863f), melon(15, 3.4, 1.8, 3.6));
  if (era >= 2) B.push(box(-13, 3, 0, 5, 4, 5, 0xf4f4f0, (f, u, v) => f === 1 && (u | 0) % 2 === 0 && v > 3.6 ? 0xdfe6ec : undefined));          // styrofoam box
  if (era === 3) B.push(box(5.6, 4.6, 6.4, 3.4, 0.6, 3.4, 0xf7f7f7, (f, u, v) => f === 1 ? (hash2(u * 3, v * 3) < 0.5 ? 0x1a1a22 : 0xf7f7f7) : undefined));   // QR plate
  if (era <= 1) B.push(box(-2, 6.8, 0, 2.6, 2.6, 2.6, era === 0 ? 0xd9534f : 0x3d6fb5), box(2.4, 6.8, 0, 2.6, 2.6, 2.6, era === 0 ? 0x3d6fb5 : 0xf2c94c));   // plastic stools
  return B;
};
PROP.flowerStall = (sn, era) => {
  const B = stallBase(era, 'hoa');
  const pot = (x, y, z, kind) => {
    B.push(box(x - 2, y - 2, z, 4, 4, 2.6, 0xc4583a, (f, u, v) => f !== 0 && (v | 0) === 1 ? GOLD : undefined));
    if (kind === 0) B.push(box(x - 3.2, y - 3.2, z + 2.6, 6.4, 6.4, 6, GOLD, (f, u, v, b, wx, wy) => { const h = hash2(u * 5 + f * 3 + wx, v * 5 + wy); return h < 0.3 ? 0xffe680 : h > 0.8 ? 0x6ab04a : undefined; }, { ns: 1 }));
    else if (kind === 1) B.push(box(x - 2.8, y - 2.8, z + 2.6, 5.6, 5.6, 6.4, 0x3f8a3e, (f, u, v, b, wx, wy) => hash2(u * 7 + f + wx, v * 5 + wy) < 0.32 ? 0xf08a1a : undefined, { ns: 1 }));
    else B.push(box(x - 3, y - 3, z + 2.6, 6, 6, 3.4, [0xffd23a, 0xf4f4ee, 0xf08a2b, 0xd9528a][(x * 3 + y | 0) & 3], (f, u, v, b, wx, wy) => hash2(u * 9 + wx, v * 9 + wy) < 0.25 ? 0x4a9a4a : undefined, { ns: 1 }));
  };
  for (let i = 0; i < 4; i++) pot(-6.8 + i * 4.6, -0.6, 6.4, i % 3);
  for (let i = 0; i < 3; i++) pot(-4.6 + i * 4.8, 3, 6.4, (i + 1) % 3);
  pot(-14.2, 0, 0, 0); pot(14.4, 0, 0, 1); pot(-14.2, 4.6, 0, 2); pot(14.4, 4.6, 0, 0);
  return B;
};
PROP.maiBig = (sn, v) => {
  const c1 = v === 2 ? 0xf7a8c8 : 0xf7d94a, c2 = v === 2 ? 0xfcd0e2 : 0xffe680, c3 = v === 2 ? 0xe07aa8 : 0xe0a820;
  const cp = (f, u, vv, b, wx, wy) => { const h = hash2(u * 5 + f * 3 + (wx | 0), vv * 5 + (wy | 0)); return h < 0.3 ? c2 : h > 0.86 ? 0x6ab04a : h > 0.72 ? c3 : v === 1 && h > 0.66 ? FRED : undefined; };
  return [box(-4.4, -4.4, 0, 8.8, 8.8, 6.5, 0xc4583a, (f, u, vv) => f !== 0 && ((vv | 0) === 1 || (vv | 0) === 5) ? GOLD : undefined), box(-0.9, -0.9, 6.5, 1.8, 1.8, 9, 0x6b4a3a), box(-6.5, -6.5, 12, 13, 13, 7, c1, cp, { ns: 1 }), box(-4.5, -4.5, 19, 9, 9, 5, c1, cp, { ns: 1 }), box(-2.6, -2.6, 24, 5.2, 5.2, 3, c1, cp, { ns: 1 }), ...(v === 1 ? [box(-9.9, 2, 8.5, 0.7, 1.4, 2.6, FRED), box(9.2, -3, 9.5, 0.7, 1.4, 2.6, FRED), box(2, 9.2, 8.5, 1.4, 0.7, 2.6, FRED), box(-3, 9.2, 10, 1.4, 0.7, 2.6, GOLD)] : [])];
};
PROP.quat = (sn, v) => [box(-3.4, -3.4, 0, 6.8, 6.8, 5.5, 0xc4583a, (f, u, vv) => f !== 0 && (vv | 0) === 2 ? GOLD : undefined), box(-0.6, -0.6, 5.5, 1.2, 1.2, 3, 0x6b4a3a), box(-6.4, -6.4, 8, 12.8, 12.8, 9.5, 0x3f8a3e, (f, u, vv, b, wx, wy) => { const h = hash2(u * 7 + f * 3 + (wx | 0), vv * 5 + (wy | 0)); return h < 0.34 ? 0xf08a1a : h < 0.4 ? 0xffb030 : h > 0.8 ? 0x58a04a : undefined; }, { ns: 1 }), box(-1.6, -6.8, 12, 3.2, 0.8, 1.8, FRED)];
PROP.cucPot = (sn, v) => [box(-3, -3, 0, 6, 6, 4.4, 0xc4583a, (f, u, vv) => f !== 0 && (vv | 0) === 1 ? GOLD : undefined), box(-4.4, -4.4, 4.4, 8.8, 8.8, 4.2, [0xffd23a, 0xf08a2b, 0xf4f4ee, 0xd9528a][v % 4], (f, u, vv, b, wx, wy) => hash2(u * 9 + wx, vv * 9 + wy) < 0.28 ? 0x4a9a4a : hash2(u * 3 + wx, vv * 3) < 0.2 ? 0xfff2a0 : undefined, { ns: 1 })];
PROP.melonPile = (sn, v) => [box(-6, -3, 0, 12, 6, 0.6, 0x9a8a6a, null, { nf: 1 }), ...melonPile(0, -3.6, 0.6, 3 + (v % 2), 3, 4.2), slice(5, 3, 0.6), basket(-6, 3, 0.6, 4, 3)];
PROP.melonBikeP = (sn, v) => rotBoxes(vehModel('melonbike', v), 1);
// vertical banner / couplets / lanterns
const bannerPole = (text, wid) => (sn, v) => { const W = wid || textW(text) + 7, hx = W / 2; return [box(-hx - 0.4, -0.4, 0, 0.9, 0.9, 38, 0x8a6a3a), box(hx - 0.5, -0.4, 0, 0.9, 0.9, 38, 0x8a6a3a), box(-hx, -0.3, 26, W, 0.6, 9, 0xc8261c, (f, u, vv) => { if (f !== 1) return undefined; if (vv < 0.9 || vv > 8.1 || u < 0.9 || u > W - 0.9) return GOLD; if (textAt(text, u - (W - textW(text)) / 2, vv - 2)) return FYEL; }, { nf: 1 }), box(-hx + 1, -0.2, 22.4, 0.6, 0.5, 3.6, GOLD), box(hx - 1.6, -0.2, 22.4, 0.6, 0.5, 3.6, GOLD)]; };
PROP.bnCMNM = bannerPole('CHUC MUNG NAM MOI'); PROP.bnVSNY = bannerPole('VAN SU NHU Y'); PROP.bnPL = bannerPole('PHUC LOC THO', 38); PROP.bnXUAN = bannerPole('XUAN');
PROP.pennant = () => [box(0, 0, 22.4, 4.6, 0.6, 0.7, 0x8a6a3a), box(0.4, 0, 12, 3.8, 0.6, 10.4, 0xc8261c, (f, u, v) => v < 0.9 || u < 0.5 || u > 3.3 ? GOLD : (v > 5.2 && v < 7.6 && u > 1 && u < 2.8 ? FYEL : undefined), { nf: 1 }), box(1.6, 0, 10.4, 0.7, 0.6, 1.6, GOLD)];
PROP.lanternPost = () => { const B = [box(-0.5, -0.5, 0, 1, 1, 26, 0x6b4a3a), box(-6, -0.4, 24.6, 12, 0.8, 0.8, 0x6b4a3a)]; for (const x of [-5, 0, 5]) B.push(box(x - 1.4, -1.4, 17.4, 2.8, 2.8, 5, FRED, (f, u, v) => v < 0.9 || v > 4.1 ? GOLD : undefined, { em: 0xff7a3a, nf: 1 }), box(x - 0.2, -0.2, 22.4, 0.5, 0.5, 2.2, GOLD)); return B; };
PROP.cauDoi = () => { const sc = (x) => box(x, -0.3, 3, 2, 0.6, 13, 0xc8261c, (f, u, v) => v < 0.7 || v > 12.3 || u < 0.4 || u > 1.6 ? GOLD : (((v * 2) | 0) % 3 === 0 && u > 0.6 && u < 1.4 ? FYEL : undefined), { nf: 1 }); return [sc(-10.5), sc(8.5)]; };

// ---------------------------------------------------------------- potted Tết plants as painted sprites (not boxes): glazed pot + puffy canopy
const PLANTS = { maiBig: { pot: 9, ph: 7, can: 10, tr: 9, kind: 'mai' }, maiTet: { pot: 5.5, ph: 4.5, can: 6, tr: 4, kind: 'mai' }, quat: { pot: 7, ph: 5.5, can: 7, tr: 3, kind: 'quat' }, cucPot: { pot: 6, ph: 4.4, can: 4.6, tr: 0, kind: 'cuc' } };
function plantSprite(name, season, v) {
  const P = PLANTS[name], LW = 32, LH = 44, W = LW * K, H = LH * K, ax = LW / 2, ay = LH - 4, R = mulberry32(name.length * 97 + v * 13 + 1);
  const g = new Int32Array(W * H).fill(-1), set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = c; }, get = (x, y) => x >= 0 && y >= 0 && x < W && y < H ? g[y * W + x] : -1;
  const cx = ax * K, base = ay * K, pw = P.pot * K, ph = P.ph * K;
  const potC = P.kind === 'quat' ? 0x3f7a78 : 0xb8563a, potS = mixc(potC, 0x3a221c, 0.35), potH = mixc(potC, 0xfff1d6, 0.25), band = 0xe8b84a;
  for (let y = 0; y < ph; y++) { const hw = pw / 2 * (0.78 + 0.22 * (y / ph)); for (let x = -hw; x <= hw; x++) { const f = (x + hw) / (2 * hw); set(cx + x, base - ph + y + Math.round(Math.abs(x) * 0.12), f > 0.7 ? potS : f < 0.25 ? potH : (Math.abs(y - ph * 0.45) < K * 0.6 ? band : potC)); } }
  for (let x = -pw / 2 - 1; x <= pw / 2 + 1; x++) { set(cx + x, base - ph, mixc(potC, 0xfff1d6, 0.15)); set(cx + x, base - ph + 1, 0x4a2e22); }
  const top = base - ph - P.tr * K;
  for (let y = base - ph; y > top; y--) { set(cx, y, 0x6e4c3c); set(cx + 1, y, 0x4a3028); if (P.kind === 'mai' && (base - ph - y) % 7 === 3) { for (let i = 1; i < 5; i++) set(cx + ((y & 1) ? i : -i), y - i * 0.6, 0x6e4c3c); } }
  const leaf = P.kind === 'quat' ? [0x22442c, 0x356a3a, 0x4f8a44, 0x7ab25a] : P.kind === 'cuc' ? [0x2d4f38, 0x4a7d46, 0x6aa04e, 0x9ac46a] : [0x3a5a32, 0x5a8044, 0x86a858, 0xb8cc78];
  const E = [], r0 = P.can * K;
  if (P.kind === 'cuc') { for (let i = 0; i < 5; i++) E.push([cx + sr(R, -0.5, 0.5) * r0, base - ph - r0 * 0.25 + sr(R, -0.15, 0.1) * r0, r0 * sr(R, 0.42, 0.6)]); }
  else for (let i = 0; i < (P.kind === 'quat' ? 6 : 8); i++) E.push([cx + sr(R, -0.6, 0.6) * r0, top - r0 * 0.15 + sr(R, -0.45, 0.35) * r0, r0 * sr(R, 0.38, 0.55)]);
  E.sort((a, b) => a[1] - b[1]);
  for (const [ex, ey, er] of E) for (let y = Math.floor(ey - er); y <= ey + er; y++) for (let x = Math.floor(ex - er); x <= ex + er; x++) { const dx = (x - ex) / er, dy = (y - ey) / er, d = dx * dx + dy * dy; if (d > 1 - hash2(x >> 1, y >> 1) * 0.12) continue; const l = -dx * 0.55 - dy * 0.75 + (1 - d) * 0.3; set(x, y, l > 0.55 ? leaf[3] : l > 0.1 ? leaf[2] : l > -0.35 ? leaf[1] : leaf[0]); }
  const bl = P.kind === 'mai' ? (v === 2 ? [0xf7a8c8, 0xfcd8e6, 0.5] : [0xf7d24a, 0xffeca0, 0.55]) : P.kind === 'quat' ? [0xf08a1a, 0xffb84a, 0.22] : [[0xffd23a, 0xfff0a0], [0xf4f0e6, 0xffffff], [0xf08a2b, 0xffc070], [0xd9528a, 0xf8a0c4]][v % 4].concat([0.62]);
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const c = get(x, y); if (c < 0 || !leaf.includes(c)) continue; const h = hash2(x * 7 + v, y * 3); if (h < bl[2]) { const k = h < bl[2] * 0.45 ? bl[1] : bl[0]; set(x, y, k); set(x + 1, y, k); set(x, y + 1, mixc(k, 0x6a3f45, 0.25)); if (P.kind === 'quat') set(x + 1, y + 1, mixc(k, 0x6a3f45, 0.35)); } }
  if (v === 1 || P.kind === 'quat') for (let i = 0; i < 4; i++) { const x = cx + sr(R, -0.6, 0.6) * r0, y = top + sr(R, -0.1, 0.5) * r0; for (let j = 0; j < 4; j++) { set(x, y + j, 0xd2321e); set(x + 1, y + j, 0xb0261a); } set(x, y + 1, 0xf2c94c); }
  const s = gridCanvas(inkGrid(g, W, H, 0.8), W, H, null, K); s.ax = ax; s.ay = ay; return s;
}
// ---------------------------------------------------------------- delivery vehicles carrying watermelons
const loadMelons = (B, x0, z0, cols, rows, y0, sz) => { for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) B.push(melon(x0 + i * sz, y0, z0 + r * sz * 0.8, sz)); };
VEH.melonbike = v => { const m = VEH.bike(0); m.boxes.push(box(8.6, 0.2, 1.4, 3.6, 2.6, 2.8, 0xb8863f), melon(8.8, 0.6, 4.2, 2.8), melon(9.2, 1.4, 6.6, 2.6)); m.boxes.push(box(-1.6, 0.3, 3.4, 5, 2.6, 1, 0x8a6a3a), melon(-1.2, 0.5, 4.4, 2.8), melon(1.6, 0.5, 4.4, 2.8), melon(0.2, 1, 6.9, 2.8)); m.melon = 1; return m; };
VEH.melonmoto = v => { const m = VEH.cub(v + 2); m.boxes.push(box(-3.2, -0.4, 5.4, 6.2, 5.2, 1, 0x8a6a3a)); for (let r = 0; r < 3; r++) for (let i = 0; i < (3 - r); i++) m.boxes.push(melon(-2.8 + i * 3.4 + r * 1.7, 0, 6.4 + r * 3.1, 3.6), melon(-2.8 + i * 3.4 + r * 1.7, 2.8, 6.4 + r * 3.1, 3.6)); m.melon = 1; return m; };
VEH.melontruck = v => { const m = VEH.truck(v); m.boxes = m.boxes.filter((b, i) => i !== 3 && i !== 4 + 0 || false); const keep = VEH.truck(v).boxes; m.boxes = keep.slice(); m.boxes.splice(keep.findIndex(b => b.z === 5 && b.w === 17), 1); for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) for (const y of [1.4, 5, 8.2]) m.boxes.push(melon(1 + i * 4.2 + (r % 2) * 1.2, y, 5 + r * 3.2, 4.2)); m.melon = 1; return m; };

// ---------------------------------------------------------------- planning
const tkey = (x, y) => y * N + x;
function planTet() {
  const R = mulberry32(2026), occ = new Set(), taken = new Set();
  for (const r of CITY.recs) if (r.t === 'p' || r.t === 't') occ.add(tkey(Math.floor(r.x / T), Math.floor(r.y / T)));
  for (const d of POI.doors) occ.add(tkey(Math.floor(d.x / T), Math.floor(d.y / T)));
  const OK = [G_SIDE, G_PROM, G_GRASS, G_PLAZA];
  const okTile = (tx, ty, allow) => tx >= 0 && ty >= 0 && tx < N && ty < N && (allow || OK).includes(GT[gi(tx, ty)]) && !BLK[gi(tx, ty)] && !occ.has(tkey(tx, ty)) && !taken.has(tkey(tx, ty));
  const area = (tx, ty, w, h, allow) => { for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) if (!okTile(x, y, allow)) return false; return true; };
  const take = (tx, ty, w, h) => { for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) taken.add(tkey(x, y)); };
  const tetP = (name, p, o) => { for (let e = 0; e < 4; e++) CITY.recs.push({ t: 'p', name, x: p[0], y: p[1], v: o.perEra ? e : o.v || 0, m: !!o.mirror, kb: o.kb || 0, only: undefined, e0: e, e1: e, tet: 1 }); };
  const tetP1 = (name, p, o) => CITY.recs.push({ t: 'p', name, x: p[0], y: p[1], v: o.v || 0, m: !!o.mirror, kb: o.kb || 0, only: undefined, e0: 0, e1: 3, tet: 1 });
  const flag = (x, y, z, ph, size, ax, o) => TET.fixed.push(Object.assign({ k: 'flag', x, y, z, ph, size, ax, phs: hash2(x, y) }, o));
  const walkBlock = (tx, ty, w, h) => { for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) TET.blocks.push(gi(x, y)); };
  let nM = 0, nF = 0;
  // stall: face 'y' (customers south, 3x2 tiles + customer row) or 'x' (customers east, 2x3 + customer column)
  const stall = (kind, tx, ty, face) => {
    const w = face === 'y' ? 3 : 2, h = face === 'y' ? 2 : 3, cw = face === 'y' ? 3 : 1, ch = face === 'y' ? 1 : 3;
    const cxT = face === 'y' ? tx : tx + 2, cyT = face === 'y' ? ty + 2 : ty;
    if (!area(tx, ty, w, h) || !area(cxT, cyT, cw, ch, [G_SIDE, G_PROM, G_GRASS, G_PLAZA, G_PATH])) return false;
    take(tx, ty, w, h); take(cxT, cyT, cw, ch); walkBlock(tx, ty, w, h);
    const c = face === 'y' ? [(tx + 1.5) * T, ty * T + 9.6] : [tx * T + 9.6, (ty + 1.5) * T], vend = face === 'y' ? [c[0], ty * T + 3.6] : [tx * T + 3.6, c[1]], cust = face === 'y' ? [c[0], ty * T + 20] : [tx * T + 20, c[1]];
    tetP(kind === 'melon' ? 'melonStall' : 'flowerStall', c, { perEra: 1, mirror: face === 'x', kb: 14 });
    TET.stalls.push({ kind, x: c[0], y: c[1], vx: vend[0], vy: vend[1], dir: face === 'y' ? 1 : 0, cust, face });
    if (kind === 'melon') { nM++; TET.melonSpots = TET.melonSpots || []; TET.melonSpots.push({ x: cust[0], y: cust[1], dir: face === 'y' ? 3 : 2, ped: null, tet: true }); } else nF++;
    for (const s of [[-1, 0], [1, 0]]) { const px = face === 'y' ? c[0] + s[0] * 13.5 : c[0], py = face === 'y' ? c[1] : c[1] + s[0] * 13.5; flag(px, py + (face === 'y' ? -5 : 0), 22, 7, 's', face === 'y' ? 'x' : 'y', { stallPole: 1 }); }
    return true;
  };
  // 1) Bến Bạch Đằng promenade (x tiles 20-26): a long row of watermelon stalls with some flower stalls, big mai, kumquat, lanterns, banners
  let lastS = -9, kk = 0;
  for (let ty = 3; ty < N - 6; ty++) { if (ty - lastS < 5) continue; for (const tx of [24, 23, 25]) if (stall(kk % 4 === 3 ? 'flower' : 'melon', tx, ty, 'y')) { lastS = ty; kk++; break; } }
  for (let ty = 4; ty < N - 4; ty += 9) { const tx = ty % 2 ? 20 : 21; if (area(tx, ty, 1, 1) && !inGap(ty)) { take(tx, ty, 1, 1); tetP1('maiBig', [tx * T + 4, ty * T + 4], { v: (ty / 5 | 0) % 3 }); } }
  for (let ty = 6; ty < N - 4; ty += 9) { const tx = 26; if (area(tx, ty, 1, 1) && !inGap(ty)) { take(tx, ty, 1, 1); tetP1(ty % 3 ? 'quat' : 'cucPot', [tx * T + 4, ty * T + 4], { v: ty }); } }
  for (let ty = 5; ty < N - 4; ty += 6) if (!inGap(ty) && !inGap(ty + 1)) { tetP1('lanternPost', [170, ty * T + 4], {}); flag(163, ty * T + 4 + 24, 7, 15, 'm', 'x', {}); }
  for (let ty = 12; ty < N - 8; ty += 20) if (!inGap(ty)) tetP1('bnCMNM', [187, ty * T + 4], {});
  // riverside rail flags + promenade lamp flags
  for (let ty = 3; ty < N - 3; ty += 5) if (!inGap(ty) && !inGap(ty + 1)) flag(161, ty * T + 8, 8, 14, 'm', ty % 2 ? 'x' : 'y', {});
  for (let m = 0; m * 20 + 6 < N - 4; m++) { const yl = m * 20 + 6; if (!inGap(yl)) flag(186, yl * T + 4, 0, 30, 'm', 'x', {}); }
  // bridge: flags on both rails and a string of bunting each side
  for (let x = 52; x <= 148; x += 16) for (const y of [271, 289]) flag(x, y, 12, 16, 's', y < 280 ? 'x' : 'y', {});
  for (const y of [271, 289]) TET.strings.push(mkString([44, y, 12 + 18], [156, y, 12 + 18], 'x', 9));
  TET.bridge = true;
  // 2) every block: kerb flags along the streets, mai pots / kumquat on the pavements, lantern posts, pennants on every lamp
  const lampSet = CITY.lamps.slice();
  for (const l of lampSet) if (l[0] > 240 && hash2(l[0], l[1]) < 0.95) tetP1('pennant', [l[0] + 2.2, l[1] + 0.6], {});
  for (const h of ROADS_H) for (let tx = 36; tx < N - 4; tx += 11) {
    if (ROADS_V.some(v => tx > v - 6 && tx < v + RW + 5)) continue;
    for (const [ty, ax] of [[h - 1, 'x'], [h + RW, 'y']]) if (GT[gi(tx, ty)] === G_SIDE && !occ.has(tkey(tx, ty))) flag(tx * T + 4, ty * T + (ty < h ? 6.5 : 1.5), 0, 26, 'm', ax, {});
  }
  for (const v of ROADS_V) for (let ty = 4; ty < N - 4; ty += 11) {
    if (ROADS_H.some(h => ty > h - 6 && ty < h + RW + 5)) continue;
    for (const [tx, ax] of [[v - 1, 'y'], [v + RW, 'x']]) if (GT[gi(tx, ty)] === G_SIDE && !occ.has(tkey(tx, ty))) flag(tx * T + (tx < v ? 6.5 : 1.5), ty * T + 4, 0, 26, 'm', ax, {});
  }
  // pavement pots: walk the sidewalk ring of every block
  for (let ty = 2; ty < N - 2; ty++) for (let tx = 34; tx < N - 1; tx++) {
    if (GT[gi(tx, ty)] !== G_SIDE) continue; const h = hash2(tx * 13, ty * 7);
    if (h > 0.072) continue; if (!area(tx, ty, 1, 1)) continue;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(d => GT[gi(tx + d[0], ty + d[1])] === G_ROAD); if (near && h > 0.03) continue;
    take(tx, ty, 1, 1); tetP1(h < 0.02 ? 'maiBig' : h < 0.045 ? 'quat' : h < 0.06 ? 'maiTet' : 'cucPot', [tx * T + 4, ty * T + 4], { v: (h * 997 | 0) % 3 });
  }
  // 3) watermelon stalls + flower stalls on sidewalks (south / east sides of a block, so they face the street), more around market and park
  const blocks = [];
  for (let j = 0; j < 4; j++) for (let i = 1; i < 4; i++) blocks.push({ i, j, x0: XS[i][0], x1: XS[i][1], y0: YS[j][0], y1: YS[j][1], kind: KINDS[j][i] });
  for (const B of blocks) {
    const quota = B.kind === 'market' ? 9 : B.kind === 'park' ? 3 : B.kind === 'hero' ? 4 : 2; let got = 0;
    const cand = []; for (let x = B.x0 + 3; x < B.x1 - 8; x += 4) cand.push(['y', x, B.y1 - 3]); for (let y = B.y0 + 3; y < B.y1 - 8; y += 4) cand.push(['x', B.x1 - 3, y]);
    if (B.kind === 'market') for (let y = B.y0 + 4; y < B.y1 - 6; y += 3) for (let x = B.x0 + 4; x < B.x1 - 6; x += 4) cand.push(['y', x, y]);
    cand.sort((a, b) => hash2(a[1] * 3, a[2]) - hash2(b[1] * 3, b[2]));
    for (const c of cand) { if (got >= quota) break; if (stall(got % 3 === 2 ? 'flower' : 'melon', c[1], c[2], c[0])) got++; }
  }
  // 4) park: tết market along the paths + banners over them
  { const B = blocks.find(b => b.kind === 'park'), ix0 = B.x0 + SW, iy0 = B.y0 + SW, ix1 = B.x1 - SW, iy1 = B.y1 - SW, cx = (ix0 + ix1) >> 1, cy = (iy0 + iy1) >> 1; let k = 0;
    for (let ty = iy0 + 2; ty < iy1 - 3; ty += 3) { for (const [tx, f] of [[cx - 4, 'x']]) if (stall(k % 3 === 2 ? 'flower' : 'melon', tx, ty, f)) k++; }
    for (let tx = ix0 + 1; tx < ix1 - 4; tx += 4) for (const ty of [cy - 4, cy + 3]) if (stall(k % 3 === 2 ? 'flower' : 'melon', tx, ty, 'y')) k++;
    for (const ty of [iy0 + 4, cy - 8, cy + 8, iy1 - 3]) tetP1('bnCMNM', [cx * T, ty * T], {});
    tetP1('bnVSNY', [(cx + 8) * T, cy * T + 4], {}); tetP1('bnPL', [(ix0 + 8) * T, cy * T + 4], {});
    for (let i = 0; i < 40; i++) { const tx = si(R, ix0, ix1 - 1), ty = si(R, iy0, iy1 - 1); if (area(tx, ty, 1, 1, [G_GRASS]) && GT[gi(tx, ty)] === G_GRASS) { take(tx, ty, 1, 1); CITY.recs.push({ t: 't', spc: 'maiL', v: i & 1, x: tx * T + 4, y: ty * T + 4, ph: hash2(tx, ty) * 9, tet: 1, e0: 0, e1: 3 }); } }
    for (let i = 0; i < 18; i++) { const tx = si(R, ix0, ix1 - 1), ty = si(R, iy0, iy1 - 1); if (area(tx, ty, 1, 1, [G_GRASS])) { take(tx, ty, 1, 1); tetP1(i % 3 ? 'maiBig' : 'quat', [tx * T + 4, ty * T + 4], { v: i % 3 }); } }
    for (let ty = iy0 + 1; ty < iy1; ty += 7) { flag((cx - 2) * T, ty * T + 4, 0, 30, 'm', 'y', {}); flag((cx + 2) * T, ty * T + 4, 0, 30, 'm', 'x', {}); } }
  // big mai trees along the promenade (spring-bright in every season)
  for (let ty = 8; ty < N - 6; ty += 13) { const tx = 26; if (area(tx, ty, 1, 1) && !inGap(ty)) { take(tx, ty, 1, 1); CITY.recs.push({ t: 't', spc: 'maiL', v: ty & 1, x: tx * T + 4, y: ty * T + 4, ph: ty, tet: 1, e0: 0, e1: 3 }); } }
  // 5) landmarks: two LARGE flags on tall poles in front of each of the seven; market entrances get flags + banners; shop doors get couplets
  for (const r of CITY.recs) if (r.t === 'b' && r.lm) {
    const w = r.tw * T, d = r.td * T, east = r.lm === 2;
    if (east) { flag(r.x + w + 5, r.y + 0.1 * d, 0, 70, 'L', 'y', { big: 1 }); flag(r.x + w + 5, r.y + 0.9 * d, 0, 70, 'L', 'x', { big: 1 }); }
    else { flag(r.x + 0.1 * w, r.y + d + 5, 0, 70, 'L', 'x', { big: 1 }); flag(r.x + 0.9 * w, r.y + d + 5, 0, 70, 'L', 'y', { big: 1 }); }
  }
  for (const d of POI.doors) if (d.shop === 'cho') { flag(d.x - 9, d.y + 6, 0, 36, 'm', 'x', {}); flag(d.x + 9, d.y + 6, 0, 36, 'm', 'y', {}); tetP1('bnXUAN', [d.x, d.y + 9], {}); }
  for (const d of POI.doors) if (d.shop && d.shop !== 'cho') { const out = DIRV[(d.dir + 2) % 4]; tetP1('cauDoi', [d.ix + out[0] * 1.6, d.iy + out[1] * 1.6], { mirror: out[0] === 1 }); }
  // 6) bunting across the streets (mid-block, never near a junction box) + banners across the N-S streets
  for (const v of ROADS_V) for (const [a, b] of [[4, 36], [42, 76], [82, 122], [128, 158]]) for (let ty = a + 6; ty < b - 6; ty += 8) {
    const x0 = v * T - 4, x1 = (v + RW) * T + 4, t0 = Math.floor(x0 / T), t1 = Math.floor(x1 / T);
    if (GT[gi(t0, ty)] !== G_SIDE || GT[gi(t1, ty)] !== G_SIDE || BLK[gi(t0, ty)] || BLK[gi(t1, ty)]) continue;
    if (v !== ROADS_V[0] && hash2(v, ty) < 0.5) tetP1(ty % 16 < 8 ? 'bnPL' : 'bnPL', [(x0 + x1) / 2, ty * T + 4], {}); else TET.strings.push(mkString([x0, ty * T + 4, 34], [x1, ty * T + 4, 34], 'x', 7));
  }
  for (const h of ROADS_H) for (const [a, b] of [[36, 76], [80, 112], [116, 158]]) for (let tx = a + 7; tx < b - 7; tx += 9) {
    const y0 = h * T - 4, y1 = (h + RW) * T + 4, t0 = Math.floor(y0 / T), t1 = Math.floor(y1 / T);
    if (GT[gi(tx, t0)] !== G_SIDE || GT[gi(tx, t1)] !== G_SIDE || BLK[gi(tx, t0)] || BLK[gi(tx, t1)]) continue;
    TET.strings.push(mkString([tx * T + 4, y0, 34], [tx * T + 4, y1, 34], 'y', 7));
  }
  TET.count = { melon: nM, flower: nF, flags: TET.fixed.length, strings: TET.strings.length };
  POI.melon = []; TET.saveWALK = new Map(); for (const g of TET.blocks) TET.saveWALK.set(g, WALK[g]);
}
let _sid = 0;
function mkString(A, B, ax, sag) { const dx = (B[0] - B[1]) - (A[0] - A[1]), dy = ((B[0] + B[1]) / 2 - B[2]) - ((A[0] + A[1]) / 2 - A[2]); return { k: 'str', id: ++_sid, A, B, ax, dx, dy, sag, x: (A[0] + B[0]) / 2, y: (A[1] + B[1]) / 2, phs: hash2(A[0], A[1]), len: Math.hypot(B[0] - A[0], B[1] - A[1]) }; }

// ---------------------------------------------------------------- per-era roof flags: a flag on the roof of every house and shophouse
function roofFlags(era) {
  if (TET.roofCache[era]) return TET.roofCache[era];
  const out = [];
  for (const r of CITY.recs) {
    if (r.t !== 'b' || r.lm || r.keep || (r.e0 !== undefined && (era < r.e0 || era > r.e1))) continue;
    let bs; try { bs = r.gen ? r.gen(era) : r.boxes; } catch (e) { continue; } if (!bs || !bs.length) continue;
    let top = null; for (const b of bs) if (!b.nf && b.w * b.d >= 30 && (!top || b.z + b.h > top.z + top.h)) top = b;
    if (!top) continue; const z = top.z + top.h, tall = z > 74, wide = top.w > 22, sz = tall ? 'm' : 's', ph = tall ? 16 : 12, hs = hash2(r.x * 3, r.y);
    out.push({ k: 'flag', x: r.x + top.x + top.w - 3, y: r.y + top.y + top.d - 3, z, ph, size: sz, ax: hs < 0.5 ? 'x' : 'y', phs: hs, roof: 1 });
    if (wide) out.push({ k: 'flag', x: r.x + top.x + 3, y: r.y + top.y + top.d - 3, z, ph, size: sz, ax: hs < 0.5 ? 'y' : 'x', phs: hs + 0.37, roof: 1 });
  }
  return (TET.roofCache[era] = out);
}

// ---------------------------------------------------------------- runtime
TET.tick = dt => { TET.clock += dt * (0.9 + G.gust * 1.3 + (G.windy ? 0.7 : 0)); };
TET.visible = () => {
  const v = [], M = 90; if (!G.tet) return v;
  const add = f => { if (G.onScreen(f.x, f.y, f.k === 'str' ? 60 : M)) v.push(f); };
  for (const f of TET.fixed) add(f); for (const f of roofFlags(G.era)) add(f); for (const f of TET.strings) add(f);
  return v;
};
TET.key = f => f.k === 'str' ? f.x + f.y + 2 : f.x + f.y + (f.roof ? 5 : 3);
// called from main.js draw(): g = canvas ctx, lg = light ctx, cx/cy camera
TET.draw = (g, lg, useL, f, cx, cy) => {
  if (f.k === 'flag') {
    const s = flagSprite(f.size, f.ax, Math.floor(((TET.clock * 0.55 + f.phs) % 1 + 1) % 1 * NF) % NF), b = scn(f.x, f.y, f.z), top = b[1] - f.ph, big = f.size === 'L';
    g.fillStyle = '#2b1a16'; g.fillRect(b[0] - 0.5, top, big ? 2 : 1.5, f.ph); g.fillStyle = big ? '#e8dcc4' : '#c8b8a0'; g.fillRect(b[0], top, big ? 1 : 0.5, f.ph); g.fillStyle = '#f2c94c'; g.fillRect(b[0] - 0.5, top - 1, big ? 2 : 1.5, 1);
    g.drawImage(s.c, b[0] - s.ox + (f.ax === 'x' ? (big ? 1 : 0.5) : 0), top - s.oy + 1, s.w, s.h);
  } else {
    const s = bunting(f, Math.floor(((TET.clock * 0.5 + f.phs) % 1 + 1) % 1 * 4) % 4), a = scn(f.A[0], f.A[1], f.A[2]), a0 = scn(f.A[0], f.A[1], 0), b0 = scn(f.B[0], f.B[1], 0), b = scn(f.B[0], f.B[1], f.B[2]);
    g.fillStyle = '#6b4a3a'; g.fillRect(a0[0], a[1] - 1, 1, a0[1] - a[1] + 1); g.fillRect(b0[0], b[1] - 1, 1, b0[1] - b[1] + 1);
    g.drawImage(s.c, a[0] - s.ox, a[1] - s.oy, s.w, s.h); if (useL) lg.drawImage(s.e, a[0] - s.ox, a[1] - s.oy, s.w, s.h);
  }
};

// vendors (NPCs behind each stall) and customer spots, rebuilt whenever Tết toggles or the era changes
const VENDOR_TYPES = [['baba', 'oldman', 'oldlady'], ['baba', 'dobo', 'oldman'], ['dobo', 'worker', 'baba'], ['modern', 'office', 'dobo']];
TET.sync = () => {
  SIM.actors = SIM.actors.filter(a => !a.tetV);
  const on = G.tet; POI.melon = on ? TET.melonSpots || [] : []; for (const s of POI.melon) { if (s.ped && s.ped.dead) s.ped = null; }
  for (const g of TET.blocks) WALK[g] = on ? 0 : TET.saveWALK.get(g);
  if (!on) { for (const p of SIM.peds) { if (p.look.carry === 'melon') { p.look.carry = null; p.resheet(); } } return; }
  for (const s of TET.stalls) {
    const L = dressFor(randLook(pick(VENDOR_TYPES[G.era])), G.season); L.carry = null; L.ganh = false; L.apron = 1; if (L.type === 'aodai' || L.fem) L.top = pick([0xd9281e, 0xf2c94c, 0xc94f6a]);
    SIM.actors.push({ x: s.vx, y: s.vy, dir: s.dir, pose: 0, sit: false, role: 'vendor', look: L, sheet: personSheet(L), bub: null, emT: rr(2, 20), tetV: true });
  }
};
// remove melon delivery vehicles when Tết ends
TET.off = () => { for (const L of SIM.lanes) L.vehs = L.vehs.filter(v => !v.kind.startsWith('melon')); SIM.vehs = SIM.vehs.filter(v => !v.kind.startsWith('melon')); };
