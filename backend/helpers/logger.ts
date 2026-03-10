/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/helpers/logger.ts
/**
 * Logger basado en Winston.  Si no deseas dependencias nuevas,
 * cambia las llamadas a console.log/error y elimina Winston.
 */
import { createLogger, transports, format } from 'winston';

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack }) =>
      stack ? `[${timestamp}] ${level}: ${message}\n${stack}` : `[${timestamp}] ${level}: ${message}`,
    ),
  ),
  transports: [
    new transports.Console(),
    // También puedes guardar en archivo:
    // new transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

/* Ejemplos de uso:
   logger.info("Servidor iniciado");
   logger.error("Fallo al conectar a BD", err);
*/
