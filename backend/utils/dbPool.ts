/**
 * Ministerio de Administracion Publica (MAP)
 * Portal para Informacion Complementaria de Nominas Publicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sanchez Perez
 * Coordinador: Lucas Almonte
 */
import { logger } from '../helpers/logger';
import { connectConsulta } from '../config/connectConsulta';

let dbPoolPromise: Promise<any> | null = null;

export function getDbPool(): Promise<any> {
  if (!dbPoolPromise) {
    dbPoolPromise = connectConsulta()
      .then((pool: any) => {
        logger.info('Conectado a SQL Server - Pool CONSULTA');
        return pool;
      })
      .catch((error: any) => {
        logger.error('Error al conectar a SQL Server CONSULTA:', error);
        dbPoolPromise = null;
        throw error;
      });
  }

  return dbPoolPromise;
}

export default getDbPool;
