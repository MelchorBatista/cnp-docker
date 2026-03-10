/**
 * Descripcion: Controlador que expone el cifrado de datos de validacion para el frontend.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { RequestHandler } from 'express';
import { getEncryptedValidationData } from '../services/validationDataService';
import { registrarAuditoria } from '../middleware/audit';

const oneUseKeys = new Map<string, number>();
const TTL_MS = 5 * 60 * 1000;

/**
 * Cifra la informacion de validacion empleando una llave de uso unico.
 * @param req Contiene el uuidKey binario enviado por el cliente autorizado.
 * @param res Devuelve el payload cifrado o errores de validacion/autorizacion.
 * @returns Promise<void>
 */
export const encrypt: RequestHandler = async (req, res) => {
  const direccionIP = (req as any).direccionIP ?? req.ip;
  const userId = (req.user as any)?.id as number | undefined;
  const userEmail = (req.user as any)?.email ?? '';

  try {
    const uuidKey = req.body as unknown as Buffer;

    if (!Buffer.isBuffer(uuidKey) || uuidKey.length !== 32) {
      await registrarAuditoria(
        userId ?? null,
        'VALIDATION_ENCRYPT_FALLIDO',
        'Validación de Datos',
        'uuidKey inválida (32 bytes requeridos).',
        direccionIP,
        userEmail,
      );
      res.status(400).json({ error: 'uuidKey inválida (32 bytes requeridos).' });
      return;
    }

    if (userId == null) {
      await registrarAuditoria(
        null,
        'VALIDATION_ENCRYPT_FALLIDO',
        'Validación de Datos',
        'Intento de cifrado sin autorización.',
        direccionIP,
        '',
      );
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const keyHex = uuidKey.toString('hex');
    const usedBy = oneUseKeys.get(keyHex);

    if (usedBy !== undefined && usedBy !== userId) {
      await registrarAuditoria(
        userId,
        'VALIDATION_ENCRYPT_FALLIDO',
        'Validación de Datos',
        'uuidKey ya utilizada por otro usuario.',
        direccionIP,
        userEmail,
      );
      res.status(410).json({ error: 'uuidKey ya utilizada.' });
      return;
    }

    oneUseKeys.set(keyHex, userId);
    setTimeout(() => oneUseKeys.delete(keyHex), TTL_MS);

    const { iv, cipher, tag } = await getEncryptedValidationData(uuidKey);

    await registrarAuditoria(
      userId,
      'VALIDATION_ENCRYPT',
      'Validación de Datos',
      'Cifrado exitoso de datos de validación.',
      direccionIP,
      userEmail,
    );

    res.json({
      iv: iv.toString('base64url'),
      cipher: cipher.toString('base64url'),
      tag: tag.toString('base64url'),
    });
  } catch (err) {
    console.error('❌ validationEncryptController:', err);

    await registrarAuditoria(
      userId ?? null,
      'VALIDATION_ENCRYPT_FALLIDO',
      'Validación de Datos',
      `Error interno al cifrar datos: ${(err as Error)?.message ?? String(err)}`,
      direccionIP,
      userEmail,
    );

    res.status(500).json({ error: 'Error interno al cifrar datos.' });
  }
};
