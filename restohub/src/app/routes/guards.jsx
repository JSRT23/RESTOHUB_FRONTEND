// src/app/routes/guards.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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

// Redirige a la home correcta según el rol del usuario autenticado
export function RoleBasedRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const rol = normalizeRol(user?.rol);

  switch (rol) {
    case "admin_central":
      return <Navigate to="/restaurantes" replace />;
    case "gerente_local":
      return <Navigate to="/gerente" replace />;
    case "supervisor":
      return <Navigate to="/supervisor" replace />;
    case "mesero":
      return <Navigate to="/mesero" replace />;
    case "cocinero":
      return <Navigate to="/cocina" replace />;
    case "cajero":
      return <Navigate to="/caja" replace />;
    case "repartidor":
      return <Navigate to="/entregas" replace />;
    default:
      return <Navigate to="/restaurantes" replace />;
  }
}
