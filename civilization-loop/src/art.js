// Procedural pixel art: every sprite is generated in code at load time (no image files, no external generators).
// Isometric tiles are 24x12 art pixels. Solid objects are built from iso boxes, with face lighting, texture painters and a dark ink outline.
import { hash2, vnoise, clamp } from './rng.js';

export const TW = 24, TH = 12, HW = 12, HH = 6;
export const INK = 0x2b1e18;
const SEASON_I = { 0: 0, 1: 1, 2: 2, 3: 3 };

// ---------------------------------------------------------------- colour + buffer helpers
const R_ = c => (c >> 16) & 255, G_ = c => (c >> 8) & 255, B_ = c => c & 255;
export const rgb = (r, g, b) => ((clamp(r | 0, 0, 255)) << 16) | ((clamp(g | 0, 0, 255)) << 8) | clamp(b | 0, 0, 255);
export const mix = (a, b, t) => rgb(R_(a) + (R_(b) - R_(a)) * t, G_(a) + (G_(b) - G_(a)) * t, B_(a) + (B_(b) - B_(a)) * t);
export const mul = (c, k) => rgb(R_(c) * k, G_(c) * k, B_(c) * k);
const pick = (arr, r) => arr[Math.min(arr.length - 1, Math.floor(r * arr.length))];

function Buf(w, h) { return { w, h, u: new Uint32Array(w * h) }; }
const packC = c => (0xFF000000 | (B_(c) << 16) | (G_(c) << 8) | R_(c)) >>> 0;
function put(P, x, y, c) { if (x < 0 || y < 0 || x >= P.w || y >= P.h) return; P.u[y * P.w + x] = packC(c); }
const get = (P, x, y) => (x < 0 || y < 0 || x >= P.w || y >= P.h) ? 0 : P.u[y * P.w + x];
function rect(P, x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(P, x, y, c); }
function outline(P, col = INK) {
  const out = P.u.slice(), k = packC(col);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { if (P.u[y * P.w + x]) continue; if (get(P, x - 1, y) || get(P, x + 1, y) || get(P, x, y - 1) || get(P, x, y + 1)) out[y * P.w + x] = k; }
  P.u.set(out);
}
export function toCanvas(P) {
  const c = document.createElement('canvas'); c.width = P.w; c.height = P.h;
  const g = c.getContext('2d'), id = g.createImageData(P.w, P.h); new Uint32Array(id.data.buffer).set(P.u); g.putImageData(id, 0, 0); return c;
}
const inDiamond = (x, y) => Math.abs(x + 0.5 - HW) / HW + Math.abs(y + 0.5 - HH) / HH <= 1;

// ---------------------------------------------------------------- palettes (earthy, calm)
export const GRASS = [
  [0x7fa04e, 0x8cae58, 0x6e9244, 0x96b860, 0x5a7a38],     // spring
  [0x6f8f46, 0x7d9c50, 0x617f3d, 0x86a85a, 0x506f34],     // summer
  [0x9a9a4a, 0xa8a452, 0x8a8a42, 0xb8a85a, 0x7a7a3a],     // autumn
  [0xc9d3cf, 0xd8e0dc, 0xb8c4be, 0xe6ecea, 0xa6b4ae],     // winter (light snow)
];
const WATER = [0x3d6c85, 0x477b94, 0x35607a, 0x8cbccb, 0xc9b27a];
const ROCKC = [0x8b857a, 0x9a9488, 0x76716a, 0xb0a99a];
const SOIL = [0x6e4a32, 0x5c3c28, 0x7a5638];
const TREEP = [
  [0x3f7a3a, 0x58a048, 0x7cc05a, 0xa0d870],
  [0x2f6a35, 0x469444, 0x62ae52, 0x88cc68],
  [0x8a4a22, 0xb86a2a, 0xd89a38, 0xe8c050],
  [0x5a6a58, 0x7a8a76, 0xaab8aa, 0xe8eeee],
];
const CONIFER = [[0x24503a, 0x2f6a46, 0x3f8458, 0x5aa070], [0x1f4a34, 0x2a6040, 0x3a7a50, 0x56986a], [0x24503a, 0x2f6a46, 0x3f8458, 0x5aa070], [0x2a4a42, 0x3a6a5c, 0x6a8e84, 0xe8eeee]];

