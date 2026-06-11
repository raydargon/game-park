// FullscreenButton — a single icon button that toggles fullscreen
// on a target element (the canvas wrapper). Pulled out of the
// ActionBar so the same component can be reused if a future game
// wants to expose fullscreen outside the action bar.
//
// The visible label / icon flips between "Enter fullscreen" and
// "Exit fullscreen" depending on the current state, and the
// `aria-pressed` attribute reflects the state for assistive tech.
export type FullscreenButtonProps = {
  isFullscreen: boolean;
  onClick: () => void;
  /** Optional className passthrough for layout styling. */
  className?: string;
};

export default function FullscreenButton({
  isFullscreen,
  onClick,
  className = '',
}: FullscreenButtonProps) {
  const label = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isFullscreen}
      title={label}
      data-testid="fullscreen-button"
      className={`inline-flex h-10 items-center gap-2 rounded-full border border-night-dusk/60 bg-night-deep/70 px-3 text-sm font-semibold text-sky-sunset shadow transition hover:border-fantasy-cream/70 hover:text-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream ${className}`}
    >
      <span aria-hidden className="text-base leading-none">
        {isFullscreen ? '⛶' : '⤢'}
      </span>
      <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
    </button>
  );
}
