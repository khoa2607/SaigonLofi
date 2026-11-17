'use strict';
// ===== Sài Gòn Lofi — the seven landmarks, drawn from their real architecture (front faces +y at y = d unless mirrored) =====
const wear = (c, u, v, seed) => { let k = vnoise(u / 4 + seed, v / 9) > 0.62 ? shade(c, -0.08) : c; const r = hash2((u | 0) + seed * 3, 5); if (r > 0.88 && vnoise(u / 2, v / 6 + seed) > 0.45) k = mixc(k, 0x6a5a4a, 0.22); if (v < 3 && vnoise(u / 3 + seed, 2) > 0.5) k = mixc(k, 0x5a7a4a, 0.28); return k; };
// arch test: depth inside an arch opening centred at cx (0 = outside). pt = pointed (Gothic) else round
function archD(u, v, cx, hw, v0, h, pt) {
  const a = Math.abs(u - cx); if (a >= hw || v < v0 || v > v0 + h) return 0;
  const sp = v0 + h - (pt ? hw * 1.732 : hw); let top = 1e9;
  if (v > sp) top = pt ? sp + Math.sqrt(Math.max(0, 4 * hw * hw - (a + hw) * (a + hw))) : sp + Math.sqrt(hw * hw - a * a);
  if (v > top) return 0; return Math.min(hw - a, top - v, v - v0 + 1);
}
// pyramid spire / hipped roof built from stepped layers
function spire(B, cx, cy, z, base, h, col, steps, edge) { for (let k = 0; k < steps; k++) { const s = base * (1 - k / steps); B.push(box(cx - s / 2, cy - s / 2, z + k * h / steps, s, s, h / steps + 0.2, col, (f, u, v) => f !== 0 ? ((u | 0) % 3 === 0 ? shade(col, -0.12) : (edge && k % 2 ? shade(col, 0.1) : undefined)) : shade(col, 0.1))); } }
const stepRoof = (B, x, y, z, w, d, n, col, alongX) => { for (let k = 0; k < n; k++) B.push(alongX ? box(x, y + k * d / (2 * n), z + k * 3, w, d - k * d / n, 3, col, (f, u, v) => f === 0 ? ((v | 0) % 2 ? col : shade(col, -0.12)) : shade(col, -0.1)) : box(x + k * w / (2 * n), y, z + k * 3, w - k * w / n, d, 3, col, (f, u, v) => f === 0 ? ((u | 0) % 2 ? col : shade(col, -0.12)) : shade(col, -0.1))); };
const clockFace = (u, v, cx, cy, r) => { const q = Math.hypot(u - cx, v - cy); if (q >= r) return 0; if (q > r - 1.1) return 0x6b5238; EM = 0xfff2c0; return (Math.abs(u - cx) < 0.6 && v > cy && v < cy + r - 2) || (Math.abs(v - cy) < 0.6 && u > cx && u < cx + r - 2.4) ? 0x2a2140 : 0xfbf6e4; };
const WHITE = 0xf6f2e8, TRIM = 0xfbf4e0;

