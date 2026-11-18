'use strict';
// ===== Sài Gòn Lofi — game state, camera, renderer, UI wiring, boot =====
const G = { tet: false, era: 0, season: 'spring', hour: 7.5, hourTarget: 7.5, t: 0, daySpeed: 24 / 600, autoTime: true, autoSeason: false, autoWeather: true, seasonT: 0, weather: 'clear', weatherT: 45, rain: 0, rainTarget: 0, cloud: 0, cloudTarget: 0, gust: 0, gustT: 6, gustP: 0, windy: false, wet: 0, flash: 0, lights: 0, hot: false, snowAmt: 0, world: null, busy: true, tickT: -9 };
const R = { canvas: null, ctx: null, lc: null, lctx: null, vw: 640, vh: 360, scale: 3, zoom: 0, panX: 0, panY: 0, cx: 0, cy: 0, dirty: true, dpr: 1 };
const GROUNDS = {}, SEASONS = ['spring', 'summer', 'fall', 'winter'];
const SNAME = new Proxy({}, { get: (_, k) => t('season.' + k) });   // season display names follow the UI language (js/i18n.js)
const SCARD = { spring: '#f8c6d8', summer: '#bfe6a8', fall: '#f4c98a', winter: '#dbe8f6' };
const $ = id => document.getElementById(id);
function ticker(text, force) { if (!force && G.t - G.tickT < 5.5) return; G.tickT = G.t; const el = $('ticker'); if (!el) return; G.tickRaw = text; el.textContent = tm(text); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }

