// src/app/routes/guards.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/**
 * Redirige a /login si no hay sesión activa.
 */
export function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

/**
 * Redirige a /sin-permiso si el rol no está en la lista.
 */
export function RoleRoute({ children, roles = [] }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles.length > 0 && !roles.includes(user?.rol)) {
    return <Navigate to="/sin-permiso" replace />;
  }
  return children;
}
