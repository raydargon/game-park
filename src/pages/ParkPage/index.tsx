// ParkPage — the explorable fantasy amusement park (AC-4 fleshes this out).
//
// AC-3 delivers the page-level shell: a themed landing screen that
// uses the registry to enumerate all 5 Phase 1 attractions and links
// each one to `/play/:gameId`. The real `ParkMap` (interactive cards,
// day/night cycle, ambient particles) lands in AC-4.
import { Link } from 'react-router-dom';
import { GAME_IDS, GAME_REGISTRY } from '../../games/registry';

export default function ParkPage() {
  return (
    <main
      data-testid="park-page"
      className="min-h-screen bg-night-deep text-slate-50"
    >
      <header className="flex flex-col items-center gap-3 px-6 pt-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-night-glow">
          Welcome to
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-sky-sunset sm:text-6xl">
          DreamPlay Park
        </h1>
        <p className="max-w-prose text-slate-300">
          Pick an attraction to start playing. The full park map with
          day/night cycle, ambient particles, and decoration unlocks
          arrives in the next slice.
        </p>
      </header>

      <section
        aria-label="Phase 1 attractions"
        className="mx-auto mt-10 grid w-full max-w-5xl grid-cols-1 gap-4 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-3"
      >
        {GAME_IDS.map((id) => {
          const entry = GAME_REGISTRY[id];
          return (
            <Link
              key={id}
              to={`/play/${id}`}
              data-attraction-id={id}
              className="group flex flex-col gap-3 rounded-2xl border border-night-dusk/50 bg-night-dusk/30 p-5 text-left shadow transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream hover:border-fantasy-cream/60 hover:bg-night-dusk/50"
            >
              <span
                aria-hidden
                className="text-4xl"
                style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.3))' }}
              >
                {entry.emoji}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-night-glow">
                  {entry.attractionLabel}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-sky-sunset">
                  {entry.title}
                </h2>
              </div>
              <p className="text-sm text-slate-300">{entry.description}</p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-fantasy-cream group-hover:underline">
                Enter attraction →
              </span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
