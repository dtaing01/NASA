/**
 * Mock data for the StarPulse demo.
 *
 * Everything the app shows comes from this file. Change a value here and the
 * screens update. The app copies this data into the browser (localStorage) the
 * first time it runs, so logging a reading or finishing the check-in survives a
 * page refresh. Use "Reset demo data" in the profile menu to start over.
 */

export type AreaId = 'behavioral' | 'cardiovascular' | 'body' | 'vision' | 'radiation';

export type MetricId =
  | 'sleep' | 'mood' | 'fatigue' | 'stress'
  | 'heartRate' | 'bloodPressure' | 'hrv' | 'spo2'
  | 'exercise' | 'bodyMass' | 'hydration' | 'boneDensity';

export type IconName =
  | 'heart' | 'star' | 'crew' | 'flame' | 'back' | 'moon' | 'minus' | 'plus' | 'pulse' | 'body'
  | 'mood' | 'drop' | 'check' | 'activity' | 'shield' | 'recover' | 'trophy' | 'gift' | 'eye'
  | 'eyeoff' | 'chevron' | 'chevronDown' | 'close' | 'lock' | 'arrowUp' | 'arrowDown' | 'bolt' | 'lungs' | 'bone';

/** "low" = higher is better (sleep), "high" = lower is better (stress), "both" = keep inside the range. */
export type GoodDirection = 'higher' | 'lower' | 'range';

export type LogField =
  | { kind: 'stepper'; key: string; label: string; unit: string; step: number; min: number; max: number; decimals?: number }
  | { kind: 'scale'; key: string; label: string; lowLabel: string; highLabel: string; labels?: string[] }
  | { kind: 'options'; key: string; label: string; options: string[] }
  | { kind: 'quickAdd'; key: string; label: string; unit: string; amounts: number[] };

export interface Entry {
  day: number;          // mission day
  time: string;         // "07:10"
  source: 'Auto' | 'Manual';
  value: number;        // primary value (systolic for blood pressure)
  value2?: number;      // diastolic for blood pressure
}

export interface Metric {
  id: MetricId;
  name: string;
  area: AreaId;
  icon: IconName;
  unit: string;         // shown after values, e.g. "h", "bpm", "/ 5"
  decimals: number;
  good: GoodDirection;
  /** Healthy range on Earth or your personal usual range. Used for the chart band and the radar. */
  range: { low: number; high: number; label: string; kind: 'Earth' | 'Your usual' | 'Target' };
  preflight: number;
  preflight2?: number;
  /** 20 weekly averages, week 1 → week 20 (this week). */
  weekly: number[];
  /** Last 30 daily values, oldest first. Today is the last item. */
  daily: number[];
  entries: Entry[];     // newest first
  chartTitle: string;
  suggestion: { text: string; link?: { label: string; to: string } };
  logTitle: string;
  logHint: string;
  form: LogField[];
  /** True when this metric is one of the 6 daily check-in questions. */
  inCheckIn: boolean;
  /** Prompt used in the check-in modal for scale questions. */
  checkInQuestion?: string;
  checkInHelp?: string;
  syncedFrom?: string;
}

export interface Alert {
  id: string;
  title: string;
  detail: string;
  category: 'Health' | 'Environment' | 'Mission';
  severity: 'caution' | 'info' | 'nominal' | 'warning' | 'resolved';
  time: string;
  group: 'Needs attention' | 'Today' | 'Earlier';
  link?: { label: string; to: string };
  actions?: { label: string; to?: string; kind: 'primary' | 'secondary' | 'ghost' }[];
}

export interface CrewMember {
  id: string;
  initials: string;
  name: string;
  role: string;
  color: string;        // CSS variable name
  checkIn: { done: number; total: number };
  exercise: { done: number; total: number };
  isYou?: boolean;
}

