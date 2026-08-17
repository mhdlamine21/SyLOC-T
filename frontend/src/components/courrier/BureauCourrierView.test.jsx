import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BureauCourrierView from './BureauCourrierView';
import { changerStatutDemande, getDemandes, getDossiers } from '../../api/demandes';

vi.mock('../../api/demandes', () => ({
  getDemandes: vi.fn(),
  getDossiers: vi.fn(),
  changerStatutDemande: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const DEMANDES_MOCK = [
  {
    id: 'dem-1',
    reference_anonyme: 'PLI-2026-001',
    statut: 'NOUVELLE',
    type_demande: 'COMMERCE',
    demandeur_nom: 'Mamadou Diallo',
    local_reference: 'LOC-001',
    date_depot: '2026-08-10T10:00:00Z',
    description_projet: 'Kiosque multiservices',
    nb_renvois: 0,
  },
  {
    id: 'dem-2',
    reference_anonyme: 'PLI-2026-002',
    statut: 'MITIGEE_COMPLEMENT',
    type_demande: 'RESTAURATION',
    demandeur_nom: 'Fatou Sow',
    local_reference: 'LOC-002',
    date_depot: '2026-08-01T08:00:00Z',
    description_projet: 'Restaurant universitaire annexe',
    nb_renvois: 1,
    derniere_note_complement: 'Copie CNI manquante',
  },
  {
    id: 'dem-3',
    reference_anonyme: 'PLI-2026-003',
    statut: 'NOUVELLE',
    type_demande: 'COMMERCE',
    demandeur_nom: 'Awa Diop',
    local_reference: 'LOC-003',
    date_depot: '2026-08-05T10:00:00Z',
    nb_renvois: 1,
  },
  {
    id: 'dem-4',
    reference_anonyme: 'PLI-2026-004',
    statut: 'CONTROLE_RECEVABILITE',
    type_demande: 'COMMERCE',
    demandeur_nom: 'Moussa Ndiaye',
    local_reference: 'LOC-004',
    date_depot: '2026-07-20T10:00:00Z',
  },
];

describe('BureauCourrierView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDemandes.mockResolvedValue(DEMANDES_MOCK);
    getDossiers.mockResolvedValue([
      {
        id: 'dos-1',
        demande: 'dem-1',
        documents: [
          { id: 'doc-1', type_label: 'Pièce d’identité', libelle: 'cni.pdf', fichier: '/media/cni.pdf' },
        ],
      },
    ]);
  });

  it('affiche uniquement les plis à traiter (statut NOUVELLE) et masque les dossiers en attente de complément candidat', async () => {
    render(<BureauCourrierView />);
    expect(await screen.findByText('Registre du courrier d’arrivée')).toBeInTheDocument();
    expect(screen.getByText('Bannette d’arrivée')).toBeInTheDocument();
    expect(screen.getByText('PLI-2026-001')).toBeInTheDocument();
    expect(screen.getByText('PLI-2026-003')).toBeInTheDocument();
    // Les dossiers en attente de complément candidat (MITIGEE_COMPLEMENT) ne doivent pas apparaître
    expect(screen.queryByText('PLI-2026-002')).not.toBeInTheDocument();
    expect(screen.queryByText('PLI-2026-004')).not.toBeInTheDocument();
  });

  it('filtre les plis avec la recherche textuelle', async () => {
    render(<BureauCourrierView />);
    await screen.findByText('PLI-2026-001');

    const searchInput = screen.getByPlaceholderText(/Rechercher une référence/i);
    fireEvent.change(searchInput, { target: { value: 'Awa' } });

    expect(screen.queryByText('PLI-2026-001')).not.toBeInTheDocument();
    expect(screen.getByText('PLI-2026-003')).toBeInTheDocument();
  });

  it('ouvre la modale et transmet un dossier à la DCUVE', async () => {
    changerStatutDemande.mockResolvedValue({});
    render(<BureauCourrierView />);
    await screen.findByText('PLI-2026-001');

    // PLI-2026-003 a date_depot: 05/08 (plus ancien que PLI-2026-001: 10/08)
    const boutonsTraiter = screen.getAllByRole('button', { name: /Traiter & orienter le pli/i });
    fireEvent.click(boutonsTraiter[0]);

    expect(await screen.findByText(/Traitement du dossier PLI-2026-003/i)).toBeInTheDocument();
    expect(screen.getByText('Pièces justificatives fournies')).toBeInTheDocument();

    const boutonValider = screen.getByRole('button', { name: /Transmettre à la DCUVE/i });
    fireEvent.click(boutonValider);

    await waitFor(() => {
      expect(changerStatutDemande).toHaveBeenCalledWith(
        'dem-3',
        'CONTROLE_RECEVABILITE',
        '',
      );
    });
  });

  it('masque l option rejet direct si le dossier a 1 ou 0 renvoi', async () => {
    render(<BureauCourrierView />);
    await screen.findByText('PLI-2026-001');

    const boutonsTraiter = screen.getAllByRole('button', { name: /Traiter & orienter le pli/i });
    fireEvent.click(boutonsTraiter[0]);

    expect(await screen.findByText(/Traitement du dossier PLI-2026-003/i)).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /dossier irrecevable/i })).not.toBeInTheDocument();
  });

  it('affiche l option rejet direct uniquement si le dossier a plus d un renvoi', async () => {
    const demandesAvecMultiplesRenvois = [
      {
        id: 'dem-multi',
        reference_anonyme: 'PLI-2026-MULTI',
        statut: 'NOUVELLE',
        type_demande: 'COMMERCE',
        demandeur_nom: 'Ousmane Fall',
        local_reference: 'LOC-004',
        date_depot: '2026-08-01T08:00:00Z',
        nb_renvois: 2,
      },
    ];
    getDemandes.mockResolvedValue(demandesAvecMultiplesRenvois);
    render(<BureauCourrierView />);
    await screen.findByText('PLI-2026-MULTI');

    const boutonsTraiter = screen.getAllByRole('button', { name: /Traiter & orienter le pli/i });
    fireEvent.click(boutonsTraiter[0]);

    expect(await screen.findByText(/Traitement du dossier PLI-2026-MULTI/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /dossier irrecevable/i })).toBeInTheDocument();
  });

  it('ouvre la modale et affiche les documents même si fichier ou libellé est null sans planter', async () => {
    getDossiers.mockResolvedValue([
      {
        id: 'dos-1',
        demande: 'dem-1',
        documents: [
          { id: 'doc-null', type_label: 'Document Sans Fichier', libelle: null, fichier: null },
        ],
      },
    ]);

    render(<BureauCourrierView />);
    await screen.findByText('PLI-2026-001');

    const boutonsTraiter = screen.getAllByRole('button', { name: /Traiter & orienter le pli/i });
    fireEvent.click(boutonsTraiter[1]); // dem-1

    expect(await screen.findByText(/Traitement du dossier PLI-2026-001/i)).toBeInTheDocument();
    expect(screen.getByText('Document Sans Fichier')).toBeInTheDocument();
    expect(screen.getByText('Document')).toBeInTheDocument();
  });
});