// ambient light over the day: [hour, multiply colour]
const KF = [[0, 0x4a4c86], [4.6, 0x4a4c86], [5.5, 0x8676a6], [6.3, 0xf2b9a2], [7.4, 0xffe9cf], [9, 0xfff8ea], [15.6, 0xfff6e2], [17, 0xffe2b4], [18, 0xf6aa7c], [18.8, 0xa97c9c], [19.7, 0x5c5e9a], [21, 0x4a4c86], [24, 0x4a4c86]];
function ambient(h) { let i = 0; while (i < KF.length - 2 && KF[i + 1][0] <= h) i++; const a = KF[i], b = KF[i + 1]; return mixc(a[1], b[1], clamp((h - a[0]) / (b[0] - a[0]), 0, 1)); }

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3), cw = window.innerWidth, ch = window.innerHeight, pw = cw * dpr, ph = ch * dpr;
  // screen pixels per art pixel (aps) is a whole number so the K-density art stays crisp; one world unit = K art pixels
  // default view = 50% of the previous default (aps halves; 0.5 downsamples art pixels by an exact 2:1 so edges stay crisp).
  // Levels are discrete; R.zoom is a step offset from the default level, so wheel / buttons / ?zoom= keep working.
  const LV = [0.5, 1, 2, 3, 4, 5, 6];
  const prev = Math.max(1, Math.round(Math.sqrt(pw * ph / (560 * 315)) / K * 0.83)), want = Math.max(0.5, prev / 2);
  const sMin = (pw / (WORLD * 2) + ph / WORLD) / 0.96 / K;   // fit-the-world scale; a little blank corner is tolerated at 0.5
  let lo = 0; while (lo < LV.length - 1 && LV[lo] < sMin * (LV[lo] === 0.5 ? 0.55 : 1)) lo++;
  let def = 0; for (let i = 0; i < LV.length; i++) if (LV[i] <= want) def = i;
  def = Math.max(def, lo); const idx = clamp(def + R.zoom, lo, LV.length - 1); R.zoom = idx - def;
  const aps = LV[idx], s = aps * K; R.scale = s; R.dpr = dpr;
  R.vw = Math.ceil(pw / s); R.vh = Math.ceil(ph / s);
  for (const c of [R.canvas, R.lc]) { c.width = R.vw * K; c.height = R.vh * K; }
  R.canvas.style.width = (R.vw * s / dpr) + 'px'; R.canvas.style.height = (R.vh * s / dpr) + 'px';
  for (const g of [R.ctx, R.lctx]) { g.setTransform(K, 0, 0, K, 0, 0); g.imageSmoothingEnabled = false; } camera();
}
function camera() {
  const hw = R.vw / 2, hh = R.vh / 2, mx = Math.max(0, WORLD * (1 - hh / (WORLD / 2)) - hw) + hw * 0.7; R.panX = clamp(R.panX, -mx, mx);   // a little overscroll so edge landmarks (Dinh Độc Lập) can be centred
  const my = Math.max(0, (WORLD / 2) * (1 - (Math.abs(R.panX) + hw) / WORLD) - hh) + hh * 0.75; R.panY = clamp(R.panY, -my, my);
  R.cx = Math.round(hw - R.panX); R.cy = Math.round(hh - WORLD / 2 - R.panY); R.dirty = true;
  const sy = WORLD / 2 + R.panY; SIM.focus[0] = sy + R.panX / 2; SIM.focus[1] = sy - R.panX / 2;
}
function scn(x, y, z) { return [Math.round(x - y) + R.cx, Math.round((x + y) / 2 - (z || 0)) + R.cy]; }
G.onScreen = (x, y, m) => { const vx = x - y + R.cx, vy = (x + y) / 2 + R.cy; return vx > -m - 14 && vx < R.vw + m + 14 && vy > -m - 4 && vy < R.vh + m + 30; };
function visList() {
  const W = G.world; if (!R.dirty && W.vis) return;
  const v = [], vt = [], vw = R.vw, vh = R.vh, cx = R.cx, cy = R.cy;
  for (const it of W.items) { const x = cx + it.x, y = cy + it.y; if (x < vw + 4 && x + it.w > -4 && y < vh + 4 && y + it.h > -4) { v.push(it); if (it.tree) vt.push(it); } }
  W.vis = v; W.visTrees = vt; W.visLamps = CITY.lamps.filter(l => G.onScreen(l[0], l[1], 40)); W.visSig = CITY.signals.filter(l => G.onScreen(l[0], l[1], 30)); W.visTet = TET.visible(); W.visEv = EV.visible(); R.dirty = false;
}
function glow(size, r, gg, b, a, sq) { const c = mk(size, sq ? size / 2 : size), g = c.getContext('2d'), id = g.createImageData(c.width, c.height); for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { const nx = (x + 0.5 - size / 2) / (size / 2), ny = (y + 0.5 - c.height / 2) / (c.height / 2), d = Math.sqrt(nx * nx + ny * ny), k = (y * c.width + x) * 4; if (d < 1) { id.data[k] = r; id.data[k + 1] = gg; id.data[k + 2] = b; id.data[k + 3] = Math.round(a * (1 - d) * (1 - d)); } } g.putImageData(id, 0, 0); return c; }
const SIGC = ['#ff6a4a', '#7ae8a0', '#ffd46a'];
let _psh = null;
function pShadow() { if (_psh) return _psh; const w = 12 * K, h = 5 * K, c = mk(w, h), g = c.getContext('2d'); g.fillStyle = 'rgba(74,38,40,0.26)'; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const nx = (x + 0.5 - w / 2) / (w / 2), ny = (y + 0.5 - h / 2) / (h / 2), d = nx * nx + ny * ny; if (d < 0.62 || (d < 1 && (x + y) % 2 === 0)) g.fillRect(x, y, 1, 1); } return (_psh = c); }
function draw() {
  const g = R.ctx, lg = R.lctx, W = G.world, vw = R.vw, vh = R.vh, cx = R.cx, cy = R.cy; if (!W) return;
  visList();
  const h = G.hour, lights = Math.max(h > 12 ? sstep(17.5, 19.2, h) : 1 - sstep(5.3, 6.6, h), clamp(G.cloud * 0.9 - 0.5, 0, 0.4)), useL = lights > 0.03; G.lights = lights;
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.fillStyle = '#34403f'; g.fillRect(0, 0, vw, vh);
  const gx = WORLD - cx, gy = -cy, sx0 = Math.max(0, gx), sy0 = Math.max(0, gy), sx1 = Math.min(WORLD * 2, gx + vw), sy1 = Math.min(WORLD, gy + vh);
  if (sx1 > sx0 && sy1 > sy0) g.drawImage(W.ground, sx0 * K, sy0 * K, (sx1 - sx0) * K, (sy1 - sy0) * K, sx0 - gx, sy0 - gy, sx1 - sx0, sy1 - sy0);
  const ov = G.era > 0 ? OV[G.season + G.era] : null;
  if (ov) { const ox1 = Math.min(ov.width / K, gx + vw), oy1 = Math.min(ov.height / K, gy + vh); if (ox1 > sx0 && oy1 > sy0) g.drawImage(ov, sx0 * K, sy0 * K, (ox1 - sx0) * K, (oy1 - sy0) * K, sx0 - gx, sy0 - gy, ox1 - sx0, oy1 - sy0); }
  drawWater(g);
  if (G.wet > 0.02) { g.fillStyle = 'rgba(26,38,74,' + (G.wet * 0.2).toFixed(3) + ')'; g.fillRect(0, 0, vw, vh); }
  if (useL) { lg.globalCompositeOperation = 'source-over'; lg.globalAlpha = 1; lg.clearRect(0, 0, vw, vh); }
  // dynamic things
  const dyn = [], bubbles = [], halos = [];
  g.fillStyle = 'rgba(74,38,40,0.22)';
  const psh = pShadow(), shadow = (x, y) => { const s = scn(x, y, 0); g.drawImage(psh, s[0] - 6, s[1] - 2.5, 12, 5); };
  for (const p of SIM.peds) { if (!G.onScreen(p.x, p.y, 24)) continue; const lf = bridgeLift(p.x, p.y); if (p.alpha > 0.5 && !lf) shadow(p.x, p.y); dyn.push({ key: p.x + p.y + (p.sit ? 0.6 : 0) + (lf ? 40 : 0), ped: p }); }
  for (const a of SIM.actors) if (G.onScreen(a.x, a.y, 24)) { shadow(a.x, a.y); dyn.push({ key: a.x + a.y, ped: a }); }
  for (const v of SIM.vehs) { const q = vehPos(v); if (G.onScreen(q[0], q[1], 44)) dyn.push({ key: q[0] + q[1], veh: v, q }); }
  for (const b of SIM.boats) if (G.onScreen(b.x, b.y, 60)) dyn.push({ key: b.x + b.y, boat: b });
  for (const s of CITY.stands) if (s.state === 'parked' && G.onScreen(s.x, s.y, 30)) dyn.push({ key: s.x + s.y, stand: s });
  for (const s of W.visSig) dyn.push({ key: s[0] + s[1] + 0.5, sig: s });
  for (const f of W.visTet) dyn.push({ key: TET.key(f), tet: f });
  for (const f of W.visEv) dyn.push({ key: f.key, ev: f }); EV.pushDyn(dyn, shadow); DAN.pushDyn(dyn, shadow);   // night events: decorations, crowds, boat flags
  dyn.sort((a, b) => a.key - b.key);
  const sway = (0.5 + G.gust * 2.8 + (G.windy ? 0.9 : 0));
  const drawStatic = it => {
    const x = cx + it.x, y = cy + it.y;
    if (it.tree) { const sp2 = it.tree, c = it.c, amp = sway * (sp2.bare ? 0.4 : sp2.spc === 'cau' ? 1.2 : 1), sw = Math.sin(G.t * (1.1 + G.gust * 2.4) + it.ph) * amp + G.gust * 1.3, split = sp2.split, bands = 4, bh = Math.ceil(split / bands); for (let i = 0; i < bands; i++) { const sy = i * bh, hh = Math.min(bh, split - sy); if (hh <= 0) break; g.drawImage(c, 0, sy * K, c.width, hh * K, x + Math.round(sw * (1 - i / bands) * K) / K, y + sy, it.w, hh); } g.drawImage(c, 0, split * K, c.width, c.height - split * K, x, y + split, it.w, it.h - split); }
    else g.drawImage(it.c, x, y, it.w, it.h);
    if (useL && it.e) lg.drawImage(it.e, x, y, it.w, it.h);
    if (it.tree && EV.treeLit) EV.treeDeco(g, lg, useL, it, x, y);
  };
  const person = (sheet, col, row, x, y, a, hh) => { hh = hh || PH; if (a < 1) g.globalAlpha = a; g.drawImage(sheet.c, col * PW * K, row * PH * K, PW * K, hh * K, x, y, PW, hh); if (a < 1) g.globalAlpha = 1; if (useL && a > 0.5) lg.drawImage(sheet.e, col * PW * K, row * PH * K, PW * K, hh * K, x, y, PW, hh); };
  const vehicle = (kind, vv, di, q, riders, a) => {
    const m = vehModel(kind, vv), s = vehSprite(kind, vv, di), p = scn(q[0], q[1], 0);
    if (a < 1) g.globalAlpha = a; g.drawImage(s.c, p[0] - s.ax, p[1] - s.ay, s.w, s.h); if (a < 1) g.globalAlpha = 1; if (useL) lg.drawImage(s.e, p[0] - s.ax, p[1] - s.ay, s.w, s.h);
    const n = Math.min(riders.length, m.seats.length), ord = []; for (let i = 0; i < n; i++) ord.push(i); ord.sort((i, j) => (m.seats[i].x - m.seats[j].x) * (di < 2 ? 1 : -1));
    for (const i of ord) { const o = seatOff(m, m.seats[i], di); person(riders[i].sheet, 5, DIR_ROW[di], p[0] + Math.round(o[0]) - PW / 2, p[1] + Math.round(o[1]) - PSEAT, a, PSEAT + 2); }
    if (useL) { const d = DIRV[di], f = scn(q[0] + d[0] * (m.L / 2 + 5), q[1] + d[1] * (m.L / 2 + 5), 2); halos.push([f[0], f[1], 1]); }
    return p;
  };
  const drawDyn = d => {
    if (d.ped) {
      const p = d.ped, s = scn(p.x, p.y, bridgeLift(p.x, p.y));
      if (p.dog !== undefined) { const fr = DOGS[p.dog % DOGS.length][p.dir === 1 || p.dir === 2 ? 1 : 0][p.moving ? (Math.floor(p.an * 1.6) & 1) : 0]; g.globalAlpha = p.alpha; g.drawImage(fr.c, s[0] - fr.w / 2, s[1] - fr.h + 1, fr.w, fr.h); g.globalAlpha = 1; if (p.bub) bubbles.push([BUB[p.bub.k], s[0] - 3, s[1] - 21]); return; }
      const hold = p.umb > 0.05, row = DIR_ROW[p.dir], x = s[0] - PW / 2, y = s[1] - PFOOT - (p.sit ? 2 : 0), a = p.alpha === undefined ? 1 : p.alpha;
      let col = p.sit ? 5 : p.moving ? 1 + (Math.floor(p.an) & 3) : p.pose; if (hold && !p.moving && !p.sit && col === 0) col = 6;
      person(p.sheet, col, row, x, y, a);
      if (useL && p.look.glowC) EV.pedGlow(lg, p, x, y);
      if (hold) { const fr = UMB[p.look.umbC][p.umb < 0.4 ? 0 : p.umb < 0.8 ? 1 : 2], ux = x + PW / 2 - fr.w / 2 + (row >= 2 ? -2 : 2), uy = y + (p.look.kid ? PHEAD + 4 : PHEAD) - fr.h + 9 - (p.moving && (Math.floor(p.an) & 1) ? 0.5 : 0); g.drawImage(fr.c, ux, uy, fr.w, fr.h); if (useL) lg.drawImage(fr.e, ux, uy, fr.w, fr.h); }
      if (p.bub) bubbles.push([BUB[p.bub.k], s[0] - 3, y + (p.look.kid ? PHEAD + 4 : PHEAD) - 13 - (hold ? 5 : 0) + (p.bub.a < 0.1 ? 2 : p.bub.a < 0.2 ? -1 : 0)]);
    } else if (d.boat) vehicle(d.boat.kind, d.boat.v, d.boat.dir > 0 ? 1 : 3, [d.boat.x, d.boat.y], d.boat.riders, 1);
    else if (d.veh) { const vv = d.veh, L = vv.lane; vehicle(vv.kind, vv.v, vv.turn ? vv.turn.di : L.di, d.q, vv.riders, L.axis === 'x' ? clamp(Math.min(vv.s + 24, L.hi - L.lo + 40 - vv.s) / 36, 0, 1) : 1); }
    else if (d.stand) { const s = d.stand, p = vehicle(s.kind === 'xeom' ? ERA[G.era].xeom : 'cyclo', s.v, s.dir, [s.x, s.y], s.driver ? [s.driver] : [], s.alpha === undefined ? 1 : s.alpha); if (s.bub) bubbles.push([BUB[s.bub.k], p[0] - 3, p[1] - 36]); }
    else if (d.tet) TET.draw(g, lg, useL, d.tet, cx, cy);
    else if (d.ev) EV.draw(g, lg, useL, d.ev);
    else if (d.dan) DAN.draw(g, lg, useL, d.dan, bubbles);
    else if (d.sig) { const st = sigOf(d.sig[2]), s = scn(d.sig[0], d.sig[1], st === 0 ? 31.5 : st === 2 ? 29 : 26.5); g.fillStyle = SIGC[st]; g.fillRect(s[0] - 1, s[1], 2, 2); if (useL) { lg.fillStyle = SIGC[st]; lg.fillRect(s[0] - 1, s[1], 2, 2); } }
  };
  const vis = W.vis; let i = 0, j = 0;
  while (i < vis.length || j < dyn.length) { if (j >= dyn.length || (i < vis.length && vis[i].key <= dyn[j].key)) drawStatic(vis[i++]); else drawDyn(dyn[j++]); }
  drawFxWorld(g); drawFxSky(g); EV.drawSky(g);
  // time-of-day tint, then additive lights
  let amb = ambient(h); if (G.cloud > 0.02) amb = mixc(amb, mixc(amb, 0x7f8cb0, 0.6), G.cloud * 0.7); if (G.season === 'winter') amb = mixc(amb, mixc(amb, 0xdfe9ff, 0.5), 0.3); else if (G.season === 'fall') amb = mixc(amb, mixc(amb, 0xffe2b8, 0.5), 0.3); else if (G.hot) amb = mixc(amb, 0xfff2c8, 0.5);
  amb = EV.grade(amb);
  if (amb !== 0xffffff) { g.globalCompositeOperation = 'multiply'; g.fillStyle = css(amb); g.fillRect(0, 0, vw, vh); g.globalCompositeOperation = 'source-over'; }
  if (useL) {
    lg.globalCompositeOperation = 'lighter';
    for (const l of W.visLamps) { const a = scn(l[0], l[1], l[2]), b = scn(l[0], l[1], 0); lg.drawImage(R.halo, a[0] - 22, a[1] - 22); lg.drawImage(R.pool, b[0] - 30, b[1] - 15); }
    for (const hl of halos) lg.drawImage(R.pool2, hl[0] - 13, hl[1] - 7);
    drawWaterLights(lg, lights);
    drawFxLights(lg); EV.drawLights(lg, lights);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = lights; g.drawImage(R.lc, 0, 0, vw, vh); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  if (G.flash > 0.02) { g.fillStyle = 'rgba(240,244,255,' + (G.flash * 0.4).toFixed(3) + ')'; g.fillRect(0, 0, vw, vh); }
  for (const b of bubbles) dI(g, b[0], b[1], b[2]);
  if (R.xf > 0 && R.snap) { g.globalAlpha = Math.ceil(R.xf * 8) / 8; g.drawImage(R.snap, 0, 0, vw, vh); g.globalAlpha = 1; }
}
// ----- eras: swap buildings / signs / skyline in place with a short crossfade; people and traffic turn over on their own -----
function toggleRiverView() { const nearRiver = Math.abs(R.panX - RIVER_VIEW.px) < 60 && Math.abs(R.panY - RIVER_VIEW.py) < 60; R.tween = nearRiver ? HOME_VIEW : RIVER_VIEW; G.riverOn = !nearRiver; viewLabel(); if (!nearRiver) ticker('Bến Bạch Đằng: nước chảy chậm, gió sông mát rượi', true); }
function setTet(on, quiet) {
  if (!G.world || G.busy || on === G.tet) return;
  if (on) EV.clear(true);                                                  // Tết and the night events never overlap
  snapshot(); G.tet = on; EV.sel = on ? 'tet' : EV.sel === 'tet' ? 'none' : EV.sel; G.world.items = buildStatics(G.season, G.era); G.world.vis = null; R.dirty = true; R.xf = 1; if (!on) TET.off(); TET.sync(); DAN.sync();
  updateUI(); save(); if (!quiet) ticker(on ? 'Tết đến rồi! Hoa mai nở vàng, đèn lồng đỏ khắp phố' : 'Hết Tết, phố trở lại nhịp sống thường ngày', true);
}
function setEra(e, quiet) {
  if (e === G.era || G.busy || !G.world) return;
  snapshot();
  G.era = e; ensureOv(G.season, e); G.world.items = buildStatics(G.season, e); G.world.vis = null; R.dirty = true; R.xf = 1; TET.sync(); EV.onEra(); DAN.sync();
  eraShift(); updateUI(); save(); if (!quiet) ticker(UI['era.' + e + '.msg'][0], true);
}
// bake the other eras' buildings a few at a time while idle, so the first switch has no hitch
let _pb = 0;
function prebake() {
  if (ovPrebake()) return;
  if (!G.world || G.busy) return; const recs = CITY.recs, snow = G.season === 'winter', t0 = performance.now();
  while (_pb < recs.length * 4 && performance.now() - t0 < 5) { const r = recs[_pb >> 2], e = _pb & 3; _pb++; if (r.t === 'b' && e >= r.e0 && e <= r.e1 && (r.gen || e === r.e0)) bakeRec(r, e, snow); }
}
function tick(dt) {
  G.t += dt;
  if (G.autoTime) G.hour = (G.hour + dt * G.daySpeed) % 24; else { const df = ((G.hourTarget - G.hour + 36) % 24) - 12; G.hour = (G.hour + clamp(df, -dt * 7, dt * 7) + 24) % 24; }
  if (G.autoSeason && !G.busy) { G.seasonT += dt; if (G.seasonT > 150) setSeason(SEASONS[(SEASONS.indexOf(G.season) + 1) % 4]); }
  if (R.xf > 0) R.xf -= dt / 1.1;
  TET.tick(dt); EV.tick(dt); DAN.tick(dt); updateWeather(dt); updateSim(dt); updateFx(dt); updateWater(dt); ambTick(dt);
}
let _last = 0, _uiT = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (ts - _last) / 1000 || 0.016); _last = ts;
  if (!G.world || document.hidden) return;
  tick(dt); draw(); prebake();
  _uiT -= dt; if (_uiT <= 0) { _uiT = 0.25; updateStatus(); drawViz(); }
}

