'use strict';
// ===== Tây Du Ký v2 — character pilot page: animated cast cards + a minimal isometric living sandbox =====
// Projection is the shared Lofi Worlds one (js/core.js): isoX = x - y, isoY = (x + y) / 2, tile T = 8 world units.
// v2 draws at K = 4 art px per world unit, so a tile is 64 x 32 art px. Depth sort key = x + y (props use their tile centre).
// Ground tiles and props here are PLACEHOLDERS (simple code-drawn shapes) whose only job is to test character scale, directions,
// walk cycles and occlusion. The characters are the hand-authored v2 sheets in out/.
const C2 = window.TD2_CHARS, DIRS = C2.dirs, COLS = C2.cols;
const Q = new URLSearchParams(location.search);
const SB = { T: 8, K: 4, N: 16, zoom: 2, cx: 0, cy: 0, agents: [], props: [], blocked: null, region: null, debug: false, t: 0, imgs: {}, frames: 0, R: null, tiles: {} };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function img(src) { if (!SB.imgs[src]) { const i = new Image(); i.src = src; SB.imgs[src] = i; } return SB.imgs[src]; }
const iso = (x, y) => [(x - y) * SB.K, (x + y) / 2 * SB.K];

// ---------------------------------------------------------------- shared: draw one character frame
function drawChar(g, name, dir, col, sx, sy) {
  const ch = C2.chars[name], im = img(ch.src); if (!im.complete) return;
  const [w, h] = ch.size, i = COLS.indexOf(col), j = DIRS.indexOf(dir);
  g.drawImage(im, i * w, j * h, w, h, Math.round(sx - ch.pivot[0]), Math.round(sy - ch.pivot[1]), w, h);
}

// ---------------------------------------------------------------- cast cards
const UI = { scale: 3, motion: 'walk' };
function buildCast() {
  const box = document.getElementById('cast'); box.innerHTML = '';
  box.style.gridTemplateColumns = `repeat(auto-fill, minmax(min(100%, ${32 * 4 * UI.scale + 22}px), 1fr))`;   // integer-scaled previews never overflow the page
  for (const [name, ch] of Object.entries(C2.chars)) {
    const card = document.createElement('div'); card.className = 'card';
    const t = ch.title || [name, ''];
    card.innerHTML = `<b>${t[0]}</b><small>${t[1]} · ${ch.biome === 'hqs' ? 'Hoa Quả Sơn' : 'Bàn Tơ Động'} · ${ch.size[0]}×${ch.size[1]} canvas</small>`;
    const big = document.createElement('canvas'), one = document.createElement('canvas');
    big.width = ch.size[0] * 4; big.height = ch.size[1]; one.width = ch.size[0] * 4; one.height = ch.size[1];
    big.style.width = big.width * UI.scale + 'px'; big.style.height = big.height * UI.scale + 'px';
    const row = document.createElement('div'); row.className = 'row'; row.append(one);
    const lab = document.createElement('span'); lab.className = 'tag'; lab.textContent = '← 1× (real size)'; row.append(lab);
    card.append(big, row); box.append(card);
    card._c = [name, big, one];
  }
}
function drawCast(now) {
  const walkI = Math.floor(now / 140) % 4, idleI = Math.floor(now / 600) % 2;
  const col = UI.motion === 'walk' ? 'walk' + walkI : 'idle' + idleI;
  for (const card of document.querySelectorAll('.card')) {
    const [name, big, one] = card._c, ch = C2.chars[name];
    for (const cv of [big, one]) {
      const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, cv.width, cv.height);
      DIRS.forEach((d, k) => drawChar(g, name, d, cv === big ? col : 'idle0', ch.size[0] * k + ch.pivot[0], ch.pivot[1]));
    }
  }
}

