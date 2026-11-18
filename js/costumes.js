'use strict';
// ===== Sài Gòn Lofi — event costumes and accessories for the townsfolk =====
// Called from drawPerson() (art.js) only for looks flagged L.ev (set by EV.dress in events.js), so ordinary people are untouched.
// X = drawing context from drawPerson: put / rect / ell painters, col / zz buffers, body anchors (cx, headCY, torsoTop, legTop, foot ...).
const CO = { orange: 0xf08a24, orangeD: 0xb8561a, orangeL: 0xffb04a, purple: 0x6a3a8a, purpleD: 0x45265e, black: 0x2a2430, blackL: 0x4a4258, white: 0xf6f3ec, whiteS: 0xcfd2e0, bone: 0xf2eee2, red: 0xd2281e, redD: 0x8e1814, gold: 0xf2c94c, green: 0x3f8a46, greenD: 0x2a5e34, brown: 0x7a5232 };
const STAR5 = ['..Y..', 'YYYYY', '.YYY.', '.Y.Y.'];

// things that hang behind the body: vampire cape edges, cat tail, witch broom, Santa sack
function evBehind(X) {
  const { L, back, rect, put, ell, cx, torsoTop, legTop, foot } = X, k = L.costume;
  if (k === 'vampire' && !back) { const o = grade(CO.black), r = grade(CO.red); rect(cx - 9, torsoTop - 1, cx - 7, legTop + 6, o, 0); rect(cx - 7, torsoTop, cx - 7, legTop + 5, r, 0); rect(cx + 8, torsoTop - 1, cx + 10, legTop + 6, o, 0); rect(cx + 8, torsoTop, cx + 8, legTop + 5, r, 0); }
  if (k === 'cat') { const c = grade(CO.black); for (let i = 0; i < 9; i++) { const x = back ? cx + 1 - Math.round(i * 0.6) : cx - 6 - i, y = legTop - 1 - Math.round(Math.sin(i / 8 * Math.PI) * 4) + (back ? 2 : 0); put(x, y, c, 0); put(x, y + 1, c, 0); } }
  if (L.carry === 'broom') { for (let i = 0; i < 20; i++) put(cx + 9 - i * 0.8, torsoTop + 2 + i, grade(CO.brown), 0); for (let j = 0; j < 5; j++) for (let i = -2; i <= 2; i++) put(cx - 7 + i + Math.round(j * 0.3), foot - 4 + j, grade(j & 1 ? 0xd8a84a : 0xc49036), 0); }
  if (L.carry === 'sack' && !back) ell(cx - 7, torsoTop + 1, 4.5, 5.5, grade(0xe8dcc0), 0, grade(0xc8b894));
}
// on the torso: national-day star shirt, pumpkin suit, Santa belt, vampire collar, back-view cape / sack
function evTorso(X) {
  const { L, back, rect, put, ell, cx, torsoTop, legTop } = X, k = L.costume;
  if (L.star) { const y0 = torsoTop + 3; for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) if (STAR5[j][i] === 'Y') put(cx - 2 + i, y0 + j, 0xffe04a, 6); }
  if (k === 'pumpkin') {
    const o = grade(CO.orange), oy = (torsoTop + legTop) / 2 + 1;
    ell(cx + 0.5, oy, 8.5, 7, o, 6, grade(CO.orangeD), grade(CO.orangeL));
    for (const dx of [-4, 0, 4]) for (let y = Math.round(oy - 5); y <= oy + 5; y++) if (X.zz[y * X.W + cx + dx] === 6) put(cx + dx, y, mixc(o, 0x6a2a10, 0.35), 6);
    if (!back) { const f = 0x3a1c10; put(cx - 3, oy - 2, f, 6); put(cx - 2, oy - 3, f, 6); put(cx - 2, oy - 2, f, 6); put(cx + 3, oy - 2, f, 6); put(cx + 4, oy - 3, f, 6); put(cx + 4, oy - 2, f, 6); for (let x = cx - 4; x <= cx + 5; x++) put(x, oy + 2 + ((x & 1) ? 0 : 1), f, 6); }
  }
  if (k === 'santa') { rect(cx - 6, legTop - 3, cx + 6, legTop - 2, grade(0x2a2226), 6); if (!back) { rect(cx, legTop - 3, cx + 1, legTop - 2, 0xf2c94c, 6); rect(cx, torsoTop + 1, cx + 1, legTop - 4, grade(CO.white), 6); } }
  if (k === 'vampire') {
    const o = grade(CO.black), r = grade(CO.red);
    if (back) { for (let y = torsoTop - 1; y < legTop + 7; y++) { const hw = 7 + (y - torsoTop) * 0.18; for (let x = Math.round(cx + 1 - hw); x <= Math.round(cx + 1 + hw); x++) put(x, y, x > cx + 4 ? mixc(o, 0x000000, 0.2) : o, 7); } rect(cx - 6, torsoTop - 4, cx + 8, torsoTop - 1, o, 7); }
    else { rect(cx - 7, torsoTop - 5, cx - 5, torsoTop, o, 7); put(cx - 5, torsoTop - 4, r, 7); rect(cx + 6, torsoTop - 5, cx + 8, torsoTop, o, 7); put(cx + 6, torsoTop - 4, r, 7); }
  }
  if (L.carry === 'sack' && back) ell(cx + 1, torsoTop + 5, 7, 8, grade(0xe8dcc0), 7, grade(0xc8b894));
}
// faces (front view only)
function evFace(X, ex1, ex2, ey, eh) {
  const { L, rect, put, ell, cx } = X, k = L.costume, ink = 0x2b1a16;
  if (k === 'skeleton') { rect(ex1 - 1, ey - 1, ex1 + 1, ey + 2, ink, 11); rect(ex2 - 1, ey - 1, ex2 + 1, ey + 2, ink, 11); put(cx + 2, ey + eh + 1, ink, 11); for (let x = cx - 1; x <= cx + 5; x++) put(x, ey + eh + 2, x & 1 ? ink : 0xf2eee2, 11); }
  if (k === 'vampire') { put(cx + 1, ey + eh + 3, 0xffffff, 11); put(cx + 4, ey + eh + 3, 0xffffff, 11); put(cx + 2, ey + eh + 2, 0x8a1020, 11); put(cx + 3, ey + eh + 2, 0x8a1020, 11); }
  if (k === 'cat') { for (let i = 0; i < 3; i++) { put(ex1 - 2 - i, ey + eh + i % 2, ink, 11); put(ex2 + 3 + i, ey + eh + i % 2, ink, 11); } put(cx + 2, ey + eh + 1, 0xf07a9a, 11); }
  if (k === 'santa') { const w = grade(CO.white); ell(cx + 1.5, ey + eh + 4, 6.5, 5, w, 11, grade(CO.whiteS), undefined, (x, y) => y > ey + eh); rect(cx - 1, ey + eh + 1, cx + 5, ey + eh + 2, w, 11); }
  if (k === 'mummy') { rect(ex1 - 1, ey, ex2 + 2, ey + 2, 0x3a2a30, 10); put(ex1, ey + 1, 0xf2e8c0, 11); put(ex2 + 1, ey + 1, 0xf2e8c0, 11); }
  if (k === 'monster') { for (let x = cx - 3; x <= cx + 2; x++) put(x, ey - 4, ink, 11); put(cx - 2, ey - 5, ink, 11); put(cx, ey - 5, ink, 11); put(cx + 2, ey - 5, ink, 11); put(cx + 1, ey + eh + 3, 0xffffff, 11); }
  if (L.paint) { put(ex1 - 2, ey + eh + 1, 0xd2281e, 11); put(ex1 - 3, ey + eh + 1, 0xffe04a, 11); }   // little flag sticker on the cheek (2/9)
}
// extra hats
function evHat(hat, X) {
  const { rect, put, ell, cx, headCY, hr, back } = X;
  if (hat === 'witch') {
    const c = grade(CO.purpleD), cs = mixc(c, 0x000000, 0.25), b = headCY - hr + 3;
    ell(cx + 1, b, 12, 2.2, c, 12, cs);
    for (let j = 0; j < 10; j++) { const y = b - 1 - j, hw = Math.max(0, 5.5 - j * 0.55), sx = Math.round(j > 6 ? (j - 6) * 0.8 : 0); for (let x = Math.round(cx + 1 - hw); x <= Math.round(cx + 1 + hw); x++) put(x + sx, y, x > cx + 2 ? cs : c, 12); }
    rect(cx - 4, b - 2, cx + 6, b - 1, grade(CO.orange), 12);
  } else if (hat === 'santa') {
    const r = grade(CO.red), rs = grade(CO.redD), w = grade(CO.white), b = headCY - hr + 2;
    for (let j = 0; j < 8; j++) { const y = b - 1 - j, hw = Math.max(0.5, 7 - j * 0.9), sx = Math.round(j * j * 0.07); for (let x = Math.round(cx + 1 - hw); x <= Math.round(cx + 1 + hw); x++) put(x + sx, y, x > cx + 3 ? rs : r, 12); }
    rect(cx - 7, b - 1, cx + 9, b + 1, w, 12, cx + 6, grade(CO.whiteS)); ell(cx + 7, b - 8, 1.8, 1.8, w, 12);
  } else if (hat === 'stem') { rect(cx, headCY - hr - 4, cx + 2, headCY - hr, grade(CO.greenD), 12); ell(cx + 4, headCY - hr - 3, 2.4, 1.3, grade(CO.green), 12); }
  else if (hat === 'ears') { const c = grade(CO.black); for (const ex of [cx - 5, cx + 5]) for (let j = 0; j < 5; j++) for (let i = -2 + (j >> 1); i <= 2 - (j >> 1); i++) put(ex + i, headCY - hr + 1 - j, j > 0 && j < 3 && Math.abs(i) < 1 && !back ? 0xf0a0b8 : c, 12); }
  else if (hat === 'horns') { const c = grade(0xf0e0b0), cs = grade(0xc8b080); for (const [ex, d] of [[cx - 4, -1], [cx + 6, 1]]) for (let j = 0; j < 5; j++) { put(ex + Math.round(d * j * 0.4), headCY - hr - j, j > 2 ? cs : c, 12); put(ex + 1 + Math.round(d * j * 0.4), headCY - hr - j, cs, 12); } }
  else if (hat === 'antler') {
    const c = grade(0x8a5a32); rect(cx - 6, headCY - hr + 1, cx + 8, headCY - hr + 1, grade(CO.red), 12);
    for (const [ex, d] of [[cx - 4, -1], [cx + 6, 1]]) { for (let j = 0; j < 6; j++) put(ex + Math.round(d * j * 0.35), headCY - hr - j, c, 12); put(ex + d * 2, headCY - hr - 3, c, 12); put(ex + d * 3, headCY - hr - 4, c, 12); put(ex + d, headCY - hr - 5, c, 12); }
  } else if (hat === 'band') { rect(cx - 7, headCY - 4, cx + 9, headCY - 3, grade(CO.red), 12); if (!back) { put(cx + 1, headCY - 4, 0xffe04a, 12); put(cx + 1, headCY - 3, 0xffe04a, 12); put(cx, headCY - 3, 0xffe04a, 12); put(cx + 2, headCY - 3, 0xffe04a, 12); } }
}
// things in the hand
function evCarry(it, X, hx, hy, raise) {
  const { L, rect, put, ell, cx, torsoTop, kid, back } = X;
  if (it === 'flag') {
    const x = raise ? cx + 7 : hx + 1, y0 = raise ? torsoTop - (kid ? 9 : 11) : hy, top = y0 - (raise ? 9 : 18);
    for (let y = top; y <= y0; y++) put(x, y, 0x8a6a3a, 15);
    rect(x + 1, top, x + 7, top + 4, 0xd9281e, 15, x + 6, 0xb81e16); put(x + 4, top + 2, 0xffe04a, 15); put(x + 3, top + 2, 0xffe04a, 15); put(x + 4, top + 1, 0xffe04a, 15); put(x + 5, top + 2, 0xffe04a, 15); put(x + 4, top + 3, 0xffe04a, 15);
  } else if (it === 'pumpkin') {
    ell(hx + 1.5, hy + 3.5, 3.2, 2.8, grade(CO.orange), 15, grade(CO.orangeD), grade(CO.orangeL)); rect(hx - 1, hy, hx + 4, hy, 0x3a2a20, 15);
    if (!back) { put(hx, hy + 3, 0xffd860, 15); put(hx + 3, hy + 3, 0xffd860, 15); rect(hx, hy + 5, hx + 3, hy + 5, 0xffd860, 15); }
  } else if (it === 'lantern') { for (let y = hy - 6; y <= hy; y++) put(hx + 1, y, 0x6a4a2a, 15); ell(hx + 2, hy - 8, 2.6, 3, grade(L.glowC === 0xb070ff ? CO.purple : CO.orange), 15, undefined, 0xffe0a0); put(hx + 2, hy - 11, 0x3a2a20, 15); }
  else if (it === 'broom') { rect(hx, hy - 1, hx + 2, hy, 0x7a5232, 15); }
  else if (it === 'gift') { rect(hx - 1, hy + 1, hx + 4, hy + 5, grade(kid ? 0x3d8ad8 : 0xd2281e), 15, hx + 3); rect(hx + 1, hy + 1, hx + 1, hy + 5, 0xf2c94c, 15); rect(hx - 1, hy + 3, hx + 4, hy + 3, 0xf2c94c, 15); put(hx, hy, 0xf2c94c, 15); put(hx + 2, hy, 0xf2c94c, 15); }
}
// whole-figure passes: skeleton bones, mummy wraps, ghost sheet
function evOver(X, hx, hy, raise) {
  const { L, col, zz, W, H, put, rect, cx, headCY, hr, foot, back, pose } = X, k = L.costume;
  if (k === 'skeleton') {
    const bone = grade(CO.bone), body = grade(CO.black);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x, z = zz[i]; if (col[i] < 0) continue;
      const dk = col[i] === body || col[i] === clothSh(body) || col[i] === hiOf(body); if (!dk) continue;
      if (z === 5) { if (x === cx || x === cx + 1 ? true : (y - X.torsoTop) % 2 === 1 && Math.abs(x - cx - 0.5) < 5) col[i] = (x === cx + 1 && (y & 1)) ? mixc(bone, body, 0.3) : bone; }
      else if ((z === 1 || z === 14 || z === 2 || z === 3) && zz[i - 1] === z && zz[i + 1] === z && col[i - 1] >= 0 && col[i + 1] >= 0) col[i] = bone;
    }
  }
  if (k === 'mummy') { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, z = zz[i]; if (col[i] < 0 || z === 10 || z === 11 || z === 0) continue; if ((y + (x >> 2)) % 3 === 0) col[i] = mixc(col[i], 0x8a7a60, 0.45); } }
  if (k === 'ghost') {
    const w = grade(CO.white), ws = grade(CO.whiteS), wl = 0xffffff, top = headCY - hr - 1, ph = (pose === 1 || pose === 3) ? 1 : 0;
    for (let y = top; y < foot; y++) {
      const hw = y < headCY ? Math.sqrt(Math.max(0, (hr + 1) * (hr + 1) - (headCY - y) * (headCY - y))) : Math.min(10.5, hr + 1 + (y - headCY) * 0.2);
      for (let x = Math.round(cx + 1 - hw); x <= Math.round(cx + 1 + hw); x++) {
        if (y >= foot - 3 && ((x + ph) % 4 < 2 ? y >= foot - 1 : y >= foot - 3)) continue;
        put(x, y, x > cx + 1 + hw * 0.4 ? ws : (x < cx - 2 && y < headCY - 2 ? wl : w), 16);
      }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (col[i] >= 0 && zz[i] < 16 && (y >= top - 1)) { const dx = x - cx - 1; if (Math.abs(dx) > 11 || y >= foot - 1) { col[i] = -1; zz[i] = -1; } } }
    if (!back) { const e = 0x2b1a16; rect(cx - 2, headCY - 1, cx - 1, headCY + 2, e, 17); rect(cx + 3, headCY - 1, cx + 4, headCY + 2, e, 17); rect(cx + 1, headCY + 5, cx + 2, headCY + 6, e, 17); }
    if (L.carry === 'pumpkin' || L.carry === 'lantern') evCarry(L.carry, X, cx + 7, headCY + 16, false);
  }
}
