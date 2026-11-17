'use strict';
// ===== Sài Gòn Lofi — hand-made procedural sprites: icons, people, umbrellas, vehicles, trees, props =====

// ----- speech-bubble icons (8x8) -----
const ICON_PAL = { R: 0xe8505b, r: 0xf79aa0, K: 0x3a3050, B: 0x4a9ad8, b: 0xa6d6f2, Y: 0xf7c93a, O: 0xf08a2b, G: 0x4f9a58, g: 0xa8dc80, P: 0xf39abf, W: 0xf7f4ec, S: 0x9aa3ad, T: 0xd9a55a, t: 0xb5803a, N: 0xf2e2a0, M: 0x8a2f3f, C: 0x6b4226, c: 0xcfe3ea, V: 0x8a5ab8 };
const ICON_SRC = {
  heart: ['.RR.RR..', 'RrRRRRR.', 'RRRRRRR.', 'RRRRRRR.', '.RRRRR..', '..RRR...', '...R....', '........'],
  note: ['...KKKK.', '...K..K.', '...K..K.', '...K..K.', '.KKK.KKK', 'KKKK.KKK', '.KK..KK.', '........'],
  cup: ['..SSSS..', '.SSSSSS.', '..cccc..', '..cCCc..', '..cCCc..', '..cNNc..', '..cccc..', '........'],
  pho: ['..S..S..', '...S..S.', 'BBBBBBBB', 'WNGNNGNW', 'WWWWWWWW', '.WWWWWW.', '..WWWW..', '........'],
  banhmi: ['........', '......TT', '....TTTt', '..TGRTt.', 'TTGRTt..', 'TTTt....', 'Tt......', '........'],
  zzz: ['BBBB....', '..B.....', '.B..BBB.', 'BBBB..B.', '.....B..', '....BBB.', '........', '........'],
  dots: ['........', '........', '........', 'KK.KK.KK', 'KK.KK.KK', '........', '........', '........'],
  sun: ['...Y....', '.Y...Y..', '..YOY...', 'Y.OOO.Y.', '..YOY...', '.Y...Y..', '...Y....', '........'],
  drop: ['...B....', '...B....', '..BBB...', '..BBB...', '.BbBBB..', '.BbBBB..', '..BBB...', '........'],
  flower: ['.PP.PP..', '.PPPPP..', 'PPPYPPP.', '.PPPPP..', '.PP.PP..', '...G....', '...GG...', '...G....'],
  leaf: ['.....OO.', '...OOOO.', '..OOtOO.', '.OOtOO..', '.OtOOO..', '.tOOO...', 't.......', '........'],
  snow: ['...B....', '.B.B.B..', '..BBB...', 'BBBBBBB.', '..BBB...', '.B.B.B..', '...B....', '........'],
  smile: ['..YYYY..', '.YYYYYY.', 'YYKYYKYY', 'YYYYYYYY', 'YKYYYYKY', 'YYKKKKYY', '.YYYYYY.', '..YYYY..'],
  laugh: ['..YYYY..', '.YYYYYY.', 'YKKYYKKY', 'YYYYYYYY', 'YKKKKKKY', 'YYKRRKYY', '.YYKKYY.', '..YYYY..'],
  q: ['..KKK...', '.K...K..', '.....K..', '....K...', '...K....', '........', '...K....', '........'],
  ex: ['...RR...', '...RR...', '...RR...', '...RR...', '...RR...', '........', '...RR...', '........'],
  money: ['........', 'GGGGGGGG', 'GgGGGGgG', 'GGGggGGG', 'GGGggGGG', 'GgGGGGgG', 'GGGGGGGG', '........'],
  moto: ['........', '....S...', '...MS...', '.MMMMM..', 'KKMMMKK.', 'K.K.K.K.', 'KKK.KKK.', '........'],
  taxi: ['...KK...', '..YYYY..', '.YccccY.', 'YYYYYYYY', 'YYYYYYYY', '.KK..KK.', '.KK..KK.', '........'],
  scissors: ['S.....S.', '.S...S..', '..S.S...', '...S....', '..S.S...', '.RR.RR..', '.RR.RR..', '........'],
  star: ['...Y....', '...Y....', 'YYYYYYY.', '.YYYYY..', '..YYY...', '.YY.YY..', '.Y...Y..', '........'],
  boat: ['........', '...K....', '..KKK...', '..KKKK..', 'WWWWWWWW', 'BBBBBBBB', '.BBBBBB.', '........'],
  umb: ['..VVVV..', '.VVVVVV.', 'VVVVVVVV', '...K....', '...K....', '...K.K..', '...KK...', '........'],
  melon: ['........', 'RRRRRRRR', 'RKRRRKRR', '.RRKRRR.', '.gRRRRg.', '..gRRg..', '...GG...', '........'],
  cyclo: ['......K.', '.RR...K.', '.RRR.KK.', 'RRRRSSK.', 'KKSSSKKK', 'K.K..K.K', 'KKK..KKK', '........']
};
const BUB = {};
function initIcons() {
  for (const k in ICON_SRC) {
    const W = 14 * K, H = 14 * K, g = new Int32Array(W * H).fill(-1), paper = 0xfff4e2, pS = 0xf2d8b4;
    for (let y = 1; y < 22; y++) for (let x = 1; x < 25; x++) { const rx = Math.min(x - 1, 24 - x), ry = Math.min(y - 1, 21 - y); if (rx + ry < 3 && rx < 2 && ry < 2) continue; g[y * W + x] = y > 18 ? pS : paper; }
    for (let j = 0; j < 4; j++) for (let x = 5; x < 10 - j; x++) g[(22 + j) * W + x] = pS;
    const src = ICON_SRC[k], ig = new Int32Array(64).fill(-1); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const ch = src[y][x]; if (ch !== '.') ig[y * 8 + x] = grade(ICON_PAL[ch]); }
    const up = scale2x(ig, 8, 8); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (up[y * 16 + x] >= 0) g[(y + 3) * W + x + 5] = up[y * 16 + x];
    BUB[k] = gridCanvas(inkGrid(g, W, H, 1), W, H, null, K).c;
  }
}

