# Sài Gòn qua năm tháng (testFableLofi)

An isometric Saigon street corner that changes through four eras (199x, 200x, 201x, 202x), with seasons, weather, time of day and lofi music.

- Open `index.html` directly for everything except YouTube.
- For YouTube playlists run `serve.bat` (or `python -m http.server 8765`) and open http://localhost:8765/ because YouTube refuses embeds on `file://` pages.
- All art is drawn by code at load time. Style reference: `web-lofi3.png`.

## Art style (2026 redesign)
Everything is drawn by code in one style taken from the reference sprite: chibi townsfolk with big heads and faces, cocoa-brown ink outlines, warm cream / peach light and plum-brown shade, at **2 art pixels per world unit** (`K` in `js/core.js`).
- `js/core.js` `bake()` renders every box model (buildings, landmarks, vehicles, boats, props) at K with the warm grade (`grade()`), cel shading, crease lines and an ink outline. `gridCanvas(..., K)` sprites report their size in world units; 1x bitmaps are upscaled with Scale2x.
- `js/art.js` `drawPerson()` / `treeSprite()` / umbrellas / speech bubbles; `js/tet.js` `plantSprite()` for mai / kumquat / chrysanthemum pots and the waving flags.
- `js/city.js` `groundColor()` paints roads, gạch tàu pavements, grass and plazas at K; `index.html` holds the UI theme (wooden era sign, cream paper panels, Baloo 2).

## Controls
- Era plate (top left) or keys `[` `]`: 199x / 200x / 201x / 202x. The switch crossfades in place.
- Play / Space, prev / next, seasons (keys 1-4), "Tự đổi" auto seasons.
- "..." opens: YouTube playlist, time of day, weather, volumes, zoom, fullscreen, hide panel (H).
- Drag to pan, wheel to zoom, R = rain, N = night, T = Tết decorations, B = fly to the riverfront and back.
- "..." → Sự kiện / Event: Thường (none), Tết, 2/9, Halloween, Noel. Keys: T = Tết, Q = Quốc khánh 2/9, O = Halloween, X = Christmas (press again to switch off).
- Panel: "Âm phố" toggles and sets the volume of street sounds (bells, horns, engines, murmur), separate from music.

## Adding content per era
- `js/eras.js`: `ERA[]` holds the traffic mix, people mix, and helmet/phone/mask rates per era. Also the modern vehicles and towers (Bitexco, Landmark 81, Vincom, apartment tower).
- `js/build.js`: `ESTYLE[]` holds wall palettes, wear, roofs and sign style per era. `SHOPS` holds shop categories with per-era skins (`e: {2: {...}}`).
- `js/city.js`: `addB(gen, ..., {e0, e1})` places a building for eras e0..e1; `gen` may be `era => boxes`. `towerSite()` swaps low houses for a tower. `ERA_SWAP` swaps props (parked bikes, phone booth to ATM).
- `js/art.js`: `randLook()` people types; `VEH` vehicle models.

## Other files
`js/river.js` riverfront: river, promenade, Cầu Mống-style bridge, pier, boats, animated water, per-era paving overlay. `js/core.js` baker and maths, `js/landmarks.js` the seven historic landmarks, `js/sim.js` traffic and NPCs, `js/fx.js` weather and particles, `js/audio.js` built-in music, `js/yt.js` YouTube player, `js/main.js` renderer, camera, UI.

## Test URL parameters
`?tet=1&ev=qk|hw|xm&look=48,74&era=2&season=winter&time=night&wx=rain&zoom=1&pan=0,-60&warp=60&toera=3&clean=1&yt=<playlist url>`

## Riverfront (west edge of the map)
Tiles: far bank 0-5, river 5-20, quay/promenade 20-27, sidewalk 27-30, then the existing riverside road. Edit `genRiverfront()` in `js/river.js`; era variants live in `PROP.railA-D`, `PROP.lampA-D`, `pierBoxes(era)`, `bridgeBoxes(era)`, `BOAT_ERA` and `riverColor()`.

## Tết mode (T key / Tết button)
`js/tet.js` holds everything Tết-only: waving Vietnamese flags (every house roof, 7 landmark pairs, kerbs, promenade rails, bridge), bunting and banners across streets, big mai / kumquat / chrysanthemum pots, watermelon + flower stalls with vendors, shoppers carrying melons and melon delivery bikes/motos/trucks. All of it is gated on `G.tet` and vanishes when Tết is switched off (no reload).

