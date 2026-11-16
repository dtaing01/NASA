import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AREAS, CHECK_IN_ORDER, initialData, type AppData, type AreaId, type Metric, type MetricId } from './mockData';

const STORAGE_KEY = 'starpulse-demo-data';

export type Status = 'good' | 'low' | 'high';

/* ------------------------------------------------------------------ pure helpers */

export function fmt(v: number, decimals = 0) {
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** The value shown as "today / latest" for a metric. */
export function latest(m: Metric): number {
  if (m.id === 'exercise') return m.weekly[m.weekly.length - 1];
  if (m.id === 'bloodPressure') return m.entries[0]?.value ?? m.daily[m.daily.length - 1];
  return m.daily[m.daily.length - 1];
}

export function latestLabel(m: Metric): string {
  if (m.id === 'bloodPressure') { const e = m.entries[0]; return `${e.value}/${e.value2}`; }
  return fmt(latest(m), m.decimals);
}

export function statusOf(m: Metric, v = latest(m)): Status {
  const { low, high } = m.range;
  if (m.good === 'higher') return v < low ? 'low' : 'good';
  if (m.good === 'lower') return v > high ? 'high' : 'good';
  return v < low ? 'low' : v > high ? 'high' : 'good';
}

export const statusWord = (s: Status, m?: Metric) =>
  s === 'good' ? 'Good' : m?.id === 'hydration' && s === 'low' ? 'Behind' : s === 'low' ? 'Low' : 'High';

/**
 * Metric score out of 100: 100 inside its healthy range, dropping the further
 * outside it the reading is (down to 50 at one range-width away).
 */
export function metricScore(m: Metric, v = latest(m)) {
  const { low, high } = m.range;
  const dist = v < low ? low - v : v > high ? v - high : 0;
  return 100 - 50 * Math.min(1, dist / (high - low));
}

/**
 * Area score out of 100, used by the overview radar and the Area dropdown.
 * Radar areas average their metric scores. List areas lose 15 per caution item.
 */
export function areaScore(data: AppData, id: AreaId): { score: number; off: number; total: number } {
  const area = AREAS.find(a => a.id === id)!;
  if (area.view === 'radar') {
    const ms = area.metrics.map(m => data.metrics[m]);
    const off = ms.filter(m => statusOf(m) !== 'good').length;
    return { score: Math.round(average(ms.map(m => metricScore(m)))), off, total: ms.length };
  }
  const rows = id === 'vision' ? data.vision : data.radiation.rows;
  const off = rows.filter(r => r.status !== 'nominal').length;
  return { score: 100 - off * 15, off, total: rows.length };
}

export const SCORE_HEALTHY = 80;

/**
 * One value per mission day (day 1 → today). The mock data only stores 20 weekly
 * averages plus the last 30 days, so earlier days are filled in from the weekly
 * averages with a small, fixed wobble. The last 30 days are the real stored values.
 */
export function missionDaily(m: Metric, today: number): number[] {
  const out: number[] = [];
  const f = 10 ** m.decimals;
  // Exercise is stored as hours per week; its daily values are hours per day.
  const scale = m.id === 'exercise' ? 1 / 7 : 1;
  const spread = (m.range.high - m.range.low) * 0.12 * scale;
  for (let d = 1; d <= today; d++) {
    const w = Math.min(m.weekly.length - 1, Math.floor((d - 1) / 7));
    const x = Math.sin(d * 12.9898 + m.id.length * 78.233) * 43758.5453;
    out.push(Math.round((m.weekly[w] * scale + (x - Math.floor(x) - 0.5) * 2 * spread) * f) / f);
  }
  return [...out.slice(0, today - m.daily.length), ...m.daily];
}

export function average(xs: number[]) { return xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length); }

/* ------------------------------------------------------------------ store */

interface Toast { id: number; text: string }

interface StoreValue {
  data: AppData;
  toast: Toast | null;
  /** Save a reading. Returns the points earned (logging + any check-in bonus). */
  logMetric: (id: MetricId, values: Record<string, number | string>) => number;
  redeem: (name: string, cost: number) => void;
  toggleChallenge: (name: string) => void;
  cheer: (index: number) => void;
  setShowOnBoards: (on: boolean) => void;
  reset: () => void;
  notify: (text: string) => void;
  pendingCheckIn: MetricId[];
}

