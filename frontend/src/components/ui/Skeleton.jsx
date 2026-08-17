/** Bloc de chargement. Utiliser `lines` pour un paragraphe, sinon une barre. */
export default function Skeleton({ width = '100%', height = 14, radius = 6, lines = 1, className = '', style }) {
  if (lines > 1) {
    return (
      <div className={className} style={{ display: 'grid', gap: 8, ...style }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="ds-skeleton"
            style={{ width: i === lines - 1 ? '65%' : width, height, borderRadius: radius }}
          />
        ))}
      </div>
    );
  }
  return <div className={`ds-skeleton ${className}`} style={{ width, height, borderRadius: radius, ...style }} />;
}

/** Squelette pret a l'emploi pour une DataTable. */
export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="ds-table-wrap" style={{ padding: 14, display: 'grid', gap: 12 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12 }}>
          {Array.from({ length: columns }).map((__, c) => (
            <Skeleton key={c} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

