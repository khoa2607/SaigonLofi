# Lofi Worlds (testFableLofi) — project rules

This repository is the **live Lofi Worlds web app**: a world gallery plus two passive "living diorama" worlds, written in
**vanilla JavaScript + Canvas 2D** with no build step and no npm runtime dependencies.

> **Legacy note.** The folder above this repo (`E:\game\web-lofi\`) is a *separate* git repository: an earlier
> React + Phaser + Vite prototype with a PixelLab asset pipeline. Its `CLAUDE.md` (React owns chrome, Phaser owns the canvas,
> `src/game/`, 960 x 540 Phaser viewport, Phase 0/1 scope, PixelLab budget) describes **that** prototype, not this app.
> The general rules it shares with this project are repeated below. Nothing in this repo uses React, Phaser, Vite or PixelLab.
> If PixelLab is ever used from here, the parent file's budget policy still applies (approval per paid batch, balance checks).

> **Building a new world?** Start with `docs/WORLD-BUILDER-GUIDE.md`: platform contract, shared API signatures, the Holdfast
> template, test harness and a step-by-step checklist. It is written so you do not need to read the codebase first.

## Architecture (as it exists)

| Part | Files | Notes |
|---|---|---|
| Gallery ("Lofi Worlds") | `index.html`, `js/menu.js`, styles at the end of `index.html` | Opens first; worlds are cards. The radio (built-in lofi / YouTube) keeps playing across worlds. |
| Shared UI | `css/lofi-ui.css`, `js/dock.js`, `js/i18n.js`, `js/audio.js`, `js/yt.js` | Saigon's UI extracted verbatim; Holdfast uses the same markup/ids with its own palette (`holdfast/hf-theme.css`). |
| Shared art system | `js/core.js` (`bake` box models, `grade`, ink, `gridCanvas`, K = 2 art px per world unit), `js/art.js` (`drawPerson`, trees, bubbles) | All art is drawn by code at load time. Holdfast uses these read-only. |
| SaigonLofi world | `js/main.js`, `js/city.js`, `js/build.js`, `js/eras.js`, `js/sim.js`, `js/river.js`, `js/landmarks.js`, `js/fx.js`, `js/tet.js`, `js/events.js`, `js/costumes.js`, `js/dance.js` | Isometric Saigon street corner across four eras. See `README.md`. |
| Holdfast world (on `main`) | `holdfast/index.html` + `hf-map.js` (valley, layout, nav grid, flow fields), `hf-art.js` (models, looks), `hf-sim.js` (settlers, infected, director, expeditions), `hf-work.js` (crops, stores, hauling, cooking, guard responses), `hf-life.js` (community zones: training, stable + riders, workshop, repairs, hospital, school, farmyard, graveyard, market), `hf-render.js`, `hf-audio.js`, `hf-main.js` (page, camera, UI), `hf-world.js` (world contexts, background preparation) | Opened from the gallery in a frame. Two timelines on the same map: Current (infected) and Past (`hf-past-art.js` art, `hf-past.js` simulation; `HF.era`, `?era=past`), plus Future (`hf-future-art.js`, `hf-future.js`, `hf-future-render.js`; `?era=future`), switched **in the page** by a crossfade between lazily created world contexts (no reload; `hf-world.js`, `hfSwitchEra` in `hf-main.js`). Future status: `docs/holdfast/FUTURE-STATUS.md`. Status and measurements: `docs/holdfast/STATUS.md`; design: `docs/holdfast/HOLDFAST-DESIGN.md`. |
| Tests | `tests/*.mjs` | Node only (no packages) + an installed Chrome/Edge for browser checks. See below. |

Run locally: `serve.bat` or `python -m http.server 8765` from the repo root, then `http://localhost:8765/` (YouTube needs http).

## Product rules

- A cozy, observation-only **living diorama**: no player-controlled characters, no placement/construction, no objectives, no
  campaign or day counter. Settlers and threats act on their own; the viewer pans, zooms and changes time/weather/season/music.
- Keep each world's layout fixed and authored (deterministic per map seed). Holdfast may only reshape its own map when a
  milestone explicitly asks for it.
- Keep the camera isometric; keep pixel edges crisp (integer device-pixel scaling, smoothing off, nearest-neighbour).
- Holdfast tone: busy, survival-focused, watchable, no gore (fallen settlers are covered, infected fade).
- Do not use emoji or emoji-style art as game assets. Art is code-drawn in the approved pilot style (box models + painters,
  cocoa ink outline, warm grade); new things must match it.
- Do not change SaigonLofi gameplay or the shared UI behaviour when working on Holdfast. Saigon files are used read-only
  (shared CSS/JS changes need an explicit reason and a parity check: `tests/ui-snapshot.mjs`).
- All three Holdfast eras (Current, Past, Future) are approved and on `main`. Era-specific code lives behind `HF.era === 'past'` / `'future'`;
  every era branch must leave the other timelines' behaviour and random sequence unchanged (`tests/holdfast-past.mjs`, `tests/holdfast-future.mjs`).

## Code rules

- Plain `<script>` files sharing globals, in the load order of each `index.html`. No bundler, no framework.
- Holdfast simulation modules (`hf-map`, `hf-sim`, `hf-work`, `hf-life`) are **DOM-free**: they run in Node for the tests
  (`tests/hf-load.mjs`). Rendering reads simulation state; it never drives behaviour.
- Determinism: simulation randomness goes through `HS.R` (seeded); `Math.random` only in render-only effects.
- Every new behaviour needs a deterministic test or a diagnostic number; screenshots alone never prove behaviour.
- Keep frame time in budget (`tests/holdfast-bench.mjs`; desktop 1080p should stay near 60 fps on software GL).

## Tests

| Command | What |
|---|---|
| `node tests/holdfast-past.mjs [seed]` | Milestone 8 (PAST): same valley as Current, prehistoric art for every building/prop, tribe looks, 15 dinosaur species (sprites + roles), packs, chargers, apex, flyers, traps, fire (torches, beacons, fire-keeper, dance), activity spread, determinism, Current untouched |
| `node tests/holdfast-m7.mjs [seed]` | Milestone 7: zombie archetypes (from `holdfast/zombie.webp`), church / school / riverside graveyard layout, bathing, washing, bank fishing, supply + red-cross medical boats, determinism |
| `node tests/holdfast-community.mjs [seed]` | Milestone 6: zone distribution, crowding, food chain, market, training + alarm, stable + riders, workshop, repairs, hospital, school, farmyard, graveyard, frontier, 2-day stability, determinism |
| `node tests/holdfast-life.mjs [secs] [seed]` | Milestone 5: congestion, synchrony, walking speed, crop cycles, visible work, infected density |
| `node tests/holdfast-sim.mjs 3600` | Map sanity + 3 game days of combat, expeditions, repairs |
| `node tests/holdfast-warm.mjs [seeds]` | Warm start (the world is already alive on the first frame) |
| `node tests/holdfast-browser.mjs [--shots] [--bench]`, `node tests/holdfast-flow.mjs`, `node tests/holdfast-bench.mjs` | Headless Chrome: self-test, gallery + Saigon smoke, UI flow, fps |
| `node tests/tayduky-v2-sim.mjs [secs] [seed]`, `node tests/tayduky-v2-world.mjs [secs]` | Tây Du Ký v2 (branch `feature/tayduky-redesign-v2`): simulation invariants in Node; the world in headless Chrome |
| `node tests/holdfast-diag.mjs`, `node tests/holdfast-mapdump.mjs` | Diagnostics (numbers / a top-down character map of the layout) |
| `tests/tet.mjs`, `tests/dance.mjs`, `tests/events.mjs`, `tests/riverfront-turns.mjs` | Saigon checks (need the `playwright` package, not installed here) |

## Workflow

- `main` is the only long-lived branch. Start each piece of work (e.g. a new world) on a short-lived feature branch from `main`; never merge into `main` without the owner's approval, then delete the branch.
- Commit in small, verified milestones; push the branch after each milestone.
- Do not commit secrets, temporary screenshots, test reports, browser profiles, `node_modules` or other generated output.
  Curated screenshots live in `docs/holdfast/screenshots/` and are only replaced deliberately.
- Never store API keys or credentials in the repository.
- Update `docs/holdfast/STATUS.md` (and the design doc when the scope changes) with every Holdfast milestone: what exists,
  measured results, tests run, and an honest list of limitations.

## Parallel development (Claude Opus ∥ Codex) — historical

> **Merged 2026-11-19.** All Holdfast work (Current, Past, Future and the three-era dock fix) is integrated on `main`, which is now the only branch. The parallel-development split below is **historical**; new work starts from `main` on a short-lived feature branch.

Two agents work on Holdfast at the same time from the **same baseline commit** (`main` after the coordination docs; gameplay baseline `2b37501`). Full contract: `docs/holdfast/PARALLEL-DEVELOPMENT.md`; Codex's instructions: `AGENTS.md`. The three documents agree; the contract wins if they differ.

| Agent | Branch | Owns |
|---|---|---|
| **Claude Opus** | `feature/holdfast-future` | the entire **Future** timeline: futuristic architecture and environmental art; robots, drones and mechanical enemies; Future simulation and community activities; Future combat, defense and effects; Future audio; Future tests and docs (`hf-future*.js`, `tests/holdfast-future*.mjs`, `docs/holdfast/FUTURE-*.md`); the **minimal shared integration hooks** the third era needs |
| **Codex** | `feature/holdfast-current-past` | Current and Past timelines: improvements and bugs, zombie and dinosaur art and animation, Current/Past behaviour, combat, weather, environment, their tests and docs (`hf-past*.js`, `STATUS.md` sections) |

Claude must **not**: change Current/Past behaviour unnecessarily; rewrite zombie or dinosaur systems; push to `feature/holdfast-current-past`; merge into `main` without the owner's approval; alter SaigonLofi.

Shared code (`hf-world.js`, `hf-sim.js`, `hf-work.js`, `hf-life.js`, `hf-render.js`, `hf-main.js`, `hf-map.js`, `hf-audio.js`, `hf-art.js` dispatch lines, `holdfast/index.html`, `hf-theme.css`, test helpers) has no exclusive owner: keep changes minimal, isolated and backward-compatible; prefer era modules/adapters (`hf-future*.js` + one dispatch line); run `holdfast-sim`, `-past`, `-corpse`, `-world`, `-transition` (Current and Past must be unchanged); log each change in `docs/holdfast/shared-changes/future.md`; never merge or overwrite the other branch.

Third-era integration points you will extend (and Codex will not): the era normalisation in `hfBuildMapG`; the **implicit "else = Current"** after every `HF.era === 'past'` check (add an explicit `'future'` branch *before* the fall-through everywhere, or Future will silently run Current code); `hwPrepare` / `HW_ENV` / `hfFadeTo` / `hfSwitchEra` / `hfApplyEraUI` / `ERA_ARIA` / the `#eras` tab (the switching assumes exactly two eras); script tags in `holdfast/index.html`; per-world renderer state must be added to `HR_WORLD_KEYS`; module-level state is forbidden (it leaks between worlds). Document Future in `docs/holdfast/FUTURE-STATUS.md`, not in `STATUS.md`. Do not start Future work without the owner's Future prompt.
