import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5175,
    // Evita que Vite use inotify (problemático en Docker con volúmenes Windows)
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
});
