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

**URL parameters** (testing/screenshots): `seed`, `pop` (residents), `hour`, `time=auto|morning|noon|dusk|night`, `wx=auto|clear|rain|wind`, `season=auto|spring|summer|fall|winter`, `danger=calm|standard|grim`, `cam=default|gate|settlement|wall|market|commons|ruins|fields|east|west|exp|training|stable|hospital|school|graveyard|farmyard|workshop`, `zoom`, `warp=<seconds>` (fast-forward before the first frame), `attack=<n>` (force a major attack), `exp=1` (start an expedition), `clean=1` (hide UI), `test=1` (in-page self-test), `bench=1` (render benchmark).

**Controls (same as Saigon):** drag to pan · wheel / pinch / `+` `−` zoom · Space music · H hide / double-click to show · R rain · N night · 1–4 seasons · B gate view · Esc back to Lofi Worlds · bottom dock (play, track, prev/next, ···, seasons + Auto) with the shared settings panel · VI/EN top-right. See milestone 4 below.

## Fully implemented

| Area | What exists |
|---|---|
| **World** | Approved 144×144-tile valley: river meander, creek + culvert, curved improvised wall chain (161 sections, 10 towers, straight gate run with HOLDFAST sign), cleared kill-zone (hedgehogs, stumps, wrecks), wilderness (clustered pine/broadleaf groves, meadows, rocky ground, old road with bus + wrecks + power poles, trails, riverbank paths), 6 scavenging POIs (gas station, abandoned houses, collapsed house, farm, radio hill, old-town ruins) |
| **Settlement** | *(milestone 6: re-zoned, 40 houses + training ground, stable, workshop yard, hospital, school campus, graveyard, farmyard — see below.)* Originally **59 houses** (3 lot sizes, 13 wall colours, 8 roofs, porches, garages, chimneys, boarded/broken windows, spray tags, solar, water tanks) + newcomers' RV and 2 tents (≈62 dwellings); barracks + drill yard, infirmary + triage tent, workshop/motor pool, church (shelter), school, barn, kitchen + mess tent, 8-stall market, commons with great oak, fire pit, tables, string lights, benches, playground, memorial stones, water tower, wind turbines, 3 greenhouses, coop, goat pen, beehives, 3 docks + smokehouse, 43 crop-field patches, lamp-lit main street, yard props (fences, beds, barrels, laundry, woodpiles, bikes, mailboxes, bins, cars) |
| **Art** | Rendered with SaigonLofi's own art system (bake/grade/ink, drawPerson, treeSprite) at Saigon density; pilot materials on every building/prop; per-pixel ground chunks with season palettes and raised grass; cast shadows; zombie/guard/worker looks through drawPerson costume hooks; conifers; animals (deer, rabbits, chickens, goats, dogs, crows) |
| **Settlers** | 120 desktop / 70 mobile in 3 tiers (16 named, scheduled workers, 14 ambient adults/elders); roles (milestone 6): guards 30 (towers, gate, 6 patrols, reserves, 2 shifts), farmers 13, builders 8, techs 4, smiths 2, grooms 3, medics 5, cooks 4, fishers 4, scavengers 9, traders 6, teachers 2, herders 2, elders 8, kids 14, adults 6; meals, sleep, school, play, market, chores, carrying, laundry; rain behaviour; alarm → kids/elders shelter in the church; spot claims + phase offsets so nobody moves in lockstep; since milestone 5 every job has a visible outcome (crop plots, stores, meals, planks, repairs), see below |
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


## Milestone 6 — Current-era community expansion

Art style, camera, the shared Saigon UI/audio and the milestone 5 behaviour systems are unchanged. Saigon is untouched. Past/Future are still "soon".

### What was reorganised (and why)

- **The gate yard was outside the wall.** The old site table centred the yard on design `v = 126`, ~90 units in front of the gate, so the trucks, crates, alarm bell, the yard store and the expedition staging point all sat in the cleared ground outside. It is now just inside the gate.
- **Civic buildings were patched into a tight ring around the green**, so most non-farm activity piled up at the commons while the crop belt (43 plots, 16 farmers) was the only large busy area. Instead of adding more spots there, the settlement was re-zoned (`HSITES` in `hf-map.js`) so each kind of work has its own place.
- **The footprint was enlarged** by moving the whole wall 30 design units outward (`HWALL`): threat routes, the wrecks in the kill-zone and the camera presets follow it; the frontier band, towers and gate logic are unchanged.

