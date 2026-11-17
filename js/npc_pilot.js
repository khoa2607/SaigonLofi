'use strict';
// ===== Sài Gòn Lofi — NPC PILOT (review only, not used by the game yet) =====
// Big-head chibi townsfolk: head ≈ half the height, big glossy eyes, mitten hands, stubby legs, cocoa ink outline.
// Four views (F front, Q three-quarter, S side/profile, B back), all facing right; the game mirrors for the other directions.
// Poses: 0 idle, 1-4 walk (contact, pass, contact, pass), 5 sit, 6 arm up (hail / umbrella), 7 talk.
const CP = { W: 32, H: 56, VIEWS: ['F', 'Q', 'S', 'B'], POSES: 8 };
const C_INK = 0x2b1a16;
const sh = (c, k) => mixc(mixc(c, 0x6a3a48, 0.34 * (k || 1)), C_INK, 0.06 * (k || 1)), hi = c => mixc(c, 0xfff6e8, 0.28);
const skSh = c => mixc(mixc(c, 0xd0603e, 0.3), C_INK, 0.05);

// the six pilot characters
const PILOT = [
  { id: 'woman', name: 'Chị Lan · office worker', skin: 0xf6c9a0, hair: 0x3a2622, hs: 'long', top: 0xf7e6c8, topStyle: 'blouse', bot: 0x4a2e2a, botStyle: 'pants', shoe: 0x6a3a2c, bag: 0xa4573f, clip: 0xe8738a },
  { id: 'man', name: 'Anh Minh · student', skin: 0xf6d0aa, hair: 0x1e1a22, hs: 'spiky', glasses: 0xd0566a, top: 0xfaf6ee, top2: 0xc9384c, topStyle: 'stripe', bot: 0x3c3a42, botStyle: 'shorts', shoe: 0x4a4650 },
  { id: 'kid', name: 'Bé Na · pupil', kid: 1, skin: 0xf8d2ae, hair: 0x2a2024, hs: 'bowl', top: 0xfbf8f0, topStyle: 'school', bot: 0x2f3f74, botStyle: 'shorts', shoe: 0x2a2a30, scarf: 0xd8322a, pack: 0x4f8ed0 },
  { id: 'aodai', name: 'Cô Mai · áo dài', skin: 0xf8d4b2, hair: 0x221a20, hs: 'long', top: 0xfbfbf6, topStyle: 'aodai', bot: 0xfbfbf6, botStyle: 'wide', shoe: 0xe8e0d0, ribbon: 0xd8607a },
  { id: 'vendor', name: 'Bà Tư · nón lá vendor', skin: 0xe2a77c, hair: 0x2e2626, hs: 'bun', top: 0x7a5068, topStyle: 'baba', bot: 0x2a2428, botStyle: 'pants', shoe: 0x8a5a3a, nonla: 1, ganh: 1, goods: 0x58a050 },
  { id: 'monk', name: 'Thầy Tâm · monk', skin: 0xe8b48a, hair: 0x000000, hs: 'bald', eyes: 'closed', top: 0xe08a2c, topStyle: 'robe', bot: 0xe08a2c, botStyle: 'robe', shoe: 0x7a4a2c, beads: 0x5a3220 }
];

