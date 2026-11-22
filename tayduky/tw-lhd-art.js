'use strict';
// ===== Tây Du Ký v2 — Liên Hoa Động: terrain art + painted landmarks (loaded after tw-art.js; plugs into TWA.lhd) =====
// Palette: cool blue-grey mountain rock with teal moss and pale veins, dark slate cave floor, worn pale flagstones, pine-needle floor, ravine gravel, a treasure floor of dark red stone inlaid with gold, glowing blue-violet crystal floor, dark teal water.
// Faces: stratified cool rock with hanging moss and thin wet streaks (a waterfall column on some); the inner hall faces are darker with warm firelight on the lip. Painted: the monumental Lotus Cave mouth (a stone lotus whose heart is the entrance,
// a gold horn and a silver horn on its shoulders), the treasure hoard, the purple-gold red gourd, the jade-pure bottle, the golden rope, the seven-star sword.
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const RCK = ramp(['#2e3a40', '#46535a', '#5e6c72', '#7c8c90', '#9cacac', '#c0cccc']);
  const MSS = ramp(['#1a3a2c', '#28583a', '#3c7a46', '#5a9c58', '#86c070']);
  const FLR = ramp(['#262e44', '#364058', '#4a5876', '#627294', '#8294b8']);
  const FLG = ramp(['#464a5a', '#5c6278', '#767c94', '#9298ae', '#acb2c8']);
  const PIN = ramp(['#24361c', '#364c24', '#4a6430', '#68823e', '#8aa050']);
  const GRV = ramp(['#4a4c52', '#64666c', '#808288', '#9a9ca0', '#b8bab8']);
  const TRS = ramp(['#3a1818', '#562424', '#74302c', '#964238', '#b45a44']);
  const CRY = ramp(['#1c1c40', '#2c2c6c', '#4a40a0', '#7a64d0', '#a894f0', '#d8ccff']);
  const WTR = ramp(['#143c4c', '#1e5c70', '#2c8296', '#54aab4', '#8ccccc', '#d4f4f0']);
  const STAIR = ramp(['#70748a', '#8e92a8', '#aeb2c4', '#ccd0de', '#e8ecf6']);
  const INK = [20, 22, 34], shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fbm = (I, J, s) => vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15;
  const isW = m => m === M.STREAM || m === M.POOL;
  function water(m, I, J, X, Y, k, SH, d) { SH.water = 2; const f = fbm(I * 1.1, J * 0.6, 1930), st = vnoise(I * 2.6, J * 0.7, 1931), br = Math.max(0, st - 0.66) * 2.4; let c = tone(WTR, 0.7 + f * 2.8 + (d ? 0.2 : 0)); if (br > 0.1) c = mix(c, [226, 248, 248], clamp(br * 0.55, 0, 0.6)); if (m === M.POOL) { const l = vnoise(I * 1.5 + 4, J * 1.5, 1932); if (l > 0.78) c = mix(c, [236, 150, 176], 0.55); else if (l > 0.68) c = mix(c, [60, 130, 90], 0.6); } if (hash2(X, Y, 1933) < 0.01) c = [255, 255, 255]; return c; }
  function top(m, I, J, X, Y, k, d, SH) {
    if (isW(m)) return water(m, I, J, X, Y, k, SH, d);
    const n0 = vnoise(I * 0.55, J * 0.55, 3), n1 = vnoise(I * 1.6, J * 1.6, 4), hp = hash2(X, Y, 9), lit = fbm(I - 0.13, J - 0.13, 1940) - fbm(I + 0.13, J + 0.13, 1940), t = window.TWR ? TWR.t : 0;
    if (m === M.LRFLOOR) { let c = tone(FLR, 1.5 + fbm(I, J, 1941) * 2.6 + lit * 3.5 + (d ? 0.2 : 0)); const cr = Math.abs(((I * 0.8 - J * 0.5 + vnoise(I * 0.3, J * 0.3, 1942) * 2) % 1) - 0.5); if (cr < 0.04) c = mix(c, [120, 130, 180], 0.4); if (hp < 0.004) c = FLR[4]; return c; }
    if (m === M.LRPATH) { const u = I * 1.2, v = J * 1.2, row = Math.floor(v), seam = ((u + (row & 1) * 0.5) % 1) < 0.08 || (v % 1) < 0.08; let c = tone(FLG, (seam ? 0.5 : 2.0) + n0 * 1.2 + lit * 3 + hash2(Math.floor(u + (row & 1) * 0.5), row, 1943) * 0.9 + (d ? 0.2 : 0)); if (n1 > 0.8 && !seam) c = mix(c, MSS[3], 0.4); return c; }
    if (m === M.LRPINE) { let c = tone(PIN, 0.9 + fbm(I, J, 1944) * 3 + lit * 4 + (d ? 0.2 : 0)); if (hp < 0.05) c = [150, 110, 70]; else if (hp > 0.985) c = PIN[4]; return c; }
    if (m === M.LRSAND) { let c = tone(GRV, 1.2 + fbm(I * 1.4, J * 1.4, 1945) * 2.6 + lit * 3 + (d ? 0.2 : 0)); if (hp > 0.96) c = GRV[4]; else if (hp < 0.04) c = GRV[0]; return c; }
    if (m === M.LRTREAS) { const seam = (I % 1) < 0.06 || (J % 1) < 0.06; let c = tone(TRS, (seam ? 0.6 : 1.8) + n0 * 1.2 + lit * 3 + (d ? 0.2 : 0)); const g = Math.abs(((I + J) * 0.5) % 3 - 1.5); if (g < 0.07 && !seam) c = mix(c, [236, 196, 90], 0.7); if (hp > 0.985) c = [255, 226, 130]; return c; }
    if (m === M.LRCRYS) { const p = 0.5 + 0.5 * Math.sin(t * 1.2 + I * 0.9 + J * 0.7); let c = tone(CRY, 1.2 + fbm(I, J, 1946) * 2.6 + lit * 3 + p * 0.7 + (d ? 0.2 : 0)); if (vnoise(I * 2.2, J * 2.2, 1947) > 0.74) { c = mix(c, CRY[5], 0.55); SH.em = [150, 130, 255]; } return c; }
    if (m === M.LRMOSS) { let c = tone(MSS, 0.9 + fbm(I, J, 1948) * 3 + lit * 4.5 + (d ? 0.2 : 0)); if (n1 > 0.8) c = mix(c, RCK[3], 0.4); return c; }
    let c = tone(RCK, 1.5 + fbm(I, J, 1949) * 3.2 + lit * 5 + (d ? 0.2 : 0)); const v = Math.abs(((I * 0.7 + J * 0.5 + vnoise(I * 0.3, J * 0.3, 1950) * 2.2) % 1) - 0.5); if (v < 0.045) c = mix(c, [186, 196, 190], 0.32); if (n1 > 0.74 && hp < 0.5) c = mix(c, MSS[2], 0.5); return c;
  }
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const m = TWM.MAT[k]; if (ry === drop - 1) return INK;
    if (isW(m)) { const streak = vnoise(gx * 1.6, elev * 0.04 - (window.TWR ? TWR.t * 1.2 : 0), 1960); if (ry < 2) return WTR[5]; let c = tone(WTR, 1.6 + (streak > 0.6 ? 1.8 : 0) + (side ? -0.4 : 0)); if (streak > 0.78) c = mix(c, [240, 252, 255], 0.6); return c; }
    if (m === M.LRTREAS || m === M.LRFLOOR || m === M.LRCRYS || m === M.LRPATH) { const row = Math.floor(elev / 7), off = (row & 1) * 8, seam = ((gx + off) % 16) < 1 || (elev % 7) === 0; let t = (side ? 0.9 : 2.0) + hash2(row, Math.floor((gx + off) / 16), 1961) * 0.9 - (ry / drop) * 0.6; if (seam) t -= 0.8; let c = tone(m === M.LRTREAS ? TRS : m === M.LRPATH ? FLG : FLR, t); if (m === M.LRTREAS && elev % 28 >= 12 && elev % 28 < 15) c = tone([[120, 84, 28], [180, 140, 52], [232, 196, 88], [255, 232, 140]], 1.8 + (side ? -0.5 : 0.3)); if (ry < 2) c = shade(c, 1.12); return c; }
    const led = (elev + vnoise(gx * 0.07, 0.5, 1962) * 9), ledge = Math.floor(led / 12), pos = led - ledge * 12, hv = hash2(ledge, Math.floor(gx / 10), 1963);
    let t = (side ? 0.9 : 2.1) + hv * 1.4 + (vnoise(gx * 0.18, elev * 0.12, 1964) - 0.5) * 1.6; if (pos < 1.5) t += 1.3; else if (pos > 9.5) t -= 1.0; const crack = Math.abs(vnoise(gx * 0.33, elev * 0.04, 1965) - 0.5) < 0.025; if (crack) t -= 1.1;
    let c = tone(RCK, t); if (pos < 3 && vnoise(gx * 0.4, ledge, 1966) > 0.45) c = mix(c, MSS[2 + (hv > 0.5 ? 1 : 0)], 0.65); const vine = hash2(Math.floor(gx / 3), ledge, 1967) < 0.15 && pos > 2 && pos < 2 + 5 * hash2(Math.floor(gx / 3), ledge, 1968) * 2; if (vine) c = mix(c, MSS[1], 0.7);
    const col = hash2(Math.floor(gx / 6), 7, 1969); if (col < 0.1) { const flow = (elev * 1.0 - (window.TWR ? TWR.t * 20 : 0)) % 34; if (flow > 0 && flow < 20 + col * 60) c = mix(c, [206, 224, 226], 0.55 - flow * 0.012); } if (ry > drop * 0.75) c = mix(c, [120, 130, 132], (ry / drop - 0.75) * 0.9); if (hash2(gx, elev, 1970) < 0.008) c = [206, 214, 214]; return c;
  }
  const edge = c => mix(c, [240, 214, 170], 0.36);
  const seamTone = (I, J, n0, n1) => tone(RCK, 2.2 + n0 * 1.6 + n1 * 0.6);
  // ---------------------------------------------------------------- painted landmarks
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const OL = '#141622', rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  function mouth() {
    // The Lotus Cave: an ancient doorway of dressed stone set INTO the mountain wall, ringed by two layers of carved stone lotus petals that grow out of the rock (gold veins on the west, silver veins on the east),
    // three nested recessed arches (depth) with a warm glow on the floor and violet crystal light far inside, a gold and a silver horn relief on the shoulders, rune marks and torch niches. No teeth, no mouth.
    const w = 200, h = 150, c = cv(w, h), g = c.getContext('2d'), cx = 100, base = 140, left = 6, right = 194;
    const topAt = x => { const u = (x - cx) / 94, r = Math.abs(u); return 20 + Math.pow(r, 1.5) * 108 + (hash2(Math.floor(x / 6), 3, 1971) - 0.5) * 10; };
    for (let x = left; x <= right; x++) { const ty = Math.round(topAt(x)); for (let y = ty; y <= base; y++) { const n = vnoise(x * 0.12, y * 0.12, 1972), ledge = Math.floor((y + vnoise(x * 0.05, 1, 1973) * 8) / 10), hv = hash2(ledge, Math.floor(x / 14), 1974); let t = 1.1 + (cx - x) * 0.01 + hv * 1.1 + (n - 0.5) * 2.2 - (y - ty) * 0.01; if ((y + 4) % 10 < 1.6) t += 1.0; let col = tone(RCK, t); if (y - ty < 5 && n > 0.4) col = mix(col, MSS[3], 0.7); R(g, x, y, 1, 1, rgb(col)); } R(g, x, ty - 1, 1, 1, OL); }
    for (let y = 40; y <= base; y++) for (const x of [left - 1, right + 1]) R(g, x, y, 1, 1, OL);
    const ax = cx, ay = 92;
    const petal = (px0, py0, ang, len, wid, c1, c2, vein) => { g.save(); g.translate(px0, py0); g.rotate(ang); g.fillStyle = OL; g.beginPath(); g.ellipse(0, -len / 2, wid + 1.5, len / 2 + 1.5, 0, 0, 6.3); g.fill();
      const gr = g.createLinearGradient(0, 0, 0, -len); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.beginPath(); g.ellipse(0, -len / 2, wid, len / 2, 0, 0, 6.3); g.fill();
      g.strokeStyle = vein; g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, -3); g.lineTo(0, -len + 5); g.stroke(); g.strokeStyle = 'rgba(40,36,50,0.45)'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, -len / 2, wid * 0.62, len * 0.4, 0, 0, 6.3); g.stroke(); g.restore(); };
    // back layer: 13 large petals fanning over the upper half, west half veined in gold, east half in silver
    for (let q = 0; q < 13; q++) { const a = -2.5 + q * (5.0 / 12), L = 54 - Math.abs(q - 6) * 2.6; petal(ax + Math.sin(a) * 28, ay - Math.cos(a) * 12 + 8, a, L, 14, q < 6 ? '#7a7a80' : q > 6 ? '#7c8088' : '#807e84', q < 6 ? '#c4bcc0' : '#c0c4cc', q < 6 ? '#e0b84a' : q > 6 ? '#dfe6f0' : '#fff0b0'); }
    // the rock grips the petal roots
    for (let x = ax - 70; x <= ax + 70; x++) { const yy = Math.round(ay - 8 + Math.pow(Math.abs(x - ax) / 70, 1.4) * 40); for (let y = yy; y < yy + 9; y++) { const n = vnoise(x * 0.2, y * 0.2, 1977); R(g, x, y, 1, 1, rgb(tone(RCK, 0.8 + n * 2))); } }
    // front layer: 9 smaller petals
    for (let q = 0; q < 9; q++) { const a = -2.1 + q * (4.2 / 8), L = 34 - Math.abs(q - 4) * 2; petal(ax + Math.sin(a) * 38, ay - Math.cos(a) * 18 + 16, a, L, 11, '#a39aa4', '#d8d0d8', q < 4 ? '#c89a2c' : q > 4 ? '#c0c8d4' : '#fff0b0'); }
    // the doorway: a dressed-stone frame (radial blocks) around a pointed arch
    const aw = 34, at = 66, fw = 9;
    const arch = (hw, topY, fill) => { g.beginPath(); g.moveTo(ax - hw, base); g.lineTo(ax - hw, topY + 26); g.quadraticCurveTo(ax - hw, topY + 6, ax, topY - 8); g.quadraticCurveTo(ax + hw, topY + 6, ax + hw, topY + 26); g.lineTo(ax + hw, base); g.closePath(); g.fillStyle = fill; g.fill(); };
    arch(aw + fw + 1, at - fw, OL); const fr = g.createLinearGradient(0, at - fw, 0, base); fr.addColorStop(0, '#b4bcc0'); fr.addColorStop(1, '#6a7478'); arch(aw + fw, at - fw, fr);
    g.strokeStyle = 'rgba(30,36,44,0.8)'; g.lineWidth = 1; for (let q = 0; q <= 14; q++) { const a = -1.5 + q * (3.0 / 14), x1 = ax + Math.sin(a) * (aw + 1), y1 = at + 18 - Math.cos(a) * 44 + 24, x2 = ax + Math.sin(a) * (aw + fw), y2 = at + 18 - Math.cos(a) * (44 + fw) + 24; if (Math.abs(a) < 1.25) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } }
    // depth: three recessed arches, each darker, with a lit floor
    arch(aw + 1, at, OL); let gr0 = g.createLinearGradient(0, at, 0, base); gr0.addColorStop(0, '#0a0a14'); gr0.addColorStop(0.7, '#1a1830'); gr0.addColorStop(1, '#6a4030'); arch(aw - 1, at + 1, gr0);
    arch(aw - 9, at + 12, '#04040a'); gr0 = g.createLinearGradient(0, at + 12, 0, base); gr0.addColorStop(0, '#05050c'); gr0.addColorStop(1, '#3a2a40'); arch(aw - 10, at + 13, gr0); arch(aw - 18, at + 26, '#020206');
    g.fillStyle = 'rgba(190,130,70,0.55)'; g.fillRect(ax - aw + 4, base - 4, aw * 2 - 8, 4); g.fillStyle = 'rgba(240,170,100,0.7)'; g.fillRect(ax - 12, base - 3, 24, 2);
    for (const [x, y, c0] of [[ax - 3, base - 30, '#9a84ff'], [ax + 5, base - 36, '#7a64d0'], [ax - 8, base - 24, '#b8a8ff'], [ax + 9, base - 28, '#9a84ff']]) { R(g, x, y, 2, 3, c0); R(g, x - 1, y + 1, 4, 1, 'rgba(160,140,255,0.5)'); }
    // horn reliefs on the shoulders: a gold ring with a gold horn, a silver ring with a silver horn
    const medal = (mx, my, rim, fillc, hornc, dir) => { g.fillStyle = OL; g.beginPath(); g.arc(mx, my, 13, 0, 6.3); g.fill(); g.fillStyle = rim; g.beginPath(); g.arc(mx, my, 11.5, 0, 6.3); g.fill(); g.fillStyle = fillc; g.beginPath(); g.arc(mx, my, 8.5, 0, 6.3); g.fill(); g.save(); g.translate(mx, my + 5); g.scale(dir, 1); g.fillStyle = OL; g.beginPath(); g.moveTo(-5, 0); g.quadraticCurveTo(-3, -8, 6, -12); g.quadraticCurveTo(0, -5, 4, 0); g.fill(); g.fillStyle = hornc; g.beginPath(); g.moveTo(-4, -1); g.quadraticCurveTo(-2, -7, 5, -11); g.quadraticCurveTo(0, -5, 3, -1); g.fill(); g.restore(); };
    medal(ax - 62, base - 30, '#d8a838', '#4a3a1c', '#ffe27a', 1); medal(ax + 62, base - 30, '#b8c4d4', '#2c3440', '#f4f8ff', -1);
    // rune marks along the frame and torch niches
    for (let q = 0; q < 9; q++) { const a = -1.15 + q * 0.29, x = ax + Math.sin(a) * (aw + fw / 2 + 1), y = at + 18 - Math.cos(a) * (44 + fw / 2) + 24; R(g, x - 1, y - 1, 3, 3, q & 1 ? '#e8c24a' : '#cfd8e8'); R(g, x, y - 2, 1, 5, '#1a1c24'); }
    for (const x of [ax - aw - fw - 8, ax + aw + fw + 5]) { R(g, x, base - 36, 4, 22, OL); R(g, x + 1, base - 34, 2, 18, '#5a4a3a'); R(g, x - 2, base - 40, 8, 5, OL); R(g, x - 1, base - 39, 6, 3, '#8a6a3a'); }
    for (let q = 0; q < 16; q++) { const x = 18 + q * 10.5, hh = 3 + Math.floor(hash2(q, 1, 1976) * 11); R(g, x, Math.round(topAt(x)) + 2, 2, hh, rgb(MSS[1])); }
    return { w, h, c, py: 132 };
  }
  function hoard() { const w = 120, h = 62, c = cv(w, h), g = c.getContext('2d'); g.fillStyle = 'rgba(20,12,12,0.45)'; g.beginPath(); g.ellipse(60, 48, 52, 11, 0, 0, 6.3); g.fill(); for (let q = 0; q < 260; q++) { const u = hash2(q, 1, 1980), v = hash2(q, 2, 1980), x = 12 + u * 96, hgt = Math.max(0, 1 - Math.pow((x - 60) / 50, 2)) * 30, y = 44 - hash2(q, 3, 1980) * hgt - Math.abs(u - 0.5) * 6, r = hash2(q, 4, 1980); const col = r < 0.6 ? ['#a8761c', '#d8a42c', '#f4cc50', '#fff09a'][Math.floor(v * 4)] : r < 0.7 ? '#d83a50' : r < 0.78 ? '#3a8ad8' : r < 0.84 ? '#3ad88a' : ['#d8d8e0', '#b0b4c8'][q & 1]; R(g, x, y, 3, 2, col); } R(g, 14, 36, 22, 14, OL); R(g, 15, 37, 20, 12, '#7a4a22'); R(g, 15, 37, 20, 3, '#a8742c'); R(g, 23, 42, 4, 4, '#f4cc50'); R(g, 86, 34, 22, 14, OL); R(g, 87, 35, 20, 12, '#7a4a22'); R(g, 87, 35, 20, 3, '#a8742c'); R(g, 95, 40, 4, 4, '#f4cc50'); return { w, h, c, py: 44 }; }
  function altar(w, h, draw) { const c = cv(w, h), g = c.getContext('2d'); R(g, 4, h - 14, w - 8, 12, OL); R(g, 5, h - 13, w - 10, 10, '#4a4a64'); R(g, 5, h - 13, w - 10, 3, '#7a7a9c'); R(g, 8, h - 20, w - 16, 7, OL); R(g, 9, h - 19, w - 18, 5, '#5e5e7c'); draw(g, w, h); return { w, h, c, py: h - 6 }; }
  function cage() { const w = 140, h = 112, c = cv(w, h), g = c.getContext('2d'), cx = 70, cy = 84, H = 50; const P = [[0, -32], [64, 0], [0, 32], [-64, 0]].map(([x, y]) => [cx + x, cy + y]); // the demons' iron cage: a 2 x 2 tile box of bars
    g.fillStyle = 'rgba(14,12,20,0.5)'; g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
    const bar = (x, y0, y1) => { R(g, x - 1, y1, 3, y0 - y1, '#101018'); R(g, x, y1 + 1, 1, y0 - y1 - 2, '#7a7a98'); };
    const edge = (a2, b2, n) => { for (let q = 0; q <= n; q++) { const x = Math.round(a2[0] + (b2[0] - a2[0]) * q / n), y = Math.round(a2[1] + (b2[1] - a2[1]) * q / n); bar(x, y, y - H); } };
    const ring = (a2, b2, dy) => { g.strokeStyle = '#101018'; g.lineWidth = 4; g.beginPath(); g.moveTo(a2[0], a2[1] - dy); g.lineTo(b2[0], b2[1] - dy); g.stroke(); g.strokeStyle = '#8a8aa8'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(a2[0], a2[1] - dy); g.lineTo(b2[0], b2[1] - dy); g.stroke(); };
    edge(P[3], P[0], 6); edge(P[0], P[1], 6); for (const [a2, b2] of [[0, 1], [3, 0]]) { ring(P[a2], P[b2], 0); ring(P[a2], P[b2], H); ring(P[a2], P[b2], H / 2); }
    edge(P[3], P[2], 6); edge(P[2], P[1], 6); for (const [a2, b2] of [[3, 2], [2, 1]]) { ring(P[a2], P[b2], 0); ring(P[a2], P[b2], H); ring(P[a2], P[b2], H / 2); }
    for (const [x, y] of P) { R(g, x - 3, y - H - 4, 7, 7, '#101018'); R(g, x - 2, y - H - 3, 5, 5, '#e8c24a'); }
    g.fillStyle = 'rgba(216,58,58,0.9)'; g.fillRect(cx - 4, cy + 20 - H / 2, 8, 6); return { w, h, c, py: cy }; }
  const pedestal = () => altar(40, 50, () => { });
  // the four treasures as small separate canvases (drawn by tw-lhd-fx.js on their pedestals, in a hand, or in flight)
  function itemGourd() { const w = 28, h = 38, c = cv(w, h), g = c.getContext('2d'), cx = 14; g.fillStyle = OL; g.beginPath(); g.ellipse(cx, 26, 12, 11, 0, 0, 6.3); g.ellipse(cx, 11, 8, 8, 0, 0, 6.3); g.fill(); g.fillStyle = '#9a2a4a'; g.beginPath(); g.ellipse(cx, 26, 10, 9.5, 0, 0, 6.3); g.fill(); g.fillStyle = '#b8408a'; g.beginPath(); g.ellipse(cx, 11, 6.5, 6.5, 0, 0, 6.3); g.fill(); g.fillStyle = '#e8b8d8'; g.fillRect(cx - 6, 20, 3, 6); g.fillStyle = '#f0c850'; g.fillRect(cx - 4, 2, 8, 3); g.fillStyle = '#c89a2c'; g.fillRect(cx - 2, 0, 4, 3); g.fillStyle = '#e03a3a'; g.fillRect(cx - 9, 17, 18, 2); return { w, h, c }; }
  function itemBottle() { const w = 20, h = 36, c = cv(w, h), g = c.getContext('2d'), cx = 10; g.fillStyle = OL; g.beginPath(); g.ellipse(cx, 24, 9, 11, 0, 0, 6.3); g.fill(); g.fillRect(cx - 4, 4, 8, 18); g.fillStyle = '#7acaa4'; g.beginPath(); g.ellipse(cx, 24, 7.5, 9.5, 0, 0, 6.3); g.fill(); g.fillRect(cx - 3, 5, 6, 17); g.fillStyle = '#c4f0dc'; g.fillRect(cx - 5, 19, 3, 8); g.fillStyle = '#e8c84a'; g.fillRect(cx - 5, 3, 10, 3); g.fillStyle = '#c8402a'; g.fillRect(cx - 3, 0, 6, 4); return { w, h, c }; }
  function itemRope() { const w = 28, h = 20, c = cv(w, h), g = c.getContext('2d'); for (let q = 0; q < 4; q++) { g.strokeStyle = OL; g.lineWidth = 4; g.beginPath(); g.ellipse(14, 13 - q * 3, 11 - q, 5, 0, 0, 6.3); g.stroke(); g.strokeStyle = q & 1 ? '#f0c850' : '#c89a2c'; g.lineWidth = 2; g.beginPath(); g.ellipse(14, 13 - q * 3, 11 - q, 5, 0, 0, 6.3); g.stroke(); } g.fillStyle = '#e03a3a'; g.fillRect(12, 0, 4, 6); return { w, h, c }; }
  function itemSword() { const w = 14, h = 50, c = cv(w, h), g = c.getContext('2d'), cx = 7; g.fillStyle = OL; g.fillRect(cx - 4, 0, 8, 38); g.fillStyle = '#d4dcea'; g.fillRect(cx - 2, 1, 4, 36); g.fillStyle = '#ffffff'; g.fillRect(cx - 1, 1, 1, 36); for (let q = 0; q < 7; q++) { g.fillStyle = '#f0c850'; g.fillRect(cx - 1, 4 + q * 5, 2, 2); } g.fillStyle = OL; g.fillRect(cx - 7, 38, 14, 5); g.fillStyle = '#c89a2c'; g.fillRect(cx - 6, 39, 12, 3); g.fillStyle = '#8a2a2a'; g.fillRect(cx - 2, 43, 4, 7); return { w, h, c }; }
  const cache = {}; const mk = (key, fn) => cache[key] || (cache[key] = fn());
  const mkSprite = (key, fn) => () => { const s = mk(key, fn); return { w: s.w, h: s.h, py: s.py, frames: [s.c], em: null, glow: null, silk: null, flat: false }; };
  const painters = { lhdmouth: mkSprite('mouth', mouth), lhdhoard: mkSprite('hoard', hoard), lhdcage: mkSprite('cage', cage), lhdgourd: mkSprite('ped', pedestal), lhdbottle: mkSprite('ped', pedestal), lhdrope: mkSprite('ped', pedestal), lhdsword: mkSprite('ped', pedestal) };
  const items = { gourd: itemGourd(), bottle: itemBottle(), rope: itemRope(), sword: itemSword() };
  A.lhd = { top, face, edge, stairPal: STAIR, seamTone, painters, items, ramps: { RCK, MSS, FLR, FLG, PIN, GRV, TRS, CRY, WTR } };
})();
