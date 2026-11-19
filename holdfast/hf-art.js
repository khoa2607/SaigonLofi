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
  if (HF.era === 'past') return pastHouse(o);
  if (HF.era === 'future') return futHouse(o);
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
  if (HF.era === 'past') { const P = pastCivic(b); if (P) return P; }
  if (HF.era === 'future') { const P = futCivic(b); if (P) return P; }
  const R = mulberry32(b.seed * 31 + 7), w = b.w, d = b.d, B = [];
  const base = () => B.push(HB(-0.5, -0.5, 0, w + 1, d + 1, 2.2, CONC));
  const gable = (wall, roof, H, S, n) => { n = n || 6; const s = (d + 3) / (2 * n); for (let k = 0; k < n; k++) B.push(HB(-0.6, -1.5 + k * s, H + k * 2.3, w + 1.2, d + 3 - 2 * k * s, 2.3, roof, shingleP(roof, b.seed), { k, gable: Object.assign({ z0: 2.2 }, S) })); };
  if (b.kind === 'barracks') {
    const S = { wall: 0x8a8a6e, trim: 0xd8d2b8, seed: 3, wins: { 1: winLayout(R, w, 1, 30, { board: 0.1 }), 2: winLayout(R, d, 1) }, door: { f: 1, u: 30, w: 7, h: 13.5, c: 0x4a5a3e }, sign: { f: 1, t: 'BARRACKS', u: 6, v: 14.5, c: 0xf2eee2, bg: 0x4a5a3e } };
    base(); B.push(HB(0, 0, 2.2, w, d, 19, S.wall, sidingP(S))); gable(S.wall, 0x5a6a50, 21.2, S, 5);
    for (let i = 0; i < 8; i++) B.push(HB(4 + i * 3.4, d + 1, 0, 3.2, 2.2, 1.9, 0xb8a47c, sandP), HB(5.6 + i * 3.4, d + 1.2, 1.9, 3.2, 2, 1.8, 0xb8a47c, sandP));
  } else if (b.kind === 'infirmary') {   // milestone 6: a real two-storey hospital (white, green trim, red cross signs, entrance canopy)
    const du = Math.round(w * 0.42), S = { wall: 0xf2efe6, trim: 0x5a8a6a, seed: 5, band: 18.5, wins: { 1: winLayout(R, w, 2, du, { board: 0.03, broken: 0.01 }), 2: winLayout(R, d, 2, undefined, { board: 0.03, broken: 0.01 }) }, door: { f: 1, u: du, w: 9, h: 14, c: 0x5a8a6a }, sign: { f: 1, t: 'HOSPITAL', u: du - 9, v: 15.6, c: 0xf6f4ee, bg: 0xb8403a } };
    for (const fl of [1, 2]) for (const wn of S.wins[fl]) wn.cur = 0xe8f0ec;
    base(); B.push(HB(0, 0, 2.2, w, d, 34, S.wall, sidingP(S))); gable(S.wall, 0x5a6a64, 36.2, Object.assign({}, S, { wins: {} }), 6);
    const cross = (f, u, v, W, H) => (Math.abs(u - W / 2) < W * 0.14 && v > H * 0.15 && v < H * 0.85) || (Math.abs(v - H / 2) < H * 0.14 && u > W * 0.15 && u < W * 0.85) ? 0xc8382e : undefined;
    B.push(HB(w / 2 - 7, d / 2 - 0.3, 49, 14, 0.6, 12, 0xf6f4ee, (f, u, v) => f === 1 ? cross(f, u, v, 14, 12) : undefined), HB(w / 2 - 7.6, d / 2 - 0.4, 48.4, 15.2, 0.8, 0.6, 0x8a8a84));
    B.push(HB(w - 12, d, 22, 9, 0.6, 9, 0xf6f4ee, (f, u, v) => f === 1 ? cross(f, u, v, 9, 9) : undefined));
    B.push(HB(du - 3, d, 15.5, 15, 7, 1.2, 0x5a8a6a), HB(du - 2.6, d + 6, 0, 1, 1, 15.5, TRIM), HB(du + 10.6, d + 6, 0, 1, 1, 15.5, TRIM), HB(du - 1, d, 0, 11, 3, 1.4, CONC), HB(du - 2, d + 3, 0, 13, 3, 0.7, CONC));
  } else if (b.kind === 'stable') {      // milestone 6: horse stable with dutch stall doors, hay loft and sign
    const wall = 0x8a5a3a, S = { wall, trim: 0xe8dcc4, seed: 17, vert: 1, wear: 0.4, wins: { 1: [], 2: [{ u: d / 2 - 3, v: 10, w: 6, h: 5, k: 'glass', lit: 1 }] }, sign: { f: 1, t: 'STABLE', u: w - 28, v: 13.6, c: 0xf2eee2, bg: 0x5a3a2a } };
    const sp0 = sidingP(S);
    base(); B.push(HB(0, 0, 2.2, w, d, 17, wall, (f, u, v, bb, wx, wy) => { if (f === 1) for (let k = 0; k < 4; k++) { const u0 = 4.5 + k * 9; if (u >= u0 && u < u0 + 7 && v < 11.5) { if (u < u0 + 0.6 || u > u0 + 6.4 || v > 10.9) return 0xe8dcc4; if (v > 5.6) return 0x1e1614; return (Math.abs((u - u0) - v * 1.1) < 0.45 || Math.abs((u0 + 7 - u) - v * 1.1) < 0.45) ? 0xe8dcc4 : (u * 2 | 0) % 3 ? 0x7a4a30 : 0x6a3e28; } } return sp0(f, u, v, bb, wx, wy); }));
    gable(wall, 0x6a5a50, 19.2, Object.assign({}, S, { wins: {} }), 6);
    B.push(HB(w + 0.1, d / 2 - 3, 21, 0.6, 6, 6, 0x5a3a2a, (f, u, v) => f === 2 && (u < 0.5 || u > 5.5 || v < 0.5 || v > 5.5 || Math.abs(u - v) < 0.4) ? 0xe8dcc4 : undefined));
  } else if (b.kind === 'workshop') {
    const c = 0x8a949a; base(); B.push(HB(0, 0, 2.2, w, d, 22, c, (f, u, v, bb, wx, wy) => { if (f === 1 && ((u > 6 && u < 22) || (u > 30 && u < 46)) && v < 15) return doorPix({ w: 16, h: 15, k: 'roll' }, (u - 6) % 24, v, { trim: 0x6a6a64 }); if (f === 1 && v > 17 && v < 21 && u > 4 && u < 4 + textW('WORKSHOP') + 2) return textAt('WORKSHOP', u - 5, v - 17.4) ? 0xf2c94c : 0x3a3a3a; return corrP(c, 0.5, 4)(f, u, v, bb, wx, wy); }));
    for (let k = 0; k < 3; k++) B.push(HB(-1, -1 + k * 2, 24.2 + k * 1.2, w + 2, d + 2 - k * 4, 1.2, 0x7a8a94, corrP(0x7a8a94, 0.5, 9)));
  } else if (b.kind === 'church') {      // milestone 7: the grandest building in the community — stone nave, transept, apse, bell tower + spire
    const ST = 0xe4d8be, STD = 0xc8b898, SLATE = 0x4e5866;
    const glass = (u, v, seed) => { const m = hs(Math.floor(u * 1.4) + seed, Math.floor(v * 0.9)); if ((u * 1.4) % 1 < 0.22 || (v * 0.9) % 1 < 0.2) return 0x3a3236; EM = [0xffd890, 0xa8c8ff, 0xffb0a0, 0xfff0a0][Math.floor(m * 4)]; return [0x3d6fb5, 0xc8463a, 0xe8b83a, 0x4f9a58, 0x8a5ab8, 0x3d8fb5][Math.floor(m * 6)]; };
    const arch = (u, v, u0, v0, w, h) => { const x = u - u0, y = v - v0, r = w / 2; if (x < 0 || x > w || y < 0) return 0; if (y < h - r) return 1; const dx = x - r, dy = y - (h - r); return dx * dx + dy * dy < r * r ? 1 : 0; };
    const archEdge = (u, v, u0, v0, w, h) => arch(u, v, u0 - 0.6, v0 - 0.6, w + 1.2, h + 1.2) && !arch(u, v, u0, v0, w, h);
    const stone = (u, v, seed) => { const row = Math.floor(v / 2.4), fr = v - row * 2.4, off = (row % 2) * 2.5, cu = (u + off) % 5; let c = fr < 0.45 || cu < 0.4 ? STD : ST; const n = hs(Math.floor((u + off) / 5) + seed, row); if (n > 0.82) c = mixc(c, 0xb8a888, 0.4); else if (n < 0.1) c = mixc(c, 0xfff4e0, 0.3); if (v < 3) c = mixc(c, 0x8a7a68, 0.35); return c; };
    // walls with tall arched stained-glass windows (lit at night)
    const nave = (wins, seed, rose) => (f, u, v, bb) => { if (f === 0) return 0x8a8070; const W = f === 1 ? bb.w : bb.d;
      if (rose && f === rose.f) { const dx = u - rose.u, dy = v - rose.v, r = Math.hypot(dx, dy); if (r < rose.r + 0.7) { if (r > rose.r) return STD; const a = Math.atan2(dy, dx); if (r < 1.1) { EM = 0xffd890; return 0xe8b83a; } if (Math.abs(((a / TAU * 12) % 1 + 1) % 1 - 0.5) > 0.42) return 0x3a3236; EM = r < rose.r * 0.55 ? 0xffb0a0 : 0xa8c8ff; return r < rose.r * 0.55 ? 0xc8463a : 0x3d6fb5; } }
      for (const w of wins[f] || []) { if (archEdge(u, v, w.u, w.v, w.w, w.h)) return 0xf4ecdc; if (arch(u, v, w.u, w.v, w.w, w.h)) return glass(u - w.u, v - w.v, seed); }
      if (u < 0.8 || u > W - 0.8) return STD; return stone(u, v, seed); };
    const roof = (k, n) => (f, u, v) => { if (f === 0) return (Math.floor(u * 1.2) + Math.floor(v / 1.6)) % 2 ? SLATE : mixc(SLATE, 0x7a8698, 0.35); return mixc(SLATE, HINK, 0.25); };
    base();                                                                                                           // stone plinth
    B.push(HB(-1, -1, 0, w + 2, d + 2, 3, 0xb8ae98, stoneP));
    // apse (back), nave, transept
    B.push(HB(18, 2, 3, 22, 10, 30, ST, nave({ 2: [{ u: 3, v: 8, w: 4, h: 15 }] }, 3)));
    for (let k = 0; k < 5; k++) B.push(HB(17 + k * 2, 1 + k, 33 + k * 2.4, 24 - k * 4, 12 - k, 2.4, SLATE, roof()));
    const NW = { 2: [8, 20, 52, 64].map(u => ({ u, v: 9, w: 5, h: 19 })) };
    B.push(HB(12, 8, 3, 34, 74, 36, ST, nave(NW, 9)));
    for (let k = 0; k < 9; k++) B.push(HB(11 + k * 2, 7, 39 + k * 2.6, 36 - k * 4, 76, 2.6, SLATE, roof()));            // steep gable, ridge along y
    B.push(HB(0, 36, 3, w, 18, 32, ST, nave({ 1: [{ u: 4, v: 9, w: 5, h: 16 }, { u: w - 9, v: 9, w: 5, h: 16 }] }, 5, { f: 2, u: 9, v: 21, r: 6 })));
    for (let k = 0; k < 6; k++) B.push(HB(0 + (k ? 0 : -1), 35 + k * 1.6, 35 + k * 2.6, w + (k ? 0 : 2), 20 - k * 3.2, 2.6, SLATE, roof()));   // transept roof, ridge along x
    for (const y0 of [14, 26, 60, 70]) B.push(HB(46, y0, 3, 3, 3, 24, STD, stoneP), HB(46.5, y0 + 0.5, 27, 2, 2, 5, STD, stoneP));      // buttresses
    // bell tower at the front: great door, rose window, clock, open belfry with a bell, pinnacles, spire and a gold cross
    const TX = 19, TY = 76, TW = 20, TD = 18;
    B.push(HB(TX, TY, 3, TW, TD, 70, ST, (f, u, v, bb) => {
      if (f === 0) return 0x8a8070; const W = f === 1 ? bb.w : bb.d, c = W / 2;
      if (f === 1) { if (archEdge(u, v, c - 4, 0, 8, 17)) return 0xf4ecdc; if (arch(u, v, c - 4, 0, 8, 17)) { if (Math.abs(u - c) < 0.35) return 0x3a2420; return v % 3 < 0.4 ? 0x4a2a20 : 0x7a4430; }
        const dr = Math.hypot(u - c, v - 27); if (dr < 6.6) { if (dr > 5.9) return STD; const a = Math.atan2(v - 27, u - c); if (dr < 1.2) { EM = 0xffd890; return 0xe8b83a; } if (Math.abs(((a / TAU * 10) % 1 + 1) % 1 - 0.5) > 0.4) return 0x3a3236; EM = dr < 3.4 ? 0xffb0a0 : 0xa8c8ff; return dr < 3.4 ? 0xc8463a : 0x3d6fb5; }
        const cr = Math.hypot(u - c, v - 43); if (cr < 3.6) { if (cr > 3) return 0x3a3236; if ((Math.abs(u - c) < 0.3 && v > 43 && v < 45.6) || (Math.abs(v - 43) < 0.3 && u > c - 0.2 && u < c + 2)) return 0x2b1a16; return 0xf6f0dc; } }
      if (v > 52 && v < 64 && Math.abs(u - c) < 5.5) { if (archEdge(u, v, c - 5, 52, 10, 12)) return 0xf4ecdc; if (arch(u, v, c - 5, 52, 10, 12)) { const bdx = u - c, bdy = v - 55.5; if (Math.abs(bdx) < 2.4 - bdy * 0.25 && bdy > -2 && bdy < 3) return bdy > 2 ? 0x8a6a2a : 0xd8a83a; return 0x2a2224; } }
      if (f === 2 && arch(u, v, c - 2, 22, 4, 14)) return glass(u, v, 7);
      if (Math.abs(v - 50) < 0.6 || Math.abs(v - 66) < 0.6) return 0xf4ecdc;
      if (u < 0.8 || u > W - 0.8) return STD; return stone(u, v, 11); }));
    for (const [px, py] of [[TX - 1, TY - 1], [TX + TW - 2, TY - 1], [TX - 1, TY + TD - 2], [TX + TW - 2, TY + TD - 2]]) B.push(HB(px, py, 73, 3, 3, 8, STD, stoneP), HB(px + 0.6, py + 0.6, 81, 1.8, 1.8, 3, SLATE));
    B.push(HB(TX - 0.6, TY - 0.6, 73, TW + 1.2, TD + 1.2, 1.4, 0xf4ecdc));
    for (let k = 0; k < 10; k++) { const s2 = 1 + k * 0.95; B.push(HB(TX + s2, TY + s2 * 0.9, 74.4 + k * 3.6, TW - s2 * 2, TD - s2 * 1.8, 3.6, SLATE, roof())); }
    B.push(HB(TX + TW / 2 - 0.5, TY + TD / 2 - 0.5, 110, 1, 1, 12, 0xe8c050), HB(TX + TW / 2 - 3, TY + TD / 2 - 0.5, 117, 6, 1, 1.2, 0xe8c050));
    // front steps and the door canopy
    for (let k = 0; k < 3; k++) B.push(HB(TX - 4 + k * 1.5, TY + TD + 4 - k * 1.6, 0, TW + 8 - k * 3, 4, 1.2 + k * 1.2, 0xc8bea8, stoneP));
    b.H = 122;
  } else if (b.kind === 'school') {      // milestone 7: unmistakably a school — two storeys of classroom windows, portico, SCHOOL sign, clock, bell cupola
    const BR = 0xa85a44, S = { wall: BR, trim: 0xf0ead8, seed: 11, band: 17.5, wins: { 1: [], 2: [] } };
    for (let fl = 0; fl < 2; fl++) for (let u = 3; u + 6 < w - 2; u += 8.5) { if (u > 24 && u < 42) continue; S.wins[1].push({ u, v: fl ? 21 : 5, w: 6, h: 10, k: 'glass', lit: (u + fl) % 3 > 0, cur: 0xf2e6b8 }); }
    for (let fl = 0; fl < 2; fl++) for (let u = 4; u + 6 < d - 2; u += 9) S.wins[2].push({ u, v: fl ? 21 : 5, w: 6, h: 10, k: 'glass', lit: fl === 0, cur: 0xf2e6b8 });
    base(); B.push(HB(0, 0, 2.2, w, d, 33, BR, brickWallP(S)));
    const n = 6, s = (d + 3) / (2 * n); for (let k = 0; k < n; k++) B.push(HB(-0.8, -1.5 + k * s, 35.2 + k * 2.3, w + 1.6, d + 3 - 2 * k * s, 2.3, 0x4e5a64, shingleP(0x4e5a64, 11), { k }));
    // portico: columns, steps, a pediment with a clock, the big sign between the floors
    const px = w / 2 - 9, PW = 18;
    B.push(HB(px, d, 0, PW, 7, 1.4, CONC), HB(px + 1, d + 7, 0, PW - 2, 2.5, 0.8, CONC));
    for (const cx of [px + 0.6, px + 5.6, px + PW - 7, px + PW - 1.8]) B.push(HB(cx, d + 5.4, 1.4, 1.2, 1.2, 15, 0xf4efe2));
    B.push(HB(px - 0.5, d - 0.2, 16.4, PW + 1, 7, 1.4, 0xf4efe2));
    B.push(HB(px + 1, d - 0.2, 0, PW - 2, 0.6, 15, BR, (f, u, v) => { if (f !== 1) return undefined; if (u > 4.5 && u < 11.5 && v < 12.5) return u < 4.9 || u > 11.1 || v > 12.1 ? 0xf0ead8 : Math.abs(u - 8) < 0.3 ? 0x2b3a5a : 0x3d6f9a; return undefined; }));
    const sign = 'SCHOOL', sw = textW(sign) + 6;
    B.push(HB(w / 2 - sw / 2, d + 0.1, 19, sw, 0.6, 8, 0xf6f2e6, (f, u, v) => { if (f !== 1) return undefined; if (u < 0.6 || u > sw - 0.6 || v < 0.6 || v > 7.4) return 0x3d6f9a; return textAt(sign, u - 3, v - 1.6) ? 0x2b4a7a : undefined; }));
    for (let k = 0; k < 5; k++) B.push(HB(px + k * 1.8, d - 0.6, 30 + k * 1.6, PW - k * 3.6, 1.2, 1.6, 0xf0ead8, (f, u, v) => { if (f !== 1 || k !== 1) return undefined; const cu = (PW - 3.6) / 2, r = Math.hypot(u - cu, v - 0.8); return undefined; }));
    B.push(HB(w / 2 - 2.8, d + 0.2, 30.6, 5.6, 0.6, 5.6, 0xf6f0dc, (f, u, v) => { if (f !== 1) return undefined; const r = Math.hypot(u - 2.8, v - 2.8); if (r > 2.8) return -1; if (r > 2.3) return 0x2b3a5a; if ((Math.abs(u - 2.8) < 0.3 && v > 2.8 && v < 4.8) || (Math.abs(v - 2.8) < 0.3 && u > 2.6 && u < 4.3)) return 0x2b1a16; return 0xf6f0dc; }));
    // bell cupola on the ridge
    const bx2 = w / 2 - 3.5, by2 = d / 2 - 3.5, z0 = 35.2 + n * 2.3 - 2;
    B.push(HB(bx2, by2, z0, 7, 7, 7, 0xf4efe2, (f, u, v) => f !== 0 && u > 1.6 && u < 5.4 && v > 1.4 && v < 6 ? (Math.abs(u - 3.5) < 1.2 && v > 2.4 && v < 4.6 ? 0xd8a83a : 0x2a2224) : undefined));
    for (let k = 0; k < 3; k++) B.push(HB(bx2 - 0.8 + k * 1.4, by2 - 0.8 + k * 1.4, z0 + 7 + k * 1.6, 8.6 - k * 2.8, 8.6 - k * 2.8, 1.6, 0x4e5a64));
    B.push(HB(bx2 + 3.2, by2 + 3.2, z0 + 11.8, 0.6, 0.6, 4, 0x2b2a2a), HB(bx2 + 1.6, by2 + 3.2, z0 + 15, 3.8, 0.4, 0.8, 0x2b2a2a));
    b.H = z0 + 20;
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
  flagpole: () => [HB(-0.6, -0.6, 0, 1.2, 1.2, 36, 0xd8d4cc), HB(-1.6, -1.6, 0, 3.2, 3.2, 1.4, CONC), HB(-0.9, -0.9, 36, 1.8, 1.8, 1, 0xe8c050), HB(0.6, -0.2, 27, 11, 0.4, 7.5, 0x3d6fb5, (f, u, v) => f === 0 ? undefined : (Math.abs(v - 3.75) < 1.1 ? 0xf2f0e6 : (u + v * 0.5) % 5 < 0.5 ? 0x2f5a9a : undefined))],
  bikerack: () => { const B = [HB(0, 0, 0, 14, 1, 0.8, 0x7a7e84)]; for (let k = 0; k < 3; k++) { const c = [0xd9534f, 0x3d6fb5, 0xf2c94c][k]; B.push(HB(1 + k * 4.4, -0.4, 0.8, 0.4, 0.4, 3, 0x7a7e84), HB(0.4 + k * 4.4, -3, 0, 0.4, 6.4, 3.4, 0x2b2a2a, (f, u, v) => f === 2 ? (Math.hypot((u % 4.8) - 1.6, v - 1.6) < 1.6 && Math.hypot((u % 4.8) - 1.6, v - 1.6) > 1.1 ? 0x2b2a2a : (v > 2.4 && v < 3 ? c : -1)) : undefined)); } return B; },
  schoolarch: () => { const t = 'SCHOOL', W = textW(t) + 8; return [HB(-W / 2, 0, 0, 1.2, 1.2, 15, 0xf4efe2), HB(W / 2 - 1.2, 0, 0, 1.2, 1.2, 15, 0xf4efe2), HB(-W / 2 - 0.6, -0.2, 15, W + 1.2, 1.6, 6.6, 0x3d6f9a, (f, u, v) => { if (f !== 1) return undefined; if (v < 0.6 || v > 6) return 0xf2c94c; return textAt(t, u - 4.6, v - 0.9) ? 0xf6f2e6 : undefined; }), HB(-W / 2 - 1, -0.4, 21.6, W + 2, 2, 0.8, 0xf2c94c)]; },
  truck: (o) => { const c = o.c; if (o.cross) return [...carBoxes(c, 0), HB(19, 0.5, 1.6, 9, 8, 9, 0xeeeae0, (f, u, v, b) => { if (f === 0) return 0xd8d4ca; const W = f === 1 ? b.w : b.d; return (Math.abs(u - W / 2) < 0.8 && v > 2.5 && v < 7.5) || (Math.abs(v - 5) < 0.8 && u > W / 2 - 2.6 && u < W / 2 + 2.6) ? 0xc8382e : v < 1 ? 0x9a968c : undefined; })]; return [...carBoxes(c, 0), HB(19, 0.5, 1.6, 9, 8, 6, mixc(c, HINK, 0.15), (f) => f === 0 ? mixc(c, HINK, 0.4) : undefined), HB(20, 1.5, 7.6, 7, 3, 3, 0x9a8a62), HB(23, 4.5, 7.6, 3, 3, 4, 0x7a5a3a)]; },
  car: (o) => carBoxes(o.c, o.wreck),
  bus: () => [HB(0, 0, 0, 44, 12, 15, 0xb8963e, (f, u, v, b) => { if (f === 0) return vnoise(u / 4, v / 3) > 0.55 ? RUST : 0xa8863a; if (v > 7 && v < 12 && (u % 5) > 1 && f === 1) return hs(Math.floor(u / 5), 2) < 0.5 ? 0x1e1a1e : 0x3a4048; if (vnoise(u / 3, v / 2) > 0.6) return mixc(0xb8963e, RUST, 0.6); if (v < 2) return 0x2a2626; return undefined; })],
  crates: () => [HB(0, 0, 0, 5, 5, 4, 0xc98a4a, (f, u, v) => f !== 0 && (v | 0) % 2 === 0 ? 0xa8703a : undefined), HB(5.5, 0.5, 0, 5, 5, 4, 0x6a7a5a, (f, u, v) => f !== 0 && (v | 0) % 2 === 0 ? 0x5a6a4a : undefined), HB(2.5, 0.5, 4, 5, 5, 3.6, 0xc98a4a)],
  bell: () => [HB(0, 0, 0, 1.4, 1.4, 24, WOOD_D, woodP), HB(-2, 0, 22, 6, 1.4, 1.4, WOOD_D), HB(1.4, 0.2, 17, 2, 1, 4, 0xc8a040, (f, u, v) => v < 0.6 ? 0x8a6a2a : undefined)],
  stall: (o) => { const c = o.c; return [HB(0, 0, 0, 12, 7, 5, 0x8a6a4a, (f, u) => f !== 0 && (u | 0) % 4 === 0 ? 0x6b4f34 : undefined), HB(0.5, 0.5, 5, 11, 6, 0.6, 0x6b4f34, (f, u, v) => f === 0 && (u | 0) % 3 === 0 ? 0x5a4028 : undefined), HB(0, 0, 0, 0.8, 0.8, 13, WOOD_D), HB(11.2, 0, 0, 0.8, 0.8, 13, WOOD_D), HB(0, 6.2, 0, 0.8, 0.8, 11, WOOD_D), HB(11.2, 6.2, 0, 0.8, 0.8, 11, WOOD_D), HB(-1, -1, 13, 14, 9, 1.2, c, (f, u) => f === 0 ? ((u / 2.4 | 0) % 2 ? c : 0xf4f1e8) : mixc(c, HINK, 0.2))]; },
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
  laundry: (o) => { if (o.along === 'y') { const B = [HB(0, 0, 0, 1, 1, 17, WOOD_D), HB(0, o.w, 0, 1, 1, 17, WOOD_D), HB(0.2, 0, 16, 0.4, o.w + 1, 0.4, 0xe8e2d4)]; for (let i = 0; i * 6 + 6 < o.w; i++) B.push(HB(0, 2 + i * 6, 9 + (i % 2), 0.5, 4.6 - (i % 2), 7 - (i % 2) * 2, i % 2 ? 0xe8ece8 : 0xf4f1e8)); return B; } const B = [HB(0, 0, 0, 1, 1, 17, WOOD_D), HB(o.w, 0, 0, 1, 1, 17, WOOD_D), HB(0, 0.2, 16, o.w + 1, 0.4, 0.4, 0xe8e2d4)]; const cs = o.white ? [0xf4f1e8, 0xe8ece8, 0xf4f1e8, 0xdce6e0] : [0xd9685c, 0xf4f1e8, 0x3d6fb5, 0xf2c94c, 0x9fd8b4, 0x8a5ab8]; for (let i = 0; i * 6 + 6 < o.w; i++) { const c = cs[(i + (o.x | 0)) % cs.length]; B.push(HB(2 + i * 6, 0, 9 + (i % 2), 4.6 - (i % 2), 0.5, 7 - (i % 2) * 2, c, (f, u) => f === 1 && (u * 2 | 0) % 3 === 0 ? mixc(c, HINK, 0.15) : undefined)); } return B; },
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
  // ---- milestone 6 props (same box + painter language as the approved pilot)
  rail: (o) => railBoxes(o.w, o.along, 0),
  picket: (o) => railBoxes(o.w, o.along, 1),
  hitch: () => [HB(0, 0, 0, 1.2, 1.2, 7.5, WOOD_D, woodP), HB(16.8, 0, 0, 1.2, 1.2, 7.5, WOOD_D, woodP), HB(8.4, 0, 0, 1.2, 1.2, 7.5, WOOD_D, woodP), HB(-0.4, 0, 6.2, 18.8, 1, 1.2, WOOD, woodP)],
  handcart: (o) => cartBoxes('x', o.load || 0),
  target: () => [HB(0.6, 0.8, 0, 0.8, 0.8, 4, WOOD_D), HB(3.6, 0.8, 0, 0.8, 0.8, 4, WOOD_D), HB(0, 1.2, 3.4, 5, 0.6, 5.4, 0xf2ece0, (f, u, v) => { if (f !== 1) return 0xc8b89a; const r = Math.hypot(u - 2.5, v - 2.7); return r < 0.7 ? 0xc8382e : r < 1.5 ? 0xf2ece0 : r < 2.2 ? 0xc8382e : r < 2.5 ? 0x3a3030 : 0xf2ece0; })],
  sandbags: () => [HB(0, 0, 0, 9, 3, 2.2, 0xb8a47c, sandP), HB(1, 0.3, 2.2, 7, 2.6, 2, 0xb8a47c, sandP), HB(2.4, 0.5, 4.2, 4.4, 2.2, 1.8, 0xb8a47c, sandP)],
  trough: () => [HB(0, 0, 0, 9, 3, 2.6, WOOD_D, plankP, { along: 'x' }), HB(0.6, 0.6, 2.6, 7.8, 1.8, 0.1, 0x5a96ae, (f, u) => (u * 3 | 0) % 7 === 0 ? 0x9ac8d8 : undefined)],
  hay: () => { const bale = (x, y, z) => HB(x, y, z, 5, 3.6, 2.8, 0xd8bc6a, (f, u, v) => { if (f === 0) return hs(u * 3, v * 3) > 0.7 ? 0xc8a650 : 0xe0c878; if (Math.abs(u - 1.4) < 0.25 || Math.abs(u - 3.6) < 0.25) return 0x8a6a34; return hs(u * 4, v * 5) > 0.75 ? 0xb89a48 : undefined; }); return [bale(0, 0, 0), bale(5.2, 0, 0), bale(0, 4, 0), bale(5.2, 4, 0), bale(2.6, 2, 2.8)]; },
  tack: () => [HB(0, 0, 0, 1, 1, 8, WOOD_D), HB(11, 0, 0, 1, 1, 8, WOOD_D), HB(0, 0.1, 6.6, 12, 0.8, 0.8, WOOD), HB(1.5, -1, 4.2, 4, 2.6, 2.4, 0x6a3a22, (f, u, v) => v > 1.8 ? 0x8a5a34 : undefined), HB(6.5, -1, 4.2, 4, 2.6, 2.4, 0x5a3220, (f, u, v) => v > 1.8 ? 0x7a4a2c : undefined), HB(2, 0.6, 1, 0.5, 0.4, 3.4, 0x3a2a20)],
  forge: () => [HB(0, 0, 0, 10, 8, 5, 0x8a847c, stoneP), HB(1.5, 1.5, 5, 7, 5, 0.6, 0x3a2a24, (f, u, v) => vnoise(u * 2, v * 2) > 0.5 ? 0xff9a3a : 0xc8501e, { em: 0xff8a30 }), HB(6, 1, 5, 3.4, 3.4, 16, 0x9e5040, brickP), HB(-1.5, -1.5, 13, 14, 12, 1.2, 0x7a8a94, corrP(0x7a8a94, 0.7, 2)), HB(-1, 9.6, 0, 1, 1, 13, WOOD_D), HB(11.6, 9.6, 0, 1, 1, 13, WOOD_D), HB(10.5, 4, 1, 3, 3.6, 2, 0x6a4a32, (f, u, v) => f === 0 ? 0x4a3226 : undefined)],
  anvil: () => [HB(0, 0, 0, 2.4, 1.6, 2.6, 0x6a4a32, woodP), HB(-0.8, -0.2, 2.6, 4, 2, 1.4, 0x3a3a42, (f) => f === 0 ? 0x5a5a64 : undefined)],
  sawhorse: () => [HB(0, 0, 0, 0.8, 3, 4, WOOD_D), HB(9, 0, 0, 0.8, 3, 4, WOOD_D), HB(-1, 0.6, 4, 12, 1.8, 0.8, WOOD_L, plankP, { along: 'x' }), HB(1, -2, 0, 7, 2, 1.6, WOOD, plankP, { along: 'x' })],
  wagon: () => { const B = [HB(0, 0, 4, 18, 9, 1.2, WOOD, plankP, { along: 'x' }), HB(0, 0, 5.2, 18, 0.8, 3, WOOD_D, plankP, { along: 'x' }), HB(0, 8.2, 5.2, 18, 0.8, 3, WOOD_D, plankP, { along: 'x' }), HB(17.2, 0, 5.2, 0.8, 9, 3, WOOD_D)];
    for (const [x, y] of [[3, -0.8], [3, 9], [13, -0.8]]) B.push(HB(x - 2.5, y, 0, 5, 0.8, 5, 0x5a4030, (f, u, v) => { const r = Math.hypot(u - 2.5, v - 2.5); return r > 2.5 ? -1 : r > 1.9 || r < 0.6 || Math.abs(u - 2.5) < 0.3 || Math.abs(v - 2.5) < 0.3 ? 0x4a3426 : -1; }));
    B.push(HB(11, 9.2, 0, 4, 2, 3.2, 0x8a847c, stoneP), HB(12, 10.4, 0, 5, 0.8, 5, 0x5a4030, (f, u, v) => f === 0 ? 0x5a4030 : undefined), HB(-7, 2.4, 3.6, 7, 0.8, 0.8, WOOD_D), HB(-7, 5.8, 3.6, 7, 0.8, 0.8, WOOD_D)); return B; },
  medtent: () => { const c = 0xeeeae0, B = []; for (let k = 0; k < 4; k++) B.push(HB(k * 2.2, 0, k * 2.6, 18 - k * 4.4, 16, 2.6, c, canvasP(c), { k })); B.push(HB(5, 16, 1.5, 8, 0.4, 7.5, 0xf6f4ee, (f, u, v) => f === 1 && ((Math.abs(u - 4) < 1.1 && v > 0.8 && v < 6.7) || (Math.abs(v - 3.75) < 1.1 && u > 0.8 && u < 7.2)) ? 0xc8382e : undefined)); return B; },
  cot: () => [HB(0, 0, 0, 0.6, 0.6, 2, 0x6a6a64), HB(5.4, 0, 0, 0.6, 0.6, 2, 0x6a6a64), HB(0, 2.6, 0, 0.6, 0.6, 2, 0x6a6a64), HB(5.4, 2.6, 0, 0.6, 0.6, 2, 0x6a6a64), HB(0, 0, 2, 6, 3.2, 0.7, 0x7a8a6a, (f, u) => f === 0 && u < 1.6 ? 0xf2efe6 : undefined)],
  medcrates: () => { const cr = (x, y, z) => HB(x, y, z, 4, 3.6, 3.2, 0xeeeae0, (f, u, v, b) => { const W = f === 1 ? b.w : b.d; if (f === 0) return 0xe0dcd2; return (Math.abs(u - W / 2) < 0.45 && Math.abs(v - 1.6) < 1.2) || (Math.abs(v - 1.6) < 0.45 && Math.abs(u - W / 2) < 1.2) ? 0xc8382e : v < 0.4 ? 0xb8b4aa : undefined; }); return [cr(0, 0, 0), cr(4.4, 0.3, 0), cr(2, 0.2, 3.2)]; },
  stretcher: () => [HB(0, 0, 0.5, 10, 0.6, 0.6, WOOD), HB(0, 3, 0.5, 10, 0.6, 0.6, WOOD), HB(1.5, 0.3, 0.9, 7, 3, 0.2, 0x8a9a6a)],
  lantern: () => [HB(-0.5, -0.5, 0, 1, 1, 11, 0x3a3a38), HB(-1.4, -1.4, 11, 2.8, 2.8, 2.6, 0xffe4a0, null, { em: 0xffd88a }), HB(-1.8, -1.8, 13.6, 3.6, 3.6, 0.8, 0x3a3a38)],
  seesaw: () => [HB(4.4, 0.6, 0, 1.2, 1.6, 2.6, 0xb84a3a), HB(0, 0.8, 1.6, 10, 1.2, 0.6, 0xf2c94c), HB(0, 0.6, 2.2, 0.6, 1.6, 1.4, 0x3d6f9a), HB(9.4, 0.6, 1, 0.6, 1.6, 1.4, 0x3d6f9a)],
  chalk: () => [HB(0.6, 0.6, 0, 0.8, 0.8, 11, WOOD_D), HB(8.6, 0.6, 0, 0.8, 0.8, 11, WOOD_D), HB(0, 1, 4, 10, 0.6, 7, 0x3a5a44, (f, u, v) => { if (f !== 1) return WOOD; if (u < 0.5 || u > 9.5 || v < 0.5 || v > 6.5) return WOOD; return textAt('ABC', u - 1.4, v - 3.6) || (v < 2.4 && v > 1.8 && u > 2 && u < 8 && (u * 3 | 0) % 4) ? 0xe8ece0 : undefined; })],
  goal: () => [HB(0, 0, 0, 0.8, 0.8, 6.5, 0xf2f0ea), HB(0, 9, 0, 0.8, 0.8, 6.5, 0xf2f0ea), HB(0, 0, 6.5, 0.8, 9.8, 0.8, 0xf2f0ea), HB(1.8, 0.4, 0, 0.3, 9, 6.6, 0xd8d6d0, (f, u, v) => ((u + v) % 1.6 < 0.3 || (u - v + 20) % 1.6 < 0.3) ? 0xd8d6d0 : -1)],
  pighut: () => [HB(0, 0, 0, 9, 7, 5, 0x8a6a4a, plankP, { along: 'y' }), HB(-0.8, -0.8, 5, 10.6, 8.6, 1.4, 0x7a8a94, corrP(0x7a8a94, 0.7, 4)), HB(3, 6.9, 0, 3.4, 0.3, 3.2, 0x2a1e1a)],
  flag: () => [HB(-0.5, -0.5, 0, 1, 1, 30, 0xb8b4aa), HB(0.5, -0.2, 22, 9, 0.4, 6, 0x4e6a3e, (f, u, v) => f === 1 && Math.abs(v - 3) < 0.7 ? 0xe8dcc0 : (u + v * 0.6) % 4 < 0.4 ? 0x3e5a30 : undefined), HB(-1.5, -1.5, 0, 3, 3, 0.8, 0x8a847c, stoneP)],
  hurdle: () => [HB(0, 0, 0, 0.8, 0.8, 4, WOOD_D), HB(8, 0, 0, 0.8, 0.8, 4, WOOD_D), HB(-0.4, -0.2, 3.2, 9.6, 1.2, 1.2, 0x9a6a44, woodP)],
  lights: () => []
};
// ranch rails (o.w long, along 'x' or 'y'): posts every 6 units; pickets: a white picket fence for the graveyard
function railBoxes(len, along, picket) {
  if (HF.era === 'past') return pastRailBoxes(len, along, picket);
  if (HF.era === 'future') return futRailBoxes(len, along, picket);
  const B = [], ax = along !== 'y', post = (t) => B.push(ax ? HB(t, 0, 0, 0.9, 0.9, picket ? 6 : 7.5, picket ? 0xe8e2d4 : WOOD_D, picket ? undefined : woodP) : HB(0, t, 0, 0.9, 0.9, picket ? 6 : 7.5, picket ? 0xe8e2d4 : WOOD_D, picket ? undefined : woodP));
  for (let t = 0; t <= len + 0.01; t += 6) post(Math.min(t, len - 0.9));
  if (picket) { const pp = (f, u, v) => { if (f === 0) return 0xe8e2d4; if ((u % 1.6) > 0.95) return -1; if (v > 4.6 && (u % 1.6) > 0.65) return -1; if (v < 1) return 0xb8b0a0; return hs(u * 2, v) > 0.9 ? 0xc8c0ae : undefined; }; B.push(ax ? HB(0, 0.1, 0, len, 0.6, 5.4, 0xeeeae0, pp) : HB(0.1, 0, 0, 0.6, len, 5.4, 0xeeeae0, pp)); }
  else for (const z of [2.6, 5.4]) B.push(ax ? HB(0, 0.1, z, len, 0.6, 0.9, WOOD, woodP) : HB(0.1, 0, z, 0.6, len, 0.9, WOOD, woodP));
  return B;
}
// a two-wheeled handcart (tray along x or y) with an optional load: 1 produce, 2 sacks, 3 planks, 4 fish, 5 crates, 6 hay, 7 med supplies
const CART_LOAD = { 1: [0x6aa244, 0xd9534f], 2: [0xd8c08a, 0xc0a874], 3: [0xc49a64, 0x9a7446], 4: [0xc8d4dc, 0x6a7a84], 5: [0xc98a4a, 0xa8703a], 6: [0xe0c878, 0xb89a48], 7: [0xeeeae0, 0xc8382e] };
function cartBoxes(along, load) {
  if (HF.era === 'past') return pastCartBoxes(along, load);
  if (HF.era === 'future') return futCartBoxes(along, load);
  const ax = along !== 'y', L = (x, y, z, w, d, h, c, p, e) => ax ? HB(x, y, z, w, d, h, c, p, e) : HB(y, x, z, d, w, h, c, p, e);
  const wheel = (f, u, v) => { const r = Math.hypot(u - 1.6, v - 1.6); return r > 1.6 ? -1 : r > 1.1 || Math.abs(u - 1.6) < 0.25 ? 0x3a2e28 : -1; };
  const B = [L(0, 0, 2.2, 9, 5, 0.8, WOOD, plankP, { along: ax ? 'x' : 'y' }), L(0, 0, 3, 9, 0.6, 1.8, WOOD_D), L(0, 4.4, 3, 9, 0.6, 1.8, WOOD_D), L(8.4, 0, 3, 0.6, 5, 1.8, WOOD_D),
    L(2.8, -0.7, 0, 3.2, 0.6, 3.2, 0x3a2e28, ax ? wheel : undefined), L(2.8, 5.1, 0, 3.2, 0.6, 3.2, 0x3a2e28, ax ? wheel : undefined), L(-5, 0.6, 3.6, 5.2, 0.6, 0.6, WOOD_D), L(-5, 3.8, 3.6, 5.2, 0.6, 0.6, WOOD_D), L(8, 2.2, 0, 0.7, 0.7, 2.4, WOOD_D)];
  const c = CART_LOAD[load]; if (c) B.push(L(0.8, 0.7, 3.4, 7.4, 3.6, load === 3 ? 1.6 : 2.2, c[0], (f, u, v) => (hs(Math.floor(u * 1.5), Math.floor(v * 1.5) + f) > 0.6 ? c[1] : undefined)), L(2, 1.2, 5.6, 4.6, 2.6, load === 3 ? 0.8 : 1.2, c[0], (f, u, v) => (hs(Math.floor(u * 2) + 5, Math.floor(v * 2)) > 0.55 ? c[1] : undefined)));
  return B;
}
// a grave marker: 0 wooden cross, 1 rounded stone, 2 flat stone, 3 a stone cross; fresh = a dirt mound with flowers
function graveBoxes(v, fresh) {
  if (HF.era === 'past') return pastGraveBoxes(v, fresh);
  if (HF.era === 'future') return futGraveBoxes(v, fresh);
  const B = [];
  if (fresh) B.push(HB(-1.6, 0.6, 0, 3.4, 5.2, 0.9, 0x6a4e34, (f, u, v2) => hs(u * 3, v2 * 3) > 0.85 ? 0xd9685c : hs(u * 3 + 1, v2 * 3) > 0.9 ? 0xf2e6a0 : undefined));
  if (v === 0 || fresh) B.push(HB(-0.4, -0.3, 0, 0.8, 0.6, 6, WOOD, woodP), HB(-1.8, -0.3, 3.8, 3.6, 0.6, 0.8, WOOD, woodP));
  else if (v === 1) B.push(HB(-1.6, -0.5, 0, 3.2, 1, 4.6, 0xa49e94, (f, u, vv) => f === 1 && vv > 3.6 && (u < 0.5 || u > 2.7) ? -1 : stoneP(f, u, vv, null, u, vv)));
  else if (v === 2) B.push(HB(-1.8, -0.5, 0, 3.6, 1.2, 3.2, 0x96908a, stoneP));
  else B.push(HB(-0.5, -0.4, 0, 1, 0.8, 5.6, 0xb8b2a6, stoneP), HB(-1.7, -0.4, 3.4, 3.4, 0.8, 1, 0xb8b2a6, stoneP), HB(-1.4, -0.6, 0, 2.8, 1.2, 0.8, 0x8a847c, stoneP));
  return B;
}
function carBoxes(c, wreck) {
  const bodyP = (f, u, v, b) => { if (f === 0) return vnoise(u / 3, v / 3) > 0.6 && wreck ? mixc(c, RUST, 0.5) : mixc(c, 0xfff1d6, 0.12); let k = c; if (wreck && vnoise(u / 2.5, v / 2) > 0.58) k = mixc(k, RUST, 0.55); if (v < 1) k = mixc(k, HINK, 0.4); if (f === 1 && Math.abs(u - b.w * 0.5) < 0.25) k = mixc(k, HINK, 0.35); return k; };
  return [HB(1, 0.5, 0, 3, 1, 3, 0x2a2628), HB(14, 0.5, 0, 3, 1, 3, 0x2a2628), HB(1, 8.5, 0, 3, 1, 3, 0x2a2628), HB(14, 8.5, 0, 3, 1, 3, 0x2a2628), HB(0, 0, 1.6, 19, 9, 5, c, bodyP),
    HB(4, 0.5, 6.6, 9, 8, 4.2, c, (f, u, v, b) => { if (f === 0) return wreck ? mixc(c, RUST, 0.4) : mixc(c, 0xfff1d6, 0.1); if (v > 0.6 && v < 3.6 && u > 0.8 && u < (f === 1 ? b.w : b.d) - 0.8) { const cr = wreck && Math.abs((u - 3) - (v - 1) * 1.5) < 0.25; return cr ? 0xc8d4dc : (u + v) % 4 < 0.6 ? 0x6a7a8a : 0x2a3038; } return c; })];
}

