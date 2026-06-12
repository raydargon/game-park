// TankGame — Canvas + keyboard + rAF loop wrapper for Tank Battlegrounds.
//
// AC-8 ships the basic shell: a Canvas inside the shared chrome, a
// player tank that can be driven around the arena with the arrow
// keys (or WASD), and the full shell wiring (onScore / onGameOver /
// onRestart / markGamePlayed). No enemies, bullets, or lives yet —
// those land in AC-9. The shape mirrors the other Phase 1 games so
// AC-9 can drop the new mechanics in without re-wiring the shell.
//
// Controls:
//   * ArrowUp / W — drive north (turret faces up).
//   * ArrowDown / S — drive south.
//   * ArrowLeft / A — drive west.
//   * ArrowRight / D — drive east.
//   * Space — reserved for fire (AC-9).
//
// The rAF loop runs `step()` every animation frame while the game
// is alive; for the AC-8 scaffold `step` is a no-op because the
// tank is keyboard-driven. AC-9 will use it for bullet + AI ticks.
import { useEffect, useRef } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useKeyboard } from '../../hooks/useKeyboard';
import type { GameComponentProps } from '../registry';
import { useTank } from './useTank';
import {
  CANVAS_H,
  CANVAS_W,
  GROUND_COLOR,
  GROUND_OUTLINE,
  TANK_COLOR,
  TANK_H,
  TANK_OUTLINE,
  TANK_W,
  TURRET_COLOR,
  TURRET_H,
  TURRET_W,
} from './constants';
import type { TankState } from './types';

export default function TankGame({
  gameId,
  isPaused,
  onScore,
  onGameOver,
  onRestart,
}: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { state, step, move } = useTank({ gameId, onScore, onGameOver });

  // Keyboard: arrows + WASD → move. The hook's stable-ref pattern
  // means we can pass a fresh object literal every render.
  useKeyboard({
    ArrowUp: () => move('up'),
    ArrowDown: () => move('down'),
    ArrowLeft: () => move('left'),
    ArrowRight: () => move('right'),
  });

  // rAF loop: tick the simulation every frame while alive. The
  // AC-8 scaffold's `step` is a no-op; the loop is wired up now so
  // AC-9 can plug bullet/AI logic in without touching the shell.
  // The loop pauses on `isPaused` (shell pause) or `gameover` (so
  // the canvas freezes on the final frame).
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

      {/* AC-8 scaffold: a small in-canvas note that the full game
          lands in AC-9. The status flip to `'gameover'` (which
          will trigger the shared Game Over overlay) happens in
          AC-9 when bullets and enemy AI arrive. For now, this
          footer pill gives the user a clear "this is a scaffold"
          signal without breaking the shell contract. */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-night-dusk/60 bg-night-deep/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-sky-sunset shadow backdrop-blur">
        Pilot ready — enemy forces land in AC-9
      </div>
      {onRestart && (
        <button
          type="button"
          onClick={onRestart}
          data-testid="tank-restart"
          className="pointer-events-auto absolute bottom-3 right-3 z-10 rounded-full bg-night-glow px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-night-deep shadow hover:bg-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
        >
          Restart
        </button>
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

  // Player tank.
  const { tank } = state;
  const cx = tank.pos.x + TANK_W / 2;
  const cy = tank.pos.y + TANK_H / 2;
  // Body.
  ctx.fillStyle = TANK_COLOR;
  ctx.fillRect(tank.pos.x, tank.pos.y, TANK_W, TANK_H);
  ctx.strokeStyle = TANK_OUTLINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(tank.pos.x + 0.5, tank.pos.y + 0.5, TANK_W - 1, TANK_H - 1);
  // Turret (oriented by `tank.facing`).
  ctx.fillStyle = TURRET_COLOR;
  ctx.strokeStyle = TANK_OUTLINE;
  ctx.lineWidth = 1.5;
  if (tank.facing === 'up' || tank.facing === 'down') {
    const tx = cx - TURRET_W / 2;
    const ty = tank.facing === 'up' ? tank.pos.y - TURRET_H / 2 + 4 : tank.pos.y + TANK_H - TURRET_H / 2 - 4;
    ctx.fillRect(tx, ty, TURRET_W, TURRET_H);
    ctx.strokeRect(tx + 0.5, ty + 0.5, TURRET_W - 1, TURRET_H - 1);
  } else {
    const tx = tank.facing === 'left' ? tank.pos.x - TURRET_H / 2 + 4 : tank.pos.x + TANK_W - TURRET_H / 2 - 4;
    const ty = cy - TURRET_W / 2;
    ctx.fillRect(tx, ty, TURRET_H, TURRET_W);
    ctx.strokeRect(tx + 0.5, ty + 0.5, TURRET_H - 1, TURRET_W - 1);
  }
}