export interface Badge { name: string; detail: string; earned: boolean; icon: IconName; }
export interface SpendReward { name: string; cost: number; }
export interface PointsEvent { label: string; when: string; points: number; }

export interface AppData {
  version: number;
  astronaut: { initials: string; name: string; role: string; missionDay: number; dateLabel: string; expedition: string };
  points: number;
  pointsThisWeek: number;
  level: { number: number; title: string; next: string; nextAt: number };
  streak: { current: number; best: number; week: boolean[]; todayIndex: number };
  checkIn: { done: MetricId[]; completedToday: boolean };
  metrics: Record<MetricId, Metric>;
  vision: { name: string; detail: string; value: string; meta: string; status: 'nominal' | 'caution' }[];
  radiation: {
    missionDose: number; missionLimit: number; projected: number;
    rows: { name: string; detail: string; value: string; meta: string; status: 'nominal' | 'caution' }[];
  };
  alerts: Alert[];
  crew: CrewMember[];
  crewGoal: { title: string; done: number; total: number; goalPct: number; daysLeft: number; reward: string };
  challenges: {
    active: { name: string; detail: string; day: number; length: number; board: { id: string; done: number }[] };
    open: { name: string; detail: string; icon: IconName; joined: boolean }[];
  };
  crewActivity: { who: string; text: string; when: string; cheer: boolean; cheered?: boolean }[];
  sharing: { label: string; shared: boolean }[];
  showOnBoards: boolean;
  badges: Badge[];
  spend: SpendReward[];
  recentPoints: PointsEvent[];
  rules: { checkIn: number; perLog: number; recoveryDay: number; crewGoal: number };
}

/* ------------------------------------------------------------------ helpers */

/** Deterministic wobble so the series look natural but never change between reloads. */
function wobble(seed: number, i: number, amount: number) {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * amount;
}

/** A series that moves from `from` to `to` across `n` points with a little noise. */
function trend(n: number, from: number, to: number, noise: number, seed: number, decimals = 1) {
  const f = 10 ** decimals;
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 1 : i / (n - 1);
    const v = from + (to - from) * t + (i === n - 1 ? 0 : wobble(seed, i, noise));
    return Math.round(v * f) / f;
  });
}

const DAY = 142;
const dayName = (d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][((d - DAY) % 7 + 7) % 7];
export const dayLabel = (d: number) => (d === DAY ? 'Today' : d === DAY - 1 ? 'Yesterday' : dayName(d));

function entriesFrom(daily: number[], times: string[], source: Entry['source'], every = 1, endDay = DAY): Entry[] {
  const out: Entry[] = [];
  for (let i = daily.length - 1, k = 0; i >= 0 && out.length < 6; i -= every, k++) {
    out.push({ day: endDay - (daily.length - 1 - i), time: times[k % times.length], source, value: daily[i] });
  }
  return out;
}

const scale5 = (key: string, label: string, low: string, high: string, labels?: string[]): LogField =>
  ({ kind: 'scale', key, label, lowLabel: low, highLabel: high, labels });

/* ------------------------------------------------------------------ metrics */

const sleepDaily = trend(30, 6.6, 6.1, 0.35, 1);
const moodDaily = trend(30, 4.1, 4, 0.6, 2, 0).map(v => Math.min(5, Math.max(1, v)));
const fatigueDaily = trend(30, 2.4, 3, 0.6, 3, 0).map(v => Math.min(5, Math.max(1, v)));
const stressDaily = trend(30, 2.4, 2, 0.6, 4, 0).map(v => Math.min(5, Math.max(1, v)));
const hrDaily = trend(30, 59, 62, 1.6, 5, 0);
const sysDaily = trend(30, 120, 124, 1.5, 6, 0);
const hrvDaily = trend(30, 50, 48, 3, 8, 0);
const spo2Daily = trend(30, 98, 98, 0.6, 9, 0);
const exDaily = trend(30, 1.9, 0, 0.4, 10, 1).map((v, i) => (i % 7 === 6 ? 1.2 : Math.max(0, v)));
const massDaily = trend(30, -0.8, -1.2, 0.15, 11, 1);
const hydDaily = trend(30, 2.5, 1.4, 0.2, 12, 1);
const boneDaily = trend(30, -0.6, -0.8, 0.03, 13, 2);

