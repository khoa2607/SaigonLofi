// Holdfast real-time performance measurement through the Chrome DevTools protocol (Node 22+ global WebSocket, no npm packages).
// Usage: node tests/holdfast-bench.mjs [--gpu] [--chrome=PATH] [--era=past|future]
import fs from 'fs'; import os from 'os'; import path from 'path'; import { spawn } from 'child_process'; import { fileURLToPath } from 'url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), args = process.argv.slice(2), opt = k => (args.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const CHROME = [opt('chrome'), process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(p => fs.existsSync(p));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' }, port = 9100 + Math.floor(Math.random() * 300);
const srv = spawn(process.execPath, ['-e', `const http=require('http'),fs=require('fs'),path=require('path');const root=${JSON.stringify(root)};const M=${JSON.stringify(MIME)};http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,b)=>{if(e){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':M[path.extname(f)]||'application/octet-stream'});s.end(b);});}).listen(${port},'127.0.0.1');`], { stdio: 'ignore' });
const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'hfbench-'));
const results = {};
async function measure(w, h, q) {
  const ch = spawn(CHROME, ['--headless=new', ...(args.includes('--gpu') ? [] : ['--disable-gpu']), '--mute-audio', '--force-device-scale-factor=1', `--window-size=${w},${h}`, '--remote-debugging-port=0', `--user-data-dir=${udd}`, 'about:blank'], { stdio: 'ignore' });
  let port2 = 0; for (let i = 0; i < 100 && !port2; i++) { await new Promise(r => setTimeout(r, 100)); try { port2 = +fs.readFileSync(path.join(udd, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch (e) { } }
  const ver = await (await fetch(`http://127.0.0.1:${port2}/json/version`)).json(), ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r); let id = 0; const pend = new Map(); ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } };
  const send = (method, params, sessionId) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  const { targetId } = await send('Target.createTarget', { url: `http://127.0.0.1:${port}/holdfast/index.html?bench=1&frames=180&warp=30&era=${['past', 'future'].includes(opt('era')) ? opt('era') : 'current'}${q}` });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  let out = null; for (let i = 0; i < 240 && !out; i++) { await new Promise(r => setTimeout(r, 500)); const r = await send('Runtime.evaluate', { expression: "document.title === 'HFBENCH done' ? document.getElementById('hfTest').textContent : ''", returnByValue: true }, sessionId); if (r && r.result && r.result.value) out = JSON.parse(r.result.value); }
  ws.close(); ch.kill(); await new Promise(r => setTimeout(r, 500)); fs.rmSync(path.join(udd, 'DevToolsActivePort'), { force: true });
  return out;
}
try {
  for (const [w, h, q, name] of [[1920, 1080, '', 'desktop 1080p, 120 residents'], [1280, 720, '', 'laptop 720p, 120 residents'], [390, 844, '&pop=70', 'phone portrait size, 70 residents'], [1920, 1080, '&attack=60&warp=110', 'desktop 1080p during a 60-strong attack']]) results[name] = await measure(w, h, q);
} finally { srv.kill(); }
console.log(JSON.stringify(results, null, 1));
