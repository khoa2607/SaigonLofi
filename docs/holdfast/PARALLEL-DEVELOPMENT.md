# Holdfast — Parallel Development (Claude Opus ∥ Codex)

Status: **setup only**. Gameplay and visuals were not changed by this setup. The Future timeline is **not started**.

## 1. Git branch structure

```
main                                  approved, integrated code (only the owner approves merges into it)
 ├─ feature/holdfast-future            Claude Opus   — the Future timeline
 └─ feature/holdfast-current-past      Codex         — Current + Past timelines
```

- Both feature branches are created from the **same commit**: `main` after the coordination documents (`AGENTS.md`, `CLAUDE.md` section, this file) were merged. That commit is recorded in §2.
- Neither agent merges into `main`, pushes to the other's branch, force-pushes, resets or rewrites pushed history. Other existing branches and untracked files are left alone.
- The earlier `design/holdfast-world` branch is gone (merged and deleted). The approved gameplay baseline is `2b375019637f554388c2c09e3e4f26d10d125f40` (Holdfast Current, Past, milestone 8.1).

## 2. Baseline

| | |
|---|---|
| Approved gameplay baseline | `2b375019637f554388c2c09e3e4f26d10d125f40` — "Holdfast M8.1: dinosaur corpse fix + seamless PAST <-> CURRENT switching" |
| Coordination commit (both branches start here) | see `git log --oneline -3 main`; the commit titled "Parallel development: AGENTS.md, CLAUDE.md section, PARALLEL-DEVELOPMENT.md". It differs from the baseline only in documentation. |

## 3. Responsibilities

| | **Claude Opus** — `feature/holdfast-future` | **Codex** — `feature/holdfast-current-past` |
|---|---|---|
| Owns | the entire Future timeline: futuristic architecture and environmental art, robots, drones and mechanical enemies, Future simulation and community activities, Future combat/defense/effects, Future audio, Future tests and docs; the minimal shared hooks needed for a third era | Current improvements/bugs, Past improvements/bugs, zombie and dinosaur artwork and animation, Current/Past NPC behaviour, work loops, community activities, combat, weather and environment, Current/Past tests and docs |
| Must not | change Current/Past behaviour unnecessarily; rewrite zombie or dinosaur systems; push to Codex's branch; merge to `main` without approval; alter SaigonLofi | develop or edit Future features or Future-owned files; push to Claude's branch; merge to `main` without approval; change SaigonLofi; remove or rewrite shared engine code without need |
| Instructions | `CLAUDE.md` | `AGENTS.md` |

## 4. File ownership matrix

Legend: **F** = Future owner (Claude), **CP** = Current/Past owner (Codex), **S** = shared (no exclusive owner; §5 rules), **SG** = Saigon/platform (nobody changes it for Holdfast work), **new** = does not exist yet.

### Source (`holdfast/`)

