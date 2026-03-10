/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
import crypto from 'crypto';

/**
 * Cifra un Buffer con AES-256-GCM y devuelve iv, cipher y tag.
 * @param payload Buffer con los datos en claro
 * @param key     Buffer de 32 bytes (AES-256)
 */
export function encrypt(payload: Buffer, key: Buffer): { iv: Buffer; cipher: Buffer; tag: Buffer } {
  if (key.length !== 32) {
    throw new Error('La clave debe tener 32 bytes (AES-256).');
  }
  const iv = crypto.randomBytes(12); // 96 bit nonce recomendado para GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();

  return { iv, cipher: encrypted, tag };
}
