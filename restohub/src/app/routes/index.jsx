// src/routes/index.jsx
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../../shared/components/layout/MainLayout";

// ── Menu ───────────────────────────────────────────────────────────────────
import RestaurantesList from "../../features/menu/components/RestauranteList";
import CreateRestaurante from "../../features/menu/components/CreateRestaurante";
import RestauranteDetail from "../../features/menu/components/RestauranteDetail";
import MenuPublico from "../../features/menu/components/MenuPublico";
import PlatosList from "../../features/menu/components/PlatosList";
import CreatePlato from "../../features/menu/components/CreatePlato";
import PlatoDetail from "../../features/menu/components/PlatoDetail";
import CategoriasList from "../../features/menu/components/CategoriasList";
import IngredientesList from "../../features/menu/components/IngredientesList";

// ── Inventory ──────────────────────────────────────────────────────────────
import InventarioDashboard from "../../features/inventory/components/InventarioDashboard";
import StockList from "../../features/inventory/components/StockList";
import OrdenesCompra, {
  CreateOrdenWizard,
} from "../../features/inventory/components/OrdenesCompra";
import ProveedoresList from "../../features/inventory/components/ProveedoresList";
import AlmacenesList from "../../features/inventory/components/AlmacenesList";
import LotesList from "../../features/inventory/components/LotesList";
import AlertasList from "../../features/inventory/components/AlertasList";

// ── 404 ────────────────────────────────────────────────────────────────────
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="font-playfair text-stone-900 text-5xl font-bold">404</p>
      <p className="font-dm text-stone-400">Página no encontrada.</p>
      <a href="/" className="text-amber-600 text-sm font-dm hover:underline">
        Volver al inicio
      </a>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // ── Index ──────────────────────────────────────────────────────────
      { index: true, element: <RestaurantesList /> },

      // ── MENU SERVICE ───────────────────────────────────────────────────
      { path: "restaurantes", element: <RestaurantesList /> },
      { path: "restaurantes/new", element: <CreateRestaurante /> },
      { path: "restaurantes/:id", element: <RestauranteDetail /> },
      { path: "restaurantes/:id/menu", element: <MenuPublico /> },

      { path: "menu/platos", element: <PlatosList /> },
      { path: "menu/platos/new", element: <CreatePlato /> },
      { path: "menu/platos/:id", element: <PlatoDetail /> },

      { path: "menu/categorias", element: <CategoriasList /> },
      { path: "menu/ingredientes", element: <IngredientesList /> },

      // ── INVENTORY SERVICE ──────────────────────────────────────────────
      { path: "inventario", element: <InventarioDashboard /> },
      { path: "inventario/stock", element: <StockList /> },
      { path: "inventario/ordenes", element: <OrdenesCompra /> },
      { path: "inventario/ordenes/new", element: <CreateOrdenWizard /> },
      { path: "inventario/alertas", element: <AlertasList /> },
      { path: "inventario/proveedores", element: <ProveedoresList /> },
      { path: "inventario/almacenes", element: <AlmacenesList /> },
      { path: "inventario/lotes", element: <LotesList /> },

      // ── 404 ────────────────────────────────────────────────────────────
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;
