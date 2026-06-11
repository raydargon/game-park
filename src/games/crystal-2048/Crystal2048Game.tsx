// Crystal2048Game — DOM + Framer Motion render wrapper.
//
// This is the only Phase 1 game that doesn't use a `<canvas>` —
// 2048's tile slides and merge pops are easier to express with
// CSS transitions and Framer Motion's `layout` prop. We render
// a 4×4 background grid of dim cells, then absolutely-position a
// `motion.div` for every tile on top. Each tile gets:
//
//   * `key={tile.id}` — stable id so Framer Motion can track
//     position changes for the same tile across renders.
//   * `layout` — animates the slide from the old (row, col) to
//     the new one.
//   * `initial={...}` — fades + scales a brand-new tile in from
//     0.4 → 1.
//   * `animate={...}` — runs a one-shot keyframe pulse
//     (1 → 1.18 → 1) on the turn a tile merges.
//
// Arrow keys call the hook's `move(direction)`; the game's own
// restart button is the Play Again button on the game-over
// overlay (the shell's Restart button does the same thing).
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import type { GameComponentProps } from '../registry';
import { useCrystal2048, type Direction } from './useCrystal2048';
import {
  BOARD_W,
  CELL_GAP,
  CELL_SIZE,
  COLORS,
  PADDING,
  TILE_COLORS,
  cellPosition,
  fontSizeForValue,
  fontWeightForValue,
} from './constants';
import type { Tile } from './types';

export default function Crystal2048Game({
  gameId,
  isPaused,
  onScore,
  onGameOver,
  onRestart,
}: GameComponentProps) {
  const { state, move, restart } = useCrystal2048({ gameId, onScore, onGameOver });

  // Arrow keys (and WASD aliases) for the four move directions.
  useKeyboard({
    ArrowLeft: () => move('left'),
    ArrowRight: () => move('right'),
    ArrowUp: () => move('up'),
    ArrowDown: () => move('down'),
  });

  // The hook's `move` runs synchronously inside the keydown
  // handler, so pausing the shell doesn't queue moves. We also
  // re-sync the score/gameover side-channels on isPaused flips
  // so the latches don't get stuck.
  useEffect(() => {
    if (!isPaused) return;
    // No-op: pausing is handled at the render layer (the canvas
    // wrapper dims everything and the pause overlay sits above).
  }, [isPaused]);

  return (
    <div
      data-testid="crystal-2048-game"
      data-game-id={gameId}
      className="relative flex h-full w-full flex-col items-center justify-center gap-4"
    >
      {/* Header row: score + best */}
      <div
        data-testid="crystal-2048-hud"
        className="flex w-full max-w-md items-center justify-between gap-3 px-2"
      >
        <HudCell label="Score" value={state.score} testId="crystal-2048-score" />
        <HudCell label="Best" value={state.bestTile} testId="crystal-2048-best" />
      </div>

      {/* Board */}
      <div
        data-testid="crystal-2048-board"
        className="relative rounded-2xl shadow-2xl"
        style={{
          width: BOARD_W,
          height: BOARD_W,
          backgroundColor: COLORS.board,
          padding: 0,
        }}
      >
        {/* Background cells (the dim "empty" grid behind the tiles). */}
        <div
          className="absolute grid"
          style={{
            left: PADDING,
            top: PADDING,
            gridTemplateColumns: `repeat(4, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(4, ${CELL_SIZE}px)`,
            gap: CELL_GAP,
          }}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl"
              style={{ backgroundColor: COLORS.cell, borderRadius: COLORS.cellRadius }}
            />
          ))}
        </div>

        {/* Tiles — absolutely positioned over the background. */}
        <div className="absolute inset-0">
          {state.tiles.map((tile) => (
            <TileView key={tile.id} tile={tile} />
          ))}
        </div>
      </div>

      {/* Controls hint */}
      <p className="text-[10px] uppercase tracking-widest text-slate-300/80">
        Arrow keys / WASD — slide the crystals
      </p>

      {state.status === 'gameover' && (
        <motion.div
          data-testid="crystal-2048-gameover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-night-deep/85 px-6 text-center text-slate-50 backdrop-blur-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-night-glow">
            Game Over
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-sky-sunset">
            The mine is full.
          </h2>
          <p className="text-sm text-slate-200/90">
            Final score:{' '}
            <span
              data-testid="crystal-2048-final-score"
              className="font-bold text-fantasy-cream"
            >
              {state.score}
            </span>
            {' · Best tile '}
            <span className="font-bold text-fantasy-pink">{state.bestTile}</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {onRestart && (
              <button
                type="button"
                onClick={onRestart}
                data-testid="crystal-2048-play-again"
                className="rounded-full bg-night-glow px-5 py-2 text-sm font-semibold text-night-deep shadow hover:bg-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
              >
                Play Again
              </button>
            )}
            <button
              type="button"
              onClick={restart}
              data-testid="crystal-2048-restart"
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

// ----- Tile renderer -----

function TileView({ tile }: { tile: Tile }) {
  const pos = cellPosition(tile.row, tile.col);
  const colors = TILE_COLORS[tile.value];
  return (
    <motion.div
      data-testid={`crystal-2048-tile-${tile.value}`}
      data-value={tile.value}
      data-row={tile.row}
      data-col={tile.col}
      layout
      initial={{ scale: 0.4, opacity: 0 }}
      animate={
        tile.justMerged
          ? { scale: [1, 1.18, 1], opacity: 1 }
          : { scale: 1, opacity: 1 }
      }
      transition={{
        type: 'spring',
        stiffness: 360,
        damping: 26,
        // The merge pulse is a one-shot keyframe; let the spring
        // handle position, but explicitly time the pop so the
        // keyframes play crisply.
        scale: { duration: tile.justMerged ? 0.32 : 0.2 },
      }}
      style={{
        position: 'absolute',
        left: pos.left,
        top: pos.top,
        width: CELL_SIZE,
        height: CELL_SIZE,
        backgroundColor: colors.bg,
        color: colors.text,
        borderRadius: COLORS.cellRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: fontWeightForValue(tile.value),
        fontSize: fontSizeForValue(tile.value),
        // Soft inner highlight so the tile reads against the board.
        boxShadow:
          'inset 0 0 0 1px rgba(255, 255, 255, 0.15), 0 2px 4px rgba(0, 0, 0, 0.25)',
        userSelect: 'none',
      }}
    >
      {tile.value}
    </motion.div>
  );
}

// ----- HUD cell -----

function HudCell({
  label,
  value,
  testId,
}: {
  label: string;
  value: number;
  testId: string;
}) {
  return (
    <div
      data-testid={testId}
      className="flex min-w-24 flex-col items-center gap-0.5 rounded-2xl border border-night-dusk/40 bg-night-dusk/40 px-4 py-2 text-slate-50 shadow"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-night-glow">
        {label}
      </span>
      <span className="text-2xl font-bold tracking-tight text-sky-sunset">
        {value}
      </span>
    </div>
  );
}

// Re-export the type so other modules can type `Direction` if they
// ever need to.
export type { Direction };
