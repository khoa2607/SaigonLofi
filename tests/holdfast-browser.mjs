// Holdfast browser checks: self-test, render benchmark, gallery integration, Saigon smoke, screenshots.
// Needs only Node + Google Chrome (or Edge/Chromium). No npm packages.
// Usage: node tests/holdfast-browser.mjs [--shots] [--bench] [--chrome=PATH]
import fs from 'fs'; import path from 'path'; import { spawn, spawnSync } from 'child_process'; import { fileURLToPath } from 'url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), has = f => args.includes(f), opt = k => (args.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const CANDS = [opt('chrome'), process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
const CHROME = CANDS.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
if (!CHROME) { console.error('Chrome not found. Pass --chrome=PATH or set CHROME.'); process.exit(2); }
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
// a tiny static server in a child process, so the synchronous Chrome calls below can reach it
const port = 8800 + Math.floor(Math.random() * 400);
const srvCode = `const http=require('http'),fs=require('fs'),path=require('path');const root=${JSON.stringify(root)};const M=${JSON.stringify(MIME)};http.createServer((q,s)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(root,u==='/'?'index.html':u);fs.readFile(f,(e,b)=>{if(e){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':M[path.extname(f)]||'application/octet-stream'});s.end(b);});}).listen(${port},'127.0.0.1');`;
const S = spawn(process.execPath, ['-e', srvCode], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 600));
const B2 = `http://127.0.0.1:${port}/`;
const run = (url, extra, w, h, budget) => spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--force-device-scale-factor=1', `--window-size=${w || 1920},${h || 1080}`, `--virtual-time-budget=${budget || 90000}`, ...extra, B2 + url], { encoding: 'utf8', timeout: 300000, maxBuffer: 64 << 20 });
const grab = (html, id) => { const m = html.match(new RegExp(`<pre id="${id}"[^>]*>([^<]*)</pre>`)); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : null; };
const fails = [], rep = {};
const check = (k, ok, info) => { rep[k] = { ok: !!ok, info }; if (!ok) fails.push(k + ' ' + JSON.stringify(info)); };
try {
  // 1) in-page self test (zones, camera, weather, time, no console errors)
  const st = grab(run('holdfast/index.html?test=1&warp=60', ['--dump-dom']).stdout || '', 'hfTest');
  check('holdfast self-test', st && st.ok, st);
  // 2) gallery integration + Saigon smoke
  const pr = grab(run('tests/holdfast-probe.html', ['--dump-dom'], 1400, 900, 120000).stdout || '', 'out');
  rep.probe = pr; const g = pr && pr.gallery, sg = pr && pr.saigon;
  check('gallery: Saigon + Holdfast live', g && g.live.includes('saigon') && g.live.includes('holdfast') && g.cards === 6, g && g.live);
  check('gallery: shared radio bridge', g && g.bridge);
  check('gallery: Holdfast opens in frame and boots', g && g.frameOpen && g.hfBooted && g.hfPainted > 50, g && [g.frameOpen, g.hfBooted, g.hfPainted]);
  check('gallery: Holdfast has no console errors', g && Array.isArray(g.hfErrors) && g.hfErrors.length === 0, g && g.hfErrors);
  check('gallery: back to gallery hides (keeps alive) the frame', g && g.frameClosed && g.menuBack, g && [g.frameClosed, g.menuBack]);
  check('saigon: still boots and paints', sg && sg.booted && sg.painted > 50 && sg.menuHidden, sg);
  // 3) benchmark (headless software rendering: pessimistic vs a real GPU)
  if (has('--bench')) { for (const [w, h, q] of [[1920, 1080, ''], [1280, 720, ''], [390, 844, '&pop=70']]) { const b = grab(run(`holdfast/index.html?bench=1&frames=180&warp=30${q}`, ['--dump-dom'], w, h).stdout || '', 'hfTest'); rep['bench ' + w + 'x' + h] = b; } }
  // 4) screenshots
  if (has('--shots')) {
    const dir = path.join(root, 'docs/holdfast/screenshots'); fs.mkdirSync(dir, { recursive: true });
    const SH = [['01-default-current.png', 'warp=45&hour=9&time=auto&wx=clear&season=summer', 1920, 1080], ['02-settlement.png', 'warp=40&time=noon&wx=clear&season=summer&cam=commons', 1920, 1080], ['03-barricade-gate.png', 'warp=50&time=morning&wx=clear&season=summer&cam=gate&zoom=1', 1920, 1080],
      ['04-zombie-attack.png', 'warp=110&time=noon&wx=clear&season=summer&attack=44&cam=west', 1920, 1080], ['05-scavenger-expedition.png', 'warp=150&time=noon&wx=clear&season=summer&exp=1&cam=exp&danger=grim', 1920, 1080],
      ['06-dusk.png', 'warp=40&time=dusk&wx=clear&season=fall&cam=default', 1920, 1080], ['07-night.png', 'warp=40&time=night&wx=clear&season=summer&cam=gate', 1920, 1080], ['08-rain.png', 'warp=40&time=noon&wx=rain&season=spring&cam=market', 1920, 1080],
      ['09-winter-snow.png', 'warp=40&time=morning&wx=rain&season=winter&cam=commons', 1920, 1080], ['10-mobile-portrait.png', 'warp=40&time=noon&wx=clear&season=summer&pop=70', 390, 844]];
    for (const [f, q, w, h] of SH) { run('holdfast/index.html?' + q, [`--screenshot=${path.join(dir, f)}`], w, h); rep['shot ' + f] = fs.existsSync(path.join(dir, f)); }
  }
} finally { S.kill(); }
console.log(JSON.stringify(rep, null, 1));
console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'PASS');
process.exit(fails.length ? 1 : 0);
