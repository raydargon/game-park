// BrickBreakerGame — Canvas + keyboard + pointer wrapper.
//
// Wiring (top-down):
//   1. `useBrickBreaker` owns the simulation state.
//   2. `useGameLoop` ticks the simulation by `deltaMs/1000` seconds
//      (continuous physics, not a fixed-cadence tick like Snake).
//      The accumulator is small (only one frame's worth of work) so
//      the pause-on-status-flip in Snake isn't needed here.
//   3. Keyboard: Space launches the ball; ArrowLeft / ArrowRight
//      (or A / D) feed a `paddleInputRef` that the game loop reads
//      and converts into a per-frame paddle displacement.
//   4. Pointer: `pointermove` on the canvas positions the paddle
//      directly (per the plan: "mouse or arrow keys").
//   5. Drawing: every state change re-renders the full canvas
//      (background, bricks, ball with a soft glow, paddle, lives).
//   6. Overlays: ready / level-clear / game-over each have their
//      own translucent panel with a Play Again (or Launch) button.
import { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useKeyboard } from '../../hooks/useKeyboard';
import type { GameComponentProps } from '../registry';
import { useBrickBreaker } from './useBrickBreaker';
import {
  BALL_R,
  BALL_BASE_SPEED,
  BALL_SPEED_STEP,
  BALL_MAX_SPEED,
  CANVAS_H,
  CANVAS_W,
  COLORS,
  LIVES_START,
  PADDLE_H,
  PADDLE_SPEED,
  PADDLE_W,
  PADDLE_Y,
} from './constants';
import type { BrickBreakerState } from './types';

