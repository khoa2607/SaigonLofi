# HOLDFAST: Edge of Survival
### Lofi Worlds, World 2: Creative Direction & Design Document (v0.3)

> Status: **concept / design only.** Nothing here is implemented. Revised mockups 1–2 are ready for review. Mockups 3–7 (Past, Future, Attack, UI, gallery) are on hold until the new camera, density and threat visibility are approved.
>
> **v0.3 direction:** Holdfast is a **busy, living survival world, not a quiet village.** Something meaningful is always moving, there's frequent small-scale danger, and big battles are occasional. Individual encounters can go badly, people can die, and the settlement always endures.

> **Implementation:** the Current-era MVP is built in `holdfast/` (see [STATUS.md](STATUS.md)). The art pilot below was approved and its rules are in use.
>
> **Art pilot:** [`art-pilot/`](art-pilot/README.md) re-renders Holdfast with SaigonLofi's own art system at Saigon's pixel density. If approved, its art rules **supersede §A and §H's "13-px people at 3×"**: Holdfast uses `K = 2` and 1 art px = 1 device px at 1080p, with people about 40 art px tall. The v0.3 mockups below are layout and density diagrams, not final art.

| Mockup | File |
|---|---|
| 1. World Overview: planning diagram, whole 144 × 144 map, day | [`mockups/01-world-overview.png`](mockups/01-world-overview.png) |
| 2. Current era: **the actual default 1920 × 1080 view** at dusk (3×) | [`mockups/02-current-era-dusk.png`](mockups/02-current-era-dusk.png) |

Both images are cropped from **one** procedurally rendered map at true game resolution by [`tools/mockgen.py`](tools/mockgen.py). That script is a design tool, not game code.

### What changed from v0.2

| v0.2 rule | v0.3 rule | Why |
|---|---|---|
| Default zoom 2×, whole valley visible | **3× default**: frontier + nearby wilderness + part of the town | Matches SaigonLofi's on-screen character size (about 40 px). Users zoom out for the overview. |
| Non-integer zooms (1.25×, 1.5×) | **Integer device-pixel scaling only** | Pixel Art Studio's #1 rule, and what Saigon's `resize()` already does. |
| 28 settlers | **About 120 residents on desktop** (70 on mobile) in 3 simulation tiers | Continuous visible activity. |
| No human deaths, guaranteed safe chases | **Humans can die.** Expeditions have real outcomes, and the population replenishes. | Real stakes. The settlement endures, but encounters are not scripted wins. |
| Dinosaurs never killed | Killed, injured or driven off | Per brief. Still no gore. |
| 65/15/7/13 four-phase director | **Two directors:** a continuous *Activity Director* (traffic-style quotas) plus an *Encounter Director* (frequent small, rare large) | No dead periods. |
| Solid forest | **Groves, meadows, trails, rocky ground, ruins** | Threats must be readable. |
| Threats from the top only | **Six approach routes** (R1–R6) | Variety that stays geographically believable. |
| 128 × 128 map | **144 × 144**, valley 1.44× larger | Room for a town of about 60 homes and a real wilderness. |

---

## Part 1: Locked foundation (still true)

- **One valley, three ages.** The same river bend, curved wall, great oak, rock-outcrop main tower, gate and creek in Past, Current and Future.
- **Defensive geography.** The town sits inside a river meander. The river guards three sides, and a ∩-arched wall closes the neck.
- **Threat senses.** Past = scent and territory, Current = sound, Future = sight and signal.
- **Everyday routines, recovery and rebuilding, scavenger expeditions,** and distinct era architecture and lighting.
- **Shared Lofi Worlds controls** plus a single world control: `PAST | CURRENT | FUTURE`.
- **The settlement never falls.** No game over, no victory screen, and it runs indefinitely.

---

## A. Camera and scale (SaigonLofi as the reference)

**What Saigon does today** (from `js/main.js` `resize()` and `js/core.js`): art is drawn at `K = 2` art px per world unit, and the screen scale is a **whole number of device pixels per art pixel**, picked from the viewport size. At 1920 × 1080, Saigon draws its walkers at about 40 screen px tall.

