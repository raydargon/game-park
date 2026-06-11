// SoundToggle — top-right mute/unmute button for the ambient wind-pad
// loop. Defaults to muted per PRD §4. The actual WebAudio lives in
// `src/utils/sound.ts` (shared with the future AchievementPopup).
import { useCallback, useState } from 'react';
import { startWindPad, stopWindPad } from '../../utils/sound';

export default function SoundToggle() {
  const [on, setOn] = useState(false);

  const toggle = useCallback(() => {
    setOn((prev) => {
      const next = !prev;
      if (next) {
        // Must be called from a user gesture (this click) so the
        // browser unlocks the AudioContext.
        startWindPad();
      } else {
        stopWindPad();
      }
      return next;
    });
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={on ? 'Mute ambient sound' : 'Play ambient sound'}
      aria-pressed={on}
      title={on ? 'Mute ambient sound' : 'Play ambient sound'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-night-dusk/60 bg-night-deep/70 text-lg text-sky-sunset shadow backdrop-blur transition hover:border-fantasy-cream/70 hover:text-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
    >
      <span aria-hidden>{on ? '🔊' : '🔈'}</span>
    </button>
  );
}