## Night events (2/9, Halloween, Christmas)
`js/events.js` holds the three night-only events; `js/costumes.js` draws their costumes and accessories inside `drawPerson()`. Only one event runs at a time (Tết included). `EV.sel` is what the player picked, `EV.cur` what is on show: night events only appear after dark (`evNight()`, 18:42–05:12). Picking one in daytime switches the clock to night (the previous time setting comes back when the event is turned off); if the clock later reaches morning the event pauses and returns the next night.
- **Quốc khánh 2/9**: more flags than Tết (every Tết flag minus the stall poles, plus denser kerb flags, a flag at every door and lamp, a flag avenue on the promenade, denser rail and bridge flags, giant flags at the palace and on every landmark roof), flag-only bunting, red banners, star flower beds. 199x/200x: painted flag murals on exposed side walls (`walls()`); 201x/202x: animated LED façades on Bitexco, Vincom, Landmark 81 and the apartment towers (panels declared as `B.led` in `js/eras.js`). Fireworks (`FW`): eleven burst types including a gold-star-on-red shell, finale salvos, smoke, sky flashes, glints on glass towers, reflections on the river, booms/whistles/crackle. Double traffic and walkers, ~300 watchers in the park, palace lawn, promenade and plazas who cheer at big bursts; star T-shirts, hand flags, headbands, cheek stickers, flags on boats.
- **Halloween**: walkers in costume (ghost, witch, vampire, skeleton, pumpkin, monster, cat, mummy; fewer in the 90s), kids with glowing pumpkin buckets trick-or-treating door to door, carved jack-o'-lanterns at shops and cafés, pumpkin piles, inflatable ghosts (200x+), orange/purple lantern posts and light strings, purple grade with orange door glows, more bats, an occasional witch on a broom, owl / music-box ambience.
- **Giáng sinh**: a giant Christmas tree in the park (replacing the fountain for the night) plus smaller trees at the market, near Nhà thờ Đức Bà and on the promenade, reindeer light sculptures (201x+), a nativity grotto with carol singers by the church, stars over the church spires, star lanterns at doors, wreaths and gift piles, light strings across every street, along the river railing and bridge, around lamp posts, through tree canopies and along rooftops (warm white on landmarks; colour palettes change by era), Santa hats, a few Santas, sleigh bells and church bells.
All of it is planned once (`EV.plan()`) and gated on `EV.cur`; static props are `CITY.recs` flagged `ev`, costumes keep the original look in `L.evOrig` and are restored when the event ends.

`js/dance.js` adds the Tết performances in the park: three lions (red, yellow, white) with Ông Địa, drummers, cymbals and a gong, and a seven-person dragon chasing a pearl round a figure-of-eight, each surrounded by spectators (families, children, áo dài; smartphone recorders in the 201x/202x eras, cameras with flashes before). Lion and dragon alternate (30–60 s each, 14–24 s rest) and everything disappears when Tết is switched off. Click a lion and it turns to the viewer, blinks and bows; click the stage and the camera glides there. Drums, cymbals and gong are synthesised in WebAudio from one beat engine that also drives the hops, drummers' arms and dragon's mouth; they go through the street-ambience bus (volume slider and mute apply) and get quieter with camera distance. `?dance=lion|dragon` pins one performance for testing; `node tests/dance.mjs` checks it.

The default zoom starts about 17% wider than before (still a whole number of screen pixels per art pixel); manual zoom and panning are untouched.

## Tests
`tests/riverfront-turns.mjs` is a headless-browser check of the three riverside junctions (needs Playwright): `python3 -m http.server 8765 &` then `node tests/riverfront-turns.mjs [url] [screenshot-dir]`. It simulates 6 minutes of traffic and fails if a vehicle leaves the road / reaches the promenade, faces the wrong way, or any of the four turns (southbound left, northbound right, westbound left/right) never happens.

`tests/tet.mjs [screenshot-dir]` checks Tết ON/OFF in all four eras (flag per house, 14 landmark flags, 30+ melon stalls, vendors, shoppers, nothing left over when off), NPC path reachability, day/night/rain screenshots and frame time.

`tests/events.mjs [screenshot-dir]` checks every night event ON/OFF in all four eras (decorations, crowds, costumes, flags vs Tết, fireworks, murals / LED façades, double traffic, clean removal), night-only behaviour, UI buttons and keys, rain and riverfront views, sound scheduling and frame time.

## UI language (VI / EN)
The VI / EN toggle (top right) switches all interface text instantly, defaults to Vietnamese and is saved in `localStorage` (`saigonlofi-lang`). `js/i18n.js` holds the dictionaries: `UI` (keyed `[vi, en]` strings used by `data-i18n` / `data-i18n-attr` in `index.html` and by `t(key)`), and `MSG` (ticker and YouTube-status sentences, looked up by their Vietnamese source text via `tm()`). In-world text (shop signs, banners, landmarks) is never translated.
