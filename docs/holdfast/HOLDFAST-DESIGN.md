# HOLDFAST: Edge of Survival
### Lofi Worlds, World 2: Creative Direction & Design Document (v0.2)

> Status: **concept / design only.** Nothing here is implemented. Mockups 1–2 are ready for review. Mockups 3–7 are on hold until they are approved.
>
> The heart of Holdfast is not fighting. It's a small, believable community living peacefully while danger exists just beyond its walls. **Peace must be as engaging to watch as combat.**

| Mockup | File |
|---|---|
| 1. World Overview (Current era, day, annotated) | [`mockups/01-world-overview.png`](mockups/01-world-overview.png) |
| 2. Current era, default 1920×1080 frame at dusk | [`mockups/02-current-era-dusk.png`](mockups/02-current-era-dusk.png) |
| 3–7. Past, Future, Attack, UI, Gallery thumbnail | *after approval* |

The mockups are rendered by [`tools/mockgen.py`](tools/mockgen.py). It's a design tool, not game code. It draws the valley procedurally at true game resolution, so the overview and the 1080p frame come from **the same map, at the same scale**.

---

## Part 1: Locked foundation (approved in v0.1)

- **Title:** *Holdfast: Edge of Survival*.
- **One valley, three ages.** The same river bend, wall line, great tree, rock outcrop (main tower) and gate in Past, Current and Future.
- **Defensive geography.** The settlement sits inside a river meander. The river guards three sides, and a curved wall closes the **neck** of the bend. *(Correction to v0.1: the wall reads as a gentle **∩ arch**, not a smile. Its middle bulges toward the wilderness, where the gate sits, and its ends meet the river.)*
- **Threat senses.** Past = scent and territory, Current = sound, Future = sight and signal.
- **Pacing Director.** About 65% Peace, 15% Suspense, 7% Attack, 13% Recovery. At most one major attack per in-game day, and about one day in four with none.
- **No permanent victory or defeat.** No deaths on camera. Injuries are nonfatal and the community always recovers.
- **Recovery is content:** repair, treatment, salvage, the shared meal.
- **20–30 settlers** with roles, schedules and relationships.
- **Scavenger expeditions**, which sometimes end in a chase home.
- **Current (zombie) era is built first.**

---

## A. Map layout & scale

### A1. Grid and units

| Item | Value | Notes |
|---|---|---|
| Projection | 2:1 isometric | Tile = **16 × 8 art px**. Every architectural edge is at 2:1 (26.57°), vertical, or horizontal. |
| Map | **128 × 128 tiles** = 2048 × 1024 art px | Simulated core about 80 × 80 tiles. The outer ring is baked, decorative forest. |
| Height unit | 1 art px of z | Lifts a sprite 1 px up the screen. |
| Real-world feel | 1 tile ≈ 1.5 m | Chibi people are deliberately oversized, as in Saigon. |
| Default zoom | **2×** (1 art px = 2 CSS px) | 1920 × 1080 shows 960 × 540 art px. |

### A2. Zones (default 1080p frame, by screen area)

The layout follows [mockup 1](mockups/01-world-overview.png):

| Zone | Share | Contents |
|---|---|---|
| **Threat wilderness** (top) | ~38% | Old road to the gate, school-bus wreck, ruined gas station (W), collapsed house (E), forest thickening into fog, creek, wandering threats, deer and rabbits. Off-frame: old town ruins (where the horde gathers), farmstead, radio hill. |
| **Frontier** (upper middle) | ~14% | **Cleared ground** about 60 art px deep: stumps, rebar hedgehogs, wrecked cars pushed out as obstacles, burn marks. Then **the wall arch** with six towers and the gate. Then the **inner yard** with the gate plaza, alarm bell, staging crates and expedition pickup. |
| **Settlement** (lower) | ~48% | Main street from the gate to **the green and the great oak**, which hold the commons: fire pit, long tables, string lights. Homes ring the green. Church/bell (W), infirmary (by the gate, for a short carry), workshop (E, by the gate), town hall, RV and tents (newcomers), playground (centre, *away* from the wall). Fields fill the bottom of the bend, with a greenhouse, water tower, DIY wind turbine and the fishing dock at the very bottom. |
| **River and far bank** | frame edges | The river is the rear wall. On the far bank, deer drink and big wildlife passes by peacefully. |

**Wall geometry:** chord about 880 art px (about 70 tiles across the neck), apex at the gate. Wall line: `y = 212 + 55·((x−480)/440)²` in view px. Towers: main tower on the outcrop beside the gate, one opposite, two mid-wall, and two where the wall meets the river.

**The creek** enters from the forest, passes through a **culvert grate** under the wall, and crosses the settlement to the river. It gives the settlement fresh water and a second fishing spot, and it is the wall's one known weak point, which drives a rare incident (§J).

**Safe-space logic:** distance from the gate equals safety. Kids, elders, the playground and the commons sit deepest. Workshops and the infirmary sit near the gate because that's where the work is.

### A3. Entity scale (art px, W × H)

