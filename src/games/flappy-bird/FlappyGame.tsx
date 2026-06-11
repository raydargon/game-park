// FlappyGame — Canvas + keyboard + rAF loop wrapper for Flappy Wings.
//
// AC-4 ships the full wiring (Canvas, gravity, Space/ArrowUp flap,
// floor/ceiling game over) but no pipes yet — pipe obstacles,
// scoring, and onScore reporting land in AC-5. The shape mirrors
// the existing games so AC-5 can drop in cleanly without
// re-wiring the shell.
//
// Controls:
//   * Space / ArrowUp (or W) — flap (upward velocity impulse).
//   * Click / tap on canvas — also flaps (for pointer input).
//
// The rAF loop runs `step()` every animation frame while the
// game is alive; the loop pauses on `isPaused` or `gameover`.
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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

  const { state, step, flap } = useFlappy({ gameId, onScore, onGameOver });

  // Keyboard: Space / ArrowUp (or W) → flap. The hook's stable-ref
  // pattern means we can pass a fresh object literal every render.
  useKeyboard({
    ArrowUp: () => flap(),
    Space: () => flap(),
  });

  // rAF loop: step the simulation every frame while alive. The
  // loop pauses on `isPaused` (shell pause) or `gameover` (so the
  // canvas freezes on the final frame).
  useGameLoop(() => {
    step();
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
          transition={{ duration: 0.2 }}
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
              {0}
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
