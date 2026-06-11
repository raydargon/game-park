// DecorationLayer — visual layer that drops a small SVG behind
// every attraction card when its achievement is unlocked.
//
// The container is `pointer-events: none` so the layer never
// blocks clicks on the underlying cards. The container is
// `aria-hidden` because each decoration also has its own
// `role="img"` + `aria-label` for screen readers (the labels
// come from `src/store/decorations.ts`).
//
// Per-decorations structure:
//   1. Outer `<motion.div>` handles the entrance / exit
//      animation (Framer Motion's `AnimatePresence` with a
//      scale + opacity fade-in over ~0.5s).
//   2. Inner `<div>` carries the CSS keyframe loop
//      (`decoration-float`, `decoration-breathe`, etc.).
//   3. The visual itself is an inline `<svg>` chosen by
//      `id` from a small switch. The visuals are intentionally
//      tiny (a few shapes per SVG) so the JSX stays readable
//      and we don't pull in a 3rd-party icon set.
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import {
  DECORATION_BY_ID,
  type Decoration,
  type DecorationAnimation,
} from '../../store/decorations';
import type { AchievementId } from '../../store/achievements';

const ANIMATION_CLASS: Record<DecorationAnimation, string> = {
  float: 'decoration-float',
  breathe: 'decoration-breathe',
  pulse: 'decoration-pulse',
};

