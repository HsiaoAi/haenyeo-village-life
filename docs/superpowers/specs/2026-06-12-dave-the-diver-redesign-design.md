# 해녀 — Dave-the-Diver-style Redesign

**Date:** 2026-06-12
**Status:** Approved design, ready for planning
**Scope:** Add the second half of the Dave the Diver core loop (an evening seafood-stall service) and a catch-quality/tension layer to the existing dive, while keeping the haenyeo/Jeju identity.

---

## 1. Goal & Framing

The game (`haenyeo/`) is a vanilla-JS canvas game about a Jeju haenyeo (free-diving sea woman). It already has a dive minigame with breath-as-timer, depth zones, gear upgrades, and a flat-price co-op sell. What it lacks is the thing that makes *Dave the Diver* compelling: a **two-phase day where diving feeds an evening business and the business funds deeper diving.**

This redesign closes that loop, reframed for haenyeo culture. The "restaurant" is **해녀의 부엌 (Haenyeo's Kitchen)** — a seaside seafood stall, run in the evening, that turns the day's catch into the village's main source of won.

**Non-goals (explicitly out of scope for v1):** harpoon/weapon combat, boss fights, fish farms, staff hiring, weapon crafting, a full multi-app phone OS, save/load. These are noted as "Later" so the architecture leaves room, but none are built now.

### Target loop

```
MORNING/DAY:  Dive the bay (1–2 dives) → catch seafood at varying QUALITY (★1–3)
EVENING:      해녀의 부엌 — pick tonight's menu from the catch, serve guests → earn won
NIGHT:        Sleep → won funds gear → deeper/rarer catch → better menu → more guests
```

The co-op sell (`openSell`) **stays** as a secondary outlet for dumping low-grade or leftover catch at a trickle of won. The kitchen is where real money is made — mirroring Dave's Bancho Sushi relationship.

---

## 2. Design Decisions (locked)

| Decision | Choice |
|---|---|
| Deliverable | Design doc, then incremental implementation |
| Loop scope | Full dual loop (dive + evening service) |
| Theme | Keep haenyeo/Jeju identity |
| Architecture | Hybrid: dive changes edit `game.js`; the new service is a separate `restaurant.js` module (follows `weather.js`/`music.js`/`phone.js` pattern) |
| Combat | Gentle, no weapons. Quality comes from **technique** (calm approach, clean dig, perfect sumbisori), not violence |
| Service minigame | Real-time floor-running (recommended) — reuses the existing movement + scene engine |
| Venue | Evening service is entered from the **bulteok** (the divers' communal hearth) — culturally the haenyeo's "living room" and cookfire. No new village building art required |

---

## 3. Architecture & Integration Points

The codebase loads scripts in this order (`Haenyeo Village Life.html`):
`game.js` → `render-atashinchi.js` (active renderer) → `phone.js` → `music.js` → `weather.js`.

Globals available to all later scripts: `cv`, `ctx` (canvas 960×600), `W`, `H`, `G` (game state), `scene`, `SPECIES`, `tone()`, `toast()`, `$()`/`$id()`, `keys`, `joy`, `divePtr`, `P` (player).

### New module: `restaurant.js`

- Loaded **after `game.js`** (so globals exist) in `Haenyeo Village Life.html`.
- Defines globals `enterRestaurant()`, `updateRestaurant(dt)`, `drawRestaurant()`, `endRestaurant()` — the same call pattern game.js already uses for `drawDive`/`updateDive` (which live in the renderer and are invoked by `frame()` at runtime).
- Owns its own scene rendering directly to `ctx` (it does not depend on village art).
- Reads/writes `G` (catch inventory, money, restaurant rank).

### Edits to `game.js`

1. **`frame()` loop** (~line 1568, 1576): add a `scene==='kitchen'` branch calling `updateRestaurant`/`drawRestaurant`. Do **not** add `'kitchen'` to the `tickClock` allowlist — the day clock pauses during service (§5.4).
2. **`nearest()` / `refreshPrompt()` / `doInteract()`** (~lines 462–516): when near the bulteok in the evening, offer "Open the kitchen tonight" → `enterRestaurant()` (in addition to the existing "Examine · Bulteok").
3. **Dive system** (`startDive`/`placeCreature`/`updateDive`/`endDive`, lines 1255–1465): add the quality + weight + fish-AI changes (§4).
4. **State init** (`G` object ~line 192, `restartGame` ~line 1646): add new fields (`rank`, per-catch quality storage).
5. **`SPECIES`** (~line 215): each species already has a `w` weight field and `value`; add a per-catch quality dimension (see §4.1).
6. **HTML** (`Haenyeo Village Life.html`): add a `<script src="restaurant.js">` tag and any kitchen-specific HUD/panel DOM (a result panel mirroring `#pDive`).

### Edits to the active renderer (`render-atashinchi.js`)

- Minor: dive drawing may need small additions for fish-AI states (fleeing fish, octopus ink cloud). Quality/weight are HUD/logic concerns, mostly game.js + HTML.

---

## 4. Part 1 — Dive Overhaul (in `game.js`)

Four additions, all building on existing code. **No weapons.**

### 4.1 Catch quality (★1–3)

Today a catch is just `dNet.push(c.s.id)` — an id, flat value. Change the net to hold `{id, stars}` objects so quality survives to the result/sell/menu screens.

Stars are earned by **technique**:

- **Calm approach (the core skill):** every harvestable creature tracks an `alarm` state. Approaching slowly / from the right angle keeps `alarm` low. Grabbing a calm creature → **★3**; a startled-but-present one → **★2**; one you chased down as it fled → **★1**.
- **Clean dig (buried species):** the existing `c.dig` mechanic — if dig progress never slips back (`c.dig` decay at line 1419 never triggers) and you don't bump the creature, the dig yields a higher star.
- **Perfect sumbisori bonus:** a perfect surface beat (`trySumbi`, line 1442) grants a short *freshness* window — catches in the next few seconds get +1 star (capped at 3). Reinforces the existing rhythm mechanic.
- **Juveniles** still cannot be taken (`c.young`, line 1293) — unchanged.

Quality flows downstream:
- **Dive result** (`endDive`): show catch grouped by species with a star breakdown.
- **Co-op sell** (`openSell`): price scales with stars (e.g. ★1 = 0.7×, ★2 = 1.0×, ★3 = 1.4× of `value`).
- **Kitchen menu** (§5): higher-★ ingredients raise dish price and a "freshness" rating.

Storage (chosen to minimize migration risk): **keep `G.catch[id]` as the total count** (so existing sell/cook/gift/dialogue code keeps working unchanged) and **add a parallel `G.catchQ[id] = {1:n, 2:n, 3:n}`** holding the star breakdown. New code (quality-aware sell pricing, kitchen menu) reads `G.catchQ`; old code that only needs counts reads `G.catch`. Any place that *removes* from inventory (sell, cook, gift) must decrement both `G.catch` and `G.catchQ` in lockstep — this consistency is the riskiest part and gets its own task with careful verification.

### 4.2 Fish that react (gentle AI)

Creatures are currently static spawns. Add light behaviors keyed off the new `alarm` state:

- **Reef fish / drifting species:** idle drift; when the diver rushes within range, they **flee** (raise `alarm`, swim away). Catchable only by a calm, patient approach.
- **Octopus:** if the dig is too slow or interrupted, it **inks and relocates** (puff particle + teleport to a nearby valid spot). Rewards efficient, uninterrupted digging.
- **Moray (new species, optional):** tucks into a `DSHELVES` rock; must be approached from the open side, else it withdraws.

All reactions are *avoidance*, never attack. The only damage sources remain the existing **jellyfish sting** (line 1358) and **breath depletion**.

### 4.3 Cargo weight (replace count-only capacity)

`netCap()` currently returns an item *count* (line 266). Replace the cap with a **weight budget**: the net fills by summed weight, not count. A heavy octopus eats budget, forcing keep-or-drop decisions. Overloaded already slows the swim (`netLoad`, line 1324) — keep that, drive it off weight. The `GEAR.net` tiers (line 244) become weight capacities.

> **Implementation note:** the spec originally assumed `SPECIES[].w` held physical mass, but reading the code that field is *spawn frequency* (used to weight the spawn pool in `placeCreature`). Physical weight is therefore a separate `CATCH_KG` map keyed by species id.

### 4.4 Soft-loss on blackout (keep, refine)

The existing blackout (line 1341) already keeps the single best catch — a Dave-style soft loss. Keep it; when quality exists, "best" = highest `value × star multiplier`.

---

## 5. Part 2 — 해녀의 부엌 Evening Service (`restaurant.js`)

A new scene `'kitchen'`, entered from the bulteok in the evening. Real-time floor-running.

### 5.1 Flow

1. **Plan the menu.** From today's `G.catch`, the player picks dishes whose ingredients they hold. Each dish shows price + servings; higher-★ ingredients raise price and freshness.
2. **Service (the minigame).** Guests arrive and seat at tables. The player (reusing the village walk controls — `joy`/`keys`, `P`-style movement) carries plates from the counter to the correct table in order. Tapper-style time management.
   - **Pour 보리차/막걸리 (barley tea / rice wine):** Dave's tea-pour reskinned — hold-and-release to stop a rising fill at a marked line. A good pour gives the guest a happy aura → **+30% payment**.
   - **반찬 (side-dish) station:** Dave's wasabi reskinned — a shared side-dish supply that depletes per dish served; when empty, dishes stall until refilled via a quick mash/refill action.
3. **Tally.** End-of-night revenue → `G.money`. Updates reputation/rank.

### 5.2 Dishes (initial set, mapped to existing species)

| Dish (Korean) | English | Ingredients |
|---|---|---|
| 전복죽 | Abalone porridge | abalone |
| 성게미역국 | Urchin & seaweed soup | urchin + seaweed |
| 문어숙회 | Boiled octopus | octopus |
| 해물라면 | Seafood ramyeon | any 1 + seaweed |
| 소라무침 | Spiced conch | conch |
| 해삼초무침 | Sea-cucumber salad | cucumber |

(Pearl is not food — stays a treasure sold at co-op.)

### 5.3 Reputation / rank (Dave's Cooksta, reskinned)

A village-renown rank — `G.rank` (e.g. 소문 levels / word-of-mouth on the village 게시판 notice board, or surfaced via the existing `phone.js`). Higher rank → more guests per night and unlocks higher-tier dishes. Rank rises from nightly revenue + serving quality. Kept simple in v1: a small number of tiers gating guest count.

### 5.4 Timing

Service is a **bounded round** (a fixed number of guests, or its own timer), *not* driven by the day clock — the clock pauses during the kitchen scene (like the phone pause). After the round, control returns to the village, and the player sleeps to advance the day.

---

## 6. Part 3 — Progression Glue

- **Gear upgrades** (`GEAR`/`SUITS`) unchanged mechanically, now economically justified by the kitchen: deeper dives → premium species → signature dishes → more renown.
- **VIP guests / quests (optional, layered last):** a tourist requests a specific dish; fulfilling it unlocks a recipe or a small bonus. Dave's "mechanic-delivery via VIP" pattern, minimal in v1.
- **Phone as meta-UI:** `phone.js` already exists and can surface rank/recipes later. Not required for v1.

---

## 7. Risks & Sequencing Notes

- **Biggest risk:** the `G.catch` quality migration (§4.1) touches sell, cook, gift, and dialogue code. Do it as an isolated, well-tested step before building anything on top.
- **Second risk:** real-time floor-running is the largest new-code chunk. Build the kitchen scene in thin slices — static scene → guests seat → carry one plate → add tea pour → add 반찬 station → tally — verifying each in the running game before expanding.
- **Verification:** this is a browser canvas game with no test harness. Each slice is verified by running the page and observing behavior (manual). Keep slices small enough to eyeball.
- **Keep it boring:** prefer extending existing patterns (the dig/grab loop, the `joy` movement, the `#pDive` result panel) over new abstractions.

---

## 8. Acceptance (v1 done when)

1. A dive yields catch with ★1–3 quality, earned from calm approach / clean dig / sumbisori.
2. Fish visibly react (flee / octopus inks); cargo is weight-limited; blackout keeps the best catch.
3. The bulteok opens 해녀의 부엌 in the evening; the player plans a menu from the catch.
4. Guests arrive and are served by walking plates to tables, with the tea-pour and 반찬 sub-games working.
5. Service pays won scaled by dish price, ingredient stars, and service quality; a rank gates guest count.
6. The full day loop runs: dive → kitchen → sleep → repeat, with money funding gear that enables better catches and dishes.
