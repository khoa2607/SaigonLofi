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
| **Settlers** | 120 desktop / 70 mobile in 3 tiers (16 named, ~74 scheduled workers, ~30 ambient); roles: guards (towers, gate, patrol, reserve, 2 shifts), farmers, fishers, cooks, builders, techs, medics, scavengers, traders, teacher, elders, kids; meals, sleep, school, play, market, chores, carrying, laundry; rain behaviour; alarm → kids/elders shelter in the church; spot claims + phase offsets so nobody moves in lockstep; since milestone 5 every job has a visible outcome (crop plots, stores, meals, planks, repairs), see below |
| **Infected** | wander / idle / march (routes R1–R5) / investigate (noise) / chase wildlife / pursue / attack / wall + gate attack / stagger / die / corpse / fade; sound-driven (gunshots attract), group marches, frontier band always populated |
| **Combat** | Tower snipers (aim, muzzle flash, tracer, hit/miss), gate spearmen, patrol shots, reserve defenders at the hottest section, melee inside breaches; wall sections take damage → damaged sprite → breach (passable) → builders repair → sealed; settlers can be injured (infirmary, medic) or killed (covered body → memorial) |
| **Expeditions** | prep in the yard → gate opens → out along wilderness paths → search (loot bubble) → return; fighting retreat when spotted, rescue sorties, injuries/deaths/lost teams, stragglers still walk home; chronicle entries |
| **Director** | Constant activity (wilderness ~20 + frontier band ~12 infected kept populated × danger × device, herds topped up; newcomers never spawn on screen or inside the wall), small packs forming and breaking up, and encounters: micro 25–55 s (wall probes near towers, gate knockers, packs, route groups, stalkers on expeditions), medium 6–10 min, major 18–28 min, siege ~2 h; Calm / Standard / Grim danger; replenishment by arriving survivors (who can be caught on the road). See milestone 5 |
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


## Milestone 5 — simulation behaviour & activity density

Map, art, camera and the shared Saigon UI/audio are unchanged. New module `holdfast/hf-work.js` (crop plots, stores, hauling, cooking, fishing catches, builders' materials, guard responses); behaviour changes in `hf-sim.js`; crop/store drawing in `hf-render.js`; three work bubbles (fish, wheat, plank) added to the icon table at runtime in `hf-art.js` (Saigon's files untouched); `hf-main.js` passes the camera rectangle to the director and lowers infected density on slow machines.

### Root causes found (measured before changing anything)

| Symptom | Root cause in the old code |
|---|---|
| Crowds in the centre | Most idle activities (`sit`, `eat`, `chat`, `shop`, off-shift guards) drew from the same few commons lists (32 seats, 10 green spots, 12 play spots); claims were only a soft preference (6 random samples), single-point places (storage, granary, mourn) had no slots at all, so people stood on one pixel. **Claims also leaked:** any task cleared with `task = null` (alarm, kill, expedition, most task ends) never released its spot. Measured: up to 29 people within 12 units of one person; 6.6–8.7 overlapping pairs per second. |
| Group movement | Everyone used the same flow field per destination and the same first-found downhill neighbour, so trips to one place followed identical tiles; schedules switched on exact hours for everybody (meals, sleep, school, shift change); all 30 guards left one barracks door; sheltered kids/elders left the church on the same tick. Measured: 19–21 side-by-side walking pairs lasting ≥ 5 s per minute. |
| Slow walking | Base speeds 6.2–7.6 units/s (elders 4.6), running 13. |
| Decorative farming | Crops were painted into the baked ground chunks (`HF.crop`) and never changed; farmers played a hoe loop on a random field spot and occasionally got a basket. |
| Walking without results | `carry`/`work`/`drop` tasks only played an animation for N seconds; nothing in the world changed. |
| Quiet wilderness | 16 wanderers + 7 in the band, minor events every 45–120 s, medium 12–20 min, major 30–45 min. **Plus a bug:** an infected in the `wall` state attacked its target section as soon as its path ended, even when the path was dropped far away — most breaches were "remote" (measured: 18 per hour with nobody within 30 units). Reserve guards in an alarm decided once (often before any section was under pressure) and then drilled. |

### What changed

