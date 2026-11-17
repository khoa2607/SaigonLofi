'use strict';
// ===== Sài Gòn Lofi — optional YouTube playlist music (official IFrame Player API; the player stays visible at 200x200) =====
const YTS = { on: false, player: null, apiP: null, title: '', playing: false, errs: 0, watch: null };
const ytMsg = (t, bad) => { const el = document.getElementById('ytMsg'); if (el) { el.textContent = t; el.classList.toggle('bad', !!bad); } };
// accepts a playlist URL (youtube.com / youtu.be / music.youtube.com with ?list=...) or a bare playlist id
function ytParse(text) {
  text = (text || '').trim(); if (!text) return null;
  const okId = id => /^[A-Za-z0-9_-]{12,64}$/.test(id || '');
  try {
    const u = new URL(/^https?:\/\//i.test(text) ? text : 'https://' + text), host = u.hostname.replace(/^(www|m|music)\./, '');
    if (host !== 'youtube.com' && host !== 'youtu.be' && host !== 'youtube-nocookie.com') return okId(text) && /^(PL|UU|OL|FL|RD)/.test(text) ? { list: text } : null;
    const list = u.searchParams.get('list'); return okId(list) ? { list } : null;
  } catch (e) { return okId(text) && /^(PL|UU|OL|FL|RD)/.test(text) ? { list: text } : null; }
}
function ytApi() {
  return YTS.apiP || (YTS.apiP = new Promise((res, rej) => {
    if (window.YT && window.YT.Player) return res();
    const fail = why => { YTS.apiP = null; rej(new Error(why)); };
    const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { if (prev) prev(); res(); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = () => fail('net'); document.head.appendChild(s);
    setTimeout(() => { if (!(window.YT && window.YT.Player)) fail('timeout'); }, 12000);
  }));
}
function ytState(e) {
  const S = window.YT.PlayerState; clearTimeout(YTS.watch);
  if (e.data === S.PLAYING) { YTS.playing = true; YTS.errs = 0; const d = e.target.getVideoData ? e.target.getVideoData() : null; YTS.title = d && d.title ? d.title : 'YouTube'; ytMsg('Đang phát từ YouTube'); }
  else if (e.data === S.PAUSED || e.data === S.ENDED) YTS.playing = false;
  else if (e.data === S.UNSTARTED || e.data === S.CUED) { YTS.playing = false; YTS.watch = setTimeout(() => { if (YTS.on && !YTS.playing) ytMsg('Trình duyệt chặn tự phát — bấm ▶ ngay trên khung YouTube'); }, 4500); }
  if (typeof updateUI === 'function') updateUI();
}
function ytError(e) {
  const c = e.data;
  if (c === 2) { ytMsg('Playlist không hợp lệ hoặc không tồn tại', true); return; }
  if (c === 153) { ytMsg('YouTube từ chối vì trang mở bằng file:// — hãy chạy qua http://localhost (xem README)', true); return; }
  YTS.errs++;
  if (YTS.errs > 5) { ytMsg('Nhiều video liên tiếp không phát được — thử playlist khác', true); return; }
  ytMsg(c === 100 ? 'Video đã bị xoá hoặc riêng tư — chuyển bài kế' : c === 101 || c === 150 ? 'Video không cho phép nhúng — chuyển bài kế' : 'Video lỗi (' + c + ') — chuyển bài kế', true);
  try { e.target.nextVideo(); } catch (x) { }
}
async function ytLoad(text) {
  const p = ytParse(text);
  if (!p) { ytMsg('Dán đường dẫn playlist YouTube (có “list=…”)', true); return false; }
  ytMsg('Đang tải YouTube…');
  try { await ytApi(); } catch (e) { ytMsg('Không tải được YouTube (kiểm tra mạng)', true); return false; }
  document.getElementById('ytbox').hidden = false; YTS.on = true; YTS.errs = 0; YTS.title = 'YouTube';
  if (typeof audioPlay === 'function' && !AU.playing) audioPlay();      // keeps street ambience; the built-in band stays silent while YTS.on
  const vol = Math.round(AU.vol.music * 100);
  if (YTS.player && YTS.player.loadPlaylist) { YTS.player.loadPlaylist({ list: p.list, listType: 'playlist', index: 0 }); YTS.player.setVolume(vol); }
  else YTS.player = new window.YT.Player('ytplayer', { width: 200, height: 200, playerVars: { listType: 'playlist', list: p.list, playsinline: 1, rel: 0 }, events: { onReady: ev => { ev.target.setVolume(vol); try { ev.target.setLoop(true); ev.target.playVideo(); } catch (x) { } }, onStateChange: ytState, onError: ytError } });
  try { localStorage.setItem('saigonlofi-yt', text.trim()); } catch (e) { }
  if (typeof updateUI === 'function') updateUI();
  return true;
}
function ytToggle() { const p = YTS.player; if (!p || !p.getPlayerState) return; if (YTS.playing) p.pauseVideo(); else p.playVideo(); }
function ytNext(d) { const p = YTS.player; if (!p || !p.nextVideo) return; if (d > 0) p.nextVideo(); else p.previousVideo(); }
function ytVolume(v) { const p = YTS.player; if (p && p.setVolume) p.setVolume(Math.round(v * 100)); }
function ytOff() { YTS.on = false; YTS.playing = false; clearTimeout(YTS.watch); try { if (YTS.player && YTS.player.stopVideo) YTS.player.stopVideo(); } catch (e) { } document.getElementById('ytbox').hidden = true; ytMsg('Đã quay về nhạc lofi của game'); if (typeof updateUI === 'function') updateUI(); }
