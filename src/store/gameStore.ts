// gameStore — single source of truth for all persisted state in
// DreamPlay Park. Uses Zustand's `persist` middleware to write through
// to `localStorage` under one key (`dreamplay.v1`, per PRD §13).
//
// AC-5 introduced `highscores` (per game). AC-10 added `setBestTime`
// for lower-is-better games. AC-11 extends the store with:
//   * `achievements`         — array of unlocked achievement ids.
//   * `unlockedDecorations`  — 1:1 mirror of `achievements` (AC-13
//                              keys park decorations by the same id).
//   * `playedGames`          — set of gameIds that have had at
//                              least one game-over (used by
//                              `park-explorer`).
//   * `totalBricksCleared`   — lifetime count, used by
//                              `brick-1000`.
//   * `crystalBestTile`      — best tile value reached in
//                              Crystal Mine (used by
//                              `tetris-4096`).
//   * `soundOn`              — ambient wind-pad toggle.
//   * `dayNightAuto`         — whether the park map cycles through
//                              morning/sunset/night automatically.
//   * `prefersReducedMotion` — read from
//                              `window.matchMedia(...)` once at
//                              boot.
//
// The store also owns a small event bus for `AchievementUnlocked`
// events. The popup in AC-12 will subscribe to it; we don't bake
// the React render path into the store so the pure achievements
// module can be unit-tested without DOM.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameId } from '../games/registry';
import {
  ACHIEVEMENT_BY_ID,
  evaluateAchievements,
  makeAchievementEvent,
  type AchievementId,
  type AchievementUnlockedEvent,
  type AchievementState,
} from './achievements';

/** Per-game high scores. Missing entries mean "never played". */
export type HighScores = Partial<Record<GameId, number>>;

/** Snapshot of the achievement-relevant slice. The watcher builds
 *  this on every store change and hands it to the pure
 *  `evaluateAchievements` helper. */
export type AchievementSlice = Pick<
  GameStore,
  'highscores' | 'playedGames' | 'totalBricksCleared' | 'crystalBestTile'
>;

export type GameStore = {
  // -- existing --
  highscores: HighScores;
  // -- AC-11 additions --
  achievements: AchievementId[];
  unlockedDecorations: AchievementId[];
  playedGames: GameId[];
  totalBricksCleared: number;
  crystalBestTile: number;
  soundOn: boolean;
  dayNightAuto: boolean;
  prefersReducedMotion: boolean;

  // -- existing actions --
  setHighScore: (gameId: GameId, score: number) => boolean;
  setBestTime: (gameId: GameId, seconds: number) => boolean;
  // -- AC-11 actions --
  markGamePlayed: (gameId: GameId) => void;
  incrementBricksCleared: (count?: number) => void;
  recordCrystalBestTile: (tile: number) => void;
  setSoundOn: (on: boolean) => void;
  setDayNightAuto: (auto: boolean) => void;
  setPrefersReducedMotion: (reduce: boolean) => void;
};

/** Read the user's reduced-motion preference. Wrapped in a
 *  typeof-window guard so SSR / non-browser test environments
 *  don't blow up. */
function readPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Event-bus subscribers. A module-level Set is fine because the
 *  app has a single store instance and the subscription count is
 *  tiny (one subscriber per mounted popup, usually 0–1). The
 *  callbacks are invoked synchronously, so subscribers should not
 *  throw. */
const achievementSubscribers = new Set<(event: AchievementUnlockedEvent) => void>();

/** Subscribe to `AchievementUnlocked` events. Returns an
 *  unsubscribe function. Safe to call from any React effect or
 *  from outside React. */
export function subscribeToAchievements(
  callback: (event: AchievementUnlockedEvent) => void,
): () => void {
  achievementSubscribers.add(callback);
  return () => {
    achievementSubscribers.delete(callback);
  };
}

function emitAchievementUnlocked(id: AchievementId): void {
  // Defensive: a stale unlock for a deleted achievement id
  // shouldn't crash the popup. Just skip it.
  if (!ACHIEVEMENT_BY_ID[id]) return;
  const event = makeAchievementEvent(id, Date.now());
  for (const sub of achievementSubscribers) {
    try {
      sub(event);
    } catch (e) {
      // Subscriber threw — log and continue. We don't want one
      // buggy subscriber to break the others.
      // eslint-disable-next-line no-console
      console.warn('[gameStore] achievement subscriber threw', e);
    }
  }
}

/** Bump `achievements` + `unlockedDecorations` and fire the event.
 *  Idempotent — calling it twice for the same id is a no-op the
 *  second time. */
function applyUnlock(
  state: GameStore,
  id: AchievementId,
): { next: GameStore; isNew: boolean } {
  if (state.achievements.includes(id)) {
    return { next: state, isNew: false };
  }
  return {
    next: {
      ...state,
      achievements: [...state.achievements, id],
      unlockedDecorations: [...state.unlockedDecorations, id],
    },
    isNew: true,
  };
}

