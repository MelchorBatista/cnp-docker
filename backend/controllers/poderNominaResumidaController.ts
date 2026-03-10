/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/controllers/poderNominaResumidaController.ts

/**
 * Descripcion: Controlador para consultar nominas resumidas filtradas por poder del Estado.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { RequestHandler } from 'express';
import { sql } from '../config/connectConsulta';
import { getDbPool } from '../utils/dbPool';
import { logger } from '../helpers/logger';

export interface NominaResumidaPoderRow {
  CodigoOrganismoMAP: string;
  Organismo: string;
  PoderDelEstado: string;
  Anio: number;
  Mes: number;
  Empleados: number;
}

/** Conjunto permitido de nombres largos (tal cual viajan desde el frontend) */
export const ALLOWED_PODERES = new Set<string>([
  'PODER EJECUTIVO',
  'PODER LEGISLATIVO',
  'PODER JUDICIAL',
  'GOBIERNO LOCAL',
  'ORGANISMO AUTONOMO',
]);

/**
 * Consulta la vista de nomina resumida filtrando por poder del Estado.
 * @param anio Periodo solicitado.
 * @param mes Mes solicitado.
 * @param poderLargo Nombre del poder recibido desde el frontend.
 * @returns Lista de registros coincidentes.
 */
export async function fetchNominaResumidaPorPoder(
  anio: number,
  mes: number,
  poderLargo: string,
): Promise<NominaResumidaPoderRow[]> {
  const pool = await getDbPool();

  const poder = (poderLargo ?? '').trim();

  const req = pool
    .request()
    .input('Anio', sql.Int, anio)
    .input('Mes', sql.Int, mes)
    .input('Poder', sql.VarChar(50), poder);

  const query = `
    SELECT
      CAST(CodigoOrganismo AS VARCHAR(10)) AS CodigoOrganismoMAP,
      NombreOrganismo AS Organismo,
      PoderDelEstado,
      Anio,
      Mes,
      Empleados
    FROM dbo.View_RNP_Datos_Nomina_Resumida
    WHERE Anio = @Anio
      AND Mes = @Mes
      AND PoderDelEstado = @Poder
    ORDER BY NombreOrganismo;
  `;

  const result = await req.query(query);
  return result.recordset as NominaResumidaPoderRow[];
}

/**
 * Maneja la ruta GET /api/nomina-resumida-poder/:anio/:mes?poder=.
 * @param req Incluye anio, mes y el nombre del poder enviado por querystring.
 * @param res Entrega el arreglo de filas o describe el error hallado.
 * @returns Promise<void>
 */
export const getNominaResumidaPorPoder: RequestHandler = async (req, res) => {
  try {
    const anio = Number.parseInt(req.params.anio, 10);
    const mes = Number.parseInt(req.params.mes, 10);
    const poderQS = typeof req.query.poder === 'string' ? req.query.poder : '';

    if (!Number.isFinite(anio) || !Number.isFinite(mes) || !poderQS) {
      res.status(400).json({ message: 'Parametros invalidos (anio/mes/poder)' });
      return;
    }

    const poder = poderQS.trim();
    if (!ALLOWED_PODERES.has(poder)) {
      res.status(400).json({
        message:
          "Valor de 'poder' invalido. Debe ser uno de: PODER EJECUTIVO | PODER LEGISLATIVO | PODER JUDICIAL | GOBIERNO LOCAL | ORGANISMO AUTONOMO",
      });
      return;
    }

    const rows = await fetchNominaResumidaPorPoder(anio, mes, poder);
    res.json(rows);
    return;
  } catch (err) {
    logger.error('getNominaResumidaPorPoder:', err);
    res.status(500).json({ message: 'Error al obtener nomina resumida por Poder' });
    return;
  }
};
