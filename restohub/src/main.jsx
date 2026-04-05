// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/routes";
import AppProvider from "./app/providers/AppProvider";
import "./shared/styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>
      <AppRouter />
    </AppProvider>
  </React.StrictMode>,
);
