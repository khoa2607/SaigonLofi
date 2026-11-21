'use strict';
// ===== Tây Du Ký v2 — Cao Lão Trang: terrain art + painted farm props (loaded after tw-art.js; plugs into TWA.clt) =====
// Palette: warm village greens with meadow flowers, flooded paddies mirroring the sky between green seedling rows, ripe golden rice, tilled brown soil with sprouts, packed-dirt roads with cart ruts, grey flagstones with moss,
// dry bamboo litter, the mossy hill rock of the knolls, dark pen mud; clear green-blue stream water with lily pads. Faces: fieldstone retaining walls under the terraces, grassy earth banks with roots under the hills.
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const GRS = ramp(['#2c5a24', '#3a7430', '#4e8e38', '#6aa842', '#8cc450', '#b0dc66']);
  const PAD = ramp(['#3c6a5a', '#4e8a76', '#6aa48c', '#8cc4a8', '#b4dcc4', '#e0f2e4']);
  const RIC = ramp(['#86661a', '#a88422', '#c49c2c', '#d8b438', '#e8cc4e', '#f6e47e']);
  const SOI = ramp(['#3a2a1c', '#53392a', '#6e4c34', '#8a6444', '#a8805a']);
  const PTH = ramp(['#8a6e48', '#a88a5c', '#c4a672', '#d8c08a', '#ecd8a8']);
  const FLG = ramp(['#6a6258', '#8a8274', '#a8a08c', '#c4bca4', '#dcd4ba', '#f0e8d0']);
  const BAM = ramp(['#4a5a1c', '#667a26', '#88983a', '#b0b44e', '#d4cc6a']);
  const HIL = ramp(['#4a4a3a', '#64604c', '#807a60', '#9c9478', '#b8b092']);
  const MUD = ramp(['#2c2018', '#443022', '#5e4430', '#7a5c40']);
  const WTR = ramp(['#1c5c70', '#2c8296', '#48a8b0', '#7acaca', '#b0e6e0', '#eefcf8']);
  const STN = ramp(['#58503e', '#746a54', '#948a70', '#b0a68a', '#ccc2a4']);
  const EAR = ramp(['#3c2a1c', '#5a3e28', '#7a5836', '#9a7448', '#b8905c']);
  const STAIR = ramp(['#9c9078', '#b8ac90', '#d0c4a6', '#e6dcc0', '#f6eed6']);
  const INK = [34, 26, 20], shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fbm = (I, J, s) => vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15;
  const isW = m => m === M.STREAM || m === M.POOL;
  function water(m, I, J, X, Y, k, SH, d) {
    SH.water = 2; const f = fbm(I * 1.2, J * 0.7, 1830), st = vnoise(I * 2.4, J * 0.6, 1831), br = Math.max(0, st - 0.68) * 2.3;
    let c = tone(WTR, 0.8 + f * 2.8 + (d ? 0.2 : 0)); if (br > 0.1) c = mix(c, [236, 252, 250], clamp(br * 0.55, 0, 0.6));
    if (m === M.POOL) { const lily = vnoise(I * 1.5 + 5, J * 1.5, 1832); if (lily > 0.77) c = mix(c, [240, 160, 190], 0.6); else if (lily > 0.64) c = mix(c, [70, 150, 70], 0.65); }
    if (hash2(X, Y, 1833) < 0.011) c = [255, 255, 255]; return c;
  }
  function top(m, I, J, X, Y, k, d, SH) {
    if (isW(m)) return water(m, I, J, X, Y, k, SH, d);
    const n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), lit = fbm(I - 0.13, J - 0.13, 1840) - fbm(I + 0.13, J + 0.13, 1840), t = (window.TWR ? TWR.t : 0);
    if (m === M.CGRASS) { let c = tone(GRS, 1.0 + fbm(I, J, 1841) * 3 + lit * 4.2 + (d ? 0.2 : 0)); if (n1 > 0.76 && hp < 0.55) c = mix(c, [226, 206, 96], 0.4); const fl = vnoise(I * 3.1, J * 3.1, 1842); if (fl > 0.8 && hp < 0.5) c = hp < 0.18 ? [250, 246, 230] : hp < 0.3 ? [248, 190, 70] : [240, 130, 150]; else if (hp > 0.985) c = GRS[5]; return c; }
    if (m === M.CPADDY) { const row = (J * 2.2) % 1, col = (I * 2.2) % 1; const bund = (I % 1) < 0.07 || (J % 1) < 0.07; if (bund) return tone(SOI, 2.2 + n0); SH.water = 1; let c = tone(PAD, 2.1 + fbm(I * 1.2, J * 0.8, 1843) * 2.2 + lit * 2 + (d ? 0.2 : 0)); const sd = ((Math.floor(I * 2.2) + Math.floor(J * 2.2)) % 2 === 0) && row > 0.2 && row < 0.8 && col > 0.2 && col < 0.8; if (sd && n1 > 0.2) c = hp < 0.5 ? GRS[3] : GRS[4]; if (hash2(X, Y, 1844) < 0.015) c = PAD[5]; return c; }
    if (m === M.CRICE) { const bund = (I % 1) < 0.06 || (J % 1) < 0.06; if (bund) return tone(SOI, 2.4 + n0); const w = Math.sin(I * 1.8 + J * 0.9 + t * 1.6) * 0.5 + 0.5, rows = Math.abs((J * 3.4) % 1 - 0.5); let c = tone(RIC, 1.4 + fbm(I, J, 1845) * 2.8 + lit * 3 + rows * 1.1 + w * 0.6 + (d ? 0.2 : 0)); if (vnoise(I * 0.8, J * 0.8, 1846) > 0.7) c = mix(c, [168, 176, 70], 0.45); if (hp > 0.96) c = RIC[5]; else if (hp < 0.03) c = RIC[0]; return c; }
    if (m === M.CSOIL) { const row = Math.abs(((I * 1.3 + J * 1.3) % 1) - 0.5); let c = tone(SOI, 1.4 + n0 * 1.4 + lit * 3 + row * 2.4 + (d ? 0.2 : 0)); if (row < 0.12 && n1 > 0.3 && hp < 0.55) c = hp < 0.25 ? GRS[4] : GRS[3]; return c; }
    if (m === M.CPATH) { const rut = Math.abs(((I - J) * 0.5 + 0.3) % 1 - 0.5) < 0.05; let c = tone(PTH, 1.8 + fbm(I, J, 1846) * 2.2 + lit * 3 + (d ? 0.2 : 0)); if (rut) c = shade(c, 0.86); if (hp > 0.975) c = PTH[4]; else if (hp < 0.03) c = SOI[3]; else if (n1 > 0.8 && hp < 0.4) c = mix(c, GRS[2], 0.45); return c; }
    if (m === M.CFLAG) { const u = I * 0.95, v = J * 0.95, row = Math.floor(v), seam = ((u + (row & 1) * 0.5) % 1) < 0.07 || (v % 1) < 0.07; let c = tone(FLG, (seam ? 0.7 : 2.4) + n0 * 1.1 + lit * 3 + hash2(Math.floor(u + (row & 1) * 0.5), row, 1847) * 0.9 + (d ? 0.2 : 0)); if (n1 > 0.8 && !seam) c = mix(c, GRS[2], 0.4); return c; }
    if (m === M.CBAMB) { let c = tone(BAM, 0.9 + fbm(I, J, 1848) * 2.8 + lit * 4 + (d ? 0.2 : 0)); if (hp < 0.05) c = mix(c, GRS[1], 0.5); else if (hp > 0.97) c = BAM[4]; return c; }
    if (m === M.CHILL) { let c = tone(HIL, 1.0 + fbm(I, J, 1849) * 3 + lit * 5 + (d ? 0.2 : 0)); if (n1 > 0.7) c = mix(c, GRS[2], 0.55); return c; }
    if (m === M.CMUD) { let c = tone(MUD, 0.6 + fbm(I * 1.4, J * 1.4, 1850) * 2.6 + lit * 3); if (vnoise(I * 2, J * 2, 1851) > 0.72) { c = mix(c, WTR[2], 0.5); SH.water = 1; } return c; }
    return tone(GRS, 2);
  }
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const m = TWM.MAT[k]; if (ry === drop - 1) return INK;
    if (isW(m)) { const streak = vnoise(gx * 1.6, elev * 0.04 - (window.TWR ? TWR.t * 1.2 : 0), 1860); if (ry < 2) return WTR[5]; let c = tone(WTR, 1.6 + (streak > 0.6 ? 1.8 : 0) + (side ? -0.4 : 0)); if (streak > 0.78) c = mix(c, [240, 252, 255], 0.6); return c; }
    const wall = m === M.CFLAG || m === M.CPATH;
    if (wall) { const row = Math.floor(elev / 6), off = (row & 1) * 7, seam = ((gx + off) % 14) < 1 || (elev % 6) === 0; let t = (side ? 1.2 : 2.3) + hash2(row, Math.floor((gx + off) / 14), 1861) * 1.2 - (ry / drop) * 0.6; if (seam) t -= 0.9; let c = tone(STN, t); if (ry < 2) c = shade(c, 1.1); if (vnoise(gx * 0.3, elev * 0.2, 1862) > 0.72 && ry > drop * 0.4) c = mix(c, GRS[1], 0.5); return c; }
    // grassy earth bank: a green lip on top, brown earth with pebbles and roots, tufts at the foot
    const top = ry < 2 + Math.floor(hash2(gx, 3, 1863) * 2.5); if (top) return tone(GRS, 1.4 + (side ? -0.3 : 0.6) + hash2(gx, ry, 1864) * 1.2); let t = (side ? 1.0 : 2.0) + hash2(Math.floor(gx / 3), Math.floor(elev / 4), 1865) * 1.3 - (ry / drop) * 0.7 + (vnoise(gx * 0.2, elev * 0.1, 1866) - 0.5) * 1.2;
    let c = tone(EAR, t); if (hash2(gx, elev, 1867) < 0.05) c = tone(STN, 2.4); if (ry > drop - 4 && hash2(gx, ry, 1868) < 0.4) c = tone(GRS, 1.2 + hash2(gx, 9, 1869) * 1.4); return c;
  }
  const edge = c => mix(c, [190, 214, 110], 0.38);
  const seamTone = (I, J, n0, n1) => tone(GRS, 1.6 + n0 * 1.4 + n1 * 0.6);
  // ---------------------------------------------------------------- painted farm props (canvases, built once)
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const OL = '#2a1e14';
  function hay(v) { const w = 36, h = 36, c = cv(w, h), g = c.getContext('2d'), th = [['#c8a22c', '#e0be44', '#f2d868'], ['#b8921e', '#d4ae36', '#ecca58'], ['#d0aa34', '#e8c84e', '#fae27a']][v % 3]; R(g, 3, 29, 30, 5, 'rgba(40,28,16,0.35)'); for (let y = 0; y < 30; y++) { const u = y / 29, half = Math.round(15 * Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, u * 1.08), 2)))) + (y > 22 ? 1 : 0); if (half <= 0) continue; R(g, 18 - half - 1, 3 + y, half * 2 + 2, 1, OL); for (let x = -half; x < half; x++) { const k = (x * 7 + y * 3 + v * 5) % 9; R(g, 18 + x, 3 + y, 1, 1, k < 2 ? th[0] : k < 6 ? th[1] : th[2]); } } for (let q = 0; q < 6; q++) R(g, 8 + q * 4, 10 + (q % 3) * 6, 1, 7, th[0]); R(g, 17, 1, 2, 4, '#9a7a1c'); R(g, 14, 2, 8, 2, th[1]); R(g, 6, 31, 24, 3, '#6e4c34'); R(g, 6, 31, 24, 1, '#a07a4a'); return { w, h, c, py: h - 4 }; }
  function scare(v) { const w = 28, h = 40, c = cv(w, h), g = c.getContext('2d'); R(g, 13, 14, 3, 25, '#6e4c34'); R(g, 4, 18, 21, 3, '#6e4c34'); R(g, 8, 20, 13, 12, '#7a5a8a'); R(g, 9, 21, 11, 3, '#9a7aa8'); R(g, 6, 20, 3, 8, '#c8a24a'); R(g, 20, 20, 3, 8, '#c8a24a'); R(g, 10, 8, 10, 9, '#e8d49a'); R(g, 11, 12, 2, 2, '#2a1e14'); R(g, 16, 12, 2, 2, '#2a1e14'); R(g, 5, 5, 20, 3, '#d8b434'); R(g, 9, 1, 12, 5, '#c49a28'); R(g, 4, 5, 22, 1, OL); return { w, h, c, py: h - 2, sway: 1.2 }; }
  function fence(v) { const w = 40, h = 24, c = cv(w, h), g = c.getContext('2d'); for (let q = 0; q < 4; q++) { const x = 3 + q * 10, y = 8 + (v ? q * -2 : q * 2) + (v ? 8 : 0); R(g, x, y, 3, 13, OL); R(g, x + 1, y + 1, 1, 11, '#a07a4a'); } R(g, 2, v ? 14 : 10, 36, 3, OL); R(g, 3, v ? 15 : 11, 34, 1, '#c4a066'); R(g, 2, v ? 19 : 15, 36, 3, OL); R(g, 3, v ? 20 : 16, 34, 1, '#c4a066'); return { w, h, c, py: h - 3 }; }
  function cart(v) { const w = 52, h = 34, c = cv(w, h), g = c.getContext('2d'); R(g, 6, 14, 38, 11, OL); R(g, 8, 15, 34, 9, '#9a6a3a'); R(g, 8, 15, 34, 2, '#c4905a'); R(g, 10, 8, 8, 8, '#d8c48a'); R(g, 20, 6, 9, 10, '#e8d8a8'); R(g, 31, 9, 8, 7, '#d8c48a'); for (const x of [12, 32]) { R(g, x - 1, 22, 11, 11, OL); R(g, x, 23, 9, 9, '#6e4c34'); R(g, x + 3, 26, 3, 3, '#c4a066'); } R(g, 44, 18, 8, 3, OL); R(g, 44, 19, 8, 1, '#a07a4a'); return { w, h, c, py: h - 5 }; }
  function rack() { const w = 52, h = 38, c = cv(w, h), g = c.getContext('2d'); for (const x of [4, 44]) { R(g, x, 6, 3, 30, OL); R(g, x + 1, 7, 1, 28, '#a07a4a'); } R(g, 3, 8, 46, 3, OL); R(g, 4, 9, 44, 1, '#c4a066'); R(g, 3, 20, 46, 3, OL); R(g, 4, 21, 44, 1, '#c4a066'); for (let q = 0; q < 8; q++) { R(g, 7 + q * 5, 11, 4, 9, q % 2 ? '#d8b434' : '#ecca48'); R(g, 7 + q * 5, 23, 4, 8, q % 2 ? '#ecca48' : '#d8b434'); } return { w, h, c, py: h - 3 }; }
  function pen() { const w = 184, h = 118, c = cv(w, h), g = c.getContext('2d'), ox = 76, oy = 92; // footprint 3 x 2 tiles: corners (0,0) (96,48) (32,80) (-64,32) around the origin at the footprint's top corner
    const P = [[0, 0], [96, 48], [32, 80], [-64, 32]].map(([x, y]) => [ox + x, oy - 40 + y]); const post = (x, y, hh) => { R(g, x - 1, y - hh, 3, hh + 1, OL); R(g, x, y - hh + 1, 1, hh - 1, '#b08a58'); };
    const edge = (a, b, gap) => { const n = Math.max(4, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 12)); let pa = null; for (let q = 0; q <= n; q++) { const x = Math.round(a[0] + (b[0] - a[0]) * q / n), y = Math.round(a[1] + (b[1] - a[1]) * q / n); if (gap && q > n * 0.35 && q < n * 0.6) { pa = null; continue; } if (pa) for (const hh of [6, 11]) { g.strokeStyle = OL; g.lineWidth = 3; g.beginPath(); g.moveTo(pa[0], pa[1] - hh); g.lineTo(x, y - hh); g.stroke(); g.strokeStyle = '#c4a066'; g.lineWidth = 1; g.beginPath(); g.moveTo(pa[0], pa[1] - hh); g.lineTo(x, y - hh); g.stroke(); } post(x, y, 14); pa = [x, y]; } };
    g.fillStyle = 'rgba(70,46,28,0.55)'; g.beginPath(); g.moveTo(P[0][0], P[0][1]); g.lineTo(P[1][0], P[1][1]); g.lineTo(P[2][0], P[2][1]); g.lineTo(P[3][0], P[3][1]); g.closePath(); g.fill(); edge(P[3], P[0]); edge(P[0], P[1]); edge(P[3], P[2], true); edge(P[2], P[1]); R(g, ox + 44, oy - 8, 22, 9, '#8a6a3a'); R(g, ox + 44, oy - 8, 22, 2, '#c4a066'); R(g, ox - 4, oy - 10, 14, 8, '#6e4c34'); return { w, h, c, py: oy - 40 + 40 }; }
  function granary() { const w = 72, h = 74, c = cv(w, h), g = c.getContext('2d'); for (const x of [14, 28, 42, 54]) R(g, x, 52, 4, 18, OL), R(g, x + 1, 53, 2, 16, '#a07a4a'); R(g, 10, 30, 52, 24, OL); R(g, 12, 32, 48, 20, '#c4a066'); for (let q = 0; q < 6; q++) R(g, 12, 33 + q * 3, 48, 1, '#a07a4a'); R(g, 32, 38, 12, 14, '#5e4430'); R(g, 33, 39, 10, 12, '#7a5c40'); for (let y = 0; y < 24; y++) { const half = 36 - Math.round(y * 0.6); R(g, 36 - half, 4 + y, half * 2, 1, y % 4 === 0 ? '#9a7a1c' : '#d8b434'); } R(g, 8, 28, 56, 2, OL); R(g, 56, 56, 10, 14, '#6e4c34'); R(g, 4, 62, 8, 8, '#d8c48a'); return { w, h, c, py: h - 5 }; }
  function wheel(f) { const w = 50, h = 50, c = cv(w, h), g = c.getContext('2d'); R(g, 4, 40, 42, 4, '#6e4c34'); R(g, 8, 44, 34, 3, '#53392a'); const cx = 25, cy = 24, r = 17; g.strokeStyle = OL; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, r, 0, 6.3); g.stroke(); g.strokeStyle = '#a07a4a'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r, 0, 6.3); g.stroke(); for (let q = 0; q < 8; q++) { const a = q * 0.7854 + f * 0.2; g.strokeStyle = OL; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke(); g.strokeStyle = '#c4a066'; g.lineWidth = 1; g.stroke(); R(g, cx + Math.cos(a) * r - 2, cy + Math.sin(a) * r - 2, 5, 5, '#8a6a3a'); } R(g, cx - 3, cy - 3, 6, 6, '#53392a'); return { w, h, c, py: h - 6 }; }
  const cache = {}; const mk = (key, fn) => cache[key] || (cache[key] = fn());
  const painters = {
    clthay: p => { const s = mk('hay' + (p.v % 3), () => hay(p.v)); return { w: s.w, h: s.h, py: s.py, frames: [s.c], em: null, glow: null, silk: null, flat: false }; },
    cltscare: p => { const s = mk('sc' + (p.v & 1), () => scare(p.v)); return { w: s.w, h: s.h, py: s.py, frames: [s.c], em: null, glow: null, silk: null, flat: false, sway: s.sway }; },
    cltfence: p => { const s = mk('fe' + (p.v & 1), () => fence(p.v & 1)); return { w: s.w, h: s.h, py: s.py, frames: [s.c], em: null, glow: null, silk: null, flat: false }; },
    cltcart: p => { const s = mk('ca', () => cart()); return { w: s.w, h: s.h, py: s.py, frames: [s.c], em: null, glow: null, silk: null, flat: false }; },
    cltrack: () => { const s = mk('ra', rack); return { w: s.w, h: s.h, py: s.py, frames: [s.c], em: null, glow: null, silk: null, flat: false }; },
    cltpen: () => { const s = mk('pe', pen); return { w: s.w, h: s.h, py: s.py, frames: [s.c], em: null, glow: null, silk: null, flat: false }; },
    cltgranary: () => { const s = mk('gr', granary); return { w: s.w, h: s.h, py: s.py, frames: [s.c], em: null, glow: null, silk: null, flat: false }; },
    cltwheel: () => { const fr = [0, 1, 2, 3].map(f => mk('wh' + f, () => wheel(f))); return { w: fr[0].w, h: fr[0].h, py: fr[0].py, frames: fr.map(s => s.c), em: null, glow: null, silk: null, flat: false }; },
  };
  Object.assign(A.IMGKINDS, { cltgao: ['clt_gao_a', 'clt_gao_b'] });
  A.clt = { top, face, edge, stairPal: STAIR, seamTone, painters, ramps: { GRS, PAD, RIC, SOI, PTH, FLG, BAM, HIL, MUD, WTR, STN, EAR } };
})();
