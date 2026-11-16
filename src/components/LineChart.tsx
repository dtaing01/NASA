import { useState } from 'react';
import { fmt } from '../data/store';

const W = 830, H = 300, L = 34, RGT = 830, T = 10, B = 260;

function niceTicks(min: number, max: number) {
  const span = max - min || 1;
  const raw = span / 3;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= raw) ?? raw;
  const lo = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = lo; ticks.length < 8 && v < max + step - 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return ticks;
}

export interface ChartProps {
  values: (number | null)[]; // null = no reading that day; the line joins the readings either side
  labels: string[];           // one per value
  band?: { low: number; high: number };
  baseline?: number;
  decimals: number;
  unit: string;
  tipLabel: string;           // e.g. "This week"
  tipValue?: string;          // override for the last point (blood pressure)
  domain?: [number, number];  // fixed y-axis, e.g. [1, 5] for 1–5 scales
}

export default function LineChart({ values: raw, labels, band, baseline, decimals, unit, tipLabel, tipValue, domain }: ChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  // Indexes that have a reading. Hover and the 'now' dot only land on these.
  const has = raw.map((v, i) => (v === null ? -1 : i)).filter(i => i >= 0);
  const values = raw.map(v => v ?? 0);
  const core = [...has.map(i => values[i]), ...(baseline !== undefined ? [baseline] : [])];
  const cMin = Math.min(...core), cMax = Math.max(...core), reach = Math.max(cMax - cMin, Math.abs(cMax) * 0.05, 0.5);
  // Only stretch the axis to a band edge when that edge is close to the data.
  const all = [...core, ...(band ? [band.low, band.high].filter(e => e >= cMin - reach && e <= cMax + reach) : [])];
  const pad = (Math.max(...all) - Math.min(...all)) * 0.12 || 1;
  const floor = Math.min(...all) >= 0 ? 0 : -Infinity; // don't show negative gridlines for values that can't go below 0
  const ticks = domain
    ? Array.from({ length: domain[1] - domain[0] + 1 }, (_, i) => domain[0] + i)
    : niceTicks(Math.max(floor, Math.min(...all) - pad * 0.3), Math.max(...all) + pad * 0.3);
  const lo = ticks[0], hi = ticks[ticks.length - 1];
  const y = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T);
  const x = (i: number) => L + 8 + (i / Math.max(1, values.length - 1)) * (RGT - L - 16);
  const clamp = (v: number) => Math.max(lo, Math.min(hi, v));
  const path = has.map((i, k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)},${y(values[i]).toFixed(1)}`).join(' ');
  const last = values.length - 1;
  const lastReading = has[has.length - 1] ?? last;
  const nearest = (i: number) => has.reduce((best, h) => (Math.abs(h - i) < Math.abs(best - i) ? h : best), lastReading);
  const active = hover ?? lastReading;
  const tickDecimals = ticks.some(t => t % 1 !== 0) ? 1 : 0;
  const xLabels = values.length <= 8 ? values.map((_, i) => i) : [0, Math.round(last * 0.21), Math.round(last * 0.47), Math.round(last * 0.74), last];
  const tipText = active === lastReading && tipValue ? tipValue : `${fmt(values[active], decimals)} ${unit.length <= 3 ? unit : ''}`.trim();
  const tipSub = active === last ? tipLabel : labels[active];
  // Size the box to its text, center it on the point, and keep it inside the chart.
  const tipW = Math.max(92, Math.max(tipText.length * 9.5, tipSub.length * 7) + 22);
  const tipH = 52;
  const px = x(active), py = y(values[active]);
  const tipX = Math.max(0, Math.min(W - tipW, px - tipW / 2));
  const above = py - tipH - 14;
  const tipY = above >= 0 ? above : Math.min(B - tipH, py + 14);

  return (
    <svg className="linechart" viewBox={`0 0 ${W} ${H}`} overflow="visible" role="img" aria-label="Trend chart"
      onMouseLeave={() => setHover(null)}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * W;
        const i = Math.round(((px - L - 8) / (RGT - L - 16)) * last);
        setHover(nearest(Math.max(0, Math.min(last, i))));
      }}>
      <defs><filter id="tip-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity=".45" /></filter></defs>
      {band && <rect x={L} y={y(clamp(band.high))} width={RGT - L} height={Math.max(0, y(clamp(band.low)) - y(clamp(band.high)))} fill="var(--color-chart-baseline-band)" />}
      {ticks.map(t => (
        <g key={t}>
          <line x1={L} x2={RGT} y1={y(t)} y2={y(t)} stroke="var(--color-chart-grid)" strokeWidth="1" />
          <text x="0" y={y(t) + 4} className="chart-text">{fmt(t, tickDecimals)}</text>
        </g>
      ))}
      {baseline !== undefined && <line x1={L} x2={RGT} y1={y(baseline)} y2={y(baseline)} stroke="var(--color-chart-reference)" strokeWidth="1.5" strokeDasharray="6 5" />}
      <path d={path} fill="none" stroke="var(--color-chart-series-1)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {has.length < raw.length && has.map(i => <circle key={i} cx={x(i)} cy={y(values[i])} r="3.5" fill="var(--color-chart-series-1)" />)}
      {hover !== null && <line x1={x(active)} x2={x(active)} y1={T} y2={B} stroke="var(--color-border-strong)" strokeWidth="1" strokeDasharray="3 3" />}
      <circle cx={x(active)} cy={y(values[active])} r="6" fill="var(--color-chart-series-1)" stroke="var(--color-bg-surface)" strokeWidth="3" />
      <g transform={`translate(${tipX},${tipY})`}>
        <rect width={tipW} height={tipH} rx="8" fill="var(--color-bg-canvas)" stroke="var(--color-border-strong)" strokeWidth="1" filter="url(#tip-shadow)" />
        <text x="11" y="23" className="chart-tip">{tipText}</text>
        <text x="11" y="41" className="chart-text chart-text-2">{tipSub}</text>
      </g>
      {xLabels.map((i, k) => (
        <text key={i} x={k === xLabels.length - 1 ? RGT : k === 0 ? L + 2 : x(i)} y="286" className="chart-text" textAnchor={k === xLabels.length - 1 ? 'end' : k === 0 ? 'start' : 'middle'}>{labels[i]}</text>
      ))}
    </svg>
  );
}
