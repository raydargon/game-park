// ScoreHud — the score read-out displayed above the canvas in the
// GameShell. Shows the current score (driven by the game through
// `onScore`) and the best score for this game (read from the
// persisted store).
//
// Pure presentation: the shell owns the actual numbers and passes
// them in as props. This keeps the HUD testable in isolation and
// lets AC-12 layer the achievement popup on top of the same area
// without coupling it to the store.
export type ScoreHudProps = {
  score: number;
  highScore: number;
  /** Short label (e.g. "Snake Kingdom") shown above the numbers. */
  label?: string;
};

export default function ScoreHud({ score, highScore, label }: ScoreHudProps) {
  return (
    <div
      data-testid="score-hud"
      className="flex items-center justify-between gap-4 rounded-2xl border border-night-dusk/40 bg-night-dusk/30 px-5 py-3 text-slate-50 shadow"
    >
      <div className="flex flex-col">
        {label && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-night-glow">
            {label}
          </span>
        )}
        <span className="text-xs font-semibold uppercase tracking-widest text-sky-sunset">
          Score
        </span>
        <span
          data-testid="score-hud-score"
          className="text-3xl font-bold tracking-tight"
        >
          {score}
        </span>
      </div>
      <div
        aria-hidden
        className="h-10 w-px bg-night-dusk/60"
      />
      <div className="flex flex-col items-end">
        <span className="text-xs font-semibold uppercase tracking-widest text-fantasy-cream">
          Best
        </span>
        <span
          data-testid="score-hud-high"
          className="text-3xl font-bold tracking-tight text-fantasy-cream"
        >
          {highScore}
        </span>
      </div>
    </div>
  );
}
