# Three-era dock integration

Date: 2026-11-19  
Branch: `integration/holdfast-three-eras`  
Base: `origin/feature/holdfast-future` at `68ba65d`  
Source fix: `1869b1230c4a7f4f1b6e2bc9f5d9486bb0101127`

## What was integrated

The Current/Past dock fix was targeted-cherry-picked onto the completed Future branch. The original map treated every dock as a six-unit-wide rectangle extending only in positive world Y, even though the curved riverbank requires three different outward directions. That left the centre and east dock endpoints on land and made artwork, walk flags, fishing points, boat moorings and unloading positions disagree.

All eras now use the same dock contract: `x`, `y`, `dx`, `dy`, `axis`, `len`, `dockPoint()` and `dockTiles()`. River geometry and water boundaries were not changed.

| Dock | Design anchor | Axis | Length |
|---|---:|---:|---:|
| Centre | `(480, 498)` | `xy` | `64` |
| West | `(226, 466)` | `y` | `38` |
| East | `(740, 466)` | `x` | `38` |

`dockPoint()` supplies the common centre line used by fishing spots, moorings and boat crews. `dockTiles()` supplies continuous `W_DOCK` navigation from the dry bank end to the outer water end.

## Future conflict resolution

The cherry-pick had one textual conflict, in `hrBuildStaticsG()` in `holdfast/hf-render.js`. It was resolved as:

```js
bakeCached('dock' + d.axis + d.len,
  () => ((HF.era === 'future' && FPROPS.dock) || PROPS.dock)(d))
```

This preserves Future's `FPROPS.dock` artwork and the Current/Past `PROPS.dock` artwork while preventing differently oriented docks from sharing an incorrect cached sprite. No Future simulation, robot, drone, navigation or era-switching hook was replaced.

## Validation

`tests/holdfast-docks.mjs` now audits Current, Past and Future. It checks identical centre lines, dry landward ends, water outer ends, continuous dock navigation, reachable fishing positions, open-water moorings, directional artwork, and forced cargo and medical boat arrival, crew call, unloading and departure in every era.

Screenshots use the same seed, environment and camera query in every era:

`seed=7&hour=10&time=noon&wx=clear&season=summer&cam=river&zoom=-1&clean=1`

- `docs/holdfast/screenshots/50-docks-current.png`
- `docs/holdfast/screenshots/50-docks-past.png`
- `docs/holdfast/screenshots/50-docks-future.png`

The screenshots are visual evidence only; deterministic map and simulation assertions provide the behavioural validation.

All validation passed:

| Command | Result | Coverage |
|---|---|---|
| `node tests/holdfast-docks.mjs 7` | PASS | Three-era geometry, navigation, art, fishing, bathing/bank activity, open-water moorings, cargo and medical boat lifecycle |
| `node tests/holdfast-future.mjs 7` | PASS (49 checks) | Future geography, machines, boats/drones, cargo and medical deliveries, combat, power, two-day stability, determinism and Current/Past non-regression |
| `node tests/holdfast-sim.mjs 3600` | PASS (21 checks) | One-hour Current simulation, sealed map, navigation, combat, work, expeditions, repairs and determinism |
| `node tests/holdfast-past.mjs 7` | PASS | Past geography, art, dinosaurs, work/community loops, defence and determinism |
| `node tests/holdfast-corpse.mjs 7` | PASS (33 checks) | Current/Past/Future death lifecycle and bounded cleanup |
| `node tests/holdfast-world.mjs 7` | PASS (21 checks) | Context isolation, sliced build, resume and flow-cache separation |
| `node tests/holdfast-flow.mjs --no-youtube` | PASS | Browser navigation, warm start, fisher activity, UI and gallery lifecycle |
| `node tests/holdfast-transition.mjs` | PASS (46 checks) | Current/Past transitions, camera preservation, rendering, resume and leak checks |
| `node tests/holdfast-future-browser.mjs` | PASS (18 checks) | Real-browser three-era switching, Future render/navigation, camera preservation and gallery lifecycle |
| `node tests/holdfast-browser.mjs` | PASS | Current/Past browser self-tests, gallery and Saigon smoke test |

## Scope and limitations

The integration deliberately leaves the shared valley geography, camera, water mask and all Future-specific files unchanged. Boat routing uses the existing shared river lane; this change corrects its dock endpoints and adjacent open-water moorings rather than redesigning the lane.