// ---------- Nhà thờ Đức Bà: red brick, two tall slender towers with iron spires, rose window, three portals ----------
function ducba(w, d) {
  const brick = 0xb9543c, trim = 0xe6d6bc, zinc = 0x9ea6b0, roof = 0xa24a38, B = [], CX = 18;
  const bp = (f, u, v) => { if (f === 0) return 0x8a6a5a; const row = v | 0, j = (row & 1) ? ((u + 2) | 0) % 4 === 0 : (u | 0) % 4 === 0; let k = j ? shade(brick, -0.15) : brick; if (hash2(u | 0, row) > 0.93) k = shade(k, 0.1); return wear(k, u, v, 7); };
  B.push(box(8, 0, 0, w - 16, d - 14, 32, brick, (f, u, v, b) => { if (f === 0) return 0x8a6a5a; if (v < 2) return shade(brick, -0.2); if (u % 12 < 1.4) return shade(brick, 0.12); const q = archD(u % 12 + 0, v, 7, 2.4, 9, 18, true); if (q) return q < 1.1 ? trim : (EM = 0x405070, hash2(u / 12 | 0, 3) < 0.5 ? 0x5a78b8 : 0x7a5ab0); return bp(f, u, v); }));
  stepRoof(B, 7, -1, 32, w - 14, d - 13, 6, roof, false);
  B.push(box(22, d - 18, 0, w - 44, 18, 52, brick, (f, u, v, b) => {
    if (f === 0) return trim; if (f === 2) return bp(f, u, v);
    if (v > 50 || (v > 44 && v < 45.4)) return trim;
    const r = Math.hypot(u - CX, v - 34);
    if (r < 8.6) { if (r > 7.2) return trim; if (r < 2.3) return trim; const ang = Math.atan2(v - 34, u - CX), sec = (ang + Math.PI) / (Math.PI / 6), fr = sec - Math.floor(sec); if (fr < 0.14) return trim; EM = 0x504030; return [0x4a6ab8, 0xc94f6a, 0xf2c94c, 0x4a6ab8, 0x58a870, 0xc94f6a][Math.floor(sec) % 6]; }
    for (const [cx, hw, h] of [[CX, 5.4, 24], [5.6, 3.4, 16], [30.4, 3.4, 16]]) { const q = archD(u, v, cx, hw, 0, h, true); if (q) return q < 1.3 ? trim : (EM = 0x604020, 0x35262c); }
    for (const cx of [5.6, 11, 18, 25, 30.4]) if (archD(u, v, cx, 1.5, 27, 5, true)) return 0x74383a;
    if (v > 24.6 && v < 26) return trim; if (u < 1.2 || u > 34.8) return shade(brick, 0.12); return bp(f, u, v);
  }));
  B.push(box(26, d - 16, 52, 28, 14, 5, brick, bp), box(30, d - 14, 57, 20, 10, 5, brick, bp), box(34, d - 12, 62, 12, 8, 4, brick, bp), box(39.2, d - 9, 66, 1.6, 1.6, 7, trim), box(37.4, d - 9, 69.4, 5.2, 1.6, 1.4, trim));
  for (const tx of [0, w - 22]) {
    B.push(box(tx, d - 22, 0, 22, 22, 64, brick, (f, u, v, b) => {
      if (f === 0) return trim; const W = f === 1 ? b.w : b.d, cx = W / 2;
      if (v > 62 || (v > 26 && v < 27.6) || (v > 46 && v < 47.6)) return trim; if (u < 1.8 || u > W - 1.8) return v > 46 ? bp(f, u, v) : shade(trim, -0.06);
      if (v < 26 && archD(u, v, cx, 1.3, 8, 13, true)) return 0x35262c;
      if (v > 28 && v < 46) { const q = archD(u, v, cx, 2.8, 29, 16, true); if (q) return q < 1.2 ? trim : (EM = 0x405070, 0x5a78b8); }
      if (v > 48) for (const dx of [-4.4, 4.4]) { const q = archD(u, v, cx + dx, 3, 49, 13, true); if (q) return q < 1.1 ? trim : (EM = 0x40301a, (v | 0) % 2 ? 0x2c2024 : 0x3e3036); }
      return bp(f, u, v);
    }));
    B.push(box(tx - 0.8, d - 22.8, 64, 23.6, 23.6, 2, trim));
    for (const [px, py] of [[tx - 0.4, d - 22.4], [tx + 18.4, d - 22.4], [tx - 0.4, d - 1.2], [tx + 18.4, d - 1.2]]) B.push(box(px, py, 64, 3.2, 3.2, 7, brick, bp), box(px + 0.8, py + 0.8, 71, 1.6, 1.6, 3, zinc));
    spire(B, tx + 11, d - 11, 66, 17, 44, zinc, 14, true);
    B.push(box(tx + 10.6, d - 11.4, 110, 0.8, 0.8, 8, trim), box(tx + 8.8, d - 11.4, 114, 4.4, 0.8, 0.8, trim));
  }
  return B;
}

