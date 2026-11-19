'use strict';
// ===== Holdfast FUTURE — art: a rebuilt settlement of salvaged technology, its people and its machines (DOM-free; box models + per-pixel painters) =====
// Same language as the other ages: bake() box models, the warm grade, cocoa ink, plum shade, one light from the upper left.
// The valley, lots, sites and props are the Current timeline's (same map seed); only what stands there changes (docs/holdfast/FUTURE-DESIGN.md).
// Everything here is reached only through `HF.era === 'future'` dispatch lines in hf-art.js / hf-render.js.

// ---------------------------------------------------------------- palette: worn composite, weathered teal, warm graphite, copper, safety amber, solar blue
const FCOMP = [0xd8d2c4, 0xccc6b6, 0xe0dccf, 0xc4bfb2, 0xd2cab6], FTEAL = [0x4a7f80, 0x3f6f74, 0x5a8c86, 0x4a7a8c], FWARM = [0xc8a47a, 0xb88a64, 0xd4b48a, 0xa8906e];
const FGRAPH = 0x4a4a52, FGRAPH_D = 0x34343c, FGRAPH_L = 0x6a6a74, FCOPPER = 0xb8744a, FAMBER = 0xe8a83a, FSOLAR = 0x2c4470, FGLASS = 0x5f8a96, FGREEN = 0x5a8a4a, FMOSS = 0x6a7a3a;
const FLIT = 0xffd290, FLED = 0xffc070, FCYAN = 0x8ae0e8, FRED = 0xff5a3a, FOK = 0x7ae08a;
const FUT = () => HF.era === 'future';

// ---------------------------------------------------------------- painters
// composite cladding: plates with seams and rivets, per-plate tone, dust, ground grime, the odd patch plate or cable run; windows, doors and light strips
function panelP(S) {
  const pw = S.pw || 6, ph = S.ph || 6, base = S.c;
  return (f, u, v, b, wx, wy) => {
    if (f === 0) { const n = vnoise(wx / 3 + (S.seed || 0), wy / 3); return S.top !== undefined ? S.top : n > 0.6 ? mixc(base, 0xfff4e0, 0.12) : n < 0.3 ? mixc(base, 0x3a3440, 0.12) : base; }
    const W = f === 1 ? b.w : b.d;
    const dr = S.door; if (dr && dr.f === f && u >= dr.u && u < dr.u + dr.w && v < dr.h) {       // a sliding door: frame, two leaves, a status light
      const x = u - dr.u; if (x < 0.6 || x > dr.w - 0.6 || v > dr.h - 0.6) return FGRAPH_D;
      if (v > dr.h - 1.6 && Math.abs(x - dr.w / 2) < 0.7) { EM = dr.warn ? FAMBER : FOK; return dr.warn ? FAMBER : FOK; }
      if (Math.abs(x - dr.w / 2) < 0.25) return FGRAPH_D;
      if (v > 3 && v < dr.h - 2.6 && (x < dr.w / 2 - 0.9 || x > dr.w / 2 + 0.9) && x > 1.2 && x < dr.w - 1.2) { EM = mixc(FLIT, 0, 0.45); return 0x7a6a58; }
      return dr.c || 0x8a8e92;
    }
    for (const w of (S.wins && S.wins[f]) || []) if (u >= w.u && u < w.u + w.w && v >= w.v && v < w.v + w.h) {   // window: dark frame, sill, warm interior or reflection
      const x = u - w.u, y = v - w.v; if (x < 0.5 || x > w.w - 0.5 || y < 0.5 || y > w.h - 0.5) return FGRAPH_D;
      if (y < 0.9) return mixc(base, 0x2b1a16, 0.2);
      if (w.lit) { EM = (hs(Math.floor(w.u) + (S.seed || 0), f) > 0.5 ? FLIT : mixc(FLIT, 0xffa050, 0.4)); if (w.blind && y > w.h * 0.55) return mixc(0xc89a6a, 0x2b1a16, 0.15); return (x + y * 0.6) % 3 < 0.5 ? 0xf0c890 : 0xd8a46a; }
      return (x - y * 0.8 + 20) % 4 < 0.7 ? 0x9ac0c8 : FGLASS;
    }
    if (S.strip && Math.abs(v - S.strip) < 0.4) { EM = S.stripC || FLED; return S.stripC ? mixc(S.stripC, 0xffffff, 0.3) : 0xffe0a8; }   // an LED strip under the eaves
    if (S.band && v >= S.band && v < S.band + 1.4) return S.bandC || FTEAL[0];
    if (S.vent && S.vent.f === f && Math.abs(u - S.vent.u) < 2 && Math.abs(v - S.vent.v) < 1.4) return ((v * 2.4) | 0) % 2 ? FGRAPH_D : FGRAPH;
    const ci = Math.floor(u / pw), cj = Math.floor(v / ph), lu = u - ci * pw, lv = v - cj * ph, h0 = hs(ci + (S.seed || 0) * 7 + f * 31, cj);
    if (lu < 0.32 || lv < 0.32) return mixc(base, 0x2b1a16, 0.32);                                  // plate seams
    let c = h0 > 0.78 ? mixc(base, 0xfff8ea, 0.1) : h0 < 0.16 ? mixc(base, 0x5a5048, 0.12) : base;
    if (S.patch && h0 > 0.95) c = mixc(FCOPPER, base, 0.35);                                           // a salvaged patch plate
    if ((lu < 1 || lu > pw - 1) && (lv < 1 || lv > ph - 1) && hs(ci * 3 + f, cj * 5) > 0.3) c = mixc(c, 0x2b1a16, 0.28);   // rivets at the plate corners
    if (S.cable && S.cable.f === f && Math.abs(u - S.cable.u) < 0.5) c = FGRAPH_D;
    const n = vnoise(wx / 4 + (S.seed || 0), wy / 4 + v / 3);
    if (n > 0.72) c = mixc(c, 0x8a7a5a, 0.16); if (v < 2.2) c = mixc(c, 0x5a4a3a, 0.22 * (2.2 - v) / 2.2);   // dust, ground grime
    if (S.moss && v < 4 && vnoise(wx / 2, wy / 2 + 7) > 0.68) c = mixc(c, FMOSS, 0.45);                       // the valley creeping back up the walls
    if (S.streak && hs(Math.floor(u * 2) + f, 3) > 0.9 && v < b.h - 1) c = mixc(c, 0x6a5a4a, 0.12);
    return c;
  };
}
// solar cells: a silver frame, blue cells in a grid, a sky glint, a little dust
const solarP = (seed) => (f, u, v, b, wx, wy) => {
  if (f !== 0) return mixc(FGRAPH, 0x8a8e96, 0.3);
  const cu = (u % 2.2), cv = (v % 2.2); if (cu < 0.25 || cv < 0.25 || u < 0.4 || v < 0.4 || u > b.w - 0.4 || v > b.d - 0.4) return 0xa8b0b8;
  const g = hs(Math.floor(u / 2.2) + seed, Math.floor(v / 2.2)); let c = g > 0.86 ? 0x6a88b8 : g > 0.5 ? FSOLAR : 0x263c64;
  if (cu + cv < 0.9) c = mixc(c, 0xd8e8ff, 0.35); if (vnoise(wx / 5 + seed, wy / 5) > 0.7) c = mixc(c, 0xb8a888, 0.2); return c;
};
const fGlassP = (lit, seed) => (f, u, v, b) => { if (f === 0) return (u % 3 < 0.35 || v % 3 < 0.35) ? FGRAPH : 0x8ab4bc; if (u % 3 < 0.35 || v % 4 < 0.35) return FGRAPH_D; if (lit) { EM = hs(Math.floor(u / 3) + seed, Math.floor(v / 4)) > 0.4 ? FLIT : 0; return EM ? 0xf0c890 : 0x8aa8b0; } return (u - v * 0.7 + 30) % 5 < 0.8 ? 0xb8d8dc : FGLASS; };
const fMetalP = (c, seed) => (f, u, v, b, wx, wy) => { if (f === 0) return mixc(c, 0xfff4e0, 0.1); const s = (u * 1.3) % 2.4; let col = s < 0.3 ? mixc(c, 0x2b1a16, 0.3) : s < 1.1 ? mixc(c, 0xffffff, 0.08) : c; if (vnoise(wx / 3 + seed, wy / 3 + v / 2) > 0.7) col = mixc(col, FCOPPER, 0.2); if (v < 1.4) col = mixc(col, 0x5a4a3a, 0.2); return col; };
const greenRoofP = (seed) => (f, u, v, b, wx, wy) => { if (f !== 0) return FGRAPH; const n = vnoise(wx / 2.2 + seed, wy / 2.2), h = hs(Math.floor(wx * 1.4), Math.floor(wy * 1.4)); if (u < 0.6 || v < 0.6 || u > b.w - 0.6 || v > b.d - 0.6) return 0xa8a296; return h > 0.93 ? [0xe8c84a, 0xd9534f, 0xf0e6dc][Math.floor(h * 1000) % 3] : n > 0.6 ? 0x7aa04a : n < 0.3 ? 0x4a7a3a : FGREEN; };
const screenP = (c, seed) => (f, u, v, b) => { if (f === 0) return FGRAPH; if (u < 0.5 || v < 0.5 || u > (f === 1 ? b.w : b.d) - 0.5 || v > b.h - 0.5) return FGRAPH_D; EM = mixc(c, 0, 0.3); return (Math.floor(v * 1.6) + seed) % 3 === 0 ? mixc(c, 0xffffff, 0.3) : c; };
const hazardP = (base) => (f, u, v) => f === 0 ? base : (((u + v) * 0.8) | 0) % 2 ? FAMBER : FGRAPH_D;
const lightP = (c) => (f) => { EM = c; return mixc(c, 0xffffff, 0.35); };

// ---------------------------------------------------------------- roof forms (never just a flat box): mono-pitch solar, ribbed vault, green roof, stepped dome
function fSolarRoof(B, x, y, z, w, d, n, seed) { const s = d / n; for (let k = 0; k < n; k++) B.push(HB(x, y + k * s, z + k * 1.1, w, s + 0.05, 1.1, FSOLAR, solarP(seed + k))); return z + n * 1.1; }
function fVault(B, x, y, z, w, d, n, c, seed, ribs) {   // a barrel vault along x: stepped cross-section in y, a rib every few units
  const prof = k => Math.sqrt(1 - (k / n) ** 2); let top = z;
  for (let k = 0; k < n; k++) { const hd = (d / 2) * prof(k), hh = 1.3; B.push(HB(x, y + d / 2 - hd, z + k * hh, w, hd * 2, hh, c, (f, u, v, b, wx, wy) => { if (ribs && (u % ribs) < 0.7) return mixc(c, 0x2b1a16, 0.25); const n2 = vnoise(wx / 4 + seed, wy / 4); return f === 0 ? (n2 > 0.62 ? mixc(c, 0xfff4e0, 0.14) : c) : mixc(c, 0x2b1a16, 0.1); })); top = z + (k + 1) * hh; }
  return top;
}
function fGlassVault(B, x, y, z, w, d, n, lit, seed) { let top = z; for (let k = 0; k < n; k++) { const hd = (d / 2) * Math.sqrt(1 - (k / n) ** 2); B.push(HB(x, y + d / 2 - hd, z + k * 1.6, w, hd * 2, 1.6, FGLASS, fGlassP(lit, seed + k))); top = z + (k + 1) * 1.6; } return top; }
function fDome(B, cx, cy, z, r, n, c, p) { let top = z; for (let k = 0; k < n; k++) { const rr = r * Math.sqrt(1 - (k / n) ** 2), hh = r / n * 1.05; B.push(HB(cx - rr, cy - rr * 0.6, z + k * hh, rr * 2, rr * 1.2, hh, c, p), HB(cx - rr * 0.6, cy - rr, z + k * hh, rr * 1.2, rr * 2, hh, c, p)); top = z + (k + 1) * hh; } return top; }
function fGreenRoof(B, x, y, z, w, d, seed) { B.push(HB(x, y, z, w, d, 1.2, FGREEN, greenRoofP(seed))); for (let i = 0; i < 3; i++) B.push(HB(x + 2 + hs(seed, i) * (w - 6), y + 2 + hs(i, seed) * (d - 6), z + 1.2, 2.4, 2.4, 2.6, 0x4a7a3a, (f) => f === 0 ? 0x6a9a44 : 0x3a6a34)); return z + 1.2; }
const fAntenna = (B, x, y, z, h, lamp) => { B.push(HB(x, y, z, 0.6, 0.6, h, FGRAPH_L), HB(x - 1.2, y - 0.1, z + h * 0.6, 3, 0.4, 0.4, FGRAPH_L)); if (lamp) B.push(HB(x - 0.2, y - 0.2, z + h, 1, 1, 1, FRED, lightP(FRED))); };
const fDish = (B, x, y, z, r) => { B.push(HB(x, y, z, 1, 1, 2.6, FGRAPH)); B.push(HB(x - r, y - 0.4, z + 2.4, r * 2, 0.8, r * 1.6, 0xd8d4cc, (f, u, v, b) => { const rr = Math.hypot(u - r, v - r * 0.8); return rr > r ? -1 : rr < r * 0.25 ? FGRAPH : rr < r * 0.6 ? 0xe8e4dc : 0xc8c2b8; })); };
const fCyl = (B, x, y, z, r, h, c, p) => { B.push(HB(x - r, y - r * 0.6, z, r * 2, r * 1.2, h, c, p), HB(x - r * 0.6, y - r, z, r * 1.2, r * 2, h, c, p)); };
const fPlanter = (B, x, y, z, w, seed) => { B.push(HB(x, y, z, w, 2.4, 2, 0x8a7a64, fMetalP(0x8a7a64, seed))); for (let i = 0; i < w - 1; i += 1.8) B.push(HB(x + 0.4 + i, y + 0.4, z + 2, 1.6, 1.6, 1.4 + hs(seed, i) * 1.6, sp(mulberry32(seed + i * 7), [0x5a8a3a, 0x6aa244, 0x7a9a44, 0xd9534f]), (f) => f === 0 ? 0x7aa64a : undefined)); };

