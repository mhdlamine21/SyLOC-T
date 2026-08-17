import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLogo from './AppLogo';
import { getNavigationItems } from '../../utils/navigation';
import { ROLES_LABELS } from '../../utils/constants';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

/**
 * Sidebar back-office : bloc marque, navigation groupee par domaine metier,
 * bloc utilisateur en pied.
 */
export default function Sidebar({ onCloseMobile, collapsed, onToggleCollapse }) {
  const { user, role } = useAuth();

  const initials =
    user?.nom_complet?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const groups = getNavigationItems(user, role);

  return (
    <aside
      className="flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg, var(--sidebar-grad-start) 0%, var(--sidebar-grad-end) 100%)', color: 'var(--text-on-navy)', height: '100%' }}
    >
      {/* ── Marque ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: collapsed ? '14px 0' : '14px 14px', borderBottom: '1px solid rgba(255,255,255,.1)', gap: 8,
          flexDirection: collapsed ? 'column' : 'row'
        }}
      >
        <div style={{ display: collapsed ? 'none' : 'block' }}>
          <AppLogo height={30} showText={true} variant="dark" />
        </div>
        {collapsed && (
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--navy)', color: 'var(--text-on-navy)', display: 'grid', placeItems: 'center', fontWeight: 900 }}>
            S
          </div>
        )}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="sidebar-close-btn"
            aria-label="Fermer le menu"
            style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, color: 'var(--text-on-navy)', width: 30, height: 30, cursor: 'pointer', fontSize: 16 }}
          >
            ✕
          </button>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="sidebar-toggle-btn"
            aria-label="Réduire le menu"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: 4 }}
          >
            {collapsed ? <KeyboardDoubleArrowRightIcon fontSize="small" /> : <KeyboardDoubleArrowLeftIcon fontSize="small" />}
          </button>
        )}
      </div>

      {/* ── Navigation groupee ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '10px 4px 16px' : '10px 8px 16px' }}>
        {groups.map((group) => (
          <div key={group.group} style={{ marginBottom: 4 }}>
            {group.group !== '_' && !collapsed && (
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
            {group.group !== '_' && collapsed && (
              <div style={{ height: 14 }} />
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.path + item.label}
                to={item.path}
                end={true}
                aria-label={item.label}
                data-tooltip={collapsed ? item.label : undefined}
                onClick={() => onCloseMobile?.()}
                className={({ isActive }) => `sidebar-nav-item ${collapsed ? 'sidebar-nav-item--collapsed' : ''} ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px 0' : '10px 12px' }}
              >
                <span style={{ fontSize: 15, flexShrink: 0, width: 18, textAlign: 'center' }}>{item.icon}</span>
                {!collapsed && (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge ? (
                  <span style={{ background: 'var(--gold)', color: 'var(--text-on-gold)', borderRadius: 20, fontSize: 9, fontWeight: 900, padding: '1px 6px' }}>
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
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div
            className={collapsed ? 'sidebar-nav-item--collapsed' : ''}
            data-tooltip={collapsed ? user.nom_complet : undefined}
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gold)', color: 'var(--text-on-gold)', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 900, flexShrink: 0 }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <strong style={{ display: 'block', color: 'var(--text-on-navy)', fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.nom_complet}
              </strong>
              <span style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', fontFamily: 'var(--font-mono)' }}>
                {ROLES_LABELS?.[role] || role?.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) { .sidebar-close-btn { display: none !important; } }
        @media (max-width: 1023px) { .sidebar-toggle-btn { display: none !important; } }
      `}</style>
    </aside>
  );
}
