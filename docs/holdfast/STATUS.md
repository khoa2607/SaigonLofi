# Holdfast — Implementation Status (Current era MVP + PAST timeline, seamless switching)

Branch `design/holdfast-world`. **Not merged to `main`.** CURRENT and PAST are playable timelines (the PAST tab rebuilds the same valley in the age of dinosaurs, see *Milestone 8* at the end); FUTURE is still a "soon" tab.

## How to run

```bash
python -m http.server 8765        # or serve.bat, from the repo root
```

| Open | What you get |
|---|---|
| http://localhost:8765/ | Lofi Worlds gallery → **Holdfast** card (bottom right) opens the world in a frame; the radio keeps playing |
| http://localhost:8765/holdfast/ | Holdfast standalone (direct testing) |
| `holdfast/index.html` via `file://` | Works too (YouTube needs http, as in Saigon) |

**URL parameters** (testing/screenshots): `seed`, `pop` (residents), `hour`, `time=auto|morning|noon|dusk|night`, `wx=auto|clear|rain|wind`, `season=auto|spring|summer|fall|winter`, `danger=calm|standard|grim`, `cam=default|gate|settlement|wall|market|commons|ruins|fields|east|west|exp|training|stable|hospital|school|graveyard|church|river|farmyard|workshop`, `zoom`, `warp=<seconds>` (fast-forward before the first frame), `attack=<n>` (force a major attack), `exp=1` (start an expedition), `clean=1` (hide UI), `test=1` (in-page self-test), `bench=1` (render benchmark), `era=past|current` (the timeline; remembered like the other settings).

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


## Milestone 7 (step 1) — zombie redesign, grand church, schoolhouse, riverside graveyard, river life + supply boats

Current era only (Past/Future still "soon"). Shared Saigon UI/audio untouched; Saigon files untouched. Art stays in the approved Holdfast pilot style (code-drawn, cocoa/dark ink outline, warm grade).

### Zombies from `holdfast/zombie.webp`

The reference (an 800×800 sheet: 5 × 7 cells, 35 chibi zombies) was used as a **style and content reference only** — no pixels are copied and the file is not modified. Each cell was catalogued and grouped into **23 archetypes**; every archetype is drawn by code in `hf-art.js` (`ZTYPES`, `drawZombie`) into the same 8-pose × 4-row sheet the people use, so walking, attacks (arm-up / lunge), facing, mirroring and corpses (`hfLying`) run through the existing animation system unchanged.

Shared language taken from the sheet: a big round head (≈ 45 % of the height), dark ink outline, green / olive / grey / pale skin, pale yellow eyes in dark sockets, an open mouth with teeth, arms reaching forward, torn and stained clothes with ragged hems, scuffed shoes. No gore (stains are muted, no wounds).

| Archetype | From the reference | Archetype | From the reference |
|---|---|---|---|
| pale | grey skin, grey shirt, short grey hair | hunchgrey | hunched grey walker |
| prisoner | white tank top, handcuff chain | cowboy | brown fedora / cowboy hat, tan shirt |
| longblack | long black hair (woman) | messy | messy brown hair, torn grey shirt |
| bald | classic bald green walker | small | small (child-sized) zombie, orange tee |
| wrapped | bandaged head + chain | beanie | beanie / headband, hunched |
| crawler | crawls on hands and knees | lanky | tall, thin, hunched |
| stitched | stitched scar on scalp and shirt | spiky | spiky ginger-brown hair |
| wildwoman | wild black hair, blue skirt | fat | bloated, shorts |
| worker | brown work jacket | afro | big dark hair, navy jacket |
| bob | brown bob (woman) | ginger | orange bob (woman) |
| elder | white hair tufts, hunched | legchain | chain dragging from the ankle |
| creeper | low crouch | | |

Look selection uses exactly the same number of seeded draws as before, so simulation behaviour stays reproducible; crawlers / creepers are never "runners" (their speed is capped, a runner gets the lanky look instead).

### Church

`civicModel('church')` rebuilt as the community's grandest building: footprint 58 × 92 (was 34 × 54, **2.9×**), a stone nave with a steep slate roof, transept with a rose window, apse, buttresses, tall arched stained-glass windows that glow at night, and a front **bell tower** (great arched door, rose window, clock, open belfry with a bell, corner pinnacles, slate spire, gold cross at **122** units — the tallest structure in the community; the hospital is next at ~63). Stone steps, plaza, two lamps, benches and three prayer spots in front; elders sometimes kneel there (`pray`). The alarm shelter is still the church door.

### School

A two-storey brick **schoolhouse** (70 × 34, was 56 × 30 single storey): two rows of classroom windows, a white columned portico with steps, a big blue **SCHOOL** sign between the floors, a clock in the pediment, a bell cupola with a weathervane on the ridge; in the yard a **flagpole**, a **SCHOOL** entrance arch and a bike rack. The playground, outdoor class, garden beds (moved slightly east to make room) and ball field keep their behaviour.

### Graveyard

