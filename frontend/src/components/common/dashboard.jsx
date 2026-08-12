/**
 * SyLOC-T — Primitives de structure "back-office"
 * Structure calquee sur les maquettes de reference :
 *  PageHeader (icone + titre + sous-titre + actions)
 *  StatGrid / KpiCard / MiniStat  (rangees d'indicateurs)
 *  SectionLabel                    (intitules de section)
 *  FilterBar                       (recherche + filtres + bouton)
 *  Panel                           (carte avec en-tete + action)
 *  DataTable                       (tableau dense + colonne actions)
 *  RankList / ProgressRow          (panneaux lateraux)
 *  Tabs, IconButton, Pagination, CardGrid, ProductCard
 * Les couleurs restent celles du theme Navy/Or du projet.
 */

import { useMemo, useState } from 'react';
import { EmptyState, LoadingState } from './ui';

/* ─── Tonalites ──────────────────────────────────────────────────────── */
export const TONES = {
  navy: { fg: 'var(--navy)', soft: 'rgba(23,37,84,.10)' },
  gold: { fg: 'var(--gold-deep, var(--gold))', soft: 'rgba(201,161,92,.16)' },
  green: { fg: 'var(--green)', soft: 'rgba(22,163,74,.14)' },
  red: { fg: 'var(--red)', soft: 'rgba(220,38,38,.13)' },
  slate: { fg: 'var(--slate)', soft: 'rgba(100,116,139,.14)' },
  info: { fg: '#0369a1', soft: 'rgba(3,105,161,.13)' },
  violet: { fg: '#6d28d9', soft: 'rgba(109,40,217,.13)' },
};
const tone = (t) => TONES[t] || TONES.navy;

/* ─── PAGE HEADER ────────────────────────────────────────────────────── */
export function PageHeader({ icon, title, subtitle, actions, breadcrumb }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {breadcrumb && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
          {breadcrumb}
        </div>
      )}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 14, flexWrap: 'wrap',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '16px 20px', boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {icon && (
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(23,37,84,.08)', display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>
              {icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: 0, lineHeight: 1.25 }}>
              {title}
            </h1>
            {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    </div>
  );
}

/* ─── SECTION LABEL ──────────────────────────────────────────────────── */
export function SectionLabel({ icon, children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 0 12px', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 4, height: 16, borderRadius: 4, background: 'var(--gold)' }} />
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--navy)' }}>
          {children}
        </span>
      </div>
      {right}
    </div>
  );
}