// ---------- Chợ Bến Thành: long cream hall, big central entrance and the tiered clock tower, corner turrets ----------
function market(w, d, era) {
  const cream = 0xefe1b8, trim = 0xfbf4e0, tile = TILE, B = [], wk = ESTYLE[era || 0].wear, hd = d - 18;
  const arch = (f, u, v, b) => {
    if (f === 0) return 0xa89f90; if (v > b.h - 2.2) return trim; if (v < 1.5) return shade(cream, -0.2);
    const bay = Math.floor(u / 16), q = archD(u, v, bay * 16 + 8, 5, 0, 15.5, false);
    if (q) { if (q < 1.2) return trim; EM = 0x6a4a24; return v < 6 && hash2(u * 0.7 | 0, bay + f) < 0.6 ? GOODS[(u + bay | 0) % GOODS.length] : 0x3b3140; }
    if (v > 17 && v < 21.5) return (u | 0) % 2 ? shade(cream, -0.18) : shade(cream, -0.06);
    return vnoise(u / 4, v / 9) > 0.63 ? mixc(shade(cream, -0.07), 0x8a6a4a, 0.15 * wk) : cream;
  };
  B.push(box(0, 0, 0, w, hd, 24, cream, arch));
  for (let k = 0; k < 4; k++) B.push(box(-1 + k * 1.5, k * 9, 24 + k * 3, w + 2 - k * 3, hd - k * 18, 3, tile, (f, u, v) => f === 0 ? ((v | 0) % 2 ? tile : shade(tile, -0.13)) : shade(tile, -0.1)));
  B.push(box(14, 40, 36, w - 28, 12, 5, cream, (f, u, v) => f !== 0 ? ((u | 0) % 2 ? shade(cream, -0.2) : shade(cream, -0.06)) : tile));
  const gx = w / 2 - 23;
  B.push(box(gx, d - 24, 0, 46, 24, 38, cream, (f, u, v, b) => {
    if (f === 0) return trim; const W = f === 1 ? b.w : b.d;
    if (v > 36 || (v > 31 && v < 32.2)) return trim; if (f === 1) {
      const q = archD(u, v, 23, 9.6, 0, 27, false); if (q) { if (q < 1.6) return trim; EM = 0x80602a; return (u | 0) % 5 === 0 ? 0x5a4636 : 0x35282c; }
      if (v > 28 && v < 31.6 && u > 3 && u < 43) { const t = 'BEN THANH', u0 = Math.floor((46 - textW(t)) / 2); if (textAt(t, u - u0, v - 28.4)) { EM = 0xfff0c0; return 0xf7e6b8; } return 0x8a2f2a; }
      if (u < 3 || u > 43) return shade(trim, -0.05); if (v < 5 && (v | 0) % 2) return shade(cream, -0.12);
      for (const cx of [8, 38]) { const a2 = archD(u, v, cx, 2.6, 8, 15, false); if (a2) return a2 < 1.1 ? trim : (EM = 0x604020, 0x3b3140); }
    }
    return vnoise(u / 4, v / 9) > 0.63 ? shade(cream, -0.07) : cream;
  }));
  for (const tx of [gx - 16, gx + 46 + 2]) { B.push(box(tx, d - 22, 0, 14, 14, 32, cream, (f, u, v, b) => { if (f === 0) return trim; const W = f === 1 ? b.w : b.d; if (v > 30 || v < 1.4) return trim; const q = archD(u, v, W / 2, 3, 6, 15, false); if (q) return q < 1.1 ? trim : (EM = 0x604020, 0x3b3140); if (u < 1.4 || u > W - 1.4) return trim; return cream; })); for (let k = 0; k < 4; k++) B.push(box(tx - 1.2 + k * 1.8, d - 23.2 + k * 1.8, 32 + k * 2.6, 16.4 - k * 3.6, 16.4 - k * 3.6, 2.6, tile, (f, u, v) => f === 0 ? ((u | 0) % 2 ? tile : shade(tile, -0.13)) : shade(tile, -0.12))); B.push(box(tx + 6.6, d - 15.4, 42.4, 0.8, 0.8, 5, MTL)); }
  const cx0 = w / 2 - 11;
  B.push(box(cx0, d - 22, 38, 22, 18, 18, cream, (f, u, v, b) => { if (f === 0) return trim; const W = f === 1 ? b.w : b.d; if (v < 1.2 || v > 16.6) return trim; if (u < 1.8 || u > W - 1.8) return shade(trim, -0.05); const q = archD(u, v, W / 2, 3, 4, 10, false); if (q) return q < 1.1 ? trim : (EM = 0x604020, 0x4a3a3a); return cream; }));
  B.push(box(cx0 + 1, d - 21, 56, 20, 16, 22, cream, (f, u, v, b) => { if (f === 0) return trim; const W = f === 1 ? b.w : b.d; if (v < 1.2 || v > 20.6) return trim; if (u < 1.6 || u > W - 1.6) return shade(trim, -0.06); const c = clockFace(u, v, W / 2, 11, 7.2 * (W / 20 > 0.9 ? 1 : 0.9)); if (c) return c; return cream; }));
  B.push(box(cx0 - 1, d - 23, 78, 24, 20, 2.6, trim));
  for (let k = 0; k < 7; k++) B.push(box(cx0 - 0.4 + k * 1.7, d - 22.4 + k * 1.5, 80.6 + k * 2.6, 22.8 - k * 3.4, 18.8 - k * 3, 2.6, tile, (f, u, v) => f === 0 ? ((u | 0) % 2 ? tile : shade(tile, -0.13)) : shade(tile, -0.12)));
  B.push(box(w / 2 - 0.5, d - 13.5, 98.8, 1, 1, 9, 0x8a8f98), box(w / 2 - 1.6, d - 13.5, 104, 3.2, 1, 1, 0xd9281e));
  return B;
}

