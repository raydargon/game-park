// TetrisGame — Canvas + side panels + keyboard + rAF loop wrapper.
//
// Layout (left → right):
//   * Hold column (1 piece preview, dimmed if used this turn).
//   * Main playfield (10×20, 280×560 canvas).
//   * Next column (3 piece previews).
//
// Controls:
//   * ArrowLeft / ArrowRight (or A / D) — move one cell.
//   * ArrowUp (or W) — rotate (SRS-lite with 8 wall-kick offsets).
//   * ArrowDown (or S, held) — soft drop (≈20× gravity, +1 per row).
//   * Space — hard drop (+2 per row, lock immediately).
//   * Shift (or C) — hold (once per piece; resets on spawn).
//
// The rAF loop accumulates `deltaMs` until it crosses the
// per-level gravity interval, then calls `step()` (capped at 4
// catch-up steps so a tab-blur can't fast-forward forever).
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useKeyboard } from '../../hooks/useKeyboard';
import type { GameComponentProps } from '../registry';
import { useTetris } from './useTetris';
import {
  BOARD_W,
  CANVAS_H,
  CANVAS_W,
  CELL_SIZE,
  PIECE_COLORS,
  PIECE_OUTLINE,
  SOFT_DROP_GRAVITY_MS,
  TETROMINOES,
  gravityForLevel,
} from './constants';
import type { Tetromino, TetrominoId, TetrisState } from './types';

