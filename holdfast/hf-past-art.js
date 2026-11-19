'use strict';
// ===== Holdfast PAST — art: prehistoric buildings, props, palisade, tribal people and dinosaurs (DOM-free; built on bake/box + the pilot painters) =====
// Everything is drawn by code in the same language as the Current timeline: box models with per-pixel painters, cocoa ink, warm grade.
// The same map seed, lots, sites and props are used; only what stands there changes (see docs/holdfast/PAST-DESIGN.md).
const PAST = () => HF.era === 'past';
const THATCH = [0xc8a860, 0xb89a54, 0xd4b46c, 0xa88a4a], DAUB = [0xd8c4a0, 0xc8b08a, 0xe0cca8, 0xc8a884, 0xb89a78], HIDE = [0xa8784a, 0x8a6240, 0xc09060, 0x7a5434, 0xb48a5a, 0x9a7048];
const LOG = 0x8a6440, LOG_D = 0x5e4028, LOG_L = 0xb08a5a, ROPE = 0xc8ac70, OCHRE = 0xc0602e, PAINT_W = 0xf0e6cc, PAINT_K = 0x2e2420, PAINT_G = 0x4f8a5a;

// ---------------------------------------------------------------- painters
const thatchP = (c, seed, k0) => (f, u, v, b, wx, wy) => {
  const k = b.k || 0, n = vnoise(wx / 2.4 + seed, wy / 2.4 + k * 0.7), h = hs(Math.floor(wx * 1.6 + wy * 0.3) + seed, Math.floor((wx - wy) * 0.7) + k);
  if (f === 0) { let col = n > 0.6 ? mixc(c, 0xfff0c0, 0.18) : n < 0.36 ? mixc(c, 0x5a4020, 0.2) : c; if (h > 0.86) col = mixc(col, 0x6a4a24, 0.35); else if (h < 0.08) col = mixc(col, 0xfff4d0, 0.3); if (vnoise(wx / 6 + seed * 3, wy / 6) > 0.72) col = mixc(col, 0x6a7a3a, 0.35); return col; }
  if (v < 0.55) return mixc(c, 0x3a2414, 0.5);                                                      // the dark under-edge of each thatch layer
  const st = hs(Math.floor(u * 2.2) + seed + k * 7, 1); let col = st > 0.7 ? mixc(c, 0xfff0c0, 0.14) : st < 0.25 ? mixc(c, 0x4a3018, 0.28) : mixc(c, 0x6a4a24, 0.12);
  if (v > b.h - 0.5) col = mixc(col, 0xfff0c0, 0.1); return col;
};
const logP = (c, seed, lash) => (f, u, v, b) => {
  if (f === 0) { const W = b.w, D = b.d, r = Math.hypot((u % 2.2) - 1.1, (v % 2.2) - 1.1); return r < 0.45 ? 0xd8b484 : r < 0.9 ? 0xc49a68 : 0x6a4a2e; }
  const lu = u % 2.2, i = Math.floor(u / 2.2); let col = lu < 0.35 ? mixc(c, 0x2b1a16, 0.45) : lu < 0.9 ? mixc(c, 0xfff0d0, 0.16) : lu > 1.85 ? mixc(c, 0x2b1a16, 0.22) : c;
  if (hs(i + seed, Math.floor(v / 3)) > 0.82) col = mixc(col, 0x4a3420, 0.25);
  if (vnoise(u / 2 + seed, v / 5) > 0.66) col = mixc(col, 0x6a5a3a, 0.2);
  if (lash !== false && (Math.abs(v - b.h * 0.72) < 0.45 || Math.abs(v - b.h * 0.3) < 0.45)) col = (u * 2 | 0) % 2 ? ROPE : mixc(ROPE, 0x6a4a24, 0.35);
  if (v < 2) col = mixc(col, 0x4a3424, 0.35); return col;
};
// wattle-and-daub: a plastered wall over a woven frame, timber posts, a painted ochre band, door and window openings
function daubP(S) {
  return (f, u, v, b, wx, wy) => {
    if (f === 0) return 0x7a6a50;
    const W = f === 1 ? b.w : b.d;
    if (u < 1.1 || u > W - 1.1 || (S.posts && (u % S.posts) < 1.1)) { const lu = u % 1.1; return lu < 0.3 ? LOG_D : lu < 0.7 ? LOG_L : LOG; }
    const dr = S.door; if (dr && dr.f === f && u >= dr.u && u < dr.u + dr.w && v < dr.h) {
      const x = u - dr.u; if (x < 0.7 || x > dr.w - 0.7 || v > dr.h - 0.7) return LOG_D;
      if (dr.open && x > dr.w * 0.45) return 0x1e1612;                                             // the hide flap half pulled back
      const hc = dr.c || HIDE[0]; return (Math.abs(x - dr.w * 0.45) < 0.25 || (v % 3) < 0.25) ? mixc(hc, 0x2b1a16, 0.35) : vnoise(x, v / 2) > 0.62 ? mixc(hc, 0xfff0d0, 0.15) : hc;
    }
    for (const w of S.wins[f] || []) if (u >= w.u && u < w.u + w.w && v >= w.v && v < w.v + w.h) { const x = u - w.u, y = v - w.v; if (x < 0.5 || x > w.w - 0.5 || y < 0.5 || y > w.h - 0.5) return LOG_D; if (w.lit) EM = 0xffb860; if ((x % 1.6) < 0.45) return LOG; return w.lit ? 0x6a3a1e : 0x241a16; }
    if (S.band && Math.abs(v - S.band) < 1) { const z = ((u + (v - S.band) * 1.2) % 3 + 3) % 3; return z < 1 ? S.bandC || OCHRE : v < S.band ? mixc(S.wall, 0x3a2414, 0.1) : S.wall; }
    if (S.hand && S.hand.f === f) { const dx = u - S.hand.u, dy = v - S.hand.v; if (dx * dx / 4 + dy * dy / 5 < 1 || (dy > 1 && dy < 4 && Math.abs(dx - Math.round(dx)) < 0.3 && Math.abs(dx) < 2)) return S.hand.c; }
    let col = S.wall; const n = vnoise(wx / 2 + S.seed, wy / 2 + v / 2);
    if (n > 0.7) { const wv = ((u * 1.4 + Math.floor(v / 1.4) * 0.7) % 1.4); col = wv < 0.5 ? 0x8a6a44 : 0xa8845a; }        // the weave showing where the daub has flaked
    else if (n > 0.58) col = mixc(col, 0x8a7458, 0.25); else if (n < 0.2) col = mixc(col, 0xfff4dc, 0.12);
    if (v < 2.6) col = mixc(col, 0x5a4430, 0.4 * (2.6 - v) / 2.6 + 0.12);
    return col;
  };
}
const hideP = (c, seed) => (f, u, v, b) => { if (f === 0) { const n = vnoise(u / 3 + seed, v / 3); return n > 0.6 ? mixc(c, 0xfff0d0, 0.16) : n < 0.3 ? mixc(c, 0x3a2414, 0.16) : c; } const W = f === 1 ? b.w : b.d; if ((u % 4.5) < 0.3 && v > 1) return mixc(c, 0x2b1a16, 0.4); if (v < 0.6) return mixc(c, 0x2b1a16, 0.3); return vnoise(u / 2 + seed, v / 2) > 0.64 ? mixc(c, 0xfff0d0, 0.14) : u > W - 0.6 ? mixc(c, 0x2b1a16, 0.2) : c; };
const flintP = (f, u, v, b, wx, wy) => { const n = vnoise(wx * 1.3 + u, wy * 1.3 + v); return f === 0 ? (n > 0.55 ? 0x8a8a94 : 0x6a6a78) : n > 0.6 ? 0x5a5a66 : 0x7a7a86; };
const paintedHideP = (seed) => (f, u, v, b) => {   // hunting scenes in ochre and charcoal on a stretched hide: little figures, a beast, a sun
  if (f === 0) return 0xc8a06a; const W = f === 1 ? b.w : b.d; if (u < 0.6 || u > W - 0.6 || v < 0.6 || v > b.h - 0.6) return LOG_D;
  const x = u, y = b.h - v, cx = W * 0.78, cy = b.h * 0.3; if (Math.hypot(x - cx, y - cy) < 1.6) return 0xe0902e; if (Math.hypot(x - cx, y - cy) < 2.4 && ((Math.atan2(y - cy, x - cx) * 8 / TAU) % 1 + 1) % 1 < 0.3) return 0xe0902e;
  for (let i = 0; i < 3; i++) { const fx = 2 + i * 2.4, fy = b.h * 0.62; if ((Math.abs(x - fx) < 0.3 && y > fy - 2 && y < fy + 1) || (Math.abs(y - fy + 1.6) < 0.3 && Math.abs(x - fx) < 0.3) || Math.hypot(x - fx, y - fy + 2.6) < 0.5) return PAINT_K; if (Math.abs(x - fx - 0.8 + (y - fy) * 0.5) < 0.2 && y > fy - 3 && y < fy - 1) return PAINT_K; }
  const bx = W * 0.62, by = b.h * 0.6; if (((x - bx) / 2.6) ** 2 + ((y - by) / 1.2) ** 2 < 1 || (x > bx + 1.6 && x < bx + 3.6 && Math.abs(y - by + 1.4) < 0.5) || (Math.abs(x - bx + 1.4) < 0.3 && y > by && y < by + 1.6) || (Math.abs(x - bx + 1) < 0.3 && y > by && y < by + 1.6)) return 0x9a3a22;
  return vnoise(u / 2 + seed, v / 2) > 0.66 ? 0xb88a58 : 0xd0aa74;
};
// stacked thatch: a hip roof (shrinking on both axes) or a gable (shrinking along d only)
function hipThatch(B, x, y, z, w, d, n, c, seed, o) {
  const sx = (w / 2 - (o && o.top || 1.4)) / n, sy = (d / 2 - (o && o.top || 1.4)) / n, hh = (o && o.hh) || 2.6;
  for (let k = 0; k < n; k++) B.push(HB(x + k * sx, y + k * sy, z + k * hh, w - 2 * k * sx, d - 2 * k * sy, hh, c, thatchP(c, seed), { k }));
  return z + n * hh;
}
function gableThatch(B, x, y, z, w, d, n, c, seed, hh) { hh = hh || 2.6; const s = d / (2 * n); for (let k = 0; k < n; k++) B.push(HB(x, y + k * s, z + k * hh, w, d - 2 * k * s, hh, c, thatchP(c, seed), { k })); return z + n * hh; }
const antlers = (B, x, y, z, c) => { c = c || 0xe8dcc0; B.push(HB(x - 0.5, y, z, 1, 1, 3, c), HB(x - 3.5, y, z + 2.4, 7, 1, 1, c), HB(x - 3.5, y, z + 3.4, 1, 1, 2.6, c), HB(x + 2.5, y, z + 3.4, 1, 1, 2.6, c), HB(x - 1.6, y, z + 3.4, 0.8, 1, 1.6, c), HB(x + 0.8, y, z + 3.4, 0.8, 1, 1.6, c)); };
const herbs = (B, x0, x1, y, z, seed) => { for (let x = x0, i = 0; x < x1; x += 2.6, i++) { const c = [0x5a8a3a, 0x7a9a44, 0x8a6aa8, 0xc8a040][(i + seed) % 4]; B.push(HB(x, y, z - 3.6, 1.4, 0.8, 3.2, c, (f, u, v) => v < 0.8 ? mixc(c, 0x2b1a16, 0.3) : undefined), HB(x + 0.4, y, z - 0.4, 0.6, 0.6, 0.8, ROPE)); } };

// ---------------------------------------------------------------- dwellings: timber-and-wattle houses with steep thatch (same lot footprint as Current)
function pastHouse(o) {
  const R = mulberry32(o.seed + 1), { w, d, floors } = o, B = [], seed = o.seed % 97, wall = sp(R, DAUB), roof = sp(R, THATCH), hc = sp(R, HIDE);
  const H = floors > 1 ? 19 : 14, du = Math.round(w * 0.3), Z0 = 1.6;
  const S = { wall, seed, posts: 9 + (seed % 3) * 2, band: R() < 0.55 ? 8 + (seed % 3) : 0, bandC: sp(R, [OCHRE, 0x8a3a24, 0x3a5a7a, 0xe0b04a]), wins: { 1: [], 2: [] }, door: { f: 1, u: du, w: 7, h: 10.5, c: hc, open: R() < 0.5 } };
  for (let u = 3; u + 4 < w - 2; u += 12) if (u + 4 < du - 1 || u > du + 8) S.wins[1].push({ u, v: 6, w: 3.6, h: 3.4, lit: R() < 0.6 });
  for (let u = 4; u + 4 < d - 2; u += 11) S.wins[2].push({ u, v: 6, w: 3.6, h: 3.4, lit: R() < 0.5 });
  if (R() < 0.3) S.hand = { f: 2, u: d * 0.5, v: 9, c: sp(R, [OCHRE, PAINT_W, 0x8a3a24]) };
  B.push(HB(-0.6, -0.6, 0, w + 1.2, d + 1.2, Z0, 0x9a948a, stoneP));                          // a dry-stone footing
  B.push(HB(0, 0, Z0, w, d, H, wall, daubP(S)));
  for (const [x, y] of [[-0.8, -0.8], [w - 0.6, -0.8], [-0.8, d - 0.6], [w - 0.6, d - 0.6]]) B.push(HB(x, y, 0, 1.4, 1.4, H + Z0 + 1, LOG, logP(LOG, seed, false)));
  const top = hipThatch(B, -3, -3, Z0 + H, w + 6, d + 6, floors > 1 ? 8 : 7, roof, seed, { hh: floors > 1 ? 3 : 2.8, top: 2.2 });
  B.push(HB(w / 2 - 2, d / 2 - 2, top, 4, 4, 1.4, mixc(roof, 0x2b1a16, 0.45)));                // smoke hole
  o.chim = [w / 2, d / 2, top + 1.4];
  if (R() < 0.45) antlers(B, du + 3.5, d + 0.2, Z0 + 11);
  if (o.porch) {   // a hide awning on two poles in front of the door
    const px = Math.max(1, du - 6), pw = Math.min(w - px - 1, 18), ac = mixc(hc, 0xfff0d0, 0.1);
    for (const cx of [px, px + pw - 1]) B.push(HB(cx, d + 6.4, 0, 1, 1, 11.5, LOG, logP(LOG, seed + 3, false)));
    B.push(HB(px - 0.6, d - 0.2, 11.4, pw + 1.2, 7.8, 0.8, ac, hideP(ac, seed)));
    if (R() < 0.6) for (let i = 0; i < 3; i++) B.push(HB(px + 2 + i * 4, d + 2, 0, 3, 2.4, 2.2, sp(R, [0xb8743a, 0x9a5a2e, 0xc8884a]), (f, u, v) => v > 1.6 ? 0x6a3a1e : undefined));   // clay pots
  }
  if (o.garage) {   // a lean-to woodshed instead of the garage
    const gx = w, gw = 12, gd = Math.min(d, 20);
    B.push(HB(gx + 0.4, d - gd, 0, gw - 1, gd, 6, LOG, (f, u, v) => f === 0 ? 0xc49a68 : ((Math.floor(v / 1.6) + Math.floor(u / 3)) % 2 ? 0x9a7046 : 0x7a5434)));
    for (const [x, y] of [[gx + gw - 1, d - gd], [gx + gw - 1, d - 1]]) B.push(HB(x, y, 0, 1, 1, 10, LOG_D));
    gableThatch(B, gx - 0.5, d - gd - 1, 10, gw + 1, gd + 2, 3, roof, seed + 4, 1.8);
  }
  o.H = top + 1.4;
  return B;
}

