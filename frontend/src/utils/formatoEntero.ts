/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// utils/numberFormatter.ts

/**
 * Devuelve un número entero formateado en el formato "###,###,###".
 * El separador de miles será la coma, sin decimales.
 *
 * @param num - El número que se desea formatear.
 * @returns El número formateado como cadena de texto.
 */
export function formatoEntero(num: number): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  });
}
