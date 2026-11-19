'use strict';
// ===== Holdfast — art: materials, models, characters (built on SaigonLofi's bake/grade/drawPerson/treeSprite, used read-only) =====
// Promoted from the approved art pilot (docs/holdfast/art-pilot/pilot.js). Every solid thing is a bake() box model with per-pixel painters.
const HINK = 0x2b1a16, WOOD = 0x9a6a44, WOOD_D = 0x6e4a32, WOOD_L = 0xc49a64, RUST = 0x9a4a2a, GALV = 0x9aa0a4, CONC = 0xa8a294, TRIM = 0xf0ead8;
const hs = (a, b) => hash2(a * 13.1 + 7, b * 7.3 + 3);
const HB = (x, y, z, w, d, h, c, p, e) => box(x, y, z, w, d, h, c, p, e);
// Holdfast-only work bubbles, added to Saigon's icon table at runtime before initIcons() (Saigon's own files are unchanged)
if (typeof ICON_SRC !== 'undefined') Object.assign(ICON_SRC, {
  fish: ['........', '..BBB...', '.BWBBB.B', 'BBBBBBBB', '.BBBBB.B', '..BBB...', '........', '........'],
  wheat: ['...Y....', '..YtY.Y.', '...Y.YtY', '..YtY.Y.', '...t.Yt.', '...t.t..', '....tt..', '........'],
  plank: ['........', 'TTTTTTT.', 'tttttttt', '........', '.TTTTTTT', 'tttttttt', '........', '........']
});

// ---------------------------------------------------------------- painters
function sidingP(S) {
  return (f, u, v, b, wx, wy) => {
    if (f === 0) return 0x7a6e62;
    const W = f === 1 ? b.w : b.d;
    if (u < 0.9 || u > W - 0.9) return v < 1 ? mixc(S.trim, 0x4a3a30, 0.25) : S.trim;
    if (S.band && Math.abs(v - S.band) < 0.55) return S.trim;
    const ws = S.wins[f]; if (ws) for (const w of ws) if (u >= w.u && u < w.u + w.w && v >= w.v && v < w.v + w.h) return winPix(w, u - w.u, v - w.v, S);
    const dr = S.door; if (dr && dr.f === f && u >= dr.u && u < dr.u + dr.w && v < dr.h) return doorPix(dr, u - dr.u, v, S);
    const sg = S.sign; if (sg && sg.f === f && u >= sg.u && u < sg.u + textW(sg.t) + 2 && v >= sg.v - 1 && v < sg.v + 6) { if (textAt(sg.t, u - sg.u - 1, v - sg.v)) return sg.c; if (sg.bg) return sg.bg; }
    const row = Math.floor(v / 2.2), fr = v - row * 2.2;
    let c = S.vert ? S.wall : S.wall;
    if (S.vert) { const bu = u % 3; if (bu < 0.5) c = mixc(c, 0x3a2430, 0.28); else if (bu > 2.4) c = mixc(c, 0xfff1d6, 0.1); }
    else if (fr < 0.5) c = mixc(c, 0x3a2430, 0.26); else if (fr > 1.75) c = mixc(c, 0xfff1d6, 0.12);
    if (hs(row * 3 + f, Math.floor(u / 9) + S.seed) > 0.8) c = mixc(c, 0x8a7a6a, 0.08);
    const st = vnoise(u / 3.2 + S.seed, v / 8 + f * 5); if (st > 0.64) c = mixc(c, 0x6a5a4c, Math.min(0.32, (st - 0.64) * 1.3 + (S.wear || 0) * 0.2));
    if (ws) for (const w of ws) if (u > w.u + 0.6 && u < w.u + w.w - 0.6 && v < w.v && v > w.v - 5 && vnoise(u * 1.7, S.seed) > 0.55) c = mixc(c, 0x5a4a40, 0.22 * (1 - (w.v - v) / 5));
    if (v < 3) c = mixc(c, S.moss ? 0x4a5a30 : 0x4a3828, (3 - v) / 3 * (S.moss ? 0.55 : 0.38));
    if (hs(Math.floor(u * 2) + S.seed, Math.floor(v * 2)) > 0.986 - (S.wear || 0) * 0.02) c = mixc(c, 0xb08a64, 0.55);
    if (S.spray && S.spray.f === f && textAt(S.spray.t, u - S.spray.u, v - S.spray.v)) c = S.spray.c;
    return c;
  };
}
function winPix(w, x, y, S) {
  const fr = 0.7, W = w.w, H = w.h;
  if (y < 0.6) return mixc(S.trim, 0x3a2a30, 0.3);
  if (x < fr || x > W - fr || y > H - fr || y < fr + 0.4) return S.trim;
  if (w.k === 'board') {
    const pl = Math.floor((y - 1) / 1.6), py = (y - 1) - pl * 1.6, c0 = [0xb08654, 0x9a7044, 0xc09464, 0xa47a4a][(pl + S.seed | 0) % 4];
    if (py < 0.35) return 0x2e2228;
    if ((Math.abs(x - 1.4) < 0.35 || Math.abs(x - (W - 1.4)) < 0.35) && py > 0.6 && py < 1.0) return 0x5a5050;
    if (w.t && textAt(w.t, x - 1.2, y - 2.2)) return w.tc || 0xd2382e;
    return vnoise(x * 2 + pl, y / 3) > 0.6 ? mixc(c0, 0x6a4a30, 0.25) : c0;
  }
  if (Math.abs(x - W / 2) < 0.35 || Math.abs(y - H * 0.55) < 0.3) return S.trim;
  if (w.k === 'broken') {
    const cx = W * 0.4, cy = H * 0.45, d = Math.hypot((x - cx) * 1.2, y - cy) + (hs(x * 4, y * 4) - 0.5) * 1.4;
    if (d < 1.9) return 0x161218;
    if (Math.abs((x - cx) * 0.8 - (y - cy)) < 0.2 || Math.abs((x - cx) + (y - cy) * 0.6) < 0.2) return 0xb8c4cc;
  }
  const lit = w.k !== 'broken' && w.lit;
  if (w.cur && (x < W * 0.3 || x > W * 0.7)) { const c = (x * 2 | 0) % 2 ? w.cur : mixc(w.cur, 0x3a2430, 0.2); if (lit) EM = mixc(0xffc870, 0, 0.35); return c; }
  if (lit) EM = 0xffd38a;
  const gl = (x - y + 20) % 5; return gl < 0.7 ? 0x8aa0b4 : y > H - 1.8 ? 0x2e3646 : 0x404c60;
}
function doorPix(dr, x, v, S) {
  const W = dr.w;
  if (x < 0.6 || x > W - 0.6 || v > dr.h - 0.6) return S.trim;
  if (dr.k === 'ply') { if (Math.abs((x - 1) - (v - 1) * (W - 2) / (dr.h - 2)) < 0.45 || Math.abs((W - 1 - x) - (v - 1) * (W - 2) / (dr.h - 2)) < 0.45) return 0xd2382e; return vnoise(x * 2, v / 3) > 0.6 ? 0xa47a4a : 0xb48a58; }
  if (dr.k === 'roll') return (v % 2.2) < 0.45 ? 0x6a6a64 : v < 1.5 ? 0x5a5a54 : 0x9a9a90;
  if (Math.abs(x - (W - 1.6)) < 0.4 && Math.abs(v - 8) < 0.5) return 0xe0b450;
  const ix = (x % (W / 2)), iv = v % (dr.h * 0.5);
  return ix > 0.9 && ix < W / 2 - 0.5 && iv > 1.1 && iv < dr.h * 0.5 - 1 ? mixc(dr.c, 0x2b1a16, 0.18) : dr.c;
}
function shingleP(c0, seed, holes) {
  return (f, u, v, b, wx, wy) => {
    if (f === 2) { const S = b.gable; if (S) { if (v > b.h - 0.7) return S.trim; return sidingP(S)(1, u + 40, v + b.z - S.z0, { w: 400, d: 400, h: 400 }, wx, wy); } return mixc(c0, HINK, 0.3); }
    if (holes && vnoise(wx / 4 + seed, wy / 4) > 1 - holes) return f === 0 ? -1 : 0x2a2224;
    const k = b.k || 0, tab = 2.6, uu = u + (k % 2) * 1.3, ti = Math.floor(uu / tab), tu = uu - ti * tab;
    let c = c0; const t = hs(ti + seed, k * 5 + f);
    c = t < 0.25 ? mixc(c, 0x2b1a16, 0.16) : t > 0.82 ? mixc(c, 0xfff1d6, 0.10) : c;
    if (tu < 0.35) c = mixc(c, 0x2b1a16, 0.34);
    if (f === 1 && v < 0.55) c = mixc(c, 0x2b1a16, 0.42);
    if (f === 0 && v > b.d - 0.5) c = mixc(c, 0x2b1a16, 0.2);
    const m = vnoise(wx / 5 + seed, wy / 4 + k * 0.3); if (m > 0.66) c = mixc(c, 0x6e7c44, Math.min(0.55, (m - 0.66) * 2));
    if (t > 0.975) c = 0x2a2426;
    return c;
  };
}
const brickP = (f, u, v) => { if (f === 0) return 0x5a4a44; const row = Math.floor(v), off = (row % 2) * 1.1; if (v - row < 0.28 || ((u + off) % 2.2) < 0.3) return 0xb4a494; const h = hs(Math.floor((u + off) / 2.2), row); return h < 0.3 ? 0x8a4434 : h > 0.8 ? 0xb0624a : 0x9e5040; };
function brickWallP(S) { const sp = sidingP(S); return (f, u, v, b, wx, wy) => { const c = sp(f, u, v, b, wx, wy); if (c !== S.wall && !(Math.abs(c - S.wall) < 0x030303)) { const W = f === 1 ? b.w : b.d; const ws = S.wins[f]; if (ws) for (const w of ws) if (u >= w.u && u < w.u + w.w && v >= w.v && v < w.v + w.h) return c; if (S.sign && S.sign.f === f && v >= S.sign.v - 1 && v < S.sign.v + 6 && u >= S.sign.u && u < S.sign.u + textW(S.sign.t) + 2) return c; if (S.door && S.door.f === f && u >= S.door.u && u < S.door.u + S.door.w && v < S.door.h) return c; if (u < 0.9 || u > W - 0.9) return brickP(f, u, v); } return f === 0 ? c : brickP(f, u, v); }; }
function corrP(c, rust, seed) {
  return (f, u, v, b, wx, wy) => {
    if (f === 0) return mixc(c, HINK, 0.25);
    if (b.dmg && vnoise(u / 2 + seed, v / 2) > 1 - b.dmg * 0.3) return -1;
    const k = (u * 1.3 + 10) % 1;
    let col = k < 0.32 ? mixc(c, 0xfff1d6, 0.2) : k > 0.72 ? mixc(c, 0x2b1a16, 0.24) : c;
    const r = vnoise(u / 1.6 + seed, v / 5.5 + seed); if (r > 0.62 - rust * 0.28) col = mixc(col, RUST, Math.min(0.85, (r - 0.62 + rust * 0.28) * 2.4));
    if (v < 2.2) col = mixc(col, 0x6a3a24, 0.35 * rust + 0.1);
    if ((Math.abs(v - 1.8) < 0.3 || Math.abs(v - (b.h - 1.8)) < 0.3) && (u % 3.2) < 0.5) col = 0x3a2e2c;
    if (b.spray && textAt(b.spray, u - 1.5, v - b.h * 0.45)) col = b.sprayC || 0xe8e2d4;
    if (b.dmg) col = mixc(col, 0x3a2a24, b.dmg * 0.15);
    return col;
  };
}
function plyP(seed, spray, sprayC) {
  return (f, u, v, b) => {
    if (f === 0) return 0x8a6a44;
    if (b.dmg && vnoise(u / 2 + seed, v / 2) > 1 - b.dmg * 0.3) return -1;
    let c = vnoise(u / 6 + seed, v * 1.3) > 0.55 ? 0xb48a56 : 0xc49a64;
    if (vnoise(u * 0.8 + seed, v * 3) > 0.72) c = 0x9a7446;
    const W = f === 1 ? b.w : b.d; if (u < 0.5 || u > W - 0.5) c = 0x7a5634;
    if ((u % 4) < 0.45 && (Math.abs(v - 2) < 0.4 || Math.abs(v - b.h + 2) < 0.4)) c = 0x4a4040;
    if (v < 2.5) c = mixc(c, 0x5a3a24, 0.3);
    if (spray && textAt(spray, u - 0.6, v - b.h * 0.42)) c = sprayC || 0xd2382e;
    return c;
  };
}
const palletP = (f, u, v, b) => { if (f === 0) return WOOD; const sl = Math.floor(v / 2.4), fr = v - sl * 2.4; if (fr > 1.7) return -1; const W = f === 1 ? b.w : b.d; if (u < 1 || u > W - 1 || Math.abs(u - W / 2) < 0.6) return 0x7a5636; if (b.dmg && hs(sl, Math.floor(u)) < b.dmg * 0.25) return -1; return [0xa8804e, 0x9a7044, 0xb89062][sl % 3]; };
const meshP = (f, u, v, b) => { if (f === 0) return 0x7a8288; const W = f === 1 ? b.w : b.d; if (u < 0.7 || u > W - 0.7 || v > b.h - 0.7) return 0x6a7278; const a = (u + v) % 3, c = (u - v + 40) % 3; return a < 0.5 || c < 0.5 ? (vnoise(u, v / 3) > 0.62 ? 0x8a5a3e : 0x666c72) : -1; };
const carDoorP = (c) => (f, u, v, b) => { if (f === 0) return mixc(c, HINK, 0.3); const W = f === 1 ? b.w : b.d; if (v > 7.5 && v < b.h - 1 && u > 1.2 && u < W - 1.2) return (u + v) % 1.5 < 0.4 ? 0x7a8288 : 0x2a2a30; if (Math.abs(v - 5) < 0.3 && u > W - 3 && u < W - 1.5) return 0x2a2426; let k = c; const r = vnoise(u / 2.3, v / 3); if (r > 0.6) k = mixc(k, RUST, (r - 0.6) * 2); if (v < 1.2 || u < 0.6) k = mixc(k, HINK, 0.3); return k; };
const grateP = (f, u, v, b) => { if (f === 0) return 0x5a5e62; if ((u % 2) < 0.6 || v < 1 || v > b.h - 1 || Math.abs(v - b.h / 2) < 0.4) return vnoise(u, v) > 0.6 ? RUST : 0x6a6e72; return -1; };
const sandP = (f, u, v, b) => { const W = f === 0 ? b.w : f === 1 ? b.w : b.d; const e = Math.min(u, W - u, f === 0 ? Math.min(v, b.d - v) : Math.min(v, b.h - v)); let c = e < 0.4 ? 0x7e6a48 : 0xb8a47c; if (hs(u * 3, v * 3 + f) > 0.82) c = 0xa8946c; if (f === 0 && e > 0.9) c = mixc(c, 0xfff1d6, 0.12); return c; };
const plankP = (f, u, v, b) => { if (f === 0) { const k = (b.along === 'y' ? u : v) % 2; return k < 0.3 ? 0x5a3e2a : hs(Math.floor((b.along === 'y' ? u : v) / 2), 3) > 0.5 ? 0xa87a4c : 0x9a6e44; } return v < 0.6 ? 0x5a3e2a : 0x8a5e3a; };
const woodP = (f, u, v) => (f === 0 ? WOOD_L : vnoise(u * 2, v / 3) > 0.58 ? WOOD_D : WOOD);
const stoneP = (f, u, v, b, wx, wy) => { const n = vnoise(wx / 2 + u, wy / 2 + v); return f === 0 ? (n > 0.55 ? 0xb8b2a6 : 0xa49e94) : n > 0.6 ? 0x8a847c : f === 2 ? 0x7a746e : 0x96908a; };
const canvasP = (c) => (f, u, v) => f === 0 ? ((u % 4) < 0.5 ? mixc(c, HINK, 0.2) : vnoise(u / 3, v / 3) > 0.62 ? mixc(c, 0x8a7a6a, 0.25) : c) : mixc(c, HINK, 0.15);
const soilBedP = (crop) => (f, u, v, b, wx, wy) => { if (f !== 0) return v > b.h - 0.6 ? 0x8a6a44 : vnoise(u, v) > 0.5 ? 0x8a5e3a : 0x7a5232; const row = (v % 3); if (row < 1.1) return hs(wx * 2, wy * 2) > 0.5 ? 0x5a3e2a : 0x4e3424; const h = hs(Math.floor(wx * 1.4), Math.floor(wy * 1.4)); return h < 0.18 ? -1 : h < 0.5 ? crop[0] : h < 0.85 ? crop[1] : crop[2]; };
const metalP = (c) => (f, u, v) => f === 0 ? mixc(c, 0xfff1d6, 0.08) : vnoise(u / 2, v / 2) > 0.6 ? mixc(c, RUST, 0.4) : c;
const CROPS = [[0x4f8a3a, 0x6aa244, 0xd9534f], [0x5a9a40, 0x7ab04a, 0x8a5ab8], [0x4f8a3a, 0x6aa244, 0xf2c94c], [0x4f8a3a, 0x8ab84e, 0x6aa244]];

