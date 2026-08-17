const ACCENTS = {
  navy: 'var(--navy)',
  teal: 'var(--navy)',
  slate: 'var(--slate)',
  amber: 'var(--gold)',
  gold: 'var(--gold)',
  ok: 'var(--green)',
  success: 'var(--green)',
  danger: 'var(--red)',
  stamp: 'var(--red)',
};

/** Indicateur cle (KPI). */
export default function StatCard({ label, value, sub, color = 'navy', icon, onClick, className = '' }) {
  const accent = ACCENTS[color] || ACCENTS.navy;
  return (
    <div
      className={`ds-statcard ${className}`}
      onClick={onClick}
      style={{ borderTop: `3px solid ${accent}`, cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ minWidth: 0 }}>
        <p className="ds-statcard__label">{label}</p>
        <p className="ds-statcard__value" style={{ color: accent }}>{value}</p>
        {sub && <p className="ds-statcard__sub">{sub}</p>}
      </div>
      {icon && <span className="ds-statcard__icon" aria-hidden="true">{icon}</span>}
    </div>
  );
}

