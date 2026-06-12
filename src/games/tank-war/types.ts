// Tank Battlegrounds — shared types.
//
// AC-9 adds bullets (player + enemy), AI enemy tanks, lives, and
// score on top of the AC-8 player-tank shell. The status machine
// mirrors the post-AC-1 tetris pattern: only `'running' | 'gameover'`
// — the hook starts in `'running'` so the first gravity tick falls
// through the running-gate cleanly.

/** A 2-D vector in canvas pixel space (x right, y down). */
export type Vec2 = { x: number; y: number };

/** Cardinal direction (used for tank facing + bullet travel). */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** Physics state of the player tank. */
export type Tank = {
  /** Top-left corner of the tank's bounding box. */
  pos: Vec2;
  /** Last movement direction the player chose. The renderer uses
   *  it to orient the turret; the bullet system uses it as the
   *  default heading when the player fires. */
  facing: Direction;
};

/** A bullet in flight. Both player- and enemy-fired bullets use
 *  the same shape; the `isPlayer` flag distinguishes them so the
 *  collision code can match the right target. */
export type Bullet = {
  /** A stable identifier so the reducer can prune specific bullets
   *  in a single pass without index gymnastics. */
  id: number;
  /** Top-left corner of the bullet's bounding box. */
  pos: Vec2;
  /** Heading the bullet is travelling in. */
  dir: Direction;
  /** True for player-fired bullets (collide with enemies); false
   *  for enemy-fired bullets (collide with the player). */
  isPlayer: boolean;
};

/** An AI enemy tank. */
export type EnemyTank = {
  id: number;
  pos: Vec2;
  /** Heading the tank is currently moving in. Re-chosen at wall
   *  hits to keep the AI from getting stuck. */
  facing: Direction;
  /** Wall-clock time (in ms) until the enemy fires next. Reset
   *  to a random value in `[ENEMY_FIRE_INTERVAL_MS_MIN, MAX]`
   *  on spawn and after each shot. */
  fireCooldownMs: number;
};

export type TankStatus = 'running' | 'gameover';

export type TankState = {
  tank: Tank;
  /** Active player-fired bullets. */
  bullets: Bullet[];
  /** Active enemy-fired bullets. */
  enemyBullets: Bullet[];
  /** Live AI tanks on the field. */
  enemies: EnemyTank[];
  /** Player lives remaining. Decremented by enemy-bullet hits and
   *  enemy-tank overlaps. Reaches 0 → `'gameover'`. */
  lives: number;
  /** Score (one `POINTS_PER_ENEMY` per enemy destroyed). */
  score: number;
  /** Wall-clock time (in ms) until the player can fire again. */
  fireCooldownMs: number;
  /** Wall-clock time (in ms) since the last enemy spawn. */
  enemySpawnElapsedMs: number;
  status: TankStatus;
};
