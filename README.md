# DreamPlay Park

A single-page React + TypeScript app that presents an explorable fantasy
amusement park where every attraction is a clickable classic mini-game
(Snake, Brick Breaker, Tetris, 2048, Memory Match). All progress is stored
locally in the browser; no backend or account required.

## Stack

- **React 18** + **TypeScript** (strict mode)
- **Vite 5** for the dev server and build
- **TailwindCSS 3** for styling
- **React Router 6** for `/` and `/play/:gameId` routes
- **Zustand** (with `persist`) for local progress, achievements, and decorations
- **Framer Motion** for the camera-zoom transitions, hovers, and popups
- **Canvas + `requestAnimationFrame`** for the games themselves
- **WebAudio** for optional ambient sound (no external audio files)
- **canvas-confetti** (dynamic-imported on first achievement unlock) for the
  celebratory burst

## Getting started

```bash
# 1. install dependencies
npm install

# 2. start the dev server on http://localhost:5173
npm run dev

# 3. type-check and build for production
npm run build

# 4. preview the production build locally
npm run preview

# 5. lint
npm run lint
```

## Project layout

```
src/
├── main.tsx                    # React entry + BrowserRouter
├── App.tsx                     # Route table + achievement watcher/popup root
├── index.css                   # Tailwind layers + global resets + keyframes
├── pages/                      # ParkPage, GamePage, NotFoundPage
│   ├── ParkPage/               # Day/night sky, ambient, attraction grid, decorations
│   ├── GamePage/               # Shared shell (ScoreHud, ActionBar, Fullscreen)
│   └── NotFoundPage/
├── games/                      # One folder per mini-game + a shared registry
│   ├── snake/                  # AC-6
│   ├── brick-breaker/          # AC-7
│   ├── tetris/                 # AC-8
│   ├── crystal-2048/           # AC-9
│   ├── memory/                 # AC-10
│   └── registry.ts             # Single source of truth for gameId → component
├── components/                 # Cross-cutting UI
│   ├── AchievementPopup.tsx    # AC-12: unlock toast + confetti + chime
│   ├── ParticleBurst.tsx       # Hover dots for attraction cards
│   └── AccessibleButton.tsx    # AC-14: thin button wrapper with focus ring
├── hooks/                      # useGameLoop, useFullscreen, useKeyboard, ...
├── store/                      # Zustand store, achievement rules, decoration registry
├── utils/                      # confetti, sound, seedable PRNG
└── assets/                     # (reserved for future SVGs)
```

## Phase 1 attractions

| Game           | Attraction name    | Route                  | Notes                                      |
| -------------- | ------------------ | ---------------------- | ------------------------------------------ |
| Snake          | Snake Castle       | `/play/snake`          | 20×20 grid, speed-up every 5 food         |
| Brick Breaker  | Brick Break Castle | `/play/brick-breaker`  | 8×10 bricks, paddle + mouse, 3 lives      |
| Tetris         | Puzzle Tower       | `/play/tetris`         | 7-bag, hold/next, SRS-lite wall kicks     |
| 2048           | Crystal Mine       | `/play/crystal-2048`   | Framer Motion `layout` slide animations    |
| Memory Match   | Memory Garden      | `/play/memory`         | 4×4 emoji pairs, best-time (lower is better) |

Unknown `:gameId` URLs redirect to `/`.

## Persistence

A single Zustand `persist` slice writes through to `localStorage` under
`dreamplay.v1`:

- **`highscores`** — per-game best score; Memory stores the best elapsed
  seconds (lower is better).
- **`achievements`** — list of unlocked achievement ids (snake-100,
  snake-200, brick-1000, tetris-4096, memory-perfect, park-explorer).
- **`unlockedDecorations`** — 1:1 mirror of `achievements` that drives
  the visual park-map layer.
- **`playedGames`** — list of gameIds the player has finished at least
  once (used by `park-explorer`).
- **`totalBricksCleared`** / **`crystalBestTile`** — derived stats
  needed by `brick-1000` and `tetris-4096`.
- **`soundOn`**, **`dayNightAuto`** — UI preferences (persisted).
- **`prefersReducedMotion`** — re-derived from `window.matchMedia(...)`
  on every boot (not persisted; the system setting can change between
  sessions).

## Accessibility

- Every interactive element has a `focus-visible:outline` ring (or uses
  `AccessibleButton`).
- All Framer Motion animations are gated on `useReducedMotion()` —
  hover-scales, camera-zoom, popup scale, etc. all collapse to plain
  fades when the user has reduced motion enabled.
- CSS-only loops (cloud drift, balloon float, decoration loops) are
  killed in the `prefers-reduced-motion: reduce` media query.
- The day/night auto-cycle pauses on reduced motion.
- `aria-live="polite"` and `aria-label` are wired into the achievement
  popup, day/night toggle, sound toggle, and the game-over overlays.
- The park map is usable down to **360px** width: Tailwind responsive
  utilities stack the cards on mobile, and a CSS `transform: scale()`
  clamp shrinks the layout to fit sub-360px viewports.

## Status

- AC-1 ✅ project scaffold builds and runs
- AC-2 ✅ Tailwind theme encodes the PRD color palettes
- AC-3 ✅ routing and shell layout
- AC-4 ✅ park map with five attractions
- AC-5 ✅ shared game page shell
- AC-6 ✅ Snake (Snake Kingdom)
- AC-7 ✅ Brick Breaker (Brick Break Castle)
- AC-8 ✅ Tetris (Puzzle Tower)
- AC-9 ✅ 2048 (Crystal Mine)
- AC-10 ✅ Memory Match (Magic Garden)
- AC-11 ✅ persistent progress and achievement system
- AC-12 ✅ reward effects on achievement unlock
- AC-13 ✅ unlocked decorations on the park map
- AC-14 ✅ responsive, accessible, and production-ready

All 14 acceptance criteria from the plan are complete. Bundle is well
under the 500 kB gzipped AC-14 budget (see `dist/assets/` after
`npm run build`).

## Deployment

This is a Vite SPA. The simplest deploy is the **Vercel** or **Cloudflare
Pages** static preset — point it at this repository, set the build command
to `npm run build`, and the output directory to `dist/`. No environment
variables are required.

Because the app stores progress in `localStorage`, it's a purely
client-side artifact; no SSR, no serverless functions, no API routes.

## See also

- `.humanize/rlcr/eadc90e7-b804-46c1-9b82-4d1b1014be02/plan.md` — the
  full implementation plan and acceptance criteria.
- `.humanize/rlcr/eadc90e7-b804-46c1-9b82-4d1b1014be02/claude.md` —
  the canonical project conventions (lives at the repo root).
