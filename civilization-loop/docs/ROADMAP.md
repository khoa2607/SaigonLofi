# Roadmap

Planning guidance. **A phase is not started until the user says so.** Each phase lists scope, what is deliberately deferred, and
acceptance criteria. Features from `REQUIREMENTS.md` that are not in a phase's scope are *deferred, not dropped*.

> **Status 2026-11-22:** Phase 0 done. At the owner's request a first playable prototype covering the core of Phases 1 and 2 (and a slice of 4) was built overnight on `feature/civilization-first-prototype`: see `PROTOTYPE.md`. Phase 3 (alternative evolution, more eras), the rest of Phase 4 (collapse variety, artifacts) and Phase 5 are NOT started.

## Phase 0 — Project Foundation (DONE)
**Scope:** independent repo and `main`; `CLAUDE.md`; vision, requirements, simulation, art, architecture, roadmap, idea backlog, decisions docs.
**Accept when:** the docs are consistent, nothing contradicts `CLAUDE.md`, open questions are listed, the initial commit exists, and no code exists.
**Exit step:** user reviews docs, answers priority open questions (`DECISIONS.md` "Pending").

## Phase 1 — Visual Prototype
**Scope:** rendering-technology spike and decision; isometric terrain with water, vegetation and a persistent map; consistent camera, pan/zoom;
procedural pixel-art pipeline (painters, ink, grade, cache); basic buildings from DNA (one archetype in two or three era skins);
basic NPCs with walk/stand/work/carry; day/night; simple weather; Saigon-Lofi-style minimal UI shell with YouTube.
**Deferred:** civilization simulation, collapse, inheritance, archaeology.
**Accept when:** one map shows a hut/house/apartment skin set at the same location with unmistakably the same art identity; people walk and work;
day/night works; frame time measured and recorded; the user judges the visual quality acceptable *before* Phase 2 begins.

## Phase 2 — Civilization Simulation
**Scope:** population, resources, environment basics, construction pipeline (visible stages), technology axes, basic era transitions that
change building/people skins in place, event director with micro and routine events, speed/pause, seeded determinism.
**Accept when:** a civilization grows by itself across at least three eras on one map with visible construction; deterministic with a seed; Node
tests for the simulation; no instant replacement of buildings.

## Phase 3 — Civilization Evolution
**Scope:** more eras, alternative development paths (technology-axis branching), infrastructure evolution (roads → rails → …), environmental
change and feedback, unexpected events with consequences.
**Accept when:** two runs from different seeds diverge visibly in architecture, transport and culture; geography stays recognisable.

## Phase 4 — Collapse and Rebirth
**Scope:** multiple collapse scenarios as processes, decay stages and ruins, nature reclamation, world memory, new civilization emergence,
**historical inheritance** (discovery events and interpretations), multiple cycles.
**Accept when:** at least three collapse types are distinguishable on screen; a second civilization builds on or around a first one's ruins
and visibly uses an inherited artifact; the cycle runs repeatedly without manual reset.

## Phase 5 — Long-Term Experience
**Scope:** Civilization Archaeology, Historical Timeline, Genealogy, a richer event catalogue, persistence/return-later, UI polish, performance work.
**Accept when:** a user can pick a place and see its history across cycles; history survives a page reload; performance targets are met.

## Cross-cutting
Every phase updates docs and `DECISIONS.md`; adds deterministic tests or measured diagnostics; reports limitations honestly.