// ---------------------------------------------------------------- homes: modular habitats on the old lots
function futHouse(o) {
  const R = mulberry32(o.seed + 3), { w, d, floors } = o, B = [], seed = o.seed % 97, H = floors * 18, Z0 = 2;
  const wall = sp(R, FCOMP), trim = sp(R, FTEAL.concat(FWARM)), du = Math.round(w * 0.3), roofK = seed % 3;
  const S = { c: wall, seed, pw: 6 + (seed % 3), ph: 6, wins: { 1: [], 2: [] }, door: { f: 1, u: du, w: 6, h: 11 }, band: floors > 1 ? 17 : 0, bandC: trim, strip: H - 1.4, moss: R() < 0.4, patch: 1, streak: 1, cable: R() < 0.5 ? { f: 2, u: 2.2 } : null, vent: { f: 2, u: d - 4, v: 6 } };
  for (let fl = 0; fl < floors; fl++) {
    const v0 = 5.4 + fl * 18;
    if (fl === 0) { for (let u = 2.5; u + 5 < w - 2; u += 10) if (u + 5 < du - 0.5 || u > du + 6.5) S.wins[1].push({ u, v: v0, w: 6.4, h: 5.2, lit: R() < 0.65, blind: R() < 0.4 }); }
    else S.wins[1].push({ u: 2.5, v: v0, w: Math.min(w - 5, 15), h: 6, lit: R() < 0.6, blind: R() < 0.5 });                         // the upper floor's wide window band
    for (let u = 3; u + 5 < d - 2; u += 10) S.wins[2].push({ u, v: v0, w: 5.2, h: 5.2, lit: R() < 0.5 });
  }
  B.push(HB(-0.8, -0.8, 0, w + 1.6, d + 1.6, Z0, 0x9a968c, fMetalP(0x9a968c, seed)));                                           // a raised plinth (the valley floods)
  B.push(HB(0, 0, Z0, w, d, H, wall, panelP(S)));
  let top = Z0 + H;
  if (roofK === 0) { top = fSolarRoof(B, -1.5, -1.5, top, w + 3, d + 3, 5, seed); B.push(HB(-1.5, d + 1.4, Z0 + H - 0.6, w + 3, 0.6, 1, FGRAPH)); }
  else if (roofK === 1) { B.push(HB(-1, -1, top, w + 2, d + 2, 1, FGRAPH)); top = fVault(B, -1, -1, top + 1, w + 2, d + 2, 5, trim, seed, 4); B.push(HB(w * 0.6, d * 0.3, top - 2, 5, 3, 0.6, FSOLAR, solarP(seed))); }
  else { B.push(HB(-1, -1, top, w + 2, d + 2, 1.2, FGRAPH)); top = fGreenRoof(B, -0.5, -0.5, top + 1.2, w + 1, d + 1, seed); B.push(HB(w * 0.15, d * 0.2, top, w * 0.4, d * 0.5, 0.8, FSOLAR, solarP(seed + 1))); }
  if (R() < 0.5) fAntenna(B, w - 3, 3, top, 9, R() < 0.5); else if (R() < 0.5) fDish(B, 3, d - 4, top, 2.2);
  B.push(HB(w - 6, 2, top, 4, 3, 2.4, FGRAPH, (f, u, v) => f === 0 ? FGRAPH_L : ((u * 2.4) | 0) % 2 ? FGRAPH_D : FGRAPH));          // a heat-pump box on the roof
  o.chim = [w - 4, 3.5, top + 2.4];
  if (o.porch) {   // a canopy on two slim posts over the door: planters, a bench, a hanging light
    const px = Math.max(1, du - 5), pw = Math.min(w - px - 1, 18), ac = sp(R, [0xc8b89a, 0xd8c8a8, 0x9ab8b0, 0xc8a47a]);
    for (const cx of [px, px + pw - 1]) B.push(HB(cx, d + 6.4, 0, 0.8, 0.8, 11.5, FGRAPH_L));
    B.push(HB(px - 0.6, d - 0.2, 11.4, pw + 1.2, 7.8, 0.6, ac, (f, u, v) => f === 0 ? ((u * 0.8 | 0) % 2 ? ac : mixc(ac, 0xfff4e0, 0.16)) : FGRAPH));
    B.push(HB(px + pw / 2, d + 4, 10, 1, 1, 1.2, FLED, lightP(FLED)));
    if (R() < 0.7) fPlanter(B, px, d + 1.2, 0, Math.min(8, pw - 2), seed);
  }
  if (o.garage) {   // a charging carport with a small rover and a wallbox
    const gx = w, gw = 12, gd = Math.min(d, 20);
    for (const [x, y] of [[gx + gw - 1, d - gd], [gx + gw - 1, d - 1]]) B.push(HB(x, y, 0, 0.9, 0.9, 10.5, FGRAPH_L));
    fSolarRoof(B, gx - 0.5, d - gd - 1, 10.5, gw + 1, gd + 2, 3, seed + 5);
    B.push(HB(gx + 0.2, d - gd + 2, 2, 0.8, 2, 3, FGRAPH, (f, u, v) => { if (v > 2) { EM = FOK; return FOK; } return FGRAPH; }));
    futRoverBoxes(B, gx + 2.4, d - gd + 6, mixc(sp(R, FWARM), 0xffffff, 0.15), seed);
  }
  if (R() < 0.45) B.push(HB(-3.4, d * 0.4, 0, 2.6, 4, 7, FGRAPH, (f, u, v) => f === 0 ? FGRAPH_L : v > 5.6 && u < 1.4 ? (EM = FOK, FOK) : ((v * 1.3) | 0) % 2 ? FGRAPH_D : FGRAPH));   // a battery cabinet
  o.H = top + 3;
  return B;
}
// a small electric rover, parked (also used for the depot's vehicles and the expedition rovers)
function futRoverBoxes(B, x, y, c, seed) {
  for (const [wx, wy] of [[0.6, -0.4], [7.2, -0.4], [0.6, 5.8], [7.2, 5.8]]) B.push(HB(x + wx, y + wy, 0, 2.4, 0.9, 2.4, 0x2e2e34, (f, u, v) => (Math.hypot(u - 1.2, v - 1.2) < 0.6 ? 0x8a8e96 : 0x2e2e34)));
  B.push(HB(x, y, 1.2, 10, 6.2, 2.4, c, panelP({ c, seed, pw: 5, ph: 3 })), HB(x + 3.2, y + 0.4, 3.6, 5, 5.4, 2.4, 0x5f8a96, fGlassP(false, seed)), HB(x + 0.2, y + 0.6, 3.6, 2.6, 5, 0.8, FGRAPH));
  B.push(HB(x + 9.6, y + 0.8, 2, 0.6, 1, 0.8, FLED, lightP(FLED)), HB(x + 9.6, y + 4.4, 2, 0.6, 1, 0.8, FLED, lightP(FLED)));
}

// ---------------------------------------------------------------- civic buildings
function futCivic(b) {
  const R = mulberry32(b.seed * 37 + 5), w = b.w, d = b.d, B = [], seed = b.seed % 97;
  const plinth = (h) => B.push(HB(-0.8, -0.8, 0, w + 1.6, d + 1.6, h || 2, 0xa8a49a, fMetalP(0xa8a49a, seed)));
  if (b.kind === 'church') {          // the MEMORY SANCTUARY: terraced plinth, a long hall under a ribbed glass vault, and a spire of luminous rings
    for (let k = 0; k < 3; k++) B.push(HB(-1 + k * 1.2, -1 + k * 1.2, k * 1.4, w + 2 - k * 2.4, d + 2 - k * 2.4, 1.4, 0xc8c2b2, fMetalP(0xc8c2b2, seed + k)));
    const Z = 4.2;
    B.push(HB(16, 2, Z, 26, 14, 20, FCOMP[2], panelP({ c: FCOMP[2], seed, pw: 7, ph: 5, strip: 18 }))); fDome(B, 29, 9, Z + 20, 9, 5, 0xd8d0be, fMetalP(0xd8d0be, seed));   // the apse with its domed reading room
    B.push(HB(10, 10, Z, 38, 70, 24, FCOMP[0], panelP({ c: FCOMP[0], seed: seed + 2, pw: 8, ph: 6, strip: 22.6, stripC: 0xffe0a0, wins: { 1: [], 2: [{ u: 4, v: 6, w: 4, h: 13, lit: 1 }, { u: 16, v: 6, w: 4, h: 13, lit: 1 }, { u: 28, v: 6, w: 4, h: 13, lit: 1 }, { u: 44, v: 6, w: 4, h: 13, lit: 1 }, { u: 56, v: 6, w: 4, h: 13, lit: 1 }] } })));
    for (const y0 of [14, 28, 50, 64]) B.push(HB(48, y0, Z, 1.6, 1.6, 30, 0xe8e2d2, (f, u, v) => v > 27 ? (EM = 0xffe0a0, 0xfff0c8) : (v % 6 < 0.5 ? FGRAPH : 0xe8e2d2)));   // light columns along the hall
    const top = fGlassVault(B, 8, 8, Z + 24, 42, 74, 7, true, seed);                                                                                    // the glass vault, lit from within at night
    for (let y = 10; y < 82; y += 9) B.push(HB(8, y, Z + 24, 42, 0.8, 0.8, 0xd8d0be));                                                                 // vault ribs
    B.push(HB(0, 34, Z, w, 20, 21, 0xd4ccb8, panelP({ c: 0xd4ccb8, seed: 7, pw: 6, ph: 7, door: { f: 2, u: 6, w: 8, h: 13 }, wins: { 1: [{ u: 4, v: 8, w: 5, h: 8, lit: 1 }, { u: w - 9, v: 8, w: 5, h: 8, lit: 1 }] } })));   // the transept
    fVault(B, -1, 33, Z + 21, w + 2, 22, 5, 0xb8a888, seed + 4, 5);
    // the spire: a slender stack of rings and glass memory columns rising to a beacon; the tallest thing in the valley, like the church and the totem
    const TX = 22, TY = 78, TW = 14, TD = 12;
    B.push(HB(TX - 4, TY - 3, Z, TW + 8, TD + 6, 5, 0xc8c2b2, fMetalP(0xc8c2b2, seed)));
    for (let i = 0; i < 7; i++) {
      const z0 = Z + 5 + i * 13, ww = TW - i * 1.3, dd = TD - i * 1.1, ox = TX + i * 0.65, oy = TY + i * 0.55;
      B.push(HB(ox, oy, z0, ww, dd, 10.6, 0xe0dacb, (f, u, v, bb) => { if (f === 0) return 0xd0c8b8; const W2 = f === 1 ? bb.w : bb.d; if (u < 1 || u > W2 - 1) return 0xb8b0a0;
        if (u > 2 && u < W2 - 2 && v > 1.4 && v < 9.4 && (u % 3) > 1) { EM = i % 2 ? 0xffe6b0 : 0xffd890; return 0xfff0c8; } return mixc(0xe0dacb, 0x2b1a16, v < 1 ? 0.3 : 0.06); }));
      B.push(HB(ox - 1.2, oy - 1.2, z0 + 10.6, ww + 2.4, dd + 2.4, 2.4, 0xc8a47a, fMetalP(0xc8a47a, seed + i)));                                           // a copper ring between the tiers
    }
    B.push(HB(TX + 4.5, TY + 4, Z + 101, 5, 4, 14, 0xe0dacb), HB(TX + 6.2, TY + 5.2, Z + 115, 1.6, 1.6, 8, 0xd8d0be), HB(TX + 5.5, TY + 4.6, Z + 120, 3, 3, 2.4, 0xfff0c8, lightP(0xffe6b0)));
    for (let k = 0; k < 3; k++) B.push(HB(TX - 6 + k * 1.5, TY + TD + 5 - k * 1.6, 0, TW + 12 - k * 3, 4, 1.2 + k * 1.2, 0xc8c2b2, fMetalP(0xc8c2b2, k)));
    b.H = 126;
  } else if (b.kind === 'school') {   // the LEARNING & RESEARCH ACADEMY: a long hall under a vault, a big window band, an observatory dome with its telescope
    const S = { c: FCOMP[1], seed: 11, pw: 7, ph: 6, band: 16.4, bandC: FTEAL[2], strip: 21, wins: { 1: [], 2: [{ u: 6, v: 6, w: 6, h: 7, lit: 1 }, { u: 22, v: 6, w: 6, h: 7, lit: 1 }] }, door: { f: 1, u: w / 2 - 4, w: 8, h: 12 } };
    for (let u = 3; u + 7 < w - 3; u += 9) if (u + 7 < w / 2 - 5 || u > w / 2 + 5) S.wins[1].push({ u, v: 5, w: 7, h: 8, lit: 1, blind: u % 2 });
    plinth(); B.push(HB(0, 0, 2, w, d, 22, S.c, panelP(S)));
    const top = fVault(B, -1.5, -1.5, 24, w + 3, d + 3, 6, FTEAL[1], seed, 5);
    fDome(B, w - 12, d / 2, top - 4, 7, 5, 0xe0dccf, fMetalP(0xe0dccf, seed)); B.push(HB(w - 13, d / 2 - 1, top + 2, 9, 2, 2, FGRAPH, (f, u) => u > 7 ? 0x8ab4bc : FGRAPH));   // the telescope's slot
    for (let x = 6; x < w * 0.55; x += 9) B.push(HB(x, d * 0.3, top - 1.5, 6, 4, 0.8, FSOLAR, solarP(seed + x)));
    B.push(HB(w / 2 - 6, d + 0.1, 13, 12, 0.6, 6, 0x3a6a8a, screenP(0x6ab0e0, 2)));                                                                    // a display board over the door
    fAntenna(B, 6, 6, top - 1, 12, true); b.H = top + 9;
  } else if (b.kind === 'infirmary') { // the MEDICAL & REHABILITATION CENTER: white and teal, a lit green cross, a drone pad on the roof, a glass atrium
    const du = Math.round(w * 0.42), S = { c: 0xece8de, seed, pw: 8, ph: 6, band: 10, bandC: FTEAL[0], strip: 21, wins: { 1: [], 2: [] }, door: { f: 1, u: du, w: 9, h: 12 } };
    for (let u = 4; u + 5 < w - 3; u += 10) if (u + 5 < du - 6 || u > du + 12) S.wins[1].push({ u, v: 4, w: 5, h: 4.6, lit: 1, blind: 1 }, { u, v: 13, w: 5, h: 4.6, lit: 1 });
    for (let u = 4; u + 5 < d - 3; u += 9) S.wins[2].push({ u, v: 4, w: 5, h: 4.6, lit: 1 }, { u, v: 13, w: 5, h: 4.6, lit: 1 });
    plinth(); B.push(HB(0, 0, 2, w, d, 22, S.c, panelP(S)));
    B.push(HB(du - 3, d - 1, 2, 15, 7, 16, FGLASS, fGlassP(true, seed)), HB(du - 3.6, d - 1.6, 18, 16.2, 8.2, 1.2, 0xe0dccf));                           // the atrium
    B.push(HB(-1, -1, 24, w + 2, d + 2, 1.6, FTEAL[1]), HB(6, 6, 25.6, w - 12, d - 12, 8, 0xe4e0d6, panelP({ c: 0xe4e0d6, seed: seed + 3, pw: 6, ph: 4, strip: 7 })));
    const pz = 33.6; B.push(HB(w / 2 - 9, d / 2 - 9, pz, 18, 18, 1, 0x5a5e66, (f, u, v) => { if (f !== 0) return FGRAPH; const r = Math.hypot(u - 9, v - 9); if (r > 8.2 && r < 8.9) return 0xe8e4da; if ((Math.abs(u - 6) < 0.8 || Math.abs(u - 12) < 0.8) && Math.abs(v - 9) < 4.2 || (Math.abs(v - 9) < 0.7 && u > 6 && u < 12)) return 0xe8e4da; return 0x5a5e66; }));   // the landing pad with its H
    for (const [x, y] of [[w / 2 - 9, d / 2 - 9], [w / 2 + 8, d / 2 - 9], [w / 2 - 9, d / 2 + 8], [w / 2 + 8, d / 2 + 8]]) B.push(HB(x, y, pz + 1, 1, 1, 0.8, FOK, lightP(FOK)));
    B.push(HB(du + 1.5, d + 0.3, 18, 7, 0.6, 7, 0xffffff, (f, u, v) => { const cx = Math.abs(u - 3.5), cy = Math.abs(v - 3.5); if ((cx < 1 && cy < 3) || (cy < 1 && cx < 3)) { EM = 0x8af0a0; return 0x4ac86a; } return 0xf4f2ec; }));   // the lit green cross
    b.H = pz + 4;
  } else if (b.kind === 'barracks') {  // DEFENSE COMMAND & TRAINING: an armoured hall, raked plates, a radar dish and a comms mast, amber stripes
    const S = { c: 0x8a8a7e, seed, pw: 9, ph: 5, band: 3, bandC: FAMBER, wins: { 1: [{ u: 6, v: 9, w: 12, h: 2.4, lit: 1 }, { u: w - 18, v: 9, w: 12, h: 2.4, lit: 1 }] }, door: { f: 1, u: 30, w: 9, h: 11, warn: 1 }, patch: 1, streak: 1 };
    plinth(); B.push(HB(0, 0, 2, w, d, 15, S.c, panelP(S)));
    for (let k = 0; k < 4; k++) B.push(HB(-1.5 + k * 1.6, -1.5 + k * 1.6, 17 + k * 2, w + 3 - k * 3.2, d + 3 - k * 3.2, 2, mixc(0x7a7a70, 0x2b1a16, k * 0.05), fMetalP(0x7a7a70, seed + k)));   // raked armour plates
    B.push(HB(29.4, d - 0.6, 2, 10.2, 1, 1.2, 0xd8d0b8, hazardP(FGRAPH)));
    fDish(B, w - 12, d / 2, 25, 4.4); fAntenna(B, 6, 6, 25, 22, true); fAntenna(B, 10, 9, 25, 14, false);
    b.H = 48;
  } else if (b.kind === 'workshop') {  // FABRICATION & ROBOTICS REPAIR: an open bay under a sawtooth skylight roof, a gantry crane and a robot arm
    plinth();
    B.push(HB(0, 0, 2, w, 2, 16, FCOMP[3], panelP({ c: FCOMP[3], seed, pw: 6, ph: 5, strip: 14 }))); B.push(HB(0, 0, 2, 2, d, 16, FCOMP[3], panelP({ c: FCOMP[3], seed: seed + 1, pw: 6, ph: 5 })));
    for (let x = 0; x <= w - 1; x += 10) B.push(HB(Math.min(x, w - 1.4), d - 1.4, 2, 1.4, 1.4, 16, FGRAPH_L));
    for (let x = 0, i = 0; x < w; x += 8, i++) { B.push(HB(x, -1, 18, 8, d + 2, 1.4, FGRAPH, fMetalP(FGRAPH, seed))); B.push(HB(x, -1, 19.4, 8, d * 0.4, 3.4, FGLASS, fGlassP(true, seed + i)), HB(x, d * 0.4 - 1, 19.4, 8, d * 0.6 + 2, 1.4, 0x8a8a8e, fMetalP(0x8a8a8e, i))); }   // sawtooth: glazed faces catch the light
    B.push(HB(4, d * 0.5, 15, w - 8, 1.2, 1.2, FAMBER, hazardP(FGRAPH)), HB(4, d * 0.5 - 4, 15, 1, 9, 1, FGRAPH), HB(w - 5, d * 0.5 - 4, 15, 1, 9, 1, FGRAPH));   // the gantry
    B.push(HB(w * 0.55, d * 0.5 - 0.6, 10, 2, 2, 5, FGRAPH_L), HB(w * 0.55 + 0.6, d * 0.5, 4, 0.8, 0.8, 6, 0x9a9ea6));                                 // the hoist
    B.push(HB(10, d * 0.35, 2, 3, 3, 3, 0xe8a83a, fMetalP(0xe8a83a, 1)), HB(10.6, d * 0.35 + 0.6, 5, 1.6, 1.6, 6, 0xd8962e), HB(11, d * 0.35, 10.4, 6, 1.2, 1.2, 0xd8962e), HB(16.2, d * 0.35 - 0.4, 8, 1.6, 2, 2.6, FGRAPH));   // an orange robot arm
    b.H = 24;
  } else if (b.kind === 'stable') {    // the MOBILITY DEPOT: a solar canopy over charging bays, a control booth, cable reels
    plinth(1);
    for (let x = 0; x <= w - 1; x += 11) for (const y of [0, d - 1.2]) B.push(HB(Math.min(x, w - 1.2), y, 1, 1.2, 1.2, 14, FGRAPH_L));
    B.push(HB(0, 0, 1, 10, d, 11, FCOMP[1], panelP({ c: FCOMP[1], seed, pw: 5, ph: 4, wins: { 2: [{ u: 3, v: 5, w: 8, h: 4, lit: 1 }] }, door: { f: 1, u: 2, w: 5, h: 9 } })));
    const top = fSolarRoof(B, -2, -2, 15, w + 4, d + 4, 6, seed);
    for (let x = 14; x < w - 4; x += 9) B.push(HB(x, 1.6, 1, 1.4, 1.4, 5, FGRAPH, (f, u, v) => v > 3.8 ? (EM = FOK, FOK) : FGRAPH));                     // charging posts
    B.push(HB(w - 6, d - 6, 1, 4, 4, 2.6, 0xd8962e, (f, u, v) => f === 0 ? 0x2e2e34 : 0xd8962e));
    b.H = top;
  } else if (b.kind === 'barn' || b.kind === 'farmbarn') {   // the stores: a ribbed storage hangar (a gutted one out at the old farm)
    const ruin = b.kind === 'farmbarn';
    plinth(); B.push(HB(0, 0, 2, w, d, 10, ruin ? 0x8a8478 : FCOMP[3], panelP({ c: ruin ? 0x8a8478 : FCOMP[3], seed, pw: 5, ph: 4, door: ruin ? null : { f: 1, u: w / 2 - 5, w: 10, h: 9, c: 0x8a6a50 }, moss: ruin, patch: 1 })));
    if (ruin) { B.push(HB(0, 0, 12, w * 0.5, d, 4, 0x7a7468, fMetalP(0x7a7468, seed)), HB(w * 0.5, 2, 12, 1, d - 4, 8, FGRAPH_D)); for (let x = w * 0.5 + 3; x < w; x += 4) B.push(HB(x, 0, 12, 0.8, d, 0.8, FGRAPH)); }
    else fVault(B, -1.5, -1.5, 12, w + 3, d + 3, 6, 0xa8a090, seed, 4);
  } else if (b.kind === 'kitchen') {   // the COMMUNITY FOOD HUB: an open canopy, steel counters, extractor hoods (the steam is drawn live)
    plinth();
    for (const [x, y] of [[0, 0], [w - 1.2, 0], [0, d - 1.2], [w - 1.2, d - 1.2], [w / 2, 0], [w / 2, d - 1.2]]) B.push(HB(x, y, 2, 1.2, 1.2, 12, FGRAPH_L));
    B.push(HB(1, 1, 2, w - 2, 3, 4.6, 0xb8bcc4, fMetalP(0xb8bcc4, seed)), HB(w / 2 - 5, d / 2 - 2, 2, 10, 4, 4.4, 0xc8ccd2, fMetalP(0xc8ccd2, seed + 1)), HB(w / 2 - 4, d / 2 - 1.6, 6.4, 8, 3.2, 0.4, 0x2e2e34));
    B.push(HB(w / 2 - 3, d / 2 - 1.2, 10, 6, 2.4, 2, 0x9a9ea6), HB(w / 2 - 1, d / 2 - 0.4, 12, 2, 1, 4, 0x8a8e96));
    const top = fSolarRoof(B, -2.5, -2.5, 14, w + 5, d + 5, 5, seed); B.push(HB(-2.5, d + 2.3, 13.4, w + 5, 0.4, 0.4, FLED, lightP(FLED))); b.chim = [w / 2, d / 2, top];
  } else if (b.kind === 'ruin') {      // the old world's wreckage out in the wilds: a gutted module, frame exposed, overgrown
    B.push(HB(0, 0, 0, w, d, 10, 0xa8a296, panelP({ c: 0xa8a296, seed, pw: 6, ph: 5, moss: 1, patch: 1, streak: 1, wins: { 1: [{ u: 5, v: 4, w: 5, h: 4 }] } })));
    B.push(HB(2, 2, 10, w * 0.5, d - 4, 2, 0x8a8478), HB(w * 0.5, d * 0.3, 0, 8, 10, 3, 0x6a6a64)); for (let x = 3; x < w - 2; x += 6) B.push(HB(x, d - 2, 10, 0.8, 0.8, 6 + hs(x, seed) * 6, FGRAPH));
  } else if (b.kind === 'collapsed') { // a fallen transmission tower over a shattered dome
    fDome(B, w / 2, d / 2, 0, Math.min(w, d) / 2 - 1, 4, 0x9a968c, fMetalP(0x9a968c, seed)); for (let i = 0; i < 6; i++) B.push(HB(2 + i * 5, d * 0.3 + i, 2 + i * 2, 1, 1, 14 - i * 1.5, FGRAPH_L));
    B.push(HB(0, d * 0.6, 0, w, 1.4, 1.4, FGRAPH), HB(w * 0.1, d * 0.62, 1.4, 1, 1, 6, FGRAPH));
  } else if (b.kind === 'block') {     // the old town: towers of a dead high-tech city, cladding gone, frames showing, plants on the ledges
    const h = b.h, cl = sp(R, [0xa8a296, 0x9a968c, 0xb4ae9e]);
    B.push(HB(0, 0, 0, w, d, h * 0.6, cl, panelP({ c: cl, seed, pw: 5, ph: 5, moss: 1, streak: 1, patch: 1, wins: { 1: [{ u: 3, v: 6, w: 6, h: 4 }, { u: 12, v: 6, w: 6, h: 4 }, { u: 3, v: 14, w: 6, h: 4 }], 2: [{ u: 4, v: 10, w: 6, h: 4 }] } })));
    for (let x = 1; x < w - 1; x += 5) B.push(HB(x, 1, h * 0.6, 0.9, 0.9, h * (0.12 + hs(x, seed) * 0.35), FGRAPH));                                     // bare frame on top
    B.push(HB(1, d - 2, h * 0.6, w - 2, 1, 1, FGRAPH), HB(w * 0.2, d + 1, 0, 8, 6, 3, 0x8a8478), HB(w * 0.6, d + 2, 0, 6, 5, 2, 0x7a7468));
  } else return null;
  return B;
}

