import { Link, Route, Routes } from 'react-router-dom';

// AC-1 / AC-2 land only the scaffold and a tiny palette preview.
// Real ParkPage / GamePage / NotFoundPage are wired up in AC-3.

type Swatch = {
  className: string;
  label: string;
  hex: string;
};

const SWATCHES: Swatch[] = [
  { className: 'bg-sky-morning', label: 'sky.morning', hex: '#AEE2FF' },
  { className: 'bg-sky-midday', label: 'sky.midday', hex: '#C7F9FF' },
  { className: 'bg-sky-sunset', label: 'sky.sunset', hex: '#FFF5E4' },
  { className: 'bg-fantasy-pink', label: 'fantasy.pink', hex: '#FFD6EC' },
  { className: 'bg-fantasy-blue', label: 'fantasy.blue', hex: '#B8E8FC' },
  { className: 'bg-fantasy-green', label: 'fantasy.green', hex: '#D7FFD9' },
  { className: 'bg-fantasy-cream', label: 'fantasy.cream', hex: '#FFF4B8' },
  { className: 'bg-night-deep', label: 'night.deep', hex: '#2B2D42' },
  { className: 'bg-night-dusk', label: 'night.dusk', hex: '#3A506B' },
  { className: 'bg-night-glow', label: 'night.glow', hex: '#5BC0BE' },
];

function PalettePreview() {
  return (
    <section
      aria-label="DreamPlay Park palette preview"
      className="grid grid-cols-2 gap-3 sm:grid-cols-5"
    >
      {SWATCHES.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-white/10 bg-white/5 p-3 shadow"
        >
          <div
            className={`${s.className} h-12 w-full rounded-md ring-1 ring-black/10`}
          />
          <p className="mt-2 text-xs font-semibold text-slate-100">
            {s.label}
          </p>
          <p className="text-[10px] text-slate-300">{s.hex}</p>
        </div>
      ))}
    </section>
  );
}

function Home() {
  return (
    <main className="min-h-screen bg-night-deep text-slate-50 flex flex-col items-center gap-8 p-8">
      <header className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">DreamPlay Park</h1>
        <p className="mt-3 max-w-prose text-slate-300">
          Scaffold online. The fantasy amusement park map and the five
          mini-games land in upcoming slices. The PRD palette is encoded as
          Tailwind theme tokens (below) and CSS custom properties.
        </p>
      </header>

      <PalettePreview />

      <Link
        to="/play/snake"
        className="rounded-full bg-night-glow px-5 py-2 text-sm font-semibold text-night-deep shadow hover:bg-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
      >
        Try the Snake placeholder
      </Link>
    </main>
  );
}

function PlaceholderGame() {
  return (
    <main className="min-h-screen bg-night-deep text-slate-50 flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-3xl font-semibold">Game placeholder</h2>
      <p className="text-slate-300">The shared game shell lands in AC-5.</p>
      <Link
        to="/"
        className="rounded-full bg-night-dusk px-4 py-2 text-sm font-semibold text-slate-50 hover:bg-night-glow"
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
