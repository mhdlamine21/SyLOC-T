import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { useAuth } from '../context/AuthContext';
import {
  getDashboardStats, getDashboardComplement, getTopOccupants,
  getPaiementsMois, getSyntheseComptable, getRecettesMoisParMois,
} from '../api/dashboard';
import { getAnnonces } from '../api/annonces';
import { getNotificationsNonLues } from '../api/notifications';
import { getMesDemandes } from '../api/demandes';
import { getStatistiquesContrats, getContrats } from '../api/contrats';
import { getClassementFidelite } from '../api/fidelite';
import { getEcheances } from '../api/paiements';
import { getPlaintes } from '../api/terrain';
import { getSupervisionSysteme } from '../api/supervision';
import { getPublicStats } from '../api/public';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../api/dashboard', () => ({
  getDashboardStats: vi.fn(),
  getDashboardComplement: vi.fn(),
  getTopOccupants: vi.fn(),
  getPaiementsMois: vi.fn(),
  getSyntheseComptable: vi.fn(),
  getRecettesMoisParMois: vi.fn(),
}));
vi.mock('../api/annonces', () => ({ getAnnonces: vi.fn() }));
vi.mock('../api/notifications', () => ({ getNotificationsNonLues: vi.fn() }));
vi.mock('../api/demandes', () => ({ getMesDemandes: vi.fn() }));
vi.mock('../api/contrats', () => ({ getStatistiquesContrats: vi.fn(), getContrats: vi.fn() }));
vi.mock('../api/fidelite', () => ({ getClassementFidelite: vi.fn() }));
vi.mock('../api/paiements', () => ({ getEcheances: vi.fn() }));
vi.mock('../api/terrain', () => ({ getPlaintes: vi.fn() }));
vi.mock('../api/supervision', () => ({ getSupervisionSysteme: vi.fn() }));
vi.mock('../api/public', () => ({ getPublicStats: vi.fn() }));

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
    getPublicStats.mockResolvedValue(mockStats);
    getDashboardComplement.mockResolvedValue({});
    getTopOccupants.mockResolvedValue([]);
    getClassementFidelite.mockResolvedValue([]);
    getPaiementsMois.mockResolvedValue({ paiements: [], total: 0 });
    getSyntheseComptable.mockResolvedValue({});
    getRecettesMoisParMois.mockResolvedValue([]);
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

  it('affiche les indicateurs de pilotage pour la Direction CROUS-T', async () => {
    useAuth.mockReturnValue({ user: { nom_complet: 'Directeur CROUS-T' }, role: 'DIRECTEUR_CROUS_T' });
    renderDashboard();

    expect(screen.getByText(/Bonjour Directeur/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Recettes du mois/i)).toBeInTheDocument();
      expect(screen.getByText(/Demandes traitees/i)).toBeInTheDocument();
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
  });

  it('affiche les indicateurs DCUVE pour le Directeur DCUVE avec des valeurs numériques propres', async () => {
    useAuth.mockReturnValue({ user: { nom_complet: 'Directeur DCUVE' }, role: 'DIRECTEUR_DCUVE' });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Action requise')).toBeInTheDocument();
      expect(screen.getByText('En attente d\'instruction')).toBeInTheDocument();
      expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    });
  }, 15000);

  it('affiche le classement occupant avec la position et la mise en évidence de l\'occupant connecté', async () => {
    useAuth.mockReturnValue({ user: { nom_complet: 'Moussa Diop' }, role: 'OCCUPANT' });
    getContrats.mockResolvedValue([{ id: 1, est_actif: true }]);
    getEcheances.mockResolvedValue([]);
    getPlaintes.mockResolvedValue([]);
    getClassementFidelite.mockResolvedValue([
      { demandeur_id: '1', nom: 'Amadou Sow', score: 95, palier: 'PLATINE', rang: 1, est_moi: false },
      { demandeur_id: '2', nom: 'Moussa Diop', score: 10, palier: 'BRONZE', rang: 14, est_moi: true },
    ]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Classement des occupants')).toBeInTheDocument();
      expect(screen.getByText('Amadou Sow')).toBeInTheDocument();
      expect(screen.getByText('Moussa Diop')).toBeInTheDocument();
      expect(screen.getByText('14')).toBeInTheDocument();
      expect(screen.getByText('Vous')).toBeInTheDocument();
    });
  });

  it('affiche les indicateurs de supervision et santé pour l Administrateur SI', async () => {
    useAuth.mockReturnValue({ user: { nom_complet: 'Pape Alioune Niang' }, role: 'ADMINISTRATEUR_SI' });
    getSupervisionSysteme.mockResolvedValue({
      status: 'OPERATIONNEL',
      services: [{ id: 'api', statut: 'OK' }, { id: 'db', statut: 'OK' }],
      volumetrie: { audit: 120, audit_24h: 8 },
      systeme: { db_latency_ms: 10 },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Services opérationnels')).toBeInTheDocument();
      expect(screen.getAllByText(/Journal d'audit/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Supervision & Santé')).toBeInTheDocument();
    });
  });
});



