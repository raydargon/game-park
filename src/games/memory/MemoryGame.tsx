// MemoryGame — DOM + Framer Motion render wrapper for Magic Garden.
//
// Why DOM and not canvas: every cell is a clickable button, the flip
// is a 3D Y-rotation handled by Framer Motion, and matched cards
// need a per-card glow. A canvas would just be reinventing CSS.
//
// Layout (top-down):
//   1. `useMemory` owns state, flip logic, and the timer.
//   2. `useGameLoop` runs every animation frame; we accumulate
//      `deltaMs` and call `tick(deltaMs)`. The loop is paused when
//      the shell pauses us, OR when status is `'idle' | 'checking'
//      | 'won'` (the timer is frozen in those states by the hook).
//   3. The grid renders 16 `motion.button`s. Each card is a flex
//      column with two faces: a back (decorative flower) and a
//      front (the emoji). Framer Motion animates `rotateY` 0 ↔ 180
//      so the card appears to flip.
//   4. The HUD shows moves / time / best-time. The best time is
//      read straight from the persisted store so it survives
//      page reloads.
//   5. The win overlay mirrors Crystal 2048's structure: final
//      stats + a Play Again button that calls the shell's
//      `onRestart` (re-mounts the game) and a Restart button that
//      resets the hook in place.
//
// The shell already reports a "best" via the shared ScoreHud —
// that field shows the raw seconds of the best time for memory
// (the lower-is-better value persisted at `highscores.memory`).
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameStore } from '../../store/gameStore';
import type { GameComponentProps } from '../registry';
import { useMemory } from './useMemory';
import {
  BOARD_W,
  BOARD_H,
  CELL_SIZE,
  COLORS,
  cellPosition,
  formatElapsed,
} from './constants';
import type { MemoryCard } from './types';

