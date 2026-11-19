'use strict';
// ===== Holdfast FUTURE — rendering (reads simulation state, never drives it): machine sprites, friendly drones, pulse bolts, sensor cones,
// signals, searchlights, blackouts, the grid's lights, hydroponic trays, paved lanes, the depot's rovers. Reached only through HF.era === 'future'.
// Math.random is allowed here (render-only effects). Sprite caches hold immutable art and are keyed by everything they depend on.

// ---------------------------------------------------------------- machine sprites: baked box models, two baked orientations, mirrored for the other two facings
const _fbs = new Map();
function fMirror(s) { const c = mk(s.c.width, s.c.height), g = c.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(s.c, 0, 0); let e = null; if (s.e) { e = mk(s.e.width, s.e.height); const ge = e.getContext('2d'); ge.translate(e.width, 0); ge.scale(-1, 1); ge.drawImage(s.e, 0, 0); } return { c, e, w: s.w, h: s.h, ax: s.w - s.ax, ay: s.ay }; }
const fRotBack = B => B.map(b => Object.assign({}, b, { x: b.y, y: -(b.x + b.w), w: b.d, d: b.w }));   // forward +x -> forward -y (seen from behind)
// k: stand | walk | atk | climb | dead; f: frame; o: 0 front (+x), 1 back (-y); m: mirrored
function botSprite(t, k, f, o, m, seed) {
  const key = t + '|' + k + '|' + f + '|' + o + '|' + m + '|' + (k === 'dead' ? seed : 0); let s = _fbs.get(key); if (s) return s;
  if (m) { s = fMirror(botSprite(t, k, f, o, 0, seed)); _fbs.set(key, s); return s; }
  let B = k === 'dead' ? botWreckBoxes(t, seed) : FBOTS_M[t].model({ k, f });
  if (o) B = fRotBack(B);
  s = bake(B, {}); _fbs.set(key, s); return s;
}
const fOrient = dir => dir === 0 ? [0, 0] : dir === 1 ? [0, 1] : dir === 3 ? [1, 0] : [1, 1];
function botDraw(D, a, L, cull) {
  if (a.st === 'dead' && (a.corpseT <= 0 || a.gone)) return;
  const T = a.L.t, S = FBOTS_M[T], x = a.px + (a.x - a.px) * L, y = a.py + (a.y - a.py) * L, dead = a.st === 'dead';
  const alt = dead ? (a.fly ? Math.max(0, a.alt || 0) : 0) : (a.alt || 0) + (a.fly ? Math.sin(HS.t * 3 + a.ph) * 0.8 : 0), p = ISO(x, y, alt);
  if (cull(p[0] - 30, p[1] - 70, 60, 80 + alt)) return;
  const moving = Math.hypot(a.x - a.px, a.y - a.py) > 0.01, tt = HS.t + (a.ph || 0); let k = 'stand', f = 0;
  if (dead) k = 'dead';
  else if (T === 'leech' && a.climbing) k = 'climb';
  else if (S.fly) { k = 'stand'; f = 0; }
  else if (T === 'pylon' && a.dep) { k = 'stand'; f = Math.floor(tt * 2) % 4; }
  else if (moving) { k = 'walk'; f = Math.floor(a.stride / (T === 'walker' || T === 'colossus' || T === 'brute' ? 5 : T === 'tank' || T === 'racer' || T === 'rover' ? 1.4 : 2.2)) % 4; }
  if (!dead && (a.st === 'attack' || a.st === 'wall' || a.st === 'gate' || a.repairing > HS.t - 0.5 || (FBOT_GUNS[T] && a.st === 'pursue' && !moving)) && Math.floor(tt / 0.4) % 2) k = 'atk';
  const [o, m] = fOrient(a.dir), spr = botSprite(T, k, k === 'walk' || k === 'stand' ? f : 0, o, m, (a.id || 0) % 3), fade = dead ? corpseAlpha(a) : 1;
  const dz = alt > 12 ? 40 : 0, sx = Math.round((p[0] - spr.ax) * K) / K, sy = Math.round((p[1] - spr.ay) * K) / K;
  D.push({ c: spr.c, e: dead ? null : spr.e, x: sx, y: sy, w: spr.w, h: spr.h, d: x + y + dz, sh: alt > 1 ? null : [p[0], p[1], Math.max(4, spr.w * 0.3)], blink: !dead && a.stT > 0 && spr.w < 30, alpha: fade < 1 ? fade : 0 });
  if (alt > 1) { const gp = ISO(x, y); D.push({ c: HR.nil, x: gp[0], y: gp[1], w: 0.01, h: 0.01, d: x + y - 1, sh: [gp[0], gp[1], Math.max(3, spr.w * 0.22)] }); }
  // a sensor cone sweeping the ground ahead (faint by day; it glows at night in the light pass)
  const Sc = BSTAT[T].scan; if (!dead && Sc && (T !== 'pylon' || a.dep || moving)) { const R0 = Math.min(Sc[0], 110) * (T === 'pylon' ? 1 : 0.8), ang = a.ang || 0, half = Math.min(Sc[1], 0.8); D.push({ c: HR.nil, x: p[0], y: p[1], w: 0.01, h: 0.01, d: x + y - 3, over: (g) => fCone(g, x, y, R0, ang, half, 'rgba(255,90,60,0.07)') }); }
  if (!dead && T === 'jammer' && a.dep) D.push({ c: HR.nil, x: p[0], y: p[1], w: 0.01, h: 0.01, d: x + y + 1, over: (g) => { const r = ((HS.t * 0.6) % 1) * 30, q = ISO(x, y, 20); g.strokeStyle = 'rgba(208,74,255,' + (0.5 * (1 - r / 30)).toFixed(2) + ')'; g.lineWidth = 0.5; g.beginPath(); g.ellipse(q[0], q[1], r, r * 0.5, 0, 0, TAU); g.stroke(); } });
  if (dead && HS.t - (a.deadAt || 0) < 25 && Math.random() < 0.5) { const q = ISO(x + (Math.random() - 0.5) * 3, y, 4 + Math.random() * 10 + (HS.t - (a.deadAt || 0)) * 0.3); D.push({ c: HR.nil, x: q[0], y: q[1], w: 0.01, h: 0.01, d: x + y + 0.5, over: (g) => { g.fillStyle = 'rgba(70,64,72,0.35)'; g.fillRect(q[0] - 1, q[1] - 1, 2, 2); } }); }
}
const FBOT_GUNS = { sentry: 1, warden: 1, tank: 1, hawk: 1, walker: 1, colossus: 1 };
function fCone(g, x, y, R0, ang, half, col) {
  g.fillStyle = col; g.beginPath(); const a0 = ISO(x, y); g.moveTo(a0[0], a0[1]);
  for (let i = 0; i <= 8; i++) { const a = ang - half + (2 * half) * i / 8, q = ISO(x + Math.cos(a) * R0, y + Math.sin(a) * R0); g.lineTo(q[0], q[1]); }
  g.closePath(); g.fill();
}
// friendly drones (repair / cargo / medical), baked once
const _fds = new Map();
function droneSprite(k, m) { const key = k + m; let s = _fds.get(key); if (s) return s; s = m ? fMirror(droneSprite(k, 0)) : bake(FDRONE[k](), {}); _fds.set(key, s); return s; }
// the parts bin beside the workshop shows how much salvage is waiting (0-4 levels)
const _fbin = new Map();
function binSprite(n) { let s = _fbin.get(n); if (!s) { s = bake([HB(0, 0, 0, 8, 5, 2.6, FGRAPH, fMetalP(FGRAPH, 3))].concat(n > 0 ? [HB(1, 1, 2.6, 6, 3, 0.6 + n * 0.6, 0x5a6270, botP(0x5a6270, n)), HB(2, 1.6, 3 + n * 0.6, 2, 1.6, 1.2, FCOPPER)] : []), {}); _fbin.set(n, s); } return s; }

