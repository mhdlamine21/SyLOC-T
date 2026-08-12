// frontend/src/components/common/Notification.jsx
// Petit toast de succès/erreur, utilisé par tous les formulaires du sprint.
import { useEffect } from 'react';
import './notification.css';

export default function Notification({ notif, onClose }) {
  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [notif, onClose]);

  if (!notif) return null;

  return (
    <div className={`notif notif--${notif.type}`} role="status">
      <span className="notif-icon">{notif.type === 'success' ? '✓' : '!'}</span>
      <span className="notif-text">{notif.message}</span>
      <button className="notif-close" onClick={onClose} aria-label="Fermer">×</button>
    </div>
  );
}