// ---------------------------------------------------------------- building models
function winLayout(R, W, floors, doorU, opt) {
  const out = [], o = opt || {};
  for (let fl = 0; fl < floors; fl++) {
    const v = fl ? 23.5 : 5, hgt = fl ? 9.5 : 10;
    for (let u = 3.5; u + 8 < W - 2; u += 13) {
      if (!fl && doorU !== undefined && u + 8 > doorU - 1 && u < doorU + 7) continue;
      const r = R(), k = r < (o.board || 0.18) ? 'board' : r < (o.board || 0.18) + (o.broken || 0.06) ? 'broken' : 'glass';
      out.push({ u, v, w: 8, h: hgt, k, lit: R() < 0.6, cur: R() < 0.6 ? sp(R, [0xd9685c, 0xe8dcc0, 0x8fc1e3, 0xb79fd8, 0xf2c94c, 0x9fd8b4]) : 0, t: k === 'board' && R() < 0.35 ? sp(R, ['SAFE', 'OK', 'X', 'NO']) : null });
    }
  }
  return out;
}
function suburbHouse(o) {
  const R = mulberry32(o.seed + 1), { w, d, floors } = o, wall = o.wall, roof = o.roof, H = floors * 18 + 1, B = [], Z0 = 2.5;
  const doorU = Math.round(w * 0.3);
  const S = { wall, trim: o.trim || TRIM, seed: o.seed % 97, band: floors > 1 ? 18.5 : 0, wear: o.wear || 0, moss: o.moss,
    wins: { 1: winLayout(R, w, floors, doorU, o.winOpt), 2: winLayout(R, d, floors, undefined, o.winOpt) },
    door: { f: 1, u: doorU, w: 6, h: 13.5, c: sp(R, [0x7a4a36, 0x4a6a8a, 0x8a3a34, 0x5a6a4a]), k: R() < 0.15 ? 'ply' : '' },
    spray: R() < 0.12 ? { f: 2, t: sp(R, ['SAFE', 'HOLD', '3 OK']), u: 3, v: 4, c: 0xd2382e } : null };
  if (o.ruin) { for (const f of [1, 2]) for (const wn of S.wins[f]) wn.k = R() < 0.6 ? 'broken' : 'board', wn.lit = 0; S.door.k = 'ply'; }
  B.push(HB(-0.5, -0.5, 0, w + 1, d + 1, Z0, CONC, (f, u, v) => f !== 0 && hs(u * 3, v * 3) > 0.8 ? 0x8e887c : v > Z0 - 0.6 ? 0xc0baae : undefined));
  B.push(HB(0, 0, Z0, w, d, H, wall, sidingP(S)));
  const n = 6, s = (d + 3) / (2 * n);
  for (let k = 0; k < n; k++) B.push(HB(-0.6, -1.5 + k * s, Z0 + H + k * 2.3, w + 1.2, d + 3 - 2 * k * s, 2.3, roof, shingleP(roof, S.seed, o.ruin ? 0.22 : 0), { k, gable: { wall, trim: S.trim, seed: S.seed, wins: {}, z0: Z0 } }));
  B.push(HB(-0.6, d + 1.1, Z0 + H - 0.8, w + 1.2, 0.8, 0.8, 0xc8c0b4), HB(w - 0.2, d + 1.1, 1, 0.8, 0.8, H + 1, 0xb8b0a4));
  if (R() < 0.6) { const cx = 4 + R() * (w - 10); B.push(HB(cx, d * 0.3, Z0 + H, 4, 4, 15, 0x9e5040, brickP), HB(cx - 0.4, d * 0.3 - 0.4, Z0 + H + 15, 4.8, 4.8, 1.2, 0x6a6460)); o.chim = [cx + 2, d * 0.3 + 2, Z0 + H + 17]; }
  if (o.porch) {
    const px = Math.max(1, doorU - 8), pw = Math.min(w - px - 1, 22);
    B.push(HB(px, d, 0, pw, 8, 3.2, WOOD, plankP, { along: 'x' }), HB(doorU - 1, d + 8, 0, 8, 2.5, 1.6, CONC));
    for (const cx of [px + 0.4, px + pw - 1.6]) B.push(HB(cx, d + 6.6, 3.2, 1.2, 1.2, 15.5, TRIM));
    B.push(HB(px - 0.8, d - 0.4, 18.7, pw + 1.6, 9.4, 1.6, roof, shingleP(roof, S.seed + 4), { k: 1 }));
    if (pw > 12) B.push(HB(px + 1.6, d + 7.2, 3.2, Math.max(2, doorU - px - 2.6), 0.6, 6, TRIM, (f, u, v) => f !== 0 && v < 5.2 && v > 0.6 && (u % 1.6) > 0.55 ? -1 : undefined));
    if (R() < 0.25) for (let i = 0; i < 3; i++) B.push(HB(px + pw - 5 - i * 3.4, d + 2, 3.2, 3.2, 2.2, 1.9, 0xb8a47c, sandP));
  }
  if (o.solar && floors > 0) B.push(HB(w * 0.2, d / 2 + 2.5, Z0 + H + 2 * 2.3, w * 0.45, 0.6, 5, 0x2c3a5a, (f, u, v) => (u % 3) < 0.35 || (v % 2.5) < 0.35 ? 0x9aa8bc : (u + v) % 6 < 0.6 ? 0x5a7298 : 0x2c3a5a));
  if (R() < 0.25) B.push(HB(w - 6, d * 0.55, Z0 + H + 4.6, 0.6, 0.6, 3, 0x7a7a80), HB(w - 8, d * 0.55 - 1.5, Z0 + H + 7, 4, 0.6, 4, 0xd8d6d0));
  if (R() < 0.3) B.push(HB(w, d * 0.3, Z0 + 10, 2.4, 5, 4.4, 0xc8c8c0, (f, u) => f === 2 && (u * 2 | 0) % 2 ? 0x8a8a84 : undefined));
  if (R() < 0.2 && !o.ruin) B.push(HB(w * 0.6, d * 0.4, Z0 + H + 3 * 2.3, 5, 5, 6, 0x3d6f9a, (f, u, v) => f !== 0 && (Math.abs(v - 1.5) < 0.4 || Math.abs(v - 4.5) < 0.4) ? 0x2e5274 : undefined));   // roof water tank
  if (o.garage) {
    const gx = w, gw = 14, gd = Math.min(d, 22);
    B.push(HB(gx, d - gd, Z0, gw, gd, 15, wall, sidingP({ wall, trim: S.trim, seed: S.seed + 9, wins: {} })),
      HB(gx + 1.8, d - 0.05, Z0, gw - 3.6, 0.6, 12, 0xd8d2c4, (f, u, v) => f === 1 ? ((v % 2.6) < 0.4 ? 0x9a948a : v < 1.5 ? 0x8a8478 : hs(u, v) > 0.97 ? 0x6a6458 : undefined) : undefined));
    for (let k = 0; k < 3; k++) B.push(HB(gx - 0.5, d - gd - 1 + k * 1.6, Z0 + 15 + k * 1.6, gw + 1, gd + 2 - k * 3.2, 1.6, roof, shingleP(roof, S.seed + 2), { k }));
  }
  o.H = Z0 + H + n * 2.3;
  return B;
}
function civicModel(b) {
  const R = mulberry32(b.seed * 31 + 7), w = b.w, d = b.d, B = [];
  const base = () => B.push(HB(-0.5, -0.5, 0, w + 1, d + 1, 2.2, CONC));
  const gable = (wall, roof, H, S, n) => { n = n || 6; const s = (d + 3) / (2 * n); for (let k = 0; k < n; k++) B.push(HB(-0.6, -1.5 + k * s, H + k * 2.3, w + 1.2, d + 3 - 2 * k * s, 2.3, roof, shingleP(roof, b.seed), { k, gable: Object.assign({ z0: 2.2 }, S) })); };
  if (b.kind === 'barracks') {
    const S = { wall: 0x8a8a6e, trim: 0xd8d2b8, seed: 3, wins: { 1: winLayout(R, w, 1, 30, { board: 0.1 }), 2: winLayout(R, d, 1) }, door: { f: 1, u: 30, w: 7, h: 13.5, c: 0x4a5a3e }, sign: { f: 1, t: 'BARRACKS', u: 6, v: 14.5, c: 0xf2eee2, bg: 0x4a5a3e } };
    base(); B.push(HB(0, 0, 2.2, w, d, 19, S.wall, sidingP(S))); gable(S.wall, 0x5a6a50, 21.2, S, 5);
    for (let i = 0; i < 8; i++) B.push(HB(4 + i * 3.4, d + 1, 0, 3.2, 2.2, 1.9, 0xb8a47c, sandP), HB(5.6 + i * 3.4, d + 1.2, 1.9, 3.2, 2, 1.8, 0xb8a47c, sandP));
  } else if (b.kind === 'infirmary') {
    const S = { wall: 0xeeeae0, trim: 0xd8d2c4, seed: 5, wins: { 1: winLayout(R, w, 1, 18, { board: 0.05 }), 2: winLayout(R, d, 1, undefined, { board: 0.05 }) }, door: { f: 1, u: 18, w: 7, h: 13.5, c: 0x6a8a7a } };
    base(); B.push(HB(0, 0, 2.2, w, d, 18, S.wall, sidingP(S))); gable(S.wall, 0x6a7478, 20.2, S, 5);
    B.push(HB(w - 15, d, 9, 11, 0.6, 9, 0xf6f4ee, (f, u, v) => (Math.abs(u - 5.5) < 1.2 && v > 1.4 && v < 7.6) || (Math.abs(v - 4.5) < 1.2 && u > 2.4 && u < 8.6) ? 0x3a9a5a : undefined));
  } else if (b.kind === 'workshop') {
    const c = 0x8a949a; base(); B.push(HB(0, 0, 2.2, w, d, 22, c, (f, u, v, bb, wx, wy) => { if (f === 1 && ((u > 6 && u < 22) || (u > 30 && u < 46)) && v < 15) return doorPix({ w: 16, h: 15, k: 'roll' }, (u - 6) % 24, v, { trim: 0x6a6a64 }); if (f === 1 && v > 17 && v < 21 && u > 4 && u < 4 + textW('WORKSHOP') + 2) return textAt('WORKSHOP', u - 5, v - 17.4) ? 0xf2c94c : 0x3a3a3a; return corrP(c, 0.5, 4)(f, u, v, bb, wx, wy); }));
    for (let k = 0; k < 3; k++) B.push(HB(-1, -1 + k * 2, 24.2 + k * 1.2, w + 2, d + 2 - k * 4, 1.2, 0x7a8a94, corrP(0x7a8a94, 0.5, 9)));
  } else if (b.kind === 'church') {
    const S = { wall: 0xf0ece2, trim: 0xd8d0c0, seed: 9, wins: { 1: [{ u: 4, v: 7, w: 5, h: 12, k: 'glass', lit: 1, cur: 0 }, { u: w - 9, v: 7, w: 5, h: 12, k: 'glass', lit: 1 }], 2: [6, 18, 30, 42].map(u => ({ u, v: 7, w: 5, h: 12, k: 'glass', lit: 1 })) }, door: { f: 1, u: w / 2 - 4, w: 8, h: 16, c: 0x7a4a36 } };
    base(); B.push(HB(0, 0, 2.2, w, d, 24, S.wall, sidingP(S)));
    const n = 7, s = (w + 3) / (2 * n); for (let k = 0; k < n; k++) B.push(HB(-1.5 + k * s, -0.6, 26.2 + k * 2.3, w + 3 - 2 * k * s, d + 1.2, 2.3, 0x5a5458, shingleP(0x5a5458, 9), { k }));
    B.push(HB(w / 2 - 5, d - 8, 26, 10, 10, 22, S.wall, sidingP({ wall: S.wall, trim: S.trim, seed: 2, wins: { 1: [{ u: 3, v: 10, w: 4, h: 7, k: 'glass' }], 2: [{ u: 3, v: 10, w: 4, h: 7, k: 'glass' }] } })));
    for (let k = 0; k < 5; k++) B.push(HB(w / 2 - 5.5 + k, d - 8.5 + k, 48 + k * 2, 11 - k * 2, 11 - k * 2, 2, 0x5a5458));
    B.push(HB(w / 2 - 0.4, d - 3.4, 58, 0.8, 0.8, 7, 0xd8c070), HB(w / 2 - 2, d - 3.4, 62, 4, 0.8, 0.8, 0xd8c070));
  } else if (b.kind === 'school') {
    const S = { wall: 0x9e5040, trim: 0xe8e0d0, seed: 11, wins: { 1: winLayout(R, w, 1, 22, { board: 0.04 }), 2: winLayout(R, d, 1) }, door: { f: 1, u: 22, w: 7, h: 13.5, c: 0x3d6f9a }, sign: { f: 1, t: 'SCHOOL', u: 4, v: 14.5, c: 0xf2eee2, bg: 0x3d6f9a } };
    base(); B.push(HB(0, 0, 2.2, w, d, 18, S.wall, brickWallP(S))); gable(S.wall, 0x4e5a64, 20.2, Object.assign({}, S, { wall: 0xd8cfb8 }), 5);
  } else if (b.kind === 'barn' || b.kind === 'farmbarn') {
    const ruin = b.kind === 'farmbarn', wall = ruin ? 0x8a4a3a : 0xa84a3a, S = { wall, trim: 0xe8e0d0, seed: 13, vert: 1, wear: ruin ? 1 : 0, moss: ruin, wins: { 1: [], 2: [{ u: d / 2 - 4, v: 14, w: 8, h: 7, k: ruin ? 'broken' : 'glass' }] }, door: { f: 1, u: w / 2 - 7, w: 14, h: 16, c: mixc(wall, HINK, 0.25) } };
    base(); B.push(HB(0, 0, 2.2, w, d, 20, wall, sidingP(S))); gable(wall, ruin ? 0x5a5048 : 0x6a5a50, 22.2, S, 7);
    if (ruin) B.push(HB(w * 0.6, d * 0.3, 22.2, 8, 10, 6, 0x2a2224));
  } else if (b.kind === 'kitchen') {
    base(); B.push(HB(0, 0, 2.2, w, d, 15, 0x9e5040, brickP)); for (let k = 0; k < 3; k++) B.push(HB(-1, -1 + k * 2, 17.2 + k * 1.4, w + 2, d + 2 - k * 4, 1.4, 0x7a8a94, corrP(0x7a8a94, 0.5, 3)));
    B.push(HB(w - 8, 4, 17, 4, 4, 14, 0x9e5040, brickP)); b.chim = [w - 6, 6, 31];
  } else if (b.kind === 'ruin') {
    return suburbHouse({ w, d, floors: b.ruin === 2 ? 1 : 2, wall: mixc(sp(R, HOUSE_WALLS), 0x8a8a80, 0.45), roof: 0x5a5452, seed: b.seed, ruin: 1, wear: 1, moss: 1, porch: b.ruin === 1 });
  } else if (b.kind === 'collapsed') {
    const S = (s) => ({ wall: 0x8a8a7a, trim: 0xb8b0a0, seed: s, wear: 1, moss: 1, wins: { 1: [{ u: 6, v: 6, w: 7, h: 9, k: 'broken' }, { u: 24, v: 6, w: 7, h: 9, k: 'board' }], 2: [{ u: 10, v: 4, w: 7, h: 8, k: 'broken' }] } });
    B.push(HB(0, 0, 0, w, d, 2.4, CONC), HB(0, 0, 2.4, w, 1.4, 22, 0x8a8478, sidingP(S(3))), HB(0, 0, 2.4, 1.4, d, 15, 0x7a786c, sidingP(S(5))), HB(w - 1.4, 0, 2.4, 1.4, d, 9, 0x7a786c, sidingP(S(6))));
    B.push(HB(3, 3, 2.4, 10, 8, 5, 0x3a302c), HB(18, 10, 2.4, 14, 6, 3, 0x4a3a30), HB(6, 16, 2.4, 6, 12, 2, 0x5a4a3a), HB(26, 18, 2.4, 9, 8, 6, 0x3a3230));
  } else if (b.kind === 'block') {
    const h = b.h, c = sp(R, [0xb8b0a0, 0xa8a49a, 0xc8bca8]);
    B.push(HB(0, 0, 0, w, d, h, c, (f, u, v, bb, wx, wy) => { if (f === 0) return 0x8a847a; if (v > h - 6 && vnoise(u / 3 + b.seed, 1) > 0.55 && v > h - 6 + vnoise(u / 2, 3) * 6) return -1; const W = f === 1 ? bb.w : bb.d; if ((u % 6) > 1.5 && (u % 6) < 4.5 && (v % 8) > 2.5 && (v % 8) < 6.5 && u > 1 && u < W - 1) return hs(Math.floor(u / 6), Math.floor(v / 8)) < 0.3 ? 0x2a2a30 : 0x404650; let k = vnoise(u / 4, v / 6) > 0.62 ? mixc(c, 0x6a6458, 0.3) : c; if (v < 4) k = mixc(k, 0x4a5a30, 0.4); return k; }));
    B.push(HB(w * 0.2, d + 1, 0, 8, 6, 3, 0x8a847a, stoneP), HB(w * 0.6, d + 2, 0, 6, 5, 2, 0x96908a, stoneP));
  }
  return B;
}
// ---------------------------------------------------------------- props
const PROPS = {
  truck: (o) => { const c = o.c; return [...carBoxes(c, 0), HB(19, 0.5, 1.6, 9, 8, 6, mixc(c, HINK, 0.15), (f) => f === 0 ? mixc(c, HINK, 0.4) : undefined), HB(20, 1.5, 7.6, 7, 3, 3, 0x9a8a62), HB(23, 4.5, 7.6, 3, 3, 4, 0x7a5a3a)]; },
  car: (o) => carBoxes(o.c, o.wreck),
  bus: () => [HB(0, 0, 0, 44, 12, 15, 0xb8963e, (f, u, v, b) => { if (f === 0) return vnoise(u / 4, v / 3) > 0.55 ? RUST : 0xa8863a; if (v > 7 && v < 12 && (u % 5) > 1 && f === 1) return hs(Math.floor(u / 5), 2) < 0.5 ? 0x1e1a1e : 0x3a4048; if (vnoise(u / 3, v / 2) > 0.6) return mixc(0xb8963e, RUST, 0.6); if (v < 2) return 0x2a2626; return undefined; })],
  crates: () => [HB(0, 0, 0, 5, 5, 4, 0xc98a4a, (f, u, v) => f !== 0 && (v | 0) % 2 === 0 ? 0xa8703a : undefined), HB(5.5, 0.5, 0, 5, 5, 4, 0x6a7a5a, (f, u, v) => f !== 0 && (v | 0) % 2 === 0 ? 0x5a6a4a : undefined), HB(2.5, 0.5, 4, 5, 5, 3.6, 0xc98a4a)],
  bell: () => [HB(0, 0, 0, 1.4, 1.4, 24, WOOD_D, woodP), HB(-2, 0, 22, 6, 1.4, 1.4, WOOD_D), HB(1.4, 0.2, 17, 2, 1, 4, 0xc8a040, (f, u, v) => v < 0.6 ? 0x8a6a2a : undefined)],
  stall: (o) => { const c = o.c; return [HB(0, 0, 0, 12, 7, 5, 0x8a6a4a, (f, u) => f !== 0 && (u | 0) % 4 === 0 ? 0x6b4f34 : undefined), HB(0.5, 0.5, 5, 11, 6, 1.6, 0x6b4f34, (f, u, v) => { const h = hash2(u * 1.3 + o.v * 7, v * 1.3 + f); return h < 0.3 ? [0xd9534f, 0xf2c94c, 0x58994f, 0xf08a2b, 0x9a6a44][(h * 17 | 0) % 5] : undefined; }), HB(0, 0, 0, 0.8, 0.8, 13, WOOD_D), HB(11.2, 0, 0, 0.8, 0.8, 13, WOOD_D), HB(0, 6.2, 0, 0.8, 0.8, 11, WOOD_D), HB(11.2, 6.2, 0, 0.8, 0.8, 11, WOOD_D), HB(-1, -1, 13, 14, 9, 1.2, c, (f, u) => f === 0 ? ((u / 2.4 | 0) % 2 ? c : 0xf4f1e8) : mixc(c, HINK, 0.2))]; },
  tent: (o) => { const c = o.c, B = []; for (let k = 0; k < 4; k++) B.push(HB(k * 1.6, 0, k * 2.2, 14 - k * 3.2, 12, 2.2, c, canvasP(c), { k })); return B; },
  messtent: () => { const c = 0xd8ccae, B = []; for (const [x, y] of [[0, 0], [38, 0], [0, 24], [38, 24]]) B.push(HB(x, y, 0, 1, 1, 15, WOOD_D)); for (let k = 0; k < 4; k++) B.push(HB(-1, -1 + k * 3, 15 + k * 2, 41, 27 - k * 6, 2, c, canvasP(c))); return B; },
  firepit: () => { const B = []; for (let a = 0; a < 8; a++) B.push(HB(Math.cos(a / 8 * TAU) * 5 - 1, Math.sin(a / 8 * TAU) * 5 - 1, 0, 2, 2, 1.6, 0x8a847c, stoneP)); B.push(HB(-3, -0.6, 0, 6, 1.2, 1.2, 0x5a3a2a), HB(-0.6, -3, 0, 1.2, 6, 1.2, 0x6a4a32)); return B; },
  table: () => [HB(0, 0, 3, 20, 7, 1.4, WOOD, plankP, { along: 'x' }), HB(1, 1, 0, 1, 1, 3, WOOD_D), HB(18, 5, 0, 1, 1, 3, WOOD_D), HB(0, -3.6, 0, 20, 2.4, 2.6, WOOD_D, plankP, { along: 'x' }), HB(0, 8.2, 0, 20, 2.4, 2.6, WOOD_D, plankP, { along: 'x' })],
  bench: () => [HB(0, 0, 0, 10, 3, 3, WOOD, plankP, { along: 'x' }), HB(0, -0.6, 3, 10, 0.8, 4, WOOD_D)],
  swings: () => [HB(0, 0, 0, 1, 1, 16, 0xb84a3a), HB(18, 0, 0, 1, 1, 16, 0xb84a3a), HB(0, 0, 16, 19, 1, 1, 0xb84a3a), HB(5, 0.3, 4, 3, 0.5, 0.6, 0x3a3a3a), HB(12, 0.3, 4, 3, 0.5, 0.6, 0x3a3a3a)],
  slide: () => [HB(0, 0, 0, 4, 4, 10, 0x3d6f9a), HB(4, 0.6, 0, 10, 2.8, 2, 0xf2c94c, (f, u, v, b) => f === 0 ? 0xf2c94c : undefined), HB(4, 0.6, 2, 3, 2.8, 6, 0xf2c94c), HB(7, 0.6, 2, 3, 2.8, 3, 0xf2c94c)],
  sandbox: () => [HB(0, 0, 0, 14, 10, 1.6, WOOD, (f) => f === 0 ? 0xe0cc94 : undefined)],
  rack: () => [HB(0, 0, 0, 10, 1.4, 9, WOOD_D, (f, u, v) => f === 1 && (u % 2.5) < 0.6 && v > 2 ? 0x2e2c30 : undefined)],
  scrap: () => [HB(0, 0, 0, 10, 8, 3, 0x7a6a5a, metalP(0x7a6a5a)), HB(2, 2, 3, 6, 4, 3, 0x8a5a3a, metalP(0x8a5a3a)), HB(6, 4, 0, 3, 7, 5, 0x5a6a7a, metalP(0x5a6a7a))],
  drumfire: () => [HB(-2, -2, 0, 4, 4, 7, 0x6a4a3a, (f, u, v) => f === 0 ? 0x2a1e1a : (Math.abs(v - 2) < 0.3 || Math.abs(v - 5) < 0.3) ? 0x4a3226 : vnoise(u, v / 2) > 0.55 ? RUST : undefined)],
  memorial: () => { const B = []; for (let i = 0; i < 5; i++) B.push(HB(i * 3.2, (i % 2) * 1.5, 0, 2.2, 1.4, 4 + (i % 3), 0x9a948c, stoneP)); B.push(HB(-1, 5, 0, 17, 4, 1, 0x7a8a4a)); return B; },
  rv: () => [HB(0, 0, 1.6, 28, 11, 13, 0xe2ded0, (f, u, v, b) => { if (f === 0) return 0xc8c4b8; if (Math.abs(v - 5.5) < 0.8) return 0xb06a46; if (f === 1 && v > 7 && v < 10.5 && (u % 7) > 2 && (u % 7) < 5.5) { EM = 0xffd38a; return 0x6a7a8a; } if (v < 1) return 0x5a5a5a; return undefined; }), HB(3, 0, 0, 3, 1, 2.4, 0x2a2626), HB(21, 0, 0, 3, 1, 2.4, 0x2a2626)],
  watertower: () => { const B = []; for (const [x, y] of [[0, 0], [9, 0], [0, 9], [9, 9]]) B.push(HB(x, y, 0, 1.4, 1.4, 30, WOOD_D, woodP)); B.push(HB(-1, -1, 30, 12.4, 12.4, 2, WOOD), HB(0, 0, 32, 10.4, 10.4, 14, 0x9a7a52, (f, u, v) => f === 0 ? 0x6a5a48 : (v % 4.5) < 0.6 ? 0x4a3a30 : vnoise(u, v / 3) > 0.6 ? 0x8a6a46 : undefined)); return B; },
  turbine: () => [HB(0, 0, 0, 1.2, 1.2, 46, 0xd8d6d0), HB(-1, -1, 46, 3.2, 3.2, 3, 0xc8c6c0)],
  greenhouse: () => [HB(0, 0, 0, 26, 16, 12, 0xbcd8d4, (f, u, v, b) => { if (f === 0) return (u % 4) < 0.5 || (v % 4) < 0.5 ? 0x8a9a96 : 0xcfe4e0; if ((u % 4) < 0.5 || (v % 4) < 0.5) return 0x8a9a96; if (v < 5 && hs(Math.floor(u), 3) > 0.4) return 0x5a9a48; return (u + v) % 7 < 1 ? 0xe6f4f2 : 0xa8cac6; })],
  coop: () => [HB(0, 0, 0, 14, 10, 8, 0x8a6a4a, (f, u, v) => f === 1 && u > 2 && u < 12 && v > 1.5 && v < 6.5 ? ((u + v) % 1.6 < 0.3 || (u - v + 20) % 1.6 < 0.3 ? 0xb8b0a8 : 0x3a302c) : undefined), HB(-1, -1, 8, 16, 12, 1.6, 0x7a8a94, corrP(0x7a8a94, 0.6, 9))],
  pen: () => { const B = []; for (let i = 0; i <= 4; i++) B.push(HB(i * 6, 0, 0, 1, 1, 7, WOOD_D), HB(i * 6, 14, 0, 1, 1, 7, WOOD_D)); B.push(HB(0, 0, 5, 25, 0.6, 0.8, WOOD), HB(0, 14, 5, 25, 0.6, 0.8, WOOD), HB(0, 0, 2.5, 25, 0.6, 0.8, WOOD), HB(0, 14, 2.5, 25, 0.6, 0.8, WOOD), HB(0, 0, 5, 0.6, 15, 0.8, WOOD), HB(24, 0, 5, 0.6, 15, 0.8, WOOD)); return B; },
  hive: () => [HB(0, 0, 0, 4, 4, 2, WOOD_D), HB(0, 0, 2, 4, 4, 4, 0xe0c060, (f, u, v) => f !== 0 && (v % 2) < 0.4 ? 0xb89a40 : undefined)],
  smokehouse: () => [HB(0, 0, 0, 12, 10, 12, 0x6a4a34, plankP, { along: 'y' }), HB(-1, -1, 12, 14, 12, 1.4, 0x6a7478, corrP(0x6a7478, 0.7, 5))],
  fence: (o) => [HB(0, 0, 0, o.w, 0.8, 7, TRIM, (f, u, v) => { if (f === 0) return TRIM; if (v > 5.4 && (u % 2) > 1.1) return -1; if ((u % 2) > 1.1 && v > 1.4 && v < 5.4) return -1; if (v < 1.2) return mixc(TRIM, 0x6a5a4a, 0.4); return hs(u * 2, v) > 0.9 ? 0xc8c0ae : undefined; })],
  bed: (o) => [HB(0, 0, 0, 8, 16, 3.2, 0x8a5e3a, soilBedP(CROPS[o.v % 4]))],
  barrel: () => [HB(0, 0, 0, 4.4, 4.4, 8, 0x3d6f9a, (f, u, v) => f !== 0 && (Math.abs(v - 2) < 0.4 || Math.abs(v - 6) < 0.4) ? 0x2e5274 : undefined)],
  laundry: (o) => { const B = [HB(0, 0, 0, 1, 1, 17, WOOD_D), HB(o.w, 0, 0, 1, 1, 17, WOOD_D), HB(0, 0.2, 16, o.w + 1, 0.4, 0.4, 0xe8e2d4)]; const cs = [0xd9685c, 0xf4f1e8, 0x3d6fb5, 0xf2c94c, 0x9fd8b4, 0x8a5ab8]; for (let i = 0; i * 6 + 6 < o.w; i++) { const c = cs[(i + (o.x | 0)) % cs.length]; B.push(HB(2 + i * 6, 0, 9 + (i % 2), 4.6 - (i % 2), 0.5, 7 - (i % 2) * 2, c, (f, u) => f === 1 && (u * 2 | 0) % 3 === 0 ? mixc(c, HINK, 0.15) : undefined)); } return B; },
  woodpile: () => [HB(0, 0, 0, 14, 5, 6, WOOD, (f, u, v) => f === 2 ? ((Math.hypot((u % 2.2) - 1.1, (v % 2.2) - 1.1) < 0.8) ? 0xc8a06a : 0x6a4a32) : f === 0 ? WOOD_L : (v % 2.2 < 0.4 ? 0x5a3e2a : vnoise(u, v) > 0.5 ? WOOD : WOOD_D))],
  bike: () => [HB(0, 0, 0, 9, 0.6, 3, 0x2a2626, (f, u) => (u > 2 && u < 7) ? -1 : undefined), HB(2, 0, 3, 6, 0.6, 1, 0xb84a3a), HB(7, 0, 3, 1, 0.6, 3, 0x3a3a3a)],
  mailbox: () => [HB(0, 0, 0, 0.8, 0.8, 8, WOOD_D), HB(-1.2, -0.6, 8, 3.2, 2.2, 2.6, 0x5a6a7a)],
  bins: () => [HB(0, 0, 0, 4, 4, 6, 0x4a6a4a, (f, u, v) => f === 0 ? 0x3a5a3a : undefined), HB(4.4, 0, 0, 4, 4, 6, 0x4a4e5a, (f) => f === 0 ? 0x3a3e4a : undefined)],
  lamp: () => [HB(-0.6, -0.6, 0, 1.2, 1.2, 22, 0x3a4a44), HB(-1.8, -1.8, 22, 3.6, 3.6, 3, 0xfff4c0, null, { em: 0xffe9a0 }), HB(-2.2, -2.2, 25, 4.4, 4.4, 1, 0x3a4a44)],
  pole: () => [HB(-0.8, -0.8, 0, 1.6, 1.6, 40, 0x7a6a56, woodP), HB(-4, -0.5, 35, 8, 1, 1, 0x5a4a3a)],
  hedgehog: () => [HB(-4, -0.5, 0, 8, 1, 1.2, 0x5a5050), HB(-0.5, -4, 0, 1, 8, 1.2, 0x5a5050), HB(-0.6, -0.6, 0, 1.2, 1.2, 8, 0x6a5e5a), HB(-3, -0.5, 4, 6, 1, 1, 0x5a5050)],
  stump: () => [HB(-1.6, -1.6, 0, 3.2, 3.2, 2, 0x8a6a4a, (f, u, v) => f === 0 ? (Math.hypot(u - 1.6, v - 1.6) % 0.8 < 0.3 ? 0xa8845a : 0xc8a070) : undefined)],
  rock: (o) => { const r = o.r; return [HB(-r, -r * 0.8, 0, r * 2, r * 1.6, r * 0.9, 0x96908a, stoneP), HB(-r * 0.6, -r * 0.5, r * 0.9, r * 1.2, r, r * 0.5, 0xa49e94, stoneP)]; },
  gasstation: () => { const B = []; for (const [x, y] of [[0, 0], [24, 0], [0, 14], [24, 14]]) B.push(HB(x, y, 0, 1.4, 1.4, 16, 0xc8c4ba)); B.push(HB(-2, -2, 16, 28, 18, 2.4, 0xe0dcd0, (f, u, v) => f !== 0 ? ((u % 6) < 3 ? 0xb84a3a : 0xe0dcd0) : vnoise(u / 4, v / 4) > 0.62 ? 0x9a948a : undefined)); B.push(HB(8, 6, 0, 2.4, 1.6, 6, 0xb84a3a), HB(16, 6, 0, 2.4, 1.6, 6, 0xb84a3a)); B.push(HB(30, -2, 0, 16, 14, 14, 0xd8d0c0, sidingP({ wall: 0xd8d0c0, trim: 0xb84a3a, seed: 21, wear: 1, moss: 1, wins: { 1: [{ u: 2, v: 3, w: 9, h: 8, k: 'broken' }], 2: [{ u: 3, v: 3, w: 7, h: 8, k: 'board' }] }, sign: { f: 1, t: 'GAS', u: 3, v: 11.5, c: 0xf2eee2, bg: 0xb84a3a } }))); B.push(HB(48, 4, 0, 1.6, 1.6, 30, 0x8a8a8a), HB(45, 4, 26, 8, 1.4, 8, 0xb84a3a, (f, u, v) => f === 1 && textAt('GAS', u - 1.5, v - 1.5) ? 0xf2eee2 : undefined)); return B; },
  silo: () => { const B = []; for (let k = 0; k < 4; k++) B.push(HB(k < 2 ? 0 : 1, k < 2 ? 0 : 1, k * 9, k < 2 ? 12 : 10, k < 2 ? 12 : 10, 9, 0xb8b4aa, (f, u, v) => (v % 3) < 0.5 ? 0x8a867c : vnoise(u, v) > 0.6 ? RUST : undefined)); return B; },
  mast: () => [HB(0, 0, 0, 3, 3, 90, 0xb84a3a, (f, u, v) => { if (f === 0) return 0x8a3a2a; if ((u + v * 0.8) % 2.4 < 0.6 || (u - v * 0.8 + 40) % 2.4 < 0.6 || u < 0.5 || u > 2.5) return ((v / 12) | 0) % 2 ? 0xe8e2d4 : 0xb84a3a; return -1; })],
  shed: () => [HB(0, 0, 0, 14, 12, 10, 0x8a949a, corrP(0x8a949a, 0.7, 6)), HB(-1, -1, 10, 16, 14, 1.4, 0x6a7a84, corrP(0x6a7a84, 0.7, 7))],
  dock: (o) => [HB(0, 0, 1, 6, o.len, 1.6, WOOD, plankP, { along: 'y' }), HB(0, o.len - 1, -4, 1, 1, 6, WOOD_D), HB(5, o.len - 1, -4, 1, 1, 6, WOOD_D), HB(0, o.len * 0.5, -4, 1, 1, 6, WOOD_D), HB(5, o.len * 0.5, -4, 1, 1, 6, WOOD_D)],
  lights: () => []
};
function carBoxes(c, wreck) {
  const bodyP = (f, u, v, b) => { if (f === 0) return vnoise(u / 3, v / 3) > 0.6 && wreck ? mixc(c, RUST, 0.5) : mixc(c, 0xfff1d6, 0.12); let k = c; if (wreck && vnoise(u / 2.5, v / 2) > 0.58) k = mixc(k, RUST, 0.55); if (v < 1) k = mixc(k, HINK, 0.4); if (f === 1 && Math.abs(u - b.w * 0.5) < 0.25) k = mixc(k, HINK, 0.35); return k; };
  return [HB(1, 0.5, 0, 3, 1, 3, 0x2a2628), HB(14, 0.5, 0, 3, 1, 3, 0x2a2628), HB(1, 8.5, 0, 3, 1, 3, 0x2a2628), HB(14, 8.5, 0, 3, 1, 3, 0x2a2628), HB(0, 0, 1.6, 19, 9, 5, c, bodyP),
    HB(4, 0.5, 6.6, 9, 8, 4.2, c, (f, u, v, b) => { if (f === 0) return wreck ? mixc(c, RUST, 0.4) : mixc(c, 0xfff1d6, 0.1); if (v > 0.6 && v < 3.6 && u > 0.8 && u < (f === 1 ? b.w : b.d) - 0.8) { const cr = wreck && Math.abs((u - 3) - (v - 1) * 1.5) < 0.25; return cr ? 0xc8d4dc : (u + v) % 4 < 0.6 ? 0x6a7a8a : 0x2a3038; } return c; })];
}

