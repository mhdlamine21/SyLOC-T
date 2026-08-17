import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AgentTerrainView from './AgentTerrainView';

const mockPlaintes = [
  {
    id: 1,
    type: 'TECHNIQUE',
    description: 'Fuite d eau sous le comptoir',
    localisation_libre: 'Campus VCN - Bloc B',
    urgence: 'MOYENNE',
    statut: 'OUVERTE',
    date_creation: '2026-08-16T12:00:00Z',
  },
  {
    id: 2,
    type: 'DENONCIATION_ILLEGALE',
    description: 'Vente sans bail declare',
    localisation_libre: 'Allee centrale',
    urgence: 'ELEVEE',
    statut: 'RESOLUE',
    date_creation: '2026-08-16T14:00:00Z',
  },
];

vi.mock('../../api/terrain', () => ({
  getPlaintes: vi.fn(() => Promise.resolve(mockPlaintes)),
  updatePlainte: vi.fn(() => Promise.resolve({})),
}));

describe('AgentTerrainView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les statistiques et les constats de la brigade terrain', async () => {
    render(<AgentTerrainView />);

    expect(await screen.findByText('Constats & missions de terrain')).toBeInTheDocument();
    expect(screen.getByText('Campus VCN - Bloc B')).toBeInTheDocument();
    expect(screen.getByText('Allee centrale')).toBeInTheDocument();
  });

  it('ouvre la modale de detail au clic sur le bouton consulter', async () => {
    render(<AgentTerrainView />);

    await screen.findByText('Constats & missions de terrain');
    const boutonsConsulter = screen.getAllByTitle(/Consulter/i);
    fireEvent.click(boutonsConsulter[0]);

    expect(await screen.findByText('Détail du constat')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Vente sans bail declare')).toBeInTheDocument();
  });
});
