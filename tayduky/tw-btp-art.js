'use strict';
// ===== Tây Du Ký v2 — Lòng Bàn Tay Phật Tổ (rebuilt): art (loaded after tw-palm-art.js; it REPLACES TWA.ext's terrain painters, keeping its sprites) =====
// Palette: pale gold, ivory, celestial azure, silver-white clouds, gleaming gold inlay. The sea is bright azure sky with white billows and luminous gold pools near the hand; cloud terraces are ivory; the palm slab is polished cream
// stone with gold palm lines; the finger pillars are carved sandstone-ivory with knuckle grooves, gold rune studs and lotus nail caps; faces of clouds are soft billows without ink.
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const SKY = ramp(['#3f86c8', '#5aa6dc', '#7ec4ee', '#a6dcf8', '#cdeefc', '#eefaff']);
  const CLD = ramp(['#8fb4de', '#b4cfec', '#d4e6f6', '#eaf3fb', '#f8fbff', '#ffffff']);
  const STN = ramp(['#8a7248', '#b09660', '#d2b87c', '#e8d29c', '#f6e6bc', '#fff6dc']);       // ivory-gold stone
  const FNG = ramp(['#7a6440', '#a2885a', '#c8ae78', '#e2cc98', '#f4e4b8', '#fff4d4']);
  const LTS = ramp(['#d894a8', '#ecb2c2', '#f8d0da', '#fde6ec', '#fff4f6', '#ffffff']);
  const GOLD = [255, 214, 96], HALO = [255, 236, 170];
  const fbm = (I, J, s) => vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const goldAt = (I, J) => { const P = TWM.palm; if (!P) return 0; let g = 0; for (const f of P.fingers) g = Math.max(g, Math.max(0, 1 - Math.hypot(I - f.cx, J - f.cy) / 6)); g = Math.max(g, Math.max(0, 1 - Math.hypot(I - P.buddha[0], J - P.buddha[1]) / 8) * 0.9); g = Math.max(g, Math.max(0, 1 - Math.hypot(I - 74.5, J - 53.5) / 11) * 0.6); return g; };
  const isHand = m => m === M.PGOLD || m === M.PLINE || m === M.PFING || m === M.PLOT;
  function top(m, I, J, X, Y, k, d, SH) {
    const b = fbm(I, J, 1130), e = 0.13, lit = fbm(I - e, J - e, 1130) - fbm(I + e, J + e, 1130), gold = goldAt(I, J), hp = hash2(X, Y, 1131), n1 = vnoise(I * 1.6, J * 1.6, 1132);
    if (m === M.SKYD) { let c = tone(SKY, 1.2 + b * 3.2 + lit * 5 + (d ? 0.2 : 0)); const bil = vnoise(I * 0.4 + 5, J * 0.5, 1133) * 0.6 + vnoise(I * 1.1, J * 1.1, 1134) * 0.4; if (bil > 0.56) c = mix(c, [255, 255, 255], clamp((bil - 0.56) * 2.4, 0, 0.85));
      if (gold > 0.12 && n1 > 0.45) { c = mix(c, GOLD, gold * 0.5); if (hp < 0.2) SH.em = [255, 226, 150]; } if (hp < 0.01) c = [255, 255, 255]; return c; }
    if (m === M.SKYC) { let t = 2.2 + b * 3 + lit * 6 + (d ? 0.2 : 0); const path = TWM.PATHC[k]; if (path) t += 0.4; let c = tone(CLD, t); if (gold > 0.05) c = mix(c, GOLD, Math.min(0.5, gold * 0.5)); if (hp < 0.006) c = [255, 255, 255]; else if (path && hp < 0.05) c = mix(c, GOLD, 0.5); if (t > 4.7 && hp < 0.3) SH.em = [255, 236, 190]; return c; }
    if (m === M.PLINE) { const v = 0.7 + 0.3 * Math.sin(I * 2 + J * 2.6); const c = mix([236, 176, 50], GOLD, v); SH.em = [255, 214, 100]; return mix(c, [255, 246, 190], n1 * 0.4 + lit * 3); }
    if (m === M.PLOT) { const u = I * 1.7, v2 = J * 1.7, pet = Math.abs(((u + v2 * 0.5) % 1) - 0.5) + Math.abs(((v2 - u * 0.5) % 1) - 0.5); let c = tone(LTS, 2.4 + b * 2 + lit * 4 + (pet < 0.35 ? 0.9 : 0)); if (hp < 0.02) c = [255, 250, 240]; return c; }
    if (m === M.PFING) { const st = Math.abs(((I * 3.1 + J * 0.4) % 1) - 0.5); let c = tone(FNG, 2.1 + b * 2.4 + lit * 4 + (st < 0.08 ? -0.7 : 0) + (d ? 0.2 : 0)); if (hp < 0.01) c = [255, 244, 200]; return c; }
    // PGOLD: polished cream stone with soft veins and a golden sheen toward the lines
    let c = tone(STN, 2.6 + b * 2 + lit * 5 + (d ? 0.2 : 0)); const vein = Math.abs(vnoise(I * 0.7, J * 0.7, 1135) - 0.5); if (vein < 0.025) c = shade(c, 0.88); const lines = gold; c = mix(c, HALO, lines * 0.2 * (0.6 + n1)); if (hp < 0.006) c = [255, 255, 240]; return c;
  }
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const m = TWM.MAT[k];
    if (isHand(m)) {
      if (ry === drop - 1) return [96, 78, 40];
      const R = m === M.PLOT ? LTS : m === M.PFING ? FNG : STN, band = (elev + 3) % 28, cyl = Math.sin(clamp((lx % 32) / 32, 0, 1) * Math.PI);
      let t = (side ? 1.4 : 2.7) + (m === M.PFING ? cyl * 0.5 : 0) + (vnoise(gx * 0.2, elev * 0.1, 1140) - 0.5) * 1.1;
      if (m === M.PFING) { if (band < 2) t -= 1.6; else if (band === 2) t -= 0.7; const kn = Math.floor((elev + 3) / 28); if (band > 10 && band < 14 && hash2(Math.floor(gx / 6), kn, 1141) < 0.22) { SH.em = [255, 224, 140]; return [255, 224, 140]; } }
      else if (m === M.PGOLD) { if (ry < 3) t += 0.9; if ((elev % 7) === 0) t -= 0.7; if (hash2(gx >> 2, elev >> 3, 1142) < 0.02) { SH.em = [255, 220, 130]; return [255, 220, 130]; } }
      if (ry > drop - 4) t -= (4 - (drop - ry)) * 0.4; return tone(R, t);
    }
    // cloud cliffs: soft billows, no ink; bright upper lip, bluish underside, ragged bottom
    const bil = vnoise(gx * 0.16, elev * 0.1, 1143) * 0.6 + vnoise(gx * 0.5, elev * 0.3, 1144) * 0.4; let t = (side ? 2.4 : 3.6) + bil * 2.2 - (ry / Math.max(1, drop)) * 1.1; if (ry < 2) t += 1.2;
    if (ry > drop * 0.5 && hash2(gx >> 1, ry >> 1, 1145) < 0.3 * (ry / drop)) return null; return tone(m === M.SKYD ? SKY : CLD, t);
  }
  const edge = c => mix(c, [220, 236, 252], 0.5);
  const STAIR = ramp(['#c8b480', '#dcc898', '#eadcae', '#f6ecc8', '#fffbe8']);
  const seamTone = (I, J, n0, n1) => tone(CLD, 2.4 + n0 * 2 + n1 * 0.6);
  Object.assign(A.ext, { top, face, edge, stairPal: STAIR, seamTone });
  A.btp = { top, face, isHand };
})();
