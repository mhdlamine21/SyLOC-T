import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CommissionVote from './CommissionVote';
import {
  getDemandes,
  getLots,
  getDelegationCommission,
  getSyntheseVotes,
  createVoteCommission,
} from '../../api/demandes';

vi.mock('../../api/demandes', () => ({
  getDemandes: vi.fn(),
  getLots: vi.fn(),
  getDelegationCommission: vi.fn(),
  getSyntheseVotes: vi.fn(),
  createVoteCommission: vi.fn(),
  cloturerLocalDemande: vi.fn(),
}));

vi.mock('../ui', () => ({
  useConfirm: () => vi.fn(),
}));

describe('CommissionVote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les dossiers soumis à la commission et ouvre la délibération claire', async () => {
    getDemandes.mockResolvedValue([
      {
        id: 'demande-1234-uuid',
        reference_anonyme: 'DEM-2026-0042',
        type_demande: 'ATTRIBUTION_CANTINE',
        statut: 'EN_COMMISSION',
        date_depot: '2026-08-01T10:00:00Z',
        local: 'LOC-RESTO-01',
        demandeur_nom: 'Fatou Sow',
        notes_admin: 'Dossier complet et conforme aux normes d hygiène',
      },
    ]);

    getLots.mockResolvedValue([]);
    getDelegationCommission.mockResolvedValue({ active: false });

    getSyntheseVotes.mockResolvedValue({
      reference: 'DEM-2026-0042',
      total_votes: 2,
      favorables: 2,
      defavorables: 0,
      abstentions: 0,
      membres_actifs: 5,
      quorum_requis: 3,
      quorum_atteint: false,
      sens_majoritaire: 'FAVORABLE',
      note_moyenne: 4.5,
      votes: [],
    });

    createVoteCommission.mockResolvedValue({});

    render(
      <BrowserRouter>
        <CommissionVote />
      </BrowserRouter>
    );

    expect(await screen.findByText('DEM-2026-0042')).toBeInTheDocument();
    expect(screen.getByText('ATTRIBUTION CANTINE')).toBeInTheDocument();

    const voterBtn = screen.getByRole('button', { name: /Voter en commission/i });
    fireEvent.click(voterBtn);

    // La modale doit s'ouvrir avec une référence propre et non un UUID brut
    expect(await screen.findByText(/Délibération Commission — DEM-2026-0042/i)).toBeInTheDocument();

    // La fiche du dossier doit être visible
    expect(screen.getAllByText(/LOC-RESTO-01/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Dossier complet et conforme aux normes/i).length).toBeGreaterThanOrEqual(1);

    // Les choix de vote doivent être présents
    expect(screen.getByText(/Vote Favorable/i)).toBeInTheDocument();
    expect(screen.getByText(/Vote Défavorable/i)).toBeInTheDocument();

    // Soumission du vote
    const submitBtn = screen.getByRole('button', { name: /Confirmer & Enregistrer mon Vote/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createVoteCommission).toHaveBeenCalledWith(
        expect.objectContaining({
          demande: 'demande-1234-uuid',
          avis: 'FAVORABLE',
        })
      );
    });
  });
});
