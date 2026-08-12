import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLogo from './AppLogo';
import { getNavigationItems } from '../../utils/navigation';
import { ROLES_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

/**
 * Sidebar back-office : bloc marque, navigation groupee par domaine metier,
 * bloc utilisateur en pied.
 */
export default function Sidebar({ onCloseMobile }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const initials =
    user?.nom_complet?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const groups = getNavigationItems(user, role);

  const handleLogout = () => {
    logout();
    toast.success('Deconnexion reussie.');
    onCloseMobile?.();
    navigate('/');
  };

  return (
    <aside
      className="flex flex-col h-full"
      style={{ background: 'var(--navy-2, #0f1b3d)', color: '#e2e8f0', height: '100%' }}
    >
      {/* ── Marque ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 14px', borderBottom: '1px solid rgba(255,255,255,.1)', gap: 8,
        }}
      >
        <AppLogo height={30} showText={true} />
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="sidebar-close-btn"
            aria-label="Fermer le menu"
            style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, color: '#fff', width: 30, height: 30, cursor: 'pointer', fontSize: 16 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Navigation groupee ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px 16px' }}>
        {groups.map((group) => (
          <div key={group.group} style={{ marginBottom: 4 }}>
            {group.group !== '_' && (
              <div
                style={{
                  color: 'var(--gold)', fontSize: 9, letterSpacing: '1.2px',
                  textTransform: 'uppercase', padding: '14px 12px 6px', fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {group.group}
              </div>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.path + item.label}
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={() => onCloseMobile?.()}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span style={{ fontSize: 15, flexShrink: 0, width: 18, textAlign: 'center' }}>{item.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {item.label}
                </span>
                {item.badge ? (
                  <span style={{ background: 'var(--gold)', color: '#0f1b3d', borderRadius: 20, fontSize: 9, fontWeight: 900, padding: '1px 6px' }}>
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Utilisateur ── */}
      {user && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gold)', color: '#0f1b3d', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 900, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <strong style={{ display: 'block', color: '#fff', fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.nom_complet}
            </strong>
            <span style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', fontFamily: 'var(--font-mono)' }}>
              {ROLES_LABELS?.[role] || role?.replace(/_/g, ' ')}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Deconnexion"
            aria-label="Deconnexion"
            style={{ background: 'rgba(239,68,68,.15)', border: 'none', borderRadius: 8, color: '#f87171', width: 30, height: 30, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
          >
            🚪
          </button>
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) { .sidebar-close-btn { display: none !important; } }
      `}</style>
    </aside>
  );
}
