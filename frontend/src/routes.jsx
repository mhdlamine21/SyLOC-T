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

// Carte interactive & Catalogue Locaux
import CatalogLocaux from './components/patrimoine/CatalogLocaux';

// DCUVE & Commission
import InstructionDCUVE from './components/demandes/InstructionDCUVE';
import CommissionVote from './components/demandes/CommissionVote';
import ValidationCartes from './components/terrain/ValidationCartes';

// Service Juridique & Rédaction de Contrat
import ServiceJuridiqueView from './components/juridique/ServiceJuridiqueView';

// Service Technique & Expertise Maquettes
import ServiceTechniqueView from './components/terrain/ServiceTechniqueView';

// Cellule Communication — Publication Appels & Affiches Accueil
import CelluleComView from './components/communication/CelluleComView';

// Bureau du Courrier — point d'entree des dossiers
import BureauCourrierView from './components/courrier/BureauCourrierView';

// Bureau Environnement (QHSE) & Agent Terrain
import AgentTerrainView from './components/terrain/AgentTerrainView';
import BureauEnvironnementView from './components/terrain/BureauEnvironnementView';

// Patrimoine / Locaux (avec visualisation photo & CRUD)
import GestionLocaux from './components/patrimoine/GestionLocaux';

// Contrats / Occupant / Comptabilité
import EspaceOccupant from './components/contrats/EspaceOccupant';
import Paiement from './components/contrats/Paiement';
import CaisseComptable from './components/contrats/CaisseComptable';

// Terrain & QHSE
import SignalerProbleme from './components/terrain/SignalerProbleme';
import DenoncerOccupation from './components/terrain/DenoncerOccupation';
import InspectionQHSE from './components/terrain/InspectionQHSE';

// Avis
import AvisCantines from './components/terrain/AvisCantines';
import ModerationAvis from './components/avis/ModerationAvis';

// Direction & Rapports
import MonScoreFidelite from './pages/MonScoreFidelite';
import DashboardDirection from './components/rapports/DashboardDirection';
import RapportPeriode from './components/rapports/RapportPeriode';

// Administration SI
import GestionComptes from './components/admin/GestionComptes';
import JournalAudit from './components/admin/JournalAudit';

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

          {/* Demandes Usagers / Candidats (Strictement réservé au rôle USAGER et AMICALE) */}
          <Route element={<RoleRoute allowedRoles={['USAGER', 'AMICALE']} />}>
            <Route path="/depot" element={<DepotDemande />} />
            <Route path="/suivi" element={<SuiviDemande />} />
          </Route>

          {/* Dénonciation d'occupations illégales (Restreint aux agents terrain et inspecteurs) */}
          <Route element={<RoleRoute allowedRoles={['AGENT_TERRAIN', 'AGENT_QHSE', 'SERVICE_TECHNIQUE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/denoncer" element={<DenoncerOccupation />} />
          </Route>

          {/* Signalements techniques (Restreint aux OCCUPANTS et Service Technique) */}
          <Route element={<RoleRoute allowedRoles={['OCCUPANT', 'AGENT_TERRAIN', 'SERVICE_TECHNIQUE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/signaler" element={<SignalerProbleme />} />
          </Route>

          {/* Avis cantines (Vérification étudiante dans le composant) */}
          <Route path="/avis" element={<AvisCantines />} />

          {/* Score de fidelite (usagers & occupants) */}
          <Route path="/fidelite" element={<MonScoreFidelite />} />

          {/* Cellule Communication — Publication Appels & Affiches */}
          <Route element={<RoleRoute allowedRoles={['CELLULE_COMMUNICATION', 'AMICALE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/communication" element={<CelluleComView />} />
            <Route path="/moderation-avis" element={<ModerationAvis />} />
          </Route>

          {/* Bureau du Courrier — Réception & orientation des dossiers */}
          <Route element={<RoleRoute allowedRoles={['BUREAU_COURRIER', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/courrier" element={<BureauCourrierView />} />
          </Route>

          {/* Service Juridique — Rédaction de Contrats */}
          <Route element={<RoleRoute allowedRoles={['SERVICE_JURIDIQUE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/juridique" element={<ServiceJuridiqueView />} />
          </Route>

          {/* Service Technique — Expertise Maquettes & Maintenance */}
          <Route element={<RoleRoute allowedRoles={['SERVICE_TECHNIQUE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/service-technique" element={<ServiceTechniqueView />} />
          </Route>

          {/* Brigade Terrain & Bureau Environnement */}
          <Route element={<RoleRoute allowedRoles={['AGENT_TERRAIN', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/terrain/agent" element={<AgentTerrainView />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['AGENT_QHSE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/bureau-environnement" element={<BureauEnvironnementView />} />
          </Route>

          {/* Espace Occupant Titulaire (Restreint à OCCUPANT) */}
          <Route element={<RoleRoute allowedRoles={['OCCUPANT', 'SERVICE_COMPTABLE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/espace-occupant" element={<EspaceOccupant />} />
          </Route>

          {/* Paiements / Guichet Comptabilité (Restreint à OCCUPANT et SERVICE_COMPTABLE) */}
          <Route element={<RoleRoute allowedRoles={['OCCUPANT', 'SERVICE_COMPTABLE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/paiement" element={<Paiement />} />
          </Route>

          {/* Guichet comptable - caisse consolidee */}
          <Route element={<RoleRoute allowedRoles={['SERVICE_COMPTABLE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/caisse" element={<CaisseComptable />} />
          </Route>

          {/* Services DCUVE */}
          <Route element={<RoleRoute allowedRoles={['AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/instruction" element={<InstructionDCUVE />} />
          </Route>

          {/* Commission Consultative */}
          <Route element={<RoleRoute allowedRoles={['AMICALE', 'DIRECTEUR_DCUVE', 'SERVICE_JURIDIQUE', 'SERVICE_TECHNIQUE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/commission" element={<CommissionVote />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'BUREAU_COURRIER', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/validation-cartes" element={<ValidationCartes />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T', 'SERVICE_TECHNIQUE']} />}>
            <Route path="/patrimoine/locaux" element={<GestionLocaux />} />
          </Route>

          {/* Operations Terrain & QHSE */}
          <Route element={<RoleRoute allowedRoles={['AGENT_TERRAIN', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/terrain/signalements" element={<SignalerProbleme />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['AGENT_QHSE', 'ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/terrain/inspections" element={<InspectionQHSE />} />
          </Route>

          {/* Pilotage Direction */}
          <Route element={<RoleRoute allowedRoles={['DIRECTEUR_CROUS_T', 'ADMINISTRATEUR_SI']} />}>
            <Route path="/dashboard-direction" element={<DashboardDirection />} />
            <Route path="/rapports" element={<RapportPeriode />} />
          </Route>

          {/* Administration SI & Direction (Gestion des utilisateurs) */}
          <Route element={<RoleRoute allowedRoles={['ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T']} />}>
            <Route path="/admin/comptes" element={<GestionComptes />} />
            <Route path="/admin/audit" element={<JournalAudit />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
