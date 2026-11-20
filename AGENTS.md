# AGENTS.md — Lofi Worlds / Holdfast (for Codex and other coding agents)

This file is written so you can work on the project **without access to any earlier conversation**. Read it fully, then read the files it points to.
`CLAUDE.md` holds the project rules written for Claude Code; the two files agree. If they ever disagree, `docs/holdfast/PARALLEL-DEVELOPMENT.md` wins; if
that is silent, ask the owner (the human user) instead of guessing.

## 0. Your assignment (read first)

> **Merged 2026-11-19.** All Holdfast work (Current, Past, Future and the three-era dock fix) is integrated on `main`, which is now the only branch. The parallel-development split below is **historical**; new work starts from `main` on a short-lived feature branch.

| | |
|---|---|
| **Your branch** | `feature/holdfast-current-past` |
| **Baseline** | `main` at the commit that introduced this file (both feature branches start from the same commit; `git log --oneline -1 main` at branch creation) |
| **You own** | Holdfast **Current** (zombie) and **Past** (dinosaur) timelines: improvements and bugs, zombie + dinosaur artwork and animation, Current/Past NPC behaviour, work loops and community activities, Current/Past combat, weather and environment, and their tests and docs |
| **Another agent owns** | `feature/holdfast-future` (Claude Opus): the **Future** timeline (robots, drones, futuristic architecture, its simulation, combat, tests, docs) |
| **Never** | develop or edit Future-specific features/files; push to `feature/holdfast-future`; merge into `main` without the owner's explicit approval; change SaigonLofi behaviour; rewrite or remove shared engine code without need |

Ownership of every file is in the matrix in `docs/holdfast/PARALLEL-DEVELOPMENT.md` §4. Shared files are **not** exclusively yours: change them minimally (see §8).

## 1. What this project is

**Lofi Worlds** is a static web app (vanilla JavaScript, Canvas 2D, no build step, no npm runtime dependencies): a gallery of passive, cozy, observation-only
"living dioramas" with a shared lofi radio. The viewer pans, zooms and changes time / weather / season / music; they never control anyone, build anything or
manage resources. Two worlds exist:

1. **SaigonLofi** — an isometric Saigon street corner across four decades. Lives in `js/*.js` + root `index.html`. **You must not change it.**
2. **Holdfast: Edge of Survival** — a walled settlement in a river bend living through a hostile age. Lives in `holdfast/`. Three timelines are planned over
   **one valley**: **Current** (zombie apocalypse), **Past** (humans and dinosaurs), **Future** (machine uprising; not started, owned by the other agent).

Product tone (Holdfast): busy, survival-focused, watchable; people can die and the settlement always survives; **no gore** (fallen settlers are covered,
infected and dinosaurs fade); no emoji art; no player control, no objectives.

## 2. Repository map

```
index.html, js/menu.js       the gallery ("Lofi Worlds"); the Holdfast card opens holdfast/index.html in a kept-alive <iframe id="hfFrame">
js/*.js, css/lofi-ui.css     Saigon + the shared platform (radio js/audio.js, YouTube js/yt.js, UI dock js/dock.js, i18n js/i18n.js, art system js/core.js + js/art.js)
holdfast/                    the Holdfast world (all files below are plain <script>s sharing globals; see load order in holdfast/index.html)
tests/                       Node-only tests (+ headless Chrome via tests/cdp.mjs). No npm packages needed.
docs/holdfast/               design (HOLDFAST-DESIGN.md, PAST-DESIGN.md), STATUS.md (what exists + measurements), PARALLEL-DEVELOPMENT.md, screenshots/
CLAUDE.md                    project rules for Claude Code (agrees with this file)
```

Read-only for you (the shared platform used by both worlds): `js/core.js`, `js/art.js`, `js/audio.js`, `js/yt.js`, `js/dock.js`, `js/i18n.js`, `css/lofi-ui.css`.
They are loaded by `holdfast/index.html` but belong to Saigon/the platform.

## 3. Holdfast architecture

### 3.1 Units, projection, rendering
- Isometric 2:1. World units follow Saigon: `K = 2` art pixels per world unit, tile `HT = 8` units, map `HN = 144` tiles (`HW = 1152` units). Screen: `x - y`, `(x + y)/2 - z`.
- All art is **code-drawn at load time**: box models baked by `bake()` (`js/core.js`) with per-pixel painters `(face, u, v, box, wx, wy) => colour`, the warm grade
  (`grade()`), cocoa ink outline, plum shade side. People are Saigon's `drawPerson()` (chibi, 8 poses × 4 facings) with Holdfast costume hooks (`ev*` functions in `hf-art.js`).