// ---------------------------------------------------------------- sandbox map (placeholder ground + props)
function tileCanvas(fill, spots, seed) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 32; const g = c.getContext('2d'), d = g.createImageData(64, 32);
  const R = mulberry32(seed), sp = [];
  for (let k = 0; k < 9; k++) sp.push([Math.floor(R() * 52) + 6, Math.floor(R() * 20) + 6, spots[k % spots.length]]);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) {
    if (Math.abs(x - 31.5) / 32 + Math.abs(y - 15.5) / 16 > 1) continue;
    let col = fill[(Math.floor(x / 6) + Math.floor(y / 3)) % 2 ? 0 : 1];
    for (const [px, py, c2] of sp) if (Math.abs(x - px) < 2 && y === py) col = c2;
    const i = (y * 64 + x) * 4, v = parseInt(col.slice(1), 16); d.data[i] = v >> 16; d.data[i + 1] = v >> 8 & 255; d.data[i + 2] = v & 255; d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0); return c;
}
function propCanvas(kind) {
  // placeholder props: pixel rectangles and ellipses with an ink outline, bottom-centre pivot at (24, h - 6)
  const W = 48, H = kind === 'tree' ? 84 : kind === 'pillar' ? 72 : 40, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const ell = (cx, cy, rx, ry, col, ink) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const v = (x * x) / (rx * rx) + (y * y) / (ry * ry); if (v <= 1) px(cx + x, cy + y, 1, 1, ink && v > 0.78 ? ink : col); } };
  const base = H - 6;
  ell(24, base, 13, 5, 'rgba(40,20,40,0.28)');
  if (kind === 'tree') { px(21, base - 30, 6, 30, '#2a1726'); px(22, base - 30, 4, 29, '#8a5a3a'); ell(24, base - 46, 21, 20, '#4fa860', '#2a1726'); ell(19, base - 52, 11, 9, '#7ccc6a'); for (const [x, y] of [[12, -44], [30, -56], [34, -40], [20, -36], [26, -62]]) { ell(24 + x - 24 + 0, base + y, 2, 2, '#f48aa0', '#c25a74'); } }
  if (kind === 'rock') { ell(24, base - 10, 15, 11, '#9aa2ae', '#2a1726'); ell(20, base - 14, 7, 5, '#c4ccd6'); }
  if (kind === 'pillar') { for (let y = 0; y < 60; y++) { const w = Math.round(3 + (y / 60) * 10); px(24 - w - 1, base - 60 + y, 2 * w + 2, 1, '#2a1726'); px(24 - w, base - 60 + y, 2 * w, 1, y % 9 < 2 ? '#7a6a96' : '#56466e'); }
    g.strokeStyle = 'rgba(236,234,248,0.85)'; g.lineWidth = 1; g.beginPath(); g.moveTo(10.5, base - 40.5); g.lineTo(37.5, base - 20.5); g.moveTo(37.5, base - 44.5); g.lineTo(10.5, base - 18.5); g.stroke(); }
  if (kind === 'cocoon') { ell(24, base - 14, 8, 13, '#eceaf8', '#2a1726'); ell(22, base - 18, 3, 6, '#ffffff'); px(23, base - 30, 2, 4, '#a49ad0'); }
  if (kind === 'crystal') { for (let y = 0; y < 26; y++) { const w = Math.max(1, Math.round(6 - Math.abs(y - 13) / 3)); px(24 - w - 1, base - 26 + y, 2 * w + 2, 1, '#2a1726'); px(24 - w, base - 26 + y, 2 * w, 1, y < 10 ? '#b8ff9a' : '#5ad85a'); } }
  return { c, px: 24, py: base };
}
function buildMap() {
  const N = SB.N; SB.R = mulberry32(+(Q.get('seed') || 7));
  SB.blocked = new Uint8Array(N * N); SB.region = new Uint8Array(N * N);
  SB.tiles = { g0: tileCanvas(['#86c25c', '#7cb854'], ['#a8de78', '#5e9a44'], 1), g1: tileCanvas(['#80be58', '#78b250'], ['#f4a0b4', '#a8de78'], 2),
    path: tileCanvas(['#d8c8a4', '#ccbc98'], ['#b8a684', '#ece0c4'], 3), v0: tileCanvas(['#5a4a72', '#54446c'], ['#7a6a96', '#3e3256'], 4),
    v1: tileCanvas(['#56466e', '#5e4e78'], ['#7cf05a', '#7a6a96'], 5) };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) SB.region[j * N + i] = i + j < N - 1 ? 1 : i + j === N - 1 ? 0 : 2;   // 1 = Hoa Quả Sơn, 2 = Bàn Tơ Động, 0 = the path between
  const P = { tree: propCanvas('tree'), rock: propCanvas('rock'), pillar: propCanvas('pillar'), cocoon: propCanvas('cocoon'), crystal: propCanvas('crystal') };
  const place = (kind, i, j) => { if (SB.blocked[j * N + i] || SB.region[j * N + i] === 0) return; SB.blocked[j * N + i] = 1; SB.props.push({ kind, i, j, spr: P[kind], key: (i + j + 1) * SB.T }); };
  [[2, 3], [4, 1], [6, 4], [1, 7], [3, 9], [8, 2], [5, 6], [10, 1]].forEach(([i, j], k) => place(k % 3 === 2 ? 'rock' : 'tree', i, j));
  [[12, 9], [9, 12], [14, 6], [11, 14], [13, 12], [7, 13], [15, 11], [10, 10]].forEach(([i, j], k) => place(['pillar', 'cocoon', 'crystal', 'pillar'][k % 4], i, j));
  const cast = { 1: [['wukong', 1], ['khi_linh', 2], ['khi_lao', 1], ['khi_con', 3]], 2: [['nhen_tinh', 1], ['nhen_tinh_em', 3], ['nhen_con', 4], ['tam_tang', 1]] };
  for (const reg of [1, 2]) for (const [name, n] of cast[reg]) for (let k = 0; k < n; k++) {
    const t = freeTile(reg); if (!t) continue;
    SB.agents.push({ name, reg, x: (t[0] + 0.5) * SB.T, y: (t[1] + 0.5) * SB.T, path: [], dir: 'down', phase: 0, moving: false, idle: SB.R() * 3, z: 0, dist: 0 });
  }
}
function freeTile(reg) { for (let k = 0; k < 400; k++) { const i = Math.floor(SB.R() * SB.N), j = Math.floor(SB.R() * SB.N); if (!SB.blocked[j * SB.N + i] && SB.region[j * SB.N + i] === reg) return [i, j]; } return null; }
function walkable(i, j, reg) { return i >= 0 && j >= 0 && i < SB.N && j < SB.N && !SB.blocked[j * SB.N + i] && (SB.region[j * SB.N + i] === reg || SB.region[j * SB.N + i] === 0); }
function astar(a, b, reg) {
  // 8-direction A* on the tile grid; diagonals only when both orthogonal neighbours are free (no corner cutting through props)
  const N = SB.N, key = (i, j) => j * N + i, open = [[a[0], a[1], 0, 0]], g = new Map([[key(a[0], a[1]), 0]]), from = new Map();
  while (open.length) {
    open.sort((p, q) => p[3] - q[3]); const [i, j, c] = open.shift();
    if (i === b[0] && j === b[1]) { const out = [[i, j]]; let k = key(i, j); while (from.has(k)) { k = from.get(k); out.unshift([k % N, Math.floor(k / N)]); } return out; }
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (!walkable(ni, nj, reg)) continue;
      if (di && dj && (!walkable(i + di, j, reg) || !walkable(i, j + dj, reg))) continue;
      const nc = c + (di && dj ? 1.414 : 1), k = key(ni, nj); if (g.has(k) && g.get(k) <= nc) continue;
      g.set(k, nc); from.set(k, key(i, j)); open.push([ni, nj, nc, nc + Math.hypot(b[0] - ni, b[1] - nj)]);
    }
  }
  return null;
}
function tick(dt) {
  SB.t += dt;
  for (const a of SB.agents) {
    const ch = C2.chars[a.name], v = (ch.speed || 20) / SB.K;
    if (!a.path.length) {
      a.moving = false; a.z = 0; a.idle -= dt;
      if (a.idle <= 0) {
        const i0 = Math.floor(a.x / SB.T), j0 = Math.floor(a.y / SB.T), t = freeTile(a.reg);
        if (t && Math.hypot(t[0] - i0, t[1] - j0) < 7) { const p = astar([i0, j0], t, a.reg); if (p) a.path = p.slice(1).map(([i, j]) => [(i + 0.3 + SB.R() * 0.4) * SB.T, (j + 0.3 + SB.R() * 0.4) * SB.T]); }
        a.idle = 1 + SB.R() * 4;
      }
      continue;
    }
    const [tx, ty] = a.path[0], dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), s = Math.min(d, v * dt);
    if (d < 0.05) { a.path.shift(); continue; }
    a.x += dx / d * s; a.y += dy / d * s; a.moving = true; a.dist += s * SB.K;
    const sx = dx - dy, sy = (dx + dy) / 2;                                       // screen-space direction picks the sprite row
    a.dir = Math.abs(sx) > Math.abs(sy) * 1.2 ? (sx > 0 ? 'right' : 'left') : (sy > 0 ? 'down' : 'up');
    a.z = ch.gait === 'hop' ? Math.round(Math.abs(Math.sin(a.dist / 7 * Math.PI)) * 3) : 0;
  }
}

