import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AppLogo from './AppLogo';
import { getNavigationItems } from '../../utils/navigation';
import toast from 'react-hot-toast';

export default function Sidebar({ onCloseMobile }) {
  const { user, role, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const initials = user?.nom_complet?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const navItems = getNavigationItems(user, role);

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie.');
    onCloseMobile?.();
    navigate('/');
  };

  return (
    <aside className="app-sidebar-drawer flex flex-col h-full bg-navy-2 text-paper">
      {/* ── Brand Header avec Logo & Fermeture ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <AppLogo height={34} showText={true} />
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, color: '#fff', width: 32, height: 32, cursor: 'pointer', fontSize: 18 }}
            aria-label="Fermer le menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Profil utilisateur ── */}
      {user && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', color: 'var(--navy-2)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <strong style={{ display: 'block', color: '#fff', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nom_complet}</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
              <span style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {role?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Liste de Navigation ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {navItems.map((item, i) => {
          if (item.group) {
            return (
              <div key={i} className="sidebar-nav-label" style={{ color: 'var(--gold)', fontSize: 9.5, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '16px 12px 6px', fontWeight: 800 }}>
                {item.group}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path + i}
              to={item.path}
              onClick={() => onCloseMobile?.()}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── Bas de sidebar : dark mode + déconnexion ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', padding: '12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={toggle}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-body)', width: '100%', textAlign: 'left' }}
        >
          <span>{dark ? '☀️' : '🌙'}</span>
          <span>{dark ? 'Mode clair' : 'Mode sombre'}</span>
        </button>

        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,.15)', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-body)', width: '100%', textAlign: 'left' }}
        >
          <span>🚪</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
