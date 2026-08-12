import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from './NotificationBell';
import { getNavigationItems } from '../../utils/navigation';
import { ROLES_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

/** Barre superieure fine : titre de page a gauche, actions/profil a droite. */
export default function TopHeader({ onToggleMobileSidebar }) {
  const { user, role, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const initials =
    user?.nom_complet?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const flat = getNavigationItems(user, role).flatMap((g) => g.items || []);
  const current =
    flat.find((i) => i.path === pathname) ||
    flat.find((i) => i.path !== '/dashboard' && pathname.startsWith(i.path));
  const pageTitle = current?.label || 'Tableau de bord';

  const handleLogout = () => {
    logout();
    toast.success('Deconnexion reussie.');
    navigate('/');
  };

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 40, height: 58,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(12px,2.2vw,22px)', gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button
          onClick={onToggleMobileSidebar}
          className="shell-hamburger"
          aria-label="Ouvrir le menu"
          style={{
            width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 17,
            background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--navy)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          ☰
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {current?.icon && <span style={{ fontSize: 15 }}>{current.icon}</span>}
          <span
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5,
              color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {pageTitle}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="theme-toggle" onClick={toggle} title={dark ? 'Mode clair' : 'Mode sombre'} aria-label="Basculer le mode sombre">
          {dark ? '☀️' : '🌙'}
        </button>

        <NotificationBell position="header" />

        {user && (
          <div
            className="user-header-chip"
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'var(--surface-2)', padding: '5px 11px',
              borderRadius: 10, border: '1px solid var(--border)',
            }}
          >
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 900 }}>
              {initials}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.nom_complet}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--gold-deep)', fontWeight: 800, textTransform: 'uppercase' }}>
                {ROLES_LABELS?.[role] || role?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="desktop-logout-btn"
          title="Deconnexion"
          style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10,
            padding: '8px 11px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--red)',
          }}
        >
          🚪
        </button>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .shell-hamburger { display: flex !important; }
          .user-header-chip { display: none !important; }
        }
        @media (min-width: 1024px) {
          .shell-hamburger { display: none !important; }
        }
      `}</style>
    </header>
  );
}
