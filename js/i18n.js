'use strict';
// ===== Sài Gòn Lofi — UI language (vi / en). UI chrome only: in-world signs, banners and building names are never translated. =====
// UI = keyed strings [vi, en] for the static markup (data-i18n / data-i18n-attr) and for text updated by main.js.
// MSG = ticker / YouTube-status sentences written in Vietnamese at their call sites; looked up by their Vietnamese text when the language is English.
const LANG_KEY = 'saigonlofi-lang';
const UI = {
  'title': ['Sài Gòn qua năm tháng — lofi', 'Saigon Through the Years — lofi'],
  'canvas': ['Góc phố Sài Gòn đang chuyển động qua các thời kỳ', 'A Saigon street corner moving through the eras'],
  'lang.group': ['Ngôn ngữ giao diện', 'Interface language'],
  'lang.vi': ['Tiếng Việt', 'Vietnamese'], 'lang.en': ['Tiếng Anh', 'English'],
  'era.group': ['Chọn thời kỳ', 'Choose an era'],
  'era.cap': ['Sài Gòn qua năm tháng', 'Saigon Through the Years'],
  'era.0.sub': ['Sài Gòn thập niên 90', 'Saigon in the 1990s'],
  'era.1.sub': ['đầu những năm 2000', 'the early 2000s'],
  'era.2.sub': ['thành phố vươn cao', 'the city grows taller'],
  'era.3.sub': ['Thành phố Hồ Chí Minh hôm nay', 'Ho Chi Minh City today'],
  'era.0.msg': ['199x: xích lô, xe Cub, Dream, xe lam, hàng rong và nón lá', '199x: cyclos, Cub and Dream bikes, xe lam three-wheelers, street vendors and conical hats'],
  'era.1.msg': ['200x: Wave, Dream, taxi Mai Linh – Vinasun, tiệm Internet và điện thoại', '200x: Wave and Dream bikes, Mai Linh and Vinasun taxis, Internet shops and mobile phones'],
  'era.2.msg': ['201x: Bitexco, Vincom, SH, Air Blade, taxi xanh – trắng và shipper', '201x: Bitexco, Vincom, SH and Air Blade scooters, green-and-white taxis and delivery riders'],
  'era.3.msg': ['202x: Landmark 81, Metro số 1, taxi Xanh SM, xe máy điện VinFast, GrabBike', '202x: Landmark 81, Metro Line 1, Xanh SM taxis, VinFast e-scooters, GrabBike'],
  'wx.status.snow2': ['tuyết dày', 'heavy snow'], 'wx.status.snow1': ['tuyết nhẹ', 'light snow'], 'wx.status.rain': ['mưa', 'rain'], 'wx.status.wind': ['gió', 'windy'],
  'wx.status.cloud': ['nhiều mây', 'cloudy'], 'wx.status.hot': ['nắng gắt', 'harsh sun'], 'wx.status.clear': ['trời quang', 'clear sky'],
  'season.spring': ['Xuân', 'Spring'], 'season.summer': ['Hạ', 'Summer'], 'season.fall': ['Thu', 'Autumn'], 'season.winter': ['Đông', 'Winter'],
  'season.group': ['Chọn mùa', 'Choose a season'],
  'hint': ['Bấm để bật nhạc', 'Tap to play music'],
  'play': ['Bật / tắt nhạc', 'Play / pause music'], 'prev': ['Bài trước', 'Previous track'], 'next': ['Bài kế tiếp', 'Next track'],
  'more': ['Mở bảng tuỳ chỉnh', 'Open settings panel'],
  'track.0': ['Cà phê sữa đá', 'Iced Milk Coffee'], 'track.1': ['Mưa Sài Gòn', 'Saigon Rain'], 'track.2': ['Xích lô chiều', 'Cyclo Afternoon'],
  'track.3': ['Hẻm nhỏ', 'Little Alley'], 'track.4': ['Đèn đường khuya', 'Late-Night Streetlights'], 'track.5': ['Sáng chợ Bến Thành', 'Bến Thành Market Morning'],
  'tnum': ['bản {n}/{total}', 'track {n}/{total}'], 'ytTrack': ['playlist YouTube', 'YouTube playlist'],
  'autoSeason': ['Tự đổi', 'Auto'], 'autoSeason.t': ['Tự chuyển mùa sau mỗi 2 phút rưỡi', 'Switch season automatically every 2.5 minutes'],
  'yt.lab': ['YouTube', 'YouTube'], 'yt.ph': ['Dán link playlist YouTube…', 'Paste a YouTube playlist link…'], 'yt.aria': ['Đường dẫn playlist YouTube', 'YouTube playlist URL'],
  'yt.go': ['Phát', 'Play'], 'yt.off': ['Tắt', 'Off'], 'yt.off.t': ['Tắt YouTube, quay về nhạc lofi của game', 'Turn YouTube off and return to the game’s lofi music'],
  'time.lab': ['Giờ', 'Time'], 'time.group': ['Thời gian trong ngày', 'Time of day'],
  'time.auto': ['Tự chạy', 'Auto'], 'time.morning': ['Sáng', 'Morning'], 'time.noon': ['Trưa', 'Noon'], 'time.dusk': ['Chiều tà', 'Dusk'], 'time.night': ['Đêm', 'Night'],
  'wx.lab': ['Thời tiết', 'Weather'], 'wx.group': ['Thời tiết', 'Weather'],
  'wx.auto': ['Tự nhiên', 'Auto'], 'wx.clear': ['Quang', 'Clear'], 'wx.rain': ['Mưa', 'Rain'], 'wx.snow': ['Tuyết dày', 'Heavy snow'], 'wx.wind': ['Gió', 'Wind'],
  'street.lab': ['Âm phố', 'Street'], 'street.on': ['Bật', 'On'], 'street.off': ['Tắt', 'Off'],
  'street.t': ['Tiếng chuông, còi xe, tiếng rao… tách riêng khỏi nhạc', 'Bells, horns, vendor calls… separate from the music'],
  'street.vol': ['Tiếng đường phố', 'Street sounds'],
  'tet': ['Tết', 'Tết'], 'tet.t': ['Hoa mai và đèn lồng (phím T)', 'Mai blossoms and lanterns (key T)'],
  'ev.lab': ['Sự kiện', 'Event'], 'ev.group': ['Sự kiện lễ hội', 'Festival events'],
  'ev.none': ['Thường', 'None'], 'ev.none.t': ['Ngày thường, không trang trí', 'An ordinary day, no decorations'],
  'ev.qk': ['2/9', 'Sep 2'], 'ev.qk.t': ['Quốc khánh 2/9: cờ và pháo hoa, chỉ ban đêm (phím Q)', 'National Day (Sep 2): flags and fireworks, night only (key Q)'],
  'ev.hw': ['Halloween', 'Halloween'], 'ev.hw.t': ['Halloween: hoá trang và bí ngô, chỉ ban đêm (phím O)', 'Halloween: costumes and pumpkins, night only (key O)'],
  'ev.xm': ['Noel', 'Christmas'], 'ev.xm.t': ['Giáng sinh: cây thông và đèn, chỉ ban đêm (phím X)', 'Christmas: a giant tree and lights, night only (key X)'],
  'ev.qk.name': ['đêm Quốc khánh', 'National Day night'], 'ev.hw.name': ['đêm Halloween', 'Halloween night'], 'ev.xm.name': ['đêm Giáng sinh', 'Christmas Eve'],
  'ev.wait': ['{name}: chờ trời tối', '{name}: waiting for dark'],
  'vol.lab': ['Âm lượng', 'Volume'], 'vol.music': ['Nhạc', 'Music'], 'vol.amb': ['Âm nền', 'Ambience'], 'vol.vinyl': ['Đĩa than', 'Vinyl'],
  'view.lab': ['Khung nhìn', 'View'], 'view.river': ['Bến sông', 'Riverfront'], 'view.river.t': ['Bay tới bến sông (phím B)', 'Fly to the riverfront (key B)'],
  'view.back': ['Về phố', 'Back'], 'view.back.t': ['Quay về góc phố (phím B)', 'Return to the street corner (key B)'],
  'zout': ['Thu nhỏ', 'Zoom out'], 'zin': ['Phóng to', 'Zoom in'], 'full': ['Toàn màn hình', 'Fullscreen'], 'hide': ['Ẩn bảng', 'Hide panel'],
  'load.sub': ['đang dựng góc phố…', 'building the street corner…'],
  'yt.default': ['Dán playlist rồi bấm Phát. Nhạc lofi của game vẫn giữ nguyên.', 'Paste a playlist, then press Play. The game’s lofi music stays as it is.'],
};
const MSG = {
  // main.js
  'Bến Bạch Đằng: nước chảy chậm, gió sông mát rượi': 'Bạch Đằng wharf: the water flows slowly, a cool river breeze',
  'Tết đến rồi! Hoa mai nở vàng, đèn lồng đỏ khắp phố': 'Tết is here! Golden mai blossoms and red lanterns all over the street',
  'Hết Tết, phố trở lại nhịp sống thường ngày': 'Tết is over, the street returns to its everyday rhythm',
  'Bấm phím H hoặc chạm 2 lần để hiện lại bảng': 'Press H or double-tap to show the panel again',
  // events.js
  'Đêm Quốc khánh 2/9: cờ đỏ sao vàng rợp phố, pháo hoa rực trời!': 'National Day night: red flags with gold stars everywhere, fireworks light up the sky!',
  'Đêm Halloween: phố đầy ma, phù thủy và bí ngô dễ thương': 'Halloween night: the street is full of cute ghosts, witches and pumpkins',
  'Đêm Giáng sinh: cây thông lớn đã lên đèn, phố lung linh': 'Christmas Eve: the giant tree is lit and the street sparkles',
  'Lễ hội chỉ diễn ra vào ban đêm — đang chờ trời tối…': 'This festival happens at night — waiting for dark…',
  'Trời sáng rồi, lễ hội tạm nghỉ — tối nay lại tiếp tục': 'Morning has come, the festival takes a break — it starts again tonight',
  'Hết lễ, phố trở lại nhịp sống thường ngày': 'The holiday is over, the street returns to its everyday rhythm',
  'Cả nhà ra bờ sông xem pháo hoa mừng Quốc khánh': 'Whole families head to the river to watch the National Day fireworks',
  'Đường phố đông nghịt người, ai cũng cầm cờ đỏ sao vàng': 'The streets are packed, everyone waving a red flag with a gold star',
  'Màn pháo hoa rực rỡ bừng sáng trên sông Sài Gòn': 'A dazzling firework finale bursts over the Saigon River',
  'Cả thành phố reo hò theo từng chùm pháo hoa': 'The whole city cheers with every burst',
  '“Cho kẹo hay bị ghẹo?” — lũ nhóc gõ cửa từng nhà': '“Trick or treat?” — the kids knock on every door',
  'Một bé bí ngô vừa xin được cả túi kẹo': 'A little pumpkin just collected a whole bag of sweets',
  'Một cô phù thủy cưỡi chổi vừa bay ngang trời!': 'A witch on a broomstick just flew across the sky!',
  'Ai cũng dừng lại chụp hình cây thông Noel khổng lồ': 'Everyone stops to take photos of the giant Christmas tree',
  'Ông già Noel đang phát kẹo cho các em nhỏ': 'Santa is handing out sweets to the children',
  'Xuân về: mai nở vàng, bướm ong bay quanh phố': 'Spring is here: golden mai in bloom, butterflies and bees around the street',
  'Hè tới: nắng chang chang, ve kêu râm ran': 'Summer arrives: blazing sun, cicadas buzzing',
  'Thu sang: lá vàng rơi khắp vỉa hè': 'Autumn comes: yellow leaves fall over the pavements',
  'Đông mộng mơ: Sài Gòn có tuyết rơi nhẹ': 'Dreamy winter: light snow falls on Saigon',
  // fx.js
  'Tuyết rơi dày hơn rồi…': 'The snow is falling harder…', 'Mây đen kéo tới, sắp mưa rồi': 'Dark clouds roll in, rain is coming',
  'Gió nổi lên, lá bay khắp phố': 'The wind picks up, leaves swirl down the street', 'Trời quang mây tạnh': 'The sky clears up',
  'Mấy con dơi chập choạng bay qua': 'A few bats flutter by at dusk', 'Một đàn chim sẻ vừa bay ngang góc phố': 'A flock of sparrows flies past the corner',
  'Bầy bồ câu lượn một vòng trên mái chợ': 'Pigeons circle once over the market roof', 'Chim én về — mùa xuân tới rồi': 'The swallows are back — spring has come',
  'Máy bay cất cánh từ Tân Sơn Nhất': 'A plane takes off from Tân Sơn Nhất', 'Ai đó vừa tuột tay một quả bóng bay…': 'Someone just lost hold of a balloon…',
  'Một cơn gió lạnh thổi tung bụi tuyết': 'A cold gust whips up the snow dust', 'Gió thu cuốn lá vàng bay ngang phố': 'An autumn wind sweeps yellow leaves across the street',
  'Chuồn chuồn bay thấp thì mưa…': 'Dragonflies flying low — rain is on the way…',
  // river.js
  'Buýt sông cập bến, khách lên xuống nhẹ nhàng': 'The river bus docks, passengers step on and off', 'Tàu du lịch ghé bến Bạch Đằng đón khách': 'A tour boat stops at Bạch Đằng quay for passengers',
  'Chiếc ghe nhỏ ghé bến đón khách qua sông': 'A small boat pulls in to ferry passengers across the river',
  // sim.js
  'Taxi điện êm ru vừa đón khách': 'An electric taxi quietly picks up a passenger', 'Taxi vừa đón một vị khách': 'A taxi just picked up a passenger',
  'Xích lô thong thả chở khách dạo phố': 'A cyclo takes a passenger for a leisurely ride', 'Thêm một ly cà phê sữa đá, ngồi ngắm phố': 'One more iced milk coffee, watching the street go by',
  'Một tô phở nóng hổi vừa ra lò': 'A steaming bowl of phở just came out', 'Bánh mì Sài Gòn, đặc biệt thơm bơ!': 'Saigon bánh mì, extra buttery and fragrant!',
  'Một ly chè mát lạnh giữa phố': 'A cool glass of chè on the street', 'Cạch! Một lon nước mát lạnh vừa rơi ra từ máy bán nước': 'Clunk! A cold can just dropped out of the vending machine',
  'Hớt tóc vỉa hè: xoẹt xoẹt… đẹp trai rồi đó!': 'Pavement haircut: snip snip… handsome now!',
  'Dưa hấu đỏ ruột, mua về cúng Tết nè!': 'Red-fleshed watermelon, buy one for the Tết altar!', 'Dưa hấu ngày Tết: mong cả năm đỏ may mắn': 'Tết watermelon: wishing a whole year of red luck',
  'Chú ơi, bổ thử trái dưa này coi!': 'Uncle, cut open this melon so we can try it!',
  'Tài xế công nghệ vừa nhận cuốc qua app': 'A ride-hailing driver just accepted a trip on the app', '“Xe ôm hông em?” — một cuốc xe vừa lăn bánh': '“Xe ôm, miss?” — a motorbike taxi ride just rolled off',
  'Xích lô chở khách thong dong qua phố': 'A cyclo carries its passenger calmly down the street', 'Mưa rồi! Bà con bung dù, mặc áo mưa, chạy vô mái hiên': 'Rain! Everyone pops up umbrellas, pulls on ponchos and runs under the awnings',
  // yt.js
  'Đang phát từ YouTube': 'Playing from YouTube', 'Trình duyệt chặn tự phát — bấm ▶ ngay trên khung YouTube': 'The browser blocked autoplay — press ▶ on the YouTube frame',
  'Playlist không hợp lệ hoặc không tồn tại': 'The playlist is invalid or does not exist',
  'YouTube từ chối vì trang mở bằng file:// — hãy chạy qua http://localhost (xem README)': 'YouTube refused because the page was opened from file:// — run it through http://localhost (see README)',
  'Nhiều video liên tiếp không phát được — thử playlist khác': 'Several videos in a row failed to play — try another playlist',
  'Video đã bị xoá hoặc riêng tư — chuyển bài kế': 'The video was removed or is private — skipping to the next one', 'Video không cho phép nhúng — chuyển bài kế': 'The video cannot be embedded — skipping to the next one',
  'Dán đường dẫn playlist YouTube (có “list=…”)': 'Paste a YouTube playlist link (containing “list=…”)', 'Đang tải YouTube…': 'Loading YouTube…',
  'Không tải được YouTube (kiểm tra mạng)': 'Could not load YouTube (check your connection)', 'Đã quay về nhạc lofi của game': 'Back to the game’s lofi music'
};
for (let i = 0; i < 4; i++) MSG[UI['era.' + i + '.msg'][0]] = UI['era.' + i + '.msg'][1];
for (const [k, en] of [['spring', 'spring'], ['summer', 'summer'], ['fall', 'autumn'], ['winter', 'winter']]) MSG['Đang sang mùa ' + UI['season.' + k][0].toLowerCase() + '…'] = 'Changing to ' + en + '…';
// messages with a variable part
const MSG_RX = [[/^Video lỗi \((.+)\) — chuyển bài kế$/, 'Video error ($1) — skipping to the next one']];

