# Civilization Loop — project instructions for Claude

**Read this file completely before making any significant change.** Then read `docs/PROJECT_VISION.md` and `docs/REQUIREMENTS.md`.
If a request contradicts these documents, say so and ask; do not silently follow either side.

## 1. Identity

- **Working title:** Civilization Loop.
- **What it is:** a standalone, browser-based, isometric **pixel-art civilization simulation** that is meant to be *watched*, not played.
  A civilization is born, develops, reaches extraordinary heights, declines, collapses and disappears; another civilization then
  emerges **on the same land and inherits the consequences** of the ones before it. The cycle repeats indefinitely and each cycle can go
  differently.
- **Experience:** an ambient, relaxing, lofi-style "interactive documentary" of a fictional world. The visual quality, atmosphere and calm UI
  are inspired by *Saigon Lofi*. The simulation concept is entirely different.
- **It is NOT:** Holdfast, Tây Du Ký, a Saigon Lofi mode, Civilization VI, an RTS, a conventional city builder, or a game with a player,
  objectives, a win state or a management dashboard.

## 2. Project isolation (non-negotiable)

- This project lives in its **own directory, `civilization-loop/`, at the root of the `SaigonLofi` GitHub repository** (owner's decision, 2026-11-22,
  `docs/DECISIONS.md` D-007). All of its code, docs, assets, tests and configuration stay **inside this directory** with its own `package.json`.
  It shares no code, build configuration or dependencies with the rest of the repository. Work happens on feature branches
  (`feature/civilization-first-prototype`), never directly on `main`.
- Other projects on the user's machine — **Holdfast** (finished), **Tây Du Ký** (still in active development; protect it), and
  **Saigon Lofi** (visual/UI reference only) — must **never** be modified: no edits, no branches, no commits, no moves or deletes, no
  changes to their `CLAUDE.md` or configuration.
- **Do not copy files or code from those projects** into this one without the user's explicit, specific authorisation. Saigon Lofi is a
  *visual and UX reference*, not a source dependency. (Re-implementing a technique from understanding is fine; copying files is not.)
- Before any commit, check `git status` shows changes **only** under `civilization-loop/`. Never touch the root `package.json`, `index.html`,
  `js/`, `holdfast/`, `css/`, `tests/` or any Tây Du Ký files. If the working directory is ambiguous, **stop and ask**.

## 3. Core vision to protect

1. **One persistent world.** The same geography evolves across eras (river → trade route → bridge → ruin). Never "swap the background".
2. **Real simulation, visible consequences.** A civilization layer decides *what happens*; a visual layer shows it. Buildings are built,
   used, decay and become ruins; nature reclaims them.
3. **Historical inheritance** is the key differentiator: each civilization finds, reuses, misreads or worships what earlier ones left
   (ruins, foundations, artifacts, technology, a buried core, an ancient robot). Outcomes come from simulation rules and events, not
   fixed scripts.
4. **Collapse is a process, not a reset** (lights go out, roads crack, vegetation spreads, animals return) and there are several kinds.
5. **Construction and destruction are animated**, never instant replacement.
6. **Repetition without boredom:** layered events at four time scales (seconds / tens of seconds-minutes / minutes / tens of minutes+),
   causally linked, not random background noise.
7. **Alternative evolution:** later civilizations may be agrarian, biological, mechanical, digital/AI, organic cities, hybrids — not only
   realistic human history. The nine-era list is a *starting framework*, not a rigid ladder.
8. **Procedural pixel art in code, no external sprite service** (no PixelLab or similar). Modular "building DNA" and reusable character
   parts, not hundreds of unrelated static sprites.
9. **Calm UI in the Saigon Lofi spirit:** the world is the attraction; controls are minimal (YouTube music, speed, pause, era/civilization
   info, optional timeline, fullscreen).

## 4. Status labels used in the docs

Every statement of intent in `docs/` is tagged. Respect the tag; never promote a lower tag to a higher one without the user's say-so.

