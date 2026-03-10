/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/modules/reporteNomina/services/ReporteNominaService.ts

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_BACKEND_URL ||
  "/api";

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Organismo {
  Codigo: number;
  Nombre: string;
}

export interface NominaDato {
  [key: string]: any;
}

/**
 * 1) Obtiene la lista de organismos únicos
 */
export async function fetchReporteNominaOrganismos(): Promise<Organismo[]> {
  const res = await fetch(`${API_BASE}/reporte-nomina/organismos`, {
    headers: { ...authHeader(), "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Error al cargar organismos: ${res.statusText}`);
  return res.json();
}

/**
 * 2) Obtiene la lista de años disponibles (únicos)
 */
export async function fetchReporteNominaAnios(params: {
  organismoId: number;
}): Promise<number[]> {
  const { organismoId } = params;
  const res = await fetch(
    `${API_BASE}/reporte-nomina/anios?organismoId=${organismoId}`,
    { headers: { ...authHeader() } }
  );
  if (!res.ok) throw new Error(`Error al cargar años: ${res.statusText}`);
  return res.json();
}

/**
 * 3) Obtiene la lista de meses disponibles para un organismo y año dados
 */
export async function fetchReporteNominaMeses(params: {
  organismoId: number;
  year: number;
}): Promise<number[]> {
  const { organismoId, year } = params;
  const res = await fetch(
    `${API_BASE}/reporte-nomina/meses?organismoId=${organismoId}&year=${year}`,
    { headers: { ...authHeader() } }
  );
  if (!res.ok) throw new Error(`Error al cargar meses: ${res.statusText}`);
  return res.json();
}

/**
 * 4) Obtiene los datos de nómina filtrados por organismo/año/mes
 */
export async function fetchReporteNominaPorMes(params: {
  organismoId: number;
  year: number;
  mes: number;
}): Promise<NominaDato[]> {
  const { organismoId, year, mes } = params;
  const res = await fetch(
    `${API_BASE}/reporte-nomina/por-mes?organismoId=${organismoId}&year=${year}&mes=${mes}`,
    { headers: { ...authHeader(), "Content-Type": "application/json" } }
  );
  if (!res.ok) throw new Error(`Error al obtener datos: ${res.statusText}`);
  return res.json();
}

/**
 * 5) Descarga el PDF de la nómina
 */
export async function downloadReporteNominaPdf(params: {
  organismoId: number;
  year: number;
  mes: number;
}): Promise<Blob> {
  const { organismoId, year, mes } = params;
  const res = await fetch(
    `${API_BASE}/reporte-nomina/pdf?organismoId=${organismoId}&year=${year}&mes=${mes}`,
    { headers: { ...authHeader() } }
  );
  if (!res.ok) throw new Error(`Error al descargar PDF: ${res.statusText}`);
  return res.blob();
}
