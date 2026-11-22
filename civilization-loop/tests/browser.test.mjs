// Browser checks (headless Chromium through Playwright; the package is not a dependency of this project).
// Run: node tests/browser.test.mjs [--shots]   (starts its own static server)
import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url'; import { createRequire } from 'module';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.log('SKIP: the playwright package is not available'); process.exit(0); }
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, s) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); if (!f.startsWith(root) || !fs.existsSync(f)) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(fs.readFileSync(f)); });
await new Promise(r => srv.listen(0, r)); const base = `http://127.0.0.1:${srv.address().port}/index.html`;
let fails = 0; const check = (n, ok, i) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (i !== undefined ? '  ' + JSON.stringify(i) : '')); if (!ok) fails++; };
const shots = process.argv.includes('--shots'), shotDir = path.join(root, 'docs', 'screenshots'); if (shots) fs.mkdirSync(shotDir, { recursive: true });
const browser = await chromium.launch();
async function open(q, w = 1280, h = 800) { const pg = await browser.newPage({ viewport: { width: w, height: h } }); pg.errs = []; pg.on('pageerror', e => pg.errs.push(String(e).slice(0, 300))); pg.on('console', m => { if (m.type() === 'error') pg.errs.push(m.text().slice(0, 200)); }); await pg.goto(`${base}?${q}`); await pg.waitForTimeout(1500); return pg; }
const nonBlank = async pg => pg.evaluate(() => { const c = document.getElementById('world'), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data; const seen = new Set(); for (let i = 0; i < d.length; i += 4 * 97) seen.add((d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4)); return seen.size; });
try {
  // boots, draws, HUD
  let pg = await open('seed=7&new&speed=0&freeze&time=0.45'); check('boot: no console or page errors', pg.errs.length === 0, pg.errs);
  check('boot: the world canvas is drawn (many distinct colours)', (await nonBlank(pg)) > 40, await nonBlank(pg));
  const hud = await pg.evaluate(() => ({ yr: document.getElementById('yr').textContent, pop: document.getElementById('pop').textContent, stage: document.getElementById('stage').textContent }));
  check('hud: year, population and civilization stage are shown', /Year 1/.test(hud.yr) && hud.pop === '10' && /Camp/.test(hud.stage), hud);
  // pause / speeds: the clock follows real time, independent of frames
  const y0 = await pg.evaluate(() => CL.S.t); await pg.waitForTimeout(800); const y1 = await pg.evaluate(() => CL.S.t); check('time: paused means the simulation does not advance', y0 === y1, [y0, y1]);
  await pg.click('#b1'); let t0 = await pg.evaluate(() => CL.S.t); await pg.waitForTimeout(3000); let t1 = await pg.evaluate(() => CL.S.t); check('time: normal speed is about 2 months per second', t1 - t0 >= 3 && t1 - t0 <= 10, t1 - t0);
  await pg.click('#b3'); t0 = t1; await pg.waitForTimeout(2000); t1 = await pg.evaluate(() => CL.S.t); check('time: very fast speed is about 30 months per second', t1 - t0 >= 30 && t1 - t0 <= 90, t1 - t0);
  await pg.keyboard.press('Space'); t0 = await pg.evaluate(() => CL.S.t); await pg.waitForTimeout(600); t1 = await pg.evaluate(() => CL.S.t); check('controls: Space pauses', t0 === t1);
  await pg.keyboard.press('2'); await pg.waitForTimeout(1200); check('controls: key 2 selects fast speed', await pg.evaluate(() => document.getElementById('b2').classList.contains('on') && CL.S.t > 0));
  // inspect
  await pg.click('#bPause'); await pg.mouse.click(640, 400); const insp = await pg.evaluate(() => ({ shown: getComputedStyle(document.getElementById('inspect')).display, text: document.getElementById('inspect').textContent })); check('inspect: clicking a tile shows what the land remembers', insp.shown === 'block' && /remembers/.test(insp.text), insp.text.slice(0, 80));
  check('boot: still no errors after interaction', pg.errs.length === 0, pg.errs);
  // save / load
  await pg.evaluate(() => CL.runYears(30)); const yr = await pg.evaluate(() => CL.S.year); await pg.click('#bSave'); await pg.evaluate(() => CL.runYears(10)); await pg.click('#bLoad'); const yr2 = await pg.evaluate(() => CL.S.year); check('save/load: loading restores the saved year', yr2 === yr, [yr, yr2]); await pg.close();
  // determinism across page loads
  const hs = []; for (let i = 0; i < 2; i++) { const p = await open('seed=11&new&warp=120&speed=0&freeze'); hs.push(await p.evaluate(() => JSON.stringify(CL.summary(CL.S)))); await p.close(); } check('determinism: two page loads with the same seed give the same world', hs[0] === hs[1], hs[0].slice(0, 80));
  // a long, busy world: performance and no errors
  pg = await open('seed=7&new&warp=90&speed=3&scale=2', 1920, 1080); await pg.waitForTimeout(1500);
  const perf = await pg.evaluate(() => { const times = []; for (let i = 0; i < 90; i++) { const t = performance.now(); CL.R.draw(CL.S, i / 60, 30); times.push(performance.now() - t); } times.sort((a, b) => a - b); return { median: +times[45].toFixed(2), p95: +times[85].toFixed(2), pop: CL.summary(CL.S).pop, buildings: CL.summary(CL.S).buildings }; });
  check('performance: a full town at 1920x1080 draws in well under a frame (software canvas)', perf.median < 12, perf);
  const sim = await pg.evaluate(() => { const t = performance.now(); for (let i = 0; i < 120; i++) CL.step(CL.S); return +((performance.now() - t) / 120).toFixed(2); }); check('performance: one simulated month costs little even for a town', sim < 8, sim + ' ms');
  check('long run: no errors at very fast speed', pg.errs.length === 0, pg.errs); await pg.close();
  if (shots) {
    const S = [['01-first-camp.png', 'seed=7&new&speed=0&freeze&time=0.42&scale=4&warp=2'], ['02-growing-settlement.png', 'seed=7&new&speed=0&freeze&time=0.42&scale=3&warp=35'], ['03-town.png', 'seed=7&new&speed=0&freeze&time=0.42&scale=2&warp=70'], ['04-town-night.png', 'seed=7&new&speed=0&freeze&time=0.92&scale=3&warp=70'], ['05-ruins-and-regrowth.png', 'seed=2&new&speed=0&freeze&time=0.42&scale=3&warp=430']];
    for (const [f, q] of S) { const p = await open(q, 1600, 900); await p.waitForTimeout(400); await p.screenshot({ path: path.join(shotDir, f) }); await p.close(); }
  }
} finally { await browser.close(); srv.close(); }
console.log(fails ? `\nFAIL (${fails})` : '\nPASS'); process.exit(fails ? 1 : 0);