// ---------------------------------------------------------------- props (same kinds and footprints as Current; rebuilt from salvaged technology)
const fCrate = (x, y, z, w, d, h, c, seed) => HB(x, y, z, w, d, h, c, (f, u, v) => { if (f === 0) return mixc(c, 0xfff4e0, 0.12); const W = f === 1 ? w : d; if (u < 0.4 || u > W - 0.4 || v < 0.4 || v > h - 0.4) return mixc(c, 0x2b1a16, 0.3); if (Math.abs(v - h / 2) < 0.3) return FAMBER; return hs(Math.floor(u * 2) + seed, f) > 0.92 ? mixc(c, 0xffffff, 0.2) : c; });
const fPost = (x, y, h, c) => HB(x - 0.4, y - 0.4, 0, 0.8, 0.8, h, c || FGRAPH_L);
const fLamp = (h, c) => [HB(-0.5, -0.5, 0, 1, 1, h, FGRAPH_L, fMetalP(FGRAPH_L, 2)), HB(-0.6, -2.4, h - 0.8, 1.2, 3, 0.8, FGRAPH), HB(-0.5, -2.2, h - 1.2, 1, 1.4, 0.4, c || FLED, lightP(c || FLED)), HB(-0.8, -0.8, 0, 1.6, 1.6, 1.4, FGRAPH)];
const fRing = (B, r, n, z, h, c) => { for (let a = 0; a < n; a++) B.push(HB(Math.cos(a / n * TAU) * r - 1, Math.sin(a / n * TAU) * r - 0.6, z, 2, 1.2, h, c)); };
const FPROPS = {
  lamp: () => fLamp(22),
  lantern: () => [HB(-0.4, -0.4, 0, 0.8, 0.8, 9, FGRAPH_L), HB(-0.9, -0.9, 9, 1.8, 1.8, 2, FLED, lightP(FLED)), HB(-1, -1, 11, 2, 2, 0.6, FSOLAR, solarP(3))],
  pole: () => [HB(-0.8, -0.8, 0, 1.6, 1.6, 32, FGRAPH_L, fMetalP(FGRAPH_L, 5)), HB(-4, -0.3, 28, 8, 0.6, 0.6, FGRAPH), HB(-3.6, -0.4, 28.6, 0.8, 0.8, 1.2, 0xd8d4cc), HB(2.8, -0.4, 28.6, 0.8, 0.8, 1.2, 0xd8d4cc), HB(-0.6, -1.4, 22, 1.2, 0.8, 2.4, FGRAPH, (f, u, v) => v > 1.8 ? (EM = FCYAN, FCYAN) : FGRAPH)],
  car: (o) => { const c = sp(mulberry32((o.x | 0) + 7), [0xd8d2c4, 0x9ab0b0, 0xc8a47a, 0x8a8e96, 0xb85a4a]);
    if (o.wreck) return [HB(0, 0, 0, 16, 8, 3.4, mixc(c, 0x6a5a48, 0.4), panelP({ c: mixc(c, 0x6a5a48, 0.4), seed: 5, pw: 4, ph: 3, moss: 1, patch: 1 })), HB(4, 1, 3.4, 7, 6, 2, 0x4a5a60), HB(13, 1, 0, 3, 2, 1.2, FGRAPH)];
    const B = []; futRoverBoxes(B, 0, 0.5, c, o.x | 0); return B; },
  truck: () => { const B = [HB(0, 0, 0, 22, 9, 2, FGRAPH, fMetalP(FGRAPH, 9))]; for (const x of [1.5, 8, 17]) for (const y of [-0.4, 8.5]) B.push(HB(x, y, 0, 3, 0.9, 3, 0x2e2e34));
    B.push(HB(0, 0, 2, 7, 9, 7, 0xc8a47a, panelP({ c: 0xc8a47a, seed: 4, pw: 3, ph: 3, wins: { 2: [{ u: 1.4, v: 3, w: 6, h: 3 }] } })), HB(8, 0.4, 2, 14, 8.2, 6.6, 0xd8d2c4, panelP({ c: 0xd8d2c4, seed: 8, pw: 4.6, ph: 3.3, band: 3, bandC: FTEAL[0] })), HB(9, 1, 8.6, 12, 7, 0.6, FSOLAR, solarP(2))); return B; },
  bus: () => { const B = [HB(0, 0, 0, 46, 11, 2, 0x8a8478)];   // an old maglev carriage, overgrown
    B.push(HB(0, 0, 2, 46, 11, 11, 0xc8c2b4, panelP({ c: 0xc8c2b4, seed: 12, pw: 5, ph: 5, moss: 1, streak: 1, patch: 1, band: 2, bandC: 0x9a5a4a, wins: { 1: [0, 1, 2, 3, 4, 5, 6].map(i => ({ u: 3 + i * 6, v: 4.6, w: 4.6, h: 4 })) } })));
    fVault(B, 0, 0, 13, 46, 11, 3, 0xa8a296, 3, 0); for (let x = 14; x < 34; x += 5) B.push(HB(x, -0.4, 0, 0.8, 0.8, 5 + hs(x, 3) * 4, FMOSS)); return B; },
  gasstation: () => { const B = [HB(0, 0, 0, 44, 30, 1.4, 0x8a8e94, fMetalP(0x8a8e94, 3))];   // a charging station under a solar canopy
    for (const [x, y] of [[4, 6], [4, 22], [38, 6], [38, 22]]) B.push(HB(x, y, 1.4, 1.2, 1.2, 15, FGRAPH_L)); fSolarRoof(B, -2, -2, 16.4, 48, 34, 7, 11);
    for (let i = 0; i < 3; i++) B.push(HB(12 + i * 9, 12, 1.4, 3, 2, 7, 0xe0dccf, (f, u, v) => { if (f === 1 && v > 4 && v < 6) { EM = FOK; return FOK; } if (f === 1 && v > 1.4 && v < 3.4 && u > 0.6 && u < 2.4) { EM = FCYAN; return 0x3a6a8a; } return f === 0 ? FGRAPH : 0xe0dccf; }), HB(12.6 + i * 9, 14, 2, 0.4, 3, 0.4, FGRAPH_D));
    B.push(HB(0, 28, 1.4, 44, 2, 1, FAMBER, hazardP(FGRAPH))); return B; },
  silo: () => { const B = []; fCyl(B, 6, 6, 0, 5.4, 24, 0xc8c2b4, fMetalP(0xc8c2b4, 4)); fDome(B, 6, 6, 24, 5.4, 3, 0xb8b2a4, fMetalP(0xb8b2a4, 4)); B.push(HB(11, 5.5, 0, 1, 1, 26, FGRAPH)); return B; },
  mast: () => { const B = []; for (const [x, y] of [[0, 0], [5, 0], [0, 5], [5, 5]]) B.push(HB(x, y, 0, 1, 1, 34, FGRAPH_L)); for (let z = 6; z < 34; z += 7) B.push(HB(0, 0, z, 6, 6, 0.6, FGRAPH)); B.push(HB(1.5, 1.5, 34, 3, 3, 12, FGRAPH_L)); fDish(B, 3, 0, 38, 3); fAntenna(B, 3, 3, 46, 8, true); return B; },
  shed: () => { const B = [HB(0, 0, 0, 14, 12, 8, FCOMP[3], panelP({ c: FCOMP[3], seed: 3, pw: 4.5, ph: 4, door: { f: 1, u: 4, w: 6, h: 7 } }))]; fSolarRoof(B, -1, -1, 8, 16, 14, 3, 5); return B; },
  rv: () => [HB(0, 0, 0, 28, 11, 1.6, FGRAPH), HB(0, 0, 1.6, 28, 11, 11, 0xe0dccf, panelP({ c: 0xe0dccf, seed: 6, pw: 6, ph: 5.5, strip: 10, wins: { 1: [{ u: 3, v: 4, w: 6, h: 4, lit: 1 }, { u: 18, v: 4, w: 6, h: 4, lit: 1 }] }, door: { f: 1, u: 11, w: 5, h: 9 } })), HB(1, 1, 12.6, 26, 9, 0.8, FSOLAR, solarP(6))],   // a habitation module
  tent: (o) => { const c = [0xd8c8a8, 0x9ab8b0, 0xc8a47a, 0xb8b4a8][(o.c || 0) % 4], B = [HB(0, 0, 0, 14, 12, 1, FGRAPH)]; fVault(B, 0, 0, 1, 14, 12, 5, c, o.c || 1, 3.5); B.push(HB(5, 11.6, 1, 4, 0.4, 5, FGRAPH_D)); return B; },   // a modular shelter pod
  messtent: () => { const B = []; for (const [x, y] of [[0, 0], [38, 0], [0, 24], [38, 24], [19, 0], [19, 24]]) B.push(HB(x, y, 0, 1, 1, 14, FGRAPH_L)); fVault(B, -1, -1, 14, 40, 27, 5, 0xd8d0bc, 4, 5); B.push(HB(-1, 25.6, 13.4, 40, 0.4, 0.4, FLED, lightP(FLED))); return B; },
  flagpole: () => [HB(-0.6, -0.6, 0, 1.2, 1.2, 30, 0xd8d4cc, fMetalP(0xd8d4cc, 2)), HB(0.6, -0.2, 20, 9, 0.4, 7, FTEAL[0], (f, u, v) => (u > 3.5 && u < 5.5 && v > 2 && v < 5) ? 0xe8e0c8 : ((u + v) % 3 < 0.4 ? mixc(FTEAL[0], 0, 0.2) : FTEAL[0])), HB(-0.5, -0.5, 30, 1, 1, 1, FRED, lightP(FRED))],
  bikerack: () => { const B = [HB(0, 0, 0, 14, 1.6, 1, FGRAPH)]; for (let k = 0; k < 4; k++) { B.push(HB(1 + k * 3.4, 0.3, 1, 0.6, 1, 4, FGRAPH_L)); B.push(HB(1.6 + k * 3.4, -2.4, 0, 1, 5, 3.4, [0xd8962e, 0x4a7f80, 0xc8c2b4, 0x9a5a4a][k], (f, u, v) => v > 2.6 ? 0x2e2e34 : undefined)); } return B; },
  schoolarch: () => { const W = 30; return [HB(-W / 2, 0, 0, 2, 2, 16, 0xe0dccf, panelP({ c: 0xe0dccf, seed: 1, pw: 2, ph: 4 })), HB(W / 2 - 2, 0, 0, 2, 2, 16, 0xe0dccf, panelP({ c: 0xe0dccf, seed: 2, pw: 2, ph: 4 })), HB(-W / 2, -0.2, 16, W, 2.4, 2.6, FTEAL[1], (f, u, v) => (f === 1 && v > 0.8 && v < 1.8 && u > 4 && u < W - 4) ? (EM = FCYAN, FCYAN) : FTEAL[1])]; },
  crates: () => [fCrate(0, 0, 0, 5, 4.4, 3.6, 0x6a8a8a, 1), fCrate(5.5, 0.5, 0, 4.4, 4.4, 3, 0xc8a47a, 2), fCrate(1, 0.6, 3.6, 3.6, 3, 2.6, 0xd8d2c4, 3)],
  bell: () => [HB(0, 0, 0, 1.2, 1.2, 15, FGRAPH_L), HB(3.6, 0, 0, 1.2, 1.2, 15, FGRAPH_L), HB(-0.2, -0.2, 15, 5.4, 1.6, 1, FGRAPH), HB(1, -0.6, 11, 3, 2.6, 3.6, FAMBER, (f, u, v) => { if (v > 1 && v < 2.6) { EM = FRED; return FRED; } return f === 0 ? FGRAPH : FAMBER; })],   // the alarm beacon
  stall: (o) => { const c = [0x4a7f80, 0xc8a47a, 0x9a5a4a, 0x6a8a5a, 0xd8962e, 0x7a6a9a][(o.c || 0) % 6];   // a supply-exchange kiosk with its price screen
    return [HB(0, 0, 0, 12, 7, 3.4, 0xc8c2b4, fMetalP(0xc8c2b4, o.c || 0)), HB(0.4, 0.4, 3.4, 11.2, 6.2, 0.4, 0x9a9ea6), HB(0, 0, 0, 0.8, 0.8, 11, FGRAPH_L), HB(11.2, 0, 0, 0.8, 0.8, 11, FGRAPH_L), HB(0, 6.2, 0, 0.8, 0.8, 11, FGRAPH_L), HB(11.2, 6.2, 0, 0.8, 0.8, 11, FGRAPH_L),
      HB(-0.8, -0.8, 11, 13.6, 8.6, 1, c, (f, u, v) => f === 0 ? ((u * 0.6 | 0) % 2 ? c : mixc(c, 0xfff4e0, 0.2)) : c), HB(3, 6.8, 7.4, 6, 0.4, 2.6, 0x3a5a7a, screenP(0x7ac8e8, o.c || 0))]; },
  table: () => [HB(0, 0, 3, 20, 7, 0.8, 0xd8d2c4, fMetalP(0xd8d2c4, 1)), HB(1, 1, 0, 1, 1, 3, FGRAPH), HB(18, 5, 0, 1, 1, 3, FGRAPH), HB(0, -3, 0, 20, 2, 2.4, FTEAL[1], fMetalP(FTEAL[1], 3)), HB(0, 8, 0, 20, 2, 2.4, FTEAL[1], fMetalP(FTEAL[1], 4))],
  bench: () => [HB(0, 0, 0, 10, 3, 2.4, 0xb88a64, fMetalP(0xb88a64, 2)), HB(0, 2.4, 2.4, 10, 0.6, 3, 0xb88a64, fMetalP(0xb88a64, 3)), HB(0.5, 0.5, 0, 0.6, 2, 2.4, FGRAPH), HB(8.9, 0.5, 0, 0.6, 2, 2.4, FGRAPH)],
  swings: () => [HB(0, 0, 0, 1.2, 1.2, 16, FTEAL[0]), HB(18, 0, 0, 1.2, 1.2, 16, FTEAL[0]), HB(-0.4, -0.2, 16, 20, 1.6, 1.6, FAMBER, fMetalP(FAMBER, 1)), HB(5.6, 0.2, 5, 3, 1, 0.6, 0xd9534f), HB(12, 0.2, 5, 3, 1, 0.6, 0xf2c94c), HB(6.8, 0.6, 5.6, 0.2, 0.2, 10.4, 0x8a8e96), HB(13.2, 0.6, 5.6, 0.2, 0.2, 10.4, 0x8a8e96)],
  slide: () => { const B = [HB(0, 0, 0, 4, 4, 9, FTEAL[2], fMetalP(FTEAL[2], 1))]; for (let k = 0; k < 4; k++) B.push(HB(4 + k * 3, 0.6, 7 - k * 2.2, 3, 2.8, 1.6, FAMBER)); fDome(B, 2, 2, 9, 2.6, 2, 0xd9534f); return B; },
  sandbox: () => [HB(0, 0, 0, 12, 12, 1.4, 0xd8c8a0, (f, u, v) => (u < 1 || v < 1 || u > 11 || v > 11) ? FTEAL[0] : (f === 0 ? (vnoise(u, v) > 0.5 ? 0xe8d8b0 : 0xd8c8a0) : FTEAL[0]))],
  seesaw: () => [HB(4.2, 0.4, 0, 1.6, 2, 2.4, FGRAPH), HB(0, 0.8, 2, 10, 1.2, 0.8, FAMBER, fMetalP(FAMBER, 2))],
  rack: () => { const B = [HB(0, 0, 0, 10, 2, 1, FGRAPH), HB(0, 0, 7, 10, 2, 0.8, FGRAPH)]; for (let k = 0; k < 4; k++) B.push(HB(0.8 + k * 2.4, 0.4, 1, 1.4, 1.2, 8, [0x8a8e96, FAMBER, 0x8a8e96, FTEAL[0]][k], fMetalP(0x8a8e96, k))); return B; },   // a tool and charger rack
  scrap: () => [HB(0, 0, 0, 10, 8, 1.6, 0x6a6a70, fMetalP(0x6a6a70, 2)), HB(2, 2, 1.6, 4, 3, 2.4, 0x5a6270, fMetalP(0x5a6270, 3)), HB(6.4, 3.4, 1.6, 2.4, 2.4, 1.6, FCOPPER), HB(1, 5, 1.6, 3, 1, 3, FGRAPH_L), HB(3, 2.6, 4, 1.4, 1.4, 1, 0xd8962e)],   // salvage: machine parts
  drumfire: () => [HB(-2.4, -2.4, 0, 4.8, 4.8, 3, FGRAPH, fMetalP(FGRAPH, 5)), HB(-1.8, -1.8, 3, 3.6, 3.6, 0.8, 0x3a2420, (f, u, v) => { EM = 0xff8a40; return ((u + v) * 1.4 | 0) % 2 ? 0xff9a3a : 0xc8501e; }), HB(-2.6, -2.6, 3.8, 5.2, 5.2, 0.4, FGRAPH_L)],   // an induction heater, its coil glowing
  firepit: () => { const B = [HB(-7, -7, 0, 14, 14, 1, 0x9a968c, fMetalP(0x9a968c, 3))]; fRing(B, 6, 8, 1, 1.8, 0xb88a64); B.push(HB(-2, -2, 1, 4, 4, 1.4, FGRAPH), HB(-1.4, -1.4, 2.4, 2.8, 2.8, 0.5, 0x3a2420, (f) => { EM = 0xff9050; return 0xff8a3a; })); return B; },   // the commons' heat ring
  memorial: () => { const B = [HB(-1, 5, 0, 17, 4, 0.8, 0xc8c2b2)]; for (let i = 0; i < 5; i++) B.push(HB(i * 3.2, (i % 2) * 1.5, 0, 1.6, 1.6, 6 + (i % 3) * 2.4, 0xe8e2d2, (f, u, v, b) => v > b.h - 1.4 ? (EM = 0xffe6b0, 0xfff0c8) : (v % 2 < 0.3 ? 0xc8c2b2 : 0xe8e2d2))); return B; },
  watertower: () => { const B = []; for (const [x, y] of [[0, 0], [9, 0], [0, 9], [9, 9]]) B.push(HB(x, y, 0, 1.4, 1.4, 30, FGRAPH_L)); B.push(HB(0, 0, 14, 10.4, 10.4, 0.6, FGRAPH)); fCyl(B, 5.2, 5.2, 30, 6.4, 10, 0xd8d2c4, panelP({ c: 0xd8d2c4, seed: 4, pw: 3, ph: 3.4, band: 7, bandC: FTEAL[0] })); B.push(HB(-1.2, -1.2, 40, 12.8, 12.8, 0.8, FSOLAR, solarP(9))); fAntenna(B, 5, 5, 40.8, 6, true); return B; },   // the condenser tower
  turbine: () => [HB(-1, -1, 0, 2, 2, 42, 0xe0dccf, fMetalP(0xe0dccf, 6)), HB(-1.6, -2.4, 40, 3.2, 4.8, 3, 0xd8d2c4), HB(-0.4, 2.4, 41, 0.8, 0.8, 14, 0xe8e4dc), HB(-0.4, 2.4, 31, 0.8, 0.8, 10, 0xe8e4dc), HB(-0.4, 2.4, 41.4, 0.8, 9, 0.8, 0xe8e4dc)],
  greenhouse: () => { const B = [HB(0, 0, 0, 25, 15, 1.4, 0x9a968c)]; fGlassVault(B, 0, 0, 1.4, 25, 15, 6, false, 3); for (let x = 2; x < 23; x += 4) B.push(HB(x, 2, 1.4, 2.6, 11, 1.6, FGREEN, (f) => f === 0 ? 0x7aa64a : FGRAPH)); return B; },   // a hydroponic dome
  coop: () => { const B = [HB(0, 0, 0, 14, 10, 6, FCOMP[1], panelP({ c: FCOMP[1], seed: 2, pw: 3.5, ph: 3, wins: { 1: [{ u: 2, v: 2, w: 3, h: 2.4, lit: 1 }] }, door: { f: 1, u: 8, w: 3, h: 4 } }))]; fVault(B, -1, -1, 6, 16, 12, 3, FTEAL[2], 2, 3); return B; },
  pen: () => { const B = []; for (let i = 0; i <= 4; i++) B.push(HB(i * 6, 0, 0, 0.8, 0.8, 6, FGRAPH_L), HB(i * 6, 14, 0, 0.8, 0.8, 6, FGRAPH_L)); for (const y of [0.1, 14.1]) B.push(HB(0, y, 4.6, 24.8, 0.6, 0.6, FAMBER), HB(0, y, 2.2, 24.8, 0.6, 0.6, 0xc8c2b4)); return B; },
  hive: () => [HB(0, 0, 0, 2.4, 2.4, 1.4, FGRAPH), HB(-0.6, -0.2, 1.4, 3.6, 2.8, 3.6, 0xe8c84a, (f, u, v) => (f !== 0 && (v * 1.6 | 0) % 2) ? 0xd8b03a : 0xe8c84a), HB(-0.8, -0.4, 5, 4, 3.2, 0.6, FSOLAR, solarP(1))],
  smokehouse: () => [HB(0, 0, 0, 12, 10, 9, 0xc8ccd2, panelP({ c: 0xc8ccd2, seed: 7, pw: 4, ph: 3, vent: { f: 2, u: 5, v: 6 } })), HB(-0.5, -0.5, 9, 13, 11, 1, FGRAPH), HB(4, 3, 10, 3, 3, 4, 0x9a9ea6)],   // a food-processing unit
  fence: (o) => [HB(0, 0, 0, o.w, 0.6, 5, 0x8a8e94, (f, u, v) => { if (f === 0) return 0x9a9ea6; if ((u % 4) < 0.5) return FGRAPH; if (v > 4.2) return 0x9a9ea6; return ((u * 2 + v * 2) | 0) % 2 ? -1 : 0x8a8e94; })],
  bed: (o) => [HB(0, 0, 0, 8, 16, 3, 0xd8d2c4, (f, u, v) => { if (f !== 0) return v > 2.2 ? FTEAL[0] : 0xc8c2b4; if (u < 0.6 || u > 7.4 || v < 0.6 || v > 15.4) return 0xc8c2b4; return (v * 1.2 | 0) % 2 ? [0x5a8a4a, 0x6aa244, 0x7a9a44, 0x4f8a3a][(o.v || 0) % 4] : 0x2e3e3a; })],   // a raised hydroponic trough
  barrel: () => [HB(-1.6, -1.6, 0, 3.2, 3.2, 5, FTEAL[1], (f, u, v) => f === 0 ? FGRAPH : (v > 3.6 && v < 4.2 ? FAMBER : ((u * 1.4 | 0) % 3 ? FTEAL[1] : mixc(FTEAL[1], 0, 0.2))))],   // a battery cell / water drum
  laundry: (o) => { const ax = o.along !== 'y', B = ax ? [HB(0, 0, 0, 0.8, 0.8, 14, FGRAPH_L), HB(o.w, 0, 0, 0.8, 0.8, 14, FGRAPH_L), HB(0, 0.2, 13, o.w + 1, 0.3, 0.3, 0xd8d4cc)] : [HB(0, 0, 0, 0.8, 0.8, 14, FGRAPH_L), HB(0, o.w, 0, 0.8, 0.8, 14, FGRAPH_L), HB(0.2, 0, 13, 0.3, o.w + 1, 0.3, 0xd8d4cc)];
    for (let i = 0; i * 6 + 6 < o.w; i++) { const c = [0xe8e4dc, 0x9ab8b0, 0xd8962e, 0xc8a47a, 0x7a8aa8][(i + (o.x | 0)) % 5], hh = 7 - (i % 2) * 1.5; B.push(ax ? HB(2 + i * 6, 0, 13 - hh, 4.6, 0.4, hh, c) : HB(0, 2 + i * 6, 13 - hh, 0.4, 4.6, hh, c)); } return B; },
  woodpile: () => [fCrate(0, 0, 0, 4, 3, 3, FTEAL[0], 1), fCrate(4.4, 0, 0, 4, 3, 3, FGRAPH_L, 2), fCrate(1.8, 0.2, 3, 4, 2.6, 2.4, 0xc8a47a, 3)],   // a stack of battery and parts cases
  bike: () => [HB(0, 0, 0, 6, 0.8, 2.6, 0x2e2e34, (f, u, v) => { const r = Math.hypot((u % 4.4) - 1.3, v - 1.3); return r < 1.3 && r > 0.7 ? 0x2e2e34 : -1; }), HB(1.2, 0.1, 1.6, 3.6, 0.6, 1, 0xd8962e), HB(1.6, 0, 2.6, 1.6, 0.6, 0.6, FGRAPH)],
  mailbox: () => [HB(-0.6, -0.6, 0, 1.2, 1.2, 6, FGRAPH), HB(-1.6, -1.2, 6, 3.2, 2.4, 4, 0xd8d2c4, (f, u, v) => (f === 1 && v > 2.8 && v < 3.4) ? (EM = FOK, FOK) : ((v * 1.2 | 0) % 2 ? 0xc8c2b4 : 0xd8d2c4))],   // a parcel locker for the drones
  bins: () => [HB(0, 0, 0, 3.2, 3, 4, 0x4a7f80, fMetalP(0x4a7f80, 1)), HB(3.6, 0, 0, 3.2, 3, 4, 0xd8962e, fMetalP(0xd8962e, 2)), HB(7.2, 0, 0, 3.2, 3, 4, 0x6a8a5a, fMetalP(0x6a8a5a, 3))],   // sorting bins
  hedgehog: () => [HB(-2.4, -0.4, 0, 4.8, 0.8, 1, FGRAPH_L), HB(-0.4, -2.4, 0, 0.8, 4.8, 1, FGRAPH_L), HB(-0.6, -0.6, 0, 1.2, 1.2, 6, 0x6a6a74, fMetalP(0x6a6a74, 1)), HB(-0.5, -0.5, 6, 1, 1, 0.8, FRED, lightP(FRED))],   // an anti-machine obstacle with a sensor tip
  rock: (o) => PROPS.rock(o), stump: (o) => PROPS.stump(o),
  forge: () => [HB(0, 0, 0, 10, 8, 5, 0xc8ccd2, fMetalP(0xc8ccd2, 4)), HB(1.4, 1.4, 5, 7.2, 5.2, 0.4, 0x2e2e34, (f) => { EM = 0xffa050; return 0xff9a3a; }), HB(0, 0, 5.4, 10, 1, 4, FGRAPH_L), HB(2, 0.5, 9.4, 6, 6, 1.4, 0x9a9ea6), HB(8.6, 6.4, 0, 1.4, 1.4, 8, FGRAPH, (f, u, v) => v > 6.4 ? (EM = FAMBER, FAMBER) : FGRAPH)],   // the fabricator
  anvil: () => [HB(-0.8, -0.4, 0, 4.4, 2.6, 3, FGRAPH, fMetalP(FGRAPH, 1)), HB(-0.4, -0.2, 3, 3.6, 2.2, 0.4, 0x9a9ea6), HB(2.6, 0.6, 3.4, 0.8, 0.8, 4, 0xd8962e), HB(0.6, 0.4, 7, 2.8, 0.8, 0.8, 0xd8962e)],   // a workbench with a small arm
  sawhorse: () => [HB(0, 0, 0, 11, 1, 8, FGRAPH, (f, u, v) => (u % 3 < 0.6 || v > 7) ? FGRAPH : -1), HB(0, 0, 8, 11, 3, 0.8, 0x9a9ea6), HB(2, 0.4, 8.8, 6, 2, 2.4, 0x5a6270, fMetalP(0x5a6270, 2))],   // a trestle with a machine housing on it
  wagon: () => { const B = [HB(-8, 2.6, 1, 26, 1, 0.8, FGRAPH), HB(-8, 6.6, 1, 26, 1, 0.8, FGRAPH), HB(2, 2, 1.8, 14, 6, 0.8, 0x9a9ea6)]; for (const x of [3, 13]) for (const y of [1.6, 7.6]) B.push(HB(x, y, 0, 2.6, 0.8, 2.6, 0x2e2e34)); B.push(fCrate(3, 2.6, 2.6, 5, 4.6, 3.4, FTEAL[0], 5), fCrate(9, 2.6, 2.6, 5, 4.6, 3, 0xc8a47a, 6)); return B; },   // a cargo trailer
  medtent: () => { const B = [HB(0, 0, 0, 18, 16, 1, 0xe0dccf)]; fVault(B, 0, 0, 1, 18, 16, 5, 0xf0ece2, 6, 4); B.push(HB(7, 15.6, 6, 4, 0.4, 4, 0xffffff, (f, u, v) => ((Math.abs(u - 2) < 0.6 && Math.abs(v - 2) < 1.6) || (Math.abs(v - 2) < 0.6 && Math.abs(u - 2) < 1.6)) ? (EM = 0x8af0a0, 0x4ac86a) : 0xf4f2ec)); return B; },
  cot: () => [HB(0, 0, 0, 6, 3.2, 1.6, FGRAPH), HB(0, 0, 1.6, 6, 3.2, 0.8, 0xe8e4dc, (f, u) => f === 0 ? (u < 1.6 ? 0xf4f2ec : 0x9ab8b0) : 0xe0dccf), HB(-0.4, 1, 1.6, 0.4, 1.2, 3, FGRAPH_L, (f, u, v) => v > 2 ? (EM = FCYAN, FCYAN) : FGRAPH_L)],   // a care bed with a monitor
  medcrates: () => [fCrate(0, 0, 0, 4, 3.6, 3, 0xf0ece2, 1), HB(0.6, 0.6, 3, 2.8, 2.4, 1, 0x4ac86a), fCrate(4.4, 0.4, 0, 3, 3, 2.4, 0xe0dccf, 2)],
  stretcher: () => [HB(0, 0, 0.5, 10, 0.5, 0.5, FGRAPH_L), HB(0, 3, 0.5, 10, 0.5, 0.5, FGRAPH_L), HB(1.5, 0.3, 0.9, 7, 3, 0.2, 0xe8e4dc)],
  chalk: () => [HB(0.6, 0.6, 0, 0.8, 0.8, 5, FGRAPH), HB(8.6, 0.6, 0, 0.8, 0.8, 5, FGRAPH), HB(0, 1, 5, 10, 0.6, 6, 0x2a4a5a, screenP(0x6ab0e0, 9))],   // a teaching screen
  goal: () => [HB(0, 0, 0, 0.8, 0.8, 6.5, 0xe8e4dc), HB(0, 9, 0, 0.8, 0.8, 6.5, 0xe8e4dc), HB(0, 0, 6.5, 0.8, 9.8, 0.8, 0xe8e4dc)],
  pighut: () => { const B = [HB(0, 0, 0, 9, 7, 4, FCOMP[2], panelP({ c: FCOMP[2], seed: 3, pw: 3, ph: 2.4 }))]; fVault(B, -0.8, -0.8, 4, 10.6, 8.6, 3, FWARM[1], 3, 2.6); return B; },
  flag: () => [HB(-0.6, -0.6, 0, 1.2, 1.2, 26, 0xd8d4cc), HB(0.6, -0.2, 17, 8, 0.4, 7, FAMBER, (f, u, v) => (u + v * 0.5) % 4 < 1.4 ? FGRAPH_D : FAMBER)],
  target: () => [HB(0.6, 0.8, 0, 0.8, 0.8, 4, FGRAPH), HB(3.6, 0.8, 0, 0.8, 0.8, 4, FGRAPH), HB(0, 1.2, 3.4, 5, 0.6, 5.4, 0x5a6270, (f, u, v) => { if (f !== 1) return 0x5a6270; const r = Math.hypot(u - 2.5, v - 2.7); EM = r < 0.8 ? FRED : 0; return r < 0.8 ? FRED : r < 1.8 ? 0x8a94a0 : r < 2.4 ? FRED : 0x5a6270; })],   // a machine-silhouette target
  sandbags: () => [HB(0, 0, 0, 9, 3, 4.6, 0x9a968c, (f, u, v) => f === 0 ? 0xaaa69c : (u % 3 < 0.3 ? 0x7a766c : (v > 3.4 && v < 4 ? FAMBER : 0x9a968c))), HB(0.6, 0.4, 4.6, 7.8, 2.2, 0.6, FGRAPH)],   // cast barrier blocks
  trough: () => [HB(0, 0, 0, 9, 3, 2.6, 0xc8c2b4, fMetalP(0xc8c2b4, 3)), HB(0.6, 0.6, 2.6, 7.8, 1.8, 0.1, 0x5a96ae)],
  handcart: (o) => futCartBoxes('x', o.load || 0),
  hitch: () => [HB(0, 0, 0, 1.2, 1.2, 5, FGRAPH, (f, u, v) => v > 3.6 ? (EM = FOK, FOK) : FGRAPH), HB(1.6, 0, 0, 1.2, 1.2, 5, FGRAPH, (f, u, v) => v > 3.6 ? (EM = FOK, FOK) : FGRAPH)],   // charging posts at the depot
  hurdle: () => [HB(0, 0, 0, 0.8, 0.8, 5, FAMBER), HB(8, 0, 0, 0.8, 0.8, 5, FAMBER), HB(0, 0, 4, 8.8, 0.6, 0.8, FAMBER, hazardP(FGRAPH))],
  rail: (o) => futRailBoxes(o.w, o.along, 0), picket: (o) => futRailBoxes(o.w, o.along, 1),
  hay: () => [fCrate(0, 0, 0, 6, 4, 3, 0x9ab8b0, 4), fCrate(0.6, 0.4, 3, 4.8, 3.2, 2.4, 0xc8a47a, 5)],   // feed pallets
  tack: () => [HB(0, 0, 0, 3, 5, 9, 0x8a8e94, panelP({ c: 0x8a8e94, seed: 2, pw: 1.5, ph: 3 }))],   // a tool locker
  lights: () => [],
  dock: (d) => { const B = [], L = d.len || 30;   // floating composite pontoons (the logistics terminal); follows a dock's own direction when it has one (dx, dy), else runs along +y like the Current dock
    if (d.dx !== undefined && d.axis && d.axis !== 'y') { for (let t = 0; t < L; t += 4) { const x = d.dx * t, y = d.dy * t; B.push(HB(x - 3, y - 3, 0.6, 6, 6, 2, 0xb8b4a8, fMetalP(0xb8b4a8, t))); } const ex = d.dx * (L - 2), ey = d.dy * (L - 2); B.push(HB(ex - 3, ey - 3, 2.6, 1, 1, 4, FAMBER, lightP(FAMBER)), HB(ex + 2, ey + 2, 2.6, 1, 1, 4, FAMBER, lightP(FAMBER))); return B; }
    const x0 = d.dx !== undefined ? -3 : 0; for (let t = 0; t < L; t += 6) B.push(HB(x0, t, 0.6, 6, Math.min(5.6, L - t), 2, 0xb8b4a8, fMetalP(0xb8b4a8, t)), HB(x0 - 0.4, t, 2.6, 0.6, 0.6, 4, FGRAPH)); B.push(HB(x0 + 1, L - 2, 2.6, 1, 1, 4, FAMBER, lightP(FAMBER)), HB(x0 + 4.6, L - 2, 2.6, 1, 1, 4, FAMBER, lightP(FAMBER))); return B; },
  // Future-only props (added by the future map pass)
  solar: (o) => { const B = [], n = o.n || 3; for (let i = 0; i < n; i++) B.push(HB(i * 7, 0, 0, 0.8, 0.8, 3.4, FGRAPH), HB(i * 7 + 5.6, 4.6, 0, 0.8, 0.8, 2, FGRAPH)); fSolarRoof(B, -0.4, -0.4, 2, n * 7, 6, 3, o.v || 1); return B; },   // a ground array
  node: () => [HB(0, 0, 0, 5, 4, 7, FGRAPH, panelP({ c: FGRAPH, seed: 4, pw: 2.5, ph: 3.5, strip: 6.2, stripC: FCYAN })), HB(0.6, -0.4, 4, 3.8, 0.4, 2, FAMBER, hazardP(FGRAPH)), HB(1, 1, 7, 3, 2, 3, 0xc8c2b4), fPost(4.4, 0.6, 12, FGRAPH_L)],   // a power substation
  pad: () => [HB(-5, -5, 0, 10, 10, 0.6, 0x5a5e66, (f, u, v) => { const r = Math.hypot(u - 5, v - 5); return f === 0 && r > 4 && r < 4.6 ? FAMBER : 0x5a5e66; }), HB(-5, -5, 0.6, 0.8, 0.8, 0.8, FOK, lightP(FOK)), HB(4.2, 4.2, 0.6, 0.8, 0.8, 0.8, FOK, lightP(FOK))],   // a drone pad
  battery: () => [HB(0, 0, 0, 8, 4, 6, 0xd8d2c4, panelP({ c: 0xd8d2c4, seed: 6, pw: 2, ph: 6, strip: 5, stripC: FOK })), HB(0.4, 0.4, 6, 7.2, 3.2, 0.8, FGRAPH)],
};
// the reinforced perimeter: composite armour plates on a steel frame, a top rail, a sensor node on every post; damage strips plates away
function futWallBoxes(s, shape, dmg) {
  const B = [], h = s.kind === 'culvert' ? 12 : Math.max(15, s.h), seed = s.seed || 0;
  const mat = { ply: [0xc8c2b2, 6], corr: [0x8a8e94, 3], pallet: [0xb8a48a, 2.4], door: [0x9ab0b0, 4], mesh: [0x8a94a0, 99], culvert: [0x9a968c, 4] }[s.kind] || [0xc8c2b2, 5];
  if (dmg === 2) { B.push(HB(-3.6, -1.6, 0, 7.2, 3.2, 1.6, mixc(mat[0], 0x3a3440, 0.3), fMetalP(mat[0], seed)), HB(-2, 0.4, 1.6, 1, 1, 5, FGRAPH), HB(1.6, -1, 1.6, 3, 1, 2.4, FGRAPH_L)); return B; }
  for (const dd of shape) {
    const ax = dd === 'E' || dd === 'W', sgn = dd === 'E' || dd === 'S' ? 1 : -1, o = sgn > 0 ? 0 : -4.4;
    const hh = dmg === 1 ? h * (0.5 + hs(seed, dd.charCodeAt(0)) * 0.25) : h;
    const p = mat[1] > 50 ? (f, u, v) => { if (f === 0) return FGRAPH_L; if (v < 2 || v > hh - 1.2) return FGRAPH; if ((u * 2 | 0) % 2 === (v * 2 | 0) % 2) return -1; EM = v > hh - 4 && hs(u * 3 | 0, 1) > 0.6 ? FCYAN : 0; return 0x9aa4b0; }   // an energised mesh section (the weak kind)
      : (f, u, v, b, wx, wy) => { if (f === 0) return mixc(mat[0], 0xfff4e0, 0.1); if (v > hh - 1.4) return FGRAPH_L; const pl = Math.floor(v / mat[1]); if (v - pl * mat[1] < 0.35) return mixc(mat[0], 0x2b1a16, 0.35);
          let c = hs(pl + seed, Math.floor(u / 2.2)) > 0.8 ? mixc(mat[0], 0x6a5a4a, 0.15) : mat[0]; if (s.kind === 'pallet' && hs(Math.floor(u * 1.5) + seed, pl) > 0.85) c = FCOPPER;   // the older patched panels
          if (v > 3 && v < 4.2) c = mixc(FAMBER, c, 0.3); if (vnoise(wx / 3 + seed, wy / 3 + v / 3) > 0.7) c = mixc(c, 0x6a5a4a, 0.18); if (v < 2) c = mixc(c, 0x5a4a3a, 0.25); return c; };
    B.push(ax ? HB(o, -0.6, 0, 4.4, 1.2, hh, mat[0], p) : HB(-0.6, o, 0, 1.2, 4.4, hh, mat[0], p));
    B.push(ax ? HB(o, -1.6, 0, 4.4, 1, 2.6, 0x9a968c) : HB(-1.6, o, 0, 1, 4.4, 2.6, 0x9a968c));   // the outer kick plate
    if (dmg === 1) B.push(ax ? HB(o + 1, -1.8, 0, 2.4, 2.4, 1, mixc(mat[0], 0x3a3440, 0.3)) : HB(-1.8, o + 1, 0, 2.4, 2.4, 1, mixc(mat[0], 0x3a3440, 0.3)));
  }
  B.push(HB(-0.8, -0.8, 0, 1.6, 1.6, h + 1.6, FGRAPH, fMetalP(FGRAPH, seed)));   // the frame post
  if (dmg === 0) B.push(HB(-0.7, -0.7, h + 1.6, 1.4, 1.4, 1, FCYAN, () => { EM = s.weak ? FAMBER : FCYAN; return s.weak ? FAMBER : FCYAN; }));   // a perimeter sensor node
  if (s.weak && dmg === 0 && s.kind !== 'culvert') B.push(HB(-3, 1.2, 0, 6, 2, 1.6, FAMBER, hazardP(FGRAPH)));
  return B;
}
// the defense platform: braced steel legs, a lift cage, an armoured deck, a sensor mast, the searchlight housing and a turret (beam and bolts drawn live)
function futTowerBoxes() {
  const h = 46, s = 18, back = [], front = [];
  for (const [a, b] of [[0, 0], [s - 2, 0], [0, s - 2], [s - 2, s - 2]]) back.push(HB(a, b, 0, 1.8, 1.8, h + 2, FGRAPH_L, fMetalP(FGRAPH_L, a + b)));
  for (const z of [10, 22, 34]) back.push(HB(0, 0.4, z, s, 0.8, 0.8, FGRAPH), HB(0.4, 0, z, 0.8, s, 0.8, FGRAPH), HB(0, s - 1.2, z, s, 0.8, 0.8, FGRAPH), HB(s - 1.2, 0, z, 0.8, s, 0.8, FGRAPH));
  back.push(HB(s * 0.5 - 2.5, s, 0, 5, 3, h, 0x8a8e94, (f, u, v) => (u % 5 < 0.5 || v % 4 < 0.4) ? FGRAPH : -1));   // the lift cage
  back.push(HB(-1, -1, h, s + 2, s + 2, 1.6, 0x9a968c, fMetalP(0x9a968c, 4)));
  back.push(HB(-1, -1, h + 1.6, s + 2, 1.2, 6, 0xb8b4a8, panelP({ c: 0xb8b4a8, seed: 6, pw: 5, ph: 3, band: 4.4, bandC: FAMBER })), HB(-1, -1, h + 1.6, 1.2, s + 2, 6, 0xb8b4a8, panelP({ c: 0xb8b4a8, seed: 7, pw: 5, ph: 3, band: 4.4, bandC: FAMBER })));
  back.push(HB(2, 2, h + 1.6, 1, 1, 22, FGRAPH_L), HB(0.6, 1.4, h + 20, 4, 1, 3.4, 0xd8d4cc, (f, u, v) => (f !== 0 && (v * 2 | 0) % 2) ? FGRAPH : 0xd8d4cc), HB(2, 2, h + 23.6, 0.8, 0.8, 0.8, FRED, lightP(FRED)));   // sensor mast + radar plate
  back.push(HB(s - 6, 2, h + 1.6, 4, 4, 2.6, FGRAPH, fMetalP(FGRAPH, 3)), HB(s - 6.6, 1.4, h + 4.2, 5.2, 5.2, 3.2, 0x6a6a74, fMetalP(0x6a6a74, 2)), HB(s - 5.4, -2.6, h + 5.2, 2.6, 4, 1.2, FGRAPH_D));   // the turret, its barrel toward the wilds
  back.push(HB(3, s - 6, h + 1.6, 3, 3, 3, FGRAPH), HB(2.6, s - 6.4, h + 4.6, 3.8, 3.8, 2.4, 0xd8d4cc, (f) => f === 1 ? (EM = 0xfff0c8, 0xfff8e0) : 0xd8d4cc));   // the searchlight housing
  for (let i = 0; i < 5; i++) front.push(HB(i * 3.8, s - 1.2, h + 1.6, 3.6, 1.2, 6, 0xb8b4a8, panelP({ c: 0xb8b4a8, seed: 10 + i, pw: 3.6, ph: 3, band: 4.4, bandC: FAMBER })), HB(s - 1.2, i * 3.8 + 0.2, h + 1.6, 1.2, 3.6, 6, 0xb8b4a8, panelP({ c: 0xb8b4a8, seed: 20 + i, pw: 3.6, ph: 3, band: 4.4, bandC: FAMBER })));
  return { back, front };
}
function futGateFrameBoxes() {
  const B = [HB(-2, -2, 0, 3.6, 3.6, 27, 0x9a968c, panelP({ c: 0x9a968c, seed: 1, pw: 3.6, ph: 5, strip: 20, stripC: FCYAN })), HB(22.4, -2, 0, 3.6, 3.6, 27, 0x9a968c, panelP({ c: 0x9a968c, seed: 2, pw: 3.6, ph: 5, strip: 20, stripC: FCYAN }))];
  B.push(HB(-4, -1.4, 23, 32, 2.8, 4, 0xb8b4a8, panelP({ c: 0xb8b4a8, seed: 3, pw: 4, ph: 4, band: 1, bandC: FAMBER })), HB(9, -1.8, 24, 8, 0.4, 2.2, 0x2a4a5a, screenP(0x7ac8e8, 1)));
  for (const x of [-1.4, 23]) B.push(HB(x, -1.4, 27, 2.4, 2.4, 2, 0xd8d4cc, (f) => f === 0 ? FGRAPH : (EM = FAMBER, FAMBER)));   // gate warning beacons
  return B;
}
function futGateLeafBoxes() { const hz = hazardP(FGRAPH); return [HB(0, -0.8, 0.4, 12, 1.6, 17, 0x8a8e94, (f, u, v) => { if (f === 0) return 0x9a9ea6; if (v < 2.4) return hz(f, u, v); if (u < 0.8 || u > 11.2 || v > 16.2) return FGRAPH; if (Math.abs(v - 9) < 0.4 || Math.abs(u - 6) < 0.3) return FGRAPH_D; return hs(Math.floor(u / 3), Math.floor(v / 3)) > 0.85 ? mixc(0x8a8e94, FCOPPER, 0.3) : 0x8a8e94; })]; }   // a sliding blast door
// the memorial garden's remembrance markers: 0 a light post, 1 a glass slab, 2 a planted plinth, 3 a ring of lights; fresh: a mound with flowers and a small lamp
function futGraveBoxes(v, fresh) {
  const B = [];
  if (fresh) B.push(HB(-1.8, 0.4, 0, 3.6, 5.2, 0.8, 0x5a6a3a, (f, u, v2) => hs(u * 3, v2 * 3) > 0.85 ? 0xd9685c : hs(u * 3 + 1, v2 * 3) > 0.9 ? 0xf2e6a0 : undefined));
  if (v === 0 || fresh) B.push(HB(-0.5, -0.5, 0, 1, 1, 5, 0xe8e2d2), HB(-0.7, -0.7, 5, 1.4, 1.4, 1.2, 0xfff0c8, lightP(0xffe6b0)));
  else if (v === 1) B.push(HB(-1.2, -0.4, 0, 2.4, 0.8, 5.6, 0x8ab4bc, (f, u, vv) => vv > 4.6 ? (EM = 0xffe6b0, 0xfff0c8) : (f === 0 ? 0xa8ccd0 : 0x8ab4bc)), HB(-1.4, -0.6, 0, 2.8, 1.2, 0.8, 0xc8c2b2));
  else if (v === 2) B.push(HB(-1.2, -0.8, 0, 2.4, 1.6, 2.4, 0xc8c2b2), HB(-1, -0.6, 2.4, 2, 1.2, 1.2, FGREEN, (f) => f === 0 ? 0x7aa64a : 0x4a7a3a), HB(-0.3, -0.9, 1.2, 0.6, 0.2, 0.6, 0xfff0c8, lightP(0xffe6b0)));
  else { for (let a = 0; a < 6; a++) B.push(HB(Math.cos(a / 6 * TAU) * 1.8 - 0.3, Math.sin(a / 6 * TAU) * 1.4 - 0.3, 0, 0.6, 0.6, 1, 0xfff0c8, lightP(0xffe0a0))); B.push(HB(-0.8, -0.6, 0, 1.6, 1.2, 2.6, 0xe8e2d2)); }
  return B;
}
// a hover cart: a low deck over a glowing skid, the load on top (replaces the handcart)
function futCartBoxes(along, load) {
  const ax = along !== 'y', L = (x, y, z, w, d, h, c, p) => ax ? HB(x, y, z, w, d, h, c, p) : HB(y, x, z, d, w, h, c, p);
  const B = [L(0, 0.4, 1.4, 10, 4, 1, 0xc8c2b4, fMetalP(0xc8c2b4, 2)), L(0.6, 1, 0.6, 8.8, 2.8, 0.8, FGRAPH, () => { EM = FCYAN; return FCYAN; }), L(-2.4, 2, 3, 2.6, 0.6, 0.6, FGRAPH)];
  const c = CART_LOAD[load]; if (c) B.push(L(1.6, 1, 2.4, 6.6, 3, 2.4, c[0], (f, u, v) => (hs(Math.floor(u * 1.5), Math.floor(v * 1.5) + f) > 0.6 ? c[1] : undefined)));
  return B;
}
// river craft: electric skiffs (fishing), cargo hover-barges, the medical boat
function futBoatBoxes(kind, axis) {
  const B = [], L = kind === 'fish' ? 22 : kind === 'cargo' ? 32 : 28, hw = kind === 'fish' ? 3.4 : 4.8, med = kind === 'med', hc = med ? 0xf0ece2 : kind === 'cargo' ? 0x8a8e94 : 0xc8a47a;
  B.push(HB(-L / 2 + 2, -hw + 0.8, 0, L - 4, hw * 2 - 1.6, 1.4, FGRAPH), HB(-L / 2, -hw, 1, L, hw * 2, 2.4, hc, panelP({ c: hc, seed: L, pw: 5, ph: 2.4, band: 1.6, bandC: med ? 0x4ac86a : FTEAL[0] })), HB(L / 2 - 1, -hw + 1, 1, 2, hw * 2 - 2, 2.6, mixc(hc, 0x2b1a16, 0.1)));
  if (kind === 'cargo') B.push(fCrate(-11, -3.6, 3.4, 6, 3.4, 3.4, FTEAL[0], 1), fCrate(-4, -3.6, 3.4, 6, 3.4, 3.4, 0xc8a47a, 2), fCrate(3, -3.6, 3.4, 6, 3.4, 3, 0xd8d2c4, 3), fCrate(-8, 0.4, 3.4, 6, 3.4, 3, 0xd8962e, 4), HB(L / 2 - 7, -2, 3.4, 4, 4, 5, 0xd8d4cc, fGlassP(true, 3)));
  else { B.push(HB(-3, -2.4, 3.4, 7, hw * 2 - 2.4, 4.6, med ? 0xffffff : 0xd8d4cc, fGlassP(true, L)), HB(-3.4, -2.8, 8, 7.8, hw * 2 - 1.6, 0.6, med ? 0x4ac86a : FSOLAR, med ? undefined : solarP(2)));
    if (med) B.push(HB(4.6, -1, 3.4, 4, 2, 3, 0xffffff, (f, u, v) => ((Math.abs(u - 2) < 0.5 && Math.abs(v - 1.5) < 1.2) || (Math.abs(v - 1.5) < 0.5 && Math.abs(u - 2) < 1.2)) ? (EM = 0x8af0a0, 0x4ac86a) : 0xf4f2ec)); else B.push(HB(5, -0.4, 3.4, 0.4, 0.4, 7, FGRAPH_L)); }
  B.push(HB(L / 2 - 0.4, -0.6, 3, 0.6, 1.2, 0.6, FLED, lightP(FLED)));
  return axis === 'x' ? B : mirrorBoxes(B);
}
function futRailBoxes(len, along, picket) {
  const B = [], ax = along !== 'y';
  for (let t = 0; t <= len + 0.01; t += 6) B.push(ax ? HB(Math.min(t, len - 0.8), 0, 0, 0.8, 0.8, picket ? 5 : 7, FGRAPH_L) : HB(0, Math.min(t, len - 0.8), 0, 0.8, 0.8, picket ? 5 : 7, FGRAPH_L));
  if (picket) { const gp = (f, u, v) => f === 0 ? 0xc8c2b2 : (v > 3.6 ? 0xe8e2d2 : (u % 1.6 < 0.3 ? 0xc8c2b2 : 0xd8d2c2)); B.push(ax ? HB(0, 0.1, 0.4, len, 0.4, 4.2, 0xd8d2c2, gp) : HB(0.1, 0, 0.4, 0.4, len, 4.2, 0xd8d2c2, gp)); }
  else for (const z of [2.6, 5.4]) B.push(ax ? HB(0, 0.1, z, len, 0.6, 0.6, z > 3 ? FAMBER : 0xc8c2b4) : HB(0.1, 0, z, 0.6, len, 0.6, z > 3 ? FAMBER : 0xc8c2b4));
  return B;
}

