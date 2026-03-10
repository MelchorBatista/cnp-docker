/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/services/assignmentUsers.ts

import apiClient from "./apiClient";

export interface Assignment {
  OrganismoID: number;
  UsuarioID: number;
  Estatus: string;

  // Agrega aquí otros campos según la estructura real de asignaciones
}

export async function getUserAssignments(): Promise<Assignment[]> {
  try {
    // Llama usando apiClient, que ya incluye baseURL y cabeceras necesarias
    const response = await apiClient.get<Assignment[]>("/asignaciones");
    return response.data;
  } catch (error) {
    console.error("Excepción al obtener asignaciones:", error);
    throw error;
  }
}
