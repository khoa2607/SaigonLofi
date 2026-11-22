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

## Dragon (static artwork, Checkpoint A)
The earlier animated, code-painted creature (it read as a centipede) was **deleted** (`td-dragon.js`, its canvas, CSS and loop).
The frame is now the supplied Reference A (`reference/ref-a-dragon-ui.png`), processed by `tayduky/art/build-dragon-frame.py`:
white paper -> transparent (including enclosed pockets), edge pixels un-matted from white (no halo), and the plaque interior
(green board, baked title and buttons) knocked out so the frame, dragon, clouds, mountains, pagoda and sunset remain as one
static `art/dragon-frame.webp` (1000x637, lossless alpha). It is an `<img id="deco">` drawn above the controls with
`pointer-events:none`; the real emerald board (`#eras`), title and 15 buttons are DOM and sit under its transparent window.
All geometry is in units of the art width (`--u`), so it scales as one piece (560-620 px on desktop, full width minus 16 px on phones).
No animation of any kind. 0 PixelLab generations.

## Responsive
Tested at 1920×1080, 1600×900, 1366×768, 1280×720, 820×1180 (tablet), 390×844 (phone): no horizontal overflow; the dock and
navigator compact at ≤700 px and ≤480 px (td-theme.css). Shots: `ui-responsive-*.png`.

## Accessibility
Real `<button>`s with labels, `aria-pressed`/`aria-current`, visible focus, tooltip on focus, reduced-motion rules for the card,
tooltip, camera tween (instant jump) and dragon (still).

## Compact polish (after Checkpoint A)
Saigon is the density standard (its plate: 10.5px caption, ~52x36 era buttons). The frame is now 400px wide (340px on phones), the
title is 10.5px / 1.4px tracking (8.5px on phones) and the 15 labels are 12.5px (11px on phones) in 5x3 buttons of about 46x28px with
4-5px gaps. The artwork file is unchanged (`a447fc2`); only its scale/position and the DOM typography changed.
Before/after/Saigon shots at 1920x1080, 1366x768, 820x1180, 390x844: `screenshots/ui/polish/`.
