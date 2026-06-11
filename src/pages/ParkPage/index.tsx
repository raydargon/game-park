// ParkPage — top-level page for `/`.
//
// AC-4: this composes `<ParkMap />` (the actual interactive map) and
// nothing else. Older static-list rendering has been moved into
// `ParkMap` so the registry, layout metadata, ambient layers, and
// camera-zoom live in one place.
import ParkMap from './ParkMap';

export default function ParkPage() {
  return (
    <main
      data-testid="park-page"
      className="text-slate-50"
    >
      <ParkMap />
    </main>
  );
}
