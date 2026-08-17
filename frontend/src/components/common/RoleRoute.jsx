import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function RoleRoute({ allowedRoles = [], allowCommissionMember = false }) {
  const { user, role, loading } = useAuth();

  const isAllowed =
    (allowedRoles && allowedRoles.includes(role)) ||
    (allowCommissionMember && Boolean(user?.est_membre_commission));

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error('Accès refusé. Cette fonctionnalité est réservée aux rôles autorisés.');
    }
  }, [isAllowed, loading]);

  if (loading) return null;

  return isAllowed ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
