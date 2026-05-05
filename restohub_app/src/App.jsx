import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client/react";
import { client } from "./app/apollo/client";
import { AuthProvider } from "./app/auth/AuthContext";
import { LocationProvider } from "./app/auth/LocationContext";
import { CartProvider } from "./features/cart/context/CartContext";
import LocationPicker from "./shared/components/LocationPicker";
import Navbar from "./shared/components/Navbar";
import AppRoutes from "./app/routes";

function AppShell() {
  return (
    <>
      <LocationPicker />
      <Navbar />
      <AppRoutes />
    </>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <AppShell />
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ApolloProvider>
  );
}
