import Icon from '../components/Icon';
import { Card, PageShell, ProgressBar } from '../components/ui';
import { StreakCard } from '../components/SideCards';
import { fmt, useStore } from '../data/store';
import type { IconName } from '../data/mockData';

export default function Rewards() {
  const { data, redeem } = useStore();
  const { level, rules } = data;
  const earned = data.badges.filter(b => b.earned).length + 5; // 5 earlier badges not shown in this preview
  const earnRules: { icon: IconName; label: string; pts: number }[] = [
    { icon: 'check', label: 'Daily check-in', pts: rules.checkIn },
    { icon: 'activity', label: 'Each metric logged', pts: rules.perLog },
    { icon: 'shield', label: 'Out-of-range reading logged', pts: rules.perLog },
    { icon: 'recover', label: 'Recovery day taken', pts: rules.recoveryDay },
    { icon: 'trophy', label: 'Crew goal met', pts: rules.crewGoal },
  ];

  return (
    <PageShell
      main={
        <>
          <header className="stack-4">
            <h1 className="t-h2">Rewards</h1>
            <p className="t-body-sm c-secondary">Points come from logging and routines, never from your results</p>
          </header>

          <section className="card level">
            <div className="grow stack-10">
              <span className="t-overline c-info">Level {level.number}</span>
              <h2 className="t-h3">{level.title}</h2>
              <div className="between t-body-sm"><span className="c-secondary">{fmt(data.points)} / {fmt(level.nextAt)} pts</span><span className="c-muted">{data.points >= level.nextAt ? `${level.next} unlocked` : `${fmt(level.nextAt - data.points)} to ${level.next}`}</span></div>
              <ProgressBar value={data.points / level.nextAt} />
            </div>
            <div className="row gap-12">
              {[[`+${fmt(data.pointsThisWeek)}`, 'pts this week'], [String(data.streak.best), 'best streak'], [`${earned} / 24`, 'badges']].map(([v, l]) => (
                <div key={l} className="mini-stat"><span className="t-stat-xs">{v}</span><span className="t-caption c-secondary">{l}</span></div>
              ))}
            </div>
          </section>

          <Card title="How you earn points">
            <div className="rules">
              {earnRules.map(r => (
                <div key={r.label} className="rule">
                  <div className="between"><Icon name={r.icon} className="c-secondary" /><span className="t-meta c-info">+{r.pts}</span></div>
                  <span className="t-body-sm">{r.label}</span>
                </div>
              ))}
            </div>
            <p className="row gap-8 t-body-sm c-secondary"><Icon name="shield" size={16} className="c-nominal" />Logging a bad reading earns the same as a good one. Honest data keeps the crew safe.</p>
          </Card>

          <Card title="Badges" action={<span className="c-info">{earned} of 24 earned</span>}>
            <div className="badges">
              {data.badges.map(b => (
                <div key={b.name} className={`badge ${b.earned ? '' : 'badge-locked'}`}>
                  <span className="medallion"><Icon name={b.icon} size={24} /></span>
                  <span className={`t-strong ${b.earned ? '' : 'c-secondary'}`}>{b.name}</span>
                  <span className="t-caption c-muted">{b.name === '14-day streak' ? `${Math.max(0, 14 - data.streak.current)} days to go` : b.detail}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      }
      side={
        <>
          <StreakCard link={false} />
          <Card title="Spend points" action={`${fmt(data.points)} available`} className="list-card">
            {data.spend.map(s => {
              const can = data.points >= s.cost;
              return (
                <div key={s.name} className="list-row">
                  <span className="round-icon"><Icon name="gift" size={18} className="c-secondary" /></span>
                  <span className="grow"><span className={`t-body-sm block ${can ? '' : 'c-secondary'}`}>{s.name}</span><span className="t-caption c-muted block">{fmt(s.cost)} pts</span></span>
                  {can
                    ? <button type="button" className="pill-btn t-meta" onClick={() => redeem(s.name, s.cost)}>Redeem</button>
                    : <span className="t-caption c-muted">{fmt(s.cost - data.points)} more</span>}
                </div>
              );
            })}
          </Card>
          <Card title="Recent points" action="Latest" className="list-card">
            {data.recentPoints.map((p, i) => (
              <div key={i} className="list-row">
                <span className="grow"><span className="t-body-sm block">{p.label}</span><span className="t-caption c-muted block">{p.when}</span></span>
                <span className={`t-meta ${p.points >= 0 ? 'c-nominal' : 'c-secondary'}`}>{p.points >= 0 ? '+' : '−'}{fmt(Math.abs(p.points))}</span>
              </div>
            ))}
          </Card>
        </>
      }
    />
  );
}
