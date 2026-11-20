# Tây Du Ký — Huyền Thoại Sống: status

Branch `feature/tayduky-world`. Not merged to `main` and not linked from the gallery yet. Last update: 2026-11-20 (resume session: the 11th biome, mini events, recovery).

## How to run

Run `serve.bat` (or `python -m http.server 8765`) from the repo root, then open:

| URL | What |
|---|---|
| `http://localhost:8765/tayduky/` | **The world (alpha):** one map, all 11 approved biomes, the living cast and the Story Director |
| `http://localhost:8765/tayduky/?at=hqs&tod=night&speed=4` | Start at a biome (`lat hds nnq btd bcl clt tth tc btp nhs hqs`), force the time of day (`day dusk night`), speed up the simulation |
| `http://localhost:8765/docs/tayduky/pilot/` | The earlier two-biome pilot (Hoa Quả Sơn, Cao Lão Trang) |
| `http://localhost:8765/docs/tayduky/art-pilot/` | Art pilot pages (v1/v2; history) |

Controls: drag to pan, mouse wheel or ＋/－ to zoom (integer steps), arrow keys to pan. A time-of-day selector (auto runs a full day in 8 minutes),
and place-name cards that can be turned on or off.

## What exists

### Art pipeline (`docs/tayduky/art-pilot/tools/`, Python + Pillow + numpy/scipy/OpenCV)

All art is traced from the owner's references in `E:\game\web-lofi\references\tayduky\ref\` (outside the repo; finished ones are in `ref/archive`).
Provenance: supplied by the owner; licence not determined.

| Tool | Output |
|---|---|
| `trace_sheet.py` | Multi-direction sheets: Cao Lão Trang (10 people × 4 directions) and Khỉ Con (5 monkeys × 4) |
| `trace_strips.py` | The six `0N_*_character_reference` strips (3-view characters grouped as front/side/back), plus Thiên Binh, Tiên Nữ and Nhện Tinh |
| `compose_world.py` | The world map |
| `build_chars.py` | `tayduky/world/chars.js` |
| `trace_plate.py`, `build_pilot.py` | The two-biome pilot |

`compose_world.py` builds the map in these steps:
1. It traces each map reference into a plate at the characters' density, removing name banners.
2. It makes sky and framing clouds transparent.
3. It places the plates on a diamond (east to west) over a per-biome base terrain, with a cloud sea outside.
4. It dithers plate borders into a shared edge band.
5. It derives the walk grid (4 px cells) and occluder blobs (with a base line).

The output is 512 px lossless WebP chunks in `tayduky/world/`.

55 characters are traced, about 50 px tall. Every one has an editable grid source in `docs/tayduky/art-pilot/src/chars/`.

### World runtime (`tayduky/`)

| File | Role |
|---|---|
| `index.html` | The page and HUD |
| `td-data.js` | Biome casts with roles, and the stories written as data (beat lists) |
| `td-sim.js` | DOM-free: agents, ambient behaviour, the Global Story Director, the beat interpreter |
| `td-main.js` | Chunked rendering, depth sort with occluders, water animation, FX, beacons, place cards, day/night, camera |

**Layout** (hybrid, as decided):

```
 W  Lôi Âm Tự | Hỏa Diệm Sơn / Nữ Nhi Quốc / Bàn Tơ Động | Bạch Cốt Lĩnh / Cao Lão Trang / Thông Thiên Hà | Thiên Cung / Lòng Bàn Tay Phật Tổ / Ngũ Hành Sơn | Hoa Quả Sơn  E
```

The 11 approved biomes are: Hoa Quả Sơn, Thiên Cung, Lòng Bàn Tay Phật Tổ (`btp`), **Ngũ Hành Sơn (`nhs`)**, Cao Lão Trang, Bạch Cốt Lĩnh, Nữ Nhi Quốc, Bàn Tơ Động,
Hỏa Diệm Sơn, Thông Thiên Hà and Lôi Âm Tự. The alpha had merged the palm and the mountain into one biome, because one reference
(`01_Phat_To_Ngu_Hanh_Son_map_reference.png`) holds both. `compose_world.py` now splits that reference in two:

