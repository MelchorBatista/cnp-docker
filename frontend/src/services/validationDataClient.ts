/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// rnp/frontend/src/services/validationDataClient.ts

import apiClient from "./apiClient";

export interface ValidationData {
  organismos: any[];
  nivelGobierno: any[];
  tiposEmpleados: any[];
  catalogo: any[];
  cargo: any[];
  categoriaEmpleados: any[];
}

/**
 * Fetch validation catalogs using the shared apiClient.
 */
export async function fetchValidationData(): Promise<ValidationData | null> {
  try {
    const token = localStorage.getItem("token") || undefined;

    const { data } = await apiClient.get("validation", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    return data as ValidationData;
  } catch (error) {
    console.error("Excepcion al obtener datos de validacion:", error);
    return null;
  }
}
