'use strict';
// ===== Holdfast — ambience + world sounds (WebAudio synthesis, no samples) =====
// Runs on the Lofi Worlds radio's AudioContext (the parent page's when Holdfast is embedded in the gallery), through its
// shared gains, exactly like Saigon's: nature beds go through the radio's Ambient volume, settlement/combat events through its
// "street" channel (the dock's World switch + slider). Like Saigon, all sound follows the radio's play/pause. Combat voices are capped.
const HA = { ctx: null, out: null, evt: null, beds: {}, last: {}, shots: [], voices: 0, on: false, win: null, muted: false };
function haStart(win) {
  if (HA.on) return true;
  try {
    HA.win = win; const A = win.AU; if (!A.ctx) win.audioInit(); HA.ctx = A.ctx; if (HA.ctx.state === 'suspended') HA.ctx.resume();
    HA.white = A.white; HA.out = HA.ctx.createGain(); HA.out.gain.value = 1; HA.out.connect(A.amb); HA.evt = HA.ctx.createGain(); HA.evt.gain.value = 1; HA.evt.connect(A.str);
    const c = HA.ctx, bed = (type, f, q, g0) => { const n = c.createBufferSource(); n.buffer = HA.white; n.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.value = g0 || 0; n.connect(fl); fl.connect(g); g.connect(HA.out); n.start(0, Math.random() * 1.5); return { g, fl, n }; };
    HA.beds.wind = bed('lowpass', 380, 0.8); HA.beds.leaves = bed('bandpass', 3200, 0.6); HA.beds.creek = bed('bandpass', 1100, 1.6); HA.beds.river = bed('lowpass', 520, 0.5); HA.beds.rain = bed('bandpass', 2600, 0.4); HA.beds.murmur = bed('bandpass', 620, 1.4); HA.beds.crick = bed('bandpass', 5000, 8);
    const tr = c.createOscillator(), tg = c.createGain(); tr.type = 'square'; tr.frequency.value = 17; tg.gain.value = 0; tr.connect(tg); tg.connect(HA.beds.crick.g.gain); tr.start(); HA.crickT = tg;
    HA.on = true; return true;
  } catch (e) { return false; }
}
function haStop() { if (!HA.on) return; try { for (const k in HA.beds) { HA.beds[k].n.stop(); } HA.out.disconnect(); } catch (e) { } try { HA.evt.disconnect(); } catch (e) { } HA.on = false; HA.beds = {}; }
// the gallery hides this frame while you browse: silence the beds immediately (haFrame is not running), restore on return
function haSilence(on) { HA.muted = !!on; if (!HA.on) return; try { for (const k in HA.beds) HA.beds[k].g.gain.cancelScheduledValues(HA.ctx.currentTime), HA.beds[k].g.gain.setTargetAtTime(0, HA.ctx.currentTime, on ? 0.05 : 0.6); HA.crickT.gain.setTargetAtTime(0, HA.ctx.currentTime, 0.05); } catch (e) { } }
const haSet = (b, v, tc) => { if (b) b.g.gain.setTargetAtTime(v, HA.ctx.currentTime, tc || 0.6); };
// per-frame: beds follow time of day, weather, what the camera looks at
function haFrame(dt, view) {
  if (!HA.on || HA.muted) return;
  const A = HA.win.AU, on = A.playing ? 1 : 0;                  // like Saigon: the world's sound is part of the radio, so it follows play/pause
  const h = HS.hour, night = h < 5.5 || h > 20, dusk = h > 18 && h < 21, wx = HS.weather, B = HA.beds;
  haSet(B.wind, on * (wx === 'wind' ? 0.24 : wx === 'rain' ? 0.1 : 0.05)); B.wind.fl.frequency.setTargetAtTime(wx === 'wind' ? 620 : 380, HA.ctx.currentTime, 1);
  haSet(B.leaves, on * (wx === 'wind' ? 0.05 : 0.014) * (HR.season === 'winter' ? 0.3 : 1));
  haSet(B.rain, on * (wx === 'rain' ? (HR.season === 'winter' ? 0.02 : 0.16) : 0));
  haSet(B.creek, on * view.water * 0.05); haSet(B.river, on * view.river * 0.07);
  haSet(B.murmur, on * clamp(view.people / 60, 0, 1) * (night ? 0.012 : 0.04));
  haSet(B.crick, on * 0.02); HA.crickT.gain.setTargetAtTime(on && (night || dusk) && HR.season !== 'winter' && wx !== 'rain' ? 0.03 : 0, HA.ctx.currentTime, 2);
  if (!on) return;
  // birds by day, an owl at night, distant moans when infected are near the view
  const t = HS.t;
  if (!night && wx !== 'rain' && HR.season !== 'winter' && t > (HA.last.bird || 0)) { HA.last.bird = t + 2 + Math.random() * 6; haBird(); }
  if (night && t > (HA.last.owl || 0)) { HA.last.owl = t + 25 + Math.random() * 40; haOwl(); }
  if (view.zombies > 0 && t > (HA.last.moanAmb || 0)) { HA.last.moanAmb = t + 6 + Math.random() * 10; haMoan(0.25 + Math.min(0.4, view.zombies / 30), (Math.random() - 0.5) * 1.4); }
}
function haEnv(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function haNode(gain, pan) { const c = HA.ctx, g = c.createGain(); let out = g; if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(pan || 0, -1, 1); g.connect(p); const dst = HA.nature ? HA.out : HA.evt; p.connect(dst); } else g.connect(HA.nature ? HA.out : HA.evt); return g; }
function haNoise(t, d, peak, type, f, pan, q) { const c = HA.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = haNode(1, pan); s.buffer = HA.white; fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.7; haEnv(g, t, 0.003, peak, d); s.connect(fl); fl.connect(g); s.start(t, Math.random()); s.stop(t + d + 0.1); }
function haTone(type, f0, f1, t, a, peak, d, pan) { const c = HA.ctx, o = c.createOscillator(), g = haNode(1, pan); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + a + d); haEnv(g, t, a, peak, d); o.connect(g); o.start(t); o.stop(t + a + d + 0.05); }
function haBird() { HA.nature = true; try { haBird2(); } finally { HA.nature = false; } }
function haBird2() { const t = HA.ctx.currentTime, f = 2400 + Math.random() * 1800, n = 2 + (Math.random() * 4 | 0), pan = Math.random() * 1.6 - 0.8; for (let i = 0; i < n; i++) haTone('sine', f * (1 + Math.random() * 0.2), f * 1.3, t + i * 0.11, 0.01, 0.018, 0.07, pan); }
function haOwl() { HA.nature = true; try { haOwl2(); } finally { HA.nature = false; } }
function haOwl2() { const t = HA.ctx.currentTime; haTone('sine', 420, 380, t, 0.05, 0.03, 0.35, -0.4); haTone('sine', 410, 360, t + 0.55, 0.05, 0.026, 0.5, -0.4); }
function haMoan(v, pan) { const c = HA.ctx, t = c.currentTime, o = c.createOscillator(), fl = c.createBiquadFilter(), g = haNode(1, pan), f = 85 + Math.random() * 40; o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 0.72, t + 1.4); fl.type = 'bandpass'; fl.frequency.value = 560; fl.Q.value = 3; haEnv(g, t, 0.25, 0.05 * v, 1.2); o.connect(fl); fl.connect(g); o.start(t); o.stop(t + 1.6); }
// world event -> sound, attenuated by distance from the camera centre and panned by screen x
function haEvent(k, x, y, v) {
  if (!HA.on || HA.muted || document.hidden || !HA.win.AU.playing) return;
  const c = HA.ctx, t = c.currentTime, p = ISO(x, y), dx = p[0] - HR.cx, dy = p[1] - HR.cy, d = Math.hypot(dx, dy * 1.6), att = 1 / (1 + d / 200), pan = clamp(dx / 420, -0.9, 0.9);
  if (att < 0.08 && k !== 'bell' && k !== 'breach') return;
  const now = performance.now();
  if (k === 'shot') { HA.shots = HA.shots.filter(s => now - s < 10000); if (HA.shots.length >= 6 || now - (HA.last.shot || 0) < 120) return; HA.shots.push(now); HA.last.shot = now; haNoise(t, 0.09, 0.22 * att * v, 'lowpass', 1500, pan); haTone('sine', 110, 50, t, 0.002, 0.16 * att * v, 0.14, pan); haNoise(t + 0.04, 0.5, 0.035 * att, 'lowpass', 400, pan); return; }
  if (HA.voices > 4) return; HA.voices++; setTimeout(() => HA.voices--, 400);
  if (k === 'bang') haTone('sine', 120, 70, t, 0.003, 0.11 * att * v, 0.12, pan), haNoise(t, 0.05, 0.05 * att, 'bandpass', 700, pan);
  else if (k === 'stab') haNoise(t, 0.06, 0.06 * att, 'bandpass', 1800, pan, 2);
  else if (k === 'hammer') haTone('square', 900, 700, t, 0.001, 0.025 * att, 0.04, pan);
  else if (k === 'fall' || k === 'hurt') haNoise(t, 0.12, 0.06 * att, 'lowpass', 300, pan);
  else if (k === 'moan' || k === 'growl') { if (now - (HA.last.moan || 0) < 900) return; HA.last.moan = now; haMoan(att * 1.2, pan); }
  else if (k === 'gate') { if (now - (HA.last.gate || 0) < 2500) return; HA.last.gate = now; haNoise(t, 1.8, 0.07 * att, 'lowpass', 220, pan); haTone('triangle', 180, 140, t + 1.7, 0.004, 0.05 * att, 0.25, pan); }
  else if (k === 'bell') { if (now - (HA.last.bell || 0) < 8000) return; HA.last.bell = now; for (let i = 0; i < 3; i++) for (const [f, a] of [[660, 0.06], [990, 0.03], [1325, 0.02]]) haTone('sine', f, f * 0.995, t + i * 0.9, 0.004, a * Math.max(0.4, att), 1.6, pan); }
  else if (k === 'breach') { haNoise(t, 0.6, 0.12 * Math.max(0.4, att), 'lowpass', 900, pan); haTone('sine', 80, 40, t, 0.01, 0.1, 0.4, pan); }
  else if (k === 'loss') haTone('sine', 196, 180, t, 0.4, 0.02, 2.2, pan);
}
