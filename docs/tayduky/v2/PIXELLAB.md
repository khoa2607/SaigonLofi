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
