// FlappyGame — Canvas + keyboard + rAF loop wrapper for Flappy Wings.
//
// AC-4 shipped the basic shell (Canvas, gravity, Space/ArrowUp flap,
// floor game over). AC-5 adds:
//   * Scrolling pipe pairs with vertical gaps, spawned on a
//     `PIPE_SPAWN_INTERVAL_MS` cadence.
//   * Bird ↔ pipe (top + bottom rect) and bird ↔ ceiling collision.
//   * A `state.score` field that increments by 1 every time a pipe
//     pair passes the bird; the game-over overlay shows the real
//     final score (replacing the AC-4 placeholder `{0}`).
//   * Real `onScore` reporting (StrictMode-safe) via the hook's
//     `useEffect` watcher.
//
// Controls:
//   * Space / ArrowUp (or W) — flap (upward velocity impulse).
//   * Click / tap on canvas — also flaps (for pointer input).
//
// The rAF loop runs `step(deltaMs)` every animation frame while the
// game is alive; the loop pauses on `isPaused` or `gameover`.
import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useKeyboard } from '../../hooks/useKeyboard';
import type { GameComponentProps } from '../registry';
import { useFlappy } from './useFlappy';
import {
  BIRD_COLOR,
  BIRD_DRAW_R,
  BIRD_OUTLINE,
  BIRD_R,
  CANVAS_H,
  CANVAS_W,
  FLOOR_COLOR,
  FLOOR_Y,
  PIPE_CAP_H,
  PIPE_COLOR,
  PIPE_GAP,
  PIPE_OUTLINE_COLOR,
  PIPE_W,
  SKY_COLOR,
} from './constants';
import type { FlappyState } from './types';

