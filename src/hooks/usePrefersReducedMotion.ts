// usePrefersReducedMotion — subscribes to the user's
// `(prefers-reduced-motion: reduce)` media query.
//
// Framer Motion also exports `useReducedMotion`; we wrap it so the
// rest of the app can stay engine-agnostic and so it stays false
// during SSR (Framer Motion's hook returns `null` initially).
import { useEffect, useState } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return reduced;
}
