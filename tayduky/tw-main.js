'use strict';
// ===== Tây Du Ký v2 — page: boot, fixed-step loop, camera input, time of day, place-name cards =====
(function () {
  const Q = new URLSearchParams(location.search), cv = document.getElementById('c');
  const sim = window.TWS || null;
  const LM = (p) => TWM.layout ? TWM.layout.map(p[0], p[1]) : p;   // START points are authored in the 160-tile authoring space
  const START = { hqs: LM([138, 24]), btd: LM([80, 140]), tc: LM([81, 18]), btp: TWM.palm ? [TWM.palm.centre[0] - 1, TWM.palm.centre[1] + 3] : [111, 47], buddha: TWM.palm ? [TWM.palm.buddha[0], TWM.palm.buddha[1] + 4] : [111, 47], hdsgate: TWM.layout && TWM.layout.hds ? [TWM.layout.hds.x0 + 12, TWM.layout.hds.y0 + 6] : [10, 100], hdsvolc: TWM.layout && TWM.layout.hds ? [TWM.layout.hds.x0 + 7, TWM.layout.hds.y0 + 17] : [10, 100], hdsfire: TWM.layout && TWM.layout.hds ? [TWM.layout.hds.x0 + 26, TWM.layout.hds.y0 + 22] : [10, 100], hdsc: TWM.layout && TWM.layout.hds ? [TWM.layout.hds.x0 + 5, TWM.layout.hds.y0 + TWM.layout.hds.h - 7] : [10, 110], hdsb: TWM.layout && TWM.layout.hds ? [TWM.layout.hds.x0 + 18, TWM.layout.hds.y0 + 1] : [20, 90], sdl: TWM.layout && TWM.layout.sdl ? [TWM.layout.sdl.x0 + 24, TWM.layout.sdl.y0 + 22] : [50, 100], sdlcamp: TWM.layout && TWM.layout.sdl ? [TWM.layout.sdl.x0 + 20, TWM.layout.sdl.y0 + 31] : [50, 100], sdlcit: TWM.layout && TWM.layout.sdl ? [TWM.layout.sdl.x0 + 21, TWM.layout.sdl.y0 + 13] : [50, 100], sdlfall: TWM.layout && TWM.layout.sdl ? [TWM.layout.sdl.x0 + 30, TWM.layout.sdl.y0 + 12] : [50, 100], sdlnest: TWM.layout && TWM.layout.sdl ? [TWM.layout.sdl.x0 + 41, TWM.layout.sdl.y0 + 6] : [50, 100], sdlden: TWM.layout && TWM.layout.sdl ? [TWM.layout.sdl.x0 + 10, TWM.layout.sdl.y0 + 19] : [50, 100], sdlhall: TWM.layout && TWM.layout.sdl ? [TWM.layout.sdl.x0 + 37, TWM.layout.sdl.y0 + 15] : [50, 100], sdlgate: TWM.layout && TWM.layout.sdl ? [TWM.layout.sdl.x0 + 21, TWM.layout.sdl.y0 + 18] : [50, 100], sdlb: TWM.layout && TWM.layout.sdl ? [TWM.layout.sdl.x0 + 1, TWM.layout.sdl.y0 + 18] : [50, 100], sdlrim: TWM.layout && TWM.layout.sdl ? [TWM.layout.sdl.x0 + 24, TWM.layout.sdl.y0 + 36] : [50, 100], fall: LM([131, 16]), spring: LM([92, 143]) };
  if (TWM.layout && TWM.layout.hps) { const T = TWM.layout.hps, TL = (a, b) => [T.x0 + a, T.y0 + b]; Object.assign(START, { hps: TL(15, 17), hpstemple: TL(13, 9), hpscourt: TL(17, 14), hpsgate: TL(24, 25), hpslair: TL(6, 25), hpsravine: TL(6, 38), hpsdorm: TL(20, 20), hpssummit: TL(14, 4), hpssource: TL(25, 29), hpslook: TL(21, 8), hpsback: TL(10, 12) }); }
  if (TWM.layout && TWM.layout.nhs) { const T = TWM.layout.nhs, TL = (a, b) => [T.x0 + a, T.y0 + b]; Object.assign(START, { nhs: TL(14, 24), nhsprison: TL(11, 26), nhssummit: TL(14, 14), nhsgate: TL(7, 32), nhsmeadow: TL(15, 32), nhsfall: TL(14, 22), nhseast: TL(23, 20), nhsrim: TL(24, 30), nhshut: TL(8, 21), nhstail: TL(22, 3), nhsback: TL(12, 10), nhsborder: TL(2, 14) }); }   // Ngũ Hành Sơn camera targets (?at=nhsprison ...)
  if (TWM.layout && TWM.layout.bcl) Object.assign(START, { bcl: [50, 22], bclgate: [44, 37], bclgrave: [38, 36], bclclear: [50, 22], bclribs: [51, 14], bclpalace: [55, 9], bcllair: [44, 5], bclbridge: [27, 4], bcllook: [6, 3], bclridge: [36, 4], bclpool: [53, 24], bclwest: [10, 5], bclseam: [58, 20], bclseamsouth: [48, 38], bclrim: [20, 2] });   // Bạch Cốt Lĩnh camera targets (?at=bclgrave ...)
  if (TWM.layout && TWM.layout.btp) Object.assign(START, { btp: [76, 51], btpfingers: [80, 42], btpbuddha: [86, 50], btpwrist: [72, 66], btpseam: [89, 41], btpwest: [59, 64], btprim: [68, 70], btpthumb: [69, 45], btpnorth: [72, 36], btpeast: [88, 44], btpsouth: [78, 66] });   // Buddha's Palm camera targets (?at=btpfingers ...)
  Object.assign(START, { tc: [27, 21], tcgate: [28, 27], tcfurnace: [36, 14], tcgarden: [19, 23], tcpalace: [24, 12] });   // Thiên Cung camera targets (?at=tcgate ...)
  Object.assign(START, { lhd: [48, 70], lhdmouth: [47, 79], lhdcanyon: [48, 65], lhdcourt: [51, 78], lhdarena: [62, 80], lhdtreasure: [70, 80], lhdnorth: [48, 58], lhdseam: [48, 56], lhdeast: [72, 80], lhdwest: [38, 83] });   // Liên Hoa Động camera targets
  Object.assign(START, { clt: [48, 46], cltcourt: [53, 41], cltgao: [51, 40], cltsquare: [49, 48], cltgate: [40, 47], cltpond: [43, 54], cltfield: [60, 52], cltpen: [59, 44], cltlane: [60, 34], cltfall: [41, 43], cltnorth: [52, 37], cltseam: [48, 56], cltwest: [37, 46], cltrim: [64, 44] });   // Cao Lão Trang camera targets
  Object.assign(START, { lat: [113, 22], latfoot: [113, 31], latgate: [113, 25], latcourt: [113, 17], lathall: [113, 9], latpool: [107, 24], latfall: [107, 20], latbodhi: [117, 31], latrim: [121, 20], latwest: [104, 14], latnorth: [112, 3], latseam: [113, 36] });   // Đại Lôi Âm Tự camera targets (?at=latgate ...)
  if (TWM.layout && TWM.layout.hqs) Object.assign(START, { hqs: [82, 17], hqsfall: [74, 11], hqssource: [74, 4], hqscourt: [88, 21], hqsthrone: [88, 16], hqsvillage: [93, 11], hqssummit: [91, 5], hqsorchard: [66, 19], hqsyard: [80, 26], hqsgate: [91, 35], hqsbeach: [96, 25], hqslook: [74, 30], hqscave: [74, 9], hqsrim: [66, 3], hqsborder: [64, 28], hqsseam: [91, 38], hqswest: [62, 14] });   // Hoa Quả Sơn camera targets (?at=hqsfall ...)
  if (TWM.layout && TWM.layout.ntq) Object.assign(START, { ntq: [111, 42], ntqtree: [109, 43], ntqhall: [105, 36], ntqgate: [118, 47], ntqpond: [116, 41], ntqfall: [121, 41], ntqwest: [95, 43], ntqlook: [119, 38], ntqrear: [104, 32], ntqrim: [121, 44], ntqborder: [99, 38], ntqseam: [118, 50] });   // Ngũ Trang Quán camera targets (?at=ntqtree ...)
  if (TWM.layout && TWM.layout.tth) { const T = TWM.layout.tth, TL = (a, b) => [T.x0 + a, T.y0 + b]; Object.assign(START, { tth: TL(22, 24), tthcove: TL(12, 29), tthfall: TL(22, 35), tthrapid: TL(22, 6), tthland: TL(34, 27), tthisle: TL(24, 14), tthtower: TL(9, 9), tthb: TL(2, 30), tthrim: TL(40, 36), tthvill: TL(39, 19), tthwhirl: TL(23, 28) }); }   // Thông Thiên Hà camera targets (?at=tthcove ...)
  if (TWM.hvd) Object.assign(START, { hvd: [15, 36], hvdfort: [12, 34], hvdfall: [29, 37], hvdrim: [4, 73], hvdseam: [24, 47] });
  function boot() {
    TWR.init(cv);
    if (sim && sim.init) sim.init(+(Q.get('seed') || (Date.now() % 100000)));
    if (sim) sim.speed = +(Q.get('speed') || 1);
    if (sim && Q.get('force')) for (const b of Q.get('force').split(',')) if (sim.biomes[b]) sim.biomes[b].timer = 0.5;   // dev/test only: start a biome's story loop now
    TWR.zoom = +(Q.get('zoom') || Math.max(1, Math.min(4, Math.round(Math.sqrt(innerWidth * innerHeight * (window.devicePixelRatio || 1) ** 2 / (960 * 540)))))); TWR.resize();
    const at = START[Q.get('at')] || (Q.get('at') && TWM.biomes[TWM.bi[Q.get('at')]] ? TWM.biomes[TWM.bi[Q.get('at')]].centre : START.hqs);
    TWR.lookAt((at[0] + 0.5) * 8, (at[1] + 0.5) * 8, TWM.H[TWM.id(Math.round(at[0]), Math.round(at[1]))] * 4);
    if (Q.get('tod')) { TWR.tod = Q.get('tod'); TWR.clock = { day: 11, dusk: 18.2, night: 22 }[TWR.tod] || 9.5; document.getElementById('tod').value = TWR.tod; }
    if (Q.get('debug')) TWR.debug = true;
    document.getElementById('load').remove();
    requestAnimationFrame(loop);
  }
  let last = 0, acc = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
    if (sim && sim.tick) { sim.hour = TWR.clock; acc += dt * (sim.speed || 1); let n = 0; while (acc >= 0.1 && n++ < 12) { sim.tick(0.1); acc -= 0.1; } if (n >= 12) acc = 0; }
    TWR.frame(dt, sim && sim.agents ? sim : null);
    placeCard(dt);
  }
  // place-name card: names the place when the view settles in a biome (no navigation aid)
  const card = { biome: null, t: 0, shown: {} };
  function placeCard(dt) {
    const x = TWR.cx - TWA.OX, y = TWR.cy - TWA.OY, i = Math.floor((y / 16 + x / 32) / 2), j = Math.floor((y / 16 - x / 32) / 2), b = TWM.biomeAt(i, j);
    const el = document.getElementById('card');
    if (b !== card.biome) { card.biome = b; card.t = 0; return; }
    card.t += dt;
    if (b && card.t > 2 && card.t - dt <= 2 && document.getElementById('names').checked && (!card.shown[b] || TWR.t - card.shown[b] > 180)) {
      const B = TWM.biomes[TWM.bi[b]]; card.shown[b] = TWR.t;
      el.querySelector('b').textContent = B.title[0]; el.querySelector('span').textContent = B.title[1] + (B.built ? '' : ' · đang xây dựng / in development');
      el.style.opacity = 1; clearTimeout(placeCard.h); placeCard.h = setTimeout(() => el.style.opacity = 0, 4200);
    }
  }
  // camera: drag, wheel/＋－ zoom in integer steps, arrow keys
  let drag = null;
  cv.addEventListener('pointerdown', e => { TWR.userT = TWR.t; drag = [e.clientX, e.clientY, TWR.cx, TWR.cy]; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
  cv.addEventListener('pointermove', e => { if (!drag) return; TWR.userT = TWR.t; const dpr = window.devicePixelRatio || 1; TWR.cx = drag[2] - (e.clientX - drag[0]) * dpr / TWR.zoom; TWR.cy = drag[3] - (e.clientY - drag[1]) * dpr / TWR.zoom; TWR.clamp(); });
  cv.addEventListener('pointerup', () => { drag = null; cv.style.cursor = 'grab'; });
  cv.addEventListener('wheel', e => { TWR.userT = TWR.t; e.preventDefault(); zoomBy(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  function zoomBy(d) { TWR.zoom = Math.max(1, Math.min(5, TWR.zoom + d)); TWR.resize(); }
  document.getElementById('zin').onclick = () => zoomBy(1); document.getElementById('zout').onclick = () => zoomBy(-1);
  document.getElementById('tod').onchange = e => { TWR.tod = e.target.value; if (TWR.tod !== 'auto') TWR.clock = { day: 11, dusk: 18.2, night: 22 }[TWR.tod]; };
  addEventListener('resize', () => TWR.resize());
  addEventListener('keydown', e => { TWR.userT = TWR.t; const s = 160 / TWR.zoom; if (e.key === 'ArrowLeft') TWR.cx -= s; if (e.key === 'ArrowRight') TWR.cx += s; if (e.key === 'ArrowUp') TWR.cy -= s; if (e.key === 'ArrowDown') TWR.cy += s;
    if (e.key === '+' || e.key === '=') zoomBy(1); if (e.key === '-') zoomBy(-1); if (e.key === 'g') TWR.debug = !TWR.debug; TWR.clamp(); });
  TWA.loadSprites().then(() => setTimeout(boot, 30));
})();
