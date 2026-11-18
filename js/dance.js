'use strict';
// ===== Sài Gòn Lofi — Tết lion dance (múa lân) and dragon dance (múa rồng) in the park =====
// Everything here only exists while G.tet. The two stages are chosen once at boot (DAN.plan) from free park tiles; objects are
// built when a performance starts and dropped when it ends. The drums / cymbals / gong are synthesised in WebAudio and routed
// through the street-ambience bus (AU.str), so the street volume slider and mute switch control them. One beat engine drives
// the sound, the drummers' arms, the lions' hops, the dragon's mouth and the crowd's cheers, so picture and sound stay in step.
const DAN = { Z: null, phase: 'rest', timer: 0, kind: null, nextKind: 'lion', hold: null, vis: 0, t: 0, fin: false, lions: [], od: null, spec: [], band: [], props: [], drag: null, S: null, step: 0, stepT: 0, bar: 0, stepDur: 0.19, pat: null, hit: { D: 9, d: 9, c: 9, g: 9, k: 9 }, bus: null, vol: 0, stats: { steps: 0, snd: 0, bars: 0, greets: 0, runs: 0 } };
const DA_RED = 0xd9281e, DA_GOLD = 0xf2c94c, DA_CREAM = 0xfdfbf2, DA_INK = 0x2a1a22;
const tkD = (x, y) => y * N + x;

// ---------------------------------------------------------------- planning: pick two stages on free park tiles (once, after planTet)
DAN.plan = () => {
  const occ = new Set(), stall = new Set(TET.blocks);
  for (const r of CITY.recs) if ((r.t === 'p' || r.t === 't') && !r.tet) occ.add(tkD(Math.floor(r.x / T), Math.floor(r.y / T)));
  for (const d of POI.doors) occ.add(tkD(Math.floor(d.x / T), Math.floor(d.y / T)));
  const ok = (tx, ty) => tx >= 0 && ty >= 0 && tx < N && ty < N && (GT[gi(tx, ty)] === G_GRASS || GT[gi(tx, ty)] === G_PLAZA) && !BLK[gi(tx, ty)] && !occ.has(tkD(tx, ty)) && !stall.has(gi(tx, ty));
  let P = null; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (KINDS[j][i] === 'park') P = { x0: XS[i][0] + SW, x1: XS[i][1] - SW, y0: YS[j][0] + SW, y1: YS[j][1] - SW };
  if (!P) return;
  const used = new Set(), core = new Set();
  const ringOk = (cx, cy, r0, r1) => { let n = 0; for (let dy = -r1; dy <= r1; dy++) for (let dx = -r1; dx <= r1; dx++) { const d = Math.hypot(dx, dy); if (d >= r0 && d <= r1 && ok(cx + dx, cy + dy)) n++; } return n; };
  // lion stage: a disc of radius 3 tiles
  let best = null;
  for (let cy = P.y0 + 5; cy < P.y1 - 5; cy++) for (let cx = P.x0 + 5; cx < P.x1 - 5; cx++) {
    let bad = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9 && !ok(cx + dx, cy + dy)) bad++;
    const sc = bad * 10 - ringOk(cx, cy, 3.6, 6.4); if (!best || sc < best.sc) best = { cx, cy, sc };
  }
  const L = { cx: best.cx * T + 4, cy: best.cy * T + 4, tx: best.cx, ty: best.cy, r: 2.7 * T };
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9) used.add(tkD(best.cx + dx, best.cy + dy));
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 7) core.add(gi(best.cx + dx, best.cy + dy));
  // lion spectators: three rings of free tiles; the drum band takes the sector on the right-hand side
  const slots = [], bandSlots = [];
  for (const [ri, rt] of [[0, 4.1], [1, 5.3], [2, 6.5]]) for (let a = 0; a < 360; a += ri === 0 ? 15 : ri === 1 ? 12 : 10) {
    const rad = a * Math.PI / 180, wx = L.cx + Math.cos(rad) * rt * T, wy = L.cy + Math.sin(rad) * rt * T, tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    if (a >= 270 && a < 352) continue;                                           // keep the band sector clear
    if (ok(tx, ty)) { slots.push({ x: wx, y: wy, ring: ri, a }); used.add(tkD(tx, ty)); }
  }
  for (let k = 0; k < 4; k++) { const rad = (292 + k * 18) * Math.PI / 180, wx = L.cx + Math.cos(rad) * 3.9 * T, wy = L.cy + Math.sin(rad) * 3.9 * T; bandSlots.push({ x: wx, y: wy }); used.add(tkD(Math.floor(wx / T), Math.floor(wy / T))); }
  L.slots = slots; L.band = bandSlots;
  // dragon stage: a figure-of-eight path (x = sin u, y = sin 2u) on open grass, well away from the lions
  const RX = 4.4 * T, RY = 2.7 * T, pathAt = (cx, cy, u) => [cx + Math.sin(u) * RX, cy + Math.sin(2 * u) * RY];
  let bd = null;
  for (let cy = P.y0 + 5; cy < P.y1 - 5; cy++) for (let cx = P.x0 + 6; cx < P.x1 - 6; cx++) {
    if (Math.hypot(cx - best.cx, cy - best.cy) < 13) continue;
    const seen = new Set(); let bad = 0;
    for (let k = 0; k < 72; k++) { const q = pathAt(cx * T + 4, cy * T + 4, k / 72 * Math.PI * 2); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const tx = Math.floor(q[0] / T) + dx, ty = Math.floor(q[1] / T) + dy, key = tkD(tx, ty); if (!seen.has(key)) { seen.add(key); if (!ok(tx, ty)) bad++; } } }
    const sc = bad * 10 - ringOk(cx, cy, 5.5, 8.5) * 0.3; if (!bd || sc < bd.sc) bd = { cx, cy, sc };
  }
  const D = { cx: bd.cx * T + 4, cy: bd.cy * T + 4, tx: bd.cx, ty: bd.cy, rx: RX, ry: RY, path: [], len: 0, slots: [], band: [] };
  { let acc = 0, pv = null; for (let k = 0; k <= 400; k++) { const q = pathAt(D.cx, D.cy, k / 400 * Math.PI * 2); if (pv) acc += Math.hypot(q[0] - pv[0], q[1] - pv[1]); D.path.push([q[0], q[1], acc]); pv = q; } D.len = acc; }
  for (let k = 0; k < 72; k++) { const q = pathAt(D.cx, D.cy, k / 72 * Math.PI * 2); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) used.add(tkD(Math.floor(q[0] / T) + dx, Math.floor(q[1] / T) + dy)); core.add(gi(Math.floor(q[0] / T), Math.floor(q[1] / T))); }
  for (const [ri, ex] of [[0, 2.0], [1, 3.3]]) for (let a = 0; a < 360; a += ri === 0 ? 11 : 9) {
    const rad = a * Math.PI / 180, wx = D.cx + Math.cos(rad) * (RX + ex * T), wy = D.cy + Math.sin(rad) * (RY + ex * T), tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    if (a >= 330 || a < 22) continue;
    if (ok(tx, ty) && !used.has(tkD(tx, ty))) { D.slots.push({ x: wx, y: wy, ring: ri, a }); used.add(tkD(tx, ty)); }
  }
  for (let k = 0; k < 4; k++) { const rad = (352 + k * 7) * Math.PI / 180, wx = D.cx + Math.cos(rad) * (RX + 2.6 * T), wy = D.cy + Math.sin(rad) * (RY + 2.6 * T); D.band.push({ x: wx, y: wy }); used.add(tkD(Math.floor(wx / T), Math.floor(wy / T))); }
  DAN.Z = { lion: L, dragon: D };
  // the stages replace any Tết pots / flags / mai that would stand in the way; the performers' core tiles are closed to walkers while Tết is on
  CITY.recs = CITY.recs.filter(r => !(r.tet && (r.t === 'p' || r.t === 't') && used.has(tkD(Math.floor(r.x / T), Math.floor(r.y / T)))));
  TET.fixed = TET.fixed.filter(f => !used.has(tkD(Math.floor(f.x / T), Math.floor(f.y / T))));
  for (const g of core) { TET.blocks.push(g); if (TET.saveWALK && !TET.saveWALK.has(g)) TET.saveWALK.set(g, WALK[g]); }
};
const dirOf = (dx, dy) => Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3);
const pathPos = (s) => { const D = DAN.Z.dragon, p = D.path, L = D.len; s = ((s % L) + L) % L; let lo = 0, hi = p.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p[m][2] <= s) lo = m; else hi = m; } const a = p[lo], b = p[hi], u = b[2] > a[2] ? (s - a[2]) / (b[2] - a[2]) : 0; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, b[0] - a[0], b[1] - a[1]]; };

