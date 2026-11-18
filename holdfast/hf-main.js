'use strict';
// ===== Holdfast — boot, loop, camera input, UI, chronicle, shared music bridge, test hooks =====
Object.assign(UI, {
  'title': ['Holdfast — Bên bờ sinh tồn', 'Holdfast — Edge of Survival'],
  'menu.back': ['Lofi Worlds', 'Lofi Worlds'], 'menu.back.t': ['Về sảnh chọn thế giới (Esc)', 'Back to the world gallery (Esc)'],
  'hf.tag': ['Bên bờ sinh tồn', 'Edge of Survival'], 'hf.tl': ['Dòng thời gian', 'Timeline'], 'hf.past': ['QUÁ KHỨ', 'PAST'], 'hf.current': ['HIỆN TẠI', 'CURRENT'], 'hf.future': ['TƯƠNG LAI', 'FUTURE'], 'hf.soon': ['sắp có', 'soon'],
  'hf.full': ['Toàn màn hình', 'Fullscreen'], 'hf.chron': ['Nhật ký trong ngày', 'Day chronicle'], 'hf.time': ['Thời gian', 'Time'], 'hf.wx': ['Thời tiết', 'Weather'], 'hf.season': ['Mùa', 'Season'], 'hf.danger': ['Mức nguy hiểm', 'Danger'],
  'hf.sound': ['Âm thanh', 'Sound'], 'hf.music': ['Nhạc', 'Music'], 'hf.amb': ['Môi trường', 'Ambient'], 'hf.mute': ['Tắt', 'Mute'], 'hf.unmute': ['Bật', 'Unmute'], 'hf.load': ['Mở', 'Load'], 'hf.view': ['Khung nhìn', 'View'], 'hf.hide': ['Ẩn bảng (H)', 'Hide panel (H)'],
  'hf.hint': ['kéo để nhìn quanh · cuộn để phóng to · Esc về Lofi Worlds', 'drag to look around · wheel to zoom · Esc for Lofi Worlds'],
  't.auto': ['Tự động', 'Auto'], 't.morning': ['Sáng', 'Morning'], 't.noon': ['Trưa', 'Noon'], 't.dusk': ['Chiều tà', 'Dusk'], 't.night': ['Đêm', 'Night'],
  'w.auto': ['Tự động', 'Auto'], 'w.clear': ['Quang', 'Clear'], 'w.rain': ['Mưa', 'Rain'], 'w.wind': ['Gió', 'Wind'],
  's.auto': ['Tự động', 'Auto'], 's.spring': ['Xuân', 'Spring'], 's.summer': ['Hạ', 'Summer'], 's.fall': ['Thu', 'Autumn'], 's.winter': ['Đông', 'Winter'],
  'd.calm': ['Yên ả', 'Calm'], 'd.standard': ['Tiêu chuẩn', 'Standard'], 'd.grim': ['Khắc nghiệt', 'Grim'],
  'st.day': ['Ngày {d}', 'Day {d}'], 'st.peace': ['bình yên', 'quiet'], 'st.attack': ['BÁO ĐỘNG', 'ALARM'], 'st.recovery': ['đang khắc phục', 'recovering'], 'st.pop': ['{n} người', '{n} people'], 'hf.radio': ['radio lofi', 'lofi radio'], 'hf.paused': ['nhạc đang tắt', 'music paused'],
  'tl.soon': ['Thời kỳ này đang được vẽ. Hẹn bạn sớm!', 'This age is still being drawn. See you soon!'],
  'loading': ['đang dựng thung lũng…', 'building the valley…'], 'loading.season': ['đang vẽ lại mùa…', 'repainting the season…']
});
const LOGT = {
  start: ['Một buổi sáng nữa ở Holdfast.', 'Another morning in Holdfast.'], dawn: ['Ngày {d} bắt đầu.', 'Day {d} begins.'],
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
const li = () => LANG.cur === 'en' ? 1 : 0;
function logText(e) { const tpl = (LOGT[e.k] || [e.k, e.k])[li()]; return tpl.replace(/\{(\w+)\}/g, (m, k) => { let v = e.p[k]; if (k === 'poi') v = (POIN[v] || [v, v])[li()]; if (k === 'loot') v = (LOOT[v] || [v, v])[li()]; if (k === 'w') v = t('w.' + v); return v === undefined ? '' : v; }); }

// ---------------------------------------------------------------- shared music: the gallery's radio when embedded, our own otherwise
const Q = new URLSearchParams(location.search);
const EMBED = Q.get('embed') === '1';
// LW = the Lofi Worlds audio bridge (AU, YTS and their functions). The gallery page exposes window.LW; standalone we build our own.
const LOCAL_LW = { AU, YTS, TRACKS, audioInit, audioPlay, audioPause, nextTrack, setVol, ytLoad, ytOff, ytToggle, ytNext, ytVolume, setLang };
let MW = LOCAL_LW; try { if (EMBED && window.parent !== window && window.parent.LW && window.parent.LW.AU) MW = window.parent.LW; } catch (e) { MW = LOCAL_LW; }
const mus = {
  yt: () => { try { return MW.YTS && MW.YTS.on; } catch (e) { return false; } },
  playing: () => mus.yt() ? MW.YTS.playing : MW.AU.playing,
  toggle: () => { if (mus.yt()) MW.ytToggle(); else if (MW.AU.playing) MW.audioPause(); else MW.audioPlay(); haStart(MW); },
  next: d => { if (mus.yt()) MW.ytNext(d); else MW.nextTrack(d); },
  title: () => mus.yt() ? (MW.YTS.title || 'YouTube') : (UI['track.' + MW.AU.track] ? t('track.' + MW.AU.track) : MW.TRACKS[MW.AU.track].name),
  vol: (k, v) => { MW.AU.vol[k] = v; MW.setVol && MW.setVol(); if (k === 'music' && mus.yt()) MW.ytVolume(v); },
};
window.updateUI = () => hfMusicUI();

// ---------------------------------------------------------------- boot
const $ = id => document.getElementById(id);
const HFG = { running: false, acc: 0, last: 0, speed: 1, ui: 0, cam: null, follow: null, errs: [], booted: false };
window.addEventListener('error', e => HFG.errs.push(String(e.message).slice(0, 200)));
async function hfBoot() {
  applyStatic(); $('loadT').textContent = t('loading');
  const prog = async (f) => { $('loadB').style.width = Math.round(f * 100) + '%'; await new Promise(r => setTimeout(r, 0)); };
  const mobile = Math.min(innerWidth, innerHeight) < 600 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const pop = +(Q.get('pop') || (mobile ? 70 : 120)), seed = +(Q.get('seed') || 7);
  hfBuildMap(seed); await prog(0.1);
  HS.danger = Q.get('danger') || hfPref('danger', 'standard');
  hsInit({ seed: seed * 3 + 1, pop, hour: Q.get('hour') ? +Q.get('hour') : 7.5 });
  HS.timeMode = Q.get('time') || hfPref('time', 'auto'); HS.wxMode = Q.get('wx') || hfPref('wx', 'auto'); HS.seasonMode = Q.get('season') || hfPref('season', 'auto');
  if (HS.seasonMode !== 'auto') HS.season = HS.seasonMode; else HS.season = hfPref('lastSeason', 'summer');
  HS.sound = (k, x, y, v) => haEvent(k, x, y, v); HS.onEvent = e => hfOnEvent(e);
  initIcons(); await prog(0.2);
  HR.cv = $('c'); HR.g = HR.cv.getContext('2d'); HR.lc = mk(4, 4); HR.lg = HR.lc.getContext('2d'); HR.season = HS.season;
  hrBuildStatics(); await prog(0.7);
  HR.zoom = Q.get('zoom') ? +Q.get('zoom') : hfPref('zoom', 0); hrResize();
  hfCamPreset(Q.get('cam') || 'default');
  // test / screenshot helpers: fast-forward, forced events
  const warp = +(Q.get('warp') || 0);
  if (Q.get('attack')) { hsMajor(+(Q.get('attack')) > 1 ? +Q.get('attack') : 34, 2); }
  if (Q.get('exp')) hsStartExpedition();
  for (let i = 0; i < warp * 10; i++) hsTick(0.1);
  if (Q.get('cam') === 'exp') { const e = HS.exps[0]; if (e && e.team[0]) HFG.follow = e.team[0]; }
  HR.bakeAll = true; hrFrame(1, performance.now()); HR.bakeAll = false; await prog(1);
  hfUIBuild(); if (Q.get('clean')) document.body.classList.add('clean');
  $('load').classList.add('done'); setTimeout(() => $('load').hidden = true, 700);
  HFG.booted = true; HFG.last = performance.now(); requestAnimationFrame(hfLoop);
  if (MW !== LOCAL_LW && MW.AU.playing) haStart(MW);
  if (Q.get('test')) hfSelfTest(); if (Q.get('bench')) hfBench();
}
function hfPref(k, d) { try { const s = JSON.parse(localStorage.getItem('holdfast') || '{}'); return s[k] === undefined ? d : s[k]; } catch (e) { return d; } }
function hfSave() { try { localStorage.setItem('holdfast', JSON.stringify({ time: HS.timeMode, wx: HS.wxMode, season: HS.seasonMode, lastSeason: HS.season, danger: HS.danger, zoom: HR.zoom })); } catch (e) { } }
const CAMS = { default: [482, 262], gate: [480, 226], settlement: [470, 380], wall: [300, 214], market: [480, 290], commons: [480, 350], ruins: [500, -40], fields: [520, 470], east: [700, 240], west: [240, 240] };
function hfCamPreset(n) { const c = CAMS[n] || CAMS.default; const [x, y] = d2w(c[0], c[1]); hrCenterOn(x, y); }

// ---------------------------------------------------------------- loop
function hfLoop(now) {
  requestAnimationFrame(hfLoop);
  if (document.hidden) { HFG.last = now; return; }             // only the visible world simulates
  const dt = Math.min(0.25, (now - HFG.last) / 1000); HFG.last = now;
  const t0 = performance.now();
  HFG.acc += dt * HFG.speed; let steps = 0;
  while (HFG.acc >= 0.1 && steps < 6) { hsTick(0.1); HFG.acc -= 0.1; steps++; }
  if (steps === 6) HFG.acc = 0;
  if (HS.season !== HR.season) hfSeasonChange();
  if (HFG.follow && HFG.follow.alive) { const p = ISO(HFG.follow.x, HFG.follow.y); HR.cx += (p[0] - HR.cx) * 0.06; HR.cy += (p[1] - HR.cy) * 0.06; }
  if (HS.dirtyWall || (HR.tick % 20 === 0)) { HS.dirtyWall = false; hrRefreshWalls(); }
  hrFrame(HFG.acc / 0.1, now);
  const ft = performance.now() - t0; HR.ft.push(ft); if (HR.ft.length > 120) HR.ft.shift();
  if (now - HFG.ui > 500) { HFG.ui = now; hfStatus(); hfMusicUI(); }
  haFrame(dt, hfView());
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
  if (_seasonBusy) return; _seasonBusy = true; hfToast(t('loading.season'));
  await new Promise(r => setTimeout(r, 30));
  HR.season = HS.season; HR.sheets.clear(); HR.shadowsDone = false; hrBuildStatics(); hfSave(); _seasonBusy = false;
}

// ---------------------------------------------------------------- input: drag, wheel, pinch, keys
function hfInput() {
  const cv = HR.cv; let drag = null, pinch = null;
  const dpr = () => Math.min(window.devicePixelRatio || 1, 3);
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, cx: HR.cx, cy: HR.cy, id: e.pointerId }; cv.setPointerCapture(e.pointerId); cv.classList.add('drag'); HFG.follow = null; haStart(MW); });
  cv.addEventListener('pointermove', e => { if (!drag || pinch || e.pointerId !== drag.id) return; const s = HR.aps * K / dpr(); HR.cx = drag.cx - (e.clientX - drag.x) / s; HR.cy = drag.cy - (e.clientY - drag.y) / s; hrClampCam(); });
  const end = () => { drag = null; cv.classList.remove('drag'); }; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('wheel', e => { e.preventDefault(); hfZoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  cv.addEventListener('touchstart', e => { if (e.touches.length === 2) { pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) }; drag = null; } }, { passive: true });
  cv.addEventListener('touchmove', e => { if (pinch && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (d / pinch.d > 1.35) { hfZoom(1); pinch.d = d; } else if (d / pinch.d < 0.74) { hfZoom(-1); pinch.d = d; } } }, { passive: true });
  cv.addEventListener('touchend', e => { if (e.touches.length < 2) pinch = null; });
  window.addEventListener('resize', () => hrResize());
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key;
    if (k === 'Escape') hfExit(); else if (k === ' ') { e.preventDefault(); mus.toggle(); hfMusicUI(); } else if (k === 'h' || k === 'H') document.body.classList.toggle('hideui');
    else if (k === '+' || k === '=') hfZoom(1); else if (k === '-') hfZoom(-1);
    else if (k === 'r' || k === 'R') hfSet('wx', HS.wxMode === 'rain' ? 'auto' : 'rain'); else if (k === 'n' || k === 'N') hfSet('time', HS.timeMode === 'night' ? 'auto' : 'night');
    else if ('1234'.includes(k)) hfSet('season', SEASONS[+k - 1]);
  });
}
function hfZoom(d) { const old = HR.zoom; HR.zoom += d; hrResize(); if (HR.zoom !== old) hfSave(); }
function hfExit() { if (EMBED) { try { window.parent.postMessage({ hf: 'exit', lang: LANG.cur }, '*'); return; } catch (e) { } } location.href = '../index.html'; }

