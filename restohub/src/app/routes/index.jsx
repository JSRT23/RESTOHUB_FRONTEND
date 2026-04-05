import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../../shared/components/layout/MainLayout";
import RestaurantesList from "../../features/menu/components/RestauranteList";
import CreateRestaurante from "../../features/menu/components/CreateRestaurante";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<RestaurantesList />} />
          <Route path="/restaurantes" element={<RestaurantesList />} />
          <Route path="/restaurantes/new" element={<CreateRestaurante />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
