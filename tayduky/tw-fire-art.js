'use strict';
// ===== Tây Du Ký v2 — Hỏa Diệm Sơn: art (loaded after tw-art.js; plugs into TWA.fire) =====
// Original code-painted terrain in the v2 pixel style, world-space shaded so textures run across tiles:
//   * red-black basalt, scorched red rock, dark ash ground, warm baked clay (the village), cinder paths;
//   * lava: flowing veins, dark crust islands, hot yellow cores; lava FALLS on cliff faces; glowing fissures on the high ground;
//   * the rain transformation is TERRAIN, not a tint: TWM.fire.stage[k] (0..9, set by tw-fire-data.js) swaps pixels per tile with a dithered, noise-
//     shaped reveal - cracks cool and darken, lava crusts over and turns to rain pools, ash and rock grow grass, moss and flowers, cliff lips drip moss.
//     tw-fire-fx.js re-bakes the affected ground chunks whenever a stage changes, so cliff faces, occlusion columns and stairs stay consistent.
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const ASH = ramp(['#241c1f', '#30262a', '#3f322f', '#514039', '#63503f', '#77604a']);
  const BAS = ramp(['#170f13', '#22171a', '#31201f', '#432a27', '#563530', '#6e433a']);
  const SCO = ramp(['#321a18', '#4c241e', '#6a3022', '#8a3f27', '#a64d2b', '#c6602f']);
  const WARM = ramp(['#6e4230', '#8b5438', '#a8683e', '#c48347', '#dc9d56', '#eebb74']);
  const CIN = ramp(['#41373a', '#564a4a', '#6d5d58', '#85736a', '#9d8a7d']);
  const LAV = ramp(['#6a1208', '#a8200c', '#d93e10', '#f5801c', '#ffbd34', '#fff0a0']);
  const GRS = ramp(['#27502a', '#356d33', '#4a8c3b', '#67a847', '#8cc45c', '#b4de78']);
  const MOSS = ramp(['#1f3a28', '#2b4f33', '#3c6b3d', '#538a49']);
  const WET = ramp(['#1e2a3a', '#2a3b52', '#3a5470', '#4f7494']);
  const STAIR = ramp(['#4a3e3e', '#625250', '#7a665e', '#927c70', '#ab9484']);
  const INKF = [30, 12, 18], FLOW = [1, 1];
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const fbm = (I, J, s) => vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15;
  const gOf = k => { const F = TWM.fire; return F && F.stage ? F.stage[k] / 9 : 0; };

  // a tile's greening threshold varies pixel-wise with noise so the reveal is a spreading patchwork, never a fade
  const greenAt = (g, I, J, X, Y, bias) => { if (g <= 0) return false; const n = vnoise(I * 1.1, J * 1.1, 70) * 0.55 + hash2(X, Y, 71) * 0.25 + vnoise(I * 0.3, J * 0.3, 72) * 0.2; return n < g * 1.25 - bias; };
  const crackAt = (I, J) => { const w = vnoise(I * 0.28, J * 0.28, 73) * 2.2; return Math.abs(vnoise(I * 0.75 + w, J * 0.75 - w, 74) - 0.5); };

  function top(m, I, J, X, Y, k, d, SH) {
    const g = gOf(k), n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), lit = fbm(I - 0.13, J - 0.13, 75) - fbm(I + 0.13, J + 0.13, 75);
    if (m === M.LAVA || m === M.LBRIDGE) return lava(g, I, J, X, Y, d, SH, n0, hp);
    let c, bias = 0, rock = false;
    if (m === M.BASALT) { c = tone(BAS, 1.2 + fbm(I, J, 76) * 2.8 + lit * 5 + (d ? 0.2 : 0)); rock = true; bias = 0.12; }
    else if (m === M.SCORCH) { c = tone(SCO, 1 + fbm(I, J, 77) * 3 + lit * 5 + (d ? 0.2 : 0)); rock = true; bias = 0.04; }
    else if (m === M.WARM) {
      const row = Math.floor(J * 1.5), u = (I * 1.5 + (row & 1) * 0.5), seam = (u % 1) < 0.06 || (J * 1.5 % 1) < 0.07;
      c = seam ? tone(WARM, 1 + n1) : tone(WARM, 2.3 + n0 * 2 + n1 * 0.7 + lit * 2.5 + hash2(Math.floor(u), row, 78) * 0.6);
      const heat = vnoise(I * 0.4, J * 0.4, 79); if (heat > 0.66 && !seam) c = mix(c, LAV[3], Math.min(0.5, (heat - 0.66) * 3) * (1 - g));        // naturally heated ground glows faintly
      bias = -0.1;
    } else if (m === M.CINDER) { c = tone(CIN, 1.5 + n0 * 2 + n1 + (d ? 0.3 : 0) + lit * 2); bias = -0.2; }
    else if (m === M.CRUST) c = tone(BAS, 2 + n0 * 2);
    else { c = tone(ASH, 1.2 + fbm(I, J, 80) * 3 + lit * 4 + (d ? 0.2 : 0)); if (hp < 0.05) c = shade(c, 1.12); bias = -0.05; }
    // glowing fissures (cool and darken with the rain)
    if (m !== M.CINDER && m !== M.WARM) {
      const cr = crackAt(I, J), th = (m === M.BASALT ? 0.011 : m === M.SCORCH ? 0.009 : 0.005);
      if (cr < th) { const heat = Math.max(0, 1 - g * 1.5); if (heat > 0.02) { c = mix(c, tone(LAV, 2 + heat * 2.6 + (hash2(X, Y, 81) < 0.2 ? 1 : 0)), 0.55 + heat * 0.45); if (heat > 0.25) SH.em = LAV[3]; } else c = shade(c, 0.7); }
      else if (cr < th * 1.8 && g < 0.5) c = mix(c, LAV[0], 0.45 * (1 - g));
    }
    if (g > 0 && greenAt(g, I, J, X, Y, bias)) {
      const gv = vnoise(I * 0.9, J * 0.9, 82), t = 1.2 + fbm(I, J, 83) * 3 + lit * 4;
      if (rock && !(m === M.SCORCH && g > 0.55)) c = tone(MOSS, 0.4 + gv * 2.2 + lit * 3); else c = tone(GRS, t);
      const fl = hash2(X >> 1, Y >> 1, 84); if (g > 0.5 && fl < 0.012 + g * 0.018 && !rock) c = fl < 0.01 ? [255, 238, 150] : [244, 150, 190];   // meadow flowers
      SH.em = null;
    }
    // heat shimmer cue: ground near a fissure is a touch warmer by day
    if (g === 0 && m !== M.CINDER && hp < 0.012) c = mix(c, LAV[2], 0.25);
    return c;
  }

  function lava(g, I, J, X, Y, d, SH, n0, hp) {
    // flowing veins: anisotropic noise stretched along (i + j); a darker crust breaks the surface into islands that spread as the lava cools
    const f = fbm(I * 0.9 + J * 0.35, J * 0.9 - I * 0.35, 85), crust = vnoise(I * 0.7 + 3, J * 0.7 - 5, 86) + (vnoise(I * 2.1, J * 2.1, 87) - 0.5) * 0.25;
    const cool = Math.min(1, g * 1.6), th = 0.66 - cool * 0.7;
    if (g > 0.78) { SH.water = 2; return tone(WET, 0.6 + f * 3 + (hp < 0.03 ? 1.4 : 0)); }                    // rain pools where the lava was
    if (crust > th) { const c = tone(BAS, 0.8 + f * 2.6 + (d ? 0.2 : 0)); if (hash2(X, Y, 88) < 0.05 * (1 - cool)) { SH.em = LAV[2]; return LAV[2]; } return g > 0.3 ? shade(c, 1.1) : c; }
    const heat = (1 - cool) * (0.5 + f * 0.7); const t = Math.min(4.3, 1.3 + heat * 2.7 + (hp < 0.05 ? 0.8 : 0));
    SH.em = tone(LAV, Math.min(4, t)); SH.water = 4; return tone(LAV, t);
  }

  // cliff faces: red-black strata with ember seams; lava FALLS where the tile itself is lava; moss drips from the lip as the land greens
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const m = TWM.MAT[k], g = gOf(k);
    if (ry === drop - 1) return INKF;
    if (m === M.LAVA || m === M.LBRIDGE) {
      const col = vnoise(gx * 0.35, 0.5, 89), flow = vnoise(gx * 0.5, elev * 0.05 + (window.TWR ? 0 : 0), 90), cool = Math.min(1, g * 1.6);
      if (ry < 2 && cool < 0.8) { SH.em = LAV[3]; return LAV[3]; }
      if (g > 0.78) return tone(WET, 1 + flow * 2);
      const t = 0.9 + col * 2.3 + flow * 1.3 - cool * 2.5 - (side ? 0.7 : 0); SH.em = t > 2.2 ? LAV[3] : null; return tone(LAV, Math.max(0, Math.min(3.9, t)));
    }
    const band = Math.floor((elev + vnoise(gx * 0.09, 0.5, 91) * 6) / 6);
    let t = (side ? 0.9 : 2.1) + hash2(band, Math.floor(gx / 9), 92) * 1.5 + (vnoise(gx * 0.22, elev * 0.14, 93) - 0.5) * 1.5;
    if ((elev + Math.floor(vnoise(gx * 0.1, 0, 94) * 5)) % 6 === 0) t -= 1.1;
    if (ry > drop - 4) t -= (4 - (drop - ry)) * 0.4;
    let c = tone(m === M.SCORCH || m === M.WARM ? SCO : BAS, t);
    if (m === M.WARM) c = tone(WARM, t * 0.9 + 0.4);
    if (g < 0.8 && hash2(gx >> 1, (elev + 3) >> 2, 95) < 0.045 && ry > 2 && ry < drop - 2 && (elev & 3) < 2) { const heat = 1 - g * 1.4; if (heat > 0) { SH.em = LAV[3]; return mix(c, LAV[2 + (hash2(gx, elev, 96) < 0.25 ? 1 : 0)], 0.7 * heat + 0.2); } }   // ember seams in the strata
    if (g > 0) { const dl = g * drop * (0.25 + 0.75 * vnoise(gx * 0.18, 0.7, 97)); if (ry < dl && vnoise(gx * 0.4, ry * 0.2, 98) > 0.2) return tone(MOSS, 0.6 + vnoise(gx * 0.3, ry * 0.3, 99) * 2.4 + (side ? -0.5 : 0.3)); }
    return c;
  }
  const edge = (c, k) => { const m = TWM.MAT[k]; if (m === M.LAVA || m === M.LBRIDGE) return LAV[4]; return INKF; };
  const seamTone = (I, J, n0, n1) => tone(ASH, 0.8 + n0 * 2.5 + n1 * 0.7);

  // sprite kinds: PixelLab objects packed by tools/pack_sprites.py; their glow masks pulse (tw-art.js glow pass)
  const KINDS = { hdspalace: ['hds_gate_a'], hdsvolcano: ['hds_volcano_a', 'hds_volcano_b'], hdsstall: ['hds_stall_a', 'hds_stall_b'], hdsoven: ['hds_oven_a', 'hds_oven_b'], hdshut: ['hds_hut_a', 'hds_hut_b', 'hds_hut_c'],
    hdscrates: ['hds_crates_a', 'hds_crates_b'], hdslantern: ['hds_lantern_a'], hdsvent: ['hds_vent_a', 'hds_vent_b', 'hds_vent_c'], hdsrock: ['hds_rock_a', 'hds_rock_b'], hdstree: ['hds_tree_a', 'hds_tree_b'],
    hdsruin: ['hds_ruin_a', 'hds_ruin_b'], lbridge: ['hds_bridge_a'], hdsshrine: ['hds_shrine_a'] };
  Object.assign(A.IMGKINDS, KINDS);
  A.GLOWS.push('hds_gate_', 'hds_volcano_', 'hds_oven_', 'hds_vent_', 'hds_lantern_', 'hds_hut_', 'hds_stall_', 'hds_bridge_', 'hds_shrine_', 'hds_rock_', 'hds_ruin_');
  // landmark sprites cool with the land: a second, desaturated copy (hot oranges become wet dark stone, red rock turns grey-green) is blended in as the rain falls
  const HOT = new Set(['hdsvolcano', 'hdsvent', 'lbridge', 'hdsrock', 'hdspalace', 'hdsruin', 'hdstree']), cooledCache = new Map(), spriteCache = new Map();
  function cooled(name, r) {
    if (cooledCache.has(name)) return cooledCache.get(name);
    const cv = document.createElement('canvas'); cv.width = r.w; cv.height = r.h; const g = cv.getContext('2d'); g.drawImage(r.im, 0, 0); const id = g.getImageData(0, 0, r.w, r.h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 8) continue; const R = d[i], G = d[i + 1], B = d[i + 2], lum = (R * 0.3 + G * 0.59 + B * 0.11);
      if (R > 140 && R > G * 1.25 && B < 140) { const t = Math.min(1, lum / 200); d[i] = 38 + 40 * t; d[i + 1] = 58 + 52 * t; d[i + 2] = 66 + 56 * t; }                  // lava, flames, fire glow -> wet dark basalt and rain pools
      else if (R > G + 14 && R > B + 14) { d[i] = R * 0.62 + lum * 0.2; d[i + 1] = G * 0.9 + lum * 0.28 + 8; d[i + 2] = B * 0.85 + lum * 0.2 + 4; } }        // red rock -> grey-green
    g.putImageData(id, 0, 0); cooledCache.set(name, cv); return cv;
  }
  function sprite(p) {
    if (!HOT.has(p.kind) || !A.IMGKINDS[p.kind]) return null; const names = A.IMGKINDS[p.kind].filter(n => A.IMG[n]); if (!names.length) return null; const nm = names[(p.v || 0) % names.length], r = A.IMG[nm]; if (!r) return null;
    if (spriteCache.has(nm)) return spriteCache.get(nm);
    const sp = { w: r.w, h: r.h, py: r.py, frames: [r.im], em: r.glow, glow: r.glow, img: true, flat: false, draw: (g, s, f) => { g.drawImage(f, s.X, s.Y); const c = window.TWS && TWS.fire ? Math.min(1, TWS.fire.g * 1.5) : 0; if (c > 0.02) { g.globalAlpha = c; g.drawImage(cooled(nm, r), s.X, s.Y); g.globalAlpha = 1; } } };
    spriteCache.set(nm, sp); return sp;
  }
  A.fire = { top, face, edge, stairPal: STAIR, seamTone, sprite, LAV, GRS, ramps: { ASH, BAS, SCO, WARM, CIN, MOSS, WET } };
})();
