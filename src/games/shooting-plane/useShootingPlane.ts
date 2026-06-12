// useShootingPlane — pure logic hook for Sky Squadron.
//
// State machine: 'running' | 'gameover'. The hook starts in
// 'running' so the first frame doesn't need a status === 'ready'
// branch (the AC-1 tetris bug was the inverse: an initial
// 'ready' that the running-gate let through, locking the spawn
// piece on frame 0).
//
// AC-11 ships only the scaffold + reachability. The real
// physics / enemy waves / lives / scoring land in AC-12. For now
// the hook exposes:
//   * state — PlaneState with the plane at the spawn position
//     and status: 'running'.
//   * move(direction) — translates the plane by PLANE_SPEED
//     and updates its facing. Already wired to the keyboard
//     handlers in ShootingPlaneGame.tsx so AC-12 inherits the
//     same arrow-key / WASD contract the other games use.
//   * step(deltaMs) — a no-op stub. It exists so AC-12 can
//     attach it to useGameLoop without re-wiring the game
//     component; the loop correctly pauses on isPaused ||
//     state.status === 'gameover' from day one.
//
// All side effects (onScore, onGameOver, markGamePlayed) flow
// through refs + a useEffect so the setState reducers stay pure
// (StrictMode-safe). Latches are re-initialised on every remount,
// so Restart zeros the call counts.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { GameId } from '../registry';
import {
  CANVAS_H,
  CANVAS_W,
  PLANE_H,
  PLANE_SPAWN_X,
  PLANE_SPAWN_Y,
  PLANE_SPEED,
  PLANE_W,
} from './constants';
import type { Direction, PlaneState } from './types';

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
  /** Per-frame physics + AI tick. AC-11 ships a no-op so
   *  useGameLoop is already wired; AC-12 fills in the bullet
   *  advance + enemy spawn + collision pipeline. */
  step: (deltaMs?: number) => void;
  /** Keyboard input — translate the plane and update its facing. */
  move: (direction: Direction) => void;
};

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function createInitialState(): PlaneState {
  return {
    plane: {
      pos: { x: PLANE_SPAWN_X, y: PLANE_SPAWN_Y },
      facing: 'up',
    },
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

  // AC-12 will track the last reported score and the gameover
  // latch; the refs are declared now so the useEffect below
  // can reference them and AC-12 only has to extend the
  // reducer + add the score reporting useEffect.
  const lastReportedGameOverRef = useRef(false);

  // AC-11 stub: a no-op step. The loop will still call this on
  // every animation frame (when not paused / gameover), and the
  // spawn state already satisfies AC-1 / AC-2's "no gameover on
  // first render" rule.
  const step = useCallback((_deltaMs: number = 0) => {
    // Intentionally empty in AC-11. AC-12 fills in the bullet
    // advance, enemy spawn, and collision resolution here.
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

  // Side-channel: report game-over through a useEffect
  // (StrictMode-safe). lastReportedGameOverRef is re-initialised
  // to false on every remount, so when AC-12 wires the real
  // gameover transition, onGameOver fires exactly once per run
  // and markGamePlayed is called exactly once per run.
  useEffect(() => {
    if (state.status === 'gameover' && !lastReportedGameOverRef.current) {
      lastReportedGameOverRef.current = true;
      onGameOverRef.current(0);
      if (gameId) useGameStore.getState().markGamePlayed(gameId);
    }
  }, [state.status, gameId]);

  return { state, step, move };
}
