# Project Vision

Tags: **CONFIRMED** (stated by the user), **DIRECTION**, **IDEA**, **FUTURE**, **OPEN** — see `CLAUDE.md` §4.

## 1. The one-sentence idea  — CONFIRMED

A civilization is born, develops, reaches extraordinary technological heights, declines, collapses, disappears, and eventually gives
rise to another civilization; the cycle repeats indefinitely, and **every civilization inherits the consequences of those before it**.

## 2. What the world feels like  — CONFIRMED

Watching thousands of years of history unfold inside **one living diorama**: an interactive ambient documentary about a fictional
civilization. It combines Saigon Lofi's ambient presentation, a living simulation, emergent storytelling, procedural visual variation,
and long-term historical continuity. Users can open the site, pick or just watch a civilization, play YouTube music, observe people,
transport, construction, destruction and daily life, stumble on unexpected events, and return later to find history has moved on.

## 3. What it is not  — CONFIRMED

Not Civilization VI. Not an RTS. Not a city builder that needs constant input. No victory, missions, armies to manage or objectives.
Not an extension or continuation of Holdfast or Tây Du Ký. Not a mode of Saigon Lofi.

## 4. Pillars

### 4.1 A persistent world — CONFIRMED
The same geography evolves across eras; the viewer recognises familiar features across millennia. Examples: prehistoric river → ancient
trade route; primitive settlement → historical city; historical road → industrial network; river crossing → modern bridge; megacity →
ruin; vegetation reclaims roads and buildings; new settlements form around ancient structures.
World memory (building records, buried foundations, ruins, landmarks, rediscovered artifacts, abandoned technology, cultural and
technological inheritance) — CONFIRMED as a long-term requirement; the implementation is staged (see ROADMAP).

### 4.2 A simulation, not an animation — CONFIRMED
Buildings are built and evolve; populations grow, migrate and decline; technology changes architecture, transport and daily life;
environment influences civilization; major events can change history; buildings decay into ruins; nature reclaims; new civilizations can
reuse older remnants.

### 4.3 Historical inheritance — CONFIRMED (key differentiator)
Illustrative chain (outcomes must come from rules and events, **not** fixed scripts):
1. Civilization #1 builds a magnificent structure, then collapses.
2. #2 discovers it and builds a *biological* city around it.
3. #3 excavates an underground technological core and develops robotics far earlier than expected.
4. #4 — a prehistoric society finds an ancient robot, treats it as a deity, and builds a new culture around it.

### 4.4 Collapse as a process — CONFIRMED
Never a scripted explosion or instant reset. Several scenarios (natural reclamation, environmental collapse, technological singularity,
great exodus, slow decline); different civilizations have different possible endings. Collapse itself must be worth watching: lights go
off, buildings deteriorate, roads crack, vegetation spreads, transport stops, animals return, ruins become landscape, then a new
civilization emerges.

### 4.5 Construction and destruction on screen — CONFIRMED
Materials are carried, foundations laid, scaffolding rises, workers build, the structure grows, the building opens. Destruction is
gradual: abandoned, unpowered, cracked, roofless, overgrown, collapsed.

### 4.6 Branching evolution — CONFIRMED (framework) / DIRECTION (details)
The nine eras (Prehistoric, Ancient, Medieval/Renaissance, Industrial, Modern, Futuristic/Cyberpunk, Super Civilization, Collapse/Post-
Civilization, Rebirth/New Prehistoric) are a starting framework. Civilizations may skip stages, stagnate, collapse early, or take unusual
branches (mechanical, biological, digital/AI, organic living cities, cyberpunk megacities, hybrids). The first cycles follow recognisable
human history; later cycles grow stranger. Not limited to realistic history.

### 4.7 Procedural pixel art — CONFIRMED
Entirely in code; no PixelLab or external generator. Modular building DNA and character parts. Quality inspired by Saigon Lofi.

### 4.8 Repetition without boredom — CONFIRMED (philosophy)
Four time scales of events, with logical relationships and consequences (see `CIVILIZATION_SIMULATION.md` §9).

## 5. The viewer's relationship to the world  — CONFIRMED / DIRECTION
Primarily passive. Light interaction: pan, zoom, pause/speed, choose what to follow, inspect (later). Never required. The world, not the
UI, is the attraction.

## 6. Long-term ambitions  — FUTURE (all preserved, none required early)
Civilization Archaeology (inspect one location's history through the ages), Historical Timeline (age, era, population history, events,
milestones, collapses, previous civilizations), Civilization Genealogy (inheritance of tech, culture, structures, artifacts), unexpected
historical events (rediscovery, robot reactivation, mysterious structures, environmental shifts, new tech branches, odd cultures), and
alternative evolution paths.

## 7. Why this can work (design reasoning)  — DIRECTION
Saigon Lofi shows that a beautiful, calm, ambient scene holds attention. Adding *causal history* — things that were built, left behind and
rediscovered — gives the viewer something to remember and be surprised by, which a pure animation loop cannot.

## 8. Risk the docs are guarding against
The user's previous large project suffered scope drift. The remedy is this document set: tagged intent, an idea backlog that never
discards, a decisions log, and explicit rules about simplifying implementation versus changing the vision (`CLAUDE.md` §5).