| Tag | Meaning |
|---|---|
| **CONFIRMED** | The user stated it as a requirement. Do not remove, weaken or reinterpret. |
| **DIRECTION** | The current design direction; open to refinement with the user. |
| **IDEA** | Under consideration; **not** a requirement. Preserve it; do not build it unasked. |
| **FUTURE** | Wanted eventually, not for the first versions. Preserve it; do not drop it. |
| **OPEN** | Undecided. Resolve only with research + a recorded decision in `docs/DECISIONS.md`. |

## 5. Scope protection (read twice)

1. Never silently remove a documented feature or idea.
2. Never turn the project into a generic city builder, a background-switching slideshow, or a game with goals.
3. Never replace historical inheritance with random decoration.
4. Never trade away visual quality just to add features.
5. No unnecessary frameworks or dependencies. Justify each in `docs/DECISIONS.md`.
6. Do not build a complicated simulation before the visual experience is validated (Phase 1 first).
7. Every major architectural or creative decision gets a `docs/DECISIONS.md` entry (decision, reasoning, alternatives, status, date).
8. Keep the first implementation achievable *without shrinking the vision*.
9. When a feature is too ambitious: keep its concept in the docs, write the simpler first implementation, state what is deferred.
   **Simplifying an implementation is allowed. Changing the product vision is not.** They are different things.
10. Update the docs in the same change whenever direction changes.

## 6. Art direction (summary — details in `docs/ART_DIRECTION.md`)

Isometric camera fixed; one pixel scale and density; consistent proportions, lighting rules, animation style; crisp pixels
(nearest-neighbour, integer scaling). Eras differ by palette, materials and architecture — not by artistic identity. Everything is drawn
by code. No emoji or emoji-style assets. No cheap geometric placeholders in the final art.

## 7. Technical principles (summary — details in `docs/TECHNICAL_ARCHITECTURE.md`)

- Two layers: **Civilization Simulation** (population, resources, technology, environment, infrastructure, stability, events, collapse)
  and **Visual Simulation** (buildings, NPCs, vehicles, construction/destruction, weather, day/night, effects). The first decides, the second shows.
- No heavyweight AI agent per NPC: high-level simulation + visible individual NPC behaviour + procedural events.
- Browser performance for an ambient experience is a hard constraint.
- Determinism where practical (seeded randomness) so history can be inspected and tests can be written.
- Rendering: **Canvas 2D**, plain ES modules, no dependencies, no build step (`docs/DECISIONS.md` D-008). Run with any static server (`npm run serve`).

## 8. Development rules

- **Current stage: first playable prototype (Phases 1-2 in miniature), built overnight on `feature/civilization-first-prototype` at the owner's request.**
  Eras beyond the first settlement arc, alternative technology branches, artifacts and archaeology views are NOT built yet (see `docs/ROADMAP.md`).
- Use short-lived feature branches; never merge into `main` without the owner's approval.
- Small, verified commits. Never commit secrets, credentials, browser profiles, generated output or `node_modules`.
- Every new behaviour needs a deterministic test or a measured diagnostic number; screenshots alone do not prove behaviour.
- Bilingual UI (VI/EN) is **OPEN** (`docs/REQUIREMENTS.md` Q-01, D-08; `docs/DECISIONS.md` P-04) — do not assume either way.
- Be honest in status reports: what exists, what was measured, what is missing.
- Tests: `node tests/sim.test.mjs` (simulation, deterministic) and `node tests/browser.test.mjs` (needs the `playwright` package from the parent environment).

## 9. Instructions for future Claude sessions

1. Read this file, `docs/PROJECT_VISION.md`, `docs/REQUIREMENTS.md`, then the document relevant to your task.
2. Check `docs/ROADMAP.md` for the current phase; do not start a later phase on your own.
3. Check `docs/IDEA_BACKLOG.md` before proposing anything "new" — it may already be there.
4. If you must choose between two designs, record the choice in `docs/DECISIONS.md`.
5. If the user's new request conflicts with the docs, point out the conflict, ask, and (once resolved) update the docs.
6. Final reports state: what changed, tests/diagnostics run, known limitations, commit hash.
