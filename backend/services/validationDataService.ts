// rnp/backend/services/validationDataService.ts

/**
 * Este módulo gestiona la caché de datos de validación.
 * Se utiliza una variable en memoria para almacenar el objeto JSON de validación.
 */

import { encrypt } from '../utils/aesGcm'; // ← NUEVO
import { getValidationData } from '../config/connectValidacion';

let validationCache: any = null;
let cacheUpdatedAt = 0;
let refreshInFlight: Promise<any> | null = null;

const VALIDATION_CACHE_TTL_MS = Number(process.env.VALIDATION_CACHE_TTL_MS || 300000);

/**
 * Determina si la caché actual debe refrescarse.
 * @returns true cuando no hay datos en memoria o cuando excede el TTL configurado.
 */
function shouldRefreshCache(): boolean {
  if (!validationCache) return true;
  if (VALIDATION_CACHE_TTL_MS <= 0) return false;
  return Date.now() - cacheUpdatedAt > VALIDATION_CACHE_TTL_MS;
}

/**
 * Guarda los datos de validación en la caché.
 * @param data Objeto JSON de validación a almacenar.
 */
export function setCachedValidationData(data: any): void {
  validationCache = data;
  cacheUpdatedAt = Date.now();
}

/**
 * Retorna los datos de validación almacenados en la caché.
 * @returns Objeto JSON de validación.
 * @throws Error si no hay datos almacenados en caché.
 */
export function loadValidationDataFromCache(): any {
  if (!validationCache) {
    throw new Error('No hay datos de validación en caché.');
  }
  return validationCache;
}

/**
 * Garantiza que exista una caché de validación vigente.
 * Si está vacía o vencida, la recarga desde base de datos.
 * @param forceRefresh Cuando es true, fuerza recarga aun con caché vigente.
 * @returns Catálogos de validación listos para uso.
 */
export async function loadValidationData(forceRefresh = false): Promise<any> {
  if (!forceRefresh && !shouldRefreshCache()) {
    return validationCache;
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const data = await getValidationData();
    setCachedValidationData(data);
    return data;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/**
 * Devuelve la versión cifrada del JSON de validación usando AES-256-GCM.
 * @param key Buffer de 32 bytes (clave simétrica generada en el frontend).
 * @returns Objeto { iv, cipher, tag } — todos Buffers.
 */
export async function getEncryptedValidationData(key: Buffer): Promise<{
  iv: Buffer;
  cipher: Buffer;
  tag: Buffer;
}> {
  if (key.length !== 32) {
    throw new Error('La clave debe tener 32 bytes (AES-256).');
  }

  // 1. Obtiene el JSON de validación desde caché vigente o recarga.
  const data = await loadValidationData();

  // 2. Serializa a Buffer UTF-8.
  const payload = Buffer.from(JSON.stringify(data), 'utf8');

  // 3. Cifra con AES-256-GCM (función helper en utils/aesGcm.ts).
  return encrypt(payload, key);
}