// ---------------------------------------------------------------- civic buildings of the tribe
function pastCivic(b) {
  const R = mulberry32(b.seed * 31 + 7), w = b.w, d = b.d, B = [], seed = b.seed % 97;
  const foot = () => B.push(HB(-0.6, -0.6, 0, w + 1.2, d + 1.2, 1.6, 0x9a948a, stoneP));
  if (b.kind === 'barracks') {        // the hunters' longhouse: log walls, gable thatch with an antler crest, spear racks, a hide shield row
    foot(); B.push(HB(0, 0, 1.6, w, d, 15, LOG, logP(LOG, seed)));
    const S = { wall: LOG, seed, wins: { 1: [] }, door: { f: 1, u: 30, w: 8, h: 11, c: HIDE[3] } }, dp = daubP(S);
    B.push(HB(29, d - 0.2, 1.6, 10, 0.6, 12, LOG_D, (f, u, v, bb, wx, wy) => f === 1 ? dp(f, u + 29, v, { w, d: 0.6, h: 12 }, wx, wy) : undefined));
    const top = gableThatch(B, -2.5, -2.5, 16.6, w + 5, d + 5, 7, THATCH[1], seed, 2.6);
    for (let x = 6; x < w - 4; x += 12) antlers(B, x, d / 2, top - 0.6);
    for (let i = 0; i < 5; i++) { const sc = [OCHRE, 0xe8dcc0, 0x3a5a7a, 0x8a3a24, 0xe0b04a][i]; B.push(HB(4 + i * 5, d + 0.2, 5, 3.6, 0.5, 3.6, HIDE[0], (f, u, v) => { if (f !== 1) return undefined; const r = Math.hypot(u - 1.8, v - 1.8); return r > 1.8 ? -1 : r > 1.3 ? LOG_D : r < 0.6 ? sc : undefined; })); }
    b.H = top;
  } else if (b.kind === 'infirmary') {   // the healer's lodge: a big two-tier lodge, herbs drying under the eaves, a green hand painted by the door
    const du = Math.round(w * 0.42), S = { wall: 0xe4d4b4, seed, posts: 10, band: 10, bandC: PAINT_G, wins: { 1: [], 2: [] }, door: { f: 1, u: du, w: 9, h: 12, c: 0xc8b088, open: 1 }, hand: { f: 1, u: du - 5, v: 7.5, c: PAINT_G } };
    for (let u = 4; u + 4 < w - 3; u += 11) if (u + 4 < du - 7 || u > du + 10) S.wins[1].push({ u, v: 6, w: 4, h: 3.6, lit: 1 });
    for (let u = 4; u + 4 < d - 3; u += 10) S.wins[2].push({ u, v: 6, w: 4, h: 3.6, lit: 1 });
    foot(); B.push(HB(0, 0, 1.6, w, d, 22, S.wall, daubP(S)));
    const t1 = hipThatch(B, -3.5, -3.5, 23.6, w + 7, d + 7, 4, THATCH[0], seed, { hh: 2.6, top: 10 });
    B.push(HB(6, 6, t1, w - 12, d - 12, 8, S.wall, daubP(Object.assign({}, S, { door: null, hand: null, wins: {} }))));
    const t2 = hipThatch(B, 3, 3, t1 + 8, w - 6, d - 6, 7, THATCH[2], seed + 5, { hh: 2.8, top: 2 });
    herbs(B, 2, w - 2, d + 2.4, 23.4, seed); herbs(B, 2, d - 2, 0, 23.4, seed + 1);
    B.push(HB(du - 4, d, 13, 17, 7, 0.8, 0xd8c098, hideP(0xd8c098, seed)), HB(du - 3.6, d + 6, 0, 1, 1, 13, LOG), HB(du + 11.6, d + 6, 0, 1, 1, 13, LOG));
    b.H = t2;
  } else if (b.kind === 'stable') {      // the beast pen barn: open log stalls, a high thatch, feed troughs
    foot(); B.push(HB(0, 0, 1.6, w, d, 14, LOG, (f, u, v, bb, wx, wy) => { if (f === 1) for (let k = 0; k < 4; k++) { const u0 = 4.5 + k * 9; if (u >= u0 && u < u0 + 7 && v < 10) { if (u < u0 + 0.7 || u > u0 + 6.3) return LOG_D; if (v > 4.6) return 0x1e1614; return (u * 2 | 0) % 2 ? LOG_L : LOG; } } return logP(LOG, seed)(f, u, v, bb, wx, wy); }));
    const top = gableThatch(B, -2.5, -2.5, 15.6, w + 5, d + 5, 7, THATCH[3], seed, 2.6); antlers(B, w / 2, d / 2, top - 0.8);
    b.H = top;
  } else if (b.kind === 'workshop') {    // the craft hall: an open-sided timber hall (posts + a big thatch), hides stretched between the posts
    foot(); for (let x = 0; x <= w - 1; x += 9) for (const y of [0, d - 1.2]) B.push(HB(x, y, 1.6, 1.4, 1.4, 16, LOG, logP(LOG, seed + x, false)));
    B.push(HB(0, 0, 1.6, w, 1, 9, LOG_D, logP(LOG_D, seed)));                                  // a low back wall
    for (let x = 5; x < w - 6; x += 18) { const c = sp(R, HIDE); B.push(HB(x, d - 0.8, 5, 7, 0.4, 8, c, hideP(c, seed + x))); }
    const top = gableThatch(B, -2.5, -2.5, 17.6, w + 5, d + 5, 6, THATCH[1], seed, 2.4);
    b.H = top;
  } else if (b.kind === 'church') {      // the Ancestor Hall: stone plinth, log walls, a huge steep thatch, carved posts, and a totem spire at the front
    B.push(HB(-1, -1, 0, w + 2, d + 2, 3, 0xb8ae98, stoneP));
    B.push(HB(16, 2, 3, 26, 12, 22, LOG, logP(LOG, seed + 3)));                                // the back apse
    hipThatch(B, 14, 0, 25, 30, 16, 6, THATCH[0], seed + 2, { hh: 2.6, top: 2 });
    B.push(HB(10, 10, 3, 38, 70, 26, LOG, logP(LOG, seed)));                                   // the great hall
    for (const y0 of [16, 30, 52, 66]) B.push(HB(48, y0, 3, 2, 2, 28, LOG_D, logP(LOG_D, seed + y0, false)), HB(47.4, y0 - 0.6, 31, 3.2, 3.2, 2, 0xe8dcc0));   // carved posts
    const top = gableThatch(B, 6, 6, 29, 46, 78, 14, THATCH[2], seed, 3.2);                      // steep: the roof ridge stands at ~74
    for (let y = 12; y < 80; y += 16) antlers(B, 29, y, top - 1);
    B.push(HB(0, 34, 3, w, 20, 22, 0xd8c4a0, daubP({ wall: 0xd8c4a0, seed: 7, posts: 8, band: 12, bandC: OCHRE, wins: { 1: [{ u: 4, v: 8, w: 4, h: 5, lit: 1 }, { u: w - 8, v: 8, w: 4, h: 5, lit: 1 }], 2: [{ u: 8, v: 8, w: 4, h: 5, lit: 1 }] } })));
    hipThatch(B, -2, 32, 25, w + 4, 24, 7, THATCH[0], seed + 4, { hh: 2.8, top: 2 });
    // the totem spire: stacked carved faces (eyes, beaks, wings), painted in ochre, white, charcoal and turquoise, an antler crown on top
    const TX = 21, TY = 78, TW = 16, TD = 14, faces = [OCHRE, 0x3a8a8a, PAINT_W, 0x8a3a24, 0xe0b04a, 0x3a5a7a];
    B.push(HB(TX - 3, TY - 3, 3, TW + 6, TD + 6, 4, 0x9a948a, stoneP));
    for (let i = 0; i < 6; i++) { const z0 = 7 + i * 15, fc = faces[i], c2 = faces[(i + 2) % 6], ww = TW - i * 1.2, dd = TD - i * 1.1, ox = TX + i * 0.6, oy = TY + i * 0.55;
      B.push(HB(ox, oy, z0, ww, dd, 15, LOG, (f, u, v, bb) => { if (f === 0) return LOG_L; const W2 = f === 1 ? bb.w : bb.d, c = W2 / 2;
        if (Math.abs(v - 13.6) < 0.8 || v < 0.8) return LOG_D;
        if (Math.hypot(u - c + 3, v - 9.5) < 1.9 || Math.hypot(u - c + 3, v - 9.5) < 2.6 && Math.hypot(u - c + 3, v - 9.5) > 2) return Math.hypot(u - c + 3, v - 9.5) < 0.8 ? PAINT_K : PAINT_W;     // eyes
        if (Math.hypot(u - c - 3, v - 9.5) < 1.9 || Math.hypot(u - c - 3, v - 9.5) < 2.6 && Math.hypot(u - c - 3, v - 9.5) > 2) return Math.hypot(u - c - 3, v - 9.5) < 0.8 ? PAINT_K : PAINT_W;
        if (Math.abs(u - c) < 1.2 && v > 4 && v < 8.4) return c2;                                // the nose / beak
        if (v > 2 && v < 4 && Math.abs(u - c) < 4.5) return (u * 2 | 0) % 2 ? PAINT_K : PAINT_W;      // the mouth with teeth
        if (u < 1.2 || u > W2 - 1.2) return mixc(fc, 0x2b1a16, 0.3);
        return vnoise(u, v / 3 + i) > 0.62 ? mixc(fc, 0x2b1a16, 0.18) : fc; }));
      if (i % 2 === 0) B.push(HB(ox - 5, oy + dd / 2 - 0.5, z0 + 7, ww + 10, 1, 5, c2, (f, u, v) => (u < 4.5 || u > ww + 5.5) && f !== 0 ? (v > 3.5 ? mixc(c2, 0xfff0d0, 0.25) : (u * 1.5 | 0) % 2 ? c2 : mixc(c2, 0x2b1a16, 0.3)) : undefined));   // wings
    }
    B.push(HB(TX + 4, TY + 3.6, 97, 7, 7, 8, LOG_D)); antlers(B, TX + 7.5, TY + 7, 105); antlers(B, TX + 7.5, TY + 6, 111, 0xf0e6cc);
    B.push(HB(TX + 6.5, TY + 6, 116, 2, 2, 6, 0xe0b04a), HB(TX + 5, TY + 6, 120, 5, 2, 2, 0xe0b04a));
    for (let k = 0; k < 3; k++) B.push(HB(TX - 6 + k * 1.5, TY + TD + 5 - k * 1.6, 0, TW + 12 - k * 3, 4, 1.2 + k * 1.2, 0xb8ae98, stoneP));
    b.H = 122;
  } else if (b.kind === 'school') {      // the Story Lodge: a long lodge with painted hide panels on the front, feathers on the posts, a sun disc
    const S = { wall: 0xd8c09a, seed: 11, posts: 0, band: 0, wins: { 1: [], 2: [{ u: 6, v: 6, w: 4, h: 4, lit: 1 }, { u: 22, v: 6, w: 4, h: 4, lit: 1 }] }, door: { f: 1, u: w / 2 - 4.5, w: 9, h: 12, c: 0xc89a60, open: 1 } };
    foot(); B.push(HB(0, 0, 1.6, w, d, 18, S.wall, daubP(S)));
    for (const [x, ww] of [[4, 22], [w - 26, 22]]) B.push(HB(x, d + 0.1, 4, ww, 0.5, 11, 0xd0aa74, paintedHideP(seed + x)));
    for (let x = 0; x <= w; x += 14) B.push(HB(Math.min(x, w - 1.4), d + 1, 0, 1.4, 1.4, 22, LOG, logP(LOG, seed + x, false)), HB(Math.min(x, w - 1.4) + 0.4, d + 1.4, 18, 0.6, 0.6, 4, [0xd9534f, 0x3a8a8a, 0xe0b04a, 0xf0e6cc][(x / 14 | 0) % 4]));
    const top = gableThatch(B, -3, -3, 19.6, w + 6, d + 6, 8, THATCH[0], seed, 2.7);
    B.push(HB(w / 2 - 4, d / 2 - 0.3, top - 1, 8, 0.6, 8, 0xe0902e, (f, u, v) => { const r = Math.hypot(u - 4, v - 4); if (r > 4) return -1; if (r > 3.2) return ((Math.atan2(v - 4, u - 4) * 6 / Math.PI) | 0) % 2 ? 0xe0902e : -1; return r < 1 ? 0xf6e0a0 : undefined; }));
    b.H = top + 7;
  } else if (b.kind === 'barn' || b.kind === 'farmbarn') {   // the granary barn (and an abandoned one out on the old farm site)
    const ruin = b.kind === 'farmbarn';
    foot(); B.push(HB(0, 0, 1.6, w, d, 13, LOG, logP(ruin ? 0x6a5a48 : LOG, seed)));
    if (ruin) { B.push(HB(0, 0, 14.6, w * 0.6, d, 3, 0x7a6a44, thatchP(0x8a7a50, seed)), HB(w * 0.3, d * 0.2, 1.6, 10, 8, 3, 0x5a4a30)); }
    else gableThatch(B, -2.5, -2.5, 14.6, w + 5, d + 5, 7, THATCH[3], seed, 2.6);
  } else if (b.kind === 'kitchen') {     // the cookhouse: open sides, a big thatch with a smoke hole, the roasting spit out front
    foot(); for (const [x, y] of [[0, 0], [w - 1.4, 0], [0, d - 1.4], [w - 1.4, d - 1.4], [w / 2, 0], [w / 2, d - 1.4]]) B.push(HB(x, y, 1.6, 1.4, 1.4, 12, LOG, logP(LOG, seed + x, false)));
    B.push(HB(0, 0, 1.6, w, 1, 6, 0x9a948a, stoneP), HB(w / 2 - 4, d / 2 - 3, 1.6, 8, 6, 2.4, 0x8a847c, stoneP), HB(w / 2 - 3, d / 2 - 2, 4, 6, 4, 0.6, 0x3a2420, (f, u, v) => vnoise(u * 2, v * 2) > 0.5 ? 0xff9a3a : 0xc8501e, { em: 0xff8a30 }));
    const top = hipThatch(B, -3, -3, 13.6, w + 6, d + 6, 6, THATCH[1], seed, { hh: 2.4, top: 3 }); b.chim = [w / 2, d / 2, top];
  } else if (b.kind === 'ruin') {        // an abandoned hut out in the wilds: walls slumped, thatch fallen in
    const S = { wall: 0xb8a888, seed, posts: 8, wins: { 1: [{ u: 5, v: 5, w: 4, h: 4 }] } };
    B.push(HB(0, 0, 0, w, d, 9, S.wall, daubP(S)), HB(2, 2, 9, w * 0.55, d - 4, 3, 0x8a7a50, thatchP(0x8a7a50, seed)), HB(w * 0.55, d * 0.3, 0, 8, 10, 3, 0x6a5a3a));
  } else if (b.kind === 'collapsed') {   // a rock shelter: an overhang of big boulders
    B.push(HB(0, 0, 0, w, d, 4, 0x8a847a, stoneP), HB(0, 0, 4, w, 6, 18, 0x96908a, stoneP), HB(0, 0, 4, 6, d, 12, 0x8a847a, stoneP), HB(0, 0, 22, w, d * 0.6, 5, 0xa49e94, stoneP), HB(8, 8, 4, w - 14, d - 10, 1, 0x2a2224));
  } else if (b.kind === 'block') {       // the old-town ruins become a field of tall rock stacks and pillars
    const h = b.h; B.push(HB(0, 0, 0, w, d, h * 0.55, 0x9a948a, stoneP), HB(w * 0.15, d * 0.2, h * 0.55, w * 0.6, d * 0.55, h * 0.35, 0xa49e94, stoneP), HB(w * 0.3, d * 0.35, h * 0.9, w * 0.3, d * 0.3, h * 0.15, 0xb4aea2, stoneP));
    B.push(HB(w * 0.2, d + 1, 0, 8, 6, 3, 0x8a847a, stoneP), HB(w * 0.6, d + 2, 0, 6, 5, 2, 0x96908a, stoneP));
  } else return null;
  return B;
}

