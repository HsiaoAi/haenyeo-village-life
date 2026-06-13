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

## License

No license specified yet — all rights reserved by default. Add a `LICENSE` file if you intend others to reuse the code or assets.