// ---------- Bưu điện Trung tâm: symmetrical yellow facade, tall arched windows, central arched hall with clock, green roof ----------
function buudien(w, d) {
  const wall = 0xe8c05a, trim = 0xfbf3d8, shut = 0x4f8a6f, B = [], seed = 3, H = 38;
  const wp = (f, u, v, b) => {
    if (f === 0) return 0xa89f90; if (v > H - 2.4 || v < 1.4 || (v > 24 && v < 25.4)) return trim;
    const bay = Math.floor(u / 12);
    if (f === 1) { const q = archD(u, v, bay * 12 + 6, 3.5, 3, 21, false); if (q) { if (q < 1.2) return trim; if (v > 19) { EM = 0xffd98a; return 0x3a5470; } return (u | 0) % 2 === 0 || Math.abs(u - bay * 12 - 6) < 0.4 ? shade(shut, -0.25) : shut; } for (const cx of [bay * 12 + 6]) { const q2 = archD(u, v, cx, 2.2, 27, 7, false); if (q2) return q2 < 1 ? trim : (hash2(bay, 8) < 0.4 ? (EM = 0xffd98a, 0x3a5470) : shut); } }
    else { const q = (u % 12) > 4 && (u % 12) < 8 && v > 5 && v < 22; if (q) { if (hash2(u / 12 | 0, 9) < 0.35) EM = 0xffd98a; return 0x3a5470; } }
    return wear(wall, u, v, seed);
  };
  B.push(box(0, 0, 0, w, d, H, wall, wp));
  stepRoof(B, -1, -1, H, w + 2, d + 2, 4, 0x5f8f78, true);
  for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const x = w / 2 + sd * (30 + i * 12) - 3; B.push(box(x, d - 12, H + 2, 6, 6, 6, wall, (f, u, v) => f === 1 && u > 1.5 && u < 4.5 && v > 1.5 && v < 4.5 ? 0x3a5470 : undefined), box(x - 0.8, d - 12.8, H + 8, 7.6, 7.6, 2, 0x5f8f78)); }
  const px = w / 2 - 18;
  B.push(box(px, d - 12, 0, 36, 12, 54, wall, (f, u, v, b) => {
    if (f === 0) return trim; if (f === 2) return wear(wall, u, v, seed); if (v > 52 || v < 1.4 || (v > 30 && v < 31.4)) return trim;
    const q = archD(u, v, 18, 10, 0, 29, false); if (q) { if (q < 1.8) return trim; EM = 0x80602a; return v > 20 ? 0x4f8a8a : (u | 0) % 4 === 0 || Math.abs(u - 18) < 0.5 ? 0x3a2a2a : 0x6f8a78; }
    if (v > 32 && v < 37.6 && u > 3 && u < 33) { const t = 'BUU DIEN', u0 = Math.floor((36 - textW(t)) / 2); if (textAt(t, u - u0, v - 33)) { EM = 0xfff0c0; return 0xf7e6b8; } return 0x2f6a4a; }
    const c = clockFace(u, v, 18, 44.4, 5.6); if (c) return c; if (u < 2.4 || u > 33.6) return shade(trim, -0.05);
    return wear(wall, u, v, seed);
  }));
  B.push(box(px - 1, d - 4, 54, 38, 4, 15, trim, (f, u, v) => { if (f === 0) return -1; const t = 15 - Math.abs(u - 19) * 0.78; if (v > t) return -1; if (f === 1 && Math.hypot(u - 19, v - 6) < 2) return 0xd9281e; return v > t - 1.2 ? shade(trim, -0.12) : trim; }, { raw: 1 }));
  for (const x of [0, w - 14]) { B.push(box(x, d - 8, 0, 14, 8, 46, wall, (f, u, v, b) => { if (f === 0) return trim; if (v > 44 || v < 1.4) return trim; const W = f === 1 ? b.w : b.d, q = archD(u, v, W / 2, 3.4, 4, 22, false); if (q) return q < 1.2 ? trim : (hash2(x, 4) < 0.5 ? (EM = 0xffd98a, 0x3a5470) : shut); return wear(wall, u, v, seed); })); for (let k = 0; k < 4; k++) B.push(box(x - 0.6 + k * 1.8, d - 8.6 + k * 1.6, 46 + k * 2.6, 15.2 - k * 3.6, 9.2 - k * 2.4, 2.6, 0x5f8f78)); }
  return B;
}

