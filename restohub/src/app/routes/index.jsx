// src/app/routes/index.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PrivateRoute, RoleRoute, RoleBasedRedirect } from "./guards";
import MainLayout from "../../shared/components/layout/MainLayout";
import LoginPage from "../../features/auth/components/LoginPage";

// ── Admin Central ──────────────────────────────────────────────────────────
import CategoriasList from "../../features/menu/components/admin/CategoriasList";
import RestaurantesList from "../../features/menu/components/admin/RestauranteList";
import CreateRestauranteWizard from "../../features/menu/components/admin/CreateRestauranteWizard";
import RestauranteDetail from "../../features/menu/components/admin/RestauranteDetail";

// Admin Central — Inventario
import AInventarioDashboard from "../../features/inventory/components/admin/AInventarioDashboard";
import AProveedoresList from "../../features/inventory/components/admin/AProveedoresList";

// Admin Central — Staff
import AdminStaffList from "../../features/staff/components/admin/AdminStaffList";

// ── Gerente Local ──────────────────────────────────────────────────────────
// Menu principal de Gerente Local
import GerenteDashboard from "../../features/menu/components/Gerente/dashboard/GerenteDashboard";
import GIngredientesList from "../../features/menu/components/Gerente/menu/GIngredientesList";
import GCategoriasList from "../../features/menu/components/Gerente/menu/GCategoriasList";
import GPlatosList from "../../features/menu/components/Gerente/platos/GPlatosList";

// Inventario del Gerente Local (WIP)
import InventarioDashboard from "../../features/inventory/components/Gerente/InventarioDashboard";
import GProveedoresList from "../../features/inventory/components/Gerente/GProveedoresList";
import GOrdenesCompra from "../../features/inventory/components/Gerente/GOrdenesCompra";
import GStockList from "../../features/inventory/components/Gerente/GStockList";
import GLotesList from "../../features/inventory/components/Gerente/GLotesList";

// Staff del Gerente Local (WIP)
import GStaffLayout from "../../features/staff/components/Gerente/GStaffLayout";
import GEmpleadosList from "../../features/staff/components/Gerente/GEmpleadosList";
import GTurnosList from "../../features/staff/components/Gerente/GTurnosList";
import GNomina from "../../features/staff/components/Gerente/GNomina";

const WIP = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-stone-300 text-xl">
      🚧
    </div>
    <p className="text-stone-500 font-dm text-sm">{title} — próximamente</p>
  </div>
);

const SinPermiso = () => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-400 text-xl">
      🔒
    </div>
    <p className="text-stone-600 font-dm text-sm font-semibold">
      Sin permiso para esta sección
    </p>
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
      // ── Redirect inteligente por rol ─────────────────────────────────
      { index: true, element: <RoleBasedRedirect /> },

      // ── Admin Central — Restaurantes ─────────────────────────────────
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

      // ── Admin Central — Menú ─────────────────────────────────────────
      {
        path: "menu/categorias",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <CategoriasList />
          </RoleRoute>
        ),
      },
      { path: "menu/platos", element: <WIP title="Platos (admin)" /> },
      {
        path: "menu/ingredientes",
        element: <WIP title="Ingredientes (admin)" />,
      },

      // ── Admin Central — Inventario ───────────────────────────────────
      {
        path: "inventario",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <AInventarioDashboard />
          </RoleRoute>
        ),
      },
      { path: "inventario/stock", element: <WIP title="Stock global" /> },
      { path: "inventario/almacenes", element: <WIP title="Almacenes" /> },
      {
        path: "inventario/proveedores",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <AProveedoresList />
          </RoleRoute>
        ),
      },
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

      // ── Admin Central — Gestión ──────────────────────────────────────
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
            <AdminStaffList />
          </RoleRoute>
        ),
      },

      // ── Gerente Local — Dashboard ────────────────────────────────────
      {
        path: "gerente",
        element: (
          <RoleRoute roles={["gerente_local"]}>
            <GerenteDashboard />
          </RoleRoute>
        ),
      },

      // ── Gerente Local — Menú ─────────────────────────────────────────
      {
        path: "gerente/ingredientes",
        element: (
          <RoleRoute roles={["gerente_local"]}>
            <GIngredientesList />
          </RoleRoute>
        ),
      },
      {
        path: "gerente/categorias",
        element: (
          <RoleRoute roles={["gerente_local"]}>
            <GCategoriasList />
          </RoleRoute>
        ),
      },
      {
        path: "gerente/platos",
        element: (
          <RoleRoute roles={["gerente_local"]}>
            <GPlatosList />
          </RoleRoute>
        ),
      },

      // ── Gerente Local — Inventario (WIP) ─────────────────────────────
      {
        path: "gerente/inventario",
        element: (
          <RoleRoute roles={["gerente_local"]}>
            <InventarioDashboard />
          </RoleRoute>
        ),
      },
      {
        path: "gerente/proveedores",
        element: (
          <RoleRoute roles={["gerente_local"]}>
            <GProveedoresList />
          </RoleRoute>
        ),
      },
      {
        path: "gerente/ordenes",
        element: (
          <RoleRoute roles={["gerente_local"]}>
            <GOrdenesCompra />
          </RoleRoute>
        ),
      },
      {
        path: "gerente/stock",
        element: (
          <RoleRoute roles={["gerente_local"]}>
            <GStockList />
          </RoleRoute>
        ),
      },
      {
        path: "gerente/lotes",
        element: (
          <RoleRoute roles={["gerente_local"]}>
            <GLotesList />
          </RoleRoute>
        ),
      },

      // ── Gerente Local — Staff (WIP) ──────────────────────────────────
      {
        path: "gerente/staff",
        element: (
          <RoleRoute roles={["gerente_local"]}>
            <GStaffLayout />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <Navigate to="empleados" replace /> },
          { path: "empleados", element: <GEmpleadosList /> },
          { path: "turnos", element: <GTurnosList /> },
          { path: "nomina", element: <GNomina /> },
        ],
      },

      // ── Auxiliares ───────────────────────────────────────────────────
      { path: "sin-permiso", element: <SinPermiso /> },
      { path: "*", element: <RoleBasedRedirect /> },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default router;
