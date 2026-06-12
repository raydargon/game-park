// Flappy Wings — shared types.
//
// The bird lives in a continuous pixel space (no grid). Coordinates
// use canvas (x right, y down) units. The status machine mirrors
// the post-AC-1 tetris pattern: only `'running' | 'gameover'` —
// the hook starts in `'running'` so the first gravity tick falls
// through the running-gate cleanly.

/** Physics state of the bird. */
export type Bird = {
  /** Horizontal position (px from the canvas's left edge). */
  x: number;
  /** Vertical position (px from the canvas's top edge). */
  y: number;
  /** Vertical velocity in px/frame. Negative = up. */
  vy: number;
};

/** A single scrolling pipe pair. The pair is parameterised by
 *  the *center* of the vertical gap (`gapY`) — the renderer / hook
 *  derive the top and bottom rects from this. */
export type Pipe = {
  /** A stable identifier so we never confuse two pipes that share
   *  the same x at the moment of scoring. */
  id: number;
  /** Left edge of the pipe in canvas x (px). */
  x: number;
  /** Vertical center of the open gap (px). The top pipe covers
   *  `0 .. gapY - PIPE_GAP/2`; the bottom pipe covers
   *  `gapY + PIPE_GAP/2 .. FLOOR_Y`. */
  gapY: number;
  /** True once the bird has cleared this pipe (right edge has
   *  passed the bird's x) — used to avoid double-scoring. */
  scored: boolean;
};

export type FlappyStatus = 'running' | 'gameover';

export type FlappyState = {
  bird: Bird;
  /** Active pipe pairs, ordered by their `x`. New pipes are
   *  appended to the right; off-screen pipes are pruned on the
   *  left each step. */
  pipes: Pipe[];
  /** Number of pipe pairs the bird has successfully cleared in
   *  this run. */
  score: number;
  status: FlappyStatus;
};
