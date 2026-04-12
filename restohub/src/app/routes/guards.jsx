// src/app/routes/guards.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// "gerente" es el alias que devuelve el auth_service en algunos casos
function normalizeRol(rol) {
  if (rol === "gerente") return "gerente_local";
  return rol;
}

export function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export function RoleRoute({ children, roles = [] }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  const rol = normalizeRol(user?.rol);
  if (roles.length > 0 && !roles.includes(rol)) {
    return <Navigate to="/sin-permiso" replace />;
  }
  return children;
}

// USA useAuth() — funciona dentro del árbol de React con AppProvider
export function RoleBasedRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const rol = normalizeRol(user?.rol);
  if (rol === "gerente_local") return <Navigate to="/gerente" replace />;
  return <Navigate to="/restaurantes" replace />;
}