// Make "today" match the designs exactly.
sleepDaily[29] = 6.1; moodDaily[29] = 4; hrDaily[29] = 62; exDaily[29] = 0; hydDaily[29] = 1.4;

const metrics: Record<MetricId, Metric> = {
  sleep: {
    id: 'sleep', name: 'Sleep', area: 'behavioral', icon: 'moon', unit: 'h', decimals: 1, good: 'higher',
    range: { low: 7, high: 9, label: 'Earth 7–9 h', kind: 'Earth' }, preflight: 7.3,
    weekly: trend(20, 7.1, 6.4, 0.25, 21), daily: sleepDaily,
    entries: entriesFrom(sleepDaily, ['06:30'], 'Auto'),
    chartTitle: 'Hours per night · weekly average',
    suggestion: { text: 'Try to protect an 8.5 h sleep window tonight', link: { label: 'Message flight surgeon', to: '/alerts' } },
    logTitle: 'Update last night', logHint: 'Synced 06:30 · edit if it’s off',
    form: [
      { kind: 'stepper', key: 'value', label: 'Hours slept', unit: 'h', step: 0.1, min: 0, max: 14, decimals: 1 },
      scale5('rested', 'How rested do you feel?', 'Exhausted', 'Fully rested'),
    ],
    inCheckIn: true, syncedFrom: 'wrist tracker',
  },
  mood: {
    id: 'mood', name: 'Mood', area: 'behavioral', icon: 'mood', unit: '/ 5', decimals: 0, good: 'higher',
    range: { low: 3.5, high: 4.5, label: 'Your usual 3.5–4.5', kind: 'Your usual' }, preflight: 4.2,
    weekly: trend(20, 4.3, 3.9, 0.15, 22), daily: moodDaily,
    entries: entriesFrom(moodDaily, ['07:10', '07:30', '07:05', '07:20'], 'Manual'),
    chartTitle: 'Mood · weekly average',
    suggestion: { text: 'Mood entries stay private unless you share them', link: { label: 'Privacy settings', to: '/crew' } },
    logTitle: 'Update mood', logHint: 'Logged 07:10 · private',
    form: [scale5('value', 'How are you feeling?', 'Very low', 'Great'), { kind: 'options', key: 'stress', label: 'Stress', options: ['Low', 'Medium', 'High'] }],
    inCheckIn: true, checkInQuestion: 'How are you feeling today?', checkInHelp: 'Answer for right now. This stays private to you and the flight surgeon.',
  },
  fatigue: {
    id: 'fatigue', name: 'Fatigue', area: 'behavioral', icon: 'bolt', unit: '/ 5', decimals: 0, good: 'lower',
    range: { low: 1.5, high: 2.5, label: 'Your usual 1.5–2.5', kind: 'Your usual' }, preflight: 2,
    weekly: trend(20, 2.2, 3.1, 0.2, 23), daily: fatigueDaily,
    entries: entriesFrom(fatigueDaily.slice(0, 29), ['07:15', '07:40', '07:05', '07:20'], 'Manual', 1, DAY - 1),
    chartTitle: 'Fatigue · weekly average',
    suggestion: { text: 'Fatigue has been above your usual for 2 weeks, alongside short sleep', link: { label: 'View sleep', to: '/health/behavioral/sleep' } },
    logTitle: 'Update fatigue', logHint: 'Part of today’s check-in · private',
    form: [
      scale5('value', 'How tired do you feel?', 'Fully alert', 'Exhausted', ['Fully alert', 'A bit tired', 'Tired', 'Very tired', 'Exhausted']),
      { kind: 'options', key: 'cause', label: 'Main cause', options: ['Sleep', 'Workload', 'Other'] },
    ],
    inCheckIn: true, checkInQuestion: 'How tired do you feel right now?',
    checkInHelp: 'Fatigue that builds over weeks often follows sleep debt and heavy workload. Answer for how you feel now, not how you think you should feel.',
  },
  stress: {
    id: 'stress', name: 'Stress', area: 'behavioral', icon: 'pulse', unit: '/ 5', decimals: 0, good: 'lower',
    range: { low: 1.5, high: 3, label: 'Your usual 1.5–3.0', kind: 'Your usual' }, preflight: 2,
    weekly: trend(20, 2.5, 2.3, 0.2, 24), daily: stressDaily,
    entries: entriesFrom(stressDaily.slice(0, 29), ['07:15', '07:40', '07:05', '07:20'], 'Manual', 1, DAY - 1),
    chartTitle: 'Stress · weekly average',
    suggestion: { text: 'Stress entries stay private unless you share them', link: { label: 'Privacy settings', to: '/crew' } },
    logTitle: 'Update stress', logHint: 'Part of today’s check-in · private',
    form: [
      scale5('value', 'How stressed do you feel?', 'Calm', 'Overwhelmed', ['Calm', 'A little', 'Moderate', 'High', 'Overwhelmed']),
      { kind: 'options', key: 'factor', label: 'What’s adding to it? (optional)', options: ['Workload', 'Sleep', 'Crew dynamics', 'Isolation', 'Missing home', 'Schedule changes'] },
    ],
    inCheckIn: true, checkInQuestion: 'How stressed do you feel today?',
    checkInHelp: 'Think about the whole day so far. This stays private to you and the flight surgeon unless you choose to share it.',
  },
  heartRate: {
    id: 'heartRate', name: 'Heart rate', area: 'cardiovascular', icon: 'heart', unit: 'bpm', decimals: 0, good: 'range',
    range: { low: 60, high: 100, label: 'Earth 60–100', kind: 'Earth' }, preflight: 58,
    weekly: trend(20, 58, 62, 0.8, 25, 0), daily: hrDaily,
    entries: entriesFrom(hrDaily, ['07:05'], 'Auto'),
    chartTitle: 'Resting heart rate · weekly average',
    suggestion: { text: 'Steady and within the Earth range', link: { label: 'Learn more', to: '/alerts' } },
    logTitle: 'Update heart rate', logHint: 'Synced 07:05 · from wrist tracker',
    form: [
      { kind: 'stepper', key: 'value', label: 'Resting heart rate', unit: 'bpm', step: 1, min: 30, max: 200 },
      { kind: 'options', key: 'when', label: 'When was this taken?', options: ['Waking', 'Resting', 'Active'] },
    ],
    inCheckIn: true, syncedFrom: 'wrist tracker',
  },
  bloodPressure: {
    id: 'bloodPressure', name: 'Blood pressure', area: 'cardiovascular', icon: 'pulse', unit: 'mmHg', decimals: 0, good: 'lower',
    range: { low: 90, high: 120, label: 'Earth normal', kind: 'Earth' }, preflight: 116, preflight2: 76,
    weekly: trend(20, 116, 124, 0.8, 26, 0), daily: sysDaily,
    entries: [
      { day: 139, time: '07:50', source: 'Manual', value: 124, value2: 82 },
      { day: 136, time: '07:45', source: 'Manual', value: 123, value2: 81 },
      { day: 132, time: '07:40', source: 'Manual', value: 121, value2: 80 },
      { day: 129, time: '07:55', source: 'Manual', value: 119, value2: 78 },
    ],
    chartTitle: 'Systolic pressure · weekly average',
    suggestion: { text: 'Rising for 3 weeks · re-measure today', link: { label: 'Message flight surgeon', to: '/alerts' } },
    logTitle: 'Log blood pressure', logHint: 'Due now · seated, after 5 min rest',
    form: [
      { kind: 'stepper', key: 'value', label: 'Systolic', unit: 'mmHg', step: 1, min: 70, max: 200 },
      { kind: 'stepper', key: 'value2', label: 'Diastolic', unit: 'mmHg', step: 1, min: 40, max: 130 },
      { kind: 'options', key: 'position', label: 'Position', options: ['Seated', 'Lying'] },
    ],
    inCheckIn: false,
  },
  hrv: {
    id: 'hrv', name: 'HRV', area: 'cardiovascular', icon: 'activity', unit: 'ms', decimals: 0, good: 'higher',
    range: { low: 40, high: 70, label: 'Your usual 40–70', kind: 'Your usual' }, preflight: 52,
    weekly: trend(20, 53, 48, 1.5, 27, 0), daily: hrvDaily, entries: entriesFrom(hrvDaily, ['06:30'], 'Auto'),
    chartTitle: 'Heart rate variability · weekly average',
    suggestion: { text: 'Slightly below pre-flight, still in your usual range' },
    logTitle: 'Update HRV', logHint: 'Synced 06:30 · from wrist tracker',
    form: [{ kind: 'stepper', key: 'value', label: 'HRV', unit: 'ms', step: 1, min: 10, max: 150 }],
    inCheckIn: false, syncedFrom: 'wrist tracker',
  },
  spo2: {
    id: 'spo2', name: 'SpO₂', area: 'cardiovascular', icon: 'lungs', unit: '%', decimals: 0, good: 'higher',
    range: { low: 95, high: 100, label: 'Earth 95–100%', kind: 'Earth' }, preflight: 98,
    weekly: trend(20, 98, 98, 0.4, 28, 0), daily: spo2Daily, entries: entriesFrom(spo2Daily, ['06:30'], 'Auto'),
    chartTitle: 'Blood oxygen · weekly average',
    suggestion: { text: 'Steady and within the Earth range' },
    logTitle: 'Update SpO₂', logHint: 'Synced 06:30 · from finger sensor',
    form: [{ kind: 'stepper', key: 'value', label: 'SpO₂', unit: '%', step: 1, min: 80, max: 100 }],
    inCheckIn: false, syncedFrom: 'finger sensor',
  },
  exercise: {
    id: 'exercise', name: 'Exercise', area: 'body', icon: 'body', unit: 'h / wk', decimals: 1, good: 'range',
    range: { low: 12, high: 15, label: 'Target 12–15 h', kind: 'Target' }, preflight: 13,
    weekly: trend(20, 12.6, 13.5, 0.6, 29), daily: exDaily,
    entries: [
      { day: 141, time: 'Resistance', source: 'Manual', value: 45 },
      { day: 141, time: 'Treadmill', source: 'Manual', value: 30 },
      { day: 140, time: 'Cycle', source: 'Manual', value: 30 },
      { day: 140, time: 'Resistance', source: 'Manual', value: 45 },
    ],
    chartTitle: 'Hours per week',
    suggestion: { text: 'Resistance at 14:00, treadmill at 17:30', link: { label: 'Open schedule', to: '/alerts' } },
    logTitle: 'Log a session', logHint: 'Counts toward this week’s target',
    form: [
      { kind: 'options', key: 'type', label: 'Type', options: ['Resistance', 'Treadmill', 'Cycle'] },
      { kind: 'stepper', key: 'value', label: 'Duration', unit: 'min', step: 5, min: 5, max: 180 },
    ],
    inCheckIn: false,
  },
  bodyMass: {
    id: 'bodyMass', name: 'Body mass', area: 'body', icon: 'body', unit: 'kg', decimals: 1, good: 'range',
    range: { low: -2, high: 1, label: 'Within 2 kg of pre-flight', kind: 'Target' }, preflight: 0,
    weekly: trend(20, 0, -1.2, 0.15, 30), daily: massDaily, entries: entriesFrom(massDaily, ['07:00'], 'Manual', 3),
    chartTitle: 'Change vs pre-flight · weekly average',
    suggestion: { text: 'Mass is within 2 kg of pre-flight. Keep meals on schedule.' },
    logTitle: 'Log body mass', logHint: 'Due by 20:00 GMT · mass device',
    form: [{ kind: 'stepper', key: 'value', label: 'Change vs pre-flight', unit: 'kg', step: 0.1, min: -10, max: 10, decimals: 1 }],
    inCheckIn: false,
  },
  hydration: {
    id: 'hydration', name: 'Hydration', area: 'body', icon: 'drop', unit: 'L', decimals: 1, good: 'higher',
    range: { low: 2.5, high: 3.5, label: 'Target 2.5 L+', kind: 'Target' }, preflight: 2.5,
    weekly: trend(20, 2.6, 2.4, 0.1, 31), daily: hydDaily,
    entries: [
      { day: 142, time: '12:40', source: 'Manual', value: 0.25 },
      { day: 142, time: '10:15', source: 'Manual', value: 0.5 },
      { day: 142, time: '08:30', source: 'Manual', value: 0.25 },
      { day: 142, time: '07:00', source: 'Manual', value: 0.4 },
    ],
    chartTitle: 'Litres per day',
    suggestion: { text: 'About 250 ml an hour until 18:00', link: { label: 'Set reminder', to: '/alerts' } },
    logTitle: 'Add water', logHint: 'Logged 12:40',
    form: [{ kind: 'quickAdd', key: 'value', label: 'Quick add', unit: 'ml', amounts: [250, 500, 750] }],
    inCheckIn: true,
  },
  boneDensity: {
    id: 'boneDensity', name: 'Bone density', area: 'body', icon: 'bone', unit: '% est.', decimals: 1, good: 'range',
    range: { low: -1.5, high: 0.5, label: 'Expected loss under 1.5%', kind: 'Target' }, preflight: 0,
    weekly: trend(20, 0, -0.8, 0.02, 32, 2), daily: boneDaily, entries: entriesFrom(boneDaily, ['Model'], 'Auto', 7),
    chartTitle: 'Estimated change vs pre-flight',
    suggestion: { text: 'Estimate from your exercise load. Confirmed by scan after landing.' },
    logTitle: 'Bone density', logHint: 'Estimated automatically',
    form: [], inCheckIn: false,
  },
};