// ---------------------------------------------------------------- per frame: drones, bolts, signals, searchlight spots, the parts bin, wreck smoke; dynamic lights into HR.dyn
function futDraw(D, cull, t) {
  for (const q of HS.fdrones) { const L = HR.lerp || 1, x = q.px + (q.x - q.px) * L, y = q.py + (q.y - q.py) * L, alt = q.alt + (q.st === 'wreck' || q.st === 'bench' || q.st === 'carried' ? 0 : Math.sin(t * 4 + q.ph) * 0.6), p = ISO(x, y, alt);
    if (cull(p[0] - 10, p[1] - 12, 20, 16 + alt)) continue; const s = droneSprite(q.k, q.dir === 1 || q.dir === 2 ? 1 : 0);
    D.push({ c: s.c, e: q.st === 'wreck' ? null : s.e, x: Math.round((p[0] - s.ax) * K) / K, y: Math.round((p[1] - s.ay) * K) / K, w: s.w, h: s.h, d: x + y + (alt > 8 ? 40 : 0.5), alpha: q.st === 'wreck' && Math.floor(t * 2) % 2 ? 0.75 : 0 });
    if (alt > 1) { const gp = ISO(x, y); D.push({ c: HR.nil, x: gp[0], y: gp[1], w: 0.01, h: 0.01, d: x + y - 1, sh: [gp[0], gp[1], 3] }); }
    if (q.st === 'weld') HR.dyn.push([p[0], p[1] + 2, 18, 'rgba(140,220,255,', 0.6, 2]); else if (q.st !== 'wreck') HR.dyn.push([p[0], p[1], 8, q.k === 'med' ? 'rgba(140,240,160,' : 'rgba(255,200,120,', 0.5, 1]); }
  if (HF.fbin) { const n = Math.min(4, HS.Fs.parts), s = binSprite(n), p = ISO(HF.fbin[0], HF.fbin[1]); if (!cull(p[0] - 10, p[1] - 10, 20, 14)) D.push({ c: s.c, e: s.e, x: p[0] - s.ax, y: p[1] - s.ay, w: s.w, h: s.h, d: HF.fbin[0] + HF.fbin[1] }); }
  // everything that flies through the air is drawn after the sprites
  D.push({ c: HR.nil, x: 0, y: 0, w: 0.01, h: 0.01, d: 1e9, over: (g) => futOverlay(g, t) });
  // tower searchlights sweep the ground outside at night (off when jammed or without power)
  if (hsDark() || HS.alarm > 0) for (const tw of HF.towers) { if (tw.off && Math.floor(t * 7 + tw.id) % 3) continue; const sp = futSpot(tw, t), q = ISO(sp[0], sp[1]); HR.dyn.push([q[0], q[1], 22, 'rgba(255,248,220,', tw.off ? 0.25 : 0.55, 1]); }
  for (const z of HS.zombies) if (z.st !== 'dead' && (z.L.t === 'colossus' || z.L.t === 'walker' || z.L.t === 'eye') && (hsDark() || z.L.t === 'colossus')) { const r = z.L.t === 'eye' ? 40 : 70, a = z.ang || 0, sx = z.x + Math.cos(a) * r, sy = z.y + Math.sin(a) * r, q = ISO(sx, sy); HR.dyn.push([q[0], q[1], z.L.t === 'eye' ? 14 : 26, 'rgba(255,120,90,', 0.45, 1]); }
}
const futSpot = (tw, t) => { const cx = tw.x + 9, cy = tw.y + 9, a = -2.36 + Math.sin(t * 0.35 + tw.id * 1.7) * 0.9, r = 70 + Math.sin(t * 0.21 + tw.id) * 25; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
function futOverlay(g, t) {
  // pulse bolts: cyan (defenders), amber (turrets), red (machines), pale (training)
  for (const f of HS.fx) { if (f.k !== 'bolt') continue; const q = clamp(1 - f.t / f.T, 0, 1), a = ISO(f.x0, f.y0, f.z0), b = ISO(f.x1, f.y1, f.z1), q0 = Math.max(0, q - 0.35);
    const x0 = a[0] + (b[0] - a[0]) * q0, y0 = a[1] + (b[1] - a[1]) * q0, x1 = a[0] + (b[0] - a[0]) * q, y1 = a[1] + (b[1] - a[1]) * q;
    g.strokeStyle = f.hostile ? (f.big ? '#ff6a3a' : '#ff5040') : f.turret ? '#ffc060' : f.train ? '#d8f0f0' : '#8ae8ff'; g.lineWidth = f.big ? 1.2 : 0.7; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.fillStyle = '#ffffff'; g.fillRect(Math.round(x1 * K) / K - 0.5, Math.round(y1 * K) / K - 0.5, 1, 1); }
  // signals: a ring at the transmitting machine, a faint thread to what it reported
  for (const s of HS.sig) { const age = HS.t - s.t, p = ISO(s.x, s.y, s.z || 10); if (s.emp) { g.strokeStyle = 'rgba(208,74,255,' + (0.45 * (1 - age / 2.4)).toFixed(2) + ')'; g.lineWidth = 0.6; g.beginPath(); g.ellipse(p[0], p[1], age * 30, age * 15, 0, 0, TAU); g.stroke(); continue; }
    for (let k = 0; k < 2; k++) { const r = ((age * 1.4 + k * 0.5) % 1) * 18; g.strokeStyle = 'rgba(255,90,60,' + (0.7 * (1 - r / 18) * (1 - age / 2.4)).toFixed(2) + ')'; g.lineWidth = 0.5; g.beginPath(); g.ellipse(p[0], p[1], r, r * 0.55, 0, 0, TAU); g.stroke(); }
    if (s.tx !== undefined && age < 1.2) { const q = ISO(s.tx, s.ty, 6); g.strokeStyle = 'rgba(255,90,60,' + (0.35 * (1 - age / 1.2)).toFixed(2) + ')'; g.setLineDash([1.5, 1.5]); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.setLineDash([]); } }
  // searchlight beams (a soft wedge from the platform to its spot) at night
  if (hsDark() || HS.alarm > 0) for (const tw of HF.towers) { if (tw.off && Math.floor(t * 7 + tw.id) % 3) continue; const a = ISO(tw.x + 5, tw.y + 12, 52), sp = futSpot(tw, t), b = ISO(sp[0], sp[1]); g.fillStyle = 'rgba(255,248,220,' + (tw.off ? 0.04 : 0.09) + ')'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0] - 9, b[1]); g.lineTo(b[0] + 9, b[1]); g.closePath(); g.fill(); g.beginPath(); g.ellipse(b[0], b[1], 11, 5.5, 0, 0, TAU); g.fill(); }
}

