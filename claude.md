# Claude Project Standards — DreamPlay Park

> Canonical conventions for any Claude session (or another LLM) working in
> this repository. Keep this file in sync with the project as it grows.

## Project at a glance

- **Type:** single-page React + TypeScript app (Vite-served).
- **Persistence:** `localStorage` only, via Zustand `persist` middleware
  under a single key `dreamplay.v1`.
- **No backend, no accounts, no network calls.**
- **Routing:** `react-router-dom@6` with `createBrowserRouter`. Routes are
  declared in `src/App.tsx`.
- **Games:** Canvas + `requestAnimationFrame`, driven by a shared
  `useGameLoop(deltaMs, isPaused)` hook.
- **Animations:** Framer Motion for state transitions; CSS keyframes for
  ambient loops.
- **Styling:** TailwindCSS 3 with the PRD color palette wired in via
  `tailwind.config.ts` (`sky.*`, `fantasy.*`, `night.*`).

## Folder conventions

- `src/pages/<Page>/index.tsx` is the only public entry per page.
- `src/games/<gameId>/` contains `XxxGame.tsx`, `useXxxGame.ts`,
  `types.ts`, `constants.ts`, and `index.ts` re-exports.
- `src/games/registry.ts` is the **single source of truth** mapping a
  `gameId` to its React component, title, attraction label, and
  description. The `:gameId` route param must match a key in this registry
  or the user is redirected to `/`.
- Shared hooks live in `src/hooks/` and have one default export per file.
- All persistence and achievement logic lives under `src/store/`.

## TypeScript rules

- `tsconfig.app.json` enables `strict`, `noUnusedLocals`, and
  `noUnusedParameters`. Fix the type errors; do not silence them.
- Path alias: `@/*` resolves to `src/*` in both the IDE and Vite.
- Prefer `type` imports for type-only symbols.
- Use `as const` for literal tuples; avoid `any` (use `unknown` + a narrow).

## Component conventions

- Function components only; no class components.
- Side effects go in `useEffect`. Use `useRef` for any mutable handle
  (canvas, animation frame ID, audio node).
- Every interactive element gets an `aria-label` if its visible text is
  not self-explanatory, and a Tailwind `focus-visible:ring-2` outline.
- `prefers-reduced-motion: reduce` must short-circuit Framer Motion
  transitions via the `useReducedMotion()` hook from `framer-motion` and
  freeze the day/night cycle on the park map.

## State and data flow

- The Zustand store in `src/store/gameStore.ts` owns `highscores`,
  `achievements`, `unlockedDecorations`, `soundOn`, `dayNightAuto`, and
  `prefersReducedMotion`. All of them are persisted under the
  `dreamplay.v1` localStorage key.
- Achievement checks are **pure functions** in `src/store/achievements.ts`
  so they are unit-testable without React.
- Game components report score changes to the store via callbacks
  (`onScore`, `onGameOver`) and let the store apply achievement
  unlocks; the UI listens via `useAchievementWatcher` and fires the
  `AchievementUnlocked` event for the popup / confetti.

## Commit and PR conventions

- One acceptance criterion (or one cohesive slice) per commit.
- Commit messages: `<type>(<scope>): <imperative summary>` — for example
  `feat(games): implement snake` or `chore: init project scaffolding`.
- Scopes used here: `scaffold`, `theme`, `store`, `park`, `shell`,
  `games`, `achievements`, `decorations`, `polish`, `docs`.
- Never commit `node_modules`, `dist`, `.env`, or anything under
  `.humanize/`, `.research/`, or `.claude/`.

## Verification expectations

- Run `npm run lint && npm run build` before declaring a slice done.
- The build must exit 0 with zero TypeScript errors.
- The dev server must start on `http://localhost:5173` and return 200
  for `/`.
- For each game, the corresponding `localStorage` key
  (`dreamplay.v1.highscores.<gameId>`) is updated after a play-through.

## Forbidden

- `pkill`, `killall`, `kill -9 -1` — they would take down shared
  harness services. Use a captured PID or `lsof -t -i :<port>` instead.
- New top-level dependencies without a plan entry. If you need one, add
  it to the next plan revision first.
- Disabling ESLint or TypeScript rules inline to silence a warning —
  fix the underlying issue.
