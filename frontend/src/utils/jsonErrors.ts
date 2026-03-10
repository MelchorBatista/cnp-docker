/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// utils/jsonErrors.ts

/**
 * Traduce al español los mensajes de error más comunes de JSON.parse.
 *
 * @param mensajeOriginal El message de la excepción lanzada por JSON.parse
 * @returns Un mensaje en español, ya sea específico o un fallback genérico
 */
export function traducirErrorJSON(mensajeOriginal: string): string {
  /** 1. Traducciones específicas ----------------------------------- */
  const reglas: { regex: RegExp; reemplazo: string }[] = [
    {
      regex: /Unexpected number in JSON at position (\d+)/,
      reemplazo: "Número inesperado en JSON en la posición $1",
    },
    {
      regex: /Unexpected token '(.*)' in JSON at position (\d+)/,
      reemplazo: "Token inesperado '$1' en JSON en la posición $2",
    },
    {
      regex: /Unexpected string in JSON at position (\d+)/,
      reemplazo: "Cadena inesperada en JSON en la posición $1",
    },
    {
      regex:
        /Expected ',' or '}' after property value in JSON at position (\d+)/,
      reemplazo:
        "Se esperaba una ',' o '}' después del valor de la propiedad en la posición $1",
    },
    {
      regex: /Unexpected end of JSON input at position (\d+)/,
      reemplazo: "Fin inesperado de la entrada JSON en la posición $1",
    },
    {
      regex: /Unexpected end of JSON input/,
      reemplazo: "Fin inesperado de la entrada JSON",
    },
    {
      regex: /Trailing comma in JSON at position (\d+)/,
      reemplazo: "Coma sobrante en JSON en la posición $1",
    },
    {
      regex: /Unexpected token in JSON at position (\d+)/,
      reemplazo: "Token inesperado en JSON en la posición $1",
    },
    // ⬆ Añade aquí nuevos patrones según vayan surgiendo
  ];

  for (const { regex, reemplazo } of reglas) {
    if (regex.test(mensajeOriginal)) {
      mensajeOriginal = mensajeOriginal.replace(regex, reemplazo);
      break; // ya lo traducimos; salimos del bucle
    }
  }

  /** 2. Traducción de “line X column Y” ---------------------------- */
  mensajeOriginal = mensajeOriginal.replace(
    /\(line (\d+) column (\d+)\)/,
    "(línea $1, columna $2)"
  );

  /** 3. Fallback genérico ----------------------------------------- */
  if (!/posición|línea/.test(mensajeOriginal)) {
    const posMatch = /position (\d+)/.exec(mensajeOriginal);
    const posicion = posMatch ? posMatch[1] : "desconocida";
    mensajeOriginal = `Error de sintaxis en JSON en la posición ${posicion}`;
  }

  return mensajeOriginal;
}