export default function MemoryGame({
  gameId,
  isPaused,
  onScore,
  onGameOver,
  onRestart,
}: GameComponentProps) {
  const { state, flipCard, tick, reset } = useMemory({ gameId, onScore, onGameOver });
  const bestSeconds = useGameStore((s) => s.highscores['memory'] ?? 0);

  // Drive the timer from the rAF loop. The hook is the source of
  // truth for whether time should advance, so a paused / checking /
  // won game simply no-ops in `tick`. We pass `isPaused` to the
  // loop to keep the timer honest when the shell pauses us.
  useGameLoop((deltaMs) => {
    tick(deltaMs);
  }, isPaused);

  // Defensive: when the game wins and the user clicks Restart
  // inside the overlay, re-arm the latches so the next run is
  // reported correctly. (The shell's `onRestart` re-mounts the
  // component, but if the player instead hits the in-game Restart
  // we need to be safe.)
  useEffect(() => {
    // No-op: StrictMode safety is handled inside the hook. The
    // useEffect is here so we can react to status transitions
    // in the future (e.g. playing a chime on a match).
  }, [state.status]);

  const isInteractive =
    !isPaused && (state.status === 'idle' || state.status === 'running');

  return (
    <div
      data-testid="memory-game"
      data-game-id={gameId}
      className="relative flex h-full w-full flex-col items-center justify-center gap-4"
    >
      {/* In-game HUD: moves / time / best */}
      <div
        data-testid="memory-hud"
        className="flex w-full max-w-md items-stretch justify-between gap-2 px-2"
      >
        <HudCell label="Moves" value={state.moves} testId="memory-moves" />
        <HudCell
          label="Time"
          value={formatElapsed(state.elapsedMs)}
          testId="memory-time"
          live
        />
        <HudCell
          label="Best"
          value={bestSeconds > 0 ? formatElapsed(bestSeconds * 1000) : '—:—'}
          testId="memory-best"
        />
      </div>

      {/* Board */}
      <div
        data-testid="memory-board"
        className="relative rounded-2xl shadow-2xl"
        style={{
          width: BOARD_W,
          height: BOARD_H,
          backgroundColor: COLORS.boardBg,
          padding: 0,
        }}
      >
        {state.cards.map((card, i) => (
          <CardView
            key={card.id}
            card={card}
            index={i}
            isInteractive={isInteractive}
            onClick={() => flipCard(i)}
          />
        ))}
      </div>

      <p className="text-[10px] uppercase tracking-widest text-slate-300/80">
        Click two cards to flip them — find every pair!
      </p>

      {state.status === 'won' && (
        <motion.div
          data-testid="memory-gameover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-night-deep/85 px-6 text-center text-slate-50 backdrop-blur-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-night-glow">
            Garden Bloomed
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-sky-sunset">
            You matched them all!
          </h2>
          <p className="text-sm text-slate-200/90">
            Final time:{' '}
            <span
              data-testid="memory-final-time"
              className="font-bold text-fantasy-cream"
            >
              {formatElapsed(state.elapsedMs)}
            </span>
            {' · '}
            <span
              data-testid="memory-final-moves"
              className="font-bold text-fantasy-pink"
            >
              {state.moves}
            </span>
            {' moves'}
          </p>
          <p className="text-xs text-slate-200/80">
            Best time:{' '}
            <span
              data-testid="memory-best-final"
              className="font-bold text-fantasy-cream"
            >
              {bestSeconds > 0
                ? formatElapsed(bestSeconds * 1000)
                : formatElapsed(state.elapsedMs)}
            </span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {onRestart && (
              <button
                type="button"
                onClick={onRestart}
                data-testid="memory-play-again"
                className="rounded-full bg-night-glow px-5 py-2 text-sm font-semibold text-night-deep shadow hover:bg-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
              >
                Play Again
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              data-testid="memory-restart"
              className="rounded-full border border-night-dusk/60 bg-night-deep/70 px-5 py-2 text-sm font-semibold text-sky-sunset shadow hover:border-fantasy-cream/70 hover:text-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
            >
              Restart
            </button>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-slate-300/80">
            or use the Restart button in the toolbar
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ----- Card renderer -----

type CardViewProps = {
  card: MemoryCard;
  index: number;
  isInteractive: boolean;
  onClick: () => void;
};

function CardView({ card, index, isInteractive, onClick }: CardViewProps) {
  const pos = cellPosition(index);
  const isFlipped = card.flipped || card.matched;
  return (
    <motion.button
      type="button"
      data-testid={`memory-card-${index}`}
      data-emoji={card.emoji}
      data-flipped={card.flipped}
      data-matched={card.matched}
      data-index={index}
      onClick={onClick}
      disabled={!isInteractive}
      aria-label={card.matched ? `Matched ${card.emoji}` : `Card ${index + 1}`}
      aria-pressed={isFlipped}
      // Initial position + flip from CSS transforms on the parent;
      // Framer Motion animates only the rotateY axis.
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      initial={false}
      transition={{ duration: 0.45, ease: [0.4, 0.0, 0.2, 1] }}
      whileHover={isInteractive && !isFlipped ? { scale: 1.04 } : undefined}
      whileTap={isInteractive && !isFlipped ? { scale: 0.96 } : undefined}
      className="absolute focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
      style={{
        left: pos.left,
        top: pos.top,
        width: CELL_SIZE,
        height: CELL_SIZE,
        transformStyle: 'preserve-3d',
        perspective: 600,
        // Stop pointer events on a fully-resolved matched card so
        // the cursor doesn't suggest interactivity.
        cursor: isInteractive && !isFlipped ? 'pointer' : 'default',
      }}
    >
      {/* Card back — shown when not flipped. */}
      <CardFace
        back
        bg={COLORS.cardBackBg}
        borderColor={COLORS.cardBackBorder}
        emoji={COLORS.cardBackEmoji}
        emojiColor={COLORS.cardBackEmojiColor}
        matchedGlow={card.matched}
      />
      {/* Card front — rotated 180° so it's hidden until flip. */}
      <CardFace
        bg={card.matched ? COLORS.cardMatchedBg : COLORS.cardFrontBg}
        borderColor={
          card.matched ? COLORS.cardMatchedBorder : COLORS.cardFrontBorder
        }
        emoji={card.emoji}
        emojiColor="#2B2D42"
        matchedGlow={card.matched}
      />
    </motion.button>
  );
}

function CardFace({
  bg,
  borderColor,
  emoji,
  emojiColor,
  matchedGlow,
  back = false,
}: {
  bg: string;
  borderColor: string;
  emoji: string;
  emojiColor: string;
  matchedGlow: boolean;
  back?: boolean;
}) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center rounded-2xl text-5xl"
      style={{
        background: bg,
        border: `2px solid ${borderColor}`,
        // The front face is rotated 180° in 3D so it lines up
        // exactly with the back when the parent flips.
        transform: back ? 'rotateY(0deg)' : 'rotateY(180deg)',
        backfaceVisibility: 'hidden',
        // Glow matched cards so the player can see their progress.
        boxShadow: matchedGlow
          ? '0 0 24px rgba(91, 192, 190, 0.55), inset 0 0 0 1px rgba(255, 255, 255, 0.3)'
          : '0 2px 4px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.18)',
        color: emojiColor,
        textShadow: back
          ? '0 1px 2px rgba(0, 0, 0, 0.18)'
          : '0 1px 1px rgba(255, 255, 255, 0.35)',
        userSelect: 'none',
      }}
    >
      <span style={{ pointerEvents: 'none' }}>{emoji}</span>
    </div>
  );
}

// ----- HUD cell -----

function HudCell({
  label,
  value,
  testId,
  live,
}: {
  label: string;
  value: number | string;
  testId: string;
  live?: boolean;
}) {
  return (
    <div
      data-testid={testId}
      className="flex min-w-20 flex-1 flex-col items-center gap-0.5 rounded-2xl border border-night-dusk/40 bg-night-dusk/40 px-3 py-2 text-slate-50 shadow"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-night-glow">
        {label}
      </span>
      <span
        className="text-2xl font-bold tracking-tight text-sky-sunset tabular-nums"
        aria-live={live ? 'polite' : 'off'}
      >
        {value}
      </span>
    </div>
  );
}
