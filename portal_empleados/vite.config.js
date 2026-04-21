// portal_empleados/vite.config.js
// Con @vitejs/plugin-basic-ssl el portal corre en https://IP:5174
// El celular mostrará advertencia de certificado → toca "Avanzado" → "Continuar" → funciona

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [
    react(),
    basicSsl(), // genera certificado auto-firmado para HTTPS local
  ],
  server: {
    host: true, // expone en red local (0.0.0.0) → accesible desde celular
    port: 5174,
    https: true, // activa HTTPS — necesario para getUserMedia en celular
  },
});
