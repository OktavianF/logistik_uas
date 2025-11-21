import React from "react";
import { Navigate, useLocation } from "react-router-dom";

interface Props {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  // Simple client-side guard: check for token in localStorage
  let token: string | null = null;
  try {
    token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  } catch (e) {
    token = null;
  }

  const location = useLocation();

  if (!token) {
    // Redirect to auth page, preserve attempted location
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
