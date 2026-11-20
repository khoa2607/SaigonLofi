# Tây Du Ký — redesign v2: a living isometric world, rebuilt from scratch

Branch `feature/tayduky-redesign-v2` (from `feature/tayduky-world` at `19015cd`). Status: **character pilot for review**. The biomes, the map and the
runtime have not been rebuilt yet. They wait for the owner's approval of the characters.

The traced alpha (`tayduky/`, `docs/tayduky/art-pilot/`, `docs/tayduky/pilot/`) is now **legacy**. It stays untouched on both branches as reference and history.

## 1. Why the traced approach failed

The owner rejected the traced alpha. In their words, it looks like stitched images, not a living world.

The technical causes:

| Problem | Cause in the alpha |
|---|---|
| A collage, not a world | Each biome was one traced plate (a flattened scene). Plates sat on a diamond, with dithered seams and cloud banks hiding the rectangles. |
| Characters slide over a painting | Nothing in a plate is an object. Walk zones were guessed from ground colours, and occlusion came from automatic "object blobs" that merged trees with cliffs. |
| Poor readability | Every plate carried the reference's full detail. Characters (~50 px, also traced) sank into busy backgrounds of the same density and palette. |
| Inconsistent scale | Each plate was traced at its own cell size (1.25–1.7 source px), so huts, trees and people did not share one scale. |
| No motion quality | Traced sprites had no walk cycles (a 1 px bob only), mirrored held items, and 3-view characters reused frames. Scenery could not animate except for water colour bands. |

## 2. Architecture rules for the rebuild (owner, 2026-11-20)

These follow the Saigon/Holdfast architecture (as a technical reference only, never as an art reference):

- **True 2:1 isometric, fixed orthographic.** It uses the shared projection from `js/core.js`: `isoX = x − y`, `isoY = (x + y) / 2 − z`, tile `T = 8` world units.
  v2 draws at **K = 4 art px per world unit**, so a tile is **64 × 32 art px** (Saigon and Holdfast use K = 2).
- **The ground is built from modular isometric tiles**, never from stitched or pre-rendered background images.
- **Separate objects.** Buildings, vegetation, props and characters are individual sprites. Every one has a footprint, a pivot and a depth key.
- **One depth sort** by `x + y`, so characters walk in front of and behind buildings, trees and props.
- **Movement in world coordinates** on a nav grid, with collision and pathfinding around obstacles.
- **One scale** for NPCs, buildings, trees and terrain (§4).
- **Camera:** drag to pan, integer zoom steps, crisp pixels (smoothing off, nearest-neighbour), as in SaigonLofi and Holdfast.
- **Art made for animation.** No tracing, no image copying or compositing of references, and no flattened scenes. The references are mood and costume inspiration only.

The sandbox in `index.html` already follows these rules, with placeholder tiles and props.

## 3. Visual rules (the v2 look)

The style is Chinese mythic fantasy pixel art: warm, charming and storybook-like, and visually distinct from Saigon (box models) and Holdfast.

- **Hand-authored pixels.** Every sprite is an editable grid (one character per pixel) in `src/*.json`. Tools only mirror, stack parts and swap palette roles.
  The skill's rule applies: shape generators make programmer art.
- **Ink.** One outline colour for the whole cast, a deep plum (`#2a1726`), never black. The outer silhouette is outlined. Inside the shape, materials are separated by darker ramp tones.
- **Light** comes from the top left. Each material has a 3–4 tone ramp with hue-shifted shadows: warm golds fall to rust, violets fall to indigo, skin falls to rose.
- **Chibi proportions.** The head is about 40 % of the height. Faces are big enough to show eyes with a highlight, a mouth, brows or blush.
- **Silhouette first.** Every character has an outline feature that is theirs alone (§5). Colour only confirms it.
- **Saturated character accents against calmer ground.** Characters carry the strongest colours and the darkest ink. Ground tiles will stay lower in contrast (to be designed in the biome step).
- **No emoji or emoji-style art.** No traced pixels.

## 4. Scale and readability rules

| Rule | Value |
|---|---|
| Tile | 64 × 32 art px (8 × 8 world units) |
| Character canvas | 32 × 48, pivot (16, 46) = the feet on the ground point; one canvas for the whole cast, so sheets line up |
| Heights | monkey kid ≈ 24 px · spiderling ≈ 14 px tall, 28 px wide · monkey guard and elder ≈ 37 px · Wukong ≈ 37 px plus feathers (46) · spider sisters ≈ 44 px · Tam Tạng ≈ 42 px |
| Character vs tile | An adult is about 0.6–0.7 of a tile's width tall, so two people pass side by side on one tile row, and a door or tree reads as bigger than a person |
| Real size | Everything must read at **1×**. Previews are integer zooms only (2×, 3×, 4×). |
| Backgrounds | Checked on light (`#f4ead8`) and dark (`#1e1a2a`). The darkest characters (spiderling, black hair) use lifted tones and a lighter rim, so they do not vanish at night. |
| Directions | Front (down), back (up), right, and left. Left is the mirrored right only when every held item is symmetric (true for this whole cast). Otherwise left gets its own grid. |
| Animation | 2 idle frames (a 1 px breath), 600 ms each. A 4-frame walk at 140 ms: contact A, passing (body up 1 px), contact B, passing. In side views the legs stride and the near arm or sleeve swings. Robes sway the hem, and the feet peek out in turn. The spiderling scuttles (alternate leg sides). The monkey kid hops. |
| Pivot stability | The canvas and pivot are identical in every frame, so playback never jitters. |

