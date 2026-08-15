import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getDashboardComplement, getTopOccupants } from '../api/dashboard';
import { getAnnonces } from '../api/annonces';
import { getNotificationsNonLues } from '../api/notifications';
import { getMesDemandes } from '../api/demandes';
import { getStatistiquesContrats } from '../api/contrats';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../api/dashboard', () => ({
  getDashboardStats: vi.fn(),
  getDashboardComplement: vi.fn(),
  getTopOccupants: vi.fn(),
}));
vi.mock('../api/annonces', () => ({ getAnnonces: vi.fn() }));
vi.mock('../api/notifications', () => ({ getNotificationsNonLues: vi.fn() }));
vi.mock('../api/demandes', () => ({ getMesDemandes: vi.fn() }));
vi.mock('../api/contrats', () => ({ getStatistiquesContrats: vi.fn() }));

describe('Dashboard', () => {
  const mockStats = {
    locaux_total: 10,
    locaux_libres: 4,
    locaux_occupes: 6,
    utilisateurs_total: 20,
    demandes_total: 40,
    demandes_en_cours: 5,
    demandes_nouvelles: 3,
    demandes_favorables: 30,
    taux_favorable: 85,
    contrats_actifs: 12,
    contrats_a_echeance: 2,
    impayes_montant: 1200000,
    impayes_nombre: 7,
    recettes_mois: 500000,
    signalements_ouverts: 2,
    signalements_total: 9,
    inspections_mois: 4,
    score_qhse_moyen: 4.5,
    avis_publies: 15,
    evolution_mensuelle: [{ mois: 'mai 2025', soumises: 6, favorables: 4, defavorables: 1 }],
    repartition_statuts: [{ statut: 'FAVORABLE', total: 30 }],
    repartition_types_locaux: [{ type_local: 'BOUTIQUE', total: 5 }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getDashboardStats.mockResolvedValue(mockStats);
    getDashboardComplement.mockResolvedValue({});
    getTopOccupants.mockResolvedValue([]);
    getAnnonces.mockResolvedValue([{ id: 1, titre: 'Appel a candidatures 2025', date_publication: '2025-05-01' }]);
    getNotificationsNonLues.mockResolvedValue([{ id: 1 }]);
    getMesDemandes.mockResolvedValue([{ id: 1, type_demande: 'ATTRIBUTION_LOCAL', statut: 'NOUVELLE', date_depot: '2025-05-02' }]);
    getStatistiquesContrats.mockResolvedValue({
      total: 50,
      nb_actifs: 40,
      nb_resilies: 5,
      nb_en_attente_signature: 5,
      nb_gratuits: 10,
      redevance_mensuelle_totale: 5000000,
      nb_modeles_actifs: 3,
      contrats_recents: []
    });
  });

  const renderDashboard = () => render(<MemoryRouter><Dashboard /></MemoryRouter>);

  it('affiche les indicateurs de pilotage pour un administrateur', async () => {
    useAuth.mockReturnValue({ user: { nom_complet: 'Admin Test' }, role: 'ADMINISTRATEUR_SI' });
    renderDashboard();

    expect(screen.getByText(/Bonjour Admin/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText(/Taux favorable/i)).toBeInTheDocument();
      expect(screen.getByText(/Etat du reseau/i)).toBeInTheDocument();
    });

    expect(getDashboardStats).toHaveBeenCalled();
  });

  it('affiche les indicateurs financiers pour le service comptable', async () => {
    useAuth.mockReturnValue({ user: { nom_complet: 'Compta Test' }, role: 'SERVICE_COMPTABLE' });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Recettes du mois/i)).toBeInTheDocument();
      expect(screen.getByText(/Impayes/i)).toBeInTheDocument();
    });
  });

  it('affiche un tableau de bord 100% juridique pour le service juridique', async () => {
    useAuth.mockReturnValue({ user: { nom_complet: 'Juriste Test' }, role: 'SERVICE_JURIDIQUE' });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Baux actifs/i)).toBeInTheDocument();
      expect(screen.getByText(/En attente de signature/i)).toBeInTheDocument();
    });

    // Ne doit PAS afficher les stats générales de demandes ou de patrimoine
    expect(screen.queryByText(/Activite des 6 derniers mois/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Types de locaux/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Classement des occupants/i)).not.toBeInTheDocument();
  });
});

