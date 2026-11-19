# Holdfast — The Future (design)

Milestone 9. The third age of the same valley: a settlement that rebuilt itself from salvaged technology after a technological collapse, holding out against autonomous machines run by a hostile network. Still an observation-only lofi diorama: no player, no construction, no objectives, no resource HUD, no game-over.

## 1. Identity

| | Past | Current | **Future** |
|---|---|---|---|
| Threat | dinosaurs | the infected | **autonomous machines + their sensor network** |
| Material | thatch, logs, hide | weathered suburbia, scrap walls | **worn composite cladding, salvaged plates, solar glass, copper patches, moss creeping back** |
| Light | fire | lamps, tracers | **warm windows and LED strips inside; cold red sensor light, searchlights and cyan sensor nodes at the perimeter** |
| Defense | palisade, archers, fire | scrap wall, rifles, sniper towers | **sensor barrier, pulse rifles, automated turrets, searchlights, repair drones** |

Tone rules: advanced but worn, warm human living spaces against cold machines; no sterile white city, no neon. Everything is drawn in the approved pilot language (`bake()` box models, per-pixel painters, cocoa ink, plum shade, one light, the warm grade). Machines are graded like everything else, so they read slate-violet by day; their identity comes from cold steel, red sensor eyes and glowing hostile marker strips, which carry them at night.

## 2. Geography (unchanged)

Same map seed, same 144×144 grid, river bend and creek, wall line and gate, the 10 towers, the great oak, lots, civic sites, fields, docks, POIs and the threat routes. The map has 5 routes (R1–R5) in all ages; the brief's "R1–R6" did not match the map, so the existing five were kept rather than adding a sixth that Current and Past would lack. The Future only adds its grid on free settlement ground: 4 substations (one per power sector), up to 10 ground solar arrays, 3 drone pads (workshop, supply exchange, hospital roof). `tests/holdfast-future.mjs` proves the terrain, ground kinds, navigation grid, walls, towers, gate, oak, buildings, docks, routes, POIs and every Current prop are identical.

## 3. Landmarks

| Site | Future building |
|---|---|
| Church / Ancestor Hall | **Memory Sanctuary**: terraced plinth, a long hall under a lit, ribbed glass vault with light columns, a domed reading room, and a spire of seven luminous tiers with copper rings and a beacon (height 127, still the tallest structure) |
| School | **Learning & Research Academy**: vaulted hall, big window band, display board, observatory dome with telescope slot, roof solar, antenna |
| Hospital | **Medical & Rehabilitation Center**: white and teal, glass atrium, lit green cross, rooftop drone pad with its H and landing lights |
| Barracks | **Defense Command & Training**: armoured hall with raked plates, amber stripes, radar dish, comms masts |
| Workshop | **Fabrication & Robotics Repair**: open bay, sawtooth skylights, gantry crane and hoist, an orange robot arm, a fabricator, a salvage bin that fills and empties |
| Stable | **Mobility Depot**: solar canopy over charging bays and posts; the "horses" are compact electric rovers (wheels turn, plugged in when parked) |
| Market | **Supply Exchange**: kiosks with price screens, cargo-drone pad |
| Kitchen | **Community Food Hub**: steel counters and hoods under a solar canopy, LED fascia |
| Fields | **Hydroponics**: tray channels between the plant rows (the shared crop cycle drives the plants), hydroponic glass domes |
| Graveyard | **Memorial Garden**: light posts, glass slabs, planted plinths, rings of small lights |
| Farmyard | animal shelter modules, bee boxes with solar lids |
| Docks | **River Logistics Terminal**: floating composite pontoons, amber marker lights; electric skiffs, cargo hover-barges, the medical boat |
| Wall | **Reinforced sensor barrier**: composite plates on steel posts, a sensor node on every post (amber on weak sections), energised mesh sections, hazard-striped kick plates; damage strips plates away |
| Towers | **Defense platforms**: braced steel legs, lift cage, armoured deck, sensor mast + radar plate, a turret and a searchlight housing |
| Gate | sliding blast doors under a beacon-topped portal with a status screen |
| Homes | modular habitats on the old lots: composite cladding, window bands, solar mono-pitch, ribbed vault or green roofs, heat pumps, antennas, porch canopies with planters, charging carports with a rover |

Every one of the 73 Current prop kinds has a Future model (vehicles become rovers, haulers and an overgrown maglev carriage; the gas station becomes a charging station; lamps, poles, bins, benches, beds, laundry, play equipment, anti-machine obstacles…).

## 4. Machines (19)

