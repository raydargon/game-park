// GameShell — the wrapper every Phase 1 game is mounted inside.
//
// Responsibilities (PRD §6):
//   * Top-left "← Return To Dream Park" link.
//   * Centered game title + attraction label.
//   * ScoreHud (current + persisted best).
//   * Canvas wrapper (this is the element that goes fullscreen).
//   * Translucent pause overlay with click/Space to resume.
//   * Bottom action bar: Restart, Pause/Resume, Sound, Fullscreen.
//   * Space-bar shortcut to toggle pause.
//
// State model:
//   * `isPaused` is owned here; the game receives it as a prop so
//     `useGameLoop` (or the game itself) can skip ticks while paused.
//   * `restartKey` increments on Restart; we pass it to the game as
//     a `key` so React fully re-mounts the game component with
//     fresh state. The canvas element itself stays in the DOM
//     (it's a sibling of the game in the wrapper), so the wrapper
//     ref for fullscreen is stable across restarts.
//   * `score` mirrors the latest value the game reported via
//     `onScore`. Restart zeros it. Game-over writes it to the
//     persisted high score for the current `gameId`.
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGameEntry, type GameId, type GameRegistryEntry } from '../../games/registry';
import { useGameStore } from '../../store/gameStore';
import { useFullscreen } from '../../hooks/useFullscreen';
import ActionBar from './ActionBar';
import ScoreHud from './ScoreHud';

export type GameShellProps = {
  gameId: GameId;
  /** Optional override; otherwise looked up from the registry. */
  entry?: GameRegistryEntry;
};

export default function GameShell({ gameId, entry }: GameShellProps) {
  // Hooks first — never return before calling all hooks. The
  // resolved-entry check happens at render time, after the hook
  // calls, so the hook order is stable for every gameId.
  const resolved = entry ?? getGameEntry(gameId);

  const [isPaused, setIsPaused] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const [score, setScore] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { isFullscreen, toggle } = useFullscreen();

  // Read the persisted best once on mount. The store is reactive
  // so a second tab updating the value will be picked up here too.
  const highScore = useGameStore((s) => s.highscores[gameId] ?? 0);
  const setHighScore = useGameStore((s) => s.setHighScore);

  const handleScore = useCallback((next: number) => {
    setScore(next);
  }, []);

  const handleGameOver = useCallback(
    (finalScore: number) => {
      setHighScore(gameId, finalScore);
    },
    [gameId, setHighScore],
  );

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleRestart = useCallback(() => {
    setScore(0);
    setRestartKey((k) => k + 1);
    setIsPaused(false);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    toggle(wrapperRef.current);
  }, [toggle]);

  // Space toggles pause. We attach to the window so the player
  // doesn't have to focus the canvas first. Inputs that should
  // still receive Space (e.g. a future text field) get a chance to
  // stopImmediatePropagation before us.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar') {
        if (isEditable) return;
        event.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Defensive: GamePage already validates gameId against the
  // registry, but this lets the shell be reused in tests.
  if (!resolved) {
    return (
      <p className="p-8 text-center text-slate-300">
        Unknown attraction: {gameId}
      </p>
    );
  }

  const GameComponent = resolved.component;
  return (
    <div
      data-testid="game-shell"
      data-game-id={resolved.id}
      className="mx-auto flex w-full max-w-5xl flex-col gap-5 text-slate-50"
    >
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <Link
          to="/"
          data-testid="return-to-park"
          className="inline-flex w-fit items-center gap-1 rounded-full border border-night-dusk/60 bg-night-deep/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-sky-sunset shadow transition hover:border-fantasy-cream/70 hover:text-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
        >
          <span aria-hidden>←</span>
          Return To Dream Park
        </Link>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-night-glow">
            {resolved.attractionLabel}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-sky-sunset sm:text-4xl">
            {resolved.title}
          </h1>
        </div>
      </header>

      <ScoreHud score={score} highScore={highScore} label={resolved.title} />

      <div
        ref={wrapperRef}
        data-testid="canvas-wrapper"
        data-fullscreen={isFullscreen}
        className="relative isolate overflow-hidden rounded-3xl border border-night-dusk/40 bg-gradient-to-b from-night-deep/80 via-night-dusk/80 to-night-deep/80 shadow-2xl"
        style={{ minHeight: 'min(70vh, 640px)' }}
      >
        <GameComponent
          key={restartKey}
          gameId={resolved.id}
          isPaused={isPaused}
          restartKey={restartKey}
          onScore={handleScore}
          onGameOver={handleGameOver}
        />

        <AnimatePresence>
          {isPaused && (
            <motion.button
              key="pause-overlay"
              type="button"
              onClick={handleTogglePause}
              aria-label="Resume game"
              data-testid="pause-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-night-deep/70 text-slate-50 backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fantasy-cream"
            >
              <span aria-hidden className="text-6xl drop-shadow">
                ⏸
              </span>
              <span className="text-2xl font-bold uppercase tracking-widest text-sky-sunset">
                Paused
              </span>
              <span className="text-sm text-slate-200/90">
                Click anywhere or press <kbd className="rounded border border-night-dusk/60 bg-night-deep/80 px-1.5 py-0.5 text-[11px] font-mono">Space</kbd> to resume
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <ActionBar
        isPaused={isPaused}
        isFullscreen={isFullscreen}
        onRestart={handleRestart}
        onTogglePause={handleTogglePause}
        onToggleFullscreen={handleToggleFullscreen}
      />
    </div>
  );
}
