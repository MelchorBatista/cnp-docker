/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// rnp/backend/middleware/audit.ts

import * as sql from 'mssql';
import { connectRecepcion } from '../config/connectRecepcion';

/**
 * Registra una acción en la tabla RNP_Auditoria.
 *
 * @param usuarioID        Identificador del usuario (puede ser null).
 * @param tipoAccion       Código o descripción corta de la acción.
 * @param modulo           Módulo o sección del sistema.
 * @param detalles         Descripción ampliada de la acción.
 * @param direccionIP      IP del cliente. Si llega null/undefined/“”, se registra “0.0.0.0”.
 * @param correoElectronico Nombre de usuario o correo asociado.
 */
export const registrarAuditoria = async (
  usuarioID: number | null,
  tipoAccion: string,
  modulo: string,
  detalles: string,
  direccionIP: string | undefined | null,
  correoElectronico: string,
): Promise<void> => {
  // Evitar registrar auditoría de VALIDATION_ENCRYPT para no crecer la tabla
  if (tipoAccion === 'VALIDATION_ENCRYPT') {
    return;
  }
  /* Valor por defecto para evitar violar la restricción NOT NULL */
  if (tipoAccion === 'VALIDATION_ENCRYPT_FALLIDO') {
    return;
  }
  const ipFinal = direccionIP && direccionIP.trim() !== '' ? direccionIP : '0.0.0.0';

  try {
    const pool = await connectRecepcion();

    await pool
      .request()
      .input('UsuarioID', sql.Int, usuarioID)
      .input('NombreUsuario', sql.VarChar, correoElectronico)
      .input('TipoAccion', sql.VarChar, tipoAccion)
      .input('Modulo', sql.VarChar, modulo)
      .input('DireccionIP', sql.VarChar, ipFinal) // ← usa ipFinal
      .input('Detalles', sql.Text, detalles).query(`
        INSERT INTO RNP_Auditoria
          (UsuarioID, NombreUsuario, TipoAccion, Modulo, MarcaTiempo, DireccionIP, Detalles)
        VALUES
          (@UsuarioID, @NombreUsuario, @TipoAccion, @Modulo, GETDATE(), @DireccionIP, @Detalles)
      `);

    console.log(`📌 Auditoría registrada: ${tipoAccion}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error al registrar auditoría:', error.message);
    } else {
      console.error('❌ Error al registrar auditoría:', error);
    }
  }
};
