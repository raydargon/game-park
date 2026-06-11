// Magic Garden (Memory Match) — game constants.
//
// The playfield is a 4×4 grid of 96×96 px cards with 12 px gutters,
// wrapped in 16 px padding. Eight emoji pairs (PRD §7) are shuffled
// into the 16 cells at the start of every run. The mismatch delay
// is 700 ms (PRD §7) so a player can register the second card
// before the pair flips back. The fantasy palette keeps matched
// cards glowing pink and the card backs a soft cream so the board
// reads against the night-deep background.
import type { MemoryCard } from './types';

/** Square grid: 4×4 = 16 cells = 8 pairs. */
export const GRID_SIZE = 4;
export const TOTAL_CARDS = GRID_SIZE * GRID_SIZE;
export const TOTAL_PAIRS = TOTAL_CARDS / 2;

/** Per-card pixel size. */
export const CELL_SIZE = 96;

/** Gap between adjacent cards. */
export const CELL_GAP = 12;

/** Outer padding around the grid. */
export const PADDING = 16;

/** Canvas-equivalent board dimensions (square). */
export const BOARD_W = PADDING * 2 + GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * CELL_GAP;
export const BOARD_H = BOARD_W;

/** The 8 emoji pairs. The order is fixed so the same run always
 *  uses the same symbols, but the placement is shuffled at every
 *  new game (see `createShuffledCards`). */
export const EMOJIS: readonly string[] = [
  '🌸', // cherry blossom
  '🦋', // butterfly
  '🍄', // mushroom
  '🐝', // bee
  '🌟', // star
  '🐞', // ladybug
  '🌷', // tulip
  '🐰', // rabbit
] as const;

/** How long a mismatched pair stays face-up before flipping back
 *  (PRD §7: 700 ms). */
export const MISMATCH_DELAY_MS = 700;

/** Fantasy-palette colors used by the renderer. Hex values match
 *  `tailwind.config.ts` and `src/index.css`. */
export const COLORS = {
  /** Card back — soft cream with a warm pink wash. */
  cardBackBg: 'linear-gradient(135deg, #FFD6EC 0%, #FFF4B8 100%)',
  cardBackBorder: '#5BC0BE',
  cardBackEmoji: '🌸',
  cardBackEmojiColor: 'rgba(255, 255, 255, 0.55)',
  /** Card front — a creamy white with a soft outline. */
  cardFrontBg: '#FFF5E4',
  cardFrontBorder: 'rgba(91, 192, 190, 0.6)',
  /** Matched cards — a stronger pink so the player can see the
   *  progress at a glance. */
  cardMatchedBg: 'linear-gradient(135deg, #FFD6EC 0%, #B8E8FC 100%)',
  cardMatchedBorder: '#5BC0BE',
  /** Cell highlight when the player hovers an interactive card. */
  cardHover: 'rgba(91, 192, 190, 0.15)',
  /** Board background (sits behind the cards). */
  boardBg: '#3A506B',
  /** Text on dark backgrounds. */
  text: '#FFF5E4',
  textMuted: 'rgba(255, 245, 228, 0.75)',
  /** HUD accent. */
  accent: '#FFD6EC',
} as const;

/** Mulberry32 — small, fast PRNG used to shuffle the deck
 *  deterministically. We seed with `Date.now()` for fresh games so
 *  the layout is randomized in practice; tests can pass a fixed
 *  seed to get a reproducible layout. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a fresh 4×4 deck: 2 copies of each emoji, shuffled.
 *  Returns a `MemoryCard[]` of length 16 with stable ids and
 *  `flipped: false`, `matched: false`. */
export function createShuffledCards(seed?: number): MemoryCard[] {
  const rand = mulberry32(
    typeof seed === 'number' ? seed : (Date.now() & 0x7fffffff) || 1,
  );
  // Build the 16-card pool: each emoji appears twice.
  const pool: { emoji: string; pairId: number }[] = [];
  for (let i = 0; i < EMOJIS.length; i += 1) {
    const emoji = EMOJIS[i]!;
    pool.push({ emoji, pairId: i });
    pool.push({ emoji, pairId: i });
  }
  // Fisher–Yates shuffle using the seeded PRNG.
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.map((entry, index) => ({
    id: `card-${index}-${entry.pairId}-${Math.floor(rand() * 0x100000).toString(36)}`,
    emoji: entry.emoji,
    index,
    flipped: false,
    matched: false,
  }));
}

/** Format an elapsed-milliseconds count as `M:SS` (e.g. 0:23,
 *  1:05, 12:34). For negative or NaN inputs we return `'0:00'`. */
export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Compute pixel offsets for a cell inside the playfield. */
export function cellPosition(index: number): { left: number; top: number } {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  return {
    left: PADDING + col * (CELL_SIZE + CELL_GAP),
    top: PADDING + row * (CELL_SIZE + CELL_GAP),
  };
}
