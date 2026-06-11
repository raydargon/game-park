// Crystal Mine (2048) — shared types.
//
// Coordinates use (row, col) cell space. The board is 4×4. Tile
// values are constrained to powers of two — see the union below
// (the highest reachable in a single game is well under 8192, but
// the union includes it for completeness and future-proofing).

export type Cell = { row: number; col: number };

/** The set of tile values that can appear on the board. */
export type TileValue =
  | 2
  | 4
  | 8
  | 16
  | 32
  | 64
  | 128
  | 256
  | 512
  | 1024
  | 2048
  | 4096
  | 8192;

export type Tile = {
  /** Stable id (used by Framer Motion `layout` to animate the
   *  slide). Generated once at spawn time; never re-used. */
  id: string;
  row: number;
  col: number;
  value: TileValue;
  /** `true` on the turn this tile was upgraded by a merge. Used
   *  to fire a one-shot pop animation. Cleared on the next move. */
  justMerged: boolean;
};

export type Crystal2048Status = 'running' | 'gameover';

export type Crystal2048State = {
  tiles: Tile[];
  score: number;
  /** The highest tile value reached this run (used for the
   *  achievement watcher in AC-11). */
  bestTile: TileValue;
  status: Crystal2048Status;
};
