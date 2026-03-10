/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/controllers/assignmentController.ts

/**
 * Descripcion: Controlador que gestiona las asignaciones entre usuarios y organismos del portal.
 * Autor: Equipo CNP
 * Última modificación: 2025-12-05
 */
import { Request, Response, RequestHandler } from 'express';
import sql from 'mssql';
import { connectRecepcion } from '../config/connectRecepcion';
import { registrarAuditoria } from '../middleware/audit';

/**
 * Obtiene las asignaciones existentes para mostrarlas en el portal de administración.
 * @param req Petición HTTP entrante.
 * @param res Respuesta enviada al cliente con la lista de asignaciones.
 * @returns Promise<void>
 */
export const getAssignments: RequestHandler = async (req, res) => {
  try {
    const pool = await connectRecepcion();
    const result = await pool.request().query('SELECT * FROM RNP_Asignaciones');
    res.json(result.recordset);
  } catch (error: any) {
    console.error('[ASSIGNMENTS] ❌ Error al obtener asignaciones', error);
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
};

/**
 * Registra una nueva asignación usuario-organismo en el sistema.
 * @param req Contiene los datos del usuario, organismo y trazabilidad.
 * @param res Comunica el resultado de la creación al cliente.
 * @returns Promise<void>
 */
export const addAssignment: RequestHandler = async (req, res) => {
  const { usuarioId, organismoId, auditor, nombreOrganismo, correoUsuario } = req.body;

  if (!usuarioId || !organismoId || !auditor || !nombreOrganismo || !correoUsuario) {
    res.status(400).json({
      error: 'usuarioId, organismoId, auditor, nombreOrganismo y correoUsuario son requeridos',
    });
    return;
  }

  try {
    const pool = await connectRecepcion();

    await pool
      .request()
      .input('usuarioId', sql.Int, usuarioId)
      .input('organismoId', sql.Int, organismoId)
      .query('INSERT INTO RNP_Asignaciones (UsuarioID, OrganismoID) VALUES (@usuarioId, @organismoId)');

    const detalles = `${auditor} asignó el organismo "${nombreOrganismo.toUpperCase()}" al usuario "${correoUsuario}"`;

    await registrarAuditoria(usuarioId, 'ASIGNACION DE ORGANISMOS', 'Asignaciones', detalles, req.ip, auditor);

    res.json({ message: 'Asignación agregada exitosamente' });
  } catch (error: any) {
    console.error('[ASSIGNMENTS] ❌ Error al agregar asignación', error);
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
};

/**
 * Elimina una asignación existente y registra el evento en la auditoría.
 * @param req Incluye identificadores de usuario/organismo y datos del auditor.
 * @param res Detalla si la asignación fue removida correctamente.
 * @returns Promise<void>
 */
export const removeAssignment: RequestHandler = async (req, res) => {
  const { usuarioId, organismoId, auditor, nombreOrganismo, correoUsuario } = req.body;

  if (!usuarioId || !organismoId || !auditor || !nombreOrganismo || !correoUsuario) {
    res.status(400).json({
      error: 'usuarioId, organismoId, auditor, nombreOrganismo y correoUsuario son requeridos',
    });
    return;
  }

  try {
    const pool = await connectRecepcion();

    await pool
      .request()
      .input('usuarioId', sql.Int, usuarioId)
      .input('organismoId', sql.Int, organismoId)
      .query('DELETE FROM RNP_Asignaciones WHERE UsuarioID = @usuarioId AND OrganismoID = @organismoId');

    const detalles = `${auditor} removió la asignación del organismo "${nombreOrganismo.toUpperCase()}" del usuario "${correoUsuario}"`;

    await registrarAuditoria(usuarioId, 'REMOCION DE ASIGNACION', 'Asignaciones', detalles, req.ip, auditor);

    res.json({ message: 'Asignación removida exitosamente' });
  } catch (error: any) {
    console.error('[ASSIGNMENTS] ❌ Error al remover asignación', error);
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
};
