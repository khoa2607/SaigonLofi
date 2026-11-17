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
  umb: ['..VVVV..', '.VVVVVV.', 'VVVVVVVV', '...K....', '...K....', '...K.K..', '...KK...', '........'],
  cyclo: ['......K.', '.RR...K.', '.RRR.KK.', 'RRRRSSK.', 'KKSSSKKK', 'K.K..K.K', 'KKK..KKK', '........']
};
const BUB = {};
function initIcons() {
  for (const k in ICON_SRC) {
    const W = 14, H = 14, g = new Int32Array(W * H).fill(-1), ink = 0x2a2140, wh = 0xfffaf0;
    for (let y = 0; y < 11; y++) for (let x = 0; x < 12; x++) { const edge = x === 0 || y === 0 || x === 11 || y === 10, corner = (x === 0 || x === 11) && (y === 0 || y === 10); if (!corner) g[y * W + x + 1] = edge ? ink : wh; }
    g[11 * W + 3] = ink; g[11 * W + 4] = wh; g[11 * W + 5] = ink; g[12 * W + 3] = ink; g[12 * W + 4] = ink; g[10 * W + 4] = wh;
    const src = ICON_SRC[k];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const ch = src[y][x]; if (ch !== '.') g[(y + 1) * W + x + 3] = ICON_PAL[ch]; }
    BUB[k] = gridCanvas(g, W, H).c;
  }
}

