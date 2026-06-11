// useTetris — pure logic hook for Tetris.
//
// State machine: `'ready' | 'running' | 'gameover'`. The hook
// starts in `'ready'`; the first call to `step()` (which the game
// loop dispatches on every gravity tick) flips the active piece
// into place and moves to `'running'`. From there:
//
//   * `step()` advances gravity by one row. If the active piece
//     can't move down, the piece is locked, lines are cleared, and
//     the next piece from the queue is spawned. A spawn that
//     collides immediately ends the run with `'gameover'`.
//   * `moveLeft` / `moveRight` / `softDrop` / `hardDrop` / `rotate`
//     / `hold` are the player inputs. Each is a no-op if the
//     resulting position would collide.
//
// All side effects (`onScore`, `onGameOver`) flow through refs +
// useEffects so the setState reducers stay pure (StrictMode-safe).
import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureQueue, makeBag } from './bag';
import {
  BOARD_H,
  BOARD_W,
  HARD_DROP_POINTS,
  LINE_SCORES,
  LINES_PER_LEVEL,
  QUEUE_SIZE,
  SOFT_DROP_POINTS,
  SPAWN_X,
  SPAWN_Y,
  TETROMINOES,
  WALL_KICKS,
} from './constants';
import type { Board, Cell, Tetromino, TetrominoId, TetrisState } from './types';

export type UseTetrisArgs = {
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
};

export type UseTetrisResult = {
  state: TetrisState;
  /** Gravity tick: advance the active piece one row. */
  step: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  /** Single soft drop (one row). For held-down behavior, the game
   *  loop calls this every frame while the Down arrow is held. */
  softDrop: () => void;
  /** Hard drop to the bottom + lock + spawn next. */
  hardDrop: () => void;
  rotate: () => void;
  hold: () => void;
  /** The y-row where the active piece would land if hard-dropped
   *  right now (for the ghost outline). Returns the spawn y if
   *  there's no active piece. */
  ghostY: () => number;
};

function emptyBoard(): Board {
  const board: Board = [];
  for (let r = 0; r < BOARD_H; r += 1) {
    const row: (TetrominoId | null)[] = [];
    for (let c = 0; c < BOARD_W; c += 1) {
      row.push(null);
    }
    board.push(row);
  }
  return board;
}

function pieceAt(id: TetrominoId, x: number, y: number): Tetromino {
  return {
    id,
    rotation: 0,
    x,
    y,
    cells: TETROMINOES[id][0]!.map((c) => ({ x: c.x, y: c.y })),
  };
}

function collides(board: Board, piece: Tetromino, dx = 0, dy = 0): boolean {
  for (const cell of piece.cells) {
    const x = piece.x + cell.x + dx;
    const y = piece.y + cell.y + dy;
    if (x < 0 || x >= BOARD_W) return true;
    if (y >= BOARD_H) return true;
    if (y < 0) continue; // above the board — still legal
    if (board[y]![x] !== null) return true;
  }
  return false;
}

function createInitialState(initialSeed: number): TetrisState {
  let bag = makeBag(initialSeed);
  const next: TetrominoId[] = [];
  const ensured = ensureQueue(bag, next, QUEUE_SIZE, initialSeed);
  bag = ensured.bag;
  return {
    board: emptyBoard(),
    active: pieceAt(ensured.next[0]!, SPAWN_X, SPAWN_Y),
    next: ensured.next,
    hold: null,
    holdUsed: false,
    bag,
    bagSeed: ensured.seed,
    score: 0,
    lines: 0,
    level: 1,
    status: 'ready',
  };
}

function popNext(state: TetrisState): TetrisState {
  // Shift the next piece into active and refill the queue.
  const ensured = ensureQueue(state.bag, state.next.slice(1), QUEUE_SIZE, state.bagSeed);
  const id = state.next[0]!;
  return {
    ...state,
    active: pieceAt(id, SPAWN_X, SPAWN_Y),
    next: ensured.next,
    bag: ensured.bag,
    bagSeed: ensured.seed,
    holdUsed: false,
  };
}

function lockAndAdvance(
  state: TetrisState,
  piece: Tetromino,
): TetrisState {
  // 1. Stamp the piece into the board.
  const board: Board = state.board.map((row) => row.slice());
  for (const cell of piece.cells) {
    const x = piece.x + cell.x;
    const y = piece.y + cell.y;
    if (y < 0) continue; // above the visible board — ignore
    if (y >= 0 && y < BOARD_H && x >= 0 && x < BOARD_W) {
      board[y]![x] = piece.id;
    }
  }
  // 2. Clear full lines.
  const fullRows: number[] = [];
  for (let r = 0; r < BOARD_H; r += 1) {
    if (board[r]!.every((c) => c !== null)) fullRows.push(r);
  }
  const linesCleared = fullRows.length;
  for (const r of fullRows) {
    board.splice(r, 1);
    board.unshift(new Array<TetrominoId | null>(BOARD_W).fill(null));
  }
  // 3. Update score (1/2/3/4 → 100/300/500/800 × level).
  const linePoints = LINE_SCORES[linesCleared] ?? 0;
  const score = state.score + linePoints * state.level;
  const lines = state.lines + linesCleared;
  const level = Math.max(1, Math.floor(lines / LINES_PER_LEVEL) + 1);
  // 4. Spawn next piece; if it collides immediately, the run is over.
  const advanced: TetrisState = {
    ...state,
    board,
    score,
    lines,
    level,
  };
  const withNext = popNext(advanced);
  if (withNext.active && collides(withNext.board, withNext.active)) {
    return { ...withNext, status: 'gameover' };
  }
  return { ...withNext, status: 'running' };
}