| Entity | Size | | Entity | Size |
|---|---|---|---|---|
| Adult settler | 7 × 12 | | Zombie (hunched) | 7 × 11 |
| Child | 7 × 9 | | Raptor-type | 14 × 10 |
| Dog | 7 × 6 | | Horned grazer | 28 × 18 |
| Deer | 9 × 8 | | Apex predator (rare) | 40 × 30 |
| Chicken / rabbit | 3 × 3 | | Long-neck herbivore (far bank) | 64 × 48 |
| House (2 storey) | 3.4 × 2.8 tiles, walls 16–17 + roof 8 | | Scout drone (hovers +10) | 7 × 5 |
| Workshop | 6 × 4 tiles, h 15 | | Robot quadruped | 14 × 10 |
| Church steeple | h 42 | | Spider unit | 18 × 10 |
| Watchtower | 1.7-tile platform at h 22–30, roof +13 | | Heavy walker (siege only) | 28 × 34 |
| **Wall panels** | **h 9–10** + wire | | Car / bus | 2.4 × 1.2 / 7 × 1.6 tiles |

**Wall height is a readability rule.** The camera sees the *inner* face of the wall. A wall taller than a person (12 px) would hide every threat at its foot. Keep panels at 9–10 px. Spikes and wire add silhouette without adding occlusion. Add **cutaway dither**: wall pixels within about 8 px of a threat become 50% checker-transparent.

### A4. Camera framing and screen adaptation

The default frame (mockup 2) shows the wilderness band, the whole wall, and the settlement down to the dock, with no camera movement needed.

**Auto-fit rule:** pick the largest zoom from {1, 1.25, 1.5, 2, 3} at which the **wall chord + 40 px** fits the viewport width and the **span from the bus wreck to the dock** (about 470 art px) fits its height. Pan and zoom remain available, and the choice is remembered per world.

| Screen | Zoom | Result |
|---|---|---|
| 1920 × 1080 | 2× | The reference frame. |
| 2560 × 1440 | 2× plus a wider look | Shows more forest and the far bank, or the viewer can choose 3× for detail. |
| 1366 × 768 / 1440 × 900 | 1.5× | Practically the same framing as the reference. |
| iPhone landscape (844 × 390) | 1× | Wall plus settlement. The fields are cropped, so start the pan 40 px up. |
| iPhone portrait (390 × 844) | 1.25× | **A vertical slice: forest → gate → oak → dock.** The story axis of the world is vertical, so portrait works unusually well. The camera drifts slowly toward the active event (gate during chases, wall during attacks) and comes back afterwards. |

**Mobile camera assist** (an opt-out option, *not* a control): during Suspense or an attack, the camera eases toward the event over 2 seconds, and it returns 10 seconds into Recovery.

---

## B. NPC behaviour and daily routines

### B1. The rule: purposeful, never random

Every NPC is always **going somewhere, for a reason, usually carrying something**. There is no random wandering. "Idle" means *resting at a rest spot*: a porch, a bench, under the oak, the dock, a tower rail.

Each NPC is a small **schedule-driven state machine**:

```
Schedule slot → Task (goto, work loop, carry, rest, social)
                ↑ interrupts: ALARM, MEAL BELL, RAIN, NIGHT, INJURY, EXPEDITION
```

- **Schedule:** a per-role timetable of hour blocks.
- **Tasks** are tiny scripts, for example `goto(field_3) → work(hoe, 40–90 s) → carry(basket → kitchen)`.
- **Interrupts** come from the Director or the environment. When one ends, the NPC returns to its schedule slot.
- **Social beats** are short two-person scripts, triggered when two NPCs with a relationship pass within 2 tiles and both are on low-priority tasks: wave, chat with speech-bubble icons, hand over an item, hug, or walk together.

### B2. Roster (28 settlers + dog + animals)

The roster is the same 28 people in every era: same names, roles and relationships, with era-appropriate clothes and tools (§I).

| Role | # | Role colour cue | Signature props |
|---|---|---|---|
| Farmer | 4 | straw hat / mustard | hoe, basket, watering can |
| Fisher | 2 | blue | rod, bucket, net |
| Cook | 2 | white apron | pot, ladle, tray |
| Builder | 2 | yellow vest | hammer, plank, panel |
| Guard (tower and gate) | 6 | olive | rifle or bow (Past: spear) |
| Medic + assistant | 2 | white with green cross | satchel |
| Scavenger | 3 | backpack, dark utility | crowbar, pack, map |
| Teacher | 1 | red cardigan | book, chalkboard |
| Children | 4 | bright mixed | ball, kite, toy |
| Elders | 2 | grey hair | cane, rocking chair, pipe |
| **Pet** | dog "Ổi" | — | follows kids, barks first at threats |
| Animals | 6 chickens, 1 goat | — | coop and pen |

**Relationships** (examples): Farmer Lan is married to builder Minh, and their kid Bi runs to Minh after every alarm. Elder Ba taught the scavenger lead. Two guards are rivals over who keeps the best tower. Relationships decide **who meets whom** in social beats and **who greets whom at the gate**.

### B3. Day schedule (in-game day ≈ 12 real minutes, 1 game hour ≈ 30 s)

| Time | Farmers | Fishers | Cooks | Builders | Guards | Medic | Scavengers | Kids | Elders |
|---|---|---|---|---|---|---|---|---|---|
| **Dawn 5–7** | wake, water beds | to dock, first cast | light fire, kettle | inspect wall | night→day shift handoff | rounds | prep at yard | asleep → breakfast | porch, tea |
| **Morning 7–12** | field rows, hoeing | fishing, net mending | prep lunch, carry water | repair queue | 4 towers + gate pair | infirmary | **expedition window** | lessons under the oak | teach and whittle |
| **Noon 12–14** | **all eat at the commons**, with tables full | | serve | | 2 towers stay manned, the rest rotate to eat | | | | |
| **Afternoon 14–18** | harvest and carry | fishing (the kids join) | wash and preserve | workshop builds | patrols on the walk | treat and restock | **return window** | play, chores, garden | nap, then the porch |
| **Dusk 18–20** | wash up at the creek | bring catch to the kitchen | supper, string lights on | tools away | **6 towers staffed**, lamps lit | | debrief at the fire | fireflies, catch-me | stories at the fire |
| **Night 20–5** | asleep (lit windows go off one by one) | 1 night-fisher, sometimes | banked fire | asleep | night shift: 2 snipers + 2 patrol + gate | on call | asleep | asleep | 1 elder can't sleep: porch, lantern |

