// src/app/routes/index.jsx
// FIX: agrega rutas /pago-exitoso y /pago-fallido que MercadoPago necesita
// para el auto_return después del pago.

import { Routes, Route } from "react-router-dom";
import HomePage from "../../features/restaurantes/pages/HomePage";
import MenuPage from "../../features/menu/pages/MenuPage";
import CartPage from "../../features/cart/pages/CartPage";
import LoginPage from "../../features/auth/pages/LoginPage";
import PerfilPage from "../../features/loyalty/pages/PerfilPage";
import PagoExitoso from "../../features/cart/pages/PagoExitoso";
import PagoFallido from "../../features/cart/pages/PagoFallido";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/restaurante/:id" element={<MenuPage />} />
      <Route path="/carrito" element={<CartPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Perfil cliente */}
      <Route path="/perfil" element={<PerfilPage />} />
      <Route path="/puntos" element={<PerfilPage tab="puntos" />} />
      <Route path="/cupones" element={<PerfilPage tab="cupones" />} />
      <Route path="/pedidos" element={<PerfilPage tab="dashboard" />} />

      {/* MercadoPago — rutas de retorno después del pago */}
      <Route path="/pago-exitoso" element={<PagoExitoso />} />
      <Route path="/pago-fallido" element={<PagoFallido />} />

      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
