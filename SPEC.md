# SPEC — Beach Game Optimization (海灘遊戲優化)

**Date:** 2026-06-15
**Status:** Draft — awaiting approval before implementation
**Component:** The `beach` clean-up scene of *Haenyeo Village Life*
 — `haenyeo/game.js` (beach logic) + `haenyeo/render-atashinchi.js` (`drawBeach`) + `haenyeo/index.html` (HUD)
**Supersedes / builds on:** [docs/SPEC-clean-shore-beach-overhaul.md](docs/SPEC-clean-shore-beach-overhaul.md) (the implemented "Clean Shore, Living Sea" loop)

---

## 1. Objective

Make the beach clean-up scene **more fun, better balanced, and smoother** — without losing its conservation soul. Three axes, chosen by the owner:

1. **Gameplay depth & fun** — more meaningful choices, light progression, and session-to-session variety so cleaning the shore stays engaging beyond the first few plays.
2. **Difficulty & balance** — a readable, fair, gently-ramping curve; all the magic numbers tuned from one place.
3. **Performance & smoothness** — steady frame rate and bounded memory, especially on mid-range phones.

**Scope of change:** free to **refactor code and redesign mechanics** where it clearly helps — but the loop's identity and theme are preserved (see Boundaries).

**Target users:** casual, all-ages players on **mobile + desktop**; a meaningful slice are learners/kids. Depth must stay approachable, balance forgiving, and the educational facts intact and non-blocking.

### Locked decisions
| Decision | Choice |
|---|---|
| Optimize for | Fun/depth · Balance · Performance (not a mobile-UX pass this round) |
| Change latitude | May refactor and redesign mechanics |
| Preserve | Conservation theme, cute flat canvas style, collect→sort→rescue loop, tide pressure, beach-health → dive coupling, educational facts |

---

## 2. Current state (what we're optimizing)

- **Loop:** walk the sand → grab litter (recycles on pickup; combo + value-by-distance) → free a ghost-net animal (hold-to-cut, look-back moment) → tide rises (`tideLineY()`) → at `bTime<=0` go to the 분리수거 sorting screen → result; `G.beachHealth` (0–100) feeds dive richness.
- **State (game.js):** `bLitter, bParts, bFloats, bRings, bCombo/bComboT, bSpotlessCd, bTime/bTimeMax, beachCatch, bBagCount`, `BEACH_ITEMS`, `RECYCLE_BINS`, `G.beachHealth/eco`.
- **Render (render-atashinchi.js):** `drawBeach` (health-lerped palette, foam, wildlife, overlays), `drawLitter`, `drawBeachRescue`, `drawBeachCrab`, `drawGull`, `drawWeather`.
- **Known issues / smells:**
  - Magic numbers for balance are scattered across `startBeachClean`, `updateBeach`, `placeLitter`, `pickBin`, the rescue block.
  - `drawBeach` redraws **static** layers every frame (seeded sand speckle, shells, dune grass) alongside dynamic ones.
  - Particle/float/ring arrays are unbounded in principle (push without cap) → allocation churn.
  - Difficulty is flat day-to-day; little explicit progression or per-session variety.

---

## 3. Requirements & acceptance criteria

### A · Gameplay depth & fun
- **A1 — Beach gear upgrades.** At least one purchasable upgrade that changes a beach metric (e.g. **bigger bag** `BEACH_BAG`, **faster net-cut** `cutMax`, **sturdier collection**). Bought at the existing gear shop; persists across days.
  - *AC:* buying an upgrade measurably changes the relevant value next session; reflected in the HUD/behavior; cost deducted.
- **A2 — A daily goal.** One lightweight, optional objective per session (e.g. "free 1 animal", "sort ≥90% correct", "reach Thriving", "bank N eco"), shown at session start and rewarded once on completion.
  - *AC:* goal text appears at start; completion grants a one-time bonus + toast; never blocks play.
- **A3 — Session variety.** ≥3 distinct session modifiers driven by existing state (`G.weather`, `G.beachHealth`, day) — e.g. storm-surge debris wave, a rare "message in a bottle" find, a calm sunny "wildlife day" with an extra rescue.
  - *AC:* each modifier is observable and only fires under its condition; documented.
- **A4 — Visible long arc.** Beach-health and rescued-animal memory remain the persistent reward (already partly true); make progress legible across sessions (e.g. a small "shore restored" milestone).
  - *AC:* a returning player can see their cumulative impact.

### B · Difficulty & balance
- **B1 — One tuning table.** Consolidate every beach magic number into a single `BEACH_TUNING` object (tide length, bag size, value-by-distance curve, combo scaling, eco/won rates, beach-health gain-per-pickup & overnight drift, rescue chance, dive-coupling strength).
  - *AC:* no duplicated literals remain in the beach code; changing one field visibly changes behavior; documented inline.
- **B2 — Gentle curve.** Early days are comfortably completable (more time / less debris); difficulty ramps slowly with day count and falling beach-health.
  - *AC:* day 1 finishable without stress; later/neglected-shore sessions are denser; curve defined in `BEACH_TUNING`.
- **B3 — Fair, legible rewards.** Combo/risk/streak bonuses enhance without trivializing or punishing; no exploit (e.g. unbounded combo farming).
  - *AC:* a full clean session's eco/won/health totals fall within a defined range; a scripted sim confirms no runaway values.