export default function TetrisGame({
  gameId,
  isPaused,
  onScore,
  onGameOver,
  onRestart,
}: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const accumulatorRef = useRef(0);
  const softDropHeldRef = useRef(false);

  const {
    state,
    step,
    moveLeft,
    moveRight,
    hardDrop,
    rotate,
    hold,
    ghostY,
  } = useTetris({ gameId, onScore, onGameOver });

  // Discrete key actions: arrows, Up, Space, Shift.
  useKeyboard({
    ArrowLeft: () => moveLeft(),
    ArrowRight: () => moveRight(),
    ArrowUp: () => rotate(),
    Space: () => hardDrop(),
    Shift: () => hold(),
  });

  // Held-Down: tracked via a ref so the game loop can read it each
  // frame (and so we don't fire dozens of `softDrop` calls per
  // keypress in the keydown handler).
  useEffect(() => {
    const isDown = (k: string) =>
      k === 'ArrowDown' || k === 's' || k === 'S';
    const onDown = (e: KeyboardEvent) => {
      if (isDown(e.key)) softDropHeldRef.current = true;
    };
    const onUp = (e: KeyboardEvent) => {
      if (isDown(e.key)) softDropHeldRef.current = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // Game loop: accumulate time → step on gravity tick.
  useGameLoop((deltaMs) => {
    const interval = softDropHeldRef.current
      ? SOFT_DROP_GRAVITY_MS
      : gravityForLevel(state.level);
    accumulatorRef.current += deltaMs;
    let steps = 0;
    while (accumulatorRef.current >= interval && steps < 4) {
      accumulatorRef.current -= interval;
      step();
      steps += 1;
    }
  }, isPaused || state.status === 'gameover');

  // Redraw on every state change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawScene(ctx, state, ghostY());
  }, [state, ghostY]);

  // Reset the soft-drop-held ref on remount (shell restarts).
  useEffect(() => {
    softDropHeldRef.current = false;
    accumulatorRef.current = 0;
  }, [state.active?.id]);

  return (
    <div
      data-testid="tetris-game"
      data-game-id={gameId}
      className="relative flex h-full w-full items-center justify-center"
    >
      <div className="flex flex-row items-start gap-3 sm:gap-4">
        <PiecePreview
          label="Hold"
          id={state.hold}
          testId="tetris-hold"
          dimmed={state.holdUsed}
        />
        <div className="relative">
          <canvas
            ref={canvasRef}
            data-testid="tetris-canvas"
            width={CANVAS_W}
            height={CANVAS_H}
            className="block rounded-2xl border border-night-dusk/40 shadow-inner"
            style={{ imageRendering: 'pixelated' }}
            aria-label="Puzzle Tower playfield"
          />
          {/* Lightweight in-canvas HUD pinned over the canvas. */}
          <div
            data-testid="tetris-hud"
            className="pointer-events-none absolute left-2 right-2 top-2 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-widest text-sky-sunset"
          >
            <span className="rounded-full bg-night-deep/70 px-2 py-0.5 shadow">
              Level {state.level}
            </span>
            <span className="rounded-full bg-night-deep/70 px-2 py-0.5 shadow">
              Lines {state.lines}
            </span>
          </div>
        </div>
        <div
          data-testid="tetris-next"
          className="flex w-24 flex-col items-center gap-2"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-night-glow">
            Next
          </p>
          {state.next.slice(0, 3).map((id, idx) => (
            <PieceThumb key={`${id}-${idx}`} id={id} />
          ))}
        </div>
      </div>

      {state.status === 'gameover' && (
        <motion.div
          data-testid="tetris-gameover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-night-deep/85 px-6 text-center text-slate-50 backdrop-blur-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-night-glow">
            Game Over
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-sky-sunset">
            The tower topples.
          </h2>
          <p className="text-sm text-slate-200/90">
            Final score:{' '}
            <span
              data-testid="tetris-final-score"
              className="font-bold text-fantasy-cream"
            >
              {state.score}
            </span>
            {' · '}
            <span className="text-fantasy-blue">Lines {state.lines}</span>
            {' · '}
            <span className="text-fantasy-pink">Level {state.level}</span>
          </p>
          {onRestart && (
            <button
              type="button"
              onClick={onRestart}
              data-testid="tetris-play-again"
              className="rounded-full bg-night-glow px-5 py-2 text-sm font-semibold text-night-deep shadow hover:bg-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
            >
              Play Again
            </button>
          )}
          <p className="text-[10px] uppercase tracking-widest text-slate-300/80">
            or use the Restart button in the toolbar
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ----- Side panel piece previews -----

type PiecePreviewProps = {
  label: string;
  id: TetrominoId | null;
  testId: string;
  dimmed?: boolean;
};

function PiecePreview({ label, id, testId, dimmed }: PiecePreviewProps) {
  return (
    <div data-testid={testId} className="flex w-24 flex-col items-center gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-night-glow">
        {label}
      </p>
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-2xl border border-night-dusk/40 bg-night-deep/60 ${
          dimmed ? 'opacity-40' : ''
        }`}
      >
        {id ? <PieceThumb id={id} /> : (
          <span className="text-[10px] uppercase tracking-widest text-slate-500">
            empty
          </span>
        )}
      </div>
    </div>
  );
}

function PieceThumb({ id }: { id: TetrominoId }) {
  // 4x4 mini-grid of 12px cells = 48×48.
  const size = 12;
  const cells = TETROMINOES[id][0]!;
  const color = PIECE_COLORS[id];
  return (
    <div
      className="relative"
      style={{ width: size * 4, height: size * 4 }}
      aria-hidden
    >
      {cells.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: c.x * size,
            top: c.y * size,
            width: size,
            height: size,
            background: color,
            outline: `1px solid ${PIECE_OUTLINE}`,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

// ----- Canvas renderer -----

function drawScene(
  ctx: CanvasRenderingContext2D,
  state: TetrisState,
  ghostY: number,
): void {
  // Background.
  ctx.fillStyle = '#2B2D42'; // night-deep
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Faint grid lines.
  ctx.strokeStyle = 'rgba(255, 245, 228, 0.05)';
  ctx.lineWidth = 1;
  for (let c = 1; c < BOARD_W; c += 1) {
    ctx.beginPath();
    ctx.moveTo(c * CELL_SIZE, 0);
    ctx.lineTo(c * CELL_SIZE, CANVAS_H);
    ctx.stroke();
  }
  for (let r = 1; r < 20; r += 1) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL_SIZE);
    ctx.lineTo(CANVAS_W, r * CELL_SIZE);
    ctx.stroke();
  }

  // Locked blocks.
  for (let r = 0; r < state.board.length; r += 1) {
    const row = state.board[r]!;
    for (let c = 0; c < row.length; c += 1) {
      const cell = row[c]!;
      if (cell) drawCell(ctx, c, r, PIECE_COLORS[cell], 1);
    }
  }

  // Ghost piece (outline only).
  if (state.active && state.status === 'running') {
    const ghost = { ...state.active, y: ghostY };
    for (const cell of ghost.cells) {
      const x = ghost.x + cell.x;
      const y = ghost.y + cell.y;
      if (y < 0) continue;
      ctx.strokeStyle = PIECE_COLORS[ghost.id];
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.strokeRect(
        x * CELL_SIZE + 1,
        y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2,
      );
      ctx.globalAlpha = 1;
    }
  }

  // Active piece.
  if (state.active && state.status === 'running') {
    drawPiece(ctx, state.active);
  }
}

function drawPiece(ctx: CanvasRenderingContext2D, piece: Tetromino): void {
  const color = PIECE_COLORS[piece.id];
  for (const cell of piece.cells) {
    const x = piece.x + cell.x;
    const y = piece.y + cell.y;
    if (y < 0) continue;
    drawCell(ctx, x, y, color, 1.1);
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  scale: number,
): void {
  const pad = 1;
  const inset = CELL_SIZE - pad * 2;
  ctx.fillStyle = color;
  ctx.fillRect(
    x * CELL_SIZE + pad,
    y * CELL_SIZE + pad,
    inset,
    inset,
  );
  ctx.strokeStyle = PIECE_OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(
    x * CELL_SIZE + pad,
    y * CELL_SIZE + pad,
    inset,
    inset,
  );
  if (scale > 1) {
    // Active piece highlight: a brighter top-left bevel.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(
      x * CELL_SIZE + pad,
      y * CELL_SIZE + pad,
      inset,
      2,
    );
  }
}
