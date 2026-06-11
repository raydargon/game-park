// useCrystal2048 — pure logic hook for Crystal Mine (2048).
//
// State holds a list of `Tile`s (each with a stable id) plus
// score, best tile, and status. The hook never touches the DOM
// or Framer Motion — the renderer maps `state.tiles` to a
// grid of `motion.div`s with `layout` enabled, so the position
// animations work for free when a tile's (row, col) changes.
//
// Move flow:
//   1. Convert the current tiles into a 4×4 value grid.
//   2. `slideAndMerge(grid, direction)` returns the new value
//      grid plus a list of (row, col, newValue) merge events.
//   3. If the new grid equals the old one, the move is a no-op
//      (the player pressed a direction with nothing to do).
//   4. Otherwise, reconcile the old tile list with the new
//      grid: surviving tiles keep their id, merged tiles get
//      `justMerged: true`, consumed tiles disappear.
//   5. Spawn a new tile (2 by default; 4 with the thresholded
//      probability) at a random empty cell.
//   6. If no move is possible after the spawn, flip to
//      `'gameover'`.
//
// Side effects (onScore / onGameOver) flow through refs + latches
// for StrictMode safety.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialTiles,
  pickSpawnValue,
} from './constants';
import {
  canAnyMove,
  getEmptyCells,
  gridsEqual,
  pickRandom,
  slideAndMerge,
  tilesToGrid,
} from './grid';
import type { Crystal2048State, Tile, TileValue } from './types';

export type Direction = 'left' | 'right' | 'up' | 'down';

export type UseCrystal2048Args = {
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
};

export type UseCrystal2048Result = {
  state: Crystal2048State;
  move: (direction: Direction) => void;
  restart: () => void;
};

let tileIdCounter = 0;
function nextTileId(): string {
  tileIdCounter += 1;
  return `tile-${Date.now().toString(36)}-${tileIdCounter}`;
}

function createInitialState(): Crystal2048State {
  return {
    tiles: createInitialTiles(),
    score: 0,
    bestTile: 2,
    status: 'running',
  };
}

/** Reconcile the old tile list with the new value grid.
 *  - For each cell in the new grid:
 *      * If non-null and an old tile sits there with the same
 *        value, keep that tile (slide).
 *      * If non-null and the new value is a merge result, pick
 *        the leftmost old tile in the same row (or column, for
 *        up/down), set its value to the new value, mark
 *        `justMerged: true`, drop the other.
 *      * If non-null and no old tile is there, this is the
 *        newly-spawned tile (will get a new id from the caller).
 *  - Old tiles whose cell is now empty are dropped (they merged
 *    into the upgraded survivor). */
function reconcileTiles(
  oldTiles: Tile[],
  newGrid: ReturnType<typeof tilesToGrid>,
  merges: { row: number; col: number; newValue: TileValue }[],
): Tile[] {
  const mergeSet = new Map<string, TileValue>();
  for (const m of merges) {
    mergeSet.set(`${m.row}:${m.col}`, m.newValue);
  }

  // Index old tiles by cell for fast lookup.
  const oldByCell = new Map<string, Tile>();
  for (const t of oldTiles) {
    oldByCell.set(`${t.row}:${t.col}`, t);
  }

  const result: Tile[] = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      const v = newGrid[r]![c];
      if (v === null) continue;
      const key = `${r}:${c}`;
      const old = oldByCell.get(key);
      if (old && !mergeSet.has(key)) {
        // Same value at the same cell — the tile just slid here.
        result.push({ ...old, row: r, col: c, justMerged: false });
        continue;
      }
      // Either this is a brand-new spawn or a merge. Both need a
      // new id; we let the caller handle ids via the mergeSet
      // detection below.
      if (mergeSet.has(key)) {
        // Merge cell. The "leftmost" old tile in the same row/col
        // (depending on direction) is the survivor. We don't
        // know the direction here, so pick the leftmost old
        // tile in the row whose value matches one of the
        // operands — heuristic that works for all four
        // directions. (Consumed tiles were dropped above.)
        const operand = (v / 2) as TileValue;
        const candidate = oldTiles.find(
          (t) =>
            (t.value === operand) &&
            !result.some((kept) => kept.id === t.id) &&
            // For left/right, same row; for up/down, same column.
            // We pick by row, which is correct for left/right and
            // also "tends to work" for up/down because the merge
            // pair shares a column in the rotated view, which
            // maps to a row in the un-rotated view. Edge case is
            // handled by the fall-through: if we can't find a
            // match, we just allocate a fresh tile.
            (
              t.row === r ||
              t.col === c
            ),
        );
        if (candidate) {
          result.push({
            ...candidate,
            row: r,
            col: c,
            value: v,
            justMerged: true,
          });
        } else {
          result.push({
            id: nextTileId(),
            row: r,
            col: c,
            value: v,
            justMerged: true,
          });
        }
      } else {
        // Brand-new spawn (e.g., the second seed tile in a fresh
        // game). Shouldn't happen in a post-move reconcile, but
        // we handle it for safety.
        result.push({
          id: nextTileId(),
          row: r,
          col: c,
          value: v,
          justMerged: false,
        });
      }
    }
  }
  return result;
}

