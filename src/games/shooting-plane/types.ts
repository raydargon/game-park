// Sky Squadron — shared types.
//
// State machine: 'running' | 'gameover'. The hook starts in
// 'running' so the first frame doesn't need a status === 'ready'
// branch (the AC-1 tetris bug was the inverse: an initial
// 'ready' that the running-gate let through, locking the spawn
// piece on frame 0).
//
// AC-12 extends the AC-11 scaffold with bullets, enemy waves,
// lives, and score. Status machine is unchanged; only the
// state shape grows.

/** A 2-D vector in canvas pixel space (x right, y down). */
export type Vec2 = { x: number; y: number };

/** Cardinal direction (used for plane facing). Bullets always
 *  travel straight up (player) or straight down (enemy), so
 *  the bullet type does not need its own heading. */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** Physics state of the player plane. */
export type Plane = {
  /** Top-left corner of the plane's bounding box. */
  pos: Vec2;
  /** Last movement direction the player chose. The renderer
   *  uses it to orient the plane sprite; bullets always fire
   *  straight up so the value is purely cosmetic. */
  facing: Direction;
};

/** A bullet in flight. Both player- and enemy-fired bullets use
 *  the same shape; the `isPlayer` flag distinguishes them so
 *  the collision code can match the right target. Player
 *  bullets travel up (dy = -BULLET_SPEED); enemy bullets
 *  travel down (dy = +ENEMY_BULLET_SPEED). */
export type Bullet = {
  /** A stable identifier so the reducer can prune specific
   *  bullets in a single pass without index gymnastics. */
  id: number;
  /** Top-left corner of the bullet's bounding box. */
  pos: Vec2;
  /** True for player-fired bullets (collide with enemies);
   *  false for enemy-fired bullets (collide with the player). */
  isPlayer: boolean;
};

/** An enemy plane. Descends straight down at ENEMY_SPEED and
 *  fires a bullet toward the player when its per-enemy fire
 *  cooldown hits zero. */
export type EnemyPlane = {
  id: number;
  pos: Vec2;
  /** Wall-clock time (in ms) until the enemy fires next. Reset
   *  to a random value in [ENEMY_FIRE_INTERVAL_MS_MIN, MAX] on
   *  spawn and after each shot. */
  fireCooldownMs: number;
};

export type PlaneStatus = 'running' | 'gameover';

export type PlaneState = {
  plane: Plane;
  /** Active player-fired bullets (travel up). */
  bullets: Bullet[];
  /** Active enemy-fired bullets (travel down). */
  enemyBullets: Bullet[];
  /** Live enemy planes on the field. */
  enemies: EnemyPlane[];
  /** Player lives remaining. Decremented by enemy-bullet hits
   *  and enemy-plane overlaps. Reaches 0 → 'gameover'. */
  lives: number;
  /** Score (POINTS_PER_ENEMY per enemy destroyed). */
  score: number;
  /** Wall-clock time (in ms) until the player can fire again. */
  fireCooldownMs: number;
  /** Wall-clock time (in ms) since the last enemy spawn. */
  enemySpawnElapsedMs: number;
  status: PlaneStatus;
};
