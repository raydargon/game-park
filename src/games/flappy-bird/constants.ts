// Flappy Wings — game constants.
//
// All in canvas pixels. Tweaking these tweaks the feel of the game
// without touching the hook or the renderer.

/** Canvas dimensions. */
export const CANVAS_W = 360;
export const CANVAS_H = 540;

/** Bird horizontal position. 25% of width puts the bird in the
 *  left third, well clear of the scrolling pipes. */
export const BIRD_X = Math.floor(CANVAS_W * 0.25);

/** Bird collision radius (px). The visible sprite is a touch bigger
 *  than this so the bird feels a little more forgiving. */
export const BIRD_R = 14;

/** Visible bird sprite radius (slightly larger than the hitbox). */
export const BIRD_DRAW_R = 16;

/** Top of the floor (in canvas y). The bird's center cannot
 *  descend below FLOOR_Y - BIRD_R. */
export const FLOOR_Y = CANVAS_H - 30;

/** Gravity applied per animation frame (px/frame²). */
export const GRAVITY = 0.45;

/** Upward velocity impulse given to the bird on flap (px/frame). */
export const FLAP_VY = -8;

/** Maximum downward velocity (so a long fall doesn't teleport
 *  through the floor in one frame). */
export const MAX_VY = 12;

// ----- Colors (pulled from the Tailwind palette, see
// `src/pages/GamePage/...` and `tailwind.config.ts`) -----

/** Sky / canvas background. */
export const SKY_COLOR = '#AEE2FF'; // sky-morning

/** Bird body. */
export const BIRD_COLOR = '#FFF4B8'; // fantasy-cream

/** Bird outline / eye / stroke. */
export const BIRD_OUTLINE = '#2B2D42'; // night-deep

/** Floor strip color. */
export const FLOOR_COLOR = '#3A506B'; // night-dusk