// ---------- UBND (Hôtel de Ville): ornate cream block, mansard pavilions, slender clock tower with domed cap ----------
function ubnd(w, d) {
  const wall = 0xf3e6bc, trim = 0xfffaf0, slate = 0x6c6a78, red = 0xb5553a, B = [], H = 30;
  const p = (f, u, v, b) => {
    if (f === 0) return 0xa89f90; const W = f === 1 ? b.w : b.d;
    if (v > H - 2 || v < 1.4 || (v > 14.5 && v < 16.4)) return trim;
    const bay = Math.floor(u / 12), cx = bay * 12 + 6;
    if (v < 15) { const q = archD(u, v, cx, 3.2, 2, 12, false); if (q) return q < 1.1 ? trim : (EM = 0x604020, 0x3a3a48); return (v | 0) % 3 === 0 ? shade(wall, -0.07) : wall; }
    const a = Math.abs(u - cx), q = a < 2.6 && v > 17.5 && v < 27;
    if (q) { if (a > 1.8 || v > 26 || v < 18.6) return trim; if (hash2(bay, f + 2) < 0.45) EM = 0xffd98a; return 0x4a6680; }
    if (a < 3.4 && v >= 27 && v < 27 + (3.4 - a)) return trim; if (a > 4.4 && a < 5.4) return shade(trim, -0.04);
    return wear(wall, u, v, 9);
  };
  B.push(box(0, 0, 0, w, d, H, wall, p));
  stepRoof(B, -1, -1, H, w + 2, d + 2, 3, 0x7d7a8c, true);
  for (let i = 0; i < 6; i++) B.push(box(10 + i * 14.5, d - 7, H + 2, 5, 5, 5.4, slate, (f, u, v) => f === 1 && u > 1.2 && u < 3.8 && v > 1.2 && v < 4 ? 0xe8d8b0 : undefined), box(9.4 + i * 14.5, d - 7.6, H + 7.4, 6.2, 6.2, 1.6, red));
  for (const x of [0, w - 22]) {
    B.push(box(x, d - 10, 0, 22, 10, 40, wall, (f, u, v, b) => { if (f === 0) return trim; const W = f === 1 ? b.w : b.d; if (v > 38 || v < 1.4 || (v > 14.5 && v < 16.4)) return trim; if (u % 7 < 1.5 && v > 16 && v < 36) return trim; if (v < 15) { const q = archD(u, v, 4 + Math.floor(u / 7) * 7 + 0, 2.4, 2, 12, false); if (q) return q < 1 ? trim : (EM = 0x604020, 0x3a3a48); } else { const q = (u % 7) > 2 && (u % 7) < 5.4 && v > 19 && v < 34; if (q) { if (hash2(x, u / 7 | 0) < 0.4) EM = 0xffd98a; return v > 31 ? trim : 0x4a6680; } } return wear(wall, u, v, 9); }));
    for (let k = 0; k < 5; k++) B.push(box(x - 0.8 + k * 2, d - 10.8 + k * 1.6, 40 + k * 3.2, 23.6 - k * 4, 11.6 - k * 3, 3.2, slate, (f, u, v) => f === 1 && k === 1 && (u | 0) % 5 === 2 ? shade(slate, 0.3) : undefined));
    B.push(box(x + 10.6, d - 5.4, 56, 0.8, 0.8, 6, MTL));
  }
  const cx = w / 2 - 8;
  B.push(box(cx - 1, d - 22, H, 18, 14, 14, wall, (f, u, v, b) => { if (f === 0) return trim; if (v < 1.2 || v > 12.4) return trim; const W = f === 1 ? b.w : b.d, q = archD(u, v, W / 2, 3, 3, 9, false); if (q) return q < 1 ? trim : (EM = 0x604020, 0x3a3a48); return wear(wall, u, v, 9); }));
  B.push(box(cx + 1, d - 20, 44, 14, 10, 28, wall, (f, u, v, b) => { if (f === 0) return trim; const W = f === 1 ? b.w : b.d; if (v < 1.2 || v > 26.4 || (v > 12 && v < 13.4)) return trim; if (u < 1.4 || u > W - 1.4) return shade(trim, -0.05); const c = clockFace(u, v, W / 2, 7, W / 2 - 1.8); if (c) return c; if (v > 15 && v < 24) { const q = archD(u, v, W / 2, 2.4, 15, 9, false); if (q) return q < 1 ? trim : (EM = 0x604020, 0x2c2436); } return wear(wall, u, v, 9); }));
  B.push(box(cx, d - 21, 72, 16, 12, 2.4, trim));
  for (let k = 0; k < 7; k++) B.push(box(cx + 0.6 + k * 0.95, d - 20.4 + k * 0.7, 74.4 + k * 2.6, 14.8 - k * 1.9, 10.8 - k * 1.4, 2.6, slate, (f, u, v) => f === 0 ? shade(slate, 0.1) : (u | 0) % 3 === 0 ? shade(slate, -0.1) : undefined));
  B.push(box(cx + 7.6, d - 15.4, 92.6, 0.8, 0.8, 9, MTL), box(cx + 8.4, d - 15.3, 98, 7, 0.6, 4.6, 0xd9281e, (f, u, v) => f === 1 && Math.abs(u - 3.5) + Math.abs(v - 2.3) * 1.2 < 1.5 ? 0xf7d94a : undefined, { raw: 1 }));
  return B;
}

