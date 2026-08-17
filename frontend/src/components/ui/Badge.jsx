const TONES = {
  neutral: { color: 'var(--muted)', background: 'var(--surface-2)', borderColor: 'var(--border)' },
  navy: { color: 'var(--text-navy)', background: 'var(--slate-soft)', borderColor: 'transparent' },
  info: { color: 'var(--slate)', background: 'var(--slate-soft)', borderColor: 'transparent' },
  success: { color: 'var(--green)', background: 'var(--green-soft)', borderColor: 'transparent' },
  warn: { color: 'var(--gold-deep)', background: 'var(--gold-soft)', borderColor: 'transparent' },
  danger: { color: 'var(--red)', background: 'var(--red-soft)', borderColor: 'transparent' },
  gold: { color: 'var(--gold-deep)', background: 'var(--gold-soft)', borderColor: 'transparent' },
};

/** Pastille d'etat generique du design system. */
export default function Badge({ tone = 'neutral', dot = false, children, className = '', style }) {
  return (
    <span className={`ds-badge ${className}`} style={{ ...(TONES[tone] || TONES.neutral), ...style }}>
      {dot && <span className="ds-badge__dot" />}
      {children}
    </span>
  );
}

export { TONES as BADGE_TONES };

