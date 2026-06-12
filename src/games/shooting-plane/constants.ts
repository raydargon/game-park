// Sky Squadron — game constants.
//
// All in canvas pixels. Tweaking these tweaks the feel of the game
// without touching the hook or the renderer.
//
// AC-11 ships the scaffold + reachability + park-map card. AC-12
// replaces the no-op `step`/`fire` with the real plane physics,
// enemy waves, and collision resolution. The constants here are
// set to the AC-12 plan values so AC-12 doesn't have to revisit
// them; the renderer and hook in this AC only consume the canvas
// dimensions and the spawn position so the card lands with a
// working, recognisable placeholder that does not crash.

/** Canvas dimensions (vertical scrolling shooter). */
export const CANVAS_W = 360;
export const CANVAS_H = 560;

// ----- Player plane -----

/** Player plane size. */
export const PLANE_W = 36;
export const PLANE_H = 40;

/** Player plane speed (px/frame). */
export const PLANE_SPEED = 4;

/** Plane spawn position (centered horizontally, ~80% down). */
export const PLANE_SPAWN_X = Math.floor((CANVAS_W - PLANE_W) / 2);
export const PLANE_SPAWN_Y = Math.floor(CANVAS_H * 0.78);

// ----- Bullets (placeholder; real values land in AC-12) -----

/** Bullet size (square). */
export const BULLET_W = 4;
export const BULLET_H = 10;
/** Bullet speed (px/frame). */
export const BULLET_SPEED = 8;

// ----- Enemies (placeholder; real values land in AC-12) -----

/** Enemy plane size. */
export const ENEMY_W = 32;
export const ENEMY_H = 32;

// ----- Colors (pulled from the Tailwind palette, see
// `tailwind.config.ts`) -----

/** Player plane body color. */
export const PLANE_COLOR = '#FFF4B8'; // fantasy-cream
/** Player plane outline / bullet stroke. */
export const PLANE_OUTLINE = '#2B2D42'; // night-deep
/** Sky background color (top half). */
export const SKY_TOP_COLOR = '#1B263B'; // night-deep
/** Sky background color (bottom half — a touch warmer for the
 *  horizon glow). */
export const SKY_BOTTOM_COLOR = '#3A506B'; // night-dusk
/** Player bullet color. */
export const BULLET_COLOR = '#B8E8FC'; // fantasy-blue
/** Enemy plane body color (a pink to contrast with the cream
 *  player plane; the closest warning-style token in the palette). */
export const ENEMY_COLOR = '#FFD6EC'; // fantasy-pink
/** Enemy plane outline. */
export const ENEMY_OUTLINE = '#2B2D42'; // night-deep