// ---------------------------------------------------------------- props (same kinds + footprints as Current, prehistoric art)
const torchHead = (z) => [HB(-1.1, -1.1, z, 2.2, 2.2, 1.6, 0x4a3424), HB(-0.8, -0.8, z + 1.6, 1.6, 1.6, 1.2, 0x2a1e18)];   // flames are drawn live (lit / unlit)
const potBoxes = (c, h) => [HB(-1.6, -1.6, 0, 3.2, 3.2, h || 3.4, c, (f, u, v, b) => f === 0 ? 0x3a2418 : v > (h || 3.4) - 0.8 ? mixc(c, 0x2b1a16, 0.3) : vnoise(u * 2, v) > 0.62 ? mixc(c, 0xfff0d0, 0.15) : (Math.abs(v - 1.6) < 0.3 ? mixc(c, 0x2b1a16, 0.35) : undefined))];
const boulder = (r, c) => [HB(-r, -r * 0.8, 0, r * 2, r * 1.6, r * 0.9, c || 0x96908a, stoneP), HB(-r * 0.6, -r * 0.5, r * 0.9, r * 1.2, r, r * 0.5, 0xa49e94, stoneP)];
const PPROPS = {
  lamp: () => [HB(-0.6, -0.6, 0, 1.2, 1.2, 20, LOG, logP(LOG, 3, false)), HB(-1.2, -1.2, 15, 2.4, 2.4, 0.8, ROPE), ...torchHead(20)],
  lantern: () => [HB(-0.5, -0.5, 0, 1, 1, 11, LOG, logP(LOG, 5, false)), ...torchHead(11)],
  car: (o) => o.wreck ? [...boulder(5.5, 0x8a847a), HB(3, 2, 0, 9, 4, 3, 0x96908a, stoneP)] : [HB(0, 0, 0, 19, 4, 4, LOG, logP(LOG, 4, false)), HB(0, 4.4, 0, 16, 4, 3.6, LOG_D, logP(LOG_D, 7, false))],
  truck: () => [HB(0, 0, 0, 20, 4.2, 4.2, LOG, logP(LOG, 9, false)), HB(1, 4.4, 0, 18, 4, 4, LOG_D, logP(LOG_D, 2, false)), HB(3, 2, 4, 14, 4, 3.6, LOG_L, logP(LOG_L, 6, false))],
  bus: () => { const B = [], bone = 0xe8dcc0, boneS = 0xc8b898; for (let i = 0; i < 9; i++) B.push(HB(4 + i * 4, 1, 0, 1.4, 10, 1 + Math.sin(i / 8 * Math.PI) * 9, bone, (f, u, v) => f !== 0 && v < 1 ? boneS : undefined)); B.push(HB(2, 5, 4, 38, 1.6, 1.6, bone), HB(-6, 5, 0, 8, 2, 1.6, boneS), HB(40, 4, 0, 6, 4, 4, bone, (f, u, v) => f === 2 && Math.hypot(u - 2, v - 2.4) < 0.8 ? 0x3a3028 : undefined)); return B; },   // a giant fossil skeleton half in the grass
  pole: () => { const B = [HB(-1, -1, 0, 2, 2, 34, LOG, logP(LOG, 8, false))]; for (let i = 0; i < 4; i++) B.push(HB(-1.3, -1.3, 8 + i * 6.5, 2.6, 2.6, 4, [OCHRE, PAINT_W, 0x3a8a8a, 0x8a3a24][i])); antlers(B, 0, 0, 34); return B; },
  gasstation: () => [HB(0, 0, 0, 44, 30, 6, 0x8a847a, stoneP), HB(0, 0, 6, 44, 10, 16, 0x96908a, stoneP), HB(0, 0, 6, 8, 30, 12, 0x8a847a, stoneP), HB(-2, -2, 22, 46, 18, 6, 0xa49e94, stoneP), HB(12, 12, 6, 24, 14, 1, 0x2a2224), HB(36, 18, 0, 6, 6, 4, 0x8a847c, stoneP)],
  silo: () => { const B = []; for (const [x, y, h] of [[0, 0, 26], [8, 3, 18], [3, 8, 14]]) B.push(HB(x, y, 0, 4, 3.4, h, 0x9a948a, stoneP)); return B; },
  mast: () => { const B = []; for (const [x, y] of [[0, 0], [5, 0], [0, 5], [5, 5]]) B.push(HB(x, y, 0, 1.2, 1.2, 40, LOG, logP(LOG, x + y, false))); B.push(HB(-1, -1, 40, 8, 8, 1.4, LOG_L), HB(0.5, 0.5, 41.4, 5, 5, 3, 0x8a847c, stoneP), HB(1.5, 1.5, 44.4, 3, 3, 1, 0x3a2420)); for (let z = 8; z < 38; z += 10) B.push(HB(0, 0, z, 6.2, 0.6, 0.6, ROPE), HB(0, 5, z + 5, 6.2, 0.6, 0.6, ROPE)); return B; },   // the radio hill becomes a signal-fire scaffold
  shed: () => { const B = [HB(0, 0, 0, 14, 12, 7, LOG_D, logP(LOG_D, 3))]; gableThatch(B, -1, -1, 7, 16, 14, 4, THATCH[3], 5, 1.8); return B; },
  rv: () => { const B = [], c = HIDE[2]; for (let k = 0; k < 6; k++) B.push(HB(k * 2.2, k * 0.9, 0 + k * 2.4, 28 - k * 4.4, 11 - k * 1.8, 2.4, c, hideP(mixc(c, 0x2b1a16, k * 0.04), 3), { k })); B.push(HB(13, 11, 0, 4, 0.4, 8, 0x2a1e18)); return B; },
  tent: (o) => { const c = HIDE[(o.c || 0) % HIDE.length], B = []; for (let k = 0; k < 6; k++) B.push(HB(k * 1.1, k * 1, k * 2.4, 14 - k * 2.2, 12 - k * 2, 2.4, c, hideP(c, 2), { k })); B.push(HB(6, 5, 14, 0.6, 0.6, 5, LOG_D), HB(7.4, 6, 14, 0.6, 0.6, 4.4, LOG_D), HB(5.4, 12, 0, 3, 0.4, 6, 0x2a1e18)); return B; },
  messtent: () => { const c = 0xc8a87a, B = []; for (const [x, y] of [[0, 0], [38, 0], [0, 24], [38, 24], [19, 0], [19, 24]]) B.push(HB(x, y, 0, 1.2, 1.2, 15, LOG, logP(LOG, x + y, false))); for (let k = 0; k < 4; k++) B.push(HB(-1, -1 + k * 3, 15 + k * 2, 41, 27 - k * 6, 2, c, hideP(mixc(c, 0x2b1a16, k * 0.05), 4))); return B; },
  flagpole: () => { const B = [HB(-0.9, -0.9, 0, 1.8, 1.8, 30, LOG, logP(LOG, 2, false))]; for (let i = 0; i < 5; i++) B.push(HB(-1.2, -1.2, 4 + i * 5, 2.4, 2.4, 3, [OCHRE, 0x3a8a8a, PAINT_W, 0x8a3a24, 0xe0b04a][i])); B.push(HB(0.6, -0.2, 22, 2, 0.4, 7, 0xe8dcc0), HB(0.6, -0.2, 18, 1.4, 0.4, 5, 0xd9534f)); antlers(B, 0, 0, 30); return B; },   // a feather-hung totem by the story lodge
  bikerack: () => { const B = [HB(0, 0, 0, 14, 1, 0.8, LOG_D), HB(0, 0, 6, 14, 1, 0.8, LOG_D)]; for (let k = 0; k < 6; k++) B.push(HB(1 + k * 2.3, 0.2, 0, 0.5, 0.5, 13, 0x9a7a52), HB(0.9 + k * 2.3, 0.1, 13, 0.7, 0.7, 1.6, 0x6a6a78)); return B; },     // children's practice spears
  schoolarch: () => { const W = 30; return [HB(-W / 2, 0, 0, 1.6, 1.6, 15, LOG, logP(LOG, 1, false)), HB(W / 2 - 1.6, 0, 0, 1.6, 1.6, 15, LOG, logP(LOG, 2, false)), HB(-W / 2 - 1, -0.2, 15, W + 2, 1.8, 1.8, LOG_L, logP(LOG_L, 3)), HB(-W / 2 + 3, 0.1, 9, W - 6, 0.5, 5.6, 0xd0aa74, paintedHideP(5)), ...(() => { const A = []; antlers(A, 0, 0.6, 16.8); return A; })()]; },
  crates: () => [HB(0, 0, 0, 5, 4.4, 3.6, 0xb8904a, (f, u, v) => f !== 0 && ((u * 2 | 0) + (v * 2 | 0)) % 2 ? 0x8a6a34 : undefined), HB(5.5, 0.5, 0, 4.4, 4.4, 3, HIDE[1], hideP(HIDE[1], 3)), HB(2, 0.6, 3.6, 4, 3.6, 2.4, 0xc8a050, (f, u, v) => f !== 0 && (u * 2 | 0) % 3 === 0 ? 0x8a6a34 : undefined)],
  bell: () => [HB(0, 0, 0, 1.4, 1.4, 14, LOG_D, logP(LOG_D, 3, false)), HB(3.6, 0, 0, 1.4, 1.4, 14, LOG_D, logP(LOG_D, 4, false)), HB(-0.2, -0.2, 12, 5.4, 1.8, 1.2, LOG), HB(0.6, -1.2, 2, 3.6, 3.6, 7, HIDE[2], (f, u, v) => f === 0 ? 0xe0c898 : (Math.abs(v - 6.4) < 0.4 || Math.abs(v - 0.6) < 0.4 ? 0x6a3a1e : (u * 1.4 | 0) % 2 && v > 1 && v < 6 ? mixc(HIDE[2], 0x2b1a16, 0.2) : undefined))],   // the war drum
  stall: (o) => { const c = [0xc0602e, 0x8a5a2e, 0x3a6a7a, 0x9a7a3a, 0x6a7a3a, 0x8a3a24][(o.c || 0) % 6]; return [HB(0, 0, 0, 12, 7, 1.4, 0xb8904a, (f, u, v) => f === 0 ? (((u * 1.4 | 0) + (v * 1.4 | 0)) % 2 ? 0xa8803e : 0xc8a058) : undefined), HB(0.6, 0.6, 1.4, 10.8, 5.8, 3, LOG_L, logP(LOG_L, 2, false)), HB(0, 0, 0, 0.8, 0.8, 12, LOG_D), HB(11.2, 0, 0, 0.8, 0.8, 12, LOG_D), HB(0, 6.2, 0, 0.8, 0.8, 10, LOG_D), HB(11.2, 6.2, 0, 0.8, 0.8, 10, LOG_D), HB(-1, -1, 12, 14, 9, 0.8, HIDE[2], (f, u) => f === 0 ? ((u / 2.4 | 0) % 2 ? HIDE[2] : c) : mixc(HIDE[2], HINK, 0.2))]; },
  table: () => [HB(0, 0, 3, 20, 7, 1.6, LOG_L, logP(LOG_L, 4, false)), HB(1, 1, 0, 2, 2, 3, LOG_D), HB(17, 4, 0, 2, 2, 3, LOG_D), HB(0, -3.6, 0, 20, 2.4, 2.6, LOG, logP(LOG, 6, false)), HB(0, 8.2, 0, 20, 2.4, 2.6, LOG, logP(LOG, 7, false))],
  bench: () => [HB(0, 0, 0, 10, 3, 2.8, LOG, logP(LOG, 5, false))],
  swings: () => [HB(0, 0, 0, 1.4, 1.4, 16, LOG, logP(LOG, 1, false)), HB(18, 0, 0, 1.4, 1.4, 16, LOG, logP(LOG, 2, false)), HB(-0.5, -0.2, 16, 20, 1.8, 1.8, LOG_L), HB(5.6, 0.3, 4, 0.3, 0.3, 12, ROPE), HB(8.4, 0.3, 4, 0.3, 0.3, 12, ROPE), HB(5, 0, 3.4, 4, 1, 0.8, LOG_D)],
  slide: () => { const B = []; for (let k = 0; k < 4; k++) B.push(HB(k * 3, 0, 0, 3, 4, 8 - k * 2, LOG, logP(LOG, k, false))); return B; },
  rack: () => { const B = [HB(0, 0, 0, 10, 1.4, 1, LOG_D), HB(0, 0, 7, 10, 1.4, 1, LOG_D)]; for (let k = 0; k < 4; k++) B.push(HB(1 + k * 2.4, 0.3, 0, 0.6, 0.6, 15, 0x9a7a52), HB(0.8 + k * 2.4, 0.1, 15, 1, 1, 2.2, 0x6a6a78)); return B; },
  scrap: () => [HB(0, 0, 0, 10, 8, 2, 0x6a6a78, flintP), HB(2, 2, 2, 5, 4, 1.6, 0x7a7a86, flintP), HB(7, 4, 0, 3, 3, 3, 0x5a5a66, flintP)],
  drumfire: () => { const B = []; for (let a = 0; a < 7; a++) B.push(HB(Math.cos(a / 7 * TAU) * 3.4 - 0.8, Math.sin(a / 7 * TAU) * 3.4 - 0.8, 0, 1.6, 1.6, 1.4, 0x8a847c, stoneP)); B.push(HB(-2, -0.5, 0, 4, 1, 1, LOG_D), HB(-0.5, -2, 0, 1, 4, 1, LOG)); return B; },
  firepit: () => { const B = []; for (let a = 0; a < 10; a++) B.push(HB(Math.cos(a / 10 * TAU) * 6 - 1, Math.sin(a / 10 * TAU) * 6 - 1, 0, 2.2, 2.2, 1.8, 0x8a847c, stoneP)); B.push(HB(-4, -0.7, 0, 8, 1.4, 1.4, LOG_D), HB(-0.7, -4, 0, 1.4, 8, 1.4, LOG), HB(-3, -3, 0, 6, 1.2, 1.2, LOG_D)); return B; },
  memorial: () => { const B = []; for (let i = 0; i < 5; i++) B.push(HB(i * 3.2, (i % 2) * 1.5, 0, 2.4, 1.6, 5 + (i % 3) * 2, 0x9a948a, stoneP)); B.push(HB(-1, 5, 0, 17, 4, 1, 0x7a8a4a)); return B; },
  watertower: () => { const B = []; for (const [x, y] of [[0, 0], [9, 0], [0, 9], [9, 9]]) B.push(HB(x, y, 0, 1.6, 1.6, 34, LOG, logP(LOG, x * 3 + y, false))); for (const z of [10, 22]) B.push(HB(0, 0.2, z, 10.6, 1, 1, LOG_D), HB(0.2, 0, z + 1, 1, 10.6, 1, LOG_D), HB(0, 9.4, z, 10.6, 1, 1, LOG_D), HB(9.4, 0, z + 1, 1, 10.6, 1, LOG_D)); B.push(HB(-1, -1, 34, 12.6, 12.6, 1.6, LOG_L), HB(2, 2, 35.6, 6.6, 6.6, 2.4, 0x8a847c, stoneP), HB(3, 3, 38, 4.6, 4.6, 0.8, 0x3a2420)); return B; },   // the great signal beacon
  turbine: () => { const B = [HB(-1.2, -1.2, 0, 2.4, 2.4, 42, LOG, logP(LOG, 6, false))]; for (let i = 0; i < 6; i++) B.push(HB(-1.6, -1.6, 4 + i * 6.4, 3.2, 3.2, 4.6, [OCHRE, PAINT_K, 0x3a8a8a, PAINT_W, 0x8a3a24, 0xe0b04a][i], (f, u, v) => f !== 0 && Math.abs(v - 2.6) < 0.5 && Math.abs(u - 1.6) < 1 ? PAINT_W : undefined)); B.push(HB(-6, -0.5, 34, 12, 1, 3, 0xe0b04a)); antlers(B, 0, 0, 42); return B; },   // a tall totem pole
  greenhouse: () => { const B = []; for (let x = 0; x <= 24; x += 8) for (const y of [0, 14]) B.push(HB(x, y, 0, 1, 1, 11, LOG, logP(LOG, x + y, false))); for (const z of [5, 9]) B.push(HB(0, 0, z, 25, 0.5, 0.5, LOG_D), HB(0, 14, z, 25, 0.5, 0.5, LOG_D)); for (let x = 1.5; x < 24; x += 2.4) for (const z of [8.6, 4.6]) B.push(HB(x, 0.4, z - 3.4, 1.2, 14, 3, (x * 7 | 0) % 3 ? 0xc8d0c0 : 0x6a8a3a, (f, u, v) => f === 0 ? undefined : (u * 3 | 0) % 2 ? mixc(0xc8d0c0, 0x6a7a8a, 0.3) : undefined)); return B; },   // fish / herb drying racks
  hive: () => [HB(0, 0, 0, 2, 2, 2, LOG_D), HB(-1, 0, 2, 4.4, 3, 3, LOG, logP(LOG, 4, false)), HB(-1.2, 1.2, 3.2, 0.4, 0.8, 0.8, 0x2a1e18)],
  smokehouse: () => { const B = [HB(0, 0, 0, 12, 10, 9, LOG_D, logP(LOG_D, 6))]; const top = gableThatch(B, -1, -1, 9, 14, 12, 4, THATCH[3], 7, 2); B.push(HB(5, 4, top - 1, 2, 2, 1.4, 0x3a2420)); return B; },
  fence: (o) => [HB(0, 0, 0, o.w, 0.8, 6, 0x9a7a52, (f, u, v) => { if (f === 0) return 0x8a6a44; if ((u % 3) < 0.6) return LOG_D; const r = Math.floor(v / 1.2); return ((u * 1.6 + r) | 0) % 2 ? 0x9a7a52 : 0x7a5a3a; })],   // wattle hurdles
  bed: (o) => [HB(0, 0, 0, 8, 16, 2.2, 0x8a5e3a, (f, u, v, b, wx, wy) => f !== 0 ? (vnoise(u, v) > 0.5 ? 0x8a847c : 0x9a948a) : soilBedP(CROPS[o.v % 4])(f, u, v, b, wx, wy))],
  barrel: () => potBoxes(0xb8743a, 5.6),
  laundry: (o) => { const ax = o.along !== 'y', B = ax ? [HB(0, 0, 0, 1, 1, 14, LOG_D), HB(o.w, 0, 0, 1, 1, 14, LOG_D), HB(0, 0.2, 13, o.w + 1, 0.5, 0.5, ROPE)] : [HB(0, 0, 0, 1, 1, 14, LOG_D), HB(0, o.w, 0, 1, 1, 14, LOG_D), HB(0.2, 0, 13, 0.5, o.w + 1, 0.5, ROPE)];
    for (let i = 0; i * 6 + 6 < o.w; i++) { const c = HIDE[(i + (o.x | 0)) % HIDE.length], hh = 7 - (i % 2) * 1.5; B.push(ax ? HB(2 + i * 6, 0, 13 - hh, 4.6, 0.5, hh, c, hideP(c, i)) : HB(0, 2 + i * 6, 13 - hh, 0.5, 4.6, hh, c, hideP(c, i))); } return B; },   // hides drying on a line
  woodpile: () => PROPS.woodpile(),
  bike: () => [HB(0, 0, 0, 6, 3, 2.6, 0xb8904a, (f, u, v) => f !== 0 && ((u * 2 | 0) + (v * 2 | 0)) % 2 ? 0x8a6a34 : undefined)],
  mailbox: () => [HB(-0.6, -0.6, 0, 1.2, 1.2, 9, LOG, logP(LOG, 2, false)), HB(-1, -1, 9, 2, 2, 1.6, 0xe8dcc0), HB(0.4, -0.2, 6, 0.4, 0.4, 3, 0xd9534f)],
  bins: () => [...potBoxes(0xa8683a, 4), ...potBoxes(0x8a5a2e, 3).map(b => Object.assign(b, { x: b.x + 4 }))],
  pole2: () => [],
  hedgehog: () => { const B = []; for (const [x, y, h] of [[-2, -1, 7], [0, 1, 9], [2, -0.6, 6], [-0.6, 2, 5.5], [1.2, -2, 8]]) B.push(HB(x - 0.5, y - 0.5, 0, 1, 1, h, LOG, (f, u, v, b) => v > b.h - 1.6 ? 0xd8b48a : undefined)); B.push(HB(-3, -0.4, 1.2, 6, 0.8, 0.6, ROPE)); return B; },   // a sharpened-stake trap
  rock: (o) => boulder(o.r),
  forge: () => [HB(0, 0, 0, 10, 8, 3, 0x8a847c, stoneP), HB(1.5, 1.5, 3, 7, 5, 0.6, 0x3a2a24, (f, u, v) => vnoise(u * 2, v * 2) > 0.5 ? 0xff9a3a : 0xc8501e, { em: 0xff8a30 }), HB(-1, 9.6, 0, 1.2, 1.2, 12, LOG), HB(11.4, 9.6, 0, 1.2, 1.2, 12, LOG), HB(-1, -1, 12, 13.6, 12, 1, HIDE[1], hideP(HIDE[1], 5)), HB(11, 3, 0, 4, 4, 2, 0x6a6a78, flintP)],   // the knapping hearth under a hide awning
  anvil: () => [HB(-0.8, -0.4, 0, 4.4, 2.6, 2.4, 0x96908a, stoneP), HB(0.2, 0.2, 2.4, 2, 1.4, 0.6, 0x6a6a78, flintP)],
  sawhorse: () => { const B = [HB(0, 0, 0, 1, 1, 10, LOG), HB(10, 0, 0, 1, 1, 10, LOG), HB(0, 0, 9.4, 11, 1, 1, LOG_D), HB(0, 0, 0.6, 11, 1, 1, LOG_D)]; const c = HIDE[0]; B.push(HB(1.2, 0.3, 1.6, 8.6, 0.4, 7.6, c, (f, u, v) => (u < 0.4 || u > 8.2 || v < 0.4 || v > 7.2) && (u * 2 | 0) % 2 ? ROPE : hideP(c, 4)(f, u, v, { w: 8.6, d: 0.4, h: 7.6 }))); return B; },   // a hide-stretching frame
  wagon: () => { const B = [HB(-8, 2.6, 0, 26, 1, 1, LOG_D), HB(-8, 6.6, 0, 26, 1, 1, LOG_D), HB(2, 2, 1, 14, 6, 0.8, LOG_L)]; for (let x = 3; x < 15; x += 2.6) B.push(HB(x, 2, 1.8, 2, 6, 1.2, LOG)); B.push(HB(4, 3, 3, 8, 4, 2.4, HIDE[2], hideP(HIDE[2], 2))); return B; },   // a big travois
  medtent: () => { const c = 0xd8c098, B = []; for (let k = 0; k < 6; k++) B.push(HB(k * 1.6, k * 1.4, k * 2.6, 18 - k * 3.2, 16 - k * 2.8, 2.6, c, hideP(c, 6), { k })); B.push(HB(5, 16, 2, 8, 0.4, 6, 0xc8b088, (f, u, v) => f === 1 && Math.hypot(u - 4, v - 3.2) < 1.8 ? PAINT_G : undefined)); herbs(B, 2, 16, 16.4, 9, 3); return B; },
  cot: () => [HB(0, 0, 0, 6, 3.2, 1.2, LOG_D), HB(0, 0, 1.2, 6, 3.2, 0.8, 0x8a6a4a, (f, u, v) => f === 0 ? (u < 1.6 ? 0xc8b088 : vnoise(u * 2, v * 2) > 0.5 ? 0x9a7a54 : 0x7a5a3a) : undefined)],   // a fur pallet
  medcrates: () => [HB(0, 0, 0, 4, 3.6, 3, 0xb8904a, (f, u, v) => f !== 0 && ((u * 2 | 0) + (v * 2 | 0)) % 2 ? 0x8a6a34 : undefined), HB(0.6, 0.6, 3, 2.8, 2.4, 1, PAINT_G), HB(4.4, 0.3, 0, 4, 3.6, 3, 0xb8904a, (f, u, v) => f !== 0 && ((u * 2 | 0) + (v * 2 | 0)) % 2 ? 0x8a6a34 : undefined), HB(5, 0.9, 3, 2.8, 2.4, 1, 0x8a6aa8)],
  stretcher: () => [HB(0, 0, 0.5, 10, 0.6, 0.6, LOG), HB(0, 3, 0.5, 10, 0.6, 0.6, LOG), HB(1.5, 0.3, 0.9, 7, 3, 0.2, HIDE[2])],
  seesaw: () => [HB(4.2, 0.4, 0, 1.6, 2, 2.4, LOG_D), HB(0, 0.8, 2, 10, 1.2, 1, LOG_L, logP(LOG_L, 2, false))],
  chalk: () => [HB(0.6, 0.6, 0, 0.8, 0.8, 11, LOG_D), HB(8.6, 0.6, 0, 0.8, 0.8, 11, LOG_D), HB(0, 1, 4, 10, 0.6, 7, 0xd0aa74, paintedHideP(9))],
  goal: () => [HB(0, 0, 0, 1, 1, 6.5, LOG), HB(0, 9, 0, 1, 1, 6.5, LOG), HB(0, 0, 6.5, 1, 10, 1, LOG_L)],
  pighut: () => { const B = [HB(0, 0, 0, 9, 7, 4, LOG_D, logP(LOG_D, 3, false))]; gableThatch(B, -0.8, -0.8, 4, 10.6, 8.6, 3, THATCH[3], 4, 1.4); B.push(HB(3, 6.9, 0, 3.4, 0.3, 3, 0x2a1e18)); return B; },
  flag: () => [HB(-0.6, -0.6, 0, 1.2, 1.2, 26, LOG, logP(LOG, 4, false)), HB(0.6, -0.2, 16, 1, 0.4, 9, 0xe8dcc0), HB(1.6, -0.2, 17, 1, 0.4, 8, 0xd9534f), HB(2.6, -0.2, 18, 1, 0.4, 7, 0x3a8a8a), HB(-1.5, -1.5, 0, 3, 3, 0.8, 0x8a847c, stoneP)],
  coop: () => { const B = [HB(0, 0, 0, 14, 10, 6, 0x9a7a52, (f, u, v) => f === 0 ? 0x8a6a44 : ((u * 1.6 + Math.floor(v / 1.2)) | 0) % 2 ? 0x9a7a52 : 0x7a5a3a)]; gableThatch(B, -1, -1, 6, 16, 12, 4, THATCH[1], 9, 1.6); return B; },
  target: () => [HB(0.6, 0.8, 0, 0.8, 0.8, 4, LOG_D), HB(3.6, 0.8, 0, 0.8, 0.8, 4, LOG_D), HB(0, 1.2, 3.4, 5, 0.6, 5.4, HIDE[2], (f, u, v) => { if (f !== 1) return 0xc8b89a; const r = Math.hypot(u - 2.5, v - 2.7); return r < 0.7 ? 0x8a3a24 : r < 1.5 ? HIDE[2] : r < 2.2 ? OCHRE : r < 2.5 ? 0x3a3030 : HIDE[2]; })],
  sandbags: () => [HB(0, 0, 0, 9, 3, 2.4, 0x96908a, stoneP), HB(1, 0.3, 2.4, 7, 2.6, 2, 0x8a847a, stoneP), HB(2.4, 0.5, 4.4, 4.4, 2.2, 1.6, 0xa49e94, stoneP)],
  trough: () => [HB(0, 0, 0, 9, 3, 2.6, LOG, logP(LOG, 3, false)), HB(0.6, 0.6, 2.6, 7.8, 1.8, 0.1, 0x5a96ae, (f, u) => (u * 3 | 0) % 7 === 0 ? 0x9ac8d8 : undefined)],
  handcart: (o) => cartBoxes('x', o.load || 0),
  // new prehistoric-only props (added by the past map pass)
  campfire: () => PPROPS.drumfire(),
  brazier: () => [HB(-4, -4, 0, 8, 8, 3, 0x9a948a, stoneP), HB(-3, -3, 3, 6, 6, 3, 0x8a847c, stoneP), HB(-2.4, -2.4, 6, 4.8, 4.8, 0.6, 0x3a2420)],   // the sacred fire bowl
  spit: () => [HB(0, 0, 0, 1, 1, 7, LOG_D), HB(9, 0, 0, 1, 1, 7, LOG_D), HB(-0.5, 0.2, 6.2, 11, 0.6, 0.6, LOG_L), HB(3, -0.6, 4.2, 4, 2.2, 2, 0x9a4a2a, (f, u, v) => vnoise(u * 2, v) > 0.5 ? 0xb8642e : undefined), ...PPROPS.drumfire().map(b => Object.assign(b, { x: b.x + 5, y: b.y + 0.5 }))],
  stones: () => { const B = []; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; B.push(HB(Math.cos(a) * 9 - 1.2, Math.sin(a) * 6 - 0.8, 0, 2.4, 1.6, 6 + (i % 3) * 2.4, 0x9a948a, stoneP)); } return B; },
  fern: (o) => { const B = [], c = [0x4a7a3a, 0x5a8a42, 0x6a9a4a][(o.v || 0) % 3]; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.push(HB(Math.cos(a) * 2.6 - 1, Math.sin(a) * 2 - 0.6, 0.6 + (i % 2) * 0.6, 2.6, 1.4, 1.4, c)); } B.push(HB(-1, -1, 0, 2, 2, 2.4, mixc(c, 0xfff0d0, 0.15))); return B; },
  torchpost: () => PPROPS.lamp()
};

