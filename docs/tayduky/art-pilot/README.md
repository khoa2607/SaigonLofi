# Tây Du Ký art pilot

Owner review gate before milestone 1 (design doc §7.3). Open `index.html` through the local server
(`serve.bat`, then `http://localhost:8765/docs/tayduky/art-pilot/`), or open the PNGs in `out/` directly.

## Art direction (changed 2026-11-19)

The owner rejected the SaigonLofi / Holdfast box-model look for this world. The new direction follows the owner's reference set in
`E:\game\web-lofi\references\tayduky\ref\` (outside this repository):

- `TonNgoKhong.png`, `BatGioi.png`, `TamTang.png`, `XaTang.png`: front character portraits.
- `topdown character.png`: the in-game 3/4 top-down sprites.
- Provenance and licence of the reference images: supplied by the owner; licence **not determined**. They are style references only,
  and nothing from them is copied into the pilot.

Style traits carried over: chibi proportions with large heads, a warm near-black outline (never pure black), 5-tone material ramps with
hue-shifted shadows, light from the top left, rich gold trims, and saturated but warm colours. The scenes are isometric
(`px = 2(x − y)`, `py = (x + y) − 2z`), with characters 48 px tall.

## Files

| Path | What |
|---|---|
| `tools/px.py` | Authoring kit: ramp-shaded shapes, per-shape inking, silhouette outline, grid-source export |
| `tools/characters.py`, `tools/cast.py` | Step 1: the cast. `python cast.py` |
| `tools/scene.py` | Iso scene kit: ground painter, iso boxes, curved roofs, clouds, peach trees, glow, time-of-day grade |
| `tools/step2_heaven.py`, `step3_spider.py`, `step4_border.py` | Steps 2–4 |
| `src/*.json` | Editable grid sources for each character (one character per pixel, shared palette), for hand fixes |
| `out/` | Native PNGs (`*-native.png`) and integer-zoom previews |

Regenerate everything from `tools/`: `python cast.py && python step2_heaven.py && python step3_spider.py && python step4_border.py` (Python 3.10+ and Pillow).

## Honest limitations of the pilot

- Characters have one front pose only: no other directions and no walk frames yet.
- Shapes are blocked out by script and shaded by rule, then reviewed. Final art should be hand-fixed pixel by pixel in the `src/` grids
  (faces, hair tufts, hands).
- The scenes are static compositions rendered offline in Python, not the runtime renderer. The ground uses a per-pixel painter; final
  ground should move to hand-drawn iso tiles.
- Night and dusk use a simple multiply grade plus emissive overlays and stepped glows.
