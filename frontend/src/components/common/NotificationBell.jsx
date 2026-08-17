import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getNotifications,
  marquerNotificationLue,
  marquerToutesLues,
} from '../../api/notifications';
import { messageErreur } from '../../api/utils';
import { useAuth } from '../../context/AuthContext';

/** Le backend n'expose qu'un contenu libre + un canal : on en dérive titre et détail. */
function decouperContenu(contenu = '') {
  const texte = String(contenu).trim();
  const coupure = texte.indexOf('\n');
  if (coupure > 0) {
    return { titre: texte.slice(0, coupure).trim(), description: texte.slice(coupure + 1).trim() };
  }
  if (texte.length > 70) {
    return { titre: `${texte.slice(0, 70).trim()}…`, description: texte };
  }
  return { titre: texte || 'Notification', description: '' };
}

function formaterDate(valeur) {
  if (!valeur) return '';
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const INTERVALLE_RAFRAICHISSEMENT = 60_000;

export default function NotificationBell({ position = 'header' }) {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const dropdownRef = useRef(null);

  const charger = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    setChargement(true);
    try {
      const liste = await getNotifications();
      setNotifications(liste);
      setErreur(null);
    } catch (err) {
      setErreur(messageErreur(err, 'Notifications indisponibles.'));
    } finally {
      setChargement(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    charger();
    if (!isAuthenticated) return undefined;
    const timer = setInterval(charger, INTERVALLE_RAFRAICHISSEMENT);
    return () => clearInterval(timer);
  }, [charger, isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const unreadCount = notifications.filter((n) => !n.est_lue).length;

  const toggleRead = async (notif) => {
    if (!notif.est_lue) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, est_lue: true } : n)),
      );
      try {
        await marquerNotificationLue(notif.id);
      } catch (err) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, est_lue: false } : n)),
        );
        toast.error(messageErreur(err, 'Impossible de marquer la notification comme lue.'));
      }
    }

    // Redirection contextuelle vers la page appropriée
    const texte = (notif.contenu || '').toLowerCase();
    if (texte.includes('dossier') || texte.includes('candidature') || texte.includes('pièce') || texte.includes('complément')) {
      if (role === 'USAGER') {
        navigate('/suivi');
      } else if (role === 'BUREAU_COURRIER') {
        navigate('/courrier');
      } else if (role === 'AGENT_DCUVE' || role === 'DIRECTEUR_DCUVE') {
        navigate('/instruction');
      }
    } else if (texte.includes('contrat') || texte.includes('redevance') || texte.includes('loyer') || texte.includes('bail')) {
      if (role === 'OCCUPANT') {
        navigate('/espace-occupant');
      } else if (role === 'SERVICE_COMPTABLE') {
        navigate('/caisse');
      }
    } else if (texte.includes('sanction') || texte.includes('fidélité') || texte.includes('score')) {
      if (role === 'OCCUPANT') {
        navigate('/fidelite');
      }
    }
    setShowDropdown(false);
  };

  const clearAll = async () => {
    const precedent = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, est_lue: true })));
    try {
      await marquerToutesLues();
      toast.success('Toutes les notifications ont été marquées comme lues.');
    } catch (err) {
      setNotifications(precedent);
      toast.error(messageErreur(err, 'Échec de la mise à jour des notifications.'));
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => {
          setShowDropdown((s) => !s);
          if (!showDropdown) charger();
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: 'var(--text-navy)',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
        title="Notifications et alertes"
        aria-label="Notifications"
      >
        <NotificationsNoneRoundedIcon style={{ fontSize: 19 }} />

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: 'var(--red, #dc2626)',
              color: '#ffffff',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          className={`absolute z-50 w-80 sm:w-96 shadow-2xl p-4 rounded-xl ${
            position === 'header' ? 'right-0 top-full mt-2' : 'left-full top-0 ml-2'
          }`}
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.15))',
          }}
        >
          <div className="flex justify-between items-center pb-2.5 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--gold-deep, #c9a15c)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{ background: 'rgba(220,38,38,0.12)', color: 'var(--red, #dc2626)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 6 }}>
                  {unreadCount} non lue(s)
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={clearAll} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {chargement && notifications.length === 0 && (
              <p className="text-xs text-muted font-mono py-4 text-center">Chargement…</p>
            )}
            {erreur && (
              <p className="text-xs text-red-500 font-mono py-2 text-center">{erreur}</p>
            )}
            {!chargement && !erreur && notifications.length === 0 && (
              <p className="text-xs text-muted font-mono py-4 text-center">Aucune notification.</p>
            )}
            {notifications.map((n) => {
              const { titre, description } = decouperContenu(n.contenu);
              return (
                <div
                  key={n.id}
                  onClick={() => toggleRead(n)}
                  className="p-3 rounded-lg text-xs cursor-pointer transition-colors"
                  style={{
                    backgroundColor: !n.est_lue ? 'var(--surface-2)' : 'transparent',
                    border: `1px solid ${!n.est_lue ? 'var(--gold, #c9a15c)' : 'var(--border)'}`,
                    opacity: !n.est_lue ? 1 : 0.75,
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p style={{ fontWeight: 700, color: 'var(--text-navy)', margin: 0, fontSize: 12 }}>{titre}</p>
                    <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {formaterDate(n.date_creation)}
                    </span>
                  </div>
                  {description && (
                    <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4, margin: '4px 0 0' }}>{description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                    <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--gold-deep, #c9a15c)', fontWeight: 700 }}>
                      Canal : {n.canal || 'EMAIL'}
                    </span>
                    {!n.est_lue && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red, #dc2626)', display: 'inline-block' }} />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 mt-3 border-t border-white/10 text-center">
            <button onClick={() => setShowDropdown(false)} style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

