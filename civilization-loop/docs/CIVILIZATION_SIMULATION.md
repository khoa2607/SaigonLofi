# Civilization Simulation

Design for the *Civilization Simulation* layer (what happens). The Visual Simulation (how it looks) is in `TECHNICAL_ARCHITECTURE.md` and
`ART_DIRECTION.md`. Tags: CONFIRMED / DIRECTION / IDEA / FUTURE / OPEN.

## 1. Lifecycle of a civilization — CONFIRMED (shape), DIRECTION (mechanics)

`Emergence → Growth → Flourishing/Peak → Strain → Decline → Collapse → Aftermath/Ruin → (new) Emergence`

A civilization is a record: id, founding site and time, culture traits, technology profile, population history, settlements, notable
structures, events, ending type, legacy. Many civilizations occur over one persistent world; there is always a **current** one (or a gap
between them).

## 2. Eras — CONFIRMED (framework) / DIRECTION (use)

Prehistoric → Ancient → Medieval/Renaissance → Industrial → Modern → Futuristic/Cyberpunk → Super Civilization → Collapse/Post-Civilization →
Rebirth/New Prehistoric. An "era" is a *label over technology and culture state*, not a switch. A civilization has a **technology profile**
(see §5); the displayed era is derived from it. Skipping, stalling, regressing and branching are legal.

## 3. Alternative evolution — CONFIRMED (concept), FUTURE (breadth)

Branches beyond realistic history: mechanical, biological, digital/AI, organic living cities, cyberpunk megacities, hybrids, agrarian
stagnation. DIRECTION: first cycles are recognisably human; branch likelihood rises with cycle number and with what was inherited.
OPEN: whether branches are authored archetypes with parameters, or emerge from technology-axis weights (preferred idea: weighted axes, see §5).

## 4. Population and resources — DIRECTION

- **Population:** an aggregate (births, deaths, migration, per settlement) plus a **small rendered subset** of visible individuals.
- **Resources (initial set, OPEN):** food, materials (wood/stone/metal…), energy (muscle → fire → fuel → electricity → exotic), knowledge.
- **Environment:** fertility, water, climate, pollution, biodiversity, hazards. Land use changes it; it feeds back on resources and stability.
- **Social stability:** a derived pressure value (scarcity, inequality, crowding, disasters, cultural cohesion) that drives migration, unrest and collapse risk.
- Keep the model small enough to read and tune: a handful of variables per settlement, updated on a coarse tick (e.g. "season" or "year"), with the visual layer interpolating.

## 5. Technology — DIRECTION / OPEN

Technology as **several axes** rather than one ladder, e.g. materials, energy, transport, agriculture, medicine/biology, computation,
construction, social organisation. Era label = function of axis values. Inherited knowledge and artifacts can raise an axis early
(the "robotics much earlier than expected" example). OPEN: axis list, ranges, how discoveries are triggered (research points vs events vs
need-driven).

## 6. Infrastructure and the built world — CONFIRMED (evolution of buildings/roads), DIRECTION (model)

Settlements grow along geography (rivers, fords, harbours, resources). Roads/bridges/rails/power/data corridors are *persistent*
infrastructure that outlast their civilization. Each building has a **logical identity** (house, market, temple, workshop…), a footprint
on the persistent map, a **construction state** and a **condition** (0–1), and a **building DNA** the renderer interprets by era
(`ART_DIRECTION.md` §5). Condition decays without maintenance (maintenance requires population, materials, energy, will).

## 7. Collapse — CONFIRMED (scenarios) / DIRECTION (mechanics)

Collapse is a **process driven by pressures**, never a scripted reset.

| Scenario | Typical drivers | What the viewer sees |
|---|---|---|
| Natural reclamation | Slow disinterest, resource shift, low birth rate, land returns to wild | Gradual abandonment, vegetation, animals |
| Environmental collapse | Pollution, drought, floods, climate shift, soil loss | Dying fields, flooded districts, migration |
| Technological singularity | Autonomous machines/AI take over infrastructure | Humans fade from streets, machines keep running, lights still on |
| Great exodus | Humanity leaves the planet | Launches, emptying districts, silence |
| Slow decline | Shrinking population, failing maintenance | Dark windows, cracked roads, shrinking settlements |

Each civilization has a **vulnerability profile** from its culture and technology (an AI civilisation has singularity risk; a polluting
industrial one has environmental risk). Collapse begins when pressure outruns resilience for long enough; the scenario emerges from which
pressure dominates (OPEN: exact thresholds, hybrid endings allowed — FUTURE).

Phases: **Strain → Cascade → Abandonment → Ruin → Reclamation**. Visual effects follow state: lights turn off, transport stops, roads crack,
buildings lose roofs/windows, vegetation spreads, animals return.

## 8. Rebirth and historical inheritance — CONFIRMED (inheritance), DIRECTION (mechanics)

After a gap, a new civilization emerges (a few survivors, a new migrating group, a re-emerging culture — OPEN) on the persistent world.
It **inherits the world's memory**:

- **Terrain and ecology** as left by the previous one (cleared land, polluted ground, flooded plains, forest regrown).
- **Ruins and foundations** it can build on, quarry, avoid, or revere.
- **Artifacts and caches** (buried cores, dormant robots, sealed vaults, libraries) it may discover.
- **Cultural residue:** myths, place names, taboos (FUTURE).

**Discovery** is rule-driven: when a settlement's reach overlaps a ruin/artifact and its technology and culture satisfy conditions, a
**discovery event** may fire with an **interpretation** chosen by culture/technology (reuse, revere, fear, ignore, excavate, scavenge).
Outcomes feed back into technology axes, architecture and culture. Illustrations (CONFIRMED as illustrations, not as scripts): a biological
city built around an ancient structure; an early robotics boom from an excavated core; a prehistoric tribe treating a robot as a deity.

World memory records (minimum, DIRECTION): building history (built/by whom/when/condition/demolished), notable events, artifacts and their
state, former land use. Enough to support Archaeology and Timeline later without re-simulation.

## 9. Event system — CONFIRMED (time scales), DIRECTION (design)

| Scale | Examples | Source |
|---|---|---|
| Micro (seconds) | NPCs look around, vehicles pass, smoke rises, lights flicker, animals move, small tasks | Visual layer, ambient |
| Routine (tens of seconds–minutes) | Deliveries, construction, markets, transport, NPC interactions | Driven by civilization state (stocks, orders) |
| Unexpected (minutes) | Accidents, discoveries, odd weather, infrastructure failures, cultural events, small chains | Event director with preconditions |
| Long-term (tens of minutes+) | Growth, new buildings, tech, expansion, environmental change, decline, rebirth | Civilization simulation |

Rules (DIRECTION): events have **preconditions, effects and aftermath**; chains are allowed (a flood → bridge fails → supply stops →
construction pauses). Avoid pure randomness: prefer *state-driven* triggers with some randomness for timing. An **event director**
keeps a steady supply of watchable moments without repeating itself (cooldowns, variety tracking). OPEN: event data format and authoring.

## 10. Time model — OPEN

Layered clocks: real seconds → in-world day/night (minutes) → season/year (tens of minutes) → era/cycle (hours of wall time at normal
speed, with a speed control). The user can pause or speed up (CONFIRMED UI). OPEN: default speed, how "history returns later" works when the
page was closed (catch-up simulation vs sampled summary).

## 11. Determinism and inspection — DIRECTION

Seeded randomness and a compact event/history log, so a run can be reproduced and inspected, and so Archaeology/Timeline can be built on the same record.
