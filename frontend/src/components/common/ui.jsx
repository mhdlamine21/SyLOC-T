/**
 * SyLOC-T — Bibliothèque de composants UI réutilisables
 * Thème Navy / Or (Objetif/index.html reference)
 */

import { STATUT_STYLES } from '../../utils/statutStyles';

// ─── BUTTON ────────────────────────────────────────────────────────────────────
export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[32px]',
    md: 'text-sm px-5 py-2.5 min-h-[40px]',
    lg: 'text-base px-7 py-3 min-h-[48px]',
  };

  // All button variants use CSS vars for consistency with dark mode
  const variantStyles = {
    primary:   { background: 'var(--navy)',    color: '#fff', border: 'none', borderRadius: 10, boxShadow: '0 6px 14px rgba(23,37,84,.22)', cursor: 'pointer' },
    secondary: { background: '#fff',           color: 'var(--navy)', border: '1px solid #cbd5e1', borderRadius: 10, cursor: 'pointer' },
    amber:     { background: 'var(--gold)',    color: '#fff', border: 'none', borderRadius: 10, boxShadow: '0 4px 10px rgba(201,161,92,.25)', cursor: 'pointer' },
    stamp:     { background: 'var(--red)',     color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' },
    ghost:     { background: 'transparent',   color: 'var(--navy)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer' },
    danger:    { background: 'var(--red)',     color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' },
    text:      { background: 'transparent',   color: 'var(--navy)', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' },
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${className}`}
      style={variantStyles[variant] || variantStyles.primary}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── CARD ──────────────────────────────────────────────────────────────────────
export function Card({ className = '', children, onClick, style = {} }) {
  return (
    <div
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 20,
        boxShadow: 'var(--shadow)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        ...style,
      }}
      onMouseEnter={onClick ? (e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(23,37,84,.12)'; } : undefined}
      onMouseLeave={onClick ? (e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; } : undefined}
    >
      {children}
    </div>
  );
}

// ─── FIELD ─────────────────────────────────────────────────────────────────────
export function Field({ label, hint, error, required, children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--navy)', marginBottom: 7, fontFamily: 'var(--font-body)' }}>
          {label}
          {required && <span style={{ color: 'var(--red)', marginLeft: 4 }}>*</span>}
          {hint && <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11, marginLeft: 8 }}>{hint}</span>}
        </label>
      )}
      {children}
      {error && (
        <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

// ─── INPUT ─────────────────────────────────────────────────────────────────────
export function Input({ className = '', style: extraStyle = {}, ...props }) {
  return (
    <input
      className={className}
      style={{
        width: '100%', padding: '12px 14px',
        border: '1px solid var(--border)', borderRadius: 10,
        background: 'var(--surface-2)', fontFamily: 'var(--font-body)',
        fontSize: 14, color: 'var(--text)', outline: 'none',
        transition: 'border-color 0.15s',
        ...extraStyle,
      }}
      onFocus={(e) => { e.target.style.borderColor = 'var(--navy)'; e.target.style.boxShadow = '0 0 0 3px rgba(23,37,84,.10)'; }}
      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
      {...props}
    />
  );
}

export function Textarea({ className = '', style: extraStyle = {}, ...props }) {
  return (
    <textarea
      className={className}
      style={{
        width: '100%', padding: '12px 14px',
        border: '1px solid var(--border)', borderRadius: 10,
        background: 'var(--surface-2)', fontFamily: 'var(--font-body)',
        fontSize: 14, color: 'var(--text)', outline: 'none',
        resize: 'vertical', minHeight: 100,
        transition: 'border-color 0.15s',
        ...extraStyle,
      }}
      onFocus={(e) => { e.target.style.borderColor = 'var(--navy)'; }}
      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
      {...props}
    />
  );
}

export function Select({ className = '', style: extraStyle = {}, children, ...props }) {
  return (
    <select
      className={className}
      style={{
        width: '100%', padding: '12px 14px',
        border: '1px solid var(--border)', borderRadius: 10,
        background: 'var(--surface-2)', fontFamily: 'var(--font-body)',
        fontSize: 14, color: 'var(--text)', outline: 'none',
        cursor: 'pointer',
        ...extraStyle,
      }}
      {...props}
    >
      {children}
    </select>
  );
}

// ─── STATUS BADGE ──────────────────────────────────────────────────────────────
export function StatusBadge({ statut, className = '' }) {
  const style = STATUT_STYLES[statut] ?? { label: statut, bg: 'bg-soft', fg: 'text-muted', dot: 'bg-muted' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 ${style.bg} ${style.fg} ${className}`}
      style={{ borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 10 }}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-none ${style.dot}`} />
      {style.label}
    </span>
  );
}

// ─── SECTION HEADER ────────────────────────────────────────────────────────────
export function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {eyebrow && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ width: 24, height: 2, background: 'var(--gold)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1.4px' }}>
            {eyebrow}
          </span>
        </div>
      )}
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', lineHeight: 1.2 }}>
        {title}
      </h1>
      {subtitle && <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  );
}

// ─── PAGE WRAPPER ──────────────────────────────────────────────────────────────
export function PageWrapper({ children, className = '' }) {
  return (
    <div className={`fade-in ${className}`} style={{ padding: 'clamp(16px,3vw,28px)', maxWidth: 1240, margin: '0 auto' }}>
      {children}
    </div>
  );
}

// ─── EMPTY STATE ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)', margin: '0 0 8px' }}>{title}</p>
      {description && <p style={{ fontSize: 14, margin: '0 0 18px' }}>{description}</p>}
      {action}
    </div>
  );
}

// ─── LOADING STATE ─────────────────────────────────────────────────────────────
export function LoadingState({ label = 'Chargement…' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--muted)', gap: 12 }}>
      <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--navy)', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
      <span style={{ fontSize: 14 }}>{label}</span>
    </div>
  );
}

// ─── MODAL ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const maxWidths = { sm: 400, md: 540, lg: 760, xl: 960 };
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(15,27,61,.60)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, animation: 'fadeIn 0.15s ease-out both',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          width: '100%', maxWidth: maxWidths[size],
          maxHeight: '90vh', overflowY: 'auto',
          position: 'relative',
          animation: 'fadeIn 0.2s ease-out both',
          boxShadow: '0 30px 80px rgba(0,0,0,.25)',
        }}
      >
        {/* Header de la modale */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 18px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--navy)', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--muted)', lineHeight: 1, padding: '2px 6px' }}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── TABLE ─────────────────────────────────────────────────────────────────────
export function Table({ columns, data, onRow, emptyState }) {
  if (!data?.length) return emptyState ?? <EmptyState title="Aucune donnée" />;
  return (
    <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  background: 'var(--surface-2)', color: 'var(--muted)',
                  fontSize: 10, textAlign: 'left', padding: '13px 18px',
                  fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRow?.(row)}
              style={{ cursor: onRow ? 'pointer' : 'default', transition: 'background 0.1s' }}
              onMouseEnter={(e) => { if (onRow) e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: '13px 18px', borderTop: '1px solid var(--border)',
                    color: 'var(--muted)', fontSize: 13,
                  }}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TIMELINE ──────────────────────────────────────────────────────────────────
export function Timeline({ items }) {
  return (
    <ol style={{ position: 'relative', borderLeft: '2px solid var(--border)', paddingLeft: 24, margin: 0, listStyle: 'none' }}>
      {items.map((item, i) => (
        <li key={i} style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{
            position: 'absolute', left: -31, top: 2,
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid var(--navy)', background: 'var(--surface)',
          }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{item.date}</p>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', margin: '0 0 4px' }}>
            {item.statut ? <StatusBadge statut={item.statut} /> : item.titre}
          </p>
          {item.commentaire && <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>{item.commentaire}</p>}
          {item.auteur && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--slate)', marginTop: 4 }}>— {item.auteur}</p>}
        </li>
      ))}
    </ol>
  );
}

// ─── STAT CARD ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = 'navy', icon }) {
  const accentColors = {
    navy: 'var(--navy)',
    teal: 'var(--navy)',
    amber: 'var(--gold)',
    stamp: 'var(--red)',
    ok: 'var(--green)',
    danger: 'var(--red)',
    slate: 'var(--slate)',
  };
  const accent = accentColors[color] || 'var(--navy)';

  return (
    <div
      className="kpi-pill"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="kpi-label">{label}</p>
          <p className="kpi-num" style={{ color: accent }}>{value}</p>
          {sub && <p style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 4 }}>{sub}</p>}
        </div>
        {icon && <span style={{ fontSize: 24, opacity: 0.4 }}>{icon}</span>}
      </div>
    </div>
  );
}

// ─── STAR RATING ───────────────────────────────────────────────────────────────
export function StarRating({ value, onChange, max = 5, readOnly = false }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(i + 1)}
          style={{
            fontSize: 22, background: 'none', border: 'none', cursor: readOnly ? 'default' : 'pointer',
            color: i < value ? 'var(--gold)' : 'rgba(23,37,84,.15)',
            transition: 'transform 0.1s',
          }}
          onMouseEnter={(e) => { if (!readOnly) e.target.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.target.style.transform = ''; }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── ALERT BANNER ──────────────────────────────────────────────────────────────
export function AlertBanner({ type = 'info', children, className = '' }) {
  const styles = {
    info:    { borderColor: 'var(--slate)', background: 'var(--slate-soft)', color: 'var(--slate)' },
    warn:    { borderColor: 'var(--gold)',  background: 'var(--gold-soft)',  color: 'var(--gold-deep)' },
    danger:  { borderColor: 'var(--red)',   background: 'var(--red-soft)',   color: 'var(--red)' },
    success: { borderColor: 'var(--green)', background: 'var(--green-soft)', color: 'var(--green)' },
    demo:    { borderColor: 'var(--gold)',  background: 'var(--gold-soft)',  color: 'var(--gold-deep)' },
  };
  const icons = { info: 'ℹ️', warn: '⚠️', danger: '🚫', success: '✅', demo: '🔧' };
  const s = styles[type] || styles.info;

  return (
    <div
      className={`flex gap-3 ${className}`}
      style={{
        padding: '12px 16px', borderLeft: `4px solid ${s.borderColor}`,
        background: s.background, color: s.color,
        borderRadius: 10, fontSize: 14, marginBottom: 16,
      }}
    >
      <span style={{ flexShrink: 0 }}>{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}
