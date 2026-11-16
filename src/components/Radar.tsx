import { useNavigate } from 'react-router-dom';
import { StatusTag } from './ui';
import { fmt, latest, latestLabel, statusOf, statusWord, type Status } from '../data/store';
import type { Metric } from '../data/mockData';

const CX = 415, CY = 228, R = 140;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;

/** Value shown on the radar: weekly average for sleep, latest reading otherwise. */
export function radarValue(m: Metric) {
  return m.id === 'sleep' ? m.weekly[m.weekly.length - 1] : latest(m);
}

export function radarLabel(m: Metric) {
  if (m.id === 'bloodPressure') return latestLabel(m);
  const v = radarValue(m);
  const signed = m.id === 'bodyMass' || m.id === 'boneDensity';
  const num = signed ? `${v < 0 ? '−' : v > 0 ? '+' : ''}${fmt(Math.abs(v), m.decimals)}` : fmt(v, m.decimals);
  return m.unit.startsWith('%') ? `${num}${m.unit}` : `${num} ${m.unit}`;
}

/** Healthy range maps to the band between the 25% and 75% rings. Inside = low, outside = high. */
function radius(m: Metric) {
  const { low, high } = m.range;
  const r = 35 + ((radarValue(m) - low) / (high - low)) * 70;
  return Math.max(10, Math.min(R - 6, r));
}

const diamond = (r: number) => `${CX},${CY - r} ${CX + r},${CY} ${CX},${CY + r} ${CX - r},${CY}`;

export default function Radar({ metrics }: { metrics: Metric[] }) {
  const navigate = useNavigate();
  const pts = metrics.map((m, i) => ({ m, x: CX + DIRS[i][0] * radius(m), y: CY + DIRS[i][1] * radius(m), status: statusOf(m, radarValue(m)) as Status }));
  const go = (m: Metric) => navigate(`/health/${m.area}/${m.id}`);
  const labelPos = [
    { left: '50%', top: 8, transform: 'translateX(-50%)' },
    { left: 'calc(50% + 156px)', top: 196 },
    { left: '50%', top: 376, transform: 'translateX(-50%)' },
    { right: 'calc(50% + 156px)', top: 196 },
  ] as const;

  return (
    <div className="radar">
      <svg viewBox="0 0 830 440" width="830" height="440" role="img" aria-label="Radar chart of this area’s metrics against their healthy ranges">
        <polygon points={diamond(105)} fill="var(--color-chart-baseline-band)" fillOpacity=".55" />
        <polygon points={diamond(35)} fill="var(--color-bg-surface)" stroke="var(--color-chart-reference)" strokeWidth="1" />
        <polygon points={diamond(105)} fill="none" stroke="var(--color-chart-reference)" strokeWidth="1" />
        <polygon points={diamond(R)} fill="none" stroke="var(--color-chart-grid)" strokeWidth="1" />
        <polygon points={diamond(70)} fill="none" stroke="var(--color-chart-reference)" strokeWidth="1" strokeDasharray="2 4" />
        {DIRS.map(([dx, dy], i) => <line key={i} x1={CX} y1={CY} x2={CX + dx * R} y2={CY + dy * R} stroke="var(--color-chart-grid)" strokeWidth="1" />)}
        <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="var(--color-chart-series-1)" fillOpacity=".15" stroke="var(--color-chart-series-1)" strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map(p => (
          <circle key={p.m.id} cx={p.x} cy={p.y} r="6" className="radar-point" onClick={() => go(p.m)}
            fill={p.status === 'good' ? 'var(--color-chart-series-1)' : 'var(--color-status-caution)'} stroke="var(--color-bg-surface)" strokeWidth="2.5" />
        ))}
      </svg>
      {pts.map((p, i) => (
        <button key={p.m.id} type="button" className="axis" style={labelPos[i]} onClick={() => go(p.m)}>
          <span className="t-strong">{p.m.name}</span>
          <StatusTag small status={p.status} label={p.status === 'good' ? radarLabel(p.m) : `${radarLabel(p.m)} · ${statusWord(p.status).toLowerCase()}`} />
        </button>
      ))}
    </div>
  );
}
