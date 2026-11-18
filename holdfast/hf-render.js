'use strict';
// ===== Holdfast — renderer: baked ground chunks, depth-sorted sprites, Saigon-style light, weather, water, fx =====
const HR = { cv: null, g: null, lc: null, lg: null, aps: 1, zoom: 0, vw: 0, vh: 0, cx: 0, cy: 0, chunks: new Map(), statics: [], season: 'summer', wallSpr: new Map(), sheets: new Map(), lying: new Map(), anim: new Map(), parts: [], dirty: true, lastT: 0, fps: 60, ft: [], drawn: 0, tick: 0 };
const CHU = 256;                         // ground chunk size in iso units (512 art px)
const KF_AMB = [[0, 0x4a4c86], [4.6, 0x4a4c86], [5.5, 0x8676a6], [6.3, 0xf2b9a2], [7.4, 0xffe9cf], [9, 0xfff8ea], [15.6, 0xfff6e2], [17, 0xffe2b4], [18, 0xf6aa7c], [18.8, 0xa97c9c], [19.7, 0x5c5e9a], [21, 0x4a4c86], [24, 0x4a4c86]];
function hrAmbient(h) { let i = 0; while (i < KF_AMB.length - 2 && KF_AMB[i + 1][0] <= h) i++; const a = KF_AMB[i], b = KF_AMB[i + 1]; return mixc(a[1], b[1], clamp((h - a[0]) / (b[0] - a[0]), 0, 1)); }
const ISO = (x, y, z) => [x - y, (x + y) / 2 - (z || 0)];

