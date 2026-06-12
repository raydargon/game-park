// Tank Battlegrounds — game constants.
//
// All in canvas pixels. Tweaking these tweaks the feel of the game
// without touching the hook or the renderer.

/** Canvas dimensions (square, top-down 2D). */
export const CANVAS_W = 480;
export const CANVAS_H = 480;

// ----- Player tank -----

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

// ----- Bullets -----

/** Bullet size (square). */
export const BULLET_W = 6;
export const BULLET_H = 6;
/** Bullet speed (px/frame). */
export const BULLET_SPEED = 6;
/** Player fire cooldown (ms). Limits the player's fire rate. */
export const PLAYER_FIRE_COOLDOWN_MS = 400;

// ----- Enemies -----

/** Enemy tank size. */
export const ENEMY_W = 26;
export const ENEMY_H = 26;

/** Enemy movement speed (px/frame). */
export const ENEMY_SPEED = 1.4;

/** Time (in ms) between enemy spawns. */
export const ENEMY_SPAWN_INTERVAL_MS = 2200;

/** Range of the per-enemy fire interval. Each enemy gets a
 *  random fire cooldown in `[min, max]` on spawn. */
export const ENEMY_FIRE_INTERVAL_MS_MIN = 1200;
export const ENEMY_FIRE_INTERVAL_MS_MAX = 2000;

// ----- Player lives + score -----

/** Player lives at the start of a run. */
export const LIVES_START = 3;

/** Points awarded per enemy tank destroyed. */
export const POINTS_PER_ENEMY = 100;

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
/** Enemy tank body (a pink to contrast with the player's night-glow). */
export const ENEMY_COLOR = '#FFD6EC'; // fantasy-pink
/** Enemy tank outline. */
export const ENEMY_OUTLINE = '#2B2D42'; // night-deep
/** Player bullet color. */
export const PLAYER_BULLET_COLOR = '#FFF4B8'; // fantasy-cream
/** Enemy bullet color (a warning red — maps to fantasy-pink, the
 *  closest non-green/red token in the palette). */
export const ENEMY_BULLET_COLOR = '#FFD6EC'; // fantasy-pink