// ---------------------------------------------------------------- pixel painter (grid at K art pixels per world unit)
function paint(wu, hu) {
  const W = Math.round(wu * K), H = Math.round(hu * K), g = new Int32Array(W * H).fill(-1), P = { W, H, g };
  P.set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = c; };
  P.get = (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < W && y < H ? g[y * W + x] : -1; };
  P.rect = (x0, y0, x1, y1, c) => { for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) P.set(x, y, c); };
  P.ell = (cx, cy, rx, ry, c, hi, lo) => {
    hi = hi === undefined ? mixc(c, 0xfff1d6, 0.34) : hi; lo = lo === undefined ? mixc(c, 0x3a1a2a, 0.32) : lo; const lo2 = mixc(c, 0x3a1a2a, 0.55);
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; const l = -dx * 0.5 - dy * 0.75 + (1 - d) * 0.25; P.set(x, y, l > 0.62 ? hi : l > -0.1 ? c : l > -0.55 ? lo : lo2); }
  };
  P.line = (x0, y0, x1, y1, c, th) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 2; for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; P.set(x, y, c); if (th) P.set(x + 1, y, c); } };
  P.bake = (ax, ay) => { const s = gridCanvas(inkGrid(g, W, H, 0.8), W, H, null, K); s.ax = ax; s.ay = ay; return s; };
  return P;
}
const _dsp = {};
const memo = (key, f) => _dsp[key] || (_dsp[key] = f());

// ---------------------------------------------------------------- lion costumes: red, yellow, white (Vietnamese lân: big round eyes, one horn, mane fringe, beard)
const LION = {
  red: { body: grade(0xd9281e), trim: grade(0xf2c94c), mane: grade(0xf2c94c), mane2: grade(0xb8181a), beard: 0xf7f4ec, pants: grade(0xa81c14), nose: grade(0xf2c94c) },
  yellow: { body: grade(0xf4cf3c), trim: grade(0xd9281e), mane: grade(0xe8431e), mane2: grade(0xf08a2b), beard: 0xf7f4ec, pants: grade(0xd9a032), nose: grade(0xd9281e) },
  white: { body: grade(0xf4efe6), trim: grade(0xd9281e), mane: grade(0xdcd8ce), mane2: grade(0x8ec6e6), beard: grade(0xf2c94c), pants: grade(0xcfc8ba), nose: grade(0xd9281e) }
};
// view 0: facing the camera (head right, tail left) · view 1: facing away (head behind, tail toward us). Mirrored by the caller for the other diagonal.
function lionSprite(col, view, eye, mouth, hdx, hdy, tail) {
  return memo(['L', col, view, eye, mouth, hdx, hdy, tail].join('|'), () => {
    const C = LION[col], P = paint(36, 32), body = C.body, bodyD = mixc(body, 0x3a1a2a, 0.3), bodyL = mixc(body, 0xfff1d6, 0.3), front = view === 0;
    const stripes = (cx, cy, rx, ry) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (P.get(x, y) >= 0 && (((x + y * 0.7) | 0) % 10 < 2)) P.set(x, y, C.trim); };
    const legs = front ? [[12, 18], [20, 26], [36, 42], [44, 50]] : [[16, 22], [24, 30], [34, 40], [42, 48]];
    const doLegs = () => { for (const [a, b] of legs) { P.rect(a, 48, b - 1, 54, C.pants); for (let x = a; x < b; x += 2) P.set(x, 54, C.trim); P.rect(a, 55, b, 58, 0x2a1e22); } };
    const tuft = (x, y) => { P.ell(x, y, 4.2, 5.4, C.mane); P.ell(x + 0.5, y - 2.4, 2.2, 2.4, DA_CREAM); };
    if (front) {
      P.line(11, 40, 7 + tail * 2, 31 - tail * 3, body, 1); tuft(7 + tail * 2, 26 - tail * 3);
      doLegs(); P.ell(30, 42, 19, 11, body, bodyL, bodyD); stripes(30, 42, 19, 11);
      for (let x = 14; x <= 46; x += 3) { P.rect(x, 51, x + 1, 53, C.trim); P.set(x + 1, 54, C.mane2); }
      const hx = 51 + hdx, hy = 30 + hdy;
      for (let i = 0; i <= 17; i++) { const a = (62 + i * 11.5) * Math.PI / 180, r0 = 10, r1 = 15.5 + (i & 1) * 3; P.line(hx + Math.cos(a) * r0, hy - Math.sin(a) * r0, hx + Math.cos(a) * r1, hy - Math.sin(a) * r1, i & 1 ? C.mane2 : C.mane, 1); }
      P.ell(hx, hy, 12.5, 11.5, body, bodyL, bodyD);
      P.ell(hx - 9, hy - 5, 2.6, 2.6, DA_CREAM); P.ell(hx + 11, hy - 8, 2.3, 2.3, DA_CREAM);                                                         // pom-poms
      for (const ex of [hx - 1, hx + 8.5]) { const ey = hy - 3; if (!eye) { P.ell(ex, ey, 3.7, 3.9, DA_CREAM, DA_CREAM, 0xd9d4c8); P.rect(ex + 0.5, ey - 1.5, ex + 2, ey + 1.5, 0x1a1218); P.set(ex + 0.5, ey - 1.5, DA_CREAM); P.line(ex - 3, ey - 4.6, ex + 3.5, ey - 5.2, C.trim, 1); } else { P.line(ex - 3.4, ey + 0.4, ex + 3.4, ey + 0.4, DA_INK, 1); P.line(ex - 3, ey + 1.4, ex - 4, ey + 2.4, DA_INK); P.line(ex + 3, ey + 1.4, ex + 4, ey + 2.4, DA_INK); } }
      P.ell(hx + 9.5, hy + 3, 3.2, 2.7, C.nose); P.set(hx + 8.5, hy + 3.5, DA_INK); P.set(hx + 10.5, hy + 3.5, DA_INK);
      const my = hy + 6.5;
      if (mouth) { P.rect(hx + 1, my, hx + 12, my + 4, 0x7a1a22); for (let x = hx + 2; x <= hx + 11; x += 2) P.rect(x, my, x, my + 1, DA_CREAM); P.rect(hx + 4, my + 3, hx + 9, my + 4, 0xf06a7a); } else { P.line(hx + 1, my, hx + 12, my, 0x5a1a22, 1); P.line(hx + 2, my + 1, hx + 11, my + 1, mixc(body, 0x3a1a2a, 0.5)); }
      const by = my + (mouth ? 5 : 2); for (let x = hx; x <= hx + 12; x += 2) P.line(x, by, x - 1, by + 4 + ((x >> 1) & 1) * 3, C.beard);
      for (let i = 0; i < 7; i++) { P.set(hx + 3 + Math.round(i * 0.55), hy - 12 - i, DA_GOLD); P.set(hx + 4 + Math.round(i * 0.55), hy - 12 - i, mixc(DA_GOLD, 0x3a1a2a, 0.3)); }    // the single horn
      P.ell(hx + 4, hy - 7, 2.2, 2.2, DA_GOLD); P.set(hx + 4, hy - 7, DA_CREAM);                                                                       // mirror on the brow
    } else {
      const hx = 36 + hdx, hy = 24 + hdy;
      for (let i = 0; i <= 26; i++) { const a = (200 + i * 5.8) * Math.PI / 180 - Math.PI * 0.55 * 0, r0 = 10, r1 = 15.5 + (i & 1) * 3, an = (Math.PI * 0.05 + i * (Math.PI * 1.9 / 26)); P.line(hx + Math.cos(an) * r0 * 1.15, hy - Math.sin(an) * r0, hx + Math.cos(an) * r1 * 1.15, hy - Math.sin(an) * r1, i & 1 ? C.mane2 : C.mane, 1); }
      P.ell(hx, hy, 14, 12, C.mane, mixc(C.mane, 0xfff1d6, 0.3), mixc(C.mane, 0x3a1a2a, 0.3));
      for (let y = hy - 10; y < hy + 11; y += 3) for (let x = hx - 12; x <= hx + 12; x += 2) if (P.get(x, y) >= 0 && ((x + y) & 1)) P.set(x, y, C.mane2);
      P.ell(hx - 13, hy - 1, 2.6, 2.6, DA_CREAM); P.ell(hx + 13, hy - 1, 2.6, 2.6, DA_CREAM);
      for (let i = 0; i < 7; i++) { P.set(hx + Math.round(i * 0.3), hy - 11 - i, DA_GOLD); P.set(hx + 1 + Math.round(i * 0.3), hy - 11 - i, mixc(DA_GOLD, 0x3a1a2a, 0.3)); }
      P.ell(36, 43, 17, 11, body, bodyL, bodyD); stripes(36, 43, 17, 11);
      doLegs(); P.ell(36, 43, 17, 11, body, bodyL, bodyD); stripes(36, 43, 17, 11);
      for (let x = 21; x <= 51; x += 3) { P.rect(x, 51, x + 1, 53, C.trim); P.set(x + 1, 54, C.mane2); }
      P.line(36, 40, 36 + tail * 2, 31 - tail * 3, body, 1); tuft(36 + tail * 2, 28 - tail * 3);
    }
    return P.bake(18, 29);
  });
}