// ---------------------------------------------------------------- the light pass: blacked-out sectors lose their window glow; then the age's own lights
function futSecPoly(i) { const P = []; const u0 = 150 + i * 165, u1 = u0 + 165, wv = u => wallV(clamp(u, 120, 840)); for (let u = u0; u <= u1; u += 15) P.push(ISO(...d2w(u, wv(u) - 6))); for (let u = u1; u >= u0; u -= 15) P.push(ISO(...d2w(u, wv(u) + 520))); return P; }
function futLightMask(lg) {
  for (const s of HS.Fp.sec) { const off = !s.on, fl = s.flick > 0 && Math.random() < 0.6; if (!off && !fl) continue; if (s.i === HS.Fp.civ && !off) continue;
    const P = futSecPoly(s.i); lg.globalCompositeOperation = 'destination-out'; lg.fillStyle = off ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.6)'; lg.beginPath(); lg.moveTo(P[0][0], P[0][1]); for (const q of P) lg.lineTo(q[0], q[1]); lg.closePath(); lg.fill(); }
  lg.globalCompositeOperation = 'source-over';
}
function futLight(lg, t) {
  // sensor cones glow faintly red at night; machine eyes are already emissive in their sprites
  for (const z of HS.zombies) { if (z.st === 'dead') continue; const Sc = BSTAT[z.L.t].scan; if (!Sc) continue; const R0 = Math.min(Sc[0], 110) * 0.8; fCone(lg, z.x, z.y, R0, z.ang || 0, Math.min(Sc[1], 0.8), 'rgba(255,70,50,0.10)'); }
  for (const f of HS.fx) if (f.k === 'bolt') { const q = clamp(1 - f.t / f.T, 0, 1), p = ISO(f.x0 + (f.x1 - f.x0) * q, f.y0 + (f.y1 - f.y0) * q, f.z0 + (f.z1 - f.z0) * q); hrGlow(lg, p[0], p[1], f.big ? 16 : 9, f.hostile ? 'rgba(255,90,60,' : f.turret ? 'rgba(255,190,90,' : 'rgba(120,220,255,', 0.8); }
  for (const tw of HF.towers) if (tw.fired && HS.t - tw.fired < 0.12) { const p = ISO(tw.x + 13, tw.y + 4, 54); hrGlow(lg, p[0], p[1], 20, 'rgba(255,200,110,', 0.9); }
  // night patrols carry hand lamps along the wall walk
  for (const p of HS.people) { if (!p.alive || p.role !== 'guard' || !p.post || p.post.k !== 'patrol' || p.onTower) continue; const d = DIRV[p.dir] || [1, 0], q = ISO(p.x + d[0] * 9, p.y + d[1] * 9); hrGlow(lg, q[0], q[1], 12, 'rgba(255,240,200,', 0.55); }
  for (const s of HS.sig) { const p = ISO(s.x, s.y, s.z || 10); hrGlow(lg, p[0], p[1], 10, s.emp ? 'rgba(208,74,255,' : 'rgba(255,90,60,', 0.6 * (1 - (HS.t - s.t) / 2.4)); }
}

