import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ServiceJuridiqueView from './ServiceJuridiqueView';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('./BauxARediger', () => ({
  default: () => <div>Composant Baux A Rediger</div>,
}));
vi.mock('./PortefeuilleContrats', () => ({
  default: () => <div>Composant Portefeuille Contrats</div>,
}));
vi.mock('./ModelesContrats', () => ({
  default: () => <div>Composant Modeles Contrats</div>,
}));

describe('ServiceJuridiqueView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le bouton de retour au tableau de bord et navigue vers /dashboard', () => {
    render(
      <MemoryRouter>
        <ServiceJuridiqueView />
      </MemoryRouter>
    );

    const retourBtn = screen.getByText(/Retour au tableau de bord/i);
    expect(retourBtn).toBeInTheDocument();

    fireEvent.click(retourBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('permet de changer d onglet vers Portefeuille et Modeles', () => {
    render(
      <MemoryRouter>
        <ServiceJuridiqueView />
      </MemoryRouter>
    );

    expect(screen.getByText('Composant Baux A Rediger')).toBeInTheDocument();

    const portefeuilleTab = screen.getByText('Portefeuille contractuel');
    fireEvent.click(portefeuilleTab);
    expect(screen.getByText('Composant Portefeuille Contrats')).toBeInTheDocument();

    const modelesTab = screen.getByText("Modèles d'actes");
    fireEvent.click(modelesTab);
    expect(screen.getByText('Composant Modeles Contrats')).toBeInTheDocument();
  });
});
