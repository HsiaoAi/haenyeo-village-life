# Haenyeo Village Life

A cozy, all-ages browser game set in a Jeju Island haenyeo (해녀, "sea women") village. Free-dive for sea life, clean up the shore, cook and run a seaside kitchen, shop at the market, and wander a hand-drawn village — with light educational threads about Jeju culture, marine conservation, and Korea's 분리수거 (recycling) system woven into play, never lectured.

It's a single-page HTML5 canvas game written in vanilla JavaScript — no build step, no framework, no dependencies.

## Play locally

Because the page loads several `.js` files, serve it over HTTP rather than opening the file directly (some browsers block local file loads):

```bash
cd haenyeo
python3 -m http.server 8000
# then open http://localhost:8000/Haenyeo%20Village%20Life.html
```

Designed for both mobile (touch) and desktop. Best in a recent Chrome, Safari, or Firefox.

## Gameplay

- **Beach clean-up** — collect authentic Jeju marine debris, free trapped wildlife from ghost nets (hold-to-cut), then sort it at an end-of-session 분리수거 screen. A beach-health meter feeds back into your dives: a clean shore makes the sea richer.
- **Diving** — free-dive to gather catch; richer reefs reward a well-tended shore.
- **Kitchen & restaurant** — cook and serve what you catch.
- **Market / co-op** — sell your haul and shop.
- **Museum & story scenes** — Jeju cultural assets and narrative moments (Seoul, return, winter).

## Project structure

```
haenyeo/
  Haenyeo Village Life.html   # main game page (entry point)
  game.js                     # core game logic, scenes, state
  render-atashinchi.js        # active renderer (art style)
  render-ghibli.js            # alternate renderers …
  render-minhwa.js            #   (Korean folk-painting style)
  render.js
  restaurant.js               # restaurant/kitchen loop
  phone.js                    # in-game phone UI
  music.js                    # audio
  weather.js                  # tide / weather system
  cloud.js                    # optional Supabase cloud save (not yet configured)
  Jeju Cultural Assets.html   # museum content page
  *.png / *.jpg               # backgrounds and story art
docs/                         # design specs
SPEC.md                       # latest feature spec (beach clean-up overhaul)
scraps/                       # work-in-progress art references
uploads/                      # source image assets
```

## Tech

- Vanilla JavaScript + HTML5 Canvas, no dependencies or build step.
- Web fonts via Google Fonts (Gowun Batang, Gaegu, Space Mono).
- Multiple swappable renderers for different illustration styles.

## Cloud save (optional — not yet configured)

Progress is saved to the browser's `localStorage` automatically (per-browser, no
setup). Cloud save via **Supabase + Google login** is wired up in `cloud.js` but
**dormant** — until the two keys below are filled, the game runs on local save only
and the title screen shows "Cloud save: not configured".

To turn it on:

1. **Create a Supabase project** ([supabase.com](https://supabase.com)). From
   **Project Settings → API**, copy the **Project URL** and the **anon / public** key.

2. **Create the `saves` table** — run in the SQL Editor:

   ```sql
   create table if not exists public.saves (
     user_id    uuid primary key references auth.users on delete cascade,
     data       jsonb not null,
     updated_at timestamptz not null default now()
   );
   alter table public.saves enable row level security;
   create policy "own save read"   on public.saves for select using (auth.uid() = user_id);
   create policy "own save insert" on public.saves for insert with check (auth.uid() = user_id);
   create policy "own save update" on public.saves for update using (auth.uid() = user_id);
   ```

   Row Level Security means each player can only read/write their own row, so the
   anon key is safe to ship in client code.

3. **Enable Google login** — in Google Cloud Console create an OAuth **Web
   application** client; add the authorized redirect URI
   `https://<your-project-ref>.supabase.co/auth/v1/callback`. Paste the Google
   **Client ID** + **secret** into Supabase → **Authentication → Providers → Google**.

4. **Allow the game's URL** — Supabase → **Authentication → URL Configuration**:
   - **Site URL:** `https://hsiaoai.github.io/haenyeo-village-life/haenyeo/`
   - **Redirect URLs:** add that same URL (and `http://localhost:8000/` for local testing).

5. **Paste the keys** into the top of `haenyeo/cloud.js`:

   ```js
   const SUPABASE_URL      = 'https://<your-project-ref>.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGci...';   // anon / public key
   ```

   Then bump `cloud.js?v=1` → `?v=2` in `index.html` (cache-busting convention) and push.

**Behavior once live:** login is optional (guests keep playing on local save); on
sign-in the cloud save is pulled and reconciled against local by timestamp
(newest wins); every save also pushes to the cloud; `localStorage` stays the
offline cache so the game still works with no connection.

## License

No license specified yet — all rights reserved by default. Add a `LICENSE` file if you intend others to reuse the code or assets.