// ---------------------------------------------------------------- ground: composite paving with lane studs, paver streets, hexagon plazas, hydroponic trays in the fields
function futGround(g, wx, wy, u, v, n, vn, G, win) {
  let c;
  if (g === GK.ROAD) { const d = Math.abs(u - roadU(v)); if (d > 6) return undefined; c = vn > 0.55 ? 0xa8a49a : 0x9c988e; if (n > 0.92) c = 0x8a867c; if (Math.abs(d - 5.4) < 0.4) c = 0xc8c2b2; if (d < 0.35 && (v % 8) < 1) c = 0xe8c86a; if (hash2(wx * 3, wy) > 0.97) c = mixc(c, G[0], 0.5); }
  else if (g === GK.MAIN) { c = vn > 0.55 ? 0xb4b0a4 : 0xaaa69a; const lu = Math.abs(u - 480); if (lu > 9.3) c = mixc(c, G[0], 0.35); else if ((wx % 4) < 0.3 || (wy % 4) < 0.3) c = 0x8e8a80; if (lu < 0.6 && (v % 10) < 1.4) c = 0xe8c86a; }
  else if (g === GK.STREET) { const bx = Math.floor(wx / 2.2), by = Math.floor(wy / 1.1); c = (wx % 2.2 < 0.25 || wy % 1.1 < 0.2) ? 0x8a867c : hash2(bx + (by % 2) * 0.5, by) > 0.5 ? 0xb0aa9c : 0xa49e90; if (hash2(wx, wy * 2) > 0.94) c = mixc(c, G[0], 0.6); }
  else if (g === GK.PLAZA) { const hx = wx / 3, hy = wy / 2.6 + (Math.floor(wx / 3) % 2) * 0.5, e = Math.min(hx % 1, 1 - hx % 1, hy % 1, 1 - hy % 1); c = e < 0.08 ? 0x8a867c : vnoise(wx / 8, wy / 8) > 0.6 ? 0xc0baac : 0xb4ae9e; if (vnoise(wx / 14, wy / 14) > 0.72) c = mixc(c, G[0], 0.5); }
  else if (g === GK.FIELD) { const ry = (wy % 3.2); c = ry < 0.5 || ry > 2.7 ? 0xd8d2c4 : ry < 0.7 || ry > 2.5 ? 0xa8a296 : vnoise(wx / 3, wy) > 0.5 ? 0x3e5a5a : 0x34504e; if ((wx % 40) < 1.2 || (wy % 40) < 1.2) c = 0x9a968c; if (win && ry > 0.7 && ry < 2.5) c = 0xc8d8dc; return c; }   // tray channels between the plant rows
  else return undefined;
  if (win && vnoise(wx / 5, wy / 5 + 9) > 0.5) c = n > 0.8 ? 0xe6e8ee : 0xf2f4f6;
  return c;
}

