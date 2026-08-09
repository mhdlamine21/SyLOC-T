import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/common/Layout";
import PrivateRoute from "./components/common/PrivateRoute";
import { useAuth } from "./context/useAuth";

// Pages
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Vitrine from "./pages/Vitrine";

// Auth
import Login from "./components/auth/Login";
import Profile from "./components/auth/Profile";
import Signup from "./components/auth/Signup";

// Demandes
import CommissionVote from "./components/demandes/CommissionVote";
import DepotDemande from "./components/demandes/DepotDemande";
import InstructionDCUVE from "./components/demandes/InstructionDCUVE";
import SuiviDemande from "./components/demandes/SuiviDemande";

// Contrats
import EspaceOccupant from "./components/contrats/EspaceOccupant";
import Paiement from "./components/contrats/Paiement";

// Terrain
import DenoncerOccupation from "./components/terrain/DenoncerOccupation";
import InspectionQHSE from "./components/terrain/InspectionQHSE";
import SignalerProbleme from "./components/terrain/SignalerProbleme";
import ValidationCartes from "./components/terrain/ValidationCartes";

// Avis
import LaisserAvis from "./components/avis/LaisserAvis";
import ModerationAvis from "./components/avis/ModerationAvis";

// Rapports
import DashboardDirection from "./components/rapports/DashboardDirection";

// Admin
import GestionComptes from "./components/admin/GestionComptes";

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* ==================== ROUTES PUBLIQUES ==================== */}
      <Route path="/" element={<Home />} />
      <Route path="/vitrine" element={<Vitrine />} />

      {/* Routes d'authentification - redirigent vers dashboard si déjà connecté */}
      <Route
        path="/login"
        element={
          !isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/signup"
        element={
          !isAuthenticated ? <Signup /> : <Navigate to="/dashboard" replace />
        }
      />

      {/* ==================== ROUTES PRIVÉES ==================== */}
      <Route element={<PrivateRoute />}>
        {/* Layout avec Header + Sidebar */}
        <Route element={<Layout />}>
          {/* Dashboard principal */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Profil utilisateur */}
          <Route path="/profile" element={<Profile />} />

          {/* Demandes - Public */}
          <Route path="/depot" element={<DepotDemande />} />
          <Route path="/suivi" element={<SuiviDemande />} />

          {/* Demandes - DCUVE */}
          <Route path="/instruction" element={<InstructionDCUVE />} />
          <Route path="/commission" element={<CommissionVote />} />

          {/* Contrats & Paiements */}
          <Route path="/espace-occupant" element={<EspaceOccupant />} />
          <Route path="/paiement" element={<Paiement />} />

          {/* Terrain - Signalements */}
          <Route path="/signaler" element={<SignalerProbleme />} />
          <Route path="/denoncer" element={<DenoncerOccupation />} />

          {/* Terrain - Inspections & Validation */}
          <Route path="/inspection" element={<InspectionQHSE />} />
          <Route path="/validation-cartes" element={<ValidationCartes />} />

          {/* Avis Cantine */}
          <Route path="/avis" element={<LaisserAvis />} />
          <Route path="/moderation-avis" element={<ModerationAvis />} />

          {/* Direction & Rapports */}
          <Route path="/dashboard-direction" element={<DashboardDirection />} />

          {/* Administration SI */}
          <Route path="/admin" element={<GestionComptes />} />

          {/* ==================== REDIRECTIONS ==================== */}
          {/* Rediriger /dashboard vers /dashboard (déjà fait) */}
          {/* Rediriger /accueil vers / */}
          <Route path="/accueil" element={<Navigate to="/" replace />} />
        </Route>
      </Route>

      {/* ==================== ROUTE 404 ==================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
