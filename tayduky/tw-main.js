'use strict';
// ===== Tây Du Ký v2 — page: boot, fixed-step loop, camera input, time of day, place-name cards =====
(function () {
  const Q = new URLSearchParams(location.search), cv = document.getElementById('c');
  const sim = window.TWS || null;
  const START = { hqs: [138, 24], btd: [80, 140], fall: [131, 16], spring: [92, 143] };
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
  cv.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, TWR.cx, TWR.cy]; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
  cv.addEventListener('pointermove', e => { if (!drag) return; const dpr = window.devicePixelRatio || 1; TWR.cx = drag[2] - (e.clientX - drag[0]) * dpr / TWR.zoom; TWR.cy = drag[3] - (e.clientY - drag[1]) * dpr / TWR.zoom; TWR.clamp(); });
  cv.addEventListener('pointerup', () => { drag = null; cv.style.cursor = 'grab'; });
  cv.addEventListener('wheel', e => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  function zoomBy(d) { TWR.zoom = Math.max(1, Math.min(5, TWR.zoom + d)); TWR.resize(); }
  document.getElementById('zin').onclick = () => zoomBy(1); document.getElementById('zout').onclick = () => zoomBy(-1);
  document.getElementById('tod').onchange = e => { TWR.tod = e.target.value; if (TWR.tod !== 'auto') TWR.clock = { day: 11, dusk: 18.2, night: 22 }[TWR.tod]; };
  addEventListener('resize', () => TWR.resize());
  addEventListener('keydown', e => { const s = 160 / TWR.zoom; if (e.key === 'ArrowLeft') TWR.cx -= s; if (e.key === 'ArrowRight') TWR.cx += s; if (e.key === 'ArrowUp') TWR.cy -= s; if (e.key === 'ArrowDown') TWR.cy += s;
    if (e.key === '+' || e.key === '=') zoomBy(1); if (e.key === '-') zoomBy(-1); if (e.key === 'g') TWR.debug = !TWR.debug; TWR.clamp(); });
  setTimeout(boot, 30);
})();