**Seasons modify the table:** planting (spring), long evenings and swimming (summer), harvest festival (autumn), indoors and more firewood runs (winter).

### B4. Role behaviours in detail

- **Farmers** work in *row passes*: walk down a furrow, do a 2-frame action every 2 tiles, then turn at the end. Full baskets go to the kitchen, which visibly links field and kitchen. In rain they cover seedlings with tarps.
- **Fishers** cast with a 4-frame cast and a line arc, wait 20–60 s, then either a splash and catch (fish sprite, bucket) or nothing. Sometimes a kid sits beside one. The night-fisher has a lantern on the dock.
- **Cooks** have a station loop: chop, stir, carry tray. The **meal bell** at 12:00 and 18:30 is the most important routine in the game, because the whole town converges on the commons. It's peace's set-piece.
- **Builders** keep a *repair queue*, filled by attacks and weather. With nothing queued they do workshop builds, such as a new raised bed or a shed roof patch. They carry the material first and then work on site, so the viewer reads cause and effect.
- **Guards** hold *posts*. Tower guard idle cycle: scan left → scan right → lean → stretch, about every 6 s. Wall patrol walks the inner wall between towers. **Shift change** gets a handshake animation and the relieved guard walks home. The dog checks in with the gate guards.
- **Snipers** (the main and opposite towers) use a scope pose when the Director raises Suspense, and are otherwise relaxed.
- **Medics** do rounds at dawn. After attacks they **walk to the injured**, kneel and bandage (a 3-frame loop), then walk them to the infirmary. In peace they hang sheets, sort herbs and check on the elders.
- **Kids** play tag, kite, ball and hopscotch, *only* in the safe ring (the green, the playground, the dock with an adult). **Rule: kids never go within 6 tiles of the wall.** If a ball rolls toward the wall, an adult fetches it (§J). On ALARM they run to the church, the shelter in every era, with a teacher.
- **Elders** move slowly between the porch, the commons and the garden. They're the "anchor" sprites: whenever you look at the commons, an elder is probably there.
- **Dog:** follows kids. At dusk it visits the gate. It **barks before Suspense is announced** (an early cue for attentive viewers). On ALARM it goes under a porch.
- **Wildlife** is outside the wall only, except birds. Deer graze at the forest edge and bolt when a threat comes within 8 tiles, which is a free tension cue. Crows gather on wrecks. Fish jump in the river. Fireflies come out at summer dusk. Past and Future equivalents are in §I.

### B5. Movement

- Walking speed 0.9 tiles/s, run 2.2, zombie 0.45–0.6, raptor 2.6 (but it gives up), robot quad 1.4.
- NPCs **slow down and turn** before arriving (one ease-out step), never sliding into position.
- Two NPCs on a collision course: the lower-priority one sidesteps half a tile and waits for one frame. Kids yield to nobody, and adults step aside for them. It's a small touch that reads as human.

---

## C. Scavenger expedition simulation

### C1. Sequence

| # | Phase | Duration (real) | What you see |
|---|---|---|---|
| 1 | **Preparation** | 30–60 s | Three scavengers converge on the yard. One checks a map board, the others load packs. The pickup stays (Current era). The lead hugs a relative. |
| 2 | **Gate opens** | 4 s | The gate guard waves to the tower, the tower guard scans and gives a thumbs-up, and the gate slides open (6-frame roll). |
| 3 | **Departure** | 10–20 s | Single file up the old road. The gate closes behind them, and a gate guard watches for a while. |
| 4 | **Exploration** | 60–180 s | Walk to the POI by road, then along a forest trail. They pause at junctions ("look" pose), and crouch-walk past a known threat 6–10 tiles away. |
| 5 | **Discovery** | 20–40 s | At the POI: search loops (open trunk, rummage, crowbar door). The result shows as an icon bubble: 🥫 canned food, ⚙ parts, 💊 medicine, 🌱 seeds, 📻 radio, or rarely 🐾 a stray animal they bring home. |
| 6a | **Return (80%)** | 60–120 s | Same route, slower, packs visibly bulging. |
| 6b | **Chase (20%)** | 30–50 s | An incident (C3) alerts threats, and they run home. Tower snipers cover them and the gate opens at the last moment. |
| 7 | **Gate closes** | 4 s | With a slam. A guard leans on it and exhales (a 2-frame puff). |
| 8 | **Recovery** | 60–120 s | They unload at the kitchen, workshop or infirmary according to the loot. Family greets them. In the evening they tell the story at the fire, and the Chronicle records it. |

**Frequency:** 1–2 expeditions per in-game day, departing in the morning window. No expedition leaves on attack days until Recovery has finished. Fog days have no expeditions, a quiet bit of world logic.

### C2. Simple AI

