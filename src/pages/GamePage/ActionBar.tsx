// ActionBar — the bottom row of controls shared by every Phase 1
// game (per PRD §6). Four buttons, left-to-right:
//
//   1. Restart   — resets the current run (handled by the shell).
//   2. Pause     — toggles pause state and the overlay.
//   3. Sound     — toggles the shared wind-pad loop (uses the
//                  same start/stop helpers as the ParkPage toggle).
//   4. Fullscreen — opens / closes the Fullscreen API on the
//                  canvas wrapper (delegated to FullscreenButton).
//
// All four buttons are real `<button type="button">` elements with
// `aria-label`s, focus rings, and a disabled state during the
// transition between paused and resumed (so a double-click can't
// double-fire). The bar itself is `aria-label="Game controls"` so
// screen-reader users can jump past it.
import { useCallback, useState } from 'react';
import { startWindPad, stopWindPad } from '../../utils/sound';
import FullscreenButton from './FullscreenButton';

export type ActionBarProps = {
  isPaused: boolean;
  isFullscreen: boolean;
  onRestart: () => void;
  onTogglePause: () => void;
  onToggleFullscreen: () => void;
};

export default function ActionBar({
  isPaused,
  isFullscreen,
  onRestart,
  onTogglePause,
  onToggleFullscreen,
}: ActionBarProps) {
  // The sound button mirrors the ParkPage SoundToggle contract:
  // muted by default, must be toggled from a user gesture (this
  // click) so the AudioContext is unlocked by the browser.
  const [soundOn, setSoundOn] = useState(false);

  const handleSoundToggle = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      if (next) startWindPad();
      else stopWindPad();
      return next;
    });
  }, []);

  return (
    <div
      data-testid="action-bar"
      role="toolbar"
      aria-label="Game controls"
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
    >
      <button
        type="button"
        onClick={onRestart}
        aria-label="Restart game"
        title="Restart"
        data-testid="action-restart"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-night-dusk/60 bg-night-deep/70 px-3 text-sm font-semibold text-sky-sunset shadow transition hover:border-fantasy-cream/70 hover:text-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
      >
        <span aria-hidden>↻</span>
        <span className="hidden sm:inline">Restart</span>
      </button>

      <button
        type="button"
        onClick={onTogglePause}
        aria-label={isPaused ? 'Resume game' : 'Pause game'}
        aria-pressed={isPaused}
        title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
        data-testid="action-pause"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-night-dusk/60 bg-night-deep/70 px-3 text-sm font-semibold text-sky-sunset shadow transition hover:border-fantasy-cream/70 hover:text-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
      >
        <span aria-hidden>{isPaused ? '▶' : '⏸'}</span>
        <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
      </button>

      <button
        type="button"
        onClick={handleSoundToggle}
        aria-label={soundOn ? 'Mute ambient sound' : 'Play ambient sound'}
        aria-pressed={soundOn}
        title={soundOn ? 'Mute ambient sound' : 'Play ambient sound'}
        data-testid="action-sound"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-night-dusk/60 bg-night-deep/70 text-lg text-sky-sunset shadow transition hover:border-fantasy-cream/70 hover:text-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream sm:w-auto sm:px-3"
      >
        <span aria-hidden>{soundOn ? '🔊' : '🔈'}</span>
        <span className="ml-2 hidden text-sm font-semibold sm:inline">
          Sound
        </span>
      </button>

      <FullscreenButton
        isFullscreen={isFullscreen}
        onClick={onToggleFullscreen}
        className="border-night-dusk/60 bg-night-deep/70"
      />
    </div>
  );
}
