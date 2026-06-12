// Sky Squadron — shared types.
//
// AC-11 ships the scaffold + reachability + park-map card. AC-12
// extends this state with bullets, enemy waves, and lives. The
// status machine mirrors the post-AC-1 tetris pattern: only
// `'running' | 'gameover'` — the hook starts in `'running'` so the
// first gravity tick falls through the running-gate cleanly.

/** A 2-D vector in canvas pixel space (x right, y down). */
export type Vec2 = { x: number; y: number };

/** Cardinal direction (used for plane facing + bullet travel). */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** Physics state of the player plane. */
export type Plane = {
  /** Top-left corner of the plane's bounding box. */
  pos: Vec2;
  /** Last movement direction the player chose. The renderer uses
   *  it to orient the plane sprite; the bullet system uses it as
   *  the default heading when the player fires. AC-11 doesn't
   *  consume `facing` yet (no bullets), but the field is here so
   *  AC-12 doesn't have to extend the type. */
  facing: Direction;
};

export type PlaneStatus = 'running' | 'gameover';

export type PlaneState = {
  plane: Plane;
  status: PlaneStatus;
};
