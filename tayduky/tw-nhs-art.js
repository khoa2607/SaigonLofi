'use strict';
// ===== Tây Du Ký v2 — Ngũ Hành Sơn: art (loaded after tw-art.js; plugs into TWA.nhs) =====
// Code-painted terrain in the v2 pixel style: lush meadow turf (yellow-greens, clover, flower flecks), warm granite with violet shadows and iron-stained strata, tan scree paths, weathered flagstone, turquoise mountain
// water with foam; cliff faces (stratified granite, moss drips, curtains of falling water). Landmark sprites (the prison, the summit crag, broadleaf trees) are PixelLab objects (tools/sprite_picks.json).
// SEASONS: the ground is baked once (summer palette). Per chunk, a lazily built overlay recolours the nhs tiles for spring / autumn / winter / moss (class mask drawn from the map, pixels recoloured: flowers, russet turf, snow,
// shore ice); tree, bush and flower sprites get four seasonal canvases made by recolouring the sprite (blossom, russet leaves, bare crown + snow); the draw cross-fades two seasons.
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const GRS = ramp(['#14301c', '#1f4a28', '#2d6a31', '#46903a', '#6cb843', '#9ad552', '#cfe874']);         // meadow turf
  const GRN = ramp(['#1a1824', '#292837', '#3d3c4d', '#585665', '#78767f', '#9a979d', '#c5c0bc']);          // granite
  const SCR = ramp(['#32291f', '#4c4033', '#6c5c47', '#8e7a5c', '#b09a74', '#d3c29a']);                    // scree / dirt path
  const FLG = ramp(['#27242c', '#3d3944', '#57525e', '#766f78', '#968e96', '#b9b0b2']);                    // flagstone
  const WTR = ramp(['#0b3146', '#115472', '#1b7a96', '#33a4b6', '#69cfd3', '#b0eee9', '#effefe']);         // mountain water
  const MSS = ramp(['#1d4a2a', '#2f6e38', '#4a9645', '#77c15a']);
  const STAIR = ramp(['#34303c', '#4b4757', '#66626f', '#847f8a', '#a6a1a8']);
  const INKF = [14, 12, 20];
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const fbm = (I, J, s) => vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let shore = null; const isW = m => m === M.STREAM || m === M.POOL;
  function buildShore() { shore = new Uint8Array(TWM.N * TWM.N); const N = TWM.N, MAT = TWM.MAT;
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const k = j * N + i; if (!isW(MAT[k])) continue; let b = 0; const Lf = q => MAT[q] !== M.VOID && !isW(MAT[q]);
      if (Lf(k - 1)) b |= 1; if (Lf(k + 1)) b |= 2; if (Lf(k - N)) b |= 4; if (Lf(k + N)) b |= 8; shore[k] = b; } }
  function water(m, I, J, X, Y, k, SH, d) {
    if (!shore) buildShore(); SH.water = 2;
    const f = fbm(I * 1.4, J * 0.5, 530), st = vnoise(I * 2.4, J * 0.6, 531), br = Math.max(0, st - 0.58) * 3 + Math.max(0, vnoise(I * 1.1, J * 0.3, 532) - 0.64) * 1.6;
    let c = tone(WTR, 1.5 + f * 3 + (d ? 0.2 : 0)); if (br > 0.2) c = mix(c, [240, 254, 254], clamp(br * 0.75, 0, 0.88));
    const fi = I - Math.floor(I), fj = J - Math.floor(J), b = shore[k];
    if (b) { let e = 9; if (b & 1) e = Math.min(e, fi); if (b & 2) e = Math.min(e, 1 - fi); if (b & 4) e = Math.min(e, fj); if (b & 8) e = Math.min(e, 1 - fj);
      const n = vnoise(I * 2.2, J * 2.2, 533), reach = 0.18 + n * 0.14; if (e < reach) c = mix(c, [240, 254, 254], clamp((1 - e / reach) * 1.1 - 0.1, 0, 0.9)); }
    return c;
  }
  function top(m, I, J, X, Y, k, d, SH) {
    if (isW(m)) return water(m, I, J, X, Y, k, SH, d);
    const n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), lit = fbm(I - 0.13, J - 0.13, 540) - fbm(I + 0.13, J + 0.13, 540);
    if (m === M.NFLAG) { const u = I * 1.5, v = J * 1.5, row = Math.floor(v), seam = ((u + (row & 1) * 0.5) % 1) < 0.07 || (v % 1) < 0.08; let c = seam ? tone(FLG, 0.5 + n1) : tone(FLG, 2.3 + n0 * 1.4 + n1 * 0.6 + lit * 3 + hash2(Math.floor(u + (row & 1) * 0.5), row, 541) * 0.9); if (seam && n1 > 0.6) c = mix(c, MSS[1], 0.75); else if (n1 > 0.78 && !seam) c = mix(c, MSS[2], 0.45); if (hp < 0.004) return [236, 200, 120]; return c; }
    if (m === M.NGRAV) { const u = I * 2.4, v = J * 2.4, cx = Math.floor(u), cy = Math.floor(v), h0 = hash2(cx, cy, 543); let c = tone(SCR, 1.5 + h0 * 2.4 + lit * 3 + n0 * 0.8); if (hash2(Math.floor(u * 1.7), Math.floor(v * 1.7), 544) > 0.86) c = shade(c, 1.15); if (n1 > 0.8 && hp < 0.6) c = mix(c, GRS[3], 0.45); return c; }
    if (m === M.NROCK) { let c = tone(GRN, 1.2 + fbm(I, J, 545) * 3.6 + lit * 5 + (d ? 0.2 : 0)); const st = Math.abs(((I * 0.8 + J * 0.6 + vnoise(I * 0.3, J * 0.3, 546) * 2.4) % 1) - 0.5); if (st < 0.05) c = shade(c, 0.72); if (n1 > 0.7 && hp < 0.5) c = mix(c, MSS[1 + (hp < 0.2 ? 1 : 0)], 0.6); if (hp > 0.992) c = mix(c, [205, 160, 110], 0.5); return c; }
    // NTURF (and anything unknown): lush meadow with clover patches, tufts and flower flecks
    let c = tone(GRS, 1.5 + fbm(I, J, 547) * 3.4 + lit * 4.5 + (d ? 0.2 : 0)); if (n0 > 0.66) c = mix(c, GRS[5], 0.3); if (hp < 0.05) c = mix(c, GRS[6], 0.5); if (n1 > 0.78 && hp < 0.7) c = mix(c, GRS[2], 0.5);
    if (hp < 0.006) return [250, 238, 140]; if (hp > 0.993) return [245, 180, 205]; return c;
  }
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const m = TWM.MAT[k];
    if (ry === drop - 1) return INKF;
    if (isW(m)) { const col = vnoise(gx * 0.45, 0.5, 550), flow = vnoise(gx * 0.8, elev * 0.05, 551), s = (side ? 0.5 : 0) + col * 1.8 + flow * 1.5;
      if (ry < 2) return WTR[6]; if (ry > drop - 4) return mix(tone(WTR, 3 + col * 2), [240, 254, 254], 0.5); return tone(WTR, Math.min(6, 1.7 + s + (vnoise(gx * 1.6, ry * 0.12, 553) > 0.7 ? 1.8 : 0) - (ry / drop) * 0.4)); }
    const band = Math.floor((elev + vnoise(gx * 0.09, 0.5, 555) * 6) / 6);
    let t = (side ? 0.8 : 2.1) + hash2(band, Math.floor(gx / 9), 556) * 1.5 + (vnoise(gx * 0.2, elev * 0.14, 557) - 0.5) * 2;
    if ((elev + Math.floor(vnoise(gx * 0.1, 0, 558) * 5)) % 6 === 0) t -= 1; if (ry > drop - 4) t -= (4 - (drop - ry)) * 0.4;
    let c = tone(GRN, t);
    if (band % 3 === 0 && vnoise(gx * 0.12, elev * 0.1, 559) > 0.35) c = mix(c, [168, 118, 84], 0.34);       // iron-stained strata
    const dl = drop * (0.2 + 0.5 * vnoise(gx * 0.18, 0.7, 560)); if (ry < dl * 0.8 && vnoise(gx * 0.4, ry * 0.2, 561) > 0.55) c = mix(c, tone(MSS, 0.4 + vnoise(gx * 0.3, ry * 0.3, 562) * 2.6), 0.82);
    if (vnoise(gx * 0.7 + elev * 0.2, elev * 0.4, 563) > 0.86) c = mix(c, [196, 190, 200], 0.4);
    if (m === M.NFLAG) { const course = Math.floor((elev + 1) / 5), mort = (elev % 5) === 0 || ((gx + (course & 1) * 6) % 12) === 0; if (mort) c = shade(c, 0.72); }
    return c;
  }
  const edge = (c, k) => { const m = TWM.MAT[k]; if (isW(m)) return [220, 248, 250]; return INKF; };
  const seamTone = (I, J, n0, n1) => tone(GRS, 1.4 + n0 * 2 + n1 * 0.7);

  // ================================================================ seasons: state, chunk overlays, sprite recolour
  // season index: 0 spring, 1 summer, 2 autumn, 3 winter; the fx layer keeps A.nhs.S = { a, b, f, age } up to date every frame (a -> b blended by f 0..1)
  const SEASONS = ['spring', 'summer', 'autumn', 'winter'], S = { a: 1, b: 1, f: 0, age: 0, snow: 0 };
  const rnd = (x, y, s) => { const n = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453; return n - Math.floor(n); };
  const lum = (r, g, b) => (r * 0.3 + g * 0.55 + b * 0.15);
  const SNOW = [236, 243, 252], SNOWSH = [168, 188, 222];
  const snowTone = (L, h) => { const k = clamp(0.74 + L / 300 + h * 0.08, 0.72, 1.04); return [SNOW[0] * k * 0.98 + SNOWSH[0] * (1 - k) * 0.4, SNOW[1] * k + SNOWSH[1] * (1 - k) * 0.4, Math.min(255, SNOW[2] * k + 8 + SNOWSH[2] * (1 - k) * 0.3)]; };
  const FLW = [[255, 170, 200], [252, 252, 240], [255, 226, 92], [190, 160, 244], [255, 140, 120]], LEAF = [[226, 116, 30], [244, 190, 62], [190, 66, 34], [212, 150, 40]];
  // class codes in the mask: 1 turf, 2 rock, 3 scree, 4 flagstone, 5 water
  function recolorPixel(cls, season, r, g, b, x, y, nearEdge) {
    const L = lum(r, g, b), h = rnd(x, y, 1), blk = rnd(Math.floor(x / 4), Math.floor(y / 4), 2), blk2 = rnd(Math.floor(x / 9), Math.floor(y / 9), 3);
    if (season === 0) {            // spring
      if (cls === 1) { if (blk > 0.8 && h < 0.5) return FLW[Math.floor(blk2 * 5) % 5]; r = r * 0.92 + 16; g = g * 1.08 + 12; b = b * 0.86; if (h < 0.03) return [255, 244, 250]; return [r, g, b]; }
      if (cls === 2) { if (L < 80 && h < 0.35) return mix([r, g, b], [78, 128, 64], 0.5); return [r, g * 1.04, b]; }
      if (cls === 3 || cls === 4) { if (h < 0.025) return FLW[Math.floor(blk * 2)]; return [r, g, b]; }
      if (cls === 5) return [r * 0.95, g * 1.06, b * 1.02];
    } else if (season === 2) {     // autumn
      if (cls === 1) { const base = [r, g, b]; const warm = mix([L * 1.35 + 22, L * 1.0 + 8, L * 0.42], LEAF[Math.floor(blk2 * 4) % 4].map(v => v * clamp(L / 120, 0.55, 1.1)), blk2 > 0.62 ? 0.7 : 0.25); if (h < 0.05) return LEAF[Math.floor(blk * 4) % 4]; return mix(base, warm, 0.92); }
      if (cls === 2) { if (h < 0.025) return LEAF[Math.floor(blk * 4) % 4]; return [r * 1.04 + 4, g * 0.98, b * 0.93]; }
      if (cls === 3) { if (h < 0.2) return LEAF[Math.floor(blk * 4) % 4].map(v => v * (0.8 + h)); return [r * 1.02, g * 0.97, b * 0.92]; }
      if (cls === 4) { if (h < 0.11) return LEAF[Math.floor(blk * 4) % 4]; return [r, g, b]; }
      if (cls === 5) { if (h < 0.025) return LEAF[Math.floor(blk * 4) % 4]; return [r * 0.93 + 6, g * 0.92, b * 0.9]; }
    } else if (season === 3) {     // winter
      if (cls === 1) { const cover = 0.95; if (blk2 < cover + (blk - 0.5) * 0.2) return snowTone(L, h); return mix(snowTone(L, h), [150, 142, 112], 0.4); }
      if (cls === 2) { if (blk2 < 0.85) return snowTone(L, h); return mix(snowTone(L, h), [r, g, b], 0.3); }
      if (cls === 3) { if (blk2 < 0.88) return snowTone(L, h); return mix(snowTone(L, h), [r, g, b], 0.3); }
      if (cls === 4) { if (blk2 < 0.7 || L > 90) return snowTone(L, h); return mix(snowTone(L, h), [r, g, b], 0.35); }
      if (cls === 5) { if (nearEdge) return mix([206, 232, 246], [244, 252, 255], h * 0.6); return [r * 0.78, g * 0.9, b * 1.0 + 6]; }
    } else if (season === 4) {     // five centuries of moss and vine: green creeps over rock, flagstone and path
      if (cls === 2 || cls === 4 || cls === 3) { if (blk > 0.5 + (blk2 - 0.5) * 0.5 && h < 0.8) return mix([r, g, b], MSS[1 + Math.floor(h * 3) % 3], 0.55); return [r, g, b]; }
      if (cls === 1) return [r * 0.9, g * 1.02, b * 0.92];
    }
    return null;
  }
  const CLS = k => { const m = TWM.MAT[k]; return m === M.NTURF ? 1 : m === M.NROCK ? 2 : m === M.NGRAV ? 3 : m === M.NFLAG ? 4 : isW(m) || m === M.PLANK && false ? 5 : 0; };
  let maskTiles = null;
  function tileList() { if (maskTiles) return maskTiles; const F = TWM.nhs, set = new Set(F.tiles); for (const k of F.out) set.add(k); maskTiles = Array.from(set); return maskTiles; }
  function chunkMask(c) {
    const CH = A.CH, cv = document.createElement('canvas'); cv.width = CH; cv.height = CH; const g = cv.getContext('2d'), N = TWM.N; g.imageSmoothingEnabled = false; let any = false;
    const list = tileList().slice().sort((p, q) => (p % N + Math.floor(p / N)) - (q % N + Math.floor(q / N)) || p - q);
    for (const k of list) { const cls = CLS(k); if (!cls) continue; const i = k % N, j = Math.floor(k / N), sx = A.SX(i, j) - c.x, st = A.SY(i, j, TWM.H[k]) - c.y;
      if (sx + 33 < 0 || sx - 33 > CH || st + 33 < 0 || st > CH) continue; any = true;
      g.fillStyle = 'rgb(' + cls * 40 + ',0,0)'; g.beginPath(); g.moveTo(sx, st); g.lineTo(sx + 32, st + 16); g.lineTo(sx, st + 32); g.lineTo(sx - 32, st + 16); g.closePath(); g.fill(); g.strokeStyle = g.fillStyle; g.lineWidth = 1.5; g.stroke(); }
    return any ? g.getImageData(0, 0, CH, CH).data : null;
  }
  // returns a canvas with the recoloured nhs pixels of chunk c for the season (null when the chunk holds none); built lazily, cached on the chunk
  function overlay(c, season) {
    if (!c._nhs) c._nhs = { mask: undefined, ov: [] };
    const st = c._nhs; if (st.mask === undefined) st.mask = chunkMask(c); if (!st.mask) { st.ov[season] = null; return null; }
    if (st.ov[season] !== undefined) return st.ov[season];
    const CH = A.CH, src = c.cv.getContext('2d').getImageData(0, 0, CH, CH).data, cv = document.createElement('canvas'); cv.width = CH; cv.height = CH; const g = cv.getContext('2d'), out = g.createImageData(CH, CH), d = out.data, mk = st.mask; let n = 0;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CH; x++) { const p = (y * CH + x) * 4; if (mk[p + 3] < 70) continue; const cls = Math.round(mk[p] / 40); if (!cls || src[p + 3] < 200) continue;
      let ne = false; if (season === 3 && cls === 5) { for (const [dx, dy] of [[-3, 0], [3, 0], [0, -2], [0, 2], [-2, 1], [2, -1]]) { const q = ((y + dy) * CH + x + dx) * 4; if (x + dx < 0 || x + dx >= CH || y + dy < 0 || y + dy >= CH || mk[q + 3] < 70 || Math.round(mk[q] / 40) !== 5) { ne = true; break; } } }
      const rc = recolorPixel(cls, season, src[p], src[p + 1], src[p + 2], x + c.x, y + c.y, ne); if (!rc) continue; d[p] = rc[0]; d[p + 1] = rc[1]; d[p + 2] = rc[2]; d[p + 3] = 255; n++; }
    g.putImageData(out, 0, 0); st.ov[season] = n ? cv : null; return st.ov[season];
  }
  // ---- sprites: recolour a PixelLab broadleaf / conifer / bamboo / rock into four seasons
  const hsv = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn; let h = 0; if (dd) h = mx === r ? ((g - b) / dd + 6) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; return [h * 60, mx ? dd / mx : 0, mx / 255]; };
  function seasonSprite(im, kind, season, variant) {
    const w = im.width, h = im.height, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
    if (kind === 'pine' || kind === 'rock') {   // Hắc Phong Sơn's black pines and basalt are re-toned: bright conifer greens and warm granite
      const idp = g.getImageData(0, 0, w, h), q = idp.data; const PINE = ramp(['#143a26', '#1f5c34', '#2f7d3e', '#4ea04a', '#80c85a', '#b4e07c']);
      for (let i = 0; i < q.length; i += 4) { if (q[i + 3] < 8) continue; const L = lum(q[i], q[i + 1], q[i + 2]), [H0, S0] = hsv(q[i], q[i + 1], q[i + 2]);
        if (kind === 'pine') { if (H0 >= 70 && H0 <= 270 && S0 > 0.1) { const c = tone(PINE, clamp(L / 34, 0, 4.9)); q[i] = c[0]; q[i + 1] = c[1]; q[i + 2] = c[2]; } }
        else { const c = mix(tone(GRN, clamp(L / 26 + 0.5, 0, 5.8)), [190, 150, 118], 0.1); q[i] = c[0]; q[i + 1] = c[1]; q[i + 2] = c[2]; } }
      g.putImageData(idp, 0, 0); }
    if (season === 1) return cv;
    const id = g.getImageData(0, 0, w, h), d = id.data, o = new Uint8ClampedArray(d), al = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : d[(y * w + x) * 4 + 3];
    const decid = kind === 'tree', conif = kind === 'pine';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = (y * w + x) * 4; if (d[p + 3] < 8) continue; const r = d[p], gg = d[p + 1], b = d[p + 2], [H0, S0, V0] = hsv(r, gg, b), L = lum(r, gg, b), hh = rnd(x, y, 7 + variant), blk = rnd(x >> 2, y >> 2, 8 + variant), blk2 = rnd(x >> 3, y >> 3, 9 + variant);
      const leaf = (H0 > 55 && H0 < 175 && S0 > 0.22) && kind !== 'rock', trunk = !leaf && kind !== 'rock' && H0 < 70, exposed = al(x, y - 1) < 8 || al(x, y - 2) < 8 && hh < 0.6;
      let c = null;
      if (season === 0) { if (leaf) { if (decid) { const bl = (variant & 1) ? 0.42 : 0.2; if (blk < bl && L > 60) c = (hh < 0.5 ? [255, 188, 212] : [252, 238, 244]).map(v => v * clamp(L / 120 + 0.6, 0.75, 1.05)); else c = [r * 0.9 + 22, gg * 1.1 + 14, b * 0.78]; } else if (conif) c = [r * 0.9 + 14, gg * 1.08 + 12, b * 0.8]; else c = [r * 0.94 + 18, gg * 1.1 + 14, b * 0.82]; } else if (kind === 'rock' && L < 80 && hh < 0.3) c = [70, 120, 62]; }
      else if (season === 2) { if (leaf) { if (decid) { const pal = (variant & 1) ? [[150, 40, 30], [214, 82, 34], [240, 150, 46]] : [[190, 120, 24], [236, 180, 52], [250, 216, 96]], t = clamp((L - 30) / 110 + (blk - 0.5) * 0.5, 0, 0.999); c = tone(pal, t * 2.0); } else if (conif) c = [r * 1.12 + 10, gg * 0.98 + 4, b * 0.7]; else c = [r * 1.1 + 40, gg * 1.0 + 28, b * 0.6]; } else if (kind === 'rock' && hh < 0.03) c = LEAF[Math.floor(blk * 4) % 4]; }
      else if (season === 3) {
        if (leaf) { if (decid) { if (blk2 + hh * 0.3 > 0.45) { o[p + 3] = 0; continue; } c = [94, 74, 58]; } else if (conif) { c = exposed || (al(x, y - 3) < 8 && hh < 0.7) || hh < 0.16 ? snowTone(L, hh) : mix([r, gg, b], [196, 214, 226], 0.28); } else c = mix([r, gg, b], [214, 224, 210], 0.5); }
        if (exposed && !leaf && L > 45) c = snowTone(L, hh); if (kind === 'rock' && (L > 85 || exposed)) c = snowTone(L, hh); if (decid && leaf === false && exposed) c = snowTone(L, hh); }
      if (c) { o[p] = c[0]; o[p + 1] = c[1]; o[p + 2] = c[2]; }
    }
    // snow caps: leaf pixels with an empty pixel above get white; one extra row at random
    if (season === 3 && decid) for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) { const p = (y * w + x) * 4; if (o[p + 3] < 8) continue; const up = ((y - 1) * w + x) * 4; if (o[up + 3] < 8 && rnd(x, y, 20) < 0.7) { const c = snowTone(120, rnd(x, y, 21)); o[p] = c[0]; o[p + 1] = c[1]; o[p + 2] = c[2]; } }
    id.data.set(o); g.putImageData(id, 0, 0); return cv;
  }
  // bushes and flower beds painted by code
  function paintBush(season, v) {
    const w = 26, h = 20, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
    const base = [['#2d6a31', '#46903a', '#6cb843', '#9ad552'], ['#1f4a28', '#2d6a31', '#46903a', '#6cb843'], ['#8a2e22', '#c0562a', '#e08a30', '#f0c050'], ['#5a4a3c', '#7a6a58', '#94836c', '#aaa088']][season];
    for (let q = 0; q < 14; q++) { const cx = 4 + hash2(q, v, 90) * 18, cy = 6 + hash2(q, v, 91) * 8, r = 3 + hash2(q, v, 92) * 3; for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { if (xx * xx + yy * yy > r * r) continue; const t = clamp((-yy + r) / (2 * r) * 3.2 + hash2(Math.round(cx + xx), Math.round(cy + yy), 93) * 0.9 - 0.4, 0, 3.4); if (season === 3 && hash2(Math.round(cx + xx), Math.round(cy + yy), 94) > 0.45) continue; P(Math.round(cx + xx), Math.round(cy + yy), 1, 1, base[Math.min(3, Math.floor(t))]); } }
    P(3, 15, 20, 2, 'rgba(10,10,20,0.28)');
    if (season === 0) for (let q = 0; q < 16; q++) P(4 + Math.floor(hash2(q, v, 95) * 18), 5 + Math.floor(hash2(q, v, 96) * 9), 2, 2, ['#ffbad2', '#fdf0f4', '#ffe45a'][q % 3]);
    if (season === 1 && v & 1) for (let q = 0; q < 7; q++) P(5 + Math.floor(hash2(q, v, 97) * 16), 6 + Math.floor(hash2(q, v, 98) * 8), 2, 1, '#fdf0f4');
    if (season === 3) { for (let q = 0; q < 14; q++) P(4 + Math.floor(hash2(q, v, 99) * 18), 5 + Math.floor(hash2(q, v, 100) * 4), 3, 1, '#eef4fc'); P(5, 12, 16, 2, '#dde8f6'); }
    return cv;
  }
  function paintFlowers(season, v) {
    const w = 22, h = 12, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
    const pal = [['#ffb6d0', '#fdf2f6', '#ffe45a', '#c4a4f4', '#ff9080'], ['#ff9fc0', '#ffd45a', '#ffffff', '#a98bf0', '#ff7060'], ['#c9782a', '#a6501f', '#d9a53a', '#8a6a30', '#b86a30'], ['#eef4fc', '#dde8f6', '#cdd9ee', '#eef4fc', '#b8c8e4']][season];
    for (let q = 0; q < 34; q++) { const x = 1 + Math.floor(hash2(q, v, 101) * 19), y = 3 + Math.floor(hash2(q, v, 102) * 8); P(x, y + 1, 1, 2, season === 3 ? '#9fb2d0' : season === 2 ? '#7a5a2a' : '#3f8a3a'); P(x - (q & 1), y, 2 - (season === 3 ? 0 : 0) + (q & 1), 2, pal[q % 5]); }
    return cv;
  }
  const cacheS = new Map();
  function seasonal(key, make) { let a = cacheS.get(key); if (!a) { a = [0, 1, 2, 3].map(s => make(s)); cacheS.set(key, a); } return a; }
  function drawSway(g, im, s, amp, alpha, scale, R) {
    const w = im.width, h = im.height, t = R.t * 0.9 + s.ph, st = 6, py = s.sp.py; g.globalAlpha = alpha;
    const sc = scale || 1, X = s.X - (w * sc - w) / 2, Y = s.Y - (h * sc - h);
    for (let y = 0; y < h; y += st) { const k = Math.pow(Math.max(0, (py * 0.85 - y) / (py * 0.85)), 1.4), o = Math.round(Math.sin(t + y * 0.018) * amp * k * (S.gust || 1)); g.drawImage(im, 0, y, w, Math.min(st, h - y), Math.round(X + o), Math.round(Y + y * sc), Math.round(w * sc), Math.max(1, Math.round(Math.min(st, h - y) * sc))); }
    g.globalAlpha = 1;
  }
  function blendDraw(g, arr, s, amp, R) {
    const age = 1 + S.age * 0.1, a = S.a, b = S.b, f = S.f, draw = (im, al) => { if (amp) drawSway(g, im, s, amp, al, age, R); else { g.globalAlpha = al; const w = im.width, h = im.height; g.drawImage(im, Math.round(s.X - (w * age - w) / 2), Math.round(s.Y - (h * age - h)), Math.round(w * age), Math.round(h * age)); g.globalAlpha = 1; } };
    if (f < 0.02 || a === b) { draw(arr[a], 1); return; } if (f > 0.98) { draw(arr[b], 1); return; }
    draw(arr[a], 1); draw(arr[b], f);
  }
  const TREEIMG = ['nhs_tree_a', 'nhs_tree_b', 'nhs_tree_c', 'nhs_tree_d'], KINDMAP = { nhspine: ['hps_pine_a', 'hps_pine_b', 'hps_pine_c'], nhsbamboo: ['hps_bamboo_a', 'hps_bamboo_b'], nhsrock: ['hps_rock_a', 'hps_rock_b', 'hps_rock_c'] };
  function sprite(p) {
    const kd = p.kind; let arr, py, w, h, amp = 0, kindT = '';
    if (kd === 'nhstree' || kd === 'nhspine' || kd === 'nhsbamboo' || kd === 'nhsrock') {
      const names = kd === 'nhstree' ? TREEIMG : KINDMAP[kd], nm = names.filter(n => A.IMG[n]); if (!nm.length) return null; const n = nm[(p.v || 0) % nm.length], r = A.IMG[n]; kindT = kd === 'nhstree' ? 'tree' : kd === 'nhspine' ? 'pine' : kd === 'nhsbamboo' ? 'bamboo' : 'rock';
      arr = seasonal(n, s => seasonSprite(r.im, kindT, s, (p.v || 0))); py = r.py; w = r.w; h = r.h; amp = kd === 'nhstree' ? 1.0 : kd === 'nhspine' ? 0.9 : kd === 'nhsbamboo' ? 1.8 : 0;
    } else if (kd === 'nhsbush') { const v = (p.v || 0) & 3; arr = seasonal('bush' + v, s => paintBush(s, v)); w = 26; h = 20; py = 17; amp = 0.5; }
    else if (kd === 'nhsflower') { const v = (p.v || 0) & 3; arr = seasonal('flw' + v, s => paintFlowers(s, v)); w = 22; h = 12; py = 10; }
    else if (kd === 'nhsprison' || kd === 'nhssummit') return null;   // plain PixelLab sprites (IMGKINDS)
    else return null;
    return { w, h, py, frames: [arr[1]], flat: false, sway: 0, draw: (g, s, f, R) => blendDraw(g, arr, s, amp, R), seasonArr: arr };
  }
  Object.assign(A.IMGKINDS, { nhsprison: ['nhs_prison_a', 'nhs_prison_b'], nhssummit: ['nhs_summit_a'] });
  Object.assign(A.SWAY, { nhsprison: 0, nhssummit: 0 });
  A.nhs = { top, face, edge, stairPal: STAIR, seamTone, sprite, S, SEASONS, overlay, ramps: { GRS, GRN, SCR, FLG, WTR }, MSS, snowTone };
})();
