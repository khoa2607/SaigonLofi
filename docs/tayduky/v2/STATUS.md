# Tây Du Ký v2 — status: the living isometric world (vertical slice)

Branch `feature/tayduky-redesign-v2`. Not merged to `main`. Last update: 2026-11-20.

Hoa Quả Sơn, Bàn Tơ Động and Thiên Cung now have runtime activity and stories; twelve other regions are development placeholders. The 15-region framework and the Heaven milestone below supersede the older two-biome counts in historical sections. All visual work remains subject to owner review.

## 15-region framework and Thiên Cung (2026-11-20)

The 160×160 grid now assigns 15 named masks, including Ngũ Trang Quán, Hỏa Vân Động, Liên Hoa Động and Sư Đà Lĩnh. HQS and BTD terrain, walkability and static-prop snapshots match the pre-change hashes. Unbuilt cells have provisional path connections, a reserved Thông Thiên Hà river corridor and placeholder colour transition bands; these are not finished biome geography. The Director's adjacency is derived from actual four-neighbour mask boundaries. The measured graph has 31 edges, not the conceptual graph in the review report. A 15-region synthetic Director stress run reached five simultaneous active/fore regions, with zero adjacency violations and all 15 started.

Thiên Cung uses independent PixelLab gate, palaces, furnace and jade bridges, with a cloud channel, orchard, lights, smoke, swaying peach trees, petals and flying crane silhouettes. It has 15 residents: eight fairies, five guards, Lao Jun and a local Wukong. Six ambient task types, three mini-events and the Havoc in Heaven/Peach Banquet stories use the existing simulation and recovery system. Detailed story choreography is still simplified: soldiers hop rather than individually tumble, and the banquet table has only a basket; art/animation need visual review. The new actions include fairy harvest, guard salute and furnace tending; other idle uses scale-matched walk-derived breathing. See `PIXELLAB.md` for sources and the 115-generation batches.

`tests/tayduky-v2-map15.mjs` checks region connectivity, actual adjacency, HQS/BTD snapshots, TC points of interest and the all-region Director stress case. The interior areas in tiles are LAT 1533, HDS 1389, NNQ 1818, BTD 1101, BCL 2784, CLT 2378, TTH 3321, TC 2231, BTP 2099, NHS 2187, HQS 1406, NTQ 615, HVD 788, LHD 662, SDL 652. These sum to the 158×158 interior; rim tiles are void. TC has 15 checked reachable POIs. Existing HQS/BTD have some disconnected walkable tiles (778/791 and 634/656 reachable from the chosen component); their geometry was deliberately preserved. The BTP placeholder has one isolated walkable tile. A global four-neighbour walkability component reaches all 15 regions, but five shared borders have no direct walkable crossing: HQS–TC, HQS–NHS, BTD–NNQ, BTD–SDL and BTD–LAT. Alternative routes exist in the grid; normal resident pathfinding remains biome-restricted. Future authored borders need review rather than modifying the two protected biomes now.

Actual adjacency (shared cardinal tile edges, not walkability):

| Region | Neighbours |
|---|---|
| LAT | HDS, NNQ, SDL, BTD |
| HDS | BCL, HVD, CLT, NNQ, LAT |
| NNQ | CLT, HDS, LHD, LAT, TTH, BTD, SDL |
| BTD | TTH, NNQ, SDL, LAT |
| BCL | TC, HDS, HVD, CLT |
| CLT | TC, BTP, BCL, NTQ, HDS, NNQ, LHD, NHS, TTH |
| TTH | NHS, CLT, NNQ, BTD |
| TC | BCL, HQS, BTP, CLT |
| BTP | TC, HQS, NHS, CLT, NTQ |
| NHS | HQS, BTP, CLT, TTH |
| HQS | TC, BTP, NHS |
| NTQ | BTP, CLT |
| HVD | BCL, HDS |
| LHD | CLT, NNQ |
| SDL | NNQ, LAT, BTD |

The original D11 request to see 3–5 biomes at widest zoom remains unmet; camera and zoom are unchanged. The 15-mask overview screenshot is a diagnostic, not an in-game wide view. Weather/seasons, fully animated clouds/banners and detailed interactions remain incomplete; the 12 other biomes are still placeholders. Screenshots and measured test results are recorded in the milestone handoff.

Validation on 2026-11-20: `node tests/tayduky-v2-sim.mjs 900 7` and `900 31` passed for all three active biomes, both Heaven signatures, all three Heaven minis and six activity types; no blocked agents, teleports or adjacent active signatures were reported. Heaven litter fell from 18 to 0 and 10 to 0 in seed 7, and 18 to 0 and 10 to 1 in seed 31, during observed after phases. The scheduler now lets a jumping resident land before story departure; interrupting that jump had stranded Wukong and caused a later teleport. `node tests/tayduky-v2-world.mjs 60 --shots docs/tayduky/v2/screenshots/thien-cung-pass` passed with all three active biomes and no console errors. `node tests/tayduky-v2-heaven-assets.mjs` verified the four walk sheets, three action sheets, loaded TC landmarks and finite depth keys. `node tests/tayduky-v2-heaven.mjs` captured both Heaven stories and the diagnostic map. In its headless Chrome run, zoom 1 and zoom 2 each sampled 16.7 ms median/p90 animation-frame intervals; canvas script time was 0.5 ms median at both, with p90 0.6 ms at both. These are environment-specific samples, not a mobile, GPU or worst-case guarantee.

## Refinement pass 2 (2026-11-20): tighter, denser, more alive

Owner review: layout, camera angle and zoom approved; the waterfall stays; quality about 60 %. The asks were:
- **A smaller footprint.** The camera, zoom, characters, landmarks and the waterfall are *not* shrunk.
- **No dead filler.**
- **Richer art.**

**Footprints (the map stays 160 × 160).** Each built biome now has a warped ellipse mask, `MASK` in `tw-map.js`.
- Tiles outside the mask go to the nearest neighbouring cell, so the freed space is reallocated to the neighbours and is available for future biomes.
- Hoa Quả Sơn: about 36 × 36 tiles of land (it was about 50 × 45).
- Bàn Tơ Động: about 39 × 38 tiles (it was about 44 × 40), with nothing hidden in its corners.
- The two masks are independent per-biome sizes (a showcase biome can be large, a compact one small), and the nine other cells are **provisional**: flat ground with no authored geography.
- The seam band (`TWM.seam`) blends neighbour ground toward the built biome's colours, so borders carry both palettes. No other biome has been added or locked.

