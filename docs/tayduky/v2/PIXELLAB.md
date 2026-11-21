# PixelLab-generated object sprites (Tây Du Ký v2)

2026-11-20, refinement pass. Tool: PixelLab MCP `create_1_direction_object` (128-170 px, 4 candidates per job). The owner approved unrestricted use for this pass.
Balance before: 1,911.65 generations. After: 1,736.65 (**175 generations**: 15 jobs, 10-15 each).
Licence: output of the owner's PixelLab subscription, governed by PixelLab's Terms of Service (https://pixellab.ai/termsofservice). No reference images were supplied.
They are **objects only** (huts, trees, shrines...). Characters stay hand-authored (`docs/tayduky/v2/src/`), and terrain, cliffs, water and the other props stay code-painted.

All prompts began "isometric 2:1 view ... pixel art, dark plum outline, transparent background". Chosen candidates are packed by `tools/pack_sprites.py` (trimmed, never resampled) into `tayduky/sprites/`; raw candidates stay in `tayduky/sprites/raw/`.

| Runtime name | Job | Prompt subject | Picked frame |
|---|---|---|---|
| hut_a/b/c | 64e8709c | monkey village hut, round thatched roof on stilts | 0, 1, 3 |
| shrine_a/b/c | 0e249abe | small mountain pagoda, jade tiled roof | 0, 3, 1 |
| stall_a/b | 7d079980 | peach market stall with baskets | 0, 3 |
| bridge_a | f47ea782 | arched stone footbridge (not used yet) | 1 |
| crystals_a/b/c | cd4218c0 | violet and green crystal cluster in silk | 0, 1, 2 |
| tent_a/b | 7277f9bd | spider silk tent on dark rock | 1, 3 |
| altar_a/b | 97819ce3 | silk-wrapped egg altar | 1, 3 |
| silkbridge_a | 0caab83e | silk hanging bridge (not used yet) | 1 |
| peachtree_a-d | 1423100d | giant blossoming peach tree (160 px) | 0-3 |
| statue_a/b | 9de37e22 | stone monkey statue with golden staff | 0, 3 |
| playground_a | 77428071 | wooden monkey playground | 0 |
| hall_a/b | 4e334cf4 | Monkey King's mountain hall (170 px) | 1, 3 |
| spire_a/b | 3e2ddeec | silk-wrapped charcoal rock spire (160 px) | 0, 1 |
| mush_a/b | 4e93cb98 | giant teal glowing mushrooms | 0, 1 |
| bath_a | 274abac0 | hot spring bath terrace (not used yet) | 1 |
| loom_a | cd7a9fd8 | spider-sister weaving workshop | 0 |

## Pass 3 (2026-11-20): redesigned cast, animations and environment batch 2

Balance before this pass 1,736.65, after 1,553.65 (**183 generations**). Tier 1 allows 8 concurrent jobs, and each animated direction counts as a job.

**Characters** (`create_character`, mode v3, 64/60/56/48/44/36 px canvas, "low top-down", 2 generations each) plus `animate_character` template `walking-8-frames` for south, west, east and north (1 generation per direction). Idle is code-driven from a standing walk frame with a 1 px breath (`tools/pack_pl_chars.py`). IDs are in `tools/pl_cast.json`.

| Runtime name | Design |
|---|---|
| wukong | Great Sage look: purple-gold phoenix-wing cap with two very tall curved feathers, golden chain armour, red cape, tiger skirt, tail, ruyi staff |
| khi_linh, khi_lao, khi_con (36 px), khi_dan, khi_dan_b | jade-armoured guard with red plume and spear; grey elder with white beard and cane; baby monkey; two villagers |
| tam_tang | gold five-panel crown, red-and-gold kasaya, ringed staff |
| sister1_violet ... sister7_indigo | seven spider sisters, humanoid with four spider legs from the back: violet eldest (twin buns), teal scholar, rose dancer, amber warrior, crimson huntress, silver ghostly weaver, indigo trickster |
| nhen_con, nhen_con_b | two spiderling demons (charcoal, silver) |

**Objects, batch 2** (`create_1_direction_object`): btd_cave `b1d8713a` (160 px), hqs_gate `e533cf17`, hqs_bamboo `0b3b4d04`, hqs_scholarrock `388d2184`, hqs_lantern `60ec1c13` (96 px), btd_silkrack `0550e900`, btd_rockarch `f40e6a12`, hqs_lotus `9f3eb76a` (96 px).
Two objects from batch 1 were first used here: the stone bridge (HQS stream) and the silk bridge (BTD chasm).

## Animation follow-up (2026-11-20)

Balance before 1,553.65; after 1,514.65 (**39 generations**). Generated four-direction eight-frame v3 `staff-practice` for Wukong and `silk-weaving` for each of the seven sisters, plus a four-direction Wukong `breathing-idle` trial. The trial is retained in the source ZIP, but the runtime keeps the existing walk-derived idle to avoid a size jump. Source ZIPs and `tools/pack_actions.py` reproduce the dedicated action sheets. The v3 action canvases are larger than the original walk drawings; the packer matches their per-direction scale with nearest-neighbour resizing and uses a fixed pivot, checking every frame for clipping. This can discard pixel detail and is a candidate for a native-scale hand polish pass. The generated movement is interpretive, especially subtle in some weaving views; it is not a literal loom interaction in every frame.

## Thiên Cung batch (2026-11-20)

Balance before **1,514.65**, after **1,424.65**: **90 generations**. Four 1-direction object jobs: `tc_gate` 1348df9c-fd22-4f79-a2d3-064b19b2616b (candidates 0,3), `tc_palace` eac2e662-4acc-4b2f-a21a-f7d8f5790bfc (0,2), `tc_furnace` e52bfc0f-9baa-418e-b535-79e96ccb868f (0,2), `tc_bridge` 3c8beb65-71cd-4383-9b1b-675f40426477 (0,1). Raw candidates remain in `tayduky/sprites/raw/`, selected PNGs and anchors are packed by `pack_sprites.py`.

Four v3 characters: fairy `92823905-342c-4c44-a8cf-a372cfe38c7c`, heavenly guard `4e0ff6f3-e76a-4717-bcc2-f48bf6dfbbae`, Lao Jun `5f63cdc4-e55b-45b2-b7b1-7a1b4d6dc309`, Wukong `6810cd87-6f4d-45d0-890f-98ffdbdc134a`. Each has eight walk frames in four runtime directions. Dedicated four-direction actions were generated for fairy picking, guard salute and Lao Jun tending. The fairy breathing-idle trial is in its ZIP but is not used: the runtime derives idle from the walking art to prevent a rotation-to-walk size jump. Source ZIPs, `pl_cast.json`, `pack_pl_chars.py` and `pack_actions.py` make the sheets reproducible. Action-sheet nearest-neighbour size matching can discard detail; visual approval remains needed. Existing trees and lanterns were initially reused, then replaced in TC by the Heaven-specific follow-up below.

Heaven-specific follow-up: balance **1,424.65 → 1,399.65**, **25 generations**. Immortal peach tree `c4da708e-70b5-4cb8-8011-3e3a9163e8af` and heavenly lantern `380f2729-04ed-4c8f-af22-5a45571a15ae`, candidates 1 and 2 for both. Raw candidates and the packed sprite variants are preserved in the local library. Combined Heaven expenditure: **115 generations**.

## Lòng Bàn Tay Phật Tổ batch (2026-11-20, branch `feature/tayduky-buddha-palm`)

Balance before **1,392.65**, after **1,209.65**: **183 generations** (incl. 4 for the attendant walk). Everything else in the biome (the five finger pillars with their curl frames, the cloud-terrace terrain, mist, god rays, inscription, the divine column, the Five Elements vision) is procedural code, not PixelLab.

- `create_1_direction_object`: seated Buddha on a lotus throne with halo (`buddha_a`), cloud banks (`pcloud_a-d`, `pcloudw_a` long drifting layer, `pcloudt_a/b` tall billow towers), dharma wheel (`pwheel_a`), lotus on cloud islands (`plotus_a/b`), hanging bell (`pbell_a`), cluster of lanterns (`plantern_a`), Wukong's cloud mount (`pride_a`), mist puff. Candidates picked and trimmed by `tools/pack_sprites.py` from `tools/sprite_picks.json`; raw downloads in `tayduky/sprites/raw/palm*.png`.
- `create_character` v3 `palm_attendant` 03c3b2e3-74e1-4e97-ab54-7063c279866e (52 px, white-and-gold lotus attendant) + `animate_character` template `walking-8-frames` south/west/east/north (jobs 5ff0a3f6, eba7c97c, 9671e9bf, f1fdcb45). Packed with `pack_pl_chars.py --only palm_attendant`.
- A Wukong `front-flip` (character a84c7a10-ea6b-4ccf-8eca-a565051e508c) was generated for the somersault but is **not packed yet**: the somersault currently shows his normal pose over the cloud with the in-engine flip state; packing it needs an `anim.flip` column table (`TWR.A.flip`) and a Wukong re-pack.

## Hỏa Diệm Sơn batch (2026-11-21)

Balance before **1,209.65**, after **991.65**: **218 generations**. Tier 1 = 8 concurrent jobs (each animated direction is a job); all prompts began "isometric 2:1 view pixel art ... dark plum outline, transparent background".

**Objects** (`create_1_direction_object`; >=171 px = one candidate, 10 gens; <=170 px = 4 candidates): `hds_palace` f7b88248 (224, first gate, superseded), `hds_volcano` 887ef541 (224, superseded), `hds_bridge` 912e3dfb (160, lava stone bridge, kept), `hds_oven` b5190b59, `hds_stall` 4487cffa, `hds_hut` e3e5038f, `hds_vent` 5158a830 (first vents, superseded), `hds_fanshrine` 40aa8bee, `hds_crates` 25d8dddc, `hds_lantern` 61c07856, `hds_tree` 26e5589a, `hds_rock` 3f351d47, `hds_ruin` b4815ad0, `hds_spire` 3f907437 (unusable, cropped; not packed), and the hero pass after review: **`hds_gate_big` 91ec4631 (256, the grand fiery gate, now the palace entrance)**, **`hds_volcano_big2` 1173c632 and `hds_volcano_big` 350919c6 (256, the two great volcanoes)**, `hds_vent_nofire` f3b2a667 (flameless lava-pool vents; the fire is code-animated).

**Characters** (v3 `create_character`, 2 gens each, + `animate_character` template `walking-8-frames` south/west/east/north = 4 gens): tiefan 2cbdc588 (60 px; plus `fireball` 4 dirs, packed as `act`), bajie 7af61907 (60), hds_baker 4ca20190 (52), hds_seller b26fa722 (52); mule a32d7d87 (`standard`, quadruped horse template, 1 gen, + `walk-8-frames`). Wukong reuses the existing `wukong` sheet.

Packed with `tools/sprite_picks.json` -> `pack_sprites.py` (raw frames in `tayduky/sprites/raw/hds_*`) and `tools/pl_cast.json` -> `pack_pl_chars.py` (the `casting_*` clip name was added to the `act` list).

Follow-up (2026-11-21): `sa_tang` 1cab0b0a-2e39-437f-ac3d-4d1394b5d445 (Sha Wujing, v3 60 px, 2 gens + 4 for `walking-8-frames`); balance 991.65 -> 985.65. Tam Tạng reuses the existing `tam_tang` sheet.

## Sư Đà Lĩnh batch (2026-11-22)

Balance before **985.65**, after **809.65**: **176 generations** (target <= 500 per cycle). All prompts began "isometric 2:1 view pixel art ... dark plum outline, transparent background".

**Objects** (`create_1_direction_object`): 256 px, one candidate, 10 gens each: `sdl_gate` 684952d7 (skull fortress gate), `sdl_keep` bd3d6841 (lion-head pagoda keep), `sdl_nest` a158aacf (golden roc nest on a crag), `sdl_den` e3d162cc (Thanh Sư's lion-mouth den), `sdl_tusk` 09ce5eea (Bạch Tượng's ivory tusk hall). 128 / 96 / 64 px, 4 candidates, 10 gens each, one or two kept: `sdl_tent` d5139cf0 (candidates 0, 2), `sdl_banner` 1a05f2d8 (0, 3), `sdl_rack` 4f85cd36 (rack + war drum, 2), `sdl_brazier` 6aa05146 (green witchfire bowl, 0, 5), `sdl_bridge` 1d8b2458 (rope-and-plank bridge, 0), `sdl_pine` ab867c7c (0, 2), `sdl_rock` 5fa785cd (1, 3), `sdl_totem` e90cda48 (skull totem, 1).

**Characters** (v3 `create_character`, 2 gens + `animate_character` templates, 1 gen per direction, 4 directions): `thanh_su` 54bb0bc8 (72 px; walking-8-frames + cross-punch), `bach_tuong` 220601ab (76 px; walking + two-footed-jump), `kim_si` 3e75f88c (72 px; walking + fireball), `sdl_guard` f064ecfc (52 px; walking + cross-punch), `sdl_porter` ec7a79fa (48 px; walking). The three kings are drawn at normal size and are scaled x2 (integer) in the signature (`a.scale`, tw-render.js).

Packed with `tools/sprite_picks.json` -> `pack_sprites.py` and `tools/pl_cast.json` -> `pack_pl_chars.py` (`cross_punch*` and `two_footed_jump` were added to the `act` list; PixelLab names the clips `cross_punch_attack` / `two_footed_jump`).

## Thông Thiên Hà batch (2026-11-23)

Account balance before **809.65**, after **589.65**; this biome's own generations: **183** (the rest of the 220 drop came from other jobs on the account). Target <= 500 per cycle.

**Objects** (`create_1_direction_object`, "isometric 3/4 view pixel art, dark outline"): 256 px, 10 gens: `tth_turtle` d9ece2c7 (divine golden turtle) + `animate_object` swim 8 frames (8 gens), `tth_dock` 498c7d2e (ferry station + pier), `tth_shrine` b72c703d (river-god shrine on a rocky islet), `tth_tower` 4edd0703 (signal pagoda). 128/96 px (4 candidates, 10 gens): `tth_boat` c2a33921, `tth_hut` 4352a669, `tth_willow` 3eb74d09, `tth_rocks` 8f433d64, `tth_netrack` a7c0c12d, `tth_reeds` cb441203, `tth_statue` f4b40060. 170 px (15 gens): `tth_wreck` d5097144, `tth_gate` c2158936. Candidate frames were downloaded from the review packs (`tayduky/sprites/raw/tth_*_<n>.png`); the turtle swim frames live in `tayduky/sprites/anim/` (uncropped 256 px, drawn by `tw-river-fx.js`).

**Characters** (v3, 2 gens each + template clips, 1 gen per direction x 4): `tth_fisher` 836a8df9 (walking + throw_object), `tth_ferryman` cd2267c4 (walking + picking_up), `tth_imp` 1e2bb695 (walking + cross-punch). `bach_long_ma` 81bb1816: **standard quadruped horse, 1 gen** + walk-8-frames. The clips are named `throw_object` / `picking_up` in the zip (added to the packer's `act` list).

## Hắc Phong Sơn batch (2026-11-24)

Balance before **589.65**. All prompts began "isometric 2:1 view pixel art, dark plum outline, transparent background".

**Objects** (`create_1_direction_object`): 256 px, 1 candidate, 10 gens each: `hps_temple` fcbace5d (great hall), `hps_ruin` 534268a0 (burnt and collapsed hall), `hps_scaffold` 06aa9954 (hall under reconstruction), `hps_pagoda` 22ad05e5 (five-tier scripture pagoda),
`hps_gate` fea41389 (shanmen), `hps_lair` ee45f74d (bear-mouth cave), **`hps_giantbear` 39ca7578 (the GIANT black bear, true form)** + five `animate_object` v3 animations (8 frames -> 9 stored, 1 direction each): walk (stomping), roar, swipe, slam, hurt -> `tayduky/sprites/anim/hps_giantbear_<anim>_<n>.png`.
128 / 96 / 64 px (4 or 16 candidates, 10 gens, 1-3 kept): bell tower, dormitory, kitchen, incense burner, black pine, cliff pavilion, stupa with prayer flags, basalt rocks, way-shrine, well, sutra pavilion, bamboo, maple, stone lantern.
**Characters** (v3 `create_character`, 2 gens, + `animate_character` templates, 1 gen per direction x 4): `hps_monk` c8b221bf (walking + picking-up), `hps_novice` 46648ad4 (walking), `hps_abbot` 9f7e29d4 (walking), `hac_hung_tinh` 3c9c7b7d (humanoid demon king, 88 px; walking + cross-punch),
`hps_minion` e086bebc (walking + throw-object), `guanyin` 23cf3def (walking). The giant bear is a separate sprite (not the humanoid scaled up); its transformation / dissolve smoke, shockwave, aura, golden binding and every environmental reaction are code.
Packed with `tools/sprite_picks.json` -> `pack_sprites.py` and `tools/pl_cast.json` -> `pack_pl_chars.py`.

## Ngũ Hành Sơn batch (2026-11-25)

Balance before **192.65**, after **120.65** (72 generations). Prompts: pixel art, 3/4 isometric view, transparent background.
**Objects** (`create_1_direction_object`): `nhs_summit_seal` 66e34059 (256 px, 1 candidate, 10 gens: the summit crag with its shrine; the golden seal is drawn by code so it can lift), `nhs_wukong_prison` bc99209b (128 px, 4 candidates, 10 gens; frames 1 and 2 kept as 677da1ab / 2cf64e05),
`nhs_tree_a` fe6e7890 and `nhs_tree_b` 065aa917 (96 px, 4 candidates, 10 gens each; 2 kept from each: four broadleaf trees recoloured by code into blossom / summer / russet / bare). Animations (`animate_object` v3, 8 frames -> 9 stored, 2 gens each): `idle`, `struggle`, `hope`, `plead` (regenerated once so the rock matches) on 677da1ab -> `tayduky/sprites/anim/nhs_prison_<anim>_<i>.png`.
**Characters:** v3 `create_character` (2 gens) + `walking-8-frames` south / west / east / north (1 gen each): `wk_pilgrim` 9a703216 (56 px: the simple 1986-style pilgrim, no armour), `nhs_hermit` 26abea7c (52 px); standard quadrupeds (1 gen) + `walk-8-frames`: `nhs_deer` 3b9b26a8 (horse template), `nhs_goat` dd603767 (dog template). The white horse reuses the existing horse character (id 81bb1816 packed again as `nhs_horse`): an ordinary white horse, not yet the dragon horse. Packed with `pack_pl_chars.py --refresh --only ...`; `tools/pl_cast.json` and `tools/sprite_picks.json` updated.
Seasons, snow, blossoms, clouds, birds, the seal, the burst, the ghost return and the caption are code.

## Ngũ Trang Quán batch (2026-11-20)

Balance before **120.65**, after **82.65** (38 generations). Prompts: pixel art, 3/4 isometric view, transparent background.
**Objects** (`create_1_direction_object`): `ntq_ginseng_tree` 5ef81222 (256 px, 1 candidate, 10 gens: colossal ancient ginseng tree, gnarled trunk, exposed roots, jade-teal crown with pink-white blossoms, no fruit: the baby-shaped fruit are drawn by code so they can swing, glow and fall), `ntq_hall` 41c4d0e0 (128 px, 4 candidates, 10 gens; frames 0 and 3 kept as ad8e708d / 388b7a48 -> `ntq_hall_a/b`).
**Characters:** v3 `create_character` (2 gens each) + `walking-8-frames` south / west / east / north (1 gen per direction): `ntq_zhenyuan` 6ecd45c4 (56 px, elderly Daoist immortal, white beard, black-gold crown, jade and cream robes, horsetail whisk), `ntq_qingfeng` d69d8aa6 (44 px chibi, azure robe), `ntq_mingyue` 7c162c0a (44 px chibi, white and rose robe). Packed with `pack_pl_chars.py --refresh --only ...`; `tools/pl_cast.json` and `tools/sprite_picks.json` updated. Everything else (Heaven pavilions, peach trees, lotus ponds, lanterns, bridges, bamboo, scholar rocks, Guanyin, Tang Sanzang, Bajie, Sha Seng, Wukong in pilgrim robes) reuses existing sheets.
The fruit, the aura, the talisman, the ropes, the nectar, Guanyin's light, the wave of life, the feast, the koi, cranes, rabbits and all weather are code.