- Display: integer device pixels per art pixel only, `imageSmoothingEnabled = false`, nearest-neighbour. Default view ≈ Saigon's (people ~40 art px tall at 1080p).
- Ground is painted per pixel into 256×256-unit chunks (`hrBakeChunk`), cast shadows are baked into them; buildings/props/trees are pre-baked sprites in `HR.statics`
  sorted by depth; actors are drawn depth-merged each frame; lighting = ambient multiply by hour + an emissive/additive pass (`EM`, `HR.lights`).

### 3.2 Simulation (DOM-free: runs in Node for the tests)
- `hf-map.js` — the valley (river bend, creek, wall chain, 10 towers, gate), civic sites, ~60 houses, fields, docks, POIs, threat routes R1–R5, the 144×144 navigation grid
  (`HF.walk`, flags `W_IN/W_OUT/W_GATE/W_BREACH/W_DOCK`) and cached **flow fields** (`hfFlow(mask, target)`; no per-agent pathfinding).
- `hf-sim.js` — settlers (3 tiers: 16 named, ~74 scheduled workers, ~30 ambient), the schedule (`hsThink`), movement (`hsGo`/`hsStep`), infected (`hsZ`; in the Past the
  same array holds dinosaurs), combat (`hsShoot`, `hsHitZ`, `hsKillZ`), breaches/repair, expeditions, rescues, arrivals, the **director** (constant activity + minor / medium /
  major / siege encounters, Calm/Standard/Grim danger), weather, seasons, day/night, the warm start (`hsInit` → the world is already alive on frame 1).
- `hf-work.js` — crop plots, stores, hauling, cooking, fishing catches, builders' materials, guard responses.
- `hf-life.js` — community zones: training ground, stable + riders, workshop/forge, house repairs, hospital, school, farmyard, graveyard, market, river life, boats; calls `pastTick` in the Past.
- `hf-art.js` — Current models/props/looks (suburban houses, wall panels, tower, zombies via `zombie.webp` archetypes, guards, workers), era dispatch for models (`if (HF.era === 'past') return past…`).
- `hf-past.js` / `hf-past-art.js` — **Past** simulation layer (dinosaur roster/behaviour, flyers, apex, fire, fire-keeper, torches, evening dance, stake traps, arrows) and Past art (huts, palisade, platforms, dinosaurs).
- `hf-render.js` — ground, statics, actors, dinosaurs, fx, lighting, weather, camera helpers, background-preparation generators (`hrBuildStaticsG`, `hrPrewarmG`…).
- `hf-audio.js` — synthesised ambience and world sounds (no samples), routed through the shared radio's ambient volume.
- `hf-main.js` — page boot, the single animation loop, camera/input, the shared Saigon UI wiring, journal, the era transition manager, self-test/bench hooks.
- `hf-world.js` — **world contexts** (see §3.3).
- Determinism: all simulation randomness goes through `HS.R` (seeded); `Math.random` only in render-only effects. Tests rely on this.

### 3.3 Two (soon three) timelines in one page — the seamless switching architecture
The simulation/map/render code addresses **global singletons**: the map `HF`, the simulation `HS`, and the per-world part of the renderer state `HR` (`HR_WORLD_KEYS` in
`hf-render.js`). A timeline owns a **context** = a snapshot of those. `hf-world.js` keeps contexts in `HWD.worlds[era]`; exactly one is installed in the globals
(`HWD.cur`); `hwEnter(era)` swaps (pointer copies, never deletes keys). Factories: `hfNewHF()`, `hsNewHS()`, `hrNewWorld()`.
- **Switching has no reload and no loading screen.** `hfSwitchEra(era)` (hf-main.js) records the latest request; `hfTransitions()` runs one transition at a time: `hwPrepare(era)` builds the
  destination **in time slices** (generators using `slDue()` / `yield`; `SL` in hf-map.js) while the current timeline stays on screen, then `hfFadeTo` crossfades ~1.2 s by stepping and drawing both worlds
  (leaving one into the overlay `#cfade`). The leaving timeline is frozen and resumes exactly. The viewer's environment (time/weather/season/danger) carries over (`HW_ENV`).