**Art (PixelLab objects plus code art).** 15 PixelLab jobs (175 generations, see `PIXELLAB.md`) supplied the landmark sprites. Terrain, cliffs, water and characters stay our own.
- *Hoa Quả Sơn:*
  - The Monkey King's hall on a cliff platform beside the waterfall.
  - A second pavilion.
  - A statue lookout.
  - A village of four stilt huts.
  - Two peach market stalls.
  - A wooden playground.
  - A big stone Wukong statue by the stream.
  - An orchard of giant blossoming peach trees, and blossoming trees on the cliff tops.
- *Bàn Tơ Động:*
  - Weaving workshops.
  - Silk tents.
  - An egg altar.
  - Crystal groves, both on the floor and on the cliff tiers.
  - Giant mushrooms.
  - Silk-wrapped spires.
  - A walkable **hanging gallery** (a ledge with lanterns and crystals) along the back wall, reached by four stairs.

**Activity in the former empty zones.** Everything below is simulated, not decoration.

| Place | New life |
|---|---|
| Cliff platforms, shrines, statue (HQS) | Monkeys climb the stairs and pray, sit and meditate at the shrine and statue |
| Monkey village (HQS) | Residents walk to a hut door, fade inside and come back out (longer stays at night) |
| Market stalls and meadow (HQS) | Monkeys haggle, carry peaches away and sit to eat them |
| Playground (HQS) | Kids climb the frame, hang there and drop down hopping |
| Beach (HQS) | Monkeys fish: they cast, splash, catch a fish and carry it |
| Cliff faces (HQS and BTD) | Monkeys and spiderlings **crawl up and along the rock faces** at the foot of the cliffs |
| Orchard (HQS) | Eating, climbing and fruit-raid events moved into the new orchard |
| Gallery, tents, altar, crystals (BTD) | Sisters tend the egg altar, gather crystals from the groves and carry them to the altar, and retire to the tents |

The activity set grew from 14 to 22 kinds. The simulation test passes on 4 seeds.

Preview: `http://localhost:8765/tayduky/` (Hoa Quả Sơn), `…/tayduky/?at=btd` (Bàn Tơ Động), `…/tayduky/?at=btd&tod=night`.
Screenshots: `docs/tayduky/v2/screenshots/` (`*-day`, `*-night` at zoom 2, and `*-wide-*` at zoom 1, which show the neighbouring cells).

Known limits of this pass:
- Neighbour cells are still flat hatched placeholders, though softened by the seam band.
- The AI object sprites are denser than the characters.
- Cliff crystals on the BTD tiers are a little repetitive.
- The AI stone and silk bridge sprites and the bath sprite are packed but not yet placed.

## How to run

Run `serve.bat` (or `python -m http.server 8765`) from the repo root, then open:

| URL | What |
|---|---|
| `http://localhost:8765/tayduky/` | **The world.** Starts in Hoa Quả Sơn. Drag to pan, use the mouse wheel or ＋/－ to zoom (integer steps), and the arrow keys to move. |
| `http://localhost:8765/tayduky/?at=btd&tod=night` | Start in Bàn Tơ Động at night (`at`: `hqs`, `btd`, `fall`, `spring` or any biome id; `tod`: `day`, `dusk`, `night`) |
| `…/tayduky/?force=hqs,btd&speed=4` | Dev only: start both story loops now and run the simulation 4× faster |
| `…/tayduky/?debug=1` (or press `g`) | Nav grid (green walkable, red blocked), stairs, agent anchors and paths |
| `http://localhost:8765/tayduky/alpha/` | The traced alpha (legacy, kept intact) |
| `http://localhost:8765/docs/tayduky/v2/` | The approved character pilot page |

Screenshots (1920 × 1080, zoom 2) are in `docs/tayduky/v2/screenshots/`:
- `hoa-qua-son-day`, `hoa-qua-son-night`, `hoa-qua-son-king-returns`
- `ban-to-dong-day`, `ban-to-dong-night`, `ban-to-dong-sisters-net-night`

## Architecture (Saigon/Holdfast principles; original art)

| File | Role | DOM |
|---|---|---|
| `tayduky/tw-map.js` | The persistent 160 × 160-tile map. See below. | no |
| `tayduky/tw-art.js` | Terrain and prop art. See below. | canvas |
| `tayduky/tw-data.js` | Residents, role activity weights, mini event lists, stories as beats (signature, foreshadow, recovery) | no |
| `tayduky/tw-sim.js` | Residents with step queues, ambient activities, mini events, the Director and the Living Story Loop | no |
| `tayduky/tw-fx.js` | Story and ambient effects, foreshadow beacons, litter, night light around characters | render |
| `tayduky/tw-render.js` | Chunked ground, one depth sort, occlusion and lighting. See below. | yes |
| `tayduky/tw-main.js`, `index.html` | Boot, the fixed 0.1 s simulation step, camera, time of day, place-name cards | yes |
| `tayduky/chars/` | The v2 character sheets, built by `docs/tayduky/v2/tools/build_chars.py` | — |

**`tw-map.js`** builds the persistent map:
- **Projection:** the shared `isoX = x − y`, `isoY = (x + y)/2 − z` with `T = 8`. v2 draws at **K = 4**, so tiles are **64 × 32 art px**.
- **Terrain:** integer height levels, where 1 level = 16 art px.
- **Biomes:** the **11 biome cells** follow the approved 1–3–3–3–1 diamond (noise-warped, so there are no straight borders), with the §2.3 adjacency.
- **The two pilot biomes:** authored terrain and paths, with automatic stairs.
- **Objects:** props with footprints, and points of interest (seats, trees, looms, threads, bath spots and so on).
- **Navigation:** A* in 8 directions, kept inside one biome, with stairs and no corner cutting.

**`tw-art.js`** paints everything in code:
- **Ground:** shaded per pixel in world space, so textures are continuous and borders organic. Shorelines are smooth curves, not tile edges.
- **Cliffs:** faces with strata, moss drips and vines (or glow specks in the gorge).
- **Ground features:** stairs, bridges, silk bridges and cave arches.
- **Props:** separate code-painted sprites with sway or flutter frames, and an emissive mask.

