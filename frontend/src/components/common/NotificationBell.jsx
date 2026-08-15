import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { useCallback, useEffect, useState } from 'react';
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
    if (!isAuthenticated) return undefined;
    const timer = setInterval(charger, INTERVALLE_RAFRAICHISSEMENT);
    return () => clearInterval(timer);
  }, [charger, isAuthenticated]);

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
    } else if (texte.includes('contrat') || texte.includes('redevance') || texte.includes('loyer')) {
      if (role === 'OCCUPANT') {
        navigate('/espace-occupant');
      } else if (role === 'SERVICE_COMPTABLE') {
        navigate('/caisse');
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
    <div className="relative inline-block">
      <button
        onClick={() => {
          setShowDropdown((s) => !s);
          if (!showDropdown) charger();
        }}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-paper2 border border-ink/15 text-ink hover:bg-teal-pale hover:border-teal transition-colors"
        title="Notifications In-App & Alertes Email"
        aria-label="Notifications"
      >
        <NotificationsNoneRoundedIcon style={{ fontSize: 20 }} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-stamp text-paper text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          className={`absolute z-50 w-80 sm:w-96 bg-paper text-ink border border-ink/20 shadow-2xl p-4 rounded ${
            position === 'header' ? 'right-0 top-full mt-2' : 'left-full top-0 ml-2'
          }`}
          style={{ backgroundColor: 'var(--paper)', borderRadius: 'var(--radius)' }}
        >
          <div className="flex justify-between items-center pb-2 border-b border-ink/10 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-teal uppercase">Notifications Centre</span>
              {unreadCount > 0 && (
                <span className="bg-stamp-pale text-stamp font-mono text-[10px] font-bold px-1.5 py-0.2 rounded">
                  {unreadCount} non lue(s)
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={clearAll} className="text-[11px] font-mono text-muted hover:text-stamp underline">
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {chargement && notifications.length === 0 && (
              <p className="text-xs text-muted font-mono py-4 text-center">Chargement…</p>
            )}
            {erreur && (
              <p className="text-xs text-stamp font-mono py-2 text-center">{erreur}</p>
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
                  className={`p-3 rounded border text-xs cursor-pointer transition-colors ${
                    !n.est_lue ? 'bg-paper2 border-teal/40 shadow-sm' : 'bg-white/60 border-ink/10 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-bold text-ink text-xs leading-tight">{titre}</p>
                    <span className="text-[9px] font-mono text-muted whitespace-nowrap">
                      {formaterDate(n.date_creation)}
                    </span>
                  </div>
                  {description && (
                    <p className="text-xs text-muted leading-relaxed mt-1">{description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-ink/5">
                    <span className="text-[9px] font-mono text-teal font-semibold">
                      Canal : {n.canal || 'EMAIL'}
                    </span>
                    {!n.est_lue && <span className="w-2 h-2 rounded-full bg-stamp inline-block" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 mt-3 border-t border-ink/10 text-center">
            <button onClick={() => setShowDropdown(false)} className="text-xs font-mono text-muted hover:underline">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