// ---------------------------------------------------------------- people of the age: practical jumpsuits and tunics, colour-blocked panels, tool belts, headsets; guards in light armour
const FTOPS = [0x6a7a8a, 0x8a7a6a, 0x5a7a74, 0xa8906e, 0x7a6a7a, 0x9a8a72, 0x5a6a7a, 0xb89a7a, 0x6a8a6a, 0x8a6a5a], FBOTS = [0x3a3e4a, 0x4a4a52, 0x5a5048, 0x3a4a52, 0x4a4238];
function futLook(role, R) {
  const kid = role === 'kid', type = kid ? 'kid' : role === 'elder' ? (R() < 0.5 ? 'oldman' : 'oldlady') : R() < 0.45 ? 'worker' : R() < 0.5 ? 'youth' : 'dress';
  const L = randLook(type);
  L.fem = type === 'oldlady' ? true : type === 'oldman' ? false : R() < 0.5;
  Object.assign(L, { fut: 1, role, carry: null, tie: 0, mask: 0, kq: false, pattern: 0, pack: 0, glasses: R() < 0.12, ev: 'civ' });
  L.top = sp(R, FTOPS); L.bot = sp(R, FBOTS); L.panel = sp(R, [FTEAL[0], FAMBER, 0xd8d2c4, FCOPPER, 0x9a5a4a, 0x6a8aa8]); L.legs = 'long'; L.sleeve = R() < 0.5 ? 'long' : 'short';
  if (type === 'dress') { L.dress = R() < 0.4 ? 1 : 0; L.bot = sp(R, [0x5a5a6a, 0x4a5a6a, 0x6a5a4a]); }
  if (kid) { L.top = sp(R, [0xd9685c, 0xf2c94c, 0x8fc1e3, 0x9fd8b4, 0xf2a0b5]); L.legs = 'short'; }
  if (type === 'oldman' || type === 'oldlady') { L.sleeve = 'long'; L.top = sp(R, [0x8a7a6a, 0x7a6a5a, 0x9a8a7a]); L.scarf = 1; }
  L.hat = 0; L.hatC = sp(R, [FGRAPH, FTEAL[1], 0xc8a47a]); if (R() < 0.18) L.hat = 'headset';
  if (role === 'guard' || role === 'scav') { L.ev = 'guard'; L.hat = role === 'guard' ? 'helm' : (R() < 0.6 ? 'headset' : 0); L.hatC = sp(R, [0xb8bcc0, 0xc8c2b2, 0x9aa8a8]); L.top = role === 'guard' ? sp(R, [0x6a7a74, 0x7a7a6e, 0x6e7884]) : sp(R, [0x5a6a5a, 0x6a6a5a, 0x5a5a6a]); L.bot = 0x3a3e46; L.sleeve = 'long'; }
  if (role === 'builder' || role === 'tech') { L.ev = 'builder'; L.hat = R() < 0.6 ? 'cap' : 'headset'; L.hatC = role === 'tech' ? FTEAL[1] : FAMBER; L.top = sp(R, [0x6a7a8a, 0x5a6a7a, 0x7a7a72]); }
  if (role === 'medic') { L.ev = 'medic'; L.hat = 0; L.top = 0xe8e4dc; }
  if (role === 'cook') L.ev = 'cook';
  if (role === 'smith') { L.ev = 'smith'; L.hat = 'goggles'; L.sleeve = 'short'; }
  if (role === 'teacher') { L.hat = R() < 0.5 ? 'headset' : 0; L.top = sp(R, [0x6a8aa8, 0x8a7a9a, 0x7a9a8a]); }
  if (role === 'groom' || role === 'herder' || role === 'farmer') { L.hat = R() < 0.5 ? 'cap' : 0; L.hatC = sp(R, [0x6a8a5a, 0x8a7a5a, FTEAL[2]]); }
  L.b = { top: L.top, sleeve: L.sleeve, hat: L.hat, legs: L.legs }; L.seed = Math.floor(R() * 999);
  return L;
}
function futTorso(X) {
  const L = X.L, { rect, put, cx, torsoTop: tt, legTop: lt, back } = X, pc = grade(L.panel || FTEAL[0]);
  if (L.ev === 'guard') { const v = grade(0x5a6268), hi = grade(0xa8b0b6); rect(cx - 6, tt, cx + 6, lt - 1, v, 6, cx + 3, mixc(v, 0x2b1a16, 0.3)); rect(cx - 6, tt, cx - 4, tt + 2, hi, 7); rect(cx + 4, tt, cx + 6, tt + 2, hi, 7); if (!back) { rect(cx - 3, tt + 3, cx + 3, tt + 3, grade(FCYAN), 7); rect(cx - 4, lt - 4, cx - 2, lt - 2, grade(0x2e3238), 7); rect(cx + 2, lt - 4, cx + 4, lt - 2, grade(0x2e3238), 7); } else rect(cx - 4, tt + 2, cx + 4, lt - 3, grade(0x2e3238), 7, cx + 2, grade(0x24282e)); }
  else if (L.ev === 'builder') { const v = grade(FAMBER); rect(cx - 5, tt + 1, cx - 3, lt - 1, v, 6); rect(cx + 2, tt + 1, cx + 4, lt - 1, v, 6, cx + 4, clothSh(v)); rect(cx - 5, tt + 5, cx + 4, tt + 5, grade(0xf4f1e8), 6); rect(cx - 6, lt - 2, cx + 6, lt - 2, grade(0x3a3a40), 6); if (!back) { put(cx - 4, lt - 1, grade(FCYAN), 7); rect(cx + 3, lt - 1, cx + 5, lt + 1, grade(0x5a5a62), 7); } }
  else if (L.ev === 'medic') { rect(cx - 5, tt + 3, cx + 5, tt + 4, grade(FTEAL[0]), 6); if (!back) { rect(cx - 1, tt + 5, cx + 1, tt + 9, grade(0x3a9a5a), 7); rect(cx - 3, tt + 6, cx + 3, tt + 8, grade(0x3a9a5a), 7); } }
  else if (L.ev === 'cook') rect(cx - 4, tt + 3, cx + 4, lt + 3, 0xf0ece2, 6, cx + 2, 0xd8d2c2);
  else if (L.ev === 'smith') { const a = grade(0x4a4a52); rect(cx - 4, tt + 2, cx + 4, lt + 4, a, 6, cx + 2, clothSh(a)); rect(cx - 4, tt + 5, cx + 4, tt + 5, grade(FAMBER), 7); }
  else { if (!back) for (let y = tt + 1; y < lt - 1; y++) put(cx - 5 + Math.round((y - tt) * 0.5), y, pc, 6); rect(cx - 6, lt - 2, cx + 6, lt - 2, clothSh(grade(L.top)), 6); if (L.scarf) rect(cx - 5, tt, cx + 5, tt + 1, pc, 7, cx + 3, clothSh(pc)); }
  if (!back && (L.ev === 'guard' || L.ev === 'builder' || L.ev === 'civ') && L.role !== 'kid') put(cx - 7, lt - 6, grade(FCYAN), 8);   // a wrist display
}
function futFace(X, ex1, ex2, ey, eh) { const L = X.L; if (L.hat === 'goggles') for (const ex of [ex1, ex2]) { X.put(ex - 1, ey - 1, grade(FAMBER), 11); X.put(ex, ey - 1, grade(FAMBER), 11); X.put(ex + 1, ey - 1, grade(FAMBER), 11); } }
function futHat(hat, X) {
  const L = X.L, { rect, put, ell, cx, headCY: hy, hr, back } = X, hc = grade(L.hatC || FGRAPH);
  if (hat === 'helm') { ell(cx + 1, hy - 3, hr + 0.6, hr - 1.6, hc, 12, mixc(hc, 0x2b1a16, 0.25), hiOf(hc), (x, y) => y < hy - 3); rect(cx - 6, hy - 3, cx + 8, hy - 3, grade(FTEAL[0]), 12); if (!back) rect(cx - 4, hy - 2, cx + 6, hy - 2, grade(0x2e3e4a), 12, cx + 4, grade(FCYAN)); }
  else if (hat === 'headset') { rect(cx - 6, hy - hr, cx + 8, hy - hr, grade(FGRAPH), 12); rect(cx + 7, hy - hr, cx + 8, hy + 1, grade(FGRAPH), 12); if (!back) { rect(cx + 7, hy - 1, cx + 9, hy + 1, grade(FGRAPH_L), 12); put(cx + 6, hy + 3, grade(FGRAPH), 12); } }
  else if (hat === 'cap') { rect(cx - 6, hy - hr - 1, cx + 8, hy - hr + 2, hc, 12, cx + 5, clothSh(hc)); if (!back) rect(cx + 2, hy - hr + 2, cx + 10, hy - hr + 2, mixc(hc, 0x2b1a16, 0.2), 12); }
  else if (hat === 'goggles') rect(cx - 6, hy - 3, cx + 8, hy - 3, grade(FGRAPH), 12);
}
// tools and weapons in the hand; returns true when it drew the thing (Current's evOver then stays silent)
function futOver(X, hx, hy, raise) {
  const L = X.L, { rect, put, cx, torsoTop: tt, legTop: lt, back } = X, G = grade(0x3a3e46), G2 = grade(0x5a6270), C = grade(FCYAN), A = grade(FAMBER);
  if (L.gun === 'aim') { for (let i = 0; i < 16; i++) { const x = cx + 6 - i, y = tt + 3 - Math.round(i * 0.42); put(x, y, i < 5 ? G2 : G, 15); if (i < 11) put(x, y + 1, i === 7 ? C : G, 15); } return true; }   // a pulse rifle, levelled
  if (L.gun === 'sling') { for (let i = 0; i < 14; i++) { const x = cx - 6 + Math.round(i * 0.8), y = lt + 1 - i; put(x, y, i === 6 ? C : G, back ? 0 : 15); } return true; }
  if (L.gun === 'carry') { for (let i = 0; i < 15; i++) { const x = cx - 5 + i, y = lt - 1 - Math.round(i * 0.45); put(x, y, i < 5 ? G2 : G, 15); put(x, y + 1, i === 9 ? C : G, 15); } return true; }
  if (L.gun === 'pistol' || L.gun === 'spear') { rect(hx, hy - 1, hx + 5, hy, G, 15); put(hx + 5, hy - 1, C, 15); return true; }
  if (L.tool === 'torch') { rect(hx + 1, hy - 3, hx + 2, hy + 2, G, 15); rect(hx + 1, hy - 5, hx + 3, hy - 3, grade(0xe8e4dc), 15); return true; }   // a hand lamp (its beam is drawn live)
  if (L.tool === 'hammer' && raise) { const x0 = cx + 6, y0 = tt - 12; rect(x0, y0 - 6, x0 + 1, y0, G2, 15); rect(x0 - 1, y0 - 9, x0 + 2, y0 - 6, A, 15, x0 + 1, grade(0xc8862a)); put(x0, y0 - 10, C, 15); return true; }   // a welding tool
  if (L.tool === 'saw') { rect(hx, hy, hx + 4, hy + 2, G2, 15, hx + 3, G); put(hx + 4, hy, C, 15); return true; }   // a multi-tool
  if (L.tool === 'bucket' || L.tool === 'pot') { const c = grade(FTEAL[0]); rect(hx - 1, hy, hx + 3, hy + 5, c, 15, hx + 2, mixc(c, 0x2b1a16, 0.3)); rect(hx - 1, hy, hx + 3, hy, G, 15); return true; }   // a canister
  if (L.tool === 'crate') { const c = grade(0x9aa4a8); rect(hx - 3, hy - 3, hx + 4, hy + 3, c, 15, hx + 2, clothSh(c)); rect(hx - 3, hy, hx + 4, hy, A, 15); return true; }   // a parts case
  if (L.tool === 'plank') { rect(0, tt - 4, X.W - 1, tt - 2, grade(0xc8c2b2), 15, X.W - 6, grade(0x9a968c)); for (let x = 3; x < X.W; x += 7) put(x, tt - 3, grade(0x8a8478), 15); return true; }   // a wall plate on the shoulder
  if (L.tool === 'cloth' && raise) { rect(cx + 2, tt - 12, cx + 8, tt - 7, grade(0x2a4a5a), 15); rect(cx + 3, tt - 11, cx + 7, tt - 8, C, 15); return true; }   // a tablet held up
  return false;
}

