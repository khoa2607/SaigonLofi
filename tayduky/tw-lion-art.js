'use strict';
// ===== Tây Du Ký v2 — Sư Đà Lĩnh: art (loaded after tw-art.js; plugs into TWA.lion) =====
// Code-painted terrain in the v2 pixel style, world-space shaded: cold blue-violet slate crags with bone-pale strata and sickly green seams, bone flagstones,
// dark fortress brick with red mortar, packed red-brown war-camp earth, toxic green mire, plank bridges, dead scrub; the misty gorge, the dark teal river and the
// waterfall face. Landmark sprites come from PixelLab (tools/sprite_picks.json); their witchfire / gem glows pulse through tw-art's glow pass.
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const SLT = ramp(['#14121d', '#1d1a29', '#292536', '#373247', '#484156', '#5c5570']);
  const MOSS = ramp(['#1a2a2b', '#263a3a', '#355049', '#486a5b']);
  const BON = ramp(['#473f37', '#615848', '#7c705b', '#988b72', '#b4a68a', '#d2c4a4']);
  const BRK = ramp(['#1b1520', '#291f2e', '#382a3c', '#4b3647', '#5f4558']);
  const MIR = ramp(['#0f1719', '#152123', '#1d2f2b', '#294535', '#396241', '#57a059']);
  const YRD = ramp(['#2c1a19', '#40271f', '#563325', '#6d432f', '#865a3b', '#a2714b']);
  const SCR = ramp(['#2a2924', '#393a2e', '#4a4939', '#605d47', '#787556', '#948f69']);
  const PLK = ramp(['#281b14', '#3b291b', '#503924', '#684b32', '#836140']);
  const WAT = ramp(['#0e202d', '#153548', '#1d4f64', '#2c7889', '#55acb5', '#a6e0de']);
  const MST = ramp(['#0c0a15', '#151122', '#201a33', '#2f2748', '#443a62']);
  const STAIR = ramp(['#37323f', '#4b4556', '#625a69', '#7b717e', '#968b96']);
  const INKF = [26, 14, 30];
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const fbm = (I, J, s) => vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15;

  function top(m, I, J, X, Y, k, d, SH) {
    const n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), lit = fbm(I - 0.13, J - 0.13, 175) - fbm(I + 0.13, J + 0.13, 175);
    if (m === M.STREAM || m === M.POOL) {   // dark teal mountain water with flowing glints
      SH.water = m === M.POOL ? 4 : 2; const f = fbm(I * 1.1 + J * 0.3, J * 1.1 - I * 0.3, 176); let c = tone(WAT, 0.9 + f * 3 + (hp < 0.05 ? 1.6 : 0)); if (m === M.POOL && Math.hypot(((X + 64) % 64) - 32, ((Y + 32) % 32) - 16) > 20) c = mix(c, WAT[5], 0.35 + n0 * 0.3); return c; }
    if (m === M.CHASM) {   // the abyss: violet depth with drifting fog specks (the fx layer adds moving mist on top)
      const t = 0.5 + fbm(I * 0.8, J * 0.8, 177) * 3 + (d ? 0.2 : 0); let c = tone(MST, t); if (hp < 0.06) c = mix(c, [150, 150, 195], 0.28 + n1 * 0.3); return c; }
    if (m === M.BONE) {
      const u = I * 1.6, v = J * 1.6, row = Math.floor(v), off = (row & 1) * 0.5, seam = ((u + off) % 1) < 0.07 || (v % 1) < 0.08;
      let c = seam ? tone(BON, 0.6 + n1) : tone(BON, 2.2 + n0 * 1.6 + n1 * 0.7 + lit * 3 + hash2(Math.floor(u + off), row, 178) * 0.7); if (n1 > 0.78 && !seam) c = mix(c, MOSS[2], 0.4); return c; }
    if (m === M.RAMP) { const u = I * 2, v = J * 2, row = Math.floor(v), seam = ((u + (row & 1) * 0.5) % 1) < 0.08 || (v % 1) < 0.1; let c = seam ? [92, 38, 48] : tone(BRK, 1.1 + n0 * 2 + hash2(Math.floor(u), row, 179) * 1.1 + lit * 3); if (hp < 0.004) { SH.em = [140, 255, 140]; return [150, 255, 150]; } return c; }
    if (m === M.MIRE) {
      let c = tone(MIR, 0.8 + fbm(I, J, 180) * 3.2 + lit * 3); const b = hash2(X >> 1, Y >> 1, 181); if (b < 0.02) { SH.em = [110, 255, 120]; return [120, 235, 130]; } if (n0 > 0.62 && n1 > 0.5) { SH.water = 2; c = mix(c, WAT[2], 0.35); } return c; }
    if (m === M.YARD) {
      let c = tone(YRD, 1.4 + n0 * 2 + n1 * 0.9 + lit * 3 + (d ? 0.2 : 0)); const rake = Math.abs(((I * 1.2 - J * 0.7) % 1) - 0.5); if (rake < 0.05) c = shade(c, 0.85); if (hp < 0.03) c = shade(c, 1.15); return c; }
    if (m === M.PLANK) { const row = Math.floor(J * 2.2), c = tone(PLK, 1.4 + hash2(Math.floor(I * 0.8), row, 182) * 1.8 + n1 * 0.6); return ((J * 2.2) % 1) < 0.1 ? tone(PLK, 0.4) : c; }
    if (m === M.SCRUB) {
      let c = tone(SCR, 1 + fbm(I, J, 183) * 3 + lit * 4 + (d ? 0.2 : 0)); if (hp < 0.05) c = mix(c, SCR[5], 0.55); if (n0 > 0.7) c = mix(c, MOSS[2], 0.35); return c; }
    // SLATE (and anything unknown): cold crag stone with strata, lichen and faint cracks
    let c = tone(SLT, 1.1 + fbm(I, J, 184) * 3 + lit * 5 + (d ? 0.2 : 0));
    const strata = Math.abs(((I * 0.9 + J * 0.55 + vnoise(I * 0.3, J * 0.3, 185) * 2.2) % 1) - 0.5); if (strata < 0.045) c = shade(c, 0.78);
    if (n1 > 0.76 && hp < 0.5) c = mix(c, MOSS[1 + (hp < 0.2 ? 1 : 0)], 0.6);
    if (hp < 0.0018) { SH.em = [130, 255, 150]; return [140, 250, 150]; }
    return c;
  }

  // cliff faces: stacked slate strata with bone bands and green seams; fortress brick on the walls; the waterfall on river tiles
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const m = TWM.MAT[k];
    if (ry === drop - 1) return INKF;
    if (m === M.STREAM || m === M.POOL) {   // WATERFALL: white-teal streaks falling, foam at the lip and at the foot
      const col = vnoise(gx * 0.45, 0.5, 186), flow = vnoise(gx * 0.8, elev * 0.05, 187), s = (side ? 0.6 : 0) + col * 1.8 + flow * 1.4;
      if (ry < 2) return WAT[5]; if (ry > drop - 4) return mix(tone(WAT, 3 + col * 2), [240, 252, 252], 0.5);
      return tone(WAT, Math.min(5, 1.6 + s + (vnoise(gx * 1.6, ry * 0.12, 188) > 0.72 ? 1.6 : 0))); }
    if (m === M.CHASM) { return tone(MST, 0.4 + (side ? 0 : 0.5) + vnoise(gx * 0.2, ry * 0.12, 189) * 1.5 - (ry / drop) * 0.4); }
    if (m === M.RAMP) { const course = Math.floor((elev + 1) / 4), jx = Math.floor((gx + (course & 1) * 4) / 8), mortar = (elev % 4) === 0 || ((gx + (course & 1) * 4) % 8) === 0; let c = mortar ? [90, 38, 50] : tone(BRK, (side ? 0.6 : 1.5) + hash2(jx, course, 190) * 1.5); if (ry < 2) c = tone(BRK, 4); if (hash2(Math.floor(gx / 8), course, 191) < 0.008 && !mortar) { SH.em = [130, 255, 140]; return [110, 230, 130]; } return c; }
    const band = Math.floor((elev + vnoise(gx * 0.09, 0.5, 192) * 6) / 7);
    let t = (side ? 0.8 : 2) + hash2(band, Math.floor(gx / 10), 193) * 1.4 + (vnoise(gx * 0.2, elev * 0.14, 194) - 0.5) * 1.6;
    if ((elev + Math.floor(vnoise(gx * 0.1, 0, 195) * 5)) % 7 === 0) t -= 1;
    if (ry > drop - 4) t -= (4 - (drop - ry)) * 0.4;
    let c = tone(SLT, t);
    const bn = (elev + Math.floor(vnoise(gx * 0.07, 0, 196) * 4)) % 11; if (bn === 0 && ry > 2 && ry < drop - 2) c = mix(c, BON[2 + (side ? 0 : 1)], 0.55);   // bone-pale bands
    if (hash2(gx >> 1, (elev + 2) >> 2, 197) < 0.011 && ry > 2 && ry < drop - 2 && (elev & 3) < 2) { SH.em = [120, 255, 150]; return mix(c, [100, 240, 140], 0.55); }   // sickly green seams
    if (m === M.MIRE || m === M.SCRUB) { const dl = drop * (0.2 + 0.5 * vnoise(gx * 0.2, 0.7, 198)); if (ry < dl && vnoise(gx * 0.4, ry * 0.2, 199) > 0.35) return tone(MOSS, 0.5 + vnoise(gx * 0.3, ry * 0.3, 200) * 2.2); }
    return c;
  }
  const edge = (c, k) => { const m = TWM.MAT[k]; if (m === M.STREAM || m === M.POOL) return [214, 244, 246]; return INKF; };
  const seamTone = (I, J, n0, n1) => tone(SLT, 1 + n0 * 2.2 + n1 * 0.7);

  // sprite kinds (PixelLab objects packed by tools/pack_sprites.py)
  const KINDS = { sdlgate: ['sdl_gate_a'], sdlkeep: ['sdl_keep_a'], sdlden: ['sdl_den_a'], sdltusk: ['sdl_tusk_a'], sdlnest: ['sdl_nest_a'], sdlbanner: ['sdl_banner_a', 'sdl_banner_b'],
    sdlbrazier: ['sdl_brazier_a', 'sdl_brazier_b'], sdltent: ['sdl_tent_a', 'sdl_tent_b'], sdlrack: ['sdl_rack_a'], sdlbridge: ['sdl_bridge_a'], sdlpine: ['sdl_pine_a', 'sdl_pine_b'], sdlrock: ['sdl_rock_a', 'sdl_rock_b'],
    sdlcrates: ['hds_crates_a', 'hds_crates_b'], sdltotem: ['sdl_totem_a'], sdlcage: ['sdl_cage_a'] };
  Object.assign(A.IMGKINDS, KINDS);
  A.GLOWS.push('sdl_gate_', 'sdl_keep_', 'sdl_den_', 'sdl_brazier_', 'sdl_nest_', 'sdl_banner_', 'sdl_totem_');
  Object.assign(A.SWAY, { sdlbanner: 1.6, sdlpine: 0.9, sdltent: 0.45, sdlbrazier: 0.25, sdlnest: 0.2 });
  A.lion = { top, face, edge, stairPal: STAIR, seamTone, ramps: { SLT, BON, BRK, WAT, MST } };
})();
