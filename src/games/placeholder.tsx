// Placeholder game component used by the registry while the real
// `useXxxGame` hooks and Canvas implementations land in AC-6+.
//
// AC-5 ships the full shell contract — `isPaused`, `restartKey`,
// `onScore`, `onGameOver` — so the placeholder demonstrates that the
// wiring works end-to-end:
//   * "Score +10" calls `onScore` with a running total.
//   * `restartKey` is shown so the user can confirm Restart
//     re-mounts the game (the value changes, the canvas re-renders).
//   * `isPaused=true` adds a small "PAUSED" badge inside the
//     canvas so the overlay is visible even before the shell's
//     translucent pause overlay fades in.
//   * "End game" calls `onGameOver` with the current score; the
//     shell persists the result and the Best field updates.
//
// AC-6 also adds an optional `onRestart` so in-game "Play Again"
// buttons can request a shell-driven re-mount; the placeholder
// doesn't need it but accepts it for type uniformity.
//
// The wrapper exposes `data-game-id` so e2e tests and the
// AchievementPopup (AC-12) can target individual games without
// coupling to the eventual game-specific component name.
import { useState } from 'react';
import type { GameComponentProps } from './registry';

export type PlaceholderGameProps = GameComponentProps;

export default function PlaceholderGame({
  gameId,
  isPaused,
  restartKey,
  onScore,
  onGameOver,
  onRestart,
}: PlaceholderGameProps) {
  // `onRestart` is part of GameComponentProps in AC-6; the placeholder
  // doesn't need it (no game-over overlay) but we accept the prop so
  // the shell can pass it uniformly.
  void onRestart;
  // Local score so the buttons can do something useful (the shell
  // also receives a copy via `onScore` and renders it in the HUD).
  const [localScore, setLocalScore] = useState(0);

  const addScore = () => {
    const next = localScore + 10;
    setLocalScore(next);
    onScore(next);
  };

  const endGame = () => {
    onGameOver(localScore);
  };

  return (
    <section
      data-game-id={gameId}
      data-restart-key={restartKey}
      data-paused={isPaused}
      className="flex h-full min-h-[inherit] w-full flex-col items-center justify-center gap-4 p-8 text-center text-slate-50"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-night-glow">
        Placeholder
      </p>
      <h2 className="text-3xl font-bold tracking-tight">
        Game implementation lands in AC-6+
      </h2>
      <p className="max-w-prose text-sm text-slate-300">
        The shared shell, score HUD, pause overlay, restart, sound,
        and fullscreen controls are wired up — the buttons below
        exercise the same callbacks a real game will use.
      </p>
      <p
        data-testid="placeholder-score"
        className="text-2xl font-semibold text-sky-sunset"
      >
        Local score: {localScore}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <button
          type="button"
          onClick={addScore}
          data-testid="placeholder-score-btn"
          className="rounded-full bg-night-glow px-4 py-2 text-sm font-semibold text-night-deep shadow hover:bg-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
        >
          Score +10
        </button>
        <button
          type="button"
          onClick={endGame}
          data-testid="placeholder-gameover-btn"
          className="rounded-full border border-night-dusk/60 bg-night-deep/70 px-4 py-2 text-sm font-semibold text-sky-sunset shadow hover:border-fantasy-cream/70 hover:text-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
        >
          End game
        </button>
      </div>
      {isPaused && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-fantasy-cream">
          (paused — wrapper overlay is shown above)
        </p>
      )}
      <p className="text-[10px] uppercase tracking-widest text-slate-400">
        restart key: {restartKey}
      </p>
    </section>
  );
}
