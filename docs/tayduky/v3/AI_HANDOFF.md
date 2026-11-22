# AI handoff — Tây Du Ký UI v3

**Files**: `tayduky/index.html` (markup), `td-theme.css`, `td-ui.js`, `td-dragon.js`, `tw-main.js` (TWNAV), tests
`tests/tayduky-v3-ui.mjs` (behaviour, `--shots` for responsive shots) and `tests/tayduky-v3-ui-shots.mjs` (required screenshots +
comparisons), docs here, shots in `screenshots/ui/`.

**Reference used**: Holdfast markup/ids and `holdfast/hf-main.js` wiring (lines ~56-57, 298-305), `css/lofi-ui.css`, `js/dock.js`,
`js/audio.js`, `js/yt.js`, `js/i18n.js` — all loaded unchanged.

**Ported**: `LOCAL_LW` bridge + `dockInit`, `[data-lang]` handlers, `refreshDynamicText`, full-screen / hide (`body.clean`, `H`), Esc → menu.
Prefs key `saigonlofi` (shared) and `tayduky-time` (time mode).

**Navigation**: `window.TWNAV` (tw-main.js): `go(id, instant)` eases `TWR.cx/cy` (0.6-2.6 s, instant under reduced-motion) to
`START[id]` or `TWM.biomes[..].centre`; `setTime(mode)`; `zoomBy`; `biomeHere()`; `moving()`. Time clocks: morning 7.5, noon 12.5, dusk 18.2,
night 22, auto = the 480 s cycle. `?tod=` still accepted (`day` → noon).

**Dragon**: original code-painted art (td-dragon.js), no external asset. `TWDRAGON.s` (arc position) and `.draw(t)` are exposed for screenshots.

**Do not**: edit `js/`, `css/lofi-ui.css`, Saigon or Holdfast files; add weather UI; call navigation with `force`.
**Pre-existing failures**: `tayduky-v2-world.mjs` (3rd signature) and `tayduky-v2-sim.mjs` seed 7 — see STATUS.md.
