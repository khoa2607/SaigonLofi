'use strict';
// ===== Tây Du Ký — two test biomes (pilot): traced plate, living cast in 4 directions, depth occlusion, flowing water, drifting clouds =====
// Pilot only: the real world will be one map (design doc). Simulation randomness here is Math.random: this page is a look test.
const D = window.TD_DATA;
const cv = document.getElementById('c'), g = cv.getContext('2d'), view = document.getElementById('view');
const ST = { biome: null, B: null, plate: null, base: null, water: [], walk: null, occ: [], agents: [], clouds: [], zoom: 2, panX: 0, panY: 0, t: 0, last: 0 };
const IMG = {};
const load = src => IMG[src] || (IMG[src] = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }));

// ---------------------------------------------------------------- colour helpers
function hsv(r, gg, b) {
  const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), d = mx - mn; let h = 0;
  if (d) h = mx === r ? ((gg - b) / d) % 6 : mx === gg ? (b - r) / d + 2 : (r - gg) / d + 4;
  return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx / 255];
}
const isGround = (r, gg, b) => { const [h, s, v] = hsv(r, gg, b); return (s < 0.34 && v > 0.55 && r >= b - 6) || (h > 55 && h < 115 && s > 0.3 && v > 0.45); };
const isWater = (r, gg, b) => { const [h, s, v] = hsv(r, gg, b); return h > 170 && h < 215 && s > 0.28 && v > 0.45; };
function inPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }

// ---------------------------------------------------------------- build a biome
async function enter(key) {
  const B = D.biomes[key]; ST.biome = key; ST.B = B;
  const pimg = await load(B.plate); const [W, H] = B.size;
  cv.width = W; cv.height = H;
  const pc = document.createElement('canvas'); pc.width = W; pc.height = H; const pg = pc.getContext('2d'); pg.drawImage(pimg, 0, 0);
  const id = pg.getImageData(0, 0, W, H); ST.plate = pc; ST.base = new Uint8ClampedArray(id.data); ST.frameData = id;
  const px = id.data;
  // walkable = authored zones ∩ ground colours
  ST.walk = new Uint8Array(W * H);
  for (const poly of B.walk) {
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) {
      const i = (y * W + x) * 4; if (inPoly(x + .5, y + .5, poly) && isGround(px[i], px[i + 1], px[i + 2])) ST.walk[y * W + x] = 1;
    }
  }
  // solid objects (rocks, wells) are never walked on
  for (const o of B.occ) if (o.solid) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ST.walk[y * W + x] && inPoly(x + .5, y + .5, o.poly)) ST.walk[y * W + x] = 0;
  // water pixels; a long vertical run marks a waterfall (flows down), otherwise a river (drifts diagonally)
  ST.water = []; const wat = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (isWater(px[i], px[i + 1], px[i + 2])) wat[y * W + x] = 1; }
  const run = new Uint16Array(W * H);
  for (let x = 0; x < W; x++) { let r = 0; for (let y = 0; y < H; y++) { r = wat[y * W + x] ? r + 1 : 0; run[y * W + x] = r; } for (let y = H - 1, m = 0; y >= 0; y--) { m = wat[y * W + x] ? Math.max(m, run[y * W + x]) : 0; run[y * W + x] = m; } }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (wat[y * W + x]) ST.water.push(x, y, run[y * W + x] > 26 ? 1 : 0);
  // occluders: the object's own pixels (zone minus ground) redrawn over characters standing behind its base line
  ST.occ = B.occ.map(o => {
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (const [x, y] of o.poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W, x1); y1 = Math.min(H, y1);
    const c = document.createElement('canvas'); c.width = x1 - x0; c.height = y1 - y0; const cg = c.getContext('2d'), od = cg.createImageData(c.width, c.height);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 4; if (!inPoly(x + .5, y + .5, o.poly) || (!o.solid && isGround(px[i], px[i + 1], px[i + 2]))) continue;
      const j = ((y - y0) * c.width + (x - x0)) * 4; od.data[j] = px[i]; od.data[j + 1] = px[i + 1]; od.data[j + 2] = px[i + 2]; od.data[j + 3] = 255;
    }
    cg.putImageData(od, 0, 0); return { c, x: x0, y: y0, base: o.base };
  });
  // cast
  ST.agents = [];
  for (const [name, n] of B.cast) for (let k = 0; k < n; k++) { const p = randWalk(); if (p) ST.agents.push(newAgent(name, p[0], p[1])); }
  await Promise.all(Object.keys(D.chars).map(n => load(D.chars[n].src)));
  ST.clouds = [0, 1, 2, 0, 1].slice(0, B.clouds || 0).map((k, i) => ({ k, x: Math.random() * W, y: -26 + (i % 3) * 12 + Math.random() * 8, v: 2.5 + Math.random() * 3.5 }));   // a band of cloud drifting along the top edge
  await Promise.all([0, 1, 2].map(k => load('assets/cloud' + k + '.png')));
  document.querySelectorAll('[data-biome]').forEach(b => b.setAttribute('aria-pressed', b.dataset.biome === key));
  showCard(B.title); fit();
}
function randWalk() {
  const [W, H] = ST.B.size;
  for (let k = 0; k < 4000; k++) { const x = Math.random() * W | 0, y = Math.random() * H | 0; if (ST.walk[y * W + x]) return [x, y]; }
  return null;
}
const walkable = (x, y) => { const [W, H] = ST.B.size; x |= 0; y |= 0; return x >= 0 && y >= 0 && x < W && y < H && ST.walk[y * W + x]; };
function newAgent(name, x, y) {
  const monkey = D.chars[name].sideLeft;
  return { name, x, y, tx: x, ty: y, v: monkey ? 16 + Math.random() * 10 : 9 + Math.random() * 7, idle: Math.random() * 4, dir: 0, flip: false, step: 0, moving: false };
}

