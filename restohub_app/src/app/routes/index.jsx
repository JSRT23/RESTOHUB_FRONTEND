import { Routes, Route } from "react-router-dom";
import HomePage from "../../features/restaurantes/pages/HomePage";
import MenuPage from "../../features/menu/pages/MenuPage";
import CartPage from "../../features/cart/pages/CartPage";
import LoginPage from "../../features/auth/pages/LoginPage";
import PerfilPage from "../../features/loyalty/pages/PerfilPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/restaurante/:id" element={<MenuPage />} />
      <Route path="/carrito" element={<CartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/perfil" element={<PerfilPage />} />
      <Route path="/pedidos" element={<PerfilPage tab="pedidos" />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
