// controllers/userController.ts

/**
 * Descripcion: Controlador que administra registros, confirmaciones y gestion de usuarios.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { Request, Response } from 'express';
import { connectRecepcion, sql } from '../config/connectRecepcion';
import { registrarAuditoria } from '../middleware/audit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Extendemos Request para incluir propiedades de autenticación y trazabilidad
interface CustomRequest extends Request {
  direccionIP?: string;
  usuarioID?: string;
  usuarioCorreo?: string;
}

interface SolicitarAccesoBody {
  nombres: string;
  apellidos: string;
  correoElectronico: string;
  telefono: string;
  cedula: string;
  clave: string;
  EMPRESA?: string; // NUEVO
  SISTEMA?: string; // NUEVO
}

interface ConfirmarCorreoQuery {
  token?: string;
  correo?: string;
}

/**
 * Registra solicitudes de acceso al portal y envia correo de confirmacion.
 * @param req Contiene los datos personales enviados desde el formulario.
 * @param res Devuelve el resultado del registro o los errores detectados.
 * @returns Promise<void>
 */
export const solicitarAcceso = async (req: CustomRequest, res: Response): Promise<void> => {
  const {
    nombres,
    apellidos,
    correoElectronico,
    telefono,
    cedula,
    clave,
    EMPRESA, // NUEVO
    SISTEMA, // NUEVO
  } = req.body as SolicitarAccesoBody;

  try {
    console.log('📌 Recibida solicitud de Usuario:', req.body);

    const pool = await connectRecepcion();

    // Verificar si el usuario ya existe
    const usuarioExistente = await pool
      .request()
      .input('CorreoElectronico', sql.VarChar, correoElectronico)
      .input('Cedula', sql.VarChar, cedula)
      .query('SELECT UsuarioID FROM RNP_Usuarios WHERE CorreoElectronico = @CorreoElectronico OR Cedula = @Cedula');

    if (usuarioExistente.recordset.length > 0) {
      console.log('⚠️ El usuario ya existe:', usuarioExistente.recordset);

      await registrarAuditoria(
        usuarioExistente.recordset[0].UsuarioID, // UsuarioID
        'SOLICITAR_ACCESO_FALLIDO', // TipoAccion
        'Gestión de Usuarios', // Módulo
        `Intento de solicitud de Usuario duplicado para ${correoElectronico}`, // Detalles
        req.direccionIP, // Dirección IP (capturada por el middleware)
        correoElectronico, // Correo electrónico
      );

      res.status(400).json({ mensaje: 'El usuario ya existe con ese correo o cédula.' });
      return;
    }

    // Encriptar la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(clave, 10);

    // Generar Código Temporal para el correo
    const codigoTemporalCorreo = crypto.randomBytes(20).toString('hex');
    console.log('Código temporal generado:', codigoTemporalCorreo);

    // Insertar usuario con estado "Pendiente"
    const nuevoUsuario = await pool
      .request()
      .input('Clave', sql.VarBinary, Buffer.from(hashedPassword))
      .input('CorreoElectronico', sql.VarChar, correoElectronico)
      .input('Nombres', sql.VarChar, nombres)
      .input('Apellidos', sql.VarChar, apellidos)
      .input('Telefono', sql.VarChar, telefono)
      .input('Cedula', sql.VarChar, cedula)
      .input('Estatus', sql.VarChar, 'Pendiente')
      .input('CodigoTemporalCorreo', sql.VarChar(100), codigoTemporalCorreo)
      .input('EMPRESA', sql.VarChar(80), EMPRESA ?? null) // NUEVO
      .input('SISTEMA', sql.VarChar(80), SISTEMA ?? null) // NUEVO
      .query(
        `INSERT INTO RNP_Usuarios 
         (Clave, CorreoElectronico, Nombres, Apellidos, Telefono, Cedula, Estatus, FechaSolicitud, CodigoTemporalCorreo, EMPRESA, SISTEMA) -- NUEVO
         OUTPUT INSERTED.UsuarioID
         VALUES (@Clave, @CorreoElectronico, @Nombres, @Apellidos, @Telefono, @Cedula, @Estatus, GETDATE(), @CodigoTemporalCorreo, @EMPRESA, @SISTEMA)`, // NUEVO
      );

    const usuarioID = nuevoUsuario.recordset[0].UsuarioID;
    console.log('✅ Usuario registrado correctamente:', correoElectronico);

    // Configurar el transporte de correo
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST as string,
      port: parseInt(process.env.SMTP_PORT as string, 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER as string,
        pass: process.env.SMTP_PASS as string,
      },
    });

    // Construcción del enlace de confirmación
    const confirmationLink = `${
      process.env.BACKEND_URL || 'http://localhost:3000'
    }/api/usuarios/confirmar-correo?token=${codigoTemporalCorreo}&correo=${encodeURIComponent(correoElectronico)}`;

    const mailOptions = {
      from: `"Recepción Nóminas" <${process.env.SMTP_USER}>`,
      to: correoElectronico,
      subject: 'Confirma tu correo electrónico',
      html: `
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8" />
            <title>Recepción de Nóminas Públicas</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
            <div style="max-width:600px; margin:20px auto; background-color:#ffffff; border:1px solid #dddddd; border-radius:5px; overflow:hidden;">
              <!-- Header -->
              <div style="background-color:#003876; padding:20px;">
                <div style="display:flex; align-items:center; justify-content:center;">
                  <img src="https://uxkit.digital.gob.do/images/gob-icon.svg" alt="Logo" style="height:39px; width:auto; margin-right:10px; max-width:100%;" />
                  <div style="display:flex; flex-direction:column; align-items:flex-start;">
                    <h1 style="color:#ffffff; margin:0; font-size:24px;">Ministerio de Administración Pública</h1>
                    <p style="color:#ffffff; margin:0; font-size:12px;">Recepción de Nóminas Públicas</p>
                  </div>
                </div>
              </div>
              <!-- Cuerpo del correo -->
              <div style="padding:20px;">
                <p style="font-size:16px; color:#333333;">Hola ${nombres.toUpperCase()} ${apellidos.toUpperCase()},</p>
                <p style="font-size:16px; color:#333333;">
                  Recibe este correo porque ha solicitado acceso al portal para <b>RECEPCIÓN DE NÓMINAS PÚBLICAS.</b>
                </p>
                <p style="font-size:16px; color:#333333;">
                  Para completar su registro, por favor confirme su dirección de correo electrónico.
                </p>
                <p style="font-size:16px; color:#333333;">
                  Luego de confirmar su correo electrónico, un representante le estará llamando al número de teléfono que registró en el formulario para confirmar sus datos.
                </p>
                <div style="text-align:center; margin:30px 0;">
                  <a href="${confirmationLink}" style="background-color:#003876; color:#ffffff; padding:15px 25px; text-decoration:none; font-size:16px; border-radius:5px;">
                    <b>CONFIRMAR CORREO</b>
                  </a>
                </div>
                <p style="font-size:14px; color:#333333;">
                  Si el botón no funciona, copie y pege el siguiente enlace en su navegador:
                </p>
                <p style="font-size:14px; color:#003876; word-break:break-all;">
                  ${confirmationLink}
                </p>
                <p style="font-size:14px; color:#333333;">
                  Si no solicitó registro en nuestro portal, por favor ignore este correo.
                </p>
              </div>
              <!-- Footer -->
              <div style="background-color:#f4f4f4; padding:10px; text-align:center; font-size:12px; color:#777777; border-top:1px solid #dddddd;">
                <p>Ministerio de Administración Pública - Todos los derechos reservados</p>
                <p>Para cualquier consulta, contáctanos a: soporte@map.gob.do</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    // Enviar correo de confirmación
    await transporter.sendMail(mailOptions);
    console.log('📧 Correo de confirmación enviado a:', correoElectronico);

    // Registrar en la auditoría el acceso exitoso
    await registrarAuditoria(
      usuarioID, // UsuarioID
      'SOLICITAR_ACCESO', // TipoAccion
      'Gestión de Usuarios', // Módulo
      `Solicitud de Usuario para ${correoElectronico}`, // Detalles
      req.direccionIP, // Dirección IP
      correoElectronico, // Correo electrónico
    );

    res.status(201).json({
      mensaje: 'Solicitud de Usuario registrada. Revisa tu correo para confirmar tu cuenta.',
    });
  } catch (error) {
    console.error('❌ Error al solicitar acceso:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ mensaje: 'Error en el servidor.', error: errorMessage });
  }
};

/**
 * Confirma la direccion de correo mediante el token enviado al solicitante.
 * @param req Incluye token y correo a validar.
 * @param res Indica si la confirmacion se realizo o el motivo del rechazo.
 * @returns Promise<void>
 */
export const confirmarCorreo = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { token, correo } = req.query as ConfirmarCorreoQuery;
    if (!token || !correo) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirmacionCorreo`);
      return;
    }

    const pool = await connectRecepcion();

    // Buscar el usuario con el correo y el código de confirmación
    const usuarioQuery = await pool
      .request()
      .input('CorreoElectronico', sql.VarChar, correo)
      .input('CodigoTemporalCorreo', sql.VarChar, token)
      .query(
        'SELECT UsuarioID FROM RNP_Usuarios WHERE CorreoElectronico = @CorreoElectronico AND CodigoTemporalCorreo = @CodigoTemporalCorreo',
      );

    if (usuarioQuery.recordset.length === 0) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirmacionCorreo`);
      return;
    }

    const usuarioID = usuarioQuery.recordset[0].UsuarioID;

    // Actualizar el estatus del usuario a "Confirmar" y limpiar el Código de Confirmación
    await pool
      .request()
      .input('UsuarioID', sql.Int, usuarioID)
      .query(
        "UPDATE RNP_Usuarios SET Estatus = 'Confirmar', CodigoTemporalCorreo = '<<USADO>>' WHERE UsuarioID = @UsuarioID",
      );

    // Registrar el evento de confirmación en la auditoría
    await registrarAuditoria(
      usuarioID,
      'CONFIRMACION_CORREO',
      'Gestión de Usuarios',
      `Confirmación de correo para ${correo}. El usuario tiene estatus "Confirmar".`,
      req.direccionIP,
      correo,
    );

    // Redirigir al usuario al componente de confirmación en el frontend
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirmacionCorreo`);
  } catch (error) {
    console.error('❌ Error en confirmación de correo:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirmacionCorreo`);
  }
};

