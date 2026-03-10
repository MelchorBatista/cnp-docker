/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/components/RutaPrivada.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const RutaPrivada: React.FC = () => {
  // Se asume que el slice de autenticación tiene la propiedad isAuthenticated
  const isAuthenticated = useSelector(
    (state: any) => state.auth.isAuthenticated
  );

  // Si el usuario está autenticado, renderiza las rutas anidadas (Outlet), de lo contrario redirige a /login
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default RutaPrivada;