**`tw-render.js`** draws each frame:
- **Ground:** baked lazily in 512 px chunks, with 4-frame water shimmer.
- **Depth:** one depth sort by x + y over props, characters, the waterfall, and the terrain columns that stand in front of something. Characters therefore pass behind cliffs, trees, rocks and the throne.
- **Overlays:** the web canopy, birds, butterflies and fireflies.
- **Light:** the day/night grade, the gorge's own gloom, emissive pixels and light glows.

The simulation is DOM-free and seeded (`TWS.R`), and it starts warm: the world is already living on the first frame. Rendering only reads state.

## Hoa Quả Sơn (east tip)

**Environment**
- A jade massif along the back edge, with pines and crags.
- A **level-10 waterfall** (a 128 px drop, three tiles wide) into a clear pool with lily pads. **Thủy Liêm Động**'s arch and its plaque sit behind the falling water, with a ledge on both sides.
- A stream curving down the terraces to Đông Hải, with a wooden bridge, and a sand shore with surf.
- Terraces at levels 4, 2 and 1, joined by stone stairs.
- The **Monkey King's stone throne** on a dais, with a tiger pelt, red banners, a drum and lanterns.
- A paved training courtyard with a gold medallion, training dummies and a weapon rack.
- An ancient peach grove (blossom-pink and jade variants with peaches), a stone table with stools, a fire ring, bamboo, ferns, flowers, bushes and boulders.

**Residents (22):** Wukong, 3 guards, 2 elders, 6 kids and 10 citizens (two looks).

**Ambient life**
- **Wukong:** trains with his staff (strike and twirl frames), sits on the throne, visits monkeys (who greet him and hop), and hops from rock to rock.
- **Guards:** patrol courtyard → lookout → pool → grove, drill at the dummies (the dummies wobble when hit), and keep watch from the lookout.
- **Elders:** rest on seats, talk, and doze at night.
- **Kids:** chase each other, hop, climb peach trees and sit in them, eat peaches, and jump into the pool and swim.
- **Citizens:** groom in pairs, eat peaches, climb trees, swim, visit the cave behind the waterfall (they fade inside), and sit at the table and the fire.
- **Creatures:** birds circle in flocks and butterflies flutter over the meadows.

**Mini events**
- *Fruit Raid:* a kid climbs a tree and shakes peaches down, two others catch them, and an elder or guard chases them off.
- *Storytime:* the old monkey gestures from his storytelling stone while kids sit around him.
- *Dive Party:* monkeys jump into the pool one after another, with splashes.
- *Guard Drill:* guards in a line thrust their spears together while Wukong watches.
- *Supper:* monkeys sit at the table and the fire, eating peaches.

**Signature, *The King Returns***
1. **Foreshadowing:** Wukong flies off on his cloud while the monkeys wave. A golden trail circles the sky and a gold beacon column rises over the courtyard, visible from far away. Guards and kids gather at the lookout, looking up.
2. **The return:** Wukong comes back on a cloud. Everyone gathers, cheers and hops. He climbs to the throne and sits while peaches and petals fly.
3. **Celebration:** he gives a staff demonstration in the courtyard, with sparks.
4. **Aftermath:** peach pits and petals litter the courtyard.
5. **Recovery:** citizens and kids walk to each piece of litter and pick it up.

## Bàn Tơ Động (south-west)

**Environment**
- A deep charcoal-violet gorge with **layered back walls** (levels 5 to 10) and glow specks and silk threads on the cliff faces.
- **The cave** in the back wall, with swaying silk curtains.
- A chasm crossed by **two silk bridges** with hanging strands.
- A front ledge, and a raised **steaming hot-spring** terrace with a rock screen.
- **The giant web canopy** (24 spokes) hangs over a web-patterned floor between rock spires wrapped in silk.
- A **weaving area** with two looms and a **gathering circle** of violet stone lanterns.
- Glowing moss, mushrooms and crystals (emissive), egg clutches and cocoons near the walls.

**Residents (17):** 7 spider sisters (the eldest in violet, then teal, rose and amber) and 10 spiderlings.

**Ambient life**
- **Sisters:** weave at the looms (silk threads run from their sleeves to the loom), bathe in the spring (they change behind the screen into bathing robes and sit half-submerged in the steam), gather and talk, stroll the web paths, tend the eggs, and visit the cave.
- **Spiderlings:** scuttle, follow the sisters, and climb up and down silk threads, hanging from the canopy.
- **Ambience:** fireflies drift through the gorge, which keeps its own gloom by day and glows at night.

**Mini events**
- *Weaving Circle:* sisters raise their sleeves and silk rises; the web grows a little, then settles back.
- *Hot Spring:* several sisters bathe together.
- *Spider Rain:* many spiderlings climb their threads at once.
- *Lantern Gathering:* sisters sit at the circle while fireflies swirl.
- *Egg Watch:* sisters tend a clutch while spiderlings hop around it.

**Signature, *The Seven Sisters' Net***
1. **Foreshadowing:** the canopy glows violet and a beacon column rises. The sisters gather at the circle and the spiderlings climb their threads.
2. **The net:** the sisters raise their sleeves and the **web visibly expands** across the whole gorge, from 0.55 to 1.0. Tam Tạng walks in from the east mouth and is **wrapped in silk**.
3. **The rescue:** Wukong lands beside him on a cloud and strikes twice (flash and sparks). The **web tears**: it collapses to 0.12, with shreds drifting down.
4. **Retreat:** the monk is freed, the sisters **retreat into the cave** and fade, and the spiderlings scatter. Master and disciple walk out together.
5. **Recovery:** the sisters return one by one from the cave, the spiderlings re-weave (climbing threads), and the web **mends gradually** back to its resting size.

**The Director:** the Global Story Director runs the loop for all 11 cells. Only the two built biomes have stories, and they are not neighbours. The cap of 5 signatures and the no-adjacent rule still apply. Loops take about 5–9 minutes.

## Tests (2026-11-20)

