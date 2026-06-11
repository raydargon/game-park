// useBrickBreaker — pure logic hook for Brick Breaker.
//
// State machine: `'ready' | 'running' | 'gameover' | 'levelclear'`.
//   * `'ready'`      — ball is glued to the paddle. Press Space to
//                      launch; mouse / arrows move the paddle.
//   * `'running'`    — physics tick. `step(dt)` advances the ball,
//                      resolves collisions, may decrement lives
//                      (→ `'ready'`) or end the run (→ `'gameover'`).
//   * `'levelclear'` — every brick in the grid is dead. The hook
//                      builds a new field and bounces back to
//                      `'ready'` so the player can launch into
//                      level N+1.
//   * `'gameover'`   — lives hit 0. The hook is idle until the
//                      shell remounts us via `onRestart`.
//
// `step(dt)` is the only mutating function the renderer calls. The
// keyboard and mouse handlers feed into it through small
// `movePaddleX(deltaX)` and `setPaddleX(x)` callbacks. The hook
// itself never touches the DOM — `BrickBreakerGame.tsx` wires the
// `useGameLoop` + event listeners.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { GameId } from '../registry';
import {
  BALL_BASE_SPEED,
  BALL_MAX_SPEED,
  BALL_MIN_VERTICAL,
  BALL_R,
  BALL_SPEED_STEP,
  CANVAS_H,
  CANVAS_W,
  PADDLE_H,
  PADDLE_W,
  PADDLE_Y,
  initialBallVelocity,
  ballStartOnPaddle,
  buildBricks,
} from './constants';
import type { BrickBreakerState, Vec2 } from './types';

export type UseBrickBreakerArgs = {
  /** Game id (e.g. `'brick-breaker'`). Used to mark the game as
   *  played for the `park-explorer` achievement (AC-11). */
  gameId?: GameId;
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
};

export type UseBrickBreakerResult = {
  state: BrickBreakerState;
  /** Advance the simulation by `dt` seconds. No-op outside of
   *  `'running'`. */
  step: (dt: number) => void;
  /** Set the paddle's absolute x. Clamped to the playfield. */
  setPaddleX: (x: number) => void;
  /** Move the paddle by a signed pixel delta (used by the
   *  held-key handler). */
  movePaddleX: (delta: number) => void;
  /** Launch the ball from the paddle. Allowed in `'ready'`
   *  (initial launch / new life) and `'levelclear'` (re-press after
   *  advancing). */
  launch: () => void;
};

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function ballSpeedForLevel(level: number): number {
  return Math.min(BALL_MAX_SPEED, BALL_BASE_SPEED + (level - 1) * BALL_SPEED_STEP);
}

function normalizeVelocity(vx: number, vy: number, targetSpeed: number): Vec2 {
  // Re-scale (vx, vy) so the ball moves at `targetSpeed` total
  // (preserving direction). Also enforce a minimum |vy| so a perfect
  // horizontal bounce can't happen.
  const mag = Math.hypot(vx, vy);
  if (mag === 0) {
    return { x: 0, y: -targetSpeed };
  }
  let nx = (vx / mag) * targetSpeed;
  let ny = (vy / mag) * targetSpeed;
  if (Math.abs(ny) < BALL_MIN_VERTICAL) {
    const sign = ny < 0 || ny === 0 ? -1 : 1;
    ny = sign * BALL_MIN_VERTICAL;
    // Re-scale x to keep the total speed at targetSpeed.
    const maxX = Math.sqrt(Math.max(0, targetSpeed * targetSpeed - ny * ny));
    nx = clamp(nx, -maxX, maxX);
  }
  return { x: nx, y: ny };
}

function createInitialState(): BrickBreakerState {
  const paddleX = (CANVAS_W - PADDLE_W) / 2;
  return {
    ball: ballStartOnPaddle(paddleX),
    ballVel: { x: 0, y: 0 },
    paddleX,
    bricks: buildBricks(),
    score: 0,
    lives: 3,
    level: 1,
    bricksClearedThisRun: 0,
    status: 'ready',
  };
}

