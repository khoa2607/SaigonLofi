// Minimal Chrome DevTools Protocol harness (Node 22+: global WebSocket/fetch, no npm packages).
// withChrome(width, height, async ({ base, send, ev, on }) => ...) serves the repo on a random local port and drives one headless Chrome tab.
import fs from 'fs'; import os from 'os'; import path from 'path'; import { spawn } from 'child_process'; import { fileURLToPath } from 'url';
export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(p => fs.existsSync(p));
export const wait = ms => new Promise(r => setTimeout(r, ms));
export async function withChrome(w, h, fn, opts) {
  opts = opts || {};
  const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'lwcdp-')), port = 9500 + Math.floor(Math.random() * 400);
  const srv = spawn(process.execPath, ['-e', `const http=require('http'),fs=require('fs'),path=require('path');const root=${JSON.stringify(root)};const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};http.createServer((q,s)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(root,u==='/'?'index.html':u);fs.readFile(f,(e,b)=>{if(e){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':M[path.extname(f)]||'application/octet-stream'});s.end(b);});}).listen(${port},'127.0.0.1');`], { stdio: 'ignore' });
  const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--force-device-scale-factor=1', `--window-size=${w},${h}`, '--remote-debugging-port=0', `--user-data-dir=${udd}`, 'about:blank'], { stdio: 'ignore' });
  try {
    let dp = 0; for (let i = 0; i < 100 && !dp; i++) { await wait(100); try { dp = +fs.readFileSync(path.join(udd, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch (e) { } }
    const ver = await (await fetch(`http://127.0.0.1:${dp}/json/version`)).json(), ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    let id = 0; const pend = new Map(), handlers = []; ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result || d.error); pend.delete(d.id); } else if (d.method) for (const h of handlers) h(d); };
    const send0 = (method, params, sessionId) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
    const { targetId } = await send0('Target.createTarget', { url: 'about:blank' }), { sessionId } = await send0('Target.attachToTarget', { targetId, flatten: true });
    const send = (m, p) => send0(m, p, sessionId);
    await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');
    const ev = async (expr, aw) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: !!aw }, sessionId); if (r && r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 500)); return r && r.result ? r.result.value : undefined; };
    return await fn({ base: `http://127.0.0.1:${port}/`, send, ev, on: h => handlers.push(h) });
  } finally { ch.kill(); srv.kill(); await wait(400); try { fs.rmSync(udd, { recursive: true, force: true }); } catch (e) { } }
}
export async function until(ev, expr, tries, ms) { for (let i = 0; i < (tries || 120); i++) { let v = false; try { v = await ev(expr); } catch (e) { } if (v) return v; await wait(ms || 500); } return false; }
