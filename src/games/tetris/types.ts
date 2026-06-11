// Tetris — shared types.
//
// Grid coordinates use a (col, row) / (x, y) cell space. The board
// is 10 wide × 20 tall; cells above the visible top (y < 0) are
// allowed so a piece can spawn partially off-screen.

export type Cell = { x: number; y: number };

/** The seven standard tetrominoes (PRD §7). */
export type TetrominoId = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** 0 = spawn, 1 = right (R), 2 = 180, 3 = left (L). */
export type Rotation = 0 | 1 | 2 | 3;

/** A tetromino positioned in the playfield. */
export type Tetromino = {
  id: TetrominoId;
  rotation: Rotation;
  /** Top-left column of the piece's 4x4 bounding box. */
  x: number;
  /** Top-left row of the piece's 4x4 bounding box. */
  y: number;
  /** Cell offsets (from `x`,`y`) for the current rotation. The hook
   *  re-derives this from `TETROMINOES[id][rotation]` whenever the
   *  piece rotates — we cache it on the piece so the rAF draw
   *  loop doesn't have to re-look-up on every frame. */
  cells: Cell[];
};

/** A 20×10 grid of cell occupants. `null` = empty. */
export type Board = (TetrominoId | null)[][];

export type TetrisStatus = 'ready' | 'running' | 'gameover';

export type TetrisState = {
  board: Board;
  active: Tetromino | null;
  /** Queue of upcoming piece ids — the first `PREVIEW_COUNT` (3) are
   *  drawn in the "Next" side panel. */
  next: TetrominoId[];
  /** The held piece, or `null` if the player hasn't held yet. */
  hold: TetrominoId | null;
  /** `true` once the player has used their per-piece hold; reset
   *  when the next piece spawns. */
  holdUsed: boolean;
  /** Remaining ids in the current 7-bag. */
  bag: TetrominoId[];
  /** Monotonically-increasing seed for the next bag shuffle. */
  bagSeed: number;
  score: number;
  lines: number;
  level: number;
  status: TetrisStatus;
};