### Layout (design units, see `node tests/holdfast-mapdump.mjs`)

| Zone | Where | Contents |
|---|---|---|
| Gate yard | just inside the gate | trucks, crates, alarm bell, hitching rail (3 places), yard store, expedition staging, scavenger gear spots |
| Training ground | left of the gate, along the wall | barracks, firing range (4 targets + sandbag berm), sparring rows, running track around the ground, flag, army tent, hurdles, weapon-care bench |
| Market | main street below the gate yard | 8 stalls with live goods on the counters, a queue of 2 in front of each, parked handcart |
| Stable | right of the gate, west of the creek | stable with dutch stall doors, fenced paddock, trough, hay bales, tack rack; 5 horses |
| Workshop yard | east of the creek | workshop, forge with chimney and glowing coals, anvil, sawhorse, a wagon on blocks, workbenches, scrap |
| Hospital | centre-right | two-storey white hospital with red-cross signs and entrance canopy, triage tent, 6 cots in the open, medical crates, stretcher, waiting bench, sheet line, ambulance |
| Church + graveyard | centre-left | church; picket-fenced graveyard with 20 grave places (crosses and stones), memorial stones, lantern, bench, tree |
| School campus | left side (replaced ~8 houses) | school, playground (swings, slide, sandbox, seesaw), outdoor class with chalkboard, 4 garden beds, ball field with goals, story bench |
| Kitchen + commons | centre | unchanged (great oak, fire, tables, mess tent) |
| Farmyard | lower left by the barn | barn (granary), chicken coop with a fenced run, pig pen with hut and trough, goat pen |
| Fields, docks, greenhouses, newcomers' camp | as before | the crop belt is unchanged |

Houses: **40** (was 59) — the left side and the civic band became community space. New box models in `hf-art.js` (same pilot language): hospital, stable, rails/pickets on both axes, targets, sandbags, hay, trough, tack rack, forge, anvil, sawhorse, wagon, med tent, cots, med crates, stretcher, lantern, seesaw, chalkboard, goals, pig hut, flag, hurdles, handcart (8 loads), grave markers, scaffolding, wall patches, roof tarps; pig, rooster and horse sprites; night spirits.

### New simulation loops (`holdfast/hf-life.js`)

Every loop has a beginning (fetch / walk), an action (pose, tool, fx) and an outcome that changes the world.

