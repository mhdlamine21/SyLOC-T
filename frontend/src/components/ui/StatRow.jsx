/** Ligne libelle / valeur, pour les listes d'indicateurs compactes. */
export default function StatRow({ label, value, icon, tone, className = '' }) {
  return (
    <div className={`ds-statrow ${className}`}>
      <span className="ds-statrow__label">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </span>
      <span className="ds-statrow__value" style={tone ? { color: tone } : undefined}>{value}</span>
    </div>
  );
}

