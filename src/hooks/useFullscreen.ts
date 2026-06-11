// useFullscreen — small wrapper around the Fullscreen API applied to
// a specific element (the GameShell's canvas wrapper, NOT the whole
// document — per PRD §6 the action bar stays visible).
//
// Returns:
//   * `isFullscreen` — reactive boolean that flips when the user
//     exits fullscreen via Esc or the browser chrome.
//   * `enter(el)` / `exit()` — explicit entry/exit.
//   * `toggle(el)` — convenience: enter if not fullscreen, else exit.
//
// Notes:
//   * Safari iOS pretends to support `requestFullscreen` but always
//     rejects. We swallow the rejection and just leave the button in
//     a "not fullscreen" state — the alternative is an uncaught
//     promise in the click handler.
//   * Server-side / SSR: every Fullscreen API call is guarded by a
//     `typeof document` check so this hook is safe to import even
//     from a non-DOM context.
import { useCallback, useEffect, useState } from 'react';

function documentFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  return document.fullscreenElement;
}

function requestFullscreenOn(el: Element): Promise<void> | null {
  const anyEl = el as Element & {
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
  };
  const fn = anyEl.requestFullscreen ?? anyEl.webkitRequestFullscreen;
  if (!fn) return null;
  try {
    return fn.call(anyEl);
  } catch {
    return null;
  }
}

function exitDocumentFullscreen(): Promise<void> | null {
  if (typeof document === 'undefined') return null;
  const anyDoc = document as Document & {
    exitFullscreen?: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void>;
  };
  const fn = anyDoc.exitFullscreen ?? anyDoc.webkitExitFullscreen;
  if (!fn) return null;
  try {
    return fn.call(anyDoc);
  } catch {
    return null;
  }
}

export type UseFullscreenResult = {
  isFullscreen: boolean;
  enter: (el: Element | null) => void;
  exit: () => void;
  toggle: (el: Element | null) => void;
};

export function useFullscreen(): UseFullscreenResult {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    () => documentFullscreenElement() !== null,
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = () => setIsFullscreen(documentFullscreenElement() !== null);
    document.addEventListener('fullscreenchange', handler);
    // Webkit ships the same event with a vendor prefix on older
    // Safari builds; adding both listeners is a no-op cost.
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  const enter = useCallback((el: Element | null) => {
    if (!el) return;
    const p = requestFullscreenOn(el);
    if (p && typeof p.then === 'function') {
      p.catch(() => {
        /* user agent denied fullscreen — leave state alone */
      });
    }
  }, []);

  const exit = useCallback(() => {
    const p = exitDocumentFullscreen();
    if (p && typeof p.then === 'function') {
      p.catch(() => {
        /* ditto */
      });
    }
  }, []);

  const toggle = useCallback(
    (el: Element | null) => {
      if (documentFullscreenElement()) {
        exit();
      } else {
        enter(el);
      }
    },
    [enter, exit],
  );

  return { isFullscreen, enter, exit, toggle };
}
