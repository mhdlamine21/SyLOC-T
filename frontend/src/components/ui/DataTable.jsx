import { useMemo, useState } from 'react';
import EmptyState from './EmptyState';
import { SkeletonTable } from './Skeleton';

/**
 * Tableau de donnees unifie.
 * columns: [{ key, label, render?(value,row), align?, width? }]
 */
export default function DataTable({
  columns = [],
  data = [],
  rowKey = (row, i) => row?.id ?? i,
  onRowClick,
  loading = false,
  empty,
  pageSize = 0,
  caption,
  className = '',
}) {
  const [page, setPage] = useState(0);

  const pages = pageSize > 0 ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;
  const courant = Math.min(page, pages - 1);
  const lignes = useMemo(
    () => (pageSize > 0 ? data.slice(courant * pageSize, courant * pageSize + pageSize) : data),
    [data, pageSize, courant],
  );

  if (loading) return <SkeletonTable columns={Math.max(columns.length, 3)} />;
  if (!data.length) return empty ?? <EmptyState title="Aucune donnée à afficher" />;

  return (
    <div className={`ds-table-wrap ${className}`}>
      <table className="ds-table">
        {caption && <caption style={{ captionSide: 'top', textAlign: 'left', padding: '10px 16px', fontSize: 12, color: 'var(--muted)' }}>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ textAlign: col.align || 'left', width: col.width }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              className={onRowClick ? 'ds-table__clickable' : ''}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pageSize > 0 && pages > 1 && (
        <div className="ds-table__footer">
          <span>
            {courant * pageSize + 1}-{Math.min((courant + 1) * pageSize, data.length)} sur {data.length}
          </span>
          <span style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={courant === 0}
              style={navBtn(courant === 0)}
            >
              ‹ Préc.
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={courant >= pages - 1}
              style={navBtn(courant >= pages - 1)}
            >
              Suiv. ›
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

const navBtn = (disabled) => ({
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-navy)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.45 : 1,
});