- Rules that keep it correct: **never** keep world state in module-level variables (put it in `HS`/`HF`/`HR_WORLD_KEYS`); bake-cache keys must include `HF.era` (`bakeCached` does); any module-level
  cache must be keyed per world (the flow cache is keyed by `HF.wid`); long builders must stay sliceable (`yield` when `slDue()`); the spatial hashes `SHZ/SHP` are reset on every world install (`shReset`).
- `tests/holdfast-world.mjs` and `tests/holdfast-transition.mjs` guard all of this. Run them after touching `hf-world.js`, `hf-sim.js`, `hf-map.js`, `hf-render.js`, `hf-main.js`.
- The era flag is `HF.era` (`'current'` | `'past'`; `'future'` is added by the other agent). Era-specific code lives behind `HF.era` checks and in era modules; Current code paths must stay unchanged by Past work.

### 3.4 Death lifecycle (milestone 8.1)
Infected and dinosaurs: alive → dying (collapse slide / flyer falls) → stationary corpse → fade over the last 6 s → removed. `hsKillZ` is idempotent; `corpseT` is the remaining life; lifetimes scale
with size. Never re-arm a corpse timer or leave `stT` set on a dead body (that caused blinking, never-vanishing corpses). See `tests/holdfast-corpse.mjs`.

## 4. Documents to read
1. `docs/holdfast/STATUS.md` — what exists, per milestone, with measurements and honest limitations (the source of truth for implementation state).
2. `docs/holdfast/HOLDFAST-DESIGN.md` — the approved creative direction; `docs/holdfast/PAST-DESIGN.md` — the Past's design.
3. `docs/holdfast/PARALLEL-DEVELOPMENT.md` — branches, ownership matrix, shared-code policy, integration.
4. `CLAUDE.md` — project rules (architecture table, product rules, code rules).
5. `README.md` — Saigon and the gallery.

## 5. Run it
```
python -m http.server 8765        # or serve.bat, from the repo root
http://localhost:8765/            # gallery -> Holdfast card
http://localhost:8765/holdfast/   # Holdfast directly (testing)
```
Useful URL parameters (Holdfast): `seed`, `pop`, `era=current|past` (only the timeline a fresh page starts in), `hour`, `time=auto|morning|noon|dusk|night`, `wx=auto|clear|rain|wind`,
`season=auto|spring|summer|fall|winter`, `danger=calm|standard|grim`, `cam=default|gate|settlement|wall|market|commons|ruins|fields|east|west|exp`, `zoom`, `warp=<seconds>` (fast-forward before the first frame),
`attack=<n>` (force a major attack), `exp=1` (start an expedition), `clean=1` (hide UI), `test=1` (in-page self-test), `bench=1`. Keys: drag/wheel/pinch = pan/zoom, Esc = gallery, H = hide panel, B = gate view.

## 6. Tests (run before every commit that touches behaviour)
Node 22+ and an installed Chrome/Edge/Chromium (browser tests set `CHROME=path` or `--chrome=path`). No packages. Tests that need `playwright` (`tet`, `dance`, `events`, `riverfront-turns`) are Saigon's and are not run here.

| Command | What it guards |
|---|---|
| `node tests/holdfast-sim.mjs 3600` | map sealed, no illegal entry, combat, expeditions, repairs, population, determinism |
| `node tests/holdfast-past.mjs [seed]` | the Past (same valley as Current, art coverage, dinosaurs, fire, Current untouched) |
| `node tests/holdfast-corpse.mjs [seed]` | death → corpse → fade → removal, size-based lifetimes, no blinking, flyers, accelerated runs |
| `node tests/holdfast-world.mjs [seed]` | world contexts: sliced build == synchronous build, isolation, exact resume, rapid swaps |
| `node tests/holdfast-community.mjs`, `holdfast-life.mjs`, `holdfast-m7.mjs`, `holdfast-warm.mjs` | community zones / food chain, aliveness, zombie + church + river life, warm start (warm has wall-clock checks: run it alone) |
| `node tests/holdfast-transition.mjs [--shots]` | Chrome: seamless era switching (no reload / loading screen / blank frame, camera preserved, state frozen + resumed, music/YouTube untouched, one loop, no leaked listeners, rapid clicks, gallery round trip, corpse rendering, memory) |
| `node tests/holdfast-browser.mjs [--shots] [--bench]`, `node tests/holdfast-flow.mjs --no-youtube`, `node tests/holdfast-bench.mjs [--era=past]` | in-page self-test, gallery + Saigon smoke, UI flow, fps |
| `node tests/holdfast-diag.mjs`, `node tests/holdfast-mapdump.mjs` | diagnostics (numbers, a top-down map dump) |

