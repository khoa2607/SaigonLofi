'use strict';
// ===== Tây Du Ký v2 — Hoa Quả Sơn: art (loaded after tw-art.js; plugs into TWA.hqs) =====
// Palette: fresh emerald and lime grass with sunlit gold tips, moss green, pink peach-petal lawn, blue-grey granite with warm veins, warm tan trails, pale flagstone plazas, clear blue-cyan water with white foam.
// Cliff faces: stratified blue-grey granite, moss lips, hanging vines, orange lichen, blossom flecks; water faces are the curtains of the falls.
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const GRS = ramp(['#16401f', '#25682c', '#3a8f38', '#5cb446', '#8ad858', '#bff08a', '#eaf8b0']);
  const MSS = ramp(['#1b4a2e', '#2d6e3c', '#4a9648', '#7cc45a', '#a8e070']);
  const GRN = ramp(['#26384a', '#3c5468', '#56748a', '#7896a8', '#9db6c0', '#c4d6d8']);        // blue-grey granite
  const TRL = ramp(['#5a3e22', '#7e5a30', '#a37a42', '#c79a5a', '#e0b878', '#f2d49a']);        // warm trail
  const PLZ = ramp(['#4a5662', '#6b7a86', '#8d9ea6', '#b3c2c4', '#d4dedb', '#eef2e8']);        // flagstone
  const WTR = ramp(['#06304c', '#0c5a80', '#1482ac', '#2eaed0', '#6cd6e8', '#bcf0f6', '#f4fdff']);
  const STAIR = ramp(['#4c5c68', '#6a7e88', '#8aa0a8', '#aec4c4', '#d0e0da']);
  const INKF = [14, 28, 30];
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const fbm = (I, J, s) => vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let shore = null; const isW = m => m === M.STREAM || m === M.POOL;
  function buildShore() { shore = new Uint8Array(TWM.N * TWM.N); const N = TWM.N, MAT = TWM.MAT;
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const k = j * N + i; if (!isW(MAT[k])) continue; let b = 0; const Lf = q => MAT[q] !== M.VOID && !isW(MAT[q]);
      if (Lf(k - 1)) b |= 1; if (Lf(k + 1)) b |= 2; if (Lf(k - N)) b |= 4; if (Lf(k + N)) b |= 8; shore[k] = b; } }
  function water(m, I, J, X, Y, k, SH, d) {
    if (!shore) buildShore(); SH.water = 2;
    const f = fbm(I * 1.4, J * 0.5, 930), st = vnoise(I * 2.4, J * 0.6, 931), br = Math.max(0, st - 0.6) * 3 + Math.max(0, vnoise(I * 1.1, J * 0.3, 932) - 0.66) * 1.4;
    let c = tone(WTR, 1.5 + f * 3.2 + (d ? 0.2 : 0)); if (br > 0.2) c = mix(c, [244, 255, 255], clamp(br * 0.75, 0, 0.88));
    if (m === M.POOL && vnoise(I * 0.7, J * 0.7, 933) > 0.72) c = mix(c, [255, 206, 222], 0.18);                  // drifting peach petals
    const fi = I - Math.floor(I), fj = J - Math.floor(J), b = shore[k];
    if (b) { let e = 9; if (b & 1) e = Math.min(e, fi); if (b & 2) e = Math.min(e, 1 - fi); if (b & 4) e = Math.min(e, fj); if (b & 8) e = Math.min(e, 1 - fj);
      const n = vnoise(I * 2.2, J * 2.2, 934), reach = 0.18 + n * 0.14; if (e < reach) c = mix(c, [244, 255, 255], clamp((1 - e / reach) * 1.1 - 0.1, 0, 0.9)); }
    return c;
  }
  function top(m, I, J, X, Y, k, d, SH) {
    if (isW(m)) return water(m, I, J, X, Y, k, SH, d);
    const n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), lit = fbm(I - 0.13, J - 0.13, 940) - fbm(I + 0.13, J + 0.13, 940);
    if (m === M.FPLAZA) { const u = I * 1.3, v = J * 1.3, row = Math.floor(v), seam = ((u + (row & 1) * 0.5) % 1) < 0.07 || (v % 1) < 0.08; let c = seam ? tone(PLZ, 0.8 + n1) : tone(PLZ, 2.4 + n0 * 1.4 + n1 * 0.6 + lit * 3 + hash2(Math.floor(u + (row & 1) * 0.5), row, 941) * 1.0); if (seam && n1 > 0.58) c = mix(c, MSS[2], 0.7); else if (n1 > 0.8 && !seam) c = mix(c, MSS[3], 0.3); if (hp < 0.012) return [255, 190, 206]; return c; }
    if (m === M.FPATH) { let c = tone(TRL, 1.8 + n0 * 1.6 + n1 * 0.7 + lit * 3 + hash2(Math.floor(I * 2.4), Math.floor(J * 2.4), 943) * 1.2); if (n1 > 0.8 && hp < 0.5) c = mix(c, GRS[3], 0.4); return c; }
    if (m === M.FROCK) { let c = tone(GRN, 1.3 + fbm(I, J, 945) * 3.4 + lit * 5 + (d ? 0.2 : 0)); const st = Math.abs(((I * 0.8 + J * 0.6 + vnoise(I * 0.3, J * 0.3, 946) * 2.4) % 1) - 0.5); if (st < 0.05) c = shade(c, 0.8); if (n1 > 0.6 && hp < 0.6) c = mix(c, MSS[1 + (hp < 0.25 ? 1 : 0)], 0.65); if (n0 > 0.7 && hp < 0.1) c = mix(c, [232, 160, 70], 0.55); return c; }
    if (m === M.FMOSS) { let c = tone(MSS, 0.8 + fbm(I, J, 947) * 3 + lit * 4 + (d ? 0.2 : 0)); if (n1 > 0.75 && hp < 0.5) c = mix(c, GRN[3], 0.5); if (hp < 0.008) return [255, 214, 90]; return c; }
    if (m === M.FBLOSS) { let c = tone(GRS, 1.8 + fbm(I, J, 948) * 3 + lit * 4.4 + (d ? 0.2 : 0)); const pk = vnoise(I * 1.1, J * 1.1, 949); if (pk > 0.52) c = mix(c, [255, 196, 214], clamp((pk - 0.52) * 2.2, 0, 0.75)); if (hp < 0.05) return [255, 236, 242]; return c; }
    let c = tone(GRS, 1.8 + fbm(I, J, 947) * 3.3 + lit * 4.6 + (d ? 0.2 : 0)); if (n0 > 0.62) c = mix(c, GRS[5], 0.26); if (n1 > 0.78 && hp < 0.7) c = mix(c, GRS[2], 0.5);
    if (hp < 0.007) return [255, 200, 220]; if (hp > 0.992) return [255, 244, 160]; if (hp > 0.984) return [255, 176, 90]; return c;
  }
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const m = TWM.MAT[k];
    if (ry === drop - 1) return INKF;
    const FQ = TWM.hqs, ti = k % TWM.N, tj = Math.floor(k / TWM.N), cave = isW(m) && tj === 7 && ti >= FQ.fallX[0] && ti <= FQ.fallX[1] && side === 0;
    if (isW(m)) { const col = vnoise(gx * 0.45, 0.5, 950), flow = vnoise(gx * 0.8, elev * 0.05, 951), s = (side ? 0.5 : 0) + col * 1.8 + flow * 1.6, streak = vnoise(gx * 1.7, elev * 0.04 - (window.TWR ? TWR.t * 0.9 : 0), 952);
      let curt = null;
      if (cave) { const ax = gx - (A.SX(74, 7) - 16), yb = drop - ry, aw = 58, ah = 84, nx = ax / aw, inside = Math.abs(nx) < 1 && (yb < ah * 0.55 || nx * nx + ((yb - ah * 0.55) / (ah * 0.45)) ** 2 < 1), fr = !inside && Math.abs(ax) < aw + 5 && yb < ah + 5 && (yb < ah * 0.55 + 5 || (ax / (aw + 5)) ** 2 + ((yb - ah * 0.55) / (ah * 0.45 + 5)) ** 2 < 1);
        if (inside) { const deep = 1 - (yb / ah) * 0.45; curt = mix([10, 22, 30], [58, 96, 104], 1 - deep + (hash2(gx, ry, 66) < 0.02 ? 0.4 : 0)); if (hash2(gx >> 1, ry >> 1, 67) < 0.004) curt = [255, 214, 110]; } else if (fr) return tone(GRN, 1.5 + hash2(gx >> 1, ry >> 1, 68) * 1.5); }
      if (ry < 2) return WTR[6]; if (ry > drop - 5) return mix(tone(WTR, 3 + col * 2), [244, 255, 255], 0.6); let c = tone(WTR, Math.min(6, 2 + s + (streak > 0.64 ? 2 : 0) - (ry / drop) * 0.3)); if (streak > 0.78) c = mix(c, [255, 255, 255], 0.6); if (curt) { const a = clamp(0.1 + (streak - 0.45) * 0.9 + col * 0.12, 0.06, 0.6); c = mix(curt, c, a); } return c; }
    const band = Math.floor((elev + vnoise(gx * 0.09, 0.5, 955) * 6) / 6);
    let t = (side ? 0.9 : 2.2) + hash2(band, Math.floor(gx / 9), 956) * 1.4 + (vnoise(gx * 0.2, elev * 0.14, 957) - 0.5) * 2;
    if ((elev + Math.floor(vnoise(gx * 0.1, 0, 958) * 5)) % 6 === 0) t -= 1; if (ry > drop - 4) t -= (4 - (drop - ry)) * 0.4;
    let c = tone(GRN, t);
    const dl = 2 + Math.floor(hash2(gx, 0, 959) * hash2(gx >> 2, 1, 960) * 9); if (ry < dl) return tone(MSS, 3 - ry * 0.5 + (side ? -1 : 0));        // moss lip with drips
    if (hash2(gx >> 1, 7, 961) < 0.06 && ry < drop * 0.8) { const leaf = (ry + gx) % 5 === 0; return tone(MSS, leaf ? 3.4 : side ? 0.6 : 1.6); }  // hanging vines
    if (vnoise(gx * 0.7 + elev * 0.2, elev * 0.4, 963) > 0.9) c = mix(c, [255, 190, 214], 0.5);                       // blossom caught on a ledge
    if (vnoise(gx * 0.5, elev * 0.3, 964) > 0.86) c = mix(c, [226, 150, 66], 0.45);                                    // orange lichen
    if (m === M.FPLAZA) { const course = Math.floor((elev + 1) / 5), mort = (elev % 5) === 0 || ((gx + (course & 1) * 6) % 12) === 0; c = tone(PLZ, 2.2 + hash2(Math.floor(gx / 6), course, 965) * 1.2 + (side ? -0.8 : 0)); if (mort) c = shade(c, 0.78); }
    return c;
  }
  const edge = (c, k) => { const m = TWM.MAT[k]; if (isW(m)) return [230, 252, 255]; return INKF; };
  const seamTone = (I, J, n0, n1) => tone(GRS, 1.6 + n0 * 2 + n1 * 0.7);
  // ---- code-painted shrubs and flower beds (many colours: orange azalea, pink, white, yellow, green)
  const cache = new Map(), mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  const BUSH = [['#1d5a2a', '#2f8a38', '#52b848', '#86dc62'], ['#4a5a1a', '#78902a', '#a8bc3c', '#d8e060'], ['#5a2a14', '#a24a1c', '#e07a28', '#ffb250'], ['#1f4a3a', '#2e7a5a', '#48aa78', '#80dca0']];
  function paintBush(v) {
    const w = 26, h = 20, cv = mk(w, h), g = cv.getContext('2d'), P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); }, base = BUSH[v & 3];
    for (let q = 0; q < 14; q++) { const cx = 4 + hash2(q, v, 190) * 18, cy = 6 + hash2(q, v, 191) * 8, r = 3 + hash2(q, v, 192) * 3; for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { if (xx * xx + yy * yy > r * r) continue; const t = clamp((-yy + r) / (2 * r) * 3.2 + hash2(Math.round(cx + xx), Math.round(cy + yy), 193) * 0.9 - 0.4, 0, 3.4); P(Math.round(cx + xx), Math.round(cy + yy), 1, 1, base[Math.min(3, Math.floor(t))]); } }
    P(3, 15, 20, 2, 'rgba(10,30,20,0.28)'); const pc = [['#ffbad2', '#fdf0f4', '#ffe45a'], ['#ffffff', '#ffd0e0', '#c8f0ff'], ['#ff7a5a', '#ffd45a', '#fff4a0'], ['#ffd45a', '#ffffff', '#ffbad2']][v & 3];
    for (let q = 0; q < 16; q++) P(4 + Math.floor(hash2(q, v, 195) * 18), 5 + Math.floor(hash2(q, v, 196) * 9), 2, 2, pc[q % 3]); return cv;
  }
  function paintFlowers(v) {
    const w = 22, h = 12, cv = mk(w, h), g = cv.getContext('2d'), P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
    const pal = [['#ffb6d0', '#fdf2f6', '#ffe45a', '#c4a4f4', '#9ae6e0'], ['#ff9f60', '#ffd45a', '#ffffff', '#ff7a8a', '#7ad8c4'], ['#e8f8a0', '#ffd0e0', '#ffffff', '#ff9ac0', '#a8e8a0'], ['#ffffff', '#ffe0ec', '#d8f4ff', '#ffee90', '#ffb6d0']][v & 3];
    for (let q = 0; q < 34; q++) { const x = 1 + Math.floor(hash2(q, v, 201) * 19), y = 3 + Math.floor(hash2(q, v, 202) * 8); P(x, y + 1, 1, 2, '#3f9a4a'); P(x - (q & 1), y, 2 + (q & 1), 2, pal[q % 5]); } return cv;
  }
  const KINDS = { hhall: ['hall_a', 'hall_b'], hhut: ['hut_a', 'hut_b', 'hut_c'], hshrine: ['shrine_c', 'shrine_a', 'shrine_b'], hstatue: ['statue_a', 'statue_b'], hpavilion: ['tc_pavilion_a', 'hps_pavilion_a'], hplay: ['playground_a'], hcrate: ['hds_crates_a', 'hds_crates_b'],
    harch: ['arch_a', 'arch_b'], hbridgeb: ['tc_bridge_a'], hlotus: ['lotus_a', 'lotus_b'], hlantern: ['lantern_a', 'lantern_b'], hrock: ['hps_rock_a', 'hps_rock_b', 'hps_rock_c', 'tth_rock_a', 'tth_rock_b', 'tth_rock_c', 'scholar_a'],
    hpine: ['hps_pine_a', 'hps_pine_b', 'hps_pine_c', 'sdl_pine_a'], hmaple: ['hps_maple_a', 'hps_maple_b', 'hps_maple_c'], htree: ['nhs_tree_a', 'nhs_tree_b', 'nhs_tree_c', 'nhs_tree_d'], hwillow: ['tth_willow_a', 'tth_willow_b'], hboat: ['tth_boat_a'] };
  Object.assign(A.IMGKINDS, KINDS);
  A.GLOWS.push('hps_pavilion_', 'tc_pavilion_', 'hall_');
  Object.assign(A.SWAY, { hpine: 0.9, hmaple: 1.5, htree: 1.1, hwillow: 1.9, hlantern: 0.2, hlotus: 0.4, hrock: 0, hhut: 0.4, hboat: 0.3 });
  function sprite(p) {
    if (p.kind === 'hbush' || p.kind === 'hflower') { const key = p.kind + ((p.v || 0) & 3); let o = cache.get(key); if (!o) { const cv = p.kind === 'hbush' ? paintBush(p.v & 3) : paintFlowers(p.v & 3); o = { w: cv.width, h: cv.height, py: p.kind === 'hbush' ? 17 : 10, frames: [cv], flat: false, sway: p.kind === 'hbush' ? 0.6 : 0.3 }; cache.set(key, o); } return o; }
    if (p.kind === 'hflag') return null;
    return null;
  }
  A.hqs = { top, face, edge, stairPal: STAIR, seamTone, sprite, ramps: { GRS, MSS, GRN, TRL, PLZ, WTR } };
})();