// ---------------------------------------------------------------- palisade, watch platforms with fire beacons, the log gate
function pastWallBoxes(s, shape, dmg) {
  const B = [], h = s.kind === 'culvert' ? 12 : Math.max(16, s.h), seed = s.seed || 0;
  if (dmg === 2) { B.push(HB(-3.5, -1.5, 0, 7, 1.6, 1.6, LOG, logP(LOG, seed, false)), HB(-2, 0.4, 0, 1.6, 5, 1.6, LOG_D, logP(LOG_D, seed + 1, false)), HB(-3, -2.6, 0, 1.4, 1.4, 5, LOG, (f, u, v, b) => v > b.h - 1.4 ? 0xd8b48a : undefined), HB(1.2, -2, 0, 3, 3, 1.4, 0x8a847c, stoneP)); return B; }
  for (const dd of shape) {
    const ax = dd === 'E' || dd === 'W', sgn = dd === 'E' || dd === 'S' ? 1 : -1;
    for (let i = 0; i < 3; i++) {
      const t = sgn > 0 ? i * 1.45 : -1.45 * (i + 1), miss = dmg === 1 && hs(seed * 3 + i, dd.charCodeAt(0)) < 0.4, hh = h - (hs(seed + i, 7) * 2.4) - (miss ? h * 0.45 : 0);
      const c = [LOG, mixc(LOG, LOG_D, 0.3), mixc(LOG, LOG_L, 0.25)][(seed + i) % 3];
      B.push(ax ? HB(t, -0.7, 0, 1.45, 1.4, hh, c, logP(c, seed + i, false)) : HB(-0.7, t, 0, 1.4, 1.45, hh, c, logP(c, seed + i, false)));
      if (!miss) B.push(ax ? HB(t + 0.25, -0.45, hh, 0.95, 0.9, 1.6, 0xd8b48a) : HB(-0.45, t + 0.25, hh, 0.9, 0.95, 1.6, 0xd8b48a));   // sharpened tips
    }
    B.push(ax ? HB(sgn > 0 ? 0 : -4.4, -0.85, h * 0.68, 4.4, 0.3, 0.6, ROPE) : HB(-0.85, sgn > 0 ? 0 : -4.4, h * 0.68, 0.3, 4.4, 0.6, ROPE));
    B.push(ax ? HB(sgn > 0 ? 0 : -4.4, -1.4, 0, 4.4, 2.8, 1.4, 0x8a847c, stoneP) : HB(-1.4, sgn > 0 ? 0 : -4.4, 0, 2.8, 4.4, 1.4, 0x8a847c, stoneP));   // stone footing
  }
  B.push(HB(-1, -1, 0, 2, 2, h + 2, LOG_D, logP(LOG_D, seed, false)), HB(-0.6, -0.6, h + 2, 1.2, 1.2, 1.6, 0xd8b48a));
  if (s.weak && dmg === 0 && s.kind !== 'culvert') B.push(HB(-3, 1.2, 0, 6, 2.2, 2, 0x96908a, stoneP), HB(-2, 1.4, 2, 4, 1.8, 1.4, 0x8a847a, stoneP));
  return B;
}
function pastTowerBoxes() {
  const h = 46, s = 18, back = [], front = [];
  for (const [a, b] of [[0, 0], [s - 2, 0], [0, s - 2], [s - 2, s - 2]]) back.push(HB(a, b, 0, 2, 2, h + 14, LOG, logP(LOG, a + b, false)));
  for (const z of [12, 28]) back.push(HB(0, 0.4, z, s, 1.2, 1.4, LOG_D), HB(0.4, 0, z + 1.4, 1.2, s, 1.4, LOG_D), HB(0, s - 1.6, z, s, 1.2, 1.4, LOG_D), HB(s - 1.6, 0, z + 1.4, 1.2, s, 1.4, LOG_D));
  back.push(HB(s * 0.5 - 2.6, s, 0, 0.8, 0.8, h + 2, LOG_L), HB(s * 0.5 + 1.8, s, 0, 0.8, 0.8, h + 2, LOG_L), HB(s * 0.5 - 1.8, s + 0.1, 0, 3.6, 0.4, h, LOG_L, (f, u, v) => f === 1 && (v % 3) > 0.7 ? -1 : undefined));
  back.push(HB(-1, -1, h, s + 2, s + 2, 1.8, LOG_L, logP(LOG_L, 4, false)));
  back.push(HB(-1, -1, h + 1.8, s + 2, 1.2, 6, LOG, logP(LOG, 6)), HB(-1, -1, h + 1.8, 1.2, s + 2, 6, LOG, logP(LOG, 7)));
  hipThatch(back, -3, -3, h + 14, s + 6, s + 6, 6, THATCH[1], 9, { hh: 2.4, top: 2 });
  back.push(HB(s - 5, 1, h + 1.8, 4, 4, 3, 0x8a847c, stoneP), HB(s - 4.4, 1.6, h + 4.8, 2.8, 2.8, 0.6, 0x3a2420));   // the beacon bowl (its fire is drawn live)
  for (let i = 0; i < 5; i++) front.push(HB(i * 3.8, s - 1.2, h + 1.8, 3.6, 1.2, 6, LOG, logP(LOG, 10 + i)), HB(s - 1.2, i * 3.8 + 0.2, h + 1.8, 1.2, 3.6, 6, LOG, logP(LOG, 20 + i)));
  return { back, front };
}
function pastGateFrameBoxes() {
  const B = [HB(-1.6, -1.6, 0, 3.2, 3.2, 28, LOG, logP(LOG, 1)), HB(22.4, -1.6, 0, 3.2, 3.2, 28, LOG, logP(LOG, 2)), HB(-4, -1, 24, 32, 2, 2.6, LOG_L, logP(LOG_L, 3, false))];
  for (let i = 0; i < 7; i++) B.push(HB(-2 + i * 4.4, -0.2, 21.4, 2.6, 0.6, 2.6, [OCHRE, PAINT_W, 0x3a8a8a][i % 3], (f, u, v) => f === 1 && Math.hypot(u - 1.3, v - 1.3) < 0.6 ? PAINT_K : undefined));
  antlers(B, 0, 0, 28); antlers(B, 24, 0, 28); antlers(B, 12, 0, 26.6, 0xf0e6cc);
  return B;
}
function pastGateLeafBoxes() { const B = []; for (let i = 0; i < 8; i++) B.push(HB(i * 1.5, -0.7, 0.4, 1.5, 1.4, 17 - (i % 2), LOG, logP(mixc(LOG, LOG_D, (i % 3) * 0.2), i, false))); B.push(HB(0, -1.1, 4, 12, 0.5, 1.2, LOG_D), HB(0, -1.1, 12, 12, 0.5, 1.2, LOG_D), HB(0, -1.1, 4.6, 12, 0.5, 0.6, ROPE)); return B; }
// burial ground markers: 0 a small cairn, 1 a standing stone, 2 a carved post, 3 a ring of pebbles with a capstone; fresh: a mound with flowers
function pastGraveBoxes(v, fresh) {
  const B = [];
  if (fresh) B.push(HB(-1.8, 0.4, 0, 3.6, 5.2, 1, 0x6a4e34, (f, u, v2) => hs(u * 3, v2 * 3) > 0.85 ? 0xd9685c : hs(u * 3 + 1, v2 * 3) > 0.9 ? 0xf2e6a0 : undefined));
  if (v === 0 || fresh) B.push(HB(-1.6, -0.8, 0, 3.2, 2.4, 1.6, 0x96908a, stoneP), HB(-1.1, -0.5, 1.6, 2.2, 1.8, 1.3, 0xa49e94, stoneP), HB(-0.6, -0.2, 2.9, 1.2, 1.2, 1, 0xb4aea2, stoneP));
  else if (v === 1) B.push(HB(-1, -0.5, 0, 2, 1.2, 6.4, 0x9a948a, stoneP), HB(-0.7, -0.4, 6.4, 1.4, 1, 0.8, 0xa49e94));
  else if (v === 2) B.push(HB(-0.5, -0.5, 0, 1, 1, 6.6, LOG, logP(LOG, 3, false)), HB(-0.8, -0.8, 5, 1.6, 1.6, 1.4, OCHRE), HB(-0.7, -0.2, 3.4, 0.4, 0.4, 2.6, 0xe8dcc0));
  else { for (let a = 0; a < 6; a++) B.push(HB(Math.cos(a / 6 * TAU) * 1.8 - 0.4, Math.sin(a / 6 * TAU) * 1.4 - 0.4, 0, 0.8, 0.8, 0.8, 0xa49e94, stoneP)); B.push(HB(-1, -0.7, 0, 2, 1.4, 2.4, 0x96908a, stoneP)); }
  return B;
}
// the travois: two poles dragging behind, a hide platform with the load (replaces the handcart)
function pastCartBoxes(along, load) {
  const ax = along !== 'y', L = (x, y, z, w, d, h, c, p, e) => ax ? HB(x, y, z, w, d, h, c, p, e) : HB(y, x, z, d, w, h, c, p, e);
  const B = [L(-6, 0.4, 3.8, 16, 0.7, 0.7, LOG), L(-6, 4, 3.8, 16, 0.7, 0.7, LOG), L(9.4, 0.4, 0, 0.7, 0.7, 1.4, LOG_D), L(9.4, 4, 0, 0.7, 0.7, 1.4, LOG_D), L(1, 0.6, 2.2, 8, 4, 0.6, HIDE[2], hideP(HIDE[2], 3))];
  const c = CART_LOAD[load]; if (c) B.push(L(2, 1, 2.8, 6, 3, 2.2, c[0], (f, u, v) => (hs(Math.floor(u * 1.5), Math.floor(v * 1.5) + f) > 0.6 ? c[1] : undefined)), L(3, 1.4, 5, 4, 2.2, 1, c[0], (f, u, v) => (hs(Math.floor(u * 2) + 5, Math.floor(v * 2)) > 0.55 ? c[1] : undefined)));
  return B;
}
// river craft: dugout canoes (fishing), trade rafts (cargo) and the healer's canoe (herb baskets, a green pennant)
function pastBoatBoxes(kind, axis) {
  const B = [], raft = kind === 'cargo', L = raft ? 26 : kind === 'fish' ? 24 : 30, hw = raft ? 5.2 : 3.2;
  if (raft) { for (let i = 0; i < 5; i++) B.push(HB(-L / 2, -hw + i * 2.1, 0.6, L, 2, 1.8, i % 2 ? LOG : mixc(LOG, LOG_D, 0.3), logP(LOG, i, false))); B.push(HB(-L / 2 + 2, -hw, 2.4, 0.8, hw * 2, 0.6, ROPE), HB(L / 2 - 3, -hw, 2.4, 0.8, hw * 2, 0.6, ROPE));
    B.push(HB(-6, -3.6, 2.4, 5, 4.4, 3, 0xb8904a, (f, u, v) => f !== 0 && ((u * 2 | 0) + (v * 2 | 0)) % 2 ? 0x8a6a34 : undefined), HB(0, -3, 2.4, 4.6, 4.4, 2.6, HIDE[1], hideP(HIDE[1], 2)), HB(5, -2.4, 2.4, 4, 4, 2.2, HIDE[4], hideP(HIDE[4], 5)), HB(-10, -1, 2.4, 3, 3, 4.4, 0xb8743a)); }
  else {
    const hull = (f, u, v, b) => { if (f === 0) return (Math.hypot(u - b.w / 2, (v - b.d / 2) * 3) < b.w * 0.42) ? 0x4a3020 : LOG_L; if (v > b.h - 0.6) return LOG_L; return vnoise(u / 3, v) > 0.6 ? mixc(LOG, LOG_D, 0.4) : LOG; };
    B.push(HB(-L / 2 + 3, -hw + 0.8, 0, L - 6, hw * 2 - 1.6, 1.4, LOG_D), HB(-L / 2 + 1, -hw, 1, L - 2, hw * 2, 2.4, LOG, hull), HB(-L / 2 - 0.6, -hw + 1, 1.6, 2, hw * 2 - 2, 2.2, LOG), HB(L / 2 - 1.4, -hw + 1, 1.6, 2, hw * 2 - 2, 2.6, LOG));
    if (kind === 'med') { for (let i = 0; i < 3; i++) B.push(HB(-7 + i * 5, -2.2, 2.4, 4, 4, 3, 0xb8904a, (f, u, v) => f === 0 ? [0x5a8a3a, 0x8a6aa8, 0xc8a040][i] : ((u * 2 | 0) + (v * 2 | 0)) % 2 ? 0x8a6a34 : undefined)); B.push(HB(-L / 2 + 2.6, -0.3, 2.4, 0.6, 0.6, 13, LOG_D), HB(-L / 2 + 3.2, -0.2, 11, 6, 0.4, 3.4, PAINT_G, (f, u, v) => f !== 0 && Math.hypot(u - 2, v - 1.7) < 1 ? PAINT_W : undefined)); }
    else B.push(HB(-3, -2, 2.4, 5, 4, 2, 0xb8904a, (f, u, v) => f !== 0 && ((u * 2 | 0) + (v * 2 | 0)) % 2 ? 0x8a6a34 : undefined), HB(4, -1.6, 2.4, 3.6, 3.2, 1.2, 0x6a7a5a, (f, u, v) => f === 0 && (u + v) % 1.2 < 0.4 ? 0x3a4a3a : undefined), HB(L / 2 - 4, -0.3, 2.4, 0.6, 0.6, 7, LOG_D), HB(L / 2 - 4.8, -0.9, 9.4, 1.8, 1.8, 1.6, 0x4a3424));
  }
  return axis === 'x' ? B : mirrorBoxes(B);
}
// wattle fence (graveyard picket) / log rails (paddock)
function pastRailBoxes(len, along, picket) {
  const B = [], ax = along !== 'y';
  for (let t = 0; t <= len + 0.01; t += 6) B.push(ax ? HB(Math.min(t, len - 1), 0, 0, 1, 1, picket ? 5.6 : 7.5, LOG_D, logP(LOG_D, t | 0, false)) : HB(0, Math.min(t, len - 1), 0, 1, 1, picket ? 5.6 : 7.5, LOG_D, logP(LOG_D, t | 0, false)));
  if (picket) { const wp = (f, u, v) => { if (f === 0) return 0x8a6a44; const r = Math.floor(v / 1.1); return ((u * 1.6 + r) | 0) % 2 ? 0x9a7a52 : 0x7a5a3a; }; B.push(ax ? HB(0, 0.2, 0.4, len, 0.6, 4.4, 0x9a7a52, wp) : HB(0.2, 0, 0.4, 0.6, len, 4.4, 0x9a7a52, wp)); }
  else for (const z of [2.6, 5.4]) B.push(ax ? HB(0, 0.1, z, len, 0.8, 0.9, LOG, logP(LOG, z | 0, false)) : HB(0.1, 0, z, 0.8, len, 0.9, LOG, logP(LOG, z | 0, false)));
  return B;
}

