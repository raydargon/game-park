// NotFoundPage — themed "off the map" page for unmatched routes.
//
// Reached for URLs that don't match `/` or `/play/:gameId` (e.g.
// `/garbage`). Provides a single Return link back to the park.
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main
      data-testid="not-found-page"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-night-deep via-night-dusk to-night-deep p-8 text-center text-slate-50"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-night-glow">
        404
      </p>
      <h1 className="text-5xl font-bold tracking-tight text-sky-sunset">
        This path is off the map
      </h1>
      <p className="max-w-prose text-slate-300">
        The DreamPlay Park cartographers haven't charted this trail yet.
        Head back to the entrance and pick an attraction.
      </p>
      <Link
        to="/"
        className="rounded-full bg-night-glow px-5 py-2 text-sm font-semibold text-night-deep shadow hover:bg-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
      >
        ← Return to Dream Park
      </Link>
    </main>
  );
}