/* ─── GRILLE D'INDICATEURS ───────────────────────────────────────────── */
export function StatGrid({ cols = 4, children, gap = 14 }) {
  return (
    <div
      style={{
        display: 'grid', gap,
        gridTemplateColumns: `repeat(auto-fit, minmax(${cols >= 5 ? 150 : 210}px, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

export function KpiCard({ icon, label, value, sub, trend, tone: t = 'navy', onClick }) {
  const c = tone(t);
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow)',
        cursor: onClick ? 'pointer' : 'default', minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.9px', textTransform: 'uppercase', color: 'var(--muted)', margin: 0, fontWeight: 800 }}>
            {label}
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: c.fg, margin: '6px 0 0', lineHeight: 1.1, wordBreak: 'break-word' }}>
            {value}
          </p>
          {sub && <p style={{ fontSize: 11, color: 'var(--muted)', margin: '5px 0 0' }}>{sub}</p>}
        </div>
        {icon && (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: c.soft, color: c.fg, display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>
            {icon}
          </div>
        )}
      </div>
      {trend != null && trend !== '' && (
        <div style={{ marginTop: 10, fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{trend}</div>
      )}
    </div>
  );
}

export function MiniStat({ icon, label, value, tone: t = 'slate' }) {
  const c = tone(t);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <span style={{ width: 26, height: 26, borderRadius: 8, background: c.soft, color: c.fg, display: 'grid', placeItems: 'center', fontSize: 13, flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.8, letterSpacing: '.7px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: c.fg, lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );
}

/* ─── PANNEAU ────────────────────────────────────────────────────────── */
export function Panel({ icon, title, subtitle, action, children, padded = true, style = {} }) {
  return (
    <section
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, boxShadow: 'var(--shadow)', overflow: 'hidden', minWidth: 0, ...style,
      }}
    >
      {(title || action) && (
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>{title}</h3>
              {subtitle && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div style={{ padding: padded ? 18 : 0 }}>{children}</div>
    </section>
  );
}

/* ─── BARRE DE FILTRES ───────────────────────────────────────────────── */
export function FilterBar({ children, onReset }) {
  return (
    <div
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: 14, marginBottom: 16,
        display: 'grid', gap: 10,
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        alignItems: 'end',
      }}
    >
      {children}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          title="Reinitialiser les filtres"
          style={{ justifySelf: 'start', height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--navy)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
        >
          ↺ Reinitialiser
        </button>
      )}
    </div>
  );
}

export function FilterField({ label, children }) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 800, marginBottom: 6 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

/* ─── BOUTON ICONE ───────────────────────────────────────────────────── */
export function IconButton({ title, onClick, tone: t = 'navy', children, disabled }) {
  const c = tone(t);
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
        background: c.soft, color: c.fg, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-grid', placeItems: 'center', fontSize: 13,
        opacity: disabled ? 0.45 : 1, flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

export function RowActions({ children }) {
  return <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>;
}

/* ─── TABLEAU DE DONNEES ─────────────────────────────────────────────── */
export function DataTable({
  columns,
  rows,
  loading,
  empty,
  emptyIcon = '📭',
  rowKey = (r, i) => r?.id ?? i,
  onRowClick,
  pageSize = 0,
  dense = false,
}) {
  const [page, setPage] = useState(0);
  const total = rows?.length ?? 0;
  const paged = useMemo(() => {
    if (!pageSize) return rows ?? [];
    return (rows ?? []).slice(page * pageSize, page * pageSize + pageSize);
  }, [rows, page, pageSize]);

  if (loading) return <LoadingState />;
  if (!total) return <EmptyState icon={emptyIcon} title={empty || 'Aucune donnee'} />;

  const pages = pageSize ? Math.ceil(total / pageSize) : 1;
  const pad = dense ? '9px 14px' : '12px 16px';

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    textAlign: col.align || 'left', padding: pad,
                    background: 'var(--surface-2)', color: 'var(--muted)',
                    fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 800,
                    letterSpacing: '.9px', textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: pad, borderTop: '1px solid var(--border)',
                      fontSize: 12.8, color: 'var(--text)', textAlign: col.align || 'left',
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap', gap: 8 }}>
          <span>
            {page * pageSize + 1}–{Math.min(total, (page + 1) * pageSize)} sur {total}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={pagerStyle(page === 0)}>‹ Precedent</button>
            <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} style={pagerStyle(page >= pages - 1)}>Suivant ›</button>
          </div>
        </div>
      )}
    </>
  );
}

const pagerStyle = (disabled) => ({
  padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--navy)', fontSize: 12, fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
});

/* ─── CELLULE IDENTITE (avatar + libelle) ────────────────────────────── */
export function IdentityCell({ title, subtitle, initials, tone: t = 'navy' }) {
  const c = tone(t);
  const ini = initials ?? (title || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: c.soft, color: c.fg, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 900, flexShrink: 0 }}>
        {ini}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 12.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{subtitle}</div>}
      </div>
    </div>
  );
}

/* ─── PILL / TAG ─────────────────────────────────────────────────────── */
export function Pill({ children, tone: t = 'slate' }) {
  const c = tone(t);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: c.soft, color: c.fg, fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

/* ─── LISTE CLASSEE ──────────────────────────────────────────────────── */
export function RankList({ items, empty = 'Aucune donnee' }) {
  if (!items?.length) return <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>{empty}</p>;
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
      {items.map((it, i) => (
        <li key={it.key ?? i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)' }}>
          <span style={{ width: 22, height: 22, borderRadius: 7, background: i < 3 ? 'var(--gold)' : 'rgba(100,116,139,.18)', color: i < 3 ? '#fff' : 'var(--slate)', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 900, flexShrink: 0 }}>
            {i + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</div>
            {it.subtitle && <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{it.subtitle}</div>}
          </div>
          {it.value != null && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{it.value}</span>
          )}
        </li>
      ))}
    </ol>
  );
}

/* ─── LIGNE DE PROGRESSION ───────────────────────────────────────────── */
export function ProgressRow({ label, value, total, tone: t = 'navy', suffix = '' }) {
  const c = tone(t);
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, gap: 10 }}>
        <span style={{ color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: c.fg, whiteSpace: 'nowrap' }}>{pct}%{suffix}</span>
      </div>
      <div style={{ height: 7, borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: c.fg, transition: 'width .3s' }} />
      </div>
    </div>
  );
}

/* ─── ONGLETS ────────────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', marginBottom: 18, overflowX: 'auto', paddingBottom: 1 }}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            style={{
              padding: '10px 15px', border: 'none', background: 'transparent',
              borderBottom: `2px solid ${on ? 'var(--gold)' : 'transparent'}`,
              color: on ? 'var(--navy)' : 'var(--muted)',
              fontWeight: on ? 800 : 600, fontSize: 12.8, cursor: 'pointer',
              whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7,
            }}
          >
            {t.icon && <span>{t.icon}</span>}
            {t.label}
            {t.count != null && (
              <span style={{ background: on ? 'var(--navy)' : 'var(--surface-2)', color: on ? '#fff' : 'var(--muted)', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 800 }}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── GRILLE DE CARTES ───────────────────────────────────────────────── */
export function CardGrid({ children, min = 240 }) {
  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` }}>
      {children}
    </div>
  );
}

/* ─── DISPOSITION 2 COLONNES (contenu large + panneau) ───────────────── */
export function SplitLayout({ children, ratio = '1.6fr 1fr' }) {
  return (
    <div className="split-layout" style={{ display: 'grid', gap: 14, gridTemplateColumns: ratio, alignItems: 'start' }}>
      {children}
      <style>{`@media (max-width: 1023px){ .split-layout { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

/* ─── BANDEAU DE BIENVENUE ───────────────────────────────────────────── */
export function WelcomeBanner({ title, subtitle, meta, action }) {
  return (
    <div
      style={{
        background: 'linear-gradient(120deg, var(--navy) 0%, var(--navy-2, #0f1b3d) 100%)',
        color: '#fff', borderRadius: 16, padding: '20px 22px', marginBottom: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        boxShadow: '0 14px 34px rgba(15,27,61,.22)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>{title}</h2>
        {subtitle && <p style={{ margin: '5px 0 0', fontSize: 13, color: 'rgba(255,255,255,.78)' }}>{subtitle}</p>}
        {meta && <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '.7px', textTransform: 'uppercase', color: 'var(--gold)' }}>{meta}</p>}
      </div>
      {action}
    </div>
  );
}