// ---------------------------------------------------------------- ground tiles (24 wide, 16 tall: 4 px of headroom above the diamond)
const TILE_H = 16, TOP = 4;
function tileBuf() { return Buf(TW, TILE_H); }
function grassPix(x, y, season, v) {
  const P = GRASS[season], n = vnoise(x / 3 + v * 7, y / 3, 11), r = hash2(x, y, v + 3);
  let c = n > 0.62 ? P[3] : n > 0.4 ? P[1] : P[0];
  if (r > 0.93) c = P[2]; else if (r < 0.04) c = P[4];
  return c;
}
export function groundTile(kind, v, season, opt = {}) {
  const P = tileBuf();
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    if (!inDiamond(x, y)) continue; const ux = (x + 0.5 - HW) / HW, uy = (y + 0.5 - HH) / HH, d = Math.abs(ux) + Math.abs(uy), r = hash2(x, y, v * 5 + kind.length);
    let c = null;
    if (kind === 'grass') c = grassPix(x, y, season, v);
    else if (kind === 'water') {
      const f = opt.frame || 0, m = opt.mask || 0, tl = -(ux + uy) / 2 * 2, tr = (ux - uy), br = (ux + uy), bl = (uy - ux);   // distance to the four edges
      c = vnoise(x / 4 + f * 0.15, y / 2, 3) > 0.55 ? WATER[1] : WATER[0];
      if (hash2(x + f * 3, y, 77) > 0.965) c = WATER[3];
      if (r < 0.05) c = WATER[2];
      const e = 0.26; // shore: sand on the edges whose neighbour is land (bit 1: +x/br, 2: +y/bl, 4: -x/tl, 8: -y/tr)
      if (((m & 1) && 1 - br < e) || ((m & 2) && 1 - bl < e) || ((m & 4) && 1 + br - 2 * Math.max(0, br) < 0 && false) || ((m & 4) && -(ux + uy) > 1 - e) || ((m & 8) && 1 - tr < e)) c = r > 0.5 ? WATER[4] : mix(WATER[4], 0xe0d4a0, 0.4);
      if (season === 3 && ((m & 15) || r > 0.97)) c = mix(c, 0xe8eef0, 0.55);
    } else if (kind === 'rock') {
      c = vnoise(x / 3, y / 3, 5) > 0.55 ? ROCKC[1] : ROCKC[0]; if (r > 0.9) c = ROCKC[3]; else if (r < 0.1) c = ROCKC[2];
      if (season === 3 && r > 0.55) c = mix(c, 0xe8eef0, 0.5);
    } else if (kind === 'pit') {
      c = r > 0.85 ? 0x8a8478 : r > 0.4 ? 0x6e6a60 : 0x5e5a52;
    } else if (kind === 'dirt') {       // worn path / packed road, with grass creeping in at the edges
      const edge = 0.8 + (hash2(x >> 1, y >> 1, v + 9) - 0.5) * 0.45; let dirt = opt.packed ? [0xb5a483, 0xa39373, 0xc4b494] : [0xa88c62, 0x9a7f58, 0xb39a70];
      if (d < edge) { c = r > 0.88 ? dirt[2] : r < 0.2 ? dirt[1] : dirt[0]; if (opt.packed && hash2(x >> 1, y, 4) > 0.82) c = 0x8a8272; if (opt.overgrown && r > 0.4) c = grassPix(x, y, season, v); }
      else c = grassPix(x, y, season, v);
      if (season === 3 && r > 0.6) c = mix(c, 0xe8eef0, 0.5);
    } else if (kind === 'farm') {       // furrows running along one iso axis; stage 0 bare .. 3 ripe, 4 exhausted, 5 fallow, 6 abandoned (the furrows remain)
      const st = opt.stage, row = ((x + y * 2) >> 1) % 3 === 0, base = grassPix(x, y, season, v);
      if (st === 6) { c = row && r > 0.35 ? mix(base, SOIL[0], 0.45) : base; }
      else if (st === 5) { c = row ? mix(SOIL[0], base, 0.4) : mix(base, 0x8a9a4a, 0.4); if (r > 0.8) c = GRASS[1][3]; }
      else {
        c = row ? SOIL[1] : (r > 0.6 ? SOIL[2] : SOIL[0]);
        if (st === 4) c = row ? mix(0x9a8466, 0x7a6850, 0.3) : (r > 0.5 ? 0xb09a78 : 0xa08a68);
        if (st === 1 && !row && r > 0.55) c = 0x6aa044;
        if (st === 2 && !row) c = r > 0.5 ? 0x5a9a3c : 0x6aae48;
        if (st === 3 && !row) c = r > 0.5 ? 0xd0b448 : 0xe0c658;
      }
      if (season === 3 && st !== 0) c = mix(c, 0xe8eef0, 0.4);
    } else if (kind === 'burnt') {
      c = r > 0.88 ? 0x6a625a : r > 0.3 ? 0x3a322c : 0x2c2622; if (opt.fade) c = mix(c, grassPix(x, y, season, v), opt.fade);
    } else if (kind === 'mud') {
      c = mix(grassPix(x, y, season, v), 0x7a6040, 0.45 + (r - 0.5) * 0.3);
    } else if (kind === 'plot') {       // packed earth under a building or a construction site
      c = r > 0.8 ? 0xa89a7c : r > 0.3 ? 0x96886a : 0x8a7c60; if (opt.stage === 0) c = mix(c, 0x6e5a40, 0.35);
    }
    put(P, x, y + TOP, c);
  }
  return toCanvas(P);
}

