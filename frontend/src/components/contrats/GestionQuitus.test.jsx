import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GestionQuitus from './GestionQuitus';
import { getAllQuitus, getEspecesEnAttente } from '../../api/paiements';

vi.mock('../../api/paiements', () => ({
  getAllQuitus: vi.fn(),
  getEspecesEnAttente: vi.fn(),
  validerPaiement: vi.fn(),
}));

describe('GestionQuitus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche correctement le registre des quitus et les indicateurs pour la direction', async () => {
    getEspecesEnAttente.mockResolvedValue([]);
    getAllQuitus.mockResolvedValue([
      {
        id: 1,
        reference_quitus: 'QUITUS-20260816-001',
        occupant_nom: 'Mamadou Diallo',
        local_reference: 'LOC-RESTO-01',
        mode: 'ESPECES',
        mode_libelle: 'Espèces',
        montant_regle: 50000,
        date_paiement: '2026-08-16T10:00:00Z',
        date_exigibilite: '2026-08-01',
      },
      {
        id: 2,
        reference_quitus: 'QUITUS-20260816-002',
        occupant_nom: 'Aissatou Sow',
        local_reference: 'K-04',
        mode: 'MOBILE_MONEY',
        mode_libelle: 'Mobile Money',
        montant_regle: 50000,
        date_paiement: '2026-08-16T10:05:00Z',
        date_exigibilite: '2026-08-01',
      },
    ]);

    render(<GestionQuitus readOnly={true} />);

    expect(await screen.findByText('QUITUS-20260816-001')).toBeInTheDocument();
    expect(screen.getByText('Mamadou Diallo')).toBeInTheDocument();
    expect(screen.getByText('QUITUS-20260816-002')).toBeInTheDocument();
    expect(screen.getByText('Aissatou Sow')).toBeInTheDocument();
    expect(screen.getByText(/100[\s\u00A0]*000/)).toBeInTheDocument();
    expect(screen.getAllByText(/FCFA/).length).toBeGreaterThan(0);
  });

  it('affiche les paiements espèces en attente pour le service comptable sans erreur', async () => {
    getEspecesEnAttente.mockResolvedValue([
      {
        id: 10,
        occupant_nom: 'Ousmane Fall',
        local_reference: 'LOC-CANTINE-02',
        contrat_reference: 'CT-2026-0012',
        date_exigibilite: '2026-08-01',
        montant_regle: 75000,
        date_paiement: '2026-08-16T09:00:00Z',
      },
    ]);
    getAllQuitus.mockResolvedValue([]);

    render(<GestionQuitus readOnly={false} />);

    expect(await screen.findByText('Ousmane Fall')).toBeInTheDocument();
    expect(screen.getByText('Valider')).toBeInTheDocument();
    expect(screen.getByText(/75[\s\u00A0]*000/)).toBeInTheDocument();
  });
});