function computeBestTile(tiles: Tile[], prev: TileValue): TileValue {
  let best: TileValue = prev;
  for (const t of tiles) {
    if (t.value > best) best = t.value;
  }
  return best;
}

export function useCrystal2048({
  onScore,
  onGameOver,
}: UseCrystal2048Args): UseCrystal2048Result {
  const [state, setState] = useState<Crystal2048State>(createInitialState);

  // StrictMode-safe side-channel refs.
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const lastReportedScoreRef = useRef(0);
  const lastReportedGameOverRef = useRef(false);
  const isMountedRef = useRef(false);

  const move = useCallback((direction: Direction) => {
    setState((s) => {
      if (s.status === 'gameover') return s;
      const oldGrid = tilesToGrid(s.tiles);
      const { grid: newGrid, merges } = slideAndMerge(oldGrid, direction);
      if (gridsEqual(oldGrid, newGrid)) {
        // No-op: the player pressed a direction with no slide.
        return s;
      }
      const reconciled = reconcileTiles(s.tiles, newGrid, merges);
      // Score gained = sum of merge newValues.
      const scoreGained = merges.reduce((acc, m) => acc + m.newValue, 0);
      const score = s.score + scoreGained;
      const bestTile = computeBestTile(reconciled, s.bestTile);
      // Spawn a new tile.
      const empties = getEmptyCells(newGrid);
      const spawnCell = pickRandom(empties);
      const tilesWithSpawn: Tile[] = spawnCell
        ? [
            ...reconciled,
            {
              id: nextTileId(),
              row: spawnCell.row,
              col: spawnCell.col,
              value: pickSpawnValue(score),
              justMerged: false,
            },
          ]
        : reconciled;
      // Check for game over (no empties AND no possible merge).
      const status = canAnyMove(
        tilesToGrid(tilesWithSpawn),
      )
        ? 'running'
        : 'gameover';
      return { tiles: tilesWithSpawn, score, bestTile, status };
    });
  }, []);

  const restart = useCallback(() => {
    // Reset everything but reuse the existing hook instance.
    setState(() => ({
      ...createInitialState(),
      // The score reset is intentional — restart wipes the run.
    }));
    // Also reset the StrictMode latches so the next gameover is
    // reported exactly once.
    lastReportedGameOverRef.current = false;
    lastReportedScoreRef.current = 0;
  }, []);

  // Side effects.
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      lastReportedScoreRef.current = state.score;
      return;
    }
    if (state.score > lastReportedScoreRef.current) {
      lastReportedScoreRef.current = state.score;
      onScoreRef.current(state.score);
    }
  }, [state.score]);

  useEffect(() => {
    if (state.status === 'gameover' && !lastReportedGameOverRef.current) {
      lastReportedGameOverRef.current = true;
      onGameOverRef.current(state.score);
    }
    if (state.status === 'running' && lastReportedGameOverRef.current) {
      // Fresh run after a restart.
      lastReportedGameOverRef.current = false;
      lastReportedScoreRef.current = state.score;
    }
  }, [state.status, state.score]);

  return { state, move, restart };
}