// ---------------------------------------------------------------- Ông Địa (big smiling mask, fan) · drum · gong · dragon parts
function ongDia(fan) {
  return memo('OD' + fan, () => {
    const P = paint(20, 29), skin = grade(0xf4cfa6), robe = grade(0xf08a2b), robeD = mixc(robe, 0x3a1a2a, 0.3);
    P.rect(13, 47, 17, 54, 0x3a4a6b); P.rect(22, 47, 26, 54, 0x3a4a6b); P.rect(12, 55, 18, 57, 0x6a4a2a); P.rect(21, 55, 27, 57, 0x6a4a2a);
    P.ell(20, 38, 12.5, 12, robe, mixc(robe, 0xfff1d6, 0.3), robeD); P.ell(20, 41, 8.4, 7.5, skin);                                        // robe + bare pot belly
    P.rect(11, 43, 29, 44, DA_GOLD); P.set(20, 41, mixc(skin, 0x6a3f45, 0.5));
    P.ell(8, 36, 2.4, 6, robe); P.ell(32, 36, 2.4, 6, robe); P.ell(8, 42, 2, 2, skin); P.ell(32, 42, 2, 2, skin);
    P.ell(20, 19, 11, 10, skin, mixc(skin, 0xfff1d6, 0.4), mixc(skin, 0x6a3f45, 0.25));                                                       // oversized head
    P.ell(8.5, 20, 2.4, 3.6, skin); P.ell(31.5, 20, 2.4, 3.6, skin);
    P.ell(11.5, 23, 2.6, 2, 0xf29aa0); P.ell(28.5, 23, 2.6, 2, 0xf29aa0);
    for (const x of [16, 24]) { P.line(x - 2, 17, x, 15.4, DA_INK, 1); P.line(x, 15.4, x + 2, 17, DA_INK, 1); }                              // happy ^ ^ eyes
    P.line(13, 12.5, 18, 12, DA_CREAM, 1); P.line(22, 12, 27, 12.5, DA_CREAM, 1);
    P.ell(20, 21, 2.5, 2, 0xe89a7a);
    P.rect(14, 24, 26, 25, 0x7a1a22); P.rect(15, 26, 25, 28, 0x7a1a22); P.rect(16, 24, 24, 24, DA_CREAM); P.rect(18, 28, 22, 28, 0xf06a7a);   // huge grin
    P.line(13, 23, 14, 25, DA_INK); P.line(27, 23, 26, 25, DA_INK);
    P.ell(10, 9, 2.4, 2.4, DA_CREAM); P.ell(30, 9, 2.4, 2.4, DA_CREAM);
    const fy = fan ? 14 : 26, fx = 36;                                                                                                          // palm-leaf fan
    P.line(32, 36, fx, fy + 6, 0x6a4a2a, 1);
    P.ell(fx, fy, 7.2, 7.2, 0xe8d6a0, 0xf6ecc4, 0xc4aa6a); for (let i = -3; i <= 3; i++) P.line(fx, fy + 5, fx + i * 2.2, fy - 6.5 + Math.abs(i) * 0.9, 0xb89a56);
    return P.bake(10, 28.5);
  });
}
function drumSprite(hit) {
  return memo('DR' + hit, () => {
    const P = paint(18, 19), red = grade(0xc8261c), redD = mixc(red, 0x3a1a2a, 0.35), wood = 0x8a5a32;
    P.line(5, 22, 3, 36, wood, 1); P.line(28, 22, 30, 36, wood, 1); P.line(16, 24, 16, 36, wood, 1);
    P.rect(4, 12 + hit, 28, 27 + hit, red); P.rect(23, 13 + hit, 28, 27 + hit, redD); P.rect(4, 12 + hit, 8, 27 + hit, mixc(red, 0xfff1d6, 0.2));
    for (let x = 6; x <= 26; x += 3) { P.set(x, 14 + hit, DA_GOLD); P.set(x, 25 + hit, DA_GOLD); } P.rect(4, 19 + hit, 28, 19 + hit, DA_GOLD);
    P.ell(16, 12 + hit, 13, 5.2, 0xf2e3b8, 0xfff6dc, 0xd8c690); P.ell(16, 12 + hit, 9, 3.2, 0xf2e3b8, 0xfff6dc, 0xe0cf9a);
    if (hit) { for (const r of [4, 7]) for (let a = 0; a < 6.3; a += 0.5) P.set(16 + Math.cos(a) * r * 1.5, 12 + hit + Math.sin(a) * r * 0.6, 0x8a6a3a); }
    return P.bake(9, 16);
  });
}
function gongSprite(hit) {
  return memo('GG' + hit, () => {
    const P = paint(16, 23), wood = 0x7a4a2a;
    P.rect(3, 6, 4, 42, wood); P.rect(27, 6, 28, 42, wood); P.rect(2, 5, 29, 7, wood); P.rect(1, 41, 6, 43, wood); P.rect(25, 41, 30, 43, wood);
    P.line(9, 8, 9, 14 + hit, 0x8a6a3a); P.line(22, 8, 22, 14 + hit, 0x8a6a3a);
    P.ell(15.5, 25 + hit, 10.5, 10.5, 0xc79a3a, 0xf0d070, 0x8a6020); P.ell(15.5, 25 + hit, 7.5, 7.5, 0xc79a3a, 0xe0b850, 0x9a7428); P.ell(15.5, 25 + hit, 3, 3, 0xe8c870, 0xfff0b0, 0xb88a30);
    if (hit) for (const r of [12.5, 14]) for (let a = 0; a < 6.3; a += 0.35) P.set(15.5 + Math.cos(a) * r, 25 + hit + Math.sin(a) * r, 0xe8c870);
    P.rect(15, 37 + hit, 16, 41, DA_RED);
    return P.bake(8, 21);
  });
}
const DB_R = grade(0xd9281e), DB_RD = mixc(grade(0xd9281e), 0x3a1a2a, 0.35);
function dStamp(kind, size) {   // one body hoop of the dragon; kind 0 red with gold scales, 1 gold band; sizes 0..2 (never scaled: baked per size)
  return memo('DS' + kind + size, () => {
    const r = [6.2, 5, 3.8][size], P = paint(r * 2 + 3, r * 2 + 4), cx = P.W / 2, cy = P.H / 2 + 1, R = r * K, base = kind ? DA_GOLD : DB_R;
    P.ell(cx, cy, R, R * 0.92, base, mixc(base, 0xfff1d6, 0.34), kind ? mixc(DA_GOLD, 0x8a5a20, 0.4) : DB_RD);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = cx - R * 0.45 + i * R * 0.45 + (j ? R * 0.22 : 0), y = cy - R * 0.1 + j * R * 0.42; P.line(x - 1, y, x, y + 1, kind ? DB_R : DA_GOLD); P.set(x + 1, y, kind ? DB_R : DA_GOLD); }
    for (let i = -1; i <= 1; i++) P.line(cx + i * 3, cy - R * 0.9 - 1 + Math.abs(i), cx + i * 3, cy - R * 0.9 - 3 + Math.abs(i) * 1.4, DA_GOLD);
    return P.bake(P.W / K / 2, cy / K);
  });
}
function dHead(view, mouth) {   // view 0 faces the camera, 1 faces away
  return memo('DH' + view + mouth, () => {
    const P = paint(30, 28), gold = DA_GOLD, goldD = mixc(DA_GOLD, 0x8a5a20, 0.4);
    if (view === 0) {
      for (let i = 0; i < 9; i++) P.line(18 - i * 0.6, 22 + i * 1.8 - 6, 4 - i * 0.4, 20 + i * 2.2 - 6, i & 1 ? gold : 0xf08a2b, 1);                  // mane
      for (const [x0, y0, x1, y1] of [[22, 14, 15, 3], [28, 12, 27, 2], [18, 10, 9, 5]]) { P.line(x0, y0, x1, y1, gold, 1); P.line(x1, y1, x1 + 3, y1 - 2, gold); }  // antlers
      P.ell(26, 26, 14, 11.5, DB_R, mixc(DB_R, 0xfff1d6, 0.28), DB_RD);
      P.ell(43, 34, 12, 7.2, DB_R, mixc(DB_R, 0xfff1d6, 0.28), DB_RD);                                                                                  // snout
      P.rect(33, 38, 52, 39, gold);
      if (mouth) { P.ell(42, 43, 10, 4.2, 0x7a1a22, 0x9a2a30, 0x5a1218); for (let x = 36; x <= 50; x += 4) { P.rect(x, 39, x, 41, DA_CREAM); } P.rect(38, 44, 46, 46, 0xf06a7a); } else P.line(34, 41, 52, 41, 0x5a1218, 1);
      P.ell(53, 31, 1.4, 1.4, DA_INK); P.ell(47, 29, 1.2, 1.2, DA_INK);
      P.ell(31, 21, 4.4, 4.4, DA_CREAM, DA_CREAM, 0xd9d4c8); P.ell(32.4, 21.5, 2.2, 2.4, DA_INK); P.line(25, 15.5, 38, 14.5, gold, 1); P.line(26, 16.6, 37, 15.6, goldD);
      for (let i = 0; i < 4; i++) { P.line(48, 40 + i, 56 - i, 48 + i * 2, DA_CREAM); } P.line(36, 46, 33, 53, DA_CREAM); P.line(39, 47, 37, 54, DA_CREAM); P.line(42, 47, 42, 55, DA_CREAM);
      for (let x = 19; x < 34; x += 4) P.set(x, 25 + ((x >> 2) & 1) * 3, gold);
    } else {
      for (let i = 0; i < 15; i++) { const a = Math.PI * (0.05 + i * 0.065) + 0.08; P.line(30 + Math.cos(a + Math.PI) * 14, 24 + Math.sin(a + Math.PI) * 11, 30 + Math.cos(a + Math.PI) * (20 + (i & 1) * 3), 24 + Math.sin(a + Math.PI) * (17 + (i & 1) * 2), i & 1 ? gold : 0xf08a2b, 1); }
      for (const [x0, y0, x1, y1] of [[24, 10, 16, 1], [36, 10, 44, 1]]) { P.line(x0, y0, x1, y1, gold, 1); P.line(x1, y1, x1 + (x1 > 30 ? -3 : 3), y1 - 1, gold); }
      P.ell(30, 26, 15, 12.5, DB_R, mixc(DB_R, 0xfff1d6, 0.28), DB_RD);
      for (let i = 0; i < 4; i++) P.line(30 + i * 3 - 5, 16 + (i & 1), 30 + i * 3 - 5, 14 + (i & 1), gold);
    }
    return P.bake(15, 20);
  });
}
function dTail(fr) {
  return memo('DT' + fr, () => {
    const P = paint(16, 15);
    for (let i = -3; i <= 3; i++) P.line(16, 26, 16 + i * 3.4 + fr * 2, 5 + Math.abs(i) * 1.8, i & 1 ? DA_GOLD : DB_R, 1);
    P.ell(16, 25, 5, 4, DB_R); P.ell(16.5, 18, 3, 6, DA_GOLD);
    return P.bake(8, 13);
  });
}
function pearlSprite() {
  return memo('PRL', () => { const P = paint(10, 12); P.ell(10, 14, 6.4, 6.4, 0xff5a2a, 0xffd070, 0xb8281a); for (let i = 0; i < 4; i++) P.line(10 + (i - 1.5) * 3, 6, 10 + (i - 1.5) * 4.4, 1, 0xffb030, 1); P.ell(8, 12, 1.6, 1.6, 0xfff6c0); return P.bake(5, 8); });
}

