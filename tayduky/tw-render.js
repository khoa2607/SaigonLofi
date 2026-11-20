'use strict';
// ===== Tây Du Ký v2 — renderer =====
// Screen space is art px: X = (x - y) * 4 + OX, Y = (x + y) * 2 - z * 4 + OY (world units). Per frame:
//   ground chunks (baked lazily, 512 px) -> water shimmer frames -> flat decals -> ONE depth-sorted list (props, agents, waterfall,
//   terrain columns that stand in front of something) -> overlays (web canopy, particles) -> day/night grade + gorge gloom ->
//   emissive pixels and light glows. Rendering only reads simulation state.
const TWR = (function () {
  const A = TWA, M = TWM.M, CH = A.CH;
  const R = { zoom: 2, cx: 0, cy: 0, cv: null, g: null, chunks: new Map(), statics: [], flats: [], grid: new Map(), t: 0, clock: 9.5, tod: 'auto', debug: false, bakeMs: 0, frameMs: 0, dark: 0, stats: {} };
  const wx = (x, y) => (x - y) * 4 + A.OX, wy = (x, y, z) => (x + y) * 2 - z * 4 + A.OY;
  R.wx = wx; R.wy = wy;

  // ---------------------------------------------------------------- statics (props) with measured pivots, bucketed by chunk
  function pivotOf(cv) { const g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data; for (let y = cv.height - 1; y >= 0; y--) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3]) return y + 1; return cv.height; }
  function initStatics() {
    for (const p of TWM.props) {
      if (p.kind === 'stairs') continue;
      const sp = A.sprite(p); if (!sp) continue;
      if (sp.py === undefined) sp.py = pivotOf(sp.frames[0]);
      const fw = p.fp ? p.fp[0] : 1, fh = p.fp ? p.fp[1] : 1, x = (p.i + fw / 2) * 8, y = (p.j + fh / 2) * 8, z = TWM.H[TWM.id(p.i, p.j)] * 4;
      const s = { p, sp, x, y, z, X: Math.round(wx(x, y) - sp.w / 2), Y: Math.round(wy(x, y, z) - sp.py + 2), key: x + y, ph: (p.i * 7 + p.j * 3) % 17 };
      if (sp.flat) R.flats.push(s); else R.statics.push(s);
      const ck = Math.floor(s.X / CH) + ',' + Math.floor(s.Y / CH); if (!R.grid.has(ck)) R.grid.set(ck, []); R.grid.get(ck).push(s);
      // static occlusion: terrain columns in front of this prop that rise above its base
      s.occ = columnsInFront(x, y, z, s.X, s.Y, sp.w, sp.py);
    }
  }

  // ---------------------------------------------------------------- chunks
  function chunk(ci, cj) { const k = ci + ',' + cj; let c = R.chunks.get(k); if (!c) { c = { ci, cj, ready: false, queued: false }; R.chunks.set(k, c); } return c; }
  function bake(c) {
    const t0 = performance.now(); const b = A.bakeChunk(c.ci, c.cj); Object.assign(c, b, { ready: true });
    // water shimmer: 4 frames of sparse glints over pixels that stayed water
    if (b.glints.length) {
      c.wf = []; const src = b.cv.getContext('2d').getImageData(0, 0, CH, CH).data;
      for (let f = 0; f < 4; f++) {
        const cv = document.createElement('canvas'); cv.width = CH; cv.height = CH; const g = cv.getContext('2d'), id = g.createImageData(CH, CH), d = id.data;
        for (let n = 0; n < b.glints.length; n += 3) {
          const x = b.glints[n], y = b.glints[n + 1], type = b.glints[n + 2], h = TWM.hash2(x + c.x, y + c.y, 41);
          if (Math.floor(h * 4) !== f && Math.floor(h * 4) !== (f + 1) % 4) continue;
          const len = type === 1 ? 3 : type === 2 ? 2 : 2, bright = Math.floor(h * 4) === f ? 0.55 : 0.28;
          for (let a = 0; a < len; a++) { const p = (y * CH + x + a) * 4; if (x + a >= CH || !src[p + 3]) continue; d[p] = src[p] + (255 - src[p]) * bright; d[p + 1] = src[p + 1] + (255 - src[p + 1]) * bright; d[p + 2] = src[p + 2] + (255 - src[p + 2]) * bright; d[p + 3] = 255; }
        }
        g.putImageData(id, 0, 0); c.wf.push(cv);
      }
    }
    R.bakeMs += performance.now() - t0;
  }
  function viewRect() { return [Math.round(R.cx - R.cv.width / 2), Math.round(R.cy - R.cv.height / 2), R.cv.width, R.cv.height]; }

  // ---------------------------------------------------------------- terrain columns that stand in front of an object
  function columnsInFront(x, y, z, sX, sY, w, hgt) {
    const out = [], ai = Math.floor(x / 8), aj = Math.floor(y / 8), lvl = Math.floor(z / 4 + 0.01), footY = wy(x, y, z);
    for (let dj = 0; dj <= 5; dj++) for (let di = 0; di <= 5; di++) {
      if (!di && !dj) continue; const i = ai + di, j = aj + dj; if (!TWM.inMap(i, j)) continue;
      const k = TWM.id(i, j), hh = TWM.H[k]; if (hh <= lvl || TWM.MAT[k] === M.VOID) continue;
      const tX = A.SX(i, j), tY = A.SY(i, j, hh);
      if (tX + 32 < sX || tX - 32 > sX + w) continue;            // no horizontal overlap
      if (tY >= footY) continue;                                  // its top is below the object's feet: cannot hide it
      if (tY + 32 + (hh - lvl) * 16 < sY) continue;
      out.push(k);
    }
    return out;
  }
  function drawColumn(g, k, lvl) {
    const i = k % TWM.N, j = Math.floor(k / TWM.N), hh = TWM.H[k], sx = A.SX(i, j), st = A.SY(i, j, hh), sb = A.SY(i, j, lvl);
    g.save(); g.beginPath(); g.moveTo(sx, st); g.lineTo(sx + 32, st + 16); g.lineTo(sx + 32, sb + 16); g.lineTo(sx, sb + 32); g.lineTo(sx - 32, sb + 16); g.lineTo(sx - 32, st + 16); g.closePath(); g.clip();
    const x0 = sx - 32, x1 = sx + 32, y0 = st, y1 = sb + 32;
    for (let cj = Math.floor(y0 / CH); cj <= Math.floor(y1 / CH); cj++) for (let ci = Math.floor(x0 / CH); ci <= Math.floor(x1 / CH); ci++) { const c = R.chunks.get(ci + ',' + cj); if (c && c.ready) g.drawImage(c.cv, ci * CH, cj * CH); }
    g.restore();
  }

  // ---------------------------------------------------------------- characters
  const SHEETS = {};
  function sheet(name) { if (!SHEETS[name]) { const C = window.TD2_CHARS.chars[name]; if (!C) return null; const im = new Image(); im.src = 'chars/' + name + '.png'; SHEETS[name] = { im, C }; } return SHEETS[name]; }
  // frame selection from the character's animation table (C.anim = {idle:[col0,n], walk:[col0,n], act:[col0,n], sit:[col0,n]?}).
  // Walk advances with distance travelled (feet never slide), idle and act with time.
  function frameCol(C, a) {
    const A = C.anim, T = R.t, ph = a.phase || 0;
    const pick = (r, k) => r[0] + ((k % r[1]) + r[1]) % r[1];
    if (a.moving || a.pose === 'climb') return A.walk ? pick(A.walk, Math.floor(a.dist / (C.stride || 1.1))) : 0;
    if (a.pose === 'sit') return A.sit ? A.sit[0] : pick(A.idle, 0);
    if (a.pose === 'act') {
      if (A.act) return pick(A.act, Math.floor((T + ph) / (C.actDur || 0.2)));
      // Reuse the matched-scale walk drawings for practice and weaving: a slow
      // alternating stance moves the staff and the sisters' back legs in place.
      if ((a.role === 'king' || a.role === 'sister') && A.walk) {
        const poses = [0, 1, 2, 1, 0, 5, 6, 5];
        return pick(A.walk, poses[Math.floor((T + ph) / 0.24) % poses.length]);
      }
      return pick(A.idle, Math.floor((T + ph) / (C.idleDur || 0.7)));
    }
    if (a.pose === 'jump' || a.pose === 'fly') return A.walk ? A.walk[0] : 0;
    return pick(A.idle, Math.floor((T + ph) / (C.idleDur || 0.7)));
  }
  function drawAgent(g, a, glowOnly) {
    const S = sheet(a.look || a.char); if (!S || !S.im.complete) return;
    const C = S.C, [w, h] = C.size, dirs = window.TD2_CHARS.dirs, px0 = C.pivot[0], py0 = C.pivot[1];
    const col = frameCol(C, a), row = dirs.indexOf(a.dir) >= 0 ? dirs.indexOf(a.dir) : 0;
    // working (act) poses bounce a little so a still idle frame still reads as effort
    const bob = a.pose === 'act' && !(C.anim && C.anim.act) ? Math.round(Math.abs(Math.sin((R.t + (a.phase || 0)) * 7)) * 1.4) : 0;
    const X = Math.round(wx(a.x, a.y) - px0), gz = a.gz, Y = Math.round(wy(a.x, a.y, gz + (a.lift || 0)) - py0) - bob;
    const sitDrop = a.pose === 'sit' && C.anim && !C.anim.sit ? (C.sitDrop || 5) : 0;
    if (glowOnly) { // Match the seated crop in the normal pass; never restore hidden legs at night.
      if (sitDrop) { const cut = py0 - sitDrop; g.drawImage(S.im, col * w, row * h, w, cut, X, Y + sitDrop, w, cut); }
      else g.drawImage(S.im, col * w, row * h, w, h, X, Y, w, h);
      return;
    }
    const sw = Math.max(10, Math.round((C.shadow || 14)));
    // contact shadow on the ground (stays on the ground while jumping or climbing)
    if (!a.inWater) { const sY = Math.round(wy(a.x, a.y, gz)); g.fillStyle = 'rgba(30,16,36,0.28)'; g.fillRect(X + px0 - (sw >> 1), sY - 2, sw, 3); g.fillRect(X + px0 - (sw >> 1) + 2, sY - 3, sw - 4, 5); }
    if (a.thread) { g.fillStyle = 'rgba(232,228,250,0.85)'; const ty = Math.round(wy(a.x, a.y, a.thread)); g.fillRect(X + px0, ty, 1, Y + (C.top || 6) + 16 - ty); }
    if (a.alpha !== undefined && a.alpha < 1) g.globalAlpha = Math.max(0, a.alpha);
    if (a.inWater) { const cut = py0 - 12; g.drawImage(S.im, col * w, row * h, w, cut, X, Y + 6, w, cut);   // bathing / swimming: lower body hidden under the water line
      const wl = Y + 6 + cut; g.fillStyle = 'rgba(220,250,250,0.85)'; g.fillRect(X + px0 - 9, wl - 1, 18, 1); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(X + px0 - 11 + (Math.floor(R.t * 3) % 3), wl, 22, 1); }
    else if (sitDrop) { const cut = py0 - sitDrop - 2; g.drawImage(S.im, col * w, row * h, w, cut + 2, X, Y + sitDrop, w, cut + 2); }
    else g.drawImage(S.im, col * w, row * h, w, h, X, Y, w, h);
    g.globalAlpha = 1;
    if (a.robe) { const ry = Y + (C.top || 6) + Math.round((py0 - (C.top || 6)) * 0.34); g.fillStyle = '#2a1726'; g.fillRect(X + px0 - 9, ry - 1, 18, 9); g.fillStyle = '#f4f0fa'; g.fillRect(X + px0 - 8, ry, 16, 7); g.fillStyle = '#c8c0dc'; g.fillRect(X + px0 - 8, ry + 5, 16, 2); g.fillStyle = '#f4b0c8'; g.fillRect(X + px0 - 1, ry, 2, 5); }   // tasteful bathing robe
    if (a.wrap) { g.fillStyle = 'rgba(236,232,252,0.9)'; const top = Y + (C.top || 6) + 14; for (let k = 0; k < 7; k++) g.fillRect(X + px0 - 8, top + k * 4 + (k % 2), 16, 1); for (let k = 0; k < 4; k++) g.fillRect(X + px0 - 7 + k * 5, top - 2, 1, 28); }
    if (a.carry) { const c = a.carry === 'peach'; g.fillStyle = c ? '#ffa078' : a.carry === 'crystal' ? '#b78cff' : a.carry === 'fish' ? '#9ad8f0' : '#e8e4f8'; const px = X + C.pivot[0] + (a.dir === 'left' ? -7 : a.dir === 'right' ? 5 : -2), py = Y + (C.top || 6) + (a.pose === 'act' ? 22 : 28); g.fillRect(px, py, 4, 4); g.fillStyle = c ? '#f47a62' : '#b4aed4'; g.fillRect(px + 2, py + 2, 2, 2); g.fillStyle = '#4c9454'; g.fillRect(px + 1, py - 1, 2, 1); }
    if (a.bubble) bubble(g, X + C.pivot[0], Y + (C.top || 6) - 4, a.bubble);
  }
  const ICON = { note: ['00110', '00101', '00100', '11100', '11100'], dots: ['00000', '00000', '10101', '00000', '00000'], heart: ['01010', '11111', '11111', '01110', '00100'],
    excl: ['00100', '00100', '00100', '00000', '00100'], q: ['01110', '00010', '00110', '00000', '00100'], zz: ['11110', '00100', '01000', '11110', '00000'], star: ['00100', '01110', '11111', '01110', '01010'] };
  const ICOL = { note: '#5a3a8a', dots: '#4a3a3a', heart: '#e0405a', excl: '#d8402a', q: '#3a5a9a', zz: '#3a5a9a', star: '#d8a020' };
  function bubble(g, x, y, kind) {
    x = Math.round(x) - 5; y = Math.round(y) - 9; const m = ICON[kind]; if (!m) return;
    g.fillStyle = '#2a1726'; g.fillRect(x - 1, y - 1, 11, 9); g.fillStyle = '#fff8ea'; g.fillRect(x, y, 9, 7); g.fillRect(x + 3, y + 7, 2, 1); g.fillStyle = '#2a1726'; g.fillRect(x + 3, y + 8, 2, 1);
    g.fillStyle = ICOL[kind]; for (let r = 0; r < 5; r++) for (let k = 0; k < 5; k++) if (m[r][k] === '1') g.fillRect(x + 2 + k, y + 1 + r, 1, 1);
  }

  // ---------------------------------------------------------------- subtle life on sprites (render-only)
  // sway: the sprite is drawn in 6 px strips; each strip shifts by a whole pixel following a slow wave, strongest at the top (a breeze, not a shake)
  function sway(g, im, s, amp) {
    const w = im.width, h = im.height, t = R.t * 0.9 + s.ph, st = 6;
    for (let y = 0; y < h; y += st) { const k = Math.pow(Math.max(0, (s.sp.py * 0.85 - y) / (s.sp.py * 0.85)), 1.4), o = Math.round(Math.sin(t + y * 0.018) * amp * k);
      g.drawImage(im, 0, y, w, Math.min(st, h - y), s.X + o, s.Y + y, w, Math.min(st, h - y)); }
  }
  // pulse (crystals, mushrooms, eggs): the glow pixels brighten and fade; shimmer (silk): bright threads twinkle on their own phase
  function lifeOverlay(g, s) {
    const t = R.t, night = 1 + R.dark * 1.2; g.globalCompositeOperation = 'lighter';
    if (s.sp.glow) { g.globalAlpha = Math.min(0.9, (0.1 + 0.13 * (0.5 + 0.5 * Math.sin(t * 2.1 + s.ph * 1.9))) * night); g.drawImage(s.sp.glow, s.X, s.Y); }
    if (s.sp.silk) { g.globalAlpha = Math.min(0.8, (0.05 + 0.14 * Math.max(0, Math.sin(t * 1.3 + s.ph * 2.3))) * (1 + R.dark * 0.6)); g.drawImage(s.sp.silk, s.X + (Math.sin(t * 0.7 + s.ph) > 0.8 ? 1 : 0), s.Y); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  // ---------------------------------------------------------------- dynamic world objects
  function drawFall(g, f) {
    // the curtain covers the massif face over f.w tiles; streaks move down; foam and mist at the foot
    const j = f.j, top = f.top, bot = f.bottom, t = R.t;
    for (let ti = 0; ti < f.w; ti++) { const i = f.i + ti, sx = A.SX(i, j);
      for (let c = 0; c < 32; c++) {
        const lx = c, gx = sx - 32 + lx, rtop = Math.floor((lx + 32) / 2) + 1, yTop = A.SY(i, j, top) + rtop - 3, yBot = A.SY(i, j, bot) + rtop + 2, edge = (ti === 0 && c < 3) || (ti === f.w - 1 && c > 28);
        const hc = TWM.hash2(gx, 0, 90);
        g.fillStyle = edge ? '#2f8fb0' : hc < 0.3 ? '#55bed4' : '#7fd2e2'; g.fillRect(gx, yTop, 1, yBot - yTop);
        g.fillStyle = 'rgba(255,255,255,0.85)';
        for (let s = 0; s < 3; s++) { const ph = ((t * (90 + hc * 50) + hc * 400 + s * 37) % (yBot - yTop + 30)) - 15, y0 = yTop + ph; if (y0 > yTop && y0 < yBot - 4) g.fillRect(gx, Math.round(y0), 1, 3 + Math.round(hc * 5)); }
      }
    }
    // foot: white water churning on the channel
    const fx = A.SX(f.i, j + 1), fy = A.SY(f.i, j + 1, bot);
    for (let k = 0; k < 26; k++) { const a = TWM.hash2(k, 1, 91), ph = (t * 2 + a * 6) % 1; g.fillStyle = `rgba(255,255,255,${0.9 - ph * 0.7})`; const px = fx - 24 + a * 60 + Math.sin(t * 3 + k) * 2, py = fy + 4 + ph * 14 - Math.sin(ph * Math.PI) * 10; g.fillRect(Math.round(px), Math.round(py), 2 + (k % 2), 2); }
    // lip at the top
    for (let ti = 0; ti < f.w; ti++) { const sx = A.SX(f.i + ti, j), sy = A.SY(f.i + ti, j, top); g.fillStyle = '#b8ecf4'; for (let c = 0; c < 32; c++) g.fillRect(sx - 32 + c, sy + Math.floor((c + 32) / 2) - 2, 1, 2); }
  }
  function drawCurtain(g, s) {
    // silk curtains hanging in the cave mouth: strands sway
    const x0 = s.X + 8, y0 = wy(s.x, s.y, s.z) - 58;
    for (let k = 0; k < 18; k++) { const len = 34 + TWM.hash2(k, 3, 92) * 22, sway = Math.sin(R.t * 0.9 + k * 0.7) * 2.5; g.fillStyle = k % 3 ? 'rgba(226,222,246,0.8)' : 'rgba(255,255,255,0.9)';
      for (let y = 0; y < len; y += 2) g.fillRect(Math.round(x0 + k * 2.6 + sway * (y / len)), Math.round(y0 + y), 1, 2); }
  }
  function drawFire(g, s) {
    const x = Math.round(wx(s.x, s.y)), y = Math.round(wy(s.x, s.y, s.z)) - 8;
    for (let k = 0; k < 14; k++) { const a = TWM.hash2(k, 5, 93), ph = (R.t * (1.4 + a) + a * 3) % 1; g.fillStyle = ph < 0.35 ? '#fff0a0' : ph < 0.7 ? '#ffb040' : '#e05a2a'; g.fillRect(x - 6 + Math.round(a * 12 + Math.sin(R.t * 5 + k) * 1.5), y - Math.round(ph * 16), 2, 3 - Math.round(ph * 2)); }
  }

  // ---------------------------------------------------------------- web canopy (Bàn Tơ Động), drawn above everyone
  const webCache = { ext: -1, cv: null };
  function webCanvas(W, ext) {
    if (Math.abs(webCache.ext - ext) < 0.02 && webCache.cv) return webCache.cv;
    const rx = W.rx * 4 * 1.15, ry = W.ry * 2 * 1.25, w = Math.ceil(rx * 2 + 8), h = Math.ceil(ry * 2 + 8), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), id = g.createImageData(w, h), d = id.data, cx = w / 2, cy = h / 2;
    const plot = (x, y, a) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const p = (y * w + x) * 4; d[p] = 236; d[p + 1] = 232; d[p + 2] = 252; d[p + 3] = Math.max(d[p + 3], a); };
    const lineP = (x0, y0, x1, y1, a) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let s = 0; s <= n; s++) plot(x0 + (x1 - x0) * s / n, y0 + (y1 - y0) * s / n, a); };
    const sp = W.spokes, rings = Math.round(4 + ext * 10), reach = 0.35 + ext * 0.65;
    const pts = []; for (let k = 0; k < sp; k++) { const a = k / sp * Math.PI * 2 + TWM.hash2(k, 0, 94) * 0.1, len = reach * (0.82 + TWM.hash2(k, 1, 94) * 0.18); pts.push([Math.cos(a), Math.sin(a), len]); lineP(cx, cy, cx + Math.cos(a) * rx * len, cy + Math.sin(a) * ry * len, 210); }
    for (let r = 1; r <= rings; r++) { const f = r / (rings + 0.5) * reach; for (let k = 0; k < sp; k++) { const a = pts[k], b = pts[(k + 1) % sp]; if (f > Math.min(a[2], b[2])) continue; const sag = 0.94; lineP(cx + a[0] * rx * f, cy + a[1] * ry * f, cx + (a[0] + b[0]) / 2 * rx * f * sag, cy + (a[1] + b[1]) / 2 * ry * f * sag, 150); lineP(cx + (a[0] + b[0]) / 2 * rx * f * sag, cy + (a[1] + b[1]) / 2 * ry * f * sag, cx + b[0] * rx * f, cy + b[1] * ry * f, 150); } }
    g.putImageData(id, 0, 0); webCache.ext = ext; webCache.cv = cv; return cv;
  }

  // ---------------------------------------------------------------- ambient creatures and particles (render-only; Math.random allowed)
  const AMB = { birds: [], butterflies: [], flies: [], leaves: [], steam: [], petals: [] };
  function initAmbient() {
    const hq = TWM.biomes[TWM.bi.hqs].centre, bt = TWM.btd.canopy;
    for (let f = 0; f < 3; f++) { const flock = { x: (hq[0] - 10 + f * 8) * 8, y: (hq[1] - 6 + f * 5) * 8, a: Math.random() * 6, n: 4 + f, r: 30 + f * 12 }; AMB.birds.push(flock); }
    for (let k = 0; k < 26; k++) { const p = TWM.randomWalkable('hqs', Math.random); if (p) AMB.butterflies.push({ hx: (p[0] + 0.5) * 8, hy: (p[1] + 0.5) * 8, ph: Math.random() * 6, c: ['#ffe066', '#ffffff', '#ff9ab8', '#a0d8ff'][k % 4] }); }
    for (let k = 0; k < 60; k++) { const p = TWM.randomWalkable('btd', Math.random); if (p) AMB.flies.push({ hx: (p[0] + 0.5) * 8, hy: (p[1] + 0.5) * 8, ph: Math.random() * 6, c: k % 3 ? '#9cff8a' : '#d0a8ff' }); }
    for (let k = 0; k < 14; k++) AMB.leaves.push({ u: Math.random(), v: Math.random(), t: Math.random() * 30, stuck: -1 });
  }
  function drawButterflies(g) {
    for (const b of AMB.butterflies) { const t = R.t + b.ph, x = b.hx + Math.sin(t * 0.7) * 10 + Math.sin(t * 2.3) * 3, y = b.hy + Math.cos(t * 0.5) * 8, z = TWM.groundZ(b.hx, b.hy) + 5 + Math.sin(t * 3) * 2;
      const X = Math.round(wx(x, y)), Y = Math.round(wy(x, y, z)), up = Math.floor(t * 9) % 2; g.fillStyle = b.c; g.fillRect(X - 2, Y - up, 2, 2 - up); g.fillRect(X + 1, Y - up, 2, 2 - up); g.fillStyle = '#2a1726'; g.fillRect(X, Y, 1, 2); }
  }
  function drawBirds(g) {
    for (const f of AMB.birds) { f.a += 0.0035; const cx = f.x + Math.cos(f.a) * f.r * 3, cy = f.y + Math.sin(f.a * 1.3) * f.r;
      for (let k = 0; k < f.n; k++) { const x = cx + Math.cos(f.a * 2 + k) * 10 + k * 6, y = cy + Math.sin(f.a * 3 + k * 1.7) * 6 + k * 3, X = Math.round(wx(x, y)), Y = Math.round(wy(x, y, 60 + Math.sin(R.t + k) * 4)), up = Math.floor(R.t * 6 + k) % 2;
        g.fillStyle = '#2a1726'; g.fillRect(X - 3, Y - up, 3, 1); g.fillRect(X + 1, Y - up, 3, 1); g.fillRect(X, Y, 1, 1); } }
  }
  function drawFlies(g) { for (const f of AMB.flies) { const t = R.t * 0.6 + f.ph, x = f.hx + Math.sin(t) * 12 + Math.sin(t * 2.7) * 4, y = f.hy + Math.cos(t * 0.8) * 10, z = TWM.groundZ(f.hx, f.hy) + 6 + Math.sin(t * 1.7) * 4; if ((Math.floor(t * 3) % 5) === 0) continue; g.fillStyle = f.c; g.fillRect(Math.round(wx(x, y)), Math.round(wy(x, y, z)), 1, 1); } }

  // ---------------------------------------------------------------- frame
  const TOD = [[0, '#2c3070', 0.62], [5, '#2c3070', 0.58], [6.5, '#ffb08a', 0.24], [8, '#ffffff', 0], [16.5, '#ffffff', 0], [18, '#ff9a78', 0.3], [19.5, '#4a3c86', 0.5], [24, '#2c3070', 0.62]];
  function tint(h) { let i = 0; while (i < TOD.length - 2 && TOD[i + 1][0] <= h) i++; const a = TOD[i], b = TOD[i + 1], k = (h - a[0]) / (b[0] - a[0]); const ca = parseInt(a[1].slice(1), 16), cb = parseInt(b[1].slice(1), 16);
    const c = [0, 8, 16].map(s => Math.round(((ca >> s) & 255) + (((cb >> s) & 255) - ((ca >> s) & 255)) * k)); return [`rgb(${c[2]},${c[1]},${c[0]})`, a[2] + (b[2] - a[2]) * k]; }
  let gloom = null;
  function gloomCanvas() {
    // a per-tile tint map for the gorge (deep shade by day, violet at night); drawn smoothed as light, never on sprites' edges
    if (gloom) return gloom; const N = TWM.N, cv = document.createElement('canvas'); cv.width = N * 2; cv.height = N; const g = cv.getContext('2d'), id = g.createImageData(N * 2, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const b = TWM.biomeAt(i, j) === 'btd'; if (!b) continue; const u = i - j + N, v = Math.floor((i + j) / 2);
      for (const uu of [u, u - 1]) { if (uu < 0 || uu >= N * 2 || v >= N) continue; const p = (v * N * 2 + uu) * 4; id.data[p] = 120; id.data[p + 1] = 100; id.data[p + 2] = 170; id.data[p + 3] = 255; } }
    g.putImageData(id, 0, 0); gloom = cv; return cv;
  }
  function frame(dt, sim) {
    const t0 = performance.now(); R.t += dt; R.bakeMs = 0;
    const g = R.g, cv = R.cv; const [x0, y0, W, Hh] = viewRect();
    g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
    g.fillStyle = '#e8e2ef'; g.fillRect(0, 0, W, Hh);
    g.setTransform(1, 0, 0, 1, -x0, -y0);
    // sea of clouds below the island
    // ground chunks: bake what is visible (nearest first), bounded per frame once the first view is ready
    const ci0 = Math.floor(x0 / CH), ci1 = Math.floor((x0 + W) / CH), cj0 = Math.floor(y0 / CH), cj1 = Math.floor((y0 + Hh) / CH);
    const need = [];
    for (let cj = cj0; cj <= cj1; cj++) for (let ci = ci0; ci <= ci1; ci++) { const c = chunk(ci, cj); if (!c.ready) need.push(c); }
    const budget = R.first ? 9 : 1e9; let used = 0;
    need.sort((a, b) => Math.hypot(a.ci * CH + 256 - R.cx, a.cj * CH + 256 - R.cy) - Math.hypot(b.ci * CH + 256 - R.cx, b.cj * CH + 256 - R.cy));
    for (const c of need) { if (used > budget) break; const s = performance.now(); bake(c); used += performance.now() - s; }
    R.first = true;
    const wfI = Math.floor(R.t * 5) % 4;
    for (let cj = cj0; cj <= cj1; cj++) for (let ci = ci0; ci <= ci1; ci++) { const c = chunk(ci, cj); if (!c.ready) continue; g.drawImage(c.cv, ci * CH, cj * CH); if (c.wf) g.drawImage(c.wf[wfI], ci * CH, cj * CH); }
    // flat decals
    for (const s of R.flats) if (s.X < x0 + W && s.X + s.sp.w > x0 && s.Y < y0 + Hh && s.Y + s.sp.h > y0) g.drawImage(s.sp.frames[0], s.X, s.Y);
    if (sim && window.TWFX) TWFX.ground(g, sim, R, x0, y0, W, Hh);
    // sorted drawables
    const D = [], cols = new Map();
    const addCols = (list, lvl) => { for (const k of list) { const c = cols.get(k); if (c === undefined || lvl < c) cols.set(k, lvl); } };
    for (let cj = Math.floor((y0 - 260) / CH); cj <= cj1 + 1; cj++) for (let ci = ci0 - 1; ci <= ci1 + 1; ci++) { const L = R.grid.get(ci + ',' + cj); if (!L) continue;
      for (const s of L) { if (s.X > x0 + W || s.X + s.sp.w < x0 || s.Y > y0 + Hh || s.Y + s.sp.h < y0) continue; D.push([s.key, 0, s]); if (s.occ.length) addCols(s.occ, Math.floor(s.z / 4)); } }
    if (sim) for (const a of sim.agents) {
      if (a.gone || a.hidden) continue; const X = wx(a.x, a.y), Y = wy(a.x, a.y, a.gz);
      if (X < x0 - 40 || X > x0 + W + 40 || Y < y0 - 20 || Y > y0 + Hh + 80) continue;
      D.push([a.key !== undefined ? a.key : a.x + a.y, 1, a]);
      addCols(columnsInFront(a.x, a.y, a.gz, X - 16, Y - 48 - (a.lift || 0) * 4, 32, 48), Math.floor(a.gz / 4 + 0.01));
    }
    for (const f of TWM.falls) D.push([(f.i + f.j + 1) * 8 + 2, 2, f]);
    for (const [k, lvl] of cols) { const i = k % TWM.N, j = Math.floor(k / TWM.N); D.push([(i + j + 1) * 8 - 0.01, 3, k, lvl]); }
    D.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (const it of D) {
      if (it[1] === 0) { const s = it[2], fr = s.sp.frames, f = fr.length === 1 ? fr[0] : fr.length === 2 ? fr[Math.floor(R.t * 0.8 + s.ph) % 2] : fr[Math.floor(R.t * 4 + s.ph) % fr.length];
        if (s.p.kind === 'dummy' && s.p.hit > 0) g.drawImage(f, s.X + (Math.floor(R.t * 30) % 2 ? 1 : -1), s.Y);
        else if (s.sp.sway) sway(g, f, s, s.sp.sway);
        else if (s.p.flip) { g.save(); g.translate(s.X + f.width, s.Y); g.scale(-1, 1); g.drawImage(f, 0, 0); g.restore(); } else g.drawImage(f, s.X, s.Y);
        if (s.sp.glow || s.sp.silk) lifeOverlay(g, s);
        if (s.p.kind === 'fire') drawFire(g, s); if (s.p.kind === 'curtain') drawCurtain(g, s); }
      else if (it[1] === 1) drawAgent(g, it[2]);
      else if (it[1] === 2) drawFall(g, it[2]);
      else drawColumn(g, it[2], it[3]);
    }
    // overlays: web canopy, creatures, particles, FX
    for (const Wb of TWM.webs) { const ext = sim && sim.web ? sim.web.ext : Wb.base, cvw = webCanvas(Wb, ext), X = wx(Wb.x, Wb.y), Y = wy(Wb.x, Wb.y, Wb.z), sw = Math.round(Math.sin(R.t * 0.5) * 1.2);
      if (X + cvw.width / 2 > x0 && X - cvw.width / 2 < x0 + W && Y + cvw.height / 2 > y0 && Y - cvw.height / 2 < y0 + Hh) { g.globalAlpha = sim && sim.web && sim.web.glow ? 1 : 0.85; g.drawImage(cvw, Math.round(X - cvw.width / 2) + sw, Math.round(Y - cvw.height / 2)); g.globalAlpha = 1; } }
    drawButterflies(g); drawFlies(g); drawBirds(g);
    if (sim && window.TWFX) TWFX.draw(g, sim, R, x0, y0, W, Hh);
    // time of day + gorge gloom
    if (R.tod === 'auto') R.clock = (R.clock + dt * 24 / 480) % 24;
    const [col, amt] = tint(R.clock); R.dark = amt;
    g.globalCompositeOperation = 'multiply';
    const gc = gloomCanvas(); g.imageSmoothingEnabled = true; g.globalAlpha = 0.55 + amt * 0.3; g.drawImage(gc, 0, A.OY - 32 + 16, A.WORLD_W, TWM.N * 32); g.imageSmoothingEnabled = false; g.globalAlpha = 1;
    if (amt > 0.01) { g.globalAlpha = amt; g.fillStyle = col; g.fillRect(x0, y0, W, Hh); g.globalAlpha = 1; }
    g.globalCompositeOperation = 'source-over';
    // emissive pixels come back on top of the grade; glows around lights
    const ea = Math.min(1, 0.45 + amt * 1.2);
    g.globalAlpha = ea; for (let cj = cj0; cj <= cj1; cj++) for (let ci = ci0; ci <= ci1; ci++) { const c = R.chunks.get(ci + ',' + cj); if (c && c.ready && c.ecv) g.drawImage(c.ecv, ci * CH, cj * CH); }
    for (const it of D) if (it[1] === 0 && it[2].sp.em) { const s = it[2], fl = s.p.kind === 'lantern' || s.p.kind === 'vlantern' ? 0.78 + 0.22 * TWM.hash2(Math.floor(R.t * 9) + s.ph, s.ph, 5) : 0.82 + 0.18 * Math.sin(R.t * 2.1 + s.ph * 1.9); g.globalAlpha = Math.min(1, ea * fl); g.drawImage(s.sp.em, s.X, s.Y); }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'lighter';
    for (const L of TWM.lights) { const btd = L.biome === 'btd', fl = L.kind === 'fire' ? 0.8 + 0.2 * TWM.hash2(Math.floor(R.t * 12), L.i * 7 + L.j, 6) : L.kind === 'lantern' ? 0.86 + 0.14 * Math.sin(R.t * 5 + L.i) * TWM.hash2(Math.floor(R.t * 6), L.j, 7) + 0.06 : L.kind === 'crystal' ? 0.8 + 0.2 * Math.sin(R.t * 1.8 + L.i * 0.7 + L.j) : 1, a = ((btd ? 0.16 : 0) + amt * (L.kind === 'fire' ? 0.5 : 0.32)) * fl; if (a < 0.02) continue; const x = wx((L.i + 0.5) * 8, (L.j + 0.5) * 8), y = wy((L.i + 0.5) * 8, (L.j + 0.5) * 8, TWM.H[TWM.id(L.i, L.j)] * 4) - 10;
      if (x < x0 - 90 || x > x0 + W + 90 || y < y0 - 90 || y > y0 + Hh + 90) continue; const rg = g.createRadialGradient(x, y, 2, x, y, L.r); rg.addColorStop(0, `rgba(${L.col},${a})`); rg.addColorStop(1, `rgba(${L.col},0)`); g.fillStyle = rg; g.fillRect(x - L.r, y - L.r, L.r * 2, L.r * 2); }
    if (sim && window.TWFX) TWFX.light(g, sim, R, amt);
    g.globalCompositeOperation = 'source-over';
    if (R.debug) debugDraw(g, x0, y0, W, Hh, sim);
    R.frameMs = performance.now() - t0; R.stats = { items: D.length, cols: cols.size, chunks: R.chunks.size, bake: R.bakeMs };
  }
  function debugDraw(g, x0, y0, W, Hh, sim) {
    const N = TWM.N; g.lineWidth = 1;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const sx = A.SX(i, j), sy = A.SY(i, j, TWM.H[TWM.id(i, j)]); if (sx < x0 - 40 || sx > x0 + W + 40 || sy < y0 - 40 || sy > y0 + Hh + 40) continue;
      const k = TWM.id(i, j); g.strokeStyle = TWM.WALK[k] ? 'rgba(80,255,120,0.35)' : 'rgba(255,60,90,0.45)'; g.beginPath(); g.moveTo(sx, sy + 1); g.lineTo(sx + 31, sy + 16); g.lineTo(sx, sy + 31); g.lineTo(sx - 31, sy + 16); g.closePath(); g.stroke();
      if (TWM.stairAt.has(k)) { g.fillStyle = '#ffd200'; g.fillRect(sx - 2, sy + 14, 4, 4); } }
    if (sim) for (const a of sim.agents) { if (a.gone || a.hidden) continue; const X = wx(a.x, a.y), Y = wy(a.x, a.y, a.gz); g.fillStyle = '#fff200'; g.fillRect(Math.round(X) - 1, Math.round(Y) - 1, 3, 3);
      if (a.path && a.path.length) { g.strokeStyle = 'rgba(255,240,0,0.6)'; g.beginPath(); g.moveTo(X, Y); for (const [px, py] of a.path) g.lineTo(wx(px, py), wy(px, py, TWM.groundZ(px, py))); g.stroke(); } }
  }
  function resize() {
    const dpr = window.devicePixelRatio || 1, pw = innerWidth * dpr, ph = innerHeight * dpr;
    R.cv.width = Math.ceil(pw / R.zoom); R.cv.height = Math.ceil(ph / R.zoom);
    R.cv.style.width = (R.cv.width * R.zoom / dpr) + 'px'; R.cv.style.height = (R.cv.height * R.zoom / dpr) + 'px';
    clamp();
  }
  function clamp() { R.cx = Math.max(R.cv.width / 2, Math.min(A.WORLD_W - R.cv.width / 2, R.cx)); R.cy = Math.max(R.cv.height / 2 - 200, Math.min(A.WORLD_H - R.cv.height / 2, R.cy)); }
  function lookAt(x, y, z) { R.cx = wx(x, y); R.cy = wy(x, y, z || 0); clamp(); }
  function init(cv) { R.cv = cv; R.g = cv.getContext('2d'); initStatics(); initAmbient(); resize(); }
  return Object.assign(R, { init, frame, resize, clamp, lookAt, drawAgent, bubble, sheet, columnsInFront });
})();
