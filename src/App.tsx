import { Route, Routes } from 'react-router-dom';
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
  return (
    <Routes>
      <Route path="/" element={<ParkPage />} />
      <Route path="/play/:gameId" element={<GamePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