// ---------------------------------------------------------------- ground painter (per pixel, world units)
const SG = { spring: [0x7fae5a, 0x709e4e, 0x9cc46e, 0x5e8a42], summer: [0x76a052, 0x6a9449, 0x88b05e, 0x5e8a42], fall: [0xa8a050, 0x98904a, 0xb8aa62, 0x7a7a3e], winter: [0xe8ecf0, 0xdce2e8, 0xf4f6f8, 0xb8c4ae] };
const SGO = { spring: [0x6e9a4e, 0x628c46, 0x84a85a, 0x567a3e], summer: [0x6e8a4a, 0x627c42, 0x7c9654, 0x566e3a], fall: [0x9a8a4a, 0x8a7a42, 0xaa9a5a, 0x6a6a3a], winter: [0xe2e6ea, 0xd4dae2, 0xf0f2f4, 0xa8b49e] };
function hrGround(wx, wy, ss) {
  const i = Math.floor(wx / HT), j = Math.floor(wy / HT);
  if (i < 0 || j < 0 || i >= HN || j >= HN) return 0x2a2630;
  const k = j * HN + i, g = HF.gk[k], z = HF.zone[k], n = hash2(wx * 2, wy * 2), vn = vnoise(wx / 7, wy / 7), win = ss === 'winter';
  const u = 480 + (wx - wy) / HG, v = 300 + ((wx + wy) / 2 - HCY) / HG;
  // analytic water edges (river, banks, creek) so curves are smooth, not tile-stepped
  const dd = Math.sqrt(((u - 480) / 445) ** 2 + ((v - 300) / 222) ** 2), lower = v >= 300;
  const cl = riverSide(v, -1), cr = riverSide(v, 1);
  const inRiver = lower ? dd >= 1 && dd <= 1.13 : Math.abs(u - cl) < 29 || Math.abs(u - cr) < 29;
  if (inRiver) { const edge = lower ? Math.min(dd - 1, 1.13 - dd) * 222 : Math.min(29 - Math.abs(u - cl), 29 - Math.abs(u - cr)); let c = edge < 3 ? 0x4e8a9a : vn > 0.6 ? 0x3e7894 : 0x467e98; if (n > 0.97) c = 0x6aa0b4; if (win && edge < 5 && vnoise(wx / 4, wy / 4) > 0.45) c = 0xd8e4ec; return c; }
  const bankD = lower ? (dd < 1 ? (1 - dd) * 222 : (dd - 1.13) * 222) : Math.min(Math.abs(Math.abs(u - cl) - 29), Math.abs(Math.abs(u - cr) - 29));
  if (bankD < 4.5 && z !== Z_SETTLE || bankD < 3) { let c = n > 0.9 ? 0xb8a478 : vn > 0.55 ? 0xc8b48a : 0xd2c096; if (bankD > 3 && hash2(wx, wy) > 0.5) c = mixc(c, SG[ss][0], 0.5); return win ? mixc(c, 0xf0f2f4, 0.6) : c; }
  if (v < 470 && Math.abs(u - streamU(v)) < 4.6 && z !== Z_RIVER && z !== Z_FAR && HF.gk[k] !== GK.ROAD) { const e = 4.6 - Math.abs(u - streamU(v)); if (e < 1) return 0x6a7a4a; let c = vn > 0.6 ? 0x4e8aa4 : 0x5a96ae; if (n > 0.93) c = 0x9ac8d8; if (win) c = mixc(c, 0xdce6ee, 0.5); return c; }
  const G = z === Z_SETTLE ? SG[ss] : SGO[ss];
  let c;
  switch (g) {
    case GK.ROAD: {
      if (Math.abs(u - roadU(v)) > 9) { c = G[0]; break; }
      c = vn > 0.62 ? 0x4e4a4c : 0x58524f; const n2 = hash2(wx * 3, wy * 3); if (n2 > 0.94) c = 0x6a625e; else if (n2 < 0.05) c = 0x403a3c;
      const cr2 = Math.abs(vnoise(wx / 9, wy / 9) - 0.5); if (cr2 < 0.018) c = 0x2e2828; else if (cr2 < 0.034 && hash2(wx, wy) > 0.5) c = 0x6a8a44;
      const pt = vnoise(wx / 3 + 9, wy / 3); if (pt > 0.86) c = pt > 0.89 ? 0x3a3434 : 0x4a4442;
      if (Math.abs(u - roadU(v)) < 0.5 && ((v * 1.2) % 10) < 5 && vnoise(wx / 5, 3) > 0.35) c = mixc(0xd8c07a, c, 0.35);
      if (Math.abs(u - roadU(v)) > 7.5 && vnoise(wx / 3, wy / 2) > 0.45) c = mixc(c, G[0], 0.7);
      if (win && vnoise(wx / 6, wy / 6) > 0.5) c = mixc(c, 0xe8ecf0, 0.75);
      return c;
    }
    case GK.TRAIL: c = vn > 0.5 ? 0xa08462 : 0x94785a; if (n > 0.9) c = 0x7a6448; if (hash2(wx, wy * 3) > 0.8) c = mixc(c, G[0], 0.6); break;
    case GK.FOREST: c = vn > 0.55 ? mixc(G[1], 0x3a4a2a, 0.35) : mixc(G[0], 0x3a4a2a, 0.3); if (n > 0.9) c = ss === 'fall' ? 0xb8762a : 0x5a4a32; if (n < 0.04) c = 0x7a6448; break;
    case GK.MEADOW: c = vn > 0.55 ? mixc(G[0], 0xc8b86a, 0.35) : mixc(G[2], 0xc0b060, 0.3); if (n > 0.985) c = [0xf2e6a0, 0xf2f0e8, 0xd9a0c8][(n * 1000 | 0) % 3]; break;
    case GK.ROCK: c = vn > 0.55 ? 0x9a948a : 0x8a847a; if (n > 0.9) c = 0xb4aea2; if (n < 0.06) c = 0x6a645c; if (hash2(wx / 2, wy) > 0.7) c = mixc(c, G[0], 0.4); break;
    case GK.CLEARED: { c = vn > 0.55 ? 0x8a7254 : 0x9a8262; if (n > 0.93) c = 0xa88e6c; if (n < 0.04) c = 0x6e5c46; if (hash2(wx * 4, wy * 4) > 0.996) c = 0xd8b45a; if (vnoise(wx / 6 + 20, wy / 6) > 0.74) c = mixc(c, 0x3a3030, 0.35); if (vnoise(wx / 10, wy / 10) > 0.64) c = mixc(c, G[0], 0.55); break; }
    case GK.LANE: c = vn > 0.5 ? 0xb09a76 : 0xa08866; if (n > 0.92) c = 0x8a7458; break;
    case GK.PLAZA: c = vn > 0.55 ? 0xb4a07c : 0xa8946e; if (n > 0.92) c = 0x9a8460; if (n < 0.05) c = 0xc8b48e; if (vnoise(wx / 12, wy / 12) > 0.66) c = mixc(c, G[0], 0.5); break;
    case GK.STREET: { const lx = wx % HT, ly = wy % HT; c = vn > 0.6 ? 0x9a8c74 : 0xa89a80; if (n > 0.94) c = 0x8a7c66; if ((lx > 2.5 && lx < 3.3) || (lx > 5 && lx < 5.8)) c = mixc(c, 0x6a5e4c, 0.25); if (hash2(wx, wy * 2) > 0.92) c = mixc(c, G[0], 0.6); break; }
    case GK.MAIN: { c = vn > 0.6 ? 0x5a5452 : 0x645e5a; if (n > 0.95) c = 0x76706a; if (Math.abs(vnoise(wx / 8, wy / 8) - 0.5) < 0.016) c = 0x3a3434; const pa = vnoise(wx / 10 + 3, wy / 10 + 8); if (pa > 0.7) c = mixc(c, 0x2e2a2c, 0.5); if (Math.abs(u - 480) > 9.3) c = 0xb8b0a0; break; }
    case GK.FIELD: { const cr3 = HF.crop[k] || 1, row = wy % 3.2; const cols = [[0x4f8a3a, 0x6aa244], [0x5a9a40, 0x8ab84e], [0xc8a84a, 0xd8bc5a], [0x4a7a3a, 0x6a9a44], [0x8a9a3a, 0xa8b04a]][cr3 - 1];
      if ((wx % 40) < 1 || (wy % 40) < 1) { c = 0x8a7454; break; }
      if (row < 1.3) { c = n > 0.5 ? 0x6a4a32 : 0x5e4230; } else { c = n > 0.55 ? cols[1] : cols[0]; if (ss === 'winter') c = n > 0.5 ? 0x7a6a5a : 0xe4e8ec; else if (ss === 'fall' && cr3 !== 3) c = mixc(c, 0xc8a050, 0.5); else if (ss === 'spring') c = mixc(c, 0x5a4232, 0.4); }
      return c; }
    case GK.GREEN: c = vn > 0.58 ? mixc(G[1], 0xa8d070, 0.15) : mixc(G[0], 0xa8d070, 0.12); if (n > 0.92) c = G[2]; break;
    case GK.FARBANK: c = vn > 0.55 ? G[1] : G[0]; if (n > 0.92) c = G[2]; break;
    default: c = vn > 0.58 ? G[1] : G[0]; if (n > 0.92) c = G[2]; if (n < 0.05) c = G[3];
      if (z === Z_SETTLE && ((wx + wy) % 12) < 6 && !win) c = mixc(c, 0x9cc068, 0.1);
      if (vnoise(wx / 19 + 4, wy / 19) > 0.74 && !win) c = mixc(c, 0x9a9a5c, 0.28);
  }
  if (win && g !== GK.FIELD) { const s = vnoise(wx / 5, wy / 5 + 9); if (s > 0.42 || n > 0.7) c = n > 0.8 ? 0xe6e8ee : 0xf2f4f6; }
  if (ss === 'fall' && (z === Z_WILD || z === Z_SETTLE) && n > 0.97) c = [0xd9822a, 0xc0622a, 0xe8b03a][(n * 997 | 0) % 3];
  return c;
}
function hrBakeChunk(ci, cj) {
  const key = ci + ',' + cj + ',' + HR.season; if (HR.chunks.has(key)) return HR.chunks.get(key);
  const W = CHU * K, cv = mk(W, W), g = cv.getContext('2d'), img = g.createImageData(W, W), d = img.data, GC = new Map(), ss = HR.season;
  const sx0 = -HW + ci * CHU, sy0 = cj * CHU;
  for (let py = 0; py < W; py++) for (let px = 0; px < W; px++) {
    const sx = sx0 + (px + 0.5) / K, sy = sy0 + (py + 0.5) / K, wx = sy + sx / 2, wy = sy - sx / 2;
    const c0 = hrGround(wx, wy, ss); let c = GC.get(c0); if (c === undefined) { c = grade(c0); GC.set(c0, c); }
    const o = (py * W + px) * 4; d[o] = c >> 16 & 255; d[o + 1] = c >> 8 & 255; d[o + 2] = c & 255; d[o + 3] = 255;
  }
  // grass tufts / weeds rising above the ground plane
  const tuft = (sx, sy, cols, n) => { const px = Math.round((sx - sx0) * K), py = Math.round((sy - sy0) * K); for (let q = 0; q < n; q++) { const bx = px + q - (n >> 1), hg = 2 + ((q * 7 + px) % 3); for (let j = 0; j < hg; j++) { const yy = py - j, xx = bx + (j > 1 && q % 2 ? 1 : 0); if (xx < 0 || yy < 0 || xx >= W || yy >= W) continue; const c = grade(j === hg - 1 ? cols[2] : j === 0 ? cols[0] : cols[1]), o = (yy * W + xx) * 4; d[o] = c >> 16 & 255; d[o + 1] = c >> 8 & 255; d[o + 2] = c & 255; } } };
  if (ss !== 'winter') {
    const Rr = mulberry32(ci * 977 + cj * 131 + 5);
    for (let n = 0; n < 900; n++) {
      const sx = sx0 + Rr() * CHU, sy = sy0 + Rr() * CHU, wx = sy + sx / 2, wy = sy - sx / 2, i = Math.floor(wx / HT), j = Math.floor(wy / HT); if (i < 0 || j < 0 || i >= HN || j >= HN) continue;
      const k = j * HN + i, gk = HF.gk[k];
      if (gk === GK.WGRASS || gk === GK.MEADOW || gk === GK.FARBANK || gk === GK.CLEARED && Rr() < 0.3) tuft(sx, sy, ss === 'fall' ? [0x7a6a32, 0x9a8a42, 0xc8b46a] : [0x4a6232, 0x627c42, Rr() > 0.85 ? 0xc8b46a : 0x86a05a], 3 + (n % 3));
      else if ((gk === GK.LAWN || gk === GK.GREEN) && Rr() < 0.5) tuft(sx, sy, [0x5e8a42, 0x76a052, Rr() > 0.9 ? 0xf2e6a0 : 0x92b866], 2);
      else if (gk === GK.FOREST && Rr() < 0.4) tuft(sx, sy, [0x3a5a2a, 0x4a6a34, 0x6a8a44], 4);
    }
  }
  g.putImageData(img, 0, 0);
  // cast shadows of buildings, towers and the wall: crisp plum-tinted mask (sun from the upper left)
  const sm = mk(W, W), sg = sm.getContext('2d'); sg.setTransform(K, 0, 0, K, -sx0 * K, -sy0 * K); sg.fillStyle = '#000';
  for (const poly of HR.shadows) { if (poly.bx1 < sx0 || poly.bx0 > sx0 + CHU || poly.by1 < sy0 || poly.by0 > sy0 + CHU) continue; sg.beginPath(); poly.forEach((p, i) => i ? sg.lineTo(p[0], p[1]) : sg.moveTo(p[0], p[1])); sg.closePath(); sg.fill(); }
  const sd = sg.getImageData(0, 0, W, W).data, gd = g.getImageData(0, 0, W, W), q = gd.data;
  for (let i = 0; i < W * W; i++) if (sd[i * 4 + 3] > 127) { const o = i * 4; q[o] = q[o] * 0.7 + 0x4a * 0.18; q[o + 1] = q[o + 1] * 0.66 + 0x26 * 0.2; q[o + 2] = q[o + 2] * 0.72 + 0x3c * 0.18; }
  g.putImageData(gd, 0, 0);
  const ch = { cv, sx0, sy0 }; HR.chunks.set(key, ch); return ch;
}
function hullPts(pts) { pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = []; for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of pts.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } const h = lo.slice(0, -1).concat(up.slice(0, -1)); h.bx0 = Math.min(...h.map(p => p[0])); h.bx1 = Math.max(...h.map(p => p[0])); h.by0 = Math.min(...h.map(p => p[1])); h.by1 = Math.max(...h.map(p => p[1])); return h; }
function castShadow(x, y, w, d, h) { const k = h * 0.85, c = [[x, y], [x + w, y], [x + w, y + d], [x, y + d], [x + w + k, y - k * 0.25], [x + w + k, y + d - k * 0.25], [x + k, y + d - k * 0.25]]; HR.shadows.push(hullPts(c.map(p => ISO(p[0], p[1])))); }