// ---------------------------------------------------------------- wall pieces, tower, gate
// shape: list of half-directions from the tile centre: 'E','W','S','N' (world +x,-x,+y,-y); dmg 0 intact, 1 damaged, 2 breached
function wallBoxes(s, shape, dmg) {
  if (HF.era === 'past') return pastWallBoxes(s, shape, dmg);
  if (HF.era === 'future') return futWallBoxes(s, shape, dmg);
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
  if (HF.era === 'past') return pastTowerBoxes();
  if (HF.era === 'future') return futTowerBoxes();
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
  if (HF.era === 'past') return pastGateFrameBoxes();
  if (HF.era === 'future') return futGateFrameBoxes();
  return [HB(-1.2, -1.4, 0, 2.4, 2.8, 26, WOOD, woodP), HB(22.8, -1.4, 0, 2.4, 2.8, 26, WOOD, woodP),
    HB(-6, -0.6, 22, 36, 1.2, 6.4, 0xb08a5a, (f, u, v) => f === 1 && textAt('HOLDFAST', u - (36 - textW('HOLDFAST')) / 2, v - 0.8) ? 0xf6f0e0 : f === 1 && (v < 0.5 || v > 5.9 || u < 0.6 || u > 35.4) ? 0x6a4a32 : undefined)];
}
function gateLeafBoxes() {
  if (HF.era === 'past') return pastGateLeafBoxes();
  if (HF.era === 'future') return futGateLeafBoxes();
  return [HB(0, -0.7, 0.4, 12, 1.4, 17, 0x5a5e64, (f, u, v, b) => { if (f === 0) return 0x4a4e54; if (u < 0.8 || u > 11.2 || v < 0.8 || v > 16.2) return 0x3a3e44; const d1 = Math.abs((u - 0.8) - (v - 0.8) * 10.4 / 15.4), d2 = Math.abs((u - 0.8) - (16.2 - v) * 10.4 / 15.4); if (d1 < 0.6 || d2 < 0.6) return 0xd8b040; if ((u % 2.4) < 0.4) return 0x6a6e74; return vnoise(u / 2, v / 3) > 0.62 ? mixc(0x5a5e64, RUST, 0.5) : undefined; })];
}

