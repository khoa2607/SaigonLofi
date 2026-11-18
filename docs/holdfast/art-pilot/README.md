# Holdfast: Art Quality Pilot

> Status: **pilot for approval**. One scene only. The full map, other eras and game code are not started.

| File | What it is |
|---|---|
| [`holdfast-pilot-dusk.png`](holdfast-pilot-dusk.png) | **The pilot, golden hour**, 1120 × 630 at 1:1 (exactly what a 1080p screen shows) |
| [`holdfast-pilot-dusk@2x.png`](holdfast-pilot-dusk@2x.png) | Same frame at 2× (one zoom step in), nearest-neighbour |
| [`holdfast-pilot-day.png`](holdfast-pilot-day.png) · [`holdfast-pilot-night.png`](holdfast-pilot-night.png) | Same scene under Saigon's day and night ambients |
| [`comparison-saigon-vs-holdfast.png`](comparison-saigon-vs-holdfast.png) | **Side by side with current SaigonLofi**: 1:1 row and 3× detail row |
| [`saigon-reference-1080p.png`](saigon-reference-1080p.png) | Fresh SaigonLofi screenshot (headless Chrome, 1920 × 1080, `?era=1&time=afternoon&wx=clear&season=summer`) |
| [`pilot.html`](pilot.html) + [`pilot.js`](pilot.js) | The pilot's source. A static page; open it via a local server at `/docs/holdfast/art-pilot/pilot.html?t=dusk\|day\|night` |

**What's in the scene:**
- **3 suburban houses:** a cream two-storey, a sage bungalow with garage, and a blue two-storey.
- **About 50 wall panels:** corrugated, plywood, pallet, chain-link and car-door sections.
- **1 sniper tower.**
- **9 settlers:** sniper, spotter, builder hammering, builder carrying a plank, gardener with hoe, laundry, wall patrol, an elder on the porch steps, and a kid with a ball.
- **8 infected:** 3 on the road, 2 clawing at a low section, 1 being shot, 1 leaving the trees, and 1 fallen.
- **Surroundings:** mixed forest with clearings, a cracked road, a burnt-out house, wrecks, a pickup, a guard post, a water tank, raised beds, a coop, a field and fire barrels.

---

## Why the v0.3 mockups looked like prototypes

1. **Wrong pixel density.** The v0.3 mockups drew 13-px people and blew them up 3×. Saigon draws **40-px people at 1 art px = 1 screen px** (`K = 2` art px per world unit; `resize()` picks a scale of 1 at 1080p). Chunky 3× pixels can't hold Saigon's detail.
2. **A separate, simpler renderer.** The Python mockup tool had flat faces, no materials, no crease lines and no costume detail.

## How the pilot reaches Saigon's quality

The pilot **renders with SaigonLofi's own art system**. `pilot.html` loads `js/core.js` and `js/art.js` read-only, and nothing in them was changed:

| Saigon system (reused as-is) | What it gives Holdfast |
|---|---|
| `bake()` box baker | Warm **grade**, sunlit tops, **plum-brown shade side**, contact shadow at the base, lit top lip, **crease lines** where boxes meet, **cocoa ink outline**. The same "Saigon chiều" light on every Holdfast object. |
| Per-pixel face painters `(f, u, v)` + `EM` | Materials are painted per pixel and windows glow at dusk and night through the same emissive channel Saigon uses. |
| `drawPerson()` + costume hooks (`evTorso`, `evFace`, `evOver`…) | Holdfast people are **Saigon's chibi townsfolk**: big round heads, two-tone cloth, faces, poses. Holdfast adds gear through the hooks Saigon already uses for Halloween and Christmas costumes. |
| `treeSprite()` + `inkGrid()` | Saigon's broadleaf species, plus a **new Holdfast conifer** drawn with the same puff-shading and ink method. |
| `shadowSprite()`, ambient multiply + light pass | Soft dithered contact shadows, plus the same time-of-day ambient and emissive glow composite. |

**New for Holdfast** (all in `pilot.js`):
- **Clapboard siding painter:** lap shadow per board, lit board edge, board-to-board tone, weather stains, drip streaks under sills, splash grime, peeled paint.
- **Window kinds:** curtained, lit, **boarded** (planks, nails, spray-painted "SAFE"), and **broken** (hole and cracks).
- **Stepped shingle roofs:** tab rows, gaps, course shadows, moss, missing shingles. Plus gable siding, brick chimneys, gutters, porches with railings, a garage roll door, solar panels and a satellite dish.
- **Wall materials:** corrugated sheet (ridges, rust bloom, bolt rows, spray tags), plywood (grain, nails, "KEEP OUT"), pallet (see-through slats), chain-link, a car door with a mesh window, sandbags, razor wire and outward stakes.
- **Sniper tower:** braced legs, ladder, plank deck, corrugated parapets, a tarp canopy and a lantern.
- **Zombie look:** a hook that remaps Saigon's skin ramp to a grey-green infected ramp, sunken eyes, slack mouth, torn and filthy shirt with a ragged hem, and both arms reaching. No gore.
- **Guard and worker gear:** olive vest with pouches, helmet, rifle (aim, carry, sling), hi-vis builder vest, hammer, hoe, plank on the shoulder, laundry, binoculars.
- **Ground painters:** cracked asphalt with weeds and faded dashes, broken sidewalk slabs, the trampled kill-zone with shell casings, a patrol path, lawns with mowing stripes, tilled rows, and grass tufts that rise above the ground plane.
- **Cast shadows:** crisp-mask building shadows falling right-down (sun upper-left), tinted plum.