- **Routes are authored splines** (mockup 1, dashed lines): gate → waypoint chain → POI → back. Expeditions never do free pathfinding outside the wall. A route has 6–10 waypoints, with jitter of ±0.5 tile per member so the file doesn't look like a train.
- **Formation:** a leader on the spline, followers trailing at 1.2 tiles with a slight sway.
- **Detection is a cone check, not tactics.** Every threat has a `sense` value per era:
  - Current: noise events have a radius (gunshot 30 tiles, glass 12, footstep 2). Any zombie in the radius goes to *Investigate* and walks to the noise point.
  - Past: scent drifts downwind. A carry-meat flag raises the scent radius.
  - Future: a visible **scan cone**. A party member inside it for 1.5 s raises *Alert*.
- **States:** `Idle/Wander → Investigate (?) → Pursue (!) → Lost → Wander`. Pursuers have speed < party run speed, and pursuit times out after 25 s without sight. **A chase always ends safely**, while still feeling close.
- **Chase tuning:** the Director spawns pursuers behind the party at a distance that guarantees arrival with a **2–4 s margin**. That margin is the "last-second gate" moment.

### C3. Incidents and variations (weighted pick, about one per trip)

| Incident | Effect |
|---|---|
| Nothing happens | The most common outcome. A calm trip is fine. |
| Find a stray dog/goat/horse | It follows them home, and the settlement gains a temporary pet. |
| Mis-step: car alarm or glass (Current), snapped branch near a nest (Past), stepping into a scan cone (Future) | Starts a chase. |
| A member twists an ankle | The others carry them back slowly, and the medic meets them at the gate. |
| A threat blocks the road | The party detours via a forest trail, which is an authored alternate route. |
| Weather turns (rain) | They shelter at the POI for 30 s, then continue. |
| Find a survivor (rare, once a week) | The survivor comes home and **joins the roster**, replacing a "moved away" settler so the count holds at 28. It's the only roster change, a long-term story beat. |
| Radio contact | A 📻 bubble, and that night the town listens around the radio. Flavour only. |

### C4. Gate behaviour (one shared state machine)

```
CLOSED ──request(open)──► CHECK ──clear──► OPENING (6 fr) ──► OPEN ──► CLOSING (6 fr) ──► CLOSED
                            │ threat within 10 tiles of gate
                            └──► HOLD (guards ready, snipers fire)  ─ clear ─► OPENING
```

- **Open requests** come from a departing party, a returning party within 8 tiles, or a cleanup crew in Recovery.
- **During a chase**, CHECK ignores threats that are *behind* the party by more than 6 tiles. Guards step outside to cover.
- The gate closes automatically 3 s after the last member is inside.

---

## D. Defense and combat animation

### D1. Principles

1. **Readable at 2×:** one clear action per actor, with a strong anticipation frame.
2. **Restrained:** no blood, no dismemberment. Defeats become dust, retreat or wreckage.
3. **Short:** the attack phase lasts 60–90 s, with a cap of 40 threats on screen.
4. **Telegraphed:** Suspense *always* comes first, through the dog bark, deer bolting, the tower guard leaning, and the music.

### D2. Defender actions

| Actor | Animation | Frames |
|---|---|---|
| Tower sniper | aim (rifle up, 0.6 s hold) → **muzzle flash** (1 frame, 3×3 px emissive) → recoil → chamber | 2 aim + 1 fire + 3 recover |
| Projectile | Current: a 2-frame tracer line, faint. Past: a visible arrow arc (8–12 frames). Future: a cyan pulse bolt (6 frames). | — |
| Miss | A dust puff (3 frames) at the target's feet. About 25% of shots miss, which keeps it tense and believable. | 3 |
| Gate defenders | brace stance, push with a pole or spear through the gate gap, step back | 3 + 2 |
| Wall patrol | runs to the threatened panel and braces it with their back | 4 run + 2 brace |
| Builder in combat | hammers a temporary brace behind a damaged panel | 3-frame loop |
| Medic | kneels by an injured defender and helps them up | 3 + 4 |
| Bell ringer | bell swing with a "DONG" ring ripple (1 px ring expanding outward) | 4 |

**Injuries:** a hit defender kneels (2 frames) with a small ✚ above them, and a medic comes. There is no death state.

### D3. Threat behaviour by era (the differences matter)

| | Zombies (Current) | Dinosaurs (Past) | Robots (Future) |
|---|---|---|---|
| Approach | A shambling 4-frame walk with uneven timing (hold frame 2 for an extra tick). They come in **loose clumps that thicken**. | Predators *stalk* in low-crouch frames, pause and sniff (a nostril-puff particle), then sprint. | **Rigid, synchronized gaits.** The scan cone sweeps before they move. Formation: drone → quads → heavy. |
| At the wall | Press against the wall (lean frames), slap (2 frames), pile up. A panel shakes 1 px. | Test the wall, claw the palisade, flinch at **fire and noise**, circle round. | Cut or ram: a spark shower at the contact point, and the heavy walker telegraphs with a red glow for 1 s. |
| Hit reaction | A 1-frame stagger and a white flash. | Flinch and roar (open-mouth frame). | Sparks and a 1-frame flicker of lights. |
| **Defeat** | Falls forward (4 frames) → lies still → **after 20–40 s turns into a dust silhouette and fades**. A cleanup crew covers the remains with a tarp and carts them to the burn pit in Recovery. | **Retreats wounded.** It limps away (a slower walk with head low) and leaves the map. Dinosaurs are never killed on screen. | Collapses: legs fold, one spark, a lingering smoke wisp. **The wreck stays** until salvage. |
| Remains | Dust stains in the cleared ground fade over about 2 game days. | Claw marks on posts, broken spears, scattered thatch. | Husks that the salvage crew cuts up and carts to the workshop. Later the parts show up as plating on a turret. |