// ---------------------------------------------------------------- the mobility depot's mounts: compact electric rovers in the horses' frame layout (walk = wheels turning)
function roverSprite(c0, frame, flip, pose, saddle) {
  const key = 'fr' + c0 + frame + (flip ? 'f' : '') + pose + (saddle ? 's' : ''); let s = HR.anim.get(key); if (s) return s;
  const W = 60, H = 46, g = new Int32Array(W * H).fill(-1), c = mixc(c0, 0xd8d2c4, 0.55), sh = mixc(c, 0x2b1a16, 0.32), hl = mixc(c, 0xfff1d6, 0.25);
  const set = (x, y, col) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + (flip ? W - 1 - x : x)] = grade(col); };
  const rect = (x0, y0, x1, y1, col, s2) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, s2 && y > (y0 + y1) / 2 ? s2 : col); };
  const wheel = (cx, cy) => { for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) { const r = Math.hypot(x, y); if (r > 5.2) continue; const a = Math.atan2(y, x) + frame * 0.8; set(cx + x, cy + y, r < 1.6 ? 0x9aa2ae : r < 3.4 ? (Math.abs(Math.sin(a * 2)) < 0.35 ? 0x6a6e76 : 0x3a3e46) : 0x24282e); } };
  wheel(16, 38); wheel(44, 38);
  rect(10, 28, 50, 33, c, sh); rect(12, 24, 48, 27, hl); rect(30, 18, 42, 23, c, sh); rect(31, 19, 41, 21, 0x5f8a96);   // body, deck, the little cab
  rect(50, 27, 52, 29, 0xffc070); rect(8, 27, 9, 30, 0xff6a4a);                                                             // lights
  if (pose === 'graze') { rect(20, 20, 26, 23, 0x3a3e46); rect(22, 16, 23, 19, 0x7ae08a); }                                 // parked: plugged into its charger, the plug lit
  else rect(14, 20, 26, 23, 0xc8a47a, mixc(0xc8a47a, 0x2b1a16, 0.3));                                                       // a cargo case on the rack
  if (saddle) { rect(24, 20, 32, 23, 0x4a4a52); rect(27, 16, 28, 19, 0x4a4a52); }
  s = gridCanvas(inkGrid(g, W, H, 0.85), W, H, null, K); HR.anim.set(key, s); return s;
}
// prepare-ahead for the world manager: every machine type's common poses (sliced)
function* futPrewarmG() {
  for (const t of FBOT_KEYS_COMMON) for (const o of [0, 1]) for (const m of [0, 1]) { botSprite(t, 'stand', 0, o, m, 0); if (slDue()) yield; for (let f = 0; f < 4; f++) { botSprite(t, 'walk', f, o, m, 0); if (slDue()) yield; } }
  for (const k in FDRONE) { droneSprite(k, 0); droneSprite(k, 1); } for (let n = 0; n <= 4; n++) binSprite(n);
}
const FBOT_KEYS_COMMON = ['rover', 'skitter', 'hound', 'sentry', 'warden', 'pylon', 'eye', 'leech', 'racer', 'spider', 'mender', 'tank', 'jammer'];

