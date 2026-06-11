// DreamPlay Park — game registry.
//
// Single source of truth mapping a `gameId` (URL param for
// `/play/:gameId`) to its display metadata + the React component that
// renders it. `GamePage` validates the param against this registry;
// unknown ids are redirected to `/`.
//
// The component contract grew in AC-5 (the shell passes `isPaused`,
// `restartKey`, `onScore`, `onGameOver`) and again in AC-6 (the shell
// also passes an optional `onRestart` for in-game "Play Again"
// buttons on the game-over overlay). Each Phase 1 game progressively
// replaces the `PlaceholderGame` with its real component.
import type { ComponentType } from 'react';
import PlaceholderGame from './placeholder';
import { SnakeGame } from './snake';
import { BrickBreakerGame } from './brick-breaker';
import { TetrisGame } from './tetris';

export type GameId =
  | 'snake'
  | 'brick-breaker'
  | 'tetris'
  | 'crystal-2048'
  | 'memory';

export type GameComponentProps = {
  gameId: GameId;
  /** True when the user has paused the game; `useGameLoop` skips ticks. */
  isPaused: boolean;
  /** Increments on Restart; the shell uses this as the React `key`
   *  on the game component so a full re-mount is triggered. */
  restartKey: number;
  /** Report the current score to the shell (which mirrors it into
   *  the ScoreHud and the persisted high score on game over). */
  onScore: (score: number) => void;
  /** Tell the shell the run is over; the shell compares the final
   *  score against the persisted best and writes it through. */
  onGameOver: (finalScore: number) => void;
  /** Ask the shell to restart the run (e.g. from an in-game "Play
   *  Again" button on the game-over overlay). Optional so the
   *  PlaceholderGame and any game that doesn't need it can omit it. */
  onRestart?: () => void;
};

export type GameRegistryEntry = {
  id: GameId;
  /** Display title shown on the game page. */
  title: string;
  /** Attraction name used in the park map (PRD §4 tone). */
  attractionLabel: string;
  /** One-line whimsical description (PRD §4 tone). */
  description: string;
  /** Themed emoji shown on the park map card. */
  emoji: string;
  /** React component that renders the game. */
  component: ComponentType<GameComponentProps>;
};

export const GAME_IDS: readonly GameId[] = [
  'snake',
  'brick-breaker',
  'tetris',
  'crystal-2048',
  'memory',
] as const;

export const GAME_REGISTRY: Record<GameId, GameRegistryEntry> = {
  snake: {
    id: 'snake',
    title: 'Snake Kingdom',
    attractionLabel: 'Snake Castle',
    description: 'Slither through the moonlit castle and gobble up starlight fruit.',
    emoji: '🐍',
    component: SnakeGame as unknown as GameRegistryEntry['component'],
  },
  'brick-breaker': {
    id: 'brick-breaker',
    title: 'Brick Break Castle',
    attractionLabel: 'Brick Break Castle',
    description: 'Bounce a glowing orb to shatter the fortress walls.',
    emoji: '🧱',
    component: BrickBreakerGame as unknown as GameRegistryEntry['component'],
  },
  tetris: {
    id: 'tetris',
    title: 'Puzzle Tower',
    attractionLabel: 'Puzzle Tower',
    description: 'Stack shimmering tetrominoes higher than the clouds.',
    emoji: '🧩',
    component: TetrisGame as unknown as GameRegistryEntry['component'],
  },
  'crystal-2048': {
    id: 'crystal-2048',
    title: 'Crystal Mine',
    attractionLabel: 'Crystal Mine',
    description: 'Merge crystal tiles until you uncover the legendary 2048 gem.',
    emoji: '💎',
    component: PlaceholderGame as unknown as GameRegistryEntry['component'],
  },
  memory: {
    id: 'memory',
    title: 'Magic Garden',
    attractionLabel: 'Memory Garden',
    description: 'Find every pair of enchanted flowers before the petals fall.',
    emoji: '🌸',
    component: PlaceholderGame as unknown as GameRegistryEntry['component'],
  },
};

/** Returns the entry for a gameId, or `undefined` if it is unknown. */
export function getGameEntry(
  gameId: string | undefined,
): GameRegistryEntry | undefined {
  if (!gameId) return undefined;
  return GAME_REGISTRY[gameId as GameId];
}