export function useBrickBreaker({
  gameId,
  onScore,
  onGameOver,
}: UseBrickBreakerArgs): UseBrickBreakerResult {
  const [state, setState] = useState<BrickBreakerState>(createInitialState);

  // Mirror the callbacks through refs so `step` stays referentially
  // stable across renders.
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  // Score / game-over latches (StrictMode-safe).
  const lastReportedScoreRef = useRef(0);
  const lastReportedGameOverRef = useRef(false);
  const isMountedRef = useRef(false);

  const setPaddleX = useCallback((x: number) => {
    setState((s) => {
      const next = clamp(x, 0, CANVAS_W - PADDLE_W);
      // If the ball is glued to the paddle (status === 'ready'),
      // it rides along with the paddle.
      if (s.status === 'ready') {
        return {
          ...s,
          paddleX: next,
          ball: { ...s.ball, x: next + PADDLE_W / 2 },
        };
      }
      return { ...s, paddleX: next };
    });
  }, []);

  const movePaddleX = useCallback((delta: number) => {
    setState((s) => {
      const next = clamp(s.paddleX + delta, 0, CANVAS_W - PADDLE_W);
      if (s.status === 'ready') {
        return {
          ...s,
          paddleX: next,
          ball: { ...s.ball, x: next + PADDLE_W / 2 },
        };
      }
      return { ...s, paddleX: next };
    });
  }, []);

  const launch = useCallback(() => {
    setState((s) => {
      if (s.status !== 'ready' && s.status !== 'levelclear') return s;
      const speed = ballSpeedForLevel(s.level);
      const vel = initialBallVelocity();
      const normalized = normalizeVelocity(vel.vx, vel.vy, speed);
      return {
        ...s,
        ball: ballStartOnPaddle(s.paddleX),
        ballVel: normalized,
        status: 'running',
      };
    });
  }, []);

  const step = useCallback((dt: number) => {
    if (dt <= 0) return;
    setState((s) => {
      if (s.status !== 'running') return s;
      // Substep so a fast ball never tunnels through a brick in a
      // single frame. Each substep moves the ball by at most half a
      // ball radius.
      const speed = Math.hypot(s.ballVel.x, s.ballVel.y);
      const maxStep = Math.max(2, BALL_R * 0.5);
      const subSteps = Math.max(1, Math.ceil((speed * dt) / maxStep));
      const subDt = dt / subSteps;

      let ballX = s.ball.x;
      let ballY = s.ball.y;
      let vx = s.ballVel.x;
      let vy = s.ballVel.y;
      const bricks = s.bricks;
      let score = s.score;
      let pendingGameOver = false;
      let pendingBricksCleared = 0;

      for (let i = 0; i < subSteps; i += 1) {
        ballX += vx * subDt;
        ballY += vy * subDt;

        // Wall collisions (left, right, top).
        if (ballX - BALL_R < 0) {
          ballX = BALL_R;
          vx = Math.abs(vx);
        } else if (ballX + BALL_R > CANVAS_W) {
          ballX = CANVAS_W - BALL_R;
          vx = -Math.abs(vx);
        }
        if (ballY - BALL_R < 0) {
          ballY = BALL_R;
          vy = Math.abs(vy);
        }

        // Paddle collision. The paddle's top is at PADDLE_Y; the
        // ball can only hit the top face (vy > 0 means moving down).
        const paddleLeft = s.paddleX;
        const paddleRight = s.paddleX + PADDLE_W;
        const paddleTop = PADDLE_Y;
        const paddleBottom = PADDLE_Y + PADDLE_H;
        if (
          vy > 0 &&
          ballY + BALL_R >= paddleTop &&
          ballY - BALL_R <= paddleBottom &&
          ballX + BALL_R >= paddleLeft &&
          ballX - BALL_R <= paddleRight
        ) {
          ballY = paddleTop - BALL_R;
          // Reflect Y; adjust X by where on the paddle we hit so the
          // player can angle the ball. Range: -1 (left edge) to +1
          // (right edge). Map to ±70% of the target speed.
          const hit = (ballX - (paddleLeft + PADDLE_W / 2)) / (PADDLE_W / 2);
          const target = ballSpeedForLevel(s.level);
          const angle = hit * 0.7; // up to ~45°
          const newVx = Math.sin(angle * Math.PI) * target * 0.6 + vx * 0.1;
          const newVy = -Math.cos(angle * Math.PI) * target;
          // Re-scale to exactly target speed.
          const mag = Math.hypot(newVx, newVy);
          vx = (newVx / mag) * target;
          vy = (newVy / mag) * target;
          // Enforce min |vy| (in case the angle is near-horizontal).
          const fixed = normalizeVelocity(vx, vy, target);
          vx = fixed.x;
          vy = fixed.y;
          // Move out of the paddle so we don't re-collide next substep.
          ballY = paddleTop - BALL_R - 0.1;
        }

        // Bottom of the playfield — lose a life.
        if (ballY - BALL_R > CANVAS_H) {
          // Mark the loop so we resolve life/level outside the
          // substep loop. We can't `return` out of the setState.
          pendingGameOver = true;
          break;
        }

        // Brick collisions. For each alive brick, check the AABB
        // overlap with the ball's bounding box. On overlap, mark
        // the brick dead, add its points, and reflect the ball on
        // the axis of the *shortest* penetration (so corner hits
        // bounce diagonally).
        let hitRow = -1;
        let hitCol = -1;
        let hitAxis: 'x' | 'y' | null = null;
        let hitMinPen = Infinity;
        outer: for (let r = 0; r < bricks.length; r += 1) {
          const row = bricks[r]!;
          for (let c = 0; c < row.length; c += 1) {
            const b = row[c]!;
            if (!b.alive) continue;
            const cx = Math.max(b.x, Math.min(ballX, b.x + b.w));
            const cy = Math.max(b.y, Math.min(ballY, b.y + b.h));
            const dx = ballX - cx;
            const dy = ballY - cy;
            const dist2 = dx * dx + dy * dy;
            if (dist2 > BALL_R * BALL_R) continue;
            // Choose the axis with the smaller penetration.
            const penX = BALL_R - Math.abs(dx);
            const penY = BALL_R - Math.abs(dy);
            if (penX < penY) {
              if (penX < hitMinPen) {
                hitMinPen = penX;
                hitRow = r;
                hitCol = c;
                hitAxis = 'x';
              }
            } else if (penY < hitMinPen) {
              hitMinPen = penY;
              hitRow = r;
              hitCol = c;
              hitAxis = 'y';
            }
          }
          if (hitRow !== -1) break outer;
        }
        if (hitRow !== -1 && hitCol !== -1) {
          const brick = bricks[hitRow]![hitCol]!;
          brick.alive = false;
          score += brick.points;
          // AC-11: count this brick toward the lifetime
          // `totalBricksCleared` (used by `brick-1000`). We
          // accumulate locally and forward to the store on
          // game-over (and on level-clear) so we don't pay a
          // store-update cost per brick.
          pendingBricksCleared += 1;
          if (hitAxis === 'y') {
            vy = -vy;
            ballY += vy < 0 ? -0.5 : 0.5;
          } else {
            vx = -vx;
            ballX += vx < 0 ? -0.5 : 0.5;
          }
        }
      }

      if (pendingGameOver) {
        const newLives = s.lives - 1;
        if (newLives <= 0) {
          return {
            ...s,
            score,
            lives: 0,
            bricksClearedThisRun:
              s.bricksClearedThisRun + pendingBricksCleared,
            status: 'gameover',
          };
        }
        return {
          ...s,
          score,
          lives: newLives,
          ball: ballStartOnPaddle(s.paddleX),
          ballVel: { x: 0, y: 0 },
          bricksClearedThisRun:
            s.bricksClearedThisRun + pendingBricksCleared,
          status: 'ready',
        };
      }

      // Level cleared? Build the next field (always — even if it's
      // the same layout, the level number increments and the speed
      // curve kicks in).
      const anyAlive = bricks.some((row) => row.some((b) => b.alive));
      if (!anyAlive) {
        return {
          ...s,
          score,
          ball: ballStartOnPaddle(s.paddleX),
          ballVel: { x: 0, y: 0 },
          level: s.level + 1,
          bricks: buildBricks(),
          bricksClearedThisRun:
            s.bricksClearedThisRun + pendingBricksCleared,
          status: 'levelclear',
        };
      }

      return {
        ...s,
        ball: { x: ballX, y: ballY },
        ballVel: { x: vx, y: vy },
        score,
        bricks,
        bricksClearedThisRun:
          s.bricksClearedThisRun + pendingBricksCleared,
      };
    });
  }, []);

  // Report score changes through the side-channel. The setState
  // reducer above is pure — the only place that calls onScore is
  // here.
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

  // Report game-over exactly once per game.
  useEffect(() => {
    if (state.status === 'gameover' && !lastReportedGameOverRef.current) {
      lastReportedGameOverRef.current = true;
      onGameOverRef.current(state.score);
      // AC-11: forward this run's brick count to the lifetime
      // counter (used by `brick-1000`) and mark the game as
      // played (used by `park-explorer`).
      if (state.bricksClearedThisRun > 0) {
        useGameStore
          .getState()
          .incrementBricksCleared(state.bricksClearedThisRun);
      }
      if (gameId) useGameStore.getState().markGamePlayed(gameId);
    }
    if (state.status === 'ready' && lastReportedGameOverRef.current) {
      // Re-mount / restart — reset the latch.
      lastReportedGameOverRef.current = false;
      lastReportedScoreRef.current = state.score;
    }
  }, [state.status, state.score, state.bricksClearedThisRun, gameId]);

  return { state, step, setPaddleX, movePaddleX, launch };
}
