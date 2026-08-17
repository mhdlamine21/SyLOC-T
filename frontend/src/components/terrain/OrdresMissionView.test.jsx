import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OrdresMissionView from './OrdresMissionView';
import {
  getOrdresMission, demarrerOrdreMission, annulerOrdreMission, cloturerOrdreMission,
} from '../../api/terrain';

vi.mock('../../api/terrain', () => ({
  getOrdresMission: vi.fn(),
  createOrdreMission: vi.fn(),
  demarrerOrdreMission: vi.fn(),
  cloturerOrdreMission: vi.fn(),
  annulerOrdreMission: vi.fn(),
  getPlaintes: vi.fn(),
}));
vi.mock('../../api/patrimoine', () => ({ getLocaux: vi.fn() }));
vi.mock('../../api/comptes', () => ({ getUtilisateurs: vi.fn() }));
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const { getPlaintes } = await import('../../api/terrain');
const { getLocaux } = await import('../../api/patrimoine');
const { getUtilisateurs } = await import('../../api/comptes');

const ORDRES = [
  {
    id: 'om-1', reference: 'OM-2026-0001', objet: 'Controle sanitaire cantine',
    local_reference: 'LOC-A1', agent_nom: 'Agent Terrain', type_controle: 'SANITAIRE',
    priorite: 'ELEVEE', statut: 'EMIS', date_mission: '2026-01-10T08:00:00Z',
  },
  {
    id: 'om-2', reference: 'OM-2026-0002', objet: 'Verification electrique',
    local_reference: 'LOC-B2', agent_nom: 'Agent QHSE', type_controle: 'ELECTRIQUE',
    priorite: 'FAIBLE', statut: 'EN_COURS', date_mission: '2026-01-12T08:00:00Z',
  },
];

describe('OrdresMissionView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrdresMission.mockResolvedValue(ORDRES);
    getLocaux.mockResolvedValue([{ id: 'l1', reference: 'LOC-A1', designation: 'Cantine' }]);
    getUtilisateurs.mockResolvedValue([{ id: 'u1', nom_complet: 'Agent Terrain', role: 'AGENT_TERRAIN' }]);
    getPlaintes.mockResolvedValue([]);
  });

  it('affiche les ordres de mission et les indicateurs', async () => {
    render(<OrdresMissionView />);
    expect(await screen.findByText('OM-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('OM-2026-0002')).toBeInTheDocument();
    expect(screen.getByText('Ordres emis')).toBeInTheDocument();
    expect(screen.getByText('Missions en cours')).toBeInTheDocument();
  });

  it('filtre le registre par statut', async () => {
    render(<OrdresMissionView />);
    await screen.findByText('OM-2026-0001');
    fireEvent.change(screen.getByLabelText(/Statut/i), { target: { value: 'EN_COURS' } });
    await waitFor(() => {
      expect(screen.queryByText('OM-2026-0001')).not.toBeInTheDocument();
    });
    expect(screen.getByText('OM-2026-0002')).toBeInTheDocument();
  });

  it('demarre un ordre emis', async () => {
    demarrerOrdreMission.mockResolvedValue({});
    render(<OrdresMissionView />);
    await screen.findByText('OM-2026-0001');
    const boutons = screen.getAllByTitle('Demarrer la mission');
    fireEvent.click(boutons[0]);
    await waitFor(() => expect(demarrerOrdreMission).toHaveBeenCalled());
  });

  it('exige un compte rendu pour cloturer une mission', async () => {
    render(<OrdresMissionView />);
    await screen.findByText('OM-2026-0002');
    fireEvent.click(screen.getAllByTitle('Cloturer avec compte rendu')[0]);
    const zone = await screen.findByLabelText(/Compte rendu de mission/i);
    fireEvent.change(zone, { target: { value: 'Local conforme apres passage.' } });
    fireEvent.click(screen.getByText('Enregistrer le compte rendu'));
    await waitFor(() => expect(cloturerOrdreMission).toHaveBeenCalledWith('om-2', 'Local conforme apres passage.'));
  });

  it('permet d annuler un ordre non execute', async () => {
    annulerOrdreMission.mockResolvedValue({});
    render(<OrdresMissionView />);
    await screen.findByText('OM-2026-0001');
    fireEvent.click(screen.getAllByTitle("Annuler l'ordre")[0]);
    await waitFor(() => expect(annulerOrdreMission).toHaveBeenCalled());
  });
});
