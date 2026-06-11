// Crystal Mine (2048) — game constants.
//
// The playfield is a 4×4 grid of 84×84 px cells with 12px gutters,
// wrapped in a 16px padding. The tile colors map the standard
// 2048 progression to the dreamplay fantasy palette (PRD §7).
import type { Cell, Tile, TileValue } from './types';

/** Playfield dimensions. */
export const GRID_SIZE = 4;
export const CELL_SIZE = 84;
export const CELL_GAP = 12;
export const PADDING = 16;

/** Canvas-equivalent pixel dimensions. */
export const BOARD_W = PADDING * 2 + GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * CELL_GAP;
export const BOARD_H = BOARD_W;

/** Score threshold at which the spawn rate of "4" tiles jumps
 *  (PRD §7). Below this, only ~10% of spawns are 4s; above it,
 *  ~25%. */
export const SPAWN_4_THRESHOLD = 200;
export const SPAWN_4_RATE_BELOW = 0.1;
export const SPAWN_4_RATE_ABOVE = 0.25;

/** Fantasy-palette colors per tile value. PRD §7 calls for 2→cream,
 *  4→pink, 8→blue, 16→green, 32+→"deep fantasy" — we keep that
 *  mapping for the lower values and reuse the rest of the palette
 *  (and a couple of complementary warm tones) for the higher ones. */
export const TILE_COLORS: Record<TileValue, { bg: string; text: string }> = {
  2: { bg: '#FFF4B8', text: '#2B2D42' },     // fantasy-cream
  4: { bg: '#FFD6EC', text: '#2B2D42' },     // fantasy-pink
  8: { bg: '#B8E8FC', text: '#2B2D42' },     // fantasy-blue
  16: { bg: '#D7FFD9', text: '#2B2D42' },    // fantasy-green
  32: { bg: '#A8E0FF', text: '#2B2D42' },    // bright blue
  64: { bg: '#5BC0BE', text: '#FFF5E4' },    // night-glow
  128: { bg: '#3A506B', text: '#FFF5E4' },   // night-dusk
  256: { bg: '#FFB57A', text: '#2B2D42' },   // warm amber
  512: { bg: '#FFA177', text: '#2B2D42' },   // warm orange
  1024: { bg: '#9B7EDE', text: '#FFF5E4' },  // dusty purple
  2048: { bg: '#6B5BFF', text: '#FFF5E4' },  // deep purple
  4096: { bg: '#FF7DA0', text: '#FFF5E4' },  // hot pink
  8192: { bg: '#E25C9C', text: '#FFF5E4' },  // magenta
};

/** Tile font size shrinks as the digit count grows so the number
 *  always fits the cell. */
export function fontSizeForValue(value: TileValue): number {
  const digits = String(value).length;
  if (digits <= 2) return 38;
  if (digits === 3) return 30;
  if (digits === 4) return 24;
  return 20;
}

/** Tile font weight — heavier numbers for the low values, regular
 *  for the eye-crossing high ones. */
export function fontWeightForValue(value: TileValue): number {
  if (value <= 64) return 800;
  if (value <= 1024) return 700;
  return 700;
}

/** Compute pixel offsets for a (row, col) inside the playfield. */
export function cellPosition(row: number, col: number): { left: number; top: number } {
  return {
    left: PADDING + col * (CELL_SIZE + CELL_GAP),
    top: PADDING + row * (CELL_SIZE + CELL_GAP),
  };
}

/** Whether a fresh "2" or "4" should be spawned given the current
 *  score. Returns the value to spawn. */
export function pickSpawnValue(score: number): TileValue {
  const rate = score >= SPAWN_4_THRESHOLD ? SPAWN_4_RATE_ABOVE : SPAWN_4_RATE_BELOW;
  return Math.random() < rate ? 4 : 2;
}

/** Background of the playfield, behind the tiles. */
export const COLORS = {
  board: '#3A506B',       // night-dusk
  cell: 'rgba(255, 255, 255, 0.06)',
  cellRadius: 12,
  text: '#FFF5E4',        // sky-sunset
} as const;

/** Default starting state — two starter tiles. */
export function createInitialTiles(): Tile[] {
  const a: Cell = { row: 0, col: 0 };
  const b: Cell = { row: 2, col: 2 };
  return [
    {
      id: 'seed-a',
      row: a.row,
      col: a.col,
      value: 2,
      justMerged: false,
    },
    {
      id: 'seed-b',
      row: b.row,
      col: b.col,
      value: 2,
      justMerged: false,
    },
  ];
}