| Type | Class | Body / locomotion | Behaviour |
|---|---|---|---|
| mite | recon | micro quad-rotor | flies with a swarm controller, orbiting it |
| eye | recon | hovering sensor dome with a red lens | flies in to scan; sometimes crosses the wall to look inside |
| rover | recon | 4-wheel scout with a sensor mast | scans a cone, reports, never chases |
| skitter | small | fast little quadruped | runs in groups of 2–3 |
| spider | stealth | 8-legged, low | goes for weak / mesh sections, climbs over, slips inside, sabotages a substation (no stagger, hard to hit at night, invisible to turrets until it acts) |
| hound | hunter | jointed quadruped | packs hunt people outside; each hunter takes a side of its target before the rush (flanking) |
| sentry | patrol | humanoid with a rifle arm | patrol formations (leader + sentry + warden) walk waypoints along the frontier; fires bolts |
| warden | armor | heavy humanoid with a shield slab | slow, tough, fires, damages walls |
| tank | assault | tracks + turret | charges weak sections, fires |
| racer | pursuit | two big wheels, very fast | chases returning salvage teams |
| hawk | air | delta-wing interceptor | crosses the wall, strafes repair drones and people in the open |
| leech | climber | segmented crawler | clamps onto the wall face and cuts plates |
| jammer | electronic warfare | tripod with mast and dish | deploys near a tower: towers in reach go blind (no turret, flickering searchlight), wall sensors jammed, purple pulses |
| mender | support | low hover unit with two arms | follows damaged machines and repairs them |
| pylon | sensor | tall mast on four legs | walks to a vantage point and deploys: 300-unit, 360° sweep; relays signals further |
| queen | swarm | hexagonal drone, six rotors | releases a swarm of mites |
| brute | heavy | huge four-legged war machine | seeks weak sections, rams |
| walker | siege | 50-unit bipedal walker, twin cannons | a rare assault on the gate's flank: stops at range and bombards |
| colossus | apex | 61-unit hexapod with a searchlight eye | very rare; walks the frontier, sometimes assaults the gate |

All are `bake()` box models facing +x with 4-frame walk phases (legs, tracks and wheels turn), two baked orientations mirrored for the other two facings (like the dinosaurs), an attack pose, a climb pose (leech) and a **wreck**: the same machine slumped, cold, partly broken apart, with a scorch mark. Wrecks smoke, then fade; they are never the infected's fall.

## 5. The hostile network

- **Sensor cones**: scouts, sentries and platforms see in a cone (range × half-angle) that sweeps; a person behind a machine is not seen. Cones are drawn faintly on the ground (they glow red at night).
- **Detection → transmission → response**: a detection broadcasts a signal (rings and a dashed thread to the target, a ping); nearby combat machines converge; a scout's report requests reinforcements, which arrive 14–26 s later from out of sight. Deployed sensor platforms relay further. A network-wide pacing (35 s between redirects, 120 s for night lights) keeps sightings frequent and assaults rare.
- **Lights**: at night a scout close to the wall notices a powered sector's lights.
- **Coordination**: flanking hunters, patrol formations, swarms, repair units, jamming, weak-section probing, siege.

## 6. Defense and emergencies

Pulse rifles (cyan bolts) replace bullets. Each defense platform has an automatic turret (amber bolts) that works only when its sector has power or the battery has charge, and only when not jammed. It engages machines that threaten the wall (within reach of it, inside it, or strafing), never wanderers in the trees. Searchlights sweep the ground outside at night. Repair drones fly to damaged sections and weld them (more of them during recovery). Medics, rescues, injuries and deaths use the shared systems. Machines' bolts can hurt people.

## 7. Community loops (visible cause → effect)

- **Energy**: sun → arrays (dirt builds up, wind faster) → battery → four sectors. A technician wipes the dirtiest array. Random faults black a sector out; a technician walks (runs) to its substation and repairs it, and at night an on-call technician gets up. An empty battery sheds one sector until it recovers. The medical center's sector falls back on backup power and never goes dark. Small flickers.
- **Hydroponics**: the shared crop cycle (plant → grow → harvest → stores → kitchen → meals), drawn as tray channels and domes.
- **Fabrication & salvage**: wrecks near the wall are stripped by salvage teams (an expedition through the gate); the parts fill the workshop bin; the fabricator turns them into spares (the bin empties).
- **Mobility depot**: rides and pack trips use rovers; parked rovers charge.
- **Supply exchange**: cargo drones land at the exchange pad, unload, restock the kiosks and leave.
- **Medical**: medical drones land on the hospital roof with supplies; the shared medic routines (checkups, treatment, stretchers) continue.
- **Learning, memorial, river, market, school, farmyard, training**: the shared community loops, re-skinned.

## 8. Signature events

1. **Drone discovery**: a scout spots the settlement and transmits; reinforcements answer (journal: "A scout machine has spotted the settlement…", "The signal was answered…").
2. **Salvage pursuit**: hunters or racers chase a salvage team home.
3. **Localized blackout**: a sector goes dark and a technician restores it.
4. **Medical delivery**: a drone lands on the hospital roof.
5. **Workshop recovery**: a hawk shoots down a repair drone; a mechanic carries it to the workshop; it is repaired and flies again.
6. **Electronic attack**: a jammer blinds towers until it is destroyed.
7. **Heavy machine assault**: the siege walker bombards the gate's flank.
8. **Community recovery**: after an alarm, once walls and grid are repaired, the journal marks it.

## 9. Three ages in one page

The milestone 8.1 world manager already supported any number of eras. The Future is a third lazily built context, prepared in time slices in the background and shown with the same 1.2 s crossfade. See `FUTURE-STATUS.md` for measurements.
