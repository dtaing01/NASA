import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import type { Status } from '../data/store';

type ButtonKind = 'primary' | 'secondary' | 'ghost';

export function Button({ kind = 'primary', full, className = '', ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { kind?: ButtonKind; full?: boolean }) {
  return <button type="button" className={`btn btn-${kind} ${full ? 'btn-full' : ''} ${className}`} {...rest} />;
}

export function Card({ title, action, children, className = '', accent }:
  { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; accent?: boolean }) {
  return (
    <section className={`card ${accent ? 'card-accent' : ''} ${className}`}>
      {(title || action) && (
        <header className="card-head">
          <h2 className="t-h5">{title}</h2>
          {action && <div className="t-body-sm c-secondary">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/** Low-profile status: green dot = Good, orange arrow = Low / High. */
export function StatusTag({ status, label, small }: { status: Status; label: string; small?: boolean }) {
  const cls = small ? 't-caption' : 't-body-sm tag-strong';
  if (status === 'good') return <span className={`tag ${cls} ${small ? 'c-secondary' : 'c-nominal'}`}><i className="dot dot-nominal" />{label}</span>;
  return (
    <span className={`tag ${cls} c-caution`}>
      <Icon name={status === 'low' ? 'arrowDown' : 'arrowUp'} size={12} />{label}
    </span>
  );
}

export interface Crumb { label: string; to?: string }

/** Back arrow returns to the previous screen; each crumb jumps up a level. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const navigate = useNavigate();
  return (
    <nav className="crumbs t-body-sm" aria-label="Breadcrumb">
      <button type="button" className="crumb-back" onClick={() => navigate(-1)} aria-label="Go back"><Icon name="back" size={18} /></button>
      {items.map((c, i) => (
        <span key={c.label} className="crumb">
          {i > 0 && <span className="c-muted" aria-hidden="true">›</span>}
          {c.to ? <Link to={c.to} className="c-secondary">{c.label}</Link> : <span className="c-primary" aria-current="page">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return <span className="avatar t-meta" style={{ width: size, height: size, background: `var(${color})` }}>{initials}</span>;
}

export function ProgressBar({ value, color = 'var(--color-action-interact)', height = 8, marker }:
  { value: number; color?: string; height?: number; marker?: number }) {
  return (
    <div className="bar" style={{ height }}>
      <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
      {marker !== undefined && <div className="bar-marker" style={{ left: `${marker * 100}%` }} />}
    </div>
  );
}

export function PageShell({ main, side }: { main: ReactNode; side?: ReactNode }) {
  return (
    <main className="page">
      <div className="page-main">{main}</div>
      {side && <aside className="page-side">{side}</aside>}
    </main>
  );
}