- **Congestion:** spot capacities (seat/bench/class/stall/cook/fish/drill/yardwork 1, porch/green/play/shop 2, yard 3) and zone capacities (commons 14, 40 at meal time; playground 8; market 9); full → fallback near home (own porch/yard, then a nearby free porch). Shared points hand out ring positions. One claim per person (`hsClaim`), released on any new task, death, expedition or rescue. Idle people who end up on top of each other step apart (short-radius separation on walkable tiles). Defenders and responders spread along the threatened wall instead of one tile. A watchdog ends any walk after 150 s.
- **Independent movement:** per-person schedule offset ±0.45 h (guards ±0.9 h; a third of farmers on a late crew), personal home chores (own porch and yard), near-optimal route variation per trip (equally short tiles chosen by a per-trip hash), local side-stepping around someone just ahead, barracks exits spread along its front, church exits staggered over ~25 s, one hauler per supply route. Group activity is kept where intended: meals at the tables, alarm shelter, defence, patrols, expeditions, rescues, households walking home together.
- **Speed:** walking 8.7–10.6 units/s (≈ +40 %), kids 11–12.4, elders 6.2–7; running 16.5; a 0.2 s ease-in from standing; tower guards now walk to the ladder, climb, and step off instead of snapping between base and platform. Walk-cycle frames are driven by distance travelled, so faster walking does not slide.
- **Farming:** each of the 43 field patches is a plot with its own clock: empty/stubble → planted (rows appear tile by tile while a farmer kneels) → sprouting → growing → mature (5 crop looks) → harvest (rows cut tile by tile, chaff) → replanted in the same visit. Growth stages take 22–30 s; tending (watering) shortens one. Farmers pick plots by need and distance, fill a basket over up to two harvests and carry it to the granary or kitchen; idle scavengers, adults and some elders lend a hand. At night growth slows per plot (own pace) and, when more than a third of plots are waiting to be harvested, ripening slows so a short-handed evening does not leave every field ripe at once.
- **Visible outcomes:** stores (`HS.store`: granary food, smoked fish, kitchen ingredients, cooked pots, meals on the tables, workshop planks, yard supplies, market goods) drawn as piles that grow and shrink (6 items = full) and bowls on the mess tables. Fishers cast, get bites (splash + fish bubble), land up to three fish and carry a bucket to the smokehouse. Cooks fetch ingredients, stir (steam), carry the pot to the tables; eaters take a bowl (or bread from the granary). Workers haul yard supplies to the workshop, food to the kitchen and market; households carry a sack home. Builders fetch a plank, then hammer a house or a damaged wall section back to full (dust, hammering, the damaged sprite disappears); benches turn scrap into planks. Expedition loot fills the yard/granary.
- **Guards:** patrol and reserve guards answer infected that come close or hit the wall (run to the nearest inner section, aim, shoot), up to 6 at a time with wall attacks taking priority (they can pull a responder off a lesser target); in an alarm reserves leave the drill yard as soon as a section is actually hit; staggered shift changes; sparring in two facing rows at the barracks.
- **Infected (Encounter Director):** ~20 roaming + ~12 in the frontier band (× danger × device), small packs forming around a leader for 40–90 s and breaking up (sometimes heading for the wall), micro encounters every 25–55 s (wall probes near towers, gate knockers, route groups, packs, deer chases, culvert probes, stalkers when an expedition is out), medium every 6–10 min, major every 18–28 min, siege still ~2 h. Gate opening and wall repairs make noise. 12 % are faster "runners". New infected never appear inside the camera view or inside the wall. Small groups dent a wall (damage → repair crew) but it takes a real pack (≥ 4) to break it. Only purposeful approaches ring the alarm bell, not wanderers drawn by gunfire. Infected lose interest in someone who is down. Outside → outside paths use the static outside flow field (also cheaper and gate-proof); wandering is straight-line steering. Device tuning: `HS.zScale` starts at 0.6–1 by population (phones 0.6) and the page lowers it (to 0.5 minimum) if frames get slow.

### Measured results (Node, deterministic seeds, accelerated time)