// ----- seasons -----
const sleep = ms => new Promise(r => setTimeout(r, ms));
function snapshot() { const W = R.canvas.width, H = R.canvas.height; if (!R.snap || R.snap.width !== W || R.snap.height !== H) R.snap = mk(W, H); const sg = R.snap.getContext('2d'); sg.clearRect(0, 0, W, H); sg.drawImage(R.canvas, 0, 0); }
// first call shows the loading card; later season changes repaint the ground in the background and crossfade in place
async function setSeason(s, first) {
  if (G.busy && !first) return; G.busy = true; G.seasonT = 0;
  const fade = $('fade');
  if (first) { $('fadeB').style.width = '0%'; fade.classList.add('on'); await sleep(30); } else ticker('Đang sang mùa ' + UI['season.' + s][0].toLowerCase() + '…', true);
  if (!GROUNDS[s]) GROUNDS[s] = await paintGround(s, p => { if (first) $('fadeB').style.width = Math.round(p * 70) + '%'; });
  await sleep(20);
  if (!first) snapshot();
  G.season = s; for (const k in OV) delete OV[k]; OVJOB = null; ensureOv(s, G.era); const items = buildStatics(s, G.era); if (first) $('fadeB').style.width = '100%';
  if (!G.world) G.world = { ground: GROUNDS[s], items }; else { G.world.ground = GROUNDS[s]; G.world.items = items; }
  for (const k in GROUNDS) if (k !== s) delete GROUNDS[k];   // the K-density ground is large: keep only the current season
  G.world.vis = null; R.dirty = true; visList();
  if (first) { initSim(); TET.sync(); DAN.sync(); EV.sync('boot'); } else { reseasonPeds(); EV.onSeason(); DAN.sync(); R.xf = 1; }
  _pb = 0; FX.drift.length = 0; if (G.autoWeather && G.weather !== 'clear' && !first) setWeather('clear');
  if (first) { await sleep(200); fade.classList.remove('on'); }
  G.busy = false; updateUI(); save();
  if (!first) ticker({ spring: 'Xuân về: mai nở vàng, bướm ong bay quanh phố', summer: 'Hè tới: nắng chang chang, ve kêu râm ran', fall: 'Thu sang: lá vàng rơi khắp vỉa hè', winter: 'Đông mộng mơ: Sài Gòn có tuyết rơi nhẹ' }[s], true);
}

