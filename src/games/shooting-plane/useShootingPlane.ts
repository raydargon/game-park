// useShootingPlane — pure logic hook for Sky Squadron.
//
// State machine: 'running' | 'gameover'. The hook starts in
// 'running'; the game loop dispatches step(deltaMs) on every
// animation frame, which (in this order):
//   1. Spawns a new enemy if the spawn interval has elapsed.
//   2. Ticks the player's fire cooldown toward zero.
//   3. Advances player + enemy bullets and prunes off-screen ones.
//   4. Resolves collisions: player bullet ↔ enemy plane, enemy
//      bullet ↔ player plane, enemy plane ↔ player plane. Player
//      bullet ↔ enemy increments the score; enemy bullet / enemy
//      plane ↔ player decrements lives.
//   5. Moves enemy planes one step down (ENEMY_SPEED px/frame).
//      Decrements the enemy's fire cooldown; on hit zero, fires
//      a bullet straight down and resets the cooldown to a random
//      value in [ENEMY_FIRE_INTERVAL_MS_MIN, MAX].
//   6. Flips status to 'gameover' when lives <= 0.
//
// Public API:
//   * step(deltaMs) — per-frame physics + AI tick.
//   * move(direction) — keyboard input; translates the plane by
//     PLANE_SPEED and updates its facing.
//   * fire() — spawns a player bullet straight up. No-op if the
//     fire cooldown hasn't elapsed.
//
//   * reset() is *not* exposed: the GameShell re-mounts the game
//     via key={restartKey} on Restart, so the hook re-initialises
//     fresh state via createInitialState.
//
// All side effects (onScore, onGameOver, markGamePlayed) flow
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
  ENEMY_BULLET_H,
  ENEMY_BULLET_SPEED,
  ENEMY_BULLET_W,
  ENEMY_FIRE_INTERVAL_MS_MAX,
  ENEMY_FIRE_INTERVAL_MS_MIN,
  ENEMY_H,
  ENEMY_SPAWN_INTERVAL_MS,
  ENEMY_SPEED,
  ENEMY_W,
  LIVES_START,
  PLANE_H,
  PLANE_SPAWN_X,
  PLANE_SPAWN_Y,
  PLANE_SPEED,
  PLANE_W,
  PLAYER_FIRE_COOLDOWN_MS,
  POINTS_PER_ENEMY,
} from './constants';
import type {
  Bullet,
  Direction,
  EnemyPlane,
  PlaneState,
} from './types';

export type UseShootingPlaneArgs = {
  /** Game id (e.g. 'shooting-plane'). Used to mark the game as
   *  played for the park-explorer achievement when the run
   *  ends. */
  gameId?: GameId;
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
};

