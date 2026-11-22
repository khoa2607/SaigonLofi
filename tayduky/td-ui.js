'use strict';
// ===== Tây Du Ký — UI controller =====
// Ports the Holdfast page wiring (dockInit + LOCAL_LW audio bridge, language toggle, view buttons, hide/clean) and adds the
// 15-biome navigator. It never touches the simulation: navigation is a camera move through window.TWNAV (tw-main.js).
(function () {
  const $ = id => document.getElementById(id), Q = new URLSearchParams(location.search);
  const LOCAL_LW = { AU, YTS, TRACKS, audioInit, audioPlay, audioPause, nextTrack, setVol, ytLoad, ytOff, ytToggle, ytNext, ytVolume, setLang };
  const MW = LOCAL_LW;
  // Strings for this world (the shared dictionary is extended, not edited). Track names are relabelled; the lofi engine is shared.
  Object.assign(UI, {
    'title': ['Tây Du Ký — Huyền Thoại Sống', 'Journey to the West — Living Legend'],
    'td.cap': ['Tây Du Ký — Huyền Thoại Sống', 'Journey to the West — Living Legend'],
    'td.nav': ['Chọn vùng đất', 'Choose a place'], 'td.names.lab': ['Địa danh', 'Places'],
    'td.names': ['Hiện tên vùng khi đến nơi', 'Show a name card on arrival'],
    'td.hide.msg': ['Đã ẩn bảng. Nhấn H để hiện lại.', 'Panels hidden. Press H to show them again.'],
    'menu.back': ['Lofi Worlds', 'Lofi Worlds'], 'menu.back.t': ['Về sảnh chọn thế giới (Esc)', 'Back to the world gallery (Esc)'],
    'td.time': ['Giờ', 'Time'],
    'track.0': ['Trà sen buổi sớm', 'Dawn Lotus Tea'], 'track.1': ['Mưa núi Ngũ Hành', 'Rain on the Five Peaks'], 'track.2': ['Mây lành chiều tà', 'Auspicious Clouds at Dusk'],
    'track.3': ['Đường thỉnh kinh', 'The Pilgrim Road'], 'track.4': ['Đèn lồng khuya', 'Midnight Lanterns'], 'track.5': ['Chuông chùa sớm mai', 'Morning Temple Bell']
  });
  // order and hover names (the abbreviation on the button, the full name on hover)
  const ORDER = ['hqs', 'tc', 'btp', 'nhs', 'clt', 'bcl', 'hps', 'btd', 'hds', 'tth', 'lat', 'ntq', 'hvd', 'lhd', 'sdl'];
  const NAME = id => { const b = TWM.biomes[TWM.bi[id]]; return b ? b.title : [id, id]; };
  const L = () => (LANG.cur === 'en' ? 1 : 0);
  const btns = {}, nav = $('nav'), tip = $('navTip');
  for (const id of ORDER) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.biome = id; b.textContent = id.toUpperCase();
    b.insertAdjacentHTML('beforeend', '<i class="dotb"></i>'); b.setAttribute('aria-pressed', 'false');
    b.onclick = () => { TWNAV.go(id); setActive(id); };
    b.addEventListener('pointerenter', () => showTip(b)); b.addEventListener('focus', () => showTip(b));
    b.addEventListener('pointerleave', hideTip); b.addEventListener('blur', hideTip);
    nav.appendChild(b); btns[id] = b;
  }
  function labels() { for (const id of ORDER) { const n = NAME(id)[L()]; btns[id].title = n; btns[id].setAttribute('aria-label', n + ' (' + id.toUpperCase() + ')'); } }
  function showTip(b) {
    const n = NAME(b.dataset.biome); tip.innerHTML = '';
    const a = document.createElement('div'); a.textContent = n[L()]; const s = document.createElement('small'); s.textContent = n[1 - L()]; tip.append(a, s);
    const r = b.getBoundingClientRect(); tip.classList.add('on');
    const w = tip.offsetWidth; tip.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + 'px'; tip.style.top = (r.bottom + 8) + 'px';
  }
  function hideTip() { tip.classList.remove('on'); }
  let active = null;
  function setActive(id) {
    if (id === active) return; active = id;
    for (const k of ORDER) { btns[k].classList.toggle('on', k === id); btns[k].setAttribute('aria-pressed', k === id); if (k === id) btns[k].setAttribute('aria-current', 'true'); else btns[k].removeAttribute('aria-current'); }
    $('eraSub').textContent = id ? NAME(id)[L()] : '—';
  }
  // time of day
  const TIMES = ['auto', 'morning', 'noon', 'dusk', 'night'];
  let tmode = 'auto'; try { const s = localStorage.getItem('tayduky-time'); if (TIMES.includes(s)) tmode = s; } catch (e) { }
  if (TIMES.includes(Q.get('tod'))) tmode = Q.get('tod'); else if (Q.get('tod') === 'day') tmode = 'noon';
  function setTime(m, save) {
    tmode = m; TWNAV.setTime(m); if (save) try { localStorage.setItem('tayduky-time', m); } catch (e) { }
    document.querySelectorAll('[data-time]').forEach(b => b.setAttribute('aria-pressed', b.dataset.time === m)); statusLine();
  }
  function statusLine() { const h = Math.floor(TWR.clock), m = Math.floor((TWR.clock % 1) * 60); $('status').textContent = t('td.time') + ' ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + (tmode === 'auto' ? ' · ' + t('time.auto') : ''); }
  document.querySelectorAll('[data-time]').forEach(b => b.onclick = () => setTime(b.dataset.time, true));
  // dock, language, view
  dockInit(MW, { onPlay: () => { }, onChange: () => { } });
  window.updateUI = () => { try { dockUpdate(); } catch (e) { } };
  document.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => setLang(b.dataset.lang));
  window.refreshDynamicText = () => { labels(); const a = active; active = null; setActive(a); dockUpdate(); statusLine(); };
  $('full').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); };
  $('hide').onclick = () => { document.body.classList.add('clean'); const c = $('card'); c.querySelector('b').textContent = t('td.hide.msg'); c.querySelector('span').textContent = ''; c.style.opacity = 1; setTimeout(() => { c.style.opacity = 0; }, 2600); };
  $('toMenu').onclick = () => { location.href = '../index.html'; };
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '')) return;
    const k = e.key.toLowerCase();
    if (k === 'h') document.body.classList.toggle('clean'); else if (k === 'escape') { if (document.body.classList.contains('clean')) document.body.classList.remove('clean'); else $('toMenu').click(); }
    else if (k === ' ') { e.preventDefault(); $('play').click(); }
  });
  // "busy" dot: a biome whose story loop is running (read-only look at the simulation)
  function busy() { const s = window.TWS; if (!s || !s.biomes) return; for (const id of ORDER) { const B = s.biomes[id]; btns[id].classList.toggle('busy', !!(B && (B.active || B.running))); } }
  window.TWNAV = Object.assign(window.TWNAV || {}, {
    ready() {
      labels(); setTime(tmode, false); applyStatic(); setActive(TWNAV.biomeHere());
      setInterval(() => { if (!TWNAV.moving()) { const b = TWNAV.biomeHere(); if (b && ORDER.includes(b)) setActive(b); } statusLine(); busy(); }, 400);
    }, order: ORDER, active: () => active
  });
  applyStatic();
})();