export default function DecorationLayer() {
  const reduce = useReducedMotion();
  const unlocked = useGameStore((s) => s.unlockedDecorations);

  return (
    <div
      data-testid="decoration-layer"
      aria-hidden={false}
      className="pointer-events-none absolute inset-0 z-0"
    >
      <AnimatePresence>
        {unlocked.map((id) => {
          const spec = DECORATION_BY_ID[id];
          if (!spec) return null;
          return (
            <Decoration
              key={id}
              spec={spec}
              reduceMotion={Boolean(reduce)}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ----- Single decoration -----

type DecorationProps = {
  spec: Decoration;
  reduceMotion: boolean;
};

function Decoration({ spec, reduceMotion }: DecorationProps) {
  const animClass = reduceMotion ? '' : ANIMATION_CLASS[spec.animation];
  return (
    <motion.div
      data-testid={`decoration-${spec.id}`}
      data-decoration-id={spec.id}
      role="img"
      aria-label={spec.label}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={
        reduceMotion
          ? { duration: 0.18 }
          : { type: 'spring', stiffness: 220, damping: 18, mass: 0.7 }
      }
      style={{
        position: 'absolute',
        top: spec.position.top,
        left: spec.position.left,
        right: spec.position.right,
        bottom: spec.position.bottom,
        width: spec.size.width,
        height: spec.size.height,
        transformOrigin: spec.transformOrigin ?? 'center',
        // Offset the position to anchor from the bottom-left
        // when only top + width are given, etc. The CSS
        // `translate(-50%, -50%)` here is opt-in per id (we use
        // `transformOrigin: 'center'` to make it intuitive).
      }}
    >
      <div
        className={`h-full w-full ${animClass}`}
        style={{ transformOrigin: spec.transformOrigin ?? 'center' }}
      >
        <DecorationVisual id={spec.id} caption={spec.caption} />
      </div>
    </motion.div>
  );
}

// ----- Visuals per achievement id -----

function DecorationVisual({
  id,
  caption,
}: {
  id: AchievementId;
  caption?: string;
}) {
  switch (id) {
    case 'snake-100':
      return <SnakeEggTrophy />;
    case 'snake-200':
      return <SnakeMasterCrown />;
    case 'brick-1000':
      return <BrickRubble />;
    case 'tetris-4096':
      return <FloatingCrystals />;
    case 'memory-perfect':
      return <FlowerBed />;
    case 'park-explorer':
      return <ParkExplorerBanner caption={caption} />;
    default:
      return null;
  }
}

// --- snake-100: golden snake-egg trophy on a pedestal ---

function SnakeEggTrophy() {
  return (
    <svg
      viewBox="0 0 96 116"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id="snake-egg-glow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#FFF4B8" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#FFD6EC" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFD6EC" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="snake-egg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF4B8" />
          <stop offset="100%" stopColor="#FFD6EC" />
        </linearGradient>
      </defs>
      {/* Halo behind the egg */}
      <circle cx="48" cy="40" r="36" fill="url(#snake-egg-glow)" />
      {/* Pedestal */}
      <rect
        x="22"
        y="86"
        width="52"
        height="22"
        rx="4"
        fill="#3A506B"
        stroke="#5BC0BE"
        strokeWidth="2"
      />
      <rect x="22" y="86" width="52" height="6" fill="#5BC0BE" />
      {/* Egg */}
      <ellipse
        cx="48"
        cy="40"
        rx="20"
        ry="26"
        fill="url(#snake-egg)"
        stroke="#5BC0BE"
        strokeWidth="1.5"
      />
      {/* Sparkle */}
      <g fill="#FFF5E4">
        <circle cx="42" cy="32" r="2" />
        <circle cx="54" cy="44" r="1.5" />
        <circle cx="46" cy="50" r="1" />
      </g>
      {/* Snake on top */}
      <path
        d="M 38 16 Q 42 6 48 14 T 58 14"
        fill="none"
        stroke="#D7FFD9"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="58" cy="14" r="2.4" fill="#D7FFD9" />
    </svg>
  );
}

// --- snake-200: snake-master crown ---

function SnakeMasterCrown() {
  return (
    <svg
      viewBox="0 0 72 72"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="snake-crown" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF4B8" />
          <stop offset="100%" stopColor="#FFD6EC" />
        </linearGradient>
      </defs>
      {/* Crown body */}
      <path
        d="M 12 48 L 16 24 L 26 36 L 36 18 L 46 36 L 56 24 L 60 48 Z"
        fill="url(#snake-crown)"
        stroke="#5BC0BE"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Crown band */}
      <rect
        x="12"
        y="48"
        width="48"
        height="8"
        rx="2"
        fill="url(#snake-crown)"
        stroke="#5BC0BE"
        strokeWidth="2"
      />
      {/* Gems */}
      <circle cx="36" cy="28" r="3" fill="#5BC0BE" />
      <circle cx="22" cy="36" r="2" fill="#B8E8FC" />
      <circle cx="50" cy="36" r="2" fill="#B8E8FC" />
      {/* Snake on top */}
      <path
        d="M 30 14 Q 36 4 42 14"
        fill="none"
        stroke="#D7FFD9"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="42" cy="14" r="2" fill="#D7FFD9" />
    </svg>
  );
}

// --- brick-1000: pile of broken bricks ---

function BrickRubble() {
  // Four colored brick rows, slightly rotated and offset for a
  // "rubble" feel.
  const bricks: Array<{ x: number; y: number; w: number; h: number; c: string; r: number }> = [
    { x: 8, y: 50, w: 30, h: 12, c: '#FFD6EC', r: -4 },
    { x: 42, y: 46, w: 28, h: 12, c: '#FFF4B8', r: 5 },
    { x: 76, y: 52, w: 26, h: 10, c: '#B8E8FC', r: -2 },
    { x: 18, y: 64, w: 32, h: 12, c: '#D7FFD9', r: 3 },
    { x: 60, y: 66, w: 30, h: 12, c: '#5BC0BE', r: -6 },
  ];
  return (
    <svg
      viewBox="0 0 120 86"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {bricks.map((b, i) => (
        <g key={i} transform={`rotate(${b.r} ${b.x + b.w / 2} ${b.y + b.h / 2})`}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={2}
            fill={b.c}
            stroke="rgba(43, 45, 66, 0.35)"
            strokeWidth={1}
          />
          {/* Tiny crack line */}
          <line
            x1={b.x + b.w * 0.3}
            y1={b.y + b.h * 0.2}
            x2={b.x + b.w * 0.5}
            y2={b.y + b.h * 0.8}
            stroke="rgba(43, 45, 66, 0.45)"
            strokeWidth={0.8}
          />
        </g>
      ))}
      {/* Pebbles */}
      <circle cx="14" cy="80" r="3" fill="#5BC0BE" opacity="0.7" />
      <circle cx="48" cy="82" r="2.5" fill="#FFD6EC" opacity="0.7" />
      <circle cx="100" cy="80" r="2" fill="#B8E8FC" opacity="0.7" />
    </svg>
  );
}

// --- tetris-4096: cluster of three floating crystals ---

function FloatingCrystals() {
  return (
    <svg
      viewBox="0 0 88 100"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="crystal-a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B8E8FC" />
          <stop offset="100%" stopColor="#5BC0BE" />
        </linearGradient>
        <linearGradient id="crystal-b" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF4B8" />
          <stop offset="100%" stopColor="#FFD6EC" />
        </linearGradient>
        <linearGradient id="crystal-c" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D7FFD9" />
          <stop offset="100%" stopColor="#5BC0BE" />
        </linearGradient>
      </defs>
      {/* Big crystal, center */}
      <polygon
        points="44,12 60,32 50,58 38,58 28,32"
        fill="url(#crystal-a)"
        stroke="#2B2D42"
        strokeWidth="1"
        opacity="0.95"
      />
      {/* Highlight */}
      <polyline
        points="44,12 50,18 44,28"
        fill="rgba(255,255,255,0.5)"
        stroke="none"
      />
      {/* Left small crystal */}
      <polygon
        points="14,52 22,64 18,76 10,72 8,62"
        fill="url(#crystal-b)"
        stroke="#2B2D42"
        strokeWidth="1"
        opacity="0.95"
      />
      {/* Right small crystal */}
      <polygon
        points="70,58 80,68 76,80 64,78 64,66"
        fill="url(#crystal-c)"
        stroke="#2B2D42"
        strokeWidth="1"
        opacity="0.95"
      />
      {/* Sparkles */}
      <g fill="#FFF5E4">
        <circle cx="50" cy="22" r="1.4" />
        <circle cx="14" cy="44" r="1.2" />
        <circle cx="74" cy="50" r="1.2" />
      </g>
    </svg>
  );
}

// --- memory-perfect: glowing flower bed ---

function FlowerBed() {
  return (
    <svg
      viewBox="0 0 168 84"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id="flower-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD6EC" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FFD6EC" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Soft glow strip */}
      <ellipse cx="84" cy="62" rx="80" ry="18" fill="url(#flower-glow)" />
      {/* Ground line */}
      <rect x="0" y="68" width="168" height="14" rx="6" fill="#3A506B" />
      {/* Five flowers spaced across the bed */}
      {[
        { x: 20, c: '#FFD6EC' },
        { x: 56, c: '#B8E8FC' },
        { x: 88, c: '#FFF4B8' },
        { x: 116, c: '#D7FFD9' },
        { x: 148, c: '#FFD6EC' },
      ].map((f, i) => (
        <g key={i}>
          {/* Stem */}
          <line
            x1={f.x}
            y1="68"
            x2={f.x}
            y2="48"
            stroke="#D7FFD9"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Petals (5-leaf flower) */}
          <g transform={`translate(${f.x} 40)`}>
            {[0, 72, 144, 216, 288].map((deg) => (
              <ellipse
                key={deg}
                cx="0"
                cy="-7"
                rx="4.5"
                ry="7"
                fill={f.c}
                transform={`rotate(${deg})`}
                opacity="0.95"
              />
            ))}
            <circle cx="0" cy="0" r="3" fill="#FFF4B8" />
          </g>
        </g>
      ))}
      {/* Leaves on the ground */}
      <ellipse cx="36" cy="68" rx="6" ry="2" fill="#D7FFD9" opacity="0.8" />
      <ellipse cx="128" cy="68" rx="6" ry="2" fill="#D7FFD9" opacity="0.8" />
    </svg>
  );
}

// --- park-explorer: celebratory banner ---

function ParkExplorerBanner({ caption }: { caption?: string }) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      style={{ transform: 'translateX(-50%)' }}
    >
      <svg
        viewBox="0 0 240 56"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="banner-fill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD6EC" />
            <stop offset="50%" stopColor="#FFF4B8" />
            <stop offset="100%" stopColor="#B8E8FC" />
          </linearGradient>
        </defs>
        {/* Ribbon ends (notched) */}
        <path
          d="M 0 14 L 240 14 L 240 42 L 0 42 Z"
          fill="url(#banner-fill)"
          stroke="#5BC0BE"
          strokeWidth="1.5"
        />
        <path d="M 0 14 L 10 28 L 0 42 Z" fill="#5BC0BE" />
        <path d="M 240 14 L 230 28 L 240 42 Z" fill="#5BC0BE" />
        {/* Stars */}
        <g fill="#FFF5E4">
          <circle cx="22" cy="28" r="2.5" />
          <circle cx="218" cy="28" r="2.5" />
        </g>
      </svg>
      {caption && (
        <span
          className="absolute inset-0 flex items-center justify-center text-base font-bold uppercase tracking-[0.2em] text-night-deep drop-shadow"
        >
          {caption}
        </span>
      )}
    </div>
  );
}