// ---------------------------------------------------------------- trees
function disc(P, cx, cy, rad, fn) { for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++) for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rx(rad)); x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy <= rad * rad) fn(x, y, dx, dy); } }
const rx = r => r;
export const TREE_W = 30, TREE_H = 36, TREE_AX = 15, TREE_AY = 31;   // anchor = the base of the trunk
export function treeSprite(level, variant, season) {
  const P = Buf(TREE_W, TREE_H), pal = TREEP[season], sparse = season === 3 ? 0.4 : 0, seed = variant * 13 + level * 5 + season * 31;
  const conifer = variant % 3 === 2, cx = TREE_AX, base = TREE_AY;
  if (level === 1) {      // shrub / sapling
    disc(P, cx, base - 3, 3.6, (x, y, dx, dy) => { if (hash2(x, y, seed) < sparse) return; const l = -dx * 0.6 - dy * 0.8 + (hash2(x, y, seed + 1) - 0.5) * 0.8; put(P, x, y, l > 0.7 ? pal[3] : l > 0.1 ? pal[2] : l > -0.5 ? pal[1] : pal[0]); });
    rect(P, cx, base - 1, cx, base, 0x5a3e2a);
  } else if (conifer) {
    const h = level === 3 ? 26 : 17, w0 = level === 3 ? 7 : 5, cp = CONIFER[season];
    rect(P, cx - 1, base - 3, cx, base, 0x4a3426);
    for (let y = 0; y < h; y++) { const t = y / h, hw = Math.max(0.5, t * w0 * (0.8 + 0.4 * ((y % 6) / 6))); for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) { const dx = x - cx; if (hash2(x, y, seed) < sparse * 0.5) continue; const l = -dx / (hw + 0.1) * 0.7 - 0.1 + (hash2(x, y, seed + 2) - 0.5) * 0.4 + ((y % 6) < 2 ? 0.25 : -0.1); put(P, x, base - 3 - h + y, l > 0.55 ? cp[3] : l > 0.1 ? cp[2] : l > -0.4 ? cp[1] : cp[0]); } }
  } else {
    const tr = level === 3 ? 9 : 6, cr = level === 3 ? 8 : 5.2, cyy = base - tr - cr + 2;
    rect(P, cx - 1, base - tr, cx, base, 0x5a3e2a); put(P, cx + 1, base - 1, 0x3e2a1e); put(P, cx - 2, base - 1, 0x4a3426);
    const blobs = level === 3 ? [[0, 0, cr], [-4.5, 3, cr * 0.72], [4.5, 3, cr * 0.72], [0, -3.5, cr * 0.7]] : [[0, 0, cr], [-3, 2, cr * 0.7], [3, 2, cr * 0.7]];
    for (const [ox, oy, r] of blobs) disc(P, cx + ox, cyy + oy, r, (x, y, dx, dy) => {
      if (hash2(x, y, seed) < sparse) return; const l = -(x - cx + 2) * 0.09 - (y - cyy) * 0.11 + (hash2(x, y, seed + 1) - 0.5) * 0.55 + ((y + (x >> 1)) % 4 === 0 ? 0.12 : 0);
      put(P, x, y, l > 0.5 ? pal[3] : l > 0.05 ? pal[2] : l > -0.45 ? pal[1] : pal[0]);
    });
  }
  outline(P); return toCanvas(P);
}
export function stumpSprite(v) { const P = Buf(12, 10); rect(P, 4, 5, 7, 8, 0x7a5638); rect(P, 4, 4, 7, 4, 0xc8a070); put(P, 5, 4, 0xe0c090); rect(P, 7, 5, 7, 8, 0x5a3e2a); if (v) rect(P, 1, 8, 2, 8, 0x6a4a30); outline(P); return toCanvas(P); }
export function snagSprite(v) { const P = Buf(12, 22); const h = 10 + v * 4; for (let y = 0; y < h; y++) { const x = 6 + (y > h * 0.6 ? (v ? 1 : -1) : 0); put(P, x, 20 - y, y % 3 ? 0x2c2622 : 0x3a322c); put(P, x + 1, 20 - y, 0x1e1a18); } if (v) { put(P, 3, 11, 0x2c2622); put(P, 4, 10, 0x2c2622); } outline(P, 0x16120f); return toCanvas(P); }
export function boulderSprite(v, season, level) {
  const P = Buf(26, 22), r = 7 + (v % 3), cx = 13, cy = 14;
  disc(P, cx - 3, cy + 1, r * 0.8, (x, y, dx, dy) => put(P, x, y, ROCKC[2]));
  disc(P, cx, cy, r, (x, y, dx, dy) => { const l = -dx * 0.07 - dy * 0.1 + (hash2(x, y, v) - 0.5) * 0.4 + (hash2(x >> 1, y >> 1, v + 4) - 0.5) * 0.5; put(P, x, y, l > 0.45 ? ROCKC[3] : l > 0.0 ? ROCKC[1] : l > -0.35 ? ROCKC[0] : ROCKC[2]); });
  if (season === 3) for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y < cy - r * 0.4; y++) if (get(P, x, y) && hash2(x, y, 3) > 0.3) put(P, x, y, 0xe8eef0);
  outline(P); return toCanvas(P);
}
export function ruinSprite(kind, v, age, season) {   // rubble: a heap of stones and fallen timber; vegetation takes over with age
  const P = Buf(24, 18); const stone = [0x9a948a, 0x7a746a, 0xb0a99a], wood = [0x7a5638, 0x5a3e2a], isFarm = false;
  for (let i = 0; i < 7; i++) { const x = 4 + Math.floor(hash2(v, i, 1) * 14), y = 6 + Math.floor(hash2(v, i, 2) * 6), w = 2 + Math.floor(hash2(v, i, 3) * 4), h = 1 + Math.floor(hash2(v, i, 4) * 3); const c = hash2(v, i, 5) > 0.35 ? pick(stone, hash2(v, i, 6)) : pick(wood, hash2(v, i, 6)); rect(P, x, y, x + w, y + h, c); rect(P, x, y + h, x + w, y + h, mul(c, 0.7)); }
  const green = Math.min(0.9, age / 120);
  for (let i = 0; i < 26 * green; i++) put(P, 3 + Math.floor(hash2(v, i, 8) * 17), 5 + Math.floor(hash2(v, i, 9) * 9), TREEP[season === 3 ? 3 : 1][1 + (i % 3)]);
  outline(P); return toCanvas(P);
}
export function foundationSprite(v, season, age) {   // a ring of old stones flat on the ground, grown over
  const P = Buf(TW, TILE_H);
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { if (!inDiamond(x, y)) continue; const ux = (x + 0.5 - HW) / HW, uy = (y + 0.5 - HH) / HH, d = Math.abs(ux) + Math.abs(uy); if (d > 0.5 && d < 0.78 && hash2(x, y, v) > 0.35) put(P, x, y + TOP, hash2(x, y, v + 1) > 0.5 ? 0x8a847a : 0x9a948a); }
  return toCanvas(P);
}

