import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/common/Layout";
import PrivateRoute from "./components/common/PrivateRoute";
import { useAuth } from "./context/AuthContext";

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
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<Home />} />
      <Route path="/vitrine" element={<Vitrine />} />
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/signup"
        element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" />}
      />

      {/* Routes privées */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/depot" element={<DepotDemande />} />
          <Route path="/suivi" element={<SuiviDemande />} />
          <Route path="/instruction" element={<InstructionDCUVE />} />
          <Route path="/commission" element={<CommissionVote />} />
          <Route path="/espace-occupant" element={<EspaceOccupant />} />
          <Route path="/paiement" element={<Paiement />} />
          <Route path="/signaler" element={<SignalerProbleme />} />
          <Route path="/denoncer" element={<DenoncerOccupation />} />
          <Route path="/inspection" element={<InspectionQHSE />} />
          <Route path="/validation-cartes" element={<ValidationCartes />} />
          <Route path="/avis" element={<LaisserAvis />} />
          <Route path="/moderation-avis" element={<ModerationAvis />} />
          <Route path="/dashboard-direction" element={<DashboardDirection />} />
          <Route path="/admin" element={<GestionComptes />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
