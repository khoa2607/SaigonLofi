# Tây Du Ký — world access card (Phase 2)

**Where**: the Lofi Worlds gallery (`index.html` + `js/menu.js`). A card is `WORLDS` entry + a `SCENES[id](g, t)` painter that draws a
96x96 pixel postcard on a canvas (shown 300x300, nearest-neighbour). The new card is `{ id: 'tayduky', live: true }` appended after
Holdfast, with `SCENES.tayduky`, strings `w.tayduky` / `w.tayduky.d` (VI/EN) and a click branch in `menuEnter`. Size, border, hover lift,
"Đang mở" badge, "Vào thế giới →" chip, focus ring, zoom-in transition and the mobile layout are the shared card CSS, unchanged.

**Art** (all code-drawn, same pattern as Saigon's card; 0 PixelLab generations): sunset sky with ordered dither, setting sun, two
layers of lavender mountains, a pagoda on the far peak, a small waterfall, a drifting cloud sea, a pine in the foreground and a ridge
path that rises to the right. Four pilgrims walk right; order left -> right **Sa Tăng** (blue-grey face, red hair, luggage, crescent
spade) -> **Bát Giới** (round, pink, rake) -> **Đường Tăng** (gold hat, red cassock, on a white horse) -> **Tôn Ngộ Không** (headband,
pheasant plumes, golden staff) at the far right, leading. Each has a dark outline pass so they read at 96 px.

**Animation**: the gallery loop already redraws live cards every 80 ms; walking is a 4-step cycle (3.5 steps/s) with a small per-character
phase offset, legs lift and bodies bob, the horse's diagonal legs alternate, clouds, waterfall, grass and mist drift. Characters never
change x (they walk in place), so order cannot change. Only runs while the gallery is open (existing behaviour). **Reduced motion**:
`MENU.still` keeps the first painted frame (static fallback).

**Click**: opens `tayduky/index.html` (a separate page). Limitation: the page navigation restarts the lofi radio (Saigon/Holdfast keep
it playing through the gallery's shared page/iframe); volumes, track and language are shared through localStorage, and Esc / the
back button returns to the gallery.

**Not touched**: Saigon and Holdfast cards/code, the dragon art, the 15-button navigator.

## Tests (`node tests/tayduky-v3-card.mjs [--shots]`) — ALL PASS
7 cards (first six unchanged and in the same order), native `<button>`, title, order Sha < Bajie < Tang < Wukong in 8 animation phases
(colour-signature centroids), no drift/teleport, animation changes frames, reduced-motion still frame, click opens `tayduky/index.html`,
square card + no overflow at 1920/1366/820/390, no JS errors, no 4xx. `tests/tayduky-v3-ui.mjs` (dragon UI + 15 buttons) still ALL PASS.
Shots: `screenshots/card/` (`card-art-full`, `card-normal-size`, `card-closeup-travelers`, `card-animation-frames`, `gallery-*`).
