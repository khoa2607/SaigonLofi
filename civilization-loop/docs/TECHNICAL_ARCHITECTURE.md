# Technical Architecture

Nothing here is implemented. Sections are split into **Confirmed**, **Recommendation** (my current suggestion, not decided) and **Unresolved**.

## 1. Confirmed decisions (CONFIRMED)

- Browser-based; runs from a website.
- Procedural/modular pixel art generated in code; **no PixelLab** or external sprite service.
- Two layers: **Civilization Simulation** (decides) and **Visual Simulation** (shows).
- No per-NPC heavyweight AI agent; combine high-level simulation, visible individual NPC behaviour and procedural events.
- Performance suitable for an ambient browser experience.
- No unnecessary frameworks/dependencies; the final rendering technology is researched and documented before implementation.
- Embedded YouTube player for music; Saigon Lofi's UI philosophy (independently implemented).

## 2. Rendering engine

**Unresolved (OPEN):** Canvas 2D vs PixiJS (WebGL) vs another.
**Considerations:** Canvas 2D = zero dependencies, full control of per-pixel painters, proven for this style at modest scale; PixiJS =
batching/WebGL speed for large maps and many sprites, but adds a dependency and a different pixel-crispness workflow; WebGL custom = most
control, most effort. Decision method: Phase 1 spike measuring a representative large scene (terrain + thousands of sprites + lighting)
on a mid-range laptop and phone; record the result in `DECISIONS.md`.
**Recommendation (not decided):** start with Canvas 2D and offscreen sprite caching; keep the render interface narrow so it can be
swapped if the spike shows a ceiling.
Needs regardless: fixed isometric projection, depth sorting, chunked terrain baking, sprite cache keyed by (DNA, era, condition, stage), a
lighting/emissive pass, a weather overlay, integer scaling and DPI handling.

## 3. Simulation engine

- **Fixed-step update** decoupled from rendering; a speed multiplier changes steps per frame.
- **Layers by time scale:** civilization tick (coarse, "season/year"), settlement/economy tick (seconds), visual-agent tick (every frame/step).
- **Seeded RNG** (single source) for reproducibility and tests. Keep simulation code free of DOM/canvas so it runs in Node tests.
- **Recommendation:** plain modules with explicit data (no ECS library at first), revisit if entity counts demand it.
- **Unresolved:** catch-up simulation when the tab was closed; web worker for the civilization layer; save format.

## 3. World state

A persistent **world record**: terrain/heightmap and water; biome and fertility; per-tile land use and ownership history; infrastructure
network (roads, bridges, rails, power/data); **building registry** (identity, DNA, footprint, construction state, condition, history);
artifacts and caches; ruins and foundations (buildings never vanish — they become ruins and then foundations); civilization registry
(see `CIVILIZATION_SIMULATION.md` §1); event log. **Recommendation:** plain serialisable objects + typed arrays for tile layers.

## 4. Entity systems

- **Buildings:** logical entity + DNA + state machine (planned → materials → foundation → scaffold → building → operational → neglected →
  deteriorating → ruin → foundation).
- **People:** a statistical population plus a rendered subset with roles, simple needs/schedules and task chains (walk → act → outcome).
- **Vehicles/animals/machines:** path-following agents on the infrastructure graph.
- **Environment:** vegetation growth/spread, weather, day/night as systems that read and write world state.
- **Unresolved:** exact entity budgets per device; level-of-detail rules (full agents near the camera, statistics elsewhere).

## 5. Event system

An **event director** with typed events (preconditions, effects, aftermath, cooldowns, chain links), producing events at the four time
scales (`CIVILIZATION_SIMULATION.md` §9). Events write to the world log, which feeds timeline/archaeology later. Visual layer subscribes
to events to stage them (a flood, a discovery, a procession). **Unresolved:** data format (code vs JSON), authoring tools.

## 6. Procedural asset system

Painters (per-material pixel functions), volume/part composers, building DNA interpreters per style/era, character part compositor, ink and
grade passes, overlay generators (cracks, moss, scaffolding), and a cache. Everything generated at load or on demand; no image assets
required. **Recommendation:** keep generators pure and seeded; cache by key; expose a tiny dev gallery page to inspect all assets per era
(a development tool, not part of the product).

## 7. Persistence

**Unresolved (OPEN):** browser storage (IndexedDB/localStorage), world export/import, seed-sharing, how much history is stored vs
re-derived. **Recommendation:** store the seed + compact world record + event log; version the format from day one.

## 8. UI layer

Plain DOM over the canvas (HUD plates, music dock, speed/pause, era/civilization info, optional timeline panel, fullscreen). YouTube IFrame
API for music. Language toggle **OPEN** (see `REQUIREMENTS.md` Q-01). Built independently of Saigon Lofi's code.

## 9. Performance considerations

Chunked terrain baking; sprite caching; culling to the viewport; entity LOD; coarse civilization tick; avoid per-frame allocations;
frame-time budget tracking in a debug overlay; adaptive density on slow devices. Targets (DIRECTION): smooth 60 fps desktop at 1080p on
modest hardware; usable on phones (OPEN).

## 10. Testing

Node-runnable simulation tests with seeded runs (determinism, no NaN, long-run stability across many cycles); asset sanity checks;
browser smoke tests; measured frame time. "Screenshots alone never prove behaviour."

## 11. Tooling and project layout

**Unresolved (OPEN):** build step vs no-build plain scripts/ES modules; package management. **Recommendation:** no bundler until
justified; ES modules in the browser; Node only for tests. Any dependency requires a `DECISIONS.md` entry.
