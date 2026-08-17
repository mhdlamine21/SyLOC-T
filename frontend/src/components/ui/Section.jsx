/** Bloc de contenu encadre avec titre, sous-titre et actions optionnelles. */
export default function Section({ title, subtitle, actions, footer, children, className = '', style }) {
  return (
    <section className={`ds-section ${className}`} style={style}>
      {(title || actions) && (
        <div className="ds-section__head">
          <div style={{ minWidth: 0 }}>
            {title && <h2 className="ds-section__title">{title}</h2>}
            {subtitle && <p className="ds-section__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="ds-pageheader__actions">{actions}</div>}
        </div>
      )}
      {children}
      {footer && <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>{footer}</div>}
    </section>
  );
}

