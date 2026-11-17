'use strict';
// ===== Sài Gòn Lofi — famous Saigon landmarks (box lists; front faces +y at y = d unless mirrored) =====
const wear = (c, u, v, seed) => { let k = vnoise(u / 4 + seed, v / 9) > 0.62 ? shade(c, -0.08) : c; const r = hash2((u | 0) + seed * 3, 5); if (r > 0.88 && vnoise(u / 2, v / 6 + seed) > 0.45) k = mixc(k, 0x6a5a4a, 0.22); if (v < 3 && vnoise(u / 3 + seed, 2) > 0.5) k = mixc(k, 0x5a7a4a, 0.28); return k; };
function spire(B, cx, cy, z, base, h, col, steps) { for (let k = 0; k < steps; k++) { const s = base * (1 - k / steps); B.push(box(cx - s / 2, cy - s / 2, z + k * h / steps, s, s, h / steps, col, (f, u, v) => f !== 0 && (u | 0) % 3 === 0 ? shade(col, -0.1) : undefined)); } }
const stepRoof = (B, x, y, z, w, d, n, col, alongX) => { for (let k = 0; k < n; k++) B.push(alongX ? box(x, y + k * d / (2 * n), z + k * 3, w, d - k * d / n, 3, col, (f, u, v) => f === 0 ? ((v | 0) % 2 ? col : shade(col, -0.12)) : shade(col, -0.1)) : box(x + k * w / (2 * n), y, z + k * 3, w - k * w / n, d, 3, col, (f, u, v) => f === 0 ? ((u | 0) % 2 ? col : shade(col, -0.12)) : shade(col, -0.1))); };

