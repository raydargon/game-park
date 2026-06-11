// useFlappy — pure logic hook for Flappy Wings.
//
// State machine: `'running' | 'gameover'`. The hook starts in
// `'running'`; the game loop dispatches `step()` on every animation
// frame, which applies gravity to the bird's `vy` and integrates to
// the bird's `y`. When the bird's center crosses `FLOOR_Y - BIRD_R`
// the status flips to `'gameover'` and the run is over.
//
//   * `step()` — advance gravity by one frame.
//   * `flap()` — apply an upward velocity impulse (Space/ArrowUp).
//   * `reset()` is *not* exposed: the GameShell re-mounts the game
//     via `key={restartKey}` on Restart, so the hook re-initialises
//     fresh state via `createInitialState`.
//
// All side effects (`onGameOver`, `markGamePlayed`) flow through
// refs + a useEffect so the setState reducers stay pure
// (StrictMode-safe). Score reporting and pipe spawning are added
// in AC-5.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { GameId } from '../registry';
import {
  BIRD_R,
  BIRD_X,
  FLOOR_Y,
  FLAP_VY,
  GRAVITY,
  MAX_VY,
} from './constants';
import type { FlappyState } from './types';

export type UseFlappyArgs = {
  /** Game id (e.g. `'flappy-bird'`). Used to mark the game as
   *  played for the `park-explorer` achievement when the run
   *  ends. */
  gameId?: GameId;
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
};

export type UseFlappyResult = {
  state: FlappyState;
  /** Per-frame physics tick: advance gravity + integrate position. */
  step: () => void;
  /** Give the bird an upward velocity impulse. No-op at gameover. */
  flap: () => void;
};

function createInitialState(): FlappyState {
  return {
    bird: {
      // Spawn the bird centered vertically so the player has time
      // to react to the first gravity tick.
      x: BIRD_X,
      y: Math.floor(FLOOR_Y * 0.4),
      vy: 0,
    },
    status: 'running',
  };
}

export function useFlappy({
  gameId,
  onScore,
  onGameOver,
}: UseFlappyArgs): UseFlappyResult {
  const [state, setState] = useState<FlappyState>(() => createInitialState());

  // StrictMode-safe side-channel refs.
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const lastReportedGameOverRef = useRef(false);

  const step = useCallback(() => {
    setState((s) => {
      if (s.status !== 'running') return s;
      const newVy = Math.min(MAX_VY, s.bird.vy + GRAVITY);
      const newY = s.bird.y + newVy;
      // Floor collision: bird center can't go below FLOOR_Y - BIRD_R.
      if (newY + BIRD_R >= FLOOR_Y) {
        return {
          ...s,
          bird: { ...s.bird, y: FLOOR_Y - BIRD_R, vy: 0 },
          status: 'gameover',
        };
      }
      return { ...s, bird: { ...s.bird, y: newY, vy: newVy } };
    });
  }, []);

  const flap = useCallback(() => {
    setState((s) => {
      if (s.status !== 'running') return s;
      return { ...s, bird: { ...s.bird, vy: FLAP_VY } };
    });
  }, []);

  // Side-channel: report game-over through a useEffect (StrictMode-safe).
  // `lastReportedGameOverRef` is re-initialised to `false` on every
  // remount (Restart re-mounts via `key={restartKey}`), so onGameOver
  // fires exactly once per run.
  useEffect(() => {
    if (state.status === 'gameover' && !lastReportedGameOverRef.current) {
      lastReportedGameOverRef.current = true;
      onGameOverRef.current(0);
      if (gameId) useGameStore.getState().markGamePlayed(gameId);
    }
  }, [state.status, gameId]);

  // Avoid unused-var lint for the score ref (AC-5 will consume it).
  void onScoreRef;

  return { state, step, flap };
}
