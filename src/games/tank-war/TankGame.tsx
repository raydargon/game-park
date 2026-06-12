// TankGame — Canvas + keyboard + rAF loop wrapper for Tank Battlegrounds.
//
// AC-8 shipped the basic shell: Canvas, arrow-key tank movement,
// and the full GameShell wiring. AC-9 adds:
//   * Player bullets on Space (with a 400ms fire cooldown) and
//     enemy bullets on a 1.2–2.0s per-enemy cadence.
//   * AI enemy tanks that spawn at random edges, move in a fixed
//     facing direction (with random wall bounces), and fire at
//     the player when their cooldown hits zero.
//   * Player lives (3, then 0 → game over) decremented by enemy
//     bullet hits and enemy-tank overlaps.
//   * Score reporting (StrictMode-safe) via the new useEffect
//     that watches `state.score` with a `lastReportedScoreRef`
//     latch.
//   * Game Over overlay (mirrors the post-AC-1 tetris pattern
//     and the AC-5 / AC-6 flappy-bird pattern) showing the real
//     final score and a Play Again button.
//
// Controls:
//   * ArrowUp / W — drive north (turret faces up).
//   * ArrowDown / S — drive south.
//   * ArrowLeft / A — drive west.
//   * ArrowRight / D — drive east.
//   * Space — fire a bullet in the tank's facing direction.
//
// The rAF loop runs `step(deltaMs)` every animation frame while
// the game is alive; the loop pauses on `isPaused` or `gameover`.
import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useKeyboard } from '../../hooks/useKeyboard';
import type { GameComponentProps } from '../registry';
import { useTank } from './useTank';
import {
  BULLET_H,
  BULLET_W,
  CANVAS_H,
  CANVAS_W,
  ENEMY_BULLET_COLOR,
  ENEMY_COLOR,
  ENEMY_H,
  ENEMY_OUTLINE,
  ENEMY_W,
  GROUND_COLOR,
  GROUND_OUTLINE,
  PLAYER_BULLET_COLOR,
  TANK_COLOR,
  TANK_H,
  TANK_OUTLINE,
  TANK_W,
  TURRET_COLOR,
  TURRET_H,
  TURRET_W,
} from './constants';
import type { Direction, TankState } from './types';

export default function TankGame({
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

  const { state, step, move, fire } = useTank({ gameId, onScore, onGameOver });

  // Keyboard: arrows + WASD → move; Space → fire. The hook's
  // stable-ref pattern means we can pass a fresh object literal
  // every render.
  useKeyboard({
    ArrowUp: () => move('up'),
    ArrowDown: () => move('down'),
    ArrowLeft: () => move('left'),
    ArrowRight: () => move('right'),
    Space: () => fire(),
  });

  // rAF loop: tick the simulation every frame while alive. We pass
  // `deltaMs` so the hook can drive time-based enemy spawn cadence
  // and bullet cooldowns wall-clock-locked (not framerate-locked).
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

  return (
    <div
      data-testid="tank-game"
      data-game-id={gameId}
      className="relative flex h-full w-full items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        data-testid="tank-canvas"
        width={CANVAS_W}
        height={CANVAS_H}
        className="block rounded-2xl border border-night-dusk/40 shadow-inner"
        style={{ imageRendering: 'pixelated' }}
        aria-label="Tank Battlegrounds playfield"
      />

      {/* Lives indicator overlay (top-left). Drawn as a small
          HTML badge so it stays sharp at any zoom level; the
          score is mirrored to the shell's ScoreHud so this just
          shows the per-run tank count. */}
      <div
        data-testid="tank-lives"
        className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-night-dusk/60 bg-night-deep/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-fantasy-cream shadow backdrop-blur"
      >
        <span aria-hidden>🪖</span>
        <span data-testid="tank-lives-value">Lives: {state.lives}</span>
      </div>

      {state.status === 'gameover' && (
        <motion.div
          data-testid="tank-gameover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: overlayDuration }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-night-deep/85 px-6 text-center text-slate-50 backdrop-blur-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-night-glow">
            Game Over
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-sky-sunset">
            Tank disabled.
          </h2>
          <p className="text-sm text-slate-200/90">
            Final score:{' '}
            <span
              data-testid="tank-final-score"
              className="font-bold text-fantasy-cream"
            >
              {state.score}
            </span>
          </p>
          {onRestart && (
            <button
              type="button"
              onClick={onRestart}
              data-testid="tank-play-again"
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

function drawScene(ctx: CanvasRenderingContext2D, state: TankState): void {
  // Ground.
  ctx.fillStyle = GROUND_COLOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.strokeStyle = GROUND_OUTLINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);

  // Subtle grid lines so the player can see how far they've
  // traveled (purely decorative — non-interactive).
  ctx.strokeStyle = 'rgba(43, 45, 66, 0.4)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_W; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }

  // Player bullets.
  for (const b of state.bullets) {
    ctx.fillStyle = PLAYER_BULLET_COLOR;
    ctx.fillRect(b.pos.x, b.pos.y, BULLET_W, BULLET_H);
    ctx.strokeStyle = TANK_OUTLINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(b.pos.x + 0.5, b.pos.y + 0.5, BULLET_W - 1, BULLET_H - 1);
  }

  // Enemy bullets.
  for (const b of state.enemyBullets) {
    ctx.fillStyle = ENEMY_BULLET_COLOR;
    ctx.fillRect(b.pos.x, b.pos.y, BULLET_W, BULLET_H);
    ctx.strokeStyle = TANK_OUTLINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(b.pos.x + 0.5, b.pos.y + 0.5, BULLET_W - 1, BULLET_H - 1);
  }

  // Enemy tanks.
  for (const e of state.enemies) {
    drawTank(
      ctx,
      e.pos.x,
      e.pos.y,
      ENEMY_W,
      ENEMY_H,
      ENEMY_COLOR,
      ENEMY_OUTLINE,
      e.facing,
    );
  }

  // Player tank.
  drawTank(
    ctx,
    state.tank.pos.x,
    state.tank.pos.y,
    TANK_W,
    TANK_H,
    TANK_COLOR,
    TANK_OUTLINE,
    state.tank.facing,
  );
}

function drawTank(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bodyColor: string,
  outlineColor: string,
  facing: Direction,
): void {
  const cx = x + w / 2;
  const cy = y + h / 2;
  // Body.
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  // Turret (oriented by `facing`).
  ctx.fillStyle = TURRET_COLOR;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.5;
  if (facing === 'up' || facing === 'down') {
    const tx = cx - TURRET_W / 2;
    const ty = facing === 'up' ? y - TURRET_H / 2 + 4 : y + h - TURRET_H / 2 - 4;
    ctx.fillRect(tx, ty, TURRET_W, TURRET_H);
    ctx.strokeRect(tx + 0.5, ty + 0.5, TURRET_W - 1, TURRET_H - 1);
  } else {
    const tx = facing === 'left' ? x - TURRET_H / 2 + 4 : x + w - TURRET_H / 2 - 4;
    const ty = cy - TURRET_W / 2;
    ctx.fillRect(tx, ty, TURRET_H, TURRET_W);
    ctx.strokeRect(tx + 0.5, ty + 0.5, TURRET_H - 1, TURRET_W - 1);
  }
}
