// GamePage — the wrapper for `/play/:gameId`.
//
// AC-3 ships the page-level shell: it reads the `:gameId` URL param,
// looks it up in the game registry, and either renders the
// registered game component OR `<Navigate to="/" replace />`s the
// user back to the park if the id is unknown. The shared
// `GameShell` (top-left return link, score HUD, action bar,
// fullscreen) lands in AC-5.
import { Navigate, useParams } from 'react-router-dom';
import { getGameEntry } from '../../games/registry';

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const entry = getGameEntry(gameId);

  if (!entry) {
    // Unknown gameId — bounce back to the park so the URL never
    // leaves the user on a dead page.
    return <Navigate to="/" replace />;
  }

  const GameComponent = entry.component;
  return (
    <main
      data-testid="game-page"
      data-game-id={entry.id}
      className="min-h-screen bg-gradient-to-b from-night-deep via-night-dusk to-night-deep p-6 text-slate-50 sm:p-10"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-night-glow">
            {entry.attractionLabel}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-sky-sunset">
            {entry.title}
          </h1>
        </header>

        <GameComponent gameId={entry.id} />
      </div>
    </main>
  );
}
