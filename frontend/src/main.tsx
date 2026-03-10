/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/main.tsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./store";

// (Optional cleanup on first load; keep commented unless you really want it)
// localStorage.clear();
// sessionStorage.clear();
// if ("caches" in window) { caches.keys().then(names => names.forEach(n => caches.delete(n))); }

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      {/* Do NOT mount any Router here to avoid nested Routers */}
      <App />
    </Provider>
  </StrictMode>
);
