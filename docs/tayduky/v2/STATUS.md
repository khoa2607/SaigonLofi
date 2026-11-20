# Tây Du Ký v2 — status: the living isometric world (vertical slice)

Branch `feature/tayduky-redesign-v2`. Not merged to `main`. Last update: 2026-11-20.

Hoa Quả Sơn and Bàn Tơ Động are built to the vertical-slice standard in the real runtime. The other nine biomes are reserved,
clearly marked development placeholders. The work **stops here** until the owner approves the two biomes visually.

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
