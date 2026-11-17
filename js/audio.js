'use strict';
// ===== Sài Gòn Lofi — generative lofi music + ambience (WebAudio, no samples) =====
const AU = { ctx: null, playing: false, track: 0, vol: { music: 0.7, amb: 0.5, vinyl: 0.35 }, next: 0, bar: 0, timer: null, level: 0 };
const QUAL = { M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], 7: [0, 4, 7, 10], m9: [0, 3, 7, 10, 14], M9: [0, 4, 7, 11, 14], 6: [0, 4, 7, 9] };
const TRACKS = [
  { name: 'Cà phê sữa đá', bpm: 72, key: 53, min: 0, prog: [[53, 'M7'], [52, 'm7'], [50, 'm7'], [48, 'M7']] },
  { name: 'Mưa Sài Gòn', bpm: 66, key: 57, min: 1, prog: [[57, 'm9'], [53, 'M7'], [48, 'M7'], [55, '7']] },
  { name: 'Xích lô chiều', bpm: 78, key: 48, min: 0, prog: [[50, 'm7'], [55, '7'], [48, 'M7'], [57, 'm7']] },
  { name: 'Hẻm nhỏ', bpm: 70, key: 51, min: 0, prog: [[51, 'M7'], [48, 'm7'], [56, 'M7'], [58, '7']] },
  { name: 'Đèn đường khuya', bpm: 62, key: 49, min: 0, prog: [[49, 'M9'], [58, 'm7'], [54, 'M7'], [56, '7']] },
  { name: 'Sáng chợ Bến Thành', bpm: 84, key: 55, min: 0, prog: [[55, 'M7'], [52, 'm7'], [48, 'M9'], [50, '7']] }
];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function noiseBuf(sec, fn) { const c = AU.ctx, b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = fn ? fn(i, d) : Math.random() * 2 - 1; return b; }
function audioInit() {
  if (AU.ctx) return; const c = AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
  AU.master = c.createGain(); AU.master.gain.value = 0.9; AU.master.connect(c.destination);
  AU.mus = c.createGain(); AU.amb = c.createGain(); AU.vin = c.createGain();
  // tape path: gentle low-pass + slow wow
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000; lp.Q.value = 0.4;
  const dl = c.createDelay(0.05); dl.delayTime.value = 0.012; const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.33; lg.gain.value = 0.0016; lfo.connect(lg); lg.connect(dl.delayTime); lfo.start();
  AU.bus = c.createGain(); AU.bus.connect(lp); lp.connect(dl); dl.connect(AU.mus); AU.mus.connect(AU.master); AU.amb.connect(AU.master); AU.vin.connect(AU.master);
  AU.an = c.createAnalyser(); AU.an.fftSize = 64; AU.mus.connect(AU.an);
  AU.white = noiseBuf(2);
  // vinyl crackle
  const cr = noiseBuf(4, () => Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.018), s = c.createBufferSource(); s.buffer = cr; s.loop = true; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900; s.connect(hp); hp.connect(AU.vin); s.start();
  // ambience beds: rain, wind, city hum, cicadas
  const bed = (type, f, q) => { const n = c.createBufferSource(); n.buffer = AU.white; n.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.5; const g = c.createGain(); g.gain.value = 0; n.connect(fl); fl.connect(g); g.connect(AU.amb); n.start(); return { g, fl }; };
  AU.rainBed = bed('bandpass', 2600, 0.35); AU.windBed = bed('lowpass', 420, 0.9); AU.humBed = bed('lowpass', 150, 0.6); AU.cicBed = bed('bandpass', 5200, 9);
  const tr = c.createOscillator(), tg = c.createGain(); tr.type = 'square'; tr.frequency.value = 19; tg.gain.value = 0; tr.connect(tg); tr.start(); AU.cicTrem = tg;
  setVol(); AU.ambT = 1;
}
function setVol() { if (!AU.ctx) return; const t = AU.ctx.currentTime; AU.mus.gain.setTargetAtTime(AU.vol.music * 0.85, t, 0.05); AU.amb.gain.setTargetAtTime(AU.vol.amb * 0.9, t, 0.05); AU.vin.gain.setTargetAtTime(AU.playing ? AU.vol.vinyl * 0.5 : 0, t, 0.1); }
function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function tone(type, f, t, a, peak, d, dest, det, bend) { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(bend ? f * bend : f, t); if (bend) o.frequency.exponentialRampToValueAtTime(f, t + 0.09); if (det) o.detune.value = det; env(g, t, a, peak, d); o.connect(g); g.connect(dest || AU.bus); o.start(t); o.stop(t + a + d + 0.05); return o; }
function nz(t, d, peak, type, f, dest) { const c = AU.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = AU.white; fl.type = type; fl.frequency.value = f; env(g, t, 0.002, peak, d); s.connect(fl); fl.connect(g); g.connect(dest || AU.bus); s.start(t, Math.random()); s.stop(t + d + 0.05); }
const vKeys = (m, t, d, v) => { const f = mtof(m); tone('sine', f, t, 0.012, 0.11 * v, d); tone('triangle', f, t, 0.012, 0.045 * v, d * 0.6, null, 6); tone('sine', f * 2, t, 0.005, 0.02 * v, 0.25); };
const vBass = (m, t, d) => { tone('sine', mtof(m), t, 0.015, 0.26, d); tone('triangle', mtof(m), t, 0.01, 0.07, d * 0.5); };
const vPluck = (m, t, v) => { tone('triangle', mtof(m), t, 0.004, 0.11 * v, 0.7, null, 0, chance(0.35) ? 0.94 : 0); tone('sine', mtof(m) * 2, t, 0.003, 0.03 * v, 0.3); };
const vKick = t => { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13); env(g, t, 0.004, 0.5, 0.26); o.connect(g); g.connect(AU.bus); o.start(t); o.stop(t + 0.4); };
const vSnare = t => { nz(t, 0.16, 0.16, 'bandpass', 1900); tone('triangle', 190, t, 0.002, 0.07, 0.1); };
const vHat = (t, v) => nz(t, 0.045, 0.05 * v, 'highpass', 7000);
function scheduleBar(t0) {
  const tr = TRACKS[AU.track], beat = 60 / tr.bpm, bar = AU.bar, ch = tr.prog[bar % tr.prog.length], notes = QUAL[ch[1]].map(i => ch[0] + i), R = mulberry32(AU.track * 977 + (bar % 8) * 31 + ((bar / 8) | 0) * 7), sw = beat * 0.16;
  const fill = (bar % 8) === 7, intro = bar < 2;
  notes.forEach((n, i) => vKeys(n + 12 - (n + 12 > 72 ? 12 : 0), t0 + i * 0.022, beat * 3.4, 1));
  if (R() < 0.6) notes.slice(1).forEach((n, i) => vKeys(n + 12, t0 + beat * 2.5 + i * 0.02, beat * 1.3, 0.6));
  vBass(ch[0] - 12, t0, beat * 1.8); if (R() < 0.8) vBass(ch[0] - 12 + (R() < 0.3 ? 7 : 0), t0 + beat * 2.5, beat * 1.2);
  if (!intro) { vKick(t0); vKick(t0 + beat * 2.5); if (R() < 0.3) vKick(t0 + beat * 1.5 + sw); vSnare(t0 + beat); vSnare(t0 + beat * 3); if (fill) vSnare(t0 + beat * 3.5 + sw); for (let i = 0; i < 8; i++) if (R() < 0.86) vHat(t0 + i * beat / 2 + (i % 2 ? sw : 0), i % 2 ? 0.6 : 1); }
  // pentatonic lead, đàn tranh-ish pluck
  const pent = (tr.min ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9]).map(i => tr.key + 12 + i), mel = (bar % 4) < 2 || R() < 0.35;
  if (mel && bar >= 2) { let deg = Math.floor(R() * 5), t = t0 + (R() < 0.5 ? 0 : beat * 0.5); while (t < t0 + beat * 3.8) { deg = clamp(deg + Math.floor(R() * 5) - 2, 0, 9); const n = pent[deg % 5] + (deg >= 5 ? 12 : 0); vPluck(n, t + (R() < 0.5 ? sw : 0), 0.7 + R() * 0.5); t += beat * sp(R, [0.5, 0.5, 1, 1, 1.5, 2]); } }
  AU.bar++; return beat * 4;
}
function schedule() { if (!AU.playing) return; const c = AU.ctx; if (typeof YTS !== 'undefined' && YTS.on) { AU.next = c.currentTime + 0.15; return; } while (AU.next < c.currentTime + 0.35) AU.next += scheduleBar(Math.max(AU.next, c.currentTime + 0.03)); }
function audioPlay() { audioInit(); const c = AU.ctx; if (c.state === 'suspended') c.resume(); AU.playing = true; AU.next = c.currentTime + 0.08; AU.bar = 0; clearInterval(AU.timer); AU.timer = setInterval(schedule, 90); schedule(); setVol(); }
function audioPause() { AU.playing = false; clearInterval(AU.timer); setVol(); }
function nextTrack(d) { AU.track = (AU.track + d + TRACKS.length) % TRACKS.length; AU.bar = 0; if (AU.ctx) AU.next = AU.ctx.currentTime + 0.25; }
// ambience follows the scene; called every frame
function ambTick(dt) {
  if (!AU.ctx || AU.ctx.state !== 'running') return; const c = AU.ctx, t = c.currentTime, day = G.hour > 5.5 && G.hour < 18.5, on = AU.playing ? 1 : 0;
  AU.rainBed.g.gain.setTargetAtTime(on * (G.season === 'winter' ? 0 : G.rain) * 0.3, t, 0.4);
  AU.windBed.g.gain.setTargetAtTime(on * (0.03 + G.gust * 0.3 + (G.windy ? 0.07 : 0)), t, 0.3); AU.windBed.fl.frequency.setTargetAtTime(320 + G.gust * 700, t, 0.3);
  AU.humBed.g.gain.setTargetAtTime(on * 0.09 * (day ? 1 : 0.5), t, 1);
  AU.cicBed.g.gain.setTargetAtTime(on * (G.season === 'summer' && day && G.rain < 0.1 ? 0.016 + (G.hot ? 0.012 : 0) : 0), t, 1);
  AU.ambT -= dt; if (AU.ambT > 0 || !on) return; AU.ambT = rr(1.2, 5);
  if (day && G.rain < 0.2 && G.season !== 'winter') { const n = ri(2, 5), f0 = rr(2600, 4200); for (let i = 0; i < n; i++) { const o = c.createOscillator(), g = c.createGain(), tt = t + i * rr(0.07, 0.13); o.frequency.setValueAtTime(f0 * rr(0.9, 1.2), tt); o.frequency.exponentialRampToValueAtTime(f0 * rr(1.2, 1.6), tt + 0.05); env(g, tt, 0.006, 0.02, 0.07); o.connect(g); g.connect(AU.amb); o.start(tt); o.stop(tt + 0.15); } }
  else if (!day && G.rain < 0.2 && G.season !== 'winter') { for (let i = 0; i < 4; i++) { const o = c.createOscillator(), g = c.createGain(), tt = t + i * 0.085; o.frequency.value = 4300; env(g, tt, 0.004, 0.012, 0.04); o.connect(g); g.connect(AU.amb); o.start(tt); o.stop(tt + 0.1); } }
}
function sfx(k) {
  if (!AU.ctx || !AU.playing || AU.ctx.state !== 'running') return; const c = AU.ctx, t = c.currentTime + 0.01, d = AU.amb;
  if (k === 'beep') { tone('square', 620, t, 0.004, 0.012, 0.08, d); tone('square', 620, t + 0.13, 0.004, 0.012, 0.09, d); }
  else if (k === 'horn') { tone('sawtooth', 392, t, 0.01, 0.014, 0.22, d); tone('sawtooth', 494, t, 0.01, 0.012, 0.22, d); }
  else if (k === 'bell') { tone('sine', 2350, t, 0.002, 0.03, 0.5, d); tone('sine', 3520, t, 0.002, 0.012, 0.3, d); tone('sine', 2350, t + 0.16, 0.002, 0.024, 0.5, d); }
  else if (k === 'vend') { nz(t, 0.09, 0.2, 'lowpass', 500, d); nz(t + 0.16, 0.12, 0.22, 'lowpass', 320, d); }
  else if (k === 'door') { nz(t, 0.08, 0.14, 'lowpass', 380, d); }
  else if (k === 'moto') { const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(62, t); o.frequency.linearRampToValueAtTime(128, t + 0.9); f.type = 'lowpass'; f.frequency.value = 600; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.035, t + 0.15); g.gain.linearRampToValueAtTime(0.0001, t + 1.2); o.connect(f); f.connect(g); g.connect(d); o.start(t); o.stop(t + 1.3); }
  else if (k === 'thunder') { nz(t, 1.6, 0.3, 'lowpass', 140, d); nz(t + 0.25, 1.1, 0.16, 'lowpass', 90, d); }
  else if (k === 'gust') { nz(t, 1.3, 0.05, 'bandpass', 500, d); }
  else if (k === 'plane') { nz(t, 3.5, 0.03, 'lowpass', 260, d); }
}
function vizLevel() { if (!AU.an || !AU.playing) return null; const a = new Uint8Array(AU.an.frequencyBinCount); AU.an.getByteFrequencyData(a); return a; }
