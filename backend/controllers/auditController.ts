/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/controllers/auditController.ts

/**
 * Descripcion: Controlador dedicado a persistir eventos de auditoria del portal.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { Request, Response, RequestHandler } from 'express';
import sql from 'mssql';
import { connectRecepcion } from '../config/connectRecepcion';

/**
 * Registra una accion relevante dentro de la bitacora institucional.
 * @param req Contiene el modulo, la accion y los detalles que envia el frontend.
 * @param res Reporta si el evento fue almacenado o retorna el error correspondiente.
 * @returns Promise<void>
 */
export const recordAudit: RequestHandler = async (req, res) => {
  const { TipoAccion, Modulo, Detalles } = req.body;

  if (!TipoAccion || !Modulo || !Detalles) {
    res.status(400).json({ error: 'Todos los campos son requeridos' });
    return;
  }

  try {
    const pool = await connectRecepcion();

    await pool
      .request()
      .input('TipoAccion', sql.VarChar(100), TipoAccion)
      .input('Modulo', sql.VarChar(100), Modulo)
      .input('Detalles', sql.VarChar(500), Detalles)
      .query(
        'INSERT INTO RNP_Auditoria (TipoAccion, Modulo, Detalles, Fecha)\n         VALUES (@TipoAccion, @Modulo, @Detalles, GETDATE())',
      );

    res.json({ message: 'Auditoria registrada exitosamente' });
  } catch (error: any) {
    console.error('[AUDIT] Error al registrar auditoria', error);
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
};