### C · Performance & smoothness
- **C1 — Cache static layers.** Render the seeded-static beach layers (sand speckle, idle shells, dune grass) **once** to an offscreen canvas; per frame, blit the cache + draw only dynamic layers (waves, foam, litter, wildlife, player, weather, overlays).
  - *AC:* visual output unchanged; measured per-frame draw cost reduced.
- **C2 — Bound & pool effects.** Cap `bParts/bFloats/bRings` (and dive particles) to sane maxima; reuse rather than reallocate where hot.
  - *AC:* arrays never exceed their caps; no growth over a long session; no GC sawtooth in a profile.
- **C3 — Frame budget.** Target **60 fps desktop / ≥30 fps mid-mobile** across a 30 s beach session, including tide-rise and a rescue.
  - *AC:* frame-timing harness reports average frame time within budget; no visible jank.
- **C4 — No correctness regressions** from the above (collect/sort/rescue/tide/dive coupling intact).

---

## 4. Commands (run & verify)

```bash
# Run locally (freshest; bump ?v= on edited scripts so the browser reloads them)
cd haenyeo && python3 -m http.server 8770   # open http://localhost:8770/  → village → "Clean the beach"

# Syntax check after edits
node --check haenyeo/game.js
node --check haenyeo/render-atashinchi.js

# Headless behavior/visual verify (puppeteer-core drives the installed Chrome)
#   drive scene='beach', set G.beachHealth / bTime / state, assert + screenshot
node _verify_*.mjs        # scratch scripts, gitignored

# Performance: Chrome DevTools Performance panel, or a performance.now() frame-timing
#   loop asserting avg frame time + array-length caps over N seconds.
```

> Cache-busting: every edited script is referenced as `...js?v=N` in `index.html`; **bump N** on each change or Pages/browser serves stale code.

---

## 5. Project structure (relevant files)

```
haenyeo/
  game.js               # beach logic — startBeachClean, updateBeach, tideLineY, placeLitter,
                        #   endBeach, renderSortItem/pickBin/showBeachResult, BEACH_ITEMS,
                        #   RECYCLE_BINS, beach state vars  → ADD: BEACH_TUNING, goals, upgrades
  render-atashinchi.js  # drawBeach + drawLitter/drawBeachRescue/drawBeachCrab/drawGull/drawWeather
                        #   → ADD: cached static-layer offscreen canvas
  index.html            # #beachHud (bag/tide/shoreFill), #pSort, #pBeach, CSS, script ?v= versions
docs/
  SPEC-clean-shore-beach-overhaul.md   # the prior implemented spec (reference)
```

New code stays in these files (no module system / build step). Group beach logic together; introduce `BEACH_TUNING` near the other beach constants.

---

## 6. Code style

- **Vanilla JS, no dependencies, no build.** Match the existing terse, comment-rich canvas style; flat cartoon palette via `MIN` + `lerpHex`; helpers `inked/rr/fillStroke`.
- Balance constants live in **`BEACH_TUNING`** (no scattered literals).
- Keep the **cute flat** look; new visuals reuse existing motifs and palette.
- **Bilingual UI** stays consistent (Korean term + English), per the localization convention.
- Bump `?v=` cache-bust on every edited script. Commit per logical change with the project's trailer.

---

## 7. Testing strategy

- **Per change:** `node --check` both files; headless puppeteer drive + screenshot for any visual; assert state transitions (combo build/reset, tide rise, beach-health, sorting tally, upgrade effect).
- **Balance (B):** a scripted full-session simulation that drives a clean run and asserts eco/won/health totals fall within the defined range and no value runs away.
- **Performance (C):** a frame-timing harness over ~30 s asserting average frame time within budget and that `bParts/bFloats/bRings` stay ≤ their caps; confirm the cached static layer is pixel-identical to the live-drawn version.
- **Regression:** after any refactor, replay a session to confirm collect / sort / rescue / tide / dive-coupling all still work; dive spawn/catch/breath untouched.

---

## 8. Boundaries

**Always**
- Preserve the conservation theme and the educational facts (kept lightweight, optional, non-blocking).
- Keep the cute flat canvas art style and bilingual UI.
- Keep it playable on mobile **and** desktop.
- Bump cache-bust versions; verify (syntax + headless) before committing; commit per logical change.

**Ask first**
- Removing or fundamentally changing an existing mechanic (collect / sort / rescue / tide / dive coupling).
- Changing the art style or the overall scene layout.
- Adding persistence beyond the current `G` state (e.g. `localStorage` saves) or new external assets.
- Overwriting prior spec/history.

**Never**
- Break the dive's spawn / catch / breath logic (the beach feeds the dive; it must not destabilize it).
- Introduce a build step, framework, or runtime dependency.
- Make educational content block play, or regress HUD readability.
- Hardcode secrets or call external services.

---

## 9. Suggested phasing (for the plan step, not yet approved)

1. **Refactor + `BEACH_TUNING`** (B1) — consolidate constants; no behavior change. Safe base for the rest.
2. **Performance** (C1–C3) — cache static layers, cap effect arrays, verify fps. Low gameplay risk.
3. **Balance curve** (B2–B3) — tune via the new table; sim-test totals.
4. **Depth & fun** (A1–A4) — upgrades → daily goal → session variety → long-arc milestone, each shippable on its own.

Each phase is independently committable and verifiable.