// ---------- Dinh Độc Lập: long white horizontal palace, bamboo-slat screen, pierced central pavilion, flag ----------
function dinh(w, d) {
  const white = 0xf2efe6, B = [], dark = 0x4a5662;
  const slat = (c, pierced) => (f, u, v, b, wx, wy) => {
    if (f === 0) return c; if (v > b.h - 1.8) return c;
    if (pierced && Math.abs((u % 6) - 3) + Math.abs((v % 6) - 3) < 2.1) { EM = 0x60482a; return dark; }
    const s = u % 3; if (s < 2) return (v | 0) % 8 === 0 ? shade(c, -0.18) : s < 0.9 ? c : shade(c, -0.05);
    if (hash2(u / 3 | 0, f + 2) < 0.4) EM = 0xffd98a; return dark;
  };
  B.push(box(0, 0, 0, w, d, 5, 0xd6d0c4, (f, u, v) => f === 0 ? ((u + v | 0) % 9 === 0 ? 0xc8c2b4 : 0xd6d0c4) : undefined));
  B.push(box(8, 6, 5, w - 16, d - 12, 20, white, (f, u, v, b) => {
    if (f === 0) return white; const W = f === 1 ? b.w : b.d; if (v > 18) return white; if (f === 1) { const ce = Math.abs(u - W / 2); if (ce < 10) { EM = 0x80602a; return ce < 0.5 ? 0x2a2a30 : v < 14 ? 0x3a4654 : white; } if (u % 12 < 2.4) return white; }
    if (v > 3 && v < 16) { EM = 0x60482a; return (u % 6) < 0.8 ? white : dark; } return wear(white, u, v, 5);
  }));
  B.push(box(18, 12, 25, w - 36, d - 24, 16, white, slat(white, false)));
  for (const x of [0, w - 24]) B.push(box(x, 10, 5, 24, d - 20, 26, white, slat(white, false)));
  B.push(box(10, 6, 41, w - 20, d - 12, 2.6, white, (f, u, v) => f === 0 ? white : shade(white, f === 1 ? -0.04 : -0.14)));
  B.push(box(w / 2 - 26, d / 2 - 12, 43.6, 52, 24, 10, white, slat(white, true)), box(w / 2 - 28, d / 2 - 14, 53.6, 56, 28, 1.8, white));
  B.push(box(w / 2 - 0.4, d / 2 - 0.4, 55.4, 0.8, 0.8, 18, 0x9aa3ad), box(w / 2 + 0.4, d / 2 - 0.3, 66, 11, 0.6, 7, 0xd9281e, (f, u, v) => f === 1 && Math.abs(u - 5.5) + Math.abs(v - 3.5) * 1.2 < 2.3 ? 0xf7d94a : undefined, { raw: 1 }));
  B.push(box(w / 2 - 34, d - 14, 20, 68, 14, 2.2, white, (f, u, v) => f === 0 ? white : shade(white, -0.1)));
  for (let i = 0; i < 7; i++) B.push(box(w / 2 - 32 + i * 10.6, d - 12, 5, 2, 2, 15, white));
  B.push(box(w / 2 - 38, d - 4, 0, 76, 4, 6, 0xd6d0c4, (f, u, v) => f === 0 ? ((u | 0) % 3 === 0 ? 0xc8c2b4 : 0xd6d0c4) : undefined, { nf: 1 }));
  return B;
}

