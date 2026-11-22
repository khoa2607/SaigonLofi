# Decisions

Format per entry: **Decision · Reasoning · Alternatives considered · Status · Date.**
Status values: Accepted (user-confirmed), Adopted (made by Claude, open to user review), Pending, Superseded.

## D-001 Independent project, repo and `main` branch
- **Decision:** Civilization Loop lives in its own folder with its own Git repository and `main`; no shared repo, branches or files with Holdfast, Tây Du Ký or Saigon Lofi.
- **Reasoning:** Tây Du Ký is still in development and must be protected; the user wants a standalone project; avoids scope bleed from previous work.
- **Alternatives:** a subfolder/branch of an existing repo (rejected — risks modifying existing projects).
- **Status:** Accepted (explicit user requirement). **Date:** 2026-11-21.

## D-002 Documentation before implementation
- **Decision:** Phase 0 produces documentation only; no code, no dependencies, no prototype until the user starts Phase 1.
- **Reasoning:** prevent scope drift; capture the vision durably.
- **Alternatives:** start a prototype alongside the docs (rejected by the user).
- **Status:** Accepted. **Date:** 2026-11-21.

## D-003 Procedural pixel art in code; no PixelLab
- **Decision:** all art generated programmatically; no external sprite-generation service.
- **Reasoning:** user requirement; keeps the project self-contained and cost-free.
- **Alternatives:** PixelLab / AI-generated sprites (rejected by the user); hand-made sprite sheets (not chosen; hundreds of assets per era do not scale).
- **Status:** Accepted. **Date:** 2026-11-21.

## D-004 Two-layer simulation (civilization vs visual)
- **Decision:** a Civilization Simulation decides what happens; a Visual Simulation shows it. No heavyweight per-NPC AI.
- **Reasoning:** keeps long-term history tractable and performance suitable for a browser.
- **Alternatives:** full agent-based simulation of every person (rejected by the user); pure visual loop with no real state (rejected: not a simulation).
- **Status:** Accepted. **Date:** 2026-11-21.

## D-005 Tagged documentation (CONFIRMED / DIRECTION / IDEA / FUTURE / OPEN)
- **Decision:** every statement of intent carries a status tag; ideas live in `IDEA_BACKLOG.md` and are never deleted.
- **Reasoning:** the user wants brainstorming kept distinct from requirements to avoid scope drift.
- **Alternatives:** untagged prose (risks promoting ideas to requirements silently).
- **Status:** Adopted. **Date:** 2026-11-21.

## D-006 Technology axes instead of a single era ladder (simulation model)
- **Decision (proposal):** model technology as several axes; the displayed era is derived.
- **Reasoning:** supports skipping, stagnation and alternative branches (CONFIRMED requirement) and inheritance accelerating one axis.
- **Alternatives:** a linear era counter (simple but contradicts branching); authored branch archetypes only.
- **Status:** Pending (direction only; revisit in Phase 2). **Date:** 2026-11-21.

## D-007 Location: a directory inside the SaigonLofi repository
- **Decision:** the project lives in `civilization-loop/` at the root of the existing SaigonLofi GitHub repository, on branch `feature/civilization-first-prototype`, fully self-contained. Supersedes D-001's "own repository" for now.
- **Reasoning:** the owner must retrieve the overnight work from another computer; only this repository is reachable from the cloud session.
- **Alternatives:** a separate repository (not reachable from this session); a bundle file (not durable). A later move to its own repository is a simple `git subtree split`.
- **Status:** Accepted (owner's explicit instruction). **Date:** 2026-11-22.

## D-008 Rendering: Canvas 2D, plain ES modules, zero dependencies
- **Decision:** one 2D canvas at low resolution, upscaled by an integer factor with nearest-neighbour; sprites generated at load; no framework, no bundler.
- **Reasoning:** the scene is 2,304 tiles plus a few hundred objects; measured frame cost is far below budget (see `PROTOTYPE.md`); full control of per-pixel painters; nothing to install.
- **Alternatives:** PixiJS (adds a dependency for a scale we do not need yet); WebGL (more effort). Keep the draw interface narrow so it can be swapped if later maps are much larger.
- **Status:** Adopted (owner asked for a quick decision). Revisit if maps exceed ~200x200 tiles. **Date:** 2026-11-22.

## D-009 One simulation step = one month; fixed-step, frame-rate independent
- **Decision:** the civilization simulation advances in whole months, driven by a real-time accumulator (2 / 8 / 30 steps per second for normal / fast / very fast); rendering interpolates nothing and never feeds back. Seeded RNG only.
- **Reasoning:** seasons matter (harvest, winter heating); months keep numbers small; determinism enables tests (`tests/sim.test.mjs` checks that uneven batching gives identical results).
- **Alternatives:** daily steps (too fine), yearly steps (loses seasons). **Status:** Adopted. **Date:** 2026-11-22.

## D-010 The world arrays are the memory
- **Decision:** all history is stored in per-tile arrays (trees, clearedYear, burnt, flood, road, farmed, ruin, lastBld, ...) plus an append-only building registry. Nothing is reset when the civilization changes.
- **Reasoning:** makes "historical inheritance" a property of the data rather than scripted content, and gives the inspector and later Archaeology view their source.
- **Status:** Adopted. **Date:** 2026-11-22.

## D-011 Development is condition-driven; decline emerges from pressures
- **Decision:** unlocks (farming, storage, workshop, well) fire on conditions (food stress, population, inherited ruins); stage is derived from population and building mix with hysteresis; decline comes from deforestation, soil exhaustion, disasters and plague, not from a timer.
- **Status:** Adopted. **Date:** 2026-11-22.

## Pending decisions (to resolve with research and the user)
| ID | Question | When |
|---|---|---|
| P-01 | ~~Rendering technology~~ — decided, see D-008 | done |
| P-02 | Isometric tile size / projection ratio and pixel scale | Phase 1 start |
| P-03 | ~~Build tooling~~ — no build, see D-008 | done |
| P-04 | UI languages (VI/EN?) | before UI shell |
| P-05 | Target devices (desktop first? phone?) | Phase 1 start |
| P-06 | Map size; fixed vs seeded-procedural vs presets | Phase 1 |
| P-07 | Persistence format and "return later" catch-up model | Phase 2 |
| P-08 | How a new civilization emerges (survivors, migrants, re-emergence) | Phase 4 |
| P-09 | Whether the viewer may nudge history | Phase 2 |
| P-10 | Hosting/deployment | before sharing |
