import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import StatistiquesJuridique from './StatistiquesJuridique';
import { getStatistiquesContrats } from '../../api/contrats';

vi.mock('../../api/contrats', () => ({
  getStatistiquesContrats: vi.fn(),
}));

describe('StatistiquesJuridique', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le tableau de bord juridique enrichi avec les indicateurs clés et la répartition', async () => {
    getStatistiquesContrats.mockResolvedValue({
      total: 31,
      nb_actifs: 12,
      nb_resilies: 2,
      nb_en_attente_signature: 4,
      nb_gratuits: 1,
      nb_baux_a_rediger: 3,
      redevance_mensuelle_totale: 450000,
      nb_modeles_actifs: 3,
      par_statut: {
        ACTIF: 12,
        BROUILLON: 13,
        EN_ATTENTE_SIGNATURE: 4,
        RESILIE: 2,
      },
      echeance_proche: [
        {
          id: '1',
          reference: 'CT-2024-0001',
          occupant: 'Mamadou Diallo',
          local: 'LOC-RESTO-01',
          date_fin: '2026-09-30',
        },
      ],
    });

    render(
      <BrowserRouter>
        <StatistiquesJuridique />
      </BrowserRouter>
    );

    expect(await screen.findByText(/Pôle Juridique & Gestion Contractuelle/i)).toBeInTheDocument();
    expect(screen.getByText('Baux à rédiger')).toBeInTheDocument();
    expect(screen.getByText('Baux actifs')).toBeInTheDocument();
    expect(screen.getByText('Mamadou Diallo')).toBeInTheDocument();
    expect(screen.getByText(/LOC-RESTO-01/)).toBeInTheDocument();
  });
});
