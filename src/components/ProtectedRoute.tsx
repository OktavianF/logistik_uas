import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: JSX.Element;
  allowedRoles?: string[]; // optional list of roles allowed to access
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While we are determining auth status, render nothing (or a loader)
  if (loading) return null;

  // If no authenticated user, redirect to /auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If allowedRoles provided, ensure user's role is included
  if (allowedRoles && allowedRoles.length > 0) {
    const role = (user && (user as any).role) || null;
    if (!role || !allowedRoles.map(r => r.toLowerCase()).includes(String(role).toLowerCase())) {
      // Not authorized
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