// ----- people -----
const PW = 14, PH = 26, NPOSE = 8, PFOOT = 25, PSEAT = 21, PHEAD = 4;   // logical cell; art is drawn at K x   // poses: 0 stand, 1-4 walk, 5 sit, 6 arm up, 7 talk
const SKINS = [0xf4cfa6, 0xeab98c, 0xdba676, 0xc98f60, 0xf7dcbc];
const HAIRS = [0x1d1a24, 0x2b2028, 0x3b2a24, 0x16141a];
const TOPS = [0xf4f1e8, 0x8fc1e3, 0x9fd8b4, 0xd9685c, 0xf2c94c, 0xb79fd8, 0x9a6b4a, 0x3d4f7a, 0xf2a0b5, 0xf08a4b, 0x4fa3a0, 0xe9dcc0, 0x7c8aa0, 0xc94f6a];
const BOTS = [0x2a2a3a, 0x3a4a6b, 0x6b5a4a, 0x8a8f9a, 0x4a5a3a, 0x54463c];
const JACKETS = [0x5a6a8a, 0x7a4a3a, 0x4a6a5a, 0x8a3a3a, 0x3a3a4a, 0xb08a5a, 0x6a5a7a];
const UMBC = [0xd9534f, 0x3d6fb5, 0x2f9f8f, 0xf2c94c, 0x8a5ab8, 0x34303c, 0xf08a4b, 0xf2a0b5];
const PONCHOS = [0x5aa0d8, 0xf2d24a, 0x6fc09a, 0xe88ab0, 0x9aa8e0, 0xe0e4ea];
const PEOPLE_W = [['aodai', 1.1], ['office', 1.4], ['baba', 1], ['dobo', 1], ['youth', 1.7], ['worker', 1], ['oldman', 0.7], ['oldlady', 0.6], ['kid', 0.9], ['dress', 1], ['monk', 0.1]];
function randLook(type) {
  const E = typeof G !== 'undefined' && typeof ERA !== 'undefined' ? ERA[G.era || 0] : null, tet = typeof G !== 'undefined' && G.tet, t = type || wpick(E ? (tet ? E.ped.map(q => [q[0], q[0] === 'aodai' ? q[1] * 2.8 : q[0] === 'kid' ? q[1] * 1.4 : q[1]]) : E.ped) : PEOPLE_W);
  const L = { type: t, skin: pick(SKINS), hair: pick(HAIRS), hs: 0, top: pick(TOPS), bot: pick(BOTS), shoe: pick([0x2a2a30, 0x5a3a2a, 0xe9e6dc, 0x7a4a3a]), kid: false, sleeve: 'short', legs: 'long', dress: 0, hat: 0,
    hatC: pick([0xd9685c, 0x3d4f7a, 0xf4f1e8, 0x4fa3a0, 0xf2c94c]), blush: chance(0.45), umbC: ri(0, UMBC.length - 1), poncho: 0, ponchoC: pick(PONCHOS), rainMode: wpick([['umb', 5], ['poncho', 2.5], ['run', 2.5]]),
    jacket: pick(JACKETS), scarfC: pick([0xd9534f, 0xf2c94c, 0x4fa3a0, 0xf4f1e8, 0x8a5ab8]), r1: Math.random(), r2: Math.random(), r3: Math.random(), fem: false, carry: null };
  if (t === 'aodai') { L.fem = true; L.dress = 2; L.top = tet ? pick([0xd9281e, 0xf2c94c, 0xe8437a, 0xf08a2b]) : chance(0.7) ? 0xf7f5ee : pick([0xb79fd8, 0xf2a0b5, 0x8fc1e3, 0xd9685c]); L.bot = chance(0.75) ? 0xf0ede4 : 0x2a2a3a; L.hs = 1; L.sleeve = 'long'; L.hat = chance(0.3) ? 'non' : 0; L.carry = chance(0.5) ? 'case' : null; L.shoe = 0xe9e6dc; }
  else if (t === 'office') { L.top = pick([0xf4f1e8, 0x8fc1e3, 0xe9dcc0, 0xcfe0f0]); L.bot = pick([0x2a2a3a, 0x3a4a6b, 0x54463c]); L.sleeve = chance(0.5) ? 'long' : 'short'; L.tie = chance(0.4) ? pick([0x8a2f3f, 0x3d4f7a]) : 0; L.carry = chance(0.5) ? 'case' : null; L.hs = pick([0, 0, 6]); L.glasses = chance(0.2); }
  else if (t === 'baba') { L.fem = true; L.top = pick([0x6b4a6a, 0x4a5a7a, 0x8a5a4a, 0x5a7a5a, 0x9a6b4a, 0x3a3a4a]); L.bot = 0x2a2a30; L.sleeve = 'long'; L.hat = chance(0.8) ? 'non' : 0; L.hs = pick([3, 2]); L.carry = chance(0.3) ? 'bag' : null; }
  else if (t === 'dobo') { L.fem = true; L.pattern = pick([0xf7f4ec, 0xf2c94c, 0xf39abf]); L.top = pick([0xc94f6a, 0x4fa3a0, 0x8a5ab8, 0x3d6fb5, 0xd9685c]); L.bot = L.top; L.hs = pick([2, 5, 3]); L.carry = chance(0.4) ? 'bag' : null; }
  else if (t === 'youth') { L.fem = chance(0.4); L.hs = L.fem ? pick([1, 2, 5]) : pick([0, 6, 6]); L.bot = pick([0x3a4a6b, 0x4a5f8a, 0x2a2a3a]); L.legs = chance(0.3) ? 'short' : 'long'; L.hat = chance(0.25) ? 'cap' : 0; L.glasses = chance(0.1); }
  else if (t === 'worker') { L.top = pick([0x6f8250, 0xf4f1e8, 0x7c8aa0, 0x3d4f7a]); L.sleeve = chance(0.4) ? 'none' : 'short'; L.hat = pick(['coi', 'beo', 'cap', 0]); L.hatC = pick([0x6f8250, 0x8a7a5a, 0x3d4f7a]); L.bot = pick([0x4a5a3a, 0x54463c, 0x2a2a3a]); L.skin = pick([0xdba676, 0xc98f60]); }
  else if (t === 'oldman') { L.hair = pick([0xb8b8c0, 0xdcdce0]); L.hs = 4; L.top = pick([0xf4f1e8, 0xe9dcc0, 0xcfd8dc]); L.bot = pick([0x8a8f9a, 0x54463c]); L.hat = chance(0.5) ? 'coi' : 0; L.hatC = 0x6f8250; L.sleeve = 'long'; }
  else if (t === 'oldlady') { L.fem = true; L.hair = pick([0xb8b8c0, 0xdcdce0, 0x6a6a72]); L.hs = 3; L.top = pick([0x6b4a6a, 0x54463c, 0x4a5a7a]); L.bot = 0x2a2a30; L.sleeve = 'long'; L.hat = chance(0.35) ? 'non' : 0; }
  else if (t === 'kid') { L.kid = true; L.fem = chance(0.5); L.top = 0xf7f5ee; L.bot = 0x3a4f8a; L.kq = chance(0.8); L.legs = L.fem ? 'long' : 'short'; L.dress = L.fem ? 1 : 0; L.hs = L.fem ? pick([2, 5]) : 0; L.carry = chance(0.4) ? 'case' : null; }
  else if (t === 'dress') { L.fem = true; L.dress = 1; L.bot = pick([0xc94f6a, 0x3d4f7a, 0xf2c94c, 0x4fa3a0, 0x2a2a3a]); L.hs = pick([1, 5, 2]); L.carry = chance(0.5) ? 'bag' : null; }
  else if (t === 'monk') { L.hs = 7; L.top = pick([0xd98a2b, 0x8a5a2a]); L.dress = 3; L.sleeve = 'long'; L.shoe = 0x7a4a3a; L.rainMode = 'umb'; }
  else if (t === 'modern') { L.fem = chance(0.5); L.hs = L.fem ? pick([1, 2, 5]) : pick([0, 6, 6]); L.top = pick([0xf2f2f0, 0x2f2f38, 0xe8437a, 0x4ab8c8, 0xf2c94c, 0x8a9ad8, 0x9fd8b4, 0xd9d2c4]); L.sleeve = chance(0.4) ? 'long' : 'short'; L.bot = pick([0x3a4a6b, 0x5a7ab0, 0x2a2a30, 0xd8d2c4]); L.legs = chance(0.3) ? 'short' : 'long'; L.shoe = pick([0xf2f2f0, 0xf2f2f0, 0x2a2a30, 0xe8437a]); L.pack = chance(0.4) ? pick([0x2a2a30, 0xd9534f, 0x3d6fb5, 0x8a9a5a]) : 0; L.hat = chance(0.15) ? 'cap' : 0; }
  else if (t === 'fashion') { L.fem = true; L.hair = pick([0x1d1a24, 0x6a3a2a, 0x8a5a3a, 0xb8884a]); L.hs = pick([1, 5, 2]); L.dress = chance(0.55) ? 1 : 0; L.top = pick([0xf2f2f0, 0x2f2f38, 0xf2b8c8, 0xe8d8b8, 0xc94f6a, 0x9ab8d8]); L.bot = pick([0x2a2a30, 0xf2f2f0, 0xc94f6a, 0x5a7ab0, 0xd8b88a]); L.glasses = chance(0.3); L.carry = chance(0.6) ? 'bag' : null; L.shoe = pick([0xf2f2f0, 0x2a2a30, 0xc94f6a]); }
  else if (t === 'shipper') { const sc = pick([0xf08a2b, 0xd9281e, 0x2f6ab8, 0xf2c94c]); L.top = sc; L.sleeve = 'long'; L.hat = 'helm'; L.hatC = sc; L.bot = 0x2a2a30; L.rainMode = 'poncho'; L.keep = 1; }
  else if (t === 'grabber') { L.top = 0x1faa59; L.sleeve = 'long'; L.hat = 'helm'; L.hatC = 0x1faa59; L.bot = 0x2a2a30; L.rainMode = 'poncho'; L.keep = 1; }
  else if (t === 'driver') { L.top = pick([0x4a6a9a, 0x6f8250, 0x7c8aa0, 0xe9dcc0]); L.hat = pick(['cap', 'beo', 'coi', 0]); L.hatC = pick([0x3d4f7a, 0x8a7a5a, 0x6f8250]); L.skin = pick([0xdba676, 0xc98f60]); L.rainMode = 'poncho'; }
  else if (t === 'hawker') { L.fem = true; L.top = pick([0x6b4a6a, 0x8a5a4a, 0x5a7a5a]); L.bot = 0x2a2a30; L.sleeve = 'long'; L.hat = 'non'; L.hs = 3; L.ganh = true; L.goods = pick([0xf2c94c, 0x9fd8b4, 0xf08a4b, 0xf4f1e8]); L.rainMode = 'poncho'; }
  L.bag = pick([0x8a5a3a, 0x3d4f7a, 0xd9534f, 0x4fa3a0]);
  if (E) { if (L.hat === 'non' && Math.random() > E.nonla && !L.ganh) L.hat = 0; if (!L.carry && !L.kid && !L.ganh && t !== 'monk' && t !== 'oldlady' && Math.random() < E.phone) L.carry = 'phone'; if (Math.random() < E.mask) L.mask = 1; }
  L.b = { top: L.top, sleeve: L.sleeve, hat: L.hat, legs: L.legs };
  return L;
}
function dressFor(L, season) {
  const b = L.b; L.top = b.top; L.sleeve = b.sleeve; L.hat = b.hat; L.legs = b.legs; L.scarf = 0;
  if (L.type === 'monk' || L.keep) return L;
  if (season === 'winter') { L.sleeve = 'long'; L.legs = 'long'; if (L.r1 < 0.78 && L.dress !== 2) L.top = L.jacket; if (L.r2 < 0.6) L.scarf = L.scarfC; if (L.r3 < 0.45 && L.hat !== 'coi' && L.hat !== 'helm') L.hat = 'len'; }
  else if (season === 'fall') { L.sleeve = 'long'; if (L.r1 < 0.35 && L.dress !== 2) L.top = L.jacket; if (L.r2 < 0.15) L.scarf = L.scarfC; }
  else if (season === 'summer') { if (!L.hat && L.r3 < 0.32) L.hat = L.fem ? 'non' : 'cap'; if (L.type === 'youth' && L.r2 < 0.5) L.legs = 'short'; if (L.type === 'youth' || L.type === 'dress') L.sleeve = 'short'; }
  return L;
}
// New people: chibi townsfolk drawn at K art pixels per unit — big round heads, cocoa ink outline, two-tone warm shading,
// faces with eyes + blush (front 3/4 view looks right-down; the sheet mirrors it for the other directions).
const CW = PW * K, CH = PH * K;
const skinSh = c => mixc(mixc(c, 0xc8583a, 0.3), 0x3a221c, 0.06), clothSh = c => mixc(mixc(c, 0x6a3f45, 0.34), 0x2b1a16, 0.05), hiOf = c => mixc(c, 0xfff4e2, 0.24);
function drawPerson(L0, back, pose) {
  const L = Object.assign({}, L0); L.skin = grade(L.skin); L.top = grade(L.top); L.bot = grade(L.bot); L.shoe = grade(L.shoe); L.hair = grade(L.hair);
  const W = CW, H = CH, col = new Int32Array(W * H).fill(-1), zz = new Int8Array(W * H).fill(-1);
  const put = (x, y, c, z) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; col[y * W + x] = c; zz[y * W + x] = z; };
  // shaded rect / ellipse: right part in shadow, upper-left lit
  const rect = (x0, y0, x1, y1, c, z, shX, sc) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, shX !== undefined && x >= shX ? (sc || clothSh(c)) : c, z); };
  const ell = (cx, cy, rx, ry, c, z, sc, hl, clip) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy > 1) continue; if (clip && !clip(x, y)) continue; let k = c; if (sc !== undefined && dx > 0.38 - dy * 0.15) k = sc; else if (hl !== undefined && dx < -0.2 && dy < -0.35) k = hl; put(x, y, k, z); } };
  const kid = L.kid, sit = pose === 5, walk = pose === 1 || pose === 3, pass = pose === 2 || pose === 4, bob = pass ? -1 : 0, cx = 13;
  const foot = 49, legTop = (kid ? 41 : 37) + (sit ? 5 : 0) + bob, torsoTop = (kid ? 33 : 26) + (sit ? 5 : 0) + bob, headCY = (kid ? 25 : 17) + (sit ? 5 : 0) + bob, hr = kid ? 7.5 : 8;
  const skin = L.skin, sS = skinSh(skin), top = L.poncho ? grade(L.ponchoC) : L.top, bot = L.bot, shoe = L.shoe, hair = L.hair, hS = mixc(hair, 0x1a100e, 0.35), hH = mixc(hair, 0xb08070, 0.3);
  const legC = L.dress === 1 || L.dress === 3 ? skin : bot, armRow = j => L.poncho || L.sleeve === 'long' ? top : L.sleeve === 'none' ? skin : j < 4 ? top : skin;
  // --- hair that hangs behind the body (long / bob seen from the front)
  if (!back && !L.poncho && (L.hs === 1 || L.hs === 5) && L.hat !== 'helm') { const ln = L.hs === 1 ? torsoTop + (kid ? 6 : 9) : headCY + 7; rect(cx - 9, headCY, cx - 4, ln, hair, 0, cx - 5, hS); rect(cx + 6, headCY + 2, cx + 9, Math.min(ln, torsoTop + 4), hS, 0); }
  // --- back arm (left on screen)
  const swing = walk ? (pose === 1 ? 1 : -1) : 0, armLen = kid ? 8 : 11;
  const arm = (x, z, sw, raise) => { for (let j = 0; j < armLen; j++) { const y = torsoTop + 1 + j, xx = x + Math.round(sw * j / armLen * 2), c = armRow(j); if (raise) continue; for (let i = 0; i < 3; i++) put(xx + i, y, i === 2 ? (c === skin ? sS : clothSh(c)) : c, z); } const hy = torsoTop + 1 + armLen, hx = x + sw * 2; if (!raise) { rect(hx, hy, hx + 2, hy + 1, skin, z, hx + 2, sS); } };
  if (!L.ganh || sit) arm(cx - 8, 1, -swing);
  // --- legs
  if (sit) { rect(cx - 3, legTop, cx + 7, legTop + 3, legC, 2, cx + 5); rect(cx + 3, legTop + 4, cx + 7, foot - 2, legC, 2, cx + 6); rect(cx + 3, foot - 1, cx + 8, foot, shoe, 3, cx + 7); }
  else {
    const l1 = walk ? (pose === 1 ? -1 : 1) : 0, legEnd = foot - 2;
    const leg = (x, lift, z) => { rect(x, legTop, x + 3, legEnd - lift, legC === skin ? skin : legC, z, x + 3, legC === skin ? sS : clothSh(legC)); if (L.legs === 'short' && legC !== skin) rect(x, legTop + (kid ? 4 : 6), x + 3, legEnd - lift, skin, z, x + 3, sS); rect(x, legEnd - lift + 1, x + 4, foot - lift, shoe, z + 1, x + 3, clothSh(shoe)); };
    leg(cx - 4 + l1, walk && pose === 3 ? 1 : 0, 2); leg(cx + 1 - l1, walk && pose === 1 ? 1 : 0, 3);
  }
  // --- skirts / áo dài / robe below the waist
  if (L.dress === 1 && !sit) rect(cx - 6, legTop - 1, cx + 6, legTop + (kid ? 4 : 6), bot, 4, cx + 3);
  else if (L.dress === 2 && !sit) { rect(cx - 4, legTop - 1, cx + 4, legTop + 9, top, 4, cx + 2); put(cx - 5, legTop + 2, top, 4); }
  else if (L.dress === 3) rect(cx - 6, legTop - 1, cx + 6, sit ? legTop + 3 : foot - 2, top, 4, cx + 3);
  // --- torso
  for (let y = torsoTop; y < legTop; y++) { const inset = y === torsoTop ? 2 : y === torsoTop + 1 ? 1 : (y > legTop - 3 ? 1 : 0); for (let x = cx - 6 + inset; x <= cx + 6 - inset; x++) put(x, y, x >= cx + 3 ? clothSh(top) : (x < cx - 3 && y < torsoTop + 4 ? hiOf(top) : top), 5); }
  if (L.pattern && !L.poncho) for (let y = torsoTop + 2; y < legTop; y++) for (let x = cx - 5; x <= cx + 5; x++) if ((x * 2 + y * 3) % 7 === 0) put(x, y, grade(L.pattern), 5);
  if (!back && !L.poncho) {
    if (L.tie) { rect(cx - 1, torsoTop, cx + 1, torsoTop, 0xf7f0e2, 6); rect(cx, torsoTop + 1, cx, torsoTop + 7, grade(L.tie), 6); }
    else if (L.dress === 2) rect(cx - 1, torsoTop - 1, cx + 1, torsoTop, top, 6);
    else { put(cx, torsoTop, sS, 6); put(cx + 1, torsoTop, sS, 6); for (let j = 3; j < legTop - torsoTop; j += 3) put(cx + 1, torsoTop + j, clothSh(top), 6); }   // collar notch + buttons
    if (L.apron) rect(cx - 4, torsoTop + 4, cx + 4, legTop + 3, 0xf4ecda, 6, cx + 2, 0xd8ccb4);
  }
  if (L.pack && back) rect(cx - 5, torsoTop + 1, cx + 5, torsoTop + 9, grade(L.pack), 7, cx + 3);
  if (L.pack && !back) { rect(cx - 5, torsoTop, cx - 5, legTop - 2, grade(L.pack), 6); rect(cx + 4, torsoTop, cx + 4, legTop - 2, clothSh(grade(L.pack)), 6); }
  // --- neck + head
  rect(cx, torsoTop - 2, cx + 2, torsoTop - 1, sS, 5);
  ell(cx + 1, headCY, hr, hr, skin, 8, sS, hiOf(skin));
  if (!back && L.hs !== 7) { put(cx - 6, headCY + 1, skin, 8); put(cx - 6, headCY + 2, sS, 8); }   // ear
  // --- hair
  const hs = L.hs, hairOn = !L.poncho && hs !== 7, capOnly = L.hat === 'helm' || L.hat === 'len';
  if (hairOn && !capOnly) {
    if (back) ell(cx + 1, headCY - 0.5, hr + 0.8, hr + 0.4, hair, 9, hS, hH);
    else {
      const bang = x => headCY - 2 + ((x * 3) % 4 === 0 ? 1 : 0) - (hs === 0 || hs === 6 ? 1 : 0);
      ell(cx + 1, headCY - 1, hr + 0.8, hr, hair, 9, hS, hH, (x, y) => y < bang(x) || (x < cx - 3 && y < headCY + (hs === 1 || hs === 5 ? 6 : 3)));
    }
    if (hs === 1 && back) rect(cx - 7, headCY, cx + 8, torsoTop + (kid ? 6 : 9), hair, 9, cx + 4, hS);
    if (hs === 5 && back) rect(cx - 7, headCY, cx + 8, headCY + 7, hair, 9, cx + 4, hS);
    if (hs === 2) { if (back) rect(cx, headCY + 2, cx + 2, torsoTop + 6, hair, 9, cx + 2, hS); else ell(cx - 8, headCY + 2, 2.4, 4, hair, 1, hS); put(cx - 6, headCY - 1, 0xe05a6a, 10); }
    if (hs === 3) ell(cx, headCY - hr - 1, 3.5, 2.8, hair, 9, hS, hH);
    if (hs === 4) { const gh = mixc(hair, 0xe8e2da, 0.4); ell(cx + 1, headCY - 1, hr + 0.6, hr, skin, 9, sS, hiOf(skin), (x, y) => y < headCY - 2); ell(cx + 1, headCY - 1, hr + 0.8, hr, gh, 9, mixc(gh, 0x6a5a58, 0.3), undefined, (x, y) => back ? y > headCY - 3 : x < cx - 2 && y > headCY - 3 && y < headCY + 3); }
    if (hs === 6) for (let x = cx - 5; x <= cx + 6; x += 3) { put(x, headCY - hr - 1, hair, 9); put(x + 1, headCY - hr - 2, hH, 9); }
  }
  if (hs === 7 && !L.poncho) ell(cx + 1, headCY - 1, hr, hr, mixc(skin, 0x6a5040, 0.18), 9, sS, undefined, (x, y) => y < headCY - 2);
  // --- face (front)
  if (!back) {
    const ey = headCY + (kid ? 0 : 1), ex1 = cx - 1, ex2 = cx + 4, eh = kid ? 3 : 3;
    if (L.type === 'oldman' || L.type === 'oldlady') { rect(ex1, ey + 1, ex1 + 1, ey + 1, INK, 10); rect(ex2, ey + 1, ex2 + 1, ey + 1, INK, 10); }
    else { rect(ex1, ey, ex1 + 1, ey + eh - 1, INK, 10); rect(ex2, ey, ex2 + 1, ey + eh - 1, INK, 10); put(ex1, ey, 0x6a4a44, 10); put(ex2, ey, 0x6a4a44, 10); }
    if (L.blush || L.fem || kid) { put(ex1 - 2, ey + eh, mixc(skin, 0xf06a6a, 0.45), 10); put(ex1 - 1, ey + eh, mixc(skin, 0xf06a6a, 0.45), 10); put(ex2 + 2, ey + eh, mixc(sS, 0xf06a6a, 0.4), 10); }
    put(cx + 2, ey + eh + 2, 0x8a3a32, 10); put(cx + 3, ey + eh + 2, 0x8a3a32, 10);
    if (L.glasses) { rect(ex1 - 1, ey, ex2 + 2, ey, 0x3a2a30, 11); rect(ex1 - 1, ey + 2, ex1 + 2, ey + 2, 0x3a2a30, 11); rect(ex2 - 1, ey + 2, ex2 + 2, ey + 2, 0x3a2a30, 11); }
    if (L.mask) rect(cx - 3, ey + eh + 1, cx + 7, ey + eh + 4, 0xd8ecf2, 11, cx + 5, 0xb4cad6);
  }
  // --- hats
  const hat = L.poncho ? 0 : L.hat, hc = grade(L.hatC || 0x6f8250);
  if (hat === 'non') { const s1 = 0xead7a2, s2 = 0xc4a46a, ap = headCY - hr - 8, bs = headCY - 2; for (let y = ap; y <= bs; y++) { const hw = (y - ap) / (bs - ap) * 12.5 + 0.5; for (let x = Math.round(cx + 1 - hw); x <= Math.round(cx + 1 + hw); x++) put(x, y, x > cx + 1 + hw * 0.3 ? s2 : (y - ap) % 3 === 2 ? mixc(s1, s2, 0.4) : s1, 12); } rect(cx - 11, bs + 1, cx + 13, bs + 1, s2, 12); }
  else if (hat === 'coi' || hat === 'beo') { const c = hat === 'coi' ? grade(0x6f8250) : hc; ell(cx + 1, headCY - 4, hr + 0.5, 6, c, 12, clothSh(c), hiOf(c), (x, y) => y < headCY - 2); rect(cx - 9, headCY - 2, cx + 11, headCY - 1, c, 12, cx + 6); }
  else if (hat === 'helm') { ell(cx + 1, headCY - 1.5, hr + 1.4, hr + 0.6, hc, 12, clothSh(hc), hiOf(hc), (x, y) => back || y < headCY + 1 || x < cx - 3); if (!back) rect(cx - 2, headCY, cx + 9, headCY + 1, 0x3a3436, 12); }
  else if (hat === 'cap') { ell(cx + 1, headCY - 3, hr + 0.4, 6, hc, 12, clothSh(hc), hiOf(hc), (x, y) => y < headCY - 1); if (!back) rect(cx + 5, headCY - 2, cx + 12, headCY - 1, clothSh(hc), 12); }
  else if (hat === 'len') { ell(cx + 1, headCY - 2, hr + 1, hr - 0.5, hc, 12, clothSh(hc), hiOf(hc), (x, y) => y < headCY + (back ? 4 : 0)); rect(cx - 7, headCY - 1, cx + 9, headCY, hiOf(hc), 12); ell(cx + 1, headCY - hr - 2.5, 2.2, 2, 0xf4ece0, 12); }
  // --- rain poncho: a glossy cape + hood
  if (L.poncho) { for (let y = torsoTop - 1; y < legTop + 6; y++) { const hw = 6 + (y - torsoTop) * 0.35; for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) put(x, y, x > cx + hw * 0.35 ? clothSh(top) : (x - cx + y) % 9 === 0 ? hiOf(top) : top, 13); } ell(cx + 1, headCY - 1, hr + 1.5, hr + 1, top, 13, clothSh(top), hiOf(top), (x, y) => back || !(x > cx - 4 && y > headCY - 3)); }
  // --- neck things
  if (!L.poncho) {
    if (L.scarf) { rect(cx - 4, torsoTop - 1, cx + 5, torsoTop + 1, grade(L.scarf), 13, cx + 3); rect(cx - 4, torsoTop + 2, cx - 2, torsoTop + 6, grade(L.scarf), 13); }
    if (L.kq) { rect(cx - 4, torsoTop, cx + 4, torsoTop + 1, 0xd2321e, 13); rect(cx - 1, torsoTop + 2, cx + 1, torsoTop + 3, 0xd2321e, 13); put(cx, torsoTop + 4, 0xd2321e, 13); }
  }
  // --- front arm + things in the hand
  const cy0 = L.carry, raise = pose === 6, talk = pose === 7, ax = cx + 5;
  if (L.ganh && !sit) { const py = torsoTop - 1; rect(0, py, W - 1, py, 0x8a6a3a, 14); for (const bx of [1, W - 7]) { for (let j = 1; j < 7; j++) put(bx + 3, py + j, 0x6a4a2a, 14); rect(bx, py + 7, bx + 6, py + 11, 0xc49a5a, 14, bx + 5, 0x9a7442); rect(bx + 1, py + 6, bx + 5, py + 6, grade(L.goods || 0xf2c94c), 14); } }
  if (raise) { for (let j = 0; j < (kid ? 8 : 10); j++) for (let i = 0; i < 3; i++) put(ax + 1 + i, torsoTop + 1 - j, i === 2 ? clothSh(armRow(9 - j)) : armRow(9 - j), 14); rect(ax + 1, torsoTop - (kid ? 9 : 11), ax + 3, torsoTop - (kid ? 8 : 10), skin, 14, ax + 3, sS); }
  else if (talk) { arm(ax, 14, 0, true); for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) put(ax + i, torsoTop + 1 + j, i === 2 ? clothSh(armRow(j)) : armRow(j), 14); rect(ax + 2, torsoTop + 5, ax + 6, torsoTop + 6, armRow(6), 14); rect(ax + 6, torsoTop + 3, ax + 7, torsoTop + 5, skin, 14); }
  else if (!L.ganh || sit) arm(ax, 14, swing);
  const hx = ax + swing * 2, hy = torsoTop + 1 + armLen;
  if (cy0 === 'bag' && !sit) { for (let j = 0; j < legTop - torsoTop; j++) put(cx - 4 + Math.round(j * 10 / (legTop - torsoTop)), torsoTop + j, 0x6a3a2a, 15); const bc = grade(L.bag); rect(cx + 3, legTop - 4, cx + 9, legTop + 1, bc, 15, cx + 8, clothSh(bc)); rect(cx + 3, legTop - 4, cx + 9, legTop - 3, hiOf(bc), 15); put(cx + 6, legTop - 2, 0xf4e6c4, 15); }
  else if (cy0 === 'case' && !sit) { rect(hx - 1, hy + 2, hx + 4, hy + 5, 0x6b4a36, 15, hx + 3, 0x4f3626); put(hx + 1, hy + 1, 0x4f3626, 15); put(hx + 2, hy + 1, 0x4f3626, 15); }
  else if (cy0 === 'phone' && !back) { rect(hx, hy - 3, hx + 1, hy - 1, 0x2a2428, 15); put(hx, hy - 3, 0x9fd8ff, 15); }
  else if (cy0 === 'cup') { rect(hx, hy - 3, hx + 2, hy, 0xf2f0ea, 15, hx + 2, 0xc8c4bc); rect(hx, hy - 2, hx + 2, hy - 2, 0x8a5a3a, 15); }
  else if (cy0 === 'banhmi') { rect(hx - 1, hy - 1, hx + 4, hy, 0xd9a55a, 15, hx + 3, 0xb5803a); put(hx + 1, hy - 2, 0x6ab04a, 15); }
  else if (cy0 === 'shop' && !sit) { rect(hx - 1, hy + 1, hx + 3, hy + 6, 0xf2b0c0, 15, hx + 2, 0xd88a9a); rect(hx - 1, hy + 1, hx + 3, hy + 1, 0xd9534f, 15); put(hx + 1, hy, 0x58994f, 15); }
  else if (cy0 === 'melon' && !sit) { ell(cx + 3, legTop - 2, 4.5, 3.8, 0x4a9a4a, 15, 0x2f6a38, 0x7ac070); for (let x = cx; x <= cx + 6; x += 3) for (let y = legTop - 5; y <= legTop + 1; y++) if (col[y * W + x] === 0x4a9a4a) put(x, y, 0x2f6a38, 15); }
  // --- ink: cocoa outline around the figure + lines where a nearer part overlaps a farther one
  const out = col.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (col[i] < 0) { if ((x > 0 && col[i - 1] >= 0) || (x < W - 1 && col[i + 1] >= 0) || (y > 0 && col[i - W] >= 0) || (y < H - 1 && col[i + W] >= 0)) out[i] = INK; continue; }
    const z = zz[i]; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && col[j] >= 0 && zz[j] < z - 1 && zz[j] !== 9 && !(z === 10 || z === 11)) { out[i] = mixc(col[i], INK, 0.72); break; }
  }
  return out;
}
// sheet: columns = poses, rows = front, back, front flipped, back flipped
function personSheet(L) {
  const Wd = CW * NPOSE, Hd = CH * 4, g = new Int32Array(Wd * Hd).fill(-1);
  for (let b = 0; b < 2; b++) for (let p = 0; p < NPOSE; p++) { const s = drawPerson(L, b === 1, p); for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const c = s[y * CW + x]; if (c < 0) continue; g[(b * CH + y) * Wd + p * CW + x] = c; g[((b + 2) * CH + y) * Wd + p * CW + CW - 1 - x] = c; } }
  return gridCanvas(g, Wd, Hd, null, K);
}
const DIR_ROW = [0, 2, 3, 1];       // dir 0:+x 1:+y 2:-x 3:-y -> sheet row
const DIRV = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// ----- umbrellas (3 frames: closed, half, open) -----
const UMB = [];
function initUmbrellas() {
  // drawn at K: a furled / half-open / open canopy with panel seams, scalloped hem and an ink rim
  for (const c0 of UMBC) {
    const c = grade(c0), fr = [], c2 = mixc(c, 0x6a3f45, 0.32), c3 = mixc(c, 0xfff4e2, 0.3), W = 20 * K, H = 16 * K, ax = W / 2;
    for (let f = 0; f < 3; f++) {
      const g = new Int32Array(W * H).fill(-1), set = (x, y, v) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y * W + x] = v; };
      for (let y = 8; y < H - 1; y++) set(ax, y, 0x5a4a44); set(ax - 1, H - 2, 0x5a4a44); set(ax - 2, H - 3, 0x5a4a44);
      if (f === 0) { for (let y = 2; y < 21; y++) { const hw = y < 6 ? (y - 2) * 0.6 : Math.max(0.6, 2.4 - (y - 6) * 0.13); for (let x = Math.round(ax - hw); x <= Math.round(ax + hw); x++) set(x, y, x > ax ? c2 : c); } set(ax, 1, 0x5a4a44); }
      else {
        const rx = f === 1 ? 11 : 18.5, ry = f === 1 ? 10 : 8.5, cy = f === 1 ? 11 : 10, bottom = f === 1 ? 17 : 13;
        for (let y = 1; y <= bottom + 1; y++) for (let x = 0; x < W; x++) {
          const dx = (x + 0.5 - ax) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy > 1 || y < cy - ry) continue;
          const seg = Math.floor((Math.atan2(y - cy - 6, x - ax) + Math.PI) / (Math.PI / 4)) & 1, hem = y >= bottom - 1 + (Math.abs(((x - ax) % 6 + 6) % 6 - 3) < 1.5 ? 1 : 0);
          if (y > bottom - 1 + (Math.abs(((x - ax) % 6 + 6) % 6 - 3) < 1.5 ? 1 : 0) + 1) continue;
          set(x, y, hem ? c2 : dx > 0.45 ? c2 : seg ? c : (dx < -0.3 && dy < -0.2 ? c3 : mixc(c, c3, 0.4)));
        }
        set(ax, Math.round(cy - ry) - 1, 0x5a4a44);
      }
      fr.push(gridCanvas(inkGrid(g, W, H, 0.85), W, H, null, K));
    }
    UMB.push(fr);
  }
}

