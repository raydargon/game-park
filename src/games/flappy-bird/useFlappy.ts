// useFlappy — pure logic hook for Flappy Wings.
//
// State machine: `'running' | 'gameover'`. The hook starts in
// `'running'`; the game loop dispatches `step(deltaMs)` on every
// animation frame, which:
//   1. Advances the bird (gravity → integrate y).
//   2. Advances the pipe field (scroll left, prune off-screen, spawn
//      new pairs on a `PIPE_SPAWN_INTERVAL_MS` cadence).
//   3. Resolves bird↔pipe and bird↔ceiling/floor collisions.
//   4. Bumps the score for every pipe pair the bird has just cleared.
//
//   * `step(deltaMs)` — advance the simulation by one frame.
//                      `deltaMs` is the wall-clock time since the
//                      previous frame (capped inside `useGameLoop`).
//                      Default 0 is harmless; it just means
//                      time-based pipe spawning is skipped.
//   * `flap()` — apply an upward velocity impulse (Space/ArrowUp).
//   * `reset()` is *not* exposed: the GameShell re-mounts the game
//     via `key={restartKey}` on Restart, so the hook re-initialises
//     fresh state via `createInitialState`.
//
// All side effects (`onScore`, `onGameOver`, `markGamePlayed`) flow
// through refs + a useEffect so the setState reducers stay pure
// (StrictMode-safe). Latches (`lastReportedScoreRef`,
// `lastReportedGameOverRef`) are re-initialised on every remount,
// so a Restart zeroes the call counts and `onGameOver` fires
// exactly once per run with the final score.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { GameId } from '../registry';
import {
  BIRD_R,
  BIRD_X,
  CANVAS_W,
  FLOOR_Y,
  FLAP_VY,
  GRAVITY,
  MAX_PIPE_STEP_PX,
  MAX_VY,
  PIPE_GAP,
  PIPE_MAX_GAP_Y,
  PIPE_MIN_GAP_Y,
  PIPE_SPAWN_INTERVAL_MS,
  PIPE_SPEED,
  PIPE_W,
} from './constants';
import type { FlappyState, Pipe } from './types';

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
  /** Per-frame physics tick: gravity + pipe field + collisions. */
  step: (deltaMs?: number) => void;
  /** Give the bird an upward velocity impulse. No-op at gameover. */
  flap: () => void;
};

let nextPipeId = 1;

/** Pick a `gapY` somewhere in `[PIPE_MIN_GAP_Y, PIPE_MAX_GAP_Y]`
 *  using a small linear PRNG so the run is reproducible per
 *  `pipeId` (handy for snapshot tests). */
function pickGapY(seed: number): number {
  // mulberry32-ish, same idea as useSnake.pseudoRandom.
  const t = (seed * 9301 + 49297) % 233280;
  const r = t / 233280;
  const span = PIPE_MAX_GAP_Y - PIPE_MIN_GAP_Y;
  return Math.floor(PIPE_MIN_GAP_Y + r * span);
}

function createInitialState(): FlappyState {
  return {
    bird: {
      // Spawn the bird centered vertically so the player has time
      // to react to the first gravity tick.
      x: BIRD_X,
      y: Math.floor(FLOOR_Y * 0.4),
      vy: 0,
    },
    pipes: [],
    score: 0,
    status: 'running',
  };
}

/** Test if the bird's circular hitbox overlaps a single pipe
 *  rectangle (top or bottom segment). The bird is treated as a
 *  circle of radius BIRD_R; the pipe as an AABB. */