// ---------------------------------------------------------------- the machines: 19 hostile designs, box models facing +x, with walk phases
// cat: recon | small | stealth | hunter | patrol | armor | assault | pursuit | air | climber | ew | support | sensor | swarm | heavy | siege | apex
const FBOT = 0x6c7c94, FBOT_D = 0x434e60, FBOT_L = 0xa2b2c8, FRUST = 0x8a5a3a, FEYE = 0xff4a3a, FWARN = 0xff9a3a;
const botP = (c, seed) => (f, u, v, b, wx, wy) => {
  if (f === 0) { const n = vnoise(wx / 2 + seed, wy / 2); return n > 0.6 ? mixc(c, 0xffffff, 0.14) : n < 0.25 ? mixc(c, 0x1a1c22, 0.18) : c; }
  const W = f === 1 ? b.w : b.d, pu = u % 3.2, pv = v % 2.8;
  if (pu < 0.28 || pv < 0.25) return mixc(c, 0x1a1c22, 0.35);                                                     // panel seams
  let col = hs(Math.floor(u / 3.2) + seed * 5 + f, Math.floor(v / 2.8)) > 0.8 ? mixc(c, 0xffffff, 0.1) : c;
  if (vnoise(u / 2 + seed * 3, v / 1.5 + f) > 0.8) col = mixc(col, FRUST, 0.22);                                   // a little rust and wear
  if (Math.abs(v - b.h * 0.62) < 0.3 && b.h > 3 && hs(seed, f) > 0.4) { EM = 0xff5a3a; col = 0xd84a34; }           // a hostile marker strip on the bigger plates
  if (hs(Math.floor(u * 3) + seed, 7) > 0.94 && v > b.h * 0.3) col = mixc(col, 0xd8dce2, 0.4);                     // scratches
  if (v < 0.5) col = mixc(col, 0x1a1c22, 0.25); return col;
};
const eyeP = (c) => () => { EM = c; return mixc(c, 0xffffff, 0.25); };
const rotorP = (f, u, v, b) => f === 0 ? (((u + v) * 1.6 | 0) % 2 ? 0x9aa2ae : -1) : 0x5a6270;
const treadP = (fr) => (f, u, v) => f === 0 ? 0x2e3238 : (((u + fr * 0.6) * 1.4 | 0) % 2 ? 0x24282e : 0x4a4e56);
const BX = (x, y, z, w, d, h, c, p) => HB(x, y, z, w, d, h, c, p || botP(c, (x * 7 + y * 3 + z) | 0));
// a jointed leg from a hip to a foot (two segments: thigh up, shin down), thickness t
function bLeg(B, hx, hy, hz, fx, fy, kz, t, c) {
  const kx = (hx + fx) / 2, ky = (hy + fy) / 2;
  B.push(BX(Math.min(hx, kx) - t / 2, Math.min(hy, ky) - t / 2, kz, Math.abs(kx - hx) + t, Math.abs(ky - hy) + t, Math.max(0.6, hz - kz), c));
  B.push(BX(Math.min(kx, fx) - t / 2, Math.min(ky, fy) - t / 2, 0, Math.abs(fx - kx) + t, Math.abs(fy - ky) + t, Math.max(0.8, kz), mixc(c, 0x1a1c22, 0.15)));
  B.push(BX(fx - t * 0.8, fy - t * 0.8, 0, t * 1.6, t * 1.6, 0.6, FBOT_D));
}
const gait = (P, ph) => { const a = (P.f || 0) * Math.PI / 2 + ph; return P.k === 'walk' ? [Math.sin(a), Math.max(0, Math.cos(a))] : [0, 0]; };
const FBOTS_M = {
  mite: { cat: 'recon', fly: 1, model: (P) => { const B = [BX(-1.4, -1.4, 0, 2.8, 2.8, 1.6, FBOT_L), HB(1.2, -0.5, 0.4, 0.4, 1, 0.8, FEYE, eyeP(FEYE))]; for (const [x, y] of [[-2.6, -2.6], [1.6, -2.6], [-2.6, 1.6], [1.6, 1.6]]) B.push(BX(x, y, 1, 1, 1, 0.4, FBOT_D), HB(x - 0.6, y - 0.6, 1.4, 2.2, 2.2, 0.2, 0x9aa2ae, rotorP)); return B; } },
  eye: { cat: 'recon', fly: 1, model: (P) => { const B = []; fDome(B, 0, 0, 0, 3.6, 4, FBOT, botP(FBOT, 2)); B.push(BX(-3.4, -3.4, -0.6, 6.8, 6.8, 1, FBOT_D)); B.push(HB(3, -1.4, 1, 0.8, 2.8, 2.6, FEYE, (f, u, v) => { const r = Math.hypot(u - 0.4 + (f === 1 ? 0 : 1), v - 1.3); EM = FEYE; return r < 0.7 ? 0xffe0d0 : FEYE; })); B.push(BX(-0.4, -4.6, 1.2, 0.8, 1.2, 0.4, FBOT_L), BX(-0.4, 3.4, 1.2, 0.8, 1.2, 0.4, FBOT_L), BX(-0.3, -0.3, 3.8, 0.6, 0.6, 3, FBOT_L), HB(-0.5, -0.5, 6.8, 1, 1, 0.6, FEYE, eyeP(FEYE))); return B; } },
  rover: { cat: 'recon', model: (P) => { const B = [], fr = P.f || 0; for (const [x, y] of [[-4, -3.6], [2.4, -3.6], [-4, 2.6], [2.4, 2.6]]) B.push(HB(x, y, 0, 2.6, 1, 2.6, 0x24282e, (f, u, v) => (Math.abs(((u + fr * 0.7) % 2.6) - 1.3) < 0.3) ? 0x5a5e66 : 0x24282e)); B.push(BX(-4.6, -3, 1.4, 9.4, 6, 2.6, FBOT), BX(-4, -2.4, 4, 4, 4.8, 1.2, FBOT_D), BX(1.6, -0.4, 4, 0.8, 0.8, 7, FBOT_L), BX(0.6, -1.4, 11, 3, 2.8, 1.8, FBOT), HB(3.4, -0.8, 11.4, 0.4, 1.6, 1, FEYE, eyeP(FEYE)), HB(4.6, -2, 2.2, 0.4, 4, 0.8, FWARN, eyeP(FWARN))); return B; } },
  skitter: { cat: 'small', model: (P) => { const B = []; for (const [lx, ly, ph] of [[2.4, -1.8, 0], [2.4, 1.8, Math.PI], [-2.4, -1.8, Math.PI], [-2.4, 1.8, 0]]) { const [s, l] = gait(P, ph); bLeg(B, lx, ly, 4.6, lx + s * 1.6, ly + Math.sign(ly) * 0.8, 2.6 + l * 1.4, 0.7, FBOT_D); } B.push(BX(-3.4, -1.4, 4.2, 7, 2.8, 2, FBOT), BX(3, -1, 4.8, 2.4, 2, 1.8, FBOT_L), HB(5.2, -0.6, 5.2, 0.4, 1.2, 0.8, FEYE, eyeP(FEYE)), BX(-4.6, -0.3, 5.4, 1.6, 0.6, 0.6, FBOT_D), BX(-5, -0.2, 5.8, 0.4, 0.4, 3, FBOT_L)); return B; } },
  spider: { cat: 'stealth', model: (P) => { const B = []; for (let i = 0; i < 8; i++) { const side = i < 4 ? -1 : 1, k = i % 4, lx = -2.4 + k * 1.6, [s, l] = gait(P, (k + (side > 0 ? 1 : 0)) * Math.PI / 2); B.push(BX(lx - 0.3 + s * 0.5, side > 0 ? 1.6 : -4.6, 2.6 + l, 0.6, 3, 0.6, FBOT_D), BX(lx - 0.3 + s, side > 0 ? 4.2 : -5, 0, 0.6, 0.8, 3 + l, FBOT_D)); } B.push(BX(-2.6, -2, 2.2, 5.2, 4, 2.2, 0x4a4e58), BX(1.6, -1.2, 2.6, 2, 2.4, 1.6, FBOT), HB(3.4, -1, 3, 0.4, 0.8, 0.6, FEYE, eyeP(FEYE)), HB(3.4, 0.4, 3, 0.4, 0.6, 0.6, FEYE, eyeP(FEYE)), BX(-2, -0.8, 4.4, 3, 1.6, 0.6, FBOT_L)); return B; } },
  hound: { cat: 'hunter', model: (P) => { const B = []; for (const [lx, ly, ph] of [[4.4, -2.2, 0], [4.4, 1.6, Math.PI], [-4.2, -2.2, Math.PI], [-4.2, 1.6, 0]]) { const [s, l] = gait(P, ph); bLeg(B, lx, ly + 0.3, 7, lx + s * 2.4 - 0.8, ly + 0.3, 3.4 + l * 2, 1, FBOT_D); } const lean = P.k === 'atk' ? 1.2 : 0;
      B.push(BX(-5.6, -2.2, 6.4, 11.4, 4.4, 3.6, FBOT), BX(-4, -1.6, 10, 7, 3.2, 0.8, FBOT_L), BX(5.4, -1.6, 6.8 - lean, 4, 3.2, 3, FBOT_D), BX(8.6 + lean, -1.2, 6.2 - lean, 2.2, 2.4, 1.2, FBOT_L), HB(8.2, -1.4, 8.2 - lean, 0.4, 1, 0.6, FEYE, eyeP(FEYE)), HB(8.2, 0.6, 8.2 - lean, 0.4, 1, 0.6, FEYE, eyeP(FEYE)), BX(-7.6, -0.4, 8.4, 2.4, 0.8, 0.8, FBOT_D), BX(-8.4, -0.3, 9, 0.6, 0.6, 3.6, FBOT_L)); return B; } },
  sentry: { cat: 'patrol', model: (P) => { const B = []; for (const [ly, ph] of [[-1.8, 0], [0.8, Math.PI]]) { const [s, l] = gait(P, ph); B.push(BX(-0.8 + s * 0.8, ly, 4.4 + l, 1.8, 1.4, 5.2, FBOT), BX(-0.6 + s * 1.8, ly + 0.1, 0 + l * 1.2, 1.6, 1.2, 4.6, FBOT_D), BX(-0.8 + s * 1.8, ly - 0.2, 0, 2.6, 1.6, 0.8 + l * 0.6, FBOT_D)); }
      B.push(BX(-1.6, -2.4, 9.4, 3.2, 4.8, 2, FBOT_D), BX(-1.8, -2.6, 11.4, 3.6, 5.2, 5.4, FBOT), BX(-1.2, -1.2, 16.8, 2.6, 2.4, 0.8, FBOT_D), BX(-1.4, -1.4, 17.6, 3, 2.8, 2.6, FBOT_L), HB(1.4, -1.2, 18.4, 0.4, 2.4, 0.7, FEYE, eyeP(FEYE)), BX(-1.2, -3.8, 12, 1.4, 1.2, 4.6, FBOT_D), BX(-1, 2.6, 12.4, 1.4, 1.2, 4.2, FBOT_D), BX(0, 2.8, 13.6, 6.4, 1, 1, 0x2e3238), HB(6.2, 2.8, 13.6, 0.4, 1, 1, P.k === 'atk' ? FWARN : FBOT_D, P.k === 'atk' ? eyeP(FWARN) : undefined), BX(-2.4, -1.6, 14.4, 0.8, 3, 3, FBOT_D)); return B; } },
  warden: { cat: 'armor', model: (P) => { const B = []; for (const [ly, ph] of [[-2.6, 0], [1.2, Math.PI]]) { const [s, l] = gait(P, ph); B.push(BX(-1.4 + s * 0.6, ly, 5, 2.8, 2, 6, FBOT), BX(-1.2 + s * 1.4, ly + 0.1, l, 2.6, 1.8, 5.4, FBOT_D), BX(-1.6 + s * 1.4, ly - 0.3, 0, 3.6, 2.4, 1 + l * 0.6, FBOT_D)); }
      B.push(BX(-2.6, -3.6, 11, 5.2, 7.2, 2.4, FBOT_D), BX(-3, -4, 13.4, 6, 8, 7, 0x6a6e76), BX(-3.4, -5.6, 18.4, 3.6, 2.4, 2.4, FBOT_L), BX(-3.4, 3.2, 18.4, 3.6, 2.4, 2.4, FBOT_L), BX(-1.6, -1.6, 20.4, 3.2, 3.2, 3, FBOT), HB(1.6, -1.2, 21.4, 0.4, 2.4, 0.8, FEYE, eyeP(FEYE)),
        HB(3.2, -5.6, 7, 1, 5.4, 12, 0x7a7e86, (f, u, v) => f === 0 ? 0x8a8e96 : (v > 5 && v < 6.4 ? FWARN : (u % 2.6 < 0.3 ? FBOT_D : 0x7a7e86))), BX(-1, 4, 12, 1.8, 1.6, 6, FBOT_D), BX(0, 4.2, 13, 5.2, 1.2, 1.2, 0x2e3238)); return B; } },
  tank: { cat: 'assault', model: (P) => { const B = [], fr = P.f || 0; B.push(HB(-6.6, -5, 0, 13.2, 2.6, 3.4, 0x2e3238, treadP(fr)), HB(-6.6, 2.4, 0, 13.2, 2.6, 3.4, 0x2e3238, treadP(fr)));
      B.push(BX(-6, -2.6, 1.6, 12, 5.2, 4, FBOT), BX(-6.4, -5.4, 3.4, 13, 10.8, 1.2, FBOT_D), BX(-3, -3, 4.6, 6.4, 6, 3.6, 0x6a6e76), BX(3.2, -0.6, 6, 7, 1.2, 1.2, 0x2e3238), HB(10, -0.6, 6, 0.4, 1.2, 1.2, P.k === 'atk' ? FWARN : FBOT_D, P.k === 'atk' ? eyeP(FWARN) : undefined), HB(3.2, -2.4, 7, 0.4, 1.4, 0.8, FEYE, eyeP(FEYE)), BX(-2.6, 1.6, 8.2, 0.6, 0.6, 4, FBOT_L)); return B; } },
  racer: { cat: 'pursuit', model: (P) => { const B = [], fr = P.f || 0; for (const x of [-5.6, 3.4]) B.push(HB(x, -0.7, 0, 3.4, 1.4, 3.4, 0x24282e, (f, u, v) => { const r = Math.hypot(u - 1.7, v - 1.7); if (r > 1.7) return -1; return r < 0.6 ? 0x8a8e96 : (Math.abs(Math.sin(Math.atan2(v - 1.7, u - 1.7) * 2 + fr)) < 0.3 ? 0x4a4e56 : 0x24282e); }));
      B.push(BX(-4.6, -1.4, 2.4, 8.6, 2.8, 2.2, FBOT), BX(-1, -1.2, 4.6, 4.2, 2.4, 1.4, 0x6a6e76), HB(3, -1, 4.8, 1, 2, 1, FEYE, eyeP(FEYE)), BX(-6, -0.4, 4.4, 1.8, 0.8, 2.4, FBOT_D), HB(-6.4, -0.6, 3, 0.4, 1.2, 0.8, FWARN, eyeP(FWARN))); return B; } },
  hawk: { cat: 'air', fly: 1, model: (P) => { const B = [BX(-4.4, -1, 0, 9, 2, 1.8, FBOT), BX(3.6, -0.6, 0.2, 2.2, 1.2, 1.2, FBOT_D), HB(5.4, -0.4, 0.6, 0.4, 0.8, 0.6, FEYE, eyeP(FEYE))]; for (let k = 0; k < 4; k++) B.push(BX(-3 + k * 1.2, -2 - k * 1.5, 0.4, 4.4 - k * 1.1, 1.5, 0.5, k ? FBOT_L : FBOT), BX(-3 + k * 1.2, 0.5 + k * 1.5, 0.4, 4.4 - k * 1.1, 1.5, 0.5, k ? FBOT_L : FBOT));
      B.push(BX(-4.4, -0.3, 1.8, 1.6, 0.6, 2.2, FBOT_D), HB(-4.8, -0.8, 0.4, 0.4, 1.6, 1, FWARN, eyeP(FWARN))); return B; } },
  leech: { cat: 'climber', model: (P) => { const B = []; if (P.k === 'climb') { for (let i = 0; i < 3; i++) B.push(BX(-1, -1.4, 1 + i * 3.4, 2, 2.8, 3, i % 2 ? FBOT_L : FBOT)); for (let i = 0; i < 3; i++) B.push(BX(0.8, -2.4, 1.6 + i * 3.4, 0.8, 4.8, 0.6, FBOT_D)); B.push(HB(1, -0.6, 10.6, 0.4, 1.2, 0.6, FEYE, eyeP(FEYE))); return B; }
      for (let i = 0; i < 3; i++) { const [s] = gait(P, i * 1.6); B.push(BX(-4 + i * 3, -1.4, 1 + Math.abs(s) * 0.4, 3, 2.8, 2, i % 2 ? FBOT_L : FBOT), BX(-3.6 + i * 3 + s * 0.4, -2.4, 0, 0.6, 4.8, 1.2, FBOT_D)); } B.push(BX(5, -1, 1.2, 1.4, 2, 1.4, FBOT_D), HB(6.2, -0.6, 1.6, 0.4, 1.2, 0.6, FEYE, eyeP(FEYE))); return B; } },
  jammer: { cat: 'ew', model: (P) => { const B = []; for (const [x, y, ph] of [[3, 0, 0], [-1.6, -2.8, 2.1], [-1.6, 2.8, 4.2]]) { const [s, l] = gait(P, ph); bLeg(B, x * 0.4, y * 0.4, 9, x + s, y, 4 + l, 0.8, FBOT_D); }
      B.push(BX(-1.8, -1.8, 8.6, 3.6, 3.6, 3, FBOT), BX(-0.4, -0.4, 11.6, 0.8, 0.8, 9, FBOT_L), BX(-2.6, -0.3, 15, 5.2, 0.6, 0.6, FBOT_L), BX(-0.3, -2.6, 17.4, 0.6, 5.2, 0.6, FBOT_L), HB(-0.6, -0.6, 20.6, 1.2, 1.2, 1.2, 0xd04aff, eyeP(0xd04aff)), HB(1.8, -1.4, 9.2, 0.4, 2.8, 1.6, 0xd04aff, eyeP(0xd04aff))); fDish(B, -1.4, 0, 11, 2); return B; } },
  mender: { cat: 'support', fly: 1, model: (P) => { const B = [BX(-2.4, -2, 0, 4.8, 4, 3, 0x6a7280), BX(-1.6, -1.4, 3, 3.2, 2.8, 1.4, FBOT_L), HB(2.2, -1, 1, 0.4, 2, 1, FWARN, eyeP(FWARN)), BX(-2, -2.4, -0.8, 4, 4.8, 0.8, FBOT_D)];
      const r = P.k === 'atk' ? 1.4 : 0; B.push(BX(1.6, -3.6, 1.6, 2.6 + r, 0.8, 0.8, FBOT_D), BX(1.6, 2.8, 1.6, 2.6 + r, 0.8, 0.8, FBOT_D), HB(4 + r, -3.6, 1.2, 0.8, 0.8, 1.4, 0x7ae0ff, eyeP(0x7ae0ff)), HB(4 + r, 2.8, 1.2, 0.8, 0.8, 1.4, 0x7ae0ff, eyeP(0x7ae0ff))); return B; } },
  pylon: { cat: 'sensor', model: (P) => { const B = []; for (const [x, y, ph] of [[2.6, 2.6, 0], [-2.6, 2.6, Math.PI], [2.6, -2.6, Math.PI], [-2.6, -2.6, 0]]) { const [s, l] = gait(P, ph); bLeg(B, x * 0.4, y * 0.4, 6, x + s, y, 3 + l, 0.8, FBOT_D); }
      B.push(BX(-2.2, -2.2, 5.6, 4.4, 4.4, 2.4, FBOT), BX(-0.5, -0.5, 8, 1, 1, 20, FBOT_L), BX(-1.6, -1.6, 27, 3.2, 3.2, 2, FBOT)); const a = (P.f || 0) * 0.8; B.push(HB(-0.4 + Math.cos(a) * 2, -0.4 + Math.sin(a) * 2, 27.6, 0.8, 0.8, 0.8, FEYE, eyeP(FEYE))); fDish(B, 0, 0, 29, 2.4); B.push(BX(-3, -0.3, 18, 6, 0.6, 0.6, FBOT_D), HB(-3.4, -0.5, 17.6, 0.6, 1, 1, FWARN, eyeP(FWARN))); return B; } },
  queen: { cat: 'swarm', fly: 1, model: (P) => { const B = []; fDome(B, 0, 0, 0, 5, 3, FBOT, botP(FBOT, 6)); B.push(BX(-5, -5, -1.4, 10, 10, 1.4, FBOT_D), BX(-2.4, -2.4, -3, 4.8, 4.8, 1.6, 0x2e3238)); for (let a = 0; a < 6; a++) { const x = Math.cos(a / 6 * TAU) * 7, y = Math.sin(a / 6 * TAU) * 7; B.push(BX(x - 1, y - 1, -0.4, 2, 2, 1, FBOT_L), HB(x - 2, y - 2, 0.6, 4, 4, 0.2, 0x9aa2ae, rotorP)); } B.push(HB(4.4, -1.4, 0.8, 0.4, 2.8, 1, FEYE, eyeP(FEYE)), HB(-0.5, -0.5, 4.2, 1, 1, 1, 0xd04aff, eyeP(0xd04aff))); return B; } },
  brute: { cat: 'heavy', model: (P) => { const B = []; for (const [lx, ly, ph] of [[7, -4.6, 0], [7, 3, Math.PI], [-7, -4.6, Math.PI], [-7, 3, 0]]) { const [s, l] = gait(P, ph); B.push(BX(lx - 1.6 + s * 1.6, ly, 5 + l, 3.2, 2.6, 7, FBOT), BX(lx - 1.4 + s * 2.6, ly + 0.1, l * 1.6, 3, 2.4, 6, FBOT_D), BX(lx - 2 + s * 2.6, ly - 0.4, 0, 4, 3.4, 1.2 + l, FBOT_D)); }
      B.push(BX(-9, -4, 10, 18, 8, 7, 0x6a6e76), BX(-8, -3, 17, 14, 6, 2.4, FBOT), BX(8.4, -3.4, 9, 4, 6.8, 6, FBOT_D), HB(12.4, -2.4, 12, 0.4, 1.6, 1, FEYE, eyeP(FEYE)), HB(12.4, 0.8, 12, 0.4, 1.6, 1, FEYE, eyeP(FEYE)), HB(12.6, -3.6, 9.4, 1.4, 7.2, 2.4, 0x7a7e86, hazardP(0x7a7e86)), BX(-4, -1, 19.4, 4, 2, 2, FBOT_D), BX(-3, -0.4, 21.4, 8, 0.8, 0.8, 0x2e3238)); return B; } },
  walker: { cat: 'siege', model: (P) => { const B = []; for (const [ly, ph] of [[-6, 0], [4, Math.PI]]) { const [s, l] = gait(P, ph); B.push(BX(-2 + s * 1.6, ly, 18 + l * 2, 4, 2.4, 11, FBOT), BX(1 + s * 3.4, ly + 0.2, 8 + l * 2, 3, 2, 11, FBOT_D), BX(-3 + s * 4, ly + 0.2, l * 2.4, 3, 2, 9, FBOT), BX(-4 + s * 4, ly - 1, 0, 7, 4.4, 1.6 + l * 1.2, FBOT_D)); }
      B.push(BX(-6, -6.4, 27, 12, 12.8, 3, FBOT_D), BX(-7, -6, 30, 14, 12, 9, 0x6a6e76), BX(-5, -4, 39, 10, 8, 2.4, FBOT), HB(6.8, -3, 33, 0.4, 6, 2, FEYE, (f, u, v) => { EM = FEYE; return u % 1.4 < 0.4 ? 0x5a1a18 : FEYE; }), BX(-3, -10, 31, 9, 3.4, 3.4, FBOT), BX(5, -9.6, 32, 9, 1.6, 1.6, 0x2e3238), BX(-3, 6.6, 31, 9, 3.4, 3.4, FBOT), BX(5, 7, 32, 9, 1.6, 1.6, 0x2e3238), HB(14, -9.6, 32, 0.4, 1.6, 1.6, P.k === 'atk' ? FWARN : FBOT_D, P.k === 'atk' ? eyeP(FWARN) : undefined), BX(-1, -1, 41.4, 0.8, 0.8, 7, FBOT_L), HB(-1.2, -1.2, 48.4, 1.2, 1.2, 1.2, FEYE, eyeP(FEYE))); return B; } },
  colossus: { cat: 'apex', model: (P) => { const B = []; for (let i = 0; i < 6; i++) { const side = i < 3 ? -1 : 1, k = i % 3, lx = -10 + k * 10, [s, l] = gait(P, (k + (side > 0 ? 1 : 0)) * Math.PI); B.push(BX(lx - 1.6 + s, side > 0 ? 8 : -16, 26 + l * 2, 3.2, 8, 3, FBOT), BX(lx - 1.4 + s * 3, side > 0 ? 15 : -18, l * 3, 2.8, 3, 28, FBOT_D), BX(lx - 2.6 + s * 3, side > 0 ? 14 : -19, 0, 5.2, 5, 1.6 + l, FBOT_D)); }
      B.push(BX(-16, -10, 22, 32, 20, 6, FBOT_D), BX(-15, -9, 28, 30, 18, 12, 0x6a6e76), BX(-12, -6, 40, 22, 12, 5, FBOT), HB(-5, -4, 45, 10, 8, 2, 0xff3a2a, (f, u, v) => { EM = 0xff5a3a; return (u + v) % 2 < 0.6 ? 0x5a1a18 : 0xff5a3a; }), BX(15, -6, 26, 8, 12, 10, FBOT), HB(23, -3, 30, 0.6, 6, 4, 0xfff0d0, (f, u, v) => { EM = 0xfff0d0; return Math.hypot(u, v - 2) < 1.4 ? 0xffffff : 0xffe0c0; }), BX(20, -11, 35, 10, 2.4, 2.4, 0x2e3238), BX(20, 8.6, 35, 10, 2.4, 2.4, 0x2e3238), BX(-6, -1, 47, 1.2, 1.2, 12, FBOT_L), HB(-6.4, -1.4, 59, 2, 2, 2, FEYE, eyeP(FEYE))); return B; } },
};
const BOT_KEYS = Object.keys(FBOTS_M);
// a wreck: the same machine slumped to the ground, cold, partly broken apart (never the infected's fall)
function botWreckBoxes(type, seed) {
  const S = FBOTS_M[type], B0 = S.model({ k: 'stand', f: 0 }), top = Math.max(...B0.map(b => b.z + b.h)), sq = S.fly ? 0.35 : Math.min(0.5, 6 / Math.max(6, top) + 0.18), B = [];
  for (let i = 0; i < B0.length; i++) { const b = B0[i]; if (hs(i + seed, 3) < 0.18 && B0.length > 4) continue;
    const c = mixc(b.c, 0x2a2228, 0.38), nb = HB(b.x + (hs(i, seed) - 0.5) * 1.2, b.y + (hs(seed, i) - 0.5) * 1.2, Math.max(0, b.z * sq), b.w, b.d, Math.max(0.5, b.h * (S.fly ? 0.7 : 0.55)), c, botP(c, i + seed)); B.push(nb); }
  B.push(HB(-2, -2, 0, 4, 4, 0.3, 0x2a2228, (f, u, v) => vnoise(u * 2 + seed, v * 2) > 0.5 ? 0x3a3034 : -1));   // a scorch on the ground
  return B;
}
// friendly machines of the settlement (drawn by the renderer): a repair drone, a cargo drone, a medical drone
const FDRONE = {
  repair: () => [HB(-1.6, -1.6, 0, 3.2, 3.2, 1.6, FAMBER, fMetalP(FAMBER, 1)), HB(1.4, -0.4, 0.4, 0.4, 0.8, 0.6, FOK, lightP(FOK)), HB(-0.4, -0.4, -1.4, 0.8, 0.8, 1.4, FGRAPH), ...[[-3, -3], [1.8, -3], [-3, 1.8], [1.8, 1.8]].flatMap(([x, y]) => [HB(x + 0.4, y + 0.4, 1, 0.8, 0.8, 0.4, FGRAPH), HB(x - 0.2, y - 0.2, 1.4, 2, 2, 0.2, 0xc8ccd2, rotorP)])],
  cargo: () => [HB(-3, -2.4, 0, 6, 4.8, 2, 0xd8d2c4, fMetalP(0xd8d2c4, 2)), HB(-2.4, -2, -2.6, 4.8, 4, 2.6, FTEAL[0], (f, u, v) => (Math.abs(v - 1.3) < 0.3 ? FAMBER : FTEAL[0])), HB(2.8, -0.6, 0.6, 0.4, 1.2, 0.6, FLED, lightP(FLED)), ...[[-4.6, -4], [3, -4], [-4.6, 2.6], [3, 2.6]].flatMap(([x, y]) => [HB(x + 0.4, y + 0.4, 1.4, 1.2, 1.2, 0.4, FGRAPH), HB(x - 0.4, y - 0.4, 1.8, 2.8, 2.8, 0.2, 0xc8ccd2, rotorP)])],
  med: () => [HB(-2.4, -2, 0, 4.8, 4, 2, 0xf4f2ec, (f, u, v) => (f !== 0 && Math.abs(u - (f === 1 ? 2.4 : 2)) < 0.4) || (f !== 0 && Math.abs(v - 1) < 0.35 && Math.abs(u - (f === 1 ? 2.4 : 2)) < 1.1) ? (EM = 0x8af0a0, 0x4ac86a) : 0xf4f2ec), HB(2.2, -0.6, 0.6, 0.4, 1.2, 0.6, FOK, lightP(FOK)), ...[[-4, -3.6], [2.4, -3.6], [-4, 2.2], [2.4, 2.2]].flatMap(([x, y]) => [HB(x + 0.4, y + 0.4, 1.4, 1, 1, 0.4, FGRAPH), HB(x - 0.3, y - 0.3, 1.8, 2.4, 2.4, 0.2, 0xc8ccd2, rotorP)])],
};
