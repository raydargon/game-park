// Sky Squadron — game constants.
//
// All in canvas pixels. Tweaking these tweaks the feel of the game
// without touching the hook or the renderer.
//
// AC-12 ships the full plane-vs-enemies implementation. The
// constants here are tuned for a slow, forgiving vertical
// shooter:
//   * Enemy spawn cadence (1.6s) is slow enough that the player
//     can shoot down the previous wave before the next arrives.
//   * Enemy descent speed (1.6 px/frame) is slow enough that the
//     player has time to dodge when an enemy slips through.
//   * Enemy fire rate (1.4–2.0s per enemy) is similar to the
//     tank-war enemy AI so a player who learns one game gets the
//     other for free.
//   * Lives (3) and POINTS_PER_ENEMY (10) match the plan's AC-12
//     target values.

/** Canvas dimensions (vertical scrolling shooter). */
export const CANVAS_W = 360;
export const CANVAS_H = 560;

// ----- Player plane -----

/** Player plane size. */
export const PLANE_W = 36;
export const PLANE_H = 40;

/** Player plane speed (px/frame). */
export const PLANE_SPEED = 4;

/** Plane spawn position (centered horizontally, ~78% down). */
export const PLANE_SPAWN_X = Math.floor((CANVAS_W - PLANE_W) / 2);
export const PLANE_SPAWN_Y = Math.floor(CANVAS_H * 0.78);

// ----- Bullets -----

/** Player bullet size. */
export const BULLET_W = 4;
export const BULLET_H = 10;
/** Player bullet speed (px/frame, travels up so dy is negative
 *  in the step function). */
export const BULLET_SPEED = 8;

/** Player fire cooldown (ms). Limits the player's fire rate. */
export const PLAYER_FIRE_COOLDOWN_MS = 350;

/** Enemy bullet size (slightly bigger than the player bullet so
 *  the player can see it coming through a busy scene). */
export const ENEMY_BULLET_W = 6;
export const ENEMY_BULLET_H = 10;
/** Enemy bullet speed (px/frame, travels down). */
export const ENEMY_BULLET_SPEED = 4;

// ----- Enemies -----

/** Enemy plane size. */
export const ENEMY_W = 32;
export const ENEMY_H = 32;

/** Enemy movement speed (px/frame, straight down). */
export const ENEMY_SPEED = 1.6;

/** Time (in ms) between enemy spawns. */
export const ENEMY_SPAWN_INTERVAL_MS = 1600;

/** Range of the per-enemy fire interval. Each enemy gets a
 *  random fire cooldown in [min, max] on spawn. */
export const ENEMY_FIRE_INTERVAL_MS_MIN = 1400;
export const ENEMY_FIRE_INTERVAL_MS_MAX = 2000;

// ----- Player lives + score -----

/** Player lives at the start of a run. */
export const LIVES_START = 3;

/** Points awarded per enemy plane destroyed. */
export const POINTS_PER_ENEMY = 10;

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
 *  player plane; the closest warning-style token in the
 *  palette). */
export const ENEMY_COLOR = '#FFD6EC'; // fantasy-pink
/** Enemy plane outline. */
export const ENEMY_OUTLINE = '#2B2D42'; // night-deep
/** Enemy bullet color (a warm sunset hue so it stands out from
 *  the sky gradient and the cream player plane). */
export const ENEMY_BULLET_COLOR = '#FFF5E4'; // sky-sunset
