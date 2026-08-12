import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function RoleRoute({ allowedRoles }) {
  const { role, loading } = useAuth();

  const isAllowed = allowedRoles.includes(role);

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error('Accès refusé. Cette fonctionnalité est réservée aux rôles autorisés.');
    }
  }, [isAllowed, loading]);

  if (loading) return null;

  return isAllowed ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
