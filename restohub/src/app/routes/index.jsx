// src/app/routes/index.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PrivateRoute, RoleRoute } from "./guards";
import MainLayout from "../../shared/components/layout/MainLayout";
import LoginPage from "../../features/auth/components/LoginPage";

// categorias
import CategoriasList from "../../features/menu/components/CategoriasList";
// Restaurantes
import RestaurantesList from "../../features/menu/components/RestauranteList";
import CreateRestauranteWizard from "../../features/menu/components/CreateRestauranteWizard";
import RestauranteDetail from "../../features/menu/components/RestauranteDetail";

// Placeholder para secciones futuras
const WIP = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-stone-300 text-xl">
      🚧
    </div>
    <p className="text-stone-500 font-dm text-sm">{title} — próximamente</p>
  </div>
);
const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/restaurantes" replace /> },

      // ── Restaurantes (admin_central) ──────────────────────────────────────
      {
        path: "restaurantes",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <RestaurantesList />
          </RoleRoute>
        ),
      },
      {
        path: "restaurantes/nuevo",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <CreateRestauranteWizard />
          </RoleRoute>
        ),
      },
      {
        path: "restaurantes/:id",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <RestauranteDetail />
          </RoleRoute>
        ),
      },

      // ── Menú ──────────────────────────────────────────────────────────────
      { path: "menu/platos", element: <WIP title="Gestión de platos" /> },
      {
        path: "menu/categorias",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <CategoriasList />
          </RoleRoute>
        ),
      },
      {
        path: "menu/ingredientes",
        element: <WIP title="Gestión de ingredientes" />,
      },

      // ── Inventario ────────────────────────────────────────────────────────
      { path: "inventario", element: <WIP title="Dashboard inventario" /> },
      { path: "inventario/stock", element: <WIP title="Stock" /> },
      { path: "inventario/almacenes", element: <WIP title="Almacenes" /> },
      { path: "inventario/proveedores", element: <WIP title="Proveedores" /> },
      { path: "inventario/lotes", element: <WIP title="Lotes" /> },
      {
        path: "inventario/ordenes",
        element: (
          <RoleRoute roles={["admin_central", "gerente_local"]}>
            <WIP title="Órdenes de compra" />
          </RoleRoute>
        ),
      },
      { path: "inventario/alertas", element: <WIP title="Alertas de stock" /> },

      // ── Admin ─────────────────────────────────────────────────────────────
      {
        path: "admin/usuarios",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <WIP title="Usuarios" />
          </RoleRoute>
        ),
      },
      {
        path: "admin/staff",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <WIP title="Staff" />
          </RoleRoute>
        ),
      },

      // Auxiliares
      {
        path: "sin-permiso",
        element: (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-400 text-xl">
              🔒
            </div>
            <p className="text-stone-600 font-dm text-sm font-semibold">
              Sin permiso para esta sección
            </p>
          </div>
        ),
      },
      { path: "*", element: <Navigate to="/restaurantes" replace /> },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default router;
