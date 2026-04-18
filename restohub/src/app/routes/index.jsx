// src/app/routes/index.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PrivateRoute, RoleRoute, RoleBasedRedirect } from "./guards";
import MainLayout from "../../shared/components/layout/MainLayout";
import LoginPage from "../../features/auth/components/LoginPage";

// ── Admin Central — Restaurantes ──────────────────────────────────────────
import CategoriasList from "../../features/menu/components/admin/CategoriasList";
import RestaurantesList from "../../features/menu/components/admin/RestauranteList";
import CreateRestauranteWizard from "../../features/menu/components/admin/CreateRestauranteWizard";
import RestauranteDetail from "../../features/menu/components/admin/RestauranteDetail";

// Admin Central — Menu
import PlatosList from "../../features/menu/components/admin/PlatosList";
import PlatoDetail from "../../features/menu/components/admin/PlatoDetail";
import CreatePlato from "../../features/menu/components/admin/CreatePlato";
import IngredientesList from "../../features/menu/components/admin/IngredientesList";

// Admin Central — Inventario
import AInventarioDashboard from "../../features/inventory/components/admin/AInventarioDashboard";
import AProveedoresList from "../../features/inventory/components/admin/AProveedoresList";
import AStockGlobal from "../../features/inventory/components/admin/AStockGlobal";
import AAlmacenesList from "../../features/inventory/components/admin/AAlmacenesList";

// Admin Central — Staff
import AdminStaffList from "../../features/staff/components/admin/AdminStaffList";
import AdminUsuariosList from "../../features/staff/components/admin/AdminUsuariosList";

// ── Gerente Local ─────────────────────────────────────────────────────────
import GerenteDashboard from "../../features/menu/components/Gerente/dashboard/GerenteDashboard";
import GIngredientesList from "../../features/menu/components/Gerente/menu/GIngredientesList";
import GCategoriasList from "../../features/menu/components/Gerente/menu/GCategoriasList";
import GPlatosList from "../../features/menu/components/Gerente/platos/GPlatosList";

// Inventario Gerente
import InventarioDashboard from "../../features/inventory/components/Gerente/InventarioDashboard";
import GProveedoresList from "../../features/inventory/components/Gerente/GProveedoresList";
import GOrdenesCompra from "../../features/inventory/components/Gerente/GOrdenesCompra";
import GStockList from "../../features/inventory/components/Gerente/GStockList";
import GLotesList from "../../features/inventory/components/Gerente/GLotesList";

// Staff Gerente
import GStaffLayout from "../../features/staff/components/Gerente/GStaffLayout";
import GEmpleadosList from "../../features/staff/components/Gerente/GEmpleadosList";
import GTurnosList from "../../features/staff/components/Gerente/GTurnosList";
import GNomina from "../../features/staff/components/Gerente/GNomina";

// Loyalty Gerente
import GLoyalty from "../../features/loyalty/components/Gerente/GLoyalty";

// ── Mesero ────────────────────────────────────────────────────────────────
import MMeseroLayout from "../../features/orders/components/Mesero/MMeseroLayout";
import MNuevoPedido from "../../features/orders/components/Mesero/MNuevoPedido";
import MMisPedidos from "../../features/orders/components/Mesero/MMisPedidos";
import MMiTurno from "../../features/staff/components/Mesero/MMiTurno";

// ── Cocinero ──────────────────────────────────────────────────────────────
import CCocineroLayout from "../../features/orders/components/Cocinero/CCocineroLayout";
import CComandas from "../../features/orders/components/Cocinero/CComandas";
import CStockList from "../../features/inventory/components/Cocinero/CStockList";
import CMiTurno from "../../features/staff/components/Cocinero/CMiTurno";

// ── Cajero ────────────────────────────────────────────────────────────────
import CCajeroLayout from "../../features/orders/components/Cajero/CCajeroLayout";
import CCobrar from "../../features/orders/components/Cajero/CCobrar";
import CPedidosDia from "../../features/orders/components/Cajero/CPedidosDia";
import CMiTurnoCajero from "../../features/staff/components/Cajero/CMiTurnoCajero";