// ---------------------------------------------------------------- FUTURE sound (same synthesis, channels and voice caps as the other ages): pulse rifles, turrets, servos, pings, jamming, the grid
function haHum(v, pan) { const t = HA.ctx.currentTime, f = 70 + Math.random() * 30; haTone('sawtooth', f, f * 1.4, t, 0.25, 0.012 * v, 0.6, pan); haTone('sine', f * 3, f * 2.6, t + 0.1, 0.2, 0.008 * v, 0.5, pan); }
function haFuture(k, t, att, pan, v, now) {
  if (k === 'shot' || k === 'pulse' || k === 'turret' || k === 'zap') { HA.shots = HA.shots.filter(s => now - s < 10000); if (HA.shots.length >= 6 || now - (HA.last.shot || 0) < 120) return true; HA.shots.push(now); HA.last.shot = now;
    const f = k === 'zap' ? 520 : k === 'turret' ? 980 : 1400; haTone('square', f, f * 0.35, t, 0.002, (k === 'turret' ? 0.035 : 0.025) * att * v, 0.12, pan); haNoise(t, 0.04, 0.03 * att * v, 'bandpass', k === 'zap' ? 900 : 2400, pan, 2); return true; }
  if (HA.voices > 4) return true;
  const voice = (ms) => { HA.voices++; setTimeout(() => HA.voices--, ms); };
  if (k === 'moan' || k === 'growl' || k === 'snarl' || k === 'servo') { if (now - (HA.last.moan || 0) < 900) return true; HA.last.moan = now; voice(500); haTone('sawtooth', 180, 320, t, 0.06, 0.016 * att, 0.3, pan); haTone('sawtooth', 320, 160, t + 0.32, 0.05, 0.012 * att, 0.25, pan); return true; }
  if (k === 'ping') { if (now - (HA.last.ping || 0) < 700) return true; HA.last.ping = now; voice(400); haTone('sine', 1760, 1760, t, 0.004, 0.022 * att, 0.18, pan); haTone('sine', 2350, 2350, t + 0.16, 0.004, 0.016 * att, 0.22, pan); return true; }
  if (k === 'jam') { voice(1200); for (let i = 0; i < 6; i++) haTone('square', 140 + i * 37, 90, t + i * 0.12, 0.01, 0.02 * Math.max(0.4, att), 0.1, pan); haNoise(t, 0.9, 0.03 * Math.max(0.4, att), 'bandpass', 1300, pan, 6); return true; }
  if (k === 'stomp') { voice(500); haTone('sine', 58, 34, t, 0.004, 0.12 * Math.max(0.3, att) * v, 0.35, pan); haNoise(t, 0.08, 0.03 * att, 'lowpass', 260, pan); return true; }
  if (k === 'crash' || k === 'fall') { voice(500); haNoise(t, 0.25, 0.07 * att, 'bandpass', 1400, pan, 1.2); haTone('square', 330, 120, t, 0.002, 0.02 * att, 0.25, pan); return true; }
  if (k === 'cut') { voice(400); haNoise(t, 0.3, 0.035 * att, 'highpass', 3200, pan, 1); return true; }
  if (k === 'jet') { voice(900); haNoise(t, 0.9, 0.05 * att, 'bandpass', 900, pan, 0.8); return true; }
  if (k === 'powerdown') { voice(1500); haTone('sawtooth', 220, 40, t, 0.02, 0.04 * Math.max(0.4, att), 1.2, pan); return true; }
  if (k === 'powerup') { voice(900); haTone('sine', 180, 720, t, 0.05, 0.03 * Math.max(0.4, att), 0.6, pan); return true; }
  if (k === 'bell') { if (now - (HA.last.bell || 0) < 8000) return true; HA.last.bell = now; voice(3000); for (let i = 0; i < 4; i++) haTone('triangle', i % 2 ? 660 : 880, i % 2 ? 660 : 880, t + i * 0.42, 0.01, 0.045 * Math.max(0.4, att), 0.36, pan); return true; }
  if (k === 'bang') { voice(400); haTone('square', 160, 80, t, 0.002, 0.04 * att * v, 0.1, pan); haNoise(t, 0.05, 0.05 * att, 'bandpass', 1600, pan); return true; }
  return false;
}

