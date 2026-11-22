# Requirements

Each item is tagged (see `CLAUDE.md` §4). IDs are stable; do not renumber, add new ones at the end of a section.

## 1. Confirmed requirements (CONFIRMED)

**Project**
- R-01 Independent project: own folder, own Git repo, own `main`, own `CLAUDE.md` and docs. No changes to Holdfast, Tây Du Ký, Saigon Lofi.
- R-02 Standalone browser-based pixel-art civilization simulation. Not an extension of any existing project.
- R-03 No dependency on PixelLab or any external sprite-generation service; art is procedural/modular and produced in code.
- R-04 No unnecessary frameworks or dependencies; technology choice researched and documented before implementation.

**Experience**
- R-10 Primarily passive observation and relaxation; no win condition, missions, armies, or required interaction.
- R-11 Users can open the site, select or observe a civilization, play YouTube music, and watch the world evolve; returning later shows progressed history.
- R-12 Saigon Lofi's ambient presentation and UI philosophy: minimal, unobtrusive controls; the world is the main attraction.
- R-13 UI includes: main isometric scene, embedded YouTube player, day/night, weather, simulation speed control, pause/resume, era and civilization info, optional timeline/history interface, fullscreen where appropriate.

**World and history**
- R-20 One persistent geography that evolves across eras; no background replacement per era; familiar features recognisable across millennia.
- R-21 The cycle: birth → development → peak → decline → collapse → disappearance → new civilization, repeating indefinitely.
- R-22 Starting era framework: Prehistoric, Ancient, Medieval/Renaissance, Industrial, Modern, Futuristic/Cyberpunk, Super Civilization, Collapse/Post-Civilization, Rebirth/New Prehistoric — a framework, not a rigid ladder (skips, stagnation, early collapse, alternative branches allowed).
- R-23 Later cycles may take non-human-history paths (mechanical, biological, digital/AI, organic, hybrid).
- R-24 Historical inheritance: new civilizations can discover and reuse remnants of older ones; outcomes emerge from rules and events, not fixed scripts.
- R-25 The world accumulates history (building records, foundations, ruins, landmarks, artifacts, abandoned technology, cultural/technological inheritance) rather than resetting (staged implementation allowed).
- R-26 Collapse is a gradual, visible process with multiple scenarios (natural reclamation, environmental, technological singularity, great exodus, slow decline); different civilizations can end differently.
- R-27 Nature reclaims abandoned areas; animals return; ruins become part of the next landscape.

**Simulation and visuals**
- R-30 Two layers: Civilization Simulation decides what happens; Visual Simulation shows it (see `TECHNICAL_ARCHITECTURE.md`).
- R-31 No complicated AI agent per individual NPC; combine high-level simulation, visible individual NPC behaviour and procedural events.
- R-32 Browser performance suitable for an ambient experience.
- R-33 Construction is shown in stages (materials → foundation → scaffolding → workers → growth → operational); destruction is gradual (abandoned, unpowered, deteriorating, cracked, roofless/windowless, overgrown, collapsed). No instant replacement.
- R-34 Buildings use reusable archetypes and modular visual properties (footprint, height, roof, walls, materials, windows, decorations, technology level, style) — not hundreds of independent static sprites. A building's logical identity may persist while its look changes by era.
- R-35 Reusable procedural character architecture (head, body, arms, legs, clothing, hair, accessories, era-specific appearance) with shared animations (walk, stand, work, carry, rest, interact); recognisable silhouettes and consistent proportions; no cheap geometric placeholders in final art.
- R-36 Visual consistency: isometric angle, pixel scale and density, proportions, lighting conventions, rendering rules and animation style stay constant; eras vary by palette, materials and architecture.
- R-37 Layered events at four time scales (micro seconds; routine tens of seconds–minutes; unexpected minutes; long-term tens of minutes+) with logical relationships and consequences, not purely random animation.

**Process**
- R-40 Scope protection rules in `CLAUDE.md` §5 apply to all future work.
- R-41 Documentation is updated whenever direction changes; decisions are recorded in `DECISIONS.md`.

## 2. Strong design preferences (DIRECTION)

- D-01 First cycles follow recognisable human history; later cycles diverge.
- D-02 Prefer a small number of reusable building archetypes (residential, commercial, industrial, civic, religious/ceremonial, infrastructure, defensive, wonder) with era-specific skins.
- D-03 Individual NPCs are visible and simple; most "population" is statistical and only a subset is rendered.
- D-04 Validate the visual experience (Phase 1) before building the full simulation.
- D-05 Seeded randomness so a world's history can be reproduced and inspected.
- D-06 Day/night and weather are first-class, not decoration (they interact with events and activity).
- D-07 Persistence of world history in the browser (and/or exportable); exact mechanism OPEN.
- D-08 A Vietnamese/English UI toggle like Saigon Lofi's — **OPEN**, confirm with the user.

## 3. Future features (FUTURE — preserved, not early scope)

- F-01 Civilization Archaeology: select a location and inspect how it changed through eras (cave → temple → settlement → factory → megatower → ruin).
- F-02 Historical Timeline: civilization age, current era, population history, major events, technology milestones, collapse history, previous civilizations.
- F-03 Civilization Genealogy: inheritance of technology, culture, structures and artifacts.
- F-04 Rich unexpected-event catalogue: rediscovered technology, reactivated robots, mysterious structures, environmental shifts, new tech branches, unusual cultures.
- F-05 Full alternative-evolution paths (agrarian, biological, mechanical, digital/AI, stagnant, unexpected).
- F-06 Advanced collapse-aftermath: artifact rediscovery, cultural reinterpretation (e.g. an ancient robot as a deity).

## 4. Optional ideas (IDEA — see `IDEA_BACKLOG.md`)

Not requirements. Preserved in the backlog so that they are not lost.

## 5. Non-goals

- Not a strategy game: no armies, unit orders, tech-tree micromanagement, scoring, victory or defeat.
- Not a conventional city builder requiring constant input or player construction.
- Not a re-skin or extension of Holdfast, Tây Du Ký or Saigon Lofi; no copied source or assets without explicit authorisation.
- No PixelLab / external sprite generators.
- No complex strategy dashboard UI.
- No per-NPC heavyweight AI.
- No era "slideshow" where the scene is replaced wholesale.

## 6. Open requirement questions (OPEN)

- Q-01 Languages (VI/EN toggle?). Q-02 Target devices (desktop only first, or phone too?). Q-03 Hosting/deployment target. Q-04 Whether the viewer may influence history lightly (nudge events) or never. Q-05 Persistence scope (per-browser world save, share by seed, both). Q-06 Map size and whether the map is fixed, seeded-procedural, or chosen from presets. Q-07 Audio beyond YouTube (ambient synthesis as in Saigon Lofi).
