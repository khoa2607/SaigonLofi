'use strict';
// ===== Tây Du Ký v2 — Đại Lôi Âm Tự / Linh Sơn: terrain art (loaded after tw-art.js; plugs into TWA.lat) =====
// Palette: blue-grey mountain rock with white veins and green moss, ivory paving with thin gold inlay, warm gold-brown platform plates, bodhi lawn (green with yellow leaves), pale pilgrim slabs, clear jade-blue holy water with white foam.
// Cliff faces: strata of blue-grey stone with hanging moss and pale lichen; masonry faces (ivory blocks, a gold course band) under the temple terraces.
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const RCK = ramp(['#2c3646', '#3e4c60', '#566478', '#72829a', '#94a4b8', '#b8c6d4']);
  const MSS = ramp(['#1c3a28', '#2a5a38', '#3e7c48', '#5a9c5c', '#86bc78']);
  const IVO = ramp(['#9a9078', '#bcb298', '#d8ceb2', '#ece4cc', '#f8f2de', '#fffcee']);
  const GLD = ramp(['#7a5a24', '#a07c34', '#c8a04c', '#e4be66', '#f6d880', '#fff0b0']);
  const LWN = ramp(['#2e5a2c', '#3e7a38', '#58983e', '#7ab44a', '#a0cc62']);
  const PTH = ramp(['#807a70', '#a09a8e', '#bcb6a8', '#d4cebe', '#e8e2d2']);
  const WTR = ramp(['#1a5c88', '#2a80ac', '#44a4cc', '#7ac8e2', '#b4e6f2', '#eefcff']);
  const STAIR = ramp(['#b8aa88', '#d0c4a0', '#e4dab8', '#f2ead0', '#fffaea']);
  const INK = [30, 26, 36], shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fbm = (I, J, s) => vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15;
  const isW = m => m === M.STREAM || m === M.POOL;
  function water(m, I, J, X, Y, k, SH, d) {
    SH.water = 2; const f = fbm(I * 1.2, J * 0.6, 1630), st = vnoise(I * 2.6, J * 0.7, 1631), br = Math.max(0, st - 0.66) * 2.4;
    let c = tone(WTR, 0.9 + f * 2.8 + (d ? 0.2 : 0)); if (br > 0.1) c = mix(c, [240, 252, 255], clamp(br * 0.6, 0, 0.7)); if (m === M.POOL) { const lily = vnoise(I * 1.5 + 9, J * 1.5, 1632); if (lily > 0.78) c = mix(c, [236, 150, 176], 0.55); else if (lily > 0.7) c = mix(c, [70, 150, 80], 0.6); }
    if (hash2(X, Y, 1633) < 0.012) c = [255, 255, 255]; return c;
  }
  function top(m, I, J, X, Y, k, d, SH) {
    if (isW(m)) return water(m, I, J, X, Y, k, SH, d);
    const n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), lit = fbm(I - 0.13, J - 0.13, 1640) - fbm(I + 0.13, J + 0.13, 1640);
    if (m === M.LIVORY) { const u = I * 0.9, v = J * 0.9, seam = (u % 1) < 0.06 || (v % 1) < 0.06; let c = tone(IVO, (seam ? 1.2 : 2.7) + n0 * 1.2 + lit * 3.5 + hash2(Math.floor(u), Math.floor(v), 1641) * 0.5 + (d ? 0.2 : 0)); const g = Math.abs(((I + J) * 0.5) % 4 - 2); if (g < 0.05 && !seam) c = mix(c, GLD[4], 0.55); if (hp < 0.004) c = IVO[5]; return c; }
    if (m === M.LGOLD) { const seam = (I % 1) < 0.07 || (J % 1) < 0.07; let c = tone(GLD, (seam ? 1.0 : 2.4) + n0 * 1.4 + lit * 4 + (d ? 0.2 : 0)); const cr = Math.abs(((I - J) * 0.7) % 3 - 1.5); if (cr < 0.05) c = mix(c, [255, 240, 190], 0.5); if (hp < 0.004) c = GLD[5]; return c; }
    if (m === M.LPATH) { const u = I * 1.2, v = J * 1.2, row = Math.floor(v), seam = ((u + (row & 1) * 0.5) % 1) < 0.08 || (v % 1) < 0.08; let c = tone(PTH, (seam ? 0.7 : 2.3) + n0 * 1.2 + lit * 3 + hash2(Math.floor(u + (row & 1) * 0.5), row, 1642) * 0.9); if (n1 > 0.78 && !seam) c = mix(c, MSS[3], 0.4); return c; }
    if (m === M.LLAWN) { let c = tone(LWN, 0.9 + fbm(I, J, 1643) * 3 + lit * 4 + (d ? 0.2 : 0)); if (n1 > 0.74 && hp < 0.6) c = mix(c, [226, 200, 90], 0.45); if (hp > 0.985) c = [255, 240, 150]; else if (hp < 0.01) c = [255, 255, 255]; return c; }
    if (m === M.LMOSS) { let c = tone(MSS, 0.9 + fbm(I, J, 1644) * 3 + lit * 4.5 + (d ? 0.2 : 0)); if (n1 > 0.8) c = mix(c, RCK[3], 0.4); return c; }
    let c = tone(RCK, 1.2 + fbm(I, J, 1645) * 3.2 + lit * 5 + (d ? 0.2 : 0)); const v = Math.abs(((I * 0.7 + J * 0.5 + vnoise(I * 0.3, J * 0.3, 1646) * 2.2) % 1) - 0.5); if (v < 0.045) c = mix(c, [236, 242, 250], 0.4); if (n1 > 0.72 && hp < 0.5) c = mix(c, MSS[2], 0.5); return c;
  }
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const m = TWM.MAT[k]; if (ry === drop - 1) return INK;
    if (isW(m)) { const streak = vnoise(gx * 1.6, elev * 0.04 - (window.TWR ? TWR.t * 1.1 : 0), 1650); if (ry < 2) return WTR[5]; let c = tone(WTR, 1.6 + (streak > 0.6 ? 1.8 : 0) + (side ? -0.4 : 0)); if (streak > 0.78) c = mix(c, [240, 252, 255], 0.6); return c; }
    if (m === M.LIVORY || m === M.LGOLD || m === M.LPATH) { const row = Math.floor(elev / 8), off = (row & 1) * 8, bseam = ((gx + off) % 16) < 1 || (elev % 8) === 0; let t = (side ? 1.5 : 2.8) + hash2(row, Math.floor((gx + off) / 16), 1651) * 0.8 - (ry / drop) * 0.7 + (vnoise(gx * 0.2, elev * 0.1, 1652) - 0.5) * 0.8; if (bseam) t -= 0.8; let c = tone(IVO, t); if (m === M.LGOLD && elev % 32 >= 14 && elev % 32 < 18) c = tone(GLD, 2.6 + (side ? -0.6 : 0.3)); if (ry < 2) c = shade(c, 1.1); return c; }
    // mountain wall: ledges with a pale lip and a dark underside, vertical fractures, moss on the ledges, hanging vines, thin white waterfalls that slide down some columns, mist toward the foot
    const led = (elev + vnoise(gx * 0.07, 0.5, 1653) * 9), ledge = Math.floor(led / 13), pos = led - ledge * 13, hv = hash2(ledge, Math.floor(gx / 11), 1654);
    let t = (side ? 1.0 : 2.2) + hv * 1.4 + (vnoise(gx * 0.18, elev * 0.12, 1655) - 0.5) * 1.6; if (pos < 1.5) t += 1.3; else if (pos > 10.5) t -= 1.0;
    const crack = Math.abs(vnoise(gx * 0.33, elev * 0.04, 1659) - 0.5) < 0.025; if (crack) t -= 1.1;
    let c = tone(RCK, t); if (pos < 3 && vnoise(gx * 0.4, ledge, 1656) > 0.45) c = mix(c, MSS[2 + (hv > 0.5 ? 1 : 0)], 0.65);
    const vine = hash2(Math.floor(gx / 3), ledge, 1660) < 0.16 && pos > 2 && pos < 2 + 5 * hash2(Math.floor(gx / 3), ledge, 1661) * 2; if (vine) c = mix(c, MSS[1], 0.7);
    const col = hash2(Math.floor(gx / 6), 7, 1662); if (col < 0.13) { const flow = (elev * 1.0 - (window.TWR ? TWR.t * 22 : 0)) % 34; if (flow > 0 && flow < 20 + col * 60) c = mix(c, [236, 248, 255], 0.75 - flow * 0.015); }
    if (ry > drop * 0.7) c = mix(c, [226, 236, 246], (ry / drop - 0.7) * 0.9); if (hash2(gx, elev, 1658) < 0.008) c = [240, 246, 252]; return c;
  }
  const edge = c => mix(c, [250, 244, 220], 0.45);
  const seamTone = (I, J, n0, n1) => tone(RCK, 2.4 + n0 * 1.6 + n1 * 0.6);
  Object.assign(A.IMGKINDS, { lathall: ['lat_hall_a'], latgate: ['lat_gate_a'] }); A.GLOWS.push('lat_hall_', 'lat_gate_');
  A.lat = { top, face, edge, stairPal: STAIR, seamTone, ramps: { RCK, MSS, IVO, GLD, LWN, PTH, WTR } };
})();
