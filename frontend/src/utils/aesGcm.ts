/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/utils/aesGcm.ts
/* Utilidades AES-256-GCM usando Web Crypto API
   ---------------------------------------------------------
   Todas las funciones trabajan con Uint8Array y ArrayBuffer
   para evitar conversiones innecesarias. Se usa Base64URL
   solo en la capa servicio API.
*/

// Aseguramos el acceso a la Web Crypto API del entorno actual.
const subtle: SubtleCrypto | undefined = (globalThis as any).crypto?.subtle;

/** Convierte un Uint8Array a un ArrayBuffer "puro" (no SharedArrayBuffer). */
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  // Hacemos una copia para garantizar que el buffer resultante sea ArrayBuffer.
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

export async function importKey(rawKey: Uint8Array): Promise<CryptoKey> {
  if (!subtle) {
    throw new Error("Web Crypto API no disponible en este entorno.");
  }
  if (rawKey.length !== 32) {
    throw new Error("La clave debe tener 32 bytes (AES-256).");
  }

  const keyData: ArrayBuffer = toArrayBuffer(rawKey);

  return subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function decrypt(
  cipher: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array,
  keyRaw: Uint8Array
): Promise<Uint8Array> {
  if (!subtle) {
    throw new Error("Web Crypto API no disponible en este entorno.");
  }

  // AES-GCM espera el tag concatenado al ciphertext.
  const data = new Uint8Array(cipher.length + tag.length);
  data.set(cipher, 0);
  data.set(tag, cipher.length);

  const key = await importKey(keyRaw);

  const decrypted = await subtle.decrypt(
    {
      name: "AES-GCM",
      // Forzamos ArrayBuffer para evitar la unión ArrayBuffer | SharedArrayBuffer
      iv: toArrayBuffer(iv),
    },
    key,
    toArrayBuffer(data)
  );

  return new Uint8Array(decrypted);
}
