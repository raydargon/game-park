// ParkMap — orchestrates the park landing: full-bleed day/night sky,
// ambient particles, the five AttractionCards in a CSS grid, the
// top-right toolbar (day/night + sound), and the camera-zoom
// transition that fires on card click.
//
// The camera-zoom is a radial overlay that scales from a small
// circle at the click point to ~30× its size over 700ms, then
// navigates to `/play/:gameId`. Reduced-motion users get an instant
// navigation (no zoom).
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MouseEvent } from 'react';
import { GAME_IDS, GAME_REGISTRY, type GameId } from '../../games/registry';
import {
  ATTRACTION_LAYOUT,
  PARK_GRID_AREAS,
} from './attractionLayout';
import AttractionCard from './AttractionCard';
import AmbientLayer from './AmbientLayer';
import DayNightSky, { PHASES, type SkyPhase } from './DayNightSky';
import SoundToggle from './SoundToggle';

type Zoom = { id: GameId; x: number; y: number } | null;

export default function ParkMap() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<SkyPhase>('morning');
  const [auto, setAuto] = useState(true);
  const [zoom, setZoom] = useState<Zoom>(null);

  // Advance the manual override to the next phase (cycles through PHASES).
  const cycleManualPhase = useCallback(() => {
    setAuto(false);
    setPhase((p) => PHASES[(PHASES.indexOf(p) + 1) % PHASES.length]);
  }, []);

  const handleSelect = useCallback(
    (id: string, event: MouseEvent<HTMLButtonElement>) => {
      // Only treat as a known attraction if it's a registry key.
      if (!(id in GAME_REGISTRY)) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (reduce) {
        navigate(`/play/${id}`);
        return;
      }
      setZoom({ id: id as GameId, x: cx, y: cy });
    },
    [navigate, reduce],
  );

  // After the zoom animation completes, navigate to the game page.
  useEffect(() => {
    if (!zoom) return;
    const t = window.setTimeout(() => {
      navigate(`/play/${zoom.id}`);
    }, 700);
    return () => window.clearTimeout(t);
  }, [zoom, navigate]);

  return (
    <div
      data-testid="park-map"
      className="relative isolate min-h-screen w-full overflow-hidden text-slate-50"
    >
      <DayNightSky
        auto={auto}
        phase={phase}
        onPhaseChange={setPhase}
      />
      <AmbientLayer phase={phase} />

      {/* Top-right toolbar */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
        <button
          type="button"
          onClick={cycleManualPhase}
          aria-label={`Cycle sky phase (current: ${phase})`}
          title={`Sky: ${phase}${auto ? ' (auto)' : ''} — click to override`}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-night-dusk/60 bg-night-deep/70 px-3 text-sm font-semibold text-sky-sunset shadow backdrop-blur transition hover:border-fantasy-cream/70 hover:text-fantasy-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream"
        >
          <span aria-hidden>{phase === 'night' ? '🌙' : phase === 'sunset' ? '🌅' : '☀️'}</span>
          <span className="hidden sm:inline capitalize">{phase}</span>
          {!auto && <span className="hidden text-[10px] uppercase tracking-widest text-fantasy-cream sm:inline">manual</span>}
        </button>
        <SoundToggle />
      </div>

      {/* Park header */}
      <header className="relative z-10 flex flex-col items-center gap-3 px-6 pt-14 text-center sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-night-glow">
          Welcome to
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-sky-sunset drop-shadow sm:text-6xl">
          DreamPlay Park
        </h1>
        <p className="max-w-prose text-slate-100/90">
          Pick an attraction to start playing. The sky drifts through
          morning, sunset, and night on its own — click the sun icon
          to take the wheel.
        </p>
      </header>

      {/* Attraction grid */}
      <section
        aria-label="Phase 1 attractions"
        className="relative z-10 mx-auto mt-10 w-full max-w-6xl px-4 pb-16 sm:px-6"
      >
        <div
          className="grid gap-4 sm:gap-5"
          style={{
            gridTemplateColumns: '1fr',
            gridTemplateAreas: `"${GAME_IDS[0]}"`,
          }}
        >
          {/* Desktop / tablet: the planned 3-column, 2-row grid. */}
          <div
            className="hidden gap-4 sm:gap-5 md:grid"
            style={{
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gridTemplateAreas: PARK_GRID_AREAS,
            }}
          >
            {GAME_IDS.map((id) => {
              const entry = GAME_REGISTRY[id];
              return (
                <AttractionCard
                  key={id}
                  id={id}
                  title={entry.title}
                  attractionLabel={entry.attractionLabel}
                  description={entry.description}
                  emoji={entry.emoji}
                  layout={ATTRACTION_LAYOUT[id]}
                  onSelect={handleSelect}
                />
              );
            })}
          </div>
          {/* Mobile: stacked single column. */}
          <div className="grid gap-4 md:hidden">
            {GAME_IDS.map((id) => {
              const entry = GAME_REGISTRY[id];
              return (
                <AttractionCard
                  key={id}
                  id={id}
                  title={entry.title}
                  attractionLabel={entry.attractionLabel}
                  description={entry.description}
                  emoji={entry.emoji}
                  layout={ATTRACTION_LAYOUT[id]}
                  onSelect={handleSelect}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Camera-zoom overlay */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            key={zoom.id}
            data-testid="camera-zoom"
            className="pointer-events-none fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeIn' }}
          >
            <motion.div
              className="absolute h-32 w-32 rounded-full"
              style={{
                left: zoom.x - 64,
                top: zoom.y - 64,
                background:
                  'radial-gradient(circle, rgba(255,214,236,0.95) 0%, rgba(184,232,252,0.7) 40%, rgba(91,192,190,0.5) 80%, rgba(43,45,66,0) 100%)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 30 }}
              transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
