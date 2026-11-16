import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusTag } from './ui';
import { fmt, latest, latestLabel, statusOf, statusWord, type Status } from '../data/store';
import type { Metric } from '../data/mockData';

const CX = 415, CY = 228, R = 140;

/** Value shown on the radar: the latest reading, so a manual log shows up right away. */
export function radarValue(m: Metric) {
  return latest(m);
}

/**
 * Where a value sits on its axis (0 = center, 1 = outer ring).
 * The healthy range fills the band between 25% and 75%. Values outside it keep
 * moving toward the center or the edge but never pile up on one spot.
 */
export function metricRadius(m: Metric, v = radarValue(m)) {
  const { low, high } = m.range;
  const width = high - low;
  if (v < low) return 0.25 / (1 + (low - v) / width);
  if (v > high) return 1 - 0.25 / (1 + (v - high) / width);
  return 0.25 + ((v - low) / width) * 0.5;
}

export function radarLabel(m: Metric) {
  if (m.id === 'bloodPressure') return latestLabel(m);
  const v = radarValue(m);
  const signed = m.id === 'bodyMass' || m.id === 'boneDensity';
  const num = signed ? `${v < 0 ? '−' : v > 0 ? '+' : ''}${fmt(Math.abs(v), m.decimals)}` : fmt(v, m.decimals);
  return m.unit.startsWith('%') ? `${num}${m.unit}` : `${num} ${m.unit}`;
}

export interface RadarAxis {
  key: string;
  name: string;
  detail: string;
  status: Status;
  /** 0 = center, 1 = outer ring. */
  value: number;
  to: string;
}

/** Turns a metric into an axis. Its healthy range sits between the 25% and 75% rings: inside = low, outside = high. */
export function metricAxis(m: Metric): RadarAxis {
  const status = statusOf(m, radarValue(m));
  return {
    key: m.id, name: m.name, status,
    value: Math.max(0.04, Math.min(0.97, metricRadius(m))),
    detail: status === 'good' ? radarLabel(m) : `${radarLabel(m)} · ${statusWord(status).toLowerCase()}`,
    to: `/health/${m.area}/${m.id}`,
  };
}

interface Props {
  axes: RadarAxis[];
  /** Shaded healthy band, as fractions of the outer ring. */
  band: [number, number];
  /** Optional dashed target ring. */
  target?: number;
  label: string;
}

/** Eases axis values to their new positions so changes after a log are easy to spot. */
function useTweened(target: number[]) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const key = target.map(v => v.toFixed(4)).join('|');
  useEffect(() => {
    const start = performance.now();
    const a = from.current.length === target.length ? from.current : target;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 500);
      const e = 1 - (1 - k) ** 3;
      const cur = target.map((v, i) => a[i] + (v - a[i]) * e);
      from.current = cur;
      setShown(cur);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return shown;
}

export default function Radar({ axes, band, target, label }: Props) {
  const navigate = useNavigate();
  const values = useTweened(axes.map(a => a.value));
  const n = axes.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const at = (i: number, r: number) => [CX + Math.cos(angle(i)) * r * R, CY + Math.sin(angle(i)) * r * R] as const;
  const ring = (r: number) => axes.map((_, i) => at(i, r).join(',')).join(' ');
  const pts = axes.map((a, i) => ({ a, xy: at(i, values[i] ?? a.value) }));

  return (
    <div className="radar">
      <svg viewBox="0 0 830 440" width="830" height="440" role="img" aria-label={label}>
        <polygon points={ring(band[1])} fill="var(--color-chart-baseline-band)" fillOpacity=".55" />
        <polygon points={ring(band[0])} fill="var(--color-bg-surface)" stroke="var(--color-chart-reference)" strokeWidth="1" />
        <polygon points={ring(band[1])} fill="none" stroke="var(--color-chart-reference)" strokeWidth="1" />
        <polygon points={ring(1)} fill="none" stroke="var(--color-chart-grid)" strokeWidth="1" />
        {target !== undefined && <polygon points={ring(target)} fill="none" stroke="var(--color-chart-reference)" strokeWidth="1" strokeDasharray="2 4" />}
        {axes.map((_, i) => { const [x, y] = at(i, 1); return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--color-chart-grid)" strokeWidth="1" />; })}
        <polygon points={pts.map(p => p.xy.join(',')).join(' ')} fill="var(--color-chart-series-1)" fillOpacity=".15" stroke="var(--color-chart-series-1)" strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map(p => (
          <circle key={p.a.key} cx={p.xy[0]} cy={p.xy[1]} r="6" className="radar-point" onClick={() => navigate(p.a.to)}
            fill={p.a.status === 'good' ? 'var(--color-chart-series-1)' : 'var(--color-status-caution)'} stroke="var(--color-bg-surface)" strokeWidth="2.5" />
        ))}
      </svg>
      {axes.map((a, i) => {
        // Place each label just outside the outer ring, anchored away from the center.
        const c = Math.cos(angle(i)), s = Math.sin(angle(i));
        const tx = c > 0.3 ? '0%' : c < -0.3 ? '-100%' : '-50%';
        const ty = s < -0.3 ? '-100%' : s > 0.3 ? '0%' : '-50%';
        const gap = 16;
        return (
          <button key={a.key} type="button" className="axis" onClick={() => navigate(a.to)}
            style={{ left: `calc(50% + ${c * (R + gap)}px)`, top: CY + s * (R + gap), transform: `translate(${tx}, ${ty})` }}>
            <span className="t-strong">{a.name}</span>
            <StatusTag small status={a.status} label={a.detail} />
          </button>
        );
      })}
    </div>
  );
}
