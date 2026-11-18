'use strict';
// ===== Holdfast art pilot (design only) =====
// Built ON SaigonLofi's art system (js/core.js bake/grade/ink, js/art.js drawPerson/treeSprite/shadowSprite), loaded read-only.
// Holdfast adds: suburban clapboard houses, shingle roofs, improvised wall panels, a sniper tower, zombie + guard looks
// (through drawPerson's costume hooks), post-apocalyptic ground and props.  World units: 1 unit = K = 2 art px, as in Saigon.
const Q = new URLSearchParams(location.search), MODE = Q.get('t') || 'dusk';
const SW = +(Q.get('w') || 1120), SH = +(Q.get('h') || 630);          // art px == screen px at Saigon's 1080p default
const X0 = +(Q.get('x0') || -236), Y0 = +(Q.get('y0') || 112);         // top-left of the view in iso screen units
const cv = document.getElementById('c'); cv.width = SW; cv.height = SH; cv.style.width = SW + 'px'; cv.style.height = SH + 'px';
const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
const R = mulberry32(2026);
const rnd = (a, b) => a + R() * (b - a);
const P = (x, y, z) => [x - y, (x + y) / 2 - (z || 0)];                 // world -> iso screen units
const DRAW = [];                                                       // {d: depth, f: draw fn}
const LIGHTS = [];                                                     // extra glow halos [sx, sy, r, color, a]
const SHAD = [];                                                       // cast-shadow polygons in iso units
const WALL_Y = 288, MESHX = []; let WEAKX = 0;

// ---------------------------------------------------------------- palettes
const INKc = 0x2b1a16;
const WOOD = 0x9a6a44, WOOD_D = 0x6e4a32, WOOD_L = 0xc49a64, RUST = 0x9a4a2a, GALV = 0x9aa0a4, CONC = 0xa8a294;
const TRIM = 0xf0ead8;

// ---------------------------------------------------------------- painters
const hs = (a, b) => hash2(a * 13.1 + 7, b * 7.3 + 3);
function sidingP(S) {
  return (f, u, v, b, wx, wy) => {
    if (f === 0) return 0x7a6e62;
    const W = f === 1 ? b.w : b.d;
    if (u < 0.9 || u > W - 0.9) return v < 1 ? mixc(S.trim, 0x4a3a30, 0.25) : S.trim;                 // corner boards
    if (S.band && Math.abs(v - S.band) < 0.55) return S.trim;                                          // floor band
    for (const w of (S.wins[f] || [])) if (u >= w.u && u < w.u + w.w && v >= w.v && v < w.v + w.h) return winPix(w, u - w.u, v - w.v, S);
    const dr = S.door; if (dr && dr.f === f && u >= dr.u && u < dr.u + dr.w && v < dr.h) return doorPix(dr, u - dr.u, v, S);
    if (S.sign && S.sign.f === f) { const sg = S.sign; if (u >= sg.u && u < sg.u + textW(sg.t) + 2 && v >= sg.v - 1 && v < sg.v + 6) { if (textAt(sg.t, u - sg.u - 1, v - sg.v)) return sg.c; } }
    const row = Math.floor(v / 2.2), fr = v - row * 2.2;
    let c = S.wall;
    if (fr < 0.5) c = mixc(c, 0x3a2430, 0.26); else if (fr > 1.75) c = mixc(c, 0xfff1d6, 0.12);         // clapboard lap shadow / lit edge
    if (hs(row * 3 + f, Math.floor(u / 9) + S.seed) > 0.8) c = mixc(c, 0x8a7a6a, 0.08);                 // board-to-board tone
    const st = vnoise(u / 3.2 + S.seed, v / 8 + f * 5); if (st > 0.64) c = mixc(c, 0x6a5a4c, Math.min(0.32, (st - 0.64) * 1.3));   // weather stains
    for (const w of (S.wins[f] || [])) if (u > w.u + 0.6 && u < w.u + w.w - 0.6 && v < w.v && v > w.v - 5 && vnoise(u * 1.7, S.seed) > 0.55) c = mixc(c, 0x5a4a40, 0.22 * (1 - (w.v - v) / 5));  // drip streaks under sills
    if (v < 3) c = mixc(c, 0x4a3828, (3 - v) / 3 * 0.38);                                              // splash grime at the base
    if (hs(Math.floor(u * 2) + S.seed, Math.floor(v * 2)) > 0.986) c = mixc(c, 0xb08a64, 0.55);       // peeled paint
    return c;
  };
}
function winPix(w, x, y, S) {
  const fr = 0.7, W = w.w, H = w.h;
  if (y < 0.6) return mixc(S.trim, 0x3a2a30, 0.3);                                                   // sill shadow
  if (x < fr || x > W - fr || y > H - fr || y < fr + 0.4) return S.trim;
  if (w.k === 'board') {
    const pl = Math.floor((y - 1) / 1.6), py = (y - 1) - pl * 1.6, c0 = [0xb08654, 0x9a7044, 0xc09464, 0xa47a4a][(pl + S.seed | 0) % 4];
    if (py < 0.35) return 0x2e2228;
    if ((Math.abs(x - 1.4) < 0.35 || Math.abs(x - (W - 1.4)) < 0.35) && py > 0.6 && py < 1.0) return 0x5a5050;
    if (w.t && textAt(w.t, x - 1.2, y - 2.2)) return w.tc || 0xd2382e;
    return vnoise(x * 2 + pl, y / 3) > 0.6 ? mixc(c0, 0x6a4a30, 0.25) : c0;
  }
  if (Math.abs(x - W / 2) < 0.35 || Math.abs(y - H * 0.55) < 0.3) return S.trim;                      // mullions
  if (w.k === 'broken') {
    const cx = W * 0.4, cy = H * 0.45, d = Math.hypot((x - cx) * 1.2, y - cy) + (hs(x * 4, y * 4) - 0.5) * 1.4;
    if (d < 1.9) return 0x161218;
    if (Math.abs((x - cx) * 0.8 - (y - cy)) < 0.2 || Math.abs((x - cx) + (y - cy) * 0.6) < 0.2) return 0xb8c4cc;
  }
  if (w.cur && (x < W * 0.3 || x > W * 0.7)) { const c = (x * 2 | 0) % 2 ? w.cur : mixc(w.cur, 0x3a2430, 0.2); if (w.lit) EM = mixc(0xffc870, 0, 0.35); return c; }
  if (w.lit) { EM = 0xffd38a; return (x + y * 0.5) % 3 < 0.5 ? 0xffe6b0 : 0xf2c06a; }
  const gl = (x - y + 20) % 5; return gl < 0.7 ? 0x8aa0b4 : y > H - 1.8 ? 0x2e3646 : 0x404c60;
}
function doorPix(dr, x, v, S) {
  const W = dr.w;
  if (x < 0.6 || x > W - 0.6 || v > dr.h - 0.6) return S.trim;
  if (dr.k === 'ply') { if (Math.abs((x - 1) - (v - 1) * (W - 2) / (dr.h - 2)) < 0.45 || Math.abs((W - 1 - x) - (v - 1) * (W - 2) / (dr.h - 2)) < 0.45) return 0xd2382e; return vnoise(x * 2, v / 3) > 0.6 ? 0xa47a4a : 0xb48a58; }
  if (Math.abs(x - (W - 1.6)) < 0.4 && Math.abs(v - 8) < 0.5) return 0xe0b450;                      // knob
  const px = x < W / 2 ? 0 : 1, pv = v < dr.h * 0.5 ? 0 : 1, ix = (x % (W / 2)), iv = v % (dr.h * 0.5);
  const inset = ix > 0.9 && ix < W / 2 - 0.5 && iv > 1.1 && iv < dr.h * 0.5 - 1;
  return inset ? mixc(dr.c, 0x2b1a16, 0.18) : dr.c;
}
function shingleP(c0, seed) {
  return (f, u, v, b, wx, wy) => {
    if (f === 2) { const S = b.gable; if (S) { if (v > b.h - 0.7) return S.trim; return sidingP(S)(1, u + 40, v + b.z - S.z0, { w: 200, d: 200, h: 200 }, wx, wy); } return mixc(c0, INKc, 0.3); }
    const k = b.k || 0, tab = 2.6, off = (k % 2) * 1.3, uu = (f === 0 ? u : u) + off, ti = Math.floor(uu / tab), tu = uu - ti * tab;
    let c = c0;
    const t = hs(ti + seed, k * 5 + f);
    c = t < 0.25 ? mixc(c, 0x2b1a16, 0.16) : t > 0.82 ? mixc(c, 0xfff1d6, 0.10) : c;
    if (tu < 0.35) c = mixc(c, 0x2b1a16, 0.34);                                                         // tab gaps
    if (f === 1 && v < 0.55) c = mixc(c, 0x2b1a16, 0.42);                                               // course shadow
    if (f === 0 && v > b.d - 0.5) c = mixc(c, 0x2b1a16, 0.2);
    const m = vnoise(wx / 5 + seed, wy / 4 + k * 0.3); if (m > 0.66) c = mixc(c, 0x6e7c44, Math.min(0.55, (m - 0.66) * 2));   // moss
    if (t > 0.975) c = 0x2a2426;                                                                         // missing shingle
    return c;
  };
}
const brickP = (f, u, v) => { if (f === 0) return 0x5a4a44; const row = Math.floor(v), off = (row % 2) * 1.1; if (v - row < 0.28 || ((u + off) % 2.2) < 0.3) return 0xb4a494; const h = hs(Math.floor((u + off) / 2.2), row); return h < 0.3 ? 0x8a4434 : h > 0.8 ? 0xb0624a : 0x9e5040; };
function corrP(c, rust, seed) {
  return (f, u, v, b, wx, wy) => {
    if (f === 0) return mixc(c, INKc, 0.25);
    const k = (u * 1.3 + 10) % 1;
    let col = k < 0.32 ? mixc(c, 0xfff1d6, 0.2) : k > 0.72 ? mixc(c, 0x2b1a16, 0.24) : c;
    const r = vnoise(u / 1.6 + seed, v / 5.5 + seed); if (r > 0.62 - rust * 0.28) col = mixc(col, RUST, Math.min(0.85, (r - 0.62 + rust * 0.28) * 2.4));
    if (v < 2.2) col = mixc(col, 0x6a3a24, 0.35 * rust + 0.1);
    if ((Math.abs(v - 1.8) < 0.3 || Math.abs(v - (b.h - 1.8)) < 0.3) && (u % 3.2) < 0.5) col = 0x3a2e2c;   // bolt rows
    if (b.spray && textAt(b.spray, u - 2, v - b.h * 0.45)) col = b.sprayC || 0xe8e2d4;
    return col;
  };
}
function plyP(seed, spray, sprayC) {
  return (f, u, v, b) => {
    if (f === 0) return 0x8a6a44;
    let c = vnoise(u / 6 + seed, v * 1.3) > 0.55 ? 0xb48a56 : 0xc49a64;
    if (vnoise(u * 0.8 + seed, v * 3) > 0.72) c = 0x9a7446;
    if (u < 0.5 || u > (f === 1 ? b.w : b.d) - 0.5) c = 0x7a5634;
    if ((u % 4) < 0.45 && (Math.abs(v - 2) < 0.4 || Math.abs(v - b.h + 2) < 0.4)) c = 0x4a4040;
    if (v < 2.5) c = mixc(c, 0x5a3a24, 0.3);
    if (spray && textAt(spray, u - 1.5, v - b.h * 0.42)) c = sprayC || 0xd2382e;
    return c;
  };
}
const palletP = (f, u, v, b) => { if (f === 0) return WOOD; const sl = Math.floor(v / 2.4), fr = v - sl * 2.4; if (fr > 1.7) return -1; const W = f === 1 ? b.w : b.d; if (u < 1 || u > W - 1 || Math.abs(u - W / 2) < 0.6) return 0x7a5636; return [0xa8804e, 0x9a7044, 0xb89062][sl % 3]; };
const meshP = (f, u, v, b) => { if (f === 0) return 0x7a8288; const W = f === 1 ? b.w : b.d; if (u < 0.7 || u > W - 0.7 || v > b.h - 0.7) return 0x6a7278; const a = (u + v) % 3, c = (u - v + 40) % 3; return a < 0.5 || c < 0.5 ? (vnoise(u, v / 3) > 0.62 ? 0x8a5a3e : 0x666c72) : -1; };
const carDoorP = (c) => (f, u, v, b) => { if (f === 0) return mixc(c, INKc, 0.3); const W = f === 1 ? b.w : b.d; if (v > 8.5 && v < b.h - 1 && u > 1.2 && u < W - 1.2) return meshP(1, u, v, { w: 99, h: 99 }); if (Math.abs(v - 5) < 0.3 && u > W - 3 && u < W - 1.5) return 0x2a2426; let k = c; const r = vnoise(u / 2.3, v / 3); if (r > 0.6) k = mixc(k, RUST, (r - 0.6) * 2); if (v < 1.2 || u < 0.6) k = mixc(k, INKc, 0.3); return k; };
const sandP = (f, u, v, b) => { const W = f === 0 ? b.w : f === 1 ? b.w : b.d; const e = Math.min(u, W - u, f === 0 ? Math.min(v, b.d - v) : Math.min(v, b.h - v)); let c = e < 0.4 ? 0x7e6a48 : 0xb8a47c; if (hs(u * 3, v * 3 + f) > 0.82) c = 0xa8946c; if (f === 0 && e > 0.9) c = mixc(c, 0xfff1d6, 0.12); return c; };
const plankP = (f, u, v, b) => { if (f === 0) { const k = (b.along === 'y' ? u : v) % 2; return k < 0.3 ? 0x5a3e2a : hs(Math.floor((b.along === 'y' ? u : v) / 2), 3) > 0.5 ? 0xa87a4c : 0x9a6e44; } return v < 0.6 ? 0x5a3e2a : 0x8a5e3a; };
const woodP = (f, u, v) => (f === 0 ? WOOD_L : vnoise(u * 2, v / 3) > 0.58 ? WOOD_D : WOOD);
const soilBedP = (crop) => (f, u, v, b, wx, wy) => { if (f !== 0) return v > b.h - 0.6 ? 0x8a6a44 : vnoise(u, v) > 0.5 ? 0x8a5e3a : 0x7a5232; const row = (v % 3); if (row < 1.1) return hs(wx * 2, wy * 2) > 0.5 ? 0x5a3e2a : 0x4e3424; const h = hs(Math.floor(wx * 1.4), Math.floor(wy * 1.4)); return h < 0.18 ? -1 : h < 0.5 ? crop[0] : h < 0.85 ? crop[1] : crop[2]; };