// ----- UI -----
function save() { try { localStorage.setItem('saigonlofi', JSON.stringify({ tet: G.tet, ev: EV.sel, streetOn: AU.streetOn, era: G.era, season: G.season, autoSeason: G.autoSeason, time: G.autoTime ? 'auto' : G.timeKey, wx: G.autoWeather ? 'auto' : G.weather, vol: AU.vol, track: AU.track, zoom: R.zoom, zv: 2 })); } catch (e) { } }
function load() { try { return JSON.parse(localStorage.getItem('saigonlofi') || '{}'); } catch (e) { return {}; } }
const TIMES = { morning: 7.5, noon: 12.5, dusk: 17.9, night: 21.5 };
function setTime(k) { G.timeKey = k; if (k === 'auto') G.autoTime = true; else { G.autoTime = false; G.hourTarget = TIMES[k]; } updateUI(); save(); }
function setWx(k) { if (k === 'auto') { G.autoWeather = true; G.weatherT = Math.min(G.weatherT, 20); } else { G.autoWeather = false; setWeather(k); } updateUI(); save(); }
function wxLabel() { return t('wx.status.' + (G.season === 'winter' ? (G.rain > 0.3 ? 'snow2' : 'snow1') : G.rain > 0.3 ? 'rain' : G.windy ? 'wind' : G.cloud > 0.5 ? 'cloud' : G.hot ? 'hot' : 'clear')); }
function updateStatus() { const h = Math.floor(G.hour), m = Math.floor((G.hour - h) * 60); $('status').textContent = SNAME[G.season] + ' · ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' · ' + wxLabel() + EV.statusText(); }
function updateUI() {
  document.querySelectorAll('[data-era]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.era === G.era)); $('eraSub').textContent = t('era.' + G.era + '.sub');
  document.querySelectorAll('[data-season]').forEach(b => b.setAttribute('aria-pressed', b.dataset.season === G.season));
  $('autoSeason').setAttribute('aria-pressed', G.autoSeason); document.querySelectorAll('[data-ev]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ev === EV.sel)); $('streetOn').setAttribute('aria-pressed', AU.streetOn); $('streetOn').textContent = t(AU.streetOn ? 'street.on' : 'street.off');
  document.querySelectorAll('[data-time]').forEach(b => b.setAttribute('aria-pressed', b.dataset.time === (G.autoTime ? 'auto' : G.timeKey)));
  document.querySelectorAll('[data-wx]').forEach(b => b.setAttribute('aria-pressed', b.dataset.wx === (G.autoWeather ? 'auto' : G.weather)));
  $('wxRainL').textContent = t(G.season === 'winter' ? 'wx.snow' : 'wx.rain'); viewLabel();
  $('tname').textContent = YTS.on ? (YTS.title || 'YouTube') : t('track.' + AU.track); $('tnum').textContent = YTS.on ? t('ytTrack') : t('tnum', { n: AU.track + 1, total: TRACKS.length });
  $('play').classList.toggle('playing', YTS.on ? YTS.playing : AU.playing); updateStatus();
}
function viewLabel() { const b = $('viewRiver'); b.textContent = t(G.riverOn ? 'view.back' : 'view.river'); b.title = t(G.riverOn ? 'view.back.t' : 'view.river.t'); }
// called by setLang(): re-renders every dynamic string in the new language; no game state is touched
function refreshDynamicText() {
  updateUI(); ytRender(); viewLabel();
  const tk = $('ticker'); if (tk && G.tickRaw) tk.textContent = tm(G.tickRaw);
}
function drawViz() { const c = $('viz'), g = c.getContext('2d'), a = vizLevel(); g.clearRect(0, 0, c.width, c.height); g.fillStyle = '#c4583a'; for (let i = 0; i < 10; i++) { const v = a ? a[i + 1] / 255 : 0.06, hh = Math.max(1, Math.round(v * 13)); g.fillRect(i * 4, 14 - hh, 3, hh); } }
function initUI() {
  const st = load();
  ytRender();
  document.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => setLang(b.dataset.lang));
  if (st.vol) Object.assign(AU.vol, st.vol); if (st.track !== undefined) AU.track = st.track % TRACKS.length; if (st.zoom && st.zv === 2) R.zoom = st.zoom; G.autoSeason = !!st.autoSeason;
  if (st.streetOn === false) AU.streetOn = false; $('vStreet').value = AU.vol.street * 100; $('vMusic').value = AU.vol.music * 100; $('vAmb').value = AU.vol.amb * 100; $('vVinyl').value = AU.vol.vinyl * 100;
  $('play').onclick = () => { $('hint').classList.add('gone'); if (YTS.on) { ytToggle(); return; } if (AU.playing) audioPause(); else audioPlay(); updateUI(); };
  $('prev').onclick = () => { if (YTS.on) ytNext(-1); else nextTrack(-1); updateUI(); save(); }; $('next').onclick = () => { if (YTS.on) ytNext(1); else nextTrack(1); updateUI(); save(); };
  $('ytGo').onclick = () => { $('hint').classList.add('gone'); ytLoad($('ytUrl').value); }; $('ytUrl').addEventListener('keydown', e => { if (e.key === 'Enter') $('ytGo').click(); }); $('ytOff').onclick = () => ytOff();
  try { $('ytUrl').value = localStorage.getItem('saigonlofi-yt') || ''; } catch (e) { }
  $('more').onclick = () => { const p = $('panel'); p.hidden = !p.hidden; $('more').setAttribute('aria-expanded', !p.hidden); };
  document.querySelectorAll('[data-season]').forEach(b => b.onclick = () => { if (b.dataset.season !== G.season) setSeason(b.dataset.season); });
  document.querySelectorAll('[data-era]').forEach(b => b.onclick = () => setEra(+b.dataset.era));
  document.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => setEvent(b.dataset.ev !== 'none' && b.dataset.ev === EV.sel ? 'none' : b.dataset.ev));
  $('streetOn').onclick = () => { AU.streetOn = !AU.streetOn; setVol(); updateUI(); save(); };
  $('vStreet').oninput = e => { AU.vol.street = e.target.value / 100; setVol(); save(); };
  $('viewRiver').onclick = toggleRiverView;
  $('autoSeason').onclick = () => { G.autoSeason = !G.autoSeason; G.seasonT = 0; updateUI(); save(); };
  document.querySelectorAll('[data-time]').forEach(b => b.onclick = () => setTime(b.dataset.time));
  document.querySelectorAll('[data-wx]').forEach(b => b.onclick = () => setWx(b.dataset.wx));
  for (const [id, k] of [['vMusic', 'music'], ['vAmb', 'amb'], ['vVinyl', 'vinyl']]) $(id).oninput = e => { AU.vol[k] = e.target.value / 100; setVol(); if (k === 'music') ytVolume(AU.vol.music); save(); };
  $('zin').onclick = () => { R.zoom++; resize(); save(); }; $('zout').onclick = () => { R.zoom--; resize(); save(); };
  $('full').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); };
  $('hide').onclick = () => { document.body.classList.add('clean'); ticker('Bấm phím H hoặc chạm 2 lần để hiện lại bảng', true); };
  window.addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase(); if (k === 'h') document.body.classList.toggle('clean'); else if (k === ' ') { e.preventDefault(); $('play').click(); } else if (k >= '1' && k <= '4') { const s = SEASONS[+k - 1]; if (s !== G.season) setSeason(s); } else if (k === 't') setEvent(G.tet ? 'none' : 'tet'); else if (k === 'q' || k === 'o' || k === 'x') { const e = { q: 'qk', o: 'hw', x: 'xm' }[k]; setEvent(EV.sel === e ? 'none' : e); } else if (k === 'b') toggleRiverView(); else if (k === '[' || k === ']') setEra(clamp(G.era + (k === ']' ? 1 : -1), 0, 3)); else if (k === 'r') setWx(G.weather === 'rain' && !G.autoWeather ? 'clear' : 'rain'); else if (k === 'n') setTime(G.timeKey === 'night' ? 'auto' : 'night'); else if (k === '+' || k === '=') $('zin').click(); else if (k === '-') $('zout').click(); });
  // drag to pan, wheel to zoom
  const cv = R.canvas; let drag = null;
  cv.addEventListener('pointerdown', e => { R.tween = null; drag = { x: e.clientX, y: e.clientY, px: R.panX, py: R.panY, m: 0 }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!drag) return; drag.m = Math.max(drag.m, Math.hypot(e.clientX - drag.x, e.clientY - drag.y)); const k = R.dpr / R.scale; R.panX = drag.px - (e.clientX - drag.x) * k; R.panY = drag.py - (e.clientY - drag.y) * k; camera(); });
  cv.addEventListener('pointerup', e => { if (drag && drag.m < 5) DAN.click(e.clientX, e.clientY); drag = null; }); cv.addEventListener('pointercancel', () => { drag = null; });
  cv.addEventListener('dblclick', () => document.body.classList.remove('clean'));
  cv.addEventListener('wheel', e => { e.preventDefault(); R.zoom += e.deltaY < 0 ? 1 : -1; resize(); save(); }, { passive: false });
  window.addEventListener('resize', resize);
  G.onSfx = sfx;
  return st;
}
async function boot() {
  R.canvas = $('cv'); R.ctx = R.canvas.getContext('2d'); R.lc = mk(4, 4); R.lctx = R.lc.getContext('2d');
  R.halo = glow(44, 255, 214, 140, 150); R.pool = glow(60, 255, 206, 130, 70, true); R.pool2 = glow(26, 255, 236, 180, 110, true);
  const st = initUI(), q = new URLSearchParams(location.search);
  G.era = clamp(+(q.get('era') || st.era || 0) | 0, 0, 3); G.tet = q.get('tet') === '1' || (q.get('tet') === null && !!st.tet);
  G.season = q.get('season') || st.season || 'spring'; if (!SEASONS.includes(G.season)) G.season = 'spring';
  if (q.get('zoom')) R.zoom = +q.get('zoom');
  if (q.get('look')) { const t = q.get('look').split(','), wx = t[0] * T + 4, wy = t[1] * T + 4; R.panX = wx - wy; R.panY = (wx + wy) / 2 - WORLD / 2; }
  if (q.get('pan')) { const p = q.get('pan').split(','); R.panX = +p[0]; R.panY = +p[1]; }
  initIcons(); initUmbrellas(); initDogs(); initFx(); planCity(); planTet(); EV.plan(); DAN.plan(); resize();
  const tm = q.get('time') || st.time; if (tm && tm !== 'auto' && TIMES[tm]) { G.timeKey = tm; G.autoTime = false; G.hour = G.hourTarget = TIMES[tm]; }
  EV.boot(q.get('ev') || st.ev);                                           // night events start at night, before the world is built
  await setSeason(G.season, true);
  const wx = q.get('wx') || st.wx; if (wx && wx !== 'auto') { G.autoWeather = false; setWeather(wx); if (q.get('wx')) { G.rain = G.rainTarget; G.cloud = G.cloudTarget; } }
  if (q.get('yt')) { $('panel').hidden = false; $('ytUrl').value = q.get('yt'); ytLoad(q.get('yt')); }
  if (q.get('clean')) { document.body.classList.add('clean'); $('fade').style.display = 'none'; }
  const warp = +q.get('warp') || 0; for (let i = 0; i < warp * 20; i++) tick(0.05);
  if (q.get('boat')) { SIM.boats.push(makeBoat({ x: RIV.laneB, dir: -1 }, q.get('boat'), RIV.pierStop + 70)); for (let i = 0; i < (+q.get('bw') || 0) * 20; i++) tick(0.05); }
  if (q.get('toera')) { draw(); setEra(+q.get('toera')); const w2 = +q.get('warp2') || 0; for (let i = 0; i < w2 * 20; i++) tick(0.05); }
  if (q.get('toseason')) { await setSeason(q.get('toseason')); for (let i = 0; i < 40; i++) tick(0.05); }
  updateUI(); requestAnimationFrame(frame);
}
window.addEventListener('DOMContentLoaded', boot);
