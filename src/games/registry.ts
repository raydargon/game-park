// DreamPlay Park — game registry.
//
// Single source of truth mapping a `gameId` (URL param for
// `/play/:gameId`) to its display metadata + the React component that
// renders it. `GamePage` validates the param against this registry;
// unknown ids are redirected to `/`.
//
// Each entry's `component` is a placeholder until the real
// `useXxxGame` hook + Canvas implementation lands in AC-6+. The
// metadata here is what the ParkMap will use to render the five
// attraction cards in AC-4.
import type { ComponentType } from 'react';
import PlaceholderGame from './placeholder';

export type GameId =
  | 'snake'
  | 'brick-breaker'
  | 'tetris'
  | 'crystal-2048'
  | 'memory';

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
  component: ComponentType<{ gameId: GameId }>;
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
  // The placeholder accepts a generic `gameId`; the registry type
  // guarantees a `GameId` at every call site.
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
