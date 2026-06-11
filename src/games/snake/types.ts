// Snake — shared types.
//
// `Cell` uses `{x, y}` with origin at the top-left of the grid (matches
// CanvasRenderingContext2D coordinates). `Direction` enumerates the
// four cardinal movement vectors. `SnakeStatus` is a tri-state: a
// fresh game starts in `'running'`; the game-over overlay replaces
// the canvas interaction layer when status flips to `'gameover'`.

export type Cell = { x: number; y: number };

export type Direction = 'up' | 'down' | 'left' | 'right';

export type SnakeStatus = 'running' | 'gameover';

export type SnakeState = {
  /** Ordered head-to-tail. `snake[0]` is the head. */
  snake: Cell[];
  /** Direction committed at the last `step()`. */
  direction: Direction;
  /** Direction queued for the *next* `step()` so a rapid double-tap
   *  within one tick cannot fold back to the opposite axis. */
  pendingDirection: Direction | null;
  food: Cell;
  score: number;
  /** Total food eaten so far. Drives the speed curve
   *  (every `FOOD_PER_SPEEDUP` items the tick interval shrinks). */
  foodEaten: number;
  status: SnakeStatus;
};