Moved from the centre-left (beside the church) to the **west edge of the community, beside the river** (design ≈ (116, 366), the nearest water tile is 4 units outside its fence) and doubled: **96 × 64 (6,144 sq units, was 64 × 44 = 2,816 → 2.2×)**, **34 graves** (was 20), central path, memorial stones, three lanterns, two benches, three trees, six mourning spots, three caretaker spots. Visits with flowers, the caretaker, burials (a fresh grave + a small gathering — gatherers now run and stay a shorter time, because the walk is longer) and the **night spirits** (they read `HF.graveyard`, so they follow it) all work in the new place. The site table keeps 38 homes.

### River life

- **Bank spots** are found automatically (walkable settlement tiles touching open water, each remembering which way the water is): 3 bathing / washing places (south-west by the fields, south by the main dock, south-east) and 4 quiet fishing spots.
- **Bathing** (warm seasons, mornings and evenings): residents wade in waist-deep (the sprite is cut at the waist, shifted into the water, with ripples and splashes).
- **Washing** (daytime): kneeling at the edge, swishing a coloured cloth in the water (splashes).
- **Fishing**: fishers now also fish from the bank (30 %), and every fishing person shows a **line from the rod tip to a red-and-white float** that bobs and dips before a bite.
- **Laundry**: part of the old "hang washing in the yard" chore now starts with washing the clothes at the river, then hanging them at home.
- A small **river director** sends one idle resident (sitting / chatting / playing, never guards, never on an errand) to the river every ~18–35 s of game time, at most 6 at once, never in rain or an alarm. River life and boats draw from their **own seeded stream** (`HS.R2`), so the milestone 5/6 random sequence is disturbed as little as possible.

### Supply boats

A boat lane runs up the west arm, round the bend just off the settlement bank and out along the east arm. Every 50–110 s of daytime a boat may set out (never more than **2** on the water): a rotation of **medical supply boat → cargo sampan → medical → fishing boat**. All hulls are sampans with painted bow eyes and a boatman punting at the stern.
- **Medical boats**: white hull with a red stripe, a white canopy with a big **red cross** on both sides and the roof, a red-cross flag and red-cross crates. They pull in alongside the dock nearest the hospital; a **medic walks down, takes the crates and carries them to the hospital supply point** (+3 medicine), then the boat backs out and leaves.
- **Cargo sampans** (woven bamboo canopy, crates, sacks) sometimes moor at the main dock; a trader / technician unloads them into the yard store.
- **Fishing boats** (basket, net, lantern) just pass by.

### Small fixes found on the way

- House repairs could take planks the store no longer had (two builders, one plank) and drive `mat` below zero; they now only take what is there.
- The convalescent picker now chooses fairly among sitters (it used to take the first resident who won a 30 % draw, so a day could easily pass with one convalescent).
- Both herders could start the same pig-feeding round at once (the chickens then went unfed for hours); only one takes it now.
- The graveyard caretaker (an elder) gets a daytime round at most every ~150 s of game time; with the graveyard on the far edge, the random pick alone sometimes only sent them out at dusk.
- `tests/holdfast-community.mjs` alarm check: the bell now rings once training is actually under way (the check is about the response; before, it depended on training happening at one exact second).

### Measured (Node, accelerated time, `node tests/holdfast-m7.mjs <seed>`, summer day 06:30 → 21:30)

| Seed | bathe | wash | bank fishing (peak at once) | boats (max at once) | medical boats / deliveries | cargo | boats on water or at a dock | graveyard visits | zombie looks seen |
|---|---|---|---|---|---|---|---|---|---|
| 7 | 10 | 7 | 11 (3) | 5 (2) | 2 / 2 | 2 | 645 / 645 | 15 | 23 / 23 |
| 13 | 10 | 8 | 12 (2) | 5 (2) | 2 / 2 | 2 | 637 / 637 | 9 | 19 |
| 21 | 7 | 8 | 14 (2) | 4 (2) | 2 / 1 | 1 | 502 / 502 | 6 | 22 |
| 29 | 7 | 7 | 16 (3) | 6 (2) | 3 / 2 | 1 | 716 / 716 | 12 | 20 |
| 37 | 10 | 10 | 13 (3) | 5 (2) | 2 / 2 | 2 | 656 / 656 | 10 | 22 |
| 45 | 10 | 3 | 16 (4) | 5 (2) | 2 / 2 | 2 | 638 / 638 | 14 | 21 |

Layout (seed-independent): church 58 × 92 = 5,336 sq units (old 34 × 54 = 1,836, **2.9×**), top of the cross 122 units (next tallest 62.8); schoolhouse 70 × 34, 62.8 units to the weathervane; graveyard 96 × 64 = 6,144 (old 2,816, **2.2×**), 34 graves, centre at design (≈ 116, 366), 4 units from open water; 38 homes, nothing overlaps the graveyard or the church. "Zombie looks seen" counts the archetypes walking around in the first 150 s (of 23).

### Milestone 7 tests