// ---------------------------------------------------------------- iso box sprites
// A box lives in tile units; painters receive {face:0|1|2, u, v, z, sx, sy} and return a colour, -1 for a hole, or undefined for the base colour.
const SHADE = [1.0, 0.86, 0.66];
function SpriteBuilder(w, d, zmax) {
  const pad = 3, SW = (w + d) * HW + pad * 2, SH = (w + d) * HH + zmax + pad * 2, OX = d * HW + pad, OY = zmax + pad;
  const P = Buf(SW, SH);
  function box(bx, by, z0, bw, bd, h, color, paint) {
    const z1 = z0 + h, x0 = Math.floor(OX + (bx - (by + bd)) * HW) - 1, x1 = Math.ceil(OX + (bx + bw - by) * HW) + 1, y0 = Math.floor(OY + (bx + by) * HH - z1) - 1, y1 = Math.ceil(OY + (bx + bw + by + bd) * HH - z0) + 1;
    for (let sy = Math.max(0, y0); sy <= Math.min(SH - 1, y1); sy++) for (let sx = Math.max(0, x0); sx <= Math.min(SW - 1, x1); sx++) {
      const dx = sx + 0.5 - OX, dy = sy + 0.5 - OY; let face = -1, u = 0, v = 0, z = 0;
      let uu = ((dy + z1) / HH + dx / HW) / 2, vv = ((dy + z1) / HH - dx / HW) / 2;
      if (uu >= bx && uu < bx + bw && vv >= by && vv < by + bd) { face = 0; u = uu; v = vv; z = z1; }
      else { const vF = by + bd, uF = dx / HW + vF, zz = (uF + vF) * HH - dy; if (uF >= bx && uF < bx + bw && zz >= z0 && zz < z1) { face = 1; u = uF; v = vF; z = zz; }
        else { const uR = bx + bw, vR = uR - dx / HW, z2 = (uR + vR) * HH - dy; if (vR >= by && vR < by + bd && z2 >= z0 && z2 < z1) { face = 2; u = uR; v = vR; z = z2; } } }
      if (face < 0) continue;
      let c = paint ? paint({ face, u, v, z, sx, sy, bx, by, bw, bd, h, z0, z1 }) : undefined;
      if (c === -1) { P.u[sy * SW + sx] = 0; continue; }
      if (c === undefined) c = color;
      put(P, sx, sy, mul(c, SHADE[face]));
    }
  }
  return { P, box, OX, OY, SW, SH };
}
const finishSprite = (B, ink = INK) => { outline(B.P, ink); return { c: toCanvas(B.P), ox: B.OX, oy: B.OY, w: B.SW, h: B.SH }; };

