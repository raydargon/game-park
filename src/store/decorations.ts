// Decorations registry — pure metadata for every achievement's
// park-map visual.
//
// AC-13 spec: each unlocked achievement should drop a visual
// layer into the park map (per the plan: "snake-100 → golden
// statue SVG behind Snake Castle; tetris-4096 → floating
// crystals; memory-perfect → glowing flower bed"). This module
// is the single source of truth for *where* each decoration
// lives and *how* it animates. The actual SVG rendering lives
// in `src/pages/ParkPage/DecorationLayer.tsx` so the registry
// stays React-free and unit-testable.
//
// Positioning is done with CSS values (%, px) relative to the
// attraction grid `<section>`. The grid uses a 3-column, 2-row
// template (see `attractionLayout.ts`):
//
//   top-left   top-center   top-right
//   bottom-left ┄┄┄┄┄ bottom-right ┄┄┄┄┄
//
// (bottom-right spans two columns.) The decoration layer is
// absolutely positioned inside that section so the top/left
// values line up with the right grid cell.
//
// The `animation` field drives a CSS keyframe (defined in
// `src/index.css`) that the SVG runs forever. The entrance
// animation is handled by Framer Motion in the layer.
import type { AchievementId } from './achievements';

/** Animation loops the decoration runs after it appears. */
export type DecorationAnimation = 'float' | 'breathe' | 'pulse';

/** CSS-side placement of a single decoration. Keys are
 *  `position: absolute` style fields; undefined keys are
 *  omitted from the style so the element stays in the natural
 *  flow. */
export type DecorationPosition = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
};

export type Decoration = {
  id: AchievementId;
  /** Where to anchor the decoration inside the attraction grid. */
  position: DecorationPosition;
  /** Pixel size of the SVG bounding box. */
  size: { width: number; height: number };
  /** CSS `transform-origin` for the entrance / loop animations. */
  transformOrigin?: string;
  /** Continuous loop animation that runs once the decoration
   *  has appeared. */
  animation: DecorationAnimation;
  /** Accessible label for screen readers. */
  label: string;
  /** Short helper text shown next to the visual (currently used
   *  by the `park-explorer` banner only). */
  caption?: string;
};

/** Source of truth for every decoration the park knows about.
 *  Order matches the order they should appear in any debug
 *  UI (decorations panel, achievement toast, etc.). */
export const DECORATIONS: readonly Decoration[] = [
  // snake-100: a golden snake-egg trophy on a small pedestal,
  // peeking up from behind Snake Castle (top-left grid cell).
  {
    id: 'snake-100',
    position: { top: '4%', left: '2%' },
    size: { width: 96, height: 116 },
    transformOrigin: 'center bottom',
    animation: 'breathe',
    label: 'Golden snake-egg trophy',
  },
  // snake-200: a snake-master crown sitting to the right of
  // Snake Castle, like a small banner.
  {
    id: 'snake-200',
    position: { top: '6%', left: 'calc(33% + 8px)' },
    size: { width: 72, height: 72 },
    transformOrigin: 'center',
    animation: 'float',
    label: 'Snake Master crown',
  },
  // brick-1000: a pile of rubble to the right of Brick Break
  // Castle (top-right grid cell).
  {
    id: 'brick-1000',
    position: { top: '6%', right: '2%' },
    size: { width: 120, height: 86 },
    transformOrigin: 'center bottom',
    animation: 'breathe',
    label: 'Pile of broken bricks',
  },
  // tetris-4096: a cluster of three floating crystals around
  // Puzzle Tower (top-center grid cell).
  {
    id: 'tetris-4096',
    position: { top: '-2%', left: 'calc(50% - 32px)' },
    size: { width: 88, height: 100 },
    transformOrigin: 'center',
    animation: 'pulse',
    label: 'Floating crystal cluster',
  },
  // memory-perfect: a small glowing flower bed just below the
  // Magic Garden card (bottom-right grid cell).
  {
    id: 'memory-perfect',
    position: { bottom: '-2%', right: '4%' },
    size: { width: 168, height: 84 },
    transformOrigin: 'center bottom',
    animation: 'float',
    label: 'Glowing flower bed',
  },
  // park-explorer: a celebratory banner above the park header.
  {
    id: 'park-explorer',
    position: { top: '0%', left: '50%' },
    size: { width: 240, height: 56 },
    transformOrigin: 'center',
    animation: 'pulse',
    label: 'Park Explorer banner',
    caption: 'Park Explorer',
  },
] as const;

/** Lookup map for fast access by id. */
export const DECORATION_BY_ID: Readonly<Record<AchievementId, Decoration>> =
  DECORATIONS.reduce(
    (acc, d) => {
      acc[d.id] = d;
      return acc;
    },
    {} as Record<AchievementId, Decoration>,
  );
