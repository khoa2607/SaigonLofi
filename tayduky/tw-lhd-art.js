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
    const w = 200, h = 150, c = cv(w, h), g = c.getContext('2d'), cx = 100, base = 140, left = 8, right = 192;
    const topAt = x => { const u = (x - cx) / 92, r = Math.abs(u); return 22 + Math.pow(r, 1.6) * 100 + (hash2(Math.floor(x / 6), 3, 1971) - 0.5) * 12; };
    // the mountain mass, strata and moss
    for (let x = left; x <= right; x++) { const ty = Math.round(topAt(x)); for (let y = ty; y <= base; y++) { const n = vnoise(x * 0.12, y * 0.12, 1972), ledge = Math.floor((y + vnoise(x * 0.05, 1, 1973) * 8) / 10), hv = hash2(ledge, Math.floor(x / 14), 1974); let t = 1.4 + (cx - x) * 0.012 + hv * 1.2 + (n - 0.5) * 2.4 - (y - ty) * 0.012; if ((y + 4) % 10 < 1.6) t += 1.1; let col = tone(RCK, t); if (y - ty < 5 && n > 0.4) col = mix(col, MSS[3], 0.7); if (hash2(x, y, 1975) < 0.006) col = [230, 240, 252]; R(g, x, y, 1, 1, rgb(col)); } R(g, x, ty - 1, 1, 1, OL); }
    for (let y = 40; y <= base; y++) { for (const x of [left - 1, right + 1]) R(g, x, y, 1, 1, OL); }
    // the stone lotus: seven carved petals radiating from the arch, pale pink-grey stone with ink outline and a lit rim
    const ax = cx, ay = 78; for (let q = 0; q < 9; q++) { const a = -3.14159 + (q + 0.5) * 3.14159 / 9, len = 58 - Math.abs(q - 4) * 5, px = ax + Math.cos(a) * 18, py = ay + Math.sin(a) * 30; g.save(); g.translate(px, py); g.rotate(a + 1.5708); g.fillStyle = OL; g.beginPath(); g.ellipse(0, -len * 0.45, 12, len * 0.55, 0, 0, 6.3); g.fill(); g.fillStyle = q & 1 ? '#c8b0bc' : '#d8c4cc'; g.beginPath(); g.ellipse(0, -len * 0.45, 10, len * 0.5, 0, 0, 6.3); g.fill(); g.fillStyle = '#ecdce0'; g.beginPath(); g.ellipse(-2, -len * 0.55, 3.5, len * 0.32, 0, 0, 6.3); g.fill(); g.restore(); }
    // the cave: a pointed arch, deep indigo interior, warm glow at the floor, stalactite teeth and stalagmites
    const archW = 36, archTop = 62; g.save(); g.beginPath(); g.moveTo(ax - archW, base); g.quadraticCurveTo(ax - archW, archTop + 10, ax, archTop - 6); g.quadraticCurveTo(ax + archW, archTop + 10, ax + archW, base); g.closePath(); g.fillStyle = OL; g.fill(); g.clip(); const gr = g.createLinearGradient(0, archTop, 0, base); gr.addColorStop(0, '#07070f'); gr.addColorStop(0.6, '#141230'); gr.addColorStop(0.92, '#4a2a2e'); gr.addColorStop(1, '#a8603a'); g.fillStyle = gr; g.fillRect(ax - archW + 3, archTop - 3, archW * 2 - 6, base - archTop); g.restore();
    for (let q = 0; q < 9; q++) { const x = ax - archW + 8 + q * 7, hh = 6 + (q % 3) * 4; g.fillStyle = '#9aa6bc'; g.beginPath(); g.moveTo(x, archTop + 10 + Math.abs(q - 4) * 2); g.lineTo(x + 6, archTop + 10 + Math.abs(q - 4) * 2); g.lineTo(x + 3, archTop + 10 + Math.abs(q - 4) * 2 + hh); g.fill(); }
    for (const [x, hh] of [[ax - 26, 9], [ax - 14, 5], [ax + 12, 7], [ax + 22, 10]]) { g.fillStyle = '#6a7690'; g.beginPath(); g.moveTo(x, base); g.lineTo(x + 5, base); g.lineTo(x + 2.5, base - hh); g.fill(); }
    R(g, ax - 16, base - 2, 32, 2, '#f0a060'); R(g, ax - 10, base - 4, 20, 2, '#d08048');
    // the gold horn (left) and the silver horn (right) on the shoulders of the mountain
    const horn = (sx, dir, c1, c2, c3) => { g.save(); g.translate(sx, 62); g.scale(dir, 1); g.fillStyle = OL; g.beginPath(); g.moveTo(-8, 28); g.quadraticCurveTo(-4, -2, 16, -22); g.quadraticCurveTo(2, 0, 10, 28); g.closePath(); g.fill(); g.fillStyle = c1; g.beginPath(); g.moveTo(-6, 27); g.quadraticCurveTo(-2, 0, 14, -19); g.quadraticCurveTo(2, 2, 7, 27); g.closePath(); g.fill(); g.fillStyle = c2; g.beginPath(); g.moveTo(-3, 26); g.quadraticCurveTo(1, 3, 12, -16); g.quadraticCurveTo(4, 4, 3, 26); g.closePath(); g.fill(); g.fillStyle = c3; g.fillRect(2, 2, 2, 12); g.restore(); };
    horn(44, -1, '#c89a2c', '#e8c24a', '#fff0a0'); horn(156, 1, '#8c9cb4', '#c4d2e4', '#ffffff');
    // hanging banners and moss drapes
    for (const x of [60, 140]) { R(g, x - 1, 100, 2, 36, OL); R(g, x, 100, 10, 26, '#5a1424'); R(g, x + 1, 102, 8, 3, '#d8a838'); R(g, x + 3, 112, 4, 6, '#d8a838'); }
    for (let q = 0; q < 16; q++) { const x = 20 + q * 11, hh = 4 + Math.floor(hash2(q, 1, 1976) * 12); R(g, x, Math.round(topAt(x)) + 2, 2, hh, rgb(MSS[1])); }
    return { w, h, c, py: 132 };
  }
  function hoard() { const w = 120, h = 62, c = cv(w, h), g = c.getContext('2d'); g.fillStyle = 'rgba(20,12,12,0.45)'; g.beginPath(); g.ellipse(60, 48, 52, 11, 0, 0, 6.3); g.fill(); for (let q = 0; q < 260; q++) { const u = hash2(q, 1, 1980), v = hash2(q, 2, 1980), x = 12 + u * 96, hgt = Math.max(0, 1 - Math.pow((x - 60) / 50, 2)) * 30, y = 44 - hash2(q, 3, 1980) * hgt - Math.abs(u - 0.5) * 6, r = hash2(q, 4, 1980); const col = r < 0.6 ? ['#a8761c', '#d8a42c', '#f4cc50', '#fff09a'][Math.floor(v * 4)] : r < 0.7 ? '#d83a50' : r < 0.78 ? '#3a8ad8' : r < 0.84 ? '#3ad88a' : ['#d8d8e0', '#b0b4c8'][q & 1]; R(g, x, y, 3, 2, col); } R(g, 14, 36, 22, 14, OL); R(g, 15, 37, 20, 12, '#7a4a22'); R(g, 15, 37, 20, 3, '#a8742c'); R(g, 23, 42, 4, 4, '#f4cc50'); R(g, 86, 34, 22, 14, OL); R(g, 87, 35, 20, 12, '#7a4a22'); R(g, 87, 35, 20, 3, '#a8742c'); R(g, 95, 40, 4, 4, '#f4cc50'); return { w, h, c, py: 44 }; }
  function altar(w, h, draw) { const c = cv(w, h), g = c.getContext('2d'); R(g, 4, h - 14, w - 8, 12, OL); R(g, 5, h - 13, w - 10, 10, '#4a4a64'); R(g, 5, h - 13, w - 10, 3, '#7a7a9c'); R(g, 8, h - 20, w - 16, 7, OL); R(g, 9, h - 19, w - 18, 5, '#5e5e7c'); draw(g, w, h); return { w, h, c, py: h - 6 }; }
  const pedestal = () => altar(40, 50, () => { });
  // the four treasures as small separate canvases (drawn by tw-lhd-fx.js on their pedestals, in a hand, or in flight)
  function itemGourd() { const w = 28, h = 38, c = cv(w, h), g = c.getContext('2d'), cx = 14; g.fillStyle = OL; g.beginPath(); g.ellipse(cx, 26, 12, 11, 0, 0, 6.3); g.ellipse(cx, 11, 8, 8, 0, 0, 6.3); g.fill(); g.fillStyle = '#9a2a4a'; g.beginPath(); g.ellipse(cx, 26, 10, 9.5, 0, 0, 6.3); g.fill(); g.fillStyle = '#b8408a'; g.beginPath(); g.ellipse(cx, 11, 6.5, 6.5, 0, 0, 6.3); g.fill(); g.fillStyle = '#e8b8d8'; g.fillRect(cx - 6, 20, 3, 6); g.fillStyle = '#f0c850'; g.fillRect(cx - 4, 2, 8, 3); g.fillStyle = '#c89a2c'; g.fillRect(cx - 2, 0, 4, 3); g.fillStyle = '#e03a3a'; g.fillRect(cx - 9, 17, 18, 2); return { w, h, c }; }
  function itemBottle() { const w = 20, h = 36, c = cv(w, h), g = c.getContext('2d'), cx = 10; g.fillStyle = OL; g.beginPath(); g.ellipse(cx, 24, 9, 11, 0, 0, 6.3); g.fill(); g.fillRect(cx - 4, 4, 8, 18); g.fillStyle = '#7acaa4'; g.beginPath(); g.ellipse(cx, 24, 7.5, 9.5, 0, 0, 6.3); g.fill(); g.fillRect(cx - 3, 5, 6, 17); g.fillStyle = '#c4f0dc'; g.fillRect(cx - 5, 19, 3, 8); g.fillStyle = '#e8c84a'; g.fillRect(cx - 5, 3, 10, 3); g.fillStyle = '#c8402a'; g.fillRect(cx - 3, 0, 6, 4); return { w, h, c }; }
  function itemRope() { const w = 28, h = 20, c = cv(w, h), g = c.getContext('2d'); for (let q = 0; q < 4; q++) { g.strokeStyle = OL; g.lineWidth = 4; g.beginPath(); g.ellipse(14, 13 - q * 3, 11 - q, 5, 0, 0, 6.3); g.stroke(); g.strokeStyle = q & 1 ? '#f0c850' : '#c89a2c'; g.lineWidth = 2; g.beginPath(); g.ellipse(14, 13 - q * 3, 11 - q, 5, 0, 0, 6.3); g.stroke(); } g.fillStyle = '#e03a3a'; g.fillRect(12, 0, 4, 6); return { w, h, c }; }
  function itemSword() { const w = 14, h = 50, c = cv(w, h), g = c.getContext('2d'), cx = 7; g.fillStyle = OL; g.fillRect(cx - 4, 0, 8, 38); g.fillStyle = '#d4dcea'; g.fillRect(cx - 2, 1, 4, 36); g.fillStyle = '#ffffff'; g.fillRect(cx - 1, 1, 1, 36); for (let q = 0; q < 7; q++) { g.fillStyle = '#f0c850'; g.fillRect(cx - 1, 4 + q * 5, 2, 2); } g.fillStyle = OL; g.fillRect(cx - 7, 38, 14, 5); g.fillStyle = '#c89a2c'; g.fillRect(cx - 6, 39, 12, 3); g.fillStyle = '#8a2a2a'; g.fillRect(cx - 2, 43, 4, 7); return { w, h, c }; }
  const cache = {}; const mk = (key, fn) => cache[key] || (cache[key] = fn());
  const mkSprite = (key, fn) => () => { const s = mk(key, fn); return { w: s.w, h: s.h, py: s.py, frames: [s.c], em: null, glow: null, silk: null, flat: false }; };
  const painters = { lhdmouth: mkSprite('mouth', mouth), lhdhoard: mkSprite('hoard', hoard), lhdgourd: mkSprite('ped', pedestal), lhdbottle: mkSprite('ped', pedestal), lhdrope: mkSprite('ped', pedestal), lhdsword: mkSprite('ped', pedestal) };
  const items = { gourd: itemGourd(), bottle: itemBottle(), rope: itemRope(), sword: itemSword() };
  A.lhd = { top, face, edge, stairPal: STAIR, seamTone, painters, items, ramps: { RCK, MSS, FLR, FLG, PIN, GRV, TRS, CRY, WTR } };
})();
