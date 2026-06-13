# SPEC — Beach Clean-up Overhaul: "Clean Shore, Living Sea"

**Date:** 2026-06-13
**Status:** Implemented (all 5 phases; verified via Node harness — underwater entanglement deferred to keep the dive stable)
**Component:** The `beach` scene of *Haenyeo Village Life* (`haenyeo/game.js`, renderer `haenyeo/render-atashinchi.js`)
**Related:** [docs/superpowers/specs/2026-06-12-dave-the-diver-redesign-design.md](docs/superpowers/specs/2026-06-12-dave-the-diver-redesign-design.md) (dive + kitchen loop this couples into)

---

## 1. Objective

Turn the beach clean-up from a flat "grab litter → sell for won" loop into a **conservation loop that teaches and that visibly improves your diving**. Three goals, all required:

- **More fun** — a ghost-net **wildlife-rescue** mechanic as the headline, plus a 분리수거 **sorting** skill layer and dynamic tide/weather debris.
- **More educational** — cover all four: (a) Jeju/haenyeo marine-debris reality, (b) Korea's 분리수거 recycling system, (c) marine-life harm (entanglement, microplastics), (d) real climate/ocean facts.
- **More real** — authentic Jeju debris types and a **beach-health meter that feeds the dive**: a clean shore makes the sea richer; a neglected shore thins the catch. Conservation becomes a *mechanic*, not a lecture.

**Target users:** players of the existing game — casual, all-ages, mobile + desktop; a meaningful slice are learners/kids, so the educational content must be lightweight, optional to read, and never block play.

### Locked design decisions
| Decision | Choice |
|---|---|
| Educational scope | All four lessons |
| Headline mechanic | Ghost-net wildlife rescue |
| Dive coupling | Beach health → dives, **moderate** strength (clearly felt, never blocks progress) |
| Sorting flow | **End-of-session sorting screen** (collect freely, then sort) |
| Overall scope | Full overhaul, delivered in phases |
| Rescue interaction | Hold-to-cut with a progress ring (consistent with the existing dig mechanic) |

---

## 2. Current State (what we're changing)

- Scene `'beach'`, entered via `startBeachClean()` (`game.js:1593`), drawn by `drawBeach()` in the renderer.
- Walk the sand (`BEACH_AREA` `game.js:1577`), collect from `bLitter`; `BEACH_BAG=12` capacity, `bTimeMax=46`s tide timer.
- `BEACH_ITEMS` (`game.js:284`): generic items (styrofoam, bag, PET, can, ghost net, glass, sea glass, brass weight, coin, taewak) with a flat `value` and a `treasure`/`buried` flag.
- `endBeach()` (`game.js:1643`) banks into `G.trash`; sold flat at the co-op (`game.js:717`).
- **No** learning, sorting, consequence, persistence, or wildlife.

---

## 3. Design — the new loop

A timed shore session (the **tide** is the timer) with three intertwined activities and a payoff that feeds the dive.

### 3.1 Realistic Jeju debris
Replace `BEACH_ITEMS` with authentic types, each carrying a recycling **category**, **value**, rarity, and a one-line **fact**:

| Item | Category | Note (real Jeju context) |
|---|---|---|
| 양식 스티로폼 부표 Aquaculture styrofoam buoy | styrofoam | The single most common debris on Jeju shores |
| 폐어망 Ghost net / 낚싯줄 line | (rescue trigger; recycled as 일반/특수) | Entangles wildlife; "ghost fishing" |
| PET 병 PET bottle | plastic | Often drifts cross-border |
| 비닐봉지 Plastic bag | plastic | Mistaken for jellyfish by turtles |
| 밧줄 Rope / 부표 float | plastic | Fishing gear |
| 소주병 Glass bottle | glass | |
| 음료캔 Drink can | metal (캔·고철) | |
| 과자봉지 Food wrapper | general (일반) | Multilayer film — not recyclable |
| (buried, rare) Sea glass / old coin / lost taewak | — | Bonus treasures, kept from today's game |

### 3.2 Ghost-net wildlife rescue ⭐ (headline)
Occasionally a **sea turtle, dolphin, or seabird (가마우지/cormorant)** is tangled in a washed-up net on the sand. Walk up → **hold to cut it free** (progress ring like the dig). On rescue:
- large won + eco-point reward,
- a **fact card** about entanglement,
- a notable **beach-health** boost,
- a swim-/fly-away animation and a celebratory toast.
Rescues are rarer than litter and weather-boosted (more after storms).

