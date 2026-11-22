// Page: owns the clock, the controls and the HUD. The simulation advances on a fixed step independent of the frame rate.
import { createSim, step, summary, serialize, deserialize, describeTile, STAGES, runYears } from './sim.js';
import { createRenderer } from './render.js';
import { N } from './world.js';

const $ = id => document.getElementById(id), q = new URLSearchParams(location.search);
const SPEEDS = { 0: 0, 1: 2, 2: 8, 3: 30 };                         // simulated months per real second
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
const SAVE_KEY = 'civilization-loop-save-v1';
let S = null, speed = 1, acc = 0, last = performance.now(), lastSave = 0, dirty = false, hud = '';

function load(seed) { S = createSim(seed); R && R.centerOn(S.center.x, S.center.y); $('seed').value = seed; }
const canvas = $('world'), R = createRenderer(canvas);
function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => e.classList.remove('show'), 2200); }

// ---- start: a saved world, a requested seed, or a fresh one
const reqSeed = q.get('seed') !== null ? +q.get('seed') : null;
try { const saved = !q.has('new') && reqSeed === null ? localStorage.getItem(SAVE_KEY) : null; if (saved) { S = deserialize(saved); $('seed').value = S.seed; toast('Continuing the saved world'); } } catch (e) { S = null; }
if (!S) load(reqSeed ?? 7);
const warp = +(q.get('warp') || 0); if (warp) runYears(S, warp);
if (q.get('speed') !== null) speed = +q.get('speed');
R.setScale(+(q.get('scale') || (innerHeight > 900 ? 3 : 2))); R.centerOn(S.center.x, S.center.y);
if (q.get('time') !== null) R.dayOffset = +q.get('time');
const frozen = q.has('freeze');   // tests and screenshots: a fixed time of day

// ---- controls
const setSpeed = s => { speed = s; for (const [id, v] of [['bPause', 0], ['b1', 1], ['b2', 2], ['b3', 3]]) $(id).classList.toggle('on', v === s); };
setSpeed(speed);
$('bPause').onclick = () => setSpeed(0); $('b1').onclick = () => setSpeed(1); $('b2').onclick = () => setSpeed(2); $('b3').onclick = () => setSpeed(3);
$('zIn').onclick = () => R.setScale(R.scale + 1); $('zOut').onclick = () => R.setScale(R.scale - 1);
$('bLog').onclick = () => document.body.classList.toggle('nolog');
$('bNew').onclick = () => { const s = parseInt($('seed').value, 10); load(Number.isFinite(s) ? s : 7); R.sel = null; $('inspect').style.display = 'none'; toast('A new world begins'); };
$('bSave').onclick = save; $('bLoad').onclick = () => { try { const t = localStorage.getItem(SAVE_KEY); if (t) { S = deserialize(t); $('seed').value = S.seed; R.centerOn(S.center.x, S.center.y); toast('World loaded'); } else toast('No saved world yet'); } catch (e) { toast('Could not load'); } };
function save() { try { localStorage.setItem(SAVE_KEY, serialize(S)); lastSave = performance.now(); dirty = false; toast('World saved'); } catch (e) { toast('Could not save'); } }
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; const k = e.key; if (k === ' ') { e.preventDefault(); setSpeed(speed ? 0 : 1); } else if (k === '1') setSpeed(1); else if (k === '2') setSpeed(2); else if (k === '3') setSpeed(3); else if (k === '0') setSpeed(0); else if (k === '+' || k === '=') R.setScale(R.scale + 1); else if (k === '-') R.setScale(R.scale - 1); else if (k.toLowerCase() === 'l') $('bLog').click(); });
let drag = null;
canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; canvas.setPointerCapture(e.pointerId); canvas.classList.add('drag'); });
canvas.addEventListener('pointermove', e => { if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); R.pan(dx, dy); drag.x = e.clientX; drag.y = e.clientY; } else R.hover = R.toTile(e.clientX, e.clientY); });
canvas.addEventListener('pointerup', e => { if (drag && drag.moved < 5) inspect(R.toTile(e.clientX, e.clientY)); drag = null; canvas.classList.remove('drag'); });
canvas.addEventListener('wheel', e => { e.preventDefault(); R.setScale(R.scale + (e.deltaY < 0 ? 1 : -1)); }, { passive: false });
addEventListener('resize', () => R.resize());
function inspect(t) {
  const el = $('inspect'); R.sel = t; if (!t) { el.style.display = 'none'; return; }
  const L = describeTile(S, t.x, t.y); el.innerHTML = '<h4>What this land remembers</h4>' + L.map((l, i) => `<p${i === 0 ? ' style="color:var(--accent)"' : ''}>${l}</p>`).join(''); el.style.display = 'block';
}

