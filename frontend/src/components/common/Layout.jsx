import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeDrawer = () => setMobileSidebarOpen(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* ── TopHeader (Contient le Menu Horizontal sur grand écran et le bouton Hamburger sur mobile) ── */}
      <TopHeader onToggleMobileSidebar={() => setMobileSidebarOpen(o => !o)} />

      {/* ── Sidebar Rétractable (Drawer) sur Mobile/Tablette (< 1024px) ── */}
      {mobileSidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,27,61,.60)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={closeDrawer}
        />
      )}

      <div
        className={`mobile-sidebar-drawer ${mobileSidebarOpen ? 'open' : ''}`}
        style={{
          position: 'fixed', top: 0, bottom: 0, left: 0,
          width: 270, zIndex: 110,
          transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: mobileSidebarOpen ? '5px 0 25px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <Sidebar onCloseMobile={closeDrawer} />
      </div>

      {/* ── Main Content Area ── */}
      <main id="main" style={{ flex: 1, minWidth: 0, width: '100%' }}>
        <Outlet />
      </main>

      <style>{`
        /* Sur grand écran (>= 1024px), le drawer mobile reste toujours masqué */
        @media (min-width: 1024px) {
          .mobile-sidebar-drawer { display: none !important; }
        }
      `}</style>
    </div>
  );
}
