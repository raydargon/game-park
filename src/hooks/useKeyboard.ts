// useKeyboard — subscribes to window `keydown` and dispatches to the
// supplied handler map. Stable across renders: the latest handler
// bag is mirrored into a ref so callers never have to memoize.
//
// Recognized aliases (PRD §6 controls are a mix of WASD and arrows):
//   * `ArrowUp`    ← ArrowUp / w / W
//   * `ArrowDown`  ← ArrowDown / s / S
//   * `ArrowLeft`  ← ArrowLeft / a / A
//   * `ArrowRight` ← ArrowRight / d / D
//   * `Space`      ← ` ` / Space / Spacebar
//   * `Shift`      ← Shift / ShiftLeft / ShiftRight
//   * `Enter`      ← Enter / Return
//   * `Escape`     ← Escape / Esc
//
// Direct matches on `event.key` always win over aliases so a game can
// listen for an exact `Tab` if it needs to (no alias defined for it).
import { useEffect, useRef } from 'react';

export type KeyboardHandler = (event: KeyboardEvent) => void;
export type KeyboardHandlers = Record<string, KeyboardHandler>;

const KEY_ALIASES: Record<string, readonly string[]> = {
  ArrowUp: ['ArrowUp', 'w', 'W'],
  ArrowDown: ['ArrowDown', 's', 'S'],
  ArrowLeft: ['ArrowLeft', 'a', 'A'],
  ArrowRight: ['ArrowRight', 'd', 'D'],
  Space: [' ', 'Space', 'Spacebar'],
  Shift: ['Shift', 'ShiftLeft', 'ShiftRight'],
  Enter: ['Enter', 'Return'],
  Escape: ['Escape', 'Esc'],
};

export function useKeyboard(handlers: KeyboardHandlers): void {
  const ref = useRef<KeyboardHandlers>(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const h = ref.current;
      // Direct match first — gives callers a way to opt out of an alias
      // (e.g. listening for a raw Tab that has no alias).
      const direct = h[event.key];
      if (direct) {
        direct(event);
        return;
      }
      for (const alias of Object.keys(KEY_ALIASES)) {
        const keys = KEY_ALIASES[alias];
        if (keys && keys.includes(event.key) && h[alias]) {
          h[alias](event);
          return;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