const StoreContext = createContext<StoreValue | null>(null);

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed.version === initialData.version) return parsed;
    }
  } catch { /* storage unavailable: fall back to the mock data */ }
  return structuredClone(initialData);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(load);
  const [toast, setToast] = useState<Toast | null>(null);
  // Keep the latest data in a ref so actions can compute results synchronously.
  const ref = useRef(data);
  const setData = useCallback((next: AppData | ((prev: AppData) => AppData)) => {
    const value = typeof next === 'function' ? next(ref.current) : next;
    ref.current = value;
    setDataState(value);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, [data]);

  const notify = useCallback((text: string) => {
    const id = Date.now();
    setToast({ id, text });
    window.setTimeout(() => setToast(t => (t?.id === id ? null : t)), 2800);
  }, []);

  const logMetric = useCallback((id: MetricId, values: Record<string, number | string>) => {
    let earned = 0;
    setData(prev => {
      const d: AppData = structuredClone(prev);
      const m = d.metrics[id];
      const day = d.astronaut.missionDay;
      const last = m.daily.length - 1;
      const v = Number(values.value);
      const time = nowTime();

      if (id === 'hydration') {
        const litres = v / 1000;
        m.daily[last] = Math.round((m.daily[last] + litres) * 100) / 100;
        m.entries.unshift({ day, time, source: 'Manual', value: litres });
      } else if (id === 'exercise') {
        const hours = v / 60;
        m.daily[last] = Math.round((m.daily[last] + hours) * 10) / 10;
        m.weekly[m.weekly.length - 1] = Math.round((m.weekly[m.weekly.length - 1] + hours) * 10) / 10;
        m.entries.unshift({ day, time: String(values.type ?? 'Session'), source: 'Manual', value: v });
      } else {
        m.daily[last] = v;
        m.entries = m.entries.filter(e => !(e.day === day && e.source === 'Auto'));
        m.entries.unshift({ day, time, source: 'Manual', value: v, value2: values.value2 !== undefined ? Number(values.value2) : undefined });
        const wk = m.weekly.length - 1;
        m.weekly[wk] = Math.round(((m.weekly[wk] * 6 + v) / 7) * 10 ** m.decimals) / 10 ** m.decimals;
      }
      m.entries = m.entries.slice(0, 8);

      earned += d.rules.perLog;
      d.points += d.rules.perLog;
      d.pointsThisWeek += d.rules.perLog;
      d.recentPoints.unshift({ label: `${m.name} logged`, when: time, points: d.rules.perLog });

      if (m.inCheckIn && !d.checkIn.done.includes(id)) {
        d.checkIn.done.push(id);
        const you = d.crew.find(c => c.isYou);
        if (you) you.checkIn.done = d.checkIn.done.length;
        if (!d.checkIn.completedToday && CHECK_IN_ORDER.every(c => d.checkIn.done.includes(c))) {
          d.checkIn.completedToday = true;
          earned += d.rules.checkIn;
          d.points += d.rules.checkIn;
          d.pointsThisWeek += d.rules.checkIn;
          d.recentPoints.unshift({ label: 'Daily check-in complete', when: time, points: d.rules.checkIn });
          d.streak.current += 1;
          d.streak.best = Math.max(d.streak.best, d.streak.current);
          d.streak.week[d.streak.todayIndex] = true;
        }
      }
      d.recentPoints = d.recentPoints.slice(0, 6);
      return d;
    });
    return earned;
  }, [setData]);

  const redeem = useCallback((name: string, cost: number) => {
    setData(prev => {
      if (prev.points < cost) return prev;
      const d = structuredClone(prev);
      d.points -= cost;
      d.recentPoints.unshift({ label: `Redeemed: ${name}`, when: nowTime(), points: -cost });
      d.recentPoints = d.recentPoints.slice(0, 6);
      return d;
    });
    notify(`Redeemed “${name}” · −${fmt(cost)} pts`);
  }, [notify, setData]);

  const toggleChallenge = useCallback((name: string) => {
    setData(prev => {
      const d = structuredClone(prev);
      const c = d.challenges.open.find(o => o.name === name);
      if (c) c.joined = !c.joined;
      return d;
    });
  }, [setData]);

  const cheer = useCallback((index: number) => {
    setData(prev => {
      const d = structuredClone(prev);
      d.crewActivity[index].cheered = !d.crewActivity[index].cheered;
      return d;
    });
  }, [setData]);

  const setShowOnBoards = useCallback((on: boolean) => setData(prev => ({ ...prev, showOnBoards: on })), [setData]);

  const reset = useCallback(() => {
    setData(structuredClone(initialData));
    notify('Demo data reset');
  }, [notify, setData]);

  const pendingCheckIn = useMemo(() => CHECK_IN_ORDER.filter(id => !data.checkIn.done.includes(id)), [data.checkIn.done]);

  const value = useMemo(
    () => ({ data, toast, logMetric, redeem, toggleChallenge, cheer, setShowOnBoards, reset, notify, pendingCheckIn }),
    [data, toast, logMetric, redeem, toggleChallenge, cheer, setShowOnBoards, reset, notify, pendingCheckIn],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
