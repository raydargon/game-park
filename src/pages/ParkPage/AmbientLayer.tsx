// AmbientLayer — drifting clouds, floating balloons, fireflies at
// night, and a soft field of magic particles. All decorative; sits
// behind the attraction cards and the toolbar.
//
// Cloud drift + balloon float use CSS keyframes (in `index.css`) so
// they keep moving on the compositor without React re-renders.
// Fireflies and magic particles use Framer Motion because they need
// per-element random keyframes that can't be expressed in pure CSS.
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import type { SkyPhase } from './DayNightSky';

export type AmbientLayerProps = {
  phase: SkyPhase;
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

function Clouds() {
  return (
    <div className="ambient-clouds" aria-hidden>
      <span className="cloud cloud-1" />
      <span className="cloud cloud-2" />
      <span className="cloud cloud-3" />
    </div>
  );
}

function Balloons() {
  return (
    <div className="ambient-balloons" aria-hidden>
      <span className="balloon balloon-1">🎈</span>
      <span className="balloon balloon-2">🎈</span>
      <span className="balloon balloon-3">🎈</span>
    </div>
  );
}

function Fireflies() {
  const reduce = useReducedMotion();
  const items = useMemo(() => {
    const rand = mulberry32(42);
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      xPct: rand() * 100,
      yPct: 20 + rand() * 60,
      size: 3 + rand() * 4,
      delay: rand() * 3,
      duration: 1.5 + rand() * 1.5,
    }));
  }, []);
  return (
    <div className="ambient-fireflies" aria-hidden>
      {items.map((f) => (
        <motion.span
          key={f.id}
          className="block rounded-full bg-fantasy-cream"
          style={{
            left: `${f.xPct}%`,
            top: `${f.yPct}%`,
            width: f.size,
            height: f.size,
            filter: 'drop-shadow(0 0 6px currentColor)',
            color: '#FFF4B8',
            position: 'absolute',
          }}
          initial={{ opacity: 0 }}
          animate={
            reduce
              ? { opacity: 0.8 }
              : { opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }
          }
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: reduce ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function MagicParticles() {
  const reduce = useReducedMotion();
  const items = useMemo(() => {
    const rand = mulberry32(7);
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      xPct: rand() * 100,
      yPct: rand() * 100,
      size: 5 + rand() * 7,
      delay: rand() * 4,
      duration: 6 + rand() * 6,
      dx: -30 + rand() * 60,
      dy: -30 + rand() * 60,
      tone: ['#FFD6EC', '#B8E8FC', '#D7FFD9', '#FFF4B8', '#5BC0BE'][
        Math.floor(rand() * 5)
      ] as string,
    }));
  }, []);
  return (
    <div className="ambient-particles" aria-hidden>
      {items.map((p) => (
        <motion.span
          key={p.id}
          className="block rounded-full"
          style={{
            position: 'absolute',
            left: `${p.xPct}%`,
            top: `${p.yPct}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.tone,
            opacity: 0.6,
            filter: 'blur(0.5px) drop-shadow(0 0 6px currentColor)',
          }}
          animate={
            reduce
              ? { opacity: 0.4 }
              : { x: [0, p.dx, 0], y: [0, p.dy, 0], opacity: [0.3, 0.7, 0.3] }
          }
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: reduce ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function AmbientLayer({ phase }: AmbientLayerProps) {
  return (
    <div
      data-testid="ambient-layer"
      data-phase={phase}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <Clouds />
      <Balloons />
      {phase === 'night' ? <Fireflies /> : <MagicParticles />}
    </div>
  );
}
