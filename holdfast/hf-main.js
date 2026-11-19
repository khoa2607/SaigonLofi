'use strict';
// ===== Holdfast — boot, loop, camera input, shared Lofi Worlds UI wiring, journal, test hooks =====
// The controls are SaigonLofi's: markup/ids in holdfast/index.html, styling in css/lofi-ui.css, music/volume/YouTube behaviour in js/dock.js.
Object.assign(UI, {
  'title': ['Holdfast — Bên bờ sinh tồn', 'Holdfast — Edge of Survival'],
  'menu.back': ['Lofi Worlds', 'Lofi Worlds'], 'menu.back.t': ['Về sảnh chọn thế giới (Esc)', 'Back to the world gallery (Esc)'],
  'hf.cap': ['Holdfast — Bên bờ sinh tồn', 'Holdfast — Edge of Survival'], 'hf.sub': ['Khu định cư bên khúc sông', 'A settlement in the river bend'],
  'hf.tl': ['Dòng thời gian', 'Timeline'], 'hf.past': ['QUÁ KHỨ', 'PAST'], 'hf.current': ['HIỆN TẠI', 'CURRENT'], 'hf.future': ['TƯƠNG LAI', 'FUTURE'],
  'tl.soon': ['Thời kỳ này đang được vẽ. Hẹn bạn sớm!', 'This age is still being drawn. See you soon!'],
  'hf.danger': ['Nguy hiểm', 'Danger'], 'hf.danger.g': ['Mức nguy hiểm', 'Danger level'], 'd.calm': ['Yên ả', 'Calm'], 'd.standard': ['Tiêu chuẩn', 'Standard'], 'd.grim': ['Khắc nghiệt', 'Grim'],
  'hf.world.lab': ['Âm thế giới', 'World'], 'hf.world.t': ['Tiếng súng, chuông báo động, tiếng búa… tách riêng khỏi nhạc', 'Gunshots, alarm bell, hammering… separate from the music'], 'hf.world.vol': ['Tiếng trong thung lũng', 'Valley sounds'],
  'hf.view.gate': ['Cổng thành', 'Gate'], 'hf.view.gate.t': ['Bay tới cổng thành (phím B)', 'Fly to the gate (key B)'], 'hf.view.back': ['Về thung lũng', 'Back'], 'hf.view.back.t': ['Quay về góc nhìn chính (phím B)', 'Return to the main view (key B)'],
  'hf.journal': ['Nhật ký', 'Journal'], 'hf.journal.show': ['Xem', 'Show'], 'hf.journal.hide': ['Ẩn', 'Hide'], 'hf.journal.empty': ['Chưa có gì đáng ghi lại.', 'Nothing worth writing down yet.'],
  'hf.yesterday': ['hôm qua', 'yesterday'], 'hf.daysago': ['{n} ngày trước', '{n} days ago'], 'hf.hide.msg': ['Bấm phím H hoặc chạm 2 lần để hiện lại bảng', 'Press H or tap twice to show the panel again'],
  'hf.season.busy': ['Đang sang mùa {s}…', 'Changing to {s}…'],
  'st.peace': ['bình yên', 'quiet'], 'st.attack': ['BÁO ĐỘNG', 'ALARM'], 'st.recovery': ['đang khắc phục', 'recovering'],
  'loading': ['đang dựng thung lũng…', 'building the valley…']
});
const LOGT = {
  dawn: ['Bình minh lên trên thung lũng.', 'Dawn breaks over the valley.'],
  'exp.out': ['{n} ra cổng, hướng về {poi}.', '{n} head out toward the {poi}.'], 'exp.ok': ['Đội tìm kiếm trở về từ {poi}, mang theo {loot}.', 'The scavengers are back from the {poi} with {loot}.'],
  'exp.hurt': ['Đội từ {poi} về, có người bị thương — vẫn mang được {loot}.', 'The team made it back from the {poi}, hurt but carrying {loot}.'],
  'exp.dead': ['Đội từ {poi} về thiếu {n} người.', 'The team came back from the {poi} {n} short.'], 'exp.lost': ['Không ai trở về từ {poi}.', 'Nobody came back from the {poi}.'],
  'exp.chased': ['Đội ở {poi} bị phát hiện — rút về cổng!', 'The team at the {poi} was spotted — falling back to the gate!'], rescue: ['Một tổ cứu viện lao ra khỏi cổng.', 'A rescue squad rushes out of the gate.'],
  'arrive.near': ['{n} người lạ đang đi về phía cổng.', '{n} strangers are walking toward the gate.'], arrived: ['{n} người mới được đón vào.', '{n} newcomers were let in.'], 'arrive.lost': ['Nhóm người lạ không đến được cổng.', 'The strangers never reached the gate.'],
  died: ['{n} đã ra đi. Một ngọn nến được thắp ở đài tưởng niệm.', '{n} is gone. A candle is lit at the memorial.'], hurt: ['{n} bị thương và được đưa vào trạm xá.', '{n} was hurt and carried to the infirmary.'], healed: ['{n} đã khỏe lại.', '{n} is back on their feet.'],
  breach: ['Tường bị phá thủng!', 'The wall is breached!'], sealed: ['Lỗ thủng đã được vá lại.', 'The breach is sealed.'], alarm: ['Chuông báo động vang lên.', 'The alarm bell rings.'], clear: ['Đã an toàn. Mọi người bắt đầu dọn dẹp.', 'All clear. Everyone starts cleaning up.'],
  pack: ['Một đàn xác sống áp sát một chòi canh.', 'A pack of infected is closing on a tower.'], major: ['Một đợt tấn công lớn từ nhiều hướng!', 'A major attack from several directions!'], siege: ['Cả bầy từ phố cũ kéo đến. Cuộc vây hãm bắt đầu.', 'The horde from the old town arrives. The siege begins.'],
  wx: ['Thời tiết đổi: {w}.', 'The weather turns: {w}.']
};
const POIN = { gas: ['trạm xăng', 'gas station'], houses: ['dãy nhà bỏ hoang', 'abandoned houses'], collapsed: ['ngôi nhà sập', 'collapsed house'], farm: ['trang trại cũ', 'old farm'], radio: ['đồi ăng-ten', 'radio hill'], ruins: ['phố cũ đổ nát', 'old town ruins'] };
const LOOT = { food: ['đồ hộp', 'canned food'], parts: ['phụ tùng', 'spare parts'], medicine: ['thuốc men', 'medicine'], seeds: ['hạt giống', 'seeds'], radio: ['một chiếc radio', 'a radio'], fuel: ['xăng', 'fuel'] };
const WXN = { clear: 'wx.clear', rain: 'wx.rain', wind: 'wx.wind' };
const li = () => LANG.cur === 'en' ? 1 : 0;
function logText(e) { const tpl = (LOGT[e.k] || [e.k, e.k])[li()]; return tpl.replace(/\{(\w+)\}/g, (m, k) => { let v = e.p[k]; if (k === 'poi') v = (POIN[v] || [v, v])[li()]; if (k === 'loot') v = (LOOT[v] || [v, v])[li()]; if (k === 'w') v = t(WXN[v] || v); return v === undefined ? '' : v; }); }

