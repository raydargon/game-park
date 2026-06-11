// Layout metadata for the 5 Phase 1 attractions. Kept separate from
// `src/games/registry.ts` because these props are presentation-only
// (where the card sits in the park grid, which palette shade to glow
// with) and should not be required by the generic registry type that
// `GamePage` also consumes.
import type { GameId } from '../../games/registry';

export type GridArea =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
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
};

/** CSS `grid-template-areas` value for the park map. */
export const PARK_GRID_AREAS =
  '"top-left top-center top-right" ' +
  '"bottom-left bottom-right bottom-right"';