| Command | Result |
|---|---|
| `node tests/tayduky-v2-sim.mjs 900 <seed>` (Node, no browser) | **PASS** for seeds 7, 31, 101 and 5. Both loops reach peace, foreshadow, signature and aftermath 2–3 times in 15 minutes. 8–10 kinds of mini event and 14 kinds of activity occur. Adjacency violations, agents on a blocked tile for more than 1.5 s, and teleports are all 0. |
| `node tests/tayduky-v2-world.mjs 30 --shots docs/tayduky/v2/screenshots` (headless Chrome) | **PASS**. 11 biome cells, 22 and 17 residents, both signatures run while the camera pans between the two biomes in one world, no console errors. Median canvas draw-call time is 0.5 ms per frame (p90 0.8 ms). This is script time only; GPU compositing was not measured. |
| `node tests/tayduky-v2-story.mjs <hqs\|btd> <prefix>` | Screenshots of a signature as it plays |
| `node tests/tayduky-v2-pilot.mjs` | The character pilot page (unchanged) |

## Remaining visual limitations (honest)

1. **Zoom range:** the widest zoom is 1 art px per device px, which shows about one biome. The design's "3–5 biomes at widest zoom" would need a downscaled overview, which is not built.
2. **Cliffs follow the tile grid** (2:1 iso steps). Material borders and shorelines are organic, but terrace edges are straight diagonal runs.
3. **Sprites:** characters have 4 directions. The left view mirrors the right, which is fine for this cast's symmetric items. The front and back walk is a raised foot plus a body lift.
4. **No character avoidance:** characters do not steer around each other, so they can overlap briefly when paths cross. Gatherings use ring positions to stay readable.
5. **Climbing a tree** is shown as standing on the trunk tile with a lift. Monkeys appear in front of the canopy, not inside it. Swimming and bathing draw the upper body above the water line.
6. **Big shapes are code-painted:** trees, rocks and landmarks are painted by code with clumped forms and ramps. They are not hand-placed pixel by pixel like the characters, and a final hand-pass on the hero props (throne, peach trees, spires) would raise quality further.
7. **No weather mode yet,** although the shared clock and per-biome grades are in place.
8. **Not in the gallery yet.** It needs the gallery frame host generalised (World-Builder Guide §3.2) and the shared radio wired in.
9. **Placeholder biomes** are flat, hatched ground with a stele and an "in development" place card. They have no residents.

## Next step

The owner's visual review of the two biomes. After approval, the remaining nine are built one at a time on the same modules (map section, art set, residents, minis, story).

## Pass 3 — cast and living environment (2026-11-20)

The two showcase biomes now use the redesigned PixelLab cast: four directions and eight walk frames, seven distinct sisters, two spiderlings and Wukong's feathered silhouette. Idle frames derive from the walk drawings to avoid the scale jump in the original rotations. Staff practice and sisters' activities use alternating existing walk poses; these are not dedicated action clips. The night redraw respects the seated crop.

The 48 packed object sprites and their provenance are catalogued in `ASSET-LIBRARY.md` and `PIXELLAB.md`. Bridges cross actual bridge tiles; trees, silk, lights, petals, spores and water add environmental motion. Existing activities, story loops and recovery remain in place. The other nine biomes remain placeholders.

Verification: 900-second deterministic simulation runs for seeds 7 and 31 cover both story cycles and report no adjacency violations, blocked agents or teleports. The 30-second Chrome world test passed with both signatures, no console errors, and activity-frame and seated-night-crop checks; canvas script time was 0.6 ms median and 0.7 ms p90 in this run. Day and night captures of both biomes were reviewed at normal zoom. These checks do not establish GPU performance or replace further animation review. More natural back-view monkey silhouettes remain a future art improvement.

## Animation follow-up (2026-11-20)

Wukong and all seven sisters now have separate four-direction, eight-frame PixelLab action sheets. Wukong's action plays during his activities and the sisters' action animates their arms and back legs; the existing loom-thread effects and story sequencing remain in place. The source and packing details, including the nearest-neighbour size match, are in `PIXELLAB.md`. The idle trial is not used: existing walk-derived breathing remains the scale-matched fallback. Generated action poses still need the owner's visual review; staff and silk motion are suggestive rather than physically exact.

The 900-second simulations passed again for seeds 7 and 31, with zero adjacency violations, blocked agents or teleports. The Chrome world test passed with both signatures, action-frame selection (including story actors), seated night cropping and no console errors. The final run measured 0.7 ms median and 0.9 ms p90 canvas script time; this is not a GPU or frame-rate measurement. Action-pose screenshots were inspected in the two biomes.

## Lòng Bàn Tay Phật Tổ — Buddha's Palm (branch `feature/tayduky-buddha-palm`, 2026-11-20)

**What exists.** A cloud-sea biome in the BTP cell: the palm is hidden; five finger pillars (heights 15-25 levels, 108-150 px wide) rise from a layered celestial sea. Cloud terraces (new materials `SKYC` walkable, `SKYD` deep sea, not walkable) rise to a lotus-throne Buddha with a halo in the north-east corner; west and east cloud islands carry lotus; routes: front and back lanes, per-finger ledges, a stair route up the terraces, and a rim walkway meeting Hoa Quả Sơn (146,36), which keeps the whole world one walkable piece. Dressing: ~160 depth-sorted cloud sprites, 16 drifting layers, mist falls on cliff lips, god rays, lotus petals, golden motes, dharma wheel, bells, lanterns. Wukong rides his cloud (`ride`), 4 attendants (`palm_attendant` PixelLab sheet) wander and pray.

**Modules** (hook-based, so merges with Thiên Cung work stay small): `tw-palm.js` (map build, loaded before tw-map.js), `tw-palm-art.js` (terrain/faces/finger painter, `TWA.ext`), `tw-palm-fx.js` (`TWFX.palm`), `tw-palm-data.js` (state, steps/ops, activities, minis, signature; wraps `TWS.init/tick`). Shared files only gained small hooks (`stepExt/opExt/pointExt`, `TWA.ext`, `R.addStatic`, extra drawable type 5, sprite `pick/draw/after`).

**Behaviour.** Activities: cloud ride, perch, devotion, lotus, offering, rest. Minis: somersault toward the edge of the universe, inscribe a pillar, relieve behind a pillar (steam), bounce off the invisible boundary. Signature **The Palm Closes**: foreshadow (radiance + finger glow) → fingers curl inward (9 curl frames, outer fingers first) and trap Wukong in a divine column, clouds suggest the Five Elements Mountains → fingers reopen, inscription remains → inscription fades. The Buddha never leaves his seat.

