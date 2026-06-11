// useMemory — pure logic hook for Magic Garden (Memory Match).
//
// State machine:
//   * `idle`     — fresh deck, no flips yet, timer not started.
//   * `running`  — at least one card has been flipped; the timer
//                  is advancing on every tick.
//   * `checking` — two cards are face-up; the hook schedules a
//                  mismatch flip-back after MISMATCH_DELAY_MS.
//                  The timer is frozen during this window so the
//                  700ms reveal doesn't count against the run.
//   * `won`      — all 8 pairs matched. The timer is frozen at the
//                  final value; onGameOver has been reported.
//
// The two-step flip flow:
//   1. `flipCard(i)` with no current pick → mark the card face-up,
//      set `firstPick = i`, transition `'idle'` → `'running'` if it
//      was the first move of the run.
//   2. `flipCard(j)` with `firstPick !== null` → mark the card
//      face-up, set `secondPick = j`, bump `moves` (a "move" is one
//      pair attempt), and:
//        * If the two cards share an emoji, mark both as
//          `matched: true`, clear the picks, and check for win.
//        * Otherwise, schedule a `setTimeout` after
//          `MISMATCH_DELAY_MS` to flip both back.
//
// `tick(deltaMs)` is called from the renderer's `useGameLoop` and
// advances the timer. It is a no-op when the game is paused,
// `'idle'`, `'checking'`, or `'won'`.
//
// Side effects (onScore / onGameOver) flow through refs + latches
// for StrictMode safety, mirroring the snake / 2048 hooks.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MISMATCH_DELAY_MS,
  TOTAL_CARDS,
  TOTAL_PAIRS,
  createShuffledCards,
} from './constants';
import { useGameStore } from '../../store/gameStore';
import type { GameId } from '../registry';
import type { MemoryCard, MemoryState } from './types';

export type UseMemoryArgs = {
  /** Game id (e.g. `'memory'`). Used to mark the game as played
   *  for the `park-explorer` achievement (AC-11). */
  gameId?: GameId;
  /** Called whenever the move counter changes (i.e. after each
   *  pair attempt). The shell mirrors this into the ScoreHud. */
  onScore: (moves: number) => void;
  /** Called once when the run ends with `'won'` status. The
   *  payload is the final elapsed time in *seconds* (rounded
   *  down). The shell persists the best time (lower is better)
   *  via `setBestTime`. */
  onGameOver: (elapsedSeconds: number) => void;
};

export type UseMemoryResult = {
  state: MemoryState;
  /** Player-initiated flip. Ignored if the card is already flipped
   *  or matched, or if a pair is already being checked. */
  flipCard: (index: number) => void;
  /** Advance the wall-clock timer by `deltaMs`. Pauses itself
   *  while the status is anything other than `'running'`. */
  tick: (deltaMs: number) => void;
  /** Shuffle a new deck and reset every counter. The renderer's
   *  Restart button calls this directly; the shell's Restart
   *  re-mounts the hook so this is mostly a defensive helper. */
  reset: () => void;
};

function createInitialState(): MemoryState {
  return {
    cards: createShuffledCards(),
    moves: 0,
    elapsedMs: 0,
    firstPick: null,
    secondPick: null,
    status: 'idle',
  };
}

