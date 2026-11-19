# Holdfast — Implementation Status (Current era MVP)

Branch `design/holdfast-world`. **Not merged to `main`.** PAST and FUTURE are out of scope (shown as "soon" tabs only).

## How to run

```bash
python -m http.server 8765        # or serve.bat, from the repo root
```

| Open | What you get |
|---|---|
| http://localhost:8765/ | Lofi Worlds gallery → **Holdfast** card (bottom right) opens the world in a frame; the radio keeps playing |
| http://localhost:8765/holdfast/ | Holdfast standalone (direct testing) |
| `holdfast/index.html` via `file://` | Works too (YouTube needs http, as in Saigon) |

**URL parameters** (testing/screenshots): `seed`, `pop` (residents), `hour`, `time=auto|morning|noon|dusk|night`, `wx=auto|clear|rain|wind`, `season=auto|spring|summer|fall|winter`, `danger=calm|standard|grim`, `cam=default|gate|settlement|wall|market|commons|ruins|fields|east|west|exp`, `zoom`, `warp=<seconds>` (fast-forward before the first frame), `attack=<n>` (force a major attack), `exp=1` (start an expedition), `clean=1` (hide UI), `test=1` (in-page self-test), `bench=1` (render benchmark).

**Controls (same as Saigon):** drag to pan · wheel / pinch / `+` `−` zoom · Space music · H hide / double-click to show · R rain · N night · 1–4 seasons · B gate view · Esc back to Lofi Worlds · bottom dock (play, track, prev/next, ···, seasons + Auto) with the shared settings panel · VI/EN top-right. See milestone 4 below.

## Fully implemented

| Area | What exists |
|---|---|
| **World** | Approved 144×144-tile valley: river meander, creek + culvert, curved improvised wall chain (161 sections, 10 towers, straight gate run with HOLDFAST sign), cleared kill-zone (hedgehogs, stumps, wrecks), wilderness (clustered pine/broadleaf groves, meadows, rocky ground, old road with bus + wrecks + power poles, trails, riverbank paths), 6 scavenging POIs (gas station, abandoned houses, collapsed house, farm, radio hill, old-town ruins) |
| **Settlement** | **59 houses** (3 lot sizes, 13 wall colours, 8 roofs, porches, garages, chimneys, boarded/broken windows, spray tags, solar, water tanks) + newcomers' RV and 2 tents (≈62 dwellings); barracks + drill yard, infirmary + triage tent, workshop/motor pool, church (shelter), school, barn, kitchen + mess tent, 8-stall market, commons with great oak, fire pit, tables, string lights, benches, playground, memorial stones, water tower, wind turbines, 3 greenhouses, coop, goat pen, beehives, 3 docks + smokehouse, 43 crop-field patches, lamp-lit main street, yard props (fences, beds, barrels, laundry, woodpiles, bikes, mailboxes, bins, cars) |
| **Art** | Rendered with SaigonLofi's own art system (bake/grade/ink, drawPerson, treeSprite) at Saigon density; pilot materials on every building/prop; per-pixel ground chunks with season palettes and raised grass; cast shadows; zombie/guard/worker looks through drawPerson costume hooks; conifers; animals (deer, rabbits, chickens, goats, dogs, crows) |
| **Settlers** | 120 desktop / 70 mobile in 3 tiers (16 named, ~74 scheduled workers, ~30 ambient); roles: guards (towers, gate, patrol, reserve, 2 shifts), farmers, fishers, cooks, builders, techs, medics, scavengers, traders, teacher, elders, kids; meals, sleep, school, play, market, chores, carrying, laundry; rain behaviour; alarm → kids/elders shelter in the church; spot claims + phase offsets so nobody moves in lockstep |
| **Infected** | wander / idle / march (routes R1–R5) / investigate (noise) / chase wildlife / pursue / attack / wall + gate attack / stagger / die / corpse / fade; sound-driven (gunshots attract), group marches, frontier band always populated |
| **Combat** | Tower snipers (aim, muzzle flash, tracer, hit/miss), gate spearmen, patrol shots, reserve defenders at the hottest section, melee inside breaches; wall sections take damage → damaged sprite → breach (passable) → builders repair → sealed; settlers can be injured (infirmary, medic) or killed (covered body → memorial) |
| **Expeditions** | prep in the yard → gate opens → out along wilderness paths → search (loot bubble) → return; fighting retreat when spotted, rescue sorties, injuries/deaths/lost teams, stragglers still walk home; chronicle entries |
| **Director** | Constant activity (wilderness + frontier band + herds kept populated) and encounters: minor 45–120 s, medium 12–20 min, major 30–45 min, siege ~2 h; Calm / Standard / Grim danger; replenishment by arriving survivors (who can be caught on the road) |
| **Time / weather / seasons** | Auto clock (1 day = 20 min) or fixed Morning/Noon/Dusk/Night (life keeps cycling around the fixed hour); Saigon's ambient colour table + emissive windows, lamps, fires, tower lanterns; rain (snow in winter), wind (leaves/dust); 4 seasons re-bake ground, trees and snowy roofs |
| **UI** | **Saigon's UI** (shared `css/lofi-ui.css`, `js/dock.js`) in Holdfast's palette; `PAST · CURRENT · FUTURE` plate (Past/Future "soon"); see milestone 4 |
| **Audio** | Synthesised (no samples): wind, leaves, creek, river, rain, crickets, settlement murmur, birds, owl, distant moans, capped gunshots (≤6 / 10 s), hammering, gate, alarm bell, breach; distance attenuation + panning; routed through the radio's Ambient volume |
| **Integration** | Gallery card is live; Holdfast runs in a frame so the gallery's radio/YouTube (window.LW) keep playing; Saigon sleeps while Holdfast is open; closing disposes the frame; Saigon code untouched |

