// gameStore — single source of truth for all persisted state in
// DreamPlay Park. Uses Zustand's `persist` middleware to write through
// to `localStorage` under one key (`dreamplay.v1`, per PRD §13).
//
// AC-5 only needs the `highscores` field. The rest of the keys listed
// in AC-11 (`achievements`, `unlockedDecorations`, `soundOn`,
// `dayNightAuto`, `prefersReducedMotion`) will be added to this same
// store in a later iteration. Keeping the store in a single file
// (rather than splitting per-AC) means the `persist` middleware runs
// once and the versioned schema is owned in one place.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameId } from '../games/registry';

/** Per-game high scores. Missing entries mean "never played". */
export type HighScores = Partial<Record<GameId, number>>;

export type GameStore = {
  highscores: HighScores;
  /**
   * Update the stored best for `gameId` if `score` beats the existing
   * value. Returns `true` if a new high score was set, so the caller
   * can fire the achievement watcher (AC-11).
   */
  setHighScore: (gameId: GameId, score: number) => boolean;
};

/**
 * AC-5 store. Persisted to `localStorage[dreamplay.v1]` via Zustand's
 * `persist` middleware. The shape here is intentionally minimal — AC-11
 * will extend the slice in place (additive) so existing saved values
 * from earlier ACs keep working.
 */
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      highscores: {},
      setHighScore: (gameId, score) => {
        const prev = get().highscores[gameId] ?? 0;
        if (score <= prev) return false;
        set((state) => ({
          highscores: { ...state.highscores, [gameId]: score },
        }));
        return true;
      },
    }),
    {
      name: 'dreamplay.v1',
      // Only persist the data slice. The setter is a function, not
      // JSON, and Zustand will skip it.
      partialize: (state) => ({ highscores: state.highscores }),
      // Defensive: a corrupt localStorage blob should not crash the
      // app. Reset to the empty initial state and let the game fill
      // it in again.
      version: 1,
    },
  ),
);