**Tests run.** `node tests/tayduky-v2-sim.mjs 900 7` and `... 900 11`: PASS (Director ran btp fore/sig/after, no adjacency violations, no bad tiles, no teleports; `a.ride` is exempt). `node tests/tayduky-v2-map15.mjs`: PASS (all 15 regions mutually reachable, incl. hqs through the new rim walkway). Rendering: frameMs 0.3-1.0 on headless Chrome at 1920x1080. Screenshots: `docs/tayduky/v2/screenshots/palm/` (day wide, night, Buddha close-up, signature).

**Honest limitations.** Fingers are smooth stylised pillars (cylinder-shaded, creases, whorl) and read as monumental fingers more than anatomical ones; the Wukong flip clip is not packed (see PIXELLAB.md); the signature's divine column is a soft rectangle that still looks a little boxy at the middle finger; the neighbouring placeholder regions south of the palm show through the fade as grey cloud; no automated test yet for each mini-event (they run in the sim test only as coverage); the palm biome is not yet balanced against Codex's Thiên Cung changes (separate branch).

## Integration (2026-11-20): four built biomes in one world

`feature/tayduky-redesign-v2` now holds Thiên Cung (checkpoint `6c04b19`) and Buddha's Palm (merged from `feature/tayduky-buddha-palm`, merge commit `aa39fd2`). **Built:** hqs, btd, tc, btp. **Placeholders:** the other eleven regions (mask, adjacency and Director rules are real; ground is development hatching).

Merge decisions: conflicts in tw-map.js (material table, blocking-prop pass), tw-art.js (terrain cases, stair palette), tw-render.js (static sprite placement and draw), tw-main.js (camera starts), sprites.js and sprite_picks.json. Thiên Cung terrain/props/cloud drawing kept as is; the palm's hooks added around it. Palm materials renumbered to SKYC 30 / SKYD 31 / PH 32 because Thiên Cung owns 28 and 29. `sprites.js` regenerated from the merged picks (88 sprites).

Verified after the merge: `map15` PASS (15 regions, adjacency, all regions mutually reachable, Director with 15 regions), `sim 900` seeds 7 and 21 PASS, `heaven-assets` PASS, `heaven` PASS (both Heaven signatures, 60 fps median), story run OK, browser captures of the four biomes day and night with no console errors (`screenshots/integration/`, plus `map-15-regions.png`). `tayduky-v2-pilot.mjs` fails, as it did before the merge (legacy sandbox, removed `nhen_tinh`).

Remaining: see `tayduky/AI_HANDOFF.md` §4.

## Footprint normalisation (2026-11-20)

World **160 x 160 -> 104 x 104** (24,964 -> 10,404 tiles). Thiên Cung 2,231 -> 847 tiles, Buddha's Palm 2,099 -> 953, the eleven placeholders re-planned to 482-616 tiles each; Hoa Quả Sơn (1,406) and Bàn Tơ Động (1,101) are only translated (tile and prop hashes unchanged). Every trimmed built biome opens through a ramped gate (`TWM.gates`); adjacency is still derived from the mask (31 -> 32 edges; Thiên Cung no longer touches Hoa Quả Sơn / the Palm). Full rules, measurements, per-biome changes and consequences: `docs/tayduky/v2/FOOTPRINT.md`. Mask overview: `screenshots/footprint/overview-before-after.png`. Tests: map15, sim 900 (seeds 7, 21, 33), heaven-assets, heaven, world 30 all PASS after the pass.

## Hoa Diem Son - Flaming Mountains (2026-11-21)

**Built biomes: hqs, btd, tc, btp, hds (5).** The other ten are placeholders. World 124 x 124; HDS = 1,362 tiles (see FOOTPRINT.md).

**Terrain.** Levels 1-14: two great volcanoes with a second tier of cones behind them, a carved palace terrace with the grand gate (hero landmark, PixelLab 256), a warm-clay village plateau (level 3), two lava channels, a lake and an east canal with lava FALLS where they drop, stone bridges over the lava (`LBRIDGE`), switchback stairs, lookouts, vents, ruins. New materials ASH 100, BASALT 101, LAVA 102, WARM 103, CINDER 104, SCORCH 105, LBRIDGE 106, CRUST 107 (ids above any placeholder).

**Life.** Lava flow sparks and pulse, glowing cracks that breathe, smoke columns, drifting embers, heat-shimmer streaks, flickering code-drawn flames and bubbling pools over every vent, flames on the gate braziers, eruptions with ballistic sparks and a breathing heat aura at the great volcanoes, flame bursts that startle the mule and bakers, ash whirlwinds, oven puffs. Residents: Thiet Phien, Wukong, Bajie, 3 bakers, 3 sellers, 2 mules (bake, sell, haul, warm up on hearths, inspect, overlook, lava edge). Minis: cake seller, startled mule, Bajie and the heat, ash whirlwind, oven flare.

**Signature - The Palm-Leaf Fan** (`tw-fire-data.js`): foreshadow (heat, bursts, villagers gather, Thiet Phien descends) -> she fans Wukong away in a long spinning arc -> he returns with the fan: 7 strokes of 7 (49, shown as seven rune lights) -> rain; lava crusts over and turns to rain pools; the ground greens from the village outward (stage 0-9 per tile, dithered, ground chunks re-baked; landmark sprites blend to cooled copies) -> celebration -> gradual recovery (greening fades from the far edge inward, cracks reignite). `node tests/tayduky-v2-fire.mjs` runs and captures every phase.

**Verified.** map15 (15 regions, reachability, Director), sim 900 s seeds 7/21/33 (fire minis, bake/sell/warm, signature, no teleports), fire signature test, heaven-assets, heaven, world. Screenshots: `screenshots/hds/`.

**Limits.** Wukong's flip clip is still unpacked (the blow-away uses a code-driven spin); mule, baker and seller have walk only (idle = walk-derived); terrain is blocky at the strata level by design; frame time grows with world size on software GL; the east canal and some lava falls look stepped; ten regions remain placeholders.

### Hỏa Diệm Sơn review fixes (2026-11-21)
Rim: cliff faces of every unbuilt tile within 16 tiles of the volcano (including the world-rim wall) use its scorched, ember-seamed stone (`TWM.fireNear`). Village: the lava basin at the west edge was removed (basalt boulders and stored goods instead; no vents inside the village). Lava falls: every lava tile that drops a level has an animated face (sliding highlights, glow breathing, foot splash and foam, mist; fades as the lava cools). Pilgrims: Tam Tạng (`monk`) and Sa Tăng (`sha`, new PixelLab sheet) live in the village (shrine, cakes, hearth, overlook, lava edge), join the foreshadowing gathering and the celebration, react to the blow-away, and have a mini event (`fire_pilgrims`). Tests: map15, sim 900 (seeds 7, 21, 33), fire signature, heaven-assets, world: PASS.

