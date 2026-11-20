# Tây Du Ký — Huyền Thoại Sống: status

Branch `feature/tayduky-world`. Not merged to `main` and not linked from the gallery yet. Last update: 2026-11-20 (overnight autonomous session).

## How to run

Run `serve.bat` (or `python -m http.server 8765`) from the repo root, then open:

| URL | What |
|---|---|
| `http://localhost:8765/tayduky/` | **The world (alpha):** one map, 10 biomes, the living cast and the Story Director |
| `http://localhost:8765/tayduky/?at=hqs&tod=night&speed=4` | Start at a biome (`lat hds nnq btd bcl clt tth tc btp hqs`), force the time of day (`day dusk night`), speed up the simulation |
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
 W  Lôi Âm Tự | Hỏa Diệm Sơn / Nữ Nhi Quốc / Bàn Tơ Động | Bạch Cốt Lĩnh / Cao Lão Trang / Thông Thiên Hà | Thiên Cung / Phật Tổ·Ngũ Hành Sơn | Hoa Quả Sơn  E
```

The world is 4560 × 2280 px. Thông Thiên Hà has no map reference yet, so it is a procedural river.

**Living cast:** 108 characters, with these roles:

| Role | Behaviour |
|---|---|
| `wander` | Visits random spots, the gathering point or a neighbour |
| `hop` | Monkeys and spiderlings hop as they walk |
| `guard` | Patrols a beat between two posts |
| `pray` | Stays and bows |
| `static` | Never moves (cocoons, the Buddha) |

Idle characters sometimes **chat**: two neighbours face each other and trade pixel speech bubbles (♪ … ♥ ! ?). They also show emotes.

**Living Story Loop and Director** (design §6):
- Each biome cycles peace → foreshadow → signature → aftermath.
  - Peace lasts 150–330 s, foreshadow 35–55 s and aftermath 60–110 s, so one loop takes about 5–9 minutes.
  - During foreshadow, a coloured **beacon column** rises over the biome and is visible from far away, and nearby characters turn and react.
  - The aftermath leaves drifting petals or footprints.
- The Director allows **at most 5 signatures at once** and **never in two biomes that share a border**. The same story never repeats back to back.
- There are **14 stories**, written as beats (spawn, walk, gather, fx, strike, swap, chase, leave, disperse):

| Biome | Stories |
|---|---|
| Hoa Quả Sơn | The King Returns, The Fruit Feast |
| Thiên Cung | Havoc in Heaven, The Peach Banquet |
| Phật Tổ · Ngũ Hành Sơn | The Palm Closes |
| Cao Lão Trang | The Bride Is a Monkey, The Pilgrims Visit |
| Bạch Cốt Lĩnh | Three Disguises |
| Nữ Nhi Quốc | The Queen Meets the Monk |
| Bàn Tơ Động | The Seven Sisters' Net |
| Hỏa Diệm Sơn | The Palm-Leaf Fan (fire, then rain) |
| Lôi Âm Tự | The Scriptures Received, The False Thunderclap |
| Thông Thiên Hà | The Great Turtle |

**Atmosphere:**
- **Water:** waterfalls get light bands that flow down; rivers get drifting glints.
- **Day/night:** a multiply grade with warm glows around fire, gold and lantern FX.
- **Place-name cards:** bilingual; each appears after the view settles in a biome for 2 s, and at most once every 3 minutes per biome.

## Tests

| Command | Result (2026-11-20) |
|---|---|
| `node tests/tayduky-world.mjs 40 --shots` (headless Chrome, speed ×10) | **PASS**: 10 biomes, 108 characters; max 4 concurrent signatures (cap 5); 0 adjacency violations; all 14 stories started; every biome reached its aftermath; no console errors |

## Honest limitations (next steps)

1. **No walk cycles.** Characters bob 1 px while moving. Left-facing frames are mirrored, so held items swap hands. 3-view and 1-view characters reuse their frames.
2. **Hỏa Diệm Sơn's plate has characters painted into it** (Ngưu Ma Vương, the pilgrims). It needs a character-free reference. Thông Thiên Hà has no map reference (it is procedural).
3. **Occluders are automatic** (object blobs of moderate size). Some trees and roofs merge with cliffs and do not occlude; a few blobs occlude slightly early or late.
   **Walk zones** are derived from ground colours, so characters can stand on some colour-alike surfaces.
4. **Seams:** the dithered edge bands work. Drifting cloud banks now sit on every border between biomes (`seamMist` in `td-main.js`), but some borders still show the plates' rectangular framing in places.
5. **Stories are short beat scripts**, not full sequences. There are no voice or music cues yet. The shared lofi radio and dock are not wired in (the page is standalone).
6. **Night:** the grade is simple. Plate lanterns do not glow (only FX glow). Weather per biome (flower rain, ash rain, fog) is not implemented as a mode, only inside stories.
7. **Not in the gallery:** the gallery frame host must be generalised first (World-Builder Guide §3.2).
8. **The design doc numbers** (tile sizes, 160 × 160 tiles) predate the plate-based hybrid. The map is now measured in pixels (4560 × 2280), and the design doc §2.1 should be updated.
9. **Performance** has not been benchmarked. Rendering is chunked and culled, and about 108 agents run cheaply, but water animation rewrites the visible chunks 10 times a second.
