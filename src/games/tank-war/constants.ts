// Tank Battlegrounds — game constants.
//
// All in canvas pixels. Tweaking these tweaks the feel of the game
// without touching the hook or the renderer.

/** Canvas dimensions (square, top-down 2D). */
export const CANVAS_W = 480;
export const CANVAS_H = 480;

/** Player tank size. */
export const TANK_W = 28;
export const TANK_H = 28;
/** Turret size (drawn on top of the tank body). */
export const TURRET_W = 8;
export const TURRET_H = 16;

/** Player tank speed (px/frame). Wall clamping happens in the hook. */
export const TANK_SPEED = 3;

/** Tank spawn position (center of the canvas, slightly up). */
export const TANK_SPAWN_X = Math.floor((CANVAS_W - TANK_W) / 2);
export const TANK_SPAWN_Y = Math.floor((CANVAS_H - TANK_H) * 0.7);

// ----- Colors (pulled from the Tailwind palette, see
// `tailwind.config.ts`) -----

/** Tank body color. */
export const TANK_COLOR = '#5BC0BE'; // night-glow
/** Tank outline / barrel stroke. */
export const TANK_OUTLINE = '#2B2D42'; // night-deep
/** Turret color (a touch lighter than the body). */
export const TURRET_COLOR = '#FFF5E4'; // sky-sunset
/** Ground color. */
export const GROUND_COLOR = '#3A506B'; // night-dusk
/** Ground outline. */
export const GROUND_OUTLINE = '#2B2D42'; // night-deep
