/**
 * Ministerio de Administracion Publica (MAP)
 * Portal para Informacion Complementaria de Nominas Publicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sanchez Perez
 * Coordinador: Lucas Almonte
 */
// backend/config/connectRecepcion.ts

import { obtenerConfiguracionRecepcion } from './configuracionBases';

interface CustomRequest {
  input: (name: string, type: any, value: any) => CustomRequest;
  query: (query: string) => Promise<{ recordset: any[] }>;
}

interface CustomConnectionPool {
  connected: boolean;
  connect: () => Promise<CustomConnectionPool>;
  close: () => Promise<void>;
  request: () => CustomRequest;
}

let poolRecepcion: CustomConnectionPool | undefined;
const configuracionRecepcion = obtenerConfiguracionRecepcion();
const sql = configuracionRecepcion.sql;

export const connectRecepcion = async (): Promise<CustomConnectionPool> => {
  try {
    if (poolRecepcion && poolRecepcion.connected) {
      return poolRecepcion;
    }

    poolRecepcion = new sql.ConnectionPool(configuracionRecepcion.configuracion as any) as any as CustomConnectionPool;
    await poolRecepcion.connect();

    console.log(
      `[RECEPCION] Conexion establecida. Servidor=${configuracionRecepcion.servidor} Base=${configuracionRecepcion.baseDatos} Auth=${configuracionRecepcion.modoAutenticacion}`,
    );
    return poolRecepcion;
  } catch (error) {
    console.error('[RECEPCION] Error al conectar:', error instanceof Error ? error.message : error);
    throw error;
  }
};

export const getPoolRecepcion = async (): Promise<CustomConnectionPool> => {
  if (poolRecepcion && poolRecepcion.connected) return poolRecepcion;
  return connectRecepcion();
};

export { sql };