- **Food chain:** farmers harvest into baskets; two harvests go by **wheelbarrow** to the granary or straight to the kitchen; haulers push **handcarts** granary → kitchen and granary → market; the kitchen only cooks what was delivered (verified by a starvation test); eggs and goat milk also go to the kitchen. 13 farmers (was 16), so farming is one big loop among several.
- **Living market:** traders set up their stalls in the morning (crate from the market pile → goods appear on the counter), restock when a stall runs low, and pack up in the evening (a cloth covers the empty counter). Customers pick the stall with the shortest queue, wait in line, move up, trade (money bubble) and carry a bag home. Stall stock and the market pile rise and fall through the day; the forge's tools are carted to the market too.
- **Training ground:** off-duty and reserve guards shoot at the targets (quiet practice rounds, tracer, a puff at the target), run laps of the track, march in a 3-5 person column behind a sergeant (footstep following), spar in facing rows, clean weapons. 6 patrols + more reserves (was 8 patrols). **On the alarm bell every training task stops at once and reserves run to the hottest section or to an assigned station on the wall** (they never fall back to training during an alarm).
- **Stable:** grooms fetch hay to the trough (horses walk over to eat), brush horses (the horse waits while groomed), prepare tack, muck out, and lead horses back from the hitching rail along their own footsteps. Horses graze, amble and drink in the paddock and stand at the stall doors at night (they route around the stable, never through it).
- **Mounted scouts:** every few minutes in daytime, 1-2 riders (scavengers or reserves) meet their tacked horses at the hitching rail, mount, ride out through the gate to a POI or a stretch of the frontier, look around, and trot home; if infected are close they gallop back with them in tow (the gate is forced open, guards respond) — "bringing danger to the gate". Sometimes they find **a wounded survivor** who walks in and ends up on a hospital cot, or medical supplies. A ride that cannot assemble is called off (no teleporting). Expeditions often take a **pack horse** that is unloaded at the hitching rail on return (+ yard supplies).
- **Workshop / logistics:** the smiths hammer at the anvil (sparks, quench steam) → tools pile → market; carpentry at the sawhorse turns salvage (or logs) into planks; technicians repair the wagon (progress), work the benches and push carts between stores; scavengers pack expedition gear in the gate yard (expeditions use it).
- **Construction & repair:** houses wear out (and 1-2 near the fighting are damaged after every attack). A builder carries poles over and **puts up scaffolding**, brings planks (by hand or a handcart of three), climbs onto the platform and **patches the wall hole or re-shingles the tarped roof plank by plank** (the patch fills in on the house), then dismantles the scaffold; the fresh boards stay visible for a while. Builders also top up sandbags at weak wall sections. Wall breaches/damage keep the milestone 5 repair loop (planks + hammer).
- **Hospital:** injured settlers are fetched by a medic **with a stretcher**, lie on a cot (raised), get medic rounds and heal; residents, workers with a splinter and kids with a scraped knee come for **check-ups** (waiting bench → called to the tent → examined); 1-2 **convalescents** rest on the cots in the daytime; medics restock the medical crates from the yard store (expedition medicine, scout finds) and hang sheets.
- **School:** morning lessons at the outdoor chalkboard (12 places, the teacher facing the class), a short recess, an afternoon **ball game** on the field (the ball really flies between the players), garden watering with the teacher, and story time on the bench (teacher or an elder) before going home. Kids are no longer "ambient": they keep their own schedule.
- **Farmyard:** 4 pigs in their pen (they crowd the trough when the herder brings scraps from the kitchen, sleep by the hut at night), 7 hens and a rooster in the coop run (they rush to the feeder at feeding time), eggs collected and carried to the kitchen, goats milked. 2 herders, helped by elders.
- **Graveyard / memorial:** residents and elders visit (stand or kneel, leave flowers that appear on the grave), an elder tends the paths; a death now adds **a fresh grave with a wooden cross and flowers** and a few neighbours gather. **At night only**, a few small pale spirits drift over the graves near the lantern, fading in and out (render-only, gentle).
- **Frontier:** milestone 5 behaviour plus: patrols answer approaches and reserves stay for real wall attacks, riders return chased, builders reinforce weak sections, attacks leave repair work behind.

### Activity distribution (Node, 08:00 → 20:00, same zone classifier for both)

Share of visible, awake settlers by zone (`lfZoneOf`; milestone 5 measured on commit 30a7ed5 with the equivalent old site table):

| Zone | Milestone 5 | Milestone 6 (seed 7) |
|---|---|---|
| Homes (porches, yards, streets) | 29 % | 16.1 % |
| Fields | 16 % | 14 % |
| Commons / green | 9.7 % | 10.7 % |
| Market | 1.8 % | 7.6 % |
| Training ground | 2.9 % | 4.6 % |
| Stable | — | 3.1 % |
| Workshop yard | 3.5 % | 5.3 % |
| Hospital | 3.6 % | 6.7 % |
| School campus | 6.1 % | 8.1 % |
| Graveyard | 1.5 % | 3.3 % |
| Farmyard | 5 % (barn + houses nearby) | 2.2 % |
| Kitchen | 2.9 % | 3.2 % |
| Frontier (wall, towers, gate yard) | 6.4 % | 8.9 % |
| Outside (expeditions, riders, arrivals) | 9.2 % | 5.9 % |

Biggest standing group outside meals ≤ 12 (10 on seed 7); the commons averages 11 people outside meal times. Loop counts in one 12-hour day (seed 7): 150 harvests, 76 deliveries, 78 cart trips, 15 pots cooked / 13 served; 37 sales, 18 restocks, 8 pack-ups; 145 practice shots, 13 laps, 2 formation marches; 9 groomings, 5 trough fills, 6 tack-ups, 3 rides (all came back chased); 30 forge pieces, 12 carpentry jobs, 5 wagon sessions; 8 houses damaged, 4 scaffolds, 12 patches, 4 houses finished, 10 sandbag top-ups; 26 check-ups, 2 convalescents; 12 lessons, 8 garden sessions, 186 ball kicks, 2 stories; 6 pig feeds, 10 eggs, 3 milkings; 8 graveyard visits, 6 tending.

### Milestone 6 tests

