import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs, Button, Card, PageShell } from '../components/ui';
import { useStore } from '../data/store';
import type { Alert } from '../data/mockData';

const SETTINGS = [['Health alerts', 'Banner + sound'], ['Environment', 'Banner + sound'], ['Mission updates', 'Banner only'], ['Quiet hours', '22:00–06:00']];
const GROUPS: Alert['group'][] = ['Needs attention', 'Today', 'Earlier'];
type Filter = 'All' | Alert['category'];

export default function Alerts() {
  const { data, notify } = useStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('All');
  const shown = data.alerts.filter(a => filter === 'All' || a.category === filter);
  const count = (f: Filter) => data.alerts.filter(a => f === 'All' || a.category === f).length;
  const attention = data.alerts.filter(a => a.group === 'Needs attention').length;

  return (
    <PageShell
      main={
        <>
          <Breadcrumbs items={[{ label: 'Health tracking', to: '/health/behavioral' }, { label: 'Alerts' }]} />
          <header className="stack-4">
            <h1 className="t-h2">Alerts</h1>
            <p className="t-body-sm c-secondary">{attention} need attention  ·  the flight surgeon sees warnings automatically</p>
          </header>
          <div className="chips">
            {(['All', 'Health', 'Environment', 'Mission'] as Filter[]).map(f => (
              <button key={f} type="button" aria-pressed={filter === f} className={`chip t-body-sm ${filter === f ? 'chip-on' : ''}`} onClick={() => setFilter(f)}>{f}  {count(f)}</button>
            ))}
          </div>
          {GROUPS.map(group => {
            const items = shown.filter(a => a.group === group);
            if (!items.length) return null;
            return (
              <Card key={group} title={group} className="list-card">
                {items.map(a => (
                  <div key={a.id} className="list-row top alert-full">
                    <span className={`sev sev-${a.severity}`}><i /></span>
                    <div className="grow stack-4">
                      <div className="row gap-10 wrap"><span className={`t-strong ${a.severity === 'resolved' ? 'c-secondary' : ''}`}>{a.title}</span><span className="tagchip t-caption c-secondary">{a.category}</span></div>
                      <p className="t-body-sm c-secondary">{a.detail}</p>
                      {a.actions && (
                        <div className="row gap-8 actions wrap">
                          {a.actions.map(act => (
                            <Button key={act.label} kind={act.kind} onClick={() => (act.to ? navigate(act.to) : notify('Message sent to the flight surgeon (demo)'))}>{act.label}</Button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="t-caption c-muted">{a.time}</span>
                  </div>
                ))}
              </Card>
            );
          })}
        </>
      }
      side={
        <Card title="Alert settings" className="list-card">
          {SETTINGS.map(([a, b]) => <div key={a} className="list-row"><span className="t-body-sm grow">{a}</span><span className="t-body-sm c-secondary">{b}</span></div>)}
          <p className="note t-caption c-secondary">Warnings (red) always alert, even in quiet hours, and go to the flight surgeon.</p>
        </Card>
      }
    />
  );
}
