import { Link, Route, Routes } from 'react-router-dom';

// AC-1 lands only the scaffold and a minimal landing view.
// Real ParkPage / GamePage / NotFoundPage are wired up in AC-3.

function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-5xl font-bold tracking-tight">DreamPlay Park</h1>
      <p className="max-w-prose text-center text-slate-300">
        Scaffold online. The fantasy amusement park map and the five mini-games
        land in upcoming slices.
      </p>
      <Link
        to="/play/snake"
        className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
      >
        Try the Snake placeholder
      </Link>
    </main>
  );
}

function PlaceholderGame() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-3xl font-semibold">Game placeholder</h2>
      <p className="text-slate-300">The shared game shell lands in AC-5.</p>
      <Link
        to="/"
        className="rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-50 hover:bg-slate-600"
      >
        ← Return to Dream Park
      </Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play/:gameId" element={<PlaceholderGame />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