// ---------------------------------------------------------------- characters
// Saigon's drawPerson calls these ev* hooks only when L.ev is set; Holdfast uses them for infected, guards and work gear.
function evBehind(X) { if (X.L.pack2 && !X.back) { const c = grade(0x6a5a3a); X.rect(X.cx - 9, X.torsoTop, X.cx - 6, X.legTop + 1, c, 0, X.cx - 7, clothSh(c)); } }
function evTorso(X) {
  if (X.L.past) return pastTorso(X);
  if (X.L.fut) return futTorso(X);
  const L = X.L, { rect, put, cx, torsoTop: tt, legTop: lt } = X;
  if (L.ev === 'guard') { const v = grade(0x4e5a3e); rect(cx - 5, tt + 1, cx + 5, lt - 1, v, 6, cx + 3, clothSh(v)); rect(cx - 4, lt - 4, cx - 2, lt - 2, grade(0x3a4430), 6); rect(cx + 1, lt - 4, cx + 3, lt - 2, grade(0x3a4430), 6); rect(cx - 5, lt - 1, cx + 6, lt - 1, grade(0x2e2a24), 6); }
  if (L.ev === 'builder') { const v = grade(0xe8b83a); rect(cx - 5, tt + 1, cx - 3, lt - 1, v, 6); rect(cx + 2, tt + 1, cx + 4, lt - 1, v, 6, cx + 4, clothSh(v)); rect(cx - 5, tt + 5, cx + 4, tt + 5, grade(0xf4f1e8), 6); rect(cx - 6, lt - 1, cx + 6, lt, grade(0x5a3a24), 6); }
  if (L.ev === 'medic') { const v = grade(0xf2f0ea); rect(cx - 5, tt + 1, cx + 5, lt - 1, v, 6, cx + 3, clothSh(v)); rect(cx - 1, tt + 3, cx + 1, tt + 7, grade(0x3a9a5a), 7); rect(cx - 3, tt + 4, cx + 3, tt + 6, grade(0x3a9a5a), 7); }
  if (L.ev === 'cook') { rect(cx - 4, tt + 3, cx + 4, lt + 3, 0xf4ecda, 6, cx + 2, 0xd8ccb4); }
  if (L.ev === 'smith') { const a = grade(0x5a3a26); rect(cx - 4, tt + 2, cx + 4, lt + 4, a, 6, cx + 2, clothSh(a)); rect(cx - 5, tt + 1, cx - 4, tt + 3, grade(0x3a2a1c), 6); rect(cx + 4, tt + 1, cx + 5, tt + 3, grade(0x3a2a1c), 6); }
  if (L.pack2 && X.back) { const c = grade(0x6a5a3a); rect(cx - 5, tt + 1, cx + 5, lt - 1, c, 7, cx + 3, clothSh(c)); rect(cx - 4, tt + 3, cx + 4, tt + 4, grade(0x4a3e2a), 7); }
}
function evFace(X, ex1, ex2, ey, eh) {
  if (X.L.past) return pastFace(X, ex1, ex2, ey, eh);
  if (X.L.fut) return futFace(X, ex1, ex2, ey, eh);
  const L = X.L, { rect, put, cx } = X;
}
function evHat(hat, X) { if (X && X.L.past) pastHat(hat, X); else if (X && X.L.fut) futHat(hat, X); }
function evCarry() { }
function evOver(X, hx, hy, raise) {
  const L = X.L, { rect, put, cx, torsoTop: tt, legTop: lt, back } = X;
  const M = 0x2e2c30, Wd = grade(0x7a5234);
  if (L.past && pastOver(X, hx, hy, raise)) return;
  if (L.fut && futOver(X, hx, hy, raise)) return;
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
  if (L.tool === 'hay') { rect(hx - 3, hy - 2, hx + 5, hy + 3, grade(0xe0c878), 15, hx + 4, grade(0xb89a48)); put(hx - 2, hy - 3, grade(0xe8d488), 15); put(hx + 3, hy - 3, grade(0xc8a650), 15); }
  if (L.tool === 'saddle') { rect(hx - 3, hy - 1, hx + 5, hy + 3, grade(0x6a3a22), 15, hx + 4, grade(0x4a2a18)); rect(hx - 3, hy - 2, hx - 1, hy - 1, grade(0x8a5a34), 15); }
  if (L.tool === 'brush') { rect(hx, hy - 1, hx + 3, hy + 1, grade(0x8a5a34), 15); rect(hx, hy + 2, hx + 3, hy + 2, grade(0xd8c8a0), 15); }
  if (L.tool === 'saw') { rect(hx, hy, hx + 9, hy + 1, grade(0xb8bcc0), 15, hx + 8, grade(0x8a8e92)); rect(hx - 2, hy - 1, hx, hy + 2, grade(0x8a5a34), 15); }
  if (L.tool === 'stretcher') { rect(hx - 9, hy + 1, hx + 9, hy + 1, grade(0x9a6a44), 15); rect(hx - 7, hy, hx + 7, hy, grade(0x8a9a6a), 15); }
  if (L.tool === 'fork' || L.tool === 'broom') { for (let i = 0; i < 20; i++) put(hx + 1 + Math.round(i * 0.4), hy - 8 + i, grade(0x8a5a34), 15); if (L.tool === 'fork') { for (const dx of [7, 9, 11]) rect(hx + dx, hy + 12, hx + dx, hy + 14, 0x6a6a72, 15); } else rect(hx + 7, hy + 11, hx + 12, hy + 14, grade(0xc8a650), 15, hx + 11, grade(0x9a7a38)); }
}
// sheet: 8 poses x 4 rows (front, back, front mirrored, back mirrored), same layout as Saigon's personSheet
function hfSheet(L) {
  const Wd = CW * NPOSE, Hd = CH * 4, g = new Int32Array(Wd * Hd).fill(-1);
  for (let b = 0; b < 2; b++) for (let p = 0; p < NPOSE; p++) { const s = L.ev === 'zombie' ? drawZombie(L, b === 1, p) : drawPerson(L, b === 1, p); for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const c = s[y * CW + x]; if (c < 0) continue; g[(b * CH + y) * Wd + p * CW + x] = c; g[((b + 2) * CH + y) * Wd + p * CW + CW - 1 - x] = c; } }
  return gridCanvas(g, Wd, Hd, null, K);
}
function hfLying(L, cover) {   // the figure laid on its side; cover = a sheet over a fallen settler (non-graphic)
  const gr = L.ev === 'zombie' ? drawZombie(L, false, 0) : drawPerson(L, false, 0);
  const Wd = CH, Hd = CW, rot = new Int32Array(Wd * Hd).fill(-1);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) rot[x * Wd + (CH - 1 - y)] = gr[y * CW + x];
  if (cover) for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { const c = rot[y * Wd + x]; if (c >= 0 && x > 10) rot[y * Wd + x] = c === INK ? INK : y < 12 ? 0xe8e2d4 : 0xd2cbbc; }
  return gridCanvas(rot, Wd, Hd, null, K);
}
// looks: Saigon types with a muted, practical palette
const HF_TOPS = [0x7a6a5a, 0x5a6a7a, 0x8a5a4a, 0x6a7a5a, 0xa8906a, 0x4a5a6a, 0x9a6a5a, 0x7a7a6a, 0xb8a888, 0x6a5a6a, 0x8a7a4a, 0xa85a4a];
const HF_BOTS = [0x3a3e4a, 0x4a4a3a, 0x5a4a3a, 0x3a4a5a, 0x2e2e34, 0x5a5a4a];
function hfLook(role, R) {
  if (HF.era === 'past') return pastLook(role, R);
  if (HF.era === 'future') return futLook(role, R);
  const kid = role === 'kid', type = kid ? 'kid' : role === 'elder' ? (R() < 0.5 ? 'oldman' : 'oldlady') : R() < 0.45 ? 'worker' : R() < 0.5 ? 'youth' : 'dress';
  const L = randLook(type); L.top = sp(R, HF_TOPS); L.bot = sp(R, HF_BOTS); L.carry = null; L.tie = 0; L.mask = 0; L.kq = false; L.pattern = 0; L.pack = 0; L.glasses = R() < 0.08;
  if (type === 'dress') { L.dress = R() < 0.5 ? 1 : 0; L.bot = sp(R, [0x6a4a5a, 0x4a5a6a, 0x7a6a4a]); }
  if (kid) { L.top = sp(R, [0xd9685c, 0xf2c94c, 0x8fc1e3, 0x9fd8b4, 0xf2a0b5]); L.bot = sp(R, HF_BOTS); }
  if (role === 'guard' || role === 'scav') { L.ev = 'guard'; L.hat = role === 'guard' ? 'helm' : (R() < 0.5 ? 'cap' : 0); L.hatC = role === 'guard' ? 0x5a6644 : 0x4a4a3a; L.top = role === 'guard' ? 0x6f8250 : sp(R, [0x5a5a4a, 0x6a5a4a, 0x4a5a5a]); L.bot = 0x4a4e3a; L.sleeve = 'long'; if (role === 'scav') { L.ev = 'scav'; L.pack2 = 1; } }
  if (role === 'builder' || role === 'tech') { L.ev = 'builder'; L.hat = R() < 0.6 ? 'cap' : 0; L.hatC = role === 'tech' ? 0x3d4f7a : 0xe8b83a; }
  if (role === 'medic') { L.ev = 'medic'; L.hat = 0; }
  if (role === 'cook') { L.ev = 'cook'; }
  if (role === 'smith') { L.ev = 'smith'; L.hat = 0; L.sleeve = 'short'; L.top = sp(R, [0x8a7a6a, 0x6a6a6a, 0x9a8a72]); }
  if (role === 'groom' || role === 'herder') { L.hat = R() < 0.6 ? 'cap' : 'non'; L.hatC = role === 'groom' ? 0x6a4a32 : 0x8a7a5a; L.top = sp(R, [0x7a6a4a, 0x5a6a4a, 0x8a5a3a, 0x6a7a8a]); }
  if (role === 'farmer') { L.hat = R() < 0.6 ? (R() < 0.5 ? 'non' : 'coi') : 'cap'; L.hatC = 0x8a7a5a; }
  if (!L.ev) L.ev = 'x';
  L.b = { top: L.top, sleeve: L.sleeve, hat: L.hat, legs: L.legs }; L.seed = Math.floor(R() * 999);
  return L;
}
// ---------------------------------------------------------------- milestone 7: river craft (sampan hulls with painted bow eyes; cargo, fishing, red-cross medical boats)
function boatBoxes(kind, axis) {
  if (HF.era === 'past') return pastBoatBoxes(kind, axis);
  if (HF.era === 'future') return futBoatBoxes(kind, axis);
  const B = [], L = kind === 'fish' ? 24 : 32, hw = kind === 'fish' ? 3.6 : 4.6, med = kind === 'med';
  const hullC = med ? 0xf0ece2 : 0x7a5434, hullD = med ? 0xc8c2b4 : 0x5a3a26, stripe = med ? 0xc8382e : 0x3d6f8a;
  const hullP = (f, u, v, b) => { if (f === 0) return (u * 2 | 0) % 3 ? 0x9a7046 : 0x8a6038; const W = f === 1 ? b.w : b.d; if (Math.abs(v - (b.h - 0.9)) < 0.45) return stripe; if (f === 1 && u > W - 4.2 && u < W - 2.6 && v > 0.8 && v < 1.8) return u < W - 3.4 ? 0xf6f2e6 : 0x1e1818; return v < 0.7 ? hullD : undefined; };   // painted eye at the bow
  B.push(HB(-L / 2 + 2, -hw + 0.8, 0, L - 4, hw * 2 - 1.6, 1.8, hullD), HB(-L / 2, -hw, 1.2, L, hw * 2, 2.2, hullC, hullP));
  B.push(HB(-L / 2 - 1.2, -hw + 1.4, 2.4, 2.4, hw * 2 - 2.8, 2.2, hullC), HB(L / 2 - 1.2, -hw + 1.4, 2.4, 2.4, hw * 2 - 2.8, 2.6, hullC));   // raised bow and stern
  B.push(HB(-L / 2 + 1, -hw + 0.6, 3.2, L - 2, hw * 2 - 1.2, 0.4, 0x8a6038, (f, u) => f === 0 && (u * 2 | 0) % 4 === 0 ? 0x6a4428 : undefined));   // deck boards
  if (kind === 'cargo') {
    for (let k = 0; k < 4; k++) B.push(HB(-5 + k * 0.4, -hw + 0.4 + k * 0.5, 3.6 + k * 1.6, 12 - k * 0.8, hw * 2 - 0.8 - k, 1.6, 0xb89a62, (f, u, v) => (Math.floor(u * 1.5) + Math.floor(v * 2)) % 2 ? 0xa48650 : undefined));   // woven bamboo canopy
    B.push(HB(7, -2.6, 3.6, 4, 4, 3.2, 0xc98a4a, (f, u, v) => f !== 0 && Math.abs(v - 1.6) < 0.3 ? 0x8a5a2a : undefined), HB(-11, -2.2, 3.6, 3.4, 3.4, 2.6, 0xd8c8a0), HB(-11.4, 0.6, 3.6, 3, 3, 2.2, 0xc8b890));
  } else if (kind === 'med') {
    const cross = (u, v, W, H) => (Math.abs(u - W / 2) < W * 0.12 && Math.abs(v - H / 2) < H * 0.38) || (Math.abs(v - H / 2) < H * 0.13 && Math.abs(u - W / 2) < W * 0.38);
    B.push(HB(-7, -hw + 0.6, 3.6, 14, hw * 2 - 1.2, 6.6, 0xf6f4ee, (f, u, v, b) => { const W = f === 0 ? b.w : f === 1 ? b.w : b.d, H = f === 0 ? b.d : b.h; if (f !== 0 && (v < 0.5 || v > H - 0.5)) return 0xc8382e; return cross(u, v, W, H) ? 0xc8382e : undefined; }));
    B.push(HB(-7.4, -hw + 0.2, 10.2, 14.8, hw * 2 - 0.4, 0.8, 0xe8e4da));
    B.push(HB(9, -2.2, 3.6, 4, 4, 3, 0xf0ece2, (f, u, v) => f !== 0 && cross(u, v, 4, 3) ? 0xc8382e : undefined), HB(9.4, 1.2, 3.6, 3, 2.4, 2.4, 0xf0ece2, (f, u, v) => f !== 0 && cross(u, v, 3, 2.4) ? 0xc8382e : undefined));
    B.push(HB(-L / 2 + 2, -0.3, 3.6, 0.6, 0.6, 15, 0x8a8a84), HB(-L / 2 + 2.6, -0.2, 13, 7, 0.4, 5, 0xf6f4ee, (f, u, v) => f === 0 ? undefined : cross(u, v, 7, 5) ? 0xc8382e : undefined));   // red-cross flag
  } else {
    B.push(HB(-3, -2.4, 3.6, 5, 4.8, 2.2, 0xb8904a, (f, u, v) => f !== 0 && ((u * 2 | 0) + (v * 2 | 0)) % 2 ? 0x8a6a34 : undefined), HB(5, -1.8, 3.6, 3.6, 3.6, 1.4, 0x5a6a5a, (f, u, v) => f === 0 && (u + v) % 1.2 < 0.4 ? 0x3a4a3a : undefined));   // fish basket + net
    B.push(HB(L / 2 - 4, -0.3, 3.6, 0.6, 0.6, 9, 0x6a4a2a), HB(L / 2 - 4.8, -0.9, 11.6, 1.8, 1.8, 2.2, 0xffe4a0, null, { em: 0xffd88a }));
  }
  return axis === 'x' ? B : mirrorBoxes(B);
}
// ---------------------------------------------------------------- infected (milestone 7): chibi zombies after holdfast/zombie.webp
// 23 archetypes catalogued from the 35-cell reference sheet. Each is drawn by code (no image data is copied) into the same
// 8-pose x 4-row sheet layout as people, so walking, attacks, facing and corpses use the existing animation system.
// Shared language from the reference: big round head (~45 % of the height), dark ink outline, green or grey skin, pale yellow
// eyes in dark sockets, open mouth with teeth, arms reaching forward, torn and stained clothes, scuffed shoes. No gore.
const ZSKIN = { green: [0x8aa868, 0x5e7a48, 0xa8c486], olive: [0x9aa870, 0x6a7848, 0xb8c48c], grey: [0xa4a8a2, 0x747a78, 0xc4c8c0], pale: [0xb4b8a4, 0x82887a, 0xd0d4c0] };
const ZTYPES = {
  pale:      { w: 3, skin: 'grey', hair: 'short', hc: 0x8a8a84, top: 0x8a8e94, tst: 'shirt', bot: 0x3a4250 },
  hunchgrey: { w: 2, skin: 'grey', hair: 'tuft', hc: 0x6a6660, top: 0x5a5658, tst: 'tee', bot: 0x4a3e36, post: 'hunch' },
  prisoner:  { w: 2, skin: 'green', hair: 'bald', top: 0xe8e4d8, tst: 'tank', bot: 0x3a4a6a, extra: 'chain', stain: 1 },
  cowboy:    { w: 2, skin: 'green', hair: 'short', hc: 0x4a3426, hat: 'fedora', hatc: 0x6a4a2e, top: 0xc8a878, tst: 'shirt', bot: 0x5a4a3a },
  longblack: { w: 2, skin: 'green', hair: 'long', hc: 0x262022, top: 0x7a8a5a, tst: 'tee', bot: 0x4a4a52, fem: 1 },
  messy:     { w: 3, skin: 'grey', hair: 'messy', hc: 0x5a3a26, top: 0x7a7e84, tst: 'shirt', bot: 0x3a4250 },
  bald:      { w: 4, skin: 'green', hair: 'bald', top: 0x4a3a34, tst: 'tee', bot: 0x3a4a64 },
  small:     { w: 2, skin: 'green', hair: 'tuft', hc: 0x5a4a30, top: 0xd0884a, tst: 'tee', bot: 0x3a4a6a, build: 'small' },
  wrapped:   { w: 2, skin: 'green', hair: 'bald', hat: 'bandage', top: 0x6a6450, tst: 'shirt', bot: 0x3e3a36, extra: 'chain' },
  beanie:    { w: 2, skin: 'olive', hair: 'short', hc: 0x3a2e24, hat: 'beanie', hatc: 0x5a4a3a, top: 0x4e4a3a, tst: 'jacket', bot: 0x4a3e30, post: 'hunch' },
  crawler:   { w: 1, skin: 'green', hair: 'tuft', hc: 0x4a4038, top: 0xd8d4c8, tst: 'shirt', bot: 0x4a4a4e, post: 'crawl' },
  lanky:     { w: 2, skin: 'green', hair: 'bald', top: 0x6a7a52, tst: 'tee', bot: 0x4a5a3a, build: 'lanky', post: 'hunch' },
  stitched:  { w: 2, skin: 'green', hair: 'bald', top: 0x8a5a44, tst: 'tee', bot: 0x3a3a40, extra: 'stitches' },
  spiky:     { w: 2, skin: 'grey', hair: 'spiky', hc: 0x7a4a2a, top: 0x9a9894, tst: 'shirt', bot: 0x3e4658 },
  wildwoman: { w: 2, skin: 'green', hair: 'wild', hc: 0x1e1a1e, top: 0x6a7a4a, tst: 'tee', bot: 0x3a5a8a, bst: 'skirt', fem: 1 },
  fat:       { w: 2, skin: 'green', hair: 'bald', top: 0x7a9a5a, tst: 'tee', bot: 0x4a4a3e, build: 'fat' },
  worker:    { w: 3, skin: 'green', hair: 'tuft', hc: 0x4a3a2a, top: 0x8a5e3e, tst: 'jacket', bot: 0x3a4a64, stain: 1 },
  afro:      { w: 2, skin: 'green', hair: 'afro', hc: 0x1e1a1e, top: 0x2e3a5a, tst: 'jacket', bot: 0x4a3a32 },
  bob:       { w: 2, skin: 'green', hair: 'bob', hc: 0x6a4428, top: 0x6a5a48, tst: 'tee', bot: 0x3a3a44, fem: 1 },
  ginger:    { w: 1, skin: 'green', hair: 'bob', hc: 0xc8682a, top: 0x5a7a9a, tst: 'tee', bot: 0x4a3e3a, fem: 1 },
  elder:     { w: 2, skin: 'pale', hair: 'elder', hc: 0xe0ddd4, top: 0x9a9a92, tst: 'shirt', bot: 0x5a4a3e, post: 'hunch' },
  legchain:  { w: 1, skin: 'olive', hair: 'bald', top: 0x7a6a54, tst: 'tee', bot: 0x3a4a5a, extra: 'legchain' },
  creeper:   { w: 1, skin: 'grey', hair: 'tuft', hc: 0x4a4440, top: 0x5a5450, tst: 'tee', bot: 0x4a3a30, post: 'crouch', stain: 1 }
};
const ZKEYS = Object.keys(ZTYPES), ZW = ZKEYS.reduce((s, k) => s + ZTYPES[k].w, 0);
function hfZombieLook(R) {
  // exactly seven draws from the simulation's seeded stream (same count as the old look), so behaviour stays reproducible
  const r = [R(), R(), R(), R(), R(), R(), R()];
  let q = r[0] * ZW, zt = ZKEYS[0]; for (const k of ZKEYS) { q -= ZTYPES[k].w; if (q <= 0) { zt = k; break; } }
  const T = ZTYPES[zt], tint = (c, k) => mixc(c, k > 0.5 ? 0xfff2dc : 0x2b1a16, Math.abs(k - 0.5) * 0.3);
  const L = { ev: 'zombie', zt, skin: 0xd8b48a, zsk: ZSKIN[T.skin][0], top: tint(T.top, r[1]), bot: tint(T.bot, r[2]), hair: T.hc || 0x3a3434, hatc: T.hatc || 0x5a4a3a,
    lean: r[3], gape: r[4] < 0.5 ? 1 : 0, stain: T.stain || r[5] < 0.25 ? 1 : 0, hat: 0, sleeve: 'short', legs: 'long', r1: 0, r2: 1, r3: 1, seed: Math.floor(r[6] * 999) };
  L.b = { top: L.top, sleeve: L.sleeve, hat: 0, legs: L.legs };
  return L;
}
function drawZombie(L, back, pose) {
  const W = CW, H = CH, col = new Int32Array(W * H).fill(-1), zz = new Int8Array(W * H).fill(-1), T = ZTYPES[L.zt] || ZTYPES.bald;
  const put = (x, y, c, z) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H || c < 0) return; if (zz[y * W + x] > z) return; col[y * W + x] = c; zz[y * W + x] = z; };
  const rect = (x0, y0, x1, y1, c, z, shX, sc) => { for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) put(x, y, shX !== undefined && x >= shX ? sc : c, z); };
  const ell = (cx, cy, rx, ry, c, z, sc, hl, clip) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy > 1 || (clip && !clip(x, y))) continue; put(x, y, sc !== undefined && dx > 0.42 - dy * 0.2 ? sc : hl !== undefined && dx < -0.25 && dy < -0.35 ? hl : c, z); } };
  const line = (x0, y0, x1, y1, c, z, w) => { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < (w || 1); k++) put(x, y + k, c, z); } };
  const SK = ZSKIN[T.skin], sk = grade(SK[0]), sS = grade(SK[1]), sH = grade(SK[2]), top = grade(L.top), tS = mixc(top, 0x2b1a16, 0.32), tH = mixc(top, 0xfff2dc, 0.2), bot = grade(L.bot), bS = mixc(bot, 0x2b1a16, 0.3);
  const shoe = 0x3a3434, shoeS = 0x262222, hair = grade(L.hair), hS = mixc(hair, 0x1a1414, 0.4), hH = mixc(hair, 0xd8d0c0, 0.22), stainC = 0x6a3a30;
  const post = T.post || 'up', build = T.build || 'normal', walk = pose >= 1 && pose <= 4, step = pose === 1 ? 1 : pose === 3 ? -1 : 0, bob = pose === 2 || pose === 4 ? -1 : 0;
  const crawl = post === 'crawl', crouch = post === 'crouch', hunch = post === 'hunch' || pose === 7, small = build === 'small', fat = build === 'fat', lanky = build === 'lanky';
  const cx = 12, gr = 49;
  // body proportions per build (art px). Head is big: chibi like the reference.
  let hx = cx + 2, hy = small ? 26 : lanky ? 15 : 19, hr = small ? 7.5 : 8.8, tt = small ? 33 : lanky ? 24 : 28, lt = small ? 41 : lanky ? 38 : 39, tw = fat ? 8 : lanky ? 4.5 : small ? 4.5 : 6;
  if (hunch) { hx += 3; hy += 3; } if (crouch) { hy += 8; tt += 8; lt += 6; hx += 3; }
  hy += bob; tt += bob;
  if (crawl) { hx = 20; hy = 34 + (walk ? (pose % 2 ? 0 : -1) : 0); hr = 7.6; }
  const zDrop = 0;   // (reserved)
  // ---- legs / lower body
  if (crawl) {
    ell(11, 41, 8.5, 4.2, top, 4, tS, tH);                                                           // torso, belly down
    rect(1, 42, 7, 45, bot, 3, 6, bS); rect(0, 46, 4, 48, shoe, 3);                                  // legs dragging behind
    const a1 = walk ? step : 0;
    line(16, 41, 22 + a1 * 2, 48, sk, 6, 2); ell(23 + a1 * 2, 48, 1.8, 1.3, sk, 6, sS);               // arm planted on the ground
    line(14, 42, 18 - a1 * 2, 48, sS, 2, 2); ell(18 - a1 * 2, 48.5, 1.6, 1.2, sS, 2);
  } else {
    const legW = small ? 3 : 4, lens = gr - 2 - lt, lx = [cx - legW - 0.5 + (fat ? -1 : 0), cx + 1 + (fat ? 1 : 0)];
    const leg = (x, lift, z, shade) => {
      const c = shade ? bS : bot; rect(x, lt, x + legW - 1, gr - 2 - lift, c, z, x + legW - 1, bS);
      if (T.bst === 'skirt') rect(x, lt + 4, x + legW - 1, gr - 2 - lift, shade ? sS : sk, z, x + legW - 1, sS);
      if (fat) rect(x, lt + 4, x + legW - 1, gr - 2 - lift, shade ? sS : sk, z, x + legW - 1, sS);              // shorts
      if (hash2(x + L.seed, 3) < 0.5) put(x + 1, lt + 2 + (L.seed % 3), -1, z);                                 // a rip
      rect(x - (crouch ? 0 : 0), gr - 1 - lift, x + legW + 1, gr - lift, shade ? shoeS : shoe, z + 1, x + legW, shoeS);
    };
    if (crouch) { const k = walk ? step : 0; rect(cx - 5, lt, cx + 6, lt + 3, bot, 3, cx + 4, bS); rect(cx - 5 - k, lt + 4, cx - 2 - k, gr - 2, bS, 3); rect(cx + 3 + k, lt + 4, cx + 6 + k, gr - 2, bot, 4, cx + 5 + k, bS); rect(cx - 6 - k, gr - 1, cx - 1 - k, gr, shoeS, 4); rect(cx + 3 + k, gr - 1, cx + 8 + k, gr, shoe, 5); }
    else { leg(lx[0] + step, walk && step < 0 ? 1 : 0, 2, true); leg(lx[1] - step, walk && step > 0 ? 1 : 0, 3, false); }
    if (T.bst === 'skirt' && !crouch) { for (let y = lt - 1; y <= lt + 4; y++) { const hw = tw + (y - lt + 1) * 0.5; for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) put(x, y, x > cx + hw * 0.4 ? bS : (y === lt + 4 && (x + L.seed) % 3 === 0) ? -1 : bot, 4); } }
    if (T.extra === 'legchain') { for (let i = 0; i < 9; i++) put(lx[1] - step - 2 - i, gr - 1 + (i % 2 ? 0 : -1), i % 2 ? 0x8a8e94 : 0x5a5e64, 6); rect(lx[1] - step - 1, gr - 3, lx[1] - step + legW, gr - 3, 0x8a8e94, 6); }
  }
  // ---- back arm (reaching forward, behind the torso)
  const reach = pose === 6 ? -6 : pose === 7 ? 2 : 0, armY = tt + 3 + (walk ? (pose % 2 ? 0 : 1) : 0);
  if (!crawl) {
    if (back) { line(cx - tw, tt + 2, cx - tw - 2, tt + 9, sS, 1, 2); ell(cx - tw - 2, tt + 10, 1.6, 1.4, sS, 1); }
    else { line(cx - 1, armY - 1, cx + 10 + (fat ? 2 : 0), armY - 2 + reach, sS, 1, 2); ell(cx + 11 + (fat ? 2 : 0), armY - 1.5 + reach, 1.8, 1.5, sS, 1); }
  }
  // ---- torso + clothes
  if (!crawl) {
    for (let y = tt; y < lt + (T.tst === 'jacket' ? 1 : 0); y++) {
      const r = y - tt, bulge = fat ? Math.sin(Math.min(1, r / (lt - tt)) * Math.PI) * 2.2 : 0, ins = r === 0 ? 2 : r === 1 ? 1 : 0, sx = hunch ? Math.round((lt - y) / (lt - tt) * 2) : 0;
      for (let x = Math.round(cx - tw + ins - bulge * 0.4 + sx); x <= Math.round(cx + tw - ins + bulge + sx); x++) {
        let c = x > cx + tw * 0.4 + sx + bulge * 0.5 ? tS : (x < cx - tw * 0.3 + sx && r < 4 ? tH : top);
        if (T.tst === 'tank' && (x < cx - tw + 3 + sx || x > cx + tw - 3 + sx) && r < 5) c = x > cx + sx ? sS : sk;     // bare shoulders
        if (T.tst === 'jacket' && Math.abs(x - cx - sx - 1) < 1 && !back) c = tS;                                       // open front
        if (L.stain && !back && hash2(x * 3 + L.seed, y * 2) < 0.12 && r > 2) c = mixc(c, stainC, 0.55);
        if (hash2(x * 5 + L.seed, y * 7) < 0.05) c = x > cx + sx ? sS : sk;                                           // tears showing skin
        put(x, y, c, 5);
      }
    }
    for (let x = Math.round(cx - tw); x <= Math.round(cx + tw + (fat ? 2 : 0)); x++) if (hash2(x + L.seed, 9) < 0.4) put(x + (hunch ? 0 : 0), lt - 1 + (T.tst === 'jacket' ? 1 : 0), -1, 5);   // ragged hem
    if (T.extra === 'stitches' && !back) for (let j = 0; j < 5; j++) { put(cx - 2 + j, tt + 4 + j, 0x2b1a16, 6); if (j % 2) put(cx - 1 + j, tt + 3 + j, 0x2b1a16, 6); }
  }
  // ---- head
  ell(hx, hy, hr, hr * 0.98, sk, 8, sS, sH);
  if (!back) { ell(hx - hr + 0.5, hy + 1.5, 1.6, 2.2, sk, 8, sS); }   // ear
  else { ell(hx - hr + 0.5, hy + 1, 1.5, 2, sk, 8, sS); ell(hx + hr - 0.5, hy + 1, 1.5, 2, sS, 8); }
  // ---- hair / hats
  const hs = T.hair, capClip = (x, y) => y < hy - (back ? -3 : 2) - ((x * 7) % 3 === 0 ? 1 : 0) || (!back && x < hx - hr + 3 && y < hy + 2);
  if (hs === 'short' || hs === 'messy' || hs === 'spiky') ell(hx, hy - 1, hr + 0.6, hr * 0.92, hair, 9, hS, hH, capClip);
  if (hs === 'messy') for (let i = 0; i < 6; i++) { const x = hx - 7 + i * 3, y = hy - hr - (i % 2); put(x, y, hair, 9); put(x + 1, y - 1, hair, 9); put(x - 1, y + 1, hS, 9); }
  if (hs === 'spiky') for (let i = 0; i < 6; i++) { const x = hx - 7 + i * 2.8; line(x, hy - hr + 1, x + 1, hy - hr - 3, hair, 9); }
  if (hs === 'tuft') { for (let i = 0; i < 5; i++) { const x = hx - 5 + i * 2.6 + (L.seed % 3); line(x, hy - hr + 1, x + (i % 2 ? 1 : -1), hy - hr - 2, hair, 9); } }
  if (hs === 'elder') { ell(hx - hr + 2, hy - 1, 3, 4, hair, 9, hS); ell(hx + hr - 2, hy - 1, 3, 4, hair, 9, hS); for (let i = 0; i < 3; i++) line(hx - 2 + i * 2, hy - hr + 1, hx - 3 + i * 2, hy - hr - 2, hair, 9); }
  if (hs === 'long' || hs === 'wild' || hs === 'bob' || hs === 'afro') {
    const big = hs === 'afro' ? 3 : hs === 'wild' ? 1.8 : 0.8;
    ell(hx, hy - 1, hr + big, hr + big * 0.7, hair, 9, hS, hH, back ? null : (x, y) => y < hy - 2 + ((x * 5) % 3 === 0 ? 1 : 0) || x < hx - hr + 3 || (hs !== 'afro' && x > hx + hr - 1));
    if (hs === 'long' || hs === 'wild') { const y1 = tt + (hs === 'wild' ? 9 : 7); rect(hx - hr - (hs === 'wild' ? 2 : 1), hy, hx - hr + 3, y1, hair, back ? 10 : 2, hx - hr + 2, hS); if (back) rect(hx - hr + 1, hy, hx + hr - 1, y1, hair, 10, hx + 2, hS); else rect(hx + hr - 2, hy + 1, hx + hr + 1, y1 - 3, hS, 2); if (hs === 'wild') for (let i = 0; i < 7; i++) { const x = hx - hr - 2 + i * 3.4; line(x, hy - hr - 1, x + (i % 2 ? 2 : -2), hy - hr - 4, hair, 9); line(hx - hr - 2, hy + 3 + i, hx - hr - 4, hy + 4 + i, hair, 2); } }
    if (hs === 'bob') rect(hx - hr - 1, hy, hx - hr + 3, hy + 6, hair, back ? 10 : 9, hx - hr + 2, hS);
    if (hs === 'afro') for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; put(hx + Math.cos(a) * (hr + 3.5), hy - 1 + Math.sin(a) * (hr + 2.5), hair, 9); }
  }
  if (T.hat === 'fedora') { ell(hx, hy - hr + 2, hr + 4.5, 2.2, grade(L.hatc), 12, mixc(grade(L.hatc), 0x2b1a16, 0.3)); rect(hx - hr + 2, hy - hr - 4, hx + hr - 2, hy - hr + 1, grade(L.hatc), 12, hx + 3, mixc(grade(L.hatc), 0x2b1a16, 0.3)); rect(hx - hr + 2, hy - hr, hx + hr - 2, hy - hr, mixc(grade(L.hatc), 0x2b1a16, 0.5), 12); put(hx, hy - hr - 4, -1, 12); }
  if (T.hat === 'beanie') { ell(hx, hy - 2, hr + 0.8, hr * 0.85, grade(L.hatc), 12, mixc(grade(L.hatc), 0x2b1a16, 0.3), undefined, (x, y) => y < hy - 3); rect(hx - hr, hy - 4, hx + hr, hy - 3, mixc(grade(L.hatc), 0xfff2dc, 0.15), 12); }
  if (T.hat === 'bandage') { const wc = 0xdcd2b8, ws = 0xa89c80; ell(hx, hy - 1, hr + 0.6, hr * 0.96, wc, 12, ws, 0xf0e8d0, (x, y) => back || y < hy - 3 || (y > hy + 2 && y < hy + 5) || x < hx - hr + 3); for (let y = Math.round(hy - hr); y < hy + 5; y += 2) line(hx - hr + 1, y, hx + hr - 1, y + 1, ws, 12); if (!back) line(hx + 2, hy - 2, hx + hr, hy + 4, ws, 12); }
  // ---- face (front 3/4, looking right): pale eyes in dark sockets, gaping mouth with teeth
  if (!back) {
    const ey = hy + 1, e1 = hx - 4, e2 = hx + 3, sock = mixc(sS, 0x2b1a16, 0.45), eyeC = 0xf0e6a8, pup = 0x2b1a16;
    for (const [ex, w] of [[e1, 3], [e2, 3]]) { rect(ex - 1, ey - 1, ex + w, ey + 3, sock, 14); rect(ex, ey, ex + w - 1, ey + 2, eyeC, 15); put(ex + (ex === e2 ? 2 : 1), ey + 1, pup, 16); }
    if ((L.seed % 4) === 0) put(e2 + 1, ey + 2, sock, 16);                                                   // droopy eye
    const my = ey + 5, mx = hx - 1, mw = L.gape ? 5 : 4, mh = L.gape ? 3 : 2;
    rect(mx, my, mx + mw, my + mh, 0x4a1c1e, 15); for (let i = 0; i <= mw; i += 2) put(mx + i, my, 0xf0ece0, 16); if (L.gape) for (let i = 1; i <= mw; i += 2) put(mx + i, my + mh, 0xe8e2d0, 16);
    put(hx + 1, ey + 3, sS, 15);                                                                            // nose shadow
    if (T.extra === 'stitches') { line(hx - 6, hy - 5, hx - 1, hy - 2, 0x2b1a16, 16); for (let j = 0; j < 3; j++) put(hx - 5 + j * 2, hy - 5 + j, 0xb8a8a0, 16); }
    if (L.stain && (L.seed % 3) === 0) { put(hx + 4, my + 2, stainC, 15); put(hx + 5, my + 3, stainC, 15); }
  }
  // ---- front arm: the classic forward reach (raised for an attack, low lunge for a bite)
  if (!crawl) {
    const ax = cx + (hunch ? 2 : 0), ay = armY + 1, tx = ax + 13 + (fat ? 2 : 0), ty = ay + reach + (walk ? (pose % 2 ? -1 : 0) : 0);
    const sl = T.tst === 'tank' ? 0 : 4, c0 = T.tst === 'jacket' || T.tst === 'shirt' ? top : top;
    if (back) { line(cx + tw, tt + 2, cx + tw + 3, tt + 8, top, 13, 2); ell(cx + tw + 3, tt + 9, 1.7, 1.5, sk, 13, sS); }
    else {
      for (let i = 0; i <= 13; i++) { const q = i / 13, x = ax + (tx - ax) * q, y = ay + (ty - ay) * q; put(x, y, i < sl ? c0 : sk, 13); put(x, y + 1, i < sl ? tS : sS, 13); }
      ell(tx + 1, ty + 0.5, 2, 1.7, sk, 13, sS, sH); put(tx + 3, ty, sk, 13); put(tx + 3, ty + 1.5, sS, 13);           // hand with fingers
      if (T.extra === 'chain') { for (let i = 0; i < 7; i++) put(tx + (i % 2), ty + 3 + i, i % 2 ? 0x9a9ea4 : 0x5e6268, 13); rect(tx - 1, ty + 1, tx + 1, ty + 2, 0x8a8e94, 14); }
    }
  }
  // ---- ink: dark outline around the figure + lines where a nearer part overlaps a farther one
  const out = col.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (col[i] < 0) { if ((x > 0 && col[i - 1] >= 0) || (x < W - 1 && col[i + 1] >= 0) || (y > 0 && col[i - W] >= 0) || (y < H - 1 && col[i + W] >= 0)) out[i] = 0x1e1818; continue; }
    const z = zz[i]; if (z >= 14) continue;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && col[j] >= 0 && zz[j] < z - 2 && !(z === 9 && zz[j] === 8)) { out[i] = mixc(col[i], 0x1e1818, 0.68); break; }
  }
  return out;
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
  if (spc === 'fern' || spc === 'cycad') return fernTreeSprite(v % 6, season, spc === 'cycad');
  if (spc === 'fruit') return treeSprite('mai', season, v % 6);
  if (spc === 'oak') return treeSprite('dau', season, 1);
  return treeSprite(spc, season, v % 6);
}