// ----- dogs -----
const DOGS = [];
function initDogs() {
  const pals = [[0xc98a4a, 0xf2e2c8], [0xf4f0e8, 0xd8c8b8], [0x4a4048, 0x8a8088], [0xe8c66a, 0xf6efe0]];
  const A = ['...........', '.b......b..', 'bbb....bbbk', '.bbbbbbbbb.', '.bbbbbbbbw.', '.bwbbbbbb..', '.b.b..b.b..', '.b.b..b.b..'], B2 = ['...........', '.b......b..', 'bbb....bbbk', '.bbbbbbbbb.', '.bbbbbbbbw.', '.bwbbbbbb..', '..bb..bb...', '.b..bb..b..'];
  for (const p of pals) { const pal = { b: p[0], w: p[1], k: 0x2a2140 }; const fr = [A, B2].map(r => bmpGrid(r, pal)), fl = [A, B2].map(r => bmpGrid(r.map(s => s.split('').reverse().join('')), pal)); DOGS.push([fr, fl]); }
}

// ----- vehicles: box models facing +x, rotated to 4 headings -----
const DKC = 0x25232b, MTL = 0x9aa3ad, GLS = 0x3b4f66, HEAD = { em: 0xfff0b0 }, TAIL = { em: 0x8a1818 };
const glassP = body => (f, u, v, b) => { if (f === 0) return body; const W = f === 1 ? b.w : b.d; if (v > b.h - 0.9 || u < 0.9 || u > W - 0.9 || Math.abs(u - W / 2) < 0.55) return body; return v > b.h - 2 ? 0x5f7a96 : GLS; };
function wheels4(L, W, r) { return [box(3, -0.4, 0, r + 0.8, 1.4, r, DKC), box(L - 8, -0.4, 0, r + 0.8, 1.4, r, DKC), box(3, W - 1, 0, r + 0.8, 1.4, r, DKC), box(L - 8, W - 1, 0, r + 0.8, 1.4, r, DKC)]; }
function lights(L, W, z) { return [box(L - 0.4, 1, z, 0.6, 2.2, 1.5, 0xfff0b0, null, HEAD), box(L - 0.4, W - 3.2, z, 0.6, 2.2, 1.5, 0xfff0b0, null, HEAD), box(-0.2, 1, z, 0.6, 2, 1.3, 0xd03a3a, null, TAIL), box(-0.2, W - 3, z, 0.6, 2, 1.3, 0xd03a3a, null, TAIL)]; }
const VEH = {
  moto(v) { const c = [0x8a2f3f, 0x2f4f8a, 0x4f8a5f, 0xb23a3a, 0x2f2c34, 0xc9a23a, 0x8fa3b8, 0x7a3f6a][v % 8], cub = v % 3 === 1; const B = [box(0, 1.4, 0, 4.4, 2, 4.4, DKC), box(11.6, 1.4, 0, 4.4, 2, 4.4, DKC), box(2.6, 0.9, 3, 10, 3, 3.2, c), box(0.4, 1.3, 4.4, 3, 2.2, 1.6, c), box(3.4, 0.7, 6.2, 6.4, 3.4, 1.2, 0x2a2428), box(11.6, 1.6, 4, 1.4, 1.6, 5.4, MTL), box(11.4, 0, 9, 1.2, 4.8, 0.9, DKC), box(12.8, 1.5, 6.6, 1.2, 1.8, 2, 0xfff0b0, null, HEAD), box(0, 1.7, 5, 0.8, 1.4, 1.2, 0xd03a3a, null, TAIL)]; if (cub) B.push(box(10.2, 0.2, 3, 1.2, 4.4, 5, 0xf0ece0)); return { L: 16, W: 4.8, boxes: B, seats: [{ x: 7.6, z: 7 }, { x: 4.6, z: 7.3 }] }; },
  bike(v) { const c = [0x4a7ab8, 0xb23a3a, 0x4f8a5f, 0x8a8f9a, 0xc9a23a][v % 5], B = [box(0, 1.1, 0, 4, 0.8, 4, 0x3a3a44), box(8, 1.1, 0, 4, 0.8, 4, 0x3a3a44), box(2, 1.2, 3, 7.6, 0.6, 0.9, c), box(3, 0.8, 5, 2.2, 1.4, 0.7, DKC), box(8.8, 1.2, 3.4, 0.6, 0.6, 2.8, MTL), box(8.6, 0.1, 6.2, 0.8, 2.8, 0.7, MTL)]; if (v % 2) B.push(box(9.6, 0.5, 4.6, 1.8, 2, 1.6, 0xc9a86a)); return { L: 12, W: 3, boxes: B, seats: [{ x: 4.2, z: 5.2 }] }; },
  cyclo(v) { const c = [0xb23a3a, 0x2f4f8a, 0x4f8a5f, 0x8a2f3f][v % 4]; return { L: 21, W: 9, boxes: [box(12.5, 0.2, 0, 4.4, 1, 4.4, DKC), box(12.5, 7.8, 0, 4.4, 1, 4.4, DKC), box(10.5, 1.4, 2.4, 6.5, 6.2, 2.2, c), box(10, 1.4, 4.6, 1.2, 6.2, 4.6, c), box(11.2, 1.4, 4.6, 5, 0.8, 1.6, MTL), box(11.2, 6.8, 4.6, 5, 0.8, 1.6, MTL), box(17, 2, 1.6, 3, 5, 0.8, MTL), box(9, 1.2, 7.6, 1.2, 6.6, 2.2, 0x3a5a4a), box(0, 4, 0, 4.4, 1, 4.4, DKC), box(3.5, 4, 3.2, 7, 1, 1, MTL), box(4.4, 4, 4, 0.8, 1, 3.4, MTL), box(3.4, 3.4, 7.2, 2.6, 2.2, 0.8, DKC)], seats: [{ x: 4.6, z: 7.8 }, { x: 13.4, z: 4.6 }] }; },
  car(v, taxi) {
    const c = taxi ? [0xf2c23a, 0xf0f0e8, 0xf2c23a][v % 3] : [0x8a9ab0, 0x9a3a3a, 0xe8e4d8, 0x3a4a5a, 0x6f8a6a][v % 5], st = taxi ? (v % 3 === 1 ? 0x2f8a5a : 0x2a2a30) : -1, L = 28, W = 12;
    const B = wheels4(L, W, 3.6).concat([box(0, 0, 1.6, L, W, 5, c, (f, u, v2) => f !== 0 && st >= 0 && v2 > 1.6 && v2 < 2.8 ? st : undefined), box(7, 1, 6.6, 13, 10, 4.2, c, glassP(c))], lights(L, W, 3.8));
    if (taxi) B.push(box(13, 4.5, 10.8, 2, 3, 1.6, 0xfff4c0, null, { em: 0xffe680 }));
    return { L, W, boxes: B, seats: [] };
  },
  taxi(v) { return VEH.car(v, true); },
  lam(v) { const c = [0x4a7ab8, 0xe8dcb8, 0x5a9a7a][v % 3], L = 20, W = 10; return { L, W, boxes: [box(16, 4.3, 0, 3.6, 1.4, 3.6, DKC), box(2, -0.3, 0, 3.8, 1.3, 3.6, DKC), box(2, 9, 0, 3.8, 1.3, 3.6, DKC), box(0, 0, 1.8, 13, W, 7.6, c, (f, u, v2, b) => { const Wd = f === 1 ? b.w : b.d; return f !== 0 && v2 > 3.2 && v2 < 6.4 && u > 1 && u < Wd - 1 ? (hash2(u * 0.7, 3) > 0.6 ? 0x6b5a4a : 0x2a2a35) : undefined; }), box(13, 0.6, 1.8, 5.5, 8.8, 6.8, c, (f, u, v2, b) => f !== 0 && v2 > 3.4 && v2 < 6 && u > 0.8 && u < (f === 1 ? b.w : b.d) - 0.8 ? GLS : undefined), box(18.5, 2.5, 1.8, 1.5, 5, 3.4, c), box(19.8, 3.6, 3.4, 0.5, 2.8, 1.4, 0xfff0b0, null, HEAD)], seats: [] }; },
  truck(v) { const c = [0x4a6a9a, 0x6f8250, 0xb8553a][v % 3], L = 28, W = 12; return { L, W, boxes: wheels4(L, W, 3.8).concat([box(0, 0, 1.8, 19, W, 3.2, 0x6b5a4a), box(1, 1, 5, 17, 10, 4 + v % 3, [0x8a9a6a, 0x9a8a6a, 0x7a8a9a][v % 3], (f, u, v2) => vnoise(u / 2.5 + v, v2 / 2) > 0.62 ? shade(0x8a9a6a, -0.18) : undefined), box(19, 0, 1.8, 9, W, 9, c, (f, u, v2, b) => f !== 0 && v2 > 5 && v2 < 8 && u > 1 && u < (f === 1 ? b.w : b.d) - 1 ? GLS : undefined)], lights(L, W, 3.6)), seats: [] }; },
  bus(v) { const c = [0xdccca4, 0x7fb0d0][v % 2], s2 = [0xc0392b, 0xf4f1e8][v % 2], L = 42, W = 13; return { L, W, boxes: wheels4(L, W, 4).concat([box(0, 0, 1.8, L, W, 11.4, c, (f, u, v2, b) => { if (f === 0) return shade(c, 0.1); const Wd = f === 1 ? b.w : b.d; if (v2 > 5.4 && v2 < 9.2 && u > 1.2 && u < Wd - 1.2) return (u % 5.2 < 0.9) ? c : GLS; if (v2 > 3 && v2 < 4.4) return s2; }), box(8, 2, 13.2, 10, 9, 2.4, 0x8a6a4a), box(21, 3, 13.2, 7, 7, 3.2, 0x4a7a9a), box(30, 2.5, 13.2, 6, 8, 2, 0xc9a86a)], lights(L, W, 3.6)), seats: [] }; }
};
const _veh = {}, _vm = {};
function vehModel(kind, v) { const k = kind + v; return _vm[k] || (_vm[k] = VEH[kind](v)); }
function rotBoxes(m, dir) {
  const L = m.L, W = m.W;
  return m.boxes.map(b => { let o; if (dir === 0) o = { x: b.x - L / 2, y: b.y - W / 2, w: b.w, d: b.d }; else if (dir === 2) o = { x: L / 2 - b.x - b.w, y: W / 2 - b.y - b.d, w: b.w, d: b.d }; else if (dir === 1) o = { x: W / 2 - b.y - b.d, y: b.x - L / 2, w: b.d, d: b.w }; else o = { x: b.y - W / 2, y: L / 2 - b.x - b.w, w: b.d, d: b.w }; return Object.assign({}, b, o); });
}
function vehSprite(kind, v, dir) { const k = kind + '|' + v + '|' + dir; return _veh[k] || (_veh[k] = bake(rotBoxes(vehModel(kind, v), dir))); }
function seatOff(m, s, dir) { const lx = s.x - m.L / 2, d = DIRV[dir], dx = d[0] * lx, dy = d[1] * lx; return [dx - dy, (dx + dy) / 2 - s.z]; }

