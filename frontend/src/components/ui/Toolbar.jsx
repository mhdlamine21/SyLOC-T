/** Barre d'outils : recherche + filtres a gauche, actions a droite. */
export default function Toolbar({
  search,
  onSearch,
  searchPlaceholder = 'Rechercherâ€¦',
  children,
  actions,
  className = '',
}) {
  return (
    <div className={`ds-toolbar ${className}`}>
      {onSearch && (
        <input
          className="ds-toolbar__search"
          type="search"
          value={search ?? ''}
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch(e.target.value)}
          aria-label={searchPlaceholder}
        />
      )}
      {children}
      <span className="ds-toolbar__spacer" />
      {actions}
    </div>
  );
}