// ---------------------------------------------------------------- vegetation of the age: tree ferns and cycads among the conifers
const _fern = {};
function fernTreeSprite(v, season, cycad) {
  const key = (cycad ? 'c' : 'f') + v + season; if (_fern[key]) return _fern[key];
  const Rr = mulberry32(v * 733 + (cycad ? 9 : 3)), LW = 44, LH = cycad ? 46 : 70, bx = 22, by = LH - 4, W = LW * K, H = LH * K, gg = new Int32Array(W * H).fill(-1);
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) gg[y * W + x] = c; };
  const win = season === 'winter', fall = season === 'fall', P = win ? [0x2e4a3a, 0x3e5e48, 0x5e7e66, 0xdce6ec] : fall ? [0x3e5a2a, 0x5a7232, 0x8a8a3e, 0xb8a050] : [0x2a5230, 0x3a6e3a, 0x5a8e44, 0x86b05a];
  const th = cycad ? 12 + Rr() * 6 : 40 + Rr() * 14;
  for (let y = 0; y < th * K; y++) { const wv = cycad ? 4 : 2.6; for (let x = -wv; x < wv; x++) { const c = x > wv - 2 ? 0x3a2a1e : x < -wv + 1.5 ? 0x8a6a4a : ((y >> 1) % 3 === 0 ? 0x5a4030 : 0x6e4c3c); set(bx * K + x + Math.sin(y / 40) * 2, by * K - y, c); } }
  const tx = bx * K + Math.sin(th * K / 40) * 2, ty = by * K - th * K, n = cycad ? 9 : 11;
  for (let i = 0; i < n; i++) {   // fronds: arcs from the crown, leaflets along them
    const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * (cycad ? 2.8 : 3.4) + (Rr() - 0.5) * 0.2, len = (cycad ? 14 : 20) * K * (0.75 + Rr() * 0.35);
    for (let s = 0; s < 1; s += 0.02) { const droop = s * s * (cycad ? 0.6 : 1.1), x = tx + Math.cos(a) * len * s, y = ty + Math.sin(a) * len * s + droop * len * 0.55, lw = (1 - s) * (cycad ? 4 : 5) * K * 0.5 + 1;
      for (let k = -lw; k <= lw; k++) { const lx = x - Math.sin(a) * k * 0.9, ly = y + Math.cos(a) * k * 0.4 + Math.abs(k) * 0.35, l = -k / lw * 0.5 - s * 0.4 + (hash2(lx >> 1, ly >> 1) - 0.5) * 0.4; set(lx, ly, l > 0.3 ? P[3] : l > -0.05 ? P[2] : l > -0.45 ? P[1] : P[0]); } }
  }
  if (cycad && !win) for (let i = 0; i < 5; i++) set(tx + (i - 2) * 2, ty + 3, 0xd8a83a);
  const out = inkGrid(gg, W, H, 0.8), s = gridCanvas(out, W, H, null, K); s.ax = bx; s.ay = by; s.rad = cycad ? 8 : 10;
  return (_fern[key] = s);
}