// ---------------------------------------------------------------- statics
const _bk = new Map();
function bakeCached(key, fn, slice) { let s = _bk.get(key); if (!s) { s = bake(fn(), slice ? { slice: 24, snow: HR.season === 'winter' } : { snow: HR.season === 'winter' && !key.startsWith('wall') }); _bk.set(key, s); } return s; }
function addStatic(spr, ox, oy, extraD, opt) {
  const list = Array.isArray(spr) ? spr : [spr], p = ISO(ox, oy);
  for (const s of list) { const e = { c: s.c, e: s.e, x: p[0] - s.ax, y: p[1] - s.ay, w: s.w, h: s.h, d: ox + oy + (s.key || 0) + (extraD || 0), em: opt && opt.em, ref: opt && opt.ref }; HR.statics.push(e); }
}
function hrBuildStatics(progress) {
  HR.statics = []; HR.shadows = []; HR.lights = []; HR.smokers = []; HR.waterPts = [];
  const ss = HR.season;
  // buildings
  for (const b of HF.buildings) {
    let boxes, key = 'b' + b.id + ss, H = 24;
    if (b.kind === 'house') { const L = HF.lots[b.lot]; const o = { w: L.w, d: L.d, floors: L.floors, wall: L.wall, roof: L.roof, seed: L.seed, porch: L.porch, garage: L.garage, solar: L.seed % 4 === 0 }; boxes = () => { const bx = suburbHouse(o); H = o.H; if (o.chim) HR.smokers.push([b.x + o.chim[0], b.y + o.chim[1], o.chim[2], L.seed]); return bx; }; }
    else boxes = () => { const bx = civicModel(b); if (b.chim) HR.smokers.push([b.x + b.chim[0], b.y + b.chim[1], b.chim[2], b.seed]); return bx; };
    const spr = bakeCached(key, boxes, true);
    addStatic(spr, b.x, b.y, 0, { em: 1 }); castShadow(b.x, b.y, b.w, b.d, b.kind === 'block' ? b.h : b.kind === 'church' ? 34 : b.kind === 'house' ? (HF.lots[b.lot].floors * 18 + 10) : 26);
  }
  // props
  for (const p of HF.props) {
    if (p.kind === 'lights') continue;
    const f = PROPS[p.kind]; if (!f) continue;
    const key = 'p' + p.kind + '|' + (p.c || '') + '|' + (p.w || '') + '|' + (p.v || '') + '|' + (p.r ? p.r.toFixed(1) : '') + (p.kind === 'laundry' ? (p.x | 0) : '') + '|' + ss;
    const spr = bakeCached(key, () => f(p), p.kind === 'messtent' || p.kind === 'gasstation' || p.kind === 'bus' || p.kind === 'greenhouse' || p.kind === 'watertower');
    addStatic(spr, p.x, p.y, 0, { em: p.kind === 'lamp' || p.kind === 'rv' });
    if (p.kind === 'lamp') HR.lights.push([...ISO(p.x, p.y, 24), 26, 'rgba(255,214,140,', 0.7, 1]);
    if (p.kind === 'drumfire') HR.lights.push([...ISO(p.x, p.y, 8), 40, 'rgba(255,150,70,', 0.85, 2, p]);
    if (p.kind === 'firepit') HR.lights.push([...ISO(p.x, p.y, 4), 64, 'rgba(255,150,70,', 1, 3, p]);
    if (['truck', 'car', 'bus', 'gasstation', 'watertower', 'greenhouse', 'barn', 'messtent', 'rv', 'shed', 'smokehouse', 'coop', 'stall', 'silo'].includes(p.kind)) castShadow(p.x, p.y, p.bw || 10, p.bd || 8, p.kind === 'watertower' ? 46 : p.kind === 'stall' ? 13 : 12);
  }
  for (const d of HF.docks) addStatic(bakeCached('dock' + d.len, () => PROPS.dock(d)), d.x, d.y, -6);
  // wall pieces
  hrBuildWalls();
  // towers
  const TB = towerBoxes(), tb = bakeCached('tower-b' + ss, () => TB.back), tf = bakeCached('tower-f' + ss, () => TB.front);
  for (const t of HF.towers) { addStatic(tb, t.x, t.y, -0.5); addStatic(tf, t.x, t.y, 36); castShadow(t.x, t.y, 18, 18, 66); HR.lights.push([...ISO(t.x + 16, t.y + 4, 66), 34, 'rgba(255,206,130,', 0.75, 1]); }
  // trees
  for (const t of HF.trees) {
    const s = hfTree(t.spc, ss, t.v); const p = ISO(t.x, t.y);
    HR.statics.push({ c: s.c, e: s.e, x: p[0] - s.ax * (t.big ? 1 : 1), y: p[1] - s.ay, w: s.w, h: s.h, d: t.x + t.y, tree: 1, rad: s.rad || 10, tx: t.x, ty: t.y });
    if (t.big) { const s2 = hfTree('me', ss, 2); HR.statics.push({ c: s2.c, e: s2.e, x: p[0] - s2.ax + 14, y: p[1] - s2.ay - 6, w: s2.w, h: s2.h, d: t.x + t.y + 0.1, tree: 1 }); }
  }
  HR.statics.sort((a, b) => a.d - b.d);
  // water sparkle points
  for (let k = 0; k < HN * HN; k += 3) if (HF.gk[k] === GK.WATER) HR.waterPts.push(tileC(k));
  HR.chunks.clear();
}
function hrWallShape(s) {
  const out = [], nb = (a, b) => { const i = s.i + a, j = s.j + b; return inMap(i, j) && HF.wallAt[tIdx(i, j)] >= 0; };
  if (nb(1, 0)) out.push('E'); if (nb(-1, 0)) out.push('W'); if (nb(0, 1)) out.push('S'); if (nb(0, -1)) out.push('N');
  if (!out.length) out.push(s.dir === 'x' ? 'E' : 'S');
  // river ends: extend toward the water
  if (out.length === 1) { const o = { E: 'W', W: 'E', S: 'N', N: 'S' }[out[0]]; out.push(o); }
  return out.join('');
}
function hrWallState(s) { return s.breached || s.hp <= 0 ? 2 : s.hp < s.max * 0.55 ? 1 : 0; }
function hrBuildWalls() {
  HR.statics = HR.statics.filter(e => !e.wall);
  for (const s of HF.walls) {
    if (s.gate) continue;
    const shape = hrWallShape(s), st = hrWallState(s), key = 'wall' + s.kind + s.seed + shape + st + s.h;
    const spr = bakeCached(key, () => wallBoxes(s, shape.split(''), st));
    const p = ISO(s.x, s.y); HR.statics.push({ c: spr.c, e: spr.e, x: p[0] - spr.ax, y: p[1] - spr.ay, w: spr.w, h: spr.h, d: s.x + s.y + 0.2, wall: s.id });
    if (st < 2) { const sk = bakeCached('stake' + shape, () => stakeBoxes(shape.split(''))); HR.statics.push({ c: sk.c, e: sk.e, x: p[0] - sk.ax, y: p[1] - sk.ay, w: sk.w, h: sk.h, d: s.x + s.y - 3, wall: s.id }); }
    if (!HR.shadowsDone) castShadow(s.x - 4, s.y - 0.7, 8, 1.4, s.h);
    s.st = st;
  }
  HR.shadowsDone = true;
  // gate: frame + two sliding leaves (dynamic)
  const g0 = HF.walls[HF.gate.segs[0]], gx = g0.x - 4, gy = g0.y;
  HR.gate = { x: gx, y: gy, frame: bakeCached('gateframe', gateFrameBoxes), leaf: bakeCached('gateleaf', gateLeafBoxes) };
  addStatic(HR.gate.frame, gx, gy, 0.3);
  HR.statics.sort((a, b) => a.d - b.d);
}
function hrRefreshWalls() { let ch = false; for (const s of HF.walls) if (!s.gate && hrWallState(s) !== s.st) ch = true; if (ch) hrBuildWalls(); }

