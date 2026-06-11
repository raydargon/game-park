// 7-bag randomizer (a.k.a. Random Generator).
//
// Modern Tetris (since Tetris Worlds, 2001) draws pieces from a
// "bag" containing exactly one of each of the seven tetrominoes,
// shuffled. When the bag is empty a new shuffled bag is produced.
// This guarantees the player never waits more than 12 pieces for
// a specific shape, while still feeling random across bags.
//
// The shuffle is a Fisher-Yates pass driven by a small LCG so it
// is reproducible from a `seed` argument — the hook keeps a
// monotonically increasing `bagSeed` (one per refill) so each bag
// is a different shuffle, but a fixed seed still produces the
// same sequence (useful for snapshot tests).
import type { TetrominoId } from './types';

export const ALL_PIECES: readonly TetrominoId[] = [
  'I',
  'O',
  'T',
  'S',
  'Z',
  'J',
  'L',
] as const;

/** Tiny LCG (matches the `pseudoRandom` used in `useSnake`). */
function makeRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Return a fresh shuffled bag of all 7 tetrominoes. */
export function makeBag(seed: number): TetrominoId[] {
  const rng = makeRng(seed);
  const pieces: TetrominoId[] = ALL_PIECES.slice();
  for (let i = pieces.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pieces[i]!;
    pieces[i] = pieces[j]!;
    pieces[j] = tmp;
  }
  return pieces;
}

/**
 * Ensure the `next` queue has at least `QUEUE_SIZE` entries.
 * Pulls from the current bag; when the bag is empty, builds a new
 * bag with the next seed and returns both the populated queue and
 * the leftover bag for the next call.
 */
export function ensureQueue(
  bag: TetrominoId[],
  next: TetrominoId[],
  queueSize: number,
  seed: number,
): { next: TetrominoId[]; bag: TetrominoId[]; seed: number } {
  let workingBag = bag.slice();
  const workingNext = next.slice();
  let workingSeed = seed;
  while (workingNext.length < queueSize) {
    if (workingBag.length === 0) {
      workingBag = makeBag(workingSeed);
      workingSeed = (workingSeed * 1103515245 + 12345) | 0;
    }
    const nextId = workingBag.shift();
    if (nextId) workingNext.push(nextId);
  }
  return { next: workingNext, bag: workingBag, seed: workingSeed };
}
