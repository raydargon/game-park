// Layout metadata for the park attractions. Kept separate from
// `src/games/registry.ts` because these props are presentation-only
// (where the card sits in the park grid, which palette shade to glow
// with) and should not be required by the generic registry type that
// `GamePage` also consumes.
//
// AC-4 added `flappy-bird` (and the four-area extension below) to
// support a 4-column × 2-row desktop grid that can hold all 8
// attractions without overflow on a 1024-wide viewport. AC-8 added
// `tank-war` in the `bottom-left-2` slot. AC-11 fills the
// `bottom-center` slot with `shooting-plane`, completing the
// 8-card grid that AC-14 verifies.
import type { GameId } from '../../games/registry';

export type GridArea =
  | 'top-left'
  | 'top-left-2'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-left-2'
  | 'bottom-center'
  | 'bottom-right';

export type AttractionLayout = {
  /** CSS grid-area name. */
  area: GridArea;
  /** Tailwind ring class for the hover glow. */
  glowRing: string;
  /** Tailwind text class for the title. */
  titleColor: string;
  /** Tailwind background gradient pair for the card body. */
  bodyGradient: string;
};

export const ATTRACTION_LAYOUT: Record<GameId, AttractionLayout> = {
  snake: {
    area: 'top-left',
    glowRing: 'ring-fantasy-green',
    titleColor: 'text-fantasy-green',
    bodyGradient:
      'bg-gradient-to-br from-fantasy-green/40 via-night-dusk/60 to-night-deep',
  },
  'brick-breaker': {
    area: 'top-right',
    glowRing: 'ring-fantasy-pink',
    titleColor: 'text-fantasy-pink',
    bodyGradient:
      'bg-gradient-to-br from-fantasy-pink/40 via-night-dusk/60 to-night-deep',
  },
  tetris: {
    area: 'top-center',
    glowRing: 'ring-fantasy-cream',
    titleColor: 'text-fantasy-cream',
    bodyGradient:
      'bg-gradient-to-br from-fantasy-cream/40 via-night-dusk/60 to-night-deep',
  },
  'crystal-2048': {
    area: 'bottom-left',
    glowRing: 'ring-night-glow',
    titleColor: 'text-night-glow',
    bodyGradient:
      'bg-gradient-to-br from-night-glow/40 via-night-dusk/60 to-night-deep',
  },
  memory: {
    area: 'bottom-right',
    glowRing: 'ring-fantasy-blue',
    titleColor: 'text-fantasy-blue',
    bodyGradient:
      'bg-gradient-to-br from-fantasy-blue/40 via-night-dusk/60 to-night-deep',
  },
  'flappy-bird': {
    // New 4-column area: second slot on the top row, between
    // snake (top-left) and tetris (top-center).
    area: 'top-left-2',
    glowRing: 'ring-sky-morning',
    titleColor: 'text-sky-morning',
    bodyGradient:
      'bg-gradient-to-br from-sky-morning/40 via-night-dusk/60 to-night-deep',
  },
  'tank-war': {
    // New 4-column area: second slot on the bottom row, between
    // crystal-2048 (bottom-left) and shooting-plane (bottom-center).
    area: 'bottom-left-2',
    glowRing: 'ring-sky-sunset',
    titleColor: 'text-sky-sunset',
    bodyGradient:
      'bg-gradient-to-br from-sky-sunset/40 via-night-dusk/60 to-night-deep',
  },
  'shooting-plane': {
    // Fourth-column area: third slot on the bottom row, between
    // tank-war (bottom-left-2) and memory (bottom-right). AC-11
    // fills this slot, completing the 8-card grid that AC-14
    // verifies.
    area: 'bottom-center',
    glowRing: 'ring-sky-midday',
    titleColor: 'text-sky-midday',
    bodyGradient:
      'bg-gradient-to-br from-sky-midday/40 via-night-dusk/60 to-night-deep',
  },
};

/** CSS `grid-template-areas` value for the park map. 4 columns ×
 *  2 rows. AC-4 filled the top row's second slot
 *  (`top-left-2` -> flappy-bird); AC-8 filled the bottom row's
 *  second slot (`bottom-left-2` -> tank-war); AC-11 fills
 *  `bottom-center` -> shooting-plane, completing the 8-card grid
 *  that AC-14 verifies. */
export const PARK_GRID_AREAS =
  '"top-left top-left-2 top-center top-right" ' +
  '"bottom-left bottom-left-2 bottom-center bottom-right"';
