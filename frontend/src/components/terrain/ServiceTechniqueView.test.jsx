import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ServiceTechniqueView from './ServiceTechniqueView';
import {
  getPlaintes, updatePlainte,
  getInterventions, createIntervention,
  demarrerIntervention, cloturerIntervention, annulerIntervention,
} from '../../api/terrain';
import { getUtilisateurs } from '../../api/comptes';

vi.mock('../../api/terrain', () => ({
  getPlaintes: vi.fn(),
  updatePlainte: vi.fn(),
  getInterventions: vi.fn(),
  createIntervention: vi.fn(),
  demarrerIntervention: vi.fn(),
  cloturerIntervention: vi.fn(),
  annulerIntervention: vi.fn(),
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

const MOCK_PLAINTES = [
  {
    id: 'pl-1',
    local: 'loc-1',
    local_reference: 'LOC-001',
    description: 'Court-circuit tableau électrique cantine',
    urgence: 'ELEVEE',
    statut: 'OUVERTE',
    type: 'TECHNIQUE',
    date_creation: '2026-08-10T10:00:00Z',
  },
  {
    id: 'pl-2',
    local: 'loc-2',
    local_reference: 'LOC-002',
    description: 'Fuite robinet salle d eau',
    urgence: 'MOYENNE',
    statut: 'RESOLUE',
    type: 'TECHNIQUE',
    date_creation: '2026-08-08T09:00:00Z',
  },
];

const MOCK_INTERVENTIONS = [
  {
    id: 'iv-1',
    local: 'loc-1',
    local_reference: 'LOC-001',
    type_intervention: 'CURATIVE',
    technicien: 'u-1',
    technicien_nom: 'Moussa Diallo (Électricien)',
    description: 'Remplacement disjoncteur',
    statut: 'PLANIFIEE',
    date_planifiee: '2026-08-17T10:00:00Z',
  },
  {
    id: 'iv-2',
    local: 'loc-2',
    local_reference: 'LOC-002',
    type_intervention: 'URGENCE',
    technicien: 'u-2',
    technicien_nom: 'Abdou Fall (Plombier)',
    description: 'Réparation tuyau',
    statut: 'EN_COURS',
    date_planifiee: '2026-08-16T08:00:00Z',
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
  {
    id: 'u-2',
    nom_complet: 'Abdou Fall',
    username: 'abdou_plomb',
    specialite: 'Plombier',
    role: 'SERVICE_TECHNIQUE',
  },
  {
    id: 'u-3',
    nom_complet: 'Ousmane Ba',
    username: 'ousmane_clim',
    specialite: 'Frigoriste / Climatisation',
    role: 'SERVICE_TECHNIQUE',
  },
];

describe('ServiceTechniqueView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPlaintes.mockResolvedValue(MOCK_PLAINTES);
    getInterventions.mockResolvedValue(MOCK_INTERVENTIONS);
    getUtilisateurs.mockResolvedValue(MOCK_TECHNICIENS);
  });

  it('affiche les signalements et la mention de signalement traité', async () => {
    render(<ServiceTechniqueView />);
    expect(await screen.findByText(/Court-circuit tableau/i)).toBeInTheDocument();
    expect(screen.getByText('LOC-001')).toBeInTheDocument();
  });

  it('ouvre la modale avec la liste des techniciens et leurs spécialités et disponibilités', async () => {
    render(<ServiceTechniqueView />);
    const btnPlanifier = await screen.findByRole('button', { name: /Planifier/i });
    fireEvent.click(btnPlanifier);

    expect(screen.getByText(/Sélectionner un technicien qualifié/i)).toBeInTheDocument();
    expect(screen.getByText('Moussa Diallo')).toBeInTheDocument();
    expect(screen.getByText('Abdou Fall')).toBeInTheDocument();
    expect(screen.getByText('Ousmane Ba')).toBeInTheDocument();
  });

  it('permet de filtrer et sélectionner un électricien puis confirmer la planification sans champ coût', async () => {
    createIntervention.mockResolvedValue({ id: 'iv-3' });
    updatePlainte.mockResolvedValue({ id: 'pl-1', statut: 'EN_COURS_TRAITEMENT' });

    render(<ServiceTechniqueView />);
    const btnPlanifier = await screen.findByRole('button', { name: /Planifier/i });
    fireEvent.click(btnPlanifier);

    const btnElec = screen.getByRole('button', { name: /Électricien/i });
    fireEvent.click(btnElec);

    const cardMoussa = screen.getByTestId('technicien-card-u-1');
    fireEvent.click(cardMoussa);

    const descInput = screen.getByPlaceholderText(/Détaillez les travaux/i);
    fireEvent.change(descInput, { target: { value: 'Intervention sur tableau principal' } });

    expect(screen.queryByLabelText(/Coût estimé/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/50000/i)).not.toBeInTheDocument();

    const btnConfirmer = screen.getByRole('button', { name: /Confirmer la planification/i });
    fireEvent.click(btnConfirmer);

    await waitFor(() => {
      expect(createIntervention).toHaveBeenCalledWith(
        expect.objectContaining({
          local: 'loc-1',
          technicien: 'u-1',
          description: 'Intervention sur tableau principal',
        })
      );
      expect(createIntervention.mock.calls[0][0].cout_estime).toBeUndefined();
    });
  });

  it('ne comporte aucun champ de coût lors de la clôture', async () => {
    render(<ServiceTechniqueView />);
    const tabInterv = screen.getByRole('button', { name: /Interventions en cours/i });
    fireEvent.click(tabInterv);

    const btnCloturer = await screen.findByRole('button', { name: /Clôturer/i });
    fireEvent.click(btnCloturer);

    expect(screen.getByText(/Rapport d'intervention technique/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Coût réel/i)).not.toBeInTheDocument();
  });
});
