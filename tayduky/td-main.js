'use strict';
// ===== Tây Du Ký — page: chunked world rendering, depth sort with occluders, flowing water, story FX, beacons, place cards, day/night =====
const W = window.TD_WORLD, CH = window.TD_CHARS;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const V = { zoom: 2, cx: 0, cy: 0, vw: 0, vh: 0, chunks: {}, occ: {}, imgs: {}, last: 0, card: { biome: null, t: 0, shown: {} }, tod: 'auto', clock: 9 };
const Q = new URLSearchParams(location.search);

function img(src) { if (V.imgs[src]) return V.imgs[src]; const i = new Image(); i.src = src; V.imgs[src] = i; return i; }

// ---------------------------------------------------------------- chunks: ground canvas + water pixel lists (animated), occluder images
function chunk(i, j) {
  const k = i + ',' + j; if (V.chunks[k]) return V.chunks[k];
  const c = V.chunks[k] = { ready: false, cv: document.createElement('canvas'), water: null };
  const im = new Image(); im.onload = () => {
    c.cv.width = im.width; c.cv.height = im.height; const cg = c.cv.getContext('2d'); cg.drawImage(im, 0, 0);
    c.data = cg.getImageData(0, 0, im.width, im.height); c.base = new Uint8ClampedArray(c.data.data);
    const d = c.base, w = im.width, h = im.height, wat = new Uint8Array(w * h);
    for (let p = 0, q = 0; p < w * h; p++, q += 4) { const r = d[q], gg = d[q + 1], b = d[q + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), s = mx ? (mx - mn) / mx : 0;
      if (b > r + 30 && b >= gg - 30 && s > 0.28 && mx > 110) wat[p] = 1; }
    const list = [];
    for (let x = 0; x < w; x++) { let run = 0; for (let y = 0; y < h; y++) { run = wat[y * w + x] ? run + 1 : 0; if (wat[y * w + x]) list.push(x, y, 0); }
    }
    // waterfall = long vertical runs
    for (let n = 0; n < list.length; n += 3) { const x = list[n], y = list[n + 1]; let up = 0; while (y - up > 0 && wat[(y - up - 1) * w + x] && up < 30) up++; let dn = 0; while (y + dn < h - 1 && wat[(y + dn + 1) * w + x] && dn < 30) dn++; if (up + dn > 26) list[n + 2] = 1; }
    c.water = list; c.ready = true;
  };
  im.src = 'world/g_' + i + '_' + j + '.webp';
  const o = new Image(); o.onload = () => { V.occ[k] = o; }; o.onerror = () => { V.occ[k] = null; }; o.src = 'world/o_' + i + '_' + j + '.webp';
  return c;
}
function animateWater(c, t) {
  if (!c.ready || !c.water.length) return;
  const d = c.data.data, b = c.base, w = c.cv.width, L = c.water;
  for (let n = 0; n < L.length; n += 3) {
    const x = L[n], y = L[n + 1], i = (y * w + x) * 4;
    const hi = L[n + 2] ? (((y - t * 34 + (x % 3) * 4) % 11) + 11) % 11 < 2.2 : (((x * 0.5 + y - t * 7 + ((x * 7 + y * 13) % 5)) % 16) + 16) % 16 < 1.3;
    const k = hi ? (L[n + 2] ? 0.42 : 0.26) : 0;
    d[i] = b[i] + (255 - b[i]) * k; d[i + 1] = b[i + 1] + (255 - b[i + 1]) * k; d[i + 2] = b[i + 2] + (255 - b[i + 2]) * k;
  }
  c.cv.getContext('2d').putImageData(c.data, 0, 0);
}

// ---------------------------------------------------------------- pixel icons for bubbles (5 x 5)
const ICON = { note: ['00110', '00101', '00100', '11100', '11100'], dots: ['00000', '00000', '10101', '00000', '00000'], heart: ['01010', '11111', '11111', '01110', '00100'],
  excl: ['00100', '00100', '00100', '00000', '00100'], q: ['01110', '00010', '00110', '00000', '00100'] };
const ICOL = { note: '#5a3a8a', dots: '#4a3a3a', heart: '#e0405a', excl: '#d8402a', q: '#3a5a9a' };
function bubble(x, y, kind) {
  x = Math.round(x) - 5; y = Math.round(y) - 9;
  g.fillStyle = '#2b1a22'; g.fillRect(x - 1, y - 1, 11, 9); g.fillStyle = '#fff8ea'; g.fillRect(x, y, 9, 7); g.fillRect(x + 3, y + 7, 2, 1);
  g.fillStyle = '#2b1a22'; g.fillRect(x + 3, y + 8, 2, 1);
  const m = ICON[kind]; g.fillStyle = ICOL[kind];
  for (let r = 0; r < 5; r++) for (let k = 0; k < 5; k++) if (m[r][k] === '1') g.fillRect(x + 2 + k, y + 1 + r, 1, 1);
}