### D4. Wall damage and repair

- **Panel states:** `intact → dented (sprite swap, a lean of 1 px) → breached (gap, panel on the ground)`. A breach is only allowed during a siege-tier attack, and at most 2 per attack.
- **A breach is a mini-event:** two gate defenders hold the gap. Threats in the gap make a slow, readable fight. It's always held.
- **Repair sequence (Recovery):** a builder carries a new panel (era material) → holds it up → hammers (3-frame loop, small "tok" sparks) → steps back and nods. A broken tower takes a multi-hour job with scaffold sprites.
- **Recovery checklist** (the Director won't advance to Peace until it's done): repairs, injured treated, remains cleared or salvaged, a meal at the commons.

---

## E. Sprite art and animation specifications

### E1. Resolution and projection rules

- **Art resolution:** world art at 1 art px. Default display 2×, integer or 1.25/1.5 nearest-neighbour scaling only.
- **Strict 2:1 rules:**
  - Ground edges are lines of 2 px across per 1 px down. There are no 30° "true iso" lines.
  - Verticals are perfectly vertical. Building heights snap to whole art px.
  - Box models are drawn the way `bake()` draws them in Saigon: top / left (×0.86) / right (×0.68) shading, with a cocoa-brown ink outline `#3B2A24`.
  - Light comes from the **upper left**. Shadows fall **right-down**, as a 28% multiply onto the ground layer only.
- **Outline:** 1 px ink on all world sprites. Inside the settlement the outline is slightly warmer, and outside the wall the ink stays neutral.

### E2. Proportions (chibi, shared with Saigon)

- **Adult 12 px tall: head 5 px, body 4, legs 3. Head = 40%.** Eyes are 1 px dots. There's no mouth except for expression frames.
- Child 9 px (same head size, shorter body), elder 12 px with a cane column.
- Role is told by **colour block and prop silhouette**, never by facial detail. At 2× a shirt colour plus a hat or tool is all you get.
- Threats keep human-adjacent scale where they're humanoid (zombies), and **exceed human scale only when the era demands it** (dinosaurs, heavy robots). Big creatures always have a **dark readable silhouette with 1–2 light accents**: eye glint, scan light, horn tip.

### E3. Directions

- People and small threats: **2 drawn facings (SE, NE), mirrored for SW and NW**. That gives the four iso diagonals for half the art.
- Large dinosaurs and robots: 2 drawn facings, mirrored. They move mostly along the vertical story axis, so this is enough.
- Static props: one view, which works because the camera is fixed.

### E4. Animation frame counts

| Action | Frames | fps | Notes |
|---|---|---|---|
| Idle (breathe/blink) | 2 | 2 | blink every 3–5 s |
| Walk | 4 | 8 | 1 px head bob |
| Run | 6 | 12 | lean forward 1 px |
| Work loops (hoe, hammer, stir, cast) | 3–4 | 6 | key pose held 2× |
| Sit / eat | 2 | 3 | |
| Kid play (jump, tag) | 4 | 10 | |
| Zombie shamble | 4 | 5 | irregular hold |
| Raptor run / stalk | 6 / 4 | 12 / 6 | |
| Big dinosaur walk | 6 | 6 | 1 px ground-shake on frame 3 |
| Robot quad / spider gait | 4 | 10 | perfectly even timing |
| Drone hover | 2 | 6 | plus a 1 px bob on a sine |
| Gate roll | 6 | 8 | |
| Defeat (fall / collapse) | 4 | 8 | |

### E5. Buildings and environment

- Buildings are **box models** as in Saigon (`bake()`): walls, gable or flat roofs, windows and doors as face inserts, era palettes. Footprints snap to half-tiles.
- **Wear layers** are overlays: rust streaks, boarded windows, moss, scorch, so one model serves several states.
- Trees use blob canopies (3–4 lobes) with 3 tones plus highlight pixels, and **one species set per era** (Past: tree-ferns and cycads, Current: oak, birch and pine, Future: sparse, scorched, plus hydro-garden plants inside).
- Ground is painted per pixel with a **4×4 Bayer dither** between 3 tones per material, as in the mockups.

### E6. Lighting

- **Time-of-day grade:** a multiply LUT per time slot. Dusk uses **two grades**: warm `(1.0, 0.80, 0.64)` inside the wall and cool `(0.62, 0.64, 0.86)` outside, blended across the wall with about a 10 px soft edge. **The light line is the "edge" in "Edge of Survival".**
- **Emissives** are drawn *after* the grade: windows, fires, string lights, muzzle flashes, robot eyes.
- **Light pool** is an additive pass of elliptical (2:1) gaussians: fire r 46, drum fire 22, window 9, tower lamp 16. Searchlight cones are soft polygons, 40–80 alpha.
- **Height fog** toward the top edge of the map hides the map edge and pushes the wilderness back.

### E7. Consistency across the three eras

- **One shared skeleton per creature class.** All humans share the same 12-px template and pose frames, and eras swap only clothes and prop layers. Robots are drawn on dinosaur-sized bases (quad ≈ raptor, heavy ≈ apex) so threat scale lines up across eras.
- **One shared house size scale.** A Past longhouse, a Current two-storey house and a Future habitat module all fit a footprint of 3–4 × 3 tiles and 16–20 px walls.
- **Fixed geography anchors:** river, outcrop, oak position, gate position, creek and dock never move.
- **Palette discipline:** each era has a 32-colour world palette plus a shared 8-colour UI/ink set.

