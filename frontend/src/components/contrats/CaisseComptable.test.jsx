import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CaisseComptable from './CaisseComptable';
import { getCaisse, getEcheances, getRecus } from '../../api/paiements';

vi.mock('../../api/paiements', () => ({
  getCaisse: vi.fn(),
  getEcheances: vi.fn(),
  getRecus: vi.fn(),
  getPaiementsEnAttente: vi.fn().mockResolvedValue([]),
  actualiserEcheances: vi.fn(),
  reglerPaiement: vi.fn(),
  validerPaiement: vi.fn(),
}));

vi.mock('../charts', () => ({
  LineChart: () => <div>LineChart</div>,
  DoughnutChart: () => <div>DoughnutChart</div>,
  ProgressBars: () => <div>ProgressBars</div>,
}));

describe('CaisseComptable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les arriérés avec la règle des 2 mois maximum et le seuil critique', async () => {
    getCaisse.mockResolvedValue({
      total_attendu: 150000,
      total_encaisse: 100000,
      restant_du: 50000,
      caisse_du_jour: { nb: 1, total: 50000 },
      caisse_du_mois: { nb: 2, total: 100000 },
      taux_recouvrement: 66.7,
      top_debiteurs: [
        {
          occupant: 'Claire Pascal',
          local: 'LOC-CANTINE-01',
          nb: 2,
          montant: 100000,
          rang: 1,
          malus_points: -15,
          score_fidelite: 35,
        },
        {
          occupant: 'Alfred Blanc',
          local: 'LOC-BOUTIQUE-02',
          nb: 1,
          montant: 50000,
          rang: 2,
          malus_points: -7,
          score_fidelite: 70,
        },
      ],
      journal_14j: [],
      par_mode: [],
      repartition_echeances: {},
    });

    getEcheances.mockResolvedValue([]);
    getRecus.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CaisseComptable />
      </BrowserRouter>
    );

    expect(await screen.findByText(/Arriérés d'impayés & Alertes de recouvrement/i)).toBeInTheDocument();
    expect(await screen.findByText(/Claire Pascal/i)).toBeInTheDocument();
    expect(screen.getByText(/2 échéances en retard \(2 mois\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Avis d'expulsion \(Procédure de résiliation\)/i)).toBeInTheDocument();

    expect(screen.getByText(/Alfred Blanc/i)).toBeInTheDocument();
    expect(screen.getByText(/1 échéance en retard \(1 mois\)/i)).toBeInTheDocument();
    expect(screen.getByText(/1 mois de retard · Malus fidélité \(-7 pts\)/i)).toBeInTheDocument();
    expect(screen.getByText(/70 pts/i)).toBeInTheDocument();
  });
});