## Honest gaps (pilot vs Saigon)

- **Density.** The pilot slice has more open ground than a Saigon city block, which is by design (suburb plus kill-zone). The full map should still add **street clutter** in the settlement: mailboxes, bins, bikes, carts, signs and planters, at Saigon's prop density.
- **Static frame.** People and zombies are single poses. Saigon's 4-frame walk sheets (`personSheet`) will animate them.
- **Signage.** Saigon's shop signs carry a lot of its colour. Holdfast's equivalent (painted boards, spray tags, the gate sign) is only lightly used so far.
- **Pixel Art Studio** was activated as a registered skill for this task. Its loop (render → look → critique → fix) produced 13 render passes for this pilot. Its rules are written into the art rules below. Its Python sprite library wasn't used: the art is drawn by Saigon's JS art system, so it matches Saigon exactly.

---

## Holdfast art rules (for everything after approval)

### Density and camera
1. **Same density as Saigon:** `K = 2` art px per world unit, displayed at **1 art px = 1 device px at 1080p** (Saigon's default `resize()` rule). Zoom steps are **integers only**. *This supersedes v0.3's "13-px people at 3×".*
2. **Same projection:** iso `x − y`, `(x + y)/2 − z`. Tiles are 8 world units (32 × 16 art px). Every edge is 2:1, vertical or horizontal.
3. **Scale anchors:** a person is ≈ 20 world units tall (≈ 40 art px). A storey is 18–20 units. A **wall panel is 15–17 units (≈ 75% of a person)** and low sections are 13, so heads and hands always read above the wall. A tower deck sits at about 46 units.

### Rendering
4. **Everything solid is a `bake()` box model** with per-pixel face painters. No flat-filled shapes, ever.
5. **Never bypass the grade.** Colours go through `grade()` (it's automatic in `bake`/`drawPerson`). Use `raw` only for emissive or UI-like colours.
6. **One light:** sun from the upper left. Top faces lit, the right face plum-shaded, cast shadows fall right-down.
7. **Ink:** 1-px cocoa outline plus crease lines from `bake()`. Exception: fine see-through materials (chain-link, mesh) bake with `noInk`, or the ink pass fills their holes. This was found and fixed during the pilot.

### Materials (every surface needs at least 3 of these)
8. A base colour plus **structure lines** (boards, tabs, ridges, mortar), **tone variation** per element (hash), **weathering** (`vnoise` stains or rust), **grime** near the ground, and **one story detail** (spray tag, boarded window, a patch).
9. **Era palettes** come in faded, warm-graded families. Current era: weathered pastels, galvanized grey, rust orange, faded tarp blue, olive drab. Avoid pure saturated colours except tiny accents (hi-vis vests, spray paint, flame).

### Characters
10. **Every human is `drawPerson()`**, so Saigon and Holdfast characters are one family. Role is shown by **silhouette-breaking gear plus a colour block** (rifle barrel, hoe, plank, helmet, hi-vis), not by faces.
11. **Infected** = the same body with a **grey-green skin ramp swap**, sunken eye sockets, a slack mouth, torn and filthy clothes and reaching arms. **No blood or gore sprites.** A fallen infected is the figure laid flat.
12. Facing uses Saigon's sheet: front, back, and both mirrored. The sniper aiming out uses the back view.

### Environment
13. **Trees** use Saigon species plus Holdfast conifers in the same puff-shaded, inked style. Forests are **clustered, with clearings**, never a solid canopy.
14. **Ground** is painted per world unit with hash/vnoise like Saigon's `groundColor`. Add raised tufts and weeds, and roads must show age (cracks with weeds, potholes, faded paint).
15. **Story props per screen:** at least 1 wreck or ruin outside, at least 3 household-life props inside (laundry, beds, coop, bikes…), and defensive clutter at the wall (sandbags, stakes, wire, fire barrels).

### Lighting
16. Time of day = Saigon's ambient multiply plus the emissive pass. Windows, fires, lanterns, muzzle flashes and tracers are emissive. Warm settlement light against cooler wilderness at dusk and night.

### Process (Pixel Art Studio)
17. For every new asset type: draw it at true size → render it in a scene at 1:1 → **look at 1:1 and at 3×** → critique (silhouette, light, clusters, occlusion) → fix. Judge at actual in-game zoom, not on contact sheets.