// materials
const thatch = (seed, base = 0xc8a860) => ({ face, u, v, z, sx, sy }) => { const n = hash2(sx, sy, seed), s = vnoise(sx / 2 + seed, sy / 1.2, 3); return n > 0.9 ? mix(base, 0xfff0c0, 0.35) : n < 0.1 ? mix(base, 0x5a4020, 0.35) : s > 0.6 ? mix(base, 0xe0c880, 0.3) : s < 0.32 ? mix(base, 0x7a5a30, 0.25) : base; };
const shingle = (seed, base) => ({ sx, sy, z }) => ((Math.floor(z) % 3) === 0 ? mul(base, 0.72) : (hash2(sx >> 1, sy, seed) > 0.82 ? mul(base, 1.15) : base));
const clay = (seed, base = 0xb0583c) => ({ sx, sy, z }) => (((Math.floor(z) & 1) === 0 && (sx & 1) === 0) ? mul(base, 0.78) : hash2(sx, sy, seed) > 0.85 ? mul(base, 1.18) : base);
const hideP = (seed, base = 0x8a6a48) => ({ sx, sy, u, v }) => (((Math.floor(u * 2 + v * 2 + sx / 8)) % 3 === 0) ? mul(base, 0.78) : hash2(sx, sy, seed) > 0.9 ? mul(base, 1.2) : base);
const WALL = [0xc9b48a, 0xe2d3b0, 0xe8dcc0];
function wallPaint(skin, seed, o) {   // o: {door:{u(frac),w}, window:true, wear, ab, h}
  return ({ face, u, v, z, sx, sy, bx, by, bw, bd, h }) => {
    if (face === 0) return mix(0x8a7a60, 0x6a5a44, 0.3);
    const along = face === 1 ? u - bx : v - by, len = face === 1 ? bw : bd, f = along / len; let c = WALL[skin];
    if (skin === 0) c = hash2(Math.floor(along * 6), 0, seed) > 0.55 ? 0xc9b48a : 0xbca67c;
    if (skin >= 1) { const post = Math.abs(along - Math.round(along)) < 0.07 || z < 1.2 || z > h - 1.4; if (post) c = 0x6a4a30; else if (skin === 1 && Math.abs(z - h / 2 - (along % 1 - 0.5) * 8) < 0.7) c = 0x7a5a3a; }
    if (skin === 2 && z < 4.5 && !(Math.abs(along - Math.round(along)) < 0.07)) c = ((Math.floor(z / 1.5) + Math.floor(along * 3)) & 1) ? 0x9a948a : 0x8a847a;
    if (o.door && face === 1 && along > o.door.u && along < o.door.u + o.door.w && z < 8) c = (along - o.door.u < 0.07 || z > 7 || (along - o.door.u) > o.door.w - 0.07) ? 0x4a3426 : 0x3a2820;
    if (o.window && face === 2 && along > 0.5 && along < 0.9 && z > 3 && z < 6.5) c = 0x2e2a30;
    if (o.window && face === 1 && z > 3.5 && z < 6.5 && ((along > 0.25 && along < 0.55 && !o.door) || (o.door && along > o.door.u + o.door.w + 0.25 && along < o.door.u + o.door.w + 0.55))) c = 0x2e2a30;
    if (o.wear >= 1 && hash2(sx, sy, seed + 5) > 0.88) c = mul(c, 0.72);
    if (o.wear >= 2 && (hash2(sx >> 1, sy, seed + 9) > 0.9)) return -1;                    // holes
    if (o.ab && hash2(sx, sy, seed + 3) > 0.74 - z * 0.015) c = pick([0x4a7a3a, 0x5a8a44, 0x6a9a4e], hash2(sx, sy, 2));
    return c;
  };
}
function roofLayers(B, bx, by, bw, bd, z0, layers, step, paintFn, color, o) {
  for (let k = 0; k < layers; k++) {
    const ins = k * step; if (bw - 2 * ins < 0.15 || bd - 2 * ins < 0.15) break;
    if (o.wear >= 2 && k >= layers - 2) continue;                          // the crown has fallen in
    B.box(bx + ins, by + ins, z0 + k * 1.8, bw - 2 * ins, bd - 2 * ins, 1.8, color, (p) => {
      let c = paintFn(p); if (o.wear >= 1 && hash2(p.sx, p.sy, 31) > 0.9) return -1; if (o.ab && hash2(p.sx, p.sy, 12) > 0.8) return pick([0x4a7a3a, 0x5a8a44], hash2(p.sx, p.sy, 3)); return o.wear >= 1 ? mul(c, 0.86) : c; });
  }
}
const stake = (B, x, y, z0, h, c = 0x7a5638) => B.box(x - 0.045, y - 0.045, z0, 0.09, 0.09, h, c);