// Today's check-in: Sleep, Heart rate, Mood and Hydration are already done.
const checkInDone: MetricId[] = ['sleep', 'heartRate', 'mood', 'hydration'];

/* ------------------------------------------------------------------ everything else */

export const initialData: AppData = {
  version: 1,
  astronaut: { initials: 'JH', name: 'You', role: 'Flight engineer', missionDay: DAY, dateLabel: 'Sunday, 15 Nov', expedition: 'Expedition 74' },
  points: 1180,
  pointsThisWeek: 340,
  level: { number: 7, title: 'Flight Engineer', next: 'Mission Specialist', nextAt: 1500 },
  streak: { current: 11, best: 18, week: [true, true, true, true, true, true, false], todayIndex: 6 },
  checkIn: { done: checkInDone, completedToday: false },
  metrics,
  vision: [
    { name: 'Visual acuity', detail: 'Right 20/20 · left 20/25 · stable since pre-flight', value: '20/20', meta: 'Last test Day 128', status: 'nominal' },
    { name: 'Optic nerve scan (OCT)', detail: 'No optic disc swelling · screens for SANS', value: 'Clear', meta: 'Last scan Day 120', status: 'nominal' },
  ],
  radiation: {
    missionDose: 58, missionLimit: 150, projected: 112,
    rows: [
      { name: 'Daily dose rate', detail: 'Typical for low Earth orbit', value: '0.42 mSv', meta: 'Per day · 7-day avg', status: 'nominal' },
      { name: 'Solar activity', detail: 'Class M flare forecast · stay near shielded module if alerted', value: 'Elevated', meta: 'Updated 5 h ago', status: 'caution' },
    ],
  },
  alerts: [
    { id: 'bp', title: 'Blood pressure rising', detail: '+8 mmHg above your pre-flight baseline and rising for 3 weeks. Re-measure seated after 5 minutes of rest.', category: 'Health', severity: 'caution', time: '2 h', group: 'Needs attention',
      link: { label: '+8 mmHg vs pre-flight', to: '/health/cardiovascular/bloodPressure' },
      actions: [{ label: 'Log blood pressure', to: '/health/cardiovascular/bloodPressure', kind: 'primary' }, { label: 'Message flight surgeon', kind: 'ghost' }] },
    { id: 'solar', title: 'Solar activity elevated', detail: 'Class M flare forecast for the next 24 h. Stay near the shielded module if a radiation alert sounds.', category: 'Environment', severity: 'caution', time: '5 h', group: 'Needs attention',
      link: { label: 'Stay near shielded module if alerted', to: '/health/radiation' },
      actions: [{ label: 'View radiation', to: '/health/radiation', kind: 'secondary' }] },
    { id: 'comms', title: 'Comms window 14:20 GMT', detail: 'Your weekly health report sends automatically during this window.', category: 'Mission', severity: 'info', time: 'Today', group: 'Today',
      link: { label: 'Weekly report sends automatically', to: '/alerts' } },
    { id: 'air', title: 'Cabin air nominal', detail: 'CO₂, temperature and humidity are in range.', category: 'Environment', severity: 'nominal', time: '08:00', group: 'Today',
      link: { label: 'CO₂, temp and humidity in range', to: '/alerts' } },
    { id: 'sleep', title: 'Sleep below the Earth range for 6 weeks', detail: 'Average 6.4 h vs 7–9 h recommended. Try protecting an 8.5 h sleep window.', category: 'Health', severity: 'caution', time: 'Sat', group: 'Earlier',
      actions: [{ label: 'View sleep', to: '/health/behavioral/sleep', kind: 'ghost' }] },
    { id: 'hyd', title: 'Hydration behind yesterday', detail: 'Resolved · you reached 2.6 L by 20:00.', category: 'Health', severity: 'resolved', time: 'Sat', group: 'Earlier' },
  ],
  crew: [
    { id: 'AK', initials: 'AK', name: 'Anya K.', role: 'Commander', color: '--color-status-nominal', checkIn: { done: 6, total: 6 }, exercise: { done: 6, total: 7 } },
    { id: 'MR', initials: 'MR', name: 'Marco R.', role: 'Flight engineer', color: '--color-status-caution', checkIn: { done: 2, total: 6 }, exercise: { done: 4, total: 7 } },
    { id: 'SL', initials: 'SL', name: 'Sofia L.', role: 'Mission specialist', color: '--color-status-info', checkIn: { done: 6, total: 6 }, exercise: { done: 6, total: 7 } },
    { id: 'JH', initials: 'JH', name: 'You', role: 'Flight engineer', color: '--color-action-interact', checkIn: { done: 4, total: 6 }, exercise: { done: 5, total: 7 }, isYou: true },
  ],
  crewGoal: { title: 'Hit 90% of exercise sessions', done: 21, total: 25, goalPct: 90, daysLeft: 3, reward: 'Unlocks crew movie night  ·  +100 pts each' },
  challenges: {
    active: { name: 'Hydration week', detail: 'Log water 6 times a day. 3 of 4 crew joined.', day: 6, length: 7, board: [{ id: 'AK', done: 6 }, { id: 'JH', done: 5 }, { id: 'SL', done: 5 }] },
    open: [
      { name: 'Sleep window week', detail: 'Log sleep inside your window 7 nights  ·  2 joined', icon: 'moon', joined: false },
      { name: 'Daily mobility', detail: '10 minutes of stretching, 5 days  ·  1 joined', icon: 'activity', joined: false },
    ],
  },
  crewActivity: [
    { who: 'AK', text: 'Anya earned the 14-day streak badge', when: '2 h', cheer: true },
    { who: 'SL', text: 'Sofia joined Hydration week', when: '5 h', cheer: false },
    { who: 'MR', text: 'Marco took a recovery day', when: 'Yesterday', cheer: true },
    { who: 'JH', text: 'Crew met last week’s hydration goal  ·  +100 pts each', when: 'Mon', cheer: false },
  ],
  sharing: [
    { label: 'Check-in done today', shared: true },
    { label: 'Streak and badges', shared: true },
    { label: 'Progress in challenges you join', shared: true },
    { label: 'Vitals, sleep, mood and all readings', shared: false },
  ],
  showOnBoards: true,
  badges: [
    { name: '7-day streak', detail: 'Earned Day 121', earned: true, icon: 'flame' },
    { name: 'First month', detail: 'Earned Day 30', earned: true, icon: 'star' },
    { name: 'Honest logger', detail: '10 out-of-range logs', earned: true, icon: 'shield' },
    { name: 'Rest is training', detail: '5 recovery days', earned: true, icon: 'recover' },
    { name: '14-day streak', detail: '3 days to go', earned: false, icon: 'flame' },
    { name: 'Hydration hero', detail: 'Log water 21 days · 15/21', earned: false, icon: 'drop' },
    { name: 'Sleep window', detail: 'Log sleep 30 nights · 22/30', earned: false, icon: 'moon' },
    { name: 'Crew captain', detail: 'Lead 3 crew goals · 1/3', earned: false, icon: 'trophy' },
  ],
  spend: [
    { name: 'Pick the crew movie night', cost: 400 },
    { name: 'Choose a Sunday crew menu', cost: 600 },
    { name: 'Extra 15-min family call', cost: 800 },
    { name: 'Custom mission patch', cost: 1500 },
  ],
  recentPoints: [
    { label: 'Sleep logged', when: '08:12', points: 10 },
    { label: 'Blood pressure logged · out of range', when: '07:50', points: 10 },
    { label: 'Daily check-in complete', when: 'Yesterday', points: 50 },
    { label: 'Recovery day', when: 'Yesterday', points: 20 },
  ],
  rules: { checkIn: 50, perLog: 10, recoveryDay: 20, crewGoal: 100 },
};