function birdOverlapsPipe(
  birdX: number,
  birdY: number,
  pipeLeft: number,
  pipeTop: number,
  pipeRight: number,
  pipeBottom: number,
): boolean {
  // Closest point on the AABB to the bird center.
  const cx = Math.max(pipeLeft, Math.min(birdX, pipeRight));
  const cy = Math.max(pipeTop, Math.min(birdY, pipeBottom));
  const dx = birdX - cx;
  const dy = birdY - cy;
  return dx * dx + dy * dy <= BIRD_R * BIRD_R;
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

  // `pipeSpawnElapsed` tracks wall-clock time since the last spawn.
  // Lives in a ref so the setState reducer stays pure.
  const pipeSpawnElapsedRef = useRef(0);
  const lastReportedScoreRef = useRef(0);
  const lastReportedGameOverRef = useRef(false);

  const step = useCallback((deltaMs: number = 0) => {
    setState((s) => {
      if (s.status !== 'running') return s;

      // --- 1. Bird physics ---
      const newVy = Math.min(MAX_VY, s.bird.vy + GRAVITY);
      const newY = s.bird.y + newVy;

      // --- 2. Pipe scroll + spawn + despawn ---
      // Accumulate the spawn timer (clamped to avoid huge jumps
      // after a tab blur — `useGameLoop` already caps delta at
      // 100ms, but we add a second guard for callers passing
      // arbitrary values).
      const safeDelta = Math.max(0, Math.min(deltaMs, 100));
      pipeSpawnElapsedRef.current += safeDelta;

      // Move every pipe left. Cap the per-step move so a long
      // tab-blur can't teleport a pipe through the bird.
      const pipeMove = Math.min(PIPE_SPEED, MAX_PIPE_STEP_PX);
      let nextPipes: Pipe[] = s.pipes.map((p) => ({
        ...p,
        x: p.x - pipeMove,
      }));

      // Prune pipes that have scrolled fully off the left edge.
      nextPipes = nextPipes.filter((p) => p.x + PIPE_W >= 0);

      // Spawn a new pipe pair if the interval has elapsed.
      if (pipeSpawnElapsedRef.current >= PIPE_SPAWN_INTERVAL_MS) {
        pipeSpawnElapsedRef.current -= PIPE_SPAWN_INTERVAL_MS;
        const id = nextPipeId++;
        nextPipes = [
          ...nextPipes,
          {
            id,
            x: CANVAS_W,
            gapY: pickGapY(id),
            scored: false,
          },
        ];
      }

      // --- 3. Score: any pipe whose right edge has just passed
      //        the bird's x for the first time. ---
      let scoreDelta = 0;
      for (const p of nextPipes) {
        if (!p.scored && p.x + PIPE_W < s.bird.x) {
          p.scored = true;
          scoreDelta += 1;
        }
      }
      const newScore = s.score + scoreDelta;

      // --- 4. Collisions ---
      // 4a. Ceiling: bird center cannot go above BIRD_R.
      if (newY - BIRD_R < 0) {
        return {
          ...s,
          bird: { ...s.bird, y: BIRD_R, vy: 0 },
          pipes: nextPipes,
          score: newScore,
          status: 'gameover',
        };
      }
      // 4b. Floor: bird center cannot go below FLOOR_Y - BIRD_R.
      if (newY + BIRD_R >= FLOOR_Y) {
        return {
          ...s,
          bird: { ...s.bird, y: FLOOR_Y - BIRD_R, vy: 0 },
          pipes: nextPipes,
          score: newScore,
          status: 'gameover',
        };
      }
      // 4c. Pipes: any pipe whose pair sandwiches the bird center
      //     above (top rect) or below (bottom rect) the gap is a hit.
      for (const p of nextPipes) {
        const left = p.x;
        const right = p.x + PIPE_W;
        if (s.bird.x + BIRD_R < left || s.bird.x - BIRD_R > right) continue;
        const topBottom = p.gapY - PIPE_GAP / 2;
        const bottomTop = p.gapY + PIPE_GAP / 2;
        if (
          birdOverlapsPipe(s.bird.x, newY, left, 0, right, topBottom) ||
          birdOverlapsPipe(s.bird.x, newY, left, bottomTop, right, FLOOR_Y)
        ) {
          return {
            ...s,
            bird: { ...s.bird, y: newY, vy: newVy },
            pipes: nextPipes,
            score: newScore,
            status: 'gameover',
          };
        }
      }

      return {
        ...s,
        bird: { ...s.bird, y: newY, vy: newVy },
        pipes: nextPipes,
        score: newScore,
      };
    });
  }, []);

  const flap = useCallback(() => {
    setState((s) => {
      if (s.status !== 'running') return s;
      return { ...s, bird: { ...s.bird, vy: FLAP_VY } };
    });
  }, []);

  // Report every score change through a side-effect. The setState
  // reducer above is pure, so the *only* place that calls onScore
  // is here. `lastReportedScoreRef` is re-initialised to `0` on
  // every remount (Restart re-mounts via `key={restartKey}`), so
  // the first 0→1 transition of a fresh run re-fires onScore(1)
  // cleanly.
  useEffect(() => {
    if (state.score > lastReportedScoreRef.current) {
      lastReportedScoreRef.current = state.score;
      onScoreRef.current(state.score);
    }
  }, [state.score]);

  // Side-channel: report game-over through a useEffect
  // (StrictMode-safe). `lastReportedGameOverRef` is re-initialised
  // to `false` on every remount, so onGameOver fires exactly once
  // per run with the final `state.score` (not a hard-coded 0).
  useEffect(() => {
    if (state.status === 'gameover' && !lastReportedGameOverRef.current) {
      lastReportedGameOverRef.current = true;
      onGameOverRef.current(state.score);
      if (gameId) useGameStore.getState().markGamePlayed(gameId);
    }
  }, [state.status, state.score, gameId]);

  return { state, step, flap };
}