// ---------------------------------------------------------------- characters
function frameFor(a) {
  const C = CH[a.char]; if (!C) return null;
  let f = 0, flip = a.flip;
  if (C.views === 'd4') { f = a.dir; if (C.left) flip = !flip; }
  else if (C.views === 'v3') { f = a.dir === 0 ? 0 : a.dir === 3 ? 2 : 1; flip = !a.flip; }
  else f = 0;
  return [C, C.frames[Math.min(f, C.frames.length - 1)], flip];
}
function drawAgent(a) {
  const r = frameFor(a); if (!r) return; const [C, fr, flip] = r, im = img(C.src); if (!im.complete) return;
  const [fx, fy, fw, fh] = fr, bob = a.moving && Math.floor(a.step * 8) % 2 ? 1 : 0, bow = a.bow ? 1 : 0;
  const x = Math.round(a.x - fw / 2), y = Math.round(a.y - fh + 2 - bob + bow - (a.z || 0));
  if (!a.z || a.z < 30) { g.fillStyle = 'rgba(30,20,30,0.26)'; g.beginPath(); g.ellipse(Math.round(a.x), Math.round(a.y), fw * 0.3, 3, 0, 0, 6.29); g.fill(); }
  if (a.alpha < 1) g.globalAlpha = a.alpha;
  if (flip) { g.save(); g.translate(x + fw, y); g.scale(-1, 1); g.drawImage(im, fx, fy, fw, fh, 0, 0, fw, fh); g.restore(); }
  else g.drawImage(im, fx, fy, fw, fh, x, y, fw, fh);
  g.globalAlpha = 1;
  if (a.strike > 0) { g.fillStyle = 'rgba(255,240,180,0.7)'; g.fillRect(x + fw - 4, y + 10, 14, 3); }
  if (a.bubble) bubble(a.x, y - 3, a.bubble);
}