## Partial / placeholder (honest list)

- **Animation depth:** characters use Saigon's 8-pose sheets (stand, 4-frame walk, sit, arm-up, talk) plus tool/weapon overlays. There is no dedicated run cycle, no fall-over animation (stagger blink → lying sprite) and no swing frames for melee beyond arm-up/forward.
- **Wall shape:** the arch is a tile staircase of short panels (reads as a zigzag palisade up close).
- **Stuck/occlusion edge cases:** agents can briefly overlap prop footprints; tall houses can hide a person behind them (no cutaway).
- **Corpse cleanup:** corpses fade after ~2 minutes; there is no cleanup crew or burn pile.
- **Night shift detail:** night guards reuse day posts; no torches carried, no searchlight cones.
- **Audio:** synthesised placeholders, tuned by ear only in code — **not listened to in a real browser session yet**.
- **Mobile:** density reduced to 70 by viewport; not tested on a physical iPhone.
- **Season change:** re-bakes all sprites (≈1–2 s stall with a toast).
- **Time-of-day lighting** is screen-space (no warm-inside/cool-outside split yet).

## Tests

| Command | What it proves | Last result |
|---|---|---|
| `node tests/holdfast-sim.mjs 3600` | 21 checks over 3 game days, seed 7: map sealed (0 leaks), gate connects, 59 houses, civic sites, POIs/routes; no NaN/off-grid agents, **no infected entry without a breach or open gate**, no agent frozen on a path > 60 s, snipers fight, minor encounters frequent, major + siege fire, alarm→clear cycles, expeditions finish, repairs happen, population stays ≥ floor, deterministic per seed | **PASS** (sim ran ~68× real time). Run stats: 45 minor / 3 medium / 2 major / 1 siege, 438 kills, 19 breaches, 22 repairs, 4 expeditions, 2 rescues, 1 death, 5 injuries, population min 119 |
| `node tests/holdfast-browser.mjs [--shots]` | Headless Chrome: in-page self-test (zones render, pan, zoom, day/night, weather + time modes, no console errors); gallery shows Saigon + Holdfast live, LW bridge, Holdfast frame boots/paints with 0 errors, back disposes the frame; **Saigon still boots and paints**; screenshots | **PASS** |
| `node tests/holdfast-bench.mjs` | Real-time fps through the DevTools protocol | see below |

Existing Saigon tests (`tests/tet.mjs`, …) need the `playwright` package, which is not installed on this machine — **not run**. Saigon was smoke-tested through the probe above (boots, paints) and its world code is unchanged; only `js/menu.js` (+25 lines) and `index.html` (+4 CSS lines) changed.

## Measured performance

Headless Chrome 1920×1080 / 1280×720 / 390×844 on this Windows machine, **software rendering (`--disable-gpu`)** — a real GPU should be faster; phones are slower CPUs and were not measured on hardware.

| Scenario | rAF fps | JS per frame (median / p95) | Sprites drawn |
|---|---|---|---|
| Desktop 1080p, 120 residents | 59.8 | 8.7 / 11.2 ms | ~990 |
| Laptop 720p, 120 residents | 60 | 1.5 / 2.1 ms | ~510 |
| Phone-sized viewport, 70 residents | 60 | 0.9 / 1.6 ms | ~220 |
| Desktop 1080p during a 60-strong attack (77 infected) | 58.4 | 9.6 / 13.3 ms | ~995 |

Simulation alone: 0.2–0.4 ms per 0.1 s tick. Load: map + 2,156 static sprites bake in a few seconds; ground chunks (512×512 art px) bake lazily and in idle time (≈20–50 ms each).

## Screenshots

`docs/holdfast/screenshots/`: 01 default view · 02 settlement · 03 barricade + gate (2×) · 04 zombie attack · 05 scavenger expedition · 06 autumn dusk · 07 night · 08 rain · 09 winter snow · 10 phone portrait.