// ---------------------------------------------------------------- UI
const OPTS = { time: ['auto', 'morning', 'noon', 'dusk', 'night'], wx: ['auto', 'clear', 'rain', 'wind'], season: ['auto', 'spring', 'summer', 'fall', 'winter'], danger: ['calm', 'standard', 'grim'] };
function hfSet(kind, v) {
  if (kind === 'time') { HS.timeMode = v; if (v !== 'auto') HS.hour = FIXED_H[v]; }
  else if (kind === 'wx') { HS.wxMode = v; if (v !== 'auto') HS.weather = v; }
  else if (kind === 'season') { HS.seasonMode = v; if (v !== 'auto') HS.season = v; }
  else if (kind === 'danger') HS.danger = v;
  hfSave(); hfSegs(); hfStatus();
}
function hfSegs() {
  const cur = { time: HS.timeMode, wx: HS.wxMode, season: HS.seasonMode, danger: HS.danger }, pre = { time: 't.', wx: 'w.', season: 's.', danger: 'd.' };
  for (const [kind, id] of [['time', 'sTime'], ['wx', 'sWx'], ['season', 'sSeason'], ['danger', 'sDanger']]) {
    const el = $(id); if (!el.children.length) for (const v of OPTS[kind]) { const b = document.createElement('button'); b.dataset.v = v; b.onclick = () => hfSet(kind, v); el.appendChild(b); }
    for (const b of el.children) { b.textContent = t(pre[kind] + b.dataset.v); b.setAttribute('aria-pressed', b.dataset.v === cur[kind]); }
  }
  document.querySelectorAll('#sLang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === LANG.cur));
}
function hfUIBuild() {
  hfInput(); hfSegs();
  $('mPlay').onclick = () => { mus.toggle(); hfMusicUI(); }; $('mPrev').onclick = () => { mus.next(-1); hfMusicUI(); }; $('mNext').onclick = () => { mus.next(1); hfMusicUI(); };
  $('bMore').onclick = () => { $('panel').hidden = !$('panel').hidden; $('chron').hidden = true; };
  $('bChron').onclick = () => { $('chron').hidden = !$('chron').hidden; $('panel').hidden = true; $('bChron').classList.remove('new'); hfLogUI(); };
  $('bFull').onclick = () => { const d = document; if (!d.fullscreenElement) (d.documentElement.requestFullscreen || (() => { })).call(d.documentElement); else d.exitFullscreen(); };
  $('bBack').onclick = hfExit; $('bHide').onclick = () => document.body.classList.toggle('hideui');
  $('zIn').onclick = () => hfZoom(1); $('zOut').onclick = () => hfZoom(-1);
  $('vMus').value = MW.AU.vol.music; $('vAmb').value = MW.AU.vol.amb;
  $('vMus').oninput = e => mus.vol('music', +e.target.value); $('vAmb').oninput = e => { mus.vol('amb', +e.target.value); $('bMute').textContent = t('hf.mute'); };
  $('bMute').onclick = () => { const v = MW.AU.vol.amb > 0 ? 0 : 0.5; mus.vol('amb', v); $('vAmb').value = v; $('bMute').textContent = t(v ? 'hf.mute' : 'hf.unmute'); haStart(MW); };
  $('ytGo').onclick = async () => { haStart(MW); const ok = await MW.ytLoad($('ytUrl').value); if (MW !== LOCAL_LW) hfToast(ok ? 'YouTube ✓' : t('yt.default')); hfMusicUI(); };
  $('ytOff').onclick = () => { MW.ytOff(); hfMusicUI(); };
  try { $('ytUrl').value = localStorage.getItem('saigonlofi-yt') || ''; } catch (e) { }
  document.querySelectorAll('#sLang button').forEach(b => b.onclick = () => { setLang(b.dataset.lang); hfSegs(); hfLogUI(); hfStatus(); hfMusicUI(); try { if (MW !== LOCAL_LW && MW.setLang) MW.setLang(b.dataset.lang); } catch (e) { } });
  document.querySelectorAll('#tl button[aria-disabled="true"]').forEach(b => b.onclick = () => hfToast(t('tl.soon')));
  applyStatic(); hfLogUI(); hfStatus(); hfMusicUI();
}
function hfStatus() {
  const h = HS.hour, hh = String(Math.floor(h)).padStart(2, '0'), mm = String(Math.floor((h % 1) * 60)).padStart(2, '0'), pop = HS.people.filter(p => p.alive).length;
  const m = HS.mode === 'attack' ? `<span class="alarm">⚠ ${t('st.attack')}</span>` : t('st.' + HS.mode);
  $('status').innerHTML = `${t('st.day', { d: HS.day })} · ${hh}:${mm} · ${t('w.' + HS.weather)} · ${t('s.' + HS.season)} · ${m}`;
}
function hfMusicUI() { if (!HFG.booted) return; const on = mus.playing(); $('mPlay').textContent = on ? '❚❚' : '▶'; $('mTrack').textContent = mus.title(); $('mState').textContent = on ? t('hf.radio') : t('hf.paused'); }
function hfOnEvent(e) { if (!HFG.booted) return; if ($('chron').hidden) $('bChron').classList.add('new'); else hfLogUI(); if (e.bad || e.k === 'exp.ok' || e.k === 'arrived' || e.k === 'rescue') hfToast(logText(e), e.bad); }
function hfLogUI() { const ol = $('log'); ol.innerHTML = ''; for (const e of HS.log.slice(-14).reverse()) { const li2 = document.createElement('li'); if (e.bad) li2.className = 'bad'; const hh = String(Math.floor(e.h)).padStart(2, '0'), mm = String(Math.floor((e.h % 1) * 60)).padStart(2, '0'); li2.innerHTML = `<span class="tm">${t('st.day', { d: e.day })} ${hh}:${mm}</span>`; li2.appendChild(document.createTextNode(logText(e))); ol.appendChild(li2); } }
let _toastT = 0; function hfToast(s, bad) { const el = $('toast'); el.textContent = s; el.classList.toggle('bad', !!bad); el.classList.add('on'); clearTimeout(_toastT); _toastT = setTimeout(() => el.classList.remove('on'), 3600); }

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
  $('hfTest').textContent = JSON.stringify(R); document.title = 'HFBENCH done';
}
window.HFAPI = { HS, HF, HR, set: hfSet, cam: hfCamPreset, zoom: hfZoom, major: hsMajor, exp: hsStartExpedition };
hfBoot().catch(e => { HFG.errs.push(String(e.stack || e).slice(0, 300)); const el = $('hfTest'); el.textContent = JSON.stringify({ ok: false, boot: String(e.stack || e).slice(0, 600) }); document.title = 'HFTEST FAIL boot'; $('loadT').textContent = 'Error: ' + e.message; });
