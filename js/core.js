'use strict';
// ===== Sài Gòn Lofi — core: math, colour, canvas helpers, isometric box baker, pixel font =====
const TAU = Math.PI * 2, T = 8, N = 160, WORLD = N * T;   // T = tile size in world units, N = tiles per side

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y) { let h = Math.imul(Math.floor(x), 0x27d4eb2d) ^ Math.imul(Math.floor(y), 0x165667b1); h = Math.imul(h ^ h >>> 15, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); return ((h ^ h >>> 16) >>> 0) / 4294967296; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
const rr = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rr(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function wpick(pairs) { let s = 0; for (const p of pairs) s += p[1]; let r = Math.random() * s; for (const p of pairs) { r -= p[1]; if (r <= 0) return p[0]; } return pairs[0][0]; }
// seeded variants
const sp = (R, a) => a[Math.floor(R() * a.length)];
const sr = (R, a, b) => a + R() * (b - a);
const si = (R, a, b) => Math.floor(a + R() * (b - a + 1));

// ----- colours are 0xRRGGBB ints -----
function mixc(a, b, t) { const ar = a >> 16 & 255, ag = a >> 8 & 255, ab = a & 255; return (Math.round(ar + ((b >> 16 & 255) - ar) * t) << 16) | (Math.round(ag + ((b >> 8 & 255) - ag) * t) << 8) | Math.round(ab + ((b & 255) - ab) * t); }
// art direction "Sài Gòn chiều": warm cream light, cocoa-brown ink, plum-brown shadows (from the reference sprite)
const C_LIGHT = 0xfff1d6, C_DARK = 0x3a221c, INK = 0x2b1a16, SHADOW = 0x6a3f45;
function shade(c, f) { return f > 0 ? mixc(c, C_LIGHT, f) : f < 0 ? mixc(c, C_DARK, -f) : c; }
// colour grade: pull every flat colour toward the warm reference ramp (keeps the hue, softens neon, warms greys)
const RAMP = [0x281a15, 0x48302c, 0x6e463a, 0x95523e, 0xc9845a, 0xe8b07a, 0xf7d9af, 0xfff4e2];
const _grade = new Map();
function grade(c) {
  let g = _grade.get(c); if (g !== undefined) return g;
  const r = c >> 16 & 255, gg = c >> 8 & 255, b = c & 255, l = (r * 0.3 + gg * 0.55 + b * 0.15) / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), sat = mx ? (mx - mn) / mx : 0;
  const f = l * (RAMP.length - 1), i = Math.min(RAMP.length - 2, Math.floor(f)), warm = mixc(RAMP[i], RAMP[i + 1], f - i);
  g = mixc(c, warm, 0.2 + (1 - sat) * 0.18); _grade.set(c, g); return g;
}
function css(c) { return '#' + (0x1000000 | c).toString(16).slice(1); }
function rgba(c, a) { return 'rgba(' + (c >> 16 & 255) + ',' + (c >> 8 & 255) + ',' + (c & 255) + ',' + a + ')'; }

// ----- art resolution: every sprite is drawn at K art pixels per world unit; logic stays in world units -----
const K = 2;
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
// Scale2x (EPX) for the few hand-drawn 1x bitmaps (icons, dogs): keeps diagonals smooth at the new density
function scale2x(g, w, h) {
  const o = new Int32Array(w * h * 4), at = (x, y) => g[clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1); let p1 = P, p2 = P, p3 = P, p4 = P;
    if (C === A && C !== D && A !== B) p1 = A; if (A === B && A !== C && B !== D) p2 = B; if (D === C && D !== B && C !== A) p3 = C; if (B === D && B !== A && D !== C) p4 = D;
    const W = w * 2, i = y * 2 * W + x * 2; o[i] = p1; o[i + 1] = p2; o[i + W] = p3; o[i + W + 1] = p4;
  }
  return o;
}
// int grid (-1 = empty) -> canvas (+ black silhouette for the light pass). k = art pixels per world unit of the grid.
// returned w / h are in world units (canvas pixels / K), so callers draw with drawImage(c, x, y, w, h).
function gridCanvas(grid, w, h, emis, k) {
  if ((k || 1) === 1) { grid = scale2x(grid, w, h); if (emis) emis = scale2x(emis, w, h); w *= 2; h *= 2; }
  const c = mk(w, h), e = mk(w, h), id = new ImageData(w, h), ie = new ImageData(w, h), a = id.data, b = ie.data;
  for (let i = 0; i < w * h; i++) { const v = grid[i]; if (v < 0) continue; const k = i * 4; a[k] = v >> 16 & 255; a[k + 1] = v >> 8 & 255; a[k + 2] = v & 255; a[k + 3] = 255; b[k + 3] = 255; const m = emis ? emis[i] : 0; if (m) { b[k] = m >> 16 & 255; b[k + 1] = m >> 8 & 255; b[k + 2] = m & 255; } }
  c.getContext('2d').putImageData(id, 0, 0); e.getContext('2d').putImageData(ie, 0, 0); return { c, e, w: w / K, h: h / K };
}
// ink a grid: 1px cocoa outline around the silhouette (grid must have a 1px empty margin)
function inkGrid(g, w, h, amt) {
  const o = g.slice(); amt = amt === undefined ? 0.82 : amt;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (g[y * w + x] >= 0) continue; let n = -1; if (x > 0 && g[y * w + x - 1] >= 0) n = g[y * w + x - 1]; else if (x < w - 1 && g[y * w + x + 1] >= 0) n = g[y * w + x + 1]; else if (y > 0 && g[(y - 1) * w + x] >= 0) n = g[(y - 1) * w + x]; else if (y < h - 1 && g[(y + 1) * w + x] >= 0) n = g[(y + 1) * w + x]; if (n >= 0) o[y * w + x] = mixc(n, INK, amt); }
  return o;
}
const dI = (g, c, x, y) => g.drawImage(c, x, y, c.width / K, c.height / K);   // draw a K-resolution canvas at world-unit coordinates
// bitmap from text rows + palette {char: int}
function bmpGrid(rows, pal) { const h = rows.length, w = rows[0].length, g = new Int32Array(w * h).fill(-1); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = rows[y][x]; if (ch !== '.' && pal[ch] !== undefined) g[y * w + x] = pal[ch]; } return gridCanvas(g, w, h); }

