// useGameLoop — drives a Canvas game's main loop via
// `requestAnimationFrame` and reports the wall-clock delta in
// milliseconds to the supplied callback.
//
// Contract:
//   * `callback(deltaMs)` is invoked on every animation frame while
//     the hook is mounted. `deltaMs` is the time elapsed since the
//     previous frame (capped at ~100ms to avoid huge jumps after the
//     tab was backgrounded).
//   * When `isPaused` is true the loop keeps running so `requestAnimationFrame`
//     stays in sync with the browser, but the callback is NOT invoked.
//     The "before draw" pause pattern means the canvas simply freezes
//     on the last frame; no extra state is needed inside the game.
//   * The hook re-binds on every render through a `useRef` mirror so
//     the game never has to memoize its callback.
//
// Used by AC-6+ games. The hook is defined in AC-5 so every game can
// be written against the same pause/cleanup contract from day one.
import { useEffect, useRef } from 'react';

const MAX_DELTA_MS = 100;

export type GameLoopCallback = (deltaMs: number) => void;

export function useGameLoop(
  callback: GameLoopCallback,
  isPaused: boolean,
): void {
  // Keep a ref to the latest callback so the rAF effect can read it
  // without having to resubscribe on every render.
  const cbRef = useRef<GameLoopCallback>(callback);
  cbRef.current = callback;

  // `isPaused` is read inside the tick on every frame so flipping it
  // doesn't require tearing down the rAF chain. We still list it in
  // the deps so a re-mount in StrictMode behaves correctly.
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(now - lastTime, MAX_DELTA_MS);
      lastTime = now;
      if (!isPaused) {
        cbRef.current(delta);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPaused]);
}
