// useAchievementWatcher — a no-op render hook that subscribes to
// the game store and re-evaluates every achievement check on each
// change. Newly-unlocked achievements are added to the store and
// the corresponding `AchievementUnlocked` event is fired via the
// store's pub-sub (the popup in AC-12 subscribes to it).
//
// The hook itself does not render anything — it exists so the
// subscription is owned by the React lifecycle. Mount it once at
// the top of the app (App.tsx) and it will keep working across
// route changes.
import { useEffect } from 'react';
import { checkAndUnlockAchievements, useGameStore } from '../store/gameStore';

/** Mount the achievement watcher. Returns nothing. Safe to mount
 *  multiple times — every mount re-subscribes and the unsubscribe
 *  cleanup runs on unmount, so there are no duplicate event
 *  firings. */
export function useAchievementWatcher(): void {
  useEffect(() => {
    // Run once on mount to pick up achievements that should have
    // been earned before the watcher attached (e.g. the player
    // already has a `snake-100`-worthy high score from a previous
    // session but the `park-explorer` rule depends on a brand-new
    // `markGamePlayed` call). The store has the data, the pure
    // checks decide.
    checkAndUnlockAchievements();

    // Subscribe to *every* store change. We don't need to inspect
    // the previous state because the pure `evaluateAchievements`
    // is cheap (6 checks, all O(1)) and dedup'd by the
    // `alreadyUnlocked` set. The Zustand subscribe API is
    // `subscribe(listener)`, returning an unsubscribe fn.
    const unsubscribe = useGameStore.subscribe(() => {
      checkAndUnlockAchievements();
    });
    return unsubscribe;
  }, []);
}