**Holdfast uses the same philosophy:**

| Item | Value |
|---|---|
| Tile | 16 × 8 art px, strict 2:1 |
| Adult sprite | 8 × 13 art px (head 6 rows = 46%, chibi) |
| **Default scale** | **3 device px per art px at 1080p** → people about 39 px tall, like Saigon's walkers |
| Default view at 1080p | 640 × 360 art px: about **half the wall**, the gate in the upper middle, about 100 px of wilderness above, and the market, barracks, infirmary, workshop and the oak below |
| Zoom | Wheel / pinch / buttons step through **integer scales**: 1 → 2 → 3 → 4 → 6 (desktop). Drag to pan. Remembered per world. |

**Auto-pick rule** (same spirit as Saigon's `base`): choose the largest integer **N** (device px per art px) such that the view is at least **560 × 300 art px** on desktop, or at least **230 art px on the short side** on phones.

| Screen (device px) | N | Art px visible |
|---|---|---|
| 1920 × 1080 | 3 | 640 × 360 (**reference**) |
| 2560 × 1440 | 4 | 640 × 360 (identical framing) |
| 3840 × 2160 | 6 | 640 × 360 |
| 1366 × 768 | 2 | 683 × 384 |
| MacBook 2880 × 1800 | 5 | 576 × 360 |
| iPhone portrait 1170 × 2532 | 5 | 234 × 506: a vertical slice (forest → gate → market → oak) |
| iPhone landscape | 5 | 506 × 234 |

**Off-screen awareness without UI:** events outside the frame announce themselves *diegetically*. Flank-tower bells ring, a flare arcs into view, gunfire comes from the left or right in stereo, and a soft warm glow builds at that screen edge. There are no arrows or minimap. On mobile, **camera assist** (an option, on by default) eases toward major events.

---

## B. Map layout (144 × 144 tiles)

See [mockup 1](mockups/01-world-overview.png).

### B1. Zones

| Zone | Contents |
|---|---|
| **Wilderness** (upper third of the map) | Groves (clustered woods), dry meadows, the **hunting meadow** with its deer herd, **rocky ground**, worn **west and east trails**, the **old road** with a bus wreck and power poles, **abandoned houses** (scavenger site, in the default frame), **gas station** (in the frame), collapsed house, farmstead, radio hill, and the **old town ruins** where hordes gather. |
| **Frontier** | Cleared kill-zone about 72 art px deep: stumps, rebar hedgehogs, wrecks pushed out as obstacles, temporary corpses, dust. The **wall arch** with **10 towers** (main tower on the rock outcrop) and the gate. The **culvert** where the creek passes under the wall is the known weak point. |
| **Settlement** | A **gridded town of about 60 homes** on the map axes (streets read as 2:1 diagonals, like Saigon's blocks), plus a civic core along the main street (below). |
| **Fields** | 5 crop types in patches along the bottom of the bend. Barn, greenhouses, water tower, two wind turbines. |
| **River** | 3 docks, a smokehouse, rowboats. The far bank has wildlife. |

### B2. Civic core (gate → river), all in or near the default frame

1. **Gate yard:** scavenger staging, two trucks, crates, alarm bell, 4 gate guards.
2. **Barracks + drill yard:** guard shift changes, weapon rack.
3. **Market (6 stalls):** trading, carrying, gossip. The busiest square in the world.
4. **Infirmary + triage tent:** medics and patients.
5. **Workshop / motor pool:** technicians on vehicles, scrap, smoke.
6. **Church** (alarm shelter for kids and elders), **school**, **town hall**.
7. **The green and the great oak:** commons fire, long tables, string lights.
8. **Kitchen / mess tent:** cooks, smoke, carriers from fields and docks.
9. **Memorial stones:** candles added when someone dies (see §F).
10. Playground, chicken coop, goat pen, beehives, laundry lines, gardens, rain barrels.

### B3. Threat approach routes (all believable, none spawn inside)

| Route | Path | Typical use |
|---|---|---|
| **R1 Main road** | old town → road → gate | Hordes, patrols, the classic set-piece |
| **R2 West trail** | farmstead → meadow → west wall | Gathering packs, ambush on scavengers |
| **R3 East trail** | radio hill → rocky ground → **culvert** | Probing the weak point |
| **R4 / R5 Riverbanks** | along the inner banks → wall ends | Flank attacks on the end towers |
| **R6 River** (rare) | drifting downstream → bank or dock | Current: floaters. Past: a swimming predator. Future: an amphibious drone. |

Threats spawn only **at the map edge or at a POI** (ruins, farmstead) and must walk in. Era-specific route preferences are in §G.

---

## C. Population system: about 120 residents, 3 tiers

Not everyone needs a brain. Three tiers, like Saigon's mix of "important" and "ambient" walkers:

| Tier | Desktop | Mobile | Brain | Examples |
|---|---|---|---|---|
| **A: Named** | 16 | 12 | Full schedule, relationships, memory, Chronicle entries | Scavenger leads, sniper captain, head medic, builder chief, the elder, the teacher |
| **B: Role agents** | 74 | 40 | Role timetable + task scripts (goto / work loop / carry / rest), 4 Hz updates | Farmers, guards, cooks, fishers, techs, builders, medics, market traders |
| **C: Ambient** | 30 | 18 | Saigon-style looping walkers and sitters on authored paths, with no identity. Recycled. | Passers-by, porch sitters, kids in yards, people at tables |
| **Total** | **120** | **70** | | |

**Role mix at 120** (desktop): guards 30 (towers 10, wall patrol 8, gate 4, reserve/drill 8) · farmers 16 · builders and repair 8 · techs 5 · medics 4 · cooks 4 · fishers 6 · scavengers 9 (3 teams) · traders 6 · teacher 1 · elders 8 · children 14 · general adults 9.

**The mockup** renders 124 settlers. The default frame alone shows **50 residents and 20 threats**.

**Making it look alive rather than synchronized:**
- **Phase offsets:** every agent starts its animation at a random frame and gets a ±15% speed jitter. Work loops have random holds of 0.5–2 s.
- **Schedule jitter:** each agent's timetable is shifted ±20 game minutes, so shifts and meals ripple rather than snap.
- **Purpose:** every Tier A/B walk has a destination and usually a carried item. Tier C walkers use looped paths with varied pauses.
- **Camera-weighted ambient spawning:** Tier C agents are placed **inside or near the current view**. Wherever the user looks stays dense, without simulating 120 brains everywhere. This is the key to keeping mobile busy on a smaller budget.

**Daily rhythm** (one in-game day ≈ 20 real minutes): dawn shift change → morning work, market and expeditions out → noon meal bell (the whole town converges on the commons) → afternoon work, harvest, returns and repairs → dusk with full tower crews, lights and supper → night watch, the night fisher, lit windows going out. The per-role timetable from v0.2 §B3 (commit `2a9bfc6`) still applies, scaled up to the larger crews.

**Interactions (social beats):** waves, chats with icon bubbles, hand-offs (food to a guard, ammo to a tower), hugs at the gate, kids tagging adults, trading at stalls, a medic checking on a patrol. These are triggered by proximity plus relationship.

---

## D. Directors: always alive, sometimes dramatic

### D1. Activity Director (continuous, traffic-style quotas)

Like Saigon keeps a steady stream of traffic and pedestrians, Holdfast keeps **minimum concurrent activity per zone**. Every 2 s the director tops up any deficit by starting a task, sending a walker or spawning an ambient threat at an edge.

| Zone | Quota (desktop, day) |
|---|---|
| Settlement | ≥ 25 people walking · ≥ 30 in work loops · 4–8 social clusters · 6–10 carriers |
| Market / commons | 8–16 people at all times, rising toward noon and dusk |
| Wall | 10 towers staffed at dusk and night (6–8 by day) · 6–10 patrol walkers · 2–4 gate |
| Wilderness within ±1 screen of the view | **8–20 wandering threats** · 6–12 wildlife · 2–4 bird flocks |
| Outside the wall | **at least 1 expedition** out for most of the day |

### D2. Encounter Director (frequent small, rare large)

| Tier | Example (Current era) | Frequency (Standard danger) |
|---|---|---|
| **Micro** | A sniper drops a lone infected. Zombies chase a deer. A walker rattles the fence. A guard spots something and calls it in. | **Every 25–55 s** (milestone 5; was 45–120 s) |
| **Minor** | A group of 3–6 gathers at a trail mouth and is thinned at the cleared ground. Expedition contact. A culvert probe. | Every 4–8 min |
| **Medium** | A pack hits a flank tower, a panel is damaged and the repair crew is deployed. A rescue sortie. | Every 6–10 min (was 12–20) |
| **Major attack** | A coordinated push on 2 routes: gate fight, flank breach attempt, all towers firing. 2–4 min long. | Every 18–28 min (was 30–45) |
| **Siege** | A horde from the ruins, a breach, and defenders holding the gap. 4–6 min. | About every 2 hours |

**Tension model:** the director tracks `tension (0–1)`. Micro events nudge it up, quiet time decays it, and large events require high tension plus a cooldown since the last large event. After a Major or Siege, **Recovery** (repairs, infirmary, cleanup, burn pile, memorial, shared meal) runs *on top of* normal life. It doesn't replace it.

**Approximate share of time:** busy peace (micro events only) 55% · tension/minor 25% · medium 10% · major/siege 4% · heavy recovery 6%. **No phase is ever still.**

### D3. Danger level (one option inside "···", not a primary control)

`Calm · Standard · Grim` scales death and injury probabilities and the encounter cadence. **Standard** targets about **1–2 settler deaths per real hour**, about 6 injuries, and about 60 threats killed. Calm targets about 0.3 deaths per hour. Grim targets 3–4. This lets the same world serve "leave it on while working" and "watch the drama".

---

## E. Scavenger expeditions (revised: real outcomes)

**Sequence** (unchanged from v0.2): Preparation → Gate opens → Departure → Exploration → Discovery → Return or Chase → Gate closes → Recovery. Now there are **3 teams of 3** and 3–5 expeditions per in-game day.

**Outcome table** (Current, Standard danger, a 3-person team at a mid-risk POI):

| Outcome | Base % | What you see |
|---|---|---|
| Clean return | 48 | Bulging packs, family greets them at the gate |
| Turned back early (blocked or weather) | 6 | Detour, empty packs, a shrug at the gate |
| Return with injuries | 18 | A limping member is carried and the medic meets them |
| **Fighting retreat**, all safe | 13 | Members walk backwards firing (aim frames + tracers), tower snipers cover, last-second gate |
| **One member killed** | 10 | They fall during contact. The others pull back. A rescue sortie may recover the body. |
| Two killed | 3 | Same, with heavier grief at the fire that night |
| **Team lost** | 2 | No return. At dusk a guard lights an extra lamp on the wall, and a stone is added. |

**Modifiers:** night ×1.6 risk · rain ×0.8 (masks sound) · fog ×1.3 · horde gathering at the ruins ×2 (on that route) · experienced Tier A lead ×0.7 · team of 4 ×0.8.

**Rescue sorties:** when a team is in trouble within about 25 tiles of the wall, there's a 40% chance a 4-guard squad sallies out through the gate. It succeeds about 75% of the time. A rescue can turn a loss into an injury, and occasionally a rescuer is hurt instead. This is the brief's "occasional successful rescue".

**Simple AI** (still no tactical planner):
- Authored route splines with jitter. Formation = leader plus followers.
- Detection uses the era sense (§G), with states `Idle → Investigate (?) → Pursue (!) → Lost`.
- Combat is a **range check plus dice**: each shot every 0.6–1.2 s with a hit chance by range, light and shooter tier. Melee contact is a per-second damage roll. Members have 2–3 "hits" (injured at 1, down at 0).
- There is **no guaranteed safe margin** any more. The director only guarantees that *the settlement* survives, not the team.

---

## F. Combat and consequences

### F1. Deaths, handled with restraint

- **Who can die:** adults outside the wall (scavengers, rescue squads) and defenders at the wall, gate or towers. **Children and elders never die and are never placed in danger zones**: they shelter in the church on any alarm. This is a hard tone rule.
- **Death animation:** hit flash → stagger → **fall (4 frames) → still**. There is **no blood, no gore sprite and no dismemberment**. A teammate kneels beside them for 1–2 s if safe.
- **Aftermath:** in Recovery, two settlers bring a stretcher, cover the body with a sheet, and carry it to the **memorial stones**. A candle is added that night, and the Chronicle names them. No body is left lying inside the walls.
- **Named (Tier A) characters can die,** but rarely (×0.3 risk). A Tier B agent is **promoted** to take over the role, so story continuity survives.
- *Rejected for tone:* fallen settlers coming back as zombies.

### F2. Replenishment (an endless simulation)

- **Population floor 90 / target 120 / cap 130** (mobile: 50 / 70 / 76).
- **Arrivals:** refugee groups of 1–4 walk up a route to the gate. Guards check them and the gate opens. Probability rises the further the population is below target. Expected rate at Standard is about 2 per real hour, balancing deaths.
- **Other sources:** a scavenger team rescues a survivor (rare), or a trader caravan stays (Current: a truck, Past: a canoe, Future: a shuttle drone).
- New arrivals spend their first in-game day at the RV/tent row, then get a role and a house.

### F3. Threat defeat per era

| | Zombies (Current) | Dinosaurs (Past) | Robots (Future) |
|---|---|---|---|
| Killed | Fall forward → **temporary corpse** (2–4 game h) → the cleanup crew drags them to a **burn pit** (smoke column) | **Killed** (large ones are rare and need several spears or arrows), **injured** (limp away), or **driven off** by fire and noise | **Destroyed:** sparks → small explosion puff → collapse → **salvageable wreck** |
| Remains | Corpses with dust stains (fade over 1 game day) | Carcass is butchered over time and becomes food (smokehouse busy) | The salvage crew cuts wrecks up for parts, which appear later as turret plating |
| Hit reaction | 1-frame white flash + stagger | Flinch + roar | Sparks + light flicker |

### F4. Defense animation (unchanged from v0.2, scaled up)

- Tower snipers aim (0.6 s hold) → muzzle flash (1 frame) → faint tracer (2 frames) → recoil. **About 25–35% miss** with a dust puff.
- Gate defenders brace and push. The wall patrol runs to a threatened panel. Builders brace panels mid-fight.
- **Defenders can be hurt or killed** at the wall when a breach happens or a tower is climbed (Past) or cut (Future).
- **Structural damage:** panel `intact → dented → breached`, tower `ok → damaged → burned/cut`. Repairs run as visible jobs (carry → hold → hammer), and big repairs get scaffolding. The mockup shows a **breached panel with timber braces** and a 4-person crew.

---

## G. Threat behaviour per era (busy but distinct)

| | **Past: scent and territory** | **Current: sound** | **Future: sight and signal** |
|---|---|---|---|
| Always-visible ambient | Grazing herds, small raptor pairs hunting rabbits, pterosaurs overhead | Lone shamblers, groups of 3–6 drifting toward noise, zombies chasing deer, crows on wrecks | Scout drones sweeping cones, quadruped patrols on the road, a spider unit on the rocks |
| Preferred routes | R2/R3 trails (follow game paths), R4/R5 banks (to drink) | **R1 road** (noise funnels down it) plus anything the guns attract | R1 in formation, R3 culvert (signal leak), rare R6 amphibious |
| Escalation | Smell of the smokehouse or a fresh kill pulls predators. Rival packs fight each other. | Gunshots raise the noise map, so **sniping too much draws more**, a nice self-balancing loop. | A drone that sees a light leak calls a squad, and a squad that's lost calls a heavy walker. Blackout drills reduce it. |
| Major attack | A predator pack plus an apex on the west trail at dusk, with the palisade torched by a lightning fire | A horde from the ruins down R1, a flank group on R3 | A drone swarm plus quads, a heavy walker at the gate, an EMP counter |

---

## H. Sprite and animation specification (updated)

**Pixel Art Studio status.** The skill is on this machine at `.agents/skills/pixel-art-studio/` (untracked, recorded in `skills-lock.json`), but it **isn't registered as a callable skill in this Claude Code session**, so I couldn't invoke it. I read its `SKILL.md` and its references (`patterns`, `techniques`, `animation`, `validations`, `sharp_edges`) and applied the rules by hand. I didn't run its scripts. The rules adopted:
- **Integer-only, nearest-neighbour scaling** (its #1 sharp edge). This is why v0.2's 1.25×/1.5× zooms are gone.
- **Chibi head = 40–50% of height**: 6 of 13 rows.
- **Silhouette first:** weapons and tools break the outline (rifle barrel, hoe, crate overhead). They read more than internal detail.
- **Hue-shifted ramps:** shadows shift toward plum, highlights toward warm cream. One light source (upper left). No pillow shading.
- **Fewer, better frames:** walk 4 (contact–passing), death 4–6 (impact → collapse → settle), and the same pivot for all frames.

| Sprite | Size (art px) | Drawn facings | Frames |
|---|---|---|---|
| Adult | 8 × 13 (16 tall with an overhead load) | front, side (mirrored) → 4 diagonals | idle 2 · walk 4 · run 6 · work 3–4 · aim 2 + fire 1 · kneel 2 · sit 2 · hurt 2 · death 4 |
| Child | 8 × 10 | front, side | idle 2 · run 4 · play 4 |
| Zombie | 8 × 13, hunched | front, side | shamble 4 (irregular hold) · attack 2 · hit 1 · death 4 · corpse 1 (13 × 3) |
| Raptor / grazer / apex / long-neck | 14 × 10 / 28 × 18 / 40 × 30 / 64 × 48 | side (mirrored) | walk 6 · run 6 · attack 3 · hurt 2 · death 5 |
| Drone / quad / spider / heavy | 7 × 5 / 14 × 10 / 18 × 10 / 28 × 34 | side | hover 2 · gait 4 (even timing) · fire 2 · explode 5 |
| Deer, dog, goat, chicken, crow | 11 × 9, 9 × 5, 7 × 4, 3 × 3, 3 × 2 | side | 2–4 |

**Animation LOD** (performance and readability): agents more than 1 screen from the view update at 1 Hz and aren't drawn. Threats more than half a screen beyond the frame edge use 2-frame cycles. Crowds in the horde core share an animation clock with per-agent phase offsets.

**Buildings and environment:** Saigon-style box models (`bake()` approach): walls, gable or flat roofs, window and door inserts, era palettes, and wear overlays (boarded, rust, moss, scorch). **Tower platforms are open** (only a back tarp), so snipers are always readable. This was fixed after the first v0.3 render, where a roof hid them. **Wall panels stay at 9–10 px** (shorter than a person), with a **lattice cutaway** where a threat presses against the wall. Both are shown at the culvert in mockup 2.

**Lighting:** dusk grade warm inside `(1.0, .80, .64)` and cool outside `(.66, .68, .88)`, blended at the wall. Emissives (windows, fires, string lights, muzzle flashes, tracers) are drawn after the grade, plus soft searchlight cones from the towers.

---

## I. Interface (as v0.2, two changes)

The functional reference is Saigon's UI, with a "field notebook and stencil" identity. Controls: timeline tabs `PAST | CURRENT | FUTURE`, music bar, YouTube, time, weather, seasons, volumes, VI/EN, fullscreen, Lofi Worlds home, and the Day Chronicle (collapsed notebook).

1. **Zoom steps are integers** (see §A).
2. **"···" gains "Danger: Calm / Standard / Grim"** (§D3).

Still not allowed: health bars, resource counters, minimaps, alerts or control of anyone.

## J. Audio (as v0.2, with density budgets)

The v0.2 layering, attenuation, day/night variants, era crossfades and the **"music never stops"** rule all stand. For a busier world:
- **Voice budget:** at most 10 simultaneous ambience one-shots (hammering, chatter, chickens…) and at most 4 combat voices. Combat bus 14 dB below the music, at most 6 shots per 10 s.
- **Crowd bed:** a looped murmur stem whose gain follows the number of visible residents, so a busy market *sounds* busy without dozens of voices.
- **Deaths are never sonified with screams.** A muffled impact, then silence on that layer for 3 s. Grief is heard later, at the fire (a soft guitar or song).

---

## K. Technical feasibility (browser, Canvas 2D, vanilla JS)

| Budget | Desktop target | Mobile target | Notes |
|---|---|---|---|
| Residents | 120 (16 A / 74 B / 30 C) | 70 | Tier C is camera-weighted, so density in view stays high on mobile |
| Threats active | 80 (60 on screen max) | 35 (25 on screen) | Hordes beyond the view are simulated as a single "blob" token that splits into agents on approach |
| Wildlife | 30 | 12 | |
| Sprites drawn per frame | ≤ 400 | ≤ 220 | Each is an atlas `drawImage`, frustum-culled |
| Particles / tracers | ≤ 300 | ≤ 100 | Pooled |
| Light stamps | ≤ 96 | ≤ 32 | Pre-blurred sprites, additive pass |
| Frame rate | 60 fps render, 10 Hz sim | 30 fps render, 5–10 Hz sim | Interpolated movement |
| Memory | ≤ 200 MB | ≤ 110 MB | Baked chunks for 1 era × 1 season |

**Architecture choices:**
1. **Bake everything static** (ground, buildings, trees, wall) into 512 × 256 chunk canvases per era and season, as Saigon's `bake()` caches do. The time-of-day grade is a multiply pass.
2. **Dynamic sprites only** are depth-sorted each frame with a **bucket sort by iso row** (O(n)), interleaved with tall static occluders kept as separate sprites.
3. **Navigation:** precomputed **flow fields** on the 144 × 144 grid (about 20 KB each) to about 30 destinations (homes are grouped by block). That's about 600 KB and about 30 ms to build at load. Outside the wall, threats use per-route fields and expeditions use splines. Noise and scent maps run on a coarse 36 × 36 grid updated at 2 Hz.
4. **Agents** are structs in typed arrays (position, tier, role, task, timer, frame, phase), about 64 B each. 120 + 80 + 30 agents update in well under 1 ms per sim tick on desktop.
5. **Hidden tab:** the simulation drops to 1 Hz with no render. On return it catches up at most 60 game seconds. Deaths can't happen while the tab is hidden: the Encounter Director pauses, so users don't come back to unexplained losses.

**Feasibility verdict:** 120 residents and 60 on-screen threats are **plausible but unproven** in Canvas 2D at 60 fps on desktop. The sprite count is within normal 2D canvas throughput, and simulation cost is small. **Mobile at 70 + 25 is the risky target.** I recommend a throwaway **stress-test prototype first** (static baked map plus N dummy animated sprites, no gameplay), measuring fps and memory at 120/60, 160/80 (desktop) and 70/25 (iPhone 12-class) before any real implementation. If the full target misses, reduce Tier C first, which is invisible to the design because it's camera-weighted.

---

## L. Timeline switching (updated for persistent consequences)

- **Each era keeps its own saved community state** (roster, deaths, wall damage, memorial). They are parallel versions of the same people: a death in Current does not remove that person in Past.
- **Only one era simulates at a time.** When you leave an era, it freezes and snapshots. When you return, it resumes.
- **If an attack is running when you switch,** the snapshot is taken but **resumes at Recovery** on return, so no stale half-battle appears.
- **Expeditions outside** are snapshotted in place. On return they continue, and pursuers are re-seeded at a safe distance.
- **Crossfade:** 1.2 s visual dissolve plus 2.5 s ambient audio crossfade, with camera, zoom, time, weather, season and music all preserved. Rapid switching is debounced.
- **Geography anchors** never move: river, creek, outcrop, oak, gate, wall line, docks, field area.

---

## M. Signature moments (v0.2 list kept, plus density-era additions)

Additions for the busier world:
- **Market morning:** 15+ people trading, a cart arriving from the fields, kids weaving through.
- **Shift change wave:** a ripple of guards walking the wall as the night crew climbs the towers one by one, each lamp lighting as they arrive.
- **The burn pile at dusk** after a big day: a smoke column over the cleared ground and a guard leaning on a shovel.
- **Rescue sortie:** the gate opens, four guards run out, and the snipers lay down cover. It doesn't always work.
- **Candle night** after a death: the town gathers at the memorial, then drifts back to the fire.
- **Zombies chasing deer** across the meadow while a sniper watches but doesn't waste the shot (noise draws more).
- **Arrivals at the gate:** a ragged family walks up R1, the guards hesitate, then the gate opens.

---

## N. Mockup notes

**1. World Overview** ([png](mockups/01-world-overview.png)) is a planning diagram, deliberately zoomed out (1×):
- Whole 144 × 144 map, gridded town of 62 homes, wilderness of groves, meadows, trails and ruins.
- Red = threat routes R1–R5, blue = rare river route R6, yellow = scavenger routes.
- Camera frames: default 3× (gold), 2× zoom-out (blue), iPhone portrait (pink).

**2. Current era, dusk** ([png](mockups/02-current-era-dusk.png)) is exactly the default 1920 × 1080 view (640 × 360 art px at 3×). In one frame:
- **50 residents, 20 threats.**
- A sniper on the outcrop tower **dropping a zombie** on the road (tracer, white hit-flash), with **corpses** from earlier shots in the kill-zone.
- **Scavengers retreating while shooting** from two infected at the abandoned houses ("!" bubble).
- **Zombies chasing deer**, a group gathering on the west trail (one "?" hears something), and three infected pressing on the **culvert**, shown with the wall cutaway.
- Wall patrol, open-platform tower guards and gate guards; barracks drill; **6-stall market** with traders and carriers; infirmary triage (kneeling medic, patient with "+"); workshop techs on a truck.
- The oak and the commons fire, drum fires and searchlights.

**Limits:** static frame, no motion. Procedural art (hand-polish later). Some stalls and props are placeholders. The left and right flanks of the wall are off-frame by design.

---

## O. Critique: weaknesses and fixes

1. **Readability at this density.** 50 people plus 20 threats is near the limit of one frame. **Fix:** strict colour coding (guards olive, medics white, builders yellow, zombies grey-green and *never* used for settlers), and a slight desaturation on threats more than 1 screen from the action.
2. **Death and lofi tone.** **Fix:** restraint rules (§F1), no screams, mourning instead of shock, children and elders never at risk, the Danger option, and deaths paused while the tab is hidden. *It should be tested with real viewers before committing.*
3. **Performance is unproven.** **Fix:** do the stress-test prototype (§K) before any gameplay code. The fallback order: Tier C, then off-screen threats, then light stamps.
4. **Wall occlusion** still matters at 3×. **Fix:** 9–10 px panels plus the lattice cutaway, as shown.
5. **The town grid looks repetitive** (procedural repeats in mockup 1). **Fix:** hand-authored lot variants (burned house being rebuilt, walled courtyard, chicken yard, ruined lot used as a garden) and irregular blocks near the river.
6. **Half the wall is off-screen by default.** Flank fights could be missed. **Fix:** diegetic off-screen cues (§A) and mobile camera assist. Also ensure about 60% of encounters use R1–R3, which reach the central frame.
7. **The cleared ground is shallow at 3×** (about 72 art px). Fights near the wall may feel cramped. **Fix:** consider 85–90 px depth and verify in the Attack mockup.
8. **Night density vs darkness.** More lights help, but threats still need a 1-px rim or eye glint in the dark (unchanged from v0.2).
9. **Expedition fatalities vs Chronicle fatigue.** About 1–2 deaths per hour, all announced, could feel heavy. **Fix:** Chronicle entries for deaths are factual and brief, and Standard can be tuned after playtesting.
10. **Name check** for "Holdfast" is still pending.

---

## P. Next decision (for you)

1. Approve or adjust the **3× default camera**, the **density** (50 + 20 in frame) and the **threat visibility** in mockup 2.
2. Confirm the **death and replenishment rules** and the **Danger option**.
3. Then: Past, Future, Attack, UI and gallery mockups, followed by the performance stress-test prototype.
