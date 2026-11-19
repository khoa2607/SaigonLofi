'use strict';
// ===== Lofi Worlds — shared music dock controller =====
// The same behaviour as SaigonLofi's dock (js/main.js initUI/updateUI), for any world that carries the shared dock markup
// (css/lofi-ui.css). Needs these ids in the page: play hint tname tnum viz prev next more panel ytUrl ytGo ytOff ytMsg
// vMusic vAmb vVinyl vStreet streetOn. MW is the audio bridge: the gallery page's window.LW when the world is embedded
// (so one radio plays across Gallery, Saigon and the worlds), otherwise this page's own js/audio.js + js/yt.js.
const DOCK = { MW: null, onPlay: null, onChange: null, vizOk: true };
const dk = id => document.getElementById(id);
const DOCK_KEY = 'saigonlofi';                                      // the same preference record Saigon uses: music prefs follow the listener, not the world

function dockLoadPrefs(MW) {             // volumes, track and street-sound switch, shared with Saigon
  let st = {}; try { st = JSON.parse(localStorage.getItem(DOCK_KEY) || '{}') || {}; } catch (e) { }
  if (st.vol) Object.assign(MW.AU.vol, st.vol);
  if (st.track !== undefined && !MW.AU.playing) MW.AU.track = (st.track | 0) % MW.TRACKS.length;
  if (st.streetOn === false) MW.AU.streetOn = false;
  return st;
}
function dockSavePrefs() {               // read-modify-write: never clobbers Saigon's own fields
  const A = DOCK.MW.AU; let st = {}; try { st = JSON.parse(localStorage.getItem(DOCK_KEY) || '{}') || {}; } catch (e) { }
  st.vol = A.vol; st.track = A.track; st.streetOn = A.streetOn;
  try { localStorage.setItem(DOCK_KEY, JSON.stringify(st)); } catch (e) { }
}
// track name / counter / play state / YouTube status line (the gallery owns the YouTube box when embedded; its status text is mirrored here)
function dockUpdate() {
  const M = DOCK.MW; if (!M) return; const yt = !!(M.YTS && M.YTS.on), A = M.AU;
  dk('tname').textContent = yt ? (M.YTS.title || 'YouTube') : t('track.' + A.track);
  dk('tnum').textContent = yt ? t('ytTrack') : t('tnum', { n: A.track + 1, total: M.TRACKS.length });
  dk('play').classList.toggle('playing', yt ? M.YTS.playing : A.playing);
  dk('streetOn').setAttribute('aria-pressed', A.streetOn); dk('streetOn').textContent = t(A.streetOn ? 'street.on' : 'street.off');
  if (DOCK.remoteDoc) { try { const r = DOCK.remoteDoc.getElementById('ytMsg'), l = dk('ytMsg'); if (r && l) { l.textContent = r.textContent; l.classList.toggle('bad', r.classList.contains('bad')); } } catch (e) { } }
}
function dockViz() {                     // 10-bar level meter, identical to Saigon's drawViz
  const c = dk('viz'), g = c.getContext('2d'), A = DOCK.MW.AU; g.clearRect(0, 0, c.width, c.height); g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--tile').trim() || '#c4583a';
  let a = null; if (A.an && A.playing) { a = new Uint8Array(A.an.frequencyBinCount); A.an.getByteFrequencyData(a); }
  for (let i = 0; i < 10; i++) { const v = a ? a[i + 1] / 255 : 0.06, h = Math.max(1, Math.round(v * 13)); g.fillRect(i * 4, 14 - h, 3, h); }
}
function dockSyncSliders() { const A = DOCK.MW.AU; dk('vStreet').value = A.vol.street * 100; dk('vMusic').value = A.vol.music * 100; dk('vAmb').value = A.vol.amb * 100; dk('vVinyl').value = A.vol.vinyl * 100; }
function dockInit(MW, opts) {
  opts = opts || {}; DOCK.MW = MW; DOCK.onPlay = opts.onPlay || null; DOCK.onChange = opts.onChange || null; DOCK.remoteDoc = opts.remoteDoc || null;
  dockLoadPrefs(MW); dockSyncSliders();
  if (MW.AU.playing || (MW.YTS && MW.YTS.on)) dk('hint').classList.add('gone');                      // music already running (entered from the gallery): no "tap to play" bubble
  const A = MW.AU, ch = () => { dockUpdate(); if (DOCK.onChange) DOCK.onChange(); };
  dk('play').onclick = () => { dk('hint').classList.add('gone'); if (DOCK.onPlay) DOCK.onPlay(); if (MW.YTS.on) { MW.ytToggle(); return; } if (A.playing) MW.audioPause(); else MW.audioPlay(); ch(); };
  dk('prev').onclick = () => { if (MW.YTS.on) MW.ytNext(-1); else MW.nextTrack(-1); ch(); dockSavePrefs(); };
  dk('next').onclick = () => { if (MW.YTS.on) MW.ytNext(1); else MW.nextTrack(1); ch(); dockSavePrefs(); };
  dk('ytGo').onclick = async () => { dk('hint').classList.add('gone'); if (DOCK.onPlay) DOCK.onPlay(); await MW.ytLoad(dk('ytUrl').value); ch(); };
  dk('ytUrl').addEventListener('keydown', e => { if (e.key === 'Enter') dk('ytGo').click(); });
  dk('ytOff').onclick = () => { MW.ytOff(); ch(); };
  try { dk('ytUrl').value = localStorage.getItem('saigonlofi-yt') || ''; } catch (e) { }
  dk('more').onclick = () => { const p = dk('panel'); p.hidden = !p.hidden; dk('more').setAttribute('aria-expanded', !p.hidden); };
  dk('streetOn').onclick = () => { A.streetOn = !A.streetOn; if (MW.setVol) MW.setVol(); ch(); dockSavePrefs(); };
  dk('vStreet').oninput = e => { A.vol.street = e.target.value / 100; if (MW.setVol) MW.setVol(); dockSavePrefs(); };
  for (const [id, k] of [['vMusic', 'music'], ['vAmb', 'amb'], ['vVinyl', 'vinyl']]) dk(id).oninput = e => { A.vol[k] = e.target.value / 100; if (MW.setVol) MW.setVol(); if (k === 'music') MW.ytVolume(A.vol.music); if (DOCK.onPlay && e.target.value > 0) DOCK.onPlay(); dockSavePrefs(); };
  dockUpdate();
}
