// DayNightSky — full-bleed sky gradient that auto-loops through
// morning / sunset / night, with a controlled `auto` prop (the
// parent `ParkMap` owns the toggle). The background interpolates
// between palette gradients using Framer Motion.
//
// The selected phase is bubbled up via `onPhaseChange` so the
// `AmbientLayer` can switch fireflies on at night.
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';

export type SkyPhase = 'morning' | 'sunset' | 'night';

export type DayNightSkyProps = {
  auto: boolean;
  phase: SkyPhase;
  onPhaseChange: (phase: SkyPhase) => void;
  /** How long each phase lasts in auto mode. Default 9s. */
  cycleMs?: number;
};

export const PHASES: SkyPhase[] = ['morning', 'sunset', 'night'];

const GRADIENTS: Record<SkyPhase, string> = {
  morning:
    'linear-gradient(180deg, #AEE2FF 0%, #C7F9FF 45%, #FFF5E4 100%)',
  sunset:
    'linear-gradient(180deg, #FFD6EC 0%, #FFF5E4 50%, #2B2D42 100%)',
  night:
    'linear-gradient(180deg, #2B2D42 0%, #3A506B 60%, #5BC0BE 100%)',
};

export default function DayNightSky({
  auto,
  phase,
  onPhaseChange,
  cycleMs = 9000,
}: DayNightSkyProps) {
  const reduce = useReducedMotion();

  // Auto cycle. Reduced-motion users never enter auto mode.
  useEffect(() => {
    if (!auto || reduce) return;
    const id = window.setInterval(() => {
      onPhaseChange(PHASES[(PHASES.indexOf(phase) + 1) % PHASES.length]);
    }, cycleMs);
    return () => window.clearInterval(id);
  }, [auto, cycleMs, reduce, phase, onPhaseChange]);

  return (
    <motion.div
      data-testid="day-night-sky"
      data-phase={phase}
      aria-hidden
      className="absolute inset-0 -z-10"
      animate={{ background: GRADIENTS[phase] }}
      transition={{ duration: reduce ? 0 : 2.2, ease: 'easeInOut' }}
    />
  );
}

export { GRADIENTS };
