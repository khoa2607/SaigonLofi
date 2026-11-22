# First playable prototype (2026-11-22)

Built overnight on `feature/civilization-first-prototype`. Everything here lives in `civilization-loop/`.

## What it is
A watchable, passive simulation of **one settlement's whole arc** on a fixed 48x48 isometric map, repeating when a new people arrives. Status labels as in `CLAUDE.md`; the prototype implements **CONFIRMED** requirements R-20..R-27, R-30..R-37 in miniature and a slice of the **DIRECTION** items.

## Run it
`npm run serve` (or any static server) then open `http://localhost:8780/`. Query parameters: `seed=N`, `warp=YEARS` (fast-forward before the first frame), `new` (ignore the saved world), `speed=0..3`, `scale=1..5`, `time=0..1` + `freeze` (fixed time of day). `node tests/sim.test.mjs` runs the simulation tests; `node tests/browser.test.mjs` runs the browser checks.

## Files
| File | Role |
|---|---|
| `src/rng.js` | seeded randomness, noise |
| `src/world.js` | terrain generation (river, lake, pond, forest, stone, fertility) and every per-tile memory array |
| `src/buildings.js` | building definitions (cost, work, capacity) |
| `src/sim.js` | the Civilization Simulation: month step, jobs, production, consumption, construction, decay, roads, events, stages, collapse, newcomers, save/load |
| `src/art.js` | procedural pixel art: tiles, trees, iso-box buildings in 3 architectural skins with construction / wear / abandoned states, ruins, people, deer, birds |
| `src/render.js` | the Visual Simulation: depth-sorted iso drawing, villagers and deer driven by the sim state, smoke, fire, day/night, seasons, picking |
| `src/main.js`, `index.html` | page, fixed-step clock, HUD, chronicle, inspector, save/load |

## The simulation (what actually happens)
- **People:** births, deaths, starvation, cold, disease, emigration, immigration; workers (65%) are allocated to farming, foraging/fishing, logging, quarrying, building, maintenance, and salvage by need.
- **Resources:** food (farms with seasonal yield and soil exhaustion; wild game and fish; spoilage), wood (trees are really removed), stone (finite, quarried from hill tiles), water (river access or wells), housing (shelters and houses, occupancy), winter heating.
- **Buildings with effects:** shelter, house, farm, storage, well, workshop; staged construction (foundation, scaffold, walls, roof); condition decay; maintenance; collapse into ruins; abandonment when empty.
- **Condition-driven progress:** farming is discovered under food stress or at pop 14 (or when old fields exist), storage/workshop/well by need; stages Foraging Camp -> Hamlet -> Village -> Town, with hysteresis; building skins follow the stage at the time of construction (old primitive huts stand among newer houses).
- **Environment:** deforestation lowers rainfall resilience (more droughts and floods), wild game follows forest cover; fields wear out and rest (fallow rotation); floods silt the soil and leave permanent marks that future planning avoids; wildfires burn forest and buildings and leave scorched ground; plague strikes crowded, thirsty settlements and makes wells a priority.
- **Memory / inheritance:** harvested forest stays depleted for decades (slow, conditional regrowth); worn paths become roads and stay; abandoned fields keep their furrows; collapsed buildings leave ruins that age and are salvaged for stone and timber, then remain as foundations; when a civilization dies out the land waits 20-60 years and a **new people arrives**, recognises the old fields, settles among the ruins, and builds on old foundations at a discount.
- **Events log** (chronicle) and a population history strip with civilization boundaries; click any tile to read what the land remembers.

## Verification (see `tests/`)
Determinism, frame-rate independence (uneven batching gives identical state), invariants over 6 seeds x 800 years, condition-driven progress (barren land stays small), functional buildings, forest depletion persistence, roads/fields persistence, collapse into ruins, reclamation, inheritance (second civilization reuses foundations in most worlds), disasters occur and leave marks, boom-and-bust decline, save/load round trip.

## Known limitations
See the final report in the pull request / session notes and the list below.
- Only one technology line (a Neolithic-to-town arc); no alternative branches, no later eras, no artifacts or technology inheritance beyond "the old fields and ruins are recognised".
- Collapse has one visible form (resource exhaustion and abandonment with natural reclamation); the other scenarios in `CIVILIZATION_SIMULATION.md` are not built.
- A town can reach an equilibrium on deadfall wood and never fully collapse in some seeds.
- Villagers are decorative walkers driven by the job allocation; they do not carry goods, and animals are few.
- No audio and no YouTube integration yet (documented as required UI elements).
- Desktop-first layout; touch pan works but there is no pinch zoom.
