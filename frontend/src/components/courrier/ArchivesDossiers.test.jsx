import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ArchivesDossiers from './ArchivesDossiers';
import { getDemandes, getDossiers, changerStatutDemande, partagerDossier } from '../../api/demandes';
import { getUtilisateurs } from '../../api/comptes';

vi.mock('../../api/demandes', () => ({
  getDemandes: vi.fn(),
  getDossiers: vi.fn(),
  changerStatutDemande: vi.fn(),
  partagerDossier: vi.fn(),
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

const DEMANDES_MOCK = [
  {
    id: 'dem-arc-1',
    reference_anonyme: 'DOSSIER-D32E9639',
    statut: 'DEFAVORABLE',
    type_demande: 'VENTE_ALIMENTAIRE',
    demandeur_nom: 'Moussa Ndiaye',
    local_reference: 'LOC-001',
    date_depot: '2026-08-13T10:00:00Z',
    commentaire_dcuve: 'Dossier incomplet après relances',
  },
  {
    id: 'dem-arc-2',
    reference_anonyme: 'DOSSIER-174EE410',
    statut: 'NOUVELLE',
    type_demande: 'CONSTRUCTION_CANDIDAT',
    demandeur_nom: 'Fatou Diop',
    local_reference: 'LOC-002',
    date_depot: '2026-08-10T10:00:00Z',
  },
];

const USERS_MOCK = [
  { id: 'user-1', nom_complet: 'Agent DCUVE', role: 'AGENT_DCUVE', username: 'agent_dcuve' },
];

describe('ArchivesDossiers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDemandes.mockResolvedValue(DEMANDES_MOCK);
    getUtilisateurs.mockResolvedValue(USERS_MOCK);
    getDossiers.mockResolvedValue([
      {
        id: 'dos-1',
        demande: 'dem-arc-1',
        documents: [{ id: 'doc-1', type_label: 'Attestation', libelle: 'attest.pdf', fichier: '/attest.pdf' }],
      },
    ]);
  });

  it('affiche le registre des archives et la section d archivage', async () => {
    render(<ArchivesDossiers />);
    expect(await screen.findByText('Archivage des dossiers')).toBeInTheDocument();
    expect(screen.getByText(/Registre des dossiers archivés/i)).toBeInTheDocument();
    expect(screen.getByText('DOSSIER-D32E9639')).toBeInTheDocument();
    expect(screen.getByText('DOSSIER-174EE410')).toBeInTheDocument();
  });

  it('filtre les dossiers archivés avec la recherche', async () => {
    render(<ArchivesDossiers />);
    await screen.findByText('DOSSIER-D32E9639');

    const searchInput = screen.getByPlaceholderText(/Rechercher un dossier/i);
    fireEvent.change(searchInput, { target: { value: 'Inexistant' } });

    expect(screen.queryByText('DOSSIER-D32E9639')).not.toBeInTheDocument();
  });

  it('ouvre la modale de partage d un dossier archivé', async () => {
    partagerDossier.mockResolvedValue({});
    render(<ArchivesDossiers />);
    await screen.findByText('DOSSIER-D32E9639');

    const shareButtons = screen.getAllByRole('button', { name: /Partager/i });
    fireEvent.click(shareButtons[0]);

    expect(await screen.findByText(/Partager le dossier DOSSIER-D32E9639/i)).toBeInTheDocument();
    const submitShare = screen.getAllByRole('button', { name: /Partager/i });
    fireEvent.click(submitShare[submitShare.length - 1]);

    await waitFor(() => {
      expect(partagerDossier).toHaveBeenCalled();
    });
  });
});