// ---------------------------------------------------------------- scene helpers
function addBake(ox, oy, boxes, extraDepth, opt) {
  const s = bake(boxes, opt);
  const p = P(ox, oy);
  DRAW.push({ d: ox + oy + s.key + (extraDepth || 0), f: (G, Lg) => { G.drawImage(s.c, p[0] - s.ax, p[1] - s.ay, s.w, s.h); Lg.drawImage(s.e, p[0] - s.ax, p[1] - s.ay, s.w, s.h); } });
  return s;
}
function castShadow(x, y, w, d, h, z) {          // sun from the upper-left: shadows fall toward +x (screen right-down)
  const k = h * 0.85, a = [x, y], b = [x + w, y], c = [x + w, y + d], e = [x, y + d];
  const pts = [a, b, c, e, [b[0] + k, b[1] - k * 0.25], [c[0] + k, c[1] - k * 0.25], [e[0] + k, e[1] - k * 0.25]].map(q => P(q[0], q[1], z || 0));
  SHAD.push(hull(pts));
}
function hull(pts) { pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = []; for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of pts.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); }
function blob(x, y, r) { const s = shadowSprite(r), p = P(x, y); DRAW.push({ d: -1e6, f: G => G.drawImage(s, p[0] - s.width / K / 2, p[1] - s.height / K / 2, s.width / K, s.height / K) }); }