### 3.3 분리수거 sorting — end-of-session screen
When the tide runs out (or the player heads back), an **end-of-session sorting screen** presents the collected items. The player assigns each to a bin: **플라스틱 / 캔·고철 / 유리 / 스티로폼 / 일반**.
- Correct → full value + eco-points.
- Wrong → reduced value **and the correct bin is revealed** (the teaching moment).
- A tally shows accuracy and total. This **replaces** dumping beach trash at the co-op.

### 3.4 Fact cards
Short, real facts surface on the **first pickup** of each debris type and on **each rescue** (decomposition times, % of Jeju debris that is aquaculture styrofoam, microplastics in shellfish, plastic-bag/turtle confusion…). Dismissible, never blocking; a fact is shown once then logged so it doesn't nag.

### 3.5 Beach health → the dive (moderate coupling)
A persistent **shore-health meter `G.beachHealth` (0–100)**:
- **Accrues litter daily** on sleep (`sleepBtn`, `game.js:~664`), worse on `rain`/`wind`/storm weather (ties into the existing weather system).
- **Cleaning + rescues raise it**; sorting accuracy gives a small bonus.
- **Moderate dive effect** (clearly felt, never blocks): `beachHealth` modulates dive **creature spawn count** (`startDive` seeds `for i<20 spawnC()`), the **juvenile rate** (`c.young`, `placeCreature` `game.js:~1353`), and the **★ baseline** in `catchStars`. Clean shore → more creatures, fewer sickly juveniles, slightly easier ★. Trashed shore → thinner, poorer dives. Optionally: a low-health beach can spawn an **entangled creature** underwater (reinforces the lesson). Better catch then chains into the kitchen income loop.

### 3.6 Tide & weather
The session timer is framed as the **incoming tide**. Storm/wind/rain days (existing `G.weather`) **increase debris density and rescue chance** for that session and accelerate daily litter accrual.

