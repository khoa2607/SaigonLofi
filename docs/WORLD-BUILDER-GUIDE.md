# Lofi Worlds: World-Builder Guide

Use this guide to build a **new world** (world 3 and later) without first reading the codebase. It covers the platform contract,
the shared APIs (with signatures), the template that Holdfast proved, and a step-by-step checklist. Written 2026-11-19, when
`main` held SaigonLofi and Holdfast (Past / Current / Future) and nothing else.

Read alongside: `CLAUDE.md` (rules), `docs/WORLD_REGISTRY.md` (world list), `docs/holdfast/STATUS.md` (a worked example with measurements).
Only open source files when this guide says a detail lives there.

---

## 1. What a world is (product contract)

- A **passive, cozy, observation-only living diorama**. The viewer pans, zooms and sets time / weather / season / music (plus at most one
  world-specific setting, such as Holdfast's danger level). There are no player characters, no building or placement, no objectives, no day counter, no fail state.
- **Isometric camera** and crisp pixels: integer device-pixel scaling, `imageSmoothingEnabled = false`, `image-rendering: pixelated`.
- **All art is drawn by code at load time** in the shared style: box models baked by `bake()`, a warm `grade()`, a cocoa ink outline, sunlit tops
  and plum-brown shade sides. No emoji, no external sprite sheets (Holdfast's `zombie.webp` was used only as a *reference* for code-drawn art).
- The map is **fixed and authored**, deterministic for a given map seed. Seasons change colours, not the layout.
- The world must feel **alive on its first frame** (warm start: the population is already busy when the page appears).
- Tone: a calm watch with small moments, never gore (Holdfast covers fallen settlers and fades the infected).
- Bilingual UI (VI default, EN). Signs and text drawn inside the world are never translated.

## 2. Repository map (what a new world touches)

```
index.html            gallery + SaigonLofi page; gallery styles at the end; #hfFrame CSS (line ~104)
js/menu.js            gallery: UI strings, WORLDS list, 96x96 SCENES thumbnails, enter/exit, window.LW audio bridge, Holdfast frame host
js/core.js            SHARED (read-only): math, seeded RNG, colour, K, bake(), gridCanvas(), pixel font
js/art.js             SHARED (read-only): drawPerson/personSheet, trees, props, vehicles, icons/bubbles, shadows
js/audio.js           SHARED: generative lofi radio (AU, TRACKS), ambience, sfx
js/yt.js              SHARED: optional YouTube playlist player (YTS)
js/i18n.js            SHARED: UI / MSG string tables, t(), setLang(), applyStatic()
js/dock.js            SHARED: music dock controller for any world that carries the dock markup
css/lofi-ui.css       SHARED: HUD plates, dock, language toggle, YouTube box (layout + behaviour; colours come from CSS vars)
holdfast/             world 2, the TEMPLATE for new worlds (one folder, own index.html, own hf-*.js, own theme CSS)
tests/hf-load.mjs     loads plain scripts into a Node VM (DOM-free tests)
tests/cdp.mjs         headless Chrome harness (no npm): withChrome(w, h, fn), until(ev, expr)
```

SaigonLofi's own files (`js/main.js`, `city.js`, `build.js`, `eras.js`, `sim.js`, `river.js`, `landmarks.js`, `fx.js`, `tet.js`, `events.js`,
`costumes.js`, `dance.js`) are **not** shared: never edit them for another world.

**Shared-file rule.** Use `js/*` and `css/lofi-ui.css` read-only. If one truly has to change, give the reason in the commit, keep
Saigon's behaviour identical, and run `node tests/ui-snapshot.mjs` plus the Holdfast browser tests.

## 3. How a world plugs into the gallery

The gallery (`index.html`) is the page that owns the radio. Each new world runs as **its own page in an iframe** over the gallery, the
way Holdfast does, so its globals never collide with Saigon's.

### 3.1 Holdfast's protocol (copy it)

| Step | Gallery side (`js/menu.js`) | World side (`holdfast/hf-main.js`) |
|---|---|---|
| Card | `WORLDS` entry `{ id, live: true }`, strings `w.<id>` / `w.<id>.d` added to `UI`, thumbnail `SCENES.<id>(g, t)` drawn on a 96x96 canvas | none |
| Enter | `menuEnter` runs `hfOpen()`, which creates `<iframe id="hfFrame" src="holdfast/index.html?embed=1">` once, adds `body.hfopen` and sets `G.menu = true` so Saigon sleeps. It also mutes Saigon's city ambience beds (`hfBedsOff`) | `EMBED = ?embed=1`; uses `window.parent.LW` as its audio bridge (`MW`), or builds `LOCAL_LW` from its own copies of the modules when standalone |
| Music | `window.LW = { AU, YTS, TRACKS, audioInit, audioPlay, audioPause, nextTrack, setVol, ytLoad, ytOff, ytToggle, ytNext, ytVolume, setLang }` | `dockInit(MW, { remoteDoc: parent.document, onPlay, onChange })`, so the dock drives the **gallery's** radio and the music never restarts |
| Leave | listens for `message {hf:'exit', lang}` and Esc, then `hfClose`: posts `{hf:'sleep'}`, hides the frame (it is kept, not destroyed) and shows the menu | `hfExit()` posts `{hf:'exit', lang}` (standalone: goes to `../index.html`) |
| Re-enter | shows the frame and posts `{hf:'wake', lang}` | on `sleep`: stop ticking, silence its audio, save prefs. On `wake`: reset the clock accumulators, apply the language, resize, resume audio |
| Language | passes `lang` both ways | `setLang` from the bridge, then `refreshDynamicText()` |

CSS on the gallery: `#hfFrame { position: fixed; inset: 0; z-index: 9000 }`. Under `body.hfopen`, the gallery's `#hud`, `#dock` and `#lang` are hidden and
`#ytbox` stays visible, because the YouTube player lives in the gallery page.

### 3.2 First task for world 3: generalise the frame host

`hfOpen` / `hfClose` / `#hfFrame` / `body.hfopen` / the `hf:` message keys are hard-coded for Holdfast. Before you add a second framed
world, refactor them in `js/menu.js` and `index.html` into a per-world host. For example:
`const FRAMED = { holdfast: 'holdfast/index.html', <id>: '<id>/index.html' }`, with one frame per world (each kept alive separately),
`wfOpen(id)` / `wfClose(id, lang)`, a `body.wfopen` class, and a message key such as `{lw:'exit'|'sleep'|'wake', world:id, lang}`. Holdfast can
keep sending `hf:` messages during the migration if you accept both keys.
Afterwards, prove that Holdfast still works with `node tests/holdfast-browser.mjs` and `node tests/holdfast-flow.mjs`.
The thumbnail must be a real `SCENES.<id>` painter. (Holdfast currently reuses `SCENES.fall`.)

## 4. Shared APIs (signatures you can rely on)

### 4.1 Units, projection, randomness (`js/core.js`)

- `K = 2`: art pixels per world unit. All logic runs in world units, and sprites are drawn with `drawImage(c, x, y, w, h)` in world units under
  a `setTransform(K, 0, 0, K, ...)` camera transform.
- Iso projection: `isoX(x, y) = x - y`, `isoY(x, y, z) = (x + y) / 2 - z`. Holdfast writes this as `ISO(x, y, z) => [x - y, (x + y)/2 - z]`.
  Depth sorts by `x + y` (plus a per-sprite offset).
- Saigon's tile is `T = 8` units on `N = 160` tiles. Holdfast uses `HT = 8` on `HN = 144` tiles. Keep 8-unit tiles so `drawPerson` sizes match.
- **Seeded:** `mulberry32(seed)` returns `R()` in [0, 1); `sp(R, arr)`, `sr(R, a, b)`, `si(R, a, b)`. **Render-only:** `rr`, `ri`, `pick`, `chance`, `wpick`
  (these use `Math.random`, so never use them in simulation). Noise: `hash2(x, y)`, `vnoise(x, y)`.
- Misc: `clamp`, `lerp`, `sstep`, `TAU`.

### 4.2 Colour

Colours are `0xRRGGBB` integers. `mixc(a, b, t)`, `shade(c, f)` (f > 0 lightens toward cream, f < 0 darkens toward cocoa), `grade(c)` (pulls a colour onto the
warm 8-step `RAMP`; `bake` applies it automatically), `css(c)` returns `'#rrggbb'`, `rgba(c, a)`. Constants: `INK 0x2b1a16`, `SHADOW 0x6a3f45`,
`C_LIGHT 0xfff1d6`, `C_DARK 0x3a221c`. Choose a world palette that still reads well after `grade()`.

### 4.3 The box baker: how every building, prop and vehicle is made

```js
box(x, y, z, w, d, h, colour, painter?, extra?)   // shorthand for {x,y,z,w,d,h,c,p,...extra}
bake(boxes, { snow?, ox?, oy?, slice?, noInk? }) -> sprite { c, e, w, h, ax, ay, key }   (or an array when slice is set)
```

- `painter(face, u, v, box, wx, wy)` returns a colour, `-1` for a hole (a window cut-out, for example), or `undefined` for the box colour. Faces: 0 = top
  (u, v = local x, y), 1 = left (the +y side), 2 = right (the +x side); u runs left to right on screen and v is height above the box base.
  Set the global `EM = colour` inside a painter to make that pixel **glow at night** (windows, lamps).
- Box extras: `em` (an emissive colour for the whole box), `raw` (skip grade and shading), `ns` (no snow), `nf` (exclude from the footprint).
- `bake` adds the ink outline, crease lines, sunlit tops, shaded right faces, ground contact shadow and the lit top lip on its own. `{snow: true}` dusts tops with patchy snow.
- The output `c` is the colour canvas and `e` is the emissive mask (black silhouette plus glow colours) used by the night light pass. `ax`, `ay` are the anchor offsets:
  draw at `ISO(x, y) - (ax, ay)`. `slice: n` cuts a big building into footprint cells, so each part sorts in depth separately. Use it for anything large that actors walk around.
- `mirrorBoxes(boxes)` swaps x and y to get the other facing. Text drawn by painters still reads left to right.
- Tiny hand bitmaps: `bmpGrid(rows, palette)`, or `gridCanvas(intGrid, w, h, emis, k)` plus `inkGrid(...)`. Use `textAt(str, u, v)` in painters for 3x5 pixel lettering on signs.
- Bake once and cache (Holdfast: `bakeCached(key, fn, slice)`, keyed by era and season). Baking is per-pixel work, so never bake inside the frame loop.

### 4.4 People, trees, props (`js/art.js`)

- `randLook(type)` returns a look `L` (skin, hair, top, bottoms, shoes, hat, ...). Set the fields yourself for a world-specific cast (Holdfast builds looks in
  `hf-art.js` and adds tool and weapon overlays).
- `personSheet(L)` returns a gridCanvas sheet: 8 poses across (stand, 4-frame walk, sit, arm-up, talk) and 4 direction rows. Use `DIR_ROW[dir]`, with
  dir 0:+x, 1:+y, 2:-x, 3:-y, and `DIRV[dir]` for the unit vectors. Sheets are slow to bake (hundreds per population), so cache them per look and pre-bake near the camera.
- `treeSprite(species, season, variant)` (species from `TREE_SP`), `propSprite(name, season, v, mirror)` (keys of `PROP`), `vehSprite(kind, v, dir)`,
  `shadowSprite(r)` (a soft contact shadow), `initIcons()` plus `BUB` (thought and speech bubble icons), and the painter helpers `stripe`, `speck`, `plantP`.
- These are Saigon-flavoured. Reuse them where they fit and write world-specific models in your own `<id>-art.js`.

### 4.5 UI strings (`js/i18n.js`)

- `UI[key] = [vi, en]` holds static markup strings. Add yours with `Object.assign(UI, {...})` in your own file. Markup uses `data-i18n="key"` and
  `data-i18n-attr="title:key;aria-label:key2"`. `applyStatic()` applies them, `t(key, params)` reads one, `setLang('vi'|'en')` switches, and `LANG.cur` is the active language.
- `MSG` / `tm(vi)` hold runtime messages that Saigon writes in Vietnamese.
- Existing keys the dock and HUD already use: `play`, `prev`, `next`, `more`, `hint`, `season.*`, `time.*`, `wx.*`, `vol.*`, `view.lab`, `zout`, `zin`, `full`, `yt.*`, `lang.*`,
  `menu.back`, `menu.back.t`, `loading`, `autoSeason`. Reuse them instead of duplicating.

### 4.6 Music and dock (`js/audio.js`, `js/yt.js`, `js/dock.js`)

- `AU` holds `{ playing, track, vol: { music, amb, vinyl, street }, streetOn, ctx, ... }`; also `audioInit()`, `audioPlay()`, `audioPause()`, `nextTrack(±1)`, `setVol()`, `sfx(k)`,
  `vizLevel()` and `TRACKS[i].name`. **Never call these directly from a framed world.** Go through the bridge `MW = parent.LW || LOCAL_LW`.
- `dockInit(MW, opts)` wires the shared dock markup: play / prev / next, `···` panel, YouTube field, volume sliders and the "world sound" switch (`streetOn`, `vStreet`).
  Call `dockUpdate()` and `dockViz()` about every 250 ms and `dockSyncSliders()` on wake. Preferences are saved under `saigonlofi` / `saigonlofi-yt` in localStorage and shared across worlds.
- World ambience and sfx: create your own WebAudio graph on `MW.AU.ctx` (Holdfast: `hf-audio.js`, `haStart(MW)`, `haEvent(kind, x, y, vol)`,
  `haFrame(dt, view)`, `haSilence(bool)`). Scale it by `AU.vol.street * AU.streetOn` for world sounds and by `AU.vol.amb` for beds. It must fall silent on `sleep`.

### 4.7 UI markup and theme

- Copy `holdfast/index.html`. It holds the shared markup with the ids `lang`, `hud` (`toMenu`, an era/tab plate `#eras`, `#info`, `#ticker`), `dock`
  (`play`, `tname`, `tnum`, `viz`, `prev`, `next`, `more`, season segment, `autoSeason`, `panel` with `ytUrl`/`ytGo`/`ytMsg`, time, one world setting,
  weather, world sound, volumes, view buttons, journal), `ytbox`/`ytplayer`, the `load` card and `hfTest` (a test-output `<pre>`). The ids **must** stay as they are, because `dock.js` and
  `lofi-ui.css` depend on them.
- Theme: a `<id>-theme.css` file that only sets the `:root` variables (`--ink --cream --paper --peach --clay --brown --wood --jade --soft --tile --leaf --sun --white
  --plate --plate-2 --shadow --font`) plus a few decorative tints. Copy `holdfast/hf-theme.css`. Layout always comes from `lofi-ui.css`.
- Fonts: Baloo 2 and Pixelify Sans from Google Fonts (already linked in the template).

## 5. World architecture template (proved by Holdfast)

One folder `<id>/` with a short prefix (Holdfast uses `hf`, `hs`, `hr`, `ha`, `hw`). **All of the world's globals carry the prefix.**

| Module | Role | DOM? |
|---|---|---|
| `<p>-map.js` | the authored layout in "design units" (`d2w`/`w2d` convert to world units), terrain, buildings list, nav grid, flow fields | **no** |
| `<p>-art.js` | box models and looks for everything in the world (calls `bake` and painters) | canvas only |
| `<p>-sim.js` | population and directors: `HS` state, `hsInit({seed, pop, hour})` with a **warm start**, `hsTick(0.1)` fixed step, `HS.R` seeded RNG, `HS.onEvent(e)`, `HS.sound(k, x, y, v)` | **no** |
| `<p>-work.js` / `<p>-life.js` | activity loops (jobs, hauling, zones, routines) split out of the sim | **no** |
| `<p>-render.js` | `HR` renderer: ground chunks, statics, depth-sorted drawables, day/night grade, emissive light pass, weather | yes |
| `<p>-audio.js` | world ambience and event sfx on the shared AudioContext | yes |
| `<p>-world.js` | only if the world has several eras or timelines on one page (see 5.4) | no |
| `<p>-main.js` | boot, loop, camera input, UI binding, embed protocol, saved prefs, test hooks (`?test=1`, `?bench=1`) | yes |

Script order in `<id>/index.html`: `../js/i18n.js`, `core.js`, `art.js`, `audio.js`, `yt.js`, `dock.js`, then map, art, sim, work, life, render, world,
audio, main.

### 5.1 Simulation rules

- Fixed 0.1 s ticks with an accumulator, at most about 6 catch-up steps per frame. Rendering interpolates with `alpha = acc / 0.1` (`px/py` to `x/y`).
- Simulation randomness only through `HS.R`. The map seed is fixed (Holdfast: 7). The population seed is random per visit unless `?seed=` / `?simseed=` is passed.
- DOM-free so Node can load it through `tests/hf-load.mjs` (`loadHF([...files])`, then `ev(ctx, 'expr')`). Rendering reads simulation state and never drives behaviour.
- **Warm start:** `hsInit` already simulates the world into a lived-in state (people mid-task, stocks partly full, crops grown), so the first frame is busy.
- "Directors": an *activity director* with traffic-style quotas keeps every zone visibly occupied, and an *encounter director* produces frequent small moments and rare large ones.
  Keep every zone busy, avoid synchronised crowds, and keep walking speeds believable. Holdfast M5 measured all of this; reuse those metrics.
- Never spawn threats or arrivals on screen (`HS.view` holds the camera's world rectangle).
- Never keep state at module level. Put it on `HS` / `HF` / `HR`, or it leaks between eras and contexts.

### 5.2 Rendering pipeline (`hrFrame`, per frame)

1. Clear, then `setTransform(K, 0, 0, K, -round(x0*K), -round(y0*K))`, where `x0`, `y0` is the camera's top-left corner in iso units.
2. Ground from **pre-baked chunks** (Holdfast: 256 iso units, or 512 art px, per chunk keyed by season). Bake at most 1 or 2 per frame and the rest in idle time,
   in about 5 ms generator slices (`hfIdleBake`, `hrBakeChunkG`).
3. Gather drawables `{c, e, x, y, w, h, d, sh?, alpha?}` from statics (culled to the view), actors and animals into `D`, then `D.sort((a, b) => a.d - b.d)`.
4. Contact shadows, then sprites.
5. Time of day: `multiply` by the ambient colour from keyframes (`KF_AMB`, hour to colour) and tint for rain or winter.
6. Night (`dark > 0.08`): a light canvas is cleared to black. Draw each sprite's **`e` mask**, add `lighter` radial glows (`HR.lights` entries
   `[x, y, r, 'rgba(r,g,b,', alpha, kind]`), and composite with `lighter` at `dark * 1.3`.
7. Weather particles in screen space.

Pixel scaling (`hrResize`): `aps` = integer art-px-to-device-px scale, roughly `sqrt(pw*ph / (560*315)) / K * 0.83` plus the user's zoom step, clamped to 1..6.
Canvas size = device px / aps, and CSS size = canvas * aps / dpr. Smoothing off.

### 5.3 Time slicing

Long builders (map, statics, sheets, chunks) are **generators** that `yield` when `slDue()` says the slice (`SL.ms`, 6 ms) is used up. Synchronous callers
run them to the end with `for (const _ of gen());`. This keeps the page responsive while a second era or a new season is prepared.

### 5.4 Several eras in one page (only if the world needs it)

Holdfast keeps one global `HF` / `HS` (and the world keys of `HR`, listed in `HR_WORLD_KEYS`) and swaps **contexts**: `hwTake()` / `hwPut()` / `hwEnter(era)`.
The era is built lazily by `hwPrepare(era)` in slices and switched with a 1.2 s crossfade (`hfSwitchEra` / `hfFadeTo`: the leaving era is drawn into
the `#cfade` overlay canvas, which fades out). Era-specific code branches on `HF.era === 'past' / 'future'`. Always write explicit branches, because an implicit
"else = current" fall-through silently runs the wrong era. The viewer's environment (`HW_ENV`: time, weather, season, danger) follows them across eras.

### 5.5 Page conventions (`<p>-main.js`)

- URL parameters for tests and screenshots: `embed=1`, `seed`, `simseed`, `pop`, `era`, `time`, `wx`, `season`, `hour`, `zoom`, `cam=<preset>`, `warp=<secs>`,
  `test=1` (the self-test writes JSON into `#hfTest`), `bench=1`, `clean=1` (hides the UI for screenshots).
- Prefs in localStorage under the world's own key (Holdfast: `holdfast`, holding era, time, weather, season, autoSeason, danger, zoom, cam). URL parameters override them.
- Camera presets `CAMS` in design units. Drag to pan, wheel or `+`/`-` to zoom in integer steps, `B` jumps to a landmark view, `Esc` returns to the gallery.
- A ticker (`#ticker`) for notable events, plus a journal (`#log`) of recent events, written in both languages.
- The first frame is fully drawn (`HR.bakeAll = true; hrFrame(...)`) before the loading card fades.
- Device tuning: when the average frame time is above 14 ms, reduce density (never below half). Restore it when below 7 ms. Mobile uses a smaller population (Holdfast: 70 vs 120).

## 6. Tests and budgets

| Kind | How | Holdfast examples |
|---|---|---|
| Simulation (Node, deterministic) | `loadHF([core, art?, map, sim, ...])`, then run N game seconds and assert numbers | `holdfast-sim`, `-life`, `-community`, `-warm`, `-past`, `-future`, `-world` |
| Browser (headless Chrome via `tests/cdp.mjs`) | `withChrome(1920, 1080, async ({ base, ev }) => { ... })`; open `base + '<id>/?test=1&seed=7'`, `until(ev, 'document.getElementById("hfTest").textContent')` | `holdfast-browser` (self-test, gallery, Saigon still boots), `-flow` (UI), `-transition` |
| Performance | `?bench=1` inside Chrome with `--disable-gpu` | `holdfast-bench`: 1080p **about 60 fps, JS per frame at most ~10 ms median** with ~1,000 sprites |
| Diagnostics | number dumps and a top-down character map of the layout | `holdfast-diag`, `holdfast-mapdump` |

Every behaviour needs a deterministic test or a diagnostic number. Screenshots never count as proof. Always rerun Holdfast's
`holdfast-browser.mjs` after a gallery change, because it also checks that the gallery and Saigon still boot.
Node 22+ and an installed Chrome or Edge are the only requirements (no npm packages).

## 7. Checklist: adding world N

1. **Design doc first.** Write `docs/<id>/<ID>-DESIGN.md` covering the fantasy, zones, population tiers, directors, signature moments, camera framing, a palette
   checked against `grade()`, the one world-specific setting, and its eras (if any). Get the owner's approval before writing code (Holdfast went through v0.2, v0.3, an art pilot, then milestone 1).
2. **Art pilot.** Write one static scene with the shared baker in a standalone `pilot.html` and compare it side by side with Saigon. This is the owner's art gate.
3. Branch `feature/<id>-world` from `main`.
4. Generalise the gallery frame host (§3.2). Add the `WORLDS` entry, the `w.<id>` strings and the `SCENES.<id>` thumbnail. Run the Holdfast browser and flow tests.
5. Copy the Holdfast page skeleton: `<id>/index.html` (shared markup and ids), `<id>-theme.css`, and a main file with the embed protocol, bridge, dock, prefs and URL parameters.
6. Map, then sim (with warm start), then render, then audio. Add a Node test from the first sim commit onward.
7. Bench at 1080p, 720p and phone size.
8. Docs: `docs/<id>/STATUS.md` (what exists, measured numbers, tests run, an honest limitations list), a row in `docs/WORLD_REGISTRY.md`, a section in `README.md`,
   and a row in the `CLAUDE.md` architecture table plus its tests.
9. Commit small, verified milestones and push the branch. Merge into `main` only with the owner's approval, then delete the branch.

## 8. Lessons from Holdfast (avoid repeating them)

- **Sprite-sheet cost dominates the first frame.** Hundreds of `personSheet` bakes: cache them per look and pre-bake near the camera in slices.
- **Season change re-bakes everything** (about 1 to 2 s with a toast). Design season-specific art as palette swaps where possible.
- Tall buildings hide actors, and Holdfast has no cutaway. Leave walkways in front of tall facades and use `slice` so the depth sort stays right.
- Lighting is screen-space. Warm-inside and cool-outside is not modelled, so put emissive windows and lamps where the night should read.
- Without explicit quotas, activity bunches up and looks synchronised. Measure zone occupancy, synchrony and speed from day one (`holdfast-life.mjs`).
- Era branches: every `if (era === 'past')` needs a matching `'future'` branch, and contexts must not share module-level state (spatial hashes are reset per context).
- Audio was tuned in code only. Listen to it in a real browser before calling it done.
- Saigon's own tests (`tet`, `dance`, `events`, `riverfront-turns`) need `playwright`, which is not installed. Saigon is smoke-tested through `holdfast-browser.mjs`.
