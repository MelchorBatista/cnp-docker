/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/services/UserService.ts
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_BACKEND_URL ||
  "/api";

export interface User {
  id: number;
  nombres: string;
  apellidos: string;
  correoElectronico: string;
  telefono: string;
  estatus: string;
  // Agrega otros campos que consideres necesarios
}

export const getUsuarios = async (): Promise<User[]> => {
  const response = await fetch(`${API_BASE}/usuarios`);
  if (!response.ok) {
    throw new Error("Error al obtener usuarios");
  }
  return await response.json();
};
