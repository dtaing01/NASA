import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { Button } from './ui';
import { useCheckIn } from './CheckInContext';
import { fmt, latest, latestLabel, statusOf, useStore } from '../data/store';
import { CHECK_IN_ORDER, type Metric } from '../data/mockData';

function useClickAway(onAway: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onAway(); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onAway(); };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  });
  return ref;
}

function logHint(m: Metric, done: boolean): { text: string; cls: string } {
  if (m.id === 'bloodPressure') return { text: 'Due now  ·  seated, after 5 min rest', cls: 'c-caution' };
  if (m.id === 'exercise') return { text: `${fmt(latest(m), 1)} h this week  ·  target 12–15 h`, cls: 'c-secondary' };
  if (m.id === 'hydration') return { text: `${fmt(latest(m), 1)} of ${fmt(m.range.low, 1)} L today`, cls: statusOf(m) === 'good' ? 'c-secondary' : 'c-caution' };
  if (m.inCheckIn && !done) return { text: 'Part of today’s check-in', cls: 'c-muted' };
  return { text: `Latest ${latestLabel(m)} ${m.unit}`, cls: 'c-muted' };
}

export default function TopBar() {
  const { data, pendingCheckIn, reset } = useStore();
  const { open: openCheckIn } = useCheckIn();
  const [menu, setMenu] = useState<'log' | 'profile' | null>(null);
  const ref = useClickAway(() => setMenu(null));
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => setMenu(null), [location.pathname]);

  const logMetrics = (['bloodPressure', 'exercise', 'hydration', 'sleep', 'heartRate', 'mood', 'fatigue', 'stress'] as const).map(id => data.metrics[id]);
  const done = CHECK_IN_ORDER.length - pendingCheckIn.length;
  const healthActive = location.pathname.startsWith('/health') || location.pathname === '/alerts';

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/health/overview" className="brand t-h5">STARPULSE</Link>
        <nav className="tabs" aria-label="Primary">
          <NavLink to="/health/overview" className={() => `tab ${healthActive ? 'tab-active' : ''}`}><Icon name="heart" />Health tracking</NavLink>
          <NavLink to="/environment" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>Environment</NavLink>
          <NavLink to="/rewards" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}><Icon name="star" />Rewards</NavLink>
          <NavLink to="/crew" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}><Icon name="crew" />Crew</NavLink>
        </nav>
        <div className="topbar-right" ref={ref}>
          <Link to="/rewards" className="stat-chip t-strong"><Icon name="flame" size={18} className="c-caution" />{data.streak.current} days</Link>
          <Link to="/rewards" className="stat-chip t-strong"><Icon name="star" size={18} className="c-action" />{fmt(data.points)} pts</Link>
          <Button onClick={() => setMenu(menu === 'log' ? null : 'log')} aria-expanded={menu === 'log'} aria-haspopup="menu">+ Log</Button>
          <button type="button" className="profile t-strong" onClick={() => setMenu(menu === 'profile' ? null : 'profile')} aria-label="Profile menu">{data.astronaut.initials}</button>

          {menu === 'log' && (
            <div className="popover log-menu" role="menu">
              <div className="log-menu-head"><span className="t-h5">Log something</span><span className="t-caption c-secondary">+{data.rules.perLog} pts each</span></div>
              <div className="log-checkin">
                <div className="grow">
                  <div className="t-strong">Daily check-in</div>
                  <div className="t-caption c-secondary">
                    {data.checkIn.completedToday ? `${done} of ${CHECK_IN_ORDER.length} done  ·  complete` : `${done} of ${CHECK_IN_ORDER.length} done  ·  about 30 s`}
                  </div>
                </div>
                <Button kind={data.checkIn.completedToday ? 'secondary' : 'primary'} onClick={() => { setMenu(null); openCheckIn(); }}>
                  {data.checkIn.completedToday ? 'Review' : 'Continue'}
                </Button>
              </div>
              {logMetrics.map(m => {
                const h = logHint(m, data.checkIn.done.includes(m.id));
                return (
                  <button key={m.id} type="button" role="menuitem" className="log-row" onClick={() => navigate(`/health/${m.area}/${m.id}`)}>
                    <span className="grow"><span className="t-body-sm c-primary block">{m.name}</span><span className={`t-caption ${h.cls} block`}>{h.text}</span></span>
                    <Icon name="chevron" size={20} className="c-secondary" />
                  </button>
                );
              })}
            </div>
          )}
          {menu === 'profile' && (
            <div className="popover profile-menu" role="menu">
              <div className="t-strong">{data.astronaut.role}</div>
              <div className="t-caption c-secondary">{data.astronaut.expedition}  ·  Day {data.astronaut.missionDay}</div>
              <hr />
              <Button kind="secondary" full onClick={() => { reset(); setMenu(null); }}>Reset demo data</Button>
              <p className="t-caption c-muted">Demo build: health and mission data are simulated or user-logged; Environment uses historical NASA RR-28 telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