// ---------------------------------------------------------------- people (Saigon drawPerson + Holdfast costume hooks)
// drawPerson calls these ev* hooks only when L.ev is set; Holdfast uses them for zombies, guards and work tools.
function evBehind(X) { if (X.L.ev === 'scav' && !X.back) { const c = grade(0x6a5a3a); X.rect(X.cx - 9, X.torsoTop, X.cx - 6, X.legTop + 1, c, 0, X.cx - 7, clothSh(c)); } }
function evTorso(X) {
  const L = X.L, { rect, put, cx, torsoTop: tt, legTop: lt } = X;
  if (L.ev === 'zombie') {                                              // torn, filthy clothes (no gore)
    for (let y = tt + 2; y < lt + 1; y++) for (let x = cx - 6; x <= cx + 6; x++) {
      const h = hash2(x * 3 + L.seed, y * 5);
      if (h < 0.1) put(x, y, x >= cx + 3 ? X.sS : X.skin, 5);
      else if (h > 0.86) put(x, y, mixc(X.top, 0x2b1a16, 0.35), 5);
    }
    for (let x = cx - 6; x <= cx + 6; x++) if (hash2(x + L.seed, 9) < 0.45) put(x, lt, -1, 5);   // ragged hem
  }
  if (L.ev === 'guard') { const v = grade(0x4e5a3e); rect(cx - 5, tt + 1, cx + 5, lt - 1, v, 6, cx + 3, clothSh(v)); rect(cx - 4, lt - 4, cx - 2, lt - 2, grade(0x3a4430), 6); rect(cx + 1, lt - 4, cx + 3, lt - 2, grade(0x3a4430), 6); rect(cx - 5, lt - 1, cx + 6, lt - 1, grade(0x2e2a24), 6); }
  if (L.ev === 'builder') { const v = grade(0xe8b83a); rect(cx - 5, tt + 1, cx - 3, lt - 1, v, 6); rect(cx + 2, tt + 1, cx + 4, lt - 1, v, 6, cx + 4, clothSh(v)); rect(cx - 5, tt + 5, cx + 4, tt + 5, grade(0xf4f1e8), 6); rect(cx - 6, lt - 1, cx + 6, lt, grade(0x5a3a24), 6); }
  if (L.ev === 'scav' && X.back) { const c = grade(0x6a5a3a); rect(cx - 5, tt + 1, cx + 5, lt - 1, c, 7, cx + 3, clothSh(c)); rect(cx - 4, tt + 3, cx + 4, tt + 4, grade(0x4a3e2a), 7); }
}
function evFace(X, ex1, ex2, ey, eh) {
  const L = X.L, { rect, put, cx } = X;
  if (L.ev === 'zombie') {
    for (let y = 0; y < X.H; y++) for (let x = 0; x < X.W; x++) { const i = y * X.W + x, c = X.col[i]; if (c === X.skin) X.col[i] = 0x9aae8c; else if (c === X.sS) X.col[i] = 0x6e8470; }
    rect(ex1 - 1, ey - 1, ex1 + 2, ey + eh, 0x3e3438, 10); rect(ex2 - 1, ey - 1, ex2 + 2, ey + eh, 0x3e3438, 10);
    put(ex1, ey + 1, 0xd8d4a0, 11); put(ex2 + 1, ey + 1, 0xd8d4a0, 11);                                // pale pin-prick eyes
    rect(cx + 1, ey + eh + 1, cx + 4, ey + eh + 3, 0x3a2024, 11); put(cx + 2, ey + eh + 1, 0xe8e0c8, 11);   // slack mouth
  }
  if (L.ev === 'spotter') { rect(ex1 - 2, ey - 1, ex2 + 3, ey + 2, 0x2a2628, 11); put(ex1, ey, 0x8ab0c8, 12); put(ex2 + 1, ey, 0x8ab0c8, 12); }
}
function evHat() {}
function evCarry() {}
function evOver(X, hx, hy, raise) {
  const L = X.L, { rect, put, cx, torsoTop: tt, legTop: lt, back } = X;
  if (L.ev === 'zombie' && !raise) {                                    // the back arm reaches forward too
    const a = X.skin, s = X.sS; for (let x = cx - 3; x <= cx + 9; x++) { put(x, tt + 4, a, 14); put(x, tt + 5, x > cx + 5 ? s : a, 14); }
    rect(cx + 10, tt + 3, cx + 11, tt + 6, a, 14, cx + 11, s);
  }
  if (L.gun) {                                                          // rifle: wood stock + dark barrel
    const M = 0x2e2c30, Wd = grade(0x7a5234);
    if (L.gun === 'aim') { for (let i = 0; i < 17; i++) { const x = cx + 6 - i, y = tt + 3 - Math.round(i * 0.42); put(x, y, i < 6 ? Wd : M, 15); if (i < 12) put(x, y + 1, i < 6 ? clothSh(Wd) : 0x48464c, 15); } }
    else if (L.gun === 'sling') { for (let i = 0; i < 15; i++) { const x = cx - 6 + Math.round(i * 0.8), y = lt + 1 - i; put(x, y, i < 5 ? Wd : M, back ? 0 : 15); } }
    else { for (let i = 0; i < 16; i++) { const x = cx - 5 + i, y = lt - 1 - Math.round(i * 0.45); put(x, y, i < 6 ? Wd : M, 15); put(x, y + 1, i < 6 ? clothSh(Wd) : 0x48464c, 15); } }
  }
  if (L.tool === 'hammer' && raise) { const x0 = cx + 6, y0 = tt - 12; rect(x0, y0 - 6, x0 + 1, y0, grade(0x8a5a34), 15); rect(x0 - 2, y0 - 8, x0 + 3, y0 - 6, 0x5a5a62, 15, x0 + 2, 0x3a3a40); }
  if (L.tool === 'hoe') { for (let i = 0; i < 22; i++) put(hx + 1 + Math.round(i * 0.45), hy - 9 + i, grade(0x8a5a34), 15); rect(hx + 9, hy + 11, hx + 13, hy + 12, 0x5a5a62, 15); }
  if (L.tool === 'plank') { rect(0, tt - 4, X.W - 1, tt - 2, grade(0xc49a64), 15, X.W - 6, grade(0x9a7446)); put(3, tt - 3, 0x4a4040, 15); put(X.W - 4, tt - 3, 0x4a4040, 15); }
  if (L.tool === 'cloth' && raise) rect(cx + 2, tt - 14, cx + 9, tt - 6, grade(L.cloth || 0xd9685c), 15, cx + 7, clothSh(grade(L.cloth || 0xd9685c)));
  if (L.tool === 'ball') { X.ell(hx + 2, hy + 2, 2.6, 2.6, grade(0xd9534f), 15, grade(0xa83a36), grade(0xf7a0a0)); }
}
const PCACHE = {};
// infected skin: remap Saigon's graded skin ramp (base / shade / highlight / ink-overlap) to a sickly grey-green ramp
function zombify(gr, L) {
  const gs = grade(L.skin), Z = 0x9aae8c, M = new Map([[gs, Z], [skinSh(gs), 0x6e8470], [hiOf(gs), 0xb4c4a2], [mixc(gs, INK, 0.72), mixc(Z, INK, 0.72)], [mixc(skinSh(gs), INK, 0.72), mixc(0x6e8470, INK, 0.72)]]);
  return gr.map(c => M.has(c) ? M.get(c) : c);
}
function personSprite(L, back, pose, flip, white) {
  const key = L.id + '|' + back + pose + flip + (white ? 'w' : '');
  if (PCACHE[key]) return PCACHE[key];
  let gr = drawPerson(L, back, pose);
  if (L.ev === 'zombie') gr = zombify(gr, L);
  if (flip) { const o = new Int32Array(CW * CH); for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) o[y * CW + x] = gr[y * CW + CW - 1 - x]; gr = o; }
  if (white) gr = gr.map(c => c < 0 ? c : c === INK ? 0xb8b0a8 : 0xfbf6ea);
  return (PCACHE[key] = gridCanvas(gr, CW, CH, null, K));
}
let PID = 0;
function look(type, o) { const L = Object.assign(randLook(type), o || {}); L.id = 'p' + (PID++); L.seed = PID * 17; if (L.ev && !L.b) L.b = {}; return L; }
// dir: 'se' (front, faces right-down) 'sw' (front mirrored) 'nw' (back) 'ne' (back mirrored)
function person(x, y, L, dir, pose, opt) {
  opt = opt || {};
  const back = dir === 'nw' || dir === 'ne', flip = dir === 'sw' || dir === 'ne';
  const s = personSprite(L, back, pose || 0, flip, opt.white);
  const p = P(x, y, opt.z || 0);
  if (!opt.noShadow) blob(x, y, 4.2);
  DRAW.push({ d: x + y + (opt.dz || 0), f: (G, Lg) => { G.drawImage(s.c, Math.round((p[0] - PW / 2) * K) / K, Math.round((p[1] - PFOOT - (pose === 5 ? 2 : 0)) * K) / K, PW, PH); Lg.drawImage(s.e, Math.round((p[0] - PW / 2) * K) / K, Math.round((p[1] - PFOOT - (pose === 5 ? 2 : 0)) * K) / K, PW, PH); } });
  return p;
}
function corpse(x, y, L) {                                              // a fallen infected: the figure laid on its side
  const gr = drawPerson(L, false, 0), o = new Int32Array(CW * CH).fill(-1), Wd = CH, Hd = CW, rot = new Int32Array(Wd * Hd).fill(-1);
  for (let yy = 0; yy < CH; yy++) for (let xx = 0; xx < CW; xx++) rot[xx * Wd + (CH - 1 - yy)] = gr[yy * CW + xx];
  const s = gridCanvas(rot, Wd, Hd, null, K), p = P(x, y);
  blob(x, y, 7);
  DRAW.push({ d: x + y - 2, f: (G, Lg) => { G.drawImage(s.c, p[0] - Wd / K / 2, p[1] - Hd / K + 3, Wd / K, Hd / K); Lg.drawImage(s.e, p[0] - Wd / K / 2, p[1] - Hd / K + 3, Wd / K, Hd / K); } });
}

