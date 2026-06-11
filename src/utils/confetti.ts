// src/utils/confetti.ts — celebratory burst for achievement unlocks.
//
// The `canvas-confetti` package is large (≈9 kB gzipped). The plan
// explicitly says to dynamic-import it so the main bundle stays
// under the 500 kB AC-14 budget. We only fetch the library the
// first time an achievement fires and cache the resolved module,
// so subsequent bursts are synchronous.
//
// API:
//   * `fireConfetti(opts?)` — twin bursts from both bottom
//     corners, in the dreamplay fantasy palette. Returns a
//     promise that resolves once the burst has been queued.
//   * `prefersReducedMotion()` — read the user's preference (we
//     don't auto-skip confetti here; the popup component is the
//     one that decides which side-effects to fire).
import type { Options as ConfettiOptions } from 'canvas-confetti';

type ConfettiFn = (opts?: ConfettiOptions) => void;

let cached: Promise<ConfettiFn | null> | null = null;

/** Lazily load the canvas-confetti library. Returns `null` on
 *  failure (e.g. SSR, no window, blocked by CSP) so the caller
 *  can degrade silently. */
function loadConfetti(): Promise<ConfettiFn | null> {
  if (cached) return cached;
  cached = (async () => {
    if (typeof window === 'undefined') return null;
    try {
      // The package's default export is the `confetti()` function.
      const mod = await import('canvas-confetti');
      // Some bundlers expose the function as `.default`; others
      // put it on the namespace. Handle both.
      const fn: unknown =
        (mod as unknown as { default?: ConfettiFn }).default ?? mod;
      if (typeof fn !== 'function') return null;
      return fn as ConfettiFn;
    } catch {
      // Network or import error — fall back to a no-op.
      return null;
    }
  })();
  return cached;
}

/** Read the user's reduced-motion preference. Mirrors the
 *  `prefersReducedMotion` field in the store but is available
 *  before the store is created (or in non-React contexts). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Fire a celebratory confetti burst. Returns a promise that
 *  resolves once the import + first paint is queued; the actual
 *  animation runs over ~1.2s. Safe to call repeatedly. */
export async function fireConfetti(): Promise<void> {
  if (prefersReducedMotion()) return;
  const confetti = await loadConfetti();
  if (!confetti) return;
  // Twin corner bursts using the fantasy palette so the colors
  // match the rest of the park (sky-sunset, fantasy-pink,
  // fantasy-blue, fantasy-cream, night-glow).
  const colors = [
    '#FFF5E4', // sky-sunset
    '#FFD6EC', // fantasy-pink
    '#B8E8FC', // fantasy-blue
    '#FFF4B8', // fantasy-cream
    '#5BC0BE', // night-glow
  ];
  const defaults: ConfettiOptions = {
    spread: 70,
    startVelocity: 45,
    ticks: 200,
    colors,
    scalar: 0.9,
    disableForReducedMotion: true,
  };
  // Bottom-left burst
  confetti({
    ...defaults,
    particleCount: 60,
    angle: 60,
    origin: { x: 0, y: 1 },
  });
  // Bottom-right burst
  confetti({
    ...defaults,
    particleCount: 60,
    angle: 120,
    origin: { x: 1, y: 1 },
  });
  // Centered sprinkle (smaller, slower) for the second beat.
  window.setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 40,
      spread: 360,
      startVelocity: 20,
      origin: { x: 0.5, y: 0.6 },
    });
  }, 180);
}
