import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

/**
 * Coquille applicative : sidebar fixe (desktop) + barre superieure fine,
 * structure identique aux back-offices de reference.
 */
export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Sidebar fixe (desktop) / drawer (mobile) ── */}
      <div
        className={`app-shell-sidebar ${mobileOpen ? 'open' : ''}`}
        style={{
          position: 'fixed', top: 0, bottom: 0, left: 0, width: 258, zIndex: 110,
          transition: 'transform .25s cubic-bezier(.16,1,.3,1)',
        }}
      >
        <Sidebar onCloseMobile={close} />
      </div>

      {/* ── Voile mobile ── */}
      {mobileOpen && (
        <div
          onClick={close}
          className="app-shell-overlay"
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,61,.6)', backdropFilter: 'blur(3px)', zIndex: 105 }}
        />
      )}

      {/* ── Zone principale ── */}
      <div className="app-shell-main" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopHeader onToggleMobileSidebar={() => setMobileOpen((o) => !o)} />
        <main id="main" style={{ flex: 1, minWidth: 0, padding: 'clamp(14px,2.2vw,24px)' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .app-shell-main { margin-left: 258px; }
          .app-shell-overlay { display: none !important; }
        }
        @media (max-width: 1023px) {
          .app-shell-sidebar { transform: translateX(-100%); box-shadow: none; }
          .app-shell-sidebar.open { transform: translateX(0); box-shadow: 5px 0 25px rgba(0,0,0,.3); }
        }
      `}</style>
    </div>
  );
}