---

## F. Interface and controls

**Functional reference: SaigonLofi.** The controls and the "…" menu structure are the same, so users already know them. **Visual identity: "field notebook and stencil."** In place of Saigon's wooden sign and cream paper: canvas-tape labels, stencilled type and hand-stitched edges. Palette: charcoal canvas `#2B2A28`, paper `#EDE4CF`, signal amber `#E8A33C`, olive `#6F7A4F`.

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ▐HOLDFAST▌  [ PAST | ■CURRENT■ | FUTURE ]                       ⛶  ⌂ Worlds │
│                                                                           │
│                              ( the world )                                │
│                                                                           │
│ ▶ ❚❚  ◀◀ ▶▶  "Rainy Porch Tapes" — lofi radio                  📓  ···     │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Top left:** a stencilled **HOLDFAST** plate, then the **Timeline** switch (the one new control). Three tape tabs with tiny era glyphs (fern / chain-link / circuit). Keys `[` `]` as in Saigon.
- **Top right:** fullscreen and **⌂ Lofi Worlds** (Esc).
- **Bottom left:** music bar with play/pause, prev/next and track name.
- **Bottom right:** 📓 **Day Chronicle** and **···**.
- **"···" menu** (same as Saigon): YouTube playlist URL · Time (Morning / Noon / Dusk / Night / Auto) · Weather (Auto / Clear / Rain / Wind) · Season (Spring / Summer / Autumn / Winter / Auto) · Music volume · Ambient volume + mute · Zoom · Camera assist (mobile) · VI / EN · Hide panel (H).
- **Day Chronicle:** a collapsed notebook icon. Opening it shows **one torn page** with today's 3–6 entries (*"Day 214 · 09:40, Lan's team left for the gas station. 11:15, back with seeds and a dog."*). It never shows numbers, meters or tasks. A tiny dot on the icon means "new entry". It auto-hides after 10 s.
- **Not allowed:** health bars, resource counters, alerts, minimaps, inventories or build menus. Threat state is communicated **only diegetically** (bell, dog, music, lights).
- **Mobile:** the plate shrinks to an "H" badge, the timeline becomes a 3-dot segmented control, and the music bar collapses to ▶ plus the track name. Everything else lives in "···".

Mockup 6 will show this.

---

## G. Audio and music direction

### G1. Layering (per era, 4 stems + one-shots)

| Layer | Past | Current | Future |
|---|---|---|---|
| **Bed** (always) | warm wind, cicadas, distant waterfall | breeze in leaves, birds (day) / crickets (night) | low wind through metal, faint power hum |
| **Settlement** (near the camera centre) | crackling fire, wooden knocks, stone grinding, bone flute | hammering, chickens, kids, guitar at dusk, screen door | generator thrum, hydro pumps, soft UI chirps, holo-synth at dusk |
| **Water** (positional) | river, creek | river, creek, dock creaks | river, filtered pump outflow |
| **Wilderness** (distant) | herbivore calls, pterosaur cries, far roar *(rare)* | crows, a far moan *(rare)*, car alarm *(very rare)* | drone whine passes, servo clicks, scanning sweep tone |
| **Event one-shots** | horn of alarm, drums, torch whoosh, spear thud | church bell, gate roll, suppressed shots, a few rifle cracks | siren pulse, gate servo, pulse bolts, EMP thump |

### G2. Rules

- **Distance attenuation:** sources are positioned in world px, with gain `1 / (1 + d/180)` from the camera centre and a gentle stereo pan by screen x. Zooming in raises the settlement layer, which makes zoom-in feel like leaning closer.
- **Day/night:** each stem crossfades its day and night variant over 20 game minutes around dawn and dusk.
- **Music continuity:** **the music never pauses or ducks below −3 dB.** During Attack the music bus gets a low-pass sweep (18 kHz → 6 kHz over 4 s) and a slight extra saturation. Recovery opens it back up over 8 s, the most satisfying moment. With YouTube, which can't be filtered, the ambience simply dips the event layer.
- **Attack intensity caps:** at most 4 simultaneous combat voices. The combat bus is limited to −14 LUFS-short below the music. Gunshots use soft, low-passed recordings ("through a window"), at most 6 per 10 s, with no stacking within 120 ms. Screams and roars only play beyond 20 tiles and quietly.
- **Long-session fatigue:** each one-shot has a cooldown and 4–6 variants played without repeating. A random "silence gap" of 20–40 s on the wilderness layer every few minutes keeps the soundscape breathing.
- **Volume and mute:** separate *Music* and *Ambient* sliders, as in Saigon's "Âm phố". Ambient mute leaves the visual alarm cues intact. A tab hidden for more than 30 s fades ambience out, and music follows the user's play state.
- **Era switch:** a 2.5 s equal-power crossfade of all ambient stems, synced to the visual crossfade. The music track keeps playing.

---

## H. Performance and technical feasibility (browser JS, Canvas 2D)