| Command | Proves | Last result |
|---|---|---|
| `node tests/holdfast-m7.mjs [seed]` (new) | 26 checks: 23 zombie archetypes, each drawing all 16 frames, front ≠ back, animated walk; ≥ 14 archetypes in the world; crawlers never run; church ≥ 2.5× and tallest; two-storey school + flagpole / arch / bike rack; graveyard ≥ 1.9×, ≥ 30 graves, west edge beside the water, inside the settlement, no clashes; ≥ 38 homes; a summer day: bathing ≥ 3, washing ≥ 3, bank fishing, 4+ boats never > 2 at once, ≥ 2 medical boats with ≥ 1 delivery, cargo boats, boats always on water / at a dock, graveyard visits, a death adds a grave inside the new graveyard, determinism | **PASS** on seeds 7, 13, 21, 29, 37, 45 |
| `node tests/holdfast-community.mjs [seed]` | milestone 6's 36 checks on the new layout (alarm check now waits for training to be under way) | **PASS** on seeds 7, 13, 21, 29, 37, 45 |
| `node tests/holdfast-life.mjs 1200 [seed]` | milestone 5's 36 checks | **PASS** on seeds 7, 13, 21 |
| `node tests/holdfast-sim.mjs 3600` | 21 map + 3-day combat checks | **PASS** |
| `node tests/holdfast-warm.mjs 20` | warm start | **PASS** (20 seeds) |
| `node tests/holdfast-browser.mjs` | in-page self-test, gallery + Saigon smoke | **PASS** (Chromium, run as root through a `--no-sandbox` wrapper set in `CHROME`) |
| `node tests/holdfast-flow.mjs` | UI flow | **PASS** except the two YouTube checks: youtube.com is not reachable from the test container (proxy refuses it), unrelated to this milestone |
| `node tests/holdfast-bench.mjs` | frame time, software GL, same container for both | 1080p **57.1 fps**, loop JS 9.4 / 12.6 ms (median / p95); milestone 6 code on the same machine: 57.3 fps, 8.9 / 11.5 ms. 720p 58.8 fps (1.5 / 2.8 ms), phone 58.2 fps (1.0 / 1.9 ms), 60-strong attack 57.5 fps (9.3 / 13.6 ms; the milestone 6 run here got 32.2 fps, so this number is noisy) |

### Screenshots (`docs/holdfast/screenshots/`, headless Chrome 1280 × 800, `seed=7`)

| File | What |
|---|---|
| `15-m7-zombie-sheet.png` | All 23 archetypes, front + back, walk / attack / talk frames (straight from `hfSheet`) |
| `16-m7-zombies-ingame.png` | A march group in the woods outside the wall after a forced attack (`attack=40`), zoom step 1 |
| `17-m7-church.png` | The new church with bell tower, spire and prayer plaza |
| `18-m7-school.png` | Schoolhouse, SCHOOL arch, flagpole, bike rack, outdoor class, playground |
| `19-m7-graveyard.png` | The riverside graveyard (17:30) with visitors and the caretaker |
| `20-m7-river-boats.png` | A red-cross medical boat alongside the hospital dock, a washer and a bank fisher (the boat was placed at the dock for the picture; its arrival is what the tests measure) |

Stills do not prove behaviour; the numbers above do.

### Remaining limitations

- The zombies follow the reference's look but at the people's 28 × 52 sprite size; small details from the sheet (individual teeth, stitches, chain links) read as 1–2 pixel marks, best one zoom step in.
- Crawlers and creepers use the existing animation rows (no dedicated crawling cycle beyond the limb swap), and corpses use the generic lying pose.
- The far (south) bank is densely wooded: from the default camera, trees can hide part of a boat or a bather; the near bank is clear.
- Bathers are drawn waist-deep by cutting the sprite; there is no swimming animation, and nobody bathes in rain, at night or in winter.
- Boats are side-view sampans with 2 facings (mirrored); the boatman stands on the stern and can overlap the canopy edge when the boat turns. Boats do not interact with zombies.
- The community checks are day-level counts on 6 seeds and still depend on the random sequence; milestone 7 changed that sequence (new layout, longer walks), and two loops (chicken feeding, the graveyard caretaker) needed small scheduling fixes to stay above their minimums.
- Not watched live at 60 fps on a real GPU or phone; frame time was measured with software GL (below).

## Milestone 8 — the PAST timeline (same valley, the age of dinosaurs)

Design decisions (written before coding): `docs/holdfast/PAST-DESIGN.md`. FUTURE is still a "soon" tab. Saigon, the gallery and the shared UI/audio modules are untouched.

### How it is built

- **One flag, `HF.era`** (`'current'` | `'past'`), set by `hfBuildMap(seed, era)` before anything else. The **PAST** tab (and `?era=past`) shows that age: in milestone 8 by reloading the frame, since **milestone 8.1** by a seamless in-page crossfade (`?era=` only chooses the timeline a fresh page starts in); the choice is remembered like the other settings and the gallery's radio keeps playing. Every era branch checks the flag, so Current's code paths, random sequences and tests are unchanged (the Current suites below were re-run).
- **The same valley:** the map seed, geography, nav grid, wall chain, towers, gate, lots, civic sites, fields, docks, POIs and threat routes are generated by the same code; `tests/holdfast-past.mjs` checks that the tile/zone/walk grids hash identically to Current.
- **New files (DOM-free):** `holdfast/hf-past-art.js` (models, props, palisade, people, 15 dinosaurs) and `holdfast/hf-past.js` (map pass, dinosaur behaviour, flyers, apex, herbivores, traps, fire, fire-keeper, beacons, dance, arrows). Existing files only gained small guarded hooks (`civicModel`, `suburbHouse`, wall / tower / gate / grave / cart / boat / rail boxes, `hfLook`, the `ev*` costume hooks, `hsAddZ`, `hsZ`, `hsShoot`, `hsHitZ`, `hsWild`, `lfTick`, the renderer and audio).
- **Reused unchanged:** schedules, task chains, stores, crops, hauling, cooking, healer/school/farmyard/burial loops, market, riders, expeditions, rescues, arrivals, river life and boats, weather, time, seasons, camera, the whole shared UI.