### Education mapping (all four covered)
- **Jeju/haenyeo reality** → debris types + facts + the dive-yield coupling (the haenyeo's livelihood depends on a clean sea).
- **분리수거** → the sorting screen.
- **Marine-life harm** → the rescue mechanic, entangled-creature facts, microplastic facts, optional underwater entanglement.
- **Climate/ocean facts** → fact cards.

---

## 4. Project Structure & Integration Points

Follows the existing **hybrid** convention (no framework, classic scripts sharing one global scope).

- **`game.js`** — owns the beach scene; most changes land here:
  - Replace `BEACH_ITEMS` data (add `category`, `fact`, realistic set).
  - Add `G.beachHealth`, `G.factsSeen`, eco-points to state init + `restartGame` (`game.js:1754`).
  - Daily litter accrual in the sleep handler; weather modifiers.
  - Rescue entities + hold-to-cut interaction in `updateBeach`.
  - End-of-session **sorting screen** logic (new panel) replacing the co-op trash sale path.
  - Fact-card surfacing (once per type).
  - Dive coupling: read `G.beachHealth` in `startDive` spawn count, `placeCreature` juvenile rate, and `catchStars` baseline.
- **`render-atashinchi.js`** — beach visuals: draw debris by new type, tangled-animal sprites + free-away animation, a shore-health visual state (cleaner/dirtier sand), and the beach-health HUD element.
- **`Haenyeo Village Life.html`** — new DOM: sorting-screen panel (`#pSort`), fact-card panel (`#pFact`), beach-health HUD readout; bump cache-busters.
- **New module? ** Prefer keeping beach logic in `game.js` (it already owns `bLitter`/`updateBeach`). If the sorting + rescue + fact systems push `game.js` past readability, extract a `beach.js` module mirroring the `restaurant.js` pattern (loaded after `game.js`). Decide at Phase 3 based on file size.

---

## 5. Code Style

Match the surrounding code exactly (it is idiomatic and consistent):
- Vanilla ES, classic `<script>` (no modules/imports/build). Globals shared across files.
- Terse, single-purpose functions; data-driven via top-level `const` tables (like `SPECIES`, `BEACH_ITEMS`).
- Canvas drawing via the renderer helpers (`rr`, `inked`, `fillStroke`, `shade`, `MIN`, `drawPerson`).
- **Draw icons with canvas primitives, not emoji** (emoji are unreliable in `fillText`; learned this in the kitchen work).
- User-facing copy: warm, Jeju-flavoured English with Korean terms (한글) where natural, consistent with existing toasts/panels.
- HUD/panels reuse existing CSS classes (`.panel.sheet`, `.card-paper.hanji`, `.selllist`, `.track/.fill`, `.barlbl`).

---

## 6. Testing Strategy

No test framework exists; this is a browser canvas game. Verification per slice:
1. **Syntax:** `node --check game.js && node --check render-atashinchi.js` (and `beach.js` if extracted) after every change.
2. **Node DOM/canvas stub harness** (the approach used for the dive + kitchen work): load the scripts under a stubbed `document`/canvas/`Image`, drive `startBeachClean → updateBeach (collect + rescue) → end → sorting → bank`, asserting: items bank correctly, beach-health rises/falls and persists across a simulated sleep, sorting pays correctly (right vs wrong), rescue rewards fire, and the dive coupling reads `beachHealth` (spawn count / juvenile rate / ★ baseline change with health). Harness scripts are temporary unless we decide to commit a `haenyeo/tests/` suite.
3. **Manual play** in the browser (headless Chrome is broken under Rosetta here): the human confirms feel, readability of fact cards, sorting UX, rescue animation, and that a clean vs dirty beach produces a visibly different dive.
4. **Balance pass:** tune litter accrual, health→dive curve (moderate), rescue rarity, and sorting payouts so the loop is rewarding but the coupling never *blocks* progress.

---

## 7. Boundaries

**Always:**
- Keep the haenyeo/Jeju cultural identity and the `render-atashinchi` art style.
- Keep educational content **real and accurate**, lightweight, skippable, shown-once.
- Keep the coupling **moderate** — a neglected beach is worse, never a dead end.
- Verify each slice (syntax + harness) before moving on; cache-bust script tags so the browser reloads.

**Ask first:**
- Extracting a new `beach.js` module (vs keeping it in `game.js`).
- Any new generated art assets (tangled-animal sprites, bins) — confirm style/source as we did for `kitchen_bg.png`.
- Changing the co-op's role (we are removing the beach-trash sale there in favour of sorting).
- Adding underwater entanglement to the dive (touches dive code — confirm before Phase 5).

**Never:**
- Add a build system, framework, or external runtime deps.
- Block or gate play behind reading educational text.
- Make the educational facts preachy, fabricated, or region-inaccurate.
- Break the existing dive/kitchen loops or the save-less day cycle.

---

## 8. Build Phases (full overhaul, incremental)

1. **Foundations** — realistic `BEACH_ITEMS` (category + fact), `G.beachHealth`/eco-points/`G.factsSeen` state, daily litter accrual + weather modifier, beach-health HUD, fact-card panel.
2. **Coupling** — `beachHealth` modulates dive spawn count, juvenile rate, ★ baseline (moderate). Verify a clean vs dirty beach changes a dive.
3. **분리수거 sorting** — end-of-session sorting screen; correct/incorrect payouts + teaching; replace co-op trash sale. (Re-evaluate `beach.js` extraction here.)
4. **Ghost-net rescue** — tangled-animal entities, hold-to-cut interaction, rewards, fact card, free-away animation, health boost.
5. **Tide/weather surges + polish + balance** — storm debris surges, optional underwater entanglement, final tuning of accrual/coupling/payout curves.

---

## 9. Acceptance Criteria (v1 done when)

1. Beach debris is authentic Jeju marine litter, each item categorised with a real fact; first-pickup fact cards appear once per type.
2. Ghost-net rescues exist: find a tangled turtle/dolphin/seabird, hold to free it, get rewarded, see it leave, and read an entanglement fact.
3. Collected items are sorted into 분리수거 bins at end of session; correct sorting pays more, mistakes teach the right bin; this replaces the co-op trash sale.
4. `G.beachHealth` persists across days, accrues litter (worse in bad weather), and rises with cleaning/rescues/sorting.
5. Beach health **moderately and visibly** changes dives (spawn count / juvenile rate / ★ baseline), chaining into kitchen income — never blocking progress.
6. The full loop runs: clean shore → richer sea → better catch → better kitchen night → repeat, with the conservation message landing through mechanics + optional facts.
