import { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import { Button } from './ui';
import { Field, initialValues, type FormValues } from './Fields';
import { fmt, latestLabel, statusOf, useStore } from '../data/store';
import { CHECK_IN_ORDER, type MetricId } from '../data/mockData';

const NEXT_BADGES = [7, 14, 21, 30, 60, 100, 200];
export const nextBadge = (streak: number) => NEXT_BADGES.find(n => n > streak) ?? streak + 100;

export default function CheckInModal({ onClose }: { onClose: () => void }) {
  const { data, pendingCheckIn, logMetric } = useStore();
  // The questions left when the modal opened. Fixed for this session so Back works.
  const steps = useMemo<MetricId[]>(() => pendingCheckIn, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const [earned, setEarned] = useState(0);
  const [answers, setAnswers] = useState<Record<string, FormValues>>({});
  const showSummary = index >= steps.length;

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);

  const id = steps[index];
  const metric = id ? data.metrics[id] : undefined;
  const values = metric ? (answers[metric.id] ?? initialValues(metric)) : {};
  const total = CHECK_IN_ORDER.length;

  if (showSummary || !metric) {
    const complete = data.checkIn.completedToday;
    const toBadge = nextBadge(data.streak.current);
    return (
      <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal modal-center" role="dialog" aria-modal="true" aria-label="Check-in summary">
          <div className={`success ${complete ? '' : 'success-pending'}`}><Icon name={complete ? 'check' : 'activity'} size={36} /></div>
          <div className="modal-heading">
            <h2 className="t-h2">{complete ? 'Check-in complete' : 'Check-in saved'}</h2>
            <p className="t-body c-secondary">
              {complete
                ? `${total} of ${total} done for Day ${data.astronaut.missionDay}. Your next check-in opens tomorrow at 07:00.`
                : `${data.checkIn.done.length} of ${total} done. Finish the rest any time today to keep your streak.`}
            </p>
          </div>
          <div className="reward-row">
            <div className="reward"><span className="t-stat-xs c-action">{earned > 0 ? `+${earned}` : fmt(data.points)}</span><span className="t-caption c-secondary">{earned > 0 ? 'points earned' : 'points'}</span></div>
            <div className="reward"><span className="t-stat-xs c-caution">{data.streak.current}</span><span className="t-caption c-secondary">day streak</span></div>
            <div className="reward"><span className="t-stat-xs">{toBadge - data.streak.current} days</span><span className="t-caption c-secondary">to {toBadge}-day badge</span></div>
          </div>
          <ul className="answers">
            {CHECK_IN_ORDER.map(mid => {
              const m = data.metrics[mid];
              const done = data.checkIn.done.includes(mid);
              const st = statusOf(m);
              return (
                <li key={mid}>
                  <i className={`dot ${!done ? 'dot-none' : st === 'good' ? 'dot-nominal' : 'dot-caution'}`} />
                  <span className="t-body-sm grow">{m.name}</span>
                  <span className="t-caption c-muted">{!done ? 'Skipped' : m.entries[0]?.source === 'Auto' ? `Auto · synced ${m.entries[0].time}` : m.entries[0]?.time}</span>
                  <span className="t-strong">{done ? `${latestLabel(m)} ${m.unit}` : '–'}</span>
                </li>
              );
            })}
          </ul>
          <Button full onClick={onClose}>Back to Health tracking</Button>
        </div>
      </div>
    );
  }

  const stepNumber = CHECK_IN_ORDER.indexOf(metric.id) + 1;
  const isLast = index === steps.length - 1;
  const save = () => {
    setEarned(e => e + logMetric(metric.id, values));
    setIndex(i => i + 1);
  };
  const willComplete = pendingCheckIn.length === 1 && pendingCheckIn[0] === metric.id;
  const yesterday = metric.daily[metric.daily.length - 2];

  return (
    <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Daily check-in">
        <div className="modal-head">
          <div>
            <div className="t-meta c-secondary">Daily check-in  ·  {stepNumber} of {total}</div>
            <h2 className="t-h3">{metric.checkInQuestion ?? metric.logTitle}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close check-in"><Icon name="close" /></button>
        </div>
        <div className="segments" aria-hidden="true">
          {CHECK_IN_ORDER.map(mid => (
            <i key={mid} className={mid === metric.id ? 'seg seg-now' : data.checkIn.done.includes(mid) ? 'seg seg-done' : 'seg'} />
          ))}
        </div>
        {metric.checkInHelp && <p className="t-body-sm c-secondary">{metric.checkInHelp}</p>}
        {metric.form.map(f => (
          <Field key={f.key} field={f} large value={values[f.key]} multi={f.kind === 'options' && metric.id === 'stress'}
            onChange={v => setAnswers(a => ({ ...a, [metric.id]: { ...values, [f.key]: v } }))} />
        ))}
        <div className="context t-caption c-secondary">
          <span>Yesterday  {yesterday === null || yesterday === undefined ? '–' : `${fmt(yesterday, metric.decimals)} ${metric.unit}`}</span><span className="c-muted">·</span>
          <span>Pre-flight baseline  {fmt(metric.preflight, metric.decimals)} {metric.unit}</span>
        </div>
        <div className="modal-foot">
          <Button kind="ghost" onClick={() => (index === 0 ? onClose() : setIndex(index - 1))}>Back</Button>
          <div className="row">
            <Button kind="ghost" onClick={() => setIndex(index + 1)}>Skip</Button>
            <Button onClick={save}>{isLast ? `Finish  ·  +${data.rules.perLog + (willComplete ? data.rules.checkIn : 0)} pts` : 'Next'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