export const AREAS: { id: AreaId; name: string; title: string; summary: string; metrics: MetricId[]; view: 'radar' | 'list' }[] = [
  { id: 'behavioral', name: 'Behavioral', title: 'Behavioral health', summary: 'Sleep · mood · fatigue · stress', metrics: ['sleep', 'mood', 'fatigue', 'stress'], view: 'radar' },
  { id: 'cardiovascular', name: 'Cardiovascular', title: 'Cardiovascular health', summary: 'Heart rate · BP · HRV · SpO₂', metrics: ['heartRate', 'bloodPressure', 'hrv', 'spo2'], view: 'radar' },
  { id: 'body', name: 'Body', title: 'Body', summary: 'Exercise · mass · hydration · bone', metrics: ['exercise', 'bodyMass', 'hydration', 'boneDensity'], view: 'radar' },
  { id: 'vision', name: 'Vision', title: 'Vision', summary: '2 metrics · shown as a list', metrics: [], view: 'list' },
  { id: 'radiation', name: 'Radiation', title: 'Radiation', summary: 'Dose · solar alerts · shown as a list', metrics: [], view: 'list' },
];

/** The 6 daily check-in items, in the order they're asked. */
export const CHECK_IN_ORDER: MetricId[] = ['sleep', 'heartRate', 'mood', 'hydration', 'fatigue', 'stress'];
