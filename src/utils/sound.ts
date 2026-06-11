// src/utils/sound.ts — WebAudio helpers (no external audio files).
//
// Used by:
//   * `src/pages/ParkPage/SoundToggle.tsx` — soft wind-pad loop (AC-4).
//   * `src/components/AchievementPopup.tsx` — short unlock chime (AC-12).
//
// All functions are no-ops in non-browser environments and on browsers
// without WebAudio (defensive — every evergreen browser supports it).

type AnyWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let audioCtx: AudioContext | null = null;
let windNodes: { gain: GainNode; oscillators: OscillatorNode[] } | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioCtx) return audioCtx;
  const w = window as AnyWindow;
  const Ctor = window.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

/** Start a soft two-oscillator pad (220 Hz, slightly detuned) with a
 *  slow LFO for a gentle "wind" feel. Idempotent — calling twice is a
 *  no-op. Safe to call from a user gesture (click). */
export function startWindPad(): void {
  const ctx = ensureCtx();
  if (!ctx) return;
  if (windNodes) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.5);
  master.connect(ctx.destination);

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 220;
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 220 * 1.005; // gentle detune

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.2;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 8; // ±8 Hz wobble
  lfo.connect(lfoGain);
  lfoGain.connect(osc1.frequency);
  lfoGain.connect(osc2.frequency);

  osc1.connect(master);
  osc2.connect(master);

  osc1.start();
  osc2.start();
  lfo.start();

  windNodes = { gain: master, oscillators: [osc1, osc2, lfo] };
}

/** Fade the wind pad out and stop its oscillators. Idempotent. */
export function stopWindPad(): void {
  if (!windNodes || !audioCtx) return;
  const ctx = audioCtx;
  const { gain, oscillators } = windNodes;
  const now = ctx.currentTime;
  try {
    gain.gain.cancelScheduledValues(now);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);
  } catch {
    /* node already gone */
  }
  const captured = oscillators;
  windNodes = null;
  window.setTimeout(() => {
    for (const o of captured) {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    }
  }, 500);
}

/** Short bright chime used by the achievement popup (AC-12). */
export function playChime(): void {
  const ctx = ensureCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(880, t0);
  osc.frequency.exponentialRampToValueAtTime(1320, t0 + 0.12);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.55);
}
