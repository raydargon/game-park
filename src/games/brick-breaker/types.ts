// Brick Breaker — shared types.
//
// Coordinates are in canvas pixels with origin at the top-left of
// the playfield. The ball uses a center-position `Vec2`; bricks use
// top-left AABBs (`Brick`). The tri-state status drives the canvas
// overlays and the in-loop short-circuit (no point ticking physics
// when the ball is glued to the paddle or the game is over).
export type Vec2 = { x: number; y: number };

export type Brick = {
  /** Top-left x in canvas pixels. */
  x: number;
  /** Top-left y in canvas pixels. */
  y: number;
  /** Width in canvas pixels. */
  w: number;
  /** Height in canvas pixels. */
  h: number;
  /** True while the brick is still in play. */
  alive: boolean;
  /** Hex color for the renderer. Set when the brick is spawned so
   *  the render loop doesn't have to recompute it on every frame. */
  color: string;
  /** Points awarded when this brick is broken. Top rows = more points. */
  points: number;
};

export type BrickBreakerStatus = 'ready' | 'running' | 'gameover' | 'levelclear';

export type BrickBreakerState = {
  ball: Vec2;
  /** Ball velocity in pixels per second. */
  ballVel: Vec2;
  /** Paddle top-left x in canvas pixels. */
  paddleX: number;
  /** 2D grid of bricks indexed `[row][col]`. */
  bricks: Brick[][];
  score: number;
  lives: number;
  /** 1-indexed; advances when the grid is cleared. */
  level: number;
  /** Total bricks broken this run (resets on remount). Used to
   *  feed the lifetime `totalBricksCleared` counter in the
   *  store for the `brick-1000` achievement (AC-11). */
  bricksClearedThisRun: number;
  status: BrickBreakerStatus;
};
