// Brick Breaker — game constants.
//
// The playfield is a 480×640 portrait canvas. 8 rows × 10 columns
// of bricks (PRD §7). The ball starts slow and gets faster each
// level; everything is in pixels / seconds so the renderer's
// `deltaMs → dt` conversion is a single divide.
import type { Brick } from './types';

/** Canvas pixel dimensions (portrait, classic Arkanoid-ish). */
export const CANVAS_W = 480;
export const CANVAS_H = 640;

/** 8 rows × 10 columns of bricks (PRD §7). */
export const BRICK_ROWS = 8;
export const BRICK_COLS = 10;

/** Outer margin between the brick field and the playfield edge. */
export const BRICK_FIELD_PADDING_X = 12;
export const BRICK_FIELD_PADDING_Y = 64;
/** Padding between adjacent bricks. */
export const BRICK_GAP = 4;
/** Computed brick width: distributed evenly across the field. */
export const BRICK_W =
  (CANVAS_W - BRICK_FIELD_PADDING_X * 2 - BRICK_GAP * (BRICK_COLS - 1)) /
  BRICK_COLS;
export const BRICK_H = 18;

/** Paddle size + position. */
export const PADDLE_W = 96;
export const PADDLE_H = 12;
/** Distance from the bottom of the canvas to the top of the paddle. */
export const PADDLE_OFFSET_FROM_BOTTOM = 36;
export const PADDLE_Y = CANVAS_H - PADDLE_OFFSET_FROM_BOTTOM - PADDLE_H;
/** Paddle travel speed in px/s. */
export const PADDLE_SPEED = 560;

/** Ball radius (drawn as a circle). */
export const BALL_R = 7;
/** Initial ball speed at level 1. */
export const BALL_BASE_SPEED = 320;
/** Per-level speed bump. */
export const BALL_SPEED_STEP = 36;
/** Hard cap so the ball never moves faster than the frame budget. */
export const BALL_MAX_SPEED = 720;
/** Minimum |vy| so a perfect horizontal bounce can't happen — keeps
 *  the game from getting stuck in an endless horizontal loop. */
export const BALL_MIN_VERTICAL = 90;

/** Lives the player starts with. */
export const LIVES_START = 3;

/** Points awarded per brick. The hook scales by row (top = 50, bottom = 10). */
export const POINTS_TOP_ROW = 50;
export const POINTS_BOTTOM_ROW = 10;

/** Row colors — cycle through the fantasy palette so the field
 *  reads as a colorful wall even before the player breaks anything. */
export const ROW_COLORS: readonly string[] = [
  '#FFD6EC', // fantasy-pink  (top)
  '#FFF4B8', // fantasy-cream
  '#D7FFD9', // fantasy-green
  '#B8E8FC', // fantasy-blue
  '#5BC0BE', // night-glow
  '#FFD6EC', // fantasy-pink
  '#FFF4B8', // fantasy-cream
  '#B8E8FC', // fantasy-blue  (bottom)
] as const;

/** Paddle and ball colors. */
export const COLORS = {
  background: '#2B2D42', // night-deep
  backgroundStrip: '#3A506B', // night-dusk
  paddle: '#FFF4B8', // fantasy-cream
  paddleOutline: '#FFD6EC', // fantasy-pink
  ball: '#FFD6EC', // fantasy-pink
  ballGlow: 'rgba(255, 214, 236, 0.55)',
  ballTrail: 'rgba(255, 214, 236, 0.2)',
  text: '#FFF5E4', // sky-sunset
  accent: '#5BC0BE', // night-glow
} as const;

/** Build the initial brick field for a given level. The 2D array
 *  is indexed `[row][col]`. All bricks start alive. */
export function buildBricks(): Brick[][] {
  const rows: Brick[][] = [];
  for (let r = 0; r < BRICK_ROWS; r += 1) {
    const row: Brick[] = [];
    const color = ROW_COLORS[r % ROW_COLORS.length] ?? COLORS.accent;
    // Top rows are worth more than bottom rows. Linear scale.
    const t = r / (BRICK_ROWS - 1);
    const points = Math.round(
      POINTS_BOTTOM_ROW + (POINTS_TOP_ROW - POINTS_BOTTOM_ROW) * (1 - t),
    );
    for (let c = 0; c < BRICK_COLS; c += 1) {
      const x = BRICK_FIELD_PADDING_X + c * (BRICK_W + BRICK_GAP);
      const y = BRICK_FIELD_PADDING_Y + r * (BRICK_H + BRICK_GAP);
      row.push({ x, y, w: BRICK_W, h: BRICK_H, alive: true, color, points });
    }
    rows.push(row);
  }
  return rows;
}

/** Ball starting position: centered on the paddle, just above it. */
export function ballStartOnPaddle(paddleX: number): { x: number; y: number } {
  return {
    x: paddleX + PADDLE_W / 2,
    y: PADDLE_Y - BALL_R - 1,
  };
}

/** Initial ball velocity — straight up with a slight horizontal lean
 *  to the right so the first frame of motion is visible. */
export function initialBallVelocity(): { vx: number; vy: number } {
  const speed = BALL_BASE_SPEED;
  const lean = 60; // px/s
  return { vx: lean, vy: -Math.sqrt(speed * speed - lean * lean) };
}
