// ShootingPlaneGame — Canvas + keyboard + rAF loop wrapper for
// Sky Squadron.
//
// AC-11 ships the scaffold + reachability + park-map card. The
// game component renders a cream-coloured player plane on a sky
// gradient inside the shared GameShell, wired to the standard
// arrow-key / WASD movement contract. AC-12 replaces the static
// plane with a full plane-vs-enemies implementation (bullets,
// descending enemies, collision, score, lives, game-over).
//
// Controls (already bound in AC-11 so AC-12 inherits the contract):
//   * ArrowUp / W — fly north.
//   * ArrowDown / S — fly south.
//   * ArrowLeft / A — fly west.
//   * ArrowRight / D — fly east.
//   * Space — reserved for the AC-12 fire action.
//
// The rAF loop runs `step(deltaMs)` every animation frame while
// the game is alive; the loop pauses on `isPaused` or `gameover`.
import { useEffect, useRef } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useKeyboard } from '../../hooks/useKeyboard';
import type { GameComponentProps } from '../registry';
import { useShootingPlane } from './useShootingPlane';
import {
  CANVAS_H,
  CANVAS_W,
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
  onScore: _onScore,
  onGameOver: _onGameOver,
  onRestart: _onRestart,
}: GameComponentProps) {
  void _onScore;
  void _onGameOver;
  void _onRestart;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { state, step, move } = useShootingPlane({
    gameId,
    onScore: () => {
      /* AC-12 wires real score reporting */
    },
    onGameOver: () => {
      /* AC-12 wires real game-over reporting (final score) */
    },
  });

  // Keyboard: arrows + WASD → move. The hook's stable-ref
  // pattern means we can pass a fresh object literal every render.
  useKeyboard({
    ArrowUp: () => move('up'),
    ArrowDown: () => move('down'),
    ArrowLeft: () => move('left'),
    ArrowRight: () => move('right'),
  });

  // rAF loop: tick the simulation every frame while alive. AC-12
  // will pass `deltaMs` to `step` to drive time-based enemy
  // spawning and bullet cooldowns; AC-11's no-op step ignores the
  // argument, so the same `useGameLoop` call already works.
  // The loop pauses on `isPaused` (shell pause) or `gameover`.
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
  // ellipses; the AC-12 release will add parallax.
  drawCloud(ctx, 60, 80, 1);
  drawCloud(ctx, 230, 140, 0.8);
  drawCloud(ctx, 130, 220, 1.1);

  // Player plane. AC-11 draws it as a cream body with a single
  // outline; AC-12 will add the cockpit dot, the propeller, and
  // the wing stripes once the sprite is finalised.
  const { plane } = state;
  ctx.fillStyle = PLANE_COLOR;
  ctx.fillRect(plane.pos.x, plane.pos.y, PLANE_W, PLANE_H);
  ctx.strokeStyle = PLANE_OUTLINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(plane.pos.x + 0.5, plane.pos.y + 0.5, PLANE_W - 1, PLANE_H - 1);
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