## 5. Pilot cast (2 biomes)

The **pilot biomes are Hoa Quả Sơn and Bàn Tơ Động**, the default choice. They contrast the most: warm jade, sunny and furry against charcoal violet, glowing and silken.

| Character | Biome | Silhouette key | Built from |
|---|---|---|---|
| Tôn Ngộ Không (`wukong`) | Hoa Quả Sơn | two pheasant feathers, round head and ears, golden circlet, flared tiger skirt, curled tail | own grid |
| Khỉ Lính, monkey guard (`khi_linh`) | Hoa Quả Sơn | leather helmet with a red plume, stern brows, a tall spear | Wukong's body: helmet, vest and trousers, spear |
| Khỉ Lão, old monkey (`khi_lao`) | Hoa Quả Sơn | grey fur, white brows and beard, a crooked cane | Wukong's body: recoloured, robe, beard, cane |
| Khỉ Con, monkey kid (`khi_con`) | Hoa Quả Sơn | small and round, oversized head, peach held in both hands; hops | own grid |
| Nhện Tinh, eldest sister (`nhen_tinh`) | Bàn Tơ Động | twin buns pierced by silver spider-leg pins, long hair down the back, violet robe with web marks, poison-green sash | own lady body |
| Nhện Tinh, younger sister (`nhen_tinh_em`) | Bàn Tơ Động | a single high bun, teal robe, rose sash | the lady body, new hair and palette |
| Nhện Con, spiderling (`nhen_con`) | Bàn Tơ Động | low and wide, eight bent legs, red eyes, green back mark; scuttles | own grid |
| Đường Tam Tạng (`tam_tang`) | Bàn Tơ Động (scale contrast) | five-panel gold crown, closed smiling eyes, red and gold kasaya, a ringed staff | own grid |

## 6. Files

| Path | What |
|---|---|
| `docs/tayduky/v2/index.html`, `sandbox.js` | **The pilot page:** animated cast cards (4 directions, walk or idle, 2×–4× and real 1×, light or dark), and the living isometric sandbox |
| `docs/tayduky/v2/src/*.json` | Editable grid sources: one per character, made of parts (upper body, leg poses, arm poses, items) |
| `docs/tayduky/v2/tools/author_cast.py` | Hand-typed grids for the cast (except `wukong.json`, which is edited directly). Writes `src/*.json`. |
| `docs/tayduky/v2/tools/build_chars.py` | Stacks parts into frames. Writes `out/<name>.png` (4 rows: down, left, right, up × 6 columns: idle0, idle1, walk0–3), `out/chars.js`, `board-*.png` and `review-*.png`. |
| `docs/tayduky/v2/out/board-light-4x.png`, `board-dark-4x.png` (+ 1×) | The cast line-up (front and side) on light and dark backgrounds |
| `tests/tayduky-v2-pilot.mjs` | Headless check of the pilot page |

Rebuild: `python docs/tayduky/v2/tools/author_cast.py && python docs/tayduky/v2/tools/build_chars.py`.

## 7. Pilot limitations (honest)

- The **front and back walk** is a raised foot plus a 1 px body lift. Arms swing only in the side views. A richer 6–8-frame front walk is possible once the designs are approved.
- **Mirrored left view** for the whole cast (every held item is symmetric). Wukong walks without his staff (shrunk behind his ear, as in the novel). His staff, combat and emote poses are not drawn yet.
- The **spider sisters share one body**: the younger sister differs by hair, palette and sash. The seven sisters will need more variety (hair ornaments, robe cuts).
- The **monkey guard and elder share Wukong's body**, so their outlines differ by headgear, props and colour rather than build.
- The **sandbox ground and props are placeholders** drawn in code (flat tiles, ellipse trees, cone pillars). They are not proposals for the biome art.
  Characters do not avoid each other yet (they may overlap while passing).

## 8. Next steps after the owner approves the characters

1. Apply the owner's character notes, then add the remaining poses: action and emote frames (Wukong's staff, the spider sisters' silk), and front walks with arm swing.
2. Design the modular **tile set** and **object set** for Hoa Quả Sơn and Bàn Tơ Động in the same style: ground tiles and transitions, water, cliffs as stacked tiles, trees, huts and cave props as separate sprites with footprints.
3. Rebuild those two biomes as a small runtime (map in design units, nav grid, the Director, stories) on the Holdfast module template (`td-map`, `td-art`, `td-sim`, `td-render`, `td-main`).
4. Then the remaining nine biomes, one at a time.