export default function FlappyGame({
  gameId,
  isPaused,
  onScore,
  onGameOver,
  onRestart,
}: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // AC-20: respect the user's reduced-motion preference. The Game
  // Over overlay's fade-in is reduced to a near-instant transition
  // so the overlay still appears (score, button, copy) but no
  // animated chrome is shown.
  const reduce = useReducedMotion();
  const overlayDuration = reduce ? 0.01 : 0.2;

  const { state, step, flap } = useFlappy({ gameId, onScore, onGameOver });

  // Keyboard: Space / ArrowUp (or W) → flap. The hook's stable-ref
  // pattern means we can pass a fresh object literal every render.
  useKeyboard({
    ArrowUp: () => flap(),
    Space: () => flap(),
  });

  // rAF loop: step the simulation every frame while alive. We pass
  // `deltaMs` to `step` so the hook can drive time-based pipe
  // spawning (a fixed-frame spawn would be framerate-dependent).
  // The loop pauses on `isPaused` (shell pause) or `gameover` (so
  // the canvas freezes on the final frame).
  useGameLoop((deltaMs) => {
    step(deltaMs);
  }, isPaused || state.status === 'gameover');

  // Redraw on every state change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawScene(ctx, state);
  }, [state]);

  // Click / tap on the canvas = flap, for pointer input.
  const handleCanvasClick = () => {
    if (state.status === 'running') flap();
  };

  return (
    <div
      data-testid="flappy-game"
      data-game-id={gameId}
      className="relative flex h-full w-full items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        data-testid="flappy-canvas"
        width={CANVAS_W}
        height={CANVAS_H}
        onClick={handleCanvasClick}
        className="block cursor-pointer rounded-2xl border border-night-dusk/40 shadow-inner"
        style={{ imageRendering: 'pixelated' }}
        aria-label="Flappy Wings playfield"
      />

      {state.status === 'gameover' && (
        <motion.div
          data-testid="flappy-gameover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: overlayDuration }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-night-deep/85 px-6 text-center text-slate-50 backdrop-blur-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-night-glow">
            Game Over
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-sky-sunset">
            Wings clipped.
          </h2>
          <p className="text-sm text-slate-200/90">
            Final score:{' '}
            <span
              data-testid="flappy-final-score"
              className="font-bold text-fantasy-cream"
            >
              {state.score}
            </span>
          </p>
          {onRestart && (
            <button
              type="button"
              onClick={onRestart}
              data-testid="flappy-play-again"
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

// ----- Canvas renderer -----

function drawScene(ctx: CanvasRenderingContext2D, state: FlappyState): void {
  // Sky background.
  ctx.fillStyle = SKY_COLOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Distant cloud strip (purely decorative — non-interactive).
  drawCloud(ctx, 40, 80, 1.2);
  drawCloud(ctx, 220, 140, 0.9);
  drawCloud(ctx, 120, 200, 1.0);

  // Pipes (drawn before the floor so the floor covers the bottom
  // edges cleanly).
  for (const pipe of state.pipes) {
    drawPipe(ctx, pipe.x, pipe.gapY);
  }

  // Floor strip.
  ctx.fillStyle = FLOOR_COLOR;
  ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);
  ctx.strokeStyle = BIRD_OUTLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(CANVAS_W, FLOOR_Y);
  ctx.stroke();

  // Bird — circle with a small eye, oriented by `vy` (a small tilt
  // cue for the player). Drawn at the *visible* radius (slightly
  // larger than the hitbox) so the bird feels a touch more
  // forgiving.
  const { bird } = state;
  const tilt = Math.max(-0.5, Math.min(1.2, bird.vy * 0.06));
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(tilt);
  // Body.
  ctx.fillStyle = BIRD_COLOR;
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_DRAW_R, 0, Math.PI * 2);
  ctx.fill();
  // Outline.
  ctx.strokeStyle = BIRD_OUTLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_DRAW_R, 0, Math.PI * 2);
  ctx.stroke();
  // Eye (white).
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(5, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BIRD_OUTLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(5, -4, 4, 0, Math.PI * 2);
  ctx.stroke();
  // Pupil.
  ctx.fillStyle = BIRD_OUTLINE;
  ctx.beginPath();
  ctx.arc(6, -4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#FFA94D';
  ctx.beginPath();
  ctx.moveTo(BIRD_R - 2, -2);
  ctx.lineTo(BIRD_R + 6, 0);
  ctx.lineTo(BIRD_R - 2, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Wing (decorative ellipse that wobbles with `vy`).
  ctx.fillStyle = BIRD_COLOR;
  ctx.beginPath();
  ctx.ellipse(-3, 2, 7, 4 + Math.sin(performance.now() / 120) * 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BIRD_OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-3, 2, 7, 4 + Math.sin(performance.now() / 120) * 1.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  gapY: number,
): void {
  const topBottom = gapY - PIPE_GAP / 2;
  const bottomTop = gapY + PIPE_GAP / 2;

  // Top pipe: spans from y=0 to topBottom.
  ctx.fillStyle = PIPE_COLOR;
  ctx.fillRect(x, 0, PIPE_W, topBottom);
  ctx.strokeStyle = PIPE_OUTLINE_COLOR;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, 0.5, PIPE_W - 1, topBottom - 1);
  // Top pipe cap (a slightly wider lip at the bottom of the top pipe).
  ctx.fillStyle = PIPE_COLOR;
  ctx.fillRect(x - 3, topBottom - PIPE_CAP_H, PIPE_W + 6, PIPE_CAP_H);
  ctx.strokeRect(x - 2.5, topBottom - PIPE_CAP_H, PIPE_W + 5, PIPE_CAP_H - 0.5);

  // Bottom pipe: spans from bottomTop to FLOOR_Y.
  ctx.fillStyle = PIPE_COLOR;
  ctx.fillRect(x, bottomTop, PIPE_W, FLOOR_Y - bottomTop);
  ctx.strokeStyle = PIPE_OUTLINE_COLOR;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, bottomTop, PIPE_W - 1, FLOOR_Y - bottomTop - 1);
  // Bottom pipe cap.
  ctx.fillStyle = PIPE_COLOR;
  ctx.fillRect(x - 3, bottomTop, PIPE_W + 6, PIPE_CAP_H);
  ctx.strokeRect(x - 2.5, bottomTop, PIPE_W + 5, PIPE_CAP_H - 0.5);
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.arc(16, -4, 12, 0, Math.PI * 2);
  ctx.arc(28, 4, 14, 0, Math.PI * 2);
  ctx.arc(12, 8, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