// ── Repartidor ────────────────────────────────────────────────────────────
import RRepartidorLayout from "../../features/orders/components/Repartidor/RRepartidorLayout";
import RMisEntregas from "../../features/orders/components/Repartidor/RMisEntregas";
import REnCamino from "../../features/orders/components/Repartidor/REnCamino";
import RMiTurno from "../../features/staff/components/Repartidor/RMiTurno";

import SSupervisorLayout from "../../features/staff/components/Supervisor/SSupervisorLayout";
import SPedidosList from "../../features/orders/components/Supervisor/SPedidosList";
import SStaffList from "../../features/staff/components/Supervisor/SStaffList";
import SStockList from "../../features/inventory/components/Supervisor/SStockList";

// ── Placeholders ──────────────────────────────────────────────────────────
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
      {
        path: "menu/platos",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <PlatosList />
          </RoleRoute>
        ),
      },
      {
        path: "menu/platos/nuevo",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <CreatePlato />
          </RoleRoute>
        ),
      },
      {
        path: "menu/platos/:id",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <PlatoDetail />
          </RoleRoute>
        ),
      },
      {
        path: "menu/ingredientes",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <IngredientesList />
          </RoleRoute>
        ),
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
      {
        path: "inventario/proveedores",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <AProveedoresList />
          </RoleRoute>
        ),
      },
      {
        path: "inventario/stock",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <AStockGlobal />
          </RoleRoute>
        ),
      },
      {
        path: "inventario/almacenes",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <AAlmacenesList />
          </RoleRoute>
        ),
      },
      {
        path: "inventario/ordenes",
        element: (
          <RoleRoute roles={["admin_central", "gerente_local"]}>
            <WIP title="Órdenes de compra (admin)" />
          </RoleRoute>
        ),
      },
      { path: "inventario/alertas", element: <WIP title="Alertas de stock" /> },
      { path: "inventario/lotes", element: <WIP title="Lotes (global)" /> },

      // ── Admin Central — Gestión ──────────────────────────────────────
      {
        path: "admin/usuarios",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <AdminUsuariosList />
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
      {
        path: "admin/loyalty",
        element: (
          <RoleRoute roles={["admin_central"]}>
            <WIP title="Loyalty — Promociones y cupones" />
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

      // ── Gerente Local — Inventario ───────────────────────────────────
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

      // ── Gerente Local — Staff ────────────────────────────────────────
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

      // ── Gerente Local — Loyalty ──────────────────────────────────────
      {
        path: "gerente/loyalty",
        element: (
          <RoleRoute roles={["gerente_local"]}>
            <GLoyalty />
          </RoleRoute>
        ),
      },

      // ── Supervisor ───────────────────────────────────────────────────
      {
        path: "supervisor",
        element: (
          <RoleRoute roles={["supervisor"]}>
            <SSupervisorLayout />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <Navigate to="pedidos" replace /> },
          { path: "pedidos", element: <SPedidosList /> },
          { path: "staff", element: <SStaffList /> },
          { path: "stock", element: <SStockList /> },
        ],
      },

      // ── Mesero ───────────────────────────────────────────────────────
      {
        path: "mesero",
        element: (
          <RoleRoute roles={["mesero"]}>
            <MMeseroLayout />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <MNuevoPedido /> },
          { path: "pedidos", element: <MMisPedidos /> },
          { path: "turno", element: <MMiTurno /> },
        ],
      },
      // ── Cocinero ─────────────────────────────────────────────────────
      {
        path: "cocina",
        element: (
          <RoleRoute roles={["cocinero"]}>
            <CCocineroLayout />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <CComandas /> },
          { path: "stock", element: <CStockList /> },
          { path: "turno", element: <CMiTurno /> },
        ],
      },
      // ── Cajero ───────────────────────────────────────────────────────
      {
        path: "caja",
        element: (
          <RoleRoute roles={["cajero"]}>
            <CCajeroLayout />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <CCobrar /> },
          { path: "pedidos", element: <CPedidosDia /> },
          { path: "turno", element: <CMiTurnoCajero /> },
        ],
      },
      // ── Repartidor ───────────────────────────────────────────────────
      {
        path: "entregas",
        element: (
          <RoleRoute roles={["repartidor"]}>
            <RRepartidorLayout />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <RMisEntregas /> },
          { path: "en-camino", element: <REnCamino /> },
          { path: "turno", element: <RMiTurno /> },
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