| Metric (20 game-minutes, seed 7 unless noted) | Old code | Now |
|---|---|---|
| Biggest crowd within 12 units (meals/defence excluded) | 29 | 8–14 incl. passers-by; standing ≤ 5 |
| Overlapping pairs (< 2 units) per second | 6.6–8.7 | 0.3–0.8 |
| Side-by-side walking pairs lasting ≥ 5 s, per minute | 18.9–21 | 3.6–7.3 (unrelated people 1.2–2.1) |
| Median adult walking speed | ~6.9 | 9.4 units/s (running 16.5) |
| Crop plots changing stage | 0 | 43 / 43, median 25–26 s between visible changes (90th percentile 70–90 s: ripe plots waiting for a farmer) |
| Largest share of plots in one stage | — | ≤ 0.44 in daylight, ≤ 0.63 overnight |
| Harvests / plantings / deliveries | — | 231 / 242 / 170 |
| Roaming infected (average) / in the default-view band | 18.7 / 4.6 | 35.5 / 13 |
| Micro encounters per hour | ~43 | ~86–93; medium 7 (was 3–4), major 2–3 (was 1) |
| Time under alarm | 4–19 % | 11–16 % |
| Deaths per game hour (no forced attacks) | 1–3 | 0–2 |
| Breaches per hour | ~10–18 (mostly the remote-attack bug) | 1–7, all real |
| Sim speed (3-day run) | 68× real time | 150–170× real time |

Render benchmark (headless Chrome, software GL, same machine): 1080p 59.8 fps, loop JS 7.3 / 12.1 ms median / p95 (was 8.7 / 11.2); 720p 1.1 / 1.8; phone 0.7 / 1.5; during an 80-strong attack 7.8 / 12.8 (was 9.6 / 13.3).

### Milestone 5 tests

| Command | Proves | Last result |
|---|---|---|
| `node tests/holdfast-life.mjs [secs=1200] [seed=7]` | 36 checks: no standing crowd > 10, no cell with 6+ people for > 60 s, few overlaps; few synchronized pairs (< 8/min, unrelated < 3/min); walking 8.5–11, running ~16, no teleport step; every plot cycles, median visible change 18–32 s, no stage > 50 % of plots in daylight (> 70 % ever); harvest/plant/deliver, fish caught/landed, cook/serve/eat, hauls, builds/salvage, stores within limits; ≥ 28 roaming infected, ≥ 8 in the band, ≥ 1 micro encounter per minute, packs, guard responses, nothing spawns in view or inside; a damaged wall is repaired with planks within 150 s; an isolated 5-strong wall attack gets a guard within 30 s and is dealt with within 60 s; calm < standard < grim, phones fewer; 2 game days stable (no NaN, crops still cycling, claims never leak); deterministic | **PASS** on seeds 7, 13, 21, 29, 37, 45 |
| `node tests/holdfast-diag.mjs [secs] [seed]` | Diagnostic numbers only (crowding, synchrony, hotspots, activity mix, work and combat stats) — used for the old/new comparison above | — |
| `node tests/holdfast-sim.mjs 3600` | unchanged 21 checks (3 game days with forced major + siege) | **PASS** (0 deaths, 5 breaches, 25 repairs in the last run) |
| `node tests/holdfast-warm.mjs 30` | warm start on 30 seeds (flow fields are now built lazily, so it stays < 250 ms) | **PASS** |
| `node tests/holdfast-browser.mjs`, `node tests/holdfast-flow.mjs` | page boots with 0 errors, gallery/Saigon unaffected, UI flow | **PASS** (the browser self-test returned no result once in four runs; it passed on every rerun) |

Screenshots were taken in headless Chrome to check the crop sprites, piles, bowls, packs and guard positions. **Stills cannot show animation or behaviour over time** — that evidence comes from the simulation tests above. Movement has not been watched in a real browser session at 60 fps by a person yet.

### Remaining limitations

- Overnight (farmers asleep) up to ~60 % of plots can share a stage (mostly "planted" right after the late crew); ripe plots can wait 1–1.5 min for a farmer on busy evenings.
- The granary and smokehouse still fill to their cap overnight; during the day they rise and fall.
- Avoidance is local (side-step / separation), not full crowd simulation; two people can still brush past each other on a narrow lane, and households walking home together count as "pairs" by design.
- "Repairing" houses has no visible damage state to fix — the builder's work shows as plank → hammering → dust/bubble; walls do change sprite when repaired.
- Tower snipers often drop a small probe before responders arrive, so the response is sometimes seen as guards arriving at a quiet wall.
- Device tuning only adjusts infected density; it is driven by frame time and has not been tested on a phone.
