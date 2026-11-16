import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import Radar, { metricAxis, type RadarAxis } from '../components/Radar';
import { Button, PageShell, ProgressBar } from '../components/ui';
import { AlertsCard, StreakCard } from '../components/SideCards';
import { useCheckIn } from '../components/CheckInContext';
import { SCORE_HEALTHY, areaScore, average, fmt, statusOf, useStore } from '../data/store';
import { AREAS, CHECK_IN_ORDER, type AreaId, type MetricId } from '../data/mockData';

type ViewId = AreaId | 'overview';

const OVERVIEW = {
  id: 'overview' as const, name: 'All areas', title: 'Health overview', summary: 'One axis per area · tap to drill in',
  metrics: [] as MetricId[], view: 'overview' as const,
};
const VIEWS = [OVERVIEW, ...AREAS];

/** Scores run 40–100 from center to edge so differences between areas are easy to see. */
const scoreToRadius = (score: number) => Math.max(0.05, Math.min(1, (score - 40) / 60));

const BANNERS: Record<ViewId, { text: string; link: string; to: string }> = {
  overview: { text: 'Sleep has been below the Earth range for 6 weeks', link: 'View sleep', to: '/health/behavioral/sleep' },
  behavioral: { text: 'Sleep has been below the Earth range for 6 weeks', link: 'View sleep', to: '/health/behavioral/sleep' },
  cardiovascular: { text: 'Blood pressure has been rising for 3 weeks · re-measure today', link: 'View blood pressure', to: '/health/cardiovascular/bloodPressure' },
  body: { text: 'Hydration is behind today', link: 'View hydration', to: '/health/body/hydration' },
  vision: { text: 'Next eye exam is on Day 150 · 8 days away', link: 'View alerts', to: '/alerts' },
  radiation: { text: 'Solar activity elevated · stay near the shielded module if alerted', link: 'View alert', to: '/alerts' },
};

function Ring({ done, total, complete }: { done: number; total: number; complete: boolean }) {
  const c = 2 * Math.PI * 25;
  return (
    <span className="ring">
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="25" fill="none" stroke="var(--color-bg-raised)" strokeWidth="6" />
        <circle cx="28" cy="28" r="25" fill="none" strokeWidth="6" strokeLinecap="butt" transform="rotate(-90 28 28)"
          stroke={complete ? 'var(--color-status-nominal)' : 'var(--color-action-interact)'} strokeDasharray={`${(done / total) * c} ${c}`} />
      </svg>
      <span className="t-strong">{done}/{total}</span>
    </span>
  );
}

function ListRow({ name, detail, value, meta, status, to }: { name: string; detail: string; value: string; meta: string; status: 'nominal' | 'caution'; to?: string }) {
  const body = (
    <>
      <i className={`dot dot-lg ${status === 'nominal' ? 'dot-nominal' : 'dot-caution'}`} />
      <span className="grow"><span className="t-strong block">{name}</span><span className="t-body-sm c-secondary block">{detail}</span></span>
      <span className="right"><span className={`t-h4 block ${status === 'caution' ? 'c-caution' : ''}`}>{value}</span><span className="t-caption c-muted block">{meta}</span></span>
      {to && <Icon name="chevron" size={24} className="c-secondary" />}
    </>
  );
  return to ? <Link to={to} className="area-row">{body}</Link> : <div className="area-row">{body}</div>;
}

