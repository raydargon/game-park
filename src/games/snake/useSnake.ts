// useSnake — pure logic hook for Snake.
//
// Owns the `SnakeState` and exposes:
//   * `state`       — the current state (immutable across renders).
//   * `step()`      — advance the simulation by one cell.
//   * `setDirection(d)` — queue a direction change for the next step.
//   * `tickMs`      — the current step interval, derived from the
//                     food-eaten count (every FOOD_PER_SPEEDUP items
//                     the tick speeds up by SPEED_STEP_MS, down to
//                     MIN_TICK_MS).
//
// Reporting model:
//   * `onScore` and `onGameOver` are stored in refs and called from
//     `useEffect`s that watch the relevant state slice. This keeps
//     the setState reducers free of side effects (StrictMode-safe)
//     and means the caller can swap the callbacks at any time
//     without having to memoize.
//
// Determinism:
//   * Food is spawned by `spawnFood` which scans the grid for free
//     cells and picks one with a small linear PRNG. The PRNG is
//     seeded from `state.score + state.foodEaten` so a given sequence
//     of moves produces the same food layout — helpful for tests.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { GameId } from '../registry';
import {
  DIRECTION_DELTAS,
  FOOD_PER_SPEEDUP,
  GRID_SIZE,
  INITIAL_DIRECTION,
  INITIAL_SNAKE,
  INITIAL_TICK_MS,
  MIN_TICK_MS,
  OPPOSITE,
  SCORE_PER_FOOD,
  SPEED_STEP_MS,
} from './constants';
import type { Cell, Direction, SnakeState } from './types';

export type UseSnakeArgs = {
  /** Game id (e.g. `'snake'`). Used to mark the game as played
   *  for the `park-explorer` achievement (AC-11). */
  gameId?: GameId;
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
};

export type UseSnakeResult = {
  state: SnakeState;
  step: () => void;
  setDirection: (next: Direction) => void;
  tickMs: number;
};

function createInitialState(): SnakeState {
  // Copy the readonly initial snake so later `.push` / mutation
  // steps don't leak into the shared constant.
  const snake: Cell[] = INITIAL_SNAKE.map((c) => ({ x: c.x, y: c.y }));
  return {
    snake,
    direction: INITIAL_DIRECTION,
    pendingDirection: null,
    food: pickFoodFor(snake, 0),
    score: 0,
    foodEaten: 0,
    status: 'running',
  };
}

/** Small LCG so the food layout is reproducible per (score, foodEaten).
 *  Not cryptographic — just enough determinism for snapshot tests. */
function pseudoRandom(seed: number): number {
  // mulberry32-ish: good enough for picking among ~400 cells.
  const t = (seed * 9301 + 49297) % 233280;
  return t / 233280;
}

function pickFoodFor(snake: readonly Cell[], seed: number): Cell {
  const occupied = new Set(snake.map((c) => `${c.x},${c.y}`));
  const free: Cell[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) {
    // Snake fills the board — give it back the head's cell as a
    // sentinel. The collision check on the next step will end the
    // game naturally.
    return { x: -1, y: -1 };
  }
  const idx = Math.floor(pseudoRandom(seed + 1) * free.length) % free.length;
  return free[idx]!;
}

export function useSnake({
  gameId,
  onScore,
  onGameOver,
}: UseSnakeArgs): UseSnakeResult {
  const [state, setState] = useState<SnakeState>(createInitialState);

  // Mirror the callbacks into refs so the step function stays stable
  // and the score/game-over effects see the latest closure.
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  // Tracks the most recent score we already reported. Avoids
  // re-firing on every render and protects against the StrictMode
  // double-invocation of the effect below.
  const lastReportedScoreRef = useRef(0);
  const lastReportedGameOverRef = useRef(false);

  const setDirection = useCallback((next: Direction) => {
    setState((s) => {
      if (s.status !== 'running') return s;
      // Reject U-turns (would fold into the neck) and no-ops.
      if (OPPOSITE[next] === s.direction) return s;
      if (next === s.direction) return s;
      return { ...s, pendingDirection: next };
    });
  }, []);

  const step = useCallback(() => {
    setState((s) => {
      if (s.status !== 'running') return s;
      const dir = s.pendingDirection ?? s.direction;
      const delta = DIRECTION_DELTAS[dir];
      const head = s.snake[0]!;
      const newHead: Cell = { x: head.x + delta.x, y: head.y + delta.y };

      // Wall collision: head went outside the grid.
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        return { ...s, direction: dir, pendingDirection: null, status: 'gameover' };
      }

      // Self collision: head entered a cell currently occupied by
      // the body. If we're about to grow this tick (food at newHead),
      // the tail will move out of the way — so we exclude the tail
      // from the collision check.
      const ate = newHead.x === s.food.x && newHead.y === s.food.y;
      const bodyToCheck = ate ? s.snake : s.snake.slice(0, -1);
      for (const cell of bodyToCheck) {
        if (cell.x === newHead.x && cell.y === newHead.y) {
          return { ...s, direction: dir, pendingDirection: null, status: 'gameover' };
        }
      }

      // Move: prepend the new head, drop the tail (unless we ate).
      const newSnake: Cell[] = ate
        ? [newHead, ...s.snake]
        : [newHead, ...s.snake.slice(0, -1)];

      if (!ate) {
        return {
          ...s,
          snake: newSnake,
          direction: dir,
          pendingDirection: null,
        };
      }

      const newScore = s.score + SCORE_PER_FOOD;
      const newFoodEaten = s.foodEaten + 1;
      return {
        ...s,
        snake: newSnake,
        direction: dir,
        pendingDirection: null,
        food: pickFoodFor(newSnake, newScore * 31 + newFoodEaten),
        score: newScore,
        foodEaten: newFoodEaten,
      };
    });
  }, []);

  // Report score changes through the side-channel. The state setter
  // above is pure, so the *only* place that calls onScore is here.
  useEffect(() => {
    if (state.score > lastReportedScoreRef.current) {
      lastReportedScoreRef.current = state.score;
      onScoreRef.current(state.score);
    }
  }, [state.score]);

  // Report game-over exactly once per game.
  useEffect(() => {
    if (state.status === 'gameover' && !lastReportedGameOverRef.current) {
      lastReportedGameOverRef.current = true;
      onGameOverRef.current(state.score);
      // AC-11: mark this game as played for the `park-explorer`
      // achievement. The store call is idempotent so a duplicate
      // (e.g. StrictMode double-invoke) is harmless.
      if (gameId) useGameStore.getState().markGamePlayed(gameId);
    }
    if (state.status === 'running' && lastReportedGameOverRef.current) {
      // Re-mount / restart — reset the latch.
      lastReportedGameOverRef.current = false;
      lastReportedScoreRef.current = 0;
    }
  }, [state.status, state.score, gameId]);

  // Tick interval shrinks every FOOD_PER_SPEEDUP food. Floors at
  // MIN_TICK_MS so the snake never moves faster than the canvas can
  // redraw.
  const speedSteps = Math.floor(state.foodEaten / FOOD_PER_SPEEDUP);
  const tickMs = Math.max(
    MIN_TICK_MS,
    INITIAL_TICK_MS - speedSteps * SPEED_STEP_MS,
  );

  return { state, step, setDirection, tickMs };
}
