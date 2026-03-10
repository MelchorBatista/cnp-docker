/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/controllers/queryController.ts

/**
 * Descripcion: Controlador auxiliar para pruebas de registros basicos y consultas directas.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { Request, Response } from 'express';
import { connectRecepcion, sql } from '../config/connectRecepcion';
import { registrarAuditoria } from '../middleware/audit';
import bcrypt from 'bcryptjs';

interface SolicitarAccesoBody {
  nombres: string;
  apellidos: string;
  correoElectronico: string;
  telefono: string;
  cedula: string;
  clave: string;
}

/**
 * Registra solicitudes de acceso basicas utilizadas en escenarios de prueba.
 * @param req Contiene los datos de contacto capturados en el formulario.
 * @param res Indica si el registro se creo o describe el error hallado.
 * @returns Promise<void>
 */
export const solicitarAcceso = async (req: Request, res: Response): Promise<void> => {
  const { nombres, apellidos, correoElectronico, telefono, cedula, clave } = req.body as SolicitarAccesoBody;

  try {
    console.log('📌 Recibida solicitud de acceso:', req.body);

    const pool = await connectRecepcion();

    // Verificar si el usuario ya existe
    const usuarioExistente = await pool
      .request()
      .input('CorreoElectronico', sql.VarChar, correoElectronico)
      .input('Cedula', sql.VarChar, cedula)
      .query('SELECT UsuarioID FROM RNP_Usuarios WHERE CorreoElectronico = @CorreoElectronico OR Cedula = @Cedula');

    if (usuarioExistente.recordset.length > 0) {
      console.log('⚠️ El usuario ya existe:', usuarioExistente.recordset);
      res.status(400).json({ mensaje: 'El usuario ya existe con ese correo o cédula.' });
      return;
    }

    // Encriptar la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(clave, 10);

    // Insertar usuario con conversión a VARBINARY(MAX)
    const result = await pool
      .request()
      .input('Clave', sql.VarBinary(sql.MAX), Buffer.from(hashedPassword, 'utf8'))
      .input('CorreoElectronico', sql.VarChar, correoElectronico)
      .input('Nombres', sql.VarChar, nombres)
      .input('Apellidos', sql.VarChar, apellidos)
      .input('Telefono', sql.VarChar, telefono)
      .input('Cedula', sql.VarChar, cedula)
      .input('Estatus', sql.VarChar, 'Pendiente')
      .query(
        `INSERT INTO RNP_Usuarios (Clave, CorreoElectronico, Nombres, Apellidos, Telefono, Cedula, Estatus, FechaSolicitud)
         OUTPUT INSERTED.UsuarioID
         VALUES (@Clave, @CorreoElectronico, @Nombres, @Apellidos, @Telefono, @Cedula, @Estatus, GETDATE())`,
      );

    const insertedId: number | null = result.recordset?.[0]?.UsuarioID ?? null;

    console.log('✅ Usuario registrado correctamente:', correoElectronico);

    // Registrar auditoría
    await registrarAuditoria(
      insertedId,
      'SOLICITAR_ACCESO',
      'Gestión de Usuarios',
      `Solicitud de acceso para ${correoElectronico}`,
      req.ip,
      correoElectronico,
    );

    res.status(201).json({ mensaje: 'Solicitud de acceso registrada correctamente.' });
  } catch (error) {
    console.error('❌ Error al solicitar acceso:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ mensaje: 'Error en el servidor.', error: errorMessage });
  }
};