// ---------- Nhà hát Thành phố: central triple-arch loggia, grand arch, pediment with sculptures, copper dome behind ----------
function nhahat(w, d) {
  const cream = 0xf2ecdc, trim = 0xfffaf0, green = 0x6aa890, B = [], seed = 4;
  const wing = (f, u, v, b) => {
    if (f === 0) return 0xb0a89a; if (v > 30 || v < 1.4 || (v > 13 && v < 14.6)) return trim;
    if (v < 13) return (v | 0) % 3 === 0 ? shade(cream, -0.1) : cream;
    const bay = Math.floor(u / 12), q = archD(u, v, bay * 12 + 6, 3, 16, 13, false); if (q) return q < 1.1 ? trim : (hash2(bay, f + 6) < 0.45 ? (EM = 0xffd98a, 0x3a5470) : 0x34465c);
    if (u % 12 < 1.4 || u % 12 > 10.6) return shade(trim, -0.04); return wear(cream, u, v, seed);
  };
  B.push(box(0, 0, 0, w, d, 32, cream, wing));
  stepRoof(B, -1, -1, 32, w + 2, d + 2, 3, 0x8a9f94, true);
  B.push(box(w / 2 - 22, 4, 32, 44, d - 30, 8, cream, (f, u, v, b) => f !== 0 && u % 6 > 1.5 && v > 2 && v < 6 ? 0x34465c : f === 0 ? trim : cream));
  for (let k = 0; k < 7; k++) B.push(box(w / 2 - 17 + k * 2.6, 12 + k * 2.6, 40 + k * 2.6, 34 - k * 5.2, d - 44 - k * 5.2, 2.6, green, (f, u, v) => f === 0 ? ((u | 0) % 2 ? green : shade(green, -0.12)) : shade(green, -0.12)));
  B.push(box(w / 2 - 0.5, d / 2 - 14, 58.6, 1, 1, 8, 0xd9b84a));
  const px = w / 2 - 22;
  B.push(box(px, d - 20, 0, 44, 20, 44, cream, (f, u, v, b) => {
    if (f === 0) return trim; if (f === 2) return wing(f, u, v, b); if (v > 42 || v < 1.4 || (v > 19 && v < 21)) return trim;
    if (v < 19) { for (const cx of [8, 22, 36]) { const q = archD(u, v, cx, 5.4, 0, 17, false); if (q) return q < 1.2 ? trim : (EM = 0x80602a, 0x3b3140); } return u % 14 < 2 ? trim : (v | 0) % 3 === 0 ? shade(cream, -0.1) : cream; }
    const q = archD(u, v, 22, 9, 22, 19, false); if (q) { if (q < 1.5) return trim; EM = 0xffd0a0; return v > 34 ? 0x3a4a6a : (u | 0) % 3 === 0 ? 0x4a5a7a : 0x6a5a68; }
    if (u < 4.4 || (u > 39.6) || (u > 8.4 && u < 10.2) || (u > 33.8 && u < 35.6)) return v > 39 ? trim : shade(trim, -0.05); return wear(cream, u, v, seed);
  }));
  B.push(box(px, d - 6, 44, 44, 6, 17, trim, (f, u, v) => { if (f === 0) return -1; const t = 4 + 11 * Math.sqrt(Math.max(0, 1 - ((u - 22) / 22) * ((u - 22) / 22))); if (v > t) return -1; const r = Math.hypot((u - 22) / 1.9, v - 3); if (f === 1 && v < t - 2 && r < 6.4) return r < 5.2 ? 0xe6dcc8 : 0xcfc6b0; return v > t - 1.4 ? shade(trim, -0.1) : trim; }, { raw: 1 }));
  for (const sx of [px + 1, px + 39]) B.push(box(sx, d - 16, 44, 4, 4, 5, 0xdad4c4), box(sx + 1, d - 15, 49, 2, 2, 5, 0xdad4c4));
  B.push(box(w / 2 - 2.5, d - 14, 58, 5, 4, 3, 0xdad4c4), box(w / 2 - 1, d - 13, 61, 2, 2, 6, 0xdad4c4), box(w / 2 - 3, d - 13, 65, 6, 1, 1, 0xdad4c4));
  B.push(box(w / 2 - 26, d, 0, 52, 4, 1.6, 0xd8d2c4, null, { nf: 1 }), box(w / 2 - 22, d + 2, 0, 44, 2, 3.2, 0xd8d2c4, null, { nf: 1 }));
  return B;
}