// ---------------------------------------------------------------- FX (drawn in world space, no smoothing; stepped alpha)
function fxDraw(f, t) {
  const k = f.t / f.dur, x = f.x, y = f.y;
  if (f.kind === 'cloud' && f.a) { const a = f.a, cx = Math.round(a.x), cy = Math.round(a.y - (a.z || 0) + 2); g.fillStyle = '#ffffff'; g.fillRect(cx - 14, cy - 3, 28, 5); g.fillRect(cx - 9, cy - 6, 18, 3); g.fillStyle = '#c8daee'; g.fillRect(cx - 14, cy + 2, 28, 2); return; }
  if (f.kind === 'flash') { g.fillStyle = `rgba(255,248,220,${0.8 * (1 - k)})`; const r = f.r * (0.5 + k); g.fillRect(x - r, y - r * 0.6, r * 2, r * 1.2); return; }
  if (f.kind === 'gold' || f.kind === 'bell') {
    const r = (f.kind === 'bell' ? 30 + k * 160 : f.r * (0.8 + 0.2 * Math.sin(t * 2))), a = f.kind === 'bell' ? 0.6 * (1 - k) : 0.22 * Math.min(1, (1 - k) * 4);
    for (let s = 0; s < 3; s++) { g.fillStyle = `rgba(255,226,140,${a * (1 - s * 0.3)})`; const rr = r * (1 - s * 0.25); g.beginPath(); g.ellipse(x, y, rr, rr * 0.5, 0, 0, 6.29); g.fill(); }
    if (f.kind === 'gold') for (let i = 0; i < 18; i++) { const px = x + Math.sin(i * 7.3) * f.r, py = y - ((t * 22 + i * 37) % 120); g.fillStyle = '#fff2b0'; g.fillRect(Math.round(px), Math.round(py), 2, 2); }
    return;
  }
  if (f.kind === 'sparks' || f.kind === 'fire') {
    const n = f.kind === 'fire' ? 40 : 22;
    for (let i = 0; i < n; i++) { const a = i * 2.39, d = (f.kind === 'fire' ? 0.3 + (i % 7) / 7 : k) * f.r, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.5 - ((t * 40 + i * 13) % 40) * (f.kind === 'fire' ? 1 : 0.3);
      g.fillStyle = i % 3 ? '#ffb040' : '#fff0a0'; g.fillRect(Math.round(px), Math.round(py), 2, f.kind === 'fire' ? 3 : 2); }
    if (f.kind === 'fire') { g.fillStyle = 'rgba(255,90,30,0.14)'; g.beginPath(); g.ellipse(x, y, f.r, f.r * 0.5, 0, 0, 6.29); g.fill(); }
    return;
  }
  if (f.kind === 'rain') { g.fillStyle = 'rgba(190,220,255,0.75)'; for (let i = 0; i < 160; i++) { const px = x - f.r + ((i * 53) % (f.r * 2)), py = y - 200 + ((t * 180 + i * 37) % 260); g.fillRect(Math.round(px), Math.round(py), 1, 4); } return; }
  if (f.kind === 'petals' || f.kind === 'peaches' || f.kind === 'lanterns') {
    const n = f.kind === 'lanterns' ? 14 : f.soft ? 10 : 30;
    for (let i = 0; i < n; i++) {
      const s = i * 12.9898, px = x + Math.sin(s) * f.r + Math.sin(t + i) * 6;
      if (f.kind === 'lanterns') { const py = y - ((t * 10 + i * 23) % 160); g.fillStyle = '#ffcf5a'; g.fillRect(Math.round(px), Math.round(py), 3, 4); g.fillStyle = 'rgba(255,200,90,0.25)'; g.fillRect(Math.round(px) - 2, Math.round(py) - 2, 7, 8); }
      else if (f.kind === 'peaches') { const py = y + Math.cos(s * 1.7) * f.r * 0.45; g.fillStyle = '#f69a8a'; g.fillRect(Math.round(px), Math.round(py), 3, 3); g.fillStyle = '#4ea070'; g.fillRect(Math.round(px) + 1, Math.round(py) - 1, 1, 1); }
      else { const py = y - 80 + ((t * 14 + i * 29) % 120); g.fillStyle = i % 2 ? '#ffc0d4' : '#fff0f6'; g.fillRect(Math.round(px), Math.round(py), 2, 1); }
    }
    return;
  }
  if (f.kind === 'mist') { for (let i = 0; i < 10; i++) { const a = i * 0.63 + t * 0.4, r = 10 + k * 30; g.fillStyle = `rgba(210,236,214,${0.35 * (1 - k)})`; g.beginPath(); g.ellipse(x + Math.cos(a) * r, y - 14 + Math.sin(a) * r * 0.4, 12, 7, 0, 0, 6.29); g.fill(); } return; }
  if (f.kind === 'web') { g.strokeStyle = `rgba(236,236,255,${0.75 * Math.min(1, (1 - k) * 3)})`; g.lineWidth = 1; const r = f.r * Math.min(1, k * 4);
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.beginPath(); g.moveTo(x, y - 30); g.lineTo(x + Math.cos(a) * r, y - 30 + Math.sin(a) * r * 0.5); g.stroke(); }
    for (let rr = 18; rr < r; rr += 18) { g.beginPath(); for (let i = 0; i <= 12; i++) { const a = i / 12 * 6.283; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y - 30 + Math.sin(a) * rr * 0.5); } g.stroke(); }
    return; }
  if (f.kind === 'splash') { for (let s = 0; s < 3; s++) { const r = ((k * 3 + s * 0.33) % 1) * 70; g.strokeStyle = `rgba(220,245,255,${0.8 * (1 - r / 70)})`; g.beginPath(); g.ellipse(x, y, r, r * 0.45, 0, 0, 6.29); g.stroke(); } }
}
let _mist = null;
function seamMist() {
  if (_mist) return _mist; _mist = [];
  const seen = {}; let n = 0;
  for (const [a, list] of Object.entries(W.adj)) for (const b of list) {
    if (seen[b + a]) continue; seen[a + b] = 1;
    const A = TS.biomes[a], B = TS.biomes[b]; if (!A || !B) continue;
    for (let k = 0; k < 3; k++) { const t = 0.38 + k * 0.12; _mist.push({ x: A.centre[0] + (B.centre[0] - A.centre[0]) * t + (k - 1) * 40, y: A.centre[1] + (B.centre[1] - A.centre[1]) * t - 30 + k * 26, k: (n++) % 3, ph: n }); }
  }
  return _mist;
}
function beacon(B, t) {
  const col = window.TD_DATA.beacon[B.id] || '#fff'; const [x, y] = B.focal, top = V.cy - V.vh / 2 - 10;
  const pulse = 0.18 + 0.1 * Math.sin(t * 3);
  for (let s = 0; s < 3; s++) { g.globalAlpha = pulse * (1 - s * 0.3); g.fillStyle = col; const w = 10 - s * 3; g.fillRect(Math.round(x - w / 2), top, w, y - top); }
  g.globalAlpha = 1;
}