// ---------------------------------------------------------------- shared music: the gallery's radio when embedded, our own otherwise
const Q = new URLSearchParams(location.search);
const EMBED = Q.get('embed') === '1';
// LW = the Lofi Worlds audio bridge (AU, YTS and their functions). The gallery page exposes window.LW; standalone we build our own from the same modules.
const LOCAL_LW = { AU, YTS, TRACKS, audioInit, audioPlay, audioPause, nextTrack, setVol, ytLoad, ytOff, ytToggle, ytNext, ytVolume, setLang };
let MW = LOCAL_LW; try { if (EMBED && window.parent !== window && window.parent.LW && window.parent.LW.AU) MW = window.parent.LW; } catch (e) { MW = LOCAL_LW; }
window.updateUI = () => { if (HFG.booted) hfUI(); };                // js/yt.js calls this on player state changes (standalone)

// ---------------------------------------------------------------- boot
const $ = id => document.getElementById(id);
const HFG = { running: false, acc: 0, last: 0, speed: 1, ui: 0, cam: null, follow: null, errs: [], booted: false, seasonT: 0, tween: null, gateView: false, tickT: -99, tickFn: null, asleep: false };
window.addEventListener('error', e => HFG.errs.push(String(e.message).slice(0, 200)));
async function hfBoot() {
  applyStatic(); $('loadT').textContent = t('loading');
  const prog = async (f) => { $('loadB').style.width = Math.round(f * 100) + '%'; await new Promise(r => setTimeout(r, 0)); };
  const mobile = Math.min(innerWidth, innerHeight) < 600 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const pop = +(Q.get('pop') || (mobile ? 70 : 120)), seed = +(Q.get('seed') || 7);        // the map seed stays fixed: the street/valley layout is approved
  // the population seed: fixed when asked for (tests, screenshots), otherwise a fresh arbitrary moment of the living world each visit
  const simSeed = Q.get('seed') || Q.get('simseed') ? (+(Q.get('simseed') || Q.get('seed')) * 3 + 1) : ((Date.now() % 1000003) * 2654435761 >>> 0) % 2147483647;
  hfBuildMap(seed); await prog(0.1);
  HS.danger = Q.get('danger') || hfPref('danger', 'standard');
  HS.timeMode = Q.get('time') || hfPref('time', 'auto'); HS.wxMode = Q.get('wx') || hfPref('wx', 'auto');
  HS.autoSeason = Q.get('season') === 'auto' || (!Q.get('season') && !!hfPref('autoSeason', false)); HS.season = SEASONS.includes(Q.get('season')) ? Q.get('season') : hfPref('season', 'summer'); if (!SEASONS.includes(HS.season)) HS.season = 'summer';
  hsInit({ seed: simSeed, pop, hour: Q.get('hour') ? +Q.get('hour') : undefined });   // builds the world AND its already-lived-in state (hsWarmStart)
  HFG.first = hfFirstState();                         // what the very first frame will show (read by tests/holdfast-flow.mjs)
  HS.sound = (k, x, y, v) => haEvent(k, x, y, v); HS.onEvent = e => hfOnEvent(e);
  initIcons(); await prog(0.2);
  HR.cv = $('c'); HR.g = HR.cv.getContext('2d'); HR.lc = mk(4, 4); HR.lg = HR.lc.getContext('2d'); HR.season = HS.season;
  hrBuildStatics(); await prog(0.7);
  HR.zoom = Q.get('zoom') ? +Q.get('zoom') : hfPref('zoom', 0); hrResize();
  const saved = hfPref('cam', null);
  if (Q.get('cam') || !saved) hfCamPreset(Q.get('cam') || 'default'); else { HR.cx = saved[0]; HR.cy = saved[1]; hrClampCam(); }
  // test / screenshot helpers: fast-forward, forced events
  const warp = +(Q.get('warp') || 0);
  if (Q.get('attack')) { hsMajor(+(Q.get('attack')) > 1 ? +Q.get('attack') : 34, 2); }
  if (Q.get('exp')) hsStartExpedition();
  for (let i = 0; i < warp * 10; i++) hsTick(0.1);
  if (Q.get('cam') === 'exp') { const e = HS.exps[0]; if (e && e.team[0]) HFG.follow = e.team[0]; }
  HR.bakeAll = true; hrFrame(1, performance.now()); HR.bakeAll = false;        // the first coherent frame is drawn before anything is revealed
  if (Q.get('warp') || Q.get('test') || Q.get('bench')) $('load').hidden = true;
  await prog(1);
  hfUIBuild(); if (Q.get('clean')) document.body.classList.add('clean');
  $('load').classList.add('done'); if (Q.get('warp') || Q.get('test') || Q.get('bench')) $('load').hidden = true; else setTimeout(() => $('load').hidden = true, 700);
  HFG.booted = true; HFG.last = performance.now(); requestAnimationFrame(hfLoop);
  setInterval(hfIdleBake, 120);
  if (MW.AU.playing) haStart(MW);
  if (Q.get('test')) hfSelfTest(); if (Q.get('bench')) hfBench();
}
// a summary of the world as it is the instant it is built: proof that nobody starts at a shared spawn point
function hfFirstState() {
  const live = HS.people.filter(p => p.alive && p.vis !== false), cell = new Map();
  for (const p of live) { const k = Math.floor(p.x / 24) + ',' + Math.floor(p.y / 24); cell.set(k, (cell.get(k) || 0) + 1); }
  const guards = HS.people.filter(p => p.role === 'guard'), onShiftG = k => guards.filter(p => p.post && p.post.k === k && onShift(p)), gp = tileC(HF.gate.inTile);
  const tg = onShiftG('tower'), out = HS.zombies.filter(z => z.st !== 'dead' && !isInside(z.x, z.y));
  let zx = 0, zy = 0; for (const z of out) { zx += z.x; zy += z.y; } zx /= out.length || 1; zy /= out.length || 1; let zs = 0; for (const z of out) zs += Math.hypot(z.x - zx, z.y - zy);
  const farmers = HS.people.filter(p => p.role === 'farmer'), fishers = HS.people.filter(p => p.role === 'fisher');
  return { t: HS.t, hour: HS.hour, people: live.length, biggestCell: Math.max(0, ...cell.values()), towerGuards: tg.length, towerSeated: tg.filter(p => p.onTower && p.onTower.climb >= 1).length,
    gateGuards: onShiftG('gate').length, gateAtPost: onShiftG('gate').filter(p => Math.hypot(p.x - gp[0], p.y - gp[1]) < 40).length, patrols: onShiftG('patrol').length,
    farmers: farmers.length, farmersWorking: farmers.filter(p => p.task && p.task.k === 'work' && p.task.ph === 'do').length, fishers: fishers.length, fishersWorking: fishers.filter(p => p.task && p.task.k === 'work' && p.task.ph === 'do').length,
    walking: live.filter(p => p.path).length, zombies: out.length, zombiesInside: HS.zombies.filter(z => z.st !== 'dead' && isInside(z.x, z.y)).length, zombieSpread: Math.round(zs / (out.length || 1)),
    wildlife: HS.wild.length, expeditions: HS.exps.map(e => e.ph), logEntries: HS.log.length };
}
// preferences of the world (time, weather, season, danger, view); music preferences are the shared Saigon record, see js/dock.js
function hfPref(k, d) { try { const s = JSON.parse(localStorage.getItem('holdfast') || '{}'); return s[k] === undefined ? d : s[k]; } catch (e) { return d; } }
function hfSave() { try { localStorage.setItem('holdfast', JSON.stringify({ time: HS.timeMode, wx: HS.wxMode, season: HS.season, autoSeason: !!HS.autoSeason, danger: HS.danger, zoom: HR.zoom, cam: [Math.round(HR.cx), Math.round(HR.cy)] })); } catch (e) { } }
const CAMS = { default: [482, 236], gate: [480, 198], settlement: [470, 360], wall: [300, 186], market: [480, 264], commons: [480, 350], ruins: [500, -40], fields: [520, 470], east: [700, 214], west: [240, 214], training: [320, 244], stable: [640, 240], hospital: [610, 306], school: [220, 330], graveyard: [348, 362], farmyard: [226, 404], workshop: [740, 262] };
function hfCamPreset(n) { const c = CAMS[n] || CAMS.default; const [x, y] = d2w(c[0], c[1]); hrCenterOn(x, y); }
function hfCamTo(n) { const c = CAMS[n] || CAMS.default, [x, y] = d2w(c[0], c[1]), p = ISO(x, y); HFG.follow = null; HFG.tween = [p[0], p[1]]; }
function hfToggleGate() { HFG.gateView = !HFG.gateView; hfCamTo(HFG.gateView ? 'gate' : 'default'); if (HFG.gateView) hfTicker(t('hf.view.gate.t'), true); hfUI(); }