// ---------------------------------------------------------------- people
const SPEC_W = () => G.era >= 2 ? [['aodai', 2.8], ['kid', 2.6], ['modern', 2.4], ['fashion', 1.4], ['baba', 1], ['oldlady', 0.8], ['oldman', 0.8], ['youth', 1.4], ['office', 0.8]] : [['aodai', 3.2], ['kid', 2.6], ['baba', 1.5], ['oldlady', 1], ['oldman', 1], ['youth', 1.3], ['office', 0.8], ['dobo', 0.6]];
function plainLook(type, edit) { const L = dressFor(randLook(type), G.season); if (L.type === 'monk') return plainLook(type, edit); L.carry = null; L.ganh = false; L.pack = 0; L.poncho = 0; if (edit) edit(L); return L; }
function personOf(look, x, y, dir, extra) { return Object.assign({ x, y, dir, pose: 0, look, sheet: personSheet(look), alpha: 0, z: 0, bub: null, an: 0, mode: 'watch', mt: rr(0.5, 4), ph: rr(0, 9), cheer: 0, hop: 9, flash: 0, fadeT: rr(0, 1.6), rec: false }, extra); }
const BAND_LOOK = (top, edit) => plainLook(pick(['baba', 'worker', 'dobo']), L => { L.top = top; L.bot = 0x2a2a3a; L.sleeve = 'short'; L.hat = 'band'; L.hs = 0; if (edit) edit(L); });
function buildSpectators(slots, cx, cy, n) {
  const pool = []; for (let i = 0; i < 18; i++) { const ty = i < 5 ? 'kid' : i < 11 ? 'aodai' : wpick(SPEC_W()); const L = plainLook(ty, q => { if (ty === 'aodai') q.top = pick([0xd9281e, 0xf2c94c, 0xe8437a, 0xf08a2b, 0xd9281e, 0x8fc1e3]); }); pool.push({ look: L, sheet: personSheet(L) }); }
  const out = [], use = slots.slice().sort(() => Math.random() - 0.5).slice(0, n);
  for (const s of use) {
    const kidSlot = s.ring === 0, cand = pool.filter(p => !!p.look.kid === kidSlot), q = pick(cand.length ? cand : pool);
    const modes = q.look.kid ? [['cheer', 3], ['clap', 3], ['watch', 1]] : G.era >= 2 ? [['film', 4], ['clap', 3], ['cheer', 2], ['watch', 1.5]] : [['clap', 4], ['cheer', 3], ['film', 1.2], ['watch', 2]];
    const a = personOf(q.look, s.x, s.y, dirOf(cx - s.x, cy - s.y), { sheet: q.sheet, spec: true, modes });
    a.mode = wpick(modes); out.push(a);
  }
  return out;
}
function buildBand(slots, cx, cy) {
  const faceD = (s) => dirOf(cx - s.x, cy - s.y), out = [], props = [];
  const cfg = [['drum', 0xd9281e], ['gong', 0xf2c94c], ['cym', 0xd9281e], ['cym', 0xf2c94c]];
  slots.forEach((s, i) => {
    const d = faceD(s), v = DIRV[d], role = cfg[i][0], a = personOf(BAND_LOOK(cfg[i][1]), s.x, s.y, d, { role, band: true, fadeT: 0.1 * i });
    out.push(a);
    if (role === 'drum') props.push({ k: 'drum', x: s.x + v[0] * 7, y: s.y + v[1] * 7, owner: a, alpha: 0 });
    if (role === 'gong') props.push({ k: 'gong', x: s.x + v[0] * 7, y: s.y + v[1] * 7, owner: a, alpha: 0 });
  });
  return { people: out, props };
}
function buildLion() {
  const Z = DAN.Z.lion, cols = ['red', 'yellow', 'white'].slice(0, G.era === 0 ? 3 : 3);
  DAN.lions = cols.map((c, i) => { const a = (i * 120 + 90) * Math.PI / 180, x = Z.cx + Math.cos(a) * 12, y = Z.cy + Math.sin(a) * 12; return { k: 'lion', col: c, x, y, bx: x, by: y, tx: x, ty: y, dir: dirOf(Z.cx - x, Z.cy - y), z: 0, mode: 'idle', mt: 0, hdx: 0, hdy: 0, eye: 0, mouth: 0, tail: 0, alpha: 0, fadeT: 0.2 * i, jump: 9, greet: 0, bl: rr(1, 3), blink: 0, ph: i * 2.1, rect: null, bar: 0 }; });
  DAN.od = { k: 'od', x: Z.cx, y: Z.cy, dir: 0, z: 0, alpha: 0, ph: 0, fan: 0, hop: 9, fadeT: 0.5 };
  DAN.spec = buildSpectators(Z.slots, Z.cx, Z.cy, 34);
  const b = buildBand(Z.band, Z.cx, Z.cy); DAN.band = b.people; DAN.props = b.props; DAN.S = { x: Z.cx, y: Z.cy };
}
function buildDragon() {
  const Z = DAN.Z.dragon, n = 7, perfs = [];
  for (let i = 0; i < n + 1; i++) { const L = plainLook(pick(['worker', 'dobo', 'baba', 'youth']), q => { q.kid = false; q.top = i === n ? 0xf2c94c : i % 2 ? 0xf2c94c : 0xd9281e; q.bot = i % 2 ? 0xc8261c : 0x2a2a3a; q.sleeve = 'short'; q.hat = 'band'; q.hs = 0; }); perfs.push(personOf(L, Z.cx, Z.cy, 0, { drag: i < n ? i : -1, fadeT: 0.1 * i, pole: true })); }
  DAN.drag = { s: Z.cx * 0 + 120, speed: 20, perfs: perfs.slice(0, n), pearl: perfs[n], mouth: 0, snap: 9, az: [], hx: 0, hy: 0 };
  DAN.spec = buildSpectators(Z.slots, Z.cx, Z.cy, 30);
  const b = buildBand(Z.band, Z.cx, Z.cy); DAN.band = b.people; DAN.props = b.props; DAN.S = { x: Z.cx, y: Z.cy };
  dragonTick(0);
}