// ---------------------------------------------------------------- the tribe: hides, furs, woven fibre; spears, bows, torches (drawn through Saigon's drawPerson + Holdfast's ev hooks)
const PHAIR = [0x1d1a24, 0x2b2028, 0x3b2a24, 0x5a3a24, 0x6a4a2e, 0x8a5a3a], PFUR = [0xe8dcc0, 0xc8b498, 0x9a8a72, 0x6a5a4a, 0xd8c8a8];
function pastLook(role, R) {
  const kid = role === 'kid', type = kid ? 'kid' : role === 'elder' ? (R() < 0.5 ? 'oldman' : 'oldlady') : R() < 0.5 ? 'worker' : 'youth';
  const L = randLook(type);
  Object.assign(L, { past: 1, ev: 'tribe', role, carry: null, tie: 0, mask: 0, kq: false, pattern: 0, pack: 0, glasses: false, apron: 0, blush: R() < 0.4 });
  L.top = sp(R, HIDE); L.bot = sp(R, [0x6a4a30, 0x5a3e28, 0x7a5434, 0x8a6240, 0x4a3a2a]); L.shoe = sp(R, [0x6a4a30, 0x5a3e28, 0x7a5a3a]);
  L.hair = sp(R, PHAIR); L.fur = sp(R, PFUR); L.scarfC = L.fur; L.legs = 'short'; L.sleeve = R() < 0.55 ? 'none' : 'short'; L.oneSh = !kid && R() < 0.45; L.dress = 0; L.hat = 0; L.hatC = sp(R, [OCHRE, 0x3a5a7a, 0x8a3a24, 0xe0b04a, 0x5a7a3a]);
  if (L.fem && !kid) { L.dress = R() < 0.6 ? 1 : 0; L.hs = sp(R, [1, 2, 5, 1]); }
  if (kid) { L.top = sp(R, [0xc09060, 0xb48a5a, 0xd0a070]); L.legs = 'short'; L.dress = L.fem ? 1 : 0; L.sleeve = 'none'; }
  if (type === 'oldman' || type === 'oldlady') { L.hair = sp(R, [0xc8c0b8, 0xe0dcd4, 0x8a8480]); L.sleeve = 'long'; L.cloak = 1; }
  L.neck = R() < 0.45 ? sp(R, [0xf0e6cc, 0xd84a2a, 0x3a8a8a, 0xe0b04a]) : 0;
  if (R() < 0.28) { L.hat = 'band'; L.feather = R() < 0.6 ? sp(R, [0xd9534f, 0xf0e6cc, 0x3a5a7a, 0x2a2420]) : 0; }
  if (role === 'guard' || role === 'scav') { L.ev = 'hunter'; L.paint = sp(R, [0xd84a2a, 0xf0e6cc, 0x2a2420]); L.mantle = 1; L.top = sp(R, [0x8a6240, 0x7a5434, 0x9a7048]); L.sleeve = 'none'; if (R() < 0.6) { L.hat = 'band'; L.feather = sp(R, [0xd9534f, 0xf0e6cc, 0x2a2420]); } if (role === 'scav') L.ev = 'scav'; }
  if (role === 'medic') { L.ev = 'healer'; L.top = sp(R, [0xd8c098, 0xc8b088]); L.sleeve = 'long'; L.hat = R() < 0.5 ? 'band' : 0; L.feather = 0x5a8a3a; }
  if (role === 'cook') L.apron = 1;
  if (role === 'smith' || role === 'tech') { L.apron = 1; L.sleeve = 'none'; }
  if (role === 'teacher' || (role === 'elder' && R() < 0.35)) { L.hat = 'crown'; L.cloak = 1; }
  if (role === 'farmer' && R() < 0.5) { L.hat = 'band'; L.feather = 0; }
  L.b = { top: L.top, sleeve: L.sleeve, hat: L.hat, legs: L.legs }; L.seed = Math.floor(R() * 999);
  return L;
}
function pastTorso(X) {
  const L = X.L, { rect, put, cx, torsoTop: tt, legTop: lt, back, skin, sS, top } = X, fur = grade(L.fur || 0xe8dcc0), furS = mixc(fur, 0x2b1a16, 0.3), dk = mixc(top, 0x2b1a16, 0.3);
  if (L.oneSh && !back) for (let y = tt; y < tt + 4; y++) for (let x = cx + 1 + (y - tt); x <= cx + 6; x++) put(x, y, x >= cx + 3 ? sS : skin, 5);      // one bare shoulder
  for (let x = cx - 6; x <= cx + 6; x++) { if (hash2(x + L.seed, 5) < 0.6) put(x, lt, (x + L.seed) % 2 ? top : dk, 5); }                                 // a ragged hide hem
  if (L.mantle) { rect(cx - 6, tt - 1, cx + 6, tt + 2, fur, 7, cx + 3, furS); for (let x = cx - 6; x <= cx + 6; x += 2) put(x, tt + 3, furS, 7); }       // hunter's fur mantle
  else rect(cx - 5, tt, cx + 5, tt, fur, 6, cx + 3, furS);                                                                                                   // fur trim at the neckline
  if (L.cloak && back) { rect(cx - 6, tt, cx + 6, lt + 2, fur, 7, cx + 3, furS); for (let x = cx - 6; x <= cx + 6; x += 2) put(x, lt + 3, furS, 7); }
  rect(cx - 6, lt - 2, cx + 6, lt - 2, grade(0x5a3a24), 6); if (!back) rect(cx + 2, lt - 1, cx + 4, lt + 1, grade(0x7a5434), 6, cx + 4, grade(0x5a3a24));   // belt + pouch
  if (L.ev === 'healer' && !back) for (let j = 0; j < 9; j++) put(cx - 4 + j, tt + 1 + j, grade(PAINT_G), 7);
  if (L.apron) rect(cx - 4, tt + 4, cx + 4, lt + 3, grade(0x5a3e28), 6, cx + 2, grade(0x4a3220));
  if (L.neck && !back) for (let i = 0; i < 5; i++) put(cx - 3 + i * 2, tt + 2 + (i === 2 ? 1 : 0), grade(L.neck), 8);
  if (L.pack2 && back) { const c = grade(HIDE[3]); rect(cx - 5, tt + 1, cx + 5, lt - 1, c, 7, cx + 3, clothSh(c)); rect(cx - 4, tt + 3, cx + 4, tt + 4, grade(ROPE), 7); }
}
function pastFace(X, ex1, ex2, ey, eh) { const L = X.L; if (!L.paint) return; const c = grade(L.paint); for (const ex of [ex1, ex2]) { X.put(ex - 1, ey + eh + 1, c, 11); X.put(ex, ey + eh + 1, c, 11); X.put(ex + 1, ey + eh + 1, c, 11); } X.put(X.cx + 1, X.headCY - 4, c, 11); }
function pastHat(hat, X) {
  const L = X.L, { rect, put, ell, cx, headCY: hy, hr, back } = X, hc = grade(L.hatC || OCHRE);
  if (hat === 'band' || hat === 'crown') { rect(cx - 7, hy - 3, cx + 9, hy - 2, hc, 12, cx + 6, clothSh(hc)); if (!back) put(cx + 2, hy - 3, grade(0xf0e6cc), 12); }
  if (hat === 'band' && L.feather) for (let j = 0; j < 7; j++) { put(cx - 6 - Math.round(j * 0.35), hy - 4 - j, grade(L.feather), 12); if (j > 1 && j < 6) put(cx - 5 - Math.round(j * 0.35), hy - 4 - j, mixc(grade(L.feather), 0x2b1a16, 0.25), 12); }
  if (hat === 'crown') for (let i = 0; i < 5; i++) { const fc = grade([0xd9534f, 0xf0e6cc, 0xe0b04a, 0x3a8a8a, 0xf0e6cc][i]), x0 = cx - 5 + i * 3; for (let j = 0; j < 6 - Math.abs(i - 2); j++) put(x0 + (i - 2) * Math.round(j * 0.2), hy - 4 - j, j === 0 ? clothSh(fc) : fc, 12); }
  if (hat === 'hood') { const f = grade(L.fur || 0xc8b498); ell(cx + 1, hy - 1, hr + 1.6, hr + 1, f, 12, mixc(f, 0x2b1a16, 0.3), hiOf(f), (x, y) => back || !(x > cx - 4 && y > hy - 3)); }
}
// weapons + prehistoric tools; returns true when it drew the thing in the hand (Current's evOver then stays silent)
function pastOver(X, hx, hy, raise) {
  const L = X.L, { rect, put, cx, torsoTop: tt, legTop: lt, back } = X, Wd = grade(0x8a6a44), Wd2 = grade(0x6a4a2e), St = grade(0x6a6a78), StL = grade(0x9a9aa8);
  const spear = (x0, y0, x1, y1, z) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const q = i / n, x = x0 + (x1 - x0) * q, y = y0 + (y1 - y0) * q; put(x, y, i > n - 3 ? (i > n - 1 ? StL : St) : i % 5 === 3 ? Wd2 : Wd, z); } };
  if (L.gun === 'aim') {                                 // a drawn bow with an arrow nocked
    const bx = cx + 9; for (let j = -9; j <= 9; j++) { const x = bx + Math.round((1 - (j / 9) ** 2) * 2.6); put(x, tt + 3 + j, Wd, 15); if (Math.abs(j) < 8) put(x + 1, tt + 3 + j, Wd2, 15); }
    for (let j = -8; j <= 8; j++) put(bx - 1, tt + 3 + j, grade(0xe8dcc0), 14);
    for (let i = 0; i < 11; i++) put(cx + 2 + i, tt + 3, i > 8 ? StL : Wd, 16); put(cx + 2, tt + 2, grade(0xd9534f), 16); put(cx + 2, tt + 4, grade(0xd9534f), 16);
    return true;
  }
  if (L.gun === 'sling') { spear(hx + 1, hy + 4, hx + 4, tt - 15, back ? 0 : 15); return true; }        // spear held upright
  if (L.gun === 'carry') { spear(cx - 6, lt + 1, cx + 12, tt - 8, 15); return true; }                     // spear across, ready
  if (L.gun === 'pistol') { spear(cx - 7, tt + 1, cx + 13, tt - 4, 15); return true; }                    // a throwing spear held high
  if (L.gun === 'spear') { spear(hx, hy + 2, hx + 16, hy - 10, 15); return true; }
  if (L.tool === 'torch') {                                                                                // flames are drawn live by the renderer
    for (let j = 0; j < 12; j++) put(hx + 2 + Math.round(j * 0.15), hy + 1 - j, j < 9 ? Wd : grade(0x3a2418), 15);
    rect(hx + 2, hy - 13, hx + 4, hy - 11, grade(0x4a3424), 15); return true;
  }
  if (L.tool === 'hammer' && raise) { const x0 = cx + 6, y0 = tt - 12; rect(x0, y0 - 6, x0 + 1, y0, Wd, 15); rect(x0 - 2, y0 - 9, x0 + 3, y0 - 6, St, 15, x0 + 2, grade(0x4a4a56)); return true; }
  if (L.tool === 'saw') { rect(hx, hy, hx + 4, hy + 2, St, 15, hx + 3, grade(0x4a4a56)); return true; }  // a hide scraper
  if (L.tool === 'bucket' || L.tool === 'pot') { const c = grade(0xb8743a); rect(hx - 1, hy, hx + 3, hy + 5, c, 15, hx + 2, mixc(c, 0x2b1a16, 0.3)); rect(hx - 1, hy, hx + 3, hy, grade(0x6a3a1e), 15); return true; }
  if (L.tool === 'crate') { const c = grade(HIDE[1]); rect(hx - 3, hy - 3, hx + 4, hy + 3, c, 15, hx + 2, clothSh(c)); rect(hx - 3, hy, hx + 4, hy, grade(ROPE), 15); return true; }
  if (L.tool === 'plank') { rect(0, tt - 4, X.W - 1, tt - 2, grade(LOG), 15, X.W - 6, grade(LOG_D)); for (let x = 2; x < X.W; x += 6) put(x, tt - 3, grade(LOG_L), 15); return true; }   // a log on the shoulder
  if (L.tool === 'cloth' && raise) { const c = grade(L.cloth || HIDE[2]); rect(cx + 2, tt - 14, cx + 9, tt - 6, c, 15, cx + 7, clothSh(c)); return true; }
  return false;
}