| File | Role | Owner | Notes |
|---|---|---|---|
| `hf-past.js`, `hf-past-art.js` | Past simulation + art | **CP** | Claude must not edit |
| `zombie.webp` | zombie archetype reference | **CP** | |
| `hf-future.js`, `hf-future-art.js`, other `hf-future-*.js`, Future assets | Future simulation + art | **F** (*new*) | Codex must not create or edit |
| `hf-art.js` | Current models/props/looks; Past/Future **dispatch lines** (`if (HF.era === …) return …`) | **S** — Current parts: CP; dispatch lines: F may add a `'future'` line | Claude: add only the three-era dispatch line per function; Codex: Current art freely, leave dispatch structure alone |
| `hf-map.js` | valley, layout, nav grid, flow fields, `SL` slicing | **S** | The layout is approved and shared by all eras; only add era map passes (like `pastMap()`) behind `HF.era`; `hfBuildMapG` era normalisation is an F integration point |
| `hf-sim.js` | settlers, infected/dinosaur array `HS.zombies`, combat, director, expeditions, death lifecycle | **S** | Core engine; Current/Past tuning: CP; Future needs hooks (era enemy factory, sound/shoot dispatch) added by F with the existing `HF.era` pattern |
| `hf-work.js`, `hf-life.js` | work loops, community zones | **S** (used by all eras; behaviour changes: CP; Future-specific loops: F in a new module) | |
| `hf-render.js` | ground, statics, actors, fx, lighting, weather, preparation generators | **S** | Current/Past drawing: CP (`dinoDraw`, `actorDraw`…); Future drawing in a new function/module called from a dispatch line (F) |
| `hf-world.js` | world contexts, preparation, activation | **S — high risk** | F extends it for the third era (§5.3); CP should not edit it |
| `hf-main.js` | boot, loop, UI wiring, era transitions, journal text | **S — high risk** | F: third-era tab, `ERA_ARIA`, text tables; CP: Current/Past journal text and non-era UI only |
| `hf-audio.js` | synthesised sound | **S** | Past sounds: CP (`haPast`); Future sounds in a new `haFuture` (F) |
| `index.html`, `hf-theme.css` | page markup, script tags, theme | **S — high risk** | F: Future tab + script tags; CP: none expected |
| `hf-future*.js` | see above | **F** | |

### Tests (`tests/`)

| File | Owner |
|---|---|
| `holdfast-past.mjs`, `holdfast-m7.mjs`, `holdfast-community.mjs`, `holdfast-life.mjs`, `holdfast-corpse.mjs`, `holdfast-sim.mjs`, `holdfast-warm.mjs`, `holdfast-diag.mjs`, `holdfast-mapdump.mjs` | **CP** (may be extended; F may add a three-era variant only through an *additional* file) |
| `holdfast-world.mjs`, `holdfast-transition.mjs`, `holdfast-browser.mjs`, `holdfast-flow.mjs`, `holdfast-bench.mjs`, `holdfast-probe.html`, `hf-load.mjs`, `cdp.mjs`, `ui-snapshot.mjs` | **S** (extend with new checks; never weaken an existing check) |
| `holdfast-future*.mjs` | **F** (*new*) |
| `tet.mjs`, `dance.mjs`, `events.mjs`, `riverfront-turns.mjs` | **SG** (Saigon; need `playwright`) |

### Documents

| File | Owner |
|---|---|
| `AGENTS.md` | CP-facing; edits by CP for Current/Past guidance; F edits only to keep it consistent with this file |
| `CLAUDE.md` | F-facing; edits by F; CP edits only to keep it consistent with this file |
| `docs/holdfast/PARALLEL-DEVELOPMENT.md` | **S**; changes only with the owner's agreement (it is the contract) |
| `docs/holdfast/STATUS.md` | **CP** sections (Current/Past milestones); F must not edit it |
| `docs/holdfast/FUTURE-STATUS.md`, `FUTURE-DESIGN.md`, `screenshots/future-*` | **F** (*new*) |
| `docs/holdfast/HOLDFAST-DESIGN.md`, `PAST-DESIGN.md` | CP (PAST-DESIGN), design doc by the owner's request |
| `docs/holdfast/shared-changes/current-past.md` / `future.md` | one log per agent (§5.4) |
| `docs/holdfast/screenshots/` | curated; each agent adds files with its own prefix (`future-…` vs the existing names) and never replaces the other's |

### Everything else

`js/*.js`, `css/lofi-ui.css`, root `index.html`, `README.md` (Saigon/gallery/platform), `docs/main-menu/`: **SG** — not changed by either agent for Holdfast work (the gallery card for a third era needs no change; the card opens the Holdfast frame).

## 5. Shared-code change policy

### 5.1 Modules shared between timelines (inspected in the repository)

