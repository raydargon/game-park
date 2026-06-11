// ParticleBurst — N floating particle dots that drift up and fade.
//
// Used by:
//   * `src/pages/ParkPage/AttractionCard.tsx` — the per-card hover
//     effect (≥6 floating dots, AC-4).
//   * `src/pages/ParkPage/AmbientLayer.tsx` — the ambient "magic
//     particles" that drift across the park.
//
// Positions / sizes / durations are derived from a small mulberry32
// PRNG seeded by `seed` so the layout is stable across renders and
// between SSR and CSR (avoids hydration flicker).
import { motion } from 'framer-motion';
import { useMemo } from 'react';

export type ParticleBurstProps = {
  count?: number;
  className?: string;
  /** Tailwind background-color class for each particle. */
  color?: string;
  /** Deterministic seed for the PRNG (so positions don't jitter). */
  seed?: number;
};

type Particle = {
  id: number;
  xPct: number;
  yPct: number;
  size: number;
  delay: number;
  duration: number;
  dx: number;
  dy: number;
};

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export default function ParticleBurst({
  count = 8,
  className = '',
  color = 'bg-fantasy-cream',
  seed = 1,
}: ParticleBurstProps) {
  const particles = useMemo<Particle[]>(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      xPct: rand() * 100,
      yPct: 60 + rand() * 30, // 60-90% from the top
      size: 4 + rand() * 6, // 4-10px
      delay: rand() * 2.5,
      duration: 2.5 + rand() * 2.5,
      dx: -18 + rand() * 36, // ±18px lateral drift
      dy: -40 - rand() * 40, // -40 to -80px upward
    }));
  }, [count, seed]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className={`absolute block rounded-full ${color}`}
          style={{
            left: `${p.xPct}%`,
            top: `${p.yPct}%`,
            width: p.size,
            height: p.size,
            filter: 'drop-shadow(0 0 6px currentColor)',
          }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 0.9, 0],
            x: p.dx,
            y: p.dy,
            scale: [0.6, 1, 0.6],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