| Budget | Desktop | Mobile |
|---|---|---|
| Map | 128 × 128 tiles, active simulation inside about 80 × 80 | same, with the outer ring baked at 1× |
| Settlers | 28 (+ up to 2 guests) | 28 |
| Threats active / on screen | 60 / **40** | 30 / 20 |
| Wildlife | 16 agents + bird/fish/firefly particles (≤ 200) | 8 + ≤ 80 particles |
| Animated sprites drawn per frame | ≤ 250 | ≤ 140 |
| Light sources | ≤ 64 (pre-blurred sprite stamps) | ≤ 24 |
| Frame rate | 60 fps, sim at 10 Hz with interpolation | 30 fps |

**Architecture:**
- **Static world baking:** ground, buildings and static trees are rendered once per *era × season* into **chunk canvases** (512 × 256 art px). Day, dusk and night grades are applied in a final pass via `globalCompositeOperation` multiply (or 3 pre-graded chunk sets on low-end devices). This mirrors Saigon's `bake()` cache.
- **Dynamic layer:** only moving sprites are re-sorted each frame. They use **bucket sort by iso depth row**, which is O(n), and are drawn between the static occluders that share their row. Tall static objects (towers, trees, houses) are kept as separate "occluder sprites", so depth works without re-drawing the ground.
- **Sprite cache:** each pose × frame × palette is built once at load into an `OffscreenCanvas` atlas. Era change rebuilds only the era palette set (≈ 200 ms behind the crossfade).
- **Navigation:**
  - **Inside the wall:** a navmesh-free **tile grid with precomputed flow fields** to about 20 destinations (each home, work site, the commons, the gate, the shelter). Each field is 128 × 128 bytes. NPCs just read the next step.
  - **Outside the wall:** authored splines for expeditions. Threats either wander or follow a flow field toward the gate or a noise point.
  - **Collision:** soft separation only, with a sidestep rule. There's no physics.
- **State machines:** each NPC is `{role, scheduleSlot, task, taskStep, target, timer, carry, mood}`, about 100 bytes. Updated at 10 Hz, and at 2 Hz when offscreen. There's no per-frame pathfinding.
- **Wave scheduling (Director):** a single object with `phase`, `tension (0–1)`, `cooldown` and `dayPlan`. At dawn it plans the day: whether there's an attack, its tier, an approximate time, and expedition slots. Small random offsets keep it from feeling scheduled.
- **Culling:** offscreen dynamic sprites skip drawing, and their animation advances only by clock. Off-screen particles aren't simulated.
- **Background and idle:** a hidden tab runs the simulation at 1 Hz with no rendering. On return it fast-forwards at most 60 game seconds, then resumes. The "Hide panel" mode and long idle drop to 30 fps after 2 min without input.
- **Memory target:** ≤ 150 MB desktop and ≤ 90 MB mobile. The baked chunks for one era and season at 1× are about 8 MB, and three grades add about 24 MB.
- **Mobile:** DPR capped at 2, chunks baked at 1×, scaled by CSS. 30 fps. Half the lights. Rain uses a screen-space overlay rather than particles.

