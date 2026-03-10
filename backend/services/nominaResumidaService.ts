/**
 * Ministerio de Administracion Publica (MAP)
 * Portal para Informacion Complementaria de Nominas Publicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sanchez Perez
 * Coordinador: Lucas Almonte
 */
// backend/services/nominaResumidaService.ts
import { getConexionConsulta, sql } from '../config/connectConsulta';

export interface NominaResumidaRow {
  CodigoOrganismo: number;
  PoderDelEstado: string;
  NombreOrganismo: string;
  Anio: number;
  Mes: number;
  FechaCargaDatos: Date;
  Empleados: number;
}

export const getNominaResumida = async (year: number, mes: number): Promise<NominaResumidaRow[]> => {
  const pool = await getConexionConsulta();

  const query = `
    SELECT
      CodigoOrganismo,
      PoderDelEstado,
      NombreOrganismo,
      Anio,
      Mes,
      FechaCargaDatos,
      Empleados
    FROM dbo.View_RNP_Datos_Nomina_Resumida
    WHERE Anio = @year
      AND Mes  = @mes
    ORDER BY
      PoderDelEstado,
      NombreOrganismo;
  `;

  const result = await pool.request().input('year', sql.Int, year).input('mes', sql.Int, mes).query(query);

  return result.recordset as NominaResumidaRow[];
};