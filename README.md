# Sài Gòn qua năm tháng (testFableLofi)

An isometric Saigon street corner that changes through four eras (199x, 200x, 201x, 202x), with seasons, weather, time of day and lofi music.

- Open `index.html` directly for everything except YouTube.
- For YouTube playlists run `serve.bat` (or `python -m http.server 8765`) and open http://localhost:8765/ because YouTube refuses embeds on `file://` pages.
- All art is drawn by code at load time. Style reference: `web-lofi3.png`.

## Controls
- Era plate (top left) or keys `[` `]`: 199x / 200x / 201x / 202x. The switch crossfades in place.
- Play / Space, prev / next, seasons (keys 1-4), "Tự đổi" auto seasons.
- "..." opens: YouTube playlist, time of day, weather, volumes, zoom, fullscreen, hide panel (H).
- Drag to pan, wheel to zoom, R = rain, N = night, T = Tết decorations, B = fly to the riverfront and back.
- Panel: "Âm phố" toggles and sets the volume of street sounds (bells, horns, engines, murmur), separate from music.

## Adding content per era
- `js/eras.js`: `ERA[]` holds the traffic mix, people mix, and helmet/phone/mask rates per era. Also the modern vehicles and towers (Bitexco, Landmark 81, Vincom, apartment tower).
- `js/build.js`: `ESTYLE[]` holds wall palettes, wear, roofs and sign style per era. `SHOPS` holds shop categories with per-era skins (`e: {2: {...}}`).
- `js/city.js`: `addB(gen, ..., {e0, e1})` places a building for eras e0..e1; `gen` may be `era => boxes`. `towerSite()` swaps low houses for a tower. `ERA_SWAP` swaps props (parked bikes, phone booth to ATM).
- `js/art.js`: `randLook()` people types; `VEH` vehicle models.

## Other files
`js/river.js` riverfront: river, promenade, Cầu Mống-style bridge, pier, boats, animated water, per-era paving overlay. `js/core.js` baker and maths, `js/landmarks.js` the seven historic landmarks, `js/sim.js` traffic and NPCs, `js/fx.js` weather and particles, `js/audio.js` built-in music, `js/yt.js` YouTube player, `js/main.js` renderer, camera, UI.

## Test URL parameters
`?tet=1&look=48,74&era=2&season=winter&time=night&wx=rain&zoom=1&pan=0,-60&warp=60&toera=3&clean=1&yt=<playlist url>`

## Riverfront (west edge of the map)
Tiles: far bank 0-5, river 5-20, quay/promenade 20-27, sidewalk 27-30, then the existing riverside road. Edit `genRiverfront()` in `js/river.js`; era variants live in `PROP.railA-D`, `PROP.lampA-D`, `pierBoxes(era)`, `bridgeBoxes(era)`, `BOAT_ERA` and `riverColor()`.