// ----- trees -----
const TREE_SP = ['dau', 'me', 'bang', 'mai', 'cau'];
const LEAFPAL = {
  spring: [0x2d4f38, 0x4a7d46, 0x76a852, 0xb9d272], summer: [0x22422e, 0x3a6a3a, 0x5c9044, 0x93bc5a],
  fallA: [0x6e4422, 0xa8662a, 0xd4963c, 0xf0c466], fallB: [0x5e301e, 0x9c4c28, 0xc66c36, 0xe49c4e], fallC: [0x52261e, 0x86382a, 0xb05232, 0xd27e46]
};
const _tree = {};
// Trees: soft clustered canopies (each puff lit from the upper left), cocoa ink rim, trunks with bark shading.
function treeSprite(spc, season, v) {
  const key = spc + season + v; if (_tree[key]) return _tree[key];
  const R = mulberry32(spc.charCodeAt(0) * 131 + spc.charCodeAt(1) * 17 + v * 977 + 5), LW = 76, LH = 96, bx = 38, by = 92, W = LW * K, H = LH * K;
  const g = new Int32Array(W * H).fill(-1), set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = c; }, get = (x, y) => x >= 0 && y >= 0 && x < W && y < H ? g[y * W + x] : -1;
  const winter = season === 'winter' && spc !== 'maiL', SN = 0xf6f4f2;
  const th = { dau: 38, me: 21, bang: 22, mai: 9, cau: 35, maiL: 18 }[spc], tw = { dau: 3.5, me: 3.5, bang: 3, mai: 2, cau: 2, maiL: 2.6 }[spc];
  const bark = spc === 'dau' ? 0x9a826c : spc === 'cau' ? 0x958866 : 0x6e4c3c, barkS = mixc(bark, 0x3a221c, 0.38), barkH = mixc(bark, 0xfff1d6, 0.2);
  // trunk (with a slight lean for the palm)
  let tx = bx * K;
  for (let y = 0; y <= th * K; y++) { const t = y / (th * K), off = spc === 'cau' ? Math.sin(t * 1.3) * 4 * K : 0, wdt = tw * K * (1 - t * 0.25); tx = bx * K + off; for (let x = -wdt / 2; x < wdt / 2; x++) { const f = (x + wdt / 2) / wdt; set(tx + x, by * K - y, f > 0.66 ? barkS : f < 0.3 ? barkH : (spc === 'cau' && (y >> 2) % 3 === 0 ? barkS : hash2(x + 3, y >> 1) < 0.08 ? barkS : bark)); } }
  const ty = by * K - th * K;
  const fall = season === 'fall', pal = spc === 'maiL' ? LEAFPAL.spring : fall ? LEAFPAL[spc === 'bang' ? 'fallC' : (v + (spc === 'me' ? 1 : 0)) % 2 ? 'fallB' : 'fallA'] : LEAFPAL[season === 'spring' ? 'spring' : 'summer'];
  const P = spc === 'me' && !fall ? pal.map(c => mixc(c, 0x9ab844, 0.15)) : pal;
  const blossom = spc === 'maiL' ? [0xf7d24a, 0xffeca0, 0.36] : season === 'spring' ? (spc === 'mai' ? (v % 2 ? [0xf3a0c0, 0xfcd4e2, 0.4] : [0xf7d24a, 0xffeca0, 0.4]) : [[0xfbc4d8, 0xfff4ec, 0.05], [0xfff4ec, 0xffeca0, 0.04], [0xf2a0b5, 0xfbc4d8, 0.07]][v % 3]) : null;
  if (spc === 'cau') {
    const fc = winter ? [0x4a6050, 0x6c8a70, 0x9ab49a] : fall ? [0x4e6a34, 0x7a9440, 0xa4b65a] : [0x24502e, 0x3e7a3c, 0x6aa24a];
    for (let i = 0; i < 11; i++) { const a = -Math.PI * (0.06 + 0.88 * i / 10), len = sr(R, 13, 18) * K; for (let s2 = 0; s2 < len; s2++) { const nx = tx + Math.cos(a) * s2, ny = ty + Math.sin(a) * s2 * 0.72 + s2 * s2 * 0.018 / K; set(nx, ny, fc[2]); set(nx, ny + 1, fc[1]); if (s2 > 4 && s2 % 3 === 0) { set(nx - 1, ny + 2, fc[0]); set(nx + 1, ny + 3, fc[0]); set(nx, ny + 2, fc[1]); } } }
    for (let i = 0; i < 4; i++) set(tx - 2 + i, ty + 3, 0x7a5a3a);
    if (season === 'winter' && v % 2 === 0) for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) if (get(x, y) === fc[2] && get(x, y - 1) < 0 && hash2(x, y + v) < 0.6) set(x, y - 1, SN);
  } else if (winter) {
    const line = (x0, y0, x1, y1, c, thick) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / (n || 1), y = y0 + (y1 - y0) * i / (n || 1); for (let t = 0; t < thick; t++) set(x + t, y, t === thick - 1 && thick > 1 ? barkS : c); } };
    const br = (x, y, a, len, dep) => { const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len; line(x, y, x1, y1, bark, Math.max(1, dep)); if (dep > 0) for (let i = 0; i < (dep > 2 ? 3 : 2); i++) br(x1, y1, a + sr(R, -0.7, 0.7), len * sr(R, 0.6, 0.78), dep - 1); };
    const n0 = spc === 'mai' ? 2 : 3, l0 = { dau: 9, me: 10, bang: 9, mai: 5 }[spc] * K;
    for (let i = 0; i < n0; i++) br(tx, ty + 3, -Math.PI / 2 + (i - (n0 - 1) / 2) * 0.75 + sr(R, -0.15, 0.15), l0, spc === 'mai' ? 2 : 3);
    if (v % 2 === 0) for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) { const c = get(x, y); if (c >= 0 && c !== SN && get(x, y - 1) < 0 && hash2(x * 3, y + v) < 0.7) set(x, y - 1, SN); }
  } else {
    // canopy puffs: [x, y, r] in art px, drawn back (top) to front (bottom)
    const E = [];
    const pf = (n, sx, sy, r0, r1, oy) => { for (let i = 0; i < n; i++) E.push([tx + sr(R, -sx, sx) * K, ty + (oy + sr(R, -sy, sy)) * K, sr(R, r0, r1) * K]); };
    if (spc === 'dau') pf(7, 9, 7, 6, 8.5, -6);
    else if (spc === 'me') pf(9, 16, 5, 6, 8.5, -3);
    else if (spc === 'bang') for (const [oy, sx] of [[4, 13], [-3, 11], [-9, 8], [-14, 5]]) pf(4, sx, 1.5, 4.2, 5.6, oy);
    else if (spc === 'mai') pf(5, 6, 4, 3.6, 5.2, -3);
    else pf(9, 11, 7, 5.5, 8, -5);
    E.sort((a, b) => a[1] - b[1]);
    for (const [ex, ey, er] of E) for (let y = Math.floor(ey - er); y <= ey + er; y++) for (let x = Math.floor(ex - er); x <= ex + er; x++) {
      const dx = (x - ex) / er, dy = (y - ey) / er, d = dx * dx + dy * dy, edge = 1 - (hash2(x >> 1, y >> 1) * 0.14);
      if (d > edge) continue;
      const l = -dx * 0.55 - dy * 0.75 + (1 - d) * 0.3 + (hash2(x >> 1, (y >> 1) + 7) - 0.5) * 0.3;
      let c = l > 0.55 ? P[3] : l > 0.1 ? P[2] : l > -0.35 ? P[1] : P[0];
      if (d > edge - 0.12 && get(x, y) >= 0 && get(x, y) !== c) c = mixc(P[0], INK, 0.25);       // dark crease where a puff overlaps the one behind it
      if (fall && hash2(x >> 1, y >> 1) < 0.08) continue;
      set(x, y, c);
    }
    if (blossom) for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { if (get(x, y) < 0 || get(x, y) === bark) continue; const h = hash2(x * 7 + v, y * 3); if (h < blossom[2]) { const c = h < blossom[2] * 0.5 ? blossom[0] : blossom[1]; set(x, y, c); set(x + 1, y, c); set(x, y + 1, mixc(c, 0x6a3f45, 0.2)); } }
  }
  const out = inkGrid(g, W, H, 0.8);
  const s = gridCanvas(out, W, H, null, K); s.ax = bx; s.ay = by; s.split = Math.round(by - th * 0.55); s.cx = tx / K - bx; s.cy = -(th + 6); s.rad = { dau: 13, me: 17, bang: 17, mai: 8, cau: 12, maiL: 14 }[spc]; s.bare = winter && spc !== 'cau'; s.spc = spc;
  return (_tree[key] = s);
}
// soft dithered ground shadow
const _shadow = {};
function shadowSprite(r) { r = Math.round(r * K); if (_shadow[r]) return _shadow[r]; const w = r * 4 + 2, h = r * 2 + 2, c = mk(w, h), g = c.getContext('2d'); g.fillStyle = 'rgba(74,38,40,0.22)'; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const nx = (x - w / 2 + 0.5) / (r * 2), ny = (y - h / 2 + 0.5) / r, d = nx * nx + ny * ny; if (d < 0.6 || (d < 1 && (x + y) % 2 === 0)) g.fillRect(x, y, 1, 1); } return (_shadow[r] = c); }

