// Tetris — game constants.
//
// All tetromino shapes are stored as 4×4 grids so a single
// `TETROMINOES[id][rotation]` lookup produces the cell offsets for
// any piece in any of its four rotations. The I-piece uses the
// full 4×4 (it occupies 4 cells in a row OR column); the O-piece
// is a 2×2 square that looks the same in every rotation but is
// still indexed in the 4×4 grid for uniformity.
import type { Cell, TetrominoId } from './types';

/** Playfield dimensions (PRD §7). */
export const BOARD_W = 10;
export const BOARD_H = 20;

/** CSS pixels per cell. Canvas is 280×560. */
export const CELL_SIZE = 28;

/** Canvas pixel dimensions. */
export const CANVAS_W = BOARD_W * CELL_SIZE; // 280
export const CANVAS_H = BOARD_H * CELL_SIZE; // 560

/** How many upcoming pieces to show in the "Next" panel. */
export const PREVIEW_COUNT = 3;

/** How many pieces to keep in the queue buffer (drawn + held + on-deck). */
export const QUEUE_SIZE = 6;

/** Score table — index by lines cleared simultaneously. */
export const LINE_SCORES: readonly number[] = [0, 100, 300, 500, 800] as const;

/** Lines per level-up. */
export const LINES_PER_LEVEL = 10;

/** Points awarded per row of soft drop / hard drop. */
export const SOFT_DROP_POINTS = 1;
export const HARD_DROP_POINTS = 2;

/** Gravity schedule. Each level multiplies the per-row interval by
 *  `GRAVITY_FACTOR` (faster), floored at `MIN_GRAVITY_MS`. */
export const BASE_GRAVITY_MS = 800;
export const MIN_GRAVITY_MS = 80;
export const GRAVITY_FACTOR = 0.82;

/** Soft-drop is a 20× speed-up while the player holds Down. */
export const SOFT_DROP_GRAVITY_MS = 35;

/** SRS-lite wall-kick table: when a rotation would collide, try
 *  these (dx, dy) offsets in order. The piece's top-left x/y is
 *  shifted by each pair; if any one of them produces a non-colliding
 *  position, the rotation succeeds at that offset. */
export const WALL_KICKS: readonly { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -2, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: -1 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
] as const;

/** Spawn position for a new piece: roughly centered horizontally,
 *  just above the visible top (negative y is allowed so the piece
 *  can drift down into the playfield). */
export const SPAWN_X = 3;
export const SPAWN_Y = -1;

/** Tetromino shapes — `TETROMINOES[id][rotation]` returns the four
 *  cell offsets for that piece in that rotation. Each shape fits in
 *  a 4×4 bounding box (the O-piece is a 2×2 square that lives in
 *  the same indices across all four rotations). */
export const TETROMINOES: Record<TetrominoId, Cell[][]> = {
  I: [
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ],
    [
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
    ],
  ],
  O: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  ],
  T: [
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  S: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  Z: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
    ],
  ],
  J: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  ],
  L: [
    [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
};

/** Fantasy-palette colors per piece. Saturated enough to read on
 *  the night-deep background; outline color is shared. */
export const PIECE_COLORS: Record<TetrominoId, string> = {
  I: '#5BC0BE', // night-glow
  O: '#FFF4B8', // fantasy-cream
  T: '#D7FFD9', // fantasy-green
  S: '#B8E8FC', // fantasy-blue
  Z: '#FFD6EC', // fantasy-pink
  J: '#3A506B', // night-dusk (deep blue)
  L: '#FFB57A', // warm amber (fantasy cream's orange neighbor)
};

/** Shared outline color for cell rendering. */
export const PIECE_OUTLINE = 'rgba(255, 255, 255, 0.35)';

/** Per-row gravity interval (ms) for a given level. */
export function gravityForLevel(level: number): number {
  if (level <= 1) return BASE_GRAVITY_MS;
  return Math.max(MIN_GRAVITY_MS, BASE_GRAVITY_MS * Math.pow(GRAVITY_FACTOR, level - 1));
}