// ---------------------------------------------------------------- wall pieces, tower, gate
// shape: list of half-directions from the tile centre: 'E','W','S','N' (world +x,-x,+y,-y); dmg 0 intact, 1 damaged, 2 breached
function wallBoxes(s, shape, dmg) {
  const B = [], h = s.kind === 'culvert' ? 13 : s.h, th = 1.4, c0 = [GALV, 0xb0583a, 0x5f86a8, 0x7a9a6a, 0xb8b8b0][s.seed % 5];
  if (dmg === 2) {   // breach: twisted sheet + rubble
    B.push(HB(-3, -2, 0, 6, 4, 1.6, 0x8a7a6a, metalP(0x8a7a6a)), HB(-1, 0, 0, 5, 2, 3, c0, metalP(c0)), HB(-4, 1, 0, 3, 3, 1.2, WOOD, woodP));
    return B;
  }
  const pnt = () => s.kind === 'ply' ? plyP(s.seed, s.seed % 2 ? 'NO ENTRY' : 'KEEP OUT') : s.kind === 'pallet' ? palletP : s.kind === 'mesh' ? meshP : s.kind === 'door' ? carDoorP(0x9a4038) : s.kind === 'culvert' ? grateP : corrP(c0, [0.45, 0.8, 0.35, 0.55, 0.3][s.seed % 5], s.seed);
  for (const dd of shape) {
    let x, y, w, d;
    if (dd === 'E') { x = 0; y = -th / 2; w = 4.2; d = th; } else if (dd === 'W') { x = -4.2; y = -th / 2; w = 4.2; d = th; }
    else if (dd === 'S') { x = -th / 2; y = 0; w = th; d = 4.2; } else { x = -th / 2; y = -4.2; w = th; d = 4.2; }
    B.push(HB(x, y, 0, w, d, h, c0, pnt(), { dmg, spray: s.spray, sprayC: s.sprayC }));
    // razor wire on top + outward stake tips
    B.push(HB(x, y, h + 2.2, w, d, 0.6, 0xb8bcc0, (f, u) => (u % 1.4) < 0.5 ? 0xe0e4e6 : (u % 1.4) < 0.9 ? -1 : undefined));
  }
  B.push(HB(-0.9, -0.9, 0, 1.8, 1.8, h + 4, WOOD, woodP));
  if (s.weak && dmg === 0 && s.kind !== 'culvert') for (let i = 0; i < 2; i++) B.push(HB(-3 + i * 3.4, 1.2, 0, 3.2, 2.2, 1.8, 0xb8a47c, sandP));
  return B;
}
function stakeBoxes(shape) { const B = []; for (const dd of shape) { const ox = dd === 'E' ? 2 : dd === 'W' ? -2 : 0, oy = dd === 'S' ? 2 : dd === 'N' ? -2 : 0; B.push(HB(ox - 0.5, oy - 3.6, 0, 1.1, 1.1, 16 + (ox + oy + 8) % 5, WOOD_D, (f, u, v, b) => v > b.h - 2 ? 0xd8b48a : undefined)); } return B; }
function towerBoxes() {
  const h = 46, s = 18, back = [], front = [];
  for (const [a, b] of [[0, 0], [s - 2, 0], [0, s - 2], [s - 2, s - 2]]) back.push(HB(a, b, 0, 2, 2, h, WOOD, woodP));
  for (const z of [13, 29]) back.push(HB(0, 0.4, z, s, 1.2, 1.6, WOOD_D, woodP), HB(0.4, 0, z + 1.6, 1.2, s, 1.6, WOOD_D, woodP), HB(0, s - 1.6, z, s, 1.2, 1.6, WOOD_D, woodP), HB(s - 1.6, 0, z + 1.6, 1.2, s, 1.6, WOOD_D, woodP));
  back.push(HB(s * 0.5 - 3, s, 0, 0.8, 0.8, h + 2, WOOD_L), HB(s * 0.5 + 2.2, s, 0, 0.8, 0.8, h + 2, WOOD_L), HB(s * 0.5 - 2.2, s + 0.1, 0, 4.4, 0.4, h, WOOD_L, (f, u, v) => f === 1 && (v % 3) > 0.7 ? -1 : undefined));
  back.push(HB(-1, -1, h, s + 2, s + 2, 2.2, WOOD, plankP, { along: 'y' }));
  back.push(HB(-1, -1, h + 2.2, s + 2, 1, 11, 0xa86a4a, corrP(0xa86a4a, 0.8, 3)), HB(-1, -1, h + 2.2, 1, s + 2, 11, GALV, corrP(GALV, 0.5, 7)));
  back.push(HB(-1, -1, h + 13, 1.2, 1.2, 12, WOOD_D), HB(s - 0.2, -1, h + 13, 1.2, 1.2, 12, WOOD_D));
  for (let k = 0; k < 3; k++) back.push(HB(-1.5, -1.5 + k * 2.4, h + 25 - k * 1.6, s + 3, 3, 1.6, 0x4f6f8f, (f, u, v) => f === 0 ? (vnoise(u / 3, v + k) > 0.55 ? 0x5c7c9c : 0x4f6f8f) : 0x3e5a76));
  back.push(HB(s - 2, 3, h + 18, 1.6, 1.6, 2.4, 0xfff0c0, null, { em: 0xffd98a }));
  for (let i = 0; i < 5; i++) front.push(HB(i * 3.8, s - 1.2, h + 2.2, 3.6, 2.2, 2.2, 0xb8a47c, sandP), HB(s - 1.2, i * 3.8 + 0.2, h + 2.2, 2.2, 3.6, 2.2, 0xb8a47c, sandP));
  return { back, front };
}
function gateFrameBoxes() {   // gate spans 24 units along x; posts + painted HOLDFAST sign
  return [HB(-1.2, -1.4, 0, 2.4, 2.8, 26, WOOD, woodP), HB(22.8, -1.4, 0, 2.4, 2.8, 26, WOOD, woodP),
    HB(-6, -0.6, 22, 36, 1.2, 6.4, 0xb08a5a, (f, u, v) => f === 1 && textAt('HOLDFAST', u - (36 - textW('HOLDFAST')) / 2, v - 0.8) ? 0xf6f0e0 : f === 1 && (v < 0.5 || v > 5.9 || u < 0.6 || u > 35.4) ? 0x6a4a32 : undefined)];
}
function gateLeafBoxes() {
  return [HB(0, -0.7, 0.4, 12, 1.4, 17, 0x5a5e64, (f, u, v, b) => { if (f === 0) return 0x4a4e54; if (u < 0.8 || u > 11.2 || v < 0.8 || v > 16.2) return 0x3a3e44; const d1 = Math.abs((u - 0.8) - (v - 0.8) * 10.4 / 15.4), d2 = Math.abs((u - 0.8) - (16.2 - v) * 10.4 / 15.4); if (d1 < 0.6 || d2 < 0.6) return 0xd8b040; if ((u % 2.4) < 0.4) return 0x6a6e74; return vnoise(u / 2, v / 3) > 0.62 ? mixc(0x5a5e64, RUST, 0.5) : undefined; })];
}