**Tests** (same style as Saigon's URL parameters): `?world=holdfast&era=1&time=dusk&phase=attack&seed=42&warp=60`.

---

## I. Timeline switching

### I1. What changes and what stays

| Stays (anchors) | Changes |
|---|---|
| River bend and creek, rock outcrop, oak position, gate position, wall line, dock, field area, roster identities | Architecture, wall material, towers, trees and plants, wildlife, threats, clothing and props, light colour, ambient audio |

The **oak through time:** a sapling ringed by stones (Past), a great oak (Current), the preserved trunk under a glass canopy with planters (Future).

The **people through time:** "Ba" is the elder in every era, in hide wrap, then knitted cardigan, then a soft thermal coat. Persistent identities make era switching feel like a time-lapse of *one* community.

### I2. How a switch works (no glitches)

1. **Freeze** the simulation (0 ms).
2. **Snapshot** the new era world at the **same clock time, season, weather and camera**.
3. **Resolve the agent state:**
   - **Settlers:** each keeps its position and task if the equivalent target exists in the new era (every work site has an equivalent). Otherwise it snaps to the nearest equivalent.
   - **Active attack:** it is *not carried over*. The new era begins at **Recovery** if the previous era was in Attack or Recovery, so the viewer sees a plausible aftermath. Otherwise it begins at the same Director phase minus Attack.
   - **Expedition outside:** the party is kept outside on the new era's version of the same route, in the "return" state. Pursuers are dropped.
   - **Threats:** all despawn under the crossfade. The new era spawns its wanderers at their usual wilderness distances.
   - **Wreckage and corpses** are era-specific and are removed. Wall damage carries over *as* damage in the new material, so builders keep their jobs.
4. **Crossfade** for 1.2 s: dissolve from old frame to new, as in Saigon's era crossfade, with the 2.5 s audio crossfade.
5. **Unfreeze.**

Rapid switching (more than 3 in 10 s) is debounced. The last pick wins and only one crossfade plays.

---

## J. Special ambient moments

These are discoverable and rare, and the Chronicle records most of them. Rarities assume about an hour of viewing.

| Era | Moment | Frequency |
|---|---|---|
| Past | **Herbivore migration** along the far bank. Long-necks and horned grazers cross the ford at dusk, and settlers line the bank to watch. | 1 per hour |
| Past | **Night fire dance** after a predator is driven off. Drums, silhouettes around the bonfire. | after major defenses |
| Past | A baby grazer wanders up to the palisade, and kids peek through the gaps until its mother calls. | rare |
| Current | **The last-second gate**: scavengers sprint home, snipers cover, the gate slams. | ~1 per hour |
| Current | **Movie night**: a bedsheet screen on the town hall wall, a generator, everyone on blankets. | 1 per in-game week |
| Current | **The ball:** a kid's ball rolls toward the wall, an adult jogs to fetch it, and a single zombie hand appears through a gap. A guard taps it away, everyone laughs, and the ball goes back. | rare |
| Current | **Floaters:** a zombie drifts down the river and a fisher pushes it off with a pole. This is the only threat from the river side, and it's harmless. | rare |
| Current | **Fireflies over the fields** on summer dusks, with a kid chasing them and a jar glowing. | summer |
| Future | **Night drone patrol**: a line of drones sweeps scan cones over the forest. The settlement does a **blackout drill**: windows go dark one by one and the camo nets go over the solar field. | 1–2 per night |
| Future | **Salvage day**: a crew takes apart a downed heavy walker, and its arm becomes a new crane. | after sieges |
| Future | **First bird**: a single songbird returns and lands on the dead oak. Everyone stops. | 1 per in-game month |
| Any | **The fire after the fight**: the whole community at the commons, a quiet song, the guard who held the gate gets a cup first. | after every major attack |
| Any | **New survivor** arrives with the scavengers and is welcomed at the gate. | rare |
| Any | **Lantern evening / harvest festival**: lanterns floated on the river from the dock. | autumn |
| Any | **First snow**: kids make a snow figure, and guards get scarves. | winter |
| Any | **Thunderstorm**: lightning briefly reveals the whole wilderness, threats included, for one frame. | storms |

---

## K. Mockup notes

**1. World Overview** ([png](mockups/01-world-overview.png)) shows the full 128 × 128 map at native 1× in daylight. It labels the zones, POIs and **scavenger routes** (dashed), and draws the camera frames for 1080p, laptop and iPhone portrait. Note how much of the map's lower diamond is decorative far bank: the playable story sits in the upper-middle.

**2. Current era, dusk** ([png](mockups/02-current-era-dusk.png)) is exactly the default 1920 × 1080 frame: 960 × 540 art px at 2×, cropped from the same map. Visible stories: a scavenger trio coming home down the old road; a zombie in the cleared ground with a **"?"** (it heard something); towers lit with searchlights sweeping; builders at a repaired panel; the meal around the fire under the oak; kids and the dog at the swings; farmers finishing in the fields; a fisher and a child on the dock; newcomers' tents and RV; the warm-inside / cool-outside light line.

**Known mockup limits:** sprites are front-facing only and static, the art is procedurally generated rather than hand-polished, and labels and props are placeholders. Final art should hand-tune the templates in the same proportions.

---

## L. Design critique: remaining weaknesses and fixes

1. **Wall occlusion.** The camera sees the inner side of the wall, so any wall taller than a person hides the fight. **Fix:** 9–10 px panels, cutaway dither, and most combat staged in the cleared ground and at the gate. *Must be prototyped first.*
2. **People read as dots at 2×.** In mockup 2 the settlers are legible but small. **Fix:** a stronger colour-block per role, 1 px bigger heads for adults (13 px total) if tests show it's needed, and *motion* (work loops) doing most of the readability work. Consider a default of 2.25× on 1080p if the wall still fits.
3. **The middle of the settlement can look empty.** Mockup 2 has big plain lawns at the sides. **Fix:** more mid-scale clutter (sheds, washing, carts, compost, beehives, a goat pen), paths worn into grass by real NPC traffic (a heat-map texture that grows over days), and seasonal ground (flowers, leaves, snow).
4. **Threats only come from the top.** That's readable but could get monotonous over an hour. **Fix:** keep the main vector, and add rare *harmless* side events (river floaters, a drone over the river, a dinosaur on the far bank) that don't break the safe-rear logic.
5. **Peace has to carry 65% of the time.** **Fix:** the meal bell, social beats, the Chronicle, weather routines and the moments in §J. Also playtest *with combat disabled*. If that build isn't pleasant to leave open, combat won't save it.
6. **One geography for three eras risks sameness.** **Fix:** vegetation, palette and **night-light character** must differ strongly. Fire (Past), sodium and string lights (Current), and cold floods with blackout drills (Future) make three different night silhouettes.
7. **Tone and violence.** Even stylised, zombies and kids together are delicate. **Fix:** kids are never within 6 tiles of the wall, alarms send them to the shelter first, defeats turn to dust, and no gore sprites exist at all. Consider a *Gentle mode* option that makes zombies turn and wander off instead of falling.
8. **Night readability.** Dark wilderness can swallow threats. **Fix:** each threat gets one rim-light or emissive pixel (a dim eye glint for zombies, an eye shine for dinosaurs, built-in lights on robots), and towers keep a sweeping searchlight.
9. **The map is larger than it needs to be.** The lower third is decorative. **Fix (open question):** either shrink to 112 × 112 and shift the valley up, or use the far bank for the Past-era migration and Future-era drone lines so the space earns its keep.
10. **Name.** "Holdfast" is a common word and the name of other products. Do a quick trademark search before it goes on the gallery card.
11. **Scope.** Three eras times full content is large. **Fix:** Current era **without combat** → add expeditions → add attacks → Recovery polish. Then Past and Future reuse all the systems, so only content changes.

---

## M. Next steps (on approval)

1. Feedback on mockups 1–2: layout, scale, mood.
2. Mockups 3–7: Past, Future, Attack scene, UI, gallery thumbnail.
3. Only after that, an implementation plan for the Current-era pilot.