// ---------------------------------------------------------------- dinosaurs: 15 species drawn by code, side view, 9 poses (stand, walk x4, sniff, attack, roar, down)
// cat: small | pack | stalker | charger | breaker | heavy | apex | flyer | herb. W x H in art px (K = 2 per world unit).
const DSPEC = {
  compy:   { W: 30, H: 21, cat: 'small', kind: 'thero', col: [[0x7a9a4a, 0xc8c890, 0x4a6a2a, 0xd8a040], [0x9a7a4a, 0xd8c8a0, 0x6a4a2a, 0x6a9a3a]], feat: { stripes: 1 } },
  raptor:  { W: 60, H: 42, cat: 'pack', kind: 'thero', col: [[0xb08a5a, 0xe0d0b0, 0x6a4a2a, 0x3a5a7a], [0x7a8a9a, 0xd0d4c8, 0x3a4a5a, 0xc8503a], [0xa8643a, 0xe8c8a0, 0x5a3020, 0x2a4a3a]], feat: { feathers: 1, sickle: 1, stripes: 1 }, body: [48, 34, 14, 8.5], head: [72, 17, 6, 4.6], snout: [87, 20, 2] },
  utah:    { W: 74, H: 52, cat: 'pack', kind: 'thero', col: [[0x8a7a6a, 0xe8e0d0, 0x4a3a2a, 0xc8443a], [0x6a7a5a, 0xd8d8b8, 0x3a4a2a, 0xe0b04a]], feat: { feathers: 1, sickle: 1, mask: 1 }, body: [47, 34, 15, 10] },
  dilo:    { W: 66, H: 46, cat: 'stalker', kind: 'thero', col: [[0x8aa050, 0xe0e0a8, 0x4a6a2a, 0xd84a2a], [0x6a8a8a, 0xd8e0d0, 0x3a5a5a, 0xe8b03a]], feat: { crests: 1, frill: 1, spots: 1 }, neck: [58, 30, 4, 67, 18, 3.2] },
  pachy:   { W: 54, H: 38, cat: 'charger', kind: 'thero', col: [[0x8a6a4a, 0xd8c8a8, 0x5a4030, 0xe8dcc0], [0x6a7a4a, 0xd0d0a8, 0x3a4a2a, 0xf0e6cc]], feat: { dome: 1 }, body: [47, 34, 16, 11], head: [72, 19, 6.5, 5.5], snout: [80, 23, 2.6], tail: [34, 32, 6, 4, 30, 1] },
  carno:   { W: 84, H: 58, cat: 'charger', kind: 'thero', col: [[0xa04a32, 0xe0b8a0, 0x5a2418, 0x2a2420], [0x7a5a3a, 0xd8c0a0, 0x3a2a1e, 0xc8443a]], feat: { horns: 1, bumps: 1, tinyArms: 1 }, head: [73, 17, 7, 6.5], snout: [86, 21, 3] },
  trike:   { W: 92, H: 60, cat: 'charger', kind: 'trike', col: [[0x7a8a6a, 0xc8c8a8, 0x4a5a3a, 0xc8643a], [0xa8946a, 0xe0d4b0, 0x6a5a3a, 0x8a3a5a]] },
  ankylo:  { W: 88, H: 50, cat: 'breaker', kind: 'ankylo', col: [[0x8a7a5a, 0xc8b898, 0x5a4a34, 0xd8c8a0], [0x6a6a5a, 0xb8b8a0, 0x3a3a30, 0xc8a060]] },
  allo:    { W: 104, H: 72, cat: 'heavy', kind: 'thero', col: [[0x9a7a5a, 0xe0c8a8, 0x5a3a24, 0xc8443a], [0x7a8a6a, 0xd8d8b8, 0x3a4a2a, 0xd8a040]], feat: { stripes: 1, ridge: 1 }, head: [72, 16, 8, 6], snout: [90, 20, 3.4], body: [47, 33, 16, 10] },
  spino:   { W: 112, H: 80, cat: 'heavy', kind: 'thero', col: [[0x6a7a8a, 0xd0d8d8, 0x3a4a5a, 0xd8503a], [0x7a8a6a, 0xd8d8b8, 0x4a5a3a, 0xe8a040]], feat: { sail: 1 }, head: [74, 20, 6, 4], snout: [94, 25, 2], body: [46, 37, 16, 9], neck: [58, 33, 4.4, 68, 23, 3.6] },
  trex:    { W: 140, H: 98, cat: 'apex', kind: 'thero', col: [[0x6a6a4a, 0xc8c0a0, 0x3a3a24, 0xb8643a], [0x7a5a42, 0xd0b898, 0x3e2a1e, 0x8a4a2a]], feat: { ridge: 1, tinyArms: 1, stripes: 1 }, head: [74, 17, 11, 8.5], snout: [94, 21, 6], body: [46, 33, 18, 12], neck: [58, 30, 7, 66, 22, 6.4], tail: [32, 32, 9, 2, 28, 1.4], thigh: 10 },
  ptero:   { W: 76, H: 40, cat: 'flyer', kind: 'ptero', col: [[0xb8a888, 0xe8e0d0, 0x6a5a4a, 0xd84a2a], [0x8a8a9a, 0xe0e0e0, 0x4a4a5a, 0xe8b03a]] },
  para:    { W: 64, H: 46, cat: 'herb', kind: 'para', col: [[0x7a9a5a, 0xd8d8a8, 0x4a6a3a, 0xe07a3a], [0x8a8a6a, 0xe0d8b8, 0x5a5a3a, 0xc84a5a]] },
  stego:   { W: 96, H: 66, cat: 'herb', kind: 'stego', col: [[0x8a9a6a, 0xd8d8b0, 0x5a6a3a, 0xd8643a], [0x9a8a5a, 0xe0d0a8, 0x6a5a34, 0xc8443a]] },
  brachio: { W: 150, H: 170, cat: 'herb', kind: 'brachio', col: [[0x8a9488, 0xc8ccc0, 0x5a645a, 0xa8a898], [0x9a8a6a, 0xd0c8a8, 0x6a5a44, 0xb8a888]] }
};
const DKEYS = Object.keys(DSPEC);
function drawDino(L, pose) {
  const S = DSPEC[L.sp], W = S.W, H = S.H, g = new Int32Array(W * H).fill(-1), C = S.col[(L.morph || 0) % S.col.length], seed = L.seed || 0;
  const base = C[0], belly = C[1], pat = C[2], acc = C[3], ink = 0x2b1a16, hl = mixc(base, 0xfff4dc, 0.22), sh = mixc(base, ink, 0.3);
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H && c >= 0) g[y * W + x] = grade(c); };
  const F = S.feat || {}, dark = pose === 8;
  // a shaded disc: lit from the upper left, darker / belly below, stripes or spots on the back
  const disc = (cx, cy, r, o) => { o = o || {}; const b0 = o.c || base, h0 = o.c ? mixc(o.c, 0xfff4dc, 0.22) : hl, s0 = o.c ? mixc(o.c, ink, 0.3) : sh;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r; if (dx * dx + dy * dy > 1) continue;
      let c = dy < -0.5 ? h0 : dy > 0.42 ? (o.belly ? belly : s0) : b0;
      if (!o.c && dy < 0.05 && F.stripes && ((x + seed) % (o.per || 9)) < 2.4) c = mixc(c, pat, 0.42);
      if (!o.c && dy < 0.3 && F.spots && hash2(x + seed, y) > 0.86) c = mixc(c, pat, 0.7);
      if (!o.c && F.bumps && dy < -0.1 && ((x * 3 + y * 5) % 7) === 0) c = mixc(c, ink, 0.3);
      if (dy > 0.88) c = mixc(c, ink, 0.25); if (o.shade) c = mixc(c, ink, o.shade); set(x, y, c); } };
  const oval = (cx, cy, rx, ry, o) => { o = o || {}; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy > 1) continue;
      let c = dy < -0.55 + dx * 0.1 ? hl : dy > 0.38 ? (o.belly ? belly : sh) : base; if (dy > 0.85) c = mixc(c, ink, 0.25);
      if (dy < 0.1 && F.stripes && ((x + seed) % 9) < 2.4) c = mixc(c, pat, 0.42); if (dy < 0.2 && F.spots && hash2(x + seed, y) > 0.86) c = mixc(c, pat, 0.7); if (dy < 0 && F.bumps && ((x * 3 + y * 5) % 7) === 0) c = mixc(c, ink, 0.3); set(x, y, c); } };
  const cap = (x0, y0, x1, y1, r0, r1, o) => { const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.7)); for (let i = 0; i <= n; i++) { const q = i / n; disc(x0 + (x1 - x0) * q, y0 + (y1 - y0) * q, r0 + (r1 - r0) * q, o); } };
  const line = (x0, y0, x1, y1, c) => { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); };
  const walk = pose >= 1 && pose <= 4, ph = walk ? (pose - 1) / 4 * TAU : 0, open = pose === 6 ? 0.35 : pose === 7 ? 0.62 : 0;
  // eye at (x, y): pale ring, dark pupil, a brow above; closed when down
  const eye = (x, y, r) => { if (dark) { line(x - r, y, x + r, y, ink); return; } for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + 0.5) set(x + xx, y + yy, 0xf0d870); set(x + (r > 1 ? 1 : 0), y, ink); if (r > 1) set(x + 1, y + 1, ink); line(x - r - 1, y - r - 1, x + r + 1, y - r - 1, mixc(base, ink, 0.55)); };
  if (S.kind === 'thero') {
    const s = W / 100, P = (u) => u * s, gy = H - 2, Y = v => gy - (68 - v) * s;
    const body = S.body || [48, 34, 15, 9], head = S.head || [72, 17, 6, 5], snout = S.snout || [86, 20, 2.4], neck = S.neck || [58, 30, 4.5, 66, 20, 3.6], tail = S.tail || [34, 32, 6, 2, 24, 1], thR = S.thigh || 7;
    let bob = walk ? -Math.abs(Math.sin(ph)) * 1.1 * s : 0, dx = 0, dy = 0, hdy = 0, hdx = 0;
    if (pose === 6) { dx = 2.5; hdy = 3; hdx = 3; } if (pose === 7) { hdy = -4; hdx = -1; } if (pose === 5) { hdy = 9; hdx = 2; } if (dark) { dy = 16; hdy = 30; hdx = 4; bob = 0; }
    const X = u => P(u + dx), YB = v => Y(v + dy) + bob, YH = v => Y(v + dy + hdy) + bob;
    const legs = (far) => { const p2 = ph + (far ? Math.PI : 0), hipX = 42 + (far ? -2 : 1), hipY = body[1] + 2;
      if (dark) { cap(X(hipX), YB(hipY + 4), X(hipX + 10), YB(66 - dy), thR * 0.35 * s, thR * 0.25 * s, { shade: far ? 0.25 : 0 }); return; }
      const st = walk ? Math.sin(p2) * 9 : (far ? -3 : 3), lift = walk ? Math.max(0, Math.cos(p2)) * 3 : 0, fx = hipX + 5 + st, kx = hipX + 7 + st * 0.35, ky = hipY + (68 - hipY) * 0.42;
      disc(X(hipX + 1), YB(hipY + 2), thR * s * 1.05, { belly: 0, shade: far ? 0.28 : 0 });
      cap(X(kx), YB(ky), X(fx - 3), Y(62 - lift), thR * 0.48 * s, thR * 0.34 * s, { shade: far ? 0.28 : 0 });
      cap(X(fx - 3), Y(62 - lift), X(fx), Y(67 - lift), thR * 0.3 * s, thR * 0.26 * s, { shade: far ? 0.28 : 0 });
      cap(X(fx - 1), Y(67.4 - lift), X(fx + 4.5), Y(67.6 - lift), 0.9 * s + 0.4, 0.6 * s + 0.3, { c: mixc(base, ink, far ? 0.45 : 0.3) });
      if (F.sickle && !far) { set(X(fx + 1), Y(66 - lift), 0xe8dcc0); set(X(fx + 1.5), Y(65 - lift), 0xe8dcc0); } };
    const arm = (far) => { if (dark) return; const ax = body[0] + body[2] * 0.6, ay = body[1] + 2, len = F.tinyArms ? 4 : 9, sw = walk ? Math.sin(ph + (far ? 1 : 0)) * 1.5 : 0;
      cap(X(ax), YB(ay), X(ax + len * 0.5 + sw), YB(ay + len * 0.8), 1.4 * s + 0.3, 1 * s + 0.3, { shade: far ? 0.3 : 0 });
      set(X(ax + len * 0.5 + sw + 1), YB(ay + len * 0.8 + 1), 0xe8dcc0);
      if (F.feathers && !far) for (let i = 0; i < 4; i++) line(X(ax + 1 + i), YB(ay + 2 + i * 0.8), X(ax + i - 1), YB(ay + 5 + i), pat); };
    // the sail first (behind everything), then far limbs, tail, body, near limbs, neck, head
    if (F.sail) { const sx = body[0] - 4, sy = body[1] - body[3] * 0.4; for (let y = Math.floor(YB(sy - 22)); y <= YB(sy); y++) for (let x = Math.floor(X(sx - 16)); x <= X(sx + 16); x++) { const q = (x - X(sx)) / P(16), r = (YB(sy) - y) / P(22); if (q * q + r * r > 1 || r < 0) continue; let c = r > 0.75 ? mixc(acc, 0xfff4dc, 0.2) : r > 0.4 ? acc : mixc(acc, base, 0.5); if (((x - X(sx - 16)) % (4 * s + 1)) < 1) c = mixc(c, ink, 0.45); set(x, y, c); } }
    legs(true); arm(true);
    cap(X(tail[0]), YB(tail[1]), X(tail[3]), YB(tail[4] + (walk ? Math.sin(ph) * 1.2 : 0)), tail[2] * s, tail[5] * s, { belly: 1, per: 7 });
    oval(X(body[0]), YB(body[1]), body[2] * s, body[3] * s * 1.1, { belly: 1 }); disc(X(body[0] + body[2] * 0.55), YB(body[1] - 1), body[3] * s * 0.95, { belly: 1 });
    legs(false);
    if (F.frill && (pose === 6 || pose === 7)) { const fx = head[0] - 5 + hdx, fy = head[1] + 2; for (let y = Math.floor(YH(fy - 9)); y <= YH(fy + 9); y++) for (let x = Math.floor(X(fx - 7)); x <= X(fx + 4); x++) { const q = (x - X(fx)) / P(7), r = (y - YH(fy)) / P(9); if (q * q + r * r > 1) continue; const a = Math.atan2(r, q); set(x, y, ((a * 5 / Math.PI) | 0) % 2 ? acc : mixc(acc, 0xf0e070, 0.5)); } }
    cap(X(neck[0]), YB(neck[1]), X(neck[3] + hdx), YH(neck[4]), neck[2] * s, neck[5] * s, { belly: 1 });
    // head: cranium + upper jaw to the snout; the lower jaw drops open for a bite or a roar
    const hx = head[0] + hdx, hcy = head[1], sxx = snout[0] + hdx, syy = snout[1];
    if (open) { const jx = hx + 1, jy = hcy + head[3] * 0.5, L2 = Math.hypot(sxx - jx, syy - jy), a = Math.atan2(syy - jy, sxx - jx) + open;
      const ex2 = jx + Math.cos(a) * L2 * 0.92, ey2 = jy + Math.sin(a) * L2 * 0.92;
      for (let t = 0; t <= 1; t += 0.03) { const ux = jx + (sxx - jx) * t, uy = jy + (syy - jy) * t, lx = jx + (ex2 - jx) * t, ly = jy + (ey2 - jy) * t; line(X(ux), YH(uy), X(lx), YH(ly), 0x6a2020); }
      cap(X(jx), YH(jy), X(ex2), YH(ey2), head[3] * 0.45 * s, snout[2] * 0.6 * s, { c: mixc(belly, base, 0.4) });
      for (let t = 0.25; t < 0.95; t += 0.08) { set(X(jx + (sxx - jx) * t), YH(jy + (syy - jy) * t) + 1, 0xf6f0e0); set(X(jx + (ex2 - jx) * t), YH(jy + (ey2 - jy) * t) - 1, 0xf6f0e0); } }
    disc(X(hx), YH(hcy), head[2] * s, {}); for (let k = 0; k < 2; k++) disc(X(hx + k * 1.5), YH(hcy + head[3] * 0.25), head[3] * s, {});
    cap(X(hx + 2), YH(hcy + 1), X(sxx), YH(syy), head[3] * 0.82 * s, snout[2] * s, {});
    if (!open) { line(X(hx + 2), YH(hcy + head[3] * 0.75), X(sxx), YH(syy + snout[2] * 0.7), mixc(base, ink, 0.5)); if (S.cat === 'apex' || S.cat === 'heavy') for (let t = 0.3; t < 0.95; t += 0.12) set(X(hx + 2 + (sxx - hx - 2) * t), YH(hcy + head[3] * 0.75 + (syy - hcy - head[3] * 0.75) * t) + 1, 0xf6f0e0); }
    set(X(sxx - 1), YH(syy - snout[2] * 0.5), ink);
    if (F.mask) for (let k = -2; k <= 2; k++) set(X(hx + 2 + k), YH(hcy - 1), 0xf0ece0);
    eye(X(hx + head[2] * 0.25), YH(hcy - head[3] * 0.25), Math.max(1, Math.round(s * 1.1)));
    if (F.dome) { disc(X(hx - 0.5), YH(hcy - head[3] * 0.75), head[2] * 0.95 * s, { c: acc }); for (let i = 0; i < 7; i++) { const a = Math.PI * (0.6 + i * 0.13); set(X(hx - 0.5 + Math.cos(a) * head[2] * 1.05), YH(hcy - head[3] * 0.75 + Math.sin(a) * head[3] * 1.05), mixc(base, ink, 0.4)); } }
    if (F.crests) for (let k = 0; k < 2; k++) for (let i = 0; i <= 10; i++) { const x = hx - 4 + i * 1.1 + k * 0.8, h = Math.sin(i / 10 * Math.PI) * 4.5; line(X(x), YH(hcy - head[3] * 0.8), X(x), YH(hcy - head[3] * 0.8 - h), k ? mixc(acc, ink, 0.25) : acc); }
    if (F.horns) for (const hxo of [-1, 2]) line(X(hx + hxo), YH(hcy - head[3] * 0.7), X(hx + hxo - 1.2), YH(hcy - head[3] * 0.7 - 4), mixc(acc, 0xe8dcc0, 0.6));
    if (F.ridge) for (let i = 0; i < 3; i++) set(X(hx + head[2] * 0.1 + i), YH(hcy - head[3] * 0.9 - (i === 1 ? 1 : 0)), mixc(base, ink, 0.4));
    if (F.feathers) { for (let u = tail[3] + 2; u < neck[3]; u += 2.6) { const v = u < body[0] - body[2] ? tail[1] - (tail[0] - u) * (tail[1] - tail[4]) / (tail[0] - tail[3]) - tail[2] * (u - tail[3]) / (tail[0] - tail[3]) : u < body[0] + body[2] ? body[1] - body[3] : neck[1] - neck[2] - (u - neck[0]) * (neck[1] - neck[4]) / (neck[3] - neck[0]); line(X(u), YB(v), X(u - 1.6), YB(v - 2.4), pat); } for (let i = 0; i < 5; i++) line(X(tail[3] + i * 1.2), YB(tail[4]), X(tail[3] - 1 + i * 1.2), YB(tail[4] + 3), acc); }
    arm(false);
  } else if (S.kind === 'trike' || S.kind === 'ankylo' || S.kind === 'stego' || S.kind === 'para') {
    const s = W / 100, gy = H - 2, Y = v => gy - (68 - v) * s, X = u => u * s, k = S.kind;
    const bob = walk ? -Math.abs(Math.sin(ph)) * 0.8 * s : 0, YB = v => Y(v + (dark ? 10 : 0)) + bob, hdy = pose === 5 ? 5 : pose === 7 ? -4 : pose === 6 ? 2 : dark ? 10 : 0, hdx = pose === 6 ? 3 : 0, YH = v => Y(v + hdy) + bob;
    const B = k === 'ankylo' ? [48, 49, 30, 10] : k === 'stego' ? [46, 36, 24, 15] : k === 'para' ? [46, 36, 17, 12] : [46, 37, 24, 15];
    const leg = (x, top, r, far, off) => { if (dark) return; const st = walk ? Math.sin(ph + off) * 4 : 0, lift = walk ? Math.max(0, Math.cos(ph + off)) * 2 : 0, kn = top + (66 - top) * 0.5; cap(X(x), YB(top), X(x + st * 0.4 + 0.6), Y(kn), r * s, r * 0.72 * s, { shade: far ? 0.3 : 0 }); cap(X(x + st * 0.4 + 0.6), Y(kn), X(x + st), Y(66 - lift), r * 0.72 * s, r * 0.6 * s, { shade: far ? 0.3 : 0 }); cap(X(x + st - 1), Y(67.2 - lift), X(x + st + 3), Y(67.4 - lift), 1 * s + 0.4, 0.8 * s + 0.4, { c: mixc(base, ink, far ? 0.45 : 0.3) }); };
    const legsF = k === 'para' ? [[40, B[1] + 4, 4.5, Math.PI], [62, B[1] + 6, 2.2, 0.6]] : k === 'ankylo' ? [[30, B[1], 4, Math.PI], [68, B[1], 4, 0]] : k === 'stego' ? [[30, B[1] - 2, 5.5, Math.PI], [62, B[1] + 4, 4.5, 0]] : [[30, B[1], 5.5, Math.PI], [64, B[1], 5, 0]];
    for (const [x, t, r, o] of legsF) leg(x - 3, t, r, true, o + Math.PI);
    if (k === 'stego') for (let i = 0; i < 9; i++) { const u = 22 + i * 5, top = B[1] - B[3] * Math.sin((u - 18) / 50 * Math.PI) * 1.05, h = 5 + Math.sin((i + 0.5) / 9 * Math.PI) * 6; for (let y = 0; y <= h; y++) { const w2 = (1 - Math.abs(y / h - 0.45) / 0.55) * 2.6; for (let x = -w2; x <= w2; x++) set(X(u + x), YB(top - y), y > h * 0.75 ? mixc(acc, 0xfff4dc, 0.25) : Math.abs(x) > w2 - 0.8 ? mixc(acc, ink, 0.3) : acc); } }
    // tail
    if (k === 'para') cap(X(34), YB(34), X(4), YB(30 + (walk ? Math.sin(ph) : 0)), 5 * s, 1 * s, { belly: 1 });
    else if (k === 'ankylo') { cap(X(22), YB(48), X(4), YB(46), 5 * s, 2 * s, {}); disc(X(4), YB(46), 4.5 * s, { c: mixc(base, ink, 0.15) }); disc(X(7), YB(45), 3.4 * s, { c: mixc(base, ink, 0.15) }); }
    else if (k === 'stego') { cap(X(24), YB(38), X(2), YB(42), 7 * s, 1.4 * s, { belly: 1 }); for (let i = 0; i < 4; i++) line(X(4 + i * 2.5), YB(41 - i * 0.3), X(1 + i * 2.5), YB(34 - i * 0.6), 0xe8dcc0); }
    else cap(X(26), YB(35), X(3), YB(40), 7 * s, 1.5 * s, { belly: 1 });
    oval(X(B[0]), YB(B[1]), B[2] * s, B[3] * s, { belly: 1 }); if (k !== 'ankylo') oval(X(B[0] - B[2] * 0.25), YB(B[1] - B[3] * 0.18), B[2] * s * 0.62, B[3] * s * 0.92, { belly: 1 });
    if (k === 'ankylo') { for (let u = 22; u < 76; u += 3.2) for (let r = 0; r < 3; r++) set(X(u + (r % 2) * 1.6), YB(B[1] - B[3] * (0.85 - r * 0.28)), r ? mixc(acc, ink, 0.2) : acc); for (let u = 22; u < 76; u += 5.5) { const yy = B[1] + B[3] * 0.25; line(X(u), YB(yy), X(u - 2.4), YB(yy + 3.4), 0xe8dcc0); line(X(u + 0.6), YB(yy), X(u - 1.8), YB(yy + 3.4), 0xc8bca0); } }
    for (const [x, t, r, o] of legsF) leg(x, t, r, false, o);
    // necks + heads
    if (k === 'trike') { const hx = 78 + hdx, hy = 40;
      for (let y = Math.floor(YH(hy - 22)); y <= YH(hy + 2); y++) for (let x = Math.floor(X(hx - 18)); x <= X(hx - 1); x++) { const q = (x - X(hx - 9)) / X(10), r = (y - YH(hy - 10)) / X(13); if (q * q + r * r > 1) continue; const edge = q * q + r * r > 0.72; set(x, y, edge ? ((Math.atan2(r, q) * 7 | 0) % 2 ? mixc(acc, 0xfff4dc, 0.3) : acc) : (r < -0.2 ? mixc(base, acc, 0.35) : mixc(base, ink, 0.12))); }
      disc(X(hx), YH(hy), 8 * s, {}); cap(X(hx + 2), YH(hy + 1), X(hx + 13), YH(hy + 7), 6 * s, 2.2 * s, {}); line(X(hx + 12), YH(hy + 4), X(hx + 15), YH(hy + 8), mixc(base, ink, 0.5));
      for (const o of [0, 1]) cap(X(hx + 2 - o * 2), YH(hy - 6), X(hx + 18 - o * 2), YH(hy - 13 - o), 1.6 * s, 0.4 * s, { c: o ? 0xc8bca0 : 0xe8dcc0 });
      cap(X(hx + 9), YH(hy - 1), X(hx + 12), YH(hy - 5), 1.2 * s, 0.4 * s, { c: 0xe8dcc0 }); eye(X(hx + 2), YH(hy - 3), Math.max(1, Math.round(s))); }
    else if (k === 'ankylo') { const hx = 82 + hdx, hy = 52; cap(X(72), YB(50), X(hx), YH(hy), 5 * s, 4 * s, {}); disc(X(hx), YH(hy), 5.4 * s, {}); cap(X(hx + 1), YH(hy + 1), X(hx + 8), YH(hy + 3), 4 * s, 2 * s, {}); set(X(hx + 4), YH(hy - 3), acc); set(X(hx - 2), YH(hy - 3), acc); eye(X(hx + 1), YH(hy - 1), Math.max(1, Math.round(s * 0.8))); }
    else if (k === 'stego') { const hx = 84 + hdx, hy = 54; cap(X(64), YB(42), X(hx), YH(hy), 5 * s, 3.2 * s, { belly: 1 }); disc(X(hx), YH(hy), 4 * s, {}); cap(X(hx + 1), YH(hy + 0.5), X(hx + 7), YH(hy + 2), 3 * s, 1.4 * s, {}); eye(X(hx + 0.5), YH(hy - 1), 1); }
    else { const hx = 74 + hdx, hy = 16; cap(X(58), YB(30), X(hx - 2), YH(hy + 2), 4.2 * s, 3.2 * s, { belly: 1 }); cap(X(hx - 2), YH(hy - 3), X(hx - 17), YH(hy - 11), 2 * s, 1.4 * s, { c: acc }); disc(X(hx), YH(hy), 5 * s, {}); cap(X(hx + 1), YH(hy + 1), X(hx + 11), YH(hy + 4), 3.4 * s, 2.6 * s, {}); line(X(hx + 6), YH(hy + 5), X(hx + 12), YH(hy + 5.5), mixc(base, ink, 0.5)); eye(X(hx + 1), YH(hy - 1), Math.max(1, Math.round(s))); }
  } else if (S.kind === 'brachio') {
    const s = W / 100, gy = H - 2, X = u => u * s, Y = v => gy - (113 - v) * s, bob = walk ? -Math.abs(Math.sin(ph)) * 0.8 : 0, YB = v => Y(v + (dark ? 14 : 0)) + bob, hdy = pose === 5 ? 30 : pose === 7 ? -3 : 0;
    const leg = (x, top, r, far, off) => { if (dark) return; const st = walk ? Math.sin(ph + off) * 4 : 0; cap(X(x), YB(top), X(x + st), Y(111), r * s, r * 0.9 * s, { shade: far ? 0.3 : 0 }); cap(X(x + st - 2), Y(112), X(x + st + 3), Y(112), 1.6 * s, 1.4 * s, { c: mixc(base, ink, 0.35) }); };
    leg(30, 78, 6, true, Math.PI); leg(62, 74, 6.5, true, 0);
    cap(X(26), YB(78), X(2), YB(98), 7 * s, 1.5 * s, { belly: 1 });
    oval(X(46), YB(77), 24 * s, 13 * s, { belly: 1 }); oval(X(56), YB(72), 14 * s, 12 * s, { belly: 1 });
    leg(34, 80, 6, false, 0); leg(66, 74, 6.5, false, Math.PI);
    const hx = 84, hy = 10 + hdy; for (let t = 0; t <= 1; t += 0.02) { const nx = 60 + (hx - 2 - 60) * t + Math.sin(t * Math.PI) * 4, ny = 68 + (hy + 6 - 68) * t; disc(X(nx), YB(ny), (7.5 - t * 4.2) * s, { belly: 1 }); } disc(X(hx), YB(hy), 4 * s, {}); disc(X(hx - 1), YB(hy - 3), 2.6 * s, {}); cap(X(hx + 1), YB(hy + 1), X(hx + 7), YB(hy + 2.5), 2.6 * s, 1.6 * s, {}); eye(X(hx + 0.5), YB(hy - 1), 1);
  } else if (S.kind === 'ptero') {
    const flap = dark ? -99 : pose === 6 ? 99 : walk ? [-14, -4, 8, -4][pose - 1] : pose === 7 ? -10 : -2, cx = 38, cy = 20;
    if (flap === -99) { disc(36, 32, 6, { belly: 1 }); line(26, 34, 44, 34, mixc(base, ink, 0.3)); cap(42, 30, 56, 34, 2, 0.8, {}); cap(40, 28, 32, 22, 1.4, 0.6, { c: acc }); eye(44, 30, 1); }
    else {
      const wing = (sgn) => { const tip = flap === 99 ? [cx + sgn * 12, cy - 2] : [cx + sgn * 34, cy + flap], root = [cx + sgn * 3, cy - 1], back = [cx + sgn * 4, cy + 4];
        for (let t = 0; t <= 1; t += 0.02) { const ax = root[0] + (tip[0] - root[0]) * t, ay = root[1] + (tip[1] - root[1]) * t, bx = back[0] + (tip[0] - back[0]) * t * 0.85, by = back[1] + (tip[1] - back[1]) * t * 0.85 + Math.sin(t * Math.PI) * 4;
          for (let q = 0; q <= 1; q += 0.12) set(ax + (bx - ax) * q, ay + (by - ay) * q, q < 0.18 ? mixc(base, ink, 0.35) : t > 0.75 ? mixc(acc, base, 0.4) : q > 0.8 ? mixc(base, belly, 0.5) : base); }
        line(root[0], root[1], tip[0], tip[1], mixc(base, ink, 0.5)); };
      wing(-1); disc(cx, cy + 1, 4, { belly: 1 }); cap(cx - 3, cy + 2, cx - 9, cy + 4, 1.6, 0.6, {});
      const hx = cx + 6, hy = cy - 3 + (pose === 6 ? 4 : 0); disc(hx, hy, 2.6, {}); cap(hx + 1, hy, hx + 16, hy + 3, 1.6, 0.4, {}); cap(hx - 1, hy - 1, hx - 9, hy - 6, 1.6, 0.6, { c: acc }); eye(hx + 1, hy - 0.5, 1);
      wing(1); if (pose !== 6) { line(cx - 1, cy + 4, cx - 2, cy + 8, mixc(base, ink, 0.4)); line(cx + 1, cy + 4, cx + 1, cy + 8, mixc(base, ink, 0.4)); }
    }
  }
  return inkGrid(g, W, H, 0.85);
}
// a dinosaur's whole sheet: 9 poses x 2 rows (facing right, facing left)
function dinoGrid(L) {
  const S = DSPEC[L.sp], W = S.W, H = S.H, Wd = W * 9, out = new Int32Array(Wd * H * 2).fill(-1);
  for (let p = 0; p < 9; p++) { const gq = drawDino(L, p); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = gq[y * W + x]; if (c < 0) continue; out[y * Wd + p * W + x] = c; out[(H + y) * Wd + p * W + W - 1 - x] = c; } }
  return { g: out, W: Wd, H: H * 2, cw: W, ch: H };
}