// ---------------------------------------------------------------- FUTURE wording for the journal and the page (VI / EN); the journal falls back to LOGT
Object.assign(UI, {
  'hf.sub.future': ['Khu định cư bên khúc sông, thời của máy móc', 'A settlement in the river bend, in the age of machines'],
  'hf.world.t.future': ['Súng xung, tháp pháo, tiếng động cơ… tách riêng khỏi nhạc', 'Pulse rifles, turrets, servos… separate from the music'],
});
const LOGT_F = {
  'exp.out': ['{n} lên xe ra cổng, hướng về {poi}.', '{n} roll out of the gate toward the {poi}.'], 'exp.ok': ['Đội thu hồi trở về từ {poi}, mang theo {loot}.', 'The salvage team is back from the {poi} with {loot}.'],
  'exp.chased': ['Đội ở {poi} bị cảm biến phát hiện — rút về cổng!', 'The team at the {poi} was picked up by a sensor — falling back to the gate!'], rescue: ['Một tổ phản ứng nhanh lao ra khỏi cổng.', 'A response team rushes out of the gate.'],
  died: ['{n} đã ra đi. Một cột sáng mới được thắp ở vườn tưởng niệm.', '{n} is gone. A new light is lit in the memorial garden.'], hurt: ['{n} bị thương và được đưa vào trung tâm y tế.', '{n} was hurt and taken to the medical center.'],
  breach: ['Một đoạn tường chắn bị phá thủng!', 'A barrier section is breached!'], sealed: ['Đoạn tường chắn đã được thay tấm mới.', 'The barrier section has new plates.'], alarm: ['Còi báo động vang khắp khu định cư.', 'The siren sounds across the settlement.'], clear: ['Đã an toàn. Kỹ thuật viên và y tế bắt đầu khắc phục.', 'All clear. Technicians and medics start the recovery.'],
  pack: ['Một tổ máy săn áp sát một bệ phòng thủ.', 'A hunter pack is closing on a defense platform.'], major: ['Máy móc tấn công từ nhiều hướng!', 'Machines attack from several directions!'], siege: ['Mặt đất rung lên. Một cuộc công phá lớn bắt đầu.', 'The ground shakes. A siege begins.'],
  fdetect: ['Một máy trinh sát đã phát hiện khu định cư và đang phát tín hiệu.', 'A scout machine has spotted the settlement and is transmitting.'], freinf: ['Tín hiệu đã được trả lời: {n} máy đang kéo đến.', 'The signal was answered: {n} machines are coming.'],
  fjam: ['Một máy gây nhiễu đã dựng lên — vài tháp canh bị mù.', 'A jammer has deployed — some towers have gone blind.'], fswarm: ['Một máy điều khiển thả ra một bầy drone nhỏ.', 'A controller drone releases a swarm.'], fhawk: ['Một máy bay đánh chặn lượn qua bờ tường.', 'An interceptor sweeps over the wall.'],
  fwalker: ['Một cỗ máy công phá khổng lồ tiến về phía cổng!', 'A giant siege walker is heading for the gate!'], fcolossus: ['Một cỗ máy khổng lồ đi dọc bìa rừng, đèn quét sáng rực.', 'A colossal machine walks the forest edge, its searchlight sweeping.'],
  fblack: ['Khu {s} mất điện.', 'Sector {s} has lost power.'], frestore: ['Khu {s} đã có điện trở lại.', 'Power is back in sector {s}.'], fshed: ['Pin yếu — tạm cắt điện khu {s}.', 'Batteries low — sector {s} is switched off for now.'], fbackup: ['Khu {s} chuyển sang điện dự phòng — trung tâm y tế vẫn sáng.', 'Sector {s} is on backup power — the medical center stays lit.'],
  fdown: ['Một drone sửa chữa bị bắn rơi.', 'A repair drone was shot down.'], frecov: ['Thợ máy đi nhặt chiếc drone bị rơi.', 'A mechanic goes to pick up the downed drone.'], ffixed: ['Chiếc drone đã được sửa xong và cất cánh lại.', 'The drone is repaired and flying again.'],
  fcargo: ['Một drone chở hàng hạ cánh ở sàn trao đổi.', 'A cargo drone lands at the supply exchange.'], fmed: ['Một drone y tế giao thuốc lên mái trung tâm y tế.', 'A medical drone delivers supplies to the medical center roof.'],
  fpursuit: ['Đội thu hồi bị máy săn đuổi theo trên đường về!', 'Hunter machines are chasing the salvage team home!'], fsalvage: ['Linh kiện thu hồi đã được đưa vào xưởng chế tạo.', 'The salvaged parts are in the fabrication bay.'], frecover: ['Tường đã vá, điện đã có, người bị thương đã được chăm sóc. Khu định cư hồi phục.', 'Walls patched, power back, the wounded cared for. The settlement has recovered.'],
};
const POIN_F = { gas: ['trạm sạc cũ', 'old charging station'], houses: ['khu nhà mô-đun bỏ hoang', 'abandoned habitat block'], collapsed: ['tháp truyền tin đổ', 'fallen relay tower'], farm: ['trang trại tự động cũ', 'old automated farm'], radio: ['đồi ăng-ten', 'antenna hill'], ruins: ['thành phố chết', 'the dead city'], salvage: ['xác máy', 'machine wreck'] };
const LOOT_F = { food: ['khẩu phần', 'ration packs'], parts: ['linh kiện', 'components'], medicine: ['thuốc men', 'medicine'], seeds: ['hạt giống', 'seeds'], radio: ['một bộ thu phát', 'a transceiver'], fuel: ['pin', 'battery cells'] };
