/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/controllers/nominaResumidaController.ts

/**
 * Descripcion: Controlador para consultar la vista de nomina resumida consumida por el frontend.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { RequestHandler } from 'express';
import { sql } from '../config/connectConsulta';
import { getDbPool } from '../utils/dbPool';
import { logger } from '../helpers/logger';

/** Filas que retorna la vista de nomina resumida,
 * alineadas con lo que consume el frontend (NominaResumidaDTO).
 */
export interface NominaResumidaRow {
  CodigoOrganismoMAP: string;
  Organismo: string;
  PoderDelEstado: string;
  Anio: number;
  Mes: number;
  Empleados: number;
}

/** Parametros para filtrar */
interface FetchOpts {
  organismoId?: number;
  poder?: string;
}

/**
 * Ejecuta la consulta de la vista de nomina resumida con filtros dinamicos.
 * @param anio Periodo anual solicitado.
 * @param mes Periodo mensual solicitado.
 * @param opts Filtros opcionales por organismo o poder del estado.
 * @returns Promesa con las filas que el frontend mostrara.
 */
export async function fetchNominaResumida(
  anio: number,
  mes: number,
  opts: FetchOpts = {},
): Promise<NominaResumidaRow[]> {
  const pool = await getDbPool();

  const where: string[] = ['Anio = @Anio', 'Mes = @Mes'];
  const request = pool.request().input('Anio', sql.Int, anio).input('Mes', sql.Int, mes);

  if (opts.organismoId !== undefined) {
    where.push('CodigoOrganismo = @OrganismoId');
    request.input('OrganismoId', sql.Int, opts.organismoId);
  }
  if (opts.poder) {
    where.push('PoderDelEstado = @Poder');
    request.input('Poder', sql.VarChar(50), opts.poder);
  }

  const query = `
    SELECT
      CAST(CodigoOrganismo AS VARCHAR(10)) AS CodigoOrganismoMAP,
      NombreOrganismo AS Organismo,
      PoderDelEstado,
      Anio,
      Mes,
      Empleados
    FROM dbo.View_RNP_Datos_Nomina_Resumida
    WHERE ${where.join(' AND ')}
    ORDER BY NombreOrganismo;
  `;

  const result = await request.query(query);
  return result.recordset as NominaResumidaRow[];
}

/**
 * Atiende la ruta HTTP que retorna la nomina resumida segun filtros recibidos.
 * @param req Incluye parametros de ruta (anio/mes) y query (organismoId/poder).
 * @param res Entrega la respuesta al cliente con la lista o el error correspondiente.
 * @returns Promise<void>
 */
export const getNominaResumida: RequestHandler = async (req, res) => {
  try {
    const anio = Number.parseInt(req.params.anio, 10);
    const mes = Number.parseInt(req.params.mes, 10);
    if (!Number.isFinite(anio) || !Number.isFinite(mes)) {
      res.status(400).json({ message: 'Parametros anio/mes invalidos' });
      return;
    }

    const organismoIdRaw = req.query.organismoId;
    const poderRaw = req.query.poder;

    const opts: FetchOpts = {};
    if (typeof organismoIdRaw === 'string' && organismoIdRaw.trim() !== '') {
      const n = Number.parseInt(organismoIdRaw, 10);
      if (Number.isFinite(n)) opts.organismoId = n;
    }
    if (typeof poderRaw === 'string' && poderRaw.trim() !== '') {
      opts.poder = poderRaw.trim().toUpperCase();
    }

    const rows = await fetchNominaResumida(anio, mes, opts);
    res.json(rows);
    return;
  } catch (err: any) {
    logger.error('getNominaResumida:', err);
    res.status(500).json({ message: 'Error al obtener nomina resumida' });
    return;
  }
};
