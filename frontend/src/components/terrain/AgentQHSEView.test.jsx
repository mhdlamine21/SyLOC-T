import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AgentQHSEView from './AgentQHSEView';

const mockInspections = [
  {
    id: 1,
    local_reference: 'LOC-VCN-01',
    type_controle: 'SANITAIRE',
    est_conforme: true,
    note_sanitaire: 9,
    date_visite: '2026-08-16T10:00:00Z',
    observations: 'Cantine très propre, chaîne du froid respectée.',
  },
];

const mockMissions = [
  {
    id: 101,
    reference: 'OM-2026-001',
    objet: 'Contrôle inopiné hygiène des denrées',
    agent_nom: 'Ibrahima Fall',
    statut: 'EMIS',
    date_mission: '2026-08-16T08:00:00Z',
  },
];

const mockLocaux = [
  { id: '111', reference: 'LOC-VCN-01', localisation: 'Pavillon A', type_local: 'RESTAURATION' },
];

vi.mock('../../api/terrain', () => ({
  getInspections: vi.fn(() => Promise.resolve(mockInspections)),
  createInspection: vi.fn(() => Promise.resolve({ id: 2 })),
  getSanctions: vi.fn(() => Promise.resolve([])),
  createSanction: vi.fn(() => Promise.resolve({})),
  getOrdresMission: vi.fn(() => Promise.resolve(mockMissions)),
  demarrerOrdreMission: vi.fn(() => Promise.resolve({ id: 101, statut: 'EN_COURS' })),
  cloturerOrdreMission: vi.fn(() => Promise.resolve({ id: 101, statut: 'EXECUTE' })),
  getRapportsVisite: vi.fn(() => Promise.resolve([])),
  creerRapportVisite: vi.fn(() => Promise.resolve({})),
  transmettreRapportVisite: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../../api/patrimoine', () => ({
  getLocaux: vi.fn(() => Promise.resolve(mockLocaux)),
}));

describe('AgentQHSEView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les statistiques et les onglets de l espace Agent QHSE', async () => {
    render(<AgentQHSEView />);

    expect(await screen.findByText('Espace Agent QHSE')).toBeInTheDocument();
    expect(screen.getByText('Inspections réalisées')).toBeInTheDocument();
    expect(screen.getByText('LOC-VCN-01')).toBeInTheDocument();
  });

  it('permet de basculer sur l onglet Ordres de mission et afficher les missions', async () => {
    render(<AgentQHSEView />);

    await screen.findByText('Espace Agent QHSE');
    const tabMissions = screen.getByRole('button', { name: /Ordres de mission/i });
    fireEvent.click(tabMissions);

    expect(await screen.findByText('OM-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Démarrer')).toBeInTheDocument();
  });
});
