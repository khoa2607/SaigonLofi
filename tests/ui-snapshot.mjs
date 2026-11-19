// UI snapshot / parity tool (Chrome DevTools protocol, Node 22+, no npm packages).
//   node tests/ui-snapshot.mjs snap  <saigon|holdfast> <out.json>      dump computed styles + rects of the shared UI
//   node tests/ui-snapshot.mjs diff  <a.json> <b.json>                  exact comparison (Saigon before/after refactor)
//   node tests/ui-snapshot.mjs parity <saigon.json> <holdfast.json>     layout parity of the controls both worlds share
import fs from 'fs'; import os from 'os'; import path from 'path'; import { spawn } from 'child_process'; import { fileURLToPath } from 'url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), [mode, a1, a2] = process.argv.slice(2);
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(p => fs.existsSync(p));
const VIEWS = [['desktop', 1366, 768], ['laptop', 1024, 700], ['tablet', 768, 1024], ['phone', 390, 844], ['small', 360, 640]];
const SEL = '#hud, #hud *, #dock, #dock *, #lang, #lang *, #ytbox, #ytbox *';
// everything that should look/layout the same in both worlds, keyed by id/class path
const COLLECT = `(() => {
  const out = {}; const els = [...document.querySelectorAll(${JSON.stringify(SEL)})];
  const key = (e, i) => (e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.dataset && (e.dataset.lang || e.dataset.season || e.dataset.time || e.dataset.wx) ? '[' + (e.dataset.lang || e.dataset.season || e.dataset.time || e.dataset.wx) + ']' : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ').join('.') : '')) + '@' + i;
  els.forEach((e, i) => { const cs = getComputedStyle(e), r = e.getBoundingClientRect(), s = {}; for (const p of cs) s[p] = cs.getPropertyValue(p); out[key(e, i)] = { id: e.id, cls: String(e.className && e.className.baseVal !== undefined ? '' : e.className), tag: e.tagName, rect: [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10], hidden: cs.display === 'none' || cs.visibility === 'hidden', style: s }; });
  return out; })()`;
