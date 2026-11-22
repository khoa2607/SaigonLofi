# Tây Du Ký — UI design (v3)

## Reference
The UI is the **Lofi Worlds shared UI** used by SaigonLofi and Holdfast, re-skinned. Nothing in `js/` or `css/lofi-ui.css`
was edited: Tây Du Ký loads them unchanged and adds `tayduky/td-theme.css` (palette + navigator + dragon layer),
`td-ui.js` (wiring) and `td-dragon.js` (border dragon). Comparison shots at 1600×900:
`screenshots/ui/compare-1-saigonlofi.png`, `compare-2-holdfast.png`, `compare-3-tayduky.png`.

## Layout (same as Saigon/Holdfast)
- Top-left: `Lofi Worlds` back button (Esc), then the plate with the **biome navigator** and the info card (current place, clock).
- Top-right: VI / EN toggle.
- Bottom-centre dock: play/pause, track name + counter + level meter, previous/next, "more" (panel); time row
  Tự chạy / Sáng / Trưa / Chiều tà / Đêm. Panel: YouTube playlist box, music/ambience/vinyl volume, zoom out/in, fullscreen,
  hide panels, place-name card toggle. The shared "street sound" row is kept in the markup but hidden (not used here).
- Centre-top: the place-name card shown on arrival (existing behaviour).
- **No weather UI.**

## Palette (td-theme.css variables)
jade `#1f7a63`, deep emerald `#123a32/#174a3c`, antique gold `#e0b040`, imperial red `#b3261e`, warm ivory `#f1e8cf`,
dark bronze `#3d2a16`. Plates are emerald with gold borders; buttons ivory with bronze text; active = imperial red.

## Biome navigator
15 buttons in a 5×3 grid, order HQS TC BTP NHS CLT BCL HPS BTD HDS TTH LAT NTQ HVD LHD SDL. The abbreviation is on the button;
the full Vietnamese/English name appears on hover/focus (tooltip, and the native `title`/`aria-label`). Hover, focus-visible,
pressed and the **active** state (red + gold ring, `aria-current`) are styled. The active biome follows the camera (polled every
400 ms from the biome under the view centre), so dragging the map also moves the highlight. A small gold dot marks a biome whose
story loop is running.

## Dragon
Code-painted pixel-art dragon (no PixelLab credits; the balance was ~1.65). A 1/3-resolution canvas (1/2 on phones) is scaled
with `image-rendering: pixelated`. 96 body segments follow a clockwise rounded-rectangle path inset ~36 px from the window edge,
with a travelling sine wave; outline-then-fill discs, jade/emerald banding, ivory belly stripe, red/gold dorsal spines, two
gold-clawed limbs, a tail tuft, antler horns, red eye (gold at night), animated whiskers and a glowing pearl ahead of the jaws.
`pointer-events:none`, `z-index:1` (panels are `z-index:3`), hidden with the panels (`body.clean`), paused when the tab is hidden,
a single still frame under `prefers-reduced-motion`.

## Responsive
Tested at 1920×1080, 1600×900, 1366×768, 1280×720, 820×1180 (tablet), 390×844 (phone): no horizontal overflow; the dock and
navigator compact at ≤700 px and ≤480 px (td-theme.css). Shots: `ui-responsive-*.png`.

## Accessibility
Real `<button>`s with labels, `aria-pressed`/`aria-current`, visible focus, tooltip on focus, reduced-motion rules for the card,
tooltip, camera tween (instant jump) and dragon (still).
