// Headless verification of the Tết lion / dragon dance. Usage: python3 -m http.server 8765 &  node tests/dance.mjs   (BASE env overrides the URL)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765/index.html?clean=1&';
const b = await chromium.launch(); const fails = [], rep = {};
const check = (n, ok, info) => { if (!ok) fails.push(n + (info !== undefined ? ' ' + JSON.stringify(info) : '')); };
async function open(q) {
  const pg = await b.newPage({ viewport: { width: 1280, height: 800 } }); pg.errs = []; pg.on('pageerror', e => pg.errs.push(String(e).slice(0, 200)));
  await pg.goto(BASE + q); await pg.waitForFunction(() => typeof SIM !== 'undefined' && SIM.lanes.length > 0 && !G.busy, null, { timeout: 120000 }); await pg.waitForTimeout(800); return pg;
}
for (const era of [0, 1, 2, 3]) for (const kind of ['lion', 'dragon']) {
  const pg = await open(`tet=1&era=${era}&time=noon&wx=clear&dance=${kind}`);
  const r = await pg.evaluate(() => { for (let i = 0; i < 20 * 12; i++) tick(0.05); draw(); return { phase: DAN.phase, kind: DAN.kind, lions: DAN.lions.length, perfs: DAN.drag ? DAN.drag.perfs.length : 0, spec: DAN.spec.length, band: DAN.band.length, rec: DAN.spec.filter(a => a.rec).length, modes: [...new Set(DAN.spec.map(a => a.mode))], kids: DAN.spec.filter(a => a.look.kid).length, steps: DAN.stats.steps, bars: DAN.stats.bars }; });
  rep[kind + era] = r;
  check(`${kind}${era} runs`, r.phase === 'run' && r.kind === kind, r);
  if (kind === 'lion') check(`${kind}${era} 2-3 lions`, r.lions >= 2 && r.lions <= 3, r); else check(`${kind}${era} 6-8 performers`, r.perfs >= 6 && r.perfs <= 8, r);
  check(`${kind}${era} spectators + band`, r.spec >= 15 && r.band === 4, r);
  check(`${kind}${era} beats run`, r.steps > 50 && r.bars >= 3, r);
  if (era >= 2) { await pg.evaluate(() => { for (const a of DAN.spec) { a.mode = 'film'; a.cheer = 0; } for (let i = 0; i < 4; i++) tick(0.05); }); check(`${kind}${era} smartphone recorders`, (await pg.evaluate(() => DAN.spec.filter(a => a.rec).length)) > 0); }
  check(`${kind}${era} no page errors`, pg.errs.length === 0, pg.errs);
  await pg.close();
}
{ // alternation + rests + off switch + lion click + camera click + audio routing
  const pg = await open('tet=1&era=1&time=noon&wx=clear');
  rep.cycle = await pg.evaluate(() => { const seen = [], rests = []; let last = null, restT = 0; for (let i = 0; i < 20 * 400; i++) { tick(0.05); if (DAN.phase === 'rest') restT += 0.05; if (DAN.phase !== last) { if (last === 'rest' && DAN.phase === 'run') { seen.push(DAN.kind); rests.push(restT); restT = 0; } last = DAN.phase; } } return { seen, rests }; });
  check('alternates lion / dragon', rep.cycle.seen.length >= 4 && rep.cycle.seen.every((k, i) => i === 0 || k !== rep.cycle.seen[i - 1]), rep.cycle);
  check('rest periods exist', rep.cycle.rests.slice(1).every(r => r > 10), rep.cycle);
  const g = await pg.evaluate(() => { DAN.sync(); DAN.hold = 'lion'; DAN.start('lion'); for (let i = 0; i < 100; i++) tick(0.05); draw(); const L = DAN.lions[0]; const rc = R.canvas.getBoundingClientRect(); const cx = rc.left + (L.rect[0] + L.rect[2]) / 2 * rc.width / R.vw, cy = rc.top + (L.rect[1] + L.rect[3]) / 2 * rc.height / R.vh; const hit = DAN.click(cx, cy); for (let i = 0; i < 30; i++) tick(0.05); const mid = { greet: L.greet, mode: L.mode, hdy: L.hdy }; return { hit, mid, dir: L.dir }; });
  check('click lion greets', g.hit && g.mid.mode === 'greet' && g.dir < 2, g);
  const cam = await pg.evaluate(() => { for (let i = 0; i < 100; i++) tick(0.05); R.tween = null; const Z = DAN.Z.lion, rc = R.canvas.getBoundingClientRect(); const s = scn(Z.cx + 25, Z.cy + 25, 0); const ok = DAN.click(rc.left + s[0] * rc.width / R.vw, rc.top + s[1] * rc.height / R.vh); return { ok, tw: R.tween }; });
  check('click area moves camera', cam.ok && cam.tw, cam);
  const off = await pg.evaluate(() => { setTet(false); for (let i = 0; i < 20; i++) tick(0.05); return { phase: DAN.phase, all: DAN.all().length, bus: DAN.bus ? DAN.bus.gain.value : null, vis: G.world.items.length }; });
  check('everything gone when Tet off', off.phase === 'rest' && off.all === 0, off);
  check('no errors cycle', pg.errs.length === 0, pg.errs); await pg.close();
}
{ // audio: drums reach the street bus, volume follows camera distance, mute silences
  const pg = await open('tet=1&era=1&time=noon&wx=clear&dance=lion');
  rep.audio = await pg.evaluate(async () => { audioPlay(); await new Promise(r => setTimeout(r, 300)); if (AU.ctx.state !== 'running') await AU.ctx.resume(); const Z = DAN.Z.lion; R.panX = Z.cx - Z.cy; R.panY = (Z.cx + Z.cy) / 2 - WORLD / 2; camera(); for (let i = 0; i < 80; i++) tick(0.05); const near = DAN.loudness(); R.panX += 400; camera(); const far = DAN.loudness(); const snd = DAN.stats.snd; return { state: AU.ctx.state, snd, near, far, bus: !!DAN.bus }; });
  if (rep.audio.state === 'running') { check('drum sounds scheduled', rep.audio.snd > 10 && rep.audio.bus, rep.audio); check('quieter when far', rep.audio.far < rep.audio.near * 0.6, rep.audio); } else rep.audio.note = 'audio context not running in headless; skipped';
  check('no errors audio', pg.errs.length === 0, pg.errs); await pg.close();
}
console.log(JSON.stringify(rep)); await b.close();
console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'PASS'); process.exit(fails.length ? 1 : 0);
