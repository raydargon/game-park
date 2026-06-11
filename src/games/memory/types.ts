// Magic Garden (Memory Match) — shared types.
//
// A `MemoryCard` is the unit of the board. We assign a stable `id`
// per card so Framer Motion's `layout` and `key` props can animate
// position changes; the `index` is the card's current position in
// the shuffled deck. `flipped` is `true` while the card is showing
// its front (i.e. a current pair is being inspected) and `matched`
// is `true` once the pair has been confirmed — matched cards never
// flip back and ignore further clicks.

/** A single card on the 4×4 board. */
export type MemoryCard = {
  /** Stable id (used by Framer Motion). Generated once at shuffle
   *  time; never re-used across reshuffles. */
  id: string;
  /** The emoji shown on the front of the card. */
  emoji: string;
  /** Position in the current shuffle, 0..15. */
  index: number;
  /** `true` while the card is face-up as part of an active pair. */
  flipped: boolean;
  /** `true` once the card's pair has been confirmed. Stays true
   *  for the rest of the run. */
  matched: boolean;
};

/** Memory Match game lifecycle.
 *  - `idle`     : initial state, before the first flip.
 *  - `running`  : the timer is running; at least one flip happened.
 *  - `checking` : two cards are face-up; the hook is waiting for
 *                 the 700ms mismatch window to resolve.
 *  - `won`      : all 8 pairs matched; the timer is frozen. */
export type MemoryStatus = 'idle' | 'running' | 'checking' | 'won';

export type MemoryState = {
  cards: MemoryCard[];
  /** Number of pair-attempts the player has made (increments when
   *  the second card of a pair is flipped). */
  moves: number;
  /** Elapsed time since the first flip, in milliseconds. Frozen
   *  while `status === 'checking'` (we don't want to penalize the
   *  player for the 700ms reveal window) and after `'won'`. */
  elapsedMs: number;
  /** Index of the first flipped card in the current pair, or `null`
   *  if no card is face-up yet / the pair has been resolved. */
  firstPick: number | null;
  /** Index of the second flipped card, or `null` while waiting for
   *  the player to pick the second card. */
  secondPick: number | null;
  status: MemoryStatus;
};
