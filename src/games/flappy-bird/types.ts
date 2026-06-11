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

export type FlappyStatus = 'running' | 'gameover';

export type FlappyState = {
  bird: Bird;
  status: FlappyStatus;
};
