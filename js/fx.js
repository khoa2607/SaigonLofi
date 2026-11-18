'use strict';
// ===== Sài Gòn Lofi — weather, seasons' particles, critters and things that fly past =====
const FX = { rain: [], snow: [], drift: [], streaks: [], bugs: [], flies: [], flyers: [], clouds: [], flyT: 9, steamT: 0, kiteA: 0, ripples: [] };
const LEAFC = [0xe0853a, 0xf2c14a, 0xc0622a, 0xd9a55a, 0xb8502a], PETALC = [0xf7c4d8, 0xfbe88a, 0xffffff, 0xf39abf];
function setWeather(k) { G.weather = k; G.weatherT = k === 'clear' ? rr(50, 110) : k === 'rain' ? rr(40, 75) : rr(30, 60); G.rainTarget = k === 'rain' ? rr(0.65, 1) : 0; G.cloudTarget = k === 'rain' ? 1 : k === 'wind' ? 0.45 : rr(0, 0.18); G.windy = k === 'wind'; if (k === 'rain') { G.flash = G.season === 'winter' ? 0 : 1; } }
function autoWeather() { const S = G.season; setWeather(wpick([['clear', 6], ['rain', S === 'summer' ? 3.6 : S === 'winter' ? 1.4 : 2.2], ['wind', S === 'fall' ? 3 : 1.6]])); const w = G.weather; ticker(w === 'rain' ? (S === 'winter' ? 'Tuyết rơi dày hơn rồi…' : 'Mây đen kéo tới, sắp mưa rồi') : w === 'wind' ? 'Gió nổi lên, lá bay khắp phố' : 'Trời quang mây tạnh'); }
function initFx() {
  for (let i = 0; i < 6; i++) FX.clouds.push({ x: rr(0, 1), y: rr(0, 1), s: rr(0.8, 1.5), v: rr(0.6, 1.2) });
  const c = mk(180, 90), g = c.getContext('2d'); g.fillStyle = 'rgb(40,46,84)';
  const bl = [[60, 46, 54, 26], [104, 40, 60, 30], [84, 56, 70, 26], [132, 54, 40, 20], [36, 54, 30, 16]];
  for (let y = 0; y < 90; y++) for (let x = 0; x < 180; x++) { let d = 9; for (const b of bl) { const nx = (x - b[0]) / b[2], ny = (y - b[1]) / b[3]; d = Math.min(d, nx * nx + ny * ny); } if (d < 0.72 || (d < 1 && (x + y) % 2 === 0)) g.fillRect(x, y, 1, 1); }
  FX.cloudSpr = c;
  for (let i = 0; i < 16; i++) FX.bugs.push({ kind: i < 10 ? 'fly' : 'bee', home: null, x: 0, y: 0, z: 8, ph: rr(0, 9), c: pick([0xf7d94a, 0xf39abf, 0xffffff, 0xf08a2b, 0x9fd0ff]), t: 0 });
  for (let i = 0; i < 12; i++) FX.flies.push({ x: 0, y: 0, ph: rr(0, 9), home: null });
}
function updateWeather(dt) {
  if (G.autoWeather) { G.weatherT -= dt; if (G.weatherT <= 0) autoWeather(); }
  G.rain += clamp(G.rainTarget - G.rain, -dt * 0.16, dt * 0.22); G.cloud += clamp(G.cloudTarget - G.cloud, -dt * 0.1, dt * 0.14);
  G.wet += clamp((G.rain > 0.2 && G.season !== 'winter' ? 1 : 0) - G.wet, -dt * 0.035, dt * 0.2);
  G.gustT -= dt; if (G.gustT <= 0) { G.gustT = G.windy ? rr(2.5, 6) : rr(9, 26); G.gustP = G.windy ? rr(0.6, 1) : rr(0.15, 0.45); if (G.windy && G.onSfx) G.onSfx('gust'); }
  G.gustP = Math.max(0, (G.gustP || 0) - dt * 0.22); G.gust += (G.gustP - G.gust) * Math.min(1, dt * 2.5);
  G.flash = Math.max(0, (G.flash || 0) - dt * 2.2);
  if (G.rain > 0.75 && G.season !== 'winter' && Math.random() < dt * 0.05) { G.flash = 1; if (G.onSfx) G.onSfx('thunder'); }
  G.hot = G.season === 'summer' && G.hour > 10.5 && G.hour < 15.5 && G.rain < 0.1 && G.cloud < 0.4;
  G.snowAmt = G.season === 'winter' ? 0.42 + G.rain * 0.58 : 0;
}
function visibleTree() { const W = G.world; return W && W.visTrees.length ? pick(W.visTrees) : null; }
function updateFx(dt) {
  const vw = R.vw, vh = R.vh, area = vw * vh, S = G.season, wind = 8 + G.gust * 46 + (G.windy ? 14 : 0);
  // rain (screen space)
  const rainAmt = S === 'winter' ? 0 : G.rain, nr = Math.round(area / 620 * rainAmt);
  while (FX.rain.length < nr) FX.rain.push({ x: rr(-20, vw + 40), y: rr(-vh, vh), l: rr(4, 8), v: rr(240, 330) });
  if (FX.rain.length > nr) FX.rain.length = nr;
  for (const d of FX.rain) { d.y += d.v * dt; d.x -= d.v * dt * 0.22; if (d.y > vh + 8) { if (chance(0.25)) FX.ripples.push({ x: d.x, y: rr(0, vh), t: 0 }); d.y = rr(-40, -4); d.x = rr(-10, vw + 60); } }
  for (const r of FX.ripples) r.t += dt; FX.ripples = FX.ripples.filter(r => r.t < 0.36);
  // snow (screen space)
  const ns = Math.round(area / 1500 * G.snowAmt);
  while (FX.snow.length < ns) FX.snow.push({ x: rr(0, vw), y: rr(-vh, vh), v: rr(11, 26), ph: rr(0, 9), s: chance(0.25) ? 2 : 1 });
  if (FX.snow.length > ns) FX.snow.length = ns;
  for (const f of FX.snow) { f.y += f.v * dt; f.x += (Math.sin(G.t * 1.3 + f.ph) * 7 - wind * 0.5) * dt; if (f.y > vh + 3) { f.y = -3; f.x = rr(0, vw + 30); } if (f.x < -4) f.x += vw + 8; }
  // falling leaves / petals (world space, from visible trees)
  const want = S === 'fall' ? 46 + G.gust * 90 + (G.windy ? 40 : 0) : S === 'spring' ? 16 + G.gust * 30 : S === 'summer' && G.windy ? 12 : 0;
  if (FX.drift.length < want && Math.random() < dt * (S === 'fall' ? 16 : 6) * (1 + G.gust * 4)) { const t = visibleTree(); if (t && !t.tree.bare) FX.drift.push({ x: t.wx + t.tree.cx + rr(-1, 1) * t.tree.rad, y: t.wy + rr(-1, 1) * t.tree.rad * 0.6, z: -t.tree.cy + rr(-8, 8), vz: rr(7, 13), ph: rr(0, 9), c: S === 'fall' ? pick(LEAFC) : S === 'spring' ? pick(PETALC) : 0x7ab85a, life: 0, g: 0, big: S === 'fall' && chance(0.6) }); }
  for (const p of FX.drift) { if (p.z > 0) { p.z -= p.vz * dt; p.x += (wind * 0.55 + Math.sin(G.t * 2 + p.ph) * 6) * dt; p.y -= (wind * 0.25 + Math.cos(G.t * 1.7 + p.ph) * 5) * dt; } else { p.z = 0; p.g += dt; if (G.gust > 0.35) { p.x += wind * 0.5 * dt; p.y -= wind * 0.2 * dt; } } }
  FX.drift = FX.drift.filter(p => p.g < 5 && p.x > -20 && p.y > -20);
  // phở steam
  FX.steamT -= dt; if (FX.steamT <= 0) { FX.steamT = 0.16; for (const s of CITY.steam || []) if (G.onScreen(s[0], s[1], 0) && chance(0.5)) FX.drift.push({ x: s[0] + rr(-1.5, 1.5), y: s[1] + rr(-1.5, 1.5), z: 11, vz: -rr(5, 9), ph: rr(0, 9), c: 0xf4f6fa, life: 0, g: 3.6, steam: 1 }); }
  for (const p of FX.drift) if (p.steam) { p.g += dt; p.z += 7 * dt; }
  // wind streaks
  if (G.gust > 0.3 && Math.random() < dt * 14 * G.gust) FX.streaks.push({ x: rr(-40, vw), y: rr(0, vh), t: 0, l: rr(10, 26) });
  for (const s of FX.streaks) { s.t += dt; s.x += 210 * dt; s.y -= 60 * dt; } FX.streaks = FX.streaks.filter(s => s.t < 0.7);
  // butterflies & bees (spring; a few butterflies in summer), fireflies on warm nights
  const bugsOn = (S === 'spring' || S === 'summer') && G.rain < 0.15 && G.hour > 6 && G.hour < 18.5;
  for (let i = 0; i < FX.bugs.length; i++) { const b = FX.bugs[i]; b.on = bugsOn && (S === 'spring' || (b.kind === 'fly' && i < 4)); if (!b.on) { b.home = null; continue; } b.t -= dt; if (!b.home || b.t <= 0 || !G.onScreen(b.home[0], b.home[1], 60)) { const near2 = POI.flowers.filter(f => G.onScreen(f[0], f[1], 20)), t = visibleTree(); b.home = near2.length && chance(0.6) ? pick(near2) : t ? [t.wx + rr(-14, 14), t.wy + rr(-14, 14)] : null; b.t = rr(5, 14); if (b.home && !b.x) { b.x = b.home[0]; b.y = b.home[1]; } } if (!b.home) continue; const sp = b.kind === 'bee' ? 3.4 : 1.5, tx = b.home[0] + Math.sin(G.t * sp + b.ph) * (b.kind === 'bee' ? 5 : 12), ty = b.home[1] + Math.cos(G.t * sp * 0.8 + b.ph * 2) * (b.kind === 'bee' ? 5 : 10); b.x += (tx - b.x) * Math.min(1, dt * 2); b.y += (ty - b.y) * Math.min(1, dt * 2); b.z = (b.kind === 'bee' ? 6 : 9) + Math.sin(G.t * 2.3 + b.ph) * 4; }
  const fliesOn = (S === 'summer' || S === 'spring') && G.lights > 0.7 && G.rain < 0.1;
  for (const f of FX.flies) { f.on = fliesOn; if (!f.on) { f.home = null; continue; } if (!f.home || !G.onScreen(f.home[0], f.home[1], 40)) { const t = visibleTree(); f.home = t ? [t.wx + rr(-20, 20), t.wy + rr(-20, 20)] : null; } if (f.home) { f.x = f.home[0] + Math.sin(G.t * 0.6 + f.ph) * 12; f.y = f.home[1] + Math.cos(G.t * 0.5 + f.ph * 3) * 10; } }
  // flyers
  FX.flyT -= dt; if (FX.flyT <= 0) { FX.flyT = rr(13, 30); spawnFlyer(); }
  for (const f of FX.flyers) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.kind === 'bag') { f.y += Math.sin(f.t * 3) * 14 * dt; } }
  FX.flyers = FX.flyers.filter(f => f.x > -80 && f.x < vw + 80 && f.y > -80 && f.y < vh + 80 && f.t < 60);
  for (const c of FX.clouds) { c.x += dt * 0.006 * c.v * (1 + G.gust * 3); if (c.x > 1.3) { c.x = -0.3; c.y = rr(0, 1); } }
}
function spawnFlyer() {
  const vw = R.vw, vh = R.vh, S = G.season, day = G.hour > 5.5 && G.hour < 19, wet = G.rain > 0.3;
  const k = wpick([['birds', day && !wet ? 4 : 0.3], ['swallow', S === 'spring' && day && !wet ? 3 : 0], ['plane', 1], ['balloon', day && !wet ? 1.2 : 0], ['bag', G.windy || G.gust > 0.3 ? 4 : 0.4], ['gust', S === 'fall' || S === 'winter' ? 2.5 : 0], ['dragon', S === 'summer' && day ? 2 : 0], ['bats', !day ? (EV.cur === 'hw' ? 6 : 1.4) : 0]]);
  const ltr = chance(0.5), y0 = rr(vh * 0.1, vh * 0.7);
  if (k === 'birds' || k === 'bats') { const n = k === 'bats' ? ri(3, 5) : ri(4, 9), vx = (ltr ? 1 : -1) * rr(46, 64), vy = -rr(8, 20); for (let i = 0; i < n; i++) { const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1; FX.flyers.push({ kind: k, x: (ltr ? -20 : vw + 20) - (ltr ? 1 : -1) * row * 9, y: y0 + side * row * 5 + rr(-2, 2), vx, vy, t: rr(0, 1) }); } ticker(k === 'bats' ? 'Mấy con dơi chập choạng bay qua' : pick(['Một đàn chim sẻ vừa bay ngang góc phố', 'Bầy bồ câu lượn một vòng trên mái chợ'])); }
  else if (k === 'swallow') { for (let i = 0; i < 3; i++) FX.flyers.push({ kind: 'swallow', x: ltr ? -20 - i * 22 : vw + 20 + i * 22, y: y0 + i * 9, vx: (ltr ? 1 : -1) * 96, vy: -22, t: i * 0.3 }); ticker('Chim én về — mùa xuân tới rồi'); }
  else if (k === 'plane') { FX.flyers.push({ kind: 'plane', x: ltr ? -60 : vw + 60, y: rr(vh * 0.15, vh * 0.5), vx: (ltr ? 1 : -1) * 30, vy: -9, t: 0, ltr }); ticker('Máy bay cất cánh từ Tân Sơn Nhất'); if (G.onSfx) G.onSfx('plane'); }
  else if (k === 'balloon') { FX.flyers.push({ kind: 'balloon', x: rr(vw * 0.25, vw * 0.75), y: vh + 10, vx: rr(-6, 6), vy: -24, t: 0, c: pick([0xe8505b, 0xf7c93a, 0x4a9ad8, 0xf39abf]) }); ticker('Ai đó vừa tuột tay một quả bóng bay…'); }
  else if (k === 'bag') { FX.flyers.push({ kind: 'bag', x: -10, y: rr(vh * 0.3, vh * 0.8), vx: rr(50, 80), vy: -rr(6, 20), t: 0 }); }
  else if (k === 'gust') { G.gustP = 1; for (let i = 0; i < 26; i++) FX.flyers.push({ kind: 'leafp', x: -rr(0, 120), y: rr(0, vh), vx: rr(90, 160), vy: -rr(10, 40), t: rr(0, 3), c: S === 'winter' ? 0xffffff : pick(LEAFC) }); ticker(S === 'winter' ? 'Một cơn gió lạnh thổi tung bụi tuyết' : 'Gió thu cuốn lá vàng bay ngang phố'); if (G.onSfx) G.onSfx('gust'); }
  else if (k === 'dragon') { for (let i = 0; i < 7; i++) FX.flyers.push({ kind: 'dragon', x: ltr ? -rr(10, 90) : vw + rr(10, 90), y: y0 + rr(-40, 40), vx: (ltr ? 1 : -1) * rr(34, 52), vy: rr(-10, 10), t: rr(0, 3) }); ticker('Chuồn chuồn bay thấp thì mưa…'); }
}
// world-space fx, drawn after the sorted sprites and before the night tint
function drawFxWorld(g) {
  for (const p of FX.drift) { const s = scn(p.x, p.y, p.z); if (p.steam) { g.globalAlpha = Math.max(0, 0.5 - (p.g - 3.6) * 0.45); g.fillStyle = '#f4f6fa'; g.fillRect(s[0] + Math.round(Math.sin(G.t * 3 + p.ph) * 1.5), s[1], 2, 1); g.globalAlpha = 1; continue; } g.globalAlpha = p.g > 4 ? 5 - p.g : 1; g.fillStyle = css(p.c); const fl = p.z > 0 && Math.sin(G.t * 9 + p.ph) > 0; g.fillRect(s[0], s[1], p.big ? 2 : 1, fl || !p.big ? 1 : 2); }
  g.globalAlpha = 1;
  for (const b of FX.bugs) { if (!b.on || !b.home) continue; const s = scn(b.x, b.y, b.z), fl = Math.sin(G.t * (b.kind === 'bee' ? 40 : 14) + b.ph) > 0; if (b.kind === 'bee') { g.fillStyle = '#2a2140'; g.fillRect(s[0], s[1], 2, 1); g.fillStyle = '#f7c93a'; g.fillRect(s[0] + (fl ? 0 : 1), s[1], 1, 1); if (fl) { g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(s[0], s[1] - 1, 2, 1); } } else { g.fillStyle = css(b.c); if (fl) { g.fillRect(s[0] - 1, s[1] - 1, 1, 2); g.fillRect(s[0] + 1, s[1] - 1, 1, 2); } else { g.fillRect(s[0] - 2, s[1], 2, 1); g.fillRect(s[0] + 1, s[1], 2, 1); } g.fillStyle = '#2a2140'; g.fillRect(s[0], s[1], 1, 1); } }
  // kite over the park on breezy days
  const kiteOn = CITY.kite && G.rain < 0.15 && G.hour > 7 && G.hour < 18.5 && (G.windy || G.season === 'summer' || G.season === 'spring');
  FX.kiteA += ((kiteOn ? 1 : 0) - FX.kiteA) * 0.02;
  if (FX.kiteA > 0.03) { const kx = CITY.kite[0] + Math.sin(G.t * 0.5) * 18, ky = CITY.kite[1] + Math.cos(G.t * 0.37) * 10, kz = (70 + Math.sin(G.t * 0.8) * 7) * FX.kiteA, a = scn(CITY.kite[0] - 26, CITY.kite[1] + 30, 12), b = scn(kx, ky, kz); g.fillStyle = 'rgba(250,250,250,.55)'; for (let i = 0; i <= 30; i++) { const t = i / 30; g.fillRect(Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * 6), 1, 1); } g.fillStyle = '#e8505b'; g.fillRect(b[0] - 1, b[1] - 4, 3, 1); g.fillRect(b[0] - 2, b[1] - 3, 5, 2); g.fillRect(b[0] - 1, b[1] - 1, 3, 1); g.fillRect(b[0], b[1], 1, 1); g.fillStyle = '#f7c93a'; g.fillRect(b[0], b[1] - 4, 1, 4); for (let i = 1; i < 5; i++) g.fillRect(b[0] + Math.round(Math.sin(G.t * 4 + i) * 1.5), b[1] + i * 2, 1, 1); }
  // cloud shadows
  if (G.cloud > 0.05) { g.globalAlpha = Math.min(0.3, G.cloud * 0.26); for (const c of FX.clouds) { const w = 180 * c.s * 1.6, h = 90 * c.s * 1.6; g.drawImage(FX.cloudSpr, Math.round(c.x * (R.vw + w) - w), Math.round(c.y * (R.vh + h) - h + c.x * 40), Math.round(w), Math.round(h)); } g.globalAlpha = 1; }
}
function drawFxSky(g) {
  const vw = R.vw;
  for (const f of FX.flyers) { const x = Math.round(f.x), y = Math.round(f.y), up = Math.sin(f.t * 11) > 0;
    if (f.kind === 'birds' || f.kind === 'swallow' || f.kind === 'bats') { g.fillStyle = 'rgba(30,24,50,0.16)'; g.fillRect(x - 2, y + 38, 5, 1); g.fillStyle = f.kind === 'birds' ? '#3a3048' : f.kind === 'bats' ? '#241a33' : '#22304f'; g.fillRect(x, y, 2, 1); if (up) { g.fillRect(x - 2, y - 1, 2, 1); g.fillRect(x + 2, y - 1, 2, 1); } else { g.fillRect(x - 2, y + 1, 2, 1); g.fillRect(x + 2, y + 1, 2, 1); } if (f.kind === 'swallow') { g.fillStyle = '#f4f1e8'; g.fillRect(x, y + 1, 1, 1); } }
    else if (f.kind === 'plane') { const d = f.ltr ? 1 : -1; g.fillStyle = 'rgba(30,24,50,0.13)'; g.fillRect(x - 12, y + 70, 26, 3); g.fillRect(x - 3, y + 64, 6, 14); g.fillStyle = '#f4f4f0'; g.fillRect(x - 11, y, 22, 3); g.fillStyle = '#c9ccd4'; g.fillRect(x - 11, y + 2, 22, 1); g.fillStyle = '#f4f4f0'; g.fillRect(x - 2, y - 5, 5, 13); g.fillRect(x - d * 11, y - 3, 3, 4); g.fillStyle = '#d9534f'; g.fillRect(x - d * 11, y - 3, 3, 1); g.fillStyle = '#4a6a9a'; g.fillRect(x + d * 8, y, 2, 1); }
    else if (f.kind === 'balloon') { g.fillStyle = css(f.c); g.fillRect(x - 2, y - 5, 5, 5); g.fillRect(x - 1, y - 6, 3, 7); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x - 1, y - 4, 1, 2); g.fillStyle = 'rgba(60,50,80,.7)'; for (let i = 0; i < 7; i++) g.fillRect(x + Math.round(Math.sin(f.t * 3 + i * 0.6)), y + 1 + i, 1, 1); }
    else if (f.kind === 'bag') { g.fillStyle = 'rgba(250,250,250,.85)'; g.fillRect(x, y, 3, up ? 3 : 2); g.fillRect(x + 1, y - 1, up ? 1 : 3, 1); }
    else if (f.kind === 'leafp') { g.fillStyle = css(f.c); g.fillRect(x, y + Math.round(Math.sin(f.t * 5) * 3), up ? 2 : 1, up ? 1 : 2); }
    else if (f.kind === 'dragon') { g.fillStyle = '#c0392b'; g.fillRect(x - 2, y, 4, 1); g.fillStyle = 'rgba(255,255,255,.7)'; if (up) g.fillRect(x - 1, y - 1, 3, 1); else g.fillRect(x - 1, y + 1, 3, 1); }
  }
  if (FX.rain.length) { g.fillStyle = 'rgba(214,230,255,0.55)'; for (const d of FX.rain) { const x = Math.round(d.x), y = Math.round(d.y); g.fillRect(x, y, 1, 3); g.fillRect(x - 1, y + 3, 1, Math.max(1, (d.l - 3) | 0)); } g.fillStyle = 'rgba(235,245,255,0.5)'; for (const r of FX.ripples) { const x = Math.round(r.x), y = Math.round(r.y); if (r.t < 0.12) g.fillRect(x, y, 1, 1); else if (r.t < 0.24) g.fillRect(x - 1, y, 3, 1); else { g.fillRect(x - 2, y, 1, 1); g.fillRect(x + 2, y, 1, 1); } } }
  if (FX.snow.length) { g.fillStyle = '#ffffff'; for (const f of FX.snow) g.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s); }
  if (FX.streaks.length) { g.fillStyle = 'rgba(255,255,255,0.4)'; for (const s of FX.streaks) { const n = Math.round(s.l * Math.sin(Math.min(1, s.t / 0.7) * Math.PI)); for (let i = 0; i < n; i++) g.fillRect(Math.round(s.x + i), Math.round(s.y - i * 0.28 + Math.sin(i * 0.4) * 1.2), 1, 1); } }
}
function drawFxLights(g) { g.fillStyle = '#d8ff7a'; for (const f of FX.flies) if (f.on && f.home && Math.sin(G.t * 2.2 + f.ph * 5) > -0.2) { const s = scn(f.x, f.y, 7 + Math.sin(G.t + f.ph) * 4); g.fillRect(s[0], s[1], 1, 1); g.globalAlpha = 0.35; g.fillRect(s[0] - 1, s[1] - 1, 3, 3); g.globalAlpha = 1; } }
