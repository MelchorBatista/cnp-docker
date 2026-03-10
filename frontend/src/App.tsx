/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
} from "@mui/material";

import Encabezado from "./components/Encabezado";
import Principal from "./components/Principal";
import SolicitarAcceso from "./components/SolicitarAcceso";
import ConfirmacionCorreo from "./components/confirmacionCorreo";
import AutenticaDO from "./components/AutenticaDO";
import Pie from "./components/Pie";
import RutaPrivada from "./components/RutaPrivada";
import RutaPorRol from "./components/RutaPorRol";
import Configuracion from "./components/Configuracion";
import GestionarUsuarios from "./components/GestionarUsuarios";
// import Estadisticas from "./components/Estadisticas";
import Auditoria from "./components/Auditoria";
import Ayuda from "./components/Ayuda";
import Asignaciones from "./components/Asignaciones";
import ErrorBoundary from "./components/ErrorBoundary";

// Importar el nuevo módulo de reportes
import ReporteNominaPage from "./components/reporteNomina/ReporteNominaPage";

const CNP_COLORS = {
  blueDark: "#003876",
  blueSky: "#00AADC",
  red: "#EE2A24",
  white: "#FFFFFF",
  black: "#000000",
  grayLight: "#F4F4F4",
  grayDark: "#808080",
  oliveGreen: "#AFCD6E",
  springGreen: "#91BE1E",
  tropicalGreen: "#739619",
} as const;

const ROUTER_BASENAME = (((import.meta as any).env?.BASE_URL as string | undefined) || "/")
  .trim()
  .replace(/\/+$/, "") || "/";

// Tema global alineado con la guia visual CNP
const theme = createTheme({
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  palette: {
    primary: {
      main: CNP_COLORS.blueDark,
      contrastText: CNP_COLORS.white,
    },
    secondary: {
      main: CNP_COLORS.blueSky,
      contrastText: CNP_COLORS.black,
    },
    error: {
      main: CNP_COLORS.red,
      contrastText: CNP_COLORS.white,
    },
    success: {
      light: CNP_COLORS.oliveGreen,
      main: CNP_COLORS.springGreen,
      dark: CNP_COLORS.tropicalGreen,
      contrastText: CNP_COLORS.black,
    },
    background: {
      default: CNP_COLORS.white,
      paper: CNP_COLORS.white,
    },
    text: {
      primary: CNP_COLORS.black,
      secondary: CNP_COLORS.grayDark,
    },
    divider: CNP_COLORS.grayLight,
  },
});

/**
 * Define el árbol de rutas públicas y protegidas del portal CNP.
 * @returns Estructura de rutas evaluada según autenticación y rol.
 * @author Dionicio Melchor Batista Jerez
 * @lastmod 2026-01-30
 */
const AppRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<AutenticaDO />} />
      <Route path="/solicitar-acceso" element={<SolicitarAcceso />} />
      <Route path="/confirmacionCorreo" element={<ConfirmacionCorreo />} />

      {/* Rutas protegidas */}
      <Route element={<RutaPrivada />}>
        <Route path="/dashboard" element={<Principal />} />

        {/* Rutas restringidas a Administrador y Mesa de Ayuda */}
        <Route
          element={
            <RutaPorRol allowedRoles={["Administrador", "Mesa de Ayuda"]} />
          }
        >
          <Route
            path="/gestionar-usuarios"
            element={<GestionarUsuarios key={location.key} />}
          />
          <Route path="/auditoria" element={<Auditoria />} />
          <Route path="/asignaciones" element={<Asignaciones />} />
        </Route>

        {/* Rutas accesibles a cualquier usuario autenticado */}
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/ayuda" element={<Ayuda />} />
        {/* <Route path="/estadisticas" element={<Estadisticas />} /> */}

        {/* Nueva ruta para Reportes de Nómina */}
        <Route path="/reporte-nomina" element={<ReporteNominaPage />} />
      </Route>

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

/**
 * Componente raíz: aplica el tema MUI y monta el router con manejo de errores.
 * @returns JSX principal de la aplicación CNP listo para renderizar.
 * @author Dionicio Melchor Batista Jerez
 * @lastmod 2026-01-30
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          ":root": {
            "--cnp-blue-dark": CNP_COLORS.blueDark,
            "--cnp-blue-sky": CNP_COLORS.blueSky,
            "--cnp-red": CNP_COLORS.red,
            "--cnp-white": CNP_COLORS.white,
            "--cnp-black": CNP_COLORS.black,
            "--cnp-gray-light": CNP_COLORS.grayLight,
            "--cnp-gray-dark": CNP_COLORS.grayDark,
            "--cnp-olive-green": CNP_COLORS.oliveGreen,
            "--cnp-spring-green": CNP_COLORS.springGreen,
            "--cnp-tropical-green": CNP_COLORS.tropicalGreen,
          },
          html: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            backgroundColor: CNP_COLORS.white,
          },
          body: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            backgroundColor: CNP_COLORS.white,
            color: CNP_COLORS.black,
          },
          a: {
            color: CNP_COLORS.blueSky,
          },
        }}
      />

      <ErrorBoundary>
        <Router basename={ROUTER_BASENAME === "/" ? undefined : ROUTER_BASENAME}>
          {/* Encabezado y Pie solo se montan una vez */}
          <Encabezado />
          <AppRoutes />
          <Pie />
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