/**
 * Obtiene el listado de usuarios para la consola administrativa.
 * @param req Request HTTP estandar sin parametros especiales.
 * @param res Devuelve la coleccion de usuarios o un mensaje de error.
 * @returns Promise<void>
 */
export const getUsuarios = async (req: Request, res: Response): Promise<void> => {
  console.log('Ejecutando getUsuarios'); // <-- Depuración
  try {
    const pool = await connectRecepcion();
    const result = await pool.request().query('SELECT * FROM RNP_Usuarios');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

/**
 * Actualiza datos de usuarios existentes segun los permisos del administrador.
 * @param req Contiene identificador del usuario y los campos a modificar.
 * @param res Confirma el cambio realizado o informa inconsistencias.
 * @returns Promise<void>
 */
export const actualizarUsuario = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log('Iniciando actualización para UsuarioID:', id);

    const usuarioLogueadoId = (req as any).user?.id ?? null;
    const usuarioLogueadoCorreo = (req as any).user?.email ?? 'desconocido';

    const {
      TipoUsuario,
      Estatus,
      RazonBloqueo,
      ConfirmacionCedula,
      ConfirmacionCorreo,
      ConfirmacionTelefono,
      Nombres,
      Apellidos,
      Cedula,
      Telefono,
      CorreoElectronico, // Correo del usuario que se modificará (para auditoría)
      EMPRESA, // NUEVO
      SISTEMA, // NUEVO
    } = req.body;

    const pool = await connectRecepcion();
    console.log('Conexión a la base de datos establecida.');

    // Actualizamos los datos del usuario
    const updateResult = await pool
      .request()
      .input('UsuarioID', sql.Int, id)
      .input('TipoUsuario', sql.VarChar, TipoUsuario)
      .input('Estatus', sql.VarChar, Estatus)
      .input('RazonBloqueo', sql.VarChar, RazonBloqueo)
      .input('ConfirmacionCedula', sql.Bit, ConfirmacionCedula)
      .input('ConfirmacionCorreo', sql.Bit, ConfirmacionCorreo)
      .input('ConfirmacionTelefono', sql.Bit, ConfirmacionTelefono)
      .input('Nombres', sql.VarChar, Nombres)
      .input('Apellidos', sql.VarChar, Apellidos)
      .input('Cedula', sql.VarChar, Cedula)
      .input('Telefono', sql.VarChar, Telefono)
      .input('EMPRESA', sql.VarChar(80), EMPRESA ?? null) // NUEVO
      .input('SISTEMA', sql.VarChar(80), SISTEMA ?? null) // NUEVO
      .query(`
        UPDATE RNP_Usuarios
        SET 
          TipoUsuario = @TipoUsuario,
          Estatus = @Estatus,
          RazonBloqueo = @RazonBloqueo,
          ConfirmacionCedula = @ConfirmacionCedula,
          ConfirmacionCorreo = @ConfirmacionCorreo,
          ConfirmacionTelefono = @ConfirmacionTelefono,
          Nombres = @Nombres,
          Apellidos = @Apellidos,
          Cedula = @Cedula,
          Telefono = @Telefono,
          EMPRESA = @EMPRESA,   -- NUEVO
          SISTEMA = @SISTEMA    -- NUEVO
        WHERE UsuarioID = @UsuarioID
      `);

    console.log('Consulta UPDATE ejecutada:', updateResult);

    if (usuarioLogueadoId === null) {
      console.error('No se encontró un usuario logueado válido para la auditoría.');
      res.status(401).json({ mensaje: 'No autorizado para registrar auditoría' });
      return;
    }

    const detalles = `El usuario ${usuarioLogueadoCorreo} actualizó los datos del usuario ${CorreoElectronico}`;
    console.log('Registrando auditoría:', detalles);

    await registrarAuditoria(
      usuarioLogueadoId, // ID numérico del usuario logueado
      'ACTUALIZAR_USUARIO', // Tipo de acción
      'Gestión de Usuarios', // Módulo
      detalles, // Detalles con ambos correos
      req.ip, // Dirección IP
      CorreoElectronico, // Correo del usuario modificado
    );

    console.log('Auditoría registrada correctamente para UsuarioID:', id);
    console.log('Datos actualizados correctamente para el usuario:', id);

    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error al actualizar usuario' });
  }
};