// ---------------------------------------------------------------- characters
// Saigon's drawPerson calls these ev* hooks only when L.ev is set; Holdfast uses them for infected, guards and work gear.
function evBehind(X) { if (X.L.pack2 && !X.back) { const c = grade(0x6a5a3a); X.rect(X.cx - 9, X.torsoTop, X.cx - 6, X.legTop + 1, c, 0, X.cx - 7, clothSh(c)); } }
function evTorso(X) {
  const L = X.L, { rect, put, cx, torsoTop: tt, legTop: lt } = X;
  if (L.ev === 'zombie') {
    for (let y = tt + 2; y < lt + 1; y++) for (let x = cx - 6; x <= cx + 6; x++) { const h = hash2(x * 3 + L.seed, y * 5); if (h < 0.1) put(x, y, x >= cx + 3 ? X.sS : X.skin, 5); else if (h > 0.86) put(x, y, mixc(X.top, 0x2b1a16, 0.35), 5); }
    for (let x = cx - 6; x <= cx + 6; x++) if (hash2(x + L.seed, 9) < 0.45) put(x, lt, -1, 5);
  }
  if (L.ev === 'guard') { const v = grade(0x4e5a3e); rect(cx - 5, tt + 1, cx + 5, lt - 1, v, 6, cx + 3, clothSh(v)); rect(cx - 4, lt - 4, cx - 2, lt - 2, grade(0x3a4430), 6); rect(cx + 1, lt - 4, cx + 3, lt - 2, grade(0x3a4430), 6); rect(cx - 5, lt - 1, cx + 6, lt - 1, grade(0x2e2a24), 6); }
  if (L.ev === 'builder') { const v = grade(0xe8b83a); rect(cx - 5, tt + 1, cx - 3, lt - 1, v, 6); rect(cx + 2, tt + 1, cx + 4, lt - 1, v, 6, cx + 4, clothSh(v)); rect(cx - 5, tt + 5, cx + 4, tt + 5, grade(0xf4f1e8), 6); rect(cx - 6, lt - 1, cx + 6, lt, grade(0x5a3a24), 6); }
  if (L.ev === 'medic') { const v = grade(0xf2f0ea); rect(cx - 5, tt + 1, cx + 5, lt - 1, v, 6, cx + 3, clothSh(v)); rect(cx - 1, tt + 3, cx + 1, tt + 7, grade(0x3a9a5a), 7); rect(cx - 3, tt + 4, cx + 3, tt + 6, grade(0x3a9a5a), 7); }
  if (L.ev === 'cook') { rect(cx - 4, tt + 3, cx + 4, lt + 3, 0xf4ecda, 6, cx + 2, 0xd8ccb4); }
  if (L.pack2 && X.back) { const c = grade(0x6a5a3a); rect(cx - 5, tt + 1, cx + 5, lt - 1, c, 7, cx + 3, clothSh(c)); rect(cx - 4, tt + 3, cx + 4, tt + 4, grade(0x4a3e2a), 7); }
}
function evFace(X, ex1, ex2, ey, eh) {
  const L = X.L, { rect, put, cx } = X;
  if (L.ev === 'zombie') { rect(ex1 - 1, ey - 1, ex1 + 2, ey + eh, 0x3e3438, 10); rect(ex2 - 1, ey - 1, ex2 + 2, ey + eh, 0x3e3438, 10); put(ex1, ey + 1, 0xd8d4a0, 11); put(ex2 + 1, ey + 1, 0xd8d4a0, 11); rect(cx + 1, ey + eh + 1, cx + 4, ey + eh + 3, 0x3a2024, 11); put(cx + 2, ey + eh + 1, 0xe8e0c8, 11); }
}
function evHat() { }
function evCarry() { }
function evOver(X, hx, hy, raise) {
  const L = X.L, { rect, put, cx, torsoTop: tt, legTop: lt, back } = X;
  if (L.ev === 'zombie' && !raise) { const a = X.skin, s = X.sS; for (let x = cx - 3; x <= cx + 9; x++) { put(x, tt + 4, a, 14); put(x, tt + 5, x > cx + 5 ? s : a, 14); } rect(cx + 10, tt + 3, cx + 11, tt + 6, a, 14, cx + 11, s); }
  const M = 0x2e2c30, Wd = grade(0x7a5234);
  if (L.gun === 'aim') { for (let i = 0; i < 17; i++) { const x = cx + 6 - i, y = tt + 3 - Math.round(i * 0.42); put(x, y, i < 6 ? Wd : M, 15); if (i < 12) put(x, y + 1, i < 6 ? clothSh(Wd) : 0x48464c, 15); } }
  else if (L.gun === 'sling') { for (let i = 0; i < 15; i++) { const x = cx - 6 + Math.round(i * 0.8), y = lt + 1 - i; put(x, y, i < 5 ? Wd : M, back ? 0 : 15); } }
  else if (L.gun === 'carry') { for (let i = 0; i < 16; i++) { const x = cx - 5 + i, y = lt - 1 - Math.round(i * 0.45); put(x, y, i < 6 ? Wd : M, 15); put(x, y + 1, i < 6 ? clothSh(Wd) : 0x48464c, 15); } }
  else if (L.gun === 'pistol') { rect(hx, hy - 1, hx + 4, hy, M, 15); put(hx, hy + 1, M, 15); }
  else if (L.gun === 'spear') { for (let i = 0; i < 26; i++) put(hx + 2 + Math.round(i * 0.55), hy + 4 - i, i > 22 ? 0xc8c8c8 : Wd, 15); }
  if (L.tool === 'hammer' && raise) { const x0 = cx + 6, y0 = tt - 12; rect(x0, y0 - 6, x0 + 1, y0, grade(0x8a5a34), 15); rect(x0 - 2, y0 - 8, x0 + 3, y0 - 6, 0x5a5a62, 15, x0 + 2, 0x3a3a40); }
  if (L.tool === 'hoe') { if (raise) { for (let i = 0; i < 18; i++) put(cx + 7 - Math.round(i * 0.1), tt - 12 + i, grade(0x8a5a34), 15); rect(cx + 4, tt - 13, cx + 9, tt - 12, 0x5a5a62, 15); } else { for (let i = 0; i < 22; i++) put(hx + 1 + Math.round(i * 0.45), hy - 9 + i, grade(0x8a5a34), 15); rect(hx + 9, hy + 11, hx + 13, hy + 12, 0x5a5a62, 15); } }
  if (L.tool === 'plank') { rect(0, tt - 4, X.W - 1, tt - 2, grade(0xc49a64), 15, X.W - 6, grade(0x9a7446)); }
  if (L.tool === 'crate') { rect(hx - 3, hy - 3, hx + 4, hy + 3, grade(0xc98a4a), 15, hx + 2, grade(0xa8703a)); rect(hx - 3, hy, hx + 4, hy, grade(0x8a5a2a), 15); }
  if (L.tool === 'basket') { rect(hx - 2, hy, hx + 4, hy + 4, grade(0xb8904a), 15, hx + 3, grade(0x8a6a34)); rect(hx - 1, hy - 1, hx + 3, hy - 1, grade(0x6aa244), 15); }
  if (L.tool === 'bucket') { rect(hx - 1, hy + 1, hx + 3, hy + 5, grade(0x8a949a), 15, hx + 2, grade(0x6a7478)); put(hx, hy + 1, grade(0x7ab8d8), 15); }
  if (L.tool === 'pot') { rect(hx - 1, hy - 4, hx + 5, hy - 1, grade(0x5a5a62), 15, hx + 4, grade(0x3a3a40)); }
  if (L.tool === 'rod' && !raise) { for (let i = 0; i < 14; i++) put(hx + 1 + i, hy - Math.round(i * 0.9), grade(0x8a5a34), 15); }
  if (L.tool === 'cloth' && raise) rect(cx + 2, tt - 14, cx + 9, tt - 6, grade(L.cloth || 0xd9685c), 15, cx + 7, clothSh(grade(L.cloth || 0xd9685c)));
  if (L.tool === 'ball') X.ell(hx + 2, hy + 2, 2.6, 2.6, grade(0xd9534f), 15, grade(0xa83a36), grade(0xf7a0a0));
  if (L.tool === 'bag') { rect(hx - 1, hy + 1, hx + 4, hy + 6, grade(0x6a5a3a), 15, hx + 3, grade(0x4a3e2a)); }
}
function zombify(gr, L) {
  const gs = grade(L.skin), Z = L.zsk || 0x9aae8c, Zs = mixc(Z, 0x3a5040, 0.42), M = new Map([[gs, Z], [skinSh(gs), Zs], [hiOf(gs), mixc(Z, 0xfff4e2, 0.24)], [mixc(gs, INK, 0.72), mixc(Z, INK, 0.72)], [mixc(skinSh(gs), INK, 0.72), mixc(Zs, INK, 0.72)]]);
  return gr.map(c => M.has(c) ? M.get(c) : c);
}
// sheet: 8 poses x 4 rows (front, back, front mirrored, back mirrored), same layout as Saigon's personSheet
function hfSheet(L) {
  const Wd = CW * NPOSE, Hd = CH * 4, g = new Int32Array(Wd * Hd).fill(-1);
  for (let b = 0; b < 2; b++) for (let p = 0; p < NPOSE; p++) { let s = drawPerson(L, b === 1, p); if (L.ev === 'zombie') s = zombify(s, L); for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const c = s[y * CW + x]; if (c < 0) continue; g[(b * CH + y) * Wd + p * CW + x] = c; g[((b + 2) * CH + y) * Wd + p * CW + CW - 1 - x] = c; } }
  return gridCanvas(g, Wd, Hd, null, K);
}
function hfLying(L, cover) {   // the figure laid on its side; cover = a sheet over a fallen settler (non-graphic)
  let gr = drawPerson(L, false, 0); if (L.ev === 'zombie') gr = zombify(gr, L);
  const Wd = CH, Hd = CW, rot = new Int32Array(Wd * Hd).fill(-1);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) rot[x * Wd + (CH - 1 - y)] = gr[y * CW + x];
  if (cover) for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { const c = rot[y * Wd + x]; if (c >= 0 && x > 10) rot[y * Wd + x] = c === INK ? INK : y < 12 ? 0xe8e2d4 : 0xd2cbbc; }
  return gridCanvas(rot, Wd, Hd, null, K);
}
// looks: Saigon types with a muted, practical palette
const HF_TOPS = [0x7a6a5a, 0x5a6a7a, 0x8a5a4a, 0x6a7a5a, 0xa8906a, 0x4a5a6a, 0x9a6a5a, 0x7a7a6a, 0xb8a888, 0x6a5a6a, 0x8a7a4a, 0xa85a4a];
const HF_BOTS = [0x3a3e4a, 0x4a4a3a, 0x5a4a3a, 0x3a4a5a, 0x2e2e34, 0x5a5a4a];
function hfLook(role, R) {
  const kid = role === 'kid', type = kid ? 'kid' : role === 'elder' ? (R() < 0.5 ? 'oldman' : 'oldlady') : R() < 0.45 ? 'worker' : R() < 0.5 ? 'youth' : 'dress';
  const L = randLook(type); L.top = sp(R, HF_TOPS); L.bot = sp(R, HF_BOTS); L.carry = null; L.tie = 0; L.mask = 0; L.kq = false; L.pattern = 0; L.pack = 0; L.glasses = R() < 0.08;
  if (type === 'dress') { L.dress = R() < 0.5 ? 1 : 0; L.bot = sp(R, [0x6a4a5a, 0x4a5a6a, 0x7a6a4a]); }
  if (kid) { L.top = sp(R, [0xd9685c, 0xf2c94c, 0x8fc1e3, 0x9fd8b4, 0xf2a0b5]); L.bot = sp(R, HF_BOTS); }
  if (role === 'guard' || role === 'scav') { L.ev = 'guard'; L.hat = role === 'guard' ? 'helm' : (R() < 0.5 ? 'cap' : 0); L.hatC = role === 'guard' ? 0x5a6644 : 0x4a4a3a; L.top = role === 'guard' ? 0x6f8250 : sp(R, [0x5a5a4a, 0x6a5a4a, 0x4a5a5a]); L.bot = 0x4a4e3a; L.sleeve = 'long'; if (role === 'scav') { L.ev = 'scav'; L.pack2 = 1; } }
  if (role === 'builder' || role === 'tech') { L.ev = 'builder'; L.hat = R() < 0.6 ? 'cap' : 0; L.hatC = role === 'tech' ? 0x3d4f7a : 0xe8b83a; }
  if (role === 'medic') { L.ev = 'medic'; L.hat = 0; }
  if (role === 'cook') { L.ev = 'cook'; }
  if (role === 'farmer') { L.hat = R() < 0.6 ? (R() < 0.5 ? 'non' : 'coi') : 'cap'; L.hatC = 0x8a7a5a; }
  if (!L.ev) L.ev = 'x';
  L.b = { top: L.top, sleeve: L.sleeve, hat: L.hat, legs: L.legs }; L.seed = Math.floor(R() * 999);
  return L;
}
function hfZombieLook(R) {
  const L = randLook(R() < 0.7 ? 'youth' : 'worker');
  Object.assign(L, { ev: 'zombie', hair: sp(R, [0x3a3a34, 0x2a2420, 0x5a5048, 0x8a8a84]), hs: sp(R, [0, 0, 4, 6]), hat: 0, blush: false, top: sp(R, [0x6a7480, 0x8a6a5a, 0x5a6a7a, 0x7a5a4a, 0x6a6a5a, 0x5a5a6a, 0x4a5a4a]), bot: sp(R, [0x4a4440, 0x3a3e4a, 0x4a4a3a]), carry: null, glasses: false, mask: 0, pack: 0, tie: 0, kq: false, pattern: 0, zsk: sp(R, [0x9aae8c, 0x8ea68a, 0xa2ae90]) });
  L.b = { top: L.top, sleeve: L.sleeve, hat: 0, legs: L.legs }; L.seed = Math.floor(R() * 999);
  return L;
}
// a Holdfast conifer in Saigon's puff-shaded, inked tree style
const _pine = {};
function pineSprite(v, season) {
  const key = v + season; if (_pine[key]) return _pine[key];
  const Rr = mulberry32(v * 911 + 3), LW = 44, LH = 92, bx = 22, by = 88, W = LW * K, H = LH * K, gg = new Int32Array(W * H).fill(-1);
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) gg[y * W + x] = c; };
  const th = 64 + Rr() * 16, P4 = season === 'winter' ? [0x2a463a, 0x3a5a46, 0x5a7a62, 0xe8eef4] : [0x1f3e2e, 0x2c5636, 0x3f7040, 0x5e8c4e];
  for (let y = 0; y < 14 * K; y++) for (let x = -3; x < 3; x++) set(bx * K + x, by * K - y, x > 1 ? 0x4a3226 : x < -1 ? 0x8a6a4e : 0x6e4c3c);
  for (let t = 0; t < 7; t++) {
    const ty = by * K - (10 + t * (th - 12) / 7) * K, rw = (17 - t * 2.1 + Rr() * 1.5) * K, rh = (8 + Rr() * 2) * K;
    for (let y = Math.floor(ty - rh); y <= ty + rh * 0.4; y++) for (let x = Math.floor(bx * K - rw); x <= bx * K + rw; x++) {
      const dx = (x - bx * K) / rw, dy = (y - ty) / rh; if (dy < -1 || Math.abs(dx) > 1 - (dy + 1) * 0.18 + (hash2(x >> 1, y >> 1) - 0.5) * 0.18 || (dy < 0 && Math.abs(dx) > (dy + 1) * 1.05)) continue;
      const l = -dx * 0.6 - dy * 0.5 + (hash2(x >> 1, (y >> 1) + 5) - 0.5) * 0.45; let c = l > 0.5 ? P4[3] : l > 0.05 ? P4[2] : l > -0.4 ? P4[1] : P4[0];
      if (dy > 0.25) c = P4[0]; if (gg[y * W + x] >= 0 && dy < -0.7) c = mixc(P4[0], INK, 0.3);
      set(x, y, c);
    }
  }
  const out = inkGrid(gg, W, H, 0.8), s = gridCanvas(out, W, H, null, K); s.ax = bx; s.ay = by; s.rad = 12;
  return (_pine[key] = s);
}
// the great oak: Saigon's 'me' crown scaled up by stacking two variants
function hfTree(spc, season, v) {
  if (spc === 'pine') return pineSprite(v % 6, season);
  if (spc === 'fruit') return treeSprite('mai', season, v % 6);
  if (spc === 'oak') return treeSprite('dau', season, 1);
  return treeSprite(spc, season, v % 6);
}
