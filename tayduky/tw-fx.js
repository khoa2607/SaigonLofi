'use strict';
// ===== Tây Du Ký v2 — story and ambient effects (render-only; reads TWS state, may use Math.random) =====
// ground(): litter and soft footprints under everyone; draw(): effects in the air; light(): additive glows for the night pass.
const TWFX = (function () {
  const T = 8;
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  function ground(g, S, R, x0, y0, W, Hh) {
    for (const l of S.litter) { const X = R.wx(l.x, l.y), Y = R.wy(l.x, l.y, TWM.groundZ(l.x, l.y)); if (X < x0 || X > x0 + W || Y < y0 || Y > y0 + Hh) continue;
      if (l.kind === 'pit') { px(g, X - 1, Y - 1, 3, 2, '#7a4a2a'); px(g, X - 1, Y - 1, 1, 1, '#a86a3a'); } else { px(g, X - 1, Y, 2, 1, '#ffb6c8'); px(g, X, Y - 1, 1, 1, '#ffe2ea'); } }
  }
  function beacon(g, S, R, x0, y0) {
    for (const B of Object.values(S.biomes)) { if (B.phase !== 'fore' || !B.data) continue; const col = window.TW_DATA.beacon[B.id] || '255,255,255';
      const p = TWM.pois.find(q => q.biome === B.id && q.kind === (B.id === 'btd' ? 'circle' : 'court')); if (!p) continue;
      const X = R.wx(p.x, p.y), Y = R.wy(p.x, p.y, TWM.groundZ(p.x, p.y)), top = y0 - 20, pulse = 0.16 + 0.08 * Math.sin(R.t * 3);
      for (let s = 0; s < 3; s++) { g.fillStyle = `rgba(${col},${pulse * (1 - s * 0.28)})`; const w = 14 - s * 4; g.fillRect(Math.round(X - w / 2), top, w, Y - top); } }
  }
  function draw(g, S, R, x0, y0, W, Hh) {
    const t = R.t;
    beacon(g, S, R, x0, y0);
    // Furnace sparks/smoke and drifting cloud wisps are separate from the terrain.
    for (const st of R.statics) if (st.p.kind === 'tcfurnace' && st.X < x0+W+80 && st.X+st.sp.w > x0-80 && st.Y < y0+Hh+80 && st.Y+st.sp.h > y0-80) {
      for (let q=0;q<10;q++) { const ph=(t*0.23+q/10)%1, x=st.X+st.sp.w/2+Math.sin(t+q)*5, y=st.Y+st.sp.h*.35-ph*45;
        g.globalAlpha=(1-ph)*.45; px(g,x,y,3+q%3,2,q%2?'#eee5f4':'#ffd48a'); } g.globalAlpha=1;
    }
    // spring steam (always), loom threads while weaving
    const sp = TWM.btd.spring, sx = R.wx((sp[0] + 0.5) * T, (sp[1] + 0.5) * T), sy = R.wy((sp[0] + 0.5) * T, (sp[1] + 0.5) * T, 12);
    if (sx > x0 - 100 && sx < x0 + W + 100 && sy > y0 - 120 && sy < y0 + Hh + 60)
      for (let k = 0; k < 26; k++) { const a = TWM.hash2(k, 7, 99), ph = (t * (0.18 + a * 0.12) + a) % 1, x = sx + (a - 0.5) * 70 + Math.sin(t * 0.8 + k) * 4, y = sy + (TWM.hash2(k, 8, 99) - 0.5) * 30 - ph * 46; g.fillStyle = `rgba(255,255,255,${0.42 * Math.sin(ph * Math.PI)})`; g.fillRect(Math.round(x), Math.round(y), 5 + (k % 3) * 2, 3); }
    for (const a of S.agents) if (a.cur && a.cur.weave && a.pose === 'act' && a.cur.prop) { const p = a.cur.prop, lx = R.wx((p.i + 0.5) * T, (p.j + 0.5) * T), ly = R.wy((p.i + 0.5) * T, (p.j + 0.5) * T, TWM.groundZ((p.i + 0.5) * T, (p.j + 0.5) * T)) - 34, ax = R.wx(a.x, a.y), ay = R.wy(a.x, a.y, a.gz) - 24;
      g.fillStyle = 'rgba(240,236,255,0.85)'; for (let k = 0; k < 3; k++) { const n = 14; for (let s = 0; s <= n; s++) { const f = s / n; g.fillRect(Math.round(ax + (lx - ax) * f), Math.round(ay + (ly + k * 8 - ay) * f + Math.sin(f * Math.PI + t * 4 + k) * 1.5), 1, 1); } } }
    // ambient life on static sprites: petals drift off the big peach trees, glowing spores rise from mushrooms and crystals, the web canopy twinkles
    for (const st of R.statics) {
      const kind = st.p.kind; if (kind !== 'bigpeach' && kind !== 'tcpeach' && kind !== 'bigmush' && kind !== 'pcrystals' && kind !== 'altar') continue;
      if (st.X > x0 + W + 40 || st.X + st.sp.w < x0 - 40 || st.Y > y0 + Hh + 40 || st.Y + st.sp.h < y0 - 40) continue;
      if (kind === 'bigpeach' || kind === 'tcpeach') { for (let q = 0; q < 5; q++) { const a = TWM.hash2(st.ph, q, 71), ph = (t * 0.16 + a * 3) % 1, X = st.X + st.sp.w * (0.15 + a * 0.7) + Math.sin(t * 0.9 + q * 2) * 6 + ph * 10, Y = st.Y + st.sp.h * 0.32 + ph * st.sp.h * 0.62;
        g.fillStyle = q % 2 ? '#ffc0d4' : '#fff0f6'; g.fillRect(Math.round(X), Math.round(Y), 2, 1); if (q % 3 === 0) g.fillRect(Math.round(X) + 1, Math.round(Y) - 1, 1, 1); } }
      else { const cols = kind === 'bigmush' ? ['#7ef0d0', '#c8fff0'] : kind === 'altar' ? ['#c890ff', '#f0d8ff'] : ['#c8a0ff', '#9cff8a'];
        for (let q = 0; q < 4; q++) { const a = TWM.hash2(st.ph, q, 72), ph = (t * 0.22 + a * 5) % 1, X = st.X + st.sp.w * (0.25 + a * 0.5) + Math.sin(t * 1.3 + q * 3) * 4, Y = st.Y + st.sp.h * 0.55 - ph * st.sp.h * 0.5;
          g.fillStyle = cols[q % 2]; g.globalAlpha = Math.sin(ph * Math.PI) * 0.9; g.fillRect(Math.round(X), Math.round(Y), 1, 1); g.globalAlpha = 1; } } }
    { const Wb = TWM.webs[0]; if (Wb) { const ext = S.web ? S.web.ext : Wb.base, cx = R.wx(Wb.x, Wb.y), cy = R.wy(Wb.x, Wb.y, Wb.z);
      if (cx > x0 - 300 && cx < x0 + W + 300 && cy > y0 - 200 && cy < y0 + Hh + 200)
        for (let q = 0; q < 46; q++) { const ang = TWM.hash2(q, 1, 73) * 6.283, rad = (0.15 + TWM.hash2(q, 2, 73) * 0.85) * Math.min(1, ext + 0.1), tw = Math.pow(Math.max(0, Math.sin(t * 1.5 + q * 2.3)), 4);
          if (tw < 0.2) continue; const X = Math.round(cx + Math.cos(ang) * Wb.rx * 4 * 1.15 * rad), Y = Math.round(cy + Math.sin(ang) * Wb.ry * 2 * 1.25 * rad);
          g.fillStyle = `rgba(255,255,255,${tw})`; g.fillRect(X, Y, 1, 1); if (tw > 0.7) { g.fillRect(X - 1, Y, 3, 1); g.fillRect(X, Y - 1, 1, 3); } } } }
    for (const f of S.fx) {
      const k = f.t / f.dur, X = R.wx(f.x, f.y), Y = R.wy(f.x, f.y, f.z || TWM.groundZ(f.x, f.y));
      if (X < x0 - 220 || X > x0 + W + 220 || Y < y0 - 300 || Y > y0 + Hh + 120) continue;
      switch (f.kind) {
        case 'cloud': { const a = f.a; if (!a) break; const cx = Math.round(R.wx(a.x, a.y)), cy = Math.round(R.wy(a.x, a.y, a.gz + a.lift) + 1); px(g, cx - 15, cy - 3, 30, 5, '#ffffff'); px(g, cx - 10, cy - 6, 20, 3, '#ffffff'); px(g, cx - 6, cy - 8, 9, 2, '#ffffff'); px(g, cx - 15, cy + 2, 30, 2, '#d8c8f0'); px(g, cx - 13, cy + 4, 26, 1, '#e8b860'); break; }
        case 'goldtrail': { for (let s = 0; s < 40; s++) { const ph = t * 0.6 - s * 0.05, gx = X + Math.cos(ph) * 120, gy = Y - 150 + Math.sin(ph * 2) * 26; g.fillStyle = `rgba(255,${210 - s * 2},${120 - s * 2},${0.9 - s / 44})`; g.fillRect(Math.round(gx), Math.round(gy), s < 4 ? 4 : 2, s < 4 ? 3 : 2); } break; }
        case 'peaches': for (let s = 0; s < 18; s++) { const a = TWM.hash2(s, 1, 98), ph = (t * 0.9 + a) % 1, gx = X + (a - 0.5) * f.r * 2, gy = Y - 30 - Math.sin(ph * Math.PI) * 40 + ph * 20; px(g, gx, gy, 3, 3, '#ffa078'); px(g, gx + 1, gy + 1, 2, 2, '#f47a62'); px(g, gx + 1, gy - 1, 1, 1, '#4c9454'); } break;
        case 'peachfall': for (let s = 0; s < 6; s++) { const a = TWM.hash2(s, 2, 98), ph = Math.min(1, k * 1.4 - a * 0.4); if (ph < 0) continue; const gx = X + (a - 0.5) * 30, gy = Y - 70 + ph * ph * 70; px(g, gx, gy, 3, 3, '#ffa078'); px(g, gx + 1, gy + 1, 2, 2, '#f47a62'); } break;
        case 'petals': { const n = f.soft ? 12 : 40; for (let s = 0; s < n; s++) { const a = TWM.hash2(s, 3, 98), gx = X + (a - 0.5) * f.r * 3 + Math.sin(t + s) * 6, gy = Y - 90 + ((t * 16 + s * 37) % 120); px(g, gx, gy, 2, 1, s % 2 ? '#ffb6c8' : '#ffe2ea'); } break; }
        case 'sparks': for (let s = 0; s < 22; s++) { const a = s * 2.39, d = (k * 0.8 + (s % 5) / 10) * f.r, gx = X + Math.cos(a) * d, gy = Y - 24 + Math.sin(a) * d * 0.5; px(g, gx, gy, 2, 2, s % 3 ? '#ffd060' : '#fff6c0'); } break;
        case 'flash': { const r = f.r * (0.6 + k); g.fillStyle = `rgba(255,248,220,${0.85 * (1 - k)})`; g.fillRect(Math.round(X - r), Math.round(Y - 22 - r * 0.6), Math.round(r * 2), Math.round(r * 1.2)); break; }
        case 'splash': for (let s = 0; s < 3; s++) { const r = ((k * 2 + s * 0.33) % 1) * 18; g.strokeStyle = `rgba(230,250,255,${0.85 * (1 - r / 18)})`; g.lineWidth = 1; g.beginPath(); g.ellipse(X, Y, r, r * 0.45, 0, 0, 6.29); g.stroke(); } for (let s = 0; s < 8; s++) { const a = s * 0.8, ph = k * 1.6; if (ph > 1) break; px(g, X + Math.cos(a) * 8 * ph, Y - Math.sin(ph * Math.PI) * 14 + Math.sin(a) * 3, 2, 2, '#ffffff'); } break;
        case 'silk': for (let s = 0; s < 10; s++) { const a = s / 10 * 6.28 + t * 0.4, d = 50 * (1 - Math.min(1, k * 1.5)), gx = X + Math.cos(a) * (d + 30), gy = Y - 20 + Math.sin(a) * (d + 30) * 0.5; g.strokeStyle = 'rgba(236,232,252,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(gx, gy); g.lineTo(X, Y - 20); g.stroke(); } break;
        case 'silkrise': for (let s = 0; s < 8; s++) { const a = s / 8 * 6.28, gx = X + Math.cos(a) * 16, gy = Y + Math.sin(a) * 8, h = 40 + 90 * Math.min(1, k * 2); g.fillStyle = 'rgba(236,232,252,0.7)'; for (let y = 0; y < h; y += 2) g.fillRect(Math.round(gx + Math.sin(y * 0.1 + t * 2 + s) * 2), Math.round(gy - y), 1, 1); } break;
        case 'shreds': { const n = f.soft ? 10 : 30; for (let s = 0; s < n; s++) { const a = TWM.hash2(s, 4, 98), gx = X + (a - 0.5) * f.r * 2.6 + Math.sin(t * 0.7 + s) * 8, gy = Y - 120 + ((t * (f.soft ? 4 : 14) + s * 23) % 130); g.fillStyle = 'rgba(236,232,252,0.75)'; for (let q = 0; q < 6; q++) g.fillRect(Math.round(gx + Math.sin(q + s) * 2), Math.round(gy + q), 1, 1); } break; }
        case 'fireflies': for (let s = 0; s < 22; s++) { const a = s * 0.9 + t * (0.3 + (s % 4) * 0.1), gx = X + Math.cos(a) * (f.r + (s % 5) * 6), gy = Y - 14 + Math.sin(a * 1.3) * 10 - (s % 7) * 3; if (Math.floor(t * 3 + s) % 5 === 0) continue; px(g, gx, gy, 1, 1, s % 2 ? '#c8ff9a' : '#e2c8ff'); } break;
      }
    }
    // HQS ambience: petals drifting from the peach grove, mist at the waterfall foot
    for (const fl of TWM.falls) { const X = R.wx((fl.i + 1) * T, (fl.j + 1.5) * T), Y = R.wy((fl.i + 1) * T, (fl.j + 1.5) * T, fl.bottom * 4); if (X < x0 - 80 || X > x0 + W + 80) continue;
      for (let s = 0; s < 18; s++) { const a = TWM.hash2(s, 5, 97), ph = (t * 0.3 + a) % 1; g.fillStyle = `rgba(255,255,255,${0.32 * (1 - ph)})`; g.fillRect(Math.round(X + (a - 0.5) * 70 + ph * 10), Math.round(Y - ph * 26 + 6), 6, 3); } }
  }
  function light(g, S, R, amt) {
    // characters keep their own colour at night: the sprite is re-drawn additively over itself (after the night grade), so people stay readable without lighting the ground
    if (amt > 0.1) { const x0 = R.cx - R.cv.width / 2 - 70, x1 = R.cx + R.cv.width / 2 + 70, y0 = R.cy - R.cv.height / 2 - 80, y1 = R.cy + R.cv.height / 2 + 100;
      g.globalAlpha = Math.min(0.62, 0.12 + amt * 0.7);
      for (const a of S.agents) { if (a.biome === 'tc' || a.gone || a.hidden || (a.alpha !== undefined && a.alpha < 0.5)) continue; const X = R.wx(a.x, a.y), Y = R.wy(a.x, a.y, a.gz); if (X < x0 || X > x1 || Y < y0 || Y > y1 || a.inWater) continue; R.drawAgent(g, a, true); }
      g.globalAlpha = 1; }
    // characters carry a soft light at night so they stay readable (violet spirit glow in the gorge, warm lantern light elsewhere)
    if (amt > 0.12 || true) for (const a of S.agents) { if (a.gone || a.hidden) continue; const btd = a.biome === 'btd', k = btd ? 0.2 + amt * 0.35 : amt * 0.4; if (k < 0.03) continue;
      const X = R.wx(a.x, a.y), Y = R.wy(a.x, a.y, a.gz + a.lift) - 18, gr = g.createRadialGradient(X, Y, 2, X, Y, 26); gr.addColorStop(0, btd ? `rgba(200,170,255,${k})` : `rgba(255,214,150,${k})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X - 26, Y - 26, 52, 52); }
    for (const f of S.fx) { if (f.kind !== 'goldtrail' && f.kind !== 'fireflies' && f.kind !== 'sparks') continue; const X = R.wx(f.x, f.y), Y = R.wy(f.x, f.y, TWM.groundZ(f.x, f.y)) - (f.kind === 'goldtrail' ? 150 : 16), r = f.kind === 'goldtrail' ? 160 : 60;
      const gr = g.createRadialGradient(X, Y, 4, X, Y, r); gr.addColorStop(0, `rgba(255,220,140,${0.12 + amt * 0.25})`); gr.addColorStop(1, 'rgba(255,220,140,0)'); g.fillStyle = gr; g.fillRect(X - r, Y - r, r * 2, r * 2); }
    if (S.web && S.web.glow) { const w = TWM.webs[0], X = R.wx(w.x, w.y), Y = R.wy(w.x, w.y, w.z), gr = g.createRadialGradient(X, Y, 10, X, Y, 220); gr.addColorStop(0, `rgba(200,150,255,${0.18 + 0.08 * Math.sin(R.t * 3)})`); gr.addColorStop(1, 'rgba(200,150,255,0)'); g.fillStyle = gr; g.fillRect(X - 220, Y - 220, 440, 440); }
  }
  return { ground, draw, light };
})();
window.TWFX = TWFX;
