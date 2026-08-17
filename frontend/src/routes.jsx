import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/common/Layout';
import PrivateRoute from './components/common/PrivateRoute';
import RoleRoute from './components/common/RoleRoute';
import { useAuth } from './context/AuthContext';

// Pages publiques
import Home from './pages/Home';

// Auth
import Login from './components/auth/Login';
import Profile from './components/auth/Profile';
import Signup from './components/auth/Signup';

// Dashboard adaptatif
import Dashboard from './pages/Dashboard';

// Demandes Usager
import DepotDemande from './components/demandes/DepotDemande';
import SuiviDemande from './components/demandes/SuiviDemande';
import AppelsCandidature from './pages/AppelsCandidature';

// Carte interactive & Catalogue Locaux
import CatalogLocaux from './components/patrimoine/CatalogLocaux';
import CarteLocaux from './components/patrimoine/CarteLocaux';

// DCUVE & Commission
import InstructionDCUVE from './components/demandes/InstructionDCUVE';
import CommissionVote from './components/demandes/CommissionVote';
import GestionCommission from './components/commission/GestionCommission';
import EspaceMembreCommission from './components/commission/EspaceMembreCommission';
import RapportCommission from './components/commission/RapportCommission';
import ValidationCartes from './components/terrain/ValidationCartes';

// Service Juridique & Rédaction de Contrat
import ServiceJuridiqueView from './components/juridique/ServiceJuridiqueView';

// Service Technique & Expertise Maquettes
import ServiceTechniqueView from './components/terrain/ServiceTechniqueView';

// Agent QHSE - espace de travail unifié
import AgentQHSEView from './components/terrain/AgentQHSEView';

// Cellule Communication - Publication Appels & Affiches Accueil
import CelluleComView from './components/communication/CelluleComView';

// Bureau du Courrier - point d'entree des dossiers
import BureauCourrierView from './components/courrier/BureauCourrierView';
import ArchivesDossiers from './components/courrier/ArchivesDossiers';

// Bureau Environnement (QHSE) & Agent Terrain
import AgentTerrainView from './components/terrain/AgentTerrainView';
import BureauEnvironnementView from './components/terrain/BureauEnvironnementView';
import OrdresMissionView from './components/terrain/OrdresMissionView';
import RapportsVisiteTerrain from './components/terrain/RapportsVisiteTerrain';
import RapportsTerrainTechnique from './components/terrain/RapportsTerrainTechnique';
import MaintenanceTechnique from './components/terrain/MaintenanceTechnique';

// Patrimoine / Locaux (avec visualisation photo & CRUD)
import GestionLocaux from './components/patrimoine/GestionLocaux';

// Contrats / Occupant / Comptabilité / Juridique
import EspaceOccupant from './components/contrats/EspaceOccupant';
import GestionQuitus from './components/contrats/GestionQuitus';
import Paiement from './components/contrats/Paiement';
import CaisseComptable from './components/contrats/CaisseComptable';

// Terrain & QHSE
import SignalerProbleme from './components/terrain/SignalerProbleme';
import DenoncerOccupation from './components/terrain/DenoncerOccupation';
import InspectionQHSE from './components/terrain/InspectionQHSE';
import InspectionTerrain from './components/terrain/InspectionTerrain';

// Avis
import LaisserAvis from './components/avis/LaisserAvis';
import ModerationAvis from './components/avis/ModerationAvis';

// Direction & Rapports
import MonScoreFidelite from './pages/MonScoreFidelite';
import DashboardDirection from './components/rapports/DashboardDirection';
import RapportPeriode from './components/rapports/RapportPeriode';
import RapportQHSE from './components/rapports/RapportQHSE';
import ValidationDirection from './components/demandes/ValidationDirection';
import GestionCollaborateurs from './components/utilisateurs/GestionCollaborateurs';

