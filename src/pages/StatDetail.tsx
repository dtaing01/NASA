import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import LineChart from '../components/LineChart';
import LogForm from '../components/LogForm';
import { Breadcrumbs, Card, PageShell, StatusTag } from '../components/ui';
import { average, fmt, latestLabel, statusOf, statusWord, useStore } from '../data/store';
import { AREAS, dayLabel, type Entry, type Metric, type MetricId } from '../data/mockData';

type Range = '7 days' | '30 days' | 'Mission';
type Grain = 'Daily' | 'Weekly avg';

const weekday = (d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][((d - 142) % 7 + 7) % 7];

function entryValue(m: Metric, e: Entry) {
  if (m.id === 'bloodPressure') return `${e.value}/${e.value2}`;
  if (m.id === 'hydration') return `+${Math.round(e.value * 1000)} ml`;
  if (m.id === 'exercise') return `${e.value} min`;
  return `${fmt(e.value, m.decimals)} ${m.unit}`;
}

function entryStatus(m: Metric, e: Entry) {
  if (m.id === 'hydration' || m.id === 'exercise') return 'good';
  return statusOf(m, e.value);
}

export default function StatDetail() {
  const { area: areaId, metric: metricId } = useParams();
  const { data } = useStore();
  const [range, setRange] = useState<Range>('Mission');
  const metric = data.metrics[metricId as MetricId];
  const area = AREAS.find(a => a.id === areaId);
  if (!metric || !area || metric.area !== area.id) return <Navigate to="/health/overview" replace />;

  const m = metric;
  const status = statusOf(m);
  const bp = m.id === 'bloodPressure';
  const day = data.astronaut.missionDay;
  // 7 and 30 days show each day; Mission shows weekly averages so 142 days stay readable.
  const grain: Grain = range === 'Mission' ? 'Weekly avg' : 'Daily';
  const weeksShown = range === 'Mission' ? m.weekly.length : 5;
  const daysShown = range === 'Mission' ? day : range === '30 days' ? 30 : 7;
  const series = grain === 'Weekly avg' ? m.weekly.slice(-weeksShown) : m.daily.slice(-daysShown);
  const labels = grain === 'Weekly avg'
    ? series.map((_, i) => `W${m.weekly.length - weeksShown + i + 1}`)
    : series.map((_, i) => { const d = day - (series.length - 1 - i); return d === day ? 'Today' : range === '7 days' ? weekday(d) : `Day ${d}`; });
  const perDay = m.id === 'exercise' && grain === 'Daily';
  const chartBand = perDay ? { low: m.range.low / 7, high: m.range.high / 7 } : m.range;
  const chartBaseline = perDay ? m.preflight / 7 : m.preflight;
  const baseTitle = m.id === 'exercise' ? (perDay ? 'Hours per day' : 'Hours per week') : m.chartTitle.replace(/ · weekly average$/, '');
  const rangeWords = range === 'Mission' ? 'whole mission' : `last ${range}`;
  const chartTitle = m.id === 'exercise' ? `${baseTitle} · ${rangeWords}` : `${baseTitle} · ${grain === 'Weekly avg' ? 'weekly average' : 'daily'} · ${rangeWords}`;
  const missionAvg = average(m.weekly);
  const delta = missionAvg - m.preflight;
  const first = m.entries[0];
  const dailyMetric = m.id === 'exercise';
  const preLabel = bp ? `${m.preflight}/${m.preflight2}` : fmt(m.preflight, m.decimals);
  const signed = m.id === 'bodyMass' || m.id === 'boneDensity';

  const tiles = [
    { label: dailyMetric ? 'This week' : bp ? 'Last reading' : first?.day === day || !first ? 'Today' : 'Latest',
      value: latestLabel(m), unit: m.unit,
      note: bp && first ? (first.day === day ? `Today ${first.time}` : `${day - first.day} days ago`) : status === 'good' ? (m.syncedFrom ? `Synced ${first?.time ?? ''}` : 'In range') : `${statusWord(status, m)} vs ${m.range.kind === 'Earth' ? 'Earth range' : m.range.kind === 'Target' ? 'target' : 'your usual'}`,
      cls: status === 'good' ? 'c-muted' : 'c-caution' },
    { label: 'Mission average', value: bp ? `${fmt(missionAvg, 0)}/${fmt(average(m.entries.map(e => e.value2 ?? 80)), 0)}` : fmt(missionAvg, Math.max(1, m.decimals)), unit: m.unit,
      note: signed ? 'Across 20 weeks' : Math.abs(delta) < 0.05 ? 'Level with pre-flight' : `${delta >= 0 ? '+' : '−'}${fmt(Math.abs(delta), bp ? 0 : Math.max(1, m.decimals))} vs pre-flight`,
      cls: status !== 'good' ? 'c-caution' : 'c-muted' },
    { label: 'Pre-flight', value: preLabel, unit: m.unit, note: 'Your baseline', cls: 'c-muted' },
    { label: m.range.kind === 'Earth' ? (bp ? 'Earth normal' : 'Earth adults') : m.range.kind,
      value: bp ? '<120/80' : m.good === 'higher' && m.range.kind === 'Target' ? `${fmt(m.range.low, m.decimals)}+` : `${fmt(m.range.low, Number.isInteger(m.range.low) ? 0 : 1)}–${fmt(m.range.high, Number.isInteger(m.range.high) ? 0 : 1)}`,
      unit: m.unit, note: m.range.kind === 'Your usual' ? 'Your usual range' : 'Recommended', cls: 'c-muted' },
  ];

  return (
    <PageShell
      main={
        <>
          <Breadcrumbs items={[{ label: 'Health tracking', to: '/health/overview' }, { label: area.name, to: `/health/${area.id}` }, { label: m.name }]} />
          <div className="row gap-12">
            <Icon name={m.icon} size={28} />
            <h1 className="t-h2">{m.name}</h1>
            <StatusTag status={status} label={statusWord(status, m)} />
          </div>

          <div className="tiles">
            {tiles.map(t => (
              <div key={t.label} className="tile">
                <span className="t-caption c-secondary">{t.label}</span>
                <span className="row gap-4 baseline"><span className="t-stat-xs">{t.value}</span><span className="t-body-sm c-secondary">{t.unit}</span></span>
                <span className={`t-caption ${t.cls}`}>{t.note}</span>
              </div>
            ))}
          </div>

          <Card className="chart-card">
            <header className="between wrap">
              <h2 className="t-strong">{chartTitle}</h2>
              <div className="segmented segmented-sm" role="radiogroup" aria-label="Time range">
                {(['7 days', '30 days', 'Mission'] as Range[]).map(r => (
                  <button key={r} type="button" role="radio" aria-checked={range === r}
                    className={range === r ? 'seg-on t-strong' : 't-body-sm'} onClick={() => setRange(r)}>{r}</button>
                ))}
              </div>
            </header>
            <div className="row gap-16 t-caption c-secondary chart-legend">
                <span className="row gap-6"><i className="legend-line" />You</span>
                {!signed && <span className="row gap-6"><i className="legend-dash" />Pre-flight</span>}
                <span className="row gap-6"><i className="legend-band plain" />{perDay ? `Target ${fmt(chartBand.low, 1)}–${fmt(chartBand.high, 1)} h a day` : m.range.label}</span>
            </div>
            <LineChart key={`${range}-${grain}`} values={series} labels={labels} band={chartBand} baseline={signed ? undefined : chartBaseline}
              decimals={perDay ? 1 : grain === 'Weekly avg' && m.unit === '/ 5' ? 1 : m.decimals} unit={perDay ? 'h' : m.unit}
              domain={m.unit === '/ 5' ? [1, 5] : undefined} tipLabel={grain === 'Weekly avg' ? 'This week' : 'Today'} tipValue={bp && grain === 'Daily' ? latestLabel(m) : undefined} />
          </Card>

          <div className="suggestion">
            <i className={`dot dot-lg ${status === 'good' ? 'dot-info' : 'dot-caution'}`} />
            <span className="t-body-sm grow">{m.suggestion.text}</span>
            {m.suggestion.link && <Link to={m.suggestion.link.to} className={`t-strong ${status === 'good' ? 'c-info' : 'c-caution'}`}>{m.suggestion.link.label}</Link>}
          </div>
        </>
      }
      side={
        <>
          <LogForm metric={m} />
          <Card title={m.id === 'exercise' ? 'Recent sessions' : m.id === 'hydration' ? 'Today' : m.unit === '/ 5' ? 'Recent check-ins' : 'Recent readings'} className="list-card">
            {m.entries.slice(0, 5).map((e, i) => (
              <div key={i} className="list-row entry">
                <i className={`dot ${entryStatus(m, e) === 'good' ? 'dot-nominal' : 'dot-caution'}`} />
                <span className="t-body-sm grow">{m.id === 'hydration' ? e.time : dayLabel(e.day)}</span>
                <span className="t-caption c-muted">{m.id === 'exercise' || m.unit === '/ 5' ? e.time : e.source}</span>
                <span className="t-strong">{entryValue(m, e)}</span>
              </div>
            ))}
          </Card>
        </>
      }
    />
  );
}
