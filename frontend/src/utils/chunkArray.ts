/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/utils/chunkArray.ts
/**
 * Función para dividir un arreglo en fragmentos más pequeños.
 * @param array - Arreglo a fragmentar.
 * @param chunkSize - Tamaño de cada fragmento.
 * @returns Un arreglo de fragmentos.
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}