function tryMove(
  state: TetrisState,
  dx: number,
  dy: number,
): TetrisState {
  if (state.status !== 'running' || !state.active) return state;
  if (collides(state.board, state.active, dx, dy)) return state;
  return {
    ...state,
    active: {
      ...state.active,
      x: state.active.x + dx,
      y: state.active.y + dy,
    },
  };
}

function tryRotate(state: TetrisState): TetrisState {
  if (state.status !== 'running' || !state.active) return state;
  const a = state.active;
  if (a.id === 'O') return state; // O doesn't change when rotated
  const nextRot: 0 | 1 | 2 | 3 = (((a.rotation + 1) % 4) as 0 | 1 | 2 | 3);
  const rotatedCells = TETROMINOES[a.id][nextRot]!;
  const candidate: Tetromino = {
    ...a,
    rotation: nextRot,
    cells: rotatedCells.map((c: Cell) => ({ x: c.x, y: c.y })),
  };
  for (const kick of WALL_KICKS) {
    if (!collides(state.board, candidate, kick.x, kick.y)) {
      return {
        ...state,
        active: {
          ...candidate,
          x: candidate.x + kick.x,
          y: candidate.y + kick.y,
        },
      };
    }
  }
  // No kick worked — keep the original piece.
  return state;
}

function computeGhost(state: TetrisState): number {
  if (!state.active) return SPAWN_Y;
  let y = state.active.y;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (collides(state.board, state.active, 0, y - state.active.y + 1)) break;
    y += 1;
  }
  return y;
}

export function useTetris({
  onScore,
  onGameOver,
}: UseTetrisArgs): UseTetrisResult {
  const [state, setState] = useState<TetrisState>(() =>
    createInitialState(Math.floor(Date.now() & 0x7fffffff)),
  );

  // Side-channel refs (StrictMode-safe callbacks).
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const lastReportedScoreRef = useRef(0);
  const lastReportedGameOverRef = useRef(false);
  const isMountedRef = useRef(false);

  const step = useCallback(() => {
    setState((s) => {
      if (s.status === 'gameover') return s;
      if (!s.active) return s;
      const moved = tryMove(s, 0, 1);
      if (moved === s) {
        // Couldn't move down — lock the piece.
        return lockAndAdvance(s, s.active);
      }
      return moved;
    });
  }, []);

  const moveLeft = useCallback(() => {
    setState((s) => tryMove(s, -1, 0));
  }, []);

  const moveRight = useCallback(() => {
    setState((s) => tryMove(s, 1, 0));
  }, []);

  const softDrop = useCallback(() => {
    setState((s) => {
      if (s.status !== 'running' || !s.active) return s;
      const moved = tryMove(s, 0, 1);
      if (moved === s) {
        return lockAndAdvance(s, s.active);
      }
      // Award soft-drop points.
      return { ...moved, score: moved.score + SOFT_DROP_POINTS };
    });
  }, []);

  const hardDrop = useCallback(() => {
    setState((s) => {
      if (s.status !== 'running' || !s.active) return s;
      const ghost = computeGhost(s);
      const distance = ghost - s.active.y;
      const dropped: Tetromino = { ...s.active, y: ghost };
      const advanced = lockAndAdvance(s, dropped);
      return {
        ...advanced,
        score: advanced.score + distance * HARD_DROP_POINTS,
      };
    });
  }, []);

  const rotate = useCallback(() => {
    setState((s) => tryRotate(s));
  }, []);

  const hold = useCallback(() => {
    setState((s) => {
      if (s.status !== 'running' || !s.active || s.holdUsed) return s;
      const currentId = s.active.id;
      if (s.hold) {
        // Swap: bring the held piece into play.
        const newActive = pieceAt(s.hold, SPAWN_X, SPAWN_Y);
        return { ...s, active: newActive, hold: currentId, holdUsed: true };
      }
      // No held piece: send the current to hold, draw next from queue.
      const ensured = ensureQueue(s.bag, s.next.slice(1), QUEUE_SIZE, s.bagSeed);
      const nextId = s.next[0]!;
      return {
        ...s,
        active: pieceAt(nextId, SPAWN_X, SPAWN_Y),
        hold: currentId,
        next: ensured.next,
        bag: ensured.bag,
        bagSeed: ensured.seed,
        holdUsed: true,
      };
    });
  }, []);

  const ghostY = useCallback(() => computeGhost(state), [state]);

  // Side-channel: report score / game-over through useEffects.
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
    if (state.status === 'ready' && lastReportedGameOverRef.current) {
      lastReportedGameOverRef.current = false;
      lastReportedScoreRef.current = state.score;
    }
  }, [state.status, state.score]);

  return { state, step, moveLeft, moveRight, softDrop, hardDrop, rotate, hold, ghostY };
}
