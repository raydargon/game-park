// useTank — pure logic hook for Tank Battlegrounds.
//
// State machine: `'running' | 'gameover'`. The hook starts in
// `'running'`; the game loop dispatches `step(deltaMs)` on every
// animation frame, which (in this order):
//   1. Spawns a new enemy if the spawn interval has elapsed.
//   2. Ticks the player's fire cooldown toward zero.
//   3. Advances player + enemy bullets and prunes off-screen ones.
//   4. Resolves collisions: player bullet ↔ enemy, enemy bullet
//      ↔ player tank, enemy tank ↔ player tank. Player bullet ↔
//      enemy increments the score; enemy bullet / enemy tank ↔
//      player decrements lives.
//   5. Moves enemy tanks one step in their facing direction
//      (`ENEMY_SPEED` px/frame). At a wall, picks a new random
//      direction. Decrements the enemy's fire cooldown; on hit
//      zero, fires a bullet aimed at the player and resets the
//      cooldown to a random value in
//      `[ENEMY_FIRE_INTERVAL_MS_MIN, MAX]`.
//   6. Flips status to `'gameover'` when `lives <= 0`.
//
// Public API:
//   * `step(deltaMs)` — per-frame physics + AI tick.
//   * `move(direction)` — keyboard input; translates the tank by
//      `TANK_SPEED` and updates its facing.
//   * `fire()` — spawns a player bullet in the tank's facing
//      direction. No-op if the fire cooldown hasn't elapsed.
//
//   * `reset()` is *not* exposed: the GameShell re-mounts the game
//     via `key={restartKey}` on Restart, so the hook re-initialises
//     fresh state via `createInitialState`.
//
// All side effects (`onScore`, `onGameOver`, `markGamePlayed`) flow
// through refs + useEffects so the setState reducers stay pure
// (StrictMode-safe). Latches are re-initialised on every remount,
// so Restart zeros the call counts.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { GameId } from '../registry';
import {
  BULLET_H,
  BULLET_SPEED,
  BULLET_W,
  CANVAS_H,
  CANVAS_W,
  ENEMY_FIRE_INTERVAL_MS_MAX,
  ENEMY_FIRE_INTERVAL_MS_MIN,
  ENEMY_H,
  ENEMY_SPAWN_INTERVAL_MS,
  ENEMY_SPEED,
  ENEMY_W,
  LIVES_START,
  PLAYER_FIRE_COOLDOWN_MS,
  POINTS_PER_ENEMY,
  TANK_H,
  TANK_SPAWN_X,
  TANK_SPAWN_Y,
  TANK_SPEED,
  TANK_W,
} from './constants';
import type { Bullet, Direction, EnemyTank, TankState, Vec2 } from './types';

export type UseTankArgs = {
  /** Game id (e.g. `'tank-war'`). Used to mark the game as
   *  played for the `park-explorer` achievement when the run
   *  ends. */
  gameId?: GameId;
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
};

export type UseTankResult = {
  state: TankState;
  /** Per-frame physics + AI tick. */
  step: (deltaMs?: number) => void;
  /** Keyboard input — translate the tank and update its facing. */
  move: (direction: Direction) => void;
  /** Fire a player bullet in the tank's current facing direction. */
  fire: () => void;
};

// ----- ID counters (module-level so they survive remounts and
// don't collide between bullets within a single run). -----
let nextBulletId = 1;
let nextEnemyId = 1;

