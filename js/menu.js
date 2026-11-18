'use strict';
// ===== Lofi Worlds — main menu ("windows at dusk"): world gallery shown before any world boots =====
// The menu lives in the same page as the Saigon world so the lofi radio keeps playing between them.
// A URL with any query (e.g. ?era=2&time=night, used by tests and shared links) or #saigon skips the menu and boots Saigon directly.
const MENU = { open: false, entered: false, T: 2, cvs: [] };
Object.assign(UI, {
  'menu.title': ['Lofi Worlds', 'Lofi Worlds'],
  'menu.h1': ['Hôm nay bạn muốn ở đâu?', 'Where do you want to be today?'],
  'menu.sub': ['Chọn một thế giới nhỏ. Ngồi lại, nghe nhạc, để thời gian trôi chậm.', 'Pick a little world. Sit back, listen, let time slow down.'],
  'menu.cont': ['Tiếp tục', 'Continue'], 'menu.saigon': ['Sài Gòn', 'Saigon'], 'menu.cont.go': ['Vào lại', 'Jump back in'],
  'menu.live': ['Đang mở', 'Open'], 'menu.soon': ['Sắp ra mắt', 'Coming soon'], 'menu.enter': ['Vào thế giới →', 'Enter world →'],
  'menu.soon.tip': ['Đang được vẽ từng pixel. Hẹn bạn sớm thôi.', 'Still being drawn, pixel by pixel. See you soon.'],
  'menu.foot': ['Những thế giới mới sẽ được thắp sáng dần.', 'More worlds light up over time.'],
  'menu.play': ['Bật / tắt nhạc lofi', 'Play / pause the lofi radio'], 'menu.radio': ['lofi radio', 'lofi radio'], 'menu.paused': ['nhạc đang tắt', 'music paused'],
  'menu.back': ['Lofi Worlds', 'Lofi Worlds'], 'menu.back.t': ['Về sảnh chọn thế giới (Esc)', 'Back to the world gallery (Esc)'],
  'w.saigon': ['Sài Gòn qua năm tháng', 'Saigon Through Time'], 'w.saigon.d': ['Bốn thập kỷ, một góc phố: mưa chiều, cà phê và tiếng xe.', 'Four decades, one street corner: rain, coffee and motorbikes.'],
  'w.snow': ['Núi Tuyết', 'Snow Mountain'], 'w.snow.d': ['Cáp treo, nhà gỗ ấm và tuyết rơi chậm.', 'Chairlifts, a warm chalet and slow snow.'],
  'w.wild': ['Thế Giới Hoang Dã', 'Wildlife World'], 'w.wild.d': ['Những khu sinh thái nhỏ, ai cũng có nhà.', 'Tiny habitats where everyone has a home.'],
  'w.clean': ['Thành Phố Xanh Lại', 'Clean-Up World'], 'w.clean.d': ['Robot nhỏ dọn dẹp, cây xanh mọc lại.', 'Little robots tidy up; the green grows back.'],
  'w.ocean': ['Đại Dương', 'Ocean Life'], 'w.ocean.d': ['Ánh sáng xuyên nước, sứa phát quang.', 'Sunbeams through water, glowing jellyfish.'],
  'w.holdfast': ['Holdfast — Bên bờ sinh tồn', 'Holdfast — Edge of Survival'], 'w.holdfast.d': ['Một khu định cư có tường bao, sống sót giữa đại dịch xác sống.', 'A walled settlement holding out through the zombie years.'],
  'w.fall': ['Sau Cơn Sụp Đổ', 'After The Fall'], 'w.fall.d': ['Một vùng an toàn, đống lửa và dây đèn.', 'A safe zone, a campfire and string lights.']
});
const WORLDS = [{ id: 'saigon', live: true }, { id: 'snow' }, { id: 'wild' }, { id: 'clean' }, { id: 'ocean' }, { id: 'holdfast', live: true }];