// ---------------------------------------------------------------- audio: drums, cymbals and gong (WebAudio, original synthesis) on the street-ambience bus
const audioLive = () => AU.ctx && AU.playing && AU.ctx.state === 'running' && AU.streetOn;
function dbus() {
  if (!AU.ctx) return null; if (DAN.bus && DAN.busCtx === AU.ctx) return DAN.bus;
  const c = AU.ctx, g = c.createGain(), lp = c.createBiquadFilter(); g.gain.value = 0.0001; lp.type = 'lowpass'; lp.frequency.value = 7800; g.connect(lp); lp.connect(AU.str); DAN.bus = g; DAN.busCtx = c; return g;
}
const VOICE = {
  drum(t, v, big) { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(), b = DAN.bus; o.type = 'sine'; o.frequency.setValueAtTime(big ? 175 : 235, t); o.frequency.exponentialRampToValueAtTime(big ? 64 : 90, t + 0.15); env(g, t, 0.004, 0.95 * v, big ? 0.46 : 0.26); o.connect(g); g.connect(b); o.start(t); o.stop(t + 0.7); tone('triangle', big ? 98 : 135, t, 0.002, 0.2 * v, 0.14, b); nz(t, 0.05, 0.4 * v, 'bandpass', 1500, b); },
  rim(t, v) { tone('triangle', 1000, t, 0.001, 0.3 * v, 0.05, DAN.bus, 0, 1.5); nz(t, 0.04, 0.2 * v, 'bandpass', 2900, DAN.bus); },
  cym(t, v, long) { const d = long ? 0.95 : 0.36; nz(t, d, 0.3 * v, 'highpass', 5200, DAN.bus); nz(t, d * 0.6, 0.22 * v, 'bandpass', 3300, DAN.bus); for (const f of [2790, 3730, 5070, 6930]) tone('square', f, t, 0.001, 0.016 * v, d * 0.5, DAN.bus); },
  gong(t, v) { for (const [m, a, d] of [[1, 0.5, 2.5], [1.51, 0.3, 1.9], [2.07, 0.22, 1.4], [2.74, 0.15, 1.0], [3.9, 0.08, 0.7]]) tone('sine', 152 * m, t, 0.006, a * v, d, DAN.bus, m > 1 ? rr(-9, 9) : 0); nz(t, 0.12, 0.25 * v, 'lowpass', 520, DAN.bus); }
};
// patterns of 16 steps: D big drum · d drum · k rim · C cymbal clash · c soft cymbal · G gong ("tùng tùng chát")
const PATS = {
  intro: { dur: 0.2, s: ['DG', '', '', 'd', 'D', '', 'd', '', 'D', '', '', 'd', 'D', 'd', 'D', 'C'] },
  A: { dur: 0.19, s: ['D', '', 'd', '', 'D', '', 'd', '', 'D', '', 'd', '', 'D', 'd', 'D', 'C'] },
  B: { dur: 0.17, s: ['D', 'c', 'dk', 'c', 'D', 'c', 'dk', 'c', 'D', 'dk', 'D', 'dk', 'D', 'd', 'D', 'DC'] },
  C: { dur: 0.135, s: ['DC', 'd', 'd', 'D', 'd', 'd', 'DC', 'd', 'd', 'D', 'd', 'dk', 'DC', 'd', 'D', 'DC'] },
  fin: { dur: 0.15, s: ['d', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'D', '', 'D', '', 'D', 'D', 'D', 'DCG'] }
};
const CYCLE = ['A', 'B', 'B', 'C', 'C', 'B', 'A', 'C'];
DAN.nextPat = () => { if (DAN.bar === 0) return PATS.intro; if (DAN.fin) return PATS.fin; if (!DAN.hold && DAN.timer < 3.1) { DAN.fin = true; return PATS.fin; } return PATS[CYCLE[(DAN.bar - 1) % CYCLE.length]]; };
DAN.doStep = () => {
  if (DAN.step === 0) { DAN.pat = DAN.nextPat(); DAN.stepDur = DAN.pat.dur; DAN.onBar(); }
  const cell = DAN.pat.s[DAN.step], live = audioLive() && dbus(), t = live ? AU.ctx.currentTime + 0.025 : 0; DAN.stats.steps++;
  for (const ch of cell) {
    if (ch === 'D') { DAN.hit.D = 0; DAN.hit.d = 0; if (live) VOICE.drum(t, 1, true); DAN.onBeat(true); }
    else if (ch === 'd') { DAN.hit.d = 0; if (live) VOICE.drum(t, 0.6, false); DAN.onBeat(false); }
    else if (ch === 'k') { DAN.hit.k = 0; if (live) VOICE.rim(t + 0.03, 0.7); }
    else if (ch === 'C') { DAN.hit.c = 0; if (live) VOICE.cym(t, 1, DAN.step === 15); DAN.onClash(); }
    else if (ch === 'c') { DAN.hit.c = 0; if (live) VOICE.cym(t, 0.45, false); }
    else if (ch === 'G') { DAN.hit.g = 0; if (live) VOICE.gong(t, 1); }
    if (live && 'DdkCcG'.includes(ch)) DAN.stats.snd++;
  }
  if (++DAN.step >= 16) { DAN.step = 0; DAN.bar++; DAN.stats.bars++; if (DAN.fin) DAN.finish(); }
};
// distance to the stage sets the loudness (street-ambience volume and mute are applied downstream by AU.str)
DAN.loudness = () => { if (!DAN.S) return 0; const f = SIM.focus, d = Math.hypot(DAN.S.x - f[0], DAN.S.y - f[1]), zf = clamp(1 + 0.1 * R.zoom, 0.7, 1.3); return Math.pow(clamp(1.1 - d / 560, 0.05, 1), 1.5) * zf * DAN.vis; };

