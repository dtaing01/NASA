import { Link } from 'react-router-dom';
import Icon from './Icon';
import { Card, ProgressBar } from './ui';
import { nextBadge } from './CheckInModal';
import { useStore } from '../data/store';
import type { Alert } from '../data/mockData';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StreakCard({ link = true }: { link?: boolean }) {
  const { data } = useStore();
  const { current, week, todayIndex } = data.streak;
  const next = nextBadge(current);
  const body = (
    <>
      <header className="card-head">
        <span className="row gap-8"><Icon name="flame" size={22} className="c-caution" /><span className="t-h4">{current}-day streak</span></span>
        <span className="t-caption c-muted">This week</span>
      </header>
      <div className="week">
        {DAYS.map((d, i) => (
          <div key={i} className="week-day">
            {week[i] ? <span className="day-done"><Icon name="check" size={16} /></span> : <span className={i === todayIndex ? 'day-today' : 'day-empty'} />}
            <span className={`t-caption ${i === todayIndex ? 'c-primary' : 'c-secondary'}`}>{d}</span>
          </div>
        ))}
      </div>
      <div className="stack-8">
        <div className="between"><span className="t-body-sm">Next: {next}-day badge</span><span className="t-caption c-secondary">{next - current} days</span></div>
        <ProgressBar value={current / next} />
      </div>
      <div className="between"><span className="t-caption c-muted">Log daily to keep your streak</span><span className="t-meta c-info">+{data.rules.perLog} / log</span></div>
    </>
  );
  return link ? <Link to="/rewards" className="card card-link">{body}</Link> : <section className="card">{body}</section>;
}

export function SeverityIcon({ severity }: { severity: Alert['severity'] }) {
  if (severity === 'caution' || severity === 'warning') return <Icon name="arrowUp" size={12} className={severity === 'warning' ? 'c-warning' : 'c-caution'} />;
  return <i className={`dot ${severity === 'info' ? 'dot-info' : severity === 'nominal' ? 'dot-nominal' : 'dot-none'}`} />;
}

export function AlertsCard() {
  const { data } = useStore();
  const items = data.alerts.filter(a => a.group !== 'Earlier');
  return (
    <Card title="Alerts" action={<Link to="/alerts" className="c-info">View all</Link>} className="list-card">
      {items.map(a => (
        <Link key={a.id} to={a.link?.to ?? '/alerts'} className="list-row alert-row">
          <span className="alert-icon"><SeverityIcon severity={a.severity} /></span>
          <span className="grow"><span className="t-body-sm c-primary block">{a.title}</span><span className="t-caption c-muted block">{a.link?.label ?? a.detail}</span></span>
          <span className="t-caption c-muted">{a.time}</span>
        </Link>
      ))}
    </Card>
  );
}
