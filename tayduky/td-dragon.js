'use strict';
// ===== Tây Du Ký — border dragon =====
// A long Eastern dragon painted in code (PixelLab credits are spent; nothing is sampled or downloaded). It drifts clockwise
// around the edge of the window on a low-resolution canvas that is scaled up with image-rendering: pixelated, so it matches the
// map's crisp pixels. The canvas is pointer-events:none and sits under the panels (z-index 1 vs 3): it only decorates the frame.
// Reduced motion: one still frame, no travel. Hidden tab: paused. body.clean hides it with the panels.
(function () {
  const cv = document.getElementById('dragon'); if (!cv) return;
  const g = cv.getContext('2d'), S = innerWidth < 700 ? 2 : 3;                       // 1 dragon pixel = 3 screen pixels
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const C = { out: '#06201a', jade: '#1f7a63', jade2: '#2fa07f', deep: '#12503f', belly: '#e3cf8a', gold: '#e0b040', red: '#b3261e', ivory: '#f4ecd0', eye: '#ff5a3c', glow: '#f6d56a' };
  let W = 0, H = 0, per = 0, pts = [], s0 = 0, t = 0, last = 0, raf = 0;
  const MARGIN = 12, R = 16, STEP = 2.6, N = 96;               // inset from the edge, corner radius, segment spacing, segment count (all in dragon pixels)
  function resize() {
    W = Math.ceil(innerWidth / S); H = Math.ceil(innerHeight / S); cv.width = W; cv.height = H;
    const x0 = MARGIN, y0 = MARGIN, x1 = W - MARGIN, y1 = H - MARGIN, w = x1 - x0 - 2 * R, h = y1 - y0 - 2 * R, q = Math.PI * R / 2;
    per = 2 * (w + h) + 4 * q;
    pts = { x0, y0, x1, y1, w, h, q };
    if (still.matches) draw(0);
  }
  // clockwise perimeter, arc length s -> position + inward normal
  function P(s) {
    const { x0, y0, x1, y1, w, h, q } = pts; s = ((s % per) + per) % per;
    let a = w; if (s < a) return [x0 + R + s, y0, 0, 1];
    s -= a; if (s < q) { const k = s / R; return [x1 - R + Math.sin(k) * R, y0 + R - Math.cos(k) * R, -Math.sin(k), Math.cos(k)]; }
    s -= q; if (s < h) return [x1, y0 + R + s, -1, 0];
    s -= h; if (s < q) { const k = s / R; return [x1 - R + Math.cos(k) * R, y1 - R + Math.sin(k) * R, -Math.cos(k), -Math.sin(k)]; }
    s -= q; if (s < w) return [x1 - R - s, y1, 0, -1];
    s -= w; if (s < q) { const k = s / R; return [x0 + R - Math.sin(k) * R, y1 - R + Math.cos(k) * R, Math.sin(k), -Math.cos(k)]; }
    s -= q; if (s < h) return [x0, y1 - R - s, 1, 0];
    s -= h; const k = s / R; return [x0 + R - Math.cos(k) * R, y0 + R - Math.sin(k) * R, Math.cos(k), Math.sin(k)];
  }
  function at(s, tt) {                                          // body centreline: perimeter point pushed sideways by a travelling wave
    const p = P(s), amp = 3.2 + Math.sin(s * 0.011 + tt * 0.3) * 1.1, o = Math.sin(s * 0.16 - tt * 2.4) * amp;
    return [p[0] + p[2] * o, p[1] + p[3] * o, p[2], p[3]];
  }
  const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  function disk(x, y, r, c) { x = Math.round(x); y = Math.round(y); g.fillStyle = c; for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r + 0.5 - dy * dy)); g.fillRect(x - w, y + dy, 2 * w + 1, 1); } }
  const rad = i => { const k = i / N; return k < 0.06 ? 4 : Math.max(1, Math.round(4.2 - k * 3.4 + (k < 0.2 ? 0.4 : 0))); };   // thick neck/body, thin tail
  function draw(tt) {
    g.clearRect(0, 0, W, H);
    const dark = (window.TWR && TWR.dark) || 0, seg = [];
    for (let i = 0; i < N; i++) seg.push(at(s0 - i * STEP, tt));
    // body: outline pass, then fill pass (tail first so the head overlaps)
    for (let i = N - 1; i >= 0; i--) disk(seg[i][0], seg[i][1], rad(i) + 1, C.out);
    for (let i = N - 1; i >= 0; i--) {
      const [x, y, nx, ny] = seg[i], r = rad(i), band = (i >> 1) % 2;
      disk(x, y, r, band ? C.jade : C.jade2);
      disk(x - nx * Math.max(0, r - 1), y - ny * Math.max(0, r - 1), Math.max(1, r - 2), C.belly);       // pale belly stripe on the outer side
      if (i % 4 === 1 && i > 3) { const sx = x + nx * (r + 1), sy = y + ny * (r + 1); px(sx, sy, 1, 1, C.red); px(sx + nx, sy + ny, 1, 1, C.gold); }   // dorsal spines
      if (i % 11 === 6) px(x, y, 1, 1, C.gold);                                                         // gold scale flecks
    }
    // legs: two small gold-clawed limbs
    for (const i of [24, 62]) { const [x, y, nx, ny] = seg[i], r = rad(i), dir = [seg[i - 1][0] - seg[i + 1][0], seg[i - 1][1] - seg[i + 1][1]], L = Math.hypot(dir[0], dir[1]) || 1, ux = dir[0] / L, uy = dir[1] / L, sw = Math.sin(tt * 2.4 + i) * 2;
      for (const sgn of [-1, 1]) { const bx = x + nx * sgn * (r + 1), by = y + ny * sgn * (r + 1), ex = bx + nx * sgn * 3 + ux * sw, ey = by + ny * sgn * 3 + uy * sw; px(bx, by, 1, 1, C.out); px((bx + ex) / 2, (by + ey) / 2, 1, 1, C.jade); px(ex, ey, 2, 1, C.gold); } }
    // tail tuft
    { const [x, y, nx, ny] = seg[N - 1]; for (let k = 1; k <= 4; k++) px(x - nx * 0 + Math.sin(tt * 3 + k) * 1.5 + nx * 0, y + 0, 1, 1, k % 2 ? C.red : C.gold), px(x + (seg[N - 1][0] - seg[N - 3][0]) * k * 0.5, y + (seg[N - 1][1] - seg[N - 3][1]) * k * 0.5 + Math.sin(tt * 3 + k) * 1.2, 2, 2, k % 2 ? C.red : C.gold); }
    // head
    const h0 = seg[0], h1 = seg[3], dx = h0[0] - h1[0], dy = h0[1] - h1[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, vx = -uy, vy = ux;   // u: forward, v: sideways
    const hp = (a, b) => [h0[0] + ux * a + vx * b, h0[1] + uy * a + vy * b];
    for (const [a, b, r, c] of [[0, 0, 6, C.out], [5, 0, 5, C.out], [9, 0, 3, C.out]]) { const p = hp(a, b); disk(p[0], p[1], r, c); }
    for (const [a, b, r, c] of [[0, 0, 5, C.jade2], [5, 0, 4, C.jade], [9, 0, 2, C.jade2], [7, 0, 1, C.belly]]) { const p = hp(a, b); disk(p[0], p[1], r, c); }
    for (const sgn of [-1, 1]) {
      let p = hp(-2, sgn * 5); for (let k = 0; k < 5; k++) { const q = hp(-3 - k * 2.4, sgn * (5 + k * 1.6)); px(q[0], q[1], 2, 2, k < 2 ? C.gold : C.ivory); }                     // swept antler horns
      p = hp(4, sgn * 4); px(p[0], p[1], 2, 2, dark > 0.4 ? C.glow : C.eye); px(p[0] - 1, p[1] - 1, 1, 1, C.out);                                                          // eyes
      p = hp(9, sgn * 2); px(p[0], p[1], 1, 1, C.out);                                                                                                                     // nostrils
      for (let k = 0; k < 11; k++) { const w = Math.sin(tt * 3 + k * 0.7 + sgn) * (1 + k * 0.25), q = hp(9 + k * 0.5 - 6, sgn * (3 + k * 1.1 + w * 0.4)); px(q[0], q[1] + w * 0.3, 1, 1, k % 3 ? C.gold : C.ivory); }   // whiskers
    }
    px(...hp(2, 0), 2, 2, C.red);
    // the pearl: a glow just ahead of the jaws
    const pp = hp(19 + Math.sin(tt * 2) * 1.5, Math.sin(tt * 1.3) * 3), pr = 2 + (dark > 0.4 ? 1 : 0);
    g.globalAlpha = 0.25 + dark * 0.2; disk(pp[0], pp[1], pr + 3, C.glow); g.globalAlpha = 0.5; disk(pp[0], pp[1], pr + 1, C.glow); g.globalAlpha = 1; disk(pp[0], pp[1], pr, C.ivory); px(pp[0], pp[1], 1, 1, '#fff');
  }
  function loop(now) {
    raf = requestAnimationFrame(loop); if (document.hidden) { last = now; return; }
    const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now; t += dt; s0 += dt * 11; draw(t);
  }
  addEventListener('resize', resize); resize();
  s0 = per * 0.2;
  if (still.matches) { s0 = per * 0.18; draw(0); } else raf = requestAnimationFrame(loop);
  still.addEventListener && still.addEventListener('change', () => { cancelAnimationFrame(raf); if (still.matches) { draw(0); } else { last = 0; raf = requestAnimationFrame(loop); } });
  window.TWDRAGON = { draw, get s() { return s0; }, set s(v) { s0 = v; } };
})();