`hf-map.js` (one valley for all eras), `hf-sim.js` (one entity array and director), `hf-work.js` and `hf-life.js` (work/community loops), `hf-render.js` (one renderer, one ground painter, `HR_WORLD_KEYS`),
`hf-world.js` (contexts), `hf-main.js` (one loop, one UI), `hf-audio.js` (one sound engine), `hf-art.js` (era dispatch), `holdfast/index.html`, `hf-theme.css`, and the platform files in `js/`.
Era-specific modules today: `hf-past.js`, `hf-past-art.js`. Current-specific code lives *inside* shared files (zombies, suburban art) behind absence of a Past/Future branch.

### 5.2 Rules

1. Neither agent has exclusive ownership of shared code.
2. Changes to shared code must be **minimal, isolated and backward-compatible**: a Current or Past run must produce the same random sequence and the same results as before (`holdfast-past.mjs`, `holdfast-sim.mjs` and the determinism checks verify it).
3. Prefer **era-specific modules and adapters** over editing the shared engine: add a function in your own file and one dispatch line in the shared file.
4. Every shared-code change ships with regression tests for **all affected eras** (minimum: `holdfast-sim`, `holdfast-past`, `holdfast-corpse`, `holdfast-world`, `holdfast-transition`; plus the matching Future test for F's changes).
5. Each agent records shared-code changes in **its own** log (`docs/holdfast/shared-changes/<agent>.md`: file, function, why, what could conflict) so logs never merge-conflict.
6. Never automatically merge, rebase onto, or overwrite the other agent's branch. To inspect it: `git fetch` + read-only `git diff main...origin/<other-branch>`.
7. Avoid simultaneous edits to the same shared integration point: before touching one (§5.3), look at the other branch's diff and, if it is already changed there, prefer a different approach or ask the owner.
8. Branch isolation is not merge safety. Two branches that each pass their tests can still conflict textually or semantically; §7 describes how that is handled.

### 5.3 Known integration points (highest conflict risk) and who touches them

| Integration point | File | Why it matters | Who |
|---|---|---|---|
| era normalisation `HF.era = era === 'past' ? 'past' : 'current'` | `hf-map.js` (`hfBuildMapG`) | a third era must be accepted | **F** (one-line, backward-compatible) |
| binary era checks `HF.era === 'past'` with an implicit "else = current" | `hf-art.js`, `hf-render.js`, `hf-sim.js`, `hf-life.js`, `hf-audio.js`, `hf-main.js` | in `'future'` the "else" branch would silently run **Current** code | **F** adds explicit `'future'` branches *before* the fall-through; **CP** keeps the existing pattern and must not reorder these lines |
| `bakeCached` key = `HF.era + '|' + key` | `hf-render.js` | already era-safe; do not change | nobody |
| `hwPrepare`, `HW_ENV`, `hwPrepareG`, `hwNew`, `hwActivate` | `hf-world.js` | a third context, an N-way fade | **F** (CP does not edit) |
| `hfSwitchEra`, `hfApplyEraUI`, `ERA_ARIA`, `hfTransitions`, `hfFadeTo`, the `#eras` markup, `hfUI` tab state | `hf-main.js`, `index.html` | the Future tab is currently `aria-disabled`; two eras assumed (`'past'`/`'current'`) | **F** |
| script list (add `hf-future*.js`) | `holdfast/index.html` | | **F** |
| `LOGT` / `LOGT_P` journal text, `POIN`/`LOOT` tables | `hf-main.js` | per-era wording | CP: Current/Past entries; F: a separate `LOGT_F` table |
| `PROPS`/`PPROPS` model tables and `suburbHouse`/`civicModel` dispatch | `hf-art.js`, `hf-past-art.js` | art per era | CP edits its two; F adds `FPROPS` in its own file |
| `HR_WORLD_KEYS` / `hrNewWorld` | `hf-render.js` | new per-world renderer state must be listed or two worlds will share it | whoever adds per-world render state (add the key; test with `holdfast-world`/`holdfast-transition`) |
| `STATUS.md` | docs | edited by one agent only (CP) | CP |

### 5.4 Shared-change log
`docs/holdfast/shared-changes/current-past.md` (Codex) and `docs/holdfast/shared-changes/future.md` (Claude): append a short entry per shared-code change.

## 6. Test requirements

- Run before every commit that changes behaviour; list what ran in the commit message or the status doc. Commands: `AGENTS.md` §6 / `CLAUDE.md` Tests table.
- Minimum for any change: the era's own suite(s) plus, **for shared code**, `holdfast-sim 3600`, `holdfast-past`, `holdfast-corpse`, `holdfast-world`, `holdfast-transition` (and `holdfast-browser`/`holdfast-flow` when UI or boot changed).
- New behaviour = a deterministic Node test or a measured number. Visual changes = a screenshot at 1:1 and 3× plus a statement of what was **not** verified (motion, sound, real GPU, phone).
- Performance: `holdfast-bench` before/after for render or sim changes; no claim of a target without a measurement.
- A test may be **extended**; never weakened or deleted to make a change pass. A failing existing test is reported with its output, not silenced.
- Future: `tests/holdfast-future*.mjs` (map identity with the other eras, art coverage, behaviour, determinism, and a **three-era switching test** extending `holdfast-world`/`holdfast-transition` as additional files).

## 7. Integration strategy (how work reaches `main`)

1. **Only the owner (the human user) approves merges into `main`.** Agents propose; they do not merge.
2. When the owner asks to integrate a branch: run that branch's full test list; merge it into `main` (normally fast-forward or a merge commit; never force-push).
3. The second branch to be integrated **first merges the updated `main` into itself**, resolves conflicts there (§8), runs the **full test list for all eras** (including the other agent's tests), and only then is merged into `main`.
4. After an integration both agents `git fetch` and merge `main` into their branch before continuing, so shared code never drifts.
5. Shared-code changes may be proposed for early integration (a small PR-like branch from `main`, reviewed by the owner) when the other agent depends on them; do not cherry-pick between feature branches without the owner's say.

## 8. Conflict-resolution rules

1. Resolve conflicts on the branch being brought up to date (never on `main`, never by editing the other agent's branch).
2. **Keep both behaviours.** Textual conflicts in shared files: keep the union of both sides' era branches; the Current and Past results must stay identical to their baseline, and Future must stay isolated behind `HF.era === 'future'`.
3. Semantic conflicts (both sides changed the same function's meaning): stop and ask the owner; document the decision in the shared-change log.
4. After resolving: run the full test list; fix the failures that the merge caused rather than loosening tests.
5. Docs: `STATUS.md` is edited by Codex only and `FUTURE-STATUS.md` by Claude only, so they should not conflict; if they do, keep both sections.
6. Never `git reset --hard`, `git push --force`, or delete a branch that the other agent uses.

## 9. Handoff checklists

**Before starting a session (both agents)**
- [ ] `git fetch origin`; confirm the current branch is your own; `git status` is understood (leave untracked files alone).
- [ ] Read `STATUS.md` (or `FUTURE-STATUS.md`), this file's §4–§5 and the other agent's shared-change log for conflicts with what you will touch.
- [ ] If `main` moved (owner-approved integration), merge `main` into your branch and run the full test list first.

**Before every commit**
- [ ] Only files you own, or minimal shared-code changes logged in your shared-change log.
- [ ] Tests from §6 run and results recorded; no existing test weakened.
- [ ] No Saigon files, no generated output, no secrets.

**Before handing work to the owner (end of a milestone)**
- [ ] Branch pushed; commit SHA reported.
- [ ] Status doc updated (Codex: `STATUS.md`; Claude: `FUTURE-STATUS.md`): what exists, tests run and results, measurements, honest limitations.
- [ ] Shared-code changes listed with the conflicts they might cause for the other branch.
- [ ] Nothing merged into `main` and nothing pushed to the other agent's branch.
