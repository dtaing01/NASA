import type { IconName } from '../data/mockData';

/* Icons exported from the Figma file (24-unit grid versions are scaled by viewBox).
   Strokes use currentColor so the icon takes the text color of its parent. */
const ICONS: Record<IconName, { box: number; body: JSX.Element }> = {
  heart: { box: 20, body: <path d="M10 16.667S4.167 13 4.167 8.334a3.33 3.33 0 0 1 5.833-2.167 3.33 3.33 0 0 1 5.833 2.167C15.833 13 10 16.667 10 16.667Z" strokeLinejoin="round" /> },
  star: { box: 20, body: <path d="m10 14.792-5.143 2.704.982-5.727-4.167-4.056 5.75-.834L9.994 1.668l2.572 5.211 5.75.834-4.167 4.056.983 5.727L10 14.792Z" strokeLinecap="round" strokeLinejoin="round" /> },
  crew: { box: 20, body: <><circle cx="7.5" cy="6.667" r="2.5" /><circle cx="14.167" cy="7.5" r="2.083" /><path d="M2.5 16.667c0-2.75 2.25-5 5-5s5 2.25 5 5m0-4.584c2.5 0 5 1.5 5 4.584" strokeLinecap="round" /></> },
  flame: { box: 18, body: <path d="M9 8.206C10.75 5.725 9.125 2.339 8.25 1.5c0 2.546-1.676 3.974-2.75 5.03C4.427 7.585 3.75 9.245 3.75 10.72c0 2.778 2.35 5.03 5.25 5.03s5.25-2.252 5.25-5.03c0-1.284-.924-3.302-1.75-4.19-1.563 2.514-2.442 2.514-3.5 1.764" strokeLinecap="round" strokeLinejoin="round" /> },
  back: { box: 18, body: <path d="M11.25 3.75 6 9l5.25 5.25" strokeLinecap="round" strokeLinejoin="round" /> },
  moon: { box: 28, body: <path d="M23.333 16.917a9.58 9.58 0 1 1-12.25-12.25 8.66 8.66 0 0 0 12.25 12.25Z" strokeLinejoin="round" /> },
  minus: { box: 20, body: <path d="M4.167 10h11.666" strokeLinecap="round" /> },
  plus: { box: 20, body: <path d="M10 4.167v11.666M4.167 10h11.666" strokeLinecap="round" /> },
  pulse: { box: 28, body: <path d="M3.5 14h4.667l3.5 9.333 4.666-18.666 3.5 9.333H24.5" strokeLinecap="round" strokeLinejoin="round" /> },
  body: { box: 28, body: <><circle cx="14" cy="4.667" r="2.567" /><path d="M9.917 9.333h8.166l1.75 8.167h-2.916l-1.167 7.583h-3.5L11.083 17.5H8.167l1.75-8.167Z" strokeLinejoin="round" /></> },
  mood: { box: 28, body: <><circle cx="14" cy="14" r="10.5" /><path d="M10.5 11.667h.012M17.5 11.667h.012M11.083 17.5a4.08 4.08 0 0 0 5.834 0" strokeLinecap="round" strokeLinejoin="round" /></> },
  drop: { box: 28, body: <path d="M8.753 22.66a8.33 8.33 0 0 0 10.495 0c3.036-2.456 3.806-6.66 1.827-9.97L15.37 4.22a1.63 1.63 0 0 0-2.737 0l-5.708 8.47c-1.978 3.31-1.208 7.514 1.828 9.97Z" strokeLinecap="round" strokeLinejoin="round" /> },
  check: { box: 16, body: <path d="M3.333 8 6.667 11.333 13.333 4.667" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /> },
  activity: { box: 20, body: <path d="M2.5 10h3.333l2.5-5.833 3.334 11.666 2.5-5.833H17.5" strokeLinecap="round" strokeLinejoin="round" /> },
  shield: { box: 20, body: <><path d="m10 2.5 5.833 2.5v4.167c0 3.75-2.5 6.666-5.833 8.333-3.333-1.667-5.833-4.583-5.833-8.333V5L10 2.5Z" strokeLinecap="round" strokeLinejoin="round" /><path d="m7.5 10 1.667 1.667L12.5 8.333" strokeLinecap="round" strokeLinejoin="round" /></> },
  recover: { box: 20, body: <><path d="M3.333 10a6.67 6.67 0 1 0 1.917-4.75" strokeLinecap="round" strokeLinejoin="round" /><path d="M3.333 3.333v2.5h2.5" strokeLinecap="round" strokeLinejoin="round" /></> },
  trophy: { box: 20, body: <path d="M6.667 3.333h6.666V7.5a3.333 3.333 0 0 1-6.666 0V3.333Zm0 1.667h-2.5a2.5 2.5 0 0 0 2.5 3.333M13.333 5h2.5a2.5 2.5 0 0 1-2.5 3.333M10 10.833v3.334m-3.333 2.5h6.666" strokeLinecap="round" strokeLinejoin="round" /> },
  gift: { box: 18, body: <><rect x="3" y="6.75" width="12" height="8.25" rx=".75" strokeLinejoin="round" /><path d="M9 4.5V15M9 4.5c-.75-2.25-3.75-2.25-3.75 0M9 4.5c.75-2.25 3.75-2.25 3.75 0M2.25 6.75h13.5V4.5H2.25v2.25Z" strokeLinecap="round" strokeLinejoin="round" /></> },
  eye: { box: 18, body: <><path d="M1.5 9S4.125 3.75 9 3.75 16.5 9 16.5 9 13.875 14.25 9 14.25 1.5 9 1.5 9Z" strokeLinejoin="round" /><circle cx="9" cy="9" r="2.25" /></> },
  eyeoff: { box: 18, body: <path d="m2.25 2.25 13.5 13.5M7.95 3.825A7.5 7.5 0 0 1 9 3.75C13.875 3.75 16.5 9 16.5 9a11.6 11.6 0 0 1-2.25 2.925M4.95 4.95C2.85 6.3 1.5 9 1.5 9s2.625 5.25 7.5 5.25c1.2 0 2.25-.3 3.225-.75" strokeLinecap="round" strokeLinejoin="round" /> },
  chevron: { box: 24, body: <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /> },
  chevronDown: { box: 16, body: <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /> },
  close: { box: 24, body: <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" /> },
  lock: { box: 24, body: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></> },
  arrowUp: { box: 12, body: <path d="M6 2.5 10.5 9.5h-9L6 2.5Z" fill="currentColor" stroke="none" /> },
  arrowDown: { box: 12, body: <path d="M6 9.5 1.5 2.5h9L6 9.5Z" fill="currentColor" stroke="none" /> },
  bolt: { box: 24, body: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" strokeLinejoin="round" /> },
  lungs: { box: 24, body: <path d="M12 4v8m0 0c-1 0-2.5.5-3 2m3-2c1 0 2.500.5 3 2M9 7c-3 1-5 5-5 9 0 2 1 3 2.500 3S9 18 9 16V7Zm6 0c3 1 5 5 5 9 0 2-1 3-2.500 3S15 18 15 16V7Z" strokeLinecap="round" strokeLinejoin="round" /> },
  bone: { box: 24, body: <path d="M8.500 15.500 15.500 8.500M6.200 13.200a2.500 2.500 0 1 0 0 5 2.500 2.500 0 1 0 4.600-.4M17.800 10.800a2.500 2.500 0 1 0 0-5 2.500 2.500 0 1 0-4.600.4" strokeLinecap="round" strokeLinejoin="round" /> },
};

export default function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  const { box, body } = ICONS[name];
  return (
    <svg className={className} width={size} height={size} viewBox={`0 0 ${box} ${box}`} fill="none" stroke="currentColor"
      strokeWidth={2} aria-hidden="true" style={{ flexShrink: 0 }}>
      {body}
    </svg>
  );
}
