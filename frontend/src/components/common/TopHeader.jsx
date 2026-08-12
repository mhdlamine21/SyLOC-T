import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from './NotificationBell';
import AppLogo from './AppLogo';
import { getNavigationItems } from '../../utils/navigation';
import toast from 'react-hot-toast';

export default function TopHeader({ onToggleMobileSidebar }) {
  const { user, role, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const initials = user?.nom_complet?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const navItems = getNavigationItems(user, role);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie.');
    navigate('/');
  };

  return (
    <header 
      style={{
        position: 'sticky', top: 0, zIndex: 40,
        height: 70, background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 2px 10px rgba(15,27,61,.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(12px, 3vw, 28px)',
        transition: 'background 0.25s',
      }}
    >
      {/* ── Gauche : Hamburger (sur petit écran) & SVG Logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onToggleMobileSidebar}
          style={{
            display: 'none',
            width: 38, height: 38,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 10, cursor: 'pointer', fontSize: 18,
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--navy)',
          }}
          className="mobile-hamburger-btn"
          title="Ouvrir le menu latéral"
          aria-label="Ouvrir le menu"
        >
          ☰
        </button>

        <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>
          <AppLogo height={38} showText={true} />
        </NavLink>
      </div>

      {/* ── Centre : MENU HORIZONTAL (Grand Écran / Ordinateur / Portable) ── */}
      <nav 
        className="desktop-top-menu hidden md:flex"
        style={{
          alignItems: 'center', justifyContent: 'center', gap: 6,
          overflowX: 'auto', padding: '4px 8px',
          flex: 1, margin: '0 20px',
        }}
      >
        {navItems.map((item, i) => {
          if (item.group) return null; // Les titres de groupe ne sont affichés que dans le drawer mobile
          return (
            <NavLink
              key={item.path + i}
              to={item.path}
              className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10,
                fontSize: 12.5, fontWeight: isActive ? 800 : 600,
                color: isActive ? '#fff' : 'var(--navy)',
                background: isActive ? 'var(--navy)' : 'transparent',
                border: isActive ? '1px solid var(--navy)' : '1px solid transparent',
                textDecoration: 'none', whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              })}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── Droite : Actions (Notification + Menu Déroulant Utilisateur) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Cloche de notification (juste à côté du profil) */}
        <NotificationBell position="header" />

        {/* Menu Déroulant Utilisateur (Tout à droite) */}
        {user && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface-2)', padding: '6px 12px 6px 6px',
                borderRadius: 24, border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              className="hover:border-teal/50 hover:bg-teal-pale/30"
              title="Menu Utilisateur"
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--navy)', color: '#fff',
                display: 'grid', placeItems: 'center',
                fontSize: 11, fontWeight: 900, flexShrink: 0,
              }}>
                {initials}
              </div>
              <span className="hidden md:block" style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
                {user.nom_complet.split(' ')[0]}
              </span>
              <span style={{ fontSize: 10, color: 'var(--slate)', marginLeft: 2 }}>▼</span>
            </button>

            {isDropdownOpen && (
              <div 
                style={{
                  position: 'absolute', top: '110%', right: 0,
                  width: 240, background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 12,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  padding: '8px', zIndex: 100,
                  display: 'flex', flexDirection: 'column', gap: 4
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.nom_complet}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold-deep)', fontWeight: 800, textTransform: 'uppercase' }}>
                    {role?.replace(/_/g, ' ')}
                  </div>
                </div>

                <NavLink 
                  to="/profile" 
                  onClick={() => setIsDropdownOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, textDecoration: 'none', color: 'var(--navy)', fontSize: 13, fontWeight: 600 }}
                  className="hover:bg-surface-2"
                >
                  <span>👤</span> Voir le profil
                </NavLink>

                <button
                  onClick={() => { toggle(); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--navy)', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'left' }}
                  className="hover:bg-surface-2"
                >
                  <span>{dark ? '☀️' : '🌙'}</span> Mode {dark ? 'clair' : 'sombre'}
                </button>

                <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>

                <button
                  onClick={() => { 
                    setIsDropdownOpen(false); 
                    toast('📞 Contact : contact@crous-thies.sn | 33 951 12 34', { icon: 'ℹ️' }); 
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--navy)', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'left' }}
                  className="hover:bg-surface-2"
                >
                  <span>📞</span> Contacter le service
                </button>

                <button
                  onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,.1)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 700, width: '100%', textAlign: 'left', marginTop: 4 }}
                  className="hover:bg-red/20"
                >
                  <span>🚪</span> Déconnexion
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        /* Responsive : Écran Large (>= 1024px) vs Petit Écran (< 1024px) */
        @media (max-width: 1023px) {
          .desktop-top-menu { display: none !important; }
          .mobile-hamburger-btn { display: flex !important; }
          .desktop-logout-btn { display: none !important; }
          .user-header-chip { display: none !important; }
        }
        @media (min-width: 1024px) {
          .desktop-top-menu { display: flex !important; }
          .mobile-hamburger-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
}