// ---------------------------------------------------------------- sprites for actors
const VARIANT = { hoe: { tool: 'hoe' }, hammer: { tool: 'hammer' }, plank: { tool: 'plank' }, crate: { tool: 'crate' }, basket: { tool: 'basket' }, bucket: { tool: 'bucket' }, pot: { tool: 'pot' }, rod: { tool: 'rod' }, cloth: { tool: 'cloth' }, ball: { tool: 'ball' }, spear: { gun: 'spear' }, carry: { gun: 'carry' }, aim: { gun: 'aim' }, pistol: { gun: 'pistol' }, sling: { gun: 'sling' }, bag: { tool: 'bag' } };
function sheetFor(a, variant) {
  const key = a.L.seed + '|' + (a.L.ev || '') + '|' + a.L.top + '|' + (variant || '') + '|' + (a.L.pack2 ? 1 : 0) + '|' + HR.season;
  let s = HR.sheets.get(key); if (s) return s;
  const L = Object.assign({}, a.L, VARIANT[variant] || {}); if (HR.season === 'winter' && L.ev !== 'zombie') { L.sleeve = 'long'; if (L.r2 < 0.6) L.scarf = L.scarfC; if (L.r3 < 0.4 && !L.hat) L.hat = 'len'; }
  s = hfSheet(L); HR.sheets.set(key, s); return s;
}
function lyingFor(a, cover) { const key = a.L.seed + '|' + a.L.top + (cover ? 'c' : ''); let s = HR.lying.get(key); if (!s) { s = hfLying(a.L, cover); HR.lying.set(key, s); } return s; }
// animals: small parametric pixel sprites in the same ink style
function animalSprite(k, frame, flip) {
  const key = k + frame + (flip ? 'f' : ''); let s = HR.anim.get(key); if (s) return s;
  const W = 40, H = 32, g = new Int32Array(W * H).fill(-1), set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + (flip ? W - 1 - x : x)] = grade(c); };
  const rect = (x0, y0, x1, y1, c, sh) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, sh && y > (y0 + y1) / 2 ? sh : c); };
  const ell = (cx, cy, rx, ry, c, sh, hl) => { for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy > 1) continue; set(x, y, dy > 0.3 ? sh : dx < -0.2 && dy < -0.3 ? hl : c); } };
  const f = frame % 2;
  if (k === 'deer') { const c = 0xa8784a, sh = 0x7a5434, hl = 0xc89a6a; ell(18, 20, 9, 5, c, sh, hl); rect(25, 11, 28, 18, c, sh); ell(29, 10, 3, 2.5, c, sh, hl); set(31, 10, 0x2a2020); rect(28, 5, 28, 8, 0x8a6a44); rect(30, 4, 30, 7, 0x8a6a44); rect(27, 4, 29, 4, 0x8a6a44); const l = f ? 2 : -1; rect(11 + l, 24, 12 + l, 30, sh); rect(14 - l, 24, 15 - l, 30, sh); rect(22 + l, 24, 23 + l, 30, sh); rect(25 - l, 24, 26 - l, 30, sh); set(9, 18, 0xf4f0e8); set(9, 19, 0xf4f0e8); }
  else if (k === 'rabbit') { ell(18, 26, 4, 3, 0xb8a890, 0x8a7a68, 0xd8ccb8); ell(23, 23, 2.5, 2, 0xb8a890, 0x8a7a68); rect(22, 18 + f, 22, 21, 0xb8a890); rect(24, 18 + f, 24, 21, 0xa89880); set(14, 25, 0xf4f0e8); }
  else if (k === 'chicken') { ell(18, 25, 4, 3.5, 0xf0ece0, 0xc8c0b0, 0xffffff); ell(22, 20, 2, 2, 0xf0ece0, 0xc8c0b0); set(22, 17, 0xd9534f); set(23, 17, 0xd9534f); set(24, 20, 0xe8a03a); set(17 + f, 29, 0xe8a03a); set(19 - f, 29, 0xe8a03a); }
  else if (k === 'goat') { ell(18, 22, 7, 4.5, 0xe8e2d4, 0xb8b0a0, 0xffffff); rect(24, 14, 26, 20, 0xe8e2d4, 0xc8c0b0); ell(27, 14, 2.5, 2, 0xe8e2d4, 0xc8c0b0); set(29, 14, 0x2a2020); rect(26, 10, 26, 12, 0x8a7a6a); const l = f ? 1 : -1; rect(13 + l, 26, 13 + l, 30, 0xa8a090); rect(16 - l, 26, 16 - l, 30, 0xa8a090); rect(21 + l, 26, 21 + l, 30, 0xa8a090); rect(23 - l, 26, 23 - l, 30, 0xa8a090); }
  else if (k === 'dog') { ell(18, 23, 6, 3.5, 0xa8784a, 0x7a5434, 0xc89a6a); ell(25, 19, 3, 2.5, 0xa8784a, 0x7a5434, 0xc89a6a); set(27, 19, 0x2a2020); rect(24, 16, 24, 17, 0x7a5434); rect(11, 19 - f, 12, 21 - f, 0x7a5434); const l = f ? 1 : -1; rect(14 + l, 26, 14 + l, 30, 0x7a5434); rect(16 - l, 26, 16 - l, 30, 0x7a5434); rect(21 + l, 26, 21 + l, 30, 0x7a5434); rect(23 - l, 26, 23 - l, 30, 0x7a5434); }
  else if (k === 'crows') { for (const [ox, oy] of [[0, 0], [9, 3], [4, 7]]) { const w = f ? -1 : 1; set(14 + ox, 10 + oy, 0x2a2428); set(15 + ox, 10 + oy, 0x2a2428); set(13 + ox, 10 + oy - w, 0x2a2428); set(16 + ox, 10 + oy - w, 0x2a2428); set(12 + ox, 10 + oy - w * 2, 0x2a2428); set(17 + ox, 10 + oy - w * 2, 0x2a2428); } }
  s = gridCanvas(k === 'crows' ? g : inkGrid(g, W, H, 0.85), W, H, null, K); HR.anim.set(key, s); return s;
}