| Command | Proves | Last result |
|---|---|---|
| `node tests/holdfast-community.mjs [seed]` | 36 checks: ≥ 11 community zones busy (≥ 1.5 people on average), no zone > 25 %, fields ≤ 18 %, commons ≤ 12 outside meals, no standing group > 12; food chain (harvest → wheelbarrow/handcart → granary/kitchen/market, cooking needs deliveries — starvation test), market (setup/restock, sales, stock rises and falls, pack-up in the evening, closed at night), training (range, laps, formations; ≥ 4 people on average), **alarm: training stops within 20 s and reserves defend**, stable (feed, brush, tack, lead, muck), rides out and back, workshop (forge, carpentry, wagon, gear), construction (damage → scaffold → patches → finished; reinforcement; **more repairs after an attack**), hospital (check-ups, convalescents, rounds, linen; **an injured settler is fetched with a stretcher, lies on a cot and heals**; ≥ 3 people there on average), school (lessons, garden, ball game, stories), farmyard (pigs/chickens/goats in their pens, feeding, eggs, milk), graveyard (visits, caretaker; **a death adds a fresh grave and a gathering**), frontier, 2 game days (no NaN, stalls closed at night, repairs do not pile up, horses never left outside, rides every day, population viable, traders pack up), deterministic | **PASS** on seeds 7, 13, 21, 29, 37, 45 |
| `node tests/holdfast-life.mjs 1200 [seed]` | milestone 5's 36 checks on the new layout | **PASS** on seeds 7, 13, 21 |
| `node tests/holdfast-sim.mjs 3600` | 21 map + 3-day combat checks (map expectations updated: ≥ 38 homes, 8 civic sites incl. the stable) | **PASS** |
| `node tests/holdfast-warm.mjs 20` | warm start | **PASS** (20 seeds) |
| `node tests/holdfast-browser.mjs`, `node tests/holdfast-flow.mjs` | page boots with 0 errors, gallery + Saigon smoke, UI flow | **PASS** (both) |
| `node tests/holdfast-bench.mjs` | real-time render cost through DevTools (software GL) | 1080p **59.4 fps**, loop JS 7.5 / 12.8 ms median / p95 (milestone 5: 7.3 / 12.1); 720p 59.6 fps, 1.1 / 2.7 ms; phone 59.8 fps, 0.6 / 1.3 ms; 60-strong attack at 1080p 59.6 fps in one run and 46.2 fps (11.6 / 14.7 ms) in a second run on the same machine — software rendering here is noisy |
| `node tests/holdfast-mapdump.mjs` | top-down character map of the layout (diagnostic) | — |

Screenshots were taken in headless Chrome to check each zone, the stall goods, horses, pigs, carts, scaffolds and the night spirits. **Stills do not prove behaviour** — that evidence is the simulation tests above. Nobody has watched the new zones live at 60 fps in a real browser yet.

### Remaining limitations / rough spots

- Fences and pens are visual: rails do not block walking, so a groom can step "through" a rail on the way to a horse (horses themselves stay inside).
- Horses are side-view sprites (left/right facing only); riders are drawn sitting on the horse without a dedicated riding pose. A rider who is hurt keeps the saddle (no falls).
- The pushed handcart is a separate sprite placed in front of the person; around corners it can briefly sit beside them.
- Scaffolds, patches and roof tarps sit on the house's front face only (the lower-left side), so a repair on a house seen from behind is less readable.
- The wagon in the workshop yard always shows a missing wheel; repair progress is tracked but the sprite does not change.
- Medical tent, triage cots and the outdoor class are small at the default zoom; they read best one zoom step in.
- Some loops are rare on unlucky seeds (a graveyard visit or a story may not happen in a given afternoon); the tests use day-level minimums and 6 seeds.
- Rain pauses outdoor school and market errands (people stay on porches), as in milestone 5.
- Simulation cost rose to ~0.4-0.7 ms per 0.1 s tick (was 0.3-0.4), still far below a frame budget. The attack scenario's frame rate varied between runs (59.6 and 46.2 fps on software GL); not measured on a real GPU or a phone.
- `node tests/holdfast-browser.mjs --bench` (the virtual-time benchmark) returns no result in this Chrome build — also on the milestone 5 code — so the numbers above come from `tests/holdfast-bench.mjs`. The benchmark now reports its own errors instead of failing silently.
- The 'busy zones' and loop counts are day-level averages; any single minute can look quieter (e.g. during a long alarm the training ground empties because the reserves are on the wall, which is intended).
