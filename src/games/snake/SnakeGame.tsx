// SnakeGame — Canvas + keyboard + rAF loop wrapper for Snake.
//
// Wiring (top-down):
//   1. `useSnake` owns state, direction, food, and the step function.
//   2. `useKeyboard` maps arrows + WASD to `setDirection`.
//   3. `useGameLoop` runs every animation frame. We accumulate
//      `deltaMs` until it crosses `tickMs`, then call `step()` and
//      reset the accumulator. The loop is paused when the shell
//      pauses us OR when our own status is `'gameover'` (the canvas
//      freezes on the final frame).
//   4. The renderer redraws the canvas on every state change. We
//      pull the canvas size from constants so the wrapper div can
//      size itself around it.
//   5. The game-over overlay shows the final score and a "Play
//      Again" button that calls `onRestart` (provided by the
//      GameShell) — this re-mounts the game and zeros the score.
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useKeyboard } from '../../hooks/useKeyboard';
import type { GameComponentProps } from '../registry';
import { useSnake } from './useSnake';
import {
  CANVAS_SIZE,
  CELL_SIZE,
  COLORS,
  DIRECTION_DELTAS,
  GRID_SIZE,
} from './constants';
import type { Direction, SnakeState } from './types';

export default function SnakeGame({
  gameId,
  isPaused,
  onScore,
  onGameOver,
  onRestart,
}: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const accumulatorRef = useRef(0);
  const { state, step, setDirection, tickMs } = useSnake({
    gameId,
    onScore,
    onGameOver,
  });

  // Keyboard: arrow keys + WASD. The hook's stable-ref pattern means
  // we can pass a fresh object literal every render.
  useKeyboard({
    ArrowUp: () => setDirection('up'),
    ArrowDown: () => setDirection('down'),
    ArrowLeft: () => setDirection('left'),
    ArrowRight: () => setDirection('right'),
  });

  // Step the simulation on a fixed cadence. We accumulate wall-
  // clock time inside the rAF callback and fire `step()` once per
  // `tickMs` window. Multi-step within a single frame is supported
  // (catches up after a long tab-blur), but bounded to 4 to avoid
  // an infinite loop if `tickMs` is tiny.
  useGameLoop((deltaMs) => {
    accumulatorRef.current += deltaMs;
    let steps = 0;
    while (accumulatorRef.current >= tickMs && steps < 4) {
      accumulatorRef.current -= tickMs;
      step();
      steps += 1;
    }
  }, isPaused || state.status === 'gameover');

  // Draw whenever the state changes. We render the whole grid so
  // the canvas is the single source of truth for pixels.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawSnake(ctx, state);
  }, [state]);

  return (
    <div
      data-testid="snake-game"
      data-game-id={gameId}
      className="relative flex h-full w-full items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        data-testid="snake-canvas"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="block rounded-2xl border border-night-dusk/40 shadow-inner"
        style={{ imageRendering: 'pixelated' }}
        aria-label="Snake Kingdom playfield"
      />
      {state.status === 'gameover' && (
        <motion.div
          data-testid="snake-gameover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-night-deep/85 px-6 text-center text-slate-50 backdrop-blur-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-night-glow">
            Game Over
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-sky-sunset">
            {state.score === 0 ? 'The castle is quiet…' : 'Run complete!'}
          </h2>
          <p className="text-sm text-slate-200/90">
            Final score:{' '}
            <span
              data-testid="snake-final-score"
              className="font-bold text-fantasy-cream"
            >
              {state.score}
            </span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {onRestart && (
              <button
                type="button"
                onClick={onRestart}
                data-testid="snake-play-again"
                className="rounded-full bg-night-glow px-5 py-2 text-sm font-semibold text-night-deep shadow hover:bg-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
              >
                Play Again
              </button>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-slate-300/80">
            or use the Restart button in the toolbar
          </p>
        </motion.div>
      )}
    </div>
  );
}

function drawSnake(ctx: CanvasRenderingContext2D, state: SnakeState): void {
  // Background.
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Subtle grid lines so the player can see how far they've traveled.
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = 1; i < GRID_SIZE; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
    ctx.stroke();
  }

  // Food: a pulsing pink dot with a soft glow.
  const food = state.food;
  if (food.x >= 0 && food.y >= 0) {
    const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
    const pulse = 0.85 + 0.15 * Math.sin(performance.now() / 220);
    const radius = (CELL_SIZE / 2 - 2) * pulse;
    ctx.save();
    ctx.shadowColor = COLORS.foodGlow;
    ctx.shadowBlur = 12 * pulse;
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(fx, fy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Snake: head highlighted, body a softer blue, with an outline so
  // it stands out against the dark background.
  const snake = state.snake;
  for (let i = snake.length - 1; i >= 0; i -= 1) {
    const cell = snake[i]!;
    const x = cell.x * CELL_SIZE;
    const y = cell.y * CELL_SIZE;
    const isHead = i === 0;
    ctx.fillStyle = isHead ? COLORS.snakeHead : COLORS.snakeBody;
    ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    ctx.strokeStyle = COLORS.snakeOutline;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 1.5, y + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);

    if (isHead) {
      // Draw two tiny eyes to give the snake some character. Position
      // them based on the facing direction.
      drawSnakeEyes(ctx, cell, state.direction);
    }
  }
}

function drawSnakeEyes(
  ctx: CanvasRenderingContext2D,
  head: { x: number; y: number },
  direction: Direction,
): void {
  const cx = head.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = head.y * CELL_SIZE + CELL_SIZE / 2;
  // Each eye is offset perpendicular to the direction vector.
  const delta = DIRECTION_DELTAS[direction];
  // Perpendicular (left/right) in grid units — flip y for canvas.
  const perpX = -delta.y;
  const perpY = delta.x;
  // Offset the eyes slightly forward in the facing direction.
  const fwdX = delta.x * (CELL_SIZE * 0.18);
  const fwdY = delta.y * (CELL_SIZE * 0.18);
  const sideX = perpX * (CELL_SIZE * 0.18);
  const sideY = perpY * (CELL_SIZE * 0.18);
  const eyeR = Math.max(1.4, CELL_SIZE * 0.09);
  const px1 = cx + fwdX + sideX;
  const py1 = cy + fwdY + sideY;
  const px2 = cx + fwdX - sideX;
  const py2 = cy + fwdY - sideY;
  ctx.fillStyle = COLORS.background;
  ctx.beginPath();
  ctx.arc(px1, py1, eyeR, 0, Math.PI * 2);
  ctx.arc(px2, py2, eyeR, 0, Math.PI * 2);
  ctx.fill();
}
