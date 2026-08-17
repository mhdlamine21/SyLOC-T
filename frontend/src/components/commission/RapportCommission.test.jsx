import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RapportCommission from './RapportCommission';
import { getVotes, getDemandes } from '../../api/demandes';
import { getMembresCommission } from '../../api/comptes';

vi.mock('../../api/demandes', () => ({
  getVotes: vi.fn(),
  getDemandes: vi.fn(),
}));

vi.mock('../../api/comptes', () => ({
  getMembresCommission: vi.fn(),
}));

describe('RapportCommission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le candidat ayant reçu le plus de votes pour un local en concurrence', async () => {
    getMembresCommission.mockResolvedValue([
      { id: 1, actif: true, utilisateur: { nom_complet: 'Agent DCUVE' } },
    ]);

    getDemandes.mockResolvedValue([
      {
        id: 101,
        demandeur_nom: 'Mamadou Diallo',
        reference_anonyme: 'DC-2026-001',
        local_reference: 'LOC-RESTO-01',
        type_demande: 'VENTE_ALIMENTAIRE',
        statut: 'FAVORABLE',
      },
      {
        id: 102,
        demandeur_nom: 'Aissatou Sow',
        reference_anonyme: 'DC-2026-002',
        local_reference: 'LOC-RESTO-01',
        type_demande: 'VENTE_ALIMENTAIRE',
        statut: 'DEFAVORABLE',
      },
    ]);

    getVotes.mockResolvedValue([
      { id: 1, demande: 101, avis: 'FAVORABLE', membre_nom: 'Agent DCUVE' },
      { id: 2, demande: 101, avis: 'FAVORABLE', membre_nom: 'Directeur DCUVE' },
      { id: 3, demande: 102, avis: 'DEFAVORABLE', membre_nom: 'Agent DCUVE' },
    ]);

    render(<RapportCommission />);

    expect(await screen.findByText('LOC-RESTO-01')).toBeInTheDocument();
    expect(screen.getByText('Mamadou Diallo')).toBeInTheDocument();
    expect(screen.getByText(/Alloué/i)).toBeInTheDocument();
  });
});
