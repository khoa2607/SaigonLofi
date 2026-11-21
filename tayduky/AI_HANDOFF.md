# AI_HANDOFF.md — Tây Du Ký world

Updated 2026-11-20 after the integration of Buddha's Palm. Scope: Tây Du Ký only (`tayduky/`, `docs/tayduky/`, `tests/tayduky-*.mjs`). Read `AGENTS.md` (same folder) for rules, code map and commands.

## 1. Where things are
- Branch **`feature/tayduky-redesign-v2`** is the single integration branch (nothing merged into `main`, nothing pushed in this pass). It contains the 15-region map, **six built biomes** (hqs, btd, tc, btp, hds, sdl) and nine placeholders. World 124 x 124.
- Built: **Hoa Quả Sơn (`hqs`, rebuilt 2026-11-21 in `tw-hqs*.js`)**, **Bàn Tơ Động (`btd`)**, **Thiên Cung (`tc`, elevated jade terraces, Codex's redesign)**, **Lòng Bàn Tay Phật Tổ (`btp`, cloud sea with five finger pillars)**.
- Built last: **Hoa Diem Son (`hds`)**, authored in world space: see `docs/tayduky/v2/STATUS.md` (2026-11-21) and `tw-fire*.js`.
- Built after that: **Thông Thiên Hà (`tth`)** (`tw-river*.js`, STATUS 2026-11-23) and **Sư Đà Lĩnh (`sdl`)**, also world-space: `docs/tayduky/v2/STATUS.md` (2026-11-22) and `tw-lion*.js`.
- Placeholders (hatched development ground, no residents/stories): bcl, clt, hvd, lat, lhd (Hắc Phong Sơn, id `hps`, replaced Nữ Nhi Quốc and is built: tw-hps*.js). Their regions, masks, adjacency and the Director's rules are real.
- The source branch `feature/tayduky-buddha-palm` (`b8f2006`) is kept for now; its worktree was `E:/game/web-lofi/testFableLofi-palm`.
- Untracked and deliberately preserved: `tmp-tayduky-animation/`, `tmp-tayduky-review/` (owner decides about deleting).

## 1b. Footprint standard (read before designing any biome)
The world is **104 x 104** (`docs/tayduky/v2/FOOTPRINT.md`). A biome = active core + small support ring + short exits, **<= ~900 tiles** (placeholders are ~540 each). The four built biomes are authored in the old 160-tile *authoring space* and relocated by `tayduky/tw-layout.js` (rigid per-biome translations; Hoa Quả Sơn / Thiên Cung / Palm by (-57,0), Bàn Tơ Động by (-58,-76)). New biomes: either author in world space after the `TW_LAYOUT` block in `tw-map.js`, or add them to `tw-layout.js` (keep rule + offset). Use `TWM.layout.map(i, j)` for old-space coordinates; never hard-code tile coordinates in sim/render/tests.

## 2. Architecture notes that matter when editing
- Plain `<script>` order (see `tayduky/index.html`): `tw-layout.js` (footprint relocation, before tw-map) → `tw-palm.js` (map build hook, before tw-map) → tw-map → chars → sprites → tw-data → tw-sim → `tw-palm-data.js` → tw-art → `tw-palm-art.js` → tw-fx → `tw-palm-fx.js` → tw-render → tw-main. `tests/tw-load.mjs` mirrors this order for Node.
- The palm is hook-based: `TW_PALM_BUILD/TW_PALM_POST` (tw-map), `TWA.ext` (art), `TWFX.palm` (fx), `TWS.stepExt/opExt/pointExt/ACT/MINI` (sim). Shared files hold only the hooks.
- **Material ids** (tw-map `M`): PEACHLAWN 28 and BRONZE 29 belong to Thiên Cung; the palm's `SKYC`=30, `SKYD`=31, placeholders `PH`=32+ (renumbered in the merge — never reuse ids).
- Heights are levels of 4 world units; terrain is 2:1 isometric; map 160 × 160 with 15 BIO regions; `canStep` limits height steps.
- The palm's walkway along the east rim (to (146,36)) is what keeps Hoa Quả Sơn connected to the rest of the walkable world; do not remove it.
- Sprite manifest `tayduky/sprites/sprites.js` is generated: edit `docs/tayduky/v2/tools/sprite_picks.json`, then `python docs/tayduky/v2/tools/pack_sprites.py`; library docs via `build_library.py`. Characters: `pl_cast.json` → `pack_pl_chars.py --only <name>`.

## 3. Tests (all run from the repo root)
`node tests/tayduky-v2-map15.mjs`, `tayduky-v2-sim.mjs 900 <seed>`, `tayduky-v2-heaven-assets.mjs`, `tayduky-v2-heaven.mjs`, `tayduky-v2-story.mjs`, `tayduky-v2-shot.mjs "<query>" out.png ms w h` (query: `at=<biome>&tod=day|night&zoom=1&seed=7&force=<biome>&speed=2`).
Known failing, pre-existing: `tayduky-v2-pilot.mjs` (the legacy docs sandbox still spawns the removed `nhen_tinh` sheets).

## 4. Open items
- Wukong's `front-flip` (PixelLab char a84c7a10…) is generated but not packed; the somersault shows his normal pose.
- Palm fingers are stylised smooth pillars; the signature's divine column is boxy; grey placeholder terrain shows through south of the palm.
- Eleven regions are still placeholders; idle/sit/act are code-driven for most characters.
- `tayduky/alpha/` (traced-alpha prototype) is kept because `tests/tayduky-world.mjs` and docs still reference it; delete only together with that test.

- **Ngũ Hành Sơn (`nhs`)** is built (2026-11-25): `tw-nhs.js` (map), `tw-nhs-art.js` (terrain, seasonal overlays + sprite recolour), `tw-nhs-data.js` (seasons, residents, 10 minis, signature `five_hundred_years`), `tw-nhs-fx.js` (living effects, prison / seal, story camera). Details: `docs/tayduky/v2/STATUS.md`. Preview targets: `?at=nhs|nhsprison|nhssummit|nhsgate|nhsfall|nhseast|nhsrim|nhsborder|nhstail` (+ `&force=nhs&speed=3` for the signature).
- **Ngũ Trang Quán (`ntq`)** is built (2026-11-20): `tw-ntq.js` (map: axial terraces, relaxation + stair links, routes, props), `tw-ntq-art.js` (jade terrain, sprite kinds), `tw-ntq-data.js` (residents, 10 minis, tree state `TWS.ntq.tree`, signature `ginseng_fruit`), `tw-ntq-fx.js` (tree + fruit drawing, life, magic, caption, story camera). Details: `docs/tayduky/v2/STATUS.md`. Preview targets: `?at=ntq|ntqtree|ntqhall|ntqgate|ntqpond|ntqfall|ntqlook|ntqrear|ntqrim|ntqborder|ntqseam` (+ `&force=ntq&speed=3` for the signature).
- **Bạch Cốt Lĩnh (`bcl`) is built** (2026-11-22): `tw-bcl.js` (map: south pocket, east valley, north ridge, one road), `tw-bcl-art.js`, `tw-bcl-data.js` (`TWS.bcl`, 10 minis, signature `three_strikes`), `tw-bcl-fx.js`. Preview: `?at=bcl|bclgrave|bclclear|bclribs|bclpalace|bcllair|bclbridge|bcllook|bclpool|bclwest|bclseam|bclseamsouth|bclrim` (+ `&force=bcl&speed=3`). Characters `bgt_*` (girl, crone, elder, bone, skel).
- **btp hand (2026-11-22):** the hand is one code-painted sprite (`palmhand`, `tw-btp-fx.js` `paintHand`, SDF in `TWM.palm.geo` from `tw-btp.js`) over a hidden flat level-6 tilemap; do not rebuild fingers from terrain boxes. Gate shots: `tests/tayduky-v2-btp-hand.mjs`.
- **Lòng Bàn Tay Phật Tổ (`btp`) was rebuilt** (2026-11-22): `tw-btp.js` (map), `tw-btp-art.js` (overrides `TWA.ext` terrain painters), `tw-btp-data.js` (`TWS.btp`, 9 new minis, signature `buddha_subdues_wukong`), `tw-btp-fx.js` (replaces `TWFX.palm`). Preview: `?at=btp|btpfingers|btpbuddha|btpthumb|btpwrist|btpwest|btprim|btpseam|btpnorth|btpsouth` (+ `&force=btp&speed=3`). `tw-palm*.js` remain only for the shared `soar/flip/land/mount` steps.
- **Hoa Quả Sơn (`hqs`) was rebuilt** (2026-11-21): `tw-hqs.js` (map; purges the old pilot), `tw-hqs-art.js`, `tw-hqs-data.js` (state `TWS.hqs`, 14 minis, signature `great_sage_returns`), `tw-hqs-fx.js`. Details: `docs/tayduky/v2/STATUS.md`. Preview targets: `?at=hqs|hqsfall|hqscave|hqssource|hqscourt|hqsthrone|hqsvillage|hqssummit|hqsorchard|hqsyard|hqsgate|hqsbeach|hqslook|hqsrim|hqsborder|hqsseam` (+ `&force=hqs&speed=3` for the signature). The pilot's `TWM.hqs` record is kept (pool, throne, court, fallX ...).
