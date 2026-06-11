// Achievement definitions for DreamPlay Park.
//
// This module is intentionally pure: no React, no Zustand, no
// localStorage. The store imports the check functions and the
// `useAchievementWatcher` hook (in `src/hooks/`) drives the
// evaluation loop. Keeping the rules here means they can be
// unit-tested without spinning up the React tree.
//
// Each `Achievement` carries:
//   * `id`       — stable string id (persisted in the store).
//   * `title`    — short popup heading.
//   * `description` — one-line explanation, shown in the popup body.
//   * `emoji`    — whimsical icon (used in popup + decorations).
//   * `check(state)` — pure predicate; returns `true` once the
//                     achievement has been earned.
//
// `evaluateAchievements(state, alreadyUnlocked)` returns the list
// of *newly* unlocked ids — ids whose `check()` returns `true`
// that are not already in `alreadyUnlocked`. This is the function
// the watcher calls after every store change.
import type { GameId } from '../games/registry';

/** The stable id of every achievement the park tracks. */
export type AchievementId =
  | 'snake-100'
  | 'snake-200'
  | 'brick-1000'
  | 'tetris-4096'
  | 'memory-perfect'
  | 'park-explorer';

/** A slice of the store that achievement checks need. We type
 *  this explicitly so a unit test can build it without booting
 *  the whole store. */
export type AchievementState = {
  highscores: Partial<Record<GameId, number>>;
  playedGames: readonly GameId[];
  totalBricksCleared: number;
  crystalBestTile: number;
};

export type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  emoji: string;
  check: (state: AchievementState) => boolean;
};

/** The full list, in the order they should appear in any UI
 *  (popups, achievements panel, etc.). Keep this stable — the
 *  index is meaningful for visual ordering only, the `id` is the
 *  source of truth for persistence. */
export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'snake-100',
    title: 'Snake Apprentice',
    description: 'Score 100 points in Snake Kingdom.',
    emoji: '🐍',
    check: (s) => (s.highscores.snake ?? 0) >= 100,
  },
  {
    id: 'snake-200',
    title: 'Snake Master',
    description: 'Score 200 points in Snake Kingdom.',
    emoji: '🐍',
    check: (s) => (s.highscores.snake ?? 0) >= 200,
  },
  {
    id: 'brick-1000',
    title: 'Castle Crusher',
    description: 'Clear 1,000 bricks across all Brick Break Castle runs.',
    emoji: '🧱',
    check: (s) => s.totalBricksCleared >= 1000,
  },
  {
    id: 'tetris-4096',
    title: 'Crystal Sage',
    description: 'Reach the 4,096 tile in Crystal Mine.',
    emoji: '💎',
    check: (s) => s.crystalBestTile >= 4096,
  },
  {
    id: 'memory-perfect',
    title: 'Memory Maestro',
    description: 'Finish Magic Garden in under 60 seconds.',
    emoji: '🌸',
    // `highscores.memory` is a lower-is-better best-time in seconds.
    // A value of 0 means "never completed", so we also require a
    // positive value before unlocking.
    check: (s) => (s.highscores.memory ?? 0) > 0 && (s.highscores.memory ?? 0) < 60,
  },
  {
    id: 'park-explorer',
    title: 'Park Explorer',
    description: 'Play all five Phase 1 attractions at least once.',
    emoji: '🎟️',
    check: (s) => {
      const required: GameId[] = [
        'snake',
        'brick-breaker',
        'tetris',
        'crystal-2048',
        'memory',
      ];
      const played = new Set<GameId>(s.playedGames);
      return required.every((g) => played.has(g));
    },
  },
] as const;

/** Lookup map for fast access by id. */
export const ACHIEVEMENT_BY_ID: Readonly<
  Record<AchievementId, Achievement>
> = ACHIEVEMENTS.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<AchievementId, Achievement>,
);

/** Given a state snapshot and the current set of unlocked ids,
 *  return the ids that are *newly* earned — i.e. their check
 *  returns `true` and they aren't already unlocked. */
export function evaluateAchievements(
  state: AchievementState,
  alreadyUnlocked: readonly AchievementId[],
): AchievementId[] {
  const owned = new Set<AchievementId>(alreadyUnlocked);
  const newly: AchievementId[] = [];
  for (const a of ACHIEVEMENTS) {
    if (owned.has(a.id)) continue;
    try {
      if (a.check(state)) newly.push(a.id);
    } catch {
      // Defensive: a buggy check should not break the rest of
      // the evaluation pass. The achievement stays locked until
      // the check is fixed.
    }
  }
  return newly;
}

/** Build the payload for the `AchievementUnlocked` event. */
export function makeAchievementEvent(
  id: AchievementId,
  unlockedAt: number,
): AchievementUnlockedEvent {
  const a = ACHIEVEMENT_BY_ID[id];
  return {
    type: 'achievement-unlocked',
    id,
    title: a.title,
    description: a.description,
    emoji: a.emoji,
    unlockedAt,
  };
}

/** Payload pushed through the event bus when an achievement
 *  unlocks. The popup in AC-12 will subscribe to this. */
export type AchievementUnlockedEvent = {
  type: 'achievement-unlocked';
  id: AchievementId;
  title: string;
  description: string;
  emoji: string;
  unlockedAt: number;
};