// ---------------------------------------------------------------- camera
function hrResize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3), cw = window.innerWidth, ch = window.innerHeight, pw = cw * dpr, ph = ch * dpr;
  const base = Math.max(1, Math.round(Math.sqrt(pw * ph / (560 * 315)) / K * 0.83)), aps = clamp(base + HR.zoom, 1, 6); HR.zoom = aps - base; HR.aps = aps;
  HR.vw = Math.ceil(pw / aps); HR.vh = Math.ceil(ph / aps);
  for (const c of [HR.cv, HR.lc]) { c.width = HR.vw; c.height = HR.vh; }
  HR.cv.style.width = (HR.vw * aps / dpr) + 'px'; HR.cv.style.height = (HR.vh * aps / dpr) + 'px';
  HR.g.imageSmoothingEnabled = false; HR.lg.imageSmoothingEnabled = false; HR.dirty = true;
}
function hrClampCam() { HR.cx = clamp(HR.cx, -HW + 200, HW - 200); HR.cy = clamp(HR.cy, 140, HW - 140); }
function hrCenterOn(x, y) { const p = ISO(x, y); HR.cx = p[0]; HR.cy = p[1]; hrClampCam(); }
function hrScreenToWorld(px, py) { const ux = HR.cx - HR.vw / K / 2 + px / (HR.aps * K) * (window.devicePixelRatio || 1) * 1, uy = HR.cy - HR.vh / K / 2 + py / (HR.aps * K) * (window.devicePixelRatio || 1); return [uy + ux / 2, uy - ux / 2]; }