// ---------------------------------------------------------------- trees: Saigon species + a Holdfast conifer in the same style
function tree(x, y, spc, v, season) {
  const s = spc === 'pine' ? pineSprite(v) : treeSprite(spc, season || 'summer', v), p = P(x, y);
  blob(x + 4, y + 2, (s.rad || 10) * 0.8);
  DRAW.push({ d: x + y, f: (G, Lg) => { G.drawImage(s.c, p[0] - s.ax, p[1] - s.ay, s.w, s.h); Lg.drawImage(s.e, p[0] - s.ax, p[1] - s.ay, s.w, s.h); } });
}
const _pine = {};
function pineSprite(v) {
  if (_pine[v]) return _pine[v];
  const Rr = mulberry32(v * 911 + 3), LW = 44, LH = 92, bx = 22, by = 88, W = LW * K, H = LH * K, gg = new Int32Array(W * H).fill(-1);
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) gg[y * W + x] = c; };
  const th = 64 + Rr() * 16, P4 = [0x1f3e2e, 0x2c5636, 0x3f7040, 0x5e8c4e];
  for (let y = 0; y < 14 * K; y++) for (let x = -3; x < 3; x++) set(bx * K + x, by * K - y, x > 1 ? 0x4a3226 : x < -1 ? 0x8a6a4e : 0x6e4c3c);
  const tiers = 7;
  for (let t = 0; t < tiers; t++) {
    const ty = by * K - (10 + t * (th - 12) / tiers) * K, rw = (17 - t * 2.1 + Rr() * 1.5) * K, rh = (8 + Rr() * 2) * K;
    for (let y = Math.floor(ty - rh); y <= ty + rh * 0.4; y++) for (let x = Math.floor(bx * K - rw); x <= bx * K + rw; x++) {
      const dx = (x - bx * K) / rw, dy = (y - ty) / rh; if (dy < -1 || Math.abs(dx) > 1 - (dy + 1) * 0.18 + (hash2(x >> 1, y >> 1) - 0.5) * 0.18 || (dy < 0 && Math.abs(dx) > (dy + 1) * 1.05)) continue;
      const l = -dx * 0.6 - dy * 0.5 + (hash2(x >> 1, (y >> 1) + 5) - 0.5) * 0.45; let c = l > 0.5 ? P4[3] : l > 0.05 ? P4[2] : l > -0.4 ? P4[1] : P4[0];
      if (dy > 0.25) c = P4[0];
      if (gg[y * W + x] >= 0 && dy < -0.7) c = mixc(P4[0], INKc, 0.3);
      set(x, y, c);
    }
  }
  for (let x = -2; x <= 2; x++) set(bx * K + x, by * K - th * K - 2, P4[2]);
  const out = inkGrid(gg, W, H, 0.8), s = gridCanvas(out, W, H, null, K); s.ax = bx; s.ay = by; s.rad = 12;
  return (_pine[v] = s);
}

// ---------------------------------------------------------------- models
function suburbHouse(o) {
  const { w, d, floors, wall, roof, seed } = o, H = floors * 18 + 1, B = [], Z0 = 2.5;
  const S = { wall, trim: o.trim || TRIM, seed, band: floors > 1 ? 18.5 : 0, wins: o.wins, door: o.door, sign: o.sign };
  B.push(box(-0.5, -0.5, 0, w + 1, d + 1, Z0, CONC, (f, u, v) => f !== 0 && hs(u * 3, v * 3) > 0.8 ? 0x8e887c : v > Z0 - 0.6 ? 0xc0baae : undefined));
  B.push(box(0, 0, Z0, w, d, H, wall, sidingP(S)));
  // stepped gable roof, ridge parallel to the street (x)
  const n = 6, s = (d + 3) / (2 * n);
  for (let k = 0; k < n; k++) B.push(box(-0.6, -1.5 + k * s, Z0 + H + k * 2.3, w + 1.2, d + 3 - 2 * k * s, 2.3, roof, shingleP(roof, seed), { k, gable: { wall, trim: S.trim, seed, wins: {}, z0: Z0 } }));
  B.push(box(-0.6, d + 1.1, Z0 + H - 0.8, w + 1.2, 0.8, 0.8, 0xc8c0b4));                                        // gutter
  B.push(box(w - 0.2, d + 1.1, 1, 0.8, 0.8, H + 1, 0xb8b0a4));                                                   // downspout
  if (o.chimney) B.push(box(o.chimney, d * 0.3, Z0 + H, 4, 4, 15, 0x9e5040, brickP), box(o.chimney - 0.4, d * 0.3 - 0.4, Z0 + H + 15, 4.8, 4.8, 1.2, 0x6a6460));
  if (o.porch) {
    const [px, pw] = o.porch;
    B.push(box(px, d, 0, pw, 8, 3.2, WOOD, plankP, { along: 'x' }), box(px + pw / 2 - 4, d + 8, 0, 8, 2.5, 1.6, CONC));
    for (const cx of [px + 0.4, px + pw - 1.6]) B.push(box(cx, d + 6.6, 3.2, 1.2, 1.2, 15.5, TRIM));
    B.push(box(px - 0.8, d - 0.4, 18.7, pw + 1.6, 9.4, 1.6, roof, shingleP(roof, seed + 4), { k: 1 }));
    B.push(box(px + 1.6, d + 7.2, 3.2, pw / 2 - 6, 0.6, 6, TRIM, (f, u, v) => f !== 0 && v < 5.2 && v > 0.6 && (u % 1.6) > 0.55 ? -1 : undefined));
  }
  if (o.solar) B.push(box(w * 0.2, d / 2 + 2.5, Z0 + H + 2 * 2.3, w * 0.45, 0.6, 5, 0x2c3a5a, (f, u, v) => (u % 3) < 0.35 || (v % 2.5) < 0.35 ? 0x9aa8bc : (u + v) % 6 < 0.6 ? 0x5a7298 : 0x2c3a5a));
  if (o.dish) B.push(box(w - 6, d * 0.55, Z0 + H + 4.6, 0.6, 0.6, 3, 0x7a7a80), box(w - 8, d * 0.55 - 1.5, Z0 + H + 7, 4, 0.6, 4, 0xd8d6d0));
  if (o.ac) B.push(box(w, o.ac, Z0 + 12, 2.4, 5, 4.4, 0xc8c8c0, (f, u, v) => f === 2 && (u * 2 | 0) % 2 ? 0x8a8a84 : undefined));
  if (o.garage) {
    const [gx, gw, gd] = o.garage;
    B.push(box(gx, d - gd, Z0, gw, gd, 17, wall, sidingP({ wall, trim: S.trim, seed: seed + 9, wins: { 2: [{ u: gd * 0.35, v: 7, w: 6, h: 7, k: 'glass' }] } })),
      box(gx + 2.5, d - 0.05, Z0, gw - 5, 0.6, 13, 0xd8d2c4, (f, u, v) => f === 1 ? ((v % 2.6) < 0.4 ? 0x9a948a : v < 1.5 ? 0x8a8478 : hs(u, v) > 0.97 ? 0x6a6458 : (o.gSpray && textAt(o.gSpray, u - 3, v - 6)) ? 0xd2382e : undefined) : undefined));
    for (let k = 0; k < 3; k++) B.push(box(gx - 0.5, d - gd - 1 + k * 1.6, Z0 + 17 + k * 1.6, gw + 1, gd + 2 - k * 3.2, 1.6, roof, shingleP(roof, seed + 2), { k }));
  }
  return B;
}
function wallPanel(kind, x, w, h, seed) {
  const y = WALL_Y, B = [];
  if (kind === 'corr') B.push(box(0, 0, 0, w, 1.4, h, [GALV, 0xb0583a, 0x5f86a8, 0x7a9a6a, 0xb8b8b0][seed % 5], corrP([GALV, 0xb0583a, 0x5f86a8, 0x7a9a6a, 0xb8b8b0][seed % 5], [0.45, 0.8, 0.35, 0.55, 0.3][seed % 5], seed), { spray: seed === 6 ? 'HOLD' : seed === 27 ? 'RUN' : null }));
  else if (kind === 'ply') B.push(box(0, 0, 0, w, 1.4, h, 0xc49a64, plyP(seed, seed % 2 ? 'NO ENTRY' : 'KEEP OUT')));
  else if (kind === 'pallet') B.push(box(0, 0, 0, w, 1.6, h, WOOD, palletP));
  else if (kind === 'mesh') { MESHX.push(x + w / 2); addBake(x, y, [box(0, 0, 0, w, 0.8, h, 0x8a9298, meshP)], 0.2, { noInk: true }); }
  else if (kind === 'door') B.push(box(0, 0, 0, w, 1.4, h, 0x8a3a34, carDoorP(0x9a4038)));
  // inner rails + post + sandbags (we see the settlement side)
  if (seed % 3 === 0) B.push(box(0, 1.4, h - 5, w, 0.9, 1.4, WOOD, woodP));
  B.push(box(-0.8, 0.2, 0, 1.8, 2.6, h + 4, WOOD, woodP));
  if (seed % 4 === 1) for (let i = 0; i < Math.floor(w / 3.4); i++) { B.push(box(i * 3.4 + 0.1, 2.4, 0, 3.2, 2.2, 1.8, 0xb8a47c, sandP)); if (i % 2 === 0 && i * 3.4 + 4 < w) B.push(box(i * 3.4 + 1.8, 2.6, 1.8, 3.2, 2, 1.7, 0xb8a47c, sandP)); }
  // razor wire on top: dotted strand
  B.push(box(-0.8, 0.5, h + 2.4, w + 1.6, 0.5, 0.6, 0xb8bcc0, (f, u) => (u % 1.4) < 0.5 ? 0xe0e4e6 : (u % 1.4) < 0.9 ? -1 : undefined));
  B.push(box(-0.8, 0.3, h + 3.6, w + 1.6, 0.5, 0.6, 0xb8bcc0, (f, u) => ((u + 0.7) % 1.4) < 0.5 ? 0xe0e4e6 : ((u + 0.7) % 1.4) < 0.9 ? -1 : undefined));
  addBake(x, y, B);
  castShadow(x, y, w, 1.6, h);
  // sharpened stakes on the outside (tips show above the wall)
  const SB = [];
  for (let i = 0; i < Math.floor(w / 4); i++) { const hh = 14 + hs(x + i, 5) * 9; SB.push(box(i * 4 + 1, -4.5 + (i % 2) * 1.2, 0, 1.1, 1.1, hh, WOOD_D, (f, u, v, b) => v > b.h - 2 ? 0xd8b48a : undefined)); }
  addBake(x, y, SB);
}
function tower(x, y) {
  const h = 46, s = 18, back = [], front = [];
  for (const [a, b] of [[0, 0], [s - 2, 0], [0, s - 2], [s - 2, s - 2]]) back.push(box(a, b, 0, 2, 2, h, WOOD, woodP));
  for (const z of [13, 29]) { back.push(box(0, 0.4, z, s, 1.2, 1.6, WOOD_D, woodP), box(0.4, 0, z + 1.6, 1.2, s, 1.6, WOOD_D, woodP), box(0, s - 1.6, z, s, 1.2, 1.6, WOOD_D, woodP), box(s - 1.6, 0, z + 1.6, 1.2, s, 1.6, WOOD_D, woodP)); }
  // ladder on the settlement side
  back.push(box(s * 0.5 - 3, s, 0, 0.8, 0.8, h + 2, WOOD_L), box(s * 0.5 + 2.2, s, 0, 0.8, 0.8, h + 2, WOOD_L), box(s * 0.5 - 2.2, s + 0.1, 0, 4.4, 0.4, h, WOOD_L, (f, u, v) => f === 1 && (v % 3) > 0.7 ? -1 : undefined));
  back.push(box(-1, -1, h, s + 2, s + 2, 2.2, WOOD, plankP, { along: 'y' }));
  // corrugated parapets on the outer sides, tarp canopy at the back
  back.push(box(-1, -1, h + 2.2, s + 2, 1, 11, 0xa86a4a, corrP(0xa86a4a, 0.8, 3)), box(-1, -1, h + 2.2, 1, s + 2, 11, GALV, corrP(GALV, 0.5, 7)));
  back.push(box(-1, -1, h + 13, 1.2, 1.2, 12, WOOD_D), box(s - 0.2, -1, h + 13, 1.2, 1.2, 12, WOOD_D));
  for (let k = 0; k < 3; k++) back.push(box(-1.5, -1.5 + k * 2.4, h + 25 - k * 1.6, s + 3, 3, 1.6, 0x4f6f8f, (f, u, v) => f === 0 ? (vnoise(u / 3, v + k) > 0.55 ? 0x5c7c9c : 0x4f6f8f) : 0x3e5a76));
  back.push(box(s - 2, 3, h + 18, 1.6, 1.6, 2.4, 0xfff0c0, null, { em: 0xffd98a }));
  addBake(x, y, back, -0.5);
  // front: sandbag lip on the +y and +x edges, drawn after the guards
  for (let i = 0; i < 5; i++) front.push(box(i * 3.8, s - 1.2, h + 2.2, 3.6, 2.2, 2.2, 0xb8a47c, sandP), box(s - 1.2, i * 3.8 + 0.2, h + 2.2, 2.2, 3.6, 2.2, 0xb8a47c, sandP));
  addBake(x, y, front, 30);
  castShadow(x, y, s, s, h + 25);
  LIGHTS.push([...P(x + s - 1, y + 4, h + 19), 30, 'rgba(255,200,120,', 0.55]);
}
function car(x, y, c) {
  const B = [];
  const bodyP = (f, u, v, b) => { if (f === 0) return vnoise(u / 3, v / 3) > 0.6 ? mixc(c, RUST, 0.5) : mixc(c, 0xfff1d6, 0.12); let k = c; if (vnoise(u / 2.5, v / 2) > 0.58) k = mixc(k, RUST, 0.55); if (v < 1) k = mixc(k, INKc, 0.4); if (f === 1 && Math.abs(u - b.w * 0.5) < 0.25) k = mixc(k, INKc, 0.35); return k; };
  B.push(box(1, 0.5, 0, 3, 1, 3, 0x2a2628), box(b2(14), 0.5, 0, 3, 1, 3, 0x2a2628), box(1, 8.5, 0, 3, 1, 3, 0x2a2628), box(14, 8.5, 0, 3, 1, 3, 0x2a2628));
  B.push(box(0, 0, 1.6, 19, 9, 5, c, bodyP));
  B.push(box(4, 0.5, 6.6, 9, 8, 4.2, c, (f, u, v, b) => { if (f === 0) return mixc(c, RUST, 0.4); if (v > 0.6 && v < 3.6 && u > 0.8 && u < (f === 1 ? b.w : b.d) - 0.8) { const cr = Math.abs((u - 3) - (v - 1) * 1.5) < 0.25; return cr ? 0xc8d4dc : (u + v) % 4 < 0.6 ? 0x6a7a8a : 0x2a3038; } return c; }));
  addBake(x, y, B); castShadow(x, y, 19, 9, 10);
  function b2(v) { return v; }
}
function drum(x, y, fire) {
  addBake(x, y, [box(-2, -2, 0, 4, 4, 7, 0x6a4a3a, (f, u, v) => f === 0 ? 0x2a1e1a : (Math.abs(v - 2) < 0.3 || Math.abs(v - 5) < 0.3) ? 0x4a3226 : vnoise(u, v / 2) > 0.55 ? RUST : undefined)]);
  if (fire) {
    const fl = [], Wd = 12 * K, Hd = 14 * K; for (let i = 0; i < Wd * Hd; i++) fl.push(-1); const em = fl.slice();
    for (let y = 0; y < Hd; y++) for (let xx = 0; xx < Wd; xx++) { const dx = (xx - Wd / 2) / (Wd / 2), dy = 1 - y / Hd, wob = Math.sin(y * 0.6) * 0.12; const lim = (1 - Math.pow(dy, 1.4)) * 0.9; if (Math.abs(dx + wob) > lim * (0.4 + dy * 0.8)) continue; const hot = Math.abs(dx + wob) < lim * 0.35 && dy > 0.2; const c = hot ? 0xffe9a0 : dy > 0.55 ? 0xf6a03a : 0xd85a2a; fl[y * Wd + xx] = c; em[y * Wd + xx] = c; }
    const s = gridCanvas(Int32Array.from(fl), Wd, Hd, Int32Array.from(em), K), p = P(x, y, 7);
    DRAW.push({ d: x + y + 0.1, f: (G, Lg) => { G.drawImage(s.c, p[0] - 6, p[1] - 13, 12, 14); Lg.drawImage(s.e, p[0] - 6, p[1] - 13, 12, 14); } });
    LIGHTS.push([p[0], p[1] - 4, 46, 'rgba(255,150,70,', 0.8]);
  }
}
function prop(x, y, boxes, sh) { addBake(x, y, boxes); if (sh) castShadow(x, y, sh[0], sh[1], sh[2]); }

