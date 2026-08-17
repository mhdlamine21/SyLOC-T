import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ParametresSysteme from './ParametresSysteme';

const mockParametres = [
  {
    id: 1,
    cle: 'contact_crous_t',
    libelle: 'Coordonnees Officielles du CROUS de Thies',
    categorie: 'GENERAL',
    description: 'Informations de contact et localisation officielle du CROUS-T.',
    est_public: true,
    valeur: {
      institution: 'Centre Regional des Oeuvres Universitaires Sociales de Thies (CROUS-T)',
      telephone_standard: '+221 33 951 12 34',
      email_contact: 'contact@crous-thies.sn',
    },
  },
  {
    id: 2,
    cle: 'bareme_redevances_2026',
    libelle: 'Grille Tarifaire des Redevances Domaniales 2026',
    categorie: 'WORKFLOW',
    description: 'Bareme officiel approuve par la Direction du CROUS-T.',
    est_public: true,
    valeur: {
      kiosque_multiservices: 25000,
      papeterie_imprimerie: 40000,
    },
  },
];

vi.mock('../../api/parametres', () => ({
  getParametres: vi.fn(() => Promise.resolve(mockParametres)),
  createParametre: vi.fn(() => Promise.resolve({ id: 3 })),
  updateParametre: vi.fn(() => Promise.resolve({ id: 1 })),
  deleteParametre: vi.fn(() => Promise.resolve({})),
}));

describe('ParametresSysteme Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les paramètres et les statistiques globales', async () => {
    render(<ParametresSysteme />);

    expect(await screen.findByText('Paramètres Système & Configuration')).toBeInTheDocument();
    expect(screen.getByText('Coordonnees Officielles du CROUS de Thies')).toBeInTheDocument();
    expect(screen.getByText('Grille Tarifaire des Redevances Domaniales 2026')).toBeInTheDocument();
  });

  it('ouvre la modale de modification d un paramètre', async () => {
    render(<ParametresSysteme />);

    expect(await screen.findByText('Coordonnees Officielles du CROUS de Thies')).toBeInTheDocument();
    const boutonsEditer = screen.getAllByRole('button', { name: /Modifier/i });
    fireEvent.click(boutonsEditer[0]);

    expect(await screen.findByText(/Configuration de « contact_crous_t »/i)).toBeInTheDocument();
  });

  it('filtre les paramètres par recherche textuelle', async () => {
    render(<ParametresSysteme />);

    expect(await screen.findByText('Coordonnees Officielles du CROUS de Thies')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(/Rechercher une clé/i);
    fireEvent.change(searchInput, { target: { value: 'bareme' } });

    expect(screen.queryByText('Coordonnees Officielles du CROUS de Thies')).not.toBeInTheDocument();
    expect(screen.getByText('Grille Tarifaire des Redevances Domaniales 2026')).toBeInTheDocument();
  });
});