// ---------------------------------------------------------------- loop
function hfLoop(now) {
  requestAnimationFrame(hfLoop);
  if (document.hidden || HFG.asleep) { HFG.last = now; return; }             // only the visible world simulates
  const dt = Math.min(0.25, (now - HFG.last) / 1000); HFG.last = now;
  const t0 = performance.now();
  HS.view = { x0: HR.cx - HR.vw / K / 2, y0: HR.cy - HR.vh / K / 2, x1: HR.cx + HR.vw / K / 2, y1: HR.cy + HR.vh / K / 2 };   // the director never spawns infected on screen
  HFG.acc += dt * HFG.speed; let steps = 0;
  while (HFG.acc >= 0.1 && steps < 6) { hsTick(0.1); HFG.acc -= 0.1; steps++; }
  if (steps === 6) HFG.acc = 0;
  if (HS.autoSeason && !_seasonBusy) { HFG.seasonT += dt; if (HFG.seasonT > 150) { HFG.seasonT = 0; HS.season = SEASONS[(SEASONS.indexOf(HS.season) + 1) % 4]; hfUI(); } }
  if (HS.season !== HR.season) hfSeasonChange();
  if (HFG.tween) { const [tx, ty] = HFG.tween; HR.cx += (tx - HR.cx) * 0.09; HR.cy += (ty - HR.cy) * 0.09; hrClampCam(); if (Math.abs(tx - HR.cx) + Math.abs(ty - HR.cy) < 0.6) { HFG.tween = null; hfSave(); } }
  if (HFG.follow && HFG.follow.alive) { const p = ISO(HFG.follow.x, HFG.follow.y); HR.cx += (p[0] - HR.cx) * 0.06; HR.cy += (p[1] - HR.cy) * 0.06; }
  if (HS.dirtyWall || (HR.tick % 20 === 0)) { HS.dirtyWall = false; hrRefreshWalls(); }
  hrFrame(HFG.acc / 0.1, now);
  const ft = performance.now() - t0; HR.ft.push(ft); if (HR.ft.length > 120) HR.ft.shift();
  // device tuning: a slow machine gets fewer roaming infected (never below half), a fast one recovers the full density
  if (HR.tick % 240 === 0 && HR.ft.length >= 120) { const avg = HR.ft.reduce((a, b) => a + b, 0) / HR.ft.length, top = clamp(HS.target / 120, 0.6, 1); if (avg > 14) HS.zScale = Math.max(0.5, HS.zScale - 0.1); else if (avg < 7 && HS.zScale < top) HS.zScale = Math.min(top, HS.zScale + 0.05); }
  if (now - HFG.ui > 250) { HFG.ui = now; hfStatus(); dockUpdate(); dockViz(); }
  haFrame(dt, hfView());
}
// idle-time ground baking: the chunks in a ring around the camera, nearest first, so panning never stalls on a bake
function hfIdleBake() {
  if (document.hidden || HFG.asleep || _seasonBusy) return; const ci0 = Math.floor((HR.cx + HW) / CHU), cj0 = Math.floor(HR.cy / CHU); let best = null, bd = 1e9;
  for (let dj = -2; dj <= 2; dj++) for (let di = -3; di <= 3; di++) { const ci = ci0 + di, cj = cj0 + dj; if (ci < 0 || cj < 0 || ci >= Math.ceil(2 * HW / CHU) || cj >= Math.ceil(HW / CHU) || HR.chunks.has(ci + ',' + cj + ',' + HR.season)) continue; const d = di * di + dj * dj * 2; if (d < bd) { bd = d; best = [ci, cj]; } }
  if (best) hrBakeChunk(best[0], best[1]);
}
function hfView() {   // what the camera sees, for audio beds
  const x0 = HR.cx - HR.vw / K / 2, y0 = HR.cy - HR.vh / K / 2, uw = HR.vw / K, uh = HR.vh / K; let people = 0, zombies = 0, water = 0, river = 0;
  for (const p of HS.people) { const q = ISO(p.x, p.y); if (p.alive && p.vis && q[0] > x0 && q[0] < x0 + uw && q[1] > y0 && q[1] < y0 + uh) people++; }
  for (const z of HS.zombies) { if (z.st === 'dead') continue; const q = ISO(z.x, z.y); if (Math.abs(q[0] - HR.cx) < uw && Math.abs(q[1] - HR.cy) < uh) zombies++; }
  const [cx, cy] = [HR.cy + HR.cx / 2, HR.cy - HR.cx / 2], [u, v] = w2d(cx, cy); water = clamp(1 - Math.abs(u - streamU(v)) / 120, 0, 1); const dd = Math.sqrt(((u - 480) / 445) ** 2 + ((v - 300) / 222) ** 2); river = clamp(1 - Math.abs(dd - 1.06) * 6, 0, 1);
  return { people, zombies, water, river };
}
let _seasonBusy = false;
async function hfSeasonChange() {
  if (_seasonBusy) return; _seasonBusy = true; hfTicker(t('hf.season.busy', { s: t('season.' + HS.season).toLowerCase() }), true);
  await new Promise(r => setTimeout(r, 30));
  HR.season = HS.season; HR.sheets.clear(); HR.shadowsDone = false; hrBuildStatics(); hfSave(); _seasonBusy = false;
}