// ---------------------------------------------------------------- sandbox render
const cv = document.getElementById('sb'), g = cv.getContext('2d');
function resize() { const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; cv.width = Math.ceil(r.width * dpr / SB.zoom); cv.height = Math.ceil(r.height * dpr / SB.zoom); }
function draw() {
  g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
  g.fillStyle = '#c8b8d4'; g.fillRect(0, 0, cv.width, cv.height);
  const ox = Math.round(cv.width / 2 - SB.cx), oy = Math.round(cv.height / 2 - SB.cy), N = SB.N, T = SB.T;
  g.setTransform(1, 0, 0, 1, ox, oy);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const r = SB.region[j * N + i], h = (i * 7 + j * 13) % 5, tc = r === 0 ? SB.tiles.path : r === 1 ? (h ? SB.tiles.g0 : SB.tiles.g1) : (h ? SB.tiles.v0 : SB.tiles.v1);
    const [x, y] = iso(i * T, j * T); g.drawImage(tc, x - 32, y);
  }
  const D = [];
  for (const p of SB.props) D.push([p.key, 0, p]);
  for (const a of SB.agents) D.push([a.x + a.y, 1, a]);
  D.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  for (const [, k, o] of D) {
    if (k === 0) { const [x, y] = iso((o.i + 0.5) * T, (o.j + 0.5) * T); g.drawImage(o.spr.c, x - o.spr.px, y - o.spr.py); continue; }
    const [x, y] = iso(o.x, o.y), ch = C2.chars[o.name];
    g.fillStyle = 'rgba(40,20,40,0.28)'; g.fillRect(Math.round(x) - 7, Math.round(y) - 1, 14, 3); g.fillRect(Math.round(x) - 5, Math.round(y) - 2, 10, 5);
    const col = o.moving ? 'walk' + Math.floor(o.dist / (ch.gait === 'scuttle' ? 4 : 6)) % 4 : 'idle' + (Math.floor((SB.t + o.x) / 0.6) % 2);
    drawChar(g, o.name, o.dir, col, x, y - o.z);
  }
  if (SB.debug) {
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (SB.blocked[j * N + i]) { const [x, y] = iso((i + 0.5) * T, (j + 0.5) * T); g.strokeStyle = '#ff3a5a'; g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x + 32, y); g.lineTo(x, y + 16); g.lineTo(x - 32, y); g.closePath(); g.stroke(); }
    for (const a of SB.agents) { const [x, y] = iso(a.x, a.y); g.fillStyle = '#fff200'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      if (a.path.length) { g.strokeStyle = 'rgba(255,242,0,0.6)'; g.beginPath(); g.moveTo(x, y); for (const [px, py] of a.path) { const [sx, sy] = iso(px, py); g.lineTo(sx, sy); } g.stroke(); } }
  }
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - (SB.last || now)) / 1000); SB.last = now;
  tick(dt); draw(); drawCast(now); SB.frames++;
  if (SB.frames % 30 === 0) document.getElementById('stat').textContent = `${SB.agents.length} characters · ${SB.props.length} props · zoom ${SB.zoom}×`;
}