### What changed in the Past

| Current | Past |
|---|---|
| Suburban houses | Timber-and-wattle houses on stone footings, steep hip thatch, smoke holes, hide door flaps, painted ochre bands, antlers, hide awnings + clay pots, lean-to woodsheds |
| Barracks | Hunters' longhouse (log walls, antler crest, painted hide shields) |
| Hospital + med tent | Healer's lodge (two-tier thatch, herb bundles drying under the eaves, a green painted hand), healer's hide tent, fur pallets, herb baskets |
| Church (tallest) | **Ancestor Hall** with a carved, painted **totem spire** (6 stacked faces, wings, antler crown; 122 units, still the tallest) and the **sacred fire** bowl in front |
| Schoolhouse | **Story Lodge** with painted hunting-scene hides, feathered posts, a sun disc; the arch, totem and practice spears in the yard |
| Workshop + forge | Open craft hall, knapping hearth, flat working stones, hide-stretching frame, a big travois |
| Stable + horses | Beast pen; the horses are **ridgebacks** (small crested herbivores) — the riders still scout |
| Kitchen / mess tent / market | Cookhouse with a roasting spit, hide canopy, barter mats under hide awnings |
| Graveyard | Burial ground: cairns, standing stones, carved posts, pebble rings, wattle fence (night spirits kept) |
| Water tower / turbines / greenhouses / lamps | Great signal beacon, totem poles, fish/herb drying racks, **torches** |
| Cars, bus, power poles, gas station, ruins | Boulders, fallen logs, a giant fossil skeleton, totems, a rock shelter, abandoned huts, rock stacks |
| Sheet-metal wall, towers, gate | Sharpened-log **palisade** on a stone footing, thatched watch platforms with **fire beacons**, a log gate under an antler lintel |
| Hedgehogs | **Stake traps** (they wound dinosaurs) |
| Sampans / red-cross boats | Dugout canoes, trade rafts, the **healer's canoe** (herb baskets, a green pennant) |
| Asphalt / paving | Earthen paths and packed earth; tree ferns and cycads among the conifers, ~220 low ferns |
| Settlers | The tribe: hides, furs, fur trims, belts + pouches, bead/bone necklaces, headbands with feathers, feather crowns (storytellers, some elders), face paint (hunters), fur hoods in winter; **spears, bows, torches**, stone hammers, scrapers, clay pots; no guns, no helmets, no modern signs |

### Dinosaurs (all code-drawn, side view, 9 poses: stand, 4-frame walk, sniff, attack, roar, down; 2-3 colour morphs each)

| Category | Species | Behaviour in the sim |
|---|---|---|
| small | Compsognathus | Arrive in threes, skitter about the forest edge, never worry the palisade |
| pack | Velociraptor, Utahraptor | Packs behind a leader (60 % of spawns), fast, the commonest wall attackers |
| stalker | Dilophosaurus | **Circles and watches** a target for 5-9 s before closing in (frill fans out on attack / roar) |
| charger | Pachycephalosaurus, Carnotaurus, Triceratops | **Sprint** the last 90 units to the wall or gate and **ram** (×1.6 damage on the first hit) |
| breaker | Ankylosaurus | Slow, armoured, seeks **weak or damaged sections** |
| heavy | Allosaurus, Spinosaurus | Lone hunters, heavy wall damage, hard to stagger |
| apex | Tyrannosaurus rex | Rare (one at a time), **roars** every 18-40 s (heard far, scatters the herds, draws the curious), sometimes goes for the palisade; leads sieges |
| flyer | Pteranodon | Come in over the river from beyond their target, **scout** (circle), **swoop** on the pens or on people in the fields, climb away, leave the way they came; driven off after 3 hits |
| herbivore (wildlife) | Parasaurolophus (herds, in place of the deer: hunted by raptors and hunters), Stegosaurus, Brachiosaurus | Graze and wander far out in the wilds, never inside |

Stats per species (`DSTAT` in `hf-past.js`): health 1 (compy) to 26 (T-rex), speed, sight, bite, attack cooldown, stagger, wall damage. Night: the smaller hunters near a lit beacon, torch or torch-carrying patrol may **break off** (fire fear).

### Fire

