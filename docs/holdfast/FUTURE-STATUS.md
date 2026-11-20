# Holdfast — Future timeline status (milestone 9)

On `main` (merged 2026-11-19; developed on `feature/holdfast-future`). Design: `FUTURE-DESIGN.md`. Shared-code changes and their conflict risks: `shared-changes/future.md`. Current/Past status stays in `STATUS.md` (Codex).

## What exists

| Part | Files | State |
|---|---|---|
| Art | `holdfast/hf-future-art.js` | All 12 building kinds and 38 house lots, all 73 prop kinds, wall (6 materials × 3 damage states), defense platform, gate, graves, hover cart, 3 boat kinds, docks (axis-aware), rails, Future-only props (solar arrays, substations, drone pads, batteries), people (looks, torso, face, hats, tools / pulse rifles), 19 machine models with walk / attack / climb poses and wrecks, 3 friendly drones |
| Simulation | `holdfast/hf-future.js` (DOM-free) | Map pass (grid, arrays, pads, tower and wall sectors), machine roster and behaviours, sensor network, defenses, power grid, friendly drones, salvage, fabrication, deliveries, signature events, recovery |
| Rendering + sound + wording | `holdfast/hf-future-render.js` | Machine sprites (two baked orientations, mirrored), sensor cones, signal rings, pulse bolts, searchlights, blackout mask in the light pass, drones, parts bin, paved ground, hydroponic trays, depot rovers, Future sounds, journal text (VI/EN) |
| Switching | shared hooks (see the log) | PAST ↔ CURRENT ↔ FUTURE in the page with the milestone 8.1 crossfade; the FUTURE tab is enabled |

## Measured

Node, deterministic (seed 7), accelerated time. Browser: headless Chrome, **software rendering**, this machine.

| | Result |
|---|---|
| Combat intensity, one ordinary game hour | 1,013 machines destroyed (Current: 818 infected, ×1.24); turrets 2,429 shots / 237 kills; pulse rifles 6,489 shots; 0 residents lost; all 19 machine types appear |
| Detection → transmission → response | reinforcements arrive 14–26 s after a scout's report; 11 complete chains in that hour |
| Flanking | two hunters end 1.82 rad apart around their target |
| Blackout repair | a technician restores a sector in 26 s by day and 39 s at night (on-call technician woken) |
| Salvage run | out through the gate, wreck stripped, parts home in 119 s |
| Battery over two days | full by midday, about 0.3 at dawn; no load shedding unless the grid is starved |
| Two game days | no NaN, at most 92 machines, 3 drones and 2 live signals at once; residents in all four sectors (30 / 22 / 27 / 21 %); all 9 checked signature events happen on their own |
| Frame rate (`holdfast-bench --era=future`) | 1080p 59.0 fps (loop JS 9.5 / 12.8 ms median / p95; Current 8.8 / 11.5); 768p 60 fps (1.6 / 3.1 ms); phone size 60 fps (1.0 / 2.6 ms); 1080p during a 60-strong attack 57.6 fps (Current 58.2, Past 53.0) |
| First switch to the Future | prepared in the background, then a 70-frame crossfade; frame p95 27–36 ms, worst 55–59 ms; no blank frame, no loading screen |

## Tests

| Command | Checks | Result |
|---|---|---|
| `node tests/holdfast-future.mjs [seed]` (new) | 49: geography equal to Current and Past; art coverage; 19 distinct machines with moving legs / wheels / treads; size and speed range; cone sensing (not behind); signal + reinforcements; flanking; patrol formation; flyer altitude; swarm; interceptor shoots a drone down, mechanic recovers it, it flies again; wall climber cuts plates; spider climbs, infiltrates, sabotages, causes a blackout, a technician repairs it; jammer blinds towers (no turret fire) and they recover; siege walker bombards the gate flank; turrets and rifles; combat ≤ 1.6× Current; the settlement holds; sun-driven generation; array cleaning; fault and repair; medical backup; load shedding; hydroponic stages + food; cargo + medical deliveries; salvage + fabrication; two-day stability; activity spread; signature events; determinism; **Current and Past unchanged with the Future loaded** (600 s fingerprints); **three-world isolation** | **PASS** |
| `node tests/holdfast-future-browser.mjs [--shots]` (new) | 18, real Chrome: FUTURE tab enabled; Current → Future in the page (class, subtitle, label); no navigation / loading screen / blank frame; camera identical in every frame; one loop; smooth; each world frozen while away and resumed; no listener / timer / AudioContext added, music untouched; 15 rapid clicks over three tabs; every machine draws; night lights, blackout and drones render without errors; gallery → Holdfast → Future → gallery → back keeps the same frame | **PASS** |
| `holdfast-sim`, `-past`, `-corpse`, `-world`, `-community`, `-life`, `-m7`, `-warm`, `-transition` (46), `-browser`, `-flow` | regressions, run in the Future worktree | **PASS** (`-world` and `-warm` have wall-clock limits; run alone they pass, and `-world` failed its 45 ms slice check at 49 ms only while seven suites shared the CPU) |

Screenshots in `docs/holdfast/screenshots/`:
- `40-triptych-past.png`, `40-triptych-current.png`, `40-triptych-future.png`: the same camera in the three ages.
- `41-future-night.png`: sensor nodes, kiosk screens, hospital pad lights.
- `42-future-machines.png`: all 19 machines at 1:1 (walk, back view, wreck) and six at 3×.
- `43-future-day.png`: the default view by day.

## Limitations (honest)

- **Not seen in motion by a person and not on a GPU.** All judgement comes from headless, software-rendered screenshots and numbers; the sounds were synthesised and never listened to.
- **Machines are graded warm** like everything else, so by day they read slate-violet rather than cold blue; their identity rests on silhouettes, red eyes and marker strips. Small units (mite 2 units, skitter, leech) are tiny at default zoom.
- **Wheel and tread motion is subtle**: it lives in the painters (hub spokes, tread stripes), not in moving boxes.
- **Facings**: two baked orientations, mirrored for the other two, so the light side flips on mirrored facings (as with the dinosaurs).
- **Hawks rarely strafe on their own**: defenders often drive them off first. The full interceptor → drone down → recovery chain is proven in a forced scene and seen in long runs only occasionally.
- **The gate itself cannot be damaged** (shared rule); the siege walker bombards the section beside it.
- **Routes**: the map has R1–R5, not R1–R6; nothing was added, so the three ages keep identical geography.
- **Combat is 1.24× the Current's** in machines destroyed per hour; turrets account for most of the difference.
- **Depot rovers reuse the horse logic**: riders sit on a rover as on a horse; there is no separate cargo-loading animation.
- **Expected merge conflict with Codex's dock rework** in `hf-render.js` (the dock `addStatic` line); the resolution is written in `shared-changes/future.md`. `FPROPS.dock` already follows a dock's axis.
- **Shared working directory**: the other agent's checkout and this branch's work were in one directory; the Future moved to its own worktree (see the incident note in the shared-change log).