// ----- 3x5 pixel font (signs) -----
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
  '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110',
  ' ': '000000000000000', '-': '000000111000000', '.': '000000000000010', '+': '000010111010000'
};
const textW = s => s.length * 4 - 1;
// is the pixel (u from left, v from bottom) lit for string s
function textAt(s, u, v) { u = Math.floor(u); v = Math.floor(v); if (v < 0 || v > 4 || u < 0) return false; const ci = (u / 4) | 0, cx = u % 4; if (cx === 3 || ci >= s.length) return false; const g = FONT[s[ci]]; return !!g && g[(4 - v) * 3 + cx] === '1'; }

// ===== isometric projection =====
// scene x = wx - wy ; scene y = (wx + wy) / 2 - wz
const isoX = (x, y) => x - y, isoY = (x, y, z) => (x + y) / 2 - (z || 0);

// ===== box baker =====
// box: {x,y,z,w,d,h, c, p?(face,u,v,box,wx,wy)->colour | -1 hole | undefined, em?, raw?, ns? (no snow), nf? (ignore for footprint)}
// faces: 0 top, 1 left (+y side), 2 right (+x side). u runs left->right on screen, v = height above the box base (top: u,v = local x,y)
let EM = 0;                                          // painters set EM to make the current pixel glow at night
function snowAt(wx, wy) { const v = vnoise(wx / 5 + 3.1, wy / 5 + 11.7); return v > 0.58 || (v > 0.47 && hash2(wx * 2, wy * 2) > 0.55); }   // light, patchy snow
function bake(boxes, o) {
  o = o || {};
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, fx0 = 1e9, fy0 = 1e9, fx1 = -1e9, fy1 = -1e9;
  for (const b of boxes) {
    x0 = Math.min(x0, b.x - b.y - b.d); x1 = Math.max(x1, b.x + b.w - b.y);
    y0 = Math.min(y0, (b.x + b.y) / 2 - b.z - b.h); y1 = Math.max(y1, (b.x + b.w + b.y + b.d) / 2 - b.z);
    if (!b.nf) { fx0 = Math.min(fx0, b.x); fy0 = Math.min(fy0, b.y); fx1 = Math.max(fx1, b.x + b.w); fy1 = Math.max(fy1, b.y + b.d); }
  }
  // work in art pixels (K per world unit) with a 2px margin for the ink outline
  const X0 = Math.floor(x0 * K) - 2, Y0 = Math.floor(y0 * K) - 2, w = Math.ceil(x1 * K) - X0 + 2, h = Math.ceil(y1 * K) - Y0 + 2, n = w * h;
  const col = new Int32Array(n).fill(-1), dep = new Float32Array(n).fill(-1e9), em = new Int32Array(n), fid = new Int32Array(n).fill(-1);
  const nx = o.slice ? Math.max(1, Math.round((fx1 - fx0) / o.slice)) : 1, ny = o.slice ? Math.max(1, Math.round((fy1 - fy0) / o.slice)) : 1;
  const cw = (fx1 - fx0) / nx, cd = (fy1 - fy0) / ny, cell = nx * ny > 1 ? new Uint8Array(n) : null;
  const snow = o.snow, sox = o.ox || 0, soy = o.oy || 0;
  for (let bi = 0; bi < boxes.length; bi++) {
    const b = boxes[bi], X1 = b.x + b.w, Y1 = b.y + b.d, Z1 = b.z + b.h, p = b.p, bc = b.c;
    for (let f = 0; f < 3; f++) {
      let pa, pb, qa, qb;
      if (f === 0) { pa = b.x - Y1; pb = X1 - b.y; qa = (b.x + b.y) / 2 - Z1; qb = (X1 + Y1) / 2 - Z1; }
      else if (f === 1) { pa = b.x - Y1; pb = X1 - Y1; qa = (b.x + Y1) / 2 - Z1; qb = (X1 + Y1) / 2 - b.z; }
      else { pa = X1 - Y1; pb = X1 - b.y; qa = (X1 + b.y) / 2 - Z1; qb = (X1 + Y1) / 2 - b.z; }
      const px0 = Math.max(0, Math.floor(pa * K) - X0), px1 = Math.min(w, Math.ceil(pb * K) - X0), py0 = Math.max(0, Math.floor(qa * K) - Y0), py1 = Math.min(h, Math.ceil(qb * K) - Y0);
      for (let py = py0; py < py1; py++) for (let px = px0; px < px1; px++) {
        const sx = (px + X0 + 0.5) / K, sy = (py + Y0 + 0.5) / K; let wx, wy, wz, u, v;
        if (f === 0) { const s = 2 * (sy + Z1); wx = (s + sx) / 2; wy = (s - sx) / 2; if (wx < b.x || wx >= X1 || wy < b.y || wy >= Y1) continue; wz = Z1; u = wx - b.x; v = wy - b.y; }
        else if (f === 1) { wx = sx + Y1; wy = Y1; wz = (wx + Y1) / 2 - sy; if (wx < b.x || wx >= X1 || wz < b.z || wz >= Z1) continue; u = wx - b.x; v = wz - b.z; }
        else { wy = X1 - sx; wx = X1; wz = (X1 + wy) / 2 - sy; if (wy < b.y || wy >= Y1 || wz < b.z || wz >= Z1) continue; u = Y1 - wy; v = wz - b.z; }
        const i = py * w + px, d = wx + wy + wz; if (d <= dep[i]) continue;
        EM = b.em || 0; let c = p ? p(f, u, v, b, wx, wy) : bc; if (c === undefined) c = bc; if (c < 0) continue;
        if (f === 0 && snow && !b.ns && snowAt(wx + sox, wy + soy)) { c = hash2(wx + sox, wy + soy) > 0.72 ? 0xdde4f0 : 0xf6f4f2; EM = 0; }
        else if (!b.raw) {
          c = grade(c);
          if (f === 0) c = mixc(c, C_LIGHT, 0.16);                                                       // sunlit tops
          else if (f === 2) c = mixc(c, SHADOW, 0.3);                                                    // plum-brown shade side
          if (f !== 0 && v < 1.2 && b.z < 0.5) c = mixc(c, SHADOW, 0.18 * (1.2 - v));                   // contact shadow at the ground
          if (f !== 0 && v >= b.h - 0.5 && b.h > 1.5) c = mixc(c, C_LIGHT, f === 1 ? 0.18 : 0.08);        // lit top lip
        }
        dep[i] = d; col[i] = c; em[i] = EM; fid[i] = bi * 3 + f;
        if (cell) cell[i] = clamp(Math.floor((wx - 1e-3 - fx0) / cw), 0, nx - 1) + nx * clamp(Math.floor((wy - 1e-3 - fy0) / cd), 0, ny - 1);
      }
    }
  }
  // hand-drawn look: crease lines where boxes meet, and a cocoa outline around the whole silhouette
  if (!o.noInk) {
    const c2 = col.slice();
    for (let y = 1; y < h; y++) for (let x = 1; x < w; x++) {
      const i = y * w + x; if (col[i] < 0) continue;
      for (const j of [i - 1, i - w]) { if (col[j] < 0 || fid[j] === fid[i]) continue; const sameBox = (fid[j] / 3 | 0) === (fid[i] / 3 | 0); if (sameBox) { if (fid[i] % 3 === 0 || fid[j] % 3 === 0) c2[i] = mixc(col[i], INK, 0.18); } else if (Math.abs(dep[j] - dep[i]) > 1.6) c2[i] = mixc(col[i], INK, dep[j] > dep[i] ? 0.62 : 0.4); }
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (col[i] >= 0) continue; let j = -1;
      if (x > 0 && col[i - 1] >= 0) j = i - 1; else if (x < w - 1 && col[i + 1] >= 0) j = i + 1; else if (y > 0 && col[i - w] >= 0) j = i - w; else if (y < h - 1 && col[i + w] >= 0) j = i + w;
      if (j >= 0) { c2[i] = mixc(col[j], INK, 0.85); dep[i] = dep[j]; em[i] = 0; if (cell) cell[i] = cell[j]; }
    }
    col.set(c2);
  }
  const out = [];
  for (let k = 0; k < nx * ny; k++) {
    let ax0 = w, ax1 = -1, ay0 = h, ay1 = -1;
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) if (col[i] >= 0 && (!cell || cell[i] === k)) { if (x < ax0) ax0 = x; if (x > ax1) ax1 = x; if (y < ay0) ay0 = y; if (y > ay1) ay1 = y; }
    if (ax1 < 0) continue;
    const sw = ax1 - ax0 + 1, sh = ay1 - ay0 + 1, g = new Int32Array(sw * sh).fill(-1), ge = new Int32Array(sw * sh);
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { const i = (y + ay0) * w + x + ax0; if (col[i] >= 0 && (!cell || cell[i] === k)) { g[y * sw + x] = col[i]; ge[y * sw + x] = em[i]; } }
    const s = gridCanvas(g, sw, sh, ge, K);
    s.ax = -(X0 + ax0) / K; s.ay = -(Y0 + ay0) / K; s.key = fx0 + (k % nx) * cw + fy0 + Math.floor(k / nx) * cd + (cw + cd) / 2;
    out.push(s);
  }
  return o.slice ? out : out[0];
}
// swap x/y of a box list (a +y-facing building becomes +x-facing; text still reads left to right)
function mirrorBoxes(boxes) {
  return boxes.map(b => { const m = Object.assign({}, b, { x: b.y, y: b.x, w: b.d, d: b.w }); if (b.p) m.p = (f, u, v, bb, wx, wy) => b.p(f === 0 ? 0 : 3 - f, f === 0 ? v : u, f === 0 ? u : v, b, wy, wx); return m; });
}
const box = (x, y, z, w, d, h, c, p, extra) => Object.assign({ x, y, z, w, d, h, c, p }, extra);
