// DreamPlay Park — game registry.
//
// Single source of truth mapping a `gameId` (URL param for
// `/play/:gameId`) to its display metadata + the React component that
// renders it. `GamePage` validates the param against this registry;
// unknown ids are redirected to `/`.
//
// The component contract expanded in AC-5: the shell passes
// `isPaused`, `restartKey`, `onScore`, and `onGameOver` to every
// game, so the registry type guarantees a consistent interface
// across all five Phase 1 attractions.
import type { ComponentType } from 'react';
import PlaceholderGame from './placeholder';

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

const makeEntry = (
  id: GameId,
  title: string,
  attractionLabel: string,
  description: string,
  emoji: string,
): GameRegistryEntry => ({
  id,
  title,
  attractionLabel,
  description,
  emoji,
  // The placeholder accepts the full `GameComponentProps` shape; the
  // registry type guarantees a complete prop bag at every call site.
  component: PlaceholderGame as unknown as GameRegistryEntry['component'],
});

export const GAME_REGISTRY: Record<GameId, GameRegistryEntry> = {
  snake: makeEntry(
    'snake',
    'Snake Kingdom',
    'Snake Castle',
    'Slither through the moonlit castle and gobble up starlight fruit.',
    '🐍',
  ),
  'brick-breaker': makeEntry(
    'brick-breaker',
    'Brick Break Castle',
    'Brick Break Castle',
    'Bounce a glowing orb to shatter the fortress walls.',
    '🧱',
  ),
  tetris: makeEntry(
    'tetris',
    'Puzzle Tower',
    'Puzzle Tower',
    'Stack shimmering tetrominoes higher than the clouds.',
    '🧩',
  ),
  'crystal-2048': makeEntry(
    'crystal-2048',
    'Crystal Mine',
    'Crystal Mine',
    'Merge crystal tiles until you uncover the legendary 2048 gem.',
    '💎',
  ),
  memory: makeEntry(
    'memory',
    'Magic Garden',
    'Memory Garden',
    'Find every pair of enchanted flowers before the petals fall.',
    '🌸',
  ),
};

/** Returns the entry for a gameId, or `undefined` if it is unknown. */
export function getGameEntry(
  gameId: string | undefined,
): GameRegistryEntry | undefined {
  if (!gameId) return undefined;
  return GAME_REGISTRY[gameId as GameId];
}
