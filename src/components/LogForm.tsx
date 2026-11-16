import { useEffect, useState } from 'react';
import { Button, Card } from './ui';
import { Field, initialValues, type FormValues } from './Fields';
import { fmt, latest, useStore } from '../data/store';
import type { Metric } from '../data/mockData';

export default function LogForm({ metric }: { metric: Metric }) {
  const { data, logMetric, notify } = useStore();
  const [values, setValues] = useState<FormValues>(() => initialValues(metric));
  useEffect(() => setValues(initialValues(metric)), [metric.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (metric.form.length === 0) {
    return (
      <Card className="log-card">
        <div><h2 className="t-h4">{metric.logTitle}</h2><p className="t-caption c-secondary">{metric.logHint}</p></div>
        <p className="t-body-sm c-secondary">Nothing to log here. This value is worked out from your other data.</p>
      </Card>
    );
  }

  const save = () => {
    const earned = logMetric(metric.id, values);
    notify(`${metric.name} saved  ·  +${earned} pts`);
  };

  return (
    <Card accent className="log-card">
      <div>
        <h2 className="t-h4">{metric.logTitle}</h2>
        <p className={`t-caption ${metric.id === 'bloodPressure' ? 'c-caution' : 'c-secondary'}`}>{metric.logHint}</p>
      </div>
      {metric.form.map(f => (
        <Field key={f.key} field={f} value={values[f.key]} onChange={v => setValues(s => ({ ...s, [f.key]: v }))} />
      ))}
      {metric.id === 'hydration' && (
        <div className="field">
          <label className="t-caption c-secondary">Today’s total after adding</label>
          <div className="total-row"><span className="t-stat-xs">{fmt(latest(metric) + Number(values.value) / 1000, 2)}</span><span className="t-body-sm c-secondary">L</span></div>
        </div>
      )}
      <Button full onClick={save}>Save · +{data.rules.perLog} pts</Button>
    </Card>
  );
}