export default function BrickBreakerGame({
  gameId,
  isPaused,
  onScore,
  onGameOver,
  onRestart,
}: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { state, step, setPaddleX, movePaddleX, launch } = useBrickBreaker({
    onScore,
    onGameOver,
  });
  // Held-key tracker: -1 (left), 0 (none), 1 (right). The game
  // loop reads it once per frame and translates it into pixels.
  const paddleInputRef = useRef(0);

  // Space launches the ball. `useKeyboard` already aliases ` `,
  // `Space`, and `Spacebar` to the same key, so binding `Space`
  // covers all three.
  useKeyboard({
    Space: () => launch(),
  });

  // Arrow keys + WASD as held keys for the paddle. We maintain a
  // ref so the game loop can read it without re-binding every
  // render.
  useEffect(() => {
    const isLeft = (k: string) => k === 'ArrowLeft' || k === 'a' || k === 'A';
    const isRight = (k: string) => k === 'ArrowRight' || k === 'd' || k === 'D';
    const onDown = (e: KeyboardEvent) => {
      if (isLeft(e.key)) {
        paddleInputRef.current = Math.max(-1, paddleInputRef.current - 1);
      } else if (isRight(e.key)) {
        paddleInputRef.current = Math.min(1, paddleInputRef.current + 1);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (isLeft(e.key)) {
        paddleInputRef.current = Math.min(0, paddleInputRef.current + 1);
      } else if (isRight(e.key)) {
        paddleInputRef.current = Math.max(0, paddleInputRef.current - 1);
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // Mouse / touch paddle control. `pointermove` on the canvas
  // positions the paddle under the cursor (clamped).
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const x = (event.clientX - rect.left) * scaleX;
      setPaddleX(x - PADDLE_W / 2);
    },
    [setPaddleX],
  );

  // Game loop. `deltaMs` → `dt` seconds; the ball moves
  // continuously and the paddle responds to held keys.
  useGameLoop((deltaMs) => {
    const dt = deltaMs / 1000;
    if (paddleInputRef.current !== 0) {
      movePaddleX(paddleInputRef.current * PADDLE_SPEED * dt);
    }
    step(dt);
  }, isPaused || state.status === 'gameover' || state.status === 'levelclear');

  // Redraw on every state change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawScene(ctx, state);
  }, [state]);

  const isReady = state.status === 'ready';
  const isLevelClear = state.status === 'levelclear';
  const isGameOver = state.status === 'gameover';

  return (
    <div
      data-testid="brick-breaker-game"
      data-game-id={gameId}
      className="relative flex h-full w-full items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        data-testid="brick-breaker-canvas"
        width={CANVAS_W}
        height={CANVAS_H}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        className="block max-h-full max-w-full rounded-2xl border border-night-dusk/40 shadow-inner"
        style={{ imageRendering: 'pixelated', touchAction: 'none' }}
        aria-label="Brick Break Castle playfield"
      />

      {/* In-canvas HUD: lives, level, ball speed (read-only). */}
      <div
        data-testid="brick-breaker-hud"
        className="pointer-events-none absolute left-3 right-3 top-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-widest text-sky-sunset"
      >
        <span className="rounded-full bg-night-deep/70 px-2.5 py-1 shadow">
          Level {state.level}
        </span>
        <span className="rounded-full bg-night-deep/70 px-2.5 py-1 shadow">
          Lives: {renderLives(state.lives)}
        </span>
        <span className="rounded-full bg-night-deep/70 px-2.5 py-1 shadow">
          Speed {currentBallSpeedLabel(state.level)}
        </span>
      </div>

      {(isReady || isLevelClear) && (
        <motion.div
          data-testid="brick-breaker-ready"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-night-deep/70 px-6 text-center text-slate-50 backdrop-blur-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-night-glow">
            {isLevelClear ? `Level ${state.level - 1} cleared!` : 'Ready'}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-sky-sunset">
            {isLevelClear
              ? 'The castle walls are rebuilt — bring them down again.'
              : 'Move the paddle, press Space to launch the orb.'}
          </h2>
          <button
            type="button"
            onClick={launch}
            data-testid="brick-breaker-launch"
            className="rounded-full bg-night-glow px-5 py-2 text-sm font-semibold text-night-deep shadow hover:bg-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
          >
            {isLevelClear ? 'Launch Level ' + state.level : 'Launch'}
          </button>
          <p className="text-[10px] uppercase tracking-widest text-slate-300/80">
            Arrows / A,D / Mouse — Space to launch
          </p>
        </motion.div>
      )}

      {isGameOver && (
        <motion.div
          data-testid="brick-breaker-gameover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-night-deep/85 px-6 text-center text-slate-50 backdrop-blur-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-night-glow">
            Game Over
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-sky-sunset">
            The fortress has fallen.
          </h2>
          <p className="text-sm text-slate-200/90">
            Final score:{' '}
            <span
              data-testid="brick-breaker-final-score"
              className="font-bold text-fantasy-cream"
            >
              {state.score}
            </span>
            {' · Level '}
            {state.level}
          </p>
          {onRestart && (
            <button
              type="button"
              onClick={onRestart}
              data-testid="brick-breaker-play-again"
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

function renderLives(lives: number): string {
  if (lives <= 0) return '—';
  // Show as a heart string so the count reads at a glance.
  return '♥'.repeat(Math.max(0, Math.min(lives, LIVES_START + 4)));
}

function currentBallSpeedLabel(level: number): string {
  const speed = Math.min(
    BALL_MAX_SPEED,
    BALL_BASE_SPEED + (level - 1) * BALL_SPEED_STEP,
  );
  return `${Math.round(speed)} px/s`;
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  state: BrickBreakerState,
): void {
  // Background.
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Top strip (where the HUD lives) for a subtle sky-glow.
  ctx.fillStyle = COLORS.backgroundStrip;
  ctx.fillRect(0, 0, CANVAS_W, 48);

  // Bricks.
  for (const row of state.bricks) {
    for (const b of row) {
      if (!b.alive) continue;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      // Inset highlight + shadow for a chiseled look.
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(b.x, b.y, b.w, 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(b.x, b.y + b.h - 2, b.w, 2);
    }
  }

  // Paddle with a fantasy-cream body and pink outline.
  ctx.fillStyle = COLORS.paddle;
  ctx.fillRect(state.paddleX, PADDLE_Y, PADDLE_W, PADDLE_H);
  ctx.strokeStyle = COLORS.paddleOutline;
  ctx.lineWidth = 2;
  ctx.strokeRect(
    state.paddleX + 1,
    PADDLE_Y + 1,
    PADDLE_W - 2,
    PADDLE_H - 2,
  );

  // Ball with a soft pink glow (only when it's in motion).
  if (state.status === 'running') {
    ctx.save();
    ctx.shadowColor = COLORS.ballGlow;
    ctx.shadowBlur = 18;
    ctx.fillStyle = COLORS.ball;
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Ready / level-clear: ball is glued to the paddle, draw it
    // without the glow to signal "stationary".
    ctx.fillStyle = COLORS.ball;
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
  }
}