## Sư Đà Lĩnh - Lion Camel Ridge (2026-11-22)

**Built biomes: hqs, btd, tc, btp, hds, sdl (6).** Nine placeholders remain. World 124 x 124; SDL = 1,517 tiles (see FOOTPRINT.md).

**Terrain** (`tw-lion.js`, levels 1-14): a walled demon citadel on a level-8 plateau (battlement ring of raised brick tiles, skull gate in the front wall, the lion-head keep in the back wall, throne square), three seats - Thanh Sư's lion den (west crags), Bạch Tượng's tusk hall (east plateau), Kim Sí Đại Bàng's golden nest (tallest crag, NE) - a deep misty gorge with a waterfall that cascades from the NE ridge into a plunge pool, the river along the gorge floor and out through the valley, two rope-and-plank bridges over the gorge, a stone bridge over the valley stream, stairs, switchbacks, and a low war-camp valley (tents, weapon racks and drums, drill yard, supplies, market). Materials SLATE 110, BONE 111, RAMP 112, MIRE 113, YARD 114, PLANK 115, SCRUB 116.

**Life.** Code-driven: waterfall streaks and spray, plunge-pool foam, gorge fog, drifting cloud banks, witchfire on every brazier / keep / gate / wall torch, crimson wall pennants, campfires with smoke, golden motes and feathers over the nest, nine crows orbiting the crag, flocks crossing the ridge, den breath and glowing eyes, tusk-hall glitter, mire bubbles, wind-blown leaves, banners and pines that sway (`TWA.SWAY`), roar / stomp / wing shockwaves, the roc's shadow, night glows. Residents: Thanh Sư, Bạch Tượng, Kim Sí, 9 imp guards (gate, wall watch, patrol, drill, rack, brazier, mess, overlook, market), 5 imp porters (haul sacks, mess, market). Minis: spar, lion roar, elephant stomp, roc shadow flight, porter trip, parade.

**Signature - The Three Kings Convene** (`tw-lion-data.js`): foreshadow (wind rises, camp gathers on the parade ground) -> Kim Sí swoops from the nest, Thanh Sư leaps from the den, Bạch Tượng thunders from the hall; each lands in the throne square with a shockwave and grows to twice his size -> the camp kneels, five green light pillars rise over the seats, storm and lightning -> the kings raise their weapons three times -> they shrink and return home, the storm clears and the witchfire settles (recovery). `node tests/tayduky-v2-lion.mjs` runs and captures it.

**Verified.** map15, sim 900 s seeds 7 / 21 / 33, lion signature, fire signature, heaven-assets, world. Screenshots: `screenshots/sdl/`.

**Limits.** Kings use act clips for roar / stomp / raise (cross-punch, two-footed-jump, fireball) rather than bespoke clips; Thanh Sư and Bạch Tượng have no flying clip (the leap is an arc with the walk frame); imp porters have walk only; scaled kings are drawn at 2x (integer) so their outline is chunkier; nine regions remain placeholders; frame time still grows with world size on software GL.

## Thông Thiên Hà - The River That Reaches Heaven (2026-11-23)

River-dominant biome in the world's south-east corner (1,732 tiles, squircle 46 x 39 at world (77, 84) + south/east rim strips + a pocket claimed beside Sư Đà Lĩnh). **Code**: `tw-river.js` (map), `tw-river-art.js`, `tw-river-fx.js`, `tw-river-data.js`; hooks in `tw-map.js` (materials BANK..PAVER 120-126, `TW_RIVER_BUILD/FINAL`, the gate pass opens both banks of a split biome), `tw-art.js` (river top/face/edge via `TWM.tthNear`), `tw-render.js` (turtle drawable), `tw-layout.js`.

**What it has**: one 15-tile-wide river running north to south: rapids gorge with cascades and boulders, deep dark water with a whirlpool, eddy pools in the coves, the great **cataract** pouring off the south rim of the world with mist and rainbow; sandbars and a river-god shrine islet; a high west bluff (signal pagoda, lookout, a tributary that falls to the river), the west ferry cove (abandoned ferry station, pier, wreck, huts, net racks, willows) fed by Sư Đà Lĩnh's east road; the low far bank (landing gate, stilt village, reed marsh, wooded hill). The two banks are not connected: the river cannot be crossed on foot (each bank has its own gate to the world; POIs use `_w` / `_e` suffixes and `TW_RIVER_FINAL` drops unreachable ones).

**Cast**: 3+3 fishermen, ferryman, 2+2 river imps. **Minis**: cast net, boat breaks loose and goes over the cataract, floating lanterns, giant carp leaps, cranes, surge, imp peeks. **Signature `divine_turtle`** (Rùa Thần Qua Sông): the five pilgrims (Tam Tạng, Ngộ Không, Bát Giới, Sa Tăng, Bạch Long Mã) reach the pier, Wukong tries the water and the surge throws him back, a golden turtle rises from the whirlpool, the five hop on its shell, it swims them across the storm-lashed water to the far pier, they step off and walk on, the turtle swims down to the world's edge, dives and vanishes; recovery: calm river and drifting lanterns. Test: `tests/tayduky-v2-river.mjs` (screens in `screenshots/tth/`).

**Limitations**: the riders use the walk/idle frames (no seated clip); the turtle has a single facing (flipped for the other); huts carry their own water-base diamond; the far bank only leads to placeholders; frame time still grows with world size on software GL.

## Hắc Phong Sơn (Black Wind Mountain) — built (replaces Nữ Nhi Quốc)

