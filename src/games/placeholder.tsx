// Placeholder game component used by the registry while the real
// `useXxxGame` hooks and Canvas implementations land in AC-6+.
//
// `data-game-id` is exposed on the wrapper so e2e tests and the
// AchievementPopup can target individual games without coupling
// to the eventual game-specific component name.
import { Link } from 'react-router-dom';

export type PlaceholderGameProps = {
  gameId: string;
  title: string;
  attractionLabel: string;
};

export default function PlaceholderGame({
  gameId,
  title,
  attractionLabel,
}: PlaceholderGameProps) {
  return (
    <section
      data-game-id={gameId}
      className="flex flex-col items-center gap-4 rounded-2xl border border-night-dusk/40 bg-night-dusk/30 p-8 text-center text-slate-50"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-night-glow">
        {attractionLabel}
      </p>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="max-w-prose text-slate-300">
        The {title} implementation lands in a later AC. For now this is a
        placeholder so the routing, shell, and registry can be verified
        end-to-end.
      </p>
      <Link
        to="/"
        className="rounded-full bg-night-glow px-4 py-2 text-sm font-semibold text-night-deep shadow hover:bg-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
      >
        ← Return to Dream Park
      </Link>
    </section>
  );
}
