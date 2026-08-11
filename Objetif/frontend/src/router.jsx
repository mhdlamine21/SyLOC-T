import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ComingSoon from './pages/ComingSoon';
import ProtectedRoute from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      // ---- Public (Phase 1) ----
      { path: '/', element: <Home /> },
      { path: '/connexion', element: <Login /> },
      { path: '/inscription', element: <Signup /> },
      { path: '/locaux', element: <ComingSoon titre="Types de locaux" phase="Phase 1" /> },
      { path: '/procedure', element: <ComingSoon titre="Comprendre la procédure" phase="Phase 1" /> },
      { path: '/actualites', element: <ComingSoon titre="Actualités" phase="Phase 1" /> },

      // ---- Espace personnel — Demandeur (Phase 2) ----
      { path: '/app', element: <ProtectedRoute><ComingSoon titre="Tableau de bord" phase="Phase 2" /></ProtectedRoute> },
      { path: '/app/demandes', element: <ProtectedRoute><ComingSoon titre="Mes demandes" phase="Phase 2" /></ProtectedRoute> },
      { path: '/app/demandes/nouvelle', element: <ProtectedRoute><ComingSoon titre="Nouvelle demande" phase="Phase 2" /></ProtectedRoute> },

      // ---- Instruction & paiements (Phase 3) ----
      { path: '/app/dcuve', element: <ProtectedRoute><ComingSoon titre="Dossiers à instruire" phase="Phase 3" /></ProtectedRoute> },
      { path: '/app/paiements', element: <ProtectedRoute><ComingSoon titre="Paiements" phase="Phase 3" /></ProtectedRoute> },
      { path: '/app/comptable', element: <ProtectedRoute><ComingSoon titre="Suivi comptable" phase="Phase 3" /></ProtectedRoute> },

      // ---- Terrain & QHSE (Phase 4) ----
      { path: '/app/signaler', element: <ProtectedRoute><ComingSoon titre="Signaler un problème" phase="Phase 4" /></ProtectedRoute> },
      { path: '/app/denoncer', element: <ProtectedRoute><ComingSoon titre="Signaler une occupation non autorisée" phase="Phase 4" /></ProtectedRoute> },
      { path: '/app/avis', element: <ProtectedRoute><ComingSoon titre="Avis cantines" phase="Phase 4" /></ProtectedRoute> },
      { path: '/app/verification-cartes', element: <ProtectedRoute><ComingSoon titre="Validation des cartes étudiantes" phase="Phase 4" /></ProtectedRoute> },

      // ---- Pilotage (Phase 5) ----
      { path: '/app/direction', element: <ProtectedRoute><ComingSoon titre="Tableau de bord Direction" phase="Phase 5" /></ProtectedRoute> },

      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
