/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/components/RutaPorRol.tsx
import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

interface RutaPorRolProps {
  allowedRoles: string[];
}

const RutaPorRol: React.FC<RutaPorRolProps> = ({ allowedRoles }) => {
  // Obtenemos el rol desde el estado de autenticación de Redux.
  // Asegúrate de que este campo tenga el mismo nombre que usas en el backend (por ejemplo, "Administrador", "Mesa de Ayuda", etc.)
  const role = useSelector((state: any) => state.auth.role);

  // Si no hay rol o el rol no está permitido, redirigimos a /dashboard (o a otra página de "No autorizado")
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si el rol está permitido, renderizamos las rutas anidadas
  return <Outlet />;
};

export default RutaPorRol;
