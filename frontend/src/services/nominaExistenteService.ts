/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// rnp/frontend/src/services/nominaExistenteService.ts
import axios from "axios";

const API =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_BACKEND_URL ||
  "/api";

interface ExisteResponse {
  existe: boolean;
}

/* ───────────────── comprobar existencia ───────────────── */
export async function existeNomina(
  anio: number,
  mes: number,
  codigoOrg: number,
  token: string
): Promise<boolean> {
  const res = await axios.get<ExisteResponse>(`${API}/nomina/existe`, {
    params: { anio, mes, org: codigoOrg },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.existe;
}

/* ───────────────── borrar nómina ───────────────── */
export async function borrarNomina(
  anio: number,
  mes: number,
  codigoOrg: number,
  usuarioID: number | null,
  nombreUsuario: string,
  token: string
): Promise<void> {
  await axios.request({
    method: "DELETE",
    url: `${API}/nomina`,
    headers: { Authorization: `Bearer ${token}` },
    data: {
      anio,
      mes,
      org: codigoOrg,
      usuarioID,
      nombreUsuario,
    },
  });
}