World-space biome on the former `nnq` region (758 tiles, `tw-hps.js`, `tw-hps-art.js`, `tw-hps-data.js`, `tw-hps-fx.js`; footprint in FOOTPRINT.md). A mountain (peak level 13 at the back) with the Guanyin-Zen monastery in terraces: shanmen gate and plaza, monks' court (dormitory, kitchen, well), upper court
(five-tier scripture pagoda, bell tower, incense burner, sutra pavilion), the great hall on the summit with a stupa garden and a cliff lookout, one pilgrim road of stairs, a mountain stream (cascades, plank bridges) that becomes the head of Thông Thiên Hà, the bear-mouth lair on a ledge across the stream, and
a ravine ridge-walk to the south that meets the river's bluff path. Residents: 5 monks, 3 novices, the abbot, 2 porters, 2 minions; 12 daily activities + 8 mini events (bell, procession, crow/crane flocks, shower, leaf gust, group chant, the lair's eyes, porters).
**Signature `black_bear_fire` (Hắc Hùng Tinh Đốt Chùa):** unease (crows, black wind, the lair's eyes) -> the demon king and his minions torch the great hall -> fire spreads to pagoda / dorm / kitchen (bucket chain, panic) -> the hall collapses (sprite swaps to the PixelLab ruin; flash, shake, dust)
-> he steals the kasaya -> the four pilgrims arrive and corner him at his cave -> **he transforms (black smoke swirl) into the GIANT black bear** (dedicated 256-px PixelLab sprite + walk / roar / swipe / slam / hurt animations, ~4.6x NPC height, own shadow and depth sort) -> roar with shockwave (trees shake,
crows burst, stones fall, flags and flames lean) -> claw swipe, Wukong's counter, ground slam, charge down the road -> Guanyin descends in golden light, binds him, he dissolves into smoke and kneels to return the kasaya; rain puts out the fire -> recovery: scaffold, hammering monks, the new hall with a golden shimmer and the bell.
Tests: `tests/tayduky-v2-hps.mjs` (signature in headless Chrome with screenshots in `screenshots/hps/`), `tests/tayduky-v2-hps-shots.mjs` (camera shots), map15, sim (900 s; seed 7 needs 1200 s since the extra biome shifts the random sequence), heaven-assets, fire, lion, river, world.
Limitations: the giant bear has one facing (flipped for the other); riders/walkers use existing clips; the east flank meets the unfinished Ngũ Hành Sơn placeholder; frame time on software GL still grows with world size; no camera shake (shake is expressed as ring, dust, tree sway and stones).

## Ngũ Hành Sơn (The Five Elements Mountain) — built (2026-11-25)

World-space biome on the planner's `nhs` region (744 tiles: a 26 x 42 wedge on the world's east rim; `tw-nhs.js`, `tw-nhs-art.js`, `tw-nhs-data.js`, `tw-nhs-fx.js`; footprint in FOOTPRINT.md). **One enormous terraced massif** (level 3 -> 18, ~290 art px, crowned by a 247-px PixelLab summit crag with a shrine, so ~10 NPC heights)
whose south-east face looks at the camera. A flagstone **switchback pilgrim path** (43 tiles, stairs) wraps the face to the summit pad. At the foot of the face, in a small court, **Sun Wukong is pinned beneath a rock**: a PixelLab hero sprite (head, shoulders and arms out of a crack) with four dedicated PixelLab animations
(idle blink / breath, struggle, plead, hope). **Three waterfalls** (a west-flank cascade into a pool, the central fall beside the prison, an east fall that pours over the world rim) + a meadow stream with plank bridges; hermit's hut, wayshrines, stupa, rest pavilion, lanterns, ~470 trees / shrubs / flower beds / boulders.
**Seasons (not a colour filter):** the ground is baked once; per chunk a lazily built overlay recolours the nhs tiles by material class (spring: flower flecks, fresh turf; autumn: russet turf, leaf litter; winter: snow cover, shore ice, frozen pools; moss: the 500 years); every tree / pine / bamboo / rock sprite has four recoloured canvases (blossom crown, russet crown, bare crown + snow caps),
bushes and flower beds are painted per season; the draw cross-fades two seasons. Weather and wildlife follow the season (petals, pollen / butterflies / fireflies, falling leaves + migrating birds, snow + icicles + frost; rain, storms, rainbow). Idle: one season per 150 s (a year per 10 min).
**Life:** deer x3, goats x2, monkeys x3, a hermit, a woodcutter, 2 travelling monks; 15 activities (graze, drink, ledge, play, forage, hut, offering, chop, rest, shrine, look, pray, walk ...) + code creatures (crows circling the cliffs, cranes over the falls, small flocks, butterflies, fireflies, rabbits, squirrels), cloud banks at three speeds, valley mist, drifting cloud shadows, light shafts.
**10 mini events:** monkeys steal fruit and chase each other, deer drink together, crane flock, sudden rainstorm (+ rainbow), waterfall surge, Wukong struggles (birds burst, stones fall), season wind (petals / dust / leaf sweep / snow flurry), the hermit's offering, pilgrims at the prison, snowstorm (winter).
**Signature `five_hundred_years` (Năm Trăm Năm Dưới Núi):** foreshadow (golden shimmer, animals look at the summit) -> **the 500-year time-lapse** (66 s: the seasons race ~5 s each, a "Năm thứ N" caption, moss and growth creep in, clouds stream, Wukong sags and struggles, a hermit leaves fruit) -> time slows into spring as Tang Sanzang **rides in on the white horse** (an ordinary white horse sheet, not the dragon horse; rider composited in the saddle) -> he dismounts, Wukong pleads, he looks at the golden seal -> climbs the path to the summit -> lifts the seal (it rises, spins, burns white and dissolves) ->
the mountain trembles, light in the cracks, stones fall, birds scatter -> the rock bursts, **Wukong (Great Sage armour) leaps skyward on a somersault cloud** and circles the peak -> lands before the monk, a puff of smoke: **the simple 1986-style pilgrim robes** (new PixelLab sheet `wk_pilgrim`), kneels and bows -> master and disciple walk down, the monk mounts, they leave through the west gate. Recovery: dust settles, wildlife returns, then a **new seal descends and the sleeping monkey ghosts back into the rock** (no hard reset); the story camera eases after the action and yields to the viewer.
Tests: `tests/tayduky-v2-nhs.mjs` (signature in headless Chrome, 19 frozen frames in `screenshots/nhs/`), `tests/tayduky-v2-nhs-shots.mjs` (camera / season / night shots), map15, sim (900 s seeds 21 and 33, seed 7 at 1200 s), heaven-assets, fire, lion, v2-world.
Known: `tests/tayduky-world.mjs` (the legacy alpha world, still with `nnq` and no `hps`) fails identically on the previous commit; `tests/tayduky-v2-river.mjs` misses its short `land` poll (also fails on the previous commit: a polling flake, the story itself completes).
Limitations: the north neighbour (`ntq`, Wuzhuang Temple) was an unfinished placeholder when this was written (it is built now, see its section below); seasons cross-fade ground and sprites but cliff faces keep their summer paint (snow and icicles on them are drawn as effects only); Wukong's imprisoned frames are 128 px object animations (one facing); the burst reuses a code-made empty-prison canvas (dark hollow + rubble), not a PixelLab frame; the monk and horse use existing walk clips and a composited saddle; world frame time on software GL still grows with world size.