// ---------------------------------------------------------------- ground
const GROUND = {
  grassIn: [0x76a052, 0x6a9449, 0x88b05e, 0x5e8a42],
  grassOut: [0x6e8a4a, 0x627c42, 0x7c9654, 0x566e3a],
  dirt: [0x9a8262, 0x8a7254, 0xa88e6c],
};
function groundAt(wx, wy) {
  const n = hash2(wx * 2, wy * 2), vn = vnoise(wx / 7, wy / 7), vn2 = vnoise(wx / 19 + 4, wy / 19);
  // outside: overgrown verge, cracked asphalt road, broken sidewalk, trampled kill-zone
  if (wy < 222) { const G2 = GROUND.grassOut; let c = vn > 0.6 ? G2[1] : G2[0]; if (n > 0.9) c = G2[2]; if (n < 0.06) c = G2[3]; if (vn2 > 0.7) c = mixc(c, 0x8e7a5c, 0.45); if (wy > 214) c = mixc(c, 0x8a8a7a, 0.25); return c; }
  if (wy < 262) {
    let c = vn > 0.62 ? 0x4e4a4c : 0x58524f; const n2 = hash2(wx * 3, wy * 3); if (n2 > 0.94) c = 0x6a625e; else if (n2 < 0.05) c = 0x403a3c;
    const cr = Math.abs(vnoise(wx / 9, wy / 9) - 0.5); if (cr < 0.018) c = 0x2e2828; else if (cr < 0.034 && hash2(wx, wy) > 0.5) c = 0x6a8a44;   // cracks with weeds
    const pt = vnoise(wx / 3 + 9, wy / 3); if (pt > 0.86) c = pt > 0.89 ? 0x3a3434 : 0x4a4442;   // potholes
    if (Math.abs(wy - 242) < 0.6 && (wx % 14) < 7 && vnoise(wx / 5, 3) > 0.35) c = mixc(0xd8c07a, c, 0.35);   // faded centre dashes
    if (wy < 226 || wy > 258) { if (vnoise(wx / 3, wy / 2) > 0.5) c = mixc(c, GROUND.grassOut[0], 0.7); }
    return c;
  }
  if (wy < 265) return n > 0.9 ? 0x9a9284 : wy < 263 ? 0xbab2a2 : 0x8a8274;                       // kerb
  if (wy < 273) { const gx = wx % 7, gy = (wy - 265) % 8; let c = gx < 0.5 || gy < 0.5 ? 0x6a8a46 : vn > 0.55 ? 0xb4ac9c : 0xa8a090; if (Math.abs(vnoise(wx / 4, wy / 4) - 0.5) < 0.03) c = 0x5a5448; if (vn2 > 0.62) c = mixc(c, GROUND.grassOut[0], 0.6); return c; }
  if (wy < WALL_Y + 1) { const D = GROUND.dirt; let c = vn > 0.55 ? D[1] : D[0]; if (n > 0.93) c = D[2]; if (n < 0.04) c = 0x6e5c46; if (hash2(wx * 4, wy * 4) > 0.996) c = 0xd8b45a; if (Math.abs((wx + wy * 0.3) % 9 - 4.5) < 0.4 && vn > 0.4) c = mixc(c, 0x6e5c46, 0.4); if (vnoise(wx / 6 + 20, wy / 6) > 0.72) c = mixc(c, 0x3a3030, 0.35); return c; }
  // inside: patrol path, lawns, inner street, sidewalks
  if (wy < 300) { const D = GROUND.dirt; let c = vn > 0.5 ? D[2] : D[0]; if (n > 0.92) c = 0x7a6a50; return mixc(c, 0xb8a888, 0.25); }
  if (wy >= 367 && wy < 372 || wy >= 398 && wy < 403) { const gx = wx % 6; return gx < 0.5 ? 0x8a8274 : n > 0.93 ? 0xa49c8c : 0xc2baa8; }
  if (wy >= 372 && wy < 398) { let c = vn > 0.6 ? 0x5a5452 : 0x645e5a; if (n > 0.95) c = 0x76706a; if (Math.abs(vnoise(wx / 8, wy / 8) - 0.5) < 0.016) c = 0x3a3434; if ((wy - 372) < 1 || (398 - wy) < 1) c = 0x3a2c2c; const pa = vnoise(wx / 10 + 3, wy / 10 + 8); if (pa > 0.7) c = mixc(c, 0x2e2a2c, 0.5); return c; }
  if (wx > 240 && wx < 260 && wy > 360 && wy < 372) return (wx % 5) < 0.4 || (wy % 5) < 0.4 ? 0x8a8478 : n > 0.9 ? 0xa8a090 : 0xb8b0a0;   // driveway
  const Gi = GROUND.grassIn; let c = vn > 0.58 ? Gi[1] : Gi[0]; if (n > 0.92) c = Gi[2]; if (n < 0.05) c = Gi[3];
  if (((wx + wy) % 12) < 6 && wy > 300 && wy < 330) c = mixc(c, 0x9cc068, 0.12);               // mowing stripes
  if (vn2 > 0.74) c = mixc(c, 0x9a9a5c, 0.3);                                                      // worn / sun-dried patches
  if (wy > 410) { if ((wy - 410) % 6 < 2.2 && wx > 230 && wx < 420 && wy < 470) c = hash2(wx * 2, wy) > 0.5 ? 0x6a4a32 : 0x5e4230; }   // tilled plot rows
  return c;
}
function paintGround(img) {
  const d = img.data, GC = new Map();
  for (let py = 0; py < SH; py++) for (let px = 0; px < SW; px++) {
    const sx = X0 + (px + 0.5) / K, sy = Y0 + (py + 0.5) / K, wx = sy + sx / 2, wy = sy - sx / 2;
    let c = groundAt(wx, wy); let gcol = GC.get(c); if (gcol === undefined) { gcol = grade(c); GC.set(c, gcol); }
    const i = (py * SW + px) * 4; d[i] = gcol >> 16 & 255; d[i + 1] = gcol >> 8 & 255; d[i + 2] = gcol & 255; d[i + 3] = 255;
  }
  // grass tufts and weeds (blades rise above the ground plane)
  const tuft = (sx, sy, cols, n) => { const px = Math.round((sx - X0) * K), py = Math.round((sy - Y0) * K); for (let k = 0; k < n; k++) { const bx = px + k - (n >> 1), hgt = 2 + ((k * 7 + px) % 3); for (let j = 0; j < hgt; j++) { const yy = py - j, xx = bx + (j > 1 && k % 2 ? 1 : 0); if (xx < 0 || yy < 0 || xx >= SW || yy >= SH) continue; const c = grade(j === hgt - 1 ? cols[2] : j === 0 ? cols[0] : cols[1]), i = (yy * SW + xx) * 4; d[i] = c >> 16 & 255; d[i + 1] = c >> 8 & 255; d[i + 2] = c & 255; } } };
  for (let i = 0; i < 2600; i++) {
    const wx = rnd(-200, 900), wy = rnd(-60, 300), p = P(wx, wy); if (p[0] < X0 || p[0] > X0 + SW / K || p[1] < Y0 || p[1] > Y0 + SH / K) continue;
    if (wy > 226 && wy < 258 && vnoise(wx / 9, wy / 9) > 0.47 && vnoise(wx / 9, wy / 9) < 0.53) tuft(p[0], p[1], [0x4e6a34, 0x6a8a44, 0x8aa85a], 3);
    else if (wy < 222 || (wy > 265 && wy < 274)) tuft(p[0], p[1], [0x4a6232, 0x627c42, hash2(wx, wy) > 0.85 ? 0xc8b46a : 0x86a05a], 3 + (i % 3));
  }
  for (let i = 0; i < 700; i++) { const wx = rnd(0, 700), wy = rnd(300, 520), p = P(wx, wy); if (wy > 367 && wy < 403) continue; tuft(p[0], p[1], [0x5e8a42, 0x76a052, hash2(wx, wy) > 0.9 ? 0xf2e6a0 : 0x92b866], 2); }
}

