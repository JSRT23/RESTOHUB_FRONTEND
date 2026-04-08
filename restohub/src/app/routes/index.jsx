// src/app/routes/index.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../../shared/components/layout/MainLayout";
import RestaurantesList from "../../features/menu/components/RestauranteList";
import CreateRestaurante from "../../features/menu/components/CreateRestaurante";
import RestauranteDetail from "../../features/menu/components/RestauranteDetail";
import MenuPublico from "../../features/menu/components/MenuPublico";
import PlatosList from "../../features/menu/components/PlatosList";
import PlatoDetail from "../../features/menu/components/PlatoDetail";
import CreatePlato from "../../features/menu/components/CreatePlato";
import CategoriasList from "../../features/menu/components/CategoriasList";
import IngredientesList from "../../features/menu/components/IngredientesList";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<RestaurantesList />} />
          <Route path="/restaurantes" element={<RestaurantesList />} />
          <Route path="/restaurantes/new" element={<CreateRestaurante />} />
          <Route path="/restaurantes/:id" element={<RestauranteDetail />} />
          <Route path="/restaurantes/:id/menu" element={<MenuPublico />} />
          <Route path="/menu/platos" element={<PlatosList />} />
          <Route path="/menu/platos/new" element={<CreatePlato />} />
          <Route path="/menu/platos/:id" element={<PlatoDetail />} />
          <Route path="/menu/categorias" element={<CategoriasList />} />
          <Route path="/menu/ingredientes" element={<IngredientesList />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
