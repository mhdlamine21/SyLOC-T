import { useState } from 'react';
import toast from 'react-hot-toast';

const NOTIFICATIONS_INITIALES = [
  {
    id: 'NOTIF-001',
    titre: '⚡ Ordre de Mission Terrain Dépêché',
    description: 'Mission de contrôle d\'hygiène urgente attribuée pour la Cantine A (note étudiants < 3.0/5).',
    date: 'Aujourd\'hui, 14:30',
    type: 'URGENT',
    estLue: false,
  },
  {
    id: 'NOTIF-002',
    titre: '📜 Nouveau Contrat Prêt pour Rédaction',
    description: 'La demande DM-2026-00799 a reçu un avis favorable en commission. Service Juridique requis.',
    date: 'Hier, 16:45',
    type: 'INFO',
    estLue: false,
  },
  {
    id: 'NOTIF-003',
    titre: '💰 Redevance Exigible — Relance SMS',
    description: 'L\'échéance du 15/08 pour le local LOC-004 est à régler. Pénalité de 5% applicable en cas de retard.',
    date: '08 Août 2026',
    type: 'RAPPEL',
    estLue: false,
  },
];

export default function NotificationBell({ position = 'header' }) {
  const [notifications, setNotifications] = useState(NOTIFICATIONS_INITIALES);
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.estLue).length;

  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, estLue: true } : n))
    );
  };

  const clearAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, estLue: true })));
    toast.success('Toutes les notifications ont été marquées comme lues.');
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowDropdown((s) => !s)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-paper2 border border-ink/15 text-ink hover:bg-teal-pale hover:border-teal transition-colors"
        title="Notifications In-App & Alertes Email"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>

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
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => toggleRead(n.id)}
                className={`p-3 rounded border text-xs cursor-pointer transition-colors ${
                  !n.estLue ? 'bg-paper2 border-teal/40 shadow-sm' : 'bg-white/60 border-ink/10 opacity-75'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="font-bold text-ink text-xs leading-tight">{n.titre}</p>
                  <span className="text-[9px] font-mono text-muted whitespace-nowrap">{n.date}</span>
                </div>
                <p className="text-xs text-muted leading-relaxed mt-1">{n.description}</p>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-ink/5">
                  <span className="text-[9px] font-mono text-teal font-semibold">📧 Email & SMS délivrés</span>
                  {!n.estLue && <span className="w-2 h-2 rounded-full bg-stamp inline-block" />}
                </div>
              </div>
            ))}
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