// ---------------------------------------------------------------- input: drag, wheel, pinch, keys (Saigon's: drag to pan, wheel/+/- zoom, H hide, Space music, R rain, N night, 1-4 seasons, B view, Esc gallery)
let _camSaveT = 0;
function hfInput() {
  const cv = HR.cv; let drag = null, pinch = null;
  const dpr = () => Math.min(window.devicePixelRatio || 1, 3);
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, cx: HR.cx, cy: HR.cy, id: e.pointerId }; cv.setPointerCapture(e.pointerId); cv.classList.add('drag'); HFG.follow = null; HFG.tween = null; haStart(MW); });
  cv.addEventListener('pointermove', e => { if (!drag || pinch || e.pointerId !== drag.id) return; const s = HR.aps * K / dpr(); HR.cx = drag.cx - (e.clientX - drag.x) / s; HR.cy = drag.cy - (e.clientY - drag.y) / s; hrClampCam(); });
  const end = () => { if (drag) { clearTimeout(_camSaveT); _camSaveT = setTimeout(hfSave, 400); } drag = null; cv.classList.remove('drag'); }; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('dblclick', () => document.body.classList.remove('clean'));
  cv.addEventListener('wheel', e => { e.preventDefault(); hfZoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  cv.addEventListener('touchstart', e => { if (e.touches.length === 2) { pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) }; drag = null; } }, { passive: true });
  cv.addEventListener('touchmove', e => { if (pinch && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (d / pinch.d > 1.35) { hfZoom(1); pinch.d = d; } else if (d / pinch.d < 0.74) { hfZoom(-1); pinch.d = d; } } }, { passive: true });
  cv.addEventListener('touchend', e => { if (e.touches.length < 2) pinch = null; });
  window.addEventListener('resize', () => hrResize());
  window.addEventListener('pagehide', hfSave);
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (k === 'escape') hfExit(); else if (k === 'h') document.body.classList.toggle('clean'); else if (k === ' ') { e.preventDefault(); $('play').click(); }
    else if (k === '+' || k === '=') $('zin').click(); else if (k === '-') $('zout').click(); else if (k === 'b') hfToggleGate();
    else if (k === 'r') hfSet('wx', HS.wxMode === 'rain' ? 'clear' : 'rain'); else if (k === 'n') hfSet('time', HS.timeMode === 'night' ? 'auto' : 'night');
    else if (k >= '1' && k <= '4') hfSet('season', SEASONS[+k - 1]);
  });
}
function hfZoom(d) { const old = HR.zoom; HR.zoom += d; hrResize(); if (HR.zoom !== old) hfSave(); }
function hfExit() { hfSave(); if (EMBED) { try { window.parent.postMessage({ hf: 'exit', lang: LANG.cur }, '*'); return; } catch (e) { } } location.href = '../index.html'; }
// the gallery keeps this frame alive while you browse and tells it when it is hidden/visible again: the world resumes where it was
window.addEventListener('message', e => {
  const d = e.data; if (!d || !d.hf) return;
  if (d.hf === 'sleep') { HFG.asleep = true; haSilence(true); hfSave(); }
  else if (d.hf === 'wake') { HFG.asleep = false; HFG.last = performance.now(); HFG.acc = 0; if (d.lang && d.lang !== LANG.cur) setLang(d.lang); hrResize(); haSilence(false); if (MW.AU.playing) haStart(MW); dockSyncSliders(); hfUI(); }
});