function drawChibi(C, view, pose) {
  const W = CP.W, H = CP.H, col = new Int32Array(W * H).fill(-1), zz = new Int8Array(W * H).fill(-1);
  const put = (x, y, c, z) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; col[y * W + x] = c; zz[y * W + x] = z; };
  const rect = (x0, y0, x1, y1, c, z, shX, sc) => { for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) put(x, y, shX !== undefined && x >= shX ? (sc === undefined ? sh(c) : sc) : c, z); };
  // shaded ellipse, lit from the upper left; clip(x,y) limits it
  const ell = (cx, cy, rx, ry, c, z, o) => { o = o || {}; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy > 1) continue; if (o.clip && !o.clip(x, y)) continue; let k = c; const sx = o.soft ? 0.62 : 0.4; if (o.sc !== undefined && dx * (o.flip ? -1 : 1) > sx - dy * 0.2) k = o.sc; else if (o.hl !== undefined && (o.soft ? Math.abs(dx + dy * 0.6 + 0.35) < 0.12 && dy < 0 : dx * (o.flip ? -1 : 1) < -0.25 && dy < -0.3)) k = o.hl; put(x, y, k, z); } };
  const kid = !!C.kid, F = view === 'F', Q = view === 'Q', S = view === 'S', B = view === 'B', sit = pose === 5, walk = pose >= 1 && pose <= 4, pass = pose === 2 || pose === 4;
  const step = pose === 1 ? 1 : pose === 3 ? -1 : 0, bob = pass ? -1 : 0, down = sit ? 5 : 0, cx = 16;
  const G = kid ? { hcy: 24, rx: 10, ry: 9.5, tt: 33, lt: 41, ground: 50, tw: 5 } : { hcy: 18, rx: 11, ry: 10.5, tt: 28, lt: 38, ground: 50, tw: 6 };
  const hcy = G.hcy + bob + down, tt = G.tt + bob + down, lt = G.lt + bob + down, gr = G.ground;
  const skin = C.skin, sS = skSh(skin), top = C.top, tS = sh(top), bot = C.bot, shoe = C.shoe;
  const hx = cx + (Q ? 1 : S ? 1 : 0);                                     // head centre x
  const robe = C.topStyle === 'robe', aodai = C.topStyle === 'aodai';
  // ---------- hair that hangs behind everything (long hair, from the front views)
  if ((F || Q || S) && C.hs === 'long') { const y1 = tt + (kid ? 5 : 9); if (F) { rect(hx - G.rx - 1, hcy, hx - G.rx + 3, y1, C.hair, 0); rect(hx + G.rx - 3, hcy, hx + G.rx + 1, y1, sh(C.hair), 0); } else rect(hx - G.rx, hcy - 2, hx - G.rx + 6, y1, C.hair, 0, hx - G.rx + 4); }
  // ---------- gánh: shoulder pole with two baskets (behind for the back half)
  const ganh = (z) => { const py = tt - 1, x0 = 1, x1 = W - 2; rect(x0, py, x1, py, 0x8a6a3a, z); rect(x0, py + 1, x1, py + 1, 0x5e4426, z); for (const bx of [x0, x1 - 6]) { for (let j = 2; j < 9; j++) { put(bx + 1, py + j, 0x6a4a2a, z); put(bx + 5, py + j, 0x6a4a2a, z); } ell(bx + 3, py + 12, 4, 3.4, 0xc49a5a, z, { sc: 0x9a7442, hl: 0xe0bc7c }); ell(bx + 3, py + 9.6, 3.2, 1.4, C.goods || 0x58a050, z + 1, { sc: sh(C.goods || 0x58a050) }); } };
  if (C.ganh && !sit) ganh(B ? 20 : 1);
  // ---------- back arm
  const armLen = kid ? 6 : 7, sleeve = j => (C.topStyle === 'stripe' || C.topStyle === 'school' || C.topStyle === 'blouse') ? (j < 3 ? top : skin) : top;
  const arm = (x, z, swing, side) => { for (let j = 0; j < armLen; j++) { const xx = x + Math.round(swing * j / armLen * 2) + (F || B ? side * Math.round(j / 4) : 0), c0 = sleeve(j), c = S && z > 10 && c0 !== skin ? sh(c0, 0.45) : c0; rect(xx, tt + 1 + j, xx + 2, tt + 1 + j, c, z, xx + 2, c === skin ? sS : sh(c)); } const mx = x + swing * 2 + (F || B ? side * 2 : 0), my = tt + armLen + 1; ell(mx + 1.5, my + 1, 2.2, 2, skin, z, { sc: sS }); };
  const swingA = walk ? step : 0;
  if (!sit || true) { if (F || B) arm(cx - G.tw - 3, 3, 0, -1); else if (Q) arm(cx - G.tw - 2, 1, -swingA, 0); else if (S) arm(cx - 2, 1, -swingA, 0); }
  // ---------- legs + shoes
  const legC = C.botStyle === 'robe' ? top : bot, legW = kid ? 3 : 4;
  const leg = (x, top0, bottom, z, color, lift) => { rect(x, top0, x + legW - 1, bottom - 2 - lift, color, z, x + legW - 1); if (C.botStyle === 'shorts') rect(x, top0 + (kid ? 3 : 4), x + legW - 1, bottom - 2 - lift, skin, z, x + legW - 1, sS); const fx = S || Q ? x : x - 0.5; rect(fx, bottom - 1 - lift, fx + legW + (S || Q ? 1 : 0), bottom - lift, shoe, z + 1, fx + legW, sh(shoe)); if (C.shoe === 0x4a4650) rect(fx, bottom - lift, fx + legW + (S || Q ? 1 : 0), bottom - lift, 0xe8e4dc, z + 1); };
  if (sit) {
    if (S || Q) { rect(cx - 2, lt, cx + 7, lt + 3, legC, 4, cx + 6); rect(cx + 4, lt + 4, cx + 7, gr - 2, C.botStyle === 'shorts' ? skin : legC, 4, cx + 7); rect(cx + 4, gr - 1, cx + 9, gr, shoe, 5, cx + 8); }
    else { for (const x of [cx - 5, cx + 1]) { rect(x, lt, x + 4, lt + 3, legC, 4, x + 4); rect(x, lt + 4, x + 3, gr - 2, C.botStyle === 'shorts' ? skin : legC, 4, x + 3, sS); rect(x - 0.5, gr - 1, x + 4, gr, shoe, 5, x + 3); } }
  } else if (!robe) {
    if (S) { leg(cx - 2 - step * 2, lt, gr, 4, sh(legC), walk && step > 0 ? 0 : 0); leg(cx - 2 + step * 2, lt, gr, 5, legC, 0); }
    else if (Q) { leg(cx - 4 + step, lt, gr, 4, legC, step < 0 ? 1 : 0); leg(cx + 1 - step, lt, gr, 5, legC, step > 0 ? 1 : 0); }
    else { leg(cx - legW - 0.5, lt, gr, 4, legC, step > 0 ? 1 : 0); leg(cx + 1, lt, gr, 4, legC, step < 0 ? 1 : 0); }
  } else { rect(cx - 4 + (S ? step : 0), gr - 1, cx - 1 + (S ? step : 0), gr, shoe, 5); rect(cx + 1 - (S ? step : 0), gr - 1, cx + 4 - (S ? step : 0), gr, shoe, 5); }
  // ---------- lower garments: áo dài panels, monk robe, wide pants
  if (aodai && !sit) { const fl = walk ? (pass ? 0 : 1) : 0; if (F || Q) rect(cx - 4 + (Q ? 1 : 0), lt - 1, cx + 3 + (Q ? 1 : 0), gr - 4, top, 6, cx + 1 + (Q ? 1 : 0), sh(top, 0.5)); if (S) { rect(cx + 1, lt - 1, cx + 4 + fl, gr - 4, top, 6, cx + 3, sh(top, 0.5)); rect(cx - 5 - fl, lt - 1, cx - 2, gr - 4, sh(top, 0.6), 3); } if (B) rect(cx - 4, lt - 1, cx + 3, gr - 4, sh(top, 0.4), 6); }
  if (robe) { const w0 = G.tw + 1; for (let y = lt - 1; y <= (sit ? lt + 3 : gr - 2); y++) { const hw = w0 + (y - lt) * 0.18; for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) put(x, y, x > cx + hw * 0.4 ? sh(top) : (x + y) % 7 === 0 ? sh(top, 0.5) : top, 6); } }
  // ---------- torso
  const tw = S ? G.tw - 1 : Q ? G.tw : G.tw + 0.5;
  for (let y = tt; y < lt; y++) { const r = y - tt, ins = r === 0 ? 2 : r === 1 ? 1 : 0; for (let x = Math.round(cx - tw + ins); x <= Math.round(cx + tw - ins); x++) { let c = top; if (C.topStyle === 'stripe') { const band = (y - tt) >= (kid ? 2 : 3) && (y - tt) <= (kid ? 4 : 5) + (Math.abs(x - cx) < 2 && F ? 1 : 0); if (band) c = C.top2; else if (y - tt === (kid ? 5 : 6)) c = mixc(C.top2, 0x2b1a16, 0.5); } if (C.topStyle === 'baba' && (F || Q) && x === Math.round(cx + (Q ? 2 : 0)) && (y - tt) % 3 === 1) c = 0xe8d8c0; put(x, y, x > cx + tw * 0.45 && !B ? sh(c) : B && x > cx + tw * 0.5 ? sh(c) : (x < cx - tw * 0.4 && r < 3 ? hi(c) : c), 7); } }
  if (robe) { for (let j = 0; j < 9; j++) put(cx - tw + 1 + j, tt + j * 0.9, sh(top, 1.4), 8); }                         // robe drape over the shoulder
  if ((F || Q) && C.topStyle === 'blouse') { put(cx - 1 + (Q ? 1 : 0), tt, sS, 8); put(cx + (Q ? 1 : 0), tt, sS, 8); put(cx + 1 + (Q ? 1 : 0), tt + 1, sh(top, 0.6), 8); }
  if ((F || Q) && aodai) rect(cx - 1 + (Q ? 1 : 0), tt - 1, cx + 1 + (Q ? 1 : 0), tt, top, 8);
  if (C.beads && (F || Q)) for (let j = 0; j < 7; j++) put(cx - 3 + j + (Q ? 1 : 0), tt + 2 + Math.round(Math.sin(j / 6 * Math.PI) * 2), C.beads, 9);
  if (C.scarf && !B) { rect(cx - 3 + (Q ? 1 : 0), tt, cx + 3 + (Q ? 1 : 0), tt + 1, C.scarf, 9); rect(cx - 1 + (Q ? 1 : 0), tt + 2, cx + 1 + (Q ? 1 : 0), tt + 3, C.scarf, 9); put(cx + (Q ? 1 : 0), tt + 4, C.scarf, 9); }
  if (C.pack) { if (B) rect(cx - 4, tt + 1, cx + 4, lt - 1, C.pack, 9, cx + 2); else if (S) rect(cx - G.tw - 2, tt + 1, cx - G.tw + 1, lt - 1, C.pack, 2, cx - G.tw); else { put(cx - tw + 1, tt + 1, sh(C.pack), 9); put(cx + tw - 1, tt + 1, sh(C.pack), 9); } }
  if (C.bag) { if (F || Q) { for (let j = 0; j < lt - tt; j++) put(cx - 4 + j * 0.9, tt + j, 0x5e3024, 9); rect(cx + 3, lt - 4, cx + 8, lt + 1, C.bag, 10, cx + 7); rect(cx + 3, lt - 4, cx + 8, lt - 3, hi(C.bag), 10); put(cx + 5, lt - 2, 0xf4e2c0, 10); } else if (S) { rect(cx - 2, lt - 4, cx + 2, lt + 1, C.bag, 10, cx + 1); } else for (let j = 0; j < lt - tt; j++) put(cx + 4 - j * 0.9, tt + j, 0x5e3024, 9); }
  // ---------- front arm
  if (pose === 6) { const ax = F || B ? cx + G.tw + 1 : cx + 1; for (let j = 0; j < armLen + 2; j++) rect(ax, tt + 1 - j, ax + 2, tt + 1 - j, sleeve(armLen - j), 11, ax + 2); ell(ax + 1.5, tt - armLen - 2, 2.2, 2, skin, 11, { sc: sS }); }
  else if (pose === 7 && !B) { const ax = F ? cx + G.tw + 1 : cx + 1; rect(ax, tt + 1, ax + 2, tt + 4, sleeve(0), 11, ax + 2); rect(ax + 1, tt + 4, ax + 5, tt + 5, sleeve(4), 11); ell(ax + 6, tt + 3.5, 2, 2, skin, 11, { sc: sS }); }
  else if (F || B) arm(cx + G.tw + 1, 11, 0, 1); else if (Q) arm(cx + G.tw - 1, 11, swingA, 0); else arm(cx - 1, 11, swingA, 0);
  // ---------- head
  const face = (x, y) => true;
  ell(hx, hcy, G.rx, G.ry, skin, 12, { sc: sS, hl: hi(skin) });
  if (S) { put(hx + G.rx, hcy + 2, skin, 12); put(hx + G.rx, hcy + 3, sS, 12); }                                           // nose
  // ears
  const ear = (x) => { ell(x, hcy + 1.5, 1.6, 2.2, skin, 12, { sc: sS }); };
  if (F || B) { ear(hx - G.rx); ear(hx + G.rx); } else if (Q) ear(hx - G.rx + 1); else ear(hx - 2);
  // ---------- hair
  const H0 = C.hair, HS = sh(H0, 1.2), HH = mixc(H0, 0x9a8aa0, 0.35);
  if (C.hs !== 'bald') {
    const big = C.hs === 'spiky' ? 1.6 : C.hs === 'bowl' ? 1 : 0.8, top0 = hcy - G.ry - big;
    let clip;
    if (B) clip = (x, y) => y < hcy + G.ry - 2;
    else if (S) clip = (x, y) => y < hcy - 3 || (x < hx - 2 && y < hcy + (C.hs === 'long' ? 7 : 3)) || (C.hs === 'long' && x < hx - 5);                                       // fringe + the whole back of the head
    else if (Q) clip = (x, y) => y < hcy - 3 + ((x * 5) % 3 === 0 ? 1 : 0) || x < hx - G.rx + 3;
    else clip = (x, y) => y < hcy - 3 + ((x * 5) % 3 === 0 ? 1 : 0) - (Math.abs(x - hx) < 3 && C.hs === 'bowl' ? 0 : 0) || ((x < hx - G.rx + 2 || x > hx + G.rx - 2) && y < hcy + (C.hs === 'long' ? 5 : 1));
    ell(hx - (S ? 1 : 0), hcy - 1, G.rx + big, G.ry + big * 0.6, H0, 13, { sc: HS, hl: HH, clip, soft: 1 });
    if (C.hs === 'spiky') for (let i = 0; i < 6; i++) { const x = hx - 8 + i * 3 + (S ? -2 : 0), y = top0 + (i % 2); put(x, y - 1, H0, 13); put(x + 1, y - 2, H0, 13); put(x + 1, y - 1, H0, 13); }
    if (C.hs === 'spiky' && (S || Q)) { rect(hx - G.rx - 1, hcy - 6, hx - G.rx + 1, hcy - 2, H0, 13); put(hx - G.rx - 2, hcy - 5, H0, 13); }
    if (C.hs === 'long' && B) rect(hx - G.rx + 1, hcy, hx + G.rx - 1, tt + (kid ? 5 : 9), H0, 14, hx + 3, HS);
    if (C.hs === 'bun') ell(hx - (S ? 3 : 0), hcy - G.ry - 1, 3.4, 2.8, H0, 13, { sc: HS, hl: HH });
    if (C.hs === 'bowl' && !B) rect(hx - G.rx + 2, hcy - 4, hx + G.rx - 2, hcy - 3, H0, 13);
    if (C.clip && !B) { put(hx - 5, hcy - 5, C.clip, 15); put(hx - 4, hcy - 5, C.clip, 15); put(hx - 5, hcy - 4, C.clip, 15); }
    if (C.ribbon) { const rx0 = B ? hx - 1 : S ? hx - G.rx + 1 : hx - G.rx; rect(rx0, hcy + 3, rx0 + 2, hcy + 4, C.ribbon, 15); }
  } else ell(hx, hcy - 1, G.rx, G.ry, mixc(skin, 0x7a6050, 0.12), 13, { sc: sS, hl: hi(skin), clip: (x, y) => y < hcy - 4 });
  // ---------- face
  if (!B) {
    const ey = hcy + (kid ? 0 : 1), ex = F ? [hx - 6, hx + 3] : Q ? [hx - 3, hx + 5] : [hx + 5], ew = (i) => (Q && i === 1) || S ? 2 : 3;
    ex.forEach((x, i) => {
      const w = ew(i);
      if (C.eyes === 'closed') { rect(x, ey + 2, x + w - 1, ey + 2, C_INK, 16); put(x - 1, ey + 1, C_INK, 16); if (w === 3) put(x + w, ey + 1, C_INK, 16); }
      else { rect(x, ey, x + w - 1, ey, C_INK, 16); rect(x, ey + 1, x + w - 1, ey + 3, 0x3a2a34, 16); rect(x, ey + 3, x + w - 1, ey + 3, 0x6a4a5a, 16); put(x, ey + 1, 0xffffff, 17); if (w === 3) put(x + 2, ey + 3, 0x8a6a7a, 16); rect(x, ey - 2, x + w - 1, ey - 2, mixc(C.hair || 0x3a2a24, 0x6a4a40, 0.3), 16); }
    });
    if (C.glasses) { const gc = C.glasses; ex.forEach((x, i) => { const w = ew(i); rect(x, ey - 1, x + w - 1, ey - 1, gc, 17); rect(x, ey + 4, x + w - 1, ey + 4, gc, 17); rect(x - 1, ey, x - 1, ey + 3, gc, 17); rect(x + w, ey, x + w, ey + 3, gc, 17); }); if (ex.length > 1) rect(ex[0] + ew(0) + 1, ey + 1, ex[1] - 2, ey + 1, gc, 17); if (S || Q) rect(hx - 3, ey + 1, ex[ex.length - 1] - 2, ey + 1, gc, 17); }
    const blush = mixc(skin, 0xf05a6a, 0.42);
    if (!C.glasses) ex.forEach((x, i) => { put(x - (i === 0 && F ? 1 : 0), ey + 5, blush, 16); put(x + 1 - (i === 0 && F ? 1 : 0), ey + 5, blush, 16); });
    const my = ey + 6 + (kid ? 0 : 1), mx = F ? hx - 1 : Q ? hx + 2 : hx + G.rx - 3;
    if (C.id === 'man') { rect(mx, my, mx + 2, my, 0x8a3a3a, 16); rect(mx, my + 1, mx + 2, my + 1, 0xf0a0a0, 16); } else { put(mx, my, 0x8a3a3a, 16); put(mx + 1, my + 1, 0x8a3a3a, 16); put(mx + 2, my, 0x8a3a3a, 16); }
  }
  // ---------- nón lá (conical hat) — sits over the hair
  if (C.nonla) { const s1 = 0xeedba8, s2 = 0xc8a86c, ap = hcy - G.ry - 9, bs = hcy - 2; for (let y = ap; y <= bs; y++) { const hw = (y - ap) / (bs - ap) * 15 + 0.6; for (let x = Math.round(hx - hw); x <= Math.round(hx + hw); x++) put(x, y, x > hx + hw * 0.3 ? s2 : (y - ap) % 3 === 2 ? mixc(s1, s2, 0.45) : s1, 18); } rect(hx - 15, bs + 1, hx + 15, bs + 1, s2, 18); if (!B) for (let j = 0; j < 6; j++) put(hx - 6 + j * 0.2, bs + 2 + j, 0xb8806a, 18); }
  if (C.ganh && !sit && !B) ganh(19);
  // ---------- ink: outline the silhouette, line where a nearer part overlaps a farther one
  const out = col.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (col[i] < 0) { if ((x > 0 && col[i - 1] >= 0) || (x < W - 1 && col[i + 1] >= 0) || (y > 0 && col[i - W] >= 0) || (y < H - 1 && col[i + W] >= 0)) out[i] = C_INK; continue; }
    const z = zz[i]; if (z >= 15 && z <= 17) continue;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && col[j] >= 0 && zz[j] < z - 1 && !(zz[j] >= 15 && zz[j] <= 17) && !(z === 13 && zz[j] === 12) && !(z === 7 && zz[j] === 6)) { out[i] = mixc(col[i], C_INK, 0.7); break; }
  }
  return out;
}
// one character -> grid of views (rows F,Q,S,B) x poses (cols 0..7)
function chibiSheet(C) {
  const W = CP.W * CP.POSES, H = CP.H * 4, g = new Int32Array(W * H).fill(-1);
  CP.VIEWS.forEach((v, r) => { for (let p = 0; p < CP.POSES; p++) { const s = drawChibi(C, v, p); for (let y = 0; y < CP.H; y++) for (let x = 0; x < CP.W; x++) { const c = s[y * CP.W + x]; if (c >= 0) g[(r * CP.H + y) * W + p * CP.W + x] = c; } } });
  const c = mk(W, H), id = new ImageData(W, H); for (let i = 0; i < W * H; i++) { const v = g[i]; if (v < 0) continue; id.data[i * 4] = v >> 16 & 255; id.data[i * 4 + 1] = v >> 8 & 255; id.data[i * 4 + 2] = v & 255; id.data[i * 4 + 3] = 255; }
  c.getContext('2d').putImageData(id, 0, 0); return c;
}
