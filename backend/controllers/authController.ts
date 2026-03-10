/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/controllers/authController.ts

/**
 * Descripcion: Controlador encargado de autenticar usuarios y administrar credenciales.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectRecepcion } from '../config/connectRecepcion';
import { sql } from '../config/connectRecepcion';
import { registrarAuditoria } from '../middleware/audit';

const JWT_SECRET = process.env.JWT_SECRET as string;

/** Helpers */
const norm = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const normLower = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

/**
 * Consulta el estatus actual de un usuario para guiar los flujos de acceso.
 * @param req Request HTTP con el username recibido por query o body.
 * @param res Response HTTP que indica el estatus encontrado o un error.
 * @returns Promise<void>
 */
export const getUserStatus = async (req: Request, res: Response): Promise<void> => {
  const raw =
    (req.method === 'GET' ? (req.query.username as string | undefined) : (req.body?.username as string | undefined)) ??
    '';

  const username = norm(raw).toString().toLowerCase();

  if (!username) {
    res.status(400).json({ error: 'username es requerido' });
    return;
  }

  try {
    const pool = await connectRecepcion();

    const result = await pool
      .request()
      .input('username', sql.VarChar, username)
      .query(`SELECT Estatus FROM RNP_Usuarios WHERE CorreoElectronico = @username`);

    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const { Estatus } = result.recordset[0] as { Estatus: string };
    res.json({ Estatus });
  } catch (err) {
    console.error('getUserStatus error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Valida credenciales y emite el token JWT consumido por el frontend.
 * @param req Contiene username y password enviados por el cliente.
 * @param res Devuelve el resultado del login junto al token o error asociado.
 * @returns Promise<void>
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body ?? {};
  const email = norm(username).toString().toLowerCase();

  if (!email || !password) {
    await registrarAuditoria(
      null,
      'Intento de login fallido',
      'Autenticación',
      'Faltan credenciales',
      req.ip,
      email || '',
    );
    res.status(400).json({ error: 'Faltan credenciales' });
    return;
  }

  try {
    const pool = await connectRecepcion();

    const result = await pool
      .request()
      .input('username', sql.VarChar, email)
      .query(
        `SELECT TOP 1 UsuarioID, CorreoElectronico, Clave, TipoUsuario, Estatus
         FROM RNP_Usuarios
         WHERE CorreoElectronico = @username`,
      );

    if (result.recordset.length === 0) {
      await registrarAuditoria(
        null,
        'Intento de login fallido',
        'Autenticación',
        'Usuario no encontrado',
        req.ip,
        email,
      );
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }

    type DBUser = {
      UsuarioID: number;
      CorreoElectronico: string;
      Clave: string | Buffer | null;
      TipoUsuario: string;
      Estatus: string;
    };

    const user = result.recordset[0] as DBUser;

    const status = normLower(user.Estatus);
    if (status !== 'activado') {
      await registrarAuditoria(
        user.UsuarioID || null,
        'Intento de login bloqueado por estatus',
        'Autenticación',
        `Estatus=${user.Estatus}`,
        req.ip,
        email,
      );
      res.status(423).json({
        error: 'Usuario no habilitado',
        Estatus: user.Estatus,
        code: 'USER_STATUS',
      });
      return;
    }

    const hash: string =
      typeof user.Clave === 'string' ? user.Clave : Buffer.isBuffer(user.Clave) ? user.Clave.toString('utf8') : '';

    if (!hash) {
      await registrarAuditoria(
        user.UsuarioID || null,
        'Intento de login fallido',
        'Autenticación',
        'Credenciales incorrectas',
        req.ip,
        email,
      );
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    const validPassword = await bcrypt.compare(password, hash);
    if (!validPassword) {
      await registrarAuditoria(
        user.UsuarioID || null,
        'Intento de login fallido',
        'Autenticación',
        'Credenciales incorrectas',
        req.ip,
        email,
      );
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    await registrarAuditoria(
      user.UsuarioID || null,
      'Inicio de sesión',
      'Autenticación',
      'Login exitoso',
      req.ip,
      email,
    );

    const token = jwt.sign(
      {
        id: user.UsuarioID,
        email: user.CorreoElectronico,
        role: user.TipoUsuario,
      },
      JWT_SECRET,
      { expiresIn: '12h' },
    );

    const { Clave, ...userWithoutClave } = user;

    res.json({
      message: 'Login exitoso',
      user: userWithoutClave,
      token,
    });
  } catch (error) {
    console.error('Error en loginUser:', error);
    await registrarAuditoria(
      null,
      'Intento de login fallido',
      'Autenticación',
      'Error interno del servidor',
      req.ip,
      email,
    );
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Permite a usuarios en estatus de reingreso actualizar su clave y reactivar la cuenta.
 * @param req Incluye username y la nueva contrasena solicitada.
 * @param res Comunica si la clave fue actualizada o el motivo del rechazo.
 * @returns Promise<void>
 */
export const changePasswordReingreso = async (req: Request, res: Response): Promise<void> => {
  const { username, newPassword } = req.body ?? {};
  const email = norm(username).toString().toLowerCase();

  if (!email || !newPassword) {
    res.status(400).json({ error: 'username y newPassword son requeridos' });
    return;
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'La clave debe tener al menos 8 caracteres' });
    return;
  }

  try {
    const pool = await connectRecepcion();

    const lookup = await pool
      .request()
      .input('username', sql.VarChar, email)
      .query(
        `SELECT TOP 1 UsuarioID, Estatus
         FROM RNP_Usuarios
         WHERE CorreoElectronico = @username`,
      );

    if (lookup.recordset.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const row = lookup.recordset[0] as { UsuarioID: number; Estatus: string };
    const currentStatus = normLower(row.Estatus);

    if (currentStatus !== 'reingreso') {
      res.status(409).json({ error: 'El estatus actual no permite cambio de clave' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await pool
      .request()
      .input('username', sql.VarChar, email)
      .input('hash', sql.VarBinary(sql.MAX), Buffer.from(hash, 'utf8'))
      .query(
        `UPDATE RNP_Usuarios
           SET Clave = @hash,
               Estatus = 'Activado'
         WHERE CorreoElectronico = @username`,
      );

    await registrarAuditoria(
      row.UsuarioID || null,
      'Cambio de clave por Reingreso',
      'Autenticación',
      'Clave actualizada y estatus Activado',
      req.ip,
      email,
    );

    res.json({
      message: 'Clave actualizada correctamente. Ya puede iniciar sesión.',
    });
  } catch (err) {
    console.error('changePasswordReingreso error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
