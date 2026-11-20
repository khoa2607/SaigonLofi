# Tây Du Ký v2 — footprint normalisation (2026-11-20)

Branch `feature/tayduky-redesign-v2`. Code: `tayduky/tw-layout.js` (+ a `TW_LAYOUT` block and a "gates" block in `tw-map.js`). Test: `node tests/tayduky-v2-map15.mjs`. Overview: `node tests/tayduky-v2-overview.mjs out.png` -> `screenshots/footprint/overview-before-after.png`.

## 1. Was the layout suitable for 15 biomes in practice? No.

The 160 x 160 world had 15 regions but 24,964 tiles (avg 1,664 per region). Only Hoa Quả Sơn (1,406) and Bàn Tơ Động (1,101) were authored at the intended density. Measured before the pass:

| Region | Tiles | Active (not plain sea / walkable / elevated / prop) | Verdict |
|---|---|---|---|
| Thiên Cung | 2,231 | 490 (22 %) | 78 % empty cloud sea |
| Buddha's Palm | 2,099 | 798 (38 %) | 62 % empty sea |
| Hoa Quả Sơn | 1,406 | 1,133 (81 %) | reference density |
| Bàn Tơ Động | 1,101 | 1,000 (91 %) | reference density |
| 11 placeholders | 615 - 3,321 (avg 1,950) | - | far too big; a viewer crossing one sees only hatched ground |

One screen (1920 x 1080, zoom 1, a 64 x 32 tile = 1,024 px^2) shows only about **2,025 tiles** (zoom 2: 506; 2560 x 1440 zoom 1: 3,600; 4K zoom 1: 8,100). With 1,664 tiles per region a wide view never showed more than 1-2 regions, mostly empty ones. The distance between built biomes (Thiên Cung to Bàn Tơ Động was ~130 tiles) was almost entirely placeholder.

## 2. Footprint rules (the standard from now on)

