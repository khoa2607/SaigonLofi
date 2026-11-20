# Tây Du Ký art pilot (v2)

Owner review gate before milestone 1 (design doc §7.3). Open `index.html` through the local server
(`serve.bat`, then `http://localhost:8765/docs/tayduky/art-pilot/`), or open the PNGs in `out/` directly.

## Art direction

The SaigonLofi / Holdfast box-model look is rejected for this world. The style follows the owner's references in
`E:\game\web-lofi\references\tayduky\ref\` (outside the repository): front portraits of the four pilgrims, `topdown character.png`
(the in-game look) and `cloud.jpg` (the cloud style). Provenance: supplied by the owner; licence **not determined**.

**v2 (owner feedback, 2026-11-19):** "the characters must be exactly like the top-down reference, traced pixel by pixel; the Cao Lão Trang
huts look sunk into the ground; the Heaven clouds look like joined circles (use cloud.jpg); redesign before moving on."

- **The four pilgrims are traced** from `topdown character.png` (`tools/trace_ref.py`). The reference is an upscaled, blurred pixel image
  (cells about 6.6 source px, not perfectly regular). The tracer works per character:
  1. sample every cell with a robust median of its centre;
  2. reduce to a 30-colour palette per character;
  3. remove the opaque ground shadow;
  4. clean spurs and specks;
  5. ink the silhouette with the darkest tone.

  The results pass the skill's `pixel_art.py inspect --binary-alpha` check: binary alpha, 30 colours each. Sizes: Wukong 50×69,
  Bát Giới 56×76, Sa Tăng 68×76, Tam Tạng on horseback 44×108.
- **Scenes now use the same pixel density** (K = 4: a tile is 64 × 32 px, a character is about 70 px tall).
- **Clouds follow cloud.jpg:** a lumpy silhouette made of small bumps, a lit cap and a shadow pocket under each bump (tone patches, no inner
  outlines), a flat shaded underside, detached puffs, and layered tapered wisps.
- **Huts** sit on a stone footing with wattle walls, timber posts, a door and a lit window. Iso sprites size their own canvas, so nothing is clipped.
- The script-drawn secondary cast from v1 (soldier, fairy, spider sister, monkey) was removed: it did not match the traced density or style.
  **Each of them needs a top-down reference in the same style**, which `trace_ref.py` can trace the same way.

## Files

| Path | What |
|---|---|
| `tools/trace_ref.py` | Traces the four pilgrims → `out/trace-*.png`, `src/*.json` (editable grids), `out/step1b-traced.png` (reference vs traced) |
| `tools/px.py` | Shape and ramp kit (used for props, roofs and clouds) |
| `tools/scene.py` | Iso scene kit v2: K = 4 projection, self-sizing iso sprites, curved roofs, cumulus and wisp clouds, peach trees, glows, grades |
| `tools/step2_heaven.py`, `step3_spider.py`, `step4_border.py` | Scenes |

Regenerate from `tools/`: `python trace_ref.py && python step2_heaven.py && python step3_spider.py && python step4_border.py`.

## Honest limitations

- The pilgrims have one front-facing pose only. Other directions and walk frames need either more top-down references or hand-drawn frames on these grids.
- A few traced details still carry blur from the reference and should be hand-fixed in `src/*.json`. Sa Tăng's crescent on the headband is the clearest case.
- The props, roofs, ground and clouds are drawn by script on this kit; they are not hand-placed pixel by pixel. The ground uses a per-pixel painter.
- The scenes are static compositions rendered offline in Python, not the runtime renderer.
