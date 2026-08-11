import React from 'react';
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

  const initials = user?.nom_complet?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const navItems = getNavigationItems(user, role);

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
        className="desktop-top-menu"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          overflowX: 'auto', padding: '4px 8px',
          maxWidth: '55vw',
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

      {/* ── Droite : Actions (Toggle Sombre, Notification, Profil & Déconnexion) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Toggle Mode Sombre */}
        <button
          className="theme-toggle"
          onClick={toggle}
          title={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          aria-label="Basculer le mode sombre"
        >
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Cloche de notification */}
        <NotificationBell position="header" />

        {/* Badge profil utilisateur */}
        {user && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'var(--surface-2)', padding: '6px 12px',
              borderRadius: 10, border: '1px solid var(--border)',
            }}
            className="user-header-chip"
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--navy)', color: '#fff',
              display: 'grid', placeItems: 'center',
              fontSize: 10, fontWeight: 900, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.nom_complet}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold-deep)', fontWeight: 800, textTransform: 'uppercase' }}>
                {role?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        )}

        {/* Bouton Déconnexion rapide (Grand écran) */}
        <button
          onClick={handleLogout}
          className="desktop-logout-btn"
          title="Déconnexion"
          style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, color: 'var(--navy)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span>🚪</span>
          <span className="hidden xl:inline">Déconnexion</span>
        </button>
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