| Biome | Source pixels kept | Removed | Position | Base terrain |
|---|---|---|---|---|
| `btp` (the palm) | x 0–1100 | the mountain (the `CUT` boxes) | middle row of column 4 (3100, 1130) | heavenly |
| `nhs` (the five-element mountain) | x 720 onwards | — | bottom row (3100, 1720), on the map's lower edge beside Thông Thiên Hà | blue-grey stone with moss |

Cut edges get the same ragged dither as plate borders. Adjacency follows design §2.3. The border-dither seed is now stable (`zlib.crc32`), not Python's per-run `hash()`.

The world is 4560 × 2280 px. Thông Thiên Hà has no map reference yet, so it is a procedural river.

**Living cast:** 117 characters (108 plus Ngũ Hành Sơn's 9), with these roles:

| Role | Behaviour |
|---|---|
| `wander` | Visits random spots, the gathering point or a neighbour |
| `hop` | Monkeys and spiderlings hop as they walk |
| `guard` | Patrols a beat between two posts |
| `pray` | Stays and bows |
| `static` | Never moves (cocoons, the Buddha) |
| `buried` | Wukong under Ngũ Hành Sơn: only the traced front frame down to the shoulders shows, behind a stone lip with moss. The signature frees him; he is back under the rock at the next peace, hidden by a puff of mist |

Idle characters sometimes **chat**: two neighbours face each other and trade pixel speech bubbles (♪ … ♥ ! ?). They also show emotes.

**Living Story Loop and Director** (design §6):
- Each biome cycles peace → foreshadow → signature → aftermath.
  - Peace lasts 150–330 s, foreshadow 35–55 s and aftermath 60–110 s, so one loop takes about 5–9 minutes.
  - During foreshadow, a coloured **beacon column** rises over the biome and is visible from far away, and nearby characters turn and react.
  - The aftermath leaves drifting petals or footprints.
- The Director allows **at most 5 signatures at once** and **never in two biomes that share a border**. The same story never repeats back to back.
- There are **15 stories**, written as beats (spawn, walk, gather, fx, strike, swap, chase, leave, disperse, plus bubble, face, free, bow):

| Biome | Stories |
|---|---|
| Hoa Quả Sơn | The King Returns, The Fruit Feast |
| Thiên Cung | Havoc in Heaven, The Peach Banquet |
| Lòng Bàn Tay Phật Tổ | The Palm Closes |
| Ngũ Hành Sơn | Tam Tạng Frees the Monkey: the talisman flickers, Tam Tạng arrives, pebbles burst, Wukong bows, and the two walk off the lower edge and fade |
| Cao Lão Trang | The Bride Is a Monkey, The Pilgrims Visit |
| Bạch Cốt Lĩnh | Three Disguises |
| Nữ Nhi Quốc | The Queen Meets the Monk |
| Bàn Tơ Động | The Seven Sisters' Net |
| Hỏa Diệm Sơn | The Palm-Leaf Fan (fire, then rain) |
| Lôi Âm Tự | The Scriptures Received, The False Thunderclap |
| Thông Thiên Hà | The Great Turtle |

**Mini events (the middle activity layer, design §4):** every biome has 2–4 small beat scripts. The same interpreter runs them as *runs*, which never count toward the Director's cap.
- They play only during peace, one at a time per biome, every 35–80 s (`TD_DATA.miniGap`).
- A starting signature ends any mini event in its biome.
- They gather a few nearby characters (`gather {n, char}`), show bubbles and use small FX.
- Examples:
  - Monkeys splash at Hoa Quả Sơn, and the old monkey tells a story.
  - At the palm, Wukong lands, turns his back to a finger and leaves a gold inscription and a little puff of steam.
  - At Ngũ Hành Sơn, birds circle the buried Wukong's head, monkeys visit him, he yawns and pebbles fall while children peek, and woodcutters pass.
  - The spider sisters bathe at Bàn Tơ Động, and fire flares at Hỏa Diệm Sơn.

**Natural recovery:** each biome leaves its own footprint for the whole aftermath, and a short recovery run tidies up.
- Footprints: fallen peaches, gold light, settled pebbles, big footprints, mist, lanterns, torn webs, ash and embers.
- Cast members who walked off or faded during a story come home at the next peace. The story resets; the world does not.

**Atmosphere:**
- **Water:** waterfalls get light bands that flow down; rivers get drifting glints.
- **Day/night:** a multiply grade with warm glows around fire, gold and lantern FX.
- **Place-name cards:** bilingual; each appears after the view settles in a biome for 2 s, and at most once every 3 minutes per biome.

## Tests

| Command | Result (2026-11-20) |
|---|---|
| `node tests/tayduky-world.mjs 60` (headless Chrome, speed ×10) | **PASS**: **11 biomes** (all approved ones present); max 4 concurrent signatures (cap 5); 0 adjacency violations; 13 stories started, including `nhs:freed`; all 11 reached their aftermath; every biome ran 4–7 mini events; every aftermath ran its recovery; Ngũ Hành Sơn freed Wukong once and re-buried him once; no console errors |
| `node tests/tayduky-world.mjs 50` after the final recompose | **PASS** (same checks) |

## Honest limitations (next steps)

1. **No walk cycles.** Characters bob 1 px while moving. Left-facing frames are mirrored, so held items swap hands. 3-view and 1-view characters reuse their frames.
2. **Hỏa Diệm Sơn's plate has characters painted into it** (Ngưu Ma Vương, the pilgrims). It needs a character-free reference. Thông Thiên Hà has no map reference (it is procedural).
   **Ngũ Hành Sơn** is the narrowest plate (509 × 689 px). It is half of the shared palm/mountain reference, and the area around it is plain stone base terrain.
   A dedicated, wider Ngũ Hành Sơn reference (character-free) would let it match the other biomes' size.
   It has no earth spirit (thổ địa) yet, because there is no traced sprite. Woodcutters, villagers, a novice monk and visiting monkeys stand in.
3. **Occluders are automatic** (object blobs of moderate size). Some trees and roofs merge with cliffs and do not occlude; a few blobs occlude slightly early or late.
   **Walk zones** are derived from ground colours, so characters can stand on some colour-alike surfaces.
4. **Seams:** the dithered edge bands work. Drifting cloud banks now sit on every border between biomes (`seamMist` in `td-main.js`), but some borders still show the plates' rectangular framing in places.
5. **Stories and mini events are short beat scripts**, not full sequences; mini events reuse the existing FX vocabulary and bubbles (no new character animation). There are no voice or music cues yet. The shared lofi radio and dock are not wired in (the page is standalone).
6. **Night:** the grade is simple. Plate lanterns do not glow (only FX glow). Weather per biome (flower rain, ash rain, fog) is not implemented as a mode, only inside stories.
7. **Not in the gallery:** the gallery frame host must be generalised first (World-Builder Guide §3.2).
8. **The design doc numbers** (tile sizes, 160 × 160 tiles) predate the plate-based hybrid. The map is now measured in pixels (4560 × 2280), and the design doc §2.1 should be updated.
9. **Performance** has not been benchmarked. Rendering is chunked and culled, and about 108 agents run cheaply, but water animation rewrites the visible chunks 10 times a second.

## Next checkpoint

1. Owner review of the 11-biome map: Ngũ Hành Sơn's placement and size, the palm's cut, and the mini events.
2. Character-free references for Hỏa Diệm Sơn and Ngũ Hành Sơn (wider), plus a Thông Thiên Hà map reference. These would replace the procedural river.
3. Walk cycles (needs frames from the owner's sheets). Weather per biome as a mode (flower rain, ash rain, fog).
4. Gallery and shared radio wiring (World-Builder Guide §3.2), then a frame-time benchmark.
