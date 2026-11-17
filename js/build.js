'use strict';
// ===== Sài Gòn Lofi — era-aware buildings (box lists; front faces +y at y = d unless mirrored) =====
const GH = 20, FH = 15;   // ground-floor and upper-floor heights (px)
const GOODS = [0xd9534f, 0xf2c94c, 0x9fd8b4, 0xf08a2b, 0x8fc1e3, 0xf7f4ec, 0xc94f6a, 0x58994f];
const TILE = 0xc4583a, TILE2 = 0xa8472f;
// ----- per-era building style. Add a new era by appending a row here (and in eras.js). -----
const ESTYLE = [
  { wear: 1, walls: [0xe8c878, 0xe9d39a, 0xdcbf84, 0xe6d9b0, 0xd9c494, 0xcfd8c0, 0xe2c9a0, 0xe8c878, 0xd8cfae], shuts: [0x4f8a6f, 0x3f7a66, 0x4f8a6f, 0x5a7a8a, 0x7a5a3a], roof: [0.58, 0.24], sign: 0, glass: 0, ac: 0, modern: 0, awn: 0.85, balc: 0.6, laundry: 0.5, board: 0, flag: 0.16 },
  { wear: 0.5, walls: [0xf2dc8a, 0xbfe3c8, 0xa9d4ea, 0xf6c9c0, 0xf4ecd2, 0xf0d890, 0xd8c8ec, 0xc8e0b0, 0xf2b89a], shuts: [0x4f8a6f, 0x3d6fa5, 0x8a3a3a, 0x3f7a7a], roof: [0.3, 0.14], sign: 1, glass: 0.25, ac: 0.3, modern: 0, awn: 0.7, balc: 0.55, laundry: 0.3, board: 0.04, flag: 0.12 },
  { wear: 0.22, walls: [0xf4f0e6, 0xe8e2d4, 0xf2e6c4, 0xd9dee4, 0xf6d9c8, 0xcfe0e0, 0xeceae4], shuts: [0x4a5560, 0x3d6fa5, 0x6a5a4a], roof: [0.14, 0.04], sign: 2, glass: 0.6, ac: 0.6, modern: 0.22, awn: 0.4, balc: 0.5, laundry: 0.12, board: 0.2, flag: 0.1 },
  { wear: 0.08, walls: [0xf6f4ee, 0xe9e7e2, 0xd8dade, 0xf2ece0, 0x4a4e58, 0xe4ded2], shuts: [0x3a3f48, 0x4a5560], roof: [0.08, 0.02], sign: 3, glass: 0.8, ac: 0.7, modern: 0.36, awn: 0.25, balc: 0.5, laundry: 0.05, board: 0.26, flag: 0.1 }
];
// ----- shop categories. `e` holds per-era overrides (merged cumulatively), so a lot keeps its role while its skin changes. -----
const SHOPS = {
  cafe: { sign: ['CA PHE', 'CAFE'], bg: 0x6b4226, fg: 0xf7e9c8, kind: 'open', aw: [0x3d6fb5, 0xf7f4ec], e: { 2: { sign: ['COFFEE', 'CAFE'], kind: 'modern', bg: 0x3a2a22 }, 3: { sign: ['COFFEE', 'CAFE'], bg: 0x1f6a5a } } },
  hottoc: { sign: ['HOT TOC', 'TOC'], bg: 0xf7f4ec, fg: 0xc0392b, kind: 'open', aw: [0xc0392b, 0xf7f4ec], e: { 2: { sign: ['SALON', 'TOC'], bg: 0x2a2a30, fg: 0xf7d9e0 }, 3: { sign: ['BARBER', 'TOC'] } } },
  pho: { sign: ['PHO BO', 'PHO'], bg: 0xc0392b, fg: 0xf7d94a, kind: 'open', aw: [0xc0392b, 0xf7d94a] },
  taphoa: { sign: ['TAP HOA', 'T.HOA'], bg: 0x2f8a5a, fg: 0xf7f4ec, kind: 'open', aw: [0x2f8a5a, 0xf7f4ec], e: { 2: { sign: ['MART 24H', 'MART'], kind: 'modern', bg: 0xf7f4ec, fg: 0x1f8a5a }, 3: { sign: ['MART 24H', 'MART'], bg: 0x1f8a5a, fg: 0xf7f4ec } } },
  suaxe: { sign: ['SUA XE'], bg: 0x3a3a44, fg: 0xf2c94c, kind: 'open', e: { 3: { sign: ['XE DIEN', 'SUA XE'], bg: 0x1f8a8a, fg: 0xf7f4ec } } },
  karaoke: { sign: ['KARAOKE', 'KARA'], bg: 0x3a2050, fg: 0xff7ad0, kind: 'glass', neon: 1 },
  photo: { sign: ['ANH MAU', 'PHOTO'], bg: 0xf2c94c, fg: 0xc0392b, kind: 'glass', e: { 1: { sign: ['DIEN THOAI', 'MOBILE'], bg: 0xd9281e, fg: 0xf7f4ec }, 2: { sign: ['SMARTPHONE', 'MOBILE'], kind: 'modern', bg: 0xf7f4ec, fg: 0x2a2a30 } } },
  thuoc: { sign: ['THUOC TAY', 'THUOC'], bg: 0xf7f4ec, fg: 0x2f8a5a, kind: 'glass', e: { 2: { sign: ['NHA THUOC', 'THUOC'], kind: 'modern' } } },
  vang: { sign: ['VANG BAC', 'VANG'], bg: 0xc0392b, fg: 0xf7d94a, kind: 'glass' },
  sach: { sign: ['NHA SACH', 'SACH'], bg: 0x3d6fb5, fg: 0xf7f4ec, kind: 'open', e: { 2: { kind: 'modern' } } },
  may: { sign: ['NHA MAY', 'MAY'], bg: 0xb79fd8, fg: 0x3a2050, kind: 'glass', e: { 2: { sign: ['FASHION', 'SHOP'], kind: 'modern', bg: 0x2a2a30, fg: 0xf7f4ec } } },
  bia: { sign: ['BIA HOI', 'BIA'], bg: 0xf2c94c, fg: 0x3a3a44, kind: 'open', aw: [0xf2c94c, 0xf7f4ec], e: { 2: { sign: ['BIA CRAFT', 'BIA'] } } },
  com: { sign: ['COM TAM', 'COM'], bg: 0xf7f4ec, fg: 0xd9534f, kind: 'open', aw: [0xd9534f, 0xf7f4ec] },
  xoso: { sign: ['XO SO'], bg: 0xf2c94c, fg: 0xc0392b, kind: 'glass', e: { 2: { sign: ['NGAN HANG', 'ATM'], kind: 'modern', bg: 0x1f4f8a, fg: 0xf7f4ec } } },
  dientu: { sign: ['VIDEO', 'TIVI'], bg: 0xf2c94c, fg: 0x2f4f8a, kind: 'open', tv: 1, e: { 1: { sign: ['INTERNET', 'NET'], bg: 0x2a3a5a, fg: 0x9fe0ff, neon: 1 }, 2: { sign: ['GAME NET', 'NET'] }, 3: { sign: ['E-SPORT', 'NET'], bg: 0x2a1a4a, fg: 0xc79aff } } },
  che: { sign: ['CHE', 'CHE'], bg: 0x4fa3a0, fg: 0xf7f4ec, kind: 'open', aw: [0x4fa3a0, 0xf7f4ec], e: { 2: { sign: ['TRA SUA', 'TRA'], bg: 0xf2a0b5, fg: 0x3a2050 } } },
  banh: { sign: ['BANH MI'], bg: 0xf08a2b, fg: 0xf7f4ec, kind: 'open', aw: [0xf08a2b, 0xf7f4ec] },
  // one lot, four lives: grocery -> Internet cafe -> phone shop -> modern cafe
  evo: { sign: ['TAP HOA', 'T.HOA'], bg: 0x2f8a5a, fg: 0xf7f4ec, kind: 'open', aw: [0x2f8a5a, 0xf7f4ec], e: { 1: { sign: ['INTERNET', 'NET'], kind: 'glass', bg: 0x2a3a5a, fg: 0x9fe0ff, neon: 1, aw: null }, 2: { sign: ['DIEN THOAI', 'MOBILE'], kind: 'modern', bg: 0xd9281e, fg: 0xf7f4ec, neon: 0, aw: null }, 3: { sign: ['COFFEE', 'CAFE'], kind: 'modern', bg: 0x1f6a5a, fg: 0xf7f4ec, neon: 0, aw: null } } }
};
const SHOP_KEYS = Object.keys(SHOPS);
function shopSpec(key, era) { const b = SHOPS[key]; if (!b) return null; const s = Object.assign({}, b); if (b.e) for (let i = 1; i <= era; i++) if (b.e[i]) Object.assign(s, b.e[i]); return s; }
// sign styles: 0 hand-painted board, 1 printed banner, 2 light box, 3 LED
const signP = (text, fg, bg, mode, neon) => (f, u, v, b) => {
  if (f === 0) return shade(bg, -0.2); const W = f === 1 ? b.w : b.d; if (W < 3) return shade(bg, -0.2);
  const u0 = Math.floor((W - textW(text)) / 2), on = textAt(text, u - u0, v - 1);
  if (mode === 3) { if (on) { EM = fg; return fg; } EM = mixc(bg, 0, 0.5); return (u | 0) % 2 && (v | 0) % 2 ? shade(bg, 0.08) : bg; }
  if (on) { if (neon || mode === 2) EM = neon ? fg : mixc(fg, 0, 0.5); return mode === 0 && hash2(u * 3, v * 5) < 0.08 ? bg : fg; }
  if (neon) EM = mixc(fg, 0, 0.75); else if (mode === 2) EM = mixc(bg, 0, 0.45);
  if (u < 0.7 || u > W - 0.7 || v < 0.6 || v > b.h - 0.6) return shade(bg, mode === 0 ? -0.3 : -0.2);
  return mode === 0 && vnoise(u / 3, v / 2) > 0.66 ? shade(bg, -0.1) : bg;
};
const corr = (c) => (f, u, v) => f === 0 ? ((u | 0) % 2 ? c : shade(c, -0.12)) : shade(c, -0.1);
function fitSign(S, W) { for (const t of S.sign) if (textW(t) <= W - 3) return t; return null; }
const flowerP = (pink) => (f, u, v, b, wx, wy) => { const h = hash2(u * 5 + f * 3 + (wx | 0), v * 5 + (wy | 0)); return h < (pink ? 0.55 : 0.16) ? (h < 0.2 ? 0xf7a8d0 : 0xe0508a) : h > 0.8 ? 0x6ab04a : undefined; };
// pitched terracotta roof, ridge parallel to the street
function tileRoof(B, w, d, Z, wearK, seed) {
  const n = Math.max(3, Math.min(6, Math.floor(d / 9))), s = (d + 3) / (2 * n);
  for (let k = 0; k < n; k++) B.push(box(-1.5, -1.5 + k * s, Z + k * 2.4, w + 3, d + 3 - 2 * k * s, 2.4, TILE, (f, u, v, b, wx, wy) => { if (f !== 0) return f === 1 ? shade(TILE2, -0.05) : TILE2; const t = hash2((u / 2 | 0) + seed, (v | 0) + k * 9); let c = (v | 0) % 2 ? TILE : shade(TILE, -0.1); if (t < 0.12) c = 0xd9744a; else if (t > 0.9) c = TILE2; if (wearK > 0.5 && vnoise(u / 4 + seed, v / 3 + k) > 0.7) c = mixc(c, 0x6a6a4a, 0.4); return c; }));
}
function roofStuff(R, B, x0, y0, w, d, Z, era) {
  const st = ESTYLE[era];
  if (R() < 0.62 && w > 10 && d > 12) { const tx = x0 + sr(R, 1.5, w - 7), ty = y0 + sr(R, 1.5, d - 8); B.push(box(tx, ty, Z, 5, 5, 1.6, 0x6b6b70), box(tx + 0.5, ty + 0.5, Z + 1.6, 4, 4, 5.4, 0xc9d4dc, (f, u, v) => f !== 0 && (v | 0) % 2 ? 0xb4c0ca : undefined)); }
  if (R() < (era === 0 ? 0.75 : era === 1 ? 0.5 : 0.08)) { const ax = x0 + sr(R, 2, w - 4), ay = y0 + sr(R, 2, d - 4); B.push(box(ax, ay, Z, 0.7, 0.7, 13, 0x5a5a62), box(ax - 3, ay, Z + 9.5, 6.7, 0.7, 0.7, 0x5a5a62), box(ax - 2, ay, Z + 11.5, 4.7, 0.7, 0.7, 0x5a5a62)); }
  if (era === 1 && R() < 0.3) { const ax = x0 + sr(R, 2, w - 5), ay = y0 + sr(R, 2, d - 5); B.push(box(ax, ay, Z, 0.8, 0.8, 4, 0x6a6a72), box(ax - 1.4, ay - 0.6, Z + 4, 3.6, 2, 3, 0xd8dade)); }
  if (era === 3 && R() < 0.4 && d > 20) B.push(box(x0 + 2, y0 + 2, Z, w - 4, Math.min(12, d * 0.3), 1.2, 0x2a3f6a, (f, u, v) => f === 0 ? ((u | 0) % 4 === 0 || (v | 0) % 5 === 0 ? 0xaab4c4 : 0x2a3f6a) : 0x8a909a));
  else if (R() < (era < 2 ? 0.4 : 0.15) && d > 20) { const c = sp(R, [0x9a6a4a, 0x6f9ac0, 0x8a9a8a, 0xb07a52]); B.push(box(x0 + 1.5, y0 + 1.5, Z, w * 0.55, d * 0.35, 6.5, 0xcfc8ba), box(x0 + 0.8, y0 + 0.8, Z + 6.5, w * 0.55 + 1.4, d * 0.35 + 1.4, 1, c, corr(c))); }
  if (R() < 0.55) for (let i = 0, n = si(R, 1, 3); i < n; i++) { const pk = R() < 0.3; B.push(box(x0 + sr(R, 1.5, w - 5), y0 + d - sr(R, 4.5, 7), Z, 3, 3, sr(R, 3, 6), pk ? 0xd0407a : 0x3f8a4a, flowerP(pk))); }
}
// narrow tube house / shophouse. o: {shop, floors, corner, ad, era}
function shophouse(R, w, d, o) {
  const era = o.era || 0, st = ESTYLE[era], S = o.shop ? shopSpec(o.shop, era) : null, seed = R() * 1000;
  let n = Math.max(1, o.floors); const modern = st.modern > 0 && R() < st.modern && !o.corner; if (modern) n += si(R, 2, 4);
  const wall = modern ? sp(R, [0xe9edf0, 0xdfe4e8, 0xd8dde0, 0xf2efe8]) : sp(R, st.walls), trim = modern ? 0xf7f7f4 : R() < 0.5 ? shade(wall, -0.17) : 0xf7f1e2, shut = sp(R, st.shuts), wk = st.wear;
  let kind = S ? S.kind : sp(R, ['gate', 'door', 'gate', 'door']); if (S && kind === 'glass' && era >= 2) kind = 'modern'; if (!S && era >= 2 && R() < 0.5) kind = 'garage';
  const B = [], m = n - 1, glassy = modern || R() < st.glass * 0.5;
  const stain = (c, u, v, H) => { let k = c; const s = vnoise(u / 2.5 + seed, v / 10 + seed); if (s > 0.6) k = shade(k, -(0.03 + (s - 0.6) * 0.3) * (0.4 + wk)); if (wk > 0.15) { if (v > H - 4 && hash2((u | 0) + seed, 7) > 0.55) k = shade(k, -0.09 * wk); const rs = hash2((u | 0) + seed * 3, 5); if (rs > 1 - 0.2 * wk && v > H - 4 - (rs - 0.8) * 90) k = mixc(k, 0x8a4a2a, 0.34 * wk); if (v < 4 && vnoise(u / 3 + seed, 2.5) > 0.48) k = mixc(k, 0x5a7a4a, 0.36 * wk); if (vnoise(u / 4 + seed * 2, v / 4 + seed) > 0.9 - 0.2 * wk) k = mixc(k, 0xa59c8c, 0.5); } return k; };
  const gp = (f, u, v, b) => {
    if (f === 0) return 0x8f887c;
    const front = f === 1 || (o.corner && f === 2), W = f === 1 ? b.w : b.d;
    if (!front) return v < 2 ? shade(wall, -0.22) : stain(wall, u, v, GH);
    if (u < 1.6 || u > W - 1.6 || v > GH - 1.4) return shade(wall, -0.06);
    if (kind === 'open') {
      if (v > GH - 3.4) return (v | 0) % 2 ? 0x8a9098 : 0x767c84;
      EM = 0x705028;
      if (S && S.tv && v > 5 && v < 11 && u % 7 > 1.2 && u % 7 < 6) { EM = 0x9fd0ff; return hash2(u | 0, v | 0) > 0.5 ? 0x8fc1e3 : 0xcfe8ff; }
      if (v < 1) return 0x5a5048;
      if ((v | 0) === 5 || (v | 0) === 10) return 0x6b5238;
      const h = hash2((u * 0.8 | 0) + seed, (v / 5 | 0)); if (h < 0.6 && v % 5 > 1 && v % 5 < 4) return GOODS[(h * 40 | 0) % GOODS.length];
      return 0x3b3140;
    }
    if (kind === 'modern') { if (v > 15.5) return 0x2f3038; if ((u - 1.6) % 9 < 0.8 || v < 1.2) return 0x2f3038; EM = 0x90804a; const a = Math.abs(u - W / 2); if (a < 3 && v < 13) return a < 0.4 ? 0x2f3038 : 0xb8dce8; return v < 7 && hash2(u * 0.9 | 0, seed) < 0.5 ? GOODS[(u + seed | 0) % GOODS.length] : v > 12 ? 0xcfe6ee : 0xa6cede; }
    if (kind === 'glass') {
      const a = Math.abs(u - W / 2);
      if (a < 3.4 && v < 14) { if (a > 2.6 || v > 13) return 0x5a4a3a; EM = 0x80703a; return a < 0.4 ? 0x5a4a3a : 0x9fc8d8; }
      if (v > 4 && v < 14) { if (v > 13.2 || v < 4.8 || (u % 8) < 0.8) return 0x5a4a3a; EM = 0x80703a; return v < 8 && hash2(u * 0.9 | 0, seed) < 0.5 ? GOODS[(u + seed | 0) % GOODS.length] : 0x8fbfd0; }
      return shade(wall, -0.12);
    }
    if (kind === 'garage') { if (v < 15) return (v | 0) % 2 ? 0xc4c8cc : 0xb0b5ba; return stain(wall, u, v, GH); }
    if (kind === 'gate') { if (v < 15) return ((u + v | 0) % 4 === 0 || (u - v + 80 | 0) % 4 === 0) ? 0x8a97a6 : 0x2f2a38; return stain(wall, u, v, GH); }
    if (u > 3 && u < 9 && v < 14) return (u > 3.8 && u < 8.2 && v < 13.2) ? (Math.abs(u - 6) < 0.4 ? 0x5a3f28 : 0x7a5a3a) : 0x4f3a26;
    if (u > W - 11 && u < W - 4 && v > 6 && v < 13) { if ((u | 0) % 2) return 0x55606c; if (hash2(seed, 3) < 0.5) EM = 0xffd98a; return 0x2f3a48; }
    return stain(wall, u, v, GH);
  };
  const up = (f, u, v, b) => {
    if (f === 0) { if (u < 1.3 || v < 1.3 || u > b.w - 1.3 || v > b.d - 1.3) return shade(wall, -0.1); return vnoise(u / 4 + seed, v / 4) > 0.6 ? 0xa8a094 : 0xb4ac9f; }
    const fl = Math.floor(v / FH) + (b.fl0 || 0), vv = v - Math.floor(v / FH) * FH;
    const front = f === 1 || (o.corner && f === 2), W = f === 1 ? b.w : b.d;
    if (modern && front) { if (vv < 1.4 || u < 1.2 || u > W - 1.2) return trim; if ((u - 1.2) % 6 < 0.7) return 0xdfe6ea; const l = hash2(seed + fl * 3.1, (u / 6 | 0) + f); if (l < 0.4) EM = l < 0.08 ? 0x9fd0ff : 0xffe2a0; return vv > 10 ? 0x86b4cc : 0x6f9ebc; }
    if (vv < 1.2) return trim;
    if (front) {
      const nb = Math.max(1, Math.round((W - 2) / 12)), bw = W / nb, bi = Math.floor(u / bw), a = Math.abs(u - bi * bw - bw / 2), ws = hash2(seed * 3 + fl * 5 + f, bi), hw = glassy ? 4.6 : 3;
      if (a < hw + 1 && vv > 3 && vv < 13) {
        if (a > hw || vv < 4 || vv > 12) return glassy ? 0x3a3f48 : trim;
        if (!glassy) { if (ws < 0.38) return a < 0.5 ? shade(shut, -0.3) : (vv | 0) % 2 ? shut : shade(shut, -0.14); if (ws < 0.72 && a > 2) return shut; }
        const l = hash2(seed + fl * 13.7 + f, bi * 7.3 + 2); if (l < 0.55) EM = l < 0.07 ? 0x9fd0ff : 0xffd98a;
        return glassy ? (a < 0.4 ? 0x3a3f48 : vv > 9 ? 0x8fb8cc : 0x6f9cb6) : vv > 9 && a < 2 ? 0x5c7890 : 0x3f566e;
      }
      if (!glassy && a < 4.6 && vv > 2.2 && vv <= 3) return shade(trim, -0.12);
    } else {
      const q = u % 17; if (o.sideWin && q > 7 && q < 11 && vv > 6 && vv < 11) { if (hash2(seed + fl, u / 17 | 0) < 0.4) EM = 0xffd98a; return 0x3f566e; }
      if (o.ad && era < 2 && fl === 1 && textAt(o.ad, u - 3, vv - 5)) return shade(wall, -0.3);
    }
    return stain(wall, u, v, b.h);
  };
  B.push(box(0, 0, 0, w, d, GH, wall, gp));
  const tb = m >= 2 && !modern && R() < 0.4 ? 8 : 0, mf = tb ? m - 1 : m;
  if (mf > 0) B.push(box(0, 0, GH, w, d, mf * FH, wall, up));
  if (tb) { B.push(box(0, 0, GH + mf * FH, w, d - tb, FH, wall, up, { fl0: mf })); if (R() < st.laundry + 0.2) B.push(box(1.5, d - 2.2, GH + mf * FH, w - 3, 0.5, 4.5, 0xf7f4ec, (f, u, v) => f === 1 ? (v > 4 ? 0x5a5a62 : (u % 5 < 3.4 ? GOODS[(u / 5 | 0) % GOODS.length] : -1)) : -1)); }
  for (let k = 0; k < mf; k++) {
    const z = GH + k * FH, r1 = R(), r2 = R(), r3 = R(), r4 = R();
    if (!modern && r1 < st.balc && (k > 0 || !S)) {
      const gl = era >= 2 && r4 < 0.7, rc = gl ? 0xa8cad8 : r4 < 0.5 ? 0x4a4a54 : trim;
      B.push(box(1, d, z, w - 2, 3, 1, trim), box(1, d + 2.4, z + 1, w - 2, 0.6, 4.2, rc, (f, u, v) => f === 1 ? (gl ? (v > 3.6 ? 0xe8eef2 : undefined) : v > 3.3 || (u | 0) % 2 === 0 ? undefined : -1) : undefined));
      if (r2 < 0.6) { const pk = r3 < 0.3; B.push(box(1.5 + r3 * (w - 7), d + 0.4, z + 1, 3.6, 1.8, 3.8, pk ? 0xd0407a : 0x3f8a4a, flowerP(pk))); }
      if (r3 > 1 - st.laundry * 0.7) B.push(box(2, d + 2.9, z + 1.4, w - 4, 0.4, 3.6, 0xf7f4ec, (f, u, v) => f === 1 ? (u % 4 < 2.8 ? GOODS[(u / 4 + k | 0) % GOODS.length] : -1) : -1, { nf: 1 }));
    } else if (r2 < st.ac && k > 0) B.push(box(2 + r3 * (w - 8), d, z + 1.6, 4, 1.6, 2.6, 0xe4e6e8, (f, u, v) => f === 1 && u > 0.6 && u < 3.4 && v > 0.5 && v < 2.1 ? ((u | 0) % 2 ? 0xb8bcc0 : 0xcdd0d4) : undefined, { nf: 1 }));
  }
  if (S) {
    const t = fitSign(S, w - 2), mode = S.neon && st.sign < 3 ? 1 : st.sign;
    let bg = S.bg, fg = S.fg; if (st.sign === 0) { bg = sp(R, [0xf2e4b8, 0xe9d8a0, 0xdfe6e0, 0xf4efe2, bg]); fg = bg === S.bg ? S.fg : sp(R, [0xb8382e, 0x2f4f8a, 0x2a6a4a, 0xb8382e]); } else if (st.sign === 3) { fg = mixc(S.bg === 0xf7f4ec ? S.fg : (S.fg === 0xf7f4ec ? S.bg : S.fg), 0xffffff, 0.35); bg = 0x1c1a24; }
    if (S.neon && st.sign < 3) { bg = S.bg; fg = S.fg; }
    if (t) B.push(box(1, d, GH - 4.5, w - 2, 1.2, 7, bg, signP(t, fg, bg, mode, S.neon)));
    if (o.corner) { const t2 = fitSign(S, d - 2); if (t2) B.push(box(w, 1, GH - 4.5, 1.2, d - 2, 7, bg, signP(t2, fg, bg, mode, S.neon))); }
    if (S.aw && R() < st.awn) { B.push(box(0.5, d + 1.2, GH - 6, w - 1, 4.4, 1, S.aw[0], stripe(S.aw[0], S.aw[1], 2), { nf: 1 })); if (o.corner) B.push(box(w + 1.2, 0.5, GH - 6, 4.4, d - 1, 1, S.aw[0], (f, u, v) => f === 0 ? (((v / 2) | 0) % 2 ? S.aw[0] : S.aw[1]) : undefined, { nf: 1 })); }
  } else if (R() < 0.4 && era < 2) { const c = sp(R, [0x8a9a9a, 0x9a6a4a, 0x6f9ac0, 0x3d6fb5]); B.push(box(0.5, d, GH - 5, w - 1, 4.5, 1, c, R() < 0.5 ? corr(c) : stripe(c, 0xf7f4ec, 2), { nf: 1 })); }
  if (m > 0 && R() < st.flag) B.push(box(w * 0.5 - 3.5, d, GH + 5, 7, 0.5, 5, 0xd9281e, (f, u, v) => f === 1 && Math.abs(u - 3.5) + Math.abs(v - 2.5) * 1.2 < 1.8 ? 0xf7d94a : undefined, { raw: 1, nf: 1 }));
  const Z = GH + m * FH, dT = tb ? d - tb : d, rr2 = R();
  if (!modern && n <= 3 && rr2 < st.roof[0]) tileRoof(B, w, dT, Z, wk, seed);
  else if (!modern && n <= 2 && rr2 < st.roof[0] + st.roof[1]) { const c = sp(R, [0x9a6a4a, 0x8a9a9a, 0xb07a52, 0x7a8a8a]); B.push(box(-1, -1, Z, w + 2, dT + 2, 1.4, c, (f, u, v) => f === 0 ? (vnoise(u / 5 + seed, v / 5) > 0.5 ? mixc(c, 0x8a4a2a, 0.6 * wk + 0.1) : (u | 0) % 2 ? c : shade(c, -0.1)) : shade(c, -0.15))); }
  else {
    roofStuff(R, B, 0, 0, w, dT, Z, era);
    if (R() < st.board && w >= 24) { const c = sp(R, [0xd9281e, 0x1f6ab5, 0xf2c94c, 0x1f8a5a, 0xf7f4ec]), t = sp(R, ['SALE', 'BIA', 'MOBILE', 'CAFE', 'SUA', 'TV']); B.push(box(1.5, dT - 2.4, Z, 0.8, 0.8, 4, 0x5a5a62), box(w - 2.3, dT - 2.4, Z, 0.8, 0.8, 4, 0x5a5a62), box(1, dT - 2.6, Z + 4, w - 2, 1, 10, c, (f, u, v, b) => { if (f !== 1) return shade(c, -0.25); if (era === 3) EM = mixc(c, 0, 0.35); if (textAt(t, u - Math.floor((b.w - textW(t)) / 2), v - 2.5)) { if (era === 3) EM = 0xffffff; return c === 0xf7f4ec || c === 0xf2c94c ? 0x2a2a30 : 0xf7f4ec; } return v > 8.4 ? shade(c, 0.2) : undefined; })); }
  }
  return B;
}
// back-lot house: tin/tile in the old days, taller concrete later
function backHouse(R, w, d, floors, era) {
  era = era || 0; const st = ESTYLE[era], wk = st.wear, wall = sp(R, st.walls), seed = R() * 99, fl = floors + (era >= 2 && R() < 0.5 ? 1 : 0) + (era === 3 && R() < 0.3 ? 1 : 0), H = 14 + (fl - 1) * 13, tin = sp(R, [0x9a6a4a, 0x6f9ac0, 0x8a9a8a, 0xb07a52, 0x7a8a7a]), r = R();
  const p = (f, u, v, b) => { if (f === 0) return 0xb0a89c; const q = u % 13, vv = v % 13; if (q > 4 && q < 9 && vv > 5 && vv < 10 && v < H - 2) { if (hash2(seed + (u / 13 | 0), (v / 13 | 0) + f) < 0.4) EM = 0xffd98a; return (q | 0) === 6 ? 0x6b7a88 : 0x3f566e; } const s = vnoise(u / 3 + seed, v / 8); let k = s > 0.6 ? shade(wall, -0.1) : wall; if (wk > 0.15) { if (hash2((u | 0) + seed, 3) > 1 - 0.22 * wk && v > H - 9) k = mixc(k, 0x8a4a2a, 0.36); if (v < 4 && s > 0.45) k = mixc(k, 0x5a7a4a, 0.34 * wk); if (vnoise(u / 4 + seed, v / 4) > 0.9 - 0.2 * wk) k = mixc(k, 0xa59c8c, 0.5); } return k; };
  const B = [box(0, 0, 0, w, d, H, wall, p)];
  if (fl <= 2 && r < st.roof[0] + 0.1) tileRoof(B, w, d, H, wk, seed);
  else if (fl <= 2 && era < 2) B.push(box(-1, -1, H, w + 2, d + 2, 1.2, tin, (f, u, v) => f === 0 ? (vnoise(u / 5 + seed, v / 5) > 0.55 ? mixc(tin, 0x8a4a2a, 0.3 + 0.3 * wk) : (u | 0) % 2 ? tin : shade(tin, -0.1)) : shade(tin, -0.15)));
  else { B.push(box(0, 0, H, w, 1.2, 2, shade(wall, -0.1)), box(0, d - 1.2, H, w, 1.2, 2, shade(wall, -0.1))); if (R() < 0.6) B.push(box(sr(R, 1, w - 6), sr(R, 2, d - 7), H, 4, 4, 5.5, 0xc9d4dc)); if (era === 3 && R() < 0.4) B.push(box(2, 2, H, w - 4, Math.min(10, d - 4), 1, 0x2a3f6a, (f, u, v) => f === 0 && ((u | 0) % 4 === 0 || (v | 0) % 5 === 0) ? 0xaab4c4 : undefined)); }
  return B;
}
// apartment slab: chung cư cũ (199x-200x), repainted (201x), rebuilt as a modern block (202x)
function chungcu(R, w, d, era) {
  era = era || 0; const st = ESTYLE[era], wk = st.wear, seed = R() * 999, B = [], doorC = [0x4fa3a0, 0x7a5a3a, 0x3d6fb5, 0x8a3a3a];
  const wall = era === 0 ? sp(R, [0xe3d6b0, 0xd9cfae, 0xe6d6a8]) : era === 1 ? sp(R, [0xe9e0c0, 0xd4e0d0]) : era === 2 ? 0xf2e6b8 : 0xf2f0ea, n = era === 3 ? 9 : 4, acc = era === 3 ? sp(R, [0xd9784a, 0x3d8a8a, 0x4a6ab8]) : 0;
  B.push(box(0, 0, 0, w, d, GH, wall, (f, u, v, b) => {
    if (f === 0) return 0x8f887c; if (f === 2) return v < 2 ? shade(wall, -0.2) : wall;
    const bay = Math.floor(u / 14), q = u - bay * 14, h = hash2(bay, seed);
    if (q < 1.2 || v > GH - 1.2) return shade(wall, -0.08);
    if (v > 14.5) { const on = textAt(era < 2 ? ['COM', 'CHE', 'BIA', 'PHO', 'MAY', 'TOC'][(h * 60 | 0) % 6] : ['MART', 'CAFE', 'SPA', 'PHO', 'ATM', 'GYM'][(h * 60 | 0) % 6], q - 2, v - 15), c = era === 3 ? 0x1c1a24 : GOODS[(h * 30 | 0) % 5]; if (era >= 2) EM = on ? 0xffffff : mixc(c, 0, 0.5); return on ? 0xf7f4ec : c; }
    if (era < 2 && h < 0.3) return ((q + v | 0) % 4 === 0 || (q - v + 80 | 0) % 4 === 0) ? 0x8a97a6 : 0x2f2a38;
    EM = 0x705028; if (era >= 2) return q < 2 || v < 1.2 ? 0x2f3038 : v < 7 && hash2(q | 0, bay) < 0.4 ? GOODS[(q + bay | 0) % GOODS.length] : 0xa6cede;
    if ((v | 0) === 5 || (v | 0) === 10) return 0x6b5238; const g = hash2((q | 0) + bay * 9, v / 5 | 0); return g < 0.5 && v % 5 > 1 && v % 5 < 4 ? GOODS[(g * 40 | 0) % GOODS.length] : 0x3b3140;
  }));
  B.push(box(0, 0, GH, w, d, n * FH, wall, (f, u, v, b) => {
    if (f === 0) { if (u < 1.5 || v < 1.5 || u > b.w - 1.5 || v > b.d - 1.5) return shade(wall, -0.1); return vnoise(u / 5, v / 5) > 0.6 ? 0xa8a094 : 0xb4ac9f; }
    const fl = Math.floor(v / FH), vv = v - fl * FH, s = vnoise(u / 3 + seed, v / 9);
    if (era === 3) { if (vv < 1.3) return 0xf7f7f4; const q = u % 14; if (f === 1 && q < 1.4) return acc; if (vv < 5.5 && f === 1) return q > 8 ? acc : 0xa8cad8; const l = hash2((u / 7 | 0) + seed, fl + f); if ((u % 7) < 0.8) return 0xe4e6e8; if (l < 0.42) EM = l < 0.06 ? 0x9fd0ff : 0xffe2a0; return vv > 10 ? 0x8fb8cc : 0x6f9cb6; }
    if (f === 2) { const q = u % 12; if (q > 4 && q < 8 && vv > 6 && vv < 11) { if (hash2(fl, u / 12 | 0) < 0.4) EM = 0xffd98a; return 0x3f566e; } return s > 0.58 ? mixc(shade(wall, -0.1), 0x6a5a4a, 0.2 * wk) : vnoise(u / 4, v / 4 + seed) > 0.9 - 0.2 * wk ? mixc(wall, 0xa59c8c, 0.5) : wall; }
    if (vv < 1.2) return shade(wall, -0.22);
    if (u % 28 < 1.6) return wall;
    if (vv < 6) { const l = hash2((u / 4 | 0) + seed, fl); if (l < 0.3 * (0.4 + wk) && vv > 2.4) return GOODS[(l * 100 | 0) % GOODS.length]; if (era >= 1 && l > 0.93) return 0xe4e6e8; return s > 0.55 ? mixc(shade(wall, -0.12), 0x8a4a2a, hash2(u | 0, fl) > 0.7 ? 0.25 * wk : 0) : shade(wall, 0.04); }
    const q = u % 14;
    if (q > 2 && q < 6 && vv < 14) return doorC[(hash2(u / 14 | 0, fl + seed) * 4) | 0];
    if (q > 8 && q < 12 && vv > 8 && vv < 13) { if (hash2((u / 14 | 0) + 5, fl + seed) < 0.5) EM = 0xffd98a; return 0x5c7890; }
    return 0x4c4658;
  }));
  const Z = GH + n * FH;
  B.push(box(w / 2 - 6, d, 0, 12, 4, Z + 7, era === 3 ? acc : shade(wall, -0.06), (f, u, v) => f === 1 && u > 4 && u < 8 && v % 15 > 4 && v % 15 < 12 && v > 20 ? 0x3f566e : f === 1 && v < 15 && u > 3 && u < 9 ? 0x2f2a38 : undefined));
  for (let i = 0; i < 5; i++) roofStuff(R, B, 4 + i * (w - 8) / 5, 2, (w - 8) / 5, d - 4, Z, Math.min(era, 2));
  return B;
}
// colonial villa / school block
function villa(R, w, d, school) {
  const wall = 0xecc866, trim = 0xfbf2d4, shut = 0x4f8a6f, seed = R() * 99, B = [], H = GH + FH;
  B.push(box(0, 0, 0, w, d, H, wall, (f, u, v, b) => {
    if (f === 0) return 0xa89f90; const W = f === 1 ? b.w : b.d;
    if (v > H - 1.6 || (v > GH - 1 && v < GH + 0.6) || v < 1.4) return trim;
    const bay = Math.floor(u / 11), a = Math.abs(u - bay * 11 - 5.5), vv = v > GH ? v - GH : v;
    if (f === 1 && v < GH && Math.abs(u - W / 2) < 3.2 && v < 15) return Math.abs(u - W / 2) > 2.4 ? trim : 0x6b4a36;
    if (a < 3 && vv > 4 && vv < 13.5) { if (a > 2.2) return shut; if (hash2(seed + bay, (v > GH) + f * 3) < 0.45) EM = 0xffd98a; return a < 0.4 ? trim : 0x4a6680; }
    return vnoise(u / 4 + seed, v / 9) > 0.62 ? shade(wall, -0.07) : wall;
  }));
  for (let k = 0; k < 4; k++) B.push(box(-1.5 + k * 3, -1.5 + k * 3, H + k * 3, w + 3 - k * 6, d + 3 - k * 6, 3, TILE, (f, u, v) => f === 0 ? ((u + v | 0) % 2 ? TILE : TILE2) : TILE2));
  if (school) B.push(box(w / 2 - 14, d, GH - 3, 28, 1.2, 7, 0x3d6fb5, signP('TRUONG', 0xf7f4ec, 0x3d6fb5, 1)));
  return B;
}