/** Evaluate every achievement check against the current slice and
 *  unlock the newly-earned ones. Returns the list of newly
 *  unlocked ids so the caller can fire events. */
function runAchievementChecks(state: GameStore): AchievementId[] {
  const slice: AchievementState = {
    highscores: state.highscores,
    playedGames: state.playedGames,
    totalBricksCleared: state.totalBricksCleared,
    crystalBestTile: state.crystalBestTile,
  };
  const candidates = evaluateAchievements(slice, state.achievements);
  return candidates;
}

/**
 * The single Zustand store. Persisted to
 * `localStorage[dreamplay.v1]`. The `partialize` projection
 * mirrors exactly what we want to round-trip; Zustand will skip
 * the functions automatically.
 */
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      highscores: {},
      achievements: [],
      unlockedDecorations: [],
      playedGames: [],
      totalBricksCleared: 0,
      crystalBestTile: 0,
      soundOn: false,
      dayNightAuto: true,
      prefersReducedMotion: readPrefersReducedMotion(),

      // ----- existing actions -----

      setHighScore: (gameId, score) => {
        const prev = get().highscores[gameId] ?? 0;
        if (score <= prev) return false;
        set((state) => ({
          highscores: { ...state.highscores, [gameId]: score },
        }));
        return true;
      },

      setBestTime: (gameId, seconds) => {
        if (!Number.isFinite(seconds) || seconds <= 0) return false;
        const safe = Math.floor(seconds);
        const prev = get().highscores[gameId] ?? 0;
        if (prev > 0 && safe >= prev) return false;
        set((state) => ({
          highscores: { ...state.highscores, [gameId]: safe },
        }));
        return true;
      },

      // ----- AC-11 actions -----

      /** Record that the player finished a run of `gameId`.
       *  Idempotent — re-records are a no-op so the watcher
       *  doesn't have to gate the call. */
      markGamePlayed: (gameId) => {
        set((state) => {
          if (state.playedGames.includes(gameId)) return state;
          return { ...state, playedGames: [...state.playedGames, gameId] };
        });
      },

      /** Add `count` (default 1) to the lifetime bricks-cleared
       *  counter. Used by the Brick Breaker hook on every brick
       *  kill. */
      incrementBricksCleared: (count = 1) => {
        if (!Number.isFinite(count) || count <= 0) return;
        set((state) => ({
          ...state,
          totalBricksCleared: state.totalBricksCleared + Math.floor(count),
        }));
      },

      /** Update the persisted best tile reached in Crystal Mine.
       *  Only writes if the new value is strictly greater than
       *  the existing record. */
      recordCrystalBestTile: (tile) => {
        if (!Number.isFinite(tile) || tile <= 0) return;
        set((state) => {
          if (tile <= state.crystalBestTile) return state;
          return { ...state, crystalBestTile: Math.floor(tile) };
        });
      },

      setSoundOn: (on) => {
        set((state) => ({ ...state, soundOn: Boolean(on) }));
      },

      setDayNightAuto: (auto) => {
        set((state) => ({ ...state, dayNightAuto: Boolean(auto) }));
      },

      setPrefersReducedMotion: (reduce) => {
        set((state) => ({ ...state, prefersReducedMotion: Boolean(reduce) }));
      },
    }),
    {
      name: 'dreamplay.v1',
      // Persist the data slice. Functions are skipped by Zustand
      // automatically, but we project explicitly to keep the
      // shape tight and to make future schema migrations easy.
      partialize: (state) => ({
        highscores: state.highscores,
        achievements: state.achievements,
        unlockedDecorations: state.unlockedDecorations,
        playedGames: state.playedGames,
        totalBricksCleared: state.totalBricksCleared,
        crystalBestTile: state.crystalBestTile,
        soundOn: state.soundOn,
        dayNightAuto: state.dayNightAuto,
        // `prefersReducedMotion` is intentionally re-derived on
        // each boot, not persisted — the user's system setting
        // can change between sessions.
      }),
      version: 1,
    },
  ),
);

/** Run all achievement checks and unlock any newly-earned ones.
 *  Returns the list of newly-unlocked ids (caller is responsible
 *  for firing the `AchievementUnlocked` event — usually the
 *  watcher does this in one place). */
export function checkAndUnlockAchievements(): AchievementId[] {
  const state = useGameStore.getState();
  const candidates = runAchievementChecks(state);
  if (candidates.length === 0) return [];
  const newlyUnlocked: AchievementId[] = [];
  for (const id of candidates) {
    // Re-read state each iteration because `set` is async; the
    // next call sees the previous unlock applied.
    const current = useGameStore.getState();
    const { next, isNew } = applyUnlock(current, id);
    if (!isNew) continue;
    useGameStore.setState(next);
    newlyUnlocked.push(id);
    emitAchievementUnlocked(id);
  }
  return newlyUnlocked;
}