// ----- props (boxes centred on their tile; facing +y unless mirrored) -----
const stripe = (a, b, n) => (f, u, v) => f === 0 ? (((u / n) | 0) % 2 ? a : b) : undefined;
const speck = (c, amt) => (f, u, v) => hash2(u * 3 + f * 9, v * 3) < amt ? shade(c, -0.14) : undefined;
const FLOWERS = { spring: [0xf39abf, 0xf7d94a, 0xf7f4ec, 0xe8505b], summer: [0xe8505b, 0xf08a2b, 0xf7d94a], fall: [0xf08a2b, 0xd9a55a, 0xc0622a], winter: [0xf4f8fe] };
const plantP = (season, dens) => (f, u, v, b, wx, wy) => { const fl = FLOWERS[season], h = hash2(u * 5 + f * 7 + (wx | 0), v * 5 + (wy | 0)); if (h < dens) return fl[(h * 97 | 0) % fl.length]; return h > 0.7 ? (season === 'fall' ? 0x7a8a4a : season === 'winter' ? 0x6a8a70 : 0x3f8a4a) : undefined; };
const PROP = {
  stool: (s, v) => [box(-1.5, -1.5, 0, 3, 3, 3, [0xd9534f, 0x3d6fb5, 0x4f9a58, 0xf2c94c][v % 4])],
  table: (s, v) => [box(-2.5, -2.5, 0, 5, 5, 3.8, [0x4a7ab8, 0xb8c0c8, 0x9a6a3a][v % 3]), box(-1.4, -0.6, 3.8, 1.2, 1.2, 1.5, 0x6b4226), box(0.6, 0.2, 3.8, 1.2, 1.2, 1.5, 0xcfe3ea)],
  parasol: (s, v) => { const c = [0xd9534f, 0x3d6fb5, 0x2f9f8f, 0xf2c94c, 0xf08a4b][v % 5]; return [box(-0.5, -0.5, 0, 1, 1, 20, 0x8a8f98), box(-9, -9, 20, 18, 18, 1.6, c, (f, u, v2) => f === 0 ? ((u > 9) !== (v2 > 9) ? c : 0xf7f4ec) : undefined, { nf: 1 })]; },
  bench: () => [box(-7, -2, 0, 14, 4, 3.4, 0xcfc9bb, speck(0xcfc9bb, 0.25)), box(-7, -2.6, 3.4, 14, 1.2, 4.2, 0xcfc9bb, (f, u, v) => f === 1 && textAt('BIA 33', u - 2, v - 0.8) ? 0x3d6fb5 : undefined)],
  cartBanhmi: () => [box(-4, -3.4, 0, 3, 0.8, 3, DKC), box(2, -3.4, 0, 3, 0.8, 3, DKC), box(-5, -3, 2, 10, 6, 5, 0xe8e0c8, (f, u, v) => f === 1 && textAt('BANHMI', u - 0.5, v) ? 0xc0392b : undefined), box(-5, -3, 7, 10, 6, 6, 0xbfe0ea, (f, u, v, b) => { if (f === 0) return 0xd9534f; const W = f === 1 ? b.w : b.d; if (u < 0.8 || u > W - 0.8 || v > 5.2) return 0xc9c2b0; return v < 2.6 && hash2(u * 2, 1) > 0.35 ? 0xd9a55a : 0xcfe9f0; }, { em: 0x4a4020 })],
  cartPho: () => [box(-5, -3.4, 0, 3, 0.8, 3, DKC), box(3, -3.4, 0, 3, 0.8, 3, DKC), box(-6, -3, 2, 12, 6, 5.5, 0xb8c0c8, (f, u, v) => f === 1 && textAt('PHO', u - 3, v) ? 0xc0392b : undefined), box(-4.6, -2, 7.5, 4, 4, 3, 0x8a939d), box(1, -2, 7.5, 2.6, 2.6, 2, 0xf4f1e8), box(-6, -3, 7.5, 0.7, 0.7, 9, MTL), box(5.3, -3, 7.5, 0.7, 0.7, 9, MTL), box(-6, 2.3, 7.5, 0.7, 0.7, 9, MTL), box(5.3, 2.3, 7.5, 0.7, 0.7, 9, MTL), box(-6.5, -3.5, 16.5, 13, 7, 1, 0x4a7ab8, stripe(0x4a7ab8, 0xf4f1e8, 2))],
  cartMia: () => [box(-4, -3.4, 0, 3, 0.8, 3, DKC), box(2, -3.4, 0, 3, 0.8, 3, DKC), box(-5, -3, 2, 10, 6, 6, 0x58994f, (f, u, v) => f === 1 && textAt('MIA', u - 2, v - 0.5) ? 0xf7f4ec : undefined), box(1.5, -2, 8, 3, 1.2, 4, 0xd03a3a), box(-4.5, -2.5, 8, 1.8, 5, 9, 0x9fc060, (f, u, v) => (v | 0) % 3 === 0 ? 0x7a9a48 : undefined), box(-1.5, 0, 8, 2, 2, 3, 0xdff0c0)],
  cartChe: () => [box(-4, -3.4, 0, 3, 0.8, 3, DKC), box(2, -3.4, 0, 3, 0.8, 3, DKC), box(-5, -3, 2, 10, 6, 5, 0x4fa3a0, (f, u, v) => f === 1 && textAt('CHE', u - 2, v) ? 0xf7f4ec : undefined), box(-4, -2, 7, 2, 2, 2.6, 0xf2c94c), box(-1, -2, 7, 2, 2, 2.6, 0xc94f6a), box(2, -2, 7, 2, 2, 2.6, 0x9fd8b4), box(-0.4, -0.4, 7, 0.8, 0.8, 11, MTL), box(-7, -6, 18, 14, 12, 1.2, 0xf2c94c, (f, u, v) => f === 0 ? ((u > 7) !== (v > 6) ? 0xf2c94c : 0xd9534f) : undefined)],
  tuThuoc: () => [box(-3, -2, 0, 6, 4, 4, 0x7a5a3a), box(-3, -2, 4, 6, 4, 6, 0xbfe0ea, (f, u, v, b) => { if (f === 0) return 0x7a5a3a; const W = f === 1 ? b.w : b.d; if (u < 0.6 || u > W - 0.6 || v > 5.3) return 0x7a5a3a; return [0xd9534f, 0xf7f4ec, 0x3d6fb5, 0xf2c94c][((u * 1.1 | 0) + (v / 2 | 0) * 3) % 4]; })],
  vend: () => [box(-3.5, -3, 0, 7, 6, 15, 0xd9534f, (f, u, v) => { if (f !== 1) return undefined; if (v > 6 && v < 13 && u > 1 && u < 6) { EM = 0xbfe8ff; return (u * 1.2 | 0) % 2 && (v | 0) % 3 ? [0xf2c94c, 0x4fa3a0, 0xf08a4b][(u + v | 0) % 3] : 0xe8f4fa; } if (v > 1.5 && v < 3.5 && u > 1.5 && u < 5.5) return 0x2a2a30; })],
  pole: (s, v) => { const B = [box(-0.8, -0.8, 0, 1.6, 1.6, 42, 0x9a968c), box(-4, -0.5, 37, 8, 1, 1, 0x6b6258), box(-3, -0.5, 33, 6, 1, 1, 0x6b6258), box(-0.4, 0.8, 30, 0.8, 6, 0.8, MTL), box(-1.2, 5.4, 29, 2.4, 2.8, 1.1, 0xfff4c0, null, { em: 0xffe9a0 })]; if (v === 1) B.push(box(-2.2, -2.6, 23, 4.4, 1.8, 5.5, 0x7a8088)); if (v === 2) B.push(box(0.8, -1.4, 34, 3, 2.8, 2.6, 0xa8aeb6)); return B; },
  lamp: () => [box(-0.6, -0.6, 0, 1.2, 1.2, 22, 0x3a4a44), box(-1.8, -1.8, 22, 3.6, 3.6, 3, 0xfff4c0, null, { em: 0xffe9a0 }), box(-2.2, -2.2, 25, 4.4, 4.4, 1, 0x3a4a44)],
  signal: () => [box(-0.6, -0.6, 0, 1.2, 1.2, 25, 0x4a4a52), box(-1.5, -1.5, 25, 3, 3, 8, 0x2a2a30)],
  bin: () => [box(-2, -2, 0, 4, 4, 5, 0x4f8a5f), box(-2.2, -2.2, 5, 4.4, 4.4, 0.8, 0x3a6a48)],
  pot: (s, v) => [box(-2, -2, 0, 4, 4, 3, [0xb5651d, 0x4a7ab8, 0xe9e6dc][v % 3]), box(-2.6, -2.6, 3, 5.2, 5.2, v % 2 ? 7 : 4.5, s === 'winter' ? 0x5a7a60 : s === 'fall' ? 0x6a8a44 : 0x3f8a4a, plantP(s, v % 2 ? (s === 'spring' ? 0.4 : 0.1) : 0.22), { ns: s !== 'winter' })],
  maiPot: (s) => { return [box(-2.5, -2.5, 0, 5, 5, 4, 0x4a7ab8, (f, u, v) => f !== 0 && (v | 0) === 2 ? 0xf7f4ec : undefined)]; },
  planter: (s) => [box(-7, -2, 0, 14, 4, 2.6, 0xb9b2a4), box(-6.5, -1.5, 2.6, 13, 3, 3, s === 'winter' ? 0x5a7a60 : s === 'fall' ? 0x6a8a44 : 0x3f8a4a, plantP(s, s === 'spring' ? 0.45 : s === 'summer' ? 0.25 : 0.2))],
  barberChair: () => [box(-1, -1, 0, 2, 2, 2.6, MTL), box(-2.5, -2.5, 2.6, 5, 5, 2, 0xb23a3a), box(-2.5, -2.5, 4.6, 5, 1.2, 6, 0xb23a3a), box(-2.5, -1.3, 4.6, 0.8, 3.8, 2, MTL), box(1.7, -1.3, 4.6, 0.8, 3.8, 2, MTL)],
  mirror: () => [box(-4, -0.5, 7, 8, 1, 9, 0x8a6a4a, (f, u, v) => f === 1 && u > 1 && u < 7 && v > 1 && v < 8 ? (Math.abs(u - v) < 0.8 ? 0xf2fbff : 0xbfe0ea) : undefined), box(-4, 0.5, 5.6, 8, 1.6, 0.8, 0x8a6a4a), box(-3, 0.8, 6.4, 1, 1, 1.6, 0xd9534f), box(-1, 0.8, 6.4, 1, 1, 2, 0x4fa3a0)],
  tires: () => [box(-2.5, -2.5, 0, 5, 5, 6, DKC, (f, u, v) => f !== 0 && (v | 0) % 2 === 1 ? 0x3a3840 : undefined)],
  crates: (s, v) => [box(-3, -3, 0, 6, 6, 4, 0xc98a4a, (f, u, v2) => f !== 0 && (v2 | 0) % 2 === 0 ? 0xa8703a : undefined), box(-2.5, -2.5, 4, 5, 5, 3.6, [0x4a7ab8, 0xd9534f, 0x58994f][v % 3], (f, u, v2) => f === 0 ? ((u | 0) % 2 && (v2 | 0) % 2 ? 0x8a5a2a : undefined) : undefined)],
  booth: () => [box(-3, -3, 0, 6, 6, 17, 0x3d6fb5, (f, u, v, b) => f !== 0 && v > 5 && v < 15 && u > 1 && u < 5 ? 0x9fd0e8 : undefined), box(-3.4, -3.4, 17, 6.8, 6.8, 1.2, 0x2f5a95)],
  mailbox: () => [box(-0.6, -0.6, 0, 1.2, 1.2, 5, 0x6a6a70), box(-2, -2, 5, 4, 4, 5, 0xf2c23a, (f, u, v) => f === 1 && (v | 0) === 3 && u > 0.8 && u < 3.2 ? 0x2a2a30 : undefined)],
  fountain: () => [box(-13, -13, 0, 26, 26, 3, 0xbfc3c8, (f, u, v) => f === 0 && u > 2 && u < 24 && v > 2 && v < 24 ? (hash2(u * 2, v * 2) > 0.85 ? 0xb8e4f2 : 0x6fb8d8) : undefined, { ns: 1 }), box(-2, -2, 0, 4, 4, 9, 0xbfc3c8), box(-4.5, -4.5, 9, 9, 9, 1.6, 0xbfc3c8, (f, u, v) => f === 0 && u > 1 && u < 8 && v > 1 && v < 8 ? 0x8fd0e8 : undefined), box(-1, -1, 10.6, 2, 2, 4, 0xcfeaf5)],
  statue: () => [box(-4.5, -4.5, 0, 9, 9, 7, 0xb9b2a4, (f, u, v) => f !== 0 && v > 5.4 ? 0x9a9488 : undefined), box(-2, -1.6, 7, 4, 3.2, 8, 0x7f9488), box(-3.2, -1, 11, 6.4, 2, 2.6, 0x7f9488), box(-1.4, -1.4, 15, 2.8, 2.8, 3, 0x7f9488)],
  stall: (s, v) => { const c = [0x58994f, 0xf08a2b, 0xd9534f, 0xf2c94c, 0xe9e6dc][v % 5]; return [box(-6, -4, 0, 12, 8, 5, 0x8a6a4a, (f, u, v2) => f !== 0 && (u | 0) % 4 === 0 ? 0x6b4f34 : undefined), box(-5.6, -3.6, 5, 11.2, 7.2, 2, c, (f, u, v2) => { const h = hash2(u * 1.3 + v * 7, v2 * 1.3 + f); return h < 0.3 ? [0xd9534f, 0xf2c94c, 0x9fd8b4, 0xf08a2b, 0x8a5ab8][(h * 50 | 0) % 5] : undefined; })]; },
  leafpile: () => [box(-3.5, -3.5, 0, 7, 7, 2, 0xd98a3a, (f, u, v) => hash2(u * 3 + f, v * 3) < 0.4 ? 0xf2c14a : hash2(u * 5, v * 2 + f) < 0.3 ? 0xa8502a : undefined), box(-2, -2, 2, 4, 4, 1.6, 0xe6a03a, speck(0xc0622a, 0.4))],
  snowman: () => [box(-3, -3, 0, 6, 6, 5, 0xf4f8fe, null, { ns: 1 }), box(-2.2, -2.2, 5, 4.4, 4.4, 4, 0xf4f8fe, (f, u, v) => f === 1 && (v | 0) === 2 && ((u | 0) === 1 || (u | 0) === 3) ? 0x2a2140 : f === 1 && (v | 0) === 1 && (u | 0) === 2 ? 0xf08a2b : undefined, { ns: 1 }), box(-2.6, -2.6, 9, 5.2, 5.2, 0.8, 0xecdca6, null, { ns: 1 }), box(-1.2, -1.2, 9.8, 2.4, 2.4, 1.6, 0xecdca6, null, { ns: 1 })],
  flag: () => [box(-0.4, -0.4, 0, 0.8, 0.8, 30, MTL), box(0.4, -0.3, 23, 9, 0.6, 6, 0xd9281e, (f, u, v) => f === 1 && Math.abs(u - 4.5) + Math.abs(v - 3) * 1.2 < 2 ? 0xf7d94a : undefined, { raw: 1 })],
  gate: (s, v) => [box(-9, -0.8, 0, 1.6, 1.6, 21, 0xd8d2c4), box(7.4, -0.8, 0, 1.6, 1.6, 21, 0xd8d2c4), box(-9, -0.8, 21, 18, 1.6, 6, 0x3d6fb5, (f, u, v2) => f === 1 && textAt('HEM ' + (11 + v * 18), u - 1.5, v2 - 0.6) ? 0xf7f4ec : undefined)],
  fence: () => [box(-4, -0.5, 0, 8, 1, 5, 0xd8d2c4, (f, u, v) => f === 1 && v > 1 && v < 4.2 && (u | 0) % 2 ? -1 : undefined)],
  parked: (s, v) => rotBoxes(vehModel('moto', v), 1),
  parkedBike: (s, v) => rotBoxes(vehModel('bike', v), 1),
  parkedCyclo: (s, v) => rotBoxes(vehModel('cyclo', v), 0),
  sack: () => [box(-2.5, -2, 0, 5, 4, 3, 0xd8c8a0, speck(0xd8c8a0, 0.3)), box(-2, -1.5, 3, 4, 3, 2.4, 0xcbb98c)],
  giay: (s, v) => [box(-3, -3, 0, 6, 6, 3, [0xb5651d, 0x8a7a6a][v % 2]), box(-4, -4, 3, 8, 8, 9 + (v % 3) * 3, s === 'winter' ? 0x6a8a70 : 0x3f8a4a, (f, u, v2, b, wx, wy) => { const h = hash2(u * 5 + f * 3 + (wx | 0), v2 * 5 + (wy | 0)); return s !== 'winter' && h < 0.55 ? (h < 0.2 ? 0xf7a8d0 : 0xe0508a) : h > 0.8 ? 0x6ab04a : undefined; })],
  kite: () => [box(0, 0, 0, 1, 1, 1, 0)]
};
const SEASONAL_PROPS = { pot: 1, planter: 1, maiPot: 1, giay: 1 };
const _prop = {};
function propSprite(name, season, v, mirror) {
  const snow = season === 'winter', k = name + '|' + (SEASONAL_PROPS[name] ? season : snow ? 'w' : '') + '|' + (v || 0) + (mirror ? 'm' : '');
  if (_prop[k]) return _prop[k];
  if (typeof PLANTS !== 'undefined' && PLANTS[name]) return (_prop[k] = plantSprite(name, season, v || 0));
  let b = PROP[name](season, v || 0); if (mirror) b = mirrorBoxes(b);
  return (_prop[k] = bake(b, { snow: snow && name !== 'parked' && name !== 'parkedBike' }));
}