export type UseShootingPlaneResult = {
  state: PlaneState;
  /** Per-frame physics + AI tick. */
  step: (deltaMs?: number) => void;
  /** Keyboard input — translate the plane and update its facing. */
  move: (direction: Direction) => void;
  /** Fire a player bullet straight up. */
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

function pseudoRandom(seed: number): number {
  // mulberry32-ish; same idea as useSnake.pseudoRandom and
  // useTank.pseudoRandom. Used for spawn-x selection and the
  // per-enemy fire-cooldown init so a given run is reproducible
  // for snapshot tests.
  const t = (seed * 9301 + 49297) % 233280;
  return t / 233280;
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

function createInitialState(): PlaneState {
  return {
    plane: {
      pos: { x: PLANE_SPAWN_X, y: PLANE_SPAWN_Y },
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

export function useShootingPlane({
  gameId,
  onScore,
  onGameOver,
}: UseShootingPlaneArgs): UseShootingPlaneResult {
  const [state, setState] = useState<PlaneState>(() => createInitialState());

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

      // useGameLoop already caps delta at 100ms; we add a
      // second guard for callers passing arbitrary values.
      const safeDelta = Math.max(0, Math.min(deltaMs, 100));

      // ----- 1. Enemy spawn -----
      const nextSpawnElapsed = s.enemySpawnElapsedMs + safeDelta;
      let newEnemies = s.enemies;
      if (nextSpawnElapsed >= ENEMY_SPAWN_INTERVAL_MS) {
        const id = nextEnemyId++;
        // Random x position along the top edge (so the enemy
        // has the full canvas width to descend through).
        const pos = {
          x: Math.floor(pseudoRandom(id * 7) * (CANVAS_W - ENEMY_W)),
          y: 0,
        };
        // Initial fire cooldown is randomised per enemy so they
        // don't all fire on the same tick.
        const fireCooldownMs =
          ENEMY_FIRE_INTERVAL_MS_MIN +
          Math.floor(
            pseudoRandom(id * 17) *
              (ENEMY_FIRE_INTERVAL_MS_MAX - ENEMY_FIRE_INTERVAL_MS_MIN),
          );
        newEnemies = [...newEnemies, { id, pos, fireCooldownMs }];
      }
      const enemySpawnElapsedMs = nextSpawnElapsed % ENEMY_SPAWN_INTERVAL_MS;

      // ----- 2. Player fire cooldown -----
      const fireCooldownMs = Math.max(0, s.fireCooldownMs - safeDelta);

      // ----- 3. Advance + prune bullets (player + enemy) -----
      // Player bullets: travel up. Prune when fully off-screen.
      const movedPlayerBullets: Bullet[] = [];
      for (const b of s.bullets) {
        const nextY = b.pos.y - BULLET_SPEED;
        if (nextY + BULLET_H < 0) continue;
        movedPlayerBullets.push({ ...b, pos: { x: b.pos.x, y: nextY } });
      }
      // Enemy bullets: travel down. Prune when fully off-screen.
      const movedEnemyBullets: Bullet[] = [];
      for (const b of s.enemyBullets) {
        const nextY = b.pos.y + ENEMY_BULLET_SPEED;
        if (nextY > CANVAS_H) continue;
        movedEnemyBullets.push({ ...b, pos: { x: b.pos.x, y: nextY } });
      }

      // ----- 4. Collisions -----
      // 4a. Player bullet ↔ enemy plane. Bullet is consumed,
      //     enemy is consumed, score increments.
      const enemiesAfterPlayerHit: EnemyPlane[] = [];
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

      // 4b. Enemy bullet ↔ player plane. Bullet is consumed,
      //     lives decrement.
      const survivingEnemyBullets: Bullet[] = [];
      let lives = s.lives;
      for (const b of movedEnemyBullets) {
        if (
          aabbOverlap(
            b.pos.x,
            b.pos.y,
            ENEMY_BULLET_W,
            ENEMY_BULLET_H,
            s.plane.pos.x,
            s.plane.pos.y,
            PLANE_W,
            PLANE_H,
          )
        ) {
          lives -= 1;
        } else {
          survivingEnemyBullets.push(b);
        }
      }

      // 4c. Enemy plane ↔ player plane. Both occupy the same
      //     space → lives decrement and the enemy is removed
      //     (so the player doesn't get hit every frame by the
      //     same plane).
      const enemiesAfterOverlap: EnemyPlane[] = [];
      for (const e of enemiesAfterPlayerHit) {
        if (
          aabbOverlap(
            e.pos.x,
            e.pos.y,
            ENEMY_W,
            ENEMY_H,
            s.plane.pos.x,
            s.plane.pos.y,
            PLANE_W,
            PLANE_H,
          )
        ) {
          lives -= 1;
        } else {
          enemiesAfterOverlap.push(e);
        }
      }

      // ----- 5. Move + AI: each enemy descends one step and
      // fires a bullet straight down when its cooldown hits
      // zero. -----
      const newEnemyBullets: Bullet[] = [];
      const movedEnemies: EnemyPlane[] = enemiesAfterOverlap.map((e) => {
        const nextY = e.pos.y + ENEMY_SPEED;
        // If the enemy has fully descended off the bottom edge,
        // drop it (no lives penalty — the player just survived).
        if (nextY > CANVAS_H) return null;
        // Fire when the cooldown hits zero.
        if (e.fireCooldownMs - safeDelta <= 0 && lives > 0) {
          newEnemyBullets.push({
            id: nextBulletId++,
            pos: {
              x: e.pos.x + ENEMY_W / 2 - ENEMY_BULLET_W / 2,
              y: e.pos.y + ENEMY_H,
            },
            isPlayer: false,
          });
          return {
            ...e,
            pos: { x: e.pos.x, y: nextY },
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
          pos: { x: e.pos.x, y: nextY },
          fireCooldownMs: e.fireCooldownMs - safeDelta,
        };
      }).filter((e): e is EnemyPlane => e !== null);

      // ----- 6. Game over check -----
      if (lives <= 0) {
        return {
          ...s,
          bullets: playerBullets,
          enemyBullets: [...survivingEnemyBullets, ...newEnemyBullets],
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
        enemyBullets: [...survivingEnemyBullets, ...newEnemyBullets],
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
      const dx = direction === 'left' ? -PLANE_SPEED : direction === 'right' ? PLANE_SPEED : 0;
      const dy = direction === 'up' ? -PLANE_SPEED : direction === 'down' ? PLANE_SPEED : 0;
      const nextX = clamp(s.plane.pos.x + dx, 0, CANVAS_W - PLANE_W);
      const nextY = clamp(s.plane.pos.y + dy, 0, CANVAS_H - PLANE_H);
      return {
        ...s,
        plane: {
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
      // Spawn the bullet at the centre-top of the plane sprite
      // so it visually clears the cockpit on the first frame.
      return {
        ...s,
        bullets: [
          ...s.bullets,
          {
            id: nextBulletId++,
            pos: {
              x: s.plane.pos.x + PLANE_W / 2 - BULLET_W / 2,
              y: s.plane.pos.y - BULLET_H,
            },
            isPlayer: true,
          },
        ],
        fireCooldownMs: PLAYER_FIRE_COOLDOWN_MS,
      };
    });
  }, []);

  // Report every score change through a side-effect. The setState
  // reducer above is pure, so the *only* place that calls onScore
  // is here. lastReportedScoreRef is re-initialised to 0 on every
  // remount (Restart re-mounts via key={restartKey}), so the
  // first 0→N transition of a fresh run re-fires onScore(N)
  // cleanly. onScoreRef.current is mirrored on every render so
  // the shell can swap the callback at any time.
  useEffect(() => {
    if (state.score > lastReportedScoreRef.current) {
      lastReportedScoreRef.current = state.score;
      onScoreRef.current(state.score);
    }
  }, [state.score]);

  // Side-channel: report game-over through a useEffect
  // (StrictMode-safe). lastReportedGameOverRef is re-initialised
  // to false on every remount, so onGameOver fires exactly once
  // per run with the final state.score and markGamePlayed is
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