// ---------------------------------------------------------------- choreography
DAN.onBar = () => {
  if (DAN.kind !== 'lion') return;
  const taken = [], moves = DAN.fin ? ['bow'] : DAN.bar === 0 ? ['idle'] : ['shake', 'hop', 'bow', 'turn', 'walk', 'hop', 'shake', 'walk'];
  for (const L of DAN.lions) { if (L.greet > 0) continue; let m, guard = 0; do { m = pick(moves); } while (taken.includes(m) && guard++ < 4 && moves.length > 1); taken.push(m); L.mode = m; L.mt = DAN.stepDur * 16; L.bar = 0; if (m === 'walk') { const Z = DAN.Z.lion, a = rr(0, 6.28), r = rr(8, Z.r * 0.8); L.tx = Z.cx + Math.cos(a) * r; L.ty = Z.cy + Math.sin(a) * r; } }
};
DAN.onBeat = big => {
  if (big) {
    for (const L of DAN.lions) if (L.greet <= 0 && (L.mode === 'hop' || L.mode === 'turn') && L.jump > 0.25) { L.jump = 0; if (L.mode === 'turn') L.dir = (L.dir + 1) & 3; }
    if (DAN.od && DAN.od.hop > 0.3) DAN.od.hop = 0; if (DAN.drag) DAN.drag.snap = 0;
    for (const a of DAN.spec) if (a.look.kid && chance(0.55)) a.hop = 0;
  }
};
DAN.onClash = () => { for (const a of DAN.spec) if (a.alpha > 0.8 && (a.mode === 'cheer' || a.mode === 'clap') && chance(0.4)) { a.cheer = rr(0.5, 1.1); if (!a.bub && chance(0.1)) a.bub = { k: pick(['heart', 'star', 'laugh', 'ex', 'smile']), t: 1.8, a: 0 }; } };
DAN.greet = L => { DAN.stats.greets++; L.greet = 3.4; L.gt = 0; L.dir = L.dir === 0 || L.dir === 3 ? 0 : 1; L.mode = 'greet'; L.jump = 0; DAN.hit.D = 0; DAN.hit.d = 0; DAN.hit.c = 0; if (audioLive() && dbus()) { const t = AU.ctx.currentTime + 0.02; VOICE.drum(t, 1, true); VOICE.cym(t + 0.12, 0.9, false); } };
function lionTick(L, dt) {
  if (L.fadeT > 0) { L.fadeT -= dt; } else L.alpha = clamp(L.alpha + (DAN.phase === 'out' ? -dt : dt) / 1.4, 0, 1);
  L.jump += dt; L.mt -= dt; L.bar += dt; L.blink -= dt; L.bl -= dt; if (L.bl <= 0) { L.bl = rr(1.4, 3.6); L.blink = 0.16; }
  const t = DAN.t + L.ph; let hdx = 0, hdy = 0, mouth = 0, z = 0, eye = L.blink > 0 ? 1 : 0, tail = ((t * 3) | 0) & 1;
  const jz = L.jump < 0.3 ? Math.sin(L.jump / 0.3 * Math.PI) * 6.5 : 0;
  if (L.greet > 0) { L.greet -= dt; L.gt += dt; const p = clamp(L.gt / 3.4, 0, 1); hdy = Math.round(6 * Math.sin(clamp((L.gt - 0.7) / 1.6, 0, 1) * Math.PI)); eye = (L.gt < 2.4 && (((L.gt * 4) | 0) & 1)) ? 1 : eye; mouth = L.gt > 0.5 && L.gt < 2.4 && (((L.gt * 3) | 0) & 1) ? 1 : 0; z = jz; if (L.greet <= 0) L.mode = 'idle'; }
  else if (L.mode === 'shake') { hdx = [-3, 0, 3, 0][((t * 6) | 0) & 3]; mouth = ((t * 3.5) | 0) & 1; hdy = ((t * 6) | 0) & 1; }
  else if (L.mode === 'hop' || L.mode === 'turn') { z = jz; mouth = L.jump < 0.22 ? 1 : 0; hdy = L.jump < 0.3 ? -1 : 0; hdx = L.mode === 'turn' ? 0 : [-2, 0, 2, 0][((t * 3) | 0) & 3]; }
  else if (L.mode === 'bow') { const p = clamp(L.bar / (DAN.stepDur * 16), 0, 1); hdy = Math.round(6 * Math.sin(p * Math.PI)); eye = p > 0.3 && p < 0.7 ? 1 : eye; }
  else if (L.mode === 'walk') { const dx = L.tx - L.x, dy = L.ty - L.y, d = Math.hypot(dx, dy); if (d > 1.5) { L.x += dx / d * 15 * dt; L.y += dy / d * 15 * dt; L.dir = dirOf(dx, dy); z = Math.abs(Math.sin(t * 9)) * 1.6; hdx = [-1, 0, 1, 0][((t * 4.5) | 0) & 3]; } mouth = ((t * 2) | 0) & 1; }
  else { hdx = [-1, 0, 1, 0][((t * 1.4) | 0) & 3]; }
  L.hdx = hdx; L.hdy = hdy; L.mouth = mouth; L.eye = eye; L.tail = tail; L.z = z;
}
function dragonTick(dt) {
  const Dg = DAN.drag, Z = DAN.Z.dragon, n = Dg.perfs.length, sp = 11;
  Dg.s += Dg.speed * (1 + 0.12 * Math.sin(DAN.t * 0.7)) * dt; Dg.snap += dt; Dg.mouth = Dg.snap < 0.2 || (((DAN.t * 1.6) | 0) & 1) ? 1 : 0;
  const wave = (i) => Math.sin(DAN.t * 5.4 - i * 0.95);
  Dg.perfs.forEach((p, i) => {
    const q = pathPos(Dg.s - i * sp - 14); p.x = q[0]; p.y = q[1]; p.dir = dirOf(q[2], q[3]); p.pose = 6;
    const stride = (Dg.s - i * sp) / 9; p.z = Math.abs(Math.sin(stride * Math.PI)) * 1.4; p.az = 33 + wave(i) * 4.6 + p.z;
    if (p.fadeT > 0) p.fadeT -= dt; else p.alpha = clamp(p.alpha + (DAN.phase === 'out' ? -dt : dt) / 1.4, 0, 1);
  });
  const hq = pathPos(Dg.s - 14), pq = pathPos(Dg.s + 11), pe = Dg.pearl;
  Dg.hx = hq[0] + hq[2] * 0; Dg.hy = hq[1]; Dg.hdir = dirOf(hq[2], hq[3]);
  pe.x = pq[0]; pe.y = pq[1]; pe.dir = dirOf(pq[2], pq[3]); pe.pose = 6; pe.z = Math.abs(Math.sin(Dg.s / 9 * Math.PI)) * 1.4; pe.az = 36 + Math.sin(DAN.t * 4) * 2.2;
  if (pe.fadeT > 0) pe.fadeT -= dt; else pe.alpha = clamp(pe.alpha + (DAN.phase === 'out' ? -dt : dt) / 1.4, 0, 1);
}
function specTick(a, dt) {
  if (a.fadeT > 0) { a.fadeT -= dt; a.alpha = 0; return; }
  a.alpha = clamp(a.alpha + (DAN.phase === 'out' ? -dt * 1.3 : dt * 1.1), 0, 1);
  a.mt -= dt; if (a.mt <= 0) { a.mt = rr(3.5, 9); a.mode = wpick(a.modes); }
  a.hop += dt; a.z = a.hop < 0.26 ? Math.sin(a.hop / 0.26 * Math.PI) * 3 : 0;
  if (a.cheer > 0) { a.cheer -= dt; a.pose = 6; }
  else if (a.mode === 'clap') a.pose = ((DAN.t * 5 + a.ph) | 0) & 1 ? 7 : 0;
  else if (a.mode === 'cheer') a.pose = ((DAN.t * 0.9 + a.ph) | 0) % 3 === 0 ? 6 : 0;
  else if (a.mode === 'film') a.pose = 6;
  else a.pose = ((DAN.t * 0.7 + a.ph) | 0) & 1 ? 7 : 0;
  a.rec = a.mode === 'film' && a.cheer <= 0; if (a.rec && G.era <= 1) { a.flash -= dt; if (a.flash < -rr(2.2, 6)) a.flash = 0.14; }
  if (a.bub) { a.bub.t -= dt; a.bub.a += dt; if (a.bub.t <= 0) a.bub = null; }
}
DAN.tick = dt => {
  if (!G.tet || !DAN.Z) return;
  if (G.busy) return;
  DAN.t += dt; for (const k in DAN.hit) DAN.hit[k] += dt;
  if (DAN.phase === 'rest') { DAN.timer -= dt; if (DAN.timer <= 0) DAN.start(DAN.nextKind); return; }
  if (DAN.phase === 'run') { DAN.timer -= dt; DAN.vis = Math.min(1, DAN.vis + dt / 1.4); DAN.stepT += dt; let g = 0; while (DAN.stepT >= DAN.stepDur && g++ < 6) { DAN.stepT -= DAN.stepDur; DAN.doStep(); } }
  else { DAN.vis = Math.max(0, DAN.vis - dt / 1.4); if (DAN.vis <= 0) { DAN.end(); return; } }
  if (DAN.kind === 'lion') { for (const L of DAN.lions) lionTick(L, dt); const o = DAN.od; if (o.fadeT > 0) o.fadeT -= dt; else o.alpha = clamp(o.alpha + (DAN.phase === 'out' ? -dt : dt) / 1.4, 0, 1); o.hop += dt; o.z = o.hop < 0.28 ? Math.sin(o.hop / 0.28 * Math.PI) * 3.4 : 0; o.ph += dt; o.fan = ((o.ph * 4) | 0) & 1; const Z = DAN.Z.lion; o.x = Z.cx + Math.sin(o.ph * 0.6) * 9; o.y = Z.cy + Math.cos(o.ph * 0.45) * 7; o.dir = Math.cos(o.ph * 0.6) > 0 ? 0 : 1; }
  else dragonTick(dt);
  for (const a of DAN.spec) specTick(a, dt);
  for (const a of DAN.band) {
    if (a.fadeT > 0) a.fadeT -= dt; else a.alpha = clamp(a.alpha + (DAN.phase === 'out' ? -dt : dt) / 1.2, 0, 1);
    a.pose = a.role === 'drum' ? (DAN.hit.d < 0.09 ? 6 : 0) : a.role === 'gong' ? (DAN.hit.g < 0.16 ? 6 : 0) : (DAN.hit.c < 0.2 ? 6 : 0);
  }
  for (const p of DAN.props) p.alpha = p.owner.alpha;
  const live = audioLive() && dbus(); if (live) { DAN.vol = DAN.loudness(); DAN.bus.gain.setTargetAtTime(DAN.vol * 0.85 + 0.0001, AU.ctx.currentTime, 0.12); }
  // keep a camera-distance reading even without audio, for tests
  DAN.vol = DAN.loudness();
};
DAN.start = kind => {
  DAN.kind = kind; DAN.phase = 'run'; DAN.vis = 0; DAN.fin = false; DAN.step = 0; DAN.stepT = 0; DAN.bar = 0; DAN.timer = DAN.hold ? 1e9 : rr(32, 58); DAN.stats.runs++;
  if (kind === 'lion') buildLion(); else buildDragon();
  ticker(kind === 'lion' ? 'Múa lân rộn ràng trong công viên: tùng tùng chát!' : 'Đoàn múa rồng uốn lượn quanh công viên');
};
DAN.finish = () => { if (DAN.phase !== 'run') return; DAN.phase = 'out'; };
DAN.end = () => { DAN.phase = 'rest'; DAN.vis = 0; DAN.clear(); DAN.nextKind = DAN.kind === 'lion' ? 'dragon' : 'lion'; DAN.timer = rr(14, 24); if (DAN.bus && AU.ctx) DAN.bus.gain.setTargetAtTime(0.0001, AU.ctx.currentTime, 0.1); };
DAN.clear = () => { DAN.lions = []; DAN.od = null; DAN.spec = []; DAN.band = []; DAN.props = []; DAN.drag = null; DAN.S = null; };
// called whenever Tết switches on / off, and when the era or season changes (looks are rebuilt on the next start)
DAN.sync = () => {
  DAN.clear(); DAN.phase = 'rest'; DAN.vis = 0; DAN.kind = null; DAN.fin = false;
  if (DAN.bus && AU.ctx) DAN.bus.gain.setTargetAtTime(0.0001, AU.ctx.currentTime, 0.05);
  if (!G.tet || !DAN.Z) return;
  const f = new URLSearchParams(location.search).get('dance'); DAN.hold = f === 'lion' || f === 'dragon' ? f : null;
  DAN.nextKind = DAN.hold || DAN.nextKind || 'lion'; DAN.timer = DAN.hold ? 0.05 : 3.5;
};