// ---- HUD
const pct = v => Math.round(v * 100) + '%';
function updateHud() {
  const s = summary(S), key = JSON.stringify([s.year, s.season, s.pop, s.status, s.res, s.stability.toFixed(2), s.forest.toFixed(2), s.water.toFixed(2), s.housing, S.log.length, s.civ]);
  if (key === hud) return; hud = key;
  $('yr').textContent = `Year ${s.year}`; $('season').textContent = s.season; $('stage').textContent = s.status; $('civ').textContent = `Civilization ${ROMAN[s.civ] || s.civ}`;
  $('pop').textContent = s.pop; $('stabv').textContent = pct(s.stability); const sb = $('stab'); sb.style.width = pct(s.stability); sb.style.background = s.stability > 0.6 ? 'var(--ok)' : s.stability > 0.35 ? 'var(--accent)' : 'var(--bad)';
  $('rFood').textContent = `${s.res.food}`; $('rWood').textContent = `${s.res.wood}`; $('rStone').textContent = `${s.res.stone}`; $('rWater').textContent = pct(s.water); $('rHouse').textContent = Math.round(s.housing); $('rForest').textContent = pct(Math.min(1, s.forest));
  $('ruins').textContent = s.ruins ? `${s.ruins} ruins` : '';
  const ul = $('events'); ul.innerHTML = ''; for (const e of S.log.slice(-40).reverse()) { const li = document.createElement('li'); li.className = ['flood', 'fire', 'drought', 'plague', 'ruin'].includes(e.kind) ? 'bad' : e.kind; li.innerHTML = `<b>Y${e.year}</b>${e.text}`; ul.appendChild(li); }
  spark();
}
function spark() {
  const c = $('spark'), g = c.getContext('2d'), h = S.hist, w = c.width, ht = c.height; g.clearRect(0, 0, w, ht); if (h.length < 2) return;
  const max = Math.max(20, ...h.map(p => p.pop)), x = i => i / (h.length - 1) * (w - 2) + 1, y = v => ht - 3 - v / max * (ht - 8);
  g.fillStyle = 'rgba(224,184,104,.25)'; g.beginPath(); g.moveTo(x(0), ht - 3); h.forEach((p, i) => g.lineTo(x(i), y(p.pop))); g.lineTo(x(h.length - 1), ht - 3); g.fill();
  g.strokeStyle = '#e0b868'; g.lineWidth = 1.5; g.beginPath(); h.forEach((p, i) => i ? g.lineTo(x(i), y(p.pop)) : g.moveTo(x(i), y(p.pop))); g.stroke();
  g.strokeStyle = 'rgba(205,182,240,.6)'; g.setLineDash([2, 2]); h.forEach((p, i) => { if (i && p.civ !== h[i - 1].civ) { g.beginPath(); g.moveTo(x(i), 0); g.lineTo(x(i), ht); g.stroke(); } }); g.setLineDash([]);
}

// ---- main loop: the simulation steps at a fixed rate; the picture is redrawn every frame
function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000); last = now;
  const rate = SPEEDS[speed] || 0; acc += dt * rate; let steps = 0;
  while (acc >= 1 && steps < 40) { step(S); acc -= 1; steps++; dirty = true; } if (steps === 40) acc = 0;
  R.update(S, dt, rate / 2);
  R.draw(S, frozen ? 0 : now / 1000, rate); updateHud();
  if (dirty && now - lastSave > 30000) { try { localStorage.setItem(SAVE_KEY, serialize(S)); } catch (e) { } lastSave = now; dirty = false; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.CL = { get S() { return S; }, R, step, summary, setSpeed, runYears: y => runYears(S, y), serialize, deserialize, load, N };
