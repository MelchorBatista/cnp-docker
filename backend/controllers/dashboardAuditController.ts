/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/controllers/dashboardAuditController.ts

/**
 * Descripcion: Provee la data mostrada en el tablero de auditoria del portal.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { Request, Response } from 'express';
import { connectRecepcion } from '../config/connectRecepcion';

/**
 * Recupera los eventos mas recientes de auditoria para visualizarlos en el dashboard.
 * @param req Solicitud HTTP estandar sin parametros adicionales.
 * @param res Regresa la lista de auditorias ordenadas por fecha.
 * @returns Promise<void>
 */
export const getDashboardAuditRecords = async (req: Request, res: Response) => {
  try {
    const pool = await connectRecepcion();

    const query = `
      SELECT 
        AuditoriaID, 
        NombreUsuario, 
        TipoAccion, 
        Modulo, 
        MarcaTiempo, 
        DireccionIP, 
        Detalles 
      FROM RNP_Auditoria
      ORDER BY MarcaTiempo DESC
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error: any) {
    console.error('Error fetching dashboard audit records:', error);
    res.status(500).json({ error: error.message });
  }
};