// ---------- Nhà thờ Tân Định: pink Gothic church, tall central bell tower with spire, flanking turrets, lancet windows ----------
function church(w, d) {
  const pink = 0xee9aa8, trim = 0xfdf2f0, spc = 0xdcb4bc, roof = 0xb4606c, B = [];
  const pp = (f, u, v) => { if (f === 0) return 0xc98a98; let k = vnoise(u / 4, v / 8) > 0.68 ? shade(pink, -0.06) : pink; if (v < 2) k = shade(k, -0.15); return k; };
  B.push(box(10, 0, 0, 60, d - 16, 26, pink, (f, u, v, b) => { if (f === 0) return 0xc98a98; if (u % 12 < 1.4) return trim; if (v > 24.4) return trim; const q = archD(u, v, (u / 12 | 0) * 12 + 7, 2.4, 6, 17, true); if (q) return q < 1.1 ? trim : (EM = 0x405070, 0x6a88c8); return pp(f, u, v); }));
  stepRoof(B, 9, -1, 26, 62, d - 15, 5, roof, false);
  const tp = (f, u, v, b) => { if (f === 0) return trim; const W = f === 1 ? b.w : b.d, cx = W / 2; if (v > 54.4 || (v > 28 && v < 29.4)) return trim; if (u < 2 || u > W - 2) return v < 54 ? shade(trim, -0.04) : trim; if (f === 1) { for (const [c2, hw, h] of [[cx, 5, 22], [cx - 9, 2.8, 14], [cx + 9, 2.8, 14]]) { const q = archD(u, v, c2, hw, 0, h, true); if (q) return q < 1.3 ? trim : (EM = 0x604020, 0x4a2c34); } const q = archD(u, v, cx, 4.6, 31, 22, true); if (q) { if (q < 1.3) return trim; EM = 0x504060; return Math.abs(u - cx) < 0.5 || (v | 0) === 38 ? trim : [0x4a6ab8, 0xc94f6a, 0x6a88c8][((u + v) / 4 | 0) % 3]; } } else { const q = archD(u, v, cx, 2.4, 6, 18, true); if (q) return q < 1.1 ? trim : 0x3a2a34; const q2 = archD(u, v, cx, 2.4, 33, 17, true); if (q2) return q2 < 1.1 ? trim : (EM = 0x405070, 0x6a88c8); } return pp(f, u, v); };
  B.push(box(26, d - 28, 0, 28, 28, 56, pink, tp));
  B.push(box(28, d - 26, 56, 24, 24, 16, pink, (f, u, v, b) => { if (f === 0) return trim; const W = f === 1 ? b.w : b.d; if (v < 1.2 || v > 14.6) return trim; if (u < 1.6 || u > W - 1.6) return shade(trim, -0.04); for (const dx of [-5, 5]) { const q = archD(u, v, W / 2 + dx, 2.6, 2.5, 12, true); if (q) return q < 1.1 ? trim : (EM = 0x40301a, 0x34262c); } return pp(f, u, v); }));
  B.push(box(27, d - 27, 72, 26, 26, 2, trim));
  for (const [px, py] of [[26.6, d - 27.4], [48.8, d - 27.4], [26.6, d - 5.2], [48.8, d - 5.2]]) B.push(box(px, py, 72, 4.6, 4.6, 8, pink, pp), box(px + 1.3, py + 1.3, 80, 2, 2, 6, spc));
  spire(B, 40, d - 14, 74, 22, 50, spc, 16, true);
  B.push(box(39.6, d - 14.4, 124, 0.8, 0.8, 9, trim), box(37.4, d - 14.4, 128.4, 5.2, 0.8, 0.8, trim));
  for (const x of [8, 54]) { B.push(box(x, d - 20, 0, 18, 18, 34, pink, (f, u, v, b) => { if (f === 0) return trim; const W = f === 1 ? b.w : b.d; if (v > 32.4 || (v > 18 && v < 19.2)) return trim; if (u < 1.6 || u > W - 1.6) return shade(trim, -0.04); const q = archD(u, v, W / 2, 2.8, 3, 13, true); if (q) return q < 1.1 ? trim : (EM = 0x604020, 0x4a2c34); const q2 = archD(u, v, W / 2, 2.2, 21, 10, true); if (q2) return q2 < 1 ? trim : (EM = 0x405070, 0x6a88c8); return pp(f, u, v); })); B.push(box(x - 0.6, d - 20.6, 34, 19.2, 19.2, 1.6, trim)); spire(B, x + 9, d - 11, 35.6, 14, 24, spc, 9, true); B.push(box(x + 8.6, d - 11.4, 59.6, 0.8, 0.8, 5, trim)); }
  return B;
}
PROP.mary = () => [box(-4.5, -4.5, 0, 9, 9, 2, 0xb9b2a4), box(-3.4, -3.4, 2, 6.8, 6.8, 3, 0xcfc8b8), box(-2.2, -2.2, 5, 4.4, 4.4, 7, 0xdcd6c8, (f, u, v) => f !== 0 && v > 5.4 ? 0xc4bdae : undefined), box(-1.3, -1.3, 12, 2.6, 2.6, 8, 0xf6f4ee), box(-1.5, -0.9, 13.4, 3, 1.8, 5.4, 0x6a8ad0), box(-0.9, -0.9, 20, 1.8, 1.8, 1.8, 0xf6f4ee), box(-1.6, -1.6, 21.8, 3.2, 3.2, 0.6, 0xf2d24a)];
