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
- **Zustand** (with `persist`) for local progress and achievements
- **Framer Motion** for the camera-zoom transitions, hovers, and popups
- **Canvas + `requestAnimationFrame`** for the games themselves
- **WebAudio** for optional ambient sound (no external audio files)

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
├── main.tsx        # React entry + BrowserRouter
├── App.tsx         # Route table
├── index.css       # Tailwind layers + global resets
├── pages/          # ParkPage, GamePage, NotFoundPage (added in later ACs)
├── games/          # One folder per mini-game + a shared registry
├── components/     # Cross-cutting UI (popups, buttons, particles)
├── hooks/          # useGameLoop, useFullscreen, useKeyboard, ...
├── store/          # Zustand store + achievement checks
├── utils/          # confetti, sound, seedable PRNG
└── assets/         # svgs / gifs
```

## Phase 1 attractions

| Game           | Attraction name   | Route                  |
| -------------- | ----------------- | ---------------------- |
| Snake          | Snake Castle      | `/play/snake`          |
| Brick Breaker  | Brick Break Castle| `/play/brick-breaker`  |
| Tetris         | Puzzle Tower      | `/play/tetris`         |
| 2048           | Crystal Mine      | `/play/crystal-2048`   |
| Memory Match   | Memory Garden     | `/play/memory`         |

## Status

- AC-1 ✅ project scaffold builds and runs
- AC-2 ⏳ Tailwind theme encodes the PRD color palettes
- AC-3 ⏳ routing and shell layout
- AC-4 ⏳ park map with five attractions
- AC-5 ⏳ shared game page shell
- AC-6…AC-10 ⏳ individual games
- AC-11…AC-14 ⏳ achievements, decorations, polish, accessibility

See `.humanize/rlcr/eadc90e7-b804-46c1-9b82-4d1b1014be02/plan.md` for the
full implementation plan and acceptance criteria.

## Deployment

This is a Vite SPA. The simplest deploy is the **Vercel** or **Cloudflare
Pages** static preset — point it at this repository, set the build command to
`npm run build`, and the output directory to `dist/`. No environment variables
are required.