// ----- Math helpers -----

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function dirToVec(d: Direction): Vec2 {
  if (d === 'up') return { x: 0, y: -1 };
  if (d === 'down') return { x: 0, y: 1 };
  if (d === 'left') return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

function pseudoRandom(seed: number): number {
  // mulberry32-ish; same idea as useSnake.pseudoRandom.
  const t = (seed * 9301 + 49297) % 233280;
  return t / 233280;
}

function pickSpawnEdgeAndPos(): { pos: Vec2; facing: Direction } {
  // Pick one of three edges (top / left / right) at random and
  // place the enemy just inside that edge. The bottom edge is
  // excluded so the player (who spawns at center-bottom) gets a
  // moment to orient before enemies pour in from below.
  const r = pseudoRandom(nextEnemyId);
  if (r < 0.34) {
    // Top edge — face down.
    return {
      pos: {
        x: Math.floor(pseudoRandom(nextEnemyId * 7) * (CANVAS_W - ENEMY_W)),
        y: 0,
      },
      facing: 'down',
    };
  }
  if (r < 0.67) {
    // Left edge — face right.
    return {
      pos: {
        x: 0,
        y: Math.floor(pseudoRandom(nextEnemyId * 11) * (CANVAS_H - ENEMY_H)),
      },
      facing: 'right',
    };
  }
  // Right edge — face left.
  return {
    pos: {
      x: CANVAS_W - ENEMY_W,
      y: Math.floor(pseudoRandom(nextEnemyId * 13) * (CANVAS_H - ENEMY_H)),
    },
    facing: 'left',
  };
}

function aabbOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function createInitialState(): TankState {
  return {
    tank: {
      pos: { x: TANK_SPAWN_X, y: TANK_SPAWN_Y },
      facing: 'up',
    },
    bullets: [],
    enemyBullets: [],
    enemies: [],
    lives: LIVES_START,
    score: 0,
    fireCooldownMs: 0,
    enemySpawnElapsedMs: 0,
    status: 'running',
  };
}

export function useTank({
  gameId,
  onScore,
  onGameOver,
}: UseTankArgs): UseTankResult {
  const [state, setState] = useState<TankState>(() => createInitialState());

  // StrictMode-safe side-channel refs.
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const lastReportedScoreRef = useRef(0);
  const lastReportedGameOverRef = useRef(false);

  const step = useCallback((deltaMs: number = 0) => {
    setState((s) => {
      if (s.status !== 'running') return s;

      // `useGameLoop` already caps delta at 100ms; we add a
      // second guard for callers passing arbitrary values.
      const safeDelta = Math.max(0, Math.min(deltaMs, 100));

      // ----- 1. Enemy spawn -----
      const nextSpawnElapsed = s.enemySpawnElapsedMs + safeDelta;
      let newEnemies = s.enemies;
      if (nextSpawnElapsed >= ENEMY_SPAWN_INTERVAL_MS) {
        const { pos, facing } = pickSpawnEdgeAndPos();
        const id = nextEnemyId++;
        // Initial fire cooldown is randomised per enemy so they
        // don't all fire on the same tick.
        const fireCooldownMs =
          ENEMY_FIRE_INTERVAL_MS_MIN +
          Math.floor(
            pseudoRandom(id * 17) *
              (ENEMY_FIRE_INTERVAL_MS_MAX - ENEMY_FIRE_INTERVAL_MS_MIN),
          );
        newEnemies = [
          ...newEnemies,
          { id, pos, facing, fireCooldownMs },
        ];
      }
      const enemySpawnElapsedMs = nextSpawnElapsed % ENEMY_SPAWN_INTERVAL_MS;

      // ----- 2. Player fire cooldown -----
      const fireCooldownMs = Math.max(0, s.fireCooldownMs - safeDelta);

      // ----- 3. Advance + prune bullets (player + enemy) -----
      // Player bullets: move in `dir`, prune when fully off-screen.
      const movedPlayerBullets: Bullet[] = [];
      for (const b of s.bullets) {
        const v = dirToVec(b.dir);
        const nextX = b.pos.x + v.x * BULLET_SPEED;
        const nextY = b.pos.y + v.y * BULLET_SPEED;
        if (
          nextX + BULLET_W < 0 ||
          nextX > CANVAS_W ||
          nextY + BULLET_H < 0 ||
          nextY > CANVAS_H
        ) {
          continue;
        }
        movedPlayerBullets.push({ ...b, pos: { x: nextX, y: nextY } });
      }
      // Enemy bullets: same logic.
      const movedEnemyBullets: Bullet[] = [];
      for (const b of s.enemyBullets) {
        const v = dirToVec(b.dir);
        const nextX = b.pos.x + v.x * BULLET_SPEED;
        const nextY = b.pos.y + v.y * BULLET_SPEED;
        if (
          nextX + BULLET_W < 0 ||
          nextX > CANVAS_W ||
          nextY + BULLET_H < 0 ||
          nextY > CANVAS_H
        ) {
          continue;
        }
        movedEnemyBullets.push({ ...b, pos: { x: nextX, y: nextY } });
      }

      // ----- 4. Collisions -----
      // 4a. Player bullet ↔ enemy tank. Bullet is consumed, enemy
      //     is consumed, score increments.
      const enemiesAfterPlayerHit: EnemyTank[] = [];
      let score = s.score;
      for (const e of newEnemies) {
        let hit = false;
        for (const b of movedPlayerBullets) {
          if (
            aabbOverlap(
              b.pos.x,
              b.pos.y,
              BULLET_W,
              BULLET_H,
              e.pos.x,
              e.pos.y,
              ENEMY_W,
              ENEMY_H,
            )
          ) {
            hit = true;
            score += POINTS_PER_ENEMY;
            break;
          }
        }
        if (!hit) enemiesAfterPlayerHit.push(e);
      }
      // Player bullets that didn't hit any enemy survive. (We
      // re-scan so a bullet that hit one enemy doesn't re-collide
      // with a *different* enemy later in the loop.)
      const playerBullets: Bullet[] = [];
      for (const b of movedPlayerBullets) {
        let consumed = false;
        for (const e of newEnemies) {
          if (
            aabbOverlap(
              b.pos.x,
              b.pos.y,
              BULLET_W,
              BULLET_H,
              e.pos.x,
              e.pos.y,
              ENEMY_W,
              ENEMY_H,
            )
          ) {
            consumed = true;
            break;
          }
        }
        if (!consumed) playerBullets.push(b);
      }

      // 4b. Enemy bullet ↔ player tank. Bullet is consumed, lives
      //     decrement.
      const survivingEnemyBullets: Bullet[] = [];
      let lives = s.lives;
      for (const b of movedEnemyBullets) {
        if (
          aabbOverlap(
            b.pos.x,
            b.pos.y,
            BULLET_W,
            BULLET_H,
            s.tank.pos.x,
            s.tank.pos.y,
            TANK_W,
            TANK_H,
          )
        ) {
          lives -= 1;
        } else {
          survivingEnemyBullets.push(b);
        }
      }
      const enemyBulletsBeforeFire = survivingEnemyBullets;

      // 4c. Enemy tank ↔ player tank. Both occupy the same space
      //     → lives decrement and the enemy is removed (so the
      //     player doesn't get hit every frame by the same tank).
      const enemiesAfterOverlap: EnemyTank[] = [];
      for (const e of enemiesAfterPlayerHit) {
        if (
          aabbOverlap(
            e.pos.x,
            e.pos.y,
            ENEMY_W,
            ENEMY_H,
            s.tank.pos.x,
            s.tank.pos.y,
            TANK_W,
            TANK_H,
          )
        ) {
          lives -= 1;
        } else {
          enemiesAfterOverlap.push(e);
        }
      }
      const enemies = enemiesAfterOverlap;

      // ----- 5. Move + AI: each enemy advances one step in its
      // facing direction, picks a new random direction at walls,
      // and fires at the player when its cooldown hits zero. -----
      const newEnemyBullets: Bullet[] = [];
      const movedEnemies: EnemyTank[] = enemies.map((e) => {
        const v = dirToVec(e.facing);
        let nextX = e.pos.x + v.x * ENEMY_SPEED;
        let nextY = e.pos.y + v.y * ENEMY_SPEED;
        // Wall bounce: pick a new facing at the wall.
        if (nextX < 0 || nextX + ENEMY_W > CANVAS_W) {
          const newFacing: Direction =
            pseudoRandom(e.id * 23 + nextBulletId) < 0.5 ? 'up' : 'down';
          const vv = dirToVec(newFacing);
          nextX = clamp(e.pos.x + vv.x * ENEMY_SPEED, 0, CANVAS_W - ENEMY_W);
          nextY = clamp(e.pos.y + vv.y * ENEMY_SPEED, 0, CANVAS_H - ENEMY_H);
          return {
            ...e,
            pos: { x: nextX, y: nextY },
            facing: newFacing,
            fireCooldownMs: e.fireCooldownMs - safeDelta,
          };
        }
        if (nextY < 0 || nextY + ENEMY_H > CANVAS_H) {
          const newFacing: Direction =
            pseudoRandom(e.id * 29 + nextBulletId) < 0.5 ? 'left' : 'right';
          const vv = dirToVec(newFacing);
          nextX = clamp(e.pos.x + vv.x * ENEMY_SPEED, 0, CANVAS_W - ENEMY_W);
          nextY = clamp(e.pos.y + vv.y * ENEMY_SPEED, 0, CANVAS_H - ENEMY_H);
          return {
            ...e,
            pos: { x: nextX, y: nextY },
            facing: newFacing,
            fireCooldownMs: e.fireCooldownMs - safeDelta,
          };
        }
        // Fire when the cooldown hits zero.
        if (e.fireCooldownMs - safeDelta <= 0 && lives > 0) {
          // Aim at the player. Pick the cardinal direction whose
          // vector has the larger absolute component to the player.
          const dx = (s.tank.pos.x + TANK_W / 2) - (e.pos.x + ENEMY_W / 2);
          const dy = (s.tank.pos.y + TANK_H / 2) - (e.pos.y + ENEMY_H / 2);
          const dir: Direction =
            Math.abs(dx) >= Math.abs(dy)
              ? dx > 0
                ? 'right'
                : 'left'
              : dy > 0
              ? 'down'
              : 'up';
          // Spawn the bullet at the centre of the enemy tank.
          newEnemyBullets.push({
            id: nextBulletId++,
            pos: {
              x: e.pos.x + ENEMY_W / 2 - BULLET_W / 2,
              y: e.pos.y + ENEMY_H / 2 - BULLET_H / 2,
            },
            dir,
            isPlayer: false,
          });
          return {
            ...e,
            pos: { x: nextX, y: nextY },
            fireCooldownMs:
              ENEMY_FIRE_INTERVAL_MS_MIN +
              Math.floor(
                pseudoRandom(e.id * 31 + nextBulletId) *
                  (ENEMY_FIRE_INTERVAL_MS_MAX -
                    ENEMY_FIRE_INTERVAL_MS_MIN),
              ),
          };
        }
        return {
          ...e,
          pos: { x: nextX, y: nextY },
          fireCooldownMs: e.fireCooldownMs - safeDelta,
        };
      });

      // ----- 6. Game over check -----
      if (lives <= 0) {
        return {
          ...s,
          bullets: playerBullets,
          enemyBullets: [...enemyBulletsBeforeFire, ...newEnemyBullets],
          enemies: movedEnemies,
          lives: 0,
          score,
          fireCooldownMs,
          enemySpawnElapsedMs,
          status: 'gameover',
        };
      }

      return {
        ...s,
        bullets: playerBullets,
        enemyBullets: [...enemyBulletsBeforeFire, ...newEnemyBullets],
        enemies: movedEnemies,
        lives,
        score,
        fireCooldownMs,
        enemySpawnElapsedMs,
        status: 'running',
      };
    });
  }, []);

  const move = useCallback((direction: Direction) => {
    setState((s) => {
      if (s.status !== 'running') return s;
      const dx = direction === 'left' ? -TANK_SPEED : direction === 'right' ? TANK_SPEED : 0;
      const dy = direction === 'up' ? -TANK_SPEED : direction === 'down' ? TANK_SPEED : 0;
      const nextX = clamp(s.tank.pos.x + dx, 0, CANVAS_W - TANK_W);
      const nextY = clamp(s.tank.pos.y + dy, 0, CANVAS_H - TANK_H);
      return {
        ...s,
        tank: {
          pos: { x: nextX, y: nextY },
          facing: direction,
        },
      };
    });
  }, []);

  const fire = useCallback(() => {
    setState((s) => {
      if (s.status !== 'running') return s;
      if (s.fireCooldownMs > 0) return s;
      // Spawn the bullet at the centre of the tank, offset toward
      // the barrel direction so it visually clears the sprite.
      const cx = s.tank.pos.x + TANK_W / 2 - BULLET_W / 2;
      const cy = s.tank.pos.y + TANK_H / 2 - BULLET_H / 2;
      const offset = TANK_W / 2 + 2;
      let bx = cx;
      let by = cy;
      if (s.tank.facing === 'up') by -= offset;
      else if (s.tank.facing === 'down') by += offset;
      else if (s.tank.facing === 'left') bx -= offset;
      else bx += offset;
      return {
        ...s,
        bullets: [
          ...s.bullets,
          {
            id: nextBulletId++,
            pos: { x: bx, y: by },
            dir: s.tank.facing,
            isPlayer: true,
          },
        ],
        fireCooldownMs: PLAYER_FIRE_COOLDOWN_MS,
      };
    });
  }, []);

  // Report every score change through a side-effect. The setState
  // reducer above is pure, so the *only* place that calls onScore
  // is here. `lastReportedScoreRef` is re-initialised to `0` on
  // every remount (Restart re-mounts via `key={restartKey}`), so
  // the first 0→N transition of a fresh run re-fires onScore(N)
  // cleanly. `onScoreRef.current` is mirrored on every render so
  // the shell can swap the callback at any time.
  useEffect(() => {
    if (state.score > lastReportedScoreRef.current) {
      lastReportedScoreRef.current = state.score;
      onScoreRef.current(state.score);
    }
  }, [state.score]);

  // Side-channel: report game-over through a useEffect
  // (StrictMode-safe). `lastReportedGameOverRef` is re-initialised
  // to `false` on every remount, so onGameOver fires exactly once
  // per run with the final `state.score` and markGamePlayed is
  // called exactly once per run.
  useEffect(() => {
    if (state.status === 'gameover' && !lastReportedGameOverRef.current) {
      lastReportedGameOverRef.current = true;
      onGameOverRef.current(state.score);
      if (gameId) useGameStore.getState().markGamePlayed(gameId);
    }
  }, [state.status, state.score, gameId]);

  return { state, step, move, fire };
}
