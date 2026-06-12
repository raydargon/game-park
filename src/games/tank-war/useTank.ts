// useTank — pure logic hook for Tank Battlegrounds.
//
// State machine: `'running' | 'gameover'`. The hook starts in
// `'running'`; the game loop dispatches `step()` on every animation
// frame, which (for now) is a no-op — the player tank is driven
// entirely by the keyboard, not by an internal tick.
//
//   * `step()` — currently a no-op; exists so the call site
//     (`TankGame.tsx`) can use the same `useGameLoop` pattern as the
//     other games. AC-9 will make this move bullets + AI tanks.
//
//   * `move(direction)` — set the desired facing direction and
//     translate the tank by one frame's worth of `TANK_SPEED` in
//     that direction. Walls clamp the tank to the playfield.
//
//   * `reset()` is *not* exposed: the GameShell re-mounts the game
//     via `key={restartKey}` on Restart, so the hook re-initialises
//     fresh state via `createInitialState`.
//
// All side effects (`onGameOver`, `markGamePlayed`) flow through
// refs + a useEffect so the setState reducers stay pure
// (StrictMode-safe). Score reporting, enemy AI, bullets, and lives
// land in AC-9.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { GameId } from '../registry';
import {
  CANVAS_H,
  CANVAS_W,
  TANK_H,
  TANK_SPAWN_X,
  TANK_SPAWN_Y,
  TANK_SPEED,
  TANK_W,
} from './constants';
import type { TankState } from './types';

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
  /** Per-frame tick. No-op in the AC-8 scaffold. */
  step: () => void;
  /** Set the desired facing direction and translate the tank by
   *  `TANK_SPEED` in that direction. Walls clamp. */
  move: (direction: 'up' | 'down' | 'left' | 'right') => void;
};

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function createInitialState(): TankState {
  return {
    tank: {
      pos: { x: TANK_SPAWN_X, y: TANK_SPAWN_Y },
      facing: 'up',
    },
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

  // `gameover` latch (re-initialised on every remount, so Restart
  // zeros the call count). `onScore` reporting lands in AC-9; the
  // ref is mirrored now so the future AC-9 patch doesn't have to
  // re-plumb it.
  const lastReportedGameOverRef = useRef(false);

  const step = useCallback(() => {
    // No-op for the AC-8 scaffold. The tank is keyboard-driven, so
    // the rAF tick doesn't need to do anything until AC-9 adds
    // bullets, enemy AI, and lives.
  }, []);

  const move = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
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
    },
    [],
  );

  // Side-channel: report game-over through a useEffect
  // (StrictMode-safe). `lastReportedGameOverRef` is re-initialised
  // to `false` on every remount (Restart re-mounts via
  // `key={restartKey}`), so onGameOver fires exactly once per run.
  // AC-9 will replace the no-op `step` with bullet/AI logic and
  // flip the status to `'gameover'` on a player hit.
  useEffect(() => {
    if (state.status === 'gameover' && !lastReportedGameOverRef.current) {
      lastReportedGameOverRef.current = true;
      onGameOverRef.current(0);
      if (gameId) useGameStore.getState().markGamePlayed(gameId);
    }
  }, [state.status, gameId]);

  // Avoid unused-var lint for the score ref (AC-9 will consume it).
  void onScoreRef;

  return { state, step, move };
}
