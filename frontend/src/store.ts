/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/store.ts
import { configureStore } from "@reduxjs/toolkit";

// Reducers
import authReducer from "./slices/authSlice";
import reporteNominaReducer from "./slices/reporteNominaSlice";
import nominaResumidaReducer from "./slices/nominaResumidaSlice";
// Flujo separado “Poder del Estado”
import nominaResumidaPoderReducer from "./slices/nominaResumidaPoderSlice";

// Inyección del store en el cliente HTTP
import { injectStore } from "./services/apiClient";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reporteNomina: reporteNominaReducer,
    nominaResumida: nominaResumidaReducer,
    nominaResumidaPoder: nominaResumidaPoderReducer,
    // …agrega aquí otros reducers que tengas
  },
  // Si usas middleware/serializers/RTK Query, puedes ajustarlo:
  // middleware: (getDefault) => getDefault(),
  // devTools: process.env.NODE_ENV !== "production",
});

// Inyectamos el store en apiClient (para Authorization automática)
injectStore(store);

// Tipos globales
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