// ---------------------------------------------------------------- buildings
const ROOF_Z = { shelter: 3, house: 9, storage: 9, workshop: 9, well: 5 };
export function buildingSprite(type, skin, stage, wear, ab, seed) {
  const dims = { shelter: [2, 2], house: [2, 2], farm: [3, 3], storage: [2, 2], well: [1, 1], workshop: [2, 2] }[type], [w, d] = dims;
  const B = SpriteBuilder(w, d, 44), o = { wear, ab }, s = seed || 1;
  if (stage < 4) return finishSprite(constructionSprite(B, type, w, d, stage, skin, s));
  const m = 0.14;
  if (type === 'house') {
    const H = skin === 0 ? 8 : 10;
    B.box(0.05, 0.05, 0, w - 0.1, d - 0.1, 1.4, 0x8a847a, ({ sx, sy }) => hash2(sx, sy, 3) > 0.5 ? 0x9a948a : 0x8a847a);                // stone footing
    B.box(m, m, 1.4, w - 2 * m, d - 2 * m, H, WALL[skin], wallPaint(skin, s, { door: { u: 0.45, w: 0.4 }, window: skin >= 1, wear, ab, h: H }));
    if (skin === 0) roofLayers(B, -0.1, -0.1, w + 0.2, d + 0.2, 1.4 + H, 8, 0.12, thatch(s), 0xc8a860, o);
    else if (skin === 1) roofLayers(B, -0.12, -0.12, w + 0.24, d + 0.24, 1.4 + H, 7, 0.14, shingle(s, 0x7a5a40), 0x7a5a40, o);
    else { roofLayers(B, -0.12, -0.12, w + 0.24, d + 0.24, 1.4 + H, 7, 0.14, clay(s), 0xb0583c, o); B.box(1.45, 1.05, 1.4 + H + 3.5, 0.2, 0.2, 5, 0x8a5a48); }
    if (skin === 0 && wear < 2) B.box(0.9, 0.9, 1.4 + H + 12, 0.2, 0.2, 2, 0x3a2a20);                                                  // smoke hole
  } else if (type === 'shelter') {   // a hide tent over a ring of poles
    roofLayers(B, 0.05, 0.05, w - 0.1, d - 0.1, 0.5, 9, 0.105, hideP(s), 0x8a6a48, o);
    B.box(0.78, d - 0.22, 0.4, 0.44, 0.2, 4.5, 0x2a1e18);   // the doorway
    stake(B, w * 0.5, d * 0.5, 15, 5, 0x5a3e2a);
  } else if (type === 'storage') {
    for (const [px, py] of [[0.2, 0.2], [w - 0.2, 0.2], [0.2, d - 0.2], [w - 0.2, d - 0.2]]) stake(B, px, py, 0, 3.5, 0x6a4a30);        // raised on posts, dry and safe from vermin
    const H = 7; B.box(0.1, 0.1, 3.5, w - 0.2, d - 0.2, H, skin === 2 ? 0x9a948a : 0x9a7048, ({ face, sx, sy, z, u, v }) => (face === 0 ? 0x6a5a44 : skin === 2 ? ((Math.floor(z / 1.6) + Math.floor((face === 1 ? u : v) * 3)) & 1 ? 0xa39d92 : 0x8f897e) : ((Math.floor((face === 1 ? u : v) * 4)) & 1 ? 0x9a7048 : 0x8a6240)) );
    if (skin >= 1) B.box(0.55, d - 0.12, 3.5, 0.4, 0.1, 5.5, 0x3a2820);
    roofLayers(B, -0.1, -0.1, w + 0.2, d + 0.2, 3.5 + H, 6, 0.15, skin === 2 ? clay(s) : thatch(s, 0xbf9e58), skin === 2 ? 0xb0583c : 0xbf9e58, o);
  } else if (type === 'workshop') {
    B.box(0.05, 0.05, 0, w - 0.1, d - 0.1, 1, 0x7a6a50);
    for (const [px, py] of [[0.15, 0.15], [w - 0.15, 0.15], [0.15, d - 0.15], [w - 0.15, d - 0.15]]) stake(B, px, py, 1, 9, 0x6a4a30);
    B.box(0.12, 0.12, 1, w - 0.24, 0.12, 8, 0x8a6a48);                                       // back wall
    B.box(1.05, 0.55, 1, 0.5, 0.5, 2.6, 0x4a4a52); B.box(1.1, 0.6, 3.6, 0.4, 0.4, 1, 0x6a6a74);   // anvil
    B.box(0.3, 1.1, 1, 0.8, 0.4, 2.4, 0x9a7048); B.box(0.4, 1.12, 3.4, 0.6, 0.2, 0.5, 0xb8b0a0);    // bench with tools
    B.box(w - 0.55, 0.15, 1, 0.4, 0.4, 14, 0x8a847a, ({ sx, sy }) => hash2(sx, sy, 5) > 0.5 ? 0x9a948a : 0x7a746a);   // chimney
    roofLayers(B, -0.05, -0.05, w + 0.1, d + 0.1, 10, 5, 0.17, skin === 2 ? clay(s) : skin === 1 ? shingle(s, 0x7a5a40) : thatch(s, 0xbf9e58), skin === 2 ? 0xb0583c : skin === 1 ? 0x7a5a40 : 0xbf9e58, o);
  } else if (type === 'well') {
    const ring = ({ sx, sy, z }) => ((Math.floor(z / 1.5) + (sx >> 1)) & 1) ? 0x9a948a : 0x86807a;
    B.box(0.12, 0.12, 0, 0.76, 0.76, 4.2, 0x8f897e, ring); B.box(0.3, 0.3, 4.2, 0.4, 0.4, 0.1, 0x2a5a78);
    stake(B, 0.14, 0.14, 4.2, 9, 0x6a4a30); stake(B, 0.86, 0.86, 4.2, 9, 0x6a4a30); B.box(0.1, 0.1, 13.2, 0.8, 0.8, 1.2, 0x7a5638);
    roofLayers(B, 0.02, 0.02, 0.96, 0.96, 14.4, 3, 0.18, thatch(s), 0xbf9e58, o); B.box(0.45, 0.45, 8, 0.1, 0.1, 4, 0xc8b898);
  } else if (type === 'farm') {
    for (const [px, py] of [[0.1, 0.1], [w - 0.1, 0.1], [0.1, d - 0.1], [w - 0.1, d - 0.1]]) stake(B, px, py, 0, 3, 0x7a5638);
    if (wear < 2 && !ab) { stake(B, w / 2, d / 2, 0, 8, 0x7a5638); B.box(w / 2 - 0.2, d / 2 - 0.045, 5, 0.4, 0.09, 0.9, 0x7a5638); B.box(w / 2 - 0.12, d / 2 - 0.12, 8, 0.24, 0.24, 1.8, 0xd8c070); B.box(w / 2 - 0.16, d / 2 - 0.16, 9.8, 0.32, 0.32, 0.6, 0x6a4a30); }
  }
  return finishSprite(B);
}
function constructionSprite(B, type, w, d, stage, skin, s) {
  const H = type === 'house' ? 9.4 : type === 'shelter' ? 8 : type === 'storage' ? 10 : type === 'workshop' ? 10 : type === 'well' ? 6 : 3, wood = ({ sx, sy }) => hash2(sx, sy, 2) > 0.5 ? 0x9a7048 : 0x8a6240;
  const wc = [0xc9b48a, 0xe2d3b0, 0xe8dcc0][skin];
  if (type === 'farm') { for (const [px, py] of [[0.1, 0.1], [w - 0.1, 0.1], [0.1, d - 0.1], [w - 0.1, d - 0.1]]) stake(B, px, py, 0, 2 + stage); if (stage >= 2) B.box(0.4, 0.15, 0, w - 0.8, 0.1, 1.4, 0x7a5638); return B; }
  B.box(0.05, 0.05, 0, w - 0.1, d - 0.1, 1, 0x8a7a60, ({ sx, sy }) => hash2(sx, sy, 4) > 0.5 ? 0x9a8c70 : 0x8a7c60);       // the cleared plot and foundation stones
  if (stage === 0) { B.box(0.1, 0.1, 1, w - 0.2, 0.2, 1.2, 0x8a847a); B.box(0.1, d - 0.3, 1, w - 0.2, 0.2, 1.2, 0x9a948a); B.box(0.1, 0.3, 1, 0.2, d - 0.6, 1.2, 0x8a847a); B.box(w - 0.3, 0.3, 1, 0.2, d - 0.6, 1.2, 0x9a948a); B.box(w * 0.4, d * 0.5, 1, 0.5, 0.35, 1.8, 0xb09060, wood); return B; }
  const pts = [[0.12, 0.12], [w - 0.12, 0.12], [0.12, d - 0.12], [w - 0.12, d - 0.12]]; if (w > 1) pts.push([w / 2, 0.12], [w / 2, d - 0.12]);
  for (const [px, py] of pts) stake(B, px, py, 1, H + (stage === 1 ? 2 : 3), 0x8a6240);
  B.box(0.1, 0.1, 1 + H * 0.5, w - 0.2, 0.08, 0.8, 0x9a7048); B.box(0.1, d - 0.18, 1 + H * 0.5, w - 0.2, 0.08, 0.8, 0x9a7048);          // scaffold rails
  if (stage >= 2) B.box(0.14, 0.14, 1, w - 0.28, d - 0.28, H * (stage === 2 ? 0.55 : 1), wc, wallPaint(skin, s, { wear: 0, h: H }));
  if (stage >= 3) roofLayers(B, -0.1, -0.1, w + 0.2, d + 0.2, 1 + H, 3, 0.14, thatch(s), 0xc8a860, { wear: 0 });
  B.box(w - 0.1, d - 0.35, 1, 0.5, 0.3, 2, 0xb09060, wood); B.box(w - 0.05, d - 0.3, 3, 0.4, 0.25, 1.6, 0xc4a070, wood);            // lumber pile
  return B;
}

