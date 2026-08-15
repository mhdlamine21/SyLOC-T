import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from './NotificationBell';
import { getNavigationItems } from '../../utils/navigation';
import { ROLES_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

/** Barre superieure fine : titre de page a gauche, actions/profil a droite. */
export default function TopHeader({ onToggleMobileSidebar }) {
  const { user, role, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <NotificationBell position="header" />

        {user && (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="user-header-chip"
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                background: 'var(--surface-2)', padding: '5px 11px',
                borderRadius: 10, border: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--navy)', color: 'var(--text-on-navy)', display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 900 }}>
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
              <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>▼</span>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 8, minWidth: 220,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                display: 'flex', flexDirection: 'column', gap: 4,
                zIndex: 100
              }}>
                <button onClick={() => { setMenuOpen(false); navigate('/profile'); }} className="dropdown-item">
                  👤 Mon profil
                </button>
                <button onClick={() => { toggle(); setMenuOpen(false); }} className="dropdown-item">
                  {dark ? <><LightModeIcon style={{ fontSize: 18, color: 'var(--gold)' }} /> Activer le mode clair</> : <><DarkModeIcon style={{ fontSize: 18 }} /> Activer le mode sombre</>}
                </button>
                <button onClick={() => { setMenuOpen(false); toast('Contacts: crous-t@univ-thies.sn / 33 951 00 00', { icon: '📞' }); }} className="dropdown-item">
                  📞 Contacts des services
                </button>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                <button onClick={handleLogout} className="dropdown-item dropdown-logout">
                  🚪 Déconnexion
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .dropdown-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; font-size: 13px; font-weight: 600;
          color: var(--ink); background: none; border: none;
          border-radius: 6px; cursor: pointer; text-align: left;
          transition: background 0.2s;
        }
        .dropdown-item:hover {
          background: var(--surface-2);
        }
        .dropdown-logout {
          color: var(--red);
        }
        .dropdown-logout:hover {
          background: var(--red-pale);
        }
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