// ---------------------------------------------------------------- pixel-art thumbnails: 96x96 postcards, shared palette, light from the left
const MS = 96, MINK = '#2b1a16', BAY4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const mh = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const P = (g, x, y, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, 1, 1); }, Rc = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
const Sky = (g, y0, y1, st) => { for (let y = y0; y < y1; y++) for (let x = 0; x < MS; x++) { const t = (y - y0) / (y1 - y0) * (st.length - 1), i = Math.min(st.length - 2, Math.floor(t)), f = t - i; P(g, x, y, f * 16 > BAY4[(y & 3) * 4 + (x & 3)] ? st[i + 1] : st[i]); } };
const El = (g, cx, cy, rx, ry, c) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) P(g, cx + x, cy + y, c); };
const Tri = (g, x0, yb, w, h, c) => { for (let y = 0; y < h; y++) { const hw = (y + 1) / h * w / 2; Rc(g, x0 - hw, yb - h + y, hw * 2, 1, c); } };
const Stars = (g, y1, n, s) => { for (let i = 0; i < n; i++) P(g, mh(i, s) * MS, mh(s, i) * y1, i % 4 ? '#fff2dc' : '#f9b574'); };
const Win = (g, x, y, w, h, lit, s) => { for (let j = 0; j < h; j += 4) for (let i = 0; i < w; i += 3) if (mh(x + i + s, y + j) < lit) Rc(g, x + i, y + j, 1, 2, mh(i, j + s) < 0.3 ? '#fbead0' : '#f2c94c'); };
const SCENES = {
  saigon(g, t) {
    Sky(g, 0, 56, ['#3a2a4a', '#7a4a6a', '#d8806a', '#f9b574']); Stars(g, 20, 10, 3); El(g, 70, 44, 7, 7, '#ffd9a0');
    Rc(g, 14, 18, 5, 40, '#5a3a4e'); Tri(g, 16.5, 18, 6, 9, '#5a3a4e'); Rc(g, 15, 22, 3, 30, '#4a2e40'); P(g, 16, 7, '#f2c94c');
    Rc(g, 28, 30, 22, 28, '#a85a42'); Tri(g, 31, 30, 6, 12, '#8e4636'); Tri(g, 47, 30, 6, 12, '#8e4636'); Rc(g, 29, 30, 4, 28, '#95523e'); Rc(g, 45, 30, 4, 28, '#95523e'); El(g, 39, 38, 2, 2, '#f2c94c'); Rc(g, 37, 48, 4, 10, '#3a221c'); for (let y = 34; y < 54; y += 5) { P(g, 31, y, '#f2c94c'); P(g, 47, y, '#f2c94c'); }
    const shop = (x, w, h, c, roof) => { Rc(g, x, 58 - h, w, h, c); Rc(g, x - 1, 58 - h - 2, w + 2, 2, roof); Win(g, x + 1, 58 - h + 2, w - 2, h - 8, 0.55, x); Rc(g, x, 54, w, 4, '#3a2a30'); };
    shop(52, 12, 22, '#e8c88a', '#c8734f'); shop(64, 10, 16, '#c9d8b8', '#95523e'); shop(74, 13, 26, '#f2c0b0', '#c8734f'); shop(87, 9, 18, '#e0d0a0', '#95523e');
    for (let x = 53; x < 96; x += 7) { P(g, x, 56, '#e8402e'); P(g, x, 57, '#ff7a4a'); }
    Rc(g, 0, 58, MS, 8, '#5a4c50'); for (let x = 0; x < MS; x += 6) Rc(g, x, 61, 3, 1, '#e8cc84');
    const mx = (t * 18) % 130 - 20; Rc(g, mx, 61, 7, 3, '#c9384c'); Rc(g, mx + 2, 57, 3, 4, '#3a2a30'); P(g, mx + 3, 56, '#f9b574'); for (let i = 1; i < 8; i++) P(g, mx + 7 + i, 62, i < 4 ? '#fff2c0' : '#e8cc84');
    Rc(g, 0, 66, MS, 3, '#d8ccb6'); Sky(g, 69, 96, ['#4f8e8a', '#3e7a7a', '#2c5a62']);
    for (let i = 0; i < 14; i++) Rc(g, (mh(i, 9) * MS + t * 4 * (i % 3 + 1)) % MS, 72 + (mh(9, i) * 22 | 0), 3, 1, '#7ab8b0');
    for (let x = 52; x < 96; x += 3) if (mh(x, 1) < 0.7) Rc(g, x, 70, 1, 3 + (mh(x, 2) * 3 | 0), 'rgba(242,201,76,.55)');
    const bx = 18 + Math.sin(t * 0.6) * 3; Rc(g, bx, 82, 18, 3, '#6e4c3c'); Rc(g, bx + 2, 85, 14, 2, '#4a3028'); Rc(g, bx + 6, 77, 7, 5, '#f4e6cc'); P(g, bx + 8, 79, '#f2c94c');
  },
  snow(g, t) {
    Sky(g, 0, 60, ['#1a2240', '#2a3a64', '#4a5a8a', '#7a7aa8']); Stars(g, 40, 24, 7); El(g, 20, 16, 6, 6, '#eef0f4'); El(g, 22, 15, 5, 5, '#2a3a64');
    for (let x = 0; x < MS; x++) { const h1 = 34 + Math.abs(((x * 1.3) % 40) - 20) * 0.9, h2 = 44 + Math.abs(((x * 1.7 + 13) % 34) - 17) * 0.7; for (let y = h1 | 0; y < 96; y++) P(g, x, y, y < h1 + 4 ? '#eef0f4' : '#8a9ac0'); for (let y = h2 | 0; y < 96; y++) P(g, x, y, y < h2 + 3 ? '#f6f6fa' : '#b8c8e0'); }
    for (let x = 0; x < MS; x++) { const h = 64 + x * 0.22; for (let y = h | 0; y < 96; y++) P(g, x, y, (x + y) % 9 === 0 ? '#dfe6f2' : '#eef0f4'); }
    for (let i = 0; i < 96; i++) P(g, 96 - i, 18 + i * 0.5, '#2a2a3a');
    for (let k = 0; k < 4; k++) { const p = ((t * 6 + k * 26) % 104) - 4, x = 96 - p, y = 18 + p * 0.5; Rc(g, x, y, 1, 4, '#2a2a3a'); Rc(g, x - 2, y + 4, 5, 2, '#c9384c'); }
    Rc(g, 14, 66, 22, 14, '#6e4c3c'); Tri(g, 25, 66, 28, 10, '#f6f6fa'); Rc(g, 19, 70, 4, 4, '#ffd27a'); Rc(g, 28, 70, 4, 4, '#ffd27a'); Rc(g, 23, 74, 4, 6, '#3a2420'); Rc(g, 31, 54, 2, 6, '#5a4a48');
    for (const [x, y, h] of [[6, 84, 14], [44, 82, 12], [52, 88, 16], [80, 90, 13], [90, 86, 10]]) { Tri(g, x, y, 9, h, '#2f5a44'); for (let j = 3; j < h; j += 4) Rc(g, x - (j / h) * 4, y - h + j, (j / h) * 8, 1, '#eef0f4'); }
    for (let i = 0; i < 40; i++) P(g, (mh(i, 3) * MS + Math.sin(t + i) * 2) % MS, (mh(3, i) * MS + t * 8 * (1 + i % 3)) % MS, '#ffffff');
  },
  wild(g, t) {
    Sky(g, 0, 58, ['#f2a070', '#f9c48a', '#fbe0a8']); El(g, 48, 52, 12, 12, '#fff0c0');
    for (let x = 0; x < MS; x++) { const h = 50 + Math.sin(x / 9) * 3; for (let y = h | 0; y < 62; y++) P(g, x, y, '#c08a6a'); }
    Rc(g, 0, 60, MS, 36, '#c4a454'); for (let i = 0; i < 160; i++) Rc(g, mh(i, 5) * MS, 60 + (mh(5, i) * 36 | 0), 1, 2, i % 3 ? '#a8883e' : '#dcc070');
    El(g, 62, 80, 18, 6, '#4f8e8a'); El(g, 62, 79, 15, 4, '#6fb3a8');
    for (const [x, y] of [[56, 74], [64, 73]]) { Rc(g, x, y - 6, 1, 6, '#e87a8a'); Rc(g, x - 1, y - 9, 4, 3, '#f2a0b0'); P(g, x + 3, y - 10, MINK); }
    Rc(g, 18, 34, 3, 26, '#5a3a2a'); El(g, 20, 32, 16, 4, '#3a5a2e'); El(g, 14, 29, 8, 3, '#4a6a34');
    const ex = 22 + Math.sin(t * 0.4); El(g, ex, 66, 9, 6, '#7a7078'); Rc(g, ex - 7, 69, 3, 6, '#6a6068'); Rc(g, ex + 4, 69, 3, 6, '#6a6068'); El(g, ex + 9, 63, 4, 4, '#7a7078'); Rc(g, ex + 12, 64, 2, 9, '#6a6068'); P(g, ex + 10, 62, MINK);
    El(g, ex - 13, 71, 4, 3, '#8a8088'); Rc(g, ex - 16, 73, 2, 3, '#7a7078'); Rc(g, ex - 11, 73, 2, 3, '#7a7078');
    const gx = 84; Rc(g, gx, 56, 6, 5, '#e0a050'); Rc(g, gx + 4, 40, 2, 16, '#e0a050'); Rc(g, gx + 3, 38, 4, 3, '#e0a050'); Rc(g, gx, 61, 1, 9, '#c08040'); Rc(g, gx + 5, 61, 1, 9, '#c08040');
    for (let i = 0; i < 4; i++) { const x = (t * 10 + i * 9) % 110 - 10, y = 18 + i * 3 + Math.sin(t * 3 + i) * 1.5; P(g, x, y, MINK); P(g, x - 1, y - 1, MINK); P(g, x + 1, y - 1, MINK); }
  },
  clean(g, t) {
    Sky(g, 0, 60, ['#8a9aa8', '#c8b8a8', '#f9d0a0']); for (let i = 0; i < 3; i++) for (let y = 0; y < 40; y++) P(g, 70 + i * 6 - y * 0.6, y, 'rgba(255,240,200,.35)');
    Rc(g, 4, 26, 18, 36, '#8a8288'); Rc(g, 22, 34, 12, 28, '#9a9298'); Win(g, 6, 30, 14, 26, 0.15, 2); for (let y = 30; y < 60; y += 4) Rc(g, 23, y, 10, 1, '#7a7278');
    Rc(g, 58, 30, 16, 32, '#e8d0a8'); Rc(g, 74, 22, 18, 40, '#c8e0c0'); Win(g, 60, 34, 12, 24, 0.6, 5); Win(g, 76, 26, 14, 32, 0.6, 9); for (let x = 74; x < 92; x += 3) El(g, x, 22, 2, 2, '#5c9044');
    Rc(g, 0, 62, MS, 34, '#7a7078'); for (let x = 48; x < MS; x++) for (let y = 62; y < 96; y++) if (mh(x, y) < 0.85 - (60 - x) * 0.02) P(g, x, y, mh(y, x) < 0.2 ? '#7ab25a' : '#5c9044');
    for (let i = 0; i < 18; i++) Rc(g, mh(i, 8) * 44, 66 + (mh(8, i) * 26 | 0), 2 + (i % 3), 2, i % 2 ? '#5a5258' : '#a89a8a');
    for (const [x, y] of [[54, 74], [70, 84], [86, 70]]) { Rc(g, x, y - 4, 1, 4, '#5c9044'); P(g, x - 1, y - 5, '#8ac86a'); P(g, x + 1, y - 5, '#8ac86a'); }
    const robot = (x, y, c, k) => { const b = Math.sin(t * 4 + k) > 0 ? 0 : -1; Rc(g, x, y + b, 7, 6, c); Rc(g, x + 1, y + 1 + b, 5, 2, '#24303a'); P(g, x + 2, y + 2 + b, '#7aff9a'); P(g, x + 4, y + 2 + b, '#7aff9a'); Rc(g, x + 3, y - 2 + b, 1, 2, '#5a5a62'); P(g, x + 3, y - 3 + b, '#ffd27a'); Rc(g, x + 1, y + 6, 2, 2, '#3a3a42'); Rc(g, x + 4, y + 6, 2, 2, '#3a3a42'); };
    robot(26, 72, '#f2c94c', 0); robot(44, 80, '#6fb3a8', 1); Rc(g, 52, 82, 5, 4, '#95523e'); robot(12, 84, '#e8a0a0', 2);
  },
  ocean(g, t) {
    Sky(g, 0, 96, ['#4fa8b8', '#2f7a92', '#1e4e6e', '#142a48']);
    for (let i = 0; i < 4; i++) for (let y = 0; y < 70; y++) { const x = 12 + i * 22 + y * 0.35 + Math.sin(t * 0.5 + i) * 2; if (y % 2 || i % 2) P(g, x, y, 'rgba(220,250,255,.18)'); }
    for (let x = 0; x < MS; x++) { const h = 84 + Math.sin(x / 7) * 3; for (let y = h | 0; y < 96; y++) P(g, x, y, (x + y) % 7 ? '#c8a878' : '#a88a5a'); }
    for (const [x, c, h] of [[10, '#e86a7a', 14], [22, '#f2a03a', 10], [70, '#c87ad8', 16], [84, '#e86a7a', 11], [46, '#f2c94c', 8]]) { for (let k = -2; k <= 2; k++) Rc(g, x + k * 2, 86 - h + Math.abs(k) * 3, 1, h - Math.abs(k) * 3, c); El(g, x, 86 - h, 2, 2, c); }
    for (let k = 0; k < 3; k++) { const x = 30 + k * 22, y = 26 + k * 9 + Math.sin(t * 1.4 + k) * 3, c = k === 1 ? '#f7b8e8' : '#b8f0ff'; El(g, x, y, 5, 4, c); for (let i = -3; i <= 3; i += 2) for (let j = 0; j < 7; j++) P(g, x + i + Math.sin(t * 2 + j + i) * 0.6, y + 3 + j, c); El(g, x - 1, y - 1, 2, 1, '#ffffff'); }
    for (let i = 0; i < 12; i++) { const x = (t * 12 + i * 7 + (i % 3) * 3) % 120 - 12, y = 58 + Math.sin(i * 1.7) * 5 + Math.sin(t * 2 + i); Rc(g, x, y, 3, 1, '#f2c94c'); P(g, x - 1, y, '#e08a2c'); }
    const tx = 60 + Math.sin(t * 0.4) * 6, ty = 46; El(g, tx, ty, 8, 5, '#5a8a4a'); El(g, tx, ty - 1, 6, 3, '#7aa85a'); El(g, tx + 9, ty, 3, 2, '#8ab86a'); Rc(g, tx - 6, ty + 4, 4, 2, '#7aa85a'); Rc(g, tx + 3, ty + 4, 4, 2, '#7aa85a'); P(g, tx + 10, ty - 1, MINK);
  },
  fall(g, t) {
    Sky(g, 0, 60, ['#2a2236', '#5a3a4e', '#a85a5a', '#d8865a']); Stars(g, 24, 8, 11);
    for (const [x, w, h, b] of [[2, 12, 30, 1], [16, 10, 40, 0], [28, 14, 24, 1], [70, 12, 34, 1], [84, 12, 28, 0]]) { Rc(g, x, 58 - h, w, h, '#3a2a3a'); if (b) for (let k = 0; k < 4; k++) Rc(g, x + k * 3, 58 - h - (k % 2) * 2, 2, 2, '#3a2a3a'); Win(g, x + 1, 60 - h, w - 2, h - 6, 0.06, x); }
    Rc(g, 0, 58, MS, 38, '#4a3a3a'); for (let i = 0; i < 60; i++) P(g, mh(i, 2) * MS, 60 + mh(2, i) * 36, '#5a4848');
    Rc(g, 4, 66, 26, 10, '#6a4e3a'); for (let x = 4; x < 30; x += 5) Rc(g, x, 66, 1, 10, '#4a3428'); Rc(g, 8, 60, 14, 6, '#7a5a42');
    Rc(g, 66, 64, 26, 9, '#5a6a7a'); Rc(g, 71, 59, 14, 5, '#4a5a6a'); Rc(g, 72, 60, 5, 3, '#2a3440'); El(g, 70, 73, 3, 3, '#2a2a30'); El(g, 87, 73, 3, 3, '#2a2a30');
    Tri(g, 50, 74, 18, 12, '#6f8a5a'); Rc(g, 48, 68, 3, 6, '#2a2a20');
    for (let i = 0; i < 40; i++) { const x = 6 + i * 2.2, y = 50 + Math.sin(i / 40 * Math.PI) * 6; P(g, x, y, '#3a2a2a'); if (i % 4 === 0) P(g, x, y + 1, '#ffd27a'); }
    El(g, 38, 84, 5, 2, '#3a2a28'); Tri(g, 38, 84, 7, 7, '#f08a2c'); Tri(g, 38, 84, 4, 5, '#ffd27a');
    Rc(g, 22, 82, 7, 4, '#a87a5a'); Rc(g, 27, 80, 3, 3, '#a87a5a'); Rc(g, 22, 86, 1, 2, '#8a6044'); Rc(g, 27, 86, 1, 2, '#8a6044');
    for (const [x, c] of [[44, '#3a5a8a'], [33, '#8a3a3a']]) { Rc(g, x, 82, 4, 6, c); El(g, x + 2, 79, 2, 2, '#e8b48a'); Rc(g, x, 77, 4, 1, '#2a2020'); }
  }
};

