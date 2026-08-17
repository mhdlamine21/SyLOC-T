import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const renderSidebarAtRoute = (initialRoute, role = 'BUREAU_COURRIER') => {
  useAuth.mockReturnValue({
    user: { id: 'u-1', nom_complet: 'Agent Courrier', role },
    role,
    isAuthenticated: true,
  });

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Sidebar collapsed={false} />
    </MemoryRouter>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('active uniquement Archives dossiers lorsque la route est /courrier/archives', () => {
    renderSidebarAtRoute('/courrier/archives');

    const linkCourrier = screen.getByRole('link', { name: /Courrier d'arrivée/i });
    const linkArchives = screen.getByRole('link', { name: /Archives dossiers/i });

    expect(linkArchives).toHaveClass('active');
    expect(linkCourrier).not.toHaveClass('active');
  });

  it('active uniquement Courrier d arrivée lorsque la route est /courrier', () => {
    renderSidebarAtRoute('/courrier');

    const linkCourrier = screen.getByRole('link', { name: /Courrier d'arrivée/i });
    const linkArchives = screen.getByRole('link', { name: /Archives dossiers/i });

    expect(linkCourrier).toHaveClass('active');
    expect(linkArchives).not.toHaveClass('active');
  });

  it('affiche le catalogue et la carte GPS pour le bureau du courrier', () => {
    renderSidebarAtRoute('/dashboard', 'BUREAU_COURRIER');

    expect(screen.getByRole('link', { name: /Catalogue des locaux/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Carte GPS des locaux/i })).toBeInTheDocument();
  });
});