## Ngũ Trang Quán (Wuzhuang Temple, the Ginseng Fruit Tree) — built (2026-11-20)

World-space biome on the planner's `ntq` region (654 tiles; `tw-ntq.js`, `tw-ntq-art.js`, `tw-ntq-data.js`, `tw-ntq-fx.js`; footprint in FOOTPRINT.md). **One axial Daoist garden-monastery** climbing a straight line up the screen (x - y = 70): gate court (level 3) -> forecourt with the lotus pond (4) -> herb terrace (5) -> the **Ginseng Court** around the colossal tree (6) -> a stair flight to the hall terrace (10) -> the spring behind it (11-13). Tone: jade-emerald lawn, white-jade paving, pale limestone, gold gravel, red-brown tiles, pink peach blossom (not Hắc Phong Sơn's gloom, not Hỏa Diệm's heat).
**Landmarks:** the **Ginseng Fruit Tree** (PixelLab 256-px object `ntq_tree_a`; the fruit are code-painted sleeping babies (11 x 15 px drawn at 2x) that swing, glow and can be knocked off one by one) in the middle of the court; the main hall (PixelLab `ntq_hall_a/b`); the paifang gate, the attendants' lodge, a guest hall on the lookout, a tea pavilion on the west pond, a lookout pavilion over the rim, a spring shrine, braziers, stone lanterns, jade bridges, lotus ponds with koi, herb beds, bamboo, scholar rocks; ~560 scattered peach trees / jade trees / shrubs / flower beds. Existing Heaven / peach / Hắc Phong Sơn sprites are reused where they fit.
**Water:** spring pool behind the hall -> a stream cascading down the hall terraces into the lotus pond -> its outflow crosses a plank bridge and **pours over the world rim** (east cliff, 7-9 levels, moss and mist); the west pond with a cascade into a lower pond; streaks, mist, ripples, drifting petals, koi.
**Life (residents):** 2 temple boys (Thanh Phong), 2 temple girls (Minh Nguyệt), Trấn Nguyên Đại Tiên (the sage), 3 deer, 1 jade fairy, 2 young monkeys. 14 activities (sweep the court, pick herbs, water the beds, serve tea, read, feed the deer, tend / tie the tree, pick up fallen leaves, pray, look from the bluff, rest, graze, drink, play, meditate with a glowing chant ring ...). Code creatures: standing cranes in the ponds that preen, doves circling the hall, small flocks, butterflies, rabbits, fireflies at night, incense curling from the braziers, three cloud banks, valley mist, cloud shadows, light shafts through the crown, petals and pollen in the air.
**10 mini events:** cranes land on the lotus pond and lift off, the fruit all shimmer and the tree shakes, the boys serve tea to the sage, deer drink together, a ring of leaves winds up round the tree, Trấn Nguyên chants (rings and runes), a soft rain followed by a rainbow, birds peck at the fruit and scatter, Bajie sneaks a look at the fruit (then flees), Wukong throws a branch into the crown (leaves burst; then he flees).
**Signature `ginseng_fruit` (Nhân Sâm Quả), 12 phases (about 210 s of story time):** 1 foreshadow (shimmer, cranes, everyone looks at the tree; the sage is away) -> 2 the four pilgrims walk in (Tang Sanzang, Wukong in the pilgrim robe `wk_pilgrim`, Bajie, Sha Seng) -> 3 the boys bring the fruit on a tray -> 4 Sanzang sees a baby in it and refuses -> 5 Wukong knocks two fruit down with his rod, Bajie and Sha Seng catch and eat them -> 6 the fruit that touches the earth **sinks into it** (five-element rings: gold, green, blue, red, white) -> 7 the boys scold, Wukong loses his temper -> 8 he **strikes the tree down** (it rotates about its roots, leaves and dust burst, birds scatter, the garden shakes) -> 9 Trấn Nguyên returns on a cloud, flash and shock wave; the **talisman circle** and the **ropes of golden light** bind the four -> 10 Wukong slips the rope and flies off to beg Guanyin; Guanyin descends on a lotus cloud in white-gold light with falling petals, Wukong at her side -> 11 **the nectar** falls, the roots glow and creep across the ground, the trunk stands, the leaves return from the withered state, a **wave of light** sweeps the garden, the nine fruit ripen one after another -> 12 reconciliation (the ropes dissolve, sworn brotherhood), Guanyin rises, a **feast** under the tree with lit tables, then the pilgrims leave by the gate and the household resumes its day (recovery: dust settles, tree and fruit restored, sage back; no hard reset). Two-line captions (Vietnamese / English) name each phase; the story camera eases toward the action and yields to the viewer for 7 s after any input.
Tests: `tests/tayduky-v2-ntq-sim.mjs` (the whole story in the Node sim: phases, tree felled and restored, bindings, nectar, wave, feast, actor cleanup), `tests/tayduky-v2-ntq.mjs` (21 frozen phase frames in headless Chrome, `screenshots/ntq/`), `tests/tayduky-v2-nhs-shots.mjs` (camera / day / night shots), map15, sim (900 s seeds 21 and 33, 1200 s seed 7), heaven-assets, fire, lion, v2-world 30, the Ngũ Hành Sơn signature test.
Limitations: Thanh Phong, Minh Nguyệt and Trấn Nguyên have the standard walk clips only (idle is the rotation with a code bob; actions fall back to idle, so the boys 'sweep' and 'serve' by posture, bubbles and carried props); Guanyin reuses the existing `guanyin` sheet (no willow-vase pose; the nectar is an effect); the fallen / withered tree is the same PixelLab sprite rotated and thinned by code; the unbuilt neighbour `lat` (north / north-east) is still a placeholder: the biome's edge meets it through a 10-tile outward band of limestone, moss, peach trees and bamboo but the far ground is unfinished; ground between terraces is walkable through one-level steps (links without drawn stairs except along the paths); software-GL frame time still grows with world size.
