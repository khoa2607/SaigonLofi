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

## Hoa Quả Sơn (Flower-Fruit Mountain, the Monkey Kingdom) — full rebuild (2026-11-21)

The pilot biome (a flat meadow with a small massif, authored in `tw-map.js`) was **purged and rebuilt in world space** by `tw-hqs.js` (map), `tw-hqs-art.js` (jade / granite / flagstone / blue-water palette), `tw-hqs-data.js` (residents, daily life, 14 mini events, signature) and `tw-hqs-fx.js` (the Great Fall, sky, life, magic). The planner footprint is unchanged (1,406 tiles, x 60-101 / y 1-37; no adjacency change; the 15-region test passes). The old byte-hash assertion for the pilot was removed from `tests/tayduky-v2-map15.mjs` on purpose.
**Terrain (levels):** a two-tier jade range wraps the north and west (back wall L11-13, a ridge trail climbs to the source); the plateau (L13) carries a spring lake with a hermit's shrine, pines, maples and boulders; the **Great Fall of Thủy Liêm Động** (5 tiles wide, 10 levels = 160 px, plus two flanking falls, a see-through curtain over a cave arch, three ribbon layers, foam, spray arcs, mist, a rainbow in the sun, surges) drops into the lake (L3) at the foot. East of the lake: the Hầu Vương plaza (L3) with a dais (L5) and the throne, the monkey village terrace (L6, four stilt huts) and the statue summit (L10, the only Tề Thiên Đại Thánh statue); west: peach terraces (L5 / 4 / 3) with picking posts, a fruit depot and an elders' hall; south: the training yard (L2), a cloud-sea lookout pavilion (L3) and the Huaguo gate (L1, meets Ngũ Trang Quán's west road at (91, 38)); east: beach and the Đông Hải. Neighbouring tiles differ by at most 2 levels (1 in the valley); one-level edges carry walk links, routes carry visible stairs; bridges join real places (the cave mouths over the flank streams, the avenue and the cloud-lookout path over the outflow).
**Trees / colour:** big peach (pink), maple (orange-red), jade broadleaf, willow, mountain pine, bamboo, code-painted shrubs and flower beds in four colourways, boulders; forests are placed by height, moisture and zone (peach terraces west, willows and bamboo at the water, pines and boulders on the rock, maples on the slopes).
**Life:** 1 Great Sage, 5 guards, 3 elders, 11 young monkeys, 18 monkeys, 3 deer; code creatures: cranes (standing in the lake, landing), koi, lily pads, rabbits, squirrels running up the peach trees, doves, bird flocks, butterflies, fireflies. Daily activities: sort fruit (climb, pick, carry a basket to the depot), spar with staves, play the drums (the drums thump), sweep, drink, bathe / dive, graze, meditate on stones, playground, sit in the cave (they disappear through the water curtain and come out of the other mouth), climb the cliff, groom, fish, pray, patrol, drill.
**14 mini events:** fruit raid, storytime, dive party, fruit supper, guard drill, spar match, deer drink (a kid startles them), cranes land on the lake, rain (then rainbow), a monkey leaps through the curtain, mountain mist, a bird flight past the fall, a surge of the Great Fall, a chase over the terraces.
**Signature `great_sage_returns` ("Tề Thiên Đại Thánh trở về"), 14 phases (about 215 s):** calm -> clouds above the peak wind -> a sentry spots a figure -> the troop runs down from every terrace to the court -> Wukong (Great Sage armour, the same character as the resident king) rides his cloud home -> drums, banners, dancing -> he leaps onto the dais and raises the staff: golden aura, wind, scattering birds -> he plucks his hairs: six clones appear in puffs, spar and vanish -> the troop follows him to the lake -> he leaps through the curtain, the troop after him -> the great feast in the courtyard (the troop re-emerges from the cave mouth, baskets and fruit, drums) -> he takes his throne -> soft recovery. Two-line captions (Vietnamese / English); the story camera yields for 7 s after any input.
**Edges:** west / north-west (Bạch Cốt Lĩnh placeholder): the range continues as foothills (12 tiles, stepping down from the rim, rock / moss / pine / maple); east (Lôi Âm Tự placeholder): the sea runs on 10 tiles and ends in a beach; south-west: the cliff over the Buddha's Palm cloud sea; south: the Huaguo gate. The only shared render change besides the dispatch hooks is an optional `trans` alpha on `TWM.falls` entries in `drawFall` (the see-through curtain).
Tests: `tests/tayduky-v2-hqs-sim.mjs` (the whole signature in Node, seeds 7 / 21 / 33), `tests/tayduky-v2-hqs.mjs` (frozen phase frames), `tests/tayduky-v2-hqs-shots.mjs` (review shots + console errors), map15, sim 900 / 1200 s, heaven-assets, fire, lion, hps, nhs, ntq.
Limitations: no new PixelLab sprites (the cave arch is painted into the cliff face; clones reuse the monkey sheet; actions beyond walk / act / sit / hop / climb are poses); the peach trees are the Heaven sprites, the huts the pilot's; the unfinished neighbours (Bạch Cốt Lĩnh west, Lôi Âm Tự east) still end in placeholder ground beyond the 12-tile band; a few tree posts on the narrow west strip are unreachable and are dropped at build time; the 900 s sim test needs a seed whose Buddha's Palm story starts early (passes for seeds 7 / 11 / 33; seed 21 passes at 1200 s).

## Lòng Bàn Tay Phật Tổ (the Buddha's Palm) — rebuilt from scratch (2026-11-22)

The old cloud-sea-with-five-sprite-pillars design was **discarded**. `tw-btp.js` (map, world space, purges the old content), `tw-btp-art.js` (replaces the terrain painters of `TWA.ext`, keeps its cloud / Buddha / wheel / bell / lotus sprites), `tw-btp-data.js` (residents, activities, 9 new mini events, signature) and `tw-btp-fx.js` (replaces `TWFX.palm`, keeps `drawRide`, the somersault cloud). The old `tw-palm*.js` files stay only because `tw-palm-data.js` defines the shared flight steps (`soar`, `flip`, `land`, `mount`) used by other biomes. The planner footprint (953 tiles, x 53-90 / y 30-76) is kept; the 15-region test passes.
**The hand, as terrain:** an ivory-gold **palm slab** (level 6, 16 x 11 tiles) with three inlaid gold **palm lines** (heart, head, life) and a ring of inlay for the seal; **five finger pillars** north of it (little 12, ring 15, middle 18, index 15 levels; carved knuckle bands, gold rune studs, lotus nail caps) with mist lanes between them; the **thumb** as a stouter pillar at the east side (level 10); the **wrist** running away to the south-west in three steps and fading into the cloud sea; the **seated Buddha** (existing `buddha_a` sprite) on a stepped **lotus terrace** at the west corner (level 10, stairs of lotus petals up from the palm). Around it: two cloud terraces, five lotus islands (cloud bells, lotus blooms), cloud bridges, and an east cloud walkway that meets Hoa Quả Sơn / Ngũ Trang Quán on level 1. The cloud sea is bright azure with white billows and gold pools near the hand (not the old violet).
**Edges:** the cloud sea runs on over the unfinished Cao Lão Trang (west) and Liên Hoa Động (south-west) as an 11-tile band that fades out (applied in `TW_BTP_FINAL`, after the provisional trails, so connectivity is unchanged); next to Hoa Quả Sơn, Ngũ Trang Quán and Hắc Phong Sơn the sea is kept shallow (level 0-1) so no cliff shows.
**Animation:** drifting cloud wisps over the palm (thick before the signature, parted at the reveal), cloud banks sliding past, golden light shafts, gold dust, falling lotus petals, lotus blooms that open and close, cranes standing on and circling the fingertips, bird flights, butterflies of light, pulsing palm lines, finger glow and rune studs, the Buddha's halo, thunder in the far clouds, caption and story camera (yields 7 s after input).
**Residents:** Wukong (Great Sage armour), 4 attendants, 2 celestial maidens; activities: devotion, lotus tending, offerings, lamp rounds, cloud sweeping, resting, the king's cloud rides / finger-lane runs / perching; after the signature the king is **held in the seal** (paces inside the ring, sits, looks up) until the next loop releases him.
**9 new mini events (+ 2 kept):** clouds roll across the palm; cranes circle a fingertip; lotus blooms open and close (petals); rune glow runs along the fingers; distant thunder; the attendants carry lamps around the palm; Wukong runs the finger lanes; dust gathers into a ring and dissolves; a gust parts the clouds then they return; (kept) somersault cloud flight, bounce off the invisible boundary.
**Signature `buddha_subdues_wukong` ("Phật Tổ thu phục Ngộ Không"), 12 phases (about 120 s):** calm -> Wukong swaggers across the palm -> he somersaults towards the edge of the world -> the five fingers light up one by one and turn him back -> the clouds part and the whole palm is shown -> the inscription ring and runes appear -> beams from the five fingertips close into a prison of light with a column of light -> he is pressed down into the seal: thunder, shock wave, birds scatter -> the Buddha sits unmoved (halo) -> the force steadies and the clouds settle -> recovery (the seal dims, attendants return, Wukong stays held and loops in the ring). Two-line captions (Vietnamese / English).
Tests: `tests/tayduky-v2-btp-sim.mjs` (the whole signature in Node, seeds 7 / 21 / 33), `tests/tayduky-v2-btp.mjs` (frozen phase frames in Chrome, `screenshots/btp/`), `tests/tayduky-v2-btp-shots.mjs` (review shots + console errors), map15, sim 1200 s.
Limitations: the fingers do not physically curl (the old sprite-curl design was dropped); beams, the column and the prison are light effects; the thumb and fingers are tile blocks with carved faces, not a sculpted sprite; no new PixelLab sprites; beyond the 11-tile band the unfinished neighbours still show placeholder ground.

## Bạch Cốt Lĩnh (White Bone Ridge) — built (2026-11-22)

World-space biome on the planner's `bcl` region (1,005 tiles, a C-shape that wraps the Heaven cloud sea: the north ridge x 1-60 / y 1-6, the east valley x 41-60 / y 7-32, the south pocket x 29-56 / y 33-40): `tw-bcl.js` (map), `tw-bcl-art.js` (palette, code-painted props), `tw-bcl-data.js` (residents, activities, 10 minis, signature), `tw-bcl-fx.js`. No footprint change; the 15-region test passes.
**Layout (the pilgrims' road, 18 waypoints):** the entry pass (level 2) -> the **grave field** (26 graves, coffins, a ruined shrine, skull totems, bone-chime posts) -> the clearing at the fork (level 3: a dead tree, a stone table, a pool of black ghost water, ghost crystals) -> the **giant ribcage** arches over the road -> the **ivory bone palace** terrace (level 7, `sdl_tusk_a`) -> the **skull cave** (`hps_lair_a`, Bạch Cốt Tinh's den, level 7) at the corner -> stairs up to the **knife-edge ridge** (level 8-9 above the Heaven sea) -> the **chasm** (a black river five tiles wide, ten levels down) crossed by a stone bridge -> the far **lookout** over the void. The east valley is a canyon (walls 7-13 levels, the east wall meets Hoa Quả Sơn's rim); a black stream runs from the lair spring down the valley to the pool and out through the pass.
**Palette / props:** bone white, grey-violet, ghost green, dark moss, cold brown; cold earth, pale dead grass, jagged rock with bone bands and roots, grave paving, bone rubble, black water with green glints. Reused sprites: bone palace, skull cave, skull totems, ruined shrine, wayshrines, dead trees, dark pines, boulders, ghost crystals, bridge. Painted by code: ribcage arches, bone chimes, graves, coffins, skulls on stakes, bone piles, dead grass, ghost pyres.
**Edges:** the Hoa Quả Sơn rim (east) is matched level for level; the Heaven cloud sea (south-west of the valley, south of the ridge) lies below cliffs; a bone-field band (dead grass, bone rubble, moss, dead pines) runs 10 tiles over the unfinished Hỏa Vân Động (west) and Cao Lão Trang (south) and fades out (applied in `TW_BCL_FINAL`, after the provisional trails); the world rim (north) is a cliff to the void.
**Animation:** ground fog banks crawling along the road, ghost-fire wisps with trails and ghost pyres, crows (standing on graves, taking off, scattering), tattered flags and bone chimes whipped by the wind, glowing eyes in the dark (red in the cave), drips and pool mist, ash / dead leaves / bone dust, bone-rats in the grave field, a pale spirit gliding through the fog, fireflies of ghost light; all of it thickens at night.
**Cast:** the four pilgrims (Tang Sanzang, Wukong in pilgrim robes, Bajie, Sha Seng), the White Bone Demon (resident in her den) and her four forms as PixelLab characters (girl with a basket, old woman with a stick, old man, true form: a skeleton in a funeral cloak), 5 skeleton servants (daily life: patrol, dig graves, tend pyres, prowl, drink, wander).
**10 mini events:** crows land on graves then scatter; ghost fire rises from the graves; a skeleton pile collapses (servants flee); a white shape glides through the fog; a howling gust (flags and chimes thrash, fog surges); a gust scatters birds; the girl / old woman / old man is glimpsed from afar and vanishes (random form); Bajie complains of hunger; Sha Seng watches the cliff; the pyres flare.
**Signature `three_strikes` ("Tam Đả Bạch Cốt Tinh"), 15 phases (about 170 s):** foreboding (fog, ghost fire, servants hide) -> the pilgrims enter -> a girl with food comes down the road -> Wukong sees through her -> strike 1 (gold trail, flash, she collapses into bones, a wisp of yaoqi escapes) -> Tang Sanzang scolds him -> an old woman looking for her daughter -> strike 2 -> the quarrel sharpens -> an old man looking for his wife -> strike 3 -> the true form bursts out (bone aura, fog vortex, shock wave, birds scatter) -> the fight (ghost fire, shards, shock waves) shatters her -> Tang Sanzang banishes Wukong -> he leaves on his cloud -> recovery: fog thickens, the three walk on, a faint golden afterimage marks the empty place where he stood. Captions (Vietnamese / English) and a story camera (with shake on the strikes) that yields for 7 s after input.
Tests: `tests/tayduky-v2-bcl-sim.mjs` (the whole signature in Node, seeds 7 / 21 / 33), `tests/tayduky-v2-bcl.mjs` (frozen phase frames, `screenshots/bcl/`), `tests/tayduky-v2-bcl-shots.mjs` (review shots + console errors), map15, sim 1200 / 1500 s.
Limitations: the demon and servants have walk clips only (actions are poses; the transformation is smoke + a fade between sheets); the ribcage, graves and chimes are small painted sprites; the Heaven cloud sea beyond the cliffs and the placeholders beyond the 10-tile band are not part of this biome.

## Integration: Bàn Tơ Động + Hỏa Vân Động (2026-11-21)

Integration branch `integration/tayduky-codex-biomes` starts at Claude commit `3429cd4` and imports the Codex work through source commit `0ea38ce` (`e1231d4` Bàn Tơ Động, `fd13434` Hỏa Vân Động, `0ea38ce` HVD parse repair). Nothing is merged to `feature/tayduky-redesign-v2` or `main`.

- **Bàn Tơ Động:** retains Claude's compact world placement while adding the raised web throne, monumental cave, elevated silk prison, readable battle court, three falls and the full capture/battle/clone-rescue/aftermath/recovery signature. Dedicated four-direction action sheets cover Bajie, Sha Wujing, Tang Sanzang and Wukong; all seven sisters remain active with their back-leg and weaving motion.
- **Hỏa Vân Động:** keeps Claude's planner footprint exactly: **991 tiles**, bounds **`[1,7]–[35,90]`**. Of Codex's former 1,120 tiles, 982 overlap directly; the removed northern strip belongs to completed Bạch Cốt Lĩnh. Fortress, ritual terrace, court, village, prison, waterfall and all 25 reachable POIs remain. A short ritual-to-Heaven seam path at `(26,33)` preserves global walkability without moving or scaling the biome.
- **Materials:** Thông Thiên Hà remains **120–126**. HVD is centrally registered as **156–161**: `HCRIM=156`, `HCOPPER=157`, `HPINE=158`, `HPATH=159`, `HASH=160`, `HBRIDGE=161`. `tw-hvd.js` validates these IDs instead of assigning its own range.
- **Runtime:** Claude's current `index.html`, map, renderer, art/fx dispatch, camera table, simulation and loader remain the base. BTD/HVD hooks were added narrowly. HVD modules parse without the literal `\\n` regression fixed by `0ea38ce`.
- **Assets:** source JSON was merged before regeneration. The integrated registry contains 60 characters and 215 object sprites; HVD and BTD raw PixelLab sources, action sheets, packers and catalog entries are retained.

Verification and review screenshots are recorded in [`INTEGRATION-BTD-HVD.md`](INTEGRATION-BTD-HVD.md). Both 1,800-second simulation seeds, the 15-biome map/director suite, focused BTD/HVD tests, all implemented-biome regression suites and real-Chrome day/night/signature/recovery views pass. Current built count is **12/15**; `lat`, `clt` and `lhd` remain placeholders.

## Checkpoint — tích hợp Codex (2026-11-22)

`feature/tayduky-redesign-v2` đã fast-forward từ `3429cd4` lên `df2ad86` (Bàn Tơ Động + Hỏa Vân Động từ `integration/tayduky-codex-biomes`; báo cáo: `INTEGRATION-BTD-HVD.md`). Không force, không merge `main`, không push.
**Biome hoàn chỉnh (12/15):** Hoa Quả Sơn, Bàn Tơ Động, Thiên Cung, Lòng Bàn Tay Phật Tổ, Hỏa Diệm Sơn, Sư Đà Lĩnh, Thông Thiên Hà, Hắc Phong Sơn, Ngũ Hành Sơn, Ngũ Trang Quán, Bạch Cốt Lĩnh, Hỏa Vân Động. Còn placeholder: Lôi Âm Tự (`lat`), Cao Lão Trang (`clt`), Liên Hoa Động (`lhd`).
**Kiểm thử sau tích hợp:** map15 PASS; sim 1800 s seed 7 và 21 PASS; banto, hvd (991 tiles, 25 POI), btp/hqs/bcl/ntq sim PASS; smoke Chrome `at=btd|hvd|bcl|btp|hqs` không lỗi JS; không trùng material ID; HVD 0 ô placeholder, BCL 1.005 ô / 201 props nguyên vẹn; không file nào bị xóa. Lỗi còn lại: `tayduky-v2-river.mjs` FAIL mục `land` (có sẵn từ trước).
**Việc tiếp theo:** polish Lòng Bàn Tay Phật Tổ (đọc rõ hơn là bàn tay), rồi Thiên Cung và Đại Lôi Âm Tự.

## Lòng Bàn Tay Phật Tổ — visual rescue (2026-11-22)
**Why:** the first rebuild faked fingers with box terrain; they read as stone walls / stairs. The hand is now a **hybrid landmark**: one large pixel-art **hand sprite** (kind `palmhand`, painted by code in `tw-btp-fx.js` from a signed-distance field, true 2:1 projection) is the visual; underneath, `tw-btp.js` keeps a flat level-6 walkable tilemap (hand tiles whose centre lies inside the field; their `MAT` is set to `VOID` in `TW_BTP_FINAL`, `H` and `WALK` stay) so collision, routes and POIs are unchanged in kind.
**Geometry** (`TWM.palm.geo`, hand frame u = along the fingers = screen right, v = across): a superellipse palm (curved, narrowing to the wrist), a wrist that runs 12 tiles toward the lotus mountain, four tapering three-phalanx fingers of different length (middle 11 > index 9.6 ≈ ring 9.8 > little 7.2) fanned 17-21 degrees, and a thumb growing from the palm's edge at ~69 degrees to the fingers; smooth-min webbing at the finger bases, 2 px outline, rounded pink nails, gold joint grooves, three gold palm lines and a seal ring inlaid in the ivory stone, a 20 px carved slab edge with a gold band. Spread frames (1 / 0.74 / 0.5) let the fingers **close** during the seal (`pick`, chosen from beams / column / bound).
**Other changes:** the Buddha is drawn at 2x (a dais of four concentric tiers at the wrist end, halo and light scaled); denser cloud sea (rolling cloud cliffs, 160 puffs, drifting banks, mist curtain along every border with a built neighbour); a gold aura follows Wukong on top of everything during the story; the signature is faster (about 57 s from foreshadow to `disperse`, was about 137 s; `foreT` per story shortens the foreshadow in `tw-sim.js`) with a new `btp_mark` beat (the mark on the middle fingertip).
**Acceptance gate screenshots:** `screenshots/btp/hand-1-wide-zoom1.png`, `hand-2-silhouette.png` (props and people hidden), `hand-3-wukong-on-palm.png`, `hand-4-night-wide.png`, `hand-5-fingers.png`, `hand-6-thumb.png` (`tests/tayduky-v2-btp-hand.mjs`).
**Known limits:** the palm centre is flat-shaded (little relief); the cloud puffs are drawn as an overlay (no depth sort); the lotus mountain is still tiled terrain.

## Thiên Cung — rework, stage 1 (2026-11-22)
**Scope honestly:** the pilot's jade terrain (courts at levels 7 / 5 / 3, the bronze furnace terrace, the south causeway) is KEPT because it is wired into the world; everything on it is re-planned (`tw-tc2.js`) as four readable yards: **Nam Thiên Môn** (a second great gate across the south plaza at the foot of the causeway, lantern towers and braziers), the **Court of Heaven** (pillars, silk lamps, brazier corners, drill posts), the **Peach Garden** (ten divine peach trees, pavilion, banquet tables, silk lamps) and the **Eight-Trigram Furnace** precinct (kiln, braziers, talisman pillars, a pavilion, flame-watch posts) plus the palace terrace in the north. Not done: new terrain heights / extra tiers, a jade pond, new PixelLab landmark art (every sprite is reused).
**Life (`tw-tc2-data.js`):** 8 fairies, 7 heavenly guards, Laojun, Wukong (heavenly outfit); new activities `tc2_drill`, `tc2_southgate`, `tc2_flame`, `tc2_sweep`, `tc2_terrace`; **13 minis** (shift change, furnace flare, peach baskets, cranes, cloud over the gate, falling glowing peaches, drill, rainbow, petal wind, lantern pulse, Wukong's roof hop, the bell, flare).
**Signatures (3):** `havoc_heaven` (Đại Náo Thiên Cung, rebuilt, about 48 s: banquet prep -> Wukong slips in -> eats the peaches -> alarm -> chase across the court -> leap to the high terrace -> the staff sweep scatters the guards -> the wrecked banquet), **`eight_trigram_furnace`** (new, about 39 s: the furnace stirs -> Wukong is marched in -> the lid shuts and the trigram ring spins -> fire climbs, black cloud, the ground shakes -> he kicks the furnace apart and bursts out (flying lid, shock wave, embers) -> soars to the court -> the guards flee -> the fire dies down) and the existing `peach_banquet`.
**Effects (`tw-tc2-fx.js`):** furnace flames / sparks / smoke / heat rings / trigram ring and talismans / flying lid, shock and ember bursts, storm cloud, thunder flash, screen shake, cranes and birds, falling peaches, rainbow, cloud banks over the gate, petals, silk banners on poles, brazier flames, lantern pulses, caption, story camera and a gold aura on Wukong.
**Tests:** `tests/tayduky-v2-tc2-sim.mjs` (both signatures + states), `tests/tayduky-v2-tc2-shots.mjs` (screenshots in `screenshots/tc/`), map15, `tayduky-v2-sim` (its Thiên Cung coverage now expects the two signatures and at least 4 tc minis; seed 33 at 1200 s ends before `havoc_heaven` finishes: timing, not a defect). No PixelLab generations.
**Lôi Âm Tự (`lat`) is NOT started** (still the placeholder).

## Thiên Cung — Phase 2 (2026-11-22)
Real tiers now: the south plaza 3 -> the court 5 -> the ceremony terrace 8 -> the Linh Tiêu hall platform 10 (a double-size hall), the peach garden 7 with a small jade pond on its west edge, the furnace yard 5 -> 7 -> ring 8 -> dais 9. Nam Thiên Môn and the Eight-Trigram Furnace are drawn at twice the size (code-scaled existing sprites, no PixelLab). The furnace has glowing cracks while it burns; when Wukong kicks it apart bronze shards fly (physics debris), the lid flies off and he stands in front of the furnace for a beat (kick pose) before soaring out (`screenshots/tc/tc-sig-*.png`). Not done: seam / rim treatment against Bạch Cốt Lĩnh and Hỏa Vân Động, a visible waterfall, new PixelLab art, a full review of the 13 minis at gameplay zoom; the big gate overlaps the garden and court in the wide shot.

## Đại Lôi Âm Tự (Linh Sơn) — built (2026-11-22)
**Footprint:** the planner's `lat` region (692 tiles, x 102-122 / y 1-35, a tall strip on the east edge: the Hoa Quả Sơn sea west, Ngũ Trang Quán south-west, the world rim north and east). No footprint change. `tw-lat.js` (map), `tw-lat-art.js` (terrain art: blue-grey mountain rock with moss / vines / white cascade streaks, ivory paving, gold platform plates, bodhi lawn, pilgrim slabs, holy water), `tw-lat-data.js`, `tw-lat-fx.js`.
**One holy mountain, climbed from the south, 5 elevation bands (levels 7 -> 17, mountain walls up to 25):** A the foot (y 28-34, levels 7-8: pilgrim lawn, wayshrine, stupa, bodhi / maple / pine groves, lanterns, the road enters from Ngũ Trang Quán at (113, 34); the Ngũ Trang Quán ledge pocket at (112-114, 35-37) is joined to its main path by two level-7 connector tiles (113, 37) and (113, 38), the only edit outside the region); B the Linh Sơn gate terrace (y 22-27, level 10: the PixelLab gate at double size, guardian statues, incense burners, lanterns, the holy pool at level 8 with lotus); C the Arhat Court (y 14-21, levels 12-13: sutra pillars, the sutra pagoda, stupa, statues, the lotus pond, arhat seats, the sacred fall from the pond into the holy pool, the outflow stream); D the Great Hall terrace (y 2-13, levels 15-17: the PixelLab Đại Hùng Bảo Điện at double size, the Tathagata on a lotus dais (double size) in FRONT of the hall so the kneeling scene stays readable, two lotus pools, burners, the great bell, lanterns). Wide five-to-seven tile flights join every band (explicit stairs, collision and pathfinding tested).
**Palette:** blue-grey rock, ivory, gold, red lacquer, green and maple red, white and pink lotus, jade-blue holy water. **Life:** 6 young monks, 5 arhats, Kasyapa (the elder), Guanyin, 3 pilgrims; 14 daily routines (sweep, chant, mallet, great bell, incense, sutra carrying, lotus wiping, tables, bodhi care, arhat sitting / walking, the elder's rounds, the pilgrim climb with real kneeling at the gate and in the court, Guanyin at the court). **12 minis:** great bell, lotus bloom, cranes over the hall, flower rain, group chanting, golden beam through the clouds, pilgrim party, dais glow, arhat shift, falls surge + rainbow, assembly preparation, the Dharma wheel.
**Signatures (2):** `seek_scriptures` (about 45 s: bell and golden cloud -> the five pilgrims appear at the foot -> they climb -> the gate opens -> the Arhat Court -> they KNEEL (a real pose: legs fold, the figure drops, then bows) -> the wheel and words -> Ananda and Kasyapa hand over the scrolls -> BLANK pages -> they return -> the true scriptures blaze with golden words -> bow, settle) and `merit_fulfilled` (about 59 s: assembly gathers -> the four kneel -> the decree -> Tang Sanzang's aura -> Wukong's golden light (Victorious Fighting Buddha) -> Bajie and Sha Seng -> the white horse's radiance -> lotuses bloom -> the golden light sweeps down the tiers -> the great Dharma assembly (flower rain, cranes, bells, golden cloud) -> they rise).
**Engine additions:** a `kneel` step and pose in `tw-sim.js` / `tw-render.js` (the sprite is deformed: legs fold under, the body drops, a bow from the waist), a `sutra` / `blank` scroll drawn in the pilgrims' hands, `foreT` per story, optional `pick` for flat sprites.
**Tests:** `tests/tayduky-v2-lat-sim.mjs` (both signatures; four kneel at once, bow, blank and true sutra, states, no teleports), `tests/tayduky-v2-lat-shots.mjs` (screenshots in `screenshots/lat/`), `tests/tayduky-v2-lat.mjs` (Chrome capture of every signature phase), map15 (the Ngũ Trang Quán pocket connector made it pass: 15 regions reachable).
**Limits:** the kneel is a code deformation of the walking sprite, not a drawn clip; A Nan is the first young monk and Kasyapa the elder (no unique character art); the east cliff (the world rim) is long and uniform apart from cloud banks and cascade streaks; the camera cannot pan past the world's east edge so the wide shot is the same as the gate view.

## Thiên Cung readability + seam pass (2026-11-21)
- Nam Thiên Môn is drawn at the world's own scale again (1x instead of 2x; footprint 9x2 -> 7x2, moved to (25,27)). It still frames the plaza but the court, the chase of Đại Náo Thiên Cung and the furnace beyond stay readable (`screenshots/tc/tc-event-havoc-behind-gate.png`, `tc-day-wide-before.png` for comparison).
- Seams: the pilot's pale HEAVEN stone in the Peach Garden (read as blank white patches) is now lawn with one jade path; cloud banks wrap every cliff foot / corner where Thiên Cung stands above cloud or a neighbour's lower rock (`tw-tc2-fx.js` `seamList` / `seamMist`), which softens the hard vertical face edge east of the court. `tc-seam-before.png` / `tc-seam-after.png`.
- Limitations: the Bạch Cốt Lĩnh rock wall (level 13) beside the furnace dais still rises abruptly (its hidden west face cannot be dressed from Thiên Cung); the neighbour's pool waterfall face above the east face edge is unchanged.

## Cao Lão Trang (clt) — built 2026-11-21
**Footprint:** the planner's `clt` region (559 tiles, x 36-66 / y 29-57, a leaf-shaped valley between Bạch Cốt Lĩnh's low hills, Hỏa Vân Động, the palm causeway and Liên Hoa Động). No footprint change. Files: `tw-clt.js` (map), `tw-clt-art.js` (terrain + painted farm props), `tw-clt-data.js` (residents, routines, 14 minis, 2 signatures, state `TWS.clt`), `tw-clt-fx.js` (living effects, caption, story camera). Materials 168-177. Camera targets: `?at=clt|cltcourt|cltgao|cltsquare|cltgate|cltpond|cltfield|cltpen|cltlane|cltfall|cltnorth|cltseam|cltwest|cltrim` (+ `&force=clt&speed=3` for a signature).
**One village, levels 1-4:** A the Gao compound (a level-3 terrace x 47-58 / y 38-43 behind a level-4 garden ridge: the PixelLab courtyard house at twice its size, a thatched wing, the granary, the well, a peach tree; one wide stair rises from the square), B the square and main street (market stalls, earth-god shrine, houses, willow bank; the road runs west gate (37, 47) -> plank bridge over the stream (43, 47) -> square -> compound / south road (48, 55) / east causeway), C the water (a level-4 hill spring falls into the upper pond, the stream runs south under the bridge into the lotus pond; a second spring feeds the east paddies by a canal with a sluice), D the fields (west paddies, east paddies and gardens, the pig pen, haystacks, scarecrows, carts, a drying rack, a water wheel), E the bamboo lane (the north-east tail is a hill orchard and bamboo grove climbing to an earth-god shrine). 382 walkable tiles, 83 props, 56 posts, 9 stairs, 8 lights. Links: hvd (west gate), bcl ((44, 38)), lhd (south edge), btp (the causeway).
**Palette:** warm village greens with meadow flowers, flooded paddies mirroring the sky between green seedlings, ripe golden rice, tilled soil, packed-dirt roads, grey flagstones, whitewashed walls under dark tile, thatch and warm wood, peach blossom. **Life:** Gao Taigong, Cuilan, Granny Gao, Zhu Bajie as the son-in-law (`bajie_son`, a human disguise) and the pig demon (`bajie`), 8 farmers, 2 vendors, 3 children, 4 pigs (PixelLab), 2 water buffalo; 15 routines.
**Mini events (14):** harvest (stubble patch, sheaves), planting, sluice (canal runs dry then flows), ducks crossing the path, piglets escaping, Bajie sneaking food, children at the pond, cart repair, market trade, harvest party (grain, lanterns), birds landing on the paddies, baskets between buildings, ox herd along the main street, a rain shower (everyone shelters, rainbow after).
**Signatures (2):** `gao_mystery` (about 110 s, 17 beats / 12 staged actions plus a foreshadow and a 3-beat recovery: the family worries, Tang Sanzang and Wukong arrive at the gate, Wukong notices, investigates, takes Cuilan's shape, Bajie comes courting and is exposed, turns into the pig demon (look swap + smoke), the villagers panic and shelter, the confrontation, the chase through court, square, paddies, gardens and pond, Bajie is subdued at the pond and kneels, the family and village recover; Bajie returns to human form among the residents) and `bajie_joins` (about 95 s, 13 beats / 8 staged actions plus a foreshadow and a recovery: Bajie sulks by the pen, Wukong and Tang Sanzang explain the pilgrimage, the Gaos answer, he kneels and is named, the villagers bring baskets, the party lines up and leaves by the west road while the village waves, life resumes).
**Tests:** `tests/tayduky-v2-clt-sim.mjs [seed]` (props placed, reachability, links, both signatures end to end, look swaps, kneel, 10+ distinct minis, durations 80-200 s, no teleport / stuck tile, recovery), map15, `tests/tayduky-v2-newbiome-shots.mjs clt` (stills and signature stages in `screenshots/clt/`).

## Liên Hoa Động (lhd) — built 2026-11-21
**Footprint:** the planner's `lhd` region (583 tiles, x 30-74 / y 56-85, a tall pine ridge south of Cao Lão Trang that opens into a wide basin along the Sư Đà Lĩnh border). No footprint change. Files: `tw-lhd.js` (map), `tw-lhd-art.js` (terrain, painted landmarks), `tw-lhd-data.js` (residents, routines, 14 minis, 2 signatures, state `TWS.lhd`), `tw-lhd-fx.js` (effects, treasure beams, caption, camera). Materials 180-187. Camera targets: `?at=lhd|lhdmouth|lhdcanyon|lhdcourt|lhdarena|lhdtreasure|lhdnorth|lhdseam|lhdeast|lhdwest` (+ `&force=lhd&speed=3`).
**One demon mountain, levels 1-13, walked from the north and then south and east:** A the pine approach (y 56-61), B the canyon (stream under a natural stone bridge, a fall off the east wall, walls of levels 6-9), C the patrol yard (level 4: racks, dummies, tents, braziers) and the demon courtyard below it (level 3: the captive cage, the lotus gate), D the cave massif (levels 9-10) with the Lotus Cave mouth (a code-painted landmark at twice its size: a stone lotus whose heart is the arch, a gold horn and a silver horn on its shoulders, stalactite teeth, warm inner glow), E the inner halls on a terrace (level 7 so the neighbouring Sư Đà Lĩnh wall does not hide them): the arena with glowing runes and crystal floor, the throne, the treasure chamber (the hoard, the Purple Gold Red Gourd, the Jade Pure Bottle, the Golden Rope, the Seven-Star Sword on pedestals) and the east ledge up to Hắc Phong Sơn at (74, 81). 345 walkable tiles, 60 props, 35 posts, 9 stairs, 16 lights. Links: clt (north edge (48, 56)), btp (NE ramp (58, 58) -> palm wrist), hps (east end (74, 81)), btd (west end (30, 83)), hds (south-west end (34, 85)).
**Palette:** cool blue-grey rock with teal moss and pale veins, slate cave floor, flagstones, pine needles, a dark red treasure floor inlaid with gold, blue-violet crystal glow, warm firelight. **Life:** Golden Horn King (`lhd_gold_king`) and Silver Horn King (`lhd_silver_king`, silver-blue recolour of the roc), 6 demon guards, 3 wolf sentries, 5 cave imps, 2 officers, 2 trainees.
**Mini events (14):** patrol change, treasure hauling, gate inspection, a treasure waking (pulse rings), cave lights (runes), bats leaving the cave, peak birds, a falls surge, demon training, a treasure-room check, a cave ritual, mist rolling out of the mouth, a sparring clash, sentry howls.
**Signatures (2):** `gold_silver_encounter` (about 195 s, 23 beats / 16 staged actions plus a foreshadow and a recovery: the cave stirs, the pilgrims come down the canyon, the kings notice, the Golden Rope binds Tang Sanzang, Bajie and Sha Seng and they are caged, Wukong watches from the lookout, disguises himself as an imp, the kings bring out the gourd and the bottle, Wukong is sucked into the gourd, slips out and swaps it, the rope fails on him, a duel with the sword, the kings are drawn into the true gourd, the prisoners are freed) and `treasure_revelation` (about 90 s, 21 beats / 11 staged actions plus a foreshadow and a recovery: the quiet after the battle, Wukong examines the treasures, Laojun's seal appears over them, Laozi descends, the gourd opens and the kings kneel, the treasures fly back to him, the kings turn into the Golden and Silver Furnace Boys, they leave for Heaven, the pilgrims leave by the east road, cave life resumes). All four treasures change hands (verified in the test).
**Tests:** `tests/tayduky-v2-lhd-sim.mjs [seed]` (links to five neighbours, both signatures, rope / suction / slash / flight / seal / descent beams, imp and furnace-boy looks, kings sealed and restored, all four treasures change hands, 10+ minis, no teleport / stuck, recovery), map15, `tests/tayduky-v2-newbiome-shots.mjs lhd` (screenshots in `screenshots/lhd/`).

## Global 15-biome blending audit and seam fixes (2026-11-21)
All 15 regions are built now. Every shared boundary of the two new biomes was inspected in screenshots (day, plus night for the two wide views), not only by the map tests:
- **Cao Lão Trang:** west with Hỏa Vân Động (`screenshots/clt/clt-west-seam.png`: the village gate arch and the first paddies against the red cliff; the road meets Hỏa Vân Động's flat edge at level 1) and the south-west contact with Bàn Tơ Động (same shot, a high dark wall that only touches the village's paddies); north with Bạch Cốt Lĩnh (`clt-north-seam.png`: the garden ridge and bamboo lane under Bạch Cốt Lĩnh's grey cliff wall); east and south-east with the palm (`clt-east-seam.png`: the eastern lobe against the hand and the cloud-sea tiles); south with Liên Hoa Động (`clt-south-seam.png`, `clt-pond.png`: grass steps into a moss-topped bluff above the canyon); the tiny contact with Hoa Quả Sơn at (63-65, 29) sits behind Bạch Cốt Lĩnh's cliff and cannot be seen.
- **Liên Hoa Động:** north with Cao Lão Trang (`lhd/lhd-north-seam.png`), north-east and east with the palm (`lhd-east-seam.png`, `lhd-day-wide.png`: the palm's cloud sea runs along the hall's north rim), east with Hắc Phong Sơn (`lhd-east-seam.png`: the treasure chamber's east ledge climbs to Hắc Phong Sơn's green slope at (74, 81)), south with Sư Đà Lĩnh (`lhd-day-wide.png`, `lhd-arena.png`: the Sư Đà Lĩnh wall and its roc nest), west with Bàn Tơ Động (`lhd-west-seam.png`), the south-west tip with Hỏa Diệm Sơn at (34, 85) (a single trail tile).
- Whole world: `screenshots/overview/overview-15-biomes.png` (the 15-region mask) and the wide shots above.

**Exact fixes made (all targeted; no completed biome's interior, landmark or footprint was changed):**
1. `tw-btp-fx.js`: the palm's cloud puffs and drifting clouds never hang within five tiles of Cao Lão Trang or Liên Hoa Động (a drifting cloud used to sit over the Gao courtyard and the hall's arena).
2. `tw-btp-fx.js`: the giant Buddha (a 2x landmark at (61, 60), just south-east of both villages) turns translucent (alpha 0.34, eased) while the camera is on either village, because its sprite covered the village gardens, the pond and the canyon yard (e.g. the chase of the Gao signature).
3. `tw-lion-data.js`: the Golden Roc's flights always land on his nest. A second flight started mid-arc used to land over the stream (the longer random sequences of the 15-biome world exposed it as 'standing on a blocked tile' in `tayduky-v2-sim`).
4. Liên Hoa Động joins its five neighbours explicitly: north edge (48, 56) to Cao Lão Trang, a ramp (55-58, 58) up to the palm wrist at (59, 58), the east ledge (74, 81) to Hắc Phong Sơn, the west end (30, 83) to Bàn Tơ Động and (34, 85) to Hỏa Diệm Sơn (the neighbours' old gate trails ended inside the placeholder). `tayduky-v2-map15` still reports one global component reaching all 15 regions.
5. The Liên Hoa Động inner halls stand on a level-7 terrace: with the halls at level 3 the Sư Đà Lĩnh wall (levels 10-13) and its nest hid the arena.
6. Night pass: a light placed on a fractional tile crashed the whole frame (`createRadialGradient` non-finite); both sim tests now assert integer light tiles.

**Unfixable / left as is (documented):**
- The Sư Đà Lĩnh roc nest (a tall pre-existing landmark) still stands in front of the arena's south side; the arena and the treasure chamber are readable but the nest covers the strip south of them.
- The translucent Buddha reads as a faint apparition over the village while the camera is there; a proper fix would move the statue, which belongs to the Lòng Bàn Tay Phật Tổ design.
- The palm's pale sky-cube tiles next to the village's north-east corner (66-70, 46-52) and along the hall's north rim are the palm's own cloud sea, left unchanged.
- Hỏa Vân Động's red cliff meets Cao Lão Trang's grass in a straight line (a natural escarpment, the gate arch marks the crossing).

## Verification of the last two biomes (2026-11-21)
Node simulations (not weakened, run on the final tree): `tayduky-v2-map15` PASS (one global component reaches all 15 regions, Director never starts two adjacent signatures, at most 5 active); `tayduky-v2-clt-sim` and `tayduky-v2-lhd-sim` PASS for seeds 5, 7, 21, 31, 33, 101 (both signatures end to end, 10+ distinct minis each, no teleport / stuck tile, recovery to peace); `tayduky-v2-lat-sim`, `-tc2-sim`, `-hqs-sim`, `-bcl-sim`, `-btp-sim`, `-ntq-sim`, `-fire`, `-lion`, `-heaven-assets` PASS.
**`tayduky-v2-sim.mjs` (the long coverage run) is seed- and duration-sensitive and not green everywhere:** PASS at 1800 s for seeds 7, 31, 101 and at 3600 s for seed 21; FAIL at 1800 s for seeds 5 and 21 and at every 900 s window tried (7, 31, 101, 5). Every failure was traced: no adjacency violation, no stuck tile and no teleport remain; the failing condition is the Thiên Cung coverage clause (`havoc_heaven` and `eight_trigram_furnace` both reached with a recovery drop), because the 15-biome Director defers Thiên Cung more often and consumes the shared random sequence differently. At baseline (`87046f5`, same machine) seeds 5, 7, 21, 31 and 101 all passed at 1800 s, seeds 5 and 7 passed at 900 s (seeds 31 and 101 already failed at 900 s) and seed 21 passed at 3600 s; the 1800 s seeds 5 and 21 and the 900 s seeds 5 and 7 are therefore failures newly exposed by this work (a coverage-window effect), not behaviour regressions, and the test was left unchanged. One genuine latent bug the longer runs exposed was fixed (the roc's landing, see above). One further 3600 s run (seed 5) still reports two Bàn Tơ Động spider-sisters on tile (32, 65) for more than 1.5 s, far from both new biomes; it was not reproduced at 1800 s.
Pre-existing and unchanged: `tayduky-v2-heaven.mjs` ("signature not reached", same failure at baseline), `tayduky-v2-pilot.mjs` (legacy sandbox).
Browser: the review runs (`tayduky-v2-newbiome-shots.mjs`, `tayduky-v2-newbiome-stages.mjs`) ended with no JavaScript errors for stills, night views, and every signature stage of both biomes. Frame times (`tests/tayduky-v2-newbiome-perf.mjs`, headless software GL, 1920 x 1080, average ms per frame, no JS errors): Cao Lão Trang day wide (zoom 0.7) 58.7, night wide 66.8, during a signature 26.1; Liên Hoa Động day wide 49.4, night wide 63.4, during a signature 28.6; Thiên Cung reference 47.4. Both new biomes are in the same band as the heaviest existing view; a hardware GPU is far faster.

## Landmark repositioning and identity polish (2026-11-21)
- **Lòng Bàn Tay Phật Tổ:** the Buddha (still 2x, opaque; the translucency seam fix was removed) now sits on his lotus terrace at the east side of the cloud sea (anchor (85, 43), tiers around (86.5, 44.5)); the hand's wrist is lengthened (SDF cone to u = -17.5) so it reaches the old statue spot, joined to Liên Hoa Động's north-east ramp by a flat level-6 walkway. Cao Lão Trang is no longer covered. Cost: the statue stands over the fingertips and the south edge of Hoa Quả Sơn.
- **Đại Lôi Âm Tự:** the Linh Sơn gate sprite is 28 % smaller in both width and height (resampled to 0.72 before the 2x draw: 488 x 436 px -> 352 x 314 px); the court and the kneeling pilgrims behind it read at normal zoom.
- **Liên Hoa Động:** the cave door is redrawn as an ancient dressed-stone doorway set into the mountain: radial voussoir frame, three nested recessed arches with floor glow and violet crystal light, two layers of carved stone lotus petals growing out of the rock (gold veins west, silver east), gold and silver horn reliefs, runes, torch niches. No teeth, no mouth.
- **Bạch Cốt Lĩnh:** the skull-faced black cave (a clone of Hắc Phong Sơn's bear cave) is replaced by Huyệt Bạch Cốt (painted, `blair`): nested rib arches, a spine of vertebrae as the ridge, femur pillars, humerus braces, stacked skulls, a bone altar with ghost fire, dark hall with ghost light; effects: breathing ghost light, a spirit crossing the doorway, bone dust, mist, a crow.
- Screenshots: `screenshots/landmarks/`. Tests: map15, btp / lat / bcl / clt / lhd sims PASS; `tayduky-v2-sim` 1800 s seeds 7 and 101 PASS, seed 31 FAIL (Thiên Cung coverage window, as documented above).

## Hoa Quả Sơn — bridge and terrain correction (2026-11-21)

Isolated review branch `fix/hqs-bridge-terrain`, based on committed Claude checkpoint `5afbba3`. No BTP, shared renderer, Story Director, camera or other biome logic was changed.

- **Source-lake crossing retained and rebuilt:** it is the only summit route to the spring shrine, so it remains functional. The five-tile sheet of water/bridge was reshaped into a spring lake that funnels through a two-tile channel before widening into the five-tile Great Fall. The bridge now spans only `(74,4)–(75,4)`, runs on the strict isometric axis and lands on path tiles `(73,4)` and `(76,4)`, all at level 13.
- **Flank-fall crossing retained and moved:** it is required by the east Water-Curtain Cave entrance and the signature procession. The former deck at `(80,8)` directly under the falling water was removed; that tile is water and non-walkable again. The stream now fans out below the fall and is crossed at `(79,9)–(80,9)`, with level-3 path banks at `(78,9)` and `(81,9)`.
- Both crossings are generated as two-tile `hbridge` spans with the correct orientation. Water remains continuous above and below them; both cave posts remain in the HQS walk component. No new asset or PixelLab generation was used.

Deterministic coverage: `tests/tayduky-v2-hqs-terrain.mjs` checks deck materials, bank heights, preferred paths, `canStep`, water continuity, removal of the old waterfall-foot deck and both cave entrances. Map15, global sim 900 seed 7, HQS sim seeds 7/21/33 and the complete 15-frame Chrome signature pass. The 19-view HQS browser regression reports zero console errors. Before/after normal and wide screenshots are in `screenshots/hqs-bridge-fix/`.