SCENES.holdfast = SCENES.fall;

// ---------------------------------------------------------------- DOM
const $m = id => document.getElementById(id);
function menuBuild() {
  const root = $m('menu'), gal = $m('mgal');
  WORLDS.forEach(w => {
    const el = document.createElement(w.live ? 'button' : 'div'); el.className = 'mcard ' + (w.live ? 'live' : 'soon'); el.dataset.world = w.id;
    if (!w.live) { el.setAttribute('tabindex', '0'); el.setAttribute('aria-disabled', 'true'); el.setAttribute('role', 'button'); }
    const c = document.createElement('canvas'); c.width = MS; c.height = MS; SCENES[w.id](c.getContext('2d'), 2); MENU.cvs.push([c, w.id, !!w.live]);
    const art = document.createElement('span'); art.className = 'mart'; art.appendChild(c);
    art.insertAdjacentHTML('beforeend', w.live ? '<span class="mbadge live" data-i18n="menu.live"></span><span class="menter" data-i18n="menu.enter"></span>' : '<span class="mbadge soon"><b>☾</b> <span data-i18n="menu.soon"></span></span><span class="mtip" data-i18n="menu.soon.tip"></span>');
    el.appendChild(art); el.insertAdjacentHTML('beforeend', `<span class="mt" data-i18n="w.${w.id}"></span><span class="md" data-i18n="w.${w.id}.d"></span>`);
    if (w.live) el.onclick = () => menuEnter(el); else el.onclick = el.onkeydown = e => { if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); el.classList.add('peek'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('peek'), 2200); };
    gal.appendChild(el);
  });
  // drifting dust
  const d = $m('mdust'), g = d.getContext('2d'); d.width = 320; d.height = 200; MENU.dust = Array.from({ length: 46 }, (_, i) => ({ x: mh(i, 1) * 320, y: mh(1, i) * 200, s: 0.6 + mh(i, 7) * 1.4, c: i % 5 ? 'rgba(251,234,208,.32)' : 'rgba(249,181,116,.7)' }));
  // controls
  $m('mplay').onclick = () => { if (typeof YTS !== 'undefined' && YTS.on) ytToggle(); else if (AU.playing) audioPause(); else audioPlay(); menuMusic(); if (MENU.entered && typeof updateUI === 'function') updateUI(); };
  document.querySelectorAll('#menu [data-mlang]').forEach(b => b.onclick = () => { setLang(b.dataset.mlang); menuText(); });
  $m('mcont').onclick = () => menuEnter(document.querySelector('.mcard.live'));
  menuText(); menuCont(); menuMusic();
}
function menuText() {
  applyStatic(); if (MENU.open) document.title = 'Lofi Worlds';
  document.querySelectorAll('#menu [data-mlang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mlang === LANG.cur));
  menuCont(); menuMusic();
}
// "Continue" chip: only for returning visitors (Saigon saves its own state)
function menuCont() {
  let st = null; try { st = JSON.parse(localStorage.getItem('saigonlofi') || 'null'); } catch (e) { }
  const chip = $m('mcont'); if (!st || st.era === undefined) { chip.hidden = true; return; }
  const era = ['199x', '200x', '201x', '202x'][st.era | 0], ss = st.season ? t('season.' + st.season) : '';
  chip.hidden = false; $m('mcontT').textContent = t('menu.saigon') + ' · ' + era + (ss ? ' · ' + ss : '');
}
function menuMusic() {
  const yt = typeof YTS !== 'undefined' && YTS.on, on = yt ? YTS.playing : AU.playing;
  $m('mplay').classList.toggle('playing', !!on); $m('mbars').classList.toggle('on', !!on);
  $m('mtrack').textContent = yt ? (YTS.title || 'YouTube') : TRACKS[AU.track].name; $m('mstate').textContent = on ? t('menu.radio') : t('menu.paused');
}
function menuShow(byKey) {
  if (!MENU.built) { MENU.built = true; menuBuild(); requestAnimationFrame(menuFrame); }
  MENU.open = true; G.menu = true; document.body.classList.add('menu'); $m('menu').hidden = false; $m('menu').classList.remove('leaving'); document.title = 'Lofi Worlds';
  menuCont(); menuMusic(); const b = document.querySelector('.mcard.live'); if (b && byKey) setTimeout(() => b.focus({ preventScroll: true }), 50);
}
function menuEnter(card) {
  if (!MENU.open) return; MENU.open = false;
  const art = card.querySelector('.mart'), r = art.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, sc = Math.max(vw / r.width, vh / r.height) * 1.08;
  art.style.transform = `translate(${vw / 2 - (r.left + r.width / 2)}px, ${vh / 2 - (r.top + r.height / 2)}px) scale(${sc})`; card.classList.add('zoom');
  if (!AU.playing && !(typeof YTS !== 'undefined' && YTS.on)) { try { audioPlay(); } catch (e) { } }              // entering is a user gesture: start the radio if it was silent
  setTimeout(() => {
    if (card.dataset.world === 'holdfast') { $m('menu').classList.add('leaving'); hfOpen(); setTimeout(() => { $m('menu').hidden = true; art.style.transform = ''; card.classList.remove('zoom'); }, 520); return; }
    $m('menu').classList.add('leaving'); document.body.classList.remove('menu'); G.menu = false; document.title = t('title');
    if (!MENU.entered) { MENU.entered = true; boot().then(() => { if (typeof updateUI === 'function') updateUI(); }); } else if (typeof updateUI === 'function') updateUI();
    setTimeout(() => { $m('menu').hidden = true; art.style.transform = ''; card.classList.remove('zoom'); }, 520);
  }, 560);
}
// animation: only playable worlds move; dust drifts; nothing runs while the world is open
let _mt = 0;
function menuFrame(ts) {
  requestAnimationFrame(menuFrame); if (!MENU.open || document.hidden || ts - _mt < 80) return; _mt = ts; MENU.T += 0.08;
  for (const [c, id, live] of MENU.cvs) if (live) { const g = c.getContext('2d'); g.clearRect(0, 0, MS, MS); SCENES[id](g, MENU.T); }
  const d = $m('mdust'), g = d.getContext('2d'); g.clearRect(0, 0, d.width, d.height); for (const p of MENU.dust) { p.y -= 0.05 * p.s; p.x += Math.sin(MENU.T * 0.3 + p.s * 9) * 0.04; if (p.y < 0) p.y = d.height; g.fillStyle = p.c; g.fillRect(p.x | 0, p.y | 0, 1, 1); }
  if ((MENU.T * 10 | 0) % 5 === 0) menuMusic();
}
// entry: menu first, unless the URL asks for Saigon directly
function menuStart() {
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && MENU.entered && !MENU.open && e.target.tagName !== 'INPUT') menuShow(true); });
  const direct = location.search.length > 1 || location.hash === '#saigon';
  $m('toMenu').onclick = () => menuShow();
  if (direct) { MENU.entered = true; $m('menu').hidden = true; boot(); return; }
  menuShow();
  $m('fade').classList.remove('on');
}

