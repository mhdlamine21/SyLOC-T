import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

/** Etat vide unifie : icone, titre, description, action facultative. */
export default function EmptyState({ icon, title = 'Aucune donnée', description, action, className = '' }) {
  return (
    <div className={`ds-empty ${className}`}>
      <div className="ds-empty__icon" aria-hidden="true">{icon || <InboxOutlinedIcon />}</div>
      <p className="ds-empty__title">{title}</p>
      {description && <p className="ds-empty__desc">{description}</p>}
      {action}
    </div>
  );
}

