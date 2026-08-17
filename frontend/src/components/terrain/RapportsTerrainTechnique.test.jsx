import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RapportsTerrainTechnique from './RapportsTerrainTechnique';
import { getRapportsVisite, createIntervention } from '../../api/terrain';
import { getUtilisateurs } from '../../api/comptes';

vi.mock('../../api/terrain', () => ({
  getRapportsVisite: vi.fn(),
  createIntervention: vi.fn(),
}));

vi.mock('../../api/comptes', () => ({
  getUtilisateurs: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const MOCK_RAPPORTS = [
  {
    id: 'rv-1',
    reference: 'RV-2026-0012',
    local: 'loc-1',
    local_reference: 'LOC-001',
    agent_nom: 'Agent Amadou Sow',
    date_visite: '2026-08-15T14:30:00Z',
    conforme: false,
    constats: 'Câbles dénudés et disjoncteur défectueux sur le tableau B.',
    recommandations: 'Dépêcher un électricien d urgence pour sécurisation.',
  },
  {
    id: 'rv-2',
    reference: 'RV-2026-0013',
    local: 'loc-2',
    local_reference: 'LOC-002',
    agent_nom: 'Agent Fatou Diop',
    date_visite: '2026-08-14T11:00:00Z',
    conforme: true,
    constats: 'Installation sanitaire et compteurs en ordre.',
    recommandations: '',
  },
];

const MOCK_TECHNICIENS = [
  {
    id: 'u-1',
    nom_complet: 'Moussa Diallo',
    username: 'moussa_elec',
    specialite: 'Électricien',
    role: 'SERVICE_TECHNIQUE',
  },
];

describe('RapportsTerrainTechnique', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRapportsVisite.mockResolvedValue(MOCK_RAPPORTS);
    getUtilisateurs.mockResolvedValue(MOCK_TECHNICIENS);
  });

  it('affiche la liste des rapports de visite de l agent de terrain', async () => {
    render(<RapportsTerrainTechnique />);
    expect(await screen.findByText('RV-2026-0012')).toBeInTheDocument();
    expect(screen.getByText(/Câbles dénudés et disjoncteur défectueux/i)).toBeInTheDocument();
    expect(screen.getByText('Agent Amadou Sow')).toBeInTheDocument();
    expect(screen.getByText(/⚠ Non-conforme/i)).toBeInTheDocument();
  });

  it('ouvre la modale de détails', async () => {
    render(<RapportsTerrainTechnique />);
    const btnDetails = await screen.findAllByRole('button', { name: /Détails/i });
    fireEvent.click(btnDetails[0]);

    expect(screen.getByText(/Détail du rapport de visite de l'agent de terrain/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Dépêcher un électricien d urgence/i).length).toBeGreaterThanOrEqual(1);
  });

  it('permet de planifier une intervention directement depuis le rapport', async () => {
    createIntervention.mockResolvedValue({ id: 'iv-new' });

    render(<RapportsTerrainTechnique />);
    const btnsPlanifier = await screen.findAllByRole('button', { name: /Planifier intervention/i });
    fireEvent.click(btnsPlanifier[0]);

    expect(screen.getByText(/Sélectionner un technicien qualifié/i)).toBeInTheDocument();

    const cardTech = screen.getByTestId('technicien-card-u-1');
    fireEvent.click(cardTech);

    const btnConfirmer = screen.getByRole('button', { name: /Confirmer la planification/i });
    fireEvent.click(btnConfirmer);

    await waitFor(() => {
      expect(createIntervention).toHaveBeenCalledWith(
        expect.objectContaining({
          local: 'loc-1',
          technicien: 'u-1',
        })
      );
    });
  });
});
