// Crystal Mine (2048) — pure grid helpers.
//
// All four move directions share the same slide-and-merge logic;
// we just rotate the grid 0/90/180/270° so the always-left pass
// works for all of them. The helpers here operate on a
// (row, col) value grid, *not* on `Tile` — the hook reconciles
// ids after the move so Framer Motion's `layout` animation can
// track the surviving tiles.
import { GRID_SIZE } from './constants';
import type { Cell, Tile, TileValue } from './types';

export type ValueGrid = (TileValue | null)[][];

/** Empty 4×4 grid. */
export function makeEmptyGrid(): ValueGrid {
  const g: ValueGrid = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    const row: (TileValue | null)[] = [];
    for (let c = 0; c < GRID_SIZE; c += 1) {
      row.push(null);
    }
    g.push(row);
  }
  return g;
}

/** Build a 4×4 value grid from the current tile list. */
export function tilesToGrid(tiles: Tile[]): ValueGrid {
  const g = makeEmptyGrid();
  for (const t of tiles) {
    if (t.row < 0 || t.row >= GRID_SIZE || t.col < 0 || t.col >= GRID_SIZE) continue;
    g[t.row]![t.col] = t.value;
  }
  return g;
}

/** Rotate a grid 90° clockwise `times` times. */
export function rotateGrid(g: ValueGrid, times: number): ValueGrid {
  let cur = g;
  for (let t = 0; t < ((times % 4) + 4) % 4; t += 1) {
    const next: ValueGrid = makeEmptyGrid();
    for (let r = 0; r < GRID_SIZE; r += 1) {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        // (r, c) → (c, N-1-r)
        next[c]![GRID_SIZE - 1 - r] = cur[r]![c];
      }
    }
    cur = next;
  }
  return cur;
}

/** Slide a single row to the left, merging adjacent equal pairs.
 *  Returns the new row plus the list of (col, newValue) pairs that
 *  were produced by merges — the hook uses this to flag the
 *  surviving tiles as `justMerged: true` for the pop animation. */
export function slideRowLeft(
  row: (TileValue | null)[],
): { row: (TileValue | null)[]; merges: { col: number; newValue: TileValue }[] } {
  const compact: TileValue[] = [];
  for (const v of row) {
    if (v !== null) compact.push(v);
  }
  const out: (TileValue | null)[] = new Array(GRID_SIZE).fill(null);
  const merges: { col: number; newValue: TileValue }[] = [];
  let writeIdx = 0;
  let i = 0;
  while (i < compact.length) {
    const cur = compact[i]!;
    const nxt = compact[i + 1];
    if (nxt !== undefined && cur === nxt) {
      const newValue = (cur * 2) as TileValue;
      out[writeIdx] = newValue;
      merges.push({ col: writeIdx, newValue });
      writeIdx += 1;
      i += 2;
    } else {
      out[writeIdx] = cur;
      writeIdx += 1;
      i += 1;
    }
  }
  return { row: out, merges };
}

/** Apply a slide-and-merge pass in the given direction. Returns
 *  the new grid plus the list of merge events with their
 *  (row, col, newValue) positions. */
export function slideAndMerge(
  g: ValueGrid,
  direction: 'left' | 'right' | 'up' | 'down',
): { grid: ValueGrid; merges: { row: number; col: number; newValue: TileValue }[] } {
  // Rotate so we can always slide "left", then rotate back.
  const rotation = { left: 0, up: 3, right: 2, down: 1 }[direction];
  const rotated = rotateGrid(g, rotation);

  const merges: { row: number; col: number; newValue: TileValue }[] = [];
  const newRotated: ValueGrid = makeEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r += 1) {
    const { row, merges: rowMerges } = slideRowLeft(rotated[r]!);
    newRotated[r] = row;
    for (const m of rowMerges) {
      // Convert (row, col) in the rotated space back to the
      // original space. We rotated by `rotation` 90° CW steps,
      // so the inverse is `4 - rotation`.
      const orig = rotateCell(r, m.col, 4 - rotation);
      merges.push({ row: orig.row, col: orig.col, newValue: m.newValue });
    }
  }

  // Undo the rotation to get back to the original orientation.
  const grid = rotateGrid(newRotated, 4 - rotation);
  return { grid, merges };
}

/** Inverse of `rotateGrid` for a single cell. */
function rotateCell(row: number, col: number, rotation: number): { row: number; col: number } {
  let r = row;
  let c = col;
  for (let t = 0; t < ((rotation % 4) + 4) % 4; t += 1) {
    const nr = c;
    const nc = GRID_SIZE - 1 - r;
    r = nr;
    c = nc;
  }
  return { row: r, col: c };
}

/** Are two grids equal? */
export function gridsEqual(a: ValueGrid, b: ValueGrid): boolean {
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (a[r]![c] !== b[r]![c]) return false;
    }
  }
  return true;
}

/** Collect all empty cells in the grid. */
export function getEmptyCells(g: ValueGrid): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (g[r]![c] === null) cells.push({ row: r, col: c });
    }
  }
  return cells;
}

/** Pick a random element from a non-empty array. */
export function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

/** Can any direction make a move from this grid?
 *  Used for the game-over check. */
export function canAnyMove(g: ValueGrid): boolean {
  // An empty cell means we can always slide something.
  if (getEmptyCells(g).length > 0) return true;
  // Check for any adjacent equal pair (horizontally or vertically).
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const v = g[r]![c];
      if (v === null) continue;
      if (c + 1 < GRID_SIZE && g[r]![c + 1] === v) return true;
      if (r + 1 < GRID_SIZE && g[r + 1]![c] === v) return true;
    }
  }
  return false;
}