// ----- people -----
const PW = 20, PH = 26, NPOSE = 8;   // poses: 0 stand, 1-4 walk, 5 sit, 6 arm up, 7 talk
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
function drawPerson(L, back, pose) {
  const G = new Int32Array(PW * PH).fill(-1);
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < PW && y < PH) G[y * PW + x] = c; };
  const rect = (xa, ya, xb, yb, c) => { for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) set(x, y, c); };
  const dk = c => shade(c, -0.22);
  const kid = L.kid, sit = pose === 5, th = kid ? 4 : 6, lh = kid ? 4 : 6, pass = pose === 2 || pose === 4;
  const yL = 22 - lh + (sit ? 2 : 0), yT = yL - th - (pass ? 1 : 0), yH = yT - 6;
  const skin = L.skin, top = L.poncho ? L.ponchoC : L.top, bot = L.bot, shoe = L.shoe, hair = L.hair;
  const legC = (j, n) => L.dress === 1 || L.dress === 3 ? skin : (L.legs === 'short' && j >= 2) ? skin : bot;
  // --- legs
  if (sit) { rect(7, yL, 12, yL + 1, L.dress ? (L.dress === 2 ? top : L.dress === 3 ? top : bot) : bot); for (let y = yL + 2; y <= 21; y++) { set(7, y, legC(3)); set(8, y, legC(3)); set(11, y, dk(legC(3))); set(12, y, dk(legC(3))); } rect(7, 22, 8, 22, shoe); rect(11, 22, 12, 22, dk(shoe)); }
  else if (pose === 1 || pose === 3) {
    const a = pose === 1 ? 7 : 11, b = pose === 1 ? 11 : 7;
    for (let y = yL; y <= 21; y++) { set(a, y, legC(y - yL)); set(a + 1, y, legC(y - yL)); } rect(a, 22, a + 1, 22, shoe);
    for (let y = yL; y <= 20; y++) { set(b, y, dk(legC(y - yL))); set(b + 1, y, dk(legC(y - yL))); } rect(b, 21, b + 1, 21, dk(shoe));
    rect(8, yL, 11, yL, legC(0));
  } else { for (let y = yL - (pass ? 1 : 0); y <= 21; y++) { const j = y - yL; set(8, y, legC(j)); set(9, y, legC(j)); set(10, y, dk(legC(j))); set(11, y, dk(legC(j))); } rect(8, 22, 9, 22, shoe); rect(10, 22, 11, 22, dk(shoe)); }
  if (!sit) {
    if (L.dress === 1) { rect(7, yL - (pass ? 1 : 0), 12, yL + (kid ? 1 : 2), bot); for (let y = yL; y <= yL + (kid ? 1 : 2); y++) set(12, y, dk(bot)); }
    else if (L.dress === 2) { rect(8, yL - (pass ? 1 : 0), 11, yL + 3, top); set(11, yL + 3, dk(top)); set(11, yL + 2, dk(top)); }
    else if (L.dress === 3) { rect(7, yL - (pass ? 1 : 0), 12, yL + 4, top); for (let y = yL; y <= yL + 4; y++) set(12, y, dk(top)); }
  }
  // --- torso
  rect(7, yT, 12, yT + th - 1, top); for (let y = yT; y < yT + th; y++) set(12, y, dk(top));
  if (L.pattern && !L.poncho) for (let y = yT; y < yT + th; y++) for (let x = 7; x <= 12; x++) if ((x + y * 2) % 3 === 0) set(x, y, L.pattern);
  if (!back && !L.poncho) { if (L.tie) { set(9, yT, 0xf7f5ee); set(10, yT, 0xf7f5ee); for (let j = 1; j < 4; j++) set(9, yT + j, L.tie); } else if (L.sleeve !== 'long' || L.type === 'youth') { set(9, yT, skin); set(10, yT, skin); } }
  if (L.apron && !back) rect(8, yT + 2, 11, yT + th - 1, 0xf7f4ec);
  // --- arms
  const armC = (j) => L.poncho ? top : L.sleeve === 'long' ? top : L.sleeve === 'none' ? skin : (j < 2 ? top : skin);
  const arm = (x, a, b2, hand) => { for (let j = a; j <= b2; j++) set(x, yT + j, j === b2 && hand ? skin : (x > 9 ? dk(armC(j)) : armC(j))); };
  const al = th - 2;                                                  // last arm row (hand)
  if (pose === 1) { arm(6, 1, al + 1, 1); arm(13, 0, al - 1, 1); }
  else if (pose === 3) { arm(6, 0, al - 1, 1); arm(13, 1, al + 1, 1); }
  else if (pose === 6) { arm(6, 0, al, 1); for (let j = -3; j <= 1; j++) set(13, yT + j, dk(j >= 0 || L.sleeve === 'long' || L.poncho ? top : skin)); set(13, yT - 4, skin); }
  else if (pose === 7) { arm(6, 0, al, 1); set(13, yT, dk(armC(0))); set(13, yT + 1, dk(armC(1))); set(13, yT + 2, dk(armC(2))); set(14, yT + 2, armC(3)); set(14, yT + 1, skin); }
  else { arm(6, 0, al, 1); arm(13, 0, al, 1); }
  // --- head
  rect(7, yH + 1, 12, yH + 4, skin); rect(8, yH, 11, yH, skin); rect(8, yH + 5, 11, yH + 5, skin); for (let y = yH + 1; y <= yH + 4; y++) set(12, y, shade(skin, -0.1));
  const hs = L.hs, h2 = shade(hair, -0.2), hl = shade(hair, 0.18);
  if (hs !== 7) {
    if (back) { rect(8, yH, 11, yH, hair); rect(7, yH + 1, 12, yH + 3, hair); set(8, yH + 1, hl); set(12, yH + 2, h2); set(12, yH + 3, h2); if (hs === 4) { rect(8, yH, 11, yH + 1, skin); } }
    else { rect(8, yH, 11, yH, hair); rect(7, yH + 1, 12, yH + 1, hair); set(7, yH + 2, hair); set(12, yH + 2, h2); set(8, yH + 2, hair); set(9, yH + 1, hl); if (hs === 4) { rect(8, yH, 11, yH + 1, skin); set(8, yH + 2, skin); } }
    if (hs === 1) { if (back) rect(7, yH + 4, 12, yH + 8, hair), set(12, yH + 6, h2), set(9, yH + 5, hl); else { for (let y = yH + 2; y <= yH + 7; y++) { set(6, y, hair); set(13, y, h2); } } }
    else if (hs === 2) { if (back) { rect(9, yH + 4, 10, yH + 8, hair); set(10, yH + 8, h2); } else { set(13, yH + 2, h2); set(13, yH + 3, h2); set(14, yH + 4, h2); } }
    else if (hs === 3) { rect(9, yH - 1, 10, yH - 1, hair); if (back) rect(9, yH - 2, 10, yH - 2, h2); }
    else if (hs === 5) { if (back) rect(7, yH + 4, 12, yH + 5, hair); else { for (let y = yH + 2; y <= yH + 5; y++) { set(6, y, hair); set(13, y, h2); } } }
    else if (hs === 6) rect(8, yH - 1, 11, yH - 1, hair);
  }
  if (!back) { set(9, yH + 3, 0x2a2140); set(12, yH + 3, 0x2a2140); if (L.mask) rect(7, yH + 4, 12, yH + 5, 0xcfe6f2); if (L.blush) set(8, yH + 4, mixc(skin, 0xf07a8a, 0.45)); if (L.glasses) { set(8, yH + 3, 0x3a3050); set(10, yH + 3, 0x3a3050); set(12, yH + 3, 0x3a3050); } }
  // --- hats
  const hat = L.poncho ? 0 : L.hat, hc = L.hatC;
  if (hat === 'non') { const s = 0xecdca6, s2 = 0xcdb87c; rect(9, yH - 2, 10, yH - 2, s); rect(8, yH - 1, 11, yH - 1, s); rect(6, yH, 13, yH, s); rect(5, yH + 1, 14, yH + 1, s); set(11, yH - 1, s2); rect(11, yH, 13, yH, s2); rect(11, yH + 1, 14, yH + 1, s2); }
  else if (hat === 'coi' || hat === 'beo') { const c = hat === 'coi' ? 0x6f8250 : hc; rect(7, yH - 1, 12, yH, c); rect(6, yH + 1, 13, yH + 1, c); set(12, yH - 1, dk(c)); set(12, yH, dk(c)); set(13, yH + 1, dk(c)); set(8, yH - 1, shade(c, 0.2)); }
  else if (hat === 'helm') { rect(7, yH - 1, 12, yH + 1, hc); rect(8, yH - 2, 11, yH - 2, hc); set(9, yH - 1, shade(hc, 0.3)); set(12, yH, dk(hc)); set(12, yH + 1, dk(hc)); if (back) rect(7, yH + 2, 12, yH + 2, hc); else { set(7, yH + 2, 0x2a2a30); } }
  else if (hat === 'cap') { rect(7, yH, 12, yH + 1, hc); rect(8, yH - 1, 11, yH - 1, hc); set(12, yH, dk(hc)); if (!back) { set(12, yH + 2, hc); set(13, yH + 2, hc); set(14, yH + 2, dk(hc)); } }
  else if (hat === 'len') { rect(7, yH - 1, 12, yH + 1, hc); rect(7, yH + 1, 12, yH + 1, shade(hc, 0.25)); set(12, yH, dk(hc)); rect(9, yH - 2, 10, yH - 2, 0xf7f4ec); }
  // --- neck things
  if (L.poncho) { rect(6, yT, 13, yL + 1, top); rect(5, yT + 2, 14, yL, top); for (let y = yT; y <= yL + 1; y++) set(13, y, dk(top)); for (let y = yT + 2; y <= yL; y++) set(14, y, dk(top)); if (back) { rect(7, yH, 12, yH + 5, top); rect(8, yH - 1, 11, yH - 1, top); set(12, yH + 2, dk(top)); } else { rect(8, yH - 1, 11, yH - 1, top); rect(7, yH, 12, yH + 1, top); for (let y = yH + 2; y <= yH + 5; y++) { set(6, y, top); set(13, y, dk(top)); } rect(8, yH + 5, 11, yH + 5, top); set(9, yH + 1, shade(top, 0.3)); } }
  else {
    if (L.scarf) { rect(7, yT, 12, yT, L.scarf); if (back) { set(11, yT + 1, L.scarf); set(11, yT + 2, dk(L.scarf)); } else { set(8, yT + 1, L.scarf); set(8, yT + 2, dk(L.scarf)); } }
    if (L.kq) { const r = 0xd9281e; if (back) { rect(8, yT, 11, yT, r); set(9, yT + 1, r); set(10, yT + 1, r); } else { rect(8, yT, 11, yT, r); set(9, yT + 1, r); set(10, yT + 2, r); } }
  }
  // --- carried things
  if (L.ganh && !sit) { const bob = pose === 1 ? 1 : pose === 3 ? -1 : 0, pc = 0x8a6a3a, st = 0x5a4a3a, bk = 0xc9a86a; rect(1, yT, 18, yT, pc); for (let j = 1; j <= 4; j++) { set(2, yT + j + (bob > 0 ? 1 : 0), st); set(17, yT + j + (bob < 0 ? 1 : 0), st); } const ya = yT + 5 + (bob > 0 ? 1 : 0), yb = yT + 5 + (bob < 0 ? 1 : 0); rect(0, ya, 4, ya + 2, bk); rect(1, ya - 1, 3, ya - 1, L.goods); rect(0, ya + 2, 4, ya + 2, dk(bk)); rect(15, yb, 19, yb + 2, bk); rect(16, yb - 1, 18, yb - 1, L.goods); rect(15, yb + 2, 19, yb + 2, dk(bk)); }
  if (L.pack && !L.poncho) { if (back) { rect(8, yT, 11, yT + th - 2, L.pack); rect(8, yT + th - 2, 11, yT + th - 2, dk(L.pack)); set(9, yT + 1, shade(L.pack, 0.25)); } else { for (let j = 0; j < 3; j++) { set(7, yT + j, dk(L.pack)); set(12, yT + j, dk(L.pack)); } } }
  const hx = 6, hy = yT + al + (pose === 1 ? 1 : pose === 3 ? -1 : 0), cy = L.carry;
  if (cy === 'phone' && !back) { set(hx - 1, hy - 1, 0x2a2a30); set(hx - 1, hy - 2, 0x9fd8ff); }
  if (cy === 'cup') { set(hx - 1, hy - 1, 0xcfe3ea); set(hx - 1, hy, 0x8a5a3a); }
  else if (cy === 'bag' && !sit) { set(hx, hy + 1, 0x3a3050); rect(hx - 1, hy + 2, hx + 1, hy + 4, L.bag); rect(hx - 1, hy + 4, hx + 1, hy + 4, dk(L.bag)); }
  else if (cy === 'case' && !sit) { rect(hx - 2, hy + 1, hx + 1, hy + 3, 0x6b4a36); rect(hx - 2, hy + 3, hx + 1, hy + 3, 0x4f3626); set(hx, hy + 1, 0xc9a86a); }
  else if (cy === 'banhmi') { set(hx - 1, hy - 2, 0xd9a55a); set(hx - 1, hy - 1, 0xd9a55a); set(hx - 1, hy, 0xf7f4ec); }
  else if (cy === 'shop' && !sit) { rect(hx - 2, hy + 1, hx, hy + 4, 0xf2a0b5); rect(hx - 2, hy + 1, hx, hy + 1, 0xd9534f); set(hx - 1, hy, 0x58994f); }
  // --- slim the figure (drop two body columns), then outline
  { const SQ = [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19], G2 = new Int32Array(PW * PH).fill(-1); for (let y = 0; y < PH; y++) for (let i = 0; i < SQ.length; i++) G2[y * PW + i + 1] = G[y * PW + SQ[i]]; G.set(G2); }
  const out = G.slice();
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { if (G[y * PW + x] >= 0) continue; let n = -1; if (x > 0 && G[y * PW + x - 1] >= 0) n = G[y * PW + x - 1]; else if (x < PW - 1 && G[y * PW + x + 1] >= 0) n = G[y * PW + x + 1]; else if (y > 0 && G[(y - 1) * PW + x] >= 0) n = G[(y - 1) * PW + x]; else if (y < PH - 1 && G[(y + 1) * PW + x] >= 0) n = G[(y + 1) * PW + x]; if (n >= 0) out[y * PW + x] = mixc(n, 0x221a33, 0.74); }
  return out;
}
// sheet: columns = poses, rows = front, back, front flipped, back flipped
function personSheet(L) {
  const W = PW * NPOSE, H = PH * 4, g = new Int32Array(W * H).fill(-1);
  for (let b = 0; b < 2; b++) for (let p = 0; p < NPOSE; p++) { const s = drawPerson(L, b === 1, p); for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const c = s[y * PW + x]; if (c < 0) continue; g[(b * PH + y) * W + p * PW + x] = c; g[((b + 2) * PH + y) * W + p * PW + PW - 1 - x] = c; } }
  return gridCanvas(g, W, H);
}
const DIR_ROW = [0, 2, 3, 1];       // dir 0:+x 1:+y 2:-x 3:-y -> sheet row
const DIRV = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// ----- umbrellas (3 frames: closed, half, open) -----
const UMB = [];
function initUmbrellas() {
  for (const c of UMBC) {
    const fr = [], c2 = shade(c, -0.2), c3 = shade(c, 0.25), ink = 0x2a2140;
    for (let f = 0; f < 3; f++) {
      const W = 17, H = 12, g = new Int32Array(W * H).fill(-1), set = (x, y, v) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y * W + x] = v; };
      for (let y = 5; y <= 10; y++) set(8, y, 0x5a5560);
      if (f === 0) { for (let y = 1; y <= 7; y++) { set(8, y, c); set(7, y, c2); } set(8, 0, ink); }
      else { const rows = f === 1 ? [[7, 9], [5, 11], [4, 12], [4, 12]] : [[6, 10], [3, 13], [1, 15], [0, 16], [0, 16]]; rows.forEach((r, y) => { for (let x = r[0]; x <= r[1]; x++) { const last = y === rows.length - 1; if (last && f === 2 && x % 4 === 2) continue; set(x, y, last ? c2 : ((x + 2) >> 2) % 2 ? c : c3); } }); set(8, 0, c3); }
      const o = g.slice(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y * W + x] < 0 && y < 6 && ((x > 0 && g[y * W + x - 1] >= 0) || (x < W - 1 && g[y * W + x + 1] >= 0) || (y > 0 && g[(y - 1) * W + x] >= 0 && g[(y - 1) * W + x] !== 0x5a5560))) o[y * W + x] = mixc(c, ink, 0.7);
      fr.push(gridCanvas(o, W, H));
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
  summer: [0x2a5c3a, 0x3f8a3e, 0x6fb03c, 0xb4d848], spring: [0x357a44, 0x55a048, 0x8cc84a, 0xcfe668],
  fallA: [0x9a6a20, 0xc98a2a, 0xe6b03a, 0xf5d05a], fallB: [0x8a4a1c, 0xc0622a, 0xe0853a, 0xf2a94e], fallC: [0x7a2f24, 0xa8402c, 0xcc5a34, 0xe58a4a]
};
const _tree = {};
function treeSprite(spc, season, v) {
  const key = spc + season + v; if (_tree[key]) return _tree[key];
  const R = mulberry32(spc.charCodeAt(0) * 131 + spc.charCodeAt(1) * 17 + v * 977 + 5), W = 76, H = 96, bx = 38, by = 92;
  const g = new Int32Array(W * H).fill(-1), set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = c; }, get = (x, y) => x >= 0 && y >= 0 && x < W && y < H ? g[y * W + x] : -1;
  const winter = season === 'winter', snowy = winter && v % 2 === 0, SN = 0xf4f8fe;
  const th = { dau: 38, me: 21, bang: 22, mai: 9, cau: 35 }[spc], tw = { dau: 4, me: 4, bang: 3, mai: 2, cau: 2 }[spc];
  const tc = spc === 'dau' ? 0x8f7a66 : spc === 'cau' ? 0x8a7a5a : 0x6b4a3a;
  let tx = bx;
  for (let y = 0; y <= th; y++) { const off = spc === 'cau' ? Math.round(Math.sin(y / th * 1.3) * 4) : 0; tx = bx + off; for (let x = 0; x < tw; x++) set(bx - (tw >> 1) + x + off, by - y, x === tw - 1 ? shade(tc, -0.28) : x === 0 ? shade(tc, 0.14) : (spc === 'cau' && y % 3 === 0 ? shade(tc, -0.12) : tc)); }
  set(bx - (tw >> 1) - 1, by, shade(tc, -0.1)); set(bx - (tw >> 1) + tw, by, shade(tc, -0.3));
  const ty = by - th, E = [];
  if (spc === 'dau') for (let i = 0; i < 6; i++) E.push([tx + sr(R, -9, 9), ty - 5 + sr(R, -9, 5), sr(R, 8, 12), sr(R, 7, 10)]);
  else if (spc === 'me') for (let i = 0; i < 7; i++) E.push([tx + sr(R, -16, 16), ty - 4 + sr(R, -7, 4), sr(R, 9, 13), sr(R, 7, 9)]);
  else if (spc === 'bang') E.push([tx - 8, ty + 4, 13, 5], [tx + 9, ty + 1, 12, 5], [tx - 3, ty - 4, 14, 5], [tx + 8, ty - 8, 9, 4], [tx - 7, ty - 10, 9, 4], [tx + 1, ty - 13, 8, 4]);
  else if (spc === 'mai') for (let i = 0; i < 5; i++) E.push([tx + sr(R, -7, 7), ty - 3 + sr(R, -5, 3), sr(R, 5, 8), sr(R, 4, 6)]);
  let pal = season === 'fall' ? LEAFPAL[spc === 'bang' ? 'fallC' : (v + (spc === 'me' ? 1 : 0)) % 2 ? 'fallB' : 'fallA'] : LEAFPAL[season === 'spring' ? 'spring' : 'summer'];
  if (spc === 'me' && season !== 'fall') pal = pal.map(c => mixc(c, 0x9ac040, 0.18));
  const line = (x0, y0, x1, y1, c, thick) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / (n || 1), y = y0 + (y1 - y0) * i / (n || 1); set(x, y, c); if (thick) set(x + 1, y, shade(c, -0.2)); } };
  if (spc === 'cau') {
    const fc = winter ? [0x58705a, 0x7a927a] : season === 'fall' ? [0x5a7a3a, 0x8aa04a] : [0x2f6a3c, 0x58a04f];
    for (let i = 0; i < 9; i++) { const a = -Math.PI * (0.08 + 0.84 * i / 8), len = sr(R, 13, 17); let px = tx, py = ty; for (let s = 0; s < len; s++) { const nx = tx + Math.cos(a) * s, ny = ty + Math.sin(a) * s * 0.75 + s * s * 0.035; set(nx, ny, fc[1]); set(nx, ny + 1, fc[0]); if (s > 3 && s % 2 === 0) set(nx, ny + 2, fc[0]); px = nx; py = ny; } }
    set(tx - 1, ty + 2, 0x7a5a3a); set(tx + 1, ty + 2, 0x6a4a2a); set(tx, ty + 3, 0x7a5a3a);
    if (snowy) for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) if (get(x, y) === fc[1] && get(x, y - 1) < 0 && hash2(x, y + v) < 0.6) set(x, y - 1, SN);
  } else if (winter) {
    const br = (x, y, a, len, dep) => { const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len; line(x, y, x1, y1, dep > 1 ? tc : shade(tc, -0.12), dep > 2); if (dep > 0) { const n = dep > 2 ? 3 : 2; for (let i = 0; i < n; i++) br(x1, y1, a + sr(R, -0.75, 0.75), len * sr(R, 0.6, 0.8), dep - 1); } };
    const n0 = spc === 'mai' ? 2 : 3, l0 = { dau: 9, me: 10, bang: 9, mai: 5 }[spc];
    for (let i = 0; i < n0; i++) br(tx, ty + 2, -Math.PI / 2 + (i - (n0 - 1) / 2) * 0.75 + sr(R, -0.15, 0.15), l0, spc === 'mai' ? 2 : 3);
    if (snowy) for (let y = 1; y < by - 6; y++) for (let x = 0; x < W; x++) { const c = get(x, y); if (c >= 0 && c !== SN && get(x, y - 1) < 0 && hash2(x * 3, y + v) < 0.7) set(x, y - 1, SN); }
  } else {
    const blossom = season === 'spring' ? (spc === 'mai' ? (v % 2 ? [0xf39abf, 0xfbc4d8, 0.62] : [0xf7d94a, 0xffeb90, 0.62]) : [[0xfbc4d8, 0xf7f4ec, 0.07], [0xf7f4ec, 0xffeb90, 0.06], [0xf2a0b5, 0xfbc4d8, 0.1]][v % 3]) : null;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let best = -9; for (const e of E) { const nx = (x - e[0]) / e[2], ny = (y - e[1]) / e[3], d = nx * nx + ny * ny; if (d < 1) { const t = -nx * 0.5 - ny * 0.8 + (1 - d) * 0.25; if (t > best) best = t; } }
      if (best < -8) continue;
      if (season === 'fall' && hash2(x + v * 31, y) < 0.13) continue;
      const t = best + (hash2(x, y + v * 13) - 0.5) * 0.42; let c = t > 0.55 ? pal[3] : t > 0.12 ? pal[2] : t > -0.32 ? pal[1] : pal[0];
      if (blossom && hash2(x * 7 + v, y * 3) < blossom[2]) c = hash2(x, y) < 0.5 ? blossom[0] : blossom[1];
      set(x, y, c);
    }
    for (let y = H - 2; y > 0; y--) for (let x = 1; x < W - 1; x++) { const c = get(x, y); if (pal.indexOf(c) > 0 && get(x, y + 1) < 0) set(x, y, pal[0]); }
  }
  const s = gridCanvas(g, W, H); s.ax = bx; s.ay = by; s.split = Math.round(by - th * 0.55); s.cx = tx - bx; s.cy = -(th + 6); s.rad = { dau: 13, me: 17, bang: 17, mai: 8, cau: 12 }[spc]; s.bare = winter && spc !== 'cau'; s.spc = spc;
  return (_tree[key] = s);
}
// soft dithered ground shadow
const _shadow = {};
function shadowSprite(r) { r = Math.round(r); if (_shadow[r]) return _shadow[r]; const w = r * 4 + 2, h = r * 2 + 2, c = mk(w, h), g = c.getContext('2d'); g.fillStyle = 'rgba(38,30,66,0.2)'; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const nx = (x - w / 2 + 0.5) / (r * 2), ny = (y - h / 2 + 0.5) / r, d = nx * nx + ny * ny; if (d < 0.6 || (d < 1 && (x + y) % 2 === 0)) g.fillRect(x, y, 1, 1); } return (_shadow[r] = c); }

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
  let b = PROP[name](season, v || 0); if (mirror) b = mirrorBoxes(b);
  return (_prop[k] = bake(b, { snow: snow && name !== 'parked' && name !== 'parkedBike' }));
}
