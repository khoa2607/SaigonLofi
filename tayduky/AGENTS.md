# AGENTS.md — Tây Du Ký world (`tayduky/`)

Scope: **only** this folder, `docs/tayduky/`, and `tests/tayduky-*.mjs`, `tests/tw-load.mjs`. Do not touch SaigonLofi, Holdfast, the gallery, or the repo-root `AGENTS.md` / `CLAUDE.md` (they belong to other projects).
Read `AI_HANDOFF.md` first: it has the current state and the exact next steps.

## What this is
A cozy, observation-only **living isometric diorama** (Journey to the West), vanilla JS + Canvas 2D, no build step, no npm. 160 x 160 tiles, true 2:1 isometric, 64 x 32 art-px tiles (K = 4). Two biomes are built (Hoa Quả Sơn `hqs`, Bàn Tơ Động `btd`); the other nine of the 11 approved biomes are flat, hatched placeholders. Branch: `feature/tayduky-redesign-v2`. **Never merge into `main`.** Do not add biomes without the owner's approval.

## Hard rules (from the owner)
- Keep the camera angle, default zoom, character scale, the 160 x 160 world size and the shared top-bar behaviour/layout unchanged.
- No tracing or compositing of reference images; no flattened biome plates, no emoji art. The traced alpha in `tayduky/alpha/` is legacy; leave it.
- Observation only: no player control, no objectives. Keep the Global Story Director, the Living Story Loop, at most 5 signatures at once and never in two adjacent biomes.
- Characters and props must be separate objects with real world coordinates, depth sorting and collision. No sliding over illustrations.
- Biome footprints are compact (variable per biome via `MASK` in `tw-map.js`); freed land belongs to neighbouring cells. Do not lock the nine placeholder regions' future geography.
- PixelLab spending: the owner has approved unrestricted use for the Tây Du Ký asset work, but still call `get_balance` before and after a batch and record it in `docs/tayduky/v2/PIXELLAB.md`. Tier 1 allows 8 concurrent jobs. Never store keys in the repo.

## Code map (plain `<script>` globals, load order in `index.html`)
| File | Role | DOM? |
|---|---|---|
| `tw-map.js` | the map (`TWM`): height levels, biome cells + masks, terrain, paths, stairs, props, POIs, lights, water shapes, wall-crawl spots, seam band, A* | no |
| `tw-data.js` | residents, role activity weights, mini events, stories as beats | no |
| `tw-sim.js` | simulation (`TWS`): step-queue activities, mini events, Director, Living Story Loop, recovery. Randomness only via `TWS.R` | no |
| `tw-art.js` | code-painted terrain/cliffs/stairs, prop painters, PixelLab sprite loader with life masks (`GLOWS`, `SILKS`, `SWAY`, `IMGKINDS`) | canvas |
| `tw-fx.js` | story/ambient effects, night character pass | render |
| `tw-render.js` | chunked ground, one x+y depth sort, occlusion columns, agents, grade, lights | yes |
| `tw-main.js`, `index.html` | boot, fixed 0.1 s step, camera, time of day, place cards | yes |
| `chars/` | runtime character sheets (`chars.js` = `TD2_CHARS`), rows down/left/right/up, columns idle, walk, act | |
| `sprites/` | runtime object sprites (`sprites.js`, `library.json`); `raw/` holds raw candidates | |
| `chars-pl/raw/` | cached PixelLab character ZIPs | |

Tools (Python + Pillow) are in `docs/tayduky/v2/tools/`: `pack_sprites.py` (+ `sprite_picks.json`), `pack_pl_chars.py` (+ `pl_cast.json`), `build_library.py`, `lineup.py`, `build_chars.py` (hand-authored legacy pilot).

## Commands
Run locally: `serve.bat` or `python -m http.server 8765` from the repo root, then `http://localhost:8765/tayduky/` (`?at=hqs|btd`, `&tod=day|dusk|night`, `&speed=4`, `&force=hqs,btd` starts story loops now, `&debug=1` or key `g` shows the nav grid).

| Check | Command |
|---|---|
| Simulation invariants, Node only (use at least 900 s; shorter runs fail the coverage thresholds) | `node tests/tayduky-v2-sim.mjs 900 <seed>` (seeds 7, 31, 101, 5 passed) |
| Browser test + screenshots (needs Chrome/Edge) | `node tests/tayduky-v2-world.mjs 30 --shots docs/tayduky/v2/screenshots` |
| One story's beats as screenshots | `node tests/tayduky-v2-story.mjs <hqs\|btd> <outPrefix> [day\|night] [speed] [shots] [gapMs]` |
| One screenshot | `node tests/tayduky-v2-shot.mjs "at=btd&tod=night&zoom=2" out.png 12000 1920 1080` |

Every new behaviour needs a deterministic number in the sim test; screenshots alone never prove behaviour.

## Gotchas
- Shell quoting: write multi-line Python patches to a file instead of bash heredocs with apostrophes.
- PixelLab walk clips are drawn ~20 % smaller than the base rotation; idle is therefore derived from a standing walk frame (see `pack_pl_chars.py`), never from the rotation.
- `pack_pl_chars.py` needs `--refresh` to re-download a ZIP after new animations finish (the ZIP is cached); a 423 "Locked" means the job is still running.
- `build_chars.py` skips names listed in `pl_cast.json`; `pack_pl_chars.py` prunes hand-authored sheets from the runtime folder.
- Props with footprints block tiles; any POI must sit on a walkable tile of its own biome (`poi()` drops POIs outside their cell).