// ---------------------------------------------------------------- compose the scene
function build() {
  // --- far side: forest edge with clearings, a burnt-out house, a wreck on the road
  const TREES = [];
  for (let i = 0; i < 260; i++) {
    const x = rnd(40, 760), y = rnd(-40, 214), p = P(x, y);
    if (p[0] < X0 - 40 || p[0] > X0 + SW / K + 40 || p[1] < Y0 - 10 || p[1] > Y0 + SH / K + 90) continue;
    if (vnoise(x / 60, y / 60) < 0.42 && y < 200) continue;                                          // clearings
    if (Math.hypot(x - 420, y - 150) < 44) continue;                                                  // ruined lot
    if (TREES.some(t => Math.hypot(t[0] - x, t[1] - y) < 13)) continue;
    TREES.push([x, y]);
  }
  for (const [x, y] of TREES) { const r = hash2(x, y); tree(x, y, r < 0.42 ? 'pine' : r < 0.62 ? 'me' : r < 0.82 ? 'dau' : 'bang', (x * 7 + y | 0) % 6); }
  // burnt-out house in the woods (story: the old neighbourhood beyond the wall)
  prop(392, 128, [box(0, 0, 0, 40, 30, 2.4, CONC), box(0, 0, 2.4, 40, 1.4, 22, 0x8a8478, sidingP({ wall: 0x8a8a7a, trim: 0xb8b0a0, seed: 3, wins: { 1: [{ u: 6, v: 6, w: 7, h: 9, k: 'broken' }, { u: 24, v: 6, w: 7, h: 9, k: 'board' }] } })),
    box(0, 0, 2.4, 1.4, 30, 15, 0x7a786c, sidingP({ wall: 0x7a7a6c, trim: 0xa8a090, seed: 5, wins: { 2: [{ u: 10, v: 4, w: 7, h: 8, k: 'broken' }] } })),
    box(38.6, 0, 2.4, 1.4, 30, 9, 0x7a786c, sidingP({ wall: 0x6e6c60, trim: 0xa8a090, seed: 6, wins: {} })),
    box(3, 3, 2.4, 10, 8, 5, 0x3a302c), box(18, 10, 2.4, 14, 6, 3, 0x4a3a30), box(6, 16, 2.4, 6, 12, 2, 0x5a4a3a), box(26, 20, 2.4, 9, 8, 6, 0x3a3230)], [40, 30, 22]);
  car(300, 230, 0x6a8aa0); car(520, 238, 0x9a8a62);
  prop(470, 262, [box(0, 0, 0, 6, 6, 4, 0x2a2628, (f, u, v) => f !== 0 && (v | 0) % 2 ? 0x3a3438 : undefined), box(0.5, 0.5, 4, 5, 5, 4, 0x2a2628, (f, u, v) => f !== 0 && (v | 0) % 2 ? 0x3a3438 : undefined)]);   // tyres
  // hedgehogs on the cleared ground
  for (const hx of [250, 330, 450, 560]) prop(hx, 278, [box(-4, -0.5, 0, 8, 1, 1.2, 0x5a5050), box(-0.5, -4, 0, 1, 8, 1.2, 0x5a5050), box(-0.6, -0.6, 0, 1.2, 1.2, 8, 0x6a5e5a), box(-3, -0.5, 4, 6, 1, 1, 0x5a5050)]);
  // --- the wall: improvised panel run
  const RUN = ['corr', 'corr', 'ply', 'corr', 'pallet', 'corr', 'door', 'corr', 'corr', 'mesh', 'corr', 'ply', 'corr', 'corr', 'pallet', 'corr', 'corr', 'ply', 'corr', 'door', 'corr', 'corr', 'mesh', 'corr', 'ply', 'corr', 'corr', 'pallet', 'corr', 'corr', 'door', 'corr', 'ply', 'corr', 'corr', 'corr', 'mesh', 'corr', 'ply', 'corr', 'corr', 'pallet', 'corr', 'corr', 'door', 'corr', 'corr', 'ply', 'corr', 'corr'];
  let wx = 0; for (let i = 0; i < RUN.length; i++) { if (wx > 436 && wx < 452) { RUN[i] = 'door'; WEAKX = wx + 4.5; } const w = RUN[i] === 'door' ? 9 : RUN[i] === 'mesh' ? 20 : 12 + (i % 3) * 2; wallPanel(RUN[i], wx, w, RUN[i] === 'door' ? 13 : 15 + (i % 3 === 1 ? 2 : 0), i + 1); wx += w; }   // panels ~75% of a person: heads always read above the wall
  // --- sniper tower behind the wall
  tower(406, 293);
  // --- houses along the inner street (fronts face +y)
  const hA = { w: 48, d: 36, floors: 2, wall: 0xe6dcc2, roof: 0x5c5658, seed: 11, chimney: 8, porch: [6, 24], dish: 1, ac: 8,
    wins: { 1: [{ u: 33, v: 5, w: 9, h: 10, k: 'glass', cur: 0xd9685c, lit: 1 }, { u: 4, v: 23.5, w: 8, h: 9.5, k: 'glass', cur: 0xe8dcc0 }, { u: 19, v: 23.5, w: 8, h: 9.5, k: 'board', t: 'SAFE', tc: 0xf2eee2 }, { u: 34, v: 23.5, w: 8, h: 9.5, k: 'glass', lit: 1 }], 2: [{ u: 8, v: 6, w: 8, h: 9, k: 'glass', cur: 0x8fc1e3 }, { u: 22, v: 23.5, w: 8, h: 9, k: 'glass', lit: 1 }] },
    door: { f: 1, u: 14, w: 6, h: 13.5, c: 0x7a4a36 } };
  addBake(126, 330, suburbHouse(hA)); castShadow(126, 330, 48, 36, 52);
  const hB = { w: 42, d: 34, floors: 1, wall: 0xa8b89a, roof: 0x6e5446, seed: 23, porch: [3, 20], garage: [42, 22, 26], gSpray: 'TOOLS', solar: 1,
    wins: { 1: [{ u: 26, v: 5, w: 10, h: 9, k: 'glass', cur: 0xf2c94c, lit: 1 }, { u: 3.5, v: 5, w: 6, h: 9, k: 'broken' }], 2: [{ u: 12, v: 5, w: 8, h: 8, k: 'board' }] },
    door: { f: 1, u: 12, w: 6, h: 13.5, c: 0x4a6a8a } };
  addBake(196, 332, suburbHouse(hB)); castShadow(196, 332, 64, 34, 32);
  const hC = { w: 44, d: 36, floors: 2, wall: 0x9fb4c4, roof: 0x4e5a64, seed: 37, chimney: 32, porch: [16, 24],
    wins: { 1: [{ u: 4, v: 5, w: 9, h: 10, k: 'board' }, { u: 5, v: 23.5, w: 8, h: 9.5, k: 'glass', cur: 0xb79fd8, lit: 1 }, { u: 30, v: 23.5, w: 8, h: 9.5, k: 'broken' }], 2: [{ u: 6, v: 6, w: 8, h: 9, k: 'glass', lit: 1 }, { u: 22, v: 6, w: 8, h: 9, k: 'glass', cur: 0xe8dcc0 }, { u: 14, v: 23.5, w: 8, h: 9, k: 'board' }] },
    door: { f: 1, u: 22, w: 6, h: 13.5, c: 0x8a3a34, k: 'ply' } };
  addBake(288, 330, suburbHouse(hC)); castShadow(288, 330, 44, 36, 52);
  // --- yards: picket fences, raised beds, laundry, rain barrel, firewood, coop, mailbox
  const fence = (x, y, w) => prop(x, y, [box(0, 0, 0, w, 0.8, 7, TRIM, (f, u, v) => { if (f === 0) return TRIM; if (v > 5.4 && (u % 2) > 1.1) return -1; if ((u % 2) > 1.1 && v > 1.4 && v < 5.4) return -1; if (v < 1.2) return mixc(TRIM, 0x6a5a4a, 0.4); return hs(u * 2, v) > 0.9 ? 0xc8c0ae : undefined; })]);
  fence(112, 372 - 2, 14); fence(152, 370, 20); fence(334, 370, 14);
  for (const [bx, by, cr] of [[344, 352, [0x4f8a3a, 0x6aa244, 0xd9534f]], [370, 352, [0x5a9a40, 0x7ab04a, 0x8a5ab8]], [344, 334, [0x4f8a3a, 0x6aa244, 0xf2c94c]], [344, 348, [0x4f8a3a, 0x8ab84e, 0x6aa244]], [370, 341, [0x5a9a40, 0x7ab04a, 0xd9534f]]])
    prop(bx, by, [box(0, 0, 0, 20, 8, 3.2, 0x8a5e3a, soilBedP(cr))], [20, 8, 3]);
  prop(340, 324, [box(0, 0, 0, 1, 1, 17, WOOD_D), box(34, 0, 0, 1, 1, 17, WOOD_D), box(0, 0.2, 16, 35, 0.4, 0.4, 0xe8e2d4)]);
  [0xd9685c, 0xf4f1e8, 0x3d6fb5, 0xf2c94c, 0x9fd8b4].forEach((c, i) => prop(343 + i * 6.4, 324, [box(0, 0, 9 + (i % 2), 4.6 - (i % 2), 0.5, 7 - (i % 2) * 2, c, (f, u, v) => f === 1 && (u * 2 | 0) % 3 === 0 ? mixc(c, INKc, 0.15) : undefined)]));
  prop(176, 362, [box(0, 0, 0, 4.4, 4.4, 8, 0x3d6f9a, (f, u, v) => f !== 0 && (Math.abs(v - 2) < 0.4 || Math.abs(v - 6) < 0.4) ? 0x2e5274 : undefined)]);   // rain barrel
  prop(262, 300, [box(0, 0, 0, 16, 5, 7, WOOD, (f, u, v, b) => f === 2 ? ((Math.hypot((u % 2.2) - 1.1, (v % 2.2) - 1.1) < 0.8) ? 0xc8a06a : 0x6a4a32) : f === 0 ? WOOD_L : (v % 2.2 < 0.4 ? 0x5a3e2a : vnoise(u, v) > 0.5 ? WOOD : WOOD_D))], [16, 5, 7]);   // firewood stack
  prop(150, 296, [box(0, 0, 0, 14, 10, 8, 0x8a6a4a, (f, u, v) => f === 1 && u > 2 && u < 12 && v > 1.5 && v < 6.5 ? ((u + v) % 1.6 < 0.3 || (u - v + 20) % 1.6 < 0.3 ? 0xb8b0a8 : 0x3a302c) : undefined), box(-1, -1, 8, 16, 12, 1.6, 0x7a8a94, corrP(0x7a8a94, 0.6, 9))], [14, 10, 10]);   // chicken coop
  prop(184, 370, [box(0, 0, 0, 0.8, 0.8, 9, WOOD_D), box(-1.2, -0.6, 9, 3.2, 2.2, 3, 0x5a6a7a)]);
  prop(448, 336, [box(0, 0, 0, 7, 7, 3, 0x8a6a4a), box(0.5, 0.5, 3, 6, 6, 13, 0x6a7a88, corrP(0x6a7a88, 0.4, 2)), box(0, 0, 16, 7, 7, 1.2, 0x5a6470)], [7, 7, 17]);   // water tank
  drum(330, 306, true); drum(470, 312, true);
  prop(432, 318, [box(0, 0, 0, 5, 5, 4, 0xc98a4a, (f, u, v) => f !== 0 && (v | 0) % 2 === 0 ? 0xa8703a : undefined), box(5.5, 0.5, 0, 5, 5, 4, 0x6a7a5a, (f, u, v) => f !== 0 && (v | 0) % 2 === 0 ? 0x5a6a4a : undefined), box(2.5, 0.5, 4, 5, 5, 3.6, 0xc98a4a)]);   // ammo + supply crates
  prop(322, 420, [box(0, 0, 0, 18, 7, 6, WOOD, plankP, { along: 'x' }), box(0, -4, 0, 18, 2.6, 3.4, WOOD_D), box(0, 8.4, 0, 18, 2.6, 3.4, WOOD_D)]);   // picnic table
  tree(250, 318, 'me', 2); tree(300, 446, 'bang', 1); tree(110, 400, 'dau', 3); tree(420, 420, 'me', 4); tree(500, 380, 'bang', 2);
  // --- field: hay bales, wheelbarrow, compost
  prop(256, 432, [box(0, 0, 0, 7, 5, 5, 0xd8b45a, (f, u, v) => (u * 2 | 0) % 3 === 0 || (v * 2 | 0) % 4 === 0 ? 0xb8943e : undefined), box(8, 1, 0, 7, 5, 5, 0xd8b45a, (f, u, v) => (u * 2 | 0) % 3 === 0 ? 0xb8943e : undefined), box(4, 1, 5, 7, 4, 4.6, 0xe2c46a, (f, u, v) => (u * 2 | 0) % 3 === 0 ? 0xc0a04a : undefined)], [15, 6, 10]);
  prop(296, 404, [box(0, 0, 1.6, 7, 5, 3.6, 0x6a7a88, corrP(0x6a7a88, 0.5, 8)), box(-2.6, 2, 0, 3, 1, 3, 0x2a2628), box(7, 0.6, 2, 6, 0.6, 0.6, WOOD), box(7, 3.8, 2, 6, 0.6, 0.6, WOOD), box(1, 1, 5.2, 5, 3, 1.6, 0x6a4a30)]);
  // --- tower yard: pickup for scavenger runs, guard hut, generator, sandbag nest
  car(452, 344, 0x5a6e5a);
  prop(452 + 19, 344, [box(0, 0, 1.6, 9, 9, 6, 0x4e6250, (f, u, v) => f === 0 ? 0x3a4a3c : undefined), box(1, 1, 7.6, 7, 3, 3, 0x9a8a62), box(4, 4, 7.6, 3, 3, 4, 0x7a5a3a)]);
  prop(500, 318, [box(0, 0, 0, 16, 12, 15, 0x9a8a72, plyP(4, 'POST 2', 0xf2eee2)), box(-1, -1, 15, 18, 14, 1.8, 0x7a8a94, corrP(0x7a8a94, 0.6, 4)), box(16, 4, 4, 0.6, 5, 6, 0x2e3646)], [16, 12, 17]);
  prop(388, 326, [box(0, 0, 0, 7, 4, 4.4, 0x5a5e58, (f, u, v) => f !== 0 && (u * 2 | 0) % 3 === 0 ? 0x3a3e3a : undefined), box(1, 1, 4.4, 2, 2, 2.6, 0x3a3a3a)]);
  for (let i = 0; i < 4; i++) prop(540 + i * 3.4, 300, [box(0, 0, 0, 3.2, 2.4, 1.9, 0xb8a47c, sandP), box(0.4, 0.2, 1.9, 3.2, 2.2, 1.8, 0xb8a47c, sandP)]);
  // --- people (inside): 8 settlers doing different things
  const guard = (o) => look('worker', Object.assign({ ev: 'guard', hat: 'helm', hatC: 0x5a6644, top: 0x6f8250, bot: 0x4a4e3a, sleeve: 'long' }, o));
  const snp = person(410, 306, guard({ gun: 'aim' }), 'nw', 0, { z: 48.2, noShadow: true, dz: 15 });   // sniper aiming out
  person(421, 298, look('youth', { ev: 'spotter', hat: 'cap', hatC: 0x3d4f7a, top: 0x7a6a5a, sleeve: 'long' }), 'se', 0, { z: 48.2, noShadow: true, dz: 15 });   // spotter
  person(352, 293, look('worker', { ev: 'builder', tool: 'hammer', hat: 'cap', hatC: 0xe8b83a, top: 0x7c8aa0 }), 'ne', 6);  // builder at the wall
  person(330, 300, look('worker', { ev: 'builder', tool: 'plank', top: 0xd9685c }), 'se', 1);         // carrying a plank
  person(368, 344, look('oldman', { ev: 'x', tool: 'hoe', hat: 'coi', top: 0xe9dcc0 }), 'se', 0);   // gardener
  person(356, 328, look('dress', { ev: 'x', tool: 'cloth', cloth: 0x8fc1e3, bot: 0x8a5ab8 }), 'nw', 6);   // laundry
  person(500, 298, guard({ gun: 'sling' }), 'nw', 2);                                                  // wall patrol
  person(150, 377, look('oldlady', { top: 0x6b4a6a }), 'sw', 5);                                        // on the porch steps
  person(292, 386, look('kid', { ev: 'x', tool: 'ball', kq: false, top: 0xf2c94c }), 'sw', 1);
  // --- threats (outside): 5 infected
  const zom = (o) => look('youth', Object.assign({ ev: 'zombie', skin: 0x7f9c78, hair: 0x3a3a34, hs: 0, hat: 0, blush: false, top: 0x6a7480, bot: 0x4a4440, carry: null, glasses: false, mask: 0, pack: 0 }, o));
  person(262, 244, zom({ top: 0x8a6a5a }), 'sw', 7);                                                    // shambling to the wall
  person(240, 254, zom({ top: 0x5a6a7a, skin: 0x8ea68a, hs: 4, hair: 0x8a8a84 }), 'sw', 3);
  { person(WEAKX - 1, 285, zom({ top: 0x8a6a5a }), 'sw', 6); person(WEAKX + 8, 283.5, zom({ top: 0x5a6a7a, skin: 0x8ea68a }), 'sw', 6); }   // clawing at the low car-door section                                                    // clawing at the wall
  const hit = person(330, 262, zom({ top: 0x6a6a5a }), 'sw', 7);                      // just hit by the sniper
  corpse(282, 276, zom({ top: 0x5a5a6a }));
  person(300, 214, zom({ top: 0x4a5a4a, skin: 0x88a080 }), 'sw', 1);                                   // stepping out of the trees
  // muzzle flash + tracer from the tower to the hit infected
  const m = [snp[0] - 5.5, snp[1] - 14];
  DRAW.push({ d: 1e9, f: (G, Lg) => { const t = [hit[0], hit[1] - 14]; for (const L2 of [G, Lg]) { L2.fillStyle = '#fff2c4'; const n = 40; for (let i = 0; i < n; i++) { if (i % 3 === 2) continue; const a = i / n; L2.fillRect(Math.round((m[0] + (t[0] - m[0]) * a) * K) / K, Math.round((m[1] + (t[1] - m[1]) * a) * K) / K, 0.5, 0.5); } L2.fillStyle = '#ffd36a'; L2.fillRect(m[0] - 1.5, m[1] - 1, 3, 2); L2.fillRect(m[0] - 0.5, m[1] - 2, 1, 4); } } });
  LIGHTS.push([m[0], m[1], 22, 'rgba(255,220,140,', 0.9]);
}

