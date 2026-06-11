import { Route, Routes } from 'react-router-dom';
import { useAchievementWatcher } from './hooks/useAchievementWatcher';
import GamePage from './pages/GamePage';
import NotFoundPage from './pages/NotFoundPage';
import ParkPage from './pages/ParkPage';

// AC-3 route table.
//
// `/`             -> ParkPage
// `/play/:gameId` -> GamePage (validates the id against the registry;
//                   unknown ids are redirected back to `/`)
// `*`             -> NotFoundPage (catches all unmatched URLs)
export default function App() {
  // AC-11: mount the achievement watcher at the root so it stays
  // alive across every route change. The hook returns nothing —
  // its only job is to keep a Zustand subscription open.
  useAchievementWatcher();

  return (
    <Routes>
      <Route path="/" element={<ParkPage />} />
      <Route path="/play/:gameId" element={<GamePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
