/** En-tete de page unifie : eyebrow + titre + sous-titre + actions. */
export default function PageHeader({ eyebrow, title, subtitle, actions, className = '' }) {
  return (
    <header className={`ds-pageheader ${className}`}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="ds-pageheader__eyebrow">{eyebrow}</div>}
        <h1 className="ds-pageheader__title">{title}</h1>
        {subtitle && <p className="ds-pageheader__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ds-pageheader__actions">{actions}</div>}
    </header>
  );
}

