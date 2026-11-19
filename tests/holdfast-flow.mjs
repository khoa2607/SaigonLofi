// End-to-end Holdfast flow in real headless Chrome: instant living world, controls, shared radio/YouTube, gallery round trip, preference restore.
// Usage: node tests/holdfast-flow.mjs [--no-youtube]      (needs Chrome; the YouTube step needs network)
import { withChrome, until, wait } from './cdp.mjs';
const NO_YT = process.argv.includes('--no-youtube');
const fails = [], rep = {}, errors = [];
const check = (k, ok, info) => { rep[k] = { ok: !!ok, info }; if (!ok) fails.push(k + ' ' + JSON.stringify(info)); };
const H = 'document.getElementById("hfFrame").contentWindow';
const key = (send, k) => send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k }).then(() => send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k }));
await withChrome(1366, 768, async ({ base, send, ev, on }) => {
  on(d => { if (d.method === 'Runtime.exceptionThrown') errors.push('exception: ' + JSON.stringify(d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description || d.params.exceptionDetails.text).slice(0, 200)); if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') { const m = d.params.args.map(a => a.value || a.description || '').join(' '); if (!/Failed to load resource|favicon/i.test(m)) errors.push('console.error: ' + m.slice(0, 200)); } });
  await send('Page.navigate', { url: base + 'index.html' });
  check('gallery: shows', await until(ev, '!!(typeof MENU !== "undefined" && MENU.built && !document.getElementById("menu").hidden)', 60, 500));
  // ---------------------------------------------------------------- 1) enter Holdfast from the gallery
  await ev('document.querySelector(\'.mcard[data-world="holdfast"]\').click(); 0');
  check('enter: frame boots', await until(ev, `!!(document.getElementById("hfFrame") && ${H}.HFAPI && ${H}.HFAPI.HFG.booted)`, 240, 500));
  await ev(`${H}.__mark = 'frame-1'; 0`);
  const first = await ev(`JSON.stringify(${H}.HFAPI.HFG.first)`).then(JSON.parse);
  rep.first = first;
  check('first state: world is not a fresh start (t=0, empty chronicle)', first.t === 0 && first.logEntries === 0, [first.t, first.logEntries]);
  check('first state: snipers already in their towers', first.towerGuards > 0 && first.towerSeated === first.towerGuards, [first.towerSeated, first.towerGuards]);
  check('first state: gate guards already at the gate', first.gateAtPost === first.gateGuards, [first.gateAtPost, first.gateGuards]);
  const meal = (first.hour >= 11.8 && first.hour < 12.9) || (first.hour >= 18.3 && first.hour < 19.2);   // lunchtime: they are eating together instead
  check('first state: farmers already working in fields (or at the meal)', meal || first.farmersWorking >= Math.floor(first.farmers * 0.6), [first.farmersWorking, first.farmers, first.hour]);
  check('first state: fishers already at the docks (or at the meal)', meal || first.fishersWorking >= Math.floor(first.fishers * 0.6), [first.fishersWorking, first.fishers]);
  check('first state: nobody shares one spawn point', first.biggestCell / first.people < 0.12, [first.biggestCell, first.people]);
  check('first state: residents already walking', first.walking >= 5, first.walking);
  check('first state: infected spread over the wilderness, none inside', first.zombies >= 20 && first.zombieSpread > 90 && first.zombiesInside === 0, [first.zombies, first.zombieSpread, first.zombiesInside]);
  check('first state: wildlife already roaming', first.wildlife >= 20, first.wildlife);
  check('first frame is painted before the loading card goes away', await ev(`(() => { const cv = ${H}.document.getElementById("c"), g = cv.getContext("2d"), d = g.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i] + d[i + 1] + d[i + 2] > 120) n++; return n > 200; })()`));
  // no mass migration: ten seconds later people are still spread, not streaming from one entrance
  await wait(8000);
  const spread = await ev(`(() => { const w = ${H}, live = w.HFAPI.HS.people.filter(p => p.alive && p.vis !== false), cell = new Map(); for (const p of live) { const k = Math.floor(p.x / 24) + "," + Math.floor(p.y / 24); cell.set(k, (cell.get(k) || 0) + 1); } return { big: Math.max(...cell.values()), n: live.length, t: w.HFAPI.HS.t }; })()`);
  check('8 s later: still no cluster / mass migration', spread.big / spread.n < 0.12 && spread.t > 3, spread);
  // ---------------------------------------------------------------- 2) controls: the shared dock
  const lw = 'window.LW.AU';
  check('radio: gallery entry started the shared music', await ev(`${lw}.playing === true`));
  await ev(`${H}.document.getElementById("play").click(); 0`); await wait(300);
  check('dock: play button pauses the shared radio', (await ev(`${lw}.playing`)) === false);
  await ev(`${H}.document.getElementById("play").click(); 0`); await wait(300);
  check('dock: play button resumes it', (await ev(`${lw}.playing`)) === true);
  const tr0 = await ev(`${lw}.track`); await ev(`${H}.document.getElementById("next").click(); 0`); await wait(200);
  const tr1 = await ev(`${lw}.track`), nm = await ev(`${H}.document.getElementById("tname").textContent`), tn = await ev(`${H}.document.getElementById("tnum").textContent`);
  check('dock: next track changes the track and the title/counter', tr1 === (tr0 + 1) % 6 && nm.length > 2 && /\d\/6/.test(tn), [tr0, tr1, nm, tn]);
  await ev(`${H}.document.getElementById("prev").click(); 0`); await wait(200); check('dock: previous track', (await ev(`${lw}.track`)) === tr0);
  await ev(`${H}.document.getElementById("more").click(); 0`); await wait(200);
  check('dock: ··· opens the same panel', await ev(`!${H}.document.getElementById("panel").hidden`));
  const setR = (id, v) => ev(`(() => { const e = ${H}.document.getElementById(${JSON.stringify(id)}); e.value = ${v}; e.dispatchEvent(new Event("input", { bubbles: true })); })()`);
  await setR('vMusic', 30); await setR('vAmb', 0); await setR('vVinyl', 10); await wait(200);
  const vol = await ev(`JSON.stringify(${lw}.vol)`).then(JSON.parse), saved = await ev(`JSON.parse(localStorage.getItem("saigonlofi") || "{}").vol`);
  check('volume: music/ambient(mute)/vinyl sliders drive the shared mixer', Math.abs(vol.music - 0.3) < 0.01 && vol.amb === 0 && Math.abs(vol.vinyl - 0.1) < 0.01, vol);
  check('volume: preferences saved to the shared record', saved && Math.abs(saved.music - 0.3) < 0.01 && saved.amb === 0, saved);
  await setR('vAmb', 50);
  await ev(`${H}.document.getElementById("streetOn").click(); 0`); await wait(150); check('world-sound switch', (await ev(`${lw}.streetOn`)) === false); await ev(`${H}.document.getElementById("streetOn").click(); 0`);
  // YouTube
  await ev(`(() => { const d = ${H}.document; d.getElementById("ytUrl").value = "hello"; d.getElementById("ytGo").click(); })()`); await wait(400);
  check('youtube: invalid link is rejected with the bad-message style', await ev(`${H}.document.getElementById("ytMsg").classList.contains("bad")`), await ev(`${H}.document.getElementById("ytMsg").textContent`));
  if (!NO_YT) {
    await ev(`(() => { const d = ${H}.document; d.getElementById("ytUrl").value = "https://www.youtube.com/playlist?list=PLOzDu-MXXLliO9fBNZOQTBDddoA3FzZUo"; d.getElementById("ytGo").click(); })()`);
    const ytOn = await until(ev, `!!(window.LW.YTS.on && window.LW.YTS.player)`, 60, 500); check('youtube: playlist loads in the shared player', ytOn);
    await wait(2500);
    const box = await ev(`(() => { const b = document.getElementById("ytbox"), r = b.getBoundingClientRect(), cs = getComputedStyle(b); return { hidden: b.hidden, vis: cs.visibility, right: innerWidth - r.right, bottom: innerHeight - r.bottom, w: r.width, z: cs.zIndex }; })()`);
    check('youtube: box visible bottom-right like Saigon, above the world', !box.hidden && box.vis === 'visible' && Math.abs(box.right - 14) < 2 && Math.abs(box.bottom - 14) < 2 && +box.z > 9000, box);
    check('youtube: status mirrored in the Holdfast panel', (await ev(`${H}.document.getElementById("ytMsg").textContent`)).length > 3);
    await ev(`${H}.document.getElementById("ytOff").click(); 0`); await wait(300);
    check('youtube: Off returns to the built-in lofi', (await ev('window.LW.YTS.on')) === false);
  }
  // world controls
  await ev(`${H}.document.querySelector('[data-danger="grim"]').click(); ${H}.document.querySelector('[data-time="night"]').click(); ${H}.document.querySelector('[data-wx="rain"]').click(); 0`);
  await ev(`${H}.document.querySelector('[data-season="winter"]').click(); 0`);
  check('controls: danger / time / weather / season state', await until(ev, `(() => { const w = ${H}; return w.HFAPI.HS.danger === "grim" && w.HFAPI.HS.timeMode === "night" && w.HFAPI.HS.weather === "rain" && w.HFAPI.HS.season === "winter" && w.HFAPI.HR.season === "winter"; })()`, 60, 500));
  check('controls: time of day glides to night', await until(ev, `Math.abs(${H}.HFAPI.HS.hour - 22.5) < 0.3`, 30, 400), await ev(`${H}.HFAPI.HS.hour`));
  check('controls: pressed states follow', await ev(`(() => { const d = ${H}.document, p = s => d.querySelector(s).getAttribute("aria-pressed") === "true"; return p('[data-danger="grim"]') && p('[data-time="night"]') && p('[data-wx="rain"]') && p('[data-season="winter"]'); })()`));
  await ev(`${H}.document.getElementById("zin").click(); 0`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 600, y: 300, button: 'left', clickCount: 1 }); for (let i = 1; i <= 6; i++) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 600 - i * 30, y: 300 - i * 12, button: 'left' }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 420, y: 228, button: 'left', clickCount: 1 });
  await wait(700);
  const st1 = await ev(`(() => { const w = ${H}; return JSON.stringify({ t: w.HFAPI.HS.t, zoom: w.HFAPI.HR.zoom, cx: w.HFAPI.HR.cx, cy: w.HFAPI.HR.cy, season: w.HFAPI.HS.season, danger: w.HFAPI.HS.danger, time: w.HFAPI.HS.timeMode, ids: w.HFAPI.HS.people.slice(0, 40).map(p => [p.id, Math.round(p.x), Math.round(p.y)]), n: w.HFAPI.HS.people.length, kills: w.HFAPI.HS.stats.kills }); })()`).then(JSON.parse);
  await ev(`${H}.document.getElementById("viewRiver").click(); 0`); await wait(1800);
  check('view: gate button flies the camera', await ev(`Math.abs(${H}.HFAPI.HR.cx - ${st1.cx}) > 5 || Math.abs(${H}.HFAPI.HR.cy - ${st1.cy}) > 5`));
  await ev(`${H}.document.getElementById("viewRiver").click(); 0`); await wait(2500);
  await ev(`${H}.document.getElementById("logToggle").click(); 0`); check('journal lives inside the shared panel and has no "Day N"', await ev(`(() => { const l = ${H}.document.getElementById("log"); return !l.hidden && !/(Day|Ngày) \\d/.test(l.textContent) && l.children.length >= 1; })()`));
  const camBefore = await ev(`[${H}.HFAPI.HR.cx, ${H}.HFAPI.HR.cy]`);
  // hide / show
  await ev(`${H}.document.getElementById("hide").click(); 0`); check('hide panel (like Saigon)', await ev(`getComputedStyle(${H}.document.getElementById("dock")).display === "none"`));
  await ev(`${H}.document.getElementById("c").dispatchEvent(new MouseEvent("dblclick", { bubbles: true })); 0`); check('double-click shows the panel again', await ev(`getComputedStyle(${H}.document.getElementById("dock")).display !== "none"`));
  // ---------------------------------------------------------------- 3) back to the gallery, then in again
  await ev(`${H}.document.getElementById("toMenu").click(); 0`); await wait(1500);
  const away = await ev(`JSON.stringify({ frame: !!document.getElementById("hfFrame"), shown: document.getElementById("hfFrame") && getComputedStyle(document.getElementById("hfFrame")).display !== "none", menu: !document.getElementById("menu").hidden, hfopen: document.body.classList.contains("hfopen"), asleep: ${H}.HFAPI.HFG.asleep, muted: ${H}.HFAPI.HA.muted, playing: window.LW.AU.playing, t: ${H}.HFAPI.HS.t })`).then(JSON.parse);
  check('gallery: frame kept alive but hidden, gallery visible, radio still playing', away.frame && !away.shown && away.menu && !away.hfopen && away.asleep && away.playing, away);
  await wait(3000); const tIdle = await ev(`${H}.HFAPI.HS.t`); check('gallery: the sleeping world is paused (no hidden CPU burn)', Math.abs(tIdle - away.t) < 0.6, [away.t, tIdle]);
  await ev('document.querySelector(\'.mcard[data-world="holdfast"]\').click(); 0');
  check('re-entry: same frame wakes up', await until(ev, `!!(document.getElementById("hfFrame") && getComputedStyle(document.getElementById("hfFrame")).display !== "none" && ${H}.HFAPI.HFG.asleep === false)`, 40, 300));
  await wait(2500);
  const st2 = await ev(`(() => { const w = ${H}; return JSON.stringify({ mark: w.__mark, t: w.HFAPI.HS.t, zoom: w.HFAPI.HR.zoom, cx: w.HFAPI.HR.cx, cy: w.HFAPI.HR.cy, season: w.HFAPI.HS.season, danger: w.HFAPI.HS.danger, time: w.HFAPI.HS.timeMode, weather: w.HFAPI.HS.weather, ids: w.HFAPI.HS.people.slice(0, 40).map(p => [p.id, Math.round(p.x), Math.round(p.y)]), n: w.HFAPI.HS.people.length, first: w.HFAPI.HFG.first.t, kills: w.HFAPI.HS.stats.kills, errs: w.HFAPI.HFG.errs, playing: window.LW.AU.playing, wait: !!document.getElementById("hfFrame") }); })()`).then(JSON.parse);
  check('re-entry: the world did not restart (same frame, time continues, stats kept)', st2.mark === 'frame-1' && st2.t > away.t && st2.kills >= st1.kills && st2.n >= st1.n - 3, [st2.mark, away.t, st2.t]);
  const same = st1.ids.filter(([id], i) => st2.ids.some(q => q[0] === id)).length;
  check('re-entry: same residents, still spread out (no respawn at the gate)', same >= 36, same);
  let maxMove = 0; for (const [id, x, y] of st1.ids) { const q = st2.ids.find(r => r[0] === id); if (q) maxMove = Math.max(maxMove, Math.hypot(q[1] - x, q[2] - y)); }
  check('re-entry: nobody teleported (max displacement is a few seconds of walking)', maxMove < 140, Math.round(maxMove));
  check('re-entry: camera, zoom, season, danger, time, weather restored', Math.abs(st2.cx - camBefore[0]) < 3 && Math.abs(st2.cy - camBefore[1]) < 3 && st2.zoom === st1.zoom && st2.season === 'winter' && st2.danger === 'grim' && st2.time === 'night' && st2.weather === 'rain', st2);
  check('re-entry: radio still playing, beds restored', st2.playing && (await ev(`${H}.HFAPI.HA.muted`)) === false);
  check('no console errors / exceptions (gallery + Holdfast)', errors.length === 0 && st2.errs.length === 0, [errors.slice(0, 5), st2.errs]);
  // ---------------------------------------------------------------- 4) reload: preferences come back, the world is warm again
  await ev(`${H}.HFAPI.exit(); 0`); await wait(600);
  await send('Page.navigate', { url: base + 'holdfast/index.html' });
  check('reload: standalone boots', await until(ev, `!!(window.HFAPI && HFAPI.HFG.booted)`, 240, 500));
  const r = await ev(`(() => { const f = HFAPI.HFG.first, d = document; return JSON.stringify({ first: f, season: HS.season, danger: HS.danger, time: HS.timeMode, wx: HS.wxMode, zoom: HR.zoom, cx: HR.cx, cy: HR.cy, vMusic: d.getElementById("vMusic").value, vol: AU.vol.music, hint: d.getElementById("hint").classList.contains("gone") }); })()`).then(JSON.parse);
  check('reload: season/danger/time/weather/zoom/camera preferences restored', r.season === 'winter' && r.danger === 'grim' && r.time === 'night' && r.wx === 'rain' && r.zoom === st1.zoom && Math.abs(r.cx - camBefore[0]) < 3 && Math.abs(r.cy - camBefore[1]) < 3, r);
  check('reload: music preferences restored (shared with Saigon)', Math.abs(r.vol - 0.3) < 0.01 && r.vMusic === '30', [r.vol, r.vMusic]);
  check('reload: still a warm start (t=0, towers manned, spread out)', r.first.t === 0 && r.first.towerSeated === r.first.towerGuards && r.first.biggestCell <= 14, r.first);
  check('standalone: "tap to play" bubble present (autoplay needs a gesture)', r.hint === false);
  await ev('document.getElementById("play").click(); 0'); await wait(300);
  check('standalone: play button starts the built-in lofi', await ev('AU.playing === true'));
  check('standalone: no errors', (await ev('HFAPI.HFG.errs.length')) === 0 && errors.length === 0, errors.slice(0, 4));
});
console.log(JSON.stringify(rep, null, 1)); console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'PASS'); process.exit(fails.length ? 1 : 0);
