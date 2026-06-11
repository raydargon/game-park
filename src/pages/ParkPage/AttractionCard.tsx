// AttractionCard — one of the five park attractions.
//
// Hover state (per AC-4):
//   * scales to 1.05 via Framer Motion's `whileHover`
//   * glow ring in the attraction's accent color
//   * 8 floating particle dots (ParticleBurst)
//   * a small mascot "wave" gesture using a CSS @keyframes animation
//     declared in `index.css`
//
// Click triggers a callback that the parent `ParkMap` uses to start
// the camera-zoom transition. Reduced-motion users get no scale.
import { motion, useReducedMotion } from 'framer-motion';
import type { MouseEvent } from 'react';
import ParticleBurst from '../../components/ParticleBurst';
import type { AttractionLayout } from './attractionLayout';

export type AttractionCardProps = {
  id: string;
  title: string;
  attractionLabel: string;
  description: string;
  emoji: string;
  layout: AttractionLayout;
  /** Called with the click event so the parent can position the
   *  camera-zoom overlay at the card's center. */
  onSelect: (id: string, event: MouseEvent<HTMLButtonElement>) => void;
};

export default function AttractionCard({
  id,
  title,
  attractionLabel,
  description,
  emoji,
  layout,
  onSelect,
}: AttractionCardProps) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      data-attraction-id={id}
      data-testid={`attraction-${id}`}
      onClick={(e) => onSelect(id, e)}
      className={`group relative isolate flex h-full min-h-[11rem] w-full flex-col items-start gap-2 overflow-hidden rounded-3xl border border-white/10 ${layout.bodyGradient} p-5 text-left shadow-lg backdrop-blur-sm transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream hover:shadow-2xl hover:ring-4 hover:ring-offset-0 ${layout.glowRing}`}
      style={{ gridArea: layout.area }}
      whileHover={reduce ? undefined : { scale: 1.05 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
    >
      {/* Floating particle burst — visible on hover via group-hover. */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <ParticleBurst
          count={8}
          color="bg-fantasy-cream"
          seed={id
            .split('')
            .reduce((acc, ch) => acc + ch.charCodeAt(0), 1)}
        />
      </div>

      <div className="flex w-full items-start justify-between gap-3">
        <span
          aria-hidden
          className="mascot-wave inline-block text-4xl drop-shadow"
          style={{ transformOrigin: '70% 80%' }}
        >
          {emoji}
        </span>
        <span
          aria-hidden
          className={`rounded-full bg-night-deep/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${layout.titleColor}`}
        >
          {attractionLabel}
        </span>
      </div>

      <h2
        className={`text-2xl font-bold tracking-tight ${layout.titleColor} drop-shadow`}
      >
        {title}
      </h2>
      <p className="text-sm text-slate-100/90">{description}</p>

      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-sky-sunset">
        Enter attraction →
      </span>
    </motion.button>
  );
}
