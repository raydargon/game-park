// AchievementPopup — the centered "you unlocked X" card that
// fires whenever the achievement watcher (AC-11) emits an
// `AchievementUnlocked` event.
//
// Behavior per the plan (AC-12):
//   * Confetti burst (`canvas-confetti`, dynamic-imported).
//   * Soft chime (WebAudio via `playChime` in `src/utils/sound.ts`).
//   * Centered popup with title + description, fades in for
//     ~3 seconds, then fades out.
//   * `prefers-reduced-motion` users see a static banner
//     (no confetti, no chime, no scale animation; the card
//     still appears so the user gets the message).
//
// The component maintains a small FIFO queue so two unlocks
// fired in quick succession (e.g. a snake run that crosses
// BOTH `snake-100` and `snake-200`) play one after the other
// rather than overlapping on screen. Each popup stays for
// `DISPLAY_MS` total; if the queue has more items they're
// shown back-to-back.
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  subscribeToAchievements,
  useGameStore,
} from '../store/gameStore';
import type { AchievementUnlockedEvent } from '../store/achievements';
import { fireConfetti } from '../utils/confetti';
import { playChime } from '../utils/sound';

/** How long each popup stays on screen, in milliseconds. Per
 *  the spec: "fades in for ~3s". We split the budget as
 *  220 ms fade-in + 2.4 s hold + 380 ms fade-out. */
const DISPLAY_MS = 3000;
const QUEUE_DRAIN_DELAY_MS = 320;

export type AchievementPopupProps = {
  /** Optional override of the test-id (for testing). */
  testIdPrefix?: string;
};

export default function AchievementPopup({
  testIdPrefix = 'achievement',
}: AchievementPopupProps) {
  const [current, setCurrent] = useState<AchievementUnlockedEvent | null>(
    null,
  );
  const queueRef = useRef<AchievementUnlockedEvent[]>([]);
  const drainingRef = useRef(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Read the live reduced-motion preference straight from the
  // store (set at boot in AC-11). `useReducedMotion()` is the
  // Framer Motion helper; it can flip after the user changes
  // their system setting, which is what we want for the
  // animation choice below.
  const reduced = useReducedMotion();
  const storeReduced = useGameStore((s) => s.prefersReducedMotion);
  // Combine the two — Framer Motion's hook is the source of
  // truth for *animation* preferences, the store's field is
  // for *side-effect* (confetti, chime) gating. If either says
  // "reduce", we go with the static banner.
  const reduceMotion = Boolean(reduced) || storeReduced;

  // `drainQueue` reads `reduceMotion` and uses refs for the
  // mutable state (queue, draining flag, dismiss timer). We
  // memoize it on `reduceMotion` so the closure stays current
  // for the time-based callbacks.
  const drainQueue = useCallback(() => {
    const next = queueRef.current.shift() ?? null;
    if (!next) {
      drainingRef.current = false;
      return;
    }
    setCurrent(next);
    if (!reduceMotion) {
      // Side effects (confetti + chime) only for non-reduced
      // users. We intentionally don't await the confetti
      // promise — the popup should appear immediately, the
      // confetti is a parallel side effect.
      void fireConfetti();
      playChime();
    }
    dismissTimerRef.current = window.setTimeout(() => {
      setCurrent(null);
      // Small gap so the fade-out animation has a chance to
      // play before the next popup mounts.
      window.setTimeout(drainQueue, QUEUE_DRAIN_DELAY_MS);
    }, DISPLAY_MS);
  }, [reduceMotion]);

  const enqueue = useCallback(
    (event: AchievementUnlockedEvent) => {
      queueRef.current.push(event);
      if (!drainingRef.current) {
        drainingRef.current = true;
        // Defer the first dismiss to the next tick so the
        // subscribe callback (which runs in a Zustand microtask
        // during a setState) doesn't update state during render.
        window.setTimeout(drainQueue, 0);
      }
    },
    [drainQueue],
  );

  // Subscribe to the achievement event bus.
  useEffect(() => {
    const unsubscribe = subscribeToAchievements((event) => {
      enqueue(event);
    });
    return () => {
      unsubscribe();
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      drainingRef.current = false;
      queueRef.current = [];
    };
  }, [enqueue]);

  return (
    <div
      data-testid={`${testIdPrefix}-popup-root`}
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
    >
      <AnimatePresence>
        {current && (
          <motion.div
            key={`${current.id}-${current.unlockedAt}`}
            data-testid={`${testIdPrefix}-popup`}
            data-achievement-id={current.id}
            role="status"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 12 }}
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: -8 }}
            transition={
              reduceMotion
                ? { duration: 0.18 }
                : { type: 'spring', stiffness: 320, damping: 22 }
            }
            className="pointer-events-auto mx-4 w-full max-w-sm rounded-3xl border border-fantasy-cream/40 bg-night-deep/90 px-6 py-5 text-center text-slate-50 shadow-2xl backdrop-blur-md"
          >
            <p
              data-testid={`${testIdPrefix}-popup-eyebrow`}
              className="text-[10px] font-semibold uppercase tracking-[0.4em] text-night-glow"
            >
              Achievement Unlocked
            </p>
            <div
              data-testid={`${testIdPrefix}-popup-emoji`}
              className="mt-3 text-5xl drop-shadow"
              aria-hidden
            >
              {current.emoji}
            </div>
            <h2
              data-testid={`${testIdPrefix}-popup-title`}
              className="mt-2 text-2xl font-bold tracking-tight text-sky-sunset"
            >
              {current.title}
            </h2>
            <p
              data-testid={`${testIdPrefix}-popup-description`}
              className="mt-1.5 text-sm text-slate-200/90"
            >
              {current.description}
            </p>
            {reduceMotion && (
              <p
                data-testid={`${testIdPrefix}-popup-reduced`}
                className="mt-3 text-[10px] uppercase tracking-widest text-slate-400/80"
              >
                Reduced motion
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Re-export the event-bus subscription type so future
 *  consumers (e.g. an `AchievementsPanel` debug widget) can
 *  type their own callback. */
export type { AchievementUnlockedEvent };
