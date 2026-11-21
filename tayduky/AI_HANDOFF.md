# AI_HANDOFF.md — Tây Du Ký world

Updated 2026-11-20 after the integration of Buddha's Palm. Scope: Tây Du Ký only (`tayduky/`, `docs/tayduky/`, `tests/tayduky-*.mjs`). Read `AGENTS.md` (same folder) for rules, code map and commands.

## 1. Where things are
- Branch **`feature/tayduky-redesign-v2`** is the single integration branch (nothing merged into `main`, nothing pushed in this pass). It contains the 15-region map, **six built biomes** (hqs, btd, tc, btp, hds, sdl) and nine placeholders. World 124 x 124.
- Built: **Hoa Quả Sơn (`hqs`)**, **Bàn Tơ Động (`btd`)**, **Thiên Cung (`tc`, elevated jade terraces, Codex's redesign)**, **Lòng Bàn Tay Phật Tổ (`btp`, cloud sea with five finger pillars)**.
- Built last: **Hoa Diem Son (`hds`)**, authored in world space: see `docs/tayduky/v2/STATUS.md` (2026-11-21) and `tw-fire*.js`.
- Built after that: **Thông Thiên Hà (`tth`)** (`tw-river*.js`, STATUS 2026-11-23) and **Sư Đà Lĩnh (`sdl`)**, also world-space: `docs/tayduky/v2/STATUS.md` (2026-11-22) and `tw-lion*.js`.
- Placeholders (hatched development ground, no residents/stories): bcl, clt, hvd, lat, lhd, ntq (Hắc Phong Sơn, id `hps`, replaced Nữ Nhi Quốc and is built: tw-hps*.js). Their regions, masks, adjacency and the Director's rules are real.
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
