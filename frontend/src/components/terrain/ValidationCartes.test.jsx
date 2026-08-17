import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ValidationCartes from './ValidationCartes';
import { getCartesAValider, validerCarteEtudiant } from '../../api/comptes';

vi.mock('../../api/comptes', () => ({
  getCartesAValider: vi.fn(),
  validerCarteEtudiant: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const CARTES_ATTENTE_MOCK = [
  {
    id: 'dem-1',
    nom_complet: 'Awa Diop',
    matricule_etudiant: 'ETU-2026-0842',
    email: 'awa@diop.sn',
    contact: '+221 77 123 45 67',
    statut_verification_etudiant: 'EN_ATTENTE',
    carte_etudiant_date_soumission: '2026-08-14T10:00:00Z',
    carte_etudiant_fichier: '/media/carte_awa.jpg',
    nb_demandes: 1,
    nb_contrats_actifs: 0,
    score_fidelite: 10,
  },
];

const TOUTES_CARTES_MOCK = [
  ...CARTES_ATTENTE_MOCK,
  {
    id: 'dem-2',
    nom_complet: 'Moussa Ndiaye',
    matricule_etudiant: 'ETU-2026-5502',
    email: 'moussa@ndiaye.sn',
    contact: '+221 77 987 65 43',
    statut_verification_etudiant: 'VALIDE',
    carte_etudiant_date_validation: '2026-08-10T10:00:00Z',
    valide_par_nom: 'Bureau du Courrier',
    nb_demandes: 2,
    nb_contrats_actifs: 1,
    score_fidelite: 45,
  },
];

describe('ValidationCartes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCartesAValider.mockImplementation((statut) => {
      if (statut === 'EN_ATTENTE') return Promise.resolve(CARTES_ATTENTE_MOCK);
      return Promise.resolve(TOUTES_CARTES_MOCK);
    });
  });

  it('affiche les indicateurs KPI et la liste des cartes en attente', async () => {
    render(<ValidationCartes />);
    expect(await screen.findByText('Validation des cartes étudiantes')).toBeInTheDocument();
    expect(screen.getByText('Awa Diop')).toBeInTheDocument();
    expect(screen.getByText(/Matricule : ETU-2026-0842/i)).toBeInTheDocument();
  });

  it('bascule sur l onglet des décisions rendues', async () => {
    render(<ValidationCartes />);
    await screen.findByText('Awa Diop');

    const tabHistorique = screen.getByRole('button', { name: /Décisions rendues/i });
    fireEvent.click(tabHistorique);

    expect(await screen.findByText('Moussa Ndiaye')).toBeInTheDocument();
  });

  it('valide une carte étudiante', async () => {
    validerCarteEtudiant.mockResolvedValue({});
    render(<ValidationCartes />);
    await screen.findByText('Awa Diop');

    const boutonValider = screen.getByRole('button', { name: 'Valider' });
    fireEvent.click(boutonValider);

    await waitFor(() => {
      expect(validerCarteEtudiant).toHaveBeenCalledWith('dem-1', 'VALIDE', '');
    });
  });
});