// Nhà thờ Đức Bà — red brick, twin bell towers with zinc spires
function ducba(w, d) {
  const brick = 0xb8553f, trim = 0xdccbb2, zinc = 0xc4c8cc, B = [];
  const bp = (c) => (f, u, v, b) => { if (f === 0) return 0x8a6a5a; const k = ((v | 0) % 2 ? ((u + 1.5) | 0) % 4 === 0 : (u | 0) % 4 === 0) ? shade(c, -0.14) : c; return wear(k, u, v, 7); };
  B.push(box(6, 0, 0, w - 12, d - 10, 30, brick, (f, u, v, b) => { if (f === 0) return 0x8a6a5a; if (v > 28 || v < 1.4) return trim; const bay = Math.floor(u / 12), a = Math.abs(u - bay * 12 - 6); if (a < 2.4 && v > 8 && v < 23 - Math.max(0, a - 0.8) * 2.4) { if (hash2(bay, f + 2) < 0.6) EM = 0xffc890; return a < 0.4 || (v | 0) === 14 ? trim : [0x5a7ab8, 0xc94f6a, 0xf2c94c][(bay + (v / 5 | 0)) % 3]; } return bp(brick)(f, u, v, b); }));
  stepRoof(B, 5, -1, 30, w - 10, d - 8, 5, 0xa8503a, false);
  for (const tx of [0, w - 24]) {
    B.push(box(tx, d - 22, 0, 24, 22, 60, brick, (f, u, v, b) => { if (f === 0) return trim; const W = f === 1 ? b.w : b.d, a = Math.abs(u - W / 2); if (v > 58 || (v > 30 && v < 31.6) || (v > 44 && v < 45.4)) return trim; if (a < 2.6 && ((v > 34 && v < 42 - Math.max(0, a - 1) * 2) || (v > 48 && v < 56 - Math.max(0, a - 1) * 2))) { EM = 0x40301a; return 0x3a2f3a; } if (f === 1 && a < 3.4 && v < 16 - Math.max(0, a - 1.4) * 2.2) return a > 2.6 ? trim : 0x4a3028; if (u < 1.4 || u > W - 1.4) return shade(brick, -0.12); return bp(brick)(f, u, v, b); }));
    B.push(box(tx - 1, d - 23, 60, 26, 24, 2, trim)); spire(B, tx + 12, d - 11, 62, 18, 34, zinc, 9);
    B.push(box(tx + 11.6, d - 11.4, 96, 0.8, 0.8, 8, trim), box(tx + 9.6, d - 11.4, 100.5, 4.8, 0.8, 0.8, trim));
  }
  B.push(box(24, d - 16, 0, w - 48, 14, 44, brick, (f, u, v, b) => { if (f !== 1) return f === 0 ? trim : bp(brick)(f, u, v, b); const W = b.w, a = Math.abs(u - W / 2); if (v > 42) return trim; const r = Math.hypot(u - W / 2, v - 31); if (r < 5.4) { if (r > 4.4) return trim; EM = 0xfff0c8; if ((Math.abs(u - W / 2) < 0.6 && v > 31 && v < 34.6) || (Math.abs(v - 31) < 0.6 && u > W / 2 && u < W / 2 + 3)) return 0x2a2140; return 0xfbf6e4; } if (a < 6 && v < 22 - Math.max(0, a - 2.4) * 1.9) return a > 4.8 || v > 20.6 - Math.max(0, a - 2.2) * 1.9 ? trim : (EM = 0x503018, 0x4a3028); return bp(brick)(f, u, v, b); }));
  for (let k = 0; k < 3; k++) B.push(box(26 + k * 4, d - 15, 44 + k * 3, w - 52 - k * 8, 12, 3, 0xa8503a));
  return B;
}
// Bưu điện Trung tâm — yellow, green shutters, big arched entrance with a clock
function buudien(w, d) {
  const wall = 0xe9c56c, trim = 0xfbf3d8, shut = 0x4f8a6f, B = [], H = 34;
  B.push(box(0, 0, 0, w, d, H, wall, (f, u, v, b) => { if (f === 0) return 0xa89f90; const W = f === 1 ? b.w : b.d; if (v > H - 2 || (v > 16 && v < 17.4) || v < 1.4) return trim; const bay = Math.floor(u / 12), a = Math.abs(u - bay * 12 - 6), vv = v > 17 ? v - 17 : v; if (a < 3.2 && vv > 3.5 && vv < 14 - Math.max(0, a - 1.4) * 1.8) { if (a > 2.3) return shut; if (hash2(bay, (v > 17) + f * 3) < 0.5) EM = 0xffd98a; return a < 0.4 ? trim : 0x4a6680; } return wear(wall, u, v, 3); }));
  stepRoof(B, -1, -1, H, w + 2, d + 2, 4, 0x6f8a7a, true);
  const cx = w / 2 - 17;
  B.push(box(cx, d - 4, 0, 34, 10, 46, wall, (f, u, v, b) => { if (f === 0) return trim; if (f !== 1) return wear(wall, u, v, 5); const a = Math.abs(u - 17); if (v > 44 || (v > 30 && v < 31.4)) return trim; const r = Math.hypot(u - 17, v - 38); if (r < 4.6) { if (r > 3.7) return 0x6b5238; EM = 0xfff0c8; return (Math.abs(u - 17) < 0.6 && v > 38 && v < 41) || (Math.abs(v - 38) < 0.6 && u > 17 && u < 19.6) ? 0x2a2140 : 0xfbf6e4; } if (a < 11 && v < 28 - Math.max(0, a - 5) * 1.6) { if (a > 9.6 || v > 26.6 - Math.max(0, a - 4.6) * 1.6) return trim; EM = 0x705a30; return (u | 0) % 4 === 0 || (v | 0) % 6 === 0 ? 0x4f8a6f : v < 12 ? 0x3b3140 : 0x7fa8b8; } if (textAt('BUU DIEN', u - 2, v - 32)) return 0x8a3a2a; return wear(wall, u, v, 5); }));
  stepRoof(B, cx - 1, d - 5, 46, 36, 12, 3, 0x6f8a7a, false);
  return B;
}
// Dinh Độc Lập — white modernist palace with the bamboo-screen facade
function dinh(w, d) {
  const white = 0xf0ede4, B = [], H = 38;
  B.push(box(0, 0, 0, w, d, H, white, (f, u, v, b) => { if (f === 0) return 0xb8b2a4; const W = f === 1 ? b.w : b.d; if (v > H - 2.4 || (v > 11 && v < 13) || (v > 25 && v < 27) || v < 1.2) return white; if (u < 3 || u > W - 3) return wear(white, u, v, 2); if (v > 13 && v < 25) { if (u % 5 < 1.8) return (v | 0) % 4 === 0 ? shade(white, -0.12) : white; if (hash2(u / 5 | 0, f) < 0.55) EM = 0xffe0a0; return 0x4f6478; } if (f === 1 && Math.abs(u - W / 2) < 9 && v < 11) { EM = 0x705a30; return (u | 0) % 5 === 0 ? white : 0x3b3140; } if (u % 9 < 5.5 && ((v > 3 && v < 10) || (v > 28 && v < 34))) { if (hash2(u / 9 | 0, v > 20 ? 2 : 1) < 0.4) EM = 0xffe0a0; return 0x5a7088; } return wear(white, u, v, 2); }));
  B.push(box(w / 2 - 30, d / 2 - 14, H, 60, 28, 9, white, (f, u, v, b) => f !== 0 && v > 2 && v < 7 && u % 6 > 1.6 ? 0x5a7088 : undefined), box(w / 2 - 32, d / 2 - 16, H + 9, 64, 32, 1.6, white));
  B.push(box(w / 2 - 0.4, d / 2 - 0.4, H + 10.6, 0.8, 0.8, 16, 0x9aa3ad), box(w / 2 + 0.4, d / 2 - 0.3, H + 20, 9, 0.6, 6, 0xd9281e, (f, u, v) => f === 1 && Math.abs(u - 4.5) + Math.abs(v - 3) * 1.2 < 2 ? 0xf7d94a : undefined, { raw: 1 }));
  B.push(box(w / 2 - 16, d, 0, 32, 10, 1.6, 0xd8d2c4), box(w / 2 - 16, d + 8, 11, 32, 2, 1.6, white, null, { nf: 1 }));
  return B;
}
// Uỷ ban Nhân dân (Hôtel de Ville) — cream, clock tower and corner pavilions
function ubnd(w, d) {
  const wall = 0xf2e3b6, trim = 0xfffaf0, B = [], H = 30;
  const p = (f, u, v, b) => { if (f === 0) return 0xa89f90; const W = f === 1 ? b.w : b.d; if (v > b.h - 2 || (v > 14.5 && v < 16) || v < 1.4) return trim; const bay = Math.floor(u / 9), a = Math.abs(u - bay * 9 - 4.5), vv = v > 15.5 ? v - 15.5 : v; if (a < 2.4 && vv > 3 && vv < 12.5 - Math.max(0, a - 1) * 1.8) { if (hash2(bay, (v > 15) + f * 5) < 0.55) EM = 0xffd98a; return a < 0.4 ? trim : 0x54708a; } if (a > 4) return trim; return wear(wall, u, v, 9); };
  B.push(box(0, 0, 0, w, d, H, wall, p)); stepRoof(B, -1, -1, H, w + 2, d + 2, 3, 0xb5553a, true);
  for (const x of [0, w - 20]) { B.push(box(x, d - 2, 0, 20, 6, H + 8, wall, p)); stepRoof(B, x - 1, d - 3, H + 8, 22, 8, 3, 0xb5553a, false); }
  const cx = w / 2 - 9;
  B.push(box(cx, d - 4, 0, 18, 10, 56, wall, (f, u, v, b) => { if (f === 0) return trim; const W = f === 1 ? b.w : b.d, a = Math.abs(u - W / 2); if (v > 54 || (v > 34 && v < 35.4)) return trim; if (f === 1) { const r = Math.hypot(u - 9, v - 46); if (r < 4.4) { if (r > 3.5) return 0x6b5238; EM = 0xfff0c8; return (Math.abs(u - 9) < 0.6 && v > 46 && v < 49) || (Math.abs(v - 46) < 0.6 && u > 9 && u < 11.4) ? 0x2a2140 : 0xfbf6e4; } if (a < 4.4 && v < 20 - Math.max(0, a - 2) * 1.8) return a > 3.4 ? trim : 0x3b3140; if (textAt('UBND', u - 2, v - 27)) return 0x8a3a2a; } return wear(wall, u, v, 9); }));
  spire(B, cx + 9, d + 1, 56, 14, 16, 0x7a8a90, 5);
  B.push(box(cx + 8.6, d + 0.6, 72, 0.8, 0.8, 12, 0x9aa3ad), box(cx + 9.4, d + 0.7, 78, 8, 0.6, 5.4, 0xd9281e, (f, u, v) => f === 1 && Math.abs(u - 4) + Math.abs(v - 2.7) * 1.2 < 1.8 ? 0xf7d94a : undefined, { raw: 1 }));
  return B;
}
// Nhà hát Thành phố — the opera house with its great arch
function nhahat(w, d) {
  const wall = 0xf2ecdc, trim = 0xfffaf0, B = [], H = 34;
  B.push(box(0, 0, 0, w, d, H, wall, (f, u, v, b) => { if (f === 0) return 0xa89f90; const W = f === 1 ? b.w : b.d; if (v > H - 2 || v < 1.4) return trim; if (f === 1) { const a = Math.abs(u - W / 2), r = Math.hypot(u - W / 2, (v - 8) * 0.9); if (r < 19 && v > 2) { if (r > 17.4) return trim; EM = 0x80683a; if (v < 13) return a < 1 || Math.abs(a - 9) < 0.8 ? trim : 0x3b3140; return (u | 0) % 5 === 0 || Math.abs(r - 11) < 0.7 ? trim : 0x86a8b8; } if (Math.abs(a - 24) < 2.2 && v > 4 && v < 22) return v > 14 ? 0xd8d2c4 : trim; if (textAt('NHA HAT', u - (W / 2 - 13), v - 27.5)) return 0x8a6a3a; } else { const q = u % 12; if (q > 4 && q < 8 && v > 8 && v < 24 - Math.max(0, Math.abs(q - 6) - 0.8) * 2) { if (hash2(u / 12 | 0, 4) < 0.5) EM = 0xffd98a; return 0x54708a; } } return wear(wall, u, v, 4); }));
  stepRoof(B, -1, -1, H, w + 2, d + 2, 5, 0x7f8a90, false);
  B.push(box(w / 2 - 12, d, 0, 24, 6, 1.6, 0xd8d2c4), box(w / 2 - 12, d + 3, 1.6, 24, 3, 1.4, 0xd8d2c4));
  return B;
}
PROP.mary = () => [box(-3.5, -3.5, 0, 7, 7, 9, 0xb9b2a4, (f, u, v) => f !== 0 && v > 7.4 ? 0x9a9488 : undefined), box(-1.6, -1.4, 9, 3.2, 2.8, 10, 0xf4f1e8), box(-1.2, -1.2, 19, 2.4, 2.4, 2.6, 0xf4f1e8), box(-0.6, -0.6, 21.6, 1.2, 1.2, 1, 0xf7d94a)];
