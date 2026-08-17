import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-navy)', fontFamily: 'var(--font-body)' }}>
        <div>Chargement...</div>
      </div>
    );
  }

  // Rediriger vers l'accueil (Home.jsx) et non une page de connexion isolée
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}