export function useMemory({
  gameId,
  onScore,
  onGameOver,
}: UseMemoryArgs): UseMemoryResult {
  const [state, setState] = useState<MemoryState>(createInitialState);

  // StrictMode-safe side-channel refs.
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  // Latches to avoid re-reporting the same score twice and to
  // re-arm the game-over hook on restart.
  const lastReportedMovesRef = useRef(0);
  const lastReportedGameOverRef = useRef(false);
  const isMountedRef = useRef(false);

  // Pending mismatch flip-back. Stored in a ref so a remount
  // during StrictMode doesn't double-schedule; the timeout id is
  // captured at scheduling time and we ignore the callback if the
  // state has since moved on.
  const mismatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mismatchSeqRef = useRef(0);

  const clearPendingMismatch = useCallback(() => {
    if (mismatchTimerRef.current !== null) {
      clearTimeout(mismatchTimerRef.current);
      mismatchTimerRef.current = null;
    }
  }, []);

  const flipCard = useCallback((index: number) => {
    setState((s) => {
      if (index < 0 || index >= TOTAL_CARDS) return s;
      const card = s.cards[index];
      if (!card) return s;
      if (card.matched || card.flipped) return s;
      if (s.status === 'checking' || s.status === 'won') return s;

      // First pick of a new pair (or the very first pick of the run).
      if (s.firstPick === null) {
        const nextCards: MemoryCard[] = s.cards.map((c, i) =>
          i === index ? { ...c, flipped: true } : c,
        );
        return {
          ...s,
          cards: nextCards,
          firstPick: index,
          // The first pick also kicks the game into 'running' from
          // 'idle' so the timer starts.
          status: s.status === 'idle' ? 'running' : s.status,
        };
      }

      // Second pick — must be a different card. Bump the move
      // counter, flip the card face-up, and decide match /
      // mismatch.
      const firstIndex = s.firstPick;
      if (firstIndex === index) return s;
      const firstCard = s.cards[firstIndex];
      if (!firstCard) return s;
      const flipped: MemoryCard[] = s.cards.map((c, i) =>
        i === index ? { ...c, flipped: true } : c,
      );
      const matched = firstCard.emoji === card.emoji;
      const nextMoves = s.moves + 1;
      if (matched) {
        const matchedCards: MemoryCard[] = flipped.map((c) =>
          c.flipped ? { ...c, matched: true, flipped: false } : c,
        );
        // Count pairs confirmed so far.
        const confirmedPairs = matchedCards.filter((c) => c.matched).length / 2;
        const won = confirmedPairs >= TOTAL_PAIRS;
        return {
          ...s,
          cards: matchedCards,
          moves: nextMoves,
          firstPick: null,
          secondPick: null,
          status: won ? 'won' : 'running',
        };
      }
      // Mismatch — flip the second card, then schedule the
      // flip-back after MISMATCH_DELAY_MS.
      return {
        ...s,
        cards: flipped,
        moves: nextMoves,
        secondPick: index,
        status: 'checking',
      };
    });
  }, []);

  // When the status flips to `'checking'`, schedule the
  // flip-back. We keep the scheduling in an effect so it observes
  // the latest state and we can cleanly cancel on unmount.
  useEffect(() => {
    if (state.status !== 'checking') return undefined;
    if (state.firstPick === null || state.secondPick === null) {
      return undefined;
    }
    const a = state.firstPick;
    const b = state.secondPick;
    const seq = ++mismatchSeqRef.current;
    clearPendingMismatch();
    mismatchTimerRef.current = setTimeout(() => {
      // Guard: if the sequence has moved on (a restart happened
      // mid-window), drop this callback.
      if (mismatchSeqRef.current !== seq) return;
      setState((s) => {
        if (s.status !== 'checking') return s;
        if (s.firstPick !== a || s.secondPick !== b) return s;
        const flipped: MemoryCard[] = s.cards.map((c, i) =>
          i === a || i === b ? { ...c, flipped: false } : c,
        );
        return {
          ...s,
          cards: flipped,
          firstPick: null,
          secondPick: null,
          status: 'running',
        };
      });
      mismatchTimerRef.current = null;
    }, MISMATCH_DELAY_MS);
    return () => {
      clearPendingMismatch();
    };
  }, [state.status, state.firstPick, state.secondPick, clearPendingMismatch]);

  const tick = useCallback((deltaMs: number) => {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    setState((s) => {
      if (s.status !== 'running') return s;
      return { ...s, elapsedMs: s.elapsedMs + deltaMs };
    });
  }, []);

  const reset = useCallback(() => {
    clearPendingMismatch();
    mismatchSeqRef.current += 1;
    setState(createInitialState());
    lastReportedMovesRef.current = 0;
    lastReportedGameOverRef.current = false;
  }, [clearPendingMismatch]);

  // ----- side effects -----

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      lastReportedMovesRef.current = state.moves;
      return;
    }
    if (state.moves > lastReportedMovesRef.current) {
      lastReportedMovesRef.current = state.moves;
      onScoreRef.current(state.moves);
    }
  }, [state.moves]);

  useEffect(() => {
    if (state.status === 'won' && !lastReportedGameOverRef.current) {
      lastReportedGameOverRef.current = true;
      const seconds = Math.max(1, Math.floor(state.elapsedMs / 1000));
      onGameOverRef.current(seconds);
      // AC-11: mark this game as played for `park-explorer`.
      if (gameId) useGameStore.getState().markGamePlayed(gameId);
    }
    if (state.status !== 'won' && lastReportedGameOverRef.current) {
      // A fresh run after a reset / re-mount.
      lastReportedGameOverRef.current = false;
      lastReportedMovesRef.current = state.moves;
    }
  }, [state.status, state.moves, state.elapsedMs, gameId]);

  // On unmount: cancel any pending mismatch timer.
  useEffect(() => {
    return () => {
      clearPendingMismatch();
    };
  }, [clearPendingMismatch]);

  return { state, flipCard, tick, reset };
}