// ---------------------------------------------------------------- input
let drag = null;
cv.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, SB.cx, SB.cy]; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => { if (!drag) return; const dpr = window.devicePixelRatio || 1; SB.cx = drag[2] - (e.clientX - drag[0]) * dpr / SB.zoom; SB.cy = drag[3] - (e.clientY - drag[1]) * dpr / SB.zoom; });
cv.addEventListener('pointerup', () => { drag = null; });
cv.addEventListener('wheel', e => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1 : -1); }, { passive: false });
function zoomBy(d) { SB.zoom = Math.max(1, Math.min(4, SB.zoom + d)); resize(); }
document.getElementById('zin').onclick = () => zoomBy(1); document.getElementById('zout').onclick = () => zoomBy(-1);
const dbg = document.getElementById('dbg'); dbg.onclick = () => { SB.debug = !SB.debug; dbg.setAttribute('aria-pressed', SB.debug); };
const setBg = dark => { document.documentElement.dataset.bg = dark ? 'dark' : 'light'; document.getElementById('bgL').setAttribute('aria-pressed', !dark); document.getElementById('bgD').setAttribute('aria-pressed', dark); };
document.getElementById('bgL').onclick = () => setBg(false); document.getElementById('bgD').onclick = () => setBg(true);
for (const b of document.querySelectorAll('[data-s]')) b.onclick = () => { UI.scale = +b.dataset.s; document.querySelectorAll('[data-s]').forEach(x => x.setAttribute('aria-pressed', x === b)); buildCast(); };
const mot = m => { UI.motion = m; document.getElementById('walk').setAttribute('aria-pressed', m === 'walk'); document.getElementById('idle').setAttribute('aria-pressed', m === 'idle'); };
document.getElementById('walk').onclick = () => mot('walk'); document.getElementById('idle').onclick = () => mot('idle');
addEventListener('resize', resize);

buildCast(); buildMap();
SB.cy = iso(SB.N * SB.T / 2, SB.N * SB.T / 2)[1];
if (Q.get('bg') === 'dark') setBg(true);
resize(); requestAnimationFrame(frame);
window.SB = SB;