1. **Density reference:** Hoa Quả Sơn / Bàn Tơ Động (active share >= 80 %). A biome contains only: **active core + a small support ring + compact transition edges (short exits)**. Plain cloud / plain ground / padding terraces that do not serve silhouette, activity or traversal are removed.
2. **Size standard:** new biomes are planned at **<= ~900 tiles** (target 500 - 800; the placeholders are now 482 - 616). The hard maximum for a *designed* biome is the active core of Thiên Cung plus its ring (847 tiles). Hoa Quả Sơn (1,406) and Bàn Tơ Động (1,101) are **above** the standard but are the owner-approved reference and pinned by the pilot hash test, so they are left unchanged (a later, explicitly approved trim would be possible).
3. **Wide view:** at the default wide zoom a 1080p screen holds ~2,000 tiles, so a junction between regions shows **3-5 regions** (see `ntq-day.png`: Thiên Cung, Buddha's Palm, Hoa Quả Sơn and Bàn Tơ Động are all visible).
4. **Ring / exits:** Thiên Cung core rectangle (69,9)-(98,30) + ring 2 + level-1 exits within 4 tiles; Buddha's Palm = active art (cloud terraces, platform >= level 3, props, paths) + ring 1 (the cloud-tone seam band still fades 16 tiles into neighbours, so the sea reads as large without owning the tiles).
5. **Connectivity:** every trimmed built biome opens onto the world through one **ramped gate** (`TWM.gates`): the placeholder tiles running out from its border step down/up to level 1 with stairs.
6. **Adjacency is derived** from the final tile mask (never hand-written); the Director's rule (no simultaneous signatures in adjacent regions, <= 5 active) is unchanged.

## 3. What changed

| Item | Before | After | Why |
|---|---|---|---|
| World | 160 x 160 (24,964 tiles) | **104 x 104 (10,404 tiles)** | density; -58 % |
| Hoa Quả Sơn | 1,406 tiles | 1,406 (translated only) | reference |
| Bàn Tơ Động | 1,101 | 1,101 (translated only, moved next to the palm / below Thiên Cung) | reference |
| Thiên Cung | 2,231 | **847** | only active core + ring 2 + short exits |
| Buddha's Palm | 2,099 | **953** | only active art + ring 1; 4 palm dressing/edge lists remapped |
| Placeholders (11) | 615 - 3,321 | **482 - 616** (avg ~540) | re-planned: farthest-point seeds, area-balanced Lloyd relaxation, named by where each used to sit |
| Distance between built biomes | up to ~130 tiles | adjacent / one placeholder apart | |

Translations (authoring -> world): Hoa Quả Sơn + Thiên Cung + Buddha's Palm move **as one rigid block** by (-57, 0); Bàn Tơ Động by (-58, -76). Nothing is rotated or edited. `tests/tayduky-v2-map15.mjs` un-maps both pilot biomes and checks their tile lists and props against the pre-pass SHA-256 hashes (identical to commit 404b90f).

### Adjacency consequences
Edges 31 -> **32** (derived). Built-biome neighbours, before -> after:
- **Thiên Cung** `bcl, hqs, btp, clt` -> `bcl, hvd, ntq` : it **no longer touches Hoa Quả Sơn or Buddha's Palm** (a placeholder, NTQ, now sits between them), so the Director may run Thiên Cung and Palm signatures at the same time (previously forbidden by the adjacency rule). Thiên Cung stays reachable through its gate.
- **Buddha's Palm** `tc, hqs, nhs, clt, ntq` -> `hqs, ntq, nhs, clt, tth, lhd`.
- **Hoa Quả Sơn** `tc, btp, nhs` -> `hvd, nhs, ntq, btp`.
- **Bàn Tơ Động** `tth, nnq, sdl, lat` -> `hds, clt, lat, sdl`.
Placeholder names were matched greedily to the seed nearest to where each region used to sit, so the overall arrangement is only approximate and the placeholders' neighbours changed; the 15-biome review's adjacency table (`TAYDUKY-15-BIOME-REVIEW.md` section 3) is therefore **historical**: design each remaining biome against `TWM.adj` of the current build (printed by `node tests/tayduky-v2-map15.mjs`). The Director found no violations in 900 s runs on seeds 7, 21 and 33.

Other consequences: START camera points, 'mouthE' story points and test look-at points were authored in the old space and now go through `TWM.layout.map(i, j)`; sea/pocket tiles sealed between built biomes become empty sea of the neighbouring Palm / Thiên Cung; placeholder transition seams (`TWM.seam`, `edgeOther`) are recomputed in the new space.

## 4. Verified
`map15` PASS (15 regions, one component each, all reachable, Director with 15 regions); `sim 900` PASS on seeds 7, 21, 33 (no stuck agents, no teleports - Wukong's landing glide is now speed-limited); `heaven-assets`, `heaven` (both signatures, 60 fps median), `world 30` (no console errors) PASS. Screenshots: `screenshots/footprint/` (four biomes day/night, `ntq-day.png` and `clt-day.png` junction views, `overview-before-after.png`).

## 5. Limits / next
Placeholder terrain (hatched, level 1) now touches Thiên Cung and the Palm directly, so their sea edges show a visible cliff against it until the neighbours are built; the 11 placeholders are mask-only; Hoa Quả Sơn / Bàn Tơ Động are still above the size standard; the Palm's rim walkway to Hoa Quả Sơn is a dead-end strip (its link to the lanes lies outside the trimmed ring).

## Update 2026-11-21 - Hoa Diem Son (build first, size second)

The owner lifted the universal size ceiling: each new biome is built at the size its landmarks, activities and story need. **World 104 x 104 -> 124 x 124** (+20 rows and columns of free land; no existing biome moved or edited, `OFF_CLUSTER` / `OFF_BTD` unchanged). Hoa Diem Son is authored directly in world space (`tw-fire.js`) inside a footprint reserved by `tw-layout.js`.

| Biome | Tiles | Notes |
|---|---|---|
| Hoa Diem Son | **1,362** (about 900 walkable) | squircle core + two map-edge strips: it hugs the world's south-west corner so no dead wedge is left against the rim; the strips are composed (ruined shrine, lookout ledge, ash-basin vents, dead trees, broken ridge), not padding |
| the other 10 placeholders | re-planned on the remaining free land | still mask-only |

**Adjacency** (derived): HDS touches `hvd, btd, lhd, sdl`. The Director rules are unchanged (900 s runs, seeds 7, 21, 33: no adjacent simultaneous signatures). The village's east road ramps down to level 1 at the east edge so HDS stays connected (`map15`: all 15 regions reachable).

**Border blending (new rule).** A biome edge is a layered band, never a straight cut: (1) the volcano pushes OUT - placeholder tiles within 6 tiles become ash / scorched ground with dead trees and vents (`TWM.fire.out`); (2) the neighbour pushes IN - Ban To Dong's cave floor, glow patches and crystals creep into HDS's edge tiles, HDS slopes down to Ban To Dong's level in a talus band instead of ending at a cliff, and Ban To Dong's own ground gets dithered ash/ember staining within 3 tiles (`TWM.bleed`, colour only, geometry untouched); (3) the ridge along the rest of the edge is broken (shelves, notches). Screenshots: `screenshots/hds/hds-neighbours-wide-btd.png`, `hds-seam-close.png`, `hds-corner-wide.png`.

Frame-time note: headless frame time grows with world size (about 1.5 ms at 104, 6-12 ms at 124 on software GL); the gloom overlay is now clipped to the viewport. Re-check on a real GPU before adding more biomes.

## Update 2026-11-22 - Sư Đà Lĩnh

World stays **124 x 124**. Sư Đà Lĩnh takes **1,517 tiles** (squircle 47 x 39 at world (30, 84) plus the south rim strip, never over Hỏa Diệm Sơn's tiles); the other nine placeholders are re-planned around it. Hỏa Diệm Sơn's footprint grew by one row (`h` 39 -> 40, strip rule `b >= 34`) so its south strip reaches the rim row: that closed a one-tile placeholder sliver that was left under the volcano (the lhd mask was otherwise cut in two). Hỏa Diệm Sơn's authored content is unchanged.

**Adjacency** (derived): Sư Đà Lĩnh touches `hds, lhd, tth, nnq, clt`. Director rules unchanged: 900 s runs on seeds 7 / 21 / 33 have no adjacent simultaneous signatures. The valley road starts where Hỏa Diệm Sơn's east road ends (level 1) and leaves through the east edge at level 2, so the ridge is connected both ways (map15 PASS: 15 regions reachable).

**Border blending.** (1) Hỏa Diệm Sơn side: ash and scorched ground eat into the slate within 4 tiles of the border while cold slate creeps into the volcano's edge (colour only; geometry untouched). (2) Placeholders near the ridge turn slate and dead scrub with dead pines within 6 tiles and their seam tone blends toward slate (`TWM.seamK`). (3) The rim: every unbuilt tile within 14 tiles (including the world-rim wall) paints its cliff faces in slate with bone strata, mossy drips and an ink lip (`TWM.lionNear`, tw-art.js faceCol); where Hỏa Diệm Sơn is nearer, its scorched faces win.

## Update 2026-11-23 - Thông Thiên Hà

World stays **124 x 124**. Thông Thiên Hà takes **1,732 tiles** (squircle 46 x 39 at world (77, 84), the south and east rim strips, and the placeholder pocket between Sư Đà Lĩnh's corner and the west bank). Adjacent: `sdl, nhs, ntq, lhd`. Placeholders were re-planned over the smaller free land; `tests/tayduky-v2-map15.mjs` still passes (15 regions, global walk component, Director).