## Milestone 4 — instant living world + Saigon UI parity

**Warm start (`hsWarmStart` in `hf-sim.js`).** Holdfast no longer begins at a shared spawn point. Each settler runs its normal schedule once and is placed *inside* that activity: tower snipers seated in their towers, gate guards at the gate, patrols spaced along the wall (some mid-leg), farmers in fields, fishers on docks, cooks/builders at their sites, residents sitting, talking, eating or part-way through a walk (advanced along the real path flow field, never through walls). Infected are spread over the wilderness (not all moving at once) plus the frontier band, sometimes a small group already marching in; wildlife and animations are phase-desynchronised; an expedition may be in prep, out, searching or returning. `px/py = x/y` so the first frame never slides. Cost ≈ 3–150 ms (no simulated warm-up). The map seed stays 7 (approved layout); the *population* seed is time-based unless `?seed=` is given (tests/screenshots). The start hour is a seeded daytime moment (`?hour=` overrides). The loading card goes away only after the first coherent frame is drawn.

**No campaign.** No Day counter anywhere: the status line is `Season · hh:mm · weather`; the chronicle is a journal inside the settings panel stamped with the hour and "yesterday / N days ago" only; there is no start entry. The internal clock, schedules and day/night are unchanged. Seasons change only by the dock's season buttons or **Auto** (every 150 s, as in Saigon).

**Shared UI.** `css/lofi-ui.css` was extracted verbatim from Saigon's `index.html` (Saigon links it; verified identical computed styles/layout, see Tests). Holdfast uses the same markup/ids: language toggle top-right, back button + plate + info + ticker top-left, music dock bottom-centre (play, track/counter, level meter, prev/next, ···; season row + Auto; panel with YouTube, time, **Danger** in the place of Saigon's event row, weather, world sound switch + slider, music/ambient/vinyl sliders, view row with gate view/zoom/fullscreen/hide, plus a Journal row), YouTube box bottom-right. Only the palette (`holdfast/hf-theme.css`) differs. Behaviour comes from `js/dock.js` (music, volumes, YouTube, prefs) on top of Saigon's `audio.js`/`yt.js`. Saigon's own wiring in `js/main.js` is unchanged; it was not re-pointed at `dock.js` (no behaviour risk).

**Music.** Built-in lofi, play/pause, prev/next, track + counter, level meter, music/ambient/vinyl volumes, YouTube playlist (shared player, same status messages, box visible bottom-right above the world), and preferences (`saigonlofi` record: volumes, track, world-sound switch) are the same code and the same stored record as Saigon. Embedded in the gallery, all three share one radio and keep playing across Gallery ⇄ Saigon ⇄ Holdfast. World sound follows play/pause like Saigon's ambience; nature beds use the Ambient slider, combat/settlement events the "world" (street) channel. Saigon has no mute button (slider at 0 / pause), so Holdfast has none either.

**Re-entry.** The gallery now hides the Holdfast frame instead of destroying it: the simulation is paused while hidden and resumes exactly where it was (same residents, camera, zoom, time, weather, season, danger; no restart). A full page reload restores preferences (season/Auto, time, weather, danger, zoom, camera, music prefs) and gives a fresh warm start (a new arbitrary moment) — world state itself is not serialised.

**Limits.** Browsers need a user gesture before audio: from the gallery the card click starts the radio; opened directly the "tap to play" bubble is shown, same as Saigon. Music survives navigation inside the single-page gallery but **not** a page reload or opening `holdfast/` as its own page. Embedded YouTube keeps the platform's own restrictions (embeddable videos, no `file://`). Saigon's city beds are faded out when Holdfast opens (they would otherwise drone under it).

### Milestone 4 tests
| Command | Proves |
|---|---|
| `node tests/holdfast-warm.mjs [seeds]` | 30 seeds: snipers in towers, gate guards at posts, patrols spread, farmers working (or at meals), no shared spawn cell, mid-walk residents, infected spread/none inside, band populated, positions valid, deterministic, cheap; fails on the old code |
| `node tests/holdfast-flow.mjs` | Real Chrome: first-state checks, 8 s later no mass migration, dock play/prev/next/volumes/prefs, YouTube load/off + box placement, season/danger/time/weather, journal, hide/show, gallery → back → in again (same frame, no restart, state restored, paused while hidden), reload restores prefs, no console errors |
| `node tests/ui-snapshot.mjs snap saigon\|holdfast out.json` then `diff` / `parity` | `diff`: Saigon computed styles + rects identical before/after the CSS extraction (5 viewports × VI/EN × panel open/closed); `parity`: 500 element placements identical between Saigon and Holdfast |
| `node tests/holdfast-sim.mjs 3600`, `node tests/holdfast-browser.mjs` | unchanged regressions (sim, combat, expeditions; gallery + Saigon boot) |