export default function Health() {
  const { area: areaParam } = useParams();
  const area = VIEWS.find(a => a.id === areaParam);
  const { data, pendingCheckIn } = useStore();
  const { open: openCheckIn } = useCheckIn();
  const navigate = useNavigate();
  const [dropdown, setDropdown] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDropdown(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!area) return <Navigate to="/health/overview" replace />;

  const total = CHECK_IN_ORDER.length;
  const done = total - pendingCheckIn.length;
  const complete = data.checkIn.completedToday;
  const metrics = area.metrics.map(id => data.metrics[id]);
  const overviewAxes: RadarAxis[] = AREAS.map(a => {
    const { score, off, total } = areaScore(data, a.id);
    return {
      key: a.id, name: a.name, value: scoreToRadius(score), to: `/health/${a.id}`,
      status: score < SCORE_HEALTHY ? 'low' : 'good',
      detail: `${score}  ·  ${off === 0 ? 'all in range' : score < SCORE_HEALTHY ? `${off} of ${total} need attention` : `${off} to watch`}`,
    };
  });
  const overallScore = Math.round(average(AREAS.map(a => areaScore(data, a.id).score)));
  const banner = BANNERS[area.id];
  // Hide the banner once the thing it warns about is back in range.
  const hyd = data.metrics.hydration;
  const showBanner = area.id !== 'body' || statusOf(hyd) !== 'good';
  const bannerText = area.id === 'body' ? `${banner.text} · ${fmt(Math.max(0, hyd.range.low - hyd.daily[hyd.daily.length - 1]), 1)} L to go` : banner.text;
  const r = data.radiation;

  return (
    <PageShell
      main={
        <>
          <header className="stack-4">
            <h1 className="t-h2">Health tracking</h1>
            <p className="t-body-sm c-secondary">Day {data.astronaut.missionDay}  ·  {data.astronaut.dateLabel}</p>
          </header>

          <section className={`card checkin ${complete ? 'checkin-done' : ''}`}>
            <Ring done={done} total={total} complete={complete} />
            <div className="grow stack-4">
              <h2 className="t-h4">{complete ? 'Check-in complete' : 'Daily check-in'}</h2>
              <p className="t-body-sm c-secondary">{complete ? `${total} of ${total} done  ·  next check-in tomorrow 07:00` : `${total - done} left`}</p>
            </div>
            <Button kind={complete ? 'secondary' : 'primary'} onClick={openCheckIn}>{complete ? 'Review answers' : done === 0 ? 'Start' : 'Continue'}</Button>
          </section>

          {showBanner && (
            <Link to={banner.to} className="banner">
              <i className="dot dot-lg dot-caution" />
              <span className="t-body-sm grow">{bannerText}</span>
              <span className="t-strong c-caution">{banner.link}</span>
            </Link>
          )}

          <section className="card area-card">
            <header className="between">
              <div className="stack-2">
                <h2 className="t-h5">{area.title}</h2>
                <p className="t-caption c-muted">
                  {area.view === 'overview' ? `Each axis is an area score out of 100 · ${SCORE_HEALTHY}+ is healthy (shaded) · center = 40`
                    : area.view === 'radar' ? 'Each axis scaled to its healthy range · inside = low, outside = high'
                    : area.id === 'vision' ? 'Measured at scheduled eye exams, so this area updates less often'
                    : 'From your dosimeter and space weather forecasts'}
                </p>
              </div>
              <div className="dropdown" ref={ddRef}>
                <button type="button" className="dropdown-btn" onClick={() => setDropdown(o => !o)} aria-haspopup="listbox" aria-expanded={dropdown}>
                  <span className="stack-0"><span className="t-caption c-muted">Area</span><span className="t-strong">{area.name}</span></span>
                  <Icon name="chevronDown" size={16} className="c-secondary" />
                </button>
                {dropdown && (
                  <ul className="popover dropdown-menu" role="listbox">
                    {VIEWS.map(a => (
                      <li key={a.id}>
                        <button type="button" role="option" aria-selected={a.id === area.id} className={`dropdown-opt ${a.id === area.id ? 'dropdown-opt-on' : ''}`}
                          onClick={() => { setDropdown(false); navigate(`/health/${a.id}`); }}>
                          <span className="grow"><span className="t-strong block">{a.name}</span><span className="t-caption c-secondary block">{a.summary}</span></span>
                          <span className="t-h5">{a.view === 'overview' ? overallScore : areaScore(data, a.id).score}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </header>

            {area.view !== 'list' && (
              <>
                {area.view === 'overview'
                  ? <Radar axes={overviewAxes} band={[scoreToRadius(SCORE_HEALTHY), 1]} label="Radar chart of the score for each health area" />
                  : <Radar axes={metrics.map(metricAxis)} band={[0.25, 0.75]} target={0.5} label="Radar chart of this area’s metrics against their healthy ranges" />}
                <footer className="between">
                  <div className="row gap-16 t-caption c-secondary">
                    <span className="row gap-6"><i className="legend-line" />Current</span>
                    <span className="row gap-6"><i className="legend-band" />Healthy range</span>
                  </div>
                  <span className="t-caption c-muted">{area.view === 'overview' ? 'Select an area to see its metrics' : 'Select a metric to see its graph'}</span>
                </footer>
              </>
            )}

            {area.id === 'vision' && (
              <div className="stack-12 list-area">
                {data.vision.map(v => <ListRow key={v.name} {...v} />)}
                <p className="note t-body-sm c-secondary"><i className="dot dot-info" />Notice blurry near vision, headaches or a shadow in your sight? Report it in a check-in and the flight surgeon is notified.</p>
              </div>
            )}

            {area.id === 'radiation' && (
              <div className="stack-12 list-area">
                <div className="dose">
                  <div className="between end">
                    <div><p className="t-body-sm c-secondary">Mission dose so far</p><p className="t-stat-sm">{r.missionDose} mSv</p></div>
                    <p className="t-body-sm c-secondary">{Math.round((r.missionDose / r.missionLimit) * 100)}% of {r.missionLimit} mSv mission limit</p>
                  </div>
                  <ProgressBar value={r.missionDose / r.missionLimit} color="var(--color-status-nominal)" height={10} />
                  <p className="t-caption c-muted">On track: at today’s rate you’ll finish the mission at about {r.projected} mSv.</p>
                </div>
                {r.rows.map(v => <ListRow key={v.name} {...v} to={v.status === 'caution' ? '/alerts' : undefined} />)}
                <p className="note t-body-sm c-secondary"><i className="dot dot-info" />Radiation is tracked automatically by your dosimeter. Nothing to log here.</p>
              </div>
            )}
          </section>
        </>
      }
      side={<><StreakCard /><AlertsCard /></>}
    />
  );
}
