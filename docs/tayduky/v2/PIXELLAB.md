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