// ---------------------------------------------------------------- drawing (called from main.js)
const blitA = (g, s, px, py, mirror, a) => {
  if (a < 1) g.globalAlpha = a;
  if (mirror) { g.save(); g.translate(px, 0); g.scale(-1, 1); g.drawImage(s.c, -s.ax, py - s.ay, s.w, s.h); g.restore(); } else g.drawImage(s.c, px - s.ax, py - s.ay, s.w, s.h);
  if (a < 1) g.globalAlpha = 1;
};
const blitE = (lg, s, px, py, mirror) => { if (mirror) { lg.save(); lg.translate(px, 0); lg.scale(-1, 1); lg.drawImage(s.e, -s.ax, py - s.ay, s.w, s.h); lg.restore(); } else lg.drawImage(s.e, px - s.ax, py - s.ay, s.w, s.h); };
const DAN_ON = () => G.tet && DAN.phase !== 'rest';
DAN.pushDyn = (dyn, shadow) => {
  if (!DAN_ON()) return;
  const on = (o, m) => G.onScreen(o.x, o.y, m || 36);
  for (const L of DAN.lions) if (on(L)) { if (L.alpha > 0.4) { shadow(L.x - 5, L.y - 3); shadow(L.x + 5, L.y + 3); shadow(L.x, L.y); } dyn.push({ key: L.x + L.y, dan: L }); }
  if (DAN.od && on(DAN.od)) { if (DAN.od.alpha > 0.4) shadow(DAN.od.x, DAN.od.y); dyn.push({ key: DAN.od.x + DAN.od.y, dan: DAN.od }); }
  for (const a of DAN.spec.concat(DAN.band)) if (a.alpha > 0.02 && on(a)) { if (a.alpha > 0.5) shadow(a.x, a.y); dyn.push({ key: a.x + a.y, dan: a }); }
  for (const p of DAN.props) if (p.alpha > 0.02 && on(p)) dyn.push({ key: p.x + p.y + 1.5, dan: p });
  const Dg = DAN.drag; if (Dg) {
    Dg.perfs.forEach((p, i) => { if (!on(p, 60)) return; if (p.alpha > 0.5) shadow(p.x, p.y); dyn.push({ key: p.x + p.y, dan: p }); });
    if (on(Dg.pearl, 40)) { if (Dg.pearl.alpha > 0.5) shadow(Dg.pearl.x, Dg.pearl.y); dyn.push({ key: Dg.pearl.x + Dg.pearl.y, dan: Dg.pearl }); }
    const h = Dg.perfs[0]; if (h && on(h, 60)) dyn.push({ key: h.x + h.y + 10, dan: { k: 'dhead', d: Dg, p: h } });
  }
};
DAN.draw = (g, lg, useL, o, bubbles) => {
  if (o.k === 'lion') {
    const s = scn(o.x, o.y, 0), view = o.dir < 2 ? 0 : 1, mir = o.dir === 1 || o.dir === 2, sp = lionSprite(o.col, view, o.eye, o.mouth, o.hdx, o.hdy, o.tail), y = s[1] - o.z;
    blitA(g, sp, s[0], y, mir, o.alpha); if (useL && o.alpha > 0.5) blitE(lg, sp, s[0], y, mir);
    o.rect = [s[0] - 18, y - sp.ay, s[0] + 18, y - sp.ay + sp.h]; o.sx = s[0]; o.sy = y;
  } else if (o.k === 'od') {
    const s = scn(o.x, o.y, 0), sp = ongDia(o.fan), y = s[1] - o.z; blitA(g, sp, s[0], y, o.dir === 1, o.alpha); if (useL && o.alpha > 0.5) blitE(lg, sp, s[0], y, o.dir === 1);
  } else if (o.k === 'drum' || o.k === 'gong') {
    const s = scn(o.x, o.y, 0), sp = o.k === 'drum' ? drumSprite(DAN.hit.d < 0.1 ? 1 : 0) : gongSprite(DAN.hit.g < 0.35 ? 1 : 0); blitA(g, sp, s[0], s[1], false, o.alpha); if (useL && o.alpha > 0.5) blitE(lg, sp, s[0], s[1], false);
  } else if (o.k === 'dhead') {
    const p = o.p, Dg = o.d, s = scn(p.x, p.y, p.az + 2 + (Dg.snap < 0.15 ? -1.5 : 0)), view = Dg.hdir < 2 ? 0 : 1, mir = Dg.hdir === 1 || Dg.hdir === 2, sp = dHead(view, Dg.mouth);
    blitA(g, sp, s[0] + (mir ? -3 : 3), s[1], mir, p.alpha); if (useL && p.alpha > 0.5) blitE(lg, sp, s[0] + (mir ? -3 : 3), s[1], mir);
  } else dPerson(g, lg, useL, o, bubbles);
};
function dPerson(g, lg, useL, o, bubbles) {
  const s = scn(o.x, o.y, 0), row = DIR_ROW[o.dir], x = s[0] - PW / 2, y = s[1] - PFOOT - (o.z || 0), a = o.alpha, kid = o.look.kid;
  if (a < 0.02) return;
  if (o.pole && o.az) {                                                         // dragon pole: from the raised hand up to the dragon's body, then the tube to the next performer
    const Dg = DAN.drag, i = o.drag, side = row >= 2 ? -1 : 1, hx = s[0] + side * 3.2, hy = y + 8; g.globalAlpha = a; g.fillStyle = '#7a5a34'; const top = scn(o.x, o.y, o.az)[1]; g.fillRect(hx - 0.25, top, 0.75, hy - top);
    g.globalAlpha = 1;
  }
  if (a < 1) g.globalAlpha = a;
  g.drawImage(o.sheet.c, o.pose * PW * K, row * PH * K, PW * K, PH * K, x, y, PW, PH);
  if (a < 1) g.globalAlpha = 1;
  if (useL && a > 0.5) lg.drawImage(o.sheet.e, o.pose * PW * K, row * PH * K, PW * K, PH * K, x, y, PW, PH);
  const side = row >= 2 ? -1 : 1, hx = x + PW / 2 + side * 3.4, hy = y + (kid ? 12 : 7.8);
  if (o.rec && a > 0.5) {
    if (G.era >= 2) { g.fillStyle = '#2a2428'; g.fillRect(hx - 1, hy - 4, 2, 3.5); g.fillStyle = '#9fd8ff'; g.fillRect(hx - 0.5, hy - 3.5, 1, 2.5); if (((DAN.t * 1.6 + o.ph) | 0) & 1) { g.fillStyle = '#ff3a3a'; g.fillRect(hx - 0.5, hy - 5, 1, 0.5); } if (useL) { lg.globalAlpha = 0.5; lg.drawImage(tglow(0x9fd8ff, 0), hx - 5, hy - 8, 10, 10); lg.globalAlpha = 1; } }
    else { g.fillStyle = '#2a2428'; g.fillRect(hx - 1.5, hy - 3.5, 3, 2.5); g.fillStyle = '#9aa4b0'; g.fillRect(hx - 0.5, hy - 3, 1, 1); if (o.flash > 0) { g.fillStyle = '#fffbe8'; g.fillRect(hx - 2.5, hy - 5, 5, 0.5); g.fillRect(hx - 0.5, hy - 7, 1, 4); if (useL) { lg.globalAlpha = 0.7; lg.drawImage(tglow(0xffffe0, 0), hx - 9, hy - 12, 18, 18); lg.globalAlpha = 1; } } }
  }
  if (o.band && a > 0.5) {
    if (o.role === 'cym') { const c = DAN.hit.c < 0.12; g.fillStyle = '#e8b830'; if (c) { g.fillRect(x + PW / 2 - 2.5, y + 4, 5, 1); g.fillStyle = '#fffbe8'; g.fillRect(x + PW / 2 - 0.5, y + 1.5, 1, 2); g.fillRect(x + PW / 2 - 2, y + 2.5, 4, 0.5); } else { g.fillRect(x + PW / 2 - 6, y + 14, 3, 1); g.fillRect(x + PW / 2 + 3, y + 14, 3, 1); g.fillStyle = '#b88a20'; g.fillRect(x + PW / 2 - 6, y + 15, 3, 0.5); g.fillRect(x + PW / 2 + 3, y + 15, 3, 0.5); } }
  }
  if (o.k === undefined && o === DAN.drag?.pearl) { const sp = pearlSprite(), ps = scn(o.x, o.y, o.az); blitA(g, sp, ps[0], ps[1], false, a); if (useL) { lg.globalAlpha = 0.65 * a; lg.drawImage(tglow(0xff7a30, 0), ps[0] - 14, ps[1] - 20, 28, 28); lg.globalAlpha = 1; } const top = ps[1]; g.fillStyle = '#7a5a34'; g.globalAlpha = a; g.fillRect(hx - 0.25, top + 3, 0.75, hy - top - 3); g.globalAlpha = 1; }
  if (o.drag !== undefined && o.drag >= 0 && o.pole) dTube(g, lg, useL, o);
  if (o.bub) bubbles.push([BUB[o.bub.k], s[0] - 3, y + (kid ? PHEAD + 4 : PHEAD) - 13]);
}
// one hoop-chain of the dragon: from this performer's pole top to the next one (the last one ends in the tail fan); taper toward the tail
function dTube(g, lg, useL, o) {
  const Dg = DAN.drag, i = o.drag, n = Dg.perfs.length, A = scn(o.x, o.y, o.az), nx = Dg.perfs[i + 1], last = !nx, B = nx ? scn(nx.x, nx.y, nx.az) : null, size = i < 3 ? 0 : i < 5 ? 1 : 2, a = o.alpha;
  if (B) { const d = Math.hypot(B[0] - A[0], B[1] - A[1]), cnt = Math.max(2, Math.ceil(d / 2.4)); for (let k = 0; k < cnt; k++) { const u = k / cnt, sp = dStamp((i * 3 + k) % 4 === 3 ? 1 : 0, size); blitA(g, sp, Math.round(A[0] + (B[0] - A[0]) * u), Math.round(A[1] + (B[1] - A[1]) * u), false, a); } }
  else { const sp = dStamp(0, 2); blitA(g, sp, A[0], A[1], false, a); blitA(g, dTail(((DAN.t * 4) | 0) & 1 ? 1 : -1), A[0] + (o.dir === 1 || o.dir === 2 ? 3 : -3), A[1] - 1, false, a); }
}
// small helper used by tests / the click handler
DAN.all = () => [].concat(DAN.lions, DAN.od ? [DAN.od] : [], DAN.spec, DAN.band, DAN.drag ? DAN.drag.perfs.concat([DAN.drag.pearl]) : []);
DAN.click = (cx, cy) => {
  if (!DAN_ON() || !DAN.S) return false;
  const rc = R.canvas.getBoundingClientRect(), px = (cx - rc.left) / rc.width * R.vw, py = (cy - rc.top) / rc.height * R.vh;
  for (const L of DAN.lions) if (L.alpha > 0.5 && L.rect && px >= L.rect[0] && px <= L.rect[2] && py >= L.rect[1] && py <= L.rect[3]) { DAN.greet(L); ticker('Con lân quay lại chào bạn, chớp mắt và cúi đầu!', true); return true; }
  const u = px - R.cx, v = py - R.cy, wx = v + u / 2, wy = v - u / 2, Z = DAN.kind === 'lion' ? DAN.Z.lion : DAN.Z.dragon, rad = DAN.kind === 'lion' ? 7 * T : DAN.Z.dragon.rx + 2.5 * T;
  let hit = Math.hypot(wx - Z.cx, wy - Z.cy) < rad; if (!hit && DAN.drag) for (const p of DAN.drag.perfs) if (Math.hypot(wx - p.x, wy - p.y) < 14) hit = true;
  if (!hit) return false;
  R.tween = { px: Z.cx - Z.cy, py: (Z.cx + Z.cy) / 2 - WORLD / 2 }; ticker(DAN.kind === 'lion' ? 'Máy quay bay tới sân múa lân' : 'Máy quay bay tới sân múa rồng', true); return true;
};