// ---------------------------------------------------------------- UI (state -> the shared controls)
const SEGS = { time: ['data-time', () => HS.timeMode], wx: ['data-wx', () => HS.wxMode], season: ['data-season', () => HS.season], danger: ['data-danger', () => HS.danger] };
function hfSet(kind, v) {
  if (kind === 'time') HS.timeMode = v;                                                   // hsTick glides the hour there, like Saigon
  else if (kind === 'wx') { HS.wxMode = v; if (v !== 'auto') HS.weather = v; else HS.next.wx = Math.min(HS.next.wx, HS.t + 20); }
  else if (kind === 'season') { HFG.seasonT = 0; if (v !== HS.season) HS.season = v; }
  else if (kind === 'danger') HS.danger = v;
  hfSave(); hfUI();
}
function hfUI() {
  for (const [k, [attr, cur]] of Object.entries(SEGS)) document.querySelectorAll(`[${attr}]`).forEach(b => b.setAttribute('aria-pressed', b.getAttribute(attr) === cur()));
  $('autoSeason').setAttribute('aria-pressed', !!HS.autoSeason);
  $('wxRainL').textContent = t(HS.season === 'winter' ? 'wx.snow' : 'wx.rain');
  const vb = $('viewRiver'); vb.textContent = t(HFG.gateView ? 'hf.view.back' : 'hf.view.gate'); vb.title = t(HFG.gateView ? 'hf.view.back.t' : 'hf.view.gate.t');
  document.querySelectorAll('#eras [data-tl]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tl === 'current'));
  $('logToggle').textContent = t($('log').hidden ? 'hf.journal.show' : 'hf.journal.hide'); $('logToggle').setAttribute('aria-pressed', !$('log').hidden);
  dockUpdate(); hfStatus();
}
function hfUIBuild() {
  hfInput();
  dockInit(MW, { remoteDoc: MW !== LOCAL_LW ? (() => { try { return window.parent.document; } catch (e) { return null; } })() : null, onPlay: () => haStart(MW), onChange: () => hfUI() });
  document.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { setLang(b.dataset.lang); try { if (MW !== LOCAL_LW && MW.setLang) MW.setLang(b.dataset.lang); } catch (e) { } });
  for (const [kind, [attr]] of Object.entries(SEGS)) document.querySelectorAll(`[${attr}]`).forEach(b => b.onclick = () => hfSet(kind, b.getAttribute(attr)));
  $('autoSeason').onclick = () => { HS.autoSeason = !HS.autoSeason; HFG.seasonT = 0; hfSave(); hfUI(); };
  $('toMenu').onclick = hfExit; $('viewRiver').onclick = hfToggleGate;
  $('zin').onclick = () => hfZoom(1); $('zout').onclick = () => hfZoom(-1);
  $('full').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); };
  $('hide').onclick = () => { document.body.classList.add('clean'); hfTicker(t('hf.hide.msg'), true); };
  $('logToggle').onclick = () => { const l = $('log'); l.hidden = !l.hidden; hfLogUI(); hfUI(); };
  document.querySelectorAll('#eras [aria-disabled="true"]').forEach(b => b.onclick = () => hfTicker(t('tl.soon'), true));
  applyStatic(); hfLogUI(); hfUI();
}
// called by setLang(): re-render every dynamic string in the new language; no world state is touched
function refreshDynamicText() { if (!HFG.booted) return; hfUI(); hfLogUI(); if (typeof ytRender === 'function') ytRender(); const tk = $('ticker'); if (tk && HFG.tickFn) tk.textContent = HFG.tickFn(); }
// status line, same shape as Saigon's: season · time · weather
function hfStatus() {
  const h = HS.hour, hh = String(Math.floor(h)).padStart(2, '0'), mm = String(Math.floor((h % 1) * 60)).padStart(2, '0');
  const wx = t('wx.status.' + (HS.season === 'winter' ? (HS.weather === 'rain' ? 'snow2' : 'snow1') : HS.weather === 'rain' ? 'rain' : HS.weather === 'wind' ? 'wind' : 'clear'));
  const m = HS.mode === 'attack' ? ` · <span class="alarm">⚠ ${t('st.attack')}</span>` : HS.mode === 'recovery' ? ` · ${t('st.recovery')}` : '';
  const html = `${t('season.' + HS.season)} · ${hh}:${mm} · ${wx}${m}`; if (HFG.statusHtml !== html) { HFG.statusHtml = html; $('status').innerHTML = html; }
}
function hfTicker(text, force) { const now = performance.now() / 1000; if (!force && now - HFG.tickT < 5.5) return; HFG.tickT = now; const el = $('ticker'); HFG.tickFn = typeof text === 'function' ? text : () => text; el.textContent = HFG.tickFn(); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
function hfOnEvent(e) { if (!HFG.booted) return; if (!$('log').hidden) hfLogUI(); if (e.bad || e.k === 'exp.ok' || e.k === 'arrived' || e.k === 'rescue') hfTicker(() => logText(e), !!e.bad); }
// journal: a nonsequential list of what recently happened, stamped with the hour and "yesterday"/"N days ago" (never an absolute day number)
function hfLogUI() {
  const ol = $('log'); if (ol.hidden) return; ol.innerHTML = '';
  const items = HS.log.slice(-14).reverse(); if (!items.length) { const l = document.createElement('li'); l.className = 'none'; l.textContent = t('hf.journal.empty'); ol.appendChild(l); return; }
  for (const e of items) { const li2 = document.createElement('li'); if (e.bad) li2.className = 'bad'; const hh = String(Math.floor(e.h)).padStart(2, '0'), mm = String(Math.floor((e.h % 1) * 60)).padStart(2, '0'), d = HS.day - e.day, when = d <= 0 ? '' : (d === 1 ? t('hf.yesterday') : t('hf.daysago', { n: d })) + ' '; const tm2 = document.createElement('span'); tm2.className = 'tm'; tm2.textContent = when + hh + ':' + mm; li2.appendChild(tm2); li2.appendChild(document.createTextNode(logText(e))); ol.appendChild(li2); }
}

// ---------------------------------------------------------------- in-browser checks (?test=1) and render benchmark (?bench=1)
function hfSelfTest() {
  const R = { ok: true, checks: {} }, chk = (k, v, info) => { R.checks[k] = { pass: !!v, info }; if (!v) R.ok = false; };
  try {
    chk('statics', HR.statics.length > 1500, HR.statics.length);
    chk('houses', HF.lots.length >= 55, HF.lots.length);
    const zones = [[480, 100, 'wild'], [480, 190, 'cleared'], [480, 330, 'settle'], [480, 520, 'river'], [480, 470, 'field']];
    chk('zones', zones.every(([u, v]) => { const [x, y] = d2w(u, v); return hrGround(x, y, 'summer') !== 0x2a2630; }));
    const c0 = [HR.cx, HR.cy]; HR.cx += 40; hrClampCam(); chk('pan', HR.cx !== c0[0]); HR.cx = c0[0];
    const z0 = HR.aps; hfZoom(1); const z1 = HR.aps; hfZoom(-1); chk('zoom', z1 === z0 + 1 || z0 === 6, [z0, z1]);
    const a1 = hrAmbient(12), a2 = hrAmbient(23); chk('daynight', a1 !== a2);
    for (const w of ['rain', 'wind', 'clear']) { hfSet('wx', w); hsTick(0.1); hrFrame(1, performance.now()); }
    chk('weather', HS.weather === 'clear'); hfSet('wx', 'auto');
    for (const tm of ['night', 'dusk', 'auto']) { hfSet('time', tm); hrFrame(1, performance.now()); }
    chk('timemodes', HS.timeMode === 'auto');
    chk('people', HS.people.filter(p => p.alive).length >= HS.floor, HS.people.filter(p => p.alive).length);
    chk('noZoutside', HS.zombies.every(z => z.st === 'dead' || !isInside(z.x, z.y) || HF.breaches > 0 || HF.gate.open > 0));
    chk('errors', HFG.errs.length === 0, HFG.errs);
  } catch (e) { R.ok = false; R.exc = String(e.stack || e).slice(0, 400); }
  R.stats = HS.stats; R.fps = hfFps();
  $('hfTest').textContent = JSON.stringify(R); document.title = 'HFTEST ' + (R.ok ? 'PASS' : 'FAIL');
}
function hfFps() { const a = HR.ft.slice().sort((x, y) => x - y); return a.length ? { median: +a[a.length >> 1].toFixed(2), p95: +a[Math.floor(a.length * 0.95)].toFixed(2), n: a.length } : null; }
function hfBench() {
  const N = +(Q.get('frames') || 180), sim = [], ren = [];
  for (let i = 0; i < N; i++) { const t0 = performance.now(); hsTick(0.1); const t1 = performance.now(); hrFrame(0.5, t1); const t2 = performance.now(); sim.push(t1 - t0); ren.push(t2 - t1); if (i % 30 === 0) { HR.cx += 30; hrClampCam(); } }
  const st = a => { a.sort((x, y) => x - y); return { median: +a[a.length >> 1].toFixed(2), p95: +a[Math.floor(a.length * 0.95)].toFixed(2) }; };
  const R = { frames: N, sim: st(sim), render: st(ren), canvas: [HR.vw, HR.vh], aps: HR.aps, people: HS.people.length, zombies: HS.zombies.filter(z => z.st !== 'dead').length, drawn: HR.drawn, statics: HR.statics.length };
  const iv = []; let lt = performance.now(); const t0 = lt;
  const tick = (ts) => { iv.push(ts - lt); lt = ts; if (ts - t0 < 5000) requestAnimationFrame(tick); else { const a = iv.slice(2).sort((x, y) => x - y); R.raf = { frames: a.length, fps: +(1000 / (a.reduce((s, v) => s + v, 0) / a.length)).toFixed(1), medianMs: +a[a.length >> 1].toFixed(1), p95Ms: +a[Math.floor(a.length * 0.95)].toFixed(1), loopJs: hfFps() }; $('hfTest').textContent = JSON.stringify(R); document.title = 'HFBENCH done'; } };
  requestAnimationFrame(tick);
}
window.HFAPI = { HS, HF, HR, HFG, HA, MW, LOCAL_LW, ui: hfUI, gate: hfToggleGate, ticker: hfTicker, set: hfSet, cam: hfCamPreset, zoom: hfZoom, major: hsMajor, exp: hsStartExpedition, exit: hfExit };
hfBoot().catch(e => { HFG.errs.push(String(e.stack || e).slice(0, 300)); const el = $('hfTest'); el.textContent = JSON.stringify({ ok: false, boot: String(e.stack || e).slice(0, 600) }); document.title = 'HFTEST FAIL boot'; $('loadT').textContent = 'Error: ' + e.message; });