Every new behaviour needs a deterministic test or measured number; screenshots alone never prove behaviour. Report exactly what ran and what it does and does not prove.

## 7. Coding, art and performance rules
- Plain `<script>` files sharing globals in the load order of `holdfast/index.html`; no bundler/framework/dependencies. Simulation modules stay DOM-free and loadable by `tests/hf-load.mjs`.
- **Pixel art:** match the approved style — code-drawn box models + per-pixel painters, hue-shifted ramps (shadows toward plum, highlights warm), cocoa ink `0x2b1a16`, one light (upper left),
  hash/`vnoise` material variation (weathering, stains, rust), 2:1 geometry, integer scaling, no blurred resampling, no emoji, no pasted external art. Judge art at 1:1 and 3× in a real screenshot, not on contact sheets.
  Characters are `drawPerson` with gear/costume hooks; creatures are 2-facing mirrored sheets with the same ink and shading. Anything new must read at the default zoom.
- **Performance:** target 60 fps desktop / 30 fps mobile; bake static art once (never per frame); depth-sort only actors; no per-agent pathfinding (use flow fields); keep long builders sliceable;
  avoid long tasks (> ~30 ms). Check `tests/holdfast-bench.mjs` and `HR.ft` after render/sim changes; never claim a target met without a measurement.
- Observation-only: no controls over residents, no health bars/resource UI. UI strings go through `UI`/`t()` (VI + EN).
- Never commit secrets, browser profiles, temporary screenshots, test reports or `node_modules`. Curated screenshots live in `docs/holdfast/screenshots/`.
- Long scripts in shell heredocs can fail on Windows Git Bash quoting; write them to a file and run that.

## 8. Shared code policy (summary; the full rules and the ownership table are in `docs/holdfast/PARALLEL-DEVELOPMENT.md`)
Shared files (`hf-world.js`, `hf-sim.js`, `hf-work.js`, `hf-life.js`, `hf-render.js`, `hf-main.js`, `hf-map.js`, `hf-audio.js`, `hf-art.js` dispatch lines, `holdfast/index.html`, `hf-theme.css`, test helpers) have **no exclusive owner**:
1. Change them minimally, in an isolated and backward-compatible way; prefer an era-specific module/adapter over editing the engine.
2. Every shared-code change needs tests for **Current and Past** (and, if relevant, world switching): at least `holdfast-sim`, `holdfast-past`, `holdfast-corpse`, `holdfast-world`, `holdfast-transition`.
3. Record every shared-code change in `docs/holdfast/shared-changes/current-past.md` (file, function, why, what could conflict) — a file only you edit, so it never conflicts with the other agent's log.
4. **Do not touch the Future integration points** the other agent will extend (listed in `PARALLEL-DEVELOPMENT.md` §5.3): the `era` normalisation in `hfBuildMapG`, the `#eras` tab and `hfSwitchEra`/`hfApplyEraUI`/`ERA_ARIA`, `hwPrepare`/`HW_ENV` in `hf-world.js`, the era dispatch in `bakeCached` keys, script tags in `holdfast/index.html`. If you must, ask the owner first.
5. Never overwrite the other agent's work; never force-push; never reset a shared branch.

## 9. Git workflow
- Work only on `feature/holdfast-current-past`. Commit small, verified milestones with clear messages; push that branch after each milestone (`git push origin feature/holdfast-current-past`). Do not rewrite pushed history.
- Do **not** merge into `main` and do not touch `feature/holdfast-future`. Integration into `main` happens only when the owner explicitly asks (see `PARALLEL-DEVELOPMENT.md` §7).
- To see what the other agent changed in shared code (read-only): `git fetch origin && git diff main...origin/feature/holdfast-future -- holdfast/ tests/`. Merging `main` into your branch is allowed once `main` moves (owner-approved integrations); do it, run the full test list, and resolve conflicts keeping both agents' behaviour.
- Update `docs/holdfast/STATUS.md` **only in the Current/Past sections** (add a milestone section at the end); the Future status lives in `docs/holdfast/FUTURE-STATUS.md`, which is not yours.
- Handoff checklist: `docs/holdfast/PARALLEL-DEVELOPMENT.md` §9.