// ---------------------------------------------------------------- behaviour: wander inside the walkable zones, pause, look around
function tick(dt) {
  const [W] = ST.B.size;
  for (const a of ST.agents) {
    if (a.idle > 0) { a.idle -= dt; a.moving = false; if (a.idle <= 0) pickTarget(a); else if (Math.random() < dt * 0.15) a.dir = [0, 1, 3][Math.random() * 3 | 0]; continue; }
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { a.idle = 1.5 + Math.random() * 6; a.moving = false; continue; }
    const s = Math.min(d, a.v * dt), nx = a.x + dx / d * s, ny = a.y + dy / d * s;
    if (!walkable(nx, ny)) { a.idle = 0.4 + Math.random(); a.moving = false; continue; }
    a.x = nx; a.y = ny; a.moving = true; a.step += dt;
    // facing: d1 front (down), d2 front-side, d3 back-side, d4 back (up); left/right by mirroring
    const side = D.chars[a.name].sideLeft;
    if (Math.abs(dy) > Math.abs(dx) * 1.4) { a.dir = dy > 0 ? 0 : 3; a.flip = false; }
    else { a.dir = dy >= 0 ? 1 : 2; a.flip = side ? dx > 0 : dx < 0; }
  }
}
function pickTarget(a) {
  for (let k = 0; k < 60; k++) {
    const ang = Math.random() * Math.PI * 2, r = 20 + Math.random() * 90, x = a.x + Math.cos(ang) * r, y = a.y + Math.sin(ang) * r * 0.6;
    if (!walkable(x, y)) continue;
    let ok = true; for (let s = 1; s <= 8; s++) if (!walkable(a.x + (x - a.x) * s / 8, a.y + (y - a.y) * s / 8)) { ok = false; break; }
    if (ok) { a.tx = x; a.ty = y; return; }
  }
  a.idle = 1;
}

