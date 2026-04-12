// src/app/routes/guards.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// "gerente" es el alias que devuelve el auth_service en algunos casos
// Lo normalizamos a "gerente_local" que es el rol canónico del frontend
function normalizeRol(rol) {
  if (rol === "gerente") return "gerente_local";
  return rol;
}

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
 * Acepta "gerente" como alias de "gerente_local".
 */
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

/**
 * Redirect inteligente según rol.
 * Lee de localStorage directamente para evitar problemas de contexto
 * en la primera renderización del router con createBrowserRouter.
 */
export function RoleBasedRedirect() {
  try {
    const raw = localStorage.getItem("restohub_user");
    const user = raw ? JSON.parse(raw) : null;
    const rol = normalizeRol(user?.rol);
    if (rol === "gerente_local") return <Navigate to="/gerente" replace />;
  } catch {
    // JSON corrupto — caer al fallback
  }
  return <Navigate to="/restaurantes" replace />;
}