// ---------------------------------------------------------------- frame
const TOD = [[0, '#3a3e78', 0.55], [5, '#3a3e78', 0.5], [6.5, '#ffb08a', 0.25], [8, '#ffffff', 0], [16.5, '#ffffff', 0], [18, '#ff9a78', 0.28], [19.5, '#5a4a8a', 0.45], [24, '#3a3e78', 0.55]];
function tint(h) { let i = 0; while (i < TOD.length - 2 && TOD[i + 1][0] <= h) i++; const a = TOD[i], b = TOD[i + 1], k = (h - a[0]) / (b[0] - a[0]); return [k < 0.5 ? a[1] : b[1], a[2] + (b[2] - a[2]) * k]; }
let wt = -1;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - V.last) / 1000 || 0); V.last = now;
  tsTick(dt * TS.speed);
  if (V.tod === 'auto') V.clock = (V.clock + dt * 24 / 480) % 24;                                  // a full day in 8 minutes
  const W2 = cv.width, H2 = cv.height; V.vw = W2; V.vh = H2;
  const x0 = Math.round(V.cx - W2 / 2), y0 = Math.round(V.cy - H2 / 2);
  g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.fillStyle = '#efe4f0'; g.fillRect(0, 0, W2, H2);
  g.setTransform(1, 0, 0, 1, -x0, -y0);
  const C = W.chunk, i0 = Math.max(0, Math.floor(x0 / C)), i1 = Math.min(Math.ceil(W.size[0] / C) - 1, Math.floor((x0 + W2) / C)), j0 = Math.max(0, Math.floor(y0 / C)), j1 = Math.min(Math.ceil(W.size[1] / C) - 1, Math.floor((y0 + H2) / C));
  const animate = Math.floor(TS.t * 10) !== wt; wt = Math.floor(TS.t * 10);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = chunk(i, j); if (!c.ready) continue; if (animate) animateWater(c, TS.t); g.drawImage(c.cv, i * C, j * C); }
  // depth-sorted characters and occluder blobs (object pixels redrawn over characters standing behind their base line)
  const items = [];
  for (const a of TS.agents) if (!a.gone && a.x > x0 - 60 && a.x < x0 + W2 + 60 && a.y > y0 - 20 && a.y < y0 + H2 + 90) items.push([a.y, a]);
  for (const p of W.plates) for (const o of p.occ) if (o[0] < x0 + W2 && o[0] + o[2] > x0 && o[1] < y0 + H2 && o[1] + o[3] > y0) items.push([o[4], null, o]);
  items.sort((p, q) => p[0] - q[0]);
  for (const it of items) {
    if (it[1]) { drawAgent(it[1]); continue; }
    const o = it[2];
    for (let j = Math.floor(o[1] / C); j <= Math.floor((o[1] + o[3] - 1) / C); j++) for (let i = Math.floor(o[0] / C); i <= Math.floor((o[0] + o[2] - 1) / C); i++) {
      const im = V.occ[i + ',' + j]; if (!im) continue;
      const sx = Math.max(o[0], i * C), sy = Math.max(o[1], j * C), ex = Math.min(o[0] + o[2], (i + 1) * C), ey = Math.min(o[1] + o[3], (j + 1) * C);
      if (ex > sx && ey > sy) g.drawImage(im, sx - i * C, sy - j * C, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy);
    }
  }
  for (const f of TS.fx) fxDraw(f, TS.t);
  // seam mist: drifting cloud banks on the borders between biomes hide the plates' framing
  for (const m of seamMist()) { const im = img('world/cloud' + m.k + '.png'); if (!im.complete) continue; const mx = Math.round(m.x + Math.sin(TS.t * 0.05 + m.ph) * 18 - im.width / 2), my = Math.round(m.y + Math.sin(TS.t * 0.08 + m.ph) * 4 - im.height / 2);
    if (mx < x0 + W2 && mx + im.width > x0 && my < y0 + H2 && my + im.height > y0) g.drawImage(im, mx, my); }
  for (const B of Object.values(TS.biomes)) if (B.phase === 'fore') beacon(B, TS.t);
  // time of day
  const [col, amt] = tint(V.clock);
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (amt > 0.01) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = amt; g.fillStyle = col; g.fillRect(0, 0, W2, H2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  if (amt > 0.3) { g.setTransform(1, 0, 0, 1, -x0, -y0); g.globalCompositeOperation = 'lighter'; for (const f of TS.fx) if (f.kind === 'lanterns' || f.kind === 'fire' || f.kind === 'gold') { g.globalAlpha = 0.2; g.fillStyle = '#ffb860'; g.beginPath(); g.ellipse(f.x, f.y - 20, 60, 34, 0, 0, 6.29); g.fill(); } g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.setTransform(1, 0, 0, 1, 0, 0); }
  placeCard(dt);
}

