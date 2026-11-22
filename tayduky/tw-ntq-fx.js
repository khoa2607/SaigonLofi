'use strict';
// ===== Tây Du Ký v2 — Ngũ Trang Quán: living effects (render-only; reads TWS.ntq; may use Math.random) =====
// The Ginseng Fruit Tree (sway, baby-shaped fruit, aura, qi swirl, root glow, fall / withering / revival), cascades, mist, koi and lotus ponds, standing and landing cranes, rabbits, butterflies, petals, pollen, fireflies,
// incense smoke, cloud banks and shadows, light shafts, rain and rainbow, and the magic of the signature: the talisman circle and ropes of Daoist light, the nectar, Guanyin's light, the wave of life, the feast.
window.TWFX = window.TWFX || {};
(function () {
  const A = TWA, T = 8, Fm = () => TWM.ntq, st = () => (window.TWS && TWS.ntq) || null, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), hash = (a, b, c) => TWM.hash2(a, b, c), sm = t => t * t * (3 - 2 * t);
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const inView = (R, x, y, m) => { const x0 = R.cx - R.cv.width / 2 - m, y0 = R.cy - R.cv.height / 2 - m; return x > x0 && x < x0 + R.cv.width + 2 * m && y > y0 && y < y0 + R.cv.height + 2 * m; };
  function blob(g, x, y, r, rgb, a) { if (a <= 0.003) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  const mist = (g, x, y, rx, ry, a, rgb) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); blob(g, 0, 0, rx, rgb || '236,248,244', a); g.restore(); };
  const ring = (g, x, y, rx, ry, col, w, a0, a1) => { g.strokeStyle = col; g.lineWidth = w || 1; g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0 || 0, a1 === undefined ? 6.2832 : a1); g.stroke(); };
  const S_t = () => window.TWS ? TWS.t : 0;
  const TW = (a, b) => [a * T, b * T];
  const ground = (x, y) => TWM.groundZ(x, y);
  // ---------------------------------------------------------------- geometry caches
  let G = null;
  function geo() {
    if (G) return G; const N = TWM.N, F = Fm(); G = { falls: [], box: null, lawn: [], kilns: [], air: null }; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const k of F.tiles) { const i = k % N, j = Math.floor(k / N), h = TWM.H[k], X = A.SX(i, j), Y = A.SY(i, j, h); x0 = Math.min(x0, X - 32); x1 = Math.max(x1, X + 32); y0 = Math.min(y0, Y - 260); y1 = Math.max(y1, Y + 40); }
    G.box = [x0, y0, x1, y1]; const isW = k => TWM.MAT[k] === TWM.M.STREAM || TWM.MAT[k] === TWM.M.POOL;
    for (const k of F.stream) { const i = k % N, j = Math.floor(k / N), h = TWM.H[k]; for (const [side, di, dj] of [[0, 1, 0], [1, 0, 1]]) { const q = (j + dj) * N + i + di, hq = TWM.H[q]; const wq = isW(q) || TWM.MAT[q] === TWM.M.VOID; if (wq && hq < h) G.falls.push({ i, j, side, drop: h - hq, k, rim: TWM.MAT[q] === TWM.M.VOID }); } }
    for (const k of F.tiles) if (TWM.MAT[k] === TWM.M.QLAWN && !TWM.PATHC[k]) G.lawn.push(k);
    for (const p of TWM.props) if (p.biome === 'ntq' && p.kind === 'qkiln') G.kilns.push([(p.i + 0.5) * T, (p.j + 0.5) * T]);
    return G;
  }
  const trunkW = () => [Fm().tree[0] * T, Fm().tree[1] * T];
  // ---------------------------------------------------------------- the baby-shaped fruit, a small code-painted sprite
  const FRU = []; function fruitCv(v) { if (FRU[v]) return FRU[v]; const cv = document.createElement('canvas'); cv.width = 11; cv.height = 15; const g = cv.getContext('2d'), P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    P(5, 0, 1, 2, '#4f9a3c'); P(6, 0, 2, 1, '#78c24a');                                      // stem and leaf
    P(3, 2, 5, 1, '#9a5a30'); P(2, 3, 7, 4, '#9a5a30'); P(3, 7, 5, 1, '#9a5a30'); P(3, 3, 5, 4, '#ffdcb4'); P(4, 2, 3, 1, '#ffe8c8');   // head: outline + skin
    P(3, 5, 1, 1, '#ff9a8c'); P(7, 5, 1, 1, '#ff9a8c'); P(4, 4, 1, 1, '#6a3220'); P(6, 4, 1, 1, '#6a3220'); P(5, 6, 1, 1, '#c8584a');   // blush, closed eyes, mouth
    P(2, 8, 7, 6, '#b88a3c'); P(3, 8, 5, 5, '#f8e8a8'); P(3, 12, 5, 1, '#e0c070'); P(4, 13, 3, 1, '#b88a3c'); P(3, 9, 5, 1, '#fff6cc');   // swaddle
    if (v) { P(1, 9, 2, 2, '#ffdcb4'); P(8, 9, 2, 2, '#ffdcb4'); } else { P(4, 10, 3, 1, '#e8b840'); }
    return FRU[v] = cv; }
  const FR = [[0.31, 0.3], [0.46, 0.2], [0.63, 0.26], [0.74, 0.38], [0.21, 0.44], [0.38, 0.41], [0.55, 0.37], [0.68, 0.5], [0.47, 0.5]];
  let deadCv = null; function deadTree(im) { if (deadCv) return deadCv; const w = im.width, h = im.height, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.drawImage(im, 0, 0); const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 8) continue; const r = d[i], gg = d[i + 1], b = d[i + 2], L = r * 0.3 + gg * 0.55 + b * 0.15, leaf = gg > r * 1.08 && gg > b * 0.95, x = (i / 4) % w, y = Math.floor(i / 4 / w), hh = hash(x, y, 910);
      if (leaf) { if (hh < 0.74) { d[i + 3] = 0; continue; } d[i] = 120 + L * 0.3; d[i + 1] = 92 + L * 0.2; d[i + 2] = 52; } else { d[i] = L * 0.82 + 12; d[i + 1] = L * 0.72 + 8; d[i + 2] = L * 0.6 + 6; } }
    g.putImageData(id, 0, 0); return deadCv = cv; }
  function drawTree(g, s, R, r) {
    const f = st(), im = r.im, w = im.width, h = im.height; if (!f) { g.drawImage(im, s.X, s.Y); return; } const tr = f.tree, t = R.t, py = r.py, gust = f.gust, px0 = s.X + w / 2, py0 = s.Y + py;
    g.save(); g.translate(Math.round(px0), Math.round(py0)); const ang = -tr.fall * 1.32; if (tr.fall > 0.001) { g.rotate(ang); g.translate(0, tr.fall * 3); }
    const sway = (img, al, amp) => { g.globalAlpha = al; const st0 = 6; for (let y = 0; y < h; y += st0) { const k = Math.pow(Math.max(0, (py * 0.9 - y) / (py * 0.9)), 1.3), o = Math.round((Math.sin(t * 0.9 + y * 0.016) * amp + Math.sin(t * 2.3 + y * 0.05) * amp * 0.25) * k * gust * (1 - tr.fall) + (tr.shake > 0 ? Math.sin(t * 40 + y * 0.2) * tr.shake * 2.4 * k : 0)); g.drawImage(img, 0, y, w, Math.min(st0, h - y), -w / 2 + o, y - py, w, Math.min(st0, h - y)); } g.globalAlpha = 1; };
    if (tr.vit < 0.999) { sway(deadTree(im), 1, 1.0); sway(im, clamp(tr.vit * 1.05 - 0.02, 0, 1), 1.3); } else sway(im, 1, 1.3);
    // fruit: little sleeping babies in the crown, swinging on their stems
    for (let i = 0; i < FR.length; i++) { const q = tr.fruit[i], gs = q.g; if (gs < 0.04) continue; const fx = -w / 2 + FR[i][0] * w, fy = -py + FR[i][1] * h * 0.9, k = Math.pow(Math.max(0, (py * 0.9 - (FR[i][1] * h * 0.9)) / (py * 0.9)), 1.3), o = Math.sin(t * 0.9 + (FR[i][1] * h * 0.9) * 0.016) * 1.3 * k * gust, sw = Math.sin(t * 1.6 + i * 1.7) * 0.18 * gust;
      g.save(); g.translate(Math.round(fx + o), Math.round(fy)); g.rotate(sw); g.scale(gs, gs); g.globalCompositeOperation = 'lighter'; blob(g, 0, 14, 28 + q.hit * 26, '255,236,150', 0.3 + q.hit * 0.55 + 0.12 * Math.sin(t * 2 + i)); g.globalCompositeOperation = 'source-over'; g.drawImage(fruitCv(i & 1), -11, 0, 22, 30); g.restore(); }
    g.restore();
    // aura + sparkles around the crown (the tree stays luminous: fainter when it is withered)
    if (tr.fall < 0.3) { const v = tr.vit * (1 - tr.fall), cx = px0, cy = py0 - h * 0.5; g.globalCompositeOperation = 'lighter'; blob(g, cx, cy, 130 + f.glow * 40, '160,255,190', (0.1 + f.glow * 0.18 + f.sparkle * 0.2) * v); blob(g, cx, cy - 20, 60, '255,240,170', (0.06 + f.sparkle * 0.14) * v);
      for (let q = 0; q < 26; q++) { const u = (t * (0.07 + hash(q, 1, 911) * 0.06) + hash(q, 2, 911)) % 1, ang = hash(q, 3, 911) * 6.28 + t * 0.35, rr = (0.25 + hash(q, 4, 911) * 0.75) * 100, X = cx + Math.cos(ang) * rr, Y = py0 - u * h * 0.9 + Math.sin(ang) * rr * 0.3 - 10; g.fillStyle = `rgba(${q & 1 ? '210,255,200' : '255,240,170'},${(1 - u) * 0.85 * v * (0.5 + f.sparkle * 0.5 + f.glow * 0.3)})`; g.fillRect(Math.round(X), Math.round(Y), 2, 2); }
      g.globalCompositeOperation = 'source-over'; }
  }
  // ---------------------------------------------------------------- cranes, koi, rabbits (depth-sorted)
  function crane(g, x, y, t, ph, face, mode) {   // mode 0 standing, 1 preening, 2 flying
    if (mode === 2) { const fl = Math.sin(t * 3.4 + ph), up = fl > 0 ? 3 : -2; px(g, x - 5, y, 11, 3, '#f8f8f4'); px(g, x + 5 * face, y - 1, 3, 2, '#f8f8f4'); px(g, x + 8 * face, y - 1, 2, 1, '#c82828'); px(g, x - 16, y + up - 3, 11, 2, '#fdfdfa'); px(g, x + 5, y + up - 3, 11, 2, '#fdfdfa'); px(g, x - 20, y + up - 1, 4, 1, '#222'); px(g, x + 16, y + up - 1, 4, 1, '#222'); px(g, x - 7 * face, y + 3, 5, 1, '#222'); return; }
    g.fillStyle = 'rgba(10,30,30,0.28)'; g.fillRect(Math.round(x - 6), Math.round(y - 1), 12, 3);
    px(g, x - 1, y - 9, 1, 9, '#3a2a2a'); px(g, x + 2, y - 9, 1, 9, '#3a2a2a');                                         // legs
    px(g, x - 5, y - 15, 11, 7, '#f6f6f2'); px(g, x - 6 * face, y - 13, 3, 3, '#262626'); px(g, x - 4, y - 16, 8, 1, '#ffffff');   // body + black tail
    const bob = mode === 1 ? 6 : Math.round(Math.sin(t * 1.2 + ph) * 1), nx = x + 4 * face; px(g, nx, y - 22 + bob, 2, 7 - bob, '#fafaf6'); px(g, nx + face, y - 24 + bob, 3, 3, '#fafaf6'); px(g, nx + face * 3, y - 23 + bob, 3, 1, '#d8a838'); px(g, nx + face, y - 25 + bob, 2, 1, '#d02828');   // neck, head, beak, crown
  }
  const rabbitPos = [[100.5, 44.5], [104.5, 48.5], [97.5, 46.5]];
  function drawables(D, R, x0, y0, W, Hh, sim) {
    const f = st(); if (!f) return; const gg = geo(), b = gg.box; if (R.cx < b[0] - 500 || R.cx > b[2] + 500 || R.cy < b[1] - 500 || R.cy > b[3] + 600) return; const t = R.t;
    // standing cranes at the ponds (they preen now and then and step through the water)
    for (const [i, c] of [[0, [115.6, 40.2]], [1, [117.4, 41.7]], [2, [101.4, 46.3]]]) { const x = c[0] * T + Math.sin(t * 0.08 + i * 2) * 3, y = c[1] * T, X = R.wx(x, y), Y = R.wy(x, y, ground(x, y) - 1); if (!inView(R, X, Y, 40)) continue; const mode = Math.floor((t + i * 7) / 6) % 3 === 0 ? 1 : 0, lifting = f.landings.length > 0 && i < 2;
      if (lifting) continue; D.push([x + y + 0.1, 5, { draw: g => crane(g, X, Y, t, i * 2.3, i & 1 ? -1 : 1, mode) }]); }
    // landing cranes: glide in, stand and lift off
    for (const L of f.landings) { const u = L.t / L.dur; for (let q = 0; q < L.n; q++) { const ox = (q - L.n / 2) * 12, oy = (q % 2) * 8 - 4, x = L.at[0] + ox, y = L.at[1] + oy; let X = R.wx(x, y), Y = R.wy(x, y, ground(x, y) - 1), mode = 0, face = q & 1 ? -1 : 1;
      if (u < 0.22) { const k = 1 - sm(u / 0.22); X += k * (-140 - q * 20); Y -= k * (150 + q * 14); mode = 2; face = 1; } else if (u > 0.82) { const k = sm((u - 0.82) / 0.18); X += k * (150 + q * 20); Y -= k * (170 + q * 16); mode = 2; face = 1; } else mode = (Math.floor((t + q * 3) / 5) % 3 === 0) ? 1 : 0;
      if (!inView(R, X, Y, 60)) continue; D.push([x + y + 0.1 + (mode === 2 ? 20 : 0), 5, { draw: g => crane(g, X, Y, t, q * 1.9, face, mode) }]); } }
    // rabbits on the lawn
    for (let q = 0; q < rabbitPos.length; q++) { const cyc = 9 + q * 1.7, n = Math.floor((t + q * 3.1) / cyc), u = ((t + q * 3.1) % cyc) / cyc, hop = u < 0.3 ? Math.abs(Math.sin(u * 60)) * 4 : 0, mv = u < 0.3 ? u / 0.3 : 1, dx = (hash(n, q, 920) - 0.5) * 30, dy = (hash(n, q, 921) - 0.5) * 20, x = rabbitPos[q][0] * T + dx * mv, y = rabbitPos[q][1] * T + dy * mv;
      const walk = TWM.id(Math.floor(x / T), Math.floor(y / T)); if (!TWM.WALK[walk]) continue; const X = R.wx(x, y), Y = R.wy(x, y, ground(x, y)); if (!inView(R, X, Y, 40)) continue; D.push([x + y + 0.2, 5, { draw: g => { g.fillStyle = 'rgba(8,24,24,0.3)'; g.fillRect(Math.round(X - 4), Math.round(Y), 8, 2); const c = q === 1 ? '#f4f0e8' : '#d8cfc2'; px(g, X - 3, Y - 5 - hop, 6, 4, c); px(g, X + (dx > 0 ? 2 : -4), Y - 7 - hop, 2, 3, c); px(g, X + (dx > 0 ? 1 : -3), Y - 9 - hop, 1, 3, c); px(g, X - (dx > 0 ? 4 : -3), Y - 4 - hop, 2, 2, '#fff'); } }]); }
    // falling fruit, sinking fruit, feast tables
    for (const q of f.drops) { const u = q.t / 0.9, z = q.z * (1 - Math.min(1, u * u)), X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, ground(q.x, q.y)) - z; if (!inView(R, X, Y, 40) || q.t < 0 || u > 1.2) continue; D.push([q.x + q.y + 0.3, 5, { draw: g => { g.globalCompositeOperation = 'lighter'; blob(g, X, Y + 6, 16, '255,236,150', 0.4); g.globalCompositeOperation = 'source-over'; g.drawImage(fruitCv(1), Math.round(X - 8), Math.round(Y - 8), 16, 22); } }]); }
    for (const q of f.sinks) { const u = q.t / 5, X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, ground(q.x, q.y)); if (!inView(R, X, Y, 60)) continue; D.push([q.x + q.y + 0.3, 5, { draw: g => { const k = clamp(u * 2.2, 0, 1); if (k < 1) { g.save(); g.beginPath(); g.rect(X - 8, Y - 16, 16, 16 + 2); g.clip(); g.globalAlpha = 1 - k * 0.6; g.drawImage(fruitCv(1), Math.round(X - 5), Math.round(Y - 12 + k * 10)); g.restore(); }
      g.globalCompositeOperation = 'lighter'; for (const [r, col] of [[0, '255,220,110'], [1, '110,230,140'], [2, '110,190,255'], [3, '255,120,100'], [4, '250,250,250']]) { const e = clamp(u * 1.3 - r * 0.12, 0, 1); if (e > 0 && e < 1) ring(g, X, Y, 4 + e * 26, 2 + e * 12, `rgba(${col},${(1 - e) * 0.85})`, 2); } blob(g, X, Y - 10 - u * 40, 20, '255,246,200', (1 - u) * 0.5); g.globalCompositeOperation = 'source-over'; } }]); }
    if (f.feast > 0.05) { const [tx, ty] = trunkW(); for (const [dx, dy] of [[-20, 20], [0, 28], [20, 20]]) { const x = tx + dx, y = ty + dy, X = R.wx(x, y), Y = R.wy(x, y, ground(x, y)); if (!inView(R, X, Y, 40)) continue; D.push([x + y + 0.15, 5, { draw: g => { g.globalAlpha = f.feast; g.fillStyle = 'rgba(8,24,24,0.3)'; g.fillRect(Math.round(X - 13), Math.round(Y - 1), 26, 4); px(g, X - 12, Y - 8, 24, 3, '#8a4a28'); px(g, X - 12, Y - 5, 24, 1, '#5a2a14'); px(g, X - 11, Y - 5, 2, 5, '#6a3a1c'); px(g, X + 9, Y - 5, 2, 5, '#6a3a1c'); px(g, X - 9, Y - 11, 4, 3, '#f0c850'); px(g, X - 3, Y - 11, 5, 3, '#ffb6c8'); px(g, X + 4, Y - 11, 4, 3, '#a8e8b0'); px(g, X, Y - 13, 2, 2, '#fff6cc');
        for (let s = 0; s < 3; s++) { const u = (R.t * 0.4 + s / 3 + dx) % 1; g.fillStyle = `rgba(255,255,255,${(1 - u) * 0.4})`; g.fillRect(Math.round(X - 6 + s * 6 + Math.sin(u * 6) * 2), Math.round(Y - 14 - u * 14), 2, 2); } g.globalAlpha = 1; } }]); } }
  }
  // ---------------------------------------------------------------- water: cascades, ponds (lotus, koi), mist
  function drawWater(g, R, f, x0, y0, W, Hh) {
    const gg = geo(), t = R.t, N = TWM.N, surge = 1 + f.rain * 0.7;
    for (const q of gg.falls) { const i = q.i, j = q.j, X = A.SX(i, j), Y = A.SY(i, j, TWM.H[q.k]), cxf = X + (q.side ? -16 : 16), top = Y + 24, hh = q.drop * 16; if (cxf < x0 - 40 || cxf > x0 + W + 40 || top > y0 + Hh + 40 || top + hh < y0 - 40) continue;
      const n = Math.min(14, 6 + q.drop * 2);
      for (let s = 0; s < n; s++) { const u = hash(i * 7 + s, j, 960), spd = 52 + u * 36 + q.drop * 3, y = ((t * spd + u * 200) % (hh + 6)), xx = cxf + (hash(s, i + j, 961) - 0.5) * 26, yTop = top + (q.side ? (xx - cxf + 14) * 0.5 - 1 : -(xx - cxf - 14) * 0.5 - 1), yy = Math.max(yTop, top - 4 + y + 2); if (yy > top + hh + 2) continue; g.fillStyle = `rgba(${240 + (u * 15) | 0},255,252,${0.55 * Math.min(1, surge * 0.8)})`; g.fillRect(Math.round(xx), Math.round(yy), 1, 3 + (s & 3)); }
      const baseY = top + hh + 6; mist(g, cxf, baseY + 2, 30 + q.drop * 3, 9, 0.16 * (f.mist + 0.3) * (q.rim ? 1.5 : 1), '230,255,248'); for (let s = 0; s < 5; s++) { const u = (t * 0.5 + s / 5 + hash(i, j, 962)) % 1; blob(g, cxf + (hash(s, j, 963) - 0.5) * 36, baseY - u * 26, 8 + u * 10, '236,255,250', (1 - u) * 0.2); }
      if (q.rim) for (let s = 0; s < 9; s++) { const u = (t * 0.35 + s / 9) % 1; blob(g, cxf + 6 + u * 16, baseY + 18 + u * 44, 10 + u * 12, '236,250,248', (1 - u) * 0.22); }
      // rainbow-spray where the sun catches the falls
      if (q.drop >= 3) { g.globalCompositeOperation = 'lighter'; blob(g, cxf, baseY - 6, 20, '255,230,230', 0.05 + 0.05 * Math.sin(t * 1.3 + i)); g.globalCompositeOperation = 'source-over'; } }
    const F = Fm(); for (const k of F.stream) { if (TWM.MAT[k] !== TWM.M.POOL) continue; const i = k % N, j = Math.floor(k / N), X = A.SX(i, j), Y = A.SY(i, j, TWM.H[k]) + 16; if (!inView(R, X, Y, 40)) continue;
      for (let s = 0; s < 2; s++) { const u = (t * 0.4 + hash(i, j, 964) + s * 0.5) % 1; ring(g, X + (hash(i, j, 965) - 0.5) * 14, Y, 3 + u * 14, 1.5 + u * 7, `rgba(240,255,252,${(1 - u) * 0.4})`, 1); }
      if (hash(i, j, 966) > 0.5) { const u = (t * 0.07 + hash(i, j, 967)) % 1; g.fillStyle = `rgba(255,${190 + (u * 40 | 0)},210,0.8)`; g.fillRect(Math.round(X - 8 + u * 16), Math.round(Y - 2 + Math.sin(u * 9) * 1.5), 2, 1); } }
    // koi in the lotus pond and the west pond: slow elliptical swims
    for (const [pc, n] of [[F.pools.lotus, 5], [F.pools.west, 3], [F.pools.low, 2]]) for (let q = 0; q < n; q++) { const a = t * (0.16 + q * 0.04) * (q & 1 ? -1 : 1) + q * 1.7, cx = pc[0] * T, cy = pc[1] * T, rx = (n > 3 ? 11 : 7), ry = (n > 3 ? 7 : 5), x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, dxn = -Math.sin(a) * (q & 1 ? -1 : 1);
      const X = R.wx(x, y), Y = R.wy(x, y, TWM.H[TWM.id(Math.floor(x / T), Math.floor(y / T))] * 16 / 16 * 1 + 0) + 1; if (!inView(R, X, Y, 30)) continue; const col = ['#ff8a3a', '#fff4e8', '#ff5a30', '#ffd070', '#f4f0f0'][q % 5]; g.globalAlpha = 0.9; px(g, X - 3, Y - 1, 6, 2, col); px(g, X + (dxn > 0 ? -5 : 3), Y - 1, 2, 2, col); px(g, X + (dxn > 0 ? 3 : -4), Y, 1, 1, '#222'); g.globalAlpha = 1; }
  }
  // ---------------------------------------------------------------- sky: cloud banks, shadows, mist, light shafts, rain, rainbow
  function drawSky(g, R, f, x0, y0, W, Hh) {
    const t = R.t, b = geo().box, w = b[2] - b[0], dark = clamp(f.rain * 0.4, 0, 0.5);
    g.globalCompositeOperation = 'multiply'; for (let q = 0; q < 4; q++) { const u = ((t * (6 + q * 1.5) + q * 330) % (w + 500)), X = b[0] - 250 + u, Y = b[1] + 300 + q * 90; if (X < x0 - 200 || X > x0 + W + 200 || Y < y0 - 150 || Y > y0 + Hh + 150) continue; mist(g, X, Y, 140 + q * 22, 50 + q * 8, 0.07 + dark * 0.1, '90,130,130'); } g.globalCompositeOperation = 'source-over';
    for (let q = 0; q < 9; q++) { const lay = q % 3, sp = 2 + lay * 2.4, u = ((t * sp + q * 280 + hash(q, 1, 970) * 300) % (w + 700)), X = b[0] - 350 + u, Y = b[1] + 140 + lay * 80 + (q * 37 % 70) + Math.sin(t * 0.15 + q) * 6; if (X < x0 - 260 || X > x0 + W + 260 || Y < y0 - 120 || Y > y0 + Hh + 120) continue; const rr = 80 + hash(q, 2, 970) * 60, al = (0.2 + lay * 0.05) * (1 + dark); const col = dark > 0.1 ? '170,190,196' : '252,255,255'; mist(g, X, Y, rr, rr * 0.3, al, col); mist(g, X + rr * 0.5, Y - 8, rr * 0.7, rr * 0.22, al * 0.9, col); mist(g, X - rr * 0.45, Y - 4, rr * 0.6, rr * 0.2, al * 0.8, col); }
    const F = Fm(); for (let q = 0; q < 8; q++) { const n = F.tiles[Math.floor(hash(q, 3, 971) * F.tiles.length)], i = n % TWM.N, j = Math.floor(n / TWM.N), X = A.SX(i, j) + Math.sin(t * 0.12 + q * 1.7) * 36 + ((t * 3 + q * 50) % 60) - 30, Y = A.SY(i, j, TWM.H[n]) + 8; if (!inView(R, X, Y, 90)) continue; mist(g, X, Y, 80, 14, 0.07 + 0.16 * f.mist, '236,255,248'); }
    // morning light shafts through the great crown onto the court
    if (f.rain < 0.3) { const [tx, ty] = trunkW(), X0 = R.wx(tx, ty), Y0 = R.wy(tx, ty, ground(tx, ty)); if (inView(R, X0, Y0, 300)) for (let q = 0; q < 4; q++) { const X = X0 - 120 + q * 46 + Math.sin(t * 0.13 + q) * 14, gr = g.createLinearGradient(X, Y0 - 250, X + 70, Y0 + 20); gr.addColorStop(0, 'rgba(255,250,210,0.12)'); gr.addColorStop(1, 'rgba(255,250,210,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(X, Y0 - 250); g.lineTo(X + 26, Y0 - 250); g.lineTo(X + 100, Y0 + 20); g.lineTo(X + 60, Y0 + 20); g.fill(); } }
    if (f.rain > 0.03) { const n = Math.floor(f.rain * (W / 3)); g.strokeStyle = `rgba(200,230,236,${0.2 + f.rain * 0.3})`; g.beginPath(); for (let q = 0; q < n; q++) { const u = hash(q, 1, 972), v = hash(q, 2, 972), X = x0 + ((u * W + t * 40) % W), Y = y0 + ((v * Hh + t * 330) % Hh); g.moveTo(X, Y); g.lineTo(X - 3, Y + 9); } g.stroke(); g.fillStyle = `rgba(40,70,76,${dark * 0.3})`; g.fillRect(x0, y0, W, Hh); }
    if (f.rainbow > 0.03) { const [tx, ty] = trunkW(), cx = R.wx(tx, ty) + 50, cy = R.wy(tx, ty, 0) + 120; for (let q = 0; q < 6; q++) { g.strokeStyle = `rgba(${['255,100,100', '255,180,80', '255,238,110', '130,226,130', '110,180,255', '180,130,236'][q]},${0.22 * f.rainbow})`; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, cy, 320 - q * 5, 220 - q * 4, 0, 3.4, 6.0); g.stroke(); } }
    if (f.flash > 0.05) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(210,255,230,${f.flash * 0.18})`; g.fillRect(x0, y0, W, Hh); g.globalCompositeOperation = 'source-over'; }
  }
  // ---------------------------------------------------------------- ambient life: petals, pollen, butterflies, fireflies, incense, birds
  function drawLife(g, R, f, x0, y0, W, Hh) {
    const t = R.t, gg = geo(), N = TWM.N, wind = f.wind, boost = 1 + f.petalBoost * 2.2 + (f.swirl ? 0.5 : 0);
    for (let q = 0; q < 110 * boost; q++) { const u = hash(q, 1, 980), v = hash(q, 2, 980), X = x0 + ((u * (W + 400) + t * (8 + wind * 6) * (1 + v)) % (W + 400)) - 200 + Math.sin(t * (0.8 + v) + q) * 10, Y = y0 + ((v * (Hh + 200) + t * (10 + v * 12)) % (Hh + 200)) - 100; if (!inView(R, X, Y, 4)) continue; g.fillStyle = q % 3 ? '#ffc4d8' : q % 5 ? '#fff4f8' : '#c8f0d0'; g.fillRect(Math.round(X), Math.round(Y), 2, 1); if (q % 4 === 0) g.fillRect(Math.round(X) + 1, Math.round(Y) - 1, 1, 1); }
    g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 40; q++) { const u = hash(q, 1, 981), v = hash(q, 2, 981), X = x0 + ((u * W + t * 4) % W), Y = y0 + ((v * Hh - t * 6 + Hh * 4) % Hh); g.fillStyle = `rgba(255,246,190,${0.25 + 0.3 * Math.sin(t * 1.1 + q)})`; g.fillRect(Math.round(X), Math.round(Y), 1, 1); } g.globalCompositeOperation = 'source-over';
    // butterflies over the lawn
    for (let q = 0; q < 14; q++) { const k = gg.lawn[Math.floor(hash(q, 4, 982) * Math.max(1, gg.lawn.length))]; if (k === undefined) break; const i = k % N, j = Math.floor(k / N), X = A.SX(i, j) + Math.sin(t * 0.5 + q * 2.1) * 36, Y = A.SY(i, j, TWM.H[k]) + 10 - 14 - Math.abs(Math.sin(t * 0.9 + q)) * 12 + Math.sin(t * 1.3 + q) * 6; if (!inView(R, X, Y, 20)) continue; const fl = Math.sin(t * 14 + q * 3) > 0 ? 2 : 1, col = ['#ffd0e0', '#fff4a0', '#ffffff', '#c8e8ff', '#ffb0d0'][q % 5]; px(g, X - fl, Y, fl, 2, col); px(g, X + 1, Y, fl, 2, col); px(g, X, Y, 1, 2, '#3a2a30'); }
    // fireflies and glow-motes at dusk
    const night = R.dark || 0; if (night > 0.25) for (let q = 0; q < 34; q++) { const k = gg.lawn[Math.floor(hash(q, 5, 983) * Math.max(1, gg.lawn.length))]; if (k === undefined) break; const i = k % N, j = Math.floor(k / N), X = A.SX(i, j) + Math.sin(t * 0.4 + q * 1.3) * 30, Y = A.SY(i, j, TWM.H[k]) + 6 - 10 - ((t * 5 + q * 9) % 40) * 0.4 + Math.sin(t * 0.7 + q) * 8; if (!inView(R, X, Y, 20)) continue; const a = (0.4 + 0.6 * Math.max(0, Math.sin(t * 1.7 + q * 2.3))) * night; g.globalCompositeOperation = 'lighter'; blob(g, X, Y, 7, q & 1 ? '190,255,170' : '170,255,230', 0.4 * a); px(g, X, Y, 1, 1, `rgba(255,255,220,${a})`); g.globalCompositeOperation = 'source-over'; }
    // incense curling from the burners
    for (const [kx, ky] of gg.kilns) { const X = R.wx(kx, ky), Y = R.wy(kx, ky, ground(kx, ky)) - 22; if (!inView(R, X, Y, 60)) continue; for (let s = 0; s < 6; s++) { const u = (t * 0.28 + s / 6) % 1; blob(g, X + Math.sin(u * 7 + s) * (3 + u * 8) + wind * u * 6, Y - u * 34, 3 + u * 6, '236,244,240', (1 - u) * 0.3); } }
  }
  function drawBirds(g, R, f, x0, y0, W, Hh) {
    const t = R.t, b = geo().box, [tx, ty] = trunkW(), HX = R.wx(Fm().hall[0] * T, Fm().hall[1] * T), HY = R.wy(Fm().hall[0] * T, Fm().hall[1] * T, 120);
    for (let q = 0; q < 6; q++) { const ang = t * (0.25 + q * 0.02) + q * 1.1, X = HX + Math.cos(ang) * (70 + q * 8), Y = HY - 30 + Math.sin(ang) * (22 + q * 3) - q * 6; if (!inView(R, X, Y, 20)) continue; const c = q & 1 ? '#f4f4f0' : '#e8e2d8', up = Math.sin(t * 9 + q) > 0 ? 2 : -1, fc = Math.cos(ang + 1.57) >= 0 ? 1 : -1; px(g, X - 1, Y, 3, 2, c); px(g, X - 5, Y + up - 1, 4, 1, c); px(g, X + 2, Y + up - 1, 4, 1, c); px(g, X + fc * 2, Y - 1, 2, 1, c); }   // white doves circling the hall
    for (let q = 0; q < 5; q++) { const u = ((t * (14 + q * 3) + q * 400) % (b[2] - b[0] + 600)), X = b[0] - 300 + u, Y = b[1] + 300 + q * 50 + Math.sin(t * 0.7 + q) * 12 + u * 0.1; if (!inView(R, X, Y, 20)) continue; const up = Math.sin(t * 9 + q) > 0 ? 2 : -1, c = q & 1 ? '#3c5a6a' : '#6a4a3a'; px(g, X - 1, Y, 3, 2, c); px(g, X - 5, Y + up - 1, 4, 1, c); px(g, X + 2, Y + up - 1, 4, 1, c); }
    for (let q = 0; q < 2; q++) { const u = ((t * 8 + q * 900) % (b[2] - b[0] + 500)), X = b[2] + 150 - u, Y = b[1] + 380 + q * 80 + Math.sin(t * 0.3 + q) * 18 - u * 0.1; if (!inView(R, X, Y, 20)) continue; crane(g, X, Y, t, q * 3, -1, 2); }
    for (const q of f.flocks) { if (q.t < 0) continue; const X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, 0) - (q.z || 30) - q.t * 4; if (!inView(R, X, Y, 20)) continue; const up = Math.sin(t * 10 + q.ph) > 0 ? 2 : -1, c = q.kind === 'dove' ? '#f6f6f2' : (Math.floor(q.ph) % 2 ? '#3a5a6a' : '#f0d8b8'); px(g, X - 1, Y, 3, 2, c); px(g, X - 5, Y + up - 1, 4, 1, c); px(g, X + 2, Y + up - 1, 4, 1, c); }
  }
  // ---------------------------------------------------------------- magic of the signature
  function actorXY(R, a, lift) { return [R.wx(a.x, a.y), R.wy(a.x, a.y, a.gz + (a.lift || 0) + (lift || 0))]; }
  function drawMagic(g, R, f, x0, y0, W, Hh) {
    const t = R.t, tr = f.tree, [tx, ty] = trunkW(), TX = R.wx(tx, ty), TY = R.wy(tx, ty, ground(tx, ty)); if (!inView(R, TX, TY, 420)) return;
    g.globalCompositeOperation = 'lighter';
    // ground aura ring and qi swirl around the trunk
    const base = 0.16 + f.glow * 0.3 + f.sparkle * 0.2, v = tr.vit * (1 - tr.fall) + 0.1; mist(g, TX, TY + 4, 74, 30, base * v, '160,255,200'); ring(g, TX, TY + 4, 52, 21, `rgba(190,255,200,${base * 1.2 * v})`, 1);
    for (let q = 0; q < 14; q++) { const a = t * 0.5 + q * 0.449, h = (q / 14), X = TX + Math.cos(a) * (46 - h * 18), Y = TY - 4 - h * 110 + Math.sin(a) * 16; blob(g, X, Y, 6, q & 1 ? '255,240,170' : '170,255,200', 0.4 * base * 3 * v); }
    // root veins: glowing lines along the ground that creep outward as the tree revives
    if (tr.roots > 0.02) { g.strokeStyle = `rgba(255,236,150,${0.7 * tr.roots})`; g.lineWidth = 2; for (let q = 0; q < 9; q++) { const ang = q * 0.7 + hash(q, 1, 990) * 0.5, len = (30 + hash(q, 2, 990) * 90) * tr.roots; g.beginPath(); let X = TX, Y = TY + 2; g.moveTo(X, Y); for (let s = 1; s <= 6; s++) { const k = s / 6; X = TX + Math.cos(ang + Math.sin(k * 4 + q) * 0.25) * len * k; Y = TY + 2 + Math.sin(ang + Math.sin(k * 4 + q) * 0.25) * len * k * 0.5; g.lineTo(X, Y); } g.stroke(); const pu = (t * 0.6 + q * 0.13) % 1; blob(g, TX + Math.cos(ang) * len * pu, TY + 2 + Math.sin(ang) * len * pu * 0.5, 7, '255,246,190', 0.6 * tr.roots); } }
    // chant: rings and floating runes before the hall
    if (f.chant > 0.03) { const hx = Fm().hall[0] * T, hy = Fm().hall[1] * T, X = R.wx(hx, hy), Y = R.wy(hx, hy, ground(hx, hy)); for (let q = 0; q < 3; q++) { const u = (t * 0.4 + q / 3) % 1; ring(g, X, Y, 12 + u * 50, 5 + u * 20, `rgba(255,236,160,${(1 - u) * 0.6 * f.chant})`, 1.5); } for (let q = 0; q < 8; q++) { const u = (t * 0.3 + q / 8) % 1, a = q * 0.785 + t * 0.4; g.fillStyle = `rgba(255,240,170,${(1 - u) * 0.9 * f.chant})`; g.fillRect(Math.round(X + Math.cos(a) * 26), Math.round(Y - 8 - u * 50 + Math.sin(a) * 8), 3, 4); } }
    // swirl of leaves: a ring of leaves winding up round the tree
    if (f.swirl > 0) { const k = Math.min(1, (S_t() - f.swirlAt) / 2) * (1 - clamp((S_t() - f.swirlAt - 12) / 3, 0, 1)); for (let q = 0; q < 40; q++) { const a = t * 1.6 + q * 0.5, h = (q / 40 + t * 0.05) % 1, r2 = 60 - h * 24; g.fillStyle = `rgba(${q & 1 ? '190,255,170' : '255,200,220'},${0.9 * k})`; g.fillRect(Math.round(TX + Math.cos(a) * r2), Math.round(TY - h * 120 + Math.sin(a) * r2 * 0.36), 3, 2); } }
    // talisman circle on the ground (Zhenyuan's art: gold and jade) with turning glyph ticks
    if (f.talisman > 0.02) { const cx = R.wx(P().plaza[0], P().plaza[1]), cy = R.wy(P().plaza[0], P().plaza[1], ground(P().plaza[0], P().plaza[1])) - 2, a = f.talisman, rot = t * 0.6; mist(g, cx, cy, 100, 42, 0.16 * a, '255,226,130'); for (const [rx, ry, col, w] of [[92, 38, '255,226,120', 2], [74, 30, '150,255,200', 1.5], [46, 19, '255,246,190', 1.5]]) ring(g, cx, cy, rx * Math.min(1, a * 1.5), ry * Math.min(1, a * 1.5), `rgba(${col},${0.8 * a})`, w);
      for (let q = 0; q < 24; q++) { const ang = rot + q * 0.2618, rr0 = 76, rr1 = 90; g.strokeStyle = `rgba(255,236,150,${0.75 * a})`; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + Math.cos(ang) * rr0, cy + Math.sin(ang) * rr0 * 0.41); g.lineTo(cx + Math.cos(ang) * rr1, cy + Math.sin(ang) * rr1 * 0.41); g.stroke(); }
      g.strokeStyle = `rgba(150,255,200,${0.7 * a})`; g.lineWidth = 1.5; g.beginPath(); for (let q = 0; q <= 5; q++) { const ang = -rot * 0.8 + q * 2.513, X = cx + Math.cos(ang) * 60, Y = cy + Math.sin(ang) * 60 * 0.41; q ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke(); }
    // ropes of light from Zhenyuan's sleeve to each bound pilgrim, with loops round their waists
    if (f.bind.on > 0.02 && window.TWS) { const src = TWS.agents.find(a => a.id === f.bind.src), a0 = f.bind.on; for (const ag of TWS.agents) { if (ag.biome !== 'ntq' || ag.role !== 'actor' || ag.gone || ag.hidden || !f.bind.ids.length) continue; const rid = TWS.biomes.ntq.run && Object.entries(TWS.biomes.ntq.run.actors).find(([, v]) => v === ag); if (!rid || !f.bind.ids.includes(rid[0])) continue; const [X, Y] = actorXY(R, ag, 12), [SX, SY] = src ? actorXY(R, src, 22) : [TX, TY - 120];
      g.strokeStyle = `rgba(255,222,110,${0.85 * a0})`; g.lineWidth = 2; g.beginPath(); for (let s = 0; s <= 14; s++) { const k = s / 14, x = SX + (X - SX) * k + Math.sin(k * 9 + t * 5) * 6 * Math.sin(k * 3.14), y = SY + (Y - SY) * k - Math.sin(k * 3.14) * 14; s ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.strokeStyle = `rgba(160,255,210,${0.5 * a0})`; g.lineWidth = 1; g.stroke();
      for (let q = 0; q < 3; q++) ring(g, X, Y + 6 - q * 4, 8, 3, `rgba(255,236,150,${0.9 * a0})`, 2); blob(g, X, Y, 18, '255,230,140', 0.3 * a0); } }
    // Guanyin: white-gold light from above, falling lotus petals
    if (f.gy > 0.02 && window.TWS) { const gy = TWS.agents.find(a => a.biome === 'ntq' && a.char === 'guanyin' && !a.gone && !a.hidden); if (gy) { const [X, Y] = actorXY(R, gy, 20); blob(g, X, Y - 10, 120, '255,250,230', 0.28 * f.gy); blob(g, X, Y - 20, 46, '255,255,255', 0.34 * f.gy); for (let q = 0; q < 5; q++) { const a = q * 1.257 + t * 0.3; g.strokeStyle = `rgba(255,248,214,${0.3 * f.gy})`; g.lineWidth = 2; g.beginPath(); g.moveTo(X, Y - 20); g.lineTo(X + Math.cos(a) * 130, Y - 20 + Math.sin(a) * 70); g.stroke(); } ring(g, X, Y + 30, 40 + Math.sin(t * 2) * 3, 14, `rgba(255,236,210,${0.7 * f.gy})`, 2); } }
    if (f.lotus > 0.02) for (let q = 0; q < 70; q++) { const u = hash(q, 1, 991), v2 = hash(q, 2, 991), X = TX - 220 + ((u * 440 + t * 10) % 440) + Math.sin(t + q) * 8, Y = TY - 260 + ((v2 * 300 + t * (18 + v2 * 10)) % 330); g.fillStyle = `rgba(${q & 1 ? '255,190,214' : '255,250,246'},${0.85 * f.lotus})`; g.fillRect(Math.round(X), Math.round(Y), 3, 2); g.fillRect(Math.round(X) + 1, Math.round(Y) - 1, 1, 1); }
    // sweet dew: bright droplets pouring on the tree, green sparks where they land
    if (f.nectar > 0.02) { for (let q = 0; q < 60; q++) { const u = hash(q, 1, 992), v2 = hash(q, 2, 992), X = TX + (u - 0.5) * 120 + Math.sin(t * 2 + q) * 3, Y = TY - 190 + ((v2 * 190 + t * (60 + v2 * 40)) % 190); g.fillStyle = `rgba(${q & 1 ? '220,255,240' : '190,255,210'},${0.9 * f.nectar})`; g.fillRect(Math.round(X), Math.round(Y), 1, 3); }
      blob(g, TX, TY - 120, 100, '200,255,225', 0.3 * f.nectar); for (let q = 0; q < 14; q++) { const u = (t * 0.8 + q / 14) % 1, a = q * 0.449; blob(g, TX + Math.cos(a) * u * 60, TY + Math.sin(a) * u * 24, 8, '210,255,200', (1 - u) * 0.5 * f.nectar); } }
    // the wave of life: a ring of light sweeping outward over the terrain
    if (S_t() - f.wave < 4.5 && f.wave > 0) { const u = (S_t() - f.wave) / 4.5; for (let q = 0; q < 3; q++) { const e = clamp(u * 1.15 - q * 0.06, 0, 1); if (e > 0 && e < 1) { ring(g, TX, TY + 6, 20 + e * 460, 8 + e * 210, `rgba(${q ? '170,255,210' : '255,244,170'},${(1 - e) * 0.8})`, 5 - q * 1.5); } } blob(g, TX, TY - 60, 160 * (1 - u * 0.5), '255,250,200', (1 - u) * 0.4); }
    // bursts
    for (const bb of f.bursts) { const X = R.wx(bb.x, bb.y), Y = R.wy(bb.x, bb.y, ground(bb.x, bb.y)), a = bb.t / 2.2; if (!inView(R, X, Y, 140) || a > 1) continue;
      if (bb.kind === 'gold') { blob(g, X, Y - 20, 40 + a * 90, '255,224,130', (1 - a) * 0.6); ring(g, X, Y - 6, 10 + a * 120, 4 + a * 48, `rgba(255,236,160,${(1 - a) * 0.8})`, 3); }
      else if (bb.kind === 'jade') { blob(g, X, Y - 20, 36 + a * 100, '150,255,200', (1 - a) * 0.6); ring(g, X, Y - 6, 8 + a * 110, 3 + a * 44, `rgba(190,255,220,${(1 - a) * 0.9})`, 3); for (let q = 0; q < 10; q++) { const aa = q * 0.628; blob(g, X + Math.cos(aa) * a * 60, Y - 10 - a * 30 + Math.sin(aa) * a * 22, 6, '230,255,230', (1 - a) * 0.7); } } }
    g.globalCompositeOperation = 'source-over';
    for (const bb of f.bursts) { if (bb.kind !== 'dust') continue; const X = R.wx(bb.x, bb.y), Y = R.wy(bb.x, bb.y, ground(bb.x, bb.y)), a = bb.t / 2.2; if (a > 1) continue; for (let q = 0; q < 8; q++) blob(g, X + (hash(q, 1, 993) - 0.5) * 50, Y - a * 26 - q * 2, 12 + a * 18, '196,206,186', (1 - a) * 0.4); }
    for (const q of f.dust) { if (q.t < 0) continue; const u = q.t / q.life, X = R.wx(q.x, q.y), Y = R.wy(q.x, q.y, ground(q.x, q.y)) - q.z - u * 20; if (!inView(R, X, Y, 60)) continue; blob(g, X, Y, 14 + u * 26, '196,206,186', (1 - u) * 0.3); }
    for (const q of f.leaves) { if (q.t < 0) continue; const u = q.t / q.life, X = R.wx(q.x, q.y) + Math.sin(q.t * 3 + q.x) * 8, Y = R.wy(q.x, q.y, ground(q.x, q.y)) - q.z * (1 - u * u) ; g.fillStyle = q.x & 1 ? '#7acd7a' : '#b8e89a'; g.globalAlpha = 1 - u * 0.5; g.fillRect(Math.round(X), Math.round(Y), 3, 2); g.globalAlpha = 1; }
    if (f.branch) { const b2 = f.branch, k = b2.t / 1.2, X = R.wx(b2.x, b2.y) + (TX - R.wx(b2.x, b2.y)) * k, Y = R.wy(b2.x, b2.y, 14) + (TY - 90 - R.wy(b2.x, b2.y, 14)) * k - Math.sin(k * 3.14) * 30; if (k < 1.1) { g.save(); g.translate(X, Y); g.rotate(t * 12); px(g, -5, 0, 10, 2, '#7a5230'); px(g, 2, -2, 3, 2, '#5aa060'); g.restore(); } }
  }
  const P = () => { const pp = [113, 47]; return { plaza: [pp[0] * T, pp[1] * T] }; };
  // ---------------------------------------------------------------- caption + story camera
  function drawCaption(g, R, f, x0, y0, W, Hh) {
    if (!f.caption) return; const left = f.capT - S_t(); if (left <= 0) return; const b = geo().box; if (R.cx < b[0] - 500 || R.cx > b[2] + 500 || R.cy < b[1] - 300 || R.cy > b[3] + 500) return;
    const a = clamp(left, 0, 1) * clamp((6 - left + 0.5), 0, 1) * 0 + clamp(Math.min(left, 1.2), 0, 1); g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.font = 'bold 18px "Segoe UI", "Noto Sans", Arial, sans-serif'; const w = Math.max(g.measureText(f.caption[0]).width, 260) + 44, X = x0 + W / 2, Y = y0 + Hh * 0.16;
    g.fillStyle = 'rgba(10,34,34,0.6)'; g.fillRect(Math.round(X - w / 2), Math.round(Y - 22), Math.round(w), 46); g.strokeStyle = 'rgba(170,255,210,0.7)'; g.strokeRect(Math.round(X - w / 2) + 0.5, Math.round(Y - 22) + 0.5, Math.round(w) - 1, 45);
    g.fillStyle = '#e8ffd8'; g.fillText(f.caption[0], X, Y); g.font = '12px "Segoe UI", "Noto Sans", Arial, sans-serif'; g.fillStyle = '#b8e0c4'; g.fillText(f.caption[1], X, Y + 16); g.restore();
  }
  function camera(R, f) {
    if (!window.TWS) return; const ph = TWS.biomes.ntq.phase; if (!(ph === 'sig' || ph === 'after')) return; if (R.t - (R.userT || -99) < 7) return; const b = geo().box, cx = R.cx, cy = R.cy; if (cx < b[0] - 200 || cx > b[2] + 200 || cy < b[1] - 200 || cy > b[3] + 300) return;
    const [tx, ty] = trunkW(); let X = R.wx(tx + 4, ty + 18), Y = R.wy(tx + 4, ty + 18, ground(tx, ty)) - 70; const air = TWS.agents.find(a => a.biome === 'ntq' && a.role === 'actor' && !a.gone && !a.hidden && (a.lift || 0) > 40);
    if (air && f.nectar < 0.1) { X = (X + R.wx(air.x, air.y)) / 2; Y = (Y + R.wy(air.x, air.y, air.gz + air.lift)) / 2; } const k = 1 - Math.exp(-1.5 * 0.016); R.cx += (X - R.cx) * k; R.cy += (Y - R.cy) * k; if (R.clamp) R.clamp();
  }
  function draw(g, S, R, x0, y0, W, Hh) {
    const f = st(); if (!f) return; const b = geo().box; if (x0 + W < b[0] - 400 || x0 > b[2] + 400 || y0 + Hh < b[1] - 400 || y0 > b[3] + 500) return;
    drawWater(g, R, f, x0, y0, W, Hh); drawSky(g, R, f, x0, y0, W, Hh); drawLife(g, R, f, x0, y0, W, Hh); drawBirds(g, R, f, x0, y0, W, Hh); drawMagic(g, R, f, x0, y0, W, Hh); drawCaption(g, R, f, x0, y0, W, Hh); camera(R, f);
  }
  function light(g, S, R, amt) {
    const f = st(); if (!f || amt < 0.05) return; const b = geo().box, F = Fm(); if (R.cx < b[0] - 600 || R.cx > b[2] + 600 || R.cy < b[1] - 500 || R.cy > b[3] + 600) return; const t = R.t, [tx, ty] = trunkW(), v = f.tree.vit * (1 - f.tree.fall) + 0.1;
    const TX = R.wx(tx, ty), TY = R.wy(tx, ty, ground(tx, ty)); blob(g, TX, TY - 90, 190, '150,255,190', (0.34 + f.glow * 0.2 + f.sparkle * 0.2) * amt * v * (0.9 + 0.1 * Math.sin(t * 1.6))); blob(g, TX, TY - 30, 90, '255,240,170', 0.2 * amt * v);
    const hx = F.hall[0] * T, hy = F.hall[1] * T, HX = R.wx(hx, hy), HY = R.wy(hx, hy, ground(hx, hy)) - 40; blob(g, HX, HY, 100, '255,206,130', 0.3 * amt);
    for (const l of F.lamps || []) { const x = (l[0] + 0.5) * T, y = (l[1] + 0.5) * T, X2 = R.wx(x, y), Y2 = R.wy(x, y, ground(x, y)) - 14; if (inView(R, X2, Y2, 60)) blob(g, X2, Y2, 42, '255,205,130', 0.26 * amt * (0.85 + 0.15 * Math.sin(t * 7 + l[0]))); }
    for (const p of [F.pools.lotus, F.pools.west]) { const X2 = R.wx(p[0] * T, p[1] * T), Y2 = R.wy(p[0] * T, p[1] * T, ground(p[0] * T, p[1] * T)); if (inView(R, X2, Y2, 80)) blob(g, X2, Y2, 54, '170,255,235', 0.18 * amt); }
    if (f.feast > 0.05) blob(g, TX, TY - 10, 160, '255,200,130', 0.3 * amt * f.feast); if (f.talisman > 0.05) blob(g, R.wx(113 * T, 47 * T), R.wy(113 * T, 47 * T, 0), 130, '255,226,140', 0.3 * amt * f.talisman); if (f.gy > 0.05) blob(g, TX, TY - 100, 220, '255,250,230', 0.3 * amt * f.gy);
  }
  TWFX.ntq = { drawables, draw, light, drawTree };
})();
