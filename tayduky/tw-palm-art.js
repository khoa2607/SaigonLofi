'use strict';
// ===== Tây Du Ký v2 — Lòng Bàn Tay Phật Tổ: art (loaded after tw-art.js; plugs into TWA.ext) =====
// Original, code-painted pixel art in the v2 style: cumulus terraces (billow noise lit from the top left, golden light near the fingers),
// soft puffy cliff faces with ragged undersides (no ink outline: clouds are light), and the five finger pillars, swept along a spine
// with cylinder shading, knuckle creases and palm-side pads. Each finger has CURL frames so the palm can close in the signature story.
(function () {
  const A = TWA, hx = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }, ramp = a => a.map(hx);
  const { tone, mix } = A, { vnoise, hash2 } = TWM, M = TWM.M;
  const CLOUD = ramp(['#8d98d8', '#a7acea', '#c1bcf0', '#d9d2f6', '#ece6fb', '#f8f3ff', '#fff3d6']);
  const DEEP = ramp(['#6f7fc4', '#8791d6', '#9da0e0', '#b3aee8', '#c9c2f0']);
  const FACE = ramp(['#8a96d6', '#a2a6e6', '#bdb8ee', '#d5cef5', '#e9e3fa', '#f6f0ff']);
  const SKIN = ramp(['#8a6c9c', '#b3908f', '#d4b080', '#e8c88f', '#f6dfa8', '#fff1cf', '#fffbea']);
  const INKP = hx('#5a3a5e'), GOLD = hx('#ffe08a');
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

  // ---------------------------------------------------------------- terrain: cloud top
  // golden light pools around each finger (and the Buddha); computed once per tile
  let glowMap = null;
  function goldAt(I, J) {
    const P = TWM.palm; if (!P) return 0; let g = 0;
    for (const f of P.fingers) { const d = Math.hypot(I - f.cx, (J - f.cy)); g = Math.max(g, Math.max(0, 1 - d / 7)); }
    const d = Math.hypot(I - P.buddha[0], J - P.buddha[1]); g = Math.max(g, Math.max(0, 1 - d / 9) * 0.9);
    return g;
  }
  function fbm(I, J, s) { return vnoise(I * 0.5, J * 0.5, s) * 0.55 + vnoise(I * 1.4, J * 1.4, s + 1) * 0.3 + vnoise(I * 3.3, J * 3.3, s + 2) * 0.15; }
  function top(m, I, J, X, Y, k, d, SH) {
    const b = fbm(I, J, 330), e = 0.13, lit = fbm(I - e, J - e, 330) - fbm(I + e, J + e, 330), gold = goldAt(I, J), hp = hash2(X, Y, 331);
    if (m === M.SKYD) {
      let t = 0.7 + b * 2.9 + lit * 5 + (d ? 0.2 : 0); let c = tone(DEEP, t);
      if (gold > 0.15 && vnoise(I * 0.9, J * 0.9, 340) > 0.5) { c = mix(c, GOLD, gold * 0.55); if (hash2(X, Y, 341) < 0.22) SH.em = [255, 220, 150]; }   // luminous gaps between the banks
      if (hp < 0.012) c = tone(CLOUD, 5);
      return c;
    }
    let t = 1.5 + b * 3.4 + lit * 6 + (d ? 0.2 : 0); const path = TWM.PATHC[k];
    if (path) t += 0.55;
    let c = tone(CLOUD, t);
    if (gold > 0.05) c = mix(c, GOLD, Math.min(0.55, gold * (0.35 + (t > 3.8 ? 0.35 : 0))));
    if (hp < 0.006) c = [255, 252, 238];                                                           // sparkles
    else if (path && hp < 0.05) c = mix(c, GOLD, 0.5);                                             // gold dust marks the routes quietly
    if (t > 4.9 && hash2(X, Y, 342) < 0.3) SH.em = [255, 236, 190];                                                           // moonlit cloud tops glow golden at night
    return c;
  }
  // ---------------------------------------------------------------- cliff faces: billowing, soft, ragged underside (null = leave transparent)
  // cumulus billows: a jittered field of round puffs; each pixel takes the puff it sits deepest in and is lit like a little sphere (top left), so a cliff
  // reads as a heap of clouds, not a slab. Rims are a shade darker, bases shade toward lavender-blue.
  function billow(gx, el, cell) {
    const cx = Math.floor(gx / cell), cy = Math.floor(el / cell); let best = 9, bdx = 0, bdy = 0, br = 1;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const ax = cx + ox, ay = cy + oy, px = (ax + 0.2 + hash2(ax, ay, 325) * 0.6) * cell, py = (ay + 0.2 + hash2(ax, ay, 326) * 0.6) * cell, r = cell * (0.62 + hash2(ax, ay, 327) * 0.38), dx = (gx - px) / r, dy = (el - py) / r, d = Math.hypot(dx, dy);
      if (d < best) { best = d; bdx = dx; bdy = dy; br = r; }
    }
    return [best, bdx, bdy];
  }
  function face(side, lx, ry, drop, elev, gx, k, SH) {
    const [d, dx, dy] = billow(gx, elev, 15), s0 = vnoise(gx * 0.05, elev * 0.05, 321), fromBottom = drop - ry;
    // sphere lighting: elev grows upward, so +dy is the top of a puff
    const lit = Math.max(-1, Math.min(1, dx * -0.55 + dy * 0.75)) * (1 - Math.min(1, d * d) * 0.15);
    let t = (side ? 1.4 : 3.0) + lit * 1.7 + s0 * 1.2 - (d > 0.82 ? 0.9 : 0);
    if (fromBottom < 8) { t -= (8 - fromBottom) * 0.22; if (fromBottom < 4 && hash2(gx, ry, 324) < (4 - fromBottom) * 0.17) return null; }   // ragged, wispy underside
    if (ry === 0) t += 1.3;
    if (t > 4.7) SH.em = [255, 236, 190];
    return tone(FACE, t);
  }
  const STAIR = ramp(['#9ea2e2', '#b9b4ee', '#d4ccf6', '#e9e2fb', '#f6f0ff']);
  const edge = c => mix(c, [150, 150, 214], 0.45);

  // ---------------------------------------------------------------- the finger pillars
  // sweep along a spine; q in [-r, r] across; lambert lighting from the top left; creases at the knuckles
  const LIGHT = (() => { const l = [-0.5, -0.55, 0.67], n = Math.hypot(...l); return l.map(v => v / n); })();
  const FRAMES = 9;
  // per-finger curl: which way it bends (+1 right, -1 left, 0 toward the viewer) and the total bend of its three phalanges
  const BEND = [{ dir: 1, a: [0.32, 0.62, 0.55] }, { dir: 1, a: [0.3, 0.58, 0.5] }, { dir: 0, a: [0.4, 0.7, 0.6] }, { dir: -1, a: [0.3, 0.58, 0.5] }, { dir: -1, a: [0.28, 0.5, 0.45] }];
  function paintFinger(idx, lv, w, curl) {
    const H = lv * 16 + 30, r0 = w / 2, r1 = r0 * 0.74, lean = [-7, -3, 0, 3, 8][idx], bend = BEND[idx], L = H - r1 * 0.9, seg = [0.4 * L, 0.33 * L, 0.27 * L];
    const padL = bend.dir < 0 ? Math.round(H * 0.72) : 14, padR = bend.dir > 0 ? Math.round(H * 0.72) : 14, CW = Math.ceil(w + padL + padR), CH = Math.ceil(H + 24);
    const ox = padL + Math.round(r0), oy = CH - 4;                                     // anchor: base centre
    const data = new Uint8ClampedArray(CW * CH * 4), glow = new Uint8Array(CW * CH);
    const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= CW || y >= CH) return; const p = (y * CW + x) * 4; data[p] = c[0]; data[p + 1] = c[1]; data[p + 2] = c[2]; data[p + 3] = 255; };
    // joint angles: smoothly interpolated so the bend is round
    const ang = [0, curl * bend.a[0], curl * (bend.a[0] + bend.a[1]), curl * (bend.a[0] + bend.a[1] + bend.a[2])], dirs = bend.dir || 0.0001;
    const bounds = [0, seg[0], seg[0] + seg[1], L], phiAt = s => { let k = 0; while (k < 2 && s > bounds[k + 1]) k++; const f = Math.max(0, Math.min(1, (s - bounds[k]) / (bounds[k + 1] - bounds[k]))), sm = f * f * (3 - 2 * f); return ang[k] + (ang[k + 1] - ang[k]) * sm; };
    const knuckles = [seg[0], seg[0] + seg[1]];
    let x = ox, y = oy, prevPhi = 0;
    const step = 0.45;
    for (let s = 0; s <= L + r1 * 0.95; s += step) {
      const sc = Math.min(s, L), phi = phiAt(sc), depth = bend.dir === 0;
      const tx = depth ? 0 : Math.sin(phi) * Math.sign(bend.dir), ty = -Math.cos(phi);
      // the spine advances; a viewer-facing bend shortens the vertical advance instead of leaning sideways
      x += tx * step + (depth ? 0 : Math.cos(Math.min(s, L) / L * Math.PI) * lean * 0.011); y += (depth ? ty * (1 - 0.55 * Math.sin(phi) ) : ty) * step;
      let r = sc >= L ? r1 * Math.sqrt(Math.max(0, 1 - ((s - L) / (r1 * 0.95)) ** 2)) : r1 + (r0 - r1) * Math.pow(1 - sc / L, 0.85) * 1.0 + r0 * 0.16 * Math.exp(-((sc / 26) ** 2));   // flared where it leaves the palm
      for (const kj of knuckles) r += w * 0.062 * Math.exp(-(((sc - kj) / 10) ** 2));      // knuckle swells
      r *= 1 - 0.03 * Math.sin(Math.min(sc, L) / L * Math.PI * 3);                            // very slightly uneven, like a real finger
      if (depth) r *= 1 + 0.32 * (1 - Math.cos(phi)) * 3;
      const nx = -ty, ny = tx;                                                          // across-the-finger direction (perpendicular to the spine)
      const nxx = depth ? 1 : nx * 1, nyy = depth ? 0 : ny;
      for (let q = -r; q <= r; q += 0.4) {
        const qn = q / Math.max(1, r), nz = Math.sqrt(Math.max(0, 1 - qn * qn));
        const Nx = nxx * qn, Ny = nyy * qn - (sc >= L ? Math.min(1, (s - L) / (r1 * 0.95)) * 0.6 : 0) * nz;
        let lam = Math.max(0, Nx * LIGHT[0] + Ny * LIGHT[1] + nz * LIGHT[2]);
        let t = 0.5 + lam * 4.9 + ((Math.round(x + nxx * q) + Math.round(y + nyy * q)) & 1 ? 0.22 : -0.22);
        if (depth) t += 0.9 * (1 - Math.cos(phi)) * 3;                                  // a bending finger turns its pad up to the light
        const rim = qn * nxx > 0.84;
        let c = tone(SKIN, rim ? 3 : t);
        // palm-side detail: three short creases at each knuckle (curved by the cylinder), and a fingerprint whorl on the tip pad
        for (const kj of knuckles) { const dd = Math.abs(sc - kj - 2.2 * qn * qn); if (dd < 0.8 || (Math.abs(sc - kj + 5.5 - 1.7 * qn * qn) < 0.55 && Math.abs(qn) < 0.72) || (Math.abs(sc - kj - 5.2 - 1.5 * qn * qn) < 0.5 && Math.abs(qn) < 0.55)) c = tone(SKIN, Math.max(0.2, t - 2.6)); }
        if (sc > L * 0.78 && Math.abs(qn) < 0.72) { const rr = Math.hypot(qn * 1.5, (sc - L * 0.9) / (r1 * 0.55)); if (rr < 1.35 && Math.abs((rr * 3.2) % 1 - 0.5) < 0.14) c = tone(SKIN, Math.max(0.3, t - 1.2)); }
        if (hash2(Math.round(x), Math.round(y), 350 + idx) < 0.035) c = tone(SKIN, t + 1.2);
        const px = x + nxx * q, py = y + nyy * q; put(px, py, c); glow[Math.round(py) * CW + Math.round(px)] = 1;
      }
    }
    // outline (a warm violet, lighter than the cast's ink: these are sacred and luminous)
    const out = new Uint8ClampedArray(data); for (let yy = 0; yy < CH; yy++) for (let xx = 0; xx < CW; xx++) { const p = (yy * CW + xx) * 4; if (data[p + 3]) continue;
      const nb = (xx > 0 && data[p - 1]) || (xx < CW - 1 && data[p + 7]) || (yy > 0 && data[p - CW * 4 + 3]) || (yy < CH - 1 && data[p + CW * 4 + 3]); if (nb) { out[p] = INKP[0]; out[p + 1] = INKP[1]; out[p + 2] = INKP[2]; out[p + 3] = 255; } }
    const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; cv.getContext('2d').putImageData(new ImageData(out, CW, CH), 0, 0);
    return { cv, ox, oy, CW, CH };
  }
  const fingerCache = new Map();
  function fingerSprite(p) {
    const key = p.finger; if (fingerCache.has(key)) return fingerCache.get(key);
    const frames = []; let ox = 0, oy = 0, W = 0, Hh = 0;
    for (let f = 0; f < FRAMES; f++) { const r = paintFinger(p.finger, p.lv, p.w, f / (FRAMES - 1)); frames.push(r.cv); ox = r.ox; oy = r.oy; W = r.CW; Hh = r.CH; }
    const sp = { w: W, h: Hh, ox, py: oy, frames, flat: false, finger: true, glow: null, pick: (s) => { const c = window.TWS && TWS.palm ? TWS.palm.curl[s.p.finger] : 0; return frames[Math.max(0, Math.min(FRAMES - 1, Math.round(c * (FRAMES - 1))))]; } };
    fingerCache.set(key, sp); return sp;
  }
  A.ext = { top, face, edge, stairPal: STAIR, sprite: p => p.kind === 'finger' ? fingerSprite(p) : null, FRAMES,
    seamTone: (I, J, n0, n1) => tone(CLOUD, 2.2 + n0 * 2.2 + n1 * 0.8) };
  // sprite kinds (PixelLab objects packed by tools/pack_sprites.py) and their life masks
  Object.assign(A.IMGKINDS, { buddha: ['buddha_a'], pcloud: ['pcloud_a', 'pcloud_b', 'pcloud_c', 'pcloud_d'], pcloudw: ['pcloudw_a', 'pcloudw_b', 'pcloudw_c'], pcloudt: ['pcloudt_a', 'pcloudt_b'],
    plotus: ['plotus_a', 'plotus_b'], pwheel: ['pwheel_a'], pbell: ['pbell_a'], plantern: ['plantern_a'], pmist: ['pmist_a', 'pmist_b'] });
  A.GLOWS.push('buddha_', 'plotus_', 'pwheel_', 'plantern_', 'pcloudt_');
})();