// ---------------------------------------------------------------- drawing
function waterFrame(t) {
  const d = ST.frameData.data, b = ST.base, [W] = ST.B.size, w = ST.water;
  for (let k = 0; k < w.length; k += 3) {
    const x = w[k], y = w[k + 1], fall = w[k + 2], i = (y * W + x) * 4;
    let hi;
    if (fall) hi = ((y - t * 34 + (x % 3) * 4) % 11 + 11) % 11 < 2.2;
    else hi = ((x * 0.5 + y - t * 7 + ((x * 7 + y * 13) % 5)) % 16 + 16) % 16 < 1.4;
    const k2 = hi ? (fall ? 0.4 : 0.28) : 0;
    d[i] = b[i] + (255 - b[i]) * k2; d[i + 1] = b[i + 1] + (255 - b[i + 1]) * k2; d[i + 2] = b[i + 2] + (255 - b[i + 2]) * k2;
  }
  ST.plate.getContext('2d').putImageData(ST.frameData, 0, 0);
}
function drawAgent(a) {
  const C = D.chars[a.name], img = IMG[C.src].__img; if (!img) return;
  const [fx, fy, fw, fh] = C.frames[Math.min(a.dir, C.frames.length - 1)];
  const bob = a.moving && Math.floor(a.step * 8) % 2 ? 1 : 0;
  const x = Math.round(a.x - fw / 2), y = Math.round(a.y - fh + 2 - bob);
  g.fillStyle = 'rgba(30,20,30,0.28)'; g.beginPath(); g.ellipse(Math.round(a.x), Math.round(a.y), fw * 0.32, 3, 0, 0, Math.PI * 2); g.fill();
  if (a.flip) { g.save(); g.translate(x + fw, y); g.scale(-1, 1); g.drawImage(img, fx, fy, fw, fh, 0, 0, fw, fh); g.restore(); }
  else g.drawImage(img, fx, fy, fw, fh, x, y, fw, fh);
}
function frame(now) {
  requestAnimationFrame(frame);
  if (!ST.B) return;
  const dt = Math.min(0.1, (now - ST.last) / 1000 || 0); ST.last = now; ST.t += dt;
  tick(dt);
  if (Math.floor(ST.t * 12) !== ST.wt) { ST.wt = Math.floor(ST.t * 12); waterFrame(ST.t); }
  g.imageSmoothingEnabled = false;
  g.drawImage(ST.plate, 0, 0);
  const items = ST.agents.map(a => ({ y: a.y, a })).concat(ST.occ.map(o => ({ y: o.base, o })));
  items.sort((p, q) => p.y - q.y);
  for (const it of items) { if (it.a) drawAgent(it.a); else g.drawImage(it.o.c, it.o.x, it.o.y); }
  const [W] = ST.B.size;
  for (const c of ST.clouds) { const im = IMG['assets/cloud' + c.k + '.png'].__img; if (!im) continue; c.x += c.v * dt; if (c.x > W + 20) c.x = -im.width - 20; g.drawImage(im, Math.round(c.x), Math.round(c.y)); }
}

// ---------------------------------------------------------------- view: integer zoom, drag to pan
function fit() {
  const [W, H] = ST.B.size, dpr = window.devicePixelRatio || 1;
  const s = ST.zoom; cv.style.width = (W * s / dpr) + 'px'; cv.style.height = (H * s / dpr) + 'px';
  const vw = view.clientWidth, vh = view.clientHeight, cw = W * s / dpr, ch = H * s / dpr;
  ST.panX = Math.min(0, Math.max(vw - cw, cw < vw ? (vw - cw) / 2 : ST.panX)); ST.panY = Math.min(0, Math.max(vh - ch, ch < vh ? (vh - ch) / 2 : ST.panY));
  if (cw < vw) ST.panX = (vw - cw) / 2; if (ch < vh) ST.panY = (vh - ch) / 2;
  cv.style.transform = `translate(${Math.round(ST.panX)}px, ${Math.round(ST.panY)}px)`;
}
let drag = null;
view.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, ST.panX, ST.panY]; view.classList.add('drag'); view.setPointerCapture(e.pointerId); });
view.addEventListener('pointermove', e => { if (!drag) return; ST.panX = drag[2] + e.clientX - drag[0]; ST.panY = drag[3] + e.clientY - drag[1]; fit(); });
view.addEventListener('pointerup', () => { drag = null; view.classList.remove('drag'); });
const zoomBy = d => { ST.zoom = Math.max(1, Math.min(4, ST.zoom + d)); fit(); };
document.getElementById('zin').onclick = () => zoomBy(1); document.getElementById('zout').onclick = () => zoomBy(-1);
addEventListener('keydown', e => { if (e.key === '+' || e.key === '=') zoomBy(1); if (e.key === '-') zoomBy(-1); });
addEventListener('resize', () => ST.B && fit());
document.querySelectorAll('[data-biome]').forEach(b => b.onclick = () => enter(b.dataset.biome));
function showCard([vi, en]) { const c = document.getElementById('card'); c.querySelector('b').textContent = vi; c.querySelector('span').textContent = en; c.style.opacity = 1; clearTimeout(showCard.t); showCard.t = setTimeout(() => c.style.opacity = 0, 4000); }

// images resolve to themselves; keep a direct handle for drawing
const _load = load;
(async () => {
  for (const n of Object.keys(D.chars)) _load(D.chars[n].src).then(i => IMG[D.chars[n].src].__img = i);
  for (const k of [0, 1, 2]) _load('assets/cloud' + k + '.png').then(i => IMG['assets/cloud' + k + '.png'].__img = i);
  ST.zoom = Math.max(1, Math.round(innerWidth * (devicePixelRatio || 1) / 1000));
  await enter('hoa-qua-son');
  requestAnimationFrame(frame);
})();
