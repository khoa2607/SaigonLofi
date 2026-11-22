# Art Direction

Tags: CONFIRMED / DIRECTION / IDEA / FUTURE / OPEN.

## 1. Reference: Saigon Lofi — CONFIRMED (as a reference only)

The look, atmosphere and calm UI of Saigon Lofi are the quality bar: warm, graded, inked pixel art in a fixed isometric view, with a gentle
ambient presentation. It is a **visual reference, not a code or asset dependency**. This project must not copy its files and must not
modify it. (Look at it; re-derive techniques; do not paste.)

## 2. Isometric perspective — CONFIRMED
One fixed isometric camera angle for the whole project. One tile grid and projection convention, defined once and never varied per
era or per asset. Depth sorting by a single consistent rule. (OPEN: exact tile size and projection ratio — decide in Phase 1, record in `DECISIONS.md`.)

## 3. Pixel-art consistency — CONFIRMED
Constant pixel scale and density; crisp edges (no smoothing, nearest-neighbour, integer scaling); consistent proportions between
people, buildings, vehicles and terrain; consistent lighting direction and shading rules; consistent animation style. Eras change palette,
materials and architecture — **not** the artistic identity.

## 4. Procedural rendering — CONFIRMED (no external service), DIRECTION (techniques)
Everything is generated in code: terrain, vegetation, buildings, people, vehicles, effects. Prefer a small set of painters (per-material
pixel functions) applied to simple volumes with a shared ink/outline and a global colour grade, then cached as sprites. Technology choice
(Canvas 2D / PixiJS / other) is OPEN (`TECHNICAL_ARCHITECTURE.md` §2). No emoji or emoji-style assets.

## 5. Building DNA — CONFIRMED (concept), DIRECTION (fields)

A building is a **logical identity** plus a **DNA** record the renderer interprets per era and style:
footprint, height, roof, walls, materials, windows, decorations, technology level, architectural style (+ condition and construction state).

Residential example (CONFIRMED illustration): prehistoric hut → clay/stone house → timber-framed house → brick residential building → modern
apartment block → neon residential megatower. Same logical home, different skin. Other archetypes (DIRECTION): commerce, industry,
civic, religious/ceremonial, infrastructure, defence, wonder. A style is a bundle of material palettes, roof/window/decoration grammars and
height rules; styles can mix when civilizations inherit (e.g. a biological city grown around an ancient structure).
Avoid hundreds of unique static sprites; compose from parts and cache.

## 6. Character systems — CONFIRMED (concept), DIRECTION (details)
Reusable parts: head, body, arms, legs, clothing, hair, accessories, era-specific appearance. Shared animations: walk, stand, work, carry,
rest, interact. Specialised animation (era-specific tools, vehicles, rides, mounts, machinery) where needed. Recognisable silhouettes and
consistent proportions; avoid cheap geometric placeholders in the final look. Appearance is data-driven (era, culture, role, season).

## 7. Animation principles — DIRECTION
Few frames, clear poses, readable at small size; ambient motion everywhere (smoke, water, foliage, lights); activity has a visible
beginning, action and outcome (carry → place → built). Vehicles and machinery follow lanes/paths; no teleporting.

## 8. Construction and destruction — CONFIRMED
**Construction stages:** materials are transported → foundation → scaffolding → workers build → the structure visibly grows → it becomes
operational (lights on, smoke, traffic).
**Destruction/decay stages:** abandoned → unpowered/dark → deteriorating → cracks → roof/windows lost → overgrown → collapsed → ruin → foundation.
Implementation idea (DIRECTION): draw buildings in layers/slices that can be partially built or partially removed, with overlays for cracks,
moss, vines; the same mechanism drives both directions.

## 9. Lighting and atmosphere — CONFIRMED (day/night, weather), DIRECTION (technique)
Day/night cycle, weather, ambient mood as in Saigon Lofi. Emissive light (windows, lamps, neon, fires) at night; era palettes tint the
grade; collapse should read through lights going out. Weather interacts with the simulation, not only visuals. Seasons — IDEA/FUTURE.

## 10. Era look — DIRECTION
Prehistoric: earth/wood/hide, fire. Ancient: stone/clay/timber, monuments. Medieval/Renaissance: timber-frame, masonry, spires. Industrial:
brick, iron, chimneys, rails. Modern: concrete/glass, roads, traffic. Cyberpunk: neon, megatowers, drones. Super Civilization: exotic
materials/forms. Collapse: decay overlays, vegetation. Rebirth: return to earth tones, with remnants. Alternative branches get their own
material and form languages (organic, mechanical, digital).

## 11. UI look — DIRECTION
Match the Saigon Lofi philosophy: small translucent HUD plates, a bottom music dock, language toggle, nothing that competes with the world.
Built independently for this project.
