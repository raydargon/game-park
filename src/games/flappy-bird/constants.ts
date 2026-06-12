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

// ----- Pipes (AC-5) -----

/** Width of a single pipe (top or bottom segment of a pair). */
export const PIPE_W = 58;

/** Vertical size of the open gap between the top and bottom pipe
 *  of a pair. The bird's center must traverse this gap. */
export const PIPE_GAP = 150;

/** Horizontal scroll speed of the pipe field (px/frame). Tuned so
 *  a 60 fps canvas feels close to classic Flappy Bird pacing. */
export const PIPE_SPEED = 2.4;

/** Time (in ms) between new pipe-pair spawns. Together with
 *  PIPE_SPEED this controls the spacing between successive pipes. */
export const PIPE_SPAWN_INTERVAL_MS = 1600;

/** Range of the *vertical center* of the gap (in canvas y). The
 *  playfield is `0..FLOOR_Y`, so the gap stays clear of the floor
 *  strip with at least `PIPE_GAP / 2` of breathing room. */
export const PIPE_MIN_GAP_Y = 180;
export const PIPE_MAX_GAP_Y = FLOOR_Y - 180;

/** Cap (px/frame) on how many pipes we'll move in a single step.
 *  Guards against a multi-second tab-blur teleport that would let
 *  the bird clip through a pipe. */
export const MAX_PIPE_STEP_PX = 24;

/** A small visual cap on the top of the pipe so the renderer can
 *  show a darker rim. */
export const PIPE_CAP_H = 14;

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

/** Pipe fill color (a soft forest green that contrasts with the sky). */
export const PIPE_COLOR = '#5BAE6A'; // close to emerald-500

/** Pipe outline + cap highlight (a darker green). */
export const PIPE_OUTLINE_COLOR = '#2E5D3A';