// ---------------------------------------------------------------- people, animals, small effects
const SKIN = [0xf0c8a0, 0xd8a878, 0xb88458, 0x8a5a38], HAIR = [0x2a1e18, 0x4a2e1e, 0x6a4a2a, 0x1e1a1a, 0x8a7a5a], CLOTH = [0x8a5a3a, 0x6a7a4a, 0xa08a58, 0x7a6a5a, 0x8a6a7a, 0x5a7a8a, 0xb07a4a];
export function personSprites(i) {
  const skin = SKIN[i % 4], hair = HAIR[(i * 3) % 5], shirt = CLOTH[(i * 5) % 7], leg = mix(shirt, 0x3a2a20, 0.55), out = [];
  for (let f = 0; f < 3; f++) {
    const P = Buf(9, 15), by = f === 1 ? 1 : 0;
    rect(P, 3, 1 + by, 5, 2 + by, hair); rect(P, 3, 3 + by, 5, 4 + by, skin); put(P, 4, 3 + by, mix(skin, 0x2a1e18, 0.1));
    rect(P, 3, 5 + by, 5, 9 + by, shirt); rect(P, 2, 6 + by, 2, 8 + by, mul(shirt, 0.85)); rect(P, 6, 6 + by, 6, 8 + by, mul(shirt, 0.85)); rect(P, 3, 9 + by, 5, 9 + by, mul(shirt, 0.7));
    if (f === 0) { rect(P, 3, 10, 3, 13, leg); rect(P, 5, 10, 5, 13, leg); } else if (f === 1) { rect(P, 3, 11, 3, 13, leg); rect(P, 5, 10, 5, 12, leg); put(P, 5, 13, mul(leg, 0.7)); } else { rect(P, 3, 10, 3, 12, leg); put(P, 3, 13, mul(leg, .7)); rect(P, 5, 11, 5, 13, leg); }
    outline(P); out.push(toCanvas(P));
  }
  return out;
}
export function deerSprite(f) { const P = Buf(18, 14), c = 0xa8784a, d = 0x7a5434, l = f ? 1 : -1;
  rect(P, 4, 4, 11, 7, c); rect(P, 4, 7, 11, 7, d); rect(P, 11, 2, 13, 5, c); rect(P, 13, 3, 14, 4, c); put(P, 14, 3, 0x2a1e18); rect(P, 12, 0, 12, 2, 0x8a6a44); put(P, 11, 0, 0x8a6a44); put(P, 13, 0, 0x8a6a44);
  for (const [x, dx] of [[5, l], [7, -l], [9, l], [11, -l]]) rect(P, x + dx, 8, x + dx, 12, d); put(P, 3, 4, 0xf4f0e8); put(P, 3, 5, 0xf4f0e8); outline(P); return toCanvas(P); }
export function birdSprite(f) { const P = Buf(9, 6); const w = f ? -1 : 1; rect(P, 3, 2, 5, 3, 0x3a3030); put(P, 2, 2 - w, 0x3a3030); put(P, 1, 2 - w * 2, 0x3a3030); put(P, 6, 2 - w, 0x3a3030); put(P, 7, 2 - w * 2, 0x3a3030); return toCanvas(P); }
export function glowSprite(r) { const c = document.createElement('canvas'); c.width = c.height = r * 2; const g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, 'rgba(255,200,110,0.9)'); gr.addColorStop(0.4, 'rgba(255,150,60,0.35)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c; }
