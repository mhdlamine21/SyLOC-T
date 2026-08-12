import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markAsRead } from '../../api/notifications';

export default function NotificationBell({ position = 'header' }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des notifications:", error);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.est_lue).length;

  const toggleRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, est_lue: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const clearAll = async () => {
    // Dans un vrai système on aurait un endpoint mark_all_read, mais pour l'instant on map localement
    setNotifications((prev) => prev.map((n) => ({ ...n, est_lue: true })));
    toast.success('Toutes vos notifications ont été marquées comme lues.');
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowDropdown((s) => !s)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: 'var(--navy)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        title="Centre de Notifications Ciblées"
        aria-label="Notifications"
      >
        <span style={{ fontSize: 18 }}>🔔</span>

        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: 'var(--red)',
            color: '#fff',
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            width: 18,
            height: 18,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            zIndex: 9999,
            width: 340,
            background: 'var(--surface-card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            padding: 16,
            borderRadius: 16,
            top: position === 'header' ? '100%' : 0,
            right: position === 'header' ? 0 : 'auto',
            marginTop: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--gold-deep)', textTransform: 'uppercase' }}>
                Notifications ({user?.role?.replace(/_/g, ' ') || 'Usager'})
              </span>
              {unreadCount > 0 && (
                <span style={{ background: 'var(--red-soft)', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 10 }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={clearAll} style={{ fontSize: 11, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline' }}>
                Tout lire
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.est_lue && toggleRead(n.id)}
                style={{
                  padding: '12px 16px',
                  background: n.est_lue ? 'transparent' : 'var(--blue-light)',
                  borderLeft: n.est_lue ? '4px solid transparent' : '4px solid var(--navy)',
                  cursor: n.est_lue ? 'default' : 'pointer',
                  transition: 'background 0.2s ease',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: n.type_notif === 'URGENT' ? 'var(--red)' : n.type_notif === 'RAPPEL' ? 'var(--gold)' : 'var(--navy)',
                    background: n.type_notif === 'URGENT' ? 'rgba(239, 68, 68, 0.1)' : n.type_notif === 'RAPPEL' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(30, 58, 138, 0.1)',
                    padding: '2px 6px',
                    borderRadius: 4
                  }}>
                    {n.type_notif}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--slate)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: 13, color: 'var(--ink)' }}>{n.titre}</h4>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--slate)', lineHeight: 1.4 }}>{n.contenu}</p>
              </div>
            ))}
          </div>

          <div style={{ paddingTop: 10, marginTop: 12, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <button onClick={() => setShowDropdown(false)} style={{ fontSize: 12, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
