'use strict';
// ===== Tây Du Ký v2 — art: terrain shading, cliff faces, baked ground chunks, prop painters =====
// Original, code-painted pixel art in the v2 style (cocoa-plum ink #2a1726, light from the top left, hue-shifted ramps, clumped forms).
// Terrain is shaded per pixel in WORLD space, so textures run continuously across tiles and material borders are organic (no tile grid).
// Every prop is a separate sprite with a ground pivot; trees and banners have sway frames. Emissive pixels (glow moss, crystals,
// lanterns) go to a separate mask that the night pass adds back.
const TWA = (function () {
  const M = TWM.M, N = TWM.N, LV = 16;               // 1 level = 16 art px
  const OX = N * 32, OY = 12 * 16;                   // screen origin offsets (all art px >= 0)
  const WORLD_W = OX * 2, WORLD_H = N * 32 + OY + 160;
  const hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; };
  const ramp = a => a.map(hx);
  const INK = hx('#2a1726');
  const { vnoise, hash2 } = TWM;
  const SX = (i, j) => (i - j) * 32 + OX, SY = (i, j, h) => (i + j) * 16 - h * LV + OY;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

  // ---------------------------------------------------------------- palettes
  const P = {
    grass: ramp(['#356a46', '#437e4c', '#559656', '#6cae60', '#8cc872', '#b0de8c']),
    lush: ramp(['#28553c', '#326644', '#3e784c', '#4e8c54', '#62a25c']),
    flowers: ramp(['#ff9ab8', '#ffd0de', '#ffffff', '#f8d470', '#c8a0f0']),
    dirt: ramp(['#7e5e44', '#957054', '#aa8462', '#bf9a72', '#d2b088']),
    pave: ramp(['#6f7670', '#858c82', '#9aa094', '#aeb3a4', '#c3c6b4']),
    rock: ramp(['#4b5853', '#5b6a63', '#6d7d73', '#829386', '#9aab9b']),
    moss: ramp(['#3b6a44', '#4a7e4c', '#5e9656', '#78ae64']),
    sand: ramp(['#cdb284', '#dcc496', '#e8d4a8', '#f2e2bc']),
    pool: ramp(['#26809e', '#2f94b2', '#3aa8c4', '#55bed4', '#8ad8e4']),
    sea: ramp(['#1d5a8e', '#24689e', '#2e7ab0', '#3e8ec2', '#6aaed6']),
    stream: ramp(['#2a88a8', '#3398b8', '#42aac8', '#62c0d8', '#9ae0ea']),
    wood: ramp(['#5a3a28', '#744c32', '#8e623e', '#a87a4e']),
    gorge: ramp(['#251e34', '#2e263e', '#382e4a', '#433856', '#514566']),
    glow: ramp(['#2f8a4e', '#46c060', '#7cf07a', '#c0ffb0']),
    silk: ramp(['#8e88b0', '#b4aed4', '#d8d4ee', '#f4f2ff']),
    chasm: ramp(['#0c0814', '#120c1c', '#191226', '#221a32']),
    spring: ramp(['#3a9c98', '#4cb4ac', '#64c8bc', '#88dccc', '#c0f2e6']),
    cavef: ramp(['#1e1828', '#241e30', '#2c2438', '#352c44']),
    webpath: ramp(['#4a405e', '#544a6a', '#605476', '#6c6084']),
    ledgeH: ramp(['#6a7266', '#7c8476', '#8e9686', '#a2a998']),
    ledgeB: ramp(['#3a3050', '#44385c', '#4e4268', '#5a4e76']),
    faceH: ramp(['#34403c', '#3f4c46', '#4b5a52', '#58685e', '#677a6c', '#7a8e7e']),
    faceB: ramp(['#18131f', '#1f1928', '#262032', '#2e273c', '#383048', '#433a56']),
    faceS: ramp(['#14385e', '#1a4470', '#215080', '#2a5e90']),
    heaven: ramp(['#c9b9d0', '#d7c9dd', '#e8dfea', '#f3ebef', '#fff3e3']),
    jade: ramp(['#607e80','#83a29a','#a9c8b7','#cedfc6','#f5e9ca']),
    garden: ramp(['#64847c','#84a88d','#a2bd98','#bbd0a4','#e0d9ab']),
    bronze: ramp(['#514151','#675361','#806969','#a38777','#c6a475']),
    goldInlay: ramp(['#927358','#c5a468','#ead099','#fff0c8']),
    cloud: ramp(['#9fb8c9', '#bed0da', '#dce4e8', '#f5eced', '#fff8ed']),
    vine: ramp(['#244a32', '#2f6040', '#3e7a4c', '#56965a']),
  };
  const PH = {   // development placeholder palettes (3 tones + accent) per biome (design palette table)
    lat: ['#cdb27a', '#d8c08a', '#e4cf9c', '#fff0b0'], hds: ['#7e3420', '#8e3c24', '#9e4a2c', '#ffb04a'], hps: ['#3c4a4c', '#485a5c', '#546a6c', '#e8a050'], nhs: ['#4a7a3c', '#5e9248', '#78ac56', '#f2d878'],
    bcl: ['#827c8c', '#8e8898', '#9a94a4', '#ece6dc'], clt: ['#9a7e52', '#a88a5a', '#b69866', '#e8c860'], tth: ['#36689e', '#3e74aa', '#4a80b6', '#9adcff'],
    tc: ['#ddd0e2', '#e6dbea', '#efe6f2', '#e8c860'], btp: ['#e2c880', '#ead490', '#f2e0a4', '#fff2c8'], nhs: ['#7c8894', '#88949e', '#94a0aa', '#7ea06a'],
    ntq: ['#708e78','#87a18a','#9fb49b','#e8d6a0'], hvd: ['#8a5146','#a96350','#c47c60','#f2b77b'], lhd: ['#79647c','#927a8c','#ae9298','#e3bf97'], sdl: ['#776758','#927d69','#ad9680','#d9bd8a'],
  };
  const PHR = {}; for (const k in PH) PHR[k] = ramp(PH[k]);
  const biomeId = k => TWM.biomes[TWM.BIO[k]].id;
  const tone = (r, v) => r[Math.max(0, Math.min(r.length - 1, Math.floor(v)))];

  // Bake prop contact shadows into the receiving terrace only. Coordinates are in tiles.
  const shadowTiles = new Map();
  const shadowRadii = {tcgate:[3.8,0.8],tcgatehouse:[1.35,1.1],tcpalace:[1.45,1.1],
    tcpavilion:[1.5,1.3],tcpeach:[1.25,1],tcfurnace:[1.3,1.15],tcpillar:[0.65,0.35],
    tclantern:[0.6,0.5],tcsilklamp:[0.48,0.28],tcbrazier:[0.45,0.38]};
  for (const p of TWM.props) {
    const radii = shadowRadii[p.kind];
    if (!radii) continue;
    const [a,b] = radii, [w,h] = p.fp || [1,1];
    const x = p.i + w/2 + 0.35, y = p.j + h/2, level = TWM.h(p.i,p.j);
    for (let j=Math.floor(y-b); j<=Math.floor(y+b); j++) for (let i=Math.floor(x-a); i<=Math.floor(x+a); i++) {
      if (TWM.h(i,j) !== level) continue;
      const k = TWM.id(i,j);
      if (!shadowTiles.has(k)) shadowTiles.set(k,[]);
      shadowTiles.get(k).push({x,y,a,b});
    }
  }

  // ---------------------------------------------------------------- terrain top shader (world-space)
  // returns colour; sets SH.em (emissive colour or null) and SH.water (glint type or 0)
  const SH = { em: null, water: 0 };
  function top(m, I, J, X, Y, k, dith) {
    SH.em = null; SH.water = 0;
    const n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), d = dith;
    if (TWM.bleed && TWM.bleed[k] && TWA.fire && m < M.PH) { const c0 = top0(m, I, J, X, Y, k, dith), v = TWM.bleed[k] / 5, r = hash2(X, Y, 130), nn = vnoise(I * 0.8, J * 0.8, 131); if (r < v * (0.35 + nn * 0.6)) { const a = TWA.fire.seamTone(I, J, n0, n1); if (r < 0.012 * v) { SH.em = [255, 150, 60]; return [255, 150, 60]; } return mix(c0, a, 0.78); } return c0; }   // Hỏa Diệm Sơn ash staining on built neighbours (dithered, colour only)
    if (m < M.PH && TWA.fire && TWM.seam[k] && TWM.seamK[k] === TWM.bi.hds && m !== M.SKYC) { const sm = TWM.seam[k], dd = sm >> 2, t = Math.max(0, 1 - (dd - 1 + (n1 - 0.5) * 2) / 7), c0 = top0(m, I, J, X, Y, k, dith); return mix(c0, TWA.fire.seamTone(I, J, n0, n1), Math.min(0.95, t * 1.05)); }
    if (m < M.PH && TWA.river && TWM.seam[k] && TWM.seamK[k] === TWM.bi.tth) { const sm = TWM.seam[k], dd = sm >> 2, t = Math.max(0, 1 - (dd - 1 + (n1 - 0.5) * 2) / 6), c0 = top0(m, I, J, X, Y, k, dith); return mix(c0, TWA.river.seamTone(I, J, n0, n1), Math.min(0.95, t * 1.05)); }   // Thông Thiên Hà river-bank seam
    if (m < M.PH && TWM.seam[k] && seamArt(k)) { const sm = TWM.seam[k], dd = sm >> 2, t = Math.max(0, 1 - (dd - 1 + (n1 - 0.5) * 2) / 7), c0 = top0(m, I, J, X, Y, k, dith); return mix(c0, seamArt(k).seamTone(I, J, n0, n1), Math.min(0.95, t * 1.05)); }   // Hắc Phong Sơn / Ngũ Hành Sơn seam
    if (m < M.PH && TWA.lion && TWM.seam[k] && TWM.seamK[k] === TWM.bi.sdl) { const sm = TWM.seam[k], dd = sm >> 2, t = Math.max(0, 1 - (dd - 1 + (n1 - 0.5) * 2) / 6), c0 = top0(m, I, J, X, Y, k, dith); return mix(c0, TWA.lion.seamTone(I, J, n0, n1), Math.min(0.95, t * 1.05)); }   // Sư Đà Lĩnh slate seam
    if (m !== M.SKYC && m !== M.SKYD && m < M.PH && TWA.ext && TWM.seam[k] && TWM.seamK[k] === TWM.bi.btp) {      // provisional paths inside the palm's cloud fade ring dissolve into cloud too
      const sm = TWM.seam[k], dd = sm >> 2, t = Math.max(0, 1 - (dd - 1 + (n1 - 0.5) * 3) / 15), c0 = top0(m, I, J, X, Y, k, dith); return mix(c0, TWA.ext.seamTone(I, J, n0, n1), Math.min(0.97, t * 1.12));
    }
    return top0(m, I, J, X, Y, k, dith);
  }
  function top0(m, I, J, X, Y, k, dith) {
    SH.em = null; SH.water = 0;
    const n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), d = dith;
    if (TWA.hps && TWM.BIO[k] === TWM.bi.hps && (m === M.STREAM || m === M.POOL)) return TWA.hps.top(m, I, J, X, Y, k, dith, SH);   // Hắc Phong Sơn stream
    if (TWA.nhs && TWM.BIO[k] === TWM.bi.nhs && (m === M.STREAM || m === M.POOL)) return TWA.nhs.top(m, I, J, X, Y, k, dith, SH);   // Ngũ Hành Sơn water
    if (TWA.lion && TWM.BIO[k] === TWM.bi.sdl && (m === M.CHASM || m === M.STREAM || m === M.POOL)) return TWA.lion.top(m, I, J, X, Y, k, dith, SH);   // Sư Đà Lĩnh gorge and river
    if (TWA.river && (TWM.BIO[k] === TWM.bi.tth || (TWM.tthNear && TWM.tthNear[k])) && (m === M.STREAM || m === M.POOL || m === M.SEA)) return TWA.river.top(m, I, J, X, Y, k, dith, SH);   // Thông Thiên Hà: the great river
    switch (m) {
      case M.BANK: case M.WSAND: case M.WREED: case M.COBBLE: case M.DOCK: case M.BLUFF: case M.PAVER: return TWA.river.top(m, I, J, X, Y, k, dith, SH);   // Thông Thiên Hà (tw-river-art.js)
      case M.NTURF: case M.NROCK: case M.NGRAV: case M.NFLAG: return TWA.nhs.top(m, I, J, X, Y, k, dith, SH);   // Ngũ Hành Sơn (tw-nhs-art.js)
      case M.HROCK: case M.HMOSS: case M.HGRAV: case M.HFLAG: case M.HDECK: return TWA.hps.top(m, I, J, X, Y, k, dith, SH);   // Hắc Phong Sơn (tw-hps-art.js)
      case M.SLATE: case M.BONE: case M.RAMP: case M.MIRE: case M.YARD: case M.PLANK: case M.SCRUB: return TWA.lion.top(m, I, J, X, Y, k, dith, SH);   // Sư Đà Lĩnh (tw-lion-art.js)
      case M.ASH: case M.BASALT: case M.LAVA: case M.WARM: case M.CINDER: case M.SCORCH: case M.LBRIDGE: case M.CRUST: return TWA.fire.top(m, I, J, X, Y, k, dith, SH);   // Hỏa Diệm Sơn (tw-fire-art.js)
      case M.SKYC: case M.SKYD: return TWA.ext.top(m, I, J, X, Y, k, dith, SH);        // Buddha's Palm cloud terraces (tw-palm-art.js)
      case M.HEAVEN: return tone(P.heaven, 1.6 + n0 + n1 * 0.8);
      case M.PEACHLAWN: {
        const grass = tone(P.garden, 1 + n0 * 2.3 + n1 * 0.7);
        if (hash2(X >> 1,Y,84) < 0.008) return P.flowers[1];
        return grass;
      }
      case M.HEAVENPAVE: case M.BRONZE: {
        const forge = m === M.BRONZE, r = forge ? P.bronze : P.jade;
        const row = Math.floor(J), u = (I + (row % 2)) / 2;
        const seam = u % 1 < 0.018 || J % 1 < 0.032;
        let c = seam ? r[1] : mix(r[2], r[3], 0.25 + hash2(Math.floor(u), row, 182) * 0.47 + n1 * 0.12);
        const centre = forge ? TWM.tc.furnace : TWM.tc.court;
        const dx = I - centre[0] - 0.5, dy = J - centre[1] - 0.5;
        const radius = Math.hypot(dx,dy);
        if (forge) {
          const oct = Math.max(Math.abs(dx), Math.abs(dy), (Math.abs(dx) + Math.abs(dy)) * 0.707);
          if (Math.abs(oct-2.25)<0.065 || Math.abs(oct-2.48)<0.035) c = P.goldInlay[1];
        } else if (radius < 2.7) {
          const a = Math.atan2(dy,dx);
          if (radius < 2.49) c = mix(c, P.jade[1], 0.5);
          const petal = 1.02 + 0.73*Math.cos(4*a)**2;
          if (Math.abs(radius-2.6)<0.06 || Math.abs(radius-2.38)<0.05 ||
              Math.abs(radius-petal)<0.065 || Math.abs(radius-0.45)<0.07) c = P.goldInlay[2];
          if (radius < 0.28) c = P.goldInlay[1];
        }
        return c;
      }
      case M.CLOUD: case M.HEAVENBRIDGE: {
        // Broad curling banks share world coordinates so they continue beneath the bridges.
        const swell = vnoise(I * 0.14 + n0 * 0.18, J * 0.23 + n1 * 0.12, 83);
        const veil = vnoise((I-J)*0.042, (I+J)*0.23+swell, 85);
        return mix([160,179,206], [247,234,229], swell * 0.48 + veil * 0.50 + n0 * 0.02);
      }
      case M.TRAIL: { const r=PHR[biomeId(k)]||PHR.tc; return mix(tone(r,1+n0*1.4),[223,200,164],0.35); }
      case M.PLACEWATER: { SH.water=2; return tone(P.stream,1+n0*1.5); }
      case M.GRASS: case M.LUSH: case M.FLOWER: {
        const r = m === M.LUSH ? P.lush : P.grass;
        let t = 1.4 + n0 * 2.0 + n1 * 0.9 + (d ? 0.25 : 0);
        if (hp < 0.07) t += 1.2; else if (hash2(X, Y - 1, 9) < 0.07) t -= 1.0;        // blades: a light tip with a shaded foot
        let c = tone(r, t);
        if (m === M.FLOWER && hash2(X >> 2, Y >> 1, 12) < 0.035 && n1 > 0.45) c = P.flowers[Math.floor(hash2(X >> 3, Y >> 2, 13) * 5)];
        else if (hash2(X >> 2, Y >> 2, 14) < 0.004 && vnoise(I * 0.9, J * 0.9, 16) > 0.6) c = P.flowers[Math.floor(hash2(X >> 3, Y >> 3, 15) * 4)];
        return c;
      }
      case M.DIRT: { let t = 1.5 + n0 * 1.6 + n1 * 0.8 + (d ? 0.2 : 0); if (hp < 0.05) return P.pave[3]; if (hash2(X, Y, 16) < 0.04) t -= 1.4; return tone(P.dirt, t); }
      case M.PAVE: case M.LEDGE: {
        const r = biomeId(k) === 'btd' ? P.ledgeB : m === M.LEDGE ? P.ledgeH : P.pave;
        const u = I * 2.2 + (Math.floor(J * 2.2) % 2) * 0.5, v = J * 2.2, fu = u - Math.floor(u), fv = v - Math.floor(v);
        if (fu < 0.07 || fv < 0.1) return n1 > 0.62 && biomeId(k) !== 'btd' ? P.moss[1] : shade(r[0], 0.85);
        const id = hash2(Math.floor(u), Math.floor(v), 17); let t = 1 + id * 2.4 + (fu < 0.18 || fv < 0.22 ? 0.8 : 0) - (fu > 0.9 || fv > 0.88 ? 0.7 : 0);
        return tone(r, t);
      }
      case M.ROCK: {
        if (biomeId(k) === 'btd') { const t = 1 + n0 * 2 + n1; return tone(P.gorge, t + 0.6); }
        let t = 1 + n0 * 2.3 + n1 * 0.9 + (d ? 0.3 : 0); if (vnoise(I * 0.4, J * 0.4, 18) > 0.55) return tone(P.moss, t * 0.8);
        return tone(P.rock, t);
      }
      case M.SAND: { let t = 0.8 + n0 * 1.8 + n1 * 0.7; if (hp < 0.02) return P.flowers[1]; return tone(P.sand, t); }
      case M.MOSSY: { const t = 0.8 + n0 * 2 + n1 + (d ? 0.3 : 0); return hash2(X >> 2, Y >> 1, 19) < 0.35 ? tone(P.rock, t + 1) : tone(P.moss, t); }
      case M.POOL: case M.STREAM: case M.SEA: case M.SPRING: {
        const r = m === M.SEA ? P.sea : m === M.SPRING ? P.spring : m === M.STREAM ? P.stream : P.pool;
        SH.water = m === M.SEA ? 1 : m === M.STREAM ? 2 : m === M.SPRING ? 3 : 4;
        return tone(r, 1.2 + n0 * 1.4 + n1 * 0.6 + (d ? 0.25 : 0));
      }
      case M.BRIDGE: { SH.water = 2; return tone(P.stream, 1.2 + n0 * 1.4 + n1 * 0.6 + (d ? 0.25 : 0)); }      // water under the stone bridge sprite
      case M.GORGE: case M.GLOW: case M.WEBF: case M.CAVEF: {
        const r = m === M.CAVEF ? P.cavef : P.gorge; let t = 1 + n0 * 2 + n1 * 0.9 + (d ? 0.25 : 0);
        if (hp < 0.05) t += 1.4;                                                              // gravel
        let c = tone(r, t);
        if (m === M.GLOW || (m === M.GORGE && n1 > 0.85)) {
          const g = vnoise(I * 3.4, J * 3.4, 21);
          if (g > 0.62) { const gi = g > 0.8 ? 2 : g > 0.7 ? 1 : 0; c = P.glow[gi]; if (gi >= 2 && hash2(X, Y, 22) < 0.3) SH.em = P.glow[gi + 1]; }
        }
        if (m === M.WEBF) c = web(I, J, c);
        return c;
      }
      case M.WEBPATH: { const c = tone(P.webpath, 1 + n0 * 1.6 + n1 * 0.8 + (d ? 0.25 : 0)); return ((I * 3 + J * 5) % 1 < 0.06 || (I * 5 - J * 3 + 100) % 1 < 0.05) ? mix(c, P.silk[2], 0.5) : c; }
      case M.CHASM: { const t = 0.6 + n0 * 1.4 + n1 * 0.6; return hash2(X >> 1, Y, 23) < 0.03 ? P.chasm[3] : tone(P.chasm, t); }
      case M.SILKB: { const t = 0.6 + n0 * 1.4 + n1 * 0.6; return tone(P.chasm, t); }                              // the abyss under the silk bridge sprite
      default: {
        if (m >= M.PH) {   // development placeholder: own palette + a faint diagonal hatch so nobody mistakes it for finished art
          const b = TWM.biomes[m - M.PH].id, r = PHR[b] || PHR.tc; let c = tone(r, 0.5 + n0 * 2 + n1 * 0.6);
          const sm = TWM.seam[k]; if (sm && TWM.seamK[k] === TWM.bi.hds && TWA.fire) { const d = sm >> 2, t = Math.max(0, 1 - (d - 1 + (n1 - 0.5) * 2) / 7); return mix(c, TWA.fire.seamTone(I, J, n0, n1), Math.min(0.95, t * 1.05)); }
          if (sm && seamArt(k)) { const d = sm >> 2, t = Math.max(0, 1 - (d - 1 + (n1 - 0.5) * 2) / 7); return mix(c, seamArt(k).seamTone(I, J, n0, n1), Math.min(0.95, t * 1.05)); }
          if (sm && TWM.seamK[k] === TWM.bi.tth && TWA.river) { const d = sm >> 2, t = Math.max(0, 1 - (d - 1 + (n1 - 0.5) * 2) / 6); return mix(c, TWA.river.seamTone(I, J, n0, n1), Math.min(0.95, t * 1.05)); }
          if (sm && TWM.seamK[k] === TWM.bi.sdl && TWA.lion) { const d = sm >> 2, t = Math.max(0, 1 - (d - 1 + (n1 - 0.5) * 2) / 6); return mix(c, TWA.lion.seamTone(I, J, n0, n1), Math.min(0.95, t * 1.05)); }
          if (sm && TWM.seamK[k] === TWM.bi.btp && TWA.ext) { const d = sm >> 2, t = Math.max(0, 1 - (d - 1 + (n1 - 0.5) * 3) / 15); return mix(c, TWA.ext.seamTone(I, J, n0, n1), Math.min(0.97, t * 1.12)); }
          if (sm) { const d = sm >> 2, t = Math.max(0, 1 - (d - 1 + (n1 - 0.5) * 1.6) / 5.5), tgt = (sm & 3) === 1 ? tone(P.grass, 1.2 + n0 * 2.2 + n1) : (sm & 3) === 2 ? tone(P.gorge, 1 + n0 * 2 + n1) : tone(P.heaven, 1 + n0 * 2 + n1); c = mix(c, tgt, Math.min(0.97, t * 1.05)); return c; }
          if(TWM.edgeOther[k]!==255){const other=PHR[TWM.biomes[TWM.edgeOther[k]].id]||PHR.tc, w=Math.max(0,(5-TWM.edgeDist[k])/10);c=mix(c,tone(other,1+n0*1.5),w);}
          if (((X + Y * 2) % 24) < 2) c = shade(c, 0.9); if (hp < 0.01) c = r[3];
          return c;
        }
        return [255, 0, 255];
      }
    }
  }
  function web(I, J, c) {                // silk on the gorge floor: radial spokes and rings around the canopy centre
    const w = TWM.btd.canopy, dx = I - w[0], dy = (J - w[1]) * 1.5, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const ring = (d * 1.2) % 1 < 0.07, spoke = ((a / (Math.PI * 2)) * 18 + 100) % 1 < 0.035 * Math.max(1, 6 / (d + 1));
    return ring || spoke ? mix(c, P.silk[2], 0.6) : c;
  }

  // analytic water shapes (TWM.water): smooth shorelines independent of the tile grid
  function waterAt(I, J) {
    let best = 9, mat = 0; const wob = (vnoise(I * 1.1, J * 1.1, 52) - 0.5) * 0.5;
    for (const w of TWM.water) {
      let d;
      if (w.type === 'ell') d = (Math.sqrt(((I - w.c[0]) / w.rx) ** 2 + ((J - w.c[1]) / w.ry) ** 2) - 1) * Math.min(w.rx, w.ry);
      else if (w.type === 'sea') d = w.f(J) - I;
      else { d = 9; for (let k = 0; k < w.pts.length - 1; k++) { const [ax, ay] = w.pts[k], [bx, by] = w.pts[k + 1], vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy, t = Math.max(0, Math.min(1, ((I - ax) * vx + (J - ay) * vy) / L)); d = Math.min(d, Math.hypot(I - ax - vx * t, J - ay - vy * t)); } d -= w.w; }
      d += wob; if (d < best) { best = d; mat = w.mat; }
    }
    return [best, mat];
  }

  // ---------------------------------------------------------------- cliff faces
  function faceCol(b, side, lx, ry, drop, elev, gx, k) {
    if (b === 'btp' && TWA.ext) return TWA.ext.face(side, lx, ry, drop, elev, gx, k, SH);
    if ((b === 'sdl' || (TWM.lionNear && TWM.lionNear[k])) && TWA.lion) return TWA.lion.face(side, lx, ry, drop, elev, gx, k, SH);
    if ((b === 'nhs' || (TWM.nhsNear && TWM.nhsNear[k])) && TWA.nhs) return TWA.nhs.face(side, lx, ry, drop, elev, gx, k, SH);
    if ((b === 'hps' || (TWM.hpsNear && TWM.hpsNear[k])) && TWA.hps) return TWA.hps.face(side, lx, ry, drop, elev, gx, k, SH);
    if ((b === 'tth' || (TWM.tthNear && TWM.tthNear[k])) && TWA.river) return TWA.river.face(side, lx, ry, drop, elev, gx, k, SH);
    if ((b === 'hds' || (TWM.fireNear && TWM.fireNear[k])) && TWA.fire) return TWA.fire.face(side, lx, ry, drop, elev, gx, k, SH);
    // b: biome id; side 0 = front-left (lit), 1 = front-right (shade); lx = global column; ry = px below the lip; elev = absolute px height
    const sea = TWM.MAT[k] === M.SEA;
    const R = sea ? P.faceS : b === 'btd' ? P.faceB : b === 'hqs' ? P.faceH : null;
    if (b === 'tc') {
      const r = TWM.MAT[k] === M.BRONZE ? P.bronze : P.jade, shadow = side ? 0.76 : 0.90;
      if (ry < 3 || (drop > 24 && ry >= 9 && ry < 11)) return shade(P.goldInlay[2], shadow);
      if (ry < 7 || ry > drop - 5) return shade(r[1], shadow);
      if (drop >= 48 && ry >= 12 && ry < 28) {
        // Carved lozenges and a gilt bead repeat underneath the terrace cornice.
        const x = Math.abs(gx%24 - 12), y = Math.abs(ry - 19);
        if (x + y*1.7 < 3) return shade(P.goldInlay[1],shadow);
        if (Math.abs(x+y*1.7-10)<1.5 || ry === 27) return shade(r[3],shadow);
        return shade(r[1],shadow);
      }
      const course = Math.floor((ry - 7) / 10);
      const joint = (gx + course * 15) % 32 < 2 || (ry - 7) % 10 < 2;
      return shade(r[joint ? 1 : 2], shadow + hash2((gx + course * 15) >> 5, course, 223)*0.07);
    }
    if (!R) { const r = PHR[b] || PHR.tc; return shade(r[side ? 0 : 1], side ? 0.62 : 0.75); }
    const band = Math.floor((elev + vnoise(gx * 0.08, 0.5, 30) * 6) / 7);
    let t = (side ? 1.2 : 2.6) + hash2(band, Math.floor(gx / 9), 31) * 1.6 + (vnoise(gx * 0.2, elev * 0.15, 32) - 0.5) * 1.4;
    if ((elev + Math.floor(vnoise(gx * 0.1, 0, 33) * 5)) % 7 === 0) t -= 1.1;                       // strata line
    if (ry > drop - 4) t -= (4 - (drop - ry)) * 0.45;                                                // contact shade
    let c = tone(R, t);
    if (ry === drop - 1) return INK;
    if (b === 'hqs' && !sea) {
      const dl = 2 + Math.floor(hash2(gx, 0, 34) * hash2(gx >> 2, 1, 35) * 9);
      if (ry < dl) return tone(P.moss, 3 - ry * 0.5 + (side ? -1 : 0));                             // moss lip with drips
      if (hash2(gx >> 1, 7, 36) < 0.05 && ry < drop * 0.75) { const leaf = (ry + gx) % 5 === 0; return tone(P.vine, leaf ? 3 : side ? 0.5 : 1.5); }   // hanging vines
    }
    if (b === 'btd') {
      if (hash2(gx, ry >> 1, 37) < 0.012) { SH.em = P.glow[2]; return P.glow[1]; }                 // glow specks
      if (hash2(gx >> 1, 9, 38) < 0.03 && ry < drop * 0.6) return mix(c, P.silk[2], 0.45);        // silk threads
      if (ry < 2) return tone(R, 4.5);
    }
    return c;
  }

  // ---------------------------------------------------------------- chunk baking
  const CH = 512;
  function bakeChunk(cx, cy) {
    const X0 = cx * CH, Y0 = cy * CH;
    const img = new ImageData(CH, CH), d = img.data, em = new Uint8ClampedArray(CH * CH * 4), wat = new Uint8Array(CH * CH);
    let anyEm = false;
    const put = (x, y, c, e, w) => {
      x -= X0; y -= Y0; if (x < 0 || y < 0 || x >= CH || y >= CH) return;
      const p = (y * CH + x), q = p * 4; d[q] = c[0]; d[q + 1] = c[1]; d[q + 2] = c[2]; d[q + 3] = 255;
      if (e) { em[q] = e[0]; em[q + 1] = e[1]; em[q + 2] = e[2]; em[q + 3] = 255; anyEm = true; } else if (em[q + 3]) em[q + 3] = 0;
      wat[p] = w || 0;
    };
    const H = TWM.H, MAT = TWM.MAT;
    for (let dsum = 0; dsum <= 2 * N - 2; dsum++) {
      const iA = Math.max(0, dsum - N + 1), iB = Math.min(N - 1, dsum);
      for (let i = iA; i <= iB; i++) {
        const j = dsum - i, k = TWM.id(i, j), m = MAT[k]; if (m === M.VOID) continue;
        const h = H[k], sx = SX(i, j), sy = SY(i, j, h);
        if (sx + 32 < X0 || sx - 32 >= X0 + CH || sy >= Y0 + CH || sy + 32 + 14 * LV < Y0) continue;
        drawTile(i, j, k, m, h, sx, sy, put);
      }
    }
    const cv = document.createElement('canvas'); cv.width = CH; cv.height = CH; cv.getContext('2d').putImageData(img, 0, 0);
    let ecv = null; if (anyEm) { ecv = document.createElement('canvas'); ecv.width = CH; ecv.height = CH; ecv.getContext('2d').putImageData(new ImageData(em, CH, CH), 0, 0); }
    // animated water: sparse glint candidates on pixels that stayed water after every overdraw
    const glints = [];
    for (let p = 0; p < CH * CH; p++) if (wat[p] && hash2(p % CH + X0, (p / CH | 0) + Y0, 40) < 0.07) glints.push(p % CH, p / CH | 0, wat[p]);
    return { cv, ecv, glints: Int16Array.from(glints), x: X0, y: Y0 };
  }
  function lowerN(i, j) { return TWM.inMap(i, j) && TWM.MAT[TWM.id(i, j)] !== M.VOID ? TWM.H[TWM.id(i, j)] : -6; }
  function drawTile(i, j, k, m, h, sx, sy, put) {
    const b = biomeId(k), H = TWM.H, MAT = TWM.MAT;
    // silk bridge over the chasm: the abyss first, then the deck
    if (m === M.HEAVENBRIDGE) {
      drawTop(i,j,k,M.CLOUD,-1,sx,SY(i,j,-1),put,b,0,0);
      // A continuous jade deck seats the illustrated arch against both abutments.
      drawTop(i,j,k,M.HEAVENPAVE,h,sx,sy,put,b,0,0);
      return;
    }
    if (m === M.SILKB) drawTop(i, j, k, M.CHASM, 0, sx, SY(i, j, 0), put, b, -1, -1);
    // Bridge decks have air underneath. The bank still needs its full vertical face.
    const hl = b === 'tc' && MAT[k+N] === M.HEAVENBRIDGE ? -1 : lowerN(i, j + 1);
    const hr = b === 'tc' && MAT[k+1] === M.HEAVENBRIDGE ? -1 : lowerN(i + 1, j);
    const dropL = m === M.SILKB ? 0 : Math.max(0, h - hl) * LV, dropR = m === M.SILKB ? 0 : Math.max(0, h - hr) * LV;
    drawTop(i, j, k, m, h, sx, sy, put, b, dropL, dropR);
    // faces
    for (let side = 0; side < 2; side++) {
      const drop = side ? dropR : dropL; if (!drop) continue;
      for (let c = 0; c < 32; c++) {
        const lx = side ? 32 + c : c, rtop = side ? Math.floor((95 - lx) / 2) + 1 : Math.floor((lx + 32) / 2) + 1, gx = sx - 32 + lx;
        for (let ry = 0; ry < drop; ry++) {
          SH.em = null;
          const col = faceCol(b, side, lx, ry, drop, h * LV - ry, gx, k);
          if (col === null) continue;
          put(gx, sy + rtop + ry, col, SH.em, 0);
        }
      }
    }
    if (false && m === M.SILKB) { for (let s = 0; s < 6; s++) { const gx = sx - 28 + s * 11, len = 18 + Math.floor(hash2(i * 7 + s, j, 41) * 26); for (let y = 0; y < len; y++) if ((y + s) % 3) put(gx, sy + 28 + y - (s > 2 ? (s - 3) * 5 : 0), P.silk[1], null, 0); } }
    // stairs and decals on this tile
    const st = TWM.stairAt.get(k); if (st) stairs(i, j, h, st, sx, sy, put, b);
    for (const dc of TWM.decals) if (dc.j === j && i >= dc.i && i < dc.i + dc.w) caveDecal(dc, i, j, h, sx, sy, put, hl);
  }
  function drawTop(i, j, k, m, h, sx, sy, put, b, dropL, dropR) {
    const H = TWM.H, MAT = TWM.MAT, water = TWM.isWater(m);
    const shadows = b === 'tc' && shadowTiles.get(k);
    // near water (this tile or a same-level neighbour is water): shoreline comes from the analytic shapes, not the tile edge
    let nearW = water, landM = water ? 0 : m;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!TWM.inMap(i + di, j + dj)) continue; const q = TWM.id(i + di, j + dj); if (H[q] !== h) continue; if (TWM.isWater(MAT[q])) nearW = true; else if (!landM && MAT[q] !== M.BRIDGE && MAT[q] !== M.SILKB && MAT[q] !== M.VOID) landM = MAT[q]; }
    if (!landM) landM = b === 'btd' ? M.CAVEF : b === 'hqs' && m === M.SEA ? M.SAND : M.MOSSY;
    // Heaven's narrow cloud channel is tile-authored rather than an analytic lake.
    if (b === 'tc' || b === 'tth' || b === 'sdl' || b === 'hps' || b === 'nhs' || (TWM.tthNear && TWM.tthNear[k])) nearW = false;   // (Sư Đà Lĩnh's river is tile-authored too: cascades, no analytic shore)
    if (m === M.BRIDGE || m === M.SILKB || m === M.CHASM) nearW = false;
    for (let r = 0; r < 32; r++) {
      const hw = r < 16 ? 2 * r + 2 : 2 * (31 - r) + 2, y = sy + r;
      for (let lx = 32 - hw; lx < 32 + hw; lx++) {
        const X = sx - 32 + lx, dx = lx + 0.5 - 32, dy = r + 0.5, fi = (dy / 16 + dx / 32) / 2, fj = (dy / 16 - dx / 32) / 2;
        let I = i + fi, J = j + fj, mm = m;
        // organic borders between land materials of the same level
        if (b !== 'tc' && !water && m !== M.BRIDGE && m !== M.SILKB && m !== M.CHASM) {
          const wi = I + (vnoise(I * 1.3, J * 1.3, 50) - 0.5) * 0.9, wj = J + (vnoise(I * 1.3, J * 1.3, 51) - 0.5) * 0.9, ti = Math.floor(wi), tj = Math.floor(wj);
          if ((ti !== i || tj !== j) && TWM.inMap(ti, tj)) { const q = TWM.id(ti, tj), m2 = MAT[q]; if (H[q] === h && m2 !== M.VOID && !TWM.isWater(m2) && m2 !== M.BRIDGE && m2 !== M.SILKB && m2 !== M.CHASM && m2 !== M.ROCK) mm = m2; }
        }
        let c, em, wt;
        if (nearW) {
          const [wd, wm] = waterAt(I, J);
          if (wd < 0) { c = top(wm, I, J, X, y, k, (X + y) & 1); wt = SH.water; em = null; if (wd > -0.09) c = mix(c, [240, 252, 252], 0.75); else if (wd > -0.22) c = mix(c, [225, 245, 245], 0.3); }
          else { c = top(water ? landM : mm, I, J, X, y, k, (X + y) & 1); em = SH.em; wt = 0; if (wd < 0.1) c = shade(c, 0.72); else if (wd < 0.2) c = shade(c, 0.88); }
        } else { c = top(mm, I, J, X, y, k, (X + y) & 1); em = SH.em; wt = SH.water; }
        if (shadows) {
          let weight = 0;
          for (const s of shadows) {
            const q = ((I-s.x)/s.a)**2 + ((J-s.y)/s.b)**2;
            weight = Math.max(weight, q < 0.65 ? 0.23 : q < 1 ? 0.12 : 0);
          }
          if (weight) c = mix(c, [61,64,79], weight);
        }
        // cliff lip: ink on the drop edge, a lit row above it
        const below1 = r + 1 > 31 || Math.abs(lx + 0.5 - 32) > (r + 1 < 16 ? 2 * (r + 1) + 2 : 2 * (30 - r) + 2);
        const below2 = r + 2 > 31 || Math.abs(lx + 0.5 - 32) > (r + 2 < 16 ? 2 * (r + 2) + 2 : 2 * (29 - r) + 2);
        const drop = lx < 32 ? dropL : dropR;
        if (drop > 0 && below1) c = (b === 'btp' && TWA.ext) ? TWA.ext.edge(c) : ((b === 'sdl' || (TWM.lionNear && TWM.lionNear[k])) && TWA.lion) ? TWA.lion.edge(c, k) : ((b === 'nhs' || (TWM.nhsNear && TWM.nhsNear[k])) && TWA.nhs) ? TWA.nhs.edge(c, k) : ((b === 'hps' || (TWM.hpsNear && TWM.hpsNear[k])) && TWA.hps) ? TWA.hps.edge(c, k) : ((b === 'tth' || (TWM.tthNear && TWM.tthNear[k])) && TWA.river) ? TWA.river.edge(c, k) : ((b === 'hds' || (TWM.fireNear && TWM.fireNear[k])) && TWA.fire) ? TWA.fire.edge(c, k) : INK; else if (drop > 0 && below2) c = mix(c, [255, 255, 235], 0.28);
        put(X, y, c, em, below1 && drop > 0 ? 0 : wt);
      }
    }
  }
  function stairs(i, j, h, st, sx, sy, put, b) {
    // steps rise from this (lower) tile to the upper neighbour behind it; drawn back to front
    const n = st.dh * 3, R = st.dh * LV, pal = b === 'tc' ? P.jade : b === 'btd' ? P.ledgeB : b === 'btp' && TWA.ext ? TWA.ext.stairPal : b === 'hds' && TWA.fire ? TWA.fire.stairPal : b === 'sdl' && TWA.lion ? TWA.lion.stairPal : b === 'tth' && TWA.river ? TWA.river.stairPal : b === 'hps' && TWA.hps ? TWA.hps.stairPal : b === 'nhs' && TWA.nhs ? TWA.nhs.stairPal : P.pave;
    for (let s = n - 1; s >= 0; s--) {
      const f0 = s / n, f1 = (s + 1) / n, z = Math.round(R * (s + 1) / n), rz = Math.round(R / n);
      for (let r = -R - 2; r < 34; r++) for (let lx = 0; lx < 64; lx++) {
        const dx = lx + 0.5 - 32, dy0 = r + 0.5;
        // tread: tile-local (fi, fj) at height z
        const dyT = dy0 + z, fiT = (dyT / 16 + dx / 32) / 2, fjT = (dyT / 16 - dx / 32) / 2;
        const along = st.dir === 'j' ? 1 - fjT : 1 - fiT, across = st.dir === 'j' ? fiT : fjT;
        const margin = b === 'tc' ? 0 : 0.12;
        const inT = fiT >= 0 && fjT >= 0 && fiT < 1 && fjT < 1 && along >= f0 && along < f1 && across >= margin && across <= 1-margin;
        // riser: front face of the step, between heights z - rz and z
        let inR = false, rr = 0;
        for (let zz = z - rz; zz < z && !inR; zz++) { const dyR = dy0 + zz, fiR = (dyR / 16 + dx / 32) / 2, fjR = (dyR / 16 - dx / 32) / 2, al = st.dir === 'j' ? 1 - fjR : 1 - fiR, ac = st.dir === 'j' ? fiR : fjR; if (Math.abs(al - f0) < 0.035 && ac >= margin && ac <= 1-margin && fiR >= -0.05 && fjR >= -0.05 && fiR <= 1.05 && fjR <= 1.05) { inR = true; rr = z - zz; } }
        if (inT) put(sx - 32 + lx, sy + r, along - f0 < 0.06 ? mix(pal[pal.length - 1], [255, 255, 240], 0.3) : tone(pal, 2.4 + hash2(lx >> 2, s, 60)), null, 0);
        else if (inR) put(sx - 32 + lx, sy + r, rr === 1 ? INK : tone(pal, st.dir === 'j' ? 1.3 : 0.6), null, 0);
      }
      // side walls of the flight
    }
  }
  function caveDecal(dc, i, j, h, sx, sy, put, hl) {
    // an arch cut into the front-left face of this tile row (the face exists because the tile in front is lower)
    const drop = (h - hl) * LV; if (drop < 24) return;
    const W = dc.w * 32, btd = dc.kind === 'cave_btd';
    const archH = Math.min(drop - 6, btd ? 56 : 54), archW = btd ? 30 : 52;
    for (let c = 0; c < 32; c++) {
      const lx = c, rtop = Math.floor((lx + 32) / 2) + 1, gx = sx - 32 + lx;
      const ax = gx - (SX(dc.i, dc.j) - 32 + dc.w * 16);
      for (let ry = 0; ry < drop; ry++) {
        const yb = drop - ry;                                   // px above the face foot
        const nx = ax / archW, ny = yb / archH, inside = Math.abs(nx) < 1 && (yb < archH * 0.55 || nx * nx + ((yb - archH * 0.55) / (archH * 0.45)) ** 2 < 1);
        const frame = !inside && Math.abs(ax) < archW + 4 && yb < archH + 4 && (yb < archH * 0.55 + 4 || (ax / (archW + 4)) ** 2 + ((yb - archH * 0.55) / (archH * 0.45 + 4)) ** 2 < 1);
        if (inside) { const deep = 1 - ny * 0.4; put(gx, sy + rtop + ry, btd ? mix([16, 10, 26], [60, 30, 90], (1 - deep) * 0.6 + (hash2(gx, ry, 61) < 0.02 ? 0.5 : 0)) : mix([12, 16, 20], [40, 60, 64], 1 - deep), btd && hash2(gx, ry, 62) < 0.01 ? P.glow[2] : null, 0); }
        else if (frame) put(gx, sy + rtop + ry, btd ? P.faceB[4] : P.faceH[5], null, 0);
        else if (!btd && yb > archH + 6 && yb < archH + 13 && Math.abs(ax) < 13) {      // plaque: Thủy Liêm Động
          const gold = Math.abs(ax) > 11 || yb === archH + 7 || yb === archH + 12; const glyph = !gold && (((ax + 13) % 8 === 2 && yb > archH + 8) || (yb === archH + 9 && (ax + 13) % 8 < 6));
          put(gx, sy + rtop + ry, gold ? [242, 192, 60] : glyph ? [255, 236, 160] : [110, 36, 42], null, 0);
        }
      }
    }
  }

  // ---------------------------------------------------------------- sprite buffer + painters
  class Spr {
    constructor(w, h) { this.w = w; this.h = h; this.c = new Array(w * h).fill(null); this.e = null; }
    set(x, y, col, em) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.c[y * this.w + x] = col; if (em) { if (!this.e) this.e = new Array(this.w * this.h).fill(null); this.e[y * this.w + x] = em; } else if (this.e) this.e[y * this.w + x] = null; }
    get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.c[y * this.w + x]; }
    ink(col) { const o = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (!this.get(x, y) && (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1))) o.push([x, y]); for (const [x, y] of o) this.set(x, y, col || INK); return this; }
    canvas(em) { const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h; const g = cv.getContext('2d'), id = g.createImageData(this.w, this.h); const src = em ? this.e : this.c; if (!src) return null;
      for (let p = 0; p < src.length; p++) { const v = src[p]; if (!v) continue; id.data[p * 4] = v[0]; id.data[p * 4 + 1] = v[1]; id.data[p * 4 + 2] = v[2]; id.data[p * 4 + 3] = v[3] === undefined ? 255 : v[3]; }
      g.putImageData(id, 0, 0); return cv; }
  }
  const rnd = s => TWM.mulberry32(s);
  // a lit blob (clump): light from the top left, dithered band between tones, darker rim at the bottom
  function blob(S, cx, cy, rx, ry, R, o) {
    o = o || {}; const bias = o.bias || 0;
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, q = nx * nx + ny * ny; if (q > 1) continue;
      if (o.jag && q > 0.72 && hash2(x, y, o.jag) < 0.45) continue;
      let l = -0.55 * nx - 0.8 * ny + 0.35 * (1 - q) + bias;
      if (q > 0.8 && ny > 0.1) l -= 0.5;
      let t = (l + 1) * (R.length - 1) / 2 + ((x + y) & 1 ? 0.18 : -0.18);
      if (o.tex && hash2(x, y, o.tex) < 0.12) t += 0.8;
      S.set(x, y, tone(R, t), o.em ? o.em : null);
    }
  }
  function line(S, x0, y0, x1, y1, col, w) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let s = 0; s <= n; s++) { const x = x0 + (x1 - x0) * s / n, y = y0 + (y1 - y0) * s / n; for (let a = 0; a < (w || 1); a++) S.set(x + a, y, col); } }
  const LEAF = ramp(['#1f4a34', '#2a6040', '#377a4a', '#4c9454', '#68b060', '#90cc78']);
  const BARK = ramp(['#3e2620', '#53342a', '#6c4632', '#865c40', '#9e7452']);
  const BLOSSOM = ramp(['#d86a8e', '#f08aa8', '#ffb6c8', '#ffe2ea']);
  const PEACH = ramp(['#d8504e', '#f47a62', '#ffa078', '#ffd0a0']);
  const PINKLEAF = ramp(['#8a3a5e', '#b45278', '#d8729a', '#f096b6', '#ffbcd2', '#ffe2ec']);

  function peachTree(seed) {
    const r = rnd(seed), W = 112, Hh = 136, S = new Spr(W, Hh), bx = 56, by = Hh - 6, sc = 0.85 + r() * 0.25;
    // roots + gnarled trunk + two limbs
    const tw = (y) => 5 + Math.max(0, (y - (by - 40)) / 40) * 4;
    for (let y = by - 58; y <= by; y++) { const off = Math.sin(y * 0.13 + seed) * 2.5, w = tw(y); for (let x = -w; x <= w; x++) S.set(bx + off + x, y, tone(BARK, 2.6 - (x + w) / (2 * w) * 2.4 + (hash2(x, y >> 2, seed) < 0.2 ? -0.8 : 0))); }
    for (let k = 0; k < 2; k++) { const dir = k ? 1 : -1, ex = bx + dir * (18 + r() * 8) * sc, ey = by - 70 - r() * 10; for (let s = 0; s < 24; s++) { const t = s / 23, x = bx + (ex - bx) * t + Math.sin(t * 3) * 2, y = by - 50 + (ey - (by - 50)) * t; for (let a = -2; a <= 2; a++) S.set(x + a, y, tone(BARK, 2.4 - (a + 2) * 0.5)); } }
    for (let k = 0; k < 6; k++) { const dir = k % 2 ? 1 : -1, len = 6 + r() * 8; for (let s = 0; s < len; s++) S.set(bx + dir * (6 + s), by - 1 + Math.floor(s / 4) * 0 + (s > len - 3 ? 1 : 0), tone(BARK, 1.5 + (s % 3 === 0 ? 1 : 0))); }
    // canopy clumps (top first, lower clumps overwrite -> clump shapes read)
    const cl = [[0, -88, 26], [-22, -80, 19], [22, -82, 19], [-12, -100, 17], [14, -102, 16], [0, -112, 13], [-34, -68, 14], [34, -70, 14], [-6, -70, 18], [12, -68, 16]];
    const clumps = cl.map(([dx, dy, rr]) => [bx + dx * sc + (r() - 0.5) * 6, by + dy * sc + (r() - 0.5) * 6, rr * sc * (0.85 + r() * 0.3)]).sort((a, b) => a[1] - b[1]);
    const pink = r() < 0.35;
    for (const [cx, cy, rr] of clumps) blob(S, cx, cy, rr, rr * 0.86, pink ? PINKLEAF : LEAF, { jag: seed + 3, tex: seed + 4 });
    // blossoms on the lit side, peaches hanging under clumps
    for (const [cx, cy, rr] of clumps) {
      for (let k = 0; k < (pink ? 10 : 16); k++) { const a = -2.6 + r() * 2.6, d = rr * (0.2 + r() * 0.72), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.86; if (!S.get(Math.round(x), Math.round(y))) continue;
        S.set(x, y, BLOSSOM[2]); S.set(x + 1, y, BLOSSOM[1]); S.set(x, y + 1, BLOSSOM[1]); S.set(x - 1, y - 1, BLOSSOM[3]); }
      if (r() < 0.75) { const x = Math.round(cx + (r() - 0.5) * rr), y = Math.round(cy + rr * 0.6);
        for (const [a, b2, t] of [[0, 0, 1], [1, 0, 1], [-1, 1, 1], [0, 1, 2], [1, 1, 1], [2, 1, 0], [0, 2, 1], [1, 2, 0], [-1, 0, 2.6]]) S.set(x + a, y + b2, PEACH[Math.floor(t)]); S.set(x, y - 1, LEAF[4]); }
    }
    S.ink();
    return frames2(S, by - 60);
  }
  function frames2(S, splitY) {   // sway: frame 1 shifts everything above splitY by 1 px
    const B = new Spr(S.w, S.h); for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) { const v = y < splitY ? S.get(x - 1, y) : S.get(x, y); if (v) B.set(x, y, v); }
    return [S, B];
  }
  function pine(seed) {
    const r = rnd(seed), S = new Spr(40, 70), bx = 20, by = 66;
    for (let y = by - 14; y <= by; y++) for (let x = -2; x <= 2; x++) S.set(bx + x, y, tone(BARK, 2 - x * 0.5));
    for (let t = 0; t < 4; t++) { const cy = by - 18 - t * 12, rr = 16 - t * 3; blob(S, bx + (r() - 0.5) * 3, cy, rr, 7, ramp(['#1c3f30', '#24523a', '#2e6644', '#3c7c4e', '#549660']), { jag: seed + t }); }
    S.ink(); return frames2(S, by - 30);
  }
  function bamboo(seed) {
    const r = rnd(seed), W = 48, Hh = 124, S = new Spr(W, Hh), by = Hh - 3, n = 5 + Math.floor(r() * 4);
    const STALK = ramp(['#2f6a44', '#3f8250', '#58a05e', '#7cbe72', '#a4d88c']);
    const stalks = []; for (let k = 0; k < n; k++) stalks.push([10 + r() * 28, 60 + r() * 56, (r() - 0.5) * 0.12]);
    stalks.sort((a, b) => b[1] - a[1]);
    for (const [x0, hgt, lean] of stalks) {
      for (let y = 0; y < hgt; y++) { const x = x0 + lean * y, yy = by - y, node = y % 12 === 0;
        for (let a = 0; a < 3; a++) S.set(x + a, yy, node ? (a === 1 ? STALK[0] : STALK[1]) : STALK[a === 0 ? 3 : a === 1 ? 2 : 1]); if (y % 12 === 1) S.set(x + 1, yy, STALK[4]); }
      for (let k = 0; k < 4; k++) { const y = hgt - 6 - k * 10 - r() * 5, x = x0 + lean * y, dir = k % 2 ? 1 : -1;
        for (let l = 0; l < 3; l++) { const len = 7 + r() * 6, ang = -0.4 + l * 0.35 + r() * 0.2; for (let s = 0; s < len; s++) { const lx = x + 1 + dir * Math.cos(ang) * s, ly = by - y - Math.sin(ang) * s * 0.6 + s * 0.35; S.set(lx, ly, LEAF[s < 2 ? 2 : s > len - 3 ? 4 : 3]); S.set(lx, ly + 1, LEAF[1]); } } }
    }
    S.ink(); return frames2(S, by - 50);
  }
  function bush(seed, flowers) {
    const r = rnd(seed), S = new Spr(36, 26), by = 23;
    const cl = [[18, by - 8, 9], [10, by - 6, 7], [26, by - 6, 7], [14, by - 12, 6], [22, by - 12, 6]];
    for (const [x, y, rr] of cl) blob(S, x + (r() - 0.5) * 2, y, rr, rr * 0.8, LEAF, { jag: seed, tex: seed + 1 });
    if (flowers !== false) for (let k = 0; k < 6; k++) { const x = 6 + r() * 24, y = by - 4 - r() * 14; if (S.get(Math.round(x), Math.round(y))) { const c = P.flowers[Math.floor(r() * 4)]; S.set(x, y, c); S.set(x + 1, y, c); S.set(x, y - 1, c); } }
    S.ink(); return [S];
  }
  function flowersSpr(seed) {
    const r = rnd(seed), S = new Spr(18, 14);
    for (let k = 0; k < 5; k++) { const x = 3 + r() * 12, y = 5 + r() * 6, c = P.flowers[Math.floor(r() * 5)]; for (let s = 0; s < 13 - y; s++) S.set(x, y + 1 + s, LEAF[2 + (s & 1)]); S.set(x, y, c); S.set(x - 1, y, c); S.set(x + 1, y, c); S.set(x, y - 1, c); S.set(x, y + 1 > 13 ? 13 : y, P.flowers[3]); }
    return [S];
  }
  function tuft(seed, pal) {
    const r = rnd(seed), S = new Spr(16, 12), R = pal || LEAF;
    for (let k = 0; k < 7; k++) { const x = 2 + r() * 12, hgt = 4 + r() * 7, lean = (r() - 0.5) * 0.6; for (let s = 0; s < hgt; s++) S.set(x + lean * s, 11 - s, R[s > hgt - 2 ? 5 : s > hgt / 2 ? 4 : 3]); }
    return [S];
  }
  function fern(seed) {
    const r = rnd(seed), S = new Spr(24, 16);
    for (let k = 0; k < 6; k++) { const ang = Math.PI * (0.15 + k * 0.14), len = 8 + r() * 4; for (let s = 0; s < len; s++) { const x = 12 + Math.cos(ang) * s * (k < 3 ? -1 : 1) * 1.1, y = 14 - Math.sin(ang) * s + s * s * 0.03; S.set(x, y, LEAF[3]); if (s % 2) S.set(x, y - 1, LEAF[4]); } }
    S.ink(); return [S];
  }
  function rock(seed, size, dark, pal) {
    const r = rnd(seed), W = [24, 36, 52, 70][size], Hh = [16, 26, 36, 48][size], S = new Spr(W, Hh), cx = W / 2, by = Hh - 3;
    const R = pal || (dark ? ramp(['#1e1828', '#2a2236', '#362c46', '#443858', '#55486c']) : ramp(['#46524d', '#56645d', '#68786e', '#7e8e82', '#98a898']));
    const n = 2 + size; for (let k = 0; k < n; k++) blob(S, cx + (r() - 0.5) * W * 0.4, by - Hh * 0.32 - r() * Hh * 0.18, W * (0.26 + r() * 0.16), Hh * (0.3 + r() * 0.12), R, { jag: seed + k });
    if (!dark) for (let x = 0; x < W; x++) for (let y = 0; y < Hh; y++) if (S.get(x, y) && !S.get(x, y - 1 - Math.floor(hash2(x, 0, seed) * 2)) && hash2(x >> 1, 3, seed) < 0.7) for (let k = 0; k < 2; k++) if (S.get(x, y + k)) S.set(x, y + k, P.moss[3 - k]);
    if (dark) for (let k = 0; k < 3 + size; k++) { const x = r() * W, y = r() * Hh; if (S.get(Math.round(x), Math.round(y))) S.set(x, y, P.glow[1], P.glow[2]); }
    S.ink(); return [S];
  }
  function crag(seed) {
    const r = rnd(seed), S = new Spr(30, 52), by = 49;
    for (let y = 0; y < 44; y++) { const w = 3 + (y / 44) * 10 + Math.sin(y * 0.4 + seed) * 1.5; for (let x = -w; x <= w; x++) S.set(15 + x + Math.sin(y * 0.2) * 2, by - 44 + y, tone(P.rock, 3.4 - (x + w) / (2 * w) * 3 + (y % 7 === 0 ? -0.8 : 0))); }
    for (let x = 0; x < 30; x++) for (let y = 0; y < 52; y++) if (S.get(x, y) && !S.get(x, y - 1) && hash2(x, 1, seed) < 0.5) S.set(x, y, P.moss[3]);
    S.ink(); return [S];
  }
  function lily(seed) { const r = rnd(seed), S = new Spr(16, 8); blob(S, 8, 4, 6, 3, ramp(['#2e6a44', '#3e8650', '#56a05e', '#74b86a'])); for (let x = 8; x < 14; x++) S.set(x, 4, null); if (r() < 0.4) { S.set(6, 2, BLOSSOM[2]); S.set(7, 2, BLOSSOM[3]); S.set(6, 1, BLOSSOM[2]); } return [S]; }
  function shell(seed) { const S = new Spr(6, 4); S.set(2, 2, [255, 230, 230]); S.set(3, 2, [240, 200, 200]); S.set(2, 1, [255, 240, 240]); return [S]; }

  // --- Hoa Quả Sơn landmarks
  const STONE = ramp(['#4a5650', '#5c6a62', '#6e7e74', '#869688', '#a2b0a2', '#c0ccbc']);
  const GOLD = ramp(['#8a5420', '#c0802a', '#f2c03c', '#fff0a0']);
  const RED = ramp(['#6a1c30', '#a02a38', '#e04a3a', '#ff8a6a']);
  const TIGER = ramp(['#6e3020', '#f39a34', '#ffc060']);
  function rect(S, x, y, w, h, R, t, o) { for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) S.set(x + a, y + b, tone(R, t + (o && a === 0 ? 1 : 0) - (o && a === w - 1 ? 1 : 0) + (o && b === 0 ? 0.6 : 0))); }
  function throne() {
    const S = new Spr(76, 92), cx = 38, by = 89;
    // back slab with rounded top, carved border, golden sun-cloud medallion
    for (let y = 8; y < 64; y++) for (let x = 10; x < 66; x++) {
      const dx = x - cx, top = y < 30 && (dx * dx) / (28 * 28) + ((y - 30) * (y - 30)) / (22 * 22) > 1; if (top) continue;
      const border = x < 14 || x > 61 || (y < 34 && (dx * dx) / (24 * 24) + ((y - 30) ** 2) / (18 * 18) > 1);
      S.set(x, y, tone(STONE, border ? 4 - (x > 60 ? 2 : 0) : 2.4 + (hash2(x >> 1, y >> 1, 70) < 0.2 ? 0.7 : 0) - (x > 56 ? 0.8 : 0)));
    }
    for (let a = 0; a < 24; a++) { const ang = a / 24 * Math.PI * 2; for (let d = 0; d < 10; d++) { const x = cx + Math.cos(ang) * d, y = 28 + Math.sin(ang) * d; S.set(x, y, tone(GOLD, d > 7 ? 1 : 2.5 + (d < 3 ? 1 : 0))); } }
    for (let k = 0; k < 3; k++) for (let x = -9; x <= 9; x++) S.set(cx + x, 44 + k * 4 + Math.round(Math.sin(x * 0.7 + k) * 1.2), tone(GOLD, 1.6));
    // armrests, seat with tiger pelt and red cushion
    rect(S, 4, 52, 12, 26, STONE, 2.2, 1); rect(S, 60, 52, 12, 26, STONE, 1.6, 1); rect(S, 3, 50, 14, 4, STONE, 4, 0); rect(S, 59, 50, 14, 4, STONE, 3.2, 0);
    rect(S, 16, 62, 44, 18, STONE, 1.8, 1);
    for (let y = 58; y < 70; y++) for (let x = 16; x < 60; x++) S.set(x, y, (x + y * 2) % 9 < 2 ? TIGER[0] : TIGER[y < 62 ? 2 : 1]);
    rect(S, 22, 56, 32, 4, RED, 2, 0); rect(S, 22, 55, 32, 1, RED, 3, 0);
    rect(S, 8, 80, 60, 9, STONE, 2, 1);
    S.ink(); return [S];
  }
  function banner(seed) {
    const out = []; for (let f = 0; f < 3; f++) {
      const S = new Spr(26, 74), by = 72;
      for (let y = 4; y <= by; y++) { S.set(4, y, BARK[3]); S.set(5, y, BARK[1]); }
      S.set(3, 3, GOLD[3]); S.set(4, 2, GOLD[2]); S.set(5, 3, GOLD[1]); S.set(4, 3, GOLD[2]);
      for (let y = 8; y < 52; y++) { const wave = Math.round(Math.sin(y * 0.18 + f * 2.1) * 1.6); for (let x = 6; x < 20 + (y > 46 ? -(y - 46) : 0); x++) S.set(x + wave * (x - 6) / 14, y, x < 8 || y < 10 ? GOLD[2] : y % 14 < 2 ? GOLD[1] : RED[x > 15 ? 1 : 2]); }
      for (let y = 20; y < 32; y++) for (let x = 10; x < 16; x++) if ((x - 13) ** 2 + (y - 26) ** 2 < 9) S.set(x + Math.round(Math.sin(y * 0.18 + f * 2.1) * 1.6 * 0.4), y, GOLD[3]);
      S.ink(); out.push(S);
    }
    return out;
  }
  function drum() { const S = new Spr(34, 40); for (let y = 6; y < 26; y++) for (let x = 5; x < 29; x++) { const bulge = Math.abs(y - 16) < 8 ? 0 : 1; if (x < 5 + bulge || x > 28 - bulge) continue; S.set(x, y, tone(RED, x < 10 ? 3 : x > 24 ? 1 : 2) ); if ((y === 9 || y === 23) && x % 3 === 0) S.set(x, y, GOLD[3]); }
    blob(S, 17, 6, 11, 4, ramp(['#c8a878', '#e0c494', '#f4dcb0', '#fff0d0'])); for (let y = 26; y < 38; y++) { S.set(8, y, BARK[2]); S.set(26, y, BARK[1]); S.set(9 + (y - 26), y, BARK[2]); S.set(25 - (y - 26), y, BARK[1]); } S.ink(); return [S]; }
  function lantern(violet) {
    const S = new Spr(18, 40), by = 38, R = violet ? ramp(['#2a2236', '#362c46', '#443858', '#55486c', '#6a5c84']) : STONE;
    rect(S, 6, 24, 6, 14, R, 2.2, 1); rect(S, 3, 22, 12, 3, R, 3, 0); rect(S, 4, 12, 10, 10, R, 2, 1); rect(S, 2, 9, 14, 3, R, 3.5, 0); rect(S, 5, 6, 8, 3, R, 3, 0); S.set(8, 4, R[4]); S.set(9, 4, R[3]); S.set(8, 5, R[3]); S.set(9, 5, R[2]);
    const L = violet ? [200, 140, 255] : [255, 200, 110]; for (let y = 14; y < 20; y++) for (let x = 7; x < 11; x++) S.set(x, y, L, L);
    S.ink(); return [S];
  }
  function dummy() { const S = new Spr(26, 44), by = 42; rect(S, 11, 8, 4, 34, BARK, 2, 1); rect(S, 3, 16, 20, 3, BARK, 2.5, 0); blob(S, 13, 26, 7, 8, ramp(['#a8843c', '#c8a050', '#e0bc68', '#f4d88a']), { tex: 5 }); for (let y = 20; y < 33; y += 4) for (let x = 7; x < 20; x++) S.set(x, y, BARK[1]); blob(S, 13, 7, 5, 5, ramp(['#a8843c', '#c8a050', '#e0bc68', '#f4d88a'])); rect(S, 6, 39, 14, 3, STONE, 2, 0); S.ink(); return [S]; }
  function rack() { const S = new Spr(40, 40); rect(S, 4, 8, 3, 30, BARK, 2, 0); rect(S, 33, 8, 3, 30, BARK, 1.5, 0); rect(S, 3, 10, 34, 3, BARK, 3, 0); rect(S, 3, 30, 34, 2, BARK, 2.5, 0);
    for (let k = 0; k < 5; k++) { const x = 9 + k * 5; for (let y = 2; y < 36; y++) S.set(x, y, k % 2 ? [74, 58, 82] : BARK[3]); S.set(x, 2, k % 2 ? GOLD[2] : [216, 220, 232]); S.set(x, 3, k % 2 ? GOLD[2] : [216, 220, 232]); S.set(x, 1, k % 2 ? null : [216, 220, 232]); S.set(x, 34, GOLD[1]); } S.ink(); return [S]; }
  function table() { const S = new Spr(40, 26); blob(S, 20, 9, 17, 7, STONE, {}); rect(S, 16, 14, 8, 10, STONE, 1.6, 1); for (let k = 0; k < 4; k++) { S.set(12 + k * 5, 7, PEACH[2]); S.set(13 + k * 5, 7, PEACH[1]); S.set(12 + k * 5, 6, LEAF[4]); } S.ink(); return [S]; }
  function stool() { const S = new Spr(18, 14); blob(S, 9, 5, 7, 3, STONE); rect(S, 4, 6, 10, 6, STONE, 1.8, 1); S.ink(); return [S]; }
  function fireRing() { const S = new Spr(34, 20); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; blob(S, 17 + Math.cos(a) * 12, 11 + Math.sin(a) * 5, 3.5, 2.6, STONE); } rect(S, 10, 9, 14, 3, BARK, 2, 0); rect(S, 13, 7, 8, 3, BARK, 3, 0); S.ink(); return [S]; }
  function basket() { const S = new Spr(20, 16); for (let y = 6; y < 14; y++) for (let x = 3 + (y - 6) * 0.2; x < 17 - (y - 6) * 0.2; x++) S.set(x, y, ((x + y) & 1) ? [176, 128, 74] : [148, 102, 58]); for (let k = 0; k < 5; k++) blob(S, 6 + k * 2.2, 5 - (k % 2), 2.2, 2, PEACH); S.ink(); return [S]; }
  function stele() { const S = new Spr(28, 52); rect(S, 7, 6, 14, 40, ramp(['#6a6a70', '#7e7e86', '#94949a', '#acacb2']), 1.8, 1); rect(S, 4, 44, 20, 6, ramp(['#6a6a70', '#7e7e86', '#94949a']), 1.4, 0);
    for (let x = 7; x < 21; x++) for (let y = 20; y < 26; y++) S.set(x, y, ((x + y) >> 1) % 2 ? [242, 196, 40] : [40, 34, 40]);
    for (let y = 10; y < 18; y++) if (y % 3) for (let x = 10; x < 18; x++) if ((x + y) % 4 === 0) S.set(x, y, [60, 60, 66]); S.ink(); return [S]; }

  // --- Bàn Tơ Động props
  const VROCK = ramp(['#16111e', '#1f1929', '#292236', '#342b44', '#403654', '#4e4466']);
  function spire(seed, size) {
    const r = rnd(seed), W = size === 3 ? 64 : 48, Hh = size === 3 ? 196 : 150, S = new Spr(W, Hh), cx = W / 2, by = Hh - 3;
    for (let y = 0; y < Hh - 6; y++) { const t = y / (Hh - 6), w = (W * 0.16 + t * W * 0.3) + Math.sin(y * 0.15 + seed) * 2.5 + (hash2(y >> 3, 0, seed) - 0.5) * 4, ox = Math.sin(y * 0.05 + seed) * 4;
      for (let x = -w; x <= w; x++) { let tt = 4.2 - (x + w) / (2 * w) * 3.4 + ((y + Math.floor(x / 5)) % 11 === 0 ? -1 : 0); S.set(cx + ox + x, by - (Hh - 6) + y, tone(VROCK, tt)); } }
    for (let k = 0; k < 14; k++) { const y = 10 + r() * (Hh - 30), x = cx + (r() - 0.5) * W * 0.4; if (!S.get(Math.round(x), Math.round(y))) continue; for (let a = 0; a < 4; a++) for (let b = 0; b < 2; b++) if (S.get(Math.round(x + a), Math.round(y + b))) S.set(x + a, y + b, P.glow[1 + (a === 1 ? 1 : 0)], P.glow[2]); }
    for (let k = 0; k < 4; k++) { const y0 = 20 + r() * (Hh - 60); for (let s = 0; s < W; s++) { const x = s, y = y0 + s * 0.45; if (S.get(x, Math.round(y))) S.set(x, y, [214, 210, 236]); } }
    S.ink(); return [S];
  }
  function loom(progress) {
    const S = new Spr(40, 52); rect(S, 4, 6, 3, 44, VROCK, 3, 0); rect(S, 33, 6, 3, 44, VROCK, 2, 0); rect(S, 2, 6, 36, 3, VROCK, 4, 0); rect(S, 4, 40, 32, 2, VROCK, 3, 0);
    for (let x = 8; x < 33; x += 2) for (let y = 9; y < 40; y++) S.set(x, y, y < 9 + (31 * (progress || 0.5)) ? (x % 4 ? [200, 180, 236] : [228, 220, 248]) : [176, 170, 212, 180]);
    S.ink(); return [S];
  }
  function circleDecal() { const S = new Spr(96, 48); for (let y = 0; y < 48; y++) for (let x = 0; x < 96; x++) { const nx = (x - 48) / 46, ny = (y - 24) / 23, q = nx * nx + ny * ny; if (q < 1 && q > 0.78) S.set(x, y, (Math.floor(Math.atan2(ny, nx) * 4) & 1) ? [90, 74, 120] : [70, 58, 96]); if (Math.abs(q - 0.55) < 0.03) S.set(x, y, [150, 120, 210], [140, 90, 220]); } return [S]; }
  function screenRock() { const S = new Spr(36, 56); blob(S, 18, 30, 13, 24, VROCK, { jag: 8 }); for (let y = 14; y < 36; y++) for (let x = 14; x < 26; x++) if ((x - 20) ** 2 / 36 + (y - 22) ** 2 / 140 < 1) S.set(x, y, y % 5 ? [236, 230, 246] : [200, 192, 226]); S.ink(); return [S]; }
  function eggs(seed) { const r = rnd(seed), S = new Spr(34, 24); for (let k = 0; k < 7; k++) { const x = 6 + r() * 22, y = 12 + r() * 6; blob(S, x, y, 3.4, 4, ramp(['#a8a0c8', '#cac4e4', '#ece8fa', '#ffffff']), { em: (k % 3 === 0) ? [120, 255, 140] : null }); } for (let k = 0; k < 10; k++) line(S, r() * 34, 22, r() * 34, 4 + r() * 8, [220, 216, 240]); S.ink(); return [S]; }
  function cocoon(seed) { const r = rnd(seed), S = new Spr(20, 40); for (let y = 6; y < 38; y++) S.set(13, y, VROCK[3]); for (let y = 2; y < 18; y++) S.set(13 - (y < 6 ? 0 : 0), y, [210, 206, 232]); blob(S, 10, 26, 6, 11, ramp(['#9e98be', '#c4bedc', '#e2deF2'.toLowerCase(), '#ffffff'])); for (let y = 16; y < 37; y += 3) for (let x = 4; x < 16; x++) if (S.get(x, y)) S.set(x, y + Math.round((x - 10) * 0.3), [170, 164, 200]); S.ink(); return [S]; }
  function crystal(seed) { const r = rnd(seed), S = new Spr(24, 30), G = r() < 0.5; const R = G ? ramp(['#1e7a4a', '#34b05e', '#6ee87e', '#c0ffc8']) : ramp(['#5a2e9a', '#7c4ad0', '#a87cf0', '#e2ccff']);
    for (let k = 0; k < 4; k++) { const x0 = 6 + k * 4 + r() * 2, hgt = 10 + r() * 14, lean = (r() - 0.5) * 0.4; for (let y = 0; y < hgt; y++) { const w = Math.max(1, 2.5 - y / hgt * 2.5); for (let x = -w; x <= w; x++) S.set(x0 + x + lean * y, 27 - y, R[x < 0 ? 3 : x > 0 ? 1 : 2], R[2]); } }
    S.ink(); return [S]; }
  function mushroom(seed) { const r = rnd(seed), S = new Spr(22, 18); for (let k = 0; k < 3; k++) { const x = 5 + k * 6 + r() * 2, hgt = 5 + r() * 6, cr = 2.5 + r() * 2; for (let y = 0; y < hgt; y++) S.set(x, 16 - y, [210, 200, 230]); blob(S, x, 16 - hgt, cr, cr * 0.6, ramp(['#2a8a8a', '#3cc0b0', '#7ef0d0', '#d0fff0']), { em: [90, 255, 210] }); } S.ink(); return [S]; }
  function moss(seed) { const r = rnd(seed), S = new Spr(28, 14); for (let k = 0; k < 6; k++) blob(S, 4 + r() * 20, 4 + r() * 6, 3 + r() * 3, 2 + r() * 1.5, P.glow, { em: k % 2 ? [120, 255, 140] : null }); return [S]; }
  function shard(seed) { const r = rnd(seed), S = new Spr(24, 46); for (let y = 0; y < 40; y++) { const w = 1 + y / 40 * 7; for (let x = -w; x <= w; x++) S.set(12 + x + (40 - y) * 0.1 * (r() < 0.5 ? 1 : -1), 43 - 40 + y, tone(VROCK, 4.5 - (x + w) / (2 * w) * 3.6)); } S.ink(); return [S]; }

  function medallion() { const S = new Spr(96, 48); for (let y = 0; y < 48; y++) for (let x = 0; x < 96; x++) { const nx = (x + 0.5 - 48) / 44, ny = (y + 0.5 - 24) / 22, q = Math.sqrt(nx * nx + ny * ny), a = Math.atan2(ny, nx);
      if (q > 1) continue; let c = null;
      if (q > 0.9) c = STONE[1]; else if (q > 0.82) c = GOLD[1]; else if (q > 0.74) c = STONE[3]; else if (q < 0.2) c = GOLD[q < 0.1 ? 3 : 2]; else if (Math.abs(((a / Math.PI * 4 + 8) % 1) - 0.5) < 0.12 && q < 0.7) c = GOLD[1]; else if (q < 0.42 && q > 0.36) c = RED[2];
      if (c) S.set(x, y, c); } return [S]; }
  // One carved span along the near edge of a diamond. Flip it for the other face.
  function jadeRail() {
    const s = new Spr(70,42);
    for (let x=0; x<=32; x++) {
      const y = 37 - (x >> 1), px = 35 + x;
      for (let h=0; h<=14; h++) {
        const pier = x%16 < 3, bar = h < 3 || (h >= 8 && h <= 11);
        if (pier || bar) s.set(px,y-h,h === 11 ? P.goldInlay[2] : h === 2 || h === 14 ? P.jade[4] : P.jade[pier ? 2 : 1]);
      }
      if (x%16 === 1) { blob(s,px,y-15,3,2,P.jade); s.set(px,y-18,P.goldInlay[2]); }
    }
    return [s];
  }
  const PAINT = {
    tcrail: jadeRail, tcfeast: table,
    medallion: () => medallion(),
    peach: p => peachTree(p.v), pine: p => pine(p.v), bamboo: p => bamboo(p.v), bush: p => bush(p.v), flowers: p => flowersSpr(p.v), tuft: p => tuft(p.v), fern: p => fern(p.v),
    rock: p => rock(p.v, p.size || 1, p.dark || p.biome === 'btd'), crag: p => crag(p.v), lily: p => lily(p.v), shell: p => shell(p.v),
    throne: () => throne(), banner: p => banner(p.v), drum: () => drum(), lantern: () => lantern(false), dummy: () => dummy(), rack: () => rack(), table: () => table(), stool: () => stool(),
    fire: () => fireRing(), basket: () => basket(), stele: () => stele(),
    spire: p => spire(p.v, p.size || 2), loom: () => loom(0.6), circle: () => circleDecal(), vlantern: () => lantern(true), screen: () => screenRock(), eggs: p => eggs(p.v),
    cocoon: p => cocoon(p.v), crystal: p => crystal(p.v), mushroom: p => mushroom(p.v), moss: p => moss(p.v), shard: p => shard(p.v),
  };
  // ---------------------------------------------------------------- PixelLab object sprites (tayduky/sprites/, packed by docs/tayduky/v2/tools/pack_sprites.py)
  const IMG = {};
  const seamArt = k => TWM.seamK[k] === TWM.bi.hps ? TWA.hps : TWM.seamK[k] === TWM.bi.nhs ? TWA.nhs : null;
  // life masks built from the sprite itself: GLOW = saturated bright violet/green/teal pixels (crystals, mushrooms, eggs) that pulse and come back at night;
  // SILK = bright desaturated pixels (webs, silk wraps) that shimmer. Which sprites get which is a name-prefix table.
  const GLOWS = ['crystals_', 'mush_', 'altar_', 'tent_', 'cave_', 'arch_', 'lantern_', 'tc_furnace_', 'tc_lantern_', 'tc_brazier_', 'tc_silklamp_', 'tc_kiln_'], SILKS = ['spire_', 'tent_', 'altar_', 'silkbridge_', 'crystals_', 'loom_', 'cave_', 'silkrack_', 'arch_'];
  function lifeMask(im, kind) {
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
    const id = g.getImageData(0, 0, cv.width, cv.height), d = id.data; let n = 0;
    for (let q = 0; q < d.length; q += 4) {
      if (d[q + 3] < 8) { d[q + 3] = 0; continue; }
      const r = d[q], gg = d[q + 1], b = d[q + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), v = mx / 255, s = mx ? (mx - mn) / mx : 0;
      let h = 0; if (mx !== mn) { const dd = mx - mn; h = mx === r ? ((gg - b) / dd + 6) % 6 : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4; h *= 60; }
      const warm = s > 0.45 && v > 0.82 && h > 18 && h < 62;      // lantern flames
      const on = kind === 'glow' ? (warm || (s > 0.4 && v > 0.62 && ((h > 80 && h < 195) || (h > 255 && h < 325)))) : (s < 0.3 && v > 0.74);
      if (on) n++; else d[q + 3] = 0;
    }
    if (n < 6) return null; g.putImageData(id, 0, 0); return cv;
  }
  function loadSprites() {
    return Promise.all(Object.entries(window.TW_SPRITES || {}).map(([n, m]) => new Promise(res => { const im = new Image(); im.onload = () => {
      IMG[n] = { im, w: m.w, h: m.h, py: m.py, name: n, glow: GLOWS.some(p => n.startsWith(p)) ? lifeMask(im, 'glow') : null, silk: SILKS.some(p => n.startsWith(p)) ? lifeMask(im, 'silk') : null }; res(); }; im.onerror = res; im.src = 'sprites/' + n + '.png'; })));
  }
  const SWAY = { bigpeach: 1.7, tcpeach: 1.7, bigbamboo: 1.3, hut: 0.5, stall: 0.5, silkrack: 1.2 };
  const IMGKINDS = { hut: ['hut_a', 'hut_b', 'hut_c'], shrine: ['shrine_a', 'shrine_b', 'shrine_c'], stall: ['stall_a', 'stall_b'], hbridge: ['bridge_a'], tent: ['tent_a', 'tent_b'],
    altar: ['altar_a', 'altar_b'], pcrystals: ['crystals_a', 'crystals_b', 'crystals_c'], silkbr: ['silkbridge_a'], hall: ['hall_a', 'hall_b'], statue: ['statue_a', 'statue_b'], playground: ['playground_a'],
    bigpeach: ['peachtree_a', 'peachtree_b', 'peachtree_c', 'peachtree_d'], caveent: ['cave_a', 'cave_b'], gate: ['gate_a', 'gate_b'], bigbamboo: ['bamboo_a', 'bamboo_b', 'bamboo_c'], scholar: ['scholar_a', 'scholar_b'],
    lantern2: ['lantern_a', 'lantern_b'], silkrack: ['silkrack_a'], rockarch: ['arch_a', 'arch_b'], lotus: ['lotus_a', 'lotus_b'], bspire: ['spire_a', 'spire_b'], bigmush: ['mush_a', 'mush_b'], bath: ['bath_a'], bloom: ['loom_a'], tcgate: ['tc_monument_a'], tcgatehouse: ['tc_gatehouse_a'], tcpavilion: ['tc_pavilion_a'], tcpillar: ['tc_pillar_a'], tcbrazier: ['tc_brazier_a'], tcsilklamp: ['tc_silklamp_a'], tccloud: ['tc_bank_a','tc_bank_a','tc_cloud_a','tc_scroll_a'], tcpalace: ['tc_palace_a','tc_palace_b'], tcfurnace: ['tc_kiln_a'], tcbridge: ['tc_bridge_a','tc_bridge_b'], tcpeach:['tc_peach_a','tc_peach_b'], tclantern:['tc_lantern_a','tc_lantern_b'] };
  // footprint anchor: sprite bottom-centre sits on the prop's ground point (tile centre, or the centre of a multi-tile footprint)
  const cache = new Map();
  function sprite(p) {
    if (TWA.ext && TWA.ext.sprite) { const r = TWA.ext.sprite(p); if (r) return r; }
    if (TWA.fire && TWA.fire.sprite) { const r = TWA.fire.sprite(p); if (r) return r; }
    if (TWA.nhs && TWA.nhs.sprite) { const r = TWA.nhs.sprite(p); if (r) return r; }
    const variants = { peach: 6, pine: 4, bamboo: 5, bush: 6, flowers: 6, tuft: 6, fern: 4, rock: 6, crag: 4, lily: 4, banner: 2, spire: 3, eggs: 3, cocoon: 4, crystal: 6, mushroom: 5, moss: 5, shard: 4 };
    if (IMGKINDS[p.kind]) { const m = IMGKINDS[p.kind].filter(n => IMG[n]); return m.length ? (function () { const r = IMG[m[(p.v || 0) % m.length]]; return { w: r.w, h: r.h, py: r.py, frames: [r.im], em: r.glow, glow: r.glow, silk: r.silk, sway: SWAY[p.kind] || 0, flat: false, img: true }; })() : null; }
    const vv = variants[p.kind] ? p.v % variants[p.kind] : 0, key = p.kind + ':' + vv + ':' + (p.size || 0) + ':' + (p.dark || p.biome === 'btd' ? 1 : 0);
    if (cache.has(key)) return cache.get(key);
    const paint = PAINT[p.kind]; if (!paint && !IMGKINDS[p.kind]) return null; if (!paint) return null;
    const frames = paint(Object.assign({}, p, { v: vv * 7919 + 13 })), f0 = frames[0];
    const out = { w: f0.w, h: f0.h, frames: frames.map(S => S.canvas()), em: f0.e ? f0.canvas(true) : null, flat: !!p.flat };
    if (p.kind === 'tcrail') out.py = 21;
    cache.set(key, out); return out;
  }
  return { loadSprites, IMG, IMGKINDS, GLOWS, SILKS, SWAY, OX, OY, LV, CH, WORLD_W, WORLD_H, SX, SY, bakeChunk, sprite, P, INK, Spr, blob, line, tone, ramp, mix, LEAF, GOLD, RED, STONE, VROCK };
})();
