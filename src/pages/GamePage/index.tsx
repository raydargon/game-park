// GamePage — the wrapper for `/play/:gameId`.
//
// Reads the `:gameId` URL param, validates it against the registry,
// and delegates to `GameShell`. Unknown ids are redirected back to
// the park so the URL never leaves the user on a dead page.
//
// All of the shared shell chrome (top-left Return link, score HUD,
// canvas wrapper, pause overlay, action bar, fullscreen) lives in
// `GameShell` so this file stays a thin routing shim.
import { Navigate, useParams } from 'react-router-dom';
import GameShell from './GameShell';
import { getGameEntry } from '../../games/registry';

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const entry = getGameEntry(gameId);

  if (!entry) {
    return <Navigate to="/" replace />;
  }

  return (
    <main
      data-testid="game-page"
      data-game-id={entry.id}
      className="min-h-screen bg-gradient-to-b from-night-deep via-night-dusk to-night-deep p-4 text-slate-50 sm:p-8"
    >
      <GameShell gameId={entry.id} entry={entry} />
    </main>
  );
}