const LANG = { cur: 'vi' };
try { const s = localStorage.getItem(LANG_KEY); if (s === 'vi' || s === 'en') LANG.cur = s; } catch (e) { }
function t(key, p) {
  const e = UI[key]; let s = e ? e[LANG.cur === 'en' ? 1 : 0] : key;
  if (p) for (const k in p) s = s.replace('{' + k + '}', p[k]);
  return s;
}
// Vietnamese source sentence -> current language
function tm(vi) {
  if (LANG.cur !== 'en') return vi;
  if (MSG[vi]) return MSG[vi];
  for (const [rx, to] of MSG_RX) if (rx.test(vi)) return vi.replace(rx, to);
  return vi;
}
// static markup: data-i18n="key" (text) and data-i18n-attr="attr:key;attr:key"
function applyStatic() {
  document.documentElement.lang = LANG.cur; document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => el.dataset.i18nAttr.split(';').forEach(pair => { const i = pair.indexOf(':'); el.setAttribute(pair.slice(0, i), t(pair.slice(i + 1))); }));
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === LANG.cur));
}
// switches instantly: re-renders text only, never touches game state. main.js supplies refreshDynamicText().
function setLang(l) {
  if (l !== 'vi' && l !== 'en') return; LANG.cur = l;
  try { localStorage.setItem(LANG_KEY, l); } catch (e) { }
  applyStatic(); if (typeof refreshDynamicText === 'function') refreshDynamicText();
}
if (document.readyState !== 'loading') applyStatic(); else document.addEventListener('DOMContentLoaded', applyStatic);