// ---------------------------------------------------------------- place-name card (names the place, not an event)
function placeCard(dt) {
  let here = null;
  for (const B of Object.values(TS.biomes)) { const r = B.rect; if (V.cx > r[0] && V.cx < r[0] + r[2] && V.cy > r[1] && V.cy < r[1] + r[3]) here = B; }
  const el = document.getElementById('card');
  if (!here || here.id !== V.card.biome) { V.card.biome = here && here.id; V.card.t = 0; return; }
  V.card.t += dt;
  if (V.card.t > 2 && V.card.t - dt <= 2 && document.getElementById('names').checked && (!V.card.shown[here.id] || TS.t - V.card.shown[here.id] > 180)) {
    V.card.shown[here.id] = TS.t; el.querySelector('b').textContent = here.title[0]; el.querySelector('span').textContent = here.title[1]; el.style.opacity = 1;
    clearTimeout(placeCard.h); placeCard.h = setTimeout(() => el.style.opacity = 0, 4200);
  }
}

// ---------------------------------------------------------------- view
function resize() {
  const dpr = window.devicePixelRatio || 1, pw = innerWidth * dpr, ph = innerHeight * dpr;
  cv.width = Math.ceil(pw / V.zoom); cv.height = Math.ceil(ph / V.zoom);
  cv.style.width = (cv.width * V.zoom / dpr) + 'px'; cv.style.height = (cv.height * V.zoom / dpr) + 'px';
  clampCam();
}
function clampCam() { V.cx = Math.max(cv.width / 2, Math.min(W.size[0] - cv.width / 2, V.cx)); V.cy = Math.max(cv.height / 2, Math.min(W.size[1] - cv.height / 2, V.cy)); }
let drag = null;
cv.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, V.cx, V.cy]; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => { if (!drag) return; const dpr = window.devicePixelRatio || 1; V.cx = drag[2] - (e.clientX - drag[0]) * dpr / V.zoom; V.cy = drag[3] - (e.clientY - drag[1]) * dpr / V.zoom; clampCam(); });
cv.addEventListener('pointerup', () => { drag = null; });
cv.addEventListener('wheel', e => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1 : -1); }, { passive: false });
function zoomBy(d) { V.zoom = Math.max(1, Math.min(4, V.zoom + d)); resize(); }
document.getElementById('zin').onclick = () => zoomBy(1); document.getElementById('zout').onclick = () => zoomBy(-1);
document.getElementById('tod').onchange = e => { V.tod = e.target.value; if (V.tod !== 'auto') V.clock = { day: 11, dusk: 18.2, night: 22 }[V.tod]; };
addEventListener('resize', resize);
addEventListener('keydown', e => { const s = 40 / V.zoom * 4; if (e.key === 'ArrowLeft') V.cx -= s; if (e.key === 'ArrowRight') V.cx += s; if (e.key === 'ArrowUp') V.cy -= s; if (e.key === 'ArrowDown') V.cy += s; if (e.key === '+' || e.key === '=') zoomBy(1); if (e.key === '-') zoomBy(-1); clampCam(); });

// ---------------------------------------------------------------- boot: walk grid, simulation, camera on Cao Lão Trang
(function boot() {
  const wi = new Image(); wi.onload = () => {
    const c = document.createElement('canvas'); c.width = wi.width; c.height = wi.height; const cg = c.getContext('2d'); cg.drawImage(wi, 0, 0);
    const d = cg.getImageData(0, 0, wi.width, wi.height).data, walk = new Uint8Array(wi.width * wi.height);
    for (let p = 0; p < walk.length; p++) walk[p] = d[p * 4] > 127 ? 1 : 0;
    tsInit(walk, wi.width, wi.height, +(Q.get('seed') || Date.now() % 100000));
    TS.speed = +(Q.get('speed') || 1);
    const start = TS.biomes[Q.get('at') || 'clt'] || TS.biomes.clt; V.cx = start.centre[0]; V.cy = start.centre[1];
    V.zoom = +(Q.get('zoom') || Math.max(1, Math.round(innerWidth * (window.devicePixelRatio || 1) / 1000)));
    if (Q.get('tod')) { V.tod = Q.get('tod'); V.clock = { day: 11, dusk: 18.2, night: 22 }[V.tod] || 9; document.getElementById('tod').value = V.tod; }
    resize(); for (const n in CH) img(CH[n].src);
    requestAnimationFrame(frame);
  };
  wi.src = 'world/walk.png';
})();