// ---------------------------------------------------------------- render
function render() {
  build();
  const img = g.createImageData(SW, SH); paintGround(img); g.putImageData(img, 0, 0);
  g.setTransform(K, 0, 0, K, -X0 * K, -Y0 * K); g.imageSmoothingEnabled = false;
  // cast shadows: crisp pixel mask, plum multiply (as Saigon's shade side)
  const sm = mk(SW, SH), sg = sm.getContext('2d'); sg.setTransform(K, 0, 0, K, -X0 * K, -Y0 * K); sg.fillStyle = '#000';
  for (const poly of SHAD) { sg.beginPath(); poly.forEach((p, i) => i ? sg.lineTo(p[0], p[1]) : sg.moveTo(p[0], p[1])); sg.closePath(); sg.fill(); }
  const sd = sg.getImageData(0, 0, SW, SH).data, gd = g.getImageData(0, 0, SW, SH);
  for (let i = 0; i < SW * SH; i++) if (sd[i * 4 + 3] > 127) { const k = i * 4; gd.data[k] = gd.data[k] * 0.7 + 0x4a * 0.3 * 0.6; gd.data[k + 1] = gd.data[k + 1] * 0.66 + 0x26 * 0.2; gd.data[k + 2] = gd.data[k + 2] * 0.72 + 0x3c * 0.3 * 0.6; }
  g.putImageData(gd, 0, 0);
  const lc = mk(SW, SH), lg = lc.getContext('2d'); lg.setTransform(K, 0, 0, K, -X0 * K, -Y0 * K); lg.imageSmoothingEnabled = false;
  DRAW.sort((a, b) => a.d - b.d);
  for (const it of DRAW) it.f(g, lg);
  // time-of-day grade (Saigon's ambient multiply), then emissive windows / fire + soft glow halos
  g.setTransform(1, 0, 0, 1, 0, 0);
  const amb = MODE === 'night' ? '#5a5c98' : MODE === 'day' ? '#fff6e2' : '#ffe4bc';
  g.globalCompositeOperation = 'multiply'; g.fillStyle = amb; g.fillRect(0, 0, SW, SH);
  if (MODE !== 'day') {                       // long warm light from the upper-left, cooler toward the far woods
    const gr = g.createLinearGradient(0, 0, SW, SH); gr.addColorStop(0, 'rgba(255,244,226,1)'); gr.addColorStop(1, MODE === 'night' ? 'rgba(200,200,255,1)' : 'rgba(246,226,222,1)'); g.fillStyle = gr; g.fillRect(0, 0, SW, SH);
  }
  g.globalCompositeOperation = 'lighter';
  const lk = MODE === 'night' ? 1 : MODE === 'day' ? 0 : 0.4;
  if (lk) {
    g.globalAlpha = lk; g.drawImage(lc, 0, 0);
    g.filter = 'blur(5px)'; g.globalAlpha = lk * 0.9; g.drawImage(lc, 0, 0); g.filter = 'none';
    for (const [x, y, r, c, a] of LIGHTS) { const px = (x - X0) * K, py = (y - Y0) * K, rg = g.createRadialGradient(px, py, 0, px, py, r * K); rg.addColorStop(0, c + (a * lk) + ')'); rg.addColorStop(1, c + '0)'); g.globalAlpha = 1; g.fillStyle = rg; g.fillRect(px - r * K, py - r * K, r * K * 2, r * K * 2); }
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  document.title = 'done';
}
render();
