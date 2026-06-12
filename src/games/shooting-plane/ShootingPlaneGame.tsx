// ShootingPlaneGame — Canvas + keyboard + rAF loop wrapper for
// Sky Squadron.
//
// AC-11 shipped the scaffold + reachability + park-map card. AC-12
// fills in the full plane-vs-enemies implementation:
//   * Player bullets on Space (with a 350ms fire cooldown) — the
//     bullets travel straight up at BULLET_SPEED px/frame.
//   * Enemy planes that spawn at the top edge every 1.6s, descend
//     at ENEMY_SPEED px/frame, and fire a bullet straight down
//     when their per-enemy fire cooldown hits zero.
//   * Player lives (3, then 0 → game over) decremented by enemy
//     bullet hits and enemy-plane overlaps.
//   * Score reporting (StrictMode-safe) via the new useEffect
//     that watches state.score with a lastReportedScoreRef latch.
//   * Game Over overlay (mirrors the AC-9 tank-war pattern)
//     showing the real final score and a Play Again button.
//
// Controls:
//   * ArrowUp / W — fly north.
//   * ArrowDown / S — fly south.
//   * ArrowLeft / A — fly west.
//   * ArrowRight / D — fly east.
//   * Space — fire a bullet straight up.
//
// The rAF loop runs step(deltaMs) every animation frame while
// the game is alive; the loop pauses on isPaused or gameover.
import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useKeyboard } from '../../hooks/useKeyboard';
import type { GameComponentProps } from '../registry';
import { useShootingPlane } from './useShootingPlane';
import {
  BULLET_COLOR,
  BULLET_H,
  BULLET_W,
  CANVAS_H,
  CANVAS_W,
  ENEMY_BULLET_COLOR,
  ENEMY_BULLET_H,
  ENEMY_BULLET_W,
  ENEMY_COLOR,
  ENEMY_H,
  ENEMY_OUTLINE,
  ENEMY_W,
  PLANE_COLOR,
  PLANE_H,
  PLANE_OUTLINE,
  PLANE_W,
  SKY_BOTTOM_COLOR,
  SKY_TOP_COLOR,
} from './constants';
import type { PlaneState } from './types';

export default function ShootingPlaneGame({
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

  const { state, step, move, fire } = useShootingPlane({
    gameId,
    onScore,
    onGameOver,
  });

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

  // rAF loop: tick the simulation every frame while alive. We
  // pass deltaMs so the hook can drive time-based enemy spawn
  // cadence and bullet cooldowns wall-clock-locked (not
  // framerate-locked). The loop pauses on isPaused (shell pause)
  // or gameover (so the canvas freezes on the final frame).
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
      data-testid="shooting-plane-game"
      data-game-id={gameId}
      className="relative flex h-full w-full items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        data-testid="shooting-plane-canvas"
        width={CANVAS_W}
        height={CANVAS_H}
        className="block rounded-2xl border border-night-dusk/40 shadow-inner"
        style={{ imageRendering: 'pixelated' }}
        aria-label="Sky Squadron playfield"
      />

      {/* Lives indicator overlay (top-left). Drawn as a small
          HTML badge so it stays sharp at any zoom level; the
          score is mirrored to the shell's ScoreHud so this just
          shows the per-run lives count. */}
      <div
        data-testid="shooting-plane-lives"
        className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-night-dusk/60 bg-night-deep/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-fantasy-cream shadow backdrop-blur"
      >
        <span aria-hidden>✈️</span>
        <span data-testid="shooting-plane-lives-value">Lives: {state.lives}</span>
      </div>

      {state.status === 'gameover' && (
        <motion.div
          data-testid="shooting-plane-gameover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: overlayDuration }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-night-deep/85 px-6 text-center text-slate-50 backdrop-blur-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-night-glow">
            Game Over
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-sky-sunset">
            Squadron grounded.
          </h2>
          <p className="text-sm text-slate-200/90">
            Final score:{' '}
            <span
              data-testid="shooting-plane-final-score"
              className="font-bold text-fantasy-cream"
            >
              {state.score}
            </span>
          </p>
          {onRestart && (
            <button
              type="button"
              onClick={onRestart}
              data-testid="shooting-plane-play-again"
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

function drawScene(ctx: CanvasRenderingContext2D, state: PlaneState): void {
  // Sky background — vertical gradient from night-deep at the top
  // to night-dusk at the horizon.
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, SKY_TOP_COLOR);
  grad.addColorStop(1, SKY_BOTTOM_COLOR);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Decorative cloud strip (purely cosmetic — non-interactive,
  // not animated, just a hint that the sky is alive). Three soft
  // ellipses scattered through the upper half.
  drawCloud(ctx, 60, 80, 1);
  drawCloud(ctx, 230, 140, 0.8);
  drawCloud(ctx, 130, 220, 1.1);

  // Player bullets.
  for (const b of state.bullets) {
    ctx.fillStyle = BULLET_COLOR;
    ctx.fillRect(b.pos.x, b.pos.y, BULLET_W, BULLET_H);
    ctx.strokeStyle = PLANE_OUTLINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(b.pos.x + 0.5, b.pos.y + 0.5, BULLET_W - 1, BULLET_H - 1);
  }

  // Enemy bullets.
  for (const b of state.enemyBullets) {
    ctx.fillStyle = ENEMY_BULLET_COLOR;
    ctx.fillRect(b.pos.x, b.pos.y, ENEMY_BULLET_W, ENEMY_BULLET_H);
    ctx.strokeStyle = PLANE_OUTLINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(b.pos.x + 0.5, b.pos.y + 0.5, ENEMY_BULLET_W - 1, ENEMY_BULLET_H - 1);
  }

  // Enemy planes.
  for (const e of state.enemies) {
    drawPlane(ctx, e.pos.x, e.pos.y, ENEMY_W, ENEMY_H, ENEMY_COLOR, ENEMY_OUTLINE, true);
  }

  // Player plane. Drawn last so it sits on top of bullets and
  // enemies (z-order: enemies behind, player in front).
  const { plane } = state;
  drawPlane(
    ctx,
    plane.pos.x,
    plane.pos.y,
    PLANE_W,
    PLANE_H,
    PLANE_COLOR,
    PLANE_OUTLINE,
    false,
  );
}

/** Draw a tiny plane sprite: a coloured body with a darker
 *  outline plus a small cockpit dot. The `isEnemy` flag flips
 *  the cockpit dot to the underside so a descending enemy reads
 *  as facing down. */
function drawPlane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bodyColor: string,
  outlineColor: string,
  isEnemy: boolean,
): void {
  // Body.
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  // Cockpit dot.
  ctx.fillStyle = outlineColor;
  const cy = isEnemy ? y + h - h / 4 : y + h / 4;
  ctx.beginPath();
  ctx.arc(x + w / 2, cy, Math.max(2, w / 8), 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.arc(16, -4, 12, 0, Math.PI * 2);
  ctx.arc(28, 4, 14, 0, Math.PI * 2);
  ctx.arc(12, 8, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