// ---------------------------------------------------------------- Holdfast: a separate world in its own frame, sharing this page's radio
// Only one world simulates at a time: Saigon sleeps (G.menu stays true) while Holdfast is open; closing the frame disposes Holdfast.
window.LW = { AU, YTS, TRACKS, audioInit, audioPlay, audioPause, nextTrack, setVol, ytLoad, ytOff, ytToggle, ytNext, ytVolume, setLang };
function hfOpen() {
  let f = $m('hfFrame'); if (!f) { f = document.createElement('iframe'); f.id = 'hfFrame'; f.title = 'Holdfast'; f.allow = 'autoplay; fullscreen'; f.src = 'holdfast/index.html?embed=1'; document.body.appendChild(f); }
  G.menu = true; document.body.classList.remove('menu'); document.body.classList.add('hfopen'); document.title = t('w.holdfast'); setTimeout(() => { try { f.focus(); } catch (e) { } }, 600);
}
function hfClose(lang) {
  const f = $m('hfFrame'); if (f) f.remove(); document.body.classList.remove('hfopen');
  if (lang && lang !== LANG.cur) setLang(lang);
  menuShow(true);
}
window.addEventListener('message', e => { if (e.data && e.data.hf === 'exit') hfClose(e.data.lang); });
window.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('hfopen')) hfClose(); });
