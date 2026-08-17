/**
 * SyLOC-T - Primitives de structure "back-office"
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
export { EmptyState, LoadingState } from './ui';

/* ─── Tonalites ──────────────────────────────────────────────────────── */
const TONES = {
  navy: { fg: 'var(--text-navy)', soft: 'rgba(23,37,84,.10)' },
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
    <div style={{ marginBottom: 32 }}>
      {breadcrumb && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
          {breadcrumb}
        </div>
      )}
      <div
        className="ui-card ui-rise"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 14, flexWrap: 'wrap', padding: '22px 26px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {icon && (
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--gold-tint)', color: 'var(--gold-deep)', display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0, border: '1px solid var(--gold-tint-2)' }}>
              {icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-navy)', margin: 0, lineHeight: 1.25 }}>
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '32px 0 16px', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 4, height: 16, borderRadius: 4, background: 'var(--gold)' }} />
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-navy)' }}>
          {children}
        </span>
      </div>
      {right}
    </div>
  );
}

/* ─── GRILLE D'INDICATEURS ───────────────────────────────────────────── */
export function StatGrid({ cols = 4, children, gap = 20, style = {} }) {
  return (
    <div
      style={{
        display: 'grid', gap,
        gridTemplateColumns: `repeat(auto-fit, minmax(${cols >= 5 ? 165 : 240}px, 1fr))`,
        marginBottom: 32,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function KpiCard({ icon, label, value, sub, trend, tone: t = 'navy', onClick }) {
  const c = tone(t);

  // Découpage propre de la valeur et de l'unité monétaire (affichage 100% visible)
  const renderValue = () => {
    if (typeof value === 'string' && value.includes(' FCFA')) {
      const [val] = value.split(' FCFA');
      return (
        <span style={{ display: 'inline-flex', alignItems: 'baseline', flexWrap: 'nowrap' }}>
          <span>{val}</span>
          <span style={{ fontSize: '0.62em', fontWeight: 800, marginLeft: 5, letterSpacing: '0.5px', opacity: 0.85 }}>
            FCFA
          </span>
        </span>
      );
    }
    return value;
  };

  return (
    <div
      onClick={onClick}
      className="ui-card ui-lift ui-kpi ui-rise"
      style={{
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        minWidth: 0,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        borderRadius: 16,
        background: 'var(--surface-card, var(--surface))',
        boxShadow: '0 2px 10px rgba(15, 27, 61, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Accent supérieur subtil */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3.5,
        background: c.fg === 'var(--text-navy)'
          ? 'linear-gradient(90deg, #0d1b2a 0%, #172554 100%)'
          : `linear-gradient(90deg, ${c.fg} 0%, ${c.soft} 100%)`,
      }} />

      <div>
        {/* Ligne d'en-tête : Label + Icône à droite */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            margin: 0,
            fontWeight: 800,
          }}>
            {label}
          </p>
          {icon && (
            <div
              className="ui-kpi-icon"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: c.soft,
                color: c.fg,
                display: 'grid',
                placeItems: 'center',
                fontSize: 18,
                flexShrink: 0,
                border: `1px solid ${c.soft}`,
              }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Valeur en pleine largeur (aucun masquage ou troncature) */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: typeof value === 'string' && value.length > 12 ? '21px' : '25px',
          fontWeight: 800,
          color: c.fg,
          margin: 0,
          lineHeight: 1.15,
          whiteSpace: 'nowrap',
        }}>
          {renderValue()}
        </div>
      </div>

      {sub && (
        <p style={{
          fontSize: 11.5,
          color: 'var(--muted)',
          margin: '10px 0 0',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {sub}
        </p>
      )}

      {trend != null && trend !== '' && (
        <div style={{ marginTop: 8, fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{trend}</div>
      )}
    </div>
  );
}

export function MiniStat({ icon, label, value, tone: t = 'slate' }) {
  const c = tone(t);
  return (
    <div className="ui-card ui-lift ui-kpi" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
      <span className="ui-kpi-icon" style={{ width: 32, height: 32, borderRadius: 10, background: c.soft, color: c.fg, display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</span>
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
      className="ui-card ui-lift"
      style={{ overflow: 'hidden', minWidth: 0, ...style }}
    >
      {(title || action) && (
        <header className="ui-panel-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            {icon && <span style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--gold-tint)', color: 'var(--gold-deep)', display: 'grid', placeItems: 'center', fontSize: 15, flexShrink: 0 }}>{icon}</span>}
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--text-navy)' }}>{title}</h3>
              {subtitle && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div style={{ padding: padded ? 24 : 0 }}>{children}</div>
    </section>
  );
}

/* ─── BARRE DE FILTRES ───────────────────────────────────────────────── */
export function FilterBar({ children, onReset }) {
  return (
    <div
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 20, marginBottom: 32, boxShadow: 'var(--shadow-sm)',
        display: 'grid', gap: 14,
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
          style={{ justifySelf: 'start', height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-navy)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
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

export function RowActions({ children, align = 'flex-end' }) {
  return <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: align, flexWrap: 'nowrap' }}>{children}</div>;
}

/* ─── TABLEAU DE DONNEES ─────────────────────────────────────────────── */
export function DataTable({
  columns,
  rows,
  loading,
  empty,
  emptyIcon = null,
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
  const pad = dense ? '12px 16px' : '16px 20px';

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
            {page * pageSize + 1}-{Math.min(total, (page + 1) * pageSize)} sur {total}
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
  background: 'var(--surface)', color: 'var(--text-navy)', fontSize: 12, fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
});

/* ─── CELLULE IDENTITE (avatar + libelle) ────────────────────────────── */
export function IdentityCell({ title, subtitle, primary, secondary, initials, tone: t = 'navy' }) {
  const displayTitle = title || primary || '-';
  const displaySubtitle = subtitle || secondary;
  const c = tone(t);
  const ini = initials ?? (displayTitle !== '-' ? displayTitle : '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: c.soft, color: c.fg, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 900, flexShrink: 0 }}>
        {ini}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-navy)', fontSize: 12.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayTitle}</div>
        {displaySubtitle && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{displaySubtitle}</div>}
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
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
      {items.map((it, i) => {
        const isHighlight = Boolean(it.highlight || it.isCurrentOccupant || it.est_moi);
        const rank = it.rank ?? it.rang ?? (i + 1);
        const badgeBg = isHighlight
          ? 'var(--green, #16a34a)'
          : (rank <= 3 ? 'var(--gold)' : 'var(--slate-soft)');
        const badgeColor = isHighlight
          ? '#ffffff'
          : (rank <= 3 ? 'var(--text-on-gold)' : 'var(--slate)');

        return (
          <li key={it.key ?? i} className="ui-row" style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
            border: isHighlight ? '1.5px solid var(--green, #16a34a)' : '1px solid var(--border)',
            borderRadius: 14,
            background: isHighlight ? 'rgba(22, 163, 74, 0.08)' : 'var(--surface-2)',
            boxShadow: isHighlight ? '0 2px 8px rgba(22, 163, 74, 0.15)' : 'var(--shadow-sm)',
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8,
              background: badgeBg,
              color: badgeColor,
              display: 'grid', placeItems: 'center',
              fontSize: rank > 99 ? 10 : 12,
              fontWeight: 900,
              flexShrink: 0
            }}>
              {rank}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12.5,
                fontWeight: isHighlight ? 800 : 700,
                color: isHighlight ? 'var(--green, #16a34a)' : 'var(--text-navy)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span>{it.title}</span>
                {isHighlight && (
                  <span style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: 6,
                    background: 'var(--green, #16a34a)',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Vous
                  </span>
                )}
              </div>
              {it.subtitle && <div style={{ fontSize: 10.5, color: isHighlight ? 'var(--green, #16a34a)' : 'var(--muted)' }}>{it.subtitle}</div>}
            </div>
            {it.value != null && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 800,
                color: isHighlight ? 'var(--green, #16a34a)' : 'var(--text-navy)',
                whiteSpace: 'nowrap'
              }}>
                {it.value}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ─── LIGNE DE PROGRESSION ───────────────────────────────────────────── */
export function ProgressRow({ label, value, total, tone: t = 'navy', suffix = '' }) {
  const c = tone(t);
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 8, gap: 10 }}>
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
    <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 26, overflowX: 'auto', paddingBottom: 1 }}>
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
              color: on ? 'var(--text-navy)' : 'var(--muted)',
              fontWeight: on ? 800 : 600, fontSize: 12.8, cursor: 'pointer',
              whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7,
            }}
          >
            {t.icon && <span>{t.icon}</span>}
            {t.label}
            {t.count != null && (
              <span style={{ background: on ? 'var(--navy)' : 'var(--surface-2)', color: on ? 'var(--text-on-navy)' : 'var(--muted)', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 800 }}>
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
    <div style={{ display: 'grid', gap: 28, gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` }}>
      {children}
    </div>
  );
}

/* ─── DISPOSITION 2 COLONNES (contenu large + panneau) ───────────────── */
export function SplitLayout({ children, ratio = '1.6fr 1fr' }) {
  return (
    <div className="split-layout" style={{ display: 'grid', gap: 32, gridTemplateColumns: ratio, alignItems: 'start' }}>
      {children}
      <style>{`@media (max-width: 1023px){ .split-layout { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

/* ─── BANDEAU DE BIENVENUE ───────────────────────────────────────────── */
export function WelcomeBanner({ title, subtitle, meta, action }) {
  return (
    <div
      className="ui-welcome ui-rise"
      style={{
        padding: '30px 32px', marginBottom: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 0, position: 'relative' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 800, letterSpacing: '-.02em' }}>{title}</h2>
        {subtitle && <p style={{ margin: '5px 0 0', fontSize: 13, color: 'rgba(250,241,225,.82)', maxWidth: 620 }}>{subtitle}</p>}
        {meta && <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '.7px', textTransform: 'uppercase', color: 'var(--gold)' }}>{meta}</p>}
      </div>
      <div style={{ position: 'relative' }}>{action}</div>
    </div>
  );
}

