import { useCallback, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import TopBar from './components/TopBar';
import CheckInModal from './components/CheckInModal';
import { CheckInContext } from './components/CheckInContext';
import { useStore } from './data/store';
import Health from './pages/Health';
import StatDetail from './pages/StatDetail';
import Rewards from './pages/Rewards';
import Crew from './pages/Crew';
import Alerts from './pages/Alerts';

export default function App() {
  const [checkInOpen, setCheckInOpen] = useState(false);
  const { toast } = useStore();
  const open = useCallback(() => setCheckInOpen(true), []);
  const ctx = useMemo(() => ({ open }), [open]);

  return (
    <CheckInContext.Provider value={ctx}>
      <TopBar />
      <Routes>
        <Route path="/" element={<Navigate to="/health/behavioral" replace />} />
        <Route path="/health" element={<Navigate to="/health/behavioral" replace />} />
        <Route path="/health/:area" element={<Health />} />
        <Route path="/health/:area/:metric" element={<StatDetail />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/crew" element={<Crew />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="*" element={<Navigate to="/health/behavioral" replace />} />
      </Routes>
      {checkInOpen && <CheckInModal onClose={() => setCheckInOpen(false)} />}
      {toast && <div className="toast t-body-sm" role="status">{toast.text}</div>}
    </CheckInContext.Provider>
  );
}
