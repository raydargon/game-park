// Snake — game constants. Centralized so balance tweaks land in one
// place and tests can import a stable reference.
import type { Cell, Direction } from './types';

/** Grid is a square `GRID_SIZE x GRID_SIZE`. 20×20 per PRD §7. */
export const GRID_SIZE = 20;

/** Width/height of a single cell, in CSS pixels, in the canvas. */
export const CELL_SIZE = 18;

/** Starting tick interval (ms between snake moves). */
export const INITIAL_TICK_MS = 140;

/** Hard floor on the tick interval — never faster than this. */
export const MIN_TICK_MS = 60;

/** How much the tick interval shrinks per `FOOD_PER_SPEEDUP` food. */
export const SPEED_STEP_MS = 10;

/** Every Nth food makes the snake a bit faster. PRD §7 says 5. */
export const FOOD_PER_SPEEDUP = 5;

/** Points awarded per food eaten. */
export const SCORE_PER_FOOD = 10;

/** Default starting snake (head → tail). Centered, three cells long. */
export const INITIAL_SNAKE: readonly Cell[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
] as const;

/** Default starting direction. */
export const INITIAL_DIRECTION: Direction = 'right';

/** Movement vector per direction. */
export const DIRECTION_DELTAS: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** Reverse-direction lookup — used to reject "instant U-turn" inputs
 *  that would otherwise fold the head into the neck cell. */
export const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

/** Palette colors used by the canvas renderer. All values are the
 *  hexes declared in `src/index.css` and `tailwind.config.ts`. */
export const COLORS = {
  background: '#2B2D42',          // night-deep
  grid: 'rgba(255, 245, 228, 0.06)', // sky-sunset @ 6%
  snakeHead: '#D7FFD9',          // fantasy-green
  snakeBody: '#B8E8FC',          // fantasy-blue
  snakeOutline: '#5BC0BE',       // night-glow
  food: '#FFD6EC',               // fantasy-pink
  foodGlow: 'rgba(255, 214, 236, 0.55)',
  text: '#FFF5E4',               // sky-sunset
} as const;

/** Canvas pixel dimensions (square). */
export const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
