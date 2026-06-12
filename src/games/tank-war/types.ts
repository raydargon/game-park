// Tank Battlegrounds — shared types.
//
// AC-8 ships the basic shell: a player tank that can be steered
// around a square arena with the arrow keys (or WASD), but no
// enemies, bullets, or lives yet. Those land in AC-9. The status
// machine mirrors the post-AC-1 tetris pattern: only
// `'running' | 'gameover'` — the hook starts in `'running'` so the
// first frame is a no-op rather than a game-over.

/** A 2-D vector in canvas pixel space (x right, y down). */
export type Vec2 = { x: number; y: number };

/** Physics state of the player tank. */
export type Tank = {
  /** Top-left corner of the tank's bounding box. */
  pos: Vec2;
  /** Last movement direction the player chose; the renderer uses
   *  it to orient the turret (AC-9 will use it for bullet
   *  headings). */
  facing: 'up' | 'down' | 'left' | 'right';
};

export type TankStatus = 'running' | 'gameover';

export type TankState = {
  tank: Tank;
  status: TankStatus;
};