async function withChrome(w, h, fn) {
  const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'uisnap-')), port = 9500 + Math.floor(Math.random() * 400);
  const srv = spawn(process.execPath, ['-e', `const http=require('http'),fs=require('fs'),path=require('path');const root=${JSON.stringify(root)};const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};http.createServer((q,s)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(root,u==='/'?'index.html':u);fs.readFile(f,(e,b)=>{if(e){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':M[path.extname(f)]||'application/octet-stream'});s.end(b);});}).listen(${port},'127.0.0.1');`], { stdio: 'ignore' });
  const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', '--mute-audio', '--force-device-scale-factor=1', `--window-size=${w},${h}`, '--remote-debugging-port=0', `--user-data-dir=${udd}`, 'about:blank'], { stdio: 'ignore' });
  try {
    let dp = 0; for (let i = 0; i < 100 && !dp; i++) { await new Promise(r => setTimeout(r, 100)); try { dp = +fs.readFileSync(path.join(udd, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch (e) { } }
    const ver = await (await fetch(`http://127.0.0.1:${dp}/json/version`)).json(), ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    let id = 0; const pend = new Map(); ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result || d.error); pend.delete(d.id); } };
    const send = (method, params, sessionId) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' }), { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const ev = async (expr, aw) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: !!aw }, sessionId); if (r && r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400)); return r && r.result ? r.result.value : undefined; };
    return await fn({ base: `http://127.0.0.1:${port}/`, send: (m, p) => send(m, p, sessionId), ev });
  } finally { ch.kill(); srv.kill(); await new Promise(r => setTimeout(r, 400)); try { fs.rmSync(udd, { recursive: true, force: true }); } catch (e) { } }
}
const wait = ms => new Promise(r => setTimeout(r, ms));
async function snap(world) {
  const res = {};
  for (const [vn, w, h] of VIEWS) {
    await withChrome(w, h, async c => {
      await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: vn === 'phone' || vn === 'small' });
      const url = world === 'saigon' ? c.base + 'index.html?era=1&time=noon&wx=clear&season=summer' : c.base + 'holdfast/index.html?time=noon&wx=clear&season=summer&warp=5';
      await c.send('Page.navigate', { url });
      const ready = world === 'saigon' ? "!!(window.G && G.world && !G.busy)" : "!!(window.HFAPI && HFAPI.HFG.booted)";
      for (let i = 0; i < 240; i++) { await wait(500); if (await c.ev(`(() => { try { return ${ready}; } catch (e) { return false; } })()`)) break; }
      await wait(1500);
      for (const lang of ['vi', 'en']) for (const open of [false, true]) {
        await c.ev(`setLang(${JSON.stringify(lang)}); document.getElementById('panel').hidden = ${!open}; var m = document.getElementById('more'); if (m) m.setAttribute('aria-expanded', ${open}); document.getElementById('ytbox').hidden = ${open}; 0`);
        await wait(250);
        res[`${vn}/${lang}/${open ? 'open' : 'closed'}`] = await c.ev(COLLECT);
      }
      await c.send('Page.captureScreenshot', {}).then(r => { if (r && r.data && a2) fs.writeFileSync(a2.replace(/\.json$/, `-${vn}.png`), Buffer.from(r.data, 'base64')); });
    });
  }
  return res;
}
const strip = o => { const r = {}; for (const [k, v] of Object.entries(o)) r[k.replace(/@\d+$/, '')] = v; return r; };
const near = (a, b) => { const na = String(a).match(/-?[\d.]+/g), nb = String(b).match(/-?[\d.]+/g); if (!na || !nb || na.length !== nb.length || String(a).replace(/-?[\d.]+/g, '#') !== String(b).replace(/-?[\d.]+/g, '#')) return false; return na.every((v, i) => Math.abs(v - nb[i]) < 0.3); };   // web-font sub-pixel jitter between runs
function diff(A, B, only) {
  const bad = []; for (const view of Object.keys(A)) { const a = A[view], b = B[view]; if (!b) { bad.push(view + ' missing'); continue; }
    for (const k of Object.keys(a)) { if (only && !only(k)) continue; if (/^(#ticker|#hint)/.test(k)) continue;; /* animated / text-dependent */ const x = a[k], y = b[k]; if (!y) { bad.push(`${view} ${k} missing`); continue; }
      for (const p of Object.keys(x.style)) { if (k.startsWith('#hud@') || k === '#hud') { if (/^(inline-size|inset-inline-end|perspective-origin|right|transform-origin|width|block-size|bottom|height|inset-block-end)$/.test(p)) continue; } if (/^(animation|transition|-webkit-)/.test(p) && k.startsWith('#ticker')) continue; if (x.style[p] !== y.style[p] && !near(x.style[p], y.style[p])) bad.push(`${view} ${k} ${p}: ${x.style[p]} != ${y.style[p]}`); }
      if (x.rect.some((v, i) => Math.abs(v - y.rect[i]) > 0.3) && !k.startsWith('#ticker') && k !== '#hud') bad.push(`${view} ${k} rect ${x.rect} != ${y.rect}`); } }
  return bad;
}
if (mode === 'snap') { const s = await snap(a1); fs.writeFileSync(a2, JSON.stringify(s)); console.log('wrote', a2, Object.keys(s).length, 'states'); }
else if (mode === 'diff') { const A = JSON.parse(fs.readFileSync(a1)), B = JSON.parse(fs.readFileSync(a2)); for (const s of [A, B]) for (const v of Object.keys(s)) s[v] = strip(s[v]); const bad = diff(A, B); console.log(bad.length ? 'DIFF ' + bad.length + '\n' + bad.slice(0, 40).join('\n') : 'IDENTICAL'); process.exit(bad.length ? 1 : 0); }
else if (mode === 'parity') {
  // placement parity of the shared controls: same element ids, same position/size (+- 1px) at every viewport/language/panel state
  const A = JSON.parse(fs.readFileSync(a1)), B = JSON.parse(fs.readFileSync(a2)), IDS = ['#lang', '#toMenu', '#eras', '#info', '#dock', '#play', '#tname', '#viz', '#prev', '#next', '#more', '#autoSeason', '#panel', '#ytUrl', '#ytGo', '#vMusic', '#vAmb', '#vVinyl', '#vStreet', '#streetOn', '#zout', '#zin', '#full', '#hide', '#ytbox'], bad = []; let n = 0;
  for (const view of Object.keys(A)) { const a = strip(A[view]), b = strip(B[view]); for (const id of IDS) { const x = a[id], y = b[id]; if (!x || !y) { bad.push(`${view} ${id} missing in ${!x ? 'saigon' : 'holdfast'}`); continue; } n++; if (x.hidden !== y.hidden) { bad.push(`${view} ${id} hidden ${x.hidden} != ${y.hidden}`); continue; }
      if (x.hidden) continue; const inDock = !['#lang', '#toMenu', '#eras', '#info', '#ytbox', '#dock'].includes(id), rx = inDock ? [x.rect[0], x.rect[1] - a['#dock'].rect[1], x.rect[2], x.rect[3]] : x.rect, ry = inDock ? [y.rect[0], y.rect[1] - b['#dock'].rect[1], y.rect[2], y.rect[3]] : y.rect;   // dock contents are compared relative to the dock top (Holdfast's panel has one extra Journal row)
      if (id === '#dock' || id === '#panel') { const extra = view.endsWith('/open') ? 48 : 0; if ((!/^(phone|small)/.test(view) && Math.abs((y.rect[3] - x.rect[3]) - extra) > 1.5) || Math.abs(y.rect[0] - x.rect[0]) > 1.5 || Math.abs(y.rect[2] - x.rect[2]) > 1.5) bad.push(`${view} ${id} size ${x.rect} vs ${y.rect}`); continue; }
      const d = rx.map((v, i) => Math.abs(v - ry[i])); const tol = id === '#eras' || id === '#info' || id === '#tname' || id === '#hint' ? [1, 1, 400, 40] : [1.5, 1.5, 1.5, 1.5]; if (d.some((v, i) => v > tol[i])) bad.push(`${view} ${id} rect ${x.rect} vs ${y.rect}`); } }
  console.log(bad.length ? ['PARITY DIFF ' + bad.length + ' of ' + n, ...bad.slice(0, 60)].join(String.fromCharCode(10)) : 'PARITY OK (' + n + ' element placements compared)'); process.exit(bad.length ? 1 : 0);
}
