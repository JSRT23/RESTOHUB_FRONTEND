// portal_empleados/src/App.jsx
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./app/auth/AuthContext";
import LoginPage from "./features/auth/LoginPage";
import Inicio from "./features/turno/Inicio";
import MisTurnos from "./features/turno/MisTurnos";
import MiPerfil from "./features/perfil/MiPerfil";
import KioscoScreen from "./features/kiosco/KioscoScreen";
import BottomNav from "./shared/components/BottomNav";

// ── Guard: solo autenticado ────────────────────────────────────────────────
function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

// ── Guard: solo supervisor ────────────────────────────────────────────────
function RequireSupervisor() {
  const { user } = useAuth();
  if (user?.rol !== "supervisor") return <Navigate to="/inicio" replace />;
  return <Outlet />;
}

// ── Guard: roles operativos ────────────────────────────────────────────────
function RequireOperativo() {
  const { user } = useAuth();
  if (user?.rol === "supervisor") return <Navigate to="/kiosco" replace />;
  return <Outlet />;
}

// ── Layout con BottomNav ───────────────────────────────────────────────────
function EmpleadoLayout() {
  return (
    <div className="relative">
      <Outlet />
      <BottomNav />
    </div>
  );
}

// ── Redirect según rol ─────────────────────────────────────────────────────
function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.rol === "supervisor") return <Navigate to="/kiosco" replace />;
  return <Navigate to="/inicio" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Supervisor — kiosco */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireSupervisor />}>
          <Route path="/kiosco" element={<KioscoScreen />} />
        </Route>
      </Route>

      {/* Empleados operativos */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireOperativo />}>
          <Route element={<EmpleadoLayout />}>
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/turnos" element={<MisTurnos />} />
            <Route path="/perfil" element={<MiPerfil />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
