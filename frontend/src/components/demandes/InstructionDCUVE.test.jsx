import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InstructionDCUVE from './InstructionDCUVE';
import { getDemandes, getDossiers, changerStatutDemande, getDemandesParLocal } from '../../api/demandes';

vi.mock('../../api/demandes', () => ({
  getDemandes: vi.fn(),
  getDossiers: vi.fn(),
  changerStatutDemande: vi.fn(),
  enregistrerAvisSanitaire: vi.fn(),
  getDemandesParLocal: vi.fn(),
  creerLotCommission: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const MOCK_DEMANDES = [
  {
    id: 1,
    reference_anonyme: 'DEM-2026-0001',
    statut: 'CONTROLE_RECEVABILITE',
    type_demande: 'VENTE_PRODUIT',
    date_depot: '2026-08-14T10:00:00Z',
    local: 'Kiosque A',
    nb_renvois: 0,
    avis_sanitaire_externe: 'EN_ATTENTE',
  },
  {
    id: 2,
    reference_anonyme: 'DEM-2026-0002',
    statut: 'CONTROLE_RECEVABILITE',
    type_demande: 'PRESTATION_SERVICE',
    date_depot: '2026-08-12T10:00:00Z',
    local: 'Boutique B',
    nb_renvois: 1,
    derniere_note_complement: 'Ajouter pièce CNI',
  },
  {
    id: 3,
    reference_anonyme: 'DEM-2026-0003',
    statut: 'CONTROLE_RECEVABILITE',
    type_demande: 'RENOVATION',
    date_depot: '2026-08-10T10:00:00Z',
    local: 'Espace C',
    nb_renvois: 0,
  },
];

describe('InstructionDCUVE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDemandes.mockResolvedValue(MOCK_DEMANDES);
    getDossiers.mockResolvedValue([]);
    getDemandesParLocal.mockResolvedValue([]);
  });

  it('affiche le header et tous les types de dossiers (alimentaire, prestation, travaux) directement sans barres de filtres', async () => {
    render(<InstructionDCUVE />);
    expect(await screen.findByText('Instruction des dossiers de candidature')).toBeInTheDocument();
    expect(screen.getByText('DEM-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('DEM-2026-0002')).toBeInTheDocument();
    expect(screen.getByText('DEM-2026-0003')).toBeInTheDocument();
    expect(screen.getByText('Rénovation de local')).toBeInTheDocument();
    expect(screen.getByText('Prestation de services')).toBeInTheDocument();
    expect(screen.getByText('Vente de produits')).toBeInTheDocument();
  });

  it('ouvre la modale d instruction pour un dossier', async () => {
    render(<InstructionDCUVE />);
    await screen.findByText('DEM-2026-0001');

    const boutons = screen.getAllByRole('button', { name: /Instruire/i });
    fireEvent.click(boutons[0]);

    expect(await screen.findByText(/Instruction administrative du dossier/i)).toBeInTheDocument();
  });

  it('affiche les dossiers concurrents par local et permet de constituer un lot', async () => {
    getDemandesParLocal.mockResolvedValue([
      {
        local_id: 10,
        local_reference: 'LOC-002',
        local_designation: 'Kiosque multiservices',
        nb_candidatures: 2,
        en_lot: false,
        demandes: [MOCK_DEMANDES[0], MOCK_DEMANDES[1]],
      },
    ]);

    render(<InstructionDCUVE />);
    const tabConcurrence = screen.getByRole('button', { name: /Concurrence par local/i });
    fireEvent.click(tabConcurrence);

    expect(await screen.findByText('LOC-002')).toBeInTheDocument();
    expect(screen.getByText('2 candidatures')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Transmettre le lot en Commission/i })).toBeInTheDocument();
  });

  it('masque les dossiers au statut MITIGEE_COMPLEMENT car ils sont chez le candidat', async () => {
    getDemandes.mockResolvedValue([
      ...MOCK_DEMANDES,
      {
        id: 4,
        reference_anonyme: 'DEM-2026-0004',
        statut: 'MITIGEE_COMPLEMENT',
        type_demande: 'LOCAL_ARTISANAL',
        date_depot: '2026-08-13T10:00:00Z',
        local_reference: 'LOC-004',
      },
    ]);

    render(<InstructionDCUVE />);
    await screen.findByText('DEM-2026-0001');

    expect(screen.queryByText('DEM-2026-0004')).not.toBeInTheDocument();
  });

  it('exclut les dossiers MITIGEE_COMPLEMENT de la vue de concurrence par local', async () => {
    getDemandesParLocal.mockResolvedValue([
      {
        local_id: 11,
        local_reference: 'LOC-003',
        local_designation: 'Boutique C',
        nb_candidatures: 2,
        en_lot: false,
        demandes: [
          MOCK_DEMANDES[0],
          {
            id: 5,
            reference_anonyme: 'DEM-2026-0005',
            statut: 'MITIGEE_COMPLEMENT',
            type_demande: 'LOCAL_ARTISANAL',
            date_depot: '2026-08-13T10:00:00Z',
            local_reference: 'LOC-003',
          },
        ],
      },
    ]);

    render(<InstructionDCUVE />);
    const tabConcurrence = screen.getByRole('button', { name: /Concurrence par local/i });
    fireEvent.click(tabConcurrence);

    // Comme 1 seule demande active reste sur LOC-003, le groupe n'est pas en concurrence (il faut >= 2 demandes actives)
    expect(screen.queryByText('LOC-003')).not.toBeInTheDocument();
  });
});