// ---------------------------------------------------------------- frame
function hrFrame(alpha, now) {
  const g = HR.g, lg = HR.lg, W = HR.vw, H = HR.vh, uw = W / K, uh = H / K, x0 = HR.cx - uw / 2, y0 = HR.cy - uh / 2;
  HR.tick++;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#2a2630'; g.fillRect(0, 0, W, H);
  g.setTransform(K, 0, 0, K, -Math.round(x0 * K), -Math.round(y0 * K));
  // ground
  const ci0 = Math.floor((x0 + HW) / CHU), ci1 = Math.floor((x0 + uw + HW) / CHU), cj0 = Math.floor(y0 / CHU), cj1 = Math.floor((y0 + uh) / CHU);
  let baked = 0;
  for (let cj = cj0; cj <= cj1; cj++) for (let ci = ci0; ci <= ci1; ci++) {
    if (ci < 0 || cj < 0 || ci >= Math.ceil(2 * HW / CHU) || cj >= Math.ceil(HW / CHU)) continue;
    const key = ci + ',' + cj + ',' + HR.season; let ch = HR.chunks.get(key);
    if (!ch) { if (baked > (HR.bakeAll ? 99 : 1)) continue; ch = hrBakeChunk(ci, cj); baked++; }
    g.drawImage(ch.cv, ch.sx0, ch.sy0, CHU, CHU);
  }
  const t = HS.t;
  // water sparkle
  g.fillStyle = 'rgba(220,240,246,0.55)';
  for (const [wx, wy] of HR.waterPts) { const p = ISO(wx, wy); if (p[0] < x0 - 4 || p[0] > x0 + uw + 4 || p[1] < y0 - 4 || p[1] > y0 + uh + 4) continue; const ph = hash2(wx, wy) * 6.28, s = Math.sin(t * 1.6 + ph); if (s > 0.6) g.fillRect(Math.round((p[0] + Math.sin(t * 0.7 + ph) * 3) * K) / K, Math.round(p[1] * K) / K, s > 0.85 ? 1.5 : 1, 0.5); }
  // gather drawables
  const D = [], cull = (x, y, w, h) => x + w < x0 || x > x0 + uw || y + h < y0 || y > y0 + uh;
  for (const s of HR.statics) { if (cull(s.x, s.y, s.w, s.h)) continue; D.push(s); }
  const L = HR.lerp = alpha;
  for (const p of HS.people) actorDraw(D, p, false, L, cull);
  for (const z of HS.zombies) actorDraw(D, z, true, L, cull);
  for (const w of HS.wild) { const x = w.px + (w.x - w.px) * L, y = w.py + (w.y - w.py) * L, pp = ISO(x, y, w.k === 'crows' ? 34 + Math.sin(t * 2 + w.ph) * 4 : 0); if (cull(pp[0] - 10, pp[1] - 16, 20, 18)) continue; const fr = w.k === 'crows' ? Math.floor(t * 6 + w.ph) : Math.floor(w.stride / 2.5), flip = w.dir === 2 || w.dir === 3; const s = animalSprite(w.k, fr, flip); D.push({ c: s.c, e: s.e, x: Math.round((pp[0] - 10) * K) / K, y: Math.round((pp[1] - 15.5) * K) / K, w: 20, h: 16, d: x + y }); }
  // gate leaves (slide apart)
  const G0 = HR.gate; if (G0) { const o = HF.gate.open * 11, p1 = ISO(G0.x - o, G0.y), p2 = ISO(G0.x + 12 + o, G0.y), lf = G0.leaf; D.push({ c: lf.c, e: lf.e, x: p1[0] - lf.ax, y: p1[1] - lf.ay, w: lf.w, h: lf.h, d: G0.x + G0.y + 0.25 }, { c: lf.c, e: lf.e, x: p2[0] - lf.ax, y: p2[1] - lf.ay, w: lf.w, h: lf.h, d: G0.x + G0.y + 12.25 }); }
  D.sort((a, b) => a.d - b.d);
  // soft contact shadows first (trees + actors), then sprites
  for (const s of D) { if (s.sh) { const sp = shadowSprite(s.sh[2]); g.drawImage(sp, s.sh[0] - sp.width / K / 2, s.sh[1] - sp.height / K / 2, sp.width / K, sp.height / K); } else if (s.tree) { if (!s.rad) continue; const sp = shadowSprite(s.rad * 0.8); const p = ISO(s.tx + 3, s.ty + 2); g.drawImage(sp, p[0] - sp.width / K / 2, p[1] - sp.height / K / 2, sp.width / K, sp.height / K); } }
  for (const s of D) { if (s.blink && Math.floor(now / 70) % 2) continue; if (s.sx !== undefined) g.drawImage(s.c, s.sx, s.sy, s.sw, s.shh, s.x, s.y, s.w, s.h); else g.drawImage(s.c, s.x, s.y, s.w, s.h); if (s.over) s.over(g); }
  HR.drawn = D.length;
  // string lights over the green, fx, smoke, bubbles
  hrFx(g, t, now);
  // time of day + weather grade, then emissive light
  const h = HS.hour, amb = hrAmbient(h), dark = clamp(1 - ((amb >> 16 & 255) + (amb >> 8 & 255) + (amb & 255)) / (3 * 238), 0, 1);
  g.setTransform(1, 0, 0, 1, 0, 0);
  let ac = amb; if (HS.weather === 'rain') ac = mixc(ac, 0x8a96b0, 0.32); if (HR.season === 'winter') ac = mixc(ac, 0xe8eeff, 0.1);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = css(ac); g.fillRect(0, 0, W, H);
  // cooler wilderness / warmer settlement at dusk and night (screen-space approximation along the wall)
  g.globalCompositeOperation = 'source-over';
  if (dark > 0.08) {
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.fillStyle = '#000'; lg.fillRect(0, 0, W, H);
    lg.setTransform(K, 0, 0, K, -Math.round(x0 * K), -Math.round(y0 * K));
    for (const s of D) { if (!s.e) continue; if (s.sx !== undefined) lg.drawImage(s.e, s.sx, s.sy, s.sw, s.shh, s.x, s.y, s.w, s.h); else lg.drawImage(s.e, s.x, s.y, s.w, s.h); }
    lg.globalCompositeOperation = 'lighter';
    for (const L2 of HR.lights) { const [lx, ly, r, c, a, kind, ref] = L2; if (lx < x0 - r || lx > x0 + uw + r || ly < y0 - r || ly > y0 + uh + r) continue; const fl = kind >= 2 ? 0.85 + Math.sin(t * 9 + lx) * 0.08 + Math.sin(t * 23 + ly) * 0.05 : 1; hrGlow(lg, lx, ly, r * fl, c, a * fl); }
    for (const f of HS.fx) if (f.k === 'flash') { const p = ISO(f.x, f.y, f.z); hrGlow(lg, p[0], p[1], 30, 'rgba(255,226,150,', 0.9); }
    if (HF.oak) for (let k = 0; k < 14; k++) { const p = stringPt(k / 14); hrGlow(lg, p[0], p[1], 7, 'rgba(255,220,150,', 0.5); }
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, dark * 1.3); g.drawImage(HR.lc, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  hrWeather(g, W, H, t, dark);
}
function hrGlow(g, x, y, r, c, a) { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, c + a + ')'); rg.addColorStop(1, c + '0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }
function stringPt(t) { const o = HF.oak, a = t * TAU, x = o.x + 20 + Math.cos(a) * 40, y = o.y + 26 + Math.sin(a) * 26; return ISO(x, y, 15 + Math.abs(Math.sin(a * 4)) * -3); }

// people + infected -> drawables
const POSE_ACT = { sit: 5, kneel: 5, talk: 7, stir: 7, fish: 7, hang: 6, raise: 6, stab: 7, look: 0, stand: 0 };
function actorDraw(D, a, isZ, L, cull) {
  if (!isZ && (!a.vis || (a.st === 'dead' && a.gone))) return;
  const x = a.px + (a.x - a.px) * L, y = a.py + (a.y - a.py) * L, z = a.z || 0, p = ISO(x, y, z);
  if (cull(p[0] - 10, p[1] - 28, 20, 30)) return;
  // fallen: lying sprite (settlers covered by a sheet)
  if ((isZ && a.st === 'dead') || (!isZ && (!a.alive || a.st === 'down' || a.act === 'lie'))) {
    const s = lyingFor(a, !isZ && !a.alive), fade = isZ && a.corpseT < 0 ? clamp(1 + a.corpseT / 5, 0, 1) : 1; if (fade <= 0) return;
    D.push({ c: s.c, e: s.e, x: Math.round((p[0] - CH / K / 2) * K) / K, y: Math.round((p[1] - CW / K + 3) * K) / K, w: CH / K, h: CW / K, d: x + y - 2, sh: [p[0], p[1], 6] });
    return;
  }
  let pose = 0; const tt = HS.t + (a.ph || 0), moving = Math.hypot(a.x - a.px, a.y - a.py) > 0.01;
  if (moving) pose = 1 + Math.floor(a.stride / (isZ ? 2.4 : 3.2)) % 4;
  else if (isZ) pose = a.st === 'attack' || a.st === 'wall' || a.st === 'gate' ? (Math.floor(tt / 0.32) % 2 ? 6 : 7) : 0;
  else { const act = a.act; if (act === 'hammer' || act === 'hoe' || act === 'drill') pose = Math.floor(tt / 0.42) % 2 ? 6 : 0; else if (act === 'jump') pose = 1 + Math.floor(tt * 6) % 4; else if (act === 'talk') pose = Math.floor(tt / 1.7) % 3 ? 7 : 0; else pose = POSE_ACT[act] || 0; }
  const variant = isZ ? '' : (a.variant || (a.role === 'guard' ? 'sling' : ''));
  const s = sheetFor(a, variant), row = DIR_ROW[a.dir];
  D.push({ c: s.c, e: s.e, sx: pose * CW, sy: row * CH, sw: CW, shh: CH, x: Math.round((p[0] - PW / 2) * K) / K, y: Math.round((p[1] - PFOOT - (pose === 5 ? 2 : 0)) * K) / K, w: PW, h: PH, d: x + y + (z ? 15 : 0), sh: z ? null : [p[0], p[1], 4.2], blink: isZ && a.stT > 0,
    over: (a.bub && typeof BUB !== 'undefined' && BUB[a.bub]) || (!isZ && a.task && a.task.k === 'work' && a.task.anim === 'fish') ? (g) => { if (a.bub && BUB[a.bub]) g.drawImage(BUB[a.bub], p[0] - 7, p[1] - 44, 14, 14); if (a.task && a.task.anim === 'fish' && a.act === 'fish') { g.fillStyle = 'rgba(232,226,212,0.8)'; for (let i = 0; i < 12; i++) g.fillRect(p[0] + 9 + i * 0.9, p[1] - 20 + i * 1.4 + Math.sin(HS.t * 2) * 0.5, 0.5, 0.5); } } : null });
}
function hrFx(g, t, now) {
  for (const f of HS.fx) {
    if (f.k === 'tracer') { const a = ISO(f.x0, f.y0, f.z0), b = ISO(f.x1, f.y1, f.z1); g.fillStyle = '#fff2c4'; const n = Math.max(4, Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.4 | 0); for (let i = 0; i < n; i++) { if (i % 3 === 2) continue; const q = i / n; g.fillRect(Math.round((a[0] + (b[0] - a[0]) * q) * K) / K, Math.round((a[1] + (b[1] - a[1]) * q) * K) / K, 0.5, 0.5); } }
    else if (f.k === 'flash') { const p = ISO(f.x, f.y, f.z); g.fillStyle = '#ffd36a'; g.fillRect(p[0] - 1.5, p[1] - 1, 3, 2); g.fillRect(p[0] - 0.5, p[1] - 2, 1, 4); }
    else if (f.k === 'dust') { const p = ISO(f.x, f.y), r = 2 + (0.6 - f.t) * 8; g.fillStyle = 'rgba(176,156,128,' + (f.t * 1.2).toFixed(2) + ')'; g.fillRect(p[0] - r, p[1] - r * 0.6, r * 2, r * 1.0); }
    else if (f.k === 'hit') { const p = ISO(f.x, f.y, 12); g.fillStyle = f.h ? '#ffb0a0' : '#f8f4e8'; g.fillRect(p[0] - 1, p[1] - 1, 2, 2); g.fillRect(p[0] + 2, p[1] - 3, 1, 1); g.fillRect(p[0] - 3, p[1] + 1, 1, 1); }
  }
  // chimney smoke
  const winterish = HR.season === 'winter' || HS.hour < 8 || HS.hour > 17;
  for (const [x, y, z, sd] of HR.smokers) { if (!winterish && sd % 3) continue; const p = ISO(x, y, z); for (let k = 0; k < 4; k++) { const q = ((t * 0.25 + k / 4 + sd * 0.13) % 1); g.fillStyle = 'rgba(200,194,190,' + (0.42 * (1 - q)).toFixed(2) + ')'; const r = 1.5 + q * 4; g.fillRect(Math.round((p[0] + q * 10 + Math.sin(t + k) * 1.5) * K) / K - r / 2, p[1] - q * 26 - r / 2, r, r); } }
  // string lights over the commons (always drawn as little bulbs)
  if (HF.oak) { g.fillStyle = '#ffe6a0'; for (let k = 0; k < 28; k++) { const p = stringPt(k / 28); g.fillRect(Math.round(p[0] * K) / K, Math.round(p[1] * K) / K, 0.5, 0.5); } }
}
// weather overlay in screen space
function hrWeather(g, W, H, t, dark) {
  const wx = HS.weather, P = HR.parts, n = wx === 'rain' ? Math.round(W * H / 4200) : wx === 'wind' ? Math.round(W * H / 30000) : 0;
  while (P.length < n) P.push({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random() * 0.8 }); P.length = n;
  if (!n) return;
  const snow = HR.season === 'winter';
  if (wx === 'rain') {
    g.strokeStyle = snow ? 'rgba(250,252,255,0.85)' : 'rgba(200,214,236,0.5)'; g.fillStyle = 'rgba(250,252,255,0.9)'; g.lineWidth = 1; g.beginPath();
    for (const q of P) { q.y += (snow ? 1.2 : 14) * q.s; q.x += (snow ? Math.sin(t + q.s * 9) * 0.6 : -3 * q.s); if (q.y > H) { q.y = -10; q.x = Math.random() * W; } if (q.x < 0) q.x += W; if (snow) g.fillRect(q.x | 0, q.y | 0, q.s > 1 ? 2 : 1, q.s > 1 ? 2 : 1); else { g.moveTo(q.x | 0, q.y | 0); g.lineTo((q.x - 3 * q.s) | 0, (q.y + 9 * q.s) | 0); } }
    g.stroke();
  } else {
    for (const q of P) { q.x += 3 * q.s; q.y += Math.sin(t * 2 + q.s * 7) * 0.6; if (q.x > W) { q.x = -4; q.y = Math.random() * H; } g.fillStyle = HR.season === 'fall' ? (q.s > 1 ? '#c0622a' : '#e8b03a') : snow ? '#f4f6f8' : (q.s > 1 ? 'rgba(200,188,150,0.8)' : 'rgba(120,150,80,0.8)'); g.fillRect(q.x | 0, q.y | 0, 2, 1); }
  }
}
