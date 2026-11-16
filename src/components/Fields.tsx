import Icon from './Icon';
import { fmt, latest } from '../data/store';
import type { LogField, Metric } from '../data/mockData';

export type FormValues = Record<string, number | string>;

/** Starting values for a metric's log form, taken from its latest reading. */
export function initialValues(m: Metric): FormValues {
  const v: FormValues = {};
  for (const f of m.form) {
    if (f.kind === 'stepper') {
      if (m.id === 'exercise') v[f.key] = 45;
      else if (f.key === 'value2') v[f.key] = m.entries[0]?.value2 ?? 80;
      else v[f.key] = latest(m);
    } else if (f.kind === 'scale') v[f.key] = f.key === 'value' ? Math.round(latest(m)) : 3;
    else if (f.kind === 'options') v[f.key] = f.options[0];
    else v[f.key] = f.amounts[0];
  }
  return v;
}

export function Field({ field, value, onChange, large, multi }:
  { field: LogField; value: number | string; onChange: (v: number | string) => void; large?: boolean; multi?: boolean }) {
  if (field.kind === 'stepper') {
    const n = Number(value);
    const d = field.decimals ?? 0;
    const set = (x: number) => onChange(Math.round(Math.min(field.max, Math.max(field.min, x)) * 10 ** d) / 10 ** d);
    return (
      <div className="field">
        <label className="t-caption c-secondary">{field.label}</label>
        <div className="stepper">
          <button type="button" onClick={() => set(n - field.step)} aria-label={`Decrease ${field.label}`}><Icon name="minus" /></button>
          <span className="stepper-value"><span className="t-stat-xs">{fmt(n, d)}</span><span className="t-body-sm c-secondary">{field.unit}</span></span>
          <button type="button" onClick={() => set(n + field.step)} aria-label={`Increase ${field.label}`}><Icon name="plus" /></button>
        </div>
      </div>
    );
  }
  if (field.kind === 'scale') {
    return (
      <div className="field">
        {!large && <label className="t-caption c-secondary">{field.label}</label>}
        <div className={`scale ${large ? 'scale-large' : ''}`} role="radiogroup" aria-label={field.label}>
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} type="button" role="radio" aria-checked={value === i} className={`opt ${value === i ? 'opt-on' : ''}`} onClick={() => onChange(i)}>
              <span className={large ? 't-h4' : value === i ? 't-strong' : 't-body-sm'}>{i}</span>
              {large && field.labels && <span className="t-caption">{field.labels[i - 1]}</span>}
            </button>
          ))}
        </div>
        {!(large && field.labels) && <div className="scale-labels t-caption c-muted"><span>{field.lowLabel}</span><span>{field.highLabel}</span></div>}
      </div>
    );
  }
  if (field.kind === 'options') {
    const selected = String(value).split('|').filter(Boolean);
    const toggle = (o: string) => {
      if (!multi) return onChange(o);
      onChange((selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o]).join('|'));
    };
    return (
      <div className="field">
        <label className={large ? 't-body-sm c-secondary' : 't-caption c-secondary'}>{field.label}</label>
        <div className={multi ? 'chips' : 'options'}>
          {field.options.map(o => {
            const on = selected.includes(o);
            return multi
              ? <button key={o} type="button" aria-pressed={on} className={`chip t-body-sm ${on ? 'chip-on' : ''}`} onClick={() => toggle(o)}>{on ? '✓ ' : ''}{o}</button>
              : <button key={o} type="button" aria-pressed={on} className={`opt ${on ? 'opt-on' : ''}`} onClick={() => toggle(o)}><span className={on ? 't-strong' : 't-body-sm'}>{o}</span></button>;
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="field">
      <label className="t-caption c-secondary">{field.label}</label>
      <div className="options">
        {field.amounts.map(a => (
          <button key={a} type="button" aria-pressed={value === a} className={`opt ${value === a ? 'opt-on' : ''}`} onClick={() => onChange(a)}>
            <span className={value === a ? 't-strong' : 't-body-sm'}>+{a} {field.unit}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
