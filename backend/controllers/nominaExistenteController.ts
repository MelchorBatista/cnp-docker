/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// rnp/backend/controllers/nominaExistenteController.ts

/**
 * Descripcion: Expone endpoints para validar y eliminar nominas previamente registradas.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { Request, Response } from 'express';
import { existeNomina, borrarNominaExistente } from '../services/nominaExistenteService';

/**
 * Indica si existe una nomina para los filtros solicitados.
 * @param req Incluye los parametros de anio, mes y organismo.
 * @param res Retorna un objeto con la bandera existe.
 * @returns Promise<void>
 */
export async function checkNominaExistente(req: Request, res: Response) {
  try {
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);
    const org = Number(req.query.org);

    const existe = await existeNomina(anio, mes, org);
    res.json({ existe });
  } catch (err: any) {
    console.error('Error al comprobar nomina existente:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Elimina la nomina existente segun los parametros proporcionados.
 * @param req Cuerpo con anio, mes, organismo y datos del usuario responsable.
 * @param res Indica si el registro fue eliminado exitosamente.
 * @returns Promise<void>
 */
export async function deleteNominaExistente(req: Request, res: Response) {
  try {
    const { anio, mes, org, usuarioID, nombreUsuario } = req.body;

    await borrarNominaExistente(
      Number(anio),
      Number(mes),
      Number(org),
      usuarioID !== undefined ? Number(usuarioID) : null,
      String(nombreUsuario),
      req.ip,
    );

    res.json({ eliminado: true });
  } catch (err: any) {
    console.error('Error al eliminar nomina existente:', err);
    res.status(500).json({ error: err.message });
  }
}

export { existeNomina };
