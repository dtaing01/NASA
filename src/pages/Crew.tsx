import Icon from '../components/Icon';
import { Avatar, Card, PageShell, ProgressBar } from '../components/ui';
import { useCheckIn } from '../components/CheckInContext';
import { useStore } from '../data/store';

export default function Crew() {
  const { data, toggleChallenge, cheer, setShowOnBoards, notify } = useStore();
  const { open: openCheckIn } = useCheckIn();
  const { crewGoal: g, challenges } = data;
  const byId = Object.fromEntries(data.crew.map(c => [c.id, c]));
  const pct = Math.round((g.done / g.total) * 100);
  const need = Math.max(0, Math.ceil((g.goalPct / 100) * g.total) - g.done);

  return (
    <PageShell
      main={
        <>
          <header className="stack-4">
            <h1 className="t-h2">Crew</h1>
            <p className="t-body-sm c-secondary">{data.astronaut.expedition}  ·  {data.crew.length} aboard  ·  Only participation is shared, never health data</p>
          </header>

          <section className="card stack-16">
            <div className="between wrap">
              <div className="stack-6"><span className="t-overline c-info">This week’s crew goal</span><h2 className="t-h3">{g.title}</h2></div>
              <span className="soft-chip t-caption c-secondary"><Icon name="gift" size={14} />{g.reward}</span>
            </div>
            <div className="between t-body-sm"><span>{g.done} of {g.total} sessions  ·  {pct}%</span><span className="c-muted">Goal {g.goalPct}%  ·  {g.daysLeft} days left</span></div>
            <ProgressBar value={g.done / g.total} marker={g.goalPct / 100} />
            <div className="row gap-12">
              <span className="row gap-4">{data.crew.map(c => <Avatar key={c.id} initials={c.initials} color={c.color} size={28} />)}</span>
              <span className="t-body-sm c-secondary">Everyone counts toward the goal. {need} more sessions gets the crew there.</span>
            </div>
          </section>

          <Card title="Crew today" action={<span className="c-muted">Only check-in status is shared</span>}>
            <div className="members">
              {data.crew.map(c => {
                const done = c.checkIn.done >= c.checkIn.total;
                return (
                  <div key={c.id} className="member">
                    <div className="row gap-10"><Avatar initials={c.initials} color={c.color} /><span><span className="t-strong block">{c.name}</span><span className="t-caption c-muted block">{c.role}</span></span></div>
                    <span className={`row gap-6 t-body-sm ${done ? 'c-nominal' : 'c-secondary'}`}><Icon name={done ? 'check' : 'activity'} size={16} />{done ? 'Checked in' : `${c.checkIn.done} / ${c.checkIn.total} done`}</span>
                    <span className="t-caption c-secondary">Exercise  {c.exercise.done} / {c.exercise.total} sessions</span>
                    {c.isYou
                      ? (done ? <span className="pill-btn pill-quiet t-body-sm">Done for today</span> : <button type="button" className="pill-btn pill-solid t-body-sm" onClick={openCheckIn}>Finish check-in</button>)
                      : <button type="button" className="pill-btn pill-quiet t-body-sm" onClick={() => notify(`Cheer sent to ${c.name.split(' ')[0]}`)}>Cheer</button>}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Challenges" action={<span className="c-muted">Opt-in  ·  ranked by consistency, never by health results</span>}>
            <div className="challenge-cols">
              <div className="challenge">
                <div className="between"><span className="row gap-8 t-strong"><Icon name="drop" size={18} className="c-info" />{challenges.active.name}</span><span className="soft-chip good t-caption">Joined  ·  Day {challenges.active.day} of {challenges.active.length}</span></div>
                <p className="t-caption c-muted">{challenges.active.detail}</p>
                {challenges.active.board.map((b, i) => {
                  const c = byId[b.id];
                  return (
                    <div key={b.id} className="list-row">
                      <span className="t-meta c-muted rank">{i === 0 ? 1 : 2}</span>
                      <Avatar initials={c.initials} color={c.color} size={28} />
                      <span className={`t-body-sm name ${c.isYou ? '' : 'c-secondary'}`}>{c.name}</span>
                      <span className="grow"><ProgressBar value={b.done / challenges.active.day} color={c.isYou ? 'var(--color-action-interact)' : 'var(--color-status-info)'} /></span>
                      <span className="t-caption c-secondary">{b.done} / {challenges.active.day} days</span>
                    </div>
                  );
                })}
              </div>
              <div className="open-challenges">
                <span className="t-overline c-muted">Open to join</span>
                {challenges.open.map(o => (
                  <div key={o.name} className="list-row">
                    <Icon name={o.icon} size={18} className="c-secondary" />
                    <span className="grow"><span className="t-body-sm block">{o.name}</span><span className="t-caption c-muted block">{o.detail}</span></span>
                    <button type="button" className={`pill-btn t-meta ${o.joined ? 'pill-on' : ''}`} onClick={() => toggleChallenge(o.name)}>{o.joined ? 'Joined' : 'Join'}</button>
                  </div>
                ))}
                <button type="button" className="list-row link-row t-body-sm c-action" onClick={() => notify('Creating challenges isn’t part of this demo')}><Icon name="plus" size={16} />Create a challenge</button>
              </div>
            </div>
          </Card>
        </>
      }
      side={
        <>
          <Card title="What your crew sees" className="list-card">
            <p className="t-body-sm c-secondary sub">Your health data stays private to you.</p>
            {data.sharing.map(s => (
              <div key={s.label} className="list-row">
                <Icon name={s.shared ? 'eye' : 'eyeoff'} size={18} className={s.shared ? 'c-secondary' : 'c-muted'} />
                <span className="t-body-sm grow">{s.label}</span>
                <span className={`t-caption ${s.shared ? 'c-secondary' : 'c-nominal'}`}>{s.shared ? 'Shared' : 'Private'}</span>
              </div>
            ))}
            <label className="list-row toggle-row">
              <span className="t-body-sm grow">Show me on challenge boards</span>
              <input type="checkbox" className="switch" checked={data.showOnBoards} onChange={e => setShowOnBoards(e.target.checked)} />
            </label>
          </Card>
          <Card title="Crew activity" action={<span className="c-muted">Today</span>} className="list-card">
            {data.crewActivity.map((a, i) => {
              const c = byId[a.who];
              return (
                <div key={i} className="list-row top">
                  <Avatar initials={c.initials} color={c.color} size={28} />
                  <span className="grow stack-4">
                    <span className="t-body-sm">{a.text}</span>
                    <span className="row gap-12 t-caption"><span className="c-muted">{a.when}</span>
                      {a.cheer && <button type="button" className={`text-btn ${a.cheered ? 'c-nominal' : 'c-action'}`} onClick={() => cheer(i)}>{a.cheered ? 'Cheered ✓' : 'Cheer'}</button>}
                    </span>
                  </span>
                </div>
              );
            })}
          </Card>
        </>
      }
    />
  );
}
