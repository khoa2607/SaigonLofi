# Civilization Loop

> A civilization is born, flourishes, collapses — and another one rises from its ruins.

**Civilization Loop** (working title) is a planned browser-based, isometric, pixel-art civilization simulation that you *watch* rather
than play. Open it, put on some music, and observe thousands of years of fictional history unfold on one persistent piece of land.

## What makes it different

- **One persistent world.** The same river, hills and coast evolve from prehistory to megacity to ruin. No background swapping.
- **Historical inheritance.** Each new civilization discovers, reuses or misunderstands what earlier ones left behind — a buried core, a
  ruined temple, an ancient robot treated as a god.
- **Collapse is a process.** Lights go out, roads crack, forests return, animals come back — and there are several kinds of endings.
- **Visible construction and decay.** Scaffolding, workers and materials; cracks, abandonment, overgrowth.
- **Branching evolution.** Later civilizations may be agrarian, biological, mechanical, AI-driven or stranger.
- **Pure procedural pixel art** drawn in code — no external sprite service.
- **Calm, lofi presentation** inspired by Saigon Lofi: ambient scene, day/night, weather, YouTube music, minimal controls.

## Status

**First playable prototype** (branch `feature/civilization-first-prototype`). Open `index.html` through a static server: a 48x48-tile world with a river, forest, fertile land and stone hills; a settlement that grows, builds, farms, logs, quarries, suffers floods, fires, droughts and plague, declines, is abandoned, falls to ruin — and is then rediscovered by the next civilization, which builds on the old foundations.

```
cd civilization-loop
npm run serve        # or: python3 -m http.server 8780
# open http://localhost:8780/   (?seed=3  ?warp=100 (years)  ?new  ?speed=2)
node tests/sim.test.mjs
```

Controls: drag to pan, wheel or +/- to zoom, Space pause, 1/2/3 speed, click a tile to ask the land what it remembers, L chronicle. The world autosaves.

| Start here | |
|---|---|
| `CLAUDE.md` | Project rules and instructions for Claude sessions |
| `docs/PROJECT_VISION.md` | The creative vision |
| `docs/REQUIREMENTS.md` | Confirmed requirements vs. ideas vs. non-goals |
| `docs/ROADMAP.md` | Phases 0–5 with acceptance criteria and current status |
| `docs/PROTOTYPE.md` | What the prototype contains, how it works, known limits |

## Planned direction

Phase 1 visual prototype (isometric terrain, procedural buildings and people, one persistent map) → Phase 2 civilization simulation →
Phase 3 civilization evolution → Phase 4 collapse and rebirth → Phase 5 long-term experience (archaeology, timeline, genealogy).
The nine-era ladder, alternative technology branches, artifacts and the archaeology views are documented but not yet built; the prototype covers one early-settlement arc (camp to town and back) with historical inheritance.

## Independence

This is a standalone project with its own repository. It is not part of, and does not modify, Holdfast, Tây Du Ký or Saigon Lofi
(Saigon Lofi is a visual and UX reference only).
