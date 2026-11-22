# Tây Du Ký v3 — UI redesign status

Branch `feature/tayduky-redesign-v2`. Local commit only (no push, no merge).

## Done
- Shared Lofi Worlds UI (music dock, YouTube box, volume, track change, VI/EN, time-of-day) with an Eastern theme.
- 15-biome navigator replacing the old era tabs; smooth camera move to each biome's real bookmark/centre.
- Code-painted border dragon; hides with the panels; reduced-motion safe.
- Old inline HUD (`#tod` select, `names`, `zin/zout`) replaced; `tw-main.js` is null-safe for those ids.

## Tests (run 2026-11-21)
| Test | Result |
|---|---|
| `node tests/tayduky-v3-ui.mjs` (new, 62 checks: 6 viewports, 15 biome clicks at 4 viewports, music play/pause/next/prev/volume/mute, time modes, auto cycle, night persists across navigation, EN/VI, hide/H, prefs after reload, JS errors, 4xx assets) | **ALL PASS** |
| `node tests/tayduky-v2-map15.mjs` | PASS |
| `node tests/tayduky-v2-world.mjs 20|90` | FAIL — **pre-existing** (identical at HEAD `cdfa134`: only 2 of 3 expected signatures observed); 0 page errors |
| `node tests/tayduky-v2-sim.mjs 600 7` | FAIL — **pre-existing**, seed-sensitive Thiên Cung coverage already documented earlier; not touched by the UI |
Not run: the per-biome sims (UI change does not touch simulation code).

## Navigation guarantees (tested)
Zoom, time mode and the simulation are untouched by a click; no `force=`; no signature is triggered; the tween is cancelled by
dragging; click lands on the clicked biome (checked with `TWM.biomeAt` at the view centre) for all 15.

## PixelLab
0 generations used in this task (balance ~1.65 + daily bonus; dragon is procedural).

## Limitations
- The dragon is a simple procedural sprite; where it crosses the plates it passes behind them.
- The active highlight follows the biome under the view centre, so near seams it may flip a little before the camera settles.
- Track names are display-only relabels of the shared lofi engine's six tracks.
- Mobile: dragon is drawn at half scale; the navigator plate covers part of the map on very small screens.