// Administration SI
import SupervisionSysteme from './components/admin/SupervisionSysteme';
import JournalAudit from './components/admin/JournalAudit';
import ParametresSysteme from './components/admin/ParametresSysteme';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* ── Routes publiques ───────────────────────────── */}
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/signup"
        element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" replace />}
      />

      {/* ── Routes privées (Layout avec Sidebar) ──────── */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          {/* Commun (Accessible à tout utilisateur connecté) */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/locaux-catalogue" element={<CatalogLocaux />} />
          <Route path="/carte" element={<CarteLocaux />} />
          <Route path="/appels" element={<AppelsCandidature />} />

          {/* Demandes Usagers / Candidats (USAGER + OCCUPANT pour le suivi) */}
          <Route element={<RoleRoute allowedRoles={['USAGER']} />}>
            <Route path="/depot" element={<DepotDemande />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['USAGER', 'OCCUPANT']} />}>
            <Route path="/suivi" element={<SuiviDemande />} />
          </Route>

          {/* Dénonciation d'occupations illégales (Restreint aux agents terrain et inspecteurs) */}
          <Route element={<RoleRoute allowedRoles={['AGENT_TERRAIN']} />}>
            <Route path="/denoncer" element={<DenoncerOccupation />} />
          </Route>

          {/* Signalements techniques (Restreint aux OCCUPANTS, USAGERS et Service Technique) */}
          <Route element={<RoleRoute allowedRoles={['OCCUPANT', 'USAGER', 'AGENT_TERRAIN', 'SERVICE_TECHNIQUE']} />}>
            <Route path="/signaler" element={<SignalerProbleme />} />
          </Route>

          {/* Avis cantines - réservé aux usagers étudiants (contrôle serveur également) */}
          <Route element={<RoleRoute allowedRoles={['USAGER']} />}>
            <Route path="/avis" element={<LaisserAvis />} />
          </Route>

          {/* Score de fidelite - occupants uniquement */}
          <Route element={<RoleRoute allowedRoles={['OCCUPANT']} />}>
            <Route path="/fidelite" element={<MonScoreFidelite />} />
          </Route>

          {/* Cellule Communication - Publication Appels & Affiches */}
          <Route element={<RoleRoute allowedRoles={['CELLULE_COMMUNICATION', 'AMICALE']} />}>
            <Route path="/communication" element={<CelluleComView />} />
            <Route path="/moderation-avis" element={<ModerationAvis />} />
          </Route>

          {/* Bureau du Courrier & DCUVE - Réception & orientation des dossiers & Archives */}
          <Route element={<RoleRoute allowedRoles={['BUREAU_COURRIER', 'AGENT_DCUVE', 'DIRECTEUR_DCUVE']} />}>
            <Route path="/courrier" element={<BureauCourrierView />} />
            <Route path="/courrier/archives" element={<ArchivesDossiers />} />
          </Route>

          {/* Service Juridique - Rédaction de Contrats */}
          <Route element={<RoleRoute allowedRoles={['SERVICE_JURIDIQUE']} />}>
            <Route path="/juridique" element={<ServiceJuridiqueView />} />
          </Route>

          {/* Service Technique - Expertise Maquettes & Maintenance */}
          <Route element={<RoleRoute allowedRoles={['SERVICE_TECHNIQUE']} />}>
            <Route path="/service-technique" element={<ServiceTechniqueView />} />
            <Route path="/technique/rapports-terrain" element={<RapportsTerrainTechnique />} />
            <Route path="/technique/maintenance" element={<MaintenanceTechnique />} />
          </Route>

          {/* Brigade Terrain & Bureau Environnement */}
          <Route element={<RoleRoute allowedRoles={['AGENT_TERRAIN']} />}>
            <Route path="/terrain/agent" element={<AgentTerrainView />} />
          </Route>

          {/* Agent QHSE - espace de travail opérationnel dédié */}
          <Route element={<RoleRoute allowedRoles={['AGENT_QHSE']} />}>
            <Route path="/agent-qhse" element={<AgentQHSEView />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['AGENT_QHSE', 'DIRECTEUR_DCUVE', 'AGENT_DCUVE', 'DIRECTEUR_CROUS_T', 'ADMINISTRATEUR_SI']} />}>
            <Route path="/bureau-environnement" element={<BureauEnvironnementView />} />
          </Route>

          {/* Espace Occupant Titulaire (Restreint à OCCUPANT) */}
          <Route element={<RoleRoute allowedRoles={['OCCUPANT', 'SERVICE_COMPTABLE']} />}>
            <Route path="/espace-occupant" element={<EspaceOccupant />} />
          </Route>

          {/* Paiements / Guichet Comptabilité (Restreint à OCCUPANT et SERVICE_COMPTABLE) */}
          <Route element={<RoleRoute allowedRoles={['OCCUPANT', 'SERVICE_COMPTABLE']} />}>
            <Route path="/paiement" element={<Paiement />} />
          </Route>

          {/* Guichet comptable - caisse consolidee */}
          <Route element={<RoleRoute allowedRoles={['SERVICE_COMPTABLE']} />}>
            <Route path="/caisse" element={<CaisseComptable />} />
            <Route path="/quitus" element={<GestionQuitus />} />
          </Route>

          {/* Quitus lecture seule - Directeur CROUS-T */}
          <Route element={<RoleRoute allowedRoles={['DIRECTEUR_CROUS_T']} />}>
            <Route path="/direction/quitus" element={<GestionQuitus readOnly />} />
          </Route>

          {/* Service Juridique - Rédaction des contrats, modèles et baux */}
          <Route element={<RoleRoute allowedRoles={['SERVICE_JURIDIQUE', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/juridique" element={<ServiceJuridiqueView />} />
            <Route path="/juridique/redaction" element={<ServiceJuridiqueView />} />
            <Route path="/contrats" element={<ServiceJuridiqueView />} />
          </Route>

          {/* Services DCUVE */}
          <Route element={<RoleRoute allowedRoles={['AGENT_DCUVE', 'DIRECTEUR_DCUVE']} />}>
            <Route path="/instruction" element={<InstructionDCUVE />} />
          </Route>

          {/* Commission Consultative - Évaluation & Votes (Réservé aux membres actifs de la commission active) */}
          <Route element={<RoleRoute allowedRoles={['DIRECTEUR_CROUS_T']} allowCommissionMember={true} />}>
            <Route path="/commission" element={<CommissionVote />} />
            <Route path="/commission/mes-taches" element={<EspaceMembreCommission />} />
          </Route>

          {/* Commission Consultative - Pilotage & Rapports */}
          <Route element={<RoleRoute allowedRoles={['DIRECTEUR_CROUS_T']} />}>
            <Route path="/commission/gestion" element={<GestionCommission />} />
            <Route path="/commission/rapport" element={<RapportCommission />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['AGENT_DCUVE', 'BUREAU_COURRIER']} />}>
            <Route path="/validation-cartes" element={<ValidationCartes />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'ADMINISTRATEUR_SI']} />}>
            <Route path="/patrimoine/locaux" element={<GestionLocaux />} />
          </Route>

          {/* Operations Terrain & QHSE */}
          <Route element={<RoleRoute allowedRoles={['AGENT_TERRAIN']} />}>
            <Route path="/terrain/signalements" element={<SignalerProbleme />} />
            <Route path="/terrain/inspections-terrain" element={<InspectionTerrain />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['AGENT_QHSE']} />}>
            <Route path="/terrain/inspections" element={<InspectionQHSE />} />
          </Route>

          {/* Ordres de mission - Agent terrain & QHSE */}
          <Route element={<RoleRoute allowedRoles={['AGENT_QHSE', 'AGENT_TERRAIN']} />}>
            <Route path="/terrain/ordres-mission" element={<OrdresMissionView />} />
          </Route>

          {/* Rapports de visite terrain - Agent terrain & Service Technique */}
          <Route element={<RoleRoute allowedRoles={['AGENT_TERRAIN', 'SERVICE_TECHNIQUE']} />}>
            <Route path="/terrain/rapports-visite" element={<RapportsVisiteTerrain />} />
          </Route>

          {/* Direction & Pilotage */}
          <Route element={<RoleRoute allowedRoles={['DIRECTEUR_CROUS_T', 'ADMINISTRATEUR_SI']} />}>
            <Route path="/rapports" element={<RapportPeriode />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['DIRECTEUR_CROUS_T']} />}>
            <Route path="/dashboard-direction" element={<DashboardDirection />} />
            <Route path="/direction/validation" element={<ValidationDirection />} />
            <Route path="/direction/collaborateurs" element={<GestionCollaborateurs />} />
            <Route path="/rapports/qhse" element={<Navigate to="/direction/collaborateurs" replace />} />
          </Route>

          {/* Administration SI */}
          <Route element={<RoleRoute allowedRoles={['ADMINISTRATEUR_SI']} />}>
            <Route path="/admin/supervision" element={<SupervisionSysteme />} />
            <Route path="/admin/audit" element={<JournalAudit />} />
            <Route path="/admin/parametres" element={<ParametresSysteme />} />
            <Route path="/admin/comptes" element={<Navigate to="/admin/supervision" replace />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;