Torches on posts (16, lit at dusk by the **fire-keeper's round** — a trader / adult walking from the nearest unlit torch to the next, raising a torch — any still dark light themselves at 20:36, out in the morning), house campfires (13), the communal fire on the green, the sacred fire (always), the cookhouse spit, the knapping hearth, **10 tower beacons + the great beacon** (blazing at night and in every alarm, bigger in an alarm), **torch-carrying night patrols**, **fire arrows** at night. Flames are live, depth-sorted sprites with their own glow in the night light pass.

### New loops

Fire-keeper torch rounds · the **evening fire dance** around the sacred fire (up to 10 dancers, jumping / arms raised, with a **drummer**) · elders feeding the sacred fire by day · beacons · stake traps · pteranodon raids on the pens · herbivore herds · hunting parties (expeditions) that bring back meat, hides, flint, herbs, berries or eggs · journal entries in the Past's words (VI/EN).

### Measured (`node tests/holdfast-past.mjs <seed>`, 15:00 → 09:50 next morning with one forced major attack, then 08:00 → 18:00)

| Seed | hostile species | packs | charges / roars | palisade damage | arrows (fire) | kills | trap hits / fire scares | beacon s | keeper rounds / lit | dances (peak) | flyers / swoops | busy zones |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7 | 12 | 53 | 11 / 4 | 23 (4 categories) | 1544 (754) | 252 | 17 / 49 | 656 | 3 / 16 | 6 (5) | 4 / 6 | 12 |
| 13 | 12 | 47 | 5 / 9 | 27 | 1431 (634) | 233 | 18 / 10 | 638 | 3 / 16 | 9 (9) | 4 / 5 | 12 |
| 21 | 12 | 54 | 16 / 12 | 45 | 1535 (596) | 270 | 35 / 30 | 649 | 3 / 16 | 8 (8) | 3 / 6 | 12 |
| 29 | 12 | 44 | 20 / 7 | 35 | 1487 (584) | 237 | 28 / 48 | 758 | 3 / 16 | 9 (9) | 4 / 4 | 12 |
| 37 | 12 | 54 | 7 / 6 | 33 | 1422 (551) | 276 | 36 / 109 | 715 | 3 / 16 | 9 (9) | 4 / 4 | 12 |
| 45 | 12 | 51 | 6 / 11 | 23 | 1463 (613) | 240 | 15 / 21 | 699 | 3 / 16 | 9 (9) | 4 / 5 | 12 |

"lit" = torches burning at 21:00 (all 16 on every seed; by hand plus the 20:36 fallback); all 16 out by 09:00. No settler is ever drawn hurt: the fallen are covered as in Current, dinosaurs fall and fade. Deaths per evening: 0-2. Alarm share of a 20-minute day (no forced attack): 11-27 % (Current: 6-14 %).

### Tests

| Command | Proves | Last result |
|---|---|---|
| `node tests/holdfast-past.mjs [seed]` (new, 41 checks) | identical valley grids and layout; every prop kind and civic building has prehistoric art; the hall is tallest; huts, palisade, platforms; fires, traps, dance ring, ferns; every resident prehistoric, every role draws, bows instead of rifles; 15 species × 9 poses, animated, 9 categories, size order; dinosaurs replace the infected; herbivores; an evening of packs, charges, roars, palisade damage, arrows / fire arrows (no tracers), alarm + kills, traps, fire fear, beacons, the torch round, the dance + drummer, flyers scouting/swooping, herbivores outside, stability, determinism; a working day over ≥ 10 zones with the reused loops, crops, meals, the sacred fire; Current untouched | **PASS** on seeds 7, 13, 21, 29, 37, 45 |
| `node tests/holdfast-community.mjs [seed]`, `holdfast-m7.mjs [seed]` | Current timeline, milestones 6 and 7 | **PASS** on seeds 7, 13, 21, 29, 37, 45 (both) |
| `node tests/holdfast-life.mjs 1200 [seed]`, `holdfast-sim.mjs 3600`, `holdfast-warm.mjs 20` | Current timeline, milestones 5, map + combat, warm start | **PASS** (seeds 7, 13, 21 / PASS / 20 seeds) |
| `node tests/holdfast-browser.mjs` | in-page self-test for **Current and Past** (`?era=past`: statics, houses, zones, pan, zoom, day/night, weather, time modes, people, no stray dinosaurs inside, no console errors), gallery + Saigon smoke | **PASS** (Chromium through a `--no-sandbox` wrapper set in `CHROME`, the container runs as root) |
| `node tests/holdfast-flow.mjs` | UI flow | **PASS** except the two YouTube checks (youtube.com is not reachable from the test container), as in milestone 7 |
| PAST tab in the gallery (Playwright script, not committed) | gallery → Holdfast → PAST → CURRENT (milestone 8: the frame reloaded; **superseded by milestone 8.1**, now covered by `tests/holdfast-transition.mjs`) | works both ways; FUTURE stays "soon" |
| `node tests/holdfast-bench.mjs [--era=past]` (new `--era` flag) | frame time, software GL, same container | **Past** 1080p **58.4 fps**, loop JS 6.8 / 8.8 ms (median / p95); 720p 58.2 fps; phone 57.6 fps; 60-strong attack 56.1 fps (9.4 / 13.4 ms). **Current** in the same run: 58.4 fps (7.6 / 10.6 ms), 59.0, 57.4, 56.1 fps (8.4 / 12.9 ms). The common dinosaur sheets are baked before the first frame (without that: 56.5 fps, p95 16.5 ms) |

### Screenshots (`docs/holdfast/screenshots/`, headless Chromium 1280 × 800, `seed=7&era=past`)

| File | What |
|---|---|
| `21-past-default.png` | The default view at noon: palisade, thatched watch platforms, the gate, the Ancestor Hall's totem spire, the healer's lodge, barter mats, the green |
| `22-past-attack.png` | A forced attack (`attack=40`): raptor / dilophosaur / pachycephalosaur packs moving through the fern forest; stegosaurs beyond |
| `23-past-night-fire.png` | 20:48: the fire dance around the sacred fire in front of the totem, torches lit by the fire-keeper |
| `24-past-trex.png` | A T-rex with a raptor, a triceratops and an ankylosaur at the frontier; an archer on the platform, spear-carriers at the gate (placed for the picture) |
| `25-past-ptero.png` | Pteranodons circling over the pens and the fields (placed in the circling state for the picture) |
| `26-past-healer.png` | The healer's lodge with drying herbs and the painted hand; huts, cookhouse, the craft yard |
| `27-past-storylodge.png` | The Story Lodge, its arch and totem, the children's story circle, the burial ground beyond |
| `28-past-burial.png` | The burial ground by the river: cairns, standing stones, carved posts, wattle fence |
| `29-past-river.png` | The healer's canoe alongside the dock (placed there for the picture), fields, the river bank |
| `30-past-herbivores.png` | A brachiosaur, a stegosaur and parasaurolophus in the wilds by the river (moved together for the picture) |
| `31-past-dino-roster.png` | All 15 species, two colour morphs each, stand / walk / attack / roar frames (straight from `dinoGrid`) |

Stills do not prove behaviour; the numbers above do.

### Remaining limitations (honest list)

- **Dinosaurs are side-view sprites** (facing left or right, like the horses), not 4-direction isometric views; the T-rex and brachiosaur are big sprites and can sort awkwardly against tall trees and huts. Corpses fall on their side and fade; there is no dedicated death animation beyond the "down" pose.
- **Thatch** is built from stacked layers and reads as stepped straw up close; buildings reuse the Current footprints, so some huts are larger than a real prehistoric hut would be.
- **The fire-keeper** is one trader/adult; the bell can still interrupt a round (the torches then light themselves at 20:36). People do not light their own house campfires — those burn on a timetable.
- **Flyers** do not carry anything off (no gore): a swoop scatters the pen or startles (and rarely hurts) a person. Archers drive them off after three hits.
- **Fire fear** affects only the small and mid-size hunters near a lit beacon, torch or torch-carrying night patrol; the big ones ignore it.
- **Balance:** the Past is busier than Current (≈ 250 dinosaurs brought down per simulated evening, alarm 11-27 % of the time vs 6-14 %). The counts are seed-dependent; the tests use day-level minimums on 6 seeds.
- **Reused systems that still carry their Current logic:** crops (planted / harvested as before, early grains and tubers in look only), the market, the ball game, the beast pen (the ridgebacks follow the horse routines and are drawn side-on), the boats' lane and moorings.
- **Audio** for the Past (bowstrings, roars, a screech, the war horn and drum) is synthesised and tuned in code only — not listened to in a real browser.
- **Not watched live** at 60 fps on a real GPU or a phone; frame times come from software GL in the test container.
- FUTURE is not started.

## Milestone 8.1 — dinosaur corpses fixed, seamless PAST ↔ CURRENT switching

Focused fix + architecture pass. Artwork, map, community and Saigon untouched (`js/`, `css/`, root `index.html` unchanged); FUTURE not started. New files: `holdfast/hf-world.js`, `tests/holdfast-corpse.mjs`, `tests/holdfast-world.mjs`, `tests/holdfast-transition.mjs`.

### 1. Dinosaur corpses: root causes and fix

Observed: dead dinosaurs blinked and never went away. Reproduced in Node first (a small dinosaur's `stT` stayed 0.3–0.5 for its whole corpse life; one more hit on a corpse moved `corpseT` from 32 s back to 105 s), then fixed. Two independent causes in the shared death code:

| # | Root cause | Where | Effect |
|---|---|---|---|
| 1 | A fatal hit also sets the **stagger timer** `stT`. Dead entities returned from `hsZ` before it counted down, and `dinoDraw` sets `blink` whenever `stT > 0` (for dinosaurs under 80 px). | `hsHitZ` → `hsZ` → `dinoDraw` | every small dinosaur (compies, raptors, flyers) blinked for its whole corpse life; the big ones escaped only by their size |
| 2 | `hsHitZ` **re-armed the corpse timer (`corpseT = 90–150 s`) on every hit**, including hits on a body that was already dead (several defenders target the same animal within one tick; traps; melee). | `hsHitZ` | a corpse near the fighting could be refreshed again and again and never expire |

Also found and fixed on the way: the infected's fade was computed but **never applied** (the draw loop had no alpha), dinosaurs had no fade at all (they just vanished), a shot flyer teleported to the ground, and every species had the same lifetime.

**New lifecycle** (`hsKillZ`, `hsDeadTick`, `corpseAlpha` in `hf-sim.js`; drawing in `hf-render.js`): alive → **dying** (a short collapse: a knock-back slide while the sprite rears (pose 7) and drops to the dead pose (8); a flyer *falls* until it lands) → **stationary corpse**, fully opaque → **fade** over the last 6 s (real per-sprite alpha, also on its ground shadow) → **removed** from `HS.zombies`. `hsKillZ` is idempotent: a hit on a body does nothing (no stagger, no kill count, no timer). `corpseT` is now the *remaining* life. Lifetimes scale with size: `(38 + 7 × hp) s ± 12 %`, clamped to 40–210 s (compy ≈ 46 s, raptor ≈ 70, carnotaur ≈ 97, triceratops ≈ 115, T-rex ≈ 204); infected keep 90–150 s. A dinosaur that flies away is removed at once (`gone`), not left as a body. Dead entities were already excluded from the targeting grid and from separation, so no body blocks a path (0 dead entities in the grid over an hour of fighting).

### 2. Seamless timeline switching: architecture

Previously the PAST/CURRENT tab did `location.replace(...)`: the iframe reloaded and the loading card showed. Now nothing reloads. **Two lazily created world contexts share one renderer** (`hf-world.js`):

- The simulation, map and render code address three global objects: the map `HF`, the simulation `HS` and the renderer `HR`. Each timeline owns a **context**: a snapshot of `HF`, `HS` and the *per-world part* of `HR` (`HR_WORLD_KEYS`: statics, ground chunks, sprite sheets, lights, … — the camera, canvas, zoom and weather particles stay shared). **Exactly one context is installed** in the globals (`HWD.cur`); `hwEnter(era)` swaps another in (a few dozen pointer copies; properties are never deleted, so the objects keep one stable hidden class). Factories `hfNewHF()`, `hsNewHS()` and `hrNewWorld()` create fresh state. No code was duplicated.
- **Preparation in the background.** `hwPrepare(era)` builds the destination in **short time slices** (generators that `yield` when `slDue()`) between frames, while the viewer keeps watching the other timeline: map → population (warm start) → baking the statics → sprite sheets for every actor → the ground chunks of the first frame. The slice budget follows the measured frame cost (3–9 ms). `hfBuildMap`, `hsInit`, `hrBuildStatics` and `hrBakeChunk` keep their synchronous signatures (thin wrappers), so the tests and the first boot are unchanged. The idle ground baker used to bake a whole 512×512 chunk (up to 170 ms) in one task; it now works in slices too, and that was the real source of the stutter during a switch.
- **Crossfade.** When the destination is ready, `hwActivate` makes it the timeline on screen (it adopts the viewer's environment), the last frame of the leaving timeline is copied to an overlay canvas (`#cfade`), and for 1.2 s **both timelines are stepped and drawn**: the arriving one into the page canvas, the leaving one (every other frame) into the overlay, whose opacity falls with a smoothstep. Then the leaving timeline is frozen and trims its ground to what is in view.
- **State.** Each timeline's people, infected, wildlife, clock (`HS.t`), journal and walls are its own; the one in the background is **not ticked** (exact resume). The **environment follows the viewer** (like Saigon's clock across years): time of day, the time/weather/season modes and danger carry over on every switch, and a season change made while the other timeline was away is baked for it *before* it is shown.
- **One transition at a time.** `hfSwitchEra` only records the *latest request* (and shows its tab pressed at once); `hfTransitions` runs prepare → fade in a loop, so 31 rapid clicks collapsed into 2 fades in the test. A request withdrawn while preparing (clicked back) ends without a fade. A frame hidden by the gallery waits (no spinning) and fades when it is back.
- **Untouched by a switch:** the camera (shared `HR.cx/cy/zoom`; the valley has the same coordinates in both ages), the music and YouTube (never called), the AudioContext, every listener, the single `requestAnimationFrame` chain and the single `setInterval`.

**Bugs the new tests found while building this** (all fixed): (a) the spatial hashes `SHZ/SHP` are module-level and rebuilt only at the start of each tick, but a new world's warm start read them first, so settlers in one timeline saw the *other* timeline's infected (same coordinates) and a sliced build differed from a synchronous one; they are now reset whenever a world is installed. (b) `bakeCached` keys had no era (`'b' + id + season`), so after an in-page switch a Past house would reuse the Current house's sprite; the era is now part of the key. (c) A restock quantity (`T_n`) lived in a module-level variable shared by both worlds; it is now `HS.Tn`. (d) The flow-field cache is keyed per world.

### Measured (headless Chrome, **software rendering**, this machine)

| | desktop 1080p | laptop 768p | phone 390×844 (70 residents) |
|---|---|---|---|
| First switch: click → ready (background; the current world stays live) | 4.0 s | 3.7 s | 2.0 s |
| Switch back to an already built timeline | 0.3 s | 0.3 s | 0.2 s |
| Crossfade (1.2 s): frames drawn / p95 frame time | 47 / 30 ms | 70 / 25 ms | 71 / 25 ms |
| Whole switch: frame p95 / worst | 33 / 89 ms | 29 / 64 ms | 29 / 65 ms |
| Longest single slice | 35 ms | 36 ms | 41 ms |

The 35 ms slice is the Ancestor Hall sprite: a single `bake()` call in Saigon's untouched `core.js`, run once in the background and never during the fade. JS heap after six more round trips: 8.8 MB (was 9.0), so no leak. Steady state is unchanged: Current 1080p 59.4 fps (loop JS 7.7 / 8.9 ms median / p95), Past 59.8 fps (7.9 / 10.4 ms), 60-strong attack 59.8 / 59.2 fps (`tests/holdfast-bench.mjs`).

### Tests added / updated

| Command | What it proves | Result |
|---|---|---|
| `node tests/holdfast-corpse.mjs [seed]` (new, 33 checks, Node, deterministic) | For compy, raptor, carnotaur, triceratops and T-rex: dies once, collapses, **lies still**, stagger = 0 (no flicker), fully opaque then a **smooth monotonic fade**, then **removed**; larger = longer (46 < 70 < 97 < 115 < 204 s). 400 further hits and kills leave the timer, state and kill count unchanged; a raptor under continuous fire lives as long as an untouched one. A shot flyer falls, lands, lies, fades and is removed; one that flies away leaves no body. Infected share the lifecycle. An **accelerated game hour with real attacks** (≈1,000 kills): nothing expired lingers, nothing dead is in the targeting grid, no NaN, and **no body remains 4 minutes after the fighting stops**. Mutation-tested: re-introducing either root cause makes it fail | **PASS** |
| `node tests/holdfast-world.mjs [seed]` (new, 21 checks, Node) | A timeline prepared in slices **equals a synchronously built one** (tiles, walls, lots, props, trees, torches, people, infected, wildlife); no slice over 45 ms; the visible timeline kept ticking meanwhile. **Isolation:** the Current for 900 ticks with the Past swapped in between its ticks equals the Current alone, and the same the other way round. A timeline left behind is frozen and resumes exactly; the environment carries over; 400 rapid swaps keep the identity and key sets of `HF` and `HS`; a nonexistent timeline throws; the flow cache is per world | **PASS** |
| `node tests/holdfast-transition.mjs [--shots]` (new, 46 checks, real Chrome via CDP) | No navigation, frame navigation or reload (same document, canvas element and time origin). **No loading screen and no blank frame in any of ~250 sampled frames.** Crossfade ≈ 1.2 s with monotonic opacity and no step over 0.1. **Camera and zoom identical in every frame.** No long freeze. Exactly one animation loop (one `hfLoop` per frame). **No listener, timer, AudioContext or worker added.** Environment carried over, including a winter re-bake. The timeline left behind stays frozen for 3.5 s and resumes exactly. Music: same AudioContext, running, generator advancing, same track. **YouTube spy: 0 calls, same box.** 31 rapid clicks → 2 fades, the last request wins, never two fades, no errors. Real-renderer corpse checks (never blinks, rears then collapses, stationary, smooth fade, removed). Memory flat. **Gallery round trip:** same iframe element, 0 `load` events, same page, radio uninterrupted, sleep (no tick) and wake | **PASS** |
| `holdfast-sim`, `-past` (42 checks), `-community` (36), `-life` (36), `-m7` (27), `-warm`, `-browser`, `-flow` | Unchanged behaviour: the same results on this tree and on the previous commit (`c4e2d87`) | **PASS** (`-warm` has wall-clock checks that fail when other jobs run in parallel; it passes alone) |

Screenshots in `docs/holdfast/screenshots/`: `30-switch-fade-1…4.png` (one crossfade slowed to 6 s: the modern hospital dissolving into the thatched Ancestor Hall at the same coordinates) and `31-past-corpse.png` (a collapsed raptor with its ground shadow).

## Current/Past maintenance — river dock alignment

The three approved dock anchors and the valley geography are unchanged. Dock direction now follows the curved riverbank: west `+world-y`, centre `+world-x+y`, east `+world-x`. The centre dock is long enough to connect the main farm road to open water; the side docks extend visibly past the bank. Navigation footprints, fishing spots, supply-boat moorings and unload endpoints are derived from the same directional centre line, so residents stay on `W_DOCK` tiles and boats remain in open water. Current and Past share the corrected timber artwork and identical map/navigation geometry.

Focused validation: `node tests/holdfast-docks.mjs 7` checks both eras (dry landward connection, water outer end, continuous reachable navigation, fishing/bathing/washing spots, three art directions, open-water moorings, and forced cargo arrival → crew call → unload → departure). Before/after Current and after Past screenshots are `current-past-docks-before.png`, `current-past-docks-after.png`, and `current-past-docks-past-after.png`.

Regression result: **PASS** — `holdfast-docks`, `holdfast-m7`, `holdfast-sim 3600` (21 checks), `holdfast-past` (42), `holdfast-corpse` (33), `holdfast-world` (21), `holdfast-transition` (46, real Chrome) and `holdfast-browser` (Current/Past self-tests, gallery + Saigon smoke).

### Limitations

- **The first switch is not instant:** 2–4 s of background preparation. The figure is the spare time per frame, so a bigger screen or a busy moment is slower, but never a freeze. Nothing is pre-built at boot (to keep the first load and memory small); a "Changing the age…" hint is shown meanwhile.
- **One sprite is a 35 ms task:** the largest single `bake()` (the Ancestor Hall) cannot be sliced without touching Saigon's `core.js`.
- **The 1080p fade runs at ~40 fps** in software-rendered headless Chrome (two full-screen worlds per frame); 768p and phone sizes run at ~60 fps. A real GPU was not measured.
- **Both timelines stay in memory** after the first switch (statics, sprite sheets, entities; ground is trimmed to the view). The JS heap was measured (9 MB); canvas memory on a device was not.
- **The environment is shared, the world is not:** when a timeline is brought back, the hour jumps to the viewer's, so its residents may be mid-task for another time of day for a moment.
- A season change made *during* the fade falls back to the old synchronous re-bake (a short stall); rare.
- Not tested on a real phone, and the audio was not listened to by a person.
